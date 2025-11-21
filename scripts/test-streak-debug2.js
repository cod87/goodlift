#!/usr/bin/env node

import { calculateStreak } from '../src/utils/trackingMetrics.js';

const workouts3b = [
  // Week 1 (Nov 3-9): Complete with 3 strength
  { date: new Date('2025-11-03T12:00:00').toISOString(), type: 'strength', exercises: { 'Squat': { sets: [{ reps: 10, weight: 100 }] } } }, // 0
  { date: new Date('2025-11-04T12:00:00').toISOString(), type: 'cardio' }, // 1
  { date: new Date('2025-11-05T12:00:00').toISOString(), type: 'strength', exercises: { 'Bench': { sets: [{ reps: 10, weight: 100 }] } } }, // 2
  { date: new Date('2025-11-06T12:00:00').toISOString(), type: 'cardio' }, // 3
  { date: new Date('2025-11-07T12:00:00').toISOString(), type: 'strength', exercises: { 'Deadlift': { sets: [{ reps: 10, weight: 100 }] } } }, // 4
  { date: new Date('2025-11-08T12:00:00').toISOString(), type: 'cardio' }, // 5
  { date: new Date('2025-11-09T12:00:00').toISOString(), type: 'cardio' }, // 6
  // Week 2 (Nov 10-16): Complete with only 2 strength
  { date: new Date('2025-11-10T12:00:00').toISOString(), type: 'strength', exercises: { 'Squat': { sets: [{ reps: 10, weight: 100 }] } } }, // 7
  { date: new Date('2025-11-11T12:00:00').toISOString(), type: 'cardio' }, // 8
  { date: new Date('2025-11-12T12:00:00').toISOString(), type: 'strength', exercises: { 'Bench': { sets: [{ reps: 10, weight: 100 }] } } }, // 9
  { date: new Date('2025-11-13T12:00:00').toISOString(), type: 'cardio' }, // 10
  { date: new Date('2025-11-14T12:00:00').toISOString(), type: 'cardio' }, // 11
  { date: new Date('2025-11-15T12:00:00').toISOString(), type: 'cardio' }, // 12
  { date: new Date('2025-11-16T12:00:00').toISOString(), type: 'cardio' }, // 13
];

console.log('Workouts:');
workouts3b.forEach((w, i) => {
  const d = new Date(w.date);
  console.log(`${i}: ${d.toDateString()} (Day ${d.getDay()}) - ${w.type}`);
});

console.log('\nExpected:');
console.log('Week 1: indices 0-6, complete, 3 strength sessions ✓');
console.log('Week 2: indices 7-13, complete, 2 strength sessions ✗');
console.log('When checking len=7:');
console.log('  - Includes indices 0-6 (Week 1 only)');
console.log('  - Week 1 is complete and has 3 strength');
console.log('  - Week 2 is NOT included in this prefix');
console.log('  - Should return 7');

const result = calculateStreak(workouts3b);
console.log('\nActual result:', result);

