# Bodyweight Progressive Overload & Deload Week Highlighting - Implementation Summary

## Overview
This PR implements two key features for the GoodLift fitness tracking application:

1. **Bodyweight Exercise Progressive Overload**: Specialized progressive overload logic for bodyweight exercises
2. **Deload Week Calendar Highlighting**: Visual indication of deload weeks on the calendar

## Feature 1: Bodyweight Exercise Progressive Overload

### Problem
Previously, all exercises used weight-based progressive overload (increasing weight by 2.5-10 lbs when target reps were hit). This didn't work for bodyweight exercises like push-ups, pull-ups, and dips, where progression should be measured by increasing reps rather than adding weight.

### Solution
For bodyweight exercises (identified by Equipment = "Bodyweight"):
- **Progressive Overload**: When user hits target reps in all sets, target reps increase by 1
- **Regression**: When user completes <80% of target reps across all sets, target reps decrease by 1 (minimum 1)
- **Flexibility**: Target reps can be any positive integer value, not restricted to predefined options (6, 8, 10, 12, 15)

### Technical Implementation

#### 1. Helper Functions (`src/utils/progressiveOverload.js`)
```javascript
// Detect bodyweight exercises
export const isBodyweightExercise = (equipment) => {
  if (!equipment) return false;
  const normalizedEquipment = equipment.toLowerCase();
  return normalizedEquipment.includes('bodyweight') || 
         normalizedEquipment.includes('body weight');
};

// Check if target reps should be reduced (semantic wrapper)
export const shouldReduceTargetReps = (sets, targetReps, minimumSets = 3) => {
  return shouldReduceWeight(sets, targetReps, minimumSets);
};
```

#### 2. Workout Completion Logic (`src/App.jsx`)
- Created exercise lookup Map for O(1) access instead of O(n) find operations
- Separate handling for bodyweight vs weighted exercises
- Progressive overload notifications adapted for both types

```javascript
if (isBodyweight) {
  if (allSetsMetTarget && data.sets.length >= SETS_PER_EXERCISE) {
    const newTargetReps = targetReps + 1;
    await setExerciseTargetReps(exerciseName, newTargetReps);
    // Track progression...
  }
}
```

#### 3. Target Reps Picker (`src/components/Common/TargetRepsPicker.jsx`)
- New `isBodyweight` prop to enable freeform input
- Weighted exercises: Use predefined options (6, 8, 10, 12, 15)
- Bodyweight exercises: Allow any positive integer
- Input validation on blur to prevent rapid state updates

#### 4. Updated Components
- `WorkoutScreen.jsx`: Pass `isBodyweight` prop to TargetRepsPicker
- `ExerciseListPage.jsx`: Detect bodyweight exercises in exercise list
- `WorkoutCreationModal.jsx`: Support bodyweight in workout creation

### Examples
**Weighted Exercise (Bench Press - Barbell)**:
- Week 1: 100 lbs × 10 reps (hit target) → Week 2: 105 lbs × 10 reps

**Bodyweight Exercise (Pull-ups)**:
- Week 1: 8 reps target (hit target) → Week 2: 9 reps target
- Week 3: 9 reps target (hit target) → Week 4: 10 reps target

## Feature 2: Deload Week Calendar Highlighting

### Problem
When a user completes a deload session, it's difficult to see which other days belong to the same deload week. Users need visual clarity about when they're in a recovery/deload phase.

### Solution
When any workout in a week (Sunday-Saturday) is marked as a deload session (isDeload: true):
- All days in that week are highlighted with a yellow/amber background
- Individual deload session days still show darker green
- Clear visual distinction between normal training weeks and deload weeks

### Technical Implementation

#### Calendar Helper Function (`src/components/Calendar/MonthCalendarView.jsx`)
```javascript
const isDateInDeloadWeek = (date) => {
  const weekStart = startOfWeek(date, { weekStartsOn: 0 }); // Sunday
  const weekEnd = endOfWeek(date, { weekStartsOn: 0 });
  
  return workoutHistory.some(workout => {
    const workoutDate = new Date(workout.date);
    return workoutDate >= weekStart && 
           workoutDate <= weekEnd && 
           workout.isDeload === true;
  });
};
```

