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
  Timer as TimerIcon,
  CheckCircle,
  FitnessCenter
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { saveHiitSession } from '../utils/storage';
import CompactHeader from './Common/CompactHeader';

const HiitSessionScreen = ({ onNavigate }) => {
  const [session, setSession] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [currentPhase, setCurrentPhase] = useState('warmup'); // 'warmup', 'main', 'cooldown', 'complete'
  const [currentRound, setCurrentRound] = useState(0);
  const [currentExercise, setCurrentExercise] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isWorkInterval, setIsWorkInterval] = useState(true);
  const [showCompleteDialog, setShowCompleteDialog] = useState(false);
  const [sessionNotes, setSessionNotes] = useState('');
  const [perceivedExertion, setPerceivedExertion] = useState(5);

  // Load session from localStorage on mount
  useEffect(() => {
    const storedSession = localStorage.getItem('currentHiitSession');
    if (storedSession) {
      const parsedSession = JSON.parse(storedSession);
      setSession(parsedSession);
      
      // Set initial time based on session structure
      if (parsedSession.warmup) {
        setTimeRemaining(parsedSession.warmup.duration);
      }
    }
  }, []);

  const handleNextPhase = useCallback(() => {
    if (!session) return;

    if (currentPhase === 'warmup') {
      // Move to main workout
      setCurrentPhase('main');
      setCurrentRound(0);
      setCurrentExercise(0);
      setIsWorkInterval(true);
      
      if (session.mainWorkout?.exercises) {
        setTimeRemaining(session.mainWorkout.exercises[0].workSeconds);
      }
    } else if (currentPhase === 'main') {
      const exercises = session.mainWorkout?.exercises || [];
      const rounds = session.mainWorkout?.rounds || 1;

      if (isWorkInterval) {
        // Switch to rest interval
        setIsWorkInterval(false);
        setTimeRemaining(exercises[currentExercise]?.restSeconds || 0);
      } else {
        // Move to next exercise
        if (currentExercise < exercises.length - 1) {
          setCurrentExercise(prev => prev + 1);
          setIsWorkInterval(true);
          setTimeRemaining(exercises[currentExercise + 1]?.workSeconds || 0);
        } else {
          // Move to next round or cooldown
          if (currentRound < rounds - 1) {
            setCurrentRound(prev => prev + 1);
            setCurrentExercise(0);
            setIsWorkInterval(true);
            setTimeRemaining(exercises[0]?.workSeconds || 0);
          } else {
            // Move to cooldown
            setCurrentPhase('cooldown');
            setTimeRemaining(session.cooldown?.duration || 0);
          }
        }
      }
    } else if (currentPhase === 'cooldown') {
      // Session complete
      setCurrentPhase('complete');
      setIsRunning(false);
      setShowCompleteDialog(true);
    }
  }, [session, currentPhase, isWorkInterval, currentExercise, currentRound]);

  // Timer logic
  useEffect(() => {
    let interval = null;

    if (isRunning && timeRemaining > 0) {
      interval = setInterval(() => {
        setTimeRemaining(prev => prev - 1);
      }, 1000);
    } else if (timeRemaining === 0 && isRunning) {
      // Move to next phase/exercise
      handleNextPhase();
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, timeRemaining, handleNextPhase]);

  const handlePlayPause = () => {
    setIsRunning(!isRunning);
  };

  const handleStop = () => {
    setIsRunning(false);
    setShowCompleteDialog(true);
  };

  const handleSkip = () => {
    setTimeRemaining(0);
  };

  const handleSaveSession = async () => {
    if (!session) return;

    const completedSession = {
      type: session.type || 'hiit',
      date: Date.now(),
      duration: session.totalDuration,
      level: session.level,
      protocol: session.protocol?.name,
      modality: session.type,
      perceivedExertion,
      notes: sessionNotes,
      completed: true,
      metadata: session.metadata
    };

    await saveHiitSession(completedSession);
    setShowCompleteDialog(false);
    if (onNavigate) {
      onNavigate('progress');
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getProgress = () => {
    if (!session) return 0;

    const totalPhases = 3; // warmup, main, cooldown
    let completedPhases = 0;

    if (currentPhase === 'main') completedPhases = 1;
    if (currentPhase === 'cooldown') completedPhases = 2;
    if (currentPhase === 'complete') completedPhases = 3;

    return (completedPhases / totalPhases) * 100;
  };

  const getCurrentExerciseInfo = () => {
    if (!session) return null;

    if (currentPhase === 'warmup') {
      return {
        title: 'Warm-up',
        description: session.warmup?.exercises?.map(ex => ex.name).join(', ') || 'Prepare your body',
        icon: <FitnessCenter />
      };
    }

    if (currentPhase === 'main') {
      const exercise = session.mainWorkout?.exercises?.[currentExercise];
      if (!exercise) return null;

      return {
        title: exercise.name,
        description: `Round ${currentRound + 1} of ${session.mainWorkout?.rounds}`,
        muscles: `${exercise.primaryMuscle}${exercise.secondaryMuscles ? ` • ${exercise.secondaryMuscles}` : ''}`,
        modification: exercise.modification,
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
          <Typography variant="subtitle2" gutterBottom>
            Session Progress
          </Typography>
          <LinearProgress 
            variant="determinate" 
            value={getProgress()} 
            sx={{ height: 8, borderRadius: 4 }}
          />
        </CardContent>
      </Card>

      {/* Current Exercise/Phase Card */}
      <Card sx={{ mb: 3, bgcolor: isWorkInterval && currentPhase === 'main' ? 'rgba(237, 63, 39, 0.05)' : 'background.paper' }}>
        <CardContent>
          <Stack spacing={2}>
            {/* Phase Indicator */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {exerciseInfo?.icon}
              <Typography variant="overline" sx={{ fontWeight: 600 }}>
                {currentPhase === 'main' && (isWorkInterval ? 'WORK' : 'REST')}
                {currentPhase === 'warmup' && 'WARMUP'}
                {currentPhase === 'cooldown' && 'COOLDOWN'}
              </Typography>
            </Box>

            {/* Exercise Name */}
            <Typography variant="h3" sx={{ fontWeight: 700, color: 'primary.main' }}>
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
              <TimerIcon sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />
              <Typography variant="h2" sx={{ fontWeight: 800, color: 'primary.main' }}>
                {formatTime(timeRemaining)}
              </Typography>
            </Box>

            {/* Controls */}
            <Stack direction="row" spacing={2} justifyContent="center">
              <IconButton 
                onClick={handlePlayPause}
                size="large"
                sx={{ 
                  bgcolor: 'primary.main',
                  color: 'white',
                  '&:hover': { bgcolor: 'primary.dark' },
                  width: 64,
                  height: 64
                }}
              >
                {isRunning ? <Pause /> : <PlayArrow />}
              </IconButton>

              <IconButton 
                onClick={handleSkip}
                size="large"
                sx={{ 
                  bgcolor: 'warning.main',
                  color: 'white',
                  '&:hover': { bgcolor: 'warning.dark' }
                }}
              >
                <SkipNext />
              </IconButton>

              <IconButton 
                onClick={handleStop}
                size="large"
                sx={{ 
                  bgcolor: 'secondary.main',
                  color: 'white',
                  '&:hover': { bgcolor: 'secondary.dark' }
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
