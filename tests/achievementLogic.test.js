/**
 * Tests for Achievement Logic
 * 
 * Tests the achievement awarding logic, specifically:
 * - First workout achievement should only be awarded once
 * - Subsequent achievements should be awarded appropriately
 */

import { 
  getNewlyUnlockedAchievements, 
  isAchievementUnlocked,
  ACHIEVEMENT_BADGES 
} from '../src/data/achievements.js';

console.log('=== Achievement Logic Tests ===\n');

// Helper function to create basic user stats
const createUserStats = (totalWorkouts = 0) => ({
  totalWorkouts,
  currentStreak: 0,
  longestStreak: 0,
  totalPRs: 0,
  totalVolume: 0,
  totalTime: 0,
});

// Helper function to create a workout entry
const createWorkout = (date = new Date()) => ({
  date: date.toISOString(),
  type: 'strength',
  exercises: { 'Bench Press': { sets: [{ weight: 100, reps: 10 }] } },
  duration: 3600,
});

// Test 1: First workout achievement is unlocked after first workout
console.log('Test 1: First workout achievement is unlocked after first workout');
{
  const stats = createUserStats(1);
  const workoutHistory = [createWorkout()];
  const previouslyUnlocked = [];
  
  const newAchievements = getNewlyUnlockedAchievements(stats, workoutHistory, previouslyUnlocked);
  const firstWorkout = newAchievements.find(a => a.id === 'first-workout');
  
  const passed = firstWorkout !== undefined;
  console.log(`  Stats: totalWorkouts = 1`);
  console.log(`  Previously unlocked: []`);
  console.log(`  Expected: first-workout to be in newAchievements`);
  console.log(`  Got: ${firstWorkout ? 'first-workout found' : 'first-workout NOT found'} ${passed ? '✓' : '✗ FAIL'}`);
}
console.log('');

// Test 2: First workout achievement is NOT returned if already unlocked
console.log('Test 2: First workout achievement is NOT returned if already unlocked');
{
  const stats = createUserStats(2);
  const workoutHistory = [createWorkout(), createWorkout(new Date(Date.now() - 86400000))];
  const previouslyUnlocked = ['first-workout']; // Already unlocked
  
  const newAchievements = getNewlyUnlockedAchievements(stats, workoutHistory, previouslyUnlocked);
  const firstWorkout = newAchievements.find(a => a.id === 'first-workout');
  
  const passed = firstWorkout === undefined;
  console.log(`  Stats: totalWorkouts = 2`);
  console.log(`  Previously unlocked: ['first-workout']`);
  console.log(`  Expected: first-workout to NOT be in newAchievements`);
  console.log(`  Got: ${firstWorkout ? 'first-workout FOUND (BUG!)' : 'first-workout correctly excluded'} ${passed ? '✓' : '✗ FAIL'}`);
}
console.log('');

// Test 3: Check if isAchievementUnlocked works correctly
console.log('Test 3: isAchievementUnlocked correctly identifies unlocked achievements');
{
  const stats = createUserStats(1);
  const workoutHistory = [createWorkout()];
  const firstWorkoutAchievement = ACHIEVEMENT_BADGES.find(a => a.id === 'first-workout');
  
  const isUnlocked = isAchievementUnlocked(firstWorkoutAchievement, stats, workoutHistory);
  
  const passed = isUnlocked === true;
  console.log(`  Stats: totalWorkouts = 1`);
  console.log(`  Expected: first-workout isAchievementUnlocked = true`);
  console.log(`  Got: ${isUnlocked} ${passed ? '✓' : '✗ FAIL'}`);
}
console.log('');

// Test 4: Zero workouts should not unlock first-workout
console.log('Test 4: Zero workouts should not unlock first-workout');
{
  const stats = createUserStats(0);
  const workoutHistory = [];
  const firstWorkoutAchievement = ACHIEVEMENT_BADGES.find(a => a.id === 'first-workout');
  
  const isUnlocked = isAchievementUnlocked(firstWorkoutAchievement, stats, workoutHistory);
  
  const passed = isUnlocked === false;
  console.log(`  Stats: totalWorkouts = 0`);
  console.log(`  Expected: first-workout isAchievementUnlocked = false`);
  console.log(`  Got: ${isUnlocked} ${passed ? '✓' : '✗ FAIL'}`);
}
console.log('');

