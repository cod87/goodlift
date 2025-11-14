import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  IconButton,
  Stack,
  LinearProgress,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Grid,
  Paper,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  DragIndicator as DragIcon,
  CalendarMonth as CalendarIcon,
} from '@mui/icons-material';
import CustomWorkoutWizard from '../PlanBuilder/CustomWorkoutWizard';
import FitnessPlanWizard from '../PlanBuilder/FitnessPlanWizard';
import {
  getPlanStatistics
} from '../../utils/workoutPlanGenerator';
import {
  getActivePlan,
  saveWorkoutPlan,
} from '../../utils/storage';

/**
 * ViewPlanTab - Shows active plan with calendar view and drag-and-drop session management
 * Displays only the active plan with ability to reorder, add, and remove sessions
 */
const PlanInfoTab = ({ currentPlan }) => {
  const [activePlan, setActivePlanState] = useState(null);
  const [showPlanCreationModal, setShowPlanCreationModal] = useState(false);
  const [editingSession, setEditingSession] = useState(null);
  const [editedSessionData, setEditedSessionData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [draggedSession, setDraggedSession] = useState(null);

  useEffect(() => {
    loadPlan();
  }, [currentPlan]);

  const loadPlan = async () => {
    setLoading(true);
    try {
      const active = await getActivePlan();
      setActivePlanState(active);
    } catch (error) {
      console.error('Error loading plan:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditSession = (session, index) => {
    setEditingSession(index);
    setEditedSessionData({ ...session });
  };

  const handleSaveSession = async () => {
    if (!activePlan || editingSession === null || !editedSessionData) return;

    try {
      const updatedPlan = { ...activePlan };
      updatedPlan.sessions[editingSession] = editedSessionData;
      await saveWorkoutPlan(updatedPlan);
      await loadPlan();
      setEditingSession(null);
      setEditedSessionData(null);
    } catch (error) {
      console.error('Error saving session:', error);
      alert('Failed to save session changes');
    }
  };

  const handleCancelEdit = () => {
    setEditingSession(null);
    setEditedSessionData(null);
  };

  const handleSessionFieldChange = (field, value) => {
    setEditedSessionData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleDeleteSession = async (index) => {
    if (!activePlan || !window.confirm('Are you sure you want to delete this session?')) return;

    try {
      const updatedPlan = { ...activePlan };
      updatedPlan.sessions.splice(index, 1);
      await saveWorkoutPlan(updatedPlan);
      await loadPlan();
    } catch (error) {
      console.error('Error deleting session:', error);
      alert('Failed to delete session');
    }
  };

  const handleAddSession = async () => {
    if (!activePlan) return;

    const today = new Date();
    const lastSession = activePlan.sessions && activePlan.sessions.length > 0
      ? activePlan.sessions[activePlan.sessions.length - 1]
      : null;

    let newDate = new Date(today);
    if (lastSession && lastSession.date) {
      const lastDate = new Date(lastSession.date);
      newDate = new Date(lastDate);
      newDate.setDate(lastDate.getDate() + 1);
    }

    const newSession = {
      id: `session-${Date.now()}`,
      date: newDate.toISOString(),
      type: 'strength',
      exercises: [],
    };

    try {
      const updatedPlan = { ...activePlan };
      if (!updatedPlan.sessions) {
        updatedPlan.sessions = [];
      }
      updatedPlan.sessions.push(newSession);
      await saveWorkoutPlan(updatedPlan);
      await loadPlan();
    } catch (error) {
      console.error('Error adding session:', error);
      alert('Failed to add session');
    }
  };

  const handleDragStart = (e, index) => {
    setDraggedSession(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e, targetIndex) => {
    e.preventDefault();
    
    if (draggedSession === null || draggedSession === targetIndex || !activePlan) return;

    try {
      const updatedPlan = { ...activePlan };
      const sessions = [...updatedPlan.sessions];
      const [movedSession] = sessions.splice(draggedSession, 1);
      sessions.splice(targetIndex, 0, movedSession);
      
      updatedPlan.sessions = sessions;
      await saveWorkoutPlan(updatedPlan);
      await loadPlan();
      setDraggedSession(null);
    } catch (error) {
      console.error('Error reordering sessions:', error);
      alert('Failed to reorder sessions');
    }
  };

  const getGoalLabel = (goal) => {
    const labels = {
      strength: 'Strength',
      hypertrophy: 'Muscle Gain',
      fat_loss: 'Fat Loss',
      general_fitness: 'General Fitness'
    };
    return labels[goal] || goal;
  };

  const getExperienceLabel = (level) => {
    const labels = {
      beginner: 'Beginner',
      intermediate: 'Intermediate',
      advanced: 'Advanced'
    };
    return labels[level] || level;
  };

  if (loading) {
    return (
      <Box sx={{ textAlign: 'center', py: 6 }}>
        <Typography variant="body1" color="text.secondary">
          Loading plan information...
        </Typography>
      </Box>
    );
  }

  if (!activePlan) {
    return (
      <Box sx={{ textAlign: 'center', py: 6 }}>
        <Typography variant="h5" color="text.secondary" sx={{ mb: 2 }}>
          No Active Plan
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          Create a workout plan to get started with structured training
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => setShowPlanCreationModal(true)}
          size="large"
        >
          Create New Plan
        </Button>

        <CustomWorkoutWizard
          open={showPlanCreationModal}
          onClose={() => setShowPlanCreationModal(false)}
          onPlanCreated={() => {
            loadPlan();
            setShowPlanCreationModal(false);
          }}
        />
      </Box>
    );
  }

  // Safely get plan statistics
  const stats = activePlan && activePlan.sessions ? getPlanStatistics(activePlan) : {
    completedSessions: 0,
    totalSessions: 0,
    completionRate: 0
  };

  return (
    <Box>
      {/* Active Plan Details */}
      <Card elevation={2} sx={{ mb: 3, borderRadius: 3 }}>
        <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
          <Stack spacing={2}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <Box sx={{ flex: 1 }}>
                <Typography variant="overline" sx={{ color: 'primary.main', fontWeight: 600 }}>
                  Active Plan
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 700, color: 'text.primary', mb: 1 }}>
                  {activePlan.name}
                </Typography>
              </Box>
              <Button
                size="small"
                startIcon={<AddIcon />}
                onClick={() => setShowPlanCreationModal(true)}
                sx={{ color: 'secondary.main' }}
              >
                New Plan
              </Button>
            </Box>

            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Chip label={getGoalLabel(activePlan.goal)} size="small" color="primary" />
              <Chip label={`${activePlan.daysPerWeek}x per week`} size="small" />
              <Chip label={`${activePlan.duration} days`} size="small" />
              <Chip label={getExperienceLabel(activePlan.experienceLevel)} size="small" />
            </Box>

            <Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Progress: {stats.completedSessions}/{stats.totalSessions} sessions ({Math.round(stats.completionRate)}%)
              </Typography>
              <LinearProgress
                variant="determinate"
                value={stats.completionRate}
                sx={{ height: 8, borderRadius: 4 }}
              />
            </Box>

            {activePlan.notes && (
              <Box>
                <Typography variant="body2" color="text.secondary">
                  <strong>Notes:</strong> {activePlan.notes}
                </Typography>
              </Box>
            )}
          </Stack>
        </CardContent>
      </Card>

      {/* Calendar View - Workout Sessions */}
      <Card elevation={2} sx={{ borderRadius: 3 }}>
        <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
              <CalendarIcon /> Workout Calendar
            </Typography>
            <Button
              size="small"
              startIcon={<AddIcon />}
              onClick={handleAddSession}
              variant="outlined"
              color="primary"
            >
              Add Session
            </Button>
          </Box>

          {activePlan.sessions && activePlan.sessions.length > 0 ? (
            <Grid container spacing={2}>
              {activePlan.sessions.map((session, index) => {
                const isEditing = editingSession === index;
                const displaySession = isEditing ? editedSessionData : session;
                const sessionDate = new Date(displaySession.date);

                return (
                  <Grid item xs={12} sm={6} md={4} key={session.id || index}>
                    <Paper
                      elevation={draggedSession === index ? 8 : 2}
                      draggable={!isEditing}
                      onDragStart={(e) => handleDragStart(e, index)}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, index)}
                      sx={{
                        p: 2,
                        cursor: isEditing ? 'default' : 'grab',
                        opacity: draggedSession === index ? 0.5 : 1,
                        transition: 'all 0.2s',
                        border: '2px solid',
                        borderColor: draggedSession === index ? 'primary.main' : 'divider',
                        '&:hover': {
                          borderColor: 'primary.main',
                          transform: isEditing ? 'none' : 'translateY(-4px)',
                        },
                      }}
                    >
                      {isEditing ? (
                        <Stack spacing={2}>
                          <Typography variant="caption" color="text.secondary">
                            {sessionDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                          </Typography>
                          
                          <FormControl fullWidth size="small">
                            <InputLabel>Session Type</InputLabel>
                            <Select
                              value={editedSessionData.type}
                              label="Session Type"
                              onChange={(e) => handleSessionFieldChange('type', e.target.value)}
                            >
                              <MenuItem value="strength">Strength</MenuItem>
                              <MenuItem value="upper">Upper Body</MenuItem>
                              <MenuItem value="lower">Lower Body</MenuItem>
                              <MenuItem value="full">Full Body</MenuItem>
                              <MenuItem value="push">Push</MenuItem>
                              <MenuItem value="pull">Pull</MenuItem>
                              <MenuItem value="legs">Legs</MenuItem>
                              <MenuItem value="cardio">Cardio</MenuItem>
                              <MenuItem value="rest">Rest</MenuItem>
                            </Select>
                          </FormControl>

                          <TextField
                            fullWidth
                            size="small"
                            label="Focus (optional)"
                            value={editedSessionData.focus || ''}
                            onChange={(e) => handleSessionFieldChange('focus', e.target.value)}
                          />

                          <Stack direction="row" spacing={1}>
                            <Button
                              variant="contained"
                              color="primary"
                              size="small"
                              startIcon={<SaveIcon />}
                              onClick={handleSaveSession}
                              fullWidth
                            >
                              Save
                            </Button>
                            <Button
                              variant="outlined"
                              size="small"
                              startIcon={<CancelIcon />}
                              onClick={handleCancelEdit}
                              fullWidth
                            >
                              Cancel
                            </Button>
                          </Stack>
                        </Stack>
                      ) : (
                        <Stack spacing={1.5}>
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <DragIcon sx={{ color: 'text.secondary', fontSize: '1.2rem' }} />
                            <Box sx={{ display: 'flex', gap: 0.5 }}>
                              <IconButton
                                size="small"
                                onClick={() => handleEditSession(session, index)}
                                sx={{ color: 'primary.main' }}
                              >
                                <EditIcon fontSize="small" />
                              </IconButton>
                              <IconButton
                                size="small"
                                onClick={() => handleDeleteSession(index)}
                                sx={{ color: 'error.main' }}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Box>
                          </Box>

                          <Box>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                              {sessionDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                            </Typography>
                            <Chip
                              label={displaySession.type.toUpperCase()}
                              size="small"
                              color={displaySession.type === 'rest' ? 'default' : 'primary'}
                              sx={{ fontWeight: 600 }}
                            />
                          </Box>

                          {displaySession.focus && (
                            <Typography variant="caption" color="text.secondary">
                              Focus: {displaySession.focus}
                            </Typography>
                          )}

                          {displaySession.exercises && displaySession.exercises.length > 0 && (
                            <Typography variant="caption" color="text.secondary">
                              {displaySession.exercises.length} exercise{displaySession.exercises.length !== 1 ? 's' : ''}
                            </Typography>
                          )}
                        </Stack>
                      )}
                    </Paper>
                  </Grid>
                );
              })}
            </Grid>
          ) : (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                No sessions in this plan yet
              </Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleAddSession}
              >
                Add First Session
              </Button>
            </Box>
          )}
        </CardContent>
      </Card>

      <FitnessPlanWizard
        open={showPlanCreationModal}
        onClose={() => setShowPlanCreationModal(false)}
        onPlanCreated={() => {
          loadPlan();
          setShowPlanCreationModal(false);
        }}
      />
    </Box>
  );
};

PlanInfoTab.propTypes = {
  currentPlan: PropTypes.shape({
    planId: PropTypes.string,
    planStyle: PropTypes.string,
  }),
};

export default PlanInfoTab;
