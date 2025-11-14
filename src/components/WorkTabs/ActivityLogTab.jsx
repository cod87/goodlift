import { memo, useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { 
  Box, 
  Card, 
  CardContent, 
  Typography, 
  Button, 
  Stack,
} from '@mui/material';
import { 
  PlayArrow, 
  TrendingUp,
  FitnessCenter as WorkoutIcon,
} from '@mui/icons-material';
import { getWorkoutHistory } from '../../utils/storage';
import { touchTargets } from '../../theme/responsive';
import { useUserProfile } from '../../contexts/UserProfileContext';
import MonthCalendarView from '../Calendar/MonthCalendarView';

/**
 * ActivityLogTab - Simplified tab focused on activity logging
 * Shows quick start button and calendar of logged activities
 */
const ActivityLogTab = memo(({ 
  onQuickStart,
  onNavigate,
  loading = false
}) => {
  const [currentDate, setCurrentDate] = useState('');
  const [recentWorkouts, setRecentWorkouts] = useState([]);
  const [workoutHistory, setWorkoutHistory] = useState([]);
  const { stats } = useUserProfile();

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

      {/* Quick Start Section */}
      <Card 
        elevation={2}
        sx={{ 
          mb: 3,
          borderRadius: 3,
          background: 'linear-gradient(135deg, rgba(237, 63, 39, 0.05) 0%, rgba(19, 70, 134, 0.05) 100%)',
        }}
      >
        <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <WorkoutIcon sx={{ color: 'secondary.main', mr: 1 }} />
            <Typography 
              variant="h6" 
              sx={{ 
                color: 'text.primary',
                fontWeight: 600,
              }}
            >
              Quick Start Workout
            </Typography>
          </Box>
          <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
            Start a strength training workout
          </Typography>
          <Button
            variant="contained"
            size="large"
            fullWidth
            startIcon={<PlayArrow />}
            onClick={onQuickStart}
            disabled={loading}
            sx={{ 
              minHeight: touchTargets.navigation,
              fontSize: { xs: '1rem', sm: '1.1rem' },
              fontWeight: 600,
              backgroundColor: 'primary.main',
              '&:hover': {
                backgroundColor: 'primary.dark',
              },
            }}
          >
            Start Workout
          </Button>
        </CardContent>
      </Card>

      {/* Streak & Stats Card */}
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
            Your Activity
          </Typography>
          <Box 
            sx={{ 
              display: 'grid',
              gridTemplateColumns: { xs: '1fr 1fr', sm: '1fr 1fr 1fr' },
              gap: 2,
            }}
          >
            <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'action.hover', borderRadius: 2 }}>
              <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main' }}>
                {stats?.currentStreak || 0}
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                Day Streak
              </Typography>
            </Box>
            <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'action.hover', borderRadius: 2 }}>
              <Typography variant="h4" sx={{ fontWeight: 700, color: 'secondary.main' }}>
                {stats?.totalWorkouts || 0}
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                Total Workouts
              </Typography>
            </Box>
            <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'action.hover', borderRadius: 2 }}>
              <Typography variant="h4" sx={{ fontWeight: 700, color: 'success.main' }}>
                {stats?.totalPRs || 0}
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                Personal Records
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>

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
          workoutHistory={workoutHistory}
        />
      </Box>
    </Box>
  );
});

ActivityLogTab.displayName = 'ActivityLogTab';

ActivityLogTab.propTypes = {
  onQuickStart: PropTypes.func.isRequired,
  onNavigate: PropTypes.func,
  loading: PropTypes.bool,
};

export default ActivityLogTab;
