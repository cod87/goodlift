/**
 * useSessionPersistence Hook
 * 
 * Manages session state persistence for PWA background/foreground transitions.
 * Saves session state to localStorage when the app is minimized and restores
 * it when the app is reopened, preventing session interruptions.
 */

import { useEffect, useCallback, useRef } from 'react';

// Storage key for active session state
const SESSION_STATE_KEY = 'goodlift_active_session';
const SESSION_EXPIRY_MS = 4 * 60 * 60 * 1000; // 4 hours - expire stale sessions
// Delay before clearing session to allow completion handlers to finish saving
const SESSION_CLEAR_DELAY_MS = 500;

/**
 * Session types that can be persisted
 */
export const SessionTypes = {
  WORKOUT: 'workout',
  HIIT: 'hiit',
  YOGA: 'yoga',
  CARDIO: 'cardio',
  MOBILITY: 'mobility',
};

/**
 * Save session state to localStorage
 * @param {Object} sessionState - Current session state to persist
 */
export const saveSessionState = (sessionState) => {
  if (!sessionState) return;
  
  try {
    const stateToSave = {
      ...sessionState,
      timestamp: Date.now(),
    };
    localStorage.setItem(SESSION_STATE_KEY, JSON.stringify(stateToSave));
  } catch (error) {
    console.error('[SessionPersistence] Error saving session state:', error);
  }
};

/**
 * Load session state from localStorage
 * @returns {Object|null} Saved session state or null if none exists/expired
 */
export const loadSessionState = () => {
  try {
    const savedState = localStorage.getItem(SESSION_STATE_KEY);
    if (!savedState) return null;
    
    const parsedState = JSON.parse(savedState);
    
    // Check if session has expired
    if (parsedState.timestamp && (Date.now() - parsedState.timestamp) > SESSION_EXPIRY_MS) {
      clearSessionState();
      return null;
    }
    
    return parsedState;
  } catch (error) {
    console.error('[SessionPersistence] Error loading session state:', error);
    return null;
  }
};

/**
 * Clear session state from localStorage
 */
export const clearSessionState = () => {
  try {
    localStorage.removeItem(SESSION_STATE_KEY);
  } catch (error) {
    console.error('[SessionPersistence] Error clearing session state:', error);
  }
};

/**
 * Check if there's an active session that can be restored
 * @returns {boolean} True if a valid session exists
 */
export const hasActiveSession = () => {
  const state = loadSessionState();
  return state !== null && state.isActive === true;
};

/**
 * Hook for managing session persistence with visibility change handling
 * @param {Object} options - Hook options
 * @param {string} options.sessionType - Type of session (from SessionTypes)
 * @param {Object} options.sessionState - Current session state to persist
 * @param {boolean} options.isActive - Whether the session is currently active
 * @param {Function} options.onRestore - Callback when session is restored
 * @param {Function} options.onStateChange - Callback when visibility changes
 */
export const useSessionPersistence = ({
  sessionType = SessionTypes.WORKOUT,
  sessionState = null,
  isActive = false,
  onRestore = null,
  onStateChange = null,
} = {}) => {
  const lastSaveTimeRef = useRef(0);
  const saveThrottleMs = 1000; // Throttle saves to once per second

  /**
   * Save current session state (throttled)
   */
  const saveState = useCallback(() => {
    if (!isActive || !sessionState) return;
    
    const now = Date.now();
    if (now - lastSaveTimeRef.current < saveThrottleMs) return;
    
    lastSaveTimeRef.current = now;
    
    saveSessionState({
      type: sessionType,
      state: sessionState,
      isActive,
    });
  }, [sessionType, sessionState, isActive]);

  /**
   * Handle visibility change - save when hidden, potentially restore when visible
   */
  const handleVisibilityChange = useCallback(() => {
    if (document.hidden) {
      // App is being minimized/backgrounded - save state immediately
      if (isActive && sessionState) {
        saveSessionState({
          type: sessionType,
          state: sessionState,
          isActive,
          pausedAt: Date.now(),
        });
        onStateChange?.('hidden');
      }
    } else {
      // App is returning to foreground
      onStateChange?.('visible');
      
      // Check if we need to restore a session
      const savedState = loadSessionState();
      if (savedState && savedState.isActive && onRestore) {
        onRestore(savedState);
      }
    }
  }, [sessionType, sessionState, isActive, onRestore, onStateChange]);

  /**
   * Handle page unload - save state before page closes
   */
  const handleBeforeUnload = useCallback(() => {
    if (isActive && sessionState) {
      saveSessionState({
        type: sessionType,
        state: sessionState,
        isActive,
        pausedAt: Date.now(),
      });
    }
  }, [sessionType, sessionState, isActive]);

  /**
   * Handle page show (for back/forward cache navigation)
   */
  const handlePageShow = useCallback((event) => {
    if (event.persisted) {
      // Page was restored from back/forward cache
      const savedState = loadSessionState();
      if (savedState && savedState.isActive && onRestore) {
        onRestore(savedState);
      }
    }
  }, [onRestore]);

  // Set up visibility change listeners
  useEffect(() => {
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('pageshow', handlePageShow);
    
    // PWA-specific: handle app switching on iOS
    window.addEventListener('pagehide', handleBeforeUnload);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('pageshow', handlePageShow);
      window.removeEventListener('pagehide', handleBeforeUnload);
    };
  }, [handleVisibilityChange, handleBeforeUnload, handlePageShow]);

  // Periodically save state while session is active (as backup)
  useEffect(() => {
    if (!isActive) return;
    
    const intervalId = setInterval(() => {
      saveState();
    }, 5000); // Save every 5 seconds as backup
    
    return () => clearInterval(intervalId);
  }, [isActive, saveState]);

  // Save state whenever it changes
  useEffect(() => {
    if (isActive && sessionState) {
      saveState();
    }
  }, [isActive, sessionState, saveState]);

  // Clear state when session ends
  useEffect(() => {
    if (!isActive) {
      // Allow final state saves before clearing (e.g., for completion handlers)
      const timeoutId = setTimeout(() => {
        clearSessionState();
      }, SESSION_CLEAR_DELAY_MS);
      return () => clearTimeout(timeoutId);
    }
  }, [isActive]);

  return {
    saveState,
    clearState: clearSessionState,
    loadState: loadSessionState,
    hasActiveSession,
  };
};

export default useSessionPersistence;
