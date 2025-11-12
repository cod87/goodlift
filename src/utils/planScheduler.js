/**
 * Plan Scheduler Utility
 * Algorithm to distribute workouts across a mandatory 7-day week
 * Ensures no more than 2 consecutive intense days
 * Auto-inserts active recovery or rest as needed
 */

/**
 * Day types enum with their intensity levels
 */
export const DAY_TYPES = {
  STRENGTH: 'strength',
  HYPERTROPHY: 'hypertrophy',
  CARDIO: 'cardio',
  ACTIVE_RECOVERY: 'active_recovery',
  REST: 'rest'
};

/**
 * Check if a day type is considered "intense"
 * @param {string} dayType - Day type from DAY_TYPES enum
 * @returns {boolean} True if the day is intense
 */
export const isIntenseDay = (dayType) => {
  return [DAY_TYPES.STRENGTH, DAY_TYPES.HYPERTROPHY].includes(dayType);
};

/**
 * Get the display color for a day type
 * @param {string} dayType - Day type from DAY_TYPES enum
 * @returns {string} Color code
 */
export const getDayTypeColor = (dayType) => {
  const colors = {
    [DAY_TYPES.STRENGTH]: '#1976d2',      // blue
    [DAY_TYPES.HYPERTROPHY]: '#1976d2',   // blue
    [DAY_TYPES.CARDIO]: '#2e7d32',        // green
    [DAY_TYPES.REST]: '#9e9e9e',          // gray
    [DAY_TYPES.ACTIVE_RECOVERY]: '#64b5f6' // light blue
  };
  return colors[dayType] || '#9e9e9e';
};

/**
 * Get the display label for a day type
 * @param {string} dayType - Day type from DAY_TYPES enum
 * @returns {string} Display label
 */
export const getDayTypeLabel = (dayType) => {
  const labels = {
    [DAY_TYPES.STRENGTH]: 'Strength',
    [DAY_TYPES.HYPERTROPHY]: 'Hypertrophy',
    [DAY_TYPES.CARDIO]: 'Cardio',
    [DAY_TYPES.REST]: 'Rest',
    [DAY_TYPES.ACTIVE_RECOVERY]: 'Active Recovery'
  };
  return labels[dayType] || dayType;
};

/**
 * Validate a weekly plan structure
 * @param {Array} weekPlan - Array of 7 day objects
 * @returns {Object} Validation result with isValid and errors
 */
