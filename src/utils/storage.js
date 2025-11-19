import {
  saveWorkoutHistoryToFirebase,
  saveUserStatsToFirebase,
  saveExerciseWeightsToFirebase,
  saveExerciseTargetRepsToFirebase,
  saveHiitSessionsToFirebase,
  saveCardioSessionsToFirebase,
  saveStretchSessionsToFirebase,
  saveWorkoutPlansToFirebase,
  saveActivePlanToFirebase,
  saveFavoriteWorkoutsToFirebase,
  saveHiitPresetsToFirebase,
  saveYogaPresetsToFirebase,
  loadUserDataFromFirebase
} from './firebaseStorage';
import { isGuestMode, getGuestData, setGuestData } from './guestStorage';

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
  CARDIO_SESSIONS: 'goodlift_cardio_sessions',
  FAVORITE_WORKOUTS: 'goodlift_favorite_workouts',
  FAVORITE_EXERCISES: 'goodlift_favorite_exercises',
  PINNED_EXERCISES: 'goodlift_pinned_exercises',
  WORKOUT_PLANS: 'goodlift_workout_plans',
  ACTIVE_PLAN: 'goodlift_active_plan',
  UNLOCKED_ACHIEVEMENTS: 'goodlift_unlocked_achievements',
  TOTAL_PRS: 'goodlift_total_prs',
  TOTAL_VOLUME: 'goodlift_total_volume',
  YOGA_PRESETS: 'goodlift_yoga_presets',
  HIIT_PRESETS: 'goodlift_hiit_presets',
  SAVED_WORKOUTS: 'goodlift_saved_workouts',
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
    // Check if in guest mode first
    if (isGuestMode()) {
      const guestData = getGuestData('workout_history');
      return guestData || [];
    }

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
    
    // Save based on mode
    if (isGuestMode()) {
      setGuestData('workout_history', history);
    } else {
      localStorage.setItem(KEYS.WORKOUT_HISTORY, JSON.stringify(history));
      
      // Sync to Firebase if user is logged in
      if (currentUserId) {
        await saveWorkoutHistoryToFirebase(currentUserId, history);
      }
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
    
    // Save based on mode
    if (isGuestMode()) {
      setGuestData('workout_history', history);
    } else {
      localStorage.setItem(KEYS.WORKOUT_HISTORY, JSON.stringify(history));
      
      // Sync to Firebase if user is logged in
      if (currentUserId) {
        await saveWorkoutHistoryToFirebase(currentUserId, history);
      }
    }
    
    // Stats will be recalculated automatically next time getUserStats() is called
  } catch (error) {
    console.error('Error deleting workout:', error);
    throw error;
  }
};

/**
 * Update a workout in history
 * @param {number} index - Index of the workout to update
 * @param {Object} updatedData - Updated workout data
 */
export const updateWorkout = async (index, updatedData) => {
  try {
    const history = await getWorkoutHistory();
    
    if (index < 0 || index >= history.length) {
      throw new Error('Invalid workout index');
    }
    
    // Update the workout
    history[index] = { ...history[index], ...updatedData };
    
    // Save updated history
    if (isGuestMode()) {
      setGuestData('workout_history', history);
    } else {
      localStorage.setItem(KEYS.WORKOUT_HISTORY, JSON.stringify(history));
      
      // Sync to Firebase if user is logged in
      if (currentUserId) {
        await saveWorkoutHistoryToFirebase(currentUserId, history);
      }
    }
  } catch (error) {
    console.error('Error updating workout:', error);
    throw error;
  }
};

/**
 * Get user statistics (total workouts, time, etc.)
 * IMPORTANT: Stats are now calculated from actual session data to ensure they're always in sync
 * @returns {Promise<Object>} User stats object with totalWorkouts, totalTime, and all session type times
 */
export const getUserStats = async () => {
  try {
    // Get workout history (this will fetch from Firebase or localStorage)
    const history = await getWorkoutHistory();
    
    // Import here to avoid circular dependency
    const { calculateStreak } = await import('./trackingMetrics');
    const streak = calculateStreak(history);
    
    // Calculate stats from actual workout history
    const totalWorkouts = history.length;
    const totalTime = history.reduce((sum, workout) => sum + (workout.duration || 0), 0);
    
    // Calculate time for each session type by summing their actual sessions
    const hiitSessions = getHiitSessions();
    const totalHiitTime = hiitSessions.reduce((sum, session) => sum + (session.duration || 0), 0);
    
    const cardioSessions = getCardioSessions();
    const totalCardioTime = cardioSessions.reduce((sum, session) => sum + (session.duration || 0), 0);
    
    const stretchSessions = getStretchSessions();
    const totalStretchTime = stretchSessions.reduce((sum, session) => sum + (session.duration || 0), 0);
    
    // Get achievement-related stats
    const totalPRs = await getTotalPRs();
    const totalVolume = await getTotalVolume();
    
    const calculatedStats = { 
      totalWorkouts, 
      totalTime, 
      totalHiitTime,
      totalCardioTime,
      totalStretchTime,
      currentStreak: streak.currentStreak,
      longestStreak: streak.longestStreak,
      totalPRs,
      totalVolume,
    };
    
    // Save the calculated stats back to storage for persistence
    if (isGuestMode()) {
      setGuestData('user_stats', calculatedStats);
    } else {
      localStorage.setItem(KEYS.USER_STATS, JSON.stringify(calculatedStats));
      if (currentUserId) {
        await saveUserStatsToFirebase(currentUserId, calculatedStats);
      }
    }
    
    return calculatedStats;
  } catch (error) {
    console.error('Error calculating user stats:', error);
    return { 
      totalWorkouts: 0, 
      totalTime: 0, 
      totalHiitTime: 0,
      totalCardioTime: 0,
      totalStretchTime: 0,
      currentStreak: 0,
      longestStreak: 0,
      totalPRs: 0,
      totalVolume: 0,
    };
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
    
    // Save based on mode
    if (isGuestMode()) {
      setGuestData('user_stats', stats);
    } else {
      localStorage.setItem(KEYS.USER_STATS, JSON.stringify(stats));
      
      // Sync to Firebase if user is logged in
      if (currentUserId) {
        await saveUserStatsToFirebase(currentUserId, stats);
      }
    }
  } catch (error) {
    console.error('Error saving user stats:', error);
    throw error;
  }
};

