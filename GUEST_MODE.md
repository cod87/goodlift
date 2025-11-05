# Guest Mode Feature Documentation

## Overview
Guest mode allows users to use the GoodLift app without creating an account. All data is stored locally in the browser's localStorage and can optionally be migrated to a cloud account later.

## Features Implemented

### 1. Guest Mode Entry
- **"Continue as Guest" button** on the authentication screen
- Creates a guest user object with UID "guest"
- Stores guest mode flag in localStorage (`goodlift_guest_mode`)

### 2. Data Persistence
All workout and user data is stored in localStorage with the prefix `goodlift_guest_`:
- Workout history
- User statistics (total workouts, time, etc.)
- Exercise weights
- Exercise target reps
- HIIT sessions
- Stretch sessions
- Yoga sessions
- Favorite workouts

Data is stored in a versioned JSON format for future compatibility:
```json
{
  "version": 1,
  "data": { ... },
  "lastUpdated": "2024-01-01T00:00:00.000Z"
}
```

### 3. Guest Mode Indicator
- **Yellow "Guest Mode" chip** displayed in the NavigationSidebar
- Tooltip: "You're in guest mode. Sign up to save your data permanently!"
- Always visible when in guest mode

### 4. Guest Signup Prompt
- **Persistent snackbar** at bottom of screen
- Message: "You're in guest mode. Sign up to save your data permanently!"
- Dismissible for 24 hours
- "Sign Up" button navigates to progress screen

### 5. Guest Logout Confirmation
- **Confirmation dialog** when guest user clicks logout
- Warns about permanent data deletion
- Options:
  - Cancel (returns to app)
  - Sign Out & Delete Data (logs out and clears all guest data)

### 6. Data Migration
When a guest user signs up or logs in:
- **Migration dialog** automatically appears
- Shows available guest data
- Options:
  - "Save My Data" - migrates all data to Firebase account
  - "Skip" - clears guest data without migration

Migration includes:
- All workout history
- User statistics
- Exercise weights and target reps
- All session data (HIIT, stretch, yoga)

### 7. localStorage Quota Handling
- Graceful handling of quota exceeded errors
- Console logging for debugging
- Data is stored efficiently with versioning

## File Structure

### New Files
- `src/utils/guestStorage.js` - Guest storage utilities
- `src/components/GuestLogoutDialog.jsx` - Logout confirmation dialog
- `src/components/GuestDataMigrationDialog.jsx` - Data migration dialog

### Modified Files
- `src/contexts/AuthContext.jsx` - Guest mode state and functions
- `src/components/AuthScreen.jsx` - "Continue as Guest" button
- `src/components/NavigationSidebar.jsx` - Guest indicator and logout handling
- `src/App.jsx` - Guest snackbar and migration dialog
- `src/utils/storage.js` - Guest mode detection in all storage functions

## API Reference

### AuthContext
```javascript
const { 
  isGuest,           // boolean - true if in guest mode
  hasGuestData,      // boolean - true if guest data exists
  continueAsGuest,   // function - enter guest mode
  checkGuestData,    // function - check for guest data
} = useAuth();
```

### Guest Storage Functions
```javascript
import {
  isGuestMode,              // Check if in guest mode
  enableGuestMode,          // Enable guest mode
  disableGuestMode,         // Disable guest mode
  getGuestData,             // Get guest data by category
  setGuestData,             // Set guest data by category
  clearGuestData,           // Clear all guest data
  getAllGuestData,          // Get all guest data (for migration)
  shouldShowGuestSnackbar,  // Check if snackbar should show
  dismissGuestSnackbar,     // Dismiss snackbar for 24hrs
  getStorageUsage,          // Get storage usage stats
} from './utils/guestStorage';
```

## User Flows

### Flow 1: Guest User Completes Workout
1. User opens app → sees auth screen
2. Clicks "Continue as Guest"
3. Sees guest mode indicator in sidebar
4. Completes a workout
5. Data is saved to localStorage with `goodlift_guest_` prefix
6. User closes and reopens app
7. Still in guest mode with all data intact

### Flow 2: Guest User Signs Up (with migration)
1. User is in guest mode with workout data
2. Clicks "Sign Up" button in snackbar or auth area
3. Creates account
4. Migration dialog appears automatically
5. Clicks "Save My Data"
6. All guest data is migrated to Firebase
7. Guest data is cleared from localStorage
8. User continues with authenticated account

### Flow 3: Guest User Signs Up (skip migration)
1. User is in guest mode with workout data
2. Signs up for account
3. Migration dialog appears
4. Clicks "Skip"
5. Guest data is cleared
6. User starts fresh with authenticated account

