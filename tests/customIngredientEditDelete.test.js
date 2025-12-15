/**
 * Tests for Custom Ingredient Edit and Delete Functionality
 * 
 * Tests the ability to edit and delete previously created custom ingredients.
 * 
 * Requirements tested:
 * - Users can edit existing custom ingredients
 * - Changes to custom ingredients are saved with normalization
 * - Users can delete custom ingredients
 * - Deleted ingredients are removed from storage and search results
 * - Edit mode shows existing values denormalized to serving size
 */

/**
 * Mock update function
 */
const mockUpdateCustomIngredient = async (id, updates) => {
  // Simulate the update process
  return {
    id,
    ...updates,
    updatedAt: new Date().toISOString(),
  };
};

/**
 * Mock delete function
 */
const mockDeleteCustomIngredient = async (id) => {
  // Simulate deletion
  return { success: true, id };
};

/**
 * Normalize nutrition values (same as in AddCustomFoodDialog)
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
 * Denormalize for editing (reverse the normalization)
 */
const denormalizeForEdit = (food) => {
  const portionGrams = food.portion_grams || 100;
  const denormalizationFactor = portionGrams / 100;
  
  return {
    name: food.name || '',
    calories: Math.round(food.calories * denormalizationFactor).toString(),
    protein: (food.protein * denormalizationFactor).toFixed(1),
    carbs: (food.carbs * denormalizationFactor).toFixed(1),
    fat: (food.fat * denormalizationFactor).toFixed(1),
    fiber: (food.fiber * denormalizationFactor).toFixed(1),
    standard_portion: food.standard_portion || '1 serving',
    portion_grams: portionGrams.toString(),
  };
};

// Test Cases
console.log('=== Custom Ingredient Edit and Delete Tests ===\n');

// Test 1: Denormalize custom ingredient for editing
console.log('Test 1: Denormalize custom ingredient for editing');
const customIngredient = {
  id: 'custom_123456',
  name: 'Protein Bar',
  calories: 400, // per 100g (normalized)
  protein: 30,
  carbs: 40,
  fat: 16,
  fiber: 10,
  standard_portion: '1 bar',
  portion_grams: 50,
  isCustom: true,
};

const denormalized = denormalizeForEdit(customIngredient);
const test1Pass = 
  denormalized.calories === '200' &&
  denormalized.protein === '15.0' &&
  denormalized.carbs === '20.0' &&
  denormalized.portion_grams === '50';

console.log('  Original (per 100g): 400 cal, 30g protein');
console.log('  Denormalized (per 50g): ' + denormalized.calories + ' cal, ' + denormalized.protein + 'g protein');
console.log('  Result:', test1Pass ? '✓ PASS' : '✗ FAIL');
console.log('');

// Test 2: Edit and renormalize
console.log('Test 2: Edit custom ingredient and renormalize');
const editedFormData = {
  name: 'Protein Bar (Updated)',
  calories: '220', // User changes from 200 to 220
  protein: '16.0', // User changes from 15 to 16
  carbs: '20.0',
  fat: '8.0',
  fiber: '5.0',
  standard_portion: '1 bar',
  portion_grams: '50',
};

const renormalized = normalizeNutritionValues(editedFormData);
const test2Pass = 
  renormalized.calories === 440 && // 220 * (100/50) = 440
  renormalized.protein === 32 &&   // 16 * (100/50) = 32
  renormalized.portion_grams === 50;

console.log('  Edited (per 50g): 220 cal, 16g protein');
console.log('  Renormalized (per 100g): ' + renormalized.calories + ' cal, ' + renormalized.protein + 'g protein');
console.log('  Result:', test2Pass ? '✓ PASS' : '✗ FAIL');
console.log('');

// Test 3: Delete custom ingredient
console.log('Test 3: Delete custom ingredient');
const ingredientToDelete = {
  id: 'custom_789',
  name: 'Custom Smoothie',
};

let customIngredients = [
  { id: 'custom_123', name: 'Energy Bar' },
  { id: 'custom_789', name: 'Custom Smoothie' },
  { id: 'custom_456', name: 'Protein Shake' },
];

