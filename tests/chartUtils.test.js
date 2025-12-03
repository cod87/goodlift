/**
 * Tests for chart utility functions
 * Tests the y-axis calculation and label positioning logic
 */

import { 
  calculateYAxisMax, 
  getLabelPosition, 
  getLabelAnchor,
  createLabelAlignmentConfig 
} from '../src/utils/chartUtils.js';

console.log('=== Chart Utils Tests ===\n');

let passed = 0;
let failed = 0;

// Helper assertion function
function assert(condition, testName) {
  if (condition) {
    console.log(`✓ ${testName}`);
    passed++;
  } else {
    console.log(`✗ ${testName}`);
    failed++;
  }
}

function assertEqual(actual, expected, testName) {
  const condition = actual === expected;
  if (condition) {
    console.log(`✓ ${testName}`);
    passed++;
  } else {
    console.log(`✗ ${testName} - Expected: ${expected}, Got: ${actual}`);
    failed++;
  }
}

// ========================================
// calculateYAxisMax tests
// ========================================

console.log('\n--- calculateYAxisMax tests ---\n');

// Basic functionality tests
assertEqual(
  calculateYAxisMax([50, 75, 60]),
  150,
  'calculateYAxisMax: add 50 and round to nearest 50 for normal values (max=75)'
);

assertEqual(
  calculateYAxisMax([100, 50, 75]),
  150,
  'calculateYAxisMax: handle values exactly at a multiple of 50 (max=100)'
);

assertEqual(
  calculateYAxisMax([100]),
  150,
  'calculateYAxisMax: handle single value that results in exact multiple (max=100)'
);

assertEqual(
  calculateYAxisMax([80]),
  150,
  'calculateYAxisMax: round up when value + 50 is between multiples of 50 (max=80)'
);

assertEqual(
  calculateYAxisMax([10, 5, 8]),
  100,
  'calculateYAxisMax: handle small values (max=10)'
);

assertEqual(
  calculateYAxisMax([25]),
  100,
  'calculateYAxisMax: handle single small value (max=25)'
);

assertEqual(
  calculateYAxisMax([450, 380, 400]),
  500,
  'calculateYAxisMax: handle large values (max=450)'
);

assertEqual(
  calculateYAxisMax([149]),
  200,
  'calculateYAxisMax: handle value just under multiple boundary (max=149)'
);

assertEqual(
  calculateYAxisMax([151]),
  250,
  'calculateYAxisMax: handle value just over multiple boundary (max=151)'
);

// Edge cases
assertEqual(
  calculateYAxisMax([]),
  100,
  'calculateYAxisMax: return 100 for empty array'
);

assertEqual(
  calculateYAxisMax(null),
  100,
  'calculateYAxisMax: return 100 for null input'
);

assertEqual(
  calculateYAxisMax(undefined),
  100,
  'calculateYAxisMax: return 100 for undefined input'
);

assertEqual(
  calculateYAxisMax([50, 'string', 75, null, undefined]),
  150,
  'calculateYAxisMax: filter out non-numeric values (valid max=75)'
);

assertEqual(
  calculateYAxisMax([60, NaN, 40]),
  150,
  'calculateYAxisMax: filter out NaN values (valid max=60)'
);

assertEqual(
  calculateYAxisMax([0, 0, 0]),
  100,
  'calculateYAxisMax: return 100 for all zero values'
);

assertEqual(
  calculateYAxisMax([-10, -20, -5]),
  100,
  'calculateYAxisMax: return 100 for negative max value'
);

// ========================================
// getLabelPosition tests
// ========================================

console.log('\n--- getLabelPosition tests ---\n');

// Basic positioning tests
assertEqual(
  getLabelPosition(50, 100),
  'top',
  'getLabelPosition: return "top" for values below threshold (50% of max)'
);

assertEqual(
  getLabelPosition(90, 100),
  'bottom',
  'getLabelPosition: return "bottom" for values at threshold (90% of max)'
);

assertEqual(
  getLabelPosition(95, 100),
  'bottom',
  'getLabelPosition: return "bottom" for values above threshold (95% of max)'
);

assertEqual(
  getLabelPosition(89, 100),
  'top',
  'getLabelPosition: return "top" for value just below threshold (89% of max)'
);

// Custom threshold tests
assertEqual(
  getLabelPosition(80, 100, 0.75),
  'bottom',
  'getLabelPosition: use custom threshold 0.75 (80% >= 75%)'
);

assertEqual(
  getLabelPosition(85, 100, 0.8),
  'bottom',
  'getLabelPosition: use custom threshold 0.8 (85% >= 80%)'
);

assertEqual(
  getLabelPosition(92, 100, 0.95),
  'top',
  'getLabelPosition: use custom threshold 0.95 (92% < 95%)'
);

// Edge cases
assertEqual(
  getLabelPosition('string', 100),
  'top',
  'getLabelPosition: return "top" for non-numeric data value'
);

assertEqual(
  getLabelPosition(50, 'string'),
  'top',
  'getLabelPosition: return "top" for non-numeric y-axis max'
);

assertEqual(
  getLabelPosition(null, 100),
  'top',
  'getLabelPosition: return "top" for null data value'
);

assertEqual(
  getLabelPosition(50, null),
  'top',
  'getLabelPosition: return "top" for null y-axis max'
);

