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
  Grid,
  Card,
  CardContent,
  Slider,
  Snackbar,
} from '@mui/material';
import {
  Check as CheckIcon,
} from '@mui/icons-material';
import { saveWorkoutPlan, setActivePlan, getWorkoutPlans } from '../../utils/storage';
import { generateScientificWorkout } from '../../utils/scientificWorkoutGenerator';

const FitnessPlanWizard = ({ open, onClose, onPlanCreated }) => {
  // Wizard state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');

  // Plan configuration - One-page simplified
  const [planName, setPlanName] = useState('');
  const [planLength, setPlanLength] = useState(4); // 4, 8, or 12 weeks
  const [strengthDaysPerWeek, setStrengthDaysPerWeek] = useState(3); // Strength training frequency
  const [workoutStructure, setWorkoutStructure] = useState('full-body'); // 'full-body', 'upper-lower', 'ppl'
  
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
   * Get workout types based on structure selection for a week
   */
  const getWeeklyWorkoutTypes = () => {
    const upperLower = [];
    const ppl = [];
    const cycle = ['push', 'pull', 'legs'];
    
    switch (workoutStructure) {
      case 'full-body':
        // Full body every strength day
        return Array(strengthDaysPerWeek).fill('full');
      case 'upper-lower': {
        // Alternate upper/lower
        for (let i = 0; i < strengthDaysPerWeek; i++) {
          upperLower.push(i % 2 === 0 ? 'upper' : 'lower');
        }
        return upperLower;
      }
      case 'ppl': {
        // Push, Pull, Legs rotation
        for (let i = 0; i < strengthDaysPerWeek; i++) {
          ppl.push(cycle[i % 3]);
        }
        return ppl;
      }
      default:
        return Array(strengthDaysPerWeek).fill('full');
    }
  };

  /**
   * Validate form before creating plan
   */
  const validateForm = () => {
    if (!planName.trim()) {
      setError('Please enter a plan name');
      return false;
    }
    if (strengthDaysPerWeek < 1 || strengthDaysPerWeek > 6) {
      setError('Strength training days must be between 1 and 6');
      return false;
    }
    
    setError(null);
    return true;
  };

  /**
   * Generate plan based on user selections
   * Creates daily workouts with yoga and cardio on all days
   * Strength training only on selected days
   * D-load weeks (every 4th week) allow true rest days
   */
  const generatePlanFromSelections = async () => {
    try {
      setLoading(true);
      
      // Load exercise database if not already cached
      const exercises = await loadExerciseDatabase();
      
      const workoutTypes = getWeeklyWorkoutTypes();
      const strengthWorkouts = [];
      
      // Generate strength workouts for the week template
      for (let i = 0; i < workoutTypes.length; i++) {
        const workoutType = workoutTypes[i];
        const workout = await generateScientificWorkout({
          type: workoutType,
          experienceLevel: 'intermediate',
          goal: 'hypertrophy',
          isDeload: false,
          exercises
        });
        
        strengthWorkouts.push({
          id: `strength_${i}`,
          type: 'strength',
          workoutType,
          name: `${workoutType.charAt(0).toUpperCase() + workoutType.slice(1)} Strength`,
          exercises: workout.exercises,
        });
      }
      
      setLoading(false);
      return { strengthWorkouts };
    } catch (err) {
      console.error('Error generating plan:', err);
      setError('Failed to generate plan. Please try again.');
      setLoading(false);
      return null;
    }
  };

  /**
   * Create the fitness plan directly (one-page wizard)
   */
  const handleCreatePlan = async () => {
    if (!validateForm()) {
      return;
    }

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
   * Plans every single day with yoga and cardio on all days
   * Strength training on specified days
   * D-load weeks (every 4th week) allow true rest days
   * Weeks start on Sunday and end on Saturday
   */
  const generateCompletePlan = async () => {
    // Generate strength workouts
    const planData = await generatePlanFromSelections();
    if (!planData) {
      throw new Error('Plan not generated yet');
    }

    const sessions = [];
    
    // Calculate the next Sunday to start the plan
    const today = new Date();
    const startDate = new Date(today);
    
    // Find next Sunday (or today if it's Sunday)
    const dayOfWeek = startDate.getDay(); // 0 = Sunday, 1 = Monday, etc.
    if (dayOfWeek !== 0) {
      // Move to next Sunday
      startDate.setDate(startDate.getDate() + (7 - dayOfWeek));
    }
    startDate.setHours(0, 0, 0, 0);
    
    const totalWeeks = planLength;
    const { strengthWorkouts } = planData;
    
    // Generate sessions for each week
    for (let week = 0; week < totalWeeks; week++) {
      const isDeloadWeek = (week + 1) % 4 === 0; // Every 4th week is deload
      const blockNumber = Math.floor(week / 4) + 1;
      
      // Track which days of the week get strength training
      // Distribute strength days evenly across the week (Sunday to Saturday)
      const strengthDayIndices = [];
      const daysInWeek = 7;
      const spacing = Math.floor(daysInWeek / strengthDaysPerWeek);
      
      for (let i = 0; i < strengthDaysPerWeek; i++) {
        const dayIndex = i * spacing;
        strengthDayIndices.push(dayIndex < daysInWeek ? dayIndex : daysInWeek - 1);
      }
      
      // Generate 7 days for this week (Sunday to Saturday)
      for (let day = 0; day < 7; day++) {
        const dayNumber = week * 7 + day;
        const sessionDate = new Date(startDate);
        sessionDate.setDate(sessionDate.getDate() + dayNumber);
        
        // Determine if this day has strength training
        const strengthDayIndex = strengthDayIndices.indexOf(day);
        const hasStrength = strengthDayIndex !== -1;
        
        let session;
        
        if (isDeloadWeek && !hasStrength) {
          // True rest day during deload week
          session = {
            id: `session_${Date.now()}_${dayNumber}`,
            date: sessionDate.getTime(),
            type: 'rest',
            status: 'planned',
            notes: 'D-load week rest day - full recovery',
            completedAt: null,
            sessionData: null,
            weekNumber: week + 1,
            isDeload: true,
            blockNumber,
            exercises: null
          };
        } else {
          // Regular day with activities
          const activities = [];
          
          // Add strength training if this is a strength day
          if (hasStrength) {
            const strengthWorkout = strengthWorkouts[strengthDayIndex % strengthWorkouts.length];
            
            // Apply deload modifications if needed
            const strengthExercises = strengthWorkout.exercises.map(ex => {
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
            
            activities.push({
              type: 'strength',
              name: strengthWorkout.name,
              exercises: strengthExercises
            });
          }
          
          // Add yoga (unless it's a deload rest day)
          activities.push({
            type: 'yoga',
            name: isDeloadWeek ? 'Restorative Yoga (20 min)' : 'Yoga Flow (15 min)',
            duration: isDeloadWeek ? 20 : 15,
            notes: isDeloadWeek 
              ? 'Focus on deep stretching and recovery' 
              : 'Dynamic flow for flexibility and mobility'
          });
          
          // Add cardio (unless it's a deload rest day)
          activities.push({
            type: 'cardio',
            name: isDeloadWeek ? 'Light Cardio (15 min)' : 'Moderate Cardio (20 min)',
            duration: isDeloadWeek ? 15 : 20,
            notes: isDeloadWeek 
              ? 'Low intensity - walking or easy cycling' 
              : 'Moderate intensity - maintain elevated heart rate'
          });
          
          session = {
            id: `session_${Date.now()}_${dayNumber}`,
            date: sessionDate.getTime(),
            type: hasStrength ? 'strength' : 'active_recovery',
            status: 'planned',
            notes: `${hasStrength ? 'Strength + ' : ''}Yoga + Cardio`,
            completedAt: null,
            sessionData: null,
            weekNumber: week + 1,
            isDeload: isDeloadWeek,
            blockNumber,
            activities,
            // For backward compatibility, include exercises from strength training
            exercises: hasStrength ? activities[0].exercises : null
          };
        }
        
        sessions.push(session);
      }
    }

    return {
      id: `plan_${Date.now()}`,
      name: planName.trim(),
      goal: 'fitness',
      experienceLevel: 'intermediate',
      strengthDaysPerWeek: strengthDaysPerWeek,
      duration: totalWeeks * 7, // Total days
      startDate: startDate.toISOString(),
      sessions,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      isActive: true,
      planType: 'fitness',
      workoutStructure: workoutStructure,
      planLength: planLength,
      // Metadata
      metadata: {
        workoutStructure,
        strengthDaysPerWeek,
        planLength,
        includesYoga: true,
        includesCardio: true,
        startsOnSunday: true
      }
    };
  };

  /**
   * Reset wizard state
   */
  const resetWizard = () => {
    setPlanName('');
    setPlanLength(4);
    setStrengthDaysPerWeek(3);
    setWorkoutStructure('full-body');
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
   * Render the one-page setup form
   */
  const renderPlanSetup = () => (
    <Box sx={{ mt: 2 }}>
      <TextField
        fullWidth
        label="Plan Name"
        value={planName}
        onChange={(e) => setPlanName(e.target.value)}
        placeholder="e.g., My Fitness Plan"
        margin="normal"
        required
      />
      
      <FormControl fullWidth margin="normal" sx={{ mt: 3 }}>
        <FormLabel sx={{ mb: 2, fontSize: '1rem', fontWeight: 600 }}>
          Plan Length
        </FormLabel>
        <Grid container spacing={2}>
          {[4, 8, 12].map((weeks) => (
            <Grid item xs={4} key={weeks}>
              <Card
                variant={planLength === weeks ? 'elevation' : 'outlined'}
                sx={{
                  cursor: 'pointer',
                  bgcolor: planLength === weeks ? 'primary.main' : 'background.paper',
                  color: planLength === weeks ? 'primary.contrastText' : 'text.primary',
                  '&:hover': {
                    bgcolor: planLength === weeks ? 'primary.dark' : 'action.hover',
                  },
                  textAlign: 'center',
                }}
                onClick={() => setPlanLength(weeks)}
              >
                <CardContent>
                  <Typography variant="h5" gutterBottom>
                    {weeks}
                  </Typography>
                  <Typography variant="body2">
                    {weeks === 4 ? 'weeks' : 'weeks'}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </FormControl>
      
      <FormControl fullWidth margin="normal" sx={{ mt: 4 }}>
        <FormLabel sx={{ mb: 2, fontSize: '1rem', fontWeight: 600 }}>
          Workout Structure
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
                  All major muscle groups each session
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
                  Upper/Lower
                </Typography>
                <Typography variant="body2">
                  Alternate upper and lower body days
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
                  Three-way split rotation
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </FormControl>
      
      <Alert severity="info" sx={{ mt: 3 }}>
        <Typography variant="body2">
          <strong>Daily Activities:</strong> Every day includes yoga and cardio for comprehensive fitness.
        </Typography>
        <Typography variant="body2" sx={{ mt: 1 }}>
          <strong>D-load Weeks:</strong> Every 4th week reduces volume for recovery. True rest days allowed.
        </Typography>
        <Typography variant="body2" sx={{ mt: 1 }}>
          <strong>Start Date:</strong> Your plan will begin on the next Sunday (or today if it&apos;s Sunday).
        </Typography>
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
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}
        
        {renderPlanSetup()}
      </DialogContent>
      
      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          Cancel
        </Button>
        <Box sx={{ flex: '1 1 auto' }} />
        <Button
          variant="contained"
          onClick={handleCreatePlan}
          disabled={loading}
          startIcon={loading ? <CircularProgress size={20} /> : <CheckIcon />}
        >
          {loading ? 'Creating...' : 'Create Plan'}
        </Button>
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
