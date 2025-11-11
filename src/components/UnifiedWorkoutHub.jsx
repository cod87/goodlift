import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Chip,
  IconButton,
  Stack,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  PlayArrow as StartIcon,
  Add as AddIcon,
  Edit as EditIcon,
  CalendarMonth as CalendarIcon,
  FitnessCenter as WorkoutIcon,
  TrendingUp as ProgressIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import CompactHeader from './Common/CompactHeader';
import { usePlanIntegration } from '../hooks/usePlanIntegration';
import {
  generateWorkoutPlan,
  getPlanStatistics,
} from '../utils/workoutPlanGenerator';
import {
  getWorkoutPlans,
  saveWorkoutPlan,
  deleteWorkoutPlan,
  getActivePlan,
  setActivePlan,
  getWorkoutHistory,
} from '../utils/storage';

/**
 * UnifiedWorkoutHub - Single streamlined section for workouts and plans
 * Combines workout generation, plan management, and progress overview
 */
const UnifiedWorkoutHub = ({ 
  workoutType,
  selectedEquipment,
  equipmentOptions,
  onWorkoutTypeChange,
  onEquipmentChange,
  onStartWorkout,
  onCustomize,
  onNavigate,
  loading,
}) => {
  const [plans, setPlans] = useState([]);
  const [activePlan, setActivePlanState] = useState(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [recentWorkouts, setRecentWorkouts] = useState([]);
  const [planForm, setPlanForm] = useState({
    name: '',
    goal: 'general_fitness',
    experienceLevel: 'intermediate',
    daysPerWeek: 3,
    duration: 30,
    sessionTypes: ['full', 'upper', 'lower', 'hiit', 'cardio', 'yoga']
  });

  const {
    currentPlan,
    getTodaysWorkout,
    getUpcomingWorkouts,
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
  const upcomingWorkouts = getUpcomingWorkouts(3);

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

  const handleGeneratePlan = async () => {
    try {
      setIsGenerating(true);
      const plan = await generateWorkoutPlan({
        ...planForm,
        planName: planForm.name || 'My Workout Plan',
        startDate: new Date(),
        equipmentAvailable: ['all']
      });

      await saveWorkoutPlan(plan);
      
      if (plan.name === 'This Week') {
        await setActivePlan(plan.id);
      }
      
      await loadPlans();
      setShowCreateDialog(false);
      setPlanForm({
        name: '',
        goal: 'general_fitness',
        experienceLevel: 'intermediate',
        daysPerWeek: 3,
        duration: 30,
        sessionTypes: ['full', 'upper', 'lower', 'hiit', 'cardio', 'yoga']
      });
    } catch (error) {
      console.error('Error generating plan:', error);
      alert(`Failed to generate plan: ${error.message}`);
    } finally {
      setIsGenerating(false);
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
        title="Workouts & Plans"
        subtitle="Your fitness journey in one place"
      />

      <Grid container spacing={3}>
        {/* Active Plan Section */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%', bgcolor: 'background.paper' }}>
            <CardContent>
              <Stack spacing={2}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CalendarIcon /> Active Plan
                  </Typography>
                  <Button
                    size="small"
                    startIcon={<AddIcon />}
                    onClick={() => setShowCreateDialog(true)}
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
                      onClick={() => setShowCreateDialog(true)}
                    >
                      Create Plan
                    </Button>
                  </Box>
                )}
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Quick Start Workout Section */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%', bgcolor: 'background.paper' }}>
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
        </Grid>

        {/* Upcoming Workouts Section */}
        {upcomingWorkouts.length > 0 && (
          <Grid item xs={12}>
            <Card sx={{ bgcolor: 'background.paper' }}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CalendarIcon /> Upcoming Workouts
                </Typography>
                <Grid container spacing={2}>
                  {upcomingWorkouts.map((workout, index) => (
                    <Grid item xs={12} sm={6} md={4} key={index}>
                      <Card sx={{ bgcolor: 'background.default', border: '1px solid', borderColor: 'primary.main' }}>
                        <CardContent>
                          <Typography variant="subtitle2" color="text.secondary">
                            {new Date(workout.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                          </Typography>
                          <Typography variant="h6" sx={{ color: 'primary.main', my: 1 }}>
                            {workout.type.charAt(0).toUpperCase() + workout.type.slice(1)}
                          </Typography>
                          {workout.focus && (
                            <Typography variant="body2" color="text.secondary">
                              {workout.focus}
                            </Typography>
                          )}
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* All Plans Section */}
        {plans.length > 0 && (
          <Grid item xs={12}>
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
          </Grid>
        )}

        {/* Recent Activity Section */}
        {recentWorkouts.length > 0 && (
          <Grid item xs={12}>
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
          </Grid>
        )}
      </Grid>

      {/* Create Plan Dialog */}
      <Dialog open={showCreateDialog} onClose={() => setShowCreateDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create New Workout Plan</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Plan Name"
              fullWidth
              value={planForm.name}
              onChange={(e) => setPlanForm({ ...planForm, name: e.target.value })}
              placeholder="e.g., Summer Cut, Strength Building"
            />
            
            <FormControl fullWidth>
              <InputLabel>Goal</InputLabel>
              <Select
                value={planForm.goal}
                onChange={(e) => setPlanForm({ ...planForm, goal: e.target.value })}
                label="Goal"
              >
                <MenuItem value="general_fitness">General Fitness</MenuItem>
                <MenuItem value="muscle_building">Muscle Building</MenuItem>
                <MenuItem value="strength">Strength</MenuItem>
                <MenuItem value="fat_loss">Fat Loss</MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>Experience Level</InputLabel>
              <Select
                value={planForm.experienceLevel}
                onChange={(e) => setPlanForm({ ...planForm, experienceLevel: e.target.value })}
                label="Experience Level"
              >
                <MenuItem value="beginner">Beginner</MenuItem>
                <MenuItem value="intermediate">Intermediate</MenuItem>
                <MenuItem value="advanced">Advanced</MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>Days Per Week</InputLabel>
              <Select
                value={planForm.daysPerWeek}
                onChange={(e) => setPlanForm({ ...planForm, daysPerWeek: e.target.value })}
                label="Days Per Week"
              >
                {[3, 4, 5, 6, 7].map(days => (
                  <MenuItem key={days} value={days}>{days} days</MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>Plan Duration (days)</InputLabel>
              <Select
                value={planForm.duration}
                onChange={(e) => setPlanForm({ ...planForm, duration: e.target.value })}
                label="Plan Duration (days)"
              >
                <MenuItem value={7}>1 week</MenuItem>
                <MenuItem value={14}>2 weeks</MenuItem>
                <MenuItem value={30}>1 month</MenuItem>
                <MenuItem value={60}>2 months</MenuItem>
                <MenuItem value={90}>3 months</MenuItem>
              </Select>
            </FormControl>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowCreateDialog(false)}>Cancel</Button>
          <Button 
            onClick={handleGeneratePlan} 
            variant="contained" 
            color="primary"
            disabled={isGenerating || !planForm.name}
          >
            {isGenerating ? 'Generating...' : 'Create Plan'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

UnifiedWorkoutHub.propTypes = {
  workoutType: PropTypes.string,
  selectedEquipment: PropTypes.instanceOf(Set).isRequired,
  equipmentOptions: PropTypes.array.isRequired,
  onWorkoutTypeChange: PropTypes.func.isRequired,
  onEquipmentChange: PropTypes.func.isRequired,
  onStartWorkout: PropTypes.func.isRequired,
  onCustomize: PropTypes.func,
  onNavigate: PropTypes.func.isRequired,
  loading: PropTypes.bool,
};

export default UnifiedWorkoutHub;
