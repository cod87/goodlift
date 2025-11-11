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
  Typography
} from '@mui/material';
import { generateWorkoutPlan } from '../utils/workoutPlanGenerator';
import { saveWorkoutPlan, setActivePlan } from '../utils/storage';

const PlanCreationModal = ({ open, onClose, onPlanCreated }) => {
  const [planName, setPlanName] = useState('');
  const [daysPerWeek, setDaysPerWeek] = useState('3');
  const [goal, setGoal] = useState('general_fitness');
  const [experienceLevel, setExperienceLevel] = useState('intermediate');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleClose = () => {
    if (!loading) {
      // Reset form
      setPlanName('');
      setDaysPerWeek('3');
      setGoal('general_fitness');
      setExperienceLevel('intermediate');
      setError(null);
      onClose();
    }
  };

  const handleGeneratePlan = async () => {
    try {
      setLoading(true);
      setError(null);

      const plan = await generateWorkoutPlan({
        planName: planName || 'My Workout Plan',
        daysPerWeek: parseInt(daysPerWeek, 10),
        goal,
        experienceLevel,
        duration: 30,
        startDate: new Date(),
        equipmentAvailable: ['all'],
        sessionTypes: ['full', 'upper', 'lower', 'hiit', 'cardio', 'yoga']
      });

      // Save the plan
      await saveWorkoutPlan(plan);
      
      // Set as active plan
      await setActivePlan(plan.id);

      // Notify parent component
      if (onPlanCreated) {
        onPlanCreated(plan);
      }

      // Close modal
      handleClose();
    } catch (err) {
      console.error('Error generating plan:', err);
      setError(err.message || 'Failed to generate plan. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Create New Workout Plan</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 2 }}>
          {/* Plan Name */}
          <TextField
            label="Plan Name (Optional)"
            value={planName}
            onChange={(e) => setPlanName(e.target.value)}
            fullWidth
            placeholder="e.g., Summer Training"
            disabled={loading}
          />

          {/* Days Per Week */}
          <FormControl component="fieldset" disabled={loading}>
            <FormLabel component="legend">Days Per Week</FormLabel>
            <RadioGroup
              value={daysPerWeek}
              onChange={(e) => setDaysPerWeek(e.target.value)}
            >
              <FormControlLabel value="3" control={<Radio />} label="3 days" />
              <FormControlLabel value="4" control={<Radio />} label="4 days" />
              <FormControlLabel value="5" control={<Radio />} label="5 days" />
              <FormControlLabel value="6" control={<Radio />} label="6 days" />
            </RadioGroup>
          </FormControl>

          {/* Goal */}
          <FormControl component="fieldset" disabled={loading}>
            <FormLabel component="legend">Goal</FormLabel>
            <RadioGroup
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
            >
              <FormControlLabel value="strength" control={<Radio />} label="Strength" />
              <FormControlLabel value="hypertrophy" control={<Radio />} label="Muscle" />
              <FormControlLabel value="fat_loss" control={<Radio />} label="Fat-Loss" />
              <FormControlLabel value="general_fitness" control={<Radio />} label="General" />
            </RadioGroup>
          </FormControl>

          {/* Experience Level */}
          <FormControl component="fieldset" disabled={loading}>
            <FormLabel component="legend">Experience Level</FormLabel>
            <RadioGroup
              value={experienceLevel}
              onChange={(e) => setExperienceLevel(e.target.value)}
            >
              <FormControlLabel value="beginner" control={<Radio />} label="Beginner" />
              <FormControlLabel value="intermediate" control={<Radio />} label="Intermediate" />
              <FormControlLabel value="advanced" control={<Radio />} label="Advanced" />
            </RadioGroup>
          </FormControl>

          {/* Error Display */}
          {error && (
            <Alert severity="error" onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          {/* Loading State */}
          {loading && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <CircularProgress size={24} />
              <Typography variant="body2" color="text.secondary">
                Generating your plan...
              </Typography>
            </Box>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          onClick={handleGeneratePlan}
          variant="contained"
          disabled={loading}
        >
          Generate Plan
        </Button>
      </DialogActions>
    </Dialog>
  );
};

PlanCreationModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onPlanCreated: PropTypes.func,
};

export default PlanCreationModal;
