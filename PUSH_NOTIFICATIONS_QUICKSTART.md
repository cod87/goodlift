# GoodLift Push Notifications - Quick Start Guide

## Overview

GoodLift now supports **dual push notification systems** for maximum reliability and flexibility:
- 🔥 **Firebase Cloud Messaging (FCM)** - Enterprise-grade, cross-platform
- 🌐 **Native Web Push API** - Direct browser notifications via PWA

Both systems are automatically initialized when the app loads and use the same VAPID key configured in Firebase Console.

## ⚠️ **IMPORTANT: Requirements**

### HTTPS Required
- ✅ **HTTPS connection is MANDATORY** for push notifications and service workers
- ✅ Works on `localhost` for development (no HTTPS needed locally)
- ❌ Push notifications will NOT work on HTTP sites in production
- **Why?** Service Workers and Push API are only available on secure origins for security reasons

### Service Worker Requirements
- Must be accessible at `/goodlift/service-worker.js`
- Must be served with correct MIME type (`text/javascript` or `application/javascript`)
- Must be same-origin with the application

### Progressive Web App (PWA) Requirements for iOS
- App must be installable as a PWA (requires `manifest.json`)
- User should add app to home screen for best iOS experience
- HTTPS is required (iOS strictly enforces secure contexts)

## For Users

### What Happens When You Use the App

1. **First Visit**: You'll be prompted to allow notifications
2. **If You Allow**: Both notification systems are automatically set up
3. **Console Output**: Open DevTools to see subscription details for backend integration

### Browser Support

| Browser | Platform | Status | Notes |
|---------|----------|--------|-------|
| **Chrome** | Desktop | ✅ Full Support | Best experience |
| **Chrome** | Android | ✅ Full Support | Excellent |
| **Firefox** | Desktop | ✅ Full Support | Excellent |
| **Firefox** | Android | ✅ Full Support | Excellent |
| **Safari** | macOS 13+ | ✅ Supported | Limited features |
| **Safari** | **iOS 16.4+** | ✅ Supported | **PWA required, see notes below** |
| **Edge** | Desktop | ✅ Full Support | Chromium-based |
| **Opera** | Desktop | ✅ Full Support | Chromium-based |

### 📱 Safari Mobile (iOS) - Special Considerations

**iOS 16.4+ is required** for Web Push support. Key limitations:

1. **Must be triggered by user action**
   - Permission request MUST come from a user gesture (tap/click)
   - Automatic permission requests will fail silently
   - Best practice: Add a "Enable Notifications" button

2. **PWA Mode Recommended**
   - Add app to home screen for best experience
   - In-browser experience has limitations
   - Full-screen PWA mode works better

3. **Background Push Limitations**
   - iOS restricts background push compared to Chrome/Firefox
   - Notifications may be delayed when app is not in use
   - Push is more reliable when app is open or recently used

4. **Service Worker Scope**
   - Service worker must be at root or proper scope
   - Check that `/goodlift/service-worker.js` is accessible

5. **Debugging iOS Push**
   - Use Safari DevTools on Mac (Develop menu → [Device])
   - Check Console for service worker registration errors
   - Verify notification permission in iOS Settings → Safari

## For Developers

### Using the Web Push API Utility

GoodLift provides a standalone utility (`src/utils/webPushSubscribe.js`) for subscribing to Web Push notifications:

```javascript
import { subscribeToWebPush, getExistingSubscription, unsubscribeFromWebPush } from './utils/webPushSubscribe';

// Subscribe to push notifications (from a button click for iOS compatibility)
async function enableNotifications() {
  const subscription = await subscribeToWebPush();
  
  if (subscription) {
    // Send subscription to your backend
    await fetch('/api/push/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(subscription)
    });
    
    console.log('Subscribed!', subscription);
  } else {
    console.error('Failed to subscribe');
  }
}

// Check existing subscription
async function checkSubscription() {
  const subscription = await getExistingSubscription();
  if (subscription) {
    console.log('Already subscribed:', subscription.endpoint);
    return true;
  }
  return false;
}

// Unsubscribe from notifications
async function disableNotifications() {
  const success = await unsubscribeFromWebPush();
  if (success) {
    // Notify your backend to remove subscription
    console.log('Unsubscribed successfully');
  }
}
```

**Important:** Call `subscribeToWebPush()` from a user action (button click) for iOS/Safari compatibility!

### Extracting Subscription Object for Server

The subscription object returned by `subscribeToWebPush()` contains everything your server needs:

```json
{
  "endpoint": "https://fcm.googleapis.com/fcm/send/ABC123...",
  "expirationTime": null,
  "keys": {
    "p256dh": "BKxO8HfJ3K...",
    "auth": "MzQ5Ng..."
  }
}
```

**What each field means:**
- `endpoint`: URL to send push notifications to (unique per user/device)
- `keys.p256dh`: Public key for encrypting notification payload
- `keys.auth`: Authentication secret for message encryption

