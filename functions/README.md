# Firebase Cloud Functions for GoodLift

This directory contains Firebase Cloud Functions for the GoodLift application.

## Functions

### `sendDailyNotifications`

A scheduled function that sends personalized morning workout and wellness notifications to all users.

- **Schedule**: Every day at 8:00 AM Central Time (CST/CDT)
- **Trigger**: Scheduled (cron)
- **Description**: Sends personalized notifications including today's workout and wellness tasks

**Key Features:**
- Queries all users from Firestore (`users/{userId}/data/userData`)
- Sends personalized notifications based on user data:
  - **Today's Scheduled Workout**: Includes workout type from active plan (if applicable)
  - **Daily Wellness Task**: Reminds users with wellness enabled (if opted in)
- Handles errors for invalid/expired tokens
- Comprehensive logging for monitoring and troubleshooting

**Example Notifications:**
- With workout + wellness: "Good morning! Today's workout: Hypertrophy. Don't forget your daily wellness task. Let's make today great! 💪"
- Rest day: "Good morning! Today is a rest day - focus on recovery. Don't forget your daily wellness task. Let's make today great! 💪"
- No active plan: "Good morning! Don't forget your daily wellness task. Let's make today great! 💪"

### `sendEveningNotifications`

A scheduled function that sends evening wellness check-in notifications to users with wellness enabled.

- **Schedule**: Every day at 9:00 PM Central Time (CST/CDT)
- **Trigger**: Scheduled (cron)
- **Description**: Prompts users to mark their daily wellness task as complete

**Key Features:**
- Only sends to users with wellness enabled
- Links notification to app's wellness section for easy completion tracking
- Users click notification to open app and mark task complete (Yes/No)
- Completion data is stored in userData for user tracking
- Comprehensive logging for monitoring and troubleshooting

**Important Note:**
Firebase Cloud Messaging (FCM) does not support interactive notification buttons that directly execute code. Users must tap the notification to open the app where they can mark their wellness task as complete. The app should handle this action when opened via the notification.

**Notification Content:**
- Title: "Evening Wellness Check-In 🌙"
- Body: "Did you complete your wellness task today? Tap to mark it complete and track your progress! 🎯"
- Opens to: App wellness section (`#wellness`)

## User Data Structure

Both functions read from the following Firestore structure:
```
users/{userId}/data/userData
```

**Required fields:**
- `fcmToken` (string): Firebase Cloud Messaging token for push notifications

**Optional fields for personalization:**
- `plans` (array): User's workout plans
- `planDays` (array): Scheduled workout days
- `activePlanId` (string): ID of currently active plan
- `wellnessEnabled` (boolean): Whether user has opted into wellness features
- `wellnessPreferences` (object): User's wellness task preferences
- `completedWellnessTasks` (number): Count of completed wellness tasks

## Setup

### Pulling Changes from GitHub

To get the latest changes from this PR on your local machine:

```bash
# 1. Make sure you're in the goodlift repository directory
cd path/to/goodlift

# 2. Fetch the latest changes from GitHub
git fetch origin

# 3. Check out the feature branch
git checkout copilot/update-firebase-functions-and-notifications

# 4. Pull the latest changes
git pull origin copilot/update-firebase-functions-and-notifications

# 5. Install or update function dependencies
cd functions
npm install

# 6. Review the changes
git log --oneline -5
git diff main...HEAD
```

**Alternative: Pull via GitHub CLI**
```bash
gh pr checkout 123  # Replace 123 with the actual PR number
cd functions
npm install
```

### Initial Setup

1. Install dependencies:
   ```bash
   cd functions
   npm install
   ```

2. Ensure Firebase Admin SDK is initialized (already done in index.js)

3. (Optional) Configure environment variables for different deployment environments:
   ```bash
   # For production
   firebase functions:config:set notification.icon="/goodlift/icons/goodlift-icon-192.png"
   firebase functions:config:set notification.badge="/goodlift/icons/goodlift-icon-192.png"
   firebase functions:config:set notification.click_action="/goodlift/"
   
   # For staging
   firebase functions:config:set notification.icon="/staging/icons/goodlift-icon-192.png" --project staging
   firebase functions:config:set notification.badge="/staging/icons/goodlift-icon-192.png" --project staging
   firebase functions:config:set notification.click_action="/staging/" --project staging
   ```

4. Deploy functions to Firebase:
   ```bash
   firebase deploy --only functions
   
   # Or deploy individual functions:
   firebase deploy --only functions:sendDailyNotifications
   firebase deploy --only functions:sendEveningNotifications
   ```

