import { createContext, useContext, useState, useCallback } from 'react';
import PropTypes from 'prop-types';

/**
 * SessionModalContext - Manages the state of workout/timer sessions
 * 
 * This context provides:
 * - Modal open/close state
 * - Minimized state
 * - Session type (workout, hiit, yoga, cardio)
 * - Session data and configuration
 * - Callbacks for modal actions
 */

const SessionModalContext = createContext(null);

export const useSessionModal = () => {
  const context = useContext(SessionModalContext);
  if (!context) {
    throw new Error('useSessionModal must be used within a SessionModalProvider');
  }
  return context;
};

export const SessionModalProvider = ({ children }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [sessionType, setSessionType] = useState(null); // 'workout', 'hiit', 'yoga', 'cardio'
  const [sessionData, setSessionData] = useState(null);

  const openSession = useCallback((type, data) => {
    setSessionType(type);
    setSessionData(data);
    setIsModalOpen(true);
    setIsMinimized(false);
  }, []);

  const closeSession = useCallback(() => {
    setIsModalOpen(false);
    setIsMinimized(false);
    setSessionType(null);
    setSessionData(null);
  }, []);

  const minimizeSession = useCallback(() => {
    setIsMinimized(true);
  }, []);

  const restoreSession = useCallback(() => {
    setIsMinimized(false);
  }, []);

  const updateSessionData = useCallback((data) => {
    setSessionData(data);
  }, []);

  const value = {
    isModalOpen,
    isMinimized,
    sessionType,
    sessionData,
    openSession,
    closeSession,
    minimizeSession,
    restoreSession,
    updateSessionData,
  };

  return (
    <SessionModalContext.Provider value={value}>
      {children}
    </SessionModalContext.Provider>
  );
};

SessionModalProvider.propTypes = {
  children: PropTypes.node.isRequired,
};
