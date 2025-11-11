/**
 * Select optimal stretches for a workout based on muscle groups
 * Chooses stretches that target the same muscles used in the workout
 */

/**
 * Parse muscle groups from a comma-separated string
 * @param {string} muscleString - Comma-separated muscle groups
 * @returns {string[]} Array of muscle groups
 */
const parseMuscles = (muscleString) => {
  if (!muscleString || typeof muscleString !== 'string') return [];
  return muscleString
    .split(',')
    .map(m => m.trim())
    .filter(m => m.length > 0);
};

/**
 * Get all muscles targeted by a stretch
 * @param {Object} stretch - Stretch object
 * @returns {string[]} Array of all muscles (primary + secondary)
 */
const getAllMuscles = (stretch) => {
  const primary = parseMuscles(stretch.primaryMuscles);
  const secondary = parseMuscles(stretch.secondaryMuscles || '');
  return [...primary, ...secondary];
};

/**
 * Calculate relevance score for a stretch based on target muscles
 * @param {Object} stretch - Stretch object
 * @param {string[]} targetMuscles - Muscles to match
 * @returns {number} Relevance score (higher is better)
 */
const calculateRelevance = (stretch, targetMuscles) => {
  const stretchMuscles = getAllMuscles(stretch);
  let score = 0;
  
  for (const targetMuscle of targetMuscles) {
    for (const stretchMuscle of stretchMuscles) {
      // Exact match
      if (targetMuscle.toLowerCase() === stretchMuscle.toLowerCase()) {
        score += 10;
      }
      // Partial match (e.g., "Chest" matches "Upper Chest")
      else if (
        targetMuscle.toLowerCase().includes(stretchMuscle.toLowerCase()) ||
        stretchMuscle.toLowerCase().includes(targetMuscle.toLowerCase())
      ) {
        score += 5;
      }
    }
  }
  
  return score;
};

/**
 * Check if stretch is a full-body stretch
 * @param {Object} stretch - Stretch object
 * @returns {boolean} True if it's a full-body stretch
 */
const isFullBodyStretch = (stretch) => {
  const muscles = getAllMuscles(stretch);
  return muscles.some(m => m.toLowerCase().includes('full body'));
};

/**
 * Shuffle an array using Fisher-Yates algorithm
 * @param {Array} array - Array to shuffle
 * @returns {Array} Shuffled array
 */
const shuffleArray = (array) => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

/**
 * Select stretches for muscle groups from available stretches
 * @param {string[]} muscleGroups - Array of muscle groups targeted in workout
 * @param {string} type - Type of stretches ('dynamic' for warmup, 'static' for cooldown)
 * @param {number} count - Number of stretches to select
 * @param {Object[]} availableStretches - Pool of stretches to select from
 * @returns {Object[]} Selected stretches
 */
export const selectStretchesForMuscleGroups = (
  muscleGroups, 
  type, 
  count,
  availableStretches
) => {
  // Validate inputs
  if (!availableStretches || availableStretches.length === 0) {
    console.warn('No stretches available');
    return [];
  }
  
  if (!muscleGroups || muscleGroups.length === 0) {
    // No specific muscles, select random stretches
    return shuffleArray(availableStretches).slice(0, count);
  }

  // Score all stretches by relevance
  const scoredStretches = availableStretches.map(stretch => ({
    stretch,
    score: calculateRelevance(stretch, muscleGroups),
    isFullBody: isFullBodyStretch(stretch)
  }));

  // Separate relevant and full-body stretches
  const relevantStretches = scoredStretches
    .filter(s => s.score > 0)
    .sort((a, b) => b.score - a.score);
  
  const fullBodyStretches = scoredStretches
    .filter(s => s.isFullBody && s.score === 0);

  const selected = [];
  const usedIndices = new Set();

  // First, select the most relevant stretches
  for (const item of relevantStretches) {
    if (selected.length >= count) break;
    const index = availableStretches.indexOf(item.stretch);
    if (!usedIndices.has(index)) {
      selected.push(item.stretch);
      usedIndices.add(index);
    }
  }

  // If we don't have enough, add full-body stretches
  if (selected.length < count) {
    const shuffledFullBody = shuffleArray(fullBodyStretches.map(s => s.stretch));
    for (const stretch of shuffledFullBody) {
      if (selected.length >= count) break;
      const index = availableStretches.indexOf(stretch);
      if (!usedIndices.has(index)) {
        selected.push(stretch);
        usedIndices.add(index);
      }
    }
  }

  // If still not enough, add random stretches from remaining pool
  if (selected.length < count) {
    const remaining = availableStretches.filter((_, idx) => !usedIndices.has(idx));
    const shuffledRemaining = shuffleArray(remaining);
    for (const stretch of shuffledRemaining) {
      if (selected.length >= count) break;
      selected.push(stretch);
    }
  }

  // Shuffle the selected stretches for variety
  return shuffleArray(selected).slice(0, count);
};
