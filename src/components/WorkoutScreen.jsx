import { useState, useEffect, useRef, useMemo } from 'react';
import PropTypes from 'prop-types';
import { motion, AnimatePresence } from 'framer-motion';
import { formatTime, detectWorkoutType } from '../utils/helpers';
import { getExerciseWeight, getExerciseTargetReps, setExerciseWeight, setExerciseTargetReps, saveFavoriteWorkout, getWorkoutHistory } from '../utils/storage';
import { Box, LinearProgress, Typography, IconButton, Snackbar, Alert, Button, Chip, useTheme, useMediaQuery, keyframes, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import { ArrowBack, ArrowForward, ExitToApp, Star, StarBorder, Add, Remove, SkipNext, TrendingUp, HelpOutline, SwapHoriz, PlaylistAdd, Settings } from '@mui/icons-material';
import StretchReminder from './StretchReminder';
import { calculateProgressiveOverload } from '../utils/progressiveOverload';
import progressiveOverloadService from '../services/ProgressiveOverloadService';
import SwapExerciseDialog from './Common/SwapExerciseDialog';
import SaveModifiedWorkoutDialog from './Common/SaveModifiedWorkoutDialog';
import TargetRepsPicker from './Common/TargetRepsPicker';
import { getDemoImagePath } from '../utils/exerciseDemoImages';
import { isSvgDataUrl, extractSvgFromDataUrl, getMuscleHighlightDataUrl } from '../utils/muscleHighlightSvg';
import { 
  DEFAULT_TARGET_REPS, 
  getClosestValidTargetReps, 
  calculateWeightForRepChange,
  getNextWeight,
  getPreviousWeight,
} from '../utils/repRangeWeightAdjustment';
import { calculateBarbellPerSide } from '../utils/weightUtils';
import { usePreferences } from '../contexts/PreferencesContext';

// Spinning animation for finish celebration (counter-clockwise like loading screen)
const spin = keyframes`
  from {
    transform: rotate(360deg);
  }
  to {
    transform: rotate(0deg);
  }
`;

/**
 * WorkoutScreen component manages the active workout session
 * Displays exercises in superset format, tracks time, and collects set data
 * Supports mid-workout exercise swapping and adding extra sets
 */
const WorkoutScreen = ({ workoutPlan: initialWorkoutPlan, onComplete, onExit, supersetConfig = [2, 2, 2, 2], setsPerSuperset = 3, savedWorkoutId = null, savedWorkoutName = null, onSetComplete = null, onProgressUpdate = null, initialProgress = null }) => {
  // Mutable workout plan that can be modified during workout
  const [workoutPlan, setWorkoutPlan] = useState(initialWorkoutPlan);
  const [currentStepIndex, setCurrentStepIndex] = useState(initialProgress?.currentStepIndex ?? 0);
  const [workoutData, setWorkoutData] = useState(initialProgress?.workoutData ?? []);
  const [elapsedTime, setElapsedTime] = useState(initialProgress?.elapsedTime ?? 0);
  const [prevWeight, setPrevWeight] = useState(null);
  const [targetReps, setTargetReps] = useState(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  // Store initial target values for each exercise at workout start
  const [initialTargets, setInitialTargets] = useState({});
  // Store last performance data for each exercise
  const [lastPerformance, setLastPerformance] = useState({});
  // Progressive overload suggestion state
  const [progressiveOverloadSuggestion, setProgressiveOverloadSuggestion] = useState(null);
  const [showSuggestion, setShowSuggestion] = useState(false);
  // Current set weight and reps (controlled inputs)
  const [currentWeight, setCurrentWeight] = useState('');
  const [currentReps, setCurrentReps] = useState('');
  // Track exercises where weight was changed during workout (to disable progressive overload)
  const [exercisesWithChangedWeight, setExercisesWithChangedWeight] = useState(new Set());
  // Track the updated weight for each exercise (for propagation to subsequent sets)
  const [updatedWeights, setUpdatedWeights] = useState({});
  // Track updated target reps for each exercise (for mid-workout changes)
  const [updatedTargetReps, setUpdatedTargetReps] = useState({});
  // Track finishing state to prevent multiple clicks
  const [isFinishing, setIsFinishing] = useState(false);
  
  // Workout modification tracking
  const [hasModifications, setHasModifications] = useState(false);
  const [swapDialogOpen, setSwapDialogOpen] = useState(false);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [addSetsDialogOpen, setAddSetsDialogOpen] = useState(false);
  // Target reps change dialog state
  const [targetRepsDialogOpen, setTargetRepsDialogOpen] = useState(false);
  const [pendingTargetReps, setPendingTargetReps] = useState(null);
  // End workout dialog state
  const [endWorkoutDialogOpen, setEndWorkoutDialogOpen] = useState(false);
  
  const startTimeRef = useRef(null);
  const timerRef = useRef(null);
  const exerciseNameRef = useRef(null);
  const [exerciseFontSize, setExerciseFontSize] = useState('48px'); // Default responsive size for mobile
  
  // Demo image state
  const [demoImageSrc, setDemoImageSrc] = useState(null);
  const [imageError, setImageError] = useState(false);
  
  // Stretching phase state - initialize from saved progress if available
  const [currentPhase, setCurrentPhase] = useState(initialProgress?.currentPhase ?? 'warmup'); // 'warmup', 'exercise', 'cooldown', 'complete'
  const [warmupCompleted, setWarmupCompleted] = useState(false);
  const [warmupSkipped, setWarmupSkipped] = useState(false);
  const [cooldownCompleted, setCooldownCompleted] = useState(false);
  const [cooldownSkipped, setCooldownSkipped] = useState(false);
  const [workoutType, setWorkoutType] = useState('full');
  
  // Theme and media queries for responsive layout
  const theme = useTheme();
  const isTabletOrLarger = useMediaQuery(theme.breakpoints.up('sm'));
  const isLandscape = useMediaQuery('(orientation: landscape)');
  const shouldUseTwoColumns = isTabletOrLarger && isLandscape;
  
  // Get user preferences for barbell weight
  const { preferences } = usePreferences();
  
  // Construct Work Icon URL with robust path handling
  const baseUrl = import.meta.env.BASE_URL || '/';
  const workIconUrl = baseUrl.endsWith('/') ? `${baseUrl}work-icon.svg` : `${baseUrl}/work-icon.svg`;
  
  // Track workoutData length to avoid excessive re-renders 
  // (workoutData array changes frequently during workout)
  const workoutDataLength = workoutData.length;
  
  // Report progress updates to parent for session persistence
  // Use workoutDataLength instead of workoutData to reduce re-renders
  useEffect(() => {
    if (onProgressUpdate) {
      onProgressUpdate({
        currentStepIndex,
        workoutData,
        elapsedTime,
        currentPhase,
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStepIndex, workoutDataLength, elapsedTime, currentPhase, onProgressUpdate]);

  // Generate workout sequence (supersets) - memoized to prevent recalculation
  // Now supports custom superset configurations like [2, 3, 2, 3]
  // Each exercise can have its own number of sets, which is read from exercise.sets property
  const workoutSequence = useMemo(() => {
    const sequence = [];
    let exerciseIndex = 0;
    
    for (const supersetSize of supersetConfig) {
      const supersetExercises = [];
      
      // Collect exercises for this superset
      for (let i = 0; i < supersetSize && exerciseIndex < workoutPlan.length; i++) {
        if (workoutPlan[exerciseIndex]) {
          supersetExercises.push(workoutPlan[exerciseIndex]);
        }
        exerciseIndex++;
      }
      
      // Skip if no exercises in this superset
      if (supersetExercises.length === 0) continue;
      
      // Find the maximum number of sets among exercises in this superset
      // This ensures all exercises in a superset are done for the same number of sets
      const maxSets = Math.max(
        ...supersetExercises.map(ex => ex.sets || setsPerSuperset || 3)
      );
      
      // Add all sets for this superset
      for (let set = 1; set <= maxSets; set++) {
        for (const exercise of supersetExercises) {
          sequence.push({ exercise, setNumber: set, totalSets: maxSets });
        }
      }
    }
    
    return sequence;
  }, [workoutPlan, supersetConfig, setsPerSuperset]);

  // Calculate indices where rest timer should trigger
  // Rest timer triggers:
  // 1. Between supersets (after completing all sets of a superset, before starting next superset)
  // 2. For ungrouped exercises (superset size = 1): between sets of that single exercise
  // Rest timer should NOT trigger between sets within a superset (when superset has multiple exercises)
  const setRoundEndIndices = useMemo(() => {
    const endIndices = new Set();
    let seqIndex = 0;
    let exerciseIndex = 0;
    const totalSupersets = supersetConfig.length;
    let supersetIdx = 0;
    
    for (const supersetSize of supersetConfig) {
      const supersetExercises = [];
      
      // Collect exercises for this superset
      for (let i = 0; i < supersetSize && exerciseIndex < workoutPlan.length; i++) {
        if (workoutPlan[exerciseIndex]) {
          supersetExercises.push(workoutPlan[exerciseIndex]);
        }
        exerciseIndex++;
      }
      
      if (supersetExercises.length === 0) {
        supersetIdx++;
        continue;
      }
      
      const maxSets = Math.max(
        ...supersetExercises.map(ex => ex.sets || setsPerSuperset || 3)
      );
      
      const isUngroupedExercise = supersetExercises.length === 1;
      const isLastSuperset = supersetIdx === totalSupersets - 1;
      
      for (let set = 1; set <= maxSets; set++) {
        seqIndex += supersetExercises.length;
        const isLastSetOfSuperset = set === maxSets;
        
        if (isUngroupedExercise) {
          // For ungrouped exercises: trigger rest between sets (but not after the last set if it's the last superset)
          if (!isLastSetOfSuperset || !isLastSuperset) {
            endIndices.add(seqIndex - 1);
          }
        } else {
          // For supersets with multiple exercises: only trigger rest between supersets
          // i.e., after the last set of this superset, before the next superset
          if (isLastSetOfSuperset && !isLastSuperset) {
            endIndices.add(seqIndex - 1);
          }
        }
      }
      
      supersetIdx++;
    }
    
    return endIndices;
  }, [workoutPlan, supersetConfig, setsPerSuperset]);

  // Detect workout type and check user preferences for stretch reminders
  useEffect(() => {
    // Detect workout type from exercises
    const type = detectWorkoutType(workoutPlan[0]);
    setWorkoutType(type);
    
    // Check user preferences for skipping
    const prefs = localStorage.getItem('goodlift_stretch_prefs');
    const preferences = prefs ? JSON.parse(prefs) : { 
      showWarmup: true, 
      showCooldown: true,
      defaultWarmupDuration: 5,
      defaultCooldownDuration: 5
    };
    
    // Skip warmup if preference is disabled
    if (!preferences.showWarmup) {
      setWarmupSkipped(true);
      setCurrentPhase('exercise');
    }
  }, [workoutPlan]);

  // Start timer on mount and load initial target values
  useEffect(() => {
    startTimeRef.current = Date.now();
    timerRef.current = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
      setElapsedTime(elapsed);
    }, 1000);

    // Load initial target values and last performance for all exercises at workout start
    const loadInitialData = async () => {
      const targets = {};
      const lastPerf = {};
      const uniqueExercises = [...new Set(workoutPlan.map(ex => ex['Exercise Name']))];
      
      // Load workout history to get last performance
      const history = await getWorkoutHistory();
      
      await Promise.all(
        uniqueExercises.map(async (exerciseName) => {
          const [weight, reps] = await Promise.all([
            getExerciseWeight(exerciseName),
            getExerciseTargetReps(exerciseName)
          ]);
          targets[exerciseName] = {
            weight: weight ?? null,
            // Convert to valid target reps
            reps: reps ? getClosestValidTargetReps(reps) : DEFAULT_TARGET_REPS
          };
          
          // Get last performance from history
          // Always track by weight since that's what the workout screen uses for input
          const progression = progressiveOverloadService.getExerciseProgression(
            history,
            exerciseName,
            'weight'
          );
          
          if (progression.length > 0) {
            const lastWorkout = progression[progression.length - 1];
            // Get the sets from the last workout for this exercise
            const lastWorkoutExerciseData = lastWorkout.workout?.exercises?.[exerciseName];
            if (lastWorkoutExerciseData?.sets && lastWorkoutExerciseData.sets.length > 0) {
              // Find the set with the highest weight (best performance)
              // This ensures we show weight and reps from the same actual set
              const bestSet = lastWorkoutExerciseData.sets.reduce((best, current) => {
                const currentWeight = current.weight || 0;
                const bestWeight = best.weight || 0;
                return currentWeight > bestWeight ? current : best;
              }, lastWorkoutExerciseData.sets[0]);
              
              lastPerf[exerciseName] = {
                weight: bestSet.weight || 0,
                reps: bestSet.reps || 0
              };
            }
          }
        })
      );
      
      setInitialTargets(targets);
      setLastPerformance(lastPerf);
    };
    
    loadInitialData();

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [workoutPlan]);

  // Load initial target values for current exercise when step changes
  useEffect(() => {
    const step = workoutSequence[currentStepIndex];
    if (step?.exercise?.['Exercise Name']) {
      const exerciseName = step.exercise['Exercise Name'];
      const initialTarget = initialTargets[exerciseName];
      
      // Use updated weight if available, otherwise use initial target
      const targetWeight = updatedWeights[exerciseName] ?? initialTarget?.weight ?? null;
      // Use updated target reps if available, otherwise use initial target
      const currentTargetReps = updatedTargetReps[exerciseName] ?? initialTarget?.reps ?? DEFAULT_TARGET_REPS;
      
      // Set values from initialTarget if it exists, otherwise use null
      // This ensures we don't show stale values from a previous exercise
      setPrevWeight(targetWeight);
      setTargetReps(currentTargetReps);
      
      // Set controlled input values
      setCurrentWeight(targetWeight ?? '');
      setCurrentReps(currentTargetReps ?? '');
      
      // Reset suggestion when changing exercises
      setProgressiveOverloadSuggestion(null);
      setShowSuggestion(false);
    }
    
    // Scroll to top when exercise changes
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentStepIndex, initialTargets, workoutSequence, updatedWeights, updatedTargetReps]);

  const currentStep = workoutSequence[currentStepIndex];
  const exerciseName = currentStep?.exercise?.['Exercise Name'];
  const isBodyweight = currentStep?.exercise?.['Equipment']?.toLowerCase() === 'bodyweight';
  const isBarbell = currentStep?.exercise?.['Equipment']?.toLowerCase() === 'barbell';
  const webpFile = currentStep?.exercise?.['Webp File'];
  const primaryMuscle = currentStep?.exercise?.['Primary Muscle'];
  const secondaryMuscles = currentStep?.exercise?.['Secondary Muscles'];
  
  // Calculate barbell weight per side for barbell exercises
  const barbellPerSide = useMemo(() => {
    if (isBarbell && currentWeight && parseFloat(currentWeight) > 0) {
      return calculateBarbellPerSide(parseFloat(currentWeight), preferences.barbellWeight || 45);
    }
    return null;
  }, [isBarbell, currentWeight, preferences.barbellWeight]);

  // Calculate responsive font size for exercise name
  // Ensures text is large and readable but always fits within available space
  // Text scales down for long names while maintaining readability
  useEffect(() => {
    const calculateFontSize = () => {
      const nameElement = exerciseNameRef.current;
      if (!nameElement || !exerciseName) return;

      // Get the container dimensions
      const container = nameElement.parentElement;
      if (!container) return;
      
      const containerWidth = container.clientWidth;
      
      // The Box wrapper has px: { xs: 1.5, sm: 2/3 } which varies
      // Account for this padding to get the actual available width for text
      const paddingX = window.innerWidth < 600 ? 12 : 24;
      const availableWidth = containerWidth - (paddingX * 2);
      
      // Calculate available height based on viewport
      // Use smaller portion on mobile portrait for better layout
      const isPortrait = window.innerHeight > window.innerWidth;
      const maxHeight = isPortrait 
        ? window.innerHeight * 0.12 // 12% of viewport height in portrait
        : window.innerHeight * 0.18; // 18% in landscape
      
      if (availableWidth <= 0) return;
      
      // Allow smaller minimum font size on mobile for very long names
      // This prevents cropping by allowing text to scale down further
      const minFontSize = window.innerWidth < 600 ? 24 : window.innerWidth < 1024 ? 36 : 48;
      // Default/maximum font size - scale with viewport
      const defaultFontSize = window.innerWidth < 600 ? 56 : window.innerWidth < 1024 ? 80 : 110;
      
      // Use full exercise name for measurement
      const textToMeasure = exerciseName;
      
      // Target 95% of available width to ensure some margin
      const targetWidth = availableWidth * 0.95;
      
      // Create a temporary element to measure text dimensions with wrapping
      const tempElement = document.createElement('div');
      tempElement.style.visibility = 'hidden';
      tempElement.style.position = 'absolute';
      tempElement.style.fontFamily = getComputedStyle(nameElement).fontFamily;
      tempElement.style.fontWeight = '700';
      tempElement.style.lineHeight = '1.15';
      tempElement.style.width = targetWidth + 'px';
      tempElement.style.wordBreak = 'break-word';
      tempElement.style.overflowWrap = 'break-word';
      tempElement.style.whiteSpace = 'normal';
      tempElement.style.textAlign = 'center';
      tempElement.textContent = textToMeasure;
      document.body.appendChild(tempElement);
      
      // Binary search for the largest font size that fits both width and height
      let low = minFontSize;
      let high = defaultFontSize;
      let bestSize = minFontSize;
      
      while (low <= high) {
        const mid = Math.floor((low + high) / 2);
        tempElement.style.fontSize = mid + 'px';
        
        // Check both width and height constraints
        const textHeight = tempElement.scrollHeight;
        
        if (textHeight <= maxHeight) {
          // This size fits, try larger
          bestSize = mid;
          low = mid + 1;
        } else {
          // Too big, try smaller
          high = mid - 1;
        }
      }
      
      document.body.removeChild(tempElement);
      
      // Ensure we stay within min/max bounds
      const finalSize = Math.max(minFontSize, Math.min(bestSize, defaultFontSize));
      setExerciseFontSize(`${finalSize}px`);
    };

    // Calculate on mount and when exercise changes
    calculateFontSize();
    
    // Recalculate on window resize and orientation change
    const handleResize = () => calculateFontSize();
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    
    // Small delay to ensure DOM is ready
    const timeout = setTimeout(calculateFontSize, 100);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
      clearTimeout(timeout);
    };
  }, [exerciseName]);

  // Update demo image when exercise changes
  useEffect(() => {
    if (exerciseName) {
      // Use getDemoImagePath utility which supports webp files and custom muscle SVGs
      const imagePath = getDemoImagePath(
        exerciseName,
        true,
        webpFile,
        primaryMuscle,
        secondaryMuscles
      );
      
      setDemoImageSrc(imagePath);
      setImageError(false);
    }
  }, [exerciseName, webpFile, primaryMuscle, secondaryMuscles]);

  const handleImageError = () => {
    if (!imageError) {
      setImageError(true);
      // Fall back to custom muscle SVG if image fails to load
      const fallbackImage = getDemoImagePath(
        exerciseName,
        true,
        null,
        primaryMuscle,
        secondaryMuscles
      );
      setDemoImageSrc(fallbackImage);
    }
  };

  /**
   * Apply conditional persist rules after workout completion
   * 
   * Persist Rules:
   * 1. Only update Target Reps if ALL sets' reps > current Target Reps
   *    - Set to min(recorded reps)
   * 2. Only update Target Weight if weight is DIFFERENT AND ALL sets' reps >= current Target Reps
   *    - Use the latest weight entered (last set's weight)
   */
  const applyConditionalPersistRules = async (workoutDataArray) => {
    // Group sets by exercise
    const exerciseData = {};
    workoutDataArray.forEach(({ exerciseName: exName, setNumber, weight, reps }) => {
      if (!exerciseData[exName]) {
        exerciseData[exName] = [];
      }
      exerciseData[exName].push({ setNumber, weight, reps });
    });

    // Apply persist rules for each exercise
    for (const [exName, sets] of Object.entries(exerciseData)) {
      const initialTarget = initialTargets[exName] || { weight: null, reps: null };
      const currentTargetReps = initialTarget.reps ?? 0; // Treat null/empty as 0 for comparison
      const currentTargetWeight = initialTarget.weight;
      
      // Get all reps from sets (already validated as numbers in handleNext)
      const allReps = sets.map(s => s.reps).filter(r => typeof r === 'number' && !isNaN(r));
      
      // Skip if no valid reps data
      if (allReps.length === 0) continue;
      
      const minReps = Math.min(...allReps);
      
      // Check if all sets' reps >= current target reps
      const allSetsMetTarget = allReps.every(r => r >= currentTargetReps);
      
      // Check if all sets' reps > current target reps
      const allSetsExceededTarget = allReps.every(r => r > currentTargetReps);
      
      // Update Target Reps only if all sets exceeded target
      if (allSetsExceededTarget && minReps > 0) {
        await setExerciseTargetReps(exName, minReps);
      }
      
      // Update Target Weight only if weight is different AND all sets met target
      if (allSetsMetTarget) {
        const latestWeight = sets[sets.length - 1].weight;
        if (typeof latestWeight === 'number' && !isNaN(latestWeight) && latestWeight >= 0) {
          // Only update if weight has changed
          if (latestWeight !== currentTargetWeight) {
            await setExerciseWeight(exName, latestWeight);
          }
        }
      }
    }
  };

  // Stretch phase handlers
  const handleWarmupComplete = () => {
    setWarmupCompleted(true);
    setCurrentPhase('exercise');
  };

  const handleWarmupSkip = () => {
    setWarmupSkipped(true);
    setCurrentPhase('exercise');
  };

  const handleCooldownComplete = () => {
    setCooldownCompleted(true);
    setCurrentPhase('complete');
  };

  const handleCooldownSkip = () => {
    setCooldownSkipped(true);
    setCurrentPhase('complete');
  };

  const handleWorkoutComplete = () => {
    // Prevent multiple clicks
    if (isFinishing) return;
    
    // If modifications were made and this was a saved workout, show save dialog
    if (hasModifications && savedWorkoutId) {
      setSaveDialogOpen(true);
      return;
    }
    
    setIsFinishing(true);
    
    const totalTime = Math.floor((Date.now() - startTimeRef.current) / 1000);
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    const finalData = {
      date: new Date().toISOString(),
      type: workoutPlan[0]?.['Primary Muscle'] || 'unknown',
      duration: totalTime,
      exercises: {},
      warmupCompleted,
      warmupSkipped,
      cooldownCompleted,
      cooldownSkipped,
      totalDuration: totalTime,
      hasModifications,
      modifiedWorkoutPlan: hasModifications ? workoutPlan : undefined,
    };
    
    workoutData.forEach(step => {
      const { exerciseName: exName, setNumber, weight: w, reps: r } = step;
      if (!finalData.exercises[exName]) {
        finalData.exercises[exName] = { sets: [] };
      }
      finalData.exercises[exName].sets.push({ set: setNumber, weight: w, reps: r });
    });
    
    onComplete(finalData);
  };

  const handleNext = async (e) => {
    e.preventDefault();
    const form = e.target.closest('form') || document.querySelector('form');
    const weightInput = form?.querySelector('#weight-select');
    const repsInput = form?.querySelector('#reps-select');
    
    if (!weightInput || !repsInput) {
      console.error('Form inputs not found');
      return;
    }
    
    // Parse and validate weight (should be non-negative)
    const weight = Math.max(0, parseFloat(weightInput.value) || 0);
    
    // Parse and validate reps (should be positive integer)
    const parsedReps = parseInt(repsInput.value, 10);
    const reps = (parsedReps > 0) ? parsedReps : 0;
    
    const exerciseName = currentStep.exercise['Exercise Name'];

    // Check if weight was changed from the initial/propagated target
    const expectedWeight = updatedWeights[exerciseName] ?? initialTargets[exerciseName]?.weight;
    if (weight !== expectedWeight && expectedWeight !== null && expectedWeight !== undefined) {
      // Weight was changed - track this exercise and update weight for future sets
      setExercisesWithChangedWeight(prev => new Set(prev).add(exerciseName));
      setUpdatedWeights(prev => ({ ...prev, [exerciseName]: weight }));
    }

    const newData = {
      exerciseName,
      setNumber: currentStep.setNumber,
      weight,
      reps,
    };

    const updatedWorkoutData = [...workoutData, newData];
    setWorkoutData(updatedWorkoutData);
    
    // Calculate and show progressive overload suggestion only if weight wasn't changed
    if (targetReps && reps > 0 && !exercisesWithChangedWeight.has(exerciseName)) {
      const suggestion = calculateProgressiveOverload(weight, reps, targetReps);
      if (suggestion) {
        setProgressiveOverloadSuggestion(suggestion);
        setShowSuggestion(true);
        // Auto-hide suggestion after 5 seconds
        setTimeout(() => setShowSuggestion(false), 5000);
      }
    }
    
    if (currentStepIndex + 1 >= workoutSequence.length) {
      // Exercises complete - check if cooldown is enabled, otherwise complete
      await applyConditionalPersistRules(updatedWorkoutData);
      
      const prefs = localStorage.getItem('goodlift_stretch_prefs');
      const preferences = prefs ? JSON.parse(prefs) : { showCooldown: true };
      
      if (preferences.showCooldown) {
        setCurrentPhase('cooldown');
      } else {
        setCooldownSkipped(true);
        setCurrentPhase('complete');
      }
    } else {
      // Check if we just completed a set round and should trigger rest timer
      if (onSetComplete && setRoundEndIndices.has(currentStepIndex)) {
        onSetComplete();
      }
      setCurrentStepIndex(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1);
      setWorkoutData(prev => prev.slice(0, -1));
    }
  };

  const handleExit = () => {
    if (window.confirm('Are you sure you want to exit? Your progress will not be saved.')) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      onExit();
    }
  };

  // Dialog-based handlers for end workout (used when workoutData.length > 0)
  const handleEndWorkoutClick = () => {
    if (workoutData.length > 0) {
      // Show dialog with options when there's data to potentially save
      setEndWorkoutDialogOpen(true);
    } else {
      // On first exercise, just exit directly (no data to save)
      handleExit();
    }
  };

  const handleDialogPartialComplete = async () => {
    setEndWorkoutDialogOpen(false);
    // Apply conditional persist rules for partial workout
    await applyConditionalPersistRules(workoutData);
    
    const totalTime = Math.floor((Date.now() - startTimeRef.current) / 1000);
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    const finalData = {
      date: new Date().toISOString(),
      type: workoutPlan[0]?.['Primary Muscle'] || 'unknown',
      duration: totalTime,
      exercises: {},
      isPartial: true,
    };
    
    workoutData.forEach(step => {
      const { exerciseName: exName, setNumber, weight: w, reps: r } = step;
      if (!finalData.exercises[exName]) {
        finalData.exercises[exName] = { sets: [] };
      }
      finalData.exercises[exName].sets.push({ set: setNumber, weight: w, reps: r });
    });
    
    onComplete(finalData);
  };

  const handleDialogExit = () => {
    setEndWorkoutDialogOpen(false);
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    onExit();
  };

  const handleSaveToFavorites = () => {
    try {
      const workoutType = detectWorkoutType(workoutPlan[0]);
      
      saveFavoriteWorkout({
        name: `${workoutType.charAt(0).toUpperCase() + workoutType.slice(1)} Body Workout`,
        type: workoutType,
        equipment: 'all',
        exercises: workoutPlan,
      });
      
      setIsFavorite(true);
      setSnackbarOpen(true);
    } catch (error) {
      console.error('Error saving to favorites:', error);
      alert('Failed to save workout to favorites');
    }
  };

  // Helper functions for +/- buttons
  const adjustWeight = (delta) => {
    const current = parseFloat(currentWeight) || 0;
    let newWeight;
    
    if (delta > 0) {
      // Increasing weight - use dynamic increment
      newWeight = getNextWeight(current);
    } else {
      // Decreasing weight - use dynamic decrement
      newWeight = getPreviousWeight(current);
    }
    
    setCurrentWeight(newWeight.toString());
  };

  const adjustReps = (delta) => {
    const current = parseInt(currentReps, 10) || 0;
    const newReps = Math.max(0, current + delta);
    setCurrentReps(newReps.toString());
  };

  const applySuggestion = () => {
    if (progressiveOverloadSuggestion?.suggestedWeight) {
      setCurrentWeight(progressiveOverloadSuggestion.suggestedWeight.toString());
      setShowSuggestion(false);
    }
  };

  const skipExercise = () => {
    if (window.confirm('Skip all remaining sets of this exercise?')) {
      // Find next exercise in sequence
      let nextIndex = currentStepIndex + 1;
      const currentExerciseName = currentStep.exercise['Exercise Name'];
      
      while (nextIndex < workoutSequence.length && 
             workoutSequence[nextIndex].exercise['Exercise Name'] === currentExerciseName) {
        nextIndex++;
      }
      
      if (nextIndex >= workoutSequence.length) {
        // No more exercises
        setCurrentPhase('cooldown');
      } else {
        setCurrentStepIndex(nextIndex);
      }
    }
  };

  // Handle exercise swap
  const handleSwapExercise = (newExercise) => {
    const currentExerciseName = currentStep.exercise['Exercise Name'];
    
    // Update workout plan with the new exercise
    const updatedPlan = workoutPlan.map(ex => 
      ex['Exercise Name'] === currentExerciseName ? { ...newExercise, sets: ex.sets } : ex
    );
    setWorkoutPlan(updatedPlan);
    setHasModifications(true);
    
    // Show confirmation
    setSnackbarMessage(`Swapped to ${newExercise['Exercise Name']}`);
    setSnackbarOpen(true);
  };

  // Handle adding extra sets at end of workout
  const handleAddExtraSets = () => {
    setAddSetsDialogOpen(true);
  };

  const confirmAddExtraSets = () => {
    // Update each exercise to have one more set
    const updatedPlan = workoutPlan.map(ex => ({
      ...ex,
      sets: (ex.sets || setsPerSuperset) + 1
    }));
    setWorkoutPlan(updatedPlan);
    setHasModifications(true);
    setAddSetsDialogOpen(false);
    
    setSnackbarMessage('Added extra set to each exercise');
    setSnackbarOpen(true);
  };

  // Handle opening target reps dialog
  const handleOpenTargetRepsDialog = () => {
    setPendingTargetReps(targetReps || DEFAULT_TARGET_REPS);
    setTargetRepsDialogOpen(true);
  };

  // Handle mid-workout target reps change
  const handleTargetRepsChange = async (newReps) => {
    if (!exerciseName) return;
    
    const currentExerciseTargetReps = targetReps || DEFAULT_TARGET_REPS;
    const currentExerciseWeight = parseFloat(currentWeight) || prevWeight || 0;
    
    // Calculate new weight based on rep change
    let newWeight = currentExerciseWeight;
    if (currentExerciseWeight > 0 && currentExerciseTargetReps !== newReps) {
      const adjustedWeight = calculateWeightForRepChange(currentExerciseWeight, currentExerciseTargetReps, newReps);
      if (adjustedWeight !== null) {
        newWeight = adjustedWeight;
        // Update the current weight input
        setCurrentWeight(adjustedWeight.toString());
      }
    }
    
    // Update state
    setTargetReps(newReps);
    setUpdatedTargetReps(prev => ({ ...prev, [exerciseName]: newReps }));
    if (newWeight !== currentExerciseWeight) {
      setPrevWeight(newWeight);
      setUpdatedWeights(prev => ({ ...prev, [exerciseName]: newWeight }));
    }
    setHasModifications(true);
    
    // Save to storage (like changing an exercise mid-workout)
    await setExerciseTargetReps(exerciseName, newReps);
    if (newWeight !== currentExerciseWeight) {
      await setExerciseWeight(exerciseName, newWeight);
    }
    
    // Show confirmation
    const direction = newReps < currentExerciseTargetReps ? 'increased' : 'decreased';
    setSnackbarMessage(newWeight !== currentExerciseWeight 
      ? `Target: ${newReps} reps, weight ${direction} to ${newWeight} lbs`
      : `Target updated to ${newReps} reps`);
    setSnackbarOpen(true);
    setTargetRepsDialogOpen(false);
  };

  // Helper to derive equipment from workout plan
  const deriveEquipmentFromPlan = (plan) => {
    const equipmentSet = new Set(plan.map(ex => ex['Equipment']).filter(Boolean));
    if (equipmentSet.size === 0) return 'all';
    if (equipmentSet.size === 1) return [...equipmentSet][0].toLowerCase();
    return 'mixed';
  };

  // Handle save dialog actions
  const handleOverrideSavedWorkout = async () => {
    try {
      // Override the existing saved workout with modified exercises
      await saveFavoriteWorkout({
        id: savedWorkoutId,
        name: savedWorkoutName || 'Modified Workout',
        type: detectWorkoutType(workoutPlan[0]),
        equipment: deriveEquipmentFromPlan(workoutPlan),
        exercises: workoutPlan,
      });
      setSaveDialogOpen(false);
      setSnackbarMessage('Workout updated!');
      setSnackbarOpen(true);
    } catch (error) {
      console.error('Error saving workout:', error);
    }
  };

  const handleSaveAsNewWorkout = async (newName) => {
    try {
      await saveFavoriteWorkout({
        name: newName,
        type: detectWorkoutType(workoutPlan[0]),
        equipment: deriveEquipmentFromPlan(workoutPlan),
        exercises: workoutPlan,
      });
      setSaveDialogOpen(false);
      setSnackbarMessage('Saved as new workout!');
      setSnackbarOpen(true);
    } catch (error) {
      console.error('Error saving workout:', error);
    }
  };

  if (!currentStep && currentPhase === 'exercise') {
    return null;
  }

  // Render warmup phase
  if (currentPhase === 'warmup') {
    // Get user preferences for default duration
    const prefs = localStorage.getItem('goodlift_stretch_prefs');
    const preferences = prefs ? JSON.parse(prefs) : { defaultWarmupDuration: 5 };
    
    return (
      <div className="screen" style={{ paddingBottom: '100px', padding: '0.5rem', maxWidth: '100vw', boxSizing: 'border-box' }}>
        <Box sx={{ mb: 1.5, px: { xs: 0.5, sm: 0 } }}>
          <Typography variant="h6" sx={{ fontWeight: 600, textAlign: 'center', mb: 1 }}>
            Warm-Up Phase
          </Typography>
        </Box>
        <StretchReminder
          type="warmup"
          workoutType={workoutType}
          defaultDuration={preferences.defaultWarmupDuration || 5}
          onComplete={handleWarmupComplete}
          onSkip={handleWarmupSkip}
        />
      </div>
    );
  }

  // Render cooldown phase
  if (currentPhase === 'cooldown') {
    // Get user preferences for default duration
    const prefs = localStorage.getItem('goodlift_stretch_prefs');
    const preferences = prefs ? JSON.parse(prefs) : { defaultCooldownDuration: 5 };
    
    return (
      <div className="screen" style={{ paddingBottom: '100px', padding: '0.5rem', maxWidth: '100vw', boxSizing: 'border-box' }}>
        <Box sx={{ mb: 1.5, px: { xs: 0.5, sm: 0 } }}>
          <Typography variant="h6" sx={{ fontWeight: 600, textAlign: 'center', mb: 1 }}>
            Cool-Down Phase
          </Typography>
        </Box>
        <StretchReminder
          type="cooldown"
          workoutType={workoutType}
          defaultDuration={preferences.defaultCooldownDuration || 5}
          onComplete={handleCooldownComplete}
          onSkip={handleCooldownSkip}
        />
      </div>
    );
  }

  // Render completion screen
  if (currentPhase === 'complete') {
    const baseUrl = import.meta.env.BASE_URL || '/';
    
    return (
      <div className="screen" style={{ 
        paddingBottom: '100px', 
        padding: '2rem', 
        maxWidth: '100vw', 
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh'
      }}>
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          style={{ textAlign: 'center' }}
        >
          {/* Celebration dog image - spins when finishing */}
          <Box
            component="img"
            src={`${baseUrl}goodlift-dog-celebration.svg`}
            alt="Celebration"
            sx={{ 
              width: { xs: 100, sm: 120 },
              height: { xs: 100, sm: 120 },
              mb: 2,
              animation: isFinishing ? `${spin} 1.5s linear infinite` : 'none',
            }}
          />
          <Typography variant="h4" sx={{ fontWeight: 600, mb: 2 }}>
            Workout Complete!
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            Great job! You've completed your workout{!warmupSkipped && !cooldownSkipped ? ' including warmup and cooldown phases' : !warmupSkipped ? ' including warmup phase' : !cooldownSkipped ? ' including cooldown phase' : ''}.
          </Typography>
          <Button
            variant="contained"
            size="large"
            onClick={handleWorkoutComplete}
            disabled={isFinishing}
            sx={{ 
              mt: 2,
              '&.Mui-disabled': {
                bgcolor: 'primary.main',
                color: 'white',
                opacity: 0.7,
              }
            }}
          >
            {isFinishing ? 'Finishing...' : 'Finish Workout'}
          </Button>
        </motion.div>
      </div>
    );
  }

  // Render exercise phase (existing workout screen)
  return (
    <div className="screen"
      style={{
        padding: '0.5rem',
        maxWidth: '100vw',
        boxSizing: 'border-box',
      }}
    >
      <Box sx={{ mb: 1.5, px: { xs: 0.5, sm: 0 } }}>
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          mb: 0.5,
          gap: 1
        }}>
          <Typography variant="body1" sx={{ fontWeight: 600, fontSize: { xs: '0.9rem', sm: '1.25rem' } }}>
            {formatTime(elapsedTime)}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.5, sm: 1 } }}>
            <Typography variant="body1" sx={{ fontWeight: 600, fontSize: { xs: '0.9rem', sm: '1.25rem' } }}>
              {currentStepIndex + 1}/{workoutSequence.length}
            </Typography>
            <IconButton 
              onClick={handleSaveToFavorites}
              disabled={isFavorite}
              size="small"
              sx={{ 
                color: isFavorite ? 'warning.main' : 'action.active',
                '&:hover': { color: 'warning.main' },
                p: { xs: 0.5, sm: 1 }
              }}
              aria-label="Save to favorites"
            >
              {isFavorite ? <Star sx={{ fontSize: { xs: 20, sm: 24 } }} /> : <StarBorder sx={{ fontSize: { xs: 20, sm: 24 } }} />}
            </IconButton>
          </Box>
        </Box>
        <LinearProgress 
          variant="determinate" 
          value={(currentStepIndex / workoutSequence.length) * 100}
          sx={{ 
            height: { xs: 6, sm: 8 },
            borderRadius: 4,
            bgcolor: 'rgba(138, 190, 185, 0.2)',
            '& .MuiLinearProgress-bar': {
              bgcolor: 'primary.main',
              borderRadius: 4,
            }
          }}
        />
      </Box>
      
      <div className="exercise-card-container">
        <AnimatePresence mode="wait">
          <motion.form
            key={currentStepIndex}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3 }}
            onSubmit={handleNext}
          >
            <motion.div
              className="exercise-card"
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.3 }}
              style={{
                display: 'flex',
                flexDirection: shouldUseTwoColumns ? 'row' : 'column',
                gap: shouldUseTwoColumns ? '0.5rem' : undefined,
              }}
            >
              {/* Main content area - flex column in portrait, flex row in landscape */}
              <Box sx={{ 
                flex: 1, 
                display: 'flex', 
                flexDirection: 'column',
                minWidth: 0, // Prevent flex item from overflowing
              }}>
                {/* Top Controls - Help, Skip, Swap and Set Indicator on left, End Workout Controls on right */}
                {/* In landscape tablet, these move to right column - so hide here */}
                {!shouldUseTwoColumns && (
                  <Box sx={{ 
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: 1,
                    mb: 2
                  }}>
                    {/* Left: Help, Skip, Swap Icons and Set Indicator */}
                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                      <IconButton
                        component="a"
                        href={`https://www.google.com/search?q=${encodeURIComponent(exerciseName + ' form')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        sx={{
                          minWidth: { xs: '36px', sm: '44px' },
                          minHeight: { xs: '36px', sm: '44px' },
                          color: 'primary.main',
                          border: '2px solid',
                          borderColor: 'primary.main',
                          borderRadius: '8px',
                          '&:hover': {
                            backgroundColor: 'rgba(19, 70, 134, 0.08)',
                          }
                        }}
                        aria-label={`Search for ${exerciseName} form guide`}
                      >
                        <HelpOutline sx={{ fontSize: { xs: 20, sm: 24 } }} />
                      </IconButton>
                      <IconButton
                        onClick={skipExercise}
                        sx={{
                          minWidth: { xs: '36px', sm: '44px' },
                          minHeight: { xs: '36px', sm: '44px' },
                          color: 'primary.main',
                          border: '2px solid',
                          borderColor: 'primary.main',
                          borderRadius: '8px',
                          '&:hover': {
                            backgroundColor: 'rgba(19, 70, 134, 0.08)',
                          }
                        }}
                        aria-label="Skip exercise"
                      >
                        <SkipNext sx={{ fontSize: { xs: 20, sm: 24 } }} />
                      </IconButton>
                      <IconButton
                        onClick={() => setSwapDialogOpen(true)}
                        sx={{
                          minWidth: { xs: '36px', sm: '44px' },
                          minHeight: { xs: '36px', sm: '44px' },
                          color: 'primary.main',
                          border: '2px solid',
                          borderColor: 'primary.main',
                          borderRadius: '8px',
                          '&:hover': {
                            backgroundColor: 'rgba(19, 70, 134, 0.08)',
                          }
                        }}
                        aria-label="Swap exercise"
                      >
                        <SwapHoriz sx={{ fontSize: { xs: 20, sm: 24 } }} />
                      </IconButton>
                      
                      {/* Set indicator */}
                      <Chip 
                        label={`Set ${currentStep.setNumber} of ${currentStep.totalSets}`}
                        color="primary"
                        size="medium"
                        sx={{ 
                          fontWeight: 600,
                          fontSize: { xs: '0.75rem', sm: '0.875rem' },
                        }}
                      />
                    </Box>
                    
                    {/* End Workout Controls - Right side */}
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      {/* Add extra sets button */}
                      <IconButton
                        onClick={handleAddExtraSets}
                        sx={{
                          minWidth: { xs: '36px', sm: '44px' },
                          minHeight: { xs: '36px', sm: '44px' },
                          color: 'info.main',
                          border: '2px solid',
                          borderColor: 'info.main',
                          borderRadius: '8px',
                          '&:hover': {
                            backgroundColor: 'rgba(25, 118, 210, 0.08)',
                          }
                        }}
                        aria-label="Add extra sets"
                      >
                        <PlaylistAdd sx={{ fontSize: { xs: 20, sm: 24 } }} />
                      </IconButton>
                      <IconButton
                        onClick={handleEndWorkoutClick}
                        sx={{
                          minWidth: { xs: '36px', sm: '44px' },
                          minHeight: { xs: '36px', sm: '44px' },
                          color: 'rgb(237, 63, 39)',
                          border: '2px solid rgb(237, 63, 39)',
                          borderRadius: '8px',
                          '&:hover': {
                            backgroundColor: 'rgba(237, 63, 39, 0.08)',
                          },
                        }}
                        aria-label="End workout"
                      >
                        <ExitToApp sx={{ fontSize: { xs: 20, sm: 24 } }} />
                      </IconButton>
                    </Box>
                  </Box>
                )}

                {/* Tablet landscape: No set indicator here - it's in the right column */}

              {/* Exercise Name and Demo Image - Two Column Layout in Landscape, Single Column in Portrait */}
              <Box sx={{ 
                mt: shouldUseTwoColumns ? 1 : 0.5,
                mb: shouldUseTwoColumns ? 1 : 0.5,
                px: { xs: 1.5, sm: shouldUseTwoColumns ? 2 : 3 },
                // Use CSS Grid for landscape mode for reliable split
                display: shouldUseTwoColumns ? 'grid' : 'flex',
                // CSS Grid template: 1.5fr for name, 1fr for image (3:2 ratio) - gives more room to image
                gridTemplateColumns: shouldUseTwoColumns ? '1.5fr 1fr' : 'none',
                gridTemplateRows: shouldUseTwoColumns ? '1fr' : 'none',
                flexDirection: shouldUseTwoColumns ? undefined : 'column',
                alignItems: 'center',
                gap: shouldUseTwoColumns ? 2 : 0.2,
                // Larger min-height in landscape tablet to accommodate bigger images
                minHeight: shouldUseTwoColumns 
                  ? { sm: 'calc(35vh - 80px)', md: 'calc(40vh - 80px)' } 
                  : { xs: '60px', sm: '80px' },
                flex: shouldUseTwoColumns ? 1 : 'none',
              }}>
                {/* Exercise Name */}
                <Box sx={{ 
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: shouldUseTwoColumns ? 'flex-start' : 'center',
                  width: '100%',
                  // Remove max-height constraint to prevent vertical cropping
                  // Let the text flow naturally within its container
                  flexShrink: 0,
                }}>
                  <Typography 
                    ref={exerciseNameRef}
                    variant="h3" 
                    component="h2"
                    sx={{ 
                      fontWeight: 700,
                      fontSize: shouldUseTwoColumns 
                        ? { sm: '2.5rem !important', md: '3.5rem !important' }
                        : exerciseFontSize + ' !important',
                      color: 'primary.main',
                      textAlign: shouldUseTwoColumns ? 'left' : 'center',
                      lineHeight: '1.15 !important', // Slightly increased for better readability
                      width: '100%',
                      wordBreak: 'break-word',
                      overflowWrap: 'break-word',
                      whiteSpace: 'normal',
                      // Allow up to 3 lines without ellipsis, full text visible
                      display: '-webkit-box',
                      WebkitLineClamp: shouldUseTwoColumns ? 2 : 3,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {exerciseName}
                  </Typography>
                </Box>
                
                {/* Demo Image - Shows if available */}
                {demoImageSrc && (
                  <Box 
                    sx={{ 
                      display: 'flex',
                      justifyContent: shouldUseTwoColumns ? 'center' : 'center',
                      alignItems: 'center',
                      width: '100%',
                      height: shouldUseTwoColumns ? '100%' : 'auto',
                      // In landscape tablet, allow more vertical space for the image
                      minHeight: shouldUseTwoColumns ? { sm: '150px', md: '200px' } : 0,
                      flex: shouldUseTwoColumns ? 1 : 'none',
                    }}
                  >
                    {isSvgDataUrl(demoImageSrc) ? (
                      // Render SVG data URL as inline SVG using dangerouslySetInnerHTML
                      (() => {
                        const svgContent = extractSvgFromDataUrl(demoImageSrc);
                        return svgContent ? (
                          <Box
                            sx={{
                              maxWidth: '100%',
                              maxHeight: shouldUseTwoColumns 
                                ? { sm: 'calc(40vh - 100px)', md: 'calc(45vh - 100px)' }
                                : { xs: '150px', sm: '200px' },
                              width: 'auto',
                              height: 'auto',
                              borderRadius: 1,
                              '& svg': {
                                maxWidth: '100%',
                                maxHeight: shouldUseTwoColumns 
                                  ? 'calc(40vh - 100px)'
                                  : '200px',
                                width: 'auto',
                                height: 'auto',
                              },
                            }}
                            dangerouslySetInnerHTML={{ __html: svgContent }}
                          />
                        ) : (
                          // Fallback if SVG extraction fails
                          <Box
                            component="img"
                            src={workIconUrl}
                            alt="Exercise"
                            sx={{ 
                              width: '60%', 
                              height: '60%', 
                              objectFit: 'contain', 
                              opacity: 0.5 
                            }}
                          />
                        );
                      })()
                    ) : (
                      // Render regular image
                      <Box
                        component="img"
                        src={demoImageSrc}
                        alt={`${exerciseName} demonstration`}
                        onError={handleImageError}
                        sx={{
                          maxWidth: '100%',
                          // Significantly larger image in landscape tablet mode
                          maxHeight: shouldUseTwoColumns 
                            ? { sm: 'calc(40vh - 100px)', md: 'calc(45vh - 100px)' }
                            : { xs: '150px', sm: '200px' },
                          width: 'auto',
                          height: 'auto',
                          borderRadius: 1,
                          objectFit: 'contain',
                        }}
                        loading="lazy"
                      />
                    )}
                  </Box>
                )}
              </Box>
              
              {/* Muscle Highlight SVG - ALWAYS show for exercises with muscle data */}
              {primaryMuscle && primaryMuscle.trim() && (
                <Box 
                  sx={{ 
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    width: '100%',
                    mt: 1,
                    mb: 1,
                    px: { xs: 2, sm: 3 },
                  }}
                >
                  {(() => {
                    // Generate muscle highlight SVG with validated muscle data
                    const muscleSvgDataUrl = getMuscleHighlightDataUrl(primaryMuscle, secondaryMuscles || '');
                    // Extract and validate SVG content (security: prevents XSS via structure validation)
                    const svgContent = extractSvgFromDataUrl(muscleSvgDataUrl);
                    
                    return svgContent ? (
                      <Box
                        sx={{
                          maxWidth: shouldUseTwoColumns ? '200px' : '180px',
                          maxHeight: shouldUseTwoColumns ? '200px' : '180px',
                          width: '100%',
                          height: 'auto',
                          borderRadius: 1,
                          border: '1px solid',
                          borderColor: 'divider',
                          bgcolor: 'background.paper',
                          p: 1,
                          '& svg': {
                            width: '100%',
                            height: 'auto',
                          },
                        }}
                        // Safe to use dangerouslySetInnerHTML here because:
                        // 1. SVG content is generated internally (not user input)
                        // 2. extractSvgFromDataUrl validates SVG structure
                        // 3. Only renders SVGs with expected viewBox and CSS classes
                        dangerouslySetInnerHTML={{ __html: svgContent }}
                      />
                    ) : null;
                  })()}
                </Box>
              )}
              
              {/* Portrait/Mobile: Separate rows for target info, inputs, and nav buttons */}
              {!shouldUseTwoColumns && (
                <>
                  {/* Display Target and Last Performance */}
                  {(prevWeight !== null || targetReps !== null || lastPerformance[exerciseName]) && (
                    <Box sx={{ mb: 2, mt: 1, px: 2 }}>
                      {(prevWeight !== null || targetReps !== null) && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.2 }}
                        >
                          <Box 
                            sx={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              justifyContent: 'center',
                              gap: 0.5,
                            }}
                          >
                            <Typography
                              variant="body2"
                              sx={{ 
                                textAlign: 'center',
                                color: 'text.secondary',
                                fontWeight: 500
                              }}
                            >
                              Target: {prevWeight ?? '–'} lbs • {targetReps ?? '–'} reps
                            </Typography>
                            <IconButton
                              size="small"
                              onClick={handleOpenTargetRepsDialog}
                              sx={{
                                color: 'primary.main',
                                p: 0.25,
                              }}
                              aria-label="Change target reps"
                            >
                              <Settings sx={{ fontSize: 16 }} />
                            </IconButton>
                          </Box>
                        </motion.div>
                      )}
                      
                      {lastPerformance[exerciseName] && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.3 }}
                        >
                          <Typography
                            variant="body2"
                            sx={{ 
                              textAlign: 'center',
                              color: 'primary.main',
                              fontWeight: 600,
                              mt: 0.25
                            }}
                          >
                            Last: {lastPerformance[exerciseName].weight} lbs • {lastPerformance[exerciseName].reps} reps
                          </Typography>
                        </motion.div>
                      )}
                    </Box>
                  )}
                  
                  {/* Progressive Overload Suggestion */}
                  <AnimatePresence>
                    {showSuggestion && progressiveOverloadSuggestion && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                      >
                        <Alert 
                          severity={progressiveOverloadSuggestion.type === 'excellent' ? 'success' : 'info'}
                          icon={<TrendingUp />}
                          action={
                            progressiveOverloadSuggestion.suggestedWeight !== parseFloat(currentWeight) && (
                              <Button 
                                color="inherit" 
                                size="small" 
                                onClick={applySuggestion}
                                sx={{ minHeight: '44px' }}
                              >
                                Apply
                              </Button>
                            )
                          }
                          sx={{ mb: 2, minHeight: '44px' }}
                        >
                          {progressiveOverloadSuggestion.message}
                        </Alert>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  
                  <div className="input-row">
                    <div className="input-group">
                      <label htmlFor="weight-select">Weight (lbs){isBodyweight && ' (N/A)'}</label>
                      <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
                        <IconButton 
                          onClick={() => adjustWeight(-2.5)}
                          disabled={isBodyweight}
                          size="small"
                          sx={{ 
                            bgcolor: isBodyweight ? 'action.disabledBackground' : 'action.hover',
                            minWidth: '32px',
                            minHeight: '32px',
                            width: '32px',
                            height: '32px',
                            p: 0.5,
                            '&:hover': { bgcolor: isBodyweight ? 'action.disabledBackground' : 'action.selected' }
                          }}
                        >
                          <Remove sx={{ fontSize: 16 }} />
                        </IconButton>
                        <input
                          id="weight-select"
                          type="tel"
                          inputMode="decimal"
                          pattern="[0-9]*([.,][0-9]+)?"
                          step="2.5"
                          min="0"
                          max="500"
                          className="exercise-input"
                          value={currentWeight}
                          onChange={(e) => setCurrentWeight(e.target.value)}
                          placeholder="–"
                          disabled={isBodyweight}
                          aria-label="Weight in pounds"
                          onFocus={(e) => {
                            e.target.select();
                            const rect = e.target.getBoundingClientRect();
                            const inputBottom = rect.bottom;
                            const viewportHeight = window.innerHeight;
                            const threshold = viewportHeight * 0.55;
                            
                            if (inputBottom > threshold) {
                              setTimeout(() => {
                                e.target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                setTimeout(() => {
                                  window.scrollBy({ top: -80, behavior: 'smooth' });
                                }, 100);
                              }, 300);
                            }
                          }}
                          style={{
                            width: '100%',
                            minWidth: '50px',
                            maxWidth: '70px',
                            padding: '8px 4px',
                            minHeight: '36px',
                            borderRadius: '8px',
                            border: '2px solid var(--color-border)',
                            fontSize: '1rem',
                            fontFamily: 'var(--font-body)',
                            backgroundColor: isBodyweight ? 'var(--color-disabled)' : 'var(--color-surface)',
                            color: isBodyweight ? 'var(--color-text-disabled)' : 'var(--color-text)',
                            cursor: isBodyweight ? 'not-allowed' : 'text',
                            opacity: isBodyweight ? 0.6 : 1,
                            textAlign: 'center',
                          }}
                        />
                        <IconButton 
                          onClick={() => adjustWeight(2.5)}
                          disabled={isBodyweight}
                          size="small"
                          sx={{ 
                            bgcolor: isBodyweight ? 'action.disabledBackground' : 'action.hover',
                            minWidth: '32px',
                            minHeight: '32px',
                            width: '32px',
                            height: '32px',
                            p: 0.5,
                            '&:hover': { bgcolor: isBodyweight ? 'action.disabledBackground' : 'action.selected' }
                          }}
                        >
                          <Add sx={{ fontSize: 16 }} />
                        </IconButton>
                      </Box>
                      {/* Display per-side weight for barbell exercises */}
                      {isBarbell && barbellPerSide !== null && barbellPerSide >= 0 && (
                        <Typography 
                          variant="caption" 
                          sx={{ 
                            color: 'text.secondary',
                            fontStyle: 'italic',
                            fontSize: '0.75rem',
                            mt: 0.5,
                            display: 'block',
                            textAlign: 'center'
                          }}
                        >
                          {barbellPerSide} lbs per side
                        </Typography>
                      )}
                    </div>
                    <div className="input-group">
                      <label htmlFor="reps-select">Reps</label>
                      <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
                        <IconButton 
                          onClick={() => adjustReps(-1)}
                          size="small"
                          sx={{ 
                            bgcolor: 'action.hover',
                            minWidth: '32px',
                            minHeight: '32px',
                            width: '32px',
                            height: '32px',
                            p: 0.5,
                            '&:hover': { bgcolor: 'action.selected' }
                          }}
                        >
                          <Remove sx={{ fontSize: 16 }} />
                        </IconButton>
                        <input
                          id="reps-select"
                          type="number"
                          inputMode="numeric"
                          step="1"
                          min="1"
                          max="20"
                          className="exercise-input"
                          value={currentReps}
                          onChange={(e) => setCurrentReps(e.target.value)}
                          placeholder="–"
                          aria-label="Repetitions"
                          onFocus={(e) => {
                            e.target.select();
                            const rect = e.target.getBoundingClientRect();
                            const inputBottom = rect.bottom;
                            const viewportHeight = window.innerHeight;
                            const threshold = viewportHeight * 0.55;
                            
                            if (inputBottom > threshold) {
                              setTimeout(() => {
                                e.target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                setTimeout(() => {
                                  window.scrollBy({ top: -80, behavior: 'smooth' });
                                }, 100);
                              }, 300);
                            }
                          }}
                          style={{
                            width: '100%',
                            minWidth: '40px',
                            maxWidth: '50px',
                            padding: '8px 4px',
                            minHeight: '36px',
                            borderRadius: '8px',
                            border: '2px solid var(--color-border)',
                            fontSize: '1rem',
                            fontFamily: 'var(--font-body)',
                            backgroundColor: 'var(--color-surface)',
                            color: 'var(--color-text)',
                            textAlign: 'center',
                          }}
                        />
                        <IconButton 
                          onClick={() => adjustReps(1)}
                          size="small"
                          sx={{ 
                            bgcolor: 'action.hover',
                            minWidth: '32px',
                            minHeight: '32px',
                            width: '32px',
                            height: '32px',
                            p: 0.5,
                            '&:hover': { bgcolor: 'action.selected' }
                          }}
                        >
                          <Add sx={{ fontSize: 16 }} />
                        </IconButton>
                      </Box>
                    </div>
                  </div>
                  
                  <div className="workout-nav-buttons">
                    {currentStepIndex > 0 && (
                      <button
                        type="button"
                        className="back-btn"
                        onClick={handleBack}
                        style={{ minHeight: '44px' }}
                      >
                        <ArrowBack sx={{ fontSize: 18, mr: 0.5 }} /> Back
                      </button>
                    )}
                    <button
                      type="submit"
                      className="next-btn"
                      style={{ minHeight: '44px' }}
                    >
                      Next <ArrowForward sx={{ fontSize: 18, ml: 0.5 }} />
                    </button>
                  </div>
                </>
              )}
              
              {/* Tablet Landscape: Enhanced layout with larger inputs and better spacing */}
              {shouldUseTwoColumns && (
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 2, 
                  flexWrap: 'wrap',
                  justifyContent: 'space-between',
                  px: 2,
                  py: 1.5,
                  mt: 1,
                  bgcolor: 'background.paper',
                  borderRadius: 2,
                  border: '1px solid',
                  borderColor: 'divider',
                }}>
                  {/* Target/Last info - more visible */}
                  <Box sx={{ display: 'flex', flexDirection: 'column', minWidth: 'fit-content', gap: 0.5 }}>
                    {(prevWeight !== null || targetReps !== null) && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 600, fontSize: '0.85rem' }}>
                          Target: {prevWeight ?? '–'} × {targetReps ?? '–'}
                        </Typography>
                        <IconButton
                          size="small"
                          onClick={handleOpenTargetRepsDialog}
                          sx={{ color: 'primary.main', p: 0.25, minWidth: 24, minHeight: 24 }}
                          aria-label="Change target reps"
                        >
                          <Settings sx={{ fontSize: 16 }} />
                        </IconButton>
                      </Box>
                    )}
                    {lastPerformance[exerciseName] && (
                      <Typography variant="body2" sx={{ color: 'primary.main', fontWeight: 600, fontSize: '0.85rem' }}>
                        Last: {lastPerformance[exerciseName].weight} × {lastPerformance[exerciseName].reps}
                      </Typography>
                    )}
                  </Box>
                  
                  {/* Weight Input - larger and more accessible */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                    <Typography variant="body2" sx={{ fontSize: '0.9rem', color: 'text.secondary', fontWeight: 600, minWidth: '50px' }}>Weight:</Typography>
                    <IconButton 
                      onClick={() => adjustWeight(-2.5)}
                      disabled={isBodyweight}
                      size="medium"
                      sx={{ 
                        bgcolor: isBodyweight ? 'action.disabledBackground' : 'action.hover',
                        minWidth: '40px', minHeight: '40px', width: '40px', height: '40px',
                        '&:hover': { bgcolor: isBodyweight ? 'action.disabledBackground' : 'action.selected' }
                      }}
                    >
                      <Remove sx={{ fontSize: 20 }} />
                    </IconButton>
                    <input
                      type="tel"
                      inputMode="decimal"
                      value={currentWeight}
                      onChange={(e) => setCurrentWeight(e.target.value)}
                      placeholder="–"
                      disabled={isBodyweight}
                      aria-label="Weight"
                      style={{
                        width: '70px', 
                        padding: '10px 8px', 
                        minHeight: '40px', 
                        borderRadius: '8px',
                        border: '2px solid var(--color-border)', 
                        fontSize: '1.1rem', 
                        fontWeight: 600,
                        textAlign: 'center',
                        backgroundColor: isBodyweight ? 'var(--color-disabled)' : 'var(--color-surface)',
                        color: isBodyweight ? 'var(--color-text-disabled)' : 'var(--color-text)',
                      }}
                    />
                    <IconButton 
                      onClick={() => adjustWeight(2.5)}
                      disabled={isBodyweight}
                      size="medium"
                      sx={{ 
                        bgcolor: isBodyweight ? 'action.disabledBackground' : 'action.hover',
                        minWidth: '40px', minHeight: '40px', width: '40px', height: '40px',
                        '&:hover': { bgcolor: isBodyweight ? 'action.disabledBackground' : 'action.selected' }
                      }}
                    >
                      <Add sx={{ fontSize: 20 }} />
                    </IconButton>
                    {/* Display per-side weight for barbell exercises */}
                    {isBarbell && barbellPerSide !== null && barbellPerSide >= 0 && (
                      <Typography 
                        variant="caption" 
                        sx={{ 
                          color: 'text.secondary',
                          fontStyle: 'italic',
                          fontSize: '0.75rem',
                          ml: 1
                        }}
                      >
                        ({barbellPerSide} lbs per side)
                      </Typography>
                    )}
                  </Box>
                  
                  {/* Reps Input - larger and more accessible */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                    <Typography variant="body2" sx={{ fontSize: '0.9rem', color: 'text.secondary', fontWeight: 600, minWidth: '40px' }}>Reps:</Typography>
                    <IconButton 
                      onClick={() => adjustReps(-1)}
                      size="medium"
                      sx={{ 
                        bgcolor: 'action.hover',
                        minWidth: '40px', minHeight: '40px', width: '40px', height: '40px',
                        '&:hover': { bgcolor: 'action.selected' }
                      }}
                    >
                      <Remove sx={{ fontSize: 20 }} />
                    </IconButton>
                    <input
                      type="number"
                      inputMode="numeric"
                      value={currentReps}
                      onChange={(e) => setCurrentReps(e.target.value)}
                      placeholder="–"
                      aria-label="Reps"
                      style={{
                        width: '60px', 
                        padding: '10px 8px', 
                        minHeight: '40px', 
                        borderRadius: '8px',
                        border: '2px solid var(--color-border)', 
                        fontSize: '1.1rem', 
                        fontWeight: 600,
                        textAlign: 'center',
                        backgroundColor: 'var(--color-surface)', 
                        color: 'var(--color-text)',
                      }}
                    />
                    <IconButton 
                      onClick={() => adjustReps(1)}
                      size="medium"
                      sx={{ 
                        bgcolor: 'action.hover',
                        minWidth: '40px', minHeight: '40px', width: '40px', height: '40px',
                        '&:hover': { bgcolor: 'action.selected' }
                      }}
                    >
                      <Add sx={{ fontSize: 20 }} />
                    </IconButton>
                  </Box>
                  
                  {/* Nav Buttons - more prominent */}
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    {currentStepIndex > 0 && (
                      <Button
                        type="button"
                        variant="outlined"
                        size="medium"
                        onClick={handleBack}
                        sx={{ minHeight: '44px', fontSize: '0.95rem', px: 2, fontWeight: 600 }}
                      >
                        <ArrowBack sx={{ fontSize: 18, mr: 0.5 }} /> Back
                      </Button>
                    )}
                    <Button
                      type="submit"
                      variant="contained"
                      size="medium"
                      sx={{ minHeight: '44px', fontSize: '0.95rem', px: 3, fontWeight: 600 }}
                    >
                      Next <ArrowForward sx={{ fontSize: 18, ml: 0.5 }} />
                    </Button>
                  </Box>
                </Box>
              )}
              </Box>
              
              {/* Right Column: Action Buttons and Set Indicator - Only visible in tablet landscape */}
              {shouldUseTwoColumns && (
                <Box sx={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: 0.5,
                  pl: 1,
                  borderLeft: '1px solid',
                  borderColor: 'divider',
                  alignItems: 'center',
                }}>
                  {/* Set Indicator at top of right column */}
                  <Chip 
                    label={`${currentStep.setNumber}/${currentStep.totalSets}`}
                    color="primary"
                    size="small"
                    sx={{ fontWeight: 600, fontSize: '0.65rem', mb: 0.5 }}
                  />
                  <IconButton
                    component="a"
                    href={`https://www.google.com/search?q=${encodeURIComponent(exerciseName + ' form')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={{
                      minWidth: '36px',
                      minHeight: '36px',
                      color: 'primary.main',
                      border: '2px solid',
                      borderColor: 'primary.main',
                      borderRadius: '6px',
                      '&:hover': { backgroundColor: 'rgba(19, 70, 134, 0.08)' }
                    }}
                    aria-label={`Search for ${exerciseName} form guide`}
                  >
                    <HelpOutline sx={{ fontSize: 18 }} />
                  </IconButton>
                  <IconButton
                    onClick={skipExercise}
                    sx={{
                      minWidth: '36px',
                      minHeight: '36px',
                      color: 'primary.main',
                      border: '2px solid',
                      borderColor: 'primary.main',
                      borderRadius: '6px',
                      '&:hover': { backgroundColor: 'rgba(19, 70, 134, 0.08)' }
                    }}
                    aria-label="Skip exercise"
                  >
                    <SkipNext sx={{ fontSize: 18 }} />
                  </IconButton>
                  <IconButton
                    onClick={() => setSwapDialogOpen(true)}
                    sx={{
                      minWidth: '36px',
                      minHeight: '36px',
                      color: 'primary.main',
                      border: '2px solid',
                      borderColor: 'primary.main',
                      borderRadius: '6px',
                      '&:hover': { backgroundColor: 'rgba(19, 70, 134, 0.08)' }
                    }}
                    aria-label="Swap exercise"
                  >
                    <SwapHoriz sx={{ fontSize: 18 }} />
                  </IconButton>
                  <IconButton
                    onClick={handleAddExtraSets}
                    sx={{
                      minWidth: '36px',
                      minHeight: '36px',
                      color: 'info.main',
                      border: '2px solid',
                      borderColor: 'info.main',
                      borderRadius: '6px',
                      '&:hover': { backgroundColor: 'rgba(25, 118, 210, 0.08)' }
                    }}
                    aria-label="Add extra sets"
                  >
                    <PlaylistAdd sx={{ fontSize: 18 }} />
                  </IconButton>
                  <Box sx={{ flexGrow: 1 }} />
                  <IconButton
                    onClick={handleEndWorkoutClick}
                    sx={{
                      minWidth: '36px',
                      minHeight: '36px',
                      color: 'rgb(237, 63, 39)',
                      border: '2px solid rgb(237, 63, 39)',
                      borderRadius: '6px',
                      '&:hover': { backgroundColor: 'rgba(237, 63, 39, 0.08)' },
                    }}
                    aria-label="End workout"
                  >
                    <ExitToApp sx={{ fontSize: 18 }} />
                  </IconButton>
                </Box>
              )}
            </motion.div>
          </motion.form>
        </AnimatePresence>
      </div>
      
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="success" onClose={() => setSnackbarOpen(false)}>
          {snackbarMessage || 'Workout saved to favorites!'}
        </Alert>
      </Snackbar>
      
      {/* Swap Exercise Dialog */}
      <SwapExerciseDialog
        open={swapDialogOpen}
        onClose={() => setSwapDialogOpen(false)}
        currentExercise={currentStep?.exercise}
        onSwap={handleSwapExercise}
      />
      
      {/* Save Modified Workout Dialog */}
      <SaveModifiedWorkoutDialog
        open={saveDialogOpen}
        onClose={() => setSaveDialogOpen(false)}
        onOverride={handleOverrideSavedWorkout}
        onSaveAsNew={handleSaveAsNewWorkout}
        originalWorkoutName={savedWorkoutName}
        hasExistingWorkout={!!savedWorkoutId}
      />

      {/* Add Extra Sets Confirmation Dialog */}
      <Dialog open={addSetsDialogOpen} onClose={() => setAddSetsDialogOpen(false)}>
        <DialogTitle>Add Extra Sets</DialogTitle>
        <DialogContent>
          <Typography>
            Add an extra set for each exercise? This will extend the workout.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddSetsDialogOpen(false)}>Cancel</Button>
          <Button onClick={confirmAddExtraSets} variant="contained" color="primary">
            Add Sets
          </Button>
        </DialogActions>
      </Dialog>

      {/* Change Target Reps Dialog */}
      <Dialog open={targetRepsDialogOpen} onClose={() => setTargetRepsDialogOpen(false)}>
        <DialogTitle>Change Target Reps</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, pt: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Changing target reps will adjust the weight automatically.
            </Typography>
            <TargetRepsPicker
              value={pendingTargetReps || DEFAULT_TARGET_REPS}
              onChange={(newReps) => setPendingTargetReps(newReps)}
              showLabel
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTargetRepsDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={() => handleTargetRepsChange(pendingTargetReps)} 
            variant="contained" 
            color="primary"
          >
            Apply
          </Button>
        </DialogActions>
      </Dialog>

      {/* End Workout Confirmation Dialog */}
      <Dialog 
        open={endWorkoutDialogOpen} 
        onClose={() => setEndWorkoutDialogOpen(false)}
        aria-labelledby="end-workout-dialog-title"
      >
        <DialogTitle id="end-workout-dialog-title">End Workout</DialogTitle>
        <DialogContent>
          <Typography>
            How would you like to end this workout?
          </Typography>
        </DialogContent>
        <DialogActions sx={{ flexDirection: 'column', gap: 1, pb: 2, px: 2 }}>
          <Button 
            fullWidth
            variant="contained" 
            color="primary"
            onClick={handleDialogPartialComplete}
            sx={{ minHeight: '44px' }}
          >
            End and Save as Partial
          </Button>
          <Button 
            fullWidth
            variant="outlined" 
            color="error"
            onClick={handleDialogExit}
            sx={{ minHeight: '44px' }}
          >
            End Without Saving
          </Button>
          <Button 
            fullWidth
            variant="text"
            onClick={() => setEndWorkoutDialogOpen(false)}
            sx={{ minHeight: '44px' }}
          >
            Cancel
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

WorkoutScreen.propTypes = {
  workoutPlan: PropTypes.array.isRequired,
  onComplete: PropTypes.func.isRequired,
  onExit: PropTypes.func.isRequired,
  supersetConfig: PropTypes.arrayOf(PropTypes.number),
  setsPerSuperset: PropTypes.number,
  savedWorkoutId: PropTypes.string,
  savedWorkoutName: PropTypes.string,
  onSetComplete: PropTypes.func,
  onProgressUpdate: PropTypes.func,
  initialProgress: PropTypes.shape({
    currentStepIndex: PropTypes.number,
    workoutData: PropTypes.array,
    elapsedTime: PropTypes.number,
    currentPhase: PropTypes.string,
  }),
};

export default WorkoutScreen;
