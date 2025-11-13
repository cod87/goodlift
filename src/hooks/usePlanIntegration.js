/**
 * usePlanIntegration Hook
 * 
 * Manages the connection between weekly plans, workouts, and sessions
 * Provides utilities for navigating between plan days and logging sessions with plan context
 */

import { useState, useEffect, useCallback } from 'react';
import { getActivePlan, setActivePlan } from '../utils/storage';
import { linkSessionToPlan, getSessionsForPlanDay } from '../utils/sessionStorageSchema';

/**
 * usePlanIntegration hook
 * Manages weekly plan state and provides plan-aware navigation utilities
 */
export const usePlanIntegration = () => {
  const [currentPlan, setCurrentPlan] = useState(null);
  const [selectedPlanDay, setSelectedPlanDay] = useState(null);
  const [loading, setLoading] = useState(true);

  /**
   * Load the active plan from storage
   */
  useEffect(() => {
    const loadPlan = async () => {
      setLoading(true);
      try {
        const plan = await getActivePlan();
        setCurrentPlan(plan); // Will be null if no active plan exists
      } catch (error) {
        console.error('Error loading plan:', error);
        setCurrentPlan(null);
      } finally {
        setLoading(false);
      }
    };

    loadPlan();
  }, []);

  /**
   * Get today's workout from the plan
   */
  const getTodaysWorkout = useCallback(() => {
    if (!currentPlan || !currentPlan.sessions || !Array.isArray(currentPlan.sessions)) {
      return null;
    }
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todaySession = currentPlan.sessions.find(s => {
      const sessionDate = new Date(s.date);
      sessionDate.setHours(0, 0, 0, 0);
      return sessionDate.getTime() === today.getTime();
    });
    
    return todaySession || null;
  }, [currentPlan]);

  /**
   * Get a specific day's workout from the plan
   * @param {number} dayIndex - Day index (0-6)
   * @deprecated Use getTodaysWorkout() or search sessions array directly
   */
  const getPlanDay = useCallback((dayIndex) => {
    if (!currentPlan || !currentPlan.sessions) return null;
    
    // For backward compatibility, find session for the specified day of current week
    const today = new Date();
    const dayOfWeek = today.getDay();
    const daysToAdd = (dayIndex - dayOfWeek + 7) % 7;
    const targetDate = new Date(today);
    targetDate.setDate(today.getDate() + daysToAdd);
    targetDate.setHours(0, 0, 0, 0);
    
    return currentPlan.sessions.find(s => {
      const sessionDate = new Date(s.date);
      sessionDate.setHours(0, 0, 0, 0);
      return sessionDate.getTime() === targetDate.getTime();
    }) || null;
  }, [currentPlan]);

  /**
   * Get the next N upcoming workouts (excluding rest days)
   * @param {number} count - Number of workouts to return
   */
  const getUpcomingWorkouts = useCallback((count = 3) => {
    if (!currentPlan || !currentPlan.sessions || !Array.isArray(currentPlan.sessions)) {
      return [];
    }
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const futureSessions = currentPlan.sessions
      .filter(s => {
        const sessionDate = new Date(s.date);
        sessionDate.setHours(0, 0, 0, 0);
        return sessionDate > today && s.type !== 'rest';
      })
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .slice(0, count);
    
    return futureSessions.map(s => {
      const sessionDate = new Date(s.date);
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      return {
        ...s,
        day: days[sessionDate.getDay()],
      };
    });
  }, [currentPlan]);

  /**
   * Update the plan in state and storage
   * @param {Object} updatedPlan - Updated plan object
   */
  const updatePlan = useCallback(async (updatedPlan) => {
    try {
      await setActivePlan(updatedPlan);
      setCurrentPlan(updatedPlan);
    } catch (error) {
      console.error('Error updating plan:', error);
    }
  }, []);

  /**
   * Select a plan day for viewing/editing
   * @param {number} dayIndex - Day index to select
   */
  const selectDay = useCallback((dayIndex) => {
    const day = getPlanDay(dayIndex);
    setSelectedPlanDay(day);
    return day;
  }, [getPlanDay]);

  /**
   * Clear the selected plan day
   */
  const clearSelectedDay = useCallback(() => {
    setSelectedPlanDay(null);
  }, []);

  /**
   * Create navigation state for navigating to a workout with plan context
   * @param {number} dayIndex - Day index in the plan
   * @param {Object} workout - Optional pre-generated workout data
   */
  const createWorkoutNavState = useCallback((dayIndex, workout = null) => {
    if (!currentPlan) return null;
    
    const planDay = currentPlan.days[dayIndex];
    if (!planDay) return null;
    
    return {
      fromPlan: true,
      planId: currentPlan.planId,
      planDay: dayIndex,
      dayData: planDay,
      workoutData: workout || planDay.generatedWorkout,
      workoutType: planDay.subtype,
      estimatedDuration: planDay.estimatedDuration
    };
  }, [currentPlan]);

  /**
   * Add plan context to a session before saving
   * @param {Object} session - Session object to link
   * @param {number} dayIndex - Day index in the plan
   */
  const linkSession = useCallback((session, dayIndex = null) => {
    if (!currentPlan) return session;
    
    // Use selected day if no dayIndex provided
    const targetDayIndex = dayIndex !== null ? dayIndex : selectedPlanDay?.dayIndex;
    if (targetDayIndex === null || targetDayIndex === undefined) return session;
    
    return linkSessionToPlan(session, currentPlan.planId, targetDayIndex);
  }, [currentPlan, selectedPlanDay]);

  /**
   * Get all sessions for a specific plan day
   * @param {Array} allSessions - Array of all sessions
   * @param {number} dayIndex - Day index
   */
  const getSessionsForDay = useCallback((allSessions, dayIndex) => {
    if (!currentPlan) return [];
    return getSessionsForPlanDay(allSessions, currentPlan.planId, dayIndex);
  }, [currentPlan]);

  /**
   * Check if a specific day has completed sessions
   * @param {Array} allSessions - Array of all sessions
   * @param {number} dayIndex - Day index
   */
  const hasDayCompleted = useCallback((allSessions, dayIndex) => {
    const sessions = getSessionsForDay(allSessions, dayIndex);
    return sessions.length > 0;
  }, [getSessionsForDay]);

  /**
   * Get plan context for the current state
   * Useful for passing to workout/session screens
   */
  const getPlanContext = useCallback(() => {
    return {
      planId: currentPlan?.planId || null,
      planDay: selectedPlanDay?.dayIndex ?? null,
      hasPlan: !!currentPlan,
      hasSelectedDay: !!selectedPlanDay
    };
  }, [currentPlan, selectedPlanDay]);

  return {
    // State
    currentPlan,
    selectedPlanDay,
    loading,
    
    // Plan queries
    getTodaysWorkout,
    getPlanDay,
    getUpcomingWorkouts,
    
    // Plan mutations
    updatePlan,
    selectDay,
    clearSelectedDay,
    
    // Navigation helpers
    createWorkoutNavState,
    
    // Session linking
    linkSession,
    getSessionsForDay,
    hasDayCompleted,
    
    // Context
    getPlanContext
  };
};

export default usePlanIntegration;
