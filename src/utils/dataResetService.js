/**
 * Data Reset Service
 * Manages resetting user workout data while preserving authentication and profile information.
 * Implements 30-day backup/recovery window with automatic cleanup.
 */

import { isGuestMode, getGuestData, setGuestData } from './guestStorage';
import { getCurrentUserId } from './storage';
import { saveUserDataToFirebase, loadUserDataFromFirebase } from './firebaseStorage';

/** Storage key for backup data */
const BACKUP_KEY = 'goodlift_data_backup';
const GUEST_BACKUP_KEY = 'goodlift_guest_data_backup';

/** 30 days in milliseconds */
const BACKUP_RETENTION_DAYS = 30;
const BACKUP_RETENTION_MS = BACKUP_RETENTION_DAYS * 24 * 60 * 60 * 1000;

/**
 * Get all data that should be reset (stats, workouts, plans)
 * @returns {Object} Current user data to be reset
 */
const getResettableData = () => {
  const data = {};
  
  if (isGuestMode()) {
    // Guest mode data
    data.workoutHistory = getGuestData('workout_history') || [];
    data.userStats = getGuestData('user_stats') || null;
    data.exerciseWeights = getGuestData('exercise_weights') || {};
    data.exerciseTargetReps = getGuestData('exercise_target_reps') || {};
    data.hiitSessions = getGuestData('hiit_sessions') || [];
    data.cardioSessions = getGuestData('cardio_sessions') || [];
    data.stretchSessions = getGuestData('stretch_sessions') || [];
    data.workoutPlans = getGuestData('workout_plans') || [];
    data.activePlan = getGuestData('active_plan') || null;
    data.favoriteWorkouts = getGuestData('favorite_workouts') || [];
    data.favoriteExercises = getGuestData('favorite_exercises') || [];
    data.pinnedExercises = getGuestData('pinned_exercises') || [];
    data.unlockedAchievements = getGuestData('unlocked_achievements') || [];
    data.totalPRs = getGuestData('total_prs') || 0;
    data.totalVolume = getGuestData('total_volume') || 0;
  } else {
    // Authenticated user localStorage data
    const keys = {
      workoutHistory: 'goodlift_workout_history',
      userStats: 'goodlift_user_stats',
      exerciseWeights: 'goodlift_exercise_weights',
      exerciseTargetReps: 'goodlift_exercise_target_reps',
      hiitSessions: 'goodlift_hiit_sessions',
      cardioSessions: 'goodlift_cardio_sessions',
      stretchSessions: 'goodlift_stretch_sessions',
      workoutPlans: 'goodlift_workout_plans',
      activePlan: 'goodlift_active_plan',
      favoriteWorkouts: 'goodlift_favorite_workouts',
      favoriteExercises: 'goodlift_favorite_exercises',
      pinnedExercises: 'goodlift_pinned_exercises',
      unlockedAchievements: 'goodlift_unlocked_achievements',
      totalPRs: 'goodlift_total_prs',
      totalVolume: 'goodlift_total_volume',
    };

    Object.entries(keys).forEach(([key, storageKey]) => {
      try {
        const value = localStorage.getItem(storageKey);
        if (value) {
          data[key] = JSON.parse(value);
        } else {
          data[key] = null;
        }
      } catch (error) {
        console.error(`Error reading ${storageKey}:`, error);
        data[key] = null;
      }
    });
  }
  
  return data;
};

/**
 * Clear all resettable data from storage
 */
const clearResettableData = () => {
  if (isGuestMode()) {
    // Clear guest data
    setGuestData('workout_history', []);
    setGuestData('user_stats', {
      totalWorkouts: 0,
      totalTime: 0,
      totalHiitTime: 0,
      totalCardioTime: 0,
      totalStretchTime: 0,
      currentStreak: 0,
      longestStreak: 0,
      totalPRs: 0,
      totalVolume: 0,
    });
    setGuestData('exercise_weights', {});
    setGuestData('exercise_target_reps', {});
    setGuestData('hiit_sessions', []);
    setGuestData('cardio_sessions', []);
    setGuestData('stretch_sessions', []);
    setGuestData('workout_plans', []);
    setGuestData('active_plan', null);
    setGuestData('favorite_workouts', []);
    setGuestData('favorite_exercises', []);
    setGuestData('pinned_exercises', []);
    setGuestData('unlocked_achievements', []);
    setGuestData('total_prs', 0);
    setGuestData('total_volume', 0);
  } else {
    // Clear authenticated user localStorage data
    const keys = [
      'goodlift_workout_history',
      'goodlift_user_stats',
      'goodlift_exercise_weights',
      'goodlift_exercise_target_reps',
      'goodlift_hiit_sessions',
      'goodlift_cardio_sessions',
      'goodlift_stretch_sessions',
      'goodlift_workout_plans',
      'goodlift_active_plan',
      'goodlift_favorite_workouts',
      'goodlift_favorite_exercises',
      'goodlift_pinned_exercises',
      'goodlift_unlocked_achievements',
      'goodlift_total_prs',
      'goodlift_total_volume',
    ];

    keys.forEach(key => {
      try {
        // For stats, reset to default values instead of removing
        if (key === 'goodlift_user_stats') {
          localStorage.setItem(key, JSON.stringify({
            totalWorkouts: 0,
            totalTime: 0,
            totalHiitTime: 0,
            totalCardioTime: 0,
            totalStretchTime: 0,
            currentStreak: 0,
            longestStreak: 0,
            totalPRs: 0,
            totalVolume: 0,
          }));
        } else if (key === 'goodlift_exercise_weights' || key === 'goodlift_exercise_target_reps') {
          localStorage.setItem(key, JSON.stringify({}));
        } else if (key === 'goodlift_active_plan') {
          localStorage.removeItem(key);
        } else {
          localStorage.setItem(key, JSON.stringify([]));
        }
      } catch (error) {
        console.error(`Error clearing ${key}:`, error);
      }
    });
  }
};

