/**
 * Data Structure Simplification Migration
 * 
 * This migration performs the following operations:
 * 1. Migrates workout history to consistent format
 * 2. Archives data from deleted features (yoga sessions, favorite workouts)
 * 3. Consolidates redundant data structures (removes duplicate stats)
 * 4. Removes orphaned references (totalYogaTime)
 * 
 * Based on: docs/migration-plan.md
 */

import { isGuestMode, getGuestData, setGuestData } from '../utils/guestStorage';

// Migration version to prevent re-running
const MIGRATION_VERSION = 'v1.0.0-simplify-data-structure';
const MIGRATION_KEY = 'goodlift_migration_version';

/**
 * Check if migration has already been run
 * @returns {boolean} True if migration was already completed
 */
const isMigrationCompleted = () => {
  try {
    if (isGuestMode()) {
      const guestMigrationVersion = getGuestData('migration_version');
      return guestMigrationVersion === MIGRATION_VERSION;
    } else {
      const migrationVersion = localStorage.getItem(MIGRATION_KEY);
      return migrationVersion === MIGRATION_VERSION;
    }
  } catch (error) {
    console.error('Error checking migration status:', error);
    return false;
  }
};

/**
 * Mark migration as completed
 */
const markMigrationCompleted = () => {
  try {
    if (isGuestMode()) {
      setGuestData('migration_version', MIGRATION_VERSION);
    } else {
      localStorage.setItem(MIGRATION_KEY, MIGRATION_VERSION);
    }
    console.log(`Migration ${MIGRATION_VERSION} completed successfully`);
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
 * Remove data from storage
 * @param {string} key - Storage key
 */
const removeData = (key) => {
  try {
    if (isGuestMode()) {
      setGuestData(key, null);
    } else {
      localStorage.removeItem(`goodlift_${key}`);
    }
  } catch (error) {
    console.error(`Error removing data for ${key}:`, error);
  }
};

/**
 * Step 1: Migrate workout history to consistent format
 * Ensures all workouts have proper date format and structure
 */
const migrateWorkoutHistory = () => {
  console.log('Step 1: Migrating workout history...');
  
  const history = getData('workout_history');
  if (!history || !Array.isArray(history) || history.length === 0) {
    console.log('No workout history to migrate');
    return;
  }

  let migrationCount = 0;
  const migratedHistory = history.map(workout => {
    let modified = false;
    const migrated = { ...workout };

    // Ensure date is in ISO format
    if (migrated.date && typeof migrated.date === 'number') {
      migrated.date = new Date(migrated.date).toISOString();
      modified = true;
    } else if (migrated.date && typeof migrated.date === 'string') {
      // Validate and normalize ISO string
      try {
        const date = new Date(migrated.date);
        if (!isNaN(date.getTime())) {
          migrated.date = date.toISOString();
          modified = true;
        }
      } catch {
        console.warn('Invalid date in workout:', migrated.date);
      }
    }

    // Ensure duration exists (default to 0 if missing)
    if (migrated.duration === undefined || migrated.duration === null) {
      migrated.duration = 0;
      modified = true;
    }

    // Ensure type field exists
    if (!migrated.type && migrated.exercises?.length > 0) {
      migrated.type = 'Workout';
      modified = true;
    }

    if (modified) {
      migrationCount++;
    }

    return migrated;
  });

  if (migrationCount > 0) {
    setData('workout_history', migratedHistory);
    console.log(`Migrated ${migrationCount} workout entries`);
  } else {
    console.log('All workout entries already in correct format');
  }
};

/**
 * Step 2: Archive legacy yoga sessions
 * Moves yoga session data to archived storage
 */
const archiveYogaSessions = () => {
  console.log('Step 2: Archiving yoga sessions...');
  
  const yogaSessions = getData('yoga_sessions');
  if (!yogaSessions || (Array.isArray(yogaSessions) && yogaSessions.length === 0)) {
    console.log('No yoga sessions to archive');
    return;
  }

  // Archive the data with timestamp
  const archiveData = {
    data: yogaSessions,
    archivedAt: new Date().toISOString(),
    reason: 'Yoga feature removed, replaced with stretching/mobility sessions'
  };

  setData('archived_yoga_sessions', archiveData);
  removeData('yoga_sessions');
  
  console.log(`Archived ${Array.isArray(yogaSessions) ? yogaSessions.length : 1} yoga session(s)`);
};

/**
 * Step 3: Archive favorite workouts
 * Moves favorite workouts to archived storage (replaced by workout_plans)
 */
const archiveFavoriteWorkouts = () => {
  console.log('Step 3: Archiving favorite workouts...');
  
  const favoriteWorkouts = getData('favorite_workouts');
  if (!favoriteWorkouts || (Array.isArray(favoriteWorkouts) && favoriteWorkouts.length === 0)) {
    console.log('No favorite workouts to archive');
    return;
  }

  // Archive the data with timestamp
  const archiveData = {
    data: favoriteWorkouts,
    archivedAt: new Date().toISOString(),
    reason: 'Favorite workouts replaced by workout plans feature'
  };

  setData('archived_favorite_workouts', archiveData);
  removeData('favorite_workouts');
  
  console.log(`Archived ${favoriteWorkouts.length} favorite workout(s)`);
};

/**
 * Step 4: Clean up user stats
 * Removes totalYogaTime and ensures stats are calculated from sessions
 */
const cleanupUserStats = () => {
  console.log('Step 4: Cleaning up user stats...');
  
  const userStats = getData('user_stats');
  if (!userStats) {
    console.log('No user stats to clean up');
    return;
  }

  let modified = false;

  // Remove totalYogaTime if it exists
  if ('totalYogaTime' in userStats) {
    delete userStats.totalYogaTime;
    modified = true;
    console.log('Removed totalYogaTime from user stats');
  }

  // Ensure all required fields exist
  const requiredFields = {
    totalWorkouts: 0,
    totalTime: 0,
    totalHiitTime: 0,
    totalCardioTime: 0,
    totalStretchTime: 0
  };

  Object.entries(requiredFields).forEach(([field, defaultValue]) => {
    if (!(field in userStats)) {
      userStats[field] = defaultValue;
      modified = true;
    }
  });

  if (modified) {
    setData('user_stats', userStats);
    console.log('Updated user stats structure');
  } else {
    console.log('User stats already clean');
  }
};

/**
 * Step 5: Validate and normalize session data
 * Ensures all session types have consistent structure
 */
const validateSessionData = () => {
  console.log('Step 5: Validating session data...');
  
  const sessionTypes = ['hiit_sessions', 'cardio_sessions', 'stretch_sessions'];
  
  sessionTypes.forEach(sessionType => {
    const sessions = getData(sessionType);
    
    if (!sessions || !Array.isArray(sessions) || sessions.length === 0) {
      console.log(`No ${sessionType} to validate`);
      return;
    }

    let migrationCount = 0;
    const validatedSessions = sessions.map(session => {
      let modified = false;
      const validated = { ...session };

      // Ensure ID exists
      if (!validated.id) {
        validated.id = `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
        modified = true;
      }

      // Ensure date exists and is ISO format
      if (!validated.date) {
        validated.date = Date.now();
        modified = true;
      }
      if (typeof validated.date === 'number') {
        validated.date = new Date(validated.date).toISOString();
        modified = true;
      }

      // Ensure duration exists
      if (validated.duration === undefined || validated.duration === null) {
        validated.duration = 0;
        modified = true;
      }

      if (modified) {
        migrationCount++;
      }

      return validated;
    });

    if (migrationCount > 0) {
      setData(sessionType, validatedSessions);
      console.log(`Validated ${migrationCount} ${sessionType} entries`);
    }
  });
};

/**
 * Step 6: Remove orphaned references
 * Cleans up any remaining references to deleted features
 */
const removeOrphanedReferences = () => {
  console.log('Step 6: Removing orphaned references...');
  
  // List of potentially orphaned keys to check and remove
  const orphanedKeys = [
    'yoga_settings',
    'yoga_preferences',
    'legacy_favorites'
  ];

  let removedCount = 0;
  orphanedKeys.forEach(key => {
    const data = getData(key);
    if (data !== null) {
      removeData(key);
      removedCount++;
      console.log(`Removed orphaned key: ${key}`);
    }
  });

  if (removedCount === 0) {
    console.log('No orphaned references found');
  } else {
    console.log(`Removed ${removedCount} orphaned reference(s)`);
  }
};

/**
 * Generate migration report
 * @returns {Object} Summary of migration actions
 */
const generateMigrationReport = () => {
  const report = {
    version: MIGRATION_VERSION,
    timestamp: new Date().toISOString(),
    summary: {
      workoutHistory: getData('workout_history')?.length || 0,
      hiitSessions: getData('hiit_sessions')?.length || 0,
      cardioSessions: getData('cardio_sessions')?.length || 0,
      stretchSessions: getData('stretch_sessions')?.length || 0,
      workoutPlans: getData('workout_plans')?.length || 0,
      archivedYoga: getData('archived_yoga_sessions')?.data?.length || 0,
      archivedFavoriteWorkouts: getData('archived_favorite_workouts')?.data?.length || 0
    }
  };

  console.log('Migration Report:', report);
  return report;
};

/**
 * Main migration function
 * Executes all migration steps in order
 * @returns {Object} Migration report
 */
export const runDataMigration = () => {
  console.log('=== Starting Data Structure Simplification Migration ===');
  console.log(`Version: ${MIGRATION_VERSION}`);
  
  // Check if migration already completed
  if (isMigrationCompleted()) {
    console.log('Migration already completed, skipping...');
    return {
      status: 'skipped',
      reason: 'Migration already completed',
      version: MIGRATION_VERSION
    };
  }

  try {
    // Execute migration steps
    migrateWorkoutHistory();
    archiveYogaSessions();
    archiveFavoriteWorkouts();
    cleanupUserStats();
    validateSessionData();
    removeOrphanedReferences();

    // Mark migration as completed
    markMigrationCompleted();

    // Generate and return report
    const report = generateMigrationReport();
    
    console.log('=== Migration Completed Successfully ===');
    return {
      status: 'success',
      ...report
    };
  } catch (error) {
    console.error('Migration failed:', error);
    return {
      status: 'failed',
      error: error.message,
      version: MIGRATION_VERSION
    };
  }
};

/**
 * Utility function to check migration status
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
      setGuestData('migration_version', null);
    } else {
      localStorage.removeItem(MIGRATION_KEY);
    }
    console.log('Migration reset - will run again on next app load');
  } catch (error) {
    console.error('Error resetting migration:', error);
  }
};

export default runDataMigration;
