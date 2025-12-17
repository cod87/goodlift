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
  List,
  ListItem,
  ListItemText,
  ListItemButton,
  Menu,
  MenuItem,
  Collapse,
} from '@mui/material';
import { 
  Add,
  MoreVert,
  CalendarMonth,
  Edit,
  Delete,
  Archive,
  Unarchive,
  ExpandMore,
  ExpandLess,
  FitnessCenter,
  Layers,
  ContentCopy,
  TrendingDown,
} from '@mui/icons-material';
import { getSavedWorkouts, deleteSavedWorkout, updateSavedWorkout, duplicateSavedWorkout } from '../../utils/storage';
import { useWeekScheduling } from '../../contexts/WeekSchedulingContext';
import { getWorkoutTypeShorthand } from '../../utils/workoutTypeHelpers';
import AssignToDayDialog from '../Common/AssignToDayDialog';

// Days of the week in order
const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/**
 * Utility function to get exercise name from various formats
 * @param {Object} exercise - Exercise object
 * @returns {string|null} Exercise name or null if not found
 */
const getExerciseName = (exercise) => {
  if (!exercise) return null;
  return exercise['Exercise Name'] || exercise.exerciseName || exercise.name || null;
};

/**
 * Get count of supersets from superset config
 * @param {Array} supersetConfig - Array of exercise counts per superset
 * @returns {number} Count of supersets (groups with more than 1 exercise)
 */
const getSupersetCount = (supersetConfig) => {
  if (!supersetConfig || !Array.isArray(supersetConfig)) return 0;
  return supersetConfig.filter(count => count > 1).length;
};

/**
 * SavedWorkoutsList - Display list of saved workouts
 * Features:
 * - List of saved workouts with basic info
 * - Create new workout button
 * - Options to edit/duplicate/delete saved workouts
 * - Assign workouts to specific days of the week
 */
