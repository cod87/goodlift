/**
 * Tests for Deload Week Calendar Highlighting
 * 
 * Tests that when a deload session is completed in any day of a week,
 * all days in that week (Sunday through Saturday) are highlighted in yellow.
 */

console.log('=== Deload Week Calendar Highlighting Tests ===\n');

import { startOfWeek, endOfWeek, addDays } from 'date-fns';

// Helper function to check if a date is in a deload week
// This mirrors the logic from MonthCalendarView.jsx
const isDateInDeloadWeek = (date, workoutHistory) => {
  const weekStart = startOfWeek(date, { weekStartsOn: 0 }); // 0 = Sunday
  const weekEnd = endOfWeek(date, { weekStartsOn: 0 });
  
  return workoutHistory.some(workout => {
    const workoutDate = new Date(workout.date);
    return workoutDate >= weekStart && 
           workoutDate <= weekEnd && 
           workout.isDeload === true;
  });
};

// Test 1: Entire week is highlighted when deload session on Monday
console.log('Test 1: Deload session on Monday highlights entire week');
console.log('-------------------------------------------------------');

const monday = new Date('2024-01-08'); // Monday, Jan 8, 2024
const workoutHistory1 = [
  { date: '2024-01-08T10:00:00Z', isDeload: true, type: 'strength' },
];

const sunday = new Date('2024-01-07');
const tuesday = new Date('2024-01-09');
const saturday = new Date('2024-01-13');
const nextSunday = new Date('2024-01-14');

console.log('Deload session: Monday, Jan 8, 2024');
console.log(`Sunday (Jan 7) in deload week: ${isDateInDeloadWeek(sunday, workoutHistory1)}`);
console.log(`Monday (Jan 8) in deload week: ${isDateInDeloadWeek(monday, workoutHistory1)}`);
console.log(`Tuesday (Jan 9) in deload week: ${isDateInDeloadWeek(tuesday, workoutHistory1)}`);
console.log(`Saturday (Jan 13) in deload week: ${isDateInDeloadWeek(saturday, workoutHistory1)}`);
console.log(`Next Sunday (Jan 14) in deload week: ${isDateInDeloadWeek(nextSunday, workoutHistory1)}`);

const allDaysHighlighted = 
  isDateInDeloadWeek(sunday, workoutHistory1) &&
  isDateInDeloadWeek(monday, workoutHistory1) &&
  isDateInDeloadWeek(tuesday, workoutHistory1) &&
  isDateInDeloadWeek(saturday, workoutHistory1);

const nextWeekNotHighlighted = !isDateInDeloadWeek(nextSunday, workoutHistory1);

console.log(`\nResult: ${allDaysHighlighted && nextWeekNotHighlighted ? '✓ PASS' : '✗ FAIL'}\n`);

// Test 2: Entire week is highlighted when deload session on Friday
console.log('Test 2: Deload session on Friday highlights entire week');
console.log('--------------------------------------------------------');

const friday = new Date('2024-01-12'); // Friday, Jan 12, 2024
const workoutHistory2 = [
  { date: '2024-01-12T10:00:00Z', isDeload: true, type: 'strength' },
];

const sunday2 = new Date('2024-01-07');
const wednesday2 = new Date('2024-01-10');
const saturday2 = new Date('2024-01-13');
const prevSaturday = new Date('2024-01-06');

console.log('Deload session: Friday, Jan 12, 2024');
console.log(`Sunday (Jan 7) in deload week: ${isDateInDeloadWeek(sunday2, workoutHistory2)}`);
console.log(`Wednesday (Jan 10) in deload week: ${isDateInDeloadWeek(wednesday2, workoutHistory2)}`);
console.log(`Friday (Jan 12) in deload week: ${isDateInDeloadWeek(friday, workoutHistory2)}`);
console.log(`Saturday (Jan 13) in deload week: ${isDateInDeloadWeek(saturday2, workoutHistory2)}`);
console.log(`Previous Saturday (Jan 6) in deload week: ${isDateInDeloadWeek(prevSaturday, workoutHistory2)}`);

const allDaysHighlighted2 = 
  isDateInDeloadWeek(sunday2, workoutHistory2) &&
  isDateInDeloadWeek(wednesday2, workoutHistory2) &&
  isDateInDeloadWeek(friday, workoutHistory2) &&
  isDateInDeloadWeek(saturday2, workoutHistory2);

const prevWeekNotHighlighted = !isDateInDeloadWeek(prevSaturday, workoutHistory2);

console.log(`\nResult: ${allDaysHighlighted2 && prevWeekNotHighlighted ? '✓ PASS' : '✗ FAIL'}\n`);

// Test 3: Multiple deload sessions in same week (all days still highlighted once)
console.log('Test 3: Multiple deload sessions in same week');
console.log('----------------------------------------------');

const workoutHistory3 = [
  { date: '2024-01-08T10:00:00Z', isDeload: true, type: 'strength' },
  { date: '2024-01-10T10:00:00Z', isDeload: true, type: 'strength' },
];

const monday3 = new Date('2024-01-08');
const wednesday3 = new Date('2024-01-10');
const thursday3 = new Date('2024-01-11');

console.log('Deload sessions: Monday (Jan 8) and Wednesday (Jan 10), 2024');
console.log(`Monday in deload week: ${isDateInDeloadWeek(monday3, workoutHistory3)}`);
console.log(`Wednesday in deload week: ${isDateInDeloadWeek(wednesday3, workoutHistory3)}`);
console.log(`Thursday in deload week: ${isDateInDeloadWeek(thursday3, workoutHistory3)}`);

