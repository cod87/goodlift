/**
 * Firebase Cloud Functions for GoodLift
 * 
 * This file contains scheduled functions for sending push notifications to users.
 */

const { setGlobalOptions } = require("firebase-functions/v2/options");
const { onSchedule } = require("firebase-functions/v2/scheduler");
const admin = require("firebase-admin");
const logger = require("firebase-functions/logger");

// Initialize Firebase Admin SDK
admin.initializeApp();

// For cost control, set the maximum number of containers that can be
// running at the same time
setGlobalOptions({ maxInstances: 10 });

// Configuration for notification assets and URLs
// These can be overridden with environment variables for different deployments
const NOTIFICATION_CONFIG = {
  icon: process.env.NOTIFICATION_ICON || "/goodlift/icons/goodlift-icon-192.png",
  badge: process.env.NOTIFICATION_BADGE || "/goodlift/icons/goodlift-icon-192.png",
  clickActionUrl: process.env.NOTIFICATION_CLICK_ACTION || "/goodlift/",
};

/**
 * Helper function to get today's workout info from user's active plan
 * @param {object} userData - User data from Firestore
 * @returns {string|null} Workout description or null
 */
const getTodaysWorkout = (userData) => {
  try {
    const { plans, planDays, activePlanId } = userData;
    
    if (!activePlanId || !plans || !planDays) {
      return null;
    }
    
    // Find active plan
    const activePlan = plans.find(p => p.id === activePlanId);
    if (!activePlan) {
      return null;
    }
    
    // Get today's day of week (0 = Sunday, 6 = Saturday)
    // Note: Uses server timezone (America/Chicago). All users receive notifications
    // based on the same day in Central time. For users in different timezones,
    // the workout day shown may be off by +/- 1 day near midnight.
    // Future enhancement: store user timezone in userData for accurate day calculation
    const today = new Date().getDay();
    
    // Find today's plan day
    const todaysPlanDay = planDays.find(pd => 
      pd.planId === activePlanId && pd.dayOfWeek === today
    );
    
    if (!todaysPlanDay) {
      return null;
    }
    
    // Format workout type
    const typeMap = {
      'strength': 'Strength Training',
      'hypertrophy': 'Hypertrophy',
      'cardio': 'Cardio',
      'active_recovery': 'Active Recovery',
      'rest': 'Rest Day'
    };
    
    const workoutType = typeMap[todaysPlanDay.type];
    if (!workoutType) {
      logger.warn(`Unknown workout type: ${todaysPlanDay.type}`);
      return 'Workout';  // Fallback to generic "Workout"
    }
    
    return workoutType;
  } catch (error) {
    logger.error('Error getting today\'s workout:', error);
    return null;
  }
};

/**
 * Helper function to check if user has wellness enabled
 * @param {object} userData - User data from Firestore
 * @returns {boolean} Whether wellness is enabled
 */
const isWellnessEnabled = (userData) => {
  // Check explicit wellness enabled flag first
  if (userData && userData.wellnessEnabled === true) {
    return true;
  }
  
  // Fallback: check if user has wellness preferences configured
  if (userData && userData.wellnessPreferences && 
      Object.keys(userData.wellnessPreferences).length > 0) {
    return true;
  }
  
  return false;
};

/**
 * Scheduled function to send daily workout reminder notifications
 * Runs every day at 8:00 AM Central Time (CST/CDT)
 * 
 * This function:
 * 1. Queries all users from Firestore
 * 2. Collects FCM tokens and user data
 * 3. Sends personalized push notifications including:
 *    - Today's scheduled workout (if user has an active plan)
 *    - Daily wellness task (if user has wellness enabled)
 * 4. Handles errors for invalid/expired tokens
 * 
 * To deploy: firebase deploy --only functions:sendDailyNotifications
 * To test: Use Firebase console to trigger manually or wait for scheduled time
 */
