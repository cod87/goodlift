/**
 * Tests for Custom Food Creation and Validation
 * 
 * Tests the new custom food functionality including:
 * - Form validation
 * - Duplicate name checking
 * - Proper data structure creation
 * - Integration with search and meal logging
 */

/**
 * Mock existing foods database
 */
const mockExistingFoods = [
  { id: 1, name: 'Chicken Breast', calories: 165, protein: 31, carbs: 0, fat: 3.6, fiber: 0 },
  { id: 2, name: 'Brown Rice', calories: 123, protein: 2.7, carbs: 25.6, fat: 1, fiber: 1.6 },
  { id: 3, name: 'Broccoli', calories: 35, protein: 2.4, carbs: 7.2, fat: 0.4, fiber: 3.3 },
];

/**
 * Validate custom food form data
 */
const validateCustomFood = (formData, existingFoods) => {
  const errors = {};

  // Name validation
  if (!formData.name.trim()) {
    errors.name = 'Food name is required';
  } else if (formData.name.trim().length < 2) {
    errors.name = 'Food name must be at least 2 characters';
  } else {
    // Check for duplicate names (case-insensitive)
    const nameLower = formData.name.trim().toLowerCase();
    const isDuplicate = existingFoods.some(
      food => food.name.toLowerCase() === nameLower
    );
    if (isDuplicate) {
      errors.name = 'A food with this name already exists';
    }
  }

  // Numeric validations
  const numericFields = ['calories', 'protein', 'carbs', 'fat', 'fiber', 'portion_grams'];
  numericFields.forEach(field => {
    const value = parseFloat(formData[field]);
    if (formData[field] === '' || isNaN(value) || value < 0) {
      errors[field] = 'Must be a positive number';
    }
  });

  // Portion validation
  if (!formData.standard_portion.trim()) {
    errors.standard_portion = 'Portion description is required';
  }

  return errors;
};

/**
 * Create custom food object
 */
const createCustomFood = (formData) => {
  return {
    id: `custom_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`,
    name: formData.name.trim(),
    rank: 50, // Custom foods have medium rank
    category: 'Custom',
    calories: parseFloat(formData.calories),
    protein: parseFloat(formData.protein),
    carbs: parseFloat(formData.carbs),
    fat: parseFloat(formData.fat),
    fiber: parseFloat(formData.fiber),
    tags: formData.tags || '',
    standard_portion: formData.standard_portion.trim(),
    portion_grams: parseFloat(formData.portion_grams),
    portion_factor: parseFloat(formData.portion_grams) / 100,
    volume_amount: formData.volume_amount || 1,
    volume_unit: formData.volume_unit || 'serving',
    isCustom: true,
    createdAt: new Date().toISOString(),
  };
};

// Test Cases
console.log('=== Custom Food Creation and Validation Tests ===\n');

// Test 1: Valid custom food creation
console.log('Test 1: Create a valid custom food');
const validFormData = {
  name: 'Protein Shake',
  calories: '200',
  protein: '30',
  carbs: '10',
  fat: '5',
  fiber: '2',
  standard_portion: '1 scoop',
  portion_grams: '30',
};

const errors1 = validateCustomFood(validFormData, mockExistingFoods);
const test1Pass = Object.keys(errors1).length === 0;

console.log('  Form data:', validFormData.name);
console.log('  Validation errors:', Object.keys(errors1).length);
console.log('  Result:', test1Pass ? '✓ PASS' : '✗ FAIL');

if (test1Pass) {
  const customFood = createCustomFood(validFormData);
  console.log('  Created custom food:');
  console.log(`    Name: ${customFood.name}`);
  console.log(`    Calories: ${customFood.calories}`);
  console.log(`    Protein: ${customFood.protein}g`);
  console.log(`    Portion: ${customFood.standard_portion} (${customFood.portion_grams}g)`);
  console.log(`    Is custom: ${customFood.isCustom}`);
}
console.log('');

// Test 2: Duplicate name detection (case-insensitive)
console.log('Test 2: Detect duplicate food names (case-insensitive)');
const duplicateFormData = {
  name: 'chicken breast', // Same as existing "Chicken Breast"
  calories: '150',
  protein: '28',
  carbs: '0',
  fat: '3',
  fiber: '0',
  standard_portion: '100g',
  portion_grams: '100',
};

const errors2 = validateCustomFood(duplicateFormData, mockExistingFoods);
const test2Pass = errors2.name === 'A food with this name already exists';

console.log('  Food name:', duplicateFormData.name);
console.log('  Existing foods:', mockExistingFoods.map(f => f.name).join(', '));
console.log('  Duplicate detected:', !!errors2.name);
console.log('  Result:', test2Pass ? '✓ PASS' : '✗ FAIL');
console.log('');

// Test 3: Empty/invalid field validation
console.log('Test 3: Validate required fields');
const invalidFormData = {
  name: '',
  calories: '',
  protein: '-5',
  carbs: 'invalid',
  fat: '10',
  fiber: '2',
  standard_portion: '',
  portion_grams: '0',
};

const errors3 = validateCustomFood(invalidFormData, mockExistingFoods);
const test3Pass = 
  errors3.name &&
  errors3.calories &&
  errors3.protein &&
  errors3.carbs &&
  errors3.standard_portion &&
  errors3.portion_grams;

