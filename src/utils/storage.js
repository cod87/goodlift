// Storage keys
const KEYS = {
  WORKOUT_HISTORY: 'goodlift_workout_history',
  USER_STATS: 'goodlift_user_stats',
  EXERCISE_WEIGHTS: 'goodlift_exercise_weights',
};

// Get workout history
export const getWorkoutHistory = () => {
  try {
    const history = localStorage.getItem(KEYS.WORKOUT_HISTORY);
    return history ? JSON.parse(history) : [];
  } catch (error) {
    console.error('Error reading workout history:', error);
    return [];
  }
};

// Save a workout
export const saveWorkout = (workoutData) => {
  try {
    const history = getWorkoutHistory();
    history.unshift(workoutData); // Add to beginning
    localStorage.setItem(KEYS.WORKOUT_HISTORY, JSON.stringify(history));
  } catch (error) {
    console.error('Error saving workout:', error);
  }
};

// Get user stats
export const getUserStats = () => {
  try {
    const stats = localStorage.getItem(KEYS.USER_STATS);
    return stats ? JSON.parse(stats) : { totalWorkouts: 0, totalTime: 0 };
  } catch (error) {
    console.error('Error reading user stats:', error);
    return { totalWorkouts: 0, totalTime: 0 };
  }
};

// Save user stats
export const saveUserStats = (stats) => {
  try {
    localStorage.setItem(KEYS.USER_STATS, JSON.stringify(stats));
  } catch (error) {
    console.error('Error saving user stats:', error);
  }
};

// Get exercise weight (last recorded weight for an exercise)
export const getExerciseWeight = (exerciseName) => {
  try {
    const weights = localStorage.getItem(KEYS.EXERCISE_WEIGHTS);
    const weightsObj = weights ? JSON.parse(weights) : {};
    return weightsObj[exerciseName] || 0;
  } catch (error) {
    console.error('Error reading exercise weight:', error);
    return 0;
  }
};

// Set exercise weight
export const setExerciseWeight = (exerciseName, weight) => {
  try {
    const weights = localStorage.getItem(KEYS.EXERCISE_WEIGHTS);
    const weightsObj = weights ? JSON.parse(weights) : {};
    weightsObj[exerciseName] = weight;
    localStorage.setItem(KEYS.EXERCISE_WEIGHTS, JSON.stringify(weightsObj));
  } catch (error) {
    console.error('Error saving exercise weight:', error);
  }
};
