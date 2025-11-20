import { useCallback } from 'react';
import PropTypes from 'prop-types';
import { AnimatePresence } from 'framer-motion';
import SessionModal from './SessionModal';
import MinimizedSessionBar from './MinimizedSessionBar';
import UnifiedTimerSessionWrapper from './UnifiedTimerSessionWrapper';
import WorkoutSessionWrapper from './WorkoutSessionWrapper';
import { useSessionModal } from '../contexts/SessionModalContext';

/**
 * SessionManager - Orchestrates session modal and minimized bar
 * 
 * Features:
 * - Renders appropriate session content based on sessionType
 * - Shows full-screen modal when session is active
 * - Shows minimized bar when session is minimized
 * - Handles transitions between states
 */
const SessionManager = ({ onNavigate }) => {
  const {
    isModalOpen,
    isMinimized,
    sessionType,
    sessionData,
    closeSession,
    minimizeSession,
    restoreSession,
  } = useSessionModal();

  const handleCloseWithConfirm = useCallback(() => {
    if (window.confirm('Are you sure you want to end this session? Your progress may not be saved.')) {
      closeSession();
      if (onNavigate) {
        onNavigate('home');
      }
    }
  }, [closeSession, onNavigate]);

  const handleMinimize = useCallback(() => {
    minimizeSession();
  }, [minimizeSession]);

  const handleRestore = useCallback(() => {
    restoreSession();
  }, [restoreSession]);

  // Get pause handler from session data if available
  const handlePause = useCallback(() => {
    if (sessionData?.onPause) {
      sessionData.onPause();
    }
  }, [sessionData]);

  // Get stop handler from session data if available
  const handleStop = useCallback(() => {
    if (sessionData?.onStop) {
      sessionData.onStop();
    } else {
      handleCloseWithConfirm();
    }
  }, [sessionData, handleCloseWithConfirm]);

  // Render session content based on type
  const renderSessionContent = () => {
    switch (sessionType) {
      case 'hiit':
      case 'yoga':
      case 'cardio':
        return <UnifiedTimerSessionWrapper onNavigate={onNavigate} />;
      
      case 'workout':
        return (
          <WorkoutSessionWrapper
            workoutPlan={sessionData?.workoutPlan || []}
            onComplete={sessionData?.onComplete}
            onExit={() => {
              closeSession();
              if (onNavigate) {
                onNavigate('home');
              }
            }}
            supersetConfig={sessionData?.supersetConfig}
            setsPerSuperset={sessionData?.setsPerSuperset}
          />
        );
      
      default:
        return null;
    }
  };

  return (
    <>
      {/* Full-screen Session Modal */}
      <SessionModal
        open={isModalOpen && !isMinimized}
        onClose={handleCloseWithConfirm}
        onMinimize={handleMinimize}
      >
        {renderSessionContent()}
      </SessionModal>

      {/* Minimized Session Bar */}
      <AnimatePresence>
        {isModalOpen && isMinimized && (
          <MinimizedSessionBar
            sessionType={sessionType}
            timeDisplay={sessionData?.timeDisplay}
            progress={sessionData?.progress}
            isPaused={sessionData?.isPaused}
            statusText={sessionData?.statusText}
            onRestore={handleRestore}
            onPause={sessionData?.onPause ? handlePause : undefined}
            onStop={handleStop}
          />
        )}
      </AnimatePresence>
    </>
  );
};

SessionManager.propTypes = {
  onNavigate: PropTypes.func,
};

export default SessionManager;
