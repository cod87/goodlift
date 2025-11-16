# Push Notification Integration Documentation

## Overview

This implementation integrates **dual push notification systems**:
1. **Firebase Cloud Messaging (FCM)** - Enterprise-grade push notifications via Firebase
2. **Native Web Push API** - Direct browser push notifications using VAPID protocol

Both systems use the same VAPID public key configured in Firebase Console and the codebase.

## VAPID Key Configuration

The VAPID public key `BE0ZQSJHIlmXfeA5ddjITNrqrS0TmGfGGQjBufmOlUKxRUtEwja2qHmTZ0pXHepJzGV2qcwH0gJ_D6ot6cWGB6w` is configured in:
- ✅ Firebase Console > Project Settings > Cloud Messaging > Web Push certificates
- ✅ `vapid-key.env` file in the project root
- ✅ Client-side code (`src/utils/pushNotificationInit.js` and `src/services/pushNotificationService.js`)

## Files Added/Modified

### New Files

1. **`src/utils/pushNotifications.js`**
   - Core utility module for native Web Push API
   - Functions:
     - `urlBase64ToUint8Array()`: Converts base64 VAPID key to Uint8Array
     - `subscribeToPushNotifications()`: Main subscription function
     - `getExistingSubscription()`: Check for active subscriptions
     - `unsubscribeFromPushNotifications()`: Remove subscription

2. **`src/utils/pushNotificationInit.js`**
   - Initialization module that sets up BOTH FCM and Web Push
   - Contains the VAPID public key
   - Functions:
     - `initializePushNotifications()`: Auto-subscribe on app load (dual setup)
     - `requestPushNotificationSubscription()`: Manual subscription trigger

### Modified Files

1. **`src/main.jsx`**
   - Added import for push notification initialization
   - Added event listener to call `initializePushNotifications()` on page load
   - Only executes if browser supports service workers and push API

2. **`src/services/pushNotificationService.js`**
   - Updated VAPID key from placeholder to actual key
   - Updated `getFCMToken()` to use the VAPID key with Firebase `getToken()`
   - Added detailed logging for FCM token acquisition

3. **`public/service-worker.js`**
   - Added `push` event handler for native Web Push notifications
   - Added `notificationclick` event handler to handle user clicks
   - Proper parsing of notification data with fallbacks

4. **`public/firebase-messaging-sw.js`**
   - Added VAPID key documentation in comments
   - Improved notification options (better icons, vibration)
   - Enhanced notification click handler to focus existing windows
   - Better logging with FCM-specific prefixes

## How It Works

### Dual Initialization Flow

When the app loads, both push notification systems are initialized:

#### Firebase Cloud Messaging (FCM) Flow:
1. App loads and `initializePushNotifications()` is called
2. `getFCMToken()` is invoked from `pushNotificationService.js`
3. Requests notification permission if not already granted
4. Calls Firebase's `getToken()` with the VAPID key
5. Receives FCM token for this device/browser
6. Logs FCM token to console for backend integration
7. Foreground messages handled by `onMessage()` listener
8. Background messages handled by `firebase-messaging-sw.js`

#### Native Web Push API Flow:
1. Checks for existing push subscription
2. If no subscription exists, requests notification permission
3. Waits for service worker to be ready
4. Converts VAPID key from base64 to Uint8Array
5. Subscribes via `pushManager.subscribe()` with VAPID key
6. Logs subscription object to console for backend integration
7. Push events handled by `service-worker.js`

### VAPID Key

The VAPID public key is stored in `vapid-key.env` and configured in Firebase:
```
REACT_APP_VAPID_PUBLIC_KEY=BE0ZQSJHIlmXfeA5ddjITNrqrS0TmGfGGQjBufmOlUKxRUtEwja2qHmTZ0pXHepJzGV2qcwH0gJ_D6ot6cWGB6w
```

**Firebase Configuration:**
- Go to Firebase Console > Project Settings > Cloud Messaging
- Click "Web Push certificates" tab
- The VAPID key pair is configured there
- The public key shown above is used by clients
- The private key remains on Firebase servers

### Console Output

When a user's push notifications are initialized, the console will display:

```
[Push Init] Initializing push notification subscription...
[Push Init] Setting up both Firebase Cloud Messaging and native Web Push API
[Push Init] Step 1: Getting Firebase Cloud Messaging token...
[FCM] Requesting FCM token with VAPID key...
[FCM] ✅ FCM token obtained successfully
[FCM] 📋 FCM Token: cXt7Y3Rh...
[FCM] 📤 Send this token to your backend to enable Firebase push notifications
[Push Init] ✅ Firebase Cloud Messaging initialized

[Push Init] Step 2: Setting up native Web Push API subscription...
[Push Notifications] Requesting notification permission...
[Push Notifications] Notification permission granted
[Push Notifications] Waiting for service worker to be ready...
[Push Notifications] Service worker is ready
[Push Notifications] Subscribing to push notifications...
[Push Notifications] ✅ Successfully subscribed to push notifications!
[Push Notifications] 📋 Subscription object: {...}

[Push Init] ═══════════════════════════════════════════════════════
[Push Init] 🎉 Push notification setup complete!
[Push Init] ═══════════════════════════════════════════════════════
[Push Init] You now have two ways to send push notifications:
[Push Init] 1️⃣  Firebase Cloud Messaging (FCM):
[Push Init]     - Use the FCM token logged above
[Push Init]     - Send via Firebase Admin SDK or FCM REST API
[Push Init]     - Background messages handled by firebase-messaging-sw.js
[Push Init] 2️⃣  Native Web Push API:
[Push Init]     - Use the subscription object logged above
[Push Init]     - Send via web-push library or any Web Push service
[Push Init]     - Push events handled by service-worker.js
[Push Init] ═══════════════════════════════════════════════════════
```