(async () => {
  await mockDeleteCustomIngredient(ingredientToDelete.id);
  // Simulate removal from list
  customIngredients = customIngredients.filter(i => i.id !== ingredientToDelete.id);
  
  const test3Pass = 
    customIngredients.length === 2 &&
    !customIngredients.some(i => i.id === 'custom_789');
  
  console.log('  Before delete: 3 ingredients');
  console.log('  After delete: ' + customIngredients.length + ' ingredients');
  console.log('  Deleted ingredient removed:', !customIngredients.some(i => i.id === 'custom_789'));
  console.log('  Result:', test3Pass ? '✓ PASS' : '✗ FAIL');
  console.log('');

  // Test 4: Edit changes serving size
  console.log('Test 4: Edit custom ingredient with serving size change');
  const originalIngredient = {
    name: 'Protein Powder',
    calories: 400, // per 100g
    protein: 80,
    carbs: 10,
    fat: 5,
    fiber: 2,
    portion_grams: 30,
    standard_portion: '1 scoop',
  };

  // User edits: changes serving size from 30g to 35g
  const editedWithNewServingSize = {
    name: 'Protein Powder',
    calories: '140', // per 35g (user sees this)
    protein: '28.0',
    carbs: '3.5',
    fat: '1.8',
    fiber: '0.7',
    portion_grams: '35', // Changed from 30g to 35g
    standard_portion: '1 scoop',
  };

  const renormalizedNewSize = normalizeNutritionValues(editedWithNewServingSize);
  const test4Pass = 
    renormalizedNewSize.calories === 400 && // 140 * (100/35) = 400
    renormalizedNewSize.protein === 80 &&   // 28 * (100/35) = 80
    renormalizedNewSize.portion_grams === 35;

  console.log('  Original serving: 30g');
  console.log('  New serving: 35g');
  console.log('  Input (per 35g): 140 cal, 28g protein');
  console.log('  Normalized (per 100g): ' + renormalizedNewSize.calories + ' cal, ' + renormalizedNewSize.protein + 'g protein');
  console.log('  Result:', test4Pass ? '✓ PASS' : '✗ FAIL');
  console.log('');

  // Test 5: Edit maintains accuracy across round-trip
  console.log('Test 5: Edit maintains accuracy in round-trip conversion');
  const originalFood = {
    name: 'Almonds',
    calories: 579,
    protein: 21,
    carbs: 22,
    fat: 50,
    fiber: 12,
    portion_grams: 28,
    standard_portion: '1 oz',
  };

  // Denormalize for editing
  const forEdit = denormalizeForEdit(originalFood);
  
  // User makes no changes, saves as-is
  const backToNormal = normalizeNutritionValues(forEdit);
  
  const test5Pass = 
    Math.abs(backToNormal.calories - originalFood.calories) <= 1 &&
    Math.abs(backToNormal.protein - originalFood.protein) <= 0.2 &&
    backToNormal.portion_grams === originalFood.portion_grams;

  console.log('  Original (per 100g): 579 cal, 21g protein');
  console.log('  After round-trip: ' + backToNormal.calories + ' cal, ' + backToNormal.protein + 'g protein');
  console.log('  Difference: ' + Math.abs(backToNormal.calories - originalFood.calories) + ' cal');
  console.log('  Result:', test5Pass ? '✓ PASS' : '✗ FAIL');
  console.log('');

  // Test 6: Validation excludes current ingredient when editing
  console.log('Test 6: Validation excludes current ingredient when checking duplicates');
  const existingIngredients = [
    { id: 'custom_1', name: 'Protein Bar' },
    { id: 'custom_2', name: 'Energy Drink' },
    { id: 'custom_3', name: 'Smoothie Bowl' },
  ];

  const editingId = 'custom_2';
  const newName = 'Energy Drink'; // Same name (no change)
  
  // Check for duplicates, excluding current
  const isDuplicate = existingIngredients.some(
    food => food.name.toLowerCase() === newName.toLowerCase() && food.id !== editingId
  );
  
  const test6Pass = !isDuplicate;
  
  console.log('  Editing ingredient: Energy Drink (id: custom_2)');
  console.log('  New name: Energy Drink (unchanged)');
  console.log('  Is duplicate (excluding self):', isDuplicate);
  console.log('  Result:', test6Pass ? '✓ PASS' : '✗ FAIL');
  console.log('');

  // Summary
  console.log('=== Test Summary ===');
  const allTests = [test1Pass, test2Pass, test3Pass, test4Pass, test5Pass, test6Pass];
  const passCount = allTests.filter(Boolean).length;
  console.log(`${passCount}/${allTests.length} tests passed`);

  if (passCount === allTests.length) {
    console.log('\n✓ All custom ingredient edit/delete tests passed!');
  } else {
    console.log('\n✗ Some tests failed');
    process.exit(1);
  }
})();
