# Manual Testing Checklist - Service Worker & Push Notifications

This document provides a comprehensive manual testing checklist to verify that both PWA and FCM push notifications work correctly together after the service worker separation fix.

## Prerequisites

- [ ] Code deployed to test environment or production
- [ ] Access to Firebase Console
- [ ] Test device/browser with notification support
- [ ] Chrome/Firefox for complete testing (Safari for limited testing)

## Test Environment Setup

### Device/Browser Matrix

Test on at least one device from each category:

**Desktop:**
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (macOS 13+) - optional
- [ ] Edge (latest) - optional

**Mobile:**
- [ ] Chrome Android
- [ ] Safari iOS 16.4+ (limited support)
- [ ] Firefox Android - optional

## Test 1: Service Worker Registration

**Objective:** Verify both service workers are registered correctly without conflicts

### Steps:
1. [ ] Open app in Chrome browser
2. [ ] Open DevTools (F12)
3. [ ] Go to Application tab → Service Workers
4. [ ] Check console for registration messages

### Expected Results:
- [ ] Console shows: `[SW Registration] ✅ Service Worker registered successfully`
- [ ] Console shows: `[SW Registration] Scope: ...` (should be `/goodlift/`)
- [ ] DevTools shows **2 service workers**:
  - [ ] `/goodlift/service-worker.js` with scope `/goodlift/`
  - [ ] `/firebase-messaging-sw.js` with scope `/firebase-cloud-messaging-push-scope`
- [ ] Both service workers show status: "activated and is running"
- [ ] No error messages in console

### If Failed:
- Check console for detailed error messages
- Verify service worker files exist at correct paths
- Clear site data and reload: DevTools → Application → Storage → Clear site data
- Verify HTTPS or localhost (required for service workers)

---

## Test 2: PWA Offline Functionality

**Objective:** Verify PWA service worker handles caching and offline mode correctly

### Steps:
1. [ ] Open app in browser
2. [ ] Navigate through several pages (Dashboard, Progress, Settings, etc.)
3. [ ] Open DevTools → Application → Cache Storage
4. [ ] Verify cache exists (e.g., `goodlift-pwa-{timestamp}`)
5. [ ] Open DevTools → Network tab
6. [ ] Set network to "Offline"
7. [ ] Reload the page

### Expected Results:
- [ ] Console shows: `[Service Worker] Installing service worker...`
- [ ] Console shows: `[Service Worker] ✅ All files cached successfully`
- [ ] Cache Storage contains cached files (icons, manifest, index.html, etc.)
- [ ] When offline: Page loads successfully from cache
- [ ] Console shows: `[Service Worker] Serving from cache (offline):`
- [ ] No 404 errors or failed requests for critical assets
- [ ] App remains functional (can view cached pages)

### If Failed:
- Check console for cache errors
- Verify `urlsToCache` array in service-worker.js contains correct paths
- Check that files are accessible (no 404s when online)
- Unregister service worker and reload

---

## Test 3: PWA Install to Homescreen (Mobile)

**Objective:** Verify PWA can be installed and launches correctly from homescreen

### Steps:
1. [ ] Open app in Chrome Android or Safari iOS
2. [ ] Look for "Install app" prompt or browser menu option
3. [ ] Install app to homescreen
4. [ ] Close browser completely
5. [ ] Open app from homescreen icon
6. [ ] Navigate through app

### Expected Results:
- [ ] Browser offers "Add to Home Screen" option
- [ ] App installs successfully
- [ ] App icon appears on homescreen
- [ ] **Critical:** App launches successfully from homescreen (not blank screen)
- [ ] App loads main interface correctly
- [ ] App functions normally (can navigate, view content)
- [ ] App bar shows app name (not browser URL bar)
- [ ] Service worker activates on launch (check console if possible)

### If Failed:
- This was the original bug - if it fails, service worker conflict is not resolved
- Check DevTools console for service worker errors
- Verify both service workers are active
- Uninstall PWA, clear data, reinstall

---

## Test 4: Firebase Cloud Messaging - Token Registration

**Objective:** Verify FCM token is obtained and saved correctly

### Steps:
1. [ ] Open app in supported browser (Chrome/Firefox)
2. [ ] Login with test account (not guest mode)
3. [ ] Open browser console (F12)
4. [ ] Watch for notification permission prompt
5. [ ] Click "Allow" when prompted
6. [ ] Wait for initialization to complete

### Expected Results:
- [ ] Console shows: `[Push Init] Starting push notification initialization...`
- [ ] Console shows: `[FCM] ✅ Firebase Messaging is supported in this browser`
- [ ] Console shows: `[FCM] ✅ FCM token obtained successfully`
- [ ] Console shows: `[FCM] 📋 FCM Token length:` (followed by number)
- [ ] Console shows: `[FCM] ✅ Token saved to Firestore successfully`
- [ ] No error messages related to service worker or Firebase
- [ ] In Firestore: `users/{userId}/data/userData` document contains:
  - [ ] `fcmToken` field with token value
  - [ ] `fcmTokenUpdatedAt` field with timestamp

