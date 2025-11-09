/**
 * Workout Generation Utilities
 * Standalone functions for generating workout sessions
 * Used by workout plan generator and can be called from non-React contexts
 */

import { EXERCISES_PER_WORKOUT } from './constants.js';

/**
 * Map of opposing muscle groups for optimal superset pairing
 */
const OPPOSING_MUSCLES = {
  'Chest': 'Lats',
  'Lats': 'Chest',
  'Quads': 'Hamstrings',
  'Hamstrings': 'Quads',
  'Biceps': 'Triceps',
  'Triceps': 'Biceps',
  'Shoulders': 'Lats',
};

/**
 * Get random exercises from a muscle group with equipment filtering
 */
const getRandomExercises = (exerciseDB, muscle, count, currentWorkout = [], equipmentFilter = 'all') => {
  // Filter out exercises already in the workout
  let available = (exerciseDB[muscle] || []).filter(ex => 
    !currentWorkout.some(wEx => wEx['Exercise Name'] === ex['Exercise Name'])
  );
  
  // Apply equipment filter if specified
  if (equipmentFilter !== 'all') {
    const filters = Array.isArray(equipmentFilter) ? equipmentFilter : [equipmentFilter];
    
    available = available.filter(ex => {
      const equipment = ex.Equipment.toLowerCase();
      return filters.some(filter => {
        const normalizedFilter = filter.toLowerCase();
        // Handle special equipment naming cases
        if (normalizedFilter === 'cable machine') {
          return equipment.includes('cable');
        }
        if (normalizedFilter === 'dumbbells') {
          return equipment.includes('dumbbell');
        }
        return equipment.includes(normalizedFilter);
      });
    });
  }
  
  if (available.length < count) {
    console.warn(`Insufficient exercises for ${muscle}. Available: ${available.length}, Requested: ${count}`);
    return available;
  }
  
  // Fisher-Yates shuffle for better randomization
  const shuffled = [...available];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  
  return shuffled.slice(0, count);
};

/**
 * Pair exercises into supersets based on opposing muscle groups
 */
const pairExercises = (exercises) => {
  const pairings = [];
  const remaining = [...exercises];

  while (remaining.length >= 2) {
    const exercise1 = remaining.shift();
    const primaryMuscle1 = exercise1['Primary Muscle'].split('(')[0].trim();
    const opposingMuscle = OPPOSING_MUSCLES[primaryMuscle1];

    let bestPairIndex = -1;
    
    // First, try to find an opposing muscle group
    if (opposingMuscle) {
      bestPairIndex = remaining.findIndex(ex => 
        ex['Primary Muscle'].includes(opposingMuscle)
      );
    }
    
    // If no opposing muscle found, pair with a different muscle group
    if (bestPairIndex === -1) {
      bestPairIndex = remaining.findIndex(ex => 
        !ex['Primary Muscle'].includes(primaryMuscle1)
      );
    }
    
    // Fallback: pair with any remaining exercise
    if (bestPairIndex === -1) {
      bestPairIndex = 0;
    }

    const exercise2 = remaining.splice(bestPairIndex, 1)[0];
    pairings.push(exercise1, exercise2);
  }
  
  // Add any remaining unpaired exercise
  if (remaining.length > 0) {
    pairings.push(...remaining);
  }
  
  return pairings;
};

/**
 * Generate exercise list for PPL (Push/Pull/Legs) split
 */
