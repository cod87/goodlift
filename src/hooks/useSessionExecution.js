/**
 * useSessionExecution Hook
 * 
 * Manages timer state machine for HIIT and Yoga sessions
 * Provides unified timer logic, state transitions, and progress tracking
 */

import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Timer states for session execution
 */
export const TimerStates = {
  IDLE: 'idle',
  RUNNING: 'running',
  PAUSED: 'paused',
  COMPLETE: 'complete'
};

/**
 * Phase types for sessions
 */
export const PhaseTypes = {
  WARMUP: 'warmup',
  WORK: 'work',
  REST: 'rest',
  COOLDOWN: 'cooldown',
  TRANSITION: 'transition'
};

/**
 * useSessionExecution hook
 * @param {Object} config - Configuration object
 * @param {Array} config.exercises - Array of exercises/poses
 * @param {number} config.rounds - Number of rounds (for HIIT)
 * @param {number} config.workTime - Work interval duration in seconds
 * @param {number} config.restTime - Rest interval duration in seconds
 * @param {Function} config.onComplete - Callback when session completes
 */
export const useSessionExecution = ({
  exercises = [],
  rounds = 1,
  workTime = 30,
  restTime = 15,
  onComplete = () => {}
} = {}) => {
  const [timerState, setTimerState] = useState(TimerStates.IDLE);
  const [currentPhase, setCurrentPhase] = useState(PhaseTypes.WARMUP);
  const [currentRound, setCurrentRound] = useState(0);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [totalElapsedTime, setTotalElapsedTime] = useState(0);
  
  const intervalRef = useRef(null);
  const startTimeRef = useRef(null);

  /**
   * Get current exercise/pose
   */
  const getCurrentExercise = useCallback(() => {
    if (!exercises || exercises.length === 0) return null;
    return exercises[currentExerciseIndex];
  }, [exercises, currentExerciseIndex]);

  /**
   * Calculate total progress percentage
   */
  const getProgress = useCallback(() => {
    if (!exercises || exercises.length === 0) return 0;
    
    const totalExercises = exercises.length * rounds;
    const completedExercises = (currentRound * exercises.length) + currentExerciseIndex;
    
    return Math.min(100, (completedExercises / totalExercises) * 100);
  }, [exercises, rounds, currentRound, currentExerciseIndex]);

  /**
   * Start or resume the timer
   */
  const start = useCallback(() => {
    setTimerState(TimerStates.RUNNING);
    if (currentPhase === PhaseTypes.WARMUP && timeRemaining === 0) {
      // Initialize first work interval
      setCurrentPhase(PhaseTypes.WORK);
      setTimeRemaining(workTime);
    }
    startTimeRef.current = Date.now();
  }, [currentPhase, timeRemaining, workTime]);

  /**
   * Pause the timer
   */
  const pause = useCallback(() => {
    setTimerState(TimerStates.PAUSED);
  }, []);

  /**
   * Resume from pause
   */
  const resume = useCallback(() => {
    setTimerState(TimerStates.RUNNING);
    startTimeRef.current = Date.now();
  }, []);

  /**
   * Stop the session
   */
  const stop = useCallback(() => {
    setTimerState(TimerStates.IDLE);
    setCurrentPhase(PhaseTypes.WARMUP);
    setCurrentRound(0);
    setCurrentExerciseIndex(0);
    setTimeRemaining(0);
    setTotalElapsedTime(0);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  }, []);

  /**
   * Skip to next exercise
   */
  const skipToNext = useCallback(() => {
    if (currentExerciseIndex < exercises.length - 1) {
      setCurrentExerciseIndex(prev => prev + 1);
      setCurrentPhase(PhaseTypes.WORK);
      setTimeRemaining(workTime);
    } else if (currentRound < rounds - 1) {
      // Move to next round
      setCurrentRound(prev => prev + 1);
      setCurrentExerciseIndex(0);
      setCurrentPhase(PhaseTypes.WORK);
      setTimeRemaining(workTime);
    } else {
      // Session complete
      setTimerState(TimerStates.COMPLETE);
      setCurrentPhase(PhaseTypes.COMPLETE);
      onComplete();
    }
  }, [currentExerciseIndex, currentRound, exercises.length, rounds, workTime, onComplete]);

  /**
   * Skip to previous exercise
   */
  const skipToPrevious = useCallback(() => {
    if (currentExerciseIndex > 0) {
      setCurrentExerciseIndex(prev => prev - 1);
      setCurrentPhase(PhaseTypes.WORK);
      setTimeRemaining(workTime);
    } else if (currentRound > 0) {
      setCurrentRound(prev => prev - 1);
      setCurrentExerciseIndex(exercises.length - 1);
      setCurrentPhase(PhaseTypes.WORK);
      setTimeRemaining(workTime);
    }
  }, [currentExerciseIndex, currentRound, exercises.length, workTime]);

  /**
   * Handle timer tick and state transitions
   */
  useEffect(() => {
    if (timerState !== TimerStates.RUNNING) return;

    intervalRef.current = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          // Time's up for current phase
          if (currentPhase === PhaseTypes.WORK) {
            // Switch to rest
            setCurrentPhase(PhaseTypes.REST);
            return restTime;
          } else if (currentPhase === PhaseTypes.REST) {
            // Move to next exercise
            if (currentExerciseIndex < exercises.length - 1) {
              setCurrentExerciseIndex(prev => prev + 1);
              setCurrentPhase(PhaseTypes.WORK);
              return workTime;
            } else if (currentRound < rounds - 1) {
              // Move to next round
              setCurrentRound(prev => prev + 1);
              setCurrentExerciseIndex(0);
              setCurrentPhase(PhaseTypes.WORK);
              return workTime;
            } else {
              // Session complete
              setTimerState(TimerStates.COMPLETE);
              setCurrentPhase(PhaseTypes.COMPLETE);
              onComplete();
              return 0;
            }
          }
        }
        return prev - 1;
      });

      // Update total elapsed time
      setTotalElapsedTime(prev => prev + 1);
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [
    timerState, 
    currentPhase, 
    currentExerciseIndex, 
    currentRound, 
    exercises.length, 
    rounds, 
    workTime, 
    restTime, 
    onComplete
  ]);

  /**
   * Format time for display (MM:SS)
   */
  const formatTime = useCallback((seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, []);

  return {
    // State
    timerState,
    currentPhase,
    currentRound,
    currentExerciseIndex,
    timeRemaining,
    totalElapsedTime,
    
    // Computed
    currentExercise: getCurrentExercise(),
    progress: getProgress(),
    isRunning: timerState === TimerStates.RUNNING,
    isPaused: timerState === TimerStates.PAUSED,
    isComplete: timerState === TimerStates.COMPLETE,
    
    // Controls
    start,
    pause,
    resume,
    stop,
    skipToNext,
    skipToPrevious,
    
    // Utilities
    formatTime
  };
};

export default useSessionExecution;
