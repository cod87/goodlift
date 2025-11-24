# Firebase Cloud Functions for GoodLift

This directory contains Firebase Cloud Functions for the GoodLift application.

## Functions

### `sendDailyNotifications`

A scheduled function that sends daily workout reminder notifications to all users with registered FCM tokens.

- **Schedule**: Every day at 8:00 AM CST
- **Trigger**: Scheduled (cron)
- **Description**: Queries all users, collects FCM tokens, and sends push notifications

**Key Features:**
- Queries all users from Firestore (`users/{userId}/data/userData`)
- Collects FCM tokens from user documents
- Sends batch notifications using `admin.messaging().sendEachForMulticast()`
- Handles errors for invalid/expired tokens
- Comprehensive logging for monitoring and troubleshooting

### `sendEveningNotifications`

A scheduled function that sends evening progress check-in notifications to all users with registered FCM tokens.

- **Schedule**: Every day at 9:00 PM CST
- **Trigger**: Scheduled (cron)
- **Description**: Queries all users, collects FCM tokens, and sends evening motivational push notifications

**Key Features:**
- Queries all users from Firestore (`users/{userId}/data/userData`)
- Collects FCM tokens from user documents with proper await handling
- Sends batch notifications using `admin.messaging().sendEachForMulticast()`
- Unique evening-themed title and motivational message for progress check-in
- Handles errors for invalid/expired tokens
- Comprehensive logging for monitoring and troubleshooting

## Setup

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
Default configuration:
```javascript
{
  notification: {
    title: "Good Morning! ☀️",
    body: "Time to crush your workout today! Let's get moving! 💪",
    icon: "/goodlift/icons/goodlift-icon-192.png", // Configurable via NOTIFICATION_ICON
    badge: "/goodlift/icons/goodlift-icon-192.png", // Configurable via NOTIFICATION_BADGE
  },
  data: {
    type: "daily-reminder",
    timestamp: "2024-11-24T08:00:00.000Z",
    click_action: "/goodlift/", // Configurable via NOTIFICATION_CLICK_ACTION
  }
}
```

### Evening Notification (sendEveningNotifications)
Default configuration:
```javascript
{
  notification: {
    title: "Evening Check-In 🌙",
    body: "How did today go? Review your progress and plan for tomorrow! Keep building momentum! 🎯",
    icon: "/goodlift/icons/goodlift-icon-192.png", // Configurable via NOTIFICATION_ICON
    badge: "/goodlift/icons/goodlift-icon-192.png", // Configurable via NOTIFICATION_BADGE
  },
  data: {
    type: "evening-checkin",
    timestamp: "2024-11-24T21:00:00.000Z",
    click_action: "/goodlift/", // Configurable via NOTIFICATION_CLICK_ACTION
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