const SavedWorkoutsList = memo(({ 
  onCreateWorkout,
  onStartWorkout,
  onEditWorkout, // Add edit callback
}) => {
  const { assignWorkoutToDay, weeklySchedule } = useWeekScheduling();
  const [savedWorkouts, setSavedWorkouts] = useState([]);
  const [menuAnchorEl, setMenuAnchorEl] = useState(null);
  const [selectedWorkoutIndex, setSelectedWorkoutIndex] = useState(null);
  const [dayPickerOpen, setDayPickerOpen] = useState(false);
  const [selectedWorkoutForDay, setSelectedWorkoutForDay] = useState(null);
  const [showArchived, setShowArchived] = useState(false);

  // Helper function to get assigned days for a workout from weeklySchedule
  const getAssignedDays = (workout) => {
    if (!weeklySchedule || !workout) return [];
    
    const assignedDays = [];
    DAYS_OF_WEEK.forEach(day => {
      const dayWorkout = weeklySchedule[day];
      if (dayWorkout && dayWorkout.workoutId === workout.id) {
        assignedDays.push(day);
      } else if (dayWorkout && dayWorkout.exercises && workout.exercises) {
        // Fallback: check if exercises match (for workouts assigned before workoutId was added)
        if (JSON.stringify(dayWorkout.exercises) === JSON.stringify(workout.exercises)) {
          assignedDays.push(day);
        }
      }
    });
    
    return assignedDays;
  };

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

  // Sort workouts: assigned workouts first (by first assigned day), then unassigned
  const sortedWorkouts = [...savedWorkouts].sort((a, b) => {
    const aDays = getAssignedDays(a);
    const bDays = getAssignedDays(b);
    const aDay = aDays.length > 0 ? aDays[0] : null;
    const bDay = bDays.length > 0 ? bDays[0] : null;
    
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

  // Separate active and archived workouts
  const activeWorkouts = sortedWorkouts.filter(w => !w.archived);
  const archivedWorkouts = sortedWorkouts.filter(w => w.archived);

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

  const handleAssignDay = async (days) => {
    if (selectedWorkoutForDay !== null) {
      try {
        const workout = savedWorkouts[selectedWorkoutForDay];
        
        // Note: We don't update the assignedDay field on the saved workout anymore
        // This is because a workout can now be assigned to multiple days
        // The source of truth for day assignments is the weeklySchedule in WeekSchedulingContext
        
        // Sync with weekly schedule - pass array of days
        await assignWorkoutToDay(days, {
          sessionType: workout.type || 'full',
          sessionName: workout.name || `${workout.type || 'Custom'} Workout`,
          exercises: workout.exercises,
          supersetConfig: workout.supersetConfig || [2, 2, 2, 2],
          workoutId: workout.id, // Include workout ID to link to saved workout
          isSavedWorkout: true, // Flag to indicate this is a saved workout
        });
        
        // Reload workouts
        const workouts = await getSavedWorkouts();
        setSavedWorkouts(workouts || []);
      } catch (error) {
        console.error('Error assigning workout to day(s):', error);
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
    // Prevent click if no exercises or invalid workout
    if (!workout || !workout.exercises || workout.exercises.length === 0) {
      console.warn('Cannot start workout: no exercises found in workout');
      return;
    }

    // Only start workout if callback is provided
    if (!onStartWorkout) {
      console.warn('No onStartWorkout callback provided');
      return;
    }

    try {
      // Validate that exercises have required fields
      const validExercises = workout.exercises.every(ex => getExerciseName(ex) !== null);
      
      if (!validExercises) {
        console.error('Invalid exercise data in workout');
        return;
      }

      // Start the saved workout with superset config (or default if not defined)
      const config = workout.supersetConfig || [2, 2, 2, 2];
      onStartWorkout(workout.type || 'full', 'all', workout.exercises, config, false); // false = not deload mode
    } catch (error) {
      console.error('Error starting workout:', error);
      // Prevent blank screen by not changing navigation state
    }
  };

  const handleStartInDeloadMode = () => {
    if (selectedWorkoutIndex === null) return;
    
    const workout = savedWorkouts[selectedWorkoutIndex];
    
    // Validate workout
    if (!workout || !workout.exercises || workout.exercises.length === 0) {
      console.warn('Cannot start workout: no exercises found in workout');
      handleMenuClose();
      return;
    }

    try {
      // Validate that exercises have required fields
      const validExercises = workout.exercises.every(ex => getExerciseName(ex) !== null);
      
      if (!validExercises) {
        console.error('Invalid exercise data in workout');
        handleMenuClose();
        return;
      }

      // Start the saved workout with superset config in deload mode
      const config = workout.supersetConfig || [2, 2, 2, 2];
      onStartWorkout(workout.type || 'full', 'all', workout.exercises, config, true); // true = deload mode
    } catch (error) {
      console.error('Error starting workout in deload mode:', error);
    }
    
    handleMenuClose();
  };

  const handleEditWorkout = () => {
    if (selectedWorkoutIndex !== null && onEditWorkout) {
      const workout = savedWorkouts[selectedWorkoutIndex];
      onEditWorkout(workout, selectedWorkoutIndex);
    }
    handleMenuClose();
  };

  const handleArchiveWorkout = async () => {
    if (selectedWorkoutIndex !== null) {
      try {
        const workout = savedWorkouts[selectedWorkoutIndex];
        const updatedWorkout = {
          ...workout,
          archived: !workout.archived, // Toggle archived status
        };
        await updateSavedWorkout(selectedWorkoutIndex, updatedWorkout);
        const workouts = await getSavedWorkouts();
        setSavedWorkouts(workouts || []);
      } catch (error) {
        console.error('Error archiving/unarchiving workout:', error);
      }
    }
    handleMenuClose();
  };

  const handleDuplicateWorkout = async () => {
    if (selectedWorkoutIndex !== null) {
      try {
        await duplicateSavedWorkout(selectedWorkoutIndex);
        const workouts = await getSavedWorkouts();
        setSavedWorkouts(workouts || []);
      } catch (error) {
        console.error('Error duplicating workout:', error);
      }
    }
    handleMenuClose();
  };

  // Helper to render workout list
  const renderWorkoutList = (workouts) => {
    if (workouts.length === 0) return null;

    return (
      <List sx={{ p: 0 }}>
        {workouts.map((workout) => {
          // Find the original index in savedWorkouts array
          const originalIndex = savedWorkouts.findIndex(w => w.id === workout.id || (w.createdAt === workout.createdAt && w.name === workout.name));
          const supersetCount = getSupersetCount(workout.supersetConfig);
          
          return (
            <Card key={workout.id || originalIndex} sx={{ mb: 1.5, borderRadius: 2 }}>
              <ListItem
                disablePadding
                secondaryAction={
                  <IconButton
                    edge="end"
                    onClick={(e) => handleMenuOpen(e, originalIndex)}
                    size="small"
                    sx={{ mr: 0.5 }}
                  >
                    <MoreVert fontSize="small" />
                  </IconButton>
                }
              >
                <ListItemButton onClick={() => handleWorkoutClick(workout)} sx={{ py: 1.5, px: 2 }}>
                  <ListItemText
                    primary={
                      <Typography variant="subtitle1" sx={{ fontWeight: 600, fontSize: '0.95rem', mb: 0.5 }}>
                        {workout.name || `${workout.type || 'Custom'} Workout`}
                      </Typography>
                    }
                    secondary={
                      <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 1.5,
                        color: 'text.secondary',
                        fontSize: '0.75rem',
                      }}>
                        {/* Exercise count */}
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <FitnessCenter sx={{ fontSize: '0.875rem', opacity: 0.7 }} />
                          <span>{workout.exercises?.length || 0}</span>
                        </Box>
                        
                        {/* Workout type */}
                        {workout.type && (
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Typography 
                              component="span" 
                              sx={{ 
                                fontSize: '0.75rem', 
                                color: 'text.secondary',
                                textTransform: 'lowercase',
                              }}
                            >
                              {getWorkoutTypeShorthand(workout.type)}
                            </Typography>
                          </Box>
                        )}
                        
                        {/* Superset count */}
                        {supersetCount > 0 && (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <Layers sx={{ fontSize: '0.875rem', opacity: 0.7 }} />
                            <span>{supersetCount}</span>
                          </Box>
                        )}
                        
                        {/* Assigned days - check weeklySchedule for current assignments */}
                        {(() => {
                          const assignedDays = getAssignedDays(workout);
                          return assignedDays.length > 0 && (
                            <Box sx={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              gap: 0.5,
                              color: 'primary.main',
                            }}>
                              <CalendarMonth sx={{ fontSize: '0.875rem' }} />
                              <span style={{ fontWeight: 500 }}>
                                {assignedDays.map(day => day.substring(0, 3)).join(', ')}
                              </span>
                            </Box>
                          );
                        })()}
                      </Box>
                    }
                  />
                </ListItemButton>
              </ListItem>
            </Card>
          );
        })}
      </List>
    );
  };

  return (
    <Box>
      {/* Header with Create Button - Compact Minimalist Style */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
          My Workouts
        </Typography>
        <IconButton
          color="primary"
          onClick={onCreateWorkout}
          size="small"
          sx={{ 
            bgcolor: 'primary.main',
            color: 'white',
            width: 32,
            height: 32,
            '&:hover': {
              bgcolor: 'primary.dark',
            },
          }}
        >
          <Add fontSize="small" />
        </IconButton>
      </Stack>

      {/* Saved Workouts List */}
      {activeWorkouts.length === 0 && archivedWorkouts.length === 0 ? (
        <Card sx={{ borderRadius: 3 }}>
          <CardContent sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="body1" color="text.secondary">
              No saved workouts.
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Active Workouts */}
          {activeWorkouts.length === 0 ? (
            <Card sx={{ borderRadius: 3, mb: 2 }}>
              <CardContent sx={{ textAlign: 'center', py: 3 }}>
                <Typography variant="body2" color="text.secondary">
                  No active workouts. All workouts are archived.
                </Typography>
              </CardContent>
            </Card>
          ) : (
            renderWorkoutList(activeWorkouts)
          )}

          {/* Archived Workouts Section */}
          {archivedWorkouts.length > 0 && (
            <Box sx={{ mt: 3 }}>
              <Button
                fullWidth
                onClick={() => setShowArchived(!showArchived)}
                sx={{
                  justifyContent: 'space-between',
                  textTransform: 'none',
                  mb: 2,
                  py: 1.5,
                  borderRadius: 2,
                  border: '1px solid',
                  borderColor: 'divider',
                }}
                endIcon={showArchived ? <ExpandLess /> : <ExpandMore />}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Archive fontSize="small" />
                  <Typography variant="subtitle1" fontWeight={600}>
                    Archived Workouts ({archivedWorkouts.length})
                  </Typography>
                </Box>
              </Button>
              <Collapse in={showArchived}>
                {renderWorkoutList(archivedWorkouts)}
              </Collapse>
            </Box>
          )}
        </>
      )}

      {/* Menu for workout options */}
      <Menu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleStartInDeloadMode}>
          <TrendingDown sx={{ mr: 1 }} fontSize="small" />
          Start in Deload Mode
        </MenuItem>
        <MenuItem onClick={handleEditWorkout}>
          <Edit sx={{ mr: 1 }} fontSize="small" />
          Edit
        </MenuItem>
        <MenuItem onClick={handleDuplicateWorkout}>
          <ContentCopy sx={{ mr: 1 }} fontSize="small" />
          Duplicate
        </MenuItem>
        <MenuItem onClick={() => handleOpenDayPicker(selectedWorkoutIndex)}>
          <CalendarMonth sx={{ mr: 1 }} fontSize="small" />
          Assign to Day
        </MenuItem>
        <MenuItem onClick={handleArchiveWorkout}>
          {selectedWorkoutIndex !== null && savedWorkouts[selectedWorkoutIndex]?.archived ? (
            <>
              <Unarchive sx={{ mr: 1 }} fontSize="small" />
              Unarchive
            </>
          ) : (
            <>
              <Archive sx={{ mr: 1 }} fontSize="small" />
              Archive
            </>
          )}
        </MenuItem>
        <MenuItem onClick={handleDeleteWorkout}>
          <Delete sx={{ mr: 1 }} fontSize="small" />
          Delete
        </MenuItem>
      </Menu>

      {/* Day Assignment Dialog */}
      <AssignToDayDialog
        open={dayPickerOpen}
        onClose={handleCloseDayPicker}
        onAssign={handleAssignDay}
        workoutData={selectedWorkoutForDay !== null ? savedWorkouts[selectedWorkoutForDay] : null}
        currentSchedule={weeklySchedule}
        allowMultiple={true}
      />
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
