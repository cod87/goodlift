/**
 * Tests for Bodyweight Exercise Progressive Overload
 * 
 * Tests that bodyweight exercises use target reps progression instead of weight progression.
 * When a user hits their target reps in all sets:
 * - Weighted exercises: weight increases by predetermined amount (5-10 lbs)
 * - Bodyweight exercises: target reps increase by 1
 */

console.log('=== Bodyweight Progressive Overload Tests ===\n');

// Import helper functions
import { isBodyweightExercise, shouldReduceTargetReps } from '../src/utils/progressiveOverload.js';

// Test 1: Detect bodyweight exercises correctly
console.log('Test 1: Correctly identify bodyweight exercises');
console.log('-----------------------------------------------');
const testCases = [
  { equipment: 'Bodyweight', expected: true, label: 'Bodyweight (exact match)' },
  { equipment: 'bodyweight', expected: true, label: 'bodyweight (lowercase)' },
  { equipment: 'Body Weight', expected: true, label: 'Body Weight (two words)' },
  { equipment: 'body weight', expected: true, label: 'body weight (two words lowercase)' },
  { equipment: 'Barbell', expected: false, label: 'Barbell' },
  { equipment: 'Dumbbell', expected: false, label: 'Dumbbell' },
  { equipment: 'Cable', expected: false, label: 'Cable' },
  { equipment: null, expected: false, label: 'null equipment' },
  { equipment: undefined, expected: false, label: 'undefined equipment' },
];

let allPassed = true;
testCases.forEach(({ equipment, expected, label }) => {
  const result = isBodyweightExercise(equipment);
  const passed = result === expected;
  allPassed = allPassed && passed;
  console.log(`  ${label}: ${passed ? '✓ PASS' : '✗ FAIL'} (expected: ${expected}, got: ${result})`);
});
console.log(`Result: ${allPassed ? '✓ ALL PASS' : '✗ SOME FAILED'}\n`);

// Test 2: Target reps reduction logic for bodyweight exercises
console.log('Test 2: Target reps should reduce when underperforming');
console.log('------------------------------------------------------');

// Scenario 1: User completes 20% or more fewer reps than target (should reduce)
const sets1 = [
  { reps: 6 },
  { reps: 5 },
  { reps: 4 }
];
const targetReps1 = 10;
const shouldReduce1 = shouldReduceTargetReps(sets1, targetReps1, 3);
// Total: 15 reps completed vs 30 target = 50% completion (should reduce)
console.log(`Scenario 1: 15/30 reps completed (50% - should reduce)`);
console.log(`  Result: ${shouldReduce1 ? '✓ PASS (will reduce)' : '✗ FAIL (should reduce)'}\n`);

// Scenario 2: User completes just above 80% threshold (should NOT reduce)
const sets2 = [
  { reps: 9 },
  { reps: 8 },
  { reps: 8 }
];
const targetReps2 = 10;
const shouldReduce2 = shouldReduceTargetReps(sets2, targetReps2, 3);
// Total: 25 reps completed vs 30 target = 83.3% completion (should not reduce)
console.log(`Scenario 2: 25/30 reps completed (83.3% - should not reduce)`);
console.log(`  Result: ${!shouldReduce2 ? '✓ PASS (will not reduce)' : '✗ FAIL (should not reduce)'}\n`);

// Scenario 3: User completes exactly 80% threshold (should reduce)
const sets3 = [
  { reps: 8 },
  { reps: 8 },
  { reps: 8 }
];
const targetReps3 = 10;
const shouldReduce3 = shouldReduceTargetReps(sets3, targetReps3, 3);
// Total: 24 reps completed vs 30 target = 80% completion (should reduce at threshold)
console.log(`Scenario 3: 24/30 reps completed (80% - should reduce)`);
console.log(`  Result: ${shouldReduce3 ? '✓ PASS (will reduce)' : '✗ FAIL (should reduce)'}\n`);

// Test 3: Progressive overload simulation for bodyweight exercise
console.log('Test 3: Simulated bodyweight progressive overload workflow');
console.log('----------------------------------------------------------');

// Simulate a user's progression with pull-ups
let currentTargetReps = 8;
const sessionResults = [
  // Week 1: Hit target in all sets
  { sets: [{ reps: 8 }, { reps: 8 }, { reps: 8 }], week: 1 },
  // Week 2: Hit new target in all sets
  { sets: [{ reps: 9 }, { reps: 9 }, { reps: 9 }], week: 2 },
  // Week 3: Failed to hit target consistently
  { sets: [{ reps: 10 }, { reps: 8 }, { reps: 7 }], week: 3 },
  // Week 4: Hit target again
  { sets: [{ reps: 9 }, { reps: 9 }, { reps: 9 }], week: 4 },
];

console.log('Exercise: Pull-ups (Bodyweight)');
console.log('Starting target reps: 8\n');

sessionResults.forEach(({ sets, week }) => {
  const allSetsMetTarget = sets.every(set => set.reps >= currentTargetReps);
  const shouldReduce = shouldReduceTargetReps(sets, currentTargetReps, 3);
  
  console.log(`Week ${week}:`);
  console.log(`  Current target: ${currentTargetReps} reps`);
  console.log(`  Sets completed: ${sets.map(s => s.reps).join(', ')}`);
  
  if (allSetsMetTarget) {
    currentTargetReps += 1;
    console.log(`  ✓ Hit target in all sets! New target: ${currentTargetReps} reps`);
  } else if (shouldReduce) {
    currentTargetReps = Math.max(1, currentTargetReps - 1);
    console.log(`  ⚠ Underperformed. Reduced target to: ${currentTargetReps} reps`);
  } else {
    console.log(`  → Maintaining target: ${currentTargetReps} reps`);
  }
  console.log('');
});

console.log(`Final target reps: ${currentTargetReps}`);
console.log(`Expected progression: 8 → 9 → 9 (reduced) → 10`);
console.log(`Result: ${currentTargetReps === 10 ? '✓ PASS' : '✗ FAIL'}\n`);

// Test 4: Verify that weighted exercises don't use this logic
console.log('Test 4: Weighted exercises should not use target reps logic');
console.log('-----------------------------------------------------------');
console.log('Weighted exercises (Barbell, Dumbbell, etc.) should use weight progression:');
console.log('  - isBodyweightExercise("Barbell"): ' + isBodyweightExercise('Barbell'));
console.log('  - isBodyweightExercise("Dumbbell"): ' + isBodyweightExercise('Dumbbell'));
console.log('  - isBodyweightExercise("Cable"): ' + isBodyweightExercise('Cable'));
console.log('\nAll should be false - they use weight progression instead.');
const weightedNotBodyweight = !isBodyweightExercise('Barbell') && 
                               !isBodyweightExercise('Dumbbell') && 
                               !isBodyweightExercise('Cable');
console.log(`Result: ${weightedNotBodyweight ? '✓ PASS' : '✗ FAIL'}\n`);

console.log('=== All Bodyweight Progressive Overload Tests Complete ===');
