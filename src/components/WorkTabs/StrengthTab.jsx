import { memo, useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Box, Card, CardContent, Typography, Button, Grid, Chip } from '@mui/material';
import { PlayArrow } from '@mui/icons-material';
import SavedWorkoutsList from './SavedWorkoutsList';
import WorkoutCreationModal from './WorkoutCreationModal';
import { saveSavedWorkout, updateSavedWorkout } from '../../utils/storage';
import { EXERCISES_DATA_PATH } from '../../utils/constants';
import { getWorkoutTypeDisplayName } from '../../utils/workoutTypeHelpers';
import { useWeekScheduling } from '../../contexts/WeekSchedulingContext';

/**
 * StrengthTab - Simplified strength workout tab showing only saved workouts list
 * Features:
 * - Today's Workout section (scheduled workout or recovery suggestions)
 * - List of saved workouts
 * - Create new workout button
 * - Edit existing workouts
 */
const StrengthTab = memo(({ 
  onStartWorkout,
  onNavigate,
}) => {
  const { weeklySchedule } = useWeekScheduling();
  const [showWorkoutCreator, setShowWorkoutCreator] = useState(false);
  const [exercises, setExercises] = useState([]);
  const [workoutListKey, setWorkoutListKey] = useState(0);
  const [editingWorkout, setEditingWorkout] = useState(null);
  const [editingIndex, setEditingIndex] = useState(null);

  // Get today's workout from schedule
  const getTodaysWorkout = () => {
    if (!weeklySchedule) return null;
    const today = new Date();
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const todayName = dayNames[today.getDay()];
    return weeklySchedule[todayName] || null;
  };

  const todaysWorkout = getTodaysWorkout();
  const hasToday = todaysWorkout && todaysWorkout.sessionType !== 'rest';

  // Load exercises data
  useEffect(() => {
    const loadExercises = async () => {
      try {
        const response = await fetch(EXERCISES_DATA_PATH);
        const data = await response.json();
        setExercises(data);
      } catch (error) {
        console.error('Error loading exercises:', error);
        setExercises([]);
      }
    };
    
    loadExercises();
  }, []);

  const handleCreateWorkout = () => {
    setEditingWorkout(null);
    setEditingIndex(null);
    setShowWorkoutCreator(true);
  };

  const handleEditWorkout = (workout, index) => {
    setEditingWorkout(workout);
    setEditingIndex(index);
    setShowWorkoutCreator(true);
  };

  const handleSaveWorkout = async (workout) => {
    try {
      if (editingIndex !== null) {
        // Update existing workout
        await updateSavedWorkout(editingIndex, workout);
      } else {
        // Create new workout
        await saveSavedWorkout(workout);
      }
      // Force refresh the workout list
      setWorkoutListKey(prev => prev + 1);
      setEditingWorkout(null);
      setEditingIndex(null);
    } catch (error) {
      console.error('Error saving workout:', error);
    }
  };

  const handleCloseModal = () => {
    setShowWorkoutCreator(false);
    setEditingWorkout(null);
    setEditingIndex(null);
  };

  return (
    <Box>
      {/* Today's Workout Section */}
      <Box sx={{ mb: 3 }}>
        <Typography 
          variant="h6" 
          sx={{ 
            fontWeight: 600, 
            color: 'text.primary',
            mb: 2
          }}
        >
          Today&apos;s Workout
        </Typography>
        <Card 
          sx={{ 
            borderRadius: 3,
            background: 'linear-gradient(135deg, rgba(19, 70, 134, 0.05) 0%, rgba(237, 63, 39, 0.05) 100%)',
          }}
        >
          <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
            {hasToday ? (
              <>
                <Typography 
                  variant="h5" 
                  sx={{ 
                    fontWeight: 700, 
                    color: 'text.primary', 
                    mb: 1,
                    fontSize: { xs: '1.5rem', sm: '1.75rem' }
                  }}
                >
                  {getWorkoutTypeDisplayName(todaysWorkout.sessionType)}
                  {todaysWorkout.focus && (
                    <Chip 
                      label={todaysWorkout.focus}
                      size="small"
                      sx={{ ml: 1, textTransform: 'capitalize' }}
                    />
                  )}
                </Typography>

                {todaysWorkout.sessionName && (
                  <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
                    {todaysWorkout.sessionName}
                  </Typography>
                )}

                <Button
                  variant="contained"
                  size="large"
                  fullWidth
                  startIcon={<PlayArrow />}
                  onClick={() => {
                    if (todaysWorkout.exercises && todaysWorkout.exercises.length > 0) {
                      onStartWorkout(
                        todaysWorkout.sessionType,
                        'all',
                        todaysWorkout.exercises,
                        todaysWorkout.supersetConfig || [2, 2, 2, 2]
                      );
                    }
                  }}
                  sx={{ 
                    fontSize: { xs: '1rem', sm: '1.1rem' },
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
                <Typography variant="h5" sx={{ fontWeight: 700, color: 'text.primary', mb: 2 }}>
                  No Workout Scheduled
                </Typography>
                <Typography variant="body1" sx={{ color: 'text.secondary', mb: 3 }}>
                  Consider doing one of these light activities to stay active:
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={4}>
                    <Button
                      variant="outlined"
                      fullWidth
                      onClick={() => onNavigate?.('cardio')}
                      sx={{ 
                        py: 1.5,
                        fontSize: '0.95rem',
                        fontWeight: 600,
                      }}
                    >
                      Cardio
                    </Button>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Button
                      variant="outlined"
                      fullWidth
                      onClick={() => onNavigate?.('stretch')}
                      sx={{ 
                        py: 1.5,
                        fontSize: '0.95rem',
                        fontWeight: 600,
                      }}
                    >
                      Yoga
                    </Button>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Button
                      variant="outlined"
                      fullWidth
                      onClick={() => onNavigate?.('log-activity')}
                      sx={{ 
                        py: 1.5,
                        fontSize: '0.95rem',
                        fontWeight: 600,
                      }}
                    >
                      Active Recovery
                    </Button>
                  </Grid>
                </Grid>
              </>
            )}
          </CardContent>
        </Card>
      </Box>

      <SavedWorkoutsList 
        key={workoutListKey}
        onCreateWorkout={handleCreateWorkout}
        onStartWorkout={onStartWorkout}
        onEditWorkout={handleEditWorkout}
      />
      
      <WorkoutCreationModal
        open={showWorkoutCreator}
        onClose={handleCloseModal}
        onSave={handleSaveWorkout}
        exercises={exercises}
        existingWorkout={editingWorkout}
      />
    </Box>
  );
});

StrengthTab.displayName = 'StrengthTab';

StrengthTab.propTypes = {
  onStartWorkout: PropTypes.func,
  onNavigate: PropTypes.func,
};

export default StrengthTab;
