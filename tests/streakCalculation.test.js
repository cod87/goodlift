/**
 * Tests for Streak Calculation
 * 
 * Tests the new streak logic where:
 * - For any given standard week block (Sunday through Saturday), users are allowed only ONE day 
 *   that counts as either an "unlocked day" (no session logged) or a "rest day" (session with type 'rest')
 *   without breaking their consecutive days streak.
 * - If a user does not log any session for TWO days in the same week block, the streak breaks.
 * - If a user logs a rest day AND has an unlocked day in the same week block, the streak breaks.
 */

import { calculateStreak } from '../src/utils/trackingMetrics.js';

// Helper function to create a workout session
const createSession = (date, type = 'strength') => ({
  date: date.toISOString(),
  type,
  exercises: type !== 'rest' ? { 'Bench Press': { sets: [{ weight: 100, reps: 10 }] } } : undefined,
});

// Helper function to get the Sunday of a week for a given date
const getSunday = (date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay();
  d.setDate(d.getDate() - day);
  return d;
};

// Helper to create dates for a specific week starting from Sunday
const getWeekDates = (startSunday) => {
  const dates = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(startSunday);
    d.setDate(d.getDate() + i);
    dates.push(d);
  }
  return dates;
};

console.log('=== Streak Calculation Tests ===\n');

// Test 1: Consecutive days with no skip days - should work
console.log('Test 1: All 7 days of a week with sessions (no skip days)');
{
  const sunday = getSunday(new Date());
  sunday.setDate(sunday.getDate() - 7); // Last week's Sunday
  const weekDates = getWeekDates(sunday);
  
  const sessions = weekDates.map(d => createSession(d, 'strength'));
  const result = calculateStreak(sessions);
  
  const passed = result.longestStreak === 7;
  console.log(`  Sessions: 7 days, all strength`);
  console.log(`  Expected longestStreak: 7, Got: ${result.longestStreak} ${passed ? '✓' : '✗ FAIL'}`);
}
console.log('');

// Test 2: Week with 1 unlocked day (no session) - should work (streak continues)
console.log('Test 2: Week with 1 unlocked day (no session logged on Wednesday)');
{
  const sunday = getSunday(new Date());
  sunday.setDate(sunday.getDate() - 7); // Last week's Sunday
  const weekDates = getWeekDates(sunday);
  
  // Skip Wednesday (index 3)
  const sessions = weekDates
    .filter((_, i) => i !== 3)
    .map(d => createSession(d, 'strength'));
  
  const result = calculateStreak(sessions);
  
  // With 1 skip day in the week, streak should be 7 (including the skipped day)
  const passed = result.longestStreak === 7;
  console.log(`  Sessions: 6 days, Wednesday unlocked`);
  console.log(`  Expected longestStreak: 7, Got: ${result.longestStreak} ${passed ? '✓' : '✗ FAIL'}`);
}
console.log('');

// Test 3: Week with 1 rest day - should work (streak continues)
console.log('Test 3: Week with 1 rest day (Wednesday is rest session)');
{
  const sunday = getSunday(new Date());
  sunday.setDate(sunday.getDate() - 7); // Last week's Sunday
  const weekDates = getWeekDates(sunday);
  
  // Wednesday is rest day
  const sessions = weekDates.map((d, i) => 
    createSession(d, i === 3 ? 'rest' : 'strength')
  );
  
  const result = calculateStreak(sessions);
  
  // With 1 rest day in the week, streak should be 7
  const passed = result.longestStreak === 7;
  console.log(`  Sessions: 7 days, Wednesday is rest`);
  console.log(`  Expected longestStreak: 7, Got: ${result.longestStreak} ${passed ? '✓' : '✗ FAIL'}`);
}
console.log('');

// Test 4: Week with 2 unlocked days - streak should break
console.log('Test 4: Week with 2 unlocked days (no session on Wednesday AND Thursday)');
{
  const sunday = getSunday(new Date());
  sunday.setDate(sunday.getDate() - 7); // Last week's Sunday
  const weekDates = getWeekDates(sunday);
  
  // Skip Wednesday (index 3) and Thursday (index 4)
  const sessions = weekDates
    .filter((_, i) => i !== 3 && i !== 4)
    .map(d => createSession(d, 'strength'));
  
  const result = calculateStreak(sessions);
  
  // With 2 unlocked days in the week, streak should NOT be 7
  // The longest valid streak should be less than 7
  const passed = result.longestStreak < 7;
  console.log(`  Sessions: 5 days, Wednesday AND Thursday unlocked`);
  console.log(`  Expected longestStreak < 7, Got: ${result.longestStreak} ${passed ? '✓' : '✗ FAIL'}`);
}
console.log('');

