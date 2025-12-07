#!/usr/bin/env node
/**
 * Exercise Name Migration Script
 * 
 * Migrates exercise names in CSV files from old format (Equipment First) 
 * to new format (Movement, Equipment).
 * 
 * Examples:
 *   "Barbell Bench Press" → "Bench Press, Barbell"
 *   "Dumbbell Romanian Deadlift" → "Romanian Deadlift, Dumbbell"
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Papa from 'papaparse';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Exercise name mapping from old format to new format
// Based on the existing normalizer mapping plus additional exercises
const EXERCISE_NAME_MAPPING = {
  // Barbell exercises
  'Barbell Belt Squat': 'Belt Squat, Barbell',
  'Barbell Bench Press': 'Bench Press, Barbell',
  'Barbell Bent-Over Row': 'Bent-Over Row, Barbell',
  'Barbell Bicep Curl': 'Bicep Curl, Barbell',
  'Barbell Box Squat': 'Box Squat, Barbell',
  'Barbell Clean': 'Clean, Barbell',
  'Barbell Close Grip Bench Press': 'Close Grip Bench Press, Barbell',
  'Barbell Deadlift': 'Deadlift, Barbell',
  'Barbell Decline Bench Press': 'Decline Bench Press, Barbell',
  'Barbell Front Squat': 'Front Squat, Barbell',
  'Barbell Good Morning': 'Good Morning, Barbell',
  'Barbell Hack Squat': 'Hack Squat, Barbell',
  'Barbell High Pull': 'High Pull, Barbell',
  'Barbell Hip Thrust': 'Hip Thrust, Barbell',
  'Barbell Incline Bench Press': 'Incline Bench Press, Barbell',
  'Barbell Overhead Press': 'Overhead Press, Barbell',
  'Barbell Paused Bench Press': 'Paused Bench Press, Barbell',
  'Barbell Pendulum Squat': 'Pendulum Squat, Barbell',
  'Barbell Pullover': 'Pullover, Barbell',
  'Barbell Push Press': 'Push Press, Barbell',
  'Barbell Romanian Deadlift': 'Romanian Deadlift, Barbell',
  'Barbell Shrug': 'Shrug, Barbell',
  'Barbell Snatch': 'Snatch, Barbell',
  'Barbell Squat (High Bar)': 'Squat (High Bar), Barbell',
  'Barbell Sumo Deadlift': 'Sumo Deadlift, Barbell',
  'Barbell Thruster': 'Thruster, Barbell',
  'Barbell Trap Bar Deadlift': 'Trap Bar Deadlift, Barbell',
  'Barbell Upright Row': 'Upright Row, Barbell',
  
  // Dumbbell exercises
  'Dumbbell Arnold Press': 'Arnold Press, Dumbbell',
  'Dumbbell Bench Press': 'Bench Press, Dumbbell',
  'Dumbbell Bent-Over Row': 'Bent-Over Row, Dumbbell',
  'Dumbbell Bicep Curl': 'Bicep Curl, Dumbbell',
  'Dumbbell Bulgarian Split Squat': 'Bulgarian Split Squat, Dumbbell',
  'Dumbbell Close Grip Bench Press': 'Close Grip Bench Press, Dumbbell',
  'Dumbbell Concentration Curl': 'Concentration Curl, Dumbbell',
  'Dumbbell Deadlift': 'Deadlift, Dumbbell',
  'Dumbbell Decline Bench Press': 'Decline Bench Press, Dumbbell',
  'Dumbbell Farmer Carry': 'Farmer Carry, Dumbbell',
  'Dumbbell Fly': 'Fly, Dumbbell',
  'Dumbbell Front Raise': 'Front Raise, Dumbbell',
  'Dumbbell Front Squat': 'Front Squat, Dumbbell',
  'Dumbbell Goblet Squat': 'Goblet Squat, Dumbbell',
  'Dumbbell Hammer Curl': 'Hammer Curl, Dumbbell',
  'Dumbbell Incline Bench Press': 'Incline Bench Press, Dumbbell',
  'Dumbbell Incline Curl': 'Incline Curl, Dumbbell',
  'Dumbbell Incline Fly': 'Incline Fly, Dumbbell',
  'Dumbbell Jump Squat': 'Jump Squat, Dumbbell',
  'Dumbbell Kickback': 'Kickback, Dumbbell',
  'Dumbbell Lateral Raise': 'Lateral Raise, Dumbbell',
  'Dumbbell Lunge': 'Lunge, Dumbbell',
  'Dumbbell Overhead Tricep Extension': 'Overhead Tricep Extension, Dumbbell',
  'Dumbbell Pendlay Row': 'Pendlay Row, Dumbbell',
  'Dumbbell Pullover': 'Pullover, Dumbbell',
  'Dumbbell Renegade Row': 'Renegade Row, Dumbbell',
  'Dumbbell Reverse Fly': 'Reverse Fly, Dumbbell',
  'Dumbbell Reverse Lunge': 'Reverse Lunge, Dumbbell',
  'Dumbbell Romanian Deadlift': 'Romanian Deadlift, Dumbbell',
  'Dumbbell Shoulder Press': 'Shoulder Press, Dumbbell',
  'Dumbbell Shrug': 'Shrug, Dumbbell',
  'Dumbbell Single-Arm Row': 'Single-Arm Row, Dumbbell',
  'Dumbbell Single-Arm Shoulder Press': 'Single-Arm Shoulder Press, Dumbbell',
  'Dumbbell Single-Leg Deadlift': 'Single-Leg Deadlift, Dumbbell',
  'Dumbbell Squat': 'Squat, Dumbbell',
  'Dumbbell Step-Up': 'Step-Up, Dumbbell',
  'Dumbbell Suitcase Deadlift': 'Suitcase Deadlift, Dumbbell',
  'Dumbbell Thruster': 'Thruster, Dumbbell',
  'Dumbbell Walking Lunge': 'Walking Lunge, Dumbbell',
  
  // Cable exercises
  'Cable Pull-Up': 'Pull-Up, Cable',
  'Cable Skull Crusher': 'Skull Crusher, Cable',
  'Cable Tricep Extension': 'Tricep Extension, Cable',
  
  // Kettlebell exercises
  'Kettlebell Clean': 'Clean, Kettlebell',
  'Kettlebell Front Squat': 'Front Squat, Kettlebell',
  'Kettlebell Goblet Squat': 'Goblet Squat, Kettlebell',
  'Kettlebell Lunge': 'Lunge, Kettlebell',
  'Kettlebell Overhead Press': 'Overhead Press, Kettlebell',
  'Kettlebell Single-Arm Row': 'Single-Arm Row, Kettlebell',
  'Kettlebell Snatch': 'Snatch, Kettlebell',
  'Kettlebell Swing': 'Swing, Kettlebell',
  'Kettlebell Thruster': 'Thruster, Kettlebell',
  'Kettlebell Turkish Get-Up': 'Turkish Get-Up, Kettlebell',
  
  // Landmine exercises
  'Landmine Deadlift': 'Deadlift, Landmine',
  'Landmine Press': 'Press, Landmine',
  'Landmine Rotation': 'Rotation, Landmine',
  'Landmine Row': 'Row, Landmine',
  'Landmine Squat': 'Squat, Landmine',
  
  // Slam Ball exercises
  'Slam Ball Chest Throw': 'Chest Throw, Slam Ball',
  'Slam Ball Rotational Slam': 'Rotational Slam, Slam Ball',
  'Slam Ball Slam': 'Slam, Slam Ball',
  'Slam Ball Squat': 'Squat, Slam Ball',
  
  // Rope exercises
  'Rope Climb': 'Climb, Rope',
  'Rope Pulldown': 'Pulldown, Rope',
  'Rope Tricep Extension': 'Tricep Extension, Rope',
};

/**
 * Migrate exercise name from old format to new format
 * @param {string} name - Exercise name to migrate
 * @returns {string} Migrated exercise name
 */
