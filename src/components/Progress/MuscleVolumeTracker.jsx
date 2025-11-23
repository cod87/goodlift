import { useMemo, useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Stack,
  LinearProgress,
  IconButton,
} from '@mui/material';
import { FitnessCenter, ChevronLeft, ChevronRight } from '@mui/icons-material';
import {
  getMuscleCategory,
  categorizeSecondaryMuscles,
  getAllCategories,
} from '../../utils/muscleCategories';
import { EXERCISES_DATA_PATH } from '../../utils/constants';

/**
 * Get the Sunday (start) of a week for a given date
 * @param {Date} date - The date to find the week start for
 * @returns {Date} The Sunday of that week
 */
const getWeekStart = (date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay();
  const diff = day; // Sunday is 0, so diff is how many days to go back
  d.setDate(d.getDate() - diff);
  return d;
};

/**
 * Get the Saturday (end) of a week for a given date
 * @param {Date} date - The date to find the week end for
 * @returns {Date} The Saturday of that week
 */
const getWeekEnd = (date) => {
  const start = getWeekStart(date);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return end;
};

/**
 * Format a date range as "MMM D - MMM D, YYYY" or "MMM D - D, YYYY" if same month
 * @param {Date} start - Start date
 * @param {Date} end - End date
 * @returns {string} Formatted date range
 */
const formatWeekRange = (start, end) => {
  const startMonth = start.toLocaleDateString('en-US', { month: 'short' });
  const startDay = start.getDate();
  const endMonth = end.toLocaleDateString('en-US', { month: 'short' });
  const endDay = end.getDate();
  const year = end.getFullYear();
  
  if (startMonth === endMonth) {
    return `${startMonth} ${startDay} - ${endDay}, ${year}`;
  } else {
    return `${startMonth} ${startDay} - ${endMonth} ${endDay}, ${year}`;
  }
};

/**
 * Calculate muscle volume (sets per category) from workout history for a specific week
 * @param {Array} workoutHistory - Array of workout objects
 * @param {Object} exercisesDB - Exercise metadata lookup
 * @param {Date} weekStart - Start of the week (Sunday)
 * @param {Date} weekEnd - End of the week (Saturday)
 * @returns {Object} Object with categories as keys, containing primary and secondary set counts
 */
const calculateMuscleVolumeForWeek = (workoutHistory, exercisesDB, weekStart, weekEnd) => {
  // Get workouts within the week
  const weekWorkouts = workoutHistory.filter(workout => {
    const workoutDate = new Date(workout.date);
    return workoutDate >= weekStart && workoutDate <= weekEnd;
  });

  // Initialize category counts
  const categories = getAllCategories();
  const volumeData = {};
  categories.forEach(category => {
    volumeData[category] = { primary: 0, secondary: 0 };
  });

  // Process each workout
  weekWorkouts.forEach(workout => {
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
 * Calculate muscle volume (sets per category) from workout history
 * Legacy function for backward compatibility with days parameter - kept for reference
 * @param {Array} workoutHistory - Array of workout objects
 * @param {Object} exercisesDB - Exercise metadata lookup
 * @param {number} days - Number of days to look back (default: 7)
 * @returns {Object} Object with categories as keys, containing primary and secondary set counts
 */
const _calculateMuscleVolume = (workoutHistory, exercisesDB, days = 7) => {
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
 * Displays sets completed per muscle category (primary and secondary) for a week block (Sun-Sat)
 * Supports navigation to previous weeks
 */
const MuscleVolumeTracker = ({ workoutHistory = [] }) => {
  const [exercisesDB, setExercisesDB] = useState({});
  const [loading, setLoading] = useState(true);
  const [weekOffset, setWeekOffset] = useState(0); // 0 = current week, -1 = last week, etc.

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

  // Calculate current week dates based on offset
  const { weekStart, weekEnd, isCurrentWeek } = useMemo(() => {
    const today = new Date();
    const currentWeekStart = getWeekStart(today);
    
    // Apply offset (in weeks)
    const targetDate = new Date(currentWeekStart);
    targetDate.setDate(targetDate.getDate() + (weekOffset * 7));
    
    const start = getWeekStart(targetDate);
    const end = getWeekEnd(targetDate);
    const isCurrent = weekOffset === 0;
    
    return { weekStart: start, weekEnd: end, isCurrentWeek: isCurrent };
  }, [weekOffset]);

  // Calculate volume data for the selected week
  const volumeData = useMemo(
    () => calculateMuscleVolumeForWeek(workoutHistory, exercisesDB, weekStart, weekEnd),
    [workoutHistory, exercisesDB, weekStart, weekEnd]
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

  // Check if there are workouts in previous weeks
  const hasOlderWorkouts = useMemo(() => {
    if (workoutHistory.length === 0) return false;
    const oldestWorkout = workoutHistory.reduce((oldest, workout) => {
      const workoutDate = new Date(workout.date);
      return !oldest || workoutDate < oldest ? workoutDate : oldest;
    }, null);
    return oldestWorkout && oldestWorkout < weekStart;
  }, [workoutHistory, weekStart]);

  const handlePreviousWeek = () => {
    setWeekOffset(offset => offset - 1);
  };

  const handleNextWeek = () => {
    if (weekOffset < 0) {
      setWeekOffset(offset => offset + 1);
    }
  };

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
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography
              variant="h6"
              sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
            >
              <FitnessCenter /> Muscle Volume Tracker
            </Typography>
            <Box sx={{ display: 'flex', gap: 0.5 }}>
              <IconButton 
                size="small" 
                onClick={handlePreviousWeek}
                disabled={!hasOlderWorkouts}
              >
                <ChevronLeft />
              </IconButton>
              <IconButton 
                size="small" 
                onClick={handleNextWeek}
                disabled={isCurrentWeek}
              >
                <ChevronRight />
              </IconButton>
            </Box>
          </Box>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
            {formatWeekRange(weekStart, weekEnd)}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 1 }}>
            No workout data for this week. Start logging workouts to see your muscle volume breakdown!
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
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography
                variant="h6"
                sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
              >
                <FitnessCenter /> Muscle Volume Tracker
              </Typography>
              <Box sx={{ display: 'flex', gap: 0.5 }}>
                <IconButton 
                  size="small" 
                  onClick={handlePreviousWeek}
                  disabled={!hasOlderWorkouts}
                >
                  <ChevronLeft />
                </IconButton>
                <IconButton 
                  size="small" 
                  onClick={handleNextWeek}
                  disabled={isCurrentWeek}
                >
                  <ChevronRight />
                </IconButton>
              </Box>
            </Box>
            <Typography variant="caption" color="text.secondary">
              {formatWeekRange(weekStart, weekEnd)}
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
};

export default MuscleVolumeTracker;
