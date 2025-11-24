# Service Worker Architecture

## Overview

GoodLift uses **two independent service workers** to provide both PWA functionality and push notifications:

1. **PWA Service Worker** (`service-worker.js`) - Handles offline caching and app shell
2. **Firebase Messaging Service Worker** (`firebase-messaging-sw.js`) - Handles push notifications

These service workers operate independently with different scopes and do not conflict.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────┐
│                     GoodLift App                        │
└─────────────────────────────────────────────────────────┘
                        │
                        │ Uses both
                        ▼
        ┌───────────────────────────────┐
        │                               │
        ▼                               ▼
┌──────────────────┐          ┌──────────────────────┐
│ PWA Service      │          │ Firebase Messaging   │
│ Worker           │          │ Service Worker       │
│                  │          │                      │
│ service-worker.js│          │firebase-messaging-   │
│                  │          │sw.js                 │
│                  │          │                      │
│ Scope:           │          │ Scope:               │
│ /goodlift/       │          │ /firebase-cloud-     │
│                  │          │ messaging-push-scope │
│                  │          │                      │
│ Handles:         │          │ Handles:             │
│ - Fetch events   │          │ - Push events        │
│ - Caching        │          │ - Notification clicks│
│ - Offline mode   │          │ - FCM messages       │
└──────────────────┘          └──────────────────────┘
```

## Service Worker 1: PWA Service Worker

**File:** `public/service-worker.js`

**Purpose:** Provides Progressive Web App functionality

**Responsibilities:**
- Cache app shell and static assets
- Handle fetch events for offline functionality
- Implement cache-first and network-first strategies
- Clean up old caches on activation

**Scope:** `/goodlift/`

**Registration:** Explicitly registered in `index.html` on page load

**Does NOT handle:**
- Push notifications
- Background sync
- FCM messages

## Service Worker 2: Firebase Messaging Service Worker

**File:** `public/firebase-messaging-sw.js`

**Purpose:** Handles push notifications from Firebase Cloud Messaging

**Responsibilities:**
- Receive push notifications in background
- Display notifications to users
- Handle notification clicks
- Open/focus app when notification is clicked

**Scope:** `/firebase-cloud-messaging-push-scope` (automatically managed by Firebase SDK)

**Registration:** Automatically registered by Firebase SDK when `getToken()` is called

**Does NOT handle:**
- Fetch events
- Caching
- Navigation requests

## How They Work Together

### Registration

1. **PWA Service Worker:**
   ```javascript
   // In index.html
   navigator.serviceWorker.register('/goodlift/service-worker.js')
   ```

2. **Firebase Messaging Service Worker:**
   ```javascript
   // Automatically registered by Firebase SDK in pushNotificationService.js
   const token = await getToken(messaging, { vapidKey: VAPID_KEY });
   // Firebase SDK automatically finds and registers firebase-messaging-sw.js
   ```

### No Conflicts

The two service workers don't conflict because:

1. **Different Scopes:** Each service worker controls a different scope
   - PWA SW: `/goodlift/` - controls navigation and resources
   - FCM SW: `/firebase-cloud-messaging-push-scope` - dedicated to push notifications

2. **Different Event Handlers:**
   - PWA SW: Handles `fetch`, `install`, `activate` events
   - FCM SW: Handles `push`, `notificationclick` events via Firebase SDK

3. **Different Purposes:**
   - PWA SW: Offline functionality, caching, performance
   - FCM SW: Push notifications only

## Firebase Messaging Service Worker Details

### Loading Firebase SDK

The FCM service worker uses the compat API loaded via `importScripts`:

```javascript
importScripts('https://www.gstatic.com/firebasejs/10.13.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.13.2/firebase-messaging-compat.js');
```

**Why compat API?**
- Service workers require synchronous script loading via `importScripts`
- The modular SDK (v9+) used in the main app is asynchronous and ES modules-based
- The compat API provides the traditional API that works in service workers

### Firebase Initialization

```javascript
firebase.initializeApp({
  apiKey: "...",
  authDomain: "...",
  projectId: "...",
  messagingSenderId: "...",
  appId: "...",
  measurementId: "..."
});

const messaging = firebase.messaging();
```

### Background Message Handler

```javascript
messaging.onBackgroundMessage((payload) => {
  // Show notification
  self.registration.showNotification(title, options);
});
```

## File Locations

### Source Files (during development)
```
public/
  ├── service-worker.js           # PWA service worker
  ├── firebase-messaging-sw.js    # FCM service worker
  └── sw-version.js              # Auto-generated version file
```

### Build Output (deployed)
```
docs/                             # Build output directory
  ├── service-worker.js           # Copied from public/
  ├── firebase-messaging-sw.js    # Copied from public/
  ├── sw-version.js              # Copied from public/
  └── index.html                 # Contains PWA SW registration