## Backend Integration

You now have **two methods** to send push notifications:

### Method 1: Firebase Cloud Messaging (Recommended)

Firebase handles the complexity of push notifications across platforms.

#### Setup:
1. Use the FCM token logged in the console
2. Store it in your database associated with each user
3. Send notifications via Firebase Admin SDK

#### Node.js Example (Firebase Admin SDK):

```javascript
const admin = require('firebase-admin');

// Initialize Firebase Admin (one time setup)
admin.initializeApp({
  credential: admin.credential.cert(serviceAccountKey),
  projectId: 'goodlift-7760a'
});

// Send notification to a specific user
async function sendFCMNotification(fcmToken, title, body) {
  const message = {
    notification: {
      title: title,
      body: body
    },
    token: fcmToken
  };

  try {
    const response = await admin.messaging().send(message);
    console.log('Successfully sent FCM message:', response);
    return response;
  } catch (error) {
    console.error('Error sending FCM message:', error);
    throw error;
  }
}

// Usage:
sendFCMNotification(
  'cXt7Y3Rh...', // FCM token from console
  'Workout Reminder',
  'Time for your daily workout!'
);
```

#### FCM REST API Example:

```bash
curl -X POST https://fcm.googleapis.com/v1/projects/goodlift-7760a/messages:send \
  -H "Authorization: Bearer YOUR_SERVER_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "message": {
      "token": "FCM_TOKEN_HERE",
      "notification": {
        "title": "GoodLift Reminder",
        "body": "Time for your workout!"
      }
    }
  }'
```

### Method 2: Native Web Push API

### Method 2: Native Web Push API

Direct browser push notifications using the web-push library.

#### Node.js Example:

```javascript
const webpush = require('web-push');

// Set VAPID details (you need both public and private keys)
webpush.setVapidDetails(
  'mailto:your-email@example.com',
  'BE0ZQSJHIlmXfeA5ddjITNrqrS0TmGfGGQjBufmOlUKxRUtEwja2qHmTZ0pXHepJzGV2qcwH0gJ_D6ot6cWGB6w', // public key
  'YOUR_PRIVATE_VAPID_KEY' // private key from vapid-key.env
);

// Send notification
const subscription = {
  endpoint: '...',
  keys: {
    p256dh: '...',
    auth: '...'
  }
};

const payload = JSON.stringify({
  title: 'GoodLift Reminder',
  body: 'Time for your workout!',
  icon: '/goodlift/icons/goodlift-icon-192.png'
});

webpush.sendNotification(subscription, payload)
  .then(response => console.log('Notification sent'))
  .catch(error => console.error('Error sending notification:', error));
```

### Which Method to Use?

**Use Firebase Cloud Messaging if:**
- ✅ You want unified notifications across web, iOS, and Android
- ✅ You need advanced features (topics, device groups, analytics)
- ✅ You want Firebase to handle token refresh and cleanup
- ✅ You're already using Firebase for your app

**Use Native Web Push API if:**
- ✅ You want complete control over the push notification flow
- ✅ You're not using Firebase for other services
- ✅ You want to avoid vendor lock-in
- ✅ You need custom push notification handling

**Best Practice:** Use both! Firebase for reliability and features, Web Push as a fallback.

## Testing

### Browser Console Testing

1. Open the app in a browser that supports push notifications (Chrome, Firefox, Edge)
2. Open browser DevTools console
3. Grant notification permission when prompted
4. Check console for subscription object
5. Copy the subscription object for backend testing

### Manual Subscription

You can also trigger subscription manually from anywhere in the app:

```javascript
import { requestPushNotificationSubscription } from './utils/pushNotificationInit';

// In your component or function
const handleEnableNotifications = async () => {
  const subscription = await requestPushNotificationSubscription();
  if (subscription) {
    console.log('User subscribed:', subscription);
    // Send subscription to your backend
  }
};
```

## Browser Compatibility

- **Chrome/Edge**: Full support
- **Firefox**: Full support
- **Safari**: iOS 16.4+ (limited support)
- **Opera**: Full support

## Security Considerations

1. The VAPID public key is safe to expose in client-side code
2. The private VAPID key should NEVER be exposed and must remain server-side
3. All push notifications require user permission
4. Subscriptions are tied to the service worker registration

## Troubleshooting

### "Service workers are not supported"
- Use HTTPS (service workers require secure context)
- Test on localhost (allowed without HTTPS)

### "Notification permission denied"
- User must manually grant permission
- Once denied, user must change permission in browser settings

### "Push subscription failed"
- Check that service worker is registered correctly
- Verify VAPID key is correct
- Check browser console for detailed error messages

## Future Enhancements

- Add UI controls for users to enable/disable notifications
- Implement notification preferences (frequency, types)
- Add notification scheduling
- Integrate with existing Firebase Cloud Messaging setup
