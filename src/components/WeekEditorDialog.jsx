import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  IconButton,
  Stack,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Alert,
} from '@mui/material';
import {
  Close,
  Edit,
  Delete,
  FitnessCenter,
  DirectionsRun,
  SelfImprovement,
  HotelOutlined,
  Star,
  Settings,
} from '@mui/icons-material';
import { useWeekScheduling } from '../contexts/WeekSchedulingContext';
import WorkoutDetailEditor from './WorkoutDetailEditor';
import WorkoutCreationModal from './WorkTabs/WorkoutCreationModal';
import { updateSavedWorkout, getSavedWorkouts } from '../utils/storage';
import { EXERCISES_DATA_PATH } from '../utils/constants';

/**
 * WeekEditorDialog - Dialog for editing weekly workout assignments
 * Allows users to view and modify assigned workouts for each day of the week
 */
const WeekEditorDialog = ({ open, onClose }) => {
  const { weeklySchedule, currentWeek, assignWorkoutToDay } = useWeekScheduling();
  const [editingDay, setEditingDay] = useState(null);
  const [selectedWorkoutType, setSelectedWorkoutType] = useState('');
  const [hasChanges, setHasChanges] = useState(false);
  const [detailEditorOpen, setDetailEditorOpen] = useState(false);
  const [detailEditorDay, setDetailEditorDay] = useState(null);
  
  // Workout Creation Modal state
  const [workoutCreationOpen, setWorkoutCreationOpen] = useState(false);
  const [editingWorkout, setEditingWorkout] = useState(null);
  const [editingWorkoutDay, setEditingWorkoutDay] = useState(null);
  const [exercises, setExercises] = useState([]);

  // Load exercises data for WorkoutCreationModal
  useEffect(() => {
    const loadExercises = async () => {
      try {
        const response = await fetch(EXERCISES_DATA_PATH);
        const data = await response.json();
        setExercises(data);
      } catch (error) {
        console.error('Error loading exercises:', error);
        setExercises([]);
      }
    };
    
    if (open) {
      loadExercises();
    }
  }, [open]);

  const daysOfWeek = [
    'Sunday',
    'Monday',
    'Tuesday', 
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
  ];

  const workoutTypes = [
    { value: 'full', label: 'Full Body' },
    { value: 'upper', label: 'Upper Body' },
    { value: 'lower', label: 'Lower Body' },
    { value: 'push', label: 'Push' },
    { value: 'pull', label: 'Pull' },
    { value: 'legs', label: 'Legs' },
    { value: 'core', label: 'Core' },
    { value: 'cardio', label: 'Cardio' },
    { value: 'hiit', label: 'HIIT' },
    { value: 'yoga', label: 'Yoga' },
    { value: 'mobility', label: 'Mobility' },
    { value: 'stretch', label: 'Stretching' },
    { value: 'rest', label: 'Rest Day' },
  ];

  // Get icon for session type
  const getSessionIcon = (sessionType) => {
    if (!sessionType) return <FitnessCenter />;
    
    const type = sessionType.toLowerCase();
    if (type.includes('cardio') || type.includes('hiit')) {
      return <DirectionsRun />;
    } else if (type.includes('yoga') || type.includes('mobility') || type.includes('stretch')) {
      return <SelfImprovement />;
    } else if (type.includes('rest')) {
      return <HotelOutlined />;
    }
    return <FitnessCenter />;
  };

  // Get color for session type
  const getSessionColor = (sessionType) => {
    if (!sessionType) return 'default';
    
    const type = sessionType.toLowerCase();
    if (type.includes('cardio') || type.includes('hiit')) {
      return 'error';
    } else if (type.includes('yoga') || type.includes('mobility') || type.includes('stretch')) {
      return 'secondary';
    } else if (type.includes('rest')) {
      return 'default';
    }
    return 'primary';
  };

  // Get display name for session type
  const getSessionTypeDisplay = (sessionType) => {
    const type = workoutTypes.find(t => t.value === sessionType?.toLowerCase());
    return type ? type.label : sessionType || 'Not assigned';
  };

  const handleEditDay = (day) => {
    setEditingDay(day);
    const currentSession = weeklySchedule[day];
    if (currentSession?.sessionType) {
      setSelectedWorkoutType(currentSession.sessionType.toLowerCase());
    } else {
      setSelectedWorkoutType('');
    }
  };

  const handleCancelEdit = () => {
    setEditingDay(null);
    setSelectedWorkoutType('');
  };

  const handleSaveEdit = async () => {
    if (editingDay && selectedWorkoutType) {
      const sessionData = {
        sessionType: selectedWorkoutType,
        sessionName: getSessionTypeDisplay(selectedWorkoutType),
        exercises: [], // Empty for now, can be populated later
        assignedDate: new Date().toISOString(),
      };
      
      await assignWorkoutToDay(editingDay, sessionData);
      setHasChanges(true);
      setEditingDay(null);
      setSelectedWorkoutType('');
    }
  };

  const handleClearDay = async (day) => {
    await assignWorkoutToDay(day, null);
    setHasChanges(true);
  };

  const handleOpenDetailEditor = (day) => {
    setDetailEditorDay(day);
    setDetailEditorOpen(true);
  };

  const handleCloseDetailEditor = () => {
    setDetailEditorOpen(false);
    setDetailEditorDay(null);
  };

  const handleSaveWorkoutDetails = async (updatedWorkout) => {
    if (detailEditorDay) {
      await assignWorkoutToDay(detailEditorDay, updatedWorkout);
      setHasChanges(true);
      handleCloseDetailEditor();
    }
  };

  // Helper to check if a session type is strength training
  const isStrengthWorkout = (sessionType) => {
    if (!sessionType) return false;
    const type = sessionType.toLowerCase();
    const strengthTypes = ['full', 'upper', 'lower', 'push', 'pull', 'legs', 'core'];
    return strengthTypes.includes(type);
  };

  // Handle clicking on a strength workout to edit it
  const handleWorkoutClick = (day, session) => {
    // Only open workout creation modal for strength workouts with exercises
    if (session && isStrengthWorkout(session.sessionType) && session.exercises && session.exercises.length > 0) {
      setEditingWorkout({
        name: session.sessionName,
        type: session.sessionType,
        exercises: session.exercises,
        supersetConfig: session.supersetConfig,
      });
      setEditingWorkoutDay(day);
      setWorkoutCreationOpen(true);
    }
  };

  const handleCloseWorkoutCreation = () => {
    setWorkoutCreationOpen(false);
    setEditingWorkout(null);
    setEditingWorkoutDay(null);
  };

  const handleSaveWorkoutCreation = async (workout) => {
    if (editingWorkoutDay) {
      // Update the workout in the weekly schedule
      await assignWorkoutToDay(editingWorkoutDay, {
        sessionType: workout.type || 'full',
        sessionName: workout.name,
        exercises: workout.exercises,
        supersetConfig: workout.supersetConfig,
        lastModified: new Date().toISOString(),
      });
      
      // Also update in saved workouts if it exists there
      try {
        const savedWorkouts = await getSavedWorkouts();
        const workoutIndex = savedWorkouts.findIndex(w => 
          w.assignedDay === editingWorkoutDay && 
          w.name === editingWorkout.name
        );
        
        if (workoutIndex !== -1) {
          await updateSavedWorkout(workoutIndex, workout);
        }
      } catch (error) {
        console.error('Error updating saved workout:', error);
      }
      
      setHasChanges(true);
      handleCloseWorkoutCreation();
    }
  };

  const handleClose = () => {
    if (hasChanges) {
      // Reset the changes flag
      setHasChanges(false);
    }
    setEditingDay(null);
    setSelectedWorkoutType('');
    onClose();
  };

  const getCurrentDayName = () => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[new Date().getDay()];
  };

  const currentDayName = getCurrentDayName();

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
        }
      }}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            <Typography variant="h6" fontWeight={700}>
              Edit Weekly Schedule
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Week {currentWeek} - Customize your workout plan
            </Typography>
          </Box>
          <IconButton onClick={handleClose} size="small">
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Alert severity="info" sx={{ mb: 3 }}>
          Set a suggested workout type for each day. To assign a specific saved workout, 
          use the &quot;Assign to Day&quot; option from your Saved Workouts menu.
        </Alert>

        <Stack spacing={2}>
          {daysOfWeek.map((day) => {
            const session = weeklySchedule[day];
            const isToday = day === currentDayName;
            const isEditing = editingDay === day;

            return (
              <Card 
                key={day}
                sx={{
                  border: isToday ? 2 : 1,
                  borderColor: isToday ? 'primary.main' : 'divider',
                  boxShadow: isToday ? 2 : 1,
                }}
              >
                <CardContent>
                  {isEditing ? (
                    // Edit Mode
                    <Box>
                      <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                        {day}
                        {isToday && (
                          <Chip 
                            label="Today" 
                            size="small" 
                            color="primary" 
                            sx={{ ml: 1 }}
                          />
                        )}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Select a suggested workout type for this day
                      </Typography>
                      <Box sx={{ mt: 2 }}>
                        <FormControl fullWidth size="small">
                          <InputLabel>Suggested Workout Type</InputLabel>
                          <Select
                            value={selectedWorkoutType}
                            label="Suggested Workout Type"
                            onChange={(e) => setSelectedWorkoutType(e.target.value)}
                          >
                            {workoutTypes.map((type) => (
                              <MenuItem key={type.value} value={type.value}>
                                {type.label}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                        <Box sx={{ mt: 2, display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                          <Button size="small" onClick={handleCancelEdit}>
                            Cancel
                          </Button>
                          <Button 
                            size="small" 
                            variant="contained" 
                            onClick={handleSaveEdit}
                            disabled={!selectedWorkoutType}
                          >
                            Save
                          </Button>
                        </Box>
                      </Box>
                    </Box>
                  ) : (
                    // View Mode
                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: { xs: 'flex-start', sm: 'center' },
                      justifyContent: 'space-between',
                      flexDirection: { xs: 'column', sm: 'row' },
                      gap: { xs: 1, sm: 0 },
                    }}>
                      <Box sx={{ 
                        display: 'flex', 
                        alignItems: { xs: 'flex-start', sm: 'center' }, 
                        gap: 2, 
                        flex: 1,
                        width: '100%',
                        flexDirection: { xs: 'column', sm: 'row' },
                      }}>
                        {/* Day Label */}
                        <Box sx={{ 
                          minWidth: { xs: 'auto', sm: 100 },
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1,
                        }}>
                          <Typography variant="subtitle1" fontWeight={600}>
                            {day}
                          </Typography>
                          {isToday && (
                            <Chip 
                              label="Today" 
                              size="small" 
                              color="primary"
                            />
                          )}
                        </Box>

                        {/* Session Info and Status Chip */}
                        <Box sx={{ 
                          flex: 1,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: 1,
                          width: '100%',
                        }}>
                          <Box 
                            sx={{ 
                              flex: 1, 
                              minWidth: 0,
                              cursor: session && isStrengthWorkout(session.sessionType) && session.exercises && session.exercises.length > 0 ? 'pointer' : 'default',
                              '&:hover': session && isStrengthWorkout(session.sessionType) && session.exercises && session.exercises.length > 0 ? {
                                bgcolor: 'action.hover',
                                borderRadius: 1,
                              } : {},
                              p: 0.5,
                              mx: -0.5,
                              transition: 'background-color 0.2s',
                            }}
                            onClick={() => session && handleWorkoutClick(day, session)}
                          >
                            {session ? (
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                                {getSessionIcon(session.sessionType)}
                                <Typography 
                                  variant="body1"
                                  sx={{
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                  }}
                                >
                                  {session.sessionName || getSessionTypeDisplay(session.sessionType)}
                                </Typography>
                                {session.fromFavorite && (
                                  <Star 
                                    sx={{ 
                                      fontSize: 16, 
                                      color: 'warning.main',
                                      ml: 0.5,
                                    }} 
                                  />
                                )}
                                {(!session.exercises || session.exercises.length === 0) && (
                                  <Chip
                                    label="Suggested"
                                    size="small"
                                    color="default"
                                    variant="outlined"
                                    sx={{ fontSize: '0.7rem', height: 20 }}
                                  />
                                )}
                                {session && isStrengthWorkout(session.sessionType) && session.exercises && session.exercises.length > 0 && (
                                  <Chip
                                    label="Click to edit"
                                    size="small"
                                    color="primary"
                                    variant="outlined"
                                    sx={{ fontSize: '0.7rem', height: 20 }}
                                  />
                                )}
                              </Box>
                            ) : (
                              <Typography variant="body2" color="text.secondary">
                                No workout set
                              </Typography>
                            )}
                          </Box>

                          {/* Status Chip - hidden on mobile */}
                          {session && (
                            <Chip
                              label={getSessionTypeDisplay(session.sessionType)}
                              color={getSessionColor(session.sessionType)}
                              size="small"
                              variant="outlined"
                              sx={{ 
                                display: { xs: 'none', sm: 'flex' },
                                flexShrink: 0,
                              }}
                            />
                          )}
                        </Box>
                      </Box>

                      {/* Action Buttons - always visible and properly positioned */}
                      <Box sx={{ 
                        display: 'flex', 
                        gap: 0.5,
                        flexShrink: 0,
                        alignSelf: { xs: 'flex-end', sm: 'center' },
                        ml: { xs: 0, sm: 1 },
                      }}>
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => handleEditDay(day)}
                          title="Edit workout type"
                        >
                          <Edit fontSize="small" />
                        </IconButton>
                        {session && (
                          <>
                            <IconButton
                              size="small"
                              color="secondary"
                              onClick={() => handleOpenDetailEditor(day)}
                              title="Edit exercises, supersets, and set values"
                            >
                              <Settings fontSize="small" />
                            </IconButton>
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleClearDay(day)}
                              title="Clear workout"
                            >
                              <Delete fontSize="small" />
                            </IconButton>
                          </>
                        )}
                      </Box>
                    </Box>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handleClose} variant="contained">
          Done
        </Button>
      </DialogActions>

      {/* Workout Detail Editor */}
      {detailEditorDay && weeklySchedule[detailEditorDay] && (
        <WorkoutDetailEditor
          open={detailEditorOpen}
          onClose={handleCloseDetailEditor}
          workout={weeklySchedule[detailEditorDay]}
          dayOfWeek={detailEditorDay}
          onSave={handleSaveWorkoutDetails}
        />
      )}

      {/* Workout Creation Modal - for editing strength workouts */}
      <WorkoutCreationModal
        open={workoutCreationOpen}
        onClose={handleCloseWorkoutCreation}
        onSave={handleSaveWorkoutCreation}
        exercises={exercises}
        existingWorkout={editingWorkout}
      />
    </Dialog>
  );
};

WeekEditorDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default WeekEditorDialog;
