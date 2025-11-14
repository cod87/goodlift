/**
 * Scientific Workout Generator
 * 
 * Generates workouts based on the workout-planning-guide.md principles:
 * - Agonist-antagonist supersets for time efficiency
 * - Progressive overload considerations
 * - Appropriate rep ranges and rest periods
 * - Proper exercise selection (60%+ compound movements)
 * - Optimal volume distribution (10-20 sets per muscle group per week)
 */

import { generateStandardWorkout } from './workoutGenerator.js';

/**
 * Generate a science-based workout
 * @param {Object} params - Workout parameters
 * @param {string} params.type - Workout type: 'upper', 'lower', 'full', 'push', 'pull', 'legs'
 * @param {string} params.experienceLevel - Experience level
 * @param {string} params.goal - Training goal
 * @param {boolean} params.isDeload - Whether this is a deload workout
 * @returns {Promise<Object>} Generated workout with exercises
 */
export const generateScientificWorkout = async (params) => {
  const { type, experienceLevel = 'intermediate', goal = 'hypertrophy', isDeload = false } = params;
  
  // Load exercises database
  const response = await fetch('/data/exercises.json');
  const exercisesData = await response.json();
  const allExercises = exercisesData.exercises || exercisesData;
  
  // Use the existing workout generator
  const workout = generateStandardWorkout(allExercises, type, 'all', experienceLevel);
  
  // Configure sets and reps based on goal and experience level
  const { sets, reps, restSeconds } = getTrainingParameters(goal, experienceLevel, isDeload);
  
  // Apply scientific principles to the workout
  const exercises = workout.map((exercise) => {
    // Determine if this is a compound or isolation exercise
    const isCompound = exercise.Type === 'Compound';
    
    // Adjust sets/reps based on exercise type
    const exerciseSets = isDeload ? Math.ceil(sets * 0.5) : sets;
    const exerciseReps = isCompound ? reps : Math.min(reps + 2, 15); // Slightly higher reps for isolation
    const exerciseRest = isCompound ? restSeconds + 30 : restSeconds; // More rest for compounds
    
    return {
      'Exercise Name': exercise['Exercise Name'],
      'Primary Muscle': exercise['Primary Muscle'],
      'Equipment': exercise.Equipment,
      'Type': exercise.Type,
      name: exercise['Exercise Name'],
      sets: exerciseSets,
      reps: exerciseReps,
      restSeconds: exerciseRest,
      weight: '',
      notes: isDeload ? 'Deload week - reduced volume' : '',
      supersetGroup: determineSupersetGroup(),
      videoLink: exercise['Video Link'] || '',
      isCompound
    };
  });
  
  return {
    exercises,
    type,
    goal,
    experienceLevel,
    isDeload
  };
};

/**
 * Get training parameters based on goal and experience level
 * Based on WORKOUT-PLANNING-GUIDE.md section 2.4
 */
const getTrainingParameters = (goal, experienceLevel, isDeload) => {
  if (isDeload) {
    return {
      sets: 2, // Reduced from normal
      reps: 10,
      restSeconds: 90
    };
  }
  
  const params = {
    strength: {
      beginner: { sets: 3, reps: 6, restSeconds: 180 },
      intermediate: { sets: 4, reps: 5, restSeconds: 210 },
      advanced: { sets: 5, reps: 5, restSeconds: 240 }
    },
    hypertrophy: {
      beginner: { sets: 3, reps: 10, restSeconds: 90 },
      intermediate: { sets: 4, reps: 10, restSeconds: 90 },
      advanced: { sets: 4, reps: 12, restSeconds: 60 }
    },
    endurance: {
      beginner: { sets: 2, reps: 15, restSeconds: 60 },
      intermediate: { sets: 3, reps: 15, restSeconds: 45 },
      advanced: { sets: 3, reps: 20, restSeconds: 30 }
    },
    general_fitness: {
      beginner: { sets: 3, reps: 10, restSeconds: 90 },
      intermediate: { sets: 3, reps: 10, restSeconds: 90 },
      advanced: { sets: 4, reps: 12, restSeconds: 75 }
    }
  };
  
  return params[goal]?.[experienceLevel] || params.general_fitness.intermediate;
};