/**
 * Restore data from backup
 * @param {Object} backup - Backup data object
 */
const restoreDataFromBackup = (backup) => {
  if (!backup || !backup.data) {
    throw new Error('Invalid backup data');
  }

  const { data } = backup;

  if (isGuestMode()) {
    // Restore guest data
    Object.entries(data).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        setGuestData(key.replace(/([A-Z])/g, '_$1').toLowerCase(), value);
      }
    });
  } else {
    // Restore authenticated user localStorage data
    const keyMapping = {
      workoutHistory: 'goodlift_workout_history',
      userStats: 'goodlift_user_stats',
      exerciseWeights: 'goodlift_exercise_weights',
      exerciseTargetReps: 'goodlift_exercise_target_reps',
      hiitSessions: 'goodlift_hiit_sessions',
      cardioSessions: 'goodlift_cardio_sessions',
      stretchSessions: 'goodlift_stretch_sessions',
      workoutPlans: 'goodlift_workout_plans',
      activePlan: 'goodlift_active_plan',
      favoriteWorkouts: 'goodlift_favorite_workouts',
      favoriteExercises: 'goodlift_favorite_exercises',
      pinnedExercises: 'goodlift_pinned_exercises',
      unlockedAchievements: 'goodlift_unlocked_achievements',
      totalPRs: 'goodlift_total_prs',
      totalVolume: 'goodlift_total_volume',
    };

    Object.entries(data).forEach(([key, value]) => {
      const storageKey = keyMapping[key];
      if (storageKey && value !== null && value !== undefined) {
        try {
          localStorage.setItem(storageKey, JSON.stringify(value));
        } catch (error) {
          console.error(`Error restoring ${storageKey}:`, error);
        }
      }
    });
  }
};

/**
 * Create a backup of current data
 * @returns {Promise<Object>} Backup object with metadata
 */
export const createBackup = async () => {
  try {
    const data = getResettableData();
    const backup = {
      data,
      timestamp: Date.now(),
      expiresAt: Date.now() + BACKUP_RETENTION_MS,
      version: 1,
    };

    // Save to localStorage
    const backupKey = isGuestMode() ? GUEST_BACKUP_KEY : BACKUP_KEY;
    localStorage.setItem(backupKey, JSON.stringify(backup));

    // Save to Firebase for authenticated users
    const userId = getCurrentUserId();
    if (userId && !isGuestMode()) {
      try {
        await saveUserDataToFirebase(userId, { dataBackup: backup });
      } catch (error) {
        console.error('Error saving backup to Firebase:', error);
        // Continue even if Firebase fails - we have localStorage backup
      }
    }

    return backup;
  } catch (error) {
    console.error('Error creating backup:', error);
    throw error;
  }
};

/**
 * Get current backup if it exists and hasn't expired
 * @returns {Promise<Object|null>} Backup object or null
 */
export const getBackup = async () => {
  try {
    // Check Firebase first for authenticated users
    const userId = getCurrentUserId();
    if (userId && !isGuestMode()) {
      try {
        const firebaseData = await loadUserDataFromFirebase(userId);
        if (firebaseData?.dataBackup) {
          // Check if expired
          if (firebaseData.dataBackup.expiresAt > Date.now()) {
            return firebaseData.dataBackup;
          } else {
            // Expired, clean it up
            await deleteBackup();
            return null;
          }
        }
      } catch (error) {
        console.error('Error loading backup from Firebase:', error);
        // Fall through to localStorage
      }
    }

    // Check localStorage
    const backupKey = isGuestMode() ? GUEST_BACKUP_KEY : BACKUP_KEY;
    const backupStr = localStorage.getItem(backupKey);
    
    if (!backupStr) {
      return null;
    }

    const backup = JSON.parse(backupStr);
    
    // Check if expired
    if (backup.expiresAt <= Date.now()) {
      // Expired, clean it up
      await deleteBackup();
      return null;
    }

    return backup;
  } catch (error) {
    console.error('Error getting backup:', error);
    return null;
  }
};

