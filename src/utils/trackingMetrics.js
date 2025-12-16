/**
 * Tracking Metrics Utility
 * 
 * Provides functions for calculating workout tracking metrics:
 * - Streak calculation (consecutive days with allowance for one rest/unlogged day per week)
 * - Adherence percentage (completed vs planned)
 * - PR (Personal Record) tracking per exercise
 * - Volume load calculation (sets x reps x weight)
 */

/**
 * Calculate current workout streak in days.
 * 
 * NEW RULE: For any given standard week block (Sunday through Saturday):
 * - Unlogged days are treated as Rest days
 * - Allow up to 2 Active Recovery days per week WITHOUT breaking streak
 * - BUT only if there are NO rest days (logged or unlogged) in that week
 * - If there is any rest day (logged or unlogged), then only 1 Active Recovery is allowed
 * - More than 1 rest day (including unlogged) breaks the streak
 * 
 * Date handling: All dates are normalized to local midnight (00:00:00) for consistency.
 * This ensures workouts at different times of day (e.g., 11:30 PM vs 12:05 AM) are 
 * correctly identified as different calendar days.
 * 
 * Current streak: A streak is considered "current" if the last active day was today or yesterday.
 * This gives users a grace period - they're still "on" their streak if they worked out yesterday,
 * even if they haven't worked out yet today.
 * 
 * @param {Array} workoutHistory - Array of completed workout objects with date
 * @returns {Object} { currentStreak: number, longestStreak: number }
 */
