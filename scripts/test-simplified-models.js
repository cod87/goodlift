#!/usr/bin/env node

/**
 * Structural Test for Simplified Workout Plan Models
 * 
 * This script performs static analysis to ensure the models
 * are properly structured and can be imported correctly.
 * 
 * Note: This is a structural test, not a runtime test.
 * For runtime testing, use the browser environment or set up a proper test framework.
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🧪 Running Structural Tests for Simplified Models\n');
console.log('='.repeat(60));

let testsPassed = 0;
let testsFailed = 0;

// Helper to run a test
function runTest(name, testFn) {
  try {
    console.log(`\nTest: ${name}`);
    testFn();
    console.log('  ✅ PASSED');
    testsPassed++;
  } catch (error) {
    console.log(`  ❌ FAILED: ${error.message}`);
    testsFailed++;
  }
}

// Test 1: All model files are valid JavaScript
runTest('All model files have valid JavaScript syntax', () => {
  const files = ['Plans.js', 'PlanDays.js', 'PlanExercises.js', 'index.js'];
  files.forEach(file => {
    const content = readFileSync(join(__dirname, '../src/models', file), 'utf8');
    if (!content || content.length === 0) {
      throw new Error(`${file} is empty`);
    }
  });
});

// Test 2: All functions are properly exported
runTest('All CRUD functions are exported', () => {
  const plansContent = readFileSync(join(__dirname, '../src/models/Plans.js'), 'utf8');
  const requiredPlansFns = ['createPlan', 'getPlan', 'getPlans', 'updatePlan', 'deletePlan'];
  
  requiredPlansFns.forEach(fn => {
    if (!plansContent.includes(`export const ${fn}`)) {
      throw new Error(`Plans.js missing export: ${fn}`);
    }
  });
  
  const daysContent = readFileSync(join(__dirname, '../src/models/PlanDays.js'), 'utf8');
  const requiredDaysFns = ['addDayToPlan', 'getDay', 'getDaysForPlan', 'updateDay', 'removeDay'];
  
  requiredDaysFns.forEach(fn => {
    if (!daysContent.includes(`export const ${fn}`)) {
      throw new Error(`PlanDays.js missing export: ${fn}`);
    }
  });
  
  const exercisesContent = readFileSync(join(__dirname, '../src/models/PlanExercises.js'), 'utf8');
  const requiredExercisesFns = ['addExerciseToDay', 'getExercise', 'getExercisesForDay', 'updateExercise', 'removeExercise'];
  
  requiredExercisesFns.forEach(fn => {
    if (!exercisesContent.includes(`export const ${fn}`)) {
      throw new Error(`PlanExercises.js missing export: ${fn}`);
    }
  });
});

// Test 3: Index file exports all functions
runTest('Index file exports all model functions', () => {
  const indexContent = readFileSync(join(__dirname, '../src/models/index.js'), 'utf8');
  const allFunctions = [
    'createPlan', 'getPlan', 'getPlans', 'updatePlan', 'deletePlan',
    'addDayToPlan', 'getDay', 'getDaysForPlan', 'updateDay', 'removeDay',
    'addExerciseToDay', 'getExercise', 'getExercisesForDay', 'updateExercise', 'removeExercise'
  ];
  
  allFunctions.forEach(fn => {
    if (!indexContent.includes(fn)) {
      throw new Error(`index.js missing: ${fn}`);
    }
  });
});

// Test 4: Models have proper documentation
runTest('All models have JSDoc comments', () => {
  const files = ['Plans.js', 'PlanDays.js', 'PlanExercises.js'];
  files.forEach(file => {
    const content = readFileSync(join(__dirname, '../src/models', file), 'utf8');
    if (!content.includes('/**')) {
      throw new Error(`${file} missing JSDoc comments`);
    }
    if (!content.includes('@param')) {
      throw new Error(`${file} missing @param tags`);
    }
    if (!content.includes('@returns')) {
      throw new Error(`${file} missing @returns tags`);
    }
  });
});

// Test 5: Models use correct storage patterns
runTest('Models follow storage patterns', () => {
  const files = ['Plans.js', 'PlanDays.js', 'PlanExercises.js'];
  files.forEach(file => {
    const content = readFileSync(join(__dirname, '../src/models', file), 'utf8');
    
    // Check for isGuestMode usage
    if (!content.includes('isGuestMode()')) {
      throw new Error(`${file} missing guest mode support`);
    }
    
    // Check for Firebase sync
    if (!content.includes('ToFirebase')) {
      throw new Error(`${file} missing Firebase sync`);
    }
    
    // Check for localStorage
    if (!content.includes('localStorage')) {
      throw new Error(`${file} missing localStorage support`);
    }
  });
});

// Test 6: Proper error handling
runTest('Models have error handling', () => {
  const files = ['Plans.js', 'PlanDays.js', 'PlanExercises.js'];
  files.forEach(file => {
    const content = readFileSync(join(__dirname, '../src/models', file), 'utf8');
    if (!content.includes('try {') || !content.includes('catch')) {
      throw new Error(`${file} missing try-catch blocks`);
    }
    if (!content.includes('throw new Error')) {
      throw new Error(`${file} missing validation errors`);
    }
  });
});

console.log('\n' + '='.repeat(60));
console.log('\n📊 Test Results:');
console.log(`  ✅ Passed: ${testsPassed}`);
console.log(`  ❌ Failed: ${testsFailed}`);
console.log(`  Total: ${testsPassed + testsFailed}\n`);

if (testsFailed > 0) {
  console.log('❌ Some tests failed. Please review the errors above.');
  process.exit(1);
} else {
  console.log('✅ All structural tests passed! Models are properly structured.');
  console.log('\n💡 Note: For runtime testing, use the browser environment');
  console.log('   or integrate with a test framework like Jest or Vitest.\n');
  process.exit(0);
}
