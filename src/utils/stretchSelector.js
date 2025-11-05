/**
 * Stretch Selection Algorithm
 * Intelligently selects stretches to ensure balanced coverage
 */

import { stretchesData } from '../data/stretches';

/**
 * Parse muscle groups from a comma-separated string
 * @param {string} muscleString - Comma-separated muscle groups
 * @returns {string[]} Array of muscle groups
 */
const parseMuscles = (muscleString) => {
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
 * Major body areas for full body coverage
 */
const BODY_AREAS = {
  NECK: ['Neck', 'Traps'],
  SHOULDERS: ['Delts', 'Front Delts', 'Rear Delts', 'Side Delts'],
  CHEST: ['Chest', 'Upper Chest', 'Lower Chest'],
  BACK: ['Back', 'Upper Back', 'Lower Back', 'Lats'],
  CORE: ['Core', 'Abs', 'Obliques'],
  ARMS: ['Biceps', 'Triceps', 'Forearms'],
  HIPS: ['Hip Flexors', 'Glutes', 'Groin', 'Inner Thighs'],
  LEGS_UPPER: ['Quads', 'Hamstrings'],
  LEGS_LOWER: ['Calves'],
};

/**
 * Check if a stretch covers a body area
 * @param {Object} stretch - Stretch object
 * @param {string[]} areaMusc les - Muscles in the body area
 * @returns {boolean} True if stretch targets that area
 */
const coversArea = (stretch, areaMuscles) => {
  const stretchMuscles = getAllMuscles(stretch);
  return stretchMuscles.some(muscle => 
    areaMuscles.some(areaMuscle => 
      muscle.includes(areaMuscle) || areaMuscle.includes(muscle)
    )
  );
};

/**
 * Select stretches for a full body routine
 * Ensures all major body areas are covered
 * @param {number} count - Number of stretches to select (default 10)
 * @returns {Object[]} Array of selected stretches
 */
export const selectFullBodyStretches = (count = 10) => {
  const selected = [];
  const coveredAreas = new Set();
  const bodyAreaKeys = Object.keys(BODY_AREAS);
  
  // First pass: Try to get one stretch for each body area
  for (const areaKey of bodyAreaKeys) {
    if (selected.length >= count) break;
    
    const areaMuscles = BODY_AREAS[areaKey];
    const candidates = stretchesData.filter(stretch => 
      coversArea(stretch, areaMuscles) &&
      !selected.includes(stretch)
    );
    
    if (candidates.length > 0) {
      // Randomly select one from candidates
      const randomIndex = Math.floor(Math.random() * candidates.length);
      selected.push(candidates[randomIndex]);
      coveredAreas.add(areaKey);
    }
  }
  
  // Second pass: Fill remaining slots with priority to uncovered areas
  while (selected.length < count) {
    const uncoveredAreas = bodyAreaKeys.filter(key => !coveredAreas.has(key));
    
    if (uncoveredAreas.length > 0) {
      // Prioritize uncovered areas
      const targetArea = uncoveredAreas[Math.floor(Math.random() * uncoveredAreas.length)];
      const areaMuscles = BODY_AREAS[targetArea];
      const candidates = stretchesData.filter(stretch => 
        coversArea(stretch, areaMuscles) &&
        !selected.includes(stretch)
      );
      
      if (candidates.length > 0) {
        const randomIndex = Math.floor(Math.random() * candidates.length);
        selected.push(candidates[randomIndex]);
        coveredAreas.add(targetArea);
      } else {
        // No more stretches for this area, mark as covered
        coveredAreas.add(targetArea);
      }
    } else {
      // All areas covered, add variety from any remaining stretches
      const remaining = stretchesData.filter(s => !selected.includes(s));
      if (remaining.length === 0) break;
      
      const randomIndex = Math.floor(Math.random() * remaining.length);
      selected.push(remaining[randomIndex]);
    }
  }
  
  // Shuffle the selected stretches for variety
  return shuffleArray(selected);
};

/**
 * Select stretches for custom muscle groups
 * @param {string[]} targetMuscles - Array of muscle groups to focus on
 * @param {number} count - Number of stretches to select (default 10)
 * @returns {Object[]} Array of selected stretches
 */
export const selectCustomStretches = (targetMuscles, count = 10) => {
  if (!targetMuscles || targetMuscles.length === 0) {
    // If no muscles specified, do full body
    return selectFullBodyStretches(count);
  }
  
  // Find stretches that target the specified muscles
  const relevant = stretchesData.filter(stretch => {
    const stretchMuscles = getAllMuscles(stretch);
    return targetMuscles.some(targetMuscle => 
      stretchMuscles.some(stretchMuscle => 
        stretchMuscle.includes(targetMuscle) || targetMuscle.includes(stretchMuscle)
      )
    );
  });
  
  if (relevant.length === 0) {
    console.warn('No stretches found for specified muscles, using full body selection');
    return selectFullBodyStretches(count);
  }
  
  // If we have fewer relevant stretches than requested, return all
  if (relevant.length <= count) {
    return shuffleArray(relevant);
  }
  
  // Randomly select from relevant stretches, trying to maximize muscle coverage
  const selected = [];
  const coveredMuscles = new Set();
  
  // First pass: Prioritize stretches that cover new target muscles
  for (const targetMuscle of targetMuscles) {
    if (selected.length >= count) break;
    
    const candidates = relevant.filter(stretch => {
      if (selected.includes(stretch)) return false;
      const stretchMuscles = getAllMuscles(stretch);
      return stretchMuscles.some(m => 
        m.includes(targetMuscle) || targetMuscle.includes(m)
      );
    });
    
    if (candidates.length > 0) {
      const randomIndex = Math.floor(Math.random() * candidates.length);
      selected.push(candidates[randomIndex]);
      getAllMuscles(candidates[randomIndex]).forEach(m => coveredMuscles.add(m));
    }
  }
  
  // Second pass: Fill remaining slots with any relevant stretches
  while (selected.length < count) {
    const remaining = relevant.filter(s => !selected.includes(s));
    if (remaining.length === 0) break;
    
    const randomIndex = Math.floor(Math.random() * remaining.length);
    selected.push(remaining[randomIndex]);
  }
  
  return shuffleArray(selected);
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
 * Get available muscle groups for custom selection
 * @returns {string[]} Array of unique muscle groups
 */
export const getAvailableMuscleGroups = () => {
  const muscles = new Set();
  
  stretchesData.forEach(stretch => {
    getAllMuscles(stretch).forEach(muscle => muscles.add(muscle));
  });
  
  return Array.from(muscles).sort();
};