export const calculateStreak = (workoutHistory = []) => {
  if (!workoutHistory || workoutHistory.length === 0) {
    return { currentStreak: 0, longestStreak: 0 };
  }

  // Constants
  const MS_PER_DAY = 1000 * 60 * 60 * 24;

  // Helper function to calculate calendar days between dates (using midnight normalization)
  const daysBetween = (date1, date2) => {
    return Math.floor((date2 - date1) / MS_PER_DAY);
  };

  // Sort workouts by date (oldest first for forward iteration)
  const sortedWorkouts = [...workoutHistory].sort((a, b) => 
    new Date(a.date) - new Date(b.date)
  );

  // Helper function to check if a session is a rest day
  const isRestSession = (session) => {
    const type = session.type || session.sessionType || '';
    return type.toLowerCase() === 'rest';
  };

  // Helper function to check if a session is an active recovery day
  const isActiveRecoverySession = (session) => {
    const type = session.type || session.sessionType || '';
    return type.toLowerCase() === 'active_recovery';
  };

  // Helper function to check if a session is a sick day
  const isSickDaySession = (session) => {
    const type = session.type || session.sessionType || '';
    return type.toLowerCase() === 'sick_day';
  };

  // Helper function to check if a session is a strength training type
  const isStrengthTrainingSession = (session) => {
    const type = session.type || session.sessionType || '';
    const normalizedType = type.toLowerCase();
    const strengthTypes = ['upper', 'lower', 'full', 'push', 'pull', 'legs', 'strength', 'hypertrophy'];
    return strengthTypes.includes(normalizedType);
  };

  // Helper function to get the Sunday (start) of a week for any date
  // Returns timestamp at midnight of the Sunday that starts the week
  const getWeekStart = (date) => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    const day = d.getDay(); // 0 = Sunday, 6 = Saturday
    d.setDate(d.getDate() - day); // Go back to Sunday
    return d.getTime();
  };

  // Build a map of normalized dates to sessions for quick lookup
  // Filter out sick days as they should not be considered in streak calculations
  const dateToSessions = new Map();
  sortedWorkouts.forEach(workout => {
    // Skip sick days entirely - they don't count towards or against streaks
    if (isSickDaySession(workout)) {
      return;
    }
    
    const d = new Date(workout.date);
    d.setHours(0, 0, 0, 0); // Normalize to local midnight
    const timestamp = d.getTime();
    if (!dateToSessions.has(timestamp)) {
      dateToSessions.set(timestamp, []);
    }
    dateToSessions.get(timestamp).push(workout);
  });

  // Build a separate map that includes ALL sessions (including sick days) for counting strength and sick days per week
  const dateToAllSessions = new Map();
  sortedWorkouts.forEach(workout => {
    const d = new Date(workout.date);
    d.setHours(0, 0, 0, 0); // Normalize to local midnight
    const timestamp = d.getTime();
    if (!dateToAllSessions.has(timestamp)) {
      dateToAllSessions.set(timestamp, []);
    }
    dateToAllSessions.get(timestamp).push(workout);
  });

  // Get unique workout dates, normalized to midnight
  // Filter out sick days as they should not be considered in streak calculations
  const uniqueDatesArray = Array.from(new Set(sortedWorkouts
    .filter(w => !isSickDaySession(w)) // Exclude sick days
    .map(w => {
      const d = new Date(w.date);
      d.setHours(0, 0, 0, 0);
      return d.getTime();
    })
    .filter(timestamp => !isNaN(timestamp))
  )).sort((a, b) => a - b);

  // If no valid dates found, return empty streak
  if (uniqueDatesArray.length === 0) {
    return { currentStreak: 0, longestStreak: 0 };
  }

  // Normalize "today" to local midnight for consistent comparison
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayTime = today.getTime();

  /**
   * Helper function to check if a day is a "skip day" (rest day or unlogged day)
   * @param {number} dateTime - Timestamp of the date to check
   * @returns {boolean} True if this is a rest day (session with type 'rest')
   */
  const isRestDay = (dateTime) => {
    const sessions = dateToSessions.get(dateTime) || [];
    // A rest day is when there's a session but all sessions are rest type
    return sessions.length > 0 && sessions.every(s => isRestSession(s));
  };

  /**
   * Helper function to check if a day is an active recovery day
   * @param {number} dateTime - Timestamp of the date to check
   * @returns {boolean} True if this is an active recovery day (session with type 'active_recovery')
   */
  const isActiveRecoveryDay = (dateTime) => {
    const sessions = dateToSessions.get(dateTime) || [];
    // An active recovery day is when there's a session and at least one is active recovery type
    return sessions.length > 0 && sessions.some(s => isActiveRecoverySession(s));
  };

  /**
   * Helper function to validate a streak range
   * Checks that each week block (Sun-Sat) within the range follows the rules:
   * - Unlogged days count as rest days
   * - Allow up to 2 Active Recovery days per week if NO rest days (logged or unlogged)
   * - If there is any rest day (logged or unlogged), only 1 Active Recovery is allowed
   * - More than 1 rest day (including unlogged) breaks the streak
   * - NEW: Sick day requirements:
   *   - 2 sick days in a week → minimum 2 strength training sessions required
   *   - 3 sick days in a week → minimum 1 strength training session required
   *   - 4+ sick days in a week → no minimum requirement
   * 
   * @param {number} startDate - Start date timestamp of the streak
   * @param {number} endDate - End date timestamp of the streak
   * @returns {boolean} True if the streak is valid
   */
  const isValidStreakRange = (startDate, endDate) => {
    // Group days by week block and count rest/recovery/sick/strength days per week
    const weekRestDays = new Map(); // weekStart -> count of rest days (including unlogged)
    const weekRecoveryDays = new Map(); // weekStart -> count of active recovery days
    const weekSickDays = new Map(); // weekStart -> count of sick days
    const weekStrengthDays = new Map(); // weekStart -> count of strength training days
    
    // Iterate through each day in the range
    let currentDay = startDate;
    while (currentDay <= endDate) {
      const weekStart = getWeekStart(currentDay);
      const hasSessions = dateToSessions.has(currentDay);
      const hasAnySessions = dateToAllSessions.has(currentDay);
      
      // Count sick days (from the complete sessions map)
      if (hasAnySessions) {
        const allSessions = dateToAllSessions.get(currentDay) || [];
        const hasSickDay = allSessions.some(s => isSickDaySession(s));
        if (hasSickDay) {
          const currentCount = weekSickDays.get(weekStart) || 0;
          weekSickDays.set(weekStart, currentCount + 1);
        }
        
        // Count strength training days (from the filtered sessions map, excluding sick days)
        if (hasSessions) {
          const sessions = dateToSessions.get(currentDay) || [];
          const hasStrength = sessions.some(s => isStrengthTrainingSession(s));
          if (hasStrength) {
            const currentCount = weekStrengthDays.get(weekStart) || 0;
            weekStrengthDays.set(weekStart, currentCount + 1);
          }
        }
      }
      
      // Count rest days (including unlogged days which are treated as rest)
      // BUT: days with sick day sessions should NOT be counted as unlogged
      const allSessions = dateToAllSessions.get(currentDay) || [];
      const dayHasSickDay = allSessions.some(s => isSickDaySession(s));
      
      if ((!hasSessions && !dayHasSickDay) || isRestDay(currentDay)) {
        const currentCount = weekRestDays.get(weekStart) || 0;
        weekRestDays.set(weekStart, currentCount + 1);
        
        // If any week has more than 1 rest day (including unlogged), the streak is invalid
        if (currentCount + 1 > 1) {
          return false;
        }
      }
      
      // Count active recovery days (only if there are sessions)
      if (hasSessions && isActiveRecoveryDay(currentDay)) {
        const currentCount = weekRecoveryDays.get(weekStart) || 0;
        weekRecoveryDays.set(weekStart, currentCount + 1);
        
        const restCountInWeek = weekRestDays.get(weekStart) || 0;
        
        // If there are any rest days in this week, only 1 active recovery is allowed
        if (restCountInWeek > 0 && currentCount + 1 > 1) {
          return false;
        }
        
        // If there are no rest days, up to 2 active recovery days are allowed
        if (restCountInWeek === 0 && currentCount + 1 > 2) {
          return false;
        }
      }
      
      // Move to next day
      currentDay += MS_PER_DAY;
    }
    
    // After processing all days, check sick day requirements per week
    for (const [weekStart, sickDayCount] of weekSickDays.entries()) {
      const strengthCount = weekStrengthDays.get(weekStart) || 0;
      
      // Apply minimum strength training requirements based on sick day count
      if (sickDayCount === 2 && strengthCount < 2) {
        return false; // Need at least 2 strength sessions with 2 sick days
      }
      if (sickDayCount === 3 && strengthCount < 1) {
        return false; // Need at least 1 strength session with 3 sick days
      }
      // 4+ sick days have no minimum requirement (continue streak)
    }
    
    return true;
  };

  /**
   * Find the longest valid streak ending at or before endDate
   * A valid streak follows the rules: unlogged days count as rest, 
   * max 1 rest day per week, and up to 2 active recovery days if no rest.
   * 
   * @param {number} endDate - The end date of the potential streak
   * @returns {number} Length of the longest valid streak in days
   */
  const findLongestValidStreak = (endDate) => {
    if (uniqueDatesArray.length === 0) return 0;
    
    // Find the first session date
    const firstSessionDate = uniqueDatesArray[0];
    
    // Try different streak lengths, starting from the longest possible
    // The longest possible streak starts from the first session date
    const maxDays = daysBetween(firstSessionDate, endDate) + 1;
    
    for (let days = maxDays; days >= 1; days--) {
      const startDate = endDate - (days - 1) * MS_PER_DAY;
      
      // Skip if startDate is before the first session
      if (startDate < firstSessionDate) {
        continue;
      }
      
      if (isValidStreakRange(startDate, endDate)) {
        return days;
      }
    }
    
    return 0;
  };

  // Find the most recent session date
  const mostRecentSessionDate = uniqueDatesArray[uniqueDatesArray.length - 1];
  
  // Current streak: Check if we're within the grace period (last session today or yesterday)
  const daysSinceLastSession = daysBetween(mostRecentSessionDate, todayTime);
  
  let currentStreak = 0;
  let longestStreak = 0;
  
  // If the last session was more than 1 day ago, current streak is 0
  // Otherwise, calculate the streak ending at the most recent session
  if (daysSinceLastSession <= 1) {
    // Calculate streak ending at most recent session date
    currentStreak = findLongestValidStreak(mostRecentSessionDate);
  }
  
  // Calculate longest streak by checking potential streak endpoints
  // Each session date could be the end of a streak
  for (const endDate of uniqueDatesArray) {
    const streakLen = findLongestValidStreak(endDate);
    longestStreak = Math.max(longestStreak, streakLen);
  }

  return { currentStreak, longestStreak };
};

