import { useState, useEffect, useRef, useMemo } from 'react';
import PropTypes from 'prop-types';
import { motion, AnimatePresence } from 'framer-motion';
import { detectWorkoutType } from '../utils/helpers';
import { getExerciseWeight, getExerciseTargetReps, setExerciseWeight, setExerciseTargetReps, saveFavoriteWorkout } from '../utils/storage';
import { Box, LinearProgress, Typography, Snackbar, Alert, Button } from '@mui/material';
import { Celebration } from '@mui/icons-material';
import StretchReminder from './StretchReminder';
import { calculateProgressiveOverload } from '../utils/progressiveOverload';
import ExerciseCard from './Workout/ExerciseCard';

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
  // Track exercises where weight was changed during workout (to disable progressive overload)
  const [exercisesWithChangedWeight, setExercisesWithChangedWeight] = useState(new Set());
  // Track the updated weight for each exercise (for propagation to subsequent sets)
  const [updatedWeights, setUpdatedWeights] = useState({});
  const startTimeRef = useRef(null);
  const timerRef = useRef(null);
  
  // Stretching phase state
  const [currentPhase, setCurrentPhase] = useState('warmup'); // 'warmup', 'exercise', 'cooldown', 'complete'
  const [warmupCompleted, setWarmupCompleted] = useState(false);
  const [warmupSkipped, setWarmupSkipped] = useState(false);
  const [cooldownCompleted, setCooldownCompleted] = useState(false);
  const [cooldownSkipped, setCooldownSkipped] = useState(false);
  const [workoutType, setWorkoutType] = useState('full');

  // Generate workout sequence (supersets) - memoized to prevent recalculation
  // Now supports custom superset configurations like [2, 3, 2, 3]
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
      
      // Add all sets for this superset
      for (let set = 1; set <= setsPerSuperset; set++) {
        for (const exercise of supersetExercises) {
          sequence.push({ exercise, setNumber: set });
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

    // Load initial target values for all exercises at workout start
    const loadInitialTargets = async () => {
      const targets = {};
      const uniqueExercises = [...new Set(workoutPlan.map(ex => ex['Exercise Name']))];
      
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
        })
      );
      
      setInitialTargets(targets);
    };
    
    loadInitialTargets();

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
    }
    
    // Scroll to top when exercise changes
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentStepIndex, initialTargets, workoutSequence, updatedWeights]);

  const currentStep = workoutSequence[currentStepIndex];
  const exerciseName = currentStep?.exercise?.['Exercise Name'];

  // Calculate progressive overload suggestion for current exercise
  const progressiveOverloadSuggestion = useMemo(() => {
    if (!exerciseName || !targetReps || !prevWeight) return null;
    if (exercisesWithChangedWeight.has(exerciseName)) return null;
    
    return calculateProgressiveOverload(prevWeight, targetReps, targetReps);
  }, [exerciseName, targetReps, prevWeight, exercisesWithChangedWeight]);

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

  const handleNext = async (data) => {
    // Parse and validate weight (should be non-negative)
    const weight = Math.max(0, parseFloat(data.weight) || 0);
    
    // Parse and validate reps (should be positive integer)
    const parsedReps = parseInt(data.reps, 10);
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

  const swapExercise = () => {
    alert('Exercise swap feature coming soon! For now, you can skip this exercise and manually add a different one later.');
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
          <motion.div
            key={currentStepIndex}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3 }}
          >
            <ExerciseCard
              exerciseName={exerciseName}
              setNumber={currentStep.setNumber}
              totalSets={setsPerSuperset}
              lastWeight={prevWeight}
              lastReps={targetReps}
              suggestedWeight={progressiveOverloadSuggestion?.suggestedWeight}
              suggestedReps={progressiveOverloadSuggestion?.suggestedReps}
              showSuggestions={!exercisesWithChangedWeight.has(exerciseName)}
              onSubmit={handleNext}
              onBack={currentStepIndex > 0 ? handleBack : null}
              showBack={currentStepIndex > 0}
              elapsedTime={elapsedTime}
              currentStep={currentStepIndex + 1}
              totalSteps={workoutSequence.length}
              isFavorite={isFavorite}
              onToggleFavorite={handleSaveToFavorites}
              onSkip={skipExercise}
              onSwap={swapExercise}
              onPartialComplete={workoutData.length > 0 ? handlePartialComplete : null}
              onExit={handleExit}
              showPartialComplete={workoutData.length > 0}
            />
          </motion.div>
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
