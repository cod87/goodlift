/**
 * Tests for Calendar Cardio Marker Display Logic
 * 
 * Tests that all cardio session types (including manual entries with specific 
 * cardio subtypes like running, cycling, swimming, general) are correctly 
 * displayed with a red 'C' marker on the calendar.
 * 
 * Related issue: Manually logged cardio sessions were incorrectly marked with 
 * a green 'X' instead of a red 'C'.
 */

// Cardio subtypes that should be treated as cardio
// Must match the list in MonthCalendarView.jsx
const cardioSubtypes = ['running', 'cycling', 'swimming', 'general'];

// Replicate the getWorkoutTypeLabel logic from MonthCalendarView.jsx
const getWorkoutTypeLabel = (type) => {
  if (!type) return 'X';
  
  const normalizedType = type.toLowerCase();
  
  // Check if this is a cardio subtype
  if (cardioSubtypes.includes(normalizedType)) {
    return 'C';
  }
  
  const labelMap = {
    'upper': 'UP',
    'lower': 'LO',
    'full': 'FL',
    'push': 'PS',
    'pull': 'PL',
    'legs': 'LG',
    'yoga': 'Y',
    'hiit': 'H',
    'cardio': 'C',
  };
  
  return labelMap[normalizedType] || 'X';
};

// Replicate the getWorkoutColor logic from MonthCalendarView.jsx
const getWorkoutColor = (type) => {
  if (!type) return 'primary.main';
  
  const normalizedType = type.toLowerCase();
  
  if (normalizedType === 'cardio' || normalizedType === 'hiit' || cardioSubtypes.includes(normalizedType)) {
    return 'error.main';
  } else if (normalizedType === 'stretch' || normalizedType === 'active_recovery' || normalizedType === 'yoga' || normalizedType === 'mobility') {
    return 'secondary.main';
  } else if (normalizedType === 'rest') {
    return 'action.disabled';
  } else {
    return 'primary.main'; // Strength training
  }
};

console.log('=== Calendar Cardio Marker Display Tests ===\n');

// Track test results
let passed = 0;
let failed = 0;

const test = (name, fn) => {
  try {
    const result = fn();
    if (result) {
      console.log(`  ✓ ${name}`);
      passed++;
    } else {
      console.log(`  ✗ FAIL: ${name}`);
      failed++;
    }
  } catch (error) {
    console.log(`  ✗ ERROR: ${name} - ${error.message}`);
    failed++;
  }
};

// Test 1: Basic cardio type returns 'C' label
console.log('Test 1: Basic cardio type returns "C" label');
test('cardio type returns "C"', () => getWorkoutTypeLabel('cardio') === 'C');
console.log('');

// Test 2: All cardio subtypes return 'C' label
console.log('Test 2: All cardio subtypes return "C" label');
test('running returns "C"', () => getWorkoutTypeLabel('running') === 'C');
test('cycling returns "C"', () => getWorkoutTypeLabel('cycling') === 'C');
test('swimming returns "C"', () => getWorkoutTypeLabel('swimming') === 'C');
test('general returns "C"', () => getWorkoutTypeLabel('general') === 'C');
console.log('');

// Test 3: HIIT returns 'H' label (should not be affected)
console.log('Test 3: HIIT returns "H" label (unchanged)');
test('hiit returns "H"', () => getWorkoutTypeLabel('hiit') === 'H');
console.log('');

// Test 4: Case insensitivity for cardio subtypes
console.log('Test 4: Case insensitivity for cardio subtypes');
test('RUNNING (uppercase) returns "C"', () => getWorkoutTypeLabel('RUNNING') === 'C');
test('Cycling (mixed case) returns "C"', () => getWorkoutTypeLabel('Cycling') === 'C');
test('CARDIO (uppercase) returns "C"', () => getWorkoutTypeLabel('CARDIO') === 'C');
console.log('');

// Test 5: Basic cardio type returns red color
console.log('Test 5: Basic cardio type returns red color (error.main)');
test('cardio returns "error.main"', () => getWorkoutColor('cardio') === 'error.main');
console.log('');

// Test 6: All cardio subtypes return red color
console.log('Test 6: All cardio subtypes return red color (error.main)');
test('running returns "error.main"', () => getWorkoutColor('running') === 'error.main');
test('cycling returns "error.main"', () => getWorkoutColor('cycling') === 'error.main');
test('swimming returns "error.main"', () => getWorkoutColor('swimming') === 'error.main');
test('general returns "error.main"', () => getWorkoutColor('general') === 'error.main');
console.log('');

// Test 7: HIIT returns red color (unchanged behavior)
console.log('Test 7: HIIT returns red color (unchanged behavior)');
test('hiit returns "error.main"', () => getWorkoutColor('hiit') === 'error.main');
console.log('');

// Test 8: Yoga returns secondary color (unchanged)
console.log('Test 8: Yoga returns secondary color (unchanged)');
test('yoga returns "secondary.main"', () => getWorkoutColor('yoga') === 'secondary.main');
console.log('');

// Test 9: Strength types return primary color (unchanged)
console.log('Test 9: Strength types return primary color (unchanged)');
test('upper returns "primary.main"', () => getWorkoutColor('upper') === 'primary.main');
test('push returns "primary.main"', () => getWorkoutColor('push') === 'primary.main');
test('legs returns "primary.main"', () => getWorkoutColor('legs') === 'primary.main');
console.log('');

// Test 10: Non-cardio unknown types still return 'X' label
console.log('Test 10: Unknown types return "X" label');
test('unknown returns "X"', () => getWorkoutTypeLabel('unknown') === 'X');
test('null returns "X"', () => getWorkoutTypeLabel(null) === 'X');
test('undefined returns "X"', () => getWorkoutTypeLabel(undefined) === 'X');
console.log('');

// Summary
console.log('=== Tests Complete ===');
console.log(`Passed: ${passed}, Failed: ${failed}`);
if (failed > 0) {
  process.exit(1);
}
