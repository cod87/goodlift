/**
 * Exercise Demo Image Mapping Utility
 * 
 * Maps exercise names to their corresponding demo images in public/demos/
 * Uses case-insensitive, normalized mapping (e.g., "Dumbbell Incline Bench Press" 
 * maps to "dumbbell-incline-bench-press.webp")
 * 
 * For exercises without demo images, generates custom muscle highlight SVGs
 * based on the exercise's primary and secondary muscles.
 */

import { getMuscleHighlightDataUrl } from './muscleHighlightSvg.js';

/**
 * Get the base URL for the application
 * Uses Vite's BASE_URL to handle deployment paths (e.g., /goodlift/)
 */
const getBaseUrl = () => {
  return import.meta.env.BASE_URL || '/';
};

// List of all available demo images in public/demos/
const AVAILABLE_DEMO_IMAGES = [
  'back-squat',
  'barbell-bench-press',
  'barbell-bent-over-row',
  'barbell-bicep-curl',
  'barbell-bulgarian-split-squat',
  'barbell-deadlift',
  'barbell-declined-bench-press',
  'barbell-hip-thrust',
  'barbell-overhead-press',
  'barbell-paused-bench-press',
  'barbell-pullover',
  'barbell-push-press',
  'barbell-romanian-deadlift',
  'barbell-shrugs',
  'barbell-sumo-deadlift',
  'barbell-upright-row',
  'behind-neck-pulldown',
  'bent-over-lateral-raise',
  'bodyweight-bulgarian-split-squat',
  'bodyweight-squat',
  'burpee',
  'close-grip-bench-press',
  'close-grip-pulldown',
  'dumbbell-bench-press',
  'dumbbell-bent-over-row-single-arm',
  'dumbbell-bent-over-row',
  'dumbbell-concentration-curl',
  'dumbbell-deadlift',
  'dumbbell-declined-bench-press',
  'dumbbell-fly',
  'dumbbell-front-raise',
  'dumbbell-goblet-squat',
  'dumbbell-lateral-raise',
  'dumbbell-pullover',
  'dumbbell-romanian-deadlift',
  'dumbbell-shoulder-press-2',
  'dumbbell-shoulder-press',
  'dumbbell-shrug',
  'front-squat',
  'good-morning',
  'hammer-curl',
  'incline-barbell-bench-press',
  'incline-dumbbell-bench-press',
  'incline-dumbbell-curl',
  'incline-dumbbell-fly',
  'jump-squat',
  'kettlebell-swing',
  'lat-pulldown',
  'lunge',
  'pull-up',
  'push-up',
  'reverse-grip-pulldown',
  'rope-pulldown',
  'seated-cable-row',
  'slamball-squat',
  'straight-arm-lat-pulldown',
  't-bar-row',
  'trap-bar-deadlift',
  'wall-sit',
];

/**
 * Normalizes an exercise name to match the demo image filename pattern
 * Converts to lowercase, replaces spaces with hyphens, removes special chars
 * Handles the new "Movement, Equipment" naming format by converting to "equipment-movement"
 * 
 * @param {string} exerciseName - The exercise name to normalize
 * @returns {string} Normalized filename (without extension)
 */
export const normalizeExerciseName = (exerciseName) => {
  if (!exerciseName) return '';
  
  let name = exerciseName.trim();
  
  // Handle the new "Movement, Equipment" format (e.g., "Bench Press, Barbell" -> "Barbell Bench Press")
  // This converts it back to the old format for image matching
  // Only process if there's exactly one ", " separator and it produces valid parts
  const commaIndex = name.lastIndexOf(', ');
  if (commaIndex > 0 && commaIndex < name.length - 2) {
    const movement = name.substring(0, commaIndex).trim();
    const equipment = name.substring(commaIndex + 2).trim();
    // Only transform if both parts are non-empty and equipment doesn't contain another comma
    if (movement && equipment && !equipment.includes(',')) {
      name = `${equipment} ${movement}`;
    }
  }
  
  return name
    .toLowerCase()
    // Replace multiple spaces with single space
    .replace(/\s+/g, ' ')
    // Replace spaces with hyphens
    .replace(/\s/g, '-')
    // Remove special characters except hyphens
    .replace(/[^a-z0-9-]/g, '')
    // Remove multiple consecutive hyphens
    .replace(/-+/g, '-')
    // Remove leading/trailing hyphens
    .replace(/^-+|-+$/g, '');
};

