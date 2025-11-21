#!/usr/bin/env node

/**
 * Test 3-strength-session requirement for complete weeks
 */

import { calculateStreak } from '../src/utils/trackingMetrics.js';

console.log('=== Test 1: Incomplete week at start (no strength requirement) ===');
const workouts1 = [
  // Saturday only (incomplete week)
  { date: new Date('2025-11-15T12:00:00').toISOString(), type: 'cardio' },
  // Sunday-Thursday (incomplete week, 5 days)
  { date: new Date('2025-11-16T12:00:00').toISOString(), type: 'strength', exercises: { 'Squat': { sets: [{ reps: 10, weight: 100 }] } } },
  { date: new Date('2025-11-17T12:00:00').toISOString(), type: 'strength', exercises: { 'Bench': { sets: [{ reps: 10, weight: 100 }] } } },
  { date: new Date('2025-11-18T12:00:00').toISOString(), type: 'cardio' },
  { date: new Date('2025-11-19T12:00:00').toISOString(), type: 'cardio' },
  { date: new Date('2025-11-20T12:00:00').toISOString(), type: 'cardio' },
];

const result1 = calculateStreak(workouts1);
console.log('Result:', result1);
console.log('Expected: 6 days (incomplete weeks need no strength requirement)');
console.log('Status:', result1.longestStreak === 6 ? '✓ PASS' : `✗ FAIL (got ${result1.longestStreak})`);
console.log('');

console.log('=== Test 2: Complete week with 3+ strength sessions ===');
const workouts2 = [
  // Complete week (Sun-Sat) with 3 strength sessions
  { date: new Date('2025-11-16T12:00:00').toISOString(), type: 'strength', exercises: { 'Squat': { sets: [{ reps: 10, weight: 100 }] } } },
  { date: new Date('2025-11-17T12:00:00').toISOString(), type: 'cardio' },
  { date: new Date('2025-11-18T12:00:00').toISOString(), type: 'strength', exercises: { 'Bench': { sets: [{ reps: 10, weight: 100 }] } } },
  { date: new Date('2025-11-19T12:00:00').toISOString(), type: 'cardio' },
  { date: new Date('2025-11-20T12:00:00').toISOString(), type: 'strength', exercises: { 'Deadlift': { sets: [{ reps: 10, weight: 100 }] } } },
  { date: new Date('2025-11-21T12:00:00').toISOString(), type: 'cardio' },
  { date: new Date('2025-11-22T12:00:00').toISOString(), type: 'cardio' },
];

const result2 = calculateStreak(workouts2);
console.log('Result:', result2);
console.log('Expected: 7 days (complete week with exactly 3 strength sessions)');
console.log('Status:', result2.longestStreak === 7 ? '✓ PASS' : `✗ FAIL (got ${result2.longestStreak})`);
console.log('');

console.log('=== Test 3: Complete week with only 2 strength sessions (should fail) ===');
const workouts3 = [
  // Complete week (Sun-Sat) with only 2 strength sessions
  { date: new Date('2025-11-16T12:00:00').toISOString(), type: 'strength', exercises: { 'Squat': { sets: [{ reps: 10, weight: 100 }] } } },
  { date: new Date('2025-11-17T12:00:00').toISOString(), type: 'cardio' },
  { date: new Date('2025-11-18T12:00:00').toISOString(), type: 'strength', exercises: { 'Bench': { sets: [{ reps: 10, weight: 100 }] } } },
  { date: new Date('2025-11-19T12:00:00').toISOString(), type: 'cardio' },
  { date: new Date('2025-11-20T12:00:00').toISOString(), type: 'cardio' },
  { date: new Date('2025-11-21T12:00:00').toISOString(), type: 'cardio' },
  { date: new Date('2025-11-22T12:00:00').toISOString(), type: 'cardio' },
];

const result3 = calculateStreak(workouts3);
console.log('Result:', result3);
console.log('Expected: 0 days (complete week needs 3+ strength sessions, only has 2)');
console.log('Status:', result3.longestStreak === 0 ? '✓ PASS' : `✗ FAIL (got ${result3.longestStreak})`);
console.log('');

console.log('=== Test 4: Multiple complete weeks ===');
const workouts4 = [
  // Week 1 (Sun-Sat) with 3 strength
  { date: new Date('2025-11-10T12:00:00').toISOString(), type: 'strength', exercises: { 'Squat': { sets: [{ reps: 10, weight: 100 }] } } },
  { date: new Date('2025-11-11T12:00:00').toISOString(), type: 'cardio' },
  { date: new Date('2025-11-12T12:00:00').toISOString(), type: 'strength', exercises: { 'Bench': { sets: [{ reps: 10, weight: 100 }] } } },
  { date: new Date('2025-11-13T12:00:00').toISOString(), type: 'cardio' },
  { date: new Date('2025-11-14T12:00:00').toISOString(), type: 'strength', exercises: { 'Deadlift': { sets: [{ reps: 10, weight: 100 }] } } },
  { date: new Date('2025-11-15T12:00:00').toISOString(), type: 'cardio' },
  { date: new Date('2025-11-16T12:00:00').toISOString(), type: 'cardio' },
  // Week 2 (Sun-Sat) with 4 strength
  { date: new Date('2025-11-17T12:00:00').toISOString(), type: 'strength', exercises: { 'Squat': { sets: [{ reps: 10, weight: 100 }] } } },
  { date: new Date('2025-11-18T12:00:00').toISOString(), type: 'strength', exercises: { 'Bench': { sets: [{ reps: 10, weight: 100 }] } } },
  { date: new Date('2025-11-19T12:00:00').toISOString(), type: 'cardio' },
  { date: new Date('2025-11-20T12:00:00').toISOString(), type: 'strength', exercises: { 'Deadlift': { sets: [{ reps: 10, weight: 100 }] } } },
  { date: new Date('2025-11-21T12:00:00').toISOString(), type: 'strength', exercises: { 'Press': { sets: [{ reps: 10, weight: 100 }] } } },
  { date: new Date('2025-11-22T12:00:00').toISOString(), type: 'cardio' },
  { date: new Date('2025-11-23T12:00:00').toISOString(), type: 'cardio' },
];

