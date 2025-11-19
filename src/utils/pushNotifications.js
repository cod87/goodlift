/**
 * Push Notifications Utility Module
 * 
 * This module handles browser push notification subscription using the Web Push API
 * and VAPID (Voluntary Application Server Identification) protocol.
 * 
 * Key Features:
 * - Converts VAPID public key from base64 to Uint8Array for Push API
 * - Subscribes users to push notifications via service worker
 * - Logs subscription details for backend integration
 */

/**
 * Convert a base64 VAPID public key to Uint8Array format
 * 
 * The Push API requires the VAPID public key to be in Uint8Array format,
 * but it's typically stored as a base64-encoded string. This function
 * performs the conversion.
 * 
 * @param {string} base64String - The base64-encoded VAPID public key
 * @returns {Uint8Array} The key converted to Uint8Array format
 */
export function urlBase64ToUint8Array(base64String) {
  // Add padding if needed (base64 strings should be divisible by 4)
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  // Decode base64 string
  const rawData = window.atob(base64);
  
  // Convert to Uint8Array
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  
  return outputArray;
}

/**
 * Subscribe user to push notifications
 * 
 * This function:
 * 1. Checks if push notifications are supported
 * 2. Requests notification permission from the user
 * 3. Subscribes to push notifications via the service worker
 * 4. Logs the subscription object for backend integration
 * 
 * @param {string} vapidPublicKey - The VAPID public key (base64-encoded)
 * @returns {Promise<PushSubscription|null>} The push subscription object or null if failed
 */
export async function subscribeToPushNotifications(vapidPublicKey) {
  try {
    console.log('[Push Notifications] ═══════════════════════════════════════');
    console.log('[Push Notifications] Starting push notification subscription...');
    
    // Check if service workers are supported
    if (!('serviceWorker' in navigator)) {
      console.error('[Push Notifications] ❌ Service Workers are not supported in this browser');
      console.error('[Push Notifications] Browser:', navigator.userAgent);
      console.error('[Push Notifications] Push notifications require service worker support');
      return null;
    }
    console.log('[Push Notifications] ✅ Service Workers supported');

    // Check if push notifications are supported
    if (!('PushManager' in window)) {
      console.error('[Push Notifications] ❌ Push Manager API is not supported in this browser');
      console.error('[Push Notifications] Browser:', navigator.userAgent);
      console.error('[Push Notifications] This browser does not support Web Push');
      return null;
    }
    console.log('[Push Notifications] ✅ Push Manager API supported');
    
    // Check if Notification API is supported
    if (!('Notification' in window)) {
      console.error('[Push Notifications] ❌ Notification API is not supported in this browser');
      console.error('[Push Notifications] Browser:', navigator.userAgent);
      return null;
    }
    console.log('[Push Notifications] ✅ Notification API supported');

    // Check current permission state
    const currentPermission = Notification.permission;
    console.log('[Push Notifications] Current permission state:', currentPermission);
    
    if (currentPermission === 'denied') {
      console.error('[Push Notifications] ❌ Notification permission denied by user');
      console.error('[Push Notifications] User must manually enable notifications in browser settings:');
      console.error('[Push Notifications]   Chrome: Site Settings > Notifications');
      console.error('[Push Notifications]   Firefox: Page Info > Permissions > Notifications');
      console.error('[Push Notifications]   Safari: Safari > Settings > Websites > Notifications');
      console.error('[Push Notifications]   Edge: Site Permissions > Notifications');
      return null;
    }

    // Request notification permission if not already granted
    if (currentPermission !== 'granted') {
      console.log('[Push Notifications] Requesting notification permission from user...');
      console.log('[Push Notifications] User will see a permission prompt');
      
      const permission = await Notification.requestPermission();
      console.log('[Push Notifications] Permission request result:', permission);
      
      if (permission !== 'granted') {
        console.warn('[Push Notifications] ⚠️  Notification permission not granted:', permission);
        if (permission === 'denied') {
          console.error('[Push Notifications] User denied permission - cannot proceed');
        } else {
          console.warn('[Push Notifications] User dismissed permission prompt');
        }
        return null;
      }
      
      console.log('[Push Notifications] ✅ Notification permission granted');
    } else {
      console.log('[Push Notifications] ✅ Notification permission already granted');
    }

    // Wait for service worker to be ready
    console.log('[Push Notifications] Waiting for service worker to be ready...');
    console.log('[Push Notifications] This ensures service worker is fully registered and active');
    
    const registration = await navigator.serviceWorker.ready;
    
    console.log('[Push Notifications] ✅ Service worker is ready');
    console.log('[Push Notifications] Service worker scope:', registration.scope);
    console.log('[Push Notifications] Service worker active:', registration.active !== null);
    
    if (!registration.active) {
      console.error('[Push Notifications] ❌ Service worker is not active');
      console.error('[Push Notifications] Cannot subscribe without an active service worker');
      return null;
    }

    // Check if already subscribed
    console.log('[Push Notifications] Checking for existing push subscription...');
    const existingSubscription = await registration.pushManager.getSubscription();
    
    if (existingSubscription) {
      console.log('[Push Notifications] ⚠️  Already subscribed to push notifications');
      console.log('[Push Notifications] Existing subscription endpoint:', 
        existingSubscription.endpoint.substring(0, 50) + '...');
      console.log('[Push Notifications] Returning existing subscription');
      return existingSubscription;
    }
    
    console.log('[Push Notifications] No existing subscription found');

    // Convert VAPID key to Uint8Array
    console.log('[Push Notifications] Converting VAPID key to Uint8Array format...');
    console.log('[Push Notifications] VAPID key (first 20 chars):', vapidPublicKey.substring(0, 20) + '...');
    
    let convertedVapidKey;
    try {
      convertedVapidKey = urlBase64ToUint8Array(vapidPublicKey);
      console.log('[Push Notifications] ✅ VAPID key converted successfully');
      console.log('[Push Notifications] Converted key length:', convertedVapidKey.length, 'bytes');
    } catch (error) {
      console.error('[Push Notifications] ❌ Error converting VAPID key:', error);
      console.error('[Push Notifications] VAPID key may be invalid or corrupted');
      throw error;
    }

    // Subscribe to push notifications
    console.log('[Push Notifications] Subscribing to push notifications...');
    console.log('[Push Notifications] Options: userVisibleOnly = true (required)');
    
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true, // Required: all push notifications must be visible to the user
      applicationServerKey: convertedVapidKey
    });

    console.log('[Push Notifications] ═══════════════════════════════════════');
    console.log('[Push Notifications] ✅ Successfully subscribed to push notifications!');
    console.log('[Push Notifications] ═══════════════════════════════════════');
    console.log('[Push Notifications] 📋 Subscription Details:');
    console.log('[Push Notifications] Endpoint:', subscription.endpoint);
    
    if (subscription.keys) {
      console.log('[Push Notifications] Keys available:');
      console.log('[Push Notifications]   - p256dh:', subscription.keys.p256dh ? 'Present' : 'Missing');
      console.log('[Push Notifications]   - auth:', subscription.keys.auth ? 'Present' : 'Missing');
    }
    
    console.log('[Push Notifications] Full subscription object:');
    console.log(JSON.stringify(subscription, null, 2));
    
    console.log('\n[Push Notifications] 📤 Next Steps:');
    console.log('[Push Notifications] 1. Send this subscription object to your backend server');
    console.log('[Push Notifications] 2. Store it in your database associated with this user/device');
    console.log('[Push Notifications] 3. Use it to send push notifications via web-push library');
    console.log('\n[Push Notifications] Example backend code (Node.js with web-push):');
    console.log('[Push Notifications] const webpush = require("web-push");');
    console.log('[Push Notifications] webpush.sendNotification(subscription, "Your notification message");');
    console.log('[Push Notifications] ═══════════════════════════════════════\n');

    return subscription;

  } catch (error) {
    console.error('[Push Notifications] ═══════════════════════════════════════');
    console.error('[Push Notifications] ❌ Error subscribing to push notifications');
    console.error('[Push Notifications] Error name:', error.name);
    console.error('[Push Notifications] Error message:', error.message);
    
    // Provide specific error guidance
    if (error.name === 'NotAllowedError') {
      console.error('[Push Notifications] Permission not allowed by user');
      console.error('[Push Notifications] This can happen if:');
      console.error('[Push Notifications]   - User denied permission');
      console.error('[Push Notifications]   - Permission request not triggered by user action (iOS)');
      console.error('[Push Notifications]   - Browser blocked permission request');
    } else if (error.name === 'NotSupportedError') {
      console.error('[Push Notifications] Push notifications not supported');
      console.error('[Push Notifications] Browser may be too old or feature is disabled');
    } else if (error.name === 'AbortError') {
      console.error('[Push Notifications] Subscription aborted');
      console.error('[Push Notifications] Service worker may not be properly registered');
    } else if (error.name === 'InvalidStateError') {
      console.error('[Push Notifications] Invalid state');
      console.error('[Push Notifications] Service worker may not be active');
    } else if (error.message.includes('VAPID')) {
      console.error('[Push Notifications] VAPID key issue');
      console.error('[Push Notifications] Check that VAPID key is correct and properly formatted');
    }
    
    console.error('[Push Notifications] Full error object:', error);
    console.error('[Push Notifications] Stack trace:', error.stack);
    console.error('[Push Notifications] ═══════════════════════════════════════');
    
    return null;
  }
}

