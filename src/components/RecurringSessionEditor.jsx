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
  ListItemText,
  IconButton,
  Alert,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Divider
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Add as AddIcon,
  DragIndicator as DragIcon
} from '@mui/icons-material';

/**
 * RecurringSessionEditor - Dialog for editing exercises across recurring workout sessions
 * Allows users to modify exercises for all sessions of the same type within a training block
 */
const RecurringSessionEditor = ({ 
  open, 
  onClose, 
  session, 
  recurringCount,
  allExercises,
  onSave 
}) => {
  const [exercises, setExercises] = useState([]);
  const [availableExercises, setAvailableExercises] = useState([]);
  const [selectedExercise, setSelectedExercise] = useState('');

  useEffect(() => {
    if (session && session.exercises) {
      // Clone exercises for editing
      setExercises(session.exercises.map(ex => ({ ...ex })));
    }
  }, [session]);

  useEffect(() => {
    if (allExercises && session) {
      // Filter available exercises based on session type
      const sessionType = session.type;
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
    }
  }, [allExercises, session]);

  const handleAddExercise = () => {
    if (!selectedExercise) return;

    const exerciseToAdd = availableExercises.find(
      ex => (ex['Exercise Name'] || ex.name) === selectedExercise
    );

    if (exerciseToAdd) {
      setExercises([
        ...exercises,
        {
          ...exerciseToAdd,
          name: exerciseToAdd['Exercise Name'] || exerciseToAdd.name,
          sets: 3,
          reps: '10',
          restTime: 90
        }
      ]);
      setSelectedExercise('');
    }
  };

  const handleRemoveExercise = (index) => {
    setExercises(exercises.filter((_, i) => i !== index));
  };

  const handleExerciseChange = (index, field, value) => {
    const updated = [...exercises];
    updated[index] = {
      ...updated[index],
      [field]: value
    };
    setExercises(updated);
  };

  const handleSave = () => {
    if (exercises.length === 0) {
      alert('Please add at least one exercise');
      return;
    }
    onSave(exercises);
  };

  const getSessionTypeLabel = (type) => {
    const labels = {
      upper: 'Upper Body',
      lower: 'Lower Body',
      full: 'Full Body',
      push: 'Push',
      pull: 'Pull',
      legs: 'Legs'
    };
    return labels[type] || type;
  };

  if (!session) return null;

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>
        Edit Recurring {getSessionTypeLabel(session.type)} Sessions
      </DialogTitle>
      
      <DialogContent>
        <Alert severity="info" sx={{ mb: 2 }}>
          Changes will apply to all {recurringCount} {getSessionTypeLabel(session.type)} sessions 
          in the current training block (until the next deload week).
        </Alert>

        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600 }}>
            Current Exercises ({exercises.length})
          </Typography>
          
          {exercises.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
              No exercises yet. Add exercises below.
            </Typography>
          ) : (
            <List sx={{ 
              bgcolor: 'background.default', 
              borderRadius: 1,
              maxHeight: 300,
              overflowY: 'auto'
            }}>
              {exercises.map((exercise, index) => (
                <ListItem
                  key={index}
                  secondaryAction={
                    <IconButton 
                      edge="end" 
                      onClick={() => handleRemoveExercise(index)}
                      size="small"
                    >
                      <DeleteIcon />
                    </IconButton>
                  }
                  sx={{ 
                    borderBottom: index < exercises.length - 1 ? '1px solid' : 'none',
                    borderColor: 'divider',
                    py: 1.5
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', gap: 2 }}>
                    <DragIcon sx={{ color: 'text.disabled', cursor: 'grab' }} />
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {exercise.name || exercise['Exercise Name']}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                        <TextField
                          size="small"
                          label="Sets"
                          type="number"
                          value={exercise.sets || 3}
                          onChange={(e) => handleExerciseChange(index, 'sets', parseInt(e.target.value))}
                          sx={{ width: 80 }}
                        />
                        <TextField
                          size="small"
                          label="Reps"
                          value={exercise.reps || '10'}
                          onChange={(e) => handleExerciseChange(index, 'reps', e.target.value)}
                          sx={{ width: 100 }}
                        />
                        <TextField
                          size="small"
                          label="Rest (s)"
                          type="number"
                          value={exercise.restTime || 90}
                          onChange={(e) => handleExerciseChange(index, 'restTime', parseInt(e.target.value))}
                          sx={{ width: 100 }}
                        />
                      </Box>
                    </Box>
                  </Box>
                </ListItem>
              ))}
            </List>
          )}
        </Box>

        <Divider sx={{ my: 2 }} />

        <Box>
          <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600 }}>
            Add Exercise
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Select Exercise</InputLabel>
              <Select
                value={selectedExercise}
                label="Select Exercise"
                onChange={(e) => setSelectedExercise(e.target.value)}
              >
                {availableExercises.map((ex, index) => (
                  <MenuItem 
                    key={index} 
                    value={ex['Exercise Name'] || ex.name}
                  >
                    {ex['Exercise Name'] || ex.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleAddExercise}
              disabled={!selectedExercise}
            >
              Add
            </Button>
          </Box>
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button 
          onClick={handleSave} 
          variant="contained" 
          color="primary"
          disabled={exercises.length === 0}
        >
          Save Changes to All {recurringCount} Sessions
        </Button>
      </DialogActions>
    </Dialog>
  );
};

RecurringSessionEditor.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  session: PropTypes.object,
  recurringCount: PropTypes.number,
  allExercises: PropTypes.array,
  onSave: PropTypes.func.isRequired
};

export default RecurringSessionEditor;