```

**Important:** Vite automatically copies everything from `public/` to the build output root (`docs/`).

## VAPID Key Configuration

The VAPID (Voluntary Application Server Identification) public key is used for push notifications:

```
BE0ZQSJHIlmXfeA5ddjITNrqrS0TmGfGGQjBufmOlUKxRUtEwja2qHmTZ0pXHepJzGV2qcwH0gJ_D6ot6cWGB6w
```

This key is configured in:
1. Firebase Console → Project Settings → Cloud Messaging → Web Push certificates
2. `src/services/pushNotificationService.js` (for FCM token retrieval)
3. `src/utils/pushNotificationInit.js` (for native Web Push)
4. `public/firebase-messaging-sw.js` (documentation comment)

## Testing Service Workers

### Check Active Service Workers

**Chrome DevTools:**
1. Open DevTools (F12)
2. Go to Application tab
3. Click "Service Workers" in sidebar
4. Should see TWO service workers:
   - `/goodlift/service-worker.js` (scope: `/goodlift/`)
   - `/firebase-messaging-sw.js` (scope: `/firebase-cloud-messaging-push-scope`)

### Test PWA Functionality

1. Load app in browser
2. Check console for: `[Service Worker] Installing service worker...`
3. Check console for: `[Service Worker] ✅ All files cached successfully`
4. Go offline (DevTools → Network → Offline)
5. Reload page - should load from cache
6. Check console for: `[Service Worker] Serving from cache (offline):`

### Test Push Notifications

1. Login to app
2. Grant notification permission when prompted
3. Check console for: `[FCM] ✅ FCM token obtained successfully`
4. Check console for: `[FCM Service Worker] ✅ Firebase initialized successfully`
5. Send test notification from Firebase Console
6. Should receive notification even when app is closed

## Troubleshooting

### PWA Not Working Offline

**Symptoms:** App doesn't load offline, errors in console

**Solutions:**
1. Check console for service worker registration errors
2. Verify `service-worker.js` exists at `/goodlift/service-worker.js`
3. Unregister old service workers: DevTools → Application → Service Workers → Unregister
4. Clear cache and reload
5. Ensure HTTPS or localhost (service workers require secure context)

### Push Notifications Not Received

**Symptoms:** No notifications appear, FCM token not obtained

**Solutions:**
1. Check console for `[FCM]` log messages
2. Verify `firebase-messaging-sw.js` exists at web root
3. Check Firebase Console → Cloud Messaging → Web Push certificates
4. Ensure VAPID key matches in all locations
5. Verify notification permission is granted: `Notification.permission === 'granted'`
6. Check browser compatibility (Safari requires macOS 13+ or iOS 16.4+)

### Service Worker Update Not Applied

**Symptoms:** Old version still running after deployment

**Solutions:**
1. Service worker updates on page load but doesn't activate immediately
2. Close all tabs of the app
3. Reopen app - new service worker should activate
4. Or: DevTools → Application → Service Workers → Update / Skip waiting

### Multiple Service Workers Conflicting

**Symptoms:** Unexpected behavior, both service workers handling same events

**Check:**
1. Only `service-worker.js` should handle fetch events
2. Only `firebase-messaging-sw.js` should handle push events
3. Each should have distinct scope

**Fix:**
1. Unregister all service workers: DevTools → Application → Service Workers
2. Clear all caches: DevTools → Application → Storage → Clear site data
3. Reload page
4. Should register correctly

## Browser Compatibility

### PWA Service Worker

| Browser | Support |
|---------|---------|
| Chrome | ✅ Full support |
| Firefox | ✅ Full support |
| Safari | ✅ Full support (macOS/iOS) |
| Edge | ✅ Full support |
| Opera | ✅ Full support |

### Firebase Cloud Messaging

| Browser | Support |
|---------|---------|
| Chrome | ✅ Full support |
| Firefox | ✅ Full support |
| Safari | ⚠️ macOS 13+ only |
| iOS Safari | ⚠️ iOS 16.4+ only |
| Edge | ✅ Full support |
| Opera | ✅ Full support |

**Note:** Safari/iOS have limited FCM support. The app falls back to native Web Push API on these platforms.

## Build Process

### Pre-build: Generate Service Worker Version

```bash
npm run prebuild
# Runs: node scripts/generate-sw-version.js
# Creates: public/sw-version.js with current timestamp
```

### Build: Copy Service Workers to Output

```bash
npm run build
# Runs: vite build
# Result: Copies public/ to docs/ (including service workers)
```

### Verification

After build, verify these files exist in `docs/`:
- `service-worker.js`
- `firebase-messaging-sw.js`
- `sw-version.js`
- `index.html` (with service worker registration)

## Deployment Checklist

- [ ] Build project: `npm run build`
- [ ] Verify `docs/service-worker.js` exists
- [ ] Verify `docs/firebase-messaging-sw.js` exists
- [ ] Verify `docs/sw-version.js` has new timestamp
- [ ] Check `docs/index.html` has service worker registration
- [ ] Test in browser after deployment
- [ ] Verify both service workers appear in DevTools
- [ ] Test offline functionality
- [ ] Test push notifications

## Security Considerations

1. **Service Workers require HTTPS** (or localhost for development)
2. **VAPID public key is safe to expose** (it's PUBLIC)
3. **Firebase config in service worker is public** (no sensitive data)
4. **Service worker scope controls what it can access**
5. **FCM tokens should be stored securely** (in Firestore with auth rules)

## Future Enhancements

Possible improvements:

1. **Workbox Integration:** Use Workbox library for advanced caching strategies
2. **Background Sync:** Sync data when connection is restored
3. **Periodic Background Sync:** Update content in background
4. **Web Push with custom backend:** Alternative to FCM for broader compatibility
5. **Service Worker Analytics:** Track service worker performance and usage
6. **Advanced Caching:** Pre-cache routes, runtime caching for API responses

## References

- [Service Worker API - MDN](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [Firebase Cloud Messaging - Web](https://firebase.google.com/docs/cloud-messaging/js/client)
- [Progressive Web Apps - Google](https://web.dev/progressive-web-apps/)
- [Workbox - Google](https://developer.chrome.com/docs/workbox/)
- [Web Push Notifications - MDN](https://developer.mozilla.org/en-US/docs/Web/API/Push_API)

## Support

For issues with service workers or push notifications:

1. Check browser console for detailed error messages
2. Review this documentation
3. Test in Chrome DevTools with verbose logging
4. Check Firebase Console for FCM-related issues
5. Verify VAPID key configuration
6. Contact: CommsLRSD
