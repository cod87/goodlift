import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  getWorkoutHistory, 
  getUserStats, 
  deleteWorkout, 
  getStretchSessions,
  getYogaSessions,
  getHiitSessions,
  getCardioSessions,
  deleteStretchSession,
  deleteYogaSession,
  deleteHiitSession,
  deleteCardioSession,
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
  ListItemText
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
  Close
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
  const [stats, setStats] = useState({ totalWorkouts: 0, totalTime: 0 });
  const [history, setHistory] = useState([]);
  const [stretchSessions, setStretchSessions] = useState([]);
  const [yogaSessions, setYogaSessions] = useState([]);
  const [hiitSessions, setHiitSessions] = useState([]);
  const [cardioSessions, setCardioSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(null);
  const [pinnedExercises, setPinnedExercisesState] = useState([]);
  const [addExerciseDialogOpen, setAddExerciseDialogOpen] = useState(false);
  const [availableExercises, setAvailableExercises] = useState([]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [loadedStats, loadedHistory, loadedStretches, loadedYoga, loadedHiit, loadedCardio] = await Promise.all([
        getUserStats(),
        getWorkoutHistory(),
        getStretchSessions(),
        getYogaSessions(),
        getHiitSessions(),
        getCardioSessions()
      ]);
      setStats(loadedStats);
      setHistory(loadedHistory);
      setStretchSessions(loadedStretches);
      setYogaSessions(loadedYoga);
      setHiitSessions(loadedHiit);
      setCardioSessions(loadedCardio);
      
      // Load pinned exercises
      const pinned = getPinnedExercises();
      setPinnedExercisesState(pinned);
      
      // Get unique exercises from history for selection
      const unique = getUniqueExercises(loadedHistory);
      setAvailableExercises(unique);
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

  if (loading) {
    return (
      <div className="screen progress-screen">
        <p>Loading...</p>
      </div>
    );
  }

  // Extract workout dates for calendar - include all session types with their types
  const workoutSessions = [
    ...history.map(workout => ({ date: workout.date, type: 'workout' })),
    ...hiitSessions.map(session => ({ date: session.date, type: 'hiit' })),
    ...cardioSessions.map(session => ({ date: session.date, type: 'cardio' })),
    ...stretchSessions.map(session => ({ date: session.date, type: 'stretch' })),
    ...yogaSessions.map(session => ({ date: session.date, type: 'yoga' }))
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

  // Prepare chart data
  const chartData = {
    labels: history.slice(-7).reverse().map(w => formatDate(w.date)),
    datasets: [
      {
        label: 'Workout Duration (minutes)',
        data: history.slice(-7).reverse().map(w => Math.round(w.duration / 60)),
        fill: true,
        backgroundColor: 'rgba(19, 70, 134, 0.2)',
        borderColor: 'rgb(19, 70, 134)',
        tension: 0.4,
        pointBackgroundColor: 'rgb(19, 70, 134)',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 5,
        pointHoverRadius: 7,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: true,
        text: 'Last 7 Workouts',
        font: {
          size: 16,
          weight: 600,
          family: "'Montserrat', sans-serif",
        },
        color: 'rgb(19, 70, 134)',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value) {
            return value + 'm';
          },
        },
      },
    },
  };

  return (
    <motion.div
      className="screen progress-screen"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      style={{ maxWidth: '900px', margin: '0 auto', padding: '1rem' }}
    >
      {/* Stats Overview - Redesigned for mobile */}
      <Box sx={{ mb: 3 }}>
        <Stack spacing={2}>
          {/* Row 1: Total Workouts & Total Time */}
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
                  boxShadow: '0 8px 24px rgba(19, 70, 134, 0.15)',
                }
              }}>
                <CardContent sx={{ p: 2 }}>
                  <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1 }}>
                    <FitnessCenter sx={{ fontSize: 32, color: 'primary.main' }} />
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
                    color: 'primary.main',
                    fontSize: { xs: '2rem', sm: '2.5rem' }
                  }}>
                    {stats.totalWorkouts}
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
                      Total Time
                    </Typography>
                  </Stack>
                  <Typography variant="h3" sx={{ 
                    fontWeight: 700,
                    color: 'secondary.main',
                    fontSize: { xs: '2rem', sm: '2.5rem' }
                  }}>
                    {formatDuration(stats.totalTime)}
                  </Typography>
                </CardContent>
              </Card>
            </motion.div>
          </Stack>

          {/* Row 2: Avg Duration & HIIT Time */}
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
                  boxShadow: '0 8px 24px rgba(19, 70, 134, 0.15)',
                }
              }}>
                <CardContent sx={{ p: 2 }}>
                  <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1 }}>
                    <TrendingUp sx={{ fontSize: 32, color: 'primary.main' }} />
                    <Typography variant="body2" sx={{ 
                      color: 'text.secondary',
                      textTransform: 'uppercase',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      letterSpacing: 0.5,
                    }}>
                      Avg Duration
                    </Typography>
                  </Stack>
                  <Typography variant="h3" sx={{ 
                    fontWeight: 700,
                    color: 'primary.main',
                    fontSize: { xs: '2rem', sm: '2.5rem' }
                  }}>
                    {stats.totalWorkouts > 0 
                      ? formatDuration(Math.round(stats.totalTime / stats.totalWorkouts))
                      : '0m'}
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
                  boxShadow: '0 8px 24px rgba(237, 63, 39, 0.15)',
                }
              }}>
                <CardContent sx={{ p: 2 }}>
                  <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1 }}>
                    <Whatshot sx={{ fontSize: 32, color: 'secondary.main' }} />
                    <Typography variant="body2" sx={{ 
                      color: 'text.secondary',
                      textTransform: 'uppercase',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      letterSpacing: 0.5,
                    }}>
                      HIIT Time
                    </Typography>
                  </Stack>
                  <Typography variant="h3" sx={{ 
                    fontWeight: 700,
                    color: 'secondary.main',
                    fontSize: { xs: '2rem', sm: '2.5rem' }
                  }}>
                    {formatDuration(stats.totalHiitTime || 0)}
                  </Typography>
                </CardContent>
              </Card>
            </motion.div>
          </Stack>

          {/* Row 3: Stretch Time & Yoga Time */}
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
                  boxShadow: '0 8px 24px rgba(76, 175, 80, 0.15)',
                }
              }}>
                <CardContent sx={{ p: 2 }}>
                  <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1 }}>
                    <DirectionsRun sx={{ fontSize: 32, color: 'success.main' }} />
                    <Typography variant="body2" sx={{ 
                      color: 'text.secondary',
                      textTransform: 'uppercase',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      letterSpacing: 0.5,
                    }}>
                      Stretch Time
                    </Typography>
                  </Stack>
                  <Typography variant="h3" sx={{ 
                    fontWeight: 700,
                    color: 'success.main',
                    fontSize: { xs: '2rem', sm: '2.5rem' }
                  }}>
                    {formatDuration(stats.totalStretchTime || 0)}
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
                    <SelfImprovement sx={{ fontSize: 32, color: '#9c27b0' }} />
                    <Typography variant="body2" sx={{ 
                      color: 'text.secondary',
                      textTransform: 'uppercase',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      letterSpacing: 0.5,
                    }}>
                      Yoga Time
                    </Typography>
                  </Stack>
                  <Typography variant="h3" sx={{ 
                    fontWeight: 700,
                    color: '#9c27b0',
                    fontSize: { xs: '2rem', sm: '2.5rem' }
                  }}>
                    {formatDuration(stats.totalYogaTime || 0)}
                  </Typography>
                </CardContent>
              </Card>
            </motion.div>
          </Stack>

          {/* Row 4: Cardio Time */}
          <Stack direction="row" spacing={2}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
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
                    <FitnessCenter sx={{ fontSize: 32, color: '#2196f3' }} />
                    <Typography variant="body2" sx={{ 
                      color: 'text.secondary',
                      textTransform: 'uppercase',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      letterSpacing: 0.5,
                    }}>
                      Cardio Time
                    </Typography>
                  </Stack>
                  <Typography variant="h3" sx={{ 
                    fontWeight: 700,
                    color: '#2196f3',
                    fontSize: { xs: '2rem', sm: '2.5rem' }
                  }}>
                    {formatDuration(stats.totalCardioTime || 0)}
                  </Typography>
                </CardContent>
              </Card>
            </motion.div>
            {/* Empty placeholder for consistent grid */}
            <Box sx={{ flex: 1 }} />
          </Stack>
        </Stack>
      </Box>

      {/* Calendar - positioned after stats, before history */}
      <Calendar workoutSessions={workoutSessions} onDayClick={handleDayClick} />

      {history.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card sx={{ 
            mb: 3,
            borderRadius: 3,
            p: 2,
          }}>
            <Box sx={{ height: 250 }}>
              <Line data={chartData} options={chartOptions} />
            </Box>
          </Card>
        </motion.div>
      )}

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
                          <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 1 }}>
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
                            sx={{ mb: 1 }}
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
        onClose={() => setAddExerciseDialogOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Add Exercise to Track</DialogTitle>
        <DialogContent>
          {availableExercises.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              No exercises available. Complete some workouts first.
            </Typography>
          ) : (
            <List>
              {availableExercises
                .filter(ex => !pinnedExercises.some(p => p.exerciseName === ex))
                .map((exerciseName) => (
                  <ListItem key={exerciseName} disablePadding>
                    <ListItemButton onClick={() => handleAddPinnedExercise(exerciseName)}>
                      <ListItemText primary={exerciseName} />
                    </ListItemButton>
                  </ListItem>
                ))}
            </List>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddExerciseDialogOpen(false)}>Cancel</Button>
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
                              {workout.type}
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
                          </Stack>
                          <Stack direction="row" spacing={1} alignItems="center">
                            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                              {formatDuration(workout.duration)}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                              • {Object.keys(workout.exercises).length} exercises
                            </Typography>
                          </Stack>
                        </Box>
                        <IconButton
                          onClick={() => handleDeleteWorkout(idx)}
                          size="small"
                          sx={{
                            ml: 1,
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
                          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                            {formatDuration(session.duration)}
                          </Typography>
                        </Box>
                        <IconButton
                          onClick={() => handleDeleteHiit(session.id)}
                          size="small"
                          sx={{
                            ml: 1,
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
                          <Stack direction="row" spacing={1} alignItems="center">
                            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                              {formatDuration(session.duration)}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                              • Flow: {session.flowLength}m
                            </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                              • {session.poseCount} poses
                            </Typography>
                          </Stack>
                        </Box>
                        <IconButton
                          onClick={() => handleDeleteYoga(session.id)}
                          size="small"
                          sx={{
                            ml: 1,
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
                          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                            {formatDuration(session.duration)}
                          </Typography>
                        </Box>
                        <IconButton
                          onClick={() => handleDeleteCardio(session.id)}
                          size="small"
                          sx={{
                            ml: 1,
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
    </motion.div>
  );
};

export default ProgressScreen;
