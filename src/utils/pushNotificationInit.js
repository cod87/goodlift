/**
 * Push Notification Initialization Module
 * 
 * This module initializes push notification subscription when the app loads.
 * It supports both:
 * 1. Firebase Cloud Messaging (FCM) - for Firebase-based push notifications
 * 2. Native Web Push API - for direct browser push notifications
 * 
 * The VAPID public key is configured in both:
 * - Firebase Console > Project Settings > Cloud Messaging > Web Push certificates
 * - This file for native Web Push API
 */

import { subscribeToPushNotifications, getExistingSubscription } from './pushNotifications';
import { getFCMToken } from '../services/pushNotificationService';

// VAPID public key from vapid-key.env
// Note: This is a PUBLIC key and is safe to include in client-side code
// It's used to identify your application server when subscribing to push notifications
// This same key is also configured in Firebase Console for FCM
const VAPID_PUBLIC_KEY = 'BE0ZQSJHIlmXfeA5ddjITNrqrS0TmGfGGQjBufmOlUKxRUtEwja2qHmTZ0pXHepJzGV2qcwH0gJ_D6ot6cWGB6w';

/**
 * Initialize push notification subscription
 * 
 * This function sets up both Firebase Cloud Messaging and native Web Push API.
 * It will:
 * 1. Get FCM token for Firebase-based notifications
 * 2. Subscribe to native Web Push for direct browser notifications
 * 
 * @returns {Promise<void>}
 */
export async function initializePushNotifications() {
  try {
    console.log('[Push Init] Initializing push notification subscription...');
    console.log('[Push Init] Setting up both Firebase Cloud Messaging and native Web Push API');

    // Initialize Firebase Cloud Messaging
    console.log('[Push Init] Step 1: Getting Firebase Cloud Messaging token...');
    const fcmToken = await getFCMToken();
    
    if (fcmToken) {
      console.log('[Push Init] ✅ Firebase Cloud Messaging initialized');
      console.log('[Push Init] You can use this FCM token to send notifications via Firebase Admin SDK');
    } else {
      console.log('[Push Init] ⚠️ Firebase Cloud Messaging not available (may not be supported in this browser)');
    }

    // Initialize native Web Push API
    console.log('[Push Init] Step 2: Setting up native Web Push API subscription...');
    
    // Check if already subscribed
    const existingSubscription = await getExistingSubscription();
    
    if (existingSubscription) {
      console.log('[Push Init] ✅ Native Web Push: Already subscribed');
      console.log('[Push Init] Existing subscription:', JSON.stringify(existingSubscription, null, 2));
    } else {
      console.log('[Push Init] Native Web Push: No existing subscription, creating new subscription...');
      
      // Subscribe to push notifications
      const subscription = await subscribeToPushNotifications(VAPID_PUBLIC_KEY);
      
      if (subscription) {
        console.log('[Push Init] ✅ Native Web Push: Subscription created successfully');
      } else {
        console.log('[Push Init] ⚠️ Native Web Push: Subscription not created (user may have denied permission)');
      }
    }

    console.log('\n[Push Init] ═══════════════════════════════════════════════════════');
    console.log('[Push Init] 🎉 Push notification setup complete!');
    console.log('[Push Init] ═══════════════════════════════════════════════════════');
    console.log('[Push Init] You now have two ways to send push notifications:');
    console.log('[Push Init] 1️⃣  Firebase Cloud Messaging (FCM):');
    console.log('[Push Init]     - Use the FCM token logged above');
    console.log('[Push Init]     - Send via Firebase Admin SDK or FCM REST API');
    console.log('[Push Init]     - Background messages handled by firebase-messaging-sw.js');
    console.log('[Push Init] 2️⃣  Native Web Push API:');
    console.log('[Push Init]     - Use the subscription object logged above');
    console.log('[Push Init]     - Send via web-push library or any Web Push service');
    console.log('[Push Init]     - Push events handled by service-worker.js');
    console.log('[Push Init] ═══════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('[Push Init] Error initializing push notifications:', error);
  }
}

/**
 * Call this function to manually trigger push notification subscription
 * Useful for user settings or onboarding flows
 * 
 * @returns {Promise<{fcmToken: string|null, webPushSubscription: PushSubscription|null}>}
 */
export async function requestPushNotificationSubscription() {
  console.log('[Push Request] Manual push notification subscription requested');
  
  const fcmToken = await getFCMToken();
  const webPushSubscription = await subscribeToPushNotifications(VAPID_PUBLIC_KEY);
  
  return {
    fcmToken,
    webPushSubscription
  };
}
