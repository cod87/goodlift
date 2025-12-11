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
  Menu,
  ListItemIcon,
  ListItemText,
  Collapse,
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
  MoreVert,
  ExpandMore,
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
import { HIIT_EXERCISES_DATA_PATH } from '../utils/constants';
import HiitExerciseAutocomplete from '../components/HiitExerciseAutocomplete';
import TimerModal from '../components/TimerModal';
import TimerDisplay from '../components/TimerDisplay';
import DialPicker from '../components/Common/DialPicker';

const TIMER_MODES = {
  HIIT: 'hiit',
  FLOW: 'flow',
  CARDIO: 'cardio',
};

// Extended rest configuration constants
const EXTENDED_REST_DURATION_SECONDS = 60; // Additional seconds added to rest period
const TIME_COMPARISON_TOLERANCE = 0.5; // Tolerance in seconds for comparing elapsed time to target

// Yoga phase definitions
const YOGA_PHASES = [
  { name: 'Grounding & Warm-Up', defaultDuration: 5 }, // minutes
  { name: 'Vinyasa', defaultDuration: 15 }, // minutes
  { name: 'Cool Down', defaultDuration: 5 }, // minutes
];

const UnifiedTimerScreen = ({ onNavigate, hideBackButton = false }) => {
  // Mode and configuration
  const [mode, setMode] = useState(TIMER_MODES.HIIT);
  const [isConfiguring, setIsConfiguring] = useState(true);
  
  // Timer state
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(20 * 60); // seconds
  const [totalTime, setTotalTime] = useState(20 * 60);
  
  // HIIT mode state
  const [workInterval, setWorkInterval] = useState(30); // seconds
  const [restInterval, setRestInterval] = useState(15); // seconds
  const [roundsPerSet, setRoundsPerSet] = useState(8); // rounds per set
  const [numberOfSets, setNumberOfSets] = useState(1); // number of sets
  const [currentSet, setCurrentSet] = useState(1); // current set number
  const [currentRound, setCurrentRound] = useState(1); // current round within set
  const [isWorkPeriod, setIsWorkPeriod] = useState(true);
  const [preparationInterval, setPreparationInterval] = useState(10); // seconds
  const [recoveryBetweenSets, setRecoveryBetweenSets] = useState(0); // seconds between sets, 0 means disabled
  const [sessionName, setSessionName] = useState('');
  const [workIntervalNames, setWorkIntervalNames] = useState([]); // Array of custom exercise names for each round in a set
  const [intervalNames, setIntervalNames] = useState({ prep: 'Get Ready', recovery: 'Set Break' });
  const [isPrepPeriod, setIsPrepPeriod] = useState(false);
  const [isRecoveryPeriod, setIsRecoveryPeriod] = useState(false);
  
  // New HIIT state for requirements
  const [workRestRatio, setWorkRestRatio] = useState('1:1'); // Work:Rest ratio (1:1, 3:2, 2:1) - Default to 1:1
  const [sessionLengthMinutes, setSessionLengthMinutes] = useState(() => {
    // Load previous session length from localStorage, default to 10 minutes
    const saved = localStorage.getItem('goodlift_hiit_session_length');
    return saved ? parseFloat(saved) : 10;
  });
  const [warmupEnabled, setWarmupEnabled] = useState(true);
  const [warmupDuration, setWarmupDuration] = useState(5); // minutes: off, 2, 5, 7, 10
  // Use a ref for elapsed HIIT time to allow synchronous access during timer updates
  const elapsedHiitTimeRef = useRef(0);
  const [isExtendedRest, setIsExtendedRest] = useState(false); // Flag for 1-minute extended rest
  const [extendedRestIntervalMinutes, setExtendedRestIntervalMinutes] = useState(() => {
    // Load previous extended rest interval from localStorage, default to 8 minutes
    const saved = localStorage.getItem('goodlift_hiit_extended_rest_interval');
    return saved ? parseFloat(saved) : 8;
  });
  const [nextExtendedRestTime, setNextExtendedRestTime] = useState(null); // Time in seconds when next extended rest should occur
  const [exerciseNamesExpanded, setExerciseNamesExpanded] = useState(false); // State for collapsible exercise names
  
  // Flow mode state (three-phase yoga timer)
  const [yogaPhases, setYogaPhases] = useState(
    YOGA_PHASES.map(phase => ({ ...phase, duration: phase.defaultDuration }))
  );
  const [currentPhaseIndex, setCurrentPhaseIndex] = useState(0);
  
  // Cardio mode state
  const [cardioDuration, setCardioDuration] = useState(20); // minutes
  
  // Presets
  const [yogaPresets, setYogaPresets] = useState([]);
  const [hiitPresets, setHiitPresets] = useState([]);
  const [showPresetDialog, setShowPresetDialog] = useState(false);
  const [presetName, setPresetName] = useState('');
  const [editingPreset, setEditingPreset] = useState(null);
  const [isEditingPresets, setIsEditingPresets] = useState(false); // New state for edit mode
  
  // HIIT exercises autocomplete
  const [hiitExercises, setHiitExercises] = useState([]);
  
  // Completion dialog
  const [showCompletionDialog, setShowCompletionDialog] = useState(false);
  const [perceivedEffort, setPerceivedEffort] = useState(5);
  const [sessionNotes, setSessionNotes] = useState('');
  
  const timerRef = useRef(null);
  const hasPlayedWarningRef = useRef(false);

  // Helper function to calculate rest interval based on work interval and ratio
  const calculateRestInterval = (work, ratio) => {
    const [workPart, restPart] = ratio.split(':').map(Number);
    const rest = Math.ceil((work * restPart) / workPart);
    return rest;
  };

  // Helper function to calculate total rounds needed for session length
  const calculateRoundsForSession = useCallback((sessionMinutes, work, rest, warmup, warmupMins) => {
    const totalSeconds = sessionMinutes * 60;
    const warmupSeconds = warmup ? warmupMins * 60 : 0;
    const availableHiitSeconds = totalSeconds - warmupSeconds;
    
    if (availableHiitSeconds <= 0) return 1; // Minimum 1 round
    
    const roundDuration = work + rest;
    const rounds = Math.ceil(availableHiitSeconds / roundDuration);
    return Math.max(1, rounds); // Ensure at least 1 round
  }, []);

  // Helper function to calculate elapsed HIIT time based on current position
  const calculateElapsedTimeFromPosition = useCallback((set, round, isWork, isPrepPeriod, isRecoveryPeriod) => {
    // Don't count preparation or recovery periods in elapsed HIIT time
    if (isPrepPeriod || isRecoveryPeriod) {
      // Calculate elapsed time up to the current position
      const completedSets = set - 1;
      const completedRoundsInCurrentSet = round - 1;
      const timeFromCompletedSets = completedSets * roundsPerSet * (workInterval + restInterval);
      const timeFromCompletedRounds = completedRoundsInCurrentSet * (workInterval + restInterval);
      return timeFromCompletedSets + timeFromCompletedRounds;
    }
    
    // Calculate elapsed time
    const completedSets = set - 1;
    const completedRoundsInCurrentSet = round - 1;
    
    let elapsed = 0;
    
    // Time from completed sets
    elapsed += completedSets * roundsPerSet * (workInterval + restInterval);
    
    // Time from completed rounds in current set
    elapsed += completedRoundsInCurrentSet * (workInterval + restInterval);
    
    // If we're in rest period of current round, add work interval
    if (!isWork) {
      elapsed += workInterval;
    }
    
    return elapsed;
  }, [workInterval, restInterval, roundsPerSet]);

  // Helper function to calculate when extended rests should occur
  // Returns the time (in seconds from start of HIIT) when the nearest rest period begins
  const calculateNextExtendedRestTime = useCallback((currentElapsedTime, extendedRestInterval, work, rest) => {
    const intervalSeconds = extendedRestInterval * 60;
    const roundDuration = work + rest;
    
    // Calculate the target time (next multiple of extendedRestInterval)
    const currentIntervalIndex = Math.floor(currentElapsedTime / intervalSeconds);
    const targetTime = (currentIntervalIndex + 1) * intervalSeconds;
    
    // Calculate which rounds are near the target time
    // We only need to check rounds within one full round duration of the target
    const searchRadius = roundDuration * 2;
    const minTime = Math.max(0, targetTime - searchRadius);
    const maxTime = targetTime + searchRadius;
    
    // Find rest period start times near the target
    const restPeriods = [];
    let timeAccumulated = 0;
    let roundIndex = 0;
    
    // Calculate rest periods only in the relevant range
    while (timeAccumulated <= maxTime) {
      timeAccumulated += work; // Work period
      
      if (timeAccumulated >= minTime) {
        restPeriods.push(timeAccumulated); // Rest starts after work
      }
      
      timeAccumulated += rest; // Rest period
      roundIndex++;
      
      // Safety check to prevent infinite loop
      if (roundIndex > 1000) break;
    }
    
    // Handle edge case: no rest periods found
    if (restPeriods.length === 0) {
      // Return the target time as a fallback
      return targetTime;
    }
    
    // Find the rest period closest to targetTime
    let closestRestTime = restPeriods[0];
    let minDistance = Math.abs(restPeriods[0] - targetTime);
    
    for (const restTime of restPeriods) {
      const distance = Math.abs(restTime - targetTime);
      if (distance < minDistance) {
        minDistance = distance;
        closestRestTime = restTime;
      } else if (distance === minDistance) {
        // In case of exact difference, pick the greater number
        closestRestTime = Math.max(closestRestTime, restTime);
      }
    }
    
    return closestRestTime;
  }, []);

  // Save session length to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('goodlift_hiit_session_length', sessionLengthMinutes.toString());
  }, [sessionLengthMinutes]);

  // Save extended rest interval to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('goodlift_hiit_extended_rest_interval', extendedRestIntervalMinutes.toString());
  }, [extendedRestIntervalMinutes]);

  // Update rest interval when work interval or ratio changes
  useEffect(() => {
    if (mode === TIMER_MODES.HIIT) {
      const newRest = calculateRestInterval(workInterval, workRestRatio);
      setRestInterval(newRest);
    }
  }, [workInterval, workRestRatio, mode]);

  // Update rounds when session length, work, rest, or warmup changes
  useEffect(() => {
    if (mode === TIMER_MODES.HIIT) {
      const newRounds = calculateRoundsForSession(sessionLengthMinutes, workInterval, restInterval, warmupEnabled, warmupDuration);
      setRoundsPerSet(newRounds);
      // Adjust workIntervalNames array to match new rounds
      setWorkIntervalNames(prev => {
        const newNames = [...prev];
        while (newNames.length < newRounds) {
          newNames.push('');
        }
        return newNames.slice(0, newRounds);
      });
    }
  }, [mode, sessionLengthMinutes, workInterval, restInterval, warmupEnabled, warmupDuration, calculateRoundsForSession]);

  // Update preparation interval based on warmup settings
  useEffect(() => {
    if (mode === TIMER_MODES.HIIT) {
      if (warmupEnabled) {
        setPreparationInterval(warmupDuration * 60); // Convert minutes to seconds
      } else {
        setPreparationInterval(0); // No warmup
      }
    }
  }, [warmupEnabled, warmupDuration, mode]);

  // Load presets on mount
  useEffect(() => {
    const loadPresets = async () => {
      try {
        const yoga = await getYogaPresets();
        const hiit = await getHiitPresets();
        setYogaPresets(yoga);
        setHiitPresets(hiit);
      } catch (error) {
        console.error('Error loading presets:', error);
      }
    };
    loadPresets();
  }, []);

  // Load HIIT exercises for autocomplete
  useEffect(() => {
    const loadHiitExercises = async () => {
      try {
        const response = await fetch(HIIT_EXERCISES_DATA_PATH);
        const data = await response.json();
        setHiitExercises(data);
      } catch (error) {
        console.error('Error loading HIIT exercises:', error);
        setHiitExercises([]);
      }
    };
    loadHiitExercises();
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
          // Play audio cues during final 3 seconds
          if (prev === 3 || prev === 2) {
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
                // End of set break, start next set
                setIsRecoveryPeriod(false);
                setCurrentSet(currentSet + 1);
                setCurrentRound(1);
                setIsWorkPeriod(true);
                audioService.playHighBeep();
                hasPlayedWarningRef.current = false;
                return workInterval;
              } else if (isWorkPeriod) {
                // Track elapsed HIIT time for extended rest calculation using ref for synchronous access
                const newElapsedTime = elapsedHiitTimeRef.current + workInterval;
                elapsedHiitTimeRef.current = newElapsedTime;
                
                // Calculate if this rest period should be extended
                // Use a small tolerance for float comparison to avoid precision issues
                const shouldExtendRest = nextExtendedRestTime !== null && 
                  Math.abs(newElapsedTime - nextExtendedRestTime) < TIME_COMPARISON_TOLERANCE;
                
                // Switch to rest
                setIsWorkPeriod(false);
                setIsExtendedRest(shouldExtendRest);
                audioService.playLowBeep();
                hasPlayedWarningRef.current = false;
                
                // If this is an extended rest, calculate the next one
                if (shouldExtendRest) {
                  const nextTime = calculateNextExtendedRestTime(
                    newElapsedTime,
                    extendedRestIntervalMinutes,
                    workInterval,
                    restInterval
                  );
                  setNextExtendedRestTime(nextTime);
                }
                
                // Use extended rest (additional seconds added to normal rest interval)
                return shouldExtendRest ? restInterval + EXTENDED_REST_DURATION_SECONDS : restInterval;
              } else {
                // End of rest
                if (currentRound < roundsPerSet) {
                  // Continue to next round in current set
                  setCurrentRound(currentRound + 1);
                  setIsWorkPeriod(true);
                  audioService.playHighBeep();
                  hasPlayedWarningRef.current = false;
                  return workInterval;
                } else {
                  // End of current set
                  if (currentSet < numberOfSets) {
                    // Check if we need a recovery break between sets
                    if (recoveryBetweenSets > 0) {
                      setIsRecoveryPeriod(true);
                      audioService.playTransitionBeep();
                      hasPlayedWarningRef.current = false;
                      return recoveryBetweenSets;
                    } else {
                      // No recovery, go straight to next set
                      setCurrentSet(currentSet + 1);
                      setCurrentRound(1);
                      setIsWorkPeriod(true);
                      audioService.playHighBeep();
                      hasPlayedWarningRef.current = false;
                      return workInterval;
                    }
                  } else {
                    // All sets complete
                    handleTimerComplete();
                    return 0;
                  }
                }
              }
            } else if (mode === TIMER_MODES.FLOW) {
              // Handle Flow phase transitions
              if (currentPhaseIndex < yogaPhases.length - 1) {
                setCurrentPhaseIndex(currentPhaseIndex + 1);
                audioService.playChime(); // Use chime for relaxing transition
                hasPlayedWarningRef.current = false;
                return yogaPhases[currentPhaseIndex + 1].duration * 60; // Convert minutes to seconds
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
  }, [isRunning, isPaused, mode, isWorkPeriod, isPrepPeriod, isRecoveryPeriod, currentRound, currentSet, roundsPerSet, numberOfSets, currentPhaseIndex, yogaPhases, workInterval, restInterval, recoveryBetweenSets, nextExtendedRestTime, extendedRestIntervalMinutes, calculateNextExtendedRestTime, handleTimerComplete]);

  const handleStart = () => {
    if (isConfiguring) {
      // Initialize based on mode
      if (mode === TIMER_MODES.HIIT) {
        // Reset elapsed time and extended rest tracking
        elapsedHiitTimeRef.current = 0;
        setIsExtendedRest(false);
        
        // Calculate the first extended rest time
        const firstExtendedRestTime = calculateNextExtendedRestTime(
          0,
          extendedRestIntervalMinutes,
          workInterval,
          restInterval
        );
        setNextExtendedRestTime(firstExtendedRestTime);
        
        // Calculate total time for all sets
        const timePerSet = roundsPerSet * (workInterval + restInterval);
        const totalSetBreaks = numberOfSets > 1 && recoveryBetweenSets > 0 
          ? (numberOfSets - 1) * recoveryBetweenSets 
          : 0;
        setTotalTime(preparationInterval + (numberOfSets * timePerSet) + totalSetBreaks);
        
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
        setCurrentSet(1);
        setCurrentRound(1);
        setIsRecoveryPeriod(false);
      } else if (mode === TIMER_MODES.FLOW) {
        const total = yogaPhases.reduce((sum, phase) => sum + (phase.duration * 60), 0);
        setTotalTime(total);
        setTimeRemaining(yogaPhases[0]?.duration * 60 || 180); // Convert minutes to seconds
        setCurrentPhaseIndex(0);
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
    setCurrentSet(1);
    setCurrentRound(1);
    setIsWorkPeriod(true);
    setIsPrepPeriod(false);
    setIsRecoveryPeriod(false);
    setCurrentPhaseIndex(0);
    elapsedHiitTimeRef.current = 0;
    setIsExtendedRest(false);
    setNextExtendedRestTime(null);
  };

  const handleModeChange = (event, newMode) => {
    if (newMode !== null) {
      setMode(newMode);
      handleReset();
    }
  };

  // Skip forward to next interval (HIIT or Yoga)
  const handleSkipForward = () => {
    if (mode === TIMER_MODES.HIIT) {
      // Skip to next phase in HIIT
      if (isPrepPeriod) {
        setIsPrepPeriod(false);
        setIsWorkPeriod(true);
        setTimeRemaining(workInterval);
        // Elapsed time remains 0 as we're just starting HIIT
        elapsedHiitTimeRef.current = 0;
        // Recalculate next extended rest from start
        const nextTime = calculateNextExtendedRestTime(0, extendedRestIntervalMinutes, workInterval, restInterval);
        setNextExtendedRestTime(nextTime);
        setIsExtendedRest(false);
      } else if (isWorkPeriod) {
        // Skipping from work to rest
        const newElapsedTime = calculateElapsedTimeFromPosition(currentSet, currentRound, false, false, false);
        elapsedHiitTimeRef.current = newElapsedTime;
        
        // Check if this rest should be extended
        const shouldExtend = nextExtendedRestTime !== null && Math.abs(newElapsedTime - nextExtendedRestTime) < TIME_COMPARISON_TOLERANCE;
        setIsExtendedRest(shouldExtend);
        
        // If extended, recalculate next extended rest time
        if (shouldExtend) {
          const nextTime = calculateNextExtendedRestTime(newElapsedTime, extendedRestIntervalMinutes, workInterval, restInterval);
          setNextExtendedRestTime(nextTime);
          setTimeRemaining(restInterval + EXTENDED_REST_DURATION_SECONDS);
        } else {
          setTimeRemaining(restInterval);
        }
        
        setIsWorkPeriod(false);
      } else if (isRecoveryPeriod) {
        setIsRecoveryPeriod(false);
        setCurrentSet(currentSet + 1);
        setCurrentRound(1);
        setIsWorkPeriod(true);
        setTimeRemaining(workInterval);
        // Update elapsed time for new set
        const newElapsedTime = calculateElapsedTimeFromPosition(currentSet + 1, 1, true, false, false);
        elapsedHiitTimeRef.current = newElapsedTime;
        setIsExtendedRest(false);
      } else {
        // End of rest - skip to next work period
        if (currentRound < roundsPerSet) {
          setCurrentRound(currentRound + 1);
          setIsWorkPeriod(true);
          setTimeRemaining(workInterval);
          // Update elapsed time for next round
          const newElapsedTime = calculateElapsedTimeFromPosition(currentSet, currentRound + 1, true, false, false);
          elapsedHiitTimeRef.current = newElapsedTime;
          setIsExtendedRest(false);
        } else if (currentSet < numberOfSets) {
          if (recoveryBetweenSets > 0) {
            setIsRecoveryPeriod(true);
            setTimeRemaining(recoveryBetweenSets);
            // Elapsed time stays the same during recovery
          } else {
            setCurrentSet(currentSet + 1);
            setCurrentRound(1);
            setIsWorkPeriod(true);
            setTimeRemaining(workInterval);
            // Update elapsed time for new set
            const newElapsedTime = calculateElapsedTimeFromPosition(currentSet + 1, 1, true, false, false);
            elapsedHiitTimeRef.current = newElapsedTime;
            setIsExtendedRest(false);
          }
        }
      }
      audioService.playTransitionBeep();
    } else if (mode === TIMER_MODES.FLOW && currentPhaseIndex < yogaPhases.length - 1) {
      setCurrentPhaseIndex(currentPhaseIndex + 1);
      setTimeRemaining(yogaPhases[currentPhaseIndex + 1].duration * 60); // Convert minutes to seconds
      audioService.playChime();
    }
  };

  // Skip backward to previous interval (HIIT or Yoga)
  const handleSkipBackward = () => {
    if (mode === TIMER_MODES.HIIT) {
      // Skip to previous phase in HIIT
      if (isWorkPeriod && currentRound > 1) {
        // Go back to previous round's rest
        setIsWorkPeriod(false);
        setCurrentRound(currentRound - 1);
        
        // Calculate elapsed time for previous round's rest
        const newElapsedTime = calculateElapsedTimeFromPosition(currentSet, currentRound - 1, false, false, false);
        elapsedHiitTimeRef.current = newElapsedTime;
        
        // Check if this rest should be extended
        const shouldExtend = nextExtendedRestTime !== null && Math.abs(newElapsedTime - nextExtendedRestTime) < TIME_COMPARISON_TOLERANCE;
        setIsExtendedRest(shouldExtend);
        setTimeRemaining(shouldExtend ? restInterval + EXTENDED_REST_DURATION_SECONDS : restInterval);
      } else if (isWorkPeriod && currentRound === 1 && currentSet > 1) {
        // Go back to previous set
        if (recoveryBetweenSets > 0) {
          setIsRecoveryPeriod(true);
          setCurrentSet(currentSet - 1);
          setCurrentRound(roundsPerSet);
          setTimeRemaining(recoveryBetweenSets);
          // Elapsed time for end of previous set
          const newElapsedTime = calculateElapsedTimeFromPosition(currentSet - 1, roundsPerSet, false, false, true);
          elapsedHiitTimeRef.current = newElapsedTime;
          setIsExtendedRest(false);
        } else {
          setCurrentSet(currentSet - 1);
          setCurrentRound(roundsPerSet);
          setIsWorkPeriod(false);
          
          // Calculate elapsed time for previous set's last rest
          const newElapsedTime = calculateElapsedTimeFromPosition(currentSet - 1, roundsPerSet, false, false, false);
          elapsedHiitTimeRef.current = newElapsedTime;
          
          // Check if this rest should be extended
          const shouldExtend = nextExtendedRestTime !== null && Math.abs(newElapsedTime - nextExtendedRestTime) < TIME_COMPARISON_TOLERANCE;
          setIsExtendedRest(shouldExtend);
          setTimeRemaining(shouldExtend ? restInterval + EXTENDED_REST_DURATION_SECONDS : restInterval);
        }
      } else if (!isWorkPeriod && !isPrepPeriod && !isRecoveryPeriod) {
        // Go back from rest to work in same round
        setIsWorkPeriod(true);
        setTimeRemaining(workInterval);
        
        // Calculate elapsed time for current round's work
        const newElapsedTime = calculateElapsedTimeFromPosition(currentSet, currentRound, true, false, false);
        elapsedHiitTimeRef.current = newElapsedTime;
        setIsExtendedRest(false);
      } else if (isRecoveryPeriod) {
        // Go back from recovery to previous set's rest
        setIsRecoveryPeriod(false);
        setIsWorkPeriod(false);
        
        // Calculate elapsed time for previous set's last rest
        const newElapsedTime = calculateElapsedTimeFromPosition(currentSet, roundsPerSet, false, false, false);
        elapsedHiitTimeRef.current = newElapsedTime;
        
        // Check if this rest should be extended
        const shouldExtend = nextExtendedRestTime !== null && Math.abs(newElapsedTime - nextExtendedRestTime) < TIME_COMPARISON_TOLERANCE;
        setIsExtendedRest(shouldExtend);
        setTimeRemaining(shouldExtend ? restInterval + EXTENDED_REST_DURATION_SECONDS : restInterval);
      }
      audioService.playTransitionBeep();
    } else if (mode === TIMER_MODES.FLOW && currentPhaseIndex > 0) {
      setCurrentPhaseIndex(currentPhaseIndex - 1);
      setTimeRemaining(yogaPhases[currentPhaseIndex - 1].duration * 60); // Convert minutes to seconds
      audioService.playChime();
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
          phases: yogaPhases,
        };
        await saveYogaPreset(preset);
        const updatedPresets = await getYogaPresets();
        setYogaPresets(updatedPresets);
      } else if (mode === TIMER_MODES.HIIT) {
        const preset = {
          id: editingPreset?.id,
          name: presetName,
          workInterval,
          restInterval,
          roundsPerSet,
          numberOfSets,
          preparationInterval,
          recoveryBetweenSets,
          sessionName,
          workIntervalNames,
          intervalNames,
          // New configuration options
          workRestRatio,
          sessionLengthMinutes,
          warmupEnabled,
          warmupDuration,
          extendedRestIntervalMinutes,
        };
        await saveHiitPreset(preset);
        const updatedPresets = await getHiitPresets();
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
      if (preset.phases) {
        setYogaPhases(preset.phases);
      } else {
        // Fallback to default phases
        setYogaPhases(YOGA_PHASES.map(phase => ({ ...phase, duration: phase.defaultDuration })));
      }
    } else if (mode === TIMER_MODES.HIIT) {
      // Load new configuration options if available
      setWorkRestRatio(preset.workRestRatio || '2:1');
      setSessionLengthMinutes(preset.sessionLengthMinutes || 10);
      setWarmupEnabled(preset.warmupEnabled !== undefined ? preset.warmupEnabled : true);
      setWarmupDuration(preset.warmupDuration || 5);
      setExtendedRestIntervalMinutes(preset.extendedRestIntervalMinutes || 8);
      
      setWorkInterval(preset.workInterval || 30);
      setRestInterval(preset.restInterval || 15);
      // Handle backward compatibility: if preset has 'rounds', it's old format
      if (preset.rounds !== undefined && preset.roundsPerSet === undefined) {
        setRoundsPerSet(preset.rounds);
        setNumberOfSets(1);
      } else {
        setRoundsPerSet(preset.roundsPerSet || 8);
        setNumberOfSets(preset.numberOfSets || 1);
      }
      setPreparationInterval(preset.preparationInterval || 10);
      // Handle backward compatibility for recovery
      if (preset.recoveryInterval !== undefined && preset.recoveryBetweenSets === undefined) {
        setRecoveryBetweenSets(preset.recoveryInterval || 0);
      } else {
        setRecoveryBetweenSets(preset.recoveryBetweenSets || 0);
      }
      setSessionName(preset.sessionName || '');
      setWorkIntervalNames(preset.workIntervalNames || []);
      setIntervalNames(preset.intervalNames || { prep: 'Get Ready', recovery: 'Set Break' });
    }
  };

  // Delete a preset
  const handleDeletePreset = async (presetId) => {
    try {
      if (mode === TIMER_MODES.FLOW) {
        await deleteYogaPreset(presetId);
        const updatedPresets = await getYogaPresets();
        setYogaPresets(updatedPresets);
      } else if (mode === TIMER_MODES.HIIT) {
        await deleteHiitPreset(presetId);
        const updatedPresets = await getHiitPresets();
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
      
      // Navigate back to home (WorkTabs) if callback provided
      if (onNavigate) {
        setTimeout(() => onNavigate('home'), 500);
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

  const getModalHeaderInfo = () => {
    if (mode === TIMER_MODES.HIIT) {
      if (isPrepPeriod) {
        return 'Get Ready';
      } else if (isRecoveryPeriod) {
        return `Set ${currentSet} of ${numberOfSets} - Break`;
      } else if (numberOfSets > 1) {
        return `Set ${currentSet} of ${numberOfSets} - Round ${currentRound} of ${roundsPerSet}`;
      } else {
        return `Round ${currentRound} of ${roundsPerSet}`;
      }
    } else if (mode === TIMER_MODES.FLOW) {
      return yogaPhases[currentPhaseIndex]?.name || 'Yoga Session';
    } else {
      return 'Cardio Session';
    }
  };



  return (
    <Box sx={{ 
      width: '100%', 
      p: { xs: 2, sm: 3 }, 
      bgcolor: 'background.default',
      maxWidth: '100vw',
      overflow: 'hidden',
    }}>
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
              <ToggleButtonGroup
                value={mode}
                exclusive
                onChange={handleModeChange}
                fullWidth
                sx={{ mb: 3 }}
              >
                <ToggleButton value={TIMER_MODES.HIIT} sx={{ py: 1 }}>
                  <Typography variant="body2">HIIT</Typography>
                </ToggleButton>
                <ToggleButton value={TIMER_MODES.FLOW} sx={{ py: 1 }}>
                  <Typography variant="body2">Yoga</Typography>
                </ToggleButton>
                <ToggleButton value={TIMER_MODES.CARDIO} sx={{ py: 1 }}>
                  <Typography variant="body2">Cardio</Typography>
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
                      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                        <Typography variant="subtitle2" sx={{ flex: 1 }}>
                          Saved Presets
                        </Typography>
                        <Button
                          size="small"
                          startIcon={isEditingPresets ? <Save /> : <Edit />}
                          onClick={() => setIsEditingPresets(!isEditingPresets)}
                        >
                          {isEditingPresets ? 'Done' : 'Manage'}
                        </Button>
                      </Stack>
                      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                        {hiitPresets.map((preset) => (
                          <Box key={preset.id} sx={{ position: 'relative', display: 'inline-block' }}>
                            <Chip
                              label={preset.name}
                              onClick={() => !isEditingPresets && handleLoadPreset(preset)}
                              color="primary"
                              variant="outlined"
                              sx={{ 
                                mb: 1,
                                cursor: isEditingPresets ? 'default' : 'pointer',
                                opacity: isEditingPresets ? 0.7 : 1,
                              }}
                            />
                            {isEditingPresets && (
                              <IconButton
                                size="small"
                                onClick={() => handleDeletePreset(preset.id)}
                                sx={{
                                  position: 'absolute',
                                  top: -8,
                                  right: -8,
                                  bgcolor: 'error.main',
                                  color: 'white',
                                  width: 20,
                                  height: 20,
                                  '&:hover': {
                                    bgcolor: 'error.dark',
                                  },
                                }}
                              >
                                <Delete sx={{ fontSize: 14 }} />
                              </IconButton>
                            )}
                          </Box>
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

                  {/* Warmup Selection */}
                  <DialPicker
                    label="Warmup"
                    value={warmupEnabled ? warmupDuration : 0}
                    options={[
                      { label: 'Off', value: 0 },
                      { label: '2 min', value: 2 },
                      { label: '5 min', value: 5 },
                      { label: '7 min', value: 7 },
                      { label: '10 min', value: 10 },
                    ]}
                    onChange={(newValue) => {
                      if (newValue === 0) {
                        setWarmupEnabled(false);
                        setWarmupDuration(0);
                      } else {
                        setWarmupEnabled(true);
                        setWarmupDuration(newValue);
                      }
                    }}
                  />

                  {/* Session Length Selector */}
                  <Box>
                    <Typography variant="subtitle2" gutterBottom>
                      Session Length
                    </Typography>
                    <Stack direction="row" spacing={2} alignItems="center" justifyContent="center">
                      <IconButton
                        onClick={() => setSessionLengthMinutes(prev => Math.max(10, prev - 2.5))}
                        color="primary"
                        disabled={sessionLengthMinutes <= 10}
                      >
                        <Remove />
                      </IconButton>
                      <Typography variant="h6" sx={{ minWidth: '80px', textAlign: 'center' }}>
                        {sessionLengthMinutes} min
                      </Typography>
                      <IconButton
                        onClick={() => setSessionLengthMinutes(prev => prev + 2.5)}
                        color="primary"
                      >
                        <Add />
                      </IconButton>
                    </Stack>
                  </Box>

                  {/* Work:Rest Ratio Selector */}
                  <DialPicker
                    label="Work:Rest Ratio"
                    value={workRestRatio}
                    options={[
                      { label: '1:1', value: '1:1' },
                      { label: '3:2', value: '3:2' },
                      { label: '2:1', value: '2:1' },
                    ]}
                    onChange={setWorkRestRatio}
                    useArrows={true}
                  />

                  {/* Work Time Selection */}
                  <DialPicker
                    label="Work Time"
                    value={workInterval}
                    options={[
                      { label: '20s', value: 20 },
                      { label: '30s', value: 30 },
                      { label: '45s', value: 45 },
                      { label: '60s', value: 60 },
                      { label: '90s', value: 90 },
                      { label: '2m', value: 120 },
                      { label: '4m', value: 240 },
                    ]}
                    onChange={setWorkInterval}
                    sx={{ mb: 1 }}
                  />
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: 'center' }}>
                    Rest time: {restInterval}s (auto-calculated from ratio)
                  </Typography>

                  {/* Extended Rest Interval Selector */}
                  <DialPicker
                    label="Extended Rest Every"
                    value={extendedRestIntervalMinutes}
                    options={[
                      { label: '4 min', value: 4 },
                      { label: '6 min', value: 6 },
                      { label: '8 min', value: 8 },
                      { label: '10 min', value: 10 },
                      { label: '12 min', value: 12 },
                    ]}
                    onChange={setExtendedRestIntervalMinutes}
                    useArrows={true}
                  />
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: 'center', mb: 2 }}>
                    Adds {EXTENDED_REST_DURATION_SECONDS}s to rest nearest each interval mark
                  </Typography>
                  
                  {/* Exercise Names for Each Round */}
                  <Box>
                    <Button
                      onClick={() => setExerciseNamesExpanded(!exerciseNamesExpanded)}
                      endIcon={
                        <ExpandMore
                          sx={{
                            transform: exerciseNamesExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                            transition: 'transform 0.3s',
                          }}
                        />
                      }
                      sx={{ mb: 1, justifyContent: 'space-between', width: '100%', textAlign: 'left' }}
                    >
                      <Typography variant="subtitle2">
                        Exercises
                      </Typography>
                    </Button>
                    <Collapse in={exerciseNamesExpanded}>
                      <Stack spacing={1.5}>
                        {Array.from({ length: roundsPerSet || 0 }).map((_, index) => (
                          <HiitExerciseAutocomplete
                            key={index}
                            label={`Round ${index + 1}`}
                            value={workIntervalNames[index] || ''}
                            onChange={(event, newValue) => {
                              const newNames = [...workIntervalNames];
                              // Handle both object (selected from list) and string (typed) values
                              if (typeof newValue === 'string') {
                                newNames[index] = newValue;
                              } else if (newValue && newValue.name) {
                                newNames[index] = newValue.name;
                              } else {
                                newNames[index] = '';
                              }
                              setWorkIntervalNames(newNames);
                            }}
                            availableExercises={hiitExercises}
                            placeholder="e.g., push-ups, burpees"
                            size="small"
                            fullWidth
                          />
                        ))}
                      </Stack>
                    </Collapse>
                  </Box>
                  
                  <Typography variant="body2" color="text.secondary">
                    Total: ~{sessionLengthMinutes} min • {roundsPerSet} rounds • Extended rest every {extendedRestIntervalMinutes} min
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
                    >
                      Save Preset
                    </Button>
                  </Stack>

                  {/* Presets */}
                  {yogaPresets.length > 0 && (
                    <Box>
                      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                        <Typography variant="subtitle2" sx={{ flex: 1 }}>
                          Saved Presets
                        </Typography>
                        <Button
                          size="small"
                          startIcon={isEditingPresets ? <Save /> : <Edit />}
                          onClick={() => setIsEditingPresets(!isEditingPresets)}
                        >
                          {isEditingPresets ? 'Done' : 'Manage'}
                        </Button>
                      </Stack>
                      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                        {yogaPresets.map((preset) => (
                          <Box key={preset.id} sx={{ position: 'relative', display: 'inline-block' }}>
                            <Chip
                              label={preset.name}
                              onClick={() => !isEditingPresets && handleLoadPreset(preset)}
                              color="primary"
                              variant="outlined"
                              icon={<Favorite />}
                              sx={{ 
                                mb: 1,
                                cursor: isEditingPresets ? 'default' : 'pointer',
                                opacity: isEditingPresets ? 0.7 : 1,
                              }}
                            />
                            {isEditingPresets && (
                              <IconButton
                                size="small"
                                onClick={() => handleDeletePreset(preset.id)}
                                sx={{
                                  position: 'absolute',
                                  top: -8,
                                  right: -8,
                                  bgcolor: 'error.main',
                                  color: 'white',
                                  width: 20,
                                  height: 20,
                                  '&:hover': {
                                    bgcolor: 'error.dark',
                                  },
                                }}
                              >
                                <Delete sx={{ fontSize: 14 }} />
                              </IconButton>
                            )}
                          </Box>
                        ))}
                      </Stack>
                    </Box>
                  )}

                  {/* Phase Duration Inputs */}
                  <Typography variant="subtitle2" sx={{ mt: 2 }}>
                    Phase Durations
                  </Typography>
                  {yogaPhases.map((phase, index) => (
                    <TextField
                      key={index}
                      label={`${phase.name} (minutes)`}
                      type="number"
                      value={phase.duration === null || phase.duration === undefined ? '' : phase.duration}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === '' || val === null) {
                          // Allow clearing the field - set to null for easier editing
                          const newPhases = [...yogaPhases];
                          newPhases[index] = { ...phase, duration: null };
                          setYogaPhases(newPhases);
                        } else {
                          const parsed = parseInt(val, 10);
                          if (!isNaN(parsed) && parsed > 0 && parsed <= 60) {
                            const newPhases = [...yogaPhases];
                            newPhases[index] = { ...phase, duration: parsed };
                            setYogaPhases(newPhases);
                          }
                        }
                      }}
                      onBlur={(e) => {
                        // Restore default value if left empty
                        if (e.target.value === '' || phase.duration === null) {
                          const newPhases = [...yogaPhases];
                          newPhases[index] = { ...phase, duration: phase.defaultDuration };
                          setYogaPhases(newPhases);
                        }
                      }}
                      onFocus={(e) => {
                        // Auto-select the value when focused for easier editing
                        e.target.select();
                      }}
                      inputProps={{ min: 1, max: 60, inputMode: 'numeric' }}
                      fullWidth
                    />
                  ))}
                  
                  {/* Session Summary */}
                  <Box sx={{ p: 2, bgcolor: 'primary.light', borderRadius: 1, mt: 2 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                      Session Summary
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Duration: {yogaPhases.reduce((sum, p) => sum + (p.duration || p.defaultDuration || 0), 0)} minutes
                    </Typography>
                  </Box>
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
                        const parsed = parseInt(val);
                        setCardioDuration(isNaN(parsed) ? '' : parsed);
                      }
                    }}
                    onFocus={(e) => {
                      // Auto-select the value when focused for easier editing
                      e.target.select();
                    }}
                    onBlur={(e) => {
                      const val = e.target.value;
                      if (val === '' || val === null) {
                        setCardioDuration(20);
                      } else {
                        const parsed = parseInt(val);
                        setCardioDuration(Math.max(1, Math.min(240, isNaN(parsed) ? 20 : parsed)));
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

        {/* Timer Display Modal */}
        <TimerModal
          open={!isConfiguring}
          mode={mode}
          currentInfo={getModalHeaderInfo()}
          onExit={handleStop}
        >
          <TimerDisplay
            mode={mode}
            isRunning={isRunning}
            isPaused={isPaused}
            timeRemaining={timeRemaining}
            formatTime={formatTime}
            isWorkPeriod={isWorkPeriod}
            isPrepPeriod={isPrepPeriod}
            isRecoveryPeriod={isRecoveryPeriod}
            isExtendedRest={isExtendedRest}
            currentRound={currentRound}
            currentSet={currentSet}
            roundsPerSet={roundsPerSet}
            numberOfSets={numberOfSets}
            workIntervalNames={workIntervalNames}
            intervalNames={intervalNames}
            sessionName={sessionName}
            currentPhaseIndex={currentPhaseIndex}
            yogaPhases={yogaPhases}
            handleStart={handleStart}
            handlePause={handlePause}
            handleStop={handleStop}
            handleReset={handleReset}
            handleSkipForward={handleSkipForward}
            handleSkipBackward={handleSkipBackward}
          />
        </TimerModal>

        {/* Start Button for configuration */}
        {isConfiguring && (
          <Button
            variant="contained"
            size="large"
            fullWidth
            onClick={handleStart}
            sx={{ mb: 2, py: 2 }}
          >
            Start Session
          </Button>
        )}

        {/* Back Button */}
        {onNavigate && !hideBackButton && (
          <Button
            variant="outlined"
            fullWidth
            onClick={() => onNavigate('home')}
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
                  ? 'This will save your current yoga phase configuration'
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
