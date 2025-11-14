/**
 * CustomWorkoutWizard - Step-by-step workout plan builder for mobile devices
 * 
 * Features:
 * - Step-by-step guide with sub-tabs
 * - Full customization required (no premade workouts)
 * - Day-by-day planning
 * - Preset workout generation during exercise selection
 * - Superset grouping (default: 8 sets grouped into 4 supersets)
 * - Week duplication and labeling
 */

import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  Stepper,
  Step,
  StepLabel,
  Alert,
  CircularProgress,
  Chip,
  Card,
  CardContent,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  ToggleButton,
  ToggleButtonGroup,
  Tabs,
  Tab,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  Divider,
  ButtonGroup,
  Collapse,
} from '@mui/material';
import {
  NavigateNext as NextIcon,
  NavigateBefore as BackIcon,
  Check as CheckIcon,
  Add as AddIcon,
  Remove as RemoveIcon,
  Delete as DeleteIcon,
  FitnessCenter as ExerciseIcon,
  ContentCopy as DuplicateIcon,
  Edit as EditIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
} from '@mui/icons-material';
import ExerciseAutocomplete from '../ExerciseAutocomplete';
import { saveWorkoutPlan, setActivePlan, getWorkoutPlans } from '../../utils/storage';
import { generateScientificWorkout } from '../../utils/scientificWorkoutGenerator';

// Wizard steps
const STEPS = [
  'Plan Duration',
  'Build Week',
  'Duplicate & Label',
  'Review'
];

// Days of the week
const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

// Preset workout types
const PRESET_TYPES = [
  { value: 'full', label: 'Full Body' },
  { value: 'upper', label: 'Upper Body' },
  { value: 'lower', label: 'Lower Body' },
  { value: 'push', label: 'Push' },
  { value: 'pull', label: 'Pull' },
  { value: 'legs', label: 'Legs' },
];

