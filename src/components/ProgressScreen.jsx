import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { motion } from 'framer-motion';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Stack,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Tabs,
  Tab,
  ToggleButtonGroup,
  ToggleButton,
  Divider,
  LinearProgress,
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  Remove,
  Add,
  EmojiEvents,
  Assessment,
  FitnessCenter,
  DirectionsRun,
  SelfImprovement,
  Timer,
  Close,
  Whatshot,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import CompactHeader from './Common/CompactHeader';
import Achievements from './Achievements';
import WeightTracker from './WeightTracker';
import {
  getWorkoutHistory,
  deleteWorkout,
  updateWorkout,
  getStretchSessions,
  getUserStats,
} from '../utils/storage';
import progressiveOverloadService from '../services/ProgressiveOverloadService';
import { EXERCISES_DATA_PATH } from '../utils/constants';
import { StreakDisplay, AdherenceDisplay, VolumeTrendDisplay } from './Progress/TrackingCards';
import { FourWeekProgressionChart } from './Progress/FourWeekProgressionChart';
import ActivitiesList from './Progress/ActivitiesList';
import { useUserProfile } from '../contexts/UserProfileContext';

/**
 * Calculate current workout streak in days with improved logic
 * Allows one unlogged rest day per week (as long as missed days are not within 7 days of each other)
 * @param {Array} workoutHistory - Array of completed workout objects with date
 * @returns {Object} { currentStreak: number, longestStreak: number }
 */
const calculateStreakWithRestDays = (workoutHistory = []) => {
  if (!workoutHistory || workoutHistory.length === 0) {
    return { currentStreak: 0, longestStreak: 0 };
  }

  // Sort workouts by date (newest first)
  const sortedWorkouts = [...workoutHistory].sort((a, b) => 
    new Date(b.date) - new Date(a.date)
  );

  // Get unique workout dates (in case multiple workouts on same day)
  const workoutDates = new Set(sortedWorkouts.map(w => {
    const d = new Date(w.date);
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  }));

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  let currentStreak = 0;
  let longestStreak = 0;
  let streakCount = 0;
  let checkDate = new Date(today);
  let missedDaysInCurrentWeek = 0;
  
  // Calculate current streak
  // Allow one unlogged rest day per week (as long as missed days are not within 7 days of each other)
  for (let i = 0; i < 365; i++) { // Check up to 365 days
    const checkTime = checkDate.getTime();
    
    // Track week boundaries (every 7 days from today)
    const daysSinceWeekStart = Math.floor((today.getTime() - checkDate.getTime()) / (1000 * 60 * 60 * 24)) % 7;
    if (daysSinceWeekStart === 0 && i > 0) {
      // Reset missed days counter for new week
      missedDaysInCurrentWeek = 0;
    }
    
    if (workoutDates.has(checkTime)) {
      // Found a workout on this day
      streakCount++;
      if (currentStreak === 0 && i < 2) {
        // Only count as current streak if workout was within last 2 days
        currentStreak = streakCount;
      }
      longestStreak = Math.max(longestStreak, streakCount);
    } else {
      // No workout on this day
      missedDaysInCurrentWeek++;
      
      // Check if this breaks the streak
      // Streak breaks if: more than 1 missed day per week, OR 2+ consecutive missed days
      if (missedDaysInCurrentWeek > 1) {
        // Check if we have 2 consecutive missed days (within 7 days)
        const nextDate = new Date(checkDate);
        nextDate.setDate(nextDate.getDate() - 1);
        if (!workoutDates.has(nextDate.getTime()) && i > 0) {
          // Two consecutive days without workout - break streak
          if (currentStreak === 0 && streakCount > 0) {
            break; // Current streak already ended
          }
          streakCount = 0;
          missedDaysInCurrentWeek = 0;
        }
      }
    }
    
    checkDate.setDate(checkDate.getDate() - 1);
  }

  return { currentStreak, longestStreak };
};

/**
 * Calculate adherence percentage based on 6 days per week standard
 * Allows one rest day per week under the condition that missed days are not within 7 days of each other
 * @param {Array} workoutHistory - Array of completed workout objects
 * @param {number} days - Number of days to calculate adherence for (default 30)
 * @returns {number} Adherence percentage (0-100)
 */
