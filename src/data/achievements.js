/**
 * Achievements Data
 * 
 * Defines all achievement badges, their unlock conditions, and visual assets
 */

import { calculateStreak } from '../utils/trackingMetrics.js';

/**
 * Achievement badge definitions
 * Each badge has:
 * - id: unique identifier
 * - name: display name
 * - description: what the achievement represents
 * - icon: emoji or icon identifier
 * - tier: bronze, silver, gold, platinum
 * - condition: object defining unlock criteria
 */
export const ACHIEVEMENT_BADGES = [
  // Workout Count Achievements
  {
    id: 'first-workout',
    name: 'First Steps',
    description: 'Complete your first workout',
    icon: '🎯',
    tier: 'bronze',
    condition: { type: 'workoutCount', value: 1 }
  },
  {
    id: 'dedicated-5',
    name: 'Getting Started',
    description: 'Complete 5 workouts',
    icon: '💪',
    tier: 'bronze',
    condition: { type: 'workoutCount', value: 5 }
  },
  {
    id: 'dedicated-10',
    name: 'Committed',
    description: 'Complete 10 workouts',
    icon: '🔥',
    tier: 'silver',
    condition: { type: 'workoutCount', value: 10 }
  },
  {
    id: 'dedicated-25',
    name: 'Athlete',
    description: 'Complete 25 workouts',
    icon: '⭐',
    tier: 'silver',
    condition: { type: 'workoutCount', value: 25 }
  },
  {
    id: 'dedicated-50',
    name: 'Beast Mode',
    description: 'Complete 50 workouts',
    icon: '🦁',
    tier: 'gold',
    condition: { type: 'workoutCount', value: 50 }
  },
  {
    id: 'dedicated-100',
    name: 'Centurion',
    description: 'Complete 100 workouts',
    icon: '👑',
    tier: 'gold',
    condition: { type: 'workoutCount', value: 100 }
  },
  {
    id: 'dedicated-150',
    name: 'Elite Athlete',
    description: 'Complete 150 workouts',
    icon: '🎖️',
    tier: 'gold',
    condition: { type: 'workoutCount', value: 150 }
  },
  {
    id: 'dedicated-200',
    name: 'Relentless',
    description: 'Complete 200 workouts',
    icon: '🔱',
    tier: 'platinum',
    condition: { type: 'workoutCount', value: 200 }
  },
  {
    id: 'dedicated-250',
    name: 'Iron Legend',
    description: 'Complete 250 workouts',
    icon: '🏆',
    tier: 'platinum',
    condition: { type: 'workoutCount', value: 250 }
  },
  {
    id: 'dedicated-500',
    name: 'Hall of Fame',
    description: 'Complete 500 workouts',
    icon: '⚜️',
    tier: 'platinum',
    condition: { type: 'workoutCount', value: 500 }
  },

  // Streak Achievements
  {
    id: 'streak-3',
    name: 'Consistency',
    description: 'Maintain a 3-day workout streak',
    icon: '🔗',
    tier: 'bronze',
    condition: { type: 'streak', value: 3 }
  },
  {
    id: 'streak-7',
    name: 'Week Warrior',
    description: 'Maintain a 7-day workout streak',
    icon: '📅',
    tier: 'silver',
    condition: { type: 'streak', value: 7 }
  },
  {
    id: 'streak-14',
    name: 'Fortnight Fighter',
    description: 'Maintain a 14-day workout streak',
    icon: '⚡',
    tier: 'silver',
    condition: { type: 'streak', value: 14 }
  },
  {
    id: 'streak-30',
    name: 'Monthly Master',
    description: 'Maintain a 30-day workout streak',
    icon: '🌟',
    tier: 'gold',
    condition: { type: 'streak', value: 30 }
  },
  {
    id: 'streak-60',
    name: 'Unbreakable',
    description: 'Maintain a 60-day workout streak',
    icon: '💎',
    tier: 'gold',
    condition: { type: 'streak', value: 60 }
  },
  {
    id: 'streak-100',
    name: 'Iron Will',
    description: 'Maintain a 100-day workout streak',
    icon: '🛡️',
    tier: 'platinum',
    condition: { type: 'streak', value: 100 }
  },

  // PR (Personal Record) Achievements
  {
    id: 'first-pr',
    name: 'New Heights',
    description: 'Achieve your first personal record',
    icon: '📈',
    tier: 'bronze',
    condition: { type: 'prCount', value: 1 }
  },
  {
    id: 'pr-5',
    name: 'Record Breaker',
    description: 'Achieve 5 personal records',
    icon: '🎖️',
    tier: 'silver',
    condition: { type: 'prCount', value: 5 }
  },
  {
    id: 'pr-10',
    name: 'Powerhouse',
    description: 'Achieve 10 personal records',
    icon: '💥',
    tier: 'gold',
    condition: { type: 'prCount', value: 10 }
  },
  {
    id: 'pr-25',
    name: 'Peak Performance',
    description: 'Achieve 25 personal records',
    icon: '🚀',
    tier: 'platinum',
    condition: { type: 'prCount', value: 25 }
  },

  // Volume Achievements (total weight lifted)
  {
    id: 'volume-10k',
    name: 'Moving Iron',
    description: 'Lift 10,000 lbs total volume',
    icon: '🏋️',
    tier: 'bronze',
    condition: { type: 'totalVolume', value: 10000 }
  },
  {
    id: 'volume-50k',
    name: 'Heavy Lifter',
    description: 'Lift 50,000 lbs total volume',
    icon: '⚙️',
    tier: 'silver',
    condition: { type: 'totalVolume', value: 50000 }
  },
  {
    id: 'volume-100k',
    name: 'Tonnage Master',
    description: 'Lift 100,000 lbs total volume',
    icon: '🏗️',
    tier: 'gold',
    condition: { type: 'totalVolume', value: 100000 }
  },
  {
    id: 'volume-250k',
    name: 'Moving Mountains',
    description: 'Lift 250,000 lbs total volume',
    icon: '⛰️',
    tier: 'platinum',
    condition: { type: 'totalVolume', value: 250000 }
  },

  // Time-based Achievements
  {
    id: 'time-1h',
    name: 'First Hour',
    description: 'Complete 1 hour of total workout time',
    icon: '⏱️',
    tier: 'bronze',
    condition: { type: 'totalTime', value: 3600 }
  },
  {
    id: 'time-10h',
    name: 'Time Investment',
    description: 'Complete 10 hours of total workout time',
    icon: '⌚',
    tier: 'silver',
    condition: { type: 'totalTime', value: 36000 }
  },
  {
    id: 'time-50h',
    name: 'Dedicated',
    description: 'Complete 50 hours of total workout time',
    icon: '⏰',
    tier: 'gold',
    condition: { type: 'totalTime', value: 180000 }
  },
  {
    id: 'time-100h',
    name: 'Time Master',
    description: 'Complete 100 hours of total workout time',
    icon: '🕐',
    tier: 'platinum',
    condition: { type: 'totalTime', value: 360000 }
  },

  // Special Achievements
  {
    id: 'early-bird',
    name: 'Early Bird',
    description: 'Complete a workout before 7 AM',
    icon: '🌅',
    tier: 'bronze',
    condition: { type: 'special', value: 'earlyMorning' }
  },
  {
    id: 'morning-person',
    name: 'Morning Person',
    description: 'Complete 10 workouts in the morning (7 AM - 12 PM)',
    icon: '☀️',
    tier: 'silver',
    condition: { type: 'special', value: 'morningWorkouts', count: 10 }
  },
  {
    id: 'afternoon-warrior',
    name: 'Afternoon Warrior',
    description: 'Complete 10 workouts in the afternoon (12 PM - 5 PM)',
    icon: '🌤️',
    tier: 'silver',
    condition: { type: 'special', value: 'afternoonWorkouts', count: 10 }
  },
  {
    id: 'evening-grinder',
    name: 'Evening Grinder',
    description: 'Complete 10 workouts in the evening (5 PM - 10 PM)',
    icon: '🌆',
    tier: 'silver',
    condition: { type: 'special', value: 'eveningWorkouts', count: 10 }
  },
  {
    id: 'night-owl',
    name: 'Night Owl',
    description: 'Complete a workout after 10 PM',
    icon: '🌙',
    tier: 'bronze',
    condition: { type: 'special', value: 'lateNight' }
  },
  {
    id: 'consecutive-3',
    name: 'Back to Back',
    description: 'Complete 3 consecutive workouts within an hour of each other',
    icon: '⏱️',
    tier: 'bronze',
    condition: { type: 'special', value: 'consecutiveWorkouts', count: 3 }
  },
  {
    id: 'consecutive-5',
    name: 'Chain Reaction',
    description: 'Complete 5 consecutive workouts within an hour of each other',
    icon: '🔗',
    tier: 'silver',
    condition: { type: 'special', value: 'consecutiveWorkouts', count: 5 }
  },
  {
    id: 'consecutive-10',
    name: 'Unstoppable',
    description: 'Complete 10 consecutive workouts within an hour of each other',
    icon: '⚡',
    tier: 'gold',
    condition: { type: 'special', value: 'consecutiveWorkouts', count: 10 }
  },
  {
    id: 'weekend-warrior',
    name: 'Weekend Warrior',
    description: 'Complete 10 weekend workouts',
    icon: '🎯',
    tier: 'silver',
    condition: { type: 'special', value: 'weekendWorkouts', count: 10 }
  },
  {
    id: 'variety-seeker',
    name: 'Variety Seeker',
    description: 'Complete all workout types (Full Body, Upper, Lower, Push, Pull, Legs)',
    icon: '🎨',
    tier: 'gold',
    condition: { type: 'special', value: 'allWorkoutTypes' }
  },

  // Wellness Task Achievements
  {
    id: 'wellness-first',
    name: 'Wellness Beginner',
    description: 'Complete your first wellness task',
    icon: '🌱',
    tier: 'bronze',
    condition: { type: 'wellnessTaskCount', value: 1 }
  },
  {
    id: 'wellness-10',
    name: 'Wellness Explorer',
    description: 'Complete 10 wellness tasks',
    icon: '🌿',
    tier: 'bronze',
    condition: { type: 'wellnessTaskCount', value: 10 }
  },
  {
    id: 'wellness-25',
    name: 'Wellness Enthusiast',
    description: 'Complete 25 wellness tasks',
    icon: '🍀',
    tier: 'silver',
    condition: { type: 'wellnessTaskCount', value: 25 }
  },
  {
    id: 'wellness-50',
    name: 'Wellness Champion',
    description: 'Complete 50 wellness tasks',
    icon: '🌺',
    tier: 'gold',
    condition: { type: 'wellnessTaskCount', value: 50 }
  },
  {
    id: 'wellness-100',
    name: 'Wellness Master',
    description: 'Complete 100 wellness tasks',
    icon: '🌸',
    tier: 'platinum',
    condition: { type: 'wellnessTaskCount', value: 100 }
  },

  // Strength Workout Count Achievements
  {
    id: 'strength-10',
    name: 'Iron Starter',
    description: 'Complete 10 strength workouts',
    icon: '🏋️',
    tier: 'bronze',
    condition: { type: 'strengthWorkoutCount', value: 10 }
  },
  {
    id: 'strength-50',
    name: 'Iron Regular',
    description: 'Complete 50 strength workouts',
    icon: '💪',
    tier: 'silver',
    condition: { type: 'strengthWorkoutCount', value: 50 }
  },
  {
    id: 'strength-100',
    name: 'Iron Warrior',
    description: 'Complete 100 strength workouts',
    icon: '🦾',
    tier: 'gold',
    condition: { type: 'strengthWorkoutCount', value: 100 }
  },
  {
    id: 'strength-250',
    name: 'Iron Master',
    description: 'Complete 250 strength workouts',
    icon: '⚔️',
    tier: 'platinum',
    condition: { type: 'strengthWorkoutCount', value: 250 }
  },

  // Cardio Workout Count Achievements
  {
    id: 'cardio-10',
    name: 'Cardio Starter',
    description: 'Complete 10 cardio workouts',
    icon: '🏃',
    tier: 'bronze',
    condition: { type: 'cardioWorkoutCount', value: 10 }
  },
  {
    id: 'cardio-50',
    name: 'Cardio Enthusiast',
    description: 'Complete 50 cardio workouts',
    icon: '❤️‍🔥',
    tier: 'silver',
    condition: { type: 'cardioWorkoutCount', value: 50 }
  },
  {
    id: 'cardio-100',
    name: 'Cardio Champion',
    description: 'Complete 100 cardio workouts',
    icon: '🫀',
    tier: 'gold',
    condition: { type: 'cardioWorkoutCount', value: 100 }
  },
  {
    id: 'cardio-250',
    name: 'Cardio Legend',
    description: 'Complete 250 cardio workouts',
    icon: '🏅',
    tier: 'platinum',
    condition: { type: 'cardioWorkoutCount', value: 250 }
  },

  // Yoga/Flexibility Workout Count Achievements
  {
    id: 'yoga-10',
    name: 'Flexibility Starter',
    description: 'Complete 10 yoga or stretching workouts',
    icon: '🧘',
    tier: 'bronze',
    condition: { type: 'yogaWorkoutCount', value: 10 }
  },
  {
    id: 'yoga-50',
    name: 'Flexibility Enthusiast',
    description: 'Complete 50 yoga or stretching workouts',
    icon: '🌺',
    tier: 'silver',
    condition: { type: 'yogaWorkoutCount', value: 50 }
  },
  {
    id: 'yoga-100',
    name: 'Flexibility Master',
    description: 'Complete 100 yoga or stretching workouts',
    icon: '🪷',
    tier: 'gold',
    condition: { type: 'yogaWorkoutCount', value: 100 }
  },
  {
    id: 'yoga-250',
    name: 'Zen Master',
    description: 'Complete 250 yoga or stretching workouts',
    icon: '☯️',
    tier: 'platinum',
    condition: { type: 'yogaWorkoutCount', value: 250 }
  },

  // Strength Weekly Streak Achievements (3+ strength workouts per week)
  {
    id: 'strength-week-1',
    name: 'Strong Week',
    description: 'Complete 3+ strength workouts in a single week',
    icon: '📅',
    tier: 'bronze',
    condition: { type: 'strengthWeekStreak', value: 1 }
  },
  {
    id: 'strength-week-3',
    name: 'Strength Streak',
    description: 'Complete 3+ strength workouts per week for 3 consecutive weeks',
    icon: '🔗',
    tier: 'silver',
    condition: { type: 'strengthWeekStreak', value: 3 }
  },
  {
    id: 'strength-week-5',
    name: 'Strength Warrior',
    description: 'Complete 3+ strength workouts per week for 5 consecutive weeks',
    icon: '⚡',
    tier: 'gold',
    condition: { type: 'strengthWeekStreak', value: 5 }
  },
  {
    id: 'strength-week-10',
    name: 'Strength Legend',
    description: 'Complete 3+ strength workouts per week for 10 consecutive weeks',
    icon: '🏆',
    tier: 'platinum',
    condition: { type: 'strengthWeekStreak', value: 10 }
  }
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
 * Get the start of the week (Monday) for a given date
 * @param {Date} date - Date to get week start for
 * @returns {Date} Start of the week (Monday at 00:00:00)
 */
const getWeekStart = (date) => {
  const d = new Date(date);
  const day = d.getDay();
  // Calculate days to subtract to get to Monday
  // Sunday (0) needs to go back 6 days, other days go back (day - 1) days
  const diff = day === 0 ? 6 : day - 1;
  d.setDate(d.getDate() - diff);
  d.setHours(0, 0, 0, 0);
  return d;
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
    case 'workoutCount':
      return (userStats.totalWorkouts || 0) >= condition.value;
    
    case 'streak':
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
    case 'workoutCount':
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
      case 'workoutCount':
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
 * Calculate total achievement points
 * Bronze: 10, Silver: 25, Gold: 50, Platinum: 100
 * @param {Array} unlockedAchievements - Array of unlocked achievements
 * @returns {number} Total points
 */
export const calculateAchievementPoints = (unlockedAchievements) => {
  const tierPoints = {
    bronze: 10,
    silver: 25,
    gold: 50,
    platinum: 100
  };
  
  return unlockedAchievements.reduce((total, achievement) => {
    return total + (tierPoints[achievement.tier] || 0);
  }, 0);
};

/**
 * Calculate user level based on achievement points
 * Each level requires 100 points
 * @param {number} points - Total achievement points
 * @returns {Object} { level, pointsToNext }
 */
export const calculateUserLevel = (points) => {
  const pointsPerLevel = 100;
  const level = Math.floor(points / pointsPerLevel) + 1;
  const pointsInCurrentLevel = points % pointsPerLevel;
  const pointsToNext = pointsPerLevel - pointsInCurrentLevel;
  
  return {
    level,
    currentPoints: pointsInCurrentLevel,
    pointsToNext,
    totalPoints: points
  };
};
