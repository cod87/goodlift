/**
 * Helper functions for extracting and analyzing exercise progression data
 */

/**
 * Extract progression data for a specific exercise from workout history
 * @param {Array} workoutHistory - Array of workout objects
 * @param {string} exerciseName - Name of the exercise to track
 * @param {string} mode - 'weight' or 'reps'
 * @returns {Array} Array of data points with date and value
 */
export const getExerciseProgression = (workoutHistory, exerciseName, mode = 'weight') => {
  if (!workoutHistory || !Array.isArray(workoutHistory)) {
    return [];
  }

  const progressionData = [];

  // Iterate through workout history in reverse (oldest to newest)
  const sortedHistory = [...workoutHistory].reverse();

  sortedHistory.forEach((workout) => {
    if (!workout.exercises || !workout.exercises[exerciseName]) {
      return;
    }

    const exerciseData = workout.exercises[exerciseName];
    const sets = exerciseData.sets || [];

    if (sets.length === 0) {
      return;
    }

    // Calculate the metric based on mode
    let value;
    if (mode === 'weight') {
      // Use the maximum weight lifted in this workout
      value = Math.max(...sets.map(set => set.weight || 0));
    } else if (mode === 'reps') {
      // Use the maximum reps achieved in this workout
      value = Math.max(...sets.map(set => set.reps || 0));
    }

    if (value > 0) {
      progressionData.push({
        date: new Date(workout.date),
        value,
        workout,
      });
    }
  });

  return progressionData;
};

/**
 * Get all exercises that have been performed in workout history
 * @param {Array} workoutHistory - Array of workout objects
 * @returns {Array} Array of unique exercise names
 */
export const getUniqueExercises = (workoutHistory) => {
  if (!workoutHistory || !Array.isArray(workoutHistory)) {
    return [];
  }

  const exerciseSet = new Set();

  workoutHistory.forEach((workout) => {
    if (workout.exercises) {
      Object.keys(workout.exercises).forEach((exerciseName) => {
        exerciseSet.add(exerciseName);
      });
    }
  });

  return Array.from(exerciseSet).sort();
};

/**
 * Format progression data for Chart.js
 * @param {Array} progressionData - Array from getExerciseProgression
 * @param {string} label - Label for the dataset
 * @param {string} mode - 'weight' or 'reps' to determine Y-axis scaling
 * @returns {Object} Chart.js compatible data object
 */
export const formatProgressionForChart = (progressionData, label, mode = 'weight') => {
  if (!progressionData || progressionData.length === 0) {
    return {
      labels: [],
      datasets: [{
        label,
        data: [],
        fill: true,
        backgroundColor: 'rgba(19, 70, 134, 0.2)',
        borderColor: 'rgb(19, 70, 134)',
        tension: 0.4,
        pointBackgroundColor: 'rgb(19, 70, 134)',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
      }],
      minValue: 0,
    };
  }

  // Limit to last 10 data points
  const limitedData = progressionData.slice(-10);

  // Use session numbers for X-axis labels (Session 1, Session 2, etc.)
  const labels = limitedData.map((_, index) => `Session ${index + 1}`);

  const data = limitedData.map(point => point.value);

  // Calculate minimum value for Y-axis scaling
  let minValue = 0;
  if (mode === 'weight' && data.length > 0) {
    const minWeight = Math.min(...data);
    minValue = Math.max(0, minWeight - 5); // 5lbs below minimum, but not below 0
  }

  return {
    labels,
    datasets: [{
      label,
      data,
      fill: true,
      backgroundColor: 'rgba(19, 70, 134, 0.2)',
      borderColor: 'rgb(19, 70, 134)',
      tension: 0.4,
      pointBackgroundColor: 'rgb(19, 70, 134)',
      pointBorderColor: '#fff',
      pointBorderWidth: 2,
      pointRadius: 4,
      pointHoverRadius: 6,
    }],
    minValue,
  };
};