**Save this entire object in your database linked to the user/device!**

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
[Web Push] 📋 Subscription object:
{
  "endpoint": "https://fcm.googleapis.com/fcm/send/...",
  "keys": {
    "p256dh": "BKxO...",
    "auth": "MzQ..."
  }
}
```

Copy the entire subscription object from the console and save it to your database.

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

**`service-worker.js`** ⭐ Main service worker for Web Push
- Handles native Web Push notifications
- Listens for `push` events from the browser
- Displays notifications with `showNotification()`
- Handles notification clicks with `notificationclick` event
- Also handles app caching for PWA offline support
- Scope: `/goodlift/`
- **Must be served over HTTPS** (or localhost for dev)

### Code Structure

```
src/
├── utils/
│   ├── webPushSubscribe.js        # ⭐ NEW: Standalone Web Push utility
│   ├── pushNotifications.js       # Web Push utilities (legacy)
│   └── pushNotificationInit.js    # Dual initialization (FCM + Web Push)
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
   - `src/utils/webPushSubscribe.js` ⭐ (NEW standalone utility)
   - `src/utils/pushNotificationInit.js` (for Web Push)
   - `src/services/pushNotificationService.js` (for FCM)

3. **Value**
   ```
   BE0ZQSJHIlmXfeA5ddjITNrqrS0TmGfGGQjBufmOlUKxRUtEwja2qHmTZ0pXHepJzGV2qcwH0gJ_D6ot6cWGB6w
   ```

## Troubleshooting

### ❌ "Service workers not supported" or "Push Manager not available"

**Cause:** Running on HTTP or incompatible browser

**Solutions:**
- ✅ **Use HTTPS in production** (REQUIRED - service workers only work on secure origins)
- ✅ **Use `localhost` for development** (HTTP allowed on localhost only)
- ✅ Check browser version:
  - Chrome/Edge: Version 50+
  - Firefox: Version 44+
  - Safari: Version 16+ (macOS 13+), iOS 16.4+
  - Opera: Version 37+
- ❌ **HTTP will NOT work** in production (security restriction)

**Verify HTTPS:**
```javascript
console.log('Protocol:', window.location.protocol); // Should be 'https:'
console.log('Service Worker support:', 'serviceWorker' in navigator);
console.log('Push Manager support:', 'PushManager' in window);
```

### ❌ "Permission denied" or Permission stays "default"

**Cause:** User denied permission or iOS requires user gesture

**Solutions:**
- **For iOS/Safari:** Permission request MUST be triggered by user action
  ```javascript
  // ❌ BAD: Automatic on page load (fails on iOS)
  subscribeToWebPush();
  
  // ✅ GOOD: From button click (works on iOS)
  button.addEventListener('click', () => {
    subscribeToWebPush();
  });
  ```
- **Reset permission:** Clear site data in browser settings
  - Chrome: Site Settings > Reset permissions
  - Safari: Settings > Websites > Notifications > Remove
- **Check system settings:**
  - macOS: System Preferences > Notifications
  - iOS: Settings > Safari > Notifications
- User must manually grant permission if previously denied

### ❌ "Service worker registration failed" or 404 on service-worker.js

**Cause:** Service worker file not accessible or wrong path

**Solutions:**
- ✅ Verify file exists at `/goodlift/service-worker.js` (adjust path to your deployment)
- ✅ Check MIME type is correct: `text/javascript` or `application/javascript`
- ✅ Ensure file is served over HTTPS
- ✅ Check service worker scope matches app scope
- ✅ Test accessibility:
  ```bash
  curl -I https://yourdomain.com/goodlift/service-worker.js
  # Should return 200 OK with correct Content-Type
  ```

### ❌ "No FCM token"
- Check Firebase project configuration
- Verify VAPID key in Firebase Console
- Check browser console for errors
- FCM not supported on Safari (this is expected)

### ❌ "Notifications not showing"
- Check notification permission status: `console.log(Notification.permission)`
- Verify service worker is registered:
  ```javascript
  navigator.serviceWorker.getRegistration().then(reg => console.log(reg));
  ```
- Test with browser in focus and background (behavior differs)
- Check browser Do Not Disturb settings
- On iOS: Check that app is in PWA mode (added to home screen)
- Verify `push` event listener exists in service worker

### 📱 iOS-Specific Issues

**Problem: "Permission prompt doesn't appear on iOS"**
- Solution: Call `subscribeToWebPush()` from a user tap/click event
- iOS blocks automatic permission requests for security

**Problem: "Notifications work in browser but not when added to home screen"**
- iOS PWA has stricter requirements
- Ensure `manifest.json` is properly configured
- Check that service worker scope matches PWA scope

**Problem: "Push works on Chrome but not Safari"**
- Safari/iOS support is more limited
- Check iOS version (16.4+ required)
- Use Safari DevTools on Mac to debug
- FCM is not supported on Safari (use Web Push API only)

## Production Deployment

### Pre-deployment Checklist

