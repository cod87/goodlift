#!/usr/bin/env node

/**
 * Migration Test Script
 * 
 * This script tests the data migration by:
 * 1. Creating sample data with various scenarios
 * 2. Running the migration
 * 3. Verifying the results
 */

import { runDataMigration, getMigrationStatus, resetMigration } from '../src/migrations/simplifyDataStructure.js';

// Mock localStorage for Node.js environment
class LocalStorageMock {
  constructor() {
    this.store = {};
  }

  getItem(key) {
    return this.store[key] || null;
  }

  setItem(key, value) {
    this.store[key] = value;
  }

  removeItem(key) {
    delete this.store[key];
  }

  clear() {
    this.store = {};
  }
}

// Set up global localStorage
global.localStorage = new LocalStorageMock();

// Create test data
function setupTestData() {
  console.log('Setting up test data...');
  
  // Workout history with mixed date formats
  const workoutHistory = [
    {
      id: '1',
      date: Date.now() - 86400000, // timestamp format (yesterday)
      duration: 3600,
      type: 'Upper Body',
      exercises: { 'Bench Press': { sets: [{ reps: 10, weight: 135 }] } }
    },
    {
      id: '2',
      date: new Date(Date.now() - 172800000).toISOString(), // ISO format (2 days ago)
      duration: 3000,
      type: 'Lower Body',
      exercises: { 'Squat': { sets: [{ reps: 8, weight: 225 }] } }
    },
    {
      id: '3',
      // Missing duration - should be added as 0
      date: new Date(Date.now() - 259200000).toISOString(),
      type: 'Full Body',
      exercises: { 'Deadlift': { sets: [{ reps: 5, weight: 315 }] } }
    }
  ];
  
  // User stats with totalYogaTime (should be removed)
  const userStats = {
    totalWorkouts: 10,
    totalTime: 36000,
    totalHiitTime: 1800,
    totalCardioTime: 3600,
    totalStretchTime: 1200,
    totalYogaTime: 2400 // Should be removed
  };
  
  // Yoga sessions (should be archived)
  const yogaSessions = [
    {
      id: 'yoga1',
      date: new Date(Date.now() - 86400000).toISOString(),
      duration: 1800,
      type: 'Vinyasa Flow'
    }
  ];
  
  // Favorite workouts (should be archived)
  const favoriteWorkouts = [
    {
      id: 'fav1',
      name: 'Quick Upper Body',
      type: 'Upper Body',
      exercises: ['Bench Press', 'Rows', 'Shoulder Press']
    }
  ];
  
  // HIIT sessions (should be validated)
  const hiitSessions = [
    {
      // Missing id - should be added
      date: Date.now() - 86400000,
      duration: 1200,
      type: 'Tabata'
    },
    {
      id: 'hiit2',
      date: new Date(Date.now() - 172800000).toISOString(),
      duration: 900,
      type: 'EMOM'
    }
  ];
  
  // Cardio sessions
  const cardioSessions = [
    {
      id: 'cardio1',
      date: new Date(Date.now() - 86400000).toISOString(),
      duration: 1800,
      cardioType: 'Running'
    }
  ];
  
  // Stretch sessions
  const stretchSessions = [
    {
      id: 'stretch1',
      date: new Date(Date.now() - 86400000).toISOString(),
      duration: 600,
      type: 'Full Body Stretch'
    }
  ];
  
  // Exercise weights
  const exerciseWeights = {
    'Bench Press': 135,
    'Squat': 225,
    'Deadlift': 315
  };
  
  // Workout plans
  const workoutPlans = [
    {
      id: 'plan1',
      name: 'This Week',
      sessions: []
    }
  ];
  
  // Store test data
  localStorage.setItem('goodlift_workout_history', JSON.stringify(workoutHistory));
  localStorage.setItem('goodlift_user_stats', JSON.stringify(userStats));
  localStorage.setItem('goodlift_yoga_sessions', JSON.stringify(yogaSessions));
  localStorage.setItem('goodlift_favorite_workouts', JSON.stringify(favoriteWorkouts));
  localStorage.setItem('goodlift_hiit_sessions', JSON.stringify(hiitSessions));
  localStorage.setItem('goodlift_cardio_sessions', JSON.stringify(cardioSessions));
  localStorage.setItem('goodlift_stretch_sessions', JSON.stringify(stretchSessions));
  localStorage.setItem('goodlift_exercise_weights', JSON.stringify(exerciseWeights));
  localStorage.setItem('goodlift_workout_plans', JSON.stringify(workoutPlans));
  
  console.log('Test data created successfully');
}

