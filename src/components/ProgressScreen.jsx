import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  getWorkoutHistory, 
  getUserStats, 
  deleteWorkout, 
  getAllExerciseWeights,
  getStretchSessions,
  getYogaSessions,
  getHiitSessions,
  deleteStretchSession,
  deleteYogaSession,
  deleteHiitSession
} from '../utils/storage';
import { formatDate, formatDuration } from '../utils/helpers';
import Calendar from './Calendar';
import { Box, Card, CardContent, Typography, Grid, Stack, IconButton } from '@mui/material';
import { FitnessCenter, Timer, TrendingUp, Whatshot, Delete, TrendingUpRounded, SelfImprovement } from '@mui/icons-material';
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
  const [loading, setLoading] = useState(true);
  const [exerciseWeights, setExerciseWeights] = useState({});

  const loadData = async () => {
    setLoading(true);
    try {
      const [loadedStats, loadedHistory, loadedWeights, loadedStretches, loadedYoga, loadedHiit] = await Promise.all([
        getUserStats(),
        getWorkoutHistory(),
        getAllExerciseWeights(),
        getStretchSessions(),
        getYogaSessions(),
        getHiitSessions()
      ]);
      setStats(loadedStats);
      setHistory(loadedHistory);
      setExerciseWeights(loadedWeights);
      setStretchSessions(loadedStretches);
      setYogaSessions(loadedYoga);
      setHiitSessions(loadedHiit);
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

  if (loading) {
    return (
      <div className="screen progress-screen">
        <p>Loading...</p>
      </div>
    );
  }

  // Extract workout dates for calendar - include all session types
  const workoutDates = [
    ...history.map(workout => workout.date),
    ...hiitSessions.map(session => session.date),
    ...stretchSessions.map(session => session.date),
    ...yogaSessions.map(session => session.date)
  ];

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

          {/* Row 3: HIIT Time & Mobility Time */}
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
                      Mobility Time
                    </Typography>
                  </Stack>
                  <Typography variant="h3" sx={{ 
                    fontWeight: 700,
                    color: '#9c27b0',
                    fontSize: { xs: '2rem', sm: '2.5rem' }
                  }}>
                    {formatDuration((stats.totalStretchTime || 0) + (stats.totalYogaTime || 0))}
                  </Typography>
                </CardContent>
              </Card>
            </motion.div>
          </Stack>
        </Stack>
      </Box>

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
      {Object.keys(exerciseWeights).length > 0 && (
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
              p: 2,
              display: 'flex',
              alignItems: 'center',
              gap: 1,
            }}>
              <TrendingUpRounded sx={{ fontSize: 32, color: 'white' }} />
              <Typography variant="h5" sx={{ 
                fontWeight: 700,
                color: 'white',
              }}>
                Progressive Overload Tracking
              </Typography>
            </Box>
            <CardContent sx={{ p: 2 }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Track your strength gains across exercises. These are your current working weights.
              </Typography>
              <Grid container spacing={1.5}>
                {Object.entries(exerciseWeights)
                  .filter(([, weight]) => weight > 0)
                  .sort((a, b) => b[1] - a[1])
                  .map(([exercise, weight]) => (
                    <Grid item xs={12} sm={6} md={4} key={exercise}>
                      <Box sx={{ 
                        p: 1.5,
                        borderRadius: 2,
                        background: 'rgba(19, 70, 134, 0.05)',
                        border: '1px solid rgba(19, 70, 134, 0.1)',
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          background: 'rgba(19, 70, 134, 0.1)',
                          transform: 'translateY(-2px)',
                        }
                      }}>
                        <Typography variant="body2" sx={{ 
                          fontWeight: 600,
                          color: 'text.primary',
                          mb: 0.5,
                          fontSize: '0.85rem',
                          lineHeight: 1.3,
                        }}>
                          {exercise}
                        </Typography>
                        <Chip 
                          label={`${weight} lbs`}
                          size="small"
                          sx={{ 
                            fontWeight: 700,
                            background: 'rgb(19, 70, 134)',
                            color: 'white',
                          }}
                        />
                      </Box>
                    </Grid>
                  ))}
              </Grid>
            </CardContent>
          </Card>
        </motion.div>
      )}

      <Calendar workoutDates={workoutDates} />
      
      <div className="workout-history-container">
        <Typography variant="h4" component="h2" sx={{ 
          fontWeight: 700,
          mb: 3,
          color: 'text.primary'
        }}>
          Workout History
        </Typography>
        <Stack spacing={2}>
          {history.length === 0 ? (
            <Typography sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
              No workout history yet. Complete your first workout to see it here!
            </Typography>
          ) : (
            history.map((workout, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + idx * 0.05 }}
              >
                <Card sx={{ 
                  borderLeft: '4px solid',
                  borderLeftColor: 'primary.main',
                  borderRadius: 2,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateX(4px)',
                    boxShadow: '0 4px 12px rgba(48, 86, 105, 0.15)',
                    borderLeftColor: 'secondary.main',
                  }
                }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                          {workout.type} - {formatDate(workout.date)}
                          {workout.isPartial && (
                            <Typography component="span" sx={{ 
                              ml: 1, 
                              fontSize: '0.875rem', 
                              color: 'warning.main',
                              fontWeight: 500,
                            }}>
                              (Partial)
                            </Typography>
                          )}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                          Duration: {formatDuration(workout.duration)}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Exercises: {Object.keys(workout.exercises).join(', ')}
                        </Typography>
                      </Box>
                      <IconButton
                        onClick={() => handleDeleteWorkout(idx)}
                        size="small"
                        sx={{
                          color: 'error.main',
                          '&:hover': {
                            backgroundColor: 'error.light',
                            color: 'error.contrastText',
                          }
                        }}
                        aria-label="Delete workout"
                      >
                        <Delete />
                      </IconButton>
                    </Box>
                  </CardContent>
                </Card>
              </motion.div>
            ))
          )}
        </Stack>
      </div>

      {/* HIIT History */}
      {hiitSessions.length > 0 && (
        <div className="workout-history-container" style={{ marginTop: '2rem' }}>
          <Typography variant="h4" component="h2" sx={{ 
            fontWeight: 700,
            mb: 3,
            color: 'text.primary'
          }}>
            HIIT History
          </Typography>
          <Stack spacing={2}>
            {hiitSessions.map((session) => (
              <motion.div
                key={session.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.05 }}
              >
                <Card sx={{ 
                  borderLeft: '4px solid',
                  borderLeftColor: 'secondary.main',
                  borderRadius: 2,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateX(4px)',
                    boxShadow: '0 4px 12px rgba(237, 63, 39, 0.15)',
                  }
                }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Box sx={{ flex: 1 }}>
                        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                          <Whatshot sx={{ color: 'secondary.main', fontSize: 20 }} />
                          <Typography variant="h6" sx={{ fontWeight: 600 }}>
                            HIIT Session - {formatDate(session.date)}
                          </Typography>
                        </Stack>
                        <Typography variant="body2" color="text.secondary">
                          Duration: {formatDuration(session.duration)}
                        </Typography>
                      </Box>
                      <IconButton
                        onClick={() => handleDeleteHiit(session.id)}
                        size="small"
                        sx={{
                          color: 'error.main',
                          '&:hover': {
                            backgroundColor: 'error.light',
                            color: 'error.contrastText',
                          }
                        }}
                        aria-label="Delete HIIT session"
                      >
                        <Delete />
                      </IconButton>
                    </Box>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </Stack>
        </div>
      )}

      {/* Mobility History (Combined Stretch & Yoga Sessions) */}
      {(stretchSessions.length > 0 || yogaSessions.length > 0) && (
        <div className="workout-history-container" style={{ marginTop: '2rem' }}>
          <Typography variant="h4" component="h2" sx={{ 
            fontWeight: 700,
            mb: 3,
            color: 'text.primary'
          }}>
            Mobility History
          </Typography>
          <Stack spacing={2}>
            {/* Combine and sort stretch and yoga sessions by date */}
            {[...stretchSessions.map(s => ({...s, type: 'stretch'})), ...yogaSessions.map(s => ({...s, type: 'yoga'}))]
              .sort((a, b) => new Date(b.date) - new Date(a.date))
              .map((session) => (
                <motion.div
                  key={session.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.05 }}
                >
                  <Card sx={{ 
                    borderLeft: '4px solid',
                    borderLeftColor: '#9c27b0',
                    borderRadius: 2,
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateX(4px)',
                      boxShadow: '0 4px 12px rgba(156, 39, 176, 0.15)',
                    }
                  }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <Box sx={{ flex: 1 }}>
                          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                            <SelfImprovement sx={{ color: '#9c27b0', fontSize: 20 }} />
                            <Typography variant="h6" sx={{ fontWeight: 600 }}>
                              {session.type === 'stretch' 
                                ? `${session.type === 'full' ? 'Full Body' : 'Custom'} Stretch`
                                : session.flowName || 'Yoga Flow'
                              } - {formatDate(session.date)}
                            </Typography>
                          </Stack>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                            Duration: {formatDuration(session.duration)}
                          </Typography>
                          {session.type === 'stretch' && session.stretchesCompleted && (
                            <Typography variant="body2" color="text.secondary">
                              Stretches: {session.stretchesCompleted} completed
                            </Typography>
                          )}
                        </Box>
                        <IconButton
                          onClick={() => session.type === 'stretch' ? handleDeleteStretch(session.id) : handleDeleteYoga(session.id)}
                          size="small"
                          sx={{
                            color: 'error.main',
                            '&:hover': {
                              backgroundColor: 'error.light',
                              color: 'error.contrastText',
                            }
                          }}
                          aria-label="Delete session"
                        >
                          <Delete />
                        </IconButton>
                      </Box>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
          </Stack>
        </div>
      )}
    </motion.div>
  );
};

export default ProgressScreen;