/**
 * Calculate adherence percentage
 * If user's first session was less than 30 days ago, calculates adherence based on 
 * days since first session. Otherwise uses the last 30 days.
 * 
 * IMPORTANT: The current day is treated as neutral/null until a session is logged.
 * Only completed days (yesterday and before) count towards adherence unless today has a session.
 * 
 * @param {Array} workoutHistory - Array of completed workout objects
 * @param {Object} activePlan - Active plan with scheduled sessions (optional, unused)
 * @param {number} days - Number of days to calculate adherence for (default 30)
 * @returns {number} Adherence percentage (0-100)
 */
// eslint-disable-next-line no-unused-vars
export const calculateAdherence = (workoutHistory = [], activePlan = null, days = 30) => {
  if (!workoutHistory || workoutHistory.length === 0) {
    return 0;
  }

  // Constants
  const MS_PER_DAY = 1000 * 60 * 60 * 24;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Check if there's a session logged today
  const hasSessionToday = workoutHistory.some(w => {
    const workoutDate = new Date(w.date);
    workoutDate.setHours(0, 0, 0, 0);
    return workoutDate.getTime() === today.getTime();
  });

  // Find the date of the first session (optimized to create Date objects only once)
  const timestamps = workoutHistory.map(w => new Date(w.date).getTime());
  const firstSessionDate = new Date(Math.min(...timestamps));
  firstSessionDate.setHours(0, 0, 0, 0);

  // Determine the end date for calculation
  // If no session today, use yesterday as the end date (exclude current day)
  // If session today, use today as the end date (include current day)
  const endDate = new Date(today);
  if (!hasSessionToday) {
    endDate.setDate(endDate.getDate() - 1); // Use yesterday as end date
  }
  endDate.setHours(0, 0, 0, 0);

  // If end date is before first session date, return 0
  if (endDate < firstSessionDate) {
    return 0;
  }

  // Calculate days since first session (up to endDate)
  const daysSinceFirstSession = Math.floor((endDate - firstSessionDate) / MS_PER_DAY) + 1;

  // Use the smaller of: days parameter or days since first session
  const effectiveDays = daysSinceFirstSession < days ? daysSinceFirstSession : days;

  const cutoffDate = new Date(endDate);
  cutoffDate.setDate(cutoffDate.getDate() - effectiveDays + 1);
  cutoffDate.setHours(0, 0, 0, 0);

  // Get unique session dates in the effective period
  const uniqueSessionDates = new Set();
  workoutHistory.forEach(w => {
    const workoutDate = new Date(w.date);
    workoutDate.setHours(0, 0, 0, 0);
    if (workoutDate >= cutoffDate && workoutDate <= endDate) {
      uniqueSessionDates.add(workoutDate.toDateString());
    }
  });

  const daysWithSessions = uniqueSessionDates.size;

  // Calculate adherence as percentage of days with any session
  if (effectiveDays === 0) return 0;
  
  return Math.min(100, Math.round((daysWithSessions / effectiveDays) * 100));
};

