/**
 * Tests for Deload Streak Pause Logic
 * 
 * Tests that deload sessions pause the streak for the remainder of the week:
 * - When a deload session is logged in a week, the streak cannot extend past that day
 * - The streak resumes normally at the start of the next week (Sunday)
 * - The streak does not break, it just doesn't increment during the deload week
 */

import { calculateStreak } from '../src/utils/trackingMetrics.js';

// Helper function to create a workout session
const createSession = (date, type = 'strength', isDeload = false) => ({
  date: date.toISOString(),
  type,
  sessionType: type,
  isDeload,
  exercises: type !== 'rest' && type !== 'sick_day' ? { 'Bench Press': { sets: [{ weight: 100, reps: 10 }] } } : undefined,
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

console.log('=== Deload Streak Pause Tests ===\n');

// Test 1: Streak with no deload sessions - baseline test
console.log('Test 1: Two weeks of consecutive sessions (no deload) - baseline');
{
  const sunday = getSunday(new Date());
  sunday.setDate(sunday.getDate() - 14); // Two weeks ago Sunday
  const week1Dates = getWeekDates(sunday);
  const week2Sunday = new Date(sunday);
  week2Sunday.setDate(week2Sunday.getDate() + 7);
  const week2Dates = getWeekDates(week2Sunday);
  
  // All strength sessions, no deload
  const sessions = [
    ...week1Dates.map(d => createSession(d, 'strength', false)),
    ...week2Dates.map(d => createSession(d, 'strength', false)),
  ];
  
  const result = calculateStreak(sessions);
  
  const passed = result.longestStreak === 14;
  console.log(`  Sessions: 14 days, all strength, no deload`);
  console.log(`  Expected longestStreak: 14, Got: ${result.longestStreak} ${passed ? '✓' : '✗ FAIL'}`);
}
console.log('');

// Test 2: Deload on Tuesday - streak should stop at Monday (day before deload)
console.log('Test 2: Deload session on Tuesday - streak pauses for rest of week');
{
  const sunday = getSunday(new Date());
  sunday.setDate(sunday.getDate() - 7); // Last week's Sunday
  const weekDates = getWeekDates(sunday);
  
  // Tuesday (index 2) is a deload session
  const sessions = weekDates.map((d, i) => 
    createSession(d, 'strength', i === 2)
  );
  
  const result = calculateStreak(sessions);
  
  // Streak can only go up to Monday (day 1), cannot include Tuesday or beyond
  // Monday is the 2nd day of the week (Sunday=0, Monday=1)
  const passed = result.longestStreak === 2;
  console.log(`  Sessions: 7 days, Tuesday is deload`);
  console.log(`  Expected longestStreak: 2 (Sun-Mon only), Got: ${result.longestStreak} ${passed ? '✓' : '✗ FAIL'}`);
}
console.log('');

// Test 3: Deload on Sunday (first day) - entire week is paused
console.log('Test 3: Deload session on Sunday - entire week is paused');
{
  const sunday = getSunday(new Date());
  sunday.setDate(sunday.getDate() - 7); // Last week's Sunday
  const weekDates = getWeekDates(sunday);
  
  // Sunday (index 0) is a deload session
  const sessions = weekDates.map((d, i) => 
    createSession(d, 'strength', i === 0)
  );
  
  const result = calculateStreak(sessions);
  
  // Since deload is on Sunday, no days in this week can be part of the streak
  const passed = result.longestStreak === 0;
  console.log(`  Sessions: 7 days, Sunday is deload`);
  console.log(`  Expected longestStreak: 0 (entire week paused), Got: ${result.longestStreak} ${passed ? '✓' : '✗ FAIL'}`);
}
console.log('');

// Test 4: Deload on Saturday (last day) - streak can include Sun-Fri
console.log('Test 4: Deload session on Saturday - streak includes Sun-Fri');
{
  const sunday = getSunday(new Date());
  sunday.setDate(sunday.getDate() - 7); // Last week's Sunday
  const weekDates = getWeekDates(sunday);
  
  // Saturday (index 6) is a deload session
  const sessions = weekDates.map((d, i) => 
    createSession(d, 'strength', i === 6)
  );
  
  const result = calculateStreak(sessions);
  
  // Streak can include Sunday through Friday (6 days)
  const passed = result.longestStreak === 6;
  console.log(`  Sessions: 7 days, Saturday is deload`);
  console.log(`  Expected longestStreak: 6 (Sun-Fri), Got: ${result.longestStreak} ${passed ? '✓' : '✗ FAIL'}`);
}
console.log('');

// Test 5: Multi-week streak with deload in middle week
console.log('Test 5: Multi-week streak with deload in middle week');
{
  const sunday = getSunday(new Date());
  sunday.setDate(sunday.getDate() - 21); // Three weeks ago Sunday
  
  const week1Dates = getWeekDates(sunday);
  const week2Sunday = new Date(sunday);
  week2Sunday.setDate(week2Sunday.getDate() + 7);
  const week2Dates = getWeekDates(week2Sunday);
  const week3Sunday = new Date(sunday);
  week3Sunday.setDate(week3Sunday.getDate() + 14);
  const week3Dates = getWeekDates(week3Sunday);
  
  // Week 1: all strength, Week 2: deload on Tuesday, Week 3: all strength
  const sessions = [
    ...week1Dates.map(d => createSession(d, 'strength', false)),
    ...week2Dates.map((d, i) => createSession(d, 'strength', i === 2)), // Tuesday is deload
    ...week3Dates.map(d => createSession(d, 'strength', false)),
  ];
  
  const result = calculateStreak(sessions);
  
  // Longest streak should be Week 3 (7 days) since Week 2 has deload that breaks continuation
  // OR it could be Week 1 (7 days)
  // The streak from Week 1 cannot extend into Week 2 past the deload
  const passed = result.longestStreak === 9; // Week 1 (7) + Week 2 Sun-Mon (2)
  console.log(`  Sessions: Week 1 (7 strength), Week 2 (Tue deload), Week 3 (7 strength)`);
  console.log(`  Expected longestStreak: 9 (Week 1 + Week 2 Sun-Mon), Got: ${result.longestStreak} ${passed ? '✓' : '✗ FAIL'}`);
}
console.log('');

// Test 6: Current streak with deload session today
console.log('Test 6: Current streak with deload session logged today');
{
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const twoDaysAgo = new Date(today);
  twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
  
  const sessions = [
    createSession(twoDaysAgo, 'strength', false),
    createSession(yesterday, 'strength', false),
    createSession(today, 'strength', true), // Deload today
  ];
  
  const result = calculateStreak(sessions);
  
  // Current streak should be 2 (two days ago and yesterday)
  // Today's deload pauses the streak, so today doesn't count
  const passed = result.currentStreak === 2;
  console.log(`  Sessions: 2 days ago, yesterday (strength), today (deload)`);
  console.log(`  Expected currentStreak: 2 (today paused), Got: ${result.currentStreak} ${passed ? '✓' : '✗ FAIL'}`);
}
console.log('');

// Test 7: Deload week followed by normal week
console.log('Test 7: Deload week followed by normal week - streak resumes');
{
  const sunday = getSunday(new Date());
  sunday.setDate(sunday.getDate() - 14); // Two weeks ago Sunday
  
  const week1Dates = getWeekDates(sunday);
  const week2Sunday = new Date(sunday);
  week2Sunday.setDate(week2Sunday.getDate() + 7);
  const week2Dates = getWeekDates(week2Sunday);
  
  // Week 1: deload on Monday, Week 2: all normal strength
  const sessions = [
    ...week1Dates.map((d, i) => createSession(d, 'strength', i === 1)), // Monday deload
    ...week2Dates.map(d => createSession(d, 'strength', false)),
  ];
  
  const result = calculateStreak(sessions);
  
  // Week 2 should have a 7-day streak (deload was in previous week)
  const passed = result.longestStreak === 7;
  console.log(`  Sessions: Week 1 (Mon deload), Week 2 (7 strength)`);
  console.log(`  Expected longestStreak: 7 (Week 2 resumes), Got: ${result.longestStreak} ${passed ? '✓' : '✗ FAIL'}`);
}
console.log('');

// Test 8: Multiple deload sessions in same week
console.log('Test 8: Multiple deload sessions in same week (Tuesday and Thursday)');
{
  const sunday = getSunday(new Date());
  sunday.setDate(sunday.getDate() - 7); // Last week's Sunday
  const weekDates = getWeekDates(sunday);
  
  // Tuesday and Thursday are deload sessions
  const sessions = weekDates.map((d, i) => 
    createSession(d, 'strength', i === 2 || i === 4)
  );
  
  const result = calculateStreak(sessions);
  
  // Streak pauses at first deload (Tuesday), so only Sun-Mon count
  const passed = result.longestStreak === 2;
  console.log(`  Sessions: 7 days, Tuesday and Thursday are deload`);
  console.log(`  Expected longestStreak: 2 (Sun-Mon, paused from Tue), Got: ${result.longestStreak} ${passed ? '✓' : '✗ FAIL'}`);
}
console.log('');

// Test 9: Deload on the boundary between weeks (Saturday and Sunday)
console.log('Test 9: Deload on Saturday does not affect next week');
{
  const sunday = getSunday(new Date());
  sunday.setDate(sunday.getDate() - 14); // Two weeks ago Sunday
  
  const week1Dates = getWeekDates(sunday);
  const week2Sunday = new Date(sunday);
  week2Sunday.setDate(week2Sunday.getDate() + 7);
  const week2Dates = getWeekDates(week2Sunday);
  
  // Week 1: deload on Saturday, Week 2: all normal
  const sessions = [
    ...week1Dates.map((d, i) => createSession(d, 'strength', i === 6)), // Saturday deload
    ...week2Dates.map(d => createSession(d, 'strength', false)),
  ];
  
  const result = calculateStreak(sessions);
  
  // Week 2 should have a 7-day streak (deload was at end of previous week)
  const passed = result.longestStreak === 7;
  console.log(`  Sessions: Week 1 (Sat deload), Week 2 (7 strength)`);
  console.log(`  Expected longestStreak: 7 (Week 2 not affected), Got: ${result.longestStreak} ${passed ? '✓' : '✗ FAIL'}`);
}
console.log('');

// Test 10: Edge case - deload session with 1 skip day in same week
console.log('Test 10: Deload on Tuesday, unlogged Wednesday - week still paused from Tuesday');
{
  const sunday = getSunday(new Date());
  sunday.setDate(sunday.getDate() - 7); // Last week's Sunday
  const weekDates = getWeekDates(sunday);
  
  // Tuesday is deload, Wednesday is unlogged (no session)
  const sessions = weekDates
    .filter((_, i) => i !== 3) // Skip Wednesday
    .map((d, originalIndex) => {
      // Map back to original index
      const i = originalIndex < 3 ? originalIndex : originalIndex + 1;
      return createSession(d, 'strength', i === 2); // Tuesday is deload
    });
  
  const result = calculateStreak(sessions);
  
  // Streak stops at Monday (day before deload)
  const passed = result.longestStreak === 2;
  console.log(`  Sessions: 6 days, Tuesday deload, Wednesday unlogged`);
  console.log(`  Expected longestStreak: 2 (Sun-Mon), Got: ${result.longestStreak} ${passed ? '✓' : '✗ FAIL'}`);
}
console.log('');

// Test 11: Verify streak number stays constant during deload week
console.log('Test 11: Streak of 33, deload on Tuesday, remains 33');
{
  // Create 33 days of consecutive workouts, then add a deload week
  const sessions = [];
  const today = new Date();
  
  // Add 33 days of history (going back 33 days)
  for (let i = 33; i >= 1; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    sessions.push(createSession(date, 'strength', false));
  }
  
  // Now add a deload today
  sessions.push(createSession(today, 'strength', true));
  
  const result = calculateStreak(sessions);
  
  // Current streak should be 33 (up to yesterday)
  const passed = result.currentStreak === 33;
  console.log(`  Sessions: 33 consecutive days, then deload today`);
  console.log(`  Expected currentStreak: 33 (paused by deload), Got: ${result.currentStreak} ${passed ? '✓' : '✗ FAIL'}`);
}
console.log('');

console.log('=== Deload Streak Pause Tests Complete ===');
