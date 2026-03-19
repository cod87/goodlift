/**
 * Tests for Basic Streak Calculation
 *
 * Basic Streak Rules:
 * - A completed week (Sun–Sat) keeps the streak alive only if it has >= 3 strength sessions.
 * - The current (incomplete) week is always valid – it cannot "fail" yet.
 * - Only days with any workout (excluding rest/sick days) advance the streak counter.
 * - Rest days and sick days are ignored.
 */

import { calculateBasicStreak } from '../src/utils/trackingMetrics.js';

// Helper: create a workout session
const createSession = (date, type = 'strength') => ({
  date: date.toISOString(),
  type,
});

// Helper: get the Sunday of the week containing `date`
const getSunday = (date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - d.getDay());
  return d;
};

// Helper: add `n` days to a date (returns new Date)
const addDays = (date, n) => {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
};

// Sundays for reference weeks (going backwards from today)
const currentSunday = getSunday(new Date());
const prevSunday = addDays(currentSunday, -7);
const prev2Sunday = addDays(currentSunday, -14);
const prev3Sunday = addDays(currentSunday, -21);

let passed = 0;
let failed = 0;

function assert(label, condition) {
  if (condition) {
    console.log(`  ✓ ${label}`);
    passed++;
  } else {
    console.log(`  ✗ FAIL: ${label}`);
    failed++;
  }
}

console.log('=== Basic Streak Calculation Tests ===\n');

// ─── Test 1: Empty history ───────────────────────────────────────────────────
console.log('Test 1: Empty history → { currentStreak: 0, longestStreak: 0 }');
{
  const result = calculateBasicStreak([]);
  assert('currentStreak === 0', result.currentStreak === 0);
  assert('longestStreak === 0', result.longestStreak === 0);
}
console.log('');

// ─── Test 2: 3 strength sessions this week (current week) ───────────────────
console.log('Test 2: 3 strength sessions in current week → currentStreak = 3');
{
  const sessions = [
    createSession(addDays(currentSunday, 0), 'strength'), // Sun
    createSession(addDays(currentSunday, 2), 'strength'), // Tue
    createSession(addDays(currentSunday, 4), 'strength'), // Thu
  ];
  const result = calculateBasicStreak(sessions);
  assert('currentStreak === 3', result.currentStreak === 3);
  assert('longestStreak === 3', result.longestStreak === 3);
}
console.log('');

// ─── Test 3: 3 strength + 1 cardio this week → 4 workout days ───────────────
console.log('Test 3: 3 strength + 1 cardio in current week → currentStreak = 4');
{
  const sessions = [
    createSession(addDays(currentSunday, 0), 'strength'),
    createSession(addDays(currentSunday, 1), 'cardio'),
    createSession(addDays(currentSunday, 2), 'strength'),
    createSession(addDays(currentSunday, 4), 'strength'),
  ];
  const result = calculateBasicStreak(sessions);
  assert('currentStreak === 4', result.currentStreak === 4);
}
console.log('');

// ─── Test 4: Rest days do not advance the streak counter ─────────────────────
console.log('Test 4: 3 strength + 1 rest day → rest does NOT count (currentStreak = 3)');
{
  const sessions = [
    createSession(addDays(currentSunday, 0), 'strength'),
    createSession(addDays(currentSunday, 1), 'rest'),   // ignored
    createSession(addDays(currentSunday, 2), 'strength'),
    createSession(addDays(currentSunday, 4), 'strength'),
  ];
  const result = calculateBasicStreak(sessions);
  assert('currentStreak === 3', result.currentStreak === 3);
}
console.log('');

// ─── Test 5: Sick days do not advance the streak counter ─────────────────────
console.log('Test 5: 3 strength + 1 sick_day → sick day does NOT count (currentStreak = 3)');
{
  const sessions = [
    createSession(addDays(currentSunday, 0), 'strength'),
    createSession(addDays(currentSunday, 1), 'sick_day'), // ignored
    createSession(addDays(currentSunday, 2), 'strength'),
    createSession(addDays(currentSunday, 4), 'strength'),
  ];
  const result = calculateBasicStreak(sessions);
  assert('currentStreak === 3', result.currentStreak === 3);
}
console.log('');

