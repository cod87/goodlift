/**
 * Points Tracking System
 * 
 * Implements session-based points tracking per rewards-system.md Section 3
 * - Base points per session (Strength: 100, Cardio: 50, Yoga: 40)
 * - Weekly consistency bonus (20% after 3+ strength sessions)
 * - Streak multipliers (1.10x to 1.40x)
 * - Badge bonuses (500 points each)
 * - Penalties (streak break: -100, weekly failure: -150)
 */

import { isGuestMode, getGuestData, setGuestData } from './guestStorage.js';
import { 
  getBaseSessionPoints, 
  calculateSessionPoints, 
  hasWeeklyConsistencyBonus, 
  getStreakMultiplier,
  calculateAchievementPoints,
  calculateUserLevel
} from '../data/achievements.js';

const KEYS = {
  USER_POINTS: 'goodlift_user_points',
  LAST_WEEK_EVALUATED: 'goodlift_last_week_evaluated',
  LAST_STREAK_CHECK: 'goodlift_last_streak_check',
};

/**
 * Get the start of the current week (Sunday at midnight)
 * @returns {Date} Start of the week
 */
const getCurrentWeekStart = () => {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day; // subtract days to get to Sunday
  const weekStart = new Date(now.setDate(diff));
  weekStart.setHours(0, 0, 0, 0);
  return weekStart;
};

/**
 * Get user points data
 * @returns {Object} Points data including totalPoints, sessionPoints, badgePoints, penalties
 */
export const getUserPoints = () => {
  try {
    let pointsData;
    
    if (isGuestMode()) {
      pointsData = getGuestData('user_points');
    } else {
      const data = localStorage.getItem(KEYS.USER_POINTS);
      pointsData = data ? JSON.parse(data) : null;
    }
    
    // Initialize if not exists
    if (!pointsData) {
      pointsData = {
        totalPoints: 0,
        sessionPoints: 0,
        badgePoints: 0,
        penaltyPoints: 0,
        weeklyStrengthSessions: 0,
        currentWeekStart: getCurrentWeekStart().toISOString(),
      };
    }
    
    return pointsData;
  } catch (error) {
    console.error('Error getting user points:', error);
    return {
      totalPoints: 0,
      sessionPoints: 0,
      badgePoints: 0,
      penaltyPoints: 0,
      weeklyStrengthSessions: 0,
      currentWeekStart: getCurrentWeekStart().toISOString(),
    };
  }
};

/**
 * Save user points data
 * @param {Object} pointsData - Points data to save
 */
export const saveUserPoints = (pointsData) => {
  try {
    if (isGuestMode()) {
      setGuestData('user_points', pointsData);
    } else {
      localStorage.setItem(KEYS.USER_POINTS, JSON.stringify(pointsData));
    }
  } catch (error) {
    console.error('Error saving user points:', error);
  }
};

/**
 * Award points for a completed session
 * @param {string} sessionType - Type of session (strength, cardio, yoga, etc.)
 * @param {number} currentStreak - Current streak in days
 * @param {Array} workoutHistory - Complete workout history including current session
 * @returns {Object} { pointsAwarded, breakdown }
 */
