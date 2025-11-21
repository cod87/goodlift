/**
 * Tracking Metrics Utility
 * 
 * Provides functions for calculating workout tracking metrics:
 * - Streak calculation (consecutive days including rest days)
 * - Adherence percentage (completed vs planned)
 * - PR (Personal Record) tracking per exercise
 * - Volume load calculation (sets x reps x weight)
 */

/**
 * Calculate current workout streak in days based on consecutive days with sessions
 * Counts individual consecutive days with sessions, crossing week boundaries seamlessly.
 * Streak is "alive" only if each COMPLETE week (Sun-Sat) in the streak has at least 3 strength training sessions.
 * Incomplete weeks (partial weeks at start/end of streak) are exempt from the strength requirement.
 * 
 * Date handling: All dates are normalized to local midnight (00:00:00) for consistency.
 * This ensures workouts at different times of day (e.g., 11:30 PM vs 12:05 AM) are 
 * correctly identified as different calendar days.
 * 
 * Current streak: A streak is considered "current" if the last workout was today or yesterday.
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

  // Helper function to check if a session is strength training
  const isStrengthSession = (session) => {
    if (session.type === 'strength' || session.type === 'full' || session.type === 'upper' || 
        session.type === 'lower' || session.type === 'push' || session.type === 'pull' || 
        session.type === 'legs') {
      return true;
    }
    // If it has exercises, assume it's a strength session
    if (session.exercises && Object.keys(session.exercises).length > 0) {
      return true;
    }
    return false;
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

  // Helper function to find longest valid streak prefix
  // A streak is valid if all COMPLETE weeks have at least 3 strength sessions
  // A week is "complete" if the streak covers Sun-Sat (all 7 days) of that week
  // Incomplete weeks (partial weeks at start/end) are exempt from strength requirement
  const findLongestValidStreak = (streakDates, dateToSessions) => {
    if (streakDates.length === 0) return 0;
    
    // First pass: Identify which weeks in the FULL streak are complete
    const fullStreakWeeks = new Map();
    for (let i = 0; i < streakDates.length; i++) {
      const dateTime = streakDates[i];
      const date = new Date(dateTime);
      const weekStart = getWeekStart(dateTime);
      const dayOfWeek = date.getDay();
      const sessions = dateToSessions.get(dateTime) || [];
      
      if (!fullStreakWeeks.has(weekStart)) {
        fullStreakWeeks.set(weekStart, {
          strengthCount: 0,
          daysPresent: new Set(),
          firstDayIndex: i,
          lastDayIndex: i,
        });
      }
      
      const weekInfo = fullStreakWeeks.get(weekStart);
      weekInfo.daysPresent.add(dayOfWeek);
      weekInfo.lastDayIndex = i;
      
      const strengthSessionsToday = sessions.filter(s => isStrengthSession(s)).length;
      weekInfo.strengthCount += strengthSessionsToday;
    }
    
    // Mark which weeks are complete in the full streak
    const completeWeeks = new Set();
    for (const [weekStart, info] of fullStreakWeeks.entries()) {
      const isComplete = info.daysPresent.size === 7 &&
                        info.daysPresent.has(0) &&
                        info.daysPresent.has(6);
      if (isComplete) {
        completeWeeks.add(weekStart);
      }
    }
    
    // Now try progressively shorter prefixes
    // But skip lengths that would cut a complete week in half
    for (let len = streakDates.length; len > 0; len--) {
      // Check if this length cuts through a complete week
      let cutsCompleteWeek = false;
      for (const [weekStart, info] of fullStreakWeeks.entries()) {
        if (completeWeeks.has(weekStart)) {
          // This week is complete in the full streak
          // Check if our length cuts it (includes first day but not last day)
          // len is 1-indexed count, lastDayIndex is 0-indexed, so len = lastDayIndex + 1 means we include the last day
          if (len > info.firstDayIndex && len < info.lastDayIndex + 1) {
            cutsCompleteWeek = true;
            break;
          }
        }
      }
      
      if (cutsCompleteWeek) {
        continue; // Skip this length as it artificially makes a complete week incomplete
      }
      
      // Validate this length
      const weekToInfo = new Map();
      for (let i = 0; i < len; i++) {
        const dateTime = streakDates[i];
        const weekStart = getWeekStart(dateTime);
        const sessions = dateToSessions.get(dateTime) || [];
        
        if (!weekToInfo.has(weekStart)) {
          weekToInfo.set(weekStart, { strengthCount: 0 });
        }
        
        const strengthSessionsToday = sessions.filter(s => isStrengthSession(s)).length;
        weekToInfo.get(weekStart).strengthCount += strengthSessionsToday;
      }
      
      // Check if all complete weeks (from original) in this prefix meet requirement
      let allCompleteWeeksValid = true;
      for (const [weekStart, info] of fullStreakWeeks.entries()) {
        // Check if this complete week is fully included in the prefix
        // len is 1-indexed count (e.g., len=7 means indices 0-6)
        // lastDayIndex is 0-indexed, so lastDayIndex < len means last day is included
        if (completeWeeks.has(weekStart) && info.lastDayIndex < len) {
          // This complete week is fully included in the prefix
          const strengthCount = weekToInfo.get(weekStart)?.strengthCount || 0;
          if (strengthCount < 3) {
            allCompleteWeeksValid = false;
            break;
          }
        }
      }
      
      if (allCompleteWeeksValid) {
        return len;
      }
    }
    
    return 0;
  };

  // Get unique workout dates, normalized to midnight for consistent day comparison
  // This ensures that workouts at 11:30 PM and 12:05 AM next day are correctly
  // identified as different calendar days
  const uniqueDatesArray = Array.from(new Set(sortedWorkouts.map(w => {
    const d = new Date(w.date);
    d.setHours(0, 0, 0, 0); // Normalize to local midnight
    return d.getTime();
  }))).sort((a, b) => a - b);

  // Build a map of normalized dates to sessions for quick lookup
  // Used by findLongestValidStreak to check strength requirement per week
  const dateToSessions = new Map();
  sortedWorkouts.forEach(workout => {
    const d = new Date(workout.date);
    d.setHours(0, 0, 0, 0); // Normalize to local midnight
    const timestamp = d.getTime();
    if (!dateToSessions.has(timestamp)) {
      dateToSessions.set(timestamp, []);
    }
    dateToSessions.get(timestamp).push(workout);
  });

  // Normalize "today" to local midnight for consistent comparison
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayTime = today.getTime();
  
  let longestStreak = 0;
  let currentStreak = 0;
  let tempStreakDates = []; // Accumulator for consecutive days
  let lastDateInStreak = null;

  // Iterate through unique workout dates to identify consecutive-day streaks
  // Key insight: We look for gaps (daysDiff !== 1) to break streaks
  for (let i = 0; i < uniqueDatesArray.length; i++) {
    const currentDate = uniqueDatesArray[i];
    
    // Check if this date continues an existing streak or starts a new one
    if (lastDateInStreak === null) {
      // Start of a new streak (first workout or after a gap)
      tempStreakDates = [currentDate];
      lastDateInStreak = currentDate;
    } else {
      const daysDiff = daysBetween(lastDateInStreak, currentDate);
      
      if (daysDiff === 1) {
        // Consecutive day - add to current streak
        // This works across week boundaries (Sat→Sun, etc.)
        tempStreakDates.push(currentDate);
        lastDateInStreak = currentDate;
      } else {
        // Gap found (daysDiff > 1 or daysDiff < 1 if dates are out of order)
        // Validate and potentially record the accumulated streak
        const validStreakLen = findLongestValidStreak(tempStreakDates, dateToSessions);
        if (validStreakLen > 0) {
          longestStreak = Math.max(longestStreak, validStreakLen);
          
          // Check if this validated streak is the "current" streak
          // Current streak requires last day to be today or yesterday
          const streakEndDate = tempStreakDates[validStreakLen - 1];
          const daysSince = daysBetween(streakEndDate, todayTime);
          if (daysSince <= 1) {
            currentStreak = validStreakLen;
          }
        }
        
        // Start new streak with the current date
        tempStreakDates = [currentDate];
        lastDateInStreak = currentDate;
      }
    }
  }

  // Check final accumulated streak (after loop completes)
  if (tempStreakDates.length > 0) {
    const validStreakLen = findLongestValidStreak(tempStreakDates, dateToSessions);
    if (validStreakLen > 0) {
      longestStreak = Math.max(longestStreak, validStreakLen);
      
      // Check if this is the current streak
      // Grace period: if last workout was yesterday or today, streak is still active
      const streakEndDate = tempStreakDates[validStreakLen - 1];
      const daysSince = daysBetween(streakEndDate, todayTime);
      if (daysSince <= 1) {
        currentStreak = validStreakLen;
      }
    }
  }

  return { currentStreak, longestStreak };
};

/**
 * Calculate adherence percentage
 * If user's first session was less than 30 days ago, calculates adherence based on 
 * days since first session. Otherwise uses the last 30 days.
 * Week 0 sessions (first sessions on Wed-Sat before first Sunday) are excluded from adherence.
 * 
 * @param {Array} workoutHistory - Array of completed workout objects
 * @param {Object} activePlan - Active plan with scheduled sessions (optional, currently unused but kept for API compatibility)
 * @param {number} days - Number of days to calculate adherence for (default 30)
 * @param {Object} weekScheduling - Week scheduling context with Week 0 info (optional)
 * @returns {number} Adherence percentage (0-100)
 */
