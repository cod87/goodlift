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
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import { 
  Star,
  PlayArrow,
  Delete,
  FitnessCenter,
  CalendarMonth,
  CheckCircle,
} from '@mui/icons-material';
import { getFavoriteWorkouts, deleteFavoriteWorkout } from '../../utils/storage';
import { useWeekScheduling } from '../../contexts/WeekSchedulingContext';

/**
 * FavouriteWorkoutsWidget - Displays saved favourite workouts
 * Features:
 * - Compact display of favourite workouts
 * - Quick start button for each workout
 * - Delete functionality
 * - Assign to specific day of week
 */
const FavouriteWorkoutsWidget = memo(({ onStartWorkout }) => {
  const [favoriteWorkouts, setFavoriteWorkouts] = useState([]);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedWorkout, setSelectedWorkout] = useState(null);
  const { assignWorkoutToDay, weeklySchedule } = useWeekScheduling();

  const daysOfWeek = [
    'Monday',
    'Tuesday', 
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
    'Sunday',
  ];

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

  const handleOpenDayMenu = (event, workout) => {
    setAnchorEl(event.currentTarget);
    setSelectedWorkout(workout);
  };

  const handleCloseDayMenu = () => {
    setAnchorEl(null);
    setSelectedWorkout(null);
  };

  const handleAssignToDay = async (dayOfWeek) => {
    if (selectedWorkout) {
      try {
        const sessionData = {
          sessionType: selectedWorkout.type || 'full',
          sessionName: selectedWorkout.name || `${selectedWorkout.type} Workout`,
          exercises: selectedWorkout.exercises || [],
          assignedDate: new Date().toISOString(),
          fromFavorite: true,
          favoriteId: selectedWorkout.id,
        };
        
        await assignWorkoutToDay(dayOfWeek, sessionData);
        handleCloseDayMenu();
      } catch (error) {
        console.error('Error assigning workout to day:', error);
      }
    }
  };

  // Check if a workout is assigned to any day
  const getAssignedDay = (workout) => {
    for (const day of daysOfWeek) {
      const session = weeklySchedule[day];
      if (session && session.favoriteId === workout.id) {
        return day;
      }
    }
    return null;
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
                  {getAssignedDay(workout) && (
                    <Chip 
                      icon={<CheckCircle sx={{ fontSize: '0.75rem !important' }} />}
                      label={getAssignedDay(workout)} 
                      size="small" 
                      color="success"
                      sx={{ 
                        fontSize: '0.65rem',
                        height: 20,
                      }}
                    />
                  )}
                </Stack>
              </Box>
              <Stack direction="row" spacing={0.5}>
                <Tooltip title="Assign to day">
                  <IconButton
                    size="small"
                    onClick={(e) => handleOpenDayMenu(e, workout)}
                    sx={{
                      color: getAssignedDay(workout) ? 'success.main' : 'text.secondary',
                      '&:hover': {
                        backgroundColor: 'rgba(46, 125, 50, 0.08)',
                      },
                    }}
                    aria-label={`Assign ${workout.name || 'workout'} to day`}
                  >
                    <CalendarMonth fontSize="small" />
                  </IconButton>
                </Tooltip>
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

        {/* Day Assignment Menu */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleCloseDayMenu}
          PaperProps={{
            sx: {
              maxHeight: 300,
              width: 200,
            }
          }}
        >
          <MenuItem disabled sx={{ opacity: 1, fontWeight: 600 }}>
            <ListItemText>Assign to Day</ListItemText>
          </MenuItem>
          {daysOfWeek.map((day) => {
            const isAssigned = selectedWorkout && weeklySchedule[day]?.favoriteId === selectedWorkout.id;
            return (
              <MenuItem 
                key={day} 
                onClick={() => handleAssignToDay(day)}
                selected={isAssigned}
              >
                <ListItemIcon>
                  {isAssigned && <CheckCircle fontSize="small" color="success" />}
                </ListItemIcon>
                <ListItemText>{day}</ListItemText>
              </MenuItem>
            );
          })}
        </Menu>
      </CardContent>
    </Card>
  );
});

FavouriteWorkoutsWidget.displayName = 'FavouriteWorkoutsWidget';

FavouriteWorkoutsWidget.propTypes = {
  onStartWorkout: PropTypes.func,
};

export default FavouriteWorkoutsWidget;
