#!/usr/bin/env node
/**
 * Validation script for exercise name migration
 * Verifies that all data files are properly formatted
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('=== Exercise Name Migration Validation ===\n');

let allTestsPassed = true;

// Test 1: Check exercises.json format
console.log('Test 1: Validate exercises.json format');
try {
  const exercisesPath = path.join(__dirname, '../public/data/exercises.json');
  const exercisesData = JSON.parse(fs.readFileSync(exercisesPath, 'utf-8'));
  
  console.log(`  Total exercises: ${exercisesData.length}`);
  
  // Check for old format names (Equipment First pattern)
  const oldFormatPattern = /^(Barbell|Dumbbell|Cable|Kettlebell|Landmine|Rope|Slam Ball) /;
  const oldFormatExercises = exercisesData.filter(ex => 
    oldFormatPattern.test(ex['Exercise Name'])
  );
  
  if (oldFormatExercises.length > 0) {
    console.log('  ✗ FAIL: Found exercises in old format:');
    oldFormatExercises.forEach(ex => {
      console.log(`    - "${ex['Exercise Name']}"`);
    });
    allTestsPassed = false;
  } else {
    console.log('  ✓ PASS: No old format names found');
  }
  
  // Count exercises in new format
  const newFormatPattern = /, (Barbell|Dumbbell|Cable|Kettlebell|Landmine|Rope|Slam Ball)$/;
  const newFormatExercises = exercisesData.filter(ex => 
    newFormatPattern.test(ex['Exercise Name'])
  );
  
  console.log(`  New format exercises: ${newFormatExercises.length}`);
  console.log('');
} catch (error) {
  console.log(`  ✗ FAIL: Error reading exercises.json: ${error.message}`);
  allTestsPassed = false;
}

// Test 2: Check CSV files
console.log('Test 2: Validate CSV files');
const csvFiles = ['exercise-expanded.csv', 'cable-exercise.csv'];

csvFiles.forEach(filename => {
  try {
    const csvPath = path.join(__dirname, '../public/data', filename);
    const csvContent = fs.readFileSync(csvPath, 'utf-8');
    const lines = csvContent.split('\n').filter(line => line.trim());
    
    console.log(`  ${filename}:`);
    
    // Check for old format in first column (Exercise Name)
    const oldFormatPattern = /^(Barbell|Dumbbell|Cable|Kettlebell|Landmine|Rope|Slam Ball) /;
    const oldFormatLines = lines.slice(1).filter(line => {
      const exerciseName = line.split(',')[0];
      return oldFormatPattern.test(exerciseName);
    });
    
    if (oldFormatLines.length > 0) {
      console.log('    ✗ FAIL: Found old format names:');
      oldFormatLines.slice(0, 5).forEach(line => {
        const exerciseName = line.split(',')[0];
        console.log(`      - "${exerciseName}"`);
      });
      if (oldFormatLines.length > 5) {
        console.log(`      ... and ${oldFormatLines.length - 5} more`);
      }
      allTestsPassed = false;
    } else {
      console.log('    ✓ PASS: All exercises in correct format');
    }
  } catch (error) {
    console.log(`    ✗ FAIL: Error reading ${filename}: ${error.message}`);
    allTestsPassed = false;
  }
});

console.log('');

// Test 3: Verify normalizer mapping completeness
console.log('Test 3: Check normalizer mapping');
try {
  const normalizerPath = path.join(__dirname, '../src/utils/exerciseNameNormalizer.js');
  const normalizerContent = fs.readFileSync(normalizerPath, 'utf-8');
  
  // Count mappings
  const mappingMatches = normalizerContent.match(/'[^']+': '[^']+',/g);
  const mappingCount = mappingMatches ? mappingMatches.length : 0;
  
  console.log(`  Total mappings: ${mappingCount}`);
  
  if (mappingCount >= 100) {
    console.log('  ✓ PASS: Comprehensive mapping (100+ entries)');
  } else {
    console.log(`  ⚠ WARNING: Only ${mappingCount} mappings (expected 100+)`);
  }
} catch (error) {
  console.log(`  ✗ FAIL: Error reading normalizer: ${error.message}`);
  allTestsPassed = false;
}

console.log('');

// Test 4: Verify migration utility exists
console.log('Test 4: Check migration utility');
try {
  const migrationPath = path.join(__dirname, '../src/utils/exerciseNameMigration.js');
  if (fs.existsSync(migrationPath)) {
    const stats = fs.statSync(migrationPath);
    console.log(`  ✓ PASS: Migration utility exists (${stats.size} bytes)`);
  } else {
    console.log('  ✗ FAIL: Migration utility not found');
    allTestsPassed = false;
  }
} catch (error) {
  console.log(`  ✗ FAIL: Error checking migration utility: ${error.message}`);
  allTestsPassed = false;
}

console.log('');

// Test 5: Check docs directory sync
console.log('Test 5: Verify docs directory sync');
const publicFiles = ['exercises.json', 'exercise-expanded.csv', 'cable-exercise.csv'];
let syncFailed = false;

publicFiles.forEach(filename => {
  try {
    const publicPath = path.join(__dirname, '../public/data', filename);
    const docsPath = path.join(__dirname, '../docs/data', filename);
    
    if (fs.existsSync(docsPath)) {
      const publicContent = fs.readFileSync(publicPath, 'utf-8');
      const docsContent = fs.readFileSync(docsPath, 'utf-8');
      
      if (publicContent === docsContent) {
        console.log(`  ✓ ${filename}: Synced`);
      } else {
        console.log(`  ✗ ${filename}: Out of sync`);
        syncFailed = true;
        allTestsPassed = false;
      }
    } else {
      console.log(`  ⚠ ${filename}: Missing in docs/`);
    }
  } catch (error) {
    console.log(`  ✗ ${filename}: Error checking sync: ${error.message}`);
    syncFailed = true;
    allTestsPassed = false;
  }
});

console.log('');

// Summary
console.log('=== Validation Summary ===');
if (allTestsPassed) {
  console.log('✓ ALL VALIDATIONS PASSED');
  console.log('\nExercise name migration is complete and validated!');
} else {
  console.log('✗ SOME VALIDATIONS FAILED');
  console.log('\nPlease review the errors above and run migration scripts again if needed.');
  process.exit(1);
}
