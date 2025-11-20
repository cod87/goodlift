import { memo, useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { 
  Box, 
  Card, 
  CardContent, 
  Typography, 
  Button, 
  Stack,
  IconButton,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemButton,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import { 
  Add,
  MoreVert,
  CalendarMonth,
} from '@mui/icons-material';
import { getSavedWorkouts, deleteSavedWorkout, updateSavedWorkout } from '../../utils/storage';
import { useWeekScheduling } from '../../contexts/WeekSchedulingContext';

// Days of the week in order
const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/**
 * SavedWorkoutsList - Display list of saved workouts
 * Features:
 * - List of saved workouts with basic info
 * - Create new workout button
 * - Options to edit/delete saved workouts
 * - Assign workouts to specific days of the week
 */
const SavedWorkoutsList = memo(({ 
  onCreateWorkout,
  onStartWorkout,
  onEditWorkout, // Add edit callback
}) => {
  const { assignWorkoutToDay } = useWeekScheduling();
  const [savedWorkouts, setSavedWorkouts] = useState([]);
  const [menuAnchorEl, setMenuAnchorEl] = useState(null);
  const [selectedWorkoutIndex, setSelectedWorkoutIndex] = useState(null);
  const [dayPickerOpen, setDayPickerOpen] = useState(false);
  const [selectedWorkoutForDay, setSelectedWorkoutForDay] = useState(null);

  // Load saved workouts
  useEffect(() => {
    const loadSavedWorkouts = async () => {
      try {
        const workouts = await getSavedWorkouts();
        setSavedWorkouts(workouts || []);
      } catch (error) {
        console.error('Error loading saved workouts:', error);
        setSavedWorkouts([]);
      }
    };
    
    loadSavedWorkouts();
  }, []);

  // Sort workouts: assigned workouts first (Sunday-Saturday order), then unassigned
  const sortedWorkouts = [...savedWorkouts].sort((a, b) => {
    const aDay = a.assignedDay;
    const bDay = b.assignedDay;
    
    // Both assigned - sort by day of week
    if (aDay && bDay) {
      return DAYS_OF_WEEK.indexOf(aDay) - DAYS_OF_WEEK.indexOf(bDay);
    }
    
    // Only a assigned - a comes first
    if (aDay && !bDay) return -1;
    
    // Only b assigned - b comes first
    if (!aDay && bDay) return 1;
    
    // Neither assigned - maintain original order
    return 0;
  });

  const handleMenuOpen = (event, index) => {
    event.stopPropagation();
    setMenuAnchorEl(event.currentTarget);
    setSelectedWorkoutIndex(index);
  };

  const handleMenuClose = () => {
    setMenuAnchorEl(null);
    setSelectedWorkoutIndex(null);
  };

  const handleDeleteWorkout = async () => {
    if (selectedWorkoutIndex !== null) {
      try {
        await deleteSavedWorkout(selectedWorkoutIndex);
        const workouts = await getSavedWorkouts();
        setSavedWorkouts(workouts || []);
      } catch (error) {
        console.error('Error deleting workout:', error);
      }
    }
    handleMenuClose();
  };

  const handleOpenDayPicker = (index) => {
    setSelectedWorkoutForDay(index);
    setDayPickerOpen(true);
    handleMenuClose();
  };

  const handleCloseDayPicker = () => {
    setDayPickerOpen(false);
    setSelectedWorkoutForDay(null);
  };

  const handleAssignDay = async (day) => {
    if (selectedWorkoutForDay !== null) {
      try {
        const workout = savedWorkouts[selectedWorkoutForDay];
        
        // Update the saved workout with the assigned day
        const updatedWorkout = {
          ...workout,
          assignedDay: day,
        };
        
        await updateSavedWorkout(selectedWorkoutForDay, updatedWorkout);
        
        // Sync with weekly schedule
        await assignWorkoutToDay(day, {
          sessionType: workout.type || 'full',
          sessionName: workout.name || `${workout.type || 'Custom'} Workout`,
          exercises: workout.exercises,
          supersetConfig: workout.supersetConfig || [2, 2, 2, 2],
        });
        
        // Reload workouts
        const workouts = await getSavedWorkouts();
        setSavedWorkouts(workouts || []);
      } catch (error) {
        console.error('Error assigning workout to day:', error);
      }
    }
    handleCloseDayPicker();
  };

  const handleUnassignDay = async () => {
    if (selectedWorkoutForDay !== null) {
      try {
        const workout = savedWorkouts[selectedWorkoutForDay];
        
        // Update the saved workout to remove the assigned day
        const updatedWorkout = {
          ...workout,
          assignedDay: undefined,
        };
        
        await updateSavedWorkout(selectedWorkoutForDay, updatedWorkout);
        
        // Reload workouts
        const workouts = await getSavedWorkouts();
        setSavedWorkouts(workouts || []);
      } catch (error) {
        console.error('Error unassigning workout from day:', error);
      }
    }
    handleCloseDayPicker();
  };

  const handleWorkoutClick = (workout) => {
    if (onStartWorkout && workout.exercises) {
      // Start the saved workout with superset config (or default if not defined)
      const config = workout.supersetConfig || [2, 2, 2, 2];
      onStartWorkout(workout.type || 'full', 'all', workout.exercises, config);
    }
  };

  const handleEditWorkout = () => {
    if (selectedWorkoutIndex !== null && onEditWorkout) {
      const workout = savedWorkouts[selectedWorkoutIndex];
      onEditWorkout(workout, selectedWorkoutIndex);
    }
    handleMenuClose();
  };

  return (
    <Box>
      {/* Header with Create Button - Minimalist Style */}
      <Box sx={{ mb: 3 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
              My Workouts
            </Typography>
          </Box>
          <IconButton
            color="primary"
            onClick={onCreateWorkout}
            sx={{ 
              bgcolor: 'primary.main',
              color: 'white',
              '&:hover': {
                bgcolor: 'primary.dark',
              },
            }}
          >
            <Add />
          </IconButton>
        </Stack>
      </Box>

      {/* Saved Workouts List */}
      {savedWorkouts.length === 0 ? (
        <Card sx={{ borderRadius: 3 }}>
          <CardContent sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="body1" color="text.secondary">
              No saved workouts.
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <List sx={{ p: 0 }}>
          {sortedWorkouts.map((workout) => {
            // Find the original index in savedWorkouts array
            const originalIndex = savedWorkouts.findIndex(w => w.id === workout.id || (w.createdAt === workout.createdAt && w.name === workout.name));
            
            return (
              <Card key={workout.id || originalIndex} sx={{ mb: 2, borderRadius: 3 }}>
                <ListItem
                  disablePadding
                  secondaryAction={
                    <IconButton
                      edge="end"
                      onClick={(e) => handleMenuOpen(e, originalIndex)}
                      sx={{ mr: 1 }}
                    >
                      <MoreVert />
                    </IconButton>
                  }
                >
                  <ListItemButton onClick={() => handleWorkoutClick(workout)}>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="h6" sx={{ fontWeight: 600 }}>
                            {workout.name || `${workout.type || 'Custom'} Workout`}
                          </Typography>
                          {workout.assignedDay && (
                            <Chip
                              icon={<CalendarMonth />}
                              label={workout.assignedDay.substring(0, 3)}
                              size="small"
                              color="primary"
                              sx={{ fontWeight: 600 }}
                            />
                          )}
                        </Box>
                      }
                      secondary={
                        <Stack direction="row" spacing={1} sx={{ mt: 1 }} flexWrap="wrap">
                          <Chip
                            label={`${workout.exercises?.length || 0} exercises`}
                            size="small"
                            color="primary"
                            variant="outlined"
                          />
                          {workout.type && (
                            <Chip
                              label={workout.type}
                              size="small"
                              variant="outlined"
                            />
                          )}
                          {workout.supersetConfig && workout.supersetConfig.length > 0 && (
                            <Chip
                              label={`${workout.supersetConfig.filter(count => count > 1).length} supersets`}
                              size="small"
                              color="secondary"
                              variant="outlined"
                            />
                          )}
                        </Stack>
                      }
                    />
                  </ListItemButton>
                </ListItem>
              </Card>
            );
          })}
        </List>
      )}

      {/* Menu for workout options */}
      <Menu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleEditWorkout}>Edit</MenuItem>
        <MenuItem onClick={() => handleOpenDayPicker(selectedWorkoutIndex)}>
          <CalendarMonth sx={{ mr: 1 }} fontSize="small" />
          Assign to Day
        </MenuItem>
        <MenuItem onClick={handleDeleteWorkout}>Delete</MenuItem>
      </Menu>

      {/* Day Picker Dialog */}
      <Dialog
        open={dayPickerOpen}
        onClose={handleCloseDayPicker}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Assign to Day</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Select which day of the week this workout should be assigned to
          </Typography>
          <Stack spacing={1}>
            {DAYS_OF_WEEK.map((day) => (
              <Button
                key={day}
                variant="outlined"
                fullWidth
                onClick={() => handleAssignDay(day)}
                sx={{ justifyContent: 'flex-start' }}
              >
                {day}
              </Button>
            ))}
          </Stack>
        </DialogContent>
        <DialogActions>
          {selectedWorkoutForDay !== null && savedWorkouts[selectedWorkoutForDay]?.assignedDay && (
            <Button onClick={handleUnassignDay} color="warning">
              Unassign
            </Button>
          )}
          <Button onClick={handleCloseDayPicker}>Cancel</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
});

SavedWorkoutsList.displayName = 'SavedWorkoutsList';

SavedWorkoutsList.propTypes = {
  onCreateWorkout: PropTypes.func,
  onStartWorkout: PropTypes.func,
  onEditWorkout: PropTypes.func,
};

export default SavedWorkoutsList;