### If Failed:
- Check console for error messages with `[FCM]` prefix
- Verify notification permission is granted: `Notification.permission === 'granted'`
- Check Firebase Console → Project Settings → Cloud Messaging → Web Push certificates
- Verify VAPID key matches in code and Firebase Console
- For Safari/iOS: Expected to fail or use fallback (limited support)

---

## Test 5: Push Notification - Background Reception

**Objective:** Verify push notifications are received when app is closed/backgrounded

### Steps:
1. [ ] Complete Test 4 (FCM token registration) successfully
2. [ ] Note the FCM token from Firestore or console
3. [ ] Close the browser tab (but keep browser running)
4. [ ] Go to Firebase Console → Cloud Messaging → Send test message
5. [ ] Configure notification:
   - Title: "Test Notification"
   - Body: "Testing background push notifications"
   - Target: Select test FCM token
6. [ ] Send notification
7. [ ] Wait 5-10 seconds

### Expected Results:
- [ ] Notification appears on device/desktop
- [ ] Notification shows correct title: "Test Notification"
- [ ] Notification shows correct body: "Testing background push notifications"
- [ ] Notification icon is GoodLift icon
- [ ] Click notification → App opens or gains focus
- [ ] In browser console (if visible): `[FCM Service Worker] Received background message from Firebase`

### If Failed - Common Issues:
- **No notification appears:**
  - Check notification permission is granted
  - Verify FCM token is correct and not expired
  - Check browser supports notifications (Chrome/Firefox)
  - Check Firebase Console for send errors
  
- **Notification appears but wrong content:**
  - Check notification payload in Firebase Console
  - Verify firebase-messaging-sw.js has correct display logic
  
- **Notification click doesn't open app:**
  - Check notificationclick handler in firebase-messaging-sw.js
  - Verify app URL is correct in handler

---

## Test 6: Push Notification - Foreground Reception

**Objective:** Verify push notifications are received when app is open and active

### Steps:
1. [ ] Keep app open in browser
2. [ ] Open browser console (F12)
3. [ ] Send test notification from Firebase Console (same as Test 5)
4. [ ] Watch console for messages

### Expected Results:
- [ ] Console shows: `[FCM Listener] ✅ Received foreground message from Firebase`
- [ ] Console shows notification details (title, body, data)
- [ ] Notification may or may not be displayed (depends on implementation)
- [ ] No errors in console

### If Failed:
- Check console for `[FCM Listener]` error messages
- Verify foreground message listener is set up (check pushNotificationService.js)
- Check Firebase Messaging SDK is initialized

---

## Test 7: No Service Worker Conflicts

**Objective:** Verify service workers don't interfere with each other

### Steps:
1. [ ] Open app in Chrome
2. [ ] Open DevTools → Console
3. [ ] Apply filter: "Service Worker" or "SW"
4. [ ] Reload page and watch console
5. [ ] Send test push notification
6. [ ] Watch console for service worker messages

### Expected Results:
- [ ] Only **one** service worker handles fetch events (PWA SW)
- [ ] Only **one** service worker handles push events (FCM SW)
- [ ] No error messages about event handler conflicts
- [ ] No duplicate event handlers logged
- [ ] PWA SW logs show caching and fetch handling only
- [ ] FCM SW logs show push notification handling only
- [ ] No messages like "Event listener already registered"

### If Failed:
- This indicates service workers are conflicting
- Check both service worker files for duplicate event handlers
- Verify scopes are different
- Unregister all service workers and reload

---

## Test 8: Service Worker Update Mechanism

**Objective:** Verify service worker updates work correctly

### Steps:
1. [ ] Note current service worker version: Check console or `sw-version.js`
2. [ ] Make a small change to app (e.g., edit a text string)
3. [ ] Build and deploy: `npm run build`
4. [ ] Wait for deployment to complete
5. [ ] Reload app in browser
6. [ ] Check DevTools → Application → Service Workers

### Expected Results:
- [ ] Console shows: `[SW Registration] 🔄 Service Worker update found`
- [ ] Console shows: `[SW Registration] ✅ New Service Worker activated`
- [ ] New service worker version is activated
- [ ] Old cache is cleared
- [ ] New cache is created with new version number
- [ ] App reflects the changes made

### If Failed:
- Service worker might be stuck in "waiting" state
- Solution: Close all tabs and reopen, or click "skipWaiting" in DevTools
- Clear browser cache and reload

---

## Test 9: Multi-Device Sync

**Objective:** Verify notifications work across multiple devices for same user