const generatePPLExercises = (allExercises, type, equipmentFilter = 'all') => {
  // Group exercises by primary muscle
  const exerciseDB = allExercises.reduce((acc, exercise) => {
    const primaryMuscle = exercise['Primary Muscle'].split('(')[0].trim();
    if (!acc[primaryMuscle]) {
      acc[primaryMuscle] = [];
    }
    acc[primaryMuscle].push(exercise);
    return acc;
  }, {});

  let workout = [];

  switch (type) {
    case 'push':
      // Push day: Chest, Shoulders, Triceps
      workout.push(...getRandomExercises(exerciseDB, 'Chest', 3, workout, equipmentFilter));
      workout.push(...getRandomExercises(exerciseDB, 'Delts', 2, workout, equipmentFilter));
      workout.push(...getRandomExercises(exerciseDB, 'Triceps', 3, workout, equipmentFilter));
      break;

    case 'pull':
      // Pull day: Back (Lats), Biceps, Rear Delts
      workout.push(...getRandomExercises(exerciseDB, 'Lats', 4, workout, equipmentFilter));
      workout.push(...getRandomExercises(exerciseDB, 'Biceps', 3, workout, equipmentFilter));
      workout.push(...getRandomExercises(exerciseDB, 'Traps', 1, workout, equipmentFilter));
      break;

    case 'legs':
      // Legs day: Quads, Hamstrings, Glutes, Calves
      workout.push(...getRandomExercises(exerciseDB, 'Quads', 3, workout, equipmentFilter));
      workout.push(...getRandomExercises(exerciseDB, 'Hamstrings', 3, workout, equipmentFilter));
      workout.push(...getRandomExercises(exerciseDB, 'Glutes', 1, workout, equipmentFilter));
      workout.push(...getRandomExercises(exerciseDB, 'Calves', 1, workout, equipmentFilter));
      break;

    case 'upper':
      // Upper body: Chest, Back, Shoulders, Arms
      workout.push(...getRandomExercises(exerciseDB, 'Chest', 3, workout, equipmentFilter));
      workout.push(...getRandomExercises(exerciseDB, 'Lats', 3, workout, equipmentFilter));
      workout.push(...getRandomExercises(exerciseDB, 'Biceps', 1, workout, equipmentFilter));
      workout.push(...getRandomExercises(exerciseDB, 'Triceps', 1, workout, equipmentFilter));
      break;

    case 'lower': {
      // Lower body: Quads, Hamstrings, Core
      const quadCount = Math.floor(Math.random() * 2) + 3; // 3-4 exercises
      const hamCount = Math.floor(Math.random() * 2) + 2; // 2-3 exercises
      const coreCount = EXERCISES_PER_WORKOUT - quadCount - hamCount;

      workout.push(...getRandomExercises(exerciseDB, 'Quads', quadCount, workout, equipmentFilter));
      workout.push(...getRandomExercises(exerciseDB, 'Hamstrings', hamCount, workout, equipmentFilter));
      if (coreCount > 0) {
        workout.push(...getRandomExercises(exerciseDB, 'Core', coreCount, workout, equipmentFilter));
      }
      break;
    }

    case 'full': {
      // Full body: Balanced selection across all major muscle groups
      const hamFullCount = Math.floor(Math.random() * 2) + 1; // 1-2 exercises
      const coreFullCount = EXERCISES_PER_WORKOUT - 2 - 2 - 2 - hamFullCount;

      workout.push(...getRandomExercises(exerciseDB, 'Chest', 2, workout, equipmentFilter));
      workout.push(...getRandomExercises(exerciseDB, 'Lats', 2, workout, equipmentFilter));
      workout.push(...getRandomExercises(exerciseDB, 'Quads', 2, workout, equipmentFilter));
      workout.push(...getRandomExercises(exerciseDB, 'Hamstrings', hamFullCount, workout, equipmentFilter));
      if (coreFullCount > 0) {
        workout.push(...getRandomExercises(exerciseDB, 'Core', coreFullCount, workout, equipmentFilter));
      }
      break;
    }

    default:
      console.warn(`Unknown workout type: ${type}`);
      break;
  }

  // Fill remaining slots if needed (safety measure)
  while (workout.length < EXERCISES_PER_WORKOUT && workout.length > 0) {
    const allMuscles = Object.keys(exerciseDB);
    if (allMuscles.length === 0) break;

    const randomMuscle = allMuscles[Math.floor(Math.random() * allMuscles.length)];
    const filler = getRandomExercises(exerciseDB, randomMuscle, 1, workout, equipmentFilter);
    if (filler.length > 0) {
      workout.push(filler[0]);
    } else {
      break; // No more exercises available
    }
  }

  return workout.slice(0, EXERCISES_PER_WORKOUT);
};

/**
 * Generate a complete workout with exercises paired into supersets
 * @param {Array} allExercises - Complete exercise database
 * @param {string} type - Workout type: 'upper', 'lower', 'full', 'push', 'pull', 'legs'
 * @param {string|Array} equipmentFilter - Equipment filter(s) to apply
 * @returns {Array} Complete workout plan with exercises ordered for supersets
 */
export const generateStandardWorkout = (allExercises, type, equipmentFilter = 'all') => {
  if (!allExercises || allExercises.length === 0) {
    console.error("Exercise database is empty. Cannot generate workout.");
    return [];
  }

  const exerciseList = generatePPLExercises(allExercises, type, equipmentFilter);
  const pairedList = pairExercises(exerciseList);

  return pairedList;
};
