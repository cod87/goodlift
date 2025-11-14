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
 * 
 * SESSION DATA MODEL:
 * All sessions have these base fields:
 * - id: string - Unique session identifier
 * - date: number - Timestamp of the session date
 * - type: string - Session type (upper, lower, full, push, pull, legs, hiit, stretch, cardio)
 * - status: string - Session status (planned, in_progress, completed, skipped)
 * - notes: string - User notes
 * - completedAt: number|null - Timestamp when completed
 * 
 * Standard workout sessions (upper, lower, full, push, pull, legs):
 * - exercises: Array<Object> - Array of exercise objects with sets, reps, etc.
 * - sessionData: null
 * 
 * HIIT sessions:
 * - exercises: null
 * - sessionData: Object - Generated HIIT session with warmup, mainWorkout, cooldown
 *   - protocol: Object - HIIT protocol configuration
 *   - warmup: Object - Warmup exercises and duration
 *   - mainWorkout: Object - Main workout with exercises array, rounds, work/rest intervals
 *   - cooldown: Object - Cooldown exercises and duration
 *   - totalDuration: number - Total session duration in seconds
 * 
 * Stretch sessions:
 * - exercises: null
 * - sessionData: Object - Generated stretch session with stretch sequences
 *   - warmup: Object - Dynamic warmup
 *   - mainStretches: Object - Main stretching sequences
 *   - cooldown: Object - Static cooldown stretches
 *   - totalDuration: number - Total session duration in seconds
 */

import { MUSCLE_GROUPS } from './constants.js';
import { generateStandardWorkout } from './workoutGenerator.js';

/**
 * Validate a session object has required fields based on its type
 * @param {Object} session - Session object to validate
 * @returns {Object} Validation result with isValid and errors array
 */
