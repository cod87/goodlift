#!/usr/bin/env node
/**
 * Verification script for exercise name migration
 * 
 * This script verifies that:
 * 1. All old format exercise names have been converted
 * 2. No old format references remain in source files
 * 3. The mapping file is correct
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let errors = 0;
let warnings = 0;

console.log('=== Exercise Name Migration Verification ===\n');

// 1. Verify exercises.json has no old format names
console.log('1. Checking exercises.json for old format names...');
try {
  const exercisesPath = path.join(__dirname, '../public/data/exercises.json');
  const exercisesContent = fs.readFileSync(exercisesPath, 'utf-8');
  const exercises = JSON.parse(exercisesContent);
  
  const equipmentPrefixes = ['Dumbbell ', 'Barbell ', 'Kettlebell ', 'Landmine ', 'Slam Ball '];
  const oldFormatExercises = exercises.filter(ex => {
    const name = ex['Exercise Name'];
    return equipmentPrefixes.some(prefix => name.startsWith(prefix));
  });
  
  if (oldFormatExercises.length > 0) {
    console.error(`   ❌ Found ${oldFormatExercises.length} exercises with old format:`);
    oldFormatExercises.forEach(ex => console.error(`      - ${ex['Exercise Name']}`));
    errors++;
  } else {
    console.log('   ✓ No old format exercise names found');
  }
} catch (error) {
  console.error('   ❌ Error checking exercises.json:', error.message);
  errors++;
}

// 2. Verify CSV source has no old format names
console.log('\n2. Checking exercise-expanded.csv for old format names...');
try {
  const csvPath = path.join(__dirname, '../public/data/exercise-expanded.csv');
  const csvContent = fs.readFileSync(csvPath, 'utf-8');
  const lines = csvContent.split('\n').slice(1); // Skip header
  
  const equipmentPrefixes = ['Dumbbell ', 'Barbell ', 'Kettlebell ', 'Landmine ', 'Slam Ball '];
  const oldFormatLines = [];
  
  lines.forEach((line, index) => {
    if (line.trim()) {
      const firstColumn = line.split(',')[0];
      if (equipmentPrefixes.some(prefix => firstColumn.startsWith(prefix))) {
        oldFormatLines.push({ line: index + 2, name: firstColumn });
      }
    }
  });
  
  if (oldFormatLines.length > 0) {
    console.error(`   ❌ Found ${oldFormatLines.length} lines with old format:`);
    oldFormatLines.slice(0, 5).forEach(item => {
      console.error(`      Line ${item.line}: ${item.name}`);
    });
    if (oldFormatLines.length > 5) {
      console.error(`      ... and ${oldFormatLines.length - 5} more`);
    }
    errors++;
  } else {
    console.log('   ✓ No old format names found in CSV');
  }
} catch (error) {
  console.error('   ❌ Error checking CSV:', error.message);
  errors++;
}

// 3. Verify workout templates have no old format references
console.log('\n3. Checking workoutTemplates.js for old format references...');
try {
  const templatesPath = path.join(__dirname, '../src/data/workoutTemplates.js');
  const templatesContent = fs.readFileSync(templatesPath, 'utf-8');
  
  // Check for old format patterns in name fields (exclude notes)
  const oldFormatPatterns = [
    { pattern: /name:\s*['"]Dumbbell\s+[A-Z]/g, desc: 'Dumbbell prefix' },
    { pattern: /name:\s*['"]Barbell\s+[A-Z]/g, desc: 'Barbell prefix' },
    { pattern: /name:\s*['"]Kettlebell\s+[A-Z]/g, desc: 'Kettlebell prefix' }
  ];
  
  let foundOldFormat = false;
  oldFormatPatterns.forEach(({ pattern, desc }) => {
    const matches = templatesContent.match(pattern);
    if (matches && matches.length > 0) {
      console.error(`   ❌ Found ${matches.length} references with ${desc}:`);
      matches.slice(0, 3).forEach(match => console.error(`      - ${match}`));
      foundOldFormat = true;
      errors++;
    }
  });
  
  if (!foundOldFormat) {
    console.log('   ✓ No old format references in workout templates');
  }
} catch (error) {
  console.error('   ❌ Error checking workout templates:', error.message);
  errors++;
}

// 4. Verify mapping file exists and is valid
console.log('\n4. Checking exercise-name-mapping.json...');
try {
  const mappingPath = path.join(__dirname, '../public/data/exercise-name-mapping.json');
  const mappingContent = fs.readFileSync(mappingPath, 'utf-8');
  const mapping = JSON.parse(mappingContent);
  
  const mappingCount = Object.keys(mapping).length;
  if (mappingCount === 0) {
    console.error('   ❌ Mapping file is empty');
    errors++;
  } else {
    console.log(`   ✓ Mapping file contains ${mappingCount} conversions`);
    
    // Verify a few key mappings
    const keyMappings = [
      ['Dumbbell Bench Press', 'Bench Press, Dumbbell'],
      ['Barbell Deadlift', 'Deadlift, Barbell'],
      ['Kettlebell Swing', 'Swing, Kettlebell']
    ];
    
    keyMappings.forEach(([old, expected]) => {
      if (mapping[old] !== expected) {
        console.error(`   ❌ Invalid mapping: "${old}" -> "${mapping[old]}" (expected "${expected}")`);
        errors++;
      }
    });
  }
} catch (error) {
  console.error('   ❌ Error checking mapping file:', error.message);
  errors++;
}

// 5. Check for any remaining hardcoded old format in source files
console.log('\n5. Checking source files for hardcoded old format names...');
try {
  const helperPath = path.join(__dirname, '../src/utils/helpers.js');
  const helperContent = fs.readFileSync(helperPath, 'utf-8');
  
  // Check if the example in the comment is still using old format
  if (helperContent.includes("splitExerciseName('Dumbbell Bench Press')")) {
    console.warn('   ⚠️  helpers.js comment still uses old format example (cosmetic only)');
    warnings++;
  }
  
  console.log('   ✓ Source files checked');
} catch (error) {
  console.error('   ❌ Error checking source files:', error.message);
  errors++;
}

// 6. Verify migration utility exists
console.log('\n6. Checking migration utility...');
try {
  const migrationPath = path.join(__dirname, '../src/utils/exerciseNameMigration.js');
  if (fs.existsSync(migrationPath)) {
    console.log('   ✓ Migration utility exists');
  } else {
    console.error('   ❌ Migration utility not found');
    errors++;
  }
} catch (error) {
  console.error('   ❌ Error checking migration utility:', error.message);
  errors++;
}

// Summary
console.log('\n=== Verification Summary ===');
console.log(`Errors: ${errors}`);
console.log(`Warnings: ${warnings}`);

if (errors === 0 && warnings === 0) {
  console.log('\n✓ All checks passed! Migration is complete and verified.');
  process.exit(0);
} else if (errors === 0) {
  console.log(`\n✓ Migration complete with ${warnings} warning(s).`);
  process.exit(0);
} else {
  console.log(`\n❌ Migration verification failed with ${errors} error(s).`);
  process.exit(1);
}
