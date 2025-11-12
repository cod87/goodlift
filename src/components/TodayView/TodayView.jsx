import { memo, useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { 
  Box, 
  Card, 
  CardContent, 
  Typography, 
  Button, 
  Stack,
  Grid,
  Chip
} from '@mui/material';
import { 
  PlayArrow, 
  FitnessCenter,
  CalendarToday,
  Timer,
  SelfImprovement,
  DirectionsRun
} from '@mui/icons-material';
import { formatDuration } from '../../utils/helpers';
import { getWorkoutTypeDisplayName } from '../../utils/weeklyPlanDefaults';
import { TIME_CONSTANTS } from '../../utils/constants';

/**
 * TodayView - Modern landing page component
 * Displays greeting, date, and navigation tiles for quick access
 */
const TodayView = memo(({ 
  todaysWorkout,
  nextWorkouts = [],
  lastWorkout,
  onQuickStart,
  onNavigate,
  loading = false
}) => {
  const [greeting, setGreeting] = useState('');
  const [currentDate, setCurrentDate] = useState('');

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

  const hasLastWorkout = lastWorkout && lastWorkout.date;
  
  // Calculate days since last workout
  const getDaysSinceLastWorkout = () => {
    if (!hasLastWorkout) return null;
    const lastDate = new Date(lastWorkout.date);
    const today = new Date();
    const diffTime = Math.abs(today - lastDate);
    const diffDays = Math.ceil(diffTime / TIME_CONSTANTS.MILLISECONDS_PER_DAY);
    return diffDays;
  };

  const daysSince = getDaysSinceLastWorkout();

  // Navigation tiles configuration
  const navigationTiles = [
    {
      title: 'Workouts',
      icon: <FitnessCenter fontSize="large" />,
      description: 'Start a workout',
      color: 'primary',
      action: () => onNavigate('selection'),
    },
    {
      title: 'Plans',
      icon: <CalendarToday fontSize="large" />,
      description: 'View weekly plan',
      color: 'info',
      action: () => onNavigate('plans'),
    },
    {
      title: 'HIIT',
      icon: <Timer fontSize="large" />,
      description: 'High intensity training',
      color: 'error',
      action: () => onNavigate('hiit'),
    },
    {
      title: 'Yoga',
      icon: <SelfImprovement fontSize="large" />,
      description: 'Stretching & yoga',
      color: 'secondary',
      action: () => onNavigate('yoga'),
    },
    {
      title: 'Cardio',
      icon: <DirectionsRun fontSize="large" />,
      description: 'Track cardio activity',
      color: 'warning',
      action: () => onNavigate('cardio'),
    },
  ];

  return (
    <Box 
      sx={{ 
        padding: { xs: '1rem', sm: '2rem', md: '3rem' },
        maxWidth: '1200px',
        margin: '0 auto',
        minHeight: 'calc(100vh - 60px)',
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

      {/* Today's Workout Card */}
      {todaysWorkout && (
        <Card 
          sx={{ 
            mb: 4,
            borderRadius: 3,
            boxShadow: '0 4px 16px rgba(19, 70, 134, 0.12)',
            background: 'linear-gradient(135deg, rgba(19, 70, 134, 0.05) 0%, rgba(237, 63, 39, 0.05) 100%)',
          }}
        >
          <CardContent sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2 }}>
              <Box>
                <Typography 
                  variant="overline" 
                  sx={{ 
                    color: 'primary.main',
                    fontWeight: 600,
                    letterSpacing: 1,
                  }}
                >
                  TODAY&apos;S WORKOUT
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 700, color: 'text.primary', mt: 1 }}>
                  {todaysWorkout.type !== 'rest' ? getWorkoutTypeDisplayName(todaysWorkout.type) : 'Rest Day'}
                  {todaysWorkout.focus && todaysWorkout.type !== 'rest' && (
                    <Chip 
                      label={todaysWorkout.focus}
                      size="small"
                      sx={{ ml: 1, textTransform: 'capitalize' }}
                    />
                  )}
                </Typography>
              </Box>
              {daysSince !== null && (
                <Chip 
                  label={daysSince === 0 ? 'Today' : `${daysSince}d ago`}
                  size="small"
                  color="primary"
                  variant="outlined"
                />
              )}
            </Box>
            
            {todaysWorkout.type !== 'rest' ? (
              <>
                {/* Last Workout Stats */}
                {hasLastWorkout && (
                  <Typography variant="body1" sx={{ color: 'text.secondary', mb: 1 }}>
                    Last session: {formatDuration(lastWorkout.duration || 0)} 
                    {lastWorkout.exercises && ` • ${lastWorkout.exercises.length} exercises`}
                  </Typography>
                )}

                {/* Estimated Duration */}
                {todaysWorkout.estimatedDuration && (
                  <Typography variant="body1" sx={{ color: 'text.secondary', mb: 2 }}>
                    Estimated: ~{todaysWorkout.estimatedDuration} min
                  </Typography>
                )}

                <Button
                  variant="contained"
                  size="large"
                  startIcon={<PlayArrow />}
                  onClick={onQuickStart}
                  disabled={loading}
                  sx={{ mt: 1 }}
                >
                  START WORKOUT
                </Button>
              </>
            ) : (
              <Typography variant="body1" sx={{ color: 'text.secondary' }}>
                Recovery is key to growth. Take it easy today!
              </Typography>
            )}

            {/* What's Next */}
            {nextWorkouts.length > 0 && (
              <Box sx={{ mt: 3, pt: 3, borderTop: '1px solid', borderColor: 'divider' }}>
                <Typography 
                  variant="caption" 
                  sx={{ 
                    color: 'text.secondary',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: 0.5,
                  }}
                >
                  Coming Up:
                </Typography>
                <Stack spacing={0.5} sx={{ mt: 1 }}>
                  {nextWorkouts.slice(0, 2).map((workout, index) => (
                    workout.type !== 'rest' && (
                      <Box 
                        key={index}
                        sx={{ 
                          display: 'flex', 
                          alignItems: 'center',
                          pl: 1,
                          borderLeft: '2px solid',
                          borderColor: 'primary.main',
                        }}
                      >
                        <Typography variant="body2" sx={{ color: 'text.primary' }}>
                          <strong>{workout.day}:</strong> {getWorkoutTypeDisplayName(workout.type)}
                        </Typography>
                      </Box>
                    )
                  ))}
                </Stack>
              </Box>
            )}
          </CardContent>
        </Card>
      )}

      {/* Navigation Tiles */}
      <Box>
        <Typography 
          variant="h5" 
          sx={{ 
            fontWeight: 700,
            color: 'text.primary',
            mb: 3,
          }}
        >
          Quick Access
        </Typography>
        <Grid container spacing={2}>
          {navigationTiles.map((tile, index) => (
            <Grid item xs={6} sm={4} md={2.4} key={index}>
              <Card 
                sx={{ 
                  height: '100%',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)',
                  }
                }}
                onClick={tile.action}
              >
                <CardContent 
                  sx={{ 
                    textAlign: 'center',
                    p: 3,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: '150px',
                  }}
                >
                  <Box 
                    sx={{ 
                      color: `${tile.color}.main`,
                      mb: 1.5,
                    }}
                  >
                    {tile.icon}
                  </Box>
                  <Typography 
                    variant="h6" 
                    sx={{ 
                      fontWeight: 600,
                      mb: 0.5,
                      fontSize: { xs: '1rem', sm: '1.25rem' }
                    }}
                  >
                    {tile.title}
                  </Typography>
                  <Typography 
                    variant="caption" 
                    sx={{ 
                      color: 'text.secondary',
                      fontSize: { xs: '0.7rem', sm: '0.75rem' }
                    }}
                  >
                    {tile.description}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>
    </Box>
  );
});

TodayView.displayName = 'TodayView';

TodayView.propTypes = {
  todaysWorkout: PropTypes.shape({
    day: PropTypes.string,
    type: PropTypes.string,
    focus: PropTypes.string,
    estimatedDuration: PropTypes.number,
    description: PropTypes.string,
  }),
  nextWorkouts: PropTypes.arrayOf(PropTypes.shape({
    day: PropTypes.string,
    type: PropTypes.string,
    description: PropTypes.string,
  })),
  lastWorkout: PropTypes.shape({
    date: PropTypes.string,
    duration: PropTypes.number,
    exercises: PropTypes.array,
  }),
  onQuickStart: PropTypes.func.isRequired,
  onNavigate: PropTypes.func.isRequired,
  loading: PropTypes.bool,
};

export default TodayView;
