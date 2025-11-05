import {
  saveWorkoutHistoryToFirebase,
  saveUserStatsToFirebase,
  saveExerciseWeightsToFirebase,
  saveExerciseTargetRepsToFirebase,
  loadUserDataFromFirebase
} from './firebaseStorage';

/**
 * Storage module for managing workout data in localStorage and Firebase
 * Provides functions for persisting and retrieving workout history, stats, and exercise data
 * Automatically syncs with Firebase when user is authenticated
 */

/** Storage keys for localStorage */
const KEYS = {
  WORKOUT_HISTORY: 'goodlift_workout_history',
  USER_STATS: 'goodlift_user_stats',
  EXERCISE_WEIGHTS: 'goodlift_exercise_weights',
  EXERCISE_TARGET_REPS: 'goodlift_exercise_target_reps',
  HIIT_SESSIONS: 'goodlift_hiit_sessions',
  STRETCH_SESSIONS: 'goodlift_stretch_sessions',
  YOGA_SESSIONS: 'goodlift_yoga_sessions',
  FAVORITE_WORKOUTS: 'goodlift_favorite_workouts',
};

/** Current authenticated user ID for Firebase sync */
let currentUserId = null;

/**
 * Set the current user ID for Firebase synchronization
 * @param {string} userId - Firebase user ID
 */
export const setCurrentUserId = (userId) => {
  currentUserId = userId;
};

/**
 * Get the current user ID
 * @returns {string|null} Current user ID or null if not authenticated
 */
export const getCurrentUserId = () => {
  return currentUserId;
};

/**
 * Get workout history from Firebase (if authenticated) or localStorage
 * @returns {Promise<Array>} Array of workout objects
 */
export const getWorkoutHistory = async () => {
  try {
    // Try Firebase first if user is authenticated
    if (currentUserId) {
      try {
        const firebaseData = await loadUserDataFromFirebase(currentUserId);
        if (firebaseData?.workoutHistory) {
          // Update localStorage cache for offline access
          localStorage.setItem(KEYS.WORKOUT_HISTORY, JSON.stringify(firebaseData.workoutHistory));
          return firebaseData.workoutHistory;
        }
      } catch (error) {
        console.error('Firebase fetch failed, using localStorage:', error);
      }
    }
    
    // Fallback to localStorage
    const history = localStorage.getItem(KEYS.WORKOUT_HISTORY);
    return history ? JSON.parse(history) : [];
  } catch (error) {
    console.error('Error reading workout history:', error);
    return [];
  }
};

/**
 * Save a completed workout to storage
 * Stats are automatically recalculated when getUserStats() is called
 * @param {Object} workoutData - Workout data including exercises, duration, etc.
 */
export const saveWorkout = async (workoutData) => {
  try {
    if (!workoutData) {
      throw new Error('Workout data is required');
    }
    
    const history = await getWorkoutHistory();
    history.unshift(workoutData); // Add to beginning for chronological order
    localStorage.setItem(KEYS.WORKOUT_HISTORY, JSON.stringify(history));
    
    // Sync to Firebase if user is logged in
    if (currentUserId) {
      await saveWorkoutHistoryToFirebase(currentUserId, history);
    }
    
    // Stats will be recalculated automatically next time getUserStats() is called
  } catch (error) {
    console.error('Error saving workout:', error);
    throw error; // Re-throw to allow caller to handle
  }
};

/**
 * Delete a workout from history
 * Stats are automatically recalculated when getUserStats() is called
 * @param {number} workoutIndex - Index of workout to delete
 */
export const deleteWorkout = async (workoutIndex) => {
  try {
    const history = await getWorkoutHistory();
    
    if (workoutIndex < 0 || workoutIndex >= history.length) {
      throw new Error('Invalid workout index');
    }
    
    history.splice(workoutIndex, 1);
    localStorage.setItem(KEYS.WORKOUT_HISTORY, JSON.stringify(history));
    
    // Sync to Firebase if user is logged in
    if (currentUserId) {
      await saveWorkoutHistoryToFirebase(currentUserId, history);
    }
    
    // Stats will be recalculated automatically next time getUserStats() is called
  } catch (error) {
    console.error('Error deleting workout:', error);
    throw error;
  }
};

/**
 * Get user statistics (total workouts, time, etc.)
 * IMPORTANT: Stats are now calculated from workout history to ensure they're always in sync
 * @returns {Promise<Object>} User stats object with totalWorkouts, totalTime, totalHiitTime
 */
