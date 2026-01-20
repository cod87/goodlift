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
  Divider,
  LinearProgress,
  Snackbar,
  Alert,
  useMediaQuery,
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
  HelpOutline,
} from '@mui/icons-material';
import Achievements from './Achievements';
import WeightTracker from './WeightTracker';
import MonthCalendarView from './Calendar/MonthCalendarView';
import ActivitiesList from './Progress/ActivitiesList';
import EditActivityDialog from './EditActivityDialog';
import LoadingScreen from './LoadingScreen';
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
import { BREAKPOINTS } from '../theme/responsive';
import { StreakDisplay, AdherenceDisplay, VolumeTrendDisplay } from './Progress/TrackingCards';
import MuscleVolumeTracker from './Progress/MuscleVolumeTracker';
import { useUserProfile } from '../contexts/UserProfileContext';
import { calculateStreak, calculateAdherence } from '../utils/trackingMetrics';

/**
 * ProgressDashboard - Complete progress tracking dashboard
 * Features:
 * - Day Streak with smart rest day allowance
 * - Adherence based on 6 days/week standard
 * - Personal Records, Total Workouts, Average Duration
 * - Strength/Cardio/Yoga session counts
 * - Weight tracking integration
 * - Time frame filtering (7 days, 3 months, year, all time)
 * - Desktop: Enhanced multi-column grid layout
 */
const ProgressDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState([]);
  const [pinnedExercises, setPinnedExercisesState] = useState([]);
  const [availableExercises, setAvailableExercises] = useState([]);
  const [addExerciseDialogOpen, setAddExerciseDialogOpen] = useState(false);
  const [exerciseSearchQuery, setExerciseSearchQuery] = useState('');
  const [currentTab, setCurrentTab] = useState(0);
  const [streakInfoOpen, setStreakInfoOpen] = useState(false);
  
  // Desktop layout detection
  const isDesktop = useMediaQuery(`(min-width: ${BREAKPOINTS.desktop}px)`);
  const isMobile = useMediaQuery(`(max-width: ${BREAKPOINTS.tablet - 1}px)`);
  
  // Time frame filter state - defaulting to 'all' and hidden from UI
  const [timeFrame] = useState('all'); // Always 'all' - filter UI removed
  const [customStartDate] = useState(null);
  const [customEndDate] = useState(null);
  
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
    let restSessions = 0;
    let totalDuration = 0;
    
    const exercisePRs = {}; // Track PRs per exercise
    
    filteredHistory.forEach(workout => {
      // Count session types based on workout.sessionType (preferred) or workout.type
      // sessionType is more reliable for manually logged sessions
      const sessionType = workout.sessionType || workout.type || '';
      const workoutType = workout.type || '';
      
      // Check for rest sessions first
      if (sessionType === 'rest' || workoutType === 'rest') {
        // Rest days - count separately but don't include in workouts
        restSessions++;
      }
      // Check for cardio sessions (including HIIT and all cardio subtypes)
      else if (
        sessionType === 'cardio' || 
        workoutType === 'cardio' || 
        workoutType === 'hiit' || 
        workoutType === 'running' || 
        workoutType === 'cycling' || 
        workoutType === 'swimming' ||
        workout.cardioType
      ) {
        cardioSessions++;
      }
      // Check for yoga/stretch/mobility sessions
      else if (
        sessionType === 'yoga' || 
        sessionType === 'stretch' ||
        workoutType === 'yoga' || 
        workoutType === 'stretch' || 
        workoutType === 'mobility' ||
        workout.yogaType ||
        workout.stretches // Stretch sessions have a stretches array
      ) {
        yogaSessions++;
      }
      // Check for strength sessions
      else if (
        sessionType === 'strength' ||
        workoutType === 'strength' || 
        workoutType === 'full' || 
        workoutType === 'upper' || 
        workoutType === 'lower' || 
        workoutType === 'push' || 
        workoutType === 'pull' || 
        workoutType === 'legs' ||
        workoutType === 'core'
      ) {
        strengthSessions++;
      }
      // Fallback: if it has exercises, assume it's a strength session
      else if (workout.exercises && Object.keys(workout.exercises).length > 0) {
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
    
    // Total workouts excludes rest days
    const totalWorkouts = filteredHistory.length - restSessions;
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

      // Calculate tracking metrics using canonical functions from trackingMetrics.js
      const streak = calculateStreak(allSessions);
      setStreakData(streak);

      // Calculate adherence for last 30 days (activePlan is null since we removed planning features)
      const adherencePercent = calculateAdherence(allSessions, null, 30);
      setAdherence(adherencePercent);

      // Load pinned exercises and sync with latest performance from workout history
      const pinned = await progressiveOverloadService.syncPinnedExercisesWithHistory(loadedHistory);
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

  const handleRemovePinnedExercise = async (exerciseName) => {
    await progressiveOverloadService.removePinnedExercise(exerciseName);
    setPinnedExercisesState(pinnedExercises.filter(p => p.exerciseName !== exerciseName));
  };

  const handleAddPinnedExercise = async (exerciseName) => {
    const success = await progressiveOverloadService.addPinnedExercise(exerciseName, 'weight');
    if (success) {
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
    return <LoadingScreen />;
  }

  return (
    <Box sx={{ width: '100%', minHeight: '100vh', overflowX: 'hidden' }}>
      <Box sx={{ 
        // Desktop: wider max-width
        maxWidth: isDesktop ? '1600px' : '1400px', 
        margin: '0 auto', 
        p: { xs: 1.5, sm: 2, md: 3, lg: 4 }, 
        pt: { xs: 0.5, sm: 1, md: 2 },
        pb: { xs: '80px', md: 3 },
        width: '100%',
        boxSizing: 'border-box',
      }}>
        {/* Tab Navigation - Compact */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
          <Tabs
            value={currentTab}
            onChange={(e, newValue) => setCurrentTab(newValue)}
            variant="fullWidth"
            sx={{ 
              maxWidth: { xs: '100%', sm: 500 }, 
              margin: '0 auto',
              '& .MuiTab-root': {
                minHeight: 44,
                transition: 'color 0.3s ease',
                fontSize: '0.85rem',
                '&.Mui-selected': {
                  color: currentTab === 0 ? 'primary.main' : 'warning.main',
                },
              },
              '& .MuiTabs-indicator': {
                height: 2,
                borderRadius: '2px 2px 0 0',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                backgroundColor: currentTab === 0 ? 'primary.main' : 'warning.main',
              },
            }}
          >
            <Tab 
              icon={<Assessment sx={{ fontSize: '1.1rem' }} />} 
              iconPosition="start" 
              label="Statistics" 
              sx={{ minHeight: 44 }}
            />
            <Tab 
              icon={<EmojiEvents sx={{ fontSize: '1.1rem' }} />} 
              iconPosition="start" 
              label="Achievements" 
              sx={{ minHeight: 44 }}
            />
          </Tabs>
        </Box>

        {/* Statistics Tab */}
        {currentTab === 0 && (
          <Stack spacing={2}>
            {/* Monthly Calendar View - at the top */}
            <Box>
              <MonthCalendarView
                workoutHistory={history}
              />
            </Box>

            {/* Streak and Adherence - side by side on desktop */}
            <Box sx={{ 
              display: isDesktop ? 'grid' : 'block',
              gridTemplateColumns: isDesktop ? '1fr 1fr' : '1fr',
              gap: 2,
            }}>
              {/* Streak - Highlighted */}
              <Card 
                sx={{ 
                  bgcolor: 'background.paper',
                  boxShadow: 3,
                  border: '2px solid #FF6B35',
                  mb: isDesktop ? 0 : 2,
                }}
              >
                <CardContent sx={{ p: 2.5 }}>
                  <Stack spacing={2}>
                    <Stack direction="row" alignItems="center" justifyContent="space-between">
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Whatshot sx={{ fontSize: 48, color: '#FF6B35' }} />
                        <Box>
                          <Typography variant="h2" sx={{ fontWeight: 700, color: '#FF6B35', lineHeight: 1 }}>
                            {streakData.currentStreak}
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 600 }}>
                              Day Streak
                            </Typography>
                            <IconButton 
                              size="small" 
                              onClick={() => setStreakInfoOpen(true)}
                              sx={{ 
                                padding: 0.5, 
                                color: 'text.secondary',
                                '&:hover': { color: 'primary.main' }
                              }}
                            >
                              <HelpOutline sx={{ fontSize: 16 }} />
                            </IconButton>
                          </Box>
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

                    {/* Progress Bar to Personal Best */}
                    <Box sx={{ pt: 1 }}>
                      {(() => {
                        // Check if user has achieved a new record (current >= longest and current > 0)
                        const isNewRecord = streakData.currentStreak >= streakData.longestStreak && streakData.currentStreak > 0;
                        
                        // Calculate progress percentage (current / (longest + 1) * 100)
                        // When longestStreak is 0 and currentStreak is 0, show 0%
                        // When currentStreak >= longestStreak, show "New Record!" instead of percentage
                        const progressPercentage = streakData.longestStreak === 0 
                          ? 0
                          : Math.round((streakData.currentStreak / (streakData.longestStreak + 1)) * 100);
                        
                        return (
                          <>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                              <Typography variant="caption" color="text.secondary">
                                Progress to Personal Best
                              </Typography>
                              {isNewRecord ? (
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                  <EmojiEvents sx={{ fontSize: 18, color: '#FFD700' }} />
                                  <Typography variant="caption" sx={{ fontWeight: 600, color: '#FFD700' }}>
                                    New Record!
                                  </Typography>
                                </Box>
                              ) : (
                                <Typography variant="caption" sx={{ fontWeight: 600, color: '#FF6B35' }}>
                                  {progressPercentage}%
                                </Typography>
                              )}
                            </Box>
                            <LinearProgress
                              variant="determinate"
                              value={
                                streakData.longestStreak === 0 || streakData.currentStreak === 0
                                  ? 0 
                                  : Math.min(100, (streakData.currentStreak / (streakData.longestStreak + 1)) * 100)
                              }
                              sx={{
                                height: 8,
                                borderRadius: 4,
                                bgcolor: 'rgba(255, 107, 53, 0.2)',
                                '& .MuiLinearProgress-bar': {
                                  borderRadius: 4,
                                  background: isNewRecord
                                    ? 'linear-gradient(90deg, #FFD700 0%, #FFA500 100%)'
                                    : 'linear-gradient(90deg, #FF6B35 0%, #FF8C42 100%)',
                                },
                              }}
                            />
                          </>
                        );
                      })()}
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
            </Box>

            {/* Workout Summary - Shown here in mobile view, after Streak/Adherence */}
            {isMobile && (
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
            )}

            {/* Muscle Volume Tracker */}
            {history.length > 0 && (
              <MuscleVolumeTracker workoutHistory={history} />
            )}

            {/* Progressive Overload Section - Moved here, below adherence */}
          {history.length > 0 && (
            <Card sx={{ bgcolor: 'background.paper' }}>
              <CardContent sx={{ p: { xs: 2, sm: 2.5 } }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Progressive Overload
                  </Typography>
                  {pinnedExercises.length < 10 && (
                    <Button
                      size="small"
                      startIcon={<Add />}
                      onClick={() => setAddExerciseDialogOpen(true)}
                      variant="text"
                    >
                      Add
                    </Button>
                  )}
                </Stack>

                {pinnedExercises.length === 0 ? (
                  <Box sx={{ textAlign: 'center', py: 3 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      Track your favorite exercises to see your progress
                    </Typography>
                    <Button
                      variant="outlined"
                      startIcon={<Add />}
                      onClick={() => setAddExerciseDialogOpen(true)}
                      size="small"
                    >
                      Add Exercise
                    </Button>
                  </Box>
                ) : (
                  <Stack spacing={1}>
                    {pinnedExercises.map((pinned) => {
                      // Use tracking mode from pinned exercise, default to weight
                      const trackingMode = pinned.trackingMode || 'weight';
                      const progression = progressiveOverloadService.getExerciseProgression(
                        history,
                        pinned.exerciseName,
                        trackingMode
                      );

                      // Always use stored latest performance - this is synced from workout history
                      const currentWeight = pinned.lastWeight !== undefined ? pinned.lastWeight : 0;
                      const currentReps = pinned.lastReps !== undefined ? pinned.lastReps : 0;
                      
                      // Determine if we have any data to show
                      const hasData = currentWeight > 0 || currentReps > 0 || progression.length > 0;
                      
                      // Calculate starting and current values for comparison
                      const startingValue = progression.length > 0 ? progression[0].value : 
                                           (trackingMode === 'reps' ? currentReps : currentWeight);
                      const currentValue = trackingMode === 'reps' ? currentReps : currentWeight;
                      
                      // Determine progression direction
                      const progressionDirection = currentValue > startingValue ? 'up' : 
                                                   currentValue < startingValue ? 'down' : 'stable';
                      
                      const unit = trackingMode === 'reps' ? 'reps' : 'lbs';

                      return (
                        <Box 
                          key={pinned.exerciseName}
                          sx={{
                            py: 1,
                            px: 1.5,
                            borderRadius: 1.5,
                            bgcolor: 'action.hover',
                          }}
                        >
                          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.5 }}>
                            <Typography variant="caption" sx={{ fontWeight: 600, flex: 1, fontSize: '0.8rem' }}>
                              {pinned.exerciseName}
                            </Typography>
                            <IconButton
                              onClick={() => handleRemovePinnedExercise(pinned.exerciseName)}
                              size="small"
                              sx={{ color: 'text.secondary', p: 0.5 }}
                            >
                              <Close sx={{ fontSize: 14 }} />
                            </IconButton>
                          </Stack>

                          {hasData ? (
                            <Stack direction="row" alignItems="center" spacing={1} sx={{ justifyContent: 'space-between' }}>
                              <Box sx={{ textAlign: 'center', flex: 1 }}>
                                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem', display: 'block' }}>
                                  Start
                                </Typography>
                                <Typography variant="body2" sx={{ fontWeight: 700, color: 'primary.main', fontSize: '0.875rem', lineHeight: 1.2 }}>
                                  {startingValue} {unit}
                                </Typography>
                                {trackingMode === 'weight' && (
                                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
                                    {currentReps}r
                                  </Typography>
                                )}
                              </Box>
                              
                              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: 20 }}>
                                {progressionDirection === 'up' && (
                                  <TrendingUp sx={{ fontSize: 20, color: 'success.main' }} />
                                )}
                                {progressionDirection === 'down' && (
                                  <TrendingDown sx={{ fontSize: 20, color: 'error.main' }} />
                                )}
                                {progressionDirection === 'stable' && (
                                  <Remove sx={{ fontSize: 20, color: 'text.secondary' }} />
                                )}
                              </Box>

                              <Box sx={{ textAlign: 'center', flex: 1 }}>
                                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem', display: 'block' }}>
                                  Now
                                </Typography>
                                <Typography variant="body2" sx={{ fontWeight: 700, color: 'secondary.main', fontSize: '0.875rem', lineHeight: 1.2 }}>
                                  {currentValue} {unit}
                                </Typography>
                                {trackingMode === 'weight' && (
                                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
                                    {currentReps}r
                                  </Typography>
                                )}
                              </Box>
                            </Stack>
                          ) : (
                            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                              No data yet
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

            {/* Workout Summary - Shown here in tablet/desktop view, after Progressive Overload */}
            {!isMobile && (
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
            )}

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

        {/* Streak Info Dialog */}
        <Dialog
          open={streakInfoOpen}
          onClose={() => setStreakInfoOpen(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Whatshot sx={{ color: '#FF6B35' }} />
            How Streaks Work
          </DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ mt: 1 }}>
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
                  📅 Consecutive Days
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Your streak counts consecutive calendar days where you logged at least one session (any type - strength, cardio, yoga, etc.).
                </Typography>
              </Box>

              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
                  ✅ Rest Day Logic
                </Typography>
                <Typography variant="body2" color="text.secondary" component="div">
                  To maintain your streak, complete weeks (Sun-Sat) need:
                  <Box component="ul" sx={{ mt: 0.5, mb: 0, pl: 2 }}>
                    <li><strong>At least 3 strength training sessions</strong> per week</li>
                  </Box>
                  Incomplete weeks (weeks where your streak doesn't cover all 7 days from Sunday to Saturday) don't have this strength training requirement.
                </Typography>
              </Box>

              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
                  💪 What Counts as Strength Training?
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Full body, upper body, lower body, push, pull, legs, or any workout with resistance exercises.
                </Typography>
              </Box>

              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
                  📊 How Streaks Are Counted
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Each consecutive day with logged sessions adds 1 to your streak. The calendar shows all logged sessions that contribute to your streak.
                </Typography>
              </Box>

              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
                  ⚠️ When Streaks Break
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Your streak breaks if you:
                  <Box component="ul" sx={{ mt: 0.5, mb: 0, pl: 2 }}>
                    <li>Miss a full day without logging any session</li>
                    <li>Have a complete week (Sun-Sat) with fewer than 3 strength sessions</li>
                  </Box>
                </Typography>
              </Box>

              <Box sx={{ p: 1.5, bgcolor: 'info.light', borderRadius: 1 }}>
                <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
                  <strong>Tip:</strong> Your streak is active if you worked out today or yesterday. Keep it going!
                </Typography>
              </Box>
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setStreakInfoOpen(false)} variant="contained">
              Got it
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
