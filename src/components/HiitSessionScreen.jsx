/**
 * HIIT Session Execution Screen
 * 
 * Displays and guides users through generated HIIT sessions
 * with interval timer, exercise instructions, and progress tracking
 */

import { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  LinearProgress,
  Stack,
  Chip,
  Alert,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField
} from '@mui/material';
import {
  PlayArrow,
  Pause,
  Stop,
  SkipNext,
  SkipPrevious,
  Timer as TimerIcon,
  CheckCircle,
  FitnessCenter
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { saveHiitSession } from '../utils/storage';
import CompactHeader from './Common/CompactHeader';
import { useSessionExecution } from '../hooks/useSessionExecution';

const HiitSessionScreen = ({ onNavigate }) => {
  const [session, setSession] = useState(null);
  const [showCompleteDialog, setShowCompleteDialog] = useState(false);
  const [sessionNotes, setSessionNotes] = useState('');
  const [perceivedExertion, setPerceivedExertion] = useState(5);

  // Handle session completion
  const handleComplete = useCallback(() => {
    setShowCompleteDialog(true);
  }, []);

  // Initialize session execution with the hook
  const sessionExecution = useSessionExecution({
    exercises: session?.mainWorkout?.exercises || [],
    rounds: session?.mainWorkout?.rounds || 1,
    workTime: session?.protocol?.workSeconds || 30,
    restTime: session?.protocol?.restSeconds || 15,
    onComplete: handleComplete
  });

  const {
    currentPhase,
    currentRound,
    timeRemaining,
    totalElapsedTime,
    currentExercise,
    progress,
    isRunning,
    isPaused,
    isComplete,
    start,
    pause,
    resume,
    stop,
    skipToNext,
    skipToPrevious,
    formatTime
  } = sessionExecution;

  // Load session from localStorage on mount
  useEffect(() => {
    const storedSession = localStorage.getItem('currentHiitSession');
    if (storedSession) {
      const parsedSession = JSON.parse(storedSession);
      setSession(parsedSession);
    }
  }, []);

  // Show dialog when session is complete
  useEffect(() => {
    if (isComplete) {
      setShowCompleteDialog(true);
    }
  }, [isComplete]);

  const handlePlayPause = () => {
    if (isRunning) {
      pause();
    } else if (isPaused) {
      resume();
    } else {
      start();
    }
  };

  const handleStop = () => {
    stop();
    setShowCompleteDialog(true);
  };

  const handleSaveSession = async () => {
    if (!session) return;

    // Get plan context from session storage if it exists
    const planContextStr = sessionStorage.getItem('currentWorkoutPlanContext');
    const planContext = planContextStr ? JSON.parse(planContextStr) : null;

    const completedSession = {
      type: session.type || 'hiit',
      date: Date.now(),
      duration: totalElapsedTime || session.totalDuration,
      level: session.level,
      protocol: session.protocol?.name,
      modality: session.type,
      perceivedExertion,
      notes: sessionNotes,
      completed: true,
      metadata: session.metadata,
      planId: planContext?.planId || null,
      planDay: planContext?.planDay ?? null
    };

    await saveHiitSession(completedSession);
    
    // Clear plan context from session storage
    sessionStorage.removeItem('currentWorkoutPlanContext');
    
    setShowCompleteDialog(false);
    if (onNavigate) {
      onNavigate('progress');
    }
  };

  const getCurrentExerciseInfo = () => {
    if (!session) return null;

    // The hook uses 'work', 'rest', 'warmup', 'cooldown', 'complete' phases
    if (currentPhase === 'warmup') {
      return {
        title: 'Warm-up',
        description: session.warmup?.exercises?.map(ex => ex.name).join(', ') || 'Prepare your body',
        icon: <FitnessCenter />
      };
    }

    if (currentPhase === 'work' || currentPhase === 'rest') {
      const exercise = currentExercise;
      if (!exercise) return null;

      return {
        title: exercise.name || exercise['Exercise Name'] || 'Exercise',
        description: `Round ${currentRound + 1} of ${session.mainWorkout?.rounds || 1}`,
        muscles: `${exercise.primaryMuscle || exercise['Primary Muscle'] || ''}${(exercise.secondaryMuscles || exercise['Secondary Muscles']) ? ` • ${exercise.secondaryMuscles || exercise['Secondary Muscles']}` : ''}`,
        modification: exercise.modification || exercise['Modification'],
        icon: <FitnessCenter />
      };
    }

    if (currentPhase === 'cooldown') {
      return {
        title: 'Cool-down',
        description: session.cooldown?.exercises?.map(ex => ex.name).join(', ') || 'Stretch and recover',
        icon: <CheckCircle />
      };
    }

    if (currentPhase === 'complete') {
      return {
        title: 'Session Complete!',
        description: 'Great work!',
        icon: <CheckCircle />
      };
    }

    return null;
  };

  if (!session) {
    return (
      <Box sx={{ 
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '50vh',
        gap: 2,
        p: 3
      }}>
        <Typography variant="h6" color="text.secondary">
          No session loaded
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
          Please select a HIIT session from the calendar or generate a new session.
        </Typography>
        {onNavigate && (
          <Button 
            variant="contained" 
            color="primary"
            onClick={() => onNavigate('hiit-selection')}
          >
            Generate HIIT Session
          </Button>
        )}
      </Box>
    );
  }

  // Validate session has required data
  if (!session.mainWorkout || !session.mainWorkout.exercises || session.mainWorkout.exercises.length === 0) {
    return (
      <Box sx={{ 
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '50vh',
        gap: 2,
        p: 3
      }}>
        <Typography variant="h6" color="error">
          Invalid session data
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
          This session does not have exercises. Please regenerate the session or select a different one.
        </Typography>
        {onNavigate && (
          <Button 
            variant="contained" 
            color="primary"
            onClick={() => onNavigate('hiit-selection')}
          >
            Generate New Session
          </Button>
        )}
      </Box>
    );
  }

  const exerciseInfo = getCurrentExerciseInfo();

  return (
    <Box sx={{ width: '100%', minHeight: '100vh' }}>
      <CompactHeader 
        title={session.protocol?.name || 'HIIT Session'} 
        icon="🔥"
        action={
          <Chip 
            label={`${session.level || 'intermediate'} level`} 
            color="primary" 
            size="small"
          />
        }
      />
      
      <motion.div
        className="screen"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        style={{ padding: '1rem', maxWidth: '900px', margin: '0 auto' }}
      >

      {/* Progress Bar */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="subtitle2" gutterBottom id="session-progress-label">
            Session Progress
          </Typography>
          <LinearProgress 
            variant="determinate" 
            value={progress} 
            sx={{ height: 8, borderRadius: 4 }}
            aria-labelledby="session-progress-label"
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={100}
          />
        </CardContent>
      </Card>

      {/* Current Exercise/Phase Card */}
      <Card sx={{ mb: 3, bgcolor: currentPhase === 'work' ? 'rgba(237, 63, 39, 0.05)' : 'background.paper' }}>
        <CardContent>
          <Stack spacing={2}>
            {/* Phase Indicator */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {exerciseInfo?.icon}
              <Typography variant="overline" sx={{ fontWeight: 600 }} aria-live="polite">
                {currentPhase === 'work' && 'WORK'}
                {currentPhase === 'rest' && 'REST'}
                {currentPhase === 'warmup' && 'WARMUP'}
                {currentPhase === 'cooldown' && 'COOLDOWN'}
                {currentPhase === 'complete' && 'COMPLETE'}
              </Typography>
            </Box>

            {/* Exercise Name */}
            <Typography variant="h3" sx={{ fontWeight: 700, color: 'primary.main' }} role="heading" aria-level={1}>
              {exerciseInfo?.title}
            </Typography>

            {/* Exercise Details */}
            <Typography variant="body1" color="text.secondary">
              {exerciseInfo?.description}
            </Typography>

            {exerciseInfo?.muscles && (
              <Typography variant="body2" color="text.secondary">
                <strong>Muscles:</strong> {exerciseInfo.muscles}
              </Typography>
            )}

            {exerciseInfo?.modification && (
              <Alert severity="info" sx={{ mt: 1 }}>
                <strong>Lower-Impact Alternative:</strong> {exerciseInfo.modification}
              </Alert>
            )}

            {/* Timer */}
            <Box sx={{ 
              textAlign: 'center', 
              py: 3,
              bgcolor: 'rgba(19, 70, 134, 0.05)',
              borderRadius: 2
            }}>
              <TimerIcon sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} aria-hidden="true" />
              <Typography 
                variant="h2" 
                sx={{ fontWeight: 800, color: 'primary.main' }}
                aria-live="polite"
                aria-atomic="true"
                role="timer"
              >
                {formatTime(timeRemaining)}
              </Typography>
            </Box>

            {/* Controls */}
            <Stack direction="row" spacing={2} justifyContent="center">
              <IconButton 
                onClick={skipToPrevious}
                size="large"
                aria-label="Previous exercise"
                sx={{ 
                  bgcolor: 'secondary.main',
                  color: 'white',
                  '&:hover': { bgcolor: 'secondary.dark' },
                  minWidth: 64,
                  minHeight: 64
                }}
              >
                <SkipPrevious />
              </IconButton>

              <IconButton 
                onClick={handlePlayPause}
                size="large"
                aria-label={isRunning ? 'Pause session' : isPaused ? 'Resume session' : 'Start session'}
                sx={{ 
                  bgcolor: 'primary.main',
                  color: 'white',
                  '&:hover': { bgcolor: 'primary.dark' },
                  minWidth: 64,
                  minHeight: 64
                }}
              >
                {isRunning ? <Pause /> : <PlayArrow />}
              </IconButton>

              <IconButton 
                onClick={skipToNext}
                size="large"
                aria-label="Skip to next exercise"
                sx={{ 
                  bgcolor: 'warning.main',
                  color: 'white',
                  '&:hover': { bgcolor: 'warning.dark' },
                  minWidth: 64,
                  minHeight: 64
                }}
              >
                <SkipNext />
              </IconButton>

              <IconButton 
                onClick={handleStop}
                size="large"
                aria-label="Stop session"
                sx={{ 
                  bgcolor: 'error.main',
                  color: 'white',
                  '&:hover': { bgcolor: 'error.dark' },
                  minWidth: 64,
                  minHeight: 64
                }}
              >
                <Stop />
              </IconButton>
            </Stack>
          </Stack>
        </CardContent>
      </Card>

      {/* Session Details */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Session Details
          </Typography>
          <Stack spacing={1}>
            <Typography variant="body2">
              <strong>Total Duration:</strong> {formatTime(session.totalDuration || 0)}
            </Typography>
            <Typography variant="body2">
              <strong>Work/Rest Ratio:</strong> {session.protocol?.workSeconds}:{session.protocol?.restSeconds}s
            </Typography>
            {session.mainWorkout?.rounds && (
              <Typography variant="body2">
                <strong>Rounds:</strong> {session.mainWorkout.rounds}
              </Typography>
            )}
            <Typography variant="caption" color="text.secondary">
              Guide Reference: {session.guideReference || session.metadata?.guideSource || 'HIIT-YOGA-GUIDE.md'}
            </Typography>
          </Stack>
        </CardContent>
      </Card>

      {/* Session Complete Dialog */}
      <Dialog open={showCompleteDialog} onClose={() => setShowCompleteDialog(false)}>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CheckCircle color="success" />
            Session Complete!
          </Box>
        </DialogTitle>
        <DialogContent>
          <Stack spacing={3}>
            <Typography>
              Great work! How was your session?
            </Typography>

            <TextField
              label="Rate Your Exertion (1-10)"
              type="number"
              value={perceivedExertion}
              onChange={(e) => setPerceivedExertion(Math.min(10, Math.max(1, parseInt(e.target.value) || 5)))}
              inputProps={{ min: 1, max: 10 }}
              fullWidth
              helperText="1 = Very Easy, 10 = Maximum Effort"
            />

            <TextField
              label="Session Notes (optional)"
              multiline
              rows={3}
              value={sessionNotes}
              onChange={(e) => setSessionNotes(e.target.value)}
              fullWidth
              placeholder="How did you feel? Any observations?"
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowCompleteDialog(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleSaveSession}
            variant="contained"
            color="primary"
          >
            Save Session
          </Button>
        </DialogActions>
      </Dialog>
    </motion.div>
    </Box>
  );
};

HiitSessionScreen.propTypes = {
  onNavigate: PropTypes.func.isRequired,
};

export default HiitSessionScreen;
