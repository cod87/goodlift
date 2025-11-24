/**
 * Firebase Cloud Functions for GoodLift
 * 
 * This file contains scheduled functions for sending push notifications to users.
 */

const { setGlobalOptions } = require("firebase-functions");
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
 * Scheduled function to send daily workout reminder notifications
 * Runs every day at 8:00 AM UTC
 * 
 * This function:
 * 1. Queries all users from Firestore
 * 2. Collects FCM tokens from user documents
 * 3. Sends push notifications to all valid tokens
 * 4. Handles errors for invalid/expired tokens
 * 
 * To deploy: firebase deploy --only functions:sendDailyNotifications
 * To test: Use Firebase console to trigger manually or wait for scheduled time
 */
exports.sendDailyNotifications = onSchedule({
  schedule: "0 8 * * *", // Every day at 8:00 AM CST
  timeZone: "America/Chicago", // Set to CST/CDT (automatically handles daylight savings)
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

    // Step 2: Collect FCM tokens from all users
    logger.info("Step 2: Collecting FCM tokens from user documents...");
    const tokens = [];
    const userTokenMap = {}; // Map token to userId for logging
    let usersWithTokens = 0;
    let usersWithoutTokens = 0;

    // Note: For large user bases (>1000 users), consider implementing batch processing
    // or parallel reads to improve performance. Current sequential implementation is
    // suitable for small to medium user bases.
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
            tokens.push(fcmToken);
            userTokenMap[fcmToken] = userId;
            usersWithTokens++;
            logger.info(`User ${userId}: Found FCM token`);
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
    logger.info("Token collection summary:");
    logger.info(`  Users with tokens: ${usersWithTokens}`);
    logger.info(`  Users without tokens: ${usersWithoutTokens}`);
    logger.info(`  Total tokens collected: ${tokens.length}`);
    logger.info("═══════════════════════════════════════════════════════");

    if (tokens.length === 0) {
      logger.warn("No FCM tokens found - no notifications to send");
      logger.info("Notification job completed (no valid tokens)");
      return;
    }

    // Step 3: Create notification payload
    logger.info("Step 3: Creating notification payload...");
    
    const currentDate = new Date().toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    
    const payload = {
      notification: {
        title: "Good Morning! ☀️",
        body: `Time to crush your workout today, ${currentDate}! Let's get moving! 💪`,
        icon: NOTIFICATION_CONFIG.icon,
        badge: NOTIFICATION_CONFIG.badge,
        tag: "daily-reminder",
        requireInteraction: false,
      },
      data: {
        type: "daily-reminder",
        timestamp: new Date().toISOString(),
        click_action: NOTIFICATION_CONFIG.clickActionUrl,
      },
    };

    logger.info("Notification payload created:");
    logger.info("  Title:", payload.notification.title);
    logger.info("  Body:", payload.notification.body);
    logger.info("  Type:", payload.data.type);

    // Step 4: Send notifications to all tokens
    logger.info("═══════════════════════════════════════════════════════");
    logger.info("Step 4: Sending notifications...");
    logger.info(`Sending to ${tokens.length} device(s)...`);
    
    try {
      const response = await admin.messaging().sendEachForMulticast({
        tokens: tokens,
        notification: payload.notification,
        data: payload.data,
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

      logger.info("═══════════════════════════════════════════════════════");
      logger.info("Notification delivery results:");
      logger.info(`  Success count: ${response.successCount}`);
      logger.info(`  Failure count: ${response.failureCount}`);
      logger.info("═══════════════════════════════════════════════════════");

      // Step 5: Handle errors and invalid tokens
      if (response.failureCount > 0) {
        logger.warn("Some notifications failed to send. Processing errors...");
        
        const failedTokens = [];
        response.responses.forEach((resp, idx) => {
          if (!resp.success) {
            const token = tokens[idx];
            const userId = userTokenMap[token];
            const error = resp.error;
            
            logger.error(`Failed to send to user ${userId}:`);
            logger.error(`  Error code: ${error.code}`);
            logger.error(`  Error message: ${error.message}`);
            
            // Check if token is invalid or expired
            if (
              error.code === "messaging/invalid-registration-token" ||
              error.code === "messaging/registration-token-not-registered"
            ) {
              logger.warn(`Token for user ${userId} is invalid/expired - should be removed from database`);
              failedTokens.push({ userId, token, reason: error.code });
            }
          }
        });

        if (failedTokens.length > 0) {
          logger.warn("═══════════════════════════════════════════════════════");
          logger.warn(`Found ${failedTokens.length} invalid/expired token(s):`);
          failedTokens.forEach(({ userId, reason }) => {
            logger.warn(`  User ${userId}: ${reason}`);
          });
          logger.warn("Consider implementing automatic token cleanup for these users");
          logger.warn("═══════════════════════════════════════════════════════");
        }
      }

      logger.info("═══════════════════════════════════════════════════════");
      logger.info("✅ Daily notification job completed successfully!");
      logger.info("Summary:");
      logger.info(`  Total users: ${usersSnapshot.size}`);
      logger.info(`  Users with tokens: ${usersWithTokens}`);
      logger.info(`  Notifications sent: ${response.successCount}`);
      logger.info(`  Notifications failed: ${response.failureCount}`);
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