/**
 * Delete backup from storage
 * @returns {Promise<void>}
 */
export const deleteBackup = async () => {
  try {
    // Remove from localStorage
    const backupKey = isGuestMode() ? GUEST_BACKUP_KEY : BACKUP_KEY;
    localStorage.removeItem(backupKey);

    // Remove from Firebase for authenticated users
    const userId = getCurrentUserId();
    if (userId && !isGuestMode()) {
      try {
        await saveUserDataToFirebase(userId, { dataBackup: null });
      } catch (error) {
        console.error('Error deleting backup from Firebase:', error);
        // Continue even if Firebase fails
      }
    }
  } catch (error) {
    console.error('Error deleting backup:', error);
    throw error;
  }
};

/**
 * Reset user data and create backup
 * @returns {Promise<Object>} Result object with success status and backup info
 */
export const resetUserData = async () => {
  try {
    // Create backup before reset
    const backup = await createBackup();

    // Clear all resettable data
    clearResettableData();

    // Sync empty state to Firebase for authenticated users
    const userId = getCurrentUserId();
    if (userId && !isGuestMode()) {
      try {
        await saveUserDataToFirebase(userId, {
          workoutHistory: [],
          userStats: {
            totalWorkouts: 0,
            totalTime: 0,
            totalHiitTime: 0,
            totalCardioTime: 0,
            totalStretchTime: 0,
            currentStreak: 0,
            longestStreak: 0,
            totalPRs: 0,
            totalVolume: 0,
          },
          exerciseWeights: {},
          exerciseTargetReps: {},
          hiitSessions: [],
          cardioSessions: [],
          stretchSessions: [],
          workoutPlans: [],
          activePlanId: null,
        });
      } catch (error) {
        console.error('Error syncing reset to Firebase:', error);
        // Continue even if Firebase fails - local data is reset
      }
    }

    return {
      success: true,
      backup,
      message: 'Data reset successfully. You have 30 days to recover your data.',
    };
  } catch (error) {
    console.error('Error resetting user data:', error);
    return {
      success: false,
      message: 'Failed to reset data. Please try again.',
      error,
    };
  }
};

/**
 * Recover user data from backup
 * @returns {Promise<Object>} Result object with success status
 */
export const recoverUserData = async () => {
  try {
    const backup = await getBackup();
    
    if (!backup) {
      return {
        success: false,
        message: 'No backup found or backup has expired.',
      };
    }

    // Restore data from backup
    restoreDataFromBackup(backup);

    // Sync restored data to Firebase for authenticated users
    const userId = getCurrentUserId();
    if (userId && !isGuestMode()) {
      try {
        await saveUserDataToFirebase(userId, backup.data);
      } catch (error) {
        console.error('Error syncing recovered data to Firebase:', error);
        // Continue even if Firebase fails - local data is restored
      }
    }

    // Delete the backup after successful recovery
    await deleteBackup();

    return {
      success: true,
      message: 'Data recovered successfully!',
    };
  } catch (error) {
    console.error('Error recovering user data:', error);
    return {
      success: false,
      message: 'Failed to recover data. Please try again.',
      error,
    };
  }
};

/**
 * Check and clean up expired backups
 * Should be called on app initialization
 * @returns {Promise<boolean>} True if cleanup was performed
 */
export const cleanupExpiredBackups = async () => {
  try {
    const backup = await getBackup();
    // getBackup() already handles cleanup of expired backups
    return backup === null;
  } catch (error) {
    console.error('Error cleaning up expired backups:', error);
    return false;
  }
};

/**
 * Get information about what data will be reset
 * @returns {Object} Information about resettable data
 */
export const getResetInfo = () => {
  const data = getResettableData();
  
  const workoutCount = (data.workoutHistory || []).length;
  const hiitCount = (data.hiitSessions || []).length;
  const cardioCount = (data.cardioSessions || []).length;
  const stretchCount = (data.stretchSessions || []).length;
  const planCount = (data.workoutPlans || []).length;
  const favoriteWorkoutsCount = (data.favoriteWorkouts || []).length;
  const favoriteExercisesCount = (data.favoriteExercises || []).length;
  const pinnedExercisesCount = (data.pinnedExercises || []).length;
  
  return {
    totalWorkouts: workoutCount,
    totalHiitSessions: hiitCount,
    totalCardioSessions: cardioCount,
    totalStretchSessions: stretchCount,
    totalPlans: planCount,
    totalFavoriteWorkouts: favoriteWorkoutsCount,
    totalFavoriteExercises: favoriteExercisesCount,
    totalPinnedExercises: pinnedExercisesCount,
    hasData: workoutCount > 0 || hiitCount > 0 || cardioCount > 0 || 
             stretchCount > 0 || planCount > 0 || favoriteWorkoutsCount > 0,
  };
};
