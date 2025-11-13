/**
 * UnifiedTimerScreen - Consolidated timer for HIIT, Flow (Yoga), and Countdown (Cardio)
 * 
 * Features:
 * - Three selectable modes: HIIT, Flow (Yoga), Countdown (Cardio)
 * - Visual countdown with circular/ring progress animation
 * - Audio cues at intervals (beep at 10s, 5s, and 0s)
 * - Presets for 20, 30, 45, and 60 minutes
 * - Auto-log session to workout history with quick form
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Stack,
  IconButton,
  Chip,
  ToggleButton,
  ToggleButtonGroup,
  Slider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
} from '@mui/material';
import {
  PlayArrow,
  Pause,
  Stop,
  Replay,
  FitnessCenter,
  SelfImprovement,
  DirectionsRun,
  Add,
  Remove,
  ArrowBack,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import audioService from '../utils/audioService';
import { saveWorkout, saveUserStats, getUserStats } from '../utils/storage';

const TIMER_MODES = {
  HIIT: 'hiit',
  FLOW: 'flow',
  COUNTDOWN: 'countdown',
};

const PRESET_DURATIONS = [20, 30, 45, 60]; // minutes

const YOGA_POSES = [
  { name: 'Mountain Pose (Tadasana)', defaultDuration: 30 },
  { name: 'Downward Dog (Adho Mukha Svanasana)', defaultDuration: 60 },
  { name: 'Warrior I (Virabhadrasana I)', defaultDuration: 45 },
  { name: 'Warrior II (Virabhadrasana II)', defaultDuration: 45 },
  { name: 'Triangle Pose (Trikonasana)', defaultDuration: 45 },
  { name: 'Tree Pose (Vrksasana)', defaultDuration: 30 },
  { name: "Child's Pose (Balasana)", defaultDuration: 60 },
  { name: 'Cat-Cow Pose', defaultDuration: 60 },
  { name: 'Seated Forward Bend (Paschimottanasana)', defaultDuration: 60 },
  { name: 'Cobra Pose (Bhujangasana)', defaultDuration: 30 },
  { name: 'Plank Pose', defaultDuration: 30 },
  { name: 'Bridge Pose (Setu Bandhasana)', defaultDuration: 45 },
];

const UnifiedTimerScreen = ({ onNavigate }) => {
  // Mode and configuration
  const [mode, setMode] = useState(TIMER_MODES.COUNTDOWN);
  const [isConfiguring, setIsConfiguring] = useState(true);
  
  // Timer state
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(20 * 60); // seconds
  const [totalTime, setTotalTime] = useState(20 * 60);
  
  // HIIT mode state
  const [workInterval, setWorkInterval] = useState(30); // seconds
  const [restInterval, setRestInterval] = useState(15); // seconds
  const [rounds, setRounds] = useState(8);
  const [currentRound, setCurrentRound] = useState(1);
  const [isWorkPeriod, setIsWorkPeriod] = useState(true);
  
  // Flow mode state
  const [selectedPoses, setSelectedPoses] = useState([]);
  const [currentPoseIndex, setCurrentPoseIndex] = useState(0);
  const [poseDuration, setPostDuration] = useState(45); // default duration per pose
  
  // Countdown mode state
  const [countdownDuration, setCountdownDuration] = useState(20); // minutes
  
  // Completion dialog
  const [showCompletionDialog, setShowCompletionDialog] = useState(false);
  const [perceivedEffort, setPerceivedEffort] = useState(5);
  const [sessionNotes, setSessionNotes] = useState('');
  
  const timerRef = useRef(null);
  const hasPlayedWarningRef = useRef(false);

  // Initialize audio
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  const handleTimerComplete = useCallback(() => {
    setIsRunning(false);
    clearInterval(timerRef.current);
    audioService.playCompletionFanfare();
    setShowCompletionDialog(true);
  }, []);

  // Main timer logic
  useEffect(() => {
    if (isRunning && !isPaused) {
      timerRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          // Play audio cues
          if (prev === 10 || prev === 5) {
            audioService.playBeep(800, 150);
            hasPlayedWarningRef.current = true;
          } else if (prev === 1) {
            audioService.playBeep(600, 300);
          }

          if (prev <= 1) {
            if (mode === TIMER_MODES.HIIT) {
              // Handle HIIT transitions
              if (isWorkPeriod) {
                // Switch to rest
                setIsWorkPeriod(false);
                audioService.playLowBeep();
                hasPlayedWarningRef.current = false;
                return restInterval;
              } else {
                // End of rest, check if more rounds
                if (currentRound < rounds) {
                  setCurrentRound(currentRound + 1);
                  setIsWorkPeriod(true);
                  audioService.playHighBeep();
                  hasPlayedWarningRef.current = false;
                  return workInterval;
                } else {
                  // HIIT session complete
                  handleTimerComplete();
                  return 0;
                }
              }
            } else if (mode === TIMER_MODES.FLOW) {
              // Handle Flow transitions
              if (currentPoseIndex < selectedPoses.length - 1) {
                setCurrentPoseIndex(currentPoseIndex + 1);
                audioService.playTransitionBeep();
                hasPlayedWarningRef.current = false;
                return selectedPoses[currentPoseIndex + 1].duration;
              } else {
                // Flow session complete
                handleTimerComplete();
                return 0;
              }
            } else {
              // Countdown complete
              handleTimerComplete();
              return 0;
            }
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
  }, [isRunning, isPaused, mode, isWorkPeriod, currentRound, rounds, currentPoseIndex, selectedPoses, workInterval, restInterval, handleTimerComplete]);

  const handleStart = () => {
    if (isConfiguring) {
      // Initialize based on mode
      if (mode === TIMER_MODES.HIIT) {
        setTotalTime(rounds * (workInterval + restInterval));
        setTimeRemaining(workInterval);
        setCurrentRound(1);
        setIsWorkPeriod(true);
      } else if (mode === TIMER_MODES.FLOW) {
        const total = selectedPoses.reduce((sum, pose) => sum + pose.duration, 0);
        setTotalTime(total);
        setTimeRemaining(selectedPoses[0]?.duration || 45);
        setCurrentPoseIndex(0);
      } else {
        const seconds = countdownDuration * 60;
        setTotalTime(seconds);
        setTimeRemaining(seconds);
      }
      setIsConfiguring(false);
    }
    setIsRunning(true);
    setIsPaused(false);
    hasPlayedWarningRef.current = false;
  };

  const handlePause = () => {
    setIsPaused(!isPaused);
  };

  const handleStop = () => {
    setIsRunning(false);
    setIsPaused(false);
    setIsConfiguring(true);
    hasPlayedWarningRef.current = false;
  };

  const handleReset = () => {
    handleStop();
    setCurrentRound(1);
    setIsWorkPeriod(true);
    setCurrentPoseIndex(0);
  };

  const handleModeChange = (event, newMode) => {
    if (newMode !== null) {
      setMode(newMode);
      handleReset();
    }
  };

  const handlePresetSelect = (minutes) => {
    setCountdownDuration(minutes);
  };

  const handleAddPose = (pose) => {
    setSelectedPoses([...selectedPoses, { ...pose, duration: poseDuration }]);
  };

  const handleRemovePose = (index) => {
    setSelectedPoses(selectedPoses.filter((_, i) => i !== index));
  };

  const handleSaveSession = async () => {
    try {
      const sessionData = {
        date: Date.now(),
        type: mode === TIMER_MODES.HIIT ? 'hiit' : mode === TIMER_MODES.FLOW ? 'yoga' : 'cardio',
        duration: Math.floor(totalTime / 60), // convert to minutes
        perceivedEffort,
        notes: sessionNotes,
        exercises: {},
      };

      // Save workout
      await saveWorkout(sessionData);

      // Update stats
      const stats = await getUserStats();
      stats.totalWorkouts += 1;
      stats.totalTime += totalTime;
      await saveUserStats(stats);

      setShowCompletionDialog(false);
      
      // Reset and return to config
      handleReset();
      
      // Navigate back if callback provided
      if (onNavigate) {
        setTimeout(() => onNavigate('selection'), 500);
      }
    } catch (error) {
      console.error('Error saving session:', error);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getProgress = () => {
    if (mode === TIMER_MODES.HIIT) {
      const roundProgress = ((currentRound - 1) / rounds) * 100;
      const withinRoundProgress = isWorkPeriod
        ? (workInterval - timeRemaining) / workInterval
        : (restInterval - timeRemaining) / restInterval;
      return roundProgress + (withinRoundProgress * (100 / rounds));
    } else {
      return ((totalTime - timeRemaining) / totalTime) * 100;
    }
  };

  const progress = getProgress();
  const radius = 120;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <Box sx={{ width: '100%', minHeight: '100vh', p: 3, bgcolor: 'background.default' }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        style={{ maxWidth: '800px', margin: '0 auto' }}
      >
        {/* Back Button */}
        <Box sx={{ mb: 2 }}>
          <Button
            startIcon={<ArrowBack />}
            onClick={() => onNavigate('home')}
            sx={{ color: 'text.secondary' }}
          >
            Back to Work Home
          </Button>
        </Box>
        
        <Typography variant="h4" sx={{ mb: 3, fontWeight: 700, textAlign: 'center' }}>
          Unified Timer
        </Typography>

        {/* Mode Selection */}
        {isConfiguring && (
          <Card sx={{ borderRadius: 3, mb: 3 }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, textAlign: 'center' }}>
                Select Mode
              </Typography>
              <ToggleButtonGroup
                value={mode}
                exclusive
                onChange={handleModeChange}
                fullWidth
                sx={{ mb: 3 }}
              >
                <ToggleButton value={TIMER_MODES.HIIT} sx={{ py: 2 }}>
                  <Stack alignItems="center" spacing={1}>
                    <FitnessCenter />
                    <Typography variant="body2">HIIT</Typography>
                  </Stack>
                </ToggleButton>
                <ToggleButton value={TIMER_MODES.FLOW} sx={{ py: 2 }}>
                  <Stack alignItems="center" spacing={1}>
                    <SelfImprovement />
                    <Typography variant="body2">Flow (Yoga)</Typography>
                  </Stack>
                </ToggleButton>
                <ToggleButton value={TIMER_MODES.COUNTDOWN} sx={{ py: 2 }}>
                  <Stack alignItems="center" spacing={1}>
                    <DirectionsRun />
                    <Typography variant="body2">Countdown</Typography>
                  </Stack>
                </ToggleButton>
              </ToggleButtonGroup>

              {/* Mode-specific configuration */}
              {mode === TIMER_MODES.HIIT && (
                <Stack spacing={3}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                    HIIT Configuration
                  </Typography>
                  <TextField
                    label="Work Interval (seconds)"
                    type="number"
                    value={workInterval}
                    onChange={(e) => setWorkInterval(Math.max(5, parseInt(e.target.value) || 30))}
                    inputProps={{ min: 5, max: 300 }}
                    fullWidth
                  />
                  <TextField
                    label="Rest Interval (seconds)"
                    type="number"
                    value={restInterval}
                    onChange={(e) => setRestInterval(Math.max(5, parseInt(e.target.value) || 15))}
                    inputProps={{ min: 5, max: 300 }}
                    fullWidth
                  />
                  <TextField
                    label="Number of Rounds"
                    type="number"
                    value={rounds}
                    onChange={(e) => setRounds(Math.max(1, parseInt(e.target.value) || 8))}
                    inputProps={{ min: 1, max: 50 }}
                    fullWidth
                  />
                  <Typography variant="body2" color="text.secondary">
                    Total Duration: {Math.floor((rounds * (workInterval + restInterval)) / 60)} minutes
                  </Typography>
                </Stack>
              )}

              {mode === TIMER_MODES.FLOW && (
                <Stack spacing={3}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                    Flow (Yoga) Configuration
                  </Typography>
                  <TextField
                    label="Hold Duration per Pose (seconds)"
                    type="number"
                    value={poseDuration}
                    onChange={(e) => setPostDuration(Math.max(15, parseInt(e.target.value) || 45))}
                    inputProps={{ min: 15, max: 300 }}
                    fullWidth
                  />
                  
                  <Typography variant="subtitle2">
                    Selected Poses ({selectedPoses.length})
                  </Typography>
                  {selectedPoses.length > 0 && (
                    <Stack spacing={1}>
                      {selectedPoses.map((pose, index) => (
                        <Box
                          key={index}
                          sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            p: 1.5,
                            bgcolor: 'background.paper',
                            borderRadius: 1,
                          }}
                        >
                          <Typography variant="body2">{pose.name}</Typography>
                          <Stack direction="row" spacing={1} alignItems="center">
                            <Typography variant="caption" color="text.secondary">
                              {pose.duration}s
                            </Typography>
                            <IconButton
                              size="small"
                              onClick={() => handleRemovePose(index)}
                              sx={{ color: 'error.main' }}
                            >
                              <Remove fontSize="small" />
                            </IconButton>
                          </Stack>
                        </Box>
                      ))}
                    </Stack>
                  )}
                  
                  <FormControl fullWidth>
                    <InputLabel>Add Pose</InputLabel>
                    <Select
                      value=""
                      label="Add Pose"
                      onChange={(e) => {
                        const pose = YOGA_POSES.find(p => p.name === e.target.value);
                        if (pose) handleAddPose(pose);
                      }}
                    >
                      {YOGA_POSES.map((pose) => (
                        <MenuItem key={pose.name} value={pose.name}>
                          {pose.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  
                  {selectedPoses.length > 0 && (
                    <Typography variant="body2" color="text.secondary">
                      Total Duration: {Math.floor(selectedPoses.reduce((sum, p) => sum + p.duration, 0) / 60)} minutes {selectedPoses.reduce((sum, p) => sum + p.duration, 0) % 60} seconds
                    </Typography>
                  )}
                </Stack>
              )}

              {mode === TIMER_MODES.COUNTDOWN && (
                <Stack spacing={3}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                    Countdown Configuration
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Select a preset duration or enter custom:
                  </Typography>
                  <Grid container spacing={2}>
                    {PRESET_DURATIONS.map((duration) => (
                      <Grid item xs={6} sm={3} key={duration}>
                        <Button
                          variant={countdownDuration === duration ? 'contained' : 'outlined'}
                          onClick={() => handlePresetSelect(duration)}
                          fullWidth
                          sx={{ py: 2 }}
                        >
                          {duration} min
                        </Button>
                      </Grid>
                    ))}
                  </Grid>
                  <TextField
                    label="Custom Duration (minutes)"
                    type="number"
                    value={countdownDuration}
                    onChange={(e) => setCountdownDuration(Math.max(1, parseInt(e.target.value) || 20))}
                    inputProps={{ min: 1, max: 240 }}
                    fullWidth
                  />
                </Stack>
              )}
            </CardContent>
          </Card>
        )}

        {/* Timer Display */}
        {!isConfiguring && (
          <Card sx={{ borderRadius: 3, mb: 3 }}>
            <CardContent sx={{ p: 4 }}>
              {/* Mode indicator */}
              <Stack direction="row" justifyContent="center" sx={{ mb: 3 }}>
                <Chip
                  label={
                    mode === TIMER_MODES.HIIT
                      ? 'HIIT'
                      : mode === TIMER_MODES.FLOW
                      ? 'Flow (Yoga)'
                      : 'Countdown'
                  }
                  color="primary"
                  size="medium"
                />
              </Stack>

              {/* Circular Progress */}
              <Box sx={{ textAlign: 'center', mb: 3, position: 'relative' }}>
                <svg
                  width="280"
                  height="280"
                  style={{ transform: 'rotate(-90deg)', margin: '0 auto', display: 'block' }}
                >
                  {/* Background circle */}
                  <circle
                    cx="140"
                    cy="140"
                    r={radius}
                    stroke="#e0e0e0"
                    strokeWidth="12"
                    fill="none"
                  />
                  {/* Progress circle */}
                  <circle
                    cx="140"
                    cy="140"
                    r={radius}
                    stroke={
                      mode === TIMER_MODES.HIIT && isWorkPeriod
                        ? '#4caf50'
                        : mode === TIMER_MODES.HIIT && !isWorkPeriod
                        ? '#f44336'
                        : '#1976d2'
                    }
                    strokeWidth="12"
                    fill="none"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    style={{ transition: 'stroke-dashoffset 0.5s ease' }}
                  />
                </svg>
                
                {/* Timer in center */}
                <Box
                  sx={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    textAlign: 'center',
                  }}
                >
                  <Typography
                    variant="h1"
                    sx={{
                      fontSize: '4rem',
                      fontWeight: 700,
                      color:
                        mode === TIMER_MODES.HIIT && isWorkPeriod
                          ? 'success.main'
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
                      <Typography variant="h6" sx={{ mt: 1, fontWeight: 600 }}>
                        {isWorkPeriod ? 'WORK' : 'REST'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Round {currentRound} / {rounds}
                      </Typography>
                    </>
                  )}
                  
                  {mode === TIMER_MODES.FLOW && selectedPoses[currentPoseIndex] && (
                    <Typography variant="h6" sx={{ mt: 1, fontWeight: 600, maxWidth: '200px' }}>
                      {selectedPoses[currentPoseIndex].name}
                    </Typography>
                  )}
                </Box>
              </Box>

              {/* Flow mode pose info */}
              {mode === TIMER_MODES.FLOW && selectedPoses[currentPoseIndex] && (
                <Box sx={{ mb: 3, textAlign: 'center' }}>
                  <Typography variant="body2" color="text.secondary">
                    Pose {currentPoseIndex + 1} of {selectedPoses.length}
                  </Typography>
                </Box>
              )}

              {/* Controls */}
              <Stack direction="row" spacing={2} justifyContent="center">
                {!isRunning ? (
                  <Button
                    variant="contained"
                    size="large"
                    startIcon={<PlayArrow />}
                    onClick={handleStart}
                    sx={{ px: 4, py: 1.5 }}
                    disabled={mode === TIMER_MODES.FLOW && selectedPoses.length === 0}
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
                  </>
                )}
              </Stack>
            </CardContent>
          </Card>
        )}

        {/* Start Button for configuration */}
        {isConfiguring && (
          <Button
            variant="contained"
            size="large"
            fullWidth
            onClick={handleStart}
            disabled={mode === TIMER_MODES.FLOW && selectedPoses.length === 0}
            sx={{ mb: 2, py: 2 }}
          >
            {mode === TIMER_MODES.FLOW && selectedPoses.length === 0
              ? 'Add at least one pose to start'
              : 'Start Session'}
          </Button>
        )}

        {/* Back Button */}
        {onNavigate && (
          <Button
            variant="outlined"
            fullWidth
            onClick={() => onNavigate('selection')}
            sx={{ mt: 2 }}
          >
            Back to Home
          </Button>
        )}

        {/* Completion Dialog */}
        <Dialog
          open={showCompletionDialog}
          onClose={() => setShowCompletionDialog(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Session Complete! 🎉</DialogTitle>
          <DialogContent>
            <Stack spacing={3} sx={{ mt: 2 }}>
              <Typography variant="body1">
                Great work! How would you rate this session?
              </Typography>
              
              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  Perceived Effort (1-10)
                </Typography>
                <Slider
                  value={perceivedEffort}
                  onChange={(e, value) => setPerceivedEffort(value)}
                  min={1}
                  max={10}
                  marks
                  valueLabelDisplay="on"
                  sx={{ mt: 2 }}
                />
              </Box>

              <TextField
                label="Notes (optional)"
                multiline
                rows={3}
                value={sessionNotes}
                onChange={(e) => setSessionNotes(e.target.value)}
                fullWidth
              />

              <Box sx={{ p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  Type: {mode === TIMER_MODES.HIIT ? 'HIIT' : mode === TIMER_MODES.FLOW ? 'Yoga' : 'Cardio'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Duration: {Math.floor(totalTime / 60)} minutes
                </Typography>
              </Box>
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowCompletionDialog(false)}>Skip</Button>
            <Button variant="contained" onClick={handleSaveSession}>
              Save & Sync
            </Button>
          </DialogActions>
        </Dialog>
      </motion.div>
    </Box>
  );
};

UnifiedTimerScreen.propTypes = {
  onNavigate: PropTypes.func,
};

export default UnifiedTimerScreen;
