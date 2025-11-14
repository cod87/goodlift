import { useState, useEffect, memo } from 'react';
import PropTypes from 'prop-types';
import { 
  Box, 
  Card, 
  CardContent, 
  Typography, 
  Button, 
  Stack,
  Chip,
  IconButton,
  Tooltip,
} from '@mui/material';
import { 
  Star,
  PlayArrow,
  Delete,
  FitnessCenter,
} from '@mui/icons-material';
import { getFavoriteWorkouts, deleteFavoriteWorkout } from '../../utils/storage';

/**
 * FavouriteWorkoutsWidget - Displays saved favourite workouts
 * Features:
 * - Compact display of favourite workouts
 * - Quick start button for each workout
 * - Delete functionality
 */
const FavouriteWorkoutsWidget = memo(({ onStartWorkout }) => {
  const [favoriteWorkouts, setFavoriteWorkouts] = useState([]);

  // Load favorite workouts
  useEffect(() => {
    const loadFavorites = () => {
      try {
        const favorites = getFavoriteWorkouts();
        setFavoriteWorkouts(favorites);
      } catch (error) {
        console.error('Error loading favorite workouts:', error);
      }
    };

    loadFavorites();
    
    // Refresh favorites when storage changes
    const handleStorageChange = () => {
      loadFavorites();
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const handleDelete = (index) => {
    try {
      deleteFavoriteWorkout(index);
      setFavoriteWorkouts(getFavoriteWorkouts());
    } catch (error) {
      console.error('Error deleting favorite workout:', error);
    }
  };

  const handleStartFavorite = (workout) => {
    if (onStartWorkout && workout) {
      // Convert workout to format expected by onStartWorkout
      const workoutType = workout.type || 'full';
      const equipmentFilter = workout.equipment || 'all';
      const preGeneratedWorkout = workout.exercises || [];
      onStartWorkout(workoutType, equipmentFilter, preGeneratedWorkout);
    }
  };

  if (favoriteWorkouts.length === 0) {
    return null; // Don't render if no favorites
  }

  return (
    <Card 
      elevation={2}
      sx={{ 
        mb: 3,
        borderRadius: 3,
      }}
    >
      <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Star sx={{ color: 'warning.main', mr: 1 }} />
          <Typography 
            variant="h6" 
            sx={{ 
              fontWeight: 600, 
              color: 'text.primary',
              flex: 1,
            }}
          >
            Favourite Workouts
          </Typography>
        </Box>
        
        <Stack spacing={1.5}>
          {favoriteWorkouts.map((workout, index) => (
            <Box 
              key={index}
              sx={{ 
                p: 1.5, 
                bgcolor: 'background.default', 
                borderRadius: 2,
                borderLeft: '4px solid',
                borderLeftColor: 'warning.main',
                display: 'flex',
                alignItems: 'center',
                gap: 1,
              }}
            >
              <FitnessCenter sx={{ color: 'text.secondary', fontSize: 20 }} />
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography 
                  variant="subtitle2" 
                  sx={{ 
                    fontWeight: 600,
                    mb: 0.5,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {workout.name || 'Untitled Workout'}
                </Typography>
                <Stack direction="row" spacing={0.5} flexWrap="wrap">
                  {workout.type && (
                    <Chip 
                      label={workout.type.charAt(0).toUpperCase() + workout.type.slice(1)} 
                      size="small" 
                      sx={{ 
                        fontSize: '0.65rem',
                        height: 20,
                      }}
                    />
                  )}
                  {workout.exercises && (
                    <Chip 
                      label={`${workout.exercises.length} exercises`} 
                      size="small" 
                      variant="outlined"
                      sx={{ 
                        fontSize: '0.65rem',
                        height: 20,
                      }}
                    />
                  )}
                </Stack>
              </Box>
              <Stack direction="row" spacing={0.5}>
                <Tooltip title="Start workout">
                  <IconButton
                    size="small"
                    onClick={() => handleStartFavorite(workout)}
                    sx={{
                      color: 'primary.main',
                      '&:hover': {
                        backgroundColor: 'rgba(19, 70, 134, 0.08)',
                      },
                    }}
                    aria-label={`Start ${workout.name || 'workout'}`}
                  >
                    <PlayArrow fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Delete">
                  <IconButton
                    size="small"
                    onClick={() => handleDelete(index)}
                    sx={{
                      color: 'error.main',
                      '&:hover': {
                        backgroundColor: 'rgba(211, 47, 47, 0.08)',
                      },
                    }}
                    aria-label={`Delete ${workout.name || 'workout'}`}
                  >
                    <Delete fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Stack>
            </Box>
          ))}
        </Stack>
      </CardContent>
    </Card>
  );
});

FavouriteWorkoutsWidget.displayName = 'FavouriteWorkoutsWidget';

FavouriteWorkoutsWidget.propTypes = {
  onStartWorkout: PropTypes.func,
};

export default FavouriteWorkoutsWidget;
