import { useState, useEffect, useRef, useMemo } from 'react';
import PropTypes from 'prop-types';
import { motion, AnimatePresence } from 'framer-motion';
import { formatTime, detectWorkoutType } from '../utils/helpers';
import { getExerciseWeight, getExerciseTargetReps, setExerciseWeight, setExerciseTargetReps, saveFavoriteWorkout, getWorkoutHistory } from '../utils/storage';
import { Box, LinearProgress, Typography, IconButton, Snackbar, Alert, Button, Chip } from '@mui/material';
import { ArrowBack, ArrowForward, ExitToApp, Star, StarBorder, Celebration, Add, Remove, SkipNext, TrendingUp, HelpOutline, Save } from '@mui/icons-material';
import StretchReminder from './StretchReminder';
import { calculateProgressiveOverload } from '../utils/progressiveOverload';
import { getDemoImagePath } from '../utils/exerciseDemoImages';
import progressiveOverloadService from '../services/ProgressiveOverloadService';

/**
 * WorkoutScreen component manages the active workout session
 * Displays exercises in superset format, tracks time, and collects set data
 */
const WorkoutScreen = ({ workoutPlan, onComplete, onExit, supersetConfig = [2, 2, 2, 2], setsPerSuperset = 3 }) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [workoutData, setWorkoutData] = useState([]);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [prevWeight, setPrevWeight] = useState(null);
  const [targetReps, setTargetReps] = useState(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
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
  const startTimeRef = useRef(null);
  const timerRef = useRef(null);
  const exerciseNameRef = useRef(null);
  const [exerciseFontSize, setExerciseFontSize] = useState('48px'); // Default responsive size for mobile
  
  // Demo image state
  const [demoImageSrc, setDemoImageSrc] = useState(null);
  const [imageError, setImageError] = useState(false);
  
  // Stretching phase state
  const [currentPhase, setCurrentPhase] = useState('warmup'); // 'warmup', 'exercise', 'cooldown', 'complete'
  const [warmupCompleted, setWarmupCompleted] = useState(false);
  const [warmupSkipped, setWarmupSkipped] = useState(false);
  const [cooldownCompleted, setCooldownCompleted] = useState(false);
  const [cooldownSkipped, setCooldownSkipped] = useState(false);
  const [workoutType, setWorkoutType] = useState('full');

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
            reps: reps ?? null
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
      
      // Set values from initialTarget if it exists, otherwise use null
      // This ensures we don't show stale values from a previous exercise
      setPrevWeight(targetWeight);
      setTargetReps(initialTarget?.reps ?? null);
      
      // Set controlled input values
      setCurrentWeight(targetWeight ?? '');
      setCurrentReps(initialTarget?.reps ?? '');
      
      // Reset suggestion when changing exercises
      setProgressiveOverloadSuggestion(null);
      setShowSuggestion(false);
    }
    
    // Scroll to top when exercise changes
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentStepIndex, initialTargets, workoutSequence, updatedWeights]);

  const currentStep = workoutSequence[currentStepIndex];
  const exerciseName = currentStep?.exercise?.['Exercise Name'];
  const isBodyweight = currentStep?.exercise?.['Equipment']?.toLowerCase() === 'bodyweight';
  const webpFile = currentStep?.exercise?.['Webp File'];

  // Calculate responsive font size for exercise name
  // Ensures text is large and readable but always fits within available space
  useEffect(() => {
    const calculateFontSize = () => {
      const nameElement = exerciseNameRef.current;
      if (!nameElement || !exerciseName) return;

      // Get the container dimensions
      const container = nameElement.parentElement;
      if (!container) return;
      
      const containerWidth = container.clientWidth;
      const containerHeight = container.clientHeight;
      
      // The Box wrapper has px: { xs: 2, sm: 4 } which is 16px or 32px per side
      // Account for this padding to get the actual available width for text
      const paddingX = window.innerWidth < 600 ? 16 : 32;
      const availableWidth = containerWidth - (paddingX * 2);
      
      // Limit height to reasonable portion of viewport to prevent overflow
      // Use a maximum of 25vh to match the new container maxHeight
      const maxHeight = Math.min(containerHeight * 0.8, window.innerHeight * 0.25);
      
      if (availableWidth <= 0) return;
      
      // Responsive minimum font size based on viewport width
      // Mobile: 48px, Tablet: 60px, Desktop: 72px
      const minFontSize = window.innerWidth < 600 ? 48 : window.innerWidth < 1024 ? 60 : 72;
      // Maximum font size - scale with viewport
      const maxFontSize = window.innerWidth < 600 ? 110 : window.innerWidth < 1024 ? 140 : 180;
      
      // Use full exercise name for measurement (no split logic)
      const textToMeasure = exerciseName;
      
      // Target 90% of available width to ensure some margin
      const targetWidth = availableWidth * 0.9;
      
      // Create a temporary element to measure text dimensions with wrapping
      const tempElement = document.createElement('div');
      tempElement.style.visibility = 'hidden';
      tempElement.style.position = 'absolute';
      tempElement.style.fontFamily = getComputedStyle(nameElement).fontFamily;
      tempElement.style.fontWeight = '600';
      tempElement.style.lineHeight = '1.2';
      tempElement.style.width = targetWidth + 'px';
      tempElement.style.wordBreak = 'break-word';
      tempElement.style.overflowWrap = 'break-word';
      tempElement.style.whiteSpace = 'normal';
      tempElement.style.textAlign = 'center';
      tempElement.textContent = textToMeasure;
      document.body.appendChild(tempElement);
      
      // Binary search for the largest font size that fits both width and height
      let low = minFontSize;
      let high = maxFontSize;
      let bestSize = minFontSize;
      
      while (low <= high) {
        const mid = Math.floor((low + high) / 2);
        tempElement.style.fontSize = mid + 'px';
        
        // Check both width and height constraints
        const textWidth = tempElement.scrollWidth;
        const textHeight = tempElement.scrollHeight;
        
        if (textWidth <= targetWidth && textHeight <= maxHeight) {
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
      const finalSize = Math.max(minFontSize, Math.min(bestSize, maxFontSize));
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
      // Use 'Webp File' property from exercise data if available, otherwise fallback to getDemoImagePath
      let imagePath;
      
      if (webpFile) {
        // Directly use the Webp File property from exercises.json
        const baseUrl = import.meta.env.BASE_URL || '/';
        imagePath = `${baseUrl}demos/${webpFile}`;
      } else {
        // Fallback to the old method for exercises without Webp File property
        imagePath = getDemoImagePath(exerciseName);
      }
      
      setDemoImageSrc(imagePath);
      setImageError(false);
    }
  }, [exerciseName, webpFile]);

  const handleImageError = () => {
    if (!imageError) {
      setImageError(true);
      // Fall back to placeholder if image fails to load
      const baseUrl = import.meta.env.BASE_URL || '/';
      setDemoImageSrc(`${baseUrl}work-icon.svg`);
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
      setCurrentStepIndex(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1);
      setWorkoutData(prev => prev.slice(0, -1));
    }
  };

  const handlePartialComplete = async () => {
    if (window.confirm('Save this workout as partially complete? Your current progress will be saved.')) {
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
    const newWeight = Math.max(0, current + delta);
    // Round to 1 decimal place to handle 2.5lb increments cleanly
    setCurrentWeight(newWeight.toFixed(1));
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
          <Celebration sx={{ fontSize: 80, color: 'primary.main', mb: 2 }} />
          <Typography variant="h4" sx={{ fontWeight: 600, mb: 2 }}>
            Workout Complete! 🎉
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            Great job! You've completed your workout{!warmupSkipped && !cooldownSkipped ? ' including warmup and cooldown phases' : !warmupSkipped ? ' including warmup phase' : !cooldownSkipped ? ' including cooldown phase' : ''}.
          </Typography>
          <Button
            variant="contained"
            size="large"
            onClick={handleWorkoutComplete}
            sx={{ mt: 2 }}
          >
            Finish Workout
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
                flexDirection: 'column',
              }}
            >
              {/* Top Controls - Help, Skip, and Set Indicator on left, End Workout Controls on right */}
              <Box sx={{ 
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: 1,
                mb: 2
              }}>
                {/* Left: Help, Skip Icons and Set Indicator */}
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
                  {workoutData.length > 0 && (
                    <IconButton
                      onClick={handlePartialComplete}
                      sx={{
                        minWidth: { xs: '36px', sm: '44px' },
                        minHeight: { xs: '36px', sm: '44px' },
                        color: 'rgb(254, 178, 26)',
                        border: '2px solid rgb(254, 178, 26)',
                        borderRadius: '8px',
                        '&:hover': {
                          backgroundColor: 'rgba(254, 178, 26, 0.08)',
                        },
                      }}
                      aria-label="End and save workout"
                    >
                      <Save sx={{ fontSize: { xs: 20, sm: 24 } }} />
                    </IconButton>
                  )}
                  <IconButton
                    onClick={handleExit}
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
                    aria-label="End workout without saving"
                  >
                    <ExitToApp sx={{ fontSize: { xs: 20, sm: 24 } }} />
                  </IconButton>
                </Box>
              </Box>

              {/* Exercise name - responsive text that wraps and scales to fit */}
              <Box sx={{ 
                mb: 1.5,
                mt: 2,
                px: { xs: 2, sm: 4 },
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: { xs: '80px', sm: '100px' },
                maxHeight: { xs: '25vh', sm: '25vh' },
                overflow: 'hidden'
              }}>
                <Typography 
                  ref={exerciseNameRef}
                  variant="h3" 
                  component="h2"
                  sx={{ 
                    fontWeight: 600,
                    fontSize: exerciseFontSize + ' !important',
                    color: 'primary.main',
                    textAlign: 'center',
                    lineHeight: '1.2 !important',
                    width: '100%',
                    wordBreak: 'break-word',
                    overflowWrap: 'break-word',
                    whiteSpace: 'normal',
                    display: '-webkit-box',
                    WebkitLineClamp: 4,
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
                    mb: 1.5,
                    mt: 0,
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                >
                  <Box
                    component="img"
                    src={demoImageSrc}
                    alt={`${exerciseName} demonstration`}
                    onError={handleImageError}
                    sx={{
                      maxWidth: '100%',
                      maxHeight: { xs: '200px', sm: '280px' },
                      width: 'auto',
                      height: 'auto',
                      borderRadius: 2,
                      objectFit: 'contain',
                      // Semi-transparent white background for visibility of dark line drawings
                      backgroundColor: 'rgba(255, 255, 255, 0.15)',
                      padding: 2,
                      // Add subtle border for better definition
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                    }}
                    loading="lazy"
                  />
                </Box>
              )}
              
              {/* Display Target and Last Performance */}
              {(prevWeight !== null || targetReps !== null || lastPerformance[exerciseName]) && (
                <Box sx={{ mb: 2, mt: 1, px: 2 }}>
                  {(prevWeight !== null || targetReps !== null) && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
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
                          mt: 0.5
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
                  <Box sx={{ display: 'flex', gap: { xs: 0.5, sm: 1 }, alignItems: 'center' }}>
                    <IconButton 
                      onClick={() => adjustWeight(-2.5)}
                      disabled={isBodyweight}
                      size="small"
                      sx={{ 
                        bgcolor: isBodyweight ? 'action.disabledBackground' : 'action.hover',
                        minWidth: { xs: '36px', sm: '40px' },
                        minHeight: { xs: '36px', sm: '40px' },
                        p: { xs: 0.5, sm: 1 },
                        '&:hover': { bgcolor: isBodyweight ? 'action.disabledBackground' : 'action.selected' }
                      }}
                    >
                      <Remove sx={{ fontSize: { xs: 18, sm: 20 } }} />
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
                        minWidth: '80px',
                        padding: '12px',
                        minHeight: '44px',
                        borderRadius: '8px',
                        border: '2px solid var(--color-border)',
                        fontSize: '1.1rem',
                        fontFamily: 'var(--font-body)',
                        backgroundColor: isBodyweight ? 'var(--color-disabled)' : 'var(--color-surface)',
                        color: isBodyweight ? 'var(--color-text-disabled)' : 'var(--color-text)',
                        cursor: isBodyweight ? 'not-allowed' : 'text',
                        opacity: isBodyweight ? 0.6 : 1,
                      }}
                    />
                    <IconButton 
                      onClick={() => adjustWeight(2.5)}
                      disabled={isBodyweight}
                      size="small"
                      sx={{ 
                        bgcolor: isBodyweight ? 'action.disabledBackground' : 'action.hover',
                        minWidth: { xs: '36px', sm: '40px' },
                        minHeight: { xs: '36px', sm: '40px' },
                        p: { xs: 0.5, sm: 1 },
                        '&:hover': { bgcolor: isBodyweight ? 'action.disabledBackground' : 'action.selected' }
                      }}
                    >
                      <Add sx={{ fontSize: { xs: 18, sm: 20 } }} />
                    </IconButton>
                  </Box>
                </div>
                <div className="input-group">
                  <label htmlFor="reps-select">Reps</label>
                  <Box sx={{ display: 'flex', gap: { xs: 0.5, sm: 1 }, alignItems: 'center' }}>
                    <IconButton 
                      onClick={() => adjustReps(-1)}
                      size="small"
                      sx={{ 
                        bgcolor: 'action.hover',
                        minWidth: { xs: '36px', sm: '40px' },
                        minHeight: { xs: '36px', sm: '40px' },
                        p: { xs: 0.5, sm: 1 },
                        '&:hover': { bgcolor: 'action.selected' }
                      }}
                    >
                      <Remove sx={{ fontSize: { xs: 18, sm: 20 } }} />
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
                        minWidth: '80px',
                        padding: '12px',
                        minHeight: '44px',
                        borderRadius: '8px',
                        border: '2px solid var(--color-border)',
                        fontSize: '1.1rem',
                        fontFamily: 'var(--font-body)',
                        backgroundColor: 'var(--color-surface)',
                        color: 'var(--color-text)',
                      }}
                    />
                    <IconButton 
                      onClick={() => adjustReps(1)}
                      size="small"
                      sx={{ 
                        bgcolor: 'action.hover',
                        minWidth: { xs: '36px', sm: '40px' },
                        minHeight: { xs: '36px', sm: '40px' },
                        p: { xs: 0.5, sm: 1 },
                        '&:hover': { bgcolor: 'action.selected' }
                      }}
                    >
                      <Add sx={{ fontSize: { xs: 18, sm: 20 } }} />
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
          Workout saved to favorites!
        </Alert>
      </Snackbar>
    </div>
  );
};

WorkoutScreen.propTypes = {
  workoutPlan: PropTypes.array.isRequired,
  onComplete: PropTypes.func.isRequired,
  onExit: PropTypes.func.isRequired,
  supersetConfig: PropTypes.arrayOf(PropTypes.number),
  setsPerSuperset: PropTypes.number,
};

export default WorkoutScreen;
