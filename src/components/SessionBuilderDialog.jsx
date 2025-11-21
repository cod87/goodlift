/**
 * SessionBuilderDialog - Interactive dialog for building workout sessions exercise-by-exercise
 * 
 * Features:
 * - Add exercises one at a time using autocomplete search
 * - Configure sets, reps, weight for each exercise
 * - Reorder exercises via drag and drop
 * - Remove exercises
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
  List,
  ListItem,
  IconButton,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Paper,
  Divider
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Add as AddIcon,
  DragIndicator as DragIcon,
  FitnessCenter as ExerciseIcon
} from '@mui/icons-material';
import ExerciseAutocomplete from './ExerciseAutocomplete';

const SessionBuilderDialog = ({ 
  open, 
  onClose, 
  onSave,
  initialSession = null,
  allExercises = [],
  sessionDate = null
}) => {
  const [sessionType, setSessionType] = useState('full');
  const [exercises, setExercises] = useState([]);
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [availableExercises, setAvailableExercises] = useState([]);

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

  // Filter exercises based on session type
  useEffect(() => {
    if (!allExercises || allExercises.length === 0) return;

    let filtered = allExercises;

    if (sessionType === 'upper') {
      filtered = allExercises.filter(ex => 
        ex['Workout Type'] && 
        (ex['Workout Type'].includes('Upper Body') || 
         ex['Workout Type'].includes('Full Body') ||
         ex['Workout Type'].includes('Push/Pull/Legs'))
      );
    } else if (sessionType === 'lower') {
      filtered = allExercises.filter(ex => 
        ex['Workout Type'] && 
        (ex['Workout Type'].includes('Lower Body') || 
         ex['Workout Type'].includes('Full Body') ||
         ex['Workout Type'].includes('Push/Pull/Legs'))
      );
    } else if (sessionType === 'full') {
      filtered = allExercises.filter(ex => 
        ex['Workout Type'] && ex['Workout Type'].includes('Full Body')
      );
    } else if (['push', 'pull', 'legs'].includes(sessionType)) {
      filtered = allExercises.filter(ex => 
        ex['Workout Type'] && ex['Workout Type'].includes('Push/Pull/Legs')
      );
    }

    setAvailableExercises(filtered);
  }, [allExercises, sessionType]);

  const handleAddExercise = () => {
    if (!selectedExercise) return;

    const newExercise = {
      ...selectedExercise,
      name: selectedExercise['Exercise Name'] || selectedExercise.name,
      sets: 3,
      reps: '10',
      weight: '',
      restSeconds: 90,
      supersetGroup: null
    };

    setExercises([...exercises, newExercise]);
    setSelectedExercise(null);
  };

  const handleRemoveExercise = (index) => {
    setExercises(exercises.filter((_, i) => i !== index));
  };

  const handleExerciseChange = (index, field, value) => {
    setExercises(exercises.map((ex, i) => 
      i === index ? { ...ex, [field]: value } : ex
    ));
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
    setSelectedExercise(null);
    onClose();
  };

  // Future enhancement: drag and drop reordering
  // const moveExercise = (fromIndex, direction) => {
  //   const newExercises = [...exercises];
  //   const toIndex = direction === 'up' ? fromIndex - 1 : fromIndex + 1;
  //   
  //   if (toIndex < 0 || toIndex >= exercises.length) return;
  //   
  //   [newExercises[fromIndex], newExercises[toIndex]] = [newExercises[toIndex], newExercises[fromIndex]];
  //   setExercises(newExercises);
  // };

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

          {/* Exercise Search and Add */}
          <Box>
            <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600 }}>
              Add Exercise
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
              <ExerciseAutocomplete
                value={selectedExercise}
                onChange={(event, newValue) => setSelectedExercise(newValue)}
                availableExercises={availableExercises}
                label="Search exercises"
                placeholder="Type to search by name, muscle, or equipment..."
                sx={{ flex: 1 }}
              />
              <Button
                variant="contained"
                color="primary"
                onClick={handleAddExercise}
                disabled={!selectedExercise}
                startIcon={<AddIcon />}
                sx={{ mt: 0.5 }}
              >
                Add
              </Button>
            </Box>
          </Box>

          {/* Exercise List */}
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
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

            {exercises.length === 0 ? (
              <Paper sx={{ p: 3, textAlign: 'center', bgcolor: 'background.default' }}>
                <Typography variant="body2" color="text.secondary">
                  No exercises added yet. Use the search bar above to add exercises.
                </Typography>
              </Paper>
            ) : (
              <List sx={{ maxHeight: '400px', overflowY: 'auto', p: 0 }}>
                {exercises.map((exercise, index) => (
                  <Paper key={index} sx={{ mb: 1.5, border: '1px solid', borderColor: 'divider' }}>
                    <ListItem
                      sx={{ 
                        flexDirection: 'column', 
                        alignItems: 'stretch',
                        p: 2
                      }}
                    >
                      {/* Exercise Header */}
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <DragIcon sx={{ color: 'text.disabled', cursor: 'grab' }} />
                          <Box>
                            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                              {index + 1}. {exercise.name || exercise['Exercise Name']}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {exercise['Primary Muscle']} • {exercise['Equipment']}
                            </Typography>
                          </Box>
                        </Box>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleRemoveExercise(index)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Box>

                      {/* Exercise Configuration */}
                      <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
                        <TextField
                          size="small"
                          label="Sets"
                          type="number"
                          value={(exercise.sets === '' || exercise.sets === undefined) ? '' : exercise.sets}
                          onChange={(e) => handleExerciseChange(index, 'sets', e.target.value === '' ? '' : (parseInt(e.target.value) || 0))}
                          sx={{ width: '80px' }}
                          inputProps={{ min: 1, max: 10 }}
                        />
                        <TextField
                          size="small"
                          label="Reps"
                          value={exercise.reps === '' ? '' : exercise.reps}
                          onChange={(e) => handleExerciseChange(index, 'reps', e.target.value)}
                          sx={{ width: '100px' }}
                          placeholder="e.g., 10 or 8-12"
                        />
                        <TextField
                          size="small"
                          label="Rest (sec)"
                          type="number"
                          value={(exercise.restSeconds === '' || exercise.restSeconds === undefined) ? '' : exercise.restSeconds}
                          onChange={(e) => handleExerciseChange(index, 'restSeconds', e.target.value === '' ? '' : (parseInt(e.target.value) || 0))}
                          sx={{ width: '100px' }}
                          inputProps={{ min: 0, max: 300 }}
                        />
                      </Box>
                    </ListItem>
                  </Paper>
                ))}
              </List>
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
