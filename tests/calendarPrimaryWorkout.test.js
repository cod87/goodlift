/**
 * Tests for Calendar Primary Workout Selection Logic
 * 
 * Tests the logic for selecting which workout to display when there are 
 * multiple sessions logged on the same day:
 * 
 * 1. Prefer strength training sessions over any other session type
 * 2. If there are two non-strength sessions, prefer the longer session
 * 3. If there's only one session, display that session
 */

// Helper function to create a workout session with optional duration
const createSession = (type, duration = 0) => ({
  date: new Date().toISOString(),
  type,
  duration,
});

// Replicate the logic from MonthCalendarView for testing
const isStrengthType = (type) => {
  if (!type) return false;
  const normalizedType = type.toLowerCase();
  const strengthTypes = ['upper', 'lower', 'full', 'push', 'pull', 'legs', 'strength', 'hypertrophy'];
  return strengthTypes.includes(normalizedType);
};

const getPrimaryWorkoutType = (workouts) => {
  if (!workouts || workouts.length === 0) return null;
  
  if (workouts.length === 1) {
    const workout = workouts[0];
    return workout.type?.toLowerCase() || workout.workoutType?.toLowerCase() || 'strength';
  }

  // Multiple workouts on the same day
  // First, look for strength training sessions
  const strengthWorkout = workouts.find(w => {
    const type = w.type?.toLowerCase() || w.workoutType?.toLowerCase();
    return isStrengthType(type);
  });

  if (strengthWorkout) {
    return strengthWorkout.type?.toLowerCase() || strengthWorkout.workoutType?.toLowerCase() || 'strength';
  }

  // No strength workout found - prefer the longer session
  const longestWorkout = workouts.reduce((longest, current) => {
    const currentDuration = current.duration || 0;
    const longestDuration = longest.duration || 0;
    return currentDuration > longestDuration ? current : longest;
  }, workouts[0]);

  return longestWorkout.type?.toLowerCase() || longestWorkout.workoutType?.toLowerCase() || 'strength';
};

console.log('=== Calendar Primary Workout Selection Tests ===\n');

// Test 1: Single workout returns that workout's type
console.log('Test 1: Single workout returns that workout\'s type');
{
  const workouts = [createSession('cardio', 30)];
  const result = getPrimaryWorkoutType(workouts);
  const passed = result === 'cardio';
  console.log(`  Input: [cardio (30min)]`);
  console.log(`  Expected: 'cardio', Got: '${result}' ${passed ? '✓' : '✗ FAIL'}`);
}
console.log('');

// Test 2: Strength workout is preferred over non-strength workout
console.log('Test 2: Strength workout is preferred over non-strength workout');
{
  const workouts = [
    createSession('cardio', 60),
    createSession('upper', 45),
  ];
  const result = getPrimaryWorkoutType(workouts);
  const passed = result === 'upper';
  console.log(`  Input: [cardio (60min), upper (45min)]`);
  console.log(`  Expected: 'upper', Got: '${result}' ${passed ? '✓' : '✗ FAIL'}`);
}
console.log('');

// Test 3: All strength types should be recognized
console.log('Test 3: All strength types should be recognized');
{
  const strengthTypes = ['upper', 'lower', 'full', 'push', 'pull', 'legs', 'strength', 'hypertrophy'];
  let allPassed = true;
  
  for (const strengthType of strengthTypes) {
    const workouts = [
      createSession('yoga', 60),
      createSession(strengthType, 30),
    ];
    const result = getPrimaryWorkoutType(workouts);
    const passed = result === strengthType;
    if (!passed) {
      allPassed = false;
      console.log(`  FAIL: ${strengthType} not recognized as strength`);
    }
  }
  
  console.log(`  Testing all strength types: ${strengthTypes.join(', ')}`);
  console.log(`  All recognized correctly: ${allPassed ? '✓' : '✗ FAIL'}`);
}
console.log('');

// Test 4: Two non-strength sessions - longer session is preferred
console.log('Test 4: Two non-strength sessions - longer session is preferred');
{
  const workouts = [
    createSession('cardio', 30),
    createSession('yoga', 60),
  ];
  const result = getPrimaryWorkoutType(workouts);
  const passed = result === 'yoga';
  console.log(`  Input: [cardio (30min), yoga (60min)]`);
  console.log(`  Expected: 'yoga', Got: '${result}' ${passed ? '✓' : '✗ FAIL'}`);
}
console.log('');

// Test 5: Two non-strength sessions with equal duration - first one is used
console.log('Test 5: Two non-strength sessions with equal duration - first one is used');
{
  const workouts = [
    createSession('cardio', 30),
    createSession('yoga', 30),
  ];
  const result = getPrimaryWorkoutType(workouts);
  const passed = result === 'cardio';
  console.log(`  Input: [cardio (30min), yoga (30min)]`);
  console.log(`  Expected: 'cardio', Got: '${result}' ${passed ? '✓' : '✗ FAIL'}`);
}
console.log('');

// Test 6: Multiple workouts with no duration - first non-strength is used
console.log('Test 6: Multiple non-strength workouts with no duration - first one is used');
{
  const workouts = [
    createSession('hiit'),
    createSession('yoga'),
  ];
  const result = getPrimaryWorkoutType(workouts);
  const passed = result === 'hiit';
  console.log(`  Input: [hiit (no duration), yoga (no duration)]`);
  console.log(`  Expected: 'hiit', Got: '${result}' ${passed ? '✓' : '✗ FAIL'}`);
}
console.log('');

// Test 7: Strength workout is preferred even if it's shorter
console.log('Test 7: Strength workout is preferred even if it\'s shorter');
{
  const workouts = [
    createSession('cardio', 120),
    createSession('legs', 30),
  ];
  const result = getPrimaryWorkoutType(workouts);
  const passed = result === 'legs';
  console.log(`  Input: [cardio (120min), legs (30min)]`);
  console.log(`  Expected: 'legs', Got: '${result}' ${passed ? '✓' : '✗ FAIL'}`);
}
console.log('');

// Test 8: Empty array returns null
console.log('Test 8: Empty array returns null');
{
  const result = getPrimaryWorkoutType([]);
  const passed = result === null;
  console.log(`  Input: []`);
  console.log(`  Expected: null, Got: ${result} ${passed ? '✓' : '✗ FAIL'}`);
}
console.log('');

// Test 9: Null/undefined input returns null
console.log('Test 9: Null/undefined input returns null');
{
  const result1 = getPrimaryWorkoutType(null);
  const result2 = getPrimaryWorkoutType(undefined);
  const passed = result1 === null && result2 === null;
  console.log(`  Input: null, undefined`);
  console.log(`  Expected: null, Got: ${result1}, ${result2} ${passed ? '✓' : '✗ FAIL'}`);
}
console.log('');

// Test 10: Workouts using workoutType instead of type property
console.log('Test 10: Workouts using workoutType instead of type property');
{
  const workouts = [
    { date: new Date().toISOString(), workoutType: 'cardio', duration: 30 },
    { date: new Date().toISOString(), workoutType: 'push', duration: 45 },
  ];
  const result = getPrimaryWorkoutType(workouts);
  const passed = result === 'push';
  console.log(`  Input: [{workoutType: 'cardio'}, {workoutType: 'push'}]`);
  console.log(`  Expected: 'push', Got: '${result}' ${passed ? '✓' : '✗ FAIL'}`);
}
console.log('');

console.log('=== Tests Complete ===');
