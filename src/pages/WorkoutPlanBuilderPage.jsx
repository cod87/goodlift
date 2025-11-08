import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import PropTypes from 'prop-types';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Stack,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
} from '@mui/material';
import { Add, Delete, Edit, Schedule } from '@mui/icons-material';
import { 
  getWorkoutPlans, 
  saveWorkoutPlan, 
  updateWorkoutPlan,
  deleteWorkoutPlan,
  setActivePlan,
  schedulePlannedWorkout 
} from '../utils/storage';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';

const WorkoutPlanBuilderPage = ({ onNavigate }) => {
  const [plans, setPlans] = useState([]);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [newPlanName, setNewPlanName] = useState('');
  const [newPlanDescription, setNewPlanDescription] = useState('');
  const [scheduledDate, setScheduledDate] = useState(new Date());
  const [scheduledType, setScheduledType] = useState('full');

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = () => {
    const loadedPlans = getWorkoutPlans();
    setPlans(loadedPlans);
  };

  const handleCreatePlan = async () => {
    if (!newPlanName.trim()) return;

    try {
      await saveWorkoutPlan({
        name: newPlanName,
        description: newPlanDescription,
        schedule: [],
        isActive: false,
      });

      loadPlans();
      setCreateDialogOpen(false);
      setNewPlanName('');
      setNewPlanDescription('');
    } catch (error) {
      console.error('Error creating plan:', error);
    }
  };

  const handleDeletePlan = async (planId) => {
    if (window.confirm('Are you sure you want to delete this plan?')) {
      try {
        await deleteWorkoutPlan(planId);
        loadPlans();
      } catch (error) {
        console.error('Error deleting plan:', error);
      }
    }
  };

  const handleSetActive = async (planId) => {
    try {
      await setActivePlan(planId);
      loadPlans();
    } catch (error) {
      console.error('Error setting active plan:', error);
    }
  };

  const handleScheduleWorkout = () => {
    setScheduleDialogOpen(true);
  };

  const handleSaveScheduledWorkout = async () => {
    if (!scheduledDate) return;

    try {
      await schedulePlannedWorkout({
        date: scheduledDate.toISOString(),
        type: scheduledType,
        planId: selectedPlan?.id || null,
        planName: selectedPlan?.name || '',
        workoutName: `${scheduledType.charAt(0).toUpperCase() + scheduledType.slice(1)} Workout`,
        isCompleted: false,
      });

      setScheduleDialogOpen(false);
      setScheduledDate(new Date());
      setScheduledType('full');

      if (onNavigate) {
        onNavigate('progress');
      }
    } catch (error) {
      console.error('Error scheduling workout:', error);
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        style={{ 
          maxWidth: '900px', 
          margin: '0 auto', 
          padding: '2rem 1rem' 
        }}
      >
        <Box sx={{ mb: 4, textAlign: 'center' }}>
          <Typography variant="h3" sx={{ 
            fontWeight: 700, 
            color: 'primary.main',
            mb: 1
          }}>
            Workout Plan Builder
          </Typography>
          <Typography variant="body1" sx={{ 
            color: 'text.secondary',
            maxWidth: '700px',
            margin: '0 auto',
            mb: 3
          }}>
            Create and manage your custom workout plans
          </Typography>

          <Stack direction="row" spacing={2} justifyContent="center">
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => setCreateDialogOpen(true)}
              sx={{ px: 3 }}
            >
              Create New Plan
            </Button>
            <Button
              variant="outlined"
              startIcon={<Schedule />}
              onClick={handleScheduleWorkout}
              sx={{ px: 3 }}
            >
              Schedule Workout
            </Button>
          </Stack>
        </Box>

        {plans.length === 0 ? (
          <Card sx={{ borderRadius: 3, textAlign: 'center', py: 4 }}>
            <CardContent>
              <Typography variant="h6" color="text.secondary">
                No workout plans yet. Create your first plan to get started!
              </Typography>
            </CardContent>
          </Card>
        ) : (
          <Stack spacing={2}>
            {plans.map((plan) => (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card sx={{ 
                  borderRadius: 3,
                  border: plan.isActive ? '2px solid' : 'none',
                  borderColor: 'primary.main',
                }}>
                  <CardContent>
                    <Stack direction="row" alignItems="center" justifyContent="space-between">
                      <Box sx={{ flex: 1 }}>
                        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                          <Typography variant="h6" sx={{ fontWeight: 700 }}>
                            {plan.name}
                          </Typography>
                          {plan.isActive && (
                            <Chip label="Active" color="primary" size="small" />
                          )}
                        </Stack>
                        {plan.description && (
                          <Typography variant="body2" color="text.secondary">
                            {plan.description}
                          </Typography>
                        )}
                        <Typography variant="caption" color="text.secondary">
                          Created: {new Date(plan.createdAt).toLocaleDateString()}
                        </Typography>
                      </Box>

                      <Stack direction="row" spacing={1}>
                        {!plan.isActive && (
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => handleSetActive(plan.id)}
                          >
                            Set Active
                          </Button>
                        )}
                        <IconButton
                          size="small"
                          onClick={() => {
                            setSelectedPlan(plan);
                            setScheduleDialogOpen(true);
                          }}
                        >
                          <Schedule />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleDeletePlan(plan.id)}
                          color="error"
                        >
                          <Delete />
                        </IconButton>
                      </Stack>
                    </Stack>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </Stack>
        )}

        {/* Create Plan Dialog */}
        <Dialog
          open={createDialogOpen}
          onClose={() => setCreateDialogOpen(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Create New Workout Plan</DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ mt: 2 }}>
              <TextField
                label="Plan Name"
                fullWidth
                value={newPlanName}
                onChange={(e) => setNewPlanName(e.target.value)}
                required
              />
              <TextField
                label="Description (optional)"
                fullWidth
                multiline
                rows={3}
                value={newPlanDescription}
                onChange={(e) => setNewPlanDescription(e.target.value)}
              />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
            <Button 
              onClick={handleCreatePlan} 
              variant="contained"
              disabled={!newPlanName.trim()}
            >
              Create
            </Button>
          </DialogActions>
        </Dialog>

        {/* Schedule Workout Dialog */}
        <Dialog
          open={scheduleDialogOpen}
          onClose={() => setScheduleDialogOpen(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Schedule Workout</DialogTitle>
          <DialogContent>
            <Stack spacing={3} sx={{ mt: 2 }}>
              <DatePicker
                label="Select Date"
                value={scheduledDate}
                onChange={(newValue) => setScheduledDate(newValue)}
                slotProps={{ textField: { fullWidth: true } }}
              />
              <FormControl fullWidth>
                <InputLabel>Workout Type</InputLabel>
                <Select
                  value={scheduledType}
                  onChange={(e) => setScheduledType(e.target.value)}
                  label="Workout Type"
                >
                  <MenuItem value="full">Full Body</MenuItem>
                  <MenuItem value="upper">Upper Body</MenuItem>
                  <MenuItem value="lower">Lower Body</MenuItem>
                  <MenuItem value="cardio">Cardio</MenuItem>
                  <MenuItem value="plyo">Plyometrics</MenuItem>
                  <MenuItem value="yoga">Yoga</MenuItem>
                  <MenuItem value="hiit">HIIT</MenuItem>
                </Select>
              </FormControl>
              {selectedPlan && (
                <Typography variant="body2" color="text.secondary">
                  Plan: {selectedPlan.name}
                </Typography>
              )}
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setScheduleDialogOpen(false)}>Cancel</Button>
            <Button 
              onClick={handleSaveScheduledWorkout} 
              variant="contained"
            >
              Schedule
            </Button>
          </DialogActions>
        </Dialog>

        <Box sx={{ mt: 4, textAlign: 'center' }}>
          <Button
            variant="outlined"
            onClick={() => onNavigate && onNavigate('progress')}
            sx={{ px: 4 }}
          >
            View Progress & Calendar
          </Button>
        </Box>
      </motion.div>
    </LocalizationProvider>
  );
};

WorkoutPlanBuilderPage.propTypes = {
  onNavigate: PropTypes.func,
};

export default WorkoutPlanBuilderPage;
