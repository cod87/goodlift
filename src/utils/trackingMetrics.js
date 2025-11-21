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
 * Calculate current workout streak in days
 * Includes rest days - only breaks if user misses planned workout
 * @param {Array} workoutHistory - Array of completed workout objects with date
 * @param {Object} activePlan - Optional active plan with scheduled sessions
 * @returns {Object} { currentStreak: number, longestStreak: number }
 */
export const calculateStreak = (workoutHistory = []) => {
  if (!workoutHistory || workoutHistory.length === 0) {
    return { currentStreak: 0, longestStreak: 0 };
  }

  // Sort workouts by date (newest first)
  const sortedWorkouts = [...workoutHistory].sort((a, b) => 
    new Date(b.date) - new Date(a.date)
  );

  // Get unique workout dates (in case multiple workouts on same day)
  const workoutDates = new Set(sortedWorkouts.map(w => {
    const d = new Date(w.date);
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  }));

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  let currentStreak = 0;
  let longestStreak = 0;
  let streakCount = 0;
  let checkDate = new Date(today);
  let missedDaysInCurrentWeek = 0;
  let isCurrentStreakActive = false;
  
  // First check if there's a session within the last 2 days to start the current streak
  const lastSessionDate = new Date(sortedWorkouts[0].date);
  lastSessionDate.setHours(0, 0, 0, 0);
  const daysSinceLastSession = Math.floor((today - lastSessionDate) / (1000 * 60 * 60 * 24));
  if (daysSinceLastSession <= 1) {
    isCurrentStreakActive = true; // User has worked out today or yesterday
  }

  // Calculate current streak
  // Allow one unlogged rest day per week (as long as missed days are not within 7 days of each other)
  for (let i = 0; i < 365; i++) { // Check up to 365 days
    const checkTime = checkDate.getTime();
    
    // Track week boundaries (every 7 days from today)
    const daysSinceWeekStart = Math.floor((today.getTime() - checkDate.getTime()) / (1000 * 60 * 60 * 24)) % 7;
    if (daysSinceWeekStart === 0 && i > 0) {
      // Reset missed days counter for new week
      missedDaysInCurrentWeek = 0;
    }
    
    if (workoutDates.has(checkTime)) {
      // Found a session on this day
      streakCount++;
      // Update current streak if it's still active
      if (isCurrentStreakActive) {
        currentStreak = streakCount;
      }
      longestStreak = Math.max(longestStreak, streakCount);
    } else {
      // No session on this day
      missedDaysInCurrentWeek++;
      
      // Check if this breaks the streak
      // Streak breaks if: more than 1 missed day per week, OR 2+ consecutive missed days
      if (missedDaysInCurrentWeek > 1) {
        // Check if we have 2 consecutive missed days (within 7 days)
        const nextDate = new Date(checkDate);
        nextDate.setDate(nextDate.getDate() - 1);
        if (!workoutDates.has(nextDate.getTime()) && i > 0) {
          // Two consecutive days without session - break streak
          if (isCurrentStreakActive && streakCount > 0) {
            isCurrentStreakActive = false; // Current streak has ended
          }
          streakCount = 0;
          missedDaysInCurrentWeek = 0;
        }
      }
    }
    
    checkDate.setDate(checkDate.getDate() - 1);
  }

  return { currentStreak, longestStreak };
};

/**
 * Calculate adherence percentage
 * If user's first session was less than 30 days ago, calculates adherence based on 
 * days since first session. Otherwise uses the last 30 days.
 * @param {Array} workoutHistory - Array of completed workout objects
 * @param {Object} activePlan - Active plan with scheduled sessions (optional)
 * @param {number} days - Number of days to calculate adherence for (default 30)
 * @returns {number} Adherence percentage (0-100)
 */
export const calculateAdherence = (workoutHistory = [], activePlan = null, days = 30) => {
  if (!workoutHistory || workoutHistory.length === 0) {
    return 0;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Find the date of the first session (optimized to create Date objects only once)
  const timestamps = workoutHistory.map(w => new Date(w.date).getTime());
  const firstSessionDate = new Date(Math.min(...timestamps));
  firstSessionDate.setHours(0, 0, 0, 0);

  // Calculate days since first session
  const daysSinceFirstSession = Math.floor((today - firstSessionDate) / (1000 * 60 * 60 * 24)) + 1;

  // Use the smaller of: days parameter or days since first session
  const effectiveDays = daysSinceFirstSession < days ? daysSinceFirstSession : days;

  const cutoffDate = new Date(today);
  cutoffDate.setDate(cutoffDate.getDate() - effectiveDays + 1); // +1 to include today
  cutoffDate.setHours(0, 0, 0, 0);

  // Get unique session dates in the effective period
  const uniqueSessionDates = new Set();
  workoutHistory.forEach(w => {
    const workoutDate = new Date(w.date);
    workoutDate.setHours(0, 0, 0, 0);
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
