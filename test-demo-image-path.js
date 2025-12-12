// Test to verify getDemoImagePath is working correctly
import { getDemoImagePath } from './src/utils/exerciseDemoImages.js';
import { isSvgDataUrl } from './src/utils/muscleHighlightSvg.js';

console.log('=== Testing getDemoImagePath ===\n');

// Test 1: Exercise WITH webp file
const benchPress = getDemoImagePath('Barbell Bench Press', true, 'barbell-bench-press.webp', 'Chest', 'Triceps');
console.log('1. Barbell Bench Press (has webp):');
console.log('   Result:', benchPress);
console.log('   Is SVG?:', isSvgDataUrl(benchPress));
console.log('');

// Test 2: Exercise WITHOUT webp file (should return SVG)
const cableFly = getDemoImagePath('Cable Fly', true, null, 'Chest', 'Front Delts');
console.log('2. Cable Fly (no webp, should be SVG):');
console.log('   Result:', cableFly ? cableFly.substring(0, 100) + '...' : 'null');
console.log('   Is SVG?:', isSvgDataUrl(cableFly));
console.log('');

// Test 3: Exercise with no muscle data
const unknownExercise = getDemoImagePath('Unknown Exercise', true, null, null, null);
console.log('3. Unknown Exercise (no muscle data):');
console.log('   Result:', unknownExercise);
console.log('   Is SVG?:', isSvgDataUrl(unknownExercise));
console.log('');

// Test 4: Exercise with empty string for muscles
const emptyMuscles = getDemoImagePath('Some Exercise', true, null, '', '');
console.log('4. Exercise with empty muscle strings:');
console.log('   Result:', emptyMuscles);
console.log('   Is SVG?:', isSvgDataUrl(emptyMuscles));
console.log('');

// Test 5: Exercise name only, no optional params
const nameOnly = getDemoImagePath('Test Exercise', true);
console.log('5. Exercise with name only:');
console.log('   Result:', nameOnly);
console.log('   Is SVG?:', isSvgDataUrl(nameOnly));
