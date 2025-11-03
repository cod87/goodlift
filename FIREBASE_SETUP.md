# Firebase Setup for GoodLift

## Overview
GoodLift uses Firebase Firestore to store and sync user workout data across devices. This document explains the Firebase configuration and security rules needed.

## Firestore Data Structure

User data is stored in the following structure:
```
users/{userId}/data/userData
```

Where:
- `{userId}` is the Firebase Authentication UID of the user
- The `userData` document contains:
  - `workoutHistory`: Array of workout objects
  - `userStats`: Object with totalWorkouts and totalTime
  - `exerciseWeights`: Object mapping exercise names to weights
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
2. App loads user data from Firestore
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

## Benefits

- **Cross-Device Sync**: Access your workout data on any device
- **Data Backup**: Data is stored securely in the cloud
- **Offline Support**: Continue using the app without internet
- **Security**: Your data is protected and private