#### Visual Priority System
1. **Deload session day** (most specific): Dark green background
2. **Deload week day**: Yellow/amber background  
3. **Strength training day**: Light green background
4. **Today**: Selected background
5. **Empty day**: Transparent

#### Color Scheme
```javascript
// Deload week colors
const deloadWeekBgLight = 'rgba(255, 193, 7, 0.15)'; // Amber/yellow
const deloadWeekBgDark = 'rgba(255, 193, 7, 0.20)';
const deloadWeekHoverLight = 'rgba(255, 193, 7, 0.25)';
const deloadWeekHoverDark = 'rgba(255, 193, 7, 0.30)';
```

### Example
If a deload session is completed on Wednesday, January 10:
- Sunday, January 7 through Saturday, January 13: Yellow background
- Wednesday, January 10: Darker green (deload session day)
- Days outside this week: Normal coloring

## Testing

### Bodyweight Progressive Overload Tests
**File**: `tests/bodyweightProgressiveOverload.test.js`

Tests:
1. ✅ Correctly identify bodyweight exercises (various formats)
2. ✅ Target reps reduction logic (20% threshold)
3. ✅ Simulated workout progression workflow
4. ✅ Verify weighted exercises don't use bodyweight logic

All tests pass successfully.

### Deload Week Calendar Highlighting Tests
**File**: `tests/deloadWeekCalendarHighlight.test.js`

Tests:
1. ✅ Deload session on Monday highlights entire week
2. ✅ Deload session on Friday highlights entire week
3. ✅ Multiple deload sessions in same week
4. ✅ Deload sessions in different weeks
5. ✅ Non-deload workouts don't trigger highlighting
6. ✅ Week boundaries (Sunday-Saturday)

All tests pass successfully.

## Code Quality Improvements

### Performance Optimizations
- **Exercise Lookup**: Changed from repeated O(n) `find()` calls to O(1) Map lookup
- **Input Handling**: TargetRepsPicker only applies changes on blur, preventing rapid state updates

### Code Clarity
- **Semantic Naming**: `shouldReduceTargetReps()` wrapper provides clear intent
- **Validation Logic**: Extracted shared validation function in TargetRepsPicker
- **Documentation**: Enhanced comments and JSDoc for all new functions

### Code Review Feedback Addressed
All code review comments were addressed:
1. ✅ Optimized exercise lookup with Map
2. ✅ Improved input handling in TargetRepsPicker
3. ✅ Consolidated validation logic
4. ✅ Enhanced documentation for wrapper function

## Build and Deployment

- ✅ ESLint: No new errors introduced
- ✅ Build: Successfully builds with no errors
- ✅ Tests: All existing tests continue to pass
- ✅ New Tests: 100% pass rate on new test suites

## Impact

### User Experience
- **Bodyweight exercises**: Now have logical progression that matches how they're actually performed
- **Calendar clarity**: Deload weeks are immediately visible, helping users plan their training
- **Flexibility**: Users can set custom target reps for bodyweight exercises

### Technical Debt
- No new technical debt introduced
- Code quality improved through performance optimizations
- Comprehensive test coverage added

## Files Changed

### Core Logic
- `src/App.jsx`: Workout completion with bodyweight support
- `src/utils/progressiveOverload.js`: Helper functions for bodyweight detection

### UI Components
- `src/components/Common/TargetRepsPicker.jsx`: Freeform input for bodyweight
- `src/components/Calendar/MonthCalendarView.jsx`: Deload week highlighting
- `src/components/WorkoutScreen.jsx`: Pass bodyweight prop
- `src/pages/ExerciseListPage.jsx`: Detect bodyweight in list
- `src/components/WorkTabs/WorkoutCreationModal.jsx`: Support bodyweight in creation

### Tests
- `tests/bodyweightProgressiveOverload.test.js`: New test suite
- `tests/deloadWeekCalendarHighlight.test.js`: New test suite

## Future Enhancements

Potential improvements for future iterations:
1. Customizable progression rates (e.g., +2 reps instead of +1)
2. Bodyweight exercise variations (weighted vest support)
3. Visual indicators for progressive overload achievements
4. Historical progression graphs for bodyweight exercises

## Conclusion

This implementation successfully adds intelligent progressive overload for bodyweight exercises while maintaining existing functionality for weighted exercises. The deload week highlighting improves calendar usability and helps users better understand their training cycles. All changes are well-tested, performant, and maintainable.
