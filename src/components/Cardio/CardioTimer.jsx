/**
 * CardioTimer - Simplified cardio timer component
 * 
 * A basic interval timer for cardio workouts.
 * Replaces complex HIIT/Yoga session builders with a simple, focused timer.
 */

import { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Stack,
  LinearProgress,
  IconButton,
  Alert
} from '@mui/material';
import {
  PlayArrow,
  Pause,
  Stop,
  Replay
} from '@mui/icons-material';
import { motion } from 'framer-motion';

const CardioTimer = ({ onNavigate }) => {
  // Timer state
  const [duration, setDuration] = useState(20); // minutes
  const [isRunning, setIsRunning] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(20 * 60); // seconds
  const [isPaused, setIsPaused] = useState(false);
  
  const timerRef = useRef(null);
  const audioRef = useRef(null);

  // Initialize audio for completion sound
  useEffect(() => {
    audioRef.current = new Audio();
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  // Timer logic
  useEffect(() => {
    if (isRunning && !isPaused) {
      timerRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            setIsRunning(false);
            playCompletionSound();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isRunning, isPaused]);

  const playCompletionSound = () => {
    try {
      if (audioRef.current) {
        audioRef.current.src = 'data:audio/wav;base64,UklGRhwAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=';
        audioRef.current.play().catch(() => {
          // Ignore audio play errors
        });
      }
    } catch {
      // Ignore audio errors
    }
  };

  const handleStart = () => {
    if (!isRunning) {
      setTimeRemaining(duration * 60);
      setIsRunning(true);
      setIsPaused(false);
    }
  };

  const handlePause = () => {
    setIsPaused(!isPaused);
  };

  const handleStop = () => {
    setIsRunning(false);
    setIsPaused(false);
    setTimeRemaining(duration * 60);
  };

  const handleReset = () => {
    setIsRunning(false);
    setIsPaused(false);
    setTimeRemaining(duration * 60);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = ((duration * 60 - timeRemaining) / (duration * 60)) * 100;

  return (
    <Box sx={{ width: '100%', minHeight: '100vh', p: 3 }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        style={{ maxWidth: '600px', margin: '0 auto' }}
      >
        <Typography variant="h4" sx={{ mb: 3, fontWeight: 700, textAlign: 'center' }}>
          Cardio Timer
        </Typography>

        <Card sx={{ borderRadius: 3, mb: 3 }}>
          <CardContent sx={{ p: 4 }}>
            {/* Duration Setting */}
            {!isRunning && (
              <Box sx={{ mb: 4 }}>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  Duration (minutes)
                </Typography>
                <TextField
                  type="number"
                  value={duration}
                  onChange={(e) => {
                    const val = parseInt(e.target.value) || 1;
                    setDuration(Math.max(1, Math.min(120, val)));
                    setTimeRemaining(Math.max(1, Math.min(120, val)) * 60);
                  }}
                  inputProps={{ min: 1, max: 120 }}
                  fullWidth
                  sx={{ mb: 2 }}
                />
              </Box>
            )}

            {/* Timer Display */}
            <Box sx={{ textAlign: 'center', mb: 3 }}>
              <Typography
                variant="h1"
                sx={{
                  fontSize: '6rem',
                  fontWeight: 700,
                  color: timeRemaining === 0 ? 'success.main' : 'text.primary',
                  fontFamily: 'monospace'
                }}
              >
                {formatTime(timeRemaining)}
              </Typography>
              {isRunning && (
                <LinearProgress
                  variant="determinate"
                  value={progress}
                  sx={{
                    height: 8,
                    borderRadius: 4,
                    mt: 2
                  }}
                />
              )}
            </Box>

            {/* Controls */}
            <Stack direction="row" spacing={2} justifyContent="center">
              {!isRunning ? (
                <Button
                  variant="contained"
                  size="large"
                  startIcon={<PlayArrow />}
                  onClick={handleStart}
                  sx={{ px: 4, py: 1.5 }}
                >
                  Start
                </Button>
              ) : (
                <>
                  <IconButton
                    size="large"
                    onClick={handlePause}
                    color={isPaused ? 'success' : 'warning'}
                    sx={{ width: 64, height: 64 }}
                  >
                    {isPaused ? <PlayArrow sx={{ fontSize: 40 }} /> : <Pause sx={{ fontSize: 40 }} />}
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
                </>
              )}
            </Stack>

            {/* Completion Message */}
            {timeRemaining === 0 && (
              <Alert severity="success" sx={{ mt: 3 }}>
                Session complete! Great work!
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Back Button */}
        {onNavigate && (
          <Button
            variant="outlined"
            fullWidth
            onClick={() => onNavigate('home')}
            sx={{ mt: 2 }}
          >
            Back to Home
          </Button>
        )}
      </motion.div>
    </Box>
  );
};

CardioTimer.propTypes = {
  onNavigate: PropTypes.func
};

export default CardioTimer;
