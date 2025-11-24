# Firebase Setup for GoodLift

## Overview
GoodLift uses Firebase services for backend functionality including:
- **Firestore**: Store and sync user workout data across devices
- **Authentication**: Secure user login and registration
- **Cloud Storage**: Store user profile images and media
- **Cloud Messaging**: Send push notifications to users
- **Cloud Functions**: Scheduled notifications and backend logic

This document explains the Firebase configuration, security rules, and push notification setup needed for GoodLift.

## Table of Contents
1. [Firestore Data Structure](#firestore-data-structure)
2. [Firestore Security Rules](#firestore-security-rules)
3. [Push Notifications Setup](#push-notifications-setup)
4. [How Data Sync Works](#how-data-sync-works)
5. [Security Features](#security-features)
6. [Synced Data Types](#synced-data-types)

## Firestore Data Structure

User data is stored in the following structure:
```
users/{userId}/data/userData
```

Where:
- `{userId}` is the Firebase Authentication UID of the user
- The `userData` document contains:
  - `workoutHistory`: Array of workout objects
  - `userStats`: Object with totalWorkouts, totalTime, and other stats
  - `exerciseWeights`: Object mapping exercise names to target weights
  - `exerciseTargetReps`: Object mapping exercise names to target reps
  - `hiitSessions`: Array of HIIT session objects
  - `cardioSessions`: Array of cardio session objects
  - `stretchSessions`: Array of stretch session objects
  - `workoutPlans`: Array of workout plan objects
  - `activePlanId`: ID of the currently active workout plan
  - `savedWorkouts`: Array of saved workout templates
  - `favoriteWorkouts`: Array of favorite workout objects
  - `hiitPresets`: Array of custom HIIT preset configurations
  - `yogaPresets`: Array of custom Yoga preset configurations
  - `plans`: Array of simplified plan objects
  - `planDays`: Array of plan day objects
  - `planExercises`: Array of plan exercise objects
  - **`fcmToken`**: Firebase Cloud Messaging device token for push notifications
  - **`fcmTokenUpdatedAt`**: ISO timestamp when FCM token was last updated
  - `lastUpdated`: ISO timestamp of the last update

## Firestore Security Rules

To ensure users can only access their own data, configure your Firestore security rules as follows:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users collection - each user can only access their own data
    match /users/{userId} {
      // Allow read/write only if the authenticated user matches the userId
      allow read, write: if request.auth != null && request.auth.uid == userId;
      
      // Apply same rules to subcollections
      match /data/{document=**} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
    }
  }
}
```

## Security Features

1. **User Isolation**: Each user's data is isolated by their UID
2. **Authentication Required**: All operations require authentication
3. **Owner-Only Access**: Users can only read/write their own data
4. **Subcollection Protection**: Rules apply to all subcollections

## How Data Sync Works

### On User Login
1. User authenticates with Firebase Auth
2. App loads user data from Firestore (all workout data, plans, presets, etc.)
3. Data is synced to localStorage for offline access
4. If no data exists in Firestore, local data is uploaded

### On Data Changes
1. Data is saved to localStorage immediately
2. Data is automatically synced to Firestore
3. Works seamlessly across devices

### Offline Support
- App functions fully offline using localStorage
- Changes sync to Firestore when connection is restored
- Firebase SDK handles connection management automatically

## Synced Data Types

The following data types are automatically synced to Firebase for authenticated users:

**Workout Data:**
- Workout history (all completed workouts)
- User stats (total workouts, time, streaks, PRs, volume)
- Exercise target weights and reps

**Session Data:**
- HIIT sessions
- Cardio sessions
- Stretching sessions

**Plans & Templates:**
- Workout plans
- Active plan ID
- Saved workout templates
- Favorite workouts
- HIIT presets
- Yoga presets
- Simplified plans (plans, planDays, planExercises)

**Local-Only Data (Not Synced):**
- UI theme preferences
- Volume settings
- Favorite exercises list (UI preference)
- Pinned exercises (UI preference)
- Unlocked achievements (calculated locally)
- Total PRs and volume (derived from workout history)

## Benefits

- **Cross-Device Sync**: Access your workout data on any device
- **Data Backup**: Data is stored securely in the cloud
- **Offline Support**: Continue using the app without internet
- **Security**: Your data is protected and private

---

## Push Notifications Setup

GoodLift uses Firebase Cloud Messaging (FCM) to send push notifications to users for daily workout reminders, motivational messages, and activity tracking.

### Architecture Overview

The push notification system consists of three components:

1. **Frontend (React App)**: Requests notification permission, obtains FCM token, saves to Firestore
2. **Firestore**: Stores FCM tokens in user documents (`users/{userId}/data/userData`)
3. **Cloud Functions**: Scheduled function queries tokens and sends notifications daily

### Prerequisites

Before setting up push notifications, ensure you have:

- ✅ Firebase project configured with GoodLift
- ✅ Firebase Cloud Messaging enabled in Firebase Console
- ✅ VAPID key pair generated (Web Push certificates)
- ✅ Service worker registered (`firebase-messaging-sw.js`)

### Step 1: Configure VAPID Key in Firebase Console

VAPID (Voluntary Application Server Identification) keys are required for web push notifications.

1. **Generate VAPID Key Pair** (if not already done):
   - Go to Firebase Console → Project Settings → Cloud Messaging
   - Scroll to "Web Push certificates" section
   - Click "Generate key pair"
   - Copy the public key (starts with `B...`)

2. **Configure Key in Application**:
   - The VAPID public key is already configured in:
     - `src/utils/pushNotificationInit.js`
     - `src/services/pushNotificationService.js`
     - `vapid-key.env`
   - Current key: `BE0ZQSJHIlmXfeA5ddjITNrqrS0TmGfGGQjBufmOlUKxRUtEwja2qHmTZ0pXHepJzGV2qcwH0gJ_D6ot6cWGB6w`
   - ⚠️ **Important**: If you generate a new key pair, update it in all three locations

3. **Verify Service Worker**:
   - Ensure `public/firebase-messaging-sw.js` exists and is accessible
   - Service worker must be served from the root of your domain
   - It should initialize Firebase with your project config

### Step 2: How FCM Token Collection Works

When a user logs in to GoodLift, the following happens automatically:

1. **Permission Request**: 
   - Browser prompts user for notification permission
   - User must click "Allow" to receive notifications
   - Permission is required for FCM token generation

2. **Token Generation**:
   - If permission granted, Firebase generates a unique FCM token
   - Token is specific to this browser/device combination
   - Token may change over time (rotation, updates)

3. **Token Storage**:
   - Token is saved to Firestore at `users/{userId}/data/userData`
   - Stored with timestamp: `fcmTokenUpdatedAt`
   - Checked before saving to avoid redundant writes
   - Only updates if token has changed

4. **Token Lifecycle**:
   - Token remains valid until browser data is cleared or app is uninstalled
   - Automatically refreshes on app re-authentication
   - Invalid tokens are detected and logged by Cloud Functions

### Step 3: Deploy Cloud Function for Scheduled Notifications

The `sendDailyNotifications` Cloud Function sends notifications to all users daily at 8 AM UTC.

#### Deploy Function

1. **Install Firebase CLI** (if not already installed):
   ```bash
   npm install -g firebase-tools
   ```

2. **Login to Firebase**:
   ```bash
   firebase login
   ```

3. **Initialize Firebase Functions** (if not already done):
   ```bash
   firebase init functions
   ```
   - Select "Use an existing project"
   - Choose your GoodLift project
   - Select JavaScript
   - Install dependencies when prompted

4. **Install Function Dependencies**:
   ```bash
   cd functions
   npm install
   ```

5. **Deploy the Function**:
   ```bash
   firebase deploy --only functions:sendDailyNotifications
   ```

6. **Verify Deployment**:
   - Go to Firebase Console → Functions
   - You should see `sendDailyNotifications` listed
   - Check that it's scheduled to run at 8 AM UTC daily

#### Function Details

- **Schedule**: Daily at 8:00 AM UTC (cron: `0 8 * * *`)
- **Timeout**: 540 seconds (9 minutes)
- **Memory**: 256 MiB
- **Retry**: 3 attempts with 10-minute max duration
- **Max Instances**: 10 concurrent

**What the function does:**
1. Queries all users from Firestore
2. Collects FCM tokens from each user's `userData` document
3. Creates notification payload with motivational message
4. Sends notifications using `admin.messaging().sendEachForMulticast()`
5. Handles errors for invalid/expired tokens
6. Logs all operations for monitoring

See [functions/README.md](functions/README.md) for detailed documentation.

### Step 4: User Notification Permissions

For users to receive notifications, they must:

1. **Grant Browser Permission**:
   - When prompted, click "Allow" to enable notifications
   - If denied, notifications cannot be sent
   - Users can change permission in browser settings

2. **Have Valid FCM Token**:
   - Token is automatically generated after permission is granted
   - Token is saved to Firestore on login
   - Token must be valid and not expired

3. **Be Authenticated**:
   - Only logged-in users receive notifications
   - Guest users do not have FCM tokens stored
   - Token is tied to specific user ID

### Step 5: Testing Push Notifications

#### Test FCM Token Collection

1. **Login to GoodLift**:
   - Create account or login as existing user
   - Open browser developer console (F12)
   - Look for logs starting with `[FCM]` or `[Push Init]`

2. **Verify Token Storage**:
   - Check Firestore in Firebase Console
   - Navigate to `users/{yourUserId}/data/userData`
   - Verify `fcmToken` field exists and has a value
   - Check `fcmTokenUpdatedAt` timestamp

3. **Check Service Worker**:
   - In Chrome DevTools: Application → Service Workers
   - Should see `firebase-messaging-sw.js` registered and active
   - Status should be "activated and is running"

#### Test Scheduled Function

**Option 1: Manual Trigger (Recommended for Testing)**

1. Go to Firebase Console → Functions
2. Find `sendDailyNotifications`
3. Click three dots (⋮) → "Run now"
4. Check logs for execution details
5. Should receive notification if FCM token is valid

**Option 2: Wait for Scheduled Time**

1. Wait until 8 AM UTC the next day
2. Check Firebase Console → Functions → Logs
3. Look for execution logs from `sendDailyNotifications`
4. Verify notifications were sent successfully

**Option 3: Test with Firebase Emulator**

```bash
cd functions
npm run serve
```

Then trigger function via emulator UI.

### Step 6: Monitoring and Troubleshooting

#### View Function Logs

**Via CLI:**
```bash
firebase functions:log
```

**Via Firebase Console:**
- Go to Functions → Select `sendDailyNotifications` → Logs

#### Key Metrics to Monitor

- **Success Count**: Number of notifications successfully sent
- **Failure Count**: Number of failed deliveries
- **Invalid Tokens**: Tokens that should be cleaned up
- **Execution Time**: Should be under 540 seconds
- **Error Rate**: Track exceptions and failures

#### Common Issues and Solutions

**Issue: User not receiving notifications**

Solutions:
- ✅ Check if user granted notification permission
- ✅ Verify FCM token exists in Firestore: `users/{userId}/data/userData`
- ✅ Check browser console for errors (F12)
- ✅ Verify service worker is registered and active
- ✅ Ensure VAPID key matches in Firebase Console and code
- ✅ Try manually triggering function from Firebase Console

**Issue: Function timeout**

Solutions:
- ✅ For large user bases, implement batching (see functions/README.md)
- ✅ Increase timeout (max 540 seconds)
- ✅ Optimize Firestore queries

**Issue: High failure count**

Solutions:
- ✅ Review function logs for specific error codes
- ✅ Check for expired/invalid tokens
- ✅ Verify Firebase project configuration
- ✅ Ensure FCM is enabled in Firebase Console

**Issue: Token not saved to Firestore**

Solutions:
- ✅ Check browser console for errors during login
- ✅ Verify Firestore security rules allow write access
- ✅ Ensure user is authenticated (not guest mode)
- ✅ Check for network connectivity issues

### Browser Compatibility

**Fully Supported:**
- ✅ Chrome (desktop and Android)
- ✅ Firefox (desktop and Android)
- ✅ Edge (Chromium-based)
- ✅ Opera

**Limited Support:**
- ⚠️ Safari (macOS 13+ Ventura only)
- ⚠️ iOS Safari (iOS 16.4+ only, with limitations)

**Not Supported:**
- ❌ Safari < macOS 13
- ❌ iOS < 16.4
- ❌ Internet Explorer

For unsupported browsers, the app gracefully handles the absence of push notifications without breaking functionality.

### Security Considerations

1. **VAPID Key**: Public key is safe to include in client code (it's public)
2. **FCM Tokens**: Stored securely in Firestore with proper security rules
3. **Authentication**: Only authenticated users can save/access their tokens
4. **Token Validation**: Cloud Function handles invalid/expired tokens
5. **Rate Limiting**: Max 10 concurrent function instances for cost control

### Mobile App Support (Future)

While GoodLift currently focuses on web push notifications, the architecture supports future mobile app expansion:

- **Android**: Use Firebase Cloud Messaging SDK
- **iOS**: Use Apple Push Notification service (APNs) via Firebase
- **Unified Backend**: Same Cloud Function can send to web and mobile
- **Token Management**: Store mobile tokens in same Firestore structure

See [Firebase documentation](https://firebase.google.com/docs/cloud-messaging) for mobile implementation details.

### Next Steps After Setup

Once push notifications are configured and deployed:

1. ✅ **Deploy Cloud Function**: `firebase deploy --only functions`
2. ✅ **Configure VAPID Key**: Ensure key matches in Firebase Console and code
3. ✅ **Test with Real User**: Login and verify token storage in Firestore
4. ✅ **Trigger Test Notification**: Manually run function from Firebase Console
5. ✅ **Monitor Logs**: Check function execution and notification delivery
6. ✅ **Set Up Alerts**: Configure Firebase alerts for function failures
7. ✅ **Document User Instructions**: Add help section for enabling notifications

### Additional Resources

- [Firebase Cloud Messaging Documentation](https://firebase.google.com/docs/cloud-messaging)
- [Web Push Notifications Guide](https://web.dev/push-notifications-overview/)
- [Service Worker API Documentation](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [functions/README.md](functions/README.md) - Detailed function documentation
- [VAPID Key Specification](https://datatracker.ietf.org/doc/html/rfc8292)

---
