/**
 * Manual verification script for SVG muscle highlight integration
 * Run with: node tests/verify-svg-integration.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getDemoImagePath } from '../src/utils/exerciseDemoImages.js';
import { 
  getMuscleHighlightDataUrl, 
  isSvgDataUrl, 
  extractSvgFromDataUrl,
  musclesToSvgIds 
} from '../src/utils/muscleHighlightSvg.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// NOTE: import.meta.env is only available in Vite/browser environments
// Some tests that depend on BASE_URL are skipped in Node.js execution

// Main test execution
(async () => {

  console.log('='.repeat(80));
  console.log('SVG Muscle Highlight Integration Verification');
  console.log('='.repeat(80));
  console.log('');

  let passedTests = 0;
  let failedTests = 0;

  function assert(condition, message) {
    if (condition) {
      console.log('  ✓', message);
      passedTests++;
    } else {
      console.log('  ✗', message);
      failedTests++;
    }
  }

  // Test 1: Exercise without demo image should generate SVG
  console.log('Test 1: Exercise without demo image');
  // Load exercise data to get a real exercise without webp
  const exercises = JSON.parse(fs.readFileSync(path.join(__dirname, '../docs/data/exercises.json'), 'utf8'));
  const exerciseWithoutWebp = exercises.find(ex => !ex['Webp File']);
  const testExerciseName = exerciseWithoutWebp['Exercise Name'];
  const testPrimaryMuscle = exerciseWithoutWebp['Primary Muscle'];
  const testSecondaryMuscles = exerciseWithoutWebp['Secondary Muscles'];
  
  const svgPath1 = getDemoImagePath(testExerciseName, true, null, testPrimaryMuscle, testSecondaryMuscles);
  assert(svgPath1, `Returns a path for "${testExerciseName}"`);
  assert(isSvgDataUrl(svgPath1), 'Returns SVG data URL');
  assert(svgPath1.startsWith('data:image/svg+xml'), 'Starts with correct prefix');
  console.log('');

  // Test 2: Exercise with demo image should return webp (SKIPPED - requires Vite env)
  console.log('Test 2: Exercise with demo image (SKIPPED - requires Vite environment)');
  console.log('  ⊘ Skipped (requires Vite import.meta.env)');
  console.log('');

  // Test 3: SVG extraction should work
  console.log('Test 3: SVG extraction and validation');
  const svgDataUrl = getMuscleHighlightDataUrl('Chest', 'Triceps');
  const svgContent = extractSvgFromDataUrl(svgDataUrl);
  assert(svgContent.length > 0, 'Extracts SVG content');
  assert(svgContent.startsWith('<svg'), 'Content starts with <svg tag');
  assert(svgContent.includes('viewBox="0 0 122.04 117.09"'), 'Contains correct viewBox');
  assert(svgContent.includes('cls-1'), 'Contains cls-1 style');
  assert(svgContent.includes('cls-primary'), 'Contains cls-primary style');
  console.log('');

  // Test 4: Contrast updates from PR #383
  console.log('Test 4: PR #383 contrast updates');
  assert(svgContent.includes('#808080'), 'Contains new contrast color #808080');
  assert(svgContent.includes('opacity: 0.5'), 'Contains new opacity value 0.5');
  console.log('');

  // Test 5: Different muscles generate different SVGs
  console.log('Test 5: Different muscle groups');
  const chestSvg = getMuscleHighlightDataUrl('Chest', 'Triceps');
  const quadsSvg = getMuscleHighlightDataUrl('Quads', 'Glutes');
  assert(chestSvg !== quadsSvg, 'Different muscles generate different SVGs');
  assert(isSvgDataUrl(chestSvg), 'Chest SVG is valid');
  assert(isSvgDataUrl(quadsSvg), 'Quads SVG is valid');
  console.log('');

  // Test 6: Muscle name mapping
  console.log('Test 6: Muscle name to SVG ID mapping');
  const chestIds = musclesToSvgIds('Chest');
  const tricepsIds = musclesToSvgIds('Triceps');
  const multipleIds = musclesToSvgIds('Chest, Triceps, Delts');
  assert(chestIds.includes('chest'), 'Maps Chest to chest ID');
  assert(tricepsIds.includes('triceps'), 'Maps Triceps to triceps ID');
  assert(multipleIds.length === 3, 'Handles multiple muscles');
  assert(multipleIds.includes('chest'), 'Multiple: includes chest');
  assert(multipleIds.includes('triceps'), 'Multiple: includes triceps');
  assert(multipleIds.includes('front_delts'), 'Multiple: includes front_delts');
  console.log('');

  // Test 7: Fallback behavior (SKIPPED - requires Vite env)
  console.log('Test 7: Fallback to work-icon (SKIPPED - requires Vite environment)');
  console.log('  ⊘ Skipped (requires Vite import.meta.env)');
  console.log('');

  // Test 8: Security validation
  console.log('Test 8: Security validation');
  const invalidSvg = 'data:image/svg+xml,<script>alert("xss")</script>';
  const extracted = extractSvgFromDataUrl(invalidSvg);
  assert(extracted === '', 'Rejects invalid SVG content');
  console.log('');

  // Test 9: Check exercise data
  console.log('Test 9: Exercise data integrity');
  const withMuscleData = exercises.filter(ex => ex['Primary Muscle']);
  const withoutWebp = exercises.filter(ex => !ex['Webp File']);
  assert(exercises.length > 0, `Loaded ${exercises.length} exercises`);
  assert(withMuscleData.length === exercises.length, 'All exercises have Primary Muscle data');
  assert(withoutWebp.length > 0, `${withoutWebp.length} exercises without webp (should use SVG)`);
  console.log('');

  // Test 10: Integration test - WorkoutScreen scenario
  console.log('Test 10: Workout session integration scenario');
  const sampleExercise = exercises.find(ex => !ex['Webp File']);
  if (sampleExercise) {
    const exerciseName = sampleExercise['Exercise Name'];
    const primaryMuscle = sampleExercise['Primary Muscle'];
    const secondaryMuscles = sampleExercise['Secondary Muscles'];
    const webpFile = sampleExercise['Webp File'];
    
    const imagePath = getDemoImagePath(exerciseName, true, webpFile, primaryMuscle, secondaryMuscles);
    
    assert(imagePath, `Generated path for "${exerciseName}"`);
    assert(isSvgDataUrl(imagePath), `Generated SVG for "${exerciseName}"`);
    
    const content = extractSvgFromDataUrl(imagePath);
    assert(content.length > 0, 'SVG content can be extracted for rendering');
    assert(content.startsWith('<svg'), 'SVG content is valid XML');
  }
  console.log('');

  // Summary
  console.log('='.repeat(80));
  console.log('Test Summary');
  console.log('='.repeat(80));
  console.log(`✓ Passed: ${passedTests}`);
  console.log(`✗ Failed: ${failedTests}`);
  console.log(`Total:    ${passedTests + failedTests}`);
  console.log('');

  if (failedTests === 0) {
    console.log('✅ All tests passed! SVG muscle highlight integration is working correctly.');
  } else {
    console.log('❌ Some tests failed. Please review the output above.');
    process.exit(1);
  }
})().catch(err => {
  console.error('Error running tests:', err);
  process.exit(1);
});
