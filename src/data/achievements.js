/**
 * Achievements Data - Refactored per rewards-system.md
 * 
 * Defines all achievement badges, their unlock conditions, and visual assets
 * New system focuses on:
 * - Strength training frequency (3+ sessions per week)
 * - Progressive overload (cumulative tonnage)
 * - Long-term consistency (streaks, weekly adherence)
 * - Cardio and yoga for health and recovery
 */

import { calculateStreak } from '../utils/trackingMetrics.js';

/**
 * Achievement badge definitions
 * Each badge has:
 * - id: unique identifier
 * - name: display name
 * - description: what the achievement represents
 * - icon: emoji or icon identifier
 * - tier: bronze, silver, gold, platinum (kept for visual styling)
 * - condition: object defining unlock criteria
 * - points: bonus points awarded when unlocked (500 per badge as per spec)
 */
export const ACHIEVEMENT_BADGES = [
  // ====================================================================
  // STRENGTH TRAINING BADGES (per rewards-system.md Section 2.1)
  // ====================================================================
  
  // 2.1.1. Lifetime Strength Volume (Tonnage) Badges
  {
    id: 'iron-beginner',
    name: 'Iron Beginner',
    description: 'Lift 50,000 lbs total volume across all strength sessions',
    icon: '🏋️',
    tier: 'bronze',
    condition: { type: 'totalVolume', value: 50000 },
    points: 500
  },
  {
    id: 'iron-novice',
    name: 'Iron Novice',
    description: 'Lift 250,000 lbs total volume',
    icon: '⚙️',
    tier: 'silver',
    condition: { type: 'totalVolume', value: 250000 },
    points: 500
  },
  {
    id: 'iron-intermediate',
    name: 'Iron Intermediate',
    description: 'Lift 1,000,000 lbs total volume - serious long-term commitment',
    icon: '🏗️',
    tier: 'gold',
    condition: { type: 'totalVolume', value: 1000000 },
    points: 500
  },
  {
    id: 'iron-veteran',
    name: 'Iron Veteran',
    description: 'Lift 2,500,000 lbs total volume - years of accumulated work',
    icon: '⛰️',
    tier: 'platinum',
    condition: { type: 'totalVolume', value: 2500000 },
    points: 500
  },
  {
    id: 'iron-master',
    name: 'Iron Master',
    description: 'Lift 5,000,000 lbs total volume - elite lifetime achievement',
    icon: '👑',
    tier: 'platinum',
    condition: { type: 'totalVolume', value: 5000000 },
    points: 500
  },

  // 2.1.2. Strength Session Count Badges
  {
    id: 'first-steps',
    name: 'First Steps',
    description: 'Complete 10 strength training sessions',
    icon: '🎯',
    tier: 'bronze',
    condition: { type: 'strengthWorkoutCount', value: 10 },
    points: 500
  },
  {
    id: 'finding-rhythm',
    name: 'Finding Rhythm',
    description: 'Complete 25 strength training sessions',
    icon: '💪',
    tier: 'bronze',
    condition: { type: 'strengthWorkoutCount', value: 25 },
    points: 500
  },
  {
    id: 'building-momentum',
    name: 'Building Momentum',
    description: 'Complete 50 strength training sessions',
    icon: '🔥',
    tier: 'silver',
    condition: { type: 'strengthWorkoutCount', value: 50 },
    points: 500
  },
  {
    id: 'consistent-lifter',
    name: 'Consistent Lifter',
    description: 'Complete 100 strength training sessions',
    icon: '💎',
    tier: 'silver',
    condition: { type: 'strengthWorkoutCount', value: 100 },
    points: 500
  },
  {
    id: 'dedicated-lifter',
    name: 'Dedicated Lifter',
    description: 'Complete 150 strength training sessions',
    icon: '🎖️',
    tier: 'gold',
    condition: { type: 'strengthWorkoutCount', value: 150 },
    points: 500
  },
  {
    id: 'committed-lifter',
    name: 'Committed Lifter',
    description: 'Complete 300 strength training sessions',
    icon: '🔱',
    tier: 'gold',
    condition: { type: 'strengthWorkoutCount', value: 300 },
    points: 500
  },
  {
    id: 'unwavering-lifter',
    name: 'Unwavering Lifter',
    description: 'Complete 500 strength training sessions',
    icon: '⚔️',
    tier: 'platinum',
    condition: { type: 'strengthWorkoutCount', value: 500 },
    points: 500
  },
  {
    id: 'lifetime-lifter',
    name: 'Lifetime Lifter',
    description: 'Complete 1,000 strength training sessions',
    icon: '🏆',
    tier: 'platinum',
    condition: { type: 'strengthWorkoutCount', value: 1000 },
    points: 500
  },

  // 2.1.3. Heavy Single-Session Volume Badges
  {
    id: 'heavy-session-1',
    name: 'Heavy Session I',
    description: 'Complete a single strength workout with 20,000+ lbs volume',
    icon: '💥',
    tier: 'bronze',
    condition: { type: 'singleSessionVolume', value: 20000 },
    points: 500
  },
  {
    id: 'heavy-session-2',
    name: 'Heavy Session II',
    description: 'Complete a single strength workout with 30,000+ lbs volume',
    icon: '⚡',
    tier: 'silver',
    condition: { type: 'singleSessionVolume', value: 30000 },
    points: 500
  },
  {
    id: 'heavy-session-3',
    name: 'Heavy Session III',
    description: 'Complete a single strength workout with 40,000+ lbs volume',
    icon: '🚀',
    tier: 'gold',
    condition: { type: 'singleSessionVolume', value: 40000 },
    points: 500
  },

  // ====================================================================
  // CARDIO BADGES (per rewards-system.md Section 2.2)
  // ====================================================================
  
  // 2.2.1. Cardio Session Count Badges
  {
    id: 'cardio-starter',
    name: 'Cardio Starter',
    description: 'Complete 10 cardio sessions',
    icon: '🏃',
    tier: 'bronze',
    condition: { type: 'cardioWorkoutCount', value: 10 },
    points: 500
  },
  {
    id: 'cardio-regular',
    name: 'Cardio Regular',
    description: 'Complete 25 cardio sessions',
    icon: '❤️‍🔥',
    tier: 'bronze',
    condition: { type: 'cardioWorkoutCount', value: 25 },
    points: 500
  },
  {
    id: 'cardio-habit',
    name: 'Cardio Habit',
    description: 'Complete 75 cardio sessions',
    icon: '🫀',
    tier: 'silver',
    condition: { type: 'cardioWorkoutCount', value: 75 },
    points: 500
  },
  {
    id: 'cardio-enthusiast',
    name: 'Cardio Enthusiast',
    description: 'Complete 150 cardio sessions',
    icon: '💓',
    tier: 'gold',
    condition: { type: 'cardioWorkoutCount', value: 150 },
    points: 500
  },
  {
    id: 'cardio-master',
    name: 'Cardio Master',
    description: 'Complete 300 cardio sessions',
    icon: '🏅',
    tier: 'platinum',
    condition: { type: 'cardioWorkoutCount', value: 300 },
    points: 500
  },

  // 2.2.2. Cardio Time Accumulation Badges
  {
    id: 'cardio-5h',
    name: '5 Hours Logged',
    description: 'Complete 5 hours of cumulative cardio',
    icon: '⏱️',
    tier: 'bronze',
    condition: { type: 'cardioTime', value: 18000 }, // 5 hours in seconds
    points: 500
  },
  {
    id: 'cardio-10h',
    name: '10 Hours Logged',
    description: 'Complete 10 hours of cumulative cardio',
    icon: '⌚',
    tier: 'bronze',
    condition: { type: 'cardioTime', value: 36000 },
    points: 500
  },
  {
    id: 'cardio-30h',
    name: '30 Hours Logged',
    description: 'Complete 30 hours of cumulative cardio',
    icon: '⏰',
    tier: 'silver',
    condition: { type: 'cardioTime', value: 108000 },
    points: 500
  },
  {
    id: 'cardio-50h',
    name: '50 Hours Logged',
    description: 'Complete 50 hours of cumulative cardio',
    icon: '🕐',
    tier: 'silver',
    condition: { type: 'cardioTime', value: 180000 },
    points: 500
  },
  {
    id: 'cardio-100h',
    name: '100 Hours Logged',
    description: 'Complete 100 hours of cumulative cardio',
    icon: '🕒',
    tier: 'gold',
    condition: { type: 'cardioTime', value: 360000 },
    points: 500
  },
  {
    id: 'cardio-250h',
    name: '250 Hours Logged',
    description: 'Complete 250 hours of cumulative cardio',
    icon: '⏳',
    tier: 'platinum',
    condition: { type: 'cardioTime', value: 900000 },
    points: 500
  },

  // ====================================================================
  // YOGA BADGES (per rewards-system.md Section 2.3)
  // ====================================================================
  
  // 2.3.1. Yoga Session Count Badges
  {
    id: 'yoga-beginner',
    name: 'Yoga Beginner',
    description: 'Complete 5 yoga sessions',
    icon: '🧘',
    tier: 'bronze',
    condition: { type: 'yogaWorkoutCount', value: 5 },
    points: 500
  },
  {
    id: 'yoga-newcomer',
    name: 'Yoga Newcomer',
    description: 'Complete 10 yoga sessions',
    icon: '🌱',
    tier: 'bronze',
    condition: { type: 'yogaWorkoutCount', value: 10 },
    points: 500
  },
  {
    id: 'yoga-regular',
    name: 'Yoga Regular',
    description: 'Complete 30 yoga sessions',
    icon: '🌿',
    tier: 'silver',
    condition: { type: 'yogaWorkoutCount', value: 30 },
    points: 500
  },
  {
    id: 'yoga-devotee',
    name: 'Yoga Devotee',
    description: 'Complete 75 yoga sessions',
    icon: '🌺',
    tier: 'gold',
    condition: { type: 'yogaWorkoutCount', value: 75 },
    points: 500
  },
  {
    id: 'yoga-master',
    name: 'Yoga Master',
    description: 'Complete 150 yoga sessions',
    icon: '🪷',
    tier: 'platinum',
    condition: { type: 'yogaWorkoutCount', value: 150 },
    points: 500
  },

  // 2.3.2. Yoga Time Accumulation Badges
  {
    id: 'yoga-5h',
    name: '5 Hours Logged',
    description: 'Complete 5 hours of cumulative yoga',
    icon: '🕉️',
    tier: 'bronze',
    condition: { type: 'yogaTime', value: 18000 },
    points: 500
  },
  {
    id: 'yoga-10h',
    name: '10 Hours Logged',
    description: 'Complete 10 hours of cumulative yoga',
    icon: '☮️',
    tier: 'bronze',
    condition: { type: 'yogaTime', value: 36000 },
    points: 500
  },
  {
    id: 'yoga-25h',
    name: '25 Hours Logged',
    description: 'Complete 25 hours of cumulative yoga',
    icon: '🍀',
    tier: 'silver',
    condition: { type: 'yogaTime', value: 90000 },
    points: 500
  },
  {
    id: 'yoga-50h',
    name: '50 Hours Logged',
    description: 'Complete 50 hours of cumulative yoga',
    icon: '🌸',
    tier: 'gold',
    condition: { type: 'yogaTime', value: 180000 },
    points: 500
  },
  {
    id: 'yoga-100h',
    name: '100 Hours Logged',
    description: 'Complete 100 hours of cumulative yoga',
    icon: '☯️',
    tier: 'platinum',
    condition: { type: 'yogaTime', value: 360000 },
    points: 500
  },

  // ====================================================================
  // OVERALL TRAINING BADGES (per rewards-system.md Section 2.4)
  // ====================================================================
  
  {
    id: 'training-novice',
    name: 'Training Novice',
    description: 'Complete 25 total workouts (all types)',
    icon: '⭐',
    tier: 'bronze',
    condition: { type: 'sessionCount', value: 25 },
    points: 500
  },
  {
    id: 'training-initiate',
    name: 'Training Initiate',
    description: 'Complete 50 total workouts',
    icon: '🌟',
    tier: 'bronze',
    condition: { type: 'sessionCount', value: 50 },
    points: 500
  },
  {
    id: 'training-enthusiast',
    name: 'Training Enthusiast',
    description: 'Complete 150 total workouts',
    icon: '✨',
    tier: 'silver',
    condition: { type: 'sessionCount', value: 150 },
    points: 500
  },
  {
    id: 'training-veteran',
    name: 'Training Veteran',
    description: 'Complete 300 total workouts',
    icon: '🌠',
    tier: 'gold',
    condition: { type: 'sessionCount', value: 300 },
    points: 500
  },
  {
    id: 'training-legend',
    name: 'Training Legend',
    description: 'Complete 750 total workouts',
    icon: '💫',
    tier: 'platinum',
    condition: { type: 'sessionCount', value: 750 },
    points: 500
  },
  {
    id: 'training-immortal',
    name: 'Training Immortal',
    description: 'Complete 1,500 total workouts',
    icon: '⚜️',
    tier: 'platinum',
    condition: { type: 'sessionCount', value: 1500 },
    points: 500
  },

  // ====================================================================
  // WEEKLY CONSISTENCY BADGES (per rewards-system.md Section 2.5)
  // ====================================================================
  
  {
    id: 'consistent-week-1',
    name: 'Consistent Week I',
    description: 'Complete 3+ strength sessions per week for 4 consecutive weeks',
    icon: '📅',
    tier: 'bronze',
    condition: { type: 'strengthWeekStreak', value: 4 },
    points: 500
  },
  {
    id: 'consistent-week-2',
    name: 'Consistent Week II',
    description: 'Complete 3+ strength sessions per week for 12 consecutive weeks (~3 months)',
    icon: '📆',
    tier: 'silver',
    condition: { type: 'strengthWeekStreak', value: 12 },
    points: 500
  },
  {
    id: 'consistent-week-3',
    name: 'Consistent Week III',
    description: 'Complete 3+ strength sessions per week for 26 consecutive weeks (~6 months)',
    icon: '🗓️',
    tier: 'gold',
    condition: { type: 'strengthWeekStreak', value: 26 },
    points: 500
  },
  {
    id: 'consistent-week-4',
    name: 'Consistent Week IV',
    description: 'Complete 3+ strength sessions per week for 52 consecutive weeks (1 year)',
    icon: '📋',
    tier: 'platinum',
    condition: { type: 'strengthWeekStreak', value: 52 },
    points: 500
  },
  {
    id: 'consistent-week-5',
    name: 'Consistent Week V',
    description: 'Complete 3+ strength sessions per week for 104 consecutive weeks (2 years)',
    icon: '📜',
    tier: 'platinum',
    condition: { type: 'strengthWeekStreak', value: 104 },
    points: 500
  },

  // ====================================================================
  // STREAK BADGES (per rewards-system.md Section 2.6)
  // ====================================================================
  
  {
    id: 'week-streak',
    name: 'Week Streak',
    description: 'Maintain a 7-day training streak',
    icon: '🔗',
    tier: 'bronze',
    condition: { type: 'streak', value: 7 },
    points: 500
  },
  {
    id: 'fortnight-streak',
    name: 'Fortnight Streak',
    description: 'Maintain a 14-day training streak',
    icon: '⚡',
    tier: 'bronze',
    condition: { type: 'streak', value: 14 },
    points: 500
  },
  {
    id: 'month-streak',
    name: 'Month Streak',
    description: 'Maintain a 30-day training streak',
    icon: '🔥',
    tier: 'silver',
    condition: { type: 'streak', value: 30 },
    points: 500
  },
  {
    id: 'quarterly-streak',
    name: 'Quarterly Streak',
    description: 'Maintain a 90-day training streak',
    icon: '💎',
    tier: 'gold',
    condition: { type: 'streak', value: 90 },
    points: 500
  },
  {
    id: 'biannual-streak',
    name: 'Biannual Streak',
    description: 'Maintain a 180-day training streak',
    icon: '🛡️',
    tier: 'platinum',
    condition: { type: 'streak', value: 180 },
    points: 500
  },
];

