import { useState, useEffect, useRef, useMemo } from 'react';
import PropTypes from 'prop-types';
import { motion, AnimatePresence } from 'framer-motion';
import { formatTime, getYoutubeEmbedUrl, detectWorkoutType } from '../utils/helpers';
import { getExerciseWeight, getExerciseTargetReps, setExerciseWeight, setExerciseTargetReps, saveFavoriteWorkout } from '../utils/storage';
import { SETS_PER_EXERCISE } from '../utils/constants';
import { Box, LinearProgress, Typography, IconButton, Snackbar, Alert } from '@mui/material';
import { ArrowBack, ArrowForward, ExitToApp, Star, StarBorder } from '@mui/icons-material';

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
  const startTimeRef = useRef(null);
  const timerRef = useRef(null);

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

  // Load previous weight and target reps when current step changes
  useEffect(() => {
    const loadSettings = async () => {
      if (currentStep?.exercise?.['Exercise Name']) {
        const [weight, reps] = await Promise.all([
          getExerciseWeight(currentStep.exercise['Exercise Name']),
          getExerciseTargetReps(currentStep.exercise['Exercise Name'])
        ]);
        setPrevWeight(weight);
        setTargetReps(reps);
      }
    };
    loadSettings();
    
    // Scroll to top when exercise changes
    window.scrollTo({ top: 0, behavior: 'smooth' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStepIndex]);

  const currentStep = workoutSequence[currentStepIndex];
  const exerciseName = currentStep?.exercise?.['Exercise Name'];

  /**
   * Apply conditional persist rules after workout completion
   * 
   * Persist Rules:
   * 1. Only update Target Weight if ALL sets' reps >= current Target Reps (treat null/empty as 0)
   *    - Use the latest weight entered (last set's weight)
   * 2. Only update Target Reps if ALL sets' reps > current Target Reps AND reps vary across sets
   *    - Set to min(recorded reps)
   * 3. If ANY set's reps < current Target Reps, do NOT update either Target Weight or Target Reps
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
      
      // Get all reps from sets (already validated as numbers in handleNext)
      const allReps = sets.map(s => s.reps).filter(r => typeof r === 'number' && !isNaN(r));
      
      // Skip if no valid reps data
      if (allReps.length === 0) continue;
      
      const minReps = Math.min(...allReps);
      const maxReps = Math.max(...allReps);
      const repsVary = minReps !== maxReps;
      
      // Check if all sets' reps >= current target reps
      const allSetsMetTarget = allReps.every(r => r >= currentTargetReps);
      
      // Check if all sets' reps > current target reps
      const allSetsExceededTarget = allReps.every(r => r > currentTargetReps);
      
      if (allSetsMetTarget) {
        // Update Target Weight: use latest weight (last set's weight)
        // Validate it's a non-negative number
        const latestWeight = sets[sets.length - 1].weight;
        if (typeof latestWeight === 'number' && !isNaN(latestWeight) && latestWeight >= 0) {
          await setExerciseWeight(exName, latestWeight);
        }
        
        // Update Target Reps only if all sets exceeded target AND reps vary
        if (allSetsExceededTarget && repsVary && minReps > 0) {
          await setExerciseTargetReps(exName, minReps);
        }
      }
      // If any set's reps < current target reps, don't update either value
    }
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
    
    if (currentStepIndex + 1 >= workoutSequence.length) {
      // Workout complete - apply conditional persist rules
      await applyConditionalPersistRules(updatedWorkoutData);
      
      const totalTime = Math.floor((Date.now() - startTimeRef.current) / 1000);
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      
      const finalData = {
        date: new Date().toISOString(),
        type: workoutPlan[0]?.['Primary Muscle'] || 'unknown',
        duration: totalTime,
        exercises: {},
      };
      
      updatedWorkoutData.forEach(step => {
        const { exerciseName: exName, setNumber, weight: w, reps: r } = step;
        if (!finalData.exercises[exName]) {
          finalData.exercises[exName] = { sets: [] };
        }
        finalData.exercises[exName].sets.push({ set: setNumber, weight: w, reps: r });
      });
      
      onComplete(finalData);
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

  if (!currentStep) {
    return null;
  }

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
              <p className="set-info">Set {currentStep.setNumber} of {SETS_PER_EXERCISE}</p>
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
              <div className="input-row">
                <div className="input-group">
                  <label htmlFor="weight-select">Weight (lbs)</label>
                  <input
                    id="weight-select"
                    type="tel"
                    inputMode="decimal"
                    pattern="[0-9]*([.,][0-9]+)?"
                    step="2.5"
                    min="0"
                    max="500"
                    className="exercise-input"
                    defaultValue={prevWeight ?? ''}
                    placeholder="–"
                    aria-label="Weight in pounds"
                    onFocus={(e) => {
                      e.target.select();
                      // Only scroll if input would be obscured by keyboard
                      // Keyboard takes up ~40% of viewport, scroll only if input is in lower 45%
                      const rect = e.target.getBoundingClientRect();
                      const inputBottom = rect.bottom;
                      const viewportHeight = window.innerHeight;
                      const threshold = viewportHeight * 0.55; // 55% from top = lower 45%
                      
                      // Only snap if input bottom is in the lower 45% (below 55% threshold)
                      if (inputBottom > threshold) {
                        setTimeout(() => {
                          e.target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                          // Additional scroll to create more space above the input
                          setTimeout(() => {
                            window.scrollBy({ top: -80, behavior: 'smooth' });
                          }, 100);
                        }, 300);
                      }
                    }}
                    style={{
                      width: '100%',
                      padding: '12px',
                      borderRadius: '8px',
                      border: '2px solid var(--color-border)',
                      fontSize: '1rem',
                      fontFamily: 'var(--font-body)',
                      backgroundColor: 'var(--color-surface)',
                      color: 'var(--color-text)',
                    }}
                  />
                </div>
                <div className="input-group">
                  <label htmlFor="reps-select">Reps</label>
                  <input
                    id="reps-select"
                    type="tel"
                    inputMode="numeric"
                    pattern="\d*"
                    step="1"
                    min="1"
                    max="20"
                    className="exercise-input"
                    defaultValue={targetReps ?? ''}
                    placeholder="–"
                    aria-label="Repetitions"
                    onFocus={(e) => {
                      e.target.select();
                      // Only scroll if input would be obscured by keyboard
                      // Keyboard takes up ~40% of viewport, scroll only if input is in lower 45%
                      const rect = e.target.getBoundingClientRect();
                      const inputBottom = rect.bottom;
                      const viewportHeight = window.innerHeight;
                      const threshold = viewportHeight * 0.55; // 55% from top = lower 45%
                      
                      // Only snap if input bottom is in the lower 45% (below 55% threshold)
                      if (inputBottom > threshold) {
                        setTimeout(() => {
                          e.target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                          // Additional scroll to create more space above the input
                          setTimeout(() => {
                            window.scrollBy({ top: -80, behavior: 'smooth' });
                          }, 100);
                        }, 300);
                      }
                    }}
                    style={{
                      width: '100%',
                      padding: '12px',
                      borderRadius: '8px',
                      border: '2px solid var(--color-border)',
                      fontSize: '1rem',
                      fontFamily: 'var(--font-body)',
                      backgroundColor: 'var(--color-surface)',
                      color: 'var(--color-text)',
                    }}
                  />
                </div>
              </div>
              <div className="workout-nav-buttons">
                {currentStepIndex > 0 && (
                  <motion.button
                    type="button"
                    className="back-btn"
                    onClick={handleBack}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <ArrowBack sx={{ fontSize: 18, mr: 0.5 }} /> Back
                  </motion.button>
                )}
                <motion.button
                  type="submit"
                  className="next-btn"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
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
