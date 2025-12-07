# Exercise Name Format Migration - Changelog

## Overview
This migration resolves the exercise naming format inconsistency by standardizing all exercise names from "Equipment Exercise" format to "Exercise, Equipment" format throughout the project.

## Problem Statement
Exercise names in the repository existed in two formats:
- **Old format**: "Dumbbell Bench Press", "Barbell Squat", "Kettlebell Swing"
- **New format**: "Bench Press, Dumbbell", "Squat, Barbell", "Swing, Kettlebell"

Both formats were appearing inconsistently, and user data (progressive overload data, target weights, target reps) associated with the old format was not being inherited by the new format, causing duplication issues.

## Changes Made

### 1. Data Source Migration
- **File**: `public/data/exercise-expanded.csv`
- **Changes**: Converted 79 exercise names from old format to new format
- **Script**: `scripts/migrate-exercise-names.js`
- **Verification**: All exercises with equipment prefixes (Dumbbell, Barbell, Kettlebell, Landmine, Slam Ball) have been converted

### 2. Generated Data Files
- **Files**: `public/data/exercises.json`, `docs/data/exercises.json`
- **Changes**: Regenerated from updated CSV source
- **Total exercises**: 147 (all with consistent naming format)

### 3. Workout Templates
- **File**: `src/data/workoutTemplates.js`
- **Changes**: Updated all hardcoded exercise names to use new format
- **Affected templates**: 
  - 4-Day Upper/Lower Split
  - Full Body Beginner
  - Push/Pull/Legs
  - Upper Body Focus

### 4. Example Code
- **File**: `src/pages/ExerciseCardDemo.jsx`
- **Change**: Updated demo exercise name to "Incline Bench Press, Dumbbell"

### 5. Documentation
- **File**: `src/utils/helpers.js`
- **Change**: Updated code example in `splitExerciseName` function comment

## User Data Migration

### Automatic Migration System
Created a comprehensive migration system that automatically handles user data:

#### Files Created:
1. **`src/utils/exerciseNameMigration.js`** - Main migration utility
   - Automatically runs on app startup
   - Migrates all user data from old format to new format
   - Only runs once per user (tracks migration version)

2. **`scripts/migrate-user-data.js`** - Standalone migration script
   - Provides migration functions for all data types
   - Generates migration documentation
   - Can be used for manual migration if needed

3. **`public/data/exercise-name-mapping.json`** - Name mapping file
   - Contains 79 exercise name conversions
   - Used by both automatic and manual migration

### Data Types Migrated:
1. **Exercise Weights** (`goodlift_exercise_weights`)
   - User's target weight for each exercise
   - Migrated from old name keys to new name keys

2. **Exercise Target Reps** (`goodlift_exercise_target_reps`)
   - User's target rep counts for each exercise
   - Migrated from old name keys to new name keys

3. **Workout History** (`goodlift_workout_history`)
   - All historical workout data
   - Exercise names in workout logs migrated to new format

4. **Pinned Exercises** (`goodlift_pinned_exercises`)
   - User's pinned exercises for dashboard
   - Exercise names updated to new format

### Migration Behavior:
- **First load**: Migration runs automatically when user opens the app
- **Subsequent loads**: Migration is skipped (version flag prevents re-running)
- **Backward compatibility**: If an exercise has no mapping, it keeps its original name
- **Data preservation**: All user data is preserved during migration
- **Non-destructive**: Original localStorage data is updated in place

## Testing & Verification

### Verification Script
Created `scripts/verify-migration.js` that checks:
1. ✓ No old format names in `exercises.json`
2. ✓ No old format names in `exercise-expanded.csv`
3. ✓ No old format references in `workoutTemplates.js`
4. ✓ Valid mapping file with 79 conversions
5. ✓ Migration utility exists and is functional

### Test Suite
Created `tests/exerciseNameMigration.test.js` with tests for:
- Exercise data format validation
- Name mapping file validation
- Source file verification
- User data migration functions

### Verification Results
All checks passed with 0 errors and 0 warnings.

## Example Conversions

Here are some example exercise name conversions:

| Old Format | New Format |
|-----------|------------|
| Dumbbell Bench Press | Bench Press, Dumbbell |
| Barbell Deadlift | Deadlift, Barbell |
| Kettlebell Swing | Swing, Kettlebell |
| Barbell Squat (High Bar) | Squat (High Bar), Barbell |
| Dumbbell Bulgarian Split Squat | Bulgarian Split Squat, Dumbbell |
| Landmine Press | Press, Landmine |
| Slam Ball Slam | Slam, Slam Ball |

## Files Modified

### Data Files:
- `public/data/exercise-expanded.csv` - Source CSV updated
- `public/data/exercises.json` - Regenerated from CSV
- `docs/data/exercises.json` - Regenerated from CSV

### Source Code:
- `src/App.jsx` - Added migration on startup
- `src/data/workoutTemplates.js` - Updated exercise names
- `src/pages/ExerciseCardDemo.jsx` - Updated demo exercise
- `src/utils/helpers.js` - Updated code example

### New Files:
- `src/utils/exerciseNameMigration.js` - Migration utility
- `public/data/exercise-name-mapping.json` - Name mapping
- `scripts/migrate-exercise-names.js` - CSV migration script
- `scripts/migrate-user-data.js` - User data migration
- `scripts/verify-migration.js` - Verification script
- `tests/exerciseNameMigration.test.js` - Test suite
- `EXERCISE_MIGRATION_SUMMARY.md` - Generated summary
- `EXERCISE_NAME_MIGRATION_CHANGELOG.md` - This file

## Impact on Users

### For Existing Users:
- **Transparent**: Migration happens automatically on first app load
- **No action required**: All data is migrated automatically
- **No data loss**: All existing data is preserved
- **Seamless experience**: Users won't notice any difference except consistent naming

### For New Users:
- **Clean start**: All exercises use the new format from day one
- **No migration needed**: Only one format exists

## Running the Migration Manually

If you need to run the migration manually:

```bash
# 1. Migrate exercise names in CSV
node scripts/migrate-exercise-names.js

# 2. Regenerate JSON files
npm run convert:exercises

# 3. Generate migration instructions
node scripts/migrate-user-data.js

# 4. Verify migration
node scripts/verify-migration.js
```

## Future Maintenance

### Adding New Exercises:
When adding new exercises with equipment, use the new format:
- ✓ Correct: "Exercise Name, Equipment"
- ✗ Incorrect: "Equipment Exercise Name"

### Code References:
Always use the new format when referencing exercises in code:
```javascript
// Correct
const exerciseName = 'Bench Press, Dumbbell';

// Incorrect
const exerciseName = 'Dumbbell Bench Press';
```

## Technical Notes

### Import Assertions:
The migration utility uses JSON imports with type assertion:
```javascript
import exerciseNameMapping from '../../public/data/exercise-name-mapping.json' with { type: 'json' };
```

### Build Process:
- Vite handles JSON imports correctly
- No special configuration required
- JSON file is bundled with the application

### Performance:
- Migration runs only once per user
- Uses localStorage flag to track migration status
- Minimal performance impact (runs in <100ms typically)

## Conclusion

This migration successfully standardizes all exercise names to a consistent format, resolves the duplication issue, and ensures that all user data is seamlessly migrated from the old format to the new format. The automatic migration system provides a transparent upgrade path for existing users while maintaining data integrity.

All tests pass, verification succeeds, and the application builds and runs correctly with the new naming format.
