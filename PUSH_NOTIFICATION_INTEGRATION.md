# Push Notification Integration Documentation

## Overview

This implementation integrates browser push notification subscription using the Web Push API and VAPID (Voluntary Application Server Identification) protocol. The subscription happens automatically when the app loads, assuming the user grants permission.

## Files Added/Modified

### New Files

1. **`src/utils/pushNotifications.js`**
   - Core utility module for push notification functionality
   - Functions:
     - `urlBase64ToUint8Array()`: Converts base64 VAPID key to Uint8Array
     - `subscribeToPushNotifications()`: Main subscription function
     - `getExistingSubscription()`: Check for active subscriptions
     - `unsubscribeFromPushNotifications()`: Remove subscription

2. **`src/utils/pushNotificationInit.js`**
   - Initialization module that auto-subscribes users
   - Contains the VAPID public key from `vapid-key.env`
   - Functions:
     - `initializePushNotifications()`: Auto-subscribe on app load
     - `requestPushNotificationSubscription()`: Manual subscription trigger

### Modified Files

1. **`src/main.jsx`**
   - Added import for push notification initialization
   - Added event listener to call `initializePushNotifications()` on page load
   - Only executes if browser supports service workers and push API

2. **`public/service-worker.js`**
   - Added `push` event handler to receive push notifications
   - Added `notificationclick` event handler to handle user clicks
   - Proper parsing of notification data with fallbacks

## How It Works

### Initialization Flow

1. When the app loads, `main.jsx` checks for browser support
2. If supported, `initializePushNotifications()` is called
3. The function checks for an existing subscription
4. If no subscription exists, it requests notification permission
5. Once permission is granted, it subscribes via the service worker
6. The subscription object is logged to console with backend integration instructions

### VAPID Key

The VAPID public key is stored in `vapid-key.env`:
```
REACT_APP_VAPID_PUBLIC_KEY=BE0ZQSJHIlmXfeA5ddjITNrqrS0TmGfGGQjBufmOlUKxRUtEwja2qHmTZ0pXHepJzGV2qcwH0gJ_D6ot6cWGB6w
```

This public key is hardcoded in `pushNotificationInit.js` for simplicity. Since it's a public key, it's safe to include in client-side code.

### Console Output

When a user is successfully subscribed, the console will display:

```
[Push Init] Initializing push notification subscription...
[Push Notifications] Requesting notification permission...
[Push Notifications] Notification permission granted
[Push Notifications] Waiting for service worker to be ready...
[Push Notifications] Service worker is ready
[Push Notifications] Subscribing to push notifications...
[Push Notifications] ✅ Successfully subscribed to push notifications!
[Push Notifications] 📋 Subscription object:
{
  "endpoint": "https://...",
  "keys": {
    "p256dh": "...",
    "auth": "..."
  }
}

[Push Notifications] 📤 To enable push notifications:
1. Send this subscription object to your backend server
2. Store it in your database associated with this user
3. Use it to send push notifications via web-push library or similar

Example backend code (Node.js with web-push):
const webpush = require("web-push");
webpush.sendNotification(subscription, "Your notification message");
```

## Backend Integration

To send push notifications from your backend:

### Node.js Example

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
