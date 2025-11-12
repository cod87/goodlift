# User Profile and Settings System Documentation

## Overview

The GoodLift application now includes a comprehensive user profile and settings management system that allows users to:
- Manage their profile with avatar, display name, bio, and goals
- Track body weight with history and visualization
- Configure app preferences (theme, units, sounds, etc.)
- Export their data for backup
- View detailed statistics and progress

## Components

### 1. Contexts

#### PreferencesContext
Global preferences management for app-wide settings.

**Location**: `src/contexts/PreferencesContext.jsx`

**Features**:
- Unit system (imperial/metric)
- Theme preference
- Notification settings
- Sound settings
- Workout preferences (warmup/cooldown duration, rest timer, auto-progression)

**Usage**:
```javascript
import { usePreferences } from '../contexts/PreferencesContext';

function MyComponent() {
  const { preferences, updatePreference, convertWeight, getDisplayUnit } = usePreferences();
  
  // Update a preference
  updatePreference('units', 'metric');
  
  // Convert weight
  const weightInKg = convertWeight(180, 'lbs', 'kg');
  
  // Get current display unit
  const unit = getDisplayUnit(); // Returns 'lbs' or 'kg'
}
```

#### UserProfileContext
User profile data management including personal information, weight tracking, and statistics.

**Location**: `src/contexts/UserProfileContext.jsx`

**Features**:
- Profile information (displayName, email, avatar, bio, goals)
- Weight tracking with history
- Statistics calculation (total workouts, streaks, favorite exercise, etc.)
- Profile completion percentage

**Usage**:
```javascript
import { useUserProfile } from '../contexts/UserProfileContext';

function MyComponent() {
  const { 
    profile, 
    stats, 
    updateProfile, 
    addWeightEntry,
    getInitials,
    getProfileCompletion 
  } = useUserProfile();
  
  // Update profile field
  await updateProfile('bio', 'Fitness enthusiast!');
  
  // Add weight entry
  await addWeightEntry(175, 'lbs');
  
  // Get user initials
  const initials = getInitials(); // e.g., 'JD' for John Doe
  
  // Get profile completion percentage
  const completion = getProfileCompletion(); // e.g., 85
}
```

### 2. Components

#### UserProfileScreen
Complete profile management interface.

**Location**: `src/pages/UserProfileScreen.jsx`

**Features**:
- Avatar selection (upload or presets)
- Editable profile fields (display name, bio, goals)
- Profile completion indicator
- Statistics cards (total workouts, streaks, PRs, favorite exercise)
- Weight tracking with chart

**Navigation**: Accessible via Settings → Profile tab → "Go to Profile" button

#### AvatarSelector
Dialog for selecting or uploading user avatar.

**Location**: `src/components/AvatarSelector.jsx`

**Features**:
- 15 preset avatar colors
- Custom image upload (JPEG, PNG, WebP)
- Automatic image compression and resizing to 200x200px
- Firebase Storage integration
- Max file size: 5MB

**Usage**:
```javascript
import AvatarSelector from '../components/AvatarSelector';

<AvatarSelector
  open={open}
  onClose={handleClose}
  onSelect={handleAvatarSelect}
  currentAvatar={profile.avatar}
  initials="JD"
/>
```

#### WeightTracker
Weight tracking component with history and visualization.

**Location**: `src/components/WeightTracker.jsx`

**Features**:
- Add new weight entries
- Display current weight with trend indicator
- Line chart showing weight over last 30 days
- Statistics (min, max, average)
- Weight change calculation with percentage

**Usage**:
```javascript
import WeightTracker from '../components/WeightTracker';

<WeightTracker
  weightHistory={profile.weightHistory}
  currentWeight={profile.currentWeight}
  currentUnit={profile.weightUnit}
  onAddWeight={handleAddWeight}
/>
```

#### ProfileWidget
Compact profile display for HomeScreen.

**Location**: `src/components/ProfileWidget.jsx`

**Features**:
- Avatar display
- Display name
- Current weight
- Quick access to profile screen

**Navigation**: Displayed on HomeScreen, click to navigate to full profile

