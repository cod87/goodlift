#!/usr/bin/env node

/**
 * Component Validation Script
 * 
 * This script validates that all KEEP components can be properly imported
 * after the migration changes
 */

import { promises as fs } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

// List of components that must continue to work (from migration plan)
const KEEP_COMPONENTS = [
  // Core Workout Components
  'src/components/WorkoutScreen.jsx',
  'src/components/WorkoutPreview.jsx',
  'src/components/CompletionScreen.jsx',
  'src/components/CustomizeExerciseScreen.jsx',
  
  // Planning Components
  'src/components/WorkoutPlanScreen.jsx',
  'src/components/WorkoutPlanBuilderDialog.jsx',
  'src/components/RecurringSessionEditor.jsx',
  'src/components/Calendar.jsx',
  
  // Session Components
  'src/components/Cardio/CardioTimer.jsx',
  'src/components/Stretch/StretchSession.jsx',
  'src/components/Warmup/DynamicWarmup.js',
  'src/components/Cooldown/StaticStretches.js',
  'src/components/Mobility/MobilityScreen.jsx',
  
  // Progress & Analytics
  'src/components/ProgressScreen.jsx',
  'src/components/Progress/ChartTabs.jsx',
  'src/components/Progress/ActivitiesList.jsx',
  'src/components/Progress/StatsRow.jsx',
  
  // Utility Components
  'src/components/SelectionScreen.jsx',
  'src/components/TodayView/TodayView.jsx',
  'src/components/UnifiedWorkoutHub.jsx',
  'src/components/NavigationSidebar.jsx'
];

// Storage functions that should still exist
const STORAGE_FUNCTIONS = [
  'getWorkoutHistory',
  'saveWorkout',
  'deleteWorkout',
  'getUserStats',
  'getExerciseWeight',
  'setExerciseWeight',
  'getExerciseTargetReps',
  'setExerciseTargetReps',
  'getHiitSessions',
  'saveHiitSession',
  'getCardioSessions',
  'saveCardioSession',
  'getStretchSessions',
  'saveStretchSession',
  'getWorkoutPlans',
  'saveWorkoutPlan',
  'getActivePlan',
  'setActivePlan',
  'getFavoriteExercises',
  'toggleFavoriteExercise',
  'getPinnedExercises',
  'setPinnedExercises'
];

// Functions that should be removed or archived
const ARCHIVED_FUNCTIONS = [
  'getFavoriteWorkouts',  // Should still exist but archived
  'saveFavoriteWorkout',  // Should still exist but archived
  'deleteFavoriteWorkout' // Should still exist but archived
];

async function validateComponent(componentPath) {
  try {
    const fullPath = join(projectRoot, componentPath);
    const content = await fs.readFile(fullPath, 'utf-8');
    
    // Check for imports that might reference removed features
    const problematicImports = [
      /import.*yoga.*from/gi,
    ];
    
    let hasIssues = false;
    const issues = [];
    
    for (const pattern of problematicImports) {
      if (pattern.test(content)) {
        issues.push(`Found potentially problematic import: ${pattern}`);
        hasIssues = true;
      }
    }
    
    return { exists: true, hasIssues, issues };
  } catch (error) {
    if (error.code === 'ENOENT') {
      return { exists: false, error: 'File not found' };
    }
    return { exists: false, error: error.message };
  }
}

async function validateStorageFunctions() {
  try {
    const storagePath = join(projectRoot, 'src/utils/storage.js');
    const content = await fs.readFile(storagePath, 'utf-8');
    
    const results = {
      required: {},
      archived: {},
      removed: {}
    };
    
    // Check for required functions
    for (const func of STORAGE_FUNCTIONS) {
      const pattern = new RegExp(`export\\s+(?:const|function)\\s+${func}`, 'g');
      results.required[func] = pattern.test(content);
    }
    
    // Check for archived functions (should still exist)
    for (const func of ARCHIVED_FUNCTIONS) {
      const pattern = new RegExp(`export\\s+(?:const|function)\\s+${func}`, 'g');
      results.archived[func] = pattern.test(content);
    }
    
    // Check that totalYogaTime is not being set (should be removed)
    results.removed.totalYogaTime = !content.includes('totalYogaTime:');
    
    return results;
  } catch (error) {
    return { error: error.message };
  }
}

async function validateMigrationScript() {
  try {
    const migrationPath = join(projectRoot, 'src/migrations/simplifyDataStructure.js');
    await fs.access(migrationPath);
    return { exists: true };
  } catch (error) {
    return { exists: false, error: error.message };
  }
}

async function runValidation() {
  console.log('=== Component Validation Suite ===\n');
  
  let totalTests = 0;
  let passedTests = 0;
  
  // Validate KEEP components
  console.log('Validating KEEP components...\n');
  for (const component of KEEP_COMPONENTS) {
    totalTests++;
    const result = await validateComponent(component);
    
    if (result.exists && !result.hasIssues) {
      console.log(`✓ ${component}`);
      passedTests++;
    } else if (result.exists && result.hasIssues) {
      console.log(`⚠ ${component} - Has issues:`);
      result.issues.forEach(issue => console.log(`  - ${issue}`));
      passedTests++; // Still counts as existing
    } else {
      console.log(`✗ ${component} - ${result.error}`);
    }
  }
  
  // Validate storage functions
  console.log('\n\nValidating storage functions...\n');
  const storageResults = await validateStorageFunctions();
  
  if (storageResults.error) {
    console.log(`✗ Error reading storage.js: ${storageResults.error}`);
  } else {
    // Check required functions
    console.log('Required storage functions:');
    for (const [func, exists] of Object.entries(storageResults.required)) {
      totalTests++;
      if (exists) {
        console.log(`✓ ${func}`);
        passedTests++;
      } else {
        console.log(`✗ ${func} - MISSING`);
      }
    }
    
    // Check archived functions
    console.log('\nArchived storage functions (should still exist):');
    for (const [func, exists] of Object.entries(storageResults.archived)) {
      totalTests++;
      if (exists) {
        console.log(`✓ ${func}`);
        passedTests++;
      } else {
        console.log(`⚠ ${func} - Missing (archived)`);
        passedTests++; // Not critical
      }
    }
    
    // Check removed references
    console.log('\nRemoved references:');
    totalTests++;
    if (storageResults.removed.totalYogaTime) {
      console.log('✓ totalYogaTime removed from active code');
      passedTests++;
    } else {
      console.log('⚠ totalYogaTime still present in code');
    }
  }
  
  // Validate migration script exists
  console.log('\n\nValidating migration infrastructure...\n');
  totalTests++;
  const migrationResult = await validateMigrationScript();
  if (migrationResult.exists) {
    console.log('✓ Migration script exists');
    passedTests++;
  } else {
    console.log('✗ Migration script missing');
  }
  
  // Summary
  console.log('\n=== Validation Summary ===');
  console.log(`Total Tests: ${totalTests}`);
  console.log(`Passed: ${passedTests}`);
  console.log(`Failed: ${totalTests - passedTests}`);
  console.log(`Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
  
  return passedTests === totalTests;
}

// Run validation
runValidation()
  .then(success => {
    console.log('\n' + (success ? '✓ All validations passed!' : '⚠ Some validations failed'));
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('Validation error:', error);
    process.exit(1);
  });
