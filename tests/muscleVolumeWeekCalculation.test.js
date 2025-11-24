/**
 * Tests for Muscle Volume Tracker Week Calculation
 * 
 * Tests the week block calculation (Sun-Sat) functionality
 */

/**
 * Get the Sunday (start) of a week for a given date
 */
const getWeekStart = (date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay();
  const diff = day; // Sunday is 0, so diff is how many days to go back
  d.setDate(d.getDate() - diff);
  return d;
};

/**
 * Get the Saturday (end) of a week for a given date
 */
const getWeekEnd = (date) => {
  const start = getWeekStart(date);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return end;
};

/**
 * Format a date range
 */
const formatWeekRange = (start, end) => {
  const startMonth = start.toLocaleDateString('en-US', { month: 'short' });
  const startDay = start.getDate();
  const endMonth = end.toLocaleDateString('en-US', { month: 'short' });
  const endDay = end.getDate();
  const year = end.getFullYear();
  
  if (startMonth === endMonth) {
    return `${startMonth} ${startDay} - ${endDay}, ${year}`;
  } else {
    return `${startMonth} ${startDay} - ${endMonth} ${endDay}, ${year}`;
  }
};

// Test Cases
console.log('=== Muscle Volume Tracker Week Calculation Tests ===\n');

// Test 1: Week calculation for a Wednesday
console.log('Test 1: Week calculation for Wednesday, Nov 20, 2024');
const wed = new Date('2024-11-20T12:00:00');
const wedStart = getWeekStart(wed);
const wedEnd = getWeekEnd(wed);
console.log('  Input:', wed.toDateString());
console.log('  Week Start (Sunday):', wedStart.toDateString());
console.log('  Week End (Saturday):', wedEnd.toDateString());
console.log('  Formatted:', formatWeekRange(wedStart, wedEnd));
console.log('  ✓ Expected: Sun Nov 17 - Sat Nov 23');
console.log('');

// Test 2: Week calculation for a Sunday
console.log('Test 2: Week calculation for Sunday, Nov 17, 2024');
const sun = new Date('2024-11-17T12:00:00');
const sunStart = getWeekStart(sun);
const sunEnd = getWeekEnd(sun);
console.log('  Input:', sun.toDateString());
console.log('  Week Start (Sunday):', sunStart.toDateString());
console.log('  Week End (Saturday):', sunEnd.toDateString());
console.log('  Formatted:', formatWeekRange(sunStart, sunEnd));
console.log('  ✓ Expected: Sun Nov 17 - Sat Nov 23');
console.log('');

// Test 3: Week calculation for a Saturday
console.log('Test 3: Week calculation for Saturday, Nov 23, 2024');
const sat = new Date('2024-11-23T12:00:00');
const satStart = getWeekStart(sat);
const satEnd = getWeekEnd(sat);
console.log('  Input:', sat.toDateString());
console.log('  Week Start (Sunday):', satStart.toDateString());
console.log('  Week End (Saturday):', satEnd.toDateString());
console.log('  Formatted:', formatWeekRange(satStart, satEnd));
console.log('  ✓ Expected: Sun Nov 17 - Sat Nov 23');
console.log('');

// Test 4: Week span across two months
console.log('Test 4: Week spanning two months (Nov-Dec 2024)');
const endOfMonth = new Date('2024-11-28T12:00:00');
const endStart = getWeekStart(endOfMonth);
const endEnd = getWeekEnd(endOfMonth);
console.log('  Input:', endOfMonth.toDateString());
console.log('  Week Start (Sunday):', endStart.toDateString());
console.log('  Week End (Saturday):', endEnd.toDateString());
console.log('  Formatted:', formatWeekRange(endStart, endEnd));
console.log('  ✓ Expected: Nov 24 - Nov 30, 2024');
console.log('');

// Test 5: Week offset calculation
console.log('Test 5: Week offset calculation');
const today = new Date('2024-11-23T12:00:00');
const currentWeekStart = getWeekStart(today);

console.log('  Current week start:', currentWeekStart.toDateString());

// One week back
const lastWeekDate = new Date(currentWeekStart);
lastWeekDate.setDate(lastWeekDate.getDate() + (-1 * 7));
const lastWeekStart = getWeekStart(lastWeekDate);
const lastWeekEnd = getWeekEnd(lastWeekDate);
console.log('  Last week (offset -1):', formatWeekRange(lastWeekStart, lastWeekEnd));
console.log('  ✓ Expected: Nov 10 - 16, 2024');

// Two weeks back
const twoWeeksDate = new Date(currentWeekStart);
twoWeeksDate.setDate(twoWeeksDate.getDate() + (-2 * 7));
const twoWeeksStart = getWeekStart(twoWeeksDate);
const twoWeeksEnd = getWeekEnd(twoWeeksDate);
console.log('  Two weeks back (offset -2):', formatWeekRange(twoWeeksStart, twoWeeksEnd));
console.log('  ✓ Expected: Nov 3 - 9, 2024');
console.log('');

console.log('=== All Tests Complete ===');
