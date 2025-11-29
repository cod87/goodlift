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
  IconButton,
  TextField,
  Stack,
  Card,
  CardContent,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  Divider,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
} from '@mui/material';
import {
  Close,
  ExpandMore,
  Delete,
  Edit,
  Save,
  FitnessCenter,
  DragIndicator,
} from '@mui/icons-material';
import ExerciseAutocomplete from './ExerciseAutocomplete';

/**
 * WorkoutDetailEditor - Component for editing workout details including exercises, supersets, and set values
 * Allows granular editing at exercise and superset levels, with the ability to modify weight/reps for existing sets
 * Note: Set count is fixed - users cannot add or remove sets during schedule editing
 */
const WorkoutDetailEditor = ({ open, onClose, workout, dayOfWeek, onSave }) => {
  const [workoutName, setWorkoutName] = useState('');
  const [exercises, setExercises] = useState([]);
  const [availableExercises, setAvailableExercises] = useState([]);
  const [hasChanges, setHasChanges] = useState(false);

  // Load exercises data
  useEffect(() => {
    const loadExercises = async () => {
      try {
        const response = await fetch(`${import.meta.env.BASE_URL}data/exercises.json`);
        const data = await response.json();
        setAvailableExercises(data);
      } catch (error) {
        console.error('Error loading exercises:', error);
        setAvailableExercises([]);
      }
    };
    loadExercises();
  }, []);

  // Initialize state from workout prop
  useEffect(() => {
    if (workout) {
      setWorkoutName(workout.sessionName || '');
      // Deep clone exercises to avoid mutating the original
      const clonedExercises = (workout.exercises || []).map((ex, idx) => ({
        ...ex,
        sets: ex.sets ? [...ex.sets] : [{ weight: 0, reps: 10 }, { weight: 0, reps: 10 }, { weight: 0, reps: 10 }],
        name: ex.name || ex.exerciseName || ex['Exercise Name'] || 'Unknown Exercise',
        muscleGroup: ex.muscleGroup || ex.category || ex['Muscle Group'] || '',
        supersetGroup: ex.supersetGroup !== undefined ? ex.supersetGroup : (idx % 2 === 0 ? Math.floor(idx / 2) : Math.floor(idx / 2)), // Assign default groups in pairs
      }));
      setExercises(clonedExercises);
    }
  }, [workout]);

  const handleAddExercise = (selectedExercise) => {
    if (!selectedExercise) return;

    // Find the highest superset group number
    const maxGroup = exercises.length > 0 
      ? Math.max(...exercises.map(ex => ex.supersetGroup || 0))
      : -1;

    const newExercise = {
      id: `ex_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      name: selectedExercise['Exercise Name'] || selectedExercise.name,
      exerciseName: selectedExercise['Exercise Name'] || selectedExercise.name,
      muscleGroup: selectedExercise['Muscle Group'] || selectedExercise.category || '',
      category: selectedExercise['Muscle Group'] || selectedExercise.category || '',
      supersetGroup: maxGroup + 1, // New exercises get their own group by default
      sets: [
        { weight: 0, reps: 10 },
        { weight: 0, reps: 10 },
        { weight: 0, reps: 10 },
      ],
    };

    setExercises([...exercises, newExercise]);
    setHasChanges(true);
  };

  const handleRemoveExercise = (index) => {
    const updated = exercises.filter((_, i) => i !== index);
    setExercises(updated);
    setHasChanges(true);
  };

  const handleEditExerciseName = (index, newName) => {
    const updated = [...exercises];
    updated[index] = {
      ...updated[index],
      name: newName,
      exerciseName: newName,
    };
    setExercises(updated);
    setHasChanges(true);
  };



  const handleUpdateSet = (exerciseIndex, setIndex, field, value) => {
    const updated = [...exercises];
    const exercise = updated[exerciseIndex];
    
    exercise.sets[setIndex] = {
      ...exercise.sets[setIndex],
      [field]: value === '' ? '' : (parseFloat(value) || 0),
    };
    
    setExercises(updated);
    setHasChanges(true);
  };

  const handleChangeSupersetGroup = (exerciseIndex, newGroup) => {
    const updated = [...exercises];
    updated[exerciseIndex] = {
      ...updated[exerciseIndex],
      supersetGroup: parseInt(newGroup),
    };
    setExercises(updated);
    setHasChanges(true);
  };

  const handleSave = () => {
    const updatedWorkout = {
      ...workout,
      sessionName: workoutName || workout.sessionName,
      exercises: exercises,
      lastModified: new Date().toISOString(),
    };

    onSave(updatedWorkout);
    setHasChanges(false);
  };

  const handleClose = () => {
    if (hasChanges) {
      if (window.confirm('You have unsaved changes. Are you sure you want to close?')) {
        onClose();
      }
    } else {
      onClose();
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          maxHeight: '90vh',
        }
      }}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            <Typography variant="h6" fontWeight={700}>
              Edit Workout Details
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {dayOfWeek} - Manage exercises, supersets, and set values
            </Typography>
          </Box>
          <IconButton onClick={handleClose} size="small">
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ pb: 1 }}>
        <Stack spacing={3}>
          {/* Workout Name */}
          <TextField
            label="Workout Name"
            value={workoutName}
            onChange={(e) => {
              setWorkoutName(e.target.value);
              setHasChanges(true);
            }}
            fullWidth
            variant="outlined"
            size="small"
          />

          {/* Info Alert */}
          <Alert severity="info" sx={{ fontSize: '0.875rem' }}>
            Add or remove exercises. Configure superset groups. Edit exercise names and modify weight/reps for existing sets. Changes are preserved without data loss.
          </Alert>

          {/* Add Exercise */}
          <Card variant="outlined">
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <ExerciseAutocomplete
                  allExercises={availableExercises}
                  onExerciseSelect={handleAddExercise}
                  label="Add Exercise"
                  placeholder="Search and add exercise..."
                />
                <Chip
                  icon={<Add />}
                  label={`${exercises.length} exercises`}
                  color="primary"
                  variant="outlined"
                />
              </Box>
            </CardContent>
          </Card>

          {/* Exercises List */}
          {exercises.length === 0 ? (
            <Alert severity="warning">
              No exercises in this workout. Add exercises above to get started.
            </Alert>
          ) : (
            <Stack spacing={2}>
              {exercises.map((exercise, exIdx) => (
                <Accordion key={exercise.id || exIdx} defaultExpanded={exIdx === 0}>
                  <AccordionSummary
                    expandIcon={<ExpandMore />}
                    sx={{
                      '&:hover': {
                        backgroundColor: 'action.hover',
                      },
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1 }}>
                      <DragIndicator sx={{ color: 'text.secondary' }} />
                      <FitnessCenter sx={{ color: 'primary.main' }} />
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="subtitle1" fontWeight={600}>
                          {exercise.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {exercise.muscleGroup} • {exercise.sets?.length || 0} sets
                        </Typography>
                      </Box>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveExercise(exIdx);
                        }}
                      >
                        <Delete fontSize="small" />
                      </IconButton>
                    </Box>
                  </AccordionSummary>
                  
                  <AccordionDetails>
                    <Stack spacing={2}>
                      {/* Exercise Name Editor */}
                      <Box>
                        <TextField
                          label="Exercise Name"
                          value={exercise.name}
                          onChange={(e) => handleEditExerciseName(exIdx, e.target.value)}
                          fullWidth
                          size="small"
                          InputProps={{
                            endAdornment: (
                              <InputAdornment position="end">
                                <Edit fontSize="small" />
                              </InputAdornment>
                            ),
                          }}
                        />
                      </Box>

                      {/* Superset Group Selector */}
                      <Box>
                        <FormControl fullWidth size="small">
                          <InputLabel>Superset Group</InputLabel>
                          <Select
                            value={exercise.supersetGroup !== undefined ? exercise.supersetGroup : 0}
                            label="Superset Group"
                            onChange={(e) => handleChangeSupersetGroup(exIdx, e.target.value)}
                          >
                            {Array.from({ length: exercises.length }, (_, i) => (
                              <MenuItem key={i} value={i}>
                                Group {i + 1}
                                {exercises.filter(ex => ex.supersetGroup === i).length > 1 && 
                                  ` (${exercises.filter(ex => ex.supersetGroup === i).length} exercises)`
                                }
                              </MenuItem>
                            ))}
                            <MenuItem value={exercises.length}>
                              New Group {exercises.length + 1}
                            </MenuItem>
                          </Select>
                        </FormControl>
                        <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                          Exercises in the same group will be performed as a superset
                        </Typography>
                      </Box>

                      {/* Sets Editor */}
                      <Box>
                        <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>
                          Sets
                        </Typography>
                        
                        <List dense>
                          {exercise.sets?.map((set, setIdx) => (
                            <Box key={setIdx}>
                              <ListItem
                                sx={{
                                  px: 0,
                                  gap: 1,
                                }}
                              >
                                <Typography
                                  variant="body2"
                                  sx={{ minWidth: 60, fontWeight: 500 }}
                                >
                                  Set {setIdx + 1}
                                </Typography>
                                
                                <TextField
                                  label="Weight"
                                  type="number"
                                  value={set.weight === '' ? '' : set.weight}
                                  onChange={(e) => handleUpdateSet(exIdx, setIdx, 'weight', e.target.value)}
                                  size="small"
                                  sx={{ flex: 1 }}
                                  InputProps={{
                                    endAdornment: <InputAdornment position="end">lbs</InputAdornment>,
                                  }}
                                />
                                
                                <TextField
                                  label="Reps"
                                  type="number"
                                  value={set.reps === '' ? '' : set.reps}
                                  onChange={(e) => handleUpdateSet(exIdx, setIdx, 'reps', e.target.value)}
                                  size="small"
                                  sx={{ flex: 1 }}
                                />
                              </ListItem>
                              {setIdx < exercise.sets.length - 1 && <Divider />}
                            </Box>
                          ))}
                        </List>
                      </Box>
                    </Stack>
                  </AccordionDetails>
                </Accordion>
              ))}
            </Stack>
          )}
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
        <Button onClick={handleClose} color="inherit">
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          startIcon={<Save />}
          disabled={!hasChanges}
        >
          Save Changes
        </Button>
      </DialogActions>
    </Dialog>
  );
};

WorkoutDetailEditor.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  workout: PropTypes.object,
  dayOfWeek: PropTypes.string.isRequired,
  onSave: PropTypes.func.isRequired,
};

export default WorkoutDetailEditor;
