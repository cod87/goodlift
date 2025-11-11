/**
 * HiitSessionBuilderDialog - Interactive dialog for building custom HIIT sessions exercise-by-exercise
 * 
 * Features:
 * - Build custom plyometric/HIIT sessions from scratch
 * - Add exercises one at a time using autocomplete search
 * - Configure work/rest intervals and rounds
 * - Choose from various HIIT protocols
 * - Filter exercises by modality and difficulty
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
  Divider,
  Alert,
  FormControlLabel,
  Checkbox
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Add as AddIcon,
  DirectionsRun as HiitIcon,
  DragIndicator as DragIcon
} from '@mui/icons-material';
import ExerciseAutocomplete from './ExerciseAutocomplete';
import { HIIT_PROTOCOLS } from '../utils/hiitSessionGenerator';

const HiitSessionBuilderDialog = ({ 
  open, 
  onClose, 
  onSave,
  allExercises = []
}) => {
  const [modality, setModality] = useState('plyometric');
  const [protocol, setProtocol] = useState('BALANCED');
  const [exercises, setExercises] = useState([]);
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [availableExercises, setAvailableExercises] = useState([]);
  const [rounds, setRounds] = useState(3);
  const [lowerImpact, setLowerImpact] = useState(false);

  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      setModality('plyometric');
      setProtocol('BALANCED');
      setExercises([]);
      setSelectedExercise(null);
      setRounds(3);
      setLowerImpact(false);
    }
  }, [open]);

  // Filter exercises based on modality
  useEffect(() => {
    if (!allExercises || allExercises.length === 0) return;

    let filtered = allExercises;

    // Filter for plyometric/bodyweight exercises
    if (modality === 'plyometric' || modality === 'bodyweight') {
      filtered = allExercises.filter(ex => {
        const equipment = ex['Equipment']?.toLowerCase() || '';
        const workoutType = ex['Workout Type']?.toLowerCase() || '';
        const name = ex['Exercise Name']?.toLowerCase() || '';
        
        // Include bodyweight, plyometric, and high-intensity exercises
        return (
          equipment.includes('bodyweight') ||
          equipment.includes('none') ||
          workoutType.includes('hiit') ||
          workoutType.includes('cardio') ||
          name.includes('jump') ||
          name.includes('burpee') ||
          name.includes('sprint') ||
          name.includes('plyo')
        );
      });
    }

    // Apply lower impact filter if selected
    if (lowerImpact && filtered.length > 0) {
      filtered = filtered.filter(ex => {
        const name = ex['Exercise Name']?.toLowerCase() || '';
        // Exclude high-impact movements
        return !(
          name.includes('jump') ||
          name.includes('hop') ||
          name.includes('bound') ||
          name.includes('sprint')
        );
      });
    }

    setAvailableExercises(filtered);
  }, [allExercises, modality, lowerImpact]);

  const handleAddExercise = () => {
    if (!selectedExercise) return;

    const selectedProtocol = HIIT_PROTOCOLS[protocol];

    const newExercise = {
      ...selectedExercise,
      name: selectedExercise['Exercise Name'] || selectedExercise.name,
      workSeconds: selectedProtocol.workSeconds,
      restSeconds: selectedProtocol.restSeconds
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
      alert('Please add at least one exercise to the HIIT session');
      return;
    }

    const selectedProtocol = HIIT_PROTOCOLS[protocol];

    // Calculate total duration
    const warmupDuration = 300; // 5 minutes
    const cooldownDuration = 300; // 5 minutes
    const workDuration = exercises.reduce((sum, ex) => 
      sum + ((ex.workSeconds + ex.restSeconds) * rounds), 0
    );
    const totalDuration = warmupDuration + workDuration + cooldownDuration;

    const session = {
      id: `hiit_session_${Date.now()}`,
      date: Date.now(),
      type: 'hiit',
      exercises: null,
      status: 'planned',
      notes: `Custom ${modality} HIIT - ${selectedProtocol.name}`,
      completedAt: null,
      sessionData: {
        protocol: selectedProtocol,
        modality: modality,
        warmup: {
          duration: warmupDuration,
          exercises: ['Dynamic stretching', 'Light cardio']
        },
        mainWorkout: {
          exercises: exercises,
          rounds: rounds,
          workSeconds: selectedProtocol.workSeconds,
          restSeconds: selectedProtocol.restSeconds
        },
        cooldown: {
          duration: cooldownDuration,
          exercises: ['Static stretching', 'Foam rolling']
        },
        totalDuration: totalDuration,
        lowerImpact: lowerImpact
      }
    };

    onSave(session);
    handleClose();
  };

  const handleClose = () => {
    setExercises([]);
    setSelectedExercise(null);
    onClose();
  };

  const selectedProtocol = HIIT_PROTOCOLS[protocol];

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
          <HiitIcon color="primary" />
          <Typography variant="h6">Build Custom HIIT Session</Typography>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          {/* Protocol Information */}
          <Alert severity="info">
            <Typography variant="subtitle2" gutterBottom>
              <strong>{selectedProtocol.name}</strong>
            </Typography>
            <Typography variant="body2">
              {selectedProtocol.description}
            </Typography>
            <Typography variant="caption" display="block" sx={{ mt: 0.5 }}>
              Work: {selectedProtocol.workSeconds}s | Rest: {selectedProtocol.restSeconds}s
            </Typography>
          </Alert>

          {/* Configuration */}
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <FormControl sx={{ flex: 1, minWidth: '200px' }}>
              <InputLabel>Modality</InputLabel>
              <Select
                value={modality}
                label="Modality"
                onChange={(e) => setModality(e.target.value)}
              >
                <MenuItem value="plyometric">Plyometric HIIT</MenuItem>
                <MenuItem value="bodyweight">Bodyweight HIIT</MenuItem>
              </Select>
            </FormControl>

            <FormControl sx={{ flex: 1, minWidth: '200px' }}>
              <InputLabel>Protocol</InputLabel>
              <Select
                value={protocol}
                label="Protocol"
                onChange={(e) => setProtocol(e.target.value)}
              >
                {Object.entries(HIIT_PROTOCOLS).map(([key, proto]) => (
                  <MenuItem key={key} value={key}>
                    {proto.name} ({proto.workSeconds}:{proto.restSeconds}s)
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              label="Rounds"
              type="number"
              value={rounds}
              onChange={(e) => setRounds(Math.max(1, Math.min(10, parseInt(e.target.value) || 1)))}
              sx={{ width: '120px' }}
              inputProps={{ min: 1, max: 10 }}
            />
          </Box>

          {/* Lower Impact Option */}
          {(modality === 'plyometric' || modality === 'bodyweight') && (
            <FormControlLabel
              control={
                <Checkbox
                  checked={lowerImpact}
                  onChange={(e) => setLowerImpact(e.target.checked)}
                />
              }
              label="Lower Impact (exclude jumps and high-impact moves)"
            />
          )}

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
                placeholder="Type to search plyometric/bodyweight exercises..."
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
            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
              Available exercises: {availableExercises.length}
            </Typography>
          </Box>

          {/* Exercise List */}
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                Exercises ({exercises.length})
              </Typography>
              {exercises.length > 0 && (
                <Chip 
                  label={`${rounds} rounds × ${exercises.length} exercises`} 
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
              <List sx={{ maxHeight: '350px', overflowY: 'auto', p: 0 }}>
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

                      {/* Interval Configuration */}
                      <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
                        <TextField
                          size="small"
                          label="Work (sec)"
                          type="number"
                          value={exercise.workSeconds}
                          onChange={(e) => handleExerciseChange(index, 'workSeconds', parseInt(e.target.value) || selectedProtocol.workSeconds)}
                          sx={{ width: '110px' }}
                          inputProps={{ min: 10, max: 120 }}
                        />
                        <TextField
                          size="small"
                          label="Rest (sec)"
                          type="number"
                          value={exercise.restSeconds}
                          onChange={(e) => handleExerciseChange(index, 'restSeconds', parseInt(e.target.value) || selectedProtocol.restSeconds)}
                          sx={{ width: '110px' }}
                          inputProps={{ min: 0, max: 180 }}
                        />
                        <Box sx={{ display: 'flex', alignItems: 'center', px: 1 }}>
                          <Typography variant="caption" color="text.secondary">
                            Total per round: {exercise.workSeconds + exercise.restSeconds}s
                          </Typography>
                        </Box>
                      </Box>
                    </ListItem>
                  </Paper>
                ))}
              </List>
            )}
          </Box>

          {/* Summary */}
          {exercises.length > 0 && (
            <Paper sx={{ p: 2, bgcolor: 'background.default' }}>
              <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600 }}>
                Session Summary
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                <Typography variant="caption" color="text.secondary">
                  Warmup: 5 minutes
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Main workout: {rounds} rounds × {exercises.length} exercises = {
                    Math.round(exercises.reduce((sum, ex) => 
                      sum + ((ex.workSeconds + ex.restSeconds) * rounds), 0) / 60)
                  } minutes
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Cooldown: 5 minutes
                </Typography>
                <Divider sx={{ my: 0.5 }} />
                <Typography variant="caption" sx={{ fontWeight: 600 }}>
                  Total duration: ~{
                    Math.round((300 + 300 + exercises.reduce((sum, ex) => 
                      sum + ((ex.workSeconds + ex.restSeconds) * rounds), 0)) / 60)
                  } minutes
                </Typography>
              </Box>
            </Paper>
          )}
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
          Save HIIT Session
        </Button>
      </DialogActions>
    </Dialog>
  );
};

HiitSessionBuilderDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
  allExercises: PropTypes.array
};

export default HiitSessionBuilderDialog;
