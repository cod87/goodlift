/**
 * Demo script to showcase the adherence tracking fix
 * 
 * This demonstrates the before/after behavior of adherence tracking
 * showing how the current day is now treated as neutral until a session is logged.
 */

import { calculateAdherence } from '../src/utils/trackingMetrics.js';

// Helper to create a date N days ago at midnight
const daysAgo = (n) => {
  const date = new Date();
  date.setDate(date.getDate() - n);
  date.setHours(0, 0, 0, 0);
  return date.toISOString();
};

// Helper to create today's date
const today = () => {
  const date = new Date();
  date.setHours(12, 0, 0, 0); // Midday to simulate a workout today
  return date.toISOString();
};

console.log('╔═══════════════════════════════════════════════════════════════╗');
console.log('║     ADHERENCE TRACKING FIX - USER EXPERIENCE DEMO             ║');
console.log('╚═══════════════════════════════════════════════════════════════╝\n');

console.log('SCENARIO: A user has been working out consistently');
console.log('They worked out the last 5 days (yesterday through 5 days ago)\n');

const workoutHistory = [
  { date: daysAgo(1), type: 'strength', name: 'Upper Body' },
  { date: daysAgo(2), type: 'cardio', name: 'Running' },
  { date: daysAgo(3), type: 'strength', name: 'Lower Body' },
  { date: daysAgo(4), type: 'strength', name: 'Full Body' },
  { date: daysAgo(5), type: 'cardio', name: 'Cycling' },
];

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('  BEFORE FIX - Current day counted as missed                  ');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

console.log('User opens app in the morning (hasn\'t worked out today yet):\n');
console.log('  Old Calculation:');
console.log('    ❌ Days with sessions: 5');
console.log('    ❌ Total days: 6 (including today)');
console.log('    ❌ Adherence: 83% (5/6)');
console.log('    ❌ Problem: Today is automatically counted as MISSED!\n');

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('  AFTER FIX - Current day is neutral until session logged     ');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

const adherenceBeforeToday = calculateAdherence(workoutHistory, null, 30);

console.log('User opens app in the morning (hasn\'t worked out today yet):\n');
console.log('  New Calculation:');
console.log(`    ✅ Days with sessions: 5`);
console.log(`    ✅ Total days: 5 (yesterday and before, today excluded)`);
console.log(`    ✅ Adherence: ${adherenceBeforeToday}% (5/5)`);
console.log('    ✅ Solution: Today is NOT counted until end of day!\n');

console.log('═══════════════════════════════════════════════════════════════\n');

console.log('User completes a workout today:\n');

const workoutHistoryWithToday = [
  { date: today(), type: 'strength', name: 'Push Day' },
  ...workoutHistory
];

const adherenceAfterToday = calculateAdherence(workoutHistoryWithToday, null, 30);

console.log('  Updated Calculation:');
console.log(`    ✅ Days with sessions: 6`);
console.log(`    ✅ Total days: 6 (including today)`);
console.log(`    ✅ Adherence: ${adherenceAfterToday}% (6/6)`);
console.log('    ✅ Result: Perfect adherence maintained!\n');

console.log('═══════════════════════════════════════════════════════════════\n');

console.log('KEY BENEFITS:');
console.log('  ✓ No penalty for checking progress early in the day');
console.log('  ✓ Current day only counts after completing a session');
console.log('  ✓ Adherence reflects actual performance accurately');
console.log('  ✓ Updates immediately when session is logged\n');

console.log('═══════════════════════════════════════════════════════════════\n');
