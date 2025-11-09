/**
 * Workout Plan Generator
 * Generates customizable workout plans for up to 90 days based on user preferences
 * 
 * Based on evidence-based principles from WORKOUT-PLANNING-GUIDE.md:
 * - Agonist-antagonist superset training for time efficiency
 * - Progressive overload with 10% weekly increases
 * - Volume: 10-20 sets per muscle group per week for hypertrophy
 * - Frequency: 2x minimum per muscle group per week
 * - Periodization with deload weeks every 3-4 weeks
 * - Rep ranges: 6-12 for hypertrophy, 1-6 for strength
 */

import { MUSCLE_GROUPS } from './constants';

/**
 * Generate a workout plan based on user preferences
 * @param {Object} preferences - User preferences for plan generation
 * @param {string} preferences.goal - Fitness goal: "strength" | "hypertrophy" | "fat_loss" | "general_fitness"
 * @param {string} preferences.experienceLevel - Experience level: "beginner" | "intermediate" | "advanced"
 * @param {number} preferences.daysPerWeek - Number of training days per week (2-7)
 * @param {number} preferences.duration - Plan duration in days (1-90)
 * @param {Date} preferences.startDate - Plan start date
 * @param {Array<string>} preferences.sessionTypes - Session types to include
 * @param {Array<string>} preferences.equipmentAvailable - Available equipment
 * @param {Array<number>} preferences.preferredDays - Preferred training days (0-6, where 0 is Sunday)
 * @returns {Object} Generated workout plan
 */
export const generateWorkoutPlan = (preferences) => {
  const {
    goal = 'general_fitness',
    experienceLevel = 'intermediate',
    daysPerWeek = 3,
    duration = 30,
    startDate = new Date(),
    sessionTypes = ['full'],
    equipmentAvailable = ['all'],
    preferredDays = null,
    planName = 'My Workout Plan'
  } = preferences;

  // Validate inputs
  if (daysPerWeek < 2 || daysPerWeek > 7) {
    throw new Error('Days per week must be between 2 and 7');
  }
  if (duration < 1 || duration > 90) {
    throw new Error('Duration must be between 1 and 90 days');
  }

  // Determine split type based on days per week
  const splitType = determineSplitType(daysPerWeek, experienceLevel);

  // Generate session schedule
  const sessions = generateSessionSchedule({
    startDate,
    duration,
    daysPerWeek,
    splitType,
    sessionTypes,
    preferredDays,
    experienceLevel
  });

  // Calculate deload weeks (every 3-4 weeks per guide recommendations)
  const deloadWeeks = calculateDeloadWeeks(duration);

  // Create plan object
  const plan = {
    id: generatePlanId(),
    name: planName,
    startDate: startDate.getTime(),
    endDate: new Date(startDate.getTime() + duration * 24 * 60 * 60 * 1000).getTime(),
    duration,
    goal,
    experienceLevel,
    daysPerWeek,
    splitType,
    sessionTypes,
    equipmentAvailable,
    sessions,
    deloadWeeks, // Track which weeks are deload weeks
    periodization: {
      type: duration >= 56 ? 'undulating' : 'linear', // Undulating for 8+ weeks
      deloadFrequency: 4, // Every 4 weeks
      volumeProgression: '10% weekly increase',
    },
    created: Date.now(),
    modified: Date.now(),
    active: true
  };

  return plan;
};

/**
 * Determine the appropriate split type based on training frequency and experience
 * @param {number} daysPerWeek - Training days per week
 * @param {string} experienceLevel - User experience level
 * @returns {string} Split type
 */
const determineSplitType = (daysPerWeek, experienceLevel) => {
  if (daysPerWeek <= 3 || experienceLevel === 'beginner') {
    return 'full_body';
  } else if (daysPerWeek === 4 || daysPerWeek === 5) {
    return 'upper_lower';
  } else {
    return 'ppl'; // Push/Pull/Legs
  }
};

/**
 * Generate session schedule for the plan
 * @param {Object} params - Schedule parameters
 * @returns {Array} Array of session objects
 */
