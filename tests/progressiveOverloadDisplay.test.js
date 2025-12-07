/**
 * Tests for Progressive Overload Display Logic
 * 
 * Tests the logic for displaying progressive overload data, specifically:
 * - Exercises with recorded data always show their current weight/reps
 * - Exercises without progression still display current performance
 * - Both weight and reps are displayed together
 * - Trend indicators only show when there's meaningful progression
 */

console.log('=== Progressive Overload Display Logic Tests ===\n');

// Inline simplified version of getExerciseProgression for testing
function getExerciseProgression(workoutHistory, exerciseName, mode = 'weight') {
  if (!workoutHistory || !Array.isArray(workoutHistory)) {
    return [];
  }

  const progressionData = [];

  workoutHistory.forEach((workout) => {
    if (!workout.exercises || !workout.exercises[exerciseName]) {
      return;
    }

    const exerciseData = workout.exercises[exerciseName];
    const sets = exerciseData.sets || [];

    if (sets.length === 0) {
      return;
    }

    let value;
    if (mode === 'weight') {
      value = Math.max(...sets.map(set => set.weight || 0));
    } else if (mode === 'reps') {
      value = Math.max(...sets.map(set => set.reps || 0));
    }

    if (value > 0) {
      progressionData.push({
        date: new Date(workout.date),
        value,
        workout,
      });
    }
  });

  progressionData.sort((a, b) => a.date - b.date);
  return progressionData;
}

// Inline simplified version of getLatestPerformance for testing
function getLatestPerformance(workoutHistory, exerciseName, trackingMode = 'weight') {
  if (!workoutHistory || !Array.isArray(workoutHistory) || workoutHistory.length === 0) {
    return null;
  }

  const sortedWorkouts = [...workoutHistory].sort((a, b) => 
    new Date(b.date) - new Date(a.date)
  );

  for (const workout of sortedWorkouts) {
    if (workout.exercises && workout.exercises[exerciseName]) {
      const exerciseData = workout.exercises[exerciseName];
      if (exerciseData.sets && exerciseData.sets.length > 0) {
        let bestSet;
        if (trackingMode === 'reps') {
          bestSet = exerciseData.sets.reduce((best, current) => {
            const currentReps = current.reps || 0;
            const bestReps = best.reps || 0;
            return currentReps > bestReps ? current : best;
          }, exerciseData.sets[0]);
        } else {
          bestSet = exerciseData.sets.reduce((best, current) => {
            const currentWeight = current.weight || 0;
            const bestWeight = best.weight || 0;
            return currentWeight > bestWeight ? current : best;
          }, exerciseData.sets[0]);
        }

        return {
          weight: bestSet.weight || 0,
          reps: bestSet.reps || 0,
          date: workout.date,
        };
      }
    }
  }

  return null;
}

// Helper function to create a workout with exercises
const createWorkout = (date, exercises) => ({
  date: date.toISOString(),
  duration: 3600,
  type: 'strength',
  exercises,
});

// Helper function to create exercise data
const createExercise = (sets) => ({
  sets: sets.map(({ weight, reps }) => ({ weight, reps })),
});

// Test 1: Exercise with no progression (same weight every time)
console.log('Test 1: Exercise with no weight progression');
console.log('--------------------------------------------');
const workout1a = createWorkout(
  new Date('2024-01-01'),
  { 'Bench Press': createExercise([{ weight: 135, reps: 10 }, { weight: 135, reps: 10 }, { weight: 135, reps: 8 }]) }
);
const workout1b = createWorkout(
  new Date('2024-01-03'),
  { 'Bench Press': createExercise([{ weight: 135, reps: 10 }, { weight: 135, reps: 9 }, { weight: 135, reps: 8 }]) }
);
const workout1c = createWorkout(
  new Date('2024-01-05'),
  { 'Bench Press': createExercise([{ weight: 135, reps: 10 }, { weight: 135, reps: 10 }, { weight: 135, reps: 9 }]) }
);

