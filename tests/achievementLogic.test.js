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

// Constants
const DAY_IN_MS = 86400000; // Milliseconds in a day

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

// Helper function to create a workout history with a given number of workouts
const createWorkoutHistory = (count) => 
  Array(count).fill(null).map((_, i) => 
    createWorkout(new Date(Date.now() - i * DAY_IN_MS))
  );

// Test 1: First workout achievement is unlocked after first workout
console.log('Test 1: First workout achievement is unlocked after first workout');
{
  const stats = createUserStats(1);
  const workoutHistory = [createWorkout()];
  const previouslyUnlocked = [];
  
  const newAchievements = getNewlyUnlockedAchievements(stats, workoutHistory, previouslyUnlocked);
  const firstWorkout = newAchievements.find(a => a.id === 'first-session');
  
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
  const workoutHistory = [createWorkout(), createWorkout(new Date(Date.now() - DAY_IN_MS))];
  const previouslyUnlocked = ['first-session']; // Already unlocked
  
  const newAchievements = getNewlyUnlockedAchievements(stats, workoutHistory, previouslyUnlocked);
  const firstWorkout = newAchievements.find(a => a.id === 'first-session');
  
  const passed = firstWorkout === undefined;
  console.log(`  Stats: totalWorkouts = 2`);
  console.log(`  Previously unlocked: ['first-session']`);
  console.log(`  Expected: first-workout to NOT be in newAchievements`);
  console.log(`  Got: ${firstWorkout ? 'first-workout FOUND (BUG!)' : 'first-workout correctly excluded'} ${passed ? '✓' : '✗ FAIL'}`);
}
console.log('');

// Test 3: Check if isAchievementUnlocked works correctly
console.log('Test 3: isAchievementUnlocked correctly identifies unlocked achievements');
{
  const stats = createUserStats(1);
  const workoutHistory = [createWorkout()];
  const firstWorkoutAchievement = ACHIEVEMENT_BADGES.find(a => a.id === 'first-session');
  
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
  const firstWorkoutAchievement = ACHIEVEMENT_BADGES.find(a => a.id === 'first-session');
  
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
  const workoutHistory = createWorkoutHistory(5);
  const previouslyUnlocked = [];
  
  const newAchievements = getNewlyUnlockedAchievements(stats, workoutHistory, previouslyUnlocked);
  
  const hasFirstWorkout = newAchievements.some(a => a.id === 'first-session');
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
    createWorkout(new Date(Date.now() - DAY_IN_MS))
  ];
  // This should be saved from the first workout
  const previouslyUnlocked = ['first-session'];
  
  const newAchievements = getNewlyUnlockedAchievements(stats, workoutHistory, previouslyUnlocked);
  
  console.log(`  Stats: totalWorkouts = 2`);
  console.log(`  Workout history: 2 workouts`);
  console.log(`  Previously unlocked: ['first-session']`);
  console.log(`  New achievements returned: ${JSON.stringify(newAchievements.map(a => a.id))}`);
  
  const hasFirstWorkout = newAchievements.some(a => a.id === 'first-session');
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
  const firstWorkoutFound = newAchievements1.some(a => a.id === 'first-session');
  
  console.log(`  First workout scenario:`);
  console.log(`  Stats after double-increment: totalWorkouts = ${statsAfterFirstWorkout.totalWorkouts}`);
  console.log(`  Workout history length: ${workoutHistory1.length}`);
  console.log(`  first-workout should still be found (stats >= 1): ${firstWorkoutFound ? '✓' : '✗'}`);
  
  // Second workout scenario:
  const statsAfterSecondWorkout = createUserStats(2);  // From getUserStats()
  statsAfterSecondWorkout.totalWorkouts += 1;  // App.jsx line 564 (now it's 3!)
  
  const workoutHistory2 = [createWorkout(), createWorkout(new Date(Date.now() - DAY_IN_MS))];
  const previouslyUnlocked2 = ['first-session'];  // Should be saved from first workout
  
  const newAchievements2 = getNewlyUnlockedAchievements(statsAfterSecondWorkout, workoutHistory2, previouslyUnlocked2);
  const firstWorkoutNotFound = !newAchievements2.some(a => a.id === 'first-session');
  
  console.log(`  Second workout scenario:`);
  console.log(`  Stats after double-increment: totalWorkouts = ${statsAfterSecondWorkout.totalWorkouts}`);
  console.log(`  Previously unlocked: ['first-session']`);
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
  const workoutHistory = [createWorkout(), createWorkout(new Date(Date.now() - DAY_IN_MS))];
  const previouslyUnlocked = [];  // Empty, but there are 2 workouts, so first-workout was already earned
  
  const newAchievements = getNewlyUnlockedAchievements(stats, workoutHistory, previouslyUnlocked);
  const hasFirstWorkout = newAchievements.some(a => a.id === 'first-session');
  
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
  const hasFirstWorkout = newAchievements.some(a => a.id === 'first-session');
  
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
  const workoutHistory = createWorkoutHistory(5);
  const previouslyUnlocked = ['first-session']; // Already got first-workout
  
  const newAchievements = getNewlyUnlockedAchievements(stats, workoutHistory, previouslyUnlocked);
  const hasDedicated5 = newAchievements.some(a => a.id === 'dedicated-5');
  const hasFirstWorkout = newAchievements.some(a => a.id === 'first-session');
  
  console.log(`  Stats: totalWorkouts = 5`);
  console.log(`  Workout history: 5 workouts`);
  console.log(`  Previously unlocked: ['first-session']`);
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
  const workoutHistory = createWorkoutHistory(6);
  const previouslyUnlocked = [];  // Simulating out-of-sync storage
  
  const newAchievements = getNewlyUnlockedAchievements(stats, workoutHistory, previouslyUnlocked);
  const hasDedicated5 = newAchievements.some(a => a.id === 'dedicated-5');
  const hasFirstWorkout = newAchievements.some(a => a.id === 'first-session');
  
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

