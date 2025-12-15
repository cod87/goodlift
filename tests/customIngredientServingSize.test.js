/**
 * Tests for Custom Ingredient Serving Size and Normalization
 * 
 * Tests the enhanced custom ingredient feature that allows users to:
 * 1. Enter nutrition values per their serving size (not just per 100g)
 * 2. Automatic normalization to per-100g for internal consistency
 * 3. Correct calculation when using custom ingredients in meals
 * 
 * Requirements tested:
 * - User can enter custom serving size in grams
 * - User enters nutrition values per that serving size
 * - System normalizes values to per-100g
 * - Logged meals calculate nutrition correctly
 * - Custom ingredients are saved with normalized values
 */

/**
 * Simulate the normalization that happens in AddCustomFoodDialog
 */
const normalizeNutritionValues = (formData) => {
  const portionGrams = parseFloat(formData.portion_grams);
  const normalizationFactor = 100 / portionGrams;
  
  return {
    name: formData.name,
    calories: Math.round(parseFloat(formData.calories) * normalizationFactor),
    protein: Math.round(parseFloat(formData.protein) * normalizationFactor * 10) / 10,
    carbs: Math.round(parseFloat(formData.carbs) * normalizationFactor * 10) / 10,
    fat: Math.round(parseFloat(formData.fat) * normalizationFactor * 10) / 10,
    fiber: Math.round(parseFloat(formData.fiber) * normalizationFactor * 10) / 10,
    standard_portion: formData.standard_portion,
    portion_grams: portionGrams,
  };
};

/**
 * Calculate nutrition for a given amount (like in nutritionDataService)
 */
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

/**
 * Calculate nutrition for a standard portion
 */
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

// Test Cases
console.log('=== Custom Ingredient Serving Size Tests ===\n');

// Test 1: Normalize 50g serving to per-100g
console.log('Test 1: Normalize 50g serving to per-100g');
const test1Input = {
  name: 'Protein Bar',
  calories: '200',
  protein: '15',
  carbs: '20',
  fat: '8',
  fiber: '5',
  standard_portion: '1 bar',
  portion_grams: '50',
};

const test1Result = normalizeNutritionValues(test1Input);
const test1Pass = 
  test1Result.calories === 400 &&
  test1Result.protein === 30 &&
  test1Result.carbs === 40 &&
  test1Result.fat === 16 &&
  test1Result.fiber === 10 &&
  test1Result.portion_grams === 50;

console.log('  Input: 50g serving with 200 cal, 15g protein');
console.log('  Expected per-100g: 400 cal, 30g protein');
console.log('  Actual per-100g:', test1Result.calories, 'cal,', test1Result.protein + 'g protein');
console.log('  Result:', test1Pass ? '✓ PASS' : '✗ FAIL');
console.log('');

// Test 2: Normalize 30g serving to per-100g
console.log('Test 2: Normalize 30g serving to per-100g');
const test2Input = {
  name: 'Protein Powder Scoop',
  calories: '120',
  protein: '25',
  carbs: '3',
  fat: '1.5',
  fiber: '1',
  standard_portion: '1 scoop',
  portion_grams: '30',
};

const test2Result = normalizeNutritionValues(test2Input);
const test2Pass = 
  test2Result.calories === 400 &&
  Math.abs(test2Result.protein - 83.3) < 0.1 &&
  test2Result.carbs === 10 &&
  test2Result.fat === 5 &&
  Math.abs(test2Result.fiber - 3.3) < 0.1;

console.log('  Input: 30g serving with 120 cal, 25g protein');
console.log('  Expected per-100g: 400 cal, ~83.3g protein');
console.log('  Actual per-100g:', test2Result.calories, 'cal,', test2Result.protein + 'g protein');
console.log('  Result:', test2Pass ? '✓ PASS' : '✗ FAIL');
console.log('');

// Test 3: Normalize 200g serving to per-100g
console.log('Test 3: Normalize 200g serving (larger than 100g) to per-100g');
const test3Input = {
  name: 'Smoothie',
  calories: '300',
  protein: '10',
  carbs: '50',
  fat: '6',
  fiber: '8',
  standard_portion: '1 glass',
  portion_grams: '200',
};

