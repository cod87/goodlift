import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  Button,
  Container,
  Typography,
  Paper,
  Chip,
  IconButton,
  Tooltip,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  Collapse,
  Menu,
  MenuItem
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  PlayArrow as StartIcon,
  CalendarMonth as CalendarIcon,
  CheckCircle as CheckCircleIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  AutoAwesome as AutoGenerateIcon,
  ArrowBack as BackIcon,
} from '@mui/icons-material';
import CompactHeader from './Common/CompactHeader';
import QuickPlanSetup from './PlanBuilder/QuickPlanSetup';
import FitnessPlanWizard from './PlanBuilder/FitnessPlanWizard';
import {
  getPlanStatistics
} from '../utils/workoutPlanGenerator';
import {
  getWorkoutPlans,
  deleteWorkoutPlan,
  getActivePlan,
  setActivePlan
} from '../utils/storage';

const WorkoutPlanScreen = ({ onNavigate }) => {
  const [plans, setPlans] = useState([]);
  const [activePlan, setActivePlanState] = useState(null);
  const [showPlanCreationModal, setShowPlanCreationModal] = useState(false);
  const [showFitnessPlanWizard, setShowFitnessPlanWizard] = useState(false);
  const [createMenuAnchor, setCreateMenuAnchor] = useState(null);
  const [expandedPlan, setExpandedPlan] = useState(null); // Track which plan is expanded

  // Load plans on mount
  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    console.log('loadPlans called');
    const loadedPlans = await getWorkoutPlans();
    console.log('Loaded plans:', loadedPlans.length, 'plans');
    console.log('Plan details:', loadedPlans.map(p => ({ id: p.id, name: p.name, sessions: p.sessions?.length })));
    setPlans(loadedPlans);
    
    const active = await getActivePlan();
    console.log('Active plan:', active ? { id: active.id, name: active.name } : 'none');
    setActivePlanState(active);
  };

  const handleCreatePlan = () => {
    setCreateMenuAnchor(null);
    setShowPlanCreationModal(true);
  };

  const handleCreateFitnessPlan = () => {
    setCreateMenuAnchor(null);
    setShowFitnessPlanWizard(true);
  };

  const handleOpenCreateMenu = (event) => {
    setCreateMenuAnchor(event.currentTarget);
  };

  const handleCloseCreateMenu = () => {
    setCreateMenuAnchor(null);
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

  const handleViewCalendar = (plan) => {
    // Set as active plan and navigate to progress screen (calendar view)
    setActivePlan(plan.id);
    if (onNavigate) {
      onNavigate('progress');
    }
  };

  const handleToggleExpand = (planId) => {
    setExpandedPlan(expandedPlan === planId ? null : planId);
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

  return (
    <Box sx={{ width: '100%', minHeight: '100vh' }}>
      {/* Back Button */}
      <Box sx={{ px: 2, pt: 2 }}>
        <Button
          startIcon={<BackIcon />}
          onClick={() => onNavigate('home')}
          sx={{ color: 'text.secondary' }}
        >
          Back to Work Home
        </Button>
      </Box>
      
      <CompactHeader 
        title="Fitness Plans" 
        icon="📅"
        action={
          <Button
            variant="contained"
            color="primary"
            size="small"
            startIcon={<AddIcon />}
            onClick={handleOpenCreateMenu}
          >
            Create Plan
          </Button>
        }
      />

      {/* Create Plan Menu */}
      <Menu
        anchorEl={createMenuAnchor}
        open={Boolean(createMenuAnchor)}
        onClose={handleCloseCreateMenu}
      >
        <MenuItem onClick={handleCreateFitnessPlan}>
          <AutoGenerateIcon sx={{ mr: 1 }} />
          Create Fitness Plan (New)
        </MenuItem>
        <MenuItem onClick={handleCreatePlan}>
          <AutoGenerateIcon sx={{ mr: 1 }} />
          Quick Setup
        </MenuItem>
      </Menu>
      
      <Container maxWidth="lg" sx={{ py: 2, px: { xs: 2, sm: 3 } }}>

      {/* Active Plan Section - Compact */}
      {activePlan && (
        <Paper sx={{ 
          p: 2, 
          mb: 2, 
          bgcolor: 'primary.light', 
          color: 'white',
          borderRadius: 2
        }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="subtitle2" sx={{ opacity: 0.9, textTransform: 'uppercase', fontSize: '0.75rem' }}>
                Active Plan
              </Typography>
              <Typography variant="h6" sx={{ 
                fontWeight: 600,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}>
                {activePlan.name}
              </Typography>
            </Box>
            <CheckCircleIcon sx={{ ml: 1 }} />
          </Box>
          
          <Box sx={{ display: 'flex', gap: 0.5, mb: 1.5, flexWrap: 'wrap' }}>
            <Chip label={getGoalLabel(activePlan.goal)} size="small" sx={{ bgcolor: 'white', height: 20, fontSize: '0.7rem' }} />
            <Chip label={`${activePlan.daysPerWeek}x/week`} size="small" sx={{ bgcolor: 'white', height: 20, fontSize: '0.7rem' }} />
            <Chip label={getExperienceLabel(activePlan.experienceLevel)} size="small" sx={{ bgcolor: 'white', height: 20, fontSize: '0.7rem' }} />
          </Box>
          
          <Box sx={{ mb: 1 }}>
            <Typography variant="caption" sx={{ opacity: 0.9 }}>
              {(() => {
                const stats = getPlanStatistics(activePlan);
                return `${stats.completedSessions}/${stats.totalSessions} sessions • ${Math.round(stats.completionRate)}% complete`;
              })()}
            </Typography>
            <LinearProgress 
              variant="determinate" 
              value={getPlanStatistics(activePlan).completionRate} 
              sx={{ 
                mt: 0.5, 
                height: 4,
                borderRadius: 2,
                bgcolor: 'rgba(255,255,255,0.3)', 
                '& .MuiLinearProgress-bar': { bgcolor: 'white' } 
              }}
            />
          </Box>
          
          <Button
            variant="contained"
            color="secondary"
            size="small"
            startIcon={<CalendarIcon />}
            onClick={() => handleViewCalendar(activePlan)}
            fullWidth
          >
            View Calendar
          </Button>
        </Paper>
      )}

      {/* Plans List - Compact */}
      <Paper sx={{ borderRadius: 2, overflow: 'hidden' }}>
        <Box sx={{ p: 2, bgcolor: 'background.default', borderBottom: '1px solid', borderColor: 'divider' }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            All Plans ({plans.length})
          </Typography>
        </Box>
        
        {plans.length === 0 ? (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="body1" color="text.secondary" gutterBottom>
              No fitness plans yet
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Create your first fitness plan to get started
            </Typography>
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={handleCreatePlan}
            >
              Create Plan
            </Button>
          </Box>
        ) : (
          <List sx={{ p: 0 }}>
            {plans.map((plan, index) => {
              const stats = getPlanStatistics(plan);
              const isActive = activePlan && activePlan.id === plan.id;
              const isExpanded = expandedPlan === plan.id;
              
              return (
                <Box key={plan.id}>
                  <ListItem
                    sx={{
                      borderBottom: !isExpanded && index < plans.length - 1 ? '1px solid' : 'none',
                      borderColor: 'divider',
                      py: 2,
                      px: 2,
                      bgcolor: isActive ? 'action.selected' : 'transparent',
                      cursor: 'pointer',
                      '&:hover': {
                        bgcolor: isActive ? 'action.selected' : 'action.hover'
                      }
                    }}
                    onClick={() => handleToggleExpand(plan.id)}
                    secondaryAction={
                      <Box sx={{ display: 'flex', gap: 0.5, ml: 1 }}>
                        <Tooltip title="View Calendar">
                          <IconButton 
                            size="medium" 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewCalendar(plan);
                            }}
                          >
                            <CalendarIcon />
                          </IconButton>
                        </Tooltip>
                        {!isActive && (
                          <Tooltip title="Set Active">
                            <IconButton 
                              size="medium" 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSetActive(plan.id);
                              }}
                            >
                              <StartIcon />
                            </IconButton>
                          </Tooltip>
                        )}
                        <Tooltip title="Delete">
                          <IconButton 
                            size="medium" 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeletePlan(plan.id);
                            }}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                        <IconButton size="small" onClick={(e) => e.stopPropagation()}>
                          {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                        </IconButton>
                      </Box>
                    }
                  >
                    <ListItemText
                      sx={{ pr: { xs: 14, sm: 12 } }} // Add padding to prevent overlap with icons
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                            {plan.name}
                          </Typography>
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Box sx={{ display: 'flex', gap: 0.5, mb: 0.5, flexWrap: 'wrap', maxWidth: '100%' }}>
                            <Chip label={getGoalLabel(plan.goal)} size="small" sx={{ height: 18, fontSize: '0.65rem' }} />
                            <Chip label={`${plan.daysPerWeek}x/week`} size="small" sx={{ height: 18, fontSize: '0.65rem' }} />
                            <Chip label={`${plan.duration} days`} size="small" sx={{ height: 18, fontSize: '0.65rem' }} />
                            <Chip label={getExperienceLabel(plan.experienceLevel)} size="small" sx={{ height: 18, fontSize: '0.65rem' }} />
                          </Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                            <Typography variant="caption" color="text.secondary" sx={{ minWidth: 'fit-content' }}>
                              {stats.completedSessions}/{stats.totalSessions} • {Math.round(stats.completionRate)}%
                            </Typography>
                            <LinearProgress 
                              variant="determinate" 
                              value={stats.completionRate} 
                              sx={{ flex: 1, height: 4, borderRadius: 2, maxWidth: 150 }}
                            />
                          </Box>
                        </Box>
                      }
                    />
                  </ListItem>
                  
                  {/* Expandable section showing all sessions */}
                  <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                    <Box sx={{ 
                      px: 2, 
                      pb: 2, 
                      pt: 1,
                      bgcolor: 'background.default',
                      borderBottom: index < plans.length - 1 ? '1px solid' : 'none',
                      borderColor: 'divider'
                    }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                        Workout Schedule
                      </Typography>
                      {plan.sessions && plan.sessions.length > 0 ? (
                        <Box sx={{ maxHeight: 400, overflowY: 'auto' }}>
                          {plan.sessions.map((session, idx) => (
                            <Box 
                              key={session.id || idx} 
                              sx={{ 
                                mb: 1.5, 
                                p: 1.5, 
                                bgcolor: 'background.paper',
                                borderRadius: 1,
                                border: '1px solid',
                                borderColor: 'divider'
                              }}
                            >
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                  {new Date(session.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                                </Typography>
                                <Chip 
                                  label={session.type.toUpperCase()} 
                                  size="small" 
                                  color={session.type === 'rest' ? 'default' : 'primary'}
                                  sx={{ height: 20, fontSize: '0.7rem' }}
                                />
                              </Box>
                              {session.exercises && session.exercises.length > 0 && (
                                <Box sx={{ mt: 1 }}>
                                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                                    Exercises ({session.exercises.length}):
                                  </Typography>
                                  <Box sx={{ mt: 0.5 }}>
                                    {session.exercises.slice(0, 5).map((exercise, exIdx) => (
                                      <Typography key={exIdx} variant="caption" color="text.secondary" sx={{ display: 'block', ml: 1 }}>
                                        • {exercise['Exercise Name'] || exercise.name || 'Unknown Exercise'}
                                      </Typography>
                                    ))}
                                    {session.exercises.length > 5 && (
                                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', ml: 1, fontStyle: 'italic' }}>
                                        ... and {session.exercises.length - 5} more
                                      </Typography>
                                    )}
                                  </Box>
                                </Box>
                              )}
                            </Box>
                          ))}
                        </Box>
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          No sessions available
                        </Typography>
                      )}
                    </Box>
                  </Collapse>
                </Box>
              );
            })}
          </List>
        )}
      </Paper>

      {/* Quick Plan Setup */}
      <QuickPlanSetup
        open={showPlanCreationModal}
        onClose={() => setShowPlanCreationModal(false)}
        onPlanCreated={() => {
          loadPlans();
          setShowPlanCreationModal(false);
        }}
      />

      {/* Fitness Plan Wizard */}
      <FitnessPlanWizard
        open={showFitnessPlanWizard}
        onClose={() => setShowFitnessPlanWizard(false)}
        onPlanCreated={() => {
          loadPlans();
          setShowFitnessPlanWizard(false);
        }}
      />
    </Container>
    </Box>
  );
};

WorkoutPlanScreen.propTypes = {
  onNavigate: PropTypes.func
};

export default WorkoutPlanScreen;
