#!/usr/bin/env node

/**
 * Test incomplete week at start of streak
 */

import { calculateStreak } from '../src/utils/trackingMetrics.js';

console.log('=== Test: Streak starting on Saturday (incomplete first week) ===');
console.log('Scenario: User starts streak on Saturday with only cardio');
console.log('Expected: Incomplete week (just Saturday) should not require strength');
console.log('');

// Create a streak starting Saturday (6 days ago) with only cardio on Saturday
// Then full week Sunday-Saturday with strength
const today = new Date();
today.setHours(0, 0, 0, 0);

// Find the most recent Thursday to use as "today"
const thursday = new Date(today);
while (thursday.getDay() !== 4) {
  thursday.setDate(thursday.getDate() - 1);
}

const workouts = [];

// Saturday (5 days ago) - only cardio, incomplete week
const saturday = new Date(thursday);
saturday.setDate(saturday.getDate() - 5);
workouts.push({
  date: saturday.toISOString(),
  type: 'cardio' // NO strength in this incomplete week!
});

// Sunday through Thursday (4 days ago to today) - with strength
for (let i = 4; i >= 0; i--) {
  const d = new Date(thursday);
  d.setDate(d.getDate() - i);
  const hasStrength = i % 2 === 0; // Some days have strength
  workouts.push({
    date: d.toISOString(),
    type: hasStrength ? 'strength' : 'cardio',
    exercises: hasStrength ? { 'Squat': { sets: [{ reps: 10, weight: 100 }] } } : undefined
  });
}

console.log('Workouts:');
workouts.forEach((w, idx) => {
  const d = new Date(w.date);
  const weekStart = new Date(d);
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());
  console.log(`  ${d.toDateString()} (Day ${d.getDay()}) - ${w.type} - Week starting ${weekStart.toDateString()}`);
});
console.log('');

const result = calculateStreak(workouts);
console.log('Result:', result);
console.log('');
console.log('Expected behavior:');
console.log('- Saturday is in an incomplete week (Week 1: just Saturday)');
console.log('- Sunday-Thursday is in a complete week (Week 2: Sun-Sat, with strength sessions)');
console.log('- The incomplete first week should NOT require strength training');
console.log('- Therefore, streak should be 6 days (Sat through Thu)');
console.log('');
console.log('Current behavior may be:', result.longestStreak === 6 ? 'CORRECT' : 'INCORRECT');

console.log('\n=== Test 2: Multiple incomplete weeks ===');
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
  // Week 3 (incomplete - Mon, Tue only, no strength)
  { date: new Date('2025-11-24T12:00:00').toISOString(), type: 'cardio' },
  { date: new Date('2025-11-25T12:00:00').toISOString(), type: 'cardio' },
];

console.log('Workouts:');
workouts2.forEach((w) => {
  const d = new Date(w.date);
  console.log(`  ${d.toDateString()} (Day ${d.getDay()}) - ${w.type}`);
});

const result2 = calculateStreak(workouts2);
console.log('Result:', result2);
console.log('Expected: Should be 13 days (Wed-Sat of Week 1, all of Week 2, Mon-Tue of Week 3)');
console.log('Week 1 and Week 3 are incomplete, so no strength required');
console.log('Week 2 is complete and has strength');