const history1 = [workout1a, workout1b, workout1c];
const progression1 = getExerciseProgression(history1, 'Bench Press', 'weight');
const latestPerf1 = getLatestPerformance(history1, 'Bench Press', 'weight');

console.log(`Workouts: 3 sessions with consistent 135 lbs`);
console.log(`Progression data points: ${progression1.length}`);
console.log(`Latest performance: Weight=${latestPerf1?.weight} lbs, Reps=${latestPerf1?.reps}`);
console.log(`Expected: Should have 3 progression points (all 135 lbs) and latest performance should be 135 lbs / 10 reps`);
console.log(`Result: ${progression1.length === 3 && latestPerf1?.weight === 135 && latestPerf1?.reps === 10 ? '✓ PASS' : '✗ FAIL'}\n`);

// Test 2: Exercise with actual progression
console.log('Test 2: Exercise with weight progression');
console.log('-----------------------------------------');
const workout2a = createWorkout(
  new Date('2024-01-01'),
  { 'Squat': createExercise([{ weight: 185, reps: 10 }, { weight: 185, reps: 10 }, { weight: 185, reps: 8 }]) }
);
const workout2b = createWorkout(
  new Date('2024-01-03'),
  { 'Squat': createExercise([{ weight: 195, reps: 10 }, { weight: 195, reps: 9 }, { weight: 195, reps: 8 }]) }
);
const workout2c = createWorkout(
  new Date('2024-01-05'),
  { 'Squat': createExercise([{ weight: 205, reps: 10 }, { weight: 205, reps: 10 }, { weight: 205, reps: 9 }]) }
);

const history2 = [workout2a, workout2b, workout2c];
const progression2 = getExerciseProgression(history2, 'Squat', 'weight');
const latestPerf2 = getLatestPerformance(history2, 'Squat', 'weight');

console.log(`Workouts: 3 sessions progressing from 185 to 195 to 205 lbs`);
console.log(`Progression data points: ${progression2.length}`);
console.log(`Latest performance: Weight=${latestPerf2?.weight} lbs, Reps=${latestPerf2?.reps}`);
console.log(`Progression values: ${progression2.map(p => p.value).join(' -> ')}`);
console.log(`Expected: Should have 3 progression points (185, 195, 205) and latest should be 205 lbs / 10 reps`);
console.log(`Result: ${progression2.length === 3 && latestPerf2?.weight === 205 && latestPerf2?.reps === 10 ? '✓ PASS' : '✗ FAIL'}\n`);

// Test 3: Exercise logged only once (no progression history)
console.log('Test 3: Exercise logged only once');
console.log('----------------------------------');
const workout3 = createWorkout(
  new Date('2024-01-01'),
  { 'Deadlift': createExercise([{ weight: 225, reps: 8 }, { weight: 225, reps: 8 }, { weight: 225, reps: 7 }]) }
);

const history3 = [workout3];
const progression3 = getExerciseProgression(history3, 'Deadlift', 'weight');
const latestPerf3 = getLatestPerformance(history3, 'Deadlift', 'weight');

console.log(`Workouts: 1 session with 225 lbs`);
console.log(`Progression data points: ${progression3.length}`);
console.log(`Latest performance: Weight=${latestPerf3?.weight} lbs, Reps=${latestPerf3?.reps}`);
console.log(`Expected: Should have 1 progression point and latest should be 225 lbs / 8 reps`);
console.log(`Result: ${progression3.length === 1 && latestPerf3?.weight === 225 && latestPerf3?.reps === 8 ? '✓ PASS' : '✗ FAIL'}\n`);

// Test 4: Exercise with bodyweight (0 lbs) should still track reps
console.log('Test 4: Bodyweight exercise (reps tracking)');
console.log('--------------------------------------------');
const workout4a = createWorkout(
  new Date('2024-01-01'),
  { 'Pull-ups': createExercise([{ weight: 0, reps: 8 }, { weight: 0, reps: 7 }, { weight: 0, reps: 6 }]) }
);
const workout4b = createWorkout(
  new Date('2024-01-03'),
  { 'Pull-ups': createExercise([{ weight: 0, reps: 10 }, { weight: 0, reps: 9 }, { weight: 0, reps: 8 }]) }
);

