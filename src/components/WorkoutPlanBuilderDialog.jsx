/**
 * WorkoutPlanBuilderDialog - Interactive dialog for building workout plans session-by-session
 * 
 * Features:
 * - Build workout plans from scratch, adding sessions one at a time
 * - Configure plan metadata (name, goal, experience level)
 * - Add/edit/remove sessions interactively
 * - Use SessionBuilderDialog for creating each session
 * - View and manage all sessions in the plan
 */

import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useQuery } from '@tanstack/react-query';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Chip,
  Paper,
  Stepper,
  Step,
  StepLabel,
  Divider,
  Alert
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Edit as EditIcon,
  Add as AddIcon,
  CalendarMonth as CalendarIcon,
  FitnessCenter as ExerciseIcon
} from '@mui/icons-material';
import SessionBuilderDialog from './SessionBuilderDialog';

const WorkoutPlanBuilderDialog = ({ 
  open, 
  onClose, 
  onSave 
}) => {
  const [activeStep, setActiveStep] = useState(0);
  const [planName, setPlanName] = useState('');
  const [goal, setGoal] = useState('general_fitness');
  const [experienceLevel, setExperienceLevel] = useState('intermediate');
  const [sessions, setSessions] = useState([]);
  const [showSessionBuilder, setShowSessionBuilder] = useState(false);
  const [editingSession, setEditingSession] = useState(null);
  const [editingSessionIndex, setEditingSessionIndex] = useState(null);

  // Load exercises data
  const { data: allExercises = [] } = useQuery({
    queryKey: ['exercises'],
    queryFn: async () => {
      const response = await fetch(`${import.meta.env.BASE_URL}data/exercises.json`);
      if (!response.ok) throw new Error('Failed to load exercises');
      return response.json();
    },
    staleTime: Infinity,
  });

  useEffect(() => {
    if (open) {
      // Reset state when dialog opens
      setActiveStep(0);
      setPlanName('');
      setGoal('general_fitness');
      setExperienceLevel('intermediate');
      setSessions([]);
    }
  }, [open]);

  const steps = ['Plan Details', 'Add Sessions', 'Review & Save'];

  const handleNext = () => {
    if (activeStep === 0 && !planName.trim()) {
      alert('Please enter a plan name');
      return;
    }
    setActiveStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };

  const handleAddSession = () => {
    // Note: Session dates are calculated in SessionBuilderDialog based on existing sessions
    setEditingSession(null);
    setEditingSessionIndex(null);
    setShowSessionBuilder(true);
  };

  const handleEditSession = (session, index) => {
    setEditingSession(session);
    setEditingSessionIndex(index);
    setShowSessionBuilder(true);
  };

  const handleDeleteSession = (index) => {
    if (window.confirm('Are you sure you want to delete this session?')) {
      setSessions(sessions.filter((_, i) => i !== index));
    }
  };

  const handleSaveSession = (session) => {
    if (editingSessionIndex !== null) {
      // Update existing session
      setSessions(sessions.map((s, i) => i === editingSessionIndex ? session : s));
    } else {
      // Add new session
      setSessions([...sessions, session]);
    }
    setShowSessionBuilder(false);
    setEditingSession(null);
    setEditingSessionIndex(null);
  };

  const handleSavePlan = () => {
    if (sessions.length === 0) {
      alert('Please add at least one session to the plan');
      return;
    }

    // Calculate plan duration based on sessions
    const sortedSessions = [...sessions].sort((a, b) => a.date - b.date);
    const startDate = sortedSessions[0].date;
    const endDate = sortedSessions[sortedSessions.length - 1].date;
    const durationDays = Math.ceil((endDate - startDate) / (24 * 60 * 60 * 1000)) + 1;

    // Count unique session types
    const sessionTypes = [...new Set(sessions.map(s => s.type))];

    // Estimate days per week (approximate)
    const daysPerWeek = Math.round(sessions.length / (durationDays / 7)) || 3;

    const plan = {
      id: `plan_${Date.now()}`,
      name: planName,
      startDate: startDate,
      endDate: endDate,
      duration: durationDays,
      goal: goal,
      experienceLevel: experienceLevel,
      daysPerWeek: Math.min(daysPerWeek, 7),
      splitType: 'custom',
      sessionTypes: sessionTypes,
      equipmentAvailable: ['all'],
      sessions: sortedSessions,
      deloadWeeks: [],
      periodization: {
        type: 'custom',
        deloadFrequency: null,
        volumeProgression: 'manual',
      },
      created: Date.now(),
      modified: Date.now(),
      active: false
    };

    onSave(plan);
    handleClose();
  };

  const handleClose = () => {
    setActiveStep(0);
    setPlanName('');
    setGoal('general_fitness');
    setExperienceLevel('intermediate');
    setSessions([]);
    setShowSessionBuilder(false);
    setEditingSession(null);
    setEditingSessionIndex(null);
    onClose();
  };

  const getSessionTypeLabel = (type) => {
    const labels = {
      full: 'Full Body',
      upper: 'Upper Body',
      lower: 'Lower Body',
      push: 'Push',
      pull: 'Pull',
      legs: 'Legs'
    };
    return labels[type] || type;
  };

  return (
    <>
      <Dialog 
        open={open} 
        onClose={handleClose} 
        maxWidth="md" 
        fullWidth
        PaperProps={{ sx: { minHeight: '70vh' } }}
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CalendarIcon color="primary" />
            <Typography variant="h6">Build Custom Workout Plan</Typography>
          </Box>
        </DialogTitle>

        <DialogContent>
          <Box sx={{ pt: 2 }}>
            {/* Stepper */}
            <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
              {steps.map((label) => (
                <Step key={label}>
                  <StepLabel>{label}</StepLabel>
                </Step>
              ))}
            </Stepper>

            {/* Step 0: Plan Details */}
            {activeStep === 0 && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <Alert severity="info">
                  Create a custom workout plan by building it session-by-session. 
                  Start by entering your plan details.
                </Alert>

                <TextField
                  fullWidth
                  label="Plan Name"
                  value={planName}
                  onChange={(e) => setPlanName(e.target.value)}
                  placeholder="e.g., My Custom 4-Week Plan"
                  required
                />

                <FormControl fullWidth>
                  <InputLabel>Goal</InputLabel>
                  <Select
                    value={goal}
                    label="Goal"
                    onChange={(e) => setGoal(e.target.value)}
                  >
                    <MenuItem value="strength">Strength</MenuItem>
                    <MenuItem value="hypertrophy">Muscle Gain</MenuItem>
                    <MenuItem value="fat_loss">Fat Loss</MenuItem>
                    <MenuItem value="general_fitness">General Fitness</MenuItem>
                  </Select>
                </FormControl>

                <FormControl fullWidth>
                  <InputLabel>Experience Level</InputLabel>
                  <Select
                    value={experienceLevel}
                    label="Experience Level"
                    onChange={(e) => setExperienceLevel(e.target.value)}
                  >
                    <MenuItem value="beginner">Beginner</MenuItem>
                    <MenuItem value="intermediate">Intermediate</MenuItem>
                    <MenuItem value="advanced">Advanced</MenuItem>
                  </Select>
                </FormControl>
              </Box>
            )}

            {/* Step 1: Add Sessions */}
            {activeStep === 1 && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Alert severity="info">
                  Add workout sessions to your plan. Each session can be customized with specific exercises.
                </Alert>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="h6">
                    Sessions ({sessions.length})
                  </Typography>
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<AddIcon />}
                    onClick={handleAddSession}
                  >
                    Add Session
                  </Button>
                </Box>

                {sessions.length === 0 ? (
                  <Paper sx={{ p: 4, textAlign: 'center', bgcolor: 'background.default' }}>
                    <ExerciseIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
                    <Typography variant="body1" color="text.secondary" gutterBottom>
                      No sessions added yet
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      Click "Add Session" to start building your workout plan
                    </Typography>
                  </Paper>
                ) : (
                  <List sx={{ maxHeight: '400px', overflowY: 'auto' }}>
                    {sessions.map((session, index) => (
                      <Paper key={index} sx={{ mb: 1.5, border: '1px solid', borderColor: 'divider' }}>
                        <ListItem
                          secondaryAction={
                            <Box sx={{ display: 'flex', gap: 0.5 }}>
                              <IconButton
                                size="small"
                                onClick={() => handleEditSession(session, index)}
                              >
                                <EditIcon />
                              </IconButton>
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => handleDeleteSession(index)}
                              >
                                <DeleteIcon />
                              </IconButton>
                            </Box>
                          }
                        >
                          <ListItemText
                            primary={
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                                  Session {index + 1}
                                </Typography>
                                <Chip 
                                  label={getSessionTypeLabel(session.type)} 
                                  size="small" 
                                  color="primary"
                                />
                              </Box>
                            }
                            secondary={
                              <Typography variant="body2" color="text.secondary">
                                {session.exercises?.length || 0} exercise{session.exercises?.length !== 1 ? 's' : ''}
                                {session.exercises?.length > 0 && 
                                  ` • ${session.exercises.slice(0, 2).map(e => e.name || e['Exercise Name']).join(', ')}${session.exercises.length > 2 ? '...' : ''}`
                                }
                              </Typography>
                            }
                          />
                        </ListItem>
                      </Paper>
                    ))}
                  </List>
                )}
              </Box>
            )}

            {/* Step 2: Review & Save */}
            {activeStep === 2 && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <Alert severity="success">
                  Review your custom workout plan before saving.
                </Alert>

                <Paper sx={{ p: 2, bgcolor: 'background.default' }}>
                  <Typography variant="h6" gutterBottom>Plan Summary</Typography>
                  <Divider sx={{ my: 1.5 }} />
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary">Plan Name:</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>{planName}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary">Goal:</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {goal === 'general_fitness' ? 'General Fitness' : 
                         goal === 'hypertrophy' ? 'Muscle Gain' :
                         goal === 'fat_loss' ? 'Fat Loss' : 'Strength'}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary">Experience Level:</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {experienceLevel.charAt(0).toUpperCase() + experienceLevel.slice(1)}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary">Total Sessions:</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>{sessions.length}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary">Total Exercises:</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {sessions.reduce((sum, s) => sum + (s.exercises?.length || 0), 0)}
                      </Typography>
                    </Box>
                  </Box>
                </Paper>

                <Box>
                  <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600 }}>
                    Session Details
                  </Typography>
                  <List sx={{ maxHeight: '300px', overflowY: 'auto' }}>
                    {sessions.map((session, index) => (
                      <Paper key={index} sx={{ mb: 1, p: 1.5, border: '1px solid', borderColor: 'divider' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                            Session {index + 1}
                          </Typography>
                          <Chip label={getSessionTypeLabel(session.type)} size="small" />
                        </Box>
                        <Typography variant="caption" color="text.secondary">
                          {session.exercises?.length || 0} exercises
                        </Typography>
                      </Paper>
                    ))}
                  </List>
                </Box>
              </Box>
            )}
          </Box>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleClose}>Cancel</Button>
          <Box sx={{ flex: 1 }} />
          {activeStep > 0 && (
            <Button onClick={handleBack}>Back</Button>
          )}
          {activeStep < steps.length - 1 ? (
            <Button 
              variant="contained" 
              onClick={handleNext}
              disabled={activeStep === 0 && !planName.trim()}
            >
              Next
            </Button>
          ) : (
            <Button 
              variant="contained" 
              color="primary"
              onClick={handleSavePlan}
              disabled={sessions.length === 0}
            >
              Save Plan
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Session Builder Dialog */}
      <SessionBuilderDialog
        open={showSessionBuilder}
        onClose={() => {
          setShowSessionBuilder(false);
          setEditingSession(null);
          setEditingSessionIndex(null);
        }}
        onSave={handleSaveSession}
        initialSession={editingSession}
        allExercises={allExercises}
        sessionDate={
          editingSession?.date || 
          (sessions.length > 0 
            ? sessions[sessions.length - 1].date + (24 * 60 * 60 * 1000)
            : Date.now())
        }
      />
    </>
  );
};

WorkoutPlanBuilderDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired
};

export default WorkoutPlanBuilderDialog;