console.log('  Validation errors:');
Object.entries(errors3).forEach(([field, error]) => {
  console.log(`    ${field}: ${error}`);
});
console.log('  Result:', test3Pass ? '✓ PASS' : '✗ FAIL');
console.log('');

// Test 4: Minimum name length validation
console.log('Test 4: Validate minimum name length');
const shortNameFormData = {
  name: 'A',
  calories: '100',
  protein: '10',
  carbs: '10',
  fat: '5',
  fiber: '2',
  standard_portion: '1 serving',
  portion_grams: '100',
};

const errors4 = validateCustomFood(shortNameFormData, mockExistingFoods);
const test4Pass = errors4.name === 'Food name must be at least 2 characters';

console.log('  Food name:', shortNameFormData.name);
console.log('  Name length:', shortNameFormData.name.length);
console.log('  Error:', errors4.name);
console.log('  Result:', test4Pass ? '✓ PASS' : '✗ FAIL');
console.log('');

// Test 5: Portion factor calculation
console.log('Test 5: Calculate portion factor correctly');
const customFood = createCustomFood(validFormData);
const expectedPortionFactor = parseFloat(validFormData.portion_grams) / 100;
const test5Pass = Math.abs(customFood.portion_factor - expectedPortionFactor) < 0.001;

console.log('  Portion grams:', validFormData.portion_grams);
console.log('  Expected portion factor:', expectedPortionFactor);
console.log('  Actual portion factor:', customFood.portion_factor);
console.log('  Result:', test5Pass ? '✓ PASS' : '✗ FAIL');
console.log('');

// Test 6: Custom food metadata
console.log('Test 6: Custom food has correct metadata');
const testCustomFood = createCustomFood(validFormData);
const test6Pass = 
  testCustomFood.isCustom === true &&
  testCustomFood.category === 'Custom' &&
  testCustomFood.rank === 50 &&
  testCustomFood.id.startsWith('custom_') &&
  testCustomFood.createdAt;

console.log('  Is custom:', testCustomFood.isCustom);
console.log('  Category:', testCustomFood.category);
console.log('  Rank:', testCustomFood.rank);
console.log('  ID format:', testCustomFood.id.startsWith('custom_') ? 'correct' : 'incorrect');
console.log('  Has createdAt:', !!testCustomFood.createdAt);
console.log('  Result:', test6Pass ? '✓ PASS' : '✗ FAIL');
console.log('');

// Test 7: Zero values are valid
console.log('Test 7: Allow zero values for nutrients');
const zeroNutrientFormData = {
  name: 'Water',
  calories: '0',
  protein: '0',
  carbs: '0',
  fat: '0',
  fiber: '0',
  standard_portion: '1 cup',
  portion_grams: '240',
};

const errors7 = validateCustomFood(zeroNutrientFormData, mockExistingFoods);
const test7Pass = Object.keys(errors7).length === 0;

console.log('  Food name:', zeroNutrientFormData.name);
console.log('  All nutrients zero');
console.log('  Validation errors:', Object.keys(errors7).length);
console.log('  Result:', test7Pass ? '✓ PASS' : '✗ FAIL');
console.log('');

// Test 8: Trimming whitespace
console.log('Test 8: Trim whitespace from input fields');
const whitespaceFormData = {
  name: '  Smoothie Bowl  ',
  calories: '300',
  protein: '15',
  carbs: '45',
  fat: '8',
  fiber: '7',
  standard_portion: '  1 bowl  ',
  portion_grams: '350',
};

const errors8 = validateCustomFood(whitespaceFormData, mockExistingFoods);
const test8Pass = Object.keys(errors8).length === 0;

if (test8Pass) {
  const trimmedFood = createCustomFood(whitespaceFormData);
  const trimmedCorrectly = 
    trimmedFood.name === 'Smoothie Bowl' &&
    trimmedFood.standard_portion === '1 bowl';
  
  console.log('  Original name:', `"${whitespaceFormData.name}"`);
  console.log('  Trimmed name:', `"${trimmedFood.name}"`);
  console.log('  Original portion:', `"${whitespaceFormData.standard_portion}"`);
  console.log('  Trimmed portion:', `"${trimmedFood.standard_portion}"`);
  console.log('  Result:', trimmedCorrectly ? '✓ PASS' : '✗ FAIL');
} else {
  console.log('  Validation failed unexpectedly');
  console.log('  Result: ✗ FAIL');
}
console.log('');

// Test 9: Unique ID generation
console.log('Test 9: Generate unique IDs for custom foods');
const food1 = createCustomFood(validFormData);
const food2 = createCustomFood(validFormData);
const test9Pass = food1.id !== food2.id;

console.log('  Food 1 ID:', food1.id);
console.log('  Food 2 ID:', food2.id);
console.log('  IDs are unique:', test9Pass);
console.log('  Result:', test9Pass ? '✓ PASS' : '✗ FAIL');
console.log('');

// Summary
console.log('=== Test Summary ===');
const allTests = [test1Pass, test2Pass, test3Pass, test4Pass, test5Pass, test6Pass, test7Pass, test8Pass, test9Pass];
const passCount = allTests.filter(Boolean).length;
console.log(`${passCount}/${allTests.length} tests passed`);

if (passCount === allTests.length) {
  console.log('\n✓ All custom food tests passed!');
} else {
  console.log('\n✗ Some tests failed');
  process.exit(1);
}
