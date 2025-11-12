/**
 * Progressive Overload Utility
 * Calculates and formats progressive overload suggestions based on recent performance
 */

/**
 * Calculate progressive overload suggestion for the next set
 * @param {number} currentWeight - Current weight used
 * @param {number} repsCompleted - Number of reps completed
 * @param {number} targetReps - Target reps for the exercise
 * @returns {Object} Suggestion object with message and suggested weight
 */
export const calculateProgressiveOverload = (currentWeight, repsCompleted, targetReps) => {
  if (!currentWeight || !repsCompleted || !targetReps) {
    return null;
  }

  const repsExceeded = repsCompleted - targetReps;
  
  // If target reps achieved exactly, suggest +5-10lbs
  if (repsExceeded === 0) {
    const suggestedWeight = currentWeight + 5;
    return {
      message: `Great job! Try ${suggestedWeight}lbs next set`,
      suggestedWeight,
      type: 'success',
    };
  }
  
  // If user exceeded reps by 2+, suggest +10-15lbs
  if (repsExceeded >= 2) {
    const suggestedWeight = currentWeight + 10;
    return {
      message: `Excellent! You exceeded target by ${repsExceeded} reps. Try ${suggestedWeight}lbs next set`,
      suggestedWeight,
      type: 'excellent',
    };
  }
  
  // If user exceeded reps by 1, suggest +5lbs
  if (repsExceeded === 1) {
    const suggestedWeight = currentWeight + 5;
    return {
      message: `Nice! Try ${suggestedWeight}lbs next set`,
      suggestedWeight,
      type: 'good',
    };
  }
  
  // If below target, suggest staying at current weight
  if (repsCompleted < targetReps) {
    return {
      message: `Keep going! Try ${currentWeight}lbs again to hit ${targetReps} reps`,
      suggestedWeight: currentWeight,
      type: 'maintain',
    };
  }
  
  return null;
};

/**
 * Get progressive overload suggestion message based on performance
 * @param {Object} params - Parameters object
 * @param {number} params.currentWeight - Current weight used
 * @param {number} params.repsCompleted - Number of reps completed  
 * @param {number} params.targetReps - Target reps for the exercise
 * @returns {string|null} Formatted suggestion message
 */
export const getProgressiveOverloadMessage = ({ currentWeight, repsCompleted, targetReps }) => {
  const suggestion = calculateProgressiveOverload(currentWeight, repsCompleted, targetReps);
  
  if (!suggestion) {
    return null;
  }
  
  return suggestion.message;
};

/**
 * Get suggested weight for next set
 * @param {number} currentWeight - Current weight used
 * @param {number} repsCompleted - Number of reps completed
 * @param {number} targetReps - Target reps for the exercise
 * @returns {number|null} Suggested weight for next set
 */
export const getSuggestedWeight = (currentWeight, repsCompleted, targetReps) => {
  const suggestion = calculateProgressiveOverload(currentWeight, repsCompleted, targetReps);
  return suggestion ? suggestion.suggestedWeight : null;
};

/**
 * Check if progressive overload criteria is met
 * @param {number} repsCompleted - Number of reps completed
 * @param {number} targetReps - Target reps for the exercise
 * @returns {boolean} True if criteria is met
 */
export const meetsProgressiveOverloadCriteria = (repsCompleted, targetReps) => {
  return repsCompleted >= targetReps;
};

/**
 * Calculate weight adjustment based on muscle group and equipment
 * @param {string} primaryMuscle - Primary muscle group being worked
 * @param {string} equipment - Equipment type being used
 * @returns {number} Weight adjustment in lbs (5 or 10)
 */
export const calculateWeightAdjustment = (primaryMuscle, equipment) => {
  const upperBodyMuscles = ['Chest', 'Back', 'Shoulders', 'Delts', 'Biceps', 'Triceps', 'Lats', 'Traps'];
  const lowerBodyMuscles = ['Quads', 'Hamstrings', 'Glutes', 'Calves', 'Legs'];
  
  const isUpperBody = upperBodyMuscles.some(muscle => primaryMuscle?.includes(muscle));
  const isLowerBody = lowerBodyMuscles.some(muscle => primaryMuscle?.includes(muscle));
  const isDumbbell = equipment?.includes('Dumbbell') || equipment?.includes('Kettlebell');
  
  if (isUpperBody) {
    return isDumbbell ? 5 : 5; // Upper body: +5lbs
  }
  
  if (isLowerBody) {
    return isDumbbell ? 5 : 10; // Lower body: +5lbs for dumbbells, +10lbs for barbells
  }
  
  return 5; // Default +5lbs
};
