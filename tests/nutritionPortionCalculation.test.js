/**
 * Tests for Nutrition Portion Calculation
 * 
 * Tests that nutrition values are correctly calculated based on:
 * - Standard portions using portion_factor
 * - Grams (per 100g calculation)
 * - Volume units with fraction display
 */

/**
 * Mock functions from nutritionDataService
 */
const decimalToFraction = (decimal) => {
  if (decimal === null || decimal === undefined || isNaN(decimal)) {
    return '0';
  }
  
  const fractions = [
    { value: 0.125, str: '1/8' },
    { value: 0.25, str: '1/4' },
    { value: 0.333, str: '1/3' },
    { value: 0.375, str: '3/8' },
    { value: 0.5, str: '1/2' },
    { value: 0.625, str: '5/8' },
    { value: 0.666, str: '2/3' },
    { value: 0.75, str: '3/4' },
    { value: 0.875, str: '7/8' },
  ];
  
  const wholePart = Math.floor(decimal);
  const fractionalPart = decimal - wholePart;
  
  if (fractionalPart < 0.05) {
    return wholePart.toString();
  }
  
  if (fractionalPart > 0.95) {
    return (wholePart + 1).toString();
  }
  
  let closestFraction = null;
  let minDiff = Infinity;
  
  for (const frac of fractions) {
    const diff = Math.abs(fractionalPart - frac.value);
    if (diff < minDiff && diff < 0.05) {
      minDiff = diff;
      closestFraction = frac.str;
    }
  }
  
  if (closestFraction) {
    if (wholePart > 0) {
      return `${wholePart} ${closestFraction}`;
    }
    return closestFraction;
  }
  
  return decimal.toFixed(2);
};

const calculateNutrition = (food, grams) => {
  const multiplier = grams / 100;
  return {
    calories: Math.round(food.calories * multiplier),
    protein: Math.round(food.protein * multiplier),
    carbs: Math.round(food.carbs * multiplier),
    fat: Math.round(food.fat * multiplier),
    fiber: Math.round(food.fiber * multiplier),
  };
};

const calculateNutritionForPortion = (food, quantity = 1) => {
  const multiplier = food.portion_factor * quantity;
  return {
    calories: Math.round(food.calories * multiplier),
    protein: Math.round(food.protein * multiplier),
    carbs: Math.round(food.carbs * multiplier),
    fat: Math.round(food.fat * multiplier),
    fiber: Math.round(food.fiber * multiplier),
  };
};

// Test data from nutrition.json
const chickenBreast = {
  id: 1,
  name: "Chicken breast, cooked, roasted",
  calories: 165,
  protein: 31.0,
  carbs: 0.0,
  fat: 3.6,
  fiber: 0.0,
  standard_portion: "1 medium breast",
  portion_grams: 174,
  portion_factor: 1.74,
  volume_amount: 0.75,
  volume_unit: "cup"
};

const brownRice = {
  id: 100,
  name: "Brown rice, cooked",
  calories: 123,
  protein: 2.7,
  carbs: 25.6,
  fat: 1.0,
  fiber: 1.6,
  standard_portion: "1 cup",
  portion_grams: 195,
  portion_factor: 1.95,
  volume_amount: 1.0,
  volume_unit: "cup"
};

// Test Cases
console.log('=== Nutrition Portion Calculation Tests ===\n');

// Test 1: Standard portion calculation using portion_factor
console.log('Test 1: Standard portion calculation (chicken breast)');
const chickenNutrition = calculateNutritionForPortion(chickenBreast, 1);
console.log('  Food:', chickenBreast.name);
console.log('  Portion:', chickenBreast.standard_portion, `(${chickenBreast.portion_grams}g)`);
console.log('  Expected: 165 * 1.74 = 287 calories (rounded)');
console.log('  Actual:', chickenNutrition.calories, 'calories');
const test1Pass = chickenNutrition.calories === 287;
console.log('  Result:', test1Pass ? '✓ PASS' : '✗ FAIL');
console.log('');

