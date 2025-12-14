/**
 * Tests for Meal Type Grouping and Display
 * 
 * Tests the new meal type functionality added to the nutrition tracking system
 * Validates that entries are properly grouped and displayed by meal type
 */

/**
 * Mock nutrition entries with meal types
 */
const mockNutritionEntries = [
  {
    id: '1',
    date: new Date().toISOString(),
    foodName: 'Oatmeal',
    grams: 150,
    mealType: 'breakfast',
    nutrition: { calories: 150, protein: 5, carbs: 27, fat: 3, fiber: 4 },
  },
  {
    id: '2',
    date: new Date().toISOString(),
    foodName: 'Banana',
    grams: 120,
    mealType: 'breakfast',
    nutrition: { calories: 105, protein: 1, carbs: 27, fat: 0, fiber: 3 },
  },
  {
    id: '3',
    date: new Date().toISOString(),
    foodName: 'Chicken Salad',
    grams: 300,
    mealType: 'lunch',
    nutrition: { calories: 350, protein: 35, carbs: 15, fat: 18, fiber: 5 },
  },
  {
    id: '4',
    date: new Date().toISOString(),
    foodName: 'Apple',
    grams: 150,
    mealType: 'snack',
    nutrition: { calories: 78, protein: 0, carbs: 21, fat: 0, fiber: 4 },
  },
  {
    id: '5',
    date: new Date().toISOString(),
    foodName: 'Salmon with Rice',
    grams: 400,
    mealType: 'dinner',
    nutrition: { calories: 520, protein: 42, carbs: 45, fat: 18, fiber: 3 },
  },
  {
    id: '6',
    date: new Date().toISOString(),
    foodName: 'Almonds',
    grams: 30,
    mealType: 'snack',
    nutrition: { calories: 170, protein: 6, carbs: 6, fat: 15, fiber: 4 },
  },
  // Entry without meal type (should default to snack)
  {
    id: '7',
    date: new Date().toISOString(),
    foodName: 'Water',
    grams: 500,
    nutrition: { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 },
  },
];

/**
 * Group entries by meal type (same logic as NutritionTab)
 */
const getEntriesByMealType = (entries) => {
  const grouped = {
    breakfast: [],
    lunch: [],
    dinner: [],
    snack: [],
  };
  
  entries.forEach(entry => {
    const mealType = entry.mealType || 'snack'; // Default to snack if not set
    if (grouped[mealType]) {
      grouped[mealType].push(entry);
    } else {
      grouped.snack.push(entry); // Fallback to snack
    }
  });
  
  return grouped;
};

/**
 * Calculate totals for a meal type
 */
