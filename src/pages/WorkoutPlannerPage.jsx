import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  CardActions,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Chip,
} from '@mui/material';
import { Add, Edit, Delete, PlayArrow } from '@mui/icons-material';
import PropTypes from 'prop-types';
import {
  getWorkoutPlans,
  saveWorkoutPlan,
  deleteWorkoutPlan,
  setActivePlan,
  getActivePlan,
  setScheduledWorkouts,
} from '../utils/storage';
import { create90DayPlan, scheduleWorkoutsFromPlan } from '../utils/planHelpers';

const WorkoutPlannerPage = ({ onNavigate }) => {
  const [plans, setPlans] = useState([]);
  const [activePlan, setActivePlanState] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [planName, setPlanName] = useState('');
  const [planDescription, setPlanDescription] = useState('');

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = () => {
    const storedPlans = getWorkoutPlans();
    const active = getActivePlan();
    
    // Add premade plan if not already in list
    const premade90Day = create90DayPlan();
    const has90Day = storedPlans.some(p => p.id === 'premade-90-day');
    
    if (!has90Day) {
      storedPlans.unshift(premade90Day);
    }
    
    setPlans(storedPlans);
    setActivePlanState(active);
  };

  const handleCreatePlan = () => {
    setEditingPlan(null);
    setPlanName('');
    setPlanDescription('');
    setOpenDialog(true);
  };

  const handleEditPlan = (plan) => {
    if (plan.isPremade) {
      return; // Don't allow editing premade plans
    }
    setEditingPlan(plan);
    setPlanName(plan.name);
    setPlanDescription(plan.description);
    setOpenDialog(true);
  };

  const handleSavePlan = () => {
    const plan = {
      id: editingPlan?.id,
      name: planName,
      description: planDescription,
      days: editingPlan?.days || [],
      isPremade: false,
    };
    
    saveWorkoutPlan(plan);
    setOpenDialog(false);
    loadPlans();
  };

  const handleDeletePlan = (planId) => {
    if (window.confirm('Are you sure you want to delete this plan?')) {
      deleteWorkoutPlan(planId);
      loadPlans();
    }
  };

  const handleActivatePlan = (plan) => {
    const startDate = new Date();
    const planWithStart = { ...plan, startDate: startDate.toISOString() };
    
    setActivePlan(planWithStart);
    
    // Generate scheduled workouts
    const scheduled = scheduleWorkoutsFromPlan(plan, startDate);
    setScheduledWorkouts(scheduled);
    
    setActivePlanState(planWithStart);
    
    // Navigate to progress screen to see calendar
    if (onNavigate) {
      onNavigate('progress');
    }
  };

  return (
    <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 700 }}>
          Workout Planner
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={handleCreatePlan}
        >
          Create Plan
        </Button>
      </Box>

      {activePlan && (
        <Card sx={{ mb: 3, bgcolor: 'primary.main', color: 'white' }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Active Plan
            </Typography>
            <Typography variant="body1">
              {activePlan.name}
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9 }}>
              Started: {new Date(activePlan.startDate).toLocaleDateString()}
            </Typography>
          </CardContent>
        </Card>
      )}

      <Grid container spacing={3}>
        {plans.map((plan) => (
          <Grid item xs={12} sm={6} md={4} key={plan.id}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardContent sx={{ flexGrow: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                  <Typography variant="h6" component="h2">
                    {plan.name}
                  </Typography>
                  {plan.isPremade && (
                    <Chip label="Premade" color="secondary" size="small" />
                  )}
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {plan.description}
                </Typography>
                {plan.totalDays && (
                  <Typography variant="body2" color="text.secondary">
                    Duration: {plan.totalDays} days
                  </Typography>
                )}
              </CardContent>
              <CardActions>
                <Button
                  size="small"
                  startIcon={<PlayArrow />}
                  onClick={() => handleActivatePlan(plan)}
                  disabled={activePlan?.id === plan.id}
                >
                  {activePlan?.id === plan.id ? 'Active' : 'Activate'}
                </Button>
                {!plan.isPremade && (
                  <>
                    <IconButton
                      size="small"
                      onClick={() => handleEditPlan(plan)}
                    >
                      <Edit fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleDeletePlan(plan.id)}
                      color="error"
                    >
                      <Delete fontSize="small" />
                    </IconButton>
                  </>
                )}
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingPlan ? 'Edit Plan' : 'Create New Plan'}
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Plan Name"
            fullWidth
            value={planName}
            onChange={(e) => setPlanName(e.target.value)}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Description"
            fullWidth
            multiline
            rows={3}
            value={planDescription}
            onChange={(e) => setPlanDescription(e.target.value)}
          />
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            Note: Full plan builder with day-by-day customization coming soon.
            For now, you can create a plan template.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button onClick={handleSavePlan} variant="contained" disabled={!planName}>
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

WorkoutPlannerPage.propTypes = {
  onNavigate: PropTypes.func,
};

export default WorkoutPlannerPage;
