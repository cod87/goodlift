import { useState, useCallback, useRef } from 'react';
import PropTypes from 'prop-types';
import WorkoutScreen from './WorkoutScreen';
import { useSessionModal } from '../contexts/SessionModalContext';

/**
 * WorkoutSessionWrapper - Manages workout session state and provides
 * data to the minimized bar when the modal is minimized
 */
const WorkoutSessionWrapper = ({ 
  workoutPlan, 
  onComplete, 
  onExit, 
  supersetConfig, 
  setsPerSuperset 
}) => {
  const { updateSessionData, closeSession } = useSessionModal();
  const [workoutState, setWorkoutState] = useState({
    timeDisplay: '0:00',
    progress: 0,
    statusText: 'Starting workout...',
  });

  // Ref to store handlers from the workout screen
  const handlersRef = useRef({
    exit: null,
  });

  // Register handlers from the workout screen
  const registerHandlers = useCallback((handlers) => {
    handlersRef.current = handlers;
  }, []);

  // Update workout state for minimized bar
  const updateWorkoutState = useCallback((state) => {
    setWorkoutState(prev => ({ ...prev, ...state }));
    updateSessionData({
      timeDisplay: state.timeDisplay || prev.timeDisplay,
      progress: state.progress ?? prev.progress,
      statusText: state.statusText || prev.statusText,
    });
  }, [updateSessionData]);

  const handleStop = useCallback(() => {
    if (handlersRef.current.exit) {
      handlersRef.current.exit();
    } else if (onExit) {
      onExit();
    }
  }, [onExit]);

  const handleComplete = useCallback((data) => {
    closeSession();
    if (onComplete) {
      onComplete(data);
    }
  }, [closeSession, onComplete]);

  const handleExit = useCallback(() => {
    closeSession();
    if (onExit) {
      onExit();
    }
  }, [closeSession, onExit]);

  return (
    <WorkoutScreen
      workoutPlan={workoutPlan}
      onComplete={handleComplete}
      onExit={handleExit}
      supersetConfig={supersetConfig}
      setsPerSuperset={setsPerSuperset}
      updateWorkoutState={updateWorkoutState}
      registerHandlers={registerHandlers}
      getStopHandler={() => handleStop}
    />
  );
};

WorkoutSessionWrapper.propTypes = {
  workoutPlan: PropTypes.array.isRequired,
  onComplete: PropTypes.func.isRequired,
  onExit: PropTypes.func.isRequired,
  supersetConfig: PropTypes.arrayOf(PropTypes.number),
  setsPerSuperset: PropTypes.number,
};

export default WorkoutSessionWrapper;
