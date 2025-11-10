import { useState, useEffect, useMemo } from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  Container,
  Typography,
  Paper,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Menu,
  MenuItem,
  Chip
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  DeleteOutline as DeleteIcon,
  EventRepeat as MoveIcon,
  PlayArrow as StartIcon,
  EditCalendar as EditRecurringIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import Calendar from './Calendar';
import RecurringSessionEditor from './RecurringSessionEditor';
import {
  getActivePlan,
  saveWorkoutPlan
} from '../utils/storage';
import {
  moveSession,
  updateSessionStatus,
  removeSessionFromPlan,
  getRecurringSessionsInBlock,
  updateRecurringSessionExercises
} from '../utils/workoutPlanGenerator';

const PlanCalendarScreen = ({ onNavigate, onStartWorkout }) => {
  const [plan, setPlan] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedSession, setSelectedSession] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [moveDialogOpen, setMoveDialogOpen] = useState(false);
  const [newDate, setNewDate] = useState(null);
  const [draggedSession, setDraggedSession] = useState(null);
  const [editRecurringOpen, setEditRecurringOpen] = useState(false);
  const [allExercises, setAllExercises] = useState([]);

  useEffect(() => {
    loadActivePlan();
    loadExercises();
  }, []);

  const loadExercises = async () => {
    try {
      const response = await fetch(`${import.meta.env.BASE_URL}data/exercises.json`);
      if (response.ok) {
        const exercises = await response.json();
        setAllExercises(exercises);
      }
    } catch (error) {
      console.error('Error loading exercises:', error);
    }
  };

  const loadActivePlan = async () => {
    const activePlan = await getActivePlan();
    setPlan(activePlan);
  };

  // Convert plan sessions to calendar format
  const calendarSessions = useMemo(() => {
    if (!plan) return [];
    
    return plan.sessions.map(session => ({
      date: session.date,
      type: session.type,
      duration: session.duration || 60,
      status: session.status,
      sessionId: session.id
    }));
  }, [plan]);

  const handleDayClick = (date) => {
    setSelectedDate(date);
    
    // Find sessions for this date
    const dateStr = date.toDateString();
    const sessionsOnDate = plan?.sessions.filter(session => {
      const sessionDate = new Date(session.date);
      return sessionDate.toDateString() === dateStr;
    }) || [];

    if (sessionsOnDate.length > 0) {
      setSelectedSession(sessionsOnDate[0]);
    } else {
      setSelectedSession(null);
    }
  };

  const handleMenuOpen = (event) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleStartSession = async () => {
    if (!selectedSession || !plan) return;
    
    // Validate session has required data before starting
    const sessionType = selectedSession.type;
    const isStandardWorkout = ['upper', 'lower', 'full', 'push', 'pull', 'legs'].includes(sessionType);
    const isHiit = sessionType === 'hiit';
    const isYoga = sessionType === 'yoga' || sessionType === 'stretch';
    
    // Check if session data is available for sessions that require it
    if (isStandardWorkout && (!selectedSession.exercises || selectedSession.exercises.length === 0)) {
      alert('This session does not have exercises populated. Please regenerate the plan or select a different session.');
      return;
    }
    
    if (isHiit && !selectedSession.sessionData) {
      // Allow fallback to HIIT timer, but warn user
      if (!window.confirm('This session does not have pre-generated data. Would you like to use the HIIT timer instead?')) {
        return;
      }
    }
    
    if (isYoga && !selectedSession.sessionData) {
      // Allow fallback to mobility screen, but warn user
      if (!window.confirm('This session does not have pre-generated data. Would you like to use the mobility screen instead?')) {
        return;
      }
    }
    
    // Update session status to in_progress
    const updatedPlan = updateSessionStatus(plan, selectedSession.id, 'in_progress');
    await saveWorkoutPlan(updatedPlan);
    
    // Navigate to appropriate workout screen based on session type
    if (isStandardWorkout) {
      // Navigate to workout preview with pre-generated exercises
      if (onStartWorkout) {
        // Pass pre-generated workout exercises and plan context for tracking
        const planContext = {
          planId: plan.id,
          planName: plan.name,
          sessionId: selectedSession.id,
          sessionDate: selectedSession.date
        };
        onStartWorkout(selectedSession.type, new Set(['all']), selectedSession.exercises, planContext);
      }
    } else if (isHiit) {
      // Store session data and navigate to HIIT session screen
      if (selectedSession.sessionData) {
        localStorage.setItem('currentHiitSession', JSON.stringify(selectedSession.sessionData));
        if (onNavigate) {
          onNavigate('hiit-session');
        }
      } else {
        // Fallback to HIIT timer if no session data
        if (onNavigate) {
          onNavigate('hiit');
        }
      }
    } else if (sessionType === 'cardio') {
      if (onNavigate) {
        onNavigate('cardio');
      }
    } else if (isYoga) {
      // Store session data and navigate to Yoga session screen
      if (selectedSession.sessionData) {
        localStorage.setItem('currentYogaSession', JSON.stringify(selectedSession.sessionData));
        if (onNavigate) {
          onNavigate('yoga-session');
        }
      } else {
        // Fallback to mobility screen if no session data
        if (onNavigate) {
          onNavigate('mobility');
        }
      }
    }
    
    handleCloseDialog();
  };

  const handleMoveSession = () => {
    setMoveDialogOpen(true);
    setNewDate(selectedDate);
    handleMenuClose();
  };

  const handleConfirmMove = async () => {
    if (!selectedSession || !plan || !newDate) return;
    
    const updatedPlan = moveSession(plan, selectedSession.id, newDate);
    await saveWorkoutPlan(updatedPlan);
    await loadActivePlan();
    
    setMoveDialogOpen(false);
    handleCloseDialog();
  };

  const handleSkipSession = async () => {
    if (!selectedSession || !plan) return;
    
    const updatedPlan = updateSessionStatus(plan, selectedSession.id, 'skipped');
    await saveWorkoutPlan(updatedPlan);
    await loadActivePlan();
    
    handleMenuClose();
    handleCloseDialog();
  };

  const handleDeleteSession = async () => {
    if (!selectedSession || !plan) return;
    
    if (window.confirm('Are you sure you want to delete this session?')) {
      const updatedPlan = removeSessionFromPlan(plan, selectedSession.id);
      await saveWorkoutPlan(updatedPlan);
      await loadActivePlan();
      
      handleMenuClose();
      handleCloseDialog();
    }
  };

  const handleEditRecurring = () => {
    if (!selectedSession || !plan) return;
    
    // Only allow editing recurring sessions for standard workouts
    const isStandardWorkout = ['upper', 'lower', 'full', 'push', 'pull', 'legs'].includes(selectedSession.type);
    if (!isStandardWorkout) {
      alert('Recurring editing is only available for standard workout sessions (Upper/Lower/Full Body/PPL)');
      return;
    }
    
    setEditRecurringOpen(true);
    handleMenuClose();
  };

  const handleSaveRecurringEdits = async (newExercises) => {
    if (!selectedSession || !plan) return;
    
    try {
      const updatedPlan = updateRecurringSessionExercises(plan, selectedSession.id, newExercises);
      await saveWorkoutPlan(updatedPlan);
      await loadActivePlan();
      
      setEditRecurringOpen(false);
      handleCloseDialog();
    } catch (error) {
      console.error('Error saving recurring edits:', error);
      alert('Failed to save changes. Please try again.');
    }
  };

  const getRecurringSessionCount = () => {
    if (!selectedSession || !plan) return 0;
    const recurringSessions = getRecurringSessionsInBlock(plan, selectedSession.id);
    return recurringSessions.length;
  };

  const handleCloseDialog = () => {
    setSelectedDate(null);
    setSelectedSession(null);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = async (date) => {
    if (!draggedSession || !plan) return;
    
    const updatedPlan = moveSession(plan, draggedSession.id, date);
    await saveWorkoutPlan(updatedPlan);
    await loadActivePlan();
    
    setDraggedSession(null);
  };

  const getSessionTypeLabel = (type) => {
    const labels = {
      upper: 'Upper Body',
      lower: 'Lower Body',
      full: 'Full Body',
      push: 'Push',
      pull: 'Pull',
      legs: 'Legs',
      hiit: 'HIIT',
      cardio: 'Cardio',
      yoga: 'Yoga',
      stretch: 'Stretch'
    };
    return labels[type] || type;
  };

  const getStatusColor = (status) => {
    const colors = {
      planned: 'default',
      in_progress: 'info',
      completed: 'success',
      skipped: 'warning',
      missed: 'error'
    };
    return colors[status] || 'default';
  };

  if (!plan) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No active plan
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Create and activate a workout plan to see your schedule
          </Typography>
          <Button
            variant="contained"
            color="primary"
            onClick={() => onNavigate && onNavigate('plans')}
          >
            View Plans
          </Button>
        </Paper>
      </Container>
    );
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <IconButton onClick={() => onNavigate && onNavigate('plans')} sx={{ mr: 2 }}>
            <ArrowBackIcon />
          </IconButton>
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h4" component="h1">
              {plan.name}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {plan.daysPerWeek} days/week • {plan.duration} days
            </Typography>
          </Box>
        </Box>

        {/* Calendar Component */}
        <Paper sx={{ p: 2 }}>
          <Calendar
            workoutSessions={calendarSessions}
            onDayClick={handleDayClick}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          />
        </Paper>

        {/* Session Detail Dialog */}
        <Dialog 
          open={selectedDate !== null && selectedSession !== null} 
          onClose={handleCloseDialog}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6">
                {selectedDate && selectedDate.toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </Typography>
              <IconButton onClick={handleMenuOpen}>
                <MoreVertIcon />
              </IconButton>
            </Box>
          </DialogTitle>
          <DialogContent>
            {selectedSession && (
              <Box>
                <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                  <Chip 
                    label={getSessionTypeLabel(selectedSession.type)} 
                    color="primary"
                  />
                  <Chip 
                    label={selectedSession.status} 
                    color={getStatusColor(selectedSession.status)}
                    size="small"
                  />
                </Box>
                
                <Typography variant="body1" gutterBottom>
                  Session Type: {getSessionTypeLabel(selectedSession.type)}
                </Typography>
                
                {/* Show exercises list if available */}
                {selectedSession.exercises && selectedSession.exercises.length > 0 && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600 }}>
                      Exercises ({selectedSession.exercises.length}):
                    </Typography>
                    <Box sx={{ 
                      maxHeight: '200px', 
                      overflowY: 'auto',
                      bgcolor: 'background.default',
                      borderRadius: 1,
                      p: 1.5,
                    }}>
                      {selectedSession.exercises.map((exercise, index) => (
                        <Typography 
                          key={index} 
                          variant="body2" 
                          sx={{ 
                            py: 0.5,
                            color: 'text.secondary',
                          }}
                        >
                          {index + 1}. {exercise.name}
                        </Typography>
                      ))}
                    </Box>
                  </Box>
                )}
                
                {selectedSession.notes && (
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                    Notes: {selectedSession.notes}
                  </Typography>
                )}
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Close</Button>
            {selectedSession && selectedSession.status === 'planned' && (
              <Button 
                variant="contained" 
                color="primary"
                startIcon={<StartIcon />}
                onClick={handleStartSession}
              >
                Start Workout
              </Button>
            )}
          </DialogActions>
        </Dialog>

        {/* Session Options Menu */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
        >
          {selectedSession && ['upper', 'lower', 'full', 'push', 'pull', 'legs'].includes(selectedSession.type) && (
            <MenuItem onClick={handleEditRecurring}>
              <EditRecurringIcon sx={{ mr: 1 }} fontSize="small" />
              Edit Recurring Sessions
            </MenuItem>
          )}
          <MenuItem onClick={handleMoveSession}>
            <MoveIcon sx={{ mr: 1 }} fontSize="small" />
            Move to Different Date
          </MenuItem>
          <MenuItem onClick={handleSkipSession}>
            <EditIcon sx={{ mr: 1 }} fontSize="small" />
            Mark as Skipped
          </MenuItem>
          <MenuItem onClick={handleDeleteSession}>
            <DeleteIcon sx={{ mr: 1 }} fontSize="small" />
            Delete Session
          </MenuItem>
        </Menu>

        {/* Move Session Dialog */}
        <Dialog open={moveDialogOpen} onClose={() => setMoveDialogOpen(false)}>
          <DialogTitle>Move Session</DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2 }}>
              <DatePicker
                label="New Date"
                value={newDate}
                onChange={(date) => setNewDate(date)}
                slotProps={{
                  textField: {
                    fullWidth: true
                  }
                }}
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setMoveDialogOpen(false)}>Cancel</Button>
            <Button 
              onClick={handleConfirmMove} 
              variant="contained" 
              color="primary"
              disabled={!newDate}
            >
              Move
            </Button>
          </DialogActions>
        </Dialog>

        {/* Recurring Session Editor */}
        <RecurringSessionEditor
          open={editRecurringOpen}
          onClose={() => setEditRecurringOpen(false)}
          session={selectedSession}
          recurringCount={getRecurringSessionCount()}
          allExercises={allExercises}
          onSave={handleSaveRecurringEdits}
        />
      </Container>
    </LocalizationProvider>
  );
};

PlanCalendarScreen.propTypes = {
  onNavigate: PropTypes.func,
  onStartWorkout: PropTypes.func
};

export default PlanCalendarScreen;