const result4 = calculateStreak(workouts4);
console.log('Result:', result4);
console.log('Expected: 14 days (two complete weeks, each with 3+ strength)');
console.log('Status:', result4.longestStreak === 14 ? '✓ PASS' : `✗ FAIL (got ${result4.longestStreak})`);
console.log('');

console.log('=== Test 5: Incomplete start + complete week + incomplete end ===');
const workouts5 = [
  // Wed-Sat of Week 1 (incomplete, 4 days, only 1 strength)
  { date: new Date('2025-11-12T12:00:00').toISOString(), type: 'cardio' },
  { date: new Date('2025-11-13T12:00:00').toISOString(), type: 'strength', exercises: { 'Squat': { sets: [{ reps: 10, weight: 100 }] } } },
  { date: new Date('2025-11-14T12:00:00').toISOString(), type: 'cardio' },
  { date: new Date('2025-11-15T12:00:00').toISOString(), type: 'cardio' },
  // Week 2 (complete, Sun-Sat) with 3 strength
  { date: new Date('2025-11-16T12:00:00').toISOString(), type: 'strength', exercises: { 'Bench': { sets: [{ reps: 10, weight: 100 }] } } },
  { date: new Date('2025-11-17T12:00:00').toISOString(), type: 'cardio' },
  { date: new Date('2025-11-18T12:00:00').toISOString(), type: 'strength', exercises: { 'Deadlift': { sets: [{ reps: 10, weight: 100 }] } } },
  { date: new Date('2025-11-19T12:00:00').toISOString(), type: 'cardio' },
  { date: new Date('2025-11-20T12:00:00').toISOString(), type: 'strength', exercises: { 'Press': { sets: [{ reps: 10, weight: 100 }] } } },
  { date: new Date('2025-11-21T12:00:00').toISOString(), type: 'cardio' },
  { date: new Date('2025-11-22T12:00:00').toISOString(), type: 'cardio' },
  // Sun-Tue of Week 3 (incomplete, 3 days, no strength)
  { date: new Date('2025-11-23T12:00:00').toISOString(), type: 'cardio' },
  { date: new Date('2025-11-24T12:00:00').toISOString(), type: 'cardio' },
  { date: new Date('2025-11-25T12:00:00').toISOString(), type: 'cardio' },
];

const result5 = calculateStreak(workouts5);
console.log('Result:', result5);
console.log('Expected: 14 days (incomplete weeks exempt, complete week has 3 strength)');
console.log('Status:', result5.longestStreak === 14 ? '✓ PASS' : `✗ FAIL (got ${result5.longestStreak})`);
console.log('');

console.log('=== Test 6: Multiple strength sessions on same day ===');
const workouts6 = [
  // Complete week with 3 strength sessions, but 2 on the same day
  { date: new Date('2025-11-16T08:00:00').toISOString(), type: 'strength', exercises: { 'Squat': { sets: [{ reps: 10, weight: 100 }] } } },
  { date: new Date('2025-11-16T16:00:00').toISOString(), type: 'strength', exercises: { 'Bench': { sets: [{ reps: 10, weight: 100 }] } } }, // Same day
  { date: new Date('2025-11-17T12:00:00').toISOString(), type: 'cardio' },
  { date: new Date('2025-11-18T12:00:00').toISOString(), type: 'strength', exercises: { 'Deadlift': { sets: [{ reps: 10, weight: 100 }] } } },
  { date: new Date('2025-11-19T12:00:00').toISOString(), type: 'cardio' },
  { date: new Date('2025-11-20T12:00:00').toISOString(), type: 'cardio' },
  { date: new Date('2025-11-21T12:00:00').toISOString(), type: 'cardio' },
  { date: new Date('2025-11-22T12:00:00').toISOString(), type: 'cardio' },
];

const result6 = calculateStreak(workouts6);
console.log('Result:', result6);
console.log('Expected: 7 days (2 strength sessions on same day + 1 other = 3 total)');
console.log('Status:', result6.longestStreak === 7 ? '✓ PASS' : `✗ FAIL (got ${result6.longestStreak})`);
console.log('');

console.log('=== Summary ===');
const tests = [result1, result2, result3, result4, result5, result6];
const expectedResults = [6, 7, 0, 14, 14, 7];
const passed = tests.filter((r, i) => r.longestStreak === expectedResults[i]).length;
console.log(`Passed: ${passed}/${tests.length}`);

