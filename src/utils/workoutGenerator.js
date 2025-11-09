/**
 * Workout Generation Utilities
 * Standalone functions for generating workout sessions
 * Used by workout plan generator and can be called from non-React contexts
 * 
 * Based on WORKOUT-PLANNING-GUIDE.md principles:
 * - Moderate Volume: 4-7 sets per muscle group per session for optimal hypertrophy
 * - Agonist-antagonist superset pairing for time efficiency
 * - Compound exercises (60-70% of volume) + isolation exercises (30-40%)
 * - Flexible exercise counts based on session goals
 */

import { EXERCISES_PER_WORKOUT } from './constants.js';

/**
 * Recommended sets per exercise based on exercise type
 */
const SETS_CONFIG = {
  compound: 4, // Heavy compound movements: 4 sets
  isolation: 3, // Isolation exercises: 3 sets
  accessory: 3  // Accessory work: 3 sets
};

/**
 * Calculate optimal exercise count based on session type and experience
 * Per WORKOUT-PLANNING-GUIDE.md: 4-7 sets per muscle group per session
 * With 3-4 sets per exercise, that's roughly 6-10 total exercises per session
 * 
 * @param {string} sessionType - Workout type (upper, lower, full, etc.)
 * @param {string} experienceLevel - beginner, intermediate, advanced
 * @returns {number} Number of exercises for the session
 */
const getOptimalExerciseCount = (sessionType, experienceLevel = 'intermediate') => {
  const baseCount = {
    beginner: {
      full: 6,    // Full body: 6 exercises (lighter workload)
      upper: 6,   // Upper body: 6 exercises
      lower: 6,   // Lower body: 6 exercises
      push: 7,    // Push day: 7 exercises
      pull: 7,    // Pull day: 7 exercises
      legs: 7     // Leg day: 7 exercises
    },
    intermediate: {
      full: 8,    // Full body: 8 exercises
      upper: 8,   // Upper body: 8 exercises
      lower: 8,   // Lower body: 8 exercises
      push: 8,    // Push day: 8 exercises
      pull: 8,    // Pull day: 8 exercises
      legs: 8     // Leg day: 8 exercises
    },
    advanced: {
      full: 9,    // Full body: 9 exercises
      upper: 10,  // Upper body: 10 exercises
      lower: 10,  // Lower body: 10 exercises
      push: 10,   // Push day: 10 exercises
      pull: 10,   // Pull day: 10 exercises
      legs: 10    // Leg day: 10 exercises
    }
  };

  return baseCount[experienceLevel]?.[sessionType] || EXERCISES_PER_WORKOUT;
};

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
 * Per WORKOUT-PLANNING-GUIDE.md:
 * - Compound exercises: 60-70% of volume
 * - Isolation exercises: 30-40% of volume
 * - 4-7 sets per muscle group per session for moderate volume
 * 
 * @param {Array} allExercises - All available exercises
 * @param {string} type - Workout type
 * @param {string|Array} equipmentFilter - Equipment filter(s)
 * @param {string} experienceLevel - User experience level
 * @returns {Array} List of exercises for the workout
 */
