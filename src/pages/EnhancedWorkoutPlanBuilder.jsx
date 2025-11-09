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
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Divider,
  Autocomplete,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  Tab,
} from '@mui/material';
import { 
  Add, 
  Delete, 
  Edit, 
  Schedule,
  FitnessCenter,
  ContentCopy,
} from '@mui/icons-material';
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
import { useQuery } from '@tanstack/react-query';

const EXERCISES_DATA_PATH = `${import.meta.env.BASE_URL}data/exercises.json`;
const NINETY_DAY_PLAN_PATH = `${import.meta.env.BASE_URL}data/90-day-plan.json`;

const EnhancedWorkoutPlanBuilder = ({ onNavigate }) => {
  const [plans, setPlans] = useState([]);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editScheduleDialogOpen, setEditScheduleDialogOpen] = useState(false);
  const [scheduleWorkoutDialogOpen, setScheduleWorkoutDialogOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [newPlanName, setNewPlanName] = useState('');
  const [newPlanDescription, setNewPlanDescription] = useState('');
  const [scheduledDate, setScheduledDate] = useState(new Date());
  const [scheduledType, setScheduledType] = useState('full');
  const [currentTab, setCurrentTab] = useState(0);
  
  // Schedule editing state
  const [editingDayIndex, setEditingDayIndex] = useState(null);
  const [daySchedule, setDaySchedule] = useState({
    dayNumber: 1,
    type: 'full',
    exercises: [],
    notes: ''
  });

  // Load exercises data
  const { data: exercises = [] } = useQuery({
    queryKey: ['exercises'],
    queryFn: async () => {
      const response = await fetch(EXERCISES_DATA_PATH);
      if (!response.ok) throw new Error('Failed to load exercises');
      return response.json();
    },
    staleTime: Infinity,
  });

  // Load 90-day plan template
  const { data: ninetyDayPlan = [] } = useQuery({
    queryKey: ['90DayPlan'],
    queryFn: async () => {
      const response = await fetch(NINETY_DAY_PLAN_PATH);
      if (!response.ok) throw new Error('Failed to load 90-day plan');
      return response.json();
    },
    staleTime: Infinity,
  });

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

  const handleLoad90DayPlan = async () => {
    if (!ninetyDayPlan || ninetyDayPlan.length === 0) return;

    try {
      // Create schedule from 90-day plan
      const schedule = [];
      ninetyDayPlan.forEach(phase => {
        if (phase.schedule) {
          phase.schedule.forEach(day => {
            schedule.push({
              dayNumber: day.day,
              type: day.type,
              workout: day.workout,
              exercises: [], // Will be populated based on type
              notes: day.description || ''
            });
          });
        }
      });

      const newPlan = await saveWorkoutPlan({
        name: '90-Day Comprehensive Program',
        description: 'Complete 90-day workout program with strength, plyo, and mobility',
        schedule: schedule,
        isActive: false,
      });

      loadPlans();
      setSelectedPlan(newPlan);
    } catch (error) {
      console.error('Error loading 90-day plan:', error);
    }
  };

  const handleAutoSchedule = async (plan, startDate) => {
    if (!plan || !plan.schedule || plan.schedule.length === 0) return;

    try {
      const start = new Date(startDate);
      
      for (let i = 0; i < plan.schedule.length; i++) {
        const daySchedule = plan.schedule[i];
        const workoutDate = new Date(start);
        workoutDate.setDate(start.getDate() + i);

        await schedulePlannedWorkout({
          date: workoutDate.toISOString(),
          type: daySchedule.type || 'full',
          planId: plan.id,
          planName: plan.name,
          workoutName: daySchedule.workout || `Day ${daySchedule.dayNumber} Workout`,
          isCompleted: false,
        });
      }

      alert(`Successfully scheduled ${plan.schedule.length} workouts!`);
      if (onNavigate) {
        onNavigate('progress');
      }
    } catch (error) {
      console.error('Error auto-scheduling:', error);
      alert('Error scheduling workouts. Please try again.');
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

  const handleEditSchedule = (plan) => {
    setSelectedPlan(plan);
    setEditScheduleDialogOpen(true);
  };

  const handleAddDay = () => {
    if (!selectedPlan) return;

    const newSchedule = [...(selectedPlan.schedule || [])];
    newSchedule.push({
      dayNumber: newSchedule.length + 1,
      type: 'full',
      exercises: [],
      notes: ''
    });

    updateWorkoutPlan(selectedPlan.id, { schedule: newSchedule });
    loadPlans();
  };

  const handleEditDay = (dayIndex) => {
    if (!selectedPlan || !selectedPlan.schedule) return;
    setEditingDayIndex(dayIndex);
    setDaySchedule(selectedPlan.schedule[dayIndex]);
  };

  const handleSaveDay = () => {
    if (!selectedPlan || editingDayIndex === null) return;

    const newSchedule = [...selectedPlan.schedule];
    newSchedule[editingDayIndex] = daySchedule;

    updateWorkoutPlan(selectedPlan.id, { schedule: newSchedule });
    loadPlans();
    setEditingDayIndex(null);
    setDaySchedule({
      dayNumber: 1,
      type: 'full',
      exercises: [],
      notes: ''
    });
  };

  const handleAddExercise = (exercise) => {
    setDaySchedule(prev => ({
      ...prev,
      exercises: [...prev.exercises, {
        name: exercise['Exercise Name'],
        sets: 3,
        reps: 10,
        isSuperset: false,
        supersetWith: null
      }]
    }));
  };

  const handleScheduleWorkout = () => {
    setScheduleWorkoutDialogOpen(true);
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

      setScheduleWorkoutDialogOpen(false);
      setScheduledDate(new Date());
      setScheduledType('full');

      if (onNavigate) {
        onNavigate('progress');
      }
    } catch (error) {
      console.error('Error scheduling workout:', error);
    }
  };

  // Filter valid exercises
  const validExercises = exercises.filter(ex => 
    ex['Exercise Name'] && 
    ex['Exercise Name'].length > 3 && 
    !ex['Exercise Name'].match(/^\d/)
  );

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        style={{ 
          maxWidth: '1200px', 
          margin: '0 auto', 
          padding: '2rem 1rem' 
        }}
      >
        <Box sx={{ mb: 4 }}>
          <Typography variant="h3" sx={{ 
            fontWeight: 700, 
            color: 'primary.main',
            mb: 1,
            textAlign: 'center'
          }}>
            Workout Plan Builder
          </Typography>
          <Typography variant="body1" sx={{ 
            color: 'text.secondary',
            maxWidth: '700px',
            margin: '0 auto',
            mb: 3,
            textAlign: 'center'
          }}>
            Create custom workout plans with detailed daily schedules
          </Typography>

          <Stack direction="row" spacing={2} justifyContent="center" flexWrap="wrap" sx={{ gap: 1 }}>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => setCreateDialogOpen(true)}
            >
              Create New Plan
            </Button>
            <Button
              variant="outlined"
              startIcon={<ContentCopy />}
              onClick={handleLoad90DayPlan}
            >
              Load 90-Day Plan
            </Button>
            <Button
              variant="outlined"
              startIcon={<Schedule />}
              onClick={handleScheduleWorkout}
            >
              Schedule Workout
            </Button>
          </Stack>
        </Box>

        {plans.length === 0 ? (
          <Card sx={{ borderRadius: 3, textAlign: 'center', py: 4 }}>
            <CardContent>
              <Typography variant="h6" color="text.secondary">
                No workout plans yet. Create your first plan or load the 90-day template!
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
                    <Stack spacing={2}>
                      <Stack direction="row" alignItems="center" justifyContent="space-between">
                        <Box sx={{ flex: 1 }}>
                          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                            <Typography variant="h6" sx={{ fontWeight: 700 }}>
                              {plan.name}
                            </Typography>
                            {plan.isActive && (
                              <Chip label="Active" color="primary" size="small" />
                            )}
                            {plan.schedule && plan.schedule.length > 0 && (
                              <Chip 
                                label={`${plan.schedule.length} days`} 
                                size="small" 
                                variant="outlined"
                              />
                            )}
                          </Stack>
                          {plan.description && (
                            <Typography variant="body2" color="text.secondary">
                              {plan.description}
                            </Typography>
                          )}
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
                          <Button
                            size="small"
                            variant="outlined"
                            startIcon={<Edit />}
                            onClick={() => handleEditSchedule(plan)}
                          >
                            Edit Schedule
                          </Button>
                          <Button
                            size="small"
                            variant="contained"
                            startIcon={<Schedule />}
                            onClick={() => {
                              setSelectedPlan(plan);
                              const startDate = new Date();
                              handleAutoSchedule(plan, startDate);
                            }}
                          >
                            Auto-Schedule
                          </Button>
                          <IconButton
                            size="small"
                            onClick={() => handleDeletePlan(plan.id)}
                            color="error"
                          >
                            <Delete />
                          </IconButton>
                        </Stack>
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

        {/* Edit Schedule Dialog */}
        <Dialog
          open={editScheduleDialogOpen}
          onClose={() => setEditScheduleDialogOpen(false)}
          maxWidth="lg"
          fullWidth
        >
          <DialogTitle>
            Edit Schedule: {selectedPlan?.name}
            <Typography variant="caption" display="block" color="text.secondary">
              Define daily workouts with exercises, sets, and reps
            </Typography>
          </DialogTitle>
          <DialogContent>
            <Box sx={{ mt: 2 }}>
              <Button
                variant="outlined"
                startIcon={<Add />}
                onClick={handleAddDay}
                sx={{ mb: 2 }}
              >
                Add Day
              </Button>

              {selectedPlan && selectedPlan.schedule && selectedPlan.schedule.length > 0 ? (
                <TableContainer component={Paper}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Day</TableCell>
                        <TableCell>Type</TableCell>
                        <TableCell>Exercises</TableCell>
                        <TableCell>Notes</TableCell>
                        <TableCell>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {selectedPlan.schedule.map((day, index) => (
                        <TableRow key={index}>
                          <TableCell>{day.dayNumber}</TableCell>
                          <TableCell>
                            <Chip label={day.type} size="small" />
                          </TableCell>
                          <TableCell>
                            {day.exercises && day.exercises.length > 0 ? (
                              <Typography variant="caption">
                                {day.exercises.length} exercises
                              </Typography>
                            ) : (
                              <Typography variant="caption" color="text.secondary">
                                No exercises
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell>
                            <Typography variant="caption" noWrap sx={{ maxWidth: 200 }}>
                              {day.notes || '-'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <IconButton
                              size="small"
                              onClick={() => handleEditDay(index)}
                            >
                              <Edit />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Typography color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                  No days added yet. Click "Add Day" to start building your schedule.
                </Typography>
              )}
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEditScheduleDialogOpen(false)}>Close</Button>
          </DialogActions>
        </Dialog>

        {/* Edit Day Dialog */}
        <Dialog
          open={editingDayIndex !== null}
          onClose={() => setEditingDayIndex(null)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>Edit Day {daySchedule.dayNumber}</DialogTitle>
          <DialogContent>
            <Stack spacing={3} sx={{ mt: 2 }}>
              <FormControl fullWidth>
                <InputLabel>Workout Type</InputLabel>
                <Select
                  value={daySchedule.type}
                  onChange={(e) => setDaySchedule(prev => ({ ...prev, type: e.target.value }))}
                  label="Workout Type"
                >
                  <MenuItem value="full">Full Body</MenuItem>
                  <MenuItem value="upper">Upper Body</MenuItem>
                  <MenuItem value="lower">Lower Body</MenuItem>
                  <MenuItem value="cardio">Cardio</MenuItem>
                  <MenuItem value="plyo">Plyometrics</MenuItem>
                  <MenuItem value="yoga">Yoga</MenuItem>
                  <MenuItem value="rest">Rest</MenuItem>
                </Select>
              </FormControl>

              <Autocomplete
                options={validExercises}
                getOptionLabel={(option) => option['Exercise Name']}
                renderInput={(params) => (
                  <TextField {...params} label="Add Exercise" />
                )}
                onChange={(event, value) => {
                  if (value) handleAddExercise(value);
                }}
                value={null}
              />

              {daySchedule.exercises && daySchedule.exercises.length > 0 && (
                <Box>
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>
                    Exercises ({daySchedule.exercises.length})
                  </Typography>
                  <List>
                    {daySchedule.exercises.map((exercise, index) => (
                      <ListItem key={index} divider>
                        <ListItemText
                          primary={exercise.name}
                          secondary={`${exercise.sets} sets × ${exercise.reps} reps`}
                        />
                        <IconButton
                          edge="end"
                          onClick={() => {
                            const newExercises = daySchedule.exercises.filter((_, i) => i !== index);
                            setDaySchedule(prev => ({ ...prev, exercises: newExercises }));
                          }}
                        >
                          <Delete />
                        </IconButton>
                      </ListItem>
                    ))}
                  </List>
                </Box>
              )}

              <TextField
                label="Notes"
                fullWidth
                multiline
                rows={2}
                value={daySchedule.notes}
                onChange={(e) => setDaySchedule(prev => ({ ...prev, notes: e.target.value }))}
              />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEditingDayIndex(null)}>Cancel</Button>
            <Button onClick={handleSaveDay} variant="contained">
              Save Day
            </Button>
          </DialogActions>
        </Dialog>

        {/* Schedule Workout Dialog */}
        <Dialog
          open={scheduleWorkoutDialogOpen}
          onClose={() => setScheduleWorkoutDialogOpen(false)}
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
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setScheduleWorkoutDialogOpen(false)}>Cancel</Button>
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
          >
            View Progress & Calendar
          </Button>
        </Box>
      </motion.div>
    </LocalizationProvider>
  );
};

EnhancedWorkoutPlanBuilder.propTypes = {
  onNavigate: PropTypes.func,
};

export default EnhancedWorkoutPlanBuilder;