// ─── Test 6: Previous week valid + current week → streak spans both ──────────
console.log('Test 6: Valid prev week (3 strength, 1 cardio = 4 days) + valid current week (3 strength = 3 days) → currentStreak = 7');
{
  const sessions = [
    // Previous week: Mon/Wed/Fri strength + Tue cardio = 4 workout days
    createSession(addDays(prevSunday, 1), 'strength'),
    createSession(addDays(prevSunday, 2), 'cardio'),
    createSession(addDays(prevSunday, 3), 'strength'),
    createSession(addDays(prevSunday, 5), 'strength'),
    // Current week: Sun/Tue/Thu strength = 3 workout days
    createSession(addDays(currentSunday, 0), 'strength'),
    createSession(addDays(currentSunday, 2), 'strength'),
    createSession(addDays(currentSunday, 4), 'strength'),
  ];
  const result = calculateBasicStreak(sessions);
  assert('currentStreak === 7', result.currentStreak === 7);
}
console.log('');

// ─── Test 7: Previous week invalid (only 2 strength) → streak resets ─────────
console.log('Test 7: Prev week has only 2 strength sessions → streak breaks; current week starts fresh');
{
  const sessions = [
    // Previous week: only 2 strength + 1 cardio (INVALID)
    createSession(addDays(prevSunday, 1), 'strength'),
    createSession(addDays(prevSunday, 3), 'cardio'),
    createSession(addDays(prevSunday, 5), 'strength'),
    // Current week: 3 strength (valid)
    createSession(addDays(currentSunday, 0), 'strength'),
    createSession(addDays(currentSunday, 2), 'strength'),
    createSession(addDays(currentSunday, 4), 'strength'),
  ];
  const result = calculateBasicStreak(sessions);
  assert('currentStreak === 3 (only current week)', result.currentStreak === 3);
}
console.log('');

// ─── Test 8: Three consecutive valid weeks ────────────────────────────────────
console.log('Test 8: 3 consecutive valid weeks (3+4+3 workout days) → currentStreak = 10');
{
  const sessions = [
    // 2 weeks ago: 3 strength = 3 workout days (valid)
    createSession(addDays(prev2Sunday, 1), 'strength'),
    createSession(addDays(prev2Sunday, 3), 'strength'),
    createSession(addDays(prev2Sunday, 5), 'strength'),
    // Last week: 3 strength + 1 yoga = 4 workout days (valid)
    createSession(addDays(prevSunday, 0), 'strength'),
    createSession(addDays(prevSunday, 2), 'strength'),
    createSession(addDays(prevSunday, 4), 'strength'),
    createSession(addDays(prevSunday, 6), 'yoga'),
    // Current week: 3 strength = 3 workout days
    createSession(addDays(currentSunday, 0), 'strength'),
    createSession(addDays(currentSunday, 2), 'strength'),
    createSession(addDays(currentSunday, 4), 'strength'),
  ];
  const result = calculateBasicStreak(sessions);
  assert('currentStreak === 10', result.currentStreak === 10);
}
console.log('');

// ─── Test 9: Streak is active even if no workouts yet this week (prev week valid) ─
console.log('Test 9: No workouts in current week but prev week was valid → streak still active');
{
  const sessions = [
    // Previous week: 4 strength = 4 workout days (valid)
    createSession(addDays(prevSunday, 1), 'strength'),
    createSession(addDays(prevSunday, 2), 'strength'),
    createSession(addDays(prevSunday, 4), 'strength'),
    createSession(addDays(prevSunday, 5), 'strength'),
  ];
  const result = calculateBasicStreak(sessions);
  // Streak is active (prev week valid, current week hasn't started / hasn't failed)
  // Current week has 0 workouts, prev week contributes 4
  assert('currentStreak === 4', result.currentStreak === 4);
  assert('longestStreak === 4', result.longestStreak === 4);
}
console.log('');

