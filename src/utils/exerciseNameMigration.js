/**
 * Exercise Name Migration Utility for localStorage
 * 
 * Migrates user data (workout history, exercise weights, target reps, pinned exercises)
 * from old exercise name format to new format.
 * 
 * This ensures backward compatibility when users have data stored with old names.
 */

import { normalizeExerciseNameToNewFormat } from './exerciseNameNormalizer';
import { isGuestMode, getGuestData, setGuestData } from './guestStorage';

// Migration version to track completed migrations
const MIGRATION_VERSION = 'v1.0.0-exercise-names';
const MIGRATION_KEY = 'goodlift_exercise_name_migration_version';

/**
 * Check if migration has already been completed
 * @returns {boolean} True if migration was already completed
 */
const isMigrationCompleted = () => {
  try {
    if (isGuestMode()) {
      const guestMigrationVersion = getGuestData('exercise_name_migration_version');
      return guestMigrationVersion === MIGRATION_VERSION;
    } else {
      const migrationVersion = localStorage.getItem(MIGRATION_KEY);
      return migrationVersion === MIGRATION_VERSION;
    }
  } catch (error) {
    console.error('Error checking exercise name migration status:', error);
    return false;
  }
};

/**
 * Mark migration as completed
 */
const markMigrationCompleted = () => {
  try {
    if (isGuestMode()) {
      setGuestData('exercise_name_migration_version', MIGRATION_VERSION);
    } else {
      localStorage.setItem(MIGRATION_KEY, MIGRATION_VERSION);
    }
    console.log(`Exercise name migration ${MIGRATION_VERSION} completed`);
  } catch (error) {
    console.error('Error marking migration as completed:', error);
  }
};

/**
 * Get data from storage (localStorage or guest storage)
 * @param {string} key - Storage key
 * @returns {any} Parsed data or null
 */
const getData = (key) => {
  try {
    if (isGuestMode()) {
      return getGuestData(key);
    } else {
      const data = localStorage.getItem(`goodlift_${key}`);
      return data ? JSON.parse(data) : null;
    }
  } catch (error) {
    console.error(`Error getting data for ${key}:`, error);
    return null;
  }
};

/**
 * Set data to storage (localStorage or guest storage)
 * @param {string} key - Storage key
 * @param {any} value - Value to store
 */
const setData = (key, value) => {
  try {
    if (isGuestMode()) {
      setGuestData(key, value);
    } else {
      localStorage.setItem(`goodlift_${key}`, JSON.stringify(value));
    }
  } catch (error) {
    console.error(`Error setting data for ${key}:`, error);
  }
};

/**
 * Migrate workout history exercise names
 */
const migrateWorkoutHistory = () => {
  console.log('Migrating workout history exercise names...');
  
  const history = getData('workout_history');
  if (!history || !Array.isArray(history) || history.length === 0) {
    console.log('  No workout history to migrate');
    return { migrated: 0, total: 0 };
  }

  let migratedCount = 0;
  const migratedHistory = history.map(workout => {
    if (!workout.exercises || !Array.isArray(workout.exercises)) {
      return workout;
    }

    const migratedExercises = workout.exercises.map(exercise => {
      const oldName = exercise['Exercise Name'] || exercise.name;
      if (!oldName) return exercise;

      const newName = normalizeExerciseNameToNewFormat(oldName);
      
      if (oldName !== newName) {
        migratedCount++;
        return {
          ...exercise,
          'Exercise Name': newName,
          ...(exercise.name ? { name: newName } : {}),
        };
      }
      
      return exercise;
    });

    return {
      ...workout,
      exercises: migratedExercises,
    };
  });

  if (migratedCount > 0) {
    setData('workout_history', migratedHistory);
    console.log(`  Migrated ${migratedCount} exercise entries in workout history`);
  } else {
    console.log('  All workout history exercises already in new format');
  }

  return { migrated: migratedCount, total: history.length };
};

/**
 * Migrate exercise weights map
 * Maps old exercise names to new names in the weights object
 */
