import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  IconButton,
  Stack,
  LinearProgress,
  Grid,
} from '@mui/material';
import {
  PlayArrow as StartIcon,
  Add as AddIcon,
  Edit as EditIcon,
  CalendarMonth as CalendarIcon,
  FitnessCenter as WorkoutIcon,
  TrendingUp as ProgressIcon,
  Delete as DeleteIcon,
  SelfImprovement as YogaIcon,
  DirectionsRun as CardioIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import CompactHeader from './Common/CompactHeader';
import PlanCreationModal from './PlanCreationModal';
import { usePlanIntegration } from '../hooks/usePlanIntegration';
import {
  getPlanStatistics,
} from '../utils/workoutPlanGenerator';
import {
  getWorkoutPlans,
  deleteWorkoutPlan,
  getActivePlan,
  setActivePlan,
  getWorkoutHistory,
} from '../utils/storage';

/**
 * UnifiedWorkoutHub - Single streamlined section for workouts, plans, mobility and yoga
 * Combines workout generation, plan management, mobility/yoga sessions, and progress overview
 */
const UnifiedWorkoutHub = ({ 
  workoutType,
  selectedEquipment,
  onWorkoutTypeChange,
  onStartWorkout,
  onCustomize,
  onNavigate,
  loading,
}) => {
  const [plans, setPlans] = useState([]);
  const [activePlan, setActivePlanState] = useState(null);
  const [showPlanCreationModal, setShowPlanCreationModal] = useState(false);
  const [recentWorkouts, setRecentWorkouts] = useState([]);

  const {
    getTodaysWorkout,
    createWorkoutNavState,
  } = usePlanIntegration();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    loadPlans();
    loadRecentWorkouts();
  }, []);

  const loadPlans = async () => {
    const loadedPlans = await getWorkoutPlans();
    setPlans(loadedPlans);
    const active = await getActivePlan();
    setActivePlanState(active);
  };

  const loadRecentWorkouts = async () => {
    const history = await getWorkoutHistory();
    setRecentWorkouts(history.slice(0, 3));
  };

  const todaysWorkout = getTodaysWorkout();
  
  // Get next 3 days including rest days
  const getNext3Days = () => {
    if (!activePlan || !activePlan.sessions || !Array.isArray(activePlan.sessions)) {
      return [];
    }
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const next3Days = [];
    
    for (let i = 1; i <= 3; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() + i);
      date.setHours(0, 0, 0, 0);
      
      const session = activePlan.sessions.find(s => {
        const sessionDate = new Date(s.date);
        sessionDate.setHours(0, 0, 0, 0);
        return sessionDate.getTime() === date.getTime();
      });
      
      next3Days.push({
        date: date,
        session: session || { type: 'rest' }
      });
    }
    
    return next3Days;
  };

  const next3Days = getNext3Days();

  const handleQuickStart = () => {
    if (todaysWorkout && todaysWorkout.type !== 'rest') {
      const workoutType = todaysWorkout.subtype || todaysWorkout.type;
      onWorkoutTypeChange(workoutType);
      const equipmentFilter = selectedEquipment.has('all') 
        ? 'all' 
        : Array.from(selectedEquipment);
      
      const today = new Date().getDay();
      const navState = createWorkoutNavState(today);
      onStartWorkout(workoutType, equipmentFilter, null, navState);
    } else {
      // No plan, generate a quick workout
      const equipmentFilter = selectedEquipment.has('all') 
        ? 'all' 
        : Array.from(selectedEquipment);
      onStartWorkout(workoutType || 'full', equipmentFilter);
    }
  };

  const handleSetActive = async (planId) => {
    try {
      await setActivePlan(planId);
      await loadPlans();
    } catch (error) {
      console.error('Error setting active plan:', error);
    }
  };

  const handleDeletePlan = async (planId) => {
    if (window.confirm('Are you sure you want to delete this plan?')) {
      try {
        await deleteWorkoutPlan(planId);
        await loadPlans();
      } catch (error) {
        console.error('Error deleting plan:', error);
      }
    }
  };

  const formatDuration = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  return (
    <Box sx={{ 
      maxWidth: '1400px', 
      margin: '0 auto', 
      p: { xs: 2, md: 3 },
      minHeight: '100vh',
    }}>
      <CompactHeader 
        title="Training Hub"
        subtitle="Workouts, plans, cardio, mobility & yoga in one place"
      />

      <Stack spacing={2}>
        {/* Active Plan Section */}
        <Card sx={{ bgcolor: 'background.paper' }}>
          <CardContent>
            <Stack spacing={2}>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CalendarIcon /> Active Plan
                </Typography>
                <Button
                  size="small"
                  startIcon={<AddIcon />}
                  onClick={() => setShowPlanCreationModal(true)}
                  sx={{ color: 'secondary.main' }}
                >
                  New Plan
                </Button>
              </Stack>

              {activePlan ? (
                <Box>
                  <Typography variant="h5" sx={{ color: 'primary.main', mb: 1 }}>
                    {activePlan.name}
                  </Typography>
                  <Stack spacing={1}>
                    <Typography variant="body2" color="text.secondary">
                      Goal: {activePlan.goal?.replace('_', ' ') || 'General Fitness'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {activePlan.sessions?.length || 0} sessions planned
                    </Typography>
                    {todaysWorkout && todaysWorkout.type !== 'rest' && (
                      <Button
                        variant="contained"
                        color="primary"
                        startIcon={<StartIcon />}
                        onClick={handleQuickStart}
                        fullWidth
                        sx={{ mt: 2 }}
                      >
                        Start Today's Workout
                      </Button>
                    )}
                    {todaysWorkout && todaysWorkout.type === 'rest' && (
                      <Chip 
                        label="Rest Day" 
                        color="info" 
                        sx={{ mt: 2 }}
                      />
                    )}
                  </Stack>
                </Box>
              ) : (
                <Box sx={{ textAlign: 'center', py: 3 }}>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    No active plan. Create one to stay on track!
                  </Typography>
                  <Button
                    variant="contained"
                    color="secondary"
                    startIcon={<AddIcon />}
                    onClick={() => setShowPlanCreationModal(true)}
                  >
                    Create Plan
                  </Button>
                </Box>
              )}
            </Stack>
          </CardContent>
        </Card>

        {/* Quick Start Workout Section */}
        <Card sx={{ bgcolor: 'background.paper' }}>
          <CardContent>
            <Stack spacing={2}>
              <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <WorkoutIcon /> Quick Start
              </Typography>
              
              <FormControl fullWidth size="small">
                <InputLabel>Workout Type</InputLabel>
                <Select
                  value={workoutType || 'full'}
                  onChange={(e) => onWorkoutTypeChange(e.target.value)}
                  label="Workout Type"
                >
                  <MenuItem value="full">Full Body</MenuItem>
                  <MenuItem value="upper">Upper Body</MenuItem>
                  <MenuItem value="lower">Lower Body</MenuItem>
                  <MenuItem value="push">Push</MenuItem>
                  <MenuItem value="pull">Pull</MenuItem>
                  <MenuItem value="legs">Legs</MenuItem>
                </Select>
              </FormControl>

              <Button
                variant="contained"
                color="secondary"
                startIcon={<StartIcon />}
                onClick={handleQuickStart}
                fullWidth
                disabled={loading}
                size="large"
              >
                {loading ? 'Generating...' : 'Generate Workout'}
              </Button>

              {onCustomize && (
                <Button
                  variant="outlined"
                  color="secondary"
                  startIcon={<EditIcon />}
                  onClick={() => onCustomize(workoutType || 'full')}
                  fullWidth
                >
                  Customize Exercises
                </Button>
              )}
            </Stack>
          </CardContent>
        </Card>

        {/* Next 3 Days Section */}
        {next3Days.length > 0 && (
          <Card sx={{ bgcolor: 'background.paper' }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <CalendarIcon /> Next 3 Days
              </Typography>
              <Grid container spacing={2}>
                {next3Days.map((day, index) => {
                  const isRest = day.session.type === 'rest';
                  return (
                    <Grid item xs={12} sm={4} key={index}>
                      <Card sx={{ 
                        bgcolor: 'background.default', 
                        border: '1px solid', 
                        borderColor: isRest ? 'divider' : 'primary.main',
                        opacity: isRest ? 0.7 : 1
                      }}>
                        <CardContent sx={{ py: 2 }}>
                          <Typography variant="subtitle2" color="text.secondary">
                            {day.date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                          </Typography>
                          {isRest ? (
                            <Typography variant="h6" sx={{ color: 'text.secondary', my: 1 }}>
                              Rest Day
                            </Typography>
                          ) : (
                            <>
                              <Typography variant="h6" sx={{ color: 'primary.main', my: 1 }}>
                                {day.session.type.charAt(0).toUpperCase() + day.session.type.slice(1)}
                              </Typography>
                              {day.session.focus && (
                                <Typography variant="body2" color="text.secondary">
                                  {day.session.focus}
                                </Typography>
                              )}
                            </>
                          )}
                        </CardContent>
                      </Card>
                    </Grid>
                  );
                })}
              </Grid>
            </CardContent>
          </Card>
        )}

        {/* All Plans Section */}
        {plans.length > 0 && (
          <Card sx={{ bgcolor: 'background.paper' }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                My Plans
              </Typography>
              <Grid container spacing={2}>
                {plans.map((plan) => {
                  const stats = getPlanStatistics(plan);
                  const isActive = activePlan?.id === plan.id;
                  
                  return (
                    <Grid item xs={12} sm={6} md={4} key={plan.id}>
                      <Card 
                        sx={{ 
                          bgcolor: 'background.default',
                          border: '2px solid',
                          borderColor: isActive ? 'primary.main' : 'transparent',
                          position: 'relative',
                        }}
                      >
                        <CardContent>
                          {isActive && (
                            <Chip 
                              label="Active" 
                              color="primary" 
                              size="small" 
                              sx={{ position: 'absolute', top: 8, right: 8 }}
                            />
                          )}
                          <Typography variant="h6" sx={{ mb: 1, pr: isActive ? 8 : 0 }}>
                            {plan.name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                            {stats.totalSessions} sessions • {plan.daysPerWeek} days/week
                          </Typography>
                          <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
                            {!isActive && (
                              <Button
                                size="small"
                                onClick={() => handleSetActive(plan.id)}
                                variant="outlined"
                                color="primary"
                              >
                                Activate
                              </Button>
                            )}
                            <IconButton
                              size="small"
                              onClick={() => handleDeletePlan(plan.id)}
                              sx={{ color: 'error.main' }}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Stack>
                        </CardContent>
                      </Card>
                    </Grid>
                  );
                })}
              </Grid>
            </CardContent>
          </Card>
        )}

        {/* Recent Activity Section */}
        {recentWorkouts.length > 0 && (
          <Card sx={{ bgcolor: 'background.paper' }}>
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <ProgressIcon /> Recent Activity
                </Typography>
                <Button
                  size="small"
                  onClick={() => onNavigate('progress')}
                  sx={{ color: 'primary.main' }}
                >
                  View All
                </Button>
              </Stack>
              <Stack spacing={1}>
                {recentWorkouts.map((workout, index) => (
                  <Box 
                    key={index}
                    sx={{ 
                      p: 2, 
                      bgcolor: 'background.default', 
                      borderRadius: 1,
                      borderLeft: '4px solid',
                      borderLeftColor: 'primary.main',
                    }}
                  >
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Box>
                        <Typography variant="subtitle2">
                          {workout.type?.charAt(0).toUpperCase() + workout.type?.slice(1) || 'Workout'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {new Date(workout.date).toLocaleDateString()}
                        </Typography>
                      </Box>
                      <Typography variant="body2" color="text.secondary">
                        {formatDuration(workout.duration || 0)}
                      </Typography>
                    </Stack>
                  </Box>
                ))}
              </Stack>
            </CardContent>
          </Card>
        )}

        {/* Mobility & Yoga Section - Extra Compact */}
        <Card sx={{ bgcolor: 'background.paper' }}>
          <CardContent sx={{ py: 2 }}>
            <Typography variant="h6" sx={{ mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
              <YogaIcon /> Mobility & Yoga
            </Typography>
            <Stack direction="row" spacing={1}>
              <Button
                variant="outlined"
                size="small"
                onClick={() => onNavigate('yoga-selection')}
                sx={{ 
                  flex: 1,
                  py: 1,
                  fontSize: '0.85rem',
                }}
              >
                Yoga
              </Button>
              <Button
                variant="outlined"
                size="small"
                onClick={() => onNavigate('mobility')}
                sx={{ 
                  flex: 1,
                  py: 1,
                  fontSize: '0.85rem',
                }}
              >
                Stretching
              </Button>
            </Stack>
          </CardContent>
        </Card>

        {/* Cardio Section - Extra Compact */}
        <Card sx={{ bgcolor: 'background.paper' }}>
          <CardContent sx={{ py: 2 }}>
            <Typography variant="h6" sx={{ mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
              <CardioIcon /> Cardio
            </Typography>
            <Grid container spacing={1}>
              <Grid item xs={6}>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => onNavigate('hiit-selection')}
                  fullWidth
                  sx={{ 
                    py: 1,
                    fontSize: '0.85rem',
                  }}
                >
                  HIIT
                </Button>
              </Grid>
              <Grid item xs={6}>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => onNavigate('hiit')}
                  fullWidth
                  sx={{ 
                    py: 1,
                    fontSize: '0.85rem',
                  }}
                >
                  Timer
                </Button>
              </Grid>
              <Grid item xs={6}>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => onNavigate('log-cardio')}
                  fullWidth
                  sx={{ 
                    py: 1,
                    fontSize: '0.85rem',
                  }}
                >
                  Log Cardio
                </Button>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Stack>

      {/* Plan Creation Modal */}
      <PlanCreationModal
        open={showPlanCreationModal}
        onClose={() => setShowPlanCreationModal(false)}
        onPlanCreated={() => {
          loadPlans();
          setShowPlanCreationModal(false);
        }}
      />
    </Box>
  );
};

UnifiedWorkoutHub.propTypes = {
  workoutType: PropTypes.string,
  selectedEquipment: PropTypes.instanceOf(Set).isRequired,
  onWorkoutTypeChange: PropTypes.func.isRequired,
  onStartWorkout: PropTypes.func.isRequired,
  onCustomize: PropTypes.func,
  onNavigate: PropTypes.func.isRequired,
  loading: PropTypes.bool,
};

export default UnifiedWorkoutHub;
