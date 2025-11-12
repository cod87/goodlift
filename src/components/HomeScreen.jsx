import { memo, useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { 
  Box, 
  Card, 
  CardContent, 
  Typography, 
  Button, 
  LinearProgress,
  Chip
} from '@mui/material';
import { 
  PlayArrow, 
  Whatshot,
  CalendarToday
} from '@mui/icons-material';
import { getWorkoutTypeDisplayName } from '../utils/weeklyPlanDefaults';
import { getWorkoutHistory } from '../utils/storage';
import progressiveOverloadService from '../services/ProgressiveOverloadService';
import { containerPadding, touchTargets } from '../theme/responsive';

/**
 * HomeScreen - Quick-start interface component
 * Features:
 * - Prominent "Start Today's Workout" button
 * - Current plan name display
 * - Today's scheduled sessions
 * - Streak counter with fire emoji
 * - Adherence percentage
 */
const HomeScreen = memo(({ 
  currentPlan,
  todaysWorkout,
  onQuickStart,
  loading = false
}) => {
  const [greeting, setGreeting] = useState('');
  const [currentDate, setCurrentDate] = useState('');
  const [streak, setStreak] = useState(0);
  const [adherence, setAdherence] = useState(0);

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

  // Calculate streak and adherence
  useEffect(() => {
    const calculateMetrics = async () => {
      try {
        const workoutHistory = await getWorkoutHistory();
        
        // Calculate streak using existing service
        const currentStreak = progressiveOverloadService.calculateStreak(workoutHistory);
        setStreak(currentStreak);
        
        // Calculate adherence: completed workouts vs planned workouts
        // For now, we'll calculate based on the last 30 days
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        // Count completed workouts in last 30 days
        const completedWorkouts = workoutHistory.filter(w => {
          const workoutDate = new Date(w.date);
          return workoutDate >= thirtyDaysAgo;
        }).length;
        
        // If there's a plan, calculate expected workouts
        let expectedWorkouts = 0;
        if (currentPlan && currentPlan.days) {
          // Count non-rest days in the plan
          const workoutDays = currentPlan.days.filter(day => day.type !== 'rest').length;
          // Estimate expected workouts over 30 days (roughly 4 weeks)
          expectedWorkouts = Math.floor((workoutDays / 7) * 30);
        } else {
          // Default to 4 workouts per week (standard recommendation)
          expectedWorkouts = Math.floor((4 / 7) * 30);
        }
        
        // Calculate adherence percentage
        const adherencePercent = expectedWorkouts > 0 
          ? Math.min(100, Math.round((completedWorkouts / expectedWorkouts) * 100))
          : 0;
        
        setAdherence(adherencePercent);
      } catch (error) {
        console.error('Error calculating metrics:', error);
      }
    };

    calculateMetrics();
  }, [currentPlan]);

  // Get motivational message based on streak
  const getStreakMessage = useCallback(() => {
    if (streak === 0) {
      return "Let's start a streak!";
    } else if (streak === 1) {
      return "Great start!";
    } else if (streak < 7) {
      return "Keep it going!";
    } else if (streak < 14) {
      return "You're on fire!";
    } else if (streak < 30) {
      return "Incredible consistency!";
    } else {
      return "Legendary dedication!";
    }
  }, [streak]);

  // Get adherence color based on percentage
  const getAdherenceColor = useCallback(() => {
    if (adherence >= 80) return 'success';
    if (adherence >= 60) return 'warning';
    return 'error';
  }, [adherence]);

  const hasToday = todaysWorkout && todaysWorkout.type !== 'rest';
  const planName = currentPlan?.planStyle 
    ? currentPlan.planStyle.toUpperCase().replace('_', ' ')
    : 'Weekly Plan';

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
              <Typography variant="body1" sx={{ color: 'text.secondary' }}>
                Recovery is essential for growth. Take it easy today!
              </Typography>
            </>
          )}
        </CardContent>
      </Card>

      {/* Stats Cards - Two-column grid on mobile for small widgets */}
      <Box 
        sx={{ 
          mb: 3,
          display: 'grid',
          gridTemplateColumns: { xs: 'repeat(2, 1fr)', md: 'repeat(2, 1fr)' },
          gap: { xs: 2, sm: 2, md: 3 },
        }}
      >
        {/* Streak Card */}
        <Card 
          elevation={2}
          sx={{ 
            borderRadius: 3,
          }}
        >
          <CardContent sx={{ p: { xs: 2, sm: 3 }, textAlign: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1 }}>
              <Whatshot sx={{ color: 'warning.main', fontSize: 40, mr: 1 }} />
              <Typography variant="h6" sx={{ fontWeight: 600, color: 'text.primary' }}>
                Streak
              </Typography>
            </Box>
            <Typography 
              variant="h2" 
              sx={{ 
                fontWeight: 700, 
                color: 'warning.main',
                mb: 1,
                fontSize: { xs: '2.5rem', sm: '3rem' }
              }}
            >
              {streak}
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              {streak === 1 ? 'day' : 'days'}
            </Typography>
            <Typography 
              variant="body1" 
              sx={{ 
                color: 'text.primary', 
                mt: 1, 
                fontWeight: 500,
                fontStyle: 'italic' 
              }}
            >
              {getStreakMessage()}
            </Typography>
          </CardContent>
        </Card>

        {/* Adherence Card */}
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
                mb: 2,
                textAlign: 'center'
              }}
            >
              Adherence
            </Typography>
            <Box sx={{ textAlign: 'center', mb: 2 }}>
              <Typography 
                variant="h2" 
                sx={{ 
                  fontWeight: 700, 
                  color: `${getAdherenceColor()}.main`,
                  fontSize: { xs: '2.5rem', sm: '3rem' }
                }}
              >
                {adherence}%
              </Typography>
            </Box>
            <LinearProgress 
              variant="determinate" 
              value={adherence} 
              color={getAdherenceColor()}
              sx={{ 
                height: 10, 
                borderRadius: 5,
                mb: 1,
              }}
            />
            <Typography 
              variant="body2" 
              sx={{ 
                color: 'text.secondary',
                textAlign: 'center'
              }}
            >
              Workouts completed vs. planned (30 days)
            </Typography>
          </CardContent>
        </Card>
      </Box>

      {/* Weekly Overview */}
      {currentPlan && currentPlan.days && (
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
            <Stack spacing={1.5}>
              {currentPlan.days.map((day, index) => {
                const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                const isToday = index === new Date().getDay();
                
                return (
                  <Box 
                    key={index}
                    sx={{ 
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      p: 1.5,
                      borderRadius: 2,
                      bgcolor: isToday ? 'action.selected' : 'action.hover',
                      border: isToday ? '2px solid' : '1px solid',
                      borderColor: isToday ? 'primary.main' : 'divider',
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography 
                        variant="body1" 
                        sx={{ 
                          fontWeight: isToday ? 700 : 600,
                          color: 'text.primary',
                          minWidth: { xs: '80px', sm: '100px' }
                        }}
                      >
                        {dayNames[index]}
                      </Typography>
                      {isToday && (
                        <Chip 
                          label="Today" 
                          size="small" 
                          color="primary"
                          sx={{ fontWeight: 600 }}
                        />
                      )}
                    </Box>
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        color: day.type === 'rest' ? 'text.secondary' : 'text.primary',
                        fontWeight: day.type === 'rest' ? 400 : 500,
                        textAlign: 'right'
                      }}
                    >
                      {day.type === 'rest' 
                        ? 'Rest' 
                        : getWorkoutTypeDisplayName(day.type)}
                    </Typography>
                  </Box>
                );
              })}
            </Stack>
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
  loading: PropTypes.bool,
};

export default HomeScreen;
