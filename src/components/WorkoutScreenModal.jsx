import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Dialog, DialogContent, IconButton, Box, Tooltip, Chip } from '@mui/material';
import { Maximize } from '@mui/icons-material';
import { MdScreenLockPortrait, MdScreenLockRotation } from 'react-icons/md';
import { motion, AnimatePresence } from 'framer-motion';
import WorkoutScreen from './WorkoutScreen';
import wakeLockManager from '../utils/wakeLock';

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
  setsPerSuperset 
}) => {
  const [isMinimized, setIsMinimized] = useState(false);
  const [wakeLockActive, setWakeLockActive] = useState(wakeLockManager.isActive());
  const [wakeLockSupported] = useState(wakeLockManager.isWakeLockSupported());
  const [currentSetInfo, setCurrentSetInfo] = useState({ setNumber: 1, totalSets: setsPerSuperset });

  useEffect(() => {
    // Setup visibility change handler for wake lock
    const cleanup = wakeLockManager.reacquireOnVisibilityChange();
    return () => {
      if (cleanup) cleanup.then(fn => fn && fn());
    };
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

  // Callback to receive current set info from WorkoutScreen
  const handleSetInfoUpdate = (setNumber, totalSets) => {
    setCurrentSetInfo({ setNumber, totalSets });
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
        {/* Modal header with centered badge and wake screen button */}
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
            p: 1,
            gap: 1,
          }}
        >
          {/* Centered badge */}
          <Chip 
            label={`Set ${currentSetInfo.setNumber} of ${currentSetInfo.totalSets}`}
            color="primary"
            size="medium"
            sx={{ 
              fontWeight: 600,
              fontSize: { xs: '0.75rem', sm: '0.875rem' },
              position: 'absolute',
              left: '50%',
              transform: 'translateX(-50%)',
            }}
          />
          
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

        <DialogContent sx={{ p: 0, overflow: 'auto' }}>
          <WorkoutScreen
            workoutPlan={workoutPlan}
            onComplete={onComplete}
            onExit={onExit}
            supersetConfig={supersetConfig}
            setsPerSuperset={setsPerSuperset}
            onSetInfoUpdate={handleSetInfoUpdate}
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
};

export default WorkoutScreenModal;
