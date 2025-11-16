# GoodLift Push Notifications - Quick Start Guide

## Overview

GoodLift now supports **dual push notification systems** for maximum reliability and flexibility:
- 🔥 **Firebase Cloud Messaging (FCM)** - Enterprise-grade, cross-platform
- 🌐 **Native Web Push API** - Direct browser notifications

Both systems are automatically initialized when the app loads and use the same VAPID key configured in Firebase Console.

## For Users

### What Happens When You Use the App

1. **First Visit**: You'll be prompted to allow notifications
2. **If You Allow**: Both notification systems are automatically set up
3. **Console Output**: Open DevTools to see subscription details for backend integration

### Browser Support

- ✅ Chrome/Edge (Desktop & Android)
- ✅ Firefox (Desktop & Android)
- ✅ Safari (iOS 16.4+, limited)
- ✅ Opera

## For Developers

### Quick Test

1. Build and run the app: `npm run build && npm run preview`
2. Open browser DevTools console
3. Look for the initialization messages:
```
[Push Init] 🎉 Push notification setup complete!
```

### Getting Tokens for Backend

Open the browser console after loading the app. You'll see:

**FCM Token** (for Firebase Admin SDK):
```
[FCM] 📋 FCM Token: cXt7Y3Rh2ZWFjdG9yLXB...
```

**Web Push Subscription** (for web-push library):
```json
[Push Notifications] 📋 Subscription object:
{
  "endpoint": "https://fcm.googleapis.com/fcm/send/...",
  "keys": {
    "p256dh": "BKxO...",
    "auth": "MzQ..."
  }
}
```

### Sending Test Notifications

#### Using Firebase Cloud Messaging

**Via Firebase Console:**
1. Go to Firebase Console > Cloud Messaging
2. Click "Send your first message"
3. Enter title and body
4. Click "Send test message"
5. Paste the FCM token from console
6. Click "Test"

**Via Firebase Admin SDK (Node.js):**
```javascript
const admin = require('firebase-admin');

// Initialize once
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

// Send notification
admin.messaging().send({
  token: 'FCM_TOKEN_FROM_CONSOLE',
  notification: {
    title: 'Test Notification',
    body: 'This is a test from Firebase!'
  }
});
```

#### Using Web Push Library

```javascript
const webpush = require('web-push');

// Set VAPID details (once)
webpush.setVapidDetails(
  'mailto:your-email@example.com',
  'BE0ZQSJHIlmXfeA5ddjITNrqrS0TmGfGGQjBufmOlUKxRUtEwja2qHmTZ0pXHepJzGV2qcwH0gJ_D6ot6cWGB6w',
  'YOUR_PRIVATE_KEY_HERE' // Keep this secure!
);

// Send notification
const subscription = { /* paste from console */ };
const payload = JSON.stringify({
  title: 'Test Notification',
  body: 'This is a test from Web Push!'
});

webpush.sendNotification(subscription, payload);
```

## Architecture

### Service Workers

**`firebase-messaging-sw.js`**
- Handles Firebase Cloud Messaging background notifications
- Registered automatically by Firebase SDK
- Scope: `/`

**`service-worker.js`**
- Handles native Web Push notifications
- Also handles app caching for PWA
- Scope: `/goodlift/`

### Code Structure

```
src/
├── utils/
│   ├── pushNotifications.js      # Web Push utilities
│   └── pushNotificationInit.js   # Dual initialization
├── services/
│   └── pushNotificationService.js # FCM token management
└── main.jsx                       # Initialization trigger

public/
├── firebase-messaging-sw.js       # FCM service worker
└── service-worker.js              # Web Push + PWA cache
```

### Initialization Flow

```
App Load (main.jsx)
    ↓
Feature Detection
    ↓
initializePushNotifications()
    ↓
├─→ getFCMToken()              ─→ FCM Token
└─→ subscribeToPushNotifications() ─→ Web Push Subscription
```

## Configuration

### VAPID Key Location

The VAPID public key is configured in multiple places for redundancy:

1. **Firebase Console**
   - Project Settings > Cloud Messaging > Web Push certificates
   - This is where Firebase validates the key

2. **Source Code**
   - `vapid-key.env` (source of truth)
   - `src/utils/pushNotificationInit.js` (for Web Push)
   - `src/services/pushNotificationService.js` (for FCM)

3. **Value**
   ```
   BE0ZQSJHIlmXfeA5ddjITNrqrS0TmGfGGQjBufmOlUKxRUtEwja2qHmTZ0pXHepJzGV2qcwH0gJ_D6ot6cWGB6w
   ```

## Troubleshooting

### "Service workers not supported"
- Ensure you're using HTTPS (or localhost)
- Check browser compatibility
- Update to latest browser version

### "Permission denied"
- User must manually grant permission
- Check browser notification settings
- Clear site data and try again

### "No FCM token"
- Check Firebase project configuration
- Verify VAPID key in Firebase Console
- Check browser console for errors

### "Notifications not showing"
- Check notification permission status
- Verify service worker is registered
- Test with browser in focus and background
- Check browser Do Not Disturb settings

## Production Deployment

### Pre-deployment Checklist

- [ ] VAPID key configured in Firebase Console
- [ ] Firebase Security Rules configured
- [ ] Backend ready to receive tokens/subscriptions
- [ ] HTTPS enabled on hosting
- [ ] Privacy policy updated
- [ ] Rate limiting implemented on backend
- [ ] Token cleanup process in place
- [ ] Unsubscribe functionality in UI

### Backend Requirements

**For FCM:**
- Firebase Admin SDK with service account
- Database to store user → FCM token mapping
- Token refresh handling
- Invalid token cleanup

**For Web Push:**
- VAPID private key secured (environment variable)
- Database to store user → subscription mapping
- Subscription validation
- Expiration handling

## Documentation

- **[PUSH_NOTIFICATION_INTEGRATION.md](./PUSH_NOTIFICATION_INTEGRATION.md)** - Complete technical documentation
- **[SECURITY_SUMMARY_PUSH_NOTIFICATIONS.md](./SECURITY_SUMMARY_PUSH_NOTIFICATIONS.md)** - Security analysis and guidelines

## Support

### Browser Console Commands

Check if subscribed:
```javascript
navigator.serviceWorker.ready.then(reg => 
  reg.pushManager.getSubscription().then(sub => console.log(sub))
);
```

Manually trigger subscription:
```javascript
import { requestPushNotificationSubscription } from './src/utils/pushNotificationInit';
requestPushNotificationSubscription();
```

## License

This push notification implementation is part of the GoodLift project and follows the same license.

---

**Questions?** Check the comprehensive documentation or open an issue.

**Ready to send notifications?** Grab the tokens from the console and start your backend integration!
