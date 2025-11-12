/**
 * Unified Session Storage Schema
 * 
 * Defines standardized data structures for all workout sessions, plans, and activities
 * to ensure proper interconnectivity between planning, execution, and progress tracking.
 */

/**
 * Generate a unique session ID
 * @param {string} type - Session type (strength, hiit, stretch, cardio, etc.)
 * @param {string} date - ISO date string
 * @returns {string} Unique session ID
 */
export const generateSessionId = (type, date = new Date().toISOString()) => {
  const dateStr = date.split('T')[0].replace(/-/g, '_');
  const randomStr = Math.random().toString(36).substring(2, 9);
  return `${type}_${dateStr}_${randomStr}`;
};

/**
 * Weekly Plan Schema
 * Main plan structure that contains all workout days
 */
export const createWeeklyPlan = ({
  planStyle = 'ppl', // 'ppl' | 'upper_lower' | 'full_body'
  startDate = new Date().toISOString(),
  customDays = null
}) => {
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + 6);
  
  return {
    planId: `plan_${startDate.split('T')[0].replace(/-/g, '_')}`,
    planStyle,
    startDate,
    endDate: endDate.toISOString(),
    createdAt: new Date().toISOString(),
    days: customDays || generateDefaultDays(planStyle, startDate)
  };
};

/**
 * Generate default 7-day plan based on style
 */
const generateDefaultDays = (planStyle, startDate) => {
  const days = [];
  const baseDate = new Date(startDate);
  
  for (let i = 0; i < 7; i++) {
    const dayDate = new Date(baseDate);
    dayDate.setDate(baseDate.getDate() + i);
    
    days.push(createPlanDay({
      dayIndex: i,
      date: dayDate.toISOString(),
      planStyle
    }));
  }
  
  return days;
};

/**
 * Plan Day Schema
 * Individual day within a weekly plan
 */
export const createPlanDay = ({
  dayIndex,
  date,
  planStyle,
  type = null,
  subtype = null,
  focus = 'strength',
  includes = ['strength'],
  estimatedDuration = 60
}) => {
  // Auto-assign type/subtype based on planStyle if not provided
  if (!type || !subtype) {
    const assignment = assignDayType(planStyle, dayIndex);
    type = type || assignment.type;
    subtype = subtype || assignment.subtype;
  }
  
  return {
    dayIndex,
    date,
    type, // 'strength' | 'hiit' | 'stretch' | 'rest' | 'cardio'
    subtype, // 'push' | 'pull' | 'legs' | 'upper' | 'lower' | 'full'
    focus, // 'strength' | 'hypertrophy' | 'power'
    includes, // array of modalities included
    estimatedDuration,
    generatedWorkout: null, // Will be populated when workout is generated
    completedSessions: [] // Array of session IDs that were logged for this day
  };
};

/**
 * Auto-assign workout type based on plan style and day index
 */
const assignDayType = (planStyle, dayIndex) => {
  const pplSchedule = [
    { type: 'strength', subtype: 'push' },   // Mon
    { type: 'strength', subtype: 'pull' },   // Tue
    { type: 'strength', subtype: 'legs' },   // Wed
    { type: 'stretch', subtype: 'flexibility' }, // Thu
    { type: 'strength', subtype: 'push' },   // Fri
    { type: 'hiit', subtype: 'full' },       // Sat
    { type: 'rest', subtype: 'rest' }        // Sun
  ];
  
  const upperLowerSchedule = [
    { type: 'strength', subtype: 'upper' },  // Mon
    { type: 'strength', subtype: 'lower' },  // Tue
    { type: 'rest', subtype: 'rest' },       // Wed
    { type: 'strength', subtype: 'upper' },  // Thu
    { type: 'strength', subtype: 'lower' },  // Fri
    { type: 'hiit', subtype: 'full' },       // Sat
    { type: 'rest', subtype: 'rest' }        // Sun
  ];
  
  const fullBodySchedule = [
    { type: 'strength', subtype: 'full' },   // Mon
    { type: 'stretch', subtype: 'flexibility' }, // Tue
    { type: 'strength', subtype: 'full' },   // Wed
    { type: 'hiit', subtype: 'full' },       // Thu
    { type: 'strength', subtype: 'full' },   // Fri
    { type: 'rest', subtype: 'rest' },       // Sat
    { type: 'rest', subtype: 'rest' }        // Sun
  ];
  
  const schedules = {
    ppl: pplSchedule,
    upper_lower: upperLowerSchedule,
    full_body: fullBodySchedule
  };
  
  return schedules[planStyle]?.[dayIndex] || { type: 'rest', subtype: 'rest' };
};