// ─── Test 10: Invalid prev week + no workouts this week → streak = 0 ─────────
console.log('Test 10: Prev week invalid (2 strength) + no workouts this week → currentStreak = 0');
{
  const sessions = [
    // Previous week: only 2 strength (INVALID)
    createSession(addDays(prevSunday, 1), 'strength'),
    createSession(addDays(prevSunday, 4), 'strength'),
  ];
  const result = calculateBasicStreak(sessions);
  assert('currentStreak === 0', result.currentStreak === 0);
}
console.log('');

// ─── Test 11: Gap week breaks the chain ──────────────────────────────────────
console.log('Test 11: Valid week 3 weeks ago, gap week 2 weeks ago (0 workouts), valid last week → chain broken');
{
  const sessions = [
    // 3 weeks ago: valid (3 strength)
    createSession(addDays(prev3Sunday, 1), 'strength'),
    createSession(addDays(prev3Sunday, 3), 'strength'),
    createSession(addDays(prev3Sunday, 5), 'strength'),
    // 2 weeks ago: EMPTY (0 sessions) → breaks chain
    // Last week: valid (3 strength)
    createSession(addDays(prevSunday, 1), 'strength'),
    createSession(addDays(prevSunday, 3), 'strength'),
    createSession(addDays(prevSunday, 5), 'strength'),
    // Current week: 1 strength (still in progress)
    createSession(addDays(currentSunday, 0), 'strength'),
  ];
  const result = calculateBasicStreak(sessions);
  // Chain: current (1) + prev (3) = 4; chain stops because 2-weeks-ago is empty
  assert('currentStreak === 4', result.currentStreak === 4);
  // longestStreak is max of all possible chains:
  // - from current: 4 (current + prev)
  // - from prev: 3 (just prev week, 2-weeks-ago is empty so chain stops)
  // - from 3-weeks-ago: 3 (chain starts and ends there)
  assert('longestStreak === 4', result.longestStreak === 4);
}
console.log('');

// ─── Test 12: longestStreak from historical data ─────────────────────────────
console.log('Test 12: Longest streak from a historical valid sequence (not connected to current)');
{
  const sessions = [
    // 3 weeks ago (start of longer streak): 5 workout days
    createSession(addDays(prev3Sunday, 0), 'strength'),
    createSession(addDays(prev3Sunday, 1), 'cardio'),
    createSession(addDays(prev3Sunday, 2), 'strength'),
    createSession(addDays(prev3Sunday, 4), 'strength'),
    createSession(addDays(prev3Sunday, 5), 'yoga'),
    // 2 weeks ago: 4 workout days (valid: 3 strength)
    createSession(addDays(prev2Sunday, 0), 'strength'),
    createSession(addDays(prev2Sunday, 2), 'strength'),
    createSession(addDays(prev2Sunday, 4), 'strength'),
    createSession(addDays(prev2Sunday, 6), 'cardio'),
    // Last week: INVALID (only 2 strength) → breaks chain
    createSession(addDays(prevSunday, 1), 'strength'),
    createSession(addDays(prevSunday, 4), 'strength'),
    // Current week: 3 strength (new, shorter streak)
    createSession(addDays(currentSunday, 0), 'strength'),
    createSession(addDays(currentSunday, 2), 'strength'),
    createSession(addDays(currentSunday, 4), 'strength'),
  ];
  const result = calculateBasicStreak(sessions);
  // Current streak = 3 (just this week; last week was invalid)
  assert('currentStreak === 3', result.currentStreak === 3);
  // Longest streak = 5 + 4 = 9 (3-weeks-ago + 2-weeks-ago)
  assert('longestStreak === 9', result.longestStreak === 9);
}
console.log('');

// ─── Summary ─────────────────────────────────────────────────────────────────
console.log(`=== Results: ${passed} passed, ${failed} failed ===`);
if (failed > 0) process.exit(1);
