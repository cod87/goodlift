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
 * @returns {number} Weight adjustment in lbs (0 for bodyweight, 2.5-10 for others)
 */
export const calculateWeightAdjustment = (primaryMuscle, equipment) => {
  // Bodyweight exercises should not have progressive overload
  if (equipment?.toLowerCase().includes('bodyweight') || equipment?.toLowerCase().includes('body weight')) {
    return 0;
  }
  
  const upperBodyMuscles = ['Chest', 'Back', 'Shoulders', 'Delts', 'Biceps', 'Triceps', 'Lats', 'Traps'];
  const lowerBodyMuscles = ['Quads', 'Hamstrings', 'Glutes', 'Calves', 'Legs'];
  
  const isUpperBody = upperBodyMuscles.some(muscle => primaryMuscle?.includes(muscle));
  const isLowerBody = lowerBodyMuscles.some(muscle => primaryMuscle?.includes(muscle));
  const isDumbbell = equipment?.includes('Dumbbell') || equipment?.includes('Kettlebell');
  const isBarbell = equipment?.toLowerCase().includes('barbell');
  
  if (isUpperBody) {
    if (isBarbell) {
      return 5; // Upper body barbell: +5lbs
    }
    return isDumbbell ? 2.5 : 2.5; // Upper body dumbbell/other: +2.5lbs
  }
  
  if (isLowerBody) {
    if (isBarbell) {
      return 5; // Lower body barbell: +5lbs
    }
    return isDumbbell ? 10 : 5; // Lower body dumbbell: +10lbs, other: +5lbs
  }
  
  return 2.5; // Default +2.5lbs for other exercises
};

/**
 * Calculate weight reduction based on muscle group and equipment
 * This mirrors the weight increase logic but for reductions
 * @param {string} primaryMuscle - Primary muscle group being worked
 * @param {string} equipment - Equipment type being used
 * @returns {number} Weight reduction in lbs (5 or 10)
 */
export const calculateWeightReduction = (primaryMuscle, equipment) => {
  // Use the same logic as weight adjustment for consistency
  return calculateWeightAdjustment(primaryMuscle, equipment);
};

/**
 * Check if an exercise is a bodyweight exercise based on equipment type
 * @param {string} equipment - Equipment type (e.g., 'Bodyweight', 'Barbell', 'Dumbbell')
 * @returns {boolean} True if exercise is bodyweight
 */
export const isBodyweightExercise = (equipment) => {
  if (!equipment) return false;
  const normalizedEquipment = equipment.toLowerCase();
  return normalizedEquipment.includes('bodyweight') || normalizedEquipment.includes('body weight');
};

/**
 * Check if weight should be reduced based on total reps completed across all sets
 * Weight should be reduced if user completes 20% or more fewer reps than target across all sets
 * @param {Array} sets - Array of set objects with reps property
 * @param {number} targetReps - Target reps per set
 * @param {number} minimumSets - Minimum number of sets required (default: 3)
 * @returns {boolean} True if weight should be reduced
 */
export const shouldReduceWeight = (sets, targetReps, minimumSets = 3) => {
  if (!sets || !Array.isArray(sets) || sets.length < minimumSets) {
    return false;
  }
  
  if (!targetReps || targetReps <= 0) {
    return false;
  }
  
  // Calculate total target reps across all sets
  const totalTargetReps = targetReps * sets.length;
  
  // Calculate total actual reps completed
  const totalActualReps = sets.reduce((sum, set) => sum + (set.reps || 0), 0);
  
  // Check if actual reps are 20% or more below target
  // 20% or more fewer means completing 80% or less of target
  const threshold = totalTargetReps * 0.8;
  
  return totalActualReps <= threshold;
};

/**
 * Check if target reps should be reduced for bodyweight exercises
 * Uses the same criteria as shouldReduceWeight (20% or more below target)
 * This is a semantic wrapper to make bodyweight exercise logic clearer in calling code
 * @param {Array} sets - Array of set objects with reps property
 * @param {number} targetReps - Target reps per set
 * @param {number} minimumSets - Minimum number of sets required (default: 3)
 * @returns {boolean} True if target reps should be reduced
 */
export const shouldReduceTargetReps = (sets, targetReps, minimumSets = 3) => {
  // Bodyweight exercises use the same reduction criteria as weighted exercises
  // (completing 20% or more fewer reps than target)
  return shouldReduceWeight(sets, targetReps, minimumSets);
};
