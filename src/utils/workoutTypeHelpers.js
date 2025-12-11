/**
 * Workout Type Display Helpers
 * Utility functions for displaying workout type labels and shorthand
 * Extracted from legacy weeklyPlanDefaults.js for use with session-based plans
 */

/**
 * Get workout type shorthand label for compact display
 * @param {string} type - Workout type
 * @returns {string} Shorthand label (e.g., 'UP' for Upper, 'LO' for Lower)
 */
export const getWorkoutTypeShorthand = (type) => {
  const shorthandLabels = {
    // Strength training types
    push: 'Push',
    pull: 'Pull',
    legs: 'Legs',
    upper: 'Upper',
    lower: 'Lower',
    full: 'Full',
    // Other workout types
    stretch: 'Stretch',
    hiit: 'HIIT',
    rest: 'Rest',
    cardio: 'Cardio',
    core: 'Core',
    // Day types (from session-based plans)
    strength: 'Strength',
    hypertrophy: 'Hypertrophy',
    active_recovery: 'Active Recovery',
  };
  return shorthandLabels[type] || type.charAt(0).toUpperCase() + type.slice(1);
};

/**
 * Get workout type display name
 * @param {string} type - Workout type
 * @returns {string} Display name
 */
export const getWorkoutTypeDisplayName = (type) => {
  const displayNames = {
    // Session types
    push: 'Push',
    pull: 'Pull',
    legs: 'Legs',
    upper: 'Upper Body',
    lower: 'Lower Body',
    full: 'Full Body',
    stretch: 'Stretch',
    hiit: 'HIIT',
    rest: 'Rest',
    cardio: 'Cardio',
    active_recovery: 'Active Recovery',
    // Day types (from session-based plans)
    strength: 'Strength',
    hypertrophy: 'Hypertrophy',
  };
  return displayNames[type] || type.charAt(0).toUpperCase() + type.slice(1);
};