export const getUserStats = async () => {
  try {
    // Get workout history (this will fetch from Firebase or localStorage)
    const history = await getWorkoutHistory();
    
    // Calculate stats from actual workout history
    const totalWorkouts = history.length;
    const totalTime = history.reduce((sum, workout) => sum + (workout.duration || 0), 0);
    
    // Calculate HIIT time from HIIT sessions
    let totalHiitTime = 0;
    try {
      const hiitSessions = getHiitSessions();
      totalHiitTime = hiitSessions.reduce((sum, session) => sum + (session.duration || 0), 0);
    } catch (error) {
      console.error('Error calculating HIIT time:', error);
    }
    
    // Calculate stretch time from stretch sessions
    let totalStretchTime = 0;
    try {
      const stretchSessions = getStretchSessions();
      totalStretchTime = stretchSessions.reduce((sum, session) => sum + (session.duration || 0), 0);
    } catch (error) {
      console.error('Error calculating stretch time:', error);
    }
    
    // Calculate yoga time from yoga sessions
    let totalYogaTime = 0;
    try {
      const yogaSessions = getYogaSessions();
      totalYogaTime = yogaSessions.reduce((sum, session) => sum + (session.duration || 0), 0);
    } catch (error) {
      console.error('Error calculating yoga time:', error);
    }
    
    const calculatedStats = { 
      totalWorkouts, 
      totalTime, 
      totalHiitTime,
      totalStretchTime,
      totalYogaTime
    };
    
    // Save the calculated stats back to storage
    localStorage.setItem(KEYS.USER_STATS, JSON.stringify(calculatedStats));
    if (currentUserId) {
      await saveUserStatsToFirebase(currentUserId, calculatedStats);
    }
    
    return calculatedStats;
  } catch (error) {
    console.error('Error calculating user stats:', error);
    return { totalWorkouts: 0, totalTime: 0, totalHiitTime: 0, totalStretchTime: 0, totalYogaTime: 0 };
  }
};

/**
 * Save user statistics
 * @param {Object} stats - Stats object with totalWorkouts, totalTime, totalHiitTime
 */
export const saveUserStats = async (stats) => {
  try {
    if (!stats) {
      throw new Error('Stats object is required');
    }
    
    localStorage.setItem(KEYS.USER_STATS, JSON.stringify(stats));
    
    // Sync to Firebase if user is logged in
    if (currentUserId) {
      await saveUserStatsToFirebase(currentUserId, stats);
    }
  } catch (error) {
    console.error('Error saving user stats:', error);
    throw error;
  }
};

/**
 * Get the last recorded weight for a specific exercise
 * @param {string} exerciseName - Name of the exercise
 * @returns {Promise<number>} Last recorded weight in lbs, or 0 if not found
 */
export const getExerciseWeight = async (exerciseName) => {
  try {
    // Try Firebase first if user is authenticated
    if (currentUserId) {
      try {
        const firebaseData = await loadUserDataFromFirebase(currentUserId);
        if (firebaseData?.exerciseWeights) {
          localStorage.setItem(KEYS.EXERCISE_WEIGHTS, JSON.stringify(firebaseData.exerciseWeights));
          return firebaseData.exerciseWeights[exerciseName] || 0;
        }
      } catch (error) {
        console.error('Firebase fetch failed, using localStorage:', error);
      }
    }
    
    // Fallback to localStorage
    const weights = localStorage.getItem(KEYS.EXERCISE_WEIGHTS);
    const weightsObj = weights ? JSON.parse(weights) : {};
    return weightsObj[exerciseName] || 0;
  } catch (error) {
    console.error('Error reading exercise weight:', error);
    return 0;
  }
};

/**
 * Get all exercise weights
 * @returns {Promise<Object>} Object with exercise names as keys and weights as values
 */
export const getAllExerciseWeights = async () => {
  try {
    // Try Firebase first if user is authenticated
    if (currentUserId) {
      try {
        const firebaseData = await loadUserDataFromFirebase(currentUserId);
        if (firebaseData?.exerciseWeights) {
          localStorage.setItem(KEYS.EXERCISE_WEIGHTS, JSON.stringify(firebaseData.exerciseWeights));
          return firebaseData.exerciseWeights;
        }
      } catch (error) {
        console.error('Firebase fetch failed, using localStorage:', error);
      }
    }
    
    // Fallback to localStorage
    const weights = localStorage.getItem(KEYS.EXERCISE_WEIGHTS);
    return weights ? JSON.parse(weights) : {};
  } catch (error) {
    console.error('Error reading exercise weights:', error);
    return {};
  }
};