// === NEW ACHIEVEMENT TESTS ===
console.log('=== New Achievement Type Tests ===\n');

// Helper function to create a workout with a specific type
const createTypedWorkout = (type, date = new Date()) => ({
  date: date.toISOString(),
  type: type,
  exercises: type === 'strength' ? { 'Bench Press': { sets: [{ weight: 100, reps: 10 }] } } : {},
  duration: 3600,
});

// Test 12: Strength workout count achievement
console.log('Test 12: Strength workout count achievement - 10 strength workouts');
{
  const stats = createUserStats(10);
  const workoutHistory = Array(10).fill(null).map((_, i) => 
    createTypedWorkout('full', new Date(Date.now() - i * DAY_IN_MS))
  );
  
  const strengthAchievement = ACHIEVEMENT_BADGES.find(a => a.id === 'strength-10');
  const isUnlocked = isAchievementUnlocked(strengthAchievement, stats, workoutHistory);
  
  const passed = isUnlocked === true;
  console.log(`  Workout history: 10 strength workouts (type: 'full')`);
  console.log(`  Expected: strength-10 should be unlocked`);
  console.log(`  Got: ${isUnlocked} ${passed ? '✓' : '✗ FAIL'}`);
}
console.log('');

// Test 13: Cardio workout count achievement
console.log('Test 13: Cardio workout count achievement - 10 cardio workouts');
{
  const stats = createUserStats(10);
  const workoutHistory = Array(10).fill(null).map((_, i) => 
    createTypedWorkout('cardio', new Date(Date.now() - i * DAY_IN_MS))
  );
  
  const cardioAchievement = ACHIEVEMENT_BADGES.find(a => a.id === 'cardio-10');
  const isUnlocked = isAchievementUnlocked(cardioAchievement, stats, workoutHistory);
  
  const passed = isUnlocked === true;
  console.log(`  Workout history: 10 cardio workouts`);
  console.log(`  Expected: cardio-10 should be unlocked`);
  console.log(`  Got: ${isUnlocked} ${passed ? '✓' : '✗ FAIL'}`);
}
console.log('');

// Test 14: Yoga workout count achievement
console.log('Test 14: Yoga workout count achievement - 10 yoga workouts');
{
  const stats = createUserStats(10);
  const workoutHistory = Array(10).fill(null).map((_, i) => 
    createTypedWorkout('yoga', new Date(Date.now() - i * DAY_IN_MS))
  );
  
  const yogaAchievement = ACHIEVEMENT_BADGES.find(a => a.id === 'yoga-10');
  const isUnlocked = isAchievementUnlocked(yogaAchievement, stats, workoutHistory);
  
  const passed = isUnlocked === true;
  console.log(`  Workout history: 10 yoga workouts`);
  console.log(`  Expected: yoga-10 should be unlocked`);
  console.log(`  Got: ${isUnlocked} ${passed ? '✓' : '✗ FAIL'}`);
}
console.log('');

