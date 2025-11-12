import { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { motion } from 'framer-motion';
import { 
  Box, 
  Card, 
  CardContent, 
  Typography, 
  Button, 
  LinearProgress,
  IconButton,
  Stack,
  Chip
} from '@mui/material';
import { 
  PlayArrow, 
  Pause, 
  Refresh, 
  SkipNext,
  FitnessCenter,
  SelfImprovement
} from '@mui/icons-material';
import audioService from '../utils/audioService';

/**
 * StretchReminder Component
 * Simple timer-based warmup/cooldown reminder with guidance text
 * No programmed stretches - just time tracking and guidance
 */
const StretchReminder = ({
  type, // 'warmup' or 'cooldown'
  workoutType, // 'upper', 'lower', 'full'
  defaultDuration = 5, // minutes
  onComplete,
  onSkip,
}) => {
  const [timerState, setTimerState] = useState('ready'); // 'ready', 'running', 'paused', 'completed'
  const [selectedDuration, setSelectedDuration] = useState(defaultDuration); // in minutes
  const [timeRemaining, setTimeRemaining] = useState(defaultDuration * 60); // in seconds
  const timerRef = useRef(null);
  const startTimeRef = useRef(null);
  const pausedTimeRef = useRef(null);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  // Get guidance text based on workout type and stretch type
  const getGuidanceText = () => {
    if (type === 'warmup') {
      const baseText = 'Recommended: 5-10 minutes of dynamic stretching';
      const specificGuidance = {
        upper: 'Focus on shoulder circles, arm swings, chest openers, and back rotations',
        lower: 'Focus on leg swings, hip circles, knee lifts, and ankle rotations',
        full: 'Focus on full body movement - jumping jacks, arm circles, leg swings, and torso twists',
      };
      return {
        main: baseText,
        specific: specificGuidance[workoutType] || specificGuidance.full,
      };
    } else {
      const baseText = 'Recommended: 5-10 minutes of static stretching';
      const specificGuidance = {
        upper: 'Hold stretches for 20-30 seconds - focus on shoulders, chest, back, and triceps',
        lower: 'Hold stretches for 20-30 seconds - focus on quads, hamstrings, glutes, and calves',
        full: 'Hold stretches for 20-30 seconds - focus on all major muscle groups you trained',
      };
      return {
        main: baseText,
        specific: specificGuidance[workoutType] || specificGuidance.full,
      };
    }
  };

  const guidance = getGuidanceText();

  const handleStartTimer = () => {
    if (timerState === 'ready' || timerState === 'completed') {
      // Start fresh
      const durationInSeconds = selectedDuration * 60;
      setTimeRemaining(durationInSeconds);
      setTimerState('running');
      startTimeRef.current = Date.now();
      
      timerRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
        const remaining = durationInSeconds - elapsed;
        
        if (remaining <= 0) {
          clearInterval(timerRef.current);
          setTimeRemaining(0);
          setTimerState('completed');
          // Play completion sound
          audioService.playBeep(880, 300);
          setTimeout(() => audioService.playBeep(1046, 300), 350);
        } else {
          setTimeRemaining(remaining);
        }
      }, 1000);
    } else if (timerState === 'paused') {
      // Resume from pause
      setTimerState('running');
      const pausedFor = Date.now() - pausedTimeRef.current;
      startTimeRef.current = startTimeRef.current + pausedFor;
      
      const totalDuration = selectedDuration * 60;
      timerRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
        const remaining = totalDuration - elapsed;
        
        if (remaining <= 0) {
          clearInterval(timerRef.current);
          setTimeRemaining(0);
          setTimerState('completed');
          // Play completion sound
          audioService.playBeep(880, 300);
          setTimeout(() => audioService.playBeep(1046, 300), 350);
        } else {
          setTimeRemaining(remaining);
        }
      }, 1000);
    }
  };

  const handlePauseTimer = () => {
    if (timerState === 'running') {
      setTimerState('paused');
      pausedTimeRef.current = Date.now();
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
  };

  const handleResetTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    setTimerState('ready');
    setTimeRemaining(selectedDuration * 60);
  };

  const handleComplete = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    onComplete();
  };

  const handleSkip = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    onSkip();
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = ((selectedDuration * 60 - timeRemaining) / (selectedDuration * 60)) * 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      style={{
        width: '100%',
        maxWidth: '600px',
        margin: '0 auto',
        padding: '0.5rem',
      }}
    >
      <Card
        sx={{
          borderRadius: 2,
          boxShadow: 3,
          bgcolor: 'background.paper',
        }}
      >
        <CardContent sx={{ p: 3 }}>
          {/* Header */}
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
              {type === 'warmup' ? (
                <FitnessCenter sx={{ fontSize: 48, color: 'warning.main' }} />
              ) : (
                <SelfImprovement sx={{ fontSize: 48, color: 'info.main' }} />
              )}
            </Box>
            <Typography variant="h5" sx={{ fontWeight: 600, mb: 1 }}>
              {type === 'warmup' ? 'Warm-Up Time' : 'Cool-Down Time'}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              {guidance.main}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
              {guidance.specific}
            </Typography>
          </Box>

          {/* Duration Selection - only show when not started */}
          {timerState === 'ready' && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1, textAlign: 'center' }}>
                Select Duration
              </Typography>
              <Stack direction="row" spacing={1} justifyContent="center">
                {[5, 7, 10].map((mins) => (
                  <Chip
                    key={mins}
                    label={`${mins} min`}
                    onClick={() => {
                      setSelectedDuration(mins);
                      setTimeRemaining(mins * 60);
                    }}
                    color={selectedDuration === mins ? 'primary' : 'default'}
                    variant={selectedDuration === mins ? 'filled' : 'outlined'}
                    sx={{ minWidth: 70, cursor: 'pointer' }}
                  />
                ))}
              </Stack>
            </Box>
          )}

          {/* Timer Display */}
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <Typography
              variant="h1"
              sx={{
                fontWeight: 700,
                fontSize: { xs: '3rem', sm: '4rem' },
                color: timerState === 'completed' ? 'success.main' : 'text.primary',
              }}
            >
              {formatTime(timeRemaining)}
            </Typography>
            {timerState === 'completed' && (
              <Typography variant="body1" color="success.main" sx={{ mt: 1, fontWeight: 600 }}>
                ✓ Time Complete!
              </Typography>
            )}
          </Box>

          {/* Progress Bar */}
          {(timerState === 'running' || timerState === 'paused' || timerState === 'completed') && (
            <Box sx={{ mb: 3 }}>
              <LinearProgress
                variant="determinate"
                value={progress}
                sx={{
                  height: 10,
                  borderRadius: 5,
                  bgcolor: 'rgba(0, 0, 0, 0.1)',
                  '& .MuiLinearProgress-bar': {
                    bgcolor: type === 'warmup' ? 'warning.main' : 'info.main',
                    borderRadius: 5,
                  },
                }}
              />
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5, textAlign: 'center' }}>
                {Math.round(progress)}% complete
              </Typography>
            </Box>
          )}

          {/* Timer Controls */}
          <Stack direction="row" spacing={1} justifyContent="center" sx={{ mb: 2 }}>
            {(timerState === 'ready' || timerState === 'paused') && (
              <Button
                variant="contained"
                size="large"
                startIcon={<PlayArrow />}
                onClick={handleStartTimer}
                sx={{ minWidth: 140 }}
              >
                {timerState === 'paused' ? 'Resume' : 'Start Timer'}
              </Button>
            )}
            {timerState === 'running' && (
              <Button
                variant="contained"
                size="large"
                startIcon={<Pause />}
                onClick={handlePauseTimer}
                sx={{ minWidth: 140 }}
              >
                Pause
              </Button>
            )}
            {(timerState === 'running' || timerState === 'paused') && (
              <IconButton
                onClick={handleResetTimer}
                color="primary"
                size="large"
                sx={{ border: '1px solid', borderColor: 'primary.main' }}
              >
                <Refresh />
              </IconButton>
            )}
          </Stack>

          {/* Action Buttons */}
          <Stack direction="row" spacing={2} sx={{ mt: 3 }}>
            <Button
              variant="outlined"
              fullWidth
              onClick={handleSkip}
              startIcon={<SkipNext />}
            >
              Skip {type === 'warmup' ? 'Warm-Up' : 'Cool-Down'}
            </Button>
            {(timerState === 'completed' || timerState === 'running' || timerState === 'paused') && (
              <Button
                variant="contained"
                fullWidth
                onClick={handleComplete}
                color="success"
              >
                Mark Complete
              </Button>
            )}
          </Stack>
        </CardContent>
      </Card>
    </motion.div>
  );
};

StretchReminder.propTypes = {
  type: PropTypes.oneOf(['warmup', 'cooldown']).isRequired,
  workoutType: PropTypes.oneOf(['upper', 'lower', 'full']).isRequired,
  defaultDuration: PropTypes.number,
  onComplete: PropTypes.func.isRequired,
  onSkip: PropTypes.func.isRequired,
};

export default StretchReminder;
