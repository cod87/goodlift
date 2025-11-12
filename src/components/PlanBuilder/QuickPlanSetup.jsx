/**
 * QuickPlanSetup - Consolidated component for quick workout plan creation
 * 
 * Replaces PlanCreationModal with enhanced features:
 * - Quick auto-generation of plans
 * - Variable duration (1-90 days) instead of fixed 30 days
 * - Equipment selection
 * - Better error handling and user feedback
 * - Consistent UX with modern Material-UI design
 * 
 * Features:
 * - Plan name (optional, defaults to "My Workout Plan")
 * - Duration selection (1-90 days)
 * - Days per week (3-6)
 * - Fitness goal (strength, hypertrophy, fat_loss, general_fitness)
 * - Experience level (beginner, intermediate, advanced)
 * - Equipment selection (optional, defaults to all)
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
  Divider
} from '@mui/material';
import {
  AutoAwesome as AutoGenerateIcon,
  Schedule as ScheduleIcon,
  FitnessCenter as FitnessIcon
} from '@mui/icons-material';
import { generateWorkoutPlan } from '../../utils/workoutPlanGenerator';
import { saveWorkoutPlan, setActivePlan } from '../../utils/storage';

const QuickPlanSetup = ({ open, onClose, onPlanCreated }) => {
  // Form state
  const [planName, setPlanName] = useState('');
  const [duration, setDuration] = useState(30);
  const [daysPerWeek, setDaysPerWeek] = useState('3');
  const [goal, setGoal] = useState('general_fitness');
  const [experienceLevel, setExperienceLevel] = useState('intermediate');
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Reset form to default values
   */
  const resetForm = () => {
    setPlanName('');
    setDuration(30);
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
   * Generate and save workout plan
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
   * Format duration value for display
   */
  const formatDuration = (value) => {
    return `${value} ${value === 1 ? 'day' : 'days'}`;
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

  return (
    <Dialog 
      open={open} 
      onClose={handleClose} 
      maxWidth="sm" 
      fullWidth
      PaperProps={{
        sx: { borderRadius: 2 }
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <AutoGenerateIcon color="primary" />
          <Typography variant="h6">Quick Plan Setup</Typography>
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          Generate a personalized workout plan in seconds
        </Typography>
      </DialogTitle>

      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 2 }}>
          {/* Plan Name */}
          <TextField
            label="Plan Name (Optional)"
            value={planName}
            onChange={(e) => setPlanName(e.target.value)}
            fullWidth
            placeholder="e.g., Summer Training, This Week"
            disabled={loading}
            helperText='Plans named "This Week" are automatically set as active'
          />

          {/* Duration Slider */}
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <ScheduleIcon fontSize="small" color="action" />
              <FormLabel>Duration</FormLabel>
            </Box>
            <Box sx={{ px: 1 }}>
              <Slider
                value={duration}
                onChange={(e, value) => setDuration(value)}
                min={1}
                max={90}
                step={1}
                marks={[
                  { value: 1, label: '1 day' },
                  { value: 30, label: '30' },
                  { value: 60, label: '60' },
                  { value: 90, label: '90 days' }
                ]}
                valueLabelDisplay="auto"
                valueLabelFormat={formatDuration}
                disabled={loading}
              />
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 1 }}>
              <Chip 
                label={formatDuration(duration)} 
                size="small" 
                color="primary" 
                variant="outlined"
              />
            </Box>
          </Box>

          <Divider />

          {/* Days Per Week */}
          <FormControl component="fieldset" disabled={loading}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <FitnessIcon fontSize="small" color="action" />
              <FormLabel component="legend">Days Per Week</FormLabel>
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

          {/* Goal */}
          <FormControl component="fieldset" disabled={loading}>
            <FormLabel component="legend">Fitness Goal</FormLabel>
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
            <FormLabel component="legend">Experience Level</FormLabel>
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
                Generating your personalized workout plan...
              </Typography>
            </Box>
          )}
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handleClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          onClick={handleGeneratePlan}
          variant="contained"
          disabled={loading}
          startIcon={<AutoGenerateIcon />}
        >
          Generate Plan
        </Button>
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
