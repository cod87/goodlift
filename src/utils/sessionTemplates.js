/**
 * Session Templates Utility
 * Provides default session templates for different workout types
 * Used by the quick-toggle UI in the weekly schedule editor
 */

/**
 * Get default session data based on session type
 * @param {string} sessionType - The type of session (strength types, cardio, yoga, rest, etc.)
 * @returns {Object} Default session data structure
 */
export const getDefaultSessionData = (sessionType) => {
  const type = sessionType.toLowerCase();
  
  // Strength-based session types
  const strengthTypes = ['full', 'upper', 'lower', 'push', 'pull', 'legs', 'core'];
  if (strengthTypes.includes(type)) {
    return {
      sessionType: type,
      sessionName: getSessionTypeDisplayName(type),
      exercises: [],
      supersetConfig: [2, 2, 2, 2],
      assignedDate: new Date().toISOString(),
      instructions: `Complete all exercises in each superset before moving to the next. Rest 60-90 seconds between supersets.`,
    };
  }
  
  // Timer-based session types
  const timerTypes = ['cardio', 'hiit', 'yoga', 'mobility', 'stretch'];
  if (timerTypes.includes(type)) {
    return {
      sessionType: type,
      sessionName: getSessionTypeDisplayName(type),
      timerConfig: {
        duration: getDefaultDuration(type),
        intensity: 'moderate',
        notes: '',
      },
      assignedDate: new Date().toISOString(),
      instructions: getTimerInstructions(type),
    };
  }
  
  // Rest day
  if (type === 'rest') {
    return {
      sessionType: 'rest',
      sessionName: 'Rest Day',
      assignedDate: new Date().toISOString(),
      instructions: 'Take a break and recover. Your body needs rest to grow stronger!',
    };
  }
  
  // Default fallback
  return {
    sessionType: type,
    sessionName: type.charAt(0).toUpperCase() + type.slice(1),
    assignedDate: new Date().toISOString(),
  };
};

/**
 * Get display name for session type
 * @param {string} type - Session type
 * @returns {string} Display name
 */
export const getSessionTypeDisplayName = (type) => {
  const displayNames = {
    full: 'Full Body',
    upper: 'Upper Body',
    lower: 'Lower Body',
    push: 'Push',
    pull: 'Pull',
    legs: 'Legs',
    core: 'Core',
    cardio: 'Cardio',
    hiit: 'HIIT',
    yoga: 'Yoga',
    mobility: 'Mobility',
    stretch: 'Stretching',
    rest: 'Rest Day',
  };
  return displayNames[type] || type.charAt(0).toUpperCase() + type.slice(1);
};

/**
 * Get default duration for timer-based sessions
 * @param {string} type - Session type
 * @returns {number} Duration in minutes
 */
const getDefaultDuration = (type) => {
  const durations = {
    cardio: 30,
    hiit: 20,
    yoga: 45,
    mobility: 20,
    stretch: 15,
  };
  return durations[type] || 30;
};

/**
 * Get default instructions for timer-based sessions
 * @param {string} type - Session type
 * @returns {string} Instructions text
 */
const getTimerInstructions = (type) => {
  const instructions = {
    cardio: 'Maintain a steady pace throughout the session. Focus on breathing and form.',
    hiit: 'Alternate between high-intensity intervals and rest periods. Push yourself during work intervals.',
    yoga: 'Flow through poses with controlled breathing. Focus on alignment and balance.',
    mobility: 'Move through your full range of motion. Hold stretches for 30-60 seconds.',
    stretch: 'Gently stretch each muscle group. Hold each stretch for 20-30 seconds without bouncing.',
  };
  return instructions[type] || 'Follow your workout plan and listen to your body.';
};

/**
 * Check if session type is strength-based
 * @param {string} type - Session type
 * @returns {boolean} True if strength type
 */
export const isStrengthType = (type) => {
  if (!type) return false;
  const strengthTypes = ['full', 'upper', 'lower', 'push', 'pull', 'legs', 'core'];
  return strengthTypes.includes(type.toLowerCase());
};

/**
 * Check if session type is timer-based
 * @param {string} type - Session type
 * @returns {boolean} True if timer type
 */
export const isTimerType = (type) => {
  if (!type) return false;
  const timerTypes = ['cardio', 'hiit', 'yoga', 'mobility', 'stretch'];
  return timerTypes.includes(type.toLowerCase());
};

/**
 * Check if session type is rest day
 * @param {string} type - Session type
 * @returns {boolean} True if rest day
 */
export const isRestType = (type) => {
  return type?.toLowerCase() === 'rest';
};

/**
 * Get all available session types
 * @returns {Array} Array of session type objects
 */
export const getAllSessionTypes = () => {
  return [
    { value: 'full', label: 'Full Body', category: 'strength' },
    { value: 'upper', label: 'Upper Body', category: 'strength' },
    { value: 'lower', label: 'Lower Body', category: 'strength' },
    { value: 'push', label: 'Push', category: 'strength' },
    { value: 'pull', label: 'Pull', category: 'strength' },
    { value: 'legs', label: 'Legs', category: 'strength' },
    { value: 'core', label: 'Core', category: 'strength' },
    { value: 'cardio', label: 'Cardio', category: 'cardio' },
    { value: 'hiit', label: 'HIIT', category: 'cardio' },
    { value: 'yoga', label: 'Yoga', category: 'flexibility' },
    { value: 'mobility', label: 'Mobility', category: 'flexibility' },
    { value: 'stretch', label: 'Stretching', category: 'flexibility' },
    { value: 'rest', label: 'Rest Day', category: 'rest' },
  ];
};

export default {
  getDefaultSessionData,
  getSessionTypeDisplayName,
  isStrengthType,
  isTimerType,
  isRestType,
  getAllSessionTypes,
};
