/**
 * Exercise Image Display System Tests
 * 
 * Verifies that the exercise image system correctly displays images from:
 * - public/demos/*.webp (photo demonstrations)
 * - public/svg-muscles/*.svg (muscle diagrams)
 * 
 * Tests:
 * 1. All exercises have image field populated
 * 2. Image paths are valid (point to demos/ or svg-muscles/)
 * 3. constructImageUrl correctly builds URLs
 * 4. Image files exist on disk
 * 5. Naming conventions are followed
 */

import { constructImageUrl } from '../src/utils/exerciseDemoImages.js';
import fs from 'fs';
import path from 'path';

// Load exercises data
const exercisesPath = path.join(process.cwd(), 'public/data/exercises.json');
const data = fs.readFileSync(exercisesPath, 'utf8');
const exercises = JSON.parse(data);

console.log('=== Exercise Image Display System Tests ===\n');

// Test 1: All exercises have image field
console.log('Test 1: All exercises have image field');
const exercisesWithoutImage = exercises.filter(ex => !ex.image);
const test1Passed = exercisesWithoutImage.length === 0;
console.log(`  Total exercises: ${exercises.length}`);
console.log(`  Exercises without image: ${exercisesWithoutImage.length}`);
if (!test1Passed) {
  console.log('  Missing images:', exercisesWithoutImage.map(ex => ex['Exercise Name']).slice(0, 5));
}
console.log(`  Result: ${test1Passed ? '✓ PASS' : '✗ FAIL'}\n`);

// Test 2: Valid image paths
console.log('Test 2: Image paths are valid (demos/ or svg-muscles/)');
const invalidPaths = exercises.filter(ex => {
  const img = ex.image;
  return img && !img.startsWith('demos/') && !img.startsWith('svg-muscles/');
});
const test2Passed = invalidPaths.length === 0;
console.log(`  Valid paths: ${exercises.length - invalidPaths.length}/${exercises.length}`);
if (!test2Passed) {
  console.log('  Invalid paths:', invalidPaths.map(ex => ({ name: ex['Exercise Name'], path: ex.image })).slice(0, 3));
}
console.log(`  Result: ${test2Passed ? '✓ PASS' : '✗ FAIL'}\n`);

// Test 3: Correct file formats
console.log('Test 3: Correct file formats (webp for demos, svg for muscles)');
const demoExercises = exercises.filter(ex => ex.image?.startsWith('demos/'));
const nonWebp = demoExercises.filter(ex => !ex.image.endsWith('.webp'));
const svgExercises = exercises.filter(ex => ex.image?.startsWith('svg-muscles/'));
const nonSvg = svgExercises.filter(ex => !ex.image.endsWith('.svg'));
const test3Passed = nonWebp.length === 0 && nonSvg.length === 0;
console.log(`  Demo photos (.webp): ${demoExercises.length - nonWebp.length}/${demoExercises.length}`);
console.log(`  Muscle diagrams (.svg): ${svgExercises.length - nonSvg.length}/${svgExercises.length}`);
if (!test3Passed) {
  if (nonWebp.length > 0) console.log('  Non-webp demos:', nonWebp.slice(0, 3).map(ex => ex.image));
  if (nonSvg.length > 0) console.log('  Non-svg muscles:', nonSvg.slice(0, 3).map(ex => ex.image));
}
console.log(`  Result: ${test3Passed ? '✓ PASS' : '✗ FAIL'}\n`);

// Test 4: Image files exist
console.log('Test 4: Image files exist on disk');
const demosDir = path.join(process.cwd(), 'public/demos');
const svgDir = path.join(process.cwd(), 'public/svg-muscles');
const demoFiles = fs.readdirSync(demosDir).filter(f => f.endsWith('.webp'));
const svgFiles = fs.readdirSync(svgDir).filter(f => f.endsWith('.svg'));

const missingDemoFiles = demoExercises.filter(ex => {
  const filename = ex.image.replace('demos/', '');
  return !demoFiles.includes(filename);
});

const missingSvgFiles = svgExercises.filter(ex => {
  const filename = ex.image.replace('svg-muscles/', '');
  return !svgFiles.includes(filename);
});