/**
 * Achievement tier colors and styling
 */
export const ACHIEVEMENT_TIERS = {
  bronze: {
    color: '#CD7F32',
    gradient: 'linear-gradient(135deg, #CD7F32 0%, #B87333 100%)',
    textColor: '#fff'
  },
  silver: {
    color: '#C0C0C0',
    gradient: 'linear-gradient(135deg, #C0C0C0 0%, #A8A8A8 100%)',
    textColor: '#333'
  },
  gold: {
    color: '#FFD700',
    gradient: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
    textColor: '#333'
  },
  platinum: {
    color: '#E5E4E2',
    gradient: 'linear-gradient(135deg, #E5E4E2 0%, #B0B0B0 100%)',
    textColor: '#333'
  }
};

/**
 * Workout type category definitions
 * These categorize different workout types into broader categories for achievement tracking
 */
const STRENGTH_TYPES = ['full', 'upper', 'lower', 'push', 'pull', 'legs', 'core', 'strength'];
const CARDIO_TYPES = ['cardio', 'hiit'];
const YOGA_TYPES = ['yoga', 'stretch', 'mobility', 'flexibility'];
const RECOVERY_TYPES = ['active_recovery'];

/**
 * Check if a workout type belongs to strength category
 * @param {string} type - Workout type
 * @returns {boolean} True if strength type
 */