/**
 * Get the target weight for a specific exercise
 * @param {string} exerciseName - Name of the exercise
 * @returns {Promise<number|null>} Target weight in lbs (float, 2.5 lb increments), or null if not set
 */
export const getExerciseWeight = async (exerciseName) => {
  try {
    // Check if in guest mode first
    if (isGuestMode()) {
      const guestWeights = getGuestData('exercise_weights');
      const value = guestWeights?.[exerciseName];
      return value !== undefined ? value : null;
    }

    // Try Firebase first if user is authenticated
    if (currentUserId) {
      try {
        const firebaseData = await loadUserDataFromFirebase(currentUserId);
        if (firebaseData?.exerciseWeights) {
          localStorage.setItem(KEYS.EXERCISE_WEIGHTS, JSON.stringify(firebaseData.exerciseWeights));
          const value = firebaseData.exerciseWeights[exerciseName];
          return value !== undefined ? value : null;
        }
      } catch (error) {
        console.error('Firebase fetch failed, using localStorage:', error);
      }
    }
    
    // Fallback to localStorage
    const weights = localStorage.getItem(KEYS.EXERCISE_WEIGHTS);
    const weightsObj = weights ? JSON.parse(weights) : {};
    const value = weightsObj[exerciseName];
    return value !== undefined ? value : null;
  } catch (error) {
    console.error('Error reading exercise weight:', error);
    return null;
  }
};

/**
 * Get all exercise weights
 * @returns {Promise<Object>} Object with exercise names as keys and weights as values
 */
