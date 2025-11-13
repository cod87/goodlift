import { memo, useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { 
  Box, 
  Card, 
  CardContent, 
  Typography, 
  Button, 
  Stack,
  Chip,
  Grid,
  Snackbar,
  Alert,
} from '@mui/material';
import { 
  PlayArrow, 
  CalendarToday,
  TrendingUp
} from '@mui/icons-material';
import { getWorkoutTypeDisplayName, getWorkoutTypeShorthand } from '../../utils/weeklyPlanDefaults';
import { getWorkoutHistory, resetCurrentStreak, saveWorkoutPlan, getActivePlan } from '../../utils/storage';
import { touchTargets } from '../../theme/responsive';
import { useUserProfile } from '../../contexts/UserProfileContext';
import MonthCalendarView from '../Calendar/MonthCalendarView';
import WorkoutDayDialog from '../Calendar/WorkoutDayDialog';
import EditWorkoutDialog from '../Calendar/EditWorkoutDialog';
import StreakWarningDialog from '../Calendar/StreakWarningDialog';
import RecurringSessionEditor from '../RecurringSessionEditor';
import { getRecurringSessionsInBlock, updateRecurringSessionExercises, removeSessionFromPlan, updateSessionStatus, moveSession } from '../../utils/workoutPlanGenerator';

/**
 * UpcomingWeekTab - Shows today's workout and next 6 days schedule
 * Displays current day at the far left
 */
const UpcomingWeekTab = memo(({ 
  currentPlan,
  todaysWorkout,
  onQuickStart,
  onNavigate,
  loading = false
}) => {
  const [currentDate, setCurrentDate] = useState('');
  const [recentWorkouts, setRecentWorkouts] = useState([]);
  const [workoutHistory, setWorkoutHistory] = useState([]);
  const [activePlan, setActivePlan] = useState(null);
  const { stats, refreshStats } = useUserProfile();
  
  // Dialog states
  const [dayDialogOpen, setDayDialogOpen] = useState(false);
  const [editWorkoutDialogOpen, setEditWorkoutDialogOpen] = useState(false);
  const [recurringEditorOpen, setRecurringEditorOpen] = useState(false);
  const [singleSessionEditorOpen, setSingleSessionEditorOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedWorkout, setSelectedWorkout] = useState(null);
  const [selectedSessionId, setSelectedSessionId] = useState(null);
  const [recurringCount, setRecurringCount] = useState(0);
  const [streakWarningOpen, setStreakWarningOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [allExercises, setAllExercises] = useState([]);

  // Use activePlan if available, otherwise fall back to currentPlan from props
  const displayPlan = activePlan || currentPlan;

  // Set current date
  useEffect(() => {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    setCurrentDate(new Date().toLocaleDateString('en-US', options));
  }, []);

  // Load workout history
  useEffect(() => {
    const loadRecentWorkouts = async () => {
      try {
        const history = await getWorkoutHistory();
        setWorkoutHistory(history);
        setRecentWorkouts(history.slice(0, 5));
      } catch (error) {
        console.error('Error loading recent workouts:', error);
      }
    };

    loadRecentWorkouts();
  }, []);

  // Load exercises database
  useEffect(() => {
    const loadExercises = async () => {
      try {
        const response = await fetch(`${import.meta.env.BASE_URL}data/exercises.json`);
        if (response.ok) {
          const data = await response.json();
          setAllExercises(data);
        }
      } catch (error) {
        console.error('Error loading exercises:', error);
      }
    };

    loadExercises();
  }, []);

  // Load active plan to local state
  const loadActivePlan = async () => {
    try {
      const plan = await getActivePlan();
      setActivePlan(plan);
    } catch (error) {
      console.error('Error loading active plan:', error);
    }
  };

  // Load plan on mount
  useEffect(() => {
    loadActivePlan();
  }, []);

  const hasToday = todaysWorkout && todaysWorkout.type !== 'rest';
  const planName = displayPlan?.planStyle 
    ? displayPlan.planStyle.toUpperCase().replace('_', ' ')
    : 'Weekly Plan';

  // Format duration helper
  const formatDuration = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  // Get next 7 days (current day + next 6 days)
  const getNext7Days = () => {
    if (!displayPlan) {
      return [];
    }

    const today = new Date();
    const next7Days = [];

    // Handle session-based plans
    if (displayPlan.sessions && Array.isArray(displayPlan.sessions)) {
      for (let i = 0; i < 7; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() + i);
        date.setHours(0, 0, 0, 0);
        
        const session = displayPlan.sessions.find(s => {
          const sessionDate = new Date(s.date);
          sessionDate.setHours(0, 0, 0, 0);
          return sessionDate.getTime() === date.getTime();
        });
        
        if (session) {
          next7Days.push({
            date: date,
            dayIndex: date.getDay(),
            isToday: i === 0,
            type: session.type,
            status: session.status,
            ...session
          });
        } else {
          // No session for this day - it's a rest day
          next7Days.push({
            date: date,
            dayIndex: date.getDay(),
            isToday: i === 0,
            type: 'rest'
          });
        }
      }
      return next7Days;
    }

    // Handle day-based plans
    if (displayPlan.days && Array.isArray(displayPlan.days)) {
      for (let i = 0; i < 7; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() + i);
        const dayIndex = date.getDay();
        
        const dayData = displayPlan.days[dayIndex] || { type: 'rest' };
        
        next7Days.push({
          date: date,
          dayIndex: dayIndex,
          isToday: i === 0,
          ...dayData
        });
      }
      return next7Days;
    }

    return [];
  };

  const next7Days = getNext7Days();

  // Handler for calendar day click
  const handleDayClick = (date, workout) => {
    if (!workout || workout.type === 'rest') return;
    setSelectedDate(date);
    setSelectedWorkout(workout);
    
    // Find the session ID for this date
    if (displayPlan?.sessions) {
      const clickedDate = new Date(date);
      clickedDate.setHours(0, 0, 0, 0);
      
      const session = displayPlan.sessions.find(s => {
        const sessionDate = new Date(s.date);
        sessionDate.setHours(0, 0, 0, 0);
        return sessionDate.getTime() === clickedDate.getTime();
      });
      
      if (session) {
        setSelectedSessionId(session.id);
      }
    }
    
    setDayDialogOpen(true);
  };

  // Handler for closing day dialog
  const handleCloseDayDialog = () => {
    setDayDialogOpen(false);
    setSelectedDate(null);
    setSelectedWorkout(null);
    setSelectedSessionId(null);
  };

  // Handler for edit workout
  const handleEditWorkout = () => {
    handleCloseDayDialog();
    
    // Find the session ID for this workout
    if (!displayPlan?.sessions) {
      setSnackbar({
        open: true,
        message: 'No active plan found',
        severity: 'error',
      });
      return;
    }

    // Find session for the selected date
    const sessionDate = new Date(selectedDate);
    sessionDate.setHours(0, 0, 0, 0);
    
    const session = displayPlan.sessions.find(s => {
      const sDate = new Date(s.date);
      sDate.setHours(0, 0, 0, 0);
      return sDate.getTime() === sessionDate.getTime();
    });

    if (!session) {
      setSnackbar({
        open: true,
        message: 'Session not found',
        severity: 'error',
      });
      return;
    }

    // Get recurring sessions count
    const recurringSessions = getRecurringSessionsInBlock(displayPlan, session.id);
    setRecurringCount(recurringSessions.length);
    setSelectedSessionId(session.id);
    
    // Show edit scope dialog
    setEditWorkoutDialogOpen(true);
  };

  // Handler for closing edit workout dialog
  const handleCloseEditWorkoutDialog = () => {
    setEditWorkoutDialogOpen(false);
  };

  // Handler for editing single session
  const handleEditSingle = () => {
    setEditWorkoutDialogOpen(false);
    
    // Find the session
    const session = displayPlan.sessions.find(s => s.id === selectedSessionId);
    if (session && session.exercises) {
      setSingleSessionEditorOpen(true);
    } else {
      setSnackbar({
        open: true,
        message: 'No exercises found for this session',
        severity: 'error',
      });
    }
  };

  // Handler for closing single session editor
  const handleCloseSingleSessionEditor = () => {
    setSingleSessionEditorOpen(false);
  };

  // Handler for saving single session changes
  const handleSaveSingleSessionChanges = async (newExercises) => {
    setSingleSessionEditorOpen(false);
    
    try {
      // Update only the specific session's exercises
      const updatedSessions = displayPlan.sessions.map(session => {
        if (session.id === selectedSessionId) {
          return {
            ...session,
            exercises: newExercises
          };
        }
        return session;
      });
      
      const updatedPlan = {
        ...displayPlan,
        sessions: updatedSessions,
        modified: Date.now()
      };
      
      // Save the updated plan to storage
      await saveWorkoutPlan(updatedPlan);
      
      // Reload the plan to refresh the UI
      await loadActivePlan();
      
      setSnackbar({
        open: true,
        message: 'Session updated successfully!',
        severity: 'success',
      });
    } catch (error) {
      console.error('Error saving single session changes:', error);
      setSnackbar({
        open: true,
        message: 'Failed to save changes. Please try again.',
        severity: 'error',
      });
    }
  };

  // Handler for editing recurring sessions
  const handleEditRecurring = () => {
    setEditWorkoutDialogOpen(false);
    
    // Find the session
    const session = displayPlan.sessions.find(s => s.id === selectedSessionId);
    if (session && session.exercises) {
      setRecurringEditorOpen(true);
    } else {
      setSnackbar({
        open: true,
        message: 'No exercises found for this session',
        severity: 'error',
      });
    }
  };

  // Handler for closing recurring editor
  const handleCloseRecurringEditor = () => {
    setRecurringEditorOpen(false);
  };

  // Handler for saving recurring session changes
  const handleSaveRecurringChanges = async (newExercises) => {
    setRecurringEditorOpen(false);
    
    try {
      // Update the plan with new exercises for all recurring sessions
      const updatedPlan = updateRecurringSessionExercises(displayPlan, selectedSessionId, newExercises);
      
      // Save the updated plan to storage
      await saveWorkoutPlan(updatedPlan);
      
      // Reload the plan to refresh the UI
      await loadActivePlan();
      
      setSnackbar({
        open: true,
        message: 'Recurring sessions updated successfully!',
        severity: 'success',
      });
    } catch (error) {
      console.error('Error saving recurring session changes:', error);
      setSnackbar({
        open: true,
        message: 'Failed to save changes. Please try again.',
        severity: 'error',
      });
    }
  };

  // Handler for delete workout
  const handleDeleteWorkout = async () => {
    handleCloseDayDialog();
    
    if (!displayPlan?.sessions || !selectedSessionId) {
      setSnackbar({
        open: true,
        message: 'Unable to delete workout',
        severity: 'error',
      });
      return;
    }
    
    // Confirm deletion
    if (!window.confirm('Are you sure you want to delete this workout? This action cannot be undone.')) {
      return;
    }
    
    try {
      // Remove the session from the plan
      const updatedPlan = removeSessionFromPlan(displayPlan, selectedSessionId);
      
      // Save the updated plan to storage
      await saveWorkoutPlan(updatedPlan);
      
      // Reload the plan to refresh the UI
      await loadActivePlan();
      
      setSnackbar({
        open: true,
        message: 'Workout deleted successfully',
        severity: 'success',
      });
    } catch (error) {
      console.error('Error deleting workout:', error);
      setSnackbar({
        open: true,
        message: 'Failed to delete workout. Please try again.',
        severity: 'error',
      });
    }
  };

  // Handler for skip workout
  const handleSkipWorkout = () => {
    handleCloseDayDialog();
    const currentStreak = stats?.currentStreak || 0;
    
    if (currentStreak > 0) {
      setPendingAction({ type: 'skip' });
      setStreakWarningOpen(true);
    } else {
      executeSkip();
    }
  };

  // Execute skip action
  const executeSkip = async () => {
    if (!displayPlan?.sessions || !selectedSessionId) {
      setSnackbar({
        open: true,
        message: 'Unable to skip workout',
        severity: 'error',
      });
      return;
    }
    
    try {
      // Update the session status to 'skipped'
      const updatedPlan = updateSessionStatus(displayPlan, selectedSessionId, 'skipped');
      
      // Save the updated plan to storage
      await saveWorkoutPlan(updatedPlan);
      
      // Reset streak and reload plan
      await resetCurrentStreak();
      if (refreshStats) await refreshStats();
      await loadActivePlan();
      
      setSnackbar({
        open: true,
        message: 'Workout skipped. Streak reset.',
        severity: 'warning',
      });
    } catch (error) {
      console.error('Error skipping workout:', error);
      setSnackbar({
        open: true,
        message: 'Error skipping workout',
        severity: 'error',
      });
    }
  };

  // Handler for defer workout
  const handleDeferWorkout = () => {
    handleCloseDayDialog();
    const currentStreak = stats?.currentStreak || 0;
    
    if (currentStreak > 0) {
      setPendingAction({ type: 'defer' });
      setStreakWarningOpen(true);
    } else {
      executeDefer();
    }
  };

  // Execute defer action
  const executeDefer = async () => {
    if (!displayPlan?.sessions || !selectedSessionId) {
      setSnackbar({
        open: true,
        message: 'Unable to defer workout',
        severity: 'error',
      });
      return;
    }
    
    try {
      // Find the session to defer
      const session = displayPlan.sessions.find(s => s.id === selectedSessionId);
      if (!session) {
        throw new Error('Session not found');
      }
      
      // Calculate next day's date
      const currentDate = new Date(session.date);
      const nextDate = new Date(currentDate);
      nextDate.setDate(nextDate.getDate() + 1);
      
      // Move the session to next day
      const updatedPlan = moveSession(displayPlan, selectedSessionId, nextDate);
      
      // Save the updated plan to storage
      await saveWorkoutPlan(updatedPlan);
      
      // Reset streak and reload plan
      await resetCurrentStreak();
      if (refreshStats) await refreshStats();
      await loadActivePlan();
      
      setSnackbar({
        open: true,
        message: 'Workout deferred to tomorrow. Streak reset.',
        severity: 'warning',
      });
    } catch (error) {
      console.error('Error deferring workout:', error);
      setSnackbar({
        open: true,
        message: 'Error deferring workout',
        severity: 'error',
      });
    }
  };

  // Handler for streak warning confirmation
  const handleStreakWarningConfirm = async () => {
    setStreakWarningOpen(false);
    
    if (pendingAction?.type === 'skip') {
      await executeSkip();
    } else if (pendingAction?.type === 'defer') {
      await executeDefer();
    }
    
    setPendingAction(null);
  };

  // Handler for streak warning cancel
  const handleStreakWarningCancel = () => {
    setStreakWarningOpen(false);
    setPendingAction(null);
  };

  // Handler for snackbar close
  const handleSnackbarClose = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  return (
    <Box>
      {/* Date Section */}
      <Box sx={{ mb: 4, textAlign: 'center' }}>
        <Typography 
          variant="h5" 
          sx={{ 
            fontWeight: 600,
            color: 'text.secondary',
            fontSize: { xs: '1rem', sm: '1.25rem' }
          }}
        >
          {currentDate}
        </Typography>
      </Box>

      {/* Main Workout Card */}
      <Card 
        elevation={2}
        sx={{ 
          mb: 3,
          borderRadius: 3,
          background: 'linear-gradient(135deg, rgba(19, 70, 134, 0.05) 0%, rgba(237, 63, 39, 0.05) 100%)',
        }}
      >
        <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
          {/* Plan Header */}
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <CalendarToday sx={{ color: 'primary.main', mr: 1 }} />
            <Typography 
              variant="overline" 
              sx={{ 
                color: 'primary.main',
                fontWeight: 600,
                letterSpacing: 1,
              }}
            >
              {planName}
            </Typography>
          </Box>

          {/* Today's Session */}
          {hasToday ? (
            <>
              <Typography 
                variant="h4" 
                sx={{ 
                  fontWeight: 700, 
                  color: 'text.primary', 
                  mb: 2,
                  fontSize: { xs: '1.75rem', sm: '2.125rem' }
                }}
              >
                {getWorkoutTypeDisplayName(todaysWorkout.type)}
                {todaysWorkout.focus && (
                  <Chip 
                    label={todaysWorkout.focus}
                    size="small"
                    sx={{ ml: 1, textTransform: 'capitalize' }}
                  />
                )}
              </Typography>

              {todaysWorkout.estimatedDuration && (
                <Typography variant="body1" sx={{ color: 'text.secondary', mb: 3 }}>
                  Estimated Duration: ~{todaysWorkout.estimatedDuration} min
                </Typography>
              )}

              {/* CTA Button */}
              <Button
                variant="contained"
                size="large"
                fullWidth
                startIcon={<PlayArrow />}
                onClick={onQuickStart}
                disabled={loading}
                sx={{ 
                  minHeight: touchTargets.navigation,
                  fontSize: { xs: '1.1rem', sm: '1.25rem' },
                  fontWeight: 700,
                  backgroundColor: 'primary.main',
                  '&:hover': {
                    backgroundColor: 'primary.dark',
                  },
                  textTransform: 'uppercase',
                  letterSpacing: 1,
                }}
              >
                Start Today&apos;s Workout
              </Button>
            </>
          ) : (
            <>
              <Typography variant="h4" sx={{ fontWeight: 700, color: 'text.primary', mb: 2 }}>
                Rest Day
              </Typography>
              <Typography variant="body1" sx={{ color: 'text.secondary', mb: 2 }}>
                Recovery is essential for growth. Take it easy today!
              </Typography>
            </>
          )}
        </CardContent>
      </Card>

      {/* Upcoming Week Schedule - Current day + next 6 days */}
      {next7Days.length > 0 && (
        <Card 
          elevation={2}
          sx={{ 
            mb: 3,
            borderRadius: 3,
          }}
        >
          <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
            <Typography 
              variant="h6" 
              sx={{ 
                fontWeight: 600, 
                color: 'text.primary',
                mb: 2
              }}
            >
              Upcoming Week
            </Typography>
            <Box 
              sx={{ 
                display: 'flex',
                gap: 2,
                overflowX: 'auto',
                pb: 1,
                '&::-webkit-scrollbar': {
                  height: '8px',
                },
                '&::-webkit-scrollbar-track': {
                  backgroundColor: 'rgba(0,0,0,0.1)',
                  borderRadius: '4px',
                },
                '&::-webkit-scrollbar-thumb': {
                  backgroundColor: 'rgba(0,0,0,0.3)',
                  borderRadius: '4px',
                  '&:hover': {
                    backgroundColor: 'rgba(0,0,0,0.4)',
                  },
                },
              }}
            >
              {next7Days.map((day, index) => {
                const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
                const isToday = day.isToday;
                const dateObj = day.date instanceof Date ? day.date : new Date(day.date);
                
                return (
                  <Box 
                    key={index}
                    sx={{ 
                      minWidth: '120px',
                      display: 'flex',
                      flexDirection: 'column',
                      p: 1.5,
                      borderRadius: 2,
                      bgcolor: isToday ? 'action.selected' : 'action.hover',
                      border: isToday ? '2px solid' : '1px solid',
                      borderColor: isToday ? 'primary.main' : 'divider',
                    }}
                  >
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        fontWeight: isToday ? 700 : 600,
                        color: 'text.secondary',
                        mb: 0.5,
                        textAlign: 'center',
                        fontSize: '0.75rem',
                      }}
                    >
                      {dayNames[day.dayIndex]}
                    </Typography>
                    <Typography 
                      variant="caption" 
                      sx={{ 
                        color: 'text.secondary',
                        mb: 1,
                        textAlign: 'center',
                      }}
                    >
                      {dateObj.getMonth() + 1}/{dateObj.getDate()}
                    </Typography>
                    {isToday && (
                      <Chip 
                        label="Today" 
                        size="small" 
                        color="primary"
                        sx={{ fontWeight: 600, mb: 1, alignSelf: 'center', height: 20, fontSize: '0.65rem' }}
                      />
                    )}
                    {/* Show shorthand for strength workouts, full name for others */}
                    {day.type === 'rest' ? (
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          color: 'text.secondary',
                          fontWeight: 400,
                          textAlign: 'center',
                          mt: isToday ? 0 : 1.5,
                          fontSize: '0.875rem',
                        }}
                      >
                        Rest
                      </Typography>
                    ) : ['upper', 'lower', 'push', 'pull', 'legs', 'full'].includes(day.type) ? (
                      <Chip
                        label={getWorkoutTypeShorthand(day.type)}
                        size="small"
                        sx={{ 
                          alignSelf: 'center',
                          fontWeight: 700,
                          bgcolor: 'primary.main',
                          color: 'primary.contrastText',
                          mt: isToday ? 0 : 1.5,
                          fontSize: '0.75rem',
                          minWidth: '44px',
                        }}
                      />
                    ) : (
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          color: 'text.primary',
                          fontWeight: 600,
                          textAlign: 'center',
                          mt: isToday ? 0 : 1.5,
                          fontSize: '0.875rem',
                        }}
                      >
                        {getWorkoutTypeDisplayName(day.type)}
                      </Typography>
                    )}
                  </Box>
                );
              })}
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Recent Workout History */}
      {recentWorkouts.length > 0 && (
        <Card 
          elevation={2}
          sx={{ 
            mb: 3,
            borderRadius: 3,
          }}
        >
          <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
              <Typography 
                variant="h6" 
                sx={{ 
                  fontWeight: 600, 
                  color: 'text.primary',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1
                }}
              >
                <TrendingUp /> Recent Workouts
              </Typography>
              <Button
                size="small"
                onClick={() => onNavigate('progress')}
                sx={{ color: 'primary.main' }}
              >
                View All
              </Button>
            </Stack>
            <Stack spacing={1.5}>
              {recentWorkouts.map((workout, index) => (
                <Box 
                  key={index}
                  sx={{ 
                    p: 2, 
                    bgcolor: 'background.default', 
                    borderRadius: 2,
                    borderLeft: '4px solid',
                    borderLeftColor: 'primary.main',
                  }}
                >
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Box>
                      <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                        {workout.type?.charAt(0).toUpperCase() + workout.type?.slice(1) || 'Workout'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {new Date(workout.date).toLocaleDateString('en-US', { 
                          weekday: 'short', 
                          month: 'short', 
                          day: 'numeric' 
                        })}
                      </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      {formatDuration(workout.duration || 0)}
                    </Typography>
                  </Stack>
                </Box>
              ))}
            </Stack>
          </CardContent>
        </Card>
      )}

      {/* Month Calendar View */}
      <Box sx={{ mb: 3 }}>
        <MonthCalendarView
          currentPlan={displayPlan}
          workoutHistory={workoutHistory}
          onDayClick={handleDayClick}
        />
      </Box>

      {/* Workout Day Dialog */}
      <WorkoutDayDialog
        open={dayDialogOpen}
        date={selectedDate}
        workout={selectedWorkout}
        onClose={handleCloseDayDialog}
        onEdit={handleEditWorkout}
        onDelete={handleDeleteWorkout}
        onSkip={handleSkipWorkout}
        onDefer={handleDeferWorkout}
      />

      {/* Edit Workout Dialog - Choose edit scope */}
      <EditWorkoutDialog
        open={editWorkoutDialogOpen}
        date={selectedDate}
        workout={selectedWorkout}
        recurringCount={recurringCount}
        onClose={handleCloseEditWorkoutDialog}
        onEditSingle={handleEditSingle}
        onEditRecurring={handleEditRecurring}
      />

      {/* Recurring Session Editor */}
      {displayPlan?.sessions && selectedSessionId && (
        <RecurringSessionEditor
          open={recurringEditorOpen}
          onClose={handleCloseRecurringEditor}
          session={displayPlan.sessions.find(s => s.id === selectedSessionId)}
          recurringCount={recurringCount}
          allExercises={allExercises}
          onSave={handleSaveRecurringChanges}
        />
      )}

      {/* Single Session Editor */}
      {displayPlan?.sessions && selectedSessionId && (
        <RecurringSessionEditor
          open={singleSessionEditorOpen}
          onClose={handleCloseSingleSessionEditor}
          session={displayPlan.sessions.find(s => s.id === selectedSessionId)}
          recurringCount={1}
          allExercises={allExercises}
          onSave={handleSaveSingleSessionChanges}
        />
      )}

      {/* Streak Warning Dialog */}
      <StreakWarningDialog
        open={streakWarningOpen}
        currentStreak={stats?.currentStreak || 0}
        action={pendingAction?.type || 'skip'}
        onConfirm={handleStreakWarningConfirm}
        onCancel={handleStreakWarningCancel}
      />

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleSnackbarClose} 
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
});

UpcomingWeekTab.displayName = 'UpcomingWeekTab';

UpcomingWeekTab.propTypes = {
  currentPlan: PropTypes.shape({
    planId: PropTypes.string,
    planStyle: PropTypes.string,
    days: PropTypes.arrayOf(PropTypes.shape({
      type: PropTypes.string,
      subtype: PropTypes.string,
      focus: PropTypes.string,
      estimatedDuration: PropTypes.number,
    })),
  }),
  todaysWorkout: PropTypes.shape({
    type: PropTypes.string,
    focus: PropTypes.string,
    estimatedDuration: PropTypes.number,
  }),
  onQuickStart: PropTypes.func.isRequired,
  onNavigate: PropTypes.func,
  loading: PropTypes.bool,
};

export default UpcomingWeekTab;