const calculateAdherenceWith6DayWeek = (workoutHistory = [], days = 30) => {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);
  cutoffDate.setHours(0, 0, 0, 0);

  // Count completed workouts in time period
  const completedWorkouts = workoutHistory.filter(w => {
    const workoutDate = new Date(w.date);
    workoutDate.setHours(0, 0, 0, 0);
    return workoutDate >= cutoffDate;
  });

  const completedCount = completedWorkouts.length;

  // Calculate planned workouts based on 6 days per week (allowing 1 rest day per week)
  // Standard: 6 workouts per week
  const weeks = days / 7;
  const plannedCount = Math.ceil(weeks * 6);

  if (plannedCount === 0) return 0;
  
  // Calculate adherence percentage
  const adherencePercent = Math.min(100, Math.round((completedCount / plannedCount) * 100));
  
  return adherencePercent;
};

/**
 * ProgressDashboard - Complete progress tracking dashboard
 * Features:
 * - Day Streak with smart rest day allowance
 * - Adherence based on 6 days/week standard
 * - Personal Records, Total Workouts, Average Duration
 * - Strength/Cardio/Yoga session counts
 * - Weight tracking integration
 * - Time frame filtering (7 days, 3 months, year, all time)
 */
const ProgressDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState([]);
  const [pinnedExercises, setPinnedExercisesState] = useState([]);
  const [availableExercises, setAvailableExercises] = useState([]);
  const [addExerciseDialogOpen, setAddExerciseDialogOpen] = useState(false);
  const [exerciseSearchQuery, setExerciseSearchQuery] = useState('');
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingSession, setEditingSession] = useState(null);
  const [editingSessionType, setEditingSessionType] = useState(null);
  const [currentTab, setCurrentTab] = useState(0);
  
  // Time frame filter state
  const [timeFrame, setTimeFrame] = useState('all'); // '7days', '30days', '3months', 'year', 'custom', 'all'
  const [customStartDate, setCustomStartDate] = useState(null);
  const [customEndDate, setCustomEndDate] = useState(null);
  
  // User profile context for weight tracking
  const { profile, addWeightEntry } = useUserProfile();
  
  // New tracking metrics state
  const [streakData, setStreakData] = useState({ currentStreak: 0, longestStreak: 0 });
  const [adherence, setAdherence] = useState(0);
  const [userStats, setUserStats] = useState({});
  const [filteredStats, setFilteredStats] = useState({
    personalRecords: 0,
    totalWorkouts: 0,
    averageDuration: 0,
    strengthSessions: 0,
    cardioSessions: 0,
    yogaSessions: 0,
  });

  // Get time frame in days
  const getTimeFrameDays = () => {
    switch (timeFrame) {
      case '7days': return 7;
      case '30days': return 30;
      case '3months': return 90;
      case 'year': return 365;
      case 'custom': return null; // Use custom date range
      case 'all': return null;
      default: return null;
    }
  };

  // Filter history based on time frame
  const getFilteredHistory = () => {
    const days = getTimeFrameDays();
    
    if (timeFrame === 'custom' && customStartDate && customEndDate) {
      // Use custom date range
      const startTime = new Date(customStartDate);
      startTime.setHours(0, 0, 0, 0);
      const endTime = new Date(customEndDate);
      endTime.setHours(23, 59, 59, 999);
      
      return history.filter(w => {
        const workoutDate = new Date(w.date);
        return workoutDate >= startTime && workoutDate <= endTime;
      });
    }
    
    if (!days) return history;
    
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    cutoffDate.setHours(0, 0, 0, 0);
    
    return history.filter(w => {
      const workoutDate = new Date(w.date);
      workoutDate.setHours(0, 0, 0, 0);
      return workoutDate >= cutoffDate;
    });
  };

  // Calculate filtered statistics
  const calculateFilteredStats = (filteredHistory) => {
    // Count different session types
    let strengthSessions = 0;
    let cardioSessions = 0;
    let yogaSessions = 0;
    let totalDuration = 0;
    
    const exercisePRs = {}; // Track PRs per exercise
    
    filteredHistory.forEach(workout => {
      // Count session types based on workout.type or workout properties
      if (workout.type === 'strength' || workout.type === 'full' || workout.type === 'upper' || 
          workout.type === 'lower' || workout.type === 'push' || workout.type === 'pull' || workout.type === 'legs') {
        strengthSessions++;
      } else if (workout.type === 'cardio' || workout.cardioType) {
        cardioSessions++;
      } else if (workout.type === 'yoga' || workout.yogaType) {
        yogaSessions++;
      } else if (workout.exercises && Object.keys(workout.exercises).length > 0) {
        // If it has exercises, assume it's a strength session
        strengthSessions++;
      }
      
      // Sum duration (convert from seconds to minutes if needed)
      const duration = workout.duration || 0;
      totalDuration += duration;
      
      // Count personal records
      if (workout.exercises) {
        Object.entries(workout.exercises).forEach(([exerciseName, exerciseData]) => {
          if (!exerciseData.sets || exerciseData.sets.length === 0) return;
          
          exerciseData.sets.forEach(set => {
            const weight = set.weight || 0;
            const reps = set.reps || 0;
            
            if (weight === 0 && reps === 0) return;
            
            // Track max weight for each exercise
            if (!exercisePRs[exerciseName] || weight > exercisePRs[exerciseName].weight) {
              exercisePRs[exerciseName] = { weight, reps, date: workout.date };
            }
          });
        });
      }
    });
    
    const totalWorkouts = filteredHistory.length;
    const averageDuration = totalWorkouts > 0 ? Math.round(totalDuration / totalWorkouts) : 0;
    
    return {
      personalRecords: Object.keys(exercisePRs).length, // Count unique exercises with PRs
      totalWorkouts,
      averageDuration,
      strengthSessions,
      cardioSessions,
      yogaSessions,
    };
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [loadedHistory, , loadedStats] = await Promise.all([
        getWorkoutHistory(),
        getStretchSessions(),
        getUserStats()
      ]);
      setHistory(loadedHistory);
      setUserStats(loadedStats);

      // Calculate tracking metrics using new improved functions
      const streak = calculateStreakWithRestDays(loadedHistory);
      setStreakData(streak);

      const adherencePercent = calculateAdherenceWith6DayWeek(loadedHistory, 30);
      setAdherence(adherencePercent);

      const pinned = progressiveOverloadService.getPinnedExercises();
      setPinnedExercisesState(pinned);

      try {
        const response = await fetch(EXERCISES_DATA_PATH);
        const exercisesData = await response.json();
        const exerciseNames = exercisesData.map(ex => ex['Exercise Name']).sort();
        setAvailableExercises(exerciseNames);
      } catch (error) {
        console.error('Error loading exercises:', error);
        const unique = progressiveOverloadService.getUniqueExercises(loadedHistory);
        setAvailableExercises(unique);
      }
    } catch (error) {
      console.error('Error loading progress data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Update filtered stats when history or time frame changes
  useEffect(() => {
    if (history.length > 0 || timeFrame || customStartDate || customEndDate) {
      const filteredHistory = getFilteredHistory();
      const stats = calculateFilteredStats(filteredHistory);
      setFilteredStats(stats);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [history, timeFrame, customStartDate, customEndDate]);

  const handleDeleteWorkout = async (index) => {
    if (window.confirm('Are you sure you want to delete this workout? This action cannot be undone.')) {
      await deleteWorkout(index);
      await loadData();
    }
  };

  const handleEditWorkout = (workout, index) => {
    setEditingSession({ ...workout, index });
    setEditingSessionType('workout');
    setEditDialogOpen(true);
  };

  const handleSaveEdit = async (updatedData) => {
    try {
      if (editingSessionType === 'workout') {
        await updateWorkout(editingSession.index, updatedData);
      }

      await loadData();
      setEditDialogOpen(false);
      setEditingSession(null);
      setEditingSessionType(null);
    } catch (error) {
      console.error('Error saving edit:', error);
      alert('Failed to save changes. Please try again.');
    }
  };

  const handleRemovePinnedExercise = (exerciseName) => {
    progressiveOverloadService.removePinnedExercise(exerciseName);
    setPinnedExercisesState(pinnedExercises.filter(p => p.exerciseName !== exerciseName));
  };

  const handleAddPinnedExercise = (exerciseName) => {
    if (progressiveOverloadService.addPinnedExercise(exerciseName, 'weight')) {
      setPinnedExercisesState([...pinnedExercises, { exerciseName, trackingMode: 'weight' }]);
      setAddExerciseDialogOpen(false);
      setExerciseSearchQuery('');
    }
  };

  if (loading) {
    return (
      <Box sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh'
      }}>
        <Typography variant="h5" color="text.secondary">
          Loading...
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%', minHeight: '100vh', overflowX: 'hidden' }}>
      <CompactHeader title="Progress" subtitle="Track your fitness journey" />

      <Box sx={{ 
        maxWidth: '1400px', 
        margin: '0 auto', 
        p: { xs: 1, sm: 2, md: 3 }, 
        pb: { xs: '80px', md: 3 },
        width: '100%',
        boxSizing: 'border-box',
      }}>
        {/* Tab Navigation */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs
            value={currentTab}
            onChange={(e, newValue) => setCurrentTab(newValue)}
            variant="fullWidth"
            sx={{ maxWidth: { xs: '100%', sm: 600 }, margin: '0 auto' }}
          >
            <Tab 
              icon={<Assessment />} 
              iconPosition="start" 
              label="Statistics" 
              sx={{ minHeight: 48 }}
            />
            <Tab 
              icon={<EmojiEvents />} 
              iconPosition="start" 
              label="Achievements" 
              sx={{ minHeight: 48 }}
            />
          </Tabs>
        </Box>

        {/* Statistics Tab */}
        {currentTab === 0 && (
          <Stack spacing={3}>
            {/* Time Frame Filter - Compact */}
            <Card sx={{ bgcolor: 'background.paper' }}>
              <CardContent sx={{ p: 2 }}>
                <Stack spacing={2}>
                  <ToggleButtonGroup
                    value={timeFrame}
                    exclusive
                    onChange={(e, newValue) => {
                      if (newValue !== null) {
                        setTimeFrame(newValue);
                      }
                    }}
                    aria-label="time frame filter"
                    size="small"
                    fullWidth
                    sx={{ 
                      display: 'grid',
                      gridTemplateColumns: { xs: 'repeat(3, 1fr)', sm: 'repeat(6, 1fr)' },
                      gap: 0.5,
                    }}
                  >
                    <ToggleButton value="7days" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' }, py: 0.75 }}>
                      7d
                    </ToggleButton>
                    <ToggleButton value="30days" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' }, py: 0.75 }}>
                      30d
                    </ToggleButton>
                    <ToggleButton value="3months" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' }, py: 0.75 }}>
                      3mo
                    </ToggleButton>
                    <ToggleButton value="year" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' }, py: 0.75 }}>
                      Year
                    </ToggleButton>
                    <ToggleButton value="custom" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' }, py: 0.75 }}>
                      Custom
                    </ToggleButton>
                    <ToggleButton value="all" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' }, py: 0.75 }}>
                      All
                    </ToggleButton>
                  </ToggleButtonGroup>
                  
                  {/* Custom Date Range Picker */}
                  {timeFrame === 'custom' && (
                    <LocalizationProvider dateAdapter={AdapterDateFns}>
                      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                        <DatePicker
                          label="Start Date"
                          value={customStartDate}
                          onChange={(newValue) => setCustomStartDate(newValue)}
                          slotProps={{ 
                            textField: { 
                              size: 'small',
                              fullWidth: true 
                            } 
                          }}
                        />
                        <DatePicker
                          label="End Date"
                          value={customEndDate}
                          onChange={(newValue) => setCustomEndDate(newValue)}
                          slotProps={{ 
                            textField: { 
                              size: 'small',
                              fullWidth: true 
                            } 
                          }}
                        />
                      </Stack>
                    </LocalizationProvider>
                  )}
                </Stack>
              </CardContent>
            </Card>

            {/* Compact Streak and Adherence Row */}
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' },
                gap: 2,
              }}
            >
              {/* Streak - Inline with Fire Icon */}
              <Card sx={{ bgcolor: 'background.paper' }}>
                <CardContent sx={{ p: 2 }}>
                  <Stack direction="row" alignItems="center" justifyContent="space-between">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Whatshot sx={{ fontSize: 40, color: '#FF6B35' }} />
                      <Box>
                        <Typography variant="h3" sx={{ fontWeight: 700, color: '#FF6B35', lineHeight: 1 }}>
                          {streakData.currentStreak}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Day Streak
                        </Typography>
                      </Box>
                    </Box>
                    <Box sx={{ textAlign: 'right' }}>
                      <Typography variant="caption" color="text.secondary">
                        Longest
                      </Typography>
                      <Typography variant="h6" sx={{ fontWeight: 600, color: 'primary.main' }}>
                        {streakData.longestStreak}
                      </Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>

              {/* Adherence with Progress Bar */}
              <Card sx={{ bgcolor: 'background.paper' }}>
                <CardContent sx={{ p: 2 }}>
                  <Stack spacing={1.5}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Assessment sx={{ color: 'secondary.main' }} />
                        <Typography variant="body1" sx={{ fontWeight: 600 }}>
                          Adherence
                        </Typography>
                      </Box>
                      <Typography variant="h4" sx={{ fontWeight: 700, color: 'secondary.main' }}>
                        {adherence}%
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={adherence}
                      sx={{
                        height: 12,
                        borderRadius: 6,
                        bgcolor: 'action.hover',
                        '& .MuiLinearProgress-bar': {
                          borderRadius: 6,
                          background: 'linear-gradient(90deg, #4CAF50 0%, #8BC34A 100%)',
                        },
                      }}
                    />
                    <Typography variant="caption" color="text.secondary">
                      Last 30 days • 6 workouts/week target
                    </Typography>
                  </Stack>
                </CardContent>
              </Card>
            </Box>

            {/* Stats Grid: PRs and Total Workouts (removed Avg Duration) */}
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' },
                gap: 2,
              }}
            >
              <Card sx={{ bgcolor: 'background.paper' }}>
                <CardContent sx={{ textAlign: 'center', p: 2 }}>
                  <EmojiEvents sx={{ fontSize: 40, color: 'warning.main', mb: 1 }} />
                  <Typography variant="h4" sx={{ fontWeight: 700, color: 'warning.main' }}>
                    {filteredStats.personalRecords}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Personal Records
                  </Typography>
                </CardContent>
              </Card>

              <Card sx={{ bgcolor: 'background.paper' }}>
                <CardContent sx={{ textAlign: 'center', p: 2 }}>
                  <FitnessCenter sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
                  <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main' }}>
                    {filteredStats.totalWorkouts}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Workouts
                  </Typography>
                </CardContent>
              </Card>
            </Box>

            {/* Session Type Stats - More Compact */}
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' },
                gap: 2,
              }}
            >
              <Card sx={{ bgcolor: 'background.paper' }}>
                <CardContent sx={{ textAlign: 'center', p: 2 }}>
                  <FitnessCenter sx={{ fontSize: 32, color: 'error.main', mb: 0.5 }} />
                  <Typography variant="h5" sx={{ fontWeight: 700, color: 'error.main' }}>
                    {filteredStats.strengthSessions}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Strength
                  </Typography>
                </CardContent>
              </Card>

              <Card sx={{ bgcolor: 'background.paper' }}>
                <CardContent sx={{ textAlign: 'center', p: 2 }}>
                  <DirectionsRun sx={{ fontSize: 32, color: 'success.main', mb: 0.5 }} />
                  <Typography variant="h5" sx={{ fontWeight: 700, color: 'success.main' }}>
                    {filteredStats.cardioSessions}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Cardio
                  </Typography>
                </CardContent>
              </Card>

              <Card sx={{ bgcolor: 'background.paper' }}>
                <CardContent sx={{ textAlign: 'center', p: 2 }}>
                  <SelfImprovement sx={{ fontSize: 32, color: 'secondary.main', mb: 0.5 }} />
                  <Typography variant="h5" sx={{ fontWeight: 700, color: 'secondary.main' }}>
                    {filteredStats.yogaSessions}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Yoga
                  </Typography>
                </CardContent>
              </Card>
            </Box>

            {/* Progressive Overload Section - Moved here, below adherence */}
          {history.length > 0 && (
            <Card sx={{ bgcolor: 'background.paper' }}>
              <CardContent>
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                  <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <TrendingUp /> Progressive Overload
                  </Typography>
                  {pinnedExercises.length < 10 && (
                    <Button
                      size="small"
                      startIcon={<Add />}
                      onClick={() => setAddExerciseDialogOpen(true)}
                      sx={{ color: 'secondary.main' }}
                    >
                      Track Exercise
                    </Button>
                  )}
                </Stack>

                {pinnedExercises.length === 0 ? (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      Track your favorite exercises to see your progress over time
                    </Typography>
                    <Button
                      variant="contained"
                      startIcon={<Add />}
                      onClick={() => setAddExerciseDialogOpen(true)}
                    >
                      Add Exercise
                    </Button>
                  </Box>
                ) : (
                  <Stack spacing={2}>
                    {pinnedExercises.map((pinned) => {
                      const progression = progressiveOverloadService.getExerciseProgression(
                        history,
                        pinned.exerciseName,
                        'weight'
                      );

                      const startingWeight = progression.length > 0 ? progression[0].value : 0;
                      const currentWeight = progression.length > 0 ? progression[progression.length - 1].value : 0;
                      const progressionDirection = currentWeight > startingWeight ? 'up' : 
                                                   currentWeight < startingWeight ? 'down' : 'same';

                      return (
                        <Box 
                          key={pinned.exerciseName}
                          sx={{
                            p: 2,
                            borderRadius: 2,
                            border: '1px solid',
                            borderColor: 'divider',
                            bgcolor: 'background.default',
                          }}
                        >
                          <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 1.5 }}>
                            <Typography variant="body1" sx={{ fontWeight: 600, flex: 1 }}>
                              {pinned.exerciseName}
                            </Typography>
                            <IconButton
                              onClick={() => handleRemovePinnedExercise(pinned.exerciseName)}
                              size="small"
                              sx={{ color: 'text.secondary' }}
                            >
                              <Close sx={{ fontSize: 18 }} />
                            </IconButton>
                          </Stack>

                          {progression.length > 0 ? (
                            <Stack 
                              direction="row" 
                              alignItems="center" 
                              spacing={2}
                              sx={{ justifyContent: 'center', py: 1 }}
                            >
                              <Box sx={{ textAlign: 'center' }}>
                                <Typography variant="caption" color="text.secondary">
                                  Starting
                                </Typography>
                                <Typography variant="h5" sx={{ fontWeight: 700, color: 'primary.main' }}>
                                  {startingWeight} lbs
                                </Typography>
                              </Box>
                              
                              <Box sx={{ display: 'flex', alignItems: 'center', px: 2 }}>
                                {progressionDirection === 'up' && (
                                  <TrendingUp sx={{ fontSize: 40, color: 'success.main' }} />
                                )}
                                {progressionDirection === 'down' && (
                                  <TrendingDown sx={{ fontSize: 40, color: 'error.main' }} />
                                )}
                                {progressionDirection === 'same' && (
                                  <Remove sx={{ fontSize: 40, color: 'text.secondary' }} />
                                )}
                              </Box>

                              <Box sx={{ textAlign: 'center' }}>
                                <Typography variant="caption" color="text.secondary">
                                  Current
                                </Typography>
                                <Typography variant="h5" sx={{ fontWeight: 700, color: 'secondary.main' }}>
                                  {currentWeight} lbs
                                </Typography>
                              </Box>
                            </Stack>
                          ) : (
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              sx={{ display: 'block', textAlign: 'center', py: 2 }}
                            >
                              No data available
                            </Typography>
                          )}
                        </Box>
                      );
                    })}
                  </Stack>
                )}
              </CardContent>
            </Card>
          )}

            {/* Weight Tracking */}
            <WeightTracker
              weightHistory={profile.weightHistory || []}
              currentWeight={profile.currentWeight}
              currentUnit={profile.weightUnit || 'lbs'}
              onAddWeight={addWeightEntry}
            />

            {/* 4-Week Progression Chart */}
            <FourWeekProgressionChart workoutHistory={getFilteredHistory()} />

          {/* Recent Activities */}
          <Card sx={{ bgcolor: 'background.paper' }} className="activities-section">
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                <Typography variant="h6">
                  Recent Activities (Last 10 Workouts)
                </Typography>
              </Stack>

              {/* Use enhanced ActivitiesList component */}
              <ActivitiesList
                activities={[...history.slice(0, 10)]}
                onEdit={(index) => {
                  const workout = history[index];
                  handleEditWorkout(workout, index);
                }}
                onDelete={(index) => {
                  handleDeleteWorkout(index);
                }}
                maxVisible={10}
                showLoadMore={history.length > 10}
              />
            </CardContent>
          </Card>
        </Stack>
        )}

        {/* Achievements Tab */}
        {currentTab === 1 && (
          <Achievements 
            userStats={userStats} 
            workoutHistory={history} 
          />
        )}

        {/* Add Exercise Dialog */}
        <Dialog
          open={addExerciseDialogOpen}
          onClose={() => {
            setAddExerciseDialogOpen(false);
            setExerciseSearchQuery('');
          }}
          maxWidth="xs"
          fullWidth
        >
          <DialogTitle>Add Exercise to Track</DialogTitle>
          <DialogContent>
            <TextField
              fullWidth
              placeholder="Search exercises..."
              value={exerciseSearchQuery}
              onChange={(e) => setExerciseSearchQuery(e.target.value)}
              variant="outlined"
              size="small"
              sx={{ mb: 2, mt: 1 }}
            />
            <List sx={{ maxHeight: 400, overflow: 'auto' }}>
              {availableExercises
                .filter(ex => !pinnedExercises.some(p => p.exerciseName === ex))
                .filter(ex => ex.toLowerCase().includes(exerciseSearchQuery.toLowerCase()))
                .map((exerciseName) => (
                  <ListItem key={exerciseName} disablePadding>
                    <ListItemButton onClick={() => handleAddPinnedExercise(exerciseName)}>
                      <ListItemText primary={exerciseName} />
                    </ListItemButton>
                  </ListItem>
                ))}
            </List>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => {
              setAddExerciseDialogOpen(false);
              setExerciseSearchQuery('');
            }}>Cancel</Button>
          </DialogActions>
        </Dialog>

        {/* Edit Session Dialog */}
        {editingSession && (
          <EditSessionDialog
            open={editDialogOpen}
            onClose={() => {
              setEditDialogOpen(false);
              setEditingSession(null);
              setEditingSessionType(null);
            }}
            onSave={handleSaveEdit}
            session={editingSession}
            sessionType={editingSessionType}
          />
        )}
      </Box>
    </Box>
  );
};