// Test 5: Multiple workouts with empty previouslyUnlocked - only truly new shown
console.log('Test 5: Multiple workouts with empty previouslyUnlocked - only truly new shown');
{
  const stats = createUserStats(5);
  stats.totalVolume = 10001; // Over 10k for volume achievement
  const workoutHistory = Array(5).fill(null).map((_, i) => 
    createWorkout(new Date(Date.now() - i * 86400000))
  );
  const previouslyUnlocked = [];
  
  const newAchievements = getNewlyUnlockedAchievements(stats, workoutHistory, previouslyUnlocked);
  
  const hasFirstWorkout = newAchievements.some(a => a.id === 'first-workout');
  const hasDedicated5 = newAchievements.some(a => a.id === 'dedicated-5');
  
  // With the fix:
  // - first-workout should NOT be shown (was unlockable before this 5th workout)
  // - dedicated-5 SHOULD be shown (just became unlockable with this 5th workout)
  const passed = !hasFirstWorkout && hasDedicated5;
  console.log(`  Stats: totalWorkouts = 5, totalVolume = 10001`);
  console.log(`  Workout history: 5 workouts`);
  console.log(`  Previously unlocked: [] (empty)`);
  console.log(`  Expected: first-workout NOT new, dedicated-5 IS new`);
  console.log(`  Got first-workout: ${hasFirstWorkout}, dedicated-5: ${hasDedicated5} ${passed ? '✓' : '✗ FAIL'}`);
}
console.log('');

// Test 6: Simulate the actual bug - second workout should NOT show first-workout
console.log('Test 6: Simulate second workout - first-workout should not appear again');
{
  // After second workout completion
  const stats = createUserStats(2);
  const workoutHistory = [
    createWorkout(new Date()),
    createWorkout(new Date(Date.now() - 86400000))
  ];
  // This should be saved from the first workout
  const previouslyUnlocked = ['first-workout'];
  
  const newAchievements = getNewlyUnlockedAchievements(stats, workoutHistory, previouslyUnlocked);
  
  console.log(`  Stats: totalWorkouts = 2`);
  console.log(`  Workout history: 2 workouts`);
  console.log(`  Previously unlocked: ['first-workout']`);
  console.log(`  New achievements returned: ${JSON.stringify(newAchievements.map(a => a.id))}`);
  
  const hasFirstWorkout = newAchievements.some(a => a.id === 'first-workout');
  const passed = !hasFirstWorkout;
  console.log(`  Expected: first-workout to NOT be in new achievements`);
  console.log(`  Got: ${hasFirstWorkout ? 'FAIL - first-workout was included' : 'Correct - first-workout excluded'} ${passed ? '✓' : '✗ FAIL'}`);
}
console.log('');

// Test 7: Verify the problem - passing stats with already-incremented totalWorkouts
console.log('Test 7: Verify actual bug scenario - stats double counting');
{
  // Scenario: First workout is completed
  // getUserStats() returns totalWorkouts = 1 (correctly calculated from history)
  // But then stats.totalWorkouts += 1 makes it 2
  
  // First workout scenario (as code does it):
  const statsAfterFirstWorkout = createUserStats(1);  // From getUserStats()
  statsAfterFirstWorkout.totalWorkouts += 1;  // App.jsx line 564 (now it's 2!)
  
  const workoutHistory1 = [createWorkout()];
  const previouslyUnlocked1 = [];
  
  const newAchievements1 = getNewlyUnlockedAchievements(statsAfterFirstWorkout, workoutHistory1, previouslyUnlocked1);
  const firstWorkoutFound = newAchievements1.some(a => a.id === 'first-workout');
  
  console.log(`  First workout scenario:`);
  console.log(`  Stats after double-increment: totalWorkouts = ${statsAfterFirstWorkout.totalWorkouts}`);
  console.log(`  Workout history length: ${workoutHistory1.length}`);
  console.log(`  first-workout should still be found (stats >= 1): ${firstWorkoutFound ? '✓' : '✗'}`);
  
  // Second workout scenario:
  const statsAfterSecondWorkout = createUserStats(2);  // From getUserStats()
  statsAfterSecondWorkout.totalWorkouts += 1;  // App.jsx line 564 (now it's 3!)
  
  const workoutHistory2 = [createWorkout(), createWorkout(new Date(Date.now() - 86400000))];
  const previouslyUnlocked2 = ['first-workout'];  // Should be saved from first workout
  
  const newAchievements2 = getNewlyUnlockedAchievements(statsAfterSecondWorkout, workoutHistory2, previouslyUnlocked2);
  const firstWorkoutNotFound = !newAchievements2.some(a => a.id === 'first-workout');
  
  console.log(`  Second workout scenario:`);
  console.log(`  Stats after double-increment: totalWorkouts = ${statsAfterSecondWorkout.totalWorkouts}`);
  console.log(`  Previously unlocked: ['first-workout']`);
  console.log(`  first-workout should NOT be found: ${firstWorkoutNotFound ? '✓' : '✗ FAIL'}`);
  
  const passed = firstWorkoutFound && firstWorkoutNotFound;
  console.log(`  Overall: ${passed ? '✓ PASS' : '✗ FAIL'}`);
}
console.log('');