/**
 * Set/update the weight for a specific exercise
 * @param {string} exerciseName - Name of the exercise
 * @param {number} weight - Weight in lbs
 */
export const setExerciseWeight = async (exerciseName, weight) => {
  try {
    if (!exerciseName) {
      throw new Error('Exercise name is required');
    }
    if (typeof weight !== 'number' || weight < 0) {
      throw new Error('Weight must be a positive number');
    }
    
    const weights = localStorage.getItem(KEYS.EXERCISE_WEIGHTS);
    const weightsObj = weights ? JSON.parse(weights) : {};
    weightsObj[exerciseName] = weight;
    localStorage.setItem(KEYS.EXERCISE_WEIGHTS, JSON.stringify(weightsObj));
    
    // Sync to Firebase if user is logged in
    if (currentUserId) {
      await saveExerciseWeightsToFirebase(currentUserId, weightsObj);
    }
  } catch (error) {
    console.error('Error saving exercise weight:', error);
    throw error;
  }
};

/**
 * Get the target rep count for a specific exercise
 * @param {string} exerciseName - Name of the exercise
 * @returns {Promise<number>} Target reps, defaults to 12 if not set
 */
export const getExerciseTargetReps = async (exerciseName) => {
  try {
    // Try Firebase first if user is authenticated
    if (currentUserId) {
      try {
        const firebaseData = await loadUserDataFromFirebase(currentUserId);
        if (firebaseData?.exerciseTargetReps) {
          localStorage.setItem(KEYS.EXERCISE_TARGET_REPS, JSON.stringify(firebaseData.exerciseTargetReps));
          return firebaseData.exerciseTargetReps[exerciseName] || 12;
        }
      } catch (error) {
        console.error('Firebase fetch failed, using localStorage:', error);
      }
    }
    
    // Fallback to localStorage
    const targetReps = localStorage.getItem(KEYS.EXERCISE_TARGET_REPS);
    const targetRepsObj = targetReps ? JSON.parse(targetReps) : {};
    return targetRepsObj[exerciseName] || 12; // Default to 12 reps
  } catch (error) {
    console.error('Error reading exercise target reps:', error);
    return 12;
  }
};

/**
 * Set/update the target rep count for a specific exercise
 * @param {string} exerciseName - Name of the exercise
 * @param {number} reps - Target rep count
 */
export const setExerciseTargetReps = async (exerciseName, reps) => {
  try {
    if (!exerciseName) {
      throw new Error('Exercise name is required');
    }
    if (typeof reps !== 'number' || reps < 1) {
      throw new Error('Reps must be a positive number');
    }
    
    const targetReps = localStorage.getItem(KEYS.EXERCISE_TARGET_REPS);
    const targetRepsObj = targetReps ? JSON.parse(targetReps) : {};
    targetRepsObj[exerciseName] = reps;
    localStorage.setItem(KEYS.EXERCISE_TARGET_REPS, JSON.stringify(targetRepsObj));
    
    // Sync to Firebase if user is logged in
    if (currentUserId) {
      await saveExerciseTargetRepsToFirebase(currentUserId, targetRepsObj);
    }
  } catch (error) {
    console.error('Error saving exercise target reps:', error);
    throw error;
  }
};

/**
 * Load user data from Firebase and sync to localStorage
 * Called when a user logs in to sync cloud data with local storage
 * @param {string} userId - The authenticated user's Firebase UID
 */
