import { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { motion, AnimatePresence } from 'framer-motion';
import { formatTime, getYoutubeEmbedUrl } from '../utils/helpers';
import { getExerciseWeight, getExerciseTargetReps } from '../utils/storage';
import { SETS_PER_EXERCISE } from '../utils/constants';
import { Box, LinearProgress, Typography, IconButton } from '@mui/material';
import { ArrowBack, ArrowForward, ExitToApp } from '@mui/icons-material';

const WorkoutScreen = ({ workoutPlan, onComplete, onExit }) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [workoutData, setWorkoutData] = useState([]);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [prevWeight, setPrevWeight] = useState(0);
  const [targetReps, setTargetReps] = useState(12);
  const startTimeRef = useRef(null);
  const timerRef = useRef(null);

  // Generate workout sequence (supersets)
  const workoutSequence = [];
  for (let i = 0; i < 4; i++) {
    const ex1 = workoutPlan[i * 2];
    const ex2 = workoutPlan[i * 2 + 1];
    if (!ex1 || !ex2) continue;
    for (let set = 1; set <= SETS_PER_EXERCISE; set++) {
      workoutSequence.push({ exercise: ex1, setNumber: set });
      workoutSequence.push({ exercise: ex2, setNumber: set });
    }
  }

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
        const weight = await getExerciseWeight(currentStep.exercise['Exercise Name']);
        const reps = await getExerciseTargetReps(currentStep.exercise['Exercise Name']);
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
    const weightInput = form.querySelector('#weight-select');
    const repsInput = form.querySelector('#reps-select');
    
    const weight = parseFloat(weightInput.value) || 0;
    const reps = parseInt(repsInput.value) || 0;

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

  const handleExit = () => {
    if (window.confirm('Are you sure you want to exit? Your progress will not be saved.')) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      onExit();
    }
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
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Exercise {currentStepIndex + 1} / {workoutSequence.length}
          </Typography>
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
        >
          <ExitToApp sx={{ fontSize: 18, mr: 0.5 }} /> Exit Workout
        </motion.button>
      </div>
    </div>
  );
};

WorkoutScreen.propTypes = {
  workoutPlan: PropTypes.array.isRequired,
  onComplete: PropTypes.func.isRequired,
  onExit: PropTypes.func.isRequired,
};

export default WorkoutScreen;