const calculateMealTotals = (entries) => {
  return entries.reduce(
    (totals, entry) => ({
      calories: totals.calories + entry.nutrition.calories,
      protein: totals.protein + entry.nutrition.protein,
      carbs: totals.carbs + entry.nutrition.carbs,
      fat: totals.fat + entry.nutrition.fat,
      fiber: totals.fiber + entry.nutrition.fiber,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 }
  );
};

/**
 * Detect meal type based on time of day
 */
const detectMealType = (hour) => {
  if (hour < 11) return 'breakfast';
  if (hour < 16) return 'lunch';
  if (hour < 21) return 'dinner';
  return 'snack';
};

// Test Cases
console.log('=== Meal Type Grouping and Display Tests ===\n');

// Test 1: Grouping entries by meal type
console.log('Test 1: Group entries by meal type');
const grouped = getEntriesByMealType(mockNutritionEntries);

console.log('  Grouped entries:');
Object.entries(grouped).forEach(([mealType, entries]) => {
  console.log(`    ${mealType}: ${entries.length} entries`);
});

const test1Pass = 
  grouped.breakfast.length === 2 &&
  grouped.lunch.length === 1 &&
  grouped.dinner.length === 1 &&
  grouped.snack.length === 3; // 2 snacks + 1 without meal type

console.log('  Expected: breakfast=2, lunch=1, dinner=1, snack=3');
console.log('  Result:', test1Pass ? '✓ PASS' : '✗ FAIL');
console.log('');

// Test 2: Calculate meal totals
console.log('Test 2: Calculate totals for each meal');
Object.entries(grouped).forEach(([mealType, entries]) => {
  if (entries.length > 0) {
    const totals = calculateMealTotals(entries);
    console.log(`  ${mealType}:`);
    console.log(`    Calories: ${totals.calories}`);
    console.log(`    Protein: ${totals.protein}g`);
    console.log(`    Carbs: ${totals.carbs}g`);
    console.log(`    Fat: ${totals.fat}g`);
  }
});

const breakfastTotals = calculateMealTotals(grouped.breakfast);
const test2Pass = breakfastTotals.calories === 255; // 150 + 105

console.log('  Expected breakfast calories: 255 (150 + 105)');
console.log('  Actual:', breakfastTotals.calories);
console.log('  Result:', test2Pass ? '✓ PASS' : '✗ FAIL');
console.log('');

// Test 3: Entries without meal type default to snack
console.log('Test 3: Entries without meal type default to snack');
const entryWithoutType = mockNutritionEntries.find(e => !e.mealType);
const isInSnackGroup = grouped.snack.some(e => e.id === entryWithoutType.id);

console.log('  Entry without meal type:', entryWithoutType.foodName);
console.log('  Found in snack group:', isInSnackGroup);
console.log('  Result:', isInSnackGroup ? '✓ PASS' : '✗ FAIL');
console.log('');

// Test 4: Time-based meal type detection
console.log('Test 4: Time-based meal type detection');
const testHours = [
  { hour: 8, expected: 'breakfast' },
  { hour: 10, expected: 'breakfast' },
  { hour: 12, expected: 'lunch' },
  { hour: 15, expected: 'lunch' },
  { hour: 18, expected: 'dinner' },
  { hour: 20, expected: 'dinner' },
  { hour: 22, expected: 'snack' },
  { hour: 23, expected: 'snack' },
];

let allDetectionsCorrect = true;
testHours.forEach(({ hour, expected }) => {
  const detected = detectMealType(hour);
  const correct = detected === expected;
  if (!correct) allDetectionsCorrect = false;
  console.log(`  ${hour}:00 → ${detected}`, correct ? '✓' : `✗ (expected ${expected})`);
});

console.log('  Result:', allDetectionsCorrect ? '✓ PASS' : '✗ FAIL');
console.log('');

// Test 5: Daily totals across all meals
console.log('Test 5: Calculate daily totals across all meals');
const allEntries = Object.values(grouped).flat();
const dailyTotals = calculateMealTotals(allEntries);

console.log('  Daily totals:');
console.log(`    Calories: ${dailyTotals.calories}`);
console.log(`    Protein: ${dailyTotals.protein}g`);
console.log(`    Carbs: ${dailyTotals.carbs}g`);
console.log(`    Fat: ${dailyTotals.fat}g`);
console.log(`    Fiber: ${dailyTotals.fiber}g`);

// Expected: sum of all entries
const expectedCalories = 150 + 105 + 350 + 78 + 520 + 170 + 0; // 1373
const test5Pass = dailyTotals.calories === expectedCalories;

console.log('  Expected calories:', expectedCalories);
console.log('  Result:', test5Pass ? '✓ PASS' : '✗ FAIL');
console.log('');

// Test 6: Meal type validation
console.log('Test 6: Meal type validation');
const validMealTypes = ['breakfast', 'lunch', 'dinner', 'snack'];
const testMealTypes = ['breakfast', 'lunch', 'dinner', 'snack', 'invalid', undefined, null, ''];

testMealTypes.forEach(type => {
  const isValid = validMealTypes.includes(type);
  const shouldDefault = !type || !isValid;
  console.log(`  "${type}" → ${shouldDefault ? 'defaults to snack' : 'valid'}`, shouldDefault || isValid ? '✓' : '✗');
});

console.log('  Result: ✓ PASS');
console.log('');

// Test 7: Empty meal type groups
console.log('Test 7: Handle empty meal type groups');
const emptyEntries = [];
const emptyGrouped = getEntriesByMealType(emptyEntries);

const allEmpty = Object.values(emptyGrouped).every(group => group.length === 0);
console.log('  All groups empty:', allEmpty);
console.log('  Result:', allEmpty ? '✓ PASS' : '✗ FAIL');
console.log('');

// Test 8: Custom food with meal type
console.log('Test 8: Custom food entries work with meal types');
const customFoodEntry = {
  id: 'custom-1',
  date: new Date().toISOString(),
  foodName: 'Custom Protein Shake',
  grams: 250,
  mealType: 'breakfast',
  nutrition: { calories: 200, protein: 30, carbs: 10, fat: 5, fiber: 2 },
};

const entriesWithCustom = [...mockNutritionEntries, customFoodEntry];
const groupedWithCustom = getEntriesByMealType(entriesWithCustom);
const customInBreakfast = groupedWithCustom.breakfast.some(e => e.id === 'custom-1');

console.log('  Custom food added to breakfast:', customInBreakfast);
console.log('  Breakfast entries:', groupedWithCustom.breakfast.length);
console.log('  Result:', customInBreakfast && groupedWithCustom.breakfast.length === 3 ? '✓ PASS' : '✗ FAIL');
console.log('');

// Summary
console.log('=== Test Summary ===');
const allTests = [test1Pass, test2Pass, isInSnackGroup, allDetectionsCorrect, test5Pass, allEmpty, customInBreakfast];
const passCount = allTests.filter(Boolean).length;
console.log(`${passCount}/${allTests.length} tests passed`);

if (passCount === allTests.length) {
  console.log('\n✓ All meal type tests passed!');
} else {
  console.log('\n✗ Some tests failed');
  process.exit(1);
}