export const loadUserDataFromCloud = async (userId) => {
  if (!userId) {
    console.error('Cannot load data: No user ID provided');
    return;
  }

  try {
    setCurrentUserId(userId);
    
    const firebaseData = await loadUserDataFromFirebase(userId);
    
    if (firebaseData) {
      // Sync all data types from Firebase to localStorage
      if (firebaseData.workoutHistory) {
        localStorage.setItem(KEYS.WORKOUT_HISTORY, JSON.stringify(firebaseData.workoutHistory));
      }
      
      if (firebaseData.userStats) {
        localStorage.setItem(KEYS.USER_STATS, JSON.stringify(firebaseData.userStats));
      }
      
      if (firebaseData.exerciseWeights) {
        localStorage.setItem(KEYS.EXERCISE_WEIGHTS, JSON.stringify(firebaseData.exerciseWeights));
      }
      
      // Sync exercise target reps
      if (firebaseData.exerciseTargetReps) {
        localStorage.setItem(KEYS.EXERCISE_TARGET_REPS, JSON.stringify(firebaseData.exerciseTargetReps));
      }
      
      console.log('User data synced from Firebase to localStorage');
    } else {
      // No data in Firebase, sync current localStorage data to Firebase
      const localHistory = await getWorkoutHistory();
      const localStats = await getUserStats();
      const localWeights = localStorage.getItem(KEYS.EXERCISE_WEIGHTS);
      const weightsObj = localWeights ? JSON.parse(localWeights) : {};
      const localTargetReps = localStorage.getItem(KEYS.EXERCISE_TARGET_REPS);
      const targetRepsObj = localTargetReps ? JSON.parse(localTargetReps) : {};
      
      // If user has local data, sync it to Firebase
      if (localHistory.length > 0 || localStats?.totalWorkouts > 0 || 
          Object.keys(weightsObj).length > 0 || Object.keys(targetRepsObj).length > 0) {
        console.log('Syncing local data to Firebase for new user');
        await Promise.all([
          saveWorkoutHistoryToFirebase(userId, localHistory),
          saveUserStatsToFirebase(userId, localStats),
          saveExerciseWeightsToFirebase(userId, weightsObj),
          saveExerciseTargetRepsToFirebase(userId, targetRepsObj)
        ]);
      }
    }
  } catch (error) {
    console.error('Error loading user data from cloud:', error);
    // Continue using local data on error
  }
};

/**
 * Get HIIT sessions history from localStorage
 * @returns {Array} Array of HIIT session objects
 */
export const getHiitSessions = () => {
  try {
    const sessions = localStorage.getItem(KEYS.HIIT_SESSIONS);
    return sessions ? JSON.parse(sessions) : [];
  } catch (error) {
    console.error('Error reading HIIT sessions:', error);
    return [];
  }
};

/**
 * Save a completed HIIT session
 * @param {Object} sessionData - HIIT session data including duration
 */
export const saveHiitSession = async (sessionData) => {
  try {
    if (!sessionData) {
      throw new Error('Session data is required');
    }
    
    const sessions = getHiitSessions();
    sessions.unshift(sessionData); // Add to beginning for chronological order
    localStorage.setItem(KEYS.HIIT_SESSIONS, JSON.stringify(sessions));
    
    // Stats will be recalculated automatically next time getUserStats() is called
  } catch (error) {
    console.error('Error saving HIIT session:', error);
    throw error;
  }
};

/**
 * Get favorite workouts from localStorage
 * @returns {Array} Array of favorite workout objects
 */
export const getFavoriteWorkouts = () => {
  try {
    const favorites = localStorage.getItem(KEYS.FAVORITE_WORKOUTS);
    return favorites ? JSON.parse(favorites) : [];
  } catch (error) {
    console.error('Error reading favorite workouts:', error);
    return [];
  }
};

/**
 * Save a workout as a favorite
 * @param {Object} workoutData - Workout data including exercises, type, and equipment
 */
export const saveFavoriteWorkout = (workoutData) => {
  try {
    if (!workoutData) {
      throw new Error('Workout data is required');
    }
    
    const favorites = getFavoriteWorkouts();
    // Use timestamp + random number for better uniqueness
    const favoriteWorkout = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: workoutData.name || `${workoutData.type} Workout`,
      type: workoutData.type,
      equipment: workoutData.equipment || 'all',
      exercises: workoutData.exercises,
      savedAt: new Date().toISOString(),
    };
    
    favorites.unshift(favoriteWorkout);
    localStorage.setItem(KEYS.FAVORITE_WORKOUTS, JSON.stringify(favorites));
  } catch (error) {
    console.error('Error saving favorite workout:', error);
    throw error;
  }
};

/**
 * Delete a favorite workout
 * @param {number} workoutId - ID of the favorite workout to delete
 */
export const deleteFavoriteWorkout = (workoutId) => {
  try {
    const favorites = getFavoriteWorkouts();
    const filteredFavorites = favorites.filter(fav => fav.id !== workoutId);
    localStorage.setItem(KEYS.FAVORITE_WORKOUTS, JSON.stringify(filteredFavorites));
  } catch (error) {
    console.error('Error deleting favorite workout:', error);
    throw error;
  }
};

