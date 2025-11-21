#!/usr/bin/env node

/**
 * Test Week 0 implementation
 * Tests streak calculation, adherence calculation, and week assignment for Week 0 scenarios
 */

import { calculateStreak, calculateAdherence } from '../src/utils/trackingMetrics.js';

console.log('=== Week 0 Implementation Tests ===\n');

// Test 1: First session on Wednesday - should create Week 0
console.log('Test 1: First session on Wednesday creates Week 0');
console.log('-----------------------------------------------------');
const test1Workouts = [
  { date: new Date('2025-11-12T12:00:00').toISOString(), type: 'strength', exercises: { 'Squat': { sets: [{ reps: 10, weight: 100 }] } } }, // Wed - First session
  { date: new Date('2025-11-13T12:00:00').toISOString(), type: 'strength', exercises: { 'Bench': { sets: [{ reps: 10, weight: 100 }] } } }, // Thu
  { date: new Date('2025-11-14T12:00:00').toISOString(), type: 'strength', exercises: { 'Deadlift': { sets: [{ reps: 10, weight: 100 }] } } }, // Fri
  { date: new Date('2025-11-15T12:00:00').toISOString(), type: 'cardio' }, // Sat
];

const result1 = calculateStreak(test1Workouts);
console.log(`Streak: ${result1.longestStreak} days (Expected: 4)`);
console.log(`Status: ${result1.longestStreak === 4 ? '✓ PASS' : '✗ FAIL'}`);
console.log('Week 0 sessions (Wed-Sat) should count toward streak ✓\n');

// Test 2: Week 0 adherence calculation
console.log('Test 2: Week 0 sessions excluded from adherence');
console.log('-----------------------------------------------------');
const weekZeroInfo = {
  isWeekZero: true,
  weekZeroStartDate: '2025-11-12T00:00:00.000Z', // Wed
  cycleStartDate: '2025-11-16T00:00:00.000Z', // Next Sunday (Week 1 start)
};

const adherence1 = calculateAdherence(test1Workouts, null, 30, weekZeroInfo);
console.log(`Adherence while in Week 0: ${adherence1}% (Expected: 0%)`);
console.log(`Status: ${adherence1 === 0 ? '✓ PASS' : '✗ FAIL'}`);
console.log('Week 0 sessions should NOT count for adherence ✓\n');

// Test 3: Week 0 then Week 1 adherence
console.log('Test 3: Adherence after transitioning to Week 1');
console.log('-----------------------------------------------------');
const test3Workouts = [
  // Week 0
  { date: new Date('2025-11-12T12:00:00').toISOString(), type: 'strength', exercises: { 'Squat': { sets: [{ reps: 10, weight: 100 }] } } }, // Wed
  { date: new Date('2025-11-13T12:00:00').toISOString(), type: 'strength', exercises: { 'Bench': { sets: [{ reps: 10, weight: 100 }] } } }, // Thu
  { date: new Date('2025-11-14T12:00:00').toISOString(), type: 'strength', exercises: { 'Deadlift': { sets: [{ reps: 10, weight: 100 }] } } }, // Fri
  { date: new Date('2025-11-15T12:00:00').toISOString(), type: 'cardio' }, // Sat
  // Week 1 (starting Sunday)
  { date: new Date('2025-11-16T12:00:00').toISOString(), type: 'strength', exercises: { 'OHP': { sets: [{ reps: 10, weight: 100 }] } } }, // Sun
  { date: new Date('2025-11-17T12:00:00').toISOString(), type: 'cardio' }, // Mon
  { date: new Date('2025-11-18T12:00:00').toISOString(), type: 'strength', exercises: { 'Squat': { sets: [{ reps: 10, weight: 100 }] } } }, // Tue
];

const weekZeroTransitioned = {
  isWeekZero: false, // Transitioned to Week 1
  weekZeroStartDate: '2025-11-12T00:00:00.000Z',
  cycleStartDate: '2025-11-16T00:00:00.000Z', // Week 1 start
};

const adherence3 = calculateAdherence(test3Workouts, null, 30, weekZeroTransitioned);
// Should be 3 days with sessions (Sun, Mon, Tue) out of 3 days since Week 1 start
console.log(`Adherence in Week 1: ${adherence3}% (Expected: 100%)`);
console.log(`Status: ${adherence3 === 100 ? '✓ PASS' : '✗ FAIL'}`);
console.log('Week 0 sessions excluded, Week 1 sessions counted ✓\n');

