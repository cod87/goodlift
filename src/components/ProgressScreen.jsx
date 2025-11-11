import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { motion } from 'framer-motion';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Stack,
  Button,
  IconButton,
  Chip,
  ToggleButtonGroup,
  ToggleButton,
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
  Switch,
  FormControlLabel,
} from '@mui/material';
import {
  FitnessCenter,
  Timer,
  TrendingUp,
  Whatshot,
  DirectionsRun,
  SelfImprovement,
  Add,
  Close,
  Edit,
  Delete,
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
import CompactHeader from './Common/CompactHeader';
import Calendar from './Calendar';
import {
  getWorkoutHistory,
  deleteWorkout,
  updateWorkout,
  getStretchSessions,
  getYogaSessions,
  getHiitSessions,
  getCardioSessions,
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
  addPinnedExercise,
  getActivePlan,
} from '../utils/storage';
import { formatDate, formatDuration } from '../utils/helpers';
import {
  getExerciseProgression,
  getUniqueExercises,
  formatProgressionForChart
} from '../utils/progressionHelpers';
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

/**
 * ProgressDashboard - Complete progress tracking dashboard
 * Redesigned to match the modern style of Workouts and Plans pages
 */
const ProgressDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState([]);
  const [stretchSessions, setStretchSessions] = useState([]);
  const [yogaSessions, setYogaSessions] = useState([]);
  const [hiitSessions, setHiitSessions] = useState([]);
  const [cardioSessions, setCardioSessions] = useState([]);
  const [activePlan, setActivePlan] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [pinnedExercises, setPinnedExercisesState] = useState([]);
  const [availableExercises, setAvailableExercises] = useState([]);
  const [timeFilter, setTimeFilter] = useState('all');
  const [addExerciseDialogOpen, setAddExerciseDialogOpen] = useState(false);
  const [exerciseSearchQuery, setExerciseSearchQuery] = useState('');
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingSession, setEditingSession] = useState(null);
  const [editingSessionType, setEditingSessionType] = useState(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [loadedHistory, loadedStretches, loadedYoga, loadedHiit, loadedCardio, loadedActivePlan] = await Promise.all([
        getWorkoutHistory(),
        getStretchSessions(),
        getYogaSessions(),
        getHiitSessions(),
        getCardioSessions(),
        getActivePlan()
      ]);
      setHistory(loadedHistory);
      setStretchSessions(loadedStretches);
      setYogaSessions(loadedYoga);
      setHiitSessions(loadedHiit);
      setCardioSessions(loadedCardio);
      setActivePlan(loadedActivePlan);

      const pinned = getPinnedExercises();
      setPinnedExercisesState(pinned);

      try {
        const response = await fetch(EXERCISES_DATA_PATH);
        const exercisesData = await response.json();
        const exerciseNames = exercisesData.map(ex => ex['Exercise Name']).sort();
        setAvailableExercises(exerciseNames);
      } catch (error) {
        console.error('Error loading exercises:', error);
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
      setExerciseSearchQuery('');
    }
  };

  const filterByTimePeriod = (sessions) => {
    if (timeFilter === 'all') return sessions;

    const now = new Date();
    let cutoffDate;

    if (timeFilter === 'month') {
      cutoffDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    } else if (timeFilter === '2weeks') {
      cutoffDate = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
    }

    return sessions.filter(session => new Date(session.date) >= cutoffDate);
  };

  const getFilteredStats = () => {
    const filteredWorkouts = filterByTimePeriod(history);
    const filteredCardio = filterByTimePeriod(cardioSessions);
    const filteredHiit = filterByTimePeriod(hiitSessions);
    const filteredYoga = filterByTimePeriod(yogaSessions);

    const totalWorkouts = filteredWorkouts.length;
    const totalWorkoutTime = filteredWorkouts.reduce((sum, w) => sum + (w.duration || 0), 0);
    const avgWorkout = totalWorkouts > 0 ? Math.round(totalWorkoutTime / totalWorkouts / 60) : 0;

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

  const workoutSessions = [
    ...history.map(workout => ({
      date: workout.date,
      type: workout.type || 'full',
      duration: workout.duration || 0,
      status: 'completed'
    })),
    ...hiitSessions.map(session => ({
      date: session.date,
      type: 'hiit',
      duration: session.duration || 0,
      status: 'completed'
    })),
    ...cardioSessions.map(session => ({
      date: session.date,
      type: 'cardio',
      duration: session.duration || 0,
      status: 'completed'
    })),
    ...stretchSessions.map(session => ({
      date: session.date,
      type: 'stretch',
      duration: session.duration || 0,
      status: 'completed'
    })),
    ...yogaSessions.map(session => ({
      date: session.date,
      type: 'yoga',
      duration: session.duration || 0,
      status: 'completed'
    })),
    ...(activePlan?.sessions || []).map(session => ({
      date: session.date,
      type: session.type,
      duration: session.duration || 60,
      status: session.status || 'planned'
    }))
  ];

  const handleDayClick = (date) => {
    setSelectedDate(date);
    setTimeout(() => {
      const sessionList = document.querySelector('.activities-section');
      if (sessionList) {
        sessionList.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

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
        cardio: cardioSessions
      };
    }

    return {
      workouts: history.filter(w => isSameDay(w.date, selectedDate)),
      hiit: hiitSessions.filter(s => isSameDay(s.date, selectedDate)),
      stretch: stretchSessions.filter(s => isSameDay(s.date, selectedDate)),
      yoga: yogaSessions.filter(s => isSameDay(s.date, selectedDate)),
      cardio: cardioSessions.filter(s => isSameDay(s.date, selectedDate))
    };
  };

  const filteredSessions = getFilteredSessions();
  const hasSessionsOnSelectedDay = selectedDate && (
    filteredSessions.workouts.length > 0 ||
    filteredSessions.hiit.length > 0 ||
    filteredSessions.stretch.length > 0 ||
    filteredSessions.yoga.length > 0 ||
    filteredSessions.cardio.length > 0
  );

  if (loading) {
    return (
      <Box sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh'
      }}>
        <img
          src={`${import.meta.env.BASE_URL}dancing-icon.svg`}
          alt="Loading..."
          style={{ width: '150px', height: '150px' }}
        />
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%', minHeight: '100vh' }}>
      <CompactHeader title="Progress Dashboard" subtitle="Track your fitness journey" />

      <Box sx={{ maxWidth: '1400px', margin: '0 auto', p: { xs: 2, md: 3 } }}>
        <Stack spacing={3}>
          {/* Time Filter */}
          <Box sx={{ display: 'flex', justifyContent: 'center' }}>
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
                  px: 3,
                  py: 1,
                  fontSize: '0.875rem',
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

          {/* Stats Overview */}
          <Grid container spacing={2}>
            <Grid item xs={6} md={3}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <Card sx={{
                  borderRadius: 3,
                  background: 'linear-gradient(135deg, #134686 0%, #1db584 100%)',
                  transition: 'transform 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                  }
                }}>
                  <CardContent sx={{ textAlign: 'center', py: 3 }}>
                    <FitnessCenter sx={{ fontSize: 40, color: 'white', mb: 1 }} />
                    <Typography variant="h3" sx={{ fontWeight: 700, color: 'white', mb: 0.5 }}>
                      {filteredStats.totalWorkouts}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.9)', textTransform: 'uppercase', fontWeight: 600 }}>
                      Workouts
                    </Typography>
                  </CardContent>
                </Card>
              </motion.div>
            </Grid>

            <Grid item xs={6} md={3}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Card sx={{
                  borderRadius: 3,
                  background: 'linear-gradient(135deg, #ff8c00 0%, #ffb347 100%)',
                  transition: 'transform 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                  }
                }}>
                  <CardContent sx={{ textAlign: 'center', py: 3 }}>
                    <Timer sx={{ fontSize: 40, color: 'white', mb: 1 }} />
                    <Typography variant="h3" sx={{ fontWeight: 700, color: 'white', mb: 0.5 }}>
                      {filteredStats.avgWorkout}m
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.9)', textTransform: 'uppercase', fontWeight: 600 }}>
                      Avg Duration
                    </Typography>
                  </CardContent>
                </Card>
              </motion.div>
            </Grid>

            <Grid item xs={6} md={3}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Card sx={{
                  borderRadius: 3,
                  background: 'linear-gradient(135deg, #2196f3 0%, #64b5f6 100%)',
                  transition: 'transform 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                  }
                }}>
                  <CardContent sx={{ textAlign: 'center', py: 3 }}>
                    <DirectionsRun sx={{ fontSize: 40, color: 'white', mb: 1 }} />
                    <Typography variant="h3" sx={{ fontWeight: 700, color: 'white', mb: 0.5 }}>
                      {filteredStats.totalCardio}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.9)', textTransform: 'uppercase', fontWeight: 600 }}>
                      Cardio Sessions
                    </Typography>
                  </CardContent>
                </Card>
              </motion.div>
            </Grid>

            <Grid item xs={6} md={3}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <Card sx={{
                  borderRadius: 3,
                  background: 'linear-gradient(135deg, #9c27b0 0%, #ba68c8 100%)',
                  transition: 'transform 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                  }
                }}>
                  <CardContent sx={{ textAlign: 'center', py: 3 }}>
                    <SelfImprovement sx={{ fontSize: 40, color: 'white', mb: 1 }} />
                    <Typography variant="h3" sx={{ fontWeight: 700, color: 'white', mb: 0.5 }}>
                      {filteredStats.totalYoga}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.9)', textTransform: 'uppercase', fontWeight: 600 }}>
                      Mobility
                    </Typography>
                  </CardContent>
                </Card>
              </motion.div>
            </Grid>
          </Grid>

          {/* Calendar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Card sx={{ borderRadius: 3 }}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>
                  Activity Calendar
                </Typography>
                <Calendar workoutSessions={workoutSessions} onDayClick={handleDayClick} />
                {selectedDate && (
                  <Box sx={{ mt: 2, p: 2, bgcolor: 'action.hover', borderRadius: 2 }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {selectedDate.toLocaleDateString('en-US', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </Typography>
                      <IconButton size="small" onClick={() => setSelectedDate(null)}>
                        <Close fontSize="small" />
                      </IconButton>
                    </Stack>
                    {hasSessionsOnSelectedDay && (
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                        {filteredSessions.workouts.length +
                          filteredSessions.hiit.length +
                          filteredSessions.stretch.length +
                          filteredSessions.yoga.length +
                          filteredSessions.cardio.length} session(s) recorded
                      </Typography>
                    )}
                  </Box>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Progressive Overload Tracking */}
          {history.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <Card sx={{ borderRadius: 3 }}>
                <CardContent>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                    <Typography variant="h6" sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
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
                                callback: (value) => {
                                  return pinned.trackingMode === 'weight'
                                    ? `${value} lbs`
                                    : value;
                                },
                              },
                            },
                            x: {
                              offset: true,
                              ticks: {
                                maxRotation: 0,
                                minRotation: 0,
                              }
                            }
                          },
                        };

                        return (
                          <Grid item xs={12} sm={6} md={4} key={pinned.exerciseName}>
                            <Box sx={{
                              p: 2,
                              borderRadius: 2,
                              border: '1px solid',
                              borderColor: 'divider',
                              bgcolor: 'background.default',
                            }}>
                              <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 1 }}>
                                <Typography variant="body2" sx={{ fontWeight: 600, flex: 1 }}>
                                  {pinned.exerciseName}
                                </Typography>
                                <IconButton
                                  onClick={() => handleRemovePinnedExercise(pinned.exerciseName)}
                                  size="small"
                                  sx={{ color: 'text.secondary' }}
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
                                sx={{ mb: 1 }}
                              />

                              <Box sx={{ height: 200 }}>
                                {progression.length > 0 ? (
                                  <Line data={chartData} options={chartOptions} />
                                ) : (
                                  <Typography
                                    variant="caption"
                                    color="text.secondary"
                                    sx={{ display: 'block', textAlign: 'center', py: 4 }}
                                  >
                                    No data available
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

          {/* Recent Activities */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="activities-section"
          >
            <Card sx={{ borderRadius: 3 }}>
              <CardContent>
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    {selectedDate
                      ? `Activities on ${selectedDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`
                      : 'Recent Activities'}
                  </Typography>
                  {selectedDate && (
                    <Button size="small" onClick={() => setSelectedDate(null)}>
                      Show All
                    </Button>
                  )}
                </Stack>

                <Stack spacing={1}>
                  {selectedDate && !hasSessionsOnSelectedDay ? (
                    <Typography sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
                      No activities logged for this day.
                    </Typography>
                  ) : (
                    <>
                      {/* Workout Sessions */}
                      {filteredSessions.workouts.map((workout, idx) => (
                        <ActivityCard
                          key={`workout-${idx}`}
                          type="workout"
                          session={workout}
                          index={idx}
                          onEdit={() => handleEditWorkout(workout, idx)}
                          onDelete={() => handleDeleteWorkout(idx)}
                        />
                      ))}

                      {/* HIIT Sessions */}
                      {filteredSessions.hiit.map((session) => (
                        <ActivityCard
                          key={session.id}
                          type="hiit"
                          session={session}
                          onEdit={() => handleEditHiit(session)}
                          onDelete={() => handleDeleteHiit(session.id)}
                        />
                      ))}

                      {/* Cardio Sessions */}
                      {filteredSessions.cardio.map((session) => (
                        <ActivityCard
                          key={session.id}
                          type="cardio"
                          session={session}
                          onEdit={() => handleEditCardio(session)}
                          onDelete={() => handleDeleteCardio(session.id)}
                        />
                      ))}

                      {/* Yoga Sessions */}
                      {filteredSessions.yoga.map((session) => (
                        <ActivityCard
                          key={session.id}
                          type="yoga"
                          session={session}
                          onEdit={() => handleEditYoga(session)}
                          onDelete={() => handleDeleteYoga(session.id)}
                        />
                      ))}

                      {/* Stretch Sessions */}
                      {filteredSessions.stretch.map((session) => (
                        <ActivityCard
                          key={session.id}
                          type="stretch"
                          session={session}
                          onDelete={() => handleDeleteStretch(session.id)}
                        />
                      ))}

                      {!selectedDate && history.length === 0 && hiitSessions.length === 0 &&
                        stretchSessions.length === 0 && yogaSessions.length === 0 && cardioSessions.length === 0 && (
                          <Typography sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
                            No activity history yet. Complete your first activity to see it here!
                          </Typography>
                        )}
                    </>
                  )}
                </Stack>
              </CardContent>
            </Card>
          </motion.div>
        </Stack>

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

// Activity Card Component
const ActivityCard = ({ type, session, onEdit, onDelete }) => {
  const getIcon = () => {
    switch (type) {
      case 'hiit': return <Whatshot sx={{ fontSize: 18, color: 'secondary.main' }} />;
      case 'cardio': return <DirectionsRun sx={{ fontSize: 18, color: '#2196f3' }} />;
      case 'yoga': return <SelfImprovement sx={{ fontSize: 18, color: '#9c27b0' }} />;
      case 'stretch': return <DirectionsRun sx={{ fontSize: 18, color: 'success.main' }} />;
      default: return <FitnessCenter sx={{ fontSize: 18, color: 'primary.main' }} />;
    }
  };

  const getLabel = () => {
    switch (type) {
      case 'hiit': return 'HIIT Session';
      case 'cardio': return session.cardioType || 'Cardio';
      case 'yoga': return 'Yoga Session';
      case 'stretch': return 'Stretch Session';
      default: return session.type ? `${session.type.charAt(0).toUpperCase() + session.type.slice(1)} Body` : 'Workout';
    }
  };

  const getBorderColor = () => {
    switch (type) {
      case 'hiit': return 'secondary.main';
      case 'cardio': return '#2196f3';
      case 'yoga': return '#9c27b0';
      case 'stretch': return 'success.main';
      default: return 'primary.main';
    }
  };

  return (
    <Card sx={{
      borderLeft: '3px solid',
      borderLeftColor: getBorderColor(),
      borderRadius: 1,
      transition: 'all 0.2s ease',
      '&:hover': {
        transform: 'translateX(2px)',
        boxShadow: '0 2px 8px rgba(48, 86, 105, 0.12)',
      }
    }}>
      <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ flex: 1 }}>
            <Stack direction="row" spacing={0.75} alignItems="center" sx={{ mb: 0.25 }}>
              {getIcon()}
              <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.875rem' }}>
                {getLabel()}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                • {formatDate(session.date)}
              </Typography>
              {session.isPartial && (
                <Chip
                  label="Partial"
                  size="small"
                  sx={{ height: 18, fontSize: '0.65rem' }}
                  variant="outlined"
                />
              )}
            </Stack>
            <Stack direction="row" spacing={1} alignItems="center">
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                {formatDuration(session.duration)}
              </Typography>
              {session.exercises && (
                <>
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                    •
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                    {Object.keys(session.exercises).length} exercises
                  </Typography>
                </>
              )}
            </Stack>
          </Box>
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            {onEdit && (
              <IconButton
                onClick={onEdit}
                size="small"
                sx={{ color: 'text.secondary' }}
              >
                <Edit sx={{ fontSize: 18 }} />
              </IconButton>
            )}
            {onDelete && (
              <IconButton
                onClick={onDelete}
                size="small"
                sx={{ color: 'text.secondary' }}
              >
                <Delete sx={{ fontSize: 18 }} />
              </IconButton>
            )}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

ActivityCard.propTypes = {
  type: PropTypes.string.isRequired,
  session: PropTypes.object.isRequired,
  onEdit: PropTypes.func,
  onDelete: PropTypes.func,
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
      case 'yoga': return 'Edit Yoga Session';
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
