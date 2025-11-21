#!/usr/bin/env node

/**
 * Test script for streak calculation
 */

import { calculateStreak } from '../src/utils/trackingMetrics.js';

// Helper to create a date string
const createDate = (daysAgo) => {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date.toISOString();
};

// Helper to create a workout session
const createWorkout = (daysAgo, type = 'strength') => ({
  date: createDate(daysAgo),
  type,
  exercises: type === 'strength' ? { 'Squat': { sets: [{ reps: 10, weight: 100 }] } } : undefined
});

console.log('=== Test 1: Streak across Saturday-Sunday boundary ===');
// Create workouts: Sat, Sun, Mon, Tue, Wed, Thu (6 consecutive days)
const today = new Date();
const dayOfWeek = today.getDay(); // 0 = Sunday, 6 = Saturday

// Calculate how many days ago was last Saturday
let daysToLastSaturday = (dayOfWeek + 1) % 7; // Days since last Saturday
if (daysToLastSaturday === 0) daysToLastSaturday = 7; // If today is Saturday, go back 7 days

const workouts1 = [
  createWorkout(daysToLastSaturday, 'strength'),     // Saturday
  createWorkout(daysToLastSaturday - 1, 'strength'), // Sunday
  createWorkout(daysToLastSaturday - 2, 'strength'), // Monday
  createWorkout(daysToLastSaturday - 3, 'strength'), // Tuesday
  createWorkout(daysToLastSaturday - 4, 'cardio'),   // Wednesday
  createWorkout(daysToLastSaturday - 5, 'strength'), // Thursday
];

console.log('Workouts:', workouts1.map((w, i) => {
  const d = new Date(w.date);
  return `${i}: ${d.toDateString()} (${w.type})`;
}).join('\n'));

const result1 = calculateStreak(workouts1);
console.log('Result:', result1);
console.log('Expected: currentStreak should be 6, longestStreak should be 6');
console.log('');

console.log('=== Test 2: Current streak with last workout today ===');
const workouts2 = [
  createWorkout(0, 'strength'), // Today
  createWorkout(1, 'strength'), // Yesterday
  createWorkout(2, 'strength'), // 2 days ago
];
const result2 = calculateStreak(workouts2);
console.log('Result:', result2);
console.log('Expected: currentStreak should be 3, longestStreak should be 3');
console.log('');

console.log('=== Test 3: Current streak with last workout yesterday ===');
const workouts3 = [
  createWorkout(1, 'strength'), // Yesterday
  createWorkout(2, 'strength'), // 2 days ago
  createWorkout(3, 'strength'), // 3 days ago
];
const result3 = calculateStreak(workouts3);
console.log('Result:', result3);
console.log('Expected: currentStreak should be 3, longestStreak should be 3');
console.log('');

console.log('=== Test 4: Streak broken (last workout 2 days ago) ===');
const workouts4 = [
  createWorkout(2, 'strength'), // 2 days ago
  createWorkout(3, 'strength'), // 3 days ago
  createWorkout(4, 'strength'), // 4 days ago
];
const result4 = calculateStreak(workouts4);
console.log('Result:', result4);
console.log('Expected: currentStreak should be 0 (too old), longestStreak should be 3');
console.log('');

console.log('=== Test 5: Late night workout scenario ===');
// Simulate workout at 11:30 PM yesterday and 12:05 AM today
const lateNightWorkout = new Date();
lateNightWorkout.setDate(lateNightWorkout.getDate() - 1);
lateNightWorkout.setHours(23, 30, 0, 0);

const earlyMorningWorkout = new Date();
earlyMorningWorkout.setHours(0, 5, 0, 0);

const workouts5 = [
  { date: earlyMorningWorkout.toISOString(), type: 'strength', exercises: { 'Squat': { sets: [{ reps: 10, weight: 100 }] } } },
  { date: lateNightWorkout.toISOString(), type: 'strength', exercises: { 'Bench': { sets: [{ reps: 10, weight: 100 }] } } },
];

console.log('Workouts:', workouts5.map((w, i) => {
  const d = new Date(w.date);
  return `${i}: ${d.toLocaleString()}`;
}).join('\n'));

const result5 = calculateStreak(workouts5);
console.log('Result:', result5);
console.log('Expected: Should count as 2 consecutive days (different calendar days)');
console.log('');


console.log('=== Test 6: Specific Saturday-Sunday edge case (starting Saturday) ===');
// Create a specific scenario: Sat → Sun → Mon → Tue (across week boundary)
const specificDate = new Date('2025-11-15T12:00:00'); // This is a Saturday
const workouts6 = [
  { date: new Date('2025-11-15T12:00:00').toISOString(), type: 'strength', exercises: { 'Squat': { sets: [{ reps: 10, weight: 100 }] } } }, // Sat
  { date: new Date('2025-11-16T12:00:00').toISOString(), type: 'strength', exercises: { 'Bench': { sets: [{ reps: 10, weight: 100 }] } } }, // Sun
  { date: new Date('2025-11-17T12:00:00').toISOString(), type: 'strength', exercises: { 'Deadlift': { sets: [{ reps: 10, weight: 100 }] } } }, // Mon
  { date: new Date('2025-11-18T12:00:00').toISOString(), type: 'strength', exercises: { 'Press': { sets: [{ reps: 10, weight: 100 }] } } }, // Tue
];

