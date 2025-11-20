/**
 * Muscle Category Mapping
 * Maps detailed primary muscle names to simplified muscle group categories for filtering
 * 
 * This maintains detailed muscle metadata in exercises while providing simplified
 * categories for user-facing filters and grouping.
 */

/**
 * Mapping of simplified muscle categories to their constituent detailed muscles
 */
export const MUSCLE_CATEGORY_MAP = {
  'Chest': ['Chest'],
  'Back': ['Lats', 'Traps', 'Back', 'Upper Back', 'Lower Back', 'Rhomboids', 'Erector Spinae'],
  'Biceps': ['Biceps', 'Forearms'],
  'Triceps': ['Triceps'],
  'Shoulders': ['Shoulders', 'Delts', 'Front Delts', 'Rear Delts'],
  'Core': ['Core', 'Obliques', 'Hip Flexors'],
  'Quads': ['Quads'],
  'Hamstrings': ['Hamstrings'],
  'Calves': ['Calves'],
  'Glutes': ['Glutes', 'Adductors'],
  'All': ['Full Body', 'All'],
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
