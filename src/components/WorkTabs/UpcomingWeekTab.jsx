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
  TrendingUp
} from '@mui/icons-material';
import { getWorkoutTypeDisplayName } from '../../utils/weeklyPlanDefaults';
import { getWorkoutHistory } from '../../utils/storage';
import { touchTargets } from '../../theme/responsive';

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
  const [greeting, setGreeting] = useState('');
  const [currentDate, setCurrentDate] = useState('');
  const [recentWorkouts, setRecentWorkouts] = useState([]);

  // Set greeting based on time of day
  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) {
      setGreeting('Good Morning');
    } else if (hour < 18) {
      setGreeting('Good Afternoon');
    } else {
      setGreeting('Good Evening');
    }

    // Format current date
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    setCurrentDate(new Date().toLocaleDateString('en-US', options));
  }, []);

  // Load recent workouts
  useEffect(() => {
    const loadRecentWorkouts = async () => {
      try {
        const workoutHistory = await getWorkoutHistory();
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

  // Get next 7 days (current day + next 6 days)
  const getNext7Days = () => {
    if (!currentPlan || !currentPlan.days || !Array.isArray(currentPlan.days)) {
      return [];
    }

    const today = new Date();
    const next7Days = [];

    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() + i);
      const dayIndex = date.getDay();
      
      const dayData = currentPlan.days[dayIndex] || { type: 'rest' };
      
      next7Days.push({
        date: date,
        dayIndex: dayIndex,
        isToday: i === 0,
        ...dayData
      });
    }

    return next7Days;
  };

  const next7Days = getNext7Days();

  return (
    <Box>
      {/* Greeting Section */}
      <Box sx={{ mb: 4, textAlign: 'center' }}>
        <Typography 
          variant="h3" 
          sx={{ 
            fontWeight: 700,
            color: 'text.primary',
            mb: 1,
            fontSize: { xs: '2rem', sm: '2.5rem', md: '3rem' }
          }}
        >
          {greeting}
        </Typography>
        <Typography 
          variant="h6" 
          sx={{ 
            color: 'text.secondary',
            fontWeight: 400,
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
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        color: day.type === 'rest' ? 'text.secondary' : 'text.primary',
                        fontWeight: day.type === 'rest' ? 400 : 600,
                        textAlign: 'center',
                        mt: isToday ? 0 : 1.5,
                        fontSize: '0.875rem',
                      }}
                    >
                      {day.type === 'rest' 
                        ? 'Rest' 
                        : getWorkoutTypeDisplayName(day.type)}
                    </Typography>
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