const generateSessionSchedule = (params) => {
  const {
    startDate,
    duration,
    daysPerWeek,
    splitType,
    sessionTypes,
    preferredDays,
    experienceLevel
  } = params;

  const sessions = [];
  const startTime = new Date(startDate);
  startTime.setHours(0, 0, 0, 0);

  // Calculate which days of the week to train
  const trainingDays = calculateTrainingDays(daysPerWeek, preferredDays);

  // Generate session pattern based on split type
  const sessionPattern = generateSessionPattern(splitType, sessionTypes, experienceLevel);

  let sessionPatternIndex = 0;
  let currentDate = new Date(startTime);

  // Generate sessions for the duration
  while (currentDate.getTime() < startTime.getTime() + duration * 24 * 60 * 60 * 1000) {
    const dayOfWeek = currentDate.getDay();

    // Check if this is a training day
    if (trainingDays.includes(dayOfWeek)) {
      const sessionType = sessionPattern[sessionPatternIndex % sessionPattern.length];
      
      sessions.push({
        id: generateSessionId(),
        date: currentDate.getTime(),
        type: sessionType,
        status: 'planned',
        exercises: null, // Will be populated when session is started
        completedAt: null,
        notes: ''
      });

      sessionPatternIndex++;
    }

    // Move to next day
    currentDate = new Date(currentDate.getTime() + 24 * 60 * 60 * 1000);
  }

  return sessions;
};

/**
 * Calculate which days of the week to train
 * @param {number} daysPerWeek - Number of training days
 * @param {Array<number>} preferredDays - User's preferred days (0-6)
 * @returns {Array<number>} Training days (0-6, where 0 is Sunday)
 */
const calculateTrainingDays = (daysPerWeek, preferredDays) => {
  if (preferredDays && preferredDays.length === daysPerWeek) {
    return preferredDays;
  }

  // Default training day patterns
  const patterns = {
    2: [1, 4], // Monday, Thursday
    3: [1, 3, 5], // Monday, Wednesday, Friday
    4: [1, 2, 4, 5], // Mon, Tue, Thu, Fri
    5: [1, 2, 3, 4, 5], // Weekdays
    6: [1, 2, 3, 4, 5, 6], // Mon-Sat
    7: [0, 1, 2, 3, 4, 5, 6] // Every day
  };

  return patterns[daysPerWeek] || patterns[3];
};

/**
 * Generate session pattern based on split type
 * @param {string} splitType - Type of split
 * @param {Array<string>} sessionTypes - Allowed session types
 * @param {string} experienceLevel - Experience level
 * @returns {Array<string>} Pattern of session types
 */
const generateSessionPattern = (splitType, sessionTypes, experienceLevel) => {
  // Filter to only include standard workout types
  const includeStandardWorkouts = sessionTypes.some(t => 
    ['full', 'upper', 'lower', 'push', 'pull', 'legs'].includes(t)
  );
  const includeHiit = sessionTypes.includes('hiit');
  const includeCardio = sessionTypes.includes('cardio');
  const includeYoga = sessionTypes.includes('yoga') || sessionTypes.includes('stretch');

  let pattern = [];

  // Base workout pattern
  if (includeStandardWorkouts) {
    if (splitType === 'full_body') {
      pattern = ['full', 'full', 'full'];
    } else if (splitType === 'upper_lower') {
      pattern = ['upper', 'lower', 'upper', 'lower'];
    } else if (splitType === 'ppl') {
      pattern = ['push', 'pull', 'legs', 'push', 'pull', 'legs'];
    }
  }

  // Add variety sessions
  if (pattern.length > 0) {
    // For intermediate/advanced, add HIIT or cardio after some sessions
    if (experienceLevel !== 'beginner' && (includeHiit || includeCardio)) {
      // Replace or add HIIT/cardio sessions
      if (pattern.length >= 4 && includeHiit) {
        pattern.splice(3, 0, 'hiit');
      } else if (pattern.length >= 3 && includeCardio) {
        pattern.push('cardio');
      }
    }

    // Add yoga/mobility for recovery
    if (includeYoga && pattern.length >= 3) {
      pattern.push('yoga');
    }
  } else {
    // If no standard workouts, create pattern from other types
    if (includeHiit) pattern.push('hiit');
    if (includeCardio) pattern.push('cardio');
    if (includeYoga) pattern.push('yoga');
  }

  // If pattern is still empty, default to full body
  if (pattern.length === 0) {
    pattern = ['full', 'full', 'full'];
  }

  return pattern;
};

/**
 * Generate unique plan ID
 * @returns {string} Unique plan ID
 */