const history4 = [workout4a, workout4b];
const progressionWeight4 = getExerciseProgression(history4, 'Pull-ups', 'weight');
const progressionReps4 = getExerciseProgression(history4, 'Pull-ups', 'reps');
const latestPerf4 = getLatestPerformance(history4, 'Pull-ups', 'reps');

console.log(`Workouts: 2 sessions with 0 lbs (bodyweight), reps progressing from 8 to 10`);
console.log(`Weight progression points: ${progressionWeight4.length} (should be 0 since weight is 0)`);
console.log(`Reps progression points: ${progressionReps4.length}`);
console.log(`Latest performance: Weight=${latestPerf4?.weight} lbs, Reps=${latestPerf4?.reps}`);
console.log(`Expected: Weight progression should be empty, reps should have 2 points (8, 10)`);
console.log(`Result: ${progressionWeight4.length === 0 && progressionReps4.length === 2 && latestPerf4?.reps === 10 ? '✓ PASS' : '✗ FAIL'}\n`);

// Test 5: Display logic - should show data when lastWeight/lastReps are present
console.log('Test 5: Display logic with lastWeight and lastReps');
console.log('---------------------------------------------------');
const pinnedWithData = {
  exerciseName: 'Bench Press',
  trackingMode: 'weight',
  lastWeight: 135,
  lastReps: 10,
};

const currentWeight = pinnedWithData.lastWeight !== undefined ? pinnedWithData.lastWeight : 0;
const currentReps = pinnedWithData.lastReps !== undefined ? pinnedWithData.lastReps : 0;
const hasData = currentWeight > 0 || currentReps > 0 || progression1.length > 0;

console.log(`Pinned exercise: Bench Press with lastWeight=135, lastReps=10`);
console.log(`Current weight: ${currentWeight}`);
console.log(`Current reps: ${currentReps}`);
console.log(`Has data: ${hasData}`);
console.log(`Expected: Should have data and display 135 lbs / 10 reps`);
console.log(`Result: ${hasData && currentWeight === 135 && currentReps === 10 ? '✓ PASS' : '✗ FAIL'}\n`);

// Test 6: Display logic - should not show data when everything is 0 or undefined
console.log('Test 6: Display logic without any data');
console.log('---------------------------------------');
const pinnedWithoutData = {
  exerciseName: 'New Exercise',
  trackingMode: 'weight',
};

const currentWeight6 = pinnedWithoutData.lastWeight !== undefined ? pinnedWithoutData.lastWeight : 0;
const currentReps6 = pinnedWithoutData.lastReps !== undefined ? pinnedWithoutData.lastReps : 0;
const emptyProgression = [];
const hasData6 = currentWeight6 > 0 || currentReps6 > 0 || emptyProgression.length > 0;

console.log(`Pinned exercise: New Exercise with no lastWeight/lastReps`);
console.log(`Current weight: ${currentWeight6}`);
console.log(`Current reps: ${currentReps6}`);
console.log(`Has data: ${hasData6}`);
console.log(`Expected: Should not have data (show "No data yet")`);
console.log(`Result: ${!hasData6 ? '✓ PASS' : '✗ FAIL'}\n`);

// Test 7: Trend indicator logic - should only show when progression.length > 1
console.log('Test 7: Trend indicator logic');
console.log('------------------------------');
const progressionSingle = [{ value: 135 }];
const progressionMultiple = [{ value: 135 }, { value: 145 }];

const shouldShowTrendSingle = progressionSingle.length > 1;
const shouldShowTrendMultiple = progressionMultiple.length > 1;

console.log(`Single progression point: Should show trend = ${shouldShowTrendSingle}`);
console.log(`Multiple progression points: Should show trend = ${shouldShowTrendMultiple}`);
console.log(`Expected: Single=false, Multiple=true`);
console.log(`Result: ${!shouldShowTrendSingle && shouldShowTrendMultiple ? '✓ PASS' : '✗ FAIL'}\n`);

console.log('=== All Progressive Overload Display Tests Complete ===');