export const awardSessionPoints = (sessionType, currentStreak, workoutHistory) => {
  try {
    const pointsData = getUserPoints();
    
    // Check if we need to reset weekly counter (new week started)
    const weekStart = getCurrentWeekStart();
    const currentWeekStart = new Date(pointsData.currentWeekStart);
    
    if (weekStart > currentWeekStart) {
      // New week started, reset counter
      pointsData.weeklyStrengthSessions = 0;
      pointsData.currentWeekStart = weekStart.toISOString();
    }
    
    // Check if weekly consistency bonus is active
    const hasWeeklyBonus = hasWeeklyConsistencyBonus(workoutHistory);
    
    // Calculate points for this session
    const sessionPoints = calculateSessionPoints(sessionType, currentStreak, hasWeeklyBonus);
    
    // Update points data
    pointsData.sessionPoints += sessionPoints;
    pointsData.totalPoints += sessionPoints;
    
    // Track strength sessions for weekly evaluation
    const type = (sessionType || '').toLowerCase();
    const isStrength = ['full', 'upper', 'lower', 'push', 'pull', 'legs', 'core', 'strength'].includes(type);
    
    if (isStrength) {
      pointsData.weeklyStrengthSessions += 1;
    }
    
    // Save updated points
    saveUserPoints(pointsData);
    
    // Return breakdown for display
    const basePoints = getBaseSessionPoints(sessionType);
    const streakMultiplier = getStreakMultiplier(currentStreak);
    
    return {
      pointsAwarded: sessionPoints,
      breakdown: {
        basePoints,
        weeklyBonus: hasWeeklyBonus ? basePoints * 0.20 : 0,
        streakMultiplier,
        totalBeforeMultiplier: hasWeeklyBonus ? basePoints * 1.20 : basePoints,
        final: sessionPoints
      }
    };
  } catch (error) {
    console.error('Error awarding session points:', error);
    return { pointsAwarded: 0, breakdown: {} };
  }
};

/**
 * Award points for new badges
 * @param {number} badgeCount - Number of new badges unlocked
 * @returns {number} Points awarded
 */
export const awardBadgePoints = (badgeCount) => {
  try {
    const pointsPerBadge = 500;
    const totalBadgePoints = badgeCount * pointsPerBadge;
    
    const pointsData = getUserPoints();
    pointsData.badgePoints += totalBadgePoints;
    pointsData.totalPoints += totalBadgePoints;
    
    saveUserPoints(pointsData);
    
    return totalBadgePoints;
  } catch (error) {
    console.error('Error awarding badge points:', error);
    return 0;
  }
};

/**
 * Apply streak break penalty
 * @returns {number} Penalty applied (negative number)
 */
export const applyStreakBreakPenalty = () => {
  try {
    const penalty = -100;
    const pointsData = getUserPoints();
    
    pointsData.penaltyPoints += Math.abs(penalty); // Track total penalties as positive
    pointsData.totalPoints += penalty; // Apply as negative to total
    
    // Ensure totalPoints doesn't go negative
    pointsData.totalPoints = Math.max(0, pointsData.totalPoints);
    
    saveUserPoints(pointsData);
    
    return penalty;
  } catch (error) {
    console.error('Error applying streak break penalty:', error);
    return 0;
  }
};

/**
 * Evaluate weekly performance and apply penalty if needed
 * Should be called at the start of each new week
 * @param {number} strengthSessionsLastWeek - Number of strength sessions in the week that just ended
 * @returns {Object} { penalty, evaluated }
 */
export const evaluateWeeklyPerformance = (strengthSessionsLastWeek) => {
  try {
    const pointsData = getUserPoints();
    const weekStart = getCurrentWeekStart();
    
    // Check if we've already evaluated this week
    const lastEvaluated = pointsData.lastWeekEvaluated ? new Date(pointsData.lastWeekEvaluated) : null;
    
    // If we already evaluated this week, don't evaluate again
    if (lastEvaluated && lastEvaluated >= weekStart) {
      return { penalty: 0, evaluated: false };
    }
    
    // Check if user met the 3 strength sessions goal
    if (strengthSessionsLastWeek < 3) {
      const penalty = -150;
      
      pointsData.penaltyPoints += Math.abs(penalty);
      pointsData.totalPoints += penalty;
      pointsData.totalPoints = Math.max(0, pointsData.totalPoints);
      pointsData.lastWeekEvaluated = weekStart.toISOString();
      
      saveUserPoints(pointsData);
      
      return { penalty, evaluated: true };
    } else {
      // Met the goal, just mark as evaluated
      pointsData.lastWeekEvaluated = weekStart.toISOString();
      saveUserPoints(pointsData);
      
      return { penalty: 0, evaluated: true };
    }
  } catch (error) {
    console.error('Error evaluating weekly performance:', error);
    return { penalty: 0, evaluated: false };
  }
};