const generatePlanId = () => {
  return `plan_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Generate unique session ID
 * @returns {string} Unique session ID
 */
const generateSessionId = () => {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Get recommended plan template based on goal and experience
 * Based on WORKOUT-PLANNING-GUIDE.md recommendations:
 * - Beginners: 2-4 days/week, full body, lower volume
 * - Intermediate: 3-5 days/week, upper/lower split, moderate volume
 * - Advanced: 4-6 days/week, PPL or specialized splits, higher volume
 * - Volume: 10-20 sets per muscle group per week for hypertrophy
 * - Frequency: 2x per muscle group minimum
 * @param {string} goal - Fitness goal
 * @param {string} experienceLevel - Experience level
 * @returns {Object} Recommended plan preferences
 */
export const getRecommendedPlanTemplate = (goal, experienceLevel) => {
  const templates = {
    beginner: {
      strength: {
        daysPerWeek: 3,
        sessionTypes: ['full'],
        description: '3x/week full body - Each muscle 3x/week for strength adaptation',
        volumePerMuscleGroup: 9, // 3 sets per session x 3 sessions
        repRange: '6-12 reps',
      },
      hypertrophy: {
        daysPerWeek: 3,
        sessionTypes: ['full'],
        description: '3x/week full body - Building foundation with moderate volume',
        volumePerMuscleGroup: 12, // 4 sets per session x 3 sessions
        repRange: '8-12 reps',
      },
      fat_loss: {
        daysPerWeek: 4,
        sessionTypes: ['full', 'hiit'],
        description: '3x/week strength + 1-2x/week HIIT for metabolic stress',
        volumePerMuscleGroup: 10,
        repRange: '10-15 reps',
      },
      general_fitness: {
        daysPerWeek: 3,
        sessionTypes: ['full', 'cardio', 'yoga'],
        description: 'Balanced fitness with variety and recovery',
        volumePerMuscleGroup: 9,
        repRange: '8-12 reps',
      }
    },
    intermediate: {
      strength: {
        daysPerWeek: 4,
        sessionTypes: ['upper', 'lower'],
        description: '4x/week upper/lower - Each muscle 2x/week, strength focus',
        volumePerMuscleGroup: 12, // 6 sets per session x 2 sessions
        repRange: '4-8 reps',
      },
      hypertrophy: {
        daysPerWeek: 4,
        sessionTypes: ['upper', 'lower'],
        description: '4-5x/week upper/lower - Optimal volume for muscle growth',
        volumePerMuscleGroup: 16, // 8 sets per session x 2 sessions
        repRange: '6-12 reps',
      },
      fat_loss: {
        daysPerWeek: 5,
        sessionTypes: ['upper', 'lower', 'hiit'],
        description: '4x/week strength + HIIT for fat loss with muscle preservation',
        volumePerMuscleGroup: 14,
        repRange: '8-15 reps',
      },
      general_fitness: {
        daysPerWeek: 4,
        sessionTypes: ['full', 'hiit', 'yoga'],
        description: 'Well-rounded fitness with strength, conditioning, and mobility',
        volumePerMuscleGroup: 12,
        repRange: '8-12 reps',
      }
    },
    advanced: {
      strength: {
        daysPerWeek: 5,
        sessionTypes: ['upper', 'lower'],
        description: '5x/week upper/lower - High frequency for advanced strength',
        volumePerMuscleGroup: 16, // Variable per session for periodization
        repRange: '1-6 reps (strength), 6-12 reps (hypertrophy blocks)',
      },
      hypertrophy: {
        daysPerWeek: 6,
        sessionTypes: ['push', 'pull', 'legs'],
        description: '6x/week PPL - Maximum volume and specialization',
        volumePerMuscleGroup: 20, // Near upper limit of productive volume
        repRange: '6-12 reps',
      },
      fat_loss: {
        daysPerWeek: 6,
        sessionTypes: ['upper', 'lower', 'hiit'],
        description: '5x/week strength + HIIT - Advanced fat loss protocol',
        volumePerMuscleGroup: 16,
        repRange: '8-15 reps',
      },
      general_fitness: {
        daysPerWeek: 5,
        sessionTypes: ['full', 'hiit', 'yoga'],
        description: 'Advanced balanced training with recovery modalities',
        volumePerMuscleGroup: 14,
        repRange: '6-12 reps',
      }
    }
  };

  return templates[experienceLevel]?.[goal] || templates.intermediate.general_fitness;
};

/**
 * Calculate deload weeks for periodization
 * Per WORKOUT-PLANNING-GUIDE.md: deload every 3-4 weeks (25-50% volume reduction)
 * @param {number} duration - Plan duration in days
 * @returns {Array<number>} Array of week numbers that should be deload weeks
 */
const calculateDeloadWeeks = (duration) => {
  const totalWeeks = Math.floor(duration / 7);
  const deloadWeeks = [];
  
  // Schedule deload every 4 weeks
  for (let week = 4; week <= totalWeeks; week += 4) {
    deloadWeeks.push(week);
  }
  
  return deloadWeeks;
};

/**
 * Customize existing plan with new preferences
 * @param {Object} plan - Existing plan
 * @param {Object} modifications - Plan modifications
 * @returns {Object} Updated plan
 */
export const customizePlan = (plan, modifications) => {
  const updatedPlan = {
    ...plan,
    ...modifications,
    modified: Date.now()
  };

  // If sessions were modified, regenerate if needed
  if (modifications.daysPerWeek || modifications.duration || modifications.sessionTypes) {
    const newSessions = generateSessionSchedule({
      startDate: new Date(updatedPlan.startDate),
      duration: updatedPlan.duration,
      daysPerWeek: updatedPlan.daysPerWeek,
      splitType: updatedPlan.splitType,
      sessionTypes: updatedPlan.sessionTypes,
      preferredDays: null,
      experienceLevel: updatedPlan.experienceLevel
    });
    updatedPlan.sessions = newSessions;
  }

  return updatedPlan;
};

/**
 * Move a session to a different date
 * @param {Object} plan - Workout plan
 * @param {string} sessionId - Session to move
 * @param {Date} newDate - New date for session
 * @returns {Object} Updated plan
 */
export const moveSession = (plan, sessionId, newDate) => {
  const sessions = plan.sessions.map(session => {
    if (session.id === sessionId) {
      return {
        ...session,
        date: newDate.getTime()
      };
    }
    return session;
  });

  return {
    ...plan,
    sessions,
    modified: Date.now()
  };
};

/**
 * Update session status
 * @param {Object} plan - Workout plan
 * @param {string} sessionId - Session to update
 * @param {string} status - New status
 * @param {Object} completedData - Optional completed workout data
 * @returns {Object} Updated plan
 */
export const updateSessionStatus = (plan, sessionId, status, completedData = null) => {
  const sessions = plan.sessions.map(session => {
    if (session.id === sessionId) {
      const updated = {
        ...session,
        status
      };
      if (status === 'completed' && completedData) {
        updated.completedAt = Date.now();
        updated.completedData = completedData;
      }
      return updated;
    }
    return session;
  });

  return {
    ...plan,
    sessions,
    modified: Date.now()
  };
};

/**
 * Add a new session to the plan
 * @param {Object} plan - Workout plan
 * @param {Date} date - Session date
 * @param {string} type - Session type
 * @returns {Object} Updated plan
 */
export const addSessionToPlan = (plan, date, type) => {
  const newSession = {
    id: generateSessionId(),
    date: date.getTime(),
    type,
    status: 'planned',
    exercises: null,
    completedAt: null,
    notes: ''
  };

  return {
    ...plan,
    sessions: [...plan.sessions, newSession].sort((a, b) => a.date - b.date),
    modified: Date.now()
  };
};

/**
 * Remove a session from the plan
 * @param {Object} plan - Workout plan
 * @param {string} sessionId - Session to remove
 * @returns {Object} Updated plan
 */
export const removeSessionFromPlan = (plan, sessionId) => {
  return {
    ...plan,
    sessions: plan.sessions.filter(s => s.id !== sessionId),
    modified: Date.now()
  };
};

/**
 * Get sessions for a specific date range
 * @param {Object} plan - Workout plan
 * @param {Date} startDate - Start of range
 * @param {Date} endDate - End of range
 * @returns {Array} Sessions in range
 */
export const getSessionsInRange = (plan, startDate, endDate) => {
  const start = startDate.getTime();
  const end = endDate.getTime();
  
  return plan.sessions.filter(session => 
    session.date >= start && session.date <= end
  );
};

/**
 * Get upcoming sessions (future and not completed)
 * @param {Object} plan - Workout plan
 * @param {number} limit - Maximum number of sessions to return
 * @returns {Array} Upcoming sessions
 */
export const getUpcomingSessions = (plan, limit = 10) => {
  const now = Date.now();
  
  return plan.sessions
    .filter(session => session.date >= now && session.status === 'planned')
    .slice(0, limit);
};

/**
 * Get plan statistics
 * @param {Object} plan - Workout plan
 * @returns {Object} Plan statistics
 */
export const getPlanStatistics = (plan) => {
  const now = Date.now();
  const totalSessions = plan.sessions.length;
  const completedSessions = plan.sessions.filter(s => s.status === 'completed').length;
  const skippedSessions = plan.sessions.filter(s => s.status === 'skipped').length;
  const missedSessions = plan.sessions.filter(s => 
    s.status === 'planned' && s.date < now
  ).length;
  const upcomingSessions = plan.sessions.filter(s => 
    s.status === 'planned' && s.date >= now
  ).length;

  return {
    totalSessions,
    completedSessions,
    skippedSessions,
    missedSessions,
    upcomingSessions,
    completionRate: totalSessions > 0 ? (completedSessions / totalSessions) * 100 : 0
  };
};
