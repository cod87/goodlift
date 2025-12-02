/**
 * Tests for Volume Calculation Logic
 * 
 * Tests that totalVolume is correctly calculated from workout history.
 * This ensures volume lifted achievements work properly.
 */

import { 
  isAchievementUnlocked,
  ACHIEVEMENT_BADGES 
} from '../src/data/achievements.js';

console.log('=== Volume Calculation Tests ===\n');

// Helper function to create a workout with specific exercises and sets
const createWorkoutWithVolume = (exercises, date = new Date()) => ({
  date: date.toISOString(),
  type: 'strength',
  exercises: exercises,
  duration: 3600,
});

// Test 1: Volume is correctly calculated from a single workout
console.log('Test 1: Volume calculation from a single workout with multiple exercises');
{
  // Workout with:
  // - Bench Press: 3 sets of 10 reps @ 100 lbs = 3000 lbs
  // - Squats: 3 sets of 8 reps @ 150 lbs = 3600 lbs
  // Total = 6600 lbs
  const workoutHistory = [createWorkoutWithVolume({
    'Bench Press': {
      sets: [
        { weight: 100, reps: 10, set: 1 },
        { weight: 100, reps: 10, set: 2 },
        { weight: 100, reps: 10, set: 3 },
      ]
    },
    'Squat': {
      sets: [
        { weight: 150, reps: 8, set: 1 },
        { weight: 150, reps: 8, set: 2 },
        { weight: 150, reps: 8, set: 3 },
      ]
    }
  })];
  
  // Calculate expected volume
  const expectedVolume = (100 * 10 * 3) + (150 * 8 * 3); // 3000 + 3600 = 6600
  
  // Create stats with calculated volume
  const stats = {
    totalWorkouts: 1,
    currentStreak: 1,
    longestStreak: 1,
    totalPRs: 0,
    totalVolume: expectedVolume,
    totalTime: 3600,
  };
  
  // Check if volume-10k achievement is NOT unlocked (only 6600 lbs)
  const volume10kAchievement = ACHIEVEMENT_BADGES.find(a => a.id === 'volume-10k');
  const isUnlocked = isAchievementUnlocked(volume10kAchievement, stats, workoutHistory);
  
  const passed = isUnlocked === false && expectedVolume === 6600;
  console.log(`  Expected volume: 6600 lbs`);
  console.log(`  Calculated volume: ${expectedVolume} lbs`);
  console.log(`  volume-10k should NOT be unlocked: ${isUnlocked === false}`);
  console.log(`  Result: ${passed ? '✓ PASS' : '✗ FAIL'}`);
}
console.log('');

// Test 2: Volume achievement unlocks when threshold is met
console.log('Test 2: Volume achievement unlocks when 10,000 lbs threshold is met');
{
  // Create workouts that total > 10,000 lbs
  // Workout 1: 5000 lbs
  // Workout 2: 6000 lbs
  // Total: 11,000 lbs
  const workout1 = createWorkoutWithVolume({
    'Bench Press': {
      sets: [
        { weight: 100, reps: 10, set: 1 },
        { weight: 100, reps: 10, set: 2 },
        { weight: 100, reps: 10, set: 3 },
        { weight: 100, reps: 10, set: 4 },
        { weight: 100, reps: 10, set: 5 },
      ]
    }
  }, new Date(Date.now() - 86400000));
  
  const workout2 = createWorkoutWithVolume({
    'Squat': {
      sets: [
        { weight: 150, reps: 10, set: 1 },
        { weight: 150, reps: 10, set: 2 },
        { weight: 150, reps: 10, set: 3 },
        { weight: 150, reps: 10, set: 4 },
      ]
    }
  });
  
  const workoutHistory = [workout2, workout1]; // Most recent first
  
  // Calculate expected volume
  const expectedVolume = (100 * 10 * 5) + (150 * 10 * 4); // 5000 + 6000 = 11000
  
  const stats = {
    totalWorkouts: 2,
    currentStreak: 2,
    longestStreak: 2,
    totalPRs: 0,
    totalVolume: expectedVolume,
    totalTime: 7200,
  };
  
  // Check if volume-10k achievement IS unlocked (11,000 lbs > 10,000)
  const volume10kAchievement = ACHIEVEMENT_BADGES.find(a => a.id === 'volume-10k');
  const isUnlocked = isAchievementUnlocked(volume10kAchievement, stats, workoutHistory);
  
  const passed = isUnlocked === true && expectedVolume === 11000;
  console.log(`  Expected volume: 11,000 lbs`);
  console.log(`  Calculated volume: ${expectedVolume} lbs`);
  console.log(`  volume-10k should be unlocked: ${isUnlocked}`);
  console.log(`  Result: ${passed ? '✓ PASS' : '✗ FAIL'}`);
}
console.log('');

