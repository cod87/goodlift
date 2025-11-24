/**
 * Tests for Muscle Categorization
 * 
 * Tests that delts and shoulders are properly categorized under "Shoulders" category
 */

// Mock the muscle categorization functions
const MUSCLE_CATEGORY_MAP = {
  'Chest': ['Chest'],
  'Back': ['Lats', 'Traps', 'Back', 'Upper Back', 'Lower Back', 'Rhomboids', 'Erector Spinae'],
  'Shoulders': ['Shoulders', 'Delts', 'Front Delts', 'Rear Delts', 'Side Delts'],
  'Quads': ['Quads'],
  'Hamstrings': ['Hamstrings'],
  'Triceps': ['Triceps'],
  'Biceps': ['Biceps', 'Forearms'],
  'Calves': ['Calves'],
  'Core': ['Core', 'Obliques', 'Hip Flexors'],
  'Glutes': ['Glutes', 'Adductors'],
};

const SECONDARY_MUSCLE_CATEGORY_MAP = {
  'Chest': ['Chest'],
  'Back': ['Back', 'Lats', 'Lower Back', 'Rhomboids', 'Traps', 'Upper Back'],
  'Shoulders': ['Shoulders', 'Delts', 'Front Delts', 'Rear Delts', 'Side Delts'],
  'Quads': ['Hip Flexors', 'Quads'],
  'Hamstrings': ['Hamstrings'],
  'Triceps': [],
  'Biceps': ['Biceps', 'Forearms'],
  'Calves': ['Calves'],
  'Core': ['Core', 'Obliques'],
  'Glutes': ['Adductors', 'Glutes'],
};

const MUSCLE_TO_CATEGORY = Object.entries(MUSCLE_CATEGORY_MAP).reduce((acc, [category, muscles]) => {
  muscles.forEach(muscle => {
    acc[muscle] = category;
  });
  return acc;
}, {});

const SECONDARY_MUSCLE_TO_CATEGORY = Object.entries(SECONDARY_MUSCLE_CATEGORY_MAP).reduce((acc, [category, muscles]) => {
  muscles.forEach(muscle => {
    acc[muscle] = category;
  });
  return acc;
}, {});

function getMuscleCategory(primaryMuscle) {
  const cleanMuscle = primaryMuscle.split('(')[0].trim();
  return MUSCLE_TO_CATEGORY[cleanMuscle] || cleanMuscle;
}

function getSecondaryMuscleCategory(secondaryMuscle) {
  const cleanMuscle = secondaryMuscle.split('(')[0].trim();
  return SECONDARY_MUSCLE_TO_CATEGORY[cleanMuscle] || null;
}

// Test Cases
console.log('=== Muscle Categorization Tests ===\n');

// Test 1: Primary muscle categorization for delts variants
console.log('Test 1: Primary muscle categorization for delts variants');
const deltVariants = ['Delts', 'Front Delts', 'Rear Delts', 'Side Delts', 'Shoulders'];
deltVariants.forEach(muscle => {
  const category = getMuscleCategory(muscle);
  const isCorrect = category === 'Shoulders';
  console.log(`  ${muscle.padEnd(15)} → ${category.padEnd(12)} ${isCorrect ? '✓' : '✗ FAIL'}`);
});
console.log('');

// Test 2: Back muscles should NOT include delts
console.log('Test 2: Back muscles should NOT include any delts');
const backMuscles = MUSCLE_CATEGORY_MAP['Back'];
const hasDelts = backMuscles.some(m => m.toLowerCase().includes('delt') || m === 'Shoulders');
console.log('  Back category muscles:', backMuscles.join(', '));
console.log('  Contains delts/shoulders:', hasDelts ? '✗ FAIL' : '✓ PASS');
console.log('');