/**
 * Get personal records for all exercises
 * @param {Array} workoutHistory - Array of workout objects
 * @returns {Object} Map of exercise name to PR data
 */
export const getPersonalRecords = (workoutHistory = []) => {
  const prs = {};

  workoutHistory.forEach(workout => {
    if (!workout.exercises) return;

    Object.entries(workout.exercises).forEach(([exerciseName, exerciseData]) => {
      if (!exerciseData.sets || exerciseData.sets.length === 0) return;

      exerciseData.sets.forEach(set => {
        const weight = set.weight || 0;
        const reps = set.reps || 0;

        if (weight === 0 && reps === 0) return;

        // Calculate one-rep max estimate using Epley formula
        const oneRepMax = weight > 0 && reps > 0 
          ? weight * (1 + reps / 30) 
          : 0;

        // Track max weight
        if (!prs[exerciseName] || weight > (prs[exerciseName].maxWeight || 0)) {
          if (!prs[exerciseName]) {
            prs[exerciseName] = {};
          }
          if (weight > (prs[exerciseName].maxWeight || 0)) {
            prs[exerciseName].maxWeight = weight;
            prs[exerciseName].maxWeightDate = workout.date;
            prs[exerciseName].maxWeightReps = reps;
          }
        }

        // Track max reps at any weight
        if (!prs[exerciseName] || reps > (prs[exerciseName].maxReps || 0)) {
          if (!prs[exerciseName]) {
            prs[exerciseName] = {};
          }
          if (reps > (prs[exerciseName].maxReps || 0)) {
            prs[exerciseName].maxReps = reps;
            prs[exerciseName].maxRepsDate = workout.date;
            prs[exerciseName].maxRepsWeight = weight;
          }
        }

        // Track estimated 1RM
        if (!prs[exerciseName] || oneRepMax > (prs[exerciseName].estimatedOneRepMax || 0)) {
          if (!prs[exerciseName]) {
            prs[exerciseName] = {};
          }
          if (oneRepMax > (prs[exerciseName].estimatedOneRepMax || 0)) {
            prs[exerciseName].estimatedOneRepMax = Math.round(oneRepMax * 10) / 10;
            prs[exerciseName].oneRepMaxDate = workout.date;
          }
        }
      });
    });
  });

  return prs;
};

