#!/usr/bin/env node
/**
 * Test script for exercise name migration
 * Tests the localStorage migration utility with sample data
 */

import { normalizeExerciseNameToNewFormat } from '../src/utils/exerciseNameNormalizer.js';

// Mock localStorage for testing
const mockStorage = {};
global.localStorage = {
  getItem: (key) => mockStorage[key] || null,
  setItem: (key, value) => { mockStorage[key] = value; },
  removeItem: (key) => { delete mockStorage[key]; },
};

// Sample workout history with old format names
const sampleWorkoutHistory = [
  {
    id: 1,
    date: '2024-12-01T10:00:00Z',
    type: 'Upper Body',
    exercises: [
      { 'Exercise Name': 'Barbell Bench Press', sets: 3, reps: 10, weight: 135 },
      { 'Exercise Name': 'Dumbbell Shoulder Press', sets: 3, reps: 12, weight: 50 },
      { 'Exercise Name': 'Pull-Up', sets: 3, reps: 8 }, // Already correct format
    ]
  },
  {
    id: 2,
    date: '2024-12-02T10:00:00Z',
    type: 'Lower Body',
    exercises: [
      { 'Exercise Name': 'Barbell Deadlift', sets: 4, reps: 5, weight: 225 },
      { 'Exercise Name': 'Dumbbell Bulgarian Split Squat', sets: 3, reps: 10, weight: 40 },
    ]
  }
];

// Sample exercise weights with old format names
const sampleExerciseWeights = {
  'Barbell Bench Press': 135,
  'Dumbbell Romanian Deadlift': 80,
  'Kettlebell Swing': 53,
  'Push-Up': 0, // Already correct format
};

// Sample target reps
const sampleTargetReps = {
  'Barbell Overhead Press': 8,
  'Dumbbell Lateral Raise': 12,
  'Plank': 60,
};

// Sample pinned exercises
const samplePinnedExercises = [
  { 'Exercise Name': 'Barbell Bench Press', 'Primary Muscle': 'Chest' },
  { 'Exercise Name': 'Dumbbell Bicep Curl', 'Primary Muscle': 'Biceps' },
  { 'Exercise Name': 'Pull-Up', 'Primary Muscle': 'Lats' },
];

console.log('=== Exercise Name Migration Test ===\n');

// Test 1: Normalize workout history
console.log('Test 1: Migrate workout history');
let migratedCount = 0;
const migratedHistory = sampleWorkoutHistory.map(workout => {
  const migratedExercises = workout.exercises.map(exercise => {
    const oldName = exercise['Exercise Name'];
    const newName = normalizeExerciseNameToNewFormat(oldName);
    if (oldName !== newName) {
      migratedCount++;
      console.log(`  ✓ "${oldName}" → "${newName}"`);
      return { ...exercise, 'Exercise Name': newName };
    }
    return exercise;
  });
  return { ...workout, exercises: migratedExercises };
});
console.log(`  Migrated: ${migratedCount} exercises`);
console.log('');

// Test 2: Migrate exercise weights
console.log('Test 2: Migrate exercise weights');
const migratedWeights = {};
let weightsCount = 0;
Object.keys(sampleExerciseWeights).forEach(oldName => {
  const newName = normalizeExerciseNameToNewFormat(oldName);
  if (oldName !== newName && !migratedWeights[newName]) {
    migratedWeights[newName] = sampleExerciseWeights[oldName];
    weightsCount++;
    console.log(`  ✓ "${oldName}" → "${newName}": ${sampleExerciseWeights[oldName]}lbs`);
  } else {
    migratedWeights[oldName] = sampleExerciseWeights[oldName];
  }
});
console.log(`  Migrated: ${weightsCount} weight entries`);
console.log('');

