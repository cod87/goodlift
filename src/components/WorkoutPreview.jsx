import { useState, useEffect, memo, useCallback } from 'react';
import { motion } from 'framer-motion';
import PropTypes from 'prop-types';
import { Box, Typography, Card, CardContent, Button, Stack, TextField, Snackbar, Alert, IconButton } from '@mui/material';
import { PlayArrow, StarOutline, Star, Shuffle, Add, Remove } from '@mui/icons-material';
import { getExerciseWeight, getExerciseTargetReps, setExerciseWeight, setExerciseTargetReps, saveFavoriteWorkout } from '../utils/storage';
import { EXERCISES_DATA_PATH } from '../utils/constants';
import ExerciseAutocomplete from './ExerciseAutocomplete';
import { calculateBarbellPerSide } from '../utils/weightUtils';
import { usePreferences } from '../contexts/PreferencesContext';
import LoadingScreen from './LoadingScreen';

/**
 * WorkoutPreview component displays a preview of the generated workout
 * Allows users to set starting weights and target reps before beginning
 * Memoized to prevent unnecessary re-renders
 */
const WorkoutPreview = memo(({ workout, workoutType, onStart, onCancel, onRandomizeExercise, isCustomizeMode = false, supersetConfig = [2, 2, 2, 2], setsPerSuperset: initialSetsPerSuperset = 3 }) => {
  const { preferences } = usePreferences();
  const [exerciseSettings, setExerciseSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [isStarting, setIsStarting] = useState(false); // New: prevent multiple rapid starts
  const [savedToFavorites, setSavedToFavorites] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [customizedSettings, setCustomizedSettings] = useState({});
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [availableExercises, setAvailableExercises] = useState([]);
  const [currentWorkout, setCurrentWorkout] = useState(workout);
  const [setsPerSuperset, setSetsPerSuperset] = useState(initialSetsPerSuperset);
  const [focusedExerciseIndex, setFocusedExerciseIndex] = useState(null); // Track focused exercise for animation
  
  // Check if exercises have individual sets configured (from builder)
  const hasIndividualSets = currentWorkout.some(ex => ex !== null && typeof ex.sets === 'number');

  // Load all exercises data - includes full library for comprehensive autocomplete
  useEffect(() => {
    const loadExercises = async () => {
      try {
        const response = await fetch(EXERCISES_DATA_PATH);
        const exercisesData = await response.json();
        
        // Load all exercises from the library for autocomplete
        // This ensures users can search and select any exercise from exercises.json
        setAvailableExercises(exercisesData);
      } catch (error) {
        console.error('Error loading exercises:', error);
        setAvailableExercises([]);
      }
    };
    loadExercises();
  }, []);

  // Load saved weights and target reps on mount
  useEffect(() => {
    // Scroll to top when component mounts
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    const loadSettings = async () => {
      const settings = {};
      
      // If in customize mode, initialize with the workout structure (which may contain nulls)
      if (isCustomizeMode) {
        // Set the current workout as-is (may contain null exercises)
        setCurrentWorkout(workout);
        setExerciseSettings({});
        setLoading(false);
        return;
      }
      
      // Otherwise load normal settings from workout (filter out any nulls)
      const validExercises = workout.filter(ex => ex !== null);
      for (const exercise of validExercises) {
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
      setCurrentWorkout(workout);
      setLoading(false);
    };
    loadSettings();
  }, [workout, isCustomizeMode, supersetConfig]);

  // Handle workout changes (e.g., from randomization) and preserve customized settings
  useEffect(() => {
    const updateNewExercises = async () => {
      const currentExerciseNames = Object.keys(exerciseSettings);
      
      // Filter out null exercises and find new exercises that need settings loaded
      const validExercises = workout.filter(ex => ex !== null);
      const newExercises = validExercises.filter(
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
    if (!newExercise) return;
    
    // Update the currentWorkout state with the new exercise
    setCurrentWorkout(prev => {
      const updated = [...prev];
      updated[globalIndex] = newExercise;
      return updated;
    });
    
    // Load settings for the new exercise if not already customized
    const exerciseName = newExercise['Exercise Name'];
    if (!customizedSettings[exerciseName]) {
      getExerciseWeight(exerciseName).then(weight => {
        getExerciseTargetReps(exerciseName).then(targetReps => {
          setExerciseSettings(prev => ({
            ...prev,
            [exerciseName]: {
              weight: weight ?? '',
              targetReps: targetReps ?? '',
            }
          }));
        });
      });
    }
  }, [customizedSettings]);

  const handleStartWorkout = async () => {
    // Prevent multiple rapid clicks
    if (isStarting) {
      return;
    }
    
    setIsStarting(true);
    
    try {
      // In customize mode, check if all exercises are selected
      if (isCustomizeMode) {
        const hasEmptySlots = currentWorkout.some(ex => ex === null);
        if (hasEmptySlots) {
          setSnackbar({
            open: true,
            message: 'Please select exercises for all slots before starting',
            severity: 'warning'
          });
          setIsStarting(false);
          return;
        }
      }
      
      // Save all settings before starting workout, storing null for empty strings
      // Save sequentially to avoid race conditions with localStorage reads/writes
      for (const [exerciseName, settings] of Object.entries(exerciseSettings)) {
        const weight = settings.weight === '' ? null : settings.weight;
        const targetReps = settings.targetReps === '' ? null : settings.targetReps;
        await setExerciseWeight(exerciseName, weight);
        await setExerciseTargetReps(exerciseName, targetReps);
      }
      onStart(currentWorkout, supersetConfig, setsPerSuperset);
    } catch (error) {
      console.error('Error starting workout:', error);
      setIsStarting(false);
    }
  };

  const handleSaveToFavorites = () => {
    try {
      // Filter out null exercises before saving
      const validExercises = currentWorkout.filter(ex => ex !== null);
      
      saveFavoriteWorkout({
        name: `${workoutType.charAt(0).toUpperCase() + workoutType.slice(1)} Body Workout`,
        type: workoutType,
        exercises: validExercises,
      });
      setSavedToFavorites(true);
      setShowNotification(true);
    } catch (error) {
      console.error('Error saving to favorites:', error);
    }
  };

  // Group exercises into supersets based on the supersetConfig
  const supersets = [];
  let exerciseIndex = 0;
  
  for (const supersetSize of supersetConfig) {
    const supersetExercises = [];
    for (let i = 0; i < supersetSize && exerciseIndex < currentWorkout.length; i++) {
      supersetExercises.push(currentWorkout[exerciseIndex]);
      exerciseIndex++;
    }
    if (supersetExercises.length > 0) {
      supersets.push(supersetExercises);
    }
  }

  if (loading) {
    return <LoadingScreen showLogo={false} />;
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
      {/* Compact Header - matching Progress screen style */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        py: 1,
        px: 2,
        borderBottom: '1px solid', 
        borderColor: 'divider',
        mb: 2,
      }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
          <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem' }}>
            {supersets.length} Supersets • {currentWorkout.filter(ex => ex !== null).length} Exercises
            {!hasIndividualSets && ` • ${setsPerSuperset} Sets Each`}
          </Typography>
        </Box>
        <IconButton
          onClick={handleSaveToFavorites}
          disabled={savedToFavorites}
          size="small"
          sx={{
            color: savedToFavorites ? 'warning.main' : 'action.active',
            '&:hover': {
              color: 'warning.main',
            },
          }}
          aria-label="Save to favorites"
        >
          {savedToFavorites ? <Star /> : <StarOutline />}
        </IconButton>
      </Box>
      
      <Box sx={{ mb: { xs: 2, sm: 3 }, px: { xs: 0.5, sm: 0 } }}>
        {/* Sets per superset control - only show if exercises don't have individual sets */}
        {!hasIndividualSets && (
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            gap: 1,
            mb: 1
          }}>
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
              Sets per superset:
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <IconButton
                size="small"
                onClick={() => setSetsPerSuperset(prev => Math.max(1, prev - 1))}
                disabled={setsPerSuperset <= 1}
                sx={{ 
                  minWidth: '32px',
                  minHeight: '32px',
                  bgcolor: 'action.hover',
                  '&:hover': { bgcolor: 'action.selected' }
                }}
              >
                <Remove fontSize="small" />
              </IconButton>
              <Typography 
                variant="h6" 
                sx={{ 
                  fontWeight: 700,
                  color: 'primary.main',
                  minWidth: '32px',
                  textAlign: 'center',
                  fontSize: { xs: '1rem', sm: '1.25rem' }
                }}
              >
                {setsPerSuperset}
              </Typography>
              <IconButton
                size="small"
                onClick={() => setSetsPerSuperset(prev => Math.min(10, prev + 1))}
                disabled={setsPerSuperset >= 10}
                sx={{ 
                  minWidth: '32px',
                  minHeight: '32px',
                  bgcolor: 'action.hover',
                  '&:hover': { bgcolor: 'action.selected' }
                }}
              >
                <Add fontSize="small" />
              </IconButton>
            </Box>
          </Box>
        )}
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
                bgcolor: 'background.paper',
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 2,
                transition: 'all 0.2s ease',
                maxWidth: '100%',
                boxSizing: 'border-box',
                boxShadow: 1,
                '&:hover': {
                  boxShadow: 2,
                }
              }}
            >
              <CardContent sx={{ p: { xs: 1.5, sm: 2 }, '&:last-child': { pb: { xs: 1.5, sm: 2 } } }}>
                <Box 
                  sx={{ 
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    mb: 1.5,
                    pb: 1,
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                  }}
                >
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      color: 'text.secondary',
                      fontWeight: 600,
                      fontSize: { xs: '0.75rem', sm: '0.875rem' }
                    }}
                  >
                    Superset {idx + 1}
                  </Typography>
                </Box>
                
                <Stack spacing={{ xs: 1, sm: 1.5 }}>
                  {superset.map((exercise, exerciseIdx) => {
                    const exerciseName = exercise ? exercise['Exercise Name'] : null;
                    const settings = exerciseName ? (exerciseSettings[exerciseName] || { weight: '', targetReps: '' }) : { weight: '', targetReps: '' };
                    // Calculate global index for this exercise
                    const globalIndex = supersets.slice(0, idx).reduce((sum, ss) => sum + ss.length, 0) + exerciseIdx;
                    // Use letters A, B, C, D, etc. based on position in superset
                    const exerciseLetter = String.fromCharCode(65 + exerciseIdx); // 65 is 'A' in ASCII
                    
                    return (
                      <Box 
                        key={exerciseIdx}
                        sx={{ 
                          position: 'relative',
                          p: { xs: 1, sm: 1.5 },
                          bgcolor: 'background.default',
                          borderRadius: 1.5,
                          transition: 'all 0.2s ease',
                          border: '1px solid',
                          borderColor: focusedExerciseIndex === globalIndex ? 'primary.main' : 'transparent',
                        }}
                        onFocus={() => setFocusedExerciseIndex(globalIndex)}
                        onBlur={() => setFocusedExerciseIndex(null)}
                      >
                        <Box sx={{ 
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: { xs: 1, sm: 1.5 },
                          mb: { xs: 1, sm: 1.5 }
                        }}>
                          <Typography 
                            sx={{ 
                              fontSize: { xs: '1rem', sm: '1.25rem' },
                              color: 'text.secondary',
                              fontWeight: 600,
                              width: { xs: '24px', sm: '32px' },
                              textAlign: 'center',
                              flexShrink: 0,
                            }}
                          >
                            {exerciseLetter}
                          </Typography>
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            {/* Exercise Autocomplete - Full Width */}
                            <Box sx={{ mb: 0.5 }}>
                              <ExerciseAutocomplete
                                value={exercise}
                                onChange={(event, newValue) => {
                                  if (newValue) {
                                    handleSwapExercise(globalIndex, newValue);
                                  }
                                }}
                                availableExercises={availableExercises}
                                label="Exercise"
                                placeholder={isCustomizeMode ? "Type to search and select..." : "Type to search and swap..."}
                                disabled={availableExercises.length === 0}
                              />
                            </Box>
                          </Box>
                        </Box>
                        {/* Weight and Reps Inputs - Only show if exercise is selected */}
                        {exercise && (
                          <>
                            <Stack 
                              direction="row" 
                              spacing={{ xs: 1, sm: 1.5 }} 
                              sx={{ 
                                pl: { xs: 4, sm: 5.5 },
                                flexWrap: { xs: 'wrap', sm: 'nowrap' },
                                mb: { xs: 1, sm: 1.5 }
                              }}
                            >
                          <TextField
                            type="tel"
                            inputMode="decimal"
                            value={settings.weight === '' ? '' : settings.weight}
                            onChange={(e) => handleWeightChange(exerciseName, e.target.value)}
                            onBlur={(e) => handleWeightBlur(exerciseName, e.target.value)}
                            onFocus={(e) => e.target.select()}
                            placeholder={exercise['Equipment']?.toLowerCase() === 'bodyweight' ? 'N/A' : 'Weight (lbs)'}
                            size="small"
                            disabled={exercise['Equipment']?.toLowerCase() === 'bodyweight'}
                            inputProps={{
                              min: 0,
                              max: 500,
                              step: 2.5,
                              pattern: '[0-9]*([.,][0-9]+)?',
                              'aria-label': `Target weight in pounds for ${exerciseName}`,
                            }}
                            sx={{ 
                              minWidth: { xs: 100, sm: 120 },
                              flex: { xs: '1 1 45%', sm: 'none' },
                              '& .MuiInputBase-input.Mui-disabled': {
                                WebkitTextFillColor: 'rgba(0, 0, 0, 0.38)',
                                backgroundColor: 'rgba(0, 0, 0, 0.04)',
                              }
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
                        {/* Display per-side weight for barbell exercises */}
                        {exercise['Equipment']?.toLowerCase() === 'barbell' && settings.weight && settings.weight > 0 && (
                          <Typography 
                            variant="caption" 
                            color="text.secondary" 
                            sx={{ 
                              pl: { xs: 4, sm: 5.5 },
                              fontStyle: 'italic',
                              fontSize: { xs: '0.65rem', sm: '0.75rem' }
                            }}
                          >
                            {(() => {
                              const perSide = calculateBarbellPerSide(settings.weight, preferences.barbellWeight || 45);
                              return perSide !== null && perSide >= 0
                                ? `${perSide} lbs per side`
                                : '';
                            })()}
                          </Typography>
                        )}
                        {/* Muscle, Equipment indicators and Randomize button - Below weight/reps */}
                        <Box sx={{ 
                          pl: { xs: 4, sm: 5.5 },
                          display: 'flex',
                          alignItems: 'center',
                          gap: 0.5,
                          flexWrap: 'wrap'
                        }}>
                          <Typography
                            variant="caption"
                            sx={{ 
                              color: 'text.secondary',
                              fontSize: { xs: '0.65rem', sm: '0.75rem' }
                            }}
                          >
                            {exercise['Primary Muscle']}
                          </Typography>
                          <Typography
                            variant="caption"
                            sx={{ 
                              color: 'text.disabled',
                              fontSize: { xs: '0.65rem', sm: '0.75rem' }
                            }}
                          >
                            •
                          </Typography>
                          <Typography
                            variant="caption"
                            sx={{ 
                              color: 'text.secondary',
                              fontSize: { xs: '0.65rem', sm: '0.75rem' }
                            }}
                          >
                            {exercise['Equipment']}
                          </Typography>
                          {typeof exercise.sets === 'number' && (
                            <>
                              <Typography
                                variant="caption"
                                sx={{ 
                                  color: 'text.disabled',
                                  fontSize: { xs: '0.65rem', sm: '0.75rem' }
                                }}
                              >
                                •
                              </Typography>
                              <Typography
                                variant="caption"
                                sx={{ 
                                  color: 'primary.main',
                                  fontWeight: 600,
                                  fontSize: { xs: '0.65rem', sm: '0.75rem' }
                                }}
                              >
                                {exercise.sets} Set{exercise.sets !== 1 ? 's' : ''}
                              </Typography>
                            </>
                          )}
                          {onRandomizeExercise && !isCustomizeMode && (
                            <IconButton
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRandomizeExercise(exercise, globalIndex);
                              }}
                              sx={{
                                color: 'text.secondary',
                                minWidth: '28px',
                                minHeight: '28px',
                                ml: 0.5,
                                '&:hover': {
                                  color: 'primary.main',
                                  backgroundColor: 'action.hover',
                                },
                              }}
                              aria-label={`Randomize ${exerciseName}`}
                            >
                              <Shuffle sx={{ fontSize: { xs: 16, sm: 18 } }} />
                            </IconButton>
                          )}
                        </Box>
                        </>
                        )}
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
            onClick={onCancel}
            sx={{
              borderRadius: 1.5,
              minWidth: { xs: '50px', sm: '60px' },
              px: { xs: 1.5, sm: 2 },
              py: 1,
              fontSize: { xs: '0.9rem', sm: '1rem' },
              fontWeight: 600,
              borderColor: 'divider',
              color: 'text.secondary',
              '&:hover': {
                borderColor: 'text.secondary',
                bgcolor: 'action.hover',
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
              borderRadius: 1.5,
              flex: 1,
              maxWidth: { xs: '110px', sm: '130px' },
              px: { xs: 1.5, sm: 2 },
              py: 1,
              fontSize: { xs: '0.85rem', sm: '0.95rem' },
              fontWeight: 600,
              borderColor: savedToFavorites ? 'success.main' : 'warning.main',
              color: savedToFavorites ? 'success.main' : 'warning.main',
              '&:hover': {
                borderColor: savedToFavorites ? 'success.dark' : 'warning.dark',
                bgcolor: 'action.hover',
              },
              '&.Mui-disabled': {
                borderColor: 'success.main',
                color: 'success.main',
                opacity: 0.7,
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
            disabled={isStarting}
            sx={{
              borderRadius: 1.5,
              flex: 1,
              maxWidth: { xs: '120px', sm: '140px' },
              px: { xs: 2, sm: 3 },
              py: 1,
              fontSize: { xs: '0.9rem', sm: '1rem' },
              fontWeight: 600,
              bgcolor: 'primary.main',
              color: 'white',
              '&:hover': {
                bgcolor: 'primary.dark',
              },
              '&.Mui-disabled': {
                bgcolor: 'primary.main',
                color: 'white',
                opacity: 0.6,
              },
            }}
          >
            {isStarting ? 'Starting...' : 'Begin'}
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
  isCustomizeMode: PropTypes.bool,
  supersetConfig: PropTypes.arrayOf(PropTypes.number),
  setsPerSuperset: PropTypes.number,
};

export default WorkoutPreview;