const test4Passed = missingDemoFiles.length === 0 && missingSvgFiles.length === 0;
console.log(`  Demo files on disk: ${demoFiles.length}`);
console.log(`  Missing demo files: ${missingDemoFiles.length}`);
console.log(`  SVG files on disk: ${svgFiles.length}`);
console.log(`  Missing SVG files: ${missingSvgFiles.length}`);
if (!test4Passed) {
  if (missingDemoFiles.length > 0) {
    console.log('  Missing demos:', missingDemoFiles.slice(0, 3).map(ex => ex.image));
  }
  if (missingSvgFiles.length > 0) {
    console.log('  Missing SVGs:', missingSvgFiles.slice(0, 3).map(ex => ex.image));
  }
}
console.log(`  Result: ${test4Passed ? '✓ PASS' : '✗ FAIL'}\n`);

// Test 5: constructImageUrl function (basic tests - Vite env not available in Node.js tests)
console.log('Test 5: constructImageUrl function behavior');
console.log('  Note: Full Vite environment tests would require running in browser context');
console.log('  Skipping BASE_URL tests (Vite-specific feature)');

// Basic null/undefined checks that don't require env
const basicTestCases = [
  { input: 'https://example.com/img.jpg', expected: 'https://example.com/img.jpg', desc: 'absolute HTTP URL' },
  { input: 'data:image/png;base64,ABC', expected: 'data:image/png;base64,ABC', desc: 'data URL' },
];

const test5Results = basicTestCases.map(({ input, expected, desc }) => {
  try {
    const result = constructImageUrl(input);
    const passed = result === expected;
    return { desc, passed, input, expected, result };
  } catch (e) {
    return { desc, passed: false, input, expected, result: `Error: ${e.message}` };
  }
});

// Test null/undefined handling
try {
  const nullResult = constructImageUrl(null);
  test5Results.unshift({
    desc: 'null input',
    passed: nullResult === null,
    input: null,
    expected: null,
    result: nullResult
  });
} catch (e) {
  test5Results.unshift({
    desc: 'null input',
    passed: false,
    input: null,
    expected: null,
    result: `Error: ${e.message}`
  });
}

const test5Passed = test5Results.every(r => r.passed);
test5Results.forEach(({ desc, passed, input, expected, result }) => {
  const status = passed ? '✓' : '✗';
  console.log(`  ${status} ${desc}`);
  if (!passed) {
    console.log(`    Input: ${JSON.stringify(input)}`);
    console.log(`    Expected: ${JSON.stringify(expected)}`);
    console.log(`    Got: ${JSON.stringify(result)}`);
  }
});
console.log(`  Result: ${test5Passed ? '✓ PASS' : '✗ FAIL'}\n`);

// Test 6: Kebab-case naming convention
console.log('Test 6: Image filenames use kebab-case');
const invalidNames = exercises.filter(ex => {
  const img = ex.image;
  if (!img) return false;
  
  const filename = img.split('/').pop().replace(/\.(webp|svg)$/, '');
  
  // Check for uppercase, spaces, or underscores
  return /[A-Z\s_]/.test(filename);
});

const test6Passed = invalidNames.length === 0;
console.log(`  Valid kebab-case names: ${exercises.length - invalidNames.length}/${exercises.length}`);
if (!test6Passed) {
  console.log('  Non-kebab-case:', invalidNames.slice(0, 3).map(ex => ex.image));
}
console.log(`  Result: ${test6Passed ? '✓ PASS' : '✗ FAIL'}\n`);

// Summary
console.log('=== Image Distribution Summary ===');
console.log(`Total exercises: ${exercises.length}`);
console.log(`Demo photos (webp): ${demoExercises.length} (${(demoExercises.length / exercises.length * 100).toFixed(1)}%)`);
console.log(`Muscle diagrams (svg): ${svgExercises.length} (${(svgExercises.length / exercises.length * 100).toFixed(1)}%)`);
console.log(`Coverage: ${((demoExercises.length + svgExercises.length) / exercises.length * 100).toFixed(1)}%\n`);

// Final result
const allPassed = test1Passed && test2Passed && test3Passed && test4Passed && test5Passed && test6Passed;
console.log('=== Overall Result ===');
console.log(allPassed ? '✓ ALL TESTS PASSED' : '✗ SOME TESTS FAILED');
process.exit(allPassed ? 0 : 1);
