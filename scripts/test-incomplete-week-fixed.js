#!/usr/bin/env node

/**
 * Test incomplete week at start of streak - FIXED
 */

import { calculateStreak } from '../src/utils/trackingMetrics.js';

console.log('=== Test 2 FIXED: Multiple incomplete weeks (no gap) ===');
// Streak starting Wednesday, ending Tuesday (both incomplete weeks)
const workouts2 = [
  // Wednesday of week 1 (incomplete week, no strength)
  { date: new Date('2025-11-12T12:00:00').toISOString(), type: 'cardio' },
  { date: new Date('2025-11-13T12:00:00').toISOString(), type: 'cardio' },
  { date: new Date('2025-11-14T12:00:00').toISOString(), type: 'cardio' },
  { date: new Date('2025-11-15T12:00:00').toISOString(), type: 'cardio' },
  // Week 2 (complete week with strength)
  { date: new Date('2025-11-16T12:00:00').toISOString(), type: 'strength', exercises: { 'Squat': { sets: [{ reps: 10, weight: 100 }] } } },
  { date: new Date('2025-11-17T12:00:00').toISOString(), type: 'cardio' },
  { date: new Date('2025-11-18T12:00:00').toISOString(), type: 'cardio' },
  { date: new Date('2025-11-19T12:00:00').toISOString(), type: 'cardio' },
  { date: new Date('2025-11-20T12:00:00').toISOString(), type: 'cardio' },
  { date: new Date('2025-11-21T12:00:00').toISOString(), type: 'cardio' },
  { date: new Date('2025-11-22T12:00:00').toISOString(), type: 'cardio' },
  // Week 3 (incomplete - Sun, Mon, Tue only, no strength)
  { date: new Date('2025-11-23T12:00:00').toISOString(), type: 'cardio' }, // Sunday - ADDED
  { date: new Date('2025-11-24T12:00:00').toISOString(), type: 'cardio' },
  { date: new Date('2025-11-25T12:00:00').toISOString(), type: 'cardio' },
];

console.log('Workouts:');
workouts2.forEach((w) => {
  const d = new Date(w.date);
  console.log(`  ${d.toDateString()} (Day ${d.getDay()}) - ${w.type}`);
});

const result2 = calculateStreak(workouts2);
console.log('\nResult:', result2);
console.log('Expected: Should be 14 days (Wed-Sat of Week 1, all of Week 2, Sun-Tue of Week 3)');
console.log('Week 1 (Wed-Sat): incomplete, no strength required');
console.log('Week 2 (Sun-Sat): complete, has strength ✓');
console.log('Week 3 (Sun-Tue): incomplete, no strength required');
console.log('Result:', result2.longestStreak === 14 ? 'CORRECT ✓' : `INCORRECT (got ${result2.longestStreak})`);

console.log('\n=== Test 3: Complete week without strength should break streak ===');
const workouts3 = [
  // Week 1: Complete week with strength
  { date: new Date('2025-11-10T12:00:00').toISOString(), type: 'strength', exercises: { 'Squat': { sets: [{ reps: 10, weight: 100 }] } } },
  { date: new Date('2025-11-11T12:00:00').toISOString(), type: 'cardio' },
  { date: new Date('2025-11-12T12:00:00').toISOString(), type: 'cardio' },
  { date: new Date('2025-11-13T12:00:00').toISOString(), type: 'cardio' },
  { date: new Date('2025-11-14T12:00:00').toISOString(), type: 'cardio' },
  { date: new Date('2025-11-15T12:00:00').toISOString(), type: 'cardio' },
  { date: new Date('2025-11-16T12:00:00').toISOString(), type: 'cardio' },
  // Week 2: Complete week but NO strength - should break here
  { date: new Date('2025-11-17T12:00:00').toISOString(), type: 'cardio' },
  { date: new Date('2025-11-18T12:00:00').toISOString(), type: 'cardio' },
  { date: new Date('2025-11-19T12:00:00').toISOString(), type: 'cardio' },
  { date: new Date('2025-11-20T12:00:00').toISOString(), type: 'cardio' },
  { date: new Date('2025-11-21T12:00:00').toISOString(), type: 'cardio' },
  { date: new Date('2025-11-22T12:00:00').toISOString(), type: 'cardio' },
  { date: new Date('2025-11-23T12:00:00').toISOString(), type: 'cardio' },
];

console.log('Workouts:');
workouts3.forEach((w) => {
  const d = new Date(w.date);
  const weekStart = new Date(d);
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());
  console.log(`  ${d.toDateString()} (Day ${d.getDay()}) - ${w.type} - Week: ${weekStart.toDateString()}`);
});

const result3 = calculateStreak(workouts3);
console.log('\nResult:', result3);
console.log('Expected: Should be 7 days (just Week 1, which has strength)');
console.log('Week 2 is complete but has no strength, so streak breaks');
console.log('Result:', result3.longestStreak === 7 ? 'CORRECT ✓' : `INCORRECT (got ${result3.longestStreak})`);

