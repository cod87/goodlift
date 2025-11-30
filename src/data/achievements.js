/**
 * Achievements Data
 * 
 * Defines all achievement badges, their unlock conditions, and visual assets
 */

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
 * This function determines which achievements were just unlocked by the latest action.
 * It uses a two-pronged approach for reliability:
 * 1. Checks if the achievement ID is in the previouslyUnlocked list
 * 2. For workoutCount-based achievements, also verifies the achievement wasn't 
 *    unlockable before the current workout (using workout history length)
 * 
 * This ensures achievements are only shown as "new" when they are truly first unlocked,
 * even if the previouslyUnlocked list is out of sync or empty.
 * 
 * @param {Object} userStats - Current user statistics
 * @param {Array} workoutHistory - Workout history (including the just-completed workout)
 * @param {Array} previouslyUnlocked - Previously unlocked achievement IDs
 * @returns {Array} Newly unlocked achievements
 */
export const getNewlyUnlockedAchievements = (userStats, workoutHistory, previouslyUnlocked = []) => {
  const currentUnlocked = getUnlockedAchievements(userStats, workoutHistory);
  
  // Calculate how many workouts existed BEFORE the current one was added
  // This provides a fallback check in case previouslyUnlocked is not accurate
  const workoutsBeforeCurrent = Math.max(0, (workoutHistory?.length || 0) - 1);
  
  return currentUnlocked.filter(achievement => {
    // If already in the previouslyUnlocked list, it's not new
    if (previouslyUnlocked.includes(achievement.id)) {
      return false;
    }
    
    // Additional check for workoutCount-based achievements:
    // If this achievement would have been unlocked with the previous workout count,
    // then it's not truly new (the stored list was just out of sync)
    if (achievement.condition.type === 'workoutCount') {
      const requiredWorkouts = achievement.condition.value;
      // If we had enough workouts BEFORE this one, the achievement was already unlockable
      if (workoutsBeforeCurrent >= requiredWorkouts) {
        return false;
      }
    }
    
    // Achievement is newly unlocked
    return true;
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