export const getAllExerciseWeights = async () => {
  try {
    // Check if in guest mode first
    if (isGuestMode()) {
      const guestWeights = getGuestData('exercise_weights');
      return guestWeights || {};
    }

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
 * Set/update the target weight for a specific exercise
 * @param {string} exerciseName - Name of the exercise
 * @param {number|null} weight - Target weight in lbs (float, 2.5 lb increments) or null to unset
 */
export const setExerciseWeight = async (exerciseName, weight) => {
  try {
    if (!exerciseName) {
      throw new Error('Exercise name is required');
    }
    // Allow null/undefined to unset the weight, otherwise validate as non-negative number
    if (weight !== null && weight !== undefined && (typeof weight !== 'number' || weight < 0)) {
      throw new Error('Weight must be a positive number or null');
    }
    
    // Get current weights
    const weightsObj = await getAllExerciseWeights();
    // Store null for unset, otherwise store the numeric value
    weightsObj[exerciseName] = (weight === null || weight === undefined) ? null : weight;
    
    // Save based on mode
    if (isGuestMode()) {
      setGuestData('exercise_weights', weightsObj);
    } else {
      localStorage.setItem(KEYS.EXERCISE_WEIGHTS, JSON.stringify(weightsObj));
      
      // Sync to Firebase if user is logged in
      if (currentUserId) {
        await saveExerciseWeightsToFirebase(currentUserId, weightsObj);
      }
    }
  } catch (error) {
    console.error('Error saving exercise weight:', error);
    throw error;
  }
};

/**
 * Get the target rep count for a specific exercise
 * @param {string} exerciseName - Name of the exercise
 * @returns {Promise<number|null>} Target reps (integer), or null if not set
 */
export const getExerciseTargetReps = async (exerciseName) => {
  try {
    // Check if in guest mode first
    if (isGuestMode()) {
      const guestReps = getGuestData('exercise_target_reps');
      const value = guestReps?.[exerciseName];
      return value !== undefined ? value : null;
    }

    // Try Firebase first if user is authenticated
    if (currentUserId) {
      try {
        const firebaseData = await loadUserDataFromFirebase(currentUserId);
        if (firebaseData?.exerciseTargetReps) {
          localStorage.setItem(KEYS.EXERCISE_TARGET_REPS, JSON.stringify(firebaseData.exerciseTargetReps));
          const value = firebaseData.exerciseTargetReps[exerciseName];
          return value !== undefined ? value : null;
        }
      } catch (error) {
        console.error('Firebase fetch failed, using localStorage:', error);
      }
    }
    
    // Fallback to localStorage
    const targetReps = localStorage.getItem(KEYS.EXERCISE_TARGET_REPS);
    const targetRepsObj = targetReps ? JSON.parse(targetReps) : {};
    const value = targetRepsObj[exerciseName];
    return value !== undefined ? value : null;
  } catch (error) {
    console.error('Error reading exercise target reps:', error);
    return null;
  }
};

/**
 * Set/update the target rep count for a specific exercise
 * @param {string} exerciseName - Name of the exercise
 * @param {number|null} reps - Target rep count (integer) or null to unset
 */
export const setExerciseTargetReps = async (exerciseName, reps) => {
  try {
    if (!exerciseName) {
      throw new Error('Exercise name is required');
    }
    // Allow null/undefined to unset the reps, otherwise validate as positive integer
    if (reps !== null && reps !== undefined && (typeof reps !== 'number' || reps < 1)) {
      throw new Error('Reps must be a positive number or null');
    }
    
    // Get current target reps
    let targetRepsObj = {};
    if (isGuestMode()) {
      targetRepsObj = getGuestData('exercise_target_reps') || {};
    } else {
      const targetReps = localStorage.getItem(KEYS.EXERCISE_TARGET_REPS);
      targetRepsObj = targetReps ? JSON.parse(targetReps) : {};
    }
    
    // Store null for unset, otherwise store the numeric value
    targetRepsObj[exerciseName] = (reps === null || reps === undefined) ? null : reps;
    
    // Save based on mode
    if (isGuestMode()) {
      setGuestData('exercise_target_reps', targetRepsObj);
    } else {
      localStorage.setItem(KEYS.EXERCISE_TARGET_REPS, JSON.stringify(targetRepsObj));
      
      // Sync to Firebase if user is logged in
      if (currentUserId) {
        await saveExerciseTargetRepsToFirebase(currentUserId, targetRepsObj);
      }
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
      
      // Sync session data
      if (firebaseData.hiitSessions) {
        localStorage.setItem(KEYS.HIIT_SESSIONS, JSON.stringify(firebaseData.hiitSessions));
      }
      
      if (firebaseData.cardioSessions) {
        localStorage.setItem(KEYS.CARDIO_SESSIONS, JSON.stringify(firebaseData.cardioSessions));
      }
      
      if (firebaseData.stretchSessions) {
        localStorage.setItem(KEYS.STRETCH_SESSIONS, JSON.stringify(firebaseData.stretchSessions));
      }
      
      // Sync workout plans
      if (firebaseData.workoutPlans) {
        localStorage.setItem(KEYS.WORKOUT_PLANS, JSON.stringify(firebaseData.workoutPlans));
      }
      
      // Sync active plan ID
      if (firebaseData.activePlanId) {
        localStorage.setItem(KEYS.ACTIVE_PLAN, firebaseData.activePlanId);
      }
    } else {
      // No data in Firebase, sync current localStorage data to Firebase
      const localHistory = await getWorkoutHistory();
      const localStats = await getUserStats();
      const localWeights = localStorage.getItem(KEYS.EXERCISE_WEIGHTS);
      const weightsObj = localWeights ? JSON.parse(localWeights) : {};
      const localTargetReps = localStorage.getItem(KEYS.EXERCISE_TARGET_REPS);
      const targetRepsObj = localTargetReps ? JSON.parse(localTargetReps) : {};
      const localHiit = getHiitSessions();
      const localCardio = getCardioSessions();
      const localStretch = getStretchSessions();
      const localPlans = localStorage.getItem(KEYS.WORKOUT_PLANS);
      const plansArray = localPlans ? JSON.parse(localPlans) : [];
      const localActivePlanId = localStorage.getItem(KEYS.ACTIVE_PLAN);
      
      // If user has local data, sync it to Firebase
      if (localHistory.length > 0 || localStats?.totalWorkouts > 0 || 
          Object.keys(weightsObj).length > 0 || Object.keys(targetRepsObj).length > 0 ||
          localHiit.length > 0 || localCardio.length > 0 || 
          localStretch.length > 0 ||
          plansArray.length > 0 || localActivePlanId) {
        await Promise.all([
          saveWorkoutHistoryToFirebase(userId, localHistory),
          saveUserStatsToFirebase(userId, localStats),
          saveExerciseWeightsToFirebase(userId, weightsObj),
          saveExerciseTargetRepsToFirebase(userId, targetRepsObj),
          saveHiitSessionsToFirebase(userId, localHiit),
          saveCardioSessionsToFirebase(userId, localCardio),
          saveStretchSessionsToFirebase(userId, localStretch),
          saveWorkoutPlansToFirebase(userId, plansArray),
          saveActivePlanToFirebase(userId, localActivePlanId)
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
    if (isGuestMode()) {
      return getGuestData('hiit_sessions') || [];
    }
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
    
    // Save based on mode
    if (isGuestMode()) {
      setGuestData('hiit_sessions', sessions);
    } else {
      localStorage.setItem(KEYS.HIIT_SESSIONS, JSON.stringify(sessions));
      
      // Sync to Firebase if user is logged in
      if (currentUserId) {
        await saveHiitSessionsToFirebase(currentUserId, sessions);
      }
    }
    
    // Stats will be recalculated automatically next time getUserStats() is called
  } catch (error) {
    console.error('Error saving HIIT session:', error);
    throw error;
  }
};

/**
 * Get cardio sessions history from localStorage
 * @returns {Array} Array of cardio session objects
 */
export const getCardioSessions = () => {
  try {
    if (isGuestMode()) {
      return getGuestData('cardio_sessions') || [];
    }
    const sessions = localStorage.getItem(KEYS.CARDIO_SESSIONS);
    return sessions ? JSON.parse(sessions) : [];
  } catch (error) {
    console.error('Error reading cardio sessions:', error);
    return [];
  }
};

/**
 * Save a completed cardio session
 * @param {Object} sessionData - Cardio session data including cardioType, duration, date
 */
export const saveCardioSession = async (sessionData) => {
  try {
    if (!sessionData) {
      throw new Error('Session data is required');
    }
    
    const sessions = getCardioSessions();
    const newSession = {
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      cardioType: sessionData.cardioType,
      duration: sessionData.duration,
      date: sessionData.date || Date.now(),
      notes: sessionData.notes || '',
    };
    
    sessions.unshift(newSession); // Add to beginning for chronological order
    
    // Save based on mode
    if (isGuestMode()) {
      setGuestData('cardio_sessions', sessions);
    } else {
      localStorage.setItem(KEYS.CARDIO_SESSIONS, JSON.stringify(sessions));
      
      // Sync to Firebase if user is logged in
      if (currentUserId) {
        await saveCardioSessionsToFirebase(currentUserId, sessions);
      }
    }
    
    // Stats will be recalculated automatically next time getUserStats() is called
  } catch (error) {
    console.error('Error saving cardio session:', error);
    throw error;
  }
};

/**
 * Delete a cardio session by ID
 * @param {string} sessionId - ID of the cardio session to delete
 */
export const deleteCardioSession = async (sessionId) => {
  try {
    const sessions = getCardioSessions();
    const sessionToDelete = sessions.find(s => s.id === sessionId);
    
    if (!sessionToDelete) {
      throw new Error('Session not found');
    }
    
    const updatedSessions = sessions.filter(s => s.id !== sessionId);
    
    // Save based on mode
    if (isGuestMode()) {
      setGuestData('cardio_sessions', updatedSessions);
    } else {
      localStorage.setItem(KEYS.CARDIO_SESSIONS, JSON.stringify(updatedSessions));
      
      // Sync to Firebase if user is logged in
      if (currentUserId) {
        await saveCardioSessionsToFirebase(currentUserId, updatedSessions);
      }
    }
    
    // Stats will be recalculated automatically next time getUserStats() is called
  } catch (error) {
    console.error('Error deleting cardio session:', error);
    throw error;
  }
};

/**
 * Update a cardio session
 * @param {string} sessionId - ID of the session to update
 * @param {Object} updatedData - Updated session data
 */
export const updateCardioSession = async (sessionId, updatedData) => {
  try {
    const sessions = getCardioSessions();
    const sessionIndex = sessions.findIndex(s => s.id === sessionId);
    
    if (sessionIndex === -1) {
      throw new Error('Session not found');
    }
    
    // Update the session
    sessions[sessionIndex] = { ...sessions[sessionIndex], ...updatedData };
    
    // Save based on mode
    if (isGuestMode()) {
      setGuestData('cardio_sessions', sessions);
    } else {
      localStorage.setItem(KEYS.CARDIO_SESSIONS, JSON.stringify(sessions));
      
      // Sync to Firebase if user is logged in
      if (currentUserId) {
        await saveCardioSessionsToFirebase(currentUserId, sessions);
      }
    }
  } catch (error) {
    console.error('Error updating cardio session:', error);
    throw error;
  }
};

/**
 * Get favorite workouts from Firebase (if authenticated) or localStorage
 * @returns {Promise<Array>} Array of favorite workout objects
 */
export const getFavoriteWorkouts = async () => {
  try {
    // Check if in guest mode first
    if (isGuestMode()) {
      return getGuestData('favorite_workouts') || [];
    }

    // Try Firebase first if user is authenticated
    if (currentUserId) {
      try {
        const firebaseData = await loadUserDataFromFirebase(currentUserId);
        if (firebaseData?.favoriteWorkouts) {
          // Update localStorage cache for offline access
          localStorage.setItem(KEYS.FAVORITE_WORKOUTS, JSON.stringify(firebaseData.favoriteWorkouts));
          return firebaseData.favoriteWorkouts;
        }
      } catch (error) {
        console.error('Firebase fetch failed for favorite workouts, using localStorage:', error);
      }
    }
    
    // Fallback to localStorage
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
export const saveFavoriteWorkout = async (workoutData) => {
  try {
    if (!workoutData) {
      throw new Error('Workout data is required');
    }
    
    const favorites = await getFavoriteWorkouts();
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
    
    // Save based on mode
    if (isGuestMode()) {
      setGuestData('favorite_workouts', favorites);
    } else {
      localStorage.setItem(KEYS.FAVORITE_WORKOUTS, JSON.stringify(favorites));
      // Sync to Firebase if authenticated
      if (currentUserId) {
        await saveFavoriteWorkoutsToFirebase(currentUserId, favorites);
      }
    }
  } catch (error) {
    console.error('Error saving favorite workout:', error);
    throw error;
  }
};

/**
 * Delete a favorite workout
 * @param {number} workoutId - ID of the favorite workout to delete
 */
export const deleteFavoriteWorkout = async (workoutId) => {
  try {
    const favorites = await getFavoriteWorkouts();
    const filteredFavorites = favorites.filter(fav => fav.id !== workoutId);
    
    // Save based on mode
    if (isGuestMode()) {
      setGuestData('favorite_workouts', filteredFavorites);
    } else {
      localStorage.setItem(KEYS.FAVORITE_WORKOUTS, JSON.stringify(filteredFavorites));
      // Sync to Firebase if authenticated
      if (currentUserId) {
        await saveFavoriteWorkoutsToFirebase(currentUserId, filteredFavorites);
      }
    }
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
export const updateFavoriteWorkoutName = async (workoutId, newName) => {
  try {
    if (!workoutId || !newName) {
      throw new Error('Workout ID and new name are required');
    }
    
    const favorites = await getFavoriteWorkouts();
    const updatedFavorites = favorites.map(fav => 
      fav.id === workoutId ? { ...fav, name: newName } : fav
    );
    
    // Save based on mode
    if (isGuestMode()) {
      setGuestData('favorite_workouts', updatedFavorites);
    } else {
      localStorage.setItem(KEYS.FAVORITE_WORKOUTS, JSON.stringify(updatedFavorites));
      // Sync to Firebase if authenticated
      if (currentUserId) {
        await saveFavoriteWorkoutsToFirebase(currentUserId, updatedFavorites);
      }
    }
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
    if (isGuestMode()) {
      return getGuestData('stretch_sessions') || [];
    }
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
    
    // Save based on mode
    if (isGuestMode()) {
      setGuestData('stretch_sessions', sessions);
    } else {
      localStorage.setItem(KEYS.STRETCH_SESSIONS, JSON.stringify(sessions));
      
      // Sync to Firebase if user is logged in
      if (currentUserId) {
        await saveStretchSessionsToFirebase(currentUserId, sessions);
      }
    }
    
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
    
    // Save based on mode
    if (isGuestMode()) {
      setGuestData('stretch_sessions', filteredSessions);
    } else {
      localStorage.setItem(KEYS.STRETCH_SESSIONS, JSON.stringify(filteredSessions));
      
      // Sync to Firebase if user is logged in
      if (currentUserId) {
        await saveStretchSessionsToFirebase(currentUserId, filteredSessions);
      }
    }
    
    // Stats will be recalculated automatically next time getUserStats() is called
  } catch (error) {
    console.error('Error deleting stretch session:', error);
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
    
    // Save based on mode
    if (isGuestMode()) {
      setGuestData('hiit_sessions', filteredSessions);
    } else {
      localStorage.setItem(KEYS.HIIT_SESSIONS, JSON.stringify(filteredSessions));
      
      // Sync to Firebase if user is logged in
      if (currentUserId) {
        await saveHiitSessionsToFirebase(currentUserId, filteredSessions);
      }
    }
    
    // Stats will be recalculated automatically next time getUserStats() is called
  } catch (error) {
    console.error('Error deleting HIIT session:', error);
    throw error;
  }
};

/**
 * Update a HIIT session
 * @param {string} sessionId - ID of the session to update
 * @param {Object} updatedData - Updated session data
 */
export const updateHiitSession = async (sessionId, updatedData) => {
  try {
    const sessions = getHiitSessions();
    const sessionIndex = sessions.findIndex(s => s.id === sessionId);
    
    if (sessionIndex === -1) {
      throw new Error('Session not found');
    }
    
    // Update the session
    sessions[sessionIndex] = { ...sessions[sessionIndex], ...updatedData };
    
    // Save based on mode
    if (isGuestMode()) {
      setGuestData('hiit_sessions', sessions);
    } else {
      localStorage.setItem(KEYS.HIIT_SESSIONS, JSON.stringify(sessions));
      
      // Sync to Firebase if user is logged in
      if (currentUserId) {
        await saveHiitSessionsToFirebase(currentUserId, sessions);
      }
    }
  } catch (error) {
    console.error('Error updating HIIT session:', error);
    throw error;
  }
};

/**
 * Get favorite exercises from localStorage
 * @returns {Set<string>} Set of favorite exercise names
 */
export const getFavoriteExercises = () => {
  try {
    if (isGuestMode()) {
      const favorites = getGuestData('favorite_exercises') || [];
      return new Set(favorites);
    }
    const favorites = localStorage.getItem(KEYS.FAVORITE_EXERCISES);
    return new Set(favorites ? JSON.parse(favorites) : []);
  } catch (error) {
    console.error('Error reading favorite exercises:', error);
    return new Set();
  }
};

/**
 * Toggle an exercise as favorite (add if not favorited, remove if already favorited)
 * @param {string} exerciseName - Name of the exercise
 * @returns {boolean} True if exercise is now favorited, false if unfavorited
 */
export const toggleFavoriteExercise = (exerciseName) => {
  try {
    if (!exerciseName) {
      throw new Error('Exercise name is required');
    }
    
    const favorites = getFavoriteExercises();
    let isFavorited;
    
    if (favorites.has(exerciseName)) {
      favorites.delete(exerciseName);
      isFavorited = false;
    } else {
      favorites.add(exerciseName);
      isFavorited = true;
    }
    
    const favoritesArray = Array.from(favorites);
    
    // Save based on mode
    if (isGuestMode()) {
      setGuestData('favorite_exercises', favoritesArray);
    } else {
      localStorage.setItem(KEYS.FAVORITE_EXERCISES, JSON.stringify(favoritesArray));
    }
    
    return isFavorited;
  } catch (error) {
    console.error('Error toggling favorite exercise:', error);
    throw error;
  }
};

/**
 * Check if an exercise is favorited
 * @param {string} exerciseName - Name of the exercise
 * @returns {boolean} True if exercise is favorited
 */
export const isFavoriteExercise = (exerciseName) => {
  const favorites = getFavoriteExercises();
  return favorites.has(exerciseName);
};

/**
 * Get pinned exercises for progress tracking
 * @returns {Array} Array of pinned exercise configurations
 */
export const getPinnedExercises = () => {
  try {
    if (isGuestMode()) {
      const guestPinned = getGuestData('pinned_exercises');
      return guestPinned || [];
    }
    
    const pinned = localStorage.getItem(KEYS.PINNED_EXERCISES);
    return pinned ? JSON.parse(pinned) : [];
  } catch (error) {
    console.error('Error reading pinned exercises:', error);
    return [];
  }
};

/**
 * Save pinned exercises for progress tracking
 * @param {Array} pinnedExercises - Array of pinned exercise configurations
 * Each config: { exerciseName: string, trackingMode: 'weight' | 'reps' }
 */
export const setPinnedExercises = (pinnedExercises) => {
  try {
    if (!Array.isArray(pinnedExercises)) {
      throw new Error('Pinned exercises must be an array');
    }
    
    // Limit to 10 pinned exercises
    const limitedPinned = pinnedExercises.slice(0, 10);
    
    if (isGuestMode()) {
      setGuestData('pinned_exercises', limitedPinned);
    } else {
      localStorage.setItem(KEYS.PINNED_EXERCISES, JSON.stringify(limitedPinned));
    }
  } catch (error) {
    console.error('Error saving pinned exercises:', error);
    throw error;
  }
};

/**
 * Workout Plan Storage Functions
 */

/**
 * Get all workout plans
 * @returns {Promise<Array>} Array of workout plans
 */
export const getWorkoutPlans = async () => {
  try {
    // Check if in guest mode first
    if (isGuestMode()) {
      const guestData = getGuestData('workout_plans');
      return guestData || [];
    }

    // Try Firebase first if user is authenticated
    if (currentUserId) {
      try {
        const firebaseData = await loadUserDataFromFirebase(currentUserId);
        if (firebaseData?.workoutPlans) {
          // Update localStorage cache for offline access
          localStorage.setItem(KEYS.WORKOUT_PLANS, JSON.stringify(firebaseData.workoutPlans));
          return firebaseData.workoutPlans;
        }
      } catch (error) {
        console.error('Firebase fetch failed, using localStorage:', error);
      }
    }

    // Fallback to localStorage
    const plans = localStorage.getItem(KEYS.WORKOUT_PLANS);
    return plans ? JSON.parse(plans) : [];
  } catch (error) {
    console.error('Error reading workout plans:', error);
    return [];
  }
};

/**
 * Save a workout plan
 * @param {Object} plan - Workout plan to save
 * @returns {Promise<void>}
 */
export const saveWorkoutPlan = async (plan) => {
  try {
    const plans = await getWorkoutPlans();
    const existingIndex = plans.findIndex(p => p.id === plan.id);
    
    if (existingIndex >= 0) {
      plans[existingIndex] = plan;
    } else {
      plans.push(plan);
    }

    // Save based on mode
    if (isGuestMode()) {
      setGuestData('workout_plans', plans);
    } else {
      localStorage.setItem(KEYS.WORKOUT_PLANS, JSON.stringify(plans));
      
      // Sync to Firebase if user is logged in
      if (currentUserId) {
        console.log('Syncing to Firebase for user:', currentUserId);
        await saveWorkoutPlansToFirebase(currentUserId, plans);
        console.log('Firebase sync complete');
      }
    }
  } catch (error) {
    console.error('Error saving workout plan:', error);
    throw error;
  }
};

/**
 * Delete a workout plan
 * @param {string} planId - Plan ID to delete
 * @returns {Promise<void>}
 */
export const deleteWorkoutPlan = async (planId) => {
  try {
    const plans = await getWorkoutPlans();
    const filtered = plans.filter(p => p.id !== planId);
    
    // Save based on mode
    if (isGuestMode()) {
      setGuestData('workout_plans', filtered);
    } else {
      localStorage.setItem(KEYS.WORKOUT_PLANS, JSON.stringify(filtered));
      
      // Sync to Firebase if user is logged in
      if (currentUserId) {
        await saveWorkoutPlansToFirebase(currentUserId, filtered);
      }
    }

    // If this was the active plan, clear it
    const activePlan = await getActivePlan();
    if (activePlan && activePlan.id === planId) {
      await setActivePlan(null);
    }
  } catch (error) {
    console.error('Error deleting workout plan:', error);
    throw error;
  }
};

/**
 * Get the active workout plan
 * @returns {Promise<Object|null>} Active plan or null
 */
export const getActivePlan = async () => {
  try {
    if (isGuestMode()) {
      const guestData = getGuestData('active_plan');
      return guestData || null;
    }

    // Try Firebase first if user is authenticated
    if (currentUserId) {
      try {
        const firebaseData = await loadUserDataFromFirebase(currentUserId);
        if (firebaseData?.activePlanId) {
          // Cache to localStorage
          localStorage.setItem(KEYS.ACTIVE_PLAN, firebaseData.activePlanId);
          const plans = await getWorkoutPlans();
          return plans.find(p => p.id === firebaseData.activePlanId) || null;
        }
      } catch (error) {
        console.error('Firebase fetch failed, using localStorage:', error);
      }
    }

    // Fallback to localStorage
    const activePlanId = localStorage.getItem(KEYS.ACTIVE_PLAN);
    if (!activePlanId) return null;

    const plans = await getWorkoutPlans();
    return plans.find(p => p.id === activePlanId) || null;
  } catch (error) {
    console.error('Error reading active plan:', error);
    return null;
  }
};

/**
 * Set the active workout plan
 * @param {string|Object|null} planIdOrObject - Plan ID, plan object to set as active, or null to clear
 * @returns {Promise<void>}
 */
export const setActivePlan = async (planIdOrObject) => {
  try {
    // Handle null case - clear active plan
    if (!planIdOrObject) {
      if (isGuestMode()) {
        setGuestData('active_plan', null);
      } else {
        localStorage.removeItem(KEYS.ACTIVE_PLAN);
        if (currentUserId) {
          await saveActivePlanToFirebase(currentUserId, null);
        }
      }
      return;
    }

    // Extract plan ID from object or use string directly
    const planId = typeof planIdOrObject === 'object' ? planIdOrObject.id : planIdOrObject;
    
    if (!planId) {
      throw new Error('Plan ID is required');
    }

    if (isGuestMode()) {
      // For guest mode, store the full plan object
      const plans = await getWorkoutPlans();
      const plan = plans.find(p => p.id === planId);
      if (!plan) {
        throw new Error(`Plan with ID ${planId} not found`);
      }
      setGuestData('active_plan', plan);
    } else {
      // For authenticated users, store just the ID
      localStorage.setItem(KEYS.ACTIVE_PLAN, planId);
      
      // Sync to Firebase if user is logged in
      if (currentUserId) {
        await saveActivePlanToFirebase(currentUserId, planId);
      }
    }
  } catch (error) {
    console.error('Error setting active plan:', error);
    throw error;
  }
};

/**
 * Get a specific workout plan by ID
 * @param {string} planId - Plan ID
 * @returns {Promise<Object|null>} Plan or null if not found
 */
export const getWorkoutPlanById = async (planId) => {
  try {
    const plans = await getWorkoutPlans();
    return plans.find(p => p.id === planId) || null;
  } catch (error) {
    console.error('Error getting workout plan:', error);
    return null;
  }
};

/**
 * Check if weekly summary should be shown
 * Shows on Sundays if not shown in the last 7 days
 * @returns {boolean} True if weekly summary should be shown
 */
export const shouldShowWeeklySummary = () => {
  try {
    const WEEKLY_SUMMARY_KEY = 'goodlift_last_weekly_summary';
    const lastShown = localStorage.getItem(WEEKLY_SUMMARY_KEY);
    const now = new Date();
    
    // Only show on Sundays
    if (now.getDay() !== 0) {
      return false;
    }
    
    if (!lastShown) {
      return true;
    }
    
    const lastShownDate = new Date(lastShown);
    const daysSince = Math.floor((now - lastShownDate) / (1000 * 60 * 60 * 24));
    
    return daysSince >= 7;
  } catch (error) {
    console.error('Error checking weekly summary:', error);
    return false;
  }
};

/**
 * Mark weekly summary as shown
 */
export const markWeeklySummaryShown = () => {
  try {
    const WEEKLY_SUMMARY_KEY = 'goodlift_last_weekly_summary';
    localStorage.setItem(WEEKLY_SUMMARY_KEY, new Date().toISOString());
  } catch (error) {
    console.error('Error marking weekly summary:', error);
  }
};

/**
 * Get unlocked achievement IDs
 * @returns {Promise<Array>} Array of unlocked achievement IDs
 */
export const getUnlockedAchievements = async () => {
  try {
    if (isGuestMode()) {
      const guestData = getGuestData('unlocked_achievements');
      return guestData || [];
    }

    const stored = localStorage.getItem(KEYS.UNLOCKED_ACHIEVEMENTS);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error reading unlocked achievements:', error);
    return [];
  }
};

/**
 * Save unlocked achievement IDs
 * @param {Array} achievementIds - Array of achievement IDs
 */
export const saveUnlockedAchievements = async (achievementIds) => {
  try {
    if (isGuestMode()) {
      setGuestData('unlocked_achievements', achievementIds);
    } else {
      localStorage.setItem(KEYS.UNLOCKED_ACHIEVEMENTS, JSON.stringify(achievementIds));
    }
  } catch (error) {
    console.error('Error saving unlocked achievements:', error);
  }
};

/**
 * Add a newly unlocked achievement
 * @param {string} achievementId - Achievement ID to add
 */
export const addUnlockedAchievement = async (achievementId) => {
  try {
    const unlocked = await getUnlockedAchievements();
    if (!unlocked.includes(achievementId)) {
      unlocked.push(achievementId);
      await saveUnlockedAchievements(unlocked);
    }
  } catch (error) {
    console.error('Error adding unlocked achievement:', error);
  }
};

/**
 * Get total PRs count
 * @returns {Promise<number>} Total number of PRs achieved
 */
export const getTotalPRs = async () => {
  try {
    if (isGuestMode()) {
      const guestData = getGuestData('total_prs');
      return guestData || 0;
    }

    const stored = localStorage.getItem(KEYS.TOTAL_PRS);
    return stored ? parseInt(stored, 10) : 0;
  } catch (error) {
    console.error('Error reading total PRs:', error);
    return 0;
  }
};

/**
 * Increment total PRs count
 */
export const incrementTotalPRs = async () => {
  try {
    const current = await getTotalPRs();
    const newTotal = current + 1;
    
    if (isGuestMode()) {
      setGuestData('total_prs', newTotal);
    } else {
      localStorage.setItem(KEYS.TOTAL_PRS, newTotal.toString());
    }
    
    return newTotal;
  } catch (error) {
    console.error('Error incrementing total PRs:', error);
  }
};

/**
 * Get total volume lifted (all-time)
 * @returns {Promise<number>} Total volume in lbs
 */
export const getTotalVolume = async () => {
  try {
    if (isGuestMode()) {
      const guestData = getGuestData('total_volume');
      return guestData || 0;
    }

    const stored = localStorage.getItem(KEYS.TOTAL_VOLUME);
    return stored ? parseFloat(stored) : 0;
  } catch (error) {
    console.error('Error reading total volume:', error);
    return 0;
  }
};

/**
 * Update total volume lifted
 * @param {number} volume - Volume to add
 */
export const addToTotalVolume = async (volume) => {
  try {
    const current = await getTotalVolume();
    const newTotal = current + volume;
    
    if (isGuestMode()) {
      setGuestData('total_volume', newTotal);
    } else {
      localStorage.setItem(KEYS.TOTAL_VOLUME, newTotal.toString());
    }
    
    return newTotal;
  } catch (error) {
    console.error('Error adding to total volume:', error);
  }
};

/**
 * Reset the current workout streak to 0
 * Preserves longestStreak for achievements
 * Used when user skips or defers a workout
 */
export const resetCurrentStreak = async () => {
  try {
    const stats = await getUserStats();
    
    // Reset current streak but preserve longest streak
    const updatedStats = {
      ...stats,
      currentStreak: 0,
    };
    
    // Save the updated stats
    if (isGuestMode()) {
      setGuestData('user_stats', updatedStats);
    } else {
      localStorage.setItem(KEYS.USER_STATS, JSON.stringify(updatedStats));
      if (currentUserId) {
        await saveUserStatsToFirebase(currentUserId, updatedStats);
      }
    }
    
    return updatedStats;
  } catch (error) {
    console.error('Error resetting current streak:', error);
    throw error;
  }
};

/**
 * Get saved yoga presets
 * @returns {Array} Array of yoga preset objects
 */
/**
 * Get saved Yoga presets
 * @returns {Promise<Array>} Array of Yoga preset objects
 */
export const getYogaPresets = async () => {
  try {
    // Check if in guest mode first
    if (isGuestMode()) {
      return getGuestData('yoga_presets') || [];
    }

    // Try Firebase first if user is authenticated
    if (currentUserId) {
      try {
        const firebaseData = await loadUserDataFromFirebase(currentUserId);
        if (firebaseData?.yogaPresets) {
          // Update localStorage cache for offline access
          localStorage.setItem(KEYS.YOGA_PRESETS, JSON.stringify(firebaseData.yogaPresets));
          return firebaseData.yogaPresets;
        }
      } catch (error) {
        console.error('Firebase fetch failed for yoga presets, using localStorage:', error);
      }
    }

    // Fallback to localStorage
    const presets = localStorage.getItem(KEYS.YOGA_PRESETS);
    return presets ? JSON.parse(presets) : [];
  } catch (error) {
    console.error('Error reading yoga presets:', error);
    return [];
  }
};

/**
 * Save a yoga preset
 * @param {Object} preset - Yoga preset data including name, poses, and durations
 */
export const saveYogaPreset = async (preset) => {
  try {
    if (!preset || !preset.name) {
      throw new Error('Preset must have a name');
    }
    
    const presets = await getYogaPresets();
    const existingIndex = presets.findIndex(p => p.id === preset.id);
    
    if (existingIndex >= 0) {
      // Update existing preset
      presets[existingIndex] = { ...preset, updatedAt: Date.now() };
    } else {
      // Add new preset with timestamp and ID
      presets.push({
        ...preset,
        id: preset.id || `yoga_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    }
    
    // Save based on mode
    if (isGuestMode()) {
      setGuestData('yoga_presets', presets);
    } else {
      localStorage.setItem(KEYS.YOGA_PRESETS, JSON.stringify(presets));
      
      // Sync to Firebase if user is logged in
      if (currentUserId) {
        await saveYogaPresetsToFirebase(currentUserId, presets);
      }
    }
    
    return presets;
  } catch (error) {
    console.error('Error saving yoga preset:', error);
    throw error;
  }
};

/**
 * Delete a yoga preset
 * @param {string} presetId - ID of the preset to delete
 */
export const deleteYogaPreset = async (presetId) => {
  try {
    const presets = await getYogaPresets();
    const filteredPresets = presets.filter(p => p.id !== presetId);
    
    if (isGuestMode()) {
      setGuestData('yoga_presets', filteredPresets);
    } else {
      localStorage.setItem(KEYS.YOGA_PRESETS, JSON.stringify(filteredPresets));
      
      // Sync to Firebase if user is logged in
      if (currentUserId) {
        await saveYogaPresetsToFirebase(currentUserId, filteredPresets);
      }
    }
    
    return filteredPresets;
  } catch (error) {
    console.error('Error deleting yoga preset:', error);
    throw error;
  }
};

/**
 * Get saved HIIT presets
 * @returns {Promise<Array>} Array of HIIT preset objects
 */
export const getHiitPresets = async () => {
  try {
    // Check if in guest mode first
    if (isGuestMode()) {
      return getGuestData('hiit_presets') || [];
    }

    // Try Firebase first if user is authenticated
    if (currentUserId) {
      try {
        const firebaseData = await loadUserDataFromFirebase(currentUserId);
        if (firebaseData?.hiitPresets) {
          // Update localStorage cache for offline access
          localStorage.setItem(KEYS.HIIT_PRESETS, JSON.stringify(firebaseData.hiitPresets));
          return firebaseData.hiitPresets;
        }
      } catch (error) {
        console.error('Firebase fetch failed for HIIT presets, using localStorage:', error);
      }
    }

    // Fallback to localStorage
    const presets = localStorage.getItem(KEYS.HIIT_PRESETS);
    return presets ? JSON.parse(presets) : [];
  } catch (error) {
    console.error('Error reading HIIT presets:', error);
    return [];
  }
};

/**
 * Save a HIIT preset
 * @param {Object} preset - HIIT preset data including name, intervals, and configuration
 */
export const saveHiitPreset = async (preset) => {
  try {
    if (!preset || !preset.name) {
      throw new Error('Preset must have a name');
    }
    
    const presets = await getHiitPresets();
    const existingIndex = presets.findIndex(p => p.id === preset.id);
    
    if (existingIndex >= 0) {
      // Update existing preset
      presets[existingIndex] = { ...preset, updatedAt: Date.now() };
    } else {
      // Add new preset with timestamp and ID
      presets.push({
        ...preset,
        id: preset.id || `hiit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    }
    
    // Save based on mode
    if (isGuestMode()) {
      setGuestData('hiit_presets', presets);
    } else {
      localStorage.setItem(KEYS.HIIT_PRESETS, JSON.stringify(presets));
      
      // Sync to Firebase if user is logged in
      if (currentUserId) {
        await saveHiitPresetsToFirebase(currentUserId, presets);
      }
    }
    
    return presets;
  } catch (error) {
    console.error('Error saving HIIT preset:', error);
    throw error;
  }
};

/**
 * Delete a HIIT preset
 * @param {string} presetId - ID of the preset to delete
 */
export const deleteHiitPreset = async (presetId) => {
  try {
    const presets = await getHiitPresets();
    const filteredPresets = presets.filter(p => p.id !== presetId);
    
    if (isGuestMode()) {
      setGuestData('hiit_presets', filteredPresets);
    } else {
      localStorage.setItem(KEYS.HIIT_PRESETS, JSON.stringify(filteredPresets));
      
      // Sync to Firebase if user is logged in
      if (currentUserId) {
        await saveHiitPresetsToFirebase(currentUserId, filteredPresets);
      }
    }
    
    return filteredPresets;
  } catch (error) {
    console.error('Error deleting HIIT preset:', error);
    throw error;
  }
};

/**
 * Get saved workouts from localStorage
 * @returns {Promise<Array>} Array of saved workout objects
 */
export const getSavedWorkouts = async () => {
  try {
    if (isGuestMode()) {
      const guestData = getGuestData('saved_workouts');
      return guestData || [];
    }

    const workouts = localStorage.getItem(KEYS.SAVED_WORKOUTS);
    return workouts ? JSON.parse(workouts) : [];
  } catch (error) {
    console.error('Error reading saved workouts:', error);
    return [];
  }
};

/**
 * Save a new workout template
 * @param {Object} workout - Workout object with exercises and configuration
 * @returns {Promise<Array>} Updated list of saved workouts
 */
export const saveSavedWorkout = async (workout) => {
  try {
    const workouts = await getSavedWorkouts();
    const newWorkout = {
      ...workout,
      id: Date.now(),
      createdAt: new Date().toISOString(),
    };
    
    workouts.push(newWorkout);
    
    if (isGuestMode()) {
      setGuestData('saved_workouts', workouts);
    } else {
      localStorage.setItem(KEYS.SAVED_WORKOUTS, JSON.stringify(workouts));
      // TODO: Add Firebase sync when implemented
    }
    
    return workouts;
  } catch (error) {
    console.error('Error saving workout:', error);
    throw error;
  }
};

/**
 * Delete a saved workout by index
 * @param {number} index - Index of the workout to delete
 * @returns {Promise<Array>} Updated list of saved workouts
 */
export const deleteSavedWorkout = async (index) => {
  try {
    const workouts = await getSavedWorkouts();
    workouts.splice(index, 1);
    
    if (isGuestMode()) {
      setGuestData('saved_workouts', workouts);
    } else {
      localStorage.setItem(KEYS.SAVED_WORKOUTS, JSON.stringify(workouts));
      // TODO: Add Firebase sync when implemented
    }
    
    return workouts;
  } catch (error) {
    console.error('Error deleting saved workout:', error);
    throw error;
  }
};
