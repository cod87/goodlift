import { useState, useEffect } from 'react';
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from '@mui/material';
import {
  ArrowBack,
  Save,
  HotelOutlined,
  Timer,
  Edit,
} from '@mui/icons-material';
import { useWeekScheduling } from '../contexts/WeekSchedulingContext';
import SessionTypeQuickToggle from '../components/SessionTypeQuickToggle';
import { getSavedWorkouts, updateSavedWorkout } from '../utils/storage';
import { getDefaultSessionData } from '../utils/sessionTemplates';
import WorkoutCreationModal from '../components/WorkTabs/WorkoutCreationModal';
import { EXERCISES_DATA_PATH } from '../utils/constants';

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
  const [savedWorkouts, setSavedWorkouts] = useState([]);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [pendingDayChange, setPendingDayChange] = useState(null);
  
  // Workout editor modal state
  const [showWorkoutEditor, setShowWorkoutEditor] = useState(false);
  const [editingWorkout, setEditingWorkout] = useState(null);
  const [editingWorkoutIndex, setEditingWorkoutIndex] = useState(null);
  const [availableExercises, setAvailableExercises] = useState([]);

  // Load saved workouts and exercises
  useEffect(() => {
    const loadData = async () => {
      try {
        const [workouts, exercisesResponse] = await Promise.all([
          getSavedWorkouts(),
          fetch(EXERCISES_DATA_PATH),
        ]);
        const exercisesData = await exercisesResponse.json();
        setSavedWorkouts(workouts || []);
        setAvailableExercises(exercisesData);
      } catch (error) {
        console.error('Error loading data:', error);
        setSavedWorkouts([]);
        setAvailableExercises([]);
      }
    };
    loadData();
  }, []);

  // Initialize day workouts from context
  useEffect(() => {
    // Don't initialize while context is still loading
    if (loading) return;
    
    const initialWorkouts = {};
    
    for (const day of DAYS_OF_WEEK) {
      if (weeklySchedule[day]) {
        initialWorkouts[day] = JSON.parse(JSON.stringify(weeklySchedule[day]));
      } else {
        initialWorkouts[day] = null;
      }
    }
    
    setDayWorkouts(initialWorkouts);
  }, [weeklySchedule, loading]);

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

    // Create updated workout data with the selected workout's exercises
    const updatedWorkout = {
      sessionType: currentType || workout.type || 'full',
      sessionName: workout.name || `${(currentType || workout.type || 'full').charAt(0).toUpperCase() + (currentType || workout.type || 'full').slice(1)} Body Workout`,
      exercises: workout.exercises,
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

  // Handle editing the currently assigned workout for the selected day
  const handleEditCurrentWorkout = () => {
    const currentWorkout = dayWorkouts[selectedDay];
    if (!currentWorkout || !currentWorkout.exercises) return;

    // Find the workout in savedWorkouts by matching exercises
    const workoutIndex = savedWorkouts.findIndex(sw => 
      sw.exercises === currentWorkout.exercises ||
      JSON.stringify(sw.exercises) === JSON.stringify(currentWorkout.exercises)
    );

    if (workoutIndex >= 0) {
      setEditingWorkout(savedWorkouts[workoutIndex]);
      setEditingWorkoutIndex(workoutIndex);
      setShowWorkoutEditor(true);
    } else {
      // If not found in saved workouts, create a temporary workout object to edit
      setEditingWorkout({
        name: currentWorkout.sessionName || 'Custom Workout',
        type: currentWorkout.sessionType || 'full',
        exercises: currentWorkout.exercises,
        supersetConfig: currentWorkout.supersetConfig || [2, 2, 2, 2],
      });
      setEditingWorkoutIndex(null); // null means it's not saved yet
      setShowWorkoutEditor(true);
    }
  };

  // Handle saving edited workout
  const handleSaveEditedWorkout = async (workout) => {
    try {
      if (editingWorkoutIndex !== null) {
        // Update existing saved workout
        await updateSavedWorkout(editingWorkoutIndex, workout);
        
        // Refresh saved workouts list
        const workouts = await getSavedWorkouts();
        setSavedWorkouts(workouts || []);
        
        // Update the day's workout with the edited version
        const currentWorkout = dayWorkouts[selectedDay];
        if (currentWorkout) {
          setDayWorkouts(prev => ({
            ...prev,
            [selectedDay]: {
              ...currentWorkout,
              exercises: workout.exercises,
              supersetConfig: workout.supersetConfig || [2, 2, 2, 2],
              sessionName: workout.name,
            },
          }));
          setHasUnsavedChanges(prev => ({ ...prev, [selectedDay]: true }));
        }
        
        setSnackbar({
          open: true,
          message: 'Workout updated successfully',
          severity: 'success',
        });
      }
      
      setShowWorkoutEditor(false);
      setEditingWorkout(null);
      setEditingWorkoutIndex(null);
    } catch (error) {
      console.error('Error saving workout:', error);
      setSnackbar({
        open: true,
        message: 'Failed to save workout changes',
        severity: 'error',
      });
    }
  };

  // Handle closing workout editor
  const handleCloseWorkoutEditor = () => {
    setShowWorkoutEditor(false);
    setEditingWorkout(null);
    setEditingWorkoutIndex(null);
  };

  // Save all changes
  const handleSaveAll = async () => {
    try {
      // Validate that all strength workouts have exercises assigned
      const invalidDays = [];
      for (const day of DAYS_OF_WEEK) {
        const workout = dayWorkouts[day];
        if (workout) {
          const type = getWorkoutType(workout);
          if (isStrengthWorkout(type)) {
            // Check if workout has exercises
            if (!workout.exercises || workout.exercises.length === 0) {
              invalidDays.push(day);
            }
          }
        }
      }

      // If there are invalid days, show error and return
      if (invalidDays.length > 0) {
        setSnackbar({
          open: true,
          message: `Please select a saved workout for strength sessions on: ${invalidDays.join(', ')}`,
          severity: 'error',
        });
        return;
      }

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
                  <InputLabel shrink sx={{ backgroundColor: (theme) => theme.palette.background.paper, px: 1 }}>
                    Select Saved Workout
                  </InputLabel>
                  <Select
                    value=""
                    label="Select Saved Workout"
                    onChange={(e) => handleSelectSavedWorkout(e.target.value)}
                    displayEmpty
                    notched
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

          {/* Strength Workouts - Exercise List (Read-only) */}
          {isStrength && (
            <Stack spacing={3}>
              {/* Exercise List Header with Edit Button */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Exercises
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    Exercises from the selected saved workout
                  </Typography>
                </Box>
                {currentWorkout.exercises && currentWorkout.exercises.length > 0 && (
                  <Button
                    variant="outlined"
                    startIcon={<Edit />}
                    onClick={handleEditCurrentWorkout}
                    size="small"
                  >
                    Edit Workout
                  </Button>
                )}
              </Box>

              {/* Exercise List */}
              {currentWorkout.exercises && currentWorkout.exercises.length > 0 ? (
                currentWorkout.exercises.map((exercise, idx) => (
                  <Card key={exercise.id || idx} sx={{ borderLeft: 3, borderColor: 'primary.main' }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                        <Typography
                          sx={{
                            fontSize: '1.25rem',
                            color: 'primary.main',
                            fontWeight: 700,
                            minWidth: '32px',
                            textAlign: 'center',
                          }}
                        >
                          {idx + 1}
                        </Typography>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="h6" sx={{ fontWeight: 600 }}>
                            {exercise.name || exercise.exerciseName || 'Unnamed Exercise'}
                          </Typography>
                          {exercise.muscleGroup && (
                            <Typography variant="body2" color="text.secondary">
                              {exercise.muscleGroup}
                            </Typography>
                          )}
                        </Box>
                      </Box>

                      {/* Sets Display */}
                      {exercise.sets && exercise.sets.length > 0 && (
                        <Box sx={{ pl: 5, mt: 2 }}>
                          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                            Sets: {exercise.sets.length} × {exercise.sets[0]?.reps || 0} reps 
                            {exercise.sets[0]?.weight > 0 ? ` @ ${exercise.sets[0].weight} lbs` : ''}
                          </Typography>
                        </Box>
                      )}
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Card sx={{ p: 4, textAlign: 'center' }}>
                  <Typography variant="body1" color="text.secondary">
                    No exercises in this workout. Select a saved workout above to assign exercises.
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

      {/* Workout Editor Modal */}
      <WorkoutCreationModal
        open={showWorkoutEditor}
        onClose={handleCloseWorkoutEditor}
        onSave={handleSaveEditedWorkout}
        exercises={availableExercises}
        existingWorkout={editingWorkout}
      />
    </Box>
  );
};

EditWeeklyScheduleScreen.propTypes = {
  onNavigate: PropTypes.func,
};

export default EditWeeklyScheduleScreen;