## Local Development

### Testing with Emulators

```bash
cd functions
npm run serve
```

This will start the Firebase emulators for local testing.

### Manual Function Testing

You can manually trigger the scheduled functions from the Firebase Console:
1. Go to Firebase Console → Functions
2. Find the function you want to test:
   - `sendDailyNotifications` - Morning workout reminder (8:00 AM CST)
   - `sendEveningNotifications` - Evening progress check-in (9:00 PM CST)
3. Click the three dots → "Run now"

## Monitoring

### View Function Logs

```bash
firebase functions:log
```

Or view logs in Firebase Console → Functions → Logs

### Key Metrics to Monitor

- **Success count**: Number of notifications successfully sent
- **Failure count**: Number of notifications that failed
- **Invalid tokens**: Tokens that should be cleaned up from the database
- **Execution time**: Function duration (should be < 540 seconds)
- **Error rate**: Track any exceptions or failures

## Error Handling

The function handles the following error scenarios:

1. **Invalid/Expired Tokens**: Logs tokens with codes like:
   - `messaging/invalid-registration-token`
   - `messaging/registration-token-not-registered`

2. **User Document Errors**: Logs when user documents are missing or malformed

3. **Send Failures**: Catches and logs all send errors with full details

## Notification Payload

### Morning Notification (sendDailyNotifications)
Personalized based on user data:
```javascript
{
  notification: {
    title: "Good Morning! ☀️",
    body: "Good morning! Today's workout: Hypertrophy. Don't forget your daily wellness task. Let's make today great! 💪",
    icon: "/goodlift/icons/goodlift-icon-192.png",
    badge: "/goodlift/icons/goodlift-icon-192.png",
  },
  data: {
    type: "daily-reminder",
    timestamp: "2024-11-24T08:00:00.000Z",
    click_action: "/goodlift/",
    hasWorkout: "true",
    workoutType: "Hypertrophy",
    hasWellness: "true"
  }
}
```

### Evening Notification (sendEveningNotifications)
Wellness check-in for users with wellness enabled:
```javascript
{
  notification: {
    title: "Evening Wellness Check-In 🌙",
    body: "Did you complete your wellness task today? Tap to mark it complete and track your progress! 🎯",
    icon: "/goodlift/icons/goodlift-icon-192.png",
    badge: "/goodlift/icons/goodlift-icon-192.png",
  },
  data: {
    type: "wellness-checkin",
    timestamp: "2024-11-24T21:00:00.000Z",
    click_action: "/goodlift/#wellness",
    action: "mark-wellness-complete"
  }
}
```

**Environment Variables:**
- `NOTIFICATION_ICON`: Path to notification icon (default: `/goodlift/icons/goodlift-icon-192.png`)
- `NOTIFICATION_BADGE`: Path to notification badge (default: `/goodlift/icons/goodlift-icon-192.png`)
- `NOTIFICATION_CLICK_ACTION`: URL to open when notification is clicked (default: `/goodlift/`)

These can be set using Firebase Functions config:
```bash
firebase functions:config:set notification.icon="/path/to/icon.png"
firebase functions:config:set notification.badge="/path/to/badge.png"
firebase functions:config:set notification.click_action="/path/to/page"
```

## Cost Optimization

- **Max instances**: Limited to 10 concurrent containers
- **Memory**: 256 MiB per instance
- **Timeout**: 540 seconds (9 minutes)
- **Retry**: Up to 3 retries with max 10 minutes duration

## Frontend Implementation Guide

### Wellness Completion Tracking

To complete the wellness notification system, you'll need to implement the following on the frontend:

#### 1. Enable Wellness in User Settings

Add a toggle in your user settings to enable wellness features:

```javascript
// In your settings component
const handleWellnessToggle = async (enabled) => {
  await saveUserDataToFirebase(userId, {
    wellnessEnabled: enabled,
    wellnessPreferences: enabled ? {
      enabledCategories: [],  // or user's selected categories
      relationshipStatus: 'All'
    } : null
  });
};
```

#### 2. Handle Notification Click Actions

When users click the evening wellness notification, handle the routing to wellness section:

```javascript
// In your service worker or main app
if (Notification.permission === 'granted') {
  navigator.serviceWorker.addEventListener('notificationclick', (event) => {
    event.notification.close();
    
    const data = event.notification.data;
    if (data.action === 'mark-wellness-complete') {
      // Open app to wellness section
      event.waitUntil(
        clients.openWindow(data.click_action + '#wellness')
      );
    }
  });
}
```

