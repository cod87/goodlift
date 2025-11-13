/**
 * Weekly Plan Defaults and Structure
 * Provides science-backed training splits with mandatory 7-day structure
 * Ensures comprehensive muscle development with proper recovery
 * Uses standardized day types: strength, hypertrophy, cardio, active_recovery, rest
 */

import { DAY_TYPES } from './planScheduler.js';

/**
 * Default Push/Pull/Legs (PPL) weekly plan
 * Trains each muscle group 1-2x per week via distinct movement patterns
 * Now uses standardized 7-day structure with day types enum
 */
export const DEFAULT_PPL_PLAN = [
  { 
    dayOfWeek: 0,
    dayName: 'Sunday',
    type: DAY_TYPES.REST,
    exercises: [],
    duration: 0,
    description: 'Rest & Recovery',
    workoutType: 'rest' // Legacy field for backward compatibility
  },
  { 
    dayOfWeek: 1,
    dayName: 'Monday',
    type: DAY_TYPES.STRENGTH,
    exercises: [],
    duration: 60,
    description: 'Push (Chest, Shoulders, Triceps)',
    workoutType: 'push' // Legacy field for backward compatibility
  },
  { 
    dayOfWeek: 2,
    dayName: 'Tuesday',
    type: DAY_TYPES.STRENGTH,
    exercises: [],
    duration: 60,
    description: 'Pull (Back, Biceps, Rear Delts)',
    workoutType: 'pull' // Legacy field for backward compatibility
  },
  { 
    dayOfWeek: 3,
    dayName: 'Wednesday',
    type: DAY_TYPES.ACTIVE_RECOVERY,
    exercises: [],
    duration: 30,
    description: 'Active Recovery - Flexibility & Mobility',
    workoutType: 'stretch' // Legacy field for backward compatibility
  },
  { 
    dayOfWeek: 4,
    dayName: 'Thursday',
    type: DAY_TYPES.STRENGTH,
    exercises: [],
    duration: 65,
    description: 'Legs (Quads, Hamstrings, Glutes, Calves)',
    workoutType: 'legs' // Legacy field for backward compatibility
  },
  { 
    dayOfWeek: 5,
    dayName: 'Friday',
    type: DAY_TYPES.HYPERTROPHY,
    exercises: [],
    duration: 60,
    description: 'Push - Hypertrophy Focus',
    workoutType: 'push' // Legacy field for backward compatibility
  },
  { 
    dayOfWeek: 6,
    dayName: 'Saturday',
    type: DAY_TYPES.CARDIO,
    exercises: [],
    duration: 30,
    description: 'HIIT Cardio',
    workoutType: 'hiit' // Legacy field for backward compatibility
  }
];

/**
 * Default Upper/Lower weekly plan
 * Splits upper and lower body into separate sessions
 * Now uses standardized 7-day structure with day types enum
 */
export const DEFAULT_UPPER_LOWER_PLAN = [
  { 
    dayOfWeek: 0,
    dayName: 'Sunday',
    type: DAY_TYPES.REST,
    exercises: [],
    duration: 0,
    description: 'Rest Day',
    workoutType: 'rest' // Legacy field for backward compatibility
  },
  { 
    dayOfWeek: 1,
    dayName: 'Monday',
    type: DAY_TYPES.STRENGTH,
    exercises: [],
    duration: 60,
    description: 'Upper Body - Strength Focus',
    workoutType: 'upper' // Legacy field for backward compatibility
  },
  { 
    dayOfWeek: 2,
    dayName: 'Tuesday',
    type: DAY_TYPES.STRENGTH,
    exercises: [],
    duration: 60,
    description: 'Lower Body - Strength Focus',
    workoutType: 'lower' // Legacy field for backward compatibility
  },
  { 
    dayOfWeek: 3,
    dayName: 'Wednesday',
    type: DAY_TYPES.ACTIVE_RECOVERY,
    exercises: [],
    duration: 30,
    description: 'Active Recovery - Restorative Stretching',
    workoutType: 'stretch' // Legacy field for backward compatibility
  },
  { 
    dayOfWeek: 4,
    dayName: 'Thursday',
    type: DAY_TYPES.HYPERTROPHY,
    exercises: [],
    duration: 60,
    description: 'Upper Body - Hypertrophy Focus',
    workoutType: 'upper' // Legacy field for backward compatibility
  },
  { 
    dayOfWeek: 5,
    dayName: 'Friday',
    type: DAY_TYPES.STRENGTH,
    exercises: [],
    duration: 55,
    description: 'Lower Body - Power Focus',
    workoutType: 'lower' // Legacy field for backward compatibility
  },
  { 
    dayOfWeek: 6,
    dayName: 'Saturday',
    type: DAY_TYPES.CARDIO,
    exercises: [],
    duration: 30,
    description: 'Optional HIIT Cardio',
    workoutType: 'hiit' // Legacy field for backward compatibility
  }
];

