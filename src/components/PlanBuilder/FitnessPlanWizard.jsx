/**
 * FitnessPlanWizard - Comprehensive fitness plan creation wizard
 * 
 * Implements science-based workout planning with:
 * - 4, 8, or 12 week duration
 * - 4-week blocks with 3 heavy weeks + 1 deload week
 * - Weekly structure: strength, cardio, active recovery, rest days
 * - Exercise customization with weights and reps
 * - Integration with calendar and workout execution
 */

import { useState } from 'react';
import PropTypes from 'prop-types';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  FormLabel,
  Box,
  CircularProgress,
  Alert,
  Typography,
  Stepper,
  Step,
  StepLabel,
  Grid,
  Card,
  CardContent,
  IconButton,
  Chip,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  Slider,
  Select,
  MenuItem,
  InputLabel,
  FormControlLabel,
  Checkbox,
  Tooltip,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Info as InfoIcon,
  NavigateNext as NextIcon,
  NavigateBefore as BackIcon,
  Check as CheckIcon,
  FitnessCenter as StrengthIcon,
  DirectionsRun as CardioIcon,
  SelfImprovement as RecoveryIcon,
  Hotel as RestIcon,
} from '@mui/icons-material';
import { saveWorkoutPlan, setActivePlan } from '../../utils/storage';
import { generateScientificWorkout } from '../../utils/scientificWorkoutGenerator';

// Wizard steps
const STEPS = [
  'Plan Duration',
  'Weekly Structure',
  'Workout Design',
  'Review & Confirm'
];

