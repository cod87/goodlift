import { useState, useEffect, useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import { Dialog, DialogContent, IconButton, Box, Tooltip, ToggleButtonGroup, ToggleButton, Typography, LinearProgress } from '@mui/material';
import { Maximize, Timer } from '@mui/icons-material';
import { MdScreenLockPortrait, MdScreenLockRotation } from 'react-icons/md';
import { motion, AnimatePresence } from 'framer-motion';
import WorkoutScreen from './WorkoutScreen';
import wakeLockManager from '../utils/wakeLock';
import { useSessionPersistence, SessionTypes, loadSessionState, clearSessionState } from '../hooks/useSessionPersistence';

/**
 * WorkoutScreenModal - Modal wrapper for WorkoutScreen component
 * Displays workout as a full-screen modal with minimize/restore functionality
 */
const WorkoutScreenModal = ({ 
  open, 
  workoutPlan, 
  onComplete, 
  onExit, 
  supersetConfig, 
  setsPerSuperset,
  deloadMode = false,
}) => {
  const [isMinimized, setIsMinimized] = useState(false);
  const [wakeLockActive, setWakeLockActive] = useState(wakeLockManager.isActive());
  const [wakeLockSupported] = useState(wakeLockManager.isWakeLockSupported());
  
  // Rest timer state
  const [restDuration, setRestDuration] = useState(0); // 0 (off), 60, or 90 seconds
  const [isResting, setIsResting] = useState(false);
  const [restTimeRemaining, setRestTimeRemaining] = useState(0);
  
  // Workout progress state (tracked for session persistence)
  const [workoutProgress, setWorkoutProgress] = useState({
    currentStepIndex: 0,
    workoutData: [],
    elapsedTime: 0,
    currentPhase: 'warmup', // 'warmup', 'exercise', 'cooldown', 'complete'
  });

  // Session state for persistence - memoized to prevent unnecessary saves
  const sessionState = useMemo(() => ({
    workoutPlan,
    supersetConfig,
    setsPerSuperset,
    restDuration,
    restTimeRemaining,
    isResting,
    progress: workoutProgress,
    isMinimized,
  }), [workoutPlan, supersetConfig, setsPerSuperset, restDuration, restTimeRemaining, isResting, workoutProgress, isMinimized]);

  // Handle session restore with validation
  const handleSessionRestore = useCallback((savedState) => {
    // Validate saved state structure before destructuring
    if (!savedState || typeof savedState !== 'object' || !savedState.state) {
      return;
    }
    
    const state = savedState.state;
    
    // Restore rest timer state if applicable (with type validation)
    if (typeof state.restDuration === 'number') {
      setRestDuration(state.restDuration);
    }
    if (state.isResting && typeof state.restTimeRemaining === 'number' && state.restTimeRemaining > 0) {
      setRestTimeRemaining(state.restTimeRemaining);
      setIsResting(true);
    }
    
    // Restore workout progress (with structure validation)
    if (state.progress && typeof state.progress === 'object') {
      setWorkoutProgress(prev => ({
        ...prev,
        ...state.progress,
      }));
    }
  }, []);

  // Use session persistence hook
  useSessionPersistence({
    sessionType: SessionTypes.WORKOUT,
    sessionState,
    isActive: open,
    onRestore: handleSessionRestore,
  });

  // Callback to update workout progress from WorkoutScreen
  const handleProgressUpdate = useCallback((progressData) => {
    setWorkoutProgress(prev => ({
      ...prev,
      ...progressData,
    }));
  }, []);

  // Clear session state when workout completes
  const handleWorkoutComplete = useCallback((workoutData) => {
    clearSessionState();
    onComplete(workoutData);
  }, [onComplete]);

  // Clear session state when user exits
  const handleWorkoutExit = useCallback(() => {
    clearSessionState();
    onExit();
  }, [onExit]);

  // Check for existing session on mount
  useEffect(() => {
    if (open) {
      const savedSession = loadSessionState();
      if (savedSession?.type === SessionTypes.WORKOUT && savedSession.isActive) {
        handleSessionRestore(savedSession);
      }
    }
  }, [open, handleSessionRestore]);

  useEffect(() => {
    // Setup visibility change handler for wake lock
    const cleanup = wakeLockManager.reacquireOnVisibilityChange();
    return () => {
      if (cleanup) cleanup.then(fn => fn && fn());
    };
  }, []);

  // Rest timer countdown effect
  useEffect(() => {
    let intervalId = null;
    
    if (isResting && restTimeRemaining > 0) {
      intervalId = setInterval(() => {
        setRestTimeRemaining(prev => {
          if (prev <= 1) {
            setIsResting(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isResting, restTimeRemaining]);

  // Callback to start rest timer (called from WorkoutScreen)
  const handleStartRestTimer = useCallback(() => {
    // Only start rest timer if duration is not 0 (off)
    if (restDuration > 0) {
      setRestTimeRemaining(restDuration);
      setIsResting(true);
    }
  }, [restDuration]);

  // Skip rest timer
  const handleSkipRest = useCallback(() => {
    setIsResting(false);
    setRestTimeRemaining(0);
  }, []);

  const handleRestore = () => {
    setIsMinimized(false);
  };

  const handleToggleWakeLock = async () => {
    if (wakeLockActive) {
      await wakeLockManager.releaseWakeLock();
      setWakeLockActive(false);
    } else {
      const success = await wakeLockManager.requestWakeLock();
      setWakeLockActive(success);
    }
  };

  const handleRestDurationChange = (event, newDuration) => {
    if (newDuration !== null) {
      setRestDuration(newDuration);
    }
  };

  // Format seconds to mm:ss
  const formatRestTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <>
      {/* Minimized floating button */}
      <AnimatePresence>
        {isMinimized && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 50 }}
            style={{
              position: 'fixed',
              bottom: '80px',
              right: '20px',
              zIndex: 1400,
            }}
          >
            <IconButton
              onClick={handleRestore}
              sx={{
                bgcolor: 'primary.main',
                color: 'white',
                width: 56,
                height: 56,
                boxShadow: 3,
                '&:hover': {
                  bgcolor: 'primary.dark',
                  transform: 'scale(1.1)',
                },
                transition: 'all 0.2s ease',
              }}
              aria-label="Restore workout"
            >
              <Maximize />
            </IconButton>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Full modal */}
      <Dialog
        open={open && !isMinimized}
        fullScreen
        PaperProps={{
          sx: {
            bgcolor: 'background.default',
            backgroundImage: 'none',
          }
        }}
      >
        {/* Modal header with rest timer toggle and wake screen button */}
        <Box
          sx={{
            position: 'relative',
            top: 0,
            zIndex: 1100,
            bgcolor: 'background.paper',
            borderBottom: '1px solid',
            borderColor: 'divider',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            py: 1,
            px: 1,
            gap: 1,
            minHeight: '56px',
          }}
        >
          {/* Rest timer toggle in center */}
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 1,
          }}>
            <Timer sx={{ fontSize: 18, color: 'text.secondary' }} />
            <ToggleButtonGroup
              value={restDuration}
              exclusive
              onChange={handleRestDurationChange}
              size="small"
              aria-label="rest timer duration"
            >
              <ToggleButton 
                value={0} 
                aria-label="rest timer off"
                sx={{ 
                  py: 0.5, 
                  px: 1.5,
                  fontSize: '0.8rem',
                  fontWeight: 600,
                }}
              >
                Off
              </ToggleButton>
              <ToggleButton 
                value={60} 
                aria-label="60 seconds rest"
                sx={{ 
                  py: 0.5, 
                  px: 1.5,
                  fontSize: '0.8rem',
                  fontWeight: 600,
                }}
              >
                60s
              </ToggleButton>
              <ToggleButton 
                value={90} 
                aria-label="90 seconds rest"
                sx={{ 
                  py: 0.5, 
                  px: 1.5,
                  fontSize: '0.8rem',
                  fontWeight: 600,
                }}
              >
                90s
              </ToggleButton>
            </ToggleButtonGroup>
          </Box>
          
          {/* Wake lock button on the right */}
          {wakeLockSupported && (
            <Box sx={{ 
              position: 'absolute',
              right: '8px',
            }}>
              <Tooltip title={wakeLockActive ? 'Screen kept awake' : 'Allow screen sleep'}>
                <IconButton
                  onClick={handleToggleWakeLock}
                  size="small"
                  sx={{
                    color: wakeLockActive ? 'secondary.main' : 'text.secondary',
                    '&:hover': { 
                      bgcolor: wakeLockActive ? 'rgba(255, 140, 0, 0.08)' : 'action.hover' 
                    },
                  }}
                  aria-label={wakeLockActive ? 'Release wake lock' : 'Keep screen awake'}
                >
                  {wakeLockActive ? <MdScreenLockRotation size={20} /> : <MdScreenLockPortrait size={20} />}
                </IconButton>
              </Tooltip>
            </Box>
          )}
        </Box>

        {/* Rest Timer Overlay */}
        <AnimatePresence>
          {isResting && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.85)',
                zIndex: 1200,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '2rem',
              }}
            >
              <Typography variant="h6" sx={{ color: 'white', mb: 2, opacity: 0.8 }}>
                Rest Time
              </Typography>
              <Typography 
                variant="h1" 
                sx={{ 
                  color: 'white', 
                  fontWeight: 700, 
                  fontSize: { xs: '5rem', sm: '7rem' },
                  mb: 3,
                }}
              >
                {formatRestTime(restTimeRemaining)}
              </Typography>
              <Box sx={{ width: '80%', maxWidth: 400, mb: 4 }}>
                <LinearProgress 
                  variant="determinate" 
                  value={(1 - restTimeRemaining / restDuration) * 100}
                  sx={{ 
                    height: 8, 
                    borderRadius: 4,
                    bgcolor: 'rgba(255, 255, 255, 0.2)',
                    '& .MuiLinearProgress-bar': {
                      bgcolor: 'primary.main',
                      borderRadius: 4,
                    }
                  }}
                />
              </Box>
              <motion.button
                onClick={handleSkipRest}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                style={{
                  padding: '12px 32px',
                  fontSize: '1rem',
                  fontWeight: 600,
                  color: 'white',
                  backgroundColor: 'transparent',
                  border: '2px solid white',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  opacity: 0.8,
                }}
              >
                Skip Rest
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>

        <DialogContent sx={{ 
          p: 0, 
          overflow: 'auto',
          WebkitOverflowScrolling: 'touch',
          maxHeight: '100vh',
        }}>
          <WorkoutScreen
            workoutPlan={workoutPlan}
            onComplete={handleWorkoutComplete}
            onExit={handleWorkoutExit}
            supersetConfig={supersetConfig}
            setsPerSuperset={setsPerSuperset}
            onSetComplete={handleStartRestTimer}
            onProgressUpdate={handleProgressUpdate}
            initialProgress={workoutProgress}
            deloadMode={deloadMode}
          />
        </DialogContent>
      </Dialog>
    </>
  );
};

WorkoutScreenModal.propTypes = {
  open: PropTypes.bool.isRequired,
  workoutPlan: PropTypes.array.isRequired,
  onComplete: PropTypes.func.isRequired,
  onExit: PropTypes.func.isRequired,
  supersetConfig: PropTypes.arrayOf(PropTypes.number),
  setsPerSuperset: PropTypes.number,
  deloadMode: PropTypes.bool,
};

export default WorkoutScreenModal;
