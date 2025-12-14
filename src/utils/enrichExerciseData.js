/**
 * Enrich Exercise Data Utility
 * 
 * Enriches saved workout exercises with additional data from the exercise database,
 * specifically the 'image' field that may be missing from older saved workouts.
 */

import { EXERCISES_DATA_PATH } from './constants';

// Cache for exercise database
let exerciseCache = null;
let cachePromise = null;

/**
 * Load and cache the exercise database
 * @returns {Promise<Array>} Array of all exercises with complete data
 */
const loadExerciseDatabase = async () => {
  if (exerciseCache) {
    return exerciseCache;
  }
  
  if (cachePromise) {
    return cachePromise;
  }
  
  cachePromise = (async () => {
    try {
      const response = await fetch(EXERCISES_DATA_PATH);
      if (!response.ok) {
        throw new Error(`Failed to load exercises: ${response.status}`);
      }
      const exercises = await response.json();
      exerciseCache = exercises;
      return exercises;
    } catch (error) {
      console.error('Failed to load exercise database for enrichment:', error);
      cachePromise = null;
      return [];
    }
  })();
  
  return cachePromise;
};

/**
 * Find an exercise in the database by name
 * Handles both old and new naming formats
 * @param {Array} exerciseDB - Full exercise database
 * @param {string} exerciseName - Exercise name to find
 * @returns {Object|null} Exercise object or null if not found
 */
const findExerciseByName = (exerciseDB, exerciseName) => {
  if (!exerciseName || !exerciseDB) return null;
  
  // Try exact match first
  let match = exerciseDB.find(ex => ex['Exercise Name'] === exerciseName);
  if (match) return match;
  
  // Try case-insensitive match
  const lowerName = exerciseName.toLowerCase();
  match = exerciseDB.find(ex => ex['Exercise Name']?.toLowerCase() === lowerName);
  if (match) return match;
  
  // Try matching with equipment variations (e.g., "Bench Press" might match "Bench Press, Barbell")
  match = exerciseDB.find(ex => {
    const dbName = ex['Exercise Name']?.toLowerCase() || '';
    return dbName.startsWith(lowerName) || lowerName.startsWith(dbName.split(',')[0]?.trim().toLowerCase());
  });
  
  return match || null;
};

/**
 * Enrich a single exercise object with data from the exercise database
 * @param {Object} exercise - Exercise object to enrich
 * @param {Array} exerciseDB - Full exercise database
 * @returns {Object} Enriched exercise object
 */
export const enrichExerciseWithImageData = (exercise, exerciseDB) => {
  if (!exercise || !exerciseDB) return exercise;
  
  // If exercise already has an image field, don't override it
  if (exercise.image) return exercise;
  
  const exerciseName = exercise['Exercise Name'] || exercise.name;
  if (!exerciseName) return exercise;
  
  // Find the exercise in the database
  const dbExercise = findExerciseByName(exerciseDB, exerciseName);
  if (!dbExercise) {
    console.warn(`[enrichExerciseWithImageData] Could not find exercise in database: ${exerciseName}`);
    return exercise;
  }
  
  // Enrich with image field and any other missing fields
  return {
    ...exercise,
    image: dbExercise.image,
    // Also copy over other fields that might be missing
    'Primary Muscle': exercise['Primary Muscle'] || dbExercise['Primary Muscle'],
    'Secondary Muscles': exercise['Secondary Muscles'] || dbExercise['Secondary Muscles'],
    'Equipment': exercise['Equipment'] || dbExercise['Equipment'],
    'Exercise Type': exercise['Exercise Type'] || dbExercise['Exercise Type'],
  };
};

/**
 * Enrich an array of exercises with image data
 * @param {Array} exercises - Array of exercise objects
 * @returns {Promise<Array>} Array of enriched exercise objects
 */
export const enrichExercisesWithImageData = async (exercises) => {
  if (!Array.isArray(exercises)) return exercises;
  
  try {
    const exerciseDB = await loadExerciseDatabase();
    if (!exerciseDB || exerciseDB.length === 0) {
      console.warn('[enrichExercisesWithImageData] Exercise database not available');
      return exercises;
    }
    
    return exercises.map(ex => enrichExerciseWithImageData(ex, exerciseDB));
  } catch (error) {
    console.error('[enrichExercisesWithImageData] Error enriching exercises:', error);
    return exercises;
  }
};

/**
 * Enrich a workout object's exercises with image data
 * @param {Object} workout - Workout object with exercises array
 * @returns {Promise<Object>} Workout object with enriched exercises
 */
export const enrichWorkoutExercises = async (workout) => {
  if (!workout) return workout;
  
  // Handle both workout.exercises array and direct array of exercises
  if (Array.isArray(workout.exercises)) {
    const enrichedExercises = await enrichExercisesWithImageData(workout.exercises);
    return {
      ...workout,
      exercises: enrichedExercises,
    };
  } else if (Array.isArray(workout)) {
    // Direct array of exercises (used in WorkoutScreen)
    return enrichExercisesWithImageData(workout);
  }
  
  return workout;
};

/**
 * Clear the exercise database cache
 * Useful for testing or if the database is updated
 */
export const clearExerciseCache = () => {
  exerciseCache = null;
  cachePromise = null;
};
