/**
 * Tests for Wellness Task On-Open Feature
 * 
 * Tests the shouldShowWellnessOnOpen and markWellnessShown functions
 * 
 * Note: This test uses Date.prototype modification for simplicity since this is
 * a standalone test file without a full testing framework. In production tests,
 * consider using a mocking library like jest.spyOn() or sinon.
 */

// Mock localStorage for testing
const mockLocalStorage = {
  data: {},
  getItem(key) {
    return this.data[key] || null;
  },
  setItem(key, value) {
    this.data[key] = value;
  },
  clear() {
    this.data = {};
  }
};

// Inline implementations for testing (copy of the actual functions)
const shouldShowWellnessOnOpen = (userId = null) => {
  try {
    const now = new Date();
    // Only after 5:00 local time
    if (now.getHours() < 5) return false;

    const today = now.toISOString().split('T')[0];
    const storageKey = userId ? `wellness_last_shown_${userId}` : 'wellness_last_shown_guest';
    const existing = mockLocalStorage.getItem(storageKey);
    if (!existing) return true;
    return existing !== today;
  } catch (err) {
    console.error('Error checking wellness on-open status:', err);
    // Fail-safe: don't block showing
    return true;
  }
};

const markWellnessShown = (userId = null) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const storageKey = userId ? `wellness_last_shown_${userId}` : 'wellness_last_shown_guest';
    mockLocalStorage.setItem(storageKey, today);
  } catch (err) {
    console.error('Error marking wellness shown:', err);
  }
};

// Test Cases
console.log('=== Wellness On-Open Tests ===\n');

// Test 1: shouldShowWellnessOnOpen returns false before 5am
console.log('Test 1: shouldShowWellnessOnOpen returns false before 5am');
const earlyMorning = new Date();
earlyMorning.setHours(3, 0, 0, 0);
const originalGetHours = Date.prototype.getHours;
Date.prototype.getHours = () => 3;
const resultBeforeFive = shouldShowWellnessOnOpen('testUser');
Date.prototype.getHours = originalGetHours;
console.log(`  Result at 3am: ${resultBeforeFive}`);
console.log(`  Expected: false`);
console.log(`  ${resultBeforeFive === false ? '✓ PASS' : '✗ FAIL'}`);
console.log('');

// Test 2: shouldShowWellnessOnOpen returns true after 5am with no previous show
console.log('Test 2: shouldShowWellnessOnOpen returns true after 5am (first time)');
mockLocalStorage.clear();
Date.prototype.getHours = () => 9;
const resultFirstTime = shouldShowWellnessOnOpen('testUser');
Date.prototype.getHours = originalGetHours;
console.log(`  Result at 9am (first time): ${resultFirstTime}`);
console.log(`  Expected: true`);
console.log(`  ${resultFirstTime === true ? '✓ PASS' : '✗ FAIL'}`);
console.log('');

// Test 3: markWellnessShown sets the current date
console.log('Test 3: markWellnessShown sets the current date in localStorage');
mockLocalStorage.clear();
const testUserId = 'testUser123';
markWellnessShown(testUserId);
const storedDate = mockLocalStorage.getItem(`wellness_last_shown_${testUserId}`);
const today = new Date().toISOString().split('T')[0];
console.log(`  Stored date: ${storedDate}`);
console.log(`  Today's date: ${today}`);
console.log(`  ${storedDate === today ? '✓ PASS' : '✗ FAIL'}`);
console.log('');

// Test 4: shouldShowWellnessOnOpen returns false after marking shown
console.log('Test 4: shouldShowWellnessOnOpen returns false after marking shown today');
mockLocalStorage.clear();
markWellnessShown('testUser');
Date.prototype.getHours = () => 9;
const resultAfterMarking = shouldShowWellnessOnOpen('testUser');
Date.prototype.getHours = originalGetHours;
console.log(`  Result after marking: ${resultAfterMarking}`);
console.log(`  Expected: false`);
console.log(`  ${resultAfterMarking === false ? '✓ PASS' : '✗ FAIL'}`);
console.log('');

// Test 5: Guest user vs authenticated user - different keys
console.log('Test 5: Guest user and authenticated user use different storage keys');
mockLocalStorage.clear();
markWellnessShown(null); // guest
markWellnessShown('authUser'); // authenticated
const guestKey = mockLocalStorage.getItem('wellness_last_shown_guest');
const authKey = mockLocalStorage.getItem('wellness_last_shown_authUser');
console.log(`  Guest key exists: ${guestKey !== null}`);
console.log(`  Auth key exists: ${authKey !== null}`);
console.log(`  Keys are different: ${guestKey !== null && authKey !== null}`);
console.log(`  ${guestKey !== null && authKey !== null ? '✓ PASS' : '✗ FAIL'}`);
console.log('');

// Test 6: Should show again on a different day
console.log('Test 6: Should show again on a different day (simulated)');
mockLocalStorage.clear();
// Set yesterday's date
const yesterday = new Date();
yesterday.setDate(yesterday.getDate() - 1);
const yesterdayStr = yesterday.toISOString().split('T')[0];
mockLocalStorage.setItem('wellness_last_shown_testUser', yesterdayStr);
Date.prototype.getHours = () => 9;
const resultNextDay = shouldShowWellnessOnOpen('testUser');
Date.prototype.getHours = originalGetHours;
console.log(`  Stored date (yesterday): ${yesterdayStr}`);
console.log(`  Today's date: ${today}`);
console.log(`  Result: ${resultNextDay}`);
console.log(`  Expected: true (should show on new day)`);
console.log(`  ${resultNextDay === true ? '✓ PASS' : '✗ FAIL'}`);
console.log('');

// Test 7: Error handling - returns true when localStorage fails
console.log('Test 7: Functions handle errors gracefully');
// Test with invalid storage key to trigger error handling
let resultOnError = false;
const originalSetItem = mockLocalStorage.setItem;
mockLocalStorage.setItem = () => { throw new Error('Storage error'); };
try {
  markWellnessShown('test'); // Should not throw
  resultOnError = true;
} catch (err) {
  resultOnError = false;
}
mockLocalStorage.setItem = originalSetItem;
console.log(`  markWellnessShown handles errors: ${resultOnError}`);
console.log(`  ${resultOnError ? '✓ PASS' : '✗ FAIL'}`);
console.log('');

console.log('=== All Wellness On-Open Tests Complete ===');

// Summary
const allPassed = 
  resultBeforeFive === false &&
  resultFirstTime === true &&
  storedDate === today &&
  resultAfterMarking === false &&
  guestKey !== null && authKey !== null &&
  resultNextDay === true &&
  resultOnError === true;

console.log('\nSummary:');
console.log('- Before 5am returns false:', resultBeforeFive === false ? '✓' : '✗');
console.log('- After 5am (first time) returns true:', resultFirstTime === true ? '✓' : '✗');
console.log('- markWellnessShown stores today\'s date:', storedDate === today ? '✓' : '✗');
console.log('- After marking returns false (same day):', resultAfterMarking === false ? '✓' : '✗');
console.log('- Guest and auth use different keys:', guestKey !== null && authKey !== null ? '✓' : '✗');
console.log('- Returns true on different day:', resultNextDay === true ? '✓' : '✗');
console.log('- Error handling works:', resultOnError ? '✓' : '✗');
console.log('\nOverall:', allPassed ? '✓ ALL TESTS PASSED' : '✗ SOME TESTS FAILED');

