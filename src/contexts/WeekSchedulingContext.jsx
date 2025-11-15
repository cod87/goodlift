import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import { useAuth } from './AuthContext';
import { saveUserDataToFirebase, loadUserDataFromFirebase } from '../utils/firebaseStorage';
import { startOfWeek, addWeeks, isAfter } from 'date-fns';

const WeekSchedulingContext = createContext({});

// eslint-disable-next-line react-refresh/only-export-components
export const useWeekScheduling = () => {
  return useContext(WeekSchedulingContext);
};

const DEFAULT_STATE = {
  currentWeek: 1,
  cycleStartDate: null, // Will be set to most recent Sunday
  deloadWeekActive: false,
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

  // Calculate current week number based on cycle start date
  const calculateCurrentWeek = useCallback((cycleStartDate) => {
    if (!cycleStartDate) return 1;
    
    const startDate = new Date(cycleStartDate);
    const now = new Date();
    const mostRecentSunday = new Date(getMostRecentSunday());
    
    // Calculate weeks elapsed
    const weeksElapsed = Math.floor((mostRecentSunday - startDate) / (7 * 24 * 60 * 60 * 1000));
    return weeksElapsed + 1;
  }, [getMostRecentSunday]);

  // Check if week needs to increment
  const checkAndIncrementWeek = useCallback(async (currentState) => {
    const mostRecentSunday = getMostRecentSunday();
    
    // If we've passed a Sunday boundary, recalculate week
    if (currentState.cycleStartDate && isAfter(new Date(mostRecentSunday), new Date(currentState.cycleStartDate))) {
      const newWeek = calculateCurrentWeek(currentState.cycleStartDate);
      
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
  }, [getMostRecentSunday, calculateCurrentWeek]);

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
  }, [currentUser, isGuest, getMostRecentSunday, checkAndIncrementWeek]);

  // Save week state
  const saveWeekState = async (state) => {
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
  };

  // Reset week cycle (manual reset from settings)
  const resetWeekCycle = useCallback(async () => {
    const resetState = {
      ...weekState,
      currentWeek: 1,
      cycleStartDate: getMostRecentSunday(),
      deloadWeekActive: false,
    };
    
    setWeekState(resetState);
    await saveWeekState(resetState);
    
    return resetState;
  }, [weekState, getMostRecentSunday]);

  // Trigger deload week (only available from week 4+)
  const triggerDeloadWeek = useCallback(async () => {
    if (weekState.currentWeek < 4) {
      throw new Error('Deload week only available from week 4 onwards');
    }
    
    const updatedState = {
      ...weekState,
      deloadWeekActive: true,
    };
    
    setWeekState(updatedState);
    await saveWeekState(updatedState);
    
    return updatedState;
  }, [weekState]);

  // Check if current week should auto-assign workouts
  const isAutoAssignWeek = useCallback(() => {
    // Week 1 or first week after deload
    return weekState.currentWeek === 1;
  }, [weekState.currentWeek]);

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
  }, [weekState]);

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
  }, [weekState]);

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
  }, [weekState]);

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