const CustomWorkoutWizard = ({ open, onClose, onPlanCreated }) => {
  // Wizard state
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Step 1: Plan Duration
  const [planName, setPlanName] = useState('');
  const [numberOfWeeks, setNumberOfWeeks] = useState(4);

  // Step 2: Build Week - Day by day
  const [weekPlan, setWeekPlan] = useState(
    DAYS_OF_WEEK.map((day) => ({
      day,
      isWorkoutDay: false,
      exercises: [],
      expanded: false,
    }))
  );

  // Exercise database
  const [exerciseDatabase, setExerciseDatabase] = useState(null);

  // Step 3: Duplicate & Label weeks
  const [weeks, setWeeks] = useState([]);

  // UI state for building day
  const [selectedExercise, setSelectedExercise] = useState(null);

  /**
   * Load exercise database
   */
  useEffect(() => {
    const loadData = async () => {
      if (open && !exerciseDatabase) {
        await loadExerciseDatabase();
      }
    };
    loadData();
  }, [open, exerciseDatabase]);

  const loadExerciseDatabase = async () => {
    try {
      const response = await fetch('/data/exercises.json');
      const data = await response.json();
      setExerciseDatabase(data);
    } catch (err) {
      console.error('Error loading exercises:', err);
      setError('Failed to load exercise database');
    }
  };

  /**
   * Reset wizard state
   */
  const resetWizard = () => {
    setActiveStep(0);
    setPlanName('');
    setNumberOfWeeks(4);
    setWeekPlan(
      DAYS_OF_WEEK.map((day) => ({
        day,
        isWorkoutDay: false,
        exercises: [],
        expanded: false,
      }))
    );
    setWeeks([]);
    setSelectedExercise(null);
    setError(null);
  };

  /**
   * Handle close
   */
  const handleClose = () => {
    if (!loading) {
      resetWizard();
      onClose();
    }
  };

  /**
   * Validate current step
   */
  const validateStep = () => {
    switch (activeStep) {
      case 0: { // Plan Duration
        if (!planName.trim()) {
          setError('Please enter a plan name');
          return false;
        }
        if (numberOfWeeks < 1 || numberOfWeeks > 52) {
          setError('Number of weeks must be between 1 and 52');
          return false;
        }
        break;
      }

      case 1: { // Build Week
        // Check if at least one day is marked as workout day
        const hasWorkoutDays = weekPlan.some(d => d.isWorkoutDay);
        if (!hasWorkoutDays) {
          setError('Please select at least one workout day');
          return false;
        }
        // Check if all workout days have exercises
        const missingExercises = weekPlan.filter(d => d.isWorkoutDay && d.exercises.length === 0);
        if (missingExercises.length > 0) {
          setError(`Please add exercises for all workout days (${missingExercises.map(d => d.day).join(', ')})`);
          return false;
        }
        break;
      }

      case 2: // Duplicate & Label
        if (weeks.length === 0) {
          setError('Please create at least one week');
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
   * Handle next step
   */
  const handleNext = () => {
    if (!validateStep()) {
      return;
    }

    // When moving from step 1 to step 2, initialize weeks with the first week
    if (activeStep === 1 && weeks.length === 0) {
      setWeeks([{
        weekNumber: 1,
        label: 'Week 1',
        days: JSON.parse(JSON.stringify(weekPlan)), // Deep copy
      }]);
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
   * Toggle workout day
   */
  const toggleWorkoutDay = (dayIndex) => {
    setWeekPlan((prev) => {
      const updated = [...prev];
      updated[dayIndex] = {
        ...updated[dayIndex],
        isWorkoutDay: !updated[dayIndex].isWorkoutDay,
        exercises: updated[dayIndex].isWorkoutDay ? [] : updated[dayIndex].exercises,
      };
      return updated;
    });
  };

  /**
   * Generate preset workout for a day
   */
  const handleGeneratePreset = async (dayIndex, presetType) => {
    try {
      setLoading(true);
      const workout = await generateScientificWorkout({
        type: presetType,
        experienceLevel: 'intermediate',
        goal: 'hypertrophy',
        isDeload: false,
        exercises: exerciseDatabase,
      });

      // Convert to our format with default 4 supersets (8 sets total)
      const exercises = workout.exercises.slice(0, 8).map((ex, idx) => ({
        id: `ex_${Date.now()}_${idx}`,
        name: ex.name || ex['Exercise Name'],
        'Exercise Name': ex.name || ex['Exercise Name'],
        'Primary Muscle': ex['Primary Muscle'],
        sets: 1, // Each exercise represents 1 set
        reps: ex.reps || 10,
        weight: '',
        supersetGroup: Math.floor(idx / 2) + 1, // Group 2 exercises per superset
        restSeconds: ex.restSeconds || 90,
        notes: '',
      }));

      setWeekPlan((prev) => {
        const updated = [...prev];
        updated[dayIndex] = {
          ...updated[dayIndex],
          exercises,
        };
        return updated;
      });

      setLoading(false);
    } catch (err) {
      console.error('Error generating preset:', err);
      setError('Failed to generate preset workout');
      setLoading(false);
    }
  };

  /**
   * Add manual exercise
   */
  const handleAddExercise = (dayIndex) => {
    if (!selectedExercise) {
      setError('Please select an exercise');
      return;
    }

    setWeekPlan((prev) => {
      const updated = [...prev];
      const currentExercises = updated[dayIndex].exercises;
      
      // Determine superset group for new exercise
      const lastSupersetGroup = currentExercises.length > 0 
        ? Math.max(...currentExercises.map(e => e.supersetGroup || 0))
        : 0;
      
      const newExercise = {
        id: `ex_${Date.now()}`,
        name: selectedExercise['Exercise Name'],
        'Exercise Name': selectedExercise['Exercise Name'],
        'Primary Muscle': selectedExercise['Primary Muscle'],
        sets: 1,
        reps: 10,
        weight: '',
        supersetGroup: lastSupersetGroup + 1,
        restSeconds: 90,
        notes: '',
      };

      updated[dayIndex].exercises = [...currentExercises, newExercise];
      return updated;
    });

    setSelectedExercise(null);
  };

  /**
   * Remove exercise
   */
  const handleRemoveExercise = (dayIndex, exerciseId) => {
    setWeekPlan((prev) => {
      const updated = [...prev];
      updated[dayIndex].exercises = updated[dayIndex].exercises.filter(
        (ex) => ex.id !== exerciseId
      );
      return updated;
    });
  };

  /**
   * Update exercise property
   */
  const handleUpdateExercise = (dayIndex, exerciseId, field, value) => {
    setWeekPlan((prev) => {
      const updated = [...prev];
      const exerciseIndex = updated[dayIndex].exercises.findIndex(
        (ex) => ex.id === exerciseId
      );
      if (exerciseIndex !== -1) {
        updated[dayIndex].exercises[exerciseIndex] = {
          ...updated[dayIndex].exercises[exerciseIndex],
          [field]: value,
        };
      }
      return updated;
    });
  };

  /**
   * Duplicate week
   */
  const handleDuplicateWeek = () => {
    setWeeks((prev) => {
      const lastWeek = prev[prev.length - 1];
      const newWeekNumber = lastWeek.weekNumber + 1;
      return [
        ...prev,
        {
          weekNumber: newWeekNumber,
          label: `Week ${newWeekNumber}`,
          days: JSON.parse(JSON.stringify(lastWeek.days)), // Deep copy
        },
      ];
    });
  };

  /**
   * Update week label
   */
  const handleUpdateWeekLabel = (weekIndex, newLabel) => {
    setWeeks((prev) => {
      const updated = [...prev];
      updated[weekIndex].label = newLabel;
      return updated;
    });
  };

  /**
   * Delete week
   */
  const handleDeleteWeek = (weekIndex) => {
    setWeeks((prev) => prev.filter((_, idx) => idx !== weekIndex));
  };

  /**
   * Create the plan
   */
  const handleCreatePlan = async () => {
    try {
      setLoading(true);
      setError(null);

      // Deactivate all existing plans
      const existingPlans = await getWorkoutPlans();
      for (const existingPlan of existingPlans) {
        if (existingPlan.isActive) {
          existingPlan.isActive = false;
          await saveWorkoutPlan(existingPlan);
        }
      }

      // Build sessions from weeks
      const sessions = [];
      const startDate = new Date();

      weeks.forEach((week, weekIdx) => {
        week.days.forEach((day, dayIdx) => {
          const sessionDate = new Date(startDate);
          sessionDate.setDate(sessionDate.getDate() + (weekIdx * 7 + dayIdx));

          const session = {
            id: `session_${Date.now()}_${weekIdx}_${dayIdx}`,
            date: sessionDate.getTime(),
            type: day.isWorkoutDay ? 'strength' : 'rest',
            status: 'planned',
            notes: day.isWorkoutDay ? '' : 'Rest day',
            completedAt: null,
            sessionData: null,
            weekNumber: week.weekNumber,
            weekLabel: week.label,
            exercises: day.isWorkoutDay ? day.exercises : null,
          };

          sessions.push(session);
        });
      });

      // Create plan
      const plan = {
        id: `plan_${Date.now()}`,
        name: planName.trim(),
        goal: 'custom',
        experienceLevel: 'custom',
        daysPerWeek: weekPlan.filter(d => d.isWorkoutDay).length,
        duration: numberOfWeeks * 7,
        startDate: startDate.toISOString(),
        sessions,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        isActive: true,
        planType: 'custom',
        metadata: {
          numberOfWeeks,
          customBuilt: true,
        },
      };

      // Save plan
      await saveWorkoutPlan(plan);
      await setActivePlan(plan.id);

      // Notify parent
      if (onPlanCreated) {
        onPlanCreated(plan);
      }

      handleClose();
    } catch (err) {
      console.error('Error creating plan:', err);
      setError(err.message || 'Failed to create plan');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Render Step 1: Plan Duration
   */
  const renderPlanDurationStep = () => (
    <Box sx={{ mt: 2 }}>
      <TextField
        fullWidth
        label="Plan Name"
        value={planName}
        onChange={(e) => setPlanName(e.target.value)}
        placeholder="e.g., My Custom Plan"
        margin="normal"
        required
      />

      <FormControl fullWidth margin="normal" sx={{ mt: 3 }}>
        <InputLabel>Number of Weeks</InputLabel>
        <Select
          value={numberOfWeeks}
          onChange={(e) => setNumberOfWeeks(e.target.value)}
          label="Number of Weeks"
        >
          {[...Array(52)].map((_, i) => (
            <MenuItem key={i + 1} value={i + 1}>
              {i + 1} {i + 1 === 1 ? 'week' : 'weeks'}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <Alert severity="info" sx={{ mt: 3 }}>
        You&apos;ll build one week at a time, then duplicate it for subsequent weeks.
      </Alert>
    </Box>
  );

  /**
   * Render Step 2: Build Week
   */
  const renderBuildWeekStep = () => (
    <Box sx={{ mt: 2 }}>
      <Typography variant="h6" gutterBottom>
        Build Your Week
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Select workout days and configure exercises for each day
      </Typography>

      <List>
        {weekPlan.map((dayPlan, dayIndex) => (
          <Card key={dayPlan.day} sx={{ mb: 2 }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="subtitle1" fontWeight="bold">
                    {dayPlan.day}
                  </Typography>
                  <Chip
                    label={dayPlan.isWorkoutDay ? 'Workout' : 'Rest'}
                    color={dayPlan.isWorkoutDay ? 'primary' : 'default'}
                    size="small"
                  />
                  {dayPlan.isWorkoutDay && dayPlan.exercises.length > 0 && (
                    <Chip
                      label={`${dayPlan.exercises.length} exercises`}
                      size="small"
                      variant="outlined"
                    />
                  )}
                </Box>
                <Box>
                  <Button
                    size="small"
                    variant={dayPlan.isWorkoutDay ? 'outlined' : 'contained'}
                    onClick={() => toggleWorkoutDay(dayIndex)}
                  >
                    {dayPlan.isWorkoutDay ? 'Set as Rest' : 'Set as Workout'}
                  </Button>
                  {dayPlan.isWorkoutDay && (
                    <IconButton
                      size="small"
                      onClick={() => {
                        setWeekPlan(prev => {
                          const updated = [...prev];
                          updated[dayIndex].expanded = !updated[dayIndex].expanded;
                          return updated;
                        });
                      }}
                    >
                      {dayPlan.expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                    </IconButton>
                  )}
                </Box>
              </Box>

              <Collapse in={dayPlan.isWorkoutDay && dayPlan.expanded}>
                <Divider sx={{ my: 2 }} />
                
                {/* Preset workout generation */}
                <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
                  Generate Preset Workout:
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                  {PRESET_TYPES.map((preset) => (
                    <Button
                      key={preset.value}
                      size="small"
                      variant="outlined"
                      onClick={() => handleGeneratePreset(dayIndex, preset.value)}
                      disabled={loading}
                    >
                      {preset.label}
                    </Button>
                  ))}
                </Box>

                <Divider sx={{ my: 2 }} />

                {/* Exercise list */}
                <Typography variant="subtitle2" gutterBottom>
                  Exercises:
                </Typography>
                {dayPlan.exercises.length === 0 ? (
                  <Alert severity="warning" sx={{ mb: 2 }}>
                    No exercises added yet. Generate a preset or add exercises manually.
                  </Alert>
                ) : (
                  <List dense>
                    {dayPlan.exercises.map((exercise) => (
                      <Paper key={exercise.id} sx={{ p: 1, mb: 1 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="body2" fontWeight="bold">
                              {exercise.name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {exercise['Primary Muscle']} • Superset {exercise.supersetGroup}
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 1, mt: 1, flexWrap: 'wrap' }}>
                              <TextField
                                size="small"
                                label="Reps"
                                type="number"
                                value={exercise.reps}
                                onChange={(e) => handleUpdateExercise(dayIndex, exercise.id, 'reps', parseInt(e.target.value) || 0)}
                                sx={{ width: 80 }}
                              />
                              <TextField
                                size="small"
                                label="Weight"
                                value={exercise.weight}
                                onChange={(e) => handleUpdateExercise(dayIndex, exercise.id, 'weight', e.target.value)}
                                placeholder="Optional"
                                sx={{ width: 100 }}
                              />
                              <TextField
                                size="small"
                                label="Superset"
                                type="number"
                                value={exercise.supersetGroup}
                                onChange={(e) => handleUpdateExercise(dayIndex, exercise.id, 'supersetGroup', parseInt(e.target.value) || 1)}
                                sx={{ width: 100 }}
                              />
                            </Box>
                          </Box>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleRemoveExercise(dayIndex, exercise.id)}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Box>
                      </Paper>
                    ))}
                  </List>
                )}

                {/* Add exercise */}
                <Divider sx={{ my: 2 }} />
                <Typography variant="subtitle2" gutterBottom>
                  Add Exercise:
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
                  {exerciseDatabase && (
                    <ExerciseAutocomplete
                      value={selectedExercise}
                      onChange={(_, newValue) => setSelectedExercise(newValue)}
                      availableExercises={exerciseDatabase}
                      label="Select Exercise"
                      placeholder="Search exercises..."
                      sx={{ flex: 1 }}
                    />
                  )}
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => handleAddExercise(dayIndex)}
                    disabled={!selectedExercise}
                  >
                    Add
                  </Button>
                </Box>
              </Collapse>
            </CardContent>
          </Card>
        ))}
      </List>
    </Box>
  );

  /**
   * Render Step 3: Duplicate & Label
   */
  const renderDuplicateLabelStep = () => (
    <Box sx={{ mt: 2 }}>
      <Typography variant="h6" gutterBottom>
        Duplicate & Label Weeks
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        You have {weeks.length} week{weeks.length !== 1 ? 's' : ''} configured. 
        Duplicate to create more weeks or edit labels.
      </Typography>

      <Button
        variant="contained"
        startIcon={<DuplicateIcon />}
        onClick={handleDuplicateWeek}
        sx={{ mb: 3 }}
        disabled={weeks.length >= numberOfWeeks}
      >
        Duplicate Last Week
      </Button>

      {weeks.length >= numberOfWeeks && (
        <Alert severity="success" sx={{ mb: 2 }}>
          You have configured all {numberOfWeeks} weeks!
        </Alert>
      )}

      <List>
        {weeks.map((week, weekIdx) => (
          <Card key={weekIdx} sx={{ mb: 2 }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <TextField
                  size="small"
                  value={week.label}
                  onChange={(e) => handleUpdateWeekLabel(weekIdx, e.target.value)}
                  label="Week Label"
                  sx={{ flex: 1, mr: 2 }}
                />
                <Chip
                  label={`${week.days.filter(d => d.isWorkoutDay).length} workout days`}
                  size="small"
                  variant="outlined"
                />
                {weeks.length > 1 && (
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => handleDeleteWeek(weekIdx)}
                    sx={{ ml: 1 }}
                  >
                    <DeleteIcon />
                  </IconButton>
                )}
              </Box>
            </CardContent>
          </Card>
        ))}
      </List>
    </Box>
  );

  /**
   * Render Step 4: Review
   */
  const renderReviewStep = () => (
    <Box sx={{ mt: 2 }}>
      <Typography variant="h6" gutterBottom>
        Review Your Plan
      </Typography>

      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="subtitle1" gutterBottom>
          <strong>Plan Name:</strong> {planName}
        </Typography>
        <Typography variant="body2" gutterBottom>
          <strong>Duration:</strong> {weeks.length} weeks ({weeks.length * 7} days)
        </Typography>
        <Typography variant="body2" gutterBottom>
          <strong>Workout Days per Week:</strong> {weekPlan.filter(d => d.isWorkoutDay).length}
        </Typography>
        <Typography variant="body2" gutterBottom>
          <strong>Total Sessions:</strong> {weeks.length * 7}
        </Typography>
      </Paper>

      <Typography variant="subtitle1" gutterBottom sx={{ mt: 3 }}>
        Week Structure:
      </Typography>
      {weeks.map((week, weekIdx) => (
        <Card key={weekIdx} sx={{ mb: 2 }}>
          <CardContent>
            <Typography variant="subtitle2" gutterBottom>
              {week.label}
            </Typography>
            <List dense>
              {week.days.map((day, dayIdx) => (
                <ListItem key={dayIdx}>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                        <Typography variant="body2">
                          {day.day}:
                        </Typography>
                        <Chip
                          label={day.isWorkoutDay ? `${day.exercises.length} exercises` : 'Rest'}
                          size="small"
                          color={day.isWorkoutDay ? 'primary' : 'default'}
                        />
                      </Box>
                    }
                  />
                </ListItem>
              ))}
            </List>
          </CardContent>
        </Card>
      ))}

      <Alert severity="success" sx={{ mt: 2 }}>
        <Typography variant="body2">
          <strong>Ready to start!</strong> Your plan will be activated and visible on your calendar.
        </Typography>
      </Alert>
    </Box>
  );

  /**
   * Render step content
   */
  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return renderPlanDurationStep();
      case 1:
        return renderBuildWeekStep();
      case 2:
        return renderDuplicateLabelStep();
      case 3:
        return renderReviewStep();
      default:
        return null;
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      disableEscapeKeyDown={loading}
      PaperProps={{
        sx: { maxHeight: '90vh' }
      }}
    >
      <DialogTitle>
        Custom Workout Plan Builder
      </DialogTitle>

      <DialogContent>
        <Stepper activeStep={activeStep} sx={{ mb: 3, mt: 1 }}>
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

        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
            <CircularProgress />
          </Box>
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

CustomWorkoutWizard.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onPlanCreated: PropTypes.func,
};

export default CustomWorkoutWizard;