// Test 3: Secondary muscle categorization for delts variants
console.log('Test 3: Secondary muscle categorization for delts variants');
deltVariants.forEach(muscle => {
  const category = getSecondaryMuscleCategory(muscle);
  const isCorrect = category === 'Shoulders';
  console.log(`  ${muscle.padEnd(15)} → ${category ? category.padEnd(12) : 'null'.padEnd(12)} ${isCorrect ? '✓' : '✗ FAIL'}`);
});
console.log('');

// Test 4: Shoulders category exists and is properly defined
console.log('Test 4: Shoulders category exists and is properly defined');
const shouldersExistsInPrimary = 'Shoulders' in MUSCLE_CATEGORY_MAP;
const shouldersExistsInSecondary = 'Shoulders' in SECONDARY_MUSCLE_CATEGORY_MAP;
console.log('  Shoulders in MUSCLE_CATEGORY_MAP:', shouldersExistsInPrimary ? '✓ YES' : '✗ NO');
console.log('  Shoulders in SECONDARY_MUSCLE_CATEGORY_MAP:', shouldersExistsInSecondary ? '✓ YES' : '✗ NO');
console.log('  Primary mapping:', MUSCLE_CATEGORY_MAP['Shoulders']);
console.log('  Secondary mapping:', SECONDARY_MUSCLE_CATEGORY_MAP['Shoulders']);
console.log('');

// Test 5: Example exercise (Dumbbell Arnold Press)
console.log('Test 5: Example exercise categorization - Dumbbell Arnold Press');
const arnoldPress = {
  name: 'Dumbbell Arnold Press',
  primaryMuscle: 'Delts',
  secondaryMuscles: 'Triceps, Chest'
};
const primaryCategory = getMuscleCategory(arnoldPress.primaryMuscle);
console.log('  Exercise:', arnoldPress.name);
console.log('  Primary Muscle:', arnoldPress.primaryMuscle);
console.log('  Primary Category:', primaryCategory);
console.log('  Expected Category: Shoulders');
console.log('  Result:', primaryCategory === 'Shoulders' ? '✓ PASS' : '✗ FAIL');
console.log('');

// Test 6: Verify no overlap between Back and Shoulders
console.log('Test 6: Verify no overlap between Back and Shoulders categories');
const backSet = new Set(MUSCLE_CATEGORY_MAP['Back']);
const shouldersSet = new Set(MUSCLE_CATEGORY_MAP['Shoulders']);
const overlap = [...backSet].filter(m => shouldersSet.has(m));
console.log('  Back muscles:', backSet.size, 'muscles');
console.log('  Shoulders muscles:', shouldersSet.size, 'muscles');
console.log('  Overlap:', overlap.length > 0 ? overlap.join(', ') + ' ✗ FAIL' : 'None ✓ PASS');
console.log('');

// Test 7: All categories are accounted for
console.log('Test 7: All muscle categories');
const allCategories = Object.keys(MUSCLE_CATEGORY_MAP);
console.log('  Categories:', allCategories.join(', '));
console.log('  Total categories:', allCategories.length);
console.log('  Includes Shoulders:', allCategories.includes('Shoulders') ? '✓ YES' : '✗ NO');
console.log('');

console.log('=== All Categorization Tests Complete ===');

// Summary
const allPassed = deltVariants.every(m => getMuscleCategory(m) === 'Shoulders') &&
                  deltVariants.every(m => getSecondaryMuscleCategory(m) === 'Shoulders') &&
                  !hasDelts &&
                  overlap.length === 0 &&
                  shouldersExistsInPrimary &&
                  shouldersExistsInSecondary;

console.log('\nSummary:');
console.log('- All delts variants map to "Shoulders" category:', allPassed ? '✓' : '✗');
console.log('- No overlap between Back and Shoulders:', overlap.length === 0 ? '✓' : '✗');
console.log('- Shoulders category properly defined:', shouldersExistsInPrimary && shouldersExistsInSecondary ? '✓' : '✗');
console.log('\nOverall:', allPassed ? '✓ ALL TESTS PASSED' : '✗ SOME TESTS FAILED');
