import { useState, useEffect, memo } from 'react';
import { motion, Reorder } from 'framer-motion';
import PropTypes from 'prop-types';
import { 
  Box, 
  Typography, 
  Card, 
  CardContent, 
  Button, 
  Chip, 
  Stack, 
  TextField, 
  Snackbar, 
  Alert, 
  IconButton,
  Paper
} from '@mui/material';
import { 
  FitnessCenter, 
  PlayArrow, 
  Close, 
  StarOutline, 
  Star,
  DragIndicator
} from '@mui/icons-material';
import { 
  getExerciseWeight, 
  getExerciseTargetReps, 
  setExerciseWeight, 
  setExerciseTargetReps, 
  saveFavoriteWorkout 
} from '../utils/storage';
import { EXERCISES_DATA_PATH } from '../utils/constants';
import ExerciseAutocomplete from './ExerciseAutocomplete';

/** Weight rounding increment in pounds */
const WEIGHT_INCREMENT = 2.5;

/**
 * CustomWorkoutPreview component displays a preview of custom workout
 * Allows users to reorder exercises via drag-and-drop
 * Allows users to set starting weights and target reps before beginning
 */
const CustomWorkoutPreview = memo(({ 
  workout: initialWorkout, 
  workoutType, 
  onStart, 
  onCancel 
}) => {
  const [workout, setWorkout] = useState(initialWorkout);
  const [exerciseSettings, setExerciseSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [savedToFavorites, setSavedToFavorites] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
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
    }
  };

  const handleWeightBlur = (exerciseName, value) => {
    // If empty, keep empty on blur (don't force to 0)
    if (value === '' || value === null || value === undefined) {
      return;
    }
    
    const numValue = parseFloat(value);
    if (!isNaN(numValue) && numValue > 0) {
      const rounded = Math.round(numValue / WEIGHT_INCREMENT) * WEIGHT_INCREMENT;
      if (rounded !== numValue) {
        setExerciseSettings(prev => ({
          ...prev,
          [exerciseName]: {
            ...prev[exerciseName],
            weight: rounded,
          }
        }));
        setSnackbar({
          open: true,
          message: `Weight adjusted to ${rounded} lbs (nearest ${WEIGHT_INCREMENT} lb increment)`,
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
    }
  };

  const handleSwapExercise = (index, newExercise) => {
    if (!newExercise) return;
    
    const updatedWorkout = [...workout];
    updatedWorkout[index] = {
      ...newExercise,
      name: newExercise['Exercise Name'] || newExercise.name
    };
    setWorkout(updatedWorkout);
    
    // Transfer settings if they exist, otherwise initialize
    const oldExerciseName = workout[index]['Exercise Name'];
    const newExerciseName = newExercise['Exercise Name'];
    
    if (oldExerciseName !== newExerciseName) {
      setExerciseSettings(prev => {
        const oldSettings = prev[oldExerciseName] || { weight: '', targetReps: '' };
        const { [oldExerciseName]: _removed, ...rest } = prev;
        return {
          ...rest,
          [newExerciseName]: oldSettings
        };
      });
    }
  };

  const handleStartWorkout = async () => {
    // Save all settings before starting workout, storing null for empty strings
    for (const [exerciseName, settings] of Object.entries(exerciseSettings)) {
      const weight = settings.weight === '' ? null : settings.weight;
      const targetReps = settings.targetReps === '' ? null : settings.targetReps;
      await setExerciseWeight(exerciseName, weight);
      await setExerciseTargetReps(exerciseName, targetReps);
    }
    onStart(workout);
  };

  const handleSaveToFavorites = () => {
    try {
      saveFavoriteWorkout({
        name: `Custom ${workoutType.charAt(0).toUpperCase() + workoutType.slice(1)} Body Workout`,
        type: workoutType,
        exercises: workout,
      });
      setSavedToFavorites(true);
      setShowNotification(true);
    } catch (error) {
      console.error('Error saving to favorites:', error);
    }
  };

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
          Your Custom Workout
        </Typography>
        <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 1, fontSize: { xs: '0.875rem', sm: '1rem' } }}>
          {workout.length} Exercises • 3 Sets Each
        </Typography>
        <Alert severity="info" sx={{ mt: 2, mb: 2 }}>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            Drag and drop to reorder exercises
          </Typography>
        </Alert>
      </Box>

      {/* Reorderable Exercise List */}
      <Reorder.Group 
        axis="y" 
        values={workout} 
        onReorder={setWorkout}
        style={{ padding: 0, margin: 0, listStyle: 'none' }}
      >
        <Stack spacing={{ xs: 2, sm: 3 }} sx={{ px: { xs: 0.5, sm: 0 } }}>
          {workout.map((exercise, idx) => {
            const exerciseName = exercise['Exercise Name'];
            const settings = exerciseSettings[exerciseName] || { weight: '', targetReps: '' };
            
            return (
              <Reorder.Item 
                key={exerciseName} 
                value={exercise}
                style={{ listStyle: 'none' }}
              >
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.05 * idx, duration: 0.3 }}
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
                      cursor: 'grab',
                      '&:active': {
                        cursor: 'grabbing',
                      },
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: '0 12px 24px rgba(48, 86, 105, 0.2)',
                      }
                    }}
                  >
                    <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                        <Box sx={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          color: 'text.secondary',
                          cursor: 'grab',
                          '&:active': {
                            cursor: 'grabbing',
                          }
                        }}>
                          <DragIndicator />
                        </Box>
                        <Typography 
                          sx={{ 
                            fontSize: { xs: '1.5rem', sm: '2rem' },
                            color: 'primary.main',
                            fontWeight: 700,
                            minWidth: { xs: '30px', sm: '40px' }
                          }}
                        >
                          {idx + 1}
                        </Typography>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Box sx={{ mb: 1 }}>
                            <ExerciseAutocomplete
                              value={exercise}
                              onChange={(event, newValue) => {
                                if (newValue) {
                                  handleSwapExercise(idx, newValue);
                                }
                              }}
                              availableExercises={availableExercises}
                              label="Exercise"
                              placeholder="Type to search and swap..."
                              disabled={availableExercises.length === 0}
                            />
                          </Box>
                          <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mb: 2 }}>
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
                          <Stack 
                            direction="row" 
                            spacing={{ xs: 1, sm: 2 }} 
                            sx={{ flexWrap: { xs: 'wrap', sm: 'nowrap' } }}
                          >
                            <TextField
                              type="tel"
                              inputMode="decimal"
                              label="Target Weight (lbs)"
                              value={settings.weight === '' ? '' : settings.weight}
                              onChange={(e) => handleWeightChange(exerciseName, e.target.value)}
                              onBlur={(e) => handleWeightBlur(exerciseName, e.target.value)}
                              onFocus={(e) => e.target.select()}
                              placeholder="–"
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
                              label="Target Reps"
                              value={settings.targetReps === '' ? '' : settings.targetReps}
                              onChange={(e) => handleTargetRepsChange(exerciseName, e.target.value)}
                              onFocus={(e) => e.target.select()}
                              placeholder="–"
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
                      </Box>
                    </CardContent>
                  </Card>
                </motion.div>
              </Reorder.Item>
            );
          })}
        </Stack>
      </Reorder.Group>

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

CustomWorkoutPreview.displayName = 'CustomWorkoutPreview';

CustomWorkoutPreview.propTypes = {
  workout: PropTypes.array.isRequired,
  workoutType: PropTypes.string.isRequired,
  onStart: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
};

export default CustomWorkoutPreview;
