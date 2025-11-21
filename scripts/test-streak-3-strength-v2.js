#!/usr/bin/env node

/**
 * Test 3-strength-session requirement for complete weeks - V2
 */

import { calculateStreak } from '../src/utils/trackingMetrics.js';

console.log('=== Test 3 REVISED: Complete week with only 2 strength (checking from future) ===');
// To truly test a "complete" week, we need to ensure the week is actually in the past
// Let's use Week of Nov 10-16 (past week)
const workouts3 = [
  { date: new Date('2025-11-10T12:00:00').toISOString(), type: 'strength', exercises: { 'Squat': { sets: [{ reps: 10, weight: 100 }] } } },
  { date: new Date('2025-11-11T12:00:00').toISOString(), type: 'cardio' },
  { date: new Date('2025-11-12T12:00:00').toISOString(), type: 'strength', exercises: { 'Bench': { sets: [{ reps: 10, weight: 100 }] } } },
  { date: new Date('2025-11-13T12:00:00').toISOString(), type: 'cardio' },
  { date: new Date('2025-11-14T12:00:00').toISOString(), type: 'cardio' },
  { date: new Date('2025-11-15T12:00:00').toISOString(), type: 'cardio' },
  { date: new Date('2025-11-16T12:00:00').toISOString(), type: 'cardio' },
];

const result3 = calculateStreak(workouts3);
console.log('Week: Nov 10-16 (Sun-Sat), complete week with only 2 strength');
console.log('Result:', result3);
console.log('Expected: 0 days (this past complete week failed the requirement)');
console.log('Status:', result3.longestStreak === 0 ? '✓ PASS' : `✗ FAIL (got ${result3.longestStreak})`);
console.log('');

console.log('=== Test 3B: Two complete weeks, second one fails ===');
const workouts3b = [
  // Week 1 (Nov 3-9): Complete with 3 strength
  { date: new Date('2025-11-03T12:00:00').toISOString(), type: 'strength', exercises: { 'Squat': { sets: [{ reps: 10, weight: 100 }] } } },
  { date: new Date('2025-11-04T12:00:00').toISOString(), type: 'cardio' },
  { date: new Date('2025-11-05T12:00:00').toISOString(), type: 'strength', exercises: { 'Bench': { sets: [{ reps: 10, weight: 100 }] } } },
  { date: new Date('2025-11-06T12:00:00').toISOString(), type: 'cardio' },
  { date: new Date('2025-11-07T12:00:00').toISOString(), type: 'strength', exercises: { 'Deadlift': { sets: [{ reps: 10, weight: 100 }] } } },
  { date: new Date('2025-11-08T12:00:00').toISOString(), type: 'cardio' },
  { date: new Date('2025-11-09T12:00:00').toISOString(), type: 'cardio' },
  // Week 2 (Nov 10-16): Complete with only 2 strength
  { date: new Date('2025-11-10T12:00:00').toISOString(), type: 'strength', exercises: { 'Squat': { sets: [{ reps: 10, weight: 100 }] } } },
  { date: new Date('2025-11-11T12:00:00').toISOString(), type: 'cardio' },
  { date: new Date('2025-11-12T12:00:00').toISOString(), type: 'strength', exercises: { 'Bench': { sets: [{ reps: 10, weight: 100 }] } } },
  { date: new Date('2025-11-13T12:00:00').toISOString(), type: 'cardio' },
  { date: new Date('2025-11-14T12:00:00').toISOString(), type: 'cardio' },
  { date: new Date('2025-11-15T12:00:00').toISOString(), type: 'cardio' },
  { date: new Date('2025-11-16T12:00:00').toISOString(), type: 'cardio' },
];

const result3b = calculateStreak(workouts3b);
console.log('Week 1: Nov 3-9 with 3 strength ✓');
console.log('Week 2: Nov 10-16 with 2 strength ✗');
console.log('Result:', result3b);
console.log('Expected: 7 days (Week 1 only, Week 2 fails)');
console.log('Status:', result3b.longestStreak === 7 ? '✓ PASS' : `✗ FAIL (got ${result3b.longestStreak})`);
console.log('');