// Edit Session Dialog Component
const EditSessionDialog = ({ open, onClose, onSave, session, sessionType }) => {
  const [duration, setDuration] = useState(session.duration ? Math.round(session.duration / 60) : 0);
  const [notes, setNotes] = useState(session.notes || '');
  const [workoutType, setWorkoutType] = useState(session.type || 'full');
  const [cardioType, setCardioType] = useState(session.cardioType || '');

  const handleSubmit = () => {
    const updatedData = {
      duration: duration * 60,
      notes: notes.trim(),
    };

    if (sessionType === 'workout') {
      updatedData.type = workoutType;
    } else if (sessionType === 'cardio') {
      updatedData.cardioType = cardioType.trim();
    }

    onSave(updatedData);
  };

  const getTitle = () => {
    switch (sessionType) {
      case 'workout': return 'Edit Workout';
      case 'cardio': return 'Edit Cardio Session';
      case 'hiit': return 'Edit HIIT Session';
      default: return 'Edit Session';
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{getTitle()}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField
            fullWidth
            type="number"
            label="Duration (minutes)"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            inputProps={{ min: 0, step: 1 }}
          />

          {sessionType === 'workout' && (
            <FormControl fullWidth>
              <InputLabel>Workout Type</InputLabel>
              <Select
                value={workoutType}
                label="Workout Type"
                onChange={(e) => setWorkoutType(e.target.value)}
              >
                <MenuItem value="upper">Upper Body</MenuItem>
                <MenuItem value="lower">Lower Body</MenuItem>
                <MenuItem value="full">Full Body</MenuItem>
              </Select>
            </FormControl>
          )}

          {sessionType === 'cardio' && (
            <TextField
              fullWidth
              label="Cardio Type"
              value={cardioType}
              onChange={(e) => setCardioType(e.target.value)}
            />
          )}

          <TextField
            fullWidth
            multiline
            rows={4}
            label="Notes (optional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSubmit} variant="contained">
          Save Changes
        </Button>
      </DialogActions>
    </Dialog>
  );
};

EditSessionDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
  session: PropTypes.object.isRequired,
  sessionType: PropTypes.string.isRequired,
};

ProgressDashboard.propTypes = {};

export default ProgressDashboard;
