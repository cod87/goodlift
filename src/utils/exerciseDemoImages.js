/**
 * Exercise Demo Image Utility
 * 
 * Simplified utility that constructs image URLs from the explicit image field in exercises.json.
 * Each exercise has a direct image field pointing to either:
 * - demos/{filename}.webp for photo demonstrations
 * - svg-muscles/{filename}.svg for muscle diagrams
 * 
 * No fallback mechanisms or dynamic generation - just direct path construction.
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
