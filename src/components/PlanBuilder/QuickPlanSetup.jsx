/**
 * QuickPlanSetup - Enhanced workout plan creation with tabbed interface
 * 
 * Three planning modes:
 * 1. Quick Start - Pre-built science-based templates for instant setup
 * 2. Guided - Step-by-step wizard with plan recommendations
 * 3. Custom - Manual builder with full customization options
 * 
 * Features:
 * - Tabbed interface for different creation workflows
 * - Science-based workout templates (Upper/Lower, PPL, Full Body)
 * - Guided recommendations based on goals and experience
 * - Exercise details visible and modifiable
 * - 7-day weekly structure with rest/active recovery days
 * - Helper text and tooltips for training principles
 * - Auto-activation for plans named "This Week"
 * - Integration with Firebase and localStorage
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
  RadioGroup,
  FormControlLabel,
  Radio,
  Box,
  CircularProgress,
  Alert,
  Typography,
  Slider,
  Chip,
  Divider,
  Tabs,
  Tab,
  Card,
  CardContent,
  CardActions,
  List,
  ListItem,
  ListItemText,
  Stepper,
  Step,
  StepLabel,
  Checkbox,
  FormGroup,
  Tooltip,
  IconButton
} from '@mui/material';
import {
  AutoAwesome as AutoGenerateIcon,
  Schedule as ScheduleIcon,
  FitnessCenter as FitnessIcon,
  Speed as QuickStartIcon,
  Psychology as GuidedIcon,
  Build as CustomIcon,
  Info as InfoIcon,
  NavigateNext as NextIcon,
  NavigateBefore as BackIcon
} from '@mui/icons-material';
import { generateWorkoutPlan } from '../../utils/workoutPlanGenerator';
import { saveWorkoutPlan, setActivePlan } from '../../utils/storage';
import { 
  allTemplates, 
  getRecommendedTemplates 
} from '../../data/workoutTemplates';

const QuickPlanSetup = ({ open, onClose, onPlanCreated }) => {
  // Tab state
  const [activeTab, setActiveTab] = useState(0);
  
  // Common form state
  const [planName, setPlanName] = useState('');
  const [duration, setDuration] = useState(30);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Quick Start tab state
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  
  // Guided tab state
  const [guidedStep, setGuidedStep] = useState(0);
  const [guidedGoal, setGuidedGoal] = useState('general_fitness');
  const [guidedExperience, setGuidedExperience] = useState('intermediate');
  const [guidedDaysPerWeek, setGuidedDaysPerWeek] = useState(3);
  const [guidedEquipment, setGuidedEquipment] = useState(['barbell', 'dumbbell', 'cable', 'bodyweight']);
  const [recommendedTemplates, setRecommendedTemplates] = useState([]);
  
  // Custom tab state (existing functionality)
  const [daysPerWeek, setDaysPerWeek] = useState('3');
  const [goal, setGoal] = useState('general_fitness');
  const [experienceLevel, setExperienceLevel] = useState('intermediate');

  /**
   * Reset form to default values
   */
  const resetForm = () => {
    setPlanName('');
    setDuration(30);
    setActiveTab(0);
    setSelectedTemplate(null);
    setGuidedStep(0);
    setGuidedGoal('general_fitness');
    setGuidedExperience('intermediate');
    setGuidedDaysPerWeek(3);
    setGuidedEquipment(['barbell', 'dumbbell', 'cable', 'bodyweight']);
    setRecommendedTemplates([]);
    setDaysPerWeek('3');
    setGoal('general_fitness');
    setExperienceLevel('intermediate');
    setError(null);
  };

  /**
   * Handle dialog close with cleanup
   */
  const handleClose = () => {
    if (!loading) {
      resetForm();
      onClose();
    }
  };

  /**
   * Validate form inputs
   * @returns {Object} Validation result with isValid and message
   */
  const validateInputs = () => {
    if (duration < 1 || duration > 90) {
      return {
        isValid: false,
        message: 'Duration must be between 1 and 90 days'
      };
    }

    const days = parseInt(daysPerWeek, 10);
    if (days < 2 || days > 7) {
      return {
        isValid: false,
        message: 'Days per week must be between 2 and 7'
      };
    }

    return { isValid: true };
  };

  /**
   * Create plan from a template (Quick Start and Guided tabs)
   * @param {Object} template - Workout template object
   */
  const handleCreateFromTemplate = async (template) => {
    try {
      setLoading(true);
      setError(null);

      // Calculate the number of weeks needed based on duration
      const weeksNeeded = Math.ceil(duration / 7);
      const sessions = [];
      
      // Generate sessions for the entire duration
      for (let week = 0; week < weeksNeeded; week++) {
        for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
          const dayInPlan = week * 7 + dayIndex;
          
          // Stop if we've reached the duration
          if (dayInPlan >= duration) break;
          
          const templateDay = template.weeklySchedule[dayIndex];
          const sessionDate = new Date();
          sessionDate.setDate(sessionDate.getDate() + dayInPlan);
          
          // Create session from template
          const session = {
            id: `session_${Date.now()}_${dayInPlan}`,
            date: sessionDate.getTime(),
            type: templateDay.type,
            status: 'planned',
            notes: templateDay.description || '',
            completedAt: null,
            sessionData: null
          };
          
          // Add exercises if not a rest day
          if (templateDay.exercises && templateDay.exercises.length > 0) {
            session.exercises = templateDay.exercises.map(ex => ({
              'Exercise Name': ex.name,
              'Primary Muscle': ex['Primary Muscle'],
              name: ex.name,
              sets: ex.sets,
              reps: ex.reps,
              restSeconds: ex.restSeconds,
              weight: '',
              notes: ex.notes || '',
              supersetGroup: null
            }));
          } else {
            session.exercises = null;
          }
          
          sessions.push(session);
        }
      }

      // Create plan object
      const plan = {
        id: `plan_${Date.now()}`,
        name: planName.trim() || template.name,
        goal: template.goals[0] || 'general_fitness',
        experienceLevel: template.experienceLevel,
        daysPerWeek: template.daysPerWeek,
        duration,
        startDate: new Date().toISOString(),
        sessions,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        isActive: false
      };

      // Save the plan
      await saveWorkoutPlan(plan);
      
      // Auto-activate "This Week" plans
      if (plan.name.toLowerCase().includes('this week')) {
        await setActivePlan(plan.id);
      }

      // Notify parent component
      if (onPlanCreated) {
        onPlanCreated(plan);
      }

      handleClose();
    } catch (err) {
      console.error('Error creating plan from template:', err);
      setError(err.message || 'Failed to create plan. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Generate and save workout plan (Custom tab - existing functionality)
   */
  const handleGeneratePlan = async () => {
    try {
      setLoading(true);
      setError(null);

      // Validate inputs
      const validation = validateInputs();
      if (!validation.isValid) {
        setError(validation.message);
        setLoading(false);
        return;
      }

      // Prepare plan preferences
      const preferences = {
        planName: planName.trim() || 'My Workout Plan',
        daysPerWeek: parseInt(daysPerWeek, 10),
        goal,
        experienceLevel,
        duration,
        startDate: new Date(),
        equipmentAvailable: ['all'],
        sessionTypes: ['full', 'upper', 'lower', 'hiit', 'cardio', 'stretch']
      };

      // Generate plan using workoutPlanGenerator
      const plan = await generateWorkoutPlan(preferences);

      // Save the plan to storage
      await saveWorkoutPlan(plan);
      
      // Auto-activate "This Week" plans
      if (plan.name.toLowerCase().includes('this week')) {
        await setActivePlan(plan.id);
      }

      // Notify parent component
      if (onPlanCreated) {
        onPlanCreated(plan);
      }

      // Close dialog and reset form
      handleClose();
    } catch (err) {
      console.error('Error generating plan:', err);
      setError(err.message || 'Failed to generate plan. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle Guided tab progression
   */
  const handleGuidedNext = () => {
    if (guidedStep === 2) {
      // Final step - calculate recommendations
      const recommended = getRecommendedTemplates({
        goal: guidedGoal,
        experienceLevel: guidedExperience,
        daysPerWeek: guidedDaysPerWeek
      });
      setRecommendedTemplates(recommended);
    }
    setGuidedStep(prev => Math.min(prev + 1, 3));
  };

  const handleGuidedBack = () => {
    setGuidedStep(prev => Math.max(prev - 1, 0));
  };

  /**
   * Handle equipment selection toggle
   */
  const handleEquipmentToggle = (equipment) => {
    setGuidedEquipment(prev => {
      if (prev.includes(equipment)) {
        return prev.filter(e => e !== equipment);
      } else {
        return [...prev, equipment];
      }
    });
  };

  /**
   * Get goal label for display
   */
  const getGoalLabel = (goalValue) => {
    const labels = {
      strength: 'Strength',
      hypertrophy: 'Muscle Growth',
      fat_loss: 'Fat Loss',
      general_fitness: 'General Fitness'
    };
    return labels[goalValue] || goalValue;
  };

  /**
   * Render Quick Start tab content
   */
  const renderQuickStartTab = () => (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Alert severity="info" icon={<InfoIcon />}>
        Choose a pre-built, science-based workout template to get started quickly. 
        All templates include detailed exercise instructions and follow proven training principles.
      </Alert>

      {allTemplates.map((template) => (
        <Card 
          key={template.id}
          variant={selectedTemplate?.id === template.id ? 'elevation' : 'outlined'}
          sx={{ 
            cursor: 'pointer',
            border: selectedTemplate?.id === template.id ? 2 : 1,
            borderColor: selectedTemplate?.id === template.id ? 'primary.main' : 'divider'
          }}
          onClick={() => setSelectedTemplate(template)}
        >
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
              <Typography variant="h6" component="div">
                {template.name}
              </Typography>
              <Chip 
                label={`${template.daysPerWeek} days/week`} 
                size="small" 
                color="primary"
              />
            </Box>
            
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {template.description}
            </Typography>

            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
              <Chip label={template.experienceLevel} size="small" variant="outlined" />
              {template.goals.map(g => (
                <Chip key={g} label={getGoalLabel(g)} size="small" variant="outlined" />
              ))}
            </Box>

            {/* Show sample week structure */}
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
              Weekly Structure:
            </Typography>
            <List dense disablePadding>
              {template.weeklySchedule.map((day, idx) => (
                <ListItem key={idx} disableGutters sx={{ py: 0.5 }}>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                        <Typography variant="body2" sx={{ minWidth: 40, fontWeight: 500 }}>
                          Day {idx + 1}:
                        </Typography>
                        <Typography variant="body2">
                          {day.name}
                        </Typography>
                        {day.exercises && (
                          <Chip 
                            label={`${day.exercises.length} exercises`} 
                            size="small" 
                            sx={{ ml: 'auto' }}
                          />
                        )}
                      </Box>
                    }
                  />
                </ListItem>
              ))}
            </List>

            {/* Training notes with helper tooltips */}
            {selectedTemplate?.id === template.id && (
              <Box sx={{ mt: 2, p: 2, bgcolor: 'action.hover', borderRadius: 1 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                  Training Principles:
                  <Tooltip title="Science-based guidelines for optimal results">
                    <IconButton size="small" sx={{ ml: 0.5 }}>
                      <InfoIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Typography>
                <Typography variant="caption" display="block" sx={{ mb: 0.5 }}>
                  • <strong>Frequency:</strong> {template.trainingNotes.frequency}
                </Typography>
                <Typography variant="caption" display="block" sx={{ mb: 0.5 }}>
                  • <strong>Progression:</strong> {template.trainingNotes.progression}
                </Typography>
                <Typography variant="caption" display="block" sx={{ mb: 0.5 }}>
                  • <strong>Recovery:</strong> {template.trainingNotes.recovery}
                </Typography>
              </Box>
            )}
          </CardContent>
          
          {selectedTemplate?.id === template.id && (
            <CardActions sx={{ justifyContent: 'flex-end', p: 2, pt: 0 }}>
              <Button
                variant="contained"
                onClick={(e) => {
                  e.stopPropagation();
                  handleCreateFromTemplate(template);
                }}
                disabled={loading}
                startIcon={<AutoGenerateIcon />}
              >
                Create Plan
              </Button>
            </CardActions>
          )}
        </Card>
      ))}
    </Box>
  );

  /**
   * Render Guided tab content with 3-step wizard
   */
  const renderGuidedTab = () => {
    const steps = ['Select Goal', 'Experience & Schedule', 'Equipment', 'Recommended Plan'];

    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Stepper activeStep={guidedStep} sx={{ mb: 2 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {guidedStep === 0 && (
          <Box>
            <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
              What is your primary fitness goal?
              <Tooltip title="Your goal determines the rep ranges, volume, and exercise selection">
                <IconButton size="small" sx={{ ml: 0.5 }}>
                  <InfoIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Typography>
            <FormControl component="fieldset">
              <RadioGroup value={guidedGoal} onChange={(e) => setGuidedGoal(e.target.value)}>
                <FormControlLabel 
                  value="strength" 
                  control={<Radio />} 
                  label={
                    <Box>
                      <Typography variant="body1">{getGoalLabel('strength')}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        Lower reps (1-6), heavy weights, longer rest periods
                      </Typography>
                    </Box>
                  }
                />
                <FormControlLabel 
                  value="hypertrophy" 
                  control={<Radio />} 
                  label={
                    <Box>
                      <Typography variant="body1">{getGoalLabel('hypertrophy')}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        Moderate reps (6-12), progressive overload, balanced volume
                      </Typography>
                    </Box>
                  }
                />
                <FormControlLabel 
                  value="fat_loss" 
                  control={<Radio />} 
                  label={
                    <Box>
                      <Typography variant="body1">{getGoalLabel('fat_loss')}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        Higher reps (12-15+), shorter rest, circuit-style training
                      </Typography>
                    </Box>
                  }
                />
                <FormControlLabel 
                  value="general_fitness" 
                  control={<Radio />} 
                  label={
                    <Box>
                      <Typography variant="body1">{getGoalLabel('general_fitness')}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        Balanced approach for overall health and fitness
                      </Typography>
                    </Box>
                  }
                />
              </RadioGroup>
            </FormControl>
          </Box>
        )}

        {guidedStep === 1 && (
          <Box>
            <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
              Experience Level & Training Schedule
            </Typography>
            
            <FormControl component="fieldset" sx={{ mb: 3 }}>
              <FormLabel component="legend" sx={{ mb: 1 }}>
                What is your training experience?
                <Tooltip title="Beginners (0-1 year), Intermediate (1-3 years), Advanced (3+ years)">
                  <IconButton size="small" sx={{ ml: 0.5 }}>
                    <InfoIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </FormLabel>
              <RadioGroup value={guidedExperience} onChange={(e) => setGuidedExperience(e.target.value)}>
                <FormControlLabel value="beginner" control={<Radio />} label="Beginner (0-1 year)" />
                <FormControlLabel value="intermediate" control={<Radio />} label="Intermediate (1-3 years)" />
                <FormControlLabel value="advanced" control={<Radio />} label="Advanced (3+ years)" />
              </RadioGroup>
            </FormControl>

            <FormControl component="fieldset">
              <FormLabel component="legend" sx={{ mb: 1 }}>
                How many days per week can you train?
                <Tooltip title="Higher frequency allows for better muscle stimulation and recovery">
                  <IconButton size="small" sx={{ ml: 0.5 }}>
                    <InfoIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </FormLabel>
              <RadioGroup 
                value={guidedDaysPerWeek.toString()} 
                onChange={(e) => setGuidedDaysPerWeek(parseInt(e.target.value, 10))}
                row
              >
                <FormControlLabel value="3" control={<Radio />} label="3 days" />
                <FormControlLabel value="4" control={<Radio />} label="4 days" />
                <FormControlLabel value="5" control={<Radio />} label="5 days" />
                <FormControlLabel value="6" control={<Radio />} label="6 days" />
              </RadioGroup>
            </FormControl>
          </Box>
        )}

        {guidedStep === 2 && (
          <Box>
            <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
              What equipment do you have access to?
              <Tooltip title="Select all equipment available to you for better exercise variety">
                <IconButton size="small" sx={{ ml: 0.5 }}>
                  <InfoIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Typography>
            <FormGroup>
              <FormControlLabel
                control={
                  <Checkbox 
                    checked={guidedEquipment.includes('barbell')}
                    onChange={() => handleEquipmentToggle('barbell')}
                  />
                }
                label="Barbell"
              />
              <FormControlLabel
                control={
                  <Checkbox 
                    checked={guidedEquipment.includes('dumbbell')}
                    onChange={() => handleEquipmentToggle('dumbbell')}
                  />
                }
                label="Dumbbells"
              />
              <FormControlLabel
                control={
                  <Checkbox 
                    checked={guidedEquipment.includes('cable')}
                    onChange={() => handleEquipmentToggle('cable')}
                  />
                }
                label="Cable Machine"
              />
              <FormControlLabel
                control={
                  <Checkbox 
                    checked={guidedEquipment.includes('bodyweight')}
                    onChange={() => handleEquipmentToggle('bodyweight')}
                  />
                }
                label="Bodyweight"
              />
            </FormGroup>
          </Box>
        )}

        {guidedStep === 3 && (
          <Box>
            <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
              Recommended Plans Based on Your Preferences
            </Typography>
            <Alert severity="success" icon={<InfoIcon />} sx={{ mb: 2 }}>
              Based on your selections, here are the best-matched workout templates for you.
            </Alert>

            {recommendedTemplates.length > 0 ? (
              recommendedTemplates.map((template) => (
                <Card 
                  key={template.id}
                  variant="outlined"
                  sx={{ mb: 2 }}
                >
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                      <Typography variant="h6" component="div">
                        {template.name}
                      </Typography>
                      <Chip 
                        label={`${template.daysPerWeek} days/week`} 
                        size="small" 
                        color="primary"
                      />
                    </Box>
                    
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      {template.description}
                    </Typography>

                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      <Chip label={template.experienceLevel} size="small" variant="outlined" />
                      {template.goals.map(g => (
                        <Chip key={g} label={getGoalLabel(g)} size="small" variant="outlined" />
                      ))}
                    </Box>
                  </CardContent>
                  
                  <CardActions sx={{ justifyContent: 'flex-end', p: 2, pt: 0 }}>
                    <Button
                      variant="contained"
                      onClick={() => handleCreateFromTemplate(template)}
                      disabled={loading}
                      startIcon={<AutoGenerateIcon />}
                    >
                      Select This Plan
                    </Button>
                  </CardActions>
                </Card>
              ))
            ) : (
              <Alert severity="warning">
                No matching templates found. Try adjusting your preferences or use the Custom tab.
              </Alert>
            )}
          </Box>
        )}
      </Box>
    );
  };

  /**
   * Render Custom tab content (original QuickPlanSetup functionality)
   */
  const renderCustomTab = () => (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Alert severity="info" icon={<InfoIcon />}>
        Manually configure your workout plan with custom settings. 
        The system will auto-generate workouts based on your preferences.
      </Alert>

      {/* Days Per Week */}
      <FormControl component="fieldset" disabled={loading}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <FitnessIcon fontSize="small" color="action" />
          <FormLabel component="legend">
            Days Per Week
            <Tooltip title="How many days per week will you train? Aim for at least 3 days for optimal results.">
              <IconButton size="small" sx={{ ml: 0.5 }}>
                <InfoIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </FormLabel>
        </Box>
        <RadioGroup
          value={daysPerWeek}
          onChange={(e) => setDaysPerWeek(e.target.value)}
          row
        >
          <FormControlLabel value="3" control={<Radio />} label="3" />
          <FormControlLabel value="4" control={<Radio />} label="4" />
          <FormControlLabel value="5" control={<Radio />} label="5" />
          <FormControlLabel value="6" control={<Radio />} label="6" />
        </RadioGroup>
      </FormControl>

      <Divider />

      {/* Goal */}
      <FormControl component="fieldset" disabled={loading}>
        <FormLabel component="legend">
          Fitness Goal
          <Tooltip title="Your goal determines training volume, intensity, and rest periods">
            <IconButton size="small" sx={{ ml: 0.5 }}>
              <InfoIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </FormLabel>
        <RadioGroup
          value={goal}
          onChange={(e) => setGoal(e.target.value)}
        >
          <FormControlLabel 
            value="strength" 
            control={<Radio />} 
            label={getGoalLabel('strength')}
          />
          <FormControlLabel 
            value="hypertrophy" 
            control={<Radio />} 
            label={getGoalLabel('hypertrophy')}
          />
          <FormControlLabel 
            value="fat_loss" 
            control={<Radio />} 
            label={getGoalLabel('fat_loss')}
          />
          <FormControlLabel 
            value="general_fitness" 
            control={<Radio />} 
            label={getGoalLabel('general_fitness')}
          />
        </RadioGroup>
      </FormControl>

      {/* Experience Level */}
      <FormControl component="fieldset" disabled={loading}>
        <FormLabel component="legend">
          Experience Level
          <Tooltip title="Your experience level determines exercise complexity and training volume">
            <IconButton size="small" sx={{ ml: 0.5 }}>
              <InfoIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </FormLabel>
        <RadioGroup
          value={experienceLevel}
          onChange={(e) => setExperienceLevel(e.target.value)}
        >
          <FormControlLabel 
            value="beginner" 
            control={<Radio />} 
            label="Beginner" 
          />
          <FormControlLabel 
            value="intermediate" 
            control={<Radio />} 
            label="Intermediate" 
          />
          <FormControlLabel 
            value="advanced" 
            control={<Radio />} 
            label="Advanced" 
          />
        </RadioGroup>
      </FormControl>
    </Box>
  );

  return (
    <Dialog 
      open={open} 
      onClose={handleClose} 
      maxWidth="md" 
      fullWidth
      PaperProps={{
        sx: { borderRadius: 2, maxHeight: '90vh' }
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <AutoGenerateIcon color="primary" />
          <Typography variant="h6">Quick Plan Setup</Typography>
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          Choose your preferred method to create a workout plan
        </Typography>
      </DialogTitle>

      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          {/* Plan Name - Common to all tabs */}
          <TextField
            label="Plan Name (Optional)"
            value={planName}
            onChange={(e) => setPlanName(e.target.value)}
            fullWidth
            placeholder="e.g., Summer Training, This Week"
            disabled={loading}
            helperText='Plans named "This Week" are automatically set as active'
          />

          {/* Duration Slider - Common to all tabs */}
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <ScheduleIcon fontSize="small" color="action" />
              <FormLabel>
                Duration
                <Tooltip title="Plan duration repeats the weekly template across multiple weeks">
                  <IconButton size="small" sx={{ ml: 0.5 }}>
                    <InfoIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </FormLabel>
            </Box>
            <Box sx={{ px: 1 }}>
              <Slider
                value={duration}
                onChange={(e, value) => setDuration(value)}
                min={7}
                max={90}
                step={7}
                marks={[
                  { value: 7, label: '1 week' },
                  { value: 28, label: '4 weeks' },
                  { value: 56, label: '8 weeks' },
                  { value: 84, label: '12 weeks' }
                ]}
                valueLabelDisplay="auto"
                valueLabelFormat={(value) => `${Math.ceil(value / 7)} week${Math.ceil(value / 7) !== 1 ? 's' : ''}`}
                disabled={loading}
              />
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 1 }}>
              <Chip 
                label={`${Math.ceil(duration / 7)} week${Math.ceil(duration / 7) !== 1 ? 's' : ''} (${duration} days)`}
                size="small" 
                color="primary" 
                variant="outlined"
              />
            </Box>
          </Box>

          <Divider />

          {/* Tab Navigation */}
          <Tabs 
            value={activeTab} 
            onChange={(e, newValue) => setActiveTab(newValue)}
            variant="fullWidth"
            sx={{ borderBottom: 1, borderColor: 'divider' }}
          >
            <Tab 
              icon={<QuickStartIcon />} 
              label="Quick Start" 
              iconPosition="start"
              disabled={loading}
            />
            <Tab 
              icon={<GuidedIcon />} 
              label="Guided" 
              iconPosition="start"
              disabled={loading}
            />
            <Tab 
              icon={<CustomIcon />} 
              label="Custom" 
              iconPosition="start"
              disabled={loading}
            />
          </Tabs>

          {/* Tab Content */}
          <Box sx={{ minHeight: '300px', maxHeight: '500px', overflowY: 'auto', py: 2 }}>
            {activeTab === 0 && renderQuickStartTab()}
            {activeTab === 1 && renderGuidedTab()}
            {activeTab === 2 && renderCustomTab()}
          </Box>

          {/* Error Display */}
          {error && (
            <Alert 
              severity="error" 
              onClose={() => setError(null)}
              sx={{ borderRadius: 1 }}
            >
              {error}
            </Alert>
          )}

          {/* Loading State */}
          {loading && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2, bgcolor: 'action.hover', borderRadius: 1 }}>
              <CircularProgress size={24} />
              <Typography variant="body2" color="text.secondary">
                Creating your workout plan...
              </Typography>
            </Box>
          )}
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2, justifyContent: 'space-between' }}>
        <Box>
          {/* Guided tab navigation buttons */}
          {activeTab === 1 && guidedStep < 3 && (
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button 
                onClick={handleGuidedBack} 
                disabled={guidedStep === 0 || loading}
                startIcon={<BackIcon />}
              >
                Back
              </Button>
              <Button 
                onClick={handleGuidedNext} 
                disabled={loading}
                variant="outlined"
                endIcon={<NextIcon />}
              >
                Next
              </Button>
            </Box>
          )}
        </Box>
        
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          {/* Show Generate button only on Custom tab */}
          {activeTab === 2 && (
            <Button
              onClick={handleGeneratePlan}
              variant="contained"
              disabled={loading}
              startIcon={<AutoGenerateIcon />}
            >
              Generate Plan
            </Button>
          )}
        </Box>
      </DialogActions>
    </Dialog>
  );
};

QuickPlanSetup.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onPlanCreated: PropTypes.func,
};

export default QuickPlanSetup;
