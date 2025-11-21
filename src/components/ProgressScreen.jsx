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
  Snackbar,
  Alert,
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
  FilterList,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import CompactHeader from './Common/CompactHeader';
import Achievements from './Achievements';
import WeightTracker from './WeightTracker';
import MonthCalendarView from './Calendar/MonthCalendarView';
import ActivitiesList from './Progress/ActivitiesList';
import EditActivityDialog from './EditActivityDialog';
import {
  getWorkoutHistory,
  getStretchSessions,
  getHiitSessions,
  getCardioSessions,
  getUserStats,
  deleteWorkout,
  updateWorkout,
} from '../utils/storage';
import progressiveOverloadService from '../services/ProgressiveOverloadService';
import { EXERCISES_DATA_PATH } from '../utils/constants';
import { StreakDisplay, AdherenceDisplay, VolumeTrendDisplay } from './Progress/TrackingCards';
import { useUserProfile } from '../contexts/UserProfileContext';

/**
 * Calculate current workout streak in days with improved logic
 * Allows one unlogged rest day per week (as long as missed days are not within 7 days of each other)
 * @param {Array} allSessions - Array of all completed sessions (strength, cardio, HIIT, yoga/stretch) with date
 * @returns {Object} { currentStreak: number, longestStreak: number }
 */
