import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Dialog, DialogContent, IconButton, Box, Tooltip, Chip } from '@mui/material';
import { MdScreenLockPortrait, MdScreenLockRotation } from 'react-icons/md';
import wakeLockManager from '../utils/wakeLock';

/**
 * TimerModal - Modal wrapper for timer display
 * Displays timer as a full-screen modal with wake lock functionality
 */
const TimerModal = ({ 
  open, 
  mode,
  currentInfo,
  children,
  onExit,
}) => {
  const [wakeLockActive, setWakeLockActive] = useState(wakeLockManager.isActive());
  const [wakeLockSupported] = useState(wakeLockManager.isWakeLockSupported());

  useEffect(() => {
    // Setup visibility change handler for wake lock
    const cleanup = wakeLockManager.reacquireOnVisibilityChange();
    return () => {
      if (cleanup) cleanup.then(fn => fn && fn());
    };
  }, []);

  const handleToggleWakeLock = async () => {
    if (wakeLockActive) {
      await wakeLockManager.releaseWakeLock();
      setWakeLockActive(false);
    } else {
      const success = await wakeLockManager.requestWakeLock();
      setWakeLockActive(success);
    }
  };

  return (
    <Dialog
      open={open}
      fullScreen
      onClose={onExit}
      PaperProps={{
        sx: {
          bgcolor: 'background.default',
          backgroundImage: 'none',
        }
      }}
    >
      {/* Modal header with centered badge and wake lock button */}
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
          label={currentInfo}
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

      <DialogContent sx={{ p: 0, overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
        {children}
      </DialogContent>
    </Dialog>
  );
};

TimerModal.propTypes = {
  open: PropTypes.bool.isRequired,
  mode: PropTypes.string.isRequired,
  currentInfo: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
  onExit: PropTypes.func.isRequired,
};

export default TimerModal;
