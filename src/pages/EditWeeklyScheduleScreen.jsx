import { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { motion } from 'framer-motion';
import {
  Box,
  Typography,
  Tabs,
  Tab,
  Card,
  CardContent,
  Button,
  Stack,
  IconButton,
  Chip,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Snackbar,
  Alert,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from '@mui/material';
import {
  ArrowBack,
  Add,
  Remove,
  Delete,
  Save,
  HotelOutlined,
  Timer,
} from '@mui/icons-material';
import { useWeekScheduling } from '../contexts/WeekSchedulingContext';
import { EXERCISES_DATA_PATH } from '../utils/constants';
import ExerciseAutocomplete from '../components/ExerciseAutocomplete';
import SessionTypeQuickToggle from '../components/SessionTypeQuickToggle';
import { getExerciseWeight, getExerciseTargetReps, getSavedWorkouts } from '../utils/storage';
import { getDefaultSessionData } from '../utils/sessionTemplates';

// Days of the week constant - Sunday through Saturday
const DAYS_OF_WEEK = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

/**
 * EditWeeklyScheduleScreen - Dedicated screen for editing weekly workout schedules
 * Features day-of-week tabs, superset management, exercise editing, and timer configuration
 */
const EditWeeklyScheduleScreen = ({ onNavigate }) => {
  const { weeklySchedule, assignWorkoutToDay, loading } = useWeekScheduling();
  const [selectedDay, setSelectedDay] = useState('Sunday');
  const [dayWorkouts, setDayWorkouts] = useState({});
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState({});
  const [availableExercises, setAvailableExercises] = useState([]);
  const [savedWorkouts, setSavedWorkouts] = useState([]);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [pendingDayChange, setPendingDayChange] = useState(null);

  // Load exercises data and saved workouts
  useEffect(() => {
    const loadData = async () => {
      try {
        const [exercisesResponse, workouts] = await Promise.all([
          fetch(EXERCISES_DATA_PATH),
          getSavedWorkouts(),
        ]);
        const exercisesData = await exercisesResponse.json();
        setAvailableExercises(exercisesData);
        setSavedWorkouts(workouts || []);
      } catch (error) {
        console.error('Error loading data:', error);
        setAvailableExercises([]);
        setSavedWorkouts([]);
      }
    };
    loadData();
  }, []);

  // Transform raw exercises from saved workouts to the format expected by this editor
  const transformExercisesToEditorFormat = useCallback(async (exercises, supersetConfig = [2, 2, 2, 2]) => {
    if (!exercises || exercises.length === 0) return [];
    
    const transformed = [];
    let exerciseIndex = 0;
    let supersetGroup = 0;
    
    // Group exercises based on superset configuration
    for (const supersetSize of supersetConfig) {
      for (let i = 0; i < supersetSize && exerciseIndex < exercises.length; i++) {
        const exercise = exercises[exerciseIndex];
        
        // Check if exercise already has the editor format (has id and supersetGroup)
        if (exercise.id && exercise.supersetGroup !== undefined && exercise.sets) {
          transformed.push(exercise);
          exerciseIndex++;
          continue;
        }
        
        // Transform raw exercise to editor format
        const exerciseName = exercise['Exercise Name'] || exercise.exerciseName || exercise.name;
        
        // Load saved weight and reps for this exercise
        const [weight, targetReps] = await Promise.all([
          getExerciseWeight(exerciseName),
          getExerciseTargetReps(exerciseName),
        ]);
        
        const transformedExercise = {
          id: exercise.id || `ex_${Date.now()}_${exerciseIndex}_${Math.random().toString(36).substring(2, 9)}`,
          name: exerciseName,
          exerciseName: exerciseName,
          supersetGroup: supersetGroup,
          muscleGroup: exercise['Primary Muscle'] || exercise.muscleGroup || exercise.category,
          equipment: exercise.Equipment || exercise.equipment,
          category: exercise['Primary Muscle'] || exercise.muscleGroup || exercise.category,
          sets: exercise.sets || [
            { weight: weight || 0, reps: targetReps || 10 },
            { weight: weight || 0, reps: targetReps || 10 },
            { weight: weight || 0, reps: targetReps || 10 },
          ],
        };
        
        transformed.push(transformedExercise);
        exerciseIndex++;
      }
      supersetGroup++;
    }
    
    // Handle any remaining exercises that don't fit the superset config
    while (exerciseIndex < exercises.length) {
      const exercise = exercises[exerciseIndex];
      
      if (exercise.id && exercise.supersetGroup !== undefined && exercise.sets) {
        transformed.push(exercise);
        exerciseIndex++;
        continue;
      }
      
      const exerciseName = exercise['Exercise Name'] || exercise.exerciseName || exercise.name;
      const [weight, targetReps] = await Promise.all([
        getExerciseWeight(exerciseName),
        getExerciseTargetReps(exerciseName),
      ]);
      
      const transformedExercise = {
        id: exercise.id || `ex_${Date.now()}_${exerciseIndex}_${Math.random().toString(36).substring(2, 9)}`,
        name: exerciseName,
        exerciseName: exerciseName,
        supersetGroup: supersetGroup,
        muscleGroup: exercise['Primary Muscle'] || exercise.muscleGroup || exercise.category,
        equipment: exercise.Equipment || exercise.equipment,
        category: exercise['Primary Muscle'] || exercise.muscleGroup || exercise.category,
        sets: exercise.sets || [
          { weight: weight || 0, reps: targetReps || 10 },
          { weight: weight || 0, reps: targetReps || 10 },
          { weight: weight || 0, reps: targetReps || 10 },
        ],
      };
      
      transformed.push(transformedExercise);
      exerciseIndex++;
      supersetGroup++;
    }
    
    return transformed;
  }, []);

  // Initialize day workouts from context
  useEffect(() => {
    // Don't initialize while context is still loading
    if (loading) return;
    
    const initializeWorkouts = async () => {
      const initialWorkouts = {};
      
      for (const day of DAYS_OF_WEEK) {
        if (weeklySchedule[day]) {
          const dayData = JSON.parse(JSON.stringify(weeklySchedule[day]));
          
          // Transform exercises if this is a strength workout
          if (dayData.exercises && Array.isArray(dayData.exercises) && dayData.exercises.length > 0) {
            const supersetConfig = dayData.supersetConfig || [2, 2, 2, 2];
            dayData.exercises = await transformExercisesToEditorFormat(dayData.exercises, supersetConfig);
          }
          
          initialWorkouts[day] = dayData;
        } else {
          initialWorkouts[day] = null;
        }
      }
      
      setDayWorkouts(initialWorkouts);
    };
    
    initializeWorkouts();
  }, [weeklySchedule, loading, transformExercisesToEditorFormat]);

  // Get workout type from session data
  const getWorkoutType = (sessionData) => {
    if (!sessionData) return null;
    const type = sessionData.sessionType?.toLowerCase();
    return type;
  };

  // Check if workout type is strength-based
  const isStrengthWorkout = (type) => {
    if (!type) return false;
    const strengthTypes = ['full', 'upper', 'lower', 'push', 'pull', 'legs', 'core'];
    return strengthTypes.includes(type);
  };

  // Check if workout type is timer-based
  const isTimerWorkout = (type) => {
    if (!type) return false;
    const timerTypes = ['cardio', 'hiit', 'yoga', 'mobility', 'stretch'];
    return timerTypes.includes(type);
  };

  // Check if it's a rest day
  const isRestDay = (type) => {
    return type === 'rest';
  };

  // Handle day tab change
  const handleDayChange = (event, newDay) => {
    if (hasUnsavedChanges[selectedDay]) {
      setPendingDayChange(newDay);
      setConfirmDialogOpen(true);
    } else {
      setSelectedDay(newDay);
    }
  };

  // Confirm day change with unsaved changes
  const handleConfirmDayChange = () => {
    setConfirmDialogOpen(false);
    if (pendingDayChange) {
      setSelectedDay(pendingDayChange);
      setPendingDayChange(null);
    }
  };

  // Cancel day change
  const handleCancelDayChange = () => {
    setConfirmDialogOpen(false);
    setPendingDayChange(null);
  };

  // Add a new superset to the current day
  const handleAddSuperset = () => {
    const currentWorkout = dayWorkouts[selectedDay];
    if (!currentWorkout || !isStrengthWorkout(getWorkoutType(currentWorkout))) return;

    const exercises = currentWorkout.exercises || [];
    const maxGroup = exercises.length > 0 
      ? Math.max(...exercises.map(ex => ex.supersetGroup || 0))
      : -1;

    // Add two empty exercise slots for the new superset
    const newExercises = [
      ...exercises,
      {
        id: `ex_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        name: null,
        exerciseName: null,
        supersetGroup: maxGroup + 1,
        sets: [{ weight: 0, reps: 10 }, { weight: 0, reps: 10 }, { weight: 0, reps: 10 }],
      },
      {
        id: `ex_${Date.now() + 1}_${Math.random().toString(36).substring(2, 9)}`,
        name: null,
        exerciseName: null,
        supersetGroup: maxGroup + 1,
        sets: [{ weight: 0, reps: 10 }, { weight: 0, reps: 10 }, { weight: 0, reps: 10 }],
      },
    ];

    setDayWorkouts(prev => ({
      ...prev,
      [selectedDay]: {
        ...currentWorkout,
        exercises: newExercises,
      },
    }));
    setHasUnsavedChanges(prev => ({ ...prev, [selectedDay]: true }));
  };

  // Remove a superset
  const handleRemoveSuperset = (supersetGroup) => {
    const currentWorkout = dayWorkouts[selectedDay];
    if (!currentWorkout) return;

    const updatedExercises = currentWorkout.exercises.filter(
      ex => ex.supersetGroup !== supersetGroup
    );

    setDayWorkouts(prev => ({
      ...prev,
      [selectedDay]: {
        ...currentWorkout,
        exercises: updatedExercises,
      },
    }));
    setHasUnsavedChanges(prev => ({ ...prev, [selectedDay]: true }));
  };

  // Add exercise to a superset
  const handleAddExerciseToSuperset = (supersetGroup) => {
    const currentWorkout = dayWorkouts[selectedDay];
    if (!currentWorkout) return;

    const newExercise = {
      id: `ex_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      name: null,
      exerciseName: null,
      supersetGroup: supersetGroup,
      sets: [{ weight: 0, reps: 10 }, { weight: 0, reps: 10 }, { weight: 0, reps: 10 }],
    };

    setDayWorkouts(prev => ({
      ...prev,
      [selectedDay]: {
        ...currentWorkout,
        exercises: [...currentWorkout.exercises, newExercise],
      },
    }));
    setHasUnsavedChanges(prev => ({ ...prev, [selectedDay]: true }));
  };

  // Remove exercise from superset
  const handleRemoveExercise = (exerciseId) => {
    const currentWorkout = dayWorkouts[selectedDay];
    if (!currentWorkout) return;

    const updatedExercises = currentWorkout.exercises.filter(ex => ex.id !== exerciseId);

    setDayWorkouts(prev => ({
      ...prev,
      [selectedDay]: {
        ...currentWorkout,
        exercises: updatedExercises,
      },
    }));
    setHasUnsavedChanges(prev => ({ ...prev, [selectedDay]: true }));
  };

  // Handle exercise selection
  const handleExerciseSelect = useCallback(async (exerciseId, selectedExercise) => {
    const currentWorkout = dayWorkouts[selectedDay];
    if (!currentWorkout || !selectedExercise) return;

    const updatedExercises = currentWorkout.exercises.map(ex => {
      if (ex.id === exerciseId) {
        return {
          ...ex,
          name: selectedExercise['Exercise Name'],
          exerciseName: selectedExercise['Exercise Name'],
          muscleGroup: selectedExercise['Primary Muscle'] || selectedExercise['Muscle Group'],
          equipment: selectedExercise['Equipment'],
          category: selectedExercise['Primary Muscle'] || selectedExercise['Muscle Group'],
        };
      }
      return ex;
    });

    // Load default weight and reps for the selected exercise
    const exerciseName = selectedExercise['Exercise Name'];
    const [weight, targetReps] = await Promise.all([
      getExerciseWeight(exerciseName),
      getExerciseTargetReps(exerciseName),
    ]);

    // Update sets with loaded defaults
    const finalExercises = updatedExercises.map(ex => {
      if (ex.id === exerciseId) {
        return {
          ...ex,
          sets: ex.sets.map(set => ({
            weight: weight ?? set.weight,
            reps: targetReps ?? set.reps,
          })),
        };
      }
      return ex;
    });

    setDayWorkouts(prev => ({
      ...prev,
      [selectedDay]: {
        ...currentWorkout,
        exercises: finalExercises,
      },
    }));
    setHasUnsavedChanges(prev => ({ ...prev, [selectedDay]: true }));
  }, [dayWorkouts, selectedDay]);

  // Update exercise set values
  const handleUpdateSet = (exerciseId, setIndex, field, value) => {
    const currentWorkout = dayWorkouts[selectedDay];
    if (!currentWorkout) return;

    const updatedExercises = currentWorkout.exercises.map(ex => {
      if (ex.id === exerciseId) {
        const updatedSets = [...ex.sets];
        updatedSets[setIndex] = {
          ...updatedSets[setIndex],
          [field]: parseFloat(value) || 0,
        };
        return { ...ex, sets: updatedSets };
      }
      return ex;
    });

    setDayWorkouts(prev => ({
      ...prev,
      [selectedDay]: {
        ...currentWorkout,
        exercises: updatedExercises,
      },
    }));
    setHasUnsavedChanges(prev => ({ ...prev, [selectedDay]: true }));
  };

  // Update timer configuration
  const handleUpdateTimer = (field, value) => {
    const currentWorkout = dayWorkouts[selectedDay];
    if (!currentWorkout) return;

    setDayWorkouts(prev => ({
      ...prev,
      [selectedDay]: {
        ...currentWorkout,
        timerConfig: {
          ...currentWorkout.timerConfig,
          [field]: value,
        },
      },
    }));
    setHasUnsavedChanges(prev => ({ ...prev, [selectedDay]: true }));
  };

  // Handle session type change via quick toggle
  const handleSessionTypeChange = (newType) => {
    const currentWorkout = dayWorkouts[selectedDay];
    
    // For strength workouts, just set the type and let user select from saved workouts
    if (isStrengthWorkout(newType)) {
      if (!currentWorkout) {
        // Create placeholder for strength workout - user must select from saved workouts
        const newSessionData = {
          sessionType: newType,
          sessionName: `${newType.charAt(0).toUpperCase() + newType.slice(1)} Body Workout`,
          exercises: [],
          supersetConfig: [2, 2, 2, 2],
        };
        setDayWorkouts(prev => ({
          ...prev,
          [selectedDay]: newSessionData,
        }));
        setHasUnsavedChanges(prev => ({ ...prev, [selectedDay]: true }));
        setSnackbar({
          open: true,
          message: `Workout type set to ${newType}. Select a saved workout below to assign exercises.`,
          severity: 'info',
        });
      } else {
        // Update existing workout type but keep exercises if they exist
        setDayWorkouts(prev => ({
          ...prev,
          [selectedDay]: {
            ...currentWorkout,
            sessionType: newType,
            sessionName: `${newType.charAt(0).toUpperCase() + newType.slice(1)} Body Workout`,
          },
        }));
        setHasUnsavedChanges(prev => ({ ...prev, [selectedDay]: true }));
        setSnackbar({
          open: true,
          message: `Workout type changed to ${newType}`,
          severity: 'success',
        });
      }
      return;
    }

    // For non-strength workouts (timer-based, rest), use default data
    const newSessionData = getDefaultSessionData(newType);
    
    setDayWorkouts(prev => ({
      ...prev,
      [selectedDay]: newSessionData,
    }));
    setHasUnsavedChanges(prev => ({ ...prev, [selectedDay]: true }));
    
    setSnackbar({
      open: true,
      message: `Session type changed to ${newSessionData.sessionName}`,
      severity: 'success',
    });
  };

  // Handle selecting a saved workout
  const handleSelectSavedWorkout = async (workoutIndex) => {
    if (workoutIndex === null || workoutIndex === undefined || workoutIndex === '') return;
    
    const workout = savedWorkouts[workoutIndex];
    if (!workout) return;

    const currentWorkout = dayWorkouts[selectedDay];
    const currentType = getWorkoutType(currentWorkout);

    // Transform the saved workout exercises to editor format
    const transformedExercises = await transformExercisesToEditorFormat(
      workout.exercises,
      workout.supersetConfig || [2, 2, 2, 2]
    );

    // Create updated workout data with the selected workout's exercises
    const updatedWorkout = {
      sessionType: currentType || workout.type || 'full',
      sessionName: workout.name || `${(currentType || workout.type || 'full').charAt(0).toUpperCase() + (currentType || workout.type || 'full').slice(1)} Body Workout`,
      exercises: transformedExercises,
      supersetConfig: workout.supersetConfig || [2, 2, 2, 2],
    };

    setDayWorkouts(prev => ({
      ...prev,
      [selectedDay]: updatedWorkout,
    }));
    setHasUnsavedChanges(prev => ({ ...prev, [selectedDay]: true }));
    
    setSnackbar({
      open: true,
      message: `Loaded workout: ${workout.name}`,
      severity: 'success',
    });
  };

  // Save all changes
  const handleSaveAll = async () => {
    try {
      // Save all days with unsaved changes
      for (const day of DAYS_OF_WEEK) {
        if (hasUnsavedChanges[day]) {
          const workout = dayWorkouts[day];
          
          // Calculate superset configuration from exercises if this is a strength workout
          if (workout && workout.exercises && Array.isArray(workout.exercises)) {
            const supersetGroups = {};
            workout.exercises.forEach(ex => {
              const group = ex.supersetGroup ?? 0;
              supersetGroups[group] = (supersetGroups[group] || 0) + 1;
            });
            
            // Convert to array format [2, 2, 2, 2] etc.
            const supersetConfig = Object.keys(supersetGroups)
              .sort((a, b) => parseInt(a) - parseInt(b))
              .map(key => supersetGroups[key]);
            
            workout.supersetConfig = supersetConfig.length > 0 ? supersetConfig : [2, 2, 2, 2];
          }
          
          await assignWorkoutToDay(day, workout);
        }
      }

      setHasUnsavedChanges({});
      setSnackbar({
        open: true,
        message: 'All changes saved successfully!',
        severity: 'success',
      });
    } catch (error) {
      console.error('Error saving changes:', error);
      setSnackbar({
        open: true,
        message: 'Failed to save changes. Please try again.',
        severity: 'error',
      });
    }
  };

  // Discard all changes
  const handleDiscardChanges = () => {
    const initialWorkouts = {};
    DAYS_OF_WEEK.forEach(day => {
      if (weeklySchedule[day]) {
        initialWorkouts[day] = JSON.parse(JSON.stringify(weeklySchedule[day]));
      } else {
        initialWorkouts[day] = null;
      }
    });
    setDayWorkouts(initialWorkouts);
    setHasUnsavedChanges({});
    setSnackbar({
      open: true,
      message: 'All changes discarded',
      severity: 'info',
    });
  };

  // Group exercises by superset
  const groupExercisesBySuperset = (exercises) => {
    if (!exercises || exercises.length === 0) return [];
    
    const groups = {};
    exercises.forEach(ex => {
      const group = ex.supersetGroup ?? 0;
      if (!groups[group]) {
        groups[group] = [];
      }
      groups[group].push(ex);
    });

    return Object.entries(groups).sort(([a], [b]) => parseInt(a) - parseInt(b));
  };

  const currentWorkout = dayWorkouts[selectedDay];
  const workoutType = getWorkoutType(currentWorkout);
  const isStrength = isStrengthWorkout(workoutType);
  const isTimer = isTimerWorkout(workoutType);
  const isRest = isRestDay(workoutType);

  const hasAnyUnsavedChanges = Object.values(hasUnsavedChanges).some(v => v);

  // Show loading state while context is loading
  if (loading) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          padding: { xs: 2, sm: 3 },
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Typography variant="h6" color="text.secondary">
          Loading schedule...
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        padding: { xs: 2, sm: 3 },
        paddingBottom: { xs: '80px', sm: 3 },
        background: (theme) => theme.palette.background.default,
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Header */}
        <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
          <IconButton onClick={() => onNavigate?.('settings')} sx={{ color: 'primary.main' }}>
            <ArrowBack />
          </IconButton>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h4" sx={{ fontWeight: 700, color: 'text.primary' }}>
              Edit Weekly Schedule
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Customize your workouts for each day of the week
            </Typography>
          </Box>
          {hasAnyUnsavedChanges && (
            <Chip
              label="Unsaved Changes"
              color="warning"
              size="small"
              sx={{ display: { xs: 'none', sm: 'flex' } }}
            />
          )}
        </Box>

        {/* Day Tabs */}
        <Card sx={{ mb: 3 }}>
          <Tabs
            value={selectedDay}
            onChange={handleDayChange}
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              borderBottom: 1,
              borderColor: 'divider',
              '& .MuiTab-root': {
                minWidth: { xs: 80, sm: 100 },
              },
            }}
          >
            {DAYS_OF_WEEK.map(day => (
              <Tab
                key={day}
                value={day}
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    {day.substring(0, 3)}
                    {hasUnsavedChanges[day] && (
                      <Box
                        sx={{
                          width: 6,
                          height: 6,
                          borderRadius: '50%',
                          bgcolor: 'warning.main',
                        }}
                      />
                    )}
                  </Box>
                }
              />
            ))}
          </Tabs>
        </Card>

        {/* Content Area */}
        <Box sx={{ maxWidth: 900, mx: 'auto' }}>
          {/* Quick Toggle for Session Type - shown when a workout exists */}
          {currentWorkout && (
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  💡 This sets the <strong>suggested workout type</strong> for the day. 
                  {isStrength && ' For strength workouts, select a saved workout below to assign exercises.'}
                </Typography>
                <SessionTypeQuickToggle
                  currentType={workoutType || 'full'}
                  onChange={handleSessionTypeChange}
                  compact={true}
                />
              </CardContent>
            </Card>
          )}

          {/* Saved Workout Selector - shown for strength workouts */}
          {currentWorkout && isStrength && (
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <FormControl fullWidth>
                  <InputLabel>Select Saved Workout</InputLabel>
                  <Select
                    value=""
                    label="Select Saved Workout"
                    onChange={(e) => handleSelectSavedWorkout(e.target.value)}
                    displayEmpty
                  >
                    <MenuItem value="" disabled>
                      Choose a workout to load exercises...
                    </MenuItem>
                    {savedWorkouts.map((workout, index) => (
                      <MenuItem key={index} value={index}>
                        {workout.name || `${workout.type || 'Custom'} Workout`} 
                        {' '}({workout.exercises?.length || 0} exercises)
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                {savedWorkouts.length === 0 && (
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                    No saved workouts available. Create one from the Work tab.
                  </Typography>
                )}
              </CardContent>
            </Card>
          )}

          {!currentWorkout && (
            <Card sx={{ p: 4, textAlign: 'center' }}>
              <Typography variant="h6" color="text.secondary">
                No workout assigned for {selectedDay}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1, mb: 2 }}>
                Select a workout type below to get started
              </Typography>
              <Alert severity="info" sx={{ mb: 3, textAlign: 'left' }}>
                <Typography variant="body2">
                  💡 <strong>Note:</strong> Selecting a workout type sets the suggested type for the day. 
                  For strength workouts, you'll need to select a saved workout to assign specific exercises.
                </Typography>
              </Alert>
              <Box sx={{ mt: 3, maxWidth: 600, mx: 'auto' }}>
                <SessionTypeQuickToggle
                  currentType="full"
                  onChange={handleSessionTypeChange}
                  compact={false}
                />
              </Box>
            </Card>
          )}

          {/* Rest Day */}
          {isRest && (
            <Card sx={{ p: 6, textAlign: 'center' }}>
              <HotelOutlined sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h4" sx={{ fontWeight: 700, color: 'text.primary' }}>
                Rest Day
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mt: 2 }}>
                Take a break and recover. Your body needs rest to grow stronger!
              </Typography>
            </Card>
          )}

          {/* Timer-based Workouts (Yoga, Cardio, etc.) */}
          {isTimer && (
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                  <Timer sx={{ fontSize: 40, color: 'primary.main' }} />
                  <Box>
                    <Typography variant="h5" sx={{ fontWeight: 700 }}>
                      Timer Configuration
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Set duration for your {currentWorkout.sessionName || workoutType} session
                    </Typography>
                  </Box>
                </Box>

                <Stack spacing={3}>
                  <FormControl fullWidth>
                    <InputLabel>Duration (minutes)</InputLabel>
                    <Select
                      value={currentWorkout.timerConfig?.duration || 30}
                      label="Duration (minutes)"
                      onChange={(e) => handleUpdateTimer('duration', e.target.value)}
                    >
                      <MenuItem value={15}>15 minutes</MenuItem>
                      <MenuItem value={20}>20 minutes</MenuItem>
                      <MenuItem value={30}>30 minutes</MenuItem>
                      <MenuItem value={45}>45 minutes</MenuItem>
                      <MenuItem value={60}>60 minutes</MenuItem>
                    </Select>
                  </FormControl>

                  <FormControl fullWidth>
                    <InputLabel>Intensity</InputLabel>
                    <Select
                      value={currentWorkout.timerConfig?.intensity || 'moderate'}
                      label="Intensity"
                      onChange={(e) => handleUpdateTimer('intensity', e.target.value)}
                    >
                      <MenuItem value="light">Light</MenuItem>
                      <MenuItem value="moderate">Moderate</MenuItem>
                      <MenuItem value="vigorous">Vigorous</MenuItem>
                    </Select>
                  </FormControl>

                  <TextField
                    label="Notes (optional)"
                    multiline
                    rows={3}
                    value={currentWorkout.timerConfig?.notes || ''}
                    onChange={(e) => handleUpdateTimer('notes', e.target.value)}
                    placeholder="Add any notes or goals for this session..."
                  />
                </Stack>
              </CardContent>
            </Card>
          )}

          {/* Strength Workouts */}
          {isStrength && (
            <Stack spacing={3}>
              {/* Add Superset Button */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Supersets
                </Typography>
                <Button
                  variant="outlined"
                  startIcon={<Add />}
                  onClick={handleAddSuperset}
                  size="small"
                >
                  Add Superset
                </Button>
              </Box>

              {/* Superset List */}
              {groupExercisesBySuperset(currentWorkout.exercises).map(([groupId, exercises], idx) => (
                <Card key={groupId} sx={{ borderLeft: 3, borderColor: 'primary.main' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Chip
                        label={`Superset ${idx + 1}`}
                        color="primary"
                        size="small"
                      />
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => handleAddExerciseToSuperset(parseInt(groupId))}
                          title="Add exercise to this superset"
                        >
                          <Add fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleRemoveSuperset(parseInt(groupId))}
                          title="Remove this superset"
                        >
                          <Delete fontSize="small" />
                        </IconButton>
                      </Box>
                    </Box>

                    <Stack spacing={2}>
                      {exercises.map((exercise, exIdx) => (
                        <Box key={exercise.id}>
                          {exIdx > 0 && <Divider sx={{ my: 1 }} />}
                          <Box>
                            {/* Exercise Selection */}
                            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 2 }}>
                              <Typography
                                sx={{
                                  fontSize: '1.5rem',
                                  color: 'primary.main',
                                  fontWeight: 700,
                                  width: '32px',
                                  textAlign: 'center',
                                  flexShrink: 0,
                                }}
                              >
                                {String.fromCharCode(65 + exIdx)}
                              </Typography>
                              <Box sx={{ flex: 1 }}>
                                <ExerciseAutocomplete
                                  value={exercise.name ? availableExercises.find(ex => ex['Exercise Name'] === exercise.name) : null}
                                  onChange={(event, newValue) => handleExerciseSelect(exercise.id, newValue)}
                                  availableExercises={availableExercises}
                                  label="Exercise"
                                  placeholder="Select exercise..."
                                  disabled={availableExercises.length === 0}
                                />
                              </Box>
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => handleRemoveExercise(exercise.id)}
                                sx={{ mt: 0.5 }}
                              >
                                <Remove fontSize="small" />
                              </IconButton>
                            </Box>

                            {/* Sets - Only show if exercise is selected */}
                            {exercise.name && (
                              <Box sx={{ pl: 5 }}>
                                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                                  Sets
                                </Typography>
                                <Stack spacing={1}>
                                  {exercise.sets?.map((set, setIdx) => (
                                    <Box
                                      key={setIdx}
                                      sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 1,
                                      }}
                                    >
                                      <Typography
                                        variant="body2"
                                        sx={{ minWidth: 50, fontWeight: 500 }}
                                      >
                                        Set {setIdx + 1}
                                      </Typography>
                                      <TextField
                                        type="number"
                                        label="Weight (lbs)"
                                        value={set.weight}
                                        onChange={(e) => handleUpdateSet(exercise.id, setIdx, 'weight', e.target.value)}
                                        size="small"
                                        sx={{ width: 120 }}
                                        disabled={exercise.equipment?.toLowerCase() === 'bodyweight'}
                                      />
                                      <TextField
                                        type="number"
                                        label="Reps"
                                        value={set.reps}
                                        onChange={(e) => handleUpdateSet(exercise.id, setIdx, 'reps', e.target.value)}
                                        size="small"
                                        sx={{ width: 100 }}
                                      />
                                    </Box>
                                  ))}
                                </Stack>
                              </Box>
                            )}
                          </Box>
                        </Box>
                      ))}
                    </Stack>
                  </CardContent>
                </Card>
              ))}

              {(!currentWorkout.exercises || currentWorkout.exercises.length === 0) && (
                <Card sx={{ p: 4, textAlign: 'center' }}>
                  <Typography variant="body1" color="text.secondary">
                    No exercises in this workout. Click &quot;Add Superset&quot; to get started.
                  </Typography>
                </Card>
              )}
            </Stack>
          )}

          {/* Action Buttons */}
          {currentWorkout && !isRest && (
            <Box sx={{ mt: 4, display: 'flex', gap: 2, justifyContent: 'center' }}>
              <Button
                variant="outlined"
                onClick={handleDiscardChanges}
                disabled={!hasAnyUnsavedChanges}
              >
                Discard Changes
              </Button>
              <Button
                variant="contained"
                startIcon={<Save />}
                onClick={handleSaveAll}
                disabled={!hasAnyUnsavedChanges}
              >
                Save All Changes
              </Button>
            </Box>
          )}
        </Box>
      </motion.div>

      {/* Confirm Dialog for unsaved changes */}
      <Dialog open={confirmDialogOpen} onClose={handleCancelDayChange}>
        <DialogTitle>Unsaved Changes</DialogTitle>
        <DialogContent>
          <DialogContentText>
            You have unsaved changes for {selectedDay}. These changes will be kept when you switch days,
            but they won&apos;t be saved until you click &quot;Save All Changes&quot;.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelDayChange}>Cancel</Button>
          <Button onClick={handleConfirmDayChange} variant="contained">
            Continue
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

EditWeeklyScheduleScreen.propTypes = {
  onNavigate: PropTypes.func,
};

export default EditWeeklyScheduleScreen;