### Flow 4: Guest User Logs Out
1. User clicks logout in sidebar
2. Confirmation dialog appears with warning
3. User clicks "Sign Out & Delete Data"
4. All guest data is cleared from localStorage
5. Returns to auth screen

## Technical Details

### localStorage Keys
- `goodlift_guest_mode` - Guest mode flag (true/false)
- `goodlift_guest_workout_history` - Workout history array
- `goodlift_guest_user_stats` - User statistics object
- `goodlift_guest_exercise_weights` - Exercise weights object
- `goodlift_guest_exercise_target_reps` - Target reps object
- `goodlift_guest_hiit_sessions` - HIIT sessions array
- `goodlift_guest_stretch_sessions` - Stretch sessions array
- `goodlift_guest_yoga_sessions` - Yoga sessions array
- `goodlift_guest_favorite_workouts` - Favorite workouts array
- `goodlift_guest_snackbar_dismissed` - Snackbar dismissal timestamp

### Data Versioning
All guest data uses version 1 format:
```javascript
{
  version: 1,
  data: <actual_data>,
  lastUpdated: <ISO_timestamp>
}
```

This allows for future migrations if data structure changes.

### Storage Detection
All storage functions in `src/utils/storage.js` check for guest mode:
```javascript
if (isGuestMode()) {
  // Use guest storage
  return getGuestData('workout_history');
} else if (currentUserId) {
  // Use Firebase
  return loadFromFirebase(currentUserId);
} else {
  // Use regular localStorage
  return localStorage.getItem(key);
}
```

## Testing

### Manual Testing Checklist
See `/tmp/guest_mode_test_checklist.sh` for comprehensive manual test checklist covering:
- Guest mode entry
- Data persistence
- Snackbar behavior
- Logout confirmation
- Data migration
- All data categories
- UI consistency
- Responsive design
- Edge cases

### Unit Tests
Basic unit tests for guest storage utilities are available in `/tmp/test_guest_storage.js`:
```bash
node /tmp/test_guest_storage.js
```

## Browser Compatibility
- All modern browsers with localStorage support
- Tested in Chrome, Firefox, Safari, Edge
- Mobile responsive design
- Progressive Web App compatible

## Security Considerations
- Guest data is stored in plaintext in localStorage (browser security applies)
- No sensitive authentication data is stored for guest users
- Guest mode flag prevents accidental Firebase operations
- Data migration uses authenticated Firebase connection
- Clear warnings before data deletion

## Future Enhancements
1. Add data export feature (CSV/JSON)
2. Implement data compression for large datasets
3. Add sync conflicts resolution for migration
4. Implement offline mode detection
5. Add data backup reminders
6. Implement guest session analytics (privacy-respecting)

## Known Limitations
1. Guest data is device-specific (not synced across devices)
2. Clearing browser data will delete guest data
3. Private browsing mode may limit functionality
4. localStorage quota varies by browser (typically 5-10MB)
5. No cloud backup for guest data

## Support & Troubleshooting

### Common Issues

**Q: I lost my guest data after clearing browser cache**
A: Guest data is stored in localStorage which is cleared when browser data is cleared. Sign up for an account to save data to the cloud.

**Q: The migration dialog doesn't appear**
A: Ensure you have guest data before signing up. Check browser console for errors.

**Q: I'm getting quota exceeded errors**
A: Clear old guest data or sign up to move data to cloud storage which has much higher limits.

**Q: Guest mode indicator not showing**
A: Refresh the page. Check browser console for JavaScript errors.

## Migration Guide (For Developers)

If modifying guest storage structure:

1. Update `GUEST_DATA_VERSION` in `guestStorage.js`
2. Add migration logic in `getGuestData()`:
```javascript
if (parsed.version === 1) {
  // Migrate from v1 to v2
  return migrateV1ToV2(parsed.data);
}
```
3. Test migration with existing guest data
4. Update documentation

## Performance Considerations
- Guest data is loaded synchronously from localStorage (fast)
- No network requests for data operations in guest mode
- Migration is async and shows progress indicator
- Large datasets may slow down page loads (implement lazy loading if needed)

## Accessibility
- All dialogs are keyboard navigable
- ARIA labels on important elements
- Screen reader friendly
- High contrast mode compatible
- Focus management in dialogs

## Conclusion
Guest mode provides a frictionless entry point for new users while maintaining data integrity and offering clear upgrade paths to authenticated accounts.