const test3Result = normalizeNutritionValues(test3Input);
const test3Pass = 
  test3Result.calories === 150 &&
  test3Result.protein === 5 &&
  test3Result.carbs === 25 &&
  test3Result.fat === 3 &&
  test3Result.fiber === 4;

console.log('  Input: 200g serving with 300 cal, 10g protein');
console.log('  Expected per-100g: 150 cal, 5g protein');
console.log('  Actual per-100g:', test3Result.calories, 'cal,', test3Result.protein + 'g protein');
console.log('  Result:', test3Pass ? '✓ PASS' : '✗ FAIL');
console.log('');

// Test 4: Calculate nutrition for 1 standard portion
console.log('Test 4: Calculate nutrition for 1 standard portion (50g bar)');
const test4Food = {
  ...test1Result,
  portion_factor: test1Result.portion_grams / 100, // 0.5
};

const test4Nutrition = calculateNutritionForPortion(test4Food, 1);
const test4Pass = 
  test4Nutrition.calories === 200 &&
  test4Nutrition.protein === 15 &&
  test4Nutrition.carbs === 20;

console.log('  Food: Protein Bar (per-100g: 400 cal, portion_grams: 50g)');
console.log('  Expected for 1 bar: 200 cal, 15g protein');
console.log('  Actual:', test4Nutrition.calories, 'cal,', test4Nutrition.protein + 'g protein');
console.log('  Result:', test4Pass ? '✓ PASS' : '✗ FAIL');
console.log('');

// Test 5: Calculate nutrition for 2 standard portions
console.log('Test 5: Calculate nutrition for 2 standard portions (2 × 50g bars)');
const test5Nutrition = calculateNutritionForPortion(test4Food, 2);
const test5Pass = 
  test5Nutrition.calories === 400 &&
  test5Nutrition.protein === 30 &&
  test5Nutrition.carbs === 40;

console.log('  Food: Protein Bar (per-100g: 400 cal, portion_grams: 50g)');
console.log('  Expected for 2 bars: 400 cal, 30g protein');
console.log('  Actual:', test5Nutrition.calories, 'cal,', test5Nutrition.protein + 'g protein');
console.log('  Result:', test5Pass ? '✓ PASS' : '✗ FAIL');
console.log('');

// Test 6: Calculate nutrition by grams (75g)
console.log('Test 6: Calculate nutrition by grams (75g of protein bar)');
const test6Nutrition = calculateNutrition(test4Food, 75);
const test6Pass = 
  test6Nutrition.calories === 300 &&
  test6Nutrition.protein === 23 && // Rounded from 22.5
  test6Nutrition.carbs === 30;

console.log('  Food: Protein Bar (per-100g: 400 cal)');
console.log('  Expected for 75g: 300 cal');
console.log('  Actual:', test6Nutrition.calories, 'cal');
console.log('  Result:', test6Pass ? '✓ PASS' : '✗ FAIL');
console.log('');

// Test 7: Round-trip verification (user input -> normalize -> calculate)
console.log('Test 7: Round-trip verification');
const test7Input = {
  name: 'Energy Ball',
  calories: '150',
  protein: '8',
  carbs: '18',
  fat: '6',
  fiber: '3',
  standard_portion: '1 ball',
  portion_grams: '40',
};

// Step 1: Normalize
const test7Normalized = normalizeNutritionValues(test7Input);
const test7Food = {
  ...test7Normalized,
  portion_factor: test7Normalized.portion_grams / 100,
};

// Step 2: Calculate for 1 standard portion (should match original input)
const test7Calculated = calculateNutritionForPortion(test7Food, 1);
const test7Pass = 
  test7Calculated.calories === 150 &&
  test7Calculated.protein === 8 &&
  test7Calculated.carbs === 18;

console.log('  Original input for 40g: 150 cal, 8g protein');
console.log('  After normalize + calculate: ' + test7Calculated.calories + ' cal, ' + test7Calculated.protein + 'g protein');
console.log('  Values match:', test7Pass ? 'YES ✓' : 'NO ✗');
console.log('  Result:', test7Pass ? '✓ PASS' : '✗ FAIL');
console.log('');

