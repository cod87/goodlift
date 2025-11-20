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

## Benefits

- **Cross-Device Sync**: Access your workout data on any device
- **Data Backup**: Data is stored securely in the cloud
- **Offline Support**: Continue using the app without internet
- **Security**: Your data is protected and private
