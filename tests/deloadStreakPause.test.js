/**
 * Tests for Deload Streak Pause Logic (REVISED)
 * 
 * Tests that deload sessions pause the streak and revert to Sunday's value:
 * - When a deload session is logged in a week, the streak reverts to the value it had at that week's Sunday
 * - The reversion is retroactive: sessions after Sunday but before deload don't count
 * - The streak remains paused (at Sunday's value) for the entire week regardless of other sessions
 * - No minimum requirements during the deload week
 * - The streak resumes normally at the start of the next week (Sunday)
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

// Test 2: Deload on Tuesday - streak reverts to Sunday only
console.log('Test 2: Deload session on Tuesday - streak reverts to Sunday value');
{
  const sunday = getSunday(new Date());
  sunday.setDate(sunday.getDate() - 7); // Last week's Sunday
  const weekDates = getWeekDates(sunday);
  
  // Tuesday (index 2) is a deload session
  const sessions = weekDates.map((d, i) => 
    createSession(d, 'strength', i === 2)
  );
  
  const result = calculateStreak(sessions);
  
  // NEW: Streak can only include Sunday (deload causes revert to Sunday's value)
  // Monday and beyond don't count even though sessions were logged
  const passed = result.longestStreak === 1;
  console.log(`  Sessions: 7 days, Tuesday is deload`);
  console.log(`  Expected longestStreak: 1 (Sunday only, Mon retroactively removed), Got: ${result.longestStreak} ${passed ? '✓' : '✗ FAIL'}`);
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

// Test 4: Deload on Saturday (last day) - streak reverts to Sunday only
console.log('Test 4: Deload session on Saturday - streak reverts to Sunday value');
{
  const sunday = getSunday(new Date());
  sunday.setDate(sunday.getDate() - 7); // Last week's Sunday
  const weekDates = getWeekDates(sunday);
  
  // Saturday (index 6) is a deload session
  const sessions = weekDates.map((d, i) => 
    createSession(d, 'strength', i === 6)
  );
  
  const result = calculateStreak(sessions);
  
  // NEW: Streak can only include Sunday (deload causes revert to Sunday's value)
  // Mon-Fri don't count even though sessions were logged
  const passed = result.longestStreak === 1;
  console.log(`  Sessions: 7 days, Saturday is deload`);
  console.log(`  Expected longestStreak: 1 (Sunday only, Mon-Fri retroactively removed), Got: ${result.longestStreak} ${passed ? '✓' : '✗ FAIL'}`);
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
  
  // NEW: Week 1 (7) + Week 2 Sunday (1) + Week 3 (7) = 15
  // Streak continues through deload week into next week
  const passed = result.longestStreak === 15; // Week 1 (7) + Week 2 Sun (1) + Week 3 (7)
  console.log(`  Sessions: Week 1 (7 strength), Week 2 (Tue deload), Week 3 (7 strength)`);
  console.log(`  Expected longestStreak: 15 (all weeks connected), Got: ${result.longestStreak} ${passed ? '✓' : '✗ FAIL'}`);
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
  
  // NEW: Week 1 Sunday (1) + Week 2 (7) = 8
  // Week 1 has deload on Monday, so only Sunday counts
  // Streak continues into Week 2
  const passed = result.longestStreak === 8;
  console.log(`  Sessions: Week 1 (Mon deload), Week 2 (7 strength)`);
  console.log(`  Expected longestStreak: 8 (Week 1 Sun + Week 2), Got: ${result.longestStreak} ${passed ? '✓' : '✗ FAIL'}`);
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
  
  // NEW: Streak pauses at Sunday, so only Sunday counts (Monday retroactively removed)
  // Multiple deloads in same week don't change the logic - still only Sunday counts
  const passed = result.longestStreak === 1;
  console.log(`  Sessions: 7 days, Tuesday and Thursday are deload`);
  console.log(`  Expected longestStreak: 1 (Sunday only), Got: ${result.longestStreak} ${passed ? '✓' : '✗ FAIL'}`);
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
  
  // NEW: Week 1 Sunday (1) + Week 2 (7) = 8
  // Week 1 has deload on Saturday, so only Sunday counts
  // Streak continues into Week 2
  const passed = result.longestStreak === 8;
  console.log(`  Sessions: Week 1 (Sat deload), Week 2 (7 strength)`);
  console.log(`  Expected longestStreak: 8 (Week 1 Sun + Week 2), Got: ${result.longestStreak} ${passed ? '✓' : '✗ FAIL'}`);
}
console.log('');

// Test 10: Edge case - deload session with 1 skip day in same week
console.log('Test 10: Deload on Tuesday, unlogged Wednesday - week still paused from Tuesday');
{
  const sunday = getSunday(new Date());
  sunday.setDate(sunday.getDate() - 7); // Last week's Sunday
  const weekDates = getWeekDates(sunday);
  
  // Create sessions for all days except Wednesday (index 3)
  // Tuesday (index 2) is deload
  const sessions = [];
  weekDates.forEach((date, index) => {
    if (index !== 3) { // Skip Wednesday
      const isDeload = (index === 2); // Tuesday is deload
      sessions.push(createSession(date, 'strength', isDeload));
    }
  });
  
  const result = calculateStreak(sessions);
  
  // NEW: Streak only includes Sunday (Monday retroactively removed due to deload)
  // The unlogged Wednesday doesn't matter in a deload week (no minimum requirements)
  const passed = result.longestStreak === 1;
  console.log(`  Sessions: 6 days, Tuesday deload, Wednesday unlogged`);
  console.log(`  Expected longestStreak: 1 (Sunday only), Got: ${result.longestStreak} ${passed ? '✓' : '✗ FAIL'}`);
}
console.log('');

// Test 11: Verify streak reverts to Sunday's value during deload week
console.log('Test 11: Streak of 33, deload today, reverts to Sunday value');
{
  // Create 33 days of consecutive workouts, then add a deload today
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
  
  // Current streak should be 33 (yesterday was last counted session)
  // Since today is deload and yesterday was likely Sunday or before, streak = 33
  const passed = result.currentStreak === 33;
  console.log(`  Sessions: 33 consecutive days, then deload today`);
  console.log(`  Expected currentStreak: 33 (reverted to Sunday value or before deload week), Got: ${result.currentStreak} ${passed ? '✓' : '✗ FAIL'}`);
}
console.log('');

// Test 12: Retroactive reversion - sessions Mon-Thu don't count when deload on Friday
console.log('Test 12: Deload on Friday - sessions Mon-Thu retroactively removed');
{
  const sunday = getSunday(new Date());
  sunday.setDate(sunday.getDate() - 7); // Last week's Sunday
  const weekDates = getWeekDates(sunday);
  
  // Friday (index 5) is a deload session, all other days have sessions
  const sessions = weekDates.map((d, i) => 
    createSession(d, 'strength', i === 5)
  );
  
  const result = calculateStreak(sessions);
  
  // NEW: Streak only includes Sunday (Mon-Thu retroactively removed)
  const passed = result.longestStreak === 1;
  console.log(`  Sessions: 7 days, Friday is deload`);
  console.log(`  Expected longestStreak: 1 (Sunday only, Mon-Thu removed), Got: ${result.longestStreak} ${passed ? '✓' : '✗ FAIL'}`);
}
console.log('');

// Test 13: No minimum requirements during deload week - only deload session logged
console.log('Test 13: Only deload session in week - streak remains active');
{
  const sunday = getSunday(new Date());
  sunday.setDate(sunday.getDate() - 14); // Two weeks ago Sunday
  
  const week1Dates = getWeekDates(sunday);
  const week2Sunday = new Date(sunday);
  week2Sunday.setDate(week2Sunday.getDate() + 7);
  const week2Dates = getWeekDates(week2Sunday);
  
  // Week 1: all strength sessions
  // Week 2: only deload on Wednesday (index 3), no other sessions
  const sessions = [
    ...week1Dates.map(d => createSession(d, 'strength', false)),
    createSession(week2Dates[3], 'strength', true), // Only Wednesday deload
  ];
  
  const result = calculateStreak(sessions);
  
  // NEW: Week 2 has only deload session, but streak doesn't break
  // Week 1 streak (7) continues, but Week 2 contributes 0 (no Sunday session)
  const passed = result.longestStreak === 7;
  console.log(`  Sessions: Week 1 (7 strength), Week 2 (only Wed deload)`);
  console.log(`  Expected longestStreak: 7 (Week 1 only, Week 2 has no Sunday), Got: ${result.longestStreak} ${passed ? '✓' : '✗ FAIL'}`);
}
console.log('');

// Test 14: Deload week with missing Sunday - streak can't include deload week
console.log('Test 14: Deload week without Sunday session');
{
  const sunday = getSunday(new Date());
  sunday.setDate(sunday.getDate() - 7); // Last week's Sunday
  const weekDates = getWeekDates(sunday);
  
  // No Sunday session, Monday has deload
  const sessions = [];
  weekDates.forEach((date, index) => {
    if (index !== 0) { // Skip Sunday (index 0)
      const isDeload = (index === 1); // Monday is deload
      sessions.push(createSession(date, 'strength', isDeload));
    }
  });
  
  const result = calculateStreak(sessions);
  
  // Deload week without Sunday session = no contribution to streak
  const passed = result.longestStreak === 0;
  console.log(`  Sessions: 6 days, no Sunday, Monday is deload`);
  console.log(`  Expected longestStreak: 0 (deload week has no Sunday), Got: ${result.longestStreak} ${passed ? '✓' : '✗ FAIL'}`);
}
console.log('');

// Test 15: Multi-week streak continues through deload week into next week
console.log('Test 15: Streak continues from deload week to next week');
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
  
  // Week 1: all strength
  // Week 2: Sunday + deload on Friday
  // Week 3: all strength
  const sessions = [
    ...week1Dates.map(d => createSession(d, 'strength', false)),
    createSession(week2Dates[0], 'strength', false), // Week 2 Sunday
    createSession(week2Dates[5], 'strength', true), // Week 2 Friday deload
    ...week3Dates.map(d => createSession(d, 'strength', false)),
  ];
  
  const result = calculateStreak(sessions);
  
  // Week 1 (7) + Week 2 (1 Sunday) + Week 3 (7) = 15
  const passed = result.longestStreak === 15;
  console.log(`  Sessions: Week 1 (7), Week 2 (Sun + Fri deload), Week 3 (7)`);
  console.log(`  Expected longestStreak: 15 (all three weeks connected), Got: ${result.longestStreak} ${passed ? '✓' : '✗ FAIL'}`);
}
console.log('');

console.log('=== Deload Streak Pause Tests Complete ===');