export const validateWeeklyPlan = (weekPlan) => {
  const errors = [];

  // Check for exactly 7 days
  if (!Array.isArray(weekPlan) || weekPlan.length !== 7) {
    errors.push('Weekly plan must have exactly 7 days');
    return { isValid: false, errors };
  }

  // Check each day has required fields
  weekPlan.forEach((day, index) => {
    if (typeof day.dayOfWeek !== 'number' || day.dayOfWeek < 0 || day.dayOfWeek > 6) {
      errors.push(`Day ${index + 1} missing or invalid dayOfWeek`);
    }
    if (!day.type || !Object.values(DAY_TYPES).includes(day.type)) {
      errors.push(`Day ${index + 1} has invalid type: ${day.type}`);
    }
  });

  // Check for no more than 2 consecutive intense days
  let consecutiveIntenseDays = 0;
  for (let i = 0; i < weekPlan.length; i++) {
    if (isIntenseDay(weekPlan[i].type)) {
      consecutiveIntenseDays++;
      if (consecutiveIntenseDays > 2) {
        errors.push(`More than 2 consecutive intense days detected at day ${i + 1}`);
        break;
      }
    } else {
      consecutiveIntenseDays = 0;
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Auto-schedule workouts across a 7-day week
 * Ensures proper recovery and no more than 2 consecutive intense days
 * 
 * @param {Object} preferences - Scheduling preferences
 * @param {number} preferences.intenseDaysPerWeek - Number of intense training days (2-5)
 * @param {number} preferences.cardioDaysPerWeek - Number of cardio-focused days (0-3)
 * @param {string} preferences.focusType - 'strength' or 'hypertrophy'
 * @param {Array<number>} preferences.preferredIntenseDays - Preferred days for intense workouts (0-6, 0=Sunday)
 * @returns {Array} Array of 7 day objects with scheduled workouts
 */
export const scheduleWeeklyPlan = (preferences = {}) => {
  const {
    intenseDaysPerWeek = 3,
    cardioDaysPerWeek = 1,
    focusType = 'strength',
    preferredIntenseDays = null
  } = preferences;

  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  
  // Initialize week with all rest days
  const week = dayNames.map((name, index) => ({
    dayOfWeek: index,
    dayName: name,
    type: DAY_TYPES.REST,
    exercises: [],
    duration: 0,
    description: ''
  }));

  // Determine which days should be intense training days
  let intenseDayIndices = [];
  if (preferredIntenseDays && Array.isArray(preferredIntenseDays)) {
    intenseDayIndices = preferredIntenseDays.slice(0, intenseDaysPerWeek);
  } else {
    // Default: spread intense days evenly with recovery between
    // For 3 days: Mon, Wed, Fri (1, 3, 5)
    // For 4 days: Mon, Tue, Thu, Fri (1, 2, 4, 5)
    // For 5 days: Mon, Tue, Wed, Fri, Sat (1, 2, 3, 5, 6)
    const defaultPatterns = {
      2: [1, 4],           // Mon, Thu
      3: [1, 3, 5],        // Mon, Wed, Fri
      4: [1, 2, 4, 5],     // Mon, Tue, Thu, Fri
      5: [1, 2, 3, 5, 6]   // Mon, Tue, Wed, Fri, Sat
    };
    intenseDayIndices = defaultPatterns[intenseDaysPerWeek] || [1, 3, 5];
  }

  // Assign intense training days
  intenseDayIndices.forEach((dayIndex) => {
    if (dayIndex >= 0 && dayIndex < 7) {
      week[dayIndex].type = focusType === 'hypertrophy' ? DAY_TYPES.HYPERTROPHY : DAY_TYPES.STRENGTH;
      week[dayIndex].duration = 60;
      week[dayIndex].description = focusType === 'hypertrophy' ? 'Muscle Building Focus' : 'Strength Building Focus';
    }
  });

  // Insert active recovery days after 2 consecutive intense days
  for (let i = 1; i < week.length; i++) {
    const prev = week[i - 1];
    const prevPrev = i >= 2 ? week[i - 2] : null;
    const current = week[i];

    // If we had 2 consecutive intense days, next day should be recovery or rest
    if (prevPrev && isIntenseDay(prevPrev.type) && isIntenseDay(prev.type)) {
      if (current.type !== DAY_TYPES.REST && isIntenseDay(current.type)) {
        // Force a recovery day
        current.type = DAY_TYPES.ACTIVE_RECOVERY;
        current.duration = 30;
        current.description = 'Active Recovery - Mobility & Flexibility';
        current.exercises = [];
      }
    }
  }

  // Assign cardio days to remaining non-intense days
  let cardioAssigned = 0;
  for (let i = 0; i < week.length && cardioAssigned < cardioDaysPerWeek; i++) {
    if (week[i].type === DAY_TYPES.REST) {
      week[i].type = DAY_TYPES.CARDIO;
      week[i].duration = 30;
      week[i].description = 'Cardio Training';
      cardioAssigned++;
    }
  }

  // Convert remaining rest days or add active recovery for better balance
  // If there's only one rest day between intense days, make it active recovery
  for (let i = 1; i < week.length - 1; i++) {
    const prev = week[i - 1];
    const next = week[i + 1];
    const current = week[i];

    if (current.type === DAY_TYPES.REST && isIntenseDay(prev.type) && isIntenseDay(next.type)) {
      current.type = DAY_TYPES.ACTIVE_RECOVERY;
      current.duration = 30;
      current.description = 'Active Recovery - Light Movement';
    }
  }

  return week;
};

/**
 * Estimate total duration and exercise count for a day
 * @param {Object} day - Day object
 * @returns {Object} Duration and exercise count estimates
 */
export const estimateDayMetrics = (day) => {
  let duration = day.duration || 0;
  let exerciseCount = day.exercises?.length || 0;

  // Estimate based on type if no specific data
  if (duration === 0) {
    const durationEstimates = {
      [DAY_TYPES.STRENGTH]: 60,
      [DAY_TYPES.HYPERTROPHY]: 60,
      [DAY_TYPES.CARDIO]: 30,
      [DAY_TYPES.ACTIVE_RECOVERY]: 30,
      [DAY_TYPES.REST]: 0
    };
    duration = durationEstimates[day.type] || 0;
  }

  if (exerciseCount === 0 && isIntenseDay(day.type)) {
    exerciseCount = 6; // Typical workout has 5-7 exercises
  } else if (exerciseCount === 0 && day.type === DAY_TYPES.CARDIO) {
    exerciseCount = 1; // Single cardio session
  } else if (exerciseCount === 0 && day.type === DAY_TYPES.ACTIVE_RECOVERY) {
    exerciseCount = 5; // Stretching/mobility exercises
  }

  return {
    duration,
    exerciseCount
  };
};

/**
 * Reorder days in a weekly plan (for drag-and-drop support)
 * @param {Array} weekPlan - Current weekly plan
 * @param {number} fromIndex - Source day index
 * @param {number} toIndex - Destination day index
 * @returns {Array} Reordered weekly plan
 */
export const reorderWeeklyPlan = (weekPlan, fromIndex, toIndex) => {
  if (!weekPlan || weekPlan.length !== 7) {
    throw new Error('Invalid weekly plan');
  }
  
  if (fromIndex < 0 || fromIndex >= 7 || toIndex < 0 || toIndex >= 7) {
    throw new Error('Invalid day indices');
  }

  const newPlan = [...weekPlan];
  const [movedDay] = newPlan.splice(fromIndex, 1);
  newPlan.splice(toIndex, 0, movedDay);

  // Update dayOfWeek indices to match new positions
  return newPlan.map((day, index) => ({
    ...day,
    dayOfWeek: index
  }));
};

/**
 * Create an empty 7-day plan template
 * @returns {Array} Empty 7-day plan with all rest days
 */
export const createEmptyWeeklyPlan = () => {
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  
  return dayNames.map((name, index) => ({
    dayOfWeek: index,
    dayName: name,
    type: DAY_TYPES.REST,
    exercises: [],
    duration: 0,
    description: 'Rest Day'
  }));
};
