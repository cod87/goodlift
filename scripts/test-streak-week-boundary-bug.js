#!/usr/bin/env node

/**
 * Test to reproduce the week boundary bug mentioned in the issue
 */

import { calculateStreak } from '../src/utils/trackingMetrics.js';

console.log('=== Reproducing the Saturday-Sunday bug ===');
console.log('Scenario: Streak starts on Saturday and continues across Sunday into a new week');
console.log('Expected: Full consecutive day count');
console.log('');

// Let's create a scenario starting today and going back
const today = new Date();
today.setHours(0, 0, 0, 0);

// We need to test starting from a recent Saturday
// Let's make today Thursday, and go back to Saturday (5 days ago)
const thursdayTest = new Date();
thursdayTest.setHours(0, 0, 0, 0);

// Find most recent Thursday to use as "today"
while (thursdayTest.getDay() !== 4) {
  thursdayTest.setDate(thursdayTest.getDate() - 1);
}

// Now create workouts: Sat (5 days ago) → Sun → Mon → Tue → Wed → Thu (today)
const workouts = [];
for (let i = 5; i >= 0; i--) {
  const workoutDate = new Date(thursdayTest);
  workoutDate.setDate(workoutDate.getDate() - i);
  workouts.push({
    date: workoutDate.toISOString(),
    type: i % 2 === 0 ? 'strength' : 'strength', // All strength to satisfy requirement
    exercises: { 'Squat': { sets: [{ reps: 10, weight: 100 }] } }
  });
}

console.log('Mock "today":', thursdayTest.toDateString(), '(Day', thursdayTest.getDay(), ')');
console.log('Workouts:');
workouts.forEach((w, idx) => {
  const d = new Date(w.date);
  console.log(`  ${idx}: ${d.toDateString()} (Day ${d.getDay()}) - ${w.type}`);
});
console.log('');

const result = calculateStreak(workouts);
console.log('Result:', result);
console.log('Expected: currentStreak = 6, longestStreak = 6');
console.log('');

// Now test if it breaks when we modify the "today" to be something else
console.log('=== Test with different "today" reference ===');
// Simulate checking from a future date
const futureTh = new Date(thursdayTest);
futureTh.setDate(futureTh.getDate() + 3); // 3 days in future (Sunday)

console.log('Now checking as if today is:', futureTh.toDateString());
const result2 = calculateStreak(workouts);
console.log('Result:', result2);
console.log('Expected: currentStreak = 0 (workouts are now old), longestStreak = 6');