#### Enhanced SettingsScreen
Tabbed settings interface with four main sections.

**Location**: `src/pages/SettingsScreen.jsx`

**Tabs**:
1. **Profile**: Link to UserProfileScreen
2. **Workout**: Stretch reminders, warmup/cooldown duration, workout plans
3. **App**: Theme, sound volume, unit system
4. **Data**: Export profile data, privacy information

### 3. Utilities

#### avatarUtils.js
Avatar management utilities.

**Location**: `src/utils/avatarUtils.js`

**Functions**:
- `PRESET_AVATARS`: Array of 15 preset avatar options
- `compressImage(file, maxWidth, maxHeight, quality)`: Compress images before upload
- `validateImageFile(file)`: Validate image file type and size
- `uploadAvatar(userId, file)`: Upload avatar to Firebase Storage
- `isPresetAvatar(avatar)`: Check if avatar is a preset
- `getPresetAvatarColor(presetId)`: Get color for preset avatar
- `getInitialsAvatarStyle(initials, color)`: Generate style object for initials avatar

#### weightUtils.js
Weight tracking utilities.

**Location**: `src/utils/weightUtils.js`

**Functions**:
- `convertWeight(weight, fromUnit, toUnit)`: Convert between lbs and kg
- `getRecentWeightHistory(weightHistory, days)`: Filter weight history
- `calculateWeightChange(weightHistory, days)`: Calculate weight change over period
- `formatWeight(weight, unit)`: Format weight for display
- `validateWeight(weight, unit)`: Validate weight input
- `prepareWeightChartData(weightHistory, days, targetUnit)`: Prepare data for Chart.js
- `getWeightStats(weightHistory, targetUnit)`: Calculate min, max, average, current weight

#### profileUtils.js
Profile management utilities.

**Location**: `src/utils/profileUtils.js`

**Functions**:
- `calculateProfileCompletion(profile)`: Calculate completion percentage
- `validateDisplayName(displayName)`: Validate display name
- `validateTextField(text, maxLength)`: Validate bio/goals text
- `sanitizeText(text)`: Sanitize user input
- `formatMemberSince(dateString)`: Format member since date (e.g., "3 months ago")
- `formatLongDate(dateString)`: Format full date (e.g., "January 15, 2024")
- `getProfileTips(profile)`: Get tips for incomplete profile fields
- `getInitials(name)`: Extract initials from name
- `exportProfileData(profile, stats)`: Export profile as JSON
- `downloadProfileData(profile, stats)`: Download profile data as file

## Firebase Schema

The profile and preferences data is stored in Firebase Firestore with the following structure:

```javascript
users/{userId}/data/userData {
  // Profile Data
  profile: {
    displayName: string,
    email: string,
    avatar: string,              // URL or preset ID (e.g., "preset-1")
    currentWeight: number,
    weightUnit: string,          // 'lbs' or 'kg'
    weightHistory: [
      {
        weight: number,
        unit: string,
        date: string             // ISO 8601 timestamp
      }
    ],
    bio: string,
    goals: string,
    memberSince: string          // ISO 8601 timestamp
  },
  
  // Preferences Data
  preferences: {
    units: string,               // 'imperial' or 'metric'
    theme: string,               // 'light' or 'dark'
    notifications: boolean,
    sounds: boolean,
    warmupDuration: number,      // minutes
    cooldownDuration: number,    // minutes
    restTimerDefault: number,    // seconds
    autoProgressionEnabled: boolean,
    language: string             // 'en'
  },
  
  // Statistics Data
  stats: {
    totalWorkouts: number,
    currentStreak: number,
    longestStreak: number,
    favoriteExercise: string,
    totalVolume: number,
    totalPRs: number
  },
  
  // Existing workout data
  workoutHistory: [...],
  exerciseWeights: {...},
  // ... other existing fields
}
```

## Firebase Storage

Avatar images are stored in Firebase Storage with the following structure:

```
avatars/
  {userId}/
    avatar.jpg
```

## Features Implementation Checklist

