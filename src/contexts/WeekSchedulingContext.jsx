import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import { useAuth } from './AuthContext';
import { saveUserDataToFirebase, loadUserDataFromFirebase } from '../utils/firebaseStorage';
import { startOfWeek, isAfter } from 'date-fns';

const WeekSchedulingContext = createContext({});

// Week 0 constants: Days of week when first session creates Week 0
const WEDNESDAY_DAY_INDEX = 3;
const SATURDAY_DAY_INDEX = 6;

// eslint-disable-next-line react-refresh/only-export-components
export const useWeekScheduling = () => {
  return useContext(WeekSchedulingContext);
};

const DEFAULT_STATE = {
  currentWeek: 1,
  cycleStartDate: null, // Will be set to most recent Sunday
  deloadWeekActive: false,
  isWeekZero: false, // True if user started mid-week (Wed-Sat) and hasn't reached first Sunday yet
  weekZeroStartDate: null, // Date of first session if it created Week 0
  weeklySchedule: {
    Monday: null,
    Tuesday: null,
    Wednesday: null,
    Thursday: null,
    Friday: null,
    Saturday: null,
    Sunday: null,
  },
  favorites: [], // Array of favorite workouts
};

export const WeekSchedulingProvider = ({ children }) => {
  const { currentUser, isGuest } = useAuth();
  const [weekState, setWeekState] = useState(DEFAULT_STATE);
  const [loading, setLoading] = useState(true);

  // Get the most recent Sunday at midnight
  const getMostRecentSunday = useCallback(() => {
    const now = new Date();
    const sunday = startOfWeek(now, { weekStartsOn: 0 }); // 0 = Sunday
    sunday.setHours(0, 0, 0, 0);
    return sunday.toISOString();
  }, []);

  /**
   * Check if a session date falls in the Week 0 period (Wed-Sat before first Sunday)
   * Week 0: If user's first session occurs on Wed, Thu, Fri, or Sat, that partial period
   * is designated as Week 0. Week 1 starts on the next Sunday.
   * 
   * @param {string} sessionDate - ISO date string of the session
   * @param {string} firstSessionDate - ISO date string of the very first session
   * @returns {boolean} True if this session is in Week 0
   */
  const isSessionInWeekZero = useCallback((sessionDate, firstSessionDate) => {
    if (!firstSessionDate || !sessionDate) return false;
    
    const session = new Date(sessionDate);
    const firstSession = new Date(firstSessionDate);
    
    session.setHours(0, 0, 0, 0);
    firstSession.setHours(0, 0, 0, 0);
    
    // Check if first session was on Wed-Sat (days 3-6)
    const firstSessionDay = firstSession.getDay();
    if (firstSessionDay < WEDNESDAY_DAY_INDEX) {
      // First session was Sun-Tue, no Week 0
      return false;
    }
    
    // Get the Sunday after the first session (start of Week 1)
    const firstSunday = new Date(firstSession);
    const daysUntilSunday = 7 - firstSessionDay; // Days until next Sunday
    firstSunday.setDate(firstSunday.getDate() + daysUntilSunday);
    firstSunday.setHours(0, 0, 0, 0);
    
    // Session is in Week 0 if it's on or after first session but before first Sunday
    return session >= firstSession && session < firstSunday;
  }, []);

  /**
   * Initialize Week 0 state based on first session date
   * Should be called when detecting the first-ever session
   * 
   * @param {string} firstSessionDate - ISO date string of first session
   * @returns {Object} Updated state with Week 0 info if applicable
   */
  const initializeWeekZeroIfNeeded = useCallback((firstSessionDate) => {
    const firstSession = new Date(firstSessionDate);
    firstSession.setHours(0, 0, 0, 0);
    
    const firstSessionDay = firstSession.getDay(); // 0=Sun, 6=Sat
    
    // If first session is Wed-Sat (days 3-6), it's Week 0
    if (firstSessionDay >= WEDNESDAY_DAY_INDEX && firstSessionDay <= SATURDAY_DAY_INDEX) {
      // Calculate when Week 1 starts (next Sunday)
      const daysUntilSunday = 7 - firstSessionDay;
      const week1Start = new Date(firstSession);
      week1Start.setDate(week1Start.getDate() + daysUntilSunday);
      week1Start.setHours(0, 0, 0, 0);
      
      return {
        currentWeek: 0,
        isWeekZero: true,
        weekZeroStartDate: firstSessionDate,
        cycleStartDate: week1Start.toISOString(), // Week 1 starts on next Sunday
      };
    }
    
    // First session is Sun-Tue, no Week 0 needed
    // Start Week 1 from most recent Sunday before/on the first session
    const sunday = startOfWeek(firstSession, { weekStartsOn: 0 });
    sunday.setHours(0, 0, 0, 0);
    
    return {
      currentWeek: 1,
      isWeekZero: false,
      weekZeroStartDate: null,
      cycleStartDate: sunday.toISOString(),
    };
  }, []);

  // Calculate current week number based on cycle start date
  const calculateCurrentWeek = useCallback((cycleStartDate, isWeekZero, weekZeroStartDate) => {
    if (!cycleStartDate) return 1;
    
    // If we're still in Week 0 period
    if (isWeekZero && weekZeroStartDate) {
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      const cycleStart = new Date(cycleStartDate); // This is the Week 1 start date
      cycleStart.setHours(0, 0, 0, 0);
      
      // If we haven't reached Week 1 start date yet, we're still in Week 0
      if (now < cycleStart) {
        return 0;
      }
    }
    
    const startDate = new Date(cycleStartDate);
    const mostRecentSunday = new Date(getMostRecentSunday());
    
    // Calculate weeks elapsed since Week 1 started
    const weeksElapsed = Math.floor((mostRecentSunday - startDate) / (7 * 24 * 60 * 60 * 1000));
    return weeksElapsed + 1;
  }, [getMostRecentSunday]);

  /**
   * Check if week needs to increment
   * Handles transition from Week 0 to Week 1 and normal week increments
   * 
   * @param {Object} currentState - Current week state
   * @returns {Object} { updated: boolean, wasDeloadActive: boolean, transitionedFromWeekZero?: boolean }
   */
  const checkAndIncrementWeek = useCallback(async (currentState) => {
    const mostRecentSunday = getMostRecentSunday();
    
    // If we're in Week 0 and have passed the Week 1 start date, transition to Week 1
    if (currentState.isWeekZero && currentState.cycleStartDate) {
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      const week1Start = new Date(currentState.cycleStartDate);
      week1Start.setHours(0, 0, 0, 0);
      
      if (now >= week1Start) {
        // Transition from Week 0 to Week 1
        const updatedState = {
          ...currentState,
          currentWeek: 1,
          isWeekZero: false,
        };
        
        setWeekState(updatedState);
        await saveWeekState(updatedState);
        
        return { updated: true, wasDeloadActive: false, transitionedFromWeekZero: true };
      }
    }
    
    // If we've passed a Sunday boundary, recalculate week
    if (currentState.cycleStartDate && isAfter(new Date(mostRecentSunday), new Date(currentState.cycleStartDate))) {
      const newWeek = calculateCurrentWeek(currentState.cycleStartDate, currentState.isWeekZero, currentState.weekZeroStartDate);
      
      if (newWeek !== currentState.currentWeek) {
        // Week has incremented, check if we're ending a deload week
        const wasDeloadActive = currentState.deloadWeekActive;
        const updatedState = {
          ...currentState,
          currentWeek: newWeek,
          deloadWeekActive: false, // Always turn off deload when week increments
        };
        
        setWeekState(updatedState);
        await saveWeekState(updatedState);
        
        return { updated: true, wasDeloadActive };
      }
    }
    
    return { updated: false, wasDeloadActive: false };
  }, [getMostRecentSunday, calculateCurrentWeek, saveWeekState]);

  // Load week state from storage
  useEffect(() => {
    const loadWeekState = async () => {
      setLoading(true);
      try {
        let stored = null;
        
        if (currentUser && !isGuest) {
          // Load from Firebase
          const userData = await loadUserDataFromFirebase(currentUser.uid);
          stored = userData?.weekScheduling;
        } else {
          // Load from localStorage
          const localData = localStorage.getItem('goodlift_week_scheduling');
          if (localData) {
            stored = JSON.parse(localData);
          }
        }
        
        if (stored) {
          // Merge with defaults to ensure all fields exist
          const mergedState = {
            ...DEFAULT_STATE,
            ...stored,
            weeklySchedule: {
              ...DEFAULT_STATE.weeklySchedule,
              ...(stored.weeklySchedule || {}),
            },
          };
          
          setWeekState(mergedState);
          
          // Check if week needs to increment
          await checkAndIncrementWeek(mergedState);
        } else {
          // Initialize with default state
          const initialState = {
            ...DEFAULT_STATE,
            cycleStartDate: getMostRecentSunday(),
          };
          setWeekState(initialState);
          await saveWeekState(initialState);
        }
      } catch (error) {
        console.error('Error loading week state:', error);
        const initialState = {
          ...DEFAULT_STATE,
          cycleStartDate: getMostRecentSunday(),
        };
        setWeekState(initialState);
      } finally {
        setLoading(false);
      }
    };

    if (currentUser !== undefined) {
      loadWeekState();
    }
  }, [currentUser, isGuest, getMostRecentSunday, checkAndIncrementWeek, saveWeekState]);

  // Save week state
  const saveWeekState = useCallback(async (state) => {
    try {
      if (currentUser && !isGuest) {
        // Save to Firebase
        await saveUserDataToFirebase(currentUser.uid, { weekScheduling: state });
      } else {
        // Save to localStorage
        localStorage.setItem('goodlift_week_scheduling', JSON.stringify(state));
      }
    } catch (error) {
      console.error('Error saving week state:', error);
      throw error;
    }
  }, [currentUser, isGuest]);

  // Reset week cycle (manual reset from settings)
  const resetWeekCycle = useCallback(async () => {
    const resetState = {
      ...weekState,
      currentWeek: 1,
      cycleStartDate: getMostRecentSunday(),
      deloadWeekActive: false,
      isWeekZero: false, // Clear Week 0 state on reset
      weekZeroStartDate: null,
    };
    
    setWeekState(resetState);
    await saveWeekState(resetState);
    
    return resetState;
  }, [weekState, getMostRecentSunday, saveWeekState]);

  // Trigger deload week (only available from week 4+)
  const triggerDeloadWeek = useCallback(async () => {
    if (weekState.currentWeek < 4) {
      throw new Error('Deload week only available from week 4 onwards');
    }
    
    const updatedState = {
      ...weekState,
      deloadWeekActive: true,
      // Clear weekly schedule when deload week is initiated
      weeklySchedule: {
        Monday: null,
        Tuesday: null,
        Wednesday: null,
        Thursday: null,
        Friday: null,
        Saturday: null,
        Sunday: null,
      },
    };
    
    setWeekState(updatedState);
    await saveWeekState(updatedState);
    
    return updatedState;
  }, [weekState, saveWeekState]);

  // Check if current week should auto-assign workouts
  const isAutoAssignWeek = useCallback(() => {
    // Week 1 only (NOT Week 0 - Week 0 sessions should not trigger auto-assignment)
    return weekState.currentWeek === 1 && !weekState.isWeekZero;
  }, [weekState.currentWeek, weekState.isWeekZero]);

  // Assign workout to a day of the week
  const assignWorkoutToDay = useCallback(async (dayOfWeek, sessionData) => {
    const updatedSchedule = {
      ...weekState.weeklySchedule,
      [dayOfWeek]: sessionData,
    };
    
    const updatedState = {
      ...weekState,
      weeklySchedule: updatedSchedule,
    };
    
    setWeekState(updatedState);
    await saveWeekState(updatedState);
    
    return updatedState;
  }, [weekState, saveWeekState]);

  // Add workout to favorites
  const addToFavorites = useCallback(async (workout) => {
    const workoutWithId = {
      ...workout,
      id: `fav_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      addedAt: new Date().toISOString(),
    };
    
    const updatedFavorites = [...weekState.favorites, workoutWithId];
    
    const updatedState = {
      ...weekState,
      favorites: updatedFavorites,
    };
    
    setWeekState(updatedState);
    await saveWeekState(updatedState);
    
    return workoutWithId;
  }, [weekState, saveWeekState]);

  // Remove workout from favorites
  const removeFromFavorites = useCallback(async (favoriteId) => {
    const updatedFavorites = weekState.favorites.filter(fav => fav.id !== favoriteId);
    
    const updatedState = {
      ...weekState,
      favorites: updatedFavorites,
    };
    
    setWeekState(updatedState);
    await saveWeekState(updatedState);
    
    return updatedState;
  }, [weekState, saveWeekState]);

  // Get workout suggestion for a day (from previous week same day)
  const getWorkoutSuggestion = useCallback((dayOfWeek, workoutHistory = []) => {
    if (!workoutHistory || workoutHistory.length === 0) return null;
    
    // Find workouts from 7 days ago
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() - 7);
    
    // Get day of week (0 = Sunday, 1 = Monday, etc.)
    const dayMap = {
      'Sunday': 0,
      'Monday': 1,
      'Tuesday': 2,
      'Wednesday': 3,
      'Thursday': 4,
      'Friday': 5,
      'Saturday': 6,
    };
    
    const targetDayOfWeek = dayMap[dayOfWeek];
    
    // Find matching workouts from previous week
    const suggestions = workoutHistory.filter(workout => {
      const workoutDate = new Date(workout.date);
      return workoutDate.getDay() === targetDayOfWeek &&
             workoutDate >= new Date(targetDate.getTime() - 7 * 24 * 60 * 60 * 1000) &&
             workoutDate < targetDate;
    });
    
    // Return most recent match
    return suggestions.length > 0 ? suggestions[suggestions.length - 1] : null;
  }, []);

  const value = {
    weekState,
    loading,
    currentWeek: weekState.currentWeek,
    cycleStartDate: weekState.cycleStartDate,
    deloadWeekActive: weekState.deloadWeekActive,
    isWeekZero: weekState.isWeekZero,
    weekZeroStartDate: weekState.weekZeroStartDate,
    weeklySchedule: weekState.weeklySchedule,
    favorites: weekState.favorites,
    resetWeekCycle,
    triggerDeloadWeek,
    isAutoAssignWeek,
    assignWorkoutToDay,
    addToFavorites,
    removeFromFavorites,
    getWorkoutSuggestion,
    checkAndIncrementWeek: () => checkAndIncrementWeek(weekState),
    isSessionInWeekZero,
    initializeWeekZeroIfNeeded,
  };

  return (
    <WeekSchedulingContext.Provider value={value}>
      {children}
    </WeekSchedulingContext.Provider>
  );
};

WeekSchedulingProvider.propTypes = {
  children: PropTypes.node.isRequired,
};
