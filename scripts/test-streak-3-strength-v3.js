#!/usr/bin/env node

/**
 * Test 3-strength-session requirement for complete weeks - V3 (CORRECT test data)
 */

import { calculateStreak } from '../src/utils/trackingMetrics.js';

console.log('=== Test 1: Complete week (Sun-Sat) with 3 strength ===');
const workouts1 = [
  // Complete week: Sun Nov 16 - Sat Nov 22
  { date: new Date('2025-11-16T12:00:00').toISOString(), type: 'strength', exercises: { 'Squat': { sets: [{ reps: 10, weight: 100 }] } } },
  { date: new Date('2025-11-17T12:00:00').toISOString(), type: 'cardio' },
  { date: new Date('2025-11-18T12:00:00').toISOString(), type: 'strength', exercises: { 'Bench': { sets: [{ reps: 10, weight: 100 }] } } },
  { date: new Date('2025-11-19T12:00:00').toISOString(), type: 'cardio' },
  { date: new Date('2025-11-20T12:00:00').toISOString(), type: 'strength', exercises: { 'Deadlift': { sets: [{ reps: 10, weight: 100 }] } } },
  { date: new Date('2025-11-21T12:00:00').toISOString(), type: 'cardio' },
  { date: new Date('2025-11-22T12:00:00').toISOString(), type: 'cardio' },
];

const result1 = calculateStreak(workouts1);
console.log('Result:', result1);
console.log('Expected: 7 days (complete week with 3 strength)');
console.log('Status:', result1.longestStreak === 7 ? '✓ PASS' : `✗ FAIL (got ${result1.longestStreak})`);
console.log('');

console.log('=== Test 2: Complete week with only 2 strength ===');
const workouts2 = [
  // Complete week: Sun Nov 16 - Sat Nov 22, only 2 strength
  { date: new Date('2025-11-16T12:00:00').toISOString(), type: 'strength', exercises: { 'Squat': { sets: [{ reps: 10, weight: 100 }] } } },
  { date: new Date('2025-11-17T12:00:00').toISOString(), type: 'cardio' },
  { date: new Date('2025-11-18T12:00:00').toISOString(), type: 'strength', exercises: { 'Bench': { sets: [{ reps: 10, weight: 100 }] } } },
  { date: new Date('2025-11-19T12:00:00').toISOString(), type: 'cardio' },
  { date: new Date('2025-11-20T12:00:00').toISOString(), type: 'cardio' },
  { date: new Date('2025-11-21T12:00:00').toISOString(), type: 'cardio' },
  { date: new Date('2025-11-22T12:00:00').toISOString(), type: 'cardio' },
];

const result2 = calculateStreak(workouts2);
console.log('Result:', result2);
console.log('Expected: 0 days (complete week needs 3, only has 2)');
console.log('Status:', result2.longestStreak === 0 ? '✓ PASS' : `✗ FAIL (got ${result2.longestStreak})`);
console.log('');

console.log('=== Test 3: Two complete weeks, second fails ===');
const workouts3 = [
  // Week 1: Sun Nov 9 - Sat Nov 15, with 3 strength
  { date: new Date('2025-11-09T12:00:00').toISOString(), type: 'strength', exercises: { 'Squat': { sets: [{ reps: 10, weight: 100 }] } } },
  { date: new Date('2025-11-10T12:00:00').toISOString(), type: 'cardio' },
  { date: new Date('2025-11-11T12:00:00').toISOString(), type: 'strength', exercises: { 'Bench': { sets: [{ reps: 10, weight: 100 }] } } },
  { date: new Date('2025-11-12T12:00:00').toISOString(), type: 'cardio' },
  { date: new Date('2025-11-13T12:00:00').toISOString(), type: 'strength', exercises: { 'Deadlift': { sets: [{ reps: 10, weight: 100 }] } } },
  { date: new Date('2025-11-14T12:00:00').toISOString(), type: 'cardio' },
  { date: new Date('2025-11-15T12:00:00').toISOString(), type: 'cardio' },
  // Week 2: Sun Nov 16 - Sat Nov 22, with only 2 strength
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
console.log('Expected: 7 days (Week 1 only, Week 2 fails)');
console.log('Status:', result3.longestStreak === 7 ? '✓ PASS' : `✗ FAIL (got ${result3.longestStreak})`);
console.log('');

console.log('=== Test 4: Incomplete week at start + complete week ===');
const workouts4 = [
  // Incomplete week: Wed Nov 12 - Sat Nov 15 (4 days, no strength required)
  { date: new Date('2025-11-12T12:00:00').toISOString(), type: 'cardio' },
  { date: new Date('2025-11-13T12:00:00').toISOString(), type: 'cardio' },
  { date: new Date('2025-11-14T12:00:00').toISOString(), type: 'cardio' },
  { date: new Date('2025-11-15T12:00:00').toISOString(), type: 'cardio' },
  // Complete week: Sun Nov 16 - Sat Nov 22, with 3 strength
  { date: new Date('2025-11-16T12:00:00').toISOString(), type: 'strength', exercises: { 'Squat': { sets: [{ reps: 10, weight: 100 }] } } },
  { date: new Date('2025-11-17T12:00:00').toISOString(), type: 'cardio' },
  { date: new Date('2025-11-18T12:00:00').toISOString(), type: 'strength', exercises: { 'Bench': { sets: [{ reps: 10, weight: 100 }] } } },
  { date: new Date('2025-11-19T12:00:00').toISOString(), type: 'cardio' },
  { date: new Date('2025-11-20T12:00:00').toISOString(), type: 'strength', exercises: { 'Deadlift': { sets: [{ reps: 10, weight: 100 }] } } },
  { date: new Date('2025-11-21T12:00:00').toISOString(), type: 'cardio' },
  { date: new Date('2025-11-22T12:00:00').toISOString(), type: 'cardio' },
];

const result4 = calculateStreak(workouts4);
console.log('Result:', result4);
console.log('Expected: 11 days (incomplete week + complete week with 3 strength)');
console.log('Status:', result4.longestStreak === 11 ? '✓ PASS' : `✗ FAIL (got ${result4.longestStreak})`);
console.log('');

console.log('=== Summary ===');
const tests = [result1, result2, result3, result4];
const expectedResults = [7, 0, 7, 11];
const passed = tests.filter((r, i) => r.longestStreak === expectedResults[i]).length;
console.log(`Passed: ${passed}/${tests.length}`);