exports.sendDailyNotifications = onSchedule({
  schedule: "0 8 * * *", // Every day at 8:00 AM Central Time
  timeZone: "America/Chicago", // Automatically handles CST/CDT transitions
  retryConfig: {
    retryCount: 3,
    maxRetryDuration: "600s",
  },
  memory: "256MiB",
  timeoutSeconds: 540,
}, async (event) => {
  logger.info("═══════════════════════════════════════════════════════");
  logger.info("Starting daily notification job...");
  logger.info("Scheduled time:", event.scheduleTime);
  logger.info("═══════════════════════════════════════════════════════");

  try {
    // Step 1: Query all user documents from Firestore
    logger.info("Step 1: Querying all users from Firestore...");
    const db = admin.firestore();
    const usersSnapshot = await db.collection("users").get();
    
    logger.info(`Found ${usersSnapshot.size} user documents`);
    
    if (usersSnapshot.empty) {
      logger.warn("No users found in Firestore");
      logger.info("Notification job completed (no users to notify)");
      return;
    }

    // Step 2: Collect FCM tokens and prepare personalized messages
    logger.info("Step 2: Collecting user data and preparing messages...");
    const messages = [];
    let usersWithTokens = 0;
    let usersWithoutTokens = 0;

    for (const userDoc of usersSnapshot.docs) {
      const userId = userDoc.id;
      
      try {
        // Get the userData subcollection document
        const userDataDoc = await db
          .collection("users")
          .doc(userId)
          .collection("data")
          .doc("userData")
          .get();
        
        if (userDataDoc.exists) {
          const userData = userDataDoc.data();
          const fcmToken = userData.fcmToken;
          
          if (fcmToken) {
            // Build personalized notification message
            let bodyText = "Good morning! ";
            const details = [];
            
            // Add today's workout if applicable
            const todaysWorkout = getTodaysWorkout(userData);
            if (todaysWorkout) {
              if (todaysWorkout === 'Rest Day') {
                details.push("Today is a rest day - focus on recovery");
              } else {
                details.push(`Today's workout: ${todaysWorkout}`);
              }
            }
            
            // Add wellness task if user has wellness enabled
            if (isWellnessEnabled(userData)) {
              details.push("Don't forget your daily wellness task");
            }
            
            // Construct final message
            if (details.length > 0) {
              bodyText += details.join(". ") + " ";
            }
            bodyText += "Let's make today great! 💪";
            
            messages.push({
              token: fcmToken,
              notification: {
                title: "Good Morning! ☀️",
                body: bodyText,
                icon: NOTIFICATION_CONFIG.icon,
                badge: NOTIFICATION_CONFIG.badge,
              },
              data: {
                type: "daily-reminder",
                timestamp: new Date().toISOString(),
                click_action: NOTIFICATION_CONFIG.clickActionUrl,
                hasWorkout: todaysWorkout ? "true" : "false",
                workoutType: todaysWorkout || "",
                hasWellness: isWellnessEnabled(userData) ? "true" : "false",
              },
              android: {
                priority: "high",
              },
              apns: {
                headers: {
                  "apns-priority": "10",
                },
              },
              webpush: {
                headers: {
                  Urgency: "high",
                },
              },
            });
            
            usersWithTokens++;
            logger.info(`User ${userId}: Prepared personalized notification`);
          } else {
            usersWithoutTokens++;
            logger.warn(`User ${userId}: No FCM token found`);
          }
        } else {
          usersWithoutTokens++;
          logger.warn(`User ${userId}: No userData document found`);
        }
      } catch (error) {
        logger.error(`Error reading user ${userId}:`, error);
        usersWithoutTokens++;
      }
    }

    logger.info("═══════════════════════════════════════════════════════");
    logger.info("Message preparation summary:");
    logger.info(`  Users with tokens: ${usersWithTokens}`);
    logger.info(`  Users without tokens: ${usersWithoutTokens}`);
    logger.info(`  Total messages prepared: ${messages.length}`);
    logger.info("═══════════════════════════════════════════════════════");

    if (messages.length === 0) {
      logger.warn("No messages to send - no valid tokens found");
      logger.info("Notification job completed (no valid tokens)");
      return;
    }

    // Step 3: Send notifications
    logger.info("═══════════════════════════════════════════════════════");
    logger.info("Step 3: Sending personalized notifications...");
    logger.info(`Sending to ${messages.length} device(s)...`);
    
    try {
      // Send all messages in batch (FCM supports up to 500 messages per batch)
      const batchSize = 500;
      let totalSuccess = 0;
      let totalFailure = 0;
      
      for (let i = 0; i < messages.length; i += batchSize) {
        const batch = messages.slice(i, i + batchSize);
        const response = await admin.messaging().sendEach(batch);
        
        totalSuccess += response.successCount;
        totalFailure += response.failureCount;
        
        // Log individual failures
        response.responses.forEach((resp, idx) => {
          if (!resp.success) {
            const token = batch[idx].token;
            const error = resp.error;
            
            logger.error(`Failed to send notification:`);
            logger.error(`  Error code: ${error.code}`);
            logger.error(`  Error message: ${error.message}`);
            
            if (
              error.code === "messaging/invalid-registration-token" ||
              error.code === "messaging/registration-token-not-registered"
            ) {
              logger.warn(`Invalid/expired token - should be removed from database`);
            }
          }
        });
      }

      logger.info("═══════════════════════════════════════════════════════");
      logger.info("Notification delivery results:");
      logger.info(`  Success count: ${totalSuccess}`);
      logger.info(`  Failure count: ${totalFailure}`);
      logger.info("═══════════════════════════════════════════════════════");

      logger.info("═══════════════════════════════════════════════════════");
      logger.info("✅ Daily notification job completed successfully!");
      logger.info("Summary:");
      logger.info(`  Total users: ${usersSnapshot.size}`);
      logger.info(`  Users with tokens: ${usersWithTokens}`);
      logger.info(`  Notifications sent: ${totalSuccess}`);
      logger.info(`  Notifications failed: ${totalFailure}`);
      logger.info("═══════════════════════════════════════════════════════");

    } catch (sendError) {
      logger.error("═══════════════════════════════════════════════════════");
      logger.error("❌ Error sending notifications:");
      logger.error("Error name:", sendError.name);
      logger.error("Error message:", sendError.message);
      logger.error("Error code:", sendError.code);
      logger.error("Full error:", sendError);
      logger.error("═══════════════════════════════════════════════════════");
      throw sendError;
    }

  } catch (error) {
    logger.error("═══════════════════════════════════════════════════════");
    logger.error("❌ Fatal error in daily notification job:");
    logger.error("Error name:", error.name);
    logger.error("Error message:", error.message);
    logger.error("Stack trace:", error.stack);
    logger.error("═══════════════════════════════════════════════════════");
    throw error; // Re-throw to trigger retry
  }
});