export const validateSession = (session) => {
  const errors = [];
  
  if (!session.id) errors.push('Session missing id');
  if (!session.date) errors.push('Session missing date');
  if (!session.type) errors.push('Session missing type');
  if (!session.status) errors.push('Session missing status');
  
  // Check for population errors
  if (session.populationError) {
    errors.push(session.populationError);
  }
  
  // Validate type-specific required data
  const isStandardWorkout = ['upper', 'lower', 'full', 'push', 'pull', 'legs'].includes(session.type);
  
  if (isStandardWorkout) {
    if (!session.exercises || !Array.isArray(session.exercises) || session.exercises.length === 0) {
      errors.push(`Standard workout session (${session.type}) missing exercises array`);
    }
  } else {
    errors.push(`Unsupported session type: ${session.type}. Only standard workout types are supported.`);
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

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
export const generateWorkoutPlan = async (preferences) => {
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

  // Calculate deload weeks - ensures three identical weeks followed by deload week
  const deloadWeeks = calculateDeloadWeeks(duration);
  
  // Populate session data for all sessions
  // IMPORTANT: For progressive overload to work, we reuse the same exercises week-to-week
  // until a deload week, then we can optionally vary them for the next block
  const exerciseCache = {}; // Cache exercises by session type and week block
  
  // Process sessions sequentially to ensure cache is populated correctly
  const populatedSessions = [];
  for (let index = 0; index < sessions.length; index++) {
    const session = sessions[index];
    const weekNumber = Math.floor(index / daysPerWeek) + 1;
    const isDeloadWeek = deloadWeeks.includes(weekNumber);
    
    // Determine which training block we're in (changes after each deload)
    const blockNumber = deloadWeeks.filter(w => w < weekNumber).length + 1;
    
    // Create a cache key based on session type and training block
    // This ensures same exercises are used within a block
    const cacheKey = `${session.type}_block${blockNumber}`;
    
    // For the first session of this type in this block, generate new exercises
    // For subsequent sessions, reuse the cached exercises
    if (!exerciseCache[cacheKey]) {
      const populated = await populateSessionData(session, experienceLevel, weekNumber, equipmentAvailable, isDeloadWeek);
      exerciseCache[cacheKey] = populated.exercises || populated.sessionData;
      populatedSessions.push(populated);
    } else {
      // Reuse exercises from the first week of this block
      populatedSessions.push({
        ...session,
        exercises: session.type !== 'hiit' && session.type !== 'stretch' 
          ? exerciseCache[cacheKey] 
          : null,
        sessionData: session.type === 'hiit' || session.type === 'stretch'
          ? exerciseCache[cacheKey]
          : null,
        isDeloadWeek
      });
    }
  }

  // Validate sessions were properly populated
  const validationErrors = [];
  populatedSessions.forEach((session, index) => {
    const validation = validateSession(session);
    if (!validation.isValid) {
      validationErrors.push(`Session ${index + 1} (${session.type}): ${validation.errors.join(', ')}`);
    }
  });

  if (validationErrors.length > 0) {
    console.warn('Some sessions failed validation:', validationErrors);
    // Log warnings but don't fail - allow users to regenerate specific sessions later
  }

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
    sessions: populatedSessions,
    deloadWeeks, // Track which weeks are deload weeks
    periodization: {
      type: duration >= 56 ? 'undulating' : 'linear', // Undulating for 8+ weeks
      deloadFrequency: 4, // Every 4 weeks
      volumeProgression: '10% weekly increase',
    },
    created: Date.now(),
    modified: Date.now(),
    active: true,
    validationWarnings: validationErrors.length > 0 ? validationErrors : []
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
        exercises: null, // Standard workouts populated when started
        sessionData: null, // HIIT/Yoga sessions will store generated data here
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
  const includeStretch = sessionTypes.includes('stretch');

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

    // Add stretch/mobility for recovery
    if (includeStretch && pattern.length >= 3) {
      pattern.push('stretch');
    }
  } else {
    // If no standard workouts, create pattern from other types
    if (includeHiit) pattern.push('hiit');
    if (includeCardio) pattern.push('cardio');
    if (includeStretch) pattern.push('stretch');
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
        sessionTypes: ['full', 'cardio', 'stretch'],
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
        sessionTypes: ['full', 'hiit', 'stretch'],
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
        sessionTypes: ['full', 'hiit', 'stretch'],
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
 * Creates three identical weeks of workouts followed by a deload week within every four-week set
 * Per WORKOUT-PLANNING-GUIDE.md: deload every 4 weeks (25-50% volume reduction)
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

/**
 * Enhanced session pattern generator with HIIT and Stretch integration
 * Based on .github/HIIT-STRETCH-GUIDE.md Section 9 (Sample Integration Schedules)
 * 
 * Key principles from the guide:
 * - HIIT sessions not on consecutive days (48+ hours recovery)
 * - Balance high-intensity (HIIT/strength) with recovery (stretching)
 * - Target 60/40 ratio of high-intensity to recovery sessions
 * - Deload weeks every 3-4 weeks
 * 
 * @param {string} splitType - Workout split type
 * @param {Array<string>} sessionTypes - Allowed session types
 * @param {string} experienceLevel - User experience level
 * @param {number} daysPerWeek - Training days per week
 * @returns {Array<string>} Enhanced pattern with HIIT and Stretch
 */
export const generateEnhancedSessionPattern = (splitType, sessionTypes, experienceLevel, daysPerWeek) => {
  const includeStandardWorkouts = sessionTypes.some(t => 
    ['full', 'upper', 'lower', 'push', 'pull', 'legs'].includes(t)
  );
  const includeHiit = sessionTypes.includes('hiit');
  const includeStretch = sessionTypes.includes('stretch');
  
  let pattern = [];
  
  // Build base pattern following HIIT-STRETCH-GUIDE.md Section 9 templates
  if (experienceLevel === 'beginner' && daysPerWeek >= 3) {
    // Beginner 7-Day Schedule (Guide Section 9.1)
    if (includeStandardWorkouts && includeHiit && includeStretch) {
      pattern = [
        'upper',           // Mon: Upper Body Strength
        'hiit',            // Tue: Beginner HIIT + Dynamic stretching
        'lower',           // Wed: Lower Body Strength + HIIT finisher
        'stretch',         // Thu: Flexibility stretch - Active Recovery
        'full',            // Fri: Full Body Strength + HIIT
        'hiit',            // Sat: HIIT + Static stretching
        'stretch'          // Sun: Rest/Static stretch - Deep relaxation
      ];
    } else if (includeStandardWorkouts) {
      pattern = ['full', 'full', 'full'];
    }
  } else if (experienceLevel === 'intermediate' && daysPerWeek >= 4) {
    // Intermediate 7-Day Schedule (Guide Section 9.2)
    if (includeStandardWorkouts && includeHiit && includeStretch) {
      pattern = [
        'upper',           // Mon: Upper + Intermediate HIIT
        'hiit',            // Tue: Cycling HIIT + Core stretching
        'lower',           // Wed: Lower + Step HIIT
        'stretch',         // Thu: Dynamic stretch - Moderate
        'upper',           // Fri: Upper + Plyometric HIIT
        'hiit',            // Sat: Rowing HIIT + Static stretch
        'stretch'          // Sun: Flexibility stretch or Active Recovery
      ];
    } else if (splitType === 'upper_lower') {
      pattern = ['upper', 'lower', 'upper', 'lower'];
    } else {
      pattern = ['full', 'full', 'full', 'full'];
    }
  } else if (experienceLevel === 'advanced' && daysPerWeek >= 5) {
    // Advanced 7-Day Schedule (Guide Section 9.3)
    if (includeStandardWorkouts && includeHiit && includeStretch) {
      pattern = [
        'upper',           // Mon: Upper + Advanced Tabata
        'hiit',            // Tue: REHIT Cycling + Dynamic stretch
        'lower',           // Wed: Lower + Advanced Plyometric
        'hiit',            // Thu: Rowing/Elliptical HIIT
        'upper',           // Fri: Upper + Step HIIT Advanced
        'stretch',         // Sat: Dynamic stretch + Static (evening)
        'stretch'          // Sun: Static stretch or Active Recovery
      ];
    } else if (splitType === 'ppl') {
      pattern = ['push', 'pull', 'legs', 'push', 'pull', 'legs'];
    } else if (splitType === 'upper_lower') {
      pattern = ['upper', 'lower', 'upper', 'lower', 'upper'];
    }
  } else {
    // Fallback to basic pattern
    if (splitType === 'full_body') {
      pattern = ['full', 'full', 'full'];
    } else if (splitType === 'upper_lower') {
      pattern = ['upper', 'lower', 'upper', 'lower'];
    } else if (splitType === 'ppl') {
      pattern = ['push', 'pull', 'legs', 'push', 'pull', 'legs'];
    }
  }
  
  // Trim pattern to match days per week
  if (pattern.length > daysPerWeek) {
    pattern = pattern.slice(0, daysPerWeek);
  }
  
  // Ensure pattern is not empty
  if (pattern.length === 0) {
    pattern = ['full'];
  }
  
  return pattern;
};

/**
 * Validate HIIT session spacing
 * Ensures HIIT sessions are not scheduled on consecutive days
 * Per Guide Section 1.3: Allow 48+ hours between HIIT sessions
 * 
 * @param {Array<Object>} sessions - Array of session objects
 * @returns {Object} Validation result with warnings
 */
export const validateHiitSpacing = (sessions) => {
  const hiitSessions = sessions.filter(s => 
    s.type === 'hiit' || s.type.startsWith('hiit')
  );
  
  const warnings = [];
  
  for (let i = 1; i < hiitSessions.length; i++) {
    const prevDate = new Date(hiitSessions[i - 1].date);
    const currDate = new Date(hiitSessions[i].date);
    const hoursDiff = (currDate - prevDate) / (1000 * 60 * 60);
    
    if (hoursDiff < 48) {
      warnings.push({
        session1: hiitSessions[i - 1].id,
        session2: hiitSessions[i].id,
        hoursBetween: hoursDiff,
        recommendation: 'HIIT sessions should be spaced 48+ hours apart for adequate recovery (Guide Section 1.3)'
      });
    }
  }
  
  return {
    valid: warnings.length === 0,
    warnings
  };
};

/**
 * Calculate sympathetic/parasympathetic balance
 * Per Guide Section 10.1: Target 60% HIIT/power, 40% restorative/flexibility
 * 
 * @param {Array<Object>} sessions - Array of session objects
 * @returns {Object} Balance analysis
 */
export const calculateSympatheticBalance = (sessions) => {
  const sympatheticSessions = sessions.filter(s => 
    s.type === 'hiit' || 
    s.type === 'upper' || 
    s.type === 'lower' || 
    s.type === 'full' || 
    s.type === 'push' || 
    s.type === 'pull' || 
    s.type === 'legs'
  ).length;
  
  const recoverySessions = sessions.filter(s => 
    s.type === 'stretch'
  ).length;
  
  const total = sessions.length;
  const sympatheticPercent = (sympatheticSessions / total) * 100;
  const recoveryPercent = (recoverySessions / total) * 100;
  
  // Guide recommends 60/40 ratio
  const isBalanced = sympatheticPercent >= 50 && sympatheticPercent <= 70;
  
  return {
    sympatheticSessions,
    recoverySessions,
    sympatheticPercent,
    recoveryPercent,
    isBalanced,
    recommendation: !isBalanced 
      ? 'Consider adjusting to achieve 60/40 ratio of high-intensity to recovery sessions'
      : 'Good balance between high-intensity and recovery activities'
  };
};

/**
 * Apply progressive overload to HIIT sessions
 * Per Guide Section 10.2: Progressive overload for HIIT
 * 
 * Week 1-2: Learn movements, focus on form
 * Week 3-4: Increase intensity
 * Week 5-6: Increase duration
 * Week 7-8: Decrease rest period
 * Week 9-12: Deload
 * 
 * @param {number} weekNumber - Current week number (1-based)
 * @param {Object} baseSession - Base HIIT session configuration
 * @returns {Object} Adjusted session parameters
 */
export const applyHiitProgression = (weekNumber, baseSession) => {
  const { intensity = 'moderate', duration = 25, restRatio = 1 } = baseSession;
  
  let adjustedIntensity = intensity;
  let adjustedDuration = duration;
  let adjustedRestRatio = restRatio;
  
  if (weekNumber <= 2) {
    // Week 1-2: Learn movements, lower intensity
    adjustedIntensity = 'learning';
    adjustedDuration = duration * 0.8;
  } else if (weekNumber <= 4) {
    // Week 3-4: Increase intensity
    adjustedIntensity = 'moderate';
    adjustedDuration = duration;
  } else if (weekNumber <= 6) {
    // Week 5-6: Increase duration
    adjustedIntensity = 'moderate';
    adjustedDuration = duration * 1.1;
  } else if (weekNumber <= 8) {
    // Week 7-8: Decrease rest (increase work-to-rest ratio)
    adjustedIntensity = 'high';
    adjustedDuration = duration * 1.1;
    adjustedRestRatio = restRatio * 0.8; // Less rest = higher intensity
  } else {
    // Week 9+: Deload or maintain
    const deloadWeek = weekNumber % 4 === 0;
    if (deloadWeek) {
      adjustedIntensity = 'moderate';
      adjustedDuration = duration * 0.7;
      adjustedRestRatio = restRatio * 1.2; // More rest during deload
    } else {
      adjustedIntensity = 'high';
      adjustedDuration = duration * 1.1;
      adjustedRestRatio = restRatio * 0.8;
    }
  }
  
  return {
    intensity: adjustedIntensity,
    duration: Math.round(adjustedDuration),
    restRatio: adjustedRestRatio,
    weekNumber,
    guideReference: 'Section 10.2'
  };
};

/**
 * Get all recurring sessions of the same type in the current training block
 * @param {Object} plan - Workout plan
 * @param {string} sessionId - ID of a session in the block
 * @returns {Array<Object>} Array of session objects in the same training block with same type
 */
export const getRecurringSessionsInBlock = (plan, sessionId) => {
  const targetSession = plan.sessions.find(s => s.id === sessionId);
  if (!targetSession) return [];
  
  const sessionType = targetSession.type;
  const daysPerWeek = plan.daysPerWeek;
  const deloadWeeks = plan.deloadWeeks || [];
  
  // Find the session's index in the plan
  const sessionIndex = plan.sessions.findIndex(s => s.id === sessionId);
  const sessionWeek = Math.floor(sessionIndex / daysPerWeek) + 1;
  
  // Find the start and end weeks for this block
  const prevDeloadWeek = deloadWeeks.filter(w => w < sessionWeek).pop() || 0;
  const nextDeloadWeek = deloadWeeks.find(w => w > sessionWeek) || Math.ceil(plan.duration / 7) + 1;
  
  // Get all sessions of the same type in this block
  return plan.sessions.filter((session, index) => {
    const week = Math.floor(index / daysPerWeek) + 1;
    return session.type === sessionType && 
           week > prevDeloadWeek && 
           week < nextDeloadWeek;
  });
};

/**
 * Update exercises for all recurring sessions of the same type in a training block
 * @param {Object} plan - Workout plan
 * @param {string} sessionId - ID of any session in the recurring group
 * @param {Array<Object>} newExercises - New exercises to apply to all recurring sessions
 * @returns {Object} Updated plan
 */
export const updateRecurringSessionExercises = (plan, sessionId, newExercises) => {
  if (!plan || !sessionId || !newExercises) {
    throw new Error('Plan, sessionId, and newExercises are required');
  }

  if (!Array.isArray(newExercises) || newExercises.length === 0) {
    throw new Error('newExercises must be a non-empty array');
  }

  const recurringSessions = getRecurringSessionsInBlock(plan, sessionId);
  if (recurringSessions.length === 0) {
    console.warn('No recurring sessions found for this session');
    return plan;
  }
  
  const recurringSessionIds = new Set(recurringSessions.map(s => s.id));
  
  const updatedSessions = plan.sessions.map(session => {
    if (recurringSessionIds.has(session.id)) {
      // Update standard workout sessions with new exercises
      if (['upper', 'lower', 'full', 'push', 'pull', 'legs'].includes(session.type)) {
        return {
          ...session,
          exercises: newExercises
        };
      }
    }
    return session;
  });
  
  return {
    ...plan,
    sessions: updatedSessions,
    modified: Date.now()
  };
};

/**
 * Populate session data for all session types
 * Generates full session objects so users don't need to re-generate on start
 * 
 * IMPORTANT: This function is async and must be awaited. It uses fetch and dynamic imports
 * which may fail if exercises data is unavailable. On error, it returns the original session
 * with a warning flag so validation can catch it.
 * 
 * @param {Object} session - Session object from plan
 * @param {string} experienceLevel - User's experience level
 * @param {number} weekNumber - Week number in the plan for progressive overload
 * @param {Array<string>} equipmentAvailable - Equipment available for workouts
 * @returns {Promise<Object>} Session with populated data, or original session with error flag on failure
 */
export const populateSessionData = async (session, experienceLevel, weekNumber, equipmentAvailable = ['all']) => {
  // For standard workouts (upper, lower, full, push, pull, legs), 
  // generate exercises using the workout generator
  if (['upper', 'lower', 'full', 'push', 'pull', 'legs'].includes(session.type)) {
    try {
      // Use static import - already imported at top of file
      
      // Load exercises from public data
      const exercisesResponse = await fetch(`${import.meta.env.BASE_URL}data/exercises.json`);
      const exercises = exercisesResponse.ok ? await exercisesResponse.json() : [];
      
      // Filter exercises based on workout type requirements
      let filteredExercises = exercises;
      
      // Filter by workout type field from CSV
      if (session.type === 'upper') {
        filteredExercises = exercises.filter(ex => 
          ex['Workout Type'] && 
          (ex['Workout Type'].includes('Upper Body') || 
           ex['Workout Type'].includes('Full Body') ||
           ex['Workout Type'].includes('Push/Pull/Legs'))
        );
      } else if (session.type === 'lower') {
        filteredExercises = exercises.filter(ex => 
          ex['Workout Type'] && 
          (ex['Workout Type'].includes('Lower Body') || 
           ex['Workout Type'].includes('Full Body') ||
           ex['Workout Type'].includes('Push/Pull/Legs'))
        );
      } else if (session.type === 'full') {
        filteredExercises = exercises.filter(ex => 
          ex['Workout Type'] && ex['Workout Type'].includes('Full Body')
        );
      } else if (['push', 'pull', 'legs'].includes(session.type)) {
        filteredExercises = exercises.filter(ex => 
          ex['Workout Type'] && ex['Workout Type'].includes('Push/Pull/Legs')
        );
      }
      
      // Generate workout with equipment filter and experience level
      const equipmentFilter = equipmentAvailable.includes('all') ? 'all' : equipmentAvailable;
      const workoutExercises = generateStandardWorkout(filteredExercises, session.type, equipmentFilter, experienceLevel);
      
      return {
        ...session,
        exercises: workoutExercises,
        sessionData: null
      };
    } catch (error) {
      console.error('Error generating standard workout session:', error);
      return {
        ...session,
        exercises: [], // Return empty array instead of undefined
        populationError: `Failed to generate exercises: ${error.message}`
      };
    }
  }

  // HIIT and Yoga sessions are no longer supported
  // Return session as-is for standard workout types with null fields for consistency
  return {
    ...session,
    exercises: session.exercises || null,
    sessionData: session.sessionData || null
  };
};
