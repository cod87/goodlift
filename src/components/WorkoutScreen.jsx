import { useState, useEffect, useRef, useMemo } from 'react';
import PropTypes from 'prop-types';
import { motion, AnimatePresence } from 'framer-motion';
import { formatTime, getYoutubeEmbedUrl } from '../utils/helpers';
import { getExerciseWeight, getExerciseTargetReps, saveFavoriteWorkout } from '../utils/storage';
import { SETS_PER_EXERCISE } from '../utils/constants';
import { Box, LinearProgress, Typography, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button } from '@mui/material';
import { ArrowBack, ArrowForward, ExitToApp, Star, StarBorder } from '@mui/icons-material';

/**
 * WorkoutScreen component manages the active workout session
 * Displays exercises in superset format, tracks time, and collects set data
 */
const WorkoutScreen = ({ workoutPlan, onComplete, onExit, workoutType }) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [workoutData, setWorkoutData] = useState([]);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [prevWeight, setPrevWeight] = useState(0);
  const [targetReps, setTargetReps] = useState(12);
  const [isFavorited, setIsFavorited] = useState(false);
  const [favoriteDialogOpen, setFavoriteDialogOpen] = useState(false);
  const [favoriteName, setFavoriteName] = useState('');
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

  // Start timer on mount
  useEffect(() => {
    startTimeRef.current = Date.now();
    timerRef.current = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
      setElapsedTime(elapsed);
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStepIndex]);

  const currentStep = workoutSequence[currentStepIndex];
  const exerciseName = currentStep?.exercise?.['Exercise Name'];

  const handleNext = (e) => {
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

    setWorkoutData(prev => [...prev, newData]);
    
    if (currentStepIndex + 1 >= workoutSequence.length) {
      // Workout complete
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
      
      [...workoutData, newData].forEach(step => {
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

  const handlePartialComplete = () => {
    if (window.confirm('Save this workout as partially complete? Your current progress will be saved.')) {
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

  const handleToggleFavorite = () => {
    if (!isFavorited) {
      setFavoriteName(`${workoutType} Workout`);
      setFavoriteDialogOpen(true);
    } else {
      setIsFavorited(false);
    }
  };

  const handleSaveFavorite = () => {
    if (favoriteName.trim()) {
      saveFavoriteWorkout({
        name: favoriteName.trim(),
        type: workoutType,
        equipment: 'all', // Could be enhanced to track actual equipment used
        exercises: workoutPlan,
      });
      setIsFavorited(true);
      setFavoriteDialogOpen(false);
      setFavoriteName('');
    }
  };

  const handleCancelFavorite = () => {
    setFavoriteDialogOpen(false);
    setFavoriteName('');
  };

  if (!currentStep) {
    return null;
  }

  return (
    <div className="screen"
      style={{
        paddingBottom: '100px', // Add padding to ensure input is visible above mobile keyboard
      }}
    >
      <Box sx={{ mb: 2 }}>
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          mb: 1
        }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            {formatTime(elapsedTime)}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <IconButton
              onClick={handleToggleFavorite}
              sx={{
                color: isFavorited ? 'warning.main' : 'text.secondary',
                '&:hover': {
                  color: 'warning.main',
                }
              }}
              aria-label="Save to favorites"
            >
              {isFavorited ? <Star /> : <StarBorder />}
            </IconButton>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Exercise {currentStepIndex + 1} / {workoutSequence.length}
            </Typography>
          </Box>
        </Box>
        <LinearProgress 
          variant="determinate" 
          value={(currentStepIndex / workoutSequence.length) * 100}
          sx={{ 
            height: 8,
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
              {prevWeight > 0 && (
                <motion.p
                  className="prev-weight"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  Last time: {prevWeight} lbs • Target: {targetReps} reps
                </motion.p>
              )}
              <div className="input-row">
                <div className="input-group">
                  <label htmlFor="weight-select">Weight (lbs)</label>
                  <input
                    id="weight-select"
                    type="number"
                    inputMode="decimal"
                    step="2.5"
                    min="0"
                    max="500"
                    className="exercise-input"
                    defaultValue={prevWeight || 0}
                    onFocus={(e) => {
                      // Scroll input into view on mobile when keyboard appears
                      setTimeout(() => {
                        e.target.scrollIntoView({ behavior: 'smooth', block: 'center' });
                      }, 300);
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
                    type="number"
                    inputMode="numeric"
                    step="1"
                    min="1"
                    max="20"
                    className="exercise-input"
                    defaultValue={targetReps || 8}
                    onFocus={(e) => {
                      // Scroll input into view on mobile when keyboard appears
                      setTimeout(() => {
                        e.target.scrollIntoView({ behavior: 'smooth', block: 'center' });
                      }, 300);
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

      {/* Save to Favorites Dialog */}
      <Dialog open={favoriteDialogOpen} onClose={handleCancelFavorite} maxWidth="sm" fullWidth>
        <DialogTitle>Save Workout to Favorites</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Workout Name"
            type="text"
            fullWidth
            value={favoriteName}
            onChange={(e) => setFavoriteName(e.target.value)}
            variant="outlined"
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelFavorite}>Cancel</Button>
          <Button onClick={handleSaveFavorite} variant="contained" disabled={!favoriteName.trim()}>
            Save
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
  workoutType: PropTypes.string.isRequired,
};

export default WorkoutScreen;
