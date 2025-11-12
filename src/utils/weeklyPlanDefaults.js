/**
 * Weekly Plan Defaults and Structure
 * Provides science-backed training splits (PPL, Upper/Lower)
 * Ensures comprehensive muscle development with proper recovery
 */

/**
 * Default Push/Pull/Legs (PPL) weekly plan
 * Trains each muscle group 1-2x per week via distinct movement patterns
 */
export const DEFAULT_PPL_PLAN = [
  { 
    day: 'Mon', 
    type: 'push', 
    focus: 'strength', 
    estimatedDuration: 60, 
    includes: ['strength', 'cardio'],
    description: 'Push (Chest, Shoulders, Triceps)'
  },
  { 
    day: 'Tue', 
    type: 'pull', 
    focus: 'strength', 
    estimatedDuration: 60, 
    includes: ['strength', 'cardio'],
    description: 'Pull (Back, Biceps, Rear Delts)'
  },
  { 
    day: 'Wed', 
    type: 'stretch', 
    style: 'flexibility', 
    estimatedDuration: 30, 
    includes: ['recovery'],
    description: 'Stretch - Flexibility & Recovery'
  },
  { 
    day: 'Thu', 
    type: 'legs', 
    focus: 'strength', 
    estimatedDuration: 65, 
    includes: ['strength', 'cardio'],
    description: 'Legs (Quads, Hamstrings, Glutes, Calves)'
  },
  { 
    day: 'Fri', 
    type: 'push', 
    focus: 'hypertrophy', 
    estimatedDuration: 60, 
    includes: ['strength', 'cardio'],
    description: 'Push (Secondary Angles)'
  },
  { 
    day: 'Sat', 
    type: 'hiit', 
    style: 'step-based', 
    estimatedDuration: 30, 
    includes: ['cardio', 'lower-impact'],
    description: 'HIIT - Lower Impact'
  },
  { 
    day: 'Sun', 
    type: 'rest', 
    includes: ['recovery'],
    description: 'Rest & Recovery'
  }
];

/**
 * Default Upper/Lower weekly plan
 * Splits upper and lower body into separate sessions
 */
export const DEFAULT_UPPER_LOWER_PLAN = [
  { 
    day: 'Mon', 
    type: 'upper', 
    focus: 'strength', 
    estimatedDuration: 60, 
    includes: ['strength', 'cardio'],
    description: 'Upper Body - Strength Focus'
  },
  { 
    day: 'Tue', 
    type: 'lower', 
    focus: 'strength', 
    estimatedDuration: 60, 
    includes: ['strength', 'cardio'],
    description: 'Lower Body - Strength Focus'
  },
  { 
    day: 'Wed', 
    type: 'stretch', 
    style: 'restorative', 
    estimatedDuration: 30, 
    includes: ['recovery'],
    description: 'Stretch - Active Recovery'
  },
  { 
    day: 'Thu', 
    type: 'upper', 
    focus: 'hypertrophy', 
    estimatedDuration: 60, 
    includes: ['strength', 'cardio'],
    description: 'Upper Body - Secondary Angles'
  },
  { 
    day: 'Fri', 
    type: 'lower', 
    focus: 'power', 
    estimatedDuration: 55, 
    includes: ['strength', 'cardio'],
    description: 'Lower Body - Power & HIIT'
  },
  { 
    day: 'Sat', 
    type: 'hiit', 
    style: 'step-based', 
    estimatedDuration: 30, 
    includes: ['cardio'],
    description: 'Optional HIIT'
  },
  { 
    day: 'Sun', 
    type: 'rest', 
    includes: ['recovery'],
    description: 'Rest'
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
 * Get workout type display name
 * @param {string} type - Workout type
 * @returns {string} Display name
 */
export const getWorkoutTypeDisplayName = (type) => {
  const displayNames = {
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
 * @param {Array} weeklyPlan - Weekly plan array
 * @returns {Object|null} Today's workout plan or null
 */
export const getTodaysWorkout = (weeklyPlan) => {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const today = days[new Date().getDay()];
  return weeklyPlan.find(day => day.day === today) || null;
};

/**
 * Get next workout(s) from weekly plan
 * @param {Array} weeklyPlan - Weekly plan array
 * @param {number} count - Number of next workouts to get
 * @returns {Array} Array of upcoming workouts
 */
export const getNextWorkouts = (weeklyPlan, count = 2) => {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const todayIndex = new Date().getDay();
  const nextWorkouts = [];
  
  for (let i = 1; i <= count && i < 7; i++) {
    const nextIndex = (todayIndex + i) % 7;
    const nextDay = days[nextIndex];
    const workout = weeklyPlan.find(day => day.day === nextDay);
    if (workout && workout.type !== 'rest') {
      nextWorkouts.push(workout);
    }
  }
  
  return nextWorkouts;
};