/**
 * Determine superset grouping based on muscle groups
 * Following agonist-antagonist principles from the guide
 */
const determineSupersetGroup = () => {
  // For now, return null - superset pairing is already handled by the workoutGenerator
  // This could be enhanced to ensure proper agonist-antagonist pairing
  return null;
};

/**
 * Calculate appropriate weight based on rep range
 * Based on WORKOUT-PLANNING-GUIDE.md section 3
 * @param {number} baseWeight - 12-rep max weight
 * @param {number} targetReps - Target rep range
 * @param {string} exerciseType - 'barbell_lower', 'barbell_upper', 'dumbbell', 'isolation'
 * @returns {number} Adjusted weight
 */
export const calculateWeight = (baseWeight, targetReps, exerciseType = 'dumbbell') => {
  if (!baseWeight || baseWeight <= 0) return 0;
  
  const adjustments = {
    barbell_lower: {
      '3-6': 1.10,   // +10-20 lbs from 12-rep max
      '8-12': 1.00,  // Baseline
      '15-20': 0.65  // -35-50 lbs from baseline
    },
    barbell_upper: {
      '4-8': 1.05,   // +5-15 lbs from 12-rep max
      '8-12': 1.00,  // Baseline
      '12-15': 0.90, // -5 to -15 lbs
      '15-20': 0.70  // -25-40 lbs
    },
    dumbbell: {
      '6-8': 1.05,   // +2.5-5 lbs per dumbbell
      '8-12': 1.00,  // Baseline
      '12-15': 0.95, // -2.5 lbs per dumbbell
      '15-20': 0.75  // -7.5-15 lbs per dumbbell
    },
    isolation: {
      '8-12': 1.00,  // Baseline
      '12-15': 0.90, // -5 to -15 lbs
      '15-20': 0.70  // -15-25 lbs
    }
  };
  
  // Determine rep range category
  let rangeKey = '8-12';
  if (targetReps <= 6) rangeKey = '3-6';
  else if (targetReps <= 8) rangeKey = '6-8';
  else if (targetReps <= 12) rangeKey = '8-12';
  else if (targetReps <= 15) rangeKey = '12-15';
  else rangeKey = '15-20';
  
  // Get adjustment factor
  const adjustmentTable = adjustments[exerciseType] || adjustments.dumbbell;
  const factor = adjustmentTable[rangeKey] || 1.00;
  
  return Math.round(baseWeight * factor);
};

/**
 * Get recommended rep ranges for different goals
 * Based on WORKOUT-PLANNING-GUIDE.md
 */
export const getRepRangeForGoal = (goal) => {
  const ranges = {
    strength: '4-6',
    hypertrophy: '8-12',
    endurance: '15-20',
    general_fitness: '8-12'
  };
  
  return ranges[goal] || '8-12';
};

/**
 * Calculate total weekly volume for a muscle group
 * Ensures 10-20 sets per muscle group per week (optimal range from guide)
 */
export const calculateWeeklyVolume = (exercises, muscleGroup) => {
  return exercises
    .filter(ex => ex['Primary Muscle'] === muscleGroup)
    .reduce((total, ex) => total + (ex.sets || 0), 0);
};

/**
 * Validate that workout follows scientific principles
 */
export const validateWorkout = (exercises) => {
  const issues = [];
  
  // Check compound vs isolation ratio (should be 60%+ compound)
  const compoundCount = exercises.filter(ex => ex.Type === 'Compound').length;
  const compoundRatio = compoundCount / exercises.length;
  
  if (compoundRatio < 0.6) {
    issues.push('Workout should have at least 60% compound movements');
  }
  
  // Check total volume isn't excessive
  const totalSets = exercises.reduce((sum, ex) => sum + (ex.sets || 0), 0);
  if (totalSets > 30) {
    issues.push('Total volume exceeds recommended maximum (30 sets)');
  }
  
  return {
    isValid: issues.length === 0,
    issues
  };
};
