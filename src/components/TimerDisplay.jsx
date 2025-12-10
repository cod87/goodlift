import PropTypes from 'prop-types';
import {
  Box,
  Typography,
  Stack,
  IconButton,
} from '@mui/material';
import {
  PlayArrow,
  Pause,
  Stop,
  Replay,
  SkipNext,
  SkipPrevious,
} from '@mui/icons-material';

const TIMER_MODES = {
  HIIT: 'hiit',
  FLOW: 'flow',
  CARDIO: 'cardio',
};

/**
 * TimerDisplay - Displays timer content and controls
 * Used within TimerModal for full-screen timer display
 */
const TimerDisplay = ({
  mode,
  isRunning,
  isPaused,
  timeRemaining,
  formatTime,
  // HIIT specific
  isWorkPeriod,
  isPrepPeriod,
  isRecoveryPeriod,
  isExtendedRest,
  currentRound,
  currentSet,
  roundsPerSet,
  numberOfSets,
  workIntervalNames,
  intervalNames,
  sessionName,
  // Handlers
  handleStart,
  handlePause,
  handleStop,
  handleReset,
  handleSkipForward,
  handleSkipBackward,
}) => {
  // Determine background color - use dark theme for all modes
  const getBackgroundColor = () => {
    if (mode === TIMER_MODES.HIIT) {
      if (isWorkPeriod) {
        return '#1b5e20'; // Dark green for Work
      } else if (isPrepPeriod || isRecoveryPeriod) {
        return '#0d47a1'; // Dark blue for Set break/Prep
      } else {
        return '#b71c1c'; // Dark red for Rest
      }
    }
    // For Cardio and Flow/Yoga modes, use a neutral dark background
    return '#1a202c'; // Dark slate background
  };

  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center',
      minHeight: '100%',
      p: 4,
      bgcolor: getBackgroundColor(),
      transition: 'background-color 0.5s ease',
    }}>
      {/* Timer Display */}
      <Box sx={{ 
        textAlign: 'center', 
        mb: 3,
        width: '100%',
      }}>
        <Typography
          variant="h1"
          sx={{
            fontSize: { xs: 'clamp(3rem, 15vw, 8rem)', sm: 'clamp(5rem, 20vw, 10rem)', md: '12rem' },
            fontWeight: 700,
            color: mode === TIMER_MODES.HIIT ? '#ffffff' : '#1db584', // White for HIIT, teal for others
            fontFamily: 'monospace',
            lineHeight: 1,
          }}
        >
          {formatTime(timeRemaining)}
        </Typography>
        
        {mode === TIMER_MODES.HIIT && (
          <>
            <Typography 
              variant="h6" 
              sx={{ 
                mt: 2, 
                fontWeight: 700,
                fontSize: { xs: '2rem', sm: '2.5rem', md: '3rem' },
                color: '#ffffff',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
              }}
            >
              {isPrepPeriod 
                ? intervalNames.prep 
                : isRecoveryPeriod 
                ? intervalNames.recovery 
                : isWorkPeriod 
                ? (workIntervalNames[currentRound - 1] || 'Work')
                : isExtendedRest
                ? 'Extended Rest'
                : 'Rest'}
            </Typography>
            {isPrepPeriod && (
              <Typography variant="body2" sx={{ mt: 1, fontSize: { xs: '1.1rem', sm: '1.3rem' }, color: 'rgba(255, 255, 255, 0.9)', fontWeight: 500 }}>
                Up Next: {workIntervalNames[0] || 'work'}
              </Typography>
            )}
            {isRecoveryPeriod && (
              <Typography variant="body2" sx={{ mt: 1, fontSize: { xs: '1.1rem', sm: '1.3rem' }, color: 'rgba(255, 255, 255, 0.9)', fontWeight: 500 }}>
                Up Next (Set {currentSet + 1}): {workIntervalNames[0] || 'work'}
              </Typography>
            )}
            {!isPrepPeriod && !isRecoveryPeriod && !isWorkPeriod && currentRound < roundsPerSet && (
              <Typography variant="body2" sx={{ mt: 1, fontSize: { xs: '1.1rem', sm: '1.3rem' }, color: 'rgba(255, 255, 255, 0.9)', fontWeight: 500 }}>
                Up Next: {workIntervalNames[currentRound] || 'work'}
              </Typography>
            )}
            {!isPrepPeriod && !isRecoveryPeriod && (
              <>
                <Typography variant="body2" sx={{ fontSize: { xs: '1.1rem', sm: '1.3rem' }, color: 'rgba(255, 255, 255, 0.9)', fontWeight: 500 }}>
                  Round {currentRound} / {roundsPerSet}
                </Typography>
                {numberOfSets > 1 && (
                  <Typography variant="body2" sx={{ fontSize: { xs: '1.1rem', sm: '1.3rem' }, color: 'rgba(255, 255, 255, 0.9)', fontWeight: 500 }}>
                    Set {currentSet} / {numberOfSets}
                  </Typography>
                )}
              </>
            )}
            {sessionName && (
              <Typography variant="caption" sx={{ display: 'block', mt: 1, fontSize: { xs: '0.9rem', sm: '1rem' }, color: 'rgba(255, 255, 255, 0.8)', fontWeight: 500 }}>
                {sessionName}
              </Typography>
            )}
          </>
        )}
      </Box>

      {/* Controls */}
      <Box 
        sx={{ 
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: 'rgba(255, 255, 255, 0.15)',
          backdropFilter: 'blur(8px)',
          borderRadius: 3,
          padding: { xs: 1.5, sm: 2 },
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
        }}
      >
        <Stack 
          direction="row" 
          spacing={{ xs: 1, sm: 2 }} 
          justifyContent="center"
          alignItems="center"
          sx={{
            flexWrap: 'nowrap', // Prevent wrapping to ensure single row
            overflowX: 'auto', // Allow horizontal scroll if needed on very small screens
            width: '100%',
          }}
        >
          {!isRunning ? (
            <IconButton
              size="large"
              onClick={handleStart}
              sx={{ 
                width: { xs: 56, sm: 64 }, 
                height: { xs: 56, sm: 64 },
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                color: 'primary.main',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 1)',
                },
                flexShrink: 0, // Prevent button from shrinking
              }}
            >
              <PlayArrow sx={{ fontSize: { xs: 40, sm: 48 } }} />
            </IconButton>
          ) : (
            <>
              {/* Skip backward for HIIT only */}
              {mode === TIMER_MODES.HIIT && (
                <IconButton
                  size="large"
                  onClick={handleSkipBackward}
                  sx={{ 
                    width: { xs: 48, sm: 56 }, 
                    height: { xs: 48, sm: 56 },
                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    color: 'primary.main',
                    '&:hover': {
                      backgroundColor: 'rgba(255, 255, 255, 1)',
                    },
                    '&.Mui-disabled': {
                      backgroundColor: 'rgba(255, 255, 255, 0.5)',
                    },
                    flexShrink: 0,
                  }}
                  disabled={mode === TIMER_MODES.HIIT && isPrepPeriod}
                >
                  <SkipPrevious sx={{ fontSize: { xs: 28, sm: 36 } }} />
                </IconButton>
              )}
              
              <IconButton
                size="large"
                onClick={handlePause}
                sx={{ 
                  width: { xs: 56, sm: 64 }, 
                  height: { xs: 56, sm: 64 },
                  backgroundColor: 'rgba(255, 255, 255, 0.9)',
                  color: isPaused ? 'success.main' : 'warning.main',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 1)',
                  },
                  flexShrink: 0,
                }}
              >
                {isPaused ? (
                  <PlayArrow sx={{ fontSize: { xs: 36, sm: 40 } }} />
                ) : (
                  <Pause sx={{ fontSize: { xs: 36, sm: 40 } }} />
                )}
              </IconButton>
              <IconButton
                size="large"
                onClick={handleStop}
                sx={{ 
                  width: { xs: 56, sm: 64 }, 
                  height: { xs: 56, sm: 64 },
                  backgroundColor: 'rgba(255, 255, 255, 0.9)',
                  color: 'error.main',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 1)',
                  },
                  flexShrink: 0,
                }}
              >
                <Stop sx={{ fontSize: { xs: 36, sm: 40 } }} />
              </IconButton>
              <IconButton
                size="large"
                onClick={handleReset}
                sx={{ 
                  width: { xs: 56, sm: 64 }, 
                  height: { xs: 56, sm: 64 },
                  backgroundColor: 'rgba(255, 255, 255, 0.9)',
                  color: 'primary.main',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 1)',
                  },
                  flexShrink: 0,
                }}
              >
                <Replay sx={{ fontSize: { xs: 36, sm: 40 } }} />
              </IconButton>
              
              {/* Skip forward for HIIT only */}
              {mode === TIMER_MODES.HIIT && (
                <IconButton
                  size="large"
                  onClick={handleSkipForward}
                  sx={{ 
                    width: { xs: 48, sm: 56 }, 
                    height: { xs: 48, sm: 56 },
                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    color: 'primary.main',
                    '&:hover': {
                      backgroundColor: 'rgba(255, 255, 255, 1)',
                    },
                    '&.Mui-disabled': {
                      backgroundColor: 'rgba(255, 255, 255, 0.5)',
                    },
                    flexShrink: 0,
                  }}
                  disabled={mode === TIMER_MODES.HIIT && !isPrepPeriod && !isRecoveryPeriod && !isWorkPeriod && currentRound >= roundsPerSet && currentSet >= numberOfSets}
                >
                  <SkipNext sx={{ fontSize: { xs: 28, sm: 36 } }} />
                </IconButton>
              )}
            </>
          )}
        </Stack>
      </Box>
    </Box>
  );
};

TimerDisplay.propTypes = {
  mode: PropTypes.string.isRequired,
  isRunning: PropTypes.bool.isRequired,
  isPaused: PropTypes.bool.isRequired,
  timeRemaining: PropTypes.number.isRequired,
  formatTime: PropTypes.func.isRequired,
  isWorkPeriod: PropTypes.bool,
  isPrepPeriod: PropTypes.bool,
  isRecoveryPeriod: PropTypes.bool,
  isExtendedRest: PropTypes.bool,
  currentRound: PropTypes.number,
  currentSet: PropTypes.number,
  roundsPerSet: PropTypes.number,
  numberOfSets: PropTypes.number,
  workIntervalNames: PropTypes.array,
  intervalNames: PropTypes.object,
  sessionName: PropTypes.string,
  handleStart: PropTypes.func.isRequired,
  handlePause: PropTypes.func.isRequired,
  handleStop: PropTypes.func.isRequired,
  handleReset: PropTypes.func.isRequired,
  handleSkipForward: PropTypes.func,
  handleSkipBackward: PropTypes.func,
};

export default TimerDisplay;
