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
  FitnessCenter,
} from '@mui/icons-material';
import { useWeekScheduling } from '../contexts/WeekSchedulingContext';
import SessionTypeQuickToggle from '../components/SessionTypeQuickToggle';
import { getSavedWorkouts } from '../utils/storage';
import { getDefaultSessionData } from '../utils/sessionTemplates';
import LoadingScreen from '../components/LoadingScreen';

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
 * EditWeeklyScheduleScreen - Minimalist screen for editing weekly workout schedules
 * Features:
 * - Day-of-week tabs for navigation
 * - Session type selection (strength, cardio, yoga, etc.)
 * - Saved workout assignment for strength sessions
 * - Simple assignment interface - no exercise editing
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

  // Load saved workouts
  useEffect(() => {
    const loadData = async () => {
      try {
        const workouts = await getSavedWorkouts();
        setSavedWorkouts(workouts || []);
      } catch (error) {
        console.error('Error loading data:', error);
        setSavedWorkouts([]);
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

  // Removed: Timer configuration - no longer needed for simplified schedule

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
    // Include isSavedWorkout flag for synchronicity with TodaysWorkoutSection
    const updatedWorkout = {
      sessionType: currentType || workout.type || 'full',
      sessionName: workout.name || `${(currentType || workout.type || 'full').charAt(0).toUpperCase() + (currentType || workout.type || 'full').slice(1)} Body Workout`,
      exercises: workout.exercises,
      supersetConfig: workout.supersetConfig || [2, 2, 2, 2],
      workoutId: workout.id,
      isSavedWorkout: true, // Flag for TodaysWorkoutSection to identify saved workouts
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
    return <LoadingScreen />;
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
              Assign sessions to each day of your week
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
          {/* Session Type Selection */}
          {currentWorkout && (
            <Card sx={{ mb: 2, bgcolor: 'background.paper' }}>
              <CardContent sx={{ p: 2 }}>
                <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 600, color: 'text.secondary' }}>
                  Session Type
                </Typography>
                <SessionTypeQuickToggle
                  currentType={workoutType || 'full'}
                  onChange={handleSessionTypeChange}
                  compact={true}
                />
                {isStrength && (
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1.5, display: 'block' }}>
                    Select a saved workout below
                  </Typography>
                )}
              </CardContent>
            </Card>
          )}

          {/* Saved Workout Selector - shown for strength workouts */}
          {currentWorkout && isStrength && (
            <Card sx={{ mb: 2, bgcolor: 'background.paper' }}>
              <CardContent sx={{ p: 2 }}>
                <FormControl fullWidth size="small">
                  <InputLabel shrink sx={{ backgroundColor: (theme) => theme.palette.background.paper, px: 0.5 }}>
                    Saved Workout
                  </InputLabel>
                  <Select
                    value=""
                    label="Saved Workout"
                    onChange={(e) => handleSelectSavedWorkout(e.target.value)}
                    displayEmpty
                    notched
                    size="small"
                  >
                    <MenuItem value="" disabled>
                      Choose a workout...
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
                    No saved workouts. Create one from the Work tab.
                  </Typography>
                )}
              </CardContent>
            </Card>
          )}

          {!currentWorkout && (
            <Card sx={{ p: 3, textAlign: 'center', bgcolor: 'background.paper' }}>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                No session assigned for {selectedDay}
              </Typography>
              <Box sx={{ mt: 2, maxWidth: 600, mx: 'auto' }}>
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
            <Card sx={{ p: 4, textAlign: 'center', bgcolor: 'background.paper' }}>
              <HotelOutlined sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h5" sx={{ fontWeight: 600, color: 'text.primary' }}>
                Rest Day
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Recovery is essential for growth
              </Typography>
            </Card>
          )}

          {/* Strength Workouts - Minimalist Summary */}
          {isStrength && (
            <Stack spacing={2}>
              {/* Workout Summary */}
              {currentWorkout.exercises && currentWorkout.exercises.length > 0 ? (
                <Card 
                  sx={{ 
                    p: 2.5, 
                    textAlign: 'center',
                    bgcolor: 'background.paper',
                    border: '1px solid',
                    borderColor: 'divider',
                  }}
                >
                  <FitnessCenter sx={{ fontSize: 40, color: 'primary.main', mb: 1.5 }} />
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
                    {currentWorkout.sessionName}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                    {currentWorkout.exercises.length} exercises
                  </Typography>
                  <Chip 
                    label={`${currentWorkout.sessionType?.toUpperCase() || 'FULL'} BODY`}
                    color="primary"
                    size="small"
                    sx={{ fontWeight: 600, fontSize: '0.7rem' }}
                  />
                </Card>
              ) : (
                <Card sx={{ p: 3, textAlign: 'center', bgcolor: 'background.paper' }}>
                  <Typography variant="body2" color="text.secondary">
                    Select a saved workout above
                  </Typography>
                </Card>
              )}
            </Stack>
          )}

          {/* Action Buttons */}
          {currentWorkout && !isRest && (
            <Box sx={{ mt: 3, display: 'flex', gap: 1.5, justifyContent: 'center' }}>
              <Button
                variant="outlined"
                onClick={handleDiscardChanges}
                disabled={!hasAnyUnsavedChanges}
                size="medium"
              >
                Discard
              </Button>
              <Button
                variant="contained"
                startIcon={<Save />}
                onClick={handleSaveAll}
                disabled={!hasAnyUnsavedChanges}
                size="medium"
              >
                Save Changes
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
