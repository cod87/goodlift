import { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { Dialog, IconButton, Box } from '@mui/material';
import { Minimize, Close } from '@mui/icons-material';
import { AnimatePresence, motion } from 'framer-motion';

/**
 * SessionModal - Full-screen modal overlay for workout/timer sessions
 * 
 * Features:
 * - Full-screen overlay that covers entire viewport
 * - Minimize button to collapse to bottom bar
 * - Close button to end session (with confirmation)
 * - Blocks background interactions when open
 * - Focus trap for accessibility
 * - Keyboard navigation support (ESC to minimize)
 */
const SessionModal = ({ 
  open, 
  onClose, 
  onMinimize,
  children,
  hideMinimize = false,
  hideClose = false,
}) => {
  const modalRef = useRef(null);

  // Focus trap - keep focus within modal when open
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        // ESC minimizes instead of closing
        if (onMinimize && !hideMinimize) {
          e.preventDefault();
          onMinimize();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onMinimize, hideMinimize]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  const handleClose = (event, reason) => {
    // Prevent closing by clicking backdrop or ESC
    if (reason === 'backdropClick' || reason === 'escapeKeyDown') {
      return;
    }
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      fullScreen
      ref={modalRef}
      aria-labelledby="session-modal-title"
      aria-describedby="session-modal-description"
      sx={{
        zIndex: 1400, // Above everything except minimized bar
        '& .MuiDialog-paper': {
          backgroundColor: 'background.default',
          margin: 0,
          maxHeight: '100vh',
          height: '100vh',
          width: '100vw',
          maxWidth: '100vw',
          borderRadius: 0,
          overflow: 'auto',
        },
      }}
      disableEscapeKeyDown // We handle ESC manually
      disablePortal={false}
    >
      <AnimatePresence mode="wait">
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{
              height: '100%',
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {/* Modal Controls - Top Right */}
            <Box
              sx={{
                position: 'absolute',
                top: { xs: 8, sm: 16 },
                right: { xs: 8, sm: 16 },
                zIndex: 1,
                display: 'flex',
                gap: 1,
              }}
            >
              {/* Minimize Button */}
              {!hideMinimize && onMinimize && (
                <IconButton
                  onClick={onMinimize}
                  sx={{
                    backgroundColor: 'background.paper',
                    boxShadow: 2,
                    width: { xs: 40, sm: 48 },
                    height: { xs: 40, sm: 48 },
                    '&:hover': {
                      backgroundColor: 'action.hover',
                    },
                  }}
                  aria-label="Minimize session"
                >
                  <Minimize />
                </IconButton>
              )}

              {/* Close Button */}
              {!hideClose && (
                <IconButton
                  onClick={onClose}
                  sx={{
                    backgroundColor: 'background.paper',
                    boxShadow: 2,
                    width: { xs: 40, sm: 48 },
                    height: { xs: 40, sm: 48 },
                    '&:hover': {
                      backgroundColor: 'error.light',
                      color: 'error.contrastText',
                    },
                  }}
                  aria-label="Close session"
                >
                  <Close />
                </IconButton>
              )}
            </Box>

            {/* Modal Content */}
            <Box
              sx={{
                flex: 1,
                overflow: 'auto',
                pt: { xs: 7, sm: 9 }, // Space for controls
                pb: 2,
              }}
            >
              {children}
            </Box>
          </motion.div>
        )}
      </AnimatePresence>
    </Dialog>
  );
};

SessionModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onMinimize: PropTypes.func,
  children: PropTypes.node,
  hideMinimize: PropTypes.bool,
  hideClose: PropTypes.bool,
};

export default SessionModal;