/**
 * Returns appropriate fallback image based on available data
 * @param {boolean} usePlaceholder - Whether to return a placeholder
 * @param {string} primaryMuscle - Primary muscle for custom SVG
 * @param {string} secondaryMuscles - Secondary muscles for custom SVG
 * @returns {string|null} Fallback image path or null
 */
const getFallbackImage = (usePlaceholder, primaryMuscle, secondaryMuscles) => {
  if (!usePlaceholder) return null;
  
  // If we have muscle data, generate custom SVG highlighting those muscles
  if (primaryMuscle) {
    const svgUrl = getMuscleHighlightDataUrl(primaryMuscle, secondaryMuscles || '');
    console.log('[getFallbackImage] Generating SVG for primaryMuscle:', primaryMuscle, 'secondary:', secondaryMuscles, 'result length:', svgUrl?.length);
    return svgUrl;
  }
  
  // Otherwise use the generic work icon
  console.log('[getFallbackImage] No primaryMuscle, returning work-icon');
  return `${getBaseUrl()}work-icon.svg`;
};

/**
 * Gets the demo image path for a given exercise name or webp file
 * Returns a custom muscle highlight SVG if no matching image is found
 * 
 * Priority order for demo images:
 * 1. Explicit webpFile parameter (from exercise's "Webp File" property)
 * 2. Exact name match from AVAILABLE_DEMO_IMAGES
 * 3. Known variations (e.g., equipment prefix order differences)
 * 4. Fallback to custom muscle highlight SVG (NOT fuzzy match to avoid incorrect demos)
 * 
 * @param {string} exerciseName - The exercise name to find an image for
 * @param {boolean} usePlaceholder - Whether to return placeholder if no match (default: true)
 * @param {string} webpFile - Optional webp filename from exercise data (e.g., 'back-squat.webp')
 * @param {string} primaryMuscle - Optional primary muscle for generating custom SVG
 * @param {string} secondaryMuscles - Optional secondary muscles for generating custom SVG
 * @returns {string|null} Path to the demo image, custom SVG data URL, placeholder, or null
 */
export const getDemoImagePath = (exerciseName, usePlaceholder = true, webpFile = null, primaryMuscle = null, secondaryMuscles = null) => {
  // Enhanced debug logging for investigation
  console.log('[getDemoImagePath] CALLED with:', {
    exerciseName,
    usePlaceholder,
    webpFile,
    primaryMuscle,
    secondaryMuscles
  });
  
  // PRIORITY 1: If webpFile is explicitly provided, validate and use it directly
  // This takes highest priority as it's explicitly defined in the exercise data
  if (webpFile) {
    // Basic validation: only allow safe filenames (alphanumeric, hyphens, and .webp extension)
    // This prevents path traversal attacks (e.g., '../../../sensitive-file')
    const safeFilenamePattern = /^[a-zA-Z0-9-]+\.webp$/;
    if (safeFilenamePattern.test(webpFile)) {
      const result = `${getBaseUrl()}demos/${webpFile}`;
      console.log('[getDemoImagePath] PRIORITY 1: Using webpFile:', result);
      return result;
    }
    // If webpFile is invalid, fall through to name-based matching
    console.log('[getDemoImagePath] PRIORITY 1: webpFile invalid, falling through:', webpFile);
  }
  
  if (!exerciseName) {
    const fallback = getFallbackImage(usePlaceholder, primaryMuscle, secondaryMuscles);
    console.log('[getDemoImagePath] No exercise name, returning fallback:', fallback?.substring(0, 50));
    return fallback;
  }
  
  const normalized = normalizeExerciseName(exerciseName);
  console.log('[getDemoImagePath] Normalized name:', normalized);
  
  // PRIORITY 2: Check if we have an exact match
  if (AVAILABLE_DEMO_IMAGES.includes(normalized)) {
    const result = `${getBaseUrl()}demos/${normalized}.webp`;
    console.log('[getDemoImagePath] PRIORITY 2: Exact match found:', result);
    return result;
  }
  
  // PRIORITY 3: Check for common variations/aliases (known, safe transformations)
  const variations = getExerciseVariations(normalized);
  console.log('[getDemoImagePath] PRIORITY 3: Checking variations:', variations);
  for (const variation of variations) {
    if (AVAILABLE_DEMO_IMAGES.includes(variation)) {
      const result = `${getBaseUrl()}demos/${variation}.webp`;
      console.log('[getDemoImagePath] PRIORITY 3: Variation match found:', result);
      return result;
    }
  }
  
  // PRIORITY 4: No webp image found, return fallback (muscle SVG or work icon)
  // Fuzzy matching is intentionally disabled to prevent incorrect demo image matches.
  // The muscle SVG provides accurate visual representation of which muscles
  // are targeted by the exercise, which is more useful than showing the wrong demo.
  const fallback = getFallbackImage(usePlaceholder, primaryMuscle, secondaryMuscles);
  console.log('[getDemoImagePath] PRIORITY 4: No webp for "' + exerciseName + '", primaryMuscle:', primaryMuscle, 'fallback type:', fallback?.startsWith('data:image/svg') ? 'SVG' : fallback?.includes('work-icon') ? 'work-icon' : 'other', 'result length:', fallback?.length);
  return fallback;
};

