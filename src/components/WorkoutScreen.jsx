import { useState, useEffect, useRef, useMemo } from 'react';
import PropTypes from 'prop-types';
import { motion, AnimatePresence } from 'framer-motion';
import { formatTime, getYoutubeEmbedUrl, detectWorkoutType } from '../utils/helpers';
import { getExerciseWeight, getExerciseTargetReps, setExerciseWeight, setExerciseTargetReps, saveFavoriteWorkout } from '../utils/storage';
import { SETS_PER_EXERCISE } from '../utils/constants';
import { Box, LinearProgress, Typography, IconButton, Snackbar, Alert, Button, Chip } from '@mui/material';
import { ArrowBack, ArrowForward, ExitToApp, Star, StarBorder, Celebration, Add, Remove, SwapHoriz, SkipNext, TrendingUp } from '@mui/icons-material';
import StretchReminder from './StretchReminder';
import { calculateProgressiveOverload } from '../utils/progressiveOverload';

/**
 * WorkoutScreen component manages the active workout session
 * Displays exercises in superset format, tracks time, and collects set data
 */
const WorkoutScreen = ({ workoutPlan, onComplete, onExit }) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [workoutData, setWorkoutData] = useState([]);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [prevWeight, setPrevWeight] = useState(null);
  const [targetReps, setTargetReps] = useState(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  // Store initial target values for each exercise at workout start
  const [initialTargets, setInitialTargets] = useState({});
  // Progressive overload suggestion state
  const [progressiveOverloadSuggestion, setProgressiveOverloadSuggestion] = useState(null);
  const [showSuggestion, setShowSuggestion] = useState(false);
  // Current set weight and reps (controlled inputs)
  const [currentWeight, setCurrentWeight] = useState('');
  const [currentReps, setCurrentReps] = useState('');
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
  const workoutSequence = useMemo(() => {
    const sequence = [];
    const maxPairs = 4; // 4 supersets of 2 exercises each = 8 exercises total
    
    for (let i = 0; i < maxPairs; i++) {
      const ex1 = workoutPlan[i * 2];
      const ex2 = workoutPlan[i * 2 + 1];
      
      // Skip if either exercise is missing
      if (!ex1 || !ex2) continue;
      
      // Add all sets for this superset pair
      for (let set = 1; set <= SETS_PER_EXERCISE; set++) {
        sequence.push({ exercise: ex1, setNumber: set });
        sequence.push({ exercise: ex2, setNumber: set });
      }
    }
    
    return sequence;
  }, [workoutPlan]);

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
      // Set values from initialTarget if it exists, otherwise use null
      // This ensures we don't show stale values from a previous exercise
      setPrevWeight(initialTarget?.weight ?? null);
      setTargetReps(initialTarget?.reps ?? null);
      
      // Set controlled input values
      setCurrentWeight(initialTarget?.weight ?? '');
      setCurrentReps(initialTarget?.reps ?? '');
      
      // Reset suggestion when changing exercises
      setProgressiveOverloadSuggestion(null);
      setShowSuggestion(false);
    }
    
    // Scroll to top when exercise changes
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentStepIndex, initialTargets, workoutSequence]);

  const currentStep = workoutSequence[currentStepIndex];
  const exerciseName = currentStep?.exercise?.['Exercise Name'];

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

    const newData = {
      exerciseName: currentStep.exercise['Exercise Name'],
      setNumber: currentStep.setNumber,
      weight,
      reps,
    };

    const updatedWorkoutData = [...workoutData, newData];
    setWorkoutData(updatedWorkoutData);
    
    // Calculate and show progressive overload suggestion
    if (targetReps && reps > 0) {
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
        paddingBottom: '100px',
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
            <Typography variant="body1" sx={{ fontWeight: 600, fontSize: { xs: '0.9rem', sm: '1.25rem' } }}>
              {currentStepIndex + 1}/{workoutSequence.length}
            </Typography>
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
            >
              <h2>{exerciseName}</h2>
              <div className="youtube-embed">
                <iframe
                  src={getYoutubeEmbedUrl(currentStep.exercise['YouTube_Demonstration_Link'])}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                ></iframe>
              </div>
              
              {/* Set X of Y indicator with enhanced styling */}
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                gap: 1,
                my: 2 
              }}>
                <Chip 
                  label={`Set ${currentStep.setNumber} of ${SETS_PER_EXERCISE}`}
                  color="primary"
                  sx={{ fontWeight: 600, fontSize: '1rem', minHeight: '44px', px: 2 }}
                />
              </Box>
              
              {(prevWeight !== null || targetReps !== null) && (
                <motion.p
                  className="prev-weight"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  Target: {prevWeight ?? '–'} lbs • {targetReps ?? '–'} reps
                </motion.p>
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
                  <label htmlFor="weight-select">Weight (lbs)</label>
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                    <IconButton 
                      onClick={() => adjustWeight(-2.5)}
                      size="large"
                      sx={{ 
                        bgcolor: 'action.hover',
                        minWidth: '44px',
                        minHeight: '44px',
                        '&:hover': { bgcolor: 'action.selected' }
                      }}
                    >
                      <Remove />
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
                      onClick={() => adjustWeight(2.5)}
                      size="large"
                      sx={{ 
                        bgcolor: 'action.hover',
                        minWidth: '44px',
                        minHeight: '44px',
                        '&:hover': { bgcolor: 'action.selected' }
                      }}
                    >
                      <Add />
                    </IconButton>
                  </Box>
                </div>
                <div className="input-group">
                  <label htmlFor="reps-select">Reps</label>
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                    <IconButton 
                      onClick={() => adjustReps(-1)}
                      size="large"
                      sx={{ 
                        bgcolor: 'action.hover',
                        minWidth: '44px',
                        minHeight: '44px',
                        '&:hover': { bgcolor: 'action.selected' }
                      }}
                    >
                      <Remove />
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
                      size="large"
                      sx={{ 
                        bgcolor: 'action.hover',
                        minWidth: '44px',
                        minHeight: '44px',
                        '&:hover': { bgcolor: 'action.selected' }
                      }}
                    >
                      <Add />
                    </IconButton>
                  </Box>
                </div>
              </div>
              
              {/* Quick Actions */}
              <Box sx={{ display: 'flex', gap: 1, mt: 2, mb: 2 }}>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<SkipNext />}
                  onClick={skipExercise}
                  sx={{ flex: 1, minHeight: '44px' }}
                >
                  Skip Exercise
                </Button>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<SwapHoriz />}
                  onClick={swapExercise}
                  sx={{ flex: 1, minHeight: '44px' }}
                >
                  Swap Exercise
                </Button>
              </Box>
              
              <div className="workout-nav-buttons">
                {currentStepIndex > 0 && (
                  <motion.button
                    type="button"
                    className="back-btn"
                    onClick={handleBack}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    style={{ minHeight: '44px' }}
                  >
                    <ArrowBack sx={{ fontSize: 18, mr: 0.5 }} /> Back
                  </motion.button>
                )}
                <motion.button
                  type="submit"
                  className="next-btn"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  style={{ minHeight: '44px' }}
                >
                  Next <ArrowForward sx={{ fontSize: 18, ml: 0.5 }} />
                </motion.button>
              </div>
            </motion.div>
          </motion.form>
        </AnimatePresence>
      </div>
      
      <div className="workout-controls">
        <motion.button
          className="exit-workout-btn"
          onClick={handleExit}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          style={{
            background: 'rgb(237, 63, 39)',
            marginBottom: '12px',
            color: 'white',
            minHeight: '44px',
          }}
        >
          <ExitToApp sx={{ fontSize: 18, mr: 0.5 }} /> End Workout
        </motion.button>
        {workoutData.length > 0 && (
          <motion.button
            className="partial-complete-btn"
            onClick={handlePartialComplete}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            style={{
              background: 'rgb(254, 178, 26)',
              color: 'rgb(19, 70, 134)',
              minHeight: '44px',
            }}
          >
            End and Save
          </motion.button>
        )}
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
};

export default WorkoutScreen;