const isStrengthType = (type) => {
  if (!type) return false;
  return STRENGTH_TYPES.includes(type.toLowerCase());
};

/**
 * Check if a workout type belongs to cardio category
 * @param {string} type - Workout type
 * @returns {boolean} True if cardio type
 */
const isCardioType = (type) => {
  if (!type) return false;
  return CARDIO_TYPES.includes(type.toLowerCase());
};

/**
 * Check if a workout type belongs to yoga/flexibility category
 * @param {string} type - Workout type
 * @returns {boolean} True if yoga/flexibility type
 */
const isYogaType = (type) => {
  if (!type) return false;
  return YOGA_TYPES.includes(type.toLowerCase());
};

/**
 * Check if a workout type belongs to active recovery category
 * @param {string} type - Workout type
 * @returns {boolean} True if recovery type
 */
const isRecoveryType = (type) => {
  if (!type) return false;
  return RECOVERY_TYPES.includes(type.toLowerCase());
};

/**
 * Count strength workouts in workout history
 * @param {Array} workoutHistory - Array of completed workouts
 * @returns {number} Count of strength workouts
 */
const countStrengthWorkouts = (workoutHistory) => {
  if (!workoutHistory || !Array.isArray(workoutHistory)) return 0;
  return workoutHistory.filter(w => isStrengthType(w.type)).length;
};