### Steps:
1. [ ] Login with same account on 2+ devices (e.g., desktop + mobile)
2. [ ] Grant notification permission on all devices
3. [ ] Verify FCM tokens saved for each device in Firestore
4. [ ] Send notification targeting all tokens or use Cloud Function
5. [ ] Check all devices receive notification

### Expected Results:
- [ ] Each device has unique FCM token
- [ ] All tokens saved in Firestore (could be array or multiple documents)
- [ ] Notification sent to all devices
- [ ] All devices receive notification
- [ ] Clicking notification on any device opens app on that device

### If Failed:
- Check Firestore token storage structure
- Verify Cloud Function sends to all tokens (if using function)
- Check Firebase Console for send errors

---

## Test 10: Browser Compatibility

**Objective:** Verify service workers and notifications work across browsers

### Matrix:

| Browser | PWA SW | FCM SW | Notes |
|---------|--------|--------|-------|
| Chrome Desktop | [ ] | [ ] | Should fully work |
| Firefox Desktop | [ ] | [ ] | Should fully work |
| Edge Desktop | [ ] | [ ] | Should fully work |
| Safari Desktop | [ ] | [ ] | macOS 13+ only |
| Chrome Android | [ ] | [ ] | Should fully work |
| Safari iOS | [ ] | ⚠️ | iOS 16.4+, limited FCM |
| Firefox Android | [ ] | [ ] | Should fully work |

### Test Process:
For each browser:
1. [ ] Open app
2. [ ] Check service worker registration
3. [ ] Test offline functionality
4. [ ] Grant notification permission
5. [ ] Send test notification
6. [ ] Document results

### Expected Results:
- [ ] All modern browsers support PWA service worker
- [ ] Chrome/Firefox/Edge fully support FCM
- [ ] Safari has partial support (documented warnings in console)
- [ ] iOS Safari requires iOS 16.4+ and has limitations

---

## Test 11: Error Handling

**Objective:** Verify graceful error handling

### Scenarios to Test:

**A. Notification Permission Denied**
1. [ ] Clear site data
2. [ ] Reload app
3. [ ] Click "Block" on notification permission prompt
4. [ ] Expected: App still works, console shows helpful error message

**B. Offline During FCM Registration**
1. [ ] Go offline before login
2. [ ] Login to app
3. [ ] Expected: App works, FCM registration deferred, console shows warning

**C. Service Worker Registration Failed**
1. [ ] Open in non-HTTPS environment (if possible)
2. [ ] Expected: Clear error message about HTTPS requirement

**D. Invalid VAPID Key**
1. [ ] Temporarily modify VAPID key in code
2. [ ] Try to get FCM token
3. [ ] Expected: Error logged, app doesn't crash

### Expected Results:
- [ ] No uncaught errors
- [ ] Helpful error messages in console
- [ ] App remains functional
- [ ] User gets clear feedback

---

## Test 12: Performance and Resource Usage

**Objective:** Verify service workers don't cause performance issues

### Steps:
1. [ ] Open app with DevTools Performance tab
2. [ ] Record performance profile during page load
3. [ ] Navigate through app
4. [ ] Check DevTools → Application → Cache Storage → Size
5. [ ] Check DevTools → Application → Service Workers → Status

### Expected Results:
- [ ] Service worker registration completes quickly (< 1 second)
- [ ] Cache size is reasonable (< 10 MB for initial cache)
- [ ] No memory leaks from service workers
- [ ] Page load time not significantly impacted
- [ ] No excessive CPU usage from service workers

---

## Final Checklist

After completing all tests:

- [ ] All critical tests (1, 3, 5) pass
- [ ] PWA installs and launches from homescreen correctly
- [ ] Push notifications work in background
- [ ] No service worker conflicts detected
- [ ] Documentation updated with any findings
- [ ] Known issues documented (if any)
- [ ] Browser compatibility matrix completed

## Known Limitations

Document any known limitations discovered during testing:

- Safari/iOS: Limited FCM support (requires iOS 16.4+)
- Safari/iOS: May not receive all background notifications
- Safari/iOS: PWA mode may have additional limitations
- Some browsers may require explicit user interaction for notification permission

## Success Criteria

✅ **All tests pass when:**
1. PWA installs and launches correctly from homescreen
2. Push notifications received in background
3. Both service workers active without conflicts
4. Offline functionality works as expected
5. No critical errors in console

## Reporting Issues

If any test fails:
1. Document exact steps to reproduce
2. Include browser/OS version
3. Include console error messages
4. Include DevTools screenshots
5. Report to: CommsLRSD

## Automation Opportunities

Future automation ideas:
- Playwright/Puppeteer tests for service worker registration
- Automated cache verification
- Notification send/receive integration tests
- Cross-browser CI testing
- Service worker update tests