// Test 15: Mixed workout types - only strength count for strength achievements
console.log('Test 15: Mixed workout types - only strength workouts count for strength achievements');
{
  const stats = createUserStats(15);
  // 5 strength + 5 cardio + 5 yoga = 15 total, but only 5 strength
  const workoutHistory = [
    ...Array(5).fill(null).map((_, i) => createTypedWorkout('upper', new Date(Date.now() - i * DAY_IN_MS))),
    ...Array(5).fill(null).map((_, i) => createTypedWorkout('cardio', new Date(Date.now() - (5 + i) * DAY_IN_MS))),
    ...Array(5).fill(null).map((_, i) => createTypedWorkout('yoga', new Date(Date.now() - (10 + i) * DAY_IN_MS))),
  ];
  
  const strengthAchievement = ACHIEVEMENT_BADGES.find(a => a.id === 'strength-10');
  const isUnlocked = isAchievementUnlocked(strengthAchievement, stats, workoutHistory);
  
  const passed = isUnlocked === false;
  console.log(`  Workout history: 5 strength + 5 cardio + 5 yoga = 15 total`);
  console.log(`  Expected: strength-10 should NOT be unlocked (only 5 strength)`);
  console.log(`  Got: ${isUnlocked} ${passed ? '✓' : '✗ FAIL'}`);
}
console.log('');

// Test 16: Strength week streak - 1 week with 3+ strength workouts
console.log('Test 16: Strength week streak - 1 week with 3+ strength workouts');
{
  const stats = createUserStats(3);
  // 3 strength workouts in the same week (Mon, Wed, Fri)
  const monday = new Date();
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7)); // Get this Monday
  monday.setHours(10, 0, 0, 0);
  
  const wednesday = new Date(monday);
  wednesday.setDate(wednesday.getDate() + 2);
  
  const friday = new Date(monday);
  friday.setDate(friday.getDate() + 4);
  
  const workoutHistory = [
    createTypedWorkout('push', friday),
    createTypedWorkout('pull', wednesday),
    createTypedWorkout('legs', monday),
  ];
  
  const streakAchievement = ACHIEVEMENT_BADGES.find(a => a.id === 'strength-week-1');
  const isUnlocked = isAchievementUnlocked(streakAchievement, stats, workoutHistory);
  
  const passed = isUnlocked === true;
  console.log(`  Workout history: 3 strength workouts in same week (Mon, Wed, Fri)`);
  console.log(`  Expected: strength-week-1 should be unlocked`);
  console.log(`  Got: ${isUnlocked} ${passed ? '✓' : '✗ FAIL'}`);
}
console.log('');

// Test 17: Strength week streak - only 2 workouts in a week (not enough)
console.log('Test 17: Strength week streak - only 2 workouts in a week (not enough)');
{
  const stats = createUserStats(2);
  const monday = new Date();
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
  monday.setHours(10, 0, 0, 0);
  
  const wednesday = new Date(monday);
  wednesday.setDate(wednesday.getDate() + 2);
  
  const workoutHistory = [
    createTypedWorkout('push', wednesday),
    createTypedWorkout('pull', monday),
  ];
  
  const streakAchievement = ACHIEVEMENT_BADGES.find(a => a.id === 'strength-week-1');
  const isUnlocked = isAchievementUnlocked(streakAchievement, stats, workoutHistory);
  
  const passed = isUnlocked === false;
  console.log(`  Workout history: 2 strength workouts in same week (Mon, Wed)`);
  console.log(`  Expected: strength-week-1 should NOT be unlocked (need 3+)`);
  console.log(`  Got: ${isUnlocked} ${passed ? '✓' : '✗ FAIL'}`);
}
console.log('');