/**
 * Count cardio workouts in workout history
 * @param {Array} workoutHistory - Array of completed workouts
 * @returns {number} Count of cardio workouts
 */
const countCardioWorkouts = (workoutHistory) => {
  if (!workoutHistory || !Array.isArray(workoutHistory)) return 0;
  return workoutHistory.filter(w => isCardioType(w.type)).length;
};

/**
 * Count yoga/flexibility workouts in workout history
 * @param {Array} workoutHistory - Array of completed workouts
 * @returns {number} Count of yoga workouts
 */
const countYogaWorkouts = (workoutHistory) => {
  if (!workoutHistory || !Array.isArray(workoutHistory)) return 0;
  return workoutHistory.filter(w => isYogaType(w.type)).length;
};

/**
 * Get the start of the week (Sunday) for a given date
 * Per rewards-system.md: Week is Sunday-Saturday
 * @param {Date} date - Date to get week start for
 * @returns {Date} Start of the week (Sunday at 00:00:00)
 */
const getWeekStart = (date) => {
  const d = new Date(date);
  const day = d.getDay();
  // Sunday is 0, so subtract 'day' to get to Sunday
  d.setDate(d.getDate() - day);
  d.setHours(0, 0, 0, 0);
  return d;
};

/**
 * Threshold in seconds to distinguish between duration formats
 * Durations < 5 minutes (300 seconds) are assumed to be in minutes
 * Durations >= 5 minutes are assumed to be in seconds
 */
const DURATION_FORMAT_THRESHOLD_SECONDS = 300;

/**
 * Calculate total cardio time in seconds
 * @param {Array} workoutHistory - Array of completed workouts
 * @returns {number} Total cardio time in seconds
 */
const calculateCardioTime = (workoutHistory) => {
  if (!workoutHistory || !Array.isArray(workoutHistory)) return 0;
  return workoutHistory
    .filter(w => isCardioType(w.type))
    .reduce((total, workout) => {
      // duration can be in seconds or minutes depending on session type
      const duration = workout.duration || 0;
      // If duration is very small, it's likely in minutes (convert to seconds)
      // If duration is large, it's already in seconds
      // Most cardio sessions are 10-120 minutes, so if duration < DURATION_FORMAT_THRESHOLD_SECONDS, assume minutes
      return total + (duration < DURATION_FORMAT_THRESHOLD_SECONDS ? duration * 60 : duration);
    }, 0);
};

/**
 * Calculate total yoga time in seconds
 * @param {Array} workoutHistory - Array of completed workouts
 * @returns {number} Total yoga time in seconds
 */
const calculateYogaTime = (workoutHistory) => {
  if (!workoutHistory || !Array.isArray(workoutHistory)) return 0;
  return workoutHistory
    .filter(w => isYogaType(w.type))
    .reduce((total, workout) => {
      const duration = workout.duration || 0;
      // Same logic as cardio time
      return total + (duration < DURATION_FORMAT_THRESHOLD_SECONDS ? duration * 60 : duration);
    }, 0);
};

/**
 * Calculate volume for a single workout session
 * @param {Object} workout - Workout object with exercises
 * @returns {number} Total volume in lbs for this session
 */
const calculateSessionVolume = (workout) => {
  if (!workout || !workout.exercises) return 0;
  let volume = 0;
  Object.values(workout.exercises).forEach(exerciseData => {
    exerciseData.sets?.forEach(set => {
      if (set.weight && set.reps) {
        volume += set.weight * set.reps;
      }
    });
  });
  return volume;
};

/**
 * Get maximum single-session volume from workout history
 * @param {Array} workoutHistory - Array of completed workouts
 * @returns {number} Maximum volume from any single session
 */
const getMaxSingleSessionVolume = (workoutHistory) => {
  if (!workoutHistory || !Array.isArray(workoutHistory)) return 0;
  return workoutHistory
    .filter(w => isStrengthType(w.type))
    .reduce((max, workout) => {
      const volume = calculateSessionVolume(workout);
      return Math.max(max, volume);
    }, 0);
};

/**
 * Calculate the consecutive weeks with 3+ strength workouts per week
 * @param {Array} workoutHistory - Array of completed workouts
 * @returns {number} Number of consecutive weeks with 3+ strength workouts, including current week if qualifying
 */
const calculateStrengthWeekStreak = (workoutHistory) => {
  if (!workoutHistory || !Array.isArray(workoutHistory) || workoutHistory.length === 0) return 0;
  
  // Filter to strength workouts only
  const strengthWorkouts = workoutHistory.filter(w => isStrengthType(w.type));
  if (strengthWorkouts.length === 0) return 0;
  
  // Group workouts by week (week starts on Monday)
  const weekCounts = new Map();
  
  strengthWorkouts.forEach(workout => {
    const workoutDate = new Date(workout.date);
    const weekStart = getWeekStart(workoutDate);
    const weekKey = weekStart.toISOString();
    
    weekCounts.set(weekKey, (weekCounts.get(weekKey) || 0) + 1);
  });
  
  // Get all week start dates that have 3+ workouts
  const qualifyingWeeks = Array.from(weekCounts.entries())
    .filter(([, count]) => count >= 3)
    .map(([weekKey]) => new Date(weekKey))
    .sort((a, b) => b - a); // Sort descending (most recent first)
  
  if (qualifyingWeeks.length === 0) return 0;
  
  // Count consecutive weeks from the most recent qualifying week
  let streak = 1;
  const oneWeekMs = 7 * 24 * 60 * 60 * 1000;
  
  for (let i = 0; i < qualifyingWeeks.length - 1; i++) {
    const currentWeek = qualifyingWeeks[i].getTime();
    const previousWeek = qualifyingWeeks[i + 1].getTime();
    
    // Check if weeks are consecutive (exactly 7 days apart)
    if (currentWeek - previousWeek === oneWeekMs) {
      streak++;
    } else {
      break;
    }
  }
  
  return streak;
};

