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
    // Check if service workers are supported
    if (!('serviceWorker' in navigator)) {
      console.warn('[Push Notifications] Service workers are not supported in this browser');
      return null;
    }

    // Check if push notifications are supported
    if (!('PushManager' in window)) {
      console.warn('[Push Notifications] Push notifications are not supported in this browser');
      return null;
    }

    // Request notification permission
    console.log('[Push Notifications] Requesting notification permission...');
    const permission = await Notification.requestPermission();
    
    if (permission !== 'granted') {
      console.warn('[Push Notifications] Notification permission denied by user');
      return null;
    }

    console.log('[Push Notifications] Notification permission granted');

    // Wait for service worker to be ready
    console.log('[Push Notifications] Waiting for service worker to be ready...');
    const registration = await navigator.serviceWorker.ready;
    console.log('[Push Notifications] Service worker is ready');

    // Convert VAPID key to Uint8Array
    const convertedVapidKey = urlBase64ToUint8Array(vapidPublicKey);

    // Subscribe to push notifications
    console.log('[Push Notifications] Subscribing to push notifications...');
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true, // Required: all push notifications must be visible to the user
      applicationServerKey: convertedVapidKey
    });

    console.log('[Push Notifications] ✅ Successfully subscribed to push notifications!');
    console.log('[Push Notifications] 📋 Subscription object:');
    console.log(JSON.stringify(subscription, null, 2));
    console.log('\n[Push Notifications] 📤 To enable push notifications:');
    console.log('1. Send this subscription object to your backend server');
    console.log('2. Store it in your database associated with this user');
    console.log('3. Use it to send push notifications via web-push library or similar');
    console.log('\nExample backend code (Node.js with web-push):');
    console.log('const webpush = require("web-push");');
    console.log('webpush.sendNotification(subscription, "Your notification message");');

    return subscription;

  } catch (error) {
    console.error('[Push Notifications] ❌ Error subscribing to push notifications:', error);
    console.error('[Push Notifications] Error details:', error.message);
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
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      return null;
    }

    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    
    return subscription;
  } catch (error) {
    console.error('[Push Notifications] Error checking existing subscription:', error);
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
