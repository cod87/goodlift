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
  Divider,
  Paper,
  Card,
  CardContent
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Add as AddIcon,
  DragIndicator as DragIcon
} from '@mui/icons-material';
import ExerciseAutocomplete from './ExerciseAutocomplete';

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
  const [selectedExercise, setSelectedExercise] = useState(null);

  useEffect(() => {
    if (session && session.exercises) {
      // Clone exercises for editing, preserving superset groups
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

    setExercises([
      ...exercises,
      {
        ...selectedExercise,
        name: selectedExercise['Exercise Name'] || selectedExercise.name,
        sets: 3,
        reps: '10',
        restTime: 90,
        supersetGroup: null // New exercises don't have a superset group by default
      }
    ]);
    setSelectedExercise(null);
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
      alert('Please add at least one exercise before saving.');
      return;
    }

    // Validate all exercises have valid sets and reps
    const invalidExercises = exercises.filter(ex => 
      !ex.sets || ex.sets < 1 || !ex.reps || ex.reps === '' || 
      !ex.restTime || ex.restTime < 0
    );

    if (invalidExercises.length > 0) {
      alert('Please ensure all exercises have valid sets, reps, and rest time.');
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

  // Group exercises by superset
  const groupedExercises = () => {
    const groups = [];
    const grouped = new Map();
    
    exercises.forEach((exercise, index) => {
      const groupId = exercise.supersetGroup;
      if (groupId) {
        if (!grouped.has(groupId)) {
          grouped.set(groupId, []);
        }
        grouped.get(groupId).push({ exercise, index });
      } else {
        // Exercises without superset group go in their own group
        groups.push({
          id: `single-${index}`,
          isSuperset: false,
          exercises: [{ exercise, index }]
        });
      }
    });
    
    // Add superset groups
    grouped.forEach((exs, groupId) => {
      groups.push({
        id: `superset-${groupId}`,
        isSuperset: true,
        exercises: exs
      });
    });
    
    return groups;
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
        Edit {recurringCount === 1 ? '' : 'Recurring '}{getSessionTypeLabel(session.type)} {recurringCount === 1 ? 'Session' : 'Sessions'}
      </DialogTitle>
      
      <DialogContent>
        <Alert severity="info" sx={{ mb: 2 }}>
          {recurringCount === 1 
            ? `Changes will apply only to this ${getSessionTypeLabel(session.type)} session.`
            : `Changes will apply to all ${recurringCount} ${getSessionTypeLabel(session.type)} sessions in the current training block (until the next deload week).`
          }
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
            <Box sx={{ 
              maxHeight: 400,
              overflowY: 'auto'
            }}>
              {groupedExercises().map((group) => (
                <Card 
                  key={group.id} 
                  variant="outlined" 
                  sx={{ 
                    mb: 2,
                    bgcolor: group.isSuperset ? 'action.hover' : 'background.paper',
                    borderColor: group.isSuperset ? 'primary.main' : 'divider',
                    borderWidth: group.isSuperset ? 2 : 1,
                    position: 'relative',
                    // Add bracket-like visual indicators for supersets
                    ...(group.isSuperset && {
                      '&::before': {
                        content: '""',
                        position: 'absolute',
                        left: 0,
                        top: 0,
                        bottom: 0,
                        width: 4,
                        bgcolor: 'primary.main',
                        borderRadius: '4px 0 0 4px'
                      }
                    })
                  }}
                >
                  {group.isSuperset && (
                    <Box sx={{ 
                      bgcolor: 'primary.main', 
                      color: 'primary.contrastText', 
                      px: 2, 
                      py: 0.75,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 1
                    }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Typography variant="caption" sx={{ fontWeight: 700, fontSize: '0.75rem', letterSpacing: '0.5px' }}>
                          ⦗ SUPERSET ⦘
                        </Typography>
                        <Typography variant="caption" sx={{ opacity: 0.9, fontSize: '0.7rem' }}>
                          ({group.exercises.length} exercises)
                        </Typography>
                      </Box>
                    </Box>
                  )}
                  <CardContent sx={{ p: 1, '&:last-child': { pb: 1 } }}>
                    {group.exercises.map(({ exercise, index }, groupIndex) => (
                      <Box
                        key={index}
                        sx={{ 
                          borderBottom: groupIndex < group.exercises.length - 1 ? '1px solid' : 'none',
                          borderColor: 'divider',
                          py: 1.5,
                          px: 1
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', gap: 2 }}>
                          <DragIcon sx={{ color: 'text.disabled', cursor: 'grab' }} />
                          <Box sx={{ flex: 1 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: 1, mb: 1 }}>
                              <ExerciseAutocomplete
                                value={exercise}
                                onChange={(event, newValue) => {
                                  if (newValue) {
                                    handleExerciseChange(index, 'name', newValue['Exercise Name'] || newValue.name);
                                    handleExerciseChange(index, 'Exercise Name', newValue['Exercise Name']);
                                    handleExerciseChange(index, 'Primary Muscle', newValue['Primary Muscle']);
                                    handleExerciseChange(index, 'Secondary Muscles', newValue['Secondary Muscles']);
                                    handleExerciseChange(index, 'Equipment', newValue['Equipment']);
                                    handleExerciseChange(index, 'Movement Pattern', newValue['Movement Pattern']);
                                    handleExerciseChange(index, 'Difficulty', newValue['Difficulty']);
                                    handleExerciseChange(index, 'Workout Type', newValue['Workout Type']);
                                  }
                                }}
                                availableExercises={availableExercises}
                                label="Exercise"
                                placeholder="Type to search and swap exercise..."
                                sx={{ flex: 1 }}
                              />
                              <IconButton 
                                edge="end" 
                                onClick={() => handleRemoveExercise(index)}
                                size="small"
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Box>
                            {exercise['Primary Muscle'] && (
                              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                                {exercise['Primary Muscle']} • {exercise['Equipment']}
                              </Typography>
                            )}
                            <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                              <TextField
                                size="small"
                                label="Sets"
                                type="number"
                                value={exercise.sets || 3}
                                onChange={(e) => handleExerciseChange(index, 'sets', parseInt(e.target.value))}
                                sx={{ width: 80 }}
                                inputProps={{ min: 1 }}
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
                                inputProps={{ min: 0 }}
                              />
                            </Box>
                          </Box>
                        </Box>
                      </Box>
                    ))}
                  </CardContent>
                </Card>
              ))}
            </Box>
          )}
        </Box>

        <Divider sx={{ my: 2 }} />

        <Box>
          <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600 }}>
            Add Exercise
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
            Search by name, muscle group, equipment, or any combination (e.g., &quot;chest dumbbell&quot;)
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <ExerciseAutocomplete
              value={selectedExercise}
              onChange={(event, newValue) => {
                setSelectedExercise(newValue);
              }}
              availableExercises={availableExercises}
              label="Search exercises"
              placeholder="Type to search..."
            />
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleAddExercise}
              disabled={!selectedExercise}
              sx={{ minWidth: 100 }}
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