// Test 8: Edge case - 100g serving (no normalization needed)
console.log('Test 8: Edge case - 100g serving (1:1 normalization)');
const test8Input = {
  name: 'Chicken Breast',
  calories: '165',
  protein: '31',
  carbs: '0',
  fat: '3.6',
  fiber: '0',
  standard_portion: '100g',
  portion_grams: '100',
};

const test8Result = normalizeNutritionValues(test8Input);
const test8Pass = 
  test8Result.calories === 165 &&
  test8Result.protein === 31 &&
  test8Result.fat === 3.6;

console.log('  Input: 100g serving with 165 cal, 31g protein');
console.log('  Expected per-100g: 165 cal, 31g protein (no change)');
console.log('  Actual per-100g:', test8Result.calories, 'cal,', test8Result.protein + 'g protein');
console.log('  Result:', test8Pass ? '✓ PASS' : '✗ FAIL');
console.log('');

// Test 9: Precision check - ensure rounding is consistent
console.log('Test 9: Precision check for decimal values');
const test9Input = {
  name: 'Almonds',
  calories: '160',
  protein: '6',
  carbs: '6',
  fat: '14',
  fiber: '3.5',
  standard_portion: '1 oz',
  portion_grams: '28',
};

const test9Result = normalizeNutritionValues(test9Input);
const test9Food = {
  ...test9Result,
  portion_factor: test9Result.portion_grams / 100,
};

// Calculate back to 28g
const test9Calculated = calculateNutritionForPortion(test9Food, 1);
const caloriesDiff = Math.abs(test9Calculated.calories - 160);
const test9Pass = caloriesDiff <= 1; // Allow 1 calorie difference due to rounding

console.log('  Original: 28g with 160 cal');
console.log('  Normalized per-100g:', test9Result.calories, 'cal');
console.log('  Calculated back to 28g:', test9Calculated.calories, 'cal');
console.log('  Difference:', caloriesDiff, 'cal');
console.log('  Result:', test9Pass ? '✓ PASS' : '✗ FAIL');
console.log('');

// Test 10: Meal logging with custom ingredient
console.log('Test 10: Meal logging with custom ingredient (multiple items)');
const customIngredient = {
  name: 'Homemade Granola',
  calories: 400, // per 100g (normalized)
  protein: 10,
  carbs: 60,
  fat: 15,
  fiber: 6,
  portion_grams: 50,
  portion_factor: 0.5,
};

// User adds 1.5 servings (75g total)
const mealItem = {
  food: customIngredient,
  portionType: 'standard',
  portionQuantity: 1.5,
  grams: customIngredient.portion_grams * 1.5,
};

const mealNutrition = calculateNutritionForPortion(mealItem.food, mealItem.portionQuantity);
// 400 * 0.5 * 1.5 = 300
// 10 * 0.5 * 1.5 = 7.5 → rounds to 8
// 60 * 0.5 * 1.5 = 45
const test10Pass = 
  mealNutrition.calories === 300 && 
  mealNutrition.protein === 8 &&    // Rounded from 7.5
  mealNutrition.carbs === 45;

console.log('  Food: Granola (50g serving = 200 cal per serving)');
console.log('  Meal: 1.5 servings');
console.log('  Expected: 300 cal, 8g protein (rounded from 7.5)');
console.log('  Actual:', mealNutrition.calories, 'cal,', mealNutrition.protein + 'g protein');
console.log('  Result:', test10Pass ? '✓ PASS' : '✗ FAIL');
console.log('');

// Summary
console.log('=== Test Summary ===');
const allTests = [
  test1Pass, test2Pass, test3Pass, test4Pass, test5Pass,
  test6Pass, test7Pass, test8Pass, test9Pass, test10Pass
];
const passCount = allTests.filter(Boolean).length;
console.log(`${passCount}/${allTests.length} tests passed`);

if (passCount === allTests.length) {
  console.log('\n✓ All custom ingredient serving size tests passed!');
} else {
  console.log('\n✗ Some tests failed');
  process.exit(1);
}
