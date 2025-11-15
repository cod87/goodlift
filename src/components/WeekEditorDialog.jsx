import { useState } from 'react';
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
} from '@mui/icons-material';
import { useWeekScheduling } from '../contexts/WeekSchedulingContext';

/**
 * WeekEditorDialog - Dialog for editing weekly workout assignments
 * Allows users to view and modify assigned workouts for each day of the week
 */
const WeekEditorDialog = ({ open, onClose }) => {
  const { weeklySchedule, currentWeek, assignWorkoutToDay } = useWeekScheduling();
  const [editingDay, setEditingDay] = useState(null);
  const [selectedWorkoutType, setSelectedWorkoutType] = useState('');
  const [hasChanges, setHasChanges] = useState(false);

  const daysOfWeek = [
    'Monday',
    'Tuesday', 
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
    'Sunday',
  ];

  const workoutTypes = [
    { value: 'full', label: 'Full Body' },
    { value: 'upper', label: 'Upper Body' },
    { value: 'lower', label: 'Lower Body' },
    { value: 'push', label: 'Push' },
    { value: 'pull', label: 'Pull' },
    { value: 'legs', label: 'Legs' },
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
          Assign or modify workouts for each day of the week. Changes are saved automatically.
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
                      <Box sx={{ mt: 2 }}>
                        <FormControl fullWidth size="small">
                          <InputLabel>Workout Type</InputLabel>
                          <Select
                            value={selectedWorkoutType}
                            label="Workout Type"
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
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
                        {/* Day Label */}
                        <Box sx={{ minWidth: 100 }}>
                          <Typography variant="subtitle1" fontWeight={600}>
                            {day}
                          </Typography>
                          {isToday && (
                            <Typography variant="caption" color="primary.main">
                              Today
                            </Typography>
                          )}
                        </Box>

                        {/* Session Info */}
                        <Box sx={{ flex: 1 }}>
                          {session ? (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              {getSessionIcon(session.sessionType)}
                              <Typography variant="body1">
                                {session.sessionName || getSessionTypeDisplay(session.sessionType)}
                              </Typography>
                            </Box>
                          ) : (
                            <Typography variant="body2" color="text.secondary">
                              No workout assigned
                            </Typography>
                          )}
                        </Box>

                        {/* Status Chip */}
                        {session && (
                          <Chip
                            label={getSessionTypeDisplay(session.sessionType)}
                            color={getSessionColor(session.sessionType)}
                            size="small"
                            variant="outlined"
                          />
                        )}
                      </Box>

                      {/* Action Buttons */}
                      <Box sx={{ display: 'flex', gap: 0.5 }}>
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => handleEditDay(day)}
                          title="Edit workout"
                        >
                          <Edit fontSize="small" />
                        </IconButton>
                        {session && (
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleClearDay(day)}
                            title="Clear workout"
                          >
                            <Delete fontSize="small" />
                          </IconButton>
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
    </Dialog>
  );
};

WeekEditorDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default WeekEditorDialog;
