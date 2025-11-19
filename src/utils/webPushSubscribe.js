/**
 * Web Push API Subscription Utility
 * 
 * This module provides a streamlined interface for subscribing to native Web Push notifications
 * with full support for Safari Mobile (iOS 16.4+) and other modern browsers.
 * 
 * Key Features:
 * - Request notification permission from user
 * - Register service worker for push notifications
 * - Subscribe to push notifications using VAPID public key
 * - Return subscription object for server-side storage
 * - Cross-browser compatible (Chrome, Firefox, Safari, Edge)
 * - Graceful fallback if permission denied
 * 
 * Requirements:
 * - HTTPS (required for service workers and push API)
 * - Modern browser with Push API support
 * - Service worker file at /goodlift/service-worker.js
 * 
 * Safari/iOS Notes:
 * - Requires iOS 16.4 or later
 * - Must be triggered by user action (tap/click)
 * - PWA mode recommended for best experience
 * - Limited background push compared to Chrome/Firefox
 */

/**
 * VAPID public key for this application
 * This is the public key configured in Firebase Console and used for Web Push
 * It's safe to include in client-side code as it's a PUBLIC key
 */
const VAPID_PUBLIC_KEY = 'BE0ZQSJHIlmXfeA5ddjITNrqrS0TmGfGGQjBufmOlUKxRUtEwja2qHmTZ0pXHepJzGV2qcwH0gJ_D6ot6cWGB6w';

/**
 * Convert base64-encoded VAPID key to Uint8Array
 * 
 * The Push API requires VAPID keys in Uint8Array format,
 * but they're typically stored as base64 strings. This helper
 * performs the necessary conversion.
 * 
 * @param {string} base64String - Base64-encoded VAPID public key
 * @returns {Uint8Array} Converted key ready for Push API
 * 
 * @example
 * const vapidKey = 'BE0ZQSJHIlmXfeA5ddjITNrq...';
 * const uint8Key = urlBase64ToUint8Array(vapidKey);
 */
function urlBase64ToUint8Array(base64String) {
  // Add padding if needed (base64 strings must be divisible by 4)
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  // Decode base64 to binary string
  const rawData = window.atob(base64);
  
  // Convert binary string to Uint8Array
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  
  return outputArray;
}

/**
 * Subscribe to Web Push notifications
 * 
 * This is the main function to set up push notifications for a user.
 * It will:
 * 1. Check browser compatibility
 * 2. Request notification permission (if not already granted)
 * 3. Register the service worker (if not already registered)
 * 4. Subscribe to push notifications using VAPID key
 * 5. Return the subscription object to send to your server
 * 
 * The subscription object contains:
 * - endpoint: URL to send push notifications to
 * - keys.p256dh: Client public key for encryption
 * - keys.auth: Authentication secret for encryption
 * 
 * Usage:
 * ```javascript
 * import { subscribeToWebPush } from './utils/webPushSubscribe';
 * 
 * // Call from a user action (button click) for best compatibility
 * button.addEventListener('click', async () => {
 *   const subscription = await subscribeToWebPush();
 *   if (subscription) {
 *     // Send subscription to your server
 *     await fetch('/api/subscribe', {
 *       method: 'POST',
 *       body: JSON.stringify(subscription),
 *       headers: { 'Content-Type': 'application/json' }
 *     });
 *   }
 * });
 * ```
 * 
 * @returns {Promise<PushSubscription|null>} Subscription object to send to server, or null if failed
 */
