import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { motion } from 'framer-motion';
import { 
  getWorkoutHistory, 
  deleteWorkout,
  updateWorkout,
  getStretchSessions,
  getYogaSessions,
  getHiitSessions,
  getCardioSessions,
  getPlyoSessions,
  getPlannedWorkouts,
  deferPlannedWorkout,
  deleteStretchSession,
  deleteYogaSession,
  deleteHiitSession,
  deleteCardioSession,
  updateYogaSession,
  updateHiitSession,
  updateCardioSession,
  getPinnedExercises,
  updatePinnedExerciseMode,
  removePinnedExercise,
  addPinnedExercise
} from '../utils/storage';
import { formatDate, formatDuration } from '../utils/helpers';
import { 
  getExerciseProgression, 
  getUniqueExercises,
  formatProgressionForChart 
} from '../utils/progressionHelpers';
import Calendar from './Calendar';
import { 
  Box, 
  Card, 
  CardContent, 
  Typography, 
  Grid, 
  Stack, 
  IconButton, 
  Chip, 
  Button,
  Switch,
  FormControlLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  ToggleButtonGroup,
  ToggleButton,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import { 
  FitnessCenter, 
  Timer, 
  TrendingUp, 
  Whatshot, 
  Delete, 
  TrendingUpRounded, 
  SelfImprovement, 
  DirectionsRun,
  Add,
  Close,
  Edit
} from '@mui/icons-material';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { EXERCISES_DATA_PATH } from '../utils/constants';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const ProgressScreen = () => {
  const [history, setHistory] = useState([]);
  const [stretchSessions, setStretchSessions] = useState([]);
  const [yogaSessions, setYogaSessions] = useState([]);
  const [hiitSessions, setHiitSessions] = useState([]);
  const [cardioSessions, setCardioSessions] = useState([]);
  const [plyoSessions, setPlyoSessions] = useState([]);
  const [plannedWorkouts, setPlannedWorkouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(null);
  const [pinnedExercises, setPinnedExercisesState] = useState([]);
  const [addExerciseDialogOpen, setAddExerciseDialogOpen] = useState(false);
  const [availableExercises, setAvailableExercises] = useState([]);
  const [timeFilter, setTimeFilter] = useState('all'); // 'all', 'month', '2weeks'
  const [exerciseSearchQuery, setExerciseSearchQuery] = useState('');
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingSession, setEditingSession] = useState(null);
  const [editingSessionType, setEditingSessionType] = useState(null); // 'workout', 'cardio', 'hiit', 'yoga', 'plyo'

  const loadData = async () => {
    setLoading(true);
    try {
      const [loadedHistory, loadedStretches, loadedYoga, loadedHiit, loadedCardio, loadedPlyo, loadedPlanned] = await Promise.all([
        getWorkoutHistory(),
        getStretchSessions(),
        getYogaSessions(),
        getHiitSessions(),
        getCardioSessions(),
        getPlyoSessions(),
        getPlannedWorkouts()
      ]);
      setHistory(loadedHistory);
      setStretchSessions(loadedStretches);
      setYogaSessions(loadedYoga);
      setHiitSessions(loadedHiit);
      setCardioSessions(loadedCardio);
      setPlyoSessions(loadedPlyo);
      setPlannedWorkouts(loadedPlanned);
      
      // Load pinned exercises
      const pinned = getPinnedExercises();
      setPinnedExercisesState(pinned);
      
      // Load all exercises from exercises.json for selection
      try {
        const response = await fetch(EXERCISES_DATA_PATH);
        const exercisesData = await response.json();
        const allExercises = exercisesData.map(ex => ex['Exercise Name']).sort();
        setAvailableExercises(allExercises);
      } catch (error) {
        console.error('Error loading exercises:', error);
        // Fallback to unique exercises from history
        const unique = getUniqueExercises(loadedHistory);
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

  const handleDeleteWorkout = async (index) => {
    if (window.confirm('Are you sure you want to delete this workout? This action cannot be undone.')) {
      await deleteWorkout(index);
      // Reload data after deletion
      await loadData();
    }
  };

  const handleDeleteStretch = async (sessionId) => {
    if (window.confirm('Are you sure you want to delete this stretch session? This action cannot be undone.')) {
      await deleteStretchSession(sessionId);
      await loadData();
    }
  };

  const handleDeleteYoga = async (sessionId) => {
    if (window.confirm('Are you sure you want to delete this yoga session? This action cannot be undone.')) {
      await deleteYogaSession(sessionId);
      await loadData();
    }
  };

  const handleDeleteHiit = async (sessionId) => {
    if (window.confirm('Are you sure you want to delete this HIIT session? This action cannot be undone.')) {
      await deleteHiitSession(sessionId);
      await loadData();
    }
  };

  const handleDeleteCardio = async (sessionId) => {
    if (window.confirm('Are you sure you want to delete this cardio session? This action cannot be undone.')) {
      await deleteCardioSession(sessionId);
      await loadData();
    }
  };

  const handleEditWorkout = (workout, index) => {
    setEditingSession({ ...workout, index });
    setEditingSessionType('workout');
    setEditDialogOpen(true);
  };

  const handleEditCardio = (session) => {
    setEditingSession(session);
    setEditingSessionType('cardio');
    setEditDialogOpen(true);
  };

  const handleEditHiit = (session) => {
    setEditingSession(session);
    setEditingSessionType('hiit');
    setEditDialogOpen(true);
  };

  const handleEditYoga = (session) => {
    setEditingSession(session);
    setEditingSessionType('yoga');
    setEditDialogOpen(true);
  };

  const handleSaveEdit = async (updatedData) => {
    try {
      if (editingSessionType === 'workout') {
        await updateWorkout(editingSession.index, updatedData);
      } else if (editingSessionType === 'cardio') {
        await updateCardioSession(editingSession.id, updatedData);
      } else if (editingSessionType === 'hiit') {
        await updateHiitSession(editingSession.id, updatedData);
      } else if (editingSessionType === 'yoga') {
        await updateYogaSession(editingSession.id, updatedData);
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

  const getWorkoutTypeLabel = (type) => {
    if (!type) return 'Workout';
    
    switch (type.toLowerCase()) {
      case 'upper':
        return 'Upper Body Workout';
      case 'lower':
        return 'Lower Body Workout';
      case 'full':
        return 'Full Body Workout';
      default:
        return type;
    }
  };

  const handleToggleTrackingMode = (exerciseName, currentMode) => {
    const newMode = currentMode === 'weight' ? 'reps' : 'weight';
    updatePinnedExerciseMode(exerciseName, newMode);
    const updated = pinnedExercises.map(p => 
      p.exerciseName === exerciseName ? { ...p, trackingMode: newMode } : p
    );
    setPinnedExercisesState(updated);
  };

  const handleRemovePinnedExercise = (exerciseName) => {
    removePinnedExercise(exerciseName);
    setPinnedExercisesState(pinnedExercises.filter(p => p.exerciseName !== exerciseName));
  };

  const handleAddPinnedExercise = (exerciseName) => {
    if (addPinnedExercise(exerciseName, 'weight')) {
      setPinnedExercisesState([...pinnedExercises, { exerciseName, trackingMode: 'weight' }]);
      setAddExerciseDialogOpen(false);
    }
  };

  // Helper function to filter sessions by time period
  const filterByTimePeriod = (sessions) => {
    if (timeFilter === 'all') return sessions;
    
    const now = new Date();
    let cutoffDate;
    
    if (timeFilter === 'month') {
      cutoffDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
    } else if (timeFilter === '2weeks') {
      cutoffDate = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000); // 14 days ago
    }
    
    return sessions.filter(session => new Date(session.date) >= cutoffDate);
  };

  // Calculate filtered stats based on time filter
  const getFilteredStats = () => {
    const filteredWorkouts = filterByTimePeriod(history);
    const filteredCardio = filterByTimePeriod(cardioSessions);
    const filteredHiit = filterByTimePeriod(hiitSessions);
    const filteredYoga = filterByTimePeriod(yogaSessions);
    
    const totalWorkouts = filteredWorkouts.length;
    const totalWorkoutTime = filteredWorkouts.reduce((sum, w) => sum + (w.duration || 0), 0);
    const avgWorkout = totalWorkouts > 0 ? Math.round(totalWorkoutTime / totalWorkouts / 60) : 0;
    
    // Combine cardio and HIIT sessions
    const allCardio = [...filteredCardio, ...filteredHiit];
    const totalCardio = allCardio.length;
    const totalCardioTime = allCardio.reduce((sum, s) => sum + (s.duration || 0), 0);
    const avgCardio = totalCardio > 0 ? Math.round(totalCardioTime / totalCardio / 60) : 0;
    
    const totalYoga = filteredYoga.length;
    const totalYogaTime = filteredYoga.reduce((sum, s) => sum + (s.duration || 0), 0);
    const avgYoga = totalYoga > 0 ? Math.round(totalYogaTime / totalYoga / 60) : 0;
    
    return {
      totalWorkouts,
      avgWorkout,
      totalCardio,
      avgCardio,
      totalYoga,
      avgYoga
    };
  };

  const filteredStats = getFilteredStats();

  if (loading) {
    return (
      <div className="screen progress-screen">
        <p>Loading...</p>
      </div>
    );
  }

  // Extract workout dates for calendar - include all session types with their types
  const workoutSessions = [
    ...history.map(workout => ({ 
      date: workout.date, 
      type: workout.type || 'full', // Use workout.type (upper/lower/full) or default to full
      duration: workout.duration || 0
    })),
    ...hiitSessions.map(session => ({ 
      date: session.date, 
      type: 'hiit',
      duration: session.duration || 0
    })),
    ...cardioSessions.map(session => ({ 
      date: session.date, 
      type: 'cardio',
      duration: session.duration || 0
    })),
    ...plyoSessions.map(session => ({ 
      date: session.date, 
      type: 'plyo',
      duration: session.duration || 0
    })),
    ...stretchSessions.map(session => ({ 
      date: session.date, 
      type: 'stretch',
      duration: session.duration || 0
    })),
    ...yogaSessions.map(session => ({ 
      date: session.date, 
      type: 'yoga',
      duration: session.duration || 0
    }))
  ];

  // Handle day click in calendar
  const handleDayClick = (date) => {
    setSelectedDate(date);
    // Scroll to the session list
    setTimeout(() => {
      const sessionList = document.querySelector('.workout-history-container');
      if (sessionList) {
        sessionList.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  // Handle defer planned workout
  const handleDeferPlanned = async (plannedId) => {
    try {
      await deferPlannedWorkout(plannedId);
      // Reload data to update calendar
      const loadedPlanned = await getPlannedWorkouts();
      setPlannedWorkouts(loadedPlanned);
    } catch (error) {
      console.error('Error deferring planned workout:', error);
    }
  };

  // Filter sessions by selected date
  const isSameDay = (date1, date2) => {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    return d1.getFullYear() === d2.getFullYear() &&
           d1.getMonth() === d2.getMonth() &&
           d1.getDate() === d2.getDate();
  };

  const getFilteredSessions = () => {
    if (!selectedDate) {
      return {
        workouts: history,
        hiit: hiitSessions,
        stretch: stretchSessions,
        yoga: yogaSessions,
        cardio: cardioSessions,
        plyo: plyoSessions
      };
    }

    return {
      workouts: history.filter(w => isSameDay(w.date, selectedDate)),
      hiit: hiitSessions.filter(s => isSameDay(s.date, selectedDate)),
      stretch: stretchSessions.filter(s => isSameDay(s.date, selectedDate)),
      yoga: yogaSessions.filter(s => isSameDay(s.date, selectedDate)),
      cardio: cardioSessions.filter(s => isSameDay(s.date, selectedDate)),
      plyo: plyoSessions.filter(s => isSameDay(s.date, selectedDate))
    };
  };

  const filteredSessions = getFilteredSessions();
  const hasSessionsOnSelectedDay = selectedDate && (
    filteredSessions.workouts.length > 0 ||
    filteredSessions.hiit.length > 0 ||
    filteredSessions.stretch.length > 0 ||
    filteredSessions.yoga.length > 0 ||
    filteredSessions.cardio.length > 0 ||
    filteredSessions.plyo.length > 0
  );

  return (
    <motion.div
      className="screen progress-screen"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      style={{ maxWidth: '900px', margin: '0 auto', padding: '1rem' }}
    >
      {/* Time Filter Controls */}
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'center' }}>
        <ToggleButtonGroup
          value={timeFilter}
          exclusive
          onChange={(e, newFilter) => {
            if (newFilter !== null) {
              setTimeFilter(newFilter);
            }
          }}
          size="small"
          sx={{
            '& .MuiToggleButton-root': {
              px: 2,
              py: 0.5,
              fontSize: '0.75rem',
              fontWeight: 600,
              textTransform: 'none',
            }
          }}
        >
          <ToggleButton value="all">All Time</ToggleButton>
          <ToggleButton value="month">Past Month</ToggleButton>
          <ToggleButton value="2weeks">Past 2 Weeks</ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {/* Stats Overview - Redesigned for mobile */}
      <Box sx={{ mb: 3 }}>
        <Stack spacing={2}>
          {/* Row 1: Total Workouts & Avg Workout */}
          <Stack direction="row" spacing={2}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              style={{ flex: 1 }}
            >
              <Card sx={{ 
                height: '100%',
                borderRadius: 3,
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 8px 24px rgba(237, 63, 39, 0.15)',
                }
              }}>
                <CardContent sx={{ p: 2 }}>
                  <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1 }}>
                    <FitnessCenter sx={{ fontSize: 32, color: 'secondary.main' }} />
                    <Typography variant="body2" sx={{ 
                      color: 'text.secondary',
                      textTransform: 'uppercase',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      letterSpacing: 0.5,
                    }}>
                      Total Workouts
                    </Typography>
                  </Stack>
                  <Typography variant="h3" sx={{ 
                    fontWeight: 700,
                    color: 'secondary.main',
                    fontSize: { xs: '2rem', sm: '2.5rem' },
                    textAlign: 'center'
                  }}>
                    {filteredStats.totalWorkouts}
                  </Typography>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              style={{ flex: 1 }}
            >
              <Card sx={{ 
                height: '100%',
                borderRadius: 3,
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 8px 24px rgba(19, 70, 134, 0.15)',
                }
              }}>
                <CardContent sx={{ p: 2 }}>
                  <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1 }}>
                    <Timer sx={{ fontSize: 32, color: 'secondary.main' }} />
                    <Typography variant="body2" sx={{ 
                      color: 'text.secondary',
                      textTransform: 'uppercase',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      letterSpacing: 0.5,
                    }}>
                      Avg Workout
                    </Typography>
                  </Stack>
                  <Typography variant="h3" sx={{ 
                    fontWeight: 700,
                    color: 'secondary.main',
                    fontSize: { xs: '2rem', sm: '2.5rem' },
                    textAlign: 'center'
                  }}>
                    {filteredStats.avgWorkout}m
                  </Typography>
                </CardContent>
              </Card>
            </motion.div>
          </Stack>

          {/* Row 2: Total Cardio & Avg Cardio */}
          <Stack direction="row" spacing={2}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              style={{ flex: 1 }}
            >
              <Card sx={{ 
                height: '100%',
                borderRadius: 3,
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 8px 24px rgba(33, 150, 243, 0.15)',
                }
              }}>
                <CardContent sx={{ p: 2 }}>
                  <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1 }}>
                    <DirectionsRun sx={{ fontSize: 32, color: '#2196f3' }} />
                    <Typography variant="body2" sx={{ 
                      color: 'text.secondary',
                      textTransform: 'uppercase',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      letterSpacing: 0.5,
                    }}>
                      Total Cardio
                    </Typography>
                  </Stack>
                  <Typography variant="h3" sx={{ 
                    fontWeight: 700,
                    color: '#2196f3',
                    fontSize: { xs: '2rem', sm: '2.5rem' },
                    textAlign: 'center'
                  }}>
                    {filteredStats.totalCardio}
                  </Typography>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              style={{ flex: 1 }}
            >
              <Card sx={{ 
                height: '100%',
                borderRadius: 3,
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 8px 24px rgba(33, 150, 243, 0.15)',
                }
              }}>
                <CardContent sx={{ p: 2 }}>
                  <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1 }}>
                    <Timer sx={{ fontSize: 32, color: '#2196f3' }} />
                    <Typography variant="body2" sx={{ 
                      color: 'text.secondary',
                      textTransform: 'uppercase',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      letterSpacing: 0.5,
                    }}>
                      Avg Cardio
                    </Typography>
                  </Stack>
                  <Typography variant="h3" sx={{ 
                    fontWeight: 700,
                    color: '#2196f3',
                    fontSize: { xs: '2rem', sm: '2.5rem' },
                    textAlign: 'center'
                  }}>
                    {filteredStats.avgCardio}m
                  </Typography>
                </CardContent>
              </Card>
            </motion.div>
          </Stack>

          {/* Row 3: Yoga Sessions & Avg Yoga */}
          <Stack direction="row" spacing={2}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              style={{ flex: 1 }}
            >
              <Card sx={{ 
                height: '100%',
                borderRadius: 3,
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 8px 24px rgba(156, 39, 176, 0.15)',
                }
              }}>
                <CardContent sx={{ p: 2 }}>
                  <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1 }}>
                    <SelfImprovement sx={{ fontSize: 32, color: '#9c27b0' }} />
                    <Typography variant="body2" sx={{ 
                      color: 'text.secondary',
                      textTransform: 'uppercase',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      letterSpacing: 0.5,
                    }}>
                      Total Mobility
                    </Typography>
                  </Stack>
                  <Typography variant="h3" sx={{ 
                    fontWeight: 700,
                    color: '#9c27b0',
                    fontSize: { xs: '2rem', sm: '2.5rem' },
                    textAlign: 'center'
                  }}>
                    {filteredStats.totalYoga}
                  </Typography>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              style={{ flex: 1 }}
            >
              <Card sx={{ 
                height: '100%',
                borderRadius: 3,
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 8px 24px rgba(156, 39, 176, 0.15)',
                }
              }}>
                <CardContent sx={{ p: 2 }}>
                  <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1 }}>
                    <Timer sx={{ fontSize: 32, color: '#9c27b0' }} />
                    <Typography variant="body2" sx={{ 
                      color: 'text.secondary',
                      textTransform: 'uppercase',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      letterSpacing: 0.5,
                    }}>
                      AVG Mobility
                    </Typography>
                  </Stack>
                  <Typography variant="h3" sx={{ 
                    fontWeight: 700,
                    color: '#9c27b0',
                    fontSize: { xs: '2rem', sm: '2.5rem' },
                    textAlign: 'center'
                  }}>
                    {filteredStats.avgYoga}m
                  </Typography>
                </CardContent>
              </Card>
            </motion.div>
          </Stack>
        </Stack>
      </Box>

      {/* Calendar - positioned after stats, before history */}
      <Calendar 
        workoutSessions={workoutSessions} 
        plannedWorkouts={plannedWorkouts}
        onDayClick={handleDayClick} 
        onDeferPlanned={handleDeferPlanned}
      />

      {/* Progressive Overload Section */}
      {history.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card sx={{ 
            mb: 3,
            borderRadius: 3,
            overflow: 'hidden',
          }}>
            <Box sx={{ 
              background: 'rgb(19, 70, 134)',
              p: 1.5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 1,
            }}>
              <Stack direction="row" alignItems="center" gap={1}>
                <TrendingUpRounded sx={{ fontSize: 28, color: 'white' }} />
                <Typography variant="h6" sx={{ 
                  fontWeight: 700,
                  color: 'white',
                }}>
                  Progressive Overload Tracking
                </Typography>
              </Stack>
              {pinnedExercises.length < 10 && (
                <IconButton 
                  onClick={() => setAddExerciseDialogOpen(true)}
                  size="small"
                  sx={{ color: 'white' }}
                  aria-label="Add exercise to track"
                >
                  <Add />
                </IconButton>
              )}
            </Box>
            <CardContent sx={{ p: 2 }}>
              {pinnedExercises.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 3 }}>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    No exercises pinned for tracking yet. Click the + button to add exercises.
                  </Typography>
                  <Button 
                    variant="outlined" 
                    startIcon={<Add />}
                    onClick={() => setAddExerciseDialogOpen(true)}
                  >
                    Add Exercise to Track
                  </Button>
                </Box>
              ) : (
                <Grid container spacing={2}>
                  {pinnedExercises.map((pinned) => {
                    const progression = getExerciseProgression(
                      history, 
                      pinned.exerciseName, 
                      pinned.trackingMode
                    );
                    const chartData = formatProgressionForChart(
                      progression,
                      pinned.trackingMode === 'weight' ? 'Weight (lbs)' : 'Reps',
                      pinned.trackingMode
                    );

                    const chartOptions = {
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: { display: false },
                        title: { display: false },
                      },
                      scales: {
                        y: {
                          beginAtZero: pinned.trackingMode === 'reps',
                          min: chartData.minValue,
                          ticks: {
                            callback: function(value) {
                              return pinned.trackingMode === 'weight' 
                                ? `${value} lbs` 
                                : value;
                            },
                          },
                        },
                        x: {
                          offset: true, // Ensures first point is offset from y-axis
                          ticks: {
                            maxRotation: 0,
                            minRotation: 0,
                          }
                        }
                      },
                    };

                    return (
                      <Grid item xs={12} sm={6} md={6} key={pinned.exerciseName}>
                        <Box sx={{ 
                          p: 1.5,
                          borderRadius: 2,
                          border: '1px solid rgba(19, 70, 134, 0.2)',
                          background: 'rgba(19, 70, 134, 0.02)',
                        }}>
                          <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 0.5 }}>
                            <Typography variant="body2" sx={{ 
                              fontWeight: 600,
                              fontSize: '0.875rem',
                              flex: 1,
                            }}>
                              {pinned.exerciseName}
                            </Typography>
                            <IconButton
                              onClick={() => handleRemovePinnedExercise(pinned.exerciseName)}
                              size="small"
                              sx={{ 
                                ml: 1,
                                color: 'text.secondary',
                                '&:hover': { color: 'error.main' }
                              }}
                            >
                              <Close sx={{ fontSize: 16 }} />
                            </IconButton>
                          </Stack>
                          
                          <FormControlLabel
                            control={
                              <Switch
                                checked={pinned.trackingMode === 'reps'}
                                onChange={() => handleToggleTrackingMode(pinned.exerciseName, pinned.trackingMode)}
                                size="small"
                              />
                            }
                            label={
                              <Typography variant="caption">
                                {pinned.trackingMode === 'weight' ? 'Weight' : 'Reps'}
                              </Typography>
                            }
                            sx={{ mb: 0.5 }}
                          />
                          
                          <Box sx={{ height: 180 }}>
                            {progression.length > 0 ? (
                              <Line data={chartData} options={chartOptions} />
                            ) : (
                              <Typography 
                                variant="caption" 
                                color="text.secondary"
                                sx={{ display: 'block', textAlign: 'center', py: 4 }}
                              >
                                No data available for this exercise
                              </Typography>
                            )}
                          </Box>
                        </Box>
                      </Grid>
                    );
                  })}
                </Grid>
              )}
            </CardContent>
          </Card>
        </motion.div>
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
          {availableExercises.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              Loading exercises...
            </Typography>
          ) : (
            <>
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
                      <ListItemButton onClick={() => {
                        handleAddPinnedExercise(exerciseName);
                        setExerciseSearchQuery('');
                      }}>
                        <ListItemText primary={exerciseName} />
                      </ListItemButton>
                    </ListItem>
                  ))}
              </List>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setAddExerciseDialogOpen(false);
            setExerciseSearchQuery('');
          }}>Cancel</Button>
        </DialogActions>
      </Dialog>

      <div className="workout-history-container">
        <Typography variant="h5" component="h2" sx={{ 
          fontWeight: 700,
          mb: 1.5,
          color: 'text.primary'
        }}>
          {selectedDate 
            ? `Activities on ${selectedDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`
            : 'All Activities'}
        </Typography>
        {selectedDate && (
          <Button
            variant="outlined"
            size="small"
            onClick={() => setSelectedDate(null)}
            sx={{ mb: 1.5 }}
          >
            Show All Activities
          </Button>
        )}
        <Stack spacing={0.75}>
          {selectedDate && !hasSessionsOnSelectedDay ? (
            <Typography sx={{ textAlign: 'center', py: 3, color: 'text.secondary', fontSize: '0.875rem' }}>
              No activities logged for this day.
            </Typography>
          ) : (
            <>
              {/* Workout Sessions */}
              {filteredSessions.workouts.length > 0 && filteredSessions.workouts.map((workout, idx) => (
                <motion.div
                  key={`workout-${idx}`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.02 * idx }}
                >
                  <Card sx={{ 
                    borderLeft: '3px solid',
                    borderLeftColor: 'primary.main',
                    borderRadius: 1,
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      transform: 'translateX(2px)',
                      boxShadow: '0 2px 8px rgba(48, 86, 105, 0.12)',
                    }
                  }}>
                    <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Stack direction="row" spacing={0.75} alignItems="center" sx={{ mb: 0.25 }}>
                            <FitnessCenter sx={{ fontSize: 16, color: 'primary.main' }} />
                            <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.875rem' }}>
                              {getWorkoutTypeLabel(workout.type)}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                              • {formatDate(workout.date)}
                            </Typography>
                            {workout.isPartial && (
                              <Chip 
                                label="Partial" 
                                size="small" 
                                sx={{ 
                                  height: 18,
                                  fontSize: '0.65rem',
                                  color: 'warning.main',
                                  borderColor: 'warning.main'
                                }}
                                variant="outlined"
                              />
                            )}
                            {workout.isManualLog && (
                              <Chip 
                                label="Manual" 
                                size="small" 
                                sx={{ 
                                  height: 18,
                                  fontSize: '0.65rem',
                                  color: 'info.main',
                                  borderColor: 'info.main'
                                }}
                                variant="outlined"
                              />
                            )}
                          </Stack>
                          <Stack direction="row" spacing={1} alignItems="center" sx={{ flexWrap: 'wrap' }}>
                            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                              {formatDuration(workout.duration)}
                            </Typography>
                            {workout.isManualLog && workout.numExercises ? (
                              <>
                                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                                  • {workout.numExercises} exercises
                                </Typography>
                                {workout.setsPerExercise && (
                                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                                    • {workout.setsPerExercise} sets
                                  </Typography>
                                )}
                              </>
                            ) : (
                              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                                • {Object.keys(workout.exercises).length} exercises
                              </Typography>
                            )}
                            {workout.notes && (
                              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem', fontStyle: 'italic' }}>
                                • {workout.notes}
                              </Typography>
                            )}
                          </Stack>
                        </Box>
                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                          <IconButton
                            onClick={() => handleEditWorkout(workout, idx)}
                            size="small"
                            sx={{
                              color: 'text.secondary',
                              '&:hover': {
                                backgroundColor: 'primary.light',
                                color: 'primary.main',
                              }
                            }}
                            aria-label="Edit workout"
                          >
                            <Edit sx={{ fontSize: 18 }} />
                          </IconButton>
                          <IconButton
                            onClick={() => handleDeleteWorkout(idx)}
                            size="small"
                            sx={{
                              color: 'text.secondary',
                              '&:hover': {
                                backgroundColor: 'error.light',
                                color: 'error.main',
                              }
                            }}
                            aria-label="Delete workout"
                          >
                            <Delete sx={{ fontSize: 18 }} />
                          </IconButton>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}

              {/* HIIT Sessions */}
              {filteredSessions.hiit.length > 0 && filteredSessions.hiit.map((session) => (
                <motion.div
                  key={session.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.02 }}
                >
                  <Card sx={{ 
                    borderLeft: '3px solid',
                    borderLeftColor: 'secondary.main',
                    borderRadius: 1,
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      transform: 'translateX(2px)',
                      boxShadow: '0 2px 8px rgba(237, 63, 39, 0.12)',
                    }
                  }}>
                    <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Box sx={{ flex: 1 }}>
                          <Stack direction="row" spacing={0.75} alignItems="center" sx={{ mb: 0.25 }}>
                            <Whatshot sx={{ fontSize: 16, color: 'secondary.main' }} />
                            <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.875rem' }}>
                              HIIT Session
                            </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                              • {formatDate(session.date)}
                            </Typography>
                          </Stack>
                          <Stack direction="row" spacing={1} alignItems="center" sx={{ flexWrap: 'wrap' }}>
                            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                              {formatDuration(session.duration)}
                            </Typography>
                            {session.notes && (
                              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem', fontStyle: 'italic' }}>
                                • {session.notes}
                              </Typography>
                            )}
                          </Stack>
                        </Box>
                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                          <IconButton
                            onClick={() => handleEditHiit(session)}
                            size="small"
                            sx={{
                              color: 'text.secondary',
                              '&:hover': {
                                backgroundColor: 'secondary.light',
                                color: 'secondary.main',
                              }
                            }}
                            aria-label="Edit HIIT session"
                          >
                            <Edit sx={{ fontSize: 18 }} />
                          </IconButton>
                          <IconButton
                            onClick={() => handleDeleteHiit(session.id)}
                            size="small"
                            sx={{
                              color: 'text.secondary',
                              '&:hover': {
                                backgroundColor: 'error.light',
                                color: 'error.main',
                              }
                            }}
                            aria-label="Delete HIIT session"
                          >
                            <Delete sx={{ fontSize: 18 }} />
                          </IconButton>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}

              {/* Stretch Sessions */}
              {filteredSessions.stretch.length > 0 && filteredSessions.stretch.map((session) => (
                <motion.div
                  key={session.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.02 }}
                >
                  <Card sx={{ 
                    borderLeft: '3px solid',
                    borderLeftColor: 'success.main',
                    borderRadius: 1,
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      transform: 'translateX(2px)',
                      boxShadow: '0 2px 8px rgba(76, 175, 80, 0.12)',
                    }
                  }}>
                    <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Box sx={{ flex: 1 }}>
                          <Stack direction="row" spacing={0.75} alignItems="center" sx={{ mb: 0.25 }}>
                            <DirectionsRun sx={{ fontSize: 16, color: 'success.main' }} />
                            <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.875rem' }}>
                              {session.type === 'full' ? 'Full Body' : 'Custom'} Stretch
                            </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                              • {formatDate(session.date)}
                            </Typography>
                          </Stack>
                          <Stack direction="row" spacing={1} alignItems="center">
                            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                              {formatDuration(session.duration)}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                              • {session.stretchesCompleted} stretches
                            </Typography>
                          </Stack>
                        </Box>
                        <IconButton
                          onClick={() => handleDeleteStretch(session.id)}
                          size="small"
                          sx={{
                            ml: 1,
                            color: 'text.secondary',
                            '&:hover': {
                              backgroundColor: 'error.light',
                              color: 'error.main',
                            }
                          }}
                          aria-label="Delete stretch session"
                        >
                          <Delete sx={{ fontSize: 18 }} />
                        </IconButton>
                      </Box>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}

              {/* Yoga Sessions */}
              {filteredSessions.yoga.length > 0 && filteredSessions.yoga.map((session) => (
                <motion.div
                  key={session.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.02 }}
                >
                  <Card sx={{ 
                    borderLeft: '3px solid',
                    borderLeftColor: '#9c27b0',
                    borderRadius: 1,
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      transform: 'translateX(2px)',
                      boxShadow: '0 2px 8px rgba(156, 39, 176, 0.12)',
                    }
                  }}>
                    <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Box sx={{ flex: 1 }}>
                          <Stack direction="row" spacing={0.75} alignItems="center" sx={{ mb: 0.25 }}>
                            <SelfImprovement sx={{ fontSize: 16, color: '#9c27b0' }} />
                            <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.875rem' }}>
                              Yoga Session
                            </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                              • {formatDate(session.date)}
                            </Typography>
                          </Stack>
                          <Stack direction="row" spacing={1} alignItems="center" sx={{ flexWrap: 'wrap' }}>
                            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                              {formatDuration(session.duration)}
                            </Typography>
                            {session.flowLength > 0 && (
                              <>
                                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                                  • Flow: {session.flowLength}m
                                </Typography>
                                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                                  • {session.poseCount} poses
                                </Typography>
                              </>
                            )}
                            {session.notes && (
                              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem', fontStyle: 'italic' }}>
                                • {session.notes}
                              </Typography>
                            )}
                          </Stack>
                        </Box>
                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                          <IconButton
                            onClick={() => handleEditYoga(session)}
                            size="small"
                            sx={{
                              color: 'text.secondary',
                              '&:hover': {
                                backgroundColor: '#f3e5f5',
                                color: '#9c27b0',
                              }
                            }}
                            aria-label="Edit yoga session"
                          >
                            <Edit sx={{ fontSize: 18 }} />
                          </IconButton>
                          <IconButton
                            onClick={() => handleDeleteYoga(session.id)}
                            size="small"
                            sx={{
                              color: 'text.secondary',
                              '&:hover': {
                                backgroundColor: 'error.light',
                                color: 'error.main',
                              }
                            }}
                            aria-label="Delete yoga session"
                          >
                            <Delete sx={{ fontSize: 18 }} />
                          </IconButton>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}

              {/* Cardio Sessions */}
              {filteredSessions.cardio.length > 0 && filteredSessions.cardio.map((session) => (
                <motion.div
                  key={session.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.02 }}
                >
                  <Card sx={{ 
                    borderLeft: '3px solid',
                    borderLeftColor: '#2196f3',
                    borderRadius: 1,
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      transform: 'translateX(2px)',
                      boxShadow: '0 2px 8px rgba(33, 150, 243, 0.12)',
                    }
                  }}>
                    <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Box sx={{ flex: 1 }}>
                          <Stack direction="row" spacing={0.75} alignItems="center" sx={{ mb: 0.25 }}>
                            <FitnessCenter sx={{ fontSize: 16, color: '#2196f3' }} />
                            <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.875rem' }}>
                              {session.cardioType}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                              • {formatDate(session.date)}
                            </Typography>
                          </Stack>
                          <Stack direction="row" spacing={1} alignItems="center" sx={{ flexWrap: 'wrap' }}>
                            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                              {formatDuration(session.duration)}
                            </Typography>
                            {session.notes && (
                              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem', fontStyle: 'italic' }}>
                                • {session.notes}
                              </Typography>
                            )}
                          </Stack>
                        </Box>
                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                          <IconButton
                            onClick={() => handleEditCardio(session)}
                            size="small"
                            sx={{
                              color: 'text.secondary',
                              '&:hover': {
                                backgroundColor: '#e3f2fd',
                                color: '#2196f3',
                              }
                            }}
                            aria-label="Edit cardio session"
                          >
                            <Edit sx={{ fontSize: 18 }} />
                          </IconButton>
                          <IconButton
                            onClick={() => handleDeleteCardio(session.id)}
                            size="small"
                            sx={{
                              color: 'text.secondary',
                              '&:hover': {
                                backgroundColor: 'error.light',
                                color: 'error.main',
                              }
                            }}
                            aria-label="Delete cardio session"
                          >
                            <Delete sx={{ fontSize: 18 }} />
                          </IconButton>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}

              {!selectedDate && history.length === 0 && hiitSessions.length === 0 && stretchSessions.length === 0 && yogaSessions.length === 0 && cardioSessions.length === 0 && (
                <Typography sx={{ textAlign: 'center', py: 3, color: 'text.secondary', fontSize: '0.875rem' }}>
                  No activity history yet. Complete your first activity to see it here!
                </Typography>
              )}
            </>
          )}
        </Stack>
      </div>

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
    </motion.div>
  );
};

