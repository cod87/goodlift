/**
 * SessionBuilderDialog - Interactive dialog for building workout sessions exercise-by-exercise
 * 
 * Features:
 * - Add exercises using a full-screen picker with filters
 * - Configure sets, reps, weight for each exercise
 * - Reorder exercises via options menu
 * - Remove exercises
 * - Superset management with color-coded groupings
 * - Save session for use in workout plans
 */

import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Paper,
  Divider,
} from '@mui/material';
import {
  Add as AddIcon,
  FitnessCenter as ExerciseIcon,
} from '@mui/icons-material';
import WorkoutExerciseCard from './Common/WorkoutExerciseCard';
import ExercisePicker from './Common/ExercisePicker';
import SupersetManagementModal from './Common/SupersetManagementModal';
import SwapExerciseDialog from './Common/SwapExerciseDialog';
import { DEFAULT_TARGET_REPS, getClosestValidTargetReps } from '../utils/repRangeWeightAdjustment';

const SessionBuilderDialog = ({ 
  open, 
  onClose, 
  onSave,
  initialSession = null,
  // allExercises is available but not used since ExercisePicker loads its own data
  sessionDate = null
}) => {
  const [sessionType, setSessionType] = useState('full');
  const [exercises, setExercises] = useState([]);
  const [exercisePickerOpen, setExercisePickerOpen] = useState(false);
  const [supersetModalOpen, setSupersetModalOpen] = useState(false);
  const [supersetExerciseIndex, setSupersetExerciseIndex] = useState(null);
  const [swapDialogOpen, setSwapDialogOpen] = useState(false);
  const [swapExerciseIndex, setSwapExerciseIndex] = useState(null);

  // Initialize session data
  useEffect(() => {
    if (initialSession) {
      setSessionType(initialSession.type || 'full');
      setExercises(initialSession.exercises || []);
    } else {
      setSessionType('full');
      setExercises([]);
    }
  }, [initialSession, open]);

  // Handle adding an exercise from the picker
  const handleAddExercise = (exercise) => {
    // Check if exercise is already in the list
    const exerciseName = exercise['Exercise Name'] || exercise.name;
    const alreadyAdded = exercises.some(ex => 
      (ex['Exercise Name'] || ex.name) === exerciseName
    );
    
    if (alreadyAdded) {
      // Remove exercise if already selected (toggle behavior)
      setExercises(exercises.filter(ex => 
        (ex['Exercise Name'] || ex.name) !== exerciseName
      ));
    } else {
      // Add new exercise
      const newExercise = {
        ...exercise,
        name: exercise['Exercise Name'] || exercise.name,
        sets: 3,
        reps: DEFAULT_TARGET_REPS,
        weight: '',
        restSeconds: 90,
        supersetGroup: null,
        notes: '',
      };
      setExercises([...exercises, newExercise]);
    }
  };

  const handleRemoveExercise = (index) => {
    setExercises(exercises.filter((_, i) => i !== index));
  };

  const handleExerciseChange = (index, field, value) => {
    setExercises(exercises.map((ex, i) => 
      i === index ? { ...ex, [field]: value } : ex
    ));
  };

  // Move exercise up or down
  const moveExercise = (fromIndex, direction) => {
    const newExercises = [...exercises];
    const toIndex = direction === 'up' ? fromIndex - 1 : fromIndex + 1;
    
    if (toIndex < 0 || toIndex >= exercises.length) return;
    
    [newExercises[fromIndex], newExercises[toIndex]] = [newExercises[toIndex], newExercises[fromIndex]];
    setExercises(newExercises);
  };

  // Handle opening superset modal
  const handleAddToSuperset = (index) => {
    setSupersetExerciseIndex(index);
    setSupersetModalOpen(true);
  };

  // Handle superset updates
  const handleUpdateSupersets = (updatedExercises) => {
    setExercises(updatedExercises);
  };

  // Handle opening swap dialog
  const handleOpenSwapDialog = (index) => {
    setSwapExerciseIndex(index);
    setSwapDialogOpen(true);
  };

  // Handle exercise swap
  const handleSwapExercise = (newExercise) => {
    if (swapExerciseIndex === null) return;
    
    const updatedExercises = [...exercises];
    updatedExercises[swapExerciseIndex] = {
      ...newExercise,
      name: newExercise['Exercise Name'] || newExercise.name,
      sets: exercises[swapExerciseIndex].sets || 3,
      reps: exercises[swapExerciseIndex].reps || DEFAULT_TARGET_REPS,
      restSeconds: exercises[swapExerciseIndex].restSeconds || 90,
      supersetGroup: exercises[swapExerciseIndex].supersetGroup,
      notes: exercises[swapExerciseIndex].notes || '',
    };
    setExercises(updatedExercises);
    setSwapDialogOpen(false);
    setSwapExerciseIndex(null);
  };

  const handleSave = () => {
    if (exercises.length === 0) {
      alert('Please add at least one exercise to the session');
      return;
    }

    const session = {
      id: initialSession?.id || `session_${Date.now()}`,
      date: sessionDate || initialSession?.date || Date.now(),
      type: sessionType,
      exercises: exercises,
      status: initialSession?.status || 'planned',
      notes: initialSession?.notes || '',
      completedAt: null,
      sessionData: null
    };

    onSave(session);
    handleClose();
  };

  const handleClose = () => {
    setExercises([]);
    setExercisePickerOpen(false);
    setSupersetModalOpen(false);
    setSwapDialogOpen(false);
    onClose();
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleClose} 
      maxWidth="md" 
      fullWidth
      PaperProps={{ sx: { minHeight: '70vh' } }}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <ExerciseIcon color="primary" />
          <Typography variant="h6">
            {initialSession ? 'Edit Session' : 'Build New Session'}
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          {/* Session Type Selection */}
          <FormControl fullWidth>
            <InputLabel>Session Type</InputLabel>
            <Select
              value={sessionType}
              label="Session Type"
              onChange={(e) => setSessionType(e.target.value)}
            >
              <MenuItem value="full">Full Body</MenuItem>
              <MenuItem value="upper">Upper Body</MenuItem>
              <MenuItem value="lower">Lower Body</MenuItem>
              <MenuItem value="push">Push</MenuItem>
              <MenuItem value="pull">Pull</MenuItem>
              <MenuItem value="legs">Legs</MenuItem>
            </Select>
          </FormControl>

          <Divider />

          {/* Add Exercise Button */}
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                Exercises ({exercises.length})
              </Typography>
              {exercises.length > 0 && (
                <Chip 
                  label={`${exercises.length} exercise${exercises.length !== 1 ? 's' : ''}`} 
                  size="small" 
                  color="primary"
                />
              )}
            </Box>
            
            <Button
              fullWidth
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={() => setExercisePickerOpen(true)}
              sx={{
                mb: 2,
                py: 1.5,
                borderStyle: 'dashed',
              }}
            >
              Add Exercise
            </Button>

            {/* Exercise List */}
            {exercises.length === 0 ? (
              <Paper sx={{ p: 3, textAlign: 'center', bgcolor: 'background.default' }}>
                <Typography variant="body2" color="text.secondary">
                  No exercises added yet. Tap "Add Exercise" to build your workout.
                </Typography>
              </Paper>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, maxHeight: '400px', overflowY: 'auto' }}>
                {exercises.map((exercise, index) => (
                  <WorkoutExerciseCard
                    key={`${exercise['Exercise Name'] || exercise.name}-${index}`}
                    exercise={exercise}
                    index={index}
                    sets={exercise.sets || 3}
                    reps={typeof exercise.reps === 'number' ? exercise.reps : getClosestValidTargetReps(parseInt(exercise.reps) || DEFAULT_TARGET_REPS)}
                    restSeconds={exercise.restSeconds || 90}
                    notes={exercise.notes || ''}
                    onSetsChange={(value) => handleExerciseChange(index, 'sets', value)}
                    onRepsChange={(value) => handleExerciseChange(index, 'reps', value)}
                    onRestChange={(value) => handleExerciseChange(index, 'restSeconds', value)}
                    onNotesChange={(value) => handleExerciseChange(index, 'notes', value)}
                    onMoveUp={() => moveExercise(index, 'up')}
                    onMoveDown={() => moveExercise(index, 'down')}
                    onReplace={() => handleOpenSwapDialog(index)}
                    onAddToSuperset={() => handleAddToSuperset(index)}
                    onRemove={() => handleRemoveExercise(index)}
                    canMoveUp={index > 0}
                    canMoveDown={index < exercises.length - 1}
                  />
                ))}
              </Box>
            )}
          </Box>
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handleClose}>Cancel</Button>
        <Button 
          variant="contained" 
          color="primary"
          onClick={handleSave}
          disabled={exercises.length === 0}
        >
          Save Session
        </Button>
      </DialogActions>

      {/* Exercise Picker Modal */}
      <ExercisePicker
        open={exercisePickerOpen}
        onClose={() => setExercisePickerOpen(false)}
        onSelectExercise={handleAddExercise}
        selectedExercises={exercises}
        multiSelect
        title="Add Exercises"
      />

      {/* Superset Management Modal */}
      <SupersetManagementModal
        open={supersetModalOpen}
        onClose={() => setSupersetModalOpen(false)}
        exercises={exercises}
        currentExerciseIndex={supersetExerciseIndex}
        onUpdateSupersets={handleUpdateSupersets}
      />

      {/* Swap Exercise Dialog */}
      <SwapExerciseDialog
        open={swapDialogOpen}
        onClose={() => setSwapDialogOpen(false)}
        currentExercise={swapExerciseIndex !== null ? exercises[swapExerciseIndex] : null}
        onSwap={handleSwapExercise}
      />
    </Dialog>
  );
};

SessionBuilderDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
  initialSession: PropTypes.object,
  allExercises: PropTypes.array,
  sessionDate: PropTypes.number
};

export default SessionBuilderDialog;
