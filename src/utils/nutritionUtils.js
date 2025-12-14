/**
 * Utility functions for nutrition tracking
 */

/**
 * Detect meal type based on the hour of the day
 * @param {number} hour - Hour in 24-hour format (0-23)
 * @returns {string} Meal type: 'breakfast', 'lunch', 'dinner', or 'snack'
 */
export const detectMealTypeByTime = (hour) => {
  if (hour < 11) return 'breakfast';
  if (hour < 16) return 'lunch';
  if (hour < 21) return 'dinner';
  return 'snack';
};

/**
 * Get the current meal type based on current time
 * @returns {string} Current meal type
 */
export const getCurrentMealType = () => {
  const hour = new Date().getHours();
  return detectMealTypeByTime(hour);
};

/**
 * Validate that a meal type is one of the allowed values
 * @param {string} mealType - Meal type to validate
 * @returns {boolean} True if valid meal type
 */
export const isValidMealType = (mealType) => {
  const validTypes = ['breakfast', 'lunch', 'dinner', 'snack'];
  return validTypes.includes(mealType);
};

/**
 * Get a valid meal type or default to snack
 * @param {string} mealType - Meal type to validate
 * @returns {string} Valid meal type or 'snack'
 */
export const getValidMealType = (mealType) => {
  return isValidMealType(mealType) ? mealType : 'snack';
};
