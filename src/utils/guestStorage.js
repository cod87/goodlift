/**
 * Guest Storage Utility
 * Manages localStorage-based data persistence for guest users
 * Uses versioned JSON structure for future compatibility
 */

const GUEST_MODE_KEY = 'goodlift_guest_mode';
const GUEST_DATA_VERSION = 1;

/** Storage keys for guest data with prefix */
const GUEST_KEYS = {
  WORKOUT_HISTORY: 'goodlift_guest_workout_history',
  USER_STATS: 'goodlift_guest_user_stats',
  EXERCISE_WEIGHTS: 'goodlift_guest_exercise_weights',
  EXERCISE_TARGET_REPS: 'goodlift_guest_exercise_target_reps',
  HIIT_SESSIONS: 'goodlift_guest_hiit_sessions',
  STRETCH_SESSIONS: 'goodlift_guest_stretch_sessions',
  CARDIO_SESSIONS: 'goodlift_guest_cardio_sessions',
  FAVORITE_WORKOUTS: 'goodlift_guest_favorite_workouts',
  FAVORITE_EXERCISES: 'goodlift_guest_favorite_exercises',
  PINNED_EXERCISES: 'goodlift_guest_pinned_exercises',
  SNACKBAR_DISMISSED: 'goodlift_guest_snackbar_dismissed',
  UNLOCKED_ACHIEVEMENTS: 'goodlift_guest_unlocked_achievements',
  TOTAL_PRS: 'goodlift_guest_total_prs',
  TOTAL_VOLUME: 'goodlift_guest_total_volume',
  ACTIVE_PLAN: 'goodlift_guest_active_plan',
};

/**
 * Check if guest mode is currently active
 * @returns {boolean} True if in guest mode
 */
export const isGuestMode = () => {
  try {
    const guestMode = localStorage.getItem(GUEST_MODE_KEY);
    return guestMode === 'true';
  } catch (error) {
    console.error('Error checking guest mode:', error);
    return false;
  }
};

/**
 * Enable guest mode
 */
export const enableGuestMode = () => {
  try {
    localStorage.setItem(GUEST_MODE_KEY, 'true');
  } catch (error) {
    console.error('Error enabling guest mode:', error);
    handleQuotaError(error);
  }
};

/**
 * Disable guest mode
 */
export const disableGuestMode = () => {
  try {
    localStorage.removeItem(GUEST_MODE_KEY);
  } catch (error) {
    console.error('Error disabling guest mode:', error);
  }
};

/**
 * Get guest data for a specific category
 * @param {string} category - Data category (workout_history, user_stats, etc.)
 * @returns {any} Parsed data or default value
 */
export const getGuestData = (category) => {
  const key = GUEST_KEYS[category.toUpperCase()];
  if (!key) {
    console.error(`Invalid category: ${category}`);
    return null;
  }

  try {
    const data = localStorage.getItem(key);
    if (!data) return null;

    const parsed = JSON.parse(data);
    
    // Check version for future migrations
    if (parsed.version && parsed.version !== GUEST_DATA_VERSION) {
      console.warn(`Data version mismatch for ${category}: ${parsed.version} vs ${GUEST_DATA_VERSION}`);
      // Future: implement migration based on version
      // For now, attempt to return data as-is since v1 is current version
    }

    return parsed.data !== undefined ? parsed.data : parsed;
  } catch (error) {
    console.error(`Error reading guest data for ${category}:`, error);
    return null;
  }
};

/**
 * Set guest data for a specific category
 * @param {string} category - Data category
 * @param {any} data - Data to store
 */
export const setGuestData = (category, data) => {
  const key = GUEST_KEYS[category.toUpperCase()];
  if (!key) {
    console.error(`Invalid category: ${category}`);
    return;
  }

  try {
    const versionedData = {
      version: GUEST_DATA_VERSION,
      data: data,
      lastUpdated: new Date().toISOString(),
    };
    localStorage.setItem(key, JSON.stringify(versionedData));
  } catch (error) {
    console.error(`Error saving guest data for ${category}:`, error);
    handleQuotaError(error);
  }
};

/**
 * Clear all guest data from localStorage
 */
export const clearGuestData = () => {
  try {
    Object.values(GUEST_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
    disableGuestMode();
  } catch (error) {
    console.error('Error clearing guest data:', error);
  }
};

/**
 * Get all guest data for migration purposes
 * @returns {Object} All guest data organized by category
 */
export const getAllGuestData = () => {
  const allData = {};
  
  try {
    Object.entries(GUEST_KEYS).forEach(([category, key]) => {
      // Skip non-data keys
      if (category === 'SNACKBAR_DISMISSED') return;
      
      const data = localStorage.getItem(key);
      if (data) {
        try {
          const parsed = JSON.parse(data);
          allData[category.toLowerCase()] = parsed.data !== undefined ? parsed.data : parsed;
        } catch (error) {
          console.error(`Error parsing guest data for ${category}:`, error);
        }
      }
    });
  } catch (error) {
    console.error('Error getting all guest data:', error);
  }
  
  return allData;
};

/**
 * Check if guest snackbar should be shown
 * @returns {boolean} True if snackbar should be shown
 */
export const shouldShowGuestSnackbar = () => {
  try {
    const dismissed = localStorage.getItem(GUEST_KEYS.SNACKBAR_DISMISSED);
    if (!dismissed) return true;
    
    const dismissedTime = parseInt(dismissed, 10);
    const now = Date.now();
    const twentyFourHours = 24 * 60 * 60 * 1000;
    
    return (now - dismissedTime) > twentyFourHours;
  } catch (error) {
    console.error('Error checking snackbar status:', error);
    return true;
  }
};

/**
 * Dismiss guest snackbar for 24 hours
 */
export const dismissGuestSnackbar = () => {
  try {
    localStorage.setItem(GUEST_KEYS.SNACKBAR_DISMISSED, Date.now().toString());
  } catch (error) {
    console.error('Error dismissing snackbar:', error);
    handleQuotaError(error);
  }
};

/**
 * Handle localStorage quota exceeded errors
 * @param {Error} error - The error object
 */
const handleQuotaError = (error) => {
  if (error.name === 'QuotaExceededError' || error.code === 22) {
    console.error('localStorage quota exceeded. Some data may not be saved.');
    // Note: In production, consider implementing:
    // 1. User-facing error notification
    // 2. Automatic cleanup of old data
    // 3. Prompting user to sign up for cloud storage
  }
};

/**
 * Get storage usage information (for debugging/monitoring)
 * @returns {Object} Storage usage stats
 */
export const getStorageUsage = () => {
  try {
    let totalSize = 0;
    const breakdown = {};
    
    Object.entries(GUEST_KEYS).forEach(([category, key]) => {
      const data = localStorage.getItem(key);
      if (data) {
        const size = new Blob([data]).size;
        totalSize += size;
        breakdown[category] = size;
      }
    });
    
    return {
      totalBytes: totalSize,
      totalKB: (totalSize / 1024).toFixed(2),
      breakdown,
    };
  } catch (error) {
    console.error('Error calculating storage usage:', error);
    return { totalBytes: 0, totalKB: '0', breakdown: {} };
  }
};