const migrateExerciseWeights = () => {
  console.log('Migrating exercise weights...');
  
  const weights = getData('exercise_weights');
  if (!weights || typeof weights !== 'object') {
    console.log('  No exercise weights to migrate');
    return { migrated: 0, total: 0 };
  }

  let migratedCount = 0;
  const migratedWeights = {};

  Object.keys(weights).forEach(oldName => {
    const newName = normalizeExerciseNameToNewFormat(oldName);
    
    // If name changed and new name doesn't exist yet, migrate it
    if (oldName !== newName && !migratedWeights[newName]) {
      migratedWeights[newName] = weights[oldName];
      migratedCount++;
    } else {
      // Keep original if no change or if new name already exists
      migratedWeights[oldName] = weights[oldName];
    }
  });

  if (migratedCount > 0) {
    setData('exercise_weights', migratedWeights);
    console.log(`  Migrated ${migratedCount} exercise weight entries`);
  } else {
    console.log('  All exercise weights already in new format');
  }

  return { migrated: migratedCount, total: Object.keys(weights).length };
};

/**
 * Migrate exercise target reps map
 */
const migrateExerciseTargetReps = () => {
  console.log('Migrating exercise target reps...');
  
  const targetReps = getData('exercise_target_reps');
  if (!targetReps || typeof targetReps !== 'object') {
    console.log('  No exercise target reps to migrate');
    return { migrated: 0, total: 0 };
  }

  let migratedCount = 0;
  const migratedTargetReps = {};

  Object.keys(targetReps).forEach(oldName => {
    const newName = normalizeExerciseNameToNewFormat(oldName);
    
    // If name changed and new name doesn't exist yet, migrate it
    if (oldName !== newName && !migratedTargetReps[newName]) {
      migratedTargetReps[newName] = targetReps[oldName];
      migratedCount++;
    } else {
      // Keep original if no change or if new name already exists
      migratedTargetReps[oldName] = targetReps[oldName];
    }
  });

  if (migratedCount > 0) {
    setData('exercise_target_reps', migratedTargetReps);
    console.log(`  Migrated ${migratedCount} exercise target rep entries`);
  } else {
    console.log('  All exercise target reps already in new format');
  }

  return { migrated: migratedCount, total: Object.keys(targetReps).length };
};

/**
 * Migrate pinned exercises array
 */
const migratePinnedExercises = () => {
  console.log('Migrating pinned exercises...');
  
  const pinnedExercises = getData('pinned_exercises');
  if (!pinnedExercises || !Array.isArray(pinnedExercises) || pinnedExercises.length === 0) {
    console.log('  No pinned exercises to migrate');
    return { migrated: 0, total: 0 };
  }

  let migratedCount = 0;
  const migratedPinned = pinnedExercises.map(exercise => {
    const oldName = exercise['Exercise Name'] || exercise.name;
    if (!oldName) return exercise;

    const newName = normalizeExerciseNameToNewFormat(oldName);
    
    if (oldName !== newName) {
      migratedCount++;
      return {
        ...exercise,
        'Exercise Name': newName,
        ...(exercise.name ? { name: newName } : {}),
      };
    }
    
    return exercise;
  });

  if (migratedCount > 0) {
    setData('pinned_exercises', migratedPinned);
    console.log(`  Migrated ${migratedCount} pinned exercises`);
  } else {
    console.log('  All pinned exercises already in new format');
  }

  return { migrated: migratedCount, total: pinnedExercises.length };
};

/**
 * Migrate saved workouts
 */
const migrateSavedWorkouts = () => {
  console.log('Migrating saved workouts...');
  
  const savedWorkouts = getData('saved_workouts');
  if (!savedWorkouts || !Array.isArray(savedWorkouts) || savedWorkouts.length === 0) {
    console.log('  No saved workouts to migrate');
    return { migrated: 0, total: 0 };
  }

  let migratedCount = 0;
  const migratedWorkouts = savedWorkouts.map(workout => {
    if (!workout.exercises || !Array.isArray(workout.exercises)) {
      return workout;
    }

    const migratedExercises = workout.exercises.map(exercise => {
      const oldName = exercise['Exercise Name'] || exercise.name;
      if (!oldName) return exercise;

      const newName = normalizeExerciseNameToNewFormat(oldName);
      
      if (oldName !== newName) {
        migratedCount++;
        return {
          ...exercise,
          'Exercise Name': newName,
          ...(exercise.name ? { name: newName } : {}),
        };
      }
      
      return exercise;
    });

    return {
      ...workout,
      exercises: migratedExercises,
    };
  });

  if (migratedCount > 0) {
    setData('saved_workouts', migratedWorkouts);
    console.log(`  Migrated ${migratedCount} exercises in saved workouts`);
  } else {
    console.log('  All saved workouts already in new format');
  }

  return { migrated: migratedCount, total: savedWorkouts.length };
};

