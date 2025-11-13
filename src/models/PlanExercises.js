/**
 * PlanExercises Model
 * 
 * Simplified flat data structure for exercises within plan days.
 * Contains id, plan_day_id, exercise_name, sets, reps, rest_seconds, order
 * 
 * This model provides CRUD operations for plan exercises with clear function names
 * and integrates with localStorage/Firebase storage patterns used in this app.
 */

import { getCurrentUserId } from '../utils/storage.js';
import { isGuestMode, getGuestData, setGuestData } from '../utils/guestStorage.js';
import { 
  savePlanExercisesToFirebase, 
  loadPlanExercisesFromFirebase 
} from '../utils/firebaseStorage.js';

/** Storage key for plan exercises in localStorage */
const PLAN_EXERCISES_KEY = 'goodlift_plan_exercises';

/**
 * Generate a unique plan exercise ID
 * @returns {string} Unique plan exercise ID
 */
const generateExerciseId = () => {
  return `exercise_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
};

/**
 * Get all plan exercises from storage
 * @returns {Promise<Array>} Array of plan exercise objects
 */
export const getPlanExercises = async () => {
  try {
    // Check if in guest mode first
    if (isGuestMode()) {
      const guestData = getGuestData('plan_exercises');
      return guestData || [];
    }

    const userId = getCurrentUserId();

    // Try Firebase first if user is authenticated
    if (userId) {
      try {
        const firebaseData = await loadPlanExercisesFromFirebase(userId);
        if (firebaseData) {
          // Update localStorage cache for offline access
          localStorage.setItem(PLAN_EXERCISES_KEY, JSON.stringify(firebaseData));
          return firebaseData;
        }
      } catch (error) {
        console.error('Firebase fetch failed, using localStorage:', error);
      }
    }

    // Fallback to localStorage
    const exercises = localStorage.getItem(PLAN_EXERCISES_KEY);
    return exercises ? JSON.parse(exercises) : [];
  } catch (error) {
    console.error('Error reading plan exercises:', error);
    return [];
  }
};

/**
 * Get exercises for a specific plan day
 * @param {string} planDayId - Plan day ID to get exercises for
 * @returns {Promise<Array>} Array of exercise objects for the specified day
 */
export const getExercisesForDay = async (planDayId) => {
  try {
    if (!planDayId) {
      throw new Error('Plan day ID is required');
    }

    const allExercises = await getPlanExercises();
    return allExercises
      .filter(e => e.plan_day_id === planDayId)
      .sort((a, b) => a.order - b.order);
  } catch (error) {
    console.error('Error getting exercises for day:', error);
    return [];
  }
};

/**
 * Get a specific exercise by ID
 * @param {string} exerciseId - Exercise ID to retrieve
 * @returns {Promise<Object|null>} Exercise object or null if not found
 */
export const getExercise = async (exerciseId) => {
  try {
    if (!exerciseId) {
      throw new Error('Exercise ID is required');
    }

    const exercises = await getPlanExercises();
    return exercises.find(e => e.id === exerciseId) || null;
  } catch (error) {
    console.error('Error getting exercise:', error);
    return null;
  }
};

/**
 * Add an exercise to a plan day
 * @param {string} planDayId - Plan day ID to add exercise to
 * @param {Object} exerciseData - Exercise data
 * @param {string} exerciseData.exercise_name - Exercise name
 * @param {number} exerciseData.sets - Number of sets
 * @param {number} exerciseData.reps - Number of reps per set
 * @param {number} [exerciseData.rest_seconds=60] - Rest time between sets in seconds
 * @param {number} [exerciseData.order] - Exercise order (auto-calculated if not provided)
 * @returns {Promise<Object>} Created exercise object with generated id
 */
export const addExerciseToDay = async (planDayId, exerciseData) => {
  try {
    if (!planDayId) {
      throw new Error('Plan day ID is required');
    }
    if (!exerciseData || !exerciseData.exercise_name) {
      throw new Error('Exercise name is required');
    }
    if (exerciseData.sets === undefined || exerciseData.sets < 1) {
      throw new Error('Sets must be at least 1');
    }
    if (exerciseData.reps === undefined || exerciseData.reps < 1) {
      throw new Error('Reps must be at least 1');
    }

    // Get existing exercises for this day to determine order
    const existingExercises = await getExercisesForDay(planDayId);
    const order = exerciseData.order !== undefined 
      ? exerciseData.order 
      : existingExercises.length > 0 
        ? Math.max(...existingExercises.map(e => e.order)) + 1 
        : 1;

    // Create new exercise
    const newExercise = {
      id: generateExerciseId(),
      plan_day_id: planDayId,
      exercise_name: exerciseData.exercise_name,
      sets: exerciseData.sets,
      reps: exerciseData.reps,
      rest_seconds: exerciseData.rest_seconds !== undefined ? exerciseData.rest_seconds : 60,
      order: order
    };

    // Get all exercises and add new one
    const allExercises = await getPlanExercises();
    allExercises.push(newExercise);

    const userId = getCurrentUserId();

    // Save based on mode
    if (isGuestMode()) {
      setGuestData('plan_exercises', allExercises);
    } else {
      localStorage.setItem(PLAN_EXERCISES_KEY, JSON.stringify(allExercises));
      
      // Sync to Firebase if user is logged in
      if (userId) {
        await savePlanExercisesToFirebase(userId, allExercises);
      }
    }

    return newExercise;
  } catch (error) {
    console.error('Error adding exercise to day:', error);
    throw error;
  }
};

/**
 * Update an exercise
 * @param {string} exerciseId - Exercise ID to update
 * @param {Object} updates - Fields to update (exercise_name, sets, reps, rest_seconds, order)
 * @returns {Promise<Object>} Updated exercise object
 */
export const updateExercise = async (exerciseId, updates) => {
  try {
    if (!exerciseId) {
      throw new Error('Exercise ID is required');
    }
    if (!updates || Object.keys(updates).length === 0) {
      throw new Error('Update data is required');
    }

    // Validate numeric fields if provided
    if (updates.sets !== undefined && updates.sets < 1) {
      throw new Error('Sets must be at least 1');
    }
    if (updates.reps !== undefined && updates.reps < 1) {
      throw new Error('Reps must be at least 1');
    }
    if (updates.rest_seconds !== undefined && updates.rest_seconds < 0) {
      throw new Error('Rest seconds cannot be negative');
    }

    const exercises = await getPlanExercises();
    const exerciseIndex = exercises.findIndex(e => e.id === exerciseId);
    
    if (exerciseIndex === -1) {
      throw new Error(`Exercise with ID ${exerciseId} not found`);
    }

    // Update the exercise (preserve id and plan_day_id)
    exercises[exerciseIndex] = {
      ...exercises[exerciseIndex],
      ...updates,
      id: exercises[exerciseIndex].id,
      plan_day_id: exercises[exerciseIndex].plan_day_id
    };

    const userId = getCurrentUserId();

    // Save based on mode
    if (isGuestMode()) {
      setGuestData('plan_exercises', exercises);
    } else {
      localStorage.setItem(PLAN_EXERCISES_KEY, JSON.stringify(exercises));
      
      // Sync to Firebase if user is logged in
      if (userId) {
        await savePlanExercisesToFirebase(userId, exercises);
      }
    }

    return exercises[exerciseIndex];
  } catch (error) {
    console.error('Error updating exercise:', error);
    throw error;
  }
};

/**
 * Remove an exercise
 * @param {string} exerciseId - Exercise ID to remove
 * @returns {Promise<boolean>} True if removed successfully
 */
export const removeExercise = async (exerciseId) => {
  try {
    if (!exerciseId) {
      throw new Error('Exercise ID is required');
    }

    const exercises = await getPlanExercises();
    const filteredExercises = exercises.filter(e => e.id !== exerciseId);
    
    if (filteredExercises.length === exercises.length) {
      throw new Error(`Exercise with ID ${exerciseId} not found`);
    }

    const userId = getCurrentUserId();

    // Save based on mode
    if (isGuestMode()) {
      setGuestData('plan_exercises', filteredExercises);
    } else {
      localStorage.setItem(PLAN_EXERCISES_KEY, JSON.stringify(filteredExercises));
      
      // Sync to Firebase if user is logged in
      if (userId) {
        await savePlanExercisesToFirebase(userId, filteredExercises);
      }
    }

    return true;
  } catch (error) {
    console.error('Error removing exercise:', error);
    throw error;
  }
};

/**
 * Remove all exercises for a specific plan day
 * Useful when deleting a day to clean up orphaned exercises
 * @param {string} planDayId - Plan day ID to remove all exercises for
 * @returns {Promise<number>} Number of exercises removed
 */
export const removeExercisesForDay = async (planDayId) => {
  try {
    if (!planDayId) {
      throw new Error('Plan day ID is required');
    }

    const exercises = await getPlanExercises();
    const filteredExercises = exercises.filter(e => e.plan_day_id !== planDayId);
    const removedCount = exercises.length - filteredExercises.length;

    if (removedCount > 0) {
      const userId = getCurrentUserId();

      // Save based on mode
      if (isGuestMode()) {
        setGuestData('plan_exercises', filteredExercises);
      } else {
        localStorage.setItem(PLAN_EXERCISES_KEY, JSON.stringify(filteredExercises));
        
        // Sync to Firebase if user is logged in
        if (userId) {
          await savePlanExercisesToFirebase(userId, filteredExercises);
        }
      }
    }

    return removedCount;
  } catch (error) {
    console.error('Error removing exercises for day:', error);
    throw error;
  }
};

/**
 * Reorder exercises for a plan day
 * Updates the order of all exercises in a day based on new ordering
 * @param {string} planDayId - Plan day ID
 * @param {Array<string>} exerciseIds - Array of exercise IDs in desired order
 * @returns {Promise<Array>} Updated exercises in new order
 */
export const reorderExercises = async (planDayId, exerciseIds) => {
  try {
    if (!planDayId) {
      throw new Error('Plan day ID is required');
    }
    if (!Array.isArray(exerciseIds)) {
      throw new Error('Exercise IDs must be an array');
    }

    const exercises = await getPlanExercises();
    
    // Update order for each exercise in the list
    exerciseIds.forEach((exerciseId, index) => {
      const exerciseIndex = exercises.findIndex(e => e.id === exerciseId && e.plan_day_id === planDayId);
      if (exerciseIndex !== -1) {
        exercises[exerciseIndex].order = index + 1;
      }
    });

    const userId = getCurrentUserId();

    // Save based on mode
    if (isGuestMode()) {
      setGuestData('plan_exercises', exercises);
    } else {
      localStorage.setItem(PLAN_EXERCISES_KEY, JSON.stringify(exercises));
      
      // Sync to Firebase if user is logged in
      if (userId) {
        await savePlanExercisesToFirebase(userId, exercises);
      }
    }

    // Return the reordered exercises for this day
    return getExercisesForDay(planDayId);
  } catch (error) {
    console.error('Error reordering exercises:', error);
    throw error;
  }
};
