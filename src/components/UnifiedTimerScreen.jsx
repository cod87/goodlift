/**
 * UnifiedTimerScreen.jsx
 * 
 * A comprehensive timer screen that handles HIIT, Cardio, and Yoga sessions.
 * Features:
 * - Tab-based UI for switching between timer types
 * - Configurable settings for each timer type
 * - Session logging to localStorage and Firebase
 * - Audio alerts using Web Audio API
 * - Persistent timer settings
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Stack,
  Tabs,
  Tab,
  LinearProgress,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  IconButton,
  Alert,
  Divider,
} from '@mui/material';
import {
  PlayArrow,
  Pause,
  Stop,
  Replay,
  SkipNext,
  Whatshot,
  DirectionsRun,
  SelfImprovement,
  Timer as TimerIcon,
  CheckCircle,
} from '@mui/icons-material';
import CompactHeader from './Common/CompactHeader';
import audioService from '../utils/audioService';
import { saveWorkout } from '../utils/storage';
import { formatDuration } from '../utils/helpers';
import wakeLockManager from '../utils/wakeLock';

// Timer types
const TIMER_TYPES = {
  HIIT: 'hiit',
  CARDIO: 'cardio',
  YOGA: 'yoga',
};

// Yoga poses pool for random selection
const YOGA_POSES = [
  'Mountain Pose', 'Downward Dog', 'Warrior I', 'Warrior II', 'Triangle Pose',
  'Tree Pose', 'Child\'s Pose', 'Cat-Cow Stretch', 'Cobra Pose', 'Plank Pose',
  'Bridge Pose', 'Seated Forward Bend', 'Pigeon Pose', 'Corpse Pose (Savasana)',
  'Chair Pose', 'Eagle Pose', 'Half Moon Pose', 'Camel Pose', 'Boat Pose',
  'Butterfly Pose', 'Garland Pose', 'Extended Side Angle', 'Revolved Triangle',
  'Upward Facing Dog', 'Low Lunge', 'High Lunge', 'Standing Forward Bend',
];

// Storage key for timer settings
const TIMER_SETTINGS_KEY = 'goodlift_timer_settings';

const UnifiedTimerScreen = () => {
  // Tab state
  const [currentTab, setCurrentTab] = useState(0); // 0: HIIT, 1: Cardio, 2: Yoga

  // HIIT configuration
  const [hiitWorkTime, setHiitWorkTime] = useState(30);
  const [hiitRestTime, setHiitRestTime] = useState(15);
  const [hiitRounds, setHiitRounds] = useState(8);

  // Cardio configuration
  const [cardioDuration, setCardioDuration] = useState(20); // minutes
  const [cardioIntervalMinutes, setCardioIntervalMinutes] = useState(5);

  // Yoga configuration
  const [yogaFlowDuration, setYogaFlowDuration] = useState(20); // minutes
  const [yogaPoseInterval, setYogaPoseInterval] = useState(2); // minutes per pose
  const [yogaCooldown, setYogaCooldown] = useState(5); // minutes

  // Session state
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isSetup, setIsSetup] = useState(true);
  const [timeLeft, setTimeLeft] = useState(0);
  const [totalElapsed, setTotalElapsed] = useState(0);
  
  // HIIT specific state
  const [currentRound, setCurrentRound] = useState(0);
  const [isWorkPhase, setIsWorkPhase] = useState(true);
  
  // Yoga specific state
  const [currentPose, setCurrentPose] = useState('');
  const [poseHistory, setPoseHistory] = useState([]);

  // Cardio specific state
  // Interval tracking is handled dynamically in timer logic

  // Completion dialog
  const [showCompleteDialog, setShowCompleteDialog] = useState(false);
  const [sessionNotes, setSessionNotes] = useState('');

  // Refs
  const intervalRef = useRef(null);
  const startTimeRef = useRef(null);
  const elapsedBeforePauseRef = useRef(0);

  // Load saved settings on mount
  useEffect(() => {
    const loadSettings = () => {
      try {
        const saved = localStorage.getItem(TIMER_SETTINGS_KEY);
        if (saved) {
          const settings = JSON.parse(saved);
          
          // Load HIIT settings
          if (settings.hiit) {
            setHiitWorkTime(settings.hiit.workTime || 30);
            setHiitRestTime(settings.hiit.restTime || 15);
            setHiitRounds(settings.hiit.rounds || 8);
          }
          
          // Load Cardio settings
          if (settings.cardio) {
            setCardioDuration(settings.cardio.duration || 20);
            setCardioIntervalMinutes(settings.cardio.intervalMinutes || 5);
          }
          
          // Load Yoga settings
          if (settings.yoga) {
            setYogaFlowDuration(settings.yoga.flowDuration || 20);
            setYogaPoseInterval(settings.yoga.poseInterval || 2);
            setYogaCooldown(settings.yoga.cooldown || 5);
          }
          
          // Load last used tab
          if (settings.lastTab !== undefined) {
            setCurrentTab(settings.lastTab);
          }
        }
      } catch (error) {
        console.error('Error loading timer settings:', error);
      }
    };

    loadSettings();
  }, []);

  // Save settings to localStorage whenever they change
  useEffect(() => {
    const saveSettings = () => {
      try {
        const settings = {
          lastTab: currentTab,
          hiit: {
            workTime: hiitWorkTime,
            restTime: hiitRestTime,
            rounds: hiitRounds,
          },
          cardio: {
            duration: cardioDuration,
            intervalMinutes: cardioIntervalMinutes,
          },
          yoga: {
            flowDuration: yogaFlowDuration,
            poseInterval: yogaPoseInterval,
            cooldown: yogaCooldown,
          },
        };
        localStorage.setItem(TIMER_SETTINGS_KEY, JSON.stringify(settings));
      } catch (error) {
        console.error('Error saving timer settings:', error);
      }
    };

    saveSettings();
  }, [
    currentTab,
    hiitWorkTime,
    hiitRestTime,
    hiitRounds,
    cardioDuration,
    cardioIntervalMinutes,
    yogaFlowDuration,
    yogaPoseInterval,
    yogaCooldown,
  ]);

  // Manage wake lock
  useEffect(() => {
    if (isRunning && !isPaused) {
      wakeLockManager.requestWakeLock();
    } else {
      wakeLockManager.releaseWakeLock();
    }

    return () => {
      wakeLockManager.releaseWakeLock();
    };
  }, [isRunning, isPaused]);

  // Get random yoga pose
  const getRandomPose = useCallback(() => {
    const availablePoses = YOGA_POSES.filter(pose => !poseHistory.includes(pose));
    if (availablePoses.length === 0) {
      // Reset history if we've used all poses
      setPoseHistory([]);
      return YOGA_POSES[Math.floor(Math.random() * YOGA_POSES.length)];
    }
    return availablePoses[Math.floor(Math.random() * availablePoses.length)];
  }, [poseHistory]);

  // Calculate total duration preview
  const getTotalDuration = useCallback(() => {
    const timerType = currentTab === 0 ? TIMER_TYPES.HIIT : currentTab === 1 ? TIMER_TYPES.CARDIO : TIMER_TYPES.YOGA;
    
    switch (timerType) {
      case TIMER_TYPES.HIIT:
        return hiitRounds * (hiitWorkTime + hiitRestTime);
      case TIMER_TYPES.CARDIO:
        return cardioDuration * 60;
      case TIMER_TYPES.YOGA:
        return yogaFlowDuration * 60;
      default:
        return 0;
    }
  }, [currentTab, hiitRounds, hiitWorkTime, hiitRestTime, cardioDuration, yogaFlowDuration]);

  // Handle session completion
  const handleComplete = useCallback(async () => {
    setIsRunning(false);
    setIsPaused(false);
    const endTime = Date.now();
    const duration = Math.floor((endTime - startTimeRef.current + elapsedBeforePauseRef.current) / 1000);
    
    // Play completion sound
    audioService.playCompletionFanfare();
    
    setTotalElapsed(duration);
    setShowCompleteDialog(true);
  }, []);

  // Timer logic
  useEffect(() => {
    if (isRunning && !isPaused) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            const timerType = currentTab === 0 ? TIMER_TYPES.HIIT : currentTab === 1 ? TIMER_TYPES.CARDIO : TIMER_TYPES.YOGA;
            
            // HIIT timer logic
            if (timerType === TIMER_TYPES.HIIT) {
              if (isWorkPhase) {
                // Switch to rest
                audioService.playLowBeep();
                setIsWorkPhase(false);
                return hiitRestTime;
              } else {
                // Move to next round or complete
                setCurrentRound((r) => r + 1);
                
                if (currentRound + 1 >= hiitRounds) {
                  handleComplete();
                  return 0;
                }
                
                audioService.playHighBeep();
                setIsWorkPhase(true);
                return hiitWorkTime;
              }
            }
            
            // Cardio timer logic
            if (timerType === TIMER_TYPES.CARDIO) {
              const elapsedSeconds = Math.floor((Date.now() - startTimeRef.current + elapsedBeforePauseRef.current) / 1000);
              const remainingSeconds = (cardioDuration * 60) - elapsedSeconds;
              
              // Check for interval alert
              const intervalSeconds = cardioIntervalMinutes * 60;
              if (elapsedSeconds > 0 && elapsedSeconds % intervalSeconds === 0 && remainingSeconds > 0) {
                audioService.playChime();
              }
              
              if (remainingSeconds <= 1) {
                handleComplete();
                return 0;
              }
              
              return remainingSeconds;
            }
            
            // Yoga timer logic
            if (timerType === TIMER_TYPES.YOGA) {
              const elapsedSeconds = Math.floor((Date.now() - startTimeRef.current + elapsedBeforePauseRef.current) / 1000);
              const totalDurationSeconds = yogaFlowDuration * 60;
              const remainingSeconds = totalDurationSeconds - elapsedSeconds;
              
              // Check if it's time for a new pose
              const poseIntervalSeconds = yogaPoseInterval * 60;
              if (elapsedSeconds > 0 && elapsedSeconds % poseIntervalSeconds === 0 && remainingSeconds > poseIntervalSeconds) {
                const newPose = getRandomPose();
                setCurrentPose(newPose);
                setPoseHistory(prev => [...prev, newPose]);
                audioService.playChime();
              }
              
              // Check if entering cooldown
              const cooldownStart = totalDurationSeconds - (yogaCooldown * 60);
              if (elapsedSeconds >= cooldownStart && currentPose !== 'Cooldown - Corpse Pose (Savasana)') {
                setCurrentPose('Cooldown - Corpse Pose (Savasana)');
                audioService.playTransitionBeep();
              }
              
              if (remainingSeconds <= 1) {
                handleComplete();
                return 0;
              }
              
              return remainingSeconds;
            }
            
            return prev;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [
    isRunning,
    isPaused,
    isWorkPhase,
    currentRound,
    currentTab,
    hiitWorkTime,
    hiitRestTime,
    hiitRounds,
    cardioDuration,
    cardioIntervalMinutes,
    yogaFlowDuration,
    yogaPoseInterval,
    yogaCooldown,
    currentPose,
    handleComplete,
    getRandomPose,
  ]);

  // Start session
  const handleStart = () => {
    const timerType = currentTab === 0 ? TIMER_TYPES.HIIT : currentTab === 1 ? TIMER_TYPES.CARDIO : TIMER_TYPES.YOGA;
    
    setIsSetup(false);
    setIsRunning(true);
    setIsPaused(false);
    startTimeRef.current = Date.now();
    elapsedBeforePauseRef.current = 0;
    
    if (timerType === TIMER_TYPES.HIIT) {
      setTimeLeft(hiitWorkTime);
      setCurrentRound(0);
      setIsWorkPhase(true);
      audioService.playHighBeep();
    } else if (timerType === TIMER_TYPES.CARDIO) {
      const durationSeconds = cardioDuration * 60;
      setTimeLeft(durationSeconds);
      audioService.playHighBeep();
    } else if (timerType === TIMER_TYPES.YOGA) {
      const durationSeconds = yogaFlowDuration * 60;
      setTimeLeft(durationSeconds);
      const firstPose = getRandomPose();
      setCurrentPose(firstPose);
      setPoseHistory([firstPose]);
      audioService.playChime();
    }
  };

  // Pause/Resume session
  const handlePauseResume = () => {
    if (isPaused) {
      // Resume
      setIsPaused(false);
      const pauseDuration = Date.now() - pauseTimeRef.current;
      startTimeRef.current += pauseDuration;
      audioService.playTransitionBeep();
    } else {
      // Pause
      setIsPaused(true);
      pauseTimeRef.current = Date.now();
      audioService.playLowBeep();
    }
  };
  const pauseTimeRef = useRef(null);

  // Stop session
  const handleStop = () => {
    setIsRunning(false);
    setIsPaused(false);
    setIsSetup(true);
    setTimeLeft(0);
    setCurrentRound(0);
    setCurrentPose('');
    setPoseHistory([]);
    audioService.playLowBeep();
  };

  // Skip to next pose (Yoga only)
  const handleSkipPose = () => {
    const newPose = getRandomPose();
    setCurrentPose(newPose);
    setPoseHistory(prev => [...prev, newPose]);
    audioService.playTransitionBeep();
  };

  // Save session and close dialog
  const handleSaveSession = async () => {
    const timerType = currentTab === 0 ? TIMER_TYPES.HIIT : currentTab === 1 ? TIMER_TYPES.CARDIO : TIMER_TYPES.YOGA;
    
    try {
      const sessionData = {
        id: `${timerType}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        date: new Date().toISOString(),
        type: timerType,
        duration: totalElapsed,
        completed: true,
        notes: sessionNotes,
      };

      // Add type-specific data
      if (timerType === TIMER_TYPES.HIIT) {
        sessionData.workTime = hiitWorkTime;
        sessionData.restTime = hiitRestTime;
        sessionData.rounds = currentRound;
        sessionData.targetRounds = hiitRounds;
      } else if (timerType === TIMER_TYPES.CARDIO) {
        sessionData.targetDuration = cardioDuration * 60;
        sessionData.intervalMinutes = cardioIntervalMinutes;
      } else if (timerType === TIMER_TYPES.YOGA) {
        sessionData.flowDuration = yogaFlowDuration;
        sessionData.poseInterval = yogaPoseInterval;
        sessionData.cooldown = yogaCooldown;
        sessionData.posesCompleted = poseHistory.length;
      }

      // Save to storage (both localStorage and Firebase via storage.js)
      await saveWorkout(sessionData);
      
      setShowCompleteDialog(false);
      setSessionNotes('');
      handleStop();
    } catch (error) {
      console.error('Error saving session:', error);
      alert('Failed to save session. Please try again.');
    }
  };

  // Render configuration panel
  const renderConfigPanel = () => {
    const timerType = currentTab === 0 ? TIMER_TYPES.HIIT : currentTab === 1 ? TIMER_TYPES.CARDIO : TIMER_TYPES.YOGA;
    
    if (timerType === TIMER_TYPES.HIIT) {
      return (
        <Stack spacing={3}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            ⚡ Configure HIIT Session
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Work Time (seconds)"
                type="number"
                value={hiitWorkTime}
                onChange={(e) => setHiitWorkTime(Math.max(1, parseInt(e.target.value) || 30))}
                inputProps={{ min: 1, max: 300 }}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Rest Time (seconds)"
                type="number"
                value={hiitRestTime}
                onChange={(e) => setHiitRestTime(Math.max(1, parseInt(e.target.value) || 15))}
                inputProps={{ min: 1, max: 300 }}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Rounds"
                type="number"
                value={hiitRounds}
                onChange={(e) => setHiitRounds(Math.max(1, parseInt(e.target.value) || 8))}
                inputProps={{ min: 1, max: 50 }}
              />
            </Grid>
          </Grid>
          <Alert severity="info">
            <strong>Total Duration:</strong> {formatDuration(getTotalDuration())}
          </Alert>
        </Stack>
      );
    }
    
    if (timerType === TIMER_TYPES.CARDIO) {
      return (
        <Stack spacing={3}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            🏃 Configure Cardio Session
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Duration (minutes)"
                type="number"
                value={cardioDuration}
                onChange={(e) => setCardioDuration(Math.max(1, parseInt(e.target.value) || 20))}
                inputProps={{ min: 1, max: 120 }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Interval Alert (minutes)"
                type="number"
                value={cardioIntervalMinutes}
                onChange={(e) => setCardioIntervalMinutes(Math.max(1, parseInt(e.target.value) || 5))}
                inputProps={{ min: 1, max: 60 }}
              />
            </Grid>
          </Grid>
          <Alert severity="info">
            <strong>Session will alert every {cardioIntervalMinutes} minutes</strong>
          </Alert>
        </Stack>
      );
    }
    
    if (timerType === TIMER_TYPES.YOGA) {
      return (
        <Stack spacing={3}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            🧘 Configure Yoga Session
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Flow Duration (minutes)"
                type="number"
                value={yogaFlowDuration}
                onChange={(e) => setYogaFlowDuration(Math.max(1, parseInt(e.target.value) || 20))}
                inputProps={{ min: 1, max: 120 }}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Pose Interval (minutes)"
                type="number"
                value={yogaPoseInterval}
                onChange={(e) => setYogaPoseInterval(Math.max(1, parseInt(e.target.value) || 2))}
                inputProps={{ min: 1, max: 30 }}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Cooldown (minutes)"
                type="number"
                value={yogaCooldown}
                onChange={(e) => setYogaCooldown(Math.max(1, parseInt(e.target.value) || 5))}
                inputProps={{ min: 1, max: 30 }}
              />
            </Grid>
          </Grid>
          <Alert severity="info">
            New poses will appear every {yogaPoseInterval} minutes, with {yogaCooldown} minutes of cooldown at the end
          </Alert>
        </Stack>
      );
    }
  };

  // Render active session
  const renderActiveSession = () => {
    const timerType = currentTab === 0 ? TIMER_TYPES.HIIT : currentTab === 1 ? TIMER_TYPES.CARDIO : TIMER_TYPES.YOGA;
    const progress = ((getTotalDuration() - timeLeft) / getTotalDuration()) * 100;
    
    return (
      <Box sx={{ textAlign: 'center' }}>
        {/* Progress bar */}
        <LinearProgress
          variant="determinate"
          value={progress}
          sx={{
            height: 10,
            borderRadius: 5,
            mb: 4,
            bgcolor: 'rgba(255, 255, 255, 0.2)',
            '& .MuiLinearProgress-bar': {
              bgcolor: timerType === TIMER_TYPES.HIIT ? 'warning.main' : timerType === TIMER_TYPES.CARDIO ? 'secondary.main' : 'primary.main',
            },
          }}
        />

        {/* Timer display */}
        <motion.div
          animate={{ scale: isPaused ? 1 : [1, 1.02, 1] }}
          transition={{ duration: 1, repeat: isPaused ? 0 : Infinity }}
        >
          <Typography
            variant="h1"
            sx={{
              fontSize: { xs: '4rem', sm: '6rem', md: '8rem' },
              fontWeight: 900,
              color: isPaused ? 'text.secondary' : (
                timerType === TIMER_TYPES.HIIT && !isWorkPhase ? 'info.main' :
                timerType === TIMER_TYPES.HIIT ? 'warning.main' :
                timerType === TIMER_TYPES.CARDIO ? 'secondary.main' :
                'primary.main'
              ),
              textShadow: '0 4px 20px rgba(0,0,0,0.3)',
              mb: 2,
            }}
          >
            {formatDuration(timeLeft)}
          </Typography>
        </motion.div>

        {/* Status indicators */}
        <Stack direction="row" spacing={2} justifyContent="center" sx={{ mb: 4 }}>
          {timerType === TIMER_TYPES.HIIT && (
            <>
              <Chip
                label={isWorkPhase ? 'WORK' : 'REST'}
                color={isWorkPhase ? 'warning' : 'info'}
                sx={{ fontSize: '1.2rem', fontWeight: 700, px: 3, py: 2 }}
              />
              <Chip
                label={`Round ${currentRound + 1}/${hiitRounds}`}
                variant="outlined"
                sx={{ fontSize: '1.2rem', fontWeight: 700, px: 3, py: 2 }}
              />
            </>
          )}
          {timerType === TIMER_TYPES.YOGA && currentPose && (
            <Chip
              label={currentPose}
              color="primary"
              icon={<SelfImprovement />}
              sx={{ fontSize: '1.2rem', fontWeight: 700, px: 3, py: 2 }}
            />
          )}
        </Stack>

        {/* Control buttons */}
        <Stack direction="row" spacing={2} justifyContent="center">
          <Button
            variant="contained"
            size="large"
            onClick={handlePauseResume}
            startIcon={isPaused ? <PlayArrow /> : <Pause />}
            sx={{
              fontSize: '1.2rem',
              fontWeight: 700,
              px: 4,
              py: 2,
              bgcolor: isPaused ? 'success.main' : 'warning.main',
              '&:hover': {
                bgcolor: isPaused ? 'success.dark' : 'warning.dark',
              },
            }}
          >
            {isPaused ? 'Resume' : 'Pause'}
          </Button>
          <Button
            variant="contained"
            size="large"
            onClick={handleStop}
            startIcon={<Stop />}
            sx={{
              fontSize: '1.2rem',
              fontWeight: 700,
              px: 4,
              py: 2,
              bgcolor: 'error.main',
              '&:hover': {
                bgcolor: 'error.dark',
              },
            }}
          >
            Stop
          </Button>
          {timerType === TIMER_TYPES.YOGA && (
            <Button
              variant="outlined"
              size="large"
              onClick={handleSkipPose}
              startIcon={<SkipNext />}
              sx={{
                fontSize: '1.2rem',
                fontWeight: 700,
                px: 4,
                py: 2,
              }}
            >
              Next Pose
            </Button>
          )}
        </Stack>
      </Box>
    );
  };

  return (
    <Box sx={{ width: '100%', minHeight: '100vh' }}>
      <CompactHeader title="Timer Hub" icon="⏱️" />
      
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '1rem',
        }}
      >
        <Card sx={{ borderRadius: 3, bgcolor: 'background.paper' }}>
          <CardContent sx={{ p: { xs: 2, sm: 4 } }}>
            {/* Tab selector */}
            <Tabs
              value={currentTab}
              onChange={(e, newValue) => !isRunning && setCurrentTab(newValue)}
              variant="fullWidth"
              sx={{
                mb: 4,
                '& .MuiTab-root': {
                  fontSize: { xs: '0.9rem', sm: '1.1rem' },
                  fontWeight: 700,
                  py: 2,
                },
              }}
            >
              <Tab
                icon={<Whatshot />}
                label="HIIT ⚡"
                iconPosition="start"
                disabled={isRunning}
              />
              <Tab
                icon={<DirectionsRun />}
                label="Cardio 🏃"
                iconPosition="start"
                disabled={isRunning}
              />
              <Tab
                icon={<SelfImprovement />}
                label="Yoga 🧘"
                iconPosition="start"
                disabled={isRunning}
              />
            </Tabs>

            <Divider sx={{ mb: 4 }} />

            {/* Content area */}
            {isSetup ? (
              <>
                {renderConfigPanel()}
                <Box sx={{ mt: 4, textAlign: 'center' }}>
                  <Button
                    variant="contained"
                    size="large"
                    onClick={handleStart}
                    startIcon={<PlayArrow />}
                    sx={{
                      fontSize: '1.5rem',
                      fontWeight: 700,
                      px: 6,
                      py: 3,
                      bgcolor: currentTab === 0 ? 'warning.main' : currentTab === 1 ? 'secondary.main' : 'primary.main',
                      color: currentTab === 0 ? 'primary.main' : 'white',
                      '&:hover': {
                        bgcolor: currentTab === 0 ? 'warning.dark' : currentTab === 1 ? 'secondary.dark' : 'primary.dark',
                      },
                    }}
                  >
                    Start Session
                  </Button>
                </Box>
              </>
            ) : (
              renderActiveSession()
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Completion dialog */}
      <Dialog
        open={showCompleteDialog}
        onClose={() => setShowCompleteDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Stack direction="row" spacing={2} alignItems="center">
            <CheckCircle color="success" sx={{ fontSize: 40 }} />
            <Typography variant="h5" sx={{ fontWeight: 700 }}>
              Session Complete! 🎉
            </Typography>
          </Stack>
        </DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 2 }}>
            <Alert severity="success">
              <Typography variant="body1">
                <strong>Duration:</strong> {formatDuration(totalElapsed)}
              </Typography>
              <Typography variant="body1">
                <strong>Type:</strong> {currentTab === 0 ? 'HIIT' : currentTab === 1 ? 'Cardio' : 'Yoga'}
              </Typography>
              <Typography variant="body1">
                <strong>Date:</strong> {new Date().toLocaleString()}
              </Typography>
            </Alert>
            <TextField
              fullWidth
              label="Session Notes (optional)"
              multiline
              rows={3}
              value={sessionNotes}
              onChange={(e) => setSessionNotes(e.target.value)}
              placeholder="How did you feel? Any observations?"
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setShowCompleteDialog(false)}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSaveSession}
            startIcon={<CheckCircle />}
            sx={{ fontWeight: 700 }}
          >
            Save Session
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default UnifiedTimerScreen;
