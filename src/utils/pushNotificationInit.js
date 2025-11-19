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
import { checkPushNotificationSupport, logBrowserInfo, detectBrowser } from './browserDetection';

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
 * 1. Check browser and platform compatibility
 * 2. Get FCM token for Firebase-based notifications
 * 3. Subscribe to native Web Push for direct browser notifications
 * 
 * @returns {Promise<void>}
 */
export async function initializePushNotifications() {
  try {
    console.log('[Push Init] ═══════════════════════════════════════════════════════');
    console.log('[Push Init] Starting push notification initialization...');
    console.log('[Push Init] ═══════════════════════════════════════════════════════');
    
    // Step 1: Check browser and platform compatibility
    console.log('[Push Init] Step 1: Checking browser and platform compatibility...');
    logBrowserInfo();
    
    const support = checkPushNotificationSupport();
    const browser = detectBrowser();
    
    // Log Safari/iOS specific warnings
    if (browser.isSafari || browser.isIOS) {
      console.warn('[Push Init] ⚠️  Safari/iOS detected');
      if (browser.isIOS) {
        console.warn('[Push Init] 📱 iOS push notifications have limited support:');
        console.warn('[Push Init]   - Requires iOS 16.4 or later');
        console.warn('[Push Init]   - Must be triggered by explicit user action (tap/click)');
        console.warn('[Push Init]   - May not work in standalone mode (home screen app)');
        console.warn('[Push Init]   - Background push is limited compared to Chrome/Firefox');
      }
      if (browser.isSafari && !browser.isIOS) {
        console.warn('[Push Init] 🖥️  Safari desktop push notifications:');
        console.warn('[Push Init]   - Requires macOS 13 (Ventura) or later');
        console.warn('[Push Init]   - Limited compared to Chrome/Firefox');
      }
    }
    
    // Check if push notifications are supported at all
    if (!support.isFullySupported) {
      console.error('[Push Init] ❌ Push notifications are not fully supported in this browser');
      if (support.errors.length > 0) {
        console.error('[Push Init] Blocking issues:');
        support.errors.forEach(error => console.error(`[Push Init]   - ${error}`));
      }
      console.error('[Push Init] Push notification initialization aborted');
      return;
    }
    
    console.log('[Push Init] ✅ Browser supports push notifications');
    console.log('[Push Init] Setting up both Firebase Cloud Messaging and native Web Push API');

    // Step 2: Initialize Firebase Cloud Messaging
    console.log('[Push Init] Step 2: Initializing Firebase Cloud Messaging...');
    try {
      const fcmToken = await getFCMToken();
      
      if (fcmToken) {
        console.log('[Push Init] ✅ Firebase Cloud Messaging initialized successfully');
        console.log('[Push Init] 📋 FCM Token:', fcmToken.substring(0, 20) + '...');
        console.log('[Push Init] 📤 Send this token to your backend to enable Firebase push notifications');
      } else {
        console.warn('[Push Init] ⚠️  Firebase Cloud Messaging not available');
        console.warn('[Push Init] This may be expected on Safari/iOS or if permission was denied');
        
        if (browser.isSafari || browser.isIOS) {
          console.warn('[Push Init] Safari/iOS does not support Firebase Cloud Messaging');
          console.warn('[Push Init] Will attempt native Web Push API instead');
        }
      }
    } catch (error) {
      console.error('[Push Init] ❌ Error initializing Firebase Cloud Messaging:', error);
      console.error('[Push Init] Error name:', error.name);
      console.error('[Push Init] Error message:', error.message);
      
      if (browser.isSafari || browser.isIOS) {
        console.warn('[Push Init] This is expected on Safari/iOS - FCM is not supported');
      }
    }

    // Step 3: Initialize native Web Push API
    console.log('[Push Init] Step 3: Initializing native Web Push API...');
    
    try {
      // Check if service worker is ready
      if (!('serviceWorker' in navigator)) {
        throw new Error('Service Workers not supported');
      }
      
      // Check current permission status
      const currentPermission = Notification.permission;
      console.log('[Push Init] Current notification permission:', currentPermission);
      
      if (currentPermission === 'denied') {
        console.error('[Push Init] ❌ Notification permission denied by user');
        console.error('[Push Init] User must manually enable notifications in browser settings');
        console.error('[Push Init] On Chrome: Site Settings > Notifications');
        console.error('[Push Init] On Firefox: Page Info > Permissions > Notifications');
        console.error('[Push Init] On Safari: Safari > Settings > Websites > Notifications');
        return;
      }
      
      // Check if already subscribed
      const existingSubscription = await getExistingSubscription();
      
      if (existingSubscription) {
        console.log('[Push Init] ✅ Native Web Push: Already subscribed');
        console.log('[Push Init] Subscription endpoint:', existingSubscription.endpoint.substring(0, 50) + '...');
        console.log('[Push Init] Subscription keys available:', {
          p256dh: !!existingSubscription.keys?.p256dh,
          auth: !!existingSubscription.keys?.auth
        });
      } else {
        console.log('[Push Init] Native Web Push: No existing subscription found');
        
        if (currentPermission === 'default') {
          console.log('[Push Init] ℹ️  Notification permission not yet requested');
          console.log('[Push Init] Permission will be requested when user interacts with notification features');
          console.log('[Push Init] Call requestPushNotificationSubscription() to request permission manually');
          
          if (browser.isIOS) {
            console.warn('[Push Init] ⚠️  iOS requires explicit user action to request permission');
            console.warn('[Push Init] Automatic permission request may not work');
          }
        } else if (currentPermission === 'granted') {
          console.log('[Push Init] Permission already granted, creating subscription...');
          
          // Subscribe to push notifications
          const subscription = await subscribeToPushNotifications(VAPID_PUBLIC_KEY);
          
          if (subscription) {
            console.log('[Push Init] ✅ Native Web Push: Subscription created successfully');
          } else {
            console.warn('[Push Init] ⚠️  Native Web Push: Subscription not created');
            console.warn('[Push Init] Check previous error messages for details');
          }
        }
      }
    } catch (error) {
      console.error('[Push Init] ❌ Error initializing native Web Push API:', error);
      console.error('[Push Init] Error name:', error.name);
      console.error('[Push Init] Error message:', error.message);
      console.error('[Push Init] Stack trace:', error.stack);
      
      // Provide platform-specific debugging hints
      if (browser.isIOS) {
        console.error('[Push Init] iOS troubleshooting:');
        console.error('[Push Init]   - Ensure iOS version is 16.4 or later');
        console.error('[Push Init]   - Try requesting permission from a user action (button click)');
        console.error('[Push Init]   - Check if app is in standalone mode (may have limitations)');
      } else if (browser.isSafari) {
        console.error('[Push Init] Safari troubleshooting:');
        console.error('[Push Init]   - Ensure macOS is version 13 (Ventura) or later');
        console.error('[Push Init]   - Check Safari settings for notification permissions');
      }
    }

    console.log('\n[Push Init] ═══════════════════════════════════════════════════════');
    console.log('[Push Init] 🎉 Push notification initialization complete!');
    console.log('[Push Init] ═══════════════════════════════════════════════════════');
    console.log('[Push Init] Summary:');
    console.log('[Push Init] - Browser compatibility checked ✓');
    console.log('[Push Init] - FCM initialization attempted ✓');
    console.log('[Push Init] - Native Web Push setup attempted ✓');
    console.log('[Push Init]');
    console.log('[Push Init] Next steps:');
    console.log('[Push Init] 1. Send FCM token and/or Web Push subscription to your backend');
    console.log('[Push Init] 2. Store them in your database associated with the user');
    console.log('[Push Init] 3. Use them to send push notifications from your server');
    console.log('[Push Init] ═══════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('[Push Init] ❌ Fatal error during push notification initialization:', error);
    console.error('[Push Init] Error name:', error.name);
    console.error('[Push Init] Error message:', error.message);
    console.error('[Push Init] Stack trace:', error.stack);
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
  console.log('[Push Request] This should be called from a user interaction (button click) for best compatibility');
  
  const browser = detectBrowser();
  if (browser.isIOS) {
    console.warn('[Push Request] ⚠️  iOS detected: User interaction is required for permission request');
  }
  
  try {
    const fcmToken = await getFCMToken();
    const webPushSubscription = await subscribeToPushNotifications(VAPID_PUBLIC_KEY);
    
    console.log('[Push Request] Subscription results:', {
      fcmTokenObtained: !!fcmToken,
      webPushSubscriptionObtained: !!webPushSubscription
    });
    
    return {
      fcmToken,
      webPushSubscription
    };
  } catch (error) {
    console.error('[Push Request] Error requesting push notification subscription:', error);
    throw error;
  }
}

