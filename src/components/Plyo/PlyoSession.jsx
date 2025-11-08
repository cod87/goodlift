import { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import PropTypes from 'prop-types';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  IconButton,
  Chip,
  Stack,
} from '@mui/material';
import { PlayArrow, Pause, Stop } from '@mui/icons-material';
import { savePlyoSession } from '../../utils/storage';
import audioService from '../../utils/audioService';
import wakeLockManager from '../../utils/wakeLock';

const PlyoSession = ({ workoutData, onComplete, onExit }) => {
  const [phase, setPhase] = useState('countdown');
  const [timeLeft, setTimeLeft] = useState(15);
  const [isPaused, setIsPaused] = useState(false);
  const [sessionStartTime, setSessionStartTime] = useState(null);
  const intervalRef = useRef(null);

  useEffect(() => {
    wakeLockManager.requestWakeLock();
    setSessionStartTime(Date.now());
    return () => wakeLockManager.releaseWakeLock();
  }, []);

  const handleComplete = useCallback(async () => {
    const endTime = Date.now();
    const duration = Math.floor((endTime - sessionStartTime) / 1000);

    await savePlyoSession({
      id: 'plyo_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
      date: new Date().toISOString(),
      duration: duration,
      workoutId: workoutData.id,
      workoutName: workoutData.name,
      rounds: workoutData.rounds,
    });

    setPhase('complete');
    
    if (onComplete) {
      onComplete();
    }
  }, [sessionStartTime, workoutData, onComplete]);

  useEffect(() => {
    if (phase === 'complete' || isPaused) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      return;
    }

    intervalRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          if (phase === 'countdown') {
            setPhase('warmup');
            return workoutData.warmup.duration * 60;
          } else if (phase === 'warmup') {
            setPhase('work');
            audioService.playHighBeep();
            return workoutData.workDuration * workoutData.rounds * 6;
          } else if (phase === 'work') {
            setPhase('cooldown');
            audioService.playCompletionFanfare();
            return workoutData.cooldown.duration * 60;
          } else if (phase === 'cooldown') {
            handleComplete();
            return 0;
          }
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [phase, isPaused, workoutData, handleComplete]);

  const togglePause = () => {
    setIsPaused(!isPaused);
  };

  const handleStop = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    wakeLockManager.releaseWakeLock();
    if (onExit) {
      onExit();
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins + ':' + secs.toString().padStart(2, '0');
  };

  const getPhaseColor = () => {
    switch (phase) {
      case 'countdown':
        return 'warning.main';
      case 'warmup':
        return 'info.main';
      case 'work':
        return 'secondary.main';
      case 'cooldown':
        return 'success.main';
      default:
        return 'text.primary';
    }
  };

  if (phase === 'complete') {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        style={{ 
          maxWidth: '900px', 
          margin: '0 auto', 
          padding: '2rem 1rem'
        }}
      >
        <Card sx={{ borderRadius: 3, textAlign: 'center' }}>
          <CardContent sx={{ p: 4 }}>
            <Typography variant="h3" sx={{ fontWeight: 700, color: 'success.main', mb: 2 }}>
              Workout Complete! 🎉
            </Typography>
            <Typography variant="h6" sx={{ mb: 4 }}>
              Great job completing {workoutData.name}!
            </Typography>
            <Button
              variant="contained"
              size="large"
              onClick={onExit}
              sx={{ px: 4 }}
            >
              Finish
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      style={{ 
        maxWidth: '900px', 
        margin: '0 auto', 
        padding: '2rem 1rem',
        minHeight: '80vh',
        display: 'flex',
        alignItems: 'center'
      }}
    >
      <Card sx={{ width: '100%', borderRadius: 3 }}>
        <CardContent sx={{ p: 4 }}>
          <Stack spacing={3}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main', mb: 1 }}>
                {workoutData.name}
              </Typography>
              <Chip 
                label={phase.toUpperCase()} 
                sx={{ 
                  bgcolor: getPhaseColor(),
                  color: 'white',
                  fontWeight: 700,
                  fontSize: '1rem',
                  px: 2
                }}
              />
            </Box>

            <Box sx={{ 
              textAlign: 'center',
              py: 4,
              bgcolor: 'background.default',
              borderRadius: 2
            }}>
              <Typography variant="h1" sx={{ 
                fontWeight: 800,
                color: getPhaseColor(),
                fontSize: { xs: '4rem', sm: '6rem' }
              }}>
                {formatTime(timeLeft)}
              </Typography>
            </Box>

            <Stack direction="row" spacing={2} justifyContent="center">
              <IconButton
                onClick={togglePause}
                sx={{ 
                  bgcolor: isPaused ? 'success.main' : 'warning.main',
                  color: 'white',
                  '&:hover': {
                    bgcolor: isPaused ? 'success.dark' : 'warning.dark',
                  },
                  width: 60,
                  height: 60
                }}
              >
                {isPaused ? <PlayArrow sx={{ fontSize: 32 }} /> : <Pause sx={{ fontSize: 32 }} />}
              </IconButton>
              
              <IconButton
                onClick={handleStop}
                sx={{ 
                  bgcolor: 'error.main',
                  color: 'white',
                  '&:hover': {
                    bgcolor: 'error.dark',
                  },
                  width: 60,
                  height: 60
                }}
              >
                <Stop sx={{ fontSize: 32 }} />
              </IconButton>
            </Stack>
          </Stack>
        </CardContent>
      </Card>
    </motion.div>
  );
};

PlyoSession.propTypes = {
  workoutData: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    rounds: PropTypes.number.isRequired,
    workDuration: PropTypes.number.isRequired,
    warmup: PropTypes.object.isRequired,
    cooldown: PropTypes.object.isRequired,
  }).isRequired,
  onComplete: PropTypes.func,
  onExit: PropTypes.func,
};

export default PlyoSession;
