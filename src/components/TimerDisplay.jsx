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
  currentRound,
  currentSet,
  roundsPerSet,
  numberOfSets,
  workIntervalNames,
  intervalNames,
  sessionName,
  // Flow/Yoga specific
  currentPoseIndex,
  selectedPoses,
  // Handlers
  handleStart,
  handlePause,
  handleStop,
  handleReset,
  handleSkipForward,
  handleSkipBackward,
}) => {
  // Determine background color for HIIT mode
  const getBackgroundColor = () => {
    if (mode !== TIMER_MODES.HIIT) {
      return 'background.default';
    }
    
    if (isWorkPeriod) {
      return '#1b5e20'; // Dark green for Work
    } else if (isPrepPeriod || isRecoveryPeriod) {
      return '#0d47a1'; // Dark blue for Set break/Prep
    } else {
      return '#b71c1c'; // Dark red for Rest
    }
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
            color: mode === TIMER_MODES.HIIT ? '#ffffff' : 
              mode === TIMER_MODES.HIIT && isWorkPeriod
                ? 'success.main'
                : mode === TIMER_MODES.HIIT && (isPrepPeriod || isRecoveryPeriod)
                ? 'warning.main'
                : mode === TIMER_MODES.HIIT && !isWorkPeriod
                ? 'error.main'
                : 'primary.main',
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
        
        {mode === TIMER_MODES.FLOW && selectedPoses[currentPoseIndex] && (
          <>
            <Typography variant="h6" sx={{ mt: 2, fontWeight: 600 }}>
              {selectedPoses[currentPoseIndex].name}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Pose {currentPoseIndex + 1} of {selectedPoses.length}
            </Typography>
          </>
        )}
      </Box>

      {/* Controls */}
      <Stack direction="row" spacing={2} justifyContent="center" flexWrap="wrap">
        {!isRunning ? (
          <IconButton
            size="large"
            onClick={handleStart}
            color="primary"
            sx={{ width: 64, height: 64 }}
            disabled={mode === TIMER_MODES.FLOW && selectedPoses.length === 0}
          >
            <PlayArrow sx={{ fontSize: 48 }} />
          </IconButton>
        ) : (
          <>
            {/* Skip backward for HIIT and Yoga */}
            {(mode === TIMER_MODES.HIIT || mode === TIMER_MODES.FLOW) && (
              <IconButton
                size="large"
                onClick={handleSkipBackward}
                color="primary"
                sx={{ width: 56, height: 56 }}
                disabled={
                  (mode === TIMER_MODES.HIIT && isPrepPeriod) ||
                  (mode === TIMER_MODES.FLOW && currentPoseIndex === 0)
                }
              >
                <SkipPrevious sx={{ fontSize: 36 }} />
              </IconButton>
            )}
            
            <IconButton
              size="large"
              onClick={handlePause}
              color={isPaused ? 'success' : 'warning'}
              sx={{ width: 64, height: 64 }}
            >
              {isPaused ? (
                <PlayArrow sx={{ fontSize: 40 }} />
              ) : (
                <Pause sx={{ fontSize: 40 }} />
              )}
            </IconButton>
            <IconButton
              size="large"
              onClick={handleStop}
              color="error"
              sx={{ width: 64, height: 64 }}
            >
              <Stop sx={{ fontSize: 40 }} />
            </IconButton>
            <IconButton
              size="large"
              onClick={handleReset}
              color="primary"
              sx={{ width: 64, height: 64 }}
            >
              <Replay sx={{ fontSize: 40 }} />
            </IconButton>
            
            {/* Skip forward for HIIT and Yoga */}
            {(mode === TIMER_MODES.HIIT || mode === TIMER_MODES.FLOW) && (
              <IconButton
                size="large"
                onClick={handleSkipForward}
                color="primary"
                sx={{ width: 56, height: 56 }}
                disabled={
                  (mode === TIMER_MODES.HIIT && !isPrepPeriod && !isRecoveryPeriod && !isWorkPeriod && currentRound >= roundsPerSet && currentSet >= numberOfSets) ||
                  (mode === TIMER_MODES.FLOW && currentPoseIndex >= selectedPoses.length - 1)
                }
              >
                <SkipNext sx={{ fontSize: 36 }} />
              </IconButton>
            )}
          </>
        )}
      </Stack>
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
  currentRound: PropTypes.number,
  currentSet: PropTypes.number,
  roundsPerSet: PropTypes.number,
  numberOfSets: PropTypes.number,
  workIntervalNames: PropTypes.array,
  intervalNames: PropTypes.object,
  sessionName: PropTypes.string,
  currentPoseIndex: PropTypes.number,
  selectedPoses: PropTypes.array,
  handleStart: PropTypes.func.isRequired,
  handlePause: PropTypes.func.isRequired,
  handleStop: PropTypes.func.isRequired,
  handleReset: PropTypes.func.isRequired,
  handleSkipForward: PropTypes.func,
  handleSkipBackward: PropTypes.func,
};

export default TimerDisplay;
