import { useState, useEffect } from 'react';
import { getDefaultWeeklyPlan, getTodaysWorkout, getNextWorkouts } from '../utils/weeklyPlanDefaults';
import { isGuestMode, getGuestData, setGuestData } from '../utils/guestStorage';

/**
 * Weekly Plan Management Hook
 * Manages user's weekly workout plan with localStorage persistence
 */

const WEEKLY_PLAN_KEY = 'goodlift_weekly_plan';
const PLANNING_STYLE_KEY = 'goodlift_planning_style';

/**
 * Get weekly plan from storage
 * @returns {Object} Plan configuration
 */
const getStoredPlan = () => {
  try {
    if (isGuestMode()) {
      const guestStyle = getGuestData('planning_style') || 'upper_lower';
      const guestPlan = getGuestData('weekly_plan');
      return {
        style: guestStyle,
        plan: guestPlan || getDefaultWeeklyPlan(guestStyle)
      };
    }
    
    const style = localStorage.getItem(PLANNING_STYLE_KEY) || 'upper_lower';
    const planData = localStorage.getItem(WEEKLY_PLAN_KEY);
    
    return {
      style,
      plan: planData ? JSON.parse(planData) : getDefaultWeeklyPlan(style)
    };
  } catch (error) {
    console.error('Error loading weekly plan:', error);
    return {
      style: 'upper_lower',
      plan: getDefaultWeeklyPlan('upper_lower')
    };
  }
};

/**
 * Save weekly plan to storage
 * @param {string} style - Planning style
 * @param {Array} plan - Weekly plan array
 */
const savePlan = (style, plan) => {
  try {
    if (isGuestMode()) {
      setGuestData('planning_style', style);
      setGuestData('weekly_plan', plan);
    } else {
      localStorage.setItem(PLANNING_STYLE_KEY, style);
      localStorage.setItem(WEEKLY_PLAN_KEY, JSON.stringify(plan));
    }
  } catch (error) {
    console.error('Error saving weekly plan:', error);
  }
};

/**
 * Hook for managing weekly workout plan
 * @returns {Object} Weekly plan state and methods
 */
export const useWeeklyPlan = () => {
  const [planningStyle, setPlanningStyle] = useState('upper_lower');
  const [weeklyPlan, setWeeklyPlan] = useState([]);
  const [todaysWorkout, setTodaysWorkout] = useState(null);
  const [nextWorkouts, setNextWorkouts] = useState([]);

  // Load plan on mount
  useEffect(() => {
    const { style, plan } = getStoredPlan();
    setPlanningStyle(style);
    setWeeklyPlan(plan);
    setTodaysWorkout(getTodaysWorkout(plan));
    setNextWorkouts(getNextWorkouts(plan, 2));
  }, []);

  /**
   * Update planning style and regenerate plan
   * @param {string} newStyle - New planning style
   */
  const updatePlanningStyle = (newStyle) => {
    const newPlan = getDefaultWeeklyPlan(newStyle);
    setPlanningStyle(newStyle);
    setWeeklyPlan(newPlan);
    setTodaysWorkout(getTodaysWorkout(newPlan));
    setNextWorkouts(getNextWorkouts(newPlan, 2));
    savePlan(newStyle, newPlan);
  };

  /**
   * Update specific day in weekly plan
   * @param {number} dayIndex - Index of day to update
   * @param {Object} dayConfig - New day configuration
   */
  const updateDay = (dayIndex, dayConfig) => {
    const newPlan = [...weeklyPlan];
    newPlan[dayIndex] = { ...newPlan[dayIndex], ...dayConfig };
    setWeeklyPlan(newPlan);
    setTodaysWorkout(getTodaysWorkout(newPlan));
    setNextWorkouts(getNextWorkouts(newPlan, 2));
    savePlan(planningStyle, newPlan);
  };

  /**
   * Reset plan to default for current style
   */
  const resetToDefault = () => {
    const defaultPlan = getDefaultWeeklyPlan(planningStyle);
    setWeeklyPlan(defaultPlan);
    setTodaysWorkout(getTodaysWorkout(defaultPlan));
    setNextWorkouts(getNextWorkouts(defaultPlan, 2));
    savePlan(planningStyle, defaultPlan);
  };

  /**
   * Get workout for specific day
   * @param {string} day - Day abbreviation (Mon, Tue, etc.)
   * @returns {Object|null} Workout for the day
   */
  const getWorkoutForDay = (day) => {
    return weeklyPlan.find(d => d.day === day) || null;
  };

  return {
    planningStyle,
    weeklyPlan,
    todaysWorkout,
    nextWorkouts,
    updatePlanningStyle,
    updateDay,
    resetToDefault,
    getWorkoutForDay
  };
};
