import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  Button,
  Container,
  Typography,
  Paper,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  IconButton,
  Tooltip,
  Card,
  CardContent,
  CardActions,
  LinearProgress
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  PlayArrow as StartIcon,
  CalendarMonth as CalendarIcon,
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material';
import CompactHeader from './Common/CompactHeader';
import {
  generateWorkoutPlan,
  getPlanStatistics
} from '../utils/workoutPlanGenerator';
import {
  getWorkoutPlans,
  saveWorkoutPlan,
  deleteWorkoutPlan,
  getActivePlan,
  setActivePlan
} from '../utils/storage';

const WorkoutPlanScreen = ({ onNavigate }) => {
  const [plans, setPlans] = useState([]);
  const [activePlan, setActivePlanState] = useState(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [planForm, setPlanForm] = useState({
    name: '',
    goal: 'general_fitness',
    experienceLevel: 'intermediate',
    daysPerWeek: 3,
    duration: 30,
    sessionTypes: ['full']
  });

  // Load plans on mount
  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    const loadedPlans = await getWorkoutPlans();
    setPlans(loadedPlans);
    
    const active = await getActivePlan();
    setActivePlanState(active);
  };

  const handleCreatePlan = () => {
    setShowCreateDialog(true);
  };

  const handleCloseDialog = () => {
    setShowCreateDialog(false);
    setPlanForm({
      name: '',
      goal: 'general_fitness',
      experienceLevel: 'intermediate',
      daysPerWeek: 3,
      duration: 30,
      sessionTypes: ['full']
    });
  };

  const handleFormChange = (field, value) => {
    setPlanForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSessionTypeToggle = (type) => {
    setPlanForm(prev => {
      const currentTypes = prev.sessionTypes;
      if (currentTypes.includes(type)) {
        return {
          ...prev,
          sessionTypes: currentTypes.filter(t => t !== type)
        };
      } else {
        return {
          ...prev,
          sessionTypes: [...currentTypes, type]
        };
      }
    });
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
      
      // Auto-activate if plan name is "This Week"
      if (plan.name === 'This Week') {
        await setActivePlan(plan.id);
      }
      
      await loadPlans();
      handleCloseDialog();
    } catch (error) {
      console.error('Error generating plan:', error);
      alert('Failed to generate plan. Please try again.');
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

  const handleViewCalendar = (plan) => {
    // Set as active plan and navigate to calendar view
    setActivePlan(plan.id);
    if (onNavigate) {
      onNavigate('plan-calendar');
    }
  };

  const getGoalLabel = (goal) => {
    const labels = {
      strength: 'Strength',
      hypertrophy: 'Muscle Gain',
      fat_loss: 'Fat Loss',
      general_fitness: 'General Fitness'
    };
    return labels[goal] || goal;
  };

  const getExperienceLabel = (level) => {
    const labels = {
      beginner: 'Beginner',
      intermediate: 'Intermediate',
      advanced: 'Advanced'
    };
    return labels[level] || level;
  };

  return (
    <Box sx={{ width: '100%', minHeight: '100vh' }}>
      <CompactHeader 
        title="Workout Plans" 
        icon="📅"
        action={
          <Button
            variant="contained"
            color="primary"
            size="small"
            startIcon={<AddIcon />}
            onClick={handleCreatePlan}
          >
            Create Plan
          </Button>
        }
      />
      
      <Container maxWidth="lg" sx={{ py: 2 }}>

      {/* Active Plan Section */}
      {activePlan && (
        <Paper sx={{ p: 3, mb: 3, bgcolor: 'primary.light', color: 'white' }}>
          <Typography variant="h6" gutterBottom>
            Active Plan
          </Typography>
          <Typography variant="h5" gutterBottom>
            {activePlan.name}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
            <Chip label={getGoalLabel(activePlan.goal)} size="small" sx={{ bgcolor: 'white' }} />
            <Chip label={`${activePlan.daysPerWeek} days/week`} size="small" sx={{ bgcolor: 'white' }} />
            <Chip label={getExperienceLabel(activePlan.experienceLevel)} size="small" sx={{ bgcolor: 'white' }} />
          </Box>
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" gutterBottom>
              Progress: {(() => {
                const stats = getPlanStatistics(activePlan);
                return `${stats.completedSessions}/${stats.totalSessions} sessions (${Math.round(stats.completionRate)}%)`;
              })()}
            </Typography>
            <LinearProgress 
              variant="determinate" 
              value={getPlanStatistics(activePlan).completionRate} 
              sx={{ mt: 1, bgcolor: 'rgba(255,255,255,0.3)', '& .MuiLinearProgress-bar': { bgcolor: 'white' } }}
            />
          </Box>
          <Button
            variant="contained"
            color="secondary"
            startIcon={<CalendarIcon />}
            onClick={() => handleViewCalendar(activePlan)}
          >
            View Calendar
          </Button>
        </Paper>
      )}

      {/* Plans List */}
      <Grid container spacing={2}>
        {plans.map(plan => {
          const stats = getPlanStatistics(plan);
          const isActive = activePlan && activePlan.id === plan.id;
          
          return (
            <Grid item xs={12} sm={6} md={4} key={plan.id}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Typography variant="h6" component="h2" sx={{ flexGrow: 1 }}>
                      {plan.name}
                    </Typography>
                    {isActive && (
                      <CheckCircleIcon color="primary" />
                    )}
                  </Box>
                  
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 2 }}>
                    <Chip label={getGoalLabel(plan.goal)} size="small" />
                    <Chip label={`${plan.daysPerWeek} days/week`} size="small" />
                    <Chip label={`${plan.duration} days`} size="small" />
                  </Box>
                  
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {getExperienceLabel(plan.experienceLevel)}
                  </Typography>
                  
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      {stats.completedSessions}/{stats.totalSessions} completed ({Math.round(stats.completionRate)}%)
                    </Typography>
                    <LinearProgress 
                      variant="determinate" 
                      value={stats.completionRate} 
                      sx={{ mt: 1 }}
                    />
                  </Box>
                </CardContent>
                
                <CardActions sx={{ justifyContent: 'space-between', px: 2, pb: 2 }}>
                  <Box>
                    <Tooltip title="View Calendar">
                      <IconButton size="small" onClick={() => handleViewCalendar(plan)}>
                        <CalendarIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete Plan">
                      <IconButton size="small" onClick={() => handleDeletePlan(plan.id)}>
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </Box>
                  {!isActive && (
                    <Button
                      size="small"
                      startIcon={<StartIcon />}
                      onClick={() => handleSetActive(plan.id)}
                    >
                      Set Active
                    </Button>
                  )}
                </CardActions>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {plans.length === 0 && (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No workout plans yet
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Create your first workout plan to get started
          </Typography>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={handleCreatePlan}
          >
            Create Your First Plan
          </Button>
        </Paper>
      )}

      {/* Create Plan Dialog */}
      <Dialog open={showCreateDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Create Workout Plan</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              fullWidth
              label="Plan Name"
              value={planForm.name}
              onChange={(e) => handleFormChange('name', e.target.value)}
              placeholder="e.g., Summer Strength Plan"
            />

            <FormControl fullWidth>
              <InputLabel>Goal</InputLabel>
              <Select
                value={planForm.goal}
                label="Goal"
                onChange={(e) => handleFormChange('goal', e.target.value)}
              >
                <MenuItem value="strength">Strength</MenuItem>
                <MenuItem value="hypertrophy">Muscle Gain</MenuItem>
                <MenuItem value="fat_loss">Fat Loss</MenuItem>
                <MenuItem value="general_fitness">General Fitness</MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>Experience Level</InputLabel>
              <Select
                value={planForm.experienceLevel}
                label="Experience Level"
                onChange={(e) => handleFormChange('experienceLevel', e.target.value)}
              >
                <MenuItem value="beginner">Beginner</MenuItem>
                <MenuItem value="intermediate">Intermediate</MenuItem>
                <MenuItem value="advanced">Advanced</MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>Days per Week</InputLabel>
              <Select
                value={planForm.daysPerWeek}
                label="Days per Week"
                onChange={(e) => handleFormChange('daysPerWeek', e.target.value)}
              >
                {[2, 3, 4, 5, 6, 7].map(days => (
                  <MenuItem key={days} value={days}>{days} days</MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>Duration (days)</InputLabel>
              <Select
                value={planForm.duration}
                label="Duration (days)"
                onChange={(e) => handleFormChange('duration', e.target.value)}
              >
                <MenuItem value={7}>1 week</MenuItem>
                <MenuItem value={14}>2 weeks</MenuItem>
                <MenuItem value={30}>30 days</MenuItem>
                <MenuItem value={60}>60 days</MenuItem>
                <MenuItem value={90}>90 days</MenuItem>
              </Select>
            </FormControl>

            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Session Types
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {[
                  { value: 'full', label: 'Full Body' },
                  { value: 'upper', label: 'Upper Body' },
                  { value: 'lower', label: 'Lower Body' },
                  { value: 'hiit', label: 'HIIT' },
                  { value: 'cardio', label: 'Cardio' },
                  { value: 'yoga', label: 'Yoga/Mobility' }
                ].map(type => (
                  <Chip
                    key={type.value}
                    label={type.label}
                    onClick={() => handleSessionTypeToggle(type.value)}
                    color={planForm.sessionTypes.includes(type.value) ? 'primary' : 'default'}
                    variant={planForm.sessionTypes.includes(type.value) ? 'filled' : 'outlined'}
                  />
                ))}
              </Box>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} disabled={isGenerating}>Cancel</Button>
          <Button 
            onClick={handleGeneratePlan} 
            variant="contained" 
            color="primary"
            disabled={!planForm.name || planForm.sessionTypes.length === 0 || isGenerating}
          >
            {isGenerating ? 'Generating...' : 'Generate Plan'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
    </Box>
  );
};

WorkoutPlanScreen.propTypes = {
  onNavigate: PropTypes.func
};

export default WorkoutPlanScreen;
