# Data Model Migration Plan

## Overview
This document outlines the data model simplification and cleanup migration for the GoodLift fitness tracking application. The migration consolidates redundant data structures, archives data from removed features, and removes orphaned references.

## Migration Goals
1. **Migrate workout history to new format** - Ensure all workout data uses consistent structure
2. **Archive data from deleted features** - Preserve yoga/legacy feature data before removal
3. **Consolidate redundant data structures** - Remove duplicate stats tracking
4. **Remove orphaned references** - Clean up references to deleted features

## Data Structures

### KEEP - Active Data Structures
These data structures are currently in use and should be preserved:

- **workout_history** - Main workout history (resistance training sessions)
- **exercise_weights** - Target weights for each exercise
- **exercise_target_reps** - Target rep counts for exercises
- **hiit_sessions** - HIIT workout session history
- **cardio_sessions** - Cardio activity history
- **stretch_sessions** - Stretching/mobility session history
- **workout_plans** - User-created workout plans
- **active_plan** - Currently active workout plan ID
- **favorite_exercises** - User's favorited exercises
- **pinned_exercises** - Exercises pinned for progress tracking

### ARCHIVE - Legacy Data Structures
These contain data from removed/deprecated features:

- **yoga_sessions** - Legacy yoga session data (feature removed)
- **favorite_workouts** - Pre-built favorite workouts (replaced by workout_plans)

### REMOVE - Orphaned References
These are remnants that should be cleaned up:

- **totalYogaTime** in user_stats - Reference to removed yoga feature
- Duplicate stat calculations between session types

## Migration Steps

### Step 1: Workout History Format Migration
**Status**: KEEP
**Action**: Validate and normalize all workout history entries

Ensure all workout entries have:
- Consistent date format (ISO 8601 timestamps)
- Valid exercise data structure
- Duration in seconds
- Type field (e.g., 'Upper Body', 'Lower Body', 'Full Body', 'Cardio')

### Step 2: Archive Legacy Data

#### Yoga Sessions Archive
**Status**: ARCHIVE
**Action**: Move yoga session data to archived storage

- Check for any `yoga_sessions` data in localStorage/Firebase
- If exists, create `archived_yoga_sessions` with timestamp
- Preserve original data structure for potential future restoration
- Remove from active storage

#### Favorite Workouts Archive
**Status**: ARCHIVE  
**Action**: Archive pre-built favorite workouts

- Favorite workouts functionality has been replaced by workout_plans
- Archive existing `favorite_workouts` data as `archived_favorite_workouts`
- Keep for reference but remove from active storage
- Users should use workout_plans going forward

### Step 3: Consolidate Stats Tracking

**Status**: REMOVE redundancy
**Action**: Simplify user_stats calculation

Current Issue:
- Stats are calculated from multiple sources (user_stats object + individual sessions)
- This can lead to inconsistencies

Migration:
- Remove redundant totalYogaTime field from user_stats
- Ensure stats are calculated dynamically from session data:
  - totalWorkouts = workout_history.length
  - totalTime = sum(workout_history.duration)
  - totalHiitTime = sum(hiit_sessions.duration)
  - totalCardioTime = sum(cardio_sessions.duration)
  - totalStretchTime = sum(stretch_sessions.duration)
- Remove stored user_stats; calculate on-demand instead

### Step 4: Remove Orphaned References

**Status**: REMOVE
**Action**: Clean up references to deleted features

- Remove totalYogaTime from all user_stats objects
- Remove any yoga-related filters or options
- Clean up any UI references to archived features
- Remove unused storage keys from KEYS constant

## Data Validation

After migration, verify:

1. **Workout History Integrity**
   - All workouts have valid dates
   - Exercise data is properly structured
   - No data loss occurred

2. **Session Data Integrity**
   - HIIT sessions are accessible
   - Cardio sessions are accessible  
   - Stretch sessions are accessible
   - All sessions have required fields (id, date, duration)

3. **Workout Plans Functionality**
   - All plans are accessible
   - Active plan loads correctly
   - Plan sessions are properly structured

4. **User Preferences Preserved**
   - Favorite exercises maintained
   - Pinned exercises maintained
   - Exercise weights and target reps preserved

5. **Stats Calculation**
   - Stats calculate correctly from session data
   - No references to archived data in active stats

## Rollback Plan

If migration fails:
1. Archive data is preserved in `archived_*` keys
2. Original data can be restored from archives
3. Migration script should be idempotent (safe to run multiple times)

## Components Marked as KEEP

The following components must continue to function after migration:

### Core Workout Components
- `WorkoutScreen.jsx` - Active workout execution
- `WorkoutPreview.jsx` - Workout preview and customization
- `CompletionScreen.jsx` - Workout completion and saving
- `CustomizeExerciseScreen.jsx` - Exercise customization

### Planning Components  
- `WorkoutPlanScreen.jsx` - Workout plan management
- `WorkoutPlanBuilderDialog.jsx` - Plan creation
- `RecurringSessionEditor.jsx` - Recurring session editing
- `Calendar.jsx` - Calendar view of planned workouts

### Session Components
- `Cardio/CardioTimer.jsx` - Cardio session tracking
- `Stretch/StretchSession.jsx` - Stretch session execution
- `Warmup/DynamicWarmup.js` - Warmup routines
- `Cooldown/StaticStretches.js` - Cooldown stretches
- `Mobility/MobilityScreen.jsx` - Mobility exercises

### Progress & Analytics
- `ProgressScreen.jsx` - Progress tracking and charts
- `Progress/ChartTabs.jsx` - Chart visualization
- `Progress/ActivitiesList.jsx` - Activity history
- `Progress/StatsRow.jsx` - Statistics display

### Utility Components
- `SelectionScreen.jsx` - Workout selection
- `TodayView/TodayView.jsx` - Today's planned workouts
- `UnifiedWorkoutHub.jsx` - Central workout hub
- `NavigationSidebar.jsx` - App navigation

## Testing Requirements

After migration, test:
1. Create and complete a workout
2. View progress charts
3. Create and activate a workout plan
4. Log cardio, HIIT, and stretch sessions
5. Pin exercises for tracking
6. Set exercise weights and reps
7. Navigate all main screens
8. Verify no console errors
9. Verify Firebase sync (if authenticated)
10. Verify guest mode (if in guest mode)

## Implementation Notes

- Migration should run once on app initialization after deployment
- Use a migration version flag to prevent re-running
- Log all migration actions for debugging
- Preserve backups before making destructive changes
- Migration should work for both Firebase and localStorage data
- Support both authenticated and guest mode users