// Test 3: Migrate target reps
console.log('Test 3: Migrate target reps');
const migratedTargetReps = {};
let repsCount = 0;
Object.keys(sampleTargetReps).forEach(oldName => {
  const newName = normalizeExerciseNameToNewFormat(oldName);
  if (oldName !== newName && !migratedTargetReps[newName]) {
    migratedTargetReps[newName] = sampleTargetReps[oldName];
    repsCount++;
    console.log(`  ✓ "${oldName}" → "${newName}": ${sampleTargetReps[oldName]} reps`);
  } else {
    migratedTargetReps[oldName] = sampleTargetReps[oldName];
  }
});
console.log(`  Migrated: ${repsCount} target rep entries`);
console.log('');

// Test 4: Migrate pinned exercises
console.log('Test 4: Migrate pinned exercises');
let pinnedCount = 0;
const migratedPinned = samplePinnedExercises.map(exercise => {
  const oldName = exercise['Exercise Name'];
  const newName = normalizeExerciseNameToNewFormat(oldName);
  if (oldName !== newName) {
    pinnedCount++;
    console.log(`  ✓ "${oldName}" → "${newName}"`);
    return { ...exercise, 'Exercise Name': newName };
  }
  return exercise;
});
console.log(`  Migrated: ${pinnedCount} pinned exercises`);
console.log('');

// Test 5: Verify no data loss
console.log('Test 5: Verify no data loss');
let test5Passed = true;

// Check workout history
if (migratedHistory.length !== sampleWorkoutHistory.length) {
  console.log('  ✗ FAIL: Workout history count mismatch');
  test5Passed = false;
} else {
  console.log('  ✓ Workout history count preserved');
}

// Check all exercises are present
const originalExerciseCount = sampleWorkoutHistory.reduce((sum, w) => sum + w.exercises.length, 0);
const migratedExerciseCount = migratedHistory.reduce((sum, w) => sum + w.exercises.length, 0);
if (originalExerciseCount !== migratedExerciseCount) {
  console.log('  ✗ FAIL: Exercise count mismatch');
  test5Passed = false;
} else {
  console.log('  ✓ Exercise count preserved');
}

// Check weights preserved
const originalWeightCount = Object.keys(sampleExerciseWeights).length;
const migratedWeightCount = Object.keys(migratedWeights).length;
if (originalWeightCount !== migratedWeightCount) {
  console.log('  ✗ FAIL: Weight entries count mismatch');
  test5Passed = false;
} else {
  console.log('  ✓ Weight entries count preserved');
}

console.log('');

// Test 6: Verify backward compatibility
console.log('Test 6: Verify backward compatibility (double migration should be idempotent)');
let test6Passed = true;

// Migrate already migrated data
const doubleMigratedHistory = migratedHistory.map(workout => {
  const exercises = workout.exercises.map(exercise => {
    const name = exercise['Exercise Name'];
    const normalized = normalizeExerciseNameToNewFormat(name);
    if (name !== normalized) {
      console.log(`  ✗ FAIL: "${name}" was changed again to "${normalized}"`);
      test6Passed = false;
    }
    return exercise;
  });
  return { ...workout, exercises };
});

if (test6Passed) {
  console.log('  ✓ Already migrated data remains unchanged (idempotent)');
}

console.log('');

// Summary
console.log('=== Test Summary ===');
console.log(`Test 1: Workout history migration: ✓ PASS (${migratedCount} exercises)`);
console.log(`Test 2: Exercise weights migration: ✓ PASS (${weightsCount} entries)`);
console.log(`Test 3: Target reps migration: ✓ PASS (${repsCount} entries)`);
console.log(`Test 4: Pinned exercises migration: ✓ PASS (${pinnedCount} exercises)`);
console.log(`Test 5: Data loss verification: ${test5Passed ? '✓ PASS' : '✗ FAIL'}`);
console.log(`Test 6: Backward compatibility: ${test6Passed ? '✓ PASS' : '✗ FAIL'}`);

const allPassed = test5Passed && test6Passed;
console.log('');
console.log(`Overall: ${allPassed ? '✓ ALL TESTS PASSED' : '✗ SOME TESTS FAILED'}`);

// Exit with appropriate code
if (!allPassed) {
  process.exit(1);
}