// Test 8: Bug scenario - previouslyUnlocked is empty on second workout (FIXED)
console.log('Test 8: Bug scenario - previouslyUnlocked is empty on second workout (FIXED)');
{
  // This WAS the bug - if previouslyUnlocked is empty, first-workout would be shown again
  // After fix: we check workout history length to prevent this
  const stats = createUserStats(2);
  const workoutHistory = [createWorkout(), createWorkout(new Date(Date.now() - 86400000))];
  const previouslyUnlocked = [];  // Empty, but there are 2 workouts, so first-workout was already earned
  
  const newAchievements = getNewlyUnlockedAchievements(stats, workoutHistory, previouslyUnlocked);
  const hasFirstWorkout = newAchievements.some(a => a.id === 'first-workout');
  
  console.log(`  Stats: totalWorkouts = 2`);
  console.log(`  Workout history: 2 workouts`);
  console.log(`  Previously unlocked: [] (was a bug)`);
  console.log(`  first-workout in new achievements: ${hasFirstWorkout}`);
  
  // After fix, first-workout should NOT be in new achievements
  // because the workout history shows there was already 1+ workout before
  const passed = hasFirstWorkout === false;
  console.log(`  Expected: first-workout should NOT be returned (was already earned)`);
  console.log(`  Result: ${passed ? '✓ FIXED - first-workout correctly excluded' : '✗ STILL BROKEN'}`);
}
console.log('');

// Test 9: First workout should still be awarded on first workout
console.log('Test 9: First workout achievement on actual first workout');
{
  const stats = createUserStats(1);
  const workoutHistory = [createWorkout()];
  const previouslyUnlocked = [];
  
  const newAchievements = getNewlyUnlockedAchievements(stats, workoutHistory, previouslyUnlocked);
  const hasFirstWorkout = newAchievements.some(a => a.id === 'first-workout');
  
  console.log(`  Stats: totalWorkouts = 1`);
  console.log(`  Workout history: 1 workout (this is the first)`);
  console.log(`  Previously unlocked: []`);
  console.log(`  first-workout in new achievements: ${hasFirstWorkout}`);
  
  const passed = hasFirstWorkout === true;
  console.log(`  Expected: first-workout SHOULD be returned`);
  console.log(`  Result: ${passed ? '✓ PASS' : '✗ FAIL - first-workout not returned when it should be'}`);
}
console.log('');

// Test 10: 5th workout achievement on exactly 5th workout
console.log('Test 10: 5 workout achievement on exactly 5th workout');
{
  const stats = createUserStats(5);
  const workoutHistory = Array(5).fill(null).map((_, i) => 
    createWorkout(new Date(Date.now() - i * 86400000))
  );
  const previouslyUnlocked = ['first-workout']; // Already got first-workout
  
  const newAchievements = getNewlyUnlockedAchievements(stats, workoutHistory, previouslyUnlocked);
  const hasDedicated5 = newAchievements.some(a => a.id === 'dedicated-5');
  const hasFirstWorkout = newAchievements.some(a => a.id === 'first-workout');
  
  console.log(`  Stats: totalWorkouts = 5`);
  console.log(`  Workout history: 5 workouts`);
  console.log(`  Previously unlocked: ['first-workout']`);
  console.log(`  dedicated-5 in new achievements: ${hasDedicated5}`);
  console.log(`  first-workout in new achievements: ${hasFirstWorkout}`);
  
  const passed = hasDedicated5 === true && hasFirstWorkout === false;
  console.log(`  Expected: dedicated-5 SHOULD be returned, first-workout should NOT`);
  console.log(`  Result: ${passed ? '✓ PASS' : '✗ FAIL'}`);
}
console.log('');

// Test 11: 6th workout should not award 5th workout achievement again
console.log('Test 11: 6th workout should not re-award dedicated-5');
{
  const stats = createUserStats(6);
  const workoutHistory = Array(6).fill(null).map((_, i) => 
    createWorkout(new Date(Date.now() - i * 86400000))
  );
  const previouslyUnlocked = [];  // Simulating out-of-sync storage
  
  const newAchievements = getNewlyUnlockedAchievements(stats, workoutHistory, previouslyUnlocked);
  const hasDedicated5 = newAchievements.some(a => a.id === 'dedicated-5');
  const hasFirstWorkout = newAchievements.some(a => a.id === 'first-workout');
  
  console.log(`  Stats: totalWorkouts = 6`);
  console.log(`  Workout history: 6 workouts`);
  console.log(`  Previously unlocked: [] (out of sync)`);
  console.log(`  dedicated-5 in new achievements: ${hasDedicated5}`);
  console.log(`  first-workout in new achievements: ${hasFirstWorkout}`);
  
  const passed = hasDedicated5 === false && hasFirstWorkout === false;
  console.log(`  Expected: Neither should be returned (both were already earned before this workout)`);
  console.log(`  Result: ${passed ? '✓ PASS' : '✗ FAIL'}`);
}
console.log('');

console.log('=== Tests Complete ===');