/**
 * Check if an achievement condition is met
 * @param {Object} achievement - Achievement object with condition
 * @param {Object} userStats - User statistics object
 * @param {Array} workoutHistory - Array of completed workouts
 * @returns {boolean} True if achievement is unlocked
 */
export const isAchievementUnlocked = (achievement, userStats, workoutHistory = []) => {
  const { condition } = achievement;
  
  switch (condition.type) {
    case 'sessionCount':
      // Total sessions across ALL types
      return (userStats.totalWorkouts || 0) >= condition.value;
    
    case 'streak':
      // Streaks include ALL session types
      return (userStats.currentStreak || 0) >= condition.value;
    
    case 'prCount':
      return (userStats.totalPRs || 0) >= condition.value;
    
    case 'totalVolume':
      return (userStats.totalVolume || 0) >= condition.value;
    
    case 'totalTime':
      return (userStats.totalTime || 0) >= condition.value;
    
    case 'wellnessTaskCount':
      return (userStats.completedWellnessTasks || 0) >= condition.value;
    
    case 'strengthWorkoutCount':
      return countStrengthWorkouts(workoutHistory) >= condition.value;
    
    case 'cardioWorkoutCount':
      return countCardioWorkouts(workoutHistory) >= condition.value;
    
    case 'yogaWorkoutCount':
      return countYogaWorkouts(workoutHistory) >= condition.value;
    
    case 'strengthWeekStreak':
      return calculateStrengthWeekStreak(workoutHistory) >= condition.value;
    
    case 'cardioTime':
      return calculateCardioTime(workoutHistory) >= condition.value;
    
    case 'yogaTime':
      return calculateYogaTime(workoutHistory) >= condition.value;
    
    case 'singleSessionVolume':
      return getMaxSingleSessionVolume(workoutHistory) >= condition.value;
    
    case 'special':
      return checkSpecialCondition(condition, userStats, workoutHistory);
    
    default:
      return false;
  }
};

/**
 * Check special achievement conditions
 * @param {Object} condition - Condition object
 * @param {Object} userStats - User statistics
 * @param {Array} workoutHistory - Workout history
 * @returns {boolean} True if special condition is met
 */
const checkSpecialCondition = (condition, userStats, workoutHistory) => {
  switch (condition.value) {
    case 'earlyMorning':
      return workoutHistory.some(w => {
        const hour = new Date(w.date).getHours();
        return hour < 7;
      });
    
    case 'morningWorkouts': {
      const morningCount = workoutHistory.filter(w => {
        const hour = new Date(w.date).getHours();
        return hour >= 7 && hour < 12;
      }).length;
      return morningCount >= (condition.count || 10);
    }
    
    case 'afternoonWorkouts': {
      const afternoonCount = workoutHistory.filter(w => {
        const hour = new Date(w.date).getHours();
        return hour >= 12 && hour < 17;
      }).length;
      return afternoonCount >= (condition.count || 10);
    }
    
    case 'eveningWorkouts': {
      const eveningCount = workoutHistory.filter(w => {
        const hour = new Date(w.date).getHours();
        return hour >= 17 && hour < 22;
      }).length;
      return eveningCount >= (condition.count || 10);
    }
    
    case 'lateNight':
      return workoutHistory.some(w => {
        const hour = new Date(w.date).getHours();
        return hour >= 22;
      });
    
    case 'consecutiveWorkouts': {
      // Sort workouts by date
      const sortedWorkouts = [...workoutHistory].sort((a, b) => 
        new Date(a.date) - new Date(b.date)
      );
      
      let maxConsecutive = 0;
      let currentConsecutive = 1;
      
      for (let i = 1; i < sortedWorkouts.length; i++) {
        const prevDate = new Date(sortedWorkouts[i - 1].date);
        const currDate = new Date(sortedWorkouts[i].date);
        const timeDiff = (currDate - prevDate) / (1000 * 60 * 60); // hours
        
        if (timeDiff <= 1) {
          currentConsecutive++;
          maxConsecutive = Math.max(maxConsecutive, currentConsecutive);
        } else {
          currentConsecutive = 1;
        }
      }
      
      return maxConsecutive >= (condition.count || 3);
    }
    
    case 'weekendWorkouts': {
      const weekendCount = workoutHistory.filter(w => {
        const day = new Date(w.date).getDay();
        return day === 0 || day === 6; // Sunday or Saturday
      }).length;
      return weekendCount >= (condition.count || 10);
    }
    
    case 'allWorkoutTypes': {
      const requiredTypes = ['full', 'upper', 'lower', 'push', 'pull', 'legs'];
      const completedTypes = new Set(workoutHistory.map(w => w.type?.toLowerCase()).filter(Boolean));
      return requiredTypes.every(type => completedTypes.has(type));
    }
    
    default:
      return false;
  }
};

/**
 * Get progress toward next achievement in a category
 * @param {Array} categoryAchievements - Achievements in a category
 * @param {Object} userStats - User statistics
 * @param {Array} workoutHistory - Workout history
 * @returns {Object} Progress information { current, next, progress }
 */
