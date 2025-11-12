#!/usr/bin/env node

/**
 * Simple Migration Test Script
 * 
 * This script creates a minimal test environment and runs the migration
 */

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

// Mock guest storage functions
const mockGuestStorage = {
  isGuestMode: () => false,
  getGuestData: () => null,
  setGuestData: () => {}
};

// Create a simple inline migration (avoiding imports)
const MIGRATION_VERSION = 'v1.0.0-simplify-data-structure';
const MIGRATION_KEY = 'goodlift_migration_version';

function getData(key) {
  try {
    const data = localStorage.getItem(`goodlift_${key}`);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error(`Error getting data for ${key}:`, error);
    return null;
  }
}

function setData(key, value) {
  try {
    localStorage.setItem(`goodlift_${key}`, JSON.stringify(value));
  } catch (error) {
    console.error(`Error setting data for ${key}:`, error);
  }
}

function removeData(key) {
  try {
    localStorage.removeItem(`goodlift_${key}`);
  } catch (error) {
    console.error(`Error removing data for ${key}:`, error);
  }
}

// Setup test data
function setupTestData() {
  console.log('Setting up test data...');
  
  // Workout history with mixed date formats
  const workoutHistory = [
    {
      id: '1',
      date: Date.now() - 86400000,
      duration: 3600,
      type: 'Upper Body',
      exercises: { 'Bench Press': { sets: [{ reps: 10, weight: 135 }] } }
    },
    {
      id: '2',
      date: new Date(Date.now() - 172800000).toISOString(),
      duration: 3000,
      type: 'Lower Body',
      exercises: { 'Squat': { sets: [{ reps: 8, weight: 225 }] } }
    },
    {
      id: '3',
      date: new Date(Date.now() - 259200000).toISOString(),
      type: 'Full Body',
      exercises: { 'Deadlift': { sets: [{ reps: 5, weight: 315 }] } }
    }
  ];
  
  const userStats = {
    totalWorkouts: 10,
    totalTime: 36000,
    totalHiitTime: 1800,
    totalCardioTime: 3600,
    totalStretchTime: 1200,
    totalYogaTime: 2400
  };
  
  const yogaSessions = [
    { id: 'yoga1', date: new Date(Date.now() - 86400000).toISOString(), duration: 1800, type: 'Vinyasa Flow' }
  ];
  
  const favoriteWorkouts = [
    { id: 'fav1', name: 'Quick Upper Body', type: 'Upper Body', exercises: ['Bench Press'] }
  ];
  
  const hiitSessions = [
    { date: Date.now() - 86400000, duration: 1200, type: 'Tabata' }
  ];
  
  setData('workout_history', workoutHistory);
  setData('user_stats', userStats);
  setData('yoga_sessions', yogaSessions);
  setData('favorite_workouts', favoriteWorkouts);
  setData('hiit_sessions', hiitSessions);
  
  console.log('✓ Test data created');
}

// Run migration steps
function runMigration() {
  console.log('\n=== Running Migration ===\n');
  
  // Step 1: Migrate workout history
  console.log('Step 1: Migrating workout history...');
  const history = getData('workout_history');
  if (history && Array.isArray(history)) {
    const migrated = history.map(w => ({
      ...w,
      date: typeof w.date === 'number' ? new Date(w.date).toISOString() : w.date,
      duration: w.duration !== undefined ? w.duration : 0
    }));
    setData('workout_history', migrated);
    console.log(`✓ Migrated ${migrated.length} workouts`);
  }
  
  // Step 2: Archive yoga sessions
  console.log('\nStep 2: Archiving yoga sessions...');
  const yoga = getData('yoga_sessions');
  if (yoga) {
    setData('archived_yoga_sessions', {
      data: yoga,
      archivedAt: new Date().toISOString(),
      reason: 'Yoga feature removed'
    });
    removeData('yoga_sessions');
    console.log('✓ Archived yoga sessions');
  }
  
  // Step 3: Archive favorite workouts
  console.log('\nStep 3: Archiving favorite workouts...');
  const favorites = getData('favorite_workouts');
  if (favorites) {
    setData('archived_favorite_workouts', {
      data: favorites,
      archivedAt: new Date().toISOString(),
      reason: 'Replaced by workout plans'
    });
    removeData('favorite_workouts');
    console.log('✓ Archived favorite workouts');
  }
  
  // Step 4: Clean user stats
  console.log('\nStep 4: Cleaning user stats...');
  const stats = getData('user_stats');
  if (stats) {
    delete stats.totalYogaTime;
    setData('user_stats', stats);
    console.log('✓ Removed totalYogaTime');
  }
  
  // Step 5: Validate sessions
  console.log('\nStep 5: Validating sessions...');
  const hiit = getData('hiit_sessions');
  if (hiit && Array.isArray(hiit)) {
    const validated = hiit.map(s => ({
      ...s,
      id: s.id || `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      date: typeof s.date === 'number' ? new Date(s.date).toISOString() : s.date,
      duration: s.duration !== undefined ? s.duration : 0
    }));
    setData('hiit_sessions', validated);
    console.log(`✓ Validated ${validated.length} sessions`);
  }
  
  // Mark migration complete
  localStorage.setItem(MIGRATION_KEY, MIGRATION_VERSION);
  console.log('\n✓ Migration completed');
}

// Verify results
function verifyResults() {
  console.log('\n=== Verification ===\n');
  
  let tests = 0;
  let passed = 0;
  
  // Test 1: Yoga archived
  tests++;
  if (!getData('yoga_sessions') && getData('archived_yoga_sessions')) {
    console.log('✓ Test 1: Yoga sessions archived');
    passed++;
  } else {
    console.log('✗ Test 1: Yoga sessions not archived');
  }
  
  // Test 2: Favorites archived
  tests++;
  if (!getData('favorite_workouts') && getData('archived_favorite_workouts')) {
    console.log('✓ Test 2: Favorite workouts archived');
    passed++;
  } else {
    console.log('✗ Test 2: Favorite workouts not archived');
  }
  
  // Test 3: totalYogaTime removed
  tests++;
  const stats = getData('user_stats');
  if (stats && !('totalYogaTime' in stats)) {
    console.log('✓ Test 3: totalYogaTime removed');
    passed++;
  } else {
    console.log('✗ Test 3: totalYogaTime still exists');
  }
  
  // Test 4: Workout dates in ISO format
  tests++;
  const history = getData('workout_history');
  const allISO = history && history.every(w => typeof w.date === 'string' && w.date.includes('T'));
  if (allISO) {
    console.log('✓ Test 4: Workout dates in ISO format');
    passed++;
  } else {
    console.log('✗ Test 4: Some dates not in ISO format');
  }
  
  // Test 5: Sessions have IDs
  tests++;
  const hiit = getData('hiit_sessions');
  const allHaveIds = hiit && hiit.every(s => s.id && s.id.length > 0);
  if (allHaveIds) {
    console.log('✓ Test 5: All sessions have IDs');
    passed++;
  } else {
    console.log('✗ Test 5: Some sessions missing IDs');
  }
  
  console.log(`\n=== Results: ${passed}/${tests} tests passed ===`);
  return passed === tests;
}

// Main
console.log('=== Data Migration Test ===\n');
setupTestData();
runMigration();
const success = verifyResults();

console.log('\n' + (success ? '✓ All tests passed!' : '✗ Some tests failed'));
process.exit(success ? 0 : 1);