/**
 * Workout Session Schema
 * Logged during or after completing a workout
 */
export const createWorkoutSession = ({
  planId = null,
  planDay = null,
  type = 'strength',
  subtype = 'full',
  exercises = {},
  duration = 0,
  date = new Date().toISOString(),
  notes = ''
}) => {
  return {
    sessionId: generateSessionId('workout', date),
    planId,
    planDay,
    type,
    subtype,
    date,
    duration,
    exercises, // { 'Exercise Name': { sets: [...] } }
    notes,
    createdAt: new Date().toISOString()
  };
};

/**
 * HIIT Session Schema
 */
export const createHiitSession = ({
  planId = null,
  planDay = null,
  protocol = {},
  exercises = [],
  completedRounds = 0,
  totalDuration = 0,
  date = new Date().toISOString(),
  notes = '',
  perceivedExertion = 5
}) => {
  return {
    sessionId: generateSessionId('hiit', date),
    planId,
    planDay,
    type: 'hiit',
    protocol, // { name, workTime, restTime, rounds }
    exercises, // [{ name, duration, rest, gif }]
    completedRounds,
    totalDuration,
    date,
    notes,
    perceivedExertion,
    createdAt: new Date().toISOString()
  };
};

/**
 * Cardio Session Schema
 */
export const createCardioSession = ({
  planId = null,
  planDay = null,
  activity = 'running',
  distance = 0,
  duration = 0,
  avgHeartRate = null,
  calories = 0,
  date = new Date().toISOString(),
  notes = ''
}) => {
  return {
    sessionId: generateSessionId('cardio', date),
    planId,
    planDay,
    type: 'cardio',
    activity, // 'running' | 'cycling' | 'swimming' | 'rowing' | 'other'
    distance,
    duration,
    avgHeartRate,
    calories,
    date,
    notes,
    createdAt: new Date().toISOString()
  };
};

/**
 * Helper to link a session to a plan day
 * @param {Object} session - Session object
 * @param {string} planId - Plan ID to link to
 * @param {number} planDay - Day index in the plan
 * @returns {Object} Updated session with plan context
 */
export const linkSessionToPlan = (session, planId, planDay) => {
  return {
    ...session,
    planId,
    planDay
  };
};

/**
 * Helper to validate if a session has plan context
 * @param {Object} session - Session to validate
 * @returns {boolean} True if session has valid plan context
 */
export const hasValidPlanContext = (session) => {
  return session?.planId && session?.planDay !== null && session?.planDay !== undefined;
};

/**
 * Helper to get sessions for a specific plan day
 * @param {Array} sessions - Array of all sessions
 * @param {string} planId - Plan ID
 * @param {number} planDay - Day index
 * @returns {Array} Sessions matching the plan day
 */
export const getSessionsForPlanDay = (sessions, planId, planDay) => {
  return sessions.filter(session => 
    session.planId === planId && session.planDay === planDay
  );
};

export default {
  generateSessionId,
  createWeeklyPlan,
  createPlanDay,
  createWorkoutSession,
  createHiitSession,
  createYogaSession,
  createCardioSession,
  linkSessionToPlan,
  hasValidPlanContext,
  getSessionsForPlanDay
};
