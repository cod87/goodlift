import { useMemo, useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Stack,
  Grid,
  LinearProgress,
} from '@mui/material';
import { FitnessCenter } from '@mui/icons-material';
import {
  getMuscleCategory,
  categorizeSecondaryMuscles,
  getAllCategories,
} from '../../utils/muscleCategories';
import { EXERCISES_DATA_PATH } from '../../utils/constants';

/**
 * Calculate muscle volume (sets per category) from workout history
 * @param {Array} workoutHistory - Array of workout objects
 * @param {Object} exercisesDB - Exercise metadata lookup
 * @param {number} days - Number of days to look back (default: 7)
 * @returns {Object} Object with categories as keys, containing primary and secondary set counts
 */
const calculateMuscleVolume = (workoutHistory, exercisesDB, days = 7) => {
  // Get workouts from the past N days
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);
  cutoffDate.setHours(0, 0, 0, 0);

  const recentWorkouts = workoutHistory.filter(workout => {
    const workoutDate = new Date(workout.date);
    workoutDate.setHours(0, 0, 0, 0);
    return workoutDate >= cutoffDate;
  });

  // Initialize category counts
  const categories = getAllCategories();
  const volumeData = {};
  categories.forEach(category => {
    volumeData[category] = { primary: 0, secondary: 0 };
  });

  // Process each workout
  recentWorkouts.forEach(workout => {
    if (!workout.exercises) return;

    Object.entries(workout.exercises).forEach(([exerciseName, exerciseData]) => {
      if (!exerciseData.sets || exerciseData.sets.length === 0) return;

      const setCount = exerciseData.sets.length;
      
      // Look up exercise metadata from the database
      const exerciseMetadata = exercisesDB[exerciseName];
      if (!exerciseMetadata) return;

      const primaryMuscle = exerciseMetadata['Primary Muscle'] || '';
      const secondaryMuscles = exerciseMetadata['Secondary Muscles'] || '';

      // Categorize primary muscle
      const primaryCategory = getMuscleCategory(primaryMuscle);
      if (volumeData[primaryCategory]) {
        volumeData[primaryCategory].primary += setCount;
      }

      // Categorize secondary muscles
      const secondaryCategories = categorizeSecondaryMuscles(secondaryMuscles);
      secondaryCategories.forEach(category => {
        // Don't count as secondary if it's the same as primary category
        if (category !== primaryCategory && volumeData[category]) {
          volumeData[category].secondary += setCount;
        }
      });
    });
  });

  return volumeData;
};

/**
 * MuscleVolumeTracker Component
 * Displays sets completed per muscle category (primary and secondary) for the past 7 days
 */
