#!/usr/bin/env node

/**
 * Debug the streak calculation
 */

// I'll manually trace through the logic
const workouts = [
  { date: new Date('2025-11-10T12:00:00').toISOString(), type: 'strength' }, // Sun
  { date: new Date('2025-11-11T12:00:00').toISOString(), type: 'cardio' },    // Mon
  { date: new Date('2025-11-12T12:00:00').toISOString(), type: 'strength' }, // Tue
  { date: new Date('2025-11-13T12:00:00').toISOString(), type: 'cardio' },    // Wed
  { date: new Date('2025-11-14T12:00:00').toISOString(), type: 'cardio' },    // Thu
  { date: new Date('2025-11-15T12:00:00').toISOString(), type: 'cardio' },    // Fri
  { date: new Date('2025-11-16T12:00:00').toISOString(), type: 'cardio' },    // Sat
];

// When we try len=7: Sunday(0) through Saturday(6) are all present, so it's complete
// But only 2 strength sessions, so it should fail

// When we try len=6: Sunday(0) through Friday(5) are present
// Missing Saturday(6), so it's incomplete? Let's check:
// daysPresent = {0, 1, 2, 3, 4, 5}
// daysPresent.has(0) = true (Sunday)
// daysPresent.has(6) = false (Saturday missing)
// So isCompleteWeek = false, and it passes!

console.log('The issue: When we try len=6 (Sun-Fri), Saturday is missing');
console.log('So it\'s considered an incomplete week and allowed to pass');
console.log('');
console.log('Solution: We need to check if the week WOULD be complete');
console.log('based on the original streak, not the shortened version');

