#!/usr/bin/env node

/**
 * Final validation of all streak calculation requirements
 */

import { calculateStreak } from '../src/utils/trackingMetrics.js';

console.log('=== FINAL VALIDATION: All Requirements ===\n');

console.log('Requirement 1: Saturday-Sunday week boundary crossing');
console.log('----------------------------------------------------');
const test1 = [
  { date: new Date('2025-11-15T12:00:00').toISOString(), type: 'strength', exercises: { 'Squat': { sets: [{ reps: 10, weight: 100 }] } } }, // Sat
  { date: new Date('2025-11-16T12:00:00').toISOString(), type: 'strength', exercises: { 'Bench': { sets: [{ reps: 10, weight: 100 }] } } }, // Sun
  { date: new Date('2025-11-17T12:00:00').toISOString(), type: 'strength', exercises: { 'Deadlift': { sets: [{ reps: 10, weight: 100 }] } } }, // Mon
  { date: new Date('2025-11-18T12:00:00').toISOString(), type: 'cardio' }, // Tue
  { date: new Date('2025-11-19T12:00:00').toISOString(), type: 'cardio' }, // Wed
  { date: new Date('2025-11-20T12:00:00').toISOString(), type: 'cardio' }, // Thu
];
const result1 = calculateStreak(test1);
console.log(`Sat→Sun→Mon→Tue→Wed→Thu: ${result1.longestStreak} days`);
console.log(`Expected: 6 days (crosses week boundary seamlessly)`);
console.log(`Status: ${result1.longestStreak === 6 ? '✓ PASS' : '✗ FAIL'}\n`);

console.log('Requirement 2: Incomplete week exemption (starting Saturday)');
console.log('----------------------------------------------------');
const test2 = [
  { date: new Date('2025-11-15T12:00:00').toISOString(), type: 'cardio' }, // Sat (incomplete week, NO strength)
  { date: new Date('2025-11-16T12:00:00').toISOString(), type: 'strength', exercises: { 'Squat': { sets: [{ reps: 10, weight: 100 }] } } }, // Sun (new week)
  { date: new Date('2025-11-17T12:00:00').toISOString(), type: 'cardio' }, // Mon
  { date: new Date('2025-11-18T12:00:00').toISOString(), type: 'strength', exercises: { 'Bench': { sets: [{ reps: 10, weight: 100 }] } } }, // Tue
  { date: new Date('2025-11-19T12:00:00').toISOString(), type: 'strength', exercises: { 'Deadlift': { sets: [{ reps: 10, weight: 100 }] } } }, // Wed
  { date: new Date('2025-11-20T12:00:00').toISOString(), type: 'cardio' }, // Thu
];
const result2 = calculateStreak(test2);
console.log(`Sat(cardio)→Sun(str)→Mon→Tue(str)→Wed(str)→Thu: ${result2.longestStreak} days`);
console.log(`Expected: 6 days (incomplete first week exempt from strength requirement)`);
console.log(`Status: ${result2.longestStreak === 6 ? '✓ PASS' : '✗ FAIL'}\n`);

console.log('Requirement 3: Complete week requires 3 strength sessions');
console.log('----------------------------------------------------');
const test3 = [
  { date: new Date('2025-11-16T12:00:00').toISOString(), type: 'strength', exercises: { 'Squat': { sets: [{ reps: 10, weight: 100 }] } } }, // Sun
  { date: new Date('2025-11-17T12:00:00').toISOString(), type: 'strength', exercises: { 'Bench': { sets: [{ reps: 10, weight: 100 }] } } }, // Mon
  { date: new Date('2025-11-18T12:00:00').toISOString(), type: 'strength', exercises: { 'Deadlift': { sets: [{ reps: 10, weight: 100 }] } } }, // Tue
  { date: new Date('2025-11-19T12:00:00').toISOString(), type: 'cardio' }, // Wed
  { date: new Date('2025-11-20T12:00:00').toISOString(), type: 'cardio' }, // Thu
  { date: new Date('2025-11-21T12:00:00').toISOString(), type: 'cardio' }, // Fri
  { date: new Date('2025-11-22T12:00:00').toISOString(), type: 'cardio' }, // Sat
];
const result3 = calculateStreak(test3);
console.log(`Complete week with 3 strength sessions: ${result3.longestStreak} days`);
console.log(`Expected: 7 days (meets requirement)`);
console.log(`Status: ${result3.longestStreak === 7 ? '✓ PASS' : '✗ FAIL'}\n`);