/**
 * Check if user is already subscribed to push notifications
 * 
 * @returns {Promise<PushSubscription|null>} Existing subscription or null
 */
export async function getExistingSubscription() {
  try {
    console.log('[Push Notifications] Checking for existing subscription...');
    
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.warn('[Push Notifications] ⚠️  Service Workers or Push Manager not supported');
      return null;
    }

    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    
    if (subscription) {
      console.log('[Push Notifications] ✅ Found existing subscription');
      console.log('[Push Notifications] Endpoint:', subscription.endpoint.substring(0, 50) + '...');
      console.log('[Push Notifications] Expiration time:', subscription.expirationTime || 'Never');
    } else {
      console.log('[Push Notifications] No existing subscription found');
    }
    
    return subscription;
  } catch (error) {
    console.error('[Push Notifications] ❌ Error checking existing subscription');
    console.error('[Push Notifications] Error name:', error.name);
    console.error('[Push Notifications] Error message:', error.message);
    return null;
  }
}

/**
 * Unsubscribe from push notifications
 * 
 * @returns {Promise<boolean>} True if successfully unsubscribed
 */
export async function unsubscribeFromPushNotifications() {
  try {
    const subscription = await getExistingSubscription();
    
    if (!subscription) {
      console.log('[Push Notifications] No active subscription found');
      return false;
    }

    const successful = await subscription.unsubscribe();
    
    if (successful) {
      console.log('[Push Notifications] Successfully unsubscribed from push notifications');
    }
    
    return successful;
  } catch (error) {
    console.error('[Push Notifications] Error unsubscribing:', error);
    return false;
  }
}
