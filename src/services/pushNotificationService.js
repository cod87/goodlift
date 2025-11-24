/**
 * Push Notification Service
 * 
 * Manages push notification registration, scheduling, and delivery
 * Uses Firebase Cloud Messaging for push notifications
 */

import { messaging } from '../firebase';
import { onMessage, getToken } from 'firebase/messaging';
import { getTodaysWellnessTask } from '../utils/wellnessTaskService';
import { saveFCMTokenToFirebase, getFCMTokenFromFirebase } from '../utils/firebaseStorage';

// VAPID public key from vapid-key.env
// This key is also configured in Firebase Console > Project Settings > Cloud Messaging > Web Push certificates
const VAPID_KEY = 'BE0ZQSJHIlmXfeA5ddjITNrqrS0TmGfGGQjBufmOlUKxRUtEwja2qHmTZ0pXHepJzGV2qcwH0gJ_D6ot6cWGB6w';

/**
 * Request notification permission from the user
 * @returns {Promise<boolean>} True if permission granted
 */
export const requestNotificationPermission = async () => {
  try {
    console.log('[Notification Permission] Requesting notification permission...');
    
    if (!('Notification' in window)) {
      console.error('[Notification Permission] ❌ Notification API not supported in this browser');
      console.error('[Notification Permission] User agent:', navigator.userAgent);
      return false;
    }

    // Check current permission state
    const currentPermission = Notification.permission;
    console.log('[Notification Permission] Current permission state:', currentPermission);
    
    if (currentPermission === 'granted') {
      console.log('[Notification Permission] ✅ Permission already granted');
      return true;
    }
    
    if (currentPermission === 'denied') {
      console.error('[Notification Permission] ❌ Permission previously denied by user');
      console.error('[Notification Permission] User must manually enable notifications in browser settings');
      return false;
    }

    if (!messaging) {
      console.warn('[Notification Permission] ⚠️  Firebase Messaging not supported in this browser');
      console.warn('[Notification Permission] Will still request permission for native notifications');
    }

    // Request permission
    console.log('[Notification Permission] Requesting permission from user...');
    const permission = await Notification.requestPermission();
    console.log('[Notification Permission] User response:', permission);
    
    if (permission === 'granted') {
      console.log('[Notification Permission] ✅ Permission granted by user');
      return true;
    } else if (permission === 'denied') {
      console.warn('[Notification Permission] ❌ Permission denied by user');
      return false;
    } else {
      console.warn('[Notification Permission] ⚠️  Permission dismissed by user (default state)');
      return false;
    }
  } catch (error) {
    console.error('[Notification Permission] ❌ Error requesting notification permission');
    console.error('[Notification Permission] Error name:', error.name);
    console.error('[Notification Permission] Error message:', error.message);
    
    if (error.name === 'NotAllowedError') {
      console.error('[Notification Permission] Permission request blocked by browser');
      console.error('[Notification Permission] May need to be triggered by user interaction');
    }
    
    return false;
  }
};

/**
 * Get FCM token for push notifications and optionally save to Firestore
 * @param {string} userId - Optional user ID to save token to Firestore
 * @returns {Promise<string|null>} FCM token or null
 */
