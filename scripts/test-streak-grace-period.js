#!/usr/bin/env node

/**
 * Test grace period for current streak
 */

import { calculateStreak } from '../src/utils/trackingMetrics.js';

console.log('=== Test: Grace period - last workout yesterday ===');
console.log('Scenario: User had a 5-day streak, last workout was yesterday');
console.log('Question: Should currentStreak be 5 or 0?');
console.log('');

const today = new Date();
today.setHours(0, 0, 0, 0);

const workouts = [];
// Workouts for 5 consecutive days, ending yesterday
for (let i = 1; i <= 5; i++) {
  const d = new Date(today);
  d.setDate(d.getDate() - i);
  workouts.push({
    date: d.toISOString(),
    type: 'strength',
    exercises: { 'Squat': { sets: [{ reps: 10, weight: 100 }] } }
  });
}

console.log('Workouts:');
workouts.forEach((w, idx) => {
  const d = new Date(w.date);
  const daysAgo = Math.floor((today - d) / (1000 * 60 * 60 * 24));
  console.log(`  ${d.toDateString()} (${daysAgo} days ago)`);
});
console.log('');

const result = calculateStreak(workouts);
console.log('Result:', result);
console.log('Current behavior: currentStreak =', result.currentStreak);
console.log('');
console.log('Expected: Should be 5 (user is still "on" their streak)');
console.log('The streak shouldonly break if they miss today AND tomorrow');
console.log('');

console.log('=== Test: Grace period - last workout 2 days ago ===');
const workouts2 = [];
for (let i = 2; i <= 6; i++) {
  const d = new Date(today);
  d.setDate(d.getDate() - i);
  workouts2.push({
    date: d.toISOString(),
    type: 'strength',
    exercises: { 'Squat': { sets: [{ reps: 10, weight: 100 }] } }
  });
}

const result2 = calculateStreak(workouts2);
console.log('Result:', result2);
console.log('Current behavior: currentStreak =', result2.currentStreak);
console.log('Expected: Should be 0 (missed yesterday, so streak is broken)');

