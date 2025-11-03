import {
  saveWorkoutHistoryToFirebase,
  saveUserStatsToFirebase,
  saveExerciseWeightsToFirebase,
  loadUserDataFromFirebase
} from './firebaseStorage';

// Storage keys
const KEYS = {
  WORKOUT_HISTORY: 'goodlift_workout_history',
  USER_STATS: 'goodlift_user_stats',
  EXERCISE_WEIGHTS: 'goodlift_exercise_weights',
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
    const history = getWorkoutHistory();
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
    return stats ? JSON.parse(stats) : { totalWorkouts: 0, totalTime: 0 };
  } catch (error) {
    console.error('Error reading user stats:', error);
    return { totalWorkouts: 0, totalTime: 0 };
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
      
      console.log('User data synced from Firebase to localStorage');
    } else {
      // No data in Firebase, sync current localStorage data to Firebase
      const localHistory = await getWorkoutHistory();
      const localStats = await getUserStats();
      const localWeights = localStorage.getItem(KEYS.EXERCISE_WEIGHTS);
      const weightsObj = localWeights ? JSON.parse(localWeights) : {};
      
      if (localHistory.length > 0 || (localStats && localStats.totalWorkouts > 0) || Object.keys(weightsObj).length > 0) {
        console.log('Syncing local data to Firebase for new user');
        await saveWorkoutHistoryToFirebase(userId, localHistory);
        await saveUserStatsToFirebase(userId, localStats);
        await saveExerciseWeightsToFirebase(userId, weightsObj);
      }
    }
  } catch (error) {
    console.error('Error loading user data from cloud:', error);
    // On error, we'll continue using local data
  }
};