export const getFCMToken = async (userId = null) => {
  try {
    console.log('[FCM] Starting FCM token retrieval...');
    
    if (!messaging) {
      console.warn('[FCM] ⚠️  Firebase Messaging not available in this browser');
      console.warn('[FCM] This is expected on Safari/iOS which does not support FCM');
      console.warn('[FCM] Browser:', navigator.userAgent);
      return null;
    }
    
    console.log('[FCM] Firebase Messaging instance available');

    // Check notification permission
    const currentPermission = Notification.permission;
    console.log('[FCM] Current notification permission:', currentPermission);
    
    if (currentPermission === 'denied') {
      console.error('[FCM] ❌ Notification permission denied - cannot get FCM token');
      return null;
    }
    
    if (currentPermission !== 'granted') {
      console.log('[FCM] Requesting notification permission...');
      const permission = await Notification.requestPermission();
      console.log('[FCM] Permission request result:', permission);
      
      if (permission !== 'granted') {
        console.warn('[FCM] ⚠️  Notification permission not granted');
        return null;
      }
    }

    console.log('[FCM] Requesting FCM token with VAPID key...');
    console.log('[FCM] VAPID key (first 20 chars):', VAPID_KEY.substring(0, 20) + '...');
    
    // Get FCM token using the VAPID key
    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY
    });
    
    if (token) {
      console.log('[FCM] ✅ FCM token obtained successfully');
      console.log('[FCM] 📋 FCM Token (first 30 chars):', token.substring(0, 30) + '...');
      console.log('[FCM] Full token length:', token.length, 'characters');
      
      // Save token to Firestore if userId is provided
      if (userId) {
        console.log('[FCM] User ID provided, checking if token needs to be saved to Firestore...');
        
        try {
          // Check if token has changed
          const existingToken = await getFCMTokenFromFirebase(userId);
          
          if (existingToken === token) {
            console.log('[FCM] ✅ Token already stored in Firestore and matches current token');
            console.log('[FCM] No update needed - avoiding redundant write');
          } else {
            if (existingToken) {
              console.log('[FCM] Token has changed, updating in Firestore...');
              console.log('[FCM] Old token (first 30 chars):', existingToken.substring(0, 30) + '...');
              console.log('[FCM] New token (first 30 chars):', token.substring(0, 30) + '...');
            } else {
              console.log('[FCM] No existing token found, saving new token to Firestore...');
            }
            
            const saved = await saveFCMTokenToFirebase(userId, token);
            if (saved) {
              console.log('[FCM] ✅ Token saved to Firestore successfully');
              console.log('[FCM] Token is now stored at: users/' + userId + '/data/userData');
            } else {
              console.error('[FCM] ❌ Failed to save token to Firestore');
            }
          }
        } catch (error) {
          console.error('[FCM] ❌ Error managing token in Firestore:', error);
        }
      } else {
        console.log('[FCM] 📤 No user ID provided - token not saved to Firestore');
        console.log('[FCM] Token should be stored in your database associated with this user/device');
      }
      
      return token;
    } else {
      console.warn('[FCM] ⚠️  No FCM token received from Firebase');
      console.warn('[FCM] This may indicate:');
      console.warn('[FCM]   - Service worker not properly registered');
      console.warn('[FCM]   - VAPID key mismatch with Firebase console configuration');
      console.warn('[FCM]   - Firebase project configuration issue');
      return null;
    }
  } catch (error) {
    console.error('[FCM] ❌ Error getting FCM token');
    console.error('[FCM] Error name:', error.name);
    console.error('[FCM] Error message:', error.message);
    console.error('[FCM] Error code:', error.code);
    
    // Provide specific error guidance
    if (error.code === 'messaging/permission-blocked') {
      console.error('[FCM] Permission blocked by user - cannot retrieve token');
      console.error('[FCM] User must enable notifications in browser settings');
    } else if (error.code === 'messaging/unsupported-browser') {
      console.error('[FCM] Firebase Messaging not supported in this browser');
      console.error('[FCM] Try using Chrome, Firefox, or Edge');
    } else if (error.code === 'messaging/failed-service-worker-registration') {
      console.error('[FCM] Service worker registration failed');
      console.error('[FCM] Check that service-worker.js and firebase-messaging-sw.js are accessible');
    } else if (error.code === 'messaging/token-subscribe-failed') {
      console.error('[FCM] Failed to subscribe to FCM');
      console.error('[FCM] Possible causes:');
      console.error('[FCM]   - Network connectivity issue');
      console.error('[FCM]   - Firebase project configuration problem');
      console.error('[FCM]   - VAPID key mismatch');
    }
    
    console.error('[FCM] Full error object:', error);
    return null;
  }
};

/**
 * Schedule a local notification (browser notification API)
 * @param {Object} options - Notification options
 */
export const scheduleLocalNotification = (options) => {
  const {
    title,
    body,
    icon = `${window.location.origin}/goodlift-logo.svg`,
    tag = 'goodlift-notification',
    requireInteraction = false,
  } = options;

  if (!('Notification' in window)) {
    console.warn('Notifications not supported');
    return;
  }

  if (Notification.permission === 'granted') {
    try {
      new Notification(title, {
        body,
        icon,
        tag,
        requireInteraction,
      });
    } catch (error) {
      console.error('Error showing notification:', error);
    }
  }
};

/**
 * Calculate next notification time based on user preferences
 * @param {Object} preferences - User notification preferences
 * @param {string} type - 'morning' or 'followup'
 * @returns {Date} Next notification time
 */
export const calculateNextNotificationTime = (preferences, type = 'morning') => {
  const now = new Date();
  const nextNotification = new Date();

  if (type === 'morning') {
    const morningHour = preferences.morningNotificationTime?.hour || 8;
    const morningMinute = preferences.morningNotificationTime?.minute || 0;
    
    nextNotification.setHours(morningHour, morningMinute, 0, 0);
    
    // If time has passed today, schedule for tomorrow
    if (nextNotification <= now) {
      nextNotification.setDate(nextNotification.getDate() + 1);
    }
  } else if (type === 'followup') {
    const followupHour = preferences.followupNotificationTime?.hour || 21;
    const followupMinute = preferences.followupNotificationTime?.minute || 0;
    
    nextNotification.setHours(followupHour, followupMinute, 0, 0);
    
    // If time has passed today, schedule for tomorrow
    if (nextNotification <= now) {
      nextNotification.setDate(nextNotification.getDate() + 1);
    }
  }

  return nextNotification;
};

/**
 * Generate morning notification content
 * @param {string} suggestedWorkout - Suggested workout for today
 * @param {Object} wellnessTask - Optional wellness task
 * @returns {Object} Notification content
 */