// Verify migration results
function verifyResults() {
  console.log('\n=== Verifying Migration Results ===\n');
  
  let passed = 0;
  let failed = 0;
  
  // Test 1: Workout history dates should be ISO format
  const workoutHistory = JSON.parse(localStorage.getItem('goodlift_workout_history') || '[]');
  console.log('Test 1: Workout history date format');
  const allDatesISO = workoutHistory.every(w => {
    try {
      return typeof w.date === 'string' && w.date.includes('T') && w.date.includes('Z');
    } catch {
      return false;
    }
  });
  if (allDatesISO) {
    console.log('✓ PASS: All workout dates are in ISO format');
    passed++;
  } else {
    console.log('✗ FAIL: Some workout dates are not in ISO format');
    failed++;
  }
  
  // Test 2: Missing durations should be added
  console.log('\nTest 2: Missing durations added');
  const allHaveDuration = workoutHistory.every(w => w.duration !== undefined && w.duration !== null);
  if (allHaveDuration) {
    console.log('✓ PASS: All workouts have duration');
    passed++;
  } else {
    console.log('✗ FAIL: Some workouts are missing duration');
    failed++;
  }
  
  // Test 3: Yoga sessions should be archived
  const yogaSessions = localStorage.getItem('goodlift_yoga_sessions');
  const archivedYoga = localStorage.getItem('goodlift_archived_yoga_sessions');
  console.log('\nTest 3: Yoga sessions archived');
  if (yogaSessions === null && archivedYoga !== null) {
    console.log('✓ PASS: Yoga sessions archived successfully');
    passed++;
  } else {
    console.log('✗ FAIL: Yoga sessions not properly archived');
    console.log('  Active yoga sessions:', yogaSessions !== null);
    console.log('  Archived yoga sessions:', archivedYoga !== null);
    failed++;
  }
  
  // Test 4: Favorite workouts should be archived
  const favoriteWorkouts = localStorage.getItem('goodlift_favorite_workouts');
  const archivedFavorites = localStorage.getItem('goodlift_archived_favorite_workouts');
  console.log('\nTest 4: Favorite workouts archived');
  if (favoriteWorkouts === null && archivedFavorites !== null) {
    console.log('✓ PASS: Favorite workouts archived successfully');
    passed++;
  } else {
    console.log('✗ FAIL: Favorite workouts not properly archived');
    console.log('  Active favorite workouts:', favoriteWorkouts !== null);
    console.log('  Archived favorite workouts:', archivedFavorites !== null);
    failed++;
  }
  
  // Test 5: totalYogaTime should be removed from user stats
  const userStats = JSON.parse(localStorage.getItem('goodlift_user_stats') || '{}');
  console.log('\nTest 5: totalYogaTime removed from user stats');
  if (!('totalYogaTime' in userStats)) {
    console.log('✓ PASS: totalYogaTime removed from user stats');
    passed++;
  } else {
    console.log('✗ FAIL: totalYogaTime still exists in user stats');
    failed++;
  }
  
  // Test 6: HIIT sessions should have IDs
  const hiitSessions = JSON.parse(localStorage.getItem('goodlift_hiit_sessions') || '[]');
  console.log('\nTest 6: HIIT sessions have IDs');
  const allHaveIds = hiitSessions.every(s => s.id && s.id.length > 0);
  if (allHaveIds && hiitSessions.length > 0) {
    console.log('✓ PASS: All HIIT sessions have IDs');
    passed++;
  } else {
    console.log('✗ FAIL: Some HIIT sessions are missing IDs');
    failed++;
  }
  
  // Test 7: Session dates should be ISO format
  console.log('\nTest 7: Session dates in ISO format');
  const allSessionsISO = hiitSessions.every(s => {
    try {
      return typeof s.date === 'string' && s.date.includes('T');
    } catch {
      return false;
    }
  });
  if (allSessionsISO && hiitSessions.length > 0) {
    console.log('✓ PASS: All session dates are in ISO format');
    passed++;
  } else {
    console.log('✗ FAIL: Some session dates are not in ISO format');
    failed++;
  }
  
  // Test 8: Migration version should be set
  const migrationVersion = localStorage.getItem('goodlift_migration_version');
  console.log('\nTest 8: Migration version set');
  if (migrationVersion === 'v1.0.0-simplify-data-structure') {
    console.log('✓ PASS: Migration version correctly set');
    passed++;
  } else {
    console.log('✗ FAIL: Migration version not set correctly');
    console.log('  Expected: v1.0.0-simplify-data-structure');
    console.log('  Got:', migrationVersion);
    failed++;
  }
  
  // Test 9: Exercise weights should be preserved
  const exerciseWeights = JSON.parse(localStorage.getItem('goodlift_exercise_weights') || '{}');
  console.log('\nTest 9: Exercise weights preserved');
  if (exerciseWeights['Bench Press'] === 135) {
    console.log('✓ PASS: Exercise weights preserved');
    passed++;
  } else {
    console.log('✗ FAIL: Exercise weights not preserved');
    failed++;
  }
  
  // Test 10: Workout plans should be preserved
  const workoutPlans = JSON.parse(localStorage.getItem('goodlift_workout_plans') || '[]');
  console.log('\nTest 10: Workout plans preserved');
  if (workoutPlans.length > 0 && workoutPlans[0].name === 'This Week') {
    console.log('✓ PASS: Workout plans preserved');
    passed++;
  } else {
    console.log('✗ FAIL: Workout plans not preserved');
    failed++;
  }
  
  // Summary
  console.log('\n=== Migration Test Summary ===');
  console.log(`Total Tests: ${passed + failed}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  console.log(`Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);
  
  return failed === 0;
}

// Main test execution
async function runTests() {
  console.log('=== Data Migration Test Suite ===\n');
  
  // Setup test data
  setupTestData();
  
  // Check migration status before
  console.log('\nMigration status before:', getMigrationStatus());
  
  // Run migration
  console.log('\n=== Running Migration ===\n');
  const result = runDataMigration();
  console.log('\nMigration result:', result);
  
  // Check migration status after
  console.log('\nMigration status after:', getMigrationStatus());
  
  // Verify results
  const success = verifyResults();
  
  // Exit with appropriate code
  process.exit(success ? 0 : 1);
}

// Run the tests
runTests();
