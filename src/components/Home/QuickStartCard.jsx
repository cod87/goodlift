import { memo } from 'react';
import PropTypes from 'prop-types';
import { 
  Box, 
  Card, 
  CardContent, 
  Typography, 
  Button, 
  Stack,
  Chip
} from '@mui/material';
import { 
  PlayArrow, 
  CalendarToday
} from '@mui/icons-material';
import { formatDuration } from '../../utils/helpers';
import { getWorkoutTypeDisplayName } from '../../utils/weeklyPlanDefaults';

/**
 * QuickStartCard - Multi-function card combining:
 * 1. Quick-start today's workout
 * 2. Weekly plan preview (next 2 sessions)
 * 3. Last session stats
 * 4. Plan management actions
 */
const QuickStartCard = memo(({ 
  todaysWorkout,
  nextWorkouts = [],
  lastWorkout,
  onQuickStart,
  onViewPlan,
  onRandomize,
  loading = false
}) => {
  const hasLastWorkout = lastWorkout && lastWorkout.date;
  
  // Calculate days since last workout
  const getDaysSinceLastWorkout = () => {
    if (!hasLastWorkout) return null;
    const lastDate = new Date(lastWorkout.date);
    const today = new Date();
    const diffTime = Math.abs(today - lastDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const daysSince = getDaysSinceLastWorkout();

  return (
    <Card 
      sx={{ 
        width: '100%',
        borderRadius: 3,
        boxShadow: '0 4px 16px rgba(19, 70, 134, 0.08)',
        background: 'linear-gradient(135deg, rgba(19, 70, 134, 0.02) 0%, rgba(237, 63, 39, 0.02) 100%)',
      }}
    >
      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
        {/* Header */}
        <Box sx={{ mb: 2 }}>
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
        </Box>

        {/* Today's Workout Info */}
        {todaysWorkout && todaysWorkout.type !== 'rest' ? (
          <Box sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="h5" sx={{ fontWeight: 700, color: 'text.primary' }}>
                {getWorkoutTypeDisplayName(todaysWorkout.type)}
                {todaysWorkout.focus && (
                  <Chip 
                    label={todaysWorkout.focus}
                    size="small"
                    sx={{ ml: 1, textTransform: 'capitalize' }}
                  />
                )}
              </Typography>
              {daysSince !== null && (
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  {daysSince === 0 ? 'Today' : `${daysSince}d ago`}
                </Typography>
              )}
            </Box>
            
            {/* Last Workout Stats */}
            {hasLastWorkout && (
              <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1 }}>
                Last: {formatDuration(lastWorkout.duration || 0)} 
                {lastWorkout.exercises && ` • ${lastWorkout.exercises.length} exercises`}
              </Typography>
            )}

            {/* Estimated Duration */}
            {todaysWorkout.estimatedDuration && (
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                Estimated: ~{todaysWorkout.estimatedDuration} min
              </Typography>
            )}
          </Box>
        ) : (
          <Box sx={{ mb: 2 }}>
            <Typography variant="h5" sx={{ fontWeight: 700, color: 'text.primary', mb: 1 }}>
              Rest Day
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Recovery is key to growth. Take it easy!
            </Typography>
          </Box>
        )}

        {/* Action Buttons */}
        <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
          <Button
            variant="contained"
            startIcon={<PlayArrow />}
            onClick={onQuickStart}
            disabled={loading || (todaysWorkout && todaysWorkout.type === 'rest')}
            sx={{ flex: 1 }}
          >
            START
          </Button>
          <Button
            variant="outlined"
            startIcon={<CalendarToday />}
            onClick={onViewPlan}
            sx={{ flex: 1 }}
          >
            View Plan
          </Button>
        </Stack>

        {/* What's Next */}
        {nextWorkouts.length > 0 && (
          <Box>
            <Typography 
              variant="caption" 
              sx={{ 
                color: 'text.secondary',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: 0.5,
              }}
            >
              What&apos;s Next:
            </Typography>
            <Stack spacing={0.5} sx={{ mt: 1 }}>
              {nextWorkouts.map((workout, index) => (
                workout.type !== 'rest' && (
                  <Box 
                    key={index}
                    sx={{ 
                      display: 'flex', 
                      alignItems: 'center',
                      pl: 1,
                      borderLeft: '2px solid',
                      borderColor: index === 0 ? 'primary.main' : 'secondary.main',
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
  );
});

QuickStartCard.displayName = 'QuickStartCard';

QuickStartCard.propTypes = {
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
  onViewPlan: PropTypes.func.isRequired,
  loading: PropTypes.bool,
};

export default QuickStartCard;
