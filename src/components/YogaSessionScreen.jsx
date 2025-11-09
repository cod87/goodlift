/**
 * Yoga Session Execution Screen
 * 
 * Displays and guides users through generated Yoga sessions
 * with pose sequences, hold timers, and breathing instructions
 */

import { useState, useEffect } from 'react';
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
  TextField,
  List,
  ListItem,
  ListItemText
} from '@mui/material';
import {
  PlayArrow,
  Pause,
  Stop,
  SkipNext,
  Timer as TimerIcon,
  CheckCircle,
  SelfImprovement,
  Spa
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { saveYogaSession } from '../utils/storage';

const YogaSessionScreen = ({ onNavigate }) => {
  const [session, setSession] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [currentPhase, setCurrentPhase] = useState('opening'); // 'opening', 'warmup', 'main', 'cooldown', 'complete'
  const [currentSequence, setCurrentSequence] = useState(0);
  const [currentPose, setCurrentPose] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [showCompleteDialog, setShowCompleteDialog] = useState(false);
  const [sessionNotes, setSessionNotes] = useState('');
  const [perceivedExertion, setPerceivedExertion] = useState(5);

  // Load session from localStorage on mount
  useEffect(() => {
    const storedSession = localStorage.getItem('currentYogaSession');
    if (storedSession) {
      const parsedSession = JSON.parse(storedSession);
      setSession(parsedSession);
      
      // Set initial time based on session structure
      if (parsedSession.opening) {
        setTimeRemaining(parsedSession.opening.duration);
      }
    }
  }, []);

  // Timer logic
  useEffect(() => {
    let interval = null;

    if (isRunning && timeRemaining > 0) {
      interval = setInterval(() => {
        setTimeRemaining(prev => prev - 1);
      }, 1000);
    } else if (timeRemaining === 0 && isRunning) {
      // Move to next phase/pose
      handleNextPhase();
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, timeRemaining]);

  const handleNextPhase = () => {
    if (!session) return;

    if (currentPhase === 'opening') {
      // Move to warmup
      setCurrentPhase('warmup');
      setCurrentPose(0);
      if (session.warmup?.poses) {
        setTimeRemaining(session.warmup.poses[0]?.holdDuration || 0);
      }
    } else if (currentPhase === 'warmup') {
      const poses = session.warmup?.poses || [];
      
      if (currentPose < poses.length - 1) {
        setCurrentPose(prev => prev + 1);
        setTimeRemaining(poses[currentPose + 1]?.holdDuration || 0);
      } else {
        // Move to main practice
        setCurrentPhase('main');
        setCurrentSequence(0);
        setCurrentPose(0);
        if (session.mainPractice?.sequences) {
          const firstPose = session.mainPractice.sequences[0]?.poses?.[0];
          setTimeRemaining(firstPose?.holdDuration || 0);
        }
      }
    } else if (currentPhase === 'main') {
      const sequences = session.mainPractice?.sequences || [];
      const currentSeq = sequences[currentSequence];
      const poses = currentSeq?.poses || [];

      if (currentPose < poses.length - 1) {
        setCurrentPose(prev => prev + 1);
        setTimeRemaining(poses[currentPose + 1]?.holdDuration || 0);
      } else if (currentSequence < sequences.length - 1) {
        // Move to next sequence
        setCurrentSequence(prev => prev + 1);
        setCurrentPose(0);
        const nextSeq = sequences[currentSequence + 1];
        setTimeRemaining(nextSeq?.poses?.[0]?.holdDuration || 0);
      } else {
        // Move to cooldown
        setCurrentPhase('cooldown');
        setCurrentPose(0);
        if (session.cooldown?.poses) {
          setTimeRemaining(session.cooldown.poses[0]?.holdDuration || 0);
        }
      }
    } else if (currentPhase === 'cooldown') {
      const poses = session.cooldown?.poses || [];
      
      if (currentPose < poses.length - 1) {
        setCurrentPose(prev => prev + 1);
        setTimeRemaining(poses[currentPose + 1]?.holdDuration || 0);
      } else {
        // Session complete
        setCurrentPhase('complete');
        setIsRunning(false);
        setShowCompleteDialog(true);
      }
    }
  };

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
      type: session.type || 'yoga',
      date: Date.now(),
      duration: session.totalDuration,
      mode: session.mode,
      level: session.level,
      perceivedExertion,
      notes: sessionNotes,
      completed: true,
      metadata: session.metadata
    };

    await saveYogaSession(completedSession);
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

    const totalPhases = 4; // opening, warmup, main, cooldown
    let completedPhases = 0;

    if (currentPhase === 'warmup') completedPhases = 1;
    if (currentPhase === 'main') completedPhases = 2;
    if (currentPhase === 'cooldown') completedPhases = 3;
    if (currentPhase === 'complete') completedPhases = 4;

    return (completedPhases / totalPhases) * 100;
  };

  const getCurrentPoseInfo = () => {
    if (!session) return null;

    if (currentPhase === 'opening') {
      return {
        title: session.opening?.name || 'Opening Meditation',
        description: session.opening?.description || 'Set your intention',
        breathingTechnique: session.breathingTechnique,
        icon: <Spa />
      };
    }

    if (currentPhase === 'warmup') {
      const pose = session.warmup?.poses?.[currentPose];
      if (!pose) return null;

      return {
        title: pose.name,
        description: pose.sanskritName || '',
        muscles: `${pose.primaryMuscle}${pose.secondaryMuscles ? ` • ${pose.secondaryMuscles}` : ''}`,
        benefits: pose.benefits,
        instruction: pose.instruction,
        icon: <SelfImprovement />
      };
    }

    if (currentPhase === 'main') {
      const sequence = session.mainPractice?.sequences?.[currentSequence];
      const pose = sequence?.poses?.[currentPose];
      if (!pose) return null;

      return {
        title: pose.name,
        description: pose.sanskritName || '',
        sequenceName: sequence.name,
        muscles: `${pose.primaryMuscle}${pose.secondaryMuscles ? ` • ${pose.secondaryMuscles}` : ''}`,
        benefits: pose.benefits,
        instruction: pose.instruction,
        icon: <SelfImprovement />
      };
    }

    if (currentPhase === 'cooldown') {
      const pose = session.cooldown?.poses?.[currentPose];
      if (!pose) return null;

      return {
        title: pose.name,
        description: pose.sanskritName || 'Final relaxation',
        instruction: pose.instruction,
        icon: <CheckCircle />
      };
    }

    return null;
  };

  if (!session) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '50vh' 
      }}>
        <Typography variant="h6" color="text.secondary">
          No session loaded. Please generate a session first.
        </Typography>
      </Box>
    );
  }

  const poseInfo = getCurrentPoseInfo();

  return (
    <motion.div
      className="screen"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      style={{ padding: '1rem', maxWidth: '900px', margin: '0 auto' }}
    >
      {/* Header */}
      <Box sx={{ mb: 3, textAlign: 'center' }}>
        <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main', mb: 1 }}>
          {session.name || 'Yoga Session'}
        </Typography>
        <Stack direction="row" spacing={1} justifyContent="center">
          <Chip 
            label={`${session.level || 'intermediate'} level`} 
            color="primary" 
            size="small"
          />
          <Chip 
            label={session.mode || 'yoga'} 
            color="secondary" 
            size="small"
          />
        </Stack>
      </Box>

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

      {/* Current Pose Card */}
      <Card sx={{ mb: 3, bgcolor: 'rgba(19, 70, 134, 0.02)' }}>
        <CardContent>
          <Stack spacing={2}>
            {/* Phase Indicator */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {poseInfo?.icon}
              <Typography variant="overline" sx={{ fontWeight: 600 }}>
                {currentPhase.toUpperCase()}
                {poseInfo?.sequenceName && ` - ${poseInfo.sequenceName}`}
              </Typography>
            </Box>

            {/* Pose Name */}
            <Typography variant="h3" sx={{ fontWeight: 700, color: 'primary.main' }}>
              {poseInfo?.title}
            </Typography>

            {/* Sanskrit Name */}
            {poseInfo?.description && (
              <Typography variant="h6" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                {poseInfo.description}
              </Typography>
            )}

            {/* Muscles Worked */}
            {poseInfo?.muscles && (
              <Typography variant="body2" color="text.secondary">
                <strong>Muscles:</strong> {poseInfo.muscles}
              </Typography>
            )}

            {/* Instruction */}
            {poseInfo?.instruction && (
              <Alert severity="info">
                <strong>Instruction:</strong> {poseInfo.instruction}
              </Alert>
            )}

            {/* Benefits */}
            {poseInfo?.benefits && (
              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  Benefits:
                </Typography>
                <List dense>
                  {poseInfo.benefits.map((benefit, idx) => (
                    <ListItem key={idx} sx={{ py: 0 }}>
                      <ListItemText primary={benefit} />
                    </ListItem>
                  ))}
                </List>
              </Box>
            )}

            {/* Breathing Technique */}
            {poseInfo?.breathingTechnique && (
              <Alert severity="success">
                <Typography variant="subtitle2" gutterBottom>
                  <strong>{poseInfo.breathingTechnique.name}</strong>
                </Typography>
                <Typography variant="body2">
                  {poseInfo.breathingTechnique.instruction}
                </Typography>
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
              <Typography variant="caption" color="text.secondary">
                Hold Time
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
              <strong>Mode:</strong> {session.name || session.mode}
            </Typography>
            {session.metadata?.parasympatheticBalance && (
              <Chip 
                label="Parasympathetic Activation - Recovery & Calm"
                size="small"
                color="success"
                sx={{ mt: 1 }}
              />
            )}
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
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
            Namaste 🙏
          </Box>
        </DialogTitle>
        <DialogContent>
          <Stack spacing={3}>
            <Typography>
              Session complete. How was your practice?
            </Typography>

            <TextField
              label="Rate Your Experience (1-10)"
              type="number"
              value={perceivedExertion}
              onChange={(e) => setPerceivedExertion(Math.min(10, Math.max(1, parseInt(e.target.value) || 5)))}
              inputProps={{ min: 1, max: 10 }}
              fullWidth
              helperText="1 = Very Easy, 10 = Very Challenging"
            />

            <TextField
              label="Session Notes (optional)"
              multiline
              rows={3}
              value={sessionNotes}
              onChange={(e) => setSessionNotes(e.target.value)}
              fullWidth
              placeholder="How did you feel? Any insights or improvements?"
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
  );
};

YogaSessionScreen.propTypes = {
  onNavigate: PropTypes.func.isRequired,
};

export default YogaSessionScreen;