const MuscleVolumeTracker = ({ workoutHistory = [], days = 7 }) => {
  const [exercisesDB, setExercisesDB] = useState({});
  const [loading, setLoading] = useState(true);

  // Load exercises database
  useEffect(() => {
    const loadExercises = async () => {
      try {
        const response = await fetch(EXERCISES_DATA_PATH);
        const exercises = await response.json();
        
        // Create a lookup map by exercise name
        const dbMap = {};
        exercises.forEach(ex => {
          dbMap[ex['Exercise Name']] = ex;
        });
        
        setExercisesDB(dbMap);
      } catch (error) {
        console.error('Error loading exercises database:', error);
      } finally {
        setLoading(false);
      }
    };

    loadExercises();
  }, []);

  const volumeData = useMemo(
    () => calculateMuscleVolume(workoutHistory, exercisesDB, days),
    [workoutHistory, exercisesDB, days]
  );

  // Filter out categories with no volume
  const categoriesWithVolume = Object.entries(volumeData)
    .filter(([, data]) => data.primary > 0 || data.secondary > 0)
    .sort((a, b) => {
      const totalA = a[1].primary + a[1].secondary;
      const totalB = b[1].primary + b[1].secondary;
      return totalB - totalA;
    });

  // Calculate max values for scaling
  const maxPrimary = Math.max(
    ...Object.values(volumeData).map(d => d.primary),
    1
  );
  const maxSecondary = Math.max(
    ...Object.values(volumeData).map(d => d.secondary),
    1
  );

  if (loading) {
    return (
      <Card sx={{ bgcolor: 'background.paper' }}>
        <CardContent sx={{ p: 3 }}>
          <Typography
            variant="h6"
            sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}
          >
            <FitnessCenter /> Muscle Volume Tracker
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
            Loading...
          </Typography>
        </CardContent>
      </Card>
    );
  }

  if (categoriesWithVolume.length === 0) {
    return (
      <Card sx={{ bgcolor: 'background.paper' }}>
        <CardContent sx={{ p: 3 }}>
          <Typography
            variant="h6"
            sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}
          >
            <FitnessCenter /> Muscle Volume Tracker
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
            No workout data for the past {days} days. Start logging workouts to see your muscle volume breakdown!
          </Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card sx={{ bgcolor: 'background.paper' }}>
      <CardContent sx={{ p: 3 }}>
        <Stack spacing={2}>
          <Box>
            <Typography
              variant="h6"
              sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}
            >
              <FitnessCenter /> Muscle Volume Tracker
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Sets completed per muscle group (past {days} days)
            </Typography>
          </Box>

          <Grid container spacing={2}>
            {categoriesWithVolume.map(([category, data]) => {
              const total = data.primary + data.secondary;
              const primaryPercent = maxPrimary > 0 ? (data.primary / maxPrimary) * 100 : 0;
              const secondaryPercent = maxSecondary > 0 ? (data.secondary / maxSecondary) * 100 : 0;

              return (
                <Grid item xs={12} sm={6} md={4} key={category}>
                  <Box
                    sx={{
                      p: 2,
                      borderRadius: 2,
                      border: '1px solid',
                      borderColor: 'divider',
                      bgcolor: 'background.default',
                      height: '100%',
                    }}
                  >
                    <Typography
                      variant="subtitle2"
                      sx={{ fontWeight: 600, mb: 1.5, textAlign: 'center' }}
                    >
                      {category}
                    </Typography>

                    <Stack spacing={1.5}>
                      {/* Primary Sets */}
                      <Box>
                        <Box
                          sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            mb: 0.5,
                          }}
                        >
                          <Typography variant="caption" color="text.secondary">
                            Primary
                          </Typography>
                          <Typography
                            variant="caption"
                            sx={{ fontWeight: 700, color: 'primary.main' }}
                          >
                            {data.primary} sets
                          </Typography>
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={primaryPercent}
                          sx={{
                            height: 8,
                            borderRadius: 4,
                            bgcolor: 'action.hover',
                            '& .MuiLinearProgress-bar': {
                              borderRadius: 4,
                              background: 'linear-gradient(90deg, #2196F3 0%, #21CBF3 100%)',
                            },
                          }}
                        />
                      </Box>

                      {/* Secondary Sets */}
                      <Box>
                        <Box
                          sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            mb: 0.5,
                          }}
                        >
                          <Typography variant="caption" color="text.secondary">
                            Secondary
                          </Typography>
                          <Typography
                            variant="caption"
                            sx={{ fontWeight: 700, color: 'secondary.main' }}
                          >
                            {data.secondary} sets
                          </Typography>
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={secondaryPercent}
                          sx={{
                            height: 8,
                            borderRadius: 4,
                            bgcolor: 'action.hover',
                            '& .MuiLinearProgress-bar': {
                              borderRadius: 4,
                              background: 'linear-gradient(90deg, #9C27B0 0%, #E91E63 100%)',
                            },
                          }}
                        />
                      </Box>

                      {/* Total */}
                      <Typography
                        variant="caption"
                        sx={{
                          textAlign: 'center',
                          fontWeight: 600,
                          color: 'text.primary',
                          pt: 0.5,
                        }}
                      >
                        Total: {total} sets
                      </Typography>
                    </Stack>
                  </Box>
                </Grid>
              );
            })}
          </Grid>
        </Stack>
      </CardContent>
    </Card>
  );
};

MuscleVolumeTracker.propTypes = {
  workoutHistory: PropTypes.arrayOf(PropTypes.object),
  days: PropTypes.number,
};

export default MuscleVolumeTracker;
