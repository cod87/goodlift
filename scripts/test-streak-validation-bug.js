#!/usr/bin/env node

/**
 * Test to find the actual bug in streak validation
 */

import { calculateStreak } from '../src/utils/trackingMetrics.js';

console.log('=== Test: Streak with week that has no strength ===');
console.log('Scenario: User has consecutive days, but second week has no strength');
console.log('Current behavior: Streak gets shortened, but currentStreak check might be wrong');
console.log('');

// Create workouts today and going back
// Week 1: All strength training
// Week 2 (recent): Only cardio - this should break the streak
const today = new Date();
today.setHours(0, 0, 0, 0);

const workouts = [];

// Yesterday and today - cardio only (no strength in this week yet)
workouts.push({ 
  date: today.toISOString(), 
  type: 'cardio'
});

const yesterday = new Date(today);
yesterday.setDate(yesterday.getDate() - 1);
workouts.push({ 
  date: yesterday.toISOString(), 
  type: 'cardio'
});

// Go back 7 more days with strength training
for (let i = 2; i < 9; i++) {
  const d = new Date(today);
  d.setDate(d.getDate() - i);
  workouts.push({ 
    date: d.toISOString(), 
    type: 'strength',
    exercises: { 'Squat': { sets: [{ reps: 10, weight: 100 }] } }
  });
}

console.log('Workouts (most recent first):');
workouts.forEach((w, idx) => {
  const d = new Date(w.date);
  const daysAgo = Math.floor((today - d) / (1000 * 60 * 60 * 24));
  console.log(`  ${idx}: ${d.toDateString()} (${daysAgo} days ago) - ${w.type}`);
});
console.log('');

const result = calculateStreak(workouts);
console.log('Result:', result);
console.log('');
console.log('Analysis:');
console.log('- Today and yesterday are consecutive days with workouts');
console.log('- But they are cardio only (no strength this week yet)');
console.log('- Previous 7 days all had strength');
console.log('- The streak should either be:');
console.log('  Option A: 9 days if we allow a "grace period" for current week');
console.log('  Option B: 0 days if current week has no strength yet');
console.log('  Option C: 7 days if we stop at the week boundary');
console.log('');
console.log('The issue: if findLongestValidStreak returns a shorter streak,');
console.log('the currentStreak check might use the wrong end date!');

