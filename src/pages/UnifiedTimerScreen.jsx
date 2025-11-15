/**
 * UnifiedTimerScreen - Consolidated timer for HIIT, Yoga, and Cardio
 * 
 * Features:
 * - Three selectable modes: HIIT, Yoga, Cardio
 * - Visual countdown with circular/ring progress animation
 * - Audio cues at intervals (beep at 10s, 5s, and 0s)
 * - Custom duration input for Cardio mode
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
  SkipNext,
  SkipPrevious,
  Save,
  Delete,
  Edit,
  Favorite,
  FavoriteBorder,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import audioService from '../utils/audioService';
import { 
  saveWorkout, 
  saveUserStats, 
  getUserStats,
  getYogaPresets,
  saveYogaPreset,
  deleteYogaPreset,
  getHiitPresets,
  saveHiitPreset,
  deleteHiitPreset,
} from '../utils/storage';

const TIMER_MODES = {
  HIIT: 'hiit',
  FLOW: 'flow',
  CARDIO: 'cardio',
};

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

const UnifiedTimerScreen = ({ onNavigate, hideBackButton = false }) => {
  // Mode and configuration
  const [mode, setMode] = useState(TIMER_MODES.CARDIO);
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
  const [preparationInterval, setPreparationInterval] = useState(10); // seconds
  const [recoveryInterval, setRecoveryInterval] = useState(0); // seconds, 0 means disabled
  const [recoveryAfterRounds, setRecoveryAfterRounds] = useState(4); // recovery after N rounds
  const [sessionName, setSessionName] = useState('');
  const [workIntervalNames, setWorkIntervalNames] = useState([]); // Array of custom exercise names for each work interval
  const [intervalNames, setIntervalNames] = useState({ prep: 'Get Ready', recovery: 'Recovery' });
  const [isPrepPeriod, setIsPrepPeriod] = useState(false);
  const [isRecoveryPeriod, setIsRecoveryPeriod] = useState(false);
  
  // Flow mode state
  const [selectedPoses, setSelectedPoses] = useState([]);
  const [currentPoseIndex, setCurrentPoseIndex] = useState(0);
  const [poseDuration, setPostDuration] = useState(45); // default duration per pose
  
  // Cardio mode state
  const [cardioDuration, setCardioDuration] = useState(20); // minutes
  
  // Presets
  const [yogaPresets, setYogaPresets] = useState([]);
  const [hiitPresets, setHiitPresets] = useState([]);
  const [showPresetDialog, setShowPresetDialog] = useState(false);
  const [presetName, setPresetName] = useState('');
  const [editingPreset, setEditingPreset] = useState(null);
  
  // Completion dialog
  const [showCompletionDialog, setShowCompletionDialog] = useState(false);
  const [perceivedEffort, setPerceivedEffort] = useState(5);
  const [sessionNotes, setSessionNotes] = useState('');
  
  const timerRef = useRef(null);
  const hasPlayedWarningRef = useRef(false);

  // Load presets on mount
  useEffect(() => {
    const loadPresets = async () => {
      try {
        const yoga = getYogaPresets();
        const hiit = getHiitPresets();
        setYogaPresets(yoga);
        setHiitPresets(hiit);
      } catch (error) {
        console.error('Error loading presets:', error);
      }
    };
    loadPresets();
  }, []);

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
              if (isPrepPeriod) {
                // End of preparation, start first work interval
                setIsPrepPeriod(false);
                setIsWorkPeriod(true);
                audioService.playHighBeep();
                hasPlayedWarningRef.current = false;
                return workInterval;
              } else if (isRecoveryPeriod) {
                // End of recovery, back to work
                setIsRecoveryPeriod(false);
                setIsWorkPeriod(true);
                audioService.playHighBeep();
                hasPlayedWarningRef.current = false;
                return workInterval;
              } else if (isWorkPeriod) {
                // Switch to rest
                setIsWorkPeriod(false);
                audioService.playLowBeep();
                hasPlayedWarningRef.current = false;
                return restInterval;
              } else {
                // End of rest
                if (currentRound < rounds) {
                  // Check if we need a recovery break
                  if (recoveryInterval > 0 && recoveryAfterRounds > 0 && currentRound % recoveryAfterRounds === 0) {
                    setIsRecoveryPeriod(true);
                    audioService.playTransitionBeep();
                    hasPlayedWarningRef.current = false;
                    return recoveryInterval;
                  } else {
                    // Continue to next round
                    setCurrentRound(currentRound + 1);
                    setIsWorkPeriod(true);
                    audioService.playHighBeep();
                    hasPlayedWarningRef.current = false;
                    return workInterval;
                  }
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
              // Cardio complete
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
  }, [isRunning, isPaused, mode, isWorkPeriod, isPrepPeriod, isRecoveryPeriod, currentRound, rounds, currentPoseIndex, selectedPoses, workInterval, restInterval, recoveryInterval, recoveryAfterRounds, handleTimerComplete]);

  const handleStart = () => {
    if (isConfiguring) {
      // Initialize based on mode
      if (mode === TIMER_MODES.HIIT) {
        const totalRecoveries = recoveryInterval > 0 && recoveryAfterRounds > 0 
          ? Math.floor(rounds / recoveryAfterRounds) * recoveryInterval 
          : 0;
        setTotalTime(preparationInterval + rounds * (workInterval + restInterval) + totalRecoveries);
        
        // Start with preparation if enabled
        if (preparationInterval > 0) {
          setTimeRemaining(preparationInterval);
          setIsPrepPeriod(true);
          setIsWorkPeriod(false);
        } else {
          setTimeRemaining(workInterval);
          setIsPrepPeriod(false);
          setIsWorkPeriod(true);
        }
        setCurrentRound(1);
        setIsRecoveryPeriod(false);
      } else if (mode === TIMER_MODES.FLOW) {
        const total = selectedPoses.reduce((sum, pose) => sum + pose.duration, 0);
        setTotalTime(total);
        setTimeRemaining(selectedPoses[0]?.duration || 45);
        setCurrentPoseIndex(0);
      } else {
        const seconds = cardioDuration * 60;
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
    setIsPrepPeriod(false);
    setIsRecoveryPeriod(false);
    setCurrentPoseIndex(0);
  };

  const handleModeChange = (event, newMode) => {
    if (newMode !== null) {
      setMode(newMode);
      handleReset();
    }
  };

  const handleAddPose = (pose) => {
    setSelectedPoses([...selectedPoses, { ...pose, duration: poseDuration }]);
  };

  const handleRemovePose = (index) => {
    setSelectedPoses(selectedPoses.filter((_, i) => i !== index));
  };

  // Skip forward to next interval (HIIT or Yoga)
  const handleSkipForward = () => {
    if (mode === TIMER_MODES.HIIT) {
      // Skip to next phase in HIIT
      if (isPrepPeriod) {
        setIsPrepPeriod(false);
        setIsWorkPeriod(true);
        setTimeRemaining(workInterval);
      } else if (isWorkPeriod) {
        setIsWorkPeriod(false);
        setTimeRemaining(restInterval);
      } else if (isRecoveryPeriod) {
        setIsRecoveryPeriod(false);
        setIsWorkPeriod(true);
        setTimeRemaining(workInterval);
      } else {
        // End of rest
        if (currentRound < rounds) {
          if (recoveryInterval > 0 && recoveryAfterRounds > 0 && currentRound % recoveryAfterRounds === 0) {
            setIsRecoveryPeriod(true);
            setTimeRemaining(recoveryInterval);
          } else {
            setCurrentRound(currentRound + 1);
            setIsWorkPeriod(true);
            setTimeRemaining(workInterval);
          }
        }
      }
      audioService.playTransitionBeep();
    } else if (mode === TIMER_MODES.FLOW && currentPoseIndex < selectedPoses.length - 1) {
      setCurrentPoseIndex(currentPoseIndex + 1);
      setTimeRemaining(selectedPoses[currentPoseIndex + 1].duration);
      audioService.playTransitionBeep();
    }
  };

  // Skip backward to previous interval (HIIT or Yoga)
  const handleSkipBackward = () => {
    if (mode === TIMER_MODES.HIIT) {
      // Skip to previous phase in HIIT
      if (isWorkPeriod && currentRound > 1) {
        setIsWorkPeriod(false);
        setCurrentRound(currentRound - 1);
        setTimeRemaining(restInterval);
      } else if (!isWorkPeriod && !isPrepPeriod && !isRecoveryPeriod) {
        setIsWorkPeriod(true);
        setTimeRemaining(workInterval);
      }
      audioService.playTransitionBeep();
    } else if (mode === TIMER_MODES.FLOW && currentPoseIndex > 0) {
      setCurrentPoseIndex(currentPoseIndex - 1);
      setTimeRemaining(selectedPoses[currentPoseIndex - 1].duration);
      audioService.playTransitionBeep();
    }
  };

  // Save current configuration as preset
  const handleSavePreset = async () => {
    try {
      if (!presetName.trim()) {
        alert('Please enter a preset name');
        return;
      }

      if (mode === TIMER_MODES.FLOW) {
        const preset = {
          id: editingPreset?.id,
          name: presetName,
          poses: selectedPoses,
          defaultDuration: poseDuration,
        };
        await saveYogaPreset(preset);
        const updatedPresets = getYogaPresets();
        setYogaPresets(updatedPresets);
      } else if (mode === TIMER_MODES.HIIT) {
        const preset = {
          id: editingPreset?.id,
          name: presetName,
          workInterval,
          restInterval,
          rounds,
          preparationInterval,
          recoveryInterval,
          recoveryAfterRounds,
          sessionName,
          workIntervalNames,
          intervalNames,
        };
        await saveHiitPreset(preset);
        const updatedPresets = getHiitPresets();
        setHiitPresets(updatedPresets);
      }

      setShowPresetDialog(false);
      setPresetName('');
      setEditingPreset(null);
    } catch (error) {
      console.error('Error saving preset:', error);
      alert('Failed to save preset');
    }
  };

  // Load a preset
  const handleLoadPreset = (preset) => {
    if (mode === TIMER_MODES.FLOW) {
      setSelectedPoses(preset.poses || []);
      setPostDuration(preset.defaultDuration || 45);
    } else if (mode === TIMER_MODES.HIIT) {
      setWorkInterval(preset.workInterval || 30);
      setRestInterval(preset.restInterval || 15);
      setRounds(preset.rounds || 8);
      setPreparationInterval(preset.preparationInterval || 10);
      setRecoveryInterval(preset.recoveryInterval || 0);
      setRecoveryAfterRounds(preset.recoveryAfterRounds || 4);
      setSessionName(preset.sessionName || '');
      setWorkIntervalNames(preset.workIntervalNames || []);
      setIntervalNames(preset.intervalNames || { prep: 'Get Ready', recovery: 'Recovery' });
    }
  };

  // Delete a preset
  const handleDeletePreset = async (presetId) => {
    try {
      if (mode === TIMER_MODES.FLOW) {
        await deleteYogaPreset(presetId);
        const updatedPresets = getYogaPresets();
        setYogaPresets(updatedPresets);
      } else if (mode === TIMER_MODES.HIIT) {
        await deleteHiitPreset(presetId);
        const updatedPresets = getHiitPresets();
        setHiitPresets(updatedPresets);
      }
    } catch (error) {
      console.error('Error deleting preset:', error);
      alert('Failed to delete preset');
    }
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
        {!hideBackButton && (
          <Box sx={{ mb: 2 }}>
            <Button
              startIcon={<ArrowBack />}
              onClick={() => onNavigate('home')}
              sx={{ color: 'text.secondary' }}
            >
              Back to Work Home
            </Button>
          </Box>
        )}

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
                    <Typography variant="body2">Yoga</Typography>
                  </Stack>
                </ToggleButton>
                <ToggleButton value={TIMER_MODES.CARDIO} sx={{ py: 2 }}>
                  <Stack alignItems="center" spacing={1}>
                    <DirectionsRun />
                    <Typography variant="body2">Cardio</Typography>
                  </Stack>
                </ToggleButton>
              </ToggleButtonGroup>

              {/* Mode-specific configuration */}
              {mode === TIMER_MODES.HIIT && (
                <Stack spacing={3}>
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, flex: 1 }}>
                      HIIT Configuration
                    </Typography>
                    <Button
                      size="small"
                      startIcon={<Save />}
                      onClick={() => {
                        setPresetName('');
                        setEditingPreset(null);
                        setShowPresetDialog(true);
                      }}
                    >
                      Save Preset
                    </Button>
                  </Stack>

                  {/* Presets */}
                  {hiitPresets.length > 0 && (
                    <Box>
                      <Typography variant="subtitle2" gutterBottom>
                        Load Preset
                      </Typography>
                      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                        {hiitPresets.map((preset) => (
                          <Chip
                            key={preset.id}
                            label={preset.name}
                            onClick={() => handleLoadPreset(preset)}
                            onDelete={() => handleDeletePreset(preset.id)}
                            color="primary"
                            variant="outlined"
                            sx={{ mb: 1 }}
                          />
                        ))}
                      </Stack>
                    </Box>
                  )}

                  <TextField
                    label="Session Name (optional)"
                    value={sessionName}
                    onChange={(e) => setSessionName(e.target.value)}
                    fullWidth
                    placeholder="e.g., Morning HIIT, Tabata Workout"
                  />
                  
                  <TextField
                    label="Preparation Interval (seconds)"
                    type="number"
                    value={preparationInterval === null || preparationInterval === undefined ? '' : preparationInterval}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === '' || val === null) {
                        setPreparationInterval('');
                      } else {
                        setPreparationInterval(Math.max(0, parseInt(val) || 0));
                      }
                    }}
                    onBlur={(e) => {
                      if (e.target.value === '' || e.target.value === null) {
                        setPreparationInterval(10);
                      }
                    }}
                    inputProps={{ min: 0, max: 60, inputMode: 'numeric' }}
                    fullWidth
                    helperText="Time to get ready before the workout starts"
                  />
                  
                  <TextField
                    label="Work Interval (seconds)"
                    type="number"
                    value={workInterval === null || workInterval === undefined ? '' : workInterval}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === '' || val === null) {
                        setWorkInterval('');
                      } else {
                        setWorkInterval(Math.max(5, parseInt(val) || 5));
                      }
                    }}
                    onBlur={(e) => {
                      if (e.target.value === '' || e.target.value === null) {
                        setWorkInterval(30);
                      }
                    }}
                    inputProps={{ min: 5, max: 300, inputMode: 'numeric' }}
                    fullWidth
                  />
                  
                  <TextField
                    label="Rest Interval (seconds)"
                    type="number"
                    value={restInterval === null || restInterval === undefined ? '' : restInterval}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === '' || val === null) {
                        setRestInterval('');
                      } else {
                        setRestInterval(Math.max(5, parseInt(val) || 5));
                      }
                    }}
                    onBlur={(e) => {
                      if (e.target.value === '' || e.target.value === null) {
                        setRestInterval(15);
                      }
                    }}
                    inputProps={{ min: 5, max: 300, inputMode: 'numeric' }}
                    fullWidth
                  />
                  
                  <TextField
                    label="Number of Rounds"
                    type="number"
                    value={rounds === null || rounds === undefined ? '' : rounds}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === '' || val === null) {
                        setRounds('');
                      } else {
                        const newRounds = Math.max(1, parseInt(val) || 1);
                        setRounds(newRounds);
                        // Adjust workIntervalNames array to match new rounds count
                        setWorkIntervalNames(prev => {
                          const newNames = [...prev];
                          while (newNames.length < newRounds) {
                            newNames.push('');
                          }
                          return newNames.slice(0, newRounds);
                        });
                      }
                    }}
                    onBlur={(e) => {
                      if (e.target.value === '' || e.target.value === null) {
                        setRounds(8);
                        // Adjust workIntervalNames array to 8 rounds
                        setWorkIntervalNames(prev => {
                          const newNames = [...prev];
                          while (newNames.length < 8) {
                            newNames.push('');
                          }
                          return newNames.slice(0, 8);
                        });
                      }
                    }}
                    inputProps={{ min: 1, max: 50, inputMode: 'numeric' }}
                    fullWidth
                  />
                  
                  {/* Exercise Names for Each Round */}
                  <Box>
                    <Typography variant="subtitle2" gutterBottom>
                      Exercise Names (optional)
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      Name each work interval for audio/visual prompts. Leave blank to use &quot;work&quot; as default.
                    </Typography>
                    <Stack spacing={1.5}>
                      {Array.from({ length: rounds || 0 }).map((_, index) => (
                        <TextField
                          key={index}
                          label={`Round ${index + 1} Exercise`}
                          value={workIntervalNames[index] || ''}
                          onChange={(e) => {
                            const newNames = [...workIntervalNames];
                            newNames[index] = e.target.value;
                            setWorkIntervalNames(newNames);
                          }}
                          placeholder="e.g., push-ups, burpees, jumping jacks"
                          size="small"
                          fullWidth
                        />
                      ))}
                    </Stack>
                  </Box>
                  
                  <TextField
                    label="Recovery Break (seconds, 0 to disable)"
                    type="number"
                    value={recoveryInterval === null || recoveryInterval === undefined ? '' : recoveryInterval}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === '' || val === null) {
                        setRecoveryInterval('');
                      } else {
                        setRecoveryInterval(Math.max(0, parseInt(val) || 0));
                      }
                    }}
                    onBlur={(e) => {
                      if (e.target.value === '' || e.target.value === null) {
                        setRecoveryInterval(0);
                      }
                    }}
                    inputProps={{ min: 0, max: 300, inputMode: 'numeric' }}
                    fullWidth
                    helperText="Longer break after several rounds"
                  />
                  
                  {recoveryInterval > 0 && (
                    <TextField
                      label="Recovery Break After Rounds"
                      type="number"
                      value={recoveryAfterRounds === null || recoveryAfterRounds === undefined ? '' : recoveryAfterRounds}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === '' || val === null) {
                          setRecoveryAfterRounds('');
                        } else {
                          setRecoveryAfterRounds(Math.max(1, parseInt(val) || 1));
                        }
                      }}
                      onBlur={(e) => {
                        if (e.target.value === '' || e.target.value === null) {
                          setRecoveryAfterRounds(4);
                        }
                      }}
                      inputProps={{ min: 1, max: rounds, inputMode: 'numeric' }}
                      fullWidth
                      helperText={`Recovery break every ${recoveryAfterRounds} rounds`}
                    />
                  )}
                  
                  <Typography variant="body2" color="text.secondary">
                    Total Duration: {Math.floor((preparationInterval + rounds * (workInterval + restInterval) + (recoveryInterval > 0 && recoveryAfterRounds > 0 ? Math.floor(rounds / recoveryAfterRounds) * recoveryInterval : 0)) / 60)} minutes
                  </Typography>
                </Stack>
              )}

              {mode === TIMER_MODES.FLOW && (
                <Stack spacing={3}>
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, flex: 1 }}>
                      Yoga Configuration
                    </Typography>
                    <Button
                      size="small"
                      startIcon={<Save />}
                      onClick={() => {
                        setPresetName('');
                        setEditingPreset(null);
                        setShowPresetDialog(true);
                      }}
                      disabled={selectedPoses.length === 0}
                    >
                      Save Preset
                    </Button>
                  </Stack>

                  {/* Presets */}
                  {yogaPresets.length > 0 && (
                    <Box>
                      <Typography variant="subtitle2" gutterBottom>
                        Load Preset
                      </Typography>
                      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                        {yogaPresets.map((preset) => (
                          <Chip
                            key={preset.id}
                            label={preset.name}
                            onClick={() => handleLoadPreset(preset)}
                            onDelete={() => handleDeletePreset(preset.id)}
                            color="primary"
                            variant="outlined"
                            icon={<Favorite />}
                            sx={{ mb: 1 }}
                          />
                        ))}
                      </Stack>
                    </Box>
                  )}

                  <TextField
                    label="Hold Duration per Pose (seconds)"
                    type="number"
                    value={poseDuration === null || poseDuration === undefined ? '' : poseDuration}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === '' || val === null) {
                        setPostDuration('');
                      } else {
                        setPostDuration(Math.max(15, parseInt(val) || 15));
                      }
                    }}
                    onBlur={(e) => {
                      if (e.target.value === '' || e.target.value === null) {
                        setPostDuration(45);
                      }
                    }}
                    inputProps={{ min: 15, max: 300, inputMode: 'numeric' }}
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

              {mode === TIMER_MODES.CARDIO && (
                <Stack spacing={3}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                    Cardio Configuration
                  </Typography>
                  <TextField
                    label="Duration (minutes)"
                    type="number"
                    value={cardioDuration === null || cardioDuration === undefined ? '' : cardioDuration}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === '' || val === null) {
                        setCardioDuration('');
                      } else {
                        setCardioDuration(Math.max(1, parseInt(val) || 1));
                      }
                    }}
                    onBlur={(e) => {
                      if (e.target.value === '' || e.target.value === null) {
                        setCardioDuration(20);
                      }
                    }}
                    inputProps={{ min: 1, max: 240, inputMode: 'numeric' }}
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
                      ? 'Yoga'
                      : 'Cardio'
                  }
                  color="primary"
                  size="medium"
                />
              </Stack>

              {/* Circular Progress */}
              <Box sx={{ 
                textAlign: 'center', 
                mb: 3, 
                position: 'relative',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                width: '100%',
              }}>
                <svg
                  width="280"
                  height="280"
                  style={{ transform: 'rotate(-90deg)' }}
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
                        : mode === TIMER_MODES.HIIT && (isPrepPeriod || isRecoveryPeriod)
                        ? '#ff9800'
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
                      <Typography variant="h6" sx={{ mt: 1, fontWeight: 600 }}>
                        {isPrepPeriod 
                          ? intervalNames.prep 
                          : isRecoveryPeriod 
                          ? intervalNames.recovery 
                          : isWorkPeriod 
                          ? (workIntervalNames[currentRound - 1] || 'work')
                          : 'rest'}
                      </Typography>
                      {isPrepPeriod && (
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                          Up Next: {workIntervalNames[0] || 'work'}
                        </Typography>
                      )}
                      {!isPrepPeriod && !isWorkPeriod && currentRound < rounds && (
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                          Up Next: {workIntervalNames[currentRound] || 'work'}
                        </Typography>
                      )}
                      {!isPrepPeriod && (
                        <Typography variant="body2" color="text.secondary">
                          Round {currentRound} / {rounds}
                        </Typography>
                      )}
                      {sessionName && (
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                          {sessionName}
                        </Typography>
                      )}
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
              <Stack direction="row" spacing={2} justifyContent="center" flexWrap="wrap">
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
                          (mode === TIMER_MODES.HIIT && !isPrepPeriod && !isRecoveryPeriod && !isWorkPeriod && currentRound >= rounds) ||
                          (mode === TIMER_MODES.FLOW && currentPoseIndex >= selectedPoses.length - 1)
                        }
                      >
                        <SkipNext sx={{ fontSize: 36 }} />
                      </IconButton>
                    )}
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
        {onNavigate && !hideBackButton && (
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

        {/* Preset Save Dialog */}
        <Dialog
          open={showPresetDialog}
          onClose={() => {
            setShowPresetDialog(false);
            setPresetName('');
            setEditingPreset(null);
          }}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Save {mode === TIMER_MODES.FLOW ? 'Yoga' : 'HIIT'} Preset</DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ mt: 2 }}>
              <TextField
                label="Preset Name"
                value={presetName}
                onChange={(e) => setPresetName(e.target.value)}
                fullWidth
                autoFocus
                placeholder={mode === TIMER_MODES.FLOW ? 'e.g., Morning Flow, Evening Stretch' : 'e.g., Tabata, Circuit Training'}
              />
              <Typography variant="body2" color="text.secondary">
                {mode === TIMER_MODES.FLOW 
                  ? `This will save your current pose sequence (${selectedPoses.length} poses)`
                  : 'This will save your current interval configuration'}
              </Typography>
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => {
              setShowPresetDialog(false);
              setPresetName('');
              setEditingPreset(null);
            }}>
              Cancel
            </Button>
            <Button 
              variant="contained" 
              onClick={handleSavePreset}
              disabled={!presetName.trim()}
            >
              Save Preset
            </Button>
          </DialogActions>
        </Dialog>
      </motion.div>
    </Box>
  );
};

UnifiedTimerScreen.propTypes = {
  onNavigate: PropTypes.func,
  hideBackButton: PropTypes.bool,
};

export default UnifiedTimerScreen;
