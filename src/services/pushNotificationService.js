/**
 * Push Notification Service
 * 
 * Manages push notification registration, scheduling, and delivery
 * Uses Firebase Cloud Messaging for push notifications
 */

import { messaging } from '../firebase';
import { onMessage, getToken } from 'firebase/messaging';
import { getTodaysWellnessTask } from '../utils/wellnessTaskService';

// VAPID public key from vapid-key.env
// This key is also configured in Firebase Console > Project Settings > Cloud Messaging > Web Push certificates
const VAPID_KEY = 'BE0ZQSJHIlmXfeA5ddjITNrqrS0TmGfGGQjBufmOlUKxRUtEwja2qHmTZ0pXHepJzGV2qcwH0gJ_D6ot6cWGB6w';

/**
 * Request notification permission from the user
 * @returns {Promise<boolean>} True if permission granted
 */
export const requestNotificationPermission = async () => {
  try {
    if (!('Notification' in window)) {
      console.warn('This browser does not support notifications');
      return false;
    }

    if (!messaging) {
      console.warn('Firebase Messaging not supported in this browser');
      return false;
    }

    const permission = await Notification.requestPermission();
    return permission === 'granted';
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return false;
  }
};

/**
 * Get FCM token for push notifications
 * @returns {Promise<string|null>} FCM token or null
 */
export const getFCMToken = async () => {
  try {
    if (!messaging) {
      console.warn('[FCM] Firebase Messaging not available');
      return null;
    }

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.warn('[FCM] Notification permission not granted');
      return null;
    }

    console.log('[FCM] Requesting FCM token with VAPID key...');
    
    // Get FCM token using the VAPID key
    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY
    });
    
    if (token) {
      console.log('[FCM] ✅ FCM token obtained successfully');
      console.log('[FCM] 📋 FCM Token:', token);
      console.log('[FCM] 📤 Send this token to your backend to enable Firebase push notifications');
      return token;
    } else {
      console.warn('[FCM] No FCM token available. User may need to grant permission.');
      return null;
    }
  } catch (error) {
    console.error('[FCM] Error getting FCM token:', error);
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
  let body = `Today's suggested workout is ${suggestedWorkout}`;
  
  if (wellnessTask) {
    body += `\n\n🌟 Today's wellness task: ${wellnessTask.task}`;
  }

  return {
    title: 'Good Morning! 💪',
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
  if (!messaging) {
    console.warn('Firebase Messaging not available');
    return null;
  }

  try {
    return onMessage(messaging, (payload) => {
      console.log('Received foreground message:', payload);
      if (callback) {
        callback(payload);
      }
    });
  } catch (error) {
    console.error('Error setting up message listener:', error);
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