✅ **User Profile Component**
- ✅ Avatar upload/selection with circular display (100x100px)
- ✅ Editable display name
- ✅ Current body weight tracking with history
- ✅ Weight history line graph
- ✅ Bio/goals text fields
- ✅ Member since date
- ✅ Stats summary (total workouts, streak, favorite exercise)

✅ **Settings Component Tabs**
- ✅ Profile: Links to user profile management
- ✅ Workout: Warmup/cooldown preferences, workout plans
- ✅ App: Theme, sounds, unit system
- ✅ Data: Export/privacy options

✅ **Avatar Functionality**
- ✅ Device upload with resizing/compression
- ✅ 15 preset avatars
- ✅ Firebase Storage integration
- ✅ Initials avatar by default
- ✅ Avatar displayed across app (HomeScreen widget)

✅ **Weight Tracking**
- ✅ Input for weight (lbs/kg) with update/timestamp
- ✅ Weight history stored as array in Firebase
- ✅ Graph for last 30 days
- ✅ Weight change indicator (up/down/stable)

✅ **Settings Configuration**
- ✅ Profile: Edit name/avatar/bio/goals/weight
- ✅ Workout: Warmup duration, cooldown duration, workout plans
- ✅ App: Unit system, theme, sound volume
- ✅ Data: Export profile data, privacy information

✅ **Profile Utilities**
- ✅ Avatar upload and compress
- ✅ Weight history management
- ✅ User stats calculation
- ✅ Profile completion % calculation

✅ **Home Screen Profile Widget**
- ✅ Avatar display
- ✅ Tap to navigate to full profile
- ✅ Weight display

✅ **Global Preferences**
- ✅ React Context for preferences
- ✅ Unit conversions applied automatically
- ✅ Cached for offline use (localStorage fallback)

✅ **Validation/Error Handling**
- ✅ Input validation and sanitization
- ✅ Upload error handling
- ✅ User feedback for errors
- ✅ Confirmation for data changes

## Usage Examples

### Setting Up Profile

1. Navigate to Home screen
2. Click on the profile widget or go to Settings → Profile tab
3. Click "Go to Profile"
4. Click the camera icon on the avatar to select/upload an image
5. Edit your display name, bio, and goals
6. Add your current weight using the weight tracker
7. Profile completion percentage will update automatically

### Tracking Weight

1. Go to your profile screen
2. Click the "+" button on the Weight Tracker card
3. Enter your weight and select the unit
4. Click "Add"
5. View the trend graph and statistics

### Changing Preferences

1. Navigate to Settings
2. Select the appropriate tab (Workout, App, or Data)
3. Toggle switches or select options as needed
4. Changes are saved automatically

### Exporting Data

1. Navigate to Settings → Data tab
2. Click "Export Profile Data"
3. A JSON file will be downloaded with your profile and statistics

## Best Practices

1. **Avatar Upload**: Keep images under 5MB. The system will automatically compress and resize images.

2. **Weight Tracking**: Log your weight regularly (e.g., weekly) for accurate trend analysis.

3. **Profile Completion**: Aim for 100% profile completion for the best experience and personalized features.

4. **Data Backup**: Periodically export your profile data for backup purposes.

5. **Units**: Set your preferred unit system early to avoid confusion with weight tracking.

## Security Considerations

1. **Firebase Storage Rules**: Ensure proper security rules are set in Firebase Storage:
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /avatars/{userId}/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

2. **Data Validation**: All user inputs are validated and sanitized before saving to Firebase.

3. **Guest Mode**: Guest users can use the profile system with localStorage, but custom avatar uploads require authentication.

## Troubleshooting

**Avatar not uploading**: 
- Check file size (max 5MB)
- Ensure file type is JPEG, PNG, or WebP
- Verify you're signed in (not in guest mode)

**Weight graph not showing**:
- Add at least one weight entry
- Check that weights are in valid range (20-450kg or 50-1000lbs)

**Profile not saving**:
- Verify internet connection
- Check Firebase console for errors
- Ensure you're authenticated

**Preferences not persisting**:
- Check browser localStorage permissions
- Verify Firebase connection for authenticated users