function migrateExerciseName(name) {
  if (!name) return name;
  const trimmedName = name.trim();
  return EXERCISE_NAME_MAPPING[trimmedName] || trimmedName;
}

/**
 * Migrate a CSV file
 * @param {string} inputPath - Path to input CSV file
 * @param {string} outputPath - Path to output CSV file
 */
async function migrateCSVFile(inputPath, outputPath) {
  console.log(`\nMigrating: ${path.basename(inputPath)}`);
  
  // Read CSV file
  const csvContent = fs.readFileSync(inputPath, 'utf-8');
  
  // Parse CSV
  const parseResult = Papa.parse(csvContent, {
    header: true,
    skipEmptyLines: false,
  });
  
  if (parseResult.errors.length > 0) {
    console.warn('  CSV parsing warnings:');
    parseResult.errors.forEach(err => console.warn(`    - ${err.message}`));
  }
  
  let migratedCount = 0;
  let unchangedCount = 0;
  
  // Migrate exercise names
  const migratedData = parseResult.data.map(row => {
    if (!row['Exercise Name']) return row;
    
    const oldName = row['Exercise Name'];
    const newName = migrateExerciseName(oldName);
    
    if (oldName !== newName) {
      migratedCount++;
      console.log(`  ✓ "${oldName}" → "${newName}"`);
    } else {
      unchangedCount++;
    }
    
    return {
      ...row,
      'Exercise Name': newName,
    };
  });
  
  // Convert back to CSV
  const csv = Papa.unparse(migratedData, {
    header: true,
  });
  
  // Write to output file
  fs.writeFileSync(outputPath, csv, 'utf-8');
  
  console.log(`  Migrated: ${migratedCount} exercises`);
  console.log(`  Unchanged: ${unchangedCount} exercises`);
  console.log(`  Output: ${outputPath}`);
}

/**
 * Main migration function
 */
async function main() {
  console.log('=== Exercise Name Migration ===');
  console.log('Converting from "Equipment Exercise" to "Exercise, Equipment" format\n');
  
  const publicDataDir = path.join(__dirname, '../public/data');
  const docsDataDir = path.join(__dirname, '../docs/data');
  
  // Migrate exercise-expanded.csv
  await migrateCSVFile(
    path.join(publicDataDir, 'exercise-expanded.csv'),
    path.join(publicDataDir, 'exercise-expanded.csv')
  );
  
  // Migrate cable-exercise.csv
  await migrateCSVFile(
    path.join(publicDataDir, 'cable-exercise.csv'),
    path.join(publicDataDir, 'cable-exercise.csv')
  );
  
  // Copy to docs directory if it exists
  if (fs.existsSync(docsDataDir)) {
    console.log('\nCopying migrated files to docs/data/...');
    
    fs.copyFileSync(
      path.join(publicDataDir, 'exercise-expanded.csv'),
      path.join(docsDataDir, 'exercise-expanded.csv')
    );
    console.log('  ✓ Copied exercise-expanded.csv');
    
    fs.copyFileSync(
      path.join(publicDataDir, 'cable-exercise.csv'),
      path.join(docsDataDir, 'cable-exercise.csv')
    );
    console.log('  ✓ Copied cable-exercise.csv');
  }
  
  console.log('\n=== Migration Complete ===');
  console.log('\nNext steps:');
  console.log('  1. Run: npm run convert:exercises');
  console.log('  2. Review the changes in exercises.json');
  console.log('  3. Test the application');
}

// Run migration
main().catch(error => {
  console.error('Migration failed:', error);
  process.exit(1);
});
