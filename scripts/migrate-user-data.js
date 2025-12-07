#!/usr/bin/env node
/**
 * Migrate User Data from Old Exercise Names to New Exercise Names
 * 
 * This script provides utilities to migrate:
 * 1. Exercise weights (localStorage key: goodlift_exercise_weights)
 * 2. Exercise target reps (localStorage key: goodlift_exercise_target_reps)
 * 3. Workout history (localStorage key: goodlift_workout_history)
 * 4. Pinned exercises (localStorage key: goodlift_pinned_exercises)
 * 
 * This can be run:
 * - As a standalone migration script (creates migration instructions)
 * - Imported and used in the app for live migration
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MAPPING_FILE_PATH = path.join(__dirname, '../public/data/exercise-name-mapping.json');

/**
 * Load the exercise name mapping
 * @returns {Object} Mapping of old names to new names
 */
function loadNameMapping() {
  if (!fs.existsSync(MAPPING_FILE_PATH)) {
    throw new Error(`Mapping file not found at: ${MAPPING_FILE_PATH}`);
  }
  
  const content = fs.readFileSync(MAPPING_FILE_PATH, 'utf-8');
  return JSON.parse(content);
}

/**
 * Migrate exercise weights object
 * @param {Object} exerciseWeights - Object with exercise names as keys
 * @param {Object} nameMapping - Mapping of old names to new names
 * @returns {Object} Migrated exercise weights
 */
export function migrateExerciseWeights(exerciseWeights, nameMapping) {
  const migratedWeights = {};
  let migratedCount = 0;
  
  for (const [exerciseName, weight] of Object.entries(exerciseWeights)) {
    const newName = nameMapping[exerciseName];
    
    if (newName) {
      // Migrate to new name
      migratedWeights[newName] = weight;
      migratedCount++;
    } else {
      // Keep the old name if no mapping exists
      migratedWeights[exerciseName] = weight;
    }
  }
  
  return { migratedWeights, migratedCount };
}

/**
 * Migrate exercise target reps object
 * @param {Object} exerciseTargetReps - Object with exercise names as keys
 * @param {Object} nameMapping - Mapping of old names to new names
 * @returns {Object} Migrated exercise target reps
 */
export function migrateExerciseTargetReps(exerciseTargetReps, nameMapping) {
  const migratedReps = {};
  let migratedCount = 0;
  
  for (const [exerciseName, reps] of Object.entries(exerciseTargetReps)) {
    const newName = nameMapping[exerciseName];
    
    if (newName) {
      // Migrate to new name
      migratedReps[newName] = reps;
      migratedCount++;
    } else {
      // Keep the old name if no mapping exists
      migratedReps[exerciseName] = reps;
    }
  }
  
  return { migratedReps, migratedCount };
}

/**
 * Migrate workout history
 * @param {Array} workoutHistory - Array of workout objects
 * @param {Object} nameMapping - Mapping of old names to new names
 * @returns {Object} Migrated workout history and count
 */
export function migrateWorkoutHistory(workoutHistory, nameMapping) {
  const migratedHistory = [];
  let migratedExerciseCount = 0;
  
  for (const workout of workoutHistory) {
    const migratedWorkout = { ...workout };
    
    if (workout.exercises) {
      const migratedExercises = {};
      
      for (const [exerciseName, exerciseData] of Object.entries(workout.exercises)) {
        const newName = nameMapping[exerciseName];
        
        if (newName) {
          // Migrate to new name
          migratedExercises[newName] = exerciseData;
          migratedExerciseCount++;
        } else {
          // Keep the old name if no mapping exists
          migratedExercises[exerciseName] = exerciseData;
        }
      }
      
      migratedWorkout.exercises = migratedExercises;
    }
    
    migratedHistory.push(migratedWorkout);
  }
  
  return { migratedHistory, migratedExerciseCount };
}

/**
 * Migrate pinned exercises
 * @param {Array} pinnedExercises - Array of pinned exercise names
 * @param {Object} nameMapping - Mapping of old names to new names
 * @returns {Object} Migrated pinned exercises and count
 */
export function migratePinnedExercises(pinnedExercises, nameMapping) {
  const migratedPinned = [];
  let migratedCount = 0;
  
  for (const exerciseName of pinnedExercises) {
    const newName = nameMapping[exerciseName];
    
    if (newName) {
      // Migrate to new name
      migratedPinned.push(newName);
      migratedCount++;
    } else {
      // Keep the old name if no mapping exists
      migratedPinned.push(exerciseName);
    }
  }
  
  return { migratedPinned, migratedCount };
}

/**
 * Main function - generates migration instructions
 */
async function generateMigrationInstructions() {
  try {
    console.log('Loading exercise name mapping...');
    const nameMapping = loadNameMapping();
    const mappingCount = Object.keys(nameMapping).length;
    
    console.log(`✓ Loaded ${mappingCount} name mappings`);
    console.log('\n=== Exercise Name Migration Instructions ===\n');
    
    console.log('The following exercise names have been changed:');
    console.log('');
    
    for (const [oldName, newName] of Object.entries(nameMapping)) {
      console.log(`  ${oldName}`);
      console.log(`    → ${newName}`);
      console.log('');
    }
    
    console.log('\n=== Data Migration ===\n');
    console.log('User data will be automatically migrated when the app loads.');
    console.log('The migration will handle:');
    console.log('  - Exercise weights');
    console.log('  - Exercise target reps');
    console.log('  - Workout history');
    console.log('  - Pinned exercises');
    console.log('');
    console.log('No manual intervention is required for existing users.');
    console.log('');
    
    // Write a summary file
    const summaryPath = path.join(__dirname, '../EXERCISE_MIGRATION_SUMMARY.md');
    const summary = `# Exercise Name Migration Summary

## Changes Made

This migration converted ${mappingCount} exercise names from "Equipment Exercise" format to "Exercise, Equipment" format.

### Example Changes:
- Dumbbell Bench Press → Bench Press, Dumbbell
- Barbell Squat (High Bar) → Squat (High Bar), Barbell
- Kettlebell Swing → Swing, Kettlebell

## User Data Migration

User data has been automatically migrated to use the new exercise names:
- ✅ Exercise weights
- ✅ Exercise target reps
- ✅ Workout history
- ✅ Pinned exercises

## Complete List of Changes

${Object.entries(nameMapping).map(([old, newName]) => `- ${old} → ${newName}`).join('\n')}

## Technical Details

- Source file: \`public/data/exercise-expanded.csv\`
- Mapping file: \`public/data/exercise-name-mapping.json\`
- Migration script: \`scripts/migrate-user-data.js\`
- Data migration utilities are also available in: \`src/utils/exerciseNameMigration.js\`
`;
    
    fs.writeFileSync(summaryPath, summary, 'utf-8');
    console.log(`✓ Migration summary written to: ${summaryPath}`);
    console.log('\n✓ Migration instructions completed!');
    
  } catch (error) {
    console.error('❌ Error generating migration instructions:');
    console.error(error.message);
    process.exit(1);
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  generateMigrationInstructions();
}
