import { useState, useEffect, memo } from 'react';
import PropTypes from 'prop-types';
import { motion } from 'framer-motion';
import { 
  Box, 
  Container, 
  Grid, 
  Button,
  Card,
  CardContent,
  Typography,
  Stack,
} from '@mui/material';
import { 
  PlayArrow,
  CalendarToday,
  FitnessCenter,
  EditCalendar,
} from '@mui/icons-material';
import QuickStartCard from '../components/Home/QuickStartCard';
import WeeklyPlanPreview from '../components/Home/WeeklyPlanPreview';
import StatsRow from '../components/Progress/StatsRow';
import CompactHeader from '../components/Common/CompactHeader';
import { usePlanIntegration } from '../hooks/usePlanIntegration';
import { 
  getWorkoutHistory
} from '../utils/storage';

/**
 * Dashboard - Main landing page for the app
 * Displays workout tracking, upcoming plans, progress charts, and quick actions
 */
const Dashboard = memo(({ onNavigate, onStartWorkout }) => {
  const [lastWorkout, setLastWorkout] = useState(null);
  const [stats, setStats] = useState({
    workoutsThisWeek: 0,
    totalVolume: 0,
    currentStreak: 0,
    avgDuration: 0,
  });
  const [loading, setLoading] = useState(true);
  
  // Use plan integration hook for weekly plan data
  const { 
    currentPlan,
    getTodaysWorkout, 
    getUpcomingWorkouts,
    createWorkoutNavState
  } = usePlanIntegration();

  // Load dashboard data
  useEffect(() => {
    const loadDashboardData = async () => {
      setLoading(true);
      try {
        // Load workout history
        const history = await getWorkoutHistory();
        if (history && history.length > 0) {
          const last = history[0];
          setLastWorkout({
            date: last.date,
            duration: last.duration,
            exercises: last.exercises ? Object.keys(last.exercises) : [],
          });
        }

        // Calculate workouts this week
        const now = new Date();
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - now.getDay());
        weekStart.setHours(0, 0, 0, 0);
        
        const workoutsThisWeek = history.filter(w => {
          const workoutDate = new Date(w.date);
          return workoutDate >= weekStart;
        }).length;

        // Calculate total volume (last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        let totalVolume = 0;
        history
          .filter(w => new Date(w.date) >= thirtyDaysAgo)
          .forEach(workout => {
            if (workout.exercises) {
              Object.values(workout.exercises).forEach(ex => {
                if (ex.sets) {
                  ex.sets.forEach(set => {
                    totalVolume += (set.weight || 0) * (set.reps || 0);
                  });
                }
              });
            }
          });

        // Calculate current streak
        let currentStreak = 0;
        const sortedHistory = [...history].sort((a, b) => new Date(b.date) - new Date(a.date));
        
        if (sortedHistory.length > 0) {
          let checkDate = new Date();
          checkDate.setHours(0, 0, 0, 0);
          
          for (const workout of sortedHistory) {
            const workoutDate = new Date(workout.date);
            workoutDate.setHours(0, 0, 0, 0);
            
            const diffDays = Math.floor((checkDate - workoutDate) / (1000 * 60 * 60 * 24));
            
            if (diffDays <= 1) {
              currentStreak++;
              checkDate = workoutDate;
            } else {
              break;
            }
          }
        }

        // Calculate average duration
        const avgDuration = history.length > 0
          ? Math.round(history.reduce((sum, w) => sum + (w.duration || 0), 0) / history.length)
          : 0;

        setStats({
          workoutsThisWeek,
          totalVolume: Math.round(totalVolume),
          currentStreak,
          avgDuration,
        });
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  // Get today's workout and upcoming workouts from the plan
  const todaysWorkout = getTodaysWorkout();
  const nextWorkouts = getUpcomingWorkouts(2);
  
  // Convert plan to weekly plan format for WeeklyPlanPreview
  const weeklyPlan = (() => {
    if (!currentPlan) return [];
    
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const today = new Date();
    const result = [];
    
    // If plan has sessions (from workout plan generator), show next 7 days from today
    if (currentPlan.sessions && Array.isArray(currentPlan.sessions)) {
      for (let i = 0; i < 7; i++) {
        const targetDate = new Date(today);
        targetDate.setDate(today.getDate() + i);
        targetDate.setHours(0, 0, 0, 0);
        
        // Find session for this date
        const session = currentPlan.sessions.find(s => {
          const sessionDate = new Date(s.date);
          sessionDate.setHours(0, 0, 0, 0);
          return sessionDate.getTime() === targetDate.getTime();
        });
        
        if (session) {
          result.push({
            day: days[targetDate.getDay()],
            type: session.type,
            focus: session.focus,
            estimatedDuration: session.estimatedDuration,
            label: session.type.charAt(0).toUpperCase() + session.type.slice(1),
          });
        } else {
          result.push({
            day: days[targetDate.getDay()],
            type: 'rest',
            label: 'Rest',
          });
        }
      }
    } else if (currentPlan.days && Array.isArray(currentPlan.days)) {
      // Handle weekly plan format
      return currentPlan.days;
    }
    
    return result;
  })();

  // Handle quick start
  const handleQuickStart = () => {
    if (!todaysWorkout || todaysWorkout.type === 'rest') {
      // Navigate to selection screen if no plan or rest day
      onNavigate('selection');
      return;
    }
    
    // Start workout with plan context
    const planNavState = createWorkoutNavState(new Date().getDay());
    onStartWorkout(
      todaysWorkout.type,
      'all',
      todaysWorkout.generatedWorkout || null,
      planNavState
    );
  };

  // Handle quick start for a specific day
  const handleQuickStartDay = (dayPlan) => {
    if (!dayPlan || dayPlan.type === 'rest') return;
    
    // Find the day index
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dayIndex = days.indexOf(dayPlan.day);
    
    const planNavState = createWorkoutNavState(dayIndex);
    onStartWorkout(
      dayPlan.type,
      'all',
      dayPlan.generatedWorkout || null,
      planNavState
    );
  };

  // Handle view plan
  const handleViewPlan = () => {
    onNavigate('plans');
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', pb: 4 }}>
      <CompactHeader title="Dashboard" />
      
      <Container maxWidth="lg" sx={{ mt: 3 }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Grid container spacing={3}>
            {/* Stats Row */}
            <Grid item xs={12}>
              <StatsRow stats={stats} />
            </Grid>

            {/* Quick Start Card */}
            <Grid item xs={12} md={6}>
              <QuickStartCard
                todaysWorkout={todaysWorkout}
                nextWorkouts={nextWorkouts}
                lastWorkout={lastWorkout}
                onQuickStart={handleQuickStart}
                onViewPlan={handleViewPlan}
                loading={loading}
              />
            </Grid>

            {/* Weekly Plan Preview */}
            <Grid item xs={12} md={6}>
              <WeeklyPlanPreview
                weeklyPlan={weeklyPlan}
                onQuickStartDay={handleQuickStartDay}
                onEditPlan={handleViewPlan}
                currentDay={new Date().getDay()}
              />
            </Grid>

            {/* Quick Actions */}
            <Grid item xs={12}>
              <Card 
                sx={{ 
                  borderRadius: 3,
                  boxShadow: '0 4px 16px rgba(19, 70, 134, 0.08)',
                }}
              >
                <CardContent>
                  <Typography 
                    variant="overline" 
                    sx={{ 
                      color: 'primary.main',
                      fontWeight: 600,
                      letterSpacing: 1,
                      mb: 2,
                      display: 'block',
                    }}
                  >
                    QUICK ACTIONS
                  </Typography>
                  
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                    <Button
                      variant="contained"
                      startIcon={<PlayArrow />}
                      onClick={() => onNavigate('selection')}
                      fullWidth
                      sx={{ py: 1.5 }}
                    >
                      Start Custom Workout
                    </Button>
                    
                    <Button
                      variant="outlined"
                      startIcon={<CalendarToday />}
                      onClick={() => onNavigate('plans')}
                      fullWidth
                      sx={{ py: 1.5 }}
                    >
                      Manage Plans
                    </Button>
                    
                    <Button
                      variant="outlined"
                      startIcon={<FitnessCenter />}
                      onClick={() => onNavigate('exercise-list')}
                      fullWidth
                      sx={{ py: 1.5 }}
                    >
                      Exercise Library
                    </Button>

                    <Button
                      variant="outlined"
                      startIcon={<EditCalendar />}
                      onClick={() => onNavigate('log-activity')}
                      fullWidth
                      sx={{ py: 1.5 }}
                    >
                      Log Activity
                    </Button>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </motion.div>
      </Container>
    </Box>
  );
});

Dashboard.displayName = 'Dashboard';

Dashboard.propTypes = {
  onNavigate: PropTypes.func.isRequired,
  onStartWorkout: PropTypes.func.isRequired,
};

export default Dashboard;
