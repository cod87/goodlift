import { useState, useCallback, useRef } from 'react';
import PropTypes from 'prop-types';
import UnifiedTimerScreen from '../pages/UnifiedTimerScreen';
import { useSessionModal } from '../contexts/SessionModalContext';

/**
 * UnifiedTimerSessionWrapper - Manages timer session state and provides
 * data to the minimized bar when the modal is minimized
 */
const UnifiedTimerSessionWrapper = ({ onNavigate }) => {
  const { updateSessionData, closeSession } = useSessionModal();
  const [timerState, setTimerState] = useState({
    timeDisplay: '0:00',
    progress: 0,
    isPaused: false,
    statusText: '',
    mode: 'cardio',
  });

  // Ref to store pause/stop handlers from the timer screen
  const handlersRef = useRef({
    pause: null,
    stop: null,
  });

  // Register handlers from the timer screen
  const registerHandlers = useCallback((handlers) => {
    handlersRef.current = handlers;
  }, []);

  // Update timer state for minimized bar
  const updateTimerState = useCallback((state) => {
    setTimerState(prev => ({ ...prev, ...state }));
    updateSessionData({
      timeDisplay: state.timeDisplay || prev.timeDisplay,
      progress: state.progress ?? prev.progress,
      isPaused: state.isPaused ?? prev.isPaused,
      statusText: state.statusText || prev.statusText,
      mode: state.mode || prev.mode,
    });
  }, [updateSessionData]);

  const handlePause = useCallback(() => {
    if (handlersRef.current.pause) {
      handlersRef.current.pause();
    }
  }, []);

  const handleStop = useCallback(() => {
    if (handlersRef.current.stop) {
      handlersRef.current.stop();
    }
  }, []);

  const handleComplete = useCallback(() => {
    closeSession();
    if (onNavigate) {
      onNavigate('home');
    }
  }, [closeSession, onNavigate]);

  return (
    <UnifiedTimerScreen
      onNavigate={onNavigate}
      hideBackButton={true}
      updateTimerState={updateTimerState}
      registerHandlers={registerHandlers}
      onComplete={handleComplete}
      getPauseHandler={() => handlePause}
      getStopHandler={() => handleStop}
    />
  );
};

UnifiedTimerSessionWrapper.propTypes = {
  onNavigate: PropTypes.func,
};

export default UnifiedTimerSessionWrapper;
