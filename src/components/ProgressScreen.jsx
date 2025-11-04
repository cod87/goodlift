import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { getWorkoutHistory, getUserStats, deleteWorkout } from '../utils/storage';
import { formatDate, formatDuration } from '../utils/helpers';
import Calendar from './Calendar';
import { Box, Card, CardContent, Typography, Grid, Stack, IconButton } from '@mui/material';
import { FitnessCenter, Timer, TrendingUp, Whatshot, Delete } from '@mui/icons-material';
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
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const [loadedStats, loadedHistory] = await Promise.all([
        getUserStats(),
        getWorkoutHistory()
      ]);
      setStats(loadedStats);
      setHistory(loadedHistory);
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

  if (loading) {
    return (
      <div className="screen progress-screen">
        <p>Loading...</p>
      </div>
    );
  }

  // Extract workout dates for calendar
  const workoutDates = history.map(workout => workout.date);

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
      style={{ maxWidth: '900px', margin: '0 auto' }}
    >
      {/* Logo at the top */}
      <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
        <img
          src={`${import.meta.env.BASE_URL}goodlift-logo.svg`}
          alt="GoodLift"
          style={{ height: '64px', width: 'auto' }}
        />
      </Box>

      <Grid container spacing={2} sx={{ mb: 3, maxWidth: '100%' }}>
        <Grid item xs={6} sm={6}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card sx={{ 
              height: '100%',
              borderRadius: 3,
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: '0 8px 24px rgba(48, 86, 105, 0.15)',
              }
            }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <FitnessCenter sx={{ fontSize: 40, color: 'primary.main', mr: 2 }} />
                  <Typography variant="h6" sx={{ 
                    color: 'text.secondary',
                    textTransform: 'uppercase',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    letterSpacing: 1
                  }}>
                    Total Workouts
                  </Typography>
                </Box>
                <Typography variant="h2" sx={{ 
                  fontWeight: 700,
                  color: 'primary.main'
                }}>
                  {stats.totalWorkouts}
                </Typography>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>
        
        <Grid item xs={6} sm={6}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card sx={{ 
              height: '100%',
              borderRadius: 3,
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: '0 8px 24px rgba(48, 86, 105, 0.15)',
              }
            }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Timer sx={{ fontSize: 40, color: 'secondary.main', mr: 2 }} />
                  <Typography variant="h6" sx={{ 
                    color: 'text.secondary',
                    textTransform: 'uppercase',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    letterSpacing: 1
                  }}>
                    Total Time
                  </Typography>
                </Box>
                <Typography variant="h2" sx={{ 
                  fontWeight: 700,
                  color: 'secondary.main'
                }}>
                  {formatDuration(stats.totalTime)}
                </Typography>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        <Grid item xs={6} sm={6}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card sx={{ 
              height: '100%',
              borderRadius: 3,
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: '0 8px 24px rgba(48, 86, 105, 0.15)',
              }
            }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <TrendingUp sx={{ fontSize: 40, color: 'primary.main', mr: 2 }} />
                  <Typography variant="h6" sx={{ 
                    color: 'text.secondary',
                    textTransform: 'uppercase',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    letterSpacing: 1
                  }}>
                    Avg Duration
                  </Typography>
                </Box>
                <Typography variant="h2" sx={{ 
                  fontWeight: 700,
                  color: 'primary.main'
                }}>
                  {stats.totalWorkouts > 0 
                    ? formatDuration(Math.round(stats.totalTime / stats.totalWorkouts))
                    : '0m'}
                </Typography>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        <Grid item xs={6} sm={6}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
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
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Whatshot sx={{ fontSize: 40, color: 'secondary.main', mr: 2 }} />
                  <Typography variant="h6" sx={{ 
                    color: 'text.secondary',
                    textTransform: 'uppercase',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    letterSpacing: 1
                  }}>
                    HIIT Time
                  </Typography>
                </Box>
                <Typography variant="h2" sx={{ 
                  fontWeight: 700,
                  color: 'secondary.main'
                }}>
                  {formatDuration(stats.totalHiitTime || 0)}
                </Typography>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>
      </Grid>

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
    </motion.div>
  );
};

export default ProgressScreen;
