/**
 * Exercise Demo Image Utility
 * 
 * Provides URL construction for exercise demonstration images.
 * 
 * The Good Lift app stores exercise images in two directories:
 * - public/demos/*.webp - Photo demonstrations (60 files, 53 exercises use them)
 * - public/svg-muscles/*.svg - Muscle diagram SVGs (103 files, all used)
 * 
 * Each exercise in exercises.json has an 'image' field pointing to its image:
 *   { "Exercise Name": "Back Squat", "image": "demos/back-squat.webp" }
 * 
 * This utility constructs the full URL including Vite's BASE_URL for deployment.
 * 
 * Usage:
 *   import { constructImageUrl } from './utils/exerciseDemoImages';
 *   const imageUrl = constructImageUrl(exercise.image);
 * 
 * See docs/EXERCISE_IMAGE_SYSTEM.md for complete documentation.
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
 * @param {string|null} imagePath - Relative or absolute image path from exercise.image field
 * @returns {string|null} Full URL or null
 */
export const constructImageUrl = (imagePath) => {
  if (!imagePath) {
    return null;
  }
  
  // Already absolute HTTP/HTTPS URL or data URL - return as-is
  if (imagePath.startsWith('http') || imagePath.startsWith('data:')) {
    return imagePath;
  }
  
  // Get the base URL (e.g., '/goodlift/' or '/')
  const baseUrl = getBaseUrl();
  
  // If path starts with '/', check if it already includes the base URL
  if (imagePath.startsWith('/')) {
    // If base URL is not just '/' and the path already starts with base URL, return as-is
    if (baseUrl !== '/' && imagePath.startsWith(baseUrl)) {
      return imagePath;
    }
    // If base URL is '/' or path doesn't include base URL, return as-is (it's already absolute)
    if (baseUrl === '/') {
      return imagePath;
    }
    // Path starts with '/' but doesn't include base URL - prepend it
    // Remove leading '/' from imagePath to avoid double slashes
    return `${baseUrl}${imagePath.substring(1)}`;
  }
  
  // Relative path (like 'demos/image.webp' or 'svg-muscles/image.svg') - prepend base URL
  return `${baseUrl}${imagePath}`;
};