**Critical Requirements:**
- [ ] **HTTPS enabled on hosting** ⚠️ REQUIRED - Push API will not work on HTTP
- [ ] **Service worker accessible** - Verify `/goodlift/service-worker.js` returns 200 OK
- [ ] **Correct MIME type** - Service worker must be served as `text/javascript` or `application/javascript`
- [ ] **VAPID key configured** in Firebase Console (if using FCM)
- [ ] **VAPID private key secured** in environment variable (for Web Push backend)

**Backend Integration:**
- [ ] Backend ready to receive tokens/subscriptions
- [ ] Database schema for storing subscriptions
- [ ] API endpoints for subscribe/unsubscribe
- [ ] Token refresh handling (FCM)
- [ ] Invalid subscription cleanup

**User Experience:**
- [ ] Permission request triggered by user action (iOS compatibility)
- [ ] Privacy policy updated (mention push notifications)
- [ ] Unsubscribe functionality in UI
- [ ] Clear opt-in messaging

**Production Best Practices:**
- [ ] Rate limiting implemented on backend
- [ ] Error tracking and monitoring
- [ ] Graceful fallback if push not supported
- [ ] Test on iOS 16.4+ devices
- [ ] Test PWA mode on iOS (add to home screen)

### HTTPS Setup Guide

**Why HTTPS is Required:**
- Service Workers are restricted to secure contexts for security
- Push API is only available on HTTPS origins
- Browser security policy enforces this (cannot be bypassed)

**Development:**
```bash
# Option 1: Use localhost (no HTTPS needed)
npm run dev  # Runs on http://localhost:5173

# Option 2: Use HTTPS locally with mkcert
npm install -g mkcert
mkcert -install
mkcert localhost
# Then configure Vite to use the generated certificates
```

**Production Hosting Options:**
1. **GitHub Pages** - Free HTTPS (already set up for this project)
2. **Netlify** - Free HTTPS, automatic SSL
3. **Vercel** - Free HTTPS, automatic SSL
4. **Firebase Hosting** - Free HTTPS, integrates with FCM
5. **Cloudflare Pages** - Free HTTPS, CDN included

**Verify HTTPS in Production:**
```bash
# Check if service worker is accessible
curl -I https://yourdomain.com/goodlift/service-worker.js

# Should return:
# HTTP/2 200
# content-type: text/javascript
# (or application/javascript)
```

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
- `web-push` npm package for sending notifications

**Example Web Push Backend (Node.js):**
```javascript
const webpush = require('web-push');

// Configure VAPID keys (do once at startup)
webpush.setVapidDetails(
  'mailto:your-email@example.com',
  process.env.VAPID_PUBLIC_KEY,  // From vapid-key.env
  process.env.VAPID_PRIVATE_KEY  // Keep secure!
);

// Send notification
async function sendNotification(subscription, title, body) {
  const payload = JSON.stringify({ title, body });
  
  try {
    await webpush.sendNotification(subscription, payload);
    console.log('Notification sent');
  } catch (error) {
    if (error.statusCode === 410) {
      // Subscription expired - remove from database
      console.log('Subscription expired');
    }
    console.error('Error:', error);
  }
}
```

## Documentation

- **[PUSH_NOTIFICATION_INTEGRATION.md](./PUSH_NOTIFICATION_INTEGRATION.md)** - Complete technical documentation
- **[SECURITY_SUMMARY_PUSH_NOTIFICATIONS.md](./SECURITY_SUMMARY_PUSH_NOTIFICATIONS.md)** - Security analysis and guidelines

## Support

### Browser Console Commands

**Using the new standalone utility:**

```javascript
// Import the utility
import { subscribeToWebPush, getExistingSubscription, unsubscribeFromWebPush, isWebPushSupported } from './src/utils/webPushSubscribe';

// Check if Web Push is supported
console.log('Web Push supported:', isWebPushSupported());

// Subscribe to push notifications
const subscription = await subscribeToWebPush();
console.log('Subscription:', subscription);

// Check existing subscription
const existing = await getExistingSubscription();
console.log('Existing subscription:', existing);

// Unsubscribe
const success = await unsubscribeFromWebPush();
console.log('Unsubscribed:', success);
```

**Using native browser APIs directly:**

```javascript
// Check if subscribed
navigator.serviceWorker.ready.then(reg => 
  reg.pushManager.getSubscription().then(sub => console.log(sub))
);

// Check notification permission
console.log('Permission:', Notification.permission);

// Check service worker status
navigator.serviceWorker.getRegistration().then(reg => {
  console.log('Service worker registered:', !!reg);
  console.log('Active:', !!reg?.active);
  console.log('Scope:', reg?.scope);
});
```

**Manually trigger subscription (legacy method):**
```javascript
import { requestPushNotificationSubscription } from './src/utils/pushNotificationInit';
requestPushNotificationSubscription();
```

## License

This push notification implementation is part of the GoodLift project and follows the same license.

---

**Questions?** Check the comprehensive documentation or open an issue.

**Ready to send notifications?** Grab the tokens from the console and start your backend integration!
