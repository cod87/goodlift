/**
 * Achievements Migration Utility
 * 
 * Runs on app initialization to migrate users from old badge system to new system
 * Ensures users don't lose credit for achievements already earned
 */

import { 
  migrateAchievements, 
  awardRetroactiveBadges,
  getUnlockedAchievements 
} from '../data/achievements.js';
import { 
  getUnlockedAchievements as getStoredAchievements,
  saveUnlockedAchievements 
} from '../utils/storage.js';

const MIGRATION_VERSION_KEY = 'goodlift_achievements_migration_version';
const CURRENT_MIGRATION_VERSION = 2; // Version 2 = rewards-system.md implementation

/**
 * Check if migration has already been run
 * @returns {boolean} True if migration already completed
 */
const isMigrationComplete = () => {
  const version = localStorage.getItem(MIGRATION_VERSION_KEY);
  return version && parseInt(version) >= CURRENT_MIGRATION_VERSION;
};

/**
 * Mark migration as complete
 */
const markMigrationComplete = () => {
  localStorage.setItem(MIGRATION_VERSION_KEY, CURRENT_MIGRATION_VERSION.toString());
};

/**
 * Run achievements migration
 * Maps old badge IDs to new ones and awards retroactive badges
 * @param {Object} userStats - Current user statistics
 * @param {Array} workoutHistory - Complete workout history
 * @returns {Promise<boolean>} True if migration was run, false if already completed
 */
export const runAchievementsMigration = async (userStats, workoutHistory) => {
  // Check if migration already completed
  if (isMigrationComplete()) {
    console.log('[Migration] Achievements migration already completed');
    return false;
  }
  
  console.log('[Migration] Running achievements migration...');
  
  try {
    // Get currently stored unlocked achievements
    const oldAchievementIds = await getStoredAchievements();
    
    // Step 1: Migrate old badge IDs to new badge IDs
    const migratedIds = migrateAchievements(oldAchievementIds);
    console.log(`[Migration] Migrated ${oldAchievementIds.length} badges to ${migratedIds.length} new badges`);
    
    // Step 2: Award retroactive badges based on current stats
    // This ensures users get credit for all milestones they've already achieved
    const allUnlockedIds = awardRetroactiveBadges(userStats, workoutHistory, migratedIds);
    console.log(`[Migration] Total badges after retroactive award: ${allUnlockedIds.length}`);
    
    // Step 3: Save the updated achievement list
    await saveUnlockedAchievements(allUnlockedIds);
    
    // Mark migration as complete
    markMigrationComplete();
    
    console.log('[Migration] Achievements migration completed successfully');
    return true;
  } catch (error) {
    console.error('[Migration] Error during achievements migration:', error);
    // Don't mark as complete if there was an error
    return false;
  }
};

/**
 * Force re-run migration (for testing or manual fixes)
 * @param {Object} userStats - Current user statistics
 * @param {Array} workoutHistory - Complete workout history
 */
export const forceRunMigration = async (userStats, workoutHistory) => {
  localStorage.removeItem(MIGRATION_VERSION_KEY);
  return runAchievementsMigration(userStats, workoutHistory);
};

/**
 * Reset migration state (for testing)
 */
export const resetMigration = () => {
  localStorage.removeItem(MIGRATION_VERSION_KEY);
  console.log('[Migration] Migration state reset');
};