/**
 * DISABLED: Fuzzy matching for exercise names
 * 
 * This function is intentionally disabled to prevent incorrect demo image matches.
 * Showing the wrong exercise demo is worse than showing a muscle SVG that accurately
 * represents the muscles worked by the exercise.
 * 
 * Kept here for reference and potential future use if the matching logic is improved
 * to be more conservative and accurate.
 * 
 * @param {string} normalized - Normalized exercise name
 * @returns {string|null} Best matching image filename or null
 */
// eslint-disable-next-line no-unused-vars
const findFuzzyMatch = (normalized) => {
  const words = normalized.split('-').filter(w => w.length > 2);
  if (words.length === 0) return null;
  
  let bestScore = 0;
  let bestImage = null;
  
  for (const image of AVAILABLE_DEMO_IMAGES) {
    const imageWords = image.split('-');
    let score = 0;
    let matchedWords = 0;
    
    for (const word of words) {
      if (imageWords.includes(word)) {
        score += 2; // Exact word match
        matchedWords++;
      } else {
        // Check for similar words (plural/singular)
        const singular = word.endsWith('s') ? word.slice(0, -1) : word;
        const plural = word.endsWith('s') ? word : word + 's';
        if (imageWords.includes(singular) || imageWords.includes(plural)) {
          score += 1.5;
          matchedWords++;
        }
      }
    }
    
    // Bonus for matching equipment type (first word)
    if (words[0] && imageWords[0] === words[0]) {
      score += 1;
    }
    
    // Penalty for length mismatch
    const lengthDiff = Math.abs(words.length - imageWords.length);
    score -= lengthDiff * 0.3;
    
    // Require at least 70% of words to match for a valid fuzzy match
    const matchPercentage = matchedWords / words.length;
    if (score > bestScore && matchPercentage >= 0.7) {
      bestScore = score;
      bestImage = image;
    }
  }
  
  // Only return if score is meaningful (at least 2 words matched)
  return bestScore >= 3 ? bestImage : null;
};

/**
 * Generates common variations/aliases for an exercise name
 * Helps match exercises with slightly different naming conventions
 * 
 * @param {string} normalized - Normalized exercise name
 * @returns {string[]} Array of possible variations
 */
