import {
  saveWorkoutHistoryToFirebase,
  saveUserStatsToFirebase,
  saveExerciseWeightsToFirebase,
  saveExerciseTargetRepsToFirebase,
  saveHiitSessionsToFirebase,
  saveCardioSessionsToFirebase,
  saveStretchSessionsToFirebase,
  saveYogaSessionsToFirebase,
  saveWorkoutPlansToFirebase,
  saveActivePlanToFirebase,
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
  YOGA_SESSIONS: 'goodlift_yoga_sessions',
  CARDIO_SESSIONS: 'goodlift_cardio_sessions',
  FAVORITE_WORKOUTS: 'goodlift_favorite_workouts',
  FAVORITE_EXERCISES: 'goodlift_favorite_exercises',
  PINNED_EXERCISES: 'goodlift_pinned_exercises',
  WORKOUT_PLANS: 'goodlift_workout_plans',
  ACTIVE_PLAN: 'goodlift_active_plan',
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
    
    const yogaSessions = getYogaSessions();
    const totalYogaTime = yogaSessions.reduce((sum, session) => sum + (session.duration || 0), 0);
    
    const calculatedStats = { 
      totalWorkouts, 
      totalTime, 
      totalHiitTime,
      totalCardioTime,
      totalStretchTime,
      totalYogaTime
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
      totalYogaTime: 0
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
      
      if (firebaseData.yogaSessions) {
        localStorage.setItem(KEYS.YOGA_SESSIONS, JSON.stringify(firebaseData.yogaSessions));
      }
      
      // Sync workout plans
      if (firebaseData.workoutPlans) {
        localStorage.setItem(KEYS.WORKOUT_PLANS, JSON.stringify(firebaseData.workoutPlans));
      }
      
      // Sync active plan ID
      if (firebaseData.activePlanId) {
        localStorage.setItem(KEYS.ACTIVE_PLAN, firebaseData.activePlanId);
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
      const localHiit = getHiitSessions();
      const localCardio = getCardioSessions();
      const localStretch = getStretchSessions();
      const localYoga = getYogaSessions();
      const localPlans = localStorage.getItem(KEYS.WORKOUT_PLANS);
      const plansArray = localPlans ? JSON.parse(localPlans) : [];
      const localActivePlanId = localStorage.getItem(KEYS.ACTIVE_PLAN);
      
      // If user has local data, sync it to Firebase
      if (localHistory.length > 0 || localStats?.totalWorkouts > 0 || 
          Object.keys(weightsObj).length > 0 || Object.keys(targetRepsObj).length > 0 ||
          localHiit.length > 0 || localCardio.length > 0 || 
          localStretch.length > 0 || localYoga.length > 0 ||
          plansArray.length > 0 || localActivePlanId) {
        console.log('Syncing local data to Firebase for new user');
        await Promise.all([
          saveWorkoutHistoryToFirebase(userId, localHistory),
          saveUserStatsToFirebase(userId, localStats),
          saveExerciseWeightsToFirebase(userId, weightsObj),
          saveExerciseTargetRepsToFirebase(userId, targetRepsObj),
          saveHiitSessionsToFirebase(userId, localHiit),
          saveCardioSessionsToFirebase(userId, localCardio),
          saveStretchSessionsToFirebase(userId, localStretch),
          saveYogaSessionsToFirebase(userId, localYoga),
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
 * Get favorite workouts from localStorage
 * @returns {Array} Array of favorite workout objects
 */
export const getFavoriteWorkouts = () => {
  try {
    if (isGuestMode()) {
      return getGuestData('favorite_workouts') || [];
    }
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
    
    // Save based on mode
    if (isGuestMode()) {
      setGuestData('favorite_workouts', favorites);
    } else {
      localStorage.setItem(KEYS.FAVORITE_WORKOUTS, JSON.stringify(favorites));
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
export const deleteFavoriteWorkout = (workoutId) => {
  try {
    const favorites = getFavoriteWorkouts();
    const filteredFavorites = favorites.filter(fav => fav.id !== workoutId);
    
    // Save based on mode
    if (isGuestMode()) {
      setGuestData('favorite_workouts', filteredFavorites);
    } else {
      localStorage.setItem(KEYS.FAVORITE_WORKOUTS, JSON.stringify(filteredFavorites));
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
export const updateFavoriteWorkoutName = (workoutId, newName) => {
  try {
    if (!workoutId || !newName) {
      throw new Error('Workout ID and new name are required');
    }
    
    const favorites = getFavoriteWorkouts();
    const updatedFavorites = favorites.map(fav => 
      fav.id === workoutId ? { ...fav, name: newName } : fav
    );
    
    // Save based on mode
    if (isGuestMode()) {
      setGuestData('favorite_workouts', updatedFavorites);
    } else {
      localStorage.setItem(KEYS.FAVORITE_WORKOUTS, JSON.stringify(updatedFavorites));
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
 * Get yoga sessions from localStorage
 * @returns {Array} Array of yoga session objects
 */
export const getYogaSessions = () => {
  try {
    if (isGuestMode()) {
      return getGuestData('yoga_sessions') || [];
    }
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
    
    // Save based on mode
    if (isGuestMode()) {
      setGuestData('yoga_sessions', sessions);
    } else {
      localStorage.setItem(KEYS.YOGA_SESSIONS, JSON.stringify(sessions));
      
      // Sync to Firebase if user is logged in
      if (currentUserId) {
        await saveYogaSessionsToFirebase(currentUserId, sessions);
      }
    }
    
    // Stats will be recalculated automatically next time getUserStats() is called
  } catch (error) {
    console.error('Error saving yoga session:', error);
    throw error;
  }
};

/**
 * Update a yoga session
 * @param {string} sessionId - ID of the session to update
 * @param {Object} updatedData - Updated session data
 */
export const updateYogaSession = async (sessionId, updatedData) => {
  try {
    const sessions = getYogaSessions();
    const sessionIndex = sessions.findIndex(s => s.id === sessionId);
    
    if (sessionIndex === -1) {
      throw new Error('Session not found');
    }
    
    // Update the session
    sessions[sessionIndex] = { ...sessions[sessionIndex], ...updatedData };
    
    // Save based on mode
    if (isGuestMode()) {
      setGuestData('yoga_sessions', sessions);
    } else {
      localStorage.setItem(KEYS.YOGA_SESSIONS, JSON.stringify(sessions));
      
      // Sync to Firebase if user is logged in
      if (currentUserId) {
        await saveYogaSessionsToFirebase(currentUserId, sessions);
      }
    }
  } catch (error) {
    console.error('Error updating yoga session:', error);
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
    
    // Save based on mode
    if (isGuestMode()) {
      setGuestData('yoga_sessions', filteredSessions);
    } else {
      localStorage.setItem(KEYS.YOGA_SESSIONS, JSON.stringify(filteredSessions));
      
      // Sync to Firebase if user is logged in
      if (currentUserId) {
        await saveYogaSessionsToFirebase(currentUserId, filteredSessions);
      }
    }
    
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
 * Add an exercise to pinned exercises
 * @param {string} exerciseName - Name of the exercise
 * @param {string} trackingMode - 'weight' or 'reps'
 * @returns {boolean} True if added, false if already at limit
 */
export const addPinnedExercise = (exerciseName, trackingMode = 'weight') => {
  try {
    const pinned = getPinnedExercises();
    
    // Check if already pinned
    if (pinned.some(p => p.exerciseName === exerciseName)) {
      return false;
    }
    
    // Check if at limit
    if (pinned.length >= 10) {
      return false;
    }
    
    pinned.push({ exerciseName, trackingMode });
    setPinnedExercises(pinned);
    return true;
  } catch (error) {
    console.error('Error adding pinned exercise:', error);
    return false;
  }
};

/**
 * Remove an exercise from pinned exercises
 * @param {string} exerciseName - Name of the exercise
 */
export const removePinnedExercise = (exerciseName) => {
  try {
    const pinned = getPinnedExercises();
    const filtered = pinned.filter(p => p.exerciseName !== exerciseName);
    setPinnedExercises(filtered);
  } catch (error) {
    console.error('Error removing pinned exercise:', error);
    throw error;
  }
};

/**
 * Update tracking mode for a pinned exercise
 * @param {string} exerciseName - Name of the exercise
 * @param {string} trackingMode - 'weight' or 'reps'
 */
export const updatePinnedExerciseMode = (exerciseName, trackingMode) => {
  try {
    const pinned = getPinnedExercises();
    const updated = pinned.map(p => 
      p.exerciseName === exerciseName 
        ? { ...p, trackingMode } 
        : p
    );
    setPinnedExercises(updated);
  } catch (error) {
    console.error('Error updating pinned exercise mode:', error);
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
    console.log('getWorkoutPlans called, guest mode:', isGuestMode(), 'userId:', currentUserId);
    
    // Check if in guest mode first
    if (isGuestMode()) {
      const guestData = getGuestData('workout_plans');
      console.log('Guest mode - plans:', guestData?.length || 0);
      return guestData || [];
    }

    // Try Firebase first if user is authenticated
    if (currentUserId) {
      try {
        const firebaseData = await loadUserDataFromFirebase(currentUserId);
        console.log('Firebase data loaded, has workoutPlans:', !!firebaseData?.workoutPlans, 'count:', firebaseData?.workoutPlans?.length || 0);
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
    const parsedPlans = plans ? JSON.parse(plans) : [];
    console.log('localStorage fallback - plans:', parsedPlans.length);
    return parsedPlans;
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
    console.log('saveWorkoutPlan called for plan:', plan.id, plan.name);
    const plans = await getWorkoutPlans();
    console.log('Current plans before save:', plans.length);
    const existingIndex = plans.findIndex(p => p.id === plan.id);
    
    if (existingIndex >= 0) {
      console.log('Updating existing plan at index:', existingIndex);
      plans[existingIndex] = plan;
    } else {
      console.log('Adding new plan');
      plans.push(plan);
    }
    console.log('Total plans after update:', plans.length);

    // Save based on mode
    if (isGuestMode()) {
      console.log('Saving to guest storage');
      setGuestData('workout_plans', plans);
    } else {
      console.log('Saving to localStorage');
      localStorage.setItem(KEYS.WORKOUT_PLANS, JSON.stringify(plans));
      console.log('localStorage updated, plans count:', plans.length);
      
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
 * @param {string|null} planId - Plan ID to set as active, or null to clear
 * @returns {Promise<void>}
 */
export const setActivePlan = async (planId) => {
  try {
    if (isGuestMode()) {
      if (planId) {
        const plans = await getWorkoutPlans();
        const plan = plans.find(p => p.id === planId);
        setGuestData('active_plan', plan);
      } else {
        setGuestData('active_plan', null);
      }
    } else {
      if (planId) {
        localStorage.setItem(KEYS.ACTIVE_PLAN, planId);
        
        // Sync to Firebase if user is logged in
        if (currentUserId) {
          await saveActivePlanToFirebase(currentUserId, planId);
        }
      } else {
        localStorage.removeItem(KEYS.ACTIVE_PLAN);
        
        // Sync to Firebase if user is logged in
        if (currentUserId) {
          await saveActivePlanToFirebase(currentUserId, null);
        }
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