export const getNextAchievementProgress = (categoryAchievements, userStats, workoutHistory = []) => {
  // Sort achievements by value
  const sortedAchievements = [...categoryAchievements].sort((a, b) => {
    return a.condition.value - b.condition.value;
  });
  
  // Find next locked achievement
  const nextAchievement = sortedAchievements.find(
    a => !isAchievementUnlocked(a, userStats, workoutHistory)
  );
  
  if (!nextAchievement) {
    return null; // All achievements unlocked
  }
  
  // Calculate progress
  const { condition } = nextAchievement;
  let currentValue = 0;
  
  switch (condition.type) {
    case 'sessionCount':
      currentValue = userStats.totalWorkouts || 0;
      break;
    case 'streak':
      currentValue = userStats.currentStreak || 0;
      break;
    case 'prCount':
      currentValue = userStats.totalPRs || 0;
      break;
    case 'totalVolume':
      currentValue = userStats.totalVolume || 0;
      break;
    case 'totalTime':
      currentValue = userStats.totalTime || 0;
      break;
    case 'strengthWorkoutCount':
      currentValue = countStrengthWorkouts(workoutHistory);
      break;
    case 'cardioWorkoutCount':
      currentValue = countCardioWorkouts(workoutHistory);
      break;
    case 'yogaWorkoutCount':
      currentValue = countYogaWorkouts(workoutHistory);
      break;
    case 'strengthWeekStreak':
      currentValue = calculateStrengthWeekStreak(workoutHistory);
      break;
    case 'cardioTime':
      currentValue = calculateCardioTime(workoutHistory);
      break;
    case 'yogaTime':
      currentValue = calculateYogaTime(workoutHistory);
      break;
    case 'singleSessionVolume':
      currentValue = getMaxSingleSessionVolume(workoutHistory);
      break;
    default:
      currentValue = 0;
  }
  
  const progress = Math.min((currentValue / condition.value) * 100, 100);
  
  return {
    achievement: nextAchievement,
    current: currentValue,
    target: condition.value,
    progress
  };
};

/**
 * Get all unlocked achievements
 * @param {Object} userStats - User statistics
 * @param {Array} workoutHistory - Workout history
 * @returns {Array} Array of unlocked achievements
 */
export const getUnlockedAchievements = (userStats, workoutHistory = []) => {
  return ACHIEVEMENT_BADGES.filter(achievement => 
    isAchievementUnlocked(achievement, userStats, workoutHistory)
  );
};

/**
 * Get newly unlocked achievements since last check
 * 
 * **ACHIEVEMENT AWARDING RULES:**
 * 
 * This function balances two competing needs:
 * 1. **Incremental Awarding**: Award achievements as milestones are crossed
 * 2. **Prevent Re-Awarding**: Don't re-show achievements already earned
 * 
 * **The Solution:**
 * - Use `previouslyUnlocked` as the primary check (skip if already awarded)
 * - Use "before" calculations to handle out-of-sync `previouslyUnlocked`
 * - "Before" check: Was this achievement already unlockable BEFORE the current action?
 *   - If YES: Skip it (prevents re-awarding)
 *   - If NO: Award it (milestone just crossed)
 * 
 * **For Retroactive Awarding:**
 * - Set `forceRetroactive` to true to award ALL currently-unlocked achievements
 * - This bypasses the "before" check and awards all missed milestones
 * - Used on app initialization or when recalculating achievements
 * 
 * @param {Object} userStats - Current user statistics  
 * @param {Array} workoutHistory - Workout history (including just-completed action if applicable)
 * @param {Array} previouslyUnlocked - Previously unlocked achievement IDs
 * @param {boolean} forceRetroactive - If true, award all unlocked achievements regardless of "before" state
 * @returns {Array} Newly unlocked achievements
 */
export const getNewlyUnlockedAchievements = (userStats, workoutHistory, previouslyUnlocked = [], forceRetroactive = false) => {
  const currentUnlocked = getUnlockedAchievements(userStats, workoutHistory);
  
  // If forcing retroactive awarding, just return all unlocked achievements not in previouslyUnlocked
  if (forceRetroactive) {
    return currentUnlocked.filter(achievement => !previouslyUnlocked.includes(achievement.id));
  }
  
  // Calculate "before" values to determine if achievements were JUST unlocked
  const workoutsBeforeCurrent = Math.max(0, (workoutHistory?.length || 0) - 1);
  
  const workoutHistoryBefore = workoutHistory?.slice(1) || [];
  const strengthCountBefore = countStrengthWorkouts(workoutHistoryBefore);
  const cardioCountBefore = countCardioWorkouts(workoutHistoryBefore);
  const yogaCountBefore = countYogaWorkouts(workoutHistoryBefore);
  const strengthWeekStreakBefore = calculateStrengthWeekStreak(workoutHistoryBefore);
  const streakBefore = calculateStreak(workoutHistoryBefore).currentStreak;
  const cardioTimeBefore = calculateCardioTime(workoutHistoryBefore);
  const yogaTimeBefore = calculateYogaTime(workoutHistoryBefore);
  const maxSessionVolumeBefore = getMaxSingleSessionVolume(workoutHistoryBefore);
  
  return currentUnlocked.filter(achievement => {
    // Rule 1: Skip if already in previouslyUnlocked
    if (previouslyUnlocked.includes(achievement.id)) {
      return false;
    }
    
    // Rule 2: For progressive achievements, check if it was JUST unlocked
    // Skip if it was already unlockable before the current action
    const { condition } = achievement;
    const requiredValue = condition.value;
    
    switch (condition.type) {
      case 'sessionCount':
        return workoutsBeforeCurrent < requiredValue;
      
      case 'streak':
        return streakBefore < requiredValue;
      
      case 'strengthWorkoutCount':
        return strengthCountBefore < requiredValue;
      
      case 'cardioWorkoutCount':
        return cardioCountBefore < requiredValue;
      
      case 'yogaWorkoutCount':
        return yogaCountBefore < requiredValue;
      
      case 'strengthWeekStreak':
        return strengthWeekStreakBefore < requiredValue;
      
      case 'cardioTime':
        return cardioTimeBefore < requiredValue;
      
      case 'yogaTime':
        return yogaTimeBefore < requiredValue;
      
      case 'singleSessionVolume':
        return maxSessionVolumeBefore < requiredValue;
      
      case 'prCount':
      case 'totalVolume':
      case 'totalTime':
      case 'wellnessTaskCount':
        // For these, we don't have reliable "before" calculations
        // Rely on previouslyUnlocked (already checked above)
        return true;
      
      case 'special':
        // Special achievements are one-time events
        return true;
      
      default:
        return true;
    }
  });
};

