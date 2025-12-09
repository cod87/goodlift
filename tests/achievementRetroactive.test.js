/**
 * Tests for Retroactive Achievement Awarding
 * 
 * Tests the `forceRetroactive` parameter and ensures achievements can be
 * awarded retroactively when users have already passed milestones.
 */

import { 
  getNewlyUnlockedAchievements, 
  ACHIEVEMENT_BADGES 
} from '../src/data/achievements.js';

console.log('=== Retroactive Achievement Awarding Tests ===\n');

const DAY_IN_MS = 86400000;

// Helper to create stats
const createUserStats = (totalWorkouts = 0, currentStreak = 0, totalPRs = 0, totalVolume = 0) => ({
  totalWorkouts,
  currentStreak,
  longestStreak: currentStreak,
  totalPRs,
  totalVolume,
  totalTime: 0,
  completedWellnessTasks: 0,
});

// Helper to create workout
const createWorkout = (type = 'full', date = new Date()) => ({
  date: date.toISOString(),
  type: type,
  exercises: { 'Bench Press': { sets: [{ weight: 100, reps: 10 }] } },
  duration: 3600,
});

// Test 1: Retroactive awarding for workout counts
console.log('Test 1: Retroactive awarding - workout counts');
{
  const stats = createUserStats(25);
  const workoutHistory = Array(25).fill(null).map((_, i) => 
    createWorkout('full', new Date(Date.now() - i * DAY_IN_MS))
  );
  const previouslyUnlocked = [];
  
  // With forceRetroactive=true, should get ALL workout count achievements up to 25
  const newAchievements = getNewlyUnlockedAchievements(stats, workoutHistory, previouslyUnlocked, true);
  const workoutAchievements = newAchievements.filter(a => a.condition.type === 'sessionCount');
  
  const has1 = workoutAchievements.some(a => a.id === 'first-session');
  const has5 = workoutAchievements.some(a => a.id === 'dedicated-5');
  const has10 = workoutAchievements.some(a => a.id === 'dedicated-10');
  const has25 = workoutAchievements.some(a => a.id === 'dedicated-25');
  const has50 = workoutAchievements.some(a => a.id === 'dedicated-50');
  
  const passed = has1 && has5 && has10 && has25 && !has50;
  
  console.log(`  User has 25 workouts, forceRetroactive=true`);
  console.log(`  Expected: 1, 5, 10, 25 (not 50)`);
  console.log(`  Got: 1=${has1}, 5=${has5}, 10=${has10}, 25=${has25}, 50=${has50}`);
  console.log(`  Result: ${passed ? '✓ PASS' : '✗ FAIL'}`);
}
console.log('');

// Test 2: Retroactive awarding for streaks
console.log('Test 2: Retroactive awarding - streaks');
{
  const stats = createUserStats(25, 25);
  const workoutHistory = Array(25).fill(null).map((_, i) => 
    createWorkout('full', new Date(Date.now() - i * DAY_IN_MS))
  );
  const previouslyUnlocked = [];
  
  // With forceRetroactive=true, should get ALL streak achievements up to 25
  const newAchievements = getNewlyUnlockedAchievements(stats, workoutHistory, previouslyUnlocked, true);
  const streakAchievements = newAchievements.filter(a => a.condition.type === 'streak');
  
  const has3 = streakAchievements.some(a => a.id === 'streak-3');
  const has7 = streakAchievements.some(a => a.id === 'streak-7');
  const has14 = streakAchievements.some(a => a.id === 'streak-14');
  const has30 = streakAchievements.some(a => a.id === 'streak-30');
  
  const passed = has3 && has7 && has14 && !has30;
  
  console.log(`  User has 25-day streak, forceRetroactive=true`);
  console.log(`  Expected: 3, 7, 14 (not 30)`);
  console.log(`  Got: 3=${has3}, 7=${has7}, 14=${has14}, 30=${has30}`);
  console.log(`  Result: ${passed ? '✓ PASS' : '✗ FAIL'}`);
}
console.log('');

