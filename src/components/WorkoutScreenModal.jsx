import { useState } from 'react';
import PropTypes from 'prop-types';
import { Dialog, DialogContent, IconButton, Box } from '@mui/material';
import { Minimize, Maximize, Close } from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import WorkoutScreen from './WorkoutScreen';

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

  const handleMinimize = () => {
    setIsMinimized(true);
  };

  const handleRestore = () => {
    setIsMinimized(false);
  };

  const handleClose = () => {
    if (window.confirm('Are you sure you want to exit? Your progress will not be saved.')) {
      onExit();
    }
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
        {/* Modal header with minimize and close buttons */}
        <Box
          sx={{
            position: 'sticky',
            top: 0,
            zIndex: 1100,
            bgcolor: 'background.paper',
            borderBottom: '1px solid',
            borderColor: 'divider',
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'center',
            p: 1,
            gap: 1,
          }}
        >
          <IconButton
            onClick={handleMinimize}
            size="small"
            sx={{
              color: 'text.secondary',
              '&:hover': { bgcolor: 'action.hover' },
            }}
            aria-label="Minimize workout"
          >
            <Minimize />
          </IconButton>
          <IconButton
            onClick={handleClose}
            size="small"
            sx={{
              color: 'error.main',
              '&:hover': { bgcolor: 'error.light', color: 'error.contrastText' },
            }}
            aria-label="Close workout"
          >
            <Close />
          </IconButton>
        </Box>

        <DialogContent sx={{ p: 0, overflow: 'auto' }}>
          <WorkoutScreen
            workoutPlan={workoutPlan}
            onComplete={onComplete}
            onExit={onExit}
            supersetConfig={supersetConfig}
            setsPerSuperset={setsPerSuperset}
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
