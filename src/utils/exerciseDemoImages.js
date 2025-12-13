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
 * Constructs full image URL from relative path
 * Handles absolute URLs, data URLs, and relative paths
 * 
 * @param {string|null} imagePath - Relative or absolute image path
 * @returns {string|null} Full URL or null
 */
export const constructImageUrl = (imagePath) => {
  if (!imagePath) {
    return null;
  }
  
  // Already absolute URL or data URL
  if (imagePath.startsWith('http') || imagePath.startsWith('/') || imagePath.startsWith('data:')) {
    return imagePath;
  }
  
  // Prepend base URL
  const baseUrl = getBaseUrl();
  return `${baseUrl}${imagePath}`;
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
  
  // Use the shared helper to construct URL
  return constructImageUrl(exercise.image);
};

/**
 * Legacy function signature for backward compatibility
 * @deprecated Use getDemoImagePath(exercise) instead where exercise has an 'image' field
 * 
 * Migration guide:
 * Old: getDemoImagePath(exerciseName, true, webpFile, primaryMuscle, secondaryMuscles)
 * New: getDemoImagePath(exercise) where exercise = { image: "demos/file.webp" or "svg-muscles/file.svg" }
 */
// eslint-disable-next-line no-unused-vars
export const getDemoImagePathLegacy = (exerciseName, usePlaceholder = true, webpFile = null, primaryMuscle = null, secondaryMuscles = null) => {
  console.warn(
    'getDemoImagePathLegacy is deprecated. ' +
    'Update exercises.json to include explicit "image" field and use getDemoImagePath(exercise) instead. ' +
    'See SVG_GENERATION.md for migration guide.'
  );
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
