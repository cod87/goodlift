/**
 * Tests for Exercise Name Normalizer
 * 
 * Tests that old equipment-first exercise names are properly converted
 * to the new movement-first format using the static mapping.
 */

import {
  normalizeExerciseNameToNewFormat,
  normalizeExerciseObject,
  normalizeExerciseArray,
  normalizeWorkoutExercises,
} from '../src/utils/exerciseNameNormalizer.js';

// Test Cases
console.log('=== Exercise Name Normalizer Tests ===\n');

// Test 1: Old format names should be converted to new format (from static map)
console.log('Test 1: Old format to new format conversion (static mapping)');
const oldToNewCases = [
  { old: 'Barbell Bench Press', expected: 'Bench Press, Barbell' },
  { old: 'Dumbbell Romanian Deadlift', expected: 'Romanian Deadlift, Dumbbell' },
  { old: 'Kettlebell Swing', expected: 'Swing, Kettlebell' },
  { old: 'Landmine Press', expected: 'Press, Landmine' },
  { old: 'Slam Ball Squat', expected: 'Squat, Slam Ball' },
  { old: 'Rope Tricep Extension', expected: 'Tricep Extension, Rope' },
  { old: 'Barbell Front Squat', expected: 'Front Squat, Barbell' },
  { old: 'Dumbbell Incline Bench Press', expected: 'Incline Bench Press, Dumbbell' },
  { old: 'Cable Tricep Extension', expected: 'Tricep Extension, Cable' },
];

let test1Passed = true;
oldToNewCases.forEach(({ old, expected }) => {
  const result = normalizeExerciseNameToNewFormat(old);
  const isCorrect = result === expected;
  if (!isCorrect) test1Passed = false;
  console.log(`  "${old}" → "${result}" ${isCorrect ? '✓' : `✗ Expected: "${expected}"`}`);
});
console.log('');

// Test 2: New format names should remain unchanged
console.log('Test 2: New format names should remain unchanged');
const newFormatCases = [
  'Bench Press, Barbell',
  'Romanian Deadlift, Dumbbell',
  'Pull-Up',
  'Push-Up',
  'Back Squat',
  'Plank',
  'Goblet Squat, Dumbbell',
];

let test2Passed = true;
newFormatCases.forEach(name => {
  const result = normalizeExerciseNameToNewFormat(name);
  const isCorrect = result === name;
  if (!isCorrect) test2Passed = false;
  console.log(`  "${name}" → "${result}" ${isCorrect ? '✓' : '✗ CHANGED!'}`);
});
console.log('');

// Test 3: Names not in mapping should remain unchanged
console.log('Test 3: Exercises not in mapping remain unchanged');
const unmappedCases = [
  'Pull-Up',
  'Push-Up',
  'Plank',
  'Crunch',
  'Bulgarian Split Squat',
  'Walking Lunge',
  'Some Unknown Exercise',
];

let test3Passed = true;
unmappedCases.forEach(name => {
  const result = normalizeExerciseNameToNewFormat(name);
  const isCorrect = result === name;
  if (!isCorrect) test3Passed = false;
  console.log(`  "${name}" → "${result}" ${isCorrect ? '✓' : '✗ CHANGED!'}`);
});
console.log('');

// Test 4: Normalize exercise object
console.log('Test 4: Normalize exercise object');
const oldExerciseObj = {
  'Exercise Name': 'Barbell Deadlift',
  'Primary Muscle': 'Hamstrings',
  'Equipment': 'Barbell',
};
const normalizedObj = normalizeExerciseObject(oldExerciseObj);
const test4Passed = normalizedObj['Exercise Name'] === 'Deadlift, Barbell';
console.log('  Input:', JSON.stringify(oldExerciseObj));
console.log('  Output:', JSON.stringify(normalizedObj));
console.log(`  Result: ${test4Passed ? '✓ PASS' : '✗ FAIL'}`);
console.log('');

// Test 5: Normalize workout exercises
console.log('Test 5: Normalize workout exercises');
const oldWorkout = {
  name: 'Upper Body Workout',
  type: 'upper',
  exercises: [
    { 'Exercise Name': 'Barbell Overhead Press', 'Primary Muscle': 'Shoulders' },
    { 'Exercise Name': 'Dumbbell Lateral Raise', 'Primary Muscle': 'Shoulders' },
    { 'Exercise Name': 'Bench Press, Dumbbell', 'Primary Muscle': 'Chest' }, // Already new
  ],
};
const normalizedWorkout = normalizeWorkoutExercises(oldWorkout);
const test5Passed = 
  normalizedWorkout.exercises[0]['Exercise Name'] === 'Overhead Press, Barbell' &&
  normalizedWorkout.exercises[1]['Exercise Name'] === 'Lateral Raise, Dumbbell' &&
  normalizedWorkout.exercises[2]['Exercise Name'] === 'Bench Press, Dumbbell';
console.log('  Workout name:', normalizedWorkout.name);
console.log('  Exercises:');
normalizedWorkout.exercises.forEach((ex, i) => {
  console.log(`    ${i + 1}. "${ex['Exercise Name']}"`);
});
console.log(`  Result: ${test5Passed ? '✓ PASS' : '✗ FAIL'}`);
console.log('');

// Test 6: Edge cases
console.log('Test 6: Edge cases');
const edgeCases = [
  { input: null, expected: null },
  { input: undefined, expected: undefined },
  { input: '', expected: '' },
];

let test6Passed = true;
edgeCases.forEach(({ input, expected }) => {
  const result = normalizeExerciseNameToNewFormat(input);
  const isCorrect = result === expected;
  if (!isCorrect) test6Passed = false;
  console.log(`  ${JSON.stringify(input)} → ${JSON.stringify(result)} ${isCorrect ? '✓' : '✗'}`);
});
console.log('');

// Summary
console.log('=== All Normalizer Tests Complete ===\n');

const allPassed = test1Passed && test2Passed && test3Passed && test4Passed && test5Passed && test6Passed;

console.log('Test Results:');
console.log(`  1. Old to new format conversion: ${test1Passed ? '✓ PASS' : '✗ FAIL'}`);
console.log(`  2. New format unchanged: ${test2Passed ? '✓ PASS' : '✗ FAIL'}`);
console.log(`  3. Unmapped names unchanged: ${test3Passed ? '✓ PASS' : '✗ FAIL'}`);
console.log(`  4. Normalize exercise object: ${test4Passed ? '✓ PASS' : '✗ FAIL'}`);
console.log(`  5. Normalize workout exercises: ${test5Passed ? '✓ PASS' : '✗ FAIL'}`);
console.log(`  6. Edge cases: ${test6Passed ? '✓ PASS' : '✗ FAIL'}`);
console.log('');
console.log(`Overall: ${allPassed ? '✓ ALL TESTS PASSED' : '✗ SOME TESTS FAILED'}`);

// Exit with appropriate code
if (!allPassed) {
  process.exit(1);
}