// Test 5: Week with 1 rest day AND 1 unlocked day - streak should break
console.log('Test 5: Week with 1 rest day AND 1 unlocked day');
{
  const sunday = getSunday(new Date());
  sunday.setDate(sunday.getDate() - 7); // Last week's Sunday
  const weekDates = getWeekDates(sunday);
  
  // Wednesday is rest day, Thursday is unlocked (no session)
  const sessions = weekDates
    .filter((_, i) => i !== 4) // Skip Thursday
    .map((d, i) => createSession(d, i === 3 ? 'rest' : 'strength'));
  
  const result = calculateStreak(sessions);
  
  // With 1 rest day + 1 unlocked day in the week, streak should break
  const passed = result.longestStreak < 7;
  console.log(`  Sessions: 6 days, Wednesday is rest, Thursday unlocked`);
  console.log(`  Expected longestStreak < 7, Got: ${result.longestStreak} ${passed ? '✓' : '✗ FAIL'}`);
}
console.log('');

// Test 6: Week with 2 rest days - streak should break
console.log('Test 6: Week with 2 rest days');
{
  const sunday = getSunday(new Date());
  sunday.setDate(sunday.getDate() - 7); // Last week's Sunday
  const weekDates = getWeekDates(sunday);
  
  // Wednesday and Thursday are rest days
  const sessions = weekDates.map((d, i) => 
    createSession(d, (i === 3 || i === 4) ? 'rest' : 'strength')
  );
  
  const result = calculateStreak(sessions);
  
  // With 2 rest days in the week, streak should break
  const passed = result.longestStreak < 7;
  console.log(`  Sessions: 7 days, Wednesday AND Thursday are rest`);
  console.log(`  Expected longestStreak < 7, Got: ${result.longestStreak} ${passed ? '✓' : '✗ FAIL'}`);
}
console.log('');

// Test 7: Two consecutive weeks, each with 1 skip day - should work
console.log('Test 7: Two consecutive weeks, each with 1 skip day (allowed)');
{
  const sunday = getSunday(new Date());
  sunday.setDate(sunday.getDate() - 14); // Two weeks ago Sunday
  const week1Dates = getWeekDates(sunday);
  const week2Sunday = new Date(sunday);
  week2Sunday.setDate(week2Sunday.getDate() + 7);
  const week2Dates = getWeekDates(week2Sunday);
  
  // Week 1: Skip Wednesday
  // Week 2: Skip Wednesday
  const sessions = [
    ...week1Dates.filter((_, i) => i !== 3).map(d => createSession(d, 'strength')),
    ...week2Dates.filter((_, i) => i !== 3).map(d => createSession(d, 'strength')),
  ];
  
  const result = calculateStreak(sessions);
  
  // Each week has only 1 skip day, so 14-day streak should be valid
  const passed = result.longestStreak === 14;
  console.log(`  Sessions: 12 days over 2 weeks, each week has 1 unlocked day`);
  console.log(`  Expected longestStreak: 14, Got: ${result.longestStreak} ${passed ? '✓' : '✗ FAIL'}`);
}
console.log('');

// Test 8: Empty workout history
console.log('Test 8: Empty workout history');
{
  const result = calculateStreak([]);
  const passed = result.currentStreak === 0 && result.longestStreak === 0;
  console.log(`  Sessions: none`);
  console.log(`  Expected currentStreak: 0, longestStreak: 0`);
  console.log(`  Got currentStreak: ${result.currentStreak}, longestStreak: ${result.longestStreak} ${passed ? '✓' : '✗ FAIL'}`);
}
console.log('');

// Test 9: Single session today
console.log('Test 9: Single session today');
{
  const today = new Date();
  const sessions = [createSession(today, 'strength')];
  const result = calculateStreak(sessions);
  
  const passed = result.currentStreak === 1 && result.longestStreak === 1;
  console.log(`  Sessions: 1 (today)`);
  console.log(`  Expected currentStreak: 1, longestStreak: 1`);
  console.log(`  Got currentStreak: ${result.currentStreak}, longestStreak: ${result.longestStreak} ${passed ? '✓' : '✗ FAIL'}`);
}
console.log('');

// Test 10: Session yesterday and today
console.log('Test 10: Session yesterday and today');
{
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  const sessions = [
    createSession(yesterday, 'strength'),
    createSession(today, 'strength'),
  ];
  const result = calculateStreak(sessions);
  
  const passed = result.currentStreak === 2 && result.longestStreak === 2;
  console.log(`  Sessions: 2 (yesterday and today)`);
  console.log(`  Expected currentStreak: 2, longestStreak: 2`);
  console.log(`  Got currentStreak: ${result.currentStreak}, longestStreak: ${result.longestStreak} ${passed ? '✓' : '✗ FAIL'}`);
}
console.log('');

// Test 11: Last session was 2 days ago - current streak should be 0
console.log('Test 11: Last session was 2 days ago (beyond grace period)');
{
  const twoDaysAgo = new Date();
  twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
  
  const sessions = [createSession(twoDaysAgo, 'strength')];
  const result = calculateStreak(sessions);
  
  const passed = result.currentStreak === 0 && result.longestStreak === 1;
  console.log(`  Sessions: 1 (2 days ago)`);
  console.log(`  Expected currentStreak: 0, longestStreak: 1`);
  console.log(`  Got currentStreak: ${result.currentStreak}, longestStreak: ${result.longestStreak} ${passed ? '✓' : '✗ FAIL'}`);
}
console.log('');

console.log('=== Tests Complete ===');
