import { useState, useEffect, memo, useCallback } from 'react';
import { motion } from 'framer-motion';
import PropTypes from 'prop-types';
import { Box, Typography, Card, CardContent, Button, Chip, Stack, TextField, Snackbar, Alert, IconButton } from '@mui/material';
import { FitnessCenter, PlayArrow, Close, StarOutline, Star, Shuffle } from '@mui/icons-material';
import { getExerciseWeight, getExerciseTargetReps, setExerciseWeight, setExerciseTargetReps, saveFavoriteWorkout } from '../utils/storage';
import { EXERCISES_DATA_PATH } from '../utils/constants';
import ExerciseAutocomplete from './ExerciseAutocomplete';

/**
 * WorkoutPreview component displays a preview of the generated workout
 * Allows users to set starting weights and target reps before beginning
 * Memoized to prevent unnecessary re-renders
 */
const WorkoutPreview = memo(({ workout, workoutType, onStart, onCancel, onRandomizeExercise }) => {
  const [exerciseSettings, setExerciseSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [savedToFavorites, setSavedToFavorites] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [customizedSettings, setCustomizedSettings] = useState({});
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [availableExercises, setAvailableExercises] = useState([]);

  // Load all exercises data
  useEffect(() => {
    const loadExercises = async () => {
      try {
        const response = await fetch(EXERCISES_DATA_PATH);
        const exercisesData = await response.json();
        
        // Filter exercises based on workout type
        let filtered = exercisesData;
        if (workoutType === 'upper') {
          filtered = exercisesData.filter(ex => 
            ex['Workout Type'] && 
            (ex['Workout Type'].includes('Upper Body') || 
             ex['Workout Type'].includes('Full Body') ||
             ex['Workout Type'].includes('Push/Pull/Legs'))
          );
        } else if (workoutType === 'lower') {
          filtered = exercisesData.filter(ex => 
            ex['Workout Type'] && 
            (ex['Workout Type'].includes('Lower Body') || 
             ex['Workout Type'].includes('Full Body') ||
             ex['Workout Type'].includes('Push/Pull/Legs'))
          );
        } else if (workoutType === 'full') {
          filtered = exercisesData.filter(ex => 
            ex['Workout Type'] && ex['Workout Type'].includes('Full Body')
          );
        }
        setAvailableExercises(filtered);
      } catch (error) {
        console.error('Error loading exercises:', error);
        setAvailableExercises([]);
      }
    };
    loadExercises();
  }, [workoutType]);

  // Load saved weights and target reps on mount
  useEffect(() => {
    // Scroll to top when component mounts
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    const loadSettings = async () => {
      const settings = {};
      for (const exercise of workout) {
        const exerciseName = exercise['Exercise Name'];
        const [weight, targetReps] = await Promise.all([
          getExerciseWeight(exerciseName),
          getExerciseTargetReps(exerciseName)
        ]);
        settings[exerciseName] = {
          weight: weight ?? '', // Use empty string for null/undefined
          targetReps: targetReps ?? '', // Use empty string for null/undefined
        };
      }
      setExerciseSettings(settings);
      setLoading(false);
    };
    loadSettings();
  }, [workout]);

  // Handle workout changes (e.g., from randomization) and preserve customized settings
  useEffect(() => {
    const updateNewExercises = async () => {
      const currentExerciseNames = Object.keys(exerciseSettings);
      
      // Find new exercises that need settings loaded
      const newExercises = workout.filter(
        ex => !currentExerciseNames.includes(ex['Exercise Name'])
      );
      
      if (newExercises.length > 0) {
        const newSettings = { ...exerciseSettings };
        
        for (const exercise of newExercises) {
          const exerciseName = exercise['Exercise Name'];
          // Only load if not already customized
          if (!customizedSettings[exerciseName]) {
            const [weight, targetReps] = await Promise.all([
              getExerciseWeight(exerciseName),
              getExerciseTargetReps(exerciseName)
            ]);
            newSettings[exerciseName] = {
              weight: weight ?? '', // Use empty string for null/undefined
              targetReps: targetReps ?? '', // Use empty string for null/undefined
            };
          }
        }
        
        setExerciseSettings(newSettings);
      }
    };
    
    if (!loading && Object.keys(exerciseSettings).length > 0) {
      updateNewExercises();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workout, loading]); // Intentionally excluding exerciseSettings and customizedSettings to avoid loops

  const handleWeightChange = (exerciseName, value) => {
    // Allow empty state and validate: only allow non-negative numbers
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      const numValue = value === '' ? '' : parseFloat(value);
      setExerciseSettings(prev => ({
        ...prev,
        [exerciseName]: {
          ...prev[exerciseName],
          weight: numValue,
        }
      }));
      // Track as customized
      setCustomizedSettings(prev => ({
        ...prev,
        [exerciseName]: { ...prev[exerciseName], weightCustomized: true }
      }));
    }
  };

  const handleWeightBlur = (exerciseName, value) => {
    // If empty, keep empty on blur (don't force to 0)
    if (value === '' || value === null || value === undefined) {
      return;
    }
    
    const numValue = parseFloat(value);
    if (!isNaN(numValue) && numValue > 0) {
      // Round to nearest 2.5 lbs
      const rounded = Math.round(numValue / 2.5) * 2.5;
      if (rounded !== numValue) {
        setExerciseSettings(prev => ({
          ...prev,
          [exerciseName]: {
            ...prev[exerciseName],
            weight: rounded,
          }
        }));
        // Show notification
        setSnackbar({
          open: true,
          message: `Weight adjusted to ${rounded} lbs (nearest 2.5 lb increment)`,
          severity: 'info'
        });
      }
    }
  };

  const handleTargetRepsChange = (exerciseName, value) => {
    // Allow empty state and validate: only allow positive integers
    if (value === '' || /^\d+$/.test(value)) {
      const numValue = value === '' ? '' : parseInt(value, 10);
      setExerciseSettings(prev => ({
        ...prev,
        [exerciseName]: {
          ...prev[exerciseName],
          targetReps: numValue,
        }
      }));
      // Track as customized
      setCustomizedSettings(prev => ({
        ...prev,
        [exerciseName]: { ...prev[exerciseName], repsCustomized: true }
      }));
    }
  };

  const handleTargetRepsBlur = (exerciseName, value) => {
    // If empty, keep empty on blur (don't force to default)
    if (value === '' || value === null || value === undefined) {
      return;
    }
    
    const numValue = parseInt(value, 10);
    if (isNaN(numValue) || numValue < 1) {
      // Keep empty if invalid
      setExerciseSettings(prev => ({
        ...prev,
        [exerciseName]: {
          ...prev[exerciseName],
          targetReps: '',
        }
      }));
    }
  };

  const handleRandomizeExercise = useCallback((exercise, globalIndex) => {
    if (onRandomizeExercise) {
      onRandomizeExercise(exercise, globalIndex);
    }
  }, [onRandomizeExercise]);

  const handleSwapExercise = useCallback((globalIndex, newExercise) => {
    if (!newExercise || !onRandomizeExercise) return;
    
    // Use the randomize callback to swap the exercise
    // This will trigger the parent component to update the workout
    onRandomizeExercise(newExercise, globalIndex);
  }, [onRandomizeExercise]);

  const handleStartWorkout = async () => {
    // Save all settings before starting workout, storing null for empty strings
    // Save sequentially to avoid race conditions with localStorage reads/writes
    for (const [exerciseName, settings] of Object.entries(exerciseSettings)) {
      const weight = settings.weight === '' ? null : settings.weight;
      const targetReps = settings.targetReps === '' ? null : settings.targetReps;
      await setExerciseWeight(exerciseName, weight);
      await setExerciseTargetReps(exerciseName, targetReps);
    }
    onStart();
  };

  const handleSaveToFavorites = () => {
    try {
      saveFavoriteWorkout({
        name: `${workoutType.charAt(0).toUpperCase() + workoutType.slice(1)} Body Workout`,
        type: workoutType,
        exercises: workout,
      });
      setSavedToFavorites(true);
      setShowNotification(true);
    } catch (error) {
      console.error('Error saving to favorites:', error);
    }
  };

  // Group exercises into supersets (pairs of 2)
  const supersets = [];
  for (let i = 0; i < workout.length; i += 2) {
    if (workout[i] && workout[i + 1]) {
      supersets.push([workout[i], workout[i + 1]]);
    }
  }

  if (loading) {
    return (
      <Box sx={{ 
        textAlign: 'center', 
        py: 8, 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center',
        minHeight: '400px'
      }}>
        <img 
          src={`${import.meta.env.BASE_URL}dancing-icon.svg`} 
          alt="Loading workout..." 
          style={{ width: '150px', height: '150px' }}
        />
      </Box>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4 }}
      className="screen"
      style={{ 
        maxWidth: '900px', 
        margin: '0 auto',
        padding: '1rem',
        width: '100%',
        boxSizing: 'border-box',
        overflowX: 'hidden'
      }}
    >
      <Box sx={{ mb: { xs: 2, sm: 4 }, textAlign: 'center', position: 'relative', px: { xs: 0.5, sm: 0 } }}>
        <IconButton
          onClick={handleSaveToFavorites}
          disabled={savedToFavorites}
          size="small"
          sx={{
            position: 'absolute',
            top: 0,
            right: { xs: 0, sm: 0 },
            color: savedToFavorites ? 'warning.main' : 'action.active',
            minWidth: '44px',
            minHeight: '44px',
            '&:hover': {
              color: 'warning.main',
            },
            p: { xs: 0.5, sm: 1 }
          }}
          aria-label="Save to favorites"
        >
          {savedToFavorites ? <Star sx={{ fontSize: { xs: 24, sm: 32 } }} /> : <StarOutline sx={{ fontSize: { xs: 24, sm: 32 } }} />}
        </IconButton>
        <motion.div
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
        >
          <FitnessCenter sx={{ fontSize: { xs: 48, sm: 60 }, color: 'primary.main', mb: { xs: 1, sm: 2 } }} />
        </motion.div>
        <Typography variant="h3" component="h1" gutterBottom sx={{ 
          fontWeight: 700,
          color: 'primary.main',
          fontSize: { xs: '1.5rem', sm: '3rem' }
        }}>
          Your {workoutType.charAt(0).toUpperCase() + workoutType.slice(1)} Body Workout
        </Typography>
        <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 1, fontSize: { xs: '0.875rem', sm: '1rem' } }}>
          {supersets.length} Supersets • {workout.length} Exercises • 3 Sets Each
        </Typography>
        <Typography variant="body2" color="primary.main" sx={{ fontWeight: 600, fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
          Set your starting target weight and target reps for each exercise
        </Typography>
      </Box>

      <Stack spacing={{ xs: 2, sm: 3 }} sx={{ px: { xs: 0.5, sm: 0 } }}>
        {supersets.map((superset, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 * idx, duration: 0.4 }}
          >
            <Card 
              sx={{ 
                background: 'linear-gradient(135deg, rgba(138, 190, 185, 0.1), rgba(193, 120, 90, 0.1))',
                border: '2px solid',
                borderColor: 'primary.main',
                borderRadius: 3,
                transition: 'all 0.3s ease',
                maxWidth: '100%',
                boxSizing: 'border-box',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 12px 24px rgba(48, 86, 105, 0.2)',
                }
              }}
            >
              <CardContent sx={{ p: { xs: 1.5, sm: 2 }, '&:last-child': { pb: { xs: 1.5, sm: 2 } } }}>
                <Typography 
                  variant="h6" 
                  gutterBottom 
                  sx={{ 
                    color: 'secondary.main',
                    fontWeight: 600,
                    mb: 1.5,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1
                  }}
                >
                  <Chip 
                    label={`Superset ${idx + 1}`} 
                    size="small" 
                    sx={{ 
                      bgcolor: 'secondary.main',
                      color: 'white',
                      fontWeight: 600
                    }} 
                  />
                </Typography>
                
                <Stack spacing={{ xs: 1, sm: 1.5 }}>
                  {superset.map((exercise, exerciseIdx) => {
                    const exerciseName = exercise['Exercise Name'];
                    const settings = exerciseSettings[exerciseName] || { weight: '', targetReps: '' };
                    
                    return (
                      <Box 
                        key={exerciseIdx}
                        sx={{ 
                          p: { xs: 1, sm: 1.5 },
                          bgcolor: 'background.paper',
                          borderRadius: 2,
                          transition: 'all 0.2s ease',
                        }}
                      >
                        <Box sx={{ 
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: { xs: 1, sm: 1.5 },
                          mb: { xs: 1, sm: 1.5 }
                        }}>
                          <Typography 
                            sx={{ 
                              fontSize: { xs: '1.25rem', sm: '1.75rem' },
                              color: 'primary.main',
                              fontWeight: 700,
                              minWidth: { xs: '28px', sm: '36px' }
                            }}
                          >
                            {exerciseIdx === 0 ? 'A' : 'B'}
                          </Typography>
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mb: 0.5 }}>
                              <Box sx={{ flex: 1 }}>
                                <ExerciseAutocomplete
                                  value={exercise}
                                  onChange={(event, newValue) => {
                                    if (newValue) {
                                      const globalIndex = idx * 2 + exerciseIdx;
                                      handleSwapExercise(globalIndex, newValue);
                                    }
                                  }}
                                  availableExercises={availableExercises}
                                  label="Exercise"
                                  placeholder="Type to search and swap..."
                                  disabled={availableExercises.length === 0}
                                />
                              </Box>
                              {onRandomizeExercise && (
                                <IconButton
                                  size="small"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const globalIndex = idx * 2 + exerciseIdx;
                                    handleRandomizeExercise(exercise, globalIndex);
                                  }}
                                  sx={{
                                    color: 'primary.main',
                                    minWidth: '44px',
                                    minHeight: '44px',
                                    mt: 0.5,
                                    '&:hover': {
                                      backgroundColor: 'rgba(19, 70, 134, 0.08)',
                                    },
                                  }}
                                  aria-label={`Randomize ${exerciseName}`}
                                >
                                  <Shuffle fontSize="small" />
                                </IconButton>
                              )}
                            </Box>
                            <Stack direction="row" spacing={1} flexWrap="wrap">
                              <Chip 
                                label={exercise['Primary Muscle']} 
                                size="small" 
                                variant="outlined"
                                sx={{ 
                                  borderColor: 'primary.main',
                                  color: 'primary.main',
                                  fontSize: { xs: '0.65rem', sm: '0.75rem' }
                                }}
                              />
                              <Chip 
                                label={exercise['Equipment']} 
                                size="small" 
                                variant="outlined"
                                sx={{ 
                                  borderColor: 'text.secondary',
                                  color: 'text.secondary',
                                  fontSize: { xs: '0.65rem', sm: '0.75rem' }
                                }}
                              />
                            </Stack>
                          </Box>
                        </Box>
                        <Stack 
                          direction="row" 
                          spacing={{ xs: 1, sm: 1.5 }} 
                          sx={{ 
                            pl: { xs: 3.5, sm: 5.5 },
                            flexWrap: { xs: 'wrap', sm: 'nowrap' }
                          }}
                        >
                          <TextField
                            type="tel"
                            inputMode="decimal"
                            value={settings.weight === '' ? '' : settings.weight}
                            onChange={(e) => handleWeightChange(exerciseName, e.target.value)}
                            onBlur={(e) => handleWeightBlur(exerciseName, e.target.value)}
                            onFocus={(e) => e.target.select()}
                            placeholder="Weight (lbs)"
                            size="small"
                            inputProps={{
                              min: 0,
                              max: 500,
                              step: 2.5,
                              pattern: '[0-9]*([.,][0-9]+)?',
                              'aria-label': `Target weight in pounds for ${exerciseName}`,
                            }}
                            sx={{ 
                              minWidth: { xs: 100, sm: 120 },
                              flex: { xs: '1 1 45%', sm: 'none' }
                            }}
                          />
                          <TextField
                            type="tel"
                            inputMode="numeric"
                            value={settings.targetReps === '' ? '' : settings.targetReps}
                            onChange={(e) => handleTargetRepsChange(exerciseName, e.target.value)}
                            onBlur={(e) => handleTargetRepsBlur(exerciseName, e.target.value)}
                            onFocus={(e) => e.target.select()}
                            placeholder="Reps"
                            size="small"
                            inputProps={{
                              min: 1,
                              max: 20,
                              step: 1,
                              pattern: '\\d*',
                              'aria-label': `Target repetitions for ${exerciseName}`,
                            }}
                            sx={{ 
                              minWidth: { xs: 100, sm: 120 },
                              flex: { xs: '1 1 45%', sm: 'none' }
                            }}
                          />
                        </Stack>
                      </Box>
                    );
                  })}
                </Stack>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </Stack>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <Stack 
          direction="row"
          spacing={2} 
          sx={{ mt: { xs: 3, sm: 4 }, px: { xs: 0.5, sm: 0 } }}
          justifyContent="center"
        >
          <Button
            variant="contained"
            size="large"
            onClick={onCancel}
            sx={{
              borderRadius: 2,
              minWidth: { xs: '60px', sm: '80px' },
              px: { xs: 1, sm: 2 },
              py: 1.5,
              fontSize: { xs: '1.2rem', sm: '1.5rem' },
              fontWeight: 600,
              bgcolor: 'rgb(237, 63, 39)',
              color: 'white',
              '&:hover': {
                bgcolor: 'rgb(200, 50, 30)',
              }
            }}
          >
            ✕
          </Button>
          <Button
            variant="contained"
            size="large"
            startIcon={savedToFavorites ? <Star /> : <StarOutline />}
            onClick={handleSaveToFavorites}
            disabled={savedToFavorites}
            sx={{
              borderRadius: 2,
              flex: 1,
              maxWidth: { xs: '130px', sm: '150px' },
              px: { xs: 2, sm: 3 },
              py: 1.5,
              fontSize: { xs: '0.9rem', sm: '1.1rem' },
              fontWeight: 600,
              bgcolor: savedToFavorites ? 'rgb(76, 175, 80)' : 'rgb(254, 178, 26)',
              color: 'white',
              '&:hover': {
                bgcolor: savedToFavorites ? 'rgb(56, 142, 60)' : 'rgb(245, 158, 11)',
              },
              '&:disabled': {
                bgcolor: 'rgb(76, 175, 80)',
                color: 'white',
                opacity: 0.8,
              }
            }}
          >
            {savedToFavorites ? 'Saved!' : 'Save'}
          </Button>
          <Button
            variant="contained"
            size="large"
            startIcon={<PlayArrow />}
            onClick={handleStartWorkout}
            sx={{
              borderRadius: 2,
              flex: 1,
              maxWidth: { xs: '130px', sm: '150px' },
              px: { xs: 2, sm: 3 },
              py: 1.5,
              fontSize: { xs: '0.9rem', sm: '1.1rem' },
              fontWeight: 600,
              bgcolor: 'rgb(19, 70, 134)',
              color: 'white',
              '&:hover': {
                bgcolor: 'rgb(15, 56, 107)',
                transform: 'translateY(-2px)',
                boxShadow: '0 8px 16px rgba(19, 70, 134, 0.3)',
              },
              transition: 'all 0.3s ease'
            }}
          >
            Begin
          </Button>
        </Stack>
      </motion.div>

      <Snackbar
        open={showNotification}
        autoHideDuration={3000}
        onClose={() => setShowNotification(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="success" onClose={() => setShowNotification(false)}>
          Workout saved to favorites!
        </Alert>
      </Snackbar>
      
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </motion.div>
  );
});

WorkoutPreview.displayName = 'WorkoutPreview';

WorkoutPreview.propTypes = {
  workout: PropTypes.array.isRequired,
  workoutType: PropTypes.string.isRequired,
  onStart: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  onRandomizeExercise: PropTypes.func,
  equipmentFilter: PropTypes.oneOfType([PropTypes.string, PropTypes.array]),
};

export default WorkoutPreview;
