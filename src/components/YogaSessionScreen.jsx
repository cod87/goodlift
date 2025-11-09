/**
 * Yoga Session Execution Screen
 * 
 * Displays and guides users through generated Yoga sessions
 * with pose sequences, hold timers, and breathing instructions
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
  SkipPrevious,
  Timer as TimerIcon,
  CheckCircle,
  SelfImprovement,
  Spa
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { saveYogaSession } from '../utils/storage';
import CompactHeader from './Common/CompactHeader';
import { useSessionExecution } from '../hooks/useSessionExecution';

const YogaSessionScreen = ({ onNavigate }) => {
  const [session, setSession] = useState(null);
  const [showCompleteDialog, setShowCompleteDialog] = useState(false);
  const [sessionNotes, setSessionNotes] = useState('');
  const [perceivedExertion, setPerceivedExertion] = useState(5);


  // Flatten all poses from all sequences for the session execution hook
  const getAllPoses = useCallback(() => {
    if (!session) return [];
    
    const allPoses = [];
    
    // Add warmup poses
    if (session.warmup?.poses) {
      allPoses.push(...session.warmup.poses);
    }
    
    // Add main practice poses from all sequences
    if (session.mainPractice?.sequences) {
      session.mainPractice.sequences.forEach(sequence => {
        if (sequence.poses) {
          allPoses.push(...sequence.poses);
        }
      });
    }
    
    // Add cooldown poses
    if (session.cooldown?.poses) {
      allPoses.push(...session.cooldown.poses);
    }
    
    return allPoses;
  }, [session]);

  // Handle session completion
  const handleComplete = useCallback(() => {
    setShowCompleteDialog(true);
  }, []);

  // Get average hold duration for poses
  const getAverageHoldDuration = useCallback(() => {
    const poses = getAllPoses();
    if (poses.length === 0) return 30;
    
    const totalDuration = poses.reduce((sum, pose) => sum + (pose.holdDuration || 30), 0);
    return Math.round(totalDuration / poses.length);
  }, [getAllPoses]);

  // Initialize session execution with the hook
  const sessionExecution = useSessionExecution({
    exercises: getAllPoses(),
    rounds: 1, // Yoga sessions don't repeat
    workTime: getAverageHoldDuration(), // Average hold time
    restTime: 5, // Brief transition time between poses
    onComplete: handleComplete
  });

  const {
    currentPhase,
    currentExerciseIndex,
    timeRemaining,
    totalElapsedTime,
    currentExercise: currentPose,
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
    const storedSession = localStorage.getItem('currentYogaSession');
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

    const completedSession = {
      type: session.type || 'yoga',
      date: Date.now(),
      duration: totalElapsedTime || session.totalDuration,
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

  const getCurrentPoseInfo = () => {
    if (!session || !currentPose) return null;

    // The hook provides the current pose directly
    const pose = currentPose;
    
    // Determine which phase we're in based on pose index
    const warmupPoseCount = session.warmup?.poses?.length || 0;
    const allMainPoses = session.mainPractice?.sequences?.reduce((acc, seq) => acc + (seq.poses?.length || 0), 0) || 0;
    
    let phaseLabel = 'PRACTICE';
    if (currentExerciseIndex < warmupPoseCount) {
      phaseLabel = 'WARMUP';
    } else if (currentExerciseIndex >= warmupPoseCount + allMainPoses) {
      phaseLabel = 'COOLDOWN';
    }

    if (currentPhase === 'work') {
      return {
        title: pose.name || pose.Name || 'Pose',
        description: pose.sanskritName || pose.Sanskrit || '',
        muscles: `${pose.primaryMuscles || pose['Primary Muscles'] || ''}${(pose.secondaryMuscles || pose['Secondary Muscles']) ? ` • ${pose.secondaryMuscles || pose['Secondary Muscles']}` : ''}`,
        benefits: pose.benefits || pose.Benefits,
        instruction: pose.instruction || pose.Instruction,
        icon: <SelfImprovement />,
        phaseLabel
      };
    }

    if (currentPhase === 'rest') {
      return {
        title: 'Transition',
        description: 'Prepare for next pose',
        icon: <Spa />,
        phaseLabel: 'TRANSITION'
      };
    }

    if (currentPhase === 'warmup') {
      return {
        title: session.opening?.name || 'Opening Meditation',
        description: session.opening?.description || 'Set your intention',
        breathingTechnique: session.breathingTechnique,
        icon: <Spa />,
        phaseLabel: 'OPENING'
      };
    }

    if (currentPhase === 'complete') {
      return {
        title: 'Namaste 🙏',
        description: 'Session complete',
        icon: <CheckCircle />,
        phaseLabel: 'COMPLETE'
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
          Please select a yoga session from the calendar or generate a new session.
        </Typography>
        {onNavigate && (
          <Button 
            variant="contained" 
            color="primary"
            onClick={() => onNavigate('yoga-selection')}
          >
            Generate Yoga Session
          </Button>
        )}
      </Box>
    );
  }

  // Validate session has required data
  if (!session.mainPractice || !session.mainPractice.sequences || session.mainPractice.sequences.length === 0) {
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
          This session does not have poses. Please regenerate the session or select a different one.
        </Typography>
        {onNavigate && (
          <Button 
            variant="contained" 
            color="primary"
            onClick={() => onNavigate('yoga-selection')}
          >
            Generate New Session
          </Button>
        )}
      </Box>
    );
  }

  const poseInfo = getCurrentPoseInfo();

  return (
    <Box sx={{ width: '100%', minHeight: '100vh' }}>
      <CompactHeader 
        title={session.name || 'Yoga Session'} 
        icon="🧘"
        action={
          <Stack direction="row" spacing={1}>
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
          <Typography variant="subtitle2" gutterBottom id="yoga-session-progress-label">
            Session Progress
          </Typography>
          <LinearProgress 
            variant="determinate" 
            value={progress} 
            sx={{ height: 8, borderRadius: 4 }}
            aria-labelledby="yoga-session-progress-label"
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={100}
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
              <Typography variant="overline" sx={{ fontWeight: 600 }} aria-live="polite">
                {poseInfo?.phaseLabel || currentPhase.toUpperCase()}
              </Typography>
            </Box>

            {/* Pose Name */}
            <Typography variant="h3" sx={{ fontWeight: 700, color: 'primary.main' }} role="heading" aria-level={1}>
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
            {poseInfo?.benefits && Array.isArray(poseInfo.benefits) && (
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
              <Typography variant="caption" color="text.secondary">
                Hold Time
              </Typography>
            </Box>

            {/* Controls */}
            <Stack direction="row" spacing={2} justifyContent="center">
              <IconButton 
                onClick={skipToPrevious}
                size="large"
                aria-label="Previous pose"
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
                aria-label="Skip to next pose"
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
    </Box>
  );
};

YogaSessionScreen.propTypes = {
  onNavigate: PropTypes.func.isRequired,
};

export default YogaSessionScreen;