// Test 4: Streak continues from Week 0 to Week 1
console.log('Test 4: Streak continues across Week 0 to Week 1 boundary');
console.log('-----------------------------------------------------');
const result4 = calculateStreak(test3Workouts);
console.log(`Streak: ${result4.longestStreak} days (Expected: 7)`);
console.log(`Status: ${result4.longestStreak === 7 ? '✓ PASS' : '✗ FAIL'}`);
console.log('Streak counts consecutive days across Week 0 and Week 1 ✓\n');

// Test 5: First session on Tuesday (no Week 0)
console.log('Test 5: First session on Tuesday - no Week 0');
console.log('-----------------------------------------------------');
const test5Workouts = [
  { date: new Date('2025-11-11T12:00:00').toISOString(), type: 'strength', exercises: { 'Squat': { sets: [{ reps: 10, weight: 100 }] } } }, // Tue - First session
  { date: new Date('2025-11-12T12:00:00').toISOString(), type: 'strength', exercises: { 'Bench': { sets: [{ reps: 10, weight: 100 }] } } }, // Wed
];

const result5 = calculateStreak(test5Workouts);
console.log(`Streak: ${result5.longestStreak} days (Expected: 2)`);
console.log(`Status: ${result5.longestStreak === 2 ? '✓ PASS' : '✗ FAIL'}`);

// No Week 0 info means normal adherence calculation
const adherence5 = calculateAdherence(test5Workouts, null, 30);
console.log(`Adherence without Week 0: ${adherence5}% (Expected: 100%)`);
console.log(`Status: ${adherence5 === 100 ? '✓ PASS' : '✗ FAIL'}`);
console.log('Sessions before Wednesday count normally (no Week 0) ✓\n');

// Test 6: Week reset doesn't affect streak
console.log('Test 6: Week reset does not break streak');
console.log('-----------------------------------------------------');
const test6Workouts = [
  { date: new Date('2025-11-15T12:00:00').toISOString(), type: 'strength', exercises: { 'Squat': { sets: [{ reps: 10, weight: 100 }] } } }, // Sat
  { date: new Date('2025-11-16T12:00:00').toISOString(), type: 'strength', exercises: { 'Bench': { sets: [{ reps: 10, weight: 100 }] } } }, // Sun - Week reset happens
  { date: new Date('2025-11-17T12:00:00').toISOString(), type: 'strength', exercises: { 'Deadlift': { sets: [{ reps: 10, weight: 100 }] } } }, // Mon
  { date: new Date('2025-11-18T12:00:00').toISOString(), type: 'strength', exercises: { 'OHP': { sets: [{ reps: 10, weight: 100 }] } } }, // Tue
  { date: new Date('2025-11-19T12:00:00').toISOString(), type: 'cardio' }, // Wed
  { date: new Date('2025-11-20T12:00:00').toISOString(), type: 'cardio' }, // Thu
];

const result6 = calculateStreak(test6Workouts);
console.log(`Streak with week reset on Sunday: ${result6.longestStreak} days (Expected: 6)`);
console.log(`Status: ${result6.longestStreak === 6 ? '✓ PASS' : '✗ FAIL'}`);
console.log('Week reset is metadata-only, streak calculation is date-based ✓\n');

// Summary
console.log('=== SUMMARY ===');
const allResults = [result1, result4, result5, result6];
const expectedStreaks = [4, 7, 2, 6];
const passedStreaks = allResults.filter((r, i) => r.longestStreak === expectedStreaks[i]).length;

const adherenceTests = [
  adherence1 === 0,
  adherence3 === 100,
  adherence5 === 100,
];
const passedAdherence = adherenceTests.filter(t => t).length;

console.log(`Streak tests: ${passedStreaks}/4 passed`);
console.log(`Adherence tests: ${passedAdherence}/3 passed`);
console.log(`Overall: ${passedStreaks + passedAdherence}/7 tests passed`);
console.log((passedStreaks + passedAdherence) === 7 ? '\n✅ All Week 0 tests passed!' : '\n❌ Some tests failed');
