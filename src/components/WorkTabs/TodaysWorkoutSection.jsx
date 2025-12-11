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
} from '@mui/material';
import { 
  PlayArrow,
  FitnessCenter,
} from '@mui/icons-material';
import { useWeekScheduling } from '../../contexts/WeekSchedulingContext';
import { getSessionTypeDisplayName } from '../../utils/sessionTemplates';

/**
 * TodaysWorkoutSection - Minimalist section showing today's assigned workout
 * Features:
 * - Display today's assigned workout if available
 * - Show suggestion chips (Cardio, Yoga, Active Recovery) if no workout assigned
 * - Small, styled "Start Workout" button
 * - Robust error handling for missing/incomplete data
 */
const TodaysWorkoutSection = memo(({ onStartWorkout, onNavigate }) => {
  const { weeklySchedule, loading: scheduleLoading } = useWeekScheduling();
  const [todaysWorkout, setTodaysWorkout] = useState(null);

  // Get today's day of week
  useEffect(() => {
    if (!weeklySchedule || scheduleLoading) return;

    try {
      const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const today = new Date();
      const dayName = daysOfWeek[today.getDay()];
      
      const assigned = weeklySchedule[dayName];
      setTodaysWorkout(assigned || null);
    } catch (error) {
      console.error('Error getting today\'s workout:', error);
      setTodaysWorkout(null);
    }
  }, [weeklySchedule, scheduleLoading]);

  // Don't render anything while loading
  if (scheduleLoading) {
    return null;
  }

  const handleStartToday = () => {
    if (todaysWorkout && onStartWorkout) {
      const sessionType = (todaysWorkout.sessionType || 'full').toLowerCase();
      onStartWorkout(sessionType, new Set(['all']), null, [2, 2, 2, 2]);
    }
  };

  const handleSuggestionClick = (type) => {
    if (onNavigate) {
      // Navigate to appropriate screen for the suggestion
      if (type === 'cardio') {
        onNavigate('cardio');
      } else if (type === 'yoga') {
        onNavigate('stretch');
      } else if (type === 'active_recovery') {
        onNavigate('log-activity');
      }
    }
  };

  return (
    <Box sx={{ mb: 2 }}>
      <Card 
        sx={{ 
          borderRadius: 2,
          background: 'linear-gradient(135deg, rgba(19, 70, 134, 0.03) 0%, rgba(237, 63, 39, 0.03) 100%)',
          border: '1px solid',
          borderColor: 'divider',
        }}
      >
        <CardContent sx={{ p: { xs: 1.5, sm: 2 }, '&:last-child': { pb: { xs: 1.5, sm: 2 } } }}>
          {/* Header */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <FitnessCenter sx={{ fontSize: '1rem', color: 'primary.main' }} />
            <Typography 
              variant="overline" 
              sx={{ 
                color: 'primary.main',
                fontWeight: 600,
                fontSize: '0.75rem',
                letterSpacing: 0.5,
              }}
            >
              Today&apos;s Workout
            </Typography>
          </Box>

          {todaysWorkout && todaysWorkout.sessionType && todaysWorkout.sessionType !== 'rest' ? (
            // Display assigned workout
            <Stack spacing={1}>
              <Typography 
                variant="body1" 
                sx={{ 
                  fontWeight: 600,
                  color: 'text.primary',
                  fontSize: '0.95rem',
                }}
              >
                {getSessionTypeDisplayName(todaysWorkout.sessionType)}
              </Typography>
              <Button
                variant="contained"
                size="small"
                startIcon={<PlayArrow sx={{ fontSize: '1rem' }} />}
                onClick={handleStartToday}
                sx={{ 
                  alignSelf: 'flex-start',
                  fontSize: '0.8rem',
                  py: 0.5,
                  px: 1.5,
                  textTransform: 'none',
                  fontWeight: 600,
                }}
              >
                Start Workout
              </Button>
            </Stack>
          ) : (
            // No workout assigned - show suggestions
            <Stack spacing={1}>
              <Typography 
                variant="body2" 
                sx={{ 
                  color: 'text.secondary',
                  fontSize: '0.85rem',
                  mb: 0.5,
                }}
              >
                {todaysWorkout && todaysWorkout.sessionType === 'rest' 
                  ? 'Rest day - or try a light activity:' 
                  : 'No workout assigned. Consider:'}
              </Typography>
              <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 0.5 }}>
                <Chip 
                  label="Cardio" 
                  size="small" 
                  onClick={() => handleSuggestionClick('cardio')}
                  sx={{ 
                    cursor: 'pointer',
                    fontSize: '0.75rem',
                    '&:hover': {
                      backgroundColor: 'primary.light',
                    }
                  }}
                />
                <Chip 
                  label="Yoga" 
                  size="small" 
                  onClick={() => handleSuggestionClick('yoga')}
                  sx={{ 
                    cursor: 'pointer',
                    fontSize: '0.75rem',
                    '&:hover': {
                      backgroundColor: 'secondary.light',
                    }
                  }}
                />
                <Chip 
                  label="Active Recovery" 
                  size="small" 
                  onClick={() => handleSuggestionClick('active_recovery')}
                  sx={{ 
                    cursor: 'pointer',
                    fontSize: '0.75rem',
                    '&:hover': {
                      backgroundColor: 'action.hover',
                    }
                  }}
                />
              </Stack>
            </Stack>
          )}
        </CardContent>
      </Card>
    </Box>
  );
});

TodaysWorkoutSection.displayName = 'TodaysWorkoutSection';

TodaysWorkoutSection.propTypes = {
  onStartWorkout: PropTypes.func,
  onNavigate: PropTypes.func,
};

export default TodaysWorkoutSection;
