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
  Paper,
  Slider,
  Snackbar,
} from '@mui/material';
import {
  NavigateNext as NextIcon,
  NavigateBefore as BackIcon,
  Check as CheckIcon,
} from '@mui/icons-material';
import { saveWorkoutPlan, setActivePlan, getWorkoutPlans } from '../../utils/storage';
import { generateScientificWorkout } from '../../utils/scientificWorkoutGenerator';

// Wizard steps - Simplified
const STEPS = [
  'Plan Setup',
  'Review & Confirm'
];

const FitnessPlanWizard = ({ open, onClose, onPlanCreated }) => {
  // Wizard state
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');

  // Plan configuration - Simplified
  const [planName, setPlanName] = useState('');
  const [daysPerWeek, setDaysPerWeek] = useState(3); // How many days user wants to work out
  const [workoutStructure, setWorkoutStructure] = useState('full-body'); // 'full-body', 'upper-lower', 'ppl'
  
  // Generated workouts (auto-generated, not editable)
  const [generatedPlan, setGeneratedPlan] = useState(null);
  
  // Exercise database cache
  const [exerciseDatabase, setExerciseDatabase] = useState(null);

  /**
   * Load exercise database on component mount
   */
  const loadExerciseDatabase = async () => {
    if (exerciseDatabase) return exerciseDatabase; // Return cached if already loaded
    
    try {
      const response = await fetch(`${import.meta.env.BASE_URL}data/exercises.json`);
      const exercisesData = await response.json();
      const exercises = exercisesData.exercises || exercisesData;
      setExerciseDatabase(exercises);
      return exercises;
    } catch (error) {
      console.error('Error loading exercise database:', error);
      throw error;
    }
  };

  /**
   * Get workout types based on structure selection
   */
  const getWorkoutTypes = () => {
    const upperLower = [];
    const ppl = [];
    const cycle = ['push', 'pull', 'legs'];
    
    switch (workoutStructure) {
      case 'full-body':
        // Full body every workout day
        return Array(daysPerWeek).fill('full');
      case 'upper-lower': {
        // Alternate upper/lower
        for (let i = 0; i < daysPerWeek; i++) {
          upperLower.push(i % 2 === 0 ? 'upper' : 'lower');
        }
        return upperLower;
      }
      case 'ppl': {
        // Push, Pull, Legs rotation
        for (let i = 0; i < daysPerWeek; i++) {
          ppl.push(cycle[i % 3]);
        }
        return ppl;
      }
      default:
        return Array(daysPerWeek).fill('full');
    }
  };

  /**
   * Validate step before proceeding
   */
  const validateStep = () => {
    switch (activeStep) {
      case 0: // Plan Setup
        if (!planName.trim()) {
          setError('Please enter a plan name');
          return false;
        }
        if (daysPerWeek < 1 || daysPerWeek > 7) {
          setError('Days per week must be between 1 and 7');
          return false;
        }
        break;
      
      default:
        break;
    }
    
    setError(null);
    return true;
  };

  /**
   * Generate plan based on user selections
   */
  const generatePlanFromSelections = async () => {
    try {
      setLoading(true);
      
      // Load exercise database if not already cached
      const exercises = await loadExerciseDatabase();
      
      const workoutTypes = getWorkoutTypes();
      const workouts = [];
      
      // Generate a workout for each training day
      for (let i = 0; i < workoutTypes.length; i++) {
        const workoutType = workoutTypes[i];
        const workout = await generateScientificWorkout({
          type: workoutType,
          experienceLevel: 'intermediate',
          goal: 'hypertrophy',
          isDeload: false,
          exercises
        });
        
        workouts.push({
          id: `workout_${i}`,
          type: 'strength',
          workoutType,
          name: `Day ${i + 1} - ${workoutType.charAt(0).toUpperCase() + workoutType.slice(1)}`,
          exercises: workout.exercises,
        });
      }
      
      // Calculate rest days (7 - training days)
      const restDays = 7 - daysPerWeek;
      
      // Add rest day placeholders
      for (let i = 0; i < restDays; i++) {
        workouts.push({
          id: `rest_${i}`,
          type: 'rest',
          name: `Rest Day ${i + 1}`,
          exercises: null,
          instructions: 'Rest and recover'
        });
      }
      
      const plan = {
        workouts,
        daysPerWeek,
        workoutStructure,
        restDays
      };
      
      setGeneratedPlan(plan);
      setLoading(false);
      return plan;
    } catch (err) {
      console.error('Error generating plan:', err);
      setError('Failed to generate plan. Please try again.');
      setLoading(false);
      return null;
    }
  };

  /**
   * Handle next step
   */
  const handleNext = async () => {
    if (!validateStep()) {
      return;
    }
    
    // Generate plan when moving from setup to review
    if (activeStep === 0) {
      const plan = await generatePlanFromSelections();
      if (!plan) {
        return; // Error occurred, stay on current step
      }
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

      // Deactivate all existing plans first
      const existingPlans = await getWorkoutPlans();
      for (const existingPlan of existingPlans) {
        if (existingPlan.isActive) {
          existingPlan.isActive = false;
          await saveWorkoutPlan(existingPlan);
        }
      }

      // Generate the complete plan structure
      const plan = await generateCompletePlan();
      
      // Save the plan with isActive: true
      await saveWorkoutPlan(plan);
      
      // Set as active plan
      await setActivePlan(plan.id);

      // Show success message
      setSuccessMessage('Plan created successfully! Redirecting to calendar...');

      // Notify parent after a short delay
      setTimeout(() => {
        if (onPlanCreated) {
          onPlanCreated(plan);
        }
        handleClose();
      }, 1500);
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
    if (!generatedPlan) {
      throw new Error('Plan not generated yet');
    }

    const sessions = [];
    const startDate = new Date();
    const duration = 28; // Default to 4 weeks (28 days)
    
    // Generate sessions for 4 weeks
    for (let week = 0; week < 4; week++) {
      const isDeloadWeek = week === 3; // Last week is deload
      
      // Generate 7 days for this week
      for (let day = 0; day < 7; day++) {
        const dayNumber = week * 7 + day;
        const sessionDate = new Date(startDate);
        sessionDate.setDate(sessionDate.getDate() + dayNumber);
        
        // Assign workout from the weekly template
        const workoutIndex = day % generatedPlan.workouts.length;
        const workout = generatedPlan.workouts[workoutIndex];
        
        const session = {
          id: `session_${Date.now()}_${dayNumber}`,
          date: sessionDate.getTime(),
          type: workout.type,
          status: 'planned',
          notes: workout.instructions || '',
          completedAt: null,
          sessionData: null,
          weekNumber: week + 1,
          isDeload: isDeloadWeek,
          blockNumber: 1
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

    return {
      id: `plan_${Date.now()}`,
      name: planName.trim(),
      goal: 'fitness',
      experienceLevel: 'intermediate',
      daysPerWeek: daysPerWeek,
      duration: duration,
      startDate: startDate.toISOString(),
      sessions,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      isActive: true,
      planType: 'fitness',
      workoutStructure: workoutStructure,
      // Metadata
      metadata: {
        workoutStructure,
        daysPerWeek,
        restDays: generatedPlan.restDays
      }
    };
  };

  /**
   * Reset wizard state
   */
  const resetWizard = () => {
    setActiveStep(0);
    setPlanName('');
    setDaysPerWeek(3);
    setWorkoutStructure('full-body');
    setGeneratedPlan(null);
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
        return renderPlanSetupStep();
      case 1:
        return renderReviewStep();
      default:
        return null;
    }
  };

  /**
   * Step 1: Plan Setup (Simplified)
   */
  const renderPlanSetupStep = () => (
    <Box sx={{ mt: 2 }}>
      <TextField
        fullWidth
        label="Plan Name"
        value={planName}
        onChange={(e) => setPlanName(e.target.value)}
        placeholder="e.g., My Workout Plan"
        margin="normal"
        required
      />
      
      <FormControl fullWidth margin="normal" sx={{ mt: 3 }}>
        <FormLabel sx={{ mb: 2, fontSize: '1rem', fontWeight: 600 }}>
          How many days per week do you want to work out?
        </FormLabel>
        <Box sx={{ px: 2 }}>
          <Slider
            value={daysPerWeek}
            onChange={(e, val) => setDaysPerWeek(val)}
            min={1}
            max={7}
            marks={[
              { value: 1, label: '1' },
              { value: 2, label: '2' },
              { value: 3, label: '3' },
              { value: 4, label: '4' },
              { value: 5, label: '5' },
              { value: 6, label: '6' },
              { value: 7, label: '7' },
            ]}
            valueLabelDisplay="on"
            sx={{
              '& .MuiSlider-markLabel': {
                fontSize: '0.875rem',
              },
            }}
          />
        </Box>
        <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block', textAlign: 'center' }}>
          You&apos;ll have {7 - daysPerWeek} rest day{7 - daysPerWeek !== 1 ? 's' : ''} per week
        </Typography>
      </FormControl>
      
      <FormControl fullWidth margin="normal" sx={{ mt: 4 }}>
        <FormLabel sx={{ mb: 2, fontSize: '1rem', fontWeight: 600 }}>
          Choose your workout structure:
        </FormLabel>
        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <Card
              variant={workoutStructure === 'full-body' ? 'elevation' : 'outlined'}
              sx={{
                cursor: 'pointer',
                bgcolor: workoutStructure === 'full-body' ? 'primary.main' : 'background.paper',
                color: workoutStructure === 'full-body' ? 'primary.contrastText' : 'text.primary',
                '&:hover': {
                  bgcolor: workoutStructure === 'full-body' ? 'primary.dark' : 'action.hover',
                },
                height: '100%',
              }}
              onClick={() => setWorkoutStructure('full-body')}
            >
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Full Body
                </Typography>
                <Typography variant="body2">
                  Train all major muscle groups each workout. Great for beginners and those with limited time.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Card
              variant={workoutStructure === 'upper-lower' ? 'elevation' : 'outlined'}
              sx={{
                cursor: 'pointer',
                bgcolor: workoutStructure === 'upper-lower' ? 'primary.main' : 'background.paper',
                color: workoutStructure === 'upper-lower' ? 'primary.contrastText' : 'text.primary',
                '&:hover': {
                  bgcolor: workoutStructure === 'upper-lower' ? 'primary.dark' : 'action.hover',
                },
                height: '100%',
              }}
              onClick={() => setWorkoutStructure('upper-lower')}
            >
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Upper/Lower Split
                </Typography>
                <Typography variant="body2">
                  Alternate between upper body and lower body workouts. Balanced approach for strength and muscle building.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Card
              variant={workoutStructure === 'ppl' ? 'elevation' : 'outlined'}
              sx={{
                cursor: 'pointer',
                bgcolor: workoutStructure === 'ppl' ? 'primary.main' : 'background.paper',
                color: workoutStructure === 'ppl' ? 'primary.contrastText' : 'text.primary',
                '&:hover': {
                  bgcolor: workoutStructure === 'ppl' ? 'primary.dark' : 'action.hover',
                },
                height: '100%',
              }}
              onClick={() => setWorkoutStructure('ppl')}
            >
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Push-Pull-Legs
                </Typography>
                <Typography variant="body2">
                  Cycle through pushing movements, pulling movements, and legs. Ideal for intermediate to advanced lifters.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </FormControl>
      
      <Alert severity="info" sx={{ mt: 3 }}>
        <Typography variant="body2">
          Your plan will be 4 weeks long with a deload week at the end for recovery.
          Based on your selections, we&apos;ll automatically generate appropriate workouts for each day.
        </Typography>
      </Alert>
    </Box>
  );

  /**
   * Step 2: Review (Simplified)
   */
  const renderReviewStep = () => {
    if (!generatedPlan) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      );
    }

    const workoutDays = generatedPlan.workouts.filter(w => w.type === 'strength');
    const structureName = 
      workoutStructure === 'full-body' ? 'Full Body' :
      workoutStructure === 'upper-lower' ? 'Upper/Lower Split' :
      'Push-Pull-Legs';

    return (
      <Box sx={{ mt: 2 }}>
        <Typography variant="h6" gutterBottom>
          Review Your Fitness Plan
        </Typography>
        
        <Paper sx={{ p: 2, mb: 2 }}>
          <Typography variant="subtitle1" gutterBottom>
            <strong>Plan Name:</strong> {planName}
          </Typography>
          <Typography variant="body2" gutterBottom>
            <strong>Duration:</strong> 4 weeks (with deload week)
          </Typography>
          <Typography variant="body2" gutterBottom>
            <strong>Workout Days:</strong> {daysPerWeek} days per week
          </Typography>
          <Typography variant="body2" gutterBottom>
            <strong>Rest Days:</strong> {generatedPlan.restDays} days per week
          </Typography>
          <Typography variant="body2" gutterBottom>
            <strong>Workout Structure:</strong> {structureName}
          </Typography>
        </Paper>
        
        <Paper sx={{ p: 2, mb: 2 }}>
          <Typography variant="subtitle1" gutterBottom>
            <strong>Weekly Workout Schedule:</strong>
          </Typography>
          {workoutDays.map((workout) => (
            <Typography key={workout.id} variant="body2" sx={{ mb: 0.5 }}>
              • {workout.name}: {workout.exercises?.length || 0} exercises
            </Typography>
          ))}
          {generatedPlan.restDays > 0 && (
            <Typography variant="body2" sx={{ mt: 1, color: 'text.secondary' }}>
              • {generatedPlan.restDays} rest day{generatedPlan.restDays !== 1 ? 's' : ''}
            </Typography>
          )}
        </Paper>
        
        <Alert severity="success" sx={{ mt: 2 }}>
          <Typography variant="body2">
            <strong>Ready to start!</strong> Your plan will be activated and visible on your calendar.
            Click &quot;Create Plan&quot; to begin your fitness journey.
          </Typography>
        </Alert>
      </Box>
    );
  };

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
      
      {/* Success Snackbar */}
      <Snackbar
        open={!!successMessage}
        autoHideDuration={6000}
        onClose={() => setSuccessMessage('')}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="success" sx={{ width: '100%' }}>
          {successMessage}
        </Alert>
      </Snackbar>
    </Dialog>
  );
};

FitnessPlanWizard.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onPlanCreated: PropTypes.func,
};

export default FitnessPlanWizard;
