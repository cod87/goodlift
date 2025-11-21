import { useMemo, useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Stack,
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

  // Get categories in the specified order, filter out those with no volume
  const orderedCategories = getAllCategories();
  const categoriesWithVolume = orderedCategories
    .map(category => [category, volumeData[category]])
    .filter(([, data]) => data && (data.primary > 0 || data.secondary > 0));

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
        <CardContent sx={{ p: 2 }}>
          <Typography
            variant="h6"
            sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}
          >
            <FitnessCenter /> Muscle Volume Tracker
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 1 }}>
            Loading...
          </Typography>
        </CardContent>
      </Card>
    );
  }

  if (categoriesWithVolume.length === 0) {
    return (
      <Card sx={{ bgcolor: 'background.paper' }}>
        <CardContent sx={{ p: 2 }}>
          <Typography
            variant="h6"
            sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}
          >
            <FitnessCenter /> Muscle Volume Tracker
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 1 }}>
            No workout data for the past {days} days. Start logging workouts to see your muscle volume breakdown!
          </Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card sx={{ bgcolor: 'background.paper' }}>
      <CardContent sx={{ p: 2 }}>
        <Stack spacing={1.5}>
          <Box>
            <Typography
              variant="h6"
              sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}
            >
              <FitnessCenter /> Muscle Volume Tracker
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Sets per muscle (past {days} days)
            </Typography>
          </Box>

          <Stack spacing={1}>
            {categoriesWithVolume.map(([category, data]) => {
              const total = data.primary + data.secondary;
              const primaryPercent = maxPrimary > 0 ? (data.primary / maxPrimary) * 100 : 0;
              const secondaryPercent = maxSecondary > 0 ? (data.secondary / maxSecondary) * 100 : 0;

              return (
                <Box
                  key={category}
                  sx={{
                    p: 1.5,
                    borderRadius: 1,
                    border: '1px solid',
                    borderColor: 'divider',
                    bgcolor: 'background.default',
                  }}
                >
                  <Stack direction="row" spacing={2} alignItems="center">
                    {/* Muscle name - fixed width */}
                    <Typography
                      variant="body2"
                      sx={{ fontWeight: 600, minWidth: 90 }}
                    >
                      {category}
                    </Typography>

                    {/* Progress bars - flex to fill space */}
                    <Box sx={{ flex: 1 }}>
                      <Stack spacing={0.5}>
                        {/* Primary bar */}
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="caption" color="text.secondary" sx={{ minWidth: 28 }}>
                            Pri
                          </Typography>
                          <LinearProgress
                            variant="determinate"
                            value={primaryPercent}
                            sx={{
                              flex: 1,
                              height: 6,
                              borderRadius: 3,
                              bgcolor: 'action.hover',
                              '& .MuiLinearProgress-bar': {
                                borderRadius: 3,
                                background: 'linear-gradient(90deg, #2196F3 0%, #21CBF3 100%)',
                              },
                            }}
                          />
                          <Typography
                            variant="caption"
                            sx={{ fontWeight: 600, color: 'primary.main', minWidth: 30, textAlign: 'right' }}
                          >
                            {data.primary}
                          </Typography>
                        </Box>

                        {/* Secondary bar */}
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="caption" color="text.secondary" sx={{ minWidth: 28 }}>
                            Sec
                          </Typography>
                          <LinearProgress
                            variant="determinate"
                            value={secondaryPercent}
                            sx={{
                              flex: 1,
                              height: 6,
                              borderRadius: 3,
                              bgcolor: 'action.hover',
                              '& .MuiLinearProgress-bar': {
                                borderRadius: 3,
                                background: 'linear-gradient(90deg, #9C27B0 0%, #E91E63 100%)',
                              },
                            }}
                          />
                          <Typography
                            variant="caption"
                            sx={{ fontWeight: 600, color: 'secondary.main', minWidth: 30, textAlign: 'right' }}
                          >
                            {data.secondary}
                          </Typography>
                        </Box>
                      </Stack>
                    </Box>

                    {/* Total - fixed width */}
                    <Typography
                      variant="body2"
                      sx={{ fontWeight: 700, minWidth: 45, textAlign: 'right' }}
                    >
                      {total}
                    </Typography>
                  </Stack>
                </Box>
              );
            })}
          </Stack>
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