/**
 * Update the name of a favorite workout
 * @param {string} workoutId - ID of the favorite workout to update
 * @param {string} newName - New name for the workout
 */
export const updateFavoriteWorkoutName = (workoutId, newName) => {
  try {
    if (!workoutId || !newName) {
      throw new Error('Workout ID and new name are required');
    }
    
    const favorites = getFavoriteWorkouts();
    const updatedFavorites = favorites.map(fav => 
      fav.id === workoutId ? { ...fav, name: newName } : fav
    );
    localStorage.setItem(KEYS.FAVORITE_WORKOUTS, JSON.stringify(updatedFavorites));
  } catch (error) {
    console.error('Error updating favorite workout name:', error);
    throw error;
  }
};

/**
 * Get stretch sessions from localStorage
 * @returns {Array} Array of stretch session objects
 */
export const getStretchSessions = () => {
  try {
    const sessions = localStorage.getItem(KEYS.STRETCH_SESSIONS);
    return sessions ? JSON.parse(sessions) : [];
  } catch (error) {
    console.error('Error reading stretch sessions:', error);
    return [];
  }
};

/**
 * Save a completed stretch session
 * @param {Object} sessionData - Stretch session data including stretches and duration
 */
export const saveStretchSession = async (sessionData) => {
  try {
    if (!sessionData) {
      throw new Error('Session data is required');
    }
    
    const sessions = getStretchSessions();
    sessions.unshift(sessionData); // Add to beginning for chronological order
    localStorage.setItem(KEYS.STRETCH_SESSIONS, JSON.stringify(sessions));
    
    // Stats will be recalculated automatically next time getUserStats() is called
  } catch (error) {
    console.error('Error saving stretch session:', error);
    throw error;
  }
};

/**
 * Delete a stretch session
 * @param {string} sessionId - ID of the session to delete
 */
export const deleteStretchSession = async (sessionId) => {
  try {
    const sessions = getStretchSessions();
    const filteredSessions = sessions.filter(s => s.id !== sessionId);
    localStorage.setItem(KEYS.STRETCH_SESSIONS, JSON.stringify(filteredSessions));
    
    // Stats will be recalculated automatically next time getUserStats() is called
  } catch (error) {
    console.error('Error deleting stretch session:', error);
    throw error;
  }
};

/**
 * Get yoga sessions from localStorage
 * @returns {Array} Array of yoga session objects
 */
export const getYogaSessions = () => {
  try {
    const sessions = localStorage.getItem(KEYS.YOGA_SESSIONS);
    return sessions ? JSON.parse(sessions) : [];
  } catch (error) {
    console.error('Error reading yoga sessions:', error);
    return [];
  }
};

/**
 * Save a completed yoga session
 * @param {Object} sessionData - Yoga session data including flow name and duration
 */
export const saveYogaSession = async (sessionData) => {
  try {
    if (!sessionData) {
      throw new Error('Session data is required');
    }
    
    const sessions = getYogaSessions();
    sessions.unshift(sessionData); // Add to beginning for chronological order
    localStorage.setItem(KEYS.YOGA_SESSIONS, JSON.stringify(sessions));
    
    // Stats will be recalculated automatically next time getUserStats() is called
  } catch (error) {
    console.error('Error saving yoga session:', error);
    throw error;
  }
};

/**
 * Delete a yoga session
 * @param {string} sessionId - ID of the session to delete
 */
export const deleteYogaSession = async (sessionId) => {
  try {
    const sessions = getYogaSessions();
    const filteredSessions = sessions.filter(s => s.id !== sessionId);
    localStorage.setItem(KEYS.YOGA_SESSIONS, JSON.stringify(filteredSessions));
    
    // Stats will be recalculated automatically next time getUserStats() is called
  } catch (error) {
    console.error('Error deleting yoga session:', error);
    throw error;
  }
};

/**
 * Delete a HIIT session
 * @param {string} sessionId - ID of the session to delete
 */
export const deleteHiitSession = async (sessionId) => {
  try {
    const sessions = getHiitSessions();
    const filteredSessions = sessions.filter(s => s.id !== sessionId);
    localStorage.setItem(KEYS.HIIT_SESSIONS, JSON.stringify(filteredSessions));
    
    // Stats will be recalculated automatically next time getUserStats() is called
  } catch (error) {
    console.error('Error deleting HIIT session:', error);
    throw error;
  }
};
