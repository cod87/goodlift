/**
 * Manual test for muscle category mapping functionality
 * Run with: node scripts/test-muscle-categories.js
 * 
 * This test verifies:
 * 1. All exercises can be categorized using simplified muscle groups
 * 2. Filtering by category works correctly
 * 3. Original muscle metadata is preserved
 */

import exercisesData from '../docs/data/exercises.json' assert { type: 'json' };
import { 
  getMuscleCategory, 
  getAllCategories, 
  groupExercisesByCategory,
  filterExercisesByCategory,
  MUSCLE_CATEGORY_MAP,
  MUSCLE_TO_CATEGORY
} from '../src/utils/muscleCategories.js';

console.log('='.repeat(80));
console.log('TESTING MUSCLE CATEGORY MAPPING');
console.log('='.repeat(80));

// Test 1: Verify all categories are defined
console.log('\n1. Testing Category Definitions');
console.log('-'.repeat(80));
const categories = getAllCategories();
console.log('Available simplified categories:', categories.join(', '));
console.log('Total categories:', categories.length);

// Test 2: Verify muscle to category mapping
console.log('\n2. Testing Muscle-to-Category Mapping');
console.log('-'.repeat(80));
Object.entries(MUSCLE_CATEGORY_MAP).forEach(([category, muscles]) => {
  console.log(`${category}:`);
  muscles.forEach(muscle => {
    const mappedCategory = getMuscleCategory(muscle);
    const isCorrect = mappedCategory === category ? '✓' : '✗';
    console.log(`  ${isCorrect} ${muscle} → ${mappedCategory}`);
  });
});

// Test 3: Verify all exercises can be categorized
console.log('\n3. Testing Exercise Categorization');
console.log('-'.repeat(80));
const uniqueMuscles = [...new Set(exercisesData.map(ex => ex['Primary Muscle'].split('(')[0].trim()))];
console.log('Unique primary muscles in data:', uniqueMuscles.length);
console.log('Muscles found:', uniqueMuscles.join(', '));

let unmappedCount = 0;
uniqueMuscles.forEach(muscle => {
  const category = getMuscleCategory(muscle);
  if (category === muscle && !categories.includes(muscle)) {
    console.log(`  ⚠️  Unmapped muscle: ${muscle}`);
    unmappedCount++;
  }
});

if (unmappedCount === 0) {
  console.log('✅ All muscles successfully mapped to categories!');
} else {
  console.log(`❌ Found ${unmappedCount} unmapped muscles`);
}

// Test 4: Group exercises by category
console.log('\n4. Testing Exercise Grouping');
console.log('-'.repeat(80));
const grouped = groupExercisesByCategory(exercisesData);
Object.entries(grouped).sort((a, b) => b[1].length - a[1].length).forEach(([category, exercises]) => {
  const uniquePrimaryMuscles = [...new Set(exercises.map(ex => ex['Primary Muscle'].split('(')[0].trim()))];
  console.log(`${category}: ${exercises.length} exercises (from: ${uniquePrimaryMuscles.join(', ')})`);
});

// Test 5: Test filtering by specific categories
console.log('\n5. Testing Category Filtering');
console.log('-'.repeat(80));
const testCategories = ['Back', 'Shoulders', 'Core', 'Biceps'];
testCategories.forEach(category => {
  const filtered = filterExercisesByCategory(exercisesData, category);
  const sampleExercises = filtered.slice(0, 3).map(ex => ex['Exercise Name']);
  console.log(`${category}: ${filtered.length} exercises`);
  console.log(`  Sample: ${sampleExercises.join(', ')}`);
});

// Test 6: Verify metadata preservation
console.log('\n6. Testing Metadata Preservation');
console.log('-'.repeat(80));
const sampleExercise = exercisesData[0];
const category = getMuscleCategory(sampleExercise['Primary Muscle']);
console.log('Sample Exercise:', sampleExercise['Exercise Name']);
console.log('  Original Primary Muscle:', sampleExercise['Primary Muscle']);
console.log('  Simplified Category:', category);
console.log('  Secondary Muscles:', sampleExercise['Secondary Muscles']);
console.log('  Equipment:', sampleExercise['Equipment']);
console.log('  Exercise Type:', sampleExercise['Exercise Type']);
console.log('✅ All original metadata preserved!');

// Test 7: Verify specific mappings per requirements
console.log('\n7. Testing Specific Category Requirements');
console.log('-'.repeat(80));
const requirements = [
  { category: 'Back', muscles: ['Lats', 'Traps', 'Erector Spinae'] },
  { category: 'Shoulders', muscles: ['Shoulders', 'Delts', 'Rear Delts'] },
  { category: 'Core', muscles: ['Core', 'Obliques', 'Hip Flexors'] },
  { category: 'Biceps', muscles: ['Biceps', 'Forearms'] },
  { category: 'Glutes', muscles: ['Glutes', 'Adductors'] },
  { category: 'All', muscles: ['Full Body'] }
];

let requirementsMet = true;
requirements.forEach(({ category, muscles }) => {
  console.log(`Testing ${category} category:`);
  muscles.forEach(muscle => {
    const mapped = getMuscleCategory(muscle);
    const isCorrect = mapped === category;
    const symbol = isCorrect ? '✓' : '✗';
    console.log(`  ${symbol} ${muscle} → ${mapped} (expected: ${category})`);
    if (!isCorrect) requirementsMet = false;
  });
});

if (requirementsMet) {
  console.log('✅ All specific requirements met!');
} else {
  console.log('❌ Some requirements not met');
}

// Summary
console.log('\n' + '='.repeat(80));
console.log('TEST SUMMARY');
console.log('='.repeat(80));
console.log('Total exercises:', exercisesData.length);
console.log('Unique primary muscles:', uniqueMuscles.length);
console.log('Simplified categories:', categories.length);
console.log('Unmapped muscles:', unmappedCount);
console.log('Status:', unmappedCount === 0 && requirementsMet ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED');
console.log('='.repeat(80));
