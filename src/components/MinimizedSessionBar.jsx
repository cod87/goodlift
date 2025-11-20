import PropTypes from 'prop-types';
import { Box, Typography, IconButton, LinearProgress, Chip } from '@mui/material';
import { OpenInFull, Pause, PlayArrow, Stop } from '@mui/icons-material';
import { motion } from 'framer-motion';

/**
 * MinimizedSessionBar - Persistent bottom bar showing session status when minimized
 * 
 * Features:
 * - Shows session type and current status
 * - Displays timer/progress
 * - Quick pause/resume controls
 * - Restore button to reopen full modal
 * - Stop button to end session
 */
const MinimizedSessionBar = ({ 
  sessionType, 
  timeDisplay, 
  progress,
  isPaused,
  onRestore, 
  onPause,
  onStop,
  statusText,
}) => {
  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 100, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      style={{
        position: 'fixed',
        bottom: 80, // Above bottom navigation
        left: 0,
        right: 0,
        zIndex: 1300, // Below modal but above content
      }}
    >
      <Box
        sx={{
          backgroundColor: 'background.paper',
          borderTop: '2px solid',
          borderColor: 'primary.main',
          boxShadow: '0 -4px 20px rgba(0,0,0,0.15)',
          padding: { xs: 1.5, sm: 2 },
          display: 'flex',
          alignItems: 'center',
          gap: { xs: 1, sm: 2 },
        }}
      >
        {/* Session Type Indicator */}
        <Chip
          label={sessionType?.toUpperCase() || 'SESSION'}
          color="primary"
          size="small"
          sx={{ 
            fontWeight: 600,
            fontSize: { xs: '0.7rem', sm: '0.8rem' },
          }}
        />

        {/* Session Status */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography 
            variant="body1" 
            sx={{ 
              fontWeight: 700, 
              fontSize: { xs: '1rem', sm: '1.25rem' },
              fontFamily: 'monospace',
            }}
          >
            {timeDisplay || '0:00'}
          </Typography>
          {statusText && (
            <Typography 
              variant="caption" 
              color="text.secondary"
              sx={{ 
                display: 'block',
                fontSize: { xs: '0.7rem', sm: '0.75rem' },
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {statusText}
            </Typography>
          )}
          {progress !== undefined && (
            <LinearProgress 
              variant="determinate" 
              value={progress}
              sx={{ 
                mt: 0.5,
                height: 4,
                borderRadius: 2,
              }}
            />
          )}
        </Box>

        {/* Controls */}
        <Box sx={{ display: 'flex', gap: { xs: 0.5, sm: 1 }, alignItems: 'center' }}>
          {/* Pause/Resume Button */}
          {onPause && (
            <IconButton
              onClick={onPause}
              color={isPaused ? 'success' : 'warning'}
              size="small"
              sx={{ 
                width: { xs: 36, sm: 40 }, 
                height: { xs: 36, sm: 40 },
                minWidth: 36,
                minHeight: 36,
              }}
              aria-label={isPaused ? 'Resume session' : 'Pause session'}
            >
              {isPaused ? <PlayArrow /> : <Pause />}
            </IconButton>
          )}

          {/* Stop Button */}
          {onStop && (
            <IconButton
              onClick={onStop}
              color="error"
              size="small"
              sx={{ 
                width: { xs: 36, sm: 40 }, 
                height: { xs: 36, sm: 40 },
                minWidth: 36,
                minHeight: 36,
              }}
              aria-label="Stop session"
            >
              <Stop />
            </IconButton>
          )}

          {/* Restore Button */}
          <IconButton
            onClick={onRestore}
            color="primary"
            size="small"
            sx={{ 
              width: { xs: 36, sm: 40 }, 
              height: { xs: 36, sm: 40 },
              minWidth: 36,
              minHeight: 36,
            }}
            aria-label="Restore session to full screen"
          >
            <OpenInFull />
          </IconButton>
        </Box>
      </Box>
    </motion.div>
  );
};

MinimizedSessionBar.propTypes = {
  sessionType: PropTypes.string,
  timeDisplay: PropTypes.string,
  progress: PropTypes.number,
  isPaused: PropTypes.bool,
  onRestore: PropTypes.func.isRequired,
  onPause: PropTypes.func,
  onStop: PropTypes.func,
  statusText: PropTypes.string,
};

export default MinimizedSessionBar;
