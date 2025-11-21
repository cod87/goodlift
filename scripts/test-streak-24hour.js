#!/usr/bin/env node

/**
 * Test script for 24-hour streak calculation edge cases
 */

import { calculateStreak } from '../src/utils/trackingMetrics.js';

console.log('=== Test: Workout late yesterday, checking today before 24 hours ===');
// Scenario: User worked out at 11 PM yesterday (23 hours ago)
// Current time is 10 PM today
// This should still be within 24 hours and maintain the streak

const now = new Date();
console.log('Current time:', now.toLocaleString());

// Workout 23 hours ago (late last night)
const workout23HoursAgo = new Date(now.getTime() - (23 * 60 * 60 * 1000));
console.log('Workout at:', workout23HoursAgo.toLocaleString());
console.log('Hours ago:', ((now - workout23HoursAgo) / (1000 * 60 * 60)).toFixed(2));

const workouts1 = [
  { date: workout23HoursAgo.toISOString(), type: 'strength', exercises: { 'Squat': { sets: [{ reps: 10, weight: 100 }] } } },
];

const result1 = calculateStreak(workouts1);
console.log('Result:', result1);
console.log('Days since workout (calendar days):', Math.floor((now.getTime() - workout23HoursAgo.getTime()) / (1000 * 60 * 60 * 24)));
console.log('Expected: currentStreak should be 1 if within 24 hours (even if it\'s "yesterday" in calendar terms)');
console.log('');

console.log('=== Test: Workout 25 hours ago (crosses midnight) ===');
const workout25HoursAgo = new Date(now.getTime() - (25 * 60 * 60 * 1000));
console.log('Workout at:', workout25HoursAgo.toLocaleString());
console.log('Hours ago:', ((now - workout25HoursAgo) / (1000 * 60 * 60)).toFixed(2));

const workouts2 = [
  { date: workout25HoursAgo.toISOString(), type: 'strength', exercises: { 'Squat': { sets: [{ reps: 10, weight: 100 }] } } },
];

const result2 = calculateStreak(workouts2);
console.log('Result:', result2);
console.log('Days since workout (calendar days):', Math.floor((now.getTime() - workout25HoursAgo.getTime()) / (1000 * 60 * 60 * 24)));
console.log('Expected: currentStreak should be 0 (more than 24 hours ago)');
console.log('');

console.log('=== Test: Workout at 1 AM today (checking at 11 PM same day) ===');
const today1AM = new Date(now);
today1AM.setHours(1, 0, 0, 0);
console.log('Workout at:', today1AM.toLocaleString());
console.log('Hours ago:', ((now - today1AM) / (1000 * 60 * 60)).toFixed(2));

const workouts3 = [
  { date: today1AM.toISOString(), type: 'strength', exercises: { 'Squat': { sets: [{ reps: 10, weight: 100 }] } } },
];

const result3 = calculateStreak(workouts3);
console.log('Result:', result3);
console.log('Expected: currentStreak should be 1 (same day workout)');
console.log('');