// Edit Session Dialog Component
const EditSessionDialog = ({ open, onClose, onSave, session, sessionType }) => {
  const [duration, setDuration] = useState(session.duration ? Math.round(session.duration / 60) : 0);
  const [notes, setNotes] = useState(session.notes || '');
  const [workoutType, setWorkoutType] = useState(session.type || 'full');
  const [numExercises, setNumExercises] = useState(session.numExercises || '');
  const [setsPerExercise, setSetsPerExercise] = useState(session.setsPerExercise || '');
  const [cardioType, setCardioType] = useState(session.cardioType || '');

  const handleSubmit = () => {
    const updatedData = {
      duration: duration * 60, // Convert back to seconds
      notes: notes.trim(),
    };

    if (sessionType === 'workout') {
      updatedData.type = workoutType;
      if (numExercises) updatedData.numExercises = parseInt(numExercises);
      if (setsPerExercise) updatedData.setsPerExercise = parseInt(setsPerExercise);
    } else if (sessionType === 'cardio') {
      updatedData.cardioType = cardioType.trim();
    }

    onSave(updatedData);
  };

  const getTitle = () => {
    switch (sessionType) {
      case 'workout':
        return 'Edit Workout';
      case 'cardio':
        return 'Edit Cardio Session';
      case 'hiit':
        return 'Edit HIIT Session';
      case 'yoga':
        return 'Edit Yoga Session';
      default:
        return 'Edit Session';
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
            <>
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

              <TextField
                fullWidth
                type="number"
                label="Number of Exercises"
                value={numExercises}
                onChange={(e) => setNumExercises(e.target.value)}
                inputProps={{ min: 1, step: 1 }}
              />

              <TextField
                fullWidth
                type="number"
                label="Sets per Exercise"
                value={setsPerExercise}
                onChange={(e) => setSetsPerExercise(e.target.value)}
                inputProps={{ min: 1, step: 1 }}
              />
            </>
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

export default ProgressScreen;