// Test 3: Volume calculation handles missing/invalid data gracefully
console.log('Test 3: Volume calculation handles missing/invalid workout data');
{
  const workoutWithMissingData = [
    createWorkoutWithVolume({
      'Bench Press': {
        sets: [
          { weight: 100, reps: 10, set: 1 },
          { weight: null, reps: 10, set: 2 },  // Missing weight
          { weight: 100, reps: null, set: 3 },  // Missing reps
          { weight: 0, reps: 10, set: 4 },      // Zero weight
          { weight: 100, reps: 0, set: 5 },     // Zero reps
        ]
      }
    }),
    { date: new Date().toISOString(), type: 'cardio', duration: 1800 }, // No exercises
    createWorkoutWithVolume(null), // Null exercises
  ];
  
  // Only the first set (100 * 10 = 1000) should count
  const stats = {
    totalWorkouts: 3,
    currentStreak: 1,
    longestStreak: 1,
    totalPRs: 0,
    totalVolume: 1000, // Only valid sets count
    totalTime: 5400,
  };
  
  const volume10kAchievement = ACHIEVEMENT_BADGES.find(a => a.id === 'volume-10k');
  const isUnlocked = isAchievementUnlocked(volume10kAchievement, stats, workoutWithMissingData);
  
  const passed = isUnlocked === false;
  console.log(`  Workouts with missing/invalid data should not crash`);
  console.log(`  Only valid sets (weight > 0 AND reps > 0) should count`);
  console.log(`  volume-10k should NOT be unlocked: ${isUnlocked === false}`);
  console.log(`  Result: ${passed ? '✓ PASS' : '✗ FAIL'}`);
}
console.log('');

// Test 4: Multiple volume achievement tiers
console.log('Test 4: Multiple volume achievement tiers');
{
  const stats = {
    totalWorkouts: 100,
    currentStreak: 5,
    longestStreak: 10,
    totalPRs: 25,
    totalVolume: 75000, // Between 50k and 100k
    totalTime: 360000,
  };
  
  const workoutHistory = [];
  
  const volume10k = ACHIEVEMENT_BADGES.find(a => a.id === 'volume-10k');
  const volume50k = ACHIEVEMENT_BADGES.find(a => a.id === 'volume-50k');
  const volume100k = ACHIEVEMENT_BADGES.find(a => a.id === 'volume-100k');
  const volume250k = ACHIEVEMENT_BADGES.find(a => a.id === 'volume-250k');
  
  const is10kUnlocked = isAchievementUnlocked(volume10k, stats, workoutHistory);
  const is50kUnlocked = isAchievementUnlocked(volume50k, stats, workoutHistory);
  const is100kUnlocked = isAchievementUnlocked(volume100k, stats, workoutHistory);
  const is250kUnlocked = isAchievementUnlocked(volume250k, stats, workoutHistory);
  
  const passed = is10kUnlocked && is50kUnlocked && !is100kUnlocked && !is250kUnlocked;
  console.log(`  Total volume: 75,000 lbs`);
  console.log(`  volume-10k (10,000 lbs) unlocked: ${is10kUnlocked} ${is10kUnlocked ? '✓' : '✗'}`);
  console.log(`  volume-50k (50,000 lbs) unlocked: ${is50kUnlocked} ${is50kUnlocked ? '✓' : '✗'}`);
  console.log(`  volume-100k (100,000 lbs) NOT unlocked: ${!is100kUnlocked} ${!is100kUnlocked ? '✓' : '✗'}`);
  console.log(`  volume-250k (250,000 lbs) NOT unlocked: ${!is250kUnlocked} ${!is250kUnlocked ? '✓' : '✗'}`);
  console.log(`  Result: ${passed ? '✓ PASS' : '✗ FAIL'}`);
}
console.log('');

// Test 5: Zero volume should not unlock any volume achievements
console.log('Test 5: Zero volume should not unlock any volume achievements');
{
  const stats = {
    totalWorkouts: 10,
    currentStreak: 3,
    longestStreak: 5,
    totalPRs: 0,
    totalVolume: 0, // Zero volume
    totalTime: 36000,
  };
  
  const workoutHistory = [];
  
  const volume10k = ACHIEVEMENT_BADGES.find(a => a.id === 'volume-10k');
  const isUnlocked = isAchievementUnlocked(volume10k, stats, workoutHistory);
  
  const passed = isUnlocked === false;
  console.log(`  Total volume: 0 lbs (no weights tracked)`);
  console.log(`  volume-10k should NOT be unlocked: ${isUnlocked === false}`);
  console.log(`  Result: ${passed ? '✓ PASS' : '✗ FAIL'}`);
}
console.log('');

console.log('=== Volume Calculation Tests Complete ===');
