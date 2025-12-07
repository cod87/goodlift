/**
 * Exercise Name Migration Utility
 * 
 * Automatically migrates user data from old exercise name format to new format
 * when the app loads. This ensures backward compatibility with existing user data.
 * 
 * Old format: "Equipment Exercise" (e.g., "Dumbbell Bench Press")
 * New format: "Exercise, Equipment" (e.g., "Bench Press, Dumbbell")
 */

import exerciseNameMapping from '../../public/data/exercise-name-mapping.json' with { type: 'json' };

const MIGRATION_VERSION_KEY = 'goodlift_exercise_name_migration_version';
const CURRENT_MIGRATION_VERSION = 1;

/**
 * Check if migration has already been performed
 * @returns {boolean} True if migration has been done
 */
function isMigrationComplete() {
  try {
    const version = localStorage.getItem(MIGRATION_VERSION_KEY);
    return version && parseInt(version) >= CURRENT_MIGRATION_VERSION;
  } catch (error) {
    console.error('Error checking migration status:', error);
    return false;
  }
}

/**
 * Mark migration as complete
 */
function markMigrationComplete() {
  try {
    localStorage.setItem(MIGRATION_VERSION_KEY, CURRENT_MIGRATION_VERSION.toString());
  } catch (error) {
    console.error('Error marking migration complete:', error);
  }
}

/**
 * Migrate exercise weights object
 * @param {Object} exerciseWeights - Object with exercise names as keys
 * @returns {Object} Migrated exercise weights
 */
function migrateExerciseWeights(exerciseWeights) {
  if (!exerciseWeights || typeof exerciseWeights !== 'object') {
    return exerciseWeights;
  }
  
  const migratedWeights = {};
  let migratedCount = 0;
  
  for (const [exerciseName, weight] of Object.entries(exerciseWeights)) {
    const newName = exerciseNameMapping[exerciseName];
    
    if (newName) {
      // Migrate to new name
      migratedWeights[newName] = weight;
      migratedCount++;
    } else {
      // Keep the old name if no mapping exists
      migratedWeights[exerciseName] = weight;
    }
  }
  
  if (migratedCount > 0) {
    console.log(`Migrated ${migratedCount} exercise weights to new format`);
  }
  
  return migratedWeights;
}

/**
 * Migrate exercise target reps object
 * @param {Object} exerciseTargetReps - Object with exercise names as keys
 * @returns {Object} Migrated exercise target reps
 */
function migrateExerciseTargetReps(exerciseTargetReps) {
  if (!exerciseTargetReps || typeof exerciseTargetReps !== 'object') {
    return exerciseTargetReps;
  }
  
  const migratedReps = {};
  let migratedCount = 0;
  
  for (const [exerciseName, reps] of Object.entries(exerciseTargetReps)) {
    const newName = exerciseNameMapping[exerciseName];
    
    if (newName) {
      // Migrate to new name
      migratedReps[newName] = reps;
      migratedCount++;
    } else {
      // Keep the old name if no mapping exists
      migratedReps[exerciseName] = reps;
    }
  }
  
  if (migratedCount > 0) {
    console.log(`Migrated ${migratedCount} exercise target reps to new format`);
  }
  
  return migratedReps;
}

/**
 * Migrate workout history
 * @param {Array} workoutHistory - Array of workout objects
 * @returns {Array} Migrated workout history
 */