/**
 * Check if a workout contains new PRs
 * @param {Object} workout - Workout object with exercises
 * @param {Object} previousPRs - Previous PR records
 * @returns {Array} Array of new PR achievements { exerciseName, type, value, previousValue }
 */
export const detectNewPRs = (workout, previousPRs = {}) => {
  const newPRs = [];
  
  if (!workout || !workout.exercises) return newPRs;

  Object.entries(workout.exercises).forEach(([exerciseName, exerciseData]) => {
    if (!exerciseData.sets || exerciseData.sets.length === 0) return;

    const previousPR = previousPRs[exerciseName] || {};
    
    exerciseData.sets.forEach(set => {
      const weight = set.weight || 0;
      const reps = set.reps || 0;

      if (weight === 0 && reps === 0) return;

      // Check for weight PR
      if (weight > 0 && weight > (previousPR.maxWeight || 0)) {
        newPRs.push({
          exerciseName,
          type: 'weight',
          value: weight,
          previousValue: previousPR.maxWeight || 0,
          reps,
        });
      }

      // Check for reps PR
      if (reps > 0 && reps > (previousPR.maxReps || 0)) {
        newPRs.push({
          exerciseName,
          type: 'reps',
          value: reps,
          previousValue: previousPR.maxReps || 0,
          weight,
        });
      }

      // Check for 1RM PR
      const oneRepMax = weight > 0 && reps > 0 ? weight * (1 + reps / 30) : 0;
      if (oneRepMax > (previousPR.estimatedOneRepMax || 0)) {
        newPRs.push({
          exerciseName,
          type: 'oneRepMax',
          value: Math.round(oneRepMax * 10) / 10,
          previousValue: previousPR.estimatedOneRepMax || 0,
        });
      }
    });
  });

  // Remove duplicates (keep highest value for each exercise/type combo)
  const uniquePRs = {};
  newPRs.forEach(pr => {
    const key = `${pr.exerciseName}-${pr.type}`;
    if (!uniquePRs[key] || pr.value > uniquePRs[key].value) {
      uniquePRs[key] = pr;
    }
  });

  return Object.values(uniquePRs);
};

/**
 * Calculate total volume load for a workout
 * Volume = sum of (sets x reps x weight) for all exercises
 * @param {Object} workout - Workout object with exercises
 * @returns {number} Total volume in lbs
 */
export const calculateVolumeLoad = (workout) => {
  if (!workout || !workout.exercises) return 0;

  let totalVolume = 0;

  Object.values(workout.exercises).forEach(exerciseData => {
    if (!exerciseData.sets || exerciseData.sets.length === 0) return;

    exerciseData.sets.forEach(set => {
      const weight = set.weight || 0;
      const reps = set.reps || 0;
      totalVolume += weight * reps;
    });
  });

  return totalVolume;
};

/**
 * Calculate total volume load for workout history
 * @param {Array} workoutHistory - Array of workout objects
 * @param {number} days - Optional: number of days to include (default: all)
 * @returns {number} Total volume in lbs
 */
export const calculateTotalVolume = (workoutHistory = [], days = null) => {
  let filteredHistory = workoutHistory;

  if (days) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    cutoffDate.setHours(0, 0, 0, 0);

    filteredHistory = workoutHistory.filter(w => {
      const workoutDate = new Date(w.date);
      workoutDate.setHours(0, 0, 0, 0);
      return workoutDate >= cutoffDate;
    });
  }

  return filteredHistory.reduce((total, workout) => {
    return total + calculateVolumeLoad(workout);
  }, 0);
};

