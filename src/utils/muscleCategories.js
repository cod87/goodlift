/**
 * Muscle Category Mapping
 * Maps detailed primary muscle names to simplified muscle group categories for filtering
 * 
 * This maintains detailed muscle metadata in exercises while providing simplified
 * categories for user-facing filters and grouping.
 */

/**
 * Mapping of simplified muscle categories to their constituent detailed muscles
 * Order: Chest, Back, Shoulders, Quads, Hamstrings, Triceps, Biceps, Calves, Core, Glutes
 */
export const MUSCLE_CATEGORY_MAP = {
  'Chest': ['Chest'],
  'Back': ['Lats', 'Traps', 'Back', 'Upper Back', 'Lower Back', 'Rhomboids', 'Erector Spinae'],
  'Shoulders': ['Shoulders', 'Delts', 'Front Delts', 'Rear Delts', 'Side Delts'],
  'Quads': ['Quads'],
  'Hamstrings': ['Hamstrings'],
  'Triceps': ['Triceps'],
  'Biceps': ['Biceps', 'Forearms'],
  'Calves': ['Calves'],
  'Core': ['Core', 'Obliques', 'Hip Flexors'],
  'Glutes': ['Glutes', 'Adductors'],
};

/**
 * Mapping of simplified muscle categories for secondary muscles
 * Each muscle is only assigned once (no duplicates between categories)
 * Order: Chest, Back, Shoulders, Quads, Hamstrings, Triceps, Biceps, Calves, Core, Glutes
 * 
 * Note: This mapping differs from MUSCLE_CATEGORY_MAP in some cases to better
 * reflect how muscles function as secondary movers in compound exercises.
 * For example, Hip Flexors are categorized under 'Quads' for secondary muscles
 * (as they assist in leg exercises) but under 'Core' for primary muscles.
 */
export const SECONDARY_MUSCLE_CATEGORY_MAP = {
  'Chest': ['Chest'],
  'Back': ['Back', 'Lats', 'Lower Back', 'Rhomboids', 'Traps', 'Upper Back'],
  'Shoulders': ['Shoulders', 'Delts', 'Front Delts', 'Rear Delts', 'Side Delts'],
  'Quads': ['Hip Flexors', 'Quads'],
  'Hamstrings': ['Hamstrings'],
  'Triceps': [], // Triceps rarely appear as secondary muscles in exercises
  'Biceps': ['Biceps', 'Forearms'],
  'Calves': ['Calves'],
  'Core': ['Core', 'Obliques'],
  'Glutes': ['Adductors', 'Glutes'],
};

/**
 * Reverse mapping: detailed muscle name to simplified category
 * Auto-generated from MUSCLE_CATEGORY_MAP for efficient lookups
 */
export const MUSCLE_TO_CATEGORY = Object.entries(MUSCLE_CATEGORY_MAP).reduce((acc, [category, muscles]) => {
  muscles.forEach(muscle => {
    acc[muscle] = category;
  });
  return acc;
}, {});

/**
 * Get the simplified category for a given primary muscle
 * @param {string} primaryMuscle - The detailed primary muscle name from exercise data
 * @returns {string} The simplified muscle category, or the original muscle if no mapping exists
 */
export function getMuscleCategory(primaryMuscle) {
  // Handle muscles with additional info in parentheses
  const cleanMuscle = primaryMuscle.split('(')[0].trim();
  return MUSCLE_TO_CATEGORY[cleanMuscle] || cleanMuscle;
}

/**
 * Parse and categorize multiple primary muscles from a comma-separated string
 * Some exercises work multiple primary muscles simultaneously (e.g., "Lats, Biceps")
 * @param {string} primaryMuscleString - Comma-separated list of primary muscles
 * @returns {Array<string>} Array of unique simplified muscle categories
 */
export function categorizePrimaryMuscles(primaryMuscleString) {
  if (!primaryMuscleString || typeof primaryMuscleString !== 'string') {
    return [];
  }
  
  const muscles = primaryMuscleString
    .split(',')
    .map(muscle => muscle.trim())
    .filter(muscle => muscle.length > 0);
  
  const categories = new Set();
  muscles.forEach(muscle => {
    const cleanMuscle = muscle.split('(')[0].trim();
    const category = getMuscleCategory(muscle);
    // Only add if the muscle is in our known mapping
    if (MUSCLE_TO_CATEGORY[cleanMuscle]) {
      categories.add(category);
    }
  });
  
  return Array.from(categories);
}

/**
 * Get all simplified muscle categories in a consistent order
 * @returns {Array<string>} Array of category names
 */
export function getAllCategories() {
  return Object.keys(MUSCLE_CATEGORY_MAP);
}

/**
 * Get exercises grouped by simplified muscle category
 * @param {Array} exercises - Array of exercise objects with 'Primary Muscle' field
 * @returns {Object} Object with category names as keys and arrays of exercises as values
 */
export function groupExercisesByCategory(exercises) {
  return exercises.reduce((acc, exercise) => {
    const category = getMuscleCategory(exercise['Primary Muscle']);
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(exercise);
    return acc;
  }, {});
}

/**
 * Filter exercises by simplified muscle category
 * @param {Array} exercises - Array of exercise objects
 * @param {string} category - Simplified muscle category to filter by
 * @returns {Array} Filtered array of exercises
 */
export function filterExercisesByCategory(exercises, category) {
  if (category === 'all') {
    return exercises;
  }
  return exercises.filter(exercise => {
    const exerciseCategory = getMuscleCategory(exercise['Primary Muscle']);
    return exerciseCategory === category;
  });
}

/**
 * Reverse mapping: secondary muscle name to simplified category
 * Auto-generated from SECONDARY_MUSCLE_CATEGORY_MAP for efficient lookups
 */
export const SECONDARY_MUSCLE_TO_CATEGORY = Object.entries(SECONDARY_MUSCLE_CATEGORY_MAP).reduce((acc, [category, muscles]) => {
  muscles.forEach(muscle => {
    acc[muscle] = category;
  });
  return acc;
}, {});

/**
 * Parse secondary muscles from comma-separated string
 * @param {string} secondaryMuscles - Comma-separated list of secondary muscles
 * @returns {Array<string>} Array of trimmed muscle names
 */
export function parseSecondaryMuscles(secondaryMuscles) {
  if (!secondaryMuscles || typeof secondaryMuscles !== 'string') {
    return [];
  }
  return secondaryMuscles
    .split(',')
    .map(muscle => muscle.trim())
    .filter(muscle => muscle.length > 0);
}

/**
 * Get the simplified category for a given secondary muscle
 * @param {string} secondaryMuscle - The detailed secondary muscle name from exercise data
 * @returns {string|null} The simplified muscle category, or null if no mapping exists
 */
export function getSecondaryMuscleCategory(secondaryMuscle) {
  const cleanMuscle = secondaryMuscle.split('(')[0].trim();
  return SECONDARY_MUSCLE_TO_CATEGORY[cleanMuscle] || null;
}

/**
 * Get all unique simplified categories from secondary muscles
 * @param {string} secondaryMusclesString - Comma-separated list of secondary muscles
 * @returns {Array<string>} Array of unique simplified categories
 */
export function categorizeSecondaryMuscles(secondaryMusclesString) {
  const muscles = parseSecondaryMuscles(secondaryMusclesString);
  const categories = new Set();
  
  muscles.forEach(muscle => {
    const category = getSecondaryMuscleCategory(muscle);
    if (category) {
      categories.add(category);
    }
  });
  
  return Array.from(categories);
}