function migrateWorkoutHistory(workoutHistory) {
  if (!Array.isArray(workoutHistory)) {
    return workoutHistory;
  }
  
  const migratedHistory = [];
  let migratedExerciseCount = 0;
  
  for (const workout of workoutHistory) {
    const migratedWorkout = { ...workout };
    
    if (workout.exercises && typeof workout.exercises === 'object') {
      const migratedExercises = {};
      
      for (const [exerciseName, exerciseData] of Object.entries(workout.exercises)) {
        const newName = exerciseNameMapping[exerciseName];
        
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
  
  if (migratedExerciseCount > 0) {
    console.log(`Migrated ${migratedExerciseCount} exercises in workout history to new format`);
  }
  
  return migratedHistory;
}

/**
 * Migrate pinned exercises
 * @param {Array} pinnedExercises - Array of pinned exercise names
 * @returns {Array} Migrated pinned exercises
 */
function migratePinnedExercises(pinnedExercises) {
  if (!Array.isArray(pinnedExercises)) {
    return pinnedExercises;
  }
  
  const migratedPinned = [];
  let migratedCount = 0;
  
  for (const exerciseName of pinnedExercises) {
    const newName = exerciseNameMapping[exerciseName];
    
    if (newName) {
      // Migrate to new name
      migratedPinned.push(newName);
      migratedCount++;
    } else {
      // Keep the old name if no mapping exists
      migratedPinned.push(exerciseName);
    }
  }
  
  if (migratedCount > 0) {
    console.log(`Migrated ${migratedCount} pinned exercises to new format`);
  }
  
  return migratedPinned;
}

/**
 * Perform automatic migration of all user data
 * This should be called when the app initializes
 */
export function performAutoMigration() {
  // Check if migration has already been done
  if (isMigrationComplete()) {
    console.log('Exercise name migration already complete');
    return;
  }
  
  console.log('Starting automatic exercise name migration...');
  let totalMigrations = 0;
  
  try {
    // Migrate exercise weights
    const weightsKey = 'goodlift_exercise_weights';
    const weightsData = localStorage.getItem(weightsKey);
    if (weightsData) {
      try {
        const weights = JSON.parse(weightsData);
        const migratedWeights = migrateExerciseWeights(weights);
        localStorage.setItem(weightsKey, JSON.stringify(migratedWeights));
        totalMigrations++;
      } catch (error) {
        console.error('Error migrating exercise weights:', error);
      }
    }
    
    // Migrate exercise target reps
    const repsKey = 'goodlift_exercise_target_reps';
    const repsData = localStorage.getItem(repsKey);
    if (repsData) {
      try {
        const reps = JSON.parse(repsData);
        const migratedReps = migrateExerciseTargetReps(reps);
        localStorage.setItem(repsKey, JSON.stringify(migratedReps));
        totalMigrations++;
      } catch (error) {
        console.error('Error migrating exercise target reps:', error);
      }
    }
    
    // Migrate workout history
    const historyKey = 'goodlift_workout_history';
    const historyData = localStorage.getItem(historyKey);
    if (historyData) {
      try {
        const history = JSON.parse(historyData);
        const migratedHistory = migrateWorkoutHistory(history);
        localStorage.setItem(historyKey, JSON.stringify(migratedHistory));
        totalMigrations++;
      } catch (error) {
        console.error('Error migrating workout history:', error);
      }
    }
    
    // Migrate pinned exercises
    const pinnedKey = 'goodlift_pinned_exercises';
    const pinnedData = localStorage.getItem(pinnedKey);
    if (pinnedData) {
      try {
        const pinned = JSON.parse(pinnedData);
        const migratedPinned = migratePinnedExercises(pinned);
        localStorage.setItem(pinnedKey, JSON.stringify(migratedPinned));
        totalMigrations++;
      } catch (error) {
        console.error('Error migrating pinned exercises:', error);
      }
    }
    
    // Mark migration as complete
    markMigrationComplete();
    
    if (totalMigrations > 0) {
      console.log(`✓ Exercise name migration completed successfully (${totalMigrations} data types migrated)`);
    } else {
      console.log('✓ Exercise name migration completed (no data to migrate)');
    }
  } catch (error) {
    console.error('Error during automatic migration:', error);
  }
}

/**
 * Get the new name for an exercise (if it has changed)
 * @param {string} oldName - Old exercise name
 * @returns {string} New exercise name (or original if no mapping exists)
 */
export function getNewExerciseName(oldName) {
  return exerciseNameMapping[oldName] || oldName;
}

/**
 * Check if an exercise name has been migrated
 * @param {string} exerciseName - Exercise name to check
 * @returns {boolean} True if the name was migrated
 */
export function isExerciseNameMigrated(exerciseName) {
  return exerciseName in exerciseNameMapping;
}