const getExerciseVariations = (normalized) => {
  const variations = [];
  
  // Handle "Dumbbell Incline X" vs "Incline Dumbbell X" variations
  if (normalized.startsWith('dumbbell-incline-')) {
    variations.push(normalized.replace(/^dumbbell-incline-/, 'incline-dumbbell-'));
  } else if (normalized.startsWith('incline-dumbbell-')) {
    variations.push(normalized.replace(/^incline-dumbbell-/, 'dumbbell-incline-'));
  }
  
  // Handle "Barbell Incline X" vs "Incline Barbell X" variations
  if (normalized.startsWith('barbell-incline-')) {
    variations.push(normalized.replace(/^barbell-incline-/, 'incline-barbell-'));
  } else if (normalized.startsWith('incline-barbell-')) {
    variations.push(normalized.replace(/^incline-barbell-/, 'barbell-incline-'));
  }
  
  // Handle "Dumbbell Decline X" vs "Decline Dumbbell X" variations
  if (normalized.startsWith('dumbbell-decline-')) {
    variations.push(normalized.replace(/^dumbbell-decline-/, 'decline-dumbbell-'));
    variations.push(normalized.replace('decline-', 'declined-'));
  } else if (normalized.startsWith('decline-dumbbell-')) {
    variations.push(normalized.replace(/^decline-dumbbell-/, 'dumbbell-decline-'));
  }
  
  // Handle "Barbell Decline X" vs "Decline Barbell X" and decline/declined variations
  if (normalized.startsWith('barbell-decline-')) {
    variations.push(normalized.replace(/^barbell-decline-/, 'decline-barbell-'));
    variations.push(normalized.replace('decline-', 'declined-'));
    variations.push(normalized.replace(/^barbell-decline-/, 'barbell-declined-'));
  } else if (normalized.startsWith('decline-barbell-')) {
    variations.push(normalized.replace(/^decline-barbell-/, 'barbell-decline-'));
  }
  
  // Handle equipment prefix removal for exercises named with just equipment + action
  // e.g., "Barbell Good Morning" -> "good-morning", "Barbell Front Squat" -> "front-squat"
  const equipmentTypes = ['barbell', 'dumbbell', 'kettlebell', 'cable', 'bodyweight'];
  for (const equipment of equipmentTypes) {
    if (normalized.startsWith(`${equipment}-`)) {
      const withoutEquipment = normalized.replace(`${equipment}-`, '');
      variations.push(withoutEquipment);
      // Also try with other equipment types
      for (const otherEquipment of equipmentTypes) {
        if (otherEquipment !== equipment) {
          variations.push(`${otherEquipment}-${withoutEquipment}`);
        }
      }
    }
  }
  
  // Handle "Dumbbell X" vs "DB X" variations
  if (normalized.startsWith('db-')) {
    variations.push(normalized.replace(/^db-/, 'dumbbell-'));
  } else if (normalized.startsWith('dumbbell-')) {
    variations.push(normalized.replace(/^dumbbell-/, 'db-'));
  }
  
  // Handle "Barbell X" vs "BB X" variations
  if (normalized.startsWith('bb-')) {
    variations.push(normalized.replace(/^bb-/, 'barbell-'));
  } else if (normalized.startsWith('barbell-')) {
    variations.push(normalized.replace(/^barbell-/, 'bb-'));
  }
  
  // Handle close-grip variations
  if (normalized.includes('close-grip-')) {
    variations.push(normalized.replace('close-grip-', 'close-'));
  } else if (normalized.startsWith('barbell-close-')) {
    variations.push(normalized.replace('barbell-close-', 'close-'));
  }
  
  // Handle single-arm variations
  if (normalized.includes('single-arm-')) {
    // Try without the "single-arm" prefix
    const withoutSingleArm = normalized.replace('single-arm-', '');
    variations.push(withoutSingleArm);
    variations.push(withoutSingleArm + '-single-arm');
  }
  
  // Handle curl type variations (hammer, concentration, etc.)
  if (normalized.includes('hammer-curl')) {
    variations.push(normalized.replace('hammer-curl', 'curl'));
    variations.push('hammer-curl');
  }
  if (normalized.includes('concentration-curl')) {
    variations.push(normalized.replace('concentration-curl', 'curl'));
    variations.push('concentration-curl');
  }
  
  // Handle lunge variations
  if (normalized.includes('lunge')) {
    variations.push('lunge');
    variations.push('walking-lunge');
    variations.push('reverse-lunge');
  }
  
  // Handle incline/inclined variations
  if (normalized.includes('incline-')) {
    variations.push(normalized.replace('incline-', 'inclined-'));
  } else if (normalized.includes('inclined-')) {
    variations.push(normalized.replace('inclined-', 'incline-'));
  }
  
  // Handle decline/declined variations
  if (normalized.includes('decline-')) {
    variations.push(normalized.replace('decline-', 'declined-'));
  } else if (normalized.includes('declined-')) {
    variations.push(normalized.replace('declined-', 'decline-'));
  }
  
  // Handle press variations
  if (normalized.includes('shoulder-press')) {
    variations.push(normalized.replace('shoulder-press', 'shoulder-press-2'));
  }
  
  // Handle squat variations
  if (normalized === 'squat') {
    variations.push('bodyweight-squat');
    variations.push('back-squat');
  }
  
  return variations;
};