const FitnessPlanWizard = ({ open, onClose, onPlanCreated }) => {
  // Wizard state
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Plan configuration
  const [planName, setPlanName] = useState('');
  const [duration, setDuration] = useState(4); // 4, 8, or 12 weeks
  
  // Weekly structure
  const [strengthDays, setStrengthDays] = useState(3);
  const [cardioDays, setCardioDays] = useState(1);
  const [activeRecoveryDays, setActiveRecoveryDays] = useState(1);
  const [restDays, setRestDays] = useState(2);
  
  // Workout customization
  const [workouts, setWorkouts] = useState([]);
  const [selectedWorkoutIndex, setSelectedWorkoutIndex] = useState(0);

  /**
   * Calculate total days per week
   */
  const totalDaysPerWeek = strengthDays + cardioDays + activeRecoveryDays + restDays;

  /**
   * Validate step before proceeding
   */
  const validateStep = () => {
    switch (activeStep) {
      case 0: // Plan Duration
        if (!planName.trim()) {
          setError('Please enter a plan name');
          return false;
        }
        if (![4, 8, 12].includes(duration)) {
          setError('Duration must be 4, 8, or 12 weeks');
          return false;
        }
        break;
      
      case 1: // Weekly Structure
        if (totalDaysPerWeek !== 7) {
          setError('Total days must equal 7 days per week');
          return false;
        }
        break;
      
      case 2: // Workout Design
        // Validation happens during workout editing
        break;
      
      default:
        break;
    }
    
    setError(null);
    return true;
  };

  /**
   * Generate initial workouts based on weekly structure
   */
  const generateInitialWorkouts = async () => {
    try {
      setLoading(true);
      const newWorkouts = [];
      
      // Generate unique strength workouts based on how many days per week
      // For example: if 3 strength days, generate Upper, Lower, Full Body
      const strengthWorkoutTypes = getStrengthWorkoutTypes(strengthDays);
      
      for (let i = 0; i < strengthDays; i++) {
        const workoutType = strengthWorkoutTypes[i];
        const workout = await generateScientificWorkout({
          type: workoutType,
          experienceLevel: 'intermediate',
          goal: 'hypertrophy',
          isDeload: false
        });
        
        newWorkouts.push({
          id: `strength_${i}`,
          type: 'strength',
          workoutType,
          name: `Strength Day ${i + 1} - ${workoutType}`,
          exercises: workout.exercises,
          editable: true
        });
      }
      
      // Add cardio placeholders
      for (let i = 0; i < cardioDays; i++) {
        newWorkouts.push({
          id: `cardio_${i}`,
          type: 'cardio',
          name: `Cardio Day ${i + 1}`,
          exercises: null,
          editable: false,
          instructions: 'Mark as complete when done'
        });
      }
      
      // Add active recovery placeholders (Restorative Yoga)
      for (let i = 0; i < activeRecoveryDays; i++) {
        newWorkouts.push({
          id: `recovery_${i}`,
          type: 'active_recovery',
          name: `Active Recovery Day ${i + 1} - Restorative Yoga`,
          exercises: null,
          editable: false,
          instructions: 'Mark as complete when done'
        });
      }
      
      // Add rest day placeholders
      for (let i = 0; i < restDays; i++) {
        newWorkouts.push({
          id: `rest_${i}`,
          type: 'rest',
          name: `Rest Day ${i + 1}`,
          exercises: null,
          editable: false,
          instructions: 'Rest and recover'
        });
      }
      
      setWorkouts(newWorkouts);
      setLoading(false);
    } catch (err) {
      console.error('Error generating initial workouts:', err);
      setError('Failed to generate workouts. Please try again.');
      setLoading(false);
    }
  };

  /**
   * Determine strength workout types based on days per week
   */
  const getStrengthWorkoutTypes = (days) => {
    switch (days) {
      case 1:
        return ['full'];
      case 2:
        return ['upper', 'lower'];
      case 3:
        return ['upper', 'lower', 'full'];
      case 4:
        return ['upper', 'lower', 'upper', 'lower'];
      case 5:
        return ['upper', 'lower', 'push', 'pull', 'legs'];
      case 6:
        return ['push', 'pull', 'legs', 'push', 'pull', 'legs'];
      default:
        return ['full'];
    }
  };

  /**
   * Handle next step
   */
  const handleNext = async () => {
    if (!validateStep()) {
      return;
    }
    
    // Generate workouts when moving from weekly structure to workout design
    if (activeStep === 1) {
      await generateInitialWorkouts();
    }
    
    setActiveStep((prev) => prev + 1);
  };

  /**
   * Handle back step
   */
  const handleBack = () => {
    setError(null);
    setActiveStep((prev) => prev - 1);
  };

  /**
   * Create the fitness plan
   */
  const handleCreatePlan = async () => {
    try {
      setLoading(true);
      setError(null);

      // Generate the complete plan structure
      const plan = await generateCompletePlan();
      
      // Save the plan
      await saveWorkoutPlan(plan);
      
      // Auto-activate the plan
      await setActivePlan(plan.id);

      // Notify parent
      if (onPlanCreated) {
        onPlanCreated(plan);
      }

      handleClose();
    } catch (err) {
      console.error('Error creating fitness plan:', err);
      setError(err.message || 'Failed to create plan. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Generate complete plan with all sessions
   */
  const generateCompletePlan = async () => {
    const totalWeeks = duration;
    const sessions = [];
    const startDate = new Date();
    
    // Calculate number of 4-week blocks
    const blocks = Math.ceil(totalWeeks / 4);
    
    for (let block = 0; block < blocks; block++) {
      const weeksInBlock = Math.min(4, totalWeeks - block * 4);
      
      // Generate sessions for this block (3 heavy weeks + 1 deload)
      for (let week = 0; week < weeksInBlock; week++) {
        const isDeloadWeek = week === 3 && weeksInBlock === 4;
        const weekNumber = block * 4 + week;
        
        // Generate 7 days for this week
        for (let day = 0; day < 7; day++) {
          const dayNumber = weekNumber * 7 + day;
          const sessionDate = new Date(startDate);
          sessionDate.setDate(sessionDate.getDate() + dayNumber);
          
          // Assign workout from the weekly template
          const workoutIndex = day % workouts.length;
          const workout = workouts[workoutIndex];
          
          const session = {
            id: `session_${Date.now()}_${dayNumber}`,
            date: sessionDate.getTime(),
            type: workout.type,
            status: 'planned',
            notes: workout.instructions || '',
            completedAt: null,
            sessionData: null,
            weekNumber: weekNumber + 1,
            isDeload: isDeloadWeek,
            blockNumber: block + 1
          };
          
          // Add exercises for strength workouts
          if (workout.exercises && workout.exercises.length > 0) {
            session.exercises = workout.exercises.map(ex => {
              const baseExercise = {
                'Exercise Name': ex.name || ex['Exercise Name'],
                'Primary Muscle': ex['Primary Muscle'],
                name: ex.name || ex['Exercise Name'],
                sets: isDeloadWeek ? Math.ceil(ex.sets * 0.5) : ex.sets,
                reps: ex.reps,
                restSeconds: ex.restSeconds || 90,
                weight: ex.weight || '',
                notes: ex.notes || '',
                supersetGroup: ex.supersetGroup || null
              };
              
              // Apply deload weight reduction if deload week
              if (isDeloadWeek && ex.weight) {
                const numericWeight = parseFloat(ex.weight);
                if (!isNaN(numericWeight)) {
                  baseExercise.weight = (numericWeight * 0.6).toString();
                }
              }
              
              return baseExercise;
            });
          } else {
            session.exercises = null;
          }
          
          sessions.push(session);
        }
      }
    }

    return {
      id: `plan_${Date.now()}`,
      name: planName.trim(),
      goal: 'fitness',
      experienceLevel: 'intermediate',
      daysPerWeek: totalDaysPerWeek,
      duration: duration * 7, // Convert weeks to days
      startDate: startDate.toISOString(),
      sessions,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      isActive: true,
      planType: 'fitness',
      strengthDays,
      cardioDays,
      activeRecoveryDays,
      restDays
    };
  };

  /**
   * Reset wizard state
   */
  const resetWizard = () => {
    setActiveStep(0);
    setPlanName('');
    setDuration(4);
    setStrengthDays(3);
    setCardioDays(1);
    setActiveRecoveryDays(1);
    setRestDays(2);
    setWorkouts([]);
    setSelectedWorkoutIndex(0);
    setError(null);
  };

  /**
   * Handle dialog close
   */
  const handleClose = () => {
    if (!loading) {
      resetWizard();
      onClose();
    }
  };

  /**
   * Render step content
   */
  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return renderDurationStep();
      case 1:
        return renderWeeklyStructureStep();
      case 2:
        return renderWorkoutDesignStep();
      case 3:
        return renderReviewStep();
      default:
        return null;
    }
  };

  /**
   * Step 1: Plan Duration
   */
  const renderDurationStep = () => (
    <Box sx={{ mt: 2 }}>
      <TextField
        fullWidth
        label="Plan Name"
        value={planName}
        onChange={(e) => setPlanName(e.target.value)}
        placeholder="e.g., Spring 2025 Fitness Plan"
        margin="normal"
        required
      />
      
      <FormControl fullWidth margin="normal">
        <FormLabel>Plan Duration</FormLabel>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Plans are structured in 4-week blocks (3 heavy weeks + 1 deload week)
        </Typography>
        <Box sx={{ mt: 2 }}>
          <Grid container spacing={2}>
            {[4, 8, 12].map((weeks) => (
              <Grid item xs={4} key={weeks}>
                <Card
                  variant={duration === weeks ? 'elevation' : 'outlined'}
                  sx={{
                    cursor: 'pointer',
                    bgcolor: duration === weeks ? 'primary.main' : 'background.paper',
                    color: duration === weeks ? 'primary.contrastText' : 'text.primary',
                    '&:hover': {
                      bgcolor: duration === weeks ? 'primary.dark' : 'action.hover',
                    },
                  }}
                  onClick={() => setDuration(weeks)}
                >
                  <CardContent sx={{ textAlign: 'center' }}>
                    <Typography variant="h4">{weeks}</Typography>
                    <Typography variant="body2">weeks</Typography>
                    <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                      {weeks / 4} block{weeks > 4 ? 's' : ''}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      </FormControl>
      
      <Alert severity="info" sx={{ mt: 2 }}>
        <Typography variant="body2">
          <strong>Science-based periodization:</strong> Each 4-week block has 3 progressive training weeks 
          followed by a deload week (reduced volume and intensity) to optimize recovery and prevent overtraining.
        </Typography>
      </Alert>
    </Box>
  );

  /**
   * Step 2: Weekly Structure
   */
  const renderWeeklyStructureStep = () => (
    <Box sx={{ mt: 2 }}>
      <Typography variant="h6" gutterBottom>
        Design Your Training Week
      </Typography>
      <Typography variant="body2" color="text.secondary" gutterBottom>
        Allocate how many days per week to each activity type (must total 7 days)
      </Typography>
      
      <Grid container spacing={3} sx={{ mt: 2 }}>
        {/* Strength Training */}
        <Grid item xs={12} sm={6}>
          <Paper sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <StrengthIcon color="primary" sx={{ mr: 1 }} />
              <Typography variant="subtitle1">Strength Training</Typography>
            </Box>
            <Slider
              value={strengthDays}
              onChange={(e, val) => setStrengthDays(val)}
              min={0}
              max={6}
              marks
              valueLabelDisplay="on"
            />
            <Typography variant="caption" color="text.secondary">
              Resistance training with progressive overload
            </Typography>
          </Paper>
        </Grid>
        
        {/* Cardio */}
        <Grid item xs={12} sm={6}>
          <Paper sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <CardioIcon color="secondary" sx={{ mr: 1 }} />
              <Typography variant="subtitle1">Cardio</Typography>
            </Box>
            <Slider
              value={cardioDays}
              onChange={(e, val) => setCardioDays(val)}
              min={0}
              max={6}
              marks
              valueLabelDisplay="on"
            />
            <Typography variant="caption" color="text.secondary">
              Self-paced cardiovascular exercise
            </Typography>
          </Paper>
        </Grid>
        
        {/* Active Recovery */}
        <Grid item xs={12} sm={6}>
          <Paper sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <RecoveryIcon color="info" sx={{ mr: 1 }} />
              <Typography variant="subtitle1">Active Recovery</Typography>
            </Box>
            <Slider
              value={activeRecoveryDays}
              onChange={(e, val) => setActiveRecoveryDays(val)}
              min={0}
              max={6}
              marks
              valueLabelDisplay="on"
            />
            <Typography variant="caption" color="text.secondary">
              Restorative Yoga sessions
            </Typography>
          </Paper>
        </Grid>
        
        {/* Rest Days */}
        <Grid item xs={12} sm={6}>
          <Paper sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <RestIcon sx={{ mr: 1 }} />
              <Typography variant="subtitle1">Rest Days</Typography>
            </Box>
            <Slider
              value={restDays}
              onChange={(e, val) => setRestDays(val)}
              min={0}
              max={6}
              marks
              valueLabelDisplay="on"
            />
            <Typography variant="caption" color="text.secondary">
              Complete rest and recovery
            </Typography>
          </Paper>
        </Grid>
      </Grid>
      
      {/* Total validation */}
      <Box sx={{ mt: 3 }}>
        <Paper 
          sx={{ 
            p: 2, 
            bgcolor: totalDaysPerWeek === 7 ? 'success.light' : 'error.light',
            color: totalDaysPerWeek === 7 ? 'success.contrastText' : 'error.contrastText'
          }}
        >
          <Typography variant="h6" align="center">
            Total: {totalDaysPerWeek} / 7 days
          </Typography>
          {totalDaysPerWeek !== 7 && (
            <Typography variant="body2" align="center">
              Adjust sliders to total exactly 7 days
            </Typography>
          )}
        </Paper>
      </Box>
    </Box>
  );

  /**
   * Step 3: Workout Design
   */
  const renderWorkoutDesignStep = () => (
    <Box sx={{ mt: 2 }}>
      <Typography variant="h6" gutterBottom>
        Customize Your Workouts
      </Typography>
      <Typography variant="body2" color="text.secondary" gutterBottom>
        Review and modify exercises for each workout. These will repeat throughout the plan.
      </Typography>
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Box sx={{ mt: 2 }}>
          {/* Workout selector */}
          <Paper sx={{ p: 2, mb: 2 }}>
            <FormControl fullWidth>
              <InputLabel>Select Workout to Edit</InputLabel>
              <Select
                value={selectedWorkoutIndex}
                onChange={(e) => setSelectedWorkoutIndex(e.target.value)}
                label="Select Workout to Edit"
              >
                {workouts.map((workout, index) => (
                  <MenuItem key={workout.id} value={index}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      {workout.type === 'strength' && <StrengthIcon sx={{ mr: 1 }} />}
                      {workout.type === 'cardio' && <CardioIcon sx={{ mr: 1 }} />}
                      {workout.type === 'active_recovery' && <RecoveryIcon sx={{ mr: 1 }} />}
                      {workout.type === 'rest' && <RestIcon sx={{ mr: 1 }} />}
                      {workout.name}
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Paper>
          
          {/* Workout details */}
          {workouts[selectedWorkoutIndex] && (
            <WorkoutEditor
              workout={workouts[selectedWorkoutIndex]}
              onUpdate={(updatedWorkout) => {
                const newWorkouts = [...workouts];
                newWorkouts[selectedWorkoutIndex] = updatedWorkout;
                setWorkouts(newWorkouts);
              }}
            />
          )}
        </Box>
      )}
    </Box>
  );

  /**
   * Step 4: Review
   */
  const renderReviewStep = () => (
    <Box sx={{ mt: 2 }}>
      <Typography variant="h6" gutterBottom>
        Review Your Fitness Plan
      </Typography>
      
      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="subtitle1" gutterBottom>
          <strong>Plan Name:</strong> {planName}
        </Typography>
        <Typography variant="body2" gutterBottom>
          <strong>Duration:</strong> {duration} weeks ({duration / 4} block{duration > 4 ? 's' : ''})
        </Typography>
        <Divider sx={{ my: 1 }} />
        <Typography variant="body2" gutterBottom>
          <strong>Weekly Structure:</strong>
        </Typography>
        <Box sx={{ pl: 2 }}>
          <Typography variant="body2">• Strength Training: {strengthDays} days/week</Typography>
          <Typography variant="body2">• Cardio: {cardioDays} days/week</Typography>
          <Typography variant="body2">• Active Recovery: {activeRecoveryDays} days/week</Typography>
          <Typography variant="body2">• Rest: {restDays} days/week</Typography>
        </Box>
      </Paper>
      
      <Paper sx={{ p: 2 }}>
        <Typography variant="subtitle1" gutterBottom>
          <strong>Workouts Configured:</strong> {workouts.filter(w => w.type === 'strength').length} strength workouts
        </Typography>
        {workouts.filter(w => w.type === 'strength').map((workout) => (
          <Typography key={workout.id} variant="body2">
            • {workout.name}: {workout.exercises?.length || 0} exercises
          </Typography>
        ))}
      </Paper>
      
      <Alert severity="success" sx={{ mt: 2 }}>
        Ready to create your plan! Click "Create Plan" to begin your fitness journey.
      </Alert>
    </Box>
  );

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      disableEscapeKeyDown={loading}
    >
      <DialogTitle>
        Create Fitness Plan
      </DialogTitle>
      
      <DialogContent>
        <Stepper activeStep={activeStep} sx={{ mb: 3 }}>
          {STEPS.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
        
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}
        
        {renderStepContent()}
      </DialogContent>
      
      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          Cancel
        </Button>
        <Box sx={{ flex: '1 1 auto' }} />
        {activeStep > 0 && (
          <Button onClick={handleBack} disabled={loading} startIcon={<BackIcon />}>
            Back
          </Button>
        )}
        {activeStep < STEPS.length - 1 ? (
          <Button
            variant="contained"
            onClick={handleNext}
            disabled={loading}
            endIcon={<NextIcon />}
          >
            Next
          </Button>
        ) : (
          <Button
            variant="contained"
            onClick={handleCreatePlan}
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : <CheckIcon />}
          >
            {loading ? 'Creating...' : 'Create Plan'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

/**
 * WorkoutEditor - Component to edit individual workout details
 */
const WorkoutEditor = ({ workout, onUpdate }) => {
  if (!workout.editable || !workout.exercises) {
    return (
      <Paper sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="body1" color="text.secondary">
          {workout.instructions || 'This workout type does not require exercise planning'}
        </Typography>
      </Paper>
    );
  }

  const handleExerciseUpdate = (index, field, value) => {
    const updatedExercises = [...workout.exercises];
    updatedExercises[index] = {
      ...updatedExercises[index],
      [field]: value
    };
    onUpdate({
      ...workout,
      exercises: updatedExercises
    });
  };

  return (
    <Paper sx={{ p: 2 }}>
      <List>
        {workout.exercises.map((exercise) => (
          <div key={exercise.id || exercise['Exercise Name']}>
            <ListItem>
              <ListItemText
                primary={exercise.name || exercise['Exercise Name']}
                secondary={
                  <Box sx={{ mt: 1 }}>
                    <Grid container spacing={2}>
                      <Grid item xs={4}>
                        <TextField
                          size="small"
                          label="Sets"
                          type="number"
                          value={exercise.sets}
                          onChange={(e) => handleExerciseUpdate(workout.exercises.indexOf(exercise), 'sets', parseInt(e.target.value, 10))}
                          fullWidth
                        />
                      </Grid>
                      <Grid item xs={4}>
                        <TextField
                          size="small"
                          label="Reps"
                          type="number"
                          value={exercise.reps}
                          onChange={(e) => handleExerciseUpdate(workout.exercises.indexOf(exercise), 'reps', parseInt(e.target.value, 10))}
                          fullWidth
                        />
                      </Grid>
                      <Grid item xs={4}>
                        <TextField
                          size="small"
                          label="Weight (optional)"
                          placeholder="e.g., 135"
                          value={exercise.weight || ''}
                          onChange={(e) => handleExerciseUpdate(workout.exercises.indexOf(exercise), 'weight', e.target.value)}
                          fullWidth
                        />
                      </Grid>
                    </Grid>
                  </Box>
                }
              />
            </ListItem>
            {workout.exercises.indexOf(exercise) < workout.exercises.length - 1 && <Divider />}
          </div>
        ))}
      </List>
    </Paper>
  );
};

WorkoutEditor.propTypes = {
  workout: PropTypes.object.isRequired,
  onUpdate: PropTypes.func.isRequired,
};

FitnessPlanWizard.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onPlanCreated: PropTypes.func,
};

export default FitnessPlanWizard;