export async function subscribeToWebPush() {
  console.log('[Web Push] ═══════════════════════════════════════');
  console.log('[Web Push] Starting Web Push subscription...');
  
  try {
    // Step 1: Check browser compatibility
    console.log('[Web Push] Step 1: Checking browser compatibility...');
    
    if (!('serviceWorker' in navigator)) {
      console.error('[Web Push] ❌ Service Workers not supported');
      console.error('[Web Push] Push notifications require service worker support');
      console.error('[Web Push] Browser:', navigator.userAgent);
      return null;
    }
    console.log('[Web Push] ✅ Service Workers supported');

    if (!('PushManager' in window)) {
      console.error('[Web Push] ❌ Push Manager API not supported');
      console.error('[Web Push] This browser does not support Web Push');
      console.error('[Web Push] Browser:', navigator.userAgent);
      return null;
    }
    console.log('[Web Push] ✅ Push Manager API supported');
    
    if (!('Notification' in window)) {
      console.error('[Web Push] ❌ Notification API not supported');
      console.error('[Web Push] Browser:', navigator.userAgent);
      return null;
    }
    console.log('[Web Push] ✅ Notification API supported');

    // Step 2: Request notification permission
    console.log('[Web Push] Step 2: Requesting notification permission...');
    console.log('[Web Push] Current permission:', Notification.permission);
    
    if (Notification.permission === 'denied') {
      console.error('[Web Push] ❌ Notification permission denied');
      console.error('[Web Push] User must enable notifications in browser settings:');
      console.error('[Web Push]   Chrome/Edge: Site Settings > Notifications');
      console.error('[Web Push]   Firefox: Page Info > Permissions > Notifications');
      console.error('[Web Push]   Safari: Safari > Settings > Websites > Notifications');
      return null;
    }

    let permission = Notification.permission;
    
    if (permission === 'default') {
      console.log('[Web Push] Requesting permission from user...');
      console.log('[Web Push] User will see permission prompt');
      
      // iOS/Safari: This MUST be called from a user gesture
      permission = await Notification.requestPermission();
      console.log('[Web Push] Permission result:', permission);
      
      if (permission !== 'granted') {
        console.warn('[Web Push] ⚠️  Permission not granted:', permission);
        return null;
      }
    }
    
    console.log('[Web Push] ✅ Notification permission granted');

    // Step 3: Register service worker
    console.log('[Web Push] Step 3: Registering service worker...');
    
    let registration;
    try {
      // Check if service worker is already registered
      const existingRegistration = await navigator.serviceWorker.getRegistration('/goodlift/');
      
      if (existingRegistration) {
        console.log('[Web Push] ✅ Service worker already registered');
        console.log('[Web Push] Scope:', existingRegistration.scope);
        registration = existingRegistration;
      } else {
        console.log('[Web Push] Registering new service worker...');
        registration = await navigator.serviceWorker.register('/goodlift/service-worker.js', {
          scope: '/goodlift/'
        });
        console.log('[Web Push] ✅ Service worker registered');
        console.log('[Web Push] Scope:', registration.scope);
      }
    } catch (error) {
      console.error('[Web Push] ❌ Service worker registration failed:', error);
      console.error('[Web Push] Make sure service-worker.js exists and is accessible');
      console.error('[Web Push] Ensure you are on HTTPS (or localhost)');
      throw error;
    }

    // Wait for service worker to be ready
    console.log('[Web Push] Waiting for service worker to be ready...');
    registration = await navigator.serviceWorker.ready;
    console.log('[Web Push] ✅ Service worker ready');
    
    if (!registration.active) {
      console.error('[Web Push] ❌ Service worker not active');
      return null;
    }

    // Step 4: Check for existing subscription
    console.log('[Web Push] Step 4: Checking for existing subscription...');
    
    const existingSubscription = await registration.pushManager.getSubscription();
    
    if (existingSubscription) {
      console.log('[Web Push] ✅ Already subscribed to push notifications');
      console.log('[Web Push] Endpoint:', existingSubscription.endpoint.substring(0, 60) + '...');
      console.log('[Web Push] Expiration:', existingSubscription.expirationTime || 'Never');
      console.log('[Web Push] 📋 Subscription object (send to server):');
      console.log(JSON.stringify(existingSubscription, null, 2));
      return existingSubscription;
    }
    
    console.log('[Web Push] No existing subscription found');

    // Step 5: Subscribe to push notifications
    console.log('[Web Push] Step 5: Creating push subscription...');
    console.log('[Web Push] Using VAPID key:', VAPID_PUBLIC_KEY.substring(0, 20) + '...');
    
    // Convert VAPID key to Uint8Array
    const applicationServerKey = urlBase64ToUint8Array(VAPID_PUBLIC_KEY);
    console.log('[Web Push] VAPID key converted to Uint8Array');
    
    // Subscribe to push
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true, // Required: all notifications must be visible
      applicationServerKey: applicationServerKey
    });

    console.log('[Web Push] ═══════════════════════════════════════');
    console.log('[Web Push] ✅ Successfully subscribed to Web Push!');
    console.log('[Web Push] ═══════════════════════════════════════');
    console.log('[Web Push] 📋 Subscription Details:');
    console.log('[Web Push]');
    console.log('[Web Push] Endpoint:', subscription.endpoint);
    console.log('[Web Push] Keys:', {
      p256dh: subscription.keys?.p256dh ? 'Present' : 'Missing',
      auth: subscription.keys?.auth ? 'Present' : 'Missing'
    });
    console.log('[Web Push]');
    console.log('[Web Push] 📤 Full subscription object (send to your server):');
    console.log(JSON.stringify(subscription, null, 2));
    console.log('[Web Push]');
    console.log('[Web Push] 📚 Next Steps:');
    console.log('[Web Push] 1. Send this subscription object to your backend server');
    console.log('[Web Push] 2. Store it in your database (linked to user/device)');
    console.log('[Web Push] 3. Use web-push library to send notifications:');
    console.log('[Web Push]    npm install web-push');
    console.log('[Web Push]    const webpush = require("web-push");');
    console.log('[Web Push]    webpush.sendNotification(subscription, payload);');
    console.log('[Web Push] ═══════════════════════════════════════');
    
    return subscription;

  } catch (error) {
    console.error('[Web Push] ═══════════════════════════════════════');
    console.error('[Web Push] ❌ Error subscribing to Web Push');
    console.error('[Web Push] Error name:', error.name);
    console.error('[Web Push] Error message:', error.message);
    
    // Provide helpful error guidance
    if (error.name === 'NotAllowedError') {
      console.error('[Web Push] Permission not allowed:');
      console.error('[Web Push]   - User denied permission');
      console.error('[Web Push]   - On iOS: Must be triggered by user action (tap/click)');
      console.error('[Web Push]   - Check browser notification settings');
    } else if (error.name === 'NotSupportedError') {
      console.error('[Web Push] Feature not supported:');
      console.error('[Web Push]   - Browser may be too old');
      console.error('[Web Push]   - Check for HTTPS (required)');
      console.error('[Web Push]   - iOS requires 16.4+');
    } else if (error.name === 'AbortError') {
      console.error('[Web Push] Operation aborted:');
      console.error('[Web Push]   - Service worker issue');
      console.error('[Web Push]   - Try reloading the page');
    } else if (error.name === 'InvalidStateError') {
      console.error('[Web Push] Invalid state:');
      console.error('[Web Push]   - Service worker not properly registered');
      console.error('[Web Push]   - Check service worker status');
    }
    
    console.error('[Web Push] Full error:', error);
    console.error('[Web Push] ═══════════════════════════════════════');
    
    return null;
  }
}