console.log('Workouts:', workouts6.map((w, i) => {
  const d = new Date(w.date);
  return `${i}: ${d.toDateString()} - Day ${d.getDay()} (${w.type})`;
}).join('\n'));

const result6 = calculateStreak(workouts6);
console.log('Result:', result6);
console.log('Expected: longestStreak should be 4 (Sat-Sun-Mon-Tue)');
console.log('Note: currentStreak may be 0 if these dates are not recent');
console.log('');

console.log('=== Test 7: Multiple weeks with strength requirement ===');
// Week 1: Sun-Sat with strength, Week 2: Sun-Tue with strength, all consecutive
const workouts7 = [
  { date: new Date('2025-11-10T12:00:00').toISOString(), type: 'strength', exercises: { 'Squat': { sets: [{ reps: 10, weight: 100 }] } } }, // Sun
  { date: new Date('2025-11-11T12:00:00').toISOString(), type: 'cardio' }, // Mon
  { date: new Date('2025-11-12T12:00:00').toISOString(), type: 'strength', exercises: { 'Bench': { sets: [{ reps: 10, weight: 100 }] } } }, // Tue
  { date: new Date('2025-11-13T12:00:00').toISOString(), type: 'cardio' }, // Wed
  { date: new Date('2025-11-14T12:00:00').toISOString(), type: 'strength', exercises: { 'Deadlift': { sets: [{ reps: 10, weight: 100 }] } } }, // Thu
  { date: new Date('2025-11-15T12:00:00').toISOString(), type: 'cardio' }, // Fri
  { date: new Date('2025-11-16T12:00:00').toISOString(), type: 'strength', exercises: { 'Press': { sets: [{ reps: 10, weight: 100 }] } } }, // Sat (Week 1)
  // Week 2 starts
  { date: new Date('2025-11-17T12:00:00').toISOString(), type: 'strength', exercises: { 'Squat': { sets: [{ reps: 10, weight: 100 }] } } }, // Sun (Week 2)
  { date: new Date('2025-11-18T12:00:00').toISOString(), type: 'cardio' }, // Mon
  { date: new Date('2025-11-19T12:00:00').toISOString(), type: 'strength', exercises: { 'Bench': { sets: [{ reps: 10, weight: 100 }] } } }, // Tue
];

console.log('Workouts:', workouts7.map((w, i) => {
  const d = new Date(w.date);
  return `${i}: ${d.toDateString()} - Day ${d.getDay()} (${w.type})`;
}).join('\n'));

const result7 = calculateStreak(workouts7);
console.log('Result:', result7);
console.log('Expected: longestStreak should be 10 (all consecutive days with strength in each week)');
console.log('');

console.log('=== Test 8: Week without strength breaks streak ===');
// Week 1 has strength, Week 2 has no strength (only cardio)
const workouts8 = [
  { date: new Date('2025-11-10T12:00:00').toISOString(), type: 'strength', exercises: { 'Squat': { sets: [{ reps: 10, weight: 100 }] } } }, // Sun (Week 1)
  { date: new Date('2025-11-11T12:00:00').toISOString(), type: 'strength', exercises: { 'Bench': { sets: [{ reps: 10, weight: 100 }] } } }, // Mon
  { date: new Date('2025-11-12T12:00:00').toISOString(), type: 'strength', exercises: { 'Deadlift': { sets: [{ reps: 10, weight: 100 }] } } }, // Tue
  // Consecutive but Week 2 has NO strength
  { date: new Date('2025-11-13T12:00:00').toISOString(), type: 'cardio' }, // Wed (still Week 1)
  { date: new Date('2025-11-14T12:00:00').toISOString(), type: 'cardio' }, // Thu
  { date: new Date('2025-11-15T12:00:00').toISOString(), type: 'cardio' }, // Fri
  { date: new Date('2025-11-16T12:00:00').toISOString(), type: 'cardio' }, // Sat (end of Week 1)
  // Week 2 starts - NO STRENGTH
  { date: new Date('2025-11-17T12:00:00').toISOString(), type: 'cardio' }, // Sun (Week 2)
  { date: new Date('2025-11-18T12:00:00').toISOString(), type: 'cardio' }, // Mon
];

console.log('Workouts:', workouts8.map((w, i) => {
  const d = new Date(w.date);
  return `${i}: ${d.toDateString()} - Day ${d.getDay()} (${w.type})`;
}).join('\n'));

const result8 = calculateStreak(workouts8);
console.log('Result:', result8);
console.log('Expected: longestStreak should be 7 (Sun-Sat of Week 1), NOT 9');
console.log('Reason: Week 2 has no strength training, so streak breaks at Week 2 boundary');
console.log('');