export const calculateAdherence = (workoutHistory = [], activePlan = null, days = 30, weekScheduling = null) => { // eslint-disable-line no-unused-vars
  if (!workoutHistory || workoutHistory.length === 0) {
    return 0;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Find the date of the first session (optimized to create Date objects only once)
  const timestamps = workoutHistory.map(w => new Date(w.date).getTime());
  const firstSessionDate = new Date(Math.min(...timestamps));
  firstSessionDate.setHours(0, 0, 0, 0);

  // Determine the start date for adherence calculation
  // If Week 0 exists, start from the beginning of Week 1 (exclude Week 0)
  let adherenceStartDate = firstSessionDate;
  if (weekScheduling?.isWeekZero && weekScheduling?.cycleStartDate) {
    const week1Start = new Date(weekScheduling.cycleStartDate);
    week1Start.setHours(0, 0, 0, 0);
    
    // If Week 1 has started, use that as the start date
    // Otherwise, if we're still in Week 0, adherence is 0
    if (today >= week1Start) {
      adherenceStartDate = week1Start;
    } else {
      // Still in Week 0, no adherence yet
      return 0;
    }
  } else if (weekScheduling?.weekZeroStartDate && weekScheduling?.cycleStartDate) {
    // Week 0 existed in the past but we've moved to Week 1+
    const week1Start = new Date(weekScheduling.cycleStartDate);
    week1Start.setHours(0, 0, 0, 0);
    adherenceStartDate = week1Start;
  }

  // Calculate days since adherence start
  const daysSinceStart = Math.floor((today - adherenceStartDate) / (1000 * 60 * 60 * 24)) + 1;

  // Use the smaller of: days parameter or days since adherence start
  const effectiveDays = daysSinceStart < days ? daysSinceStart : days;

  const cutoffDate = new Date(today);
  cutoffDate.setDate(cutoffDate.getDate() - effectiveDays + 1); // +1 to include today
  cutoffDate.setHours(0, 0, 0, 0);

  // Filter out Week 0 sessions and get unique session dates in the effective period
  const uniqueSessionDates = new Set();
  workoutHistory.forEach(w => {
    const workoutDate = new Date(w.date);
    workoutDate.setHours(0, 0, 0, 0);
    
    // Skip if this session is in Week 0
    if (weekScheduling?.weekZeroStartDate && weekScheduling?.cycleStartDate) {
      const weekZeroStart = new Date(weekScheduling.weekZeroStartDate);
      const week1Start = new Date(weekScheduling.cycleStartDate);
      weekZeroStart.setHours(0, 0, 0, 0);
      week1Start.setHours(0, 0, 0, 0);
      
      if (workoutDate >= weekZeroStart && workoutDate < week1Start) {
        return; // Skip Week 0 sessions
      }
    }
    
    if (workoutDate >= cutoffDate && workoutDate <= today) {
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
