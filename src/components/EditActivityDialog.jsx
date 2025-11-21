import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

const SESSION_TYPES = {
  STRENGTH: 'strength',
  CARDIO: 'cardio',
  YOGA: 'yoga',
  REST: 'rest',
};

const WORKOUT_TYPES = {
  FULL: 'full',
  UPPER: 'upper',
  PUSH: 'push',
  PULL: 'pull',
  LEGS: 'legs',
  CORE: 'core',
};

/**
 * EditActivityDialog - Dialog for editing logged activity sessions
 */
const EditActivityDialog = ({ open, onClose, activity, onSave }) => {
  const [formData, setFormData] = useState({
    date: new Date(),
    duration: '',
    notes: '',
    sessionName: '',
    sessionType: SESSION_TYPES.STRENGTH,
    workoutType: WORKOUT_TYPES.FULL,
    numExercises: '',
    setsPerExercise: '',
  });

  useEffect(() => {
    if (activity && open) {
      // Convert duration from seconds to minutes for display
      const durationInMinutes = activity.duration ? Math.round(activity.duration / 60) : '';
      
      setFormData({
        date: new Date(activity.date),
        duration: durationInMinutes,
        notes: activity.notes || '',
        sessionName: activity.sessionName || '',
        sessionType: activity.sessionType || SESSION_TYPES.STRENGTH,
        workoutType: activity.type || WORKOUT_TYPES.FULL,
        numExercises: activity.numExercises || '',
        setsPerExercise: activity.setsPerExercise || '',
      });
    }
  }, [activity, open]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    // Convert duration from minutes to seconds
    const durationInSeconds = formData.duration ? parseFloat(formData.duration) * 60 : 0;
    
    const updatedActivity = {
      ...activity,
      date: formData.date.getTime(),
      duration: durationInSeconds,
      notes: formData.notes.trim(),
      sessionName: formData.sessionName.trim(),
      sessionType: formData.sessionType,
      type: formData.sessionType === SESSION_TYPES.STRENGTH ? formData.workoutType : formData.sessionType,
      numExercises: formData.sessionType === SESSION_TYPES.STRENGTH ? parseInt(formData.numExercises) || undefined : undefined,
      setsPerExercise: formData.sessionType === SESSION_TYPES.STRENGTH ? parseInt(formData.setsPerExercise) || undefined : undefined,
    };

    onSave(updatedActivity);
    onClose();
  };

  const isValid = () => {
    if (!formData.date) return false;
    if (formData.sessionType !== SESSION_TYPES.REST && (!formData.duration || parseFloat(formData.duration) <= 0)) {
      return false;
    }
    if (formData.sessionType === SESSION_TYPES.STRENGTH) {
      if (!formData.numExercises || parseInt(formData.numExercises) <= 0) return false;
      if (!formData.setsPerExercise || parseInt(formData.setsPerExercise) <= 0) return false;
    }
    return true;
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Edit Activity</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            {/* Date Field */}
            <DatePicker
              label="Date"
              value={formData.date}
              onChange={(newValue) => handleChange('date', newValue)}
              slotProps={{
                textField: {
                  fullWidth: true,
                }
              }}
            />

            {/* Session Type Selection */}
            <FormControl fullWidth>
              <InputLabel>Session Type</InputLabel>
              <Select
                value={formData.sessionType}
                label="Session Type"
                onChange={(e) => handleChange('sessionType', e.target.value)}
              >
                <MenuItem value={SESSION_TYPES.STRENGTH}>Strength</MenuItem>
                <MenuItem value={SESSION_TYPES.CARDIO}>Cardio</MenuItem>
                <MenuItem value={SESSION_TYPES.YOGA}>Yoga</MenuItem>
                <MenuItem value={SESSION_TYPES.REST}>Rest Day</MenuItem>
              </Select>
            </FormControl>

            {/* Workout Type for Strength Sessions */}
            {formData.sessionType === SESSION_TYPES.STRENGTH && (
              <FormControl fullWidth>
                <InputLabel>Workout Type</InputLabel>
                <Select
                  value={formData.workoutType}
                  label="Workout Type"
                  onChange={(e) => handleChange('workoutType', e.target.value)}
                >
                  <MenuItem value={WORKOUT_TYPES.FULL}>Full Body</MenuItem>
                  <MenuItem value={WORKOUT_TYPES.UPPER}>Upper Body</MenuItem>
                  <MenuItem value={WORKOUT_TYPES.PUSH}>Push</MenuItem>
                  <MenuItem value={WORKOUT_TYPES.PULL}>Pull</MenuItem>
                  <MenuItem value={WORKOUT_TYPES.LEGS}>Legs</MenuItem>
                  <MenuItem value={WORKOUT_TYPES.CORE}>Core</MenuItem>
                </Select>
              </FormControl>
            )}

            {/* Duration Field - Hide for Rest Days */}
            {formData.sessionType !== SESSION_TYPES.REST && (
              <TextField
                fullWidth
                type="number"
                label="Duration (minutes)"
                placeholder="e.g., 45"
                value={formData.duration === '' ? '' : formData.duration}
                onChange={(e) => handleChange('duration', e.target.value)}
                variant="outlined"
                inputProps={{ min: 0, step: 1 }}
              />
            )}

            {/* Strength-specific fields */}
            {formData.sessionType === SESSION_TYPES.STRENGTH && (
              <>
                <TextField
                  fullWidth
                  type="number"
                  label="Number of Exercises"
                  placeholder="e.g., 6"
                  value={formData.numExercises === '' ? '' : formData.numExercises}
                  onChange={(e) => handleChange('numExercises', e.target.value)}
                  variant="outlined"
                  inputProps={{ min: 1, step: 1 }}
                />

                <TextField
                  fullWidth
                  type="number"
                  label="Sets per Exercise"
                  placeholder="e.g., 3"
                  value={formData.setsPerExercise === '' ? '' : formData.setsPerExercise}
                  onChange={(e) => handleChange('setsPerExercise', e.target.value)}
                  variant="outlined"
                  inputProps={{ min: 1, step: 1 }}
                />
              </>
            )}

            {/* Session Name Field - Optional */}
            <TextField
              fullWidth
              label="Session Name (optional)"
              placeholder="e.g., Morning workout, Leg day, etc."
              value={formData.sessionName}
              onChange={(e) => handleChange('sessionName', e.target.value)}
              variant="outlined"
            />

            {/* Notes Field */}
            <TextField
              fullWidth
              multiline
              rows={4}
              label="Notes (optional)"
              placeholder="Add any notes about your session..."
              value={formData.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              variant="outlined"
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button 
            onClick={handleSave} 
            variant="contained"
            disabled={!isValid()}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </LocalizationProvider>
  );
};

EditActivityDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  activity: PropTypes.object,
  onSave: PropTypes.func.isRequired,
};

export default EditActivityDialog;
