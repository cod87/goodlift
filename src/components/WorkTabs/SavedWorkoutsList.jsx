import { memo, useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { 
  Box, 
  Card, 
  CardContent, 
  Typography, 
  Button, 
  Stack,
  IconButton,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemButton,
  Menu,
  MenuItem,
} from '@mui/material';
import { 
  Add,
  MoreVert,
} from '@mui/icons-material';
import { getSavedWorkouts, deleteSavedWorkout } from '../../utils/storage';

/**
 * SavedWorkoutsList - Display list of saved workouts
 * Features:
 * - List of saved workouts with basic info
 * - Create new workout button
 * - Options to edit/delete saved workouts
 */
const SavedWorkoutsList = memo(({ 
  onCreateWorkout,
  onStartWorkout,
}) => {
  const [savedWorkouts, setSavedWorkouts] = useState([]);
  const [menuAnchorEl, setMenuAnchorEl] = useState(null);
  const [selectedWorkoutIndex, setSelectedWorkoutIndex] = useState(null);

  // Load saved workouts
  useEffect(() => {
    const loadSavedWorkouts = async () => {
      try {
        const workouts = await getSavedWorkouts();
        setSavedWorkouts(workouts || []);
      } catch (error) {
        console.error('Error loading saved workouts:', error);
        setSavedWorkouts([]);
      }
    };
    
    loadSavedWorkouts();
  }, []);

  const handleMenuOpen = (event, index) => {
    event.stopPropagation();
    setMenuAnchorEl(event.currentTarget);
    setSelectedWorkoutIndex(index);
  };

  const handleMenuClose = () => {
    setMenuAnchorEl(null);
    setSelectedWorkoutIndex(null);
  };

  const handleDeleteWorkout = async () => {
    if (selectedWorkoutIndex !== null) {
      try {
        await deleteSavedWorkout(selectedWorkoutIndex);
        const workouts = await getSavedWorkouts();
        setSavedWorkouts(workouts || []);
      } catch (error) {
        console.error('Error deleting workout:', error);
      }
    }
    handleMenuClose();
  };

  const handleWorkoutClick = (workout) => {
    if (onStartWorkout && workout.exercises) {
      // Start the saved workout with superset config (or default if not defined)
      const config = workout.supersetConfig || [2, 2, 2, 2];
      onStartWorkout(workout.type || 'full', 'all', workout.exercises, config);
    }
  };

  return (
    <Box>
      {/* Header with Create Button - Minimalist Style */}
      <Box sx={{ mb: 3 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
              My Workouts
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem' }}>
              Create and manage your custom workouts
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={onCreateWorkout}
            sx={{ fontWeight: 600 }}
          >
            Create Workout
          </Button>
        </Stack>
      </Box>

      {/* Saved Workouts List */}
      {savedWorkouts.length === 0 ? (
        <Card elevation={2} sx={{ borderRadius: 3 }}>
          <CardContent sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              No saved workouts yet. Create your first workout!
            </Typography>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={onCreateWorkout}
              size="large"
            >
              Create Your First Workout
            </Button>
          </CardContent>
        </Card>
      ) : (
        <List sx={{ p: 0 }}>
          {savedWorkouts.map((workout, index) => (
            <Card key={index} elevation={2} sx={{ mb: 2, borderRadius: 3 }}>
              <ListItem
                disablePadding
                secondaryAction={
                  <IconButton
                    edge="end"
                    onClick={(e) => handleMenuOpen(e, index)}
                    sx={{ mr: 1 }}
                  >
                    <MoreVert />
                  </IconButton>
                }
              >
                <ListItemButton onClick={() => handleWorkoutClick(workout)}>
                  <ListItemText
                    primary={
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        {workout.name || `${workout.type || 'Custom'} Workout`}
                      </Typography>
                    }
                    secondary={
                      <Stack direction="row" spacing={1} sx={{ mt: 1 }} flexWrap="wrap">
                        <Chip
                          label={`${workout.exercises?.length || 0} exercises`}
                          size="small"
                          color="primary"
                          variant="outlined"
                        />
                        {workout.type && (
                          <Chip
                            label={workout.type}
                            size="small"
                            variant="outlined"
                          />
                        )}
                        {workout.supersetConfig && workout.supersetConfig.length > 0 && (
                          <Chip
                            label={`${workout.supersetConfig.filter(count => count > 1).length} supersets`}
                            size="small"
                            color="secondary"
                            variant="outlined"
                          />
                        )}
                      </Stack>
                    }
                  />
                </ListItemButton>
              </ListItem>
            </Card>
          ))}
        </List>
      )}

      {/* Menu for workout options */}
      <Menu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleDeleteWorkout}>Delete</MenuItem>
      </Menu>
    </Box>
  );
});

SavedWorkoutsList.displayName = 'SavedWorkoutsList';

SavedWorkoutsList.propTypes = {
  onCreateWorkout: PropTypes.func,
  onStartWorkout: PropTypes.func,
};

export default SavedWorkoutsList;