/**
 * Get existing push subscription
 * 
 * Checks if the user is already subscribed to push notifications
 * without creating a new subscription.
 * 
 * @returns {Promise<PushSubscription|null>} Existing subscription or null
 * 
 * @example
 * const subscription = await getExistingSubscription();
 * if (subscription) {
 *   console.log('Already subscribed:', subscription.endpoint);
 * } else {
 *   console.log('Not subscribed yet');
 * }
 */
export async function getExistingSubscription() {
  try {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      return null;
    }

    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    
    if (subscription) {
      console.log('[Web Push] Found existing subscription');
      console.log('[Web Push] Endpoint:', subscription.endpoint.substring(0, 60) + '...');
    }
    
    return subscription;
  } catch (error) {
    console.error('[Web Push] Error checking subscription:', error);
    return null;
  }
}

/**
 * Unsubscribe from push notifications
 * 
 * Removes the push subscription, stopping all push notifications
 * to this device/browser.
 * 
 * @returns {Promise<boolean>} True if successfully unsubscribed
 * 
 * @example
 * const success = await unsubscribeFromWebPush();
 * if (success) {
 *   console.log('Unsubscribed successfully');
 *   // Optionally notify your server to remove the subscription
 * }
 */
export async function unsubscribeFromWebPush() {
  try {
    const subscription = await getExistingSubscription();
    
    if (!subscription) {
      console.log('[Web Push] No active subscription to unsubscribe from');
      return false;
    }

    const successful = await subscription.unsubscribe();
    
    if (successful) {
      console.log('[Web Push] ✅ Successfully unsubscribed from push notifications');
      console.log('[Web Push] Remember to remove subscription from your server database');
    }
    
    return successful;
  } catch (error) {
    console.error('[Web Push] ❌ Error unsubscribing:', error);
    return false;
  }
}

/**
 * Check if browser supports Web Push
 * 
 * Performs a quick check to determine if the current browser
 * supports the Web Push API.
 * 
 * @returns {boolean} True if Web Push is supported
 * 
 * @example
 * if (isWebPushSupported()) {
 *   // Show notification opt-in UI
 * } else {
 *   // Hide notification features
 * }
 */
export function isWebPushSupported() {
  return (
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  );
}

/**
 * Export the VAPID public key for reference
 * (e.g., for testing or displaying to developers)
 */
export { VAPID_PUBLIC_KEY };
