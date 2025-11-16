/**
 * Push Notification Initialization Module
 * 
 * This module initializes push notification subscription when the app loads.
 * It automatically subscribes users to push notifications when:
 * - Service worker is ready
 * - Browser supports push notifications
 * - User grants notification permission
 */

import { subscribeToPushNotifications, getExistingSubscription } from './pushNotifications';

// VAPID public key from vapid-key.env
// Note: This is a PUBLIC key and is safe to include in client-side code
// It's used to identify your application server when subscribing to push notifications
const VAPID_PUBLIC_KEY = 'BE0ZQSJHIlmXfeA5ddjITNrqrS0TmGfGGQjBufmOlUKxRUtEwja2qHmTZ0pXHepJzGV2qcwH0gJ_D6ot6cWGB6w';

/**
 * Initialize push notification subscription
 * 
 * This function should be called when the app starts.
 * It will check for existing subscription and create a new one if needed.
 * 
 * @returns {Promise<void>}
 */
export async function initializePushNotifications() {
  try {
    console.log('[Push Init] Initializing push notification subscription...');

    // Check if already subscribed
    const existingSubscription = await getExistingSubscription();
    
    if (existingSubscription) {
      console.log('[Push Init] User is already subscribed to push notifications');
      console.log('[Push Init] Existing subscription:', JSON.stringify(existingSubscription, null, 2));
      return;
    }

    console.log('[Push Init] No existing subscription found, creating new subscription...');
    
    // Subscribe to push notifications
    const subscription = await subscribeToPushNotifications(VAPID_PUBLIC_KEY);
    
    if (subscription) {
      console.log('[Push Init] ✅ Push notification subscription initialized successfully');
    } else {
      console.log('[Push Init] ⚠️ Push notification subscription not created (user may have denied permission)');
    }

  } catch (error) {
    console.error('[Push Init] Error initializing push notifications:', error);
  }
}

/**
 * Call this function to manually trigger push notification subscription
 * Useful for user settings or onboarding flows
 * 
 * @returns {Promise<PushSubscription|null>}
 */
export async function requestPushNotificationSubscription() {
  console.log('[Push Request] Manual push notification subscription requested');
  return await subscribeToPushNotifications(VAPID_PUBLIC_KEY);
}