const allDaysHighlighted3 = 
  isDateInDeloadWeek(monday3, workoutHistory3) &&
  isDateInDeloadWeek(wednesday3, workoutHistory3) &&
  isDateInDeloadWeek(thursday3, workoutHistory3);

console.log(`\nResult: ${allDaysHighlighted3 ? '✓ PASS' : '✗ FAIL'}\n`);

// Test 4: Deload sessions in different weeks highlight only their respective weeks
console.log('Test 4: Deload sessions in different weeks');
console.log('-------------------------------------------');

const workoutHistory4 = [
  { date: '2024-01-08T10:00:00Z', isDeload: true, type: 'strength' }, // Week 1
  { date: '2024-01-22T10:00:00Z', isDeload: true, type: 'strength' }, // Week 3
];

const week1Monday = new Date('2024-01-08');
const week1Saturday = new Date('2024-01-13');
const week2Wednesday = new Date('2024-01-17');
const week3Monday = new Date('2024-01-22');
const week3Saturday = new Date('2024-01-27');

console.log('Deload sessions: Jan 8 (Week 1) and Jan 22 (Week 3)');
console.log(`Week 1 Monday in deload week: ${isDateInDeloadWeek(week1Monday, workoutHistory4)}`);
console.log(`Week 1 Saturday in deload week: ${isDateInDeloadWeek(week1Saturday, workoutHistory4)}`);
console.log(`Week 2 Wednesday in deload week: ${isDateInDeloadWeek(week2Wednesday, workoutHistory4)}`);
console.log(`Week 3 Monday in deload week: ${isDateInDeloadWeek(week3Monday, workoutHistory4)}`);
console.log(`Week 3 Saturday in deload week: ${isDateInDeloadWeek(week3Saturday, workoutHistory4)}`);

const week1Highlighted = 
  isDateInDeloadWeek(week1Monday, workoutHistory4) &&
  isDateInDeloadWeek(week1Saturday, workoutHistory4);

const week2NotHighlighted = !isDateInDeloadWeek(week2Wednesday, workoutHistory4);

const week3Highlighted = 
  isDateInDeloadWeek(week3Monday, workoutHistory4) &&
  isDateInDeloadWeek(week3Saturday, workoutHistory4);

console.log(`\nResult: ${week1Highlighted && week2NotHighlighted && week3Highlighted ? '✓ PASS' : '✗ FAIL'}\n`);

// Test 5: Non-deload workouts don't highlight the week
console.log('Test 5: Non-deload workouts don\'t highlight the week');
console.log('----------------------------------------------------');

const workoutHistory5 = [
  { date: '2024-01-08T10:00:00Z', isDeload: false, type: 'strength' },
  { date: '2024-01-10T10:00:00Z', type: 'strength' }, // No isDeload property
];

const monday5 = new Date('2024-01-08');
const wednesday5 = new Date('2024-01-10');

console.log('Workouts: Jan 8 (isDeload: false) and Jan 10 (no isDeload property)');
console.log(`Monday in deload week: ${isDateInDeloadWeek(monday5, workoutHistory5)}`);
console.log(`Wednesday in deload week: ${isDateInDeloadWeek(wednesday5, workoutHistory5)}`);

const noHighlighting = 
  !isDateInDeloadWeek(monday5, workoutHistory5) &&
  !isDateInDeloadWeek(wednesday5, workoutHistory5);

console.log(`\nResult: ${noHighlighting ? '✓ PASS' : '✗ FAIL'}\n`);

// Test 6: Week boundaries (Sunday to Saturday)
console.log('Test 6: Week boundaries (Sunday to Saturday)');
console.log('---------------------------------------------');

// Deload on Sunday should highlight Sun-Sat
const workoutHistory6 = [
  { date: '2024-01-07T10:00:00Z', isDeload: true, type: 'strength' }, // Sunday
];

const sunday6 = new Date('2024-01-07');
const saturday6 = new Date('2024-01-13');
const prevSaturday6 = new Date('2024-01-06');
const nextSunday6 = new Date('2024-01-14');

console.log('Deload session: Sunday, Jan 7, 2024');
console.log(`Sunday (Jan 7) in deload week: ${isDateInDeloadWeek(sunday6, workoutHistory6)}`);
console.log(`Saturday (Jan 13) in deload week: ${isDateInDeloadWeek(saturday6, workoutHistory6)}`);
console.log(`Previous Saturday (Jan 6) in deload week: ${isDateInDeloadWeek(prevSaturday6, workoutHistory6)}`);
console.log(`Next Sunday (Jan 14) in deload week: ${isDateInDeloadWeek(nextSunday6, workoutHistory6)}`);

const correctBoundaries = 
  isDateInDeloadWeek(sunday6, workoutHistory6) &&
  isDateInDeloadWeek(saturday6, workoutHistory6) &&
  !isDateInDeloadWeek(prevSaturday6, workoutHistory6) &&
  !isDateInDeloadWeek(nextSunday6, workoutHistory6);

console.log(`\nResult: ${correctBoundaries ? '✓ PASS' : '✗ FAIL'}\n`);

console.log('=== All Deload Week Calendar Highlighting Tests Complete ===');