const generatePPLExercises = (allExercises, type, equipmentFilter = 'all', experienceLevel = 'intermediate') => {
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
  const targetCount = getOptimalExerciseCount(type, experienceLevel);

  switch (type) {
    case 'push':
      // Push day: Chest, Shoulders, Triceps
      // Per guide: Emphasize compound movements (bench press, overhead press)
      workout.push(...getRandomExercises(exerciseDB, 'Chest', 3, workout, equipmentFilter));
      workout.push(...getRandomExercises(exerciseDB, 'Delts', 2, workout, equipmentFilter));
      workout.push(...getRandomExercises(exerciseDB, 'Triceps', 3, workout, equipmentFilter));
      break;

    case 'pull':
      // Pull day: Back (Lats), Biceps, Rear Delts
      // Per guide: Mix horizontal pulls (rows) and vertical pulls (pulldowns/pullups)
      workout.push(...getRandomExercises(exerciseDB, 'Lats', 4, workout, equipmentFilter));
      workout.push(...getRandomExercises(exerciseDB, 'Biceps', 3, workout, equipmentFilter));
      workout.push(...getRandomExercises(exerciseDB, 'Traps', 1, workout, equipmentFilter));
      break;

    case 'legs':
      // Legs day: Quads, Hamstrings, Glutes, Calves
      // Per guide: Compound multi-joint movements + isolation
      workout.push(...getRandomExercises(exerciseDB, 'Quads', 3, workout, equipmentFilter));
      workout.push(...getRandomExercises(exerciseDB, 'Hamstrings', 3, workout, equipmentFilter));
      workout.push(...getRandomExercises(exerciseDB, 'Glutes', 1, workout, equipmentFilter));
      workout.push(...getRandomExercises(exerciseDB, 'Calves', 1, workout, equipmentFilter));
      break;

    case 'upper':
      // Upper body: Chest, Back, Shoulders, Arms
      // Balanced upper body split with push/pull balance
      workout.push(...getRandomExercises(exerciseDB, 'Chest', 3, workout, equipmentFilter));
      workout.push(...getRandomExercises(exerciseDB, 'Lats', 3, workout, equipmentFilter));
      workout.push(...getRandomExercises(exerciseDB, 'Biceps', 1, workout, equipmentFilter));
      workout.push(...getRandomExercises(exerciseDB, 'Triceps', 1, workout, equipmentFilter));
      break;

    case 'lower': {
      // Lower body: Quads, Hamstrings, Core
      // Flexible distribution based on optimal volume
      const quadCount = Math.min(4, Math.floor(targetCount * 0.4)); // ~40% quads
      const hamCount = Math.min(3, Math.floor(targetCount * 0.3));  // ~30% hamstrings
      const coreCount = Math.max(1, targetCount - quadCount - hamCount - 1); // Rest to core, save 1 for glutes
      
      workout.push(...getRandomExercises(exerciseDB, 'Quads', quadCount, workout, equipmentFilter));
      workout.push(...getRandomExercises(exerciseDB, 'Hamstrings', hamCount, workout, equipmentFilter));
      workout.push(...getRandomExercises(exerciseDB, 'Glutes', 1, workout, equipmentFilter));
      if (coreCount > 0) {
        workout.push(...getRandomExercises(exerciseDB, 'Core', coreCount, workout, equipmentFilter));
      }
      break;
    }

    case 'full': {
      // Full body: Balanced selection across all major muscle groups
      // Per guide: Full body 3x/week = 6-9 sets per muscle per session
      // With 2 exercises per major muscle group × 3-4 sets = 6-8 sets
      const targetPerMuscle = Math.floor(targetCount / 4); // Divide among 4 major groups
      const remainder = targetCount - (targetPerMuscle * 4);
      
      workout.push(...getRandomExercises(exerciseDB, 'Chest', targetPerMuscle, workout, equipmentFilter));
      workout.push(...getRandomExercises(exerciseDB, 'Lats', targetPerMuscle, workout, equipmentFilter));
      workout.push(...getRandomExercises(exerciseDB, 'Quads', targetPerMuscle, workout, equipmentFilter));
      workout.push(...getRandomExercises(exerciseDB, 'Hamstrings', targetPerMuscle, workout, equipmentFilter));
      
      // Distribute remainder to core or other muscles
      if (remainder > 0) {
        workout.push(...getRandomExercises(exerciseDB, 'Core', remainder, workout, equipmentFilter));
      }
      break;
    }

    default:
      console.warn(`Unknown workout type: ${type}`);
      break;
  }

  // Adjust to target count (trim if over, fill if under)
  if (workout.length > targetCount) {
    workout = workout.slice(0, targetCount);
  } else if (workout.length < targetCount) {
    // Fill remaining slots with varied exercises
    const allMuscles = Object.keys(exerciseDB);
    while (workout.length < targetCount && allMuscles.length > 0) {
      const randomMuscle = allMuscles[Math.floor(Math.random() * allMuscles.length)];
      const filler = getRandomExercises(exerciseDB, randomMuscle, 1, workout, equipmentFilter);
      if (filler.length > 0) {
        workout.push(filler[0]);
      } else {
        break; // No more exercises available
      }
    }
  }

  return workout;
};

/**
 * Generate a complete workout with exercises paired into supersets
 * @param {Array} allExercises - Complete exercise database
 * @param {string} type - Workout type: 'upper', 'lower', 'full', 'push', 'pull', 'legs'
 * @param {string|Array} equipmentFilter - Equipment filter(s) to apply
 * @param {string} experienceLevel - User experience level: 'beginner', 'intermediate', 'advanced'
 * @returns {Array} Complete workout plan with exercises ordered for supersets
 */
export const generateStandardWorkout = (allExercises, type, equipmentFilter = 'all', experienceLevel = 'intermediate') => {
  if (!allExercises || allExercises.length === 0) {
    console.error("Exercise database is empty. Cannot generate workout.");
    return [];
  }

  const exerciseList = generatePPLExercises(allExercises, type, equipmentFilter, experienceLevel);
  const pairedList = pairExercises(exerciseList);

  return pairedList;
};