// Test 18: Strength week streak - 3 consecutive weeks
console.log('Test 18: Strength week streak - 3 consecutive weeks with 3+ strength workouts');
{
  const stats = createUserStats(9);
  
  // Create 3 workouts per week for 3 consecutive weeks
  // Explicitly use Monday-aligned weeks to ensure consistency
  const workoutHistory = [];
  
  // Get a reference Monday (this week's Monday)
  const today = new Date();
  const dayOfWeek = today.getDay();
  const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const thisMonday = new Date(today);
  thisMonday.setDate(today.getDate() - daysToMonday);
  thisMonday.setHours(10, 0, 0, 0);
  
  // Create 3 workouts for each of the last 3 weeks (Mon, Wed, Fri of each week)
  for (let week = 0; week < 3; week++) {
    const weekMonday = new Date(thisMonday);
    weekMonday.setDate(thisMonday.getDate() - (week * 7));
    
    // Monday workout
    workoutHistory.push(createTypedWorkout('push', new Date(weekMonday)));
    
    // Wednesday workout
    const wed = new Date(weekMonday);
    wed.setDate(weekMonday.getDate() + 2);
    workoutHistory.push(createTypedWorkout('pull', wed));
    
    // Friday workout
    const fri = new Date(weekMonday);
    fri.setDate(weekMonday.getDate() + 4);
    workoutHistory.push(createTypedWorkout('legs', fri));
  }
  
  const streakAchievement = ACHIEVEMENT_BADGES.find(a => a.id === 'strength-week-3');
  const isUnlocked = isAchievementUnlocked(streakAchievement, stats, workoutHistory);
  
  const passed = isUnlocked === true;
  console.log(`  Workout history: 3 strength workouts per week for 3 weeks (Mon, Wed, Fri each week)`);
  console.log(`  Expected: strength-week-3 should be unlocked`);
  console.log(`  Got: ${isUnlocked} ${passed ? '✓' : '✗ FAIL'}`);
}
console.log('');

// Test 19: New achievements should NOT be awarded twice
console.log('Test 19: Strength-10 achievement should NOT be awarded twice');
{
  const stats = createUserStats(11);
  const workoutHistory = Array(11).fill(null).map((_, i) => 
    createTypedWorkout('push', new Date(Date.now() - i * DAY_IN_MS))
  );
  const previouslyUnlocked = ['strength-10'];
  
  const newAchievements = getNewlyUnlockedAchievements(stats, workoutHistory, previouslyUnlocked);
  const hasStrength10 = newAchievements.some(a => a.id === 'strength-10');
  
  const passed = hasStrength10 === false;
  console.log(`  Workout history: 11 strength workouts`);
  console.log(`  Previously unlocked: ['strength-10']`);
  console.log(`  Expected: strength-10 should NOT be in newAchievements`);
  console.log(`  Got: ${hasStrength10 ? 'FOUND (BUG!)' : 'correctly excluded'} ${passed ? '✓' : '✗ FAIL'}`);
}
console.log('');

// Test 20: New achievements should be awarded when milestone is reached
console.log('Test 20: Strength-10 achievement should be awarded on 10th strength workout');
{
  const stats = createUserStats(10);
  const workoutHistory = Array(10).fill(null).map((_, i) => 
    createTypedWorkout('legs', new Date(Date.now() - i * DAY_IN_MS))
  );
  const previouslyUnlocked = [];
  
  const newAchievements = getNewlyUnlockedAchievements(stats, workoutHistory, previouslyUnlocked);
  const hasStrength10 = newAchievements.some(a => a.id === 'strength-10');
  
  const passed = hasStrength10 === true;
  console.log(`  Workout history: 10 strength workouts`);
  console.log(`  Previously unlocked: []`);
  console.log(`  Expected: strength-10 SHOULD be in newAchievements`);
  console.log(`  Got: ${hasStrength10 ? 'found' : 'NOT found (BUG!)'} ${passed ? '✓' : '✗ FAIL'}`);
}
console.log('');

// Test 21: Fallback detection for strength achievements (previouslyUnlocked out of sync)
console.log('Test 21: 11th strength workout should NOT re-award strength-10 even if previouslyUnlocked is empty');
{
  const stats = createUserStats(11);
  const workoutHistory = Array(11).fill(null).map((_, i) => 
    createTypedWorkout('upper', new Date(Date.now() - i * DAY_IN_MS))
  );
  const previouslyUnlocked = []; // Out of sync
  
  const newAchievements = getNewlyUnlockedAchievements(stats, workoutHistory, previouslyUnlocked);
  const hasStrength10 = newAchievements.some(a => a.id === 'strength-10');
  
  const passed = hasStrength10 === false;
  console.log(`  Workout history: 11 strength workouts`);
  console.log(`  Previously unlocked: [] (out of sync)`);
  console.log(`  Expected: strength-10 should NOT be in newAchievements (was already earned before)`);
  console.log(`  Got: ${hasStrength10 ? 'FOUND (BUG!)' : 'correctly excluded'} ${passed ? '✓' : '✗ FAIL'}`);
}
console.log('');

console.log('=== Tests Complete ===');