/**
 * Get total points including badges
 * @param {Array} unlockedAchievements - Array of unlocked achievement objects
 * @returns {number} Total points from sessions + badges - penalties
 */
export const getTotalPoints = (unlockedAchievements = []) => {
  try {
    const pointsData = getUserPoints();
    return pointsData.totalPoints;
  } catch (error) {
    console.error('Error getting total points:', error);
    return 0;
  }
};

/**
 * Initialize points system for existing users
 * Calculates initial points from unlocked badges
 * @param {Array} unlockedAchievements - Array of unlocked achievement objects
 */
export const initializePointsForExistingUser = (unlockedAchievements) => {
  try {
    const pointsData = getUserPoints();
    
    // Only initialize if this is a fresh points system (no points yet)
    if (pointsData.totalPoints === 0 && pointsData.sessionPoints === 0 && pointsData.badgePoints === 0) {
      const badgePoints = calculateAchievementPoints(unlockedAchievements);
      
      pointsData.badgePoints = badgePoints;
      pointsData.totalPoints = badgePoints;
      
      saveUserPoints(pointsData);
      
      console.log(`[Points] Initialized with ${badgePoints} points from ${unlockedAchievements.length} badges`);
    }
  } catch (error) {
    console.error('Error initializing points:', error);
  }
};

/**
 * Get points breakdown for display
 * @returns {Object} Breakdown of points sources
 */
export const getPointsBreakdown = () => {
  const pointsData = getUserPoints();
  
  return {
    totalPoints: pointsData.totalPoints,
    sessionPoints: pointsData.sessionPoints,
    badgePoints: pointsData.badgePoints,
    penaltyPoints: pointsData.penaltyPoints,
    weeklyStrengthSessions: pointsData.weeklyStrengthSessions,
  };
};

/**
 * Check for streak break and apply penalty if needed
 * Should be called on app load to detect if streak was broken
 * @param {number} currentStreak - Current streak in days
 * @param {number} previousStreak - Previously recorded streak
 * @returns {Object} { penalty, streakBroken }
 */
export const checkAndApplyStreakBreakPenalty = (currentStreak, previousStreak) => {
  try {
    // If current streak is less than previous (and previous was > 0), streak was broken
    if (previousStreak > 0 && currentStreak < previousStreak) {
      const penalty = applyStreakBreakPenalty();
      console.log(`[Points] Streak broken (was ${previousStreak}, now ${currentStreak}). Penalty: ${penalty}`);
      return { penalty, streakBroken: true };
    }
    
    return { penalty: 0, streakBroken: false };
  } catch (error) {
    console.error('Error checking streak break:', error);
    return { penalty: 0, streakBroken: false };
  }
};

/**
 * Get last recorded streak
 * @returns {number} Last recorded streak
 */
export const getLastRecordedStreak = () => {
  try {
    if (isGuestMode()) {
      return getGuestData('last_recorded_streak') || 0;
    } else {
      const value = localStorage.getItem(KEYS.LAST_STREAK_CHECK);
      return value ? parseInt(value) : 0;
    }
  } catch (error) {
    return 0;
  }
};

/**
 * Save current streak for future break detection
 * @param {number} streak - Current streak to save
 */
export const saveCurrentStreak = (streak) => {
  try {
    if (isGuestMode()) {
      setGuestData('last_recorded_streak', streak);
    } else {
      localStorage.setItem(KEYS.LAST_STREAK_CHECK, streak.toString());
    }
  } catch (error) {
    console.error('Error saving current streak:', error);
  }
};

/**
 * Reset weekly counter (for testing or new week)
 */
export const resetWeeklyCounter = () => {
  const pointsData = getUserPoints();
  pointsData.weeklyStrengthSessions = 0;
  pointsData.currentWeekStart = getCurrentWeekStart().toISOString();
  saveUserPoints(pointsData);
};