/**
 * Get default weekly plan based on planning style
 * @param {string} style - 'ppl' or 'upper_lower'
 * @returns {Array} Weekly plan array
 */
export const getDefaultWeeklyPlan = (style = 'upper_lower') => {
  switch (style) {
    case 'ppl':
      return DEFAULT_PPL_PLAN;
    case 'upper_lower':
      return DEFAULT_UPPER_LOWER_PLAN;
    default:
      return DEFAULT_UPPER_LOWER_PLAN;
  }
};

/**
 * Get workout type shorthand label for compact display
 * @param {string} type - Workout type or day type
 * @returns {string} Shorthand label (e.g., 'UP' for Upper, 'LO' for Lower)
 */
export const getWorkoutTypeShorthand = (type) => {
  const shorthandLabels = {
    // Legacy workout types - strength training
    push: 'P',
    pull: 'PL',
    legs: 'L',
    upper: 'UP',
    lower: 'LO',
    full: 'FB',
    // Other workout types
    stretch: 'ST',
    hiit: 'HI',
    rest: 'R',
    cardio: 'C',
    // New standardized day types
    [DAY_TYPES.STRENGTH]: 'STR',
    [DAY_TYPES.HYPERTROPHY]: 'HYP',
    [DAY_TYPES.CARDIO]: 'C',
    [DAY_TYPES.ACTIVE_RECOVERY]: 'AR',
    [DAY_TYPES.REST]: 'R',
  };
  return shorthandLabels[type] || type.substring(0, 2).toUpperCase();
};

/**
 * Get workout type display name
 * Updated to support both legacy types and new standardized day types
 * @param {string} type - Workout type or day type
 * @returns {string} Display name
 */
export const getWorkoutTypeDisplayName = (type) => {
  const displayNames = {
    // New standardized day types
    [DAY_TYPES.STRENGTH]: 'Strength',
    [DAY_TYPES.HYPERTROPHY]: 'Hypertrophy',
    [DAY_TYPES.CARDIO]: 'Cardio',
    [DAY_TYPES.ACTIVE_RECOVERY]: 'Active Recovery',
    [DAY_TYPES.REST]: 'Rest',
    
    // Legacy workout types (for backward compatibility)
    push: 'Push',
    pull: 'Pull',
    legs: 'Legs',
    upper: 'Upper Body',
    lower: 'Lower Body',
    full: 'Full Body',
    stretch: 'Stretch',
    hiit: 'HIIT',
    rest: 'Rest',
    cardio: 'Cardio'
  };
  return displayNames[type] || type.charAt(0).toUpperCase() + type.slice(1);
};

/**
 * Get today's workout from weekly plan
 * @param {Array} weeklyPlan - Weekly plan array (7-day structure)
 * @returns {Object|null} Today's workout plan or null
 */
export const getTodaysWorkout = (weeklyPlan) => {
  if (!Array.isArray(weeklyPlan) || weeklyPlan.length !== 7) {
    console.warn('Invalid weekly plan structure');
    return null;
  }
  
  const todayIndex = new Date().getDay(); // 0 = Sunday, 6 = Saturday
  return weeklyPlan.find(day => day.dayOfWeek === todayIndex) || null;
};

/**
 * Get next workout(s) from weekly plan
 * @param {Array} weeklyPlan - Weekly plan array (7-day structure)
 * @param {number} count - Number of next workouts to get
 * @returns {Array} Array of upcoming workouts
 */
export const getNextWorkouts = (weeklyPlan, count = 2) => {
  if (!Array.isArray(weeklyPlan) || weeklyPlan.length !== 7) {
    console.warn('Invalid weekly plan structure');
    return [];
  }
  
  const todayIndex = new Date().getDay();
  const nextWorkouts = [];
  
  for (let i = 1; i <= count && i < 7; i++) {
    const nextIndex = (todayIndex + i) % 7;
    const workout = weeklyPlan.find(day => day.dayOfWeek === nextIndex);
    if (workout && workout.type !== DAY_TYPES.REST) {
      nextWorkouts.push(workout);
    }
  }
  
  return nextWorkouts;
};
