import {
  saveWorkoutHistoryToFirebase,
  saveUserStatsToFirebase,
  saveExerciseWeightsToFirebase,
  saveExerciseTargetRepsToFirebase,
  loadUserDataFromFirebase
} from './firebaseStorage';

// Storage keys
const KEYS = {
  WORKOUT_HISTORY: 'goodlift_workout_history',
  USER_STATS: 'goodlift_user_stats',
  EXERCISE_WEIGHTS: 'goodlift_exercise_weights',
  EXERCISE_TARGET_REPS: 'goodlift_exercise_target_reps',
  HIIT_SESSIONS: 'goodlift_hiit_sessions',
};

// Store the current user ID for Firebase sync
let currentUserId = null;

// Set the current user ID (called when user logs in)
export const setCurrentUserId = (userId) => {
  currentUserId = userId;
};

// Get the current user ID
export const getCurrentUserId = () => {
  return currentUserId;
};

// Get workout history
export const getWorkoutHistory = async () => {
  try {
    // If user is logged in, try to get data from Firebase first
    if (currentUserId) {
      try {
        const firebaseData = await loadUserDataFromFirebase(currentUserId);
        if (firebaseData && firebaseData.workoutHistory) {
          // Update localStorage cache
          localStorage.setItem(KEYS.WORKOUT_HISTORY, JSON.stringify(firebaseData.workoutHistory));
          return firebaseData.workoutHistory;
        }
      } catch (error) {
        console.error('Error loading workout history from Firebase, falling back to localStorage:', error);
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

// Save a workout
export const saveWorkout = async (workoutData) => {
  try {
    const history = await getWorkoutHistory();
    history.unshift(workoutData); // Add to beginning
    localStorage.setItem(KEYS.WORKOUT_HISTORY, JSON.stringify(history));
    
    // Sync to Firebase if user is logged in
    if (currentUserId) {
      await saveWorkoutHistoryToFirebase(currentUserId, history);
    }
  } catch (error) {
    console.error('Error saving workout:', error);
  }
};

// Delete a workout
export const deleteWorkout = async (workoutIndex) => {
  try {
    const history = await getWorkoutHistory();
    if (workoutIndex >= 0 && workoutIndex < history.length) {
      const deletedWorkout = history[workoutIndex];
      history.splice(workoutIndex, 1);
      localStorage.setItem(KEYS.WORKOUT_HISTORY, JSON.stringify(history));
      
      // Update stats to reflect deletion
      const stats = await getUserStats();
      if (stats.totalWorkouts > 0) {
        stats.totalWorkouts -= 1;
        // Ensure duration is properly accounted for
        const duration = deletedWorkout.duration || 0;
        stats.totalTime = Math.max(0, stats.totalTime - duration);
        await saveUserStats(stats);
      }
      
      // Sync to Firebase if user is logged in
      if (currentUserId) {
        await saveWorkoutHistoryToFirebase(currentUserId, history);
      }
    }
  } catch (error) {
    console.error('Error deleting workout:', error);
  }
};

// Get user stats
export const getUserStats = async () => {
  try {
    // If user is logged in, try to get data from Firebase first
    if (currentUserId) {
      try {
        const firebaseData = await loadUserDataFromFirebase(currentUserId);
        if (firebaseData && firebaseData.userStats) {
          // Update localStorage cache
          localStorage.setItem(KEYS.USER_STATS, JSON.stringify(firebaseData.userStats));
          return firebaseData.userStats;
        }
      } catch (error) {
        console.error('Error loading user stats from Firebase, falling back to localStorage:', error);
      }
    }
    
    // Fallback to localStorage
    const stats = localStorage.getItem(KEYS.USER_STATS);
    return stats ? JSON.parse(stats) : { totalWorkouts: 0, totalTime: 0, totalHiitTime: 0 };
  } catch (error) {
    console.error('Error reading user stats:', error);
    return { totalWorkouts: 0, totalTime: 0, totalHiitTime: 0 };
  }
};

// Save user stats
export const saveUserStats = async (stats) => {
  try {
    localStorage.setItem(KEYS.USER_STATS, JSON.stringify(stats));
    
    // Sync to Firebase if user is logged in
    if (currentUserId) {
      await saveUserStatsToFirebase(currentUserId, stats);
    }
  } catch (error) {
    console.error('Error saving user stats:', error);
  }
};

// Get exercise weight (last recorded weight for an exercise)
export const getExerciseWeight = async (exerciseName) => {
  try {
    // If user is logged in, try to get data from Firebase first
    if (currentUserId) {
      try {
        const firebaseData = await loadUserDataFromFirebase(currentUserId);
        if (firebaseData && firebaseData.exerciseWeights) {
          // Update localStorage cache
          localStorage.setItem(KEYS.EXERCISE_WEIGHTS, JSON.stringify(firebaseData.exerciseWeights));
          return firebaseData.exerciseWeights[exerciseName] || 0;
        }
      } catch (error) {
        console.error('Error loading exercise weights from Firebase, falling back to localStorage:', error);
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

// Set exercise weight
export const setExerciseWeight = async (exerciseName, weight) => {
  try {
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
  }
};

// Get exercise target reps
export const getExerciseTargetReps = async (exerciseName) => {
  try {
    // If user is logged in, try to get data from Firebase first
    if (currentUserId) {
      try {
        const firebaseData = await loadUserDataFromFirebase(currentUserId);
        if (firebaseData && firebaseData.exerciseTargetReps) {
          // Update localStorage cache
          localStorage.setItem(KEYS.EXERCISE_TARGET_REPS, JSON.stringify(firebaseData.exerciseTargetReps));
          return firebaseData.exerciseTargetReps[exerciseName] || 12;
        }
      } catch (error) {
        console.error('Error loading exercise target reps from Firebase, falling back to localStorage:', error);
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

// Set exercise target reps
export const setExerciseTargetReps = async (exerciseName, reps) => {
  try {
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
  }
};

/**
 * Load user data from Firebase and sync to localStorage
 * This should be called when a user logs in
 * @param {string} userId - The authenticated user's UID
 */
export const loadUserDataFromCloud = async (userId) => {
  if (!userId) {
    console.error('Cannot load data: No user ID provided');
    return;
  }

  try {
    // Set the current user ID
    setCurrentUserId(userId);
    
    // Load data from Firebase
    const firebaseData = await loadUserDataFromFirebase(userId);
    
    if (firebaseData) {
      // Sync workout history
      if (firebaseData.workoutHistory) {
        localStorage.setItem(KEYS.WORKOUT_HISTORY, JSON.stringify(firebaseData.workoutHistory));
      }
      
      // Sync user stats
      if (firebaseData.userStats) {
        localStorage.setItem(KEYS.USER_STATS, JSON.stringify(firebaseData.userStats));
      }
      
      // Sync exercise weights
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
      
      if (localHistory.length > 0 || (localStats && localStats.totalWorkouts > 0) || Object.keys(weightsObj).length > 0 || Object.keys(targetRepsObj).length > 0) {
        console.log('Syncing local data to Firebase for new user');
        await saveWorkoutHistoryToFirebase(userId, localHistory);
        await saveUserStatsToFirebase(userId, localStats);
        await saveExerciseWeightsToFirebase(userId, weightsObj);
        await saveExerciseTargetRepsToFirebase(userId, targetRepsObj);
      }
    }
  } catch (error) {
    console.error('Error loading user data from cloud:', error);
    // On error, we'll continue using local data
  }
};

// Get HIIT sessions history
export const getHiitSessions = () => {
  try {
    const sessions = localStorage.getItem(KEYS.HIIT_SESSIONS);
    return sessions ? JSON.parse(sessions) : [];
  } catch (error) {
    console.error('Error reading HIIT sessions:', error);
    return [];
  }
};

// Save a HIIT session
export const saveHiitSession = async (sessionData) => {
  try {
    const sessions = getHiitSessions();
    sessions.unshift(sessionData); // Add to beginning
    localStorage.setItem(KEYS.HIIT_SESSIONS, JSON.stringify(sessions));
    
    // Update total HIIT time in stats
    const stats = await getUserStats();
    stats.totalHiitTime = (stats.totalHiitTime || 0) + sessionData.duration;
    await saveUserStats(stats);
  } catch (error) {
    console.error('Error saving HIIT session:', error);
  }
};
