import { useState, useEffect, useMemo, memo } from 'react';
import { motion } from 'framer-motion';
import PropTypes from 'prop-types';
import { Box, Typography, Card, CardContent, Button, Chip, Stack, TextField, MenuItem, Snackbar, Alert, IconButton } from '@mui/material';
import { FitnessCenter, PlayArrow, Close, StarOutline, Star } from '@mui/icons-material';
import { getExerciseWeight, getExerciseTargetReps, setExerciseWeight, setExerciseTargetReps, saveFavoriteWorkout } from '../utils/storage';

/**
 * WorkoutPreview component displays a preview of the generated workout
 * Allows users to set starting weights and target reps before beginning
 * Memoized to prevent unnecessary re-renders
 */
const WorkoutPreview = memo(({ workout, workoutType, onStart, onCancel }) => {
  const [exerciseSettings, setExerciseSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [savedToFavorites, setSavedToFavorites] = useState(false);
  const [showNotification, setShowNotification] = useState(false);

  // Generate weight options once (0-500 lbs in 2.5 lb increments)
  const weightOptions = useMemo(() => {
    const options = [];
    for (let i = 0; i <= 500; i += 2.5) {
      options.push(i);
    }
    return options;
  }, []);

  // Generate target reps options once (1-20 reps)
  const repsOptions = useMemo(() => {
    const options = [];
    for (let i = 1; i <= 20; i++) {
      options.push(i);
    }
    return options;
  }, []);

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
          weight: weight || 0,
          targetReps: targetReps || 12,
        };
      }
      setExerciseSettings(settings);
      setLoading(false);
    };
    loadSettings();
  }, [workout]);

  const handleWeightChange = (exerciseName, value) => {
    setExerciseSettings(prev => ({
      ...prev,
      [exerciseName]: {
        ...prev[exerciseName],
        weight: parseFloat(value) || 0,
      }
    }));
  };

  const handleTargetRepsChange = (exerciseName, value) => {
    setExerciseSettings(prev => ({
      ...prev,
      [exerciseName]: {
        ...prev[exerciseName],
        targetReps: parseInt(value) || 12,
      }
    }));
  };

  const handleStartWorkout = async () => {
    // Save all settings before starting workout
    for (const [exerciseName, settings] of Object.entries(exerciseSettings)) {
      await setExerciseWeight(exerciseName, settings.weight);
      await setExerciseTargetReps(exerciseName, settings.targetReps);
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
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Typography>Loading workout...</Typography>
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
          Set your starting weight and target reps for each exercise
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
              <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
                <Typography 
                  variant="h6" 
                  gutterBottom 
                  sx={{ 
                    color: 'secondary.main',
                    fontWeight: 600,
                    mb: 2,
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
                
                <Stack spacing={{ xs: 1.5, sm: 2 }}>
                  {superset.map((exercise, exerciseIdx) => {
                    const exerciseName = exercise['Exercise Name'];
                    const settings = exerciseSettings[exerciseName] || { weight: 0, targetReps: 12 };
                    
                    return (
                      <Box 
                        key={exerciseIdx}
                        sx={{ 
                          p: { xs: 1.5, sm: 2 },
                          bgcolor: 'white',
                          borderRadius: 2,
                          transition: 'all 0.2s ease',
                        }}
                      >
                        <Box sx={{ 
                          display: 'flex',
                          alignItems: 'center',
                          gap: { xs: 1, sm: 2 },
                          mb: { xs: 1.5, sm: 2 }
                        }}>
                          <Typography 
                            sx={{ 
                              fontSize: { xs: '1.5rem', sm: '2rem' },
                              color: 'primary.main',
                              fontWeight: 700,
                              minWidth: { xs: '30px', sm: '40px' }
                            }}
                          >
                            {exerciseIdx === 0 ? 'A' : 'B'}
                          </Typography>
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography variant="body1" sx={{ fontWeight: 600, mb: 0.5, fontSize: { xs: '0.9rem', sm: '1rem' } }}>
                              {exerciseName}
                            </Typography>
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
                          spacing={{ xs: 1, sm: 2 }} 
                          sx={{ 
                            pl: { xs: 4, sm: 7 },
                            flexWrap: { xs: 'wrap', sm: 'nowrap' }
                          }}
                        >
                          <TextField
                            select
                            label="Weight (lbs)"
                            value={settings.weight}
                            onChange={(e) => handleWeightChange(exerciseName, e.target.value)}
                            size="small"
                            sx={{ 
                              minWidth: { xs: 100, sm: 120 },
                              flex: { xs: '1 1 45%', sm: 'none' }
                            }}
                          >
                            {weightOptions.map((weight) => (
                              <MenuItem key={weight} value={weight}>
                                {weight} lbs
                              </MenuItem>
                            ))}
                          </TextField>
                          <TextField
                            select
                            label="Target Reps"
                            value={settings.targetReps}
                            onChange={(e) => handleTargetRepsChange(exerciseName, e.target.value)}
                            size="small"
                            sx={{ 
                              minWidth: { xs: 100, sm: 120 },
                              flex: { xs: '1 1 45%', sm: 'none' }
                            }}
                          >
                            {repsOptions.map((reps) => (
                              <MenuItem key={reps} value={reps}>
                                {reps} reps
                              </MenuItem>
                            ))}
                          </TextField>
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
            variant="outlined"
            size="large"
            startIcon={<Close />}
            onClick={onCancel}
            sx={{
              borderRadius: 2,
              px: { xs: 2, sm: 4 },
              py: 1.5,
              fontSize: { xs: '0.9rem', sm: '1.1rem' },
              fontWeight: 600,
              borderColor: 'text.secondary',
              color: 'text.secondary',
              '&:hover': {
                borderColor: 'secondary.main',
                bgcolor: 'rgba(193, 120, 90, 0.1)',
              }
            }}
          >
            Cancel
          </Button>
          <Button
            variant="outlined"
            size="large"
            startIcon={savedToFavorites ? <Star /> : <StarOutline />}
            onClick={handleSaveToFavorites}
            disabled={savedToFavorites}
            sx={{
              borderRadius: 2,
              px: { xs: 2, sm: 4 },
              py: 1.5,
              fontSize: { xs: '0.9rem', sm: '1.1rem' },
              fontWeight: 600,
              borderColor: savedToFavorites ? 'success.main' : 'warning.main',
              color: savedToFavorites ? 'success.main' : 'warning.main',
              '&:hover': {
                borderColor: 'warning.main',
                bgcolor: 'rgba(254, 178, 26, 0.1)',
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
              px: { xs: 2, sm: 4 },
              py: 1.5,
              fontSize: { xs: '0.9rem', sm: '1.1rem' },
              fontWeight: 600,
              bgcolor: 'primary.main',
              '&:hover': {
                bgcolor: 'primary.dark',
                transform: 'translateY(-2px)',
                boxShadow: '0 8px 16px rgba(138, 190, 185, 0.3)',
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
    </motion.div>
  );
});

WorkoutPreview.displayName = 'WorkoutPreview';

WorkoutPreview.propTypes = {
  workout: PropTypes.array.isRequired,
  workoutType: PropTypes.string.isRequired,
  onStart: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
};

export default WorkoutPreview;