/**
 * Migrate workout plans
 */
const migrateWorkoutPlans = () => {
  console.log('Migrating workout plans...');
  
  const workoutPlans = getData('workout_plans');
  if (!workoutPlans || !Array.isArray(workoutPlans) || workoutPlans.length === 0) {
    console.log('  No workout plans to migrate');
    return { migrated: 0, total: 0 };
  }

  let migratedCount = 0;
  const migratedPlans = workoutPlans.map(plan => {
    if (!plan.workouts || !Array.isArray(plan.workouts)) {
      return plan;
    }

    const migratedWorkouts = plan.workouts.map(workout => {
      if (!workout.exercises || !Array.isArray(workout.exercises)) {
        return workout;
      }

      const migratedExercises = workout.exercises.map(exercise => {
        const oldName = exercise['Exercise Name'] || exercise.name;
        if (!oldName) return exercise;

        const newName = normalizeExerciseNameToNewFormat(oldName);
        
        if (oldName !== newName) {
          migratedCount++;
          return {
            ...exercise,
            'Exercise Name': newName,
            ...(exercise.name ? { name: newName } : {}),
          };
        }
        
        return exercise;
      });

      return {
        ...workout,
        exercises: migratedExercises,
      };
    });

    return {
      ...plan,
      workouts: migratedWorkouts,
    };
  });

  if (migratedCount > 0) {
    setData('workout_plans', migratedPlans);
    console.log(`  Migrated ${migratedCount} exercises in workout plans`);
  } else {
    console.log('  All workout plans already in new format');
  }

  return { migrated: migratedCount, total: workoutPlans.length };
};

/**
 * Main migration function
 * Runs all exercise name migrations
 * @returns {Object} Migration report
 */
export const runExerciseNameMigration = () => {
  console.log('=== Starting Exercise Name Migration ===');
  console.log(`Version: ${MIGRATION_VERSION}`);
  
  // Check if migration already completed
  if (isMigrationCompleted()) {
    console.log('Exercise name migration already completed, skipping...');
    return {
      status: 'skipped',
      reason: 'Migration already completed',
      version: MIGRATION_VERSION
    };
  }

  try {
    const results = {
      workoutHistory: migrateWorkoutHistory(),
      exerciseWeights: migrateExerciseWeights(),
      exerciseTargetReps: migrateExerciseTargetReps(),
      pinnedExercises: migratePinnedExercises(),
      savedWorkouts: migrateSavedWorkouts(),
      workoutPlans: migrateWorkoutPlans(),
    };

    // Calculate total migrations
    const totalMigrated = Object.values(results).reduce((sum, r) => sum + r.migrated, 0);

    // Mark migration as completed
    markMigrationCompleted();

    console.log('=== Exercise Name Migration Completed Successfully ===');
    console.log(`Total exercises migrated: ${totalMigrated}`);
    
    return {
      status: 'success',
      version: MIGRATION_VERSION,
      totalMigrated,
      details: results
    };
  } catch (error) {
    console.error('Exercise name migration failed:', error);
    return {
      status: 'failed',
      error: error.message,
      version: MIGRATION_VERSION
    };
  }
};

/**
 * Check if migration is needed
 * @returns {boolean} True if migration is needed
 */
export const isMigrationNeeded = () => {
  return !isMigrationCompleted();
};

/**
 * Get migration status
 * @returns {Object} Migration status information
 */
export const getMigrationStatus = () => {
  return {
    completed: isMigrationCompleted(),
    version: MIGRATION_VERSION,
    expectedVersion: MIGRATION_VERSION
  };
};

/**
 * Force reset migration (for testing only)
 * WARNING: This will cause migration to run again
 */
export const resetMigration = () => {
  if (process.env.NODE_ENV !== 'development') {
    console.warn('Migration reset is only available in development mode');
    return;
  }
  
  try {
    if (isGuestMode()) {
      setGuestData('exercise_name_migration_version', null);
    } else {
      localStorage.removeItem(MIGRATION_KEY);
    }
    console.log('Exercise name migration reset - will run again on next app load');
  } catch (error) {
    console.error('Error resetting migration:', error);
  }
};

export default runExerciseNameMigration;
