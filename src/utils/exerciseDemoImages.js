/**
 * Exercise Demo Image Mapping Utility
 * 
 * Maps exercise names to their corresponding demo images in public/demos/
 * Uses case-insensitive, normalized mapping (e.g., "Dumbbell Incline Bench Press" 
 * maps to "dumbbell-incline-bench-press.webp")
 */

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
  'barbell-shrug',
  'barbell-sumo-deadlift',
  'barbell-upright-row',
  'behind-neck-pulldown',
  'bent-over-lateral-raise',
  'bodyweight-bulgarian-split-squat',
  'bodyweight-squat',
  'burpees',
  'close-grip-bench-press',
  'close-grip-pulldown',
  'dumbbell-bench-press',
  'dumbbell-bent-over-row-single-arm',
  'dumbbell-bent-over-rows',
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
  'dumbbell-shrugs',
  'dumbell-deadlift',
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
  'push-ups',
  'reverse-grip-pulldown',
  'rope-pulldown',
  'seated-cable-row',
  'slamball-squat',
  'straight-arm-lat-pulldown',
  't-bar-rows',
  'trap-bar-deadlift',
  'wall-sit',
];

/**
 * Normalizes an exercise name to match the demo image filename pattern
 * Converts to lowercase, replaces spaces with hyphens, removes special chars
 * 
 * @param {string} exerciseName - The exercise name to normalize
 * @returns {string} Normalized filename (without extension)
 */
export const normalizeExerciseName = (exerciseName) => {
  if (!exerciseName) return '';
  
  return exerciseName
    .toLowerCase()
    .trim()
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
 * Gets the demo image path for a given exercise name
 * Returns null if no matching image is found
 * 
 * @param {string} exerciseName - The exercise name to find an image for
 * @returns {string|null} Path to the demo image or null if not found
 */
export const getDemoImagePath = (exerciseName) => {
  if (!exerciseName) return null;
  
  const normalized = normalizeExerciseName(exerciseName);
  
  // Check if we have an exact match
  if (AVAILABLE_DEMO_IMAGES.includes(normalized)) {
    return `/demos/${normalized}.webp`;
  }
  
  // Check for common variations/aliases
  const variations = getExerciseVariations(normalized);
  for (const variation of variations) {
    if (AVAILABLE_DEMO_IMAGES.includes(variation)) {
      return `/demos/${variation}.webp`;
    }
  }
  
  return null;
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
  
  // Handle "Dumbbell Declined X" vs "Declined Dumbbell X" variations
  if (normalized.startsWith('dumbbell-declined-')) {
    variations.push(normalized.replace(/^dumbbell-declined-/, 'declined-dumbbell-'));
  } else if (normalized.startsWith('declined-dumbbell-')) {
    variations.push(normalized.replace(/^declined-dumbbell-/, 'dumbbell-declined-'));
  }
  
  // Handle "Barbell Declined X" vs "Declined Barbell X" variations
  if (normalized.startsWith('barbell-declined-')) {
    variations.push(normalized.replace(/^barbell-declined-/, 'declined-barbell-'));
  } else if (normalized.startsWith('declined-barbell-')) {
    variations.push(normalized.replace(/^declined-barbell-/, 'barbell-declined-'));
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
  
  // Handle row/rows variations
  if (normalized.endsWith('-row')) {
    variations.push(normalized + 's');
  } else if (normalized.endsWith('-rows')) {
    variations.push(normalized.slice(0, -1));
  }
  
  // Handle press variations
  if (normalized.includes('shoulder-press')) {
    variations.push(normalized.replace('shoulder-press', 'shoulder-press-2'));
  }
  
  // Handle single-arm variations
  if (normalized.includes('single-arm')) {
    variations.push(normalized.replace('single-arm', 'single-arm-row'));
  }
  
  // Handle pull-up variations
  if (normalized === 'pull-up' || normalized === 'pullup') {
    variations.push('pull-up');
  } else if (normalized === 'pull-ups' || normalized === 'pullups') {
    variations.push('pull-up');
  }
  
  // Handle push-up variations
  if (normalized === 'push-up' || normalized === 'pushup') {
    variations.push('push-ups');
  } else if (normalized === 'push-ups' || normalized === 'pushups') {
    variations.push('push-ups');
  }
  
  // Handle squat variations
  if (normalized === 'squat') {
    variations.push('bodyweight-squat');
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
 * @returns {boolean} True if a demo image exists
 */
export const hasDemoImage = (exerciseName) => {
  return getDemoImagePath(exerciseName) !== null;
};

/**
 * Maps an array of exercise objects to include demo image paths
 * Adds a `demoImage` property to each exercise
 * 
 * @param {Array} exercises - Array of exercise objects with `name` property
 * @returns {Array} Array of exercises with added `demoImage` property
 */
export const mapExercisesWithDemoImages = (exercises) => {
  if (!Array.isArray(exercises)) return [];
  
  return exercises.map(exercise => ({
    ...exercise,
    demoImage: getDemoImagePath(exercise.name),
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
      // Extract filename without path and extension
      const imageFile = imagePath.replace('/demos/', '').replace('.webp', '');
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