/**
 * Gets a list of all exercise names that have demo images available
 * Useful for debugging and testing
 * 
 * @returns {string[]} Array of available demo image names
 */
export const getAvailableDemoImages = () => {
  return [...AVAILABLE_DEMO_IMAGES];
};

/**
 * Checks if a demo image exists for a given exercise
 * 
 * @param {string} exerciseName - The exercise name to check
 * @param {string} webpFile - Optional webp filename from exercise data
 * @returns {boolean} True if a demo image exists
 */
export const hasDemoImage = (exerciseName, webpFile = null) => {
  // If webpFile is provided and valid, image exists
  if (webpFile) {
    const safeFilenamePattern = /^[a-zA-Z0-9-]+\.webp$/;
    if (safeFilenamePattern.test(webpFile)) {
      return true;
    }
  }
  return getDemoImagePath(exerciseName, false) !== null;
};

/**
 * Maps an array of exercise objects to include demo image paths
 * Adds a `demoImage` property to each exercise
 * Uses the 'Webp File' property if available, otherwise falls back to name-based matching
 * If no image is found, generates a custom muscle highlight SVG
 * 
 * @param {Array} exercises - Array of exercise objects with `name` or `Exercise Name` property
 * @returns {Array} Array of exercises with added `demoImage` property
 */
export const mapExercisesWithDemoImages = (exercises) => {
  if (!Array.isArray(exercises)) return [];
  
  return exercises.map(exercise => ({
    ...exercise,
    demoImage: getDemoImagePath(
      exercise.name || exercise['Exercise Name'],
      true,
      exercise['Webp File'] || null,
      exercise['Primary Muscle'] || null,
      exercise['Secondary Muscles'] || null
    ),
  }));
};

/**
 * Analyzes which demo images are not being used by any exercises
 * Useful for identifying orphaned demo images
 * 
 * @param {Array} exerciseNames - Array of exercise name strings
 * @returns {Object} Object with `used` and `unused` arrays
 */
export const analyzeImageUsage = (exerciseNames) => {
  const usedImages = new Set();
  const exerciseNameToImage = new Map();
  
  // Map each exercise to its demo image
  exerciseNames.forEach(name => {
    const imagePath = getDemoImagePath(name);
    if (imagePath) {
      // Extract filename without path, base URL, and extension
      // Handle both /demos/ and /goodlift/demos/ paths
      const imageFile = imagePath
        .replace(/.*\/demos\//, '') // Remove everything up to and including /demos/
        .replace('.webp', '');
      usedImages.add(imageFile);
      exerciseNameToImage.set(name, imageFile);
    }
  });
  
  // Find unused images
  const unusedImages = AVAILABLE_DEMO_IMAGES.filter(
    image => !usedImages.has(image)
  );
  
  return {
    used: Array.from(usedImages),
    unused: unusedImages,
    mapping: Object.fromEntries(exerciseNameToImage),
    totalImages: AVAILABLE_DEMO_IMAGES.length,
    usedCount: usedImages.size,
    unusedCount: unusedImages.length,
  };
};
