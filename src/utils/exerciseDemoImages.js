/**
 * Exercise Demo Image Mapping Utility
 * 
 * Simplified utility that uses explicit image field from exercises.json.
 * Each exercise now has a direct image field pointing to either:
 * - demos/{filename}.webp for photo demonstrations
 * - svg-muscles/{filename}.svg for muscle diagrams
 * 
 * No more dynamic SVG generation or complex fallback chains.
 */

/**
 * Get the base URL for the application
 * Uses Vite's BASE_URL to handle deployment paths (e.g., /goodlift/)
 */
const getBaseUrl = () => {
  return import.meta.env.BASE_URL || '/';
};

/**
 * Gets the demo image path for a given exercise
 * 
 * New simplified approach:
 * - Uses the explicit 'image' field from exercise data
 * - Returns the full path with base URL prepended
 * - Returns null if no image field is present (triggers fallback icon in component)
 * 
 * @param {Object} exercise - The exercise object with 'image' field
 * @returns {string|null} Full path to the image, or null
 */
export const getDemoImagePath = (exercise) => {
  // If no exercise or no image field, return null (will show fallback icon)
  if (!exercise || !exercise.image) {
    return null;
  }
  
  // Return the full path with base URL
  return `${getBaseUrl()}${exercise.image}`;
};

/**
 * Legacy function signature for backward compatibility
 * @deprecated Use getDemoImagePath(exercise) instead
 */
export const getDemoImagePathLegacy = (exerciseName, usePlaceholder = true, webpFile = null, primaryMuscle = null, secondaryMuscles = null) => {
  console.warn('getDemoImagePathLegacy is deprecated. Use exercise.image field directly.');
  return null;
};

/**
 * Maps an array of exercise objects to include demo image paths
 * Now simply validates that each exercise has an image field
 * 
 * @param {Array} exercises - Array of exercise objects with `image` field
 * @returns {Array} Array of exercises (unchanged, just validated)
 */
export const mapExercisesWithDemoImages = (exercises) => {
  if (!Array.isArray(exercises)) return [];
  
  // Just return exercises as-is since they already have image field
  // Could add validation here if needed
  return exercises;
};
