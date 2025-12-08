/**
 * Tests for Muscle Volume Tracker - Multiple Primary Muscles
 * 
 * Tests that exercises with multiple primary muscles (e.g., "Lats, Biceps")
 * correctly distribute set counts to all applicable muscle categories.
 * This ensures retroactive changes to exercise muscle associations are reflected.
 */

import { 
  categorizePrimaryMuscles
} from '../src/utils/muscleCategories.js';

console.log('=== Muscle Volume Tracker - Multiple Primary Muscles Tests ===\n');

// Test 1: Parse single primary muscle
console.log('Test 1: Single primary muscle');
{
  const result = categorizePrimaryMuscles('Lats');
  const expected = ['Back'];
  const passed = JSON.stringify(result) === JSON.stringify(expected);
  console.log(`  Input: "Lats"`);
  console.log(`  Expected: ${JSON.stringify(expected)}`);
  console.log(`  Result: ${JSON.stringify(result)}`);
  console.log(`  ${passed ? '✓ PASS' : '✗ FAIL'}`);
}
console.log('');

// Test 2: Parse multiple primary muscles (Cable Pull-Up case)
console.log('Test 2: Multiple primary muscles - "Lats, Biceps"');
{
  const result = categorizePrimaryMuscles('Lats, Biceps');
  const expected = ['Back', 'Biceps'];
  const passed = JSON.stringify(result.sort()) === JSON.stringify(expected.sort());
  console.log(`  Input: "Lats, Biceps"`);
  console.log(`  Expected: ${JSON.stringify(expected)}`);
  console.log(`  Result: ${JSON.stringify(result)}`);
  console.log(`  ${passed ? '✓ PASS' : '✗ FAIL'}`);
}
console.log('');

// Test 3: Handle empty string
console.log('Test 3: Empty string input');
{
  const result = categorizePrimaryMuscles('');
  const expected = [];
  const passed = JSON.stringify(result) === JSON.stringify(expected);
  console.log(`  Input: ""`);
  console.log(`  Expected: ${JSON.stringify(expected)}`);
  console.log(`  Result: ${JSON.stringify(result)}`);
  console.log(`  ${passed ? '✓ PASS' : '✗ FAIL'}`);
}
console.log('');

// Test 4: Handle null/undefined
console.log('Test 4: Null/undefined input');
{
  const result1 = categorizePrimaryMuscles(null);
  const result2 = categorizePrimaryMuscles(undefined);
  const expected = [];
  const passed = JSON.stringify(result1) === JSON.stringify(expected) && 
                 JSON.stringify(result2) === JSON.stringify(expected);
  console.log(`  Input: null, undefined`);
  console.log(`  Expected: ${JSON.stringify(expected)}`);
  console.log(`  Result (null): ${JSON.stringify(result1)}`);
  console.log(`  Result (undefined): ${JSON.stringify(result2)}`);
  console.log(`  ${passed ? '✓ PASS' : '✗ FAIL'}`);
}
console.log('');

// Test 5: Handle extra whitespace
console.log('Test 5: Multiple muscles with extra whitespace');
{
  const result = categorizePrimaryMuscles('  Lats  ,  Biceps  ');
  const expected = ['Back', 'Biceps'];
  const passed = JSON.stringify(result.sort()) === JSON.stringify(expected.sort());
  console.log(`  Input: "  Lats  ,  Biceps  "`);
  console.log(`  Expected: ${JSON.stringify(expected)}`);
  console.log(`  Result: ${JSON.stringify(result)}`);
  console.log(`  ${passed ? '✓ PASS' : '✗ FAIL'}`);
}
console.log('');

// Test 6: Three primary muscles
console.log('Test 6: Three primary muscles - "Chest, Front Delts, Triceps"');
{
  const result = categorizePrimaryMuscles('Chest, Front Delts, Triceps');
  const expected = ['Chest', 'Shoulders', 'Triceps'];
  const passed = JSON.stringify(result.sort()) === JSON.stringify(expected.sort());
  console.log(`  Input: "Chest, Front Delts, Triceps"`);
  console.log(`  Expected: ${JSON.stringify(expected)}`);
  console.log(`  Result: ${JSON.stringify(result)}`);
  console.log(`  ${passed ? '✓ PASS' : '✗ FAIL'}`);
}
console.log('');

// Test 7: Duplicate categories should only appear once
console.log('Test 7: Duplicate categories - "Lats, Back" (both map to Back)');
{
  const result = categorizePrimaryMuscles('Lats, Back');
  const expected = ['Back'];
  const passed = JSON.stringify(result) === JSON.stringify(expected) && result.length === 1;
  console.log(`  Input: "Lats, Back"`);
  console.log(`  Expected: ${JSON.stringify(expected)} (only one "Back")`);
  console.log(`  Result: ${JSON.stringify(result)}`);
  console.log(`  ${passed ? '✓ PASS' : '✗ FAIL'}`);
}
console.log('');

// Test 8: Simulate volume calculation for Cable Pull-Up
console.log('Test 8: Simulate volume calculation for Cable Pull-Up exercise');
{
  // Simulated exercise data
  const exerciseMetadata = {
    'Exercise Name': 'Pull-Up, Cable',
    'Primary Muscle': 'Lats, Biceps',
    'Secondary Muscles': 'Rear Delts, Core'
  };
  
  const setCount = 3; // 3 sets performed
  
  const primaryCategories = categorizePrimaryMuscles(exerciseMetadata['Primary Muscle']);
  
  // Both Back and Biceps should get 3 sets added
  const volumeData = {
    'Back': { primary: 0, secondary: 0 },
    'Biceps': { primary: 0, secondary: 0 },
    'Shoulders': { primary: 0, secondary: 0 },
    'Core': { primary: 0, secondary: 0 }
  };
  
  primaryCategories.forEach(category => {
    if (volumeData[category]) {
      volumeData[category].primary += setCount;
    }
  });
  
  const backSets = volumeData['Back'].primary;
  const bicepsSets = volumeData['Biceps'].primary;
  const passed = backSets === 3 && bicepsSets === 3;
  
  console.log(`  Exercise: Cable Pull-Up with 3 sets`);
  console.log(`  Primary Muscle: "Lats, Biceps"`);
  console.log(`  Expected: Back gets 3 primary sets, Biceps gets 3 primary sets`);
  console.log(`  Result: Back = ${backSets}, Biceps = ${bicepsSets}`);
  console.log(`  ${passed ? '✓ PASS' : '✗ FAIL'}`);
}
console.log('');

// Test 9: Unknown muscles should be filtered out
console.log('Test 9: Unknown muscle names should be filtered out');
{
  const result = categorizePrimaryMuscles('Lats, UnknownMuscle, Biceps');
  const expected = ['Back', 'Biceps'];
  const passed = JSON.stringify(result.sort()) === JSON.stringify(expected.sort());
  console.log(`  Input: "Lats, UnknownMuscle, Biceps"`);
  console.log(`  Expected: ${JSON.stringify(expected)} (UnknownMuscle filtered out)`);
  console.log(`  Result: ${JSON.stringify(result)}`);
  console.log(`  ${passed ? '✓ PASS' : '✗ FAIL'}`);
}
console.log('');

console.log('=== All Tests Complete ===');