// Test 3: Retroactive with partial previouslyUnlocked
console.log('Test 3: Retroactive awarding - partial previouslyUnlocked');
{
  const stats = createUserStats(25, 25);
  const workoutHistory = Array(25).fill(null).map((_, i) => 
    createWorkout('full', new Date(Date.now() - i * DAY_IN_MS))
  );
  const previouslyUnlocked = ['first-session', 'dedicated-5', 'streak-3'];
  
  // Should get missing achievements: 10, 25 for workouts; 7, 14 for streaks
  const newAchievements = getNewlyUnlockedAchievements(stats, workoutHistory, previouslyUnlocked, true);
  const workoutAchievements = newAchievements.filter(a => a.condition.type === 'sessionCount');
  const streakAchievements = newAchievements.filter(a => a.condition.type === 'streak');
  
  const has1 = workoutAchievements.some(a => a.id === 'first-session');
  const has5 = workoutAchievements.some(a => a.id === 'dedicated-5');
  const has10 = workoutAchievements.some(a => a.id === 'dedicated-10');
  const has25 = workoutAchievements.some(a => a.id === 'dedicated-25');
  
  const hasStreak3 = streakAchievements.some(a => a.id === 'streak-3');
  const hasStreak7 = streakAchievements.some(a => a.id === 'streak-7');
  const hasStreak14 = streakAchievements.some(a => a.id === 'streak-14');
  
  const passed = !has1 && !has5 && has10 && has25 && !hasStreak3 && hasStreak7 && hasStreak14;
  
  console.log(`  User has 25 workouts & 25-day streak`);
  console.log(`  Previously unlocked: first-session, dedicated-5, streak-3`);
  console.log(`  Expected new workouts: 10, 25 (not 1, 5)`);
  console.log(`  Got: 1=${has1}, 5=${has5}, 10=${has10}, 25=${has25}`);
  console.log(`  Expected new streaks: 7, 14 (not 3)`);
  console.log(`  Got: 3=${hasStreak3}, 7=${hasStreak7}, 14=${hasStreak14}`);
  console.log(`  Result: ${passed ? '✓ PASS' : '✗ FAIL'}`);
}
console.log('');

// Test 4: Normal mode (forceRetroactive=false) - should only award just-crossed milestones
console.log('Test 4: Normal mode - only just-crossed milestones');
{
  const stats = createUserStats(10);
  const workoutHistory = Array(10).fill(null).map((_, i) => 
    createWorkout('full', new Date(Date.now() - i * DAY_IN_MS))
  );
  const previouslyUnlocked = ['first-session', 'dedicated-5'];
  
  // Without forceRetroactive, should only get dedicated-10 (just crossed from 9 to 10)
  const newAchievements = getNewlyUnlockedAchievements(stats, workoutHistory, previouslyUnlocked, false);
  const workoutAchievements = newAchievements.filter(a => a.condition.type === 'sessionCount');
  
  const has10 = workoutAchievements.some(a => a.id === 'dedicated-10');
  const has5 = workoutAchievements.some(a => a.id === 'dedicated-5');
  const has1 = workoutAchievements.some(a => a.id === 'first-session');
  
  const passed = has10 && !has5 && !has1;
  
  console.log(`  User completes 10th workout, forceRetroactive=false`);
  console.log(`  Previously unlocked: first-session, dedicated-5`);
  console.log(`  Expected: Only dedicated-10`);
  console.log(`  Got: 1=${has1}, 5=${has5}, 10=${has10}`);
  console.log(`  Result: ${passed ? '✓ PASS' : '✗ FAIL'}`);
}
console.log('');

// Test 5: Strength workout retroactive awarding
console.log('Test 5: Retroactive awarding - strength workouts');
{
  const stats = createUserStats(50);
  const workoutHistory = Array(50).fill(null).map((_, i) => 
    createWorkout('push', new Date(Date.now() - i * DAY_IN_MS))
  );
  const previouslyUnlocked = [];
  
  const newAchievements = getNewlyUnlockedAchievements(stats, workoutHistory, previouslyUnlocked, true);
  const strengthAchievements = newAchievements.filter(a => a.condition.type === 'strengthWorkoutCount');
  
  const has10 = strengthAchievements.some(a => a.id === 'strength-10');
  const has50 = strengthAchievements.some(a => a.id === 'strength-50');
  const has100 = strengthAchievements.some(a => a.id === 'strength-100');
  
  const passed = has10 && has50 && !has100;
  
  console.log(`  User has 50 strength workouts, forceRetroactive=true`);
  console.log(`  Expected: 10, 50 (not 100)`);
  console.log(`  Got: 10=${has10}, 50=${has50}, 100=${has100}`);
  console.log(`  Result: ${passed ? '✓ PASS' : '✗ FAIL'}`);
}
console.log('');

console.log('=== Tests Complete ===');
