import { memo, useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { 
  Box, 
  Card, 
  CardActionArea,
  CardContent, 
  Typography, 
  Stack,
  Chip,
} from '@mui/material';
import { 
  PlayArrow,
  FitnessCenter,
} from '@mui/icons-material';
import { useWeekScheduling } from '../../contexts/WeekSchedulingContext';
import { getSessionTypeDisplayName, isTimerType } from '../../utils/sessionTemplates';

/**
 * TodaysWorkoutSection - Minimalist section showing today's assigned workout
 * Features:
 * - Display today's assigned workout if available
 * - Show exact saved workout name for saved workouts
 * - Full-area clickable button that launches the assigned workout
 * - Navigate to appropriate screen for special session types (Cardio→timer, Yoga→stretch, etc.)
 * - Show suggestion chips (Cardio, Yoga, Active Recovery) if no workout assigned
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
    if (!todaysWorkout) return;
    
    const sessionType = (todaysWorkout.sessionType || 'full').toLowerCase();
    
    // Navigate to appropriate screen based on session type
    if (sessionType === 'cardio' || sessionType === 'hiit') {
      // Cardio and HIIT go to timer screen
      if (onNavigate) {
        onNavigate('cardio');
      }
    } else if (sessionType === 'yoga' || sessionType === 'stretch' || sessionType === 'mobility') {
      // Yoga, stretch, and mobility go to stretch/mobility screen
      if (onNavigate) {
        onNavigate('stretch');
      }
    } else if (sessionType === 'active_recovery') {
      // Active Recovery goes to log activity screen
      if (onNavigate) {
        onNavigate('log-activity');
      }
    } else if (sessionType === 'rest') {
      // Rest day goes to log activity screen
      if (onNavigate) {
        onNavigate('log-activity');
      }
    } else if (todaysWorkout.isSavedWorkout && todaysWorkout.exercises) {
      // For saved workouts, launch exactly as if from saved workouts list
      if (onStartWorkout) {
        onStartWorkout(
          sessionType, 
          new Set(['all']), 
          todaysWorkout.exercises, 
          todaysWorkout.supersetConfig || [2, 2, 2, 2]
        );
      }
    } else if (onStartWorkout) {
      // Fallback for other session types
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

  // Determine the display name for today's workout
  const getWorkoutDisplayName = () => {
    if (!todaysWorkout) return '';
    
    // If it's a saved workout with a name, show the exact name
    if (todaysWorkout.isSavedWorkout && todaysWorkout.sessionName) {
      return todaysWorkout.sessionName;
    }
    
    // Otherwise, show the session type display name
    return getSessionTypeDisplayName(todaysWorkout.sessionType);
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
        {todaysWorkout && todaysWorkout.sessionType && todaysWorkout.sessionType !== 'rest' ? (
          // Display assigned workout as full-area clickable button
          <CardActionArea onClick={handleStartToday}>
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

              {/* Workout Name and Start Button */}
              <Stack spacing={1}>
                <Typography 
                  variant="body1" 
                  sx={{ 
                    fontWeight: 600,
                    color: 'text.primary',
                    fontSize: '0.95rem',
                  }}
                >
                  {getWorkoutDisplayName()}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <PlayArrow sx={{ fontSize: '1.2rem', color: 'primary.main' }} />
                  <Typography
                    variant="body2"
                    sx={{
                      color: 'primary.main',
                      fontWeight: 600,
                      fontSize: '0.85rem',
                    }}
                  >
                    Tap to start
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </CardActionArea>
        ) : (
          // No workout assigned or rest day - show suggestions
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
          </CardContent>
        )}
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