/**
 * NEW POINTS SYSTEM (per rewards-system.md Section 3)
 * 
 * Points are now the primary driver for levels and come from:
 * 1. Session completion (base points)
 * 2. Weekly consistency bonus (20% after 3+ strength sessions)
 * 3. Streak multiplier (1.10x to 1.40x based on streak length)
 * 4. Badge milestone bonuses (500 points per badge)
 * 5. Penalties (streak break: -100, weekly failure: -150)
 */

/**
 * Calculate base points for a session
 * @param {string} sessionType - Type of session (strength, cardio, yoga, etc.)
 * @returns {number} Base points for this session type
 */
export const getBaseSessionPoints = (sessionType) => {
  const type = (sessionType || '').toLowerCase();
  
  // Strength types: 100 points
  if (isStrengthType(type)) {
    return 100;
  }
  
  // Cardio types: 50 points
  if (isCardioType(type)) {
    return 50;
  }
  
  // Yoga types: 40 points
  if (isYogaType(type)) {
    return 40;
  }
  
  // Active Recovery: 10 points
  if (isRecoveryType(type)) {
    return 10;
  }
  
  // Default for any other session type
  return 50;
};

/**
 * Get streak multiplier based on current streak length
 * @param {number} streakDays - Current streak in days
 * @returns {number} Multiplier (1.0 to 1.40)
 */
export const getStreakMultiplier = (streakDays) => {
  if (streakDays >= 365) return 1.40; // +40%
  if (streakDays >= 180) return 1.35; // +35%
  if (streakDays >= 90) return 1.30;  // +30%
  if (streakDays >= 60) return 1.25;  // +25%
  if (streakDays >= 30) return 1.20;  // +20%
  if (streakDays >= 14) return 1.15;  // +15%
  if (streakDays >= 7) return 1.10;   // +10%
  return 1.0; // No bonus
};

/**
 * Check if user has completed 3+ strength sessions in the current week
 * Week is Sunday-Saturday per rewards-system.md
 * @param {Array} workoutHistory - Array of all workouts
 * @param {Date} currentDate - Current date/time
 * @returns {boolean} True if 3+ strength sessions completed this week
 */
export const hasWeeklyConsistencyBonus = (workoutHistory, currentDate = new Date()) => {
  const weekStart = getWeekStart(currentDate);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 7);
  
  const strengthThisWeek = workoutHistory.filter(w => {
    if (!isStrengthType(w.type)) return false;
    const workoutDate = new Date(w.date);
    return workoutDate >= weekStart && workoutDate < weekEnd;
  });
  
  return strengthThisWeek.length >= 3;
};

/**
 * Calculate points earned for a session
 * Applies base points, weekly bonus, and streak multiplier
 * @param {string} sessionType - Type of session
 * @param {number} currentStreak - Current streak in days
 * @param {boolean} weeklyBonusActive - Whether 3+ strength sessions completed this week
 * @returns {number} Total points for this session
 */
export const calculateSessionPoints = (sessionType, currentStreak, weeklyBonusActive) => {
  let points = getBaseSessionPoints(sessionType);
  
  // Apply weekly consistency bonus (20% if 3+ strength sessions this week)
  if (weeklyBonusActive) {
    points *= 1.20;
  }
  
  // Apply streak multiplier
  const streakMultiplier = getStreakMultiplier(currentStreak);
  points *= streakMultiplier;
  
  return Math.round(points);
};

/**
 * Calculate total achievement points
 * Now returns 500 points per badge (flat rate)
 * @param {Array} unlockedAchievements - Array of unlocked achievements
 * @returns {number} Total badge bonus points
 */
export const calculateAchievementPoints = (unlockedAchievements) => {
  // Each badge awards 500 points (per rewards-system.md Section 3.4)
  return unlockedAchievements.length * 500;
};

/**
 * Level thresholds per rewards-system.md Section 4.2
 * Early levels come quickly, later levels spread out for long-term engagement
 */
const LEVEL_THRESHOLDS = [
  0,        // Level 1 (starting point)
  2000,     // Level 2
  4500,     // Level 3
  7500,     // Level 4
  11500,    // Level 5
  16500,    // Level 6
  22500,    // Level 7
  29500,    // Level 8
  37500,    // Level 9
  47500,    // Level 10
  59000,    // Level 11
  72000,    // Level 12
  87000,    // Level 13
  104500,   // Level 14
  125000,   // Level 15
  148000,   // Level 16
  173500,   // Level 17
  201500,   // Level 18
  232000,   // Level 19
  265000,   // Level 20
  301000,   // Level 21
  340000,   // Level 22
  382500,   // Level 23
  428500,   // Level 24
  478000,   // Level 25
  531500,   // Level 26
  589000,   // Level 27
  651000,   // Level 28
  717500,   // Level 29
  789000,   // Level 30
];

/**
 * Points increment for levels beyond defined thresholds
 * Used to calculate thresholds for levels 31+
 */
const LEVEL_THRESHOLD_INCREMENT_BEYOND_30 = 100000;

/**
 * Calculate user level based on total points
 * Uses new threshold system per rewards-system.md Section 4
 * @param {number} points - Total points (from sessions + badges - penalties)
 * @returns {Object} { level, currentPoints, pointsToNext, totalPoints }
 */