console.log('Requirement 4: Complete week with <3 strength fails');
console.log('----------------------------------------------------');
const test4 = [
  { date: new Date('2025-11-16T12:00:00').toISOString(), type: 'strength', exercises: { 'Squat': { sets: [{ reps: 10, weight: 100 }] } } }, // Sun
  { date: new Date('2025-11-17T12:00:00').toISOString(), type: 'strength', exercises: { 'Bench': { sets: [{ reps: 10, weight: 100 }] } } }, // Mon
  { date: new Date('2025-11-18T12:00:00').toISOString(), type: 'cardio' }, // Tue (only 2 strength in full week)
  { date: new Date('2025-11-19T12:00:00').toISOString(), type: 'cardio' }, // Wed
  { date: new Date('2025-11-20T12:00:00').toISOString(), type: 'cardio' }, // Thu
  { date: new Date('2025-11-21T12:00:00').toISOString(), type: 'cardio' }, // Fri
  { date: new Date('2025-11-22T12:00:00').toISOString(), type: 'cardio' }, // Sat
];
const result4 = calculateStreak(test4);
console.log(`Complete week with only 2 strength sessions: ${result4.longestStreak} days`);
console.log(`Expected: 0 days (fails requirement)`);
console.log(`Status: ${result4.longestStreak === 0 ? '✓ PASS' : '✗ FAIL'}\n`);

console.log('Requirement 5: Late-night workouts (timezone handling)');
console.log('----------------------------------------------------');
const lateNight = new Date();
lateNight.setDate(lateNight.getDate() - 1);
lateNight.setHours(23, 30, 0, 0);

const earlyMorning = new Date();
earlyMorning.setHours(0, 5, 0, 0);

const test5 = [
  { date: earlyMorning.toISOString(), type: 'strength', exercises: { 'Squat': { sets: [{ reps: 10, weight: 100 }] } } },
  { date: lateNight.toISOString(), type: 'strength', exercises: { 'Bench': { sets: [{ reps: 10, weight: 100 }] } } },
];
const result5 = calculateStreak(test5);
console.log(`11:30 PM → 12:05 AM: ${result5.longestStreak} days`);
console.log(`Expected: 2 days (different calendar days)`);
console.log(`Status: ${result5.longestStreak === 2 ? '✓ PASS' : '✗ FAIL'}\n`);

console.log('Requirement 6: Multiple sessions same day count as 1 day, but count toward strength requirement');
console.log('----------------------------------------------------');
const test6 = [
  { date: new Date('2025-11-16T08:00:00').toISOString(), type: 'strength', exercises: { 'Squat': { sets: [{ reps: 10, weight: 100 }] } } },
  { date: new Date('2025-11-16T16:00:00').toISOString(), type: 'strength', exercises: { 'Bench': { sets: [{ reps: 10, weight: 100 }] } } }, // Same day
  { date: new Date('2025-11-17T12:00:00').toISOString(), type: 'cardio' },
  { date: new Date('2025-11-18T12:00:00').toISOString(), type: 'strength', exercises: { 'Deadlift': { sets: [{ reps: 10, weight: 100 }] } } },
  { date: new Date('2025-11-19T12:00:00').toISOString(), type: 'cardio' },
  { date: new Date('2025-11-20T12:00:00').toISOString(), type: 'cardio' },
  { date: new Date('2025-11-21T12:00:00').toISOString(), type: 'cardio' },
  { date: new Date('2025-11-22T12:00:00').toISOString(), type: 'cardio' },
];
const result6 = calculateStreak(test6);
console.log(`Complete week with 2 sessions on Sun + 1 on Tue = 3 total: ${result6.longestStreak} days`);
console.log(`Expected: 7 days (3 strength sessions total)`);
console.log(`Status: ${result6.longestStreak === 7 ? '✓ PASS' : '✗ FAIL'}\n`);

console.log('=== SUMMARY ===');
const allTests = [result1, result2, result3, result4, result5, result6];
const expected = [6, 6, 7, 0, 2, 7];
const passed = allTests.filter((r, i) => r.longestStreak === expected[i]).length;
console.log(`Overall: ${passed}/6 tests passed`);
console.log(passed === 6 ? '\n✅ All requirements validated successfully!' : '\n❌ Some tests failed');