assertEqual(
  getLabelPosition(undefined, 100),
  'top',
  'getLabelPosition: return "top" for undefined data value'
);

assertEqual(
  getLabelPosition(50, undefined),
  'top',
  'getLabelPosition: return "top" for undefined y-axis max'
);

// ========================================
// getLabelAnchor tests
// ========================================

console.log('\n--- getLabelAnchor tests ---\n');

assertEqual(
  getLabelAnchor(50, 100),
  'end',
  'getLabelAnchor: return "end" for values below threshold (top position)'
);

assertEqual(
  getLabelAnchor(90, 100),
  'start',
  'getLabelAnchor: return "start" for values at threshold (bottom position)'
);

assertEqual(
  getLabelAnchor(95, 100),
  'start',
  'getLabelAnchor: return "start" for values above threshold'
);

assertEqual(
  getLabelAnchor(80, 100, 0.75),
  'start',
  'getLabelAnchor: use custom threshold when provided'
);

assertEqual(
  getLabelAnchor('string', 100),
  'end',
  'getLabelAnchor: return "end" for invalid values (falls back to top)'
);

// ========================================
// createLabelAlignmentConfig tests
// ========================================

console.log('\n--- createLabelAlignmentConfig tests ---\n');

const config = createLabelAlignmentConfig(100);

assert(
  typeof config.align === 'function',
  'createLabelAlignmentConfig: returns object with align function'
);

assert(
  typeof config.anchor === 'function',
  'createLabelAlignmentConfig: returns object with anchor function'
);

// Test align function
const contextBelow = {
  dataset: { data: [50, 60, 70] },
  dataIndex: 0,
};

assertEqual(
  config.align(contextBelow),
  'top',
  'createLabelAlignmentConfig: align returns "top" for values below threshold'
);

const contextAbove = {
  dataset: { data: [90, 60, 70] },
  dataIndex: 0,
};

assertEqual(
  config.align(contextAbove),
  'bottom',
  'createLabelAlignmentConfig: align returns "bottom" for values at or above threshold'
);

// Test anchor function
assertEqual(
  config.anchor(contextBelow),
  'end',
  'createLabelAlignmentConfig: anchor returns "end" for values below threshold'
);

assertEqual(
  config.anchor(contextAbove),
  'start',
  'createLabelAlignmentConfig: anchor returns "start" for values at or above threshold'
);

// Test with custom threshold
const configCustom = createLabelAlignmentConfig(100, 0.75);
const contextCustom = {
  dataset: { data: [80, 60, 70] },
  dataIndex: 0,
};

assertEqual(
  configCustom.align(contextCustom),
  'bottom',
  'createLabelAlignmentConfig: uses custom threshold for align'
);

// ========================================
// Integration scenarios
// ========================================

console.log('\n--- Integration scenarios ---\n');

// Workout data scenario
const workoutCounts = [3, 5, 4, 7];
const workoutYAxisMax = calculateYAxisMax(workoutCounts);

assertEqual(
  workoutYAxisMax,
  100,
  'Integration: workout counts (max=7) y-axis max is 100'
);

assertEqual(
  getLabelPosition(7, workoutYAxisMax),
  'top',
  'Integration: workout value 7 is below threshold, positioned top'
);

// Volume data scenario
const volumeData = [45, 52, 48, 90];
const volumeYAxisMax = calculateYAxisMax(volumeData);

assertEqual(
  volumeYAxisMax,
  150,
  'Integration: volume data (max=90) y-axis max is 150'
);

assertEqual(
  getLabelPosition(90, volumeYAxisMax),
  'top',
  'Integration: volume value 90 is 60% of 150, positioned top'
);

assertEqual(
  getLabelPosition(140, volumeYAxisMax),
  'bottom',
  'Integration: volume value 140 is 93% of 150, positioned bottom'
);

// Weight tracking scenario
const weightData = [180, 178, 175, 174];
const weightYAxisMax = calculateYAxisMax(weightData);

assertEqual(
  weightYAxisMax,
  250,
  'Integration: weight data (max=180) y-axis max is 250'
);

assertEqual(
  getLabelPosition(180, weightYAxisMax),
  'top',
  'Integration: weight value 180 is 72% of 250, positioned top'
);

assertEqual(
  getLabelPosition(230, weightYAxisMax),
  'bottom',
  'Integration: weight value 230 is 92% of 250, positioned bottom'
);

// Edge case: data close to max after rounding
const edgeData = [45, 47, 46];
const edgeYAxisMax = calculateYAxisMax(edgeData);

assertEqual(
  edgeYAxisMax,
  100,
  'Integration: edge case data (max=47) y-axis max is 100'
);

assertEqual(
  getLabelPosition(95, edgeYAxisMax),
  'bottom',
  'Integration: edge case value 95 is 95% of 100, positioned bottom'
);

assertEqual(
  getLabelPosition(47, edgeYAxisMax),
  'top',
  'Integration: edge case value 47 is 47% of 100, positioned top'
);

// ========================================
// Summary
// ========================================

console.log('\n=== Test Summary ===');
console.log(`Passed: ${passed}`);
console.log(`Failed: ${failed}`);
console.log(`Total: ${passed + failed}`);

if (failed > 0) {
  console.log('\n❌ Some tests failed!');
  process.exit(1);
} else {
  console.log('\n✅ All tests passed!');
  process.exit(0);
}
