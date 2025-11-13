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
  List,
  ListItem,
  ListItemText,
  Collapse,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Grid,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  DragIndicator as DragIcon,
  CalendarMonth as CalendarIcon,
} from '@mui/icons-material';
import QuickPlanSetup from '../PlanBuilder/QuickPlanSetup';
import {
  getPlanStatistics
} from '../../utils/workoutPlanGenerator';
import {
  getWorkoutPlans,
  getActivePlan,
  setActivePlan,
  saveWorkoutPlan,
  deleteWorkoutPlan,
} from '../../utils/storage';

/**
 * PlanInfoTab - Shows active plan details with full editing capabilities
 * Replaces the "View Plans" button with comprehensive plan management
 */
const PlanInfoTab = ({ currentPlan }) => {
  const [activePlan, setActivePlanState] = useState(null);
  const [plans, setPlans] = useState([]);
  const [showPlanCreationModal, setShowPlanCreationModal] = useState(false);
  const [expandedSession, setExpandedSession] = useState(null);
  const [editingSession, setEditingSession] = useState(null);
  const [editedSessionData, setEditedSessionData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPlans();
  }, [currentPlan]);

  const loadPlans = async () => {
    setLoading(true);
    try {
      const loadedPlans = await getWorkoutPlans();
      setPlans(loadedPlans);
      const active = await getActivePlan();
      setActivePlanState(active);
    } catch (error) {
      console.error('Error loading plans:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSetActive = async (planId) => {
    try {
      await setActivePlan(planId);
      await loadPlans();
    } catch (error) {
      console.error('Error setting active plan:', error);
    }
  };

  const handleDeletePlan = async (planId) => {
    if (window.confirm('Are you sure you want to delete this plan?')) {
      try {
        await deleteWorkoutPlan(planId);
        await loadPlans();
      } catch (error) {
        console.error('Error deleting plan:', error);
      }
    }
  };

  const handleToggleExpand = (sessionId) => {
    setExpandedSession(expandedSession === sessionId ? null : sessionId);
  };

  const handleEditSession = (session) => {
    setEditingSession(session.id || session.date);
    setEditedSessionData({ ...session });
  };

  const handleSaveSession = async () => {
    if (!activePlan || !editedSessionData) return;

    try {
      const updatedPlan = { ...activePlan };
      const sessionIndex = updatedPlan.sessions.findIndex(
        s => (s.id || s.date) === (editedSessionData.id || editedSessionData.date)
      );

      if (sessionIndex !== -1) {
        updatedPlan.sessions[sessionIndex] = editedSessionData;
        await saveWorkoutPlan(updatedPlan);
        await loadPlans();
        setEditingSession(null);
        setEditedSessionData(null);
      }
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

        <QuickPlanSetup
          open={showPlanCreationModal}
          onClose={() => setShowPlanCreationModal(false)}
          onPlanCreated={() => {
            loadPlans();
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

      {/* Workout Sessions */}
      <Card elevation={2} sx={{ borderRadius: 3 }}>
        <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
            Workout Sessions
          </Typography>

          {activePlan.sessions && activePlan.sessions.length > 0 ? (
            <List sx={{ p: 0 }}>
              {activePlan.sessions.map((session, index) => {
                const sessionKey = session.id || session.date;
                const isExpanded = expandedSession === sessionKey;
                const isEditing = editingSession === sessionKey;
                const displaySession = isEditing ? editedSessionData : session;

                return (
                  <Box key={sessionKey}>
                    <ListItem
                      sx={{
                        borderBottom: !isExpanded && index < activePlan.sessions.length - 1 ? '1px solid' : 'none',
                        borderColor: 'divider',
                        py: 2,
                        px: 2,
                        bgcolor: isExpanded ? 'action.hover' : 'transparent',
                        cursor: 'pointer',
                        '&:hover': {
                          bgcolor: 'action.hover'
                        }
                      }}
                      onClick={() => !isEditing && handleToggleExpand(sessionKey)}
                    >
                      <ListItemText
                        sx={{ pr: { xs: 12, sm: 10 } }}
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                            <DragIcon sx={{ color: 'text.secondary', fontSize: '1.2rem' }} />
                            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                              {new Date(displaySession.date).toLocaleDateString('en-US', {
                                weekday: 'short',
                                month: 'short',
                                day: 'numeric'
                              })}
                            </Typography>
                            <Chip
                              label={displaySession.type.toUpperCase()}
                              size="small"
                              color={displaySession.type === 'rest' ? 'default' : 'primary'}
                              sx={{ height: 20, fontSize: '0.7rem' }}
                            />
                          </Box>
                        }
                        secondary={
                          displaySession.exercises && displaySession.exercises.length > 0 && (
                            <Typography variant="caption" color="text.secondary">
                              {displaySession.exercises.length} exercises
                            </Typography>
                          )
                        }
                      />
                      <Box sx={{ display: 'flex', gap: 0.5 }}>
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditSession(session);
                          }}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton size="small" onClick={(e) => e.stopPropagation()}>
                          {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                        </IconButton>
                      </Box>
                    </ListItem>

                    <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                      <Box sx={{ px: 2, pb: 2, pt: 1, bgcolor: 'background.default' }}>
                        {isEditing ? (
                          <Box sx={{ p: 2 }}>
                            <Stack spacing={2}>
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
                                >
                                  Save
                                </Button>
                                <Button
                                  variant="outlined"
                                  size="small"
                                  startIcon={<CancelIcon />}
                                  onClick={handleCancelEdit}
                                >
                                  Cancel
                                </Button>
                              </Stack>
                            </Stack>
                          </Box>
                        ) : (
                          <>
                            {displaySession.focus && (
                              <Typography variant="body2" sx={{ mb: 1 }}>
                                <strong>Focus:</strong> {displaySession.focus}
                              </Typography>
                            )}
                            {displaySession.exercises && displaySession.exercises.length > 0 && (
                              <Box>
                                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                                  Exercises ({displaySession.exercises.length}):
                                </Typography>
                                <Box sx={{ maxHeight: 300, overflowY: 'auto' }}>
                                  {displaySession.exercises.map((exercise, exIdx) => (
                                    <Typography
                                      key={exIdx}
                                      variant="body2"
                                      color="text.secondary"
                                      sx={{ display: 'block', ml: 1, mb: 0.5 }}
                                    >
                                      {exIdx + 1}. {exercise['Exercise Name'] || exercise.name || 'Unknown Exercise'}
                                    </Typography>
                                  ))}
                                </Box>
                              </Box>
                            )}
                          </>
                        )}
                      </Box>
                    </Collapse>
                  </Box>
                );
              })}
            </List>
          ) : (
            <Typography variant="body2" color="text.secondary">
              No sessions available
            </Typography>
          )}
        </CardContent>
      </Card>

      {/* All Plans Section */}
      {plans.length > 1 && (
        <Card elevation={2} sx={{ mt: 3, borderRadius: 3 }}>
          <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
              Other Plans ({plans.length - 1})
            </Typography>
            <Grid container spacing={2}>
              {plans.filter(p => p.id !== activePlan.id).map((plan) => {
                return (
                  <Grid item xs={12} sm={6} key={plan.id}>
                    <Card sx={{ bgcolor: 'background.default', border: '1px solid', borderColor: 'divider' }}>
                      <CardContent>
                        <Typography variant="h6" sx={{ mb: 1 }}>
                          {plan.name}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 0.5, mb: 1, flexWrap: 'wrap' }}>
                          <Chip label={getGoalLabel(plan.goal)} size="small" sx={{ height: 18, fontSize: '0.65rem' }} />
                          <Chip label={`${plan.daysPerWeek}x/week`} size="small" sx={{ height: 18, fontSize: '0.65rem' }} />
                        </Box>
                        <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => handleSetActive(plan.id)}
                          >
                            Activate
                          </Button>
                          <IconButton
                            size="small"
                            onClick={() => handleDeletePlan(plan.id)}
                            sx={{ color: 'error.main' }}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Stack>
                      </CardContent>
                    </Card>
                  </Grid>
                );
              })}
            </Grid>
          </CardContent>
        </Card>
      )}

      <QuickPlanSetup
        open={showPlanCreationModal}
        onClose={() => setShowPlanCreationModal(false)}
        onPlanCreated={() => {
          loadPlans();
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
