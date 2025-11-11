import { useState, useEffect, useMemo } from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Skeleton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stack,
  Chip,
} from '@mui/material';
import {
  PlayArrow,
  Settings,
  LocalFireDepartment,
  CheckCircle,
  FitnessCenter,
  CalendarMonth,
  Visibility,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { usePlanIntegration } from '../hooks/usePlanIntegration';
import { getWorkoutHistory } from '../utils/storage';
import { getWorkoutTypeDisplayName } from '../utils/weeklyPlanDefaults';
import CompactHeader from './Common/CompactHeader';

/**
 * HomeScreen - Unified home screen component
 * Mobile-first design with today's workout, stats, weekly calendar, and plan management
 */
const HomeScreen = ({ onNavigate, onStartWorkout }) => {
  // eslint-disable-next-line no-unused-vars
  const { currentUser } = useAuth();
  const {
    currentPlan,
    getTodaysWorkout,
    createWorkoutNavState,
    loading: planLoading,
  } = usePlanIntegration();

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [selectedDay, setSelectedDay] = useState(null);
  const [showDayModal, setShowDayModal] = useState(false);
  const [error, setError] = useState(null);

  // Load data on mount
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);
      try {
        const history = await getWorkoutHistory();

        // Calculate stats
        const calculatedStats = calculateStats(history, currentPlan);
        setStats(calculatedStats);
      } catch (err) {
        console.error('Error loading home screen data:', err);
        setError('Failed to load data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    if (!planLoading) {
      loadData();
    }
  }, [planLoading, currentPlan]);

  // Calculate stats from workout history
  const calculateStats = (history, plan) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Calculate streak (consecutive days with workouts)
    let streak = 0;
    const sortedHistory = [...history].sort((a, b) => new Date(b.date) - new Date(a.date));
    
    let currentDate = new Date(today);
    for (const workout of sortedHistory) {
      const workoutDate = new Date(workout.date);
      workoutDate.setHours(0, 0, 0, 0);
      
      // Check if workout is from currentDate
      if (workoutDate.getTime() === currentDate.getTime()) {
        streak++;
        currentDate.setDate(currentDate.getDate() - 1);
      } else if (workoutDate < currentDate) {
        // Gap in streak
        break;
      }
    }

    // Calculate plan completion percentage
    let completionPercentage = 0;
    if (plan && plan.sessions) {
      const completedSessions = plan.sessions.filter(session => {
        const sessionDate = new Date(session.date);
        sessionDate.setHours(0, 0, 0, 0);
        if (sessionDate > today) return false; // Future sessions don't count
        
        // Check if there's a workout for this session date
        return history.some(workout => {
          const workoutDate = new Date(workout.date);
          workoutDate.setHours(0, 0, 0, 0);
          return workoutDate.getTime() === sessionDate.getTime();
        });
      });
      
      const pastSessions = plan.sessions.filter(session => {
        const sessionDate = new Date(session.date);
        sessionDate.setHours(0, 0, 0, 0);
        return sessionDate <= today;
      });
      
      if (pastSessions.length > 0) {
        completionPercentage = Math.round((completedSessions.length / pastSessions.length) * 100);
      }
    }

    // Calculate workouts done this week
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay()); // Sunday
    startOfWeek.setHours(0, 0, 0, 0);
    
    const workoutsThisWeek = history.filter(workout => {
      const workoutDate = new Date(workout.date);
      return workoutDate >= startOfWeek && workoutDate <= today;
    }).length;

    // Get goal from plan or default to 3
    const weeklyGoal = plan?.daysPerWeek || 3;

    return {
      streak,
      completionPercentage,
      workoutsThisWeek,
      weeklyGoal,
    };
  };

  // Get today's workout
  const todaysWorkout = useMemo(() => {
    return getTodaysWorkout();
  }, [getTodaysWorkout]);

  // Get weekly calendar data (next 7 days)
  const weeklyCalendar = useMemo(() => {
    if (!currentPlan) return [];

    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const result = [];

    // If plan has sessions, show next 7 days
    if (currentPlan.sessions && Array.isArray(currentPlan.sessions)) {
      for (let i = 0; i < 7; i++) {
        const targetDate = new Date(today);
        targetDate.setDate(today.getDate() + i);
        targetDate.setHours(0, 0, 0, 0);

        const session = currentPlan.sessions.find(s => {
          const sessionDate = new Date(s.date);
          sessionDate.setHours(0, 0, 0, 0);
          return sessionDate.getTime() === targetDate.getTime();
        });

        result.push({
          date: targetDate,
          day: days[targetDate.getDay()],
          dayNum: targetDate.getDate(),
          type: session?.type || 'rest',
          focus: session?.focus,
          estimatedDuration: session?.estimatedDuration,
          isToday: targetDate.getTime() === today.getTime(),
        });
      }
    } else if (currentPlan.days) {
      // Handle weekly plan format
      for (let i = 0; i < 7; i++) {
        const targetDate = new Date(today);
        targetDate.setDate(today.getDate() + i);
        const dayOfWeek = targetDate.getDay();
        const dayPlan = currentPlan.days[dayOfWeek];

        result.push({
          date: targetDate,
          day: days[dayOfWeek],
          dayNum: targetDate.getDate(),
          type: dayPlan?.type || 'rest',
          focus: dayPlan?.focus,
          estimatedDuration: dayPlan?.estimatedDuration,
          isToday: targetDate.getTime() === today.getTime(),
        });
      }
    }

    return result;
  }, [currentPlan]);

  // Handle start workout
  const handleStartWorkout = () => {
    if (!todaysWorkout || todaysWorkout.type === 'rest') return;

    const navState = createWorkoutNavState(todaysWorkout);
    onStartWorkout(
      todaysWorkout.type,
      new Set(['all']),
      null,
      navState
    );
  };

  // Handle day tap
  const handleDayTap = (day) => {
    if (day.type === 'rest') return;
    setSelectedDay(day);
    setShowDayModal(true);
  };

  // Handle day modal actions
  const handleStartDayWorkout = () => {
    if (!selectedDay) return;
    const navState = createWorkoutNavState(selectedDay);
    setShowDayModal(false);
    onStartWorkout(
      selectedDay.type,
      new Set(['all']),
      null,
      navState
    );
  };

  const handlePreviewDay = () => {
    // Navigate to plan preview/editor
    setShowDayModal(false);
    onNavigate('workout-plan');
  };

  const handleCloseDayModal = () => {
    setShowDayModal(false);
    setSelectedDay(null);
  };

  // Handle edit plan
  const handleEditPlan = () => {
    onNavigate('workout-plan');
  };

  // Handle no plan - navigate to plan wizard
  const handleCreatePlan = () => {
    onNavigate('workout-plan');
  };

  // Render loading skeleton
  if (loading || planLoading) {
    return (
      <Box sx={{ px: 2, py: 3, maxWidth: 1200, mx: 'auto' }}>
        <CompactHeader title="Home" />
        <Stack spacing={2}>
          <Skeleton variant="rectangular" height={200} sx={{ borderRadius: 3 }} />
          <Box sx={{ display: 'flex', gap: 2, overflowX: 'auto' }}>
            <Skeleton variant="rectangular" width={150} height={120} sx={{ borderRadius: 2, flexShrink: 0 }} />
            <Skeleton variant="rectangular" width={150} height={120} sx={{ borderRadius: 2, flexShrink: 0 }} />
            <Skeleton variant="rectangular" width={150} height={120} sx={{ borderRadius: 2, flexShrink: 0 }} />
          </Box>
          <Skeleton variant="rectangular" height={250} sx={{ borderRadius: 3 }} />
        </Stack>
      </Box>
    );
  }

  // Render error state
  if (error) {
    return (
      <Box sx={{ px: 2, py: 3, maxWidth: 1200, mx: 'auto' }}>
        <CompactHeader title="Home" />
        <Card sx={{ p: 3, textAlign: 'center', borderRadius: 3 }}>
          <Typography color="error" gutterBottom>
            {error}
          </Typography>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </Card>
      </Box>
    );
  }

  // Render no plan state
  if (!currentPlan) {
    return (
      <Box sx={{ px: 2, py: 3, maxWidth: 1200, mx: 'auto' }}>
        <CompactHeader title="Home" />
        <Card sx={{ p: 4, textAlign: 'center', borderRadius: 3 }}>
          <FitnessCenter sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
          <Typography variant="h5" gutterBottom fontWeight={600}>
            Welcome to GoodLift!
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            Get started by creating your personalized workout plan.
          </Typography>
          <Button
            variant="contained"
            size="large"
            onClick={handleCreatePlan}
            sx={{ px: 4 }}
          >
            Create Your Plan
          </Button>
        </Card>
      </Box>
    );
  }

  const isRestDay = !todaysWorkout || todaysWorkout.type === 'rest';

  return (
    <Box sx={{ px: 2, py: 3, maxWidth: 1200, mx: 'auto', pb: 10 }}>
      <CompactHeader title="Home" />

      <Stack spacing={3}>
        {/* Today's Workout Section */}
        <Card
          sx={{
            borderRadius: 3,
            boxShadow: '0 4px 20px rgba(19, 70, 134, 0.1)',
            background: isRestDay
              ? 'linear-gradient(135deg, rgba(237, 63, 39, 0.05) 0%, rgba(19, 70, 134, 0.05) 100%)'
              : 'linear-gradient(135deg, rgba(19, 70, 134, 0.05) 0%, rgba(237, 63, 39, 0.05) 100%)',
          }}
        >
          <CardContent sx={{ p: 3 }}>
            <Typography
              variant="overline"
              sx={{
                color: 'primary.main',
                fontWeight: 700,
                letterSpacing: 1.2,
                display: 'block',
                mb: 1,
              }}
            >
              TODAY&apos;S WORKOUT
            </Typography>

            {isRestDay ? (
              <Box>
                <Typography variant="h4" fontWeight={700} sx={{ mb: 1 }}>
                  Rest Day
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                  Recovery is key to growth. Take it easy today!
                </Typography>
                <Button
                  variant="outlined"
                  startIcon={<CalendarMonth />}
                  onClick={handleEditPlan}
                  fullWidth
                  sx={{ py: 1.5 }}
                >
                  View Plan
                </Button>
              </Box>
            ) : (
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <Typography variant="h4" fontWeight={700}>
                    {getWorkoutTypeDisplayName(todaysWorkout.type)}
                  </Typography>
                  {todaysWorkout.focus && (
                    <Chip
                      label={todaysWorkout.focus}
                      size="small"
                      color="primary"
                      sx={{ textTransform: 'capitalize', fontWeight: 600 }}
                    />
                  )}
                </Box>
                
                {todaysWorkout.estimatedDuration && (
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Estimated: ~{todaysWorkout.estimatedDuration} min
                  </Typography>
                )}

                <Button
                  variant="contained"
                  startIcon={<PlayArrow />}
                  onClick={handleStartWorkout}
                  fullWidth
                  size="large"
                  sx={{
                    py: 2,
                    fontSize: '1.1rem',
                    fontWeight: 700,
                    borderRadius: 2,
                    boxShadow: '0 4px 12px rgba(19, 70, 134, 0.3)',
                  }}
                >
                  Start Workout
                </Button>
              </Box>
            )}
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <Box
          sx={{
            display: 'flex',
            gap: 2,
            overflowX: 'auto',
            pb: 1,
            '&::-webkit-scrollbar': {
              height: 6,
            },
            '&::-webkit-scrollbar-track': {
              background: 'transparent',
            },
            '&::-webkit-scrollbar-thumb': {
              background: 'rgba(0, 0, 0, 0.2)',
              borderRadius: 3,
            },
          }}
        >
          {/* Streak Card */}
          <Card
            sx={{
              minWidth: 150,
              flexShrink: 0,
              borderRadius: 2,
              cursor: 'pointer',
              transition: 'transform 0.2s',
              '&:hover': {
                transform: 'translateY(-4px)',
              },
            }}
            onClick={() => onNavigate('progress')}
          >
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <LocalFireDepartment sx={{ fontSize: 40, color: 'error.main', mb: 1 }} />
              <Typography variant="h4" fontWeight={700}>
                {stats?.streak || 0}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase' }}>
                Day Streak
              </Typography>
            </CardContent>
          </Card>

          {/* Plan Completion Card */}
          <Card
            sx={{
              minWidth: 150,
              flexShrink: 0,
              borderRadius: 2,
              cursor: 'pointer',
              transition: 'transform 0.2s',
              '&:hover': {
                transform: 'translateY(-4px)',
              },
            }}
            onClick={() => onNavigate('progress')}
          >
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <CheckCircle sx={{ fontSize: 40, color: 'success.main', mb: 1 }} />
              <Typography variant="h4" fontWeight={700}>
                {stats?.completionPercentage || 0}%
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase' }}>
                Plan Complete
              </Typography>
            </CardContent>
          </Card>

          {/* Workouts This Week Card */}
          <Card
            sx={{
              minWidth: 150,
              flexShrink: 0,
              borderRadius: 2,
              cursor: 'pointer',
              transition: 'transform 0.2s',
              '&:hover': {
                transform: 'translateY(-4px)',
              },
            }}
            onClick={() => onNavigate('progress')}
          >
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <FitnessCenter sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
              <Typography variant="h4" fontWeight={700}>
                {stats?.workoutsThisWeek || 0}/{stats?.weeklyGoal || 3}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase' }}>
                This Week
              </Typography>
            </CardContent>
          </Card>
        </Box>

        {/* Weekly Calendar */}
        <Card sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(19, 70, 134, 0.1)' }}>
          <CardContent sx={{ p: 2 }}>
            <Typography
              variant="overline"
              sx={{
                color: 'primary.main',
                fontWeight: 700,
                letterSpacing: 1.2,
                display: 'block',
                mb: 2,
              }}
            >
              THIS WEEK
            </Typography>

            <Box
              sx={{
                display: 'flex',
                gap: 1,
                overflowX: 'auto',
                pb: 1,
              }}
            >
              {weeklyCalendar.map((day, index) => {
                const isRest = day.type === 'rest';
                return (
                  <Box
                    key={index}
                    onClick={() => handleDayTap(day)}
                    sx={{
                      minWidth: 80,
                      flexShrink: 0,
                      p: 1.5,
                      borderRadius: 2,
                      textAlign: 'center',
                      cursor: isRest ? 'default' : 'pointer',
                      bgcolor: day.isToday
                        ? 'primary.main'
                        : isRest
                        ? 'action.hover'
                        : 'background.paper',
                      border: '1px solid',
                      borderColor: day.isToday
                        ? 'primary.main'
                        : 'divider',
                      transition: 'all 0.2s',
                      '&:hover': !isRest && {
                        transform: 'translateY(-2px)',
                        boxShadow: 2,
                      },
                    }}
                  >
                    <Typography
                      variant="caption"
                      sx={{
                        color: day.isToday ? 'primary.contrastText' : 'text.secondary',
                        fontWeight: 600,
                        display: 'block',
                        mb: 0.5,
                      }}
                    >
                      {day.day}
                    </Typography>
                    <Typography
                      variant="h6"
                      sx={{
                        color: day.isToday ? 'primary.contrastText' : 'text.primary',
                        fontWeight: 700,
                        mb: 0.5,
                      }}
                    >
                      {day.dayNum}
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{
                        color: day.isToday
                          ? 'primary.contrastText'
                          : isRest
                          ? 'text.disabled'
                          : 'text.primary',
                        fontWeight: 500,
                        fontSize: '0.65rem',
                        textTransform: 'capitalize',
                      }}
                    >
                      {isRest ? 'Rest' : day.type}
                    </Typography>
                  </Box>
                );
              })}
            </Box>
          </CardContent>
        </Card>

        {/* Edit This Week Button */}
        <Button
          variant="outlined"
          startIcon={<Settings />}
          onClick={handleEditPlan}
          fullWidth
          sx={{
            py: 1.5,
            borderRadius: 2,
            fontWeight: 600,
          }}
        >
          Edit This Week
        </Button>
      </Stack>

      {/* Day Preview Modal */}
      <Dialog
        open={showDayModal}
        onClose={handleCloseDayModal}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>
          {selectedDay && (
            <Box>
              <Typography variant="h6" fontWeight={700}>
                {selectedDay.day}, {selectedDay.dayNum}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {getWorkoutTypeDisplayName(selectedDay.type)}
                {selectedDay.focus && ` - ${selectedDay.focus}`}
              </Typography>
            </Box>
          )}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2}>
            {selectedDay?.estimatedDuration && (
              <Typography variant="body2" color="text.secondary">
                Estimated duration: ~{selectedDay.estimatedDuration} min
              </Typography>
            )}

            <Button
              variant="contained"
              startIcon={<PlayArrow />}
              onClick={handleStartDayWorkout}
              fullWidth
              size="large"
            >
              Start
            </Button>

            <Button
              variant="outlined"
              startIcon={<Visibility />}
              onClick={handlePreviewDay}
              fullWidth
            >
              Preview
            </Button>

            {/* Note: Move and Skip functionality would require more complex plan editing */}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDayModal}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

HomeScreen.propTypes = {
  onNavigate: PropTypes.func.isRequired,
  onStartWorkout: PropTypes.func.isRequired,
};

export default HomeScreen;