export const generateMorningNotification = (suggestedWorkout, wellnessTask = null) => {
  let body = `🏋🏻‍♂️ Today's session: ${suggestedWorkout}`;
  
  if (wellnessTask) {
    body += `\n🌟 Today's wellness task: ${wellnessTask.task}`;
  }

  return {
    title: 'Good Morning! ☀️',
    body,
  };
};

/**
 * Generate follow-up notification content
 * @param {string} type - 'daily' or 'weekly'
 * @param {Object} task - Wellness task
 * @returns {Object} Notification content
 */
export const generateFollowupNotification = (type, task) => {
  const title = type === 'daily' 
    ? 'Daily Task Check-in'
    : 'Weekly Task Check-in';
  
  const body = `Did you complete your wellness task: "${task.task}"?`;

  return {
    title,
    body,
  };
};

/**
 * Check if it's time to send a notification
 * @param {Object} preferences - User preferences
 * @param {string} type - 'morning', 'daily-followup', or 'weekly-followup'
 * @returns {boolean} True if it's time to send notification
 */
export const shouldSendNotification = (preferences, type) => {
  if (!preferences.pushNotificationsEnabled) {
    return false;
  }

  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const currentDay = now.getDay(); // 0 = Sunday, 6 = Saturday

  switch (type) {
    case 'morning': {
      const targetHour = preferences.morningNotificationTime?.hour || 8;
      const targetMinute = preferences.morningNotificationTime?.minute || 0;
      return currentHour === targetHour && currentMinute === targetMinute;
    }

    case 'daily-followup': {
      if (!preferences.enableFollowupNotifications) {
        return false;
      }
      const targetHour = preferences.followupNotificationTime?.hour || 21;
      const targetMinute = preferences.followupNotificationTime?.minute || 0;
      return currentHour === targetHour && currentMinute === targetMinute;
    }

    case 'weekly-followup': {
      if (!preferences.enableFollowupNotifications) {
        return false;
      }
      // Saturday morning (day 6)
      const targetHour = preferences.morningNotificationTime?.hour || 8;
      const targetMinute = preferences.morningNotificationTime?.minute || 0;
      return currentDay === 6 && currentHour === targetHour && currentMinute === targetMinute;
    }

    case 'weekly-task': {
      // Sunday morning (day 0)
      const targetHour = preferences.morningNotificationTime?.hour || 8;
      const targetMinute = preferences.morningNotificationTime?.minute || 0;
      return currentDay === 0 && currentHour === targetHour && currentMinute === targetMinute;
    }

    default:
      return false;
  }
};

/**
 * Setup message listener for foreground notifications
 */
export const setupMessageListener = (callback) => {
  console.log('[FCM Listener] Setting up foreground message listener...');
  
  if (!messaging) {
    console.warn('[FCM Listener] ⚠️  Firebase Messaging not available - cannot setup listener');
    console.warn('[FCM Listener] This is expected on Safari/iOS');
    return null;
  }

  try {
    const unsubscribe = onMessage(messaging, (payload) => {
      console.log('[FCM Listener] ✅ Received foreground message from Firebase');
      console.log('[FCM Listener] Message payload:', {
        notification: payload.notification,
        data: payload.data,
        from: payload.from,
        collapseKey: payload.collapseKey
      });
      
      // Log notification details
      if (payload.notification) {
        console.log('[FCM Listener] Notification details:');
        console.log('[FCM Listener]   Title:', payload.notification.title);
        console.log('[FCM Listener]   Body:', payload.notification.body);
        console.log('[FCM Listener]   Icon:', payload.notification.icon);
      }
      
      // Log data payload
      if (payload.data) {
        console.log('[FCM Listener] Data payload:', payload.data);
      }
      
      if (callback) {
        try {
          callback(payload);
        } catch (error) {
          console.error('[FCM Listener] ❌ Error in message callback:', error);
        }
      }
    });
    
    console.log('[FCM Listener] ✅ Foreground message listener setup complete');
    console.log('[FCM Listener] Will receive notifications when app is open and in focus');
    
    return unsubscribe;
  } catch (error) {
    console.error('[FCM Listener] ❌ Error setting up message listener');
    console.error('[FCM Listener] Error name:', error.name);
    console.error('[FCM Listener] Error message:', error.message);
    console.error('[FCM Listener] Full error:', error);
    return null;
  }
};

/**
 * Send test notification
 * @param {Object} preferences - User preferences
 */
export const sendTestNotification = (preferences) => {
  const wellnessTask = getTodaysWellnessTask(preferences.wellness || {});
  const notification = generateMorningNotification('Full Body Strength', wellnessTask);
  
  scheduleLocalNotification({
    title: notification.title,
    body: notification.body,
  });
};

export default {
  requestNotificationPermission,
  getFCMToken,
  scheduleLocalNotification,
  calculateNextNotificationTime,
  generateMorningNotification,
  generateFollowupNotification,
  shouldSendNotification,
  setupMessageListener,
  sendTestNotification,
};