/**
 * Get progression percentage for an exercise
 * Compares current performance to starting performance
 * @param {Array} workoutHistory - Array of workout objects
 * @param {string} exerciseName - Name of the exercise
 * @returns {Object} { percentage: number, startValue: number, currentValue: number }
 */
export const getExerciseProgression = (workoutHistory = [], exerciseName) => {
  const exerciseWorkouts = [];
  
  workoutHistory.forEach(workout => {
    if (workout.exercises && workout.exercises[exerciseName]) {
      const exerciseData = workout.exercises[exerciseName];
      if (exerciseData.sets && exerciseData.sets.length > 0) {
        const maxWeight = Math.max(...exerciseData.sets.map(s => s.weight || 0));
        if (maxWeight > 0) {
          exerciseWorkouts.push({
            date: new Date(workout.date),
            maxWeight,
          });
        }
      }
    }
  });

  if (exerciseWorkouts.length === 0) {
    return { percentage: 0, startValue: 0, currentValue: 0 };
  }

  // Sort by date
  exerciseWorkouts.sort((a, b) => a.date - b.date);

  const startValue = exerciseWorkouts[0].maxWeight;
  const currentValue = exerciseWorkouts[exerciseWorkouts.length - 1].maxWeight;

  const percentage = startValue > 0 
    ? Math.round(((currentValue - startValue) / startValue) * 100)
    : 0;

  return { percentage, startValue, currentValue };
};

/**
 * Get milestone achievements based on streak
 * @param {number} currentStreak - Current streak count
 * @returns {Array} Array of achieved milestones
 */
export const getStreakMilestones = (currentStreak) => {
  const milestones = [
    { days: 7, badge: '🔥 Week Warrior', description: '7 day streak!' },
    { days: 30, badge: '💪 Monthly Master', description: '30 day streak!' },
    { days: 90, badge: '🏆 Quarter Champion', description: '90 day streak!' },
    { days: 180, badge: '👑 Half Year Hero', description: '180 day streak!' },
    { days: 365, badge: '⭐ Year Legend', description: '365 day streak!' },
  ];

  return milestones.filter(m => currentStreak >= m.days);
};

/**
 * Generate weekly summary data
 * @param {Array} workoutHistory - Array of workout objects
 * @param {Object} activePlan - Optional active plan
 * @returns {Object} Weekly summary data
 */
export const generateWeeklySummary = (workoutHistory = [], activePlan = null) => {
  const now = new Date();
  const oneWeekAgo = new Date(now);
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  // Filter to last week
  const weekWorkouts = workoutHistory.filter(w => {
    const workoutDate = new Date(w.date);
    return workoutDate >= oneWeekAgo && workoutDate <= now;
  });

  const workoutsCompleted = weekWorkouts.length;
  const totalTime = weekWorkouts.reduce((sum, w) => sum + (w.duration || 0), 0);
  
  // Calculate total volume
  const totalVolume = weekWorkouts.reduce((sum, workout) => {
    return sum + calculateVolumeLoad(workout);
  }, 0);

  // Count PRs achieved this week
  const previousPRs = getPersonalRecords(workoutHistory.filter(w => {
    const workoutDate = new Date(w.date);
    return workoutDate < oneWeekAgo;
  }));

  let prsAchieved = 0;
  weekWorkouts.forEach(workout => {
    const newPRs = detectNewPRs(workout, previousPRs);
    prsAchieved += newPRs.length;
  });

  // Find top exercises
  const exerciseCounts = {};
  weekWorkouts.forEach(workout => {
    if (workout.exercises) {
      Object.keys(workout.exercises).forEach(exerciseName => {
        exerciseCounts[exerciseName] = (exerciseCounts[exerciseName] || 0) + 1;
      });
    }
  });

  const topExercises = Object.entries(exerciseCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // Calculate adherence
  const adherence = calculateAdherence(workoutHistory, activePlan, 7);

  return {
    workoutsCompleted,
    totalVolume,
    totalTime,
    prsAchieved,
    topExercises,
    adherence,
  };
};