// Test 2: Per 100g calculation
console.log('Test 2: Per 100g calculation (chicken breast)');
const chicken100g = calculateNutrition(chickenBreast, 100);
console.log('  Food:', chickenBreast.name);
console.log('  Amount: 100g');
console.log('  Expected: 165 calories');
console.log('  Actual:', chicken100g.calories, 'calories');
const test2Pass = chicken100g.calories === 165;
console.log('  Result:', test2Pass ? '✓ PASS' : '✗ FAIL');
console.log('');

// Test 3: Multiple portions
console.log('Test 3: Multiple portions (2 chicken breasts)');
const twoBreasts = calculateNutritionForPortion(chickenBreast, 2);
console.log('  Food:', chickenBreast.name);
console.log('  Portion: 2 × standard portion');
console.log('  Expected: 165 * 1.74 * 2 = 574 calories (rounded)');
console.log('  Actual:', twoBreasts.calories, 'calories');
const test3Pass = twoBreasts.calories === 574;
console.log('  Result:', test3Pass ? '✓ PASS' : '✗ FAIL');
console.log('');

// Test 4: Fraction conversion
console.log('Test 4: Decimal to fraction conversion');
const testCases = [
  { decimal: 0.75, expected: '3/4' },
  { decimal: 0.5, expected: '1/2' },
  { decimal: 0.25, expected: '1/4' },
  { decimal: 1.5, expected: '1 1/2' },
  { decimal: 2.75, expected: '2 3/4' },
  { decimal: 0.333, expected: '1/3' },
  { decimal: 0.666, expected: '2/3' },
];
let allFractionsPass = true;
testCases.forEach(({ decimal, expected }) => {
  const result = decimalToFraction(decimal);
  const pass = result === expected;
  if (!pass) allFractionsPass = false;
  console.log(`  ${decimal} → "${result}"`, pass ? '✓' : `✗ (expected "${expected}")`);
});
console.log('  Result:', allFractionsPass ? '✓ PASS' : '✗ FAIL');
console.log('');

// Test 5: All nutrients rounded to whole numbers
console.log('Test 5: All nutrients rounded to whole numbers');
const brownRiceNutrition = calculateNutritionForPortion(brownRice, 1);
console.log('  Food:', brownRice.name);
console.log('  Portion:', brownRice.standard_portion);
console.log('  Expected calculations:');
console.log('    - Calories: round(123 * 1.95) = 240');
console.log('    - Protein: round(2.7 * 1.95) = 5');
console.log('    - Carbs: round(25.6 * 1.95) = 50');
console.log('    - Fat: round(1.0 * 1.95) = 2');
console.log('    - Fiber: round(1.6 * 1.95) = 3');
console.log('  Actual:', brownRiceNutrition);
const test5Pass = 
  brownRiceNutrition.calories === 240 &&
  brownRiceNutrition.protein === 5 &&
  brownRiceNutrition.carbs === 50 &&
  brownRiceNutrition.fat === 2 &&
  brownRiceNutrition.fiber === 3;
console.log('  Result:', test5Pass ? '✓ PASS' : '✗ FAIL');
console.log('');

// Test 6: Partial portion (0.5)
console.log('Test 6: Partial portion (half portion)');
const halfBreast = calculateNutritionForPortion(chickenBreast, 0.5);
console.log('  Food:', chickenBreast.name);
console.log('  Portion: 0.5 × standard portion');
console.log('  Expected: round(165 * 1.74 * 0.5) = 144 calories');
console.log('  Actual:', halfBreast.calories, 'calories');
const test6Pass = halfBreast.calories === 144;
console.log('  Result:', test6Pass ? '✓ PASS' : '✗ FAIL');
console.log('');

// Summary
console.log('=== Test Summary ===');
const allTests = [test1Pass, test2Pass, test3Pass, allFractionsPass, test5Pass, test6Pass];
const passCount = allTests.filter(Boolean).length;
console.log(`${passCount}/${allTests.length} tests passed`);

if (passCount === allTests.length) {
  console.log('\n✓ All tests passed!');
} else {
  console.log('\n✗ Some tests failed');
  process.exit(1);
}
