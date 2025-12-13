# SVG Rendering Investigation - Root Cause Found

## Problem Statement
SVG diagrams render correctly in WorkoutExerciseCard (workout builder modal) but fail to appear or are missing in standard ExerciseCard views.

## Root Cause: Data Loss in Workout Generation

### Issue Identified
The `generateScientificWorkout` function in `/src/utils/scientificWorkoutGenerator.js` was creating workout exercises but **NOT preserving critical metadata** needed for SVG generation:

**Missing Properties:**
- `'Secondary Muscles'` ❌
- `'Webp File'` ❌

**Result:** When workouts are generated and executed, exercises lack the muscle metadata needed to generate SVG fallback images.

### Why WorkoutExerciseCard Works
WorkoutExerciseCard receives exercises directly from exercises.json with full metadata when building workouts in the modal.

### Why Other Views Fail
- WorkoutScreen executes from generated workout plans that have incomplete exercise objects
- ExerciseListItem displays exercises that may come from saved workouts
- ExerciseCard (demo) may receive incomplete props

## Fix Applied

Updated `scientificWorkoutGenerator.js` line 51-65 to preserve all exercise metadata:

```javascript
return {
  'Exercise Name': exercise['Exercise Name'],
  'Primary Muscle': exercise['Primary Muscle'],
  'Secondary Muscles': exercise['Secondary Muscles'],  // ✓ NOW INCLUDED
  'Webp File': exercise['Webp File'],                  // ✓ NOW INCLUDED
  'Equipment': exercise.Equipment,
  'Type': exercise.Type,
  name: exercise['Exercise Name'],
  sets: exerciseSets,
  reps: exerciseReps,
  restSeconds: exerciseRest,
  weight: '',
  notes: isDeload ? 'Deload week - reduced volume' : '',
  supersetGroup: determineSupersetGroup(),
  videoLink: exercise['Video Link'] || '',
  isCompound
};
```

### Impact
This ensures that whenever a workout is generated:
1. All exercise metadata is preserved
2. SVG generation has the data it needs
3. Fallback images display correctly in all views
4. Consistent behavior across all components

## Debug Logging

Comprehensive debug logging has been added to trace data flow:

1. **getDemoImagePath** (`src/utils/exerciseDemoImages.js`)
   - Logs all input parameters
   - Logs output at each priority level
   - Tracks SVG vs image type detection

2. **WorkoutExerciseCard** (`src/components/Common/WorkoutExerciseCard.jsx`)
   - Logs exercise data extraction
   - Logs getDemoImagePath results

3. **ExerciseCard** (`src/components/Workout/ExerciseCard.jsx`)
   - Logs received props
   - Logs getDemoImagePath results

4. **ExerciseListItem** (`src/components/Common/ExerciseListItem.jsx`)
   - Logs exercise data extraction
   - Logs getDemoImagePath results

5. **WorkoutScreen** - Already had logging

### Verification
With debug logging enabled, run the application and:
1. Generate a workout
2. Start the workout
3. Check console logs to verify:
   - `primaryMuscle` is present ✓
   - `secondaryMuscles` is present ✓
   - `webpFile` is present ✓
   - SVG data URLs are being generated ✓

## Next Steps

1. ✅ Fix applied to scientificWorkoutGenerator.js
2. ⏳ Test the fix:
   - Generate new workouts
   - Execute workouts
   - Verify SVGs appear in all views
3. ⏳ Clean up debug logging (can be removed or commented out)
4. ⏳ Document in PR

## Technical Details

### SVG Rendering Logic (Identical Across All Components)
All components use the same rendering pattern:

```javascript
const imagePath = getDemoImagePath(exerciseName, true, webpFile, primaryMuscle, secondaryMuscles);

{isSvgDataUrl(imagePath) ? (
  <Box dangerouslySetInnerHTML={{ __html: extractSvgFromDataUrl(imagePath) }} />
) : (
  <img src={imagePath} />
)}
```

### getDemoImagePath Priority
1. If `webpFile` exists and is valid → use webp image
2. If `exerciseName` matches a demo image → use demo image
3. If `primaryMuscle` exists → **generate muscle SVG** ⭐
4. Otherwise → use work-icon.svg fallback

**The issue was step 3 failing** because `primaryMuscle` and `secondaryMuscles` were missing from generated workout exercises.

## Files Modified

1. `/src/utils/scientificWorkoutGenerator.js` - Added missing metadata preservation
2. `/src/utils/exerciseDemoImages.js` - Added debug logging
3. `/src/components/Workout/ExerciseCard.jsx` - Added debug logging  
4. `/src/components/Common/WorkoutExerciseCard.jsx` - Added debug logging
5. `/src/components/Common/ExerciseListItem.jsx` - Added debug logging
