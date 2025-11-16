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
  Grid
} from '@mui/material';
import { 
  PlayArrow, 
  CalendarToday,
  Add,
  Timer,
  ViewList,
  TrendingUp
} from '@mui/icons-material';
import { getWorkoutTypeDisplayName } from '../utils/workoutTypeHelpers';
import { getWorkoutHistory } from '../utils/storage';
import { containerPadding, touchTargets } from '../theme/responsive';
import WellnessTaskCard from './WellnessTaskCard';

/**
 * HomeScreen - Quick-start interface component (Work Tab)
 * Features:
 * - Prominent "Start Today's Workout" button
 * - Secondary action buttons: Create Plan, Quick Timer, View Plans
 * - Current plan name display
 * - Today's scheduled sessions
 * - Recent workout history (3-5 sessions)
 * - Weekly schedule overview
 */
const HomeScreen = memo(({ 
  currentPlan,
  todaysWorkout,
  onQuickStart,
  onNavigate,
  loading = false
}) => {
  const [currentDate, setCurrentDate] = useState('');
  const [recentWorkouts, setRecentWorkouts] = useState([]);

  // Set current date
  useEffect(() => {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    setCurrentDate(new Date().toLocaleDateString('en-US', options));
  }, []);

  // Load recent workouts
  useEffect(() => {
    const loadRecentWorkouts = async () => {
      try {
        const workoutHistory = await getWorkoutHistory();
        // Get recent workouts (last 3-5)
        setRecentWorkouts(workoutHistory.slice(0, 5));
      } catch (error) {
        console.error('Error loading recent workouts:', error);
      }
    };

    loadRecentWorkouts();
  }, []);

  const hasToday = todaysWorkout && todaysWorkout.type !== 'rest';
  const planName = currentPlan?.planStyle 
    ? currentPlan.planStyle.toUpperCase().replace('_', ' ')
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

  return (
    <Box 
      sx={{ 
        padding: { 
          xs: containerPadding.mobile, 
          sm: containerPadding.tablet, 
          md: containerPadding.desktop 
        },
        maxWidth: '1200px',
        margin: '0 auto',
        minHeight: 'calc(100vh - 60px)',
        paddingBottom: { xs: '80px', md: '2rem' }, // Extra padding for mobile bottom nav
      }}
    >
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

              {/* CTA Button - Prominent, min 56px height, full-width on mobile */}
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

      {/* Wellness Task Card */}
      <Box sx={{ mb: 3 }}>
        <WellnessTaskCard type="daily" />
      </Box>

      {/* Secondary Actions - Quick Access Buttons */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={4}>
          <Button
            variant="outlined"
            fullWidth
            startIcon={<Add />}
            onClick={() => onNavigate('selection')}
            sx={{ 
              py: 1.5,
              fontSize: '0.95rem',
              fontWeight: 600,
            }}
          >
            Create Plan
          </Button>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Button
            variant="outlined"
            fullWidth
            startIcon={<Timer />}
            onClick={() => onNavigate('timer')}
            sx={{ 
              py: 1.5,
              fontSize: '0.95rem',
              fontWeight: 600,
            }}
          >
            Quick Timer
          </Button>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Button
            variant="outlined"
            fullWidth
            startIcon={<ViewList />}
            onClick={() => onNavigate('workout-plan')}
            sx={{ 
              py: 1.5,
              fontSize: '0.95rem',
              fontWeight: 600,
            }}
          >
            View Plans
          </Button>
        </Grid>
      </Grid>

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

      {/* Weekly Overview */}
      {currentPlan && currentPlan.sessions && (
        <Card 
          elevation={2}
          sx={{ 
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
              This Week&apos;s Schedule
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
              {(() => {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const next7Days = [];
                
                for (let i = 0; i < 7; i++) {
                  const date = new Date(today);
                  date.setDate(today.getDate() + i);
                  date.setHours(0, 0, 0, 0);
                  
                  const session = currentPlan.sessions.find(s => {
                    const sessionDate = new Date(s.date);
                    sessionDate.setHours(0, 0, 0, 0);
                    return sessionDate.getTime() === date.getTime();
                  });
                  
                  next7Days.push({
                    date,
                    session: session || { type: 'rest' },
                    isToday: i === 0
                  });
                }
                
                return next7Days.map((item, index) => {
                  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                  const dayName = dayNames[item.date.getDay()];
                  
                  return (
                    <Box 
                      key={index}
                      sx={{ 
                        minWidth: '140px',
                        display: 'flex',
                        flexDirection: 'column',
                        p: 1.5,
                        borderRadius: 2,
                        bgcolor: item.isToday ? 'action.selected' : 'action.hover',
                        border: item.isToday ? '2px solid' : '1px solid',
                        borderColor: item.isToday ? 'primary.main' : 'divider',
                      }}
                    >
                      <Typography 
                        variant="body1" 
                        sx={{ 
                          fontWeight: item.isToday ? 700 : 600,
                          color: 'text.primary',
                          mb: 0.5,
                          textAlign: 'center',
                        }}
                      >
                        {dayName}
                      </Typography>
                      {item.isToday && (
                        <Chip 
                          label="Today" 
                          size="small" 
                          color="primary"
                          sx={{ fontWeight: 600, mb: 1, alignSelf: 'center' }}
                        />
                      )}
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          color: item.session.type === 'rest' ? 'text.secondary' : 'text.primary',
                          fontWeight: item.session.type === 'rest' ? 400 : 500,
                          textAlign: 'center',
                          mt: item.isToday ? 0 : 1.5,
                        }}
                      >
                        {item.session.type === 'rest' 
                          ? 'Rest' 
                          : getWorkoutTypeDisplayName(item.session.type)}
                      </Typography>
                    </Box>
                  );
                });
              })()}
            </Box>
          </CardContent>
        </Card>
      )}
    </Box>
  );
});

HomeScreen.displayName = 'HomeScreen';

HomeScreen.propTypes = {
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

export default HomeScreen;
