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
  Fab,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Divider
} from '@mui/material';
import { 
  FitnessCenter, 
  Timer, 
  TrendingUp, 
  DirectionsRun,
  SelfImprovement,
  Add as AddIcon,
  PlayArrow as PlayArrowIcon,
  Edit as EditIcon,
  CalendarMonth as CalendarIcon,
  Scale as ScaleIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { 
  getWorkoutHistory, 
  getCardioSessions,
  getHiitSessions,
  getYogaSessions,
  getActivePlan,
  getUserStats,
  saveUserStats
} from '../utils/storage';
import { formatDate } from '../utils/helpers';
import { usePlanIntegration } from '../hooks/usePlanIntegration';
import CompactHeader from './Common/CompactHeader';
import QuickStartCard from './Home/QuickStartCard';

/**
 * DashboardScreen - Main landing page combining workout planning and tracking
 * Serves as the central hub for the app with quick actions and stats overview
 */
const DashboardScreen = ({ onNavigate, onStartWorkout }) => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalWorkouts: 0,
    avgWorkout: 0,
    totalCardio: 0,
    totalYoga: 0,
    weekStreak: 0
  });
  const [lastWorkout, setLastWorkout] = useState(null);
  const [weightDialogOpen, setWeightDialogOpen] = useState(false);
  const [newWeight, setNewWeight] = useState('');
  const [userWeights, setUserWeights] = useState([]);

  const { 
    getTodaysWorkout, 
    getUpcomingWorkouts,
  } = usePlanIntegration();

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [history, cardioSessions, hiitSessions, yogaSessions, _plan, userStatsData] = await Promise.all([
          getWorkoutHistory(),
          getCardioSessions(),
          getHiitSessions(),
          getYogaSessions(),
          getActivePlan(),
          getUserStats()
        ]);

        // Calculate stats
        const totalWorkouts = history.length;
        const totalWorkoutTime = history.reduce((sum, w) => sum + (w.duration || 0), 0);
        const avgWorkout = totalWorkouts > 0 ? Math.round(totalWorkoutTime / totalWorkouts / 60) : 0;
        
        const allCardio = [...cardioSessions, ...hiitSessions];
        const totalCardio = allCardio.length;
        
        const totalYoga = yogaSessions.length;

        // Get last workout
        const lastWorkoutData = history.length > 0 ? history[0] : null;

        setStats({
          totalWorkouts,
          avgWorkout,
          totalCardio,
          totalYoga,
          weekStreak: calculateWeekStreak(history)
        });

        setLastWorkout(lastWorkoutData);
        
        // Load weight data
        const weights = userStatsData?.weights || [];
        setUserWeights(weights);

      } catch (error) {
        console.error('Error loading dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const calculateWeekStreak = (workouts) => {
    if (workouts.length === 0) return 0;
    
    let streak = 0;
    const today = new Date();
    const oneWeek = 7 * 24 * 60 * 60 * 1000;
    
    for (let i = 0; i < workouts.length; i++) {
      const workoutDate = new Date(workouts[i].date);
      const daysDiff = Math.floor((today - workoutDate) / oneWeek);
      
      if (daysDiff === streak) {
        streak++;
      } else {
        break;
      }
    }
    
    return streak;
  };

  const handleLogWeight = async () => {
    if (!newWeight || isNaN(newWeight)) {
      alert('Please enter a valid weight');
      return;
    }

    const weightEntry = {
      weight: parseFloat(newWeight),
      date: new Date().toISOString(),
      timestamp: Date.now()
    };

    const updatedWeights = [weightEntry, ...userWeights];
    
    try {
      const currentStats = await getUserStats() || {};
      await saveUserStats({
        ...currentStats,
        weights: updatedWeights
      });
      
      setUserWeights(updatedWeights);
      setNewWeight('');
      setWeightDialogOpen(false);
    } catch (error) {
      console.error('Error saving weight:', error);
      alert('Failed to save weight. Please try again.');
    }
  };

  const getCurrentWeight = () => {
    if (userWeights.length === 0) return null;
    return userWeights[0].weight;
  };

  const todaysWorkout = getTodaysWorkout();
  const upcomingWorkouts = getUpcomingWorkouts(2);

  if (loading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '400px' 
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
    <Box sx={{ width: '100%', minHeight: '100vh', pb: 4 }}>
      <CompactHeader title="Dashboard" icon="🏠" />
      
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        style={{ maxWidth: '1200px', margin: '0 auto', padding: '1rem' }}
      >
        {/* Quick Start Section */}
        <Box sx={{ mb: 3 }}>
          <QuickStartCard
            todaysWorkout={todaysWorkout}
            nextWorkouts={upcomingWorkouts}
            lastWorkout={lastWorkout}
            onQuickStart={(type, exercises, planContext) => {
              if (onStartWorkout) {
                onStartWorkout(type, new Set(['all']), exercises, planContext);
              }
            }}
            onViewPlan={() => onNavigate('plans')}
            loading={false}
          />
        </Box>

        {/* Stats Overview */}
        <Box sx={{ mb: 3 }}>
          <Typography 
            variant="h6" 
            sx={{ 
              mb: 2, 
              fontWeight: 700,
              color: 'primary.main',
              display: 'flex',
              alignItems: 'center',
              gap: 1
            }}
          >
            <TrendingUp /> Your Stats
          </Typography>
          
          <Grid container spacing={2}>
            {/* Total Workouts */}
            <Grid item xs={6} sm={3}>
              <Card sx={{ 
                borderRadius: 3,
                boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 8px 24px rgba(237, 63, 39, 0.15)',
                }
              }}>
                <CardContent sx={{ p: 2, textAlign: 'center' }}>
                  <FitnessCenter sx={{ fontSize: 32, color: 'secondary.main', mb: 1 }} />
                  <Typography variant="h4" sx={{ fontWeight: 700, color: 'secondary.main' }}>
                    {stats.totalWorkouts}
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary', textTransform: 'uppercase' }}>
                    Workouts
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            {/* Avg Workout */}
            <Grid item xs={6} sm={3}>
              <Card sx={{ 
                borderRadius: 3,
                boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 8px 24px rgba(19, 70, 134, 0.15)',
                }
              }}>
                <CardContent sx={{ p: 2, textAlign: 'center' }}>
                  <Timer sx={{ fontSize: 32, color: 'primary.main', mb: 1 }} />
                  <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main' }}>
                    {stats.avgWorkout}m
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary', textTransform: 'uppercase' }}>
                    Avg Time
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            {/* Cardio Sessions */}
            <Grid item xs={6} sm={3}>
              <Card sx={{ 
                borderRadius: 3,
                boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 8px 24px rgba(33, 150, 243, 0.15)',
                }
              }}>
                <CardContent sx={{ p: 2, textAlign: 'center' }}>
                  <DirectionsRun sx={{ fontSize: 32, color: '#2196f3', mb: 1 }} />
                  <Typography variant="h4" sx={{ fontWeight: 700, color: '#2196f3' }}>
                    {stats.totalCardio}
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary', textTransform: 'uppercase' }}>
                    Cardio
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            {/* Yoga Sessions */}
            <Grid item xs={6} sm={3}>
              <Card sx={{ 
                borderRadius: 3,
                boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 8px 24px rgba(156, 39, 176, 0.15)',
                }
              }}>
                <CardContent sx={{ p: 2, textAlign: 'center' }}>
                  <SelfImprovement sx={{ fontSize: 32, color: '#9c27b0', mb: 1 }} />
                  <Typography variant="h4" sx={{ fontWeight: 700, color: '#9c27b0' }}>
                    {stats.totalYoga}
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary', textTransform: 'uppercase' }}>
                    Yoga
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>

        {/* Quick Actions */}
        <Box sx={{ mb: 3 }}>
          <Typography 
            variant="h6" 
            sx={{ 
              mb: 2, 
              fontWeight: 700,
              color: 'primary.main',
              display: 'flex',
              alignItems: 'center',
              gap: 1
            }}
          >
            <PlayArrowIcon /> Quick Actions
          </Typography>
          
          <Grid container spacing={2}>
            {/* Start Random Workout */}
            <Grid item xs={12} sm={6} md={3}>
              <Card 
                sx={{ 
                  borderRadius: 3,
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 8px 24px rgba(237, 63, 39, 0.2)',
                  }
                }}
                onClick={() => onNavigate('selection')}
              >
                <CardContent sx={{ p: 2, textAlign: 'center' }}>
                  <FitnessCenter sx={{ fontSize: 40, color: 'secondary.main', mb: 1 }} />
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    Random Workout
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            {/* Cardio */}
            <Grid item xs={12} sm={6} md={3}>
              <Card 
                sx={{ 
                  borderRadius: 3,
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 8px 24px rgba(33, 150, 243, 0.2)',
                  }
                }}
                onClick={() => onNavigate('cardio')}
              >
                <CardContent sx={{ p: 2, textAlign: 'center' }}>
                  <DirectionsRun sx={{ fontSize: 40, color: '#2196f3', mb: 1 }} />
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    Cardio
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            {/* Yoga */}
            <Grid item xs={12} sm={6} md={3}>
              <Card 
                sx={{ 
                  borderRadius: 3,
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 8px 24px rgba(156, 39, 176, 0.2)',
                  }
                }}
                onClick={() => onNavigate('mobility')}
              >
                <CardContent sx={{ p: 2, textAlign: 'center' }}>
                  <SelfImprovement sx={{ fontSize: 40, color: '#9c27b0', mb: 1 }} />
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    Yoga & Mobility
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            {/* View Plans */}
            <Grid item xs={12} sm={6} md={3}>
              <Card 
                sx={{ 
                  borderRadius: 3,
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 8px 24px rgba(19, 70, 134, 0.2)',
                  }
                }}
                onClick={() => onNavigate('plans')}
              >
                <CardContent sx={{ p: 2, textAlign: 'center' }}>
                  <CalendarIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    Workout Plans
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>

        {/* Weight Tracking Widget */}
        <Box sx={{ mb: 3 }}>
          <Card sx={{ borderRadius: 3, boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
            <CardContent sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography 
                  variant="h6" 
                  sx={{ 
                    fontWeight: 700,
                    color: 'primary.main',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1
                  }}
                >
                  <ScaleIcon /> Body Weight
                </Typography>
                <IconButton 
                  size="small" 
                  color="primary" 
                  onClick={() => setWeightDialogOpen(true)}
                  aria-label="Log weight"
                >
                  <AddIcon />
                </IconButton>
              </Box>
              
              {getCurrentWeight() ? (
                <Box>
                  <Typography variant="h3" sx={{ fontWeight: 700, color: 'primary.main', mb: 1 }}>
                    {getCurrentWeight()} lbs
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    Last updated: {formatDate(userWeights[0].date)}
                  </Typography>
                  {userWeights.length > 1 && (
                    <Box sx={{ mt: 1 }}>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        Change from previous: {' '}
                        <Chip 
                          label={`${(userWeights[0].weight - userWeights[1].weight).toFixed(1)} lbs`}
                          size="small"
                          color={userWeights[0].weight >= userWeights[1].weight ? 'success' : 'error'}
                          sx={{ height: 20, fontSize: '0.7rem' }}
                        />
                      </Typography>
                    </Box>
                  )}
                  <Button 
                    size="small" 
                    onClick={() => onNavigate('progress')}
                    sx={{ mt: 2 }}
                  >
                    View History
                  </Button>
                </Box>
              ) : (
                <Box sx={{ textAlign: 'center', py: 2 }}>
                  <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
                    Track your body weight over time
                  </Typography>
                  <Button 
                    variant="contained" 
                    startIcon={<AddIcon />}
                    onClick={() => setWeightDialogOpen(true)}
                  >
                    Log First Weight
                  </Button>
                </Box>
              )}
            </CardContent>
          </Card>
        </Box>

        {/* View Full Progress */}
        <Box sx={{ textAlign: 'center', mt: 4 }}>
          <Button 
            variant="outlined" 
            size="large"
            onClick={() => onNavigate('progress')}
            sx={{ 
              borderRadius: 3,
              px: 4,
              py: 1.5,
              fontWeight: 600
            }}
          >
            View Full Progress & History
          </Button>
        </Box>
      </motion.div>

      {/* Weight Logging Dialog */}
      <Dialog 
        open={weightDialogOpen} 
        onClose={() => setWeightDialogOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          Log Body Weight
          <IconButton 
            size="small" 
            onClick={() => setWeightDialogOpen(false)}
            aria-label="Close"
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Weight (lbs)"
            type="number"
            fullWidth
            variant="outlined"
            value={newWeight}
            onChange={(e) => setNewWeight(e.target.value)}
            inputProps={{ step: 0.1, min: 0 }}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setWeightDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleLogWeight} 
            variant="contained"
            disabled={!newWeight || isNaN(newWeight)}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

DashboardScreen.propTypes = {
  onNavigate: PropTypes.func.isRequired,
  onStartWorkout: PropTypes.func
};

export default DashboardScreen;