/**
 * Scheduled function to send evening wellness check-in notifications
 * Runs every day at 9:00 PM Central Time (CST/CDT)
 * 
 * This function:
 * 1. Queries all users with wellness enabled from Firestore
 * 2. Sends notifications asking users to mark wellness tasks as complete
 * 3. Notification links to app where users can mark completion (Yes/No)
 * 4. Handles errors for invalid/expired tokens
 * 
 * Note: FCM doesn't support interactive notification buttons that directly update data.
 * Users must click the notification to open the app and mark tasks complete there.
 * 
 * To deploy: firebase deploy --only functions:sendEveningNotifications
 * To test: Use Firebase console to trigger manually or wait for scheduled time
 */
exports.sendEveningNotifications = onSchedule({
  schedule: "0 21 * * *", // Every day at 9:00 PM Central Time
  timeZone: "America/Chicago", // Automatically handles CST/CDT transitions
  retryConfig: {
    retryCount: 3,
    maxRetryDuration: "600s",
  },
  memory: "256MiB",
  timeoutSeconds: 540,
}, async (event) => {
  logger.info("═══════════════════════════════════════════════════════");
  logger.info("Starting evening wellness check-in job...");
  logger.info("Scheduled time:", event.scheduleTime);
  logger.info("═══════════════════════════════════════════════════════");

  try {
    // Step 1: Query all user documents from Firestore
    logger.info("Step 1: Querying all users from Firestore...");
    const db = admin.firestore();
    const usersSnapshot = await db.collection("users").get();
    
    logger.info(`Found ${usersSnapshot.size} user documents`);
    
    if (usersSnapshot.empty) {
      logger.warn("No users found in Firestore");
      logger.info("Notification job completed (no users to notify)");
      return;
    }

    // Step 2: Collect users with wellness enabled and prepare messages
    logger.info("Step 2: Collecting users with wellness enabled...");
    const messages = [];
    let usersWithWellness = 0;
    let usersWithoutWellness = 0;

    for (const userDoc of usersSnapshot.docs) {
      const userId = userDoc.id;
      
      try {
        // Get the userData subcollection document
        const userDataDoc = await db
          .collection("users")
          .doc(userId)
          .collection("data")
          .doc("userData")
          .get();
        
        if (userDataDoc.exists) {
          const userData = userDataDoc.data();
          const fcmToken = userData.fcmToken;
          
          // Only send to users with wellness enabled
          if (fcmToken && isWellnessEnabled(userData)) {
            messages.push({
              token: fcmToken,
              notification: {
                title: "Evening Wellness Check-In 🌙",
                body: "Did you complete your wellness task today? Tap to mark it complete and track your progress! 🎯",
                icon: NOTIFICATION_CONFIG.icon,
                badge: NOTIFICATION_CONFIG.badge,
              },
              data: {
                type: "wellness-checkin",
                timestamp: new Date().toISOString(),
                click_action: NOTIFICATION_CONFIG.clickActionUrl + "#wellness",
                action: "mark-wellness-complete",
              },
              android: {
                priority: "high",
              },
              apns: {
                headers: {
                  "apns-priority": "10",
                },
              },
              webpush: {
                headers: {
                  Urgency: "high",
                },
                fcm_options: {
                  link: NOTIFICATION_CONFIG.clickActionUrl + "#wellness",
                },
              },
            });
            
            usersWithWellness++;
            logger.info(`User ${userId}: Prepared wellness check-in notification`);
          } else if (fcmToken) {
            usersWithoutWellness++;
            logger.info(`User ${userId}: Has token but wellness not enabled`);
          } else {
            usersWithoutWellness++;
            logger.warn(`User ${userId}: No FCM token found`);
          }
        } else {
          usersWithoutWellness++;
          logger.warn(`User ${userId}: No userData document found`);
        }
      } catch (error) {
        logger.error(`Error reading user ${userId}:`, error);
        usersWithoutWellness++;
      }
    }

    logger.info("═══════════════════════════════════════════════════════");
    logger.info("Message preparation summary:");
    logger.info(`  Users with wellness enabled: ${usersWithWellness}`);
    logger.info(`  Users without wellness: ${usersWithoutWellness}`);
    logger.info(`  Total messages prepared: ${messages.length}`);
    logger.info("═══════════════════════════════════════════════════════");

    if (messages.length === 0) {
      logger.warn("No messages to send - no users with wellness enabled");
      logger.info("Notification job completed (no wellness users)");
      return;
    }

    // Step 3: Send notifications
    logger.info("═══════════════════════════════════════════════════════");
    logger.info("Step 3: Sending wellness check-in notifications...");
    logger.info(`Sending to ${messages.length} device(s)...`);
    
    try {
      // Send all messages in batch (FCM supports up to 500 messages per batch)
      const batchSize = 500;
      let totalSuccess = 0;
      let totalFailure = 0;
      
      for (let i = 0; i < messages.length; i += batchSize) {
        const batch = messages.slice(i, i + batchSize);
        const response = await admin.messaging().sendEach(batch);
        
        totalSuccess += response.successCount;
        totalFailure += response.failureCount;
        
        // Log individual failures
        response.responses.forEach((resp, idx) => {
          if (!resp.success) {
            const token = batch[idx].token;
            const error = resp.error;
            
            logger.error(`Failed to send notification:`);
            logger.error(`  Error code: ${error.code}`);
            logger.error(`  Error message: ${error.message}`);
            
            if (
              error.code === "messaging/invalid-registration-token" ||
              error.code === "messaging/registration-token-not-registered"
            ) {
              logger.warn(`Invalid/expired token - should be removed from database`);
            }
          }
        });
      }

      logger.info("═══════════════════════════════════════════════════════");
      logger.info("Notification delivery results:");
      logger.info(`  Success count: ${totalSuccess}`);
      logger.info(`  Failure count: ${totalFailure}`);
      logger.info("═══════════════════════════════════════════════════════");

      logger.info("═══════════════════════════════════════════════════════");
      logger.info("✅ Evening wellness check-in job completed successfully!");
      logger.info("Summary:");
      logger.info(`  Total users: ${usersSnapshot.size}`);
      logger.info(`  Users with wellness enabled: ${usersWithWellness}`);
      logger.info(`  Notifications sent: ${totalSuccess}`);
      logger.info(`  Notifications failed: ${totalFailure}`);
      logger.info("═══════════════════════════════════════════════════════");

    } catch (sendError) {
      logger.error("═══════════════════════════════════════════════════════");
      logger.error("❌ Error sending notifications:");
      logger.error("Error name:", sendError.name);
      logger.error("Error message:", sendError.message);
      logger.error("Error code:", sendError.code);
      logger.error("Full error:", sendError);
      logger.error("═══════════════════════════════════════════════════════");
      throw sendError;
    }

  } catch (error) {
    logger.error("═══════════════════════════════════════════════════════");
    logger.error("❌ Fatal error in evening wellness check-in job:");
    logger.error("Error name:", error.name);
    logger.error("Error message:", error.message);
    logger.error("Stack trace:", error.stack);
    logger.error("═══════════════════════════════════════════════════════");
    throw error; // Re-throw to trigger retry
  }
});