const calculateStreakWithRestDays = (allSessions = []) => {
  if (!allSessions || allSessions.length === 0) {
    return { currentStreak: 0, longestStreak: 0 };
  }

  // Sort sessions by date (newest first)
  const sortedSessions = [...allSessions].sort((a, b) => 
    new Date(b.date) - new Date(a.date)
  );

  // Get unique session dates (in case multiple sessions on same day)
  const sessionDates = new Set(sortedSessions.map(w => {
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
  let isCurrentStreakActive = false; // Track if we're still counting the current streak
  
  // First check if there's a session within the last 2 days to start the current streak
  const lastSessionDate = new Date(sortedSessions[0].date);
  lastSessionDate.setHours(0, 0, 0, 0);
  const daysSinceLastSession = Math.floor((today - lastSessionDate) / (1000 * 60 * 60 * 24));
  if (daysSinceLastSession <= 1) {
    isCurrentStreakActive = true; // User has worked out today or yesterday
  }
  
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
    
    if (sessionDates.has(checkTime)) {
      // Found a session on this day
      streakCount++;
      // Update current streak if it's still active
      if (isCurrentStreakActive) {
        currentStreak = streakCount;
      }
      longestStreak = Math.max(longestStreak, streakCount);
    } else {
      // No session on this day
      missedDaysInCurrentWeek++;
      
      // Check if this breaks the streak
      // Streak breaks if: more than 1 missed day per week, OR 2+ consecutive missed days
      if (missedDaysInCurrentWeek > 1) {
        // Check if we have 2 consecutive missed days (within 7 days)
        const nextDate = new Date(checkDate);
        nextDate.setDate(nextDate.getDate() - 1);
        if (!sessionDates.has(nextDate.getTime()) && i > 0) {
          // Two consecutive days without session - break streak
          if (isCurrentStreakActive && streakCount > 0) {
            isCurrentStreakActive = false; // Current streak has ended
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
 * If user's first session was less than 30 days ago, calculates adherence based on 
 * days since first session. Otherwise uses the last 30 days.
 * @param {Array} allSessions - Array of all completed sessions (strength, cardio, HIIT, yoga/stretch)
 * @param {number} days - Number of days to calculate adherence for (default 30)
 * @returns {number} Adherence percentage (0-100)
 */
const calculateAdherenceWith6DayWeek = (allSessions = [], days = 30) => {
  if (!allSessions || allSessions.length === 0) {
    return 0;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Find the date of the first session
  const firstSessionDate = new Date(Math.min(...allSessions.map(s => new Date(s.date).getTime())));
  firstSessionDate.setHours(0, 0, 0, 0);

  // Calculate days since first session
  const daysSinceFirstSession = Math.floor((today - firstSessionDate) / (1000 * 60 * 60 * 24)) + 1;

  // Use the smaller of: days parameter or days since first session (minimum 30)
  const effectiveDays = daysSinceFirstSession < days ? daysSinceFirstSession : days;

  const cutoffDate = new Date(today);
  cutoffDate.setDate(cutoffDate.getDate() - effectiveDays + 1); // +1 to include today
  cutoffDate.setHours(0, 0, 0, 0);

  // Get unique session dates in the effective period
  const uniqueSessionDates = new Set();
  allSessions.forEach(s => {
    const sessionDate = new Date(s.date);
    sessionDate.setHours(0, 0, 0, 0);
    if (sessionDate >= cutoffDate && sessionDate <= today) {
      uniqueSessionDates.add(sessionDate.toDateString());
    }
  });

  const daysWithSessions = uniqueSessionDates.size;

  // Calculate adherence as percentage of days with any session
  if (effectiveDays === 0) return 0;
  
  const adherencePercent = Math.min(100, Math.round((daysWithSessions / effectiveDays) * 100));
  
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
  const [currentTab, setCurrentTab] = useState(0);
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);
  
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

  // Edit/Delete state for activities
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedActivityIndex, setSelectedActivityIndex] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

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
      if (workout.type === 'cardio' || workout.type === 'hiit' || workout.cardioType) {
        cardioSessions++;
      } else if (workout.type === 'yoga' || workout.type === 'stretch' || workout.type === 'mobility' || workout.yogaType) {
        yogaSessions++;
      } else if (workout.type === 'strength' || workout.type === 'full' || workout.type === 'upper' || 
          workout.type === 'lower' || workout.type === 'push' || workout.type === 'pull' || workout.type === 'legs') {
        strengthSessions++;
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
      const [loadedHistory, loadedStretchSessions, loadedHiitSessions, loadedCardioSessions, loadedStats] = await Promise.all([
        getWorkoutHistory(),
        getStretchSessions(),
        getHiitSessions(),
        getCardioSessions(),
        getUserStats()
      ]);
      
      // Merge all session types for unified history display and calculations
      const allSessions = [
        ...loadedHistory,
        ...loadedStretchSessions,
        ...loadedHiitSessions,
        ...loadedCardioSessions
      ];
      
      setHistory(allSessions);
      setUserStats(loadedStats);

      // Calculate tracking metrics using new improved functions with all session types
      const streak = calculateStreakWithRestDays(allSessions);
      setStreakData(streak);

      const adherencePercent = calculateAdherenceWith6DayWeek(allSessions, 30);
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

  // Handle edit activity
  const handleEditActivity = (index) => {
    setSelectedActivityIndex(index);
    setEditDialogOpen(true);
  };

  // Handle delete activity
  const handleDeleteActivity = (index) => {
    setSelectedActivityIndex(index);
    setDeleteDialogOpen(true);
  };

  // Confirm delete
  const confirmDelete = async () => {
    try {
      await deleteWorkout(selectedActivityIndex);
      setSnackbar({ open: true, message: 'Activity deleted successfully', severity: 'success' });
      setDeleteDialogOpen(false);
      setSelectedActivityIndex(null);
      await loadData();
    } catch (error) {
      console.error('Error deleting activity:', error);
      setSnackbar({ open: true, message: 'Failed to delete activity', severity: 'error' });
    }
  };

  // Save edited activity
  const handleSaveActivity = async (updatedActivity) => {
    try {
      await updateWorkout(selectedActivityIndex, updatedActivity);
      setSnackbar({ open: true, message: 'Activity updated successfully', severity: 'success' });
      setEditDialogOpen(false);
      setSelectedActivityIndex(null);
      await loadData();
    } catch (error) {
      console.error('Error updating activity:', error);
      setSnackbar({ open: true, message: 'Failed to update activity', severity: 'error' });
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
          Loading
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          >
            ...
          </motion.span>
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
            sx={{ 
              maxWidth: { xs: '100%', sm: 600 }, 
              margin: '0 auto',
              '& .MuiTab-root': {
                transition: 'color 0.3s ease',
                '&.Mui-selected': {
                  color: currentTab === 0 ? 'primary.main' : 'warning.main',
                },
              },
              '& .MuiTabs-indicator': {
                height: 3,
                borderRadius: '3px 3px 0 0',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                backgroundColor: currentTab === 0 ? 'primary.main' : 'warning.main',
              },
            }}
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
            {/* Monthly Calendar View - at the top */}
            <Box>
              <MonthCalendarView
                workoutHistory={history}
              />
            </Box>

            {/* Time Frame Filter - Icon Button */}
            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                startIcon={<FilterList />}
                onClick={() => setFilterDialogOpen(true)}
                variant="outlined"
                size="small"
                sx={{ 
                  textTransform: 'none',
                  borderRadius: 2,
                }}
              >
                {timeFrame === 'all' ? 'All Time' : 
                 timeFrame === '7days' ? '7 Days' :
                 timeFrame === '30days' ? '30 Days' :
                 timeFrame === '3months' ? '3 Months' :
                 timeFrame === 'year' ? 'Year' :
                 timeFrame === 'custom' ? 'Custom' : 'Filter'}
              </Button>
            </Box>

            {/* Streak - Highlighted */}
            <Card 
              sx={{ 
                bgcolor: 'background.paper',
                boxShadow: 3,
                border: '2px solid #FF6B35',
              }}
            >
              <CardContent sx={{ p: 2.5 }}>
                <Stack direction="row" alignItems="center" justifyContent="space-between">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Whatshot sx={{ fontSize: 48, color: '#FF6B35' }} />
                    <Box>
                      <Typography variant="h2" sx={{ fontWeight: 700, color: '#FF6B35', lineHeight: 1 }}>
                        {streakData.currentStreak}
                      </Typography>
                      <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 600 }}>
                        Day Streak
                      </Typography>
                    </Box>
                  </Box>
                  <Box sx={{ textAlign: 'right' }}>
                    <Typography variant="caption" color="text.secondary">
                      Longest
                    </Typography>
                    <Typography variant="h5" sx={{ fontWeight: 700, color: 'primary.main' }}>
                      {streakData.longestStreak}
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>

            {/* Adherence */}
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
                    Days with sessions (last 30 days or since first session)
                  </Typography>
                </Stack>
              </CardContent>
            </Card>

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

            {/* Combined Workouts Stats - Stylized table without lines */}
            <Card sx={{ bgcolor: 'background.paper' }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                  Workout Summary
                </Typography>
                <Stack spacing={2.5}>
                  {/* Total Workouts */}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <FitnessCenter sx={{ fontSize: 28, color: 'primary.main' }} />
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>
                        Total Workouts
                      </Typography>
                    </Box>
                    <Typography variant="h5" sx={{ fontWeight: 700, color: 'primary.main' }}>
                      {filteredStats.totalWorkouts}
                    </Typography>
                  </Box>

                  <Divider />

                  {/* Total Strength */}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <FitnessCenter sx={{ fontSize: 28, color: 'error.main' }} />
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>
                        Total Strength
                      </Typography>
                    </Box>
                    <Typography variant="h5" sx={{ fontWeight: 700, color: 'error.main' }}>
                      {filteredStats.strengthSessions}
                    </Typography>
                  </Box>

                  <Divider />

                  {/* Total Cardio */}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <DirectionsRun sx={{ fontSize: 28, color: 'success.main' }} />
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>
                        Total Cardio
                      </Typography>
                    </Box>
                    <Typography variant="h5" sx={{ fontWeight: 700, color: 'success.main' }}>
                      {filteredStats.cardioSessions}
                    </Typography>
                  </Box>

                  <Divider />

                  {/* Total Yoga */}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <SelfImprovement sx={{ fontSize: 28, color: 'secondary.main' }} />
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>
                        Total Yoga
                      </Typography>
                    </Box>
                    <Typography variant="h5" sx={{ fontWeight: 700, color: 'secondary.main' }}>
                      {filteredStats.yogaSessions}
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>

            {/* Weight Tracking */}
            <WeightTracker
              weightHistory={profile.weightHistory || []}
              currentWeight={profile.currentWeight}
              currentUnit={profile.weightUnit || 'lbs'}
              targetWeight={profile.targetWeight}
              onAddWeight={addWeightEntry}
            />

            {/* Recent Activity Section - at the bottom */}
            {history.length > 0 && (
              <Box>
                <Typography 
                  variant="h6" 
                  sx={{ 
                    fontWeight: 600, 
                    color: 'text.primary',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    mb: 2,
                  }}
                >
                  <TrendingUp /> Recent Activity
                </Typography>
                <ActivitiesList 
                  activities={history}
                  onEdit={handleEditActivity}
                  onDelete={handleDeleteActivity}
                  maxVisible={10}
                  showLoadMore={true}
                />
              </Box>
            )}
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

        {/* Filter Dialog */}
        <Dialog
          open={filterDialogOpen}
          onClose={() => setFilterDialogOpen(false)}
          maxWidth="xs"
          fullWidth
        >
          <DialogTitle>Time Frame Filter</DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ mt: 1 }}>
              <ToggleButtonGroup
                value={timeFrame}
                exclusive
                onChange={(e, newValue) => {
                  if (newValue !== null) {
                    setTimeFrame(newValue);
                  }
                }}
                orientation="vertical"
                fullWidth
              >
                <ToggleButton value="all">All Time</ToggleButton>
                <ToggleButton value="7days">Last 7 Days</ToggleButton>
                <ToggleButton value="30days">Last 30 Days</ToggleButton>
                <ToggleButton value="3months">Last 3 Months</ToggleButton>
                <ToggleButton value="year">Last Year</ToggleButton>
                <ToggleButton value="custom">Custom Range</ToggleButton>
              </ToggleButtonGroup>

              {timeFrame === 'custom' && (
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <Stack spacing={2}>
                    <DatePicker
                      label="Start Date"
                      value={customStartDate}
                      onChange={(newValue) => setCustomStartDate(newValue)}
                      slotProps={{ 
                        textField: { 
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
                          fullWidth: true 
                        } 
                      }}
                    />
                  </Stack>
                </LocalizationProvider>
              )}
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button 
              onClick={() => {
                setTimeFrame('all');
                setCustomStartDate(null);
                setCustomEndDate(null);
              }}
            >
              Clear Filters
            </Button>
            <Button 
              onClick={() => setFilterDialogOpen(false)}
              variant="contained"
            >
              Apply
            </Button>
          </DialogActions>
        </Dialog>

        {/* Edit Activity Dialog */}
        <EditActivityDialog
          open={editDialogOpen}
          onClose={() => {
            setEditDialogOpen(false);
            setSelectedActivityIndex(null);
          }}
          activity={selectedActivityIndex !== null ? history[selectedActivityIndex] : null}
          onSave={handleSaveActivity}
        />

        {/* Delete Confirmation Dialog */}
        <Dialog
          open={deleteDialogOpen}
          onClose={() => {
            setDeleteDialogOpen(false);
            setSelectedActivityIndex(null);
          }}
        >
          <DialogTitle>Delete Activity?</DialogTitle>
          <DialogContent>
            <Typography>
              Are you sure you want to delete this activity? This action cannot be undone.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => {
              setDeleteDialogOpen(false);
              setSelectedActivityIndex(null);
            }}>
              Cancel
            </Button>
            <Button onClick={confirmDelete} color="error" variant="contained">
              Delete
            </Button>
          </DialogActions>
        </Dialog>

        {/* Snackbar for notifications */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert 
            onClose={() => setSnackbar({ ...snackbar, open: false })} 
            severity={snackbar.severity}
            sx={{ width: '100%' }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </Box>
  );
};

ProgressDashboard.propTypes = {};

export default ProgressDashboard;
