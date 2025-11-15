# Favorite Workout Scheduling Feature

## Overview
This feature enables users to assign their favorited workouts to specific days of the week. Assigned workouts appear as "Suggested Sessions" throughout the app and persist until a Deload week is initiated.

## Features

### 1. Assign Favorites to Days
- From the **Workout Tab**, users can see their favorite workouts
- Each favorite has a calendar icon button
- Clicking the calendar button opens a day-of-week selector
- Users can assign a favorite to Monday through Sunday
- Only one workout can be assigned per favorite (but multiple favorites can be assigned to different days)

### 2. Visual Indicators
- **Green checkmark chip**: Shows which day (if any) a favorite is assigned to
- **Star icon**: In the Week Editor, workouts assigned from favorites show a star icon
- **Calendar icon color**: 
  - Green when a favorite is assigned to a day
  - Gray when not assigned

### 3. Week Editor Integration
- Access from **Settings** → **Workout Scheduling** → **Edit Weekly Schedule**
- Shows all assigned workouts for each day of the week
- Workouts from favorites display with:
  - The workout name
  - A star icon (⭐) indicating it's from favorites
  - The workout type chip
- Users can edit or clear favorite assignments directly from the Week Editor

### 4. Deload Week Reset
- When a Deload week is triggered (available from Week 4+):
  - All weekly workout assignments are cleared
  - This includes all favorite workout assignments
  - The weekly schedule resets to a blank state
  - Users can re-assign favorites after the deload week

## User Workflow

### Assigning a Favorite to a Day
1. Navigate to **Work** tab (or any tab showing favorites)
2. Locate the favorite workout you want to assign
3. Click the **calendar icon** (📅) on the workout card
4. Select the day of the week from the dropdown menu
5. A green checkmark chip appears showing the assigned day
6. The assignment is saved automatically

### Viewing Assignments
1. Go to **Settings**
2. Select **Edit Weekly Schedule** under Workout Scheduling
3. View all assignments for each day
4. Workouts from favorites show a **star icon** (⭐)

### Clearing/Changing Assignments
**From Favorites Widget:**
1. Click the calendar icon on the favorite
2. Select a different day (overwrites previous assignment)

**From Week Editor:**
1. Open Week Editor from Settings
2. Click the delete icon (🗑️) next to the assigned workout
3. The assignment is cleared immediately

### Deload Week Behavior
1. When you reach Week 4+, you can trigger a Deload week
2. Triggering Deload clears all weekly assignments
3. After the Deload week ends (next Sunday):
   - Week counter increments
   - Deload flag is turned off
   - Schedule remains cleared
4. Users can re-assign favorites to days as needed

## Technical Details

### Data Structure
Favorite workouts assigned to days are stored with the following structure:
```javascript
{
  sessionType: 'full',           // Workout type
  sessionName: 'My Workout',     // Display name
  exercises: [...],              // Array of exercises
  assignedDate: '2025-11-15...',  // ISO timestamp
  fromFavorite: true,            // Flag indicating source
  favoriteId: 'fav_123...'       // Reference to original favorite
}
```

### Storage Location
- Assignments are stored in `WeekSchedulingContext` under `weeklySchedule`
- Persisted to localStorage or Firebase based on user auth state
- Stored separately from the favorites list itself

### Context Integration
- Uses `WeekSchedulingContext` for state management
- `assignWorkoutToDay(dayOfWeek, sessionData)` - Assigns workout to a day
- `weeklySchedule` - Object containing assignments for each day
- `triggerDeloadWeek()` - Clears all assignments and activates deload

## Components Modified

1. **FavouriteWorkoutsWidget.jsx**
   - Added calendar button for day assignment
   - Added day selection menu
   - Shows assigned day chip
   - Integrates with WeekSchedulingContext

2. **WeekSchedulingContext.jsx**
   - Modified `triggerDeloadWeek()` to clear weekly schedule
   - Existing `assignWorkoutToDay()` handles favorite assignments

3. **WeekEditorDialog.jsx**
   - Added star icon for favorite-sourced workouts
   - Visual indicator using `fromFavorite` flag

## Future Enhancements (Not Implemented)
- Bulk assignment of multiple favorites at once
- Copy previous week's assignments to current week
- Recurring assignment patterns (e.g., same workout every Monday)
- Favorite workout categories/tags for better organization