#### 3. Wellness Completion UI

Create a UI component for marking wellness tasks complete:

```javascript
// Example wellness completion component
const WellnessCompletion = ({ userId }) => {
  const [completed, setCompleted] = useState(false);
  
  const handleComplete = async (didComplete) => {
    const userData = await loadUserDataFromFirebase(userId);
    const today = new Date().toISOString().split('T')[0];
    
    // Update completion tracking
    const completions = userData.wellnessCompletions || {};
    completions[today] = {
      completed: didComplete,
      timestamp: new Date().toISOString()
    };
    
    // Update completion count
    const count = userData.completedWellnessTasks || 0;
    const newCount = didComplete ? count + 1 : count;
    
    await saveUserDataToFirebase(userId, {
      wellnessCompletions: completions,
      completedWellnessTasks: newCount
    });
    
    setCompleted(true);
  };
  
  return (
    <div>
      <h3>Did you complete your wellness task today?</h3>
      <button onClick={() => handleComplete(true)}>Yes ✅</button>
      <button onClick={() => handleComplete(false)}>No ❌</button>
    </div>
  );
};
```

#### 4. Track Wellness Statistics

Display wellness statistics in the user dashboard:

```javascript
const WellnessStats = ({ userData }) => {
  const completions = userData.wellnessCompletions || {};
  const total = userData.completedWellnessTasks || 0;
  const thisMonth = Object.entries(completions)
    .filter(([date, data]) => {
      const month = new Date(date).getMonth();
      return month === new Date().getMonth() && data.completed;
    }).length;
  
  return (
    <div>
      <h3>Wellness Progress</h3>
      <p>Total completed: {total}</p>
      <p>This month: {thisMonth}</p>
    </div>
  );
};
```

#### 5. Data Structure

Ensure your Firebase structure supports wellness tracking:

```javascript
// users/{userId}/data/userData
{
  fcmToken: "...",
  wellnessEnabled: true,
  wellnessPreferences: {
    enabledCategories: ["Communication", "Mental Health"],
    relationshipStatus: "All"
  },
  completedWellnessTasks: 15,  // Total count
  wellnessCompletions: {
    "2024-11-24": {
      completed: true,
      timestamp: "2024-11-24T21:30:00.000Z"
    },
    "2024-11-23": {
      completed: true,
      timestamp: "2024-11-23T21:15:00.000Z"
    }
  }
}
```

## Future Enhancements

Potential improvements for these functions:

1. **Token Cleanup**: Automatically remove invalid/expired tokens from Firestore
2. **User Preferences**: Respect user notification preferences (time zone, enabled/disabled, notification types)
3. **Personalization**: Customize notification content based on user data (workout plans, streaks, achievements, etc.)
4. **Batching**: For large user bases (>1000 users), implement batch processing or parallel reads to improve performance and reduce execution time
5. **Multiple Notification Types**: Support additional notification types (reminders, achievements, milestones, streak alerts)
6. **Analytics**: Track notification open rates, engagement, and user response patterns
7. **Dynamic Scheduling**: Allow users to customize notification times based on their schedules

## Troubleshooting

### Common Issues

**Function not executing at scheduled time:**
- Check Firebase Console → Functions → Logs for execution history
- Verify the cron schedule is correct:
  - `sendDailyNotifications`: 0 8 * * * = 8 AM CST daily
  - `sendEveningNotifications`: 0 21 * * * = 9 PM CST daily
- Ensure function is deployed: `firebase deploy --only functions`

**Notifications not received by users:**
- Verify FCM tokens are stored in Firestore: `users/{userId}/data/userData`
- Check user has granted notification permission in browser
- Verify VAPID key matches between frontend and Firebase Console
- Check service worker is registered and active

**High failure count:**
- Review logs for specific error codes
- Check if tokens are expired or invalid
- Verify Firebase project configuration
- Ensure FCM is enabled in Firebase Console

**Function timeout:**
- Current implementation uses sequential Firestore reads, suitable for up to ~1000 users
- For larger user bases, consider implementing batch processing or parallel reads
- Increase timeout in function configuration if needed (max 540 seconds)
- Consider sharding or pagination for very large datasets

## Related Documentation

- [Firebase Cloud Functions Documentation](https://firebase.google.com/docs/functions)
- [Firebase Cloud Messaging Documentation](https://firebase.google.com/docs/cloud-messaging)
- [FIREBASE_SETUP.md](../FIREBASE_SETUP.md) - Main Firebase setup guide
- [README.md](../README.md) - Application overview
