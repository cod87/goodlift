import { useState, useEffect, useCallback } from 'react';
import { EXERCISES_DATA_PATH, EXERCISES_PER_WORKOUT } from '../utils/constants';

/**
 * Map of opposing muscle groups for optimal superset pairing
 * Pairing opposing muscles allows one muscle group to rest while the other works
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
 * Custom hook for generating randomized workout plans
 * Loads exercise database and provides functions to generate workouts based on type and equipment
 * @returns {Object} Workout generation functions and exercise data
 */
export const useWorkoutGenerator = () => {
  const [exerciseDB, setExerciseDB] = useState({});
  const [allExercises, setAllExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load exercises from JSON on mount
  useEffect(() => {
    const loadExercises = async () => {
      try {
        setLoading(true);
        const response = await fetch(EXERCISES_DATA_PATH);
        if (!response.ok) {
          throw new Error(`Failed to load exercises: ${response.status}`);
        }
        const exercises = await response.json();
        
        setAllExercises(exercises);
        
        // Group exercises by primary muscle for efficient lookup
        const grouped = exercises.reduce((acc, exercise) => {
          const primaryMuscle = exercise['Primary Muscle'].split('(')[0].trim();
          if (!acc[primaryMuscle]) {
            acc[primaryMuscle] = [];
          }
          acc[primaryMuscle].push(exercise);
          return acc;
        }, {});
        
        setExerciseDB(grouped);
        setLoading(false);
      } catch (err) {
        console.error("Failed to load exercise data:", err);
        setError(err.message);
        setLoading(false);
      }
    };

    loadExercises();
  }, []);

  /**
   * Get random exercises from a specific muscle group with equipment filtering
   * @param {string} muscle - The muscle group to select from
   * @param {number} count - Number of exercises to return
   * @param {Array} currentWorkout - Already selected exercises to avoid duplicates
   * @param {string|Array} equipmentFilter - Equipment type(s) to filter by, or 'all'
   * @returns {Array} Array of selected exercise objects
   */
  const getRandomExercises = useCallback((muscle, count, currentWorkout = [], equipmentFilter = 'all') => {
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
  }, [exerciseDB]);

  /**
   * Generate exercise list based on workout type and equipment
   * @param {string} type - Workout type: 'upper', 'lower', or 'full'
   * @param {string|Array} equipmentFilter - Equipment filter(s) to apply
   * @param {number} totalExercises - Total number of exercises to generate
   * @returns {Array} Array of selected exercises for the workout
   */
  const generateExerciseList = useCallback((type, equipmentFilter = 'all', totalExercises = EXERCISES_PER_WORKOUT) => {
    let workout = [];
    
    switch (type) {
      case 'upper': {
        // Upper body: Proportional distribution
        const upperChestCount = Math.ceil(totalExercises * 0.375); // ~3/8
        const upperLatCount = Math.ceil(totalExercises * 0.375); // ~3/8
        const upperBicepsCount = Math.floor(totalExercises * 0.125); // ~1/8
        const upperTricepsCount = totalExercises - upperChestCount - upperLatCount - upperBicepsCount; // remainder
        
        workout.push(...getRandomExercises('Chest', upperChestCount, workout, equipmentFilter));
        workout.push(...getRandomExercises('Lats', upperLatCount, workout, equipmentFilter));
        workout.push(...getRandomExercises('Biceps', upperBicepsCount, workout, equipmentFilter));
        workout.push(...getRandomExercises('Triceps', upperTricepsCount, workout, equipmentFilter));
        break;
      }
        
      case 'lower': {
        // Lower body: Variable quads/hams, with optional core
        const lowerQuadRatio = 0.375 + Math.random() * 0.125; // 37.5% to 50%
        const quadCount = Math.ceil(totalExercises * lowerQuadRatio);
        const hamCount = Math.floor(totalExercises * 0.25) + Math.floor(Math.random() * 2); // ~25% + variance
        const coreCount = totalExercises - quadCount - hamCount;
        
        workout.push(...getRandomExercises('Quads', quadCount, workout, equipmentFilter));
        workout.push(...getRandomExercises('Hamstrings', hamCount, workout, equipmentFilter));
        if (coreCount > 0) {
          workout.push(...getRandomExercises('Core', coreCount, workout, equipmentFilter));
        }
        break;
      }
      
      case 'full': {
        // Full body: Balanced selection across all major muscle groups
        const chestCount = Math.ceil(totalExercises * 0.25); // ~25%
        const latCount = Math.ceil(totalExercises * 0.25); // ~25%
        const quadCount = Math.ceil(totalExercises * 0.25); // ~25%
        const hamCount = Math.floor(totalExercises * 0.125) + Math.floor(Math.random() * 2); // ~12.5% + variance
        const coreCount = totalExercises - chestCount - latCount - quadCount - hamCount;
        
        workout.push(...getRandomExercises('Chest', chestCount, workout, equipmentFilter));
        workout.push(...getRandomExercises('Lats', latCount, workout, equipmentFilter));
        workout.push(...getRandomExercises('Quads', quadCount, workout, equipmentFilter));
        workout.push(...getRandomExercises('Hamstrings', hamCount, workout, equipmentFilter));
        if (coreCount > 0) {
          workout.push(...getRandomExercises('Core', coreCount, workout, equipmentFilter));
        }
        break;
      }
      
      case 'push': {
        // Push: Chest, shoulders (delts), triceps - pushing movements
        const pushChestCount = Math.ceil(totalExercises * 0.375); // ~37.5%
        const pushDeltCount = Math.ceil(totalExercises * 0.375); // ~37.5%
        const pushTricepsCount = totalExercises - pushChestCount - pushDeltCount;
        
        workout.push(...getRandomExercises('Chest', pushChestCount, workout, equipmentFilter));
        workout.push(...getRandomExercises('Delts', pushDeltCount, workout, equipmentFilter));
        workout.push(...getRandomExercises('Triceps', pushTricepsCount, workout, equipmentFilter));
        break;
      }
      
      case 'pull': {
        // Pull: Back (lats), rear delts, biceps - pulling movements
        const pullLatCount = Math.ceil(totalExercises * 0.5); // ~50%
        const pullRearDeltCount = Math.ceil(totalExercises * 0.25); // ~25%
        const pullBicepsCount = totalExercises - pullLatCount - pullRearDeltCount;
        
        workout.push(...getRandomExercises('Lats', pullLatCount, workout, equipmentFilter));
        workout.push(...getRandomExercises('Rear Delts', pullRearDeltCount, workout, equipmentFilter));
        workout.push(...getRandomExercises('Biceps', pullBicepsCount, workout, equipmentFilter));
        break;
      }
      
      case 'legs': {
        // Legs: Similar to lower body but can include more variety
        const legsQuadRatio = 0.375 + Math.random() * 0.125; // 37.5% to 50%
        const legsQuadCount = Math.ceil(totalExercises * legsQuadRatio);
        const legsHamCount = Math.floor(totalExercises * 0.25) + Math.floor(Math.random() * 2);
        const legsCoreCount = totalExercises - legsQuadCount - legsHamCount;
        
        workout.push(...getRandomExercises('Quads', legsQuadCount, workout, equipmentFilter));
        workout.push(...getRandomExercises('Hamstrings', legsHamCount, workout, equipmentFilter));
        if (legsCoreCount > 0) {
          workout.push(...getRandomExercises('Core', legsCoreCount, workout, equipmentFilter));
        }
        break;
      }
      
      default:
        console.warn(`Unknown workout type: ${type}`);
        break;
    }
    
    // Fill remaining slots if needed (safety measure)
    while (workout.length < totalExercises && workout.length > 0) {
      const allMuscles = Object.keys(exerciseDB);
      if (allMuscles.length === 0) break;
      
      const randomMuscle = allMuscles[Math.floor(Math.random() * allMuscles.length)];
      const filler = getRandomExercises(randomMuscle, 1, workout, equipmentFilter);
      if (filler.length > 0) {
        workout.push(filler[0]);
      } else {
        break; // No more exercises available
      }
    }
    
    return workout.slice(0, totalExercises);
  }, [exerciseDB, getRandomExercises]);

  /**
   * Pair exercises into supersets based on configuration and opposing muscle groups
   * Optimally pairs exercises to allow for active recovery between sets
   * @param {Array} exercises - Array of exercise objects to pair
   * @param {Array} supersetConfig - Array defining exercises per superset, e.g., [3, 3, 2]
   * @returns {Array} Array of exercises ordered for superset execution
   */
  const pairExercises = useCallback((exercises, supersetConfig = [2, 2, 2, 2]) => {
    const pairings = [];
    const remaining = [...exercises];
    
    // Process each superset according to configuration
    for (const supersetSize of supersetConfig) {
      if (remaining.length === 0) break;
      
      const supersetExercises = [];
      
      // Get first exercise for this superset
      if (remaining.length > 0) {
        const exercise1 = remaining.shift();
        supersetExercises.push(exercise1);
        const primaryMuscle1 = exercise1['Primary Muscle'].split('(')[0].trim();
        const opposingMuscle = OPPOSING_MUSCLES[primaryMuscle1];
        
        // Fill the rest of the superset
        for (let i = 1; i < supersetSize && remaining.length > 0; i++) {
          let bestPairIndex = -1;
          
          // For the second exercise, try to find an opposing muscle group
          if (i === 1 && opposingMuscle) {
            bestPairIndex = remaining.findIndex(ex => 
              ex['Primary Muscle'].includes(opposingMuscle)
            );
          }
          
          // If no opposing muscle found, pair with a different muscle group
          if (bestPairIndex === -1) {
            bestPairIndex = remaining.findIndex(ex => 
              !supersetExercises.some(se => se['Primary Muscle'].includes(ex['Primary Muscle'].split('(')[0].trim()))
            );
          }
          
          // Fallback: take the next available exercise
          if (bestPairIndex === -1) {
            bestPairIndex = 0;
          }
          
          const exercise = remaining.splice(bestPairIndex, 1)[0];
          supersetExercises.push(exercise);
        }
      }
      
      pairings.push(...supersetExercises);
    }
    
    // Add any remaining unpaired exercises
    if (remaining.length > 0) {
      pairings.push(...remaining);
    }
    
    return pairings;
  }, []);

  /**
   * Generate a complete workout plan with exercises paired into supersets
   * @param {string} type - Workout type: 'upper', 'lower', or 'full'
   * @param {string|Array} equipmentFilter - Equipment filter(s) to apply
   * @param {Array} supersetConfig - Array defining exercises per superset, e.g., [3, 3, 2]
   * @returns {Array} Complete workout plan with exercises ordered for supersets
   */
  const generateWorkout = useCallback((type, equipmentFilter = 'all', supersetConfig = [2, 2, 2, 2]) => {
    if (Object.keys(exerciseDB).length === 0) {
      console.error("Exercise database is empty. Cannot generate workout.");
      return [];
    }
    
    // Calculate total exercises needed based on superset config
    const totalExercises = supersetConfig.reduce((sum, count) => sum + count, 0);
    
    const exerciseList = generateExerciseList(type, equipmentFilter, totalExercises);
    const pairedList = pairExercises(exerciseList, supersetConfig);
    
    return pairedList;
  }, [exerciseDB, generateExerciseList, pairExercises]);

  return {
    generateWorkout,
    allExercises,
    exerciseDB,
    loading,
    error,
  };
};