export const calculateUserLevel = (points) => {
  // Find the highest level threshold the user has reached
  let level = 1;
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (points >= LEVEL_THRESHOLDS[i]) {
      level = i + 1;
      break;
    }
  }
  
  // Calculate points in current level and points to next level
  const currentLevelThreshold = LEVEL_THRESHOLDS[level - 1] || 0;
  
  // For levels beyond defined thresholds, calculate based on increment
  let nextLevelThreshold;
  if (level <= LEVEL_THRESHOLDS.length) {
    nextLevelThreshold = LEVEL_THRESHOLDS[level];
  } else {
    // For levels 31+, calculate based on Level 30 threshold + increments
    const levelsAbove30 = level - LEVEL_THRESHOLDS.length;
    nextLevelThreshold = LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1] + 
                         (levelsAbove30 * LEVEL_THRESHOLD_INCREMENT_BEYOND_30);
  }
  
  const currentPoints = points - currentLevelThreshold;
  const pointsToNext = nextLevelThreshold - points;
  
  return {
    level,
    currentPoints,
    pointsToNext,
    totalPoints: points,
    nextLevelThreshold,
    currentLevelThreshold
  };
};


/**
 * MIGRATION FUNCTIONS (Phase 4)
 * Map old achievement IDs to new ones to preserve user progress
 */

/**
 * Mapping of old achievement IDs to new achievement IDs
 * Used to migrate users from the old system to the new system
 */
const ACHIEVEMENT_MIGRATION_MAP = {
  // Old total session count -> new overall training badges
  "first-session": null, // Not in new system (started at 25)
  "dedicated-5": null, // Not in new system
  "dedicated-10": null, // Not in new system
  "dedicated-25": "training-novice", // Both at 25 total workouts
  "dedicated-50": "training-initiate", // Both at 50 total workouts
  "dedicated-100": null, // New system has 150 next
  "dedicated-150": "training-enthusiast", // Both at 150 total workouts
  "dedicated-200": null, // New system has 300 next
  "dedicated-250": null, // New system has 300 next
  "dedicated-500": null, // New system has 750 next
  
  // Old streak badges -> new streak badges
  "streak-3": null, // Not in new system (starts at 7)
  "streak-7": "week-streak", // Both at 7 days
  "streak-14": "fortnight-streak", // Both at 14 days
  "streak-30": "month-streak", // Both at 30 days
  "streak-60": null, // New system has 90 next
  "streak-100": null, // New system has 90 next
  
  // Old volume badges -> new tonnage badges
  "volume-10k": null, // Not in new system (starts at 50k)
  "volume-50k": "iron-beginner", // Old 50k, new 50k (but new name)
  "volume-100k": null, // New system has 250k next
  "volume-250k": "iron-novice", // Both at 250k
  
  // Old strength count badges -> new strength session count
  "strength-10": "first-steps", // Both at 10
  "strength-50": "building-momentum", // Both at 50
  "strength-100": "consistent-lifter", // Both at 100
  "strength-250": null, // New system has 150, 300 instead
  
  // Old cardio count badges -> new cardio session count
  "cardio-10": "cardio-starter", // Both at 10
  "cardio-50": null, // New system has 25, 75 instead
  "cardio-100": null, // New system has 150 next
  "cardio-250": null, // New system has 300 next
  
  // Old yoga count badges -> new yoga session count
  "yoga-10": "yoga-newcomer", // Both at 10
  "yoga-50": null, // New system has 30, 75 instead
  "yoga-100": null, // New system has 150 next
  "yoga-250": null, // New system has 150 next
  
  // Old strength week streak -> new strength week streak
  "strength-week-1": "consistent-week-1", // Old 1 week -> new 4 weeks (conservative)
  "strength-week-3": null, // Old 3 weeks -> new 4 weeks (conservative)
  "strength-week-5": null, // Old 5 weeks -> new 12 weeks (conservative)
  "strength-week-10": null, // Old 10 weeks -> new 12 weeks (conservative)
  
  // PR achievements - keep as is (not changed in new system)
  "first-pr": null, // No PR badges in new system
  "pr-5": null,
  "pr-10": null,
  "pr-25": null,
  
  // Time-based achievements - not in new system in same form
  "time-1h": null,
  "time-10h": null,
  "time-50h": null,
  "time-100h": null,
  
  // Special achievements - preserve as is
  // (These are kept but not migrated as they are unique events)
  
  // Wellness achievements - preserve as is
  // (These are unchanged)
};

/**
 * Migrate old achievement IDs to new achievement IDs
 * Preserves user progress by mapping old badges to their closest new equivalents
 * @param {Array} oldAchievementIds - Array of old achievement IDs
 * @returns {Array} Array of new achievement IDs
 */
export const migrateAchievements = (oldAchievementIds) => {
  if (!oldAchievementIds || !Array.isArray(oldAchievementIds)) {
    return [];
  }
  
  const newAchievementIds = new Set();
  
  // Map old IDs to new IDs
  oldAchievementIds.forEach(oldId => {
    const newId = ACHIEVEMENT_MIGRATION_MAP[oldId];
    if (newId) {
      newAchievementIds.add(newId);
    } else if (!ACHIEVEMENT_MIGRATION_MAP.hasOwnProperty(oldId)) {
      // If the ID is not in the migration map, it might be a new badge or special badge
      // Check if it exists in the new system
      const exists = ACHIEVEMENT_BADGES.some(b => b.id === oldId);
      if (exists) {
        newAchievementIds.add(oldId);
      }
    }
  });
  
  return Array.from(newAchievementIds);
};

/**
 * Award retroactive badges based on current user stats and workout history
 * This ensures users do not lose credit for milestones already achieved
 * @param {Object} userStats - Current user statistics
 * @param {Array} workoutHistory - Complete workout history
 * @param {Array} currentUnlockedIds - Currently unlocked achievement IDs
 * @returns {Array} Array of achievement IDs that should be unlocked
 */
export const awardRetroactiveBadges = (userStats, workoutHistory, currentUnlockedIds = []) => {
  const allUnlocked = getUnlockedAchievements(userStats, workoutHistory);
  const unlockedIds = allUnlocked.map(a => a.id);
  
  // Combine with current unlocked IDs (avoiding duplicates)
  const combinedIds = new Set([...currentUnlockedIds, ...unlockedIds]);
  
  return Array.from(combinedIds);
};

