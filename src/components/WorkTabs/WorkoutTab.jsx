import { memo, useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { 
  Box, 
  Card, 
  CardContent, 
  Typography, 
  Button, 
  Stack,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  IconButton,
  Chip,
  Divider,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Snackbar,
  Alert,
} from '@mui/material';
import { 
  PlayArrow, 
  TrendingUp,
  FitnessCenter as WorkoutIcon,
  ExpandMore,
  Add,
  Remove,
  Edit,
  Link as LinkIcon,
} from '@mui/icons-material';
import { getWorkoutHistory, deleteWorkout, updateWorkout } from '../../utils/storage';
import { touchTargets } from '../../theme/responsive';
import MonthCalendarView from '../Calendar/MonthCalendarView';
import FavouriteWorkoutsWidget from './FavouriteWorkoutsWidget';
import { useWeekScheduling } from '../../contexts/WeekSchedulingContext';
import RestDayMessage from '../RestDayMessage';
import ActivitiesList from '../Progress/ActivitiesList';
import EditActivityDialog from '../EditActivityDialog';

/**
 * WorkoutTab - Integrated workout configuration and activity logging
 * Features:
 * - Direct workout type selection
 * - Equipment filter
 * - Superset configuration controls
 * - Generate and Customize buttons
 * - Activity stats and history
 */
const WorkoutTab = memo(({ 
  onNavigate,
  loading = false,
  // New props for workout configuration
  workoutType,
  selectedEquipment,
  equipmentOptions,
  onWorkoutTypeChange,
  onEquipmentChange,
  onStartWorkout,
  onCustomize,
  onTabChange, // New prop for changing tabs
}) => {
  const [currentDate, setCurrentDate] = useState('');
  const [recentWorkouts, setRecentWorkouts] = useState([]);
  const [workoutHistory, setWorkoutHistory] = useState([]);
  const [showRestDayMessage, setShowRestDayMessage] = useState(false);
  const { weeklySchedule } = useWeekScheduling();
  
  // Workout configuration state
  const [supersetConfig, setSupersetConfig] = useState([2, 2, 2, 2]); // Default: 4 supersets of 2
  
  // Edit/Delete state
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedActivityIndex, setSelectedActivityIndex] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // Set current date with shortened format
  useEffect(() => {
    const options = { weekday: 'short', month: 'short', day: 'numeric' };
    setCurrentDate(new Date().toLocaleDateString('en-US', options));
  }, []);

  // Get today's assigned workout
  const getTodaysWorkout = () => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const todayName = days[new Date().getDay()];
    return weeklySchedule[todayName];
  };

  const todaysWorkout = getTodaysWorkout();

  // Load workout history
  const loadWorkoutHistory = async () => {
    try {
      const history = await getWorkoutHistory();
      setWorkoutHistory(history);
      setRecentWorkouts(history.slice(0, 5));
    } catch (error) {
      console.error('Error loading recent workouts:', error);
    }
  };

  useEffect(() => {
    loadWorkoutHistory();
  }, []);
  
  // Handle edit activity
  const handleEditActivity = (index) => {
    setSelectedActivityIndex(index);
    setEditDialogOpen(true);
  };

  // Handle delete activity
  const handleDeleteActivity = (index) => {
    setSelectedActivityIndex(index);
    setDeleteDialogOpen(true);
  };

  // Confirm delete
  const confirmDelete = async () => {
    try {
      await deleteWorkout(selectedActivityIndex);
      setSnackbar({ open: true, message: 'Activity deleted successfully', severity: 'success' });
      setDeleteDialogOpen(false);
      setSelectedActivityIndex(null);
      await loadWorkoutHistory();
    } catch (error) {
      console.error('Error deleting activity:', error);
      setSnackbar({ open: true, message: 'Failed to delete activity', severity: 'error' });
    }
  };

  // Save edited activity
  const handleSaveActivity = async (updatedActivity) => {
    try {
      await updateWorkout(selectedActivityIndex, updatedActivity);
      setSnackbar({ open: true, message: 'Activity updated successfully', severity: 'success' });
      setEditDialogOpen(false);
      setSelectedActivityIndex(null);
      await loadWorkoutHistory();
    } catch (error) {
      console.error('Error updating activity:', error);
      setSnackbar({ open: true, message: 'Failed to update activity', severity: 'error' });
    }
  };
  
  // Handle equipment selection
  const handleEquipmentToggle = (equipment) => {
    const newSelected = new Set(selectedEquipment);
    
    if (equipment === 'all') {
      newSelected.clear();
      newSelected.add('all');
    } else {
      if (newSelected.has('all')) {
        newSelected.delete('all');
      }
      
      if (newSelected.has(equipment)) {
        newSelected.delete(equipment);
      } else {
        newSelected.add(equipment);
      }
      
      if (newSelected.size === 0) {
        newSelected.add('all');
      }
    }
    
    onEquipmentChange(newSelected);
  };
  
  // Get equipment display text
  const getEquipmentDisplayText = () => {
    if (selectedEquipment.has('all')) {
      return 'All Equipment';
    }
    const selected = Array.from(selectedEquipment);
    if (selected.length === 0) {
      return 'All Equipment';
    }
    if (selected.length === 1) {
      const equipment = equipmentOptions.find(e => e.toLowerCase() === selected[0]);
      return equipment || selected[0];
    }
    return `${selected.length} selected`;
  };
  
  // Handle superset configuration
  const handleAddSuperset = () => {
    setSupersetConfig([...supersetConfig, 2]);
  };
  
  const handleRemoveSuperset = (index) => {
    if (supersetConfig.length > 1) {
      const newConfig = supersetConfig.filter((_, i) => i !== index);
      setSupersetConfig(newConfig);
    }
  };
  
  const handleSupersetSizeChange = (index, delta) => {
    const newConfig = [...supersetConfig];
    const newSize = Math.max(1, Math.min(6, newConfig[index] + delta));
    newConfig[index] = newSize;
    setSupersetConfig(newConfig);
  };
  
  // Handle start workout
  const handleStartClick = () => {
    if (workoutType && onStartWorkout) {
      const equipmentFilter = selectedEquipment.has('all') 
        ? 'all' 
        : Array.from(selectedEquipment);
      onStartWorkout(workoutType, equipmentFilter, null, supersetConfig);
    }
  };
  
  // Handle customize
  const handleCustomizeClick = () => {
    if (workoutType && onCustomize) {
      const equipmentFilter = selectedEquipment.has('all') 
        ? 'all' 
        : Array.from(selectedEquipment);
      onCustomize(workoutType, equipmentFilter, supersetConfig);
    }
  };

  // Handle clicking on suggested session
  const handleSuggestedSessionClick = () => {
    if (!todaysWorkout) return;

    const sessionType = (todaysWorkout.sessionType || '').toLowerCase();

    // Check if it's a rest day
    if (sessionType.includes('rest')) {
      setShowRestDayMessage(true);
      return;
    }

    // Check if it's cardio or mobility
    if (sessionType.includes('cardio') || sessionType.includes('hiit') || 
        sessionType.includes('yoga') || sessionType.includes('mobility') || 
        sessionType.includes('stretch')) {
      // Switch to cardio & yoga tab
      if (onTabChange) {
        onTabChange(1); // Index 1 is the Cardio & Yoga tab
      }
      return;
    }

    // It's a strength training session - route to workout preview
    const strengthTypes = ['full', 'upper', 'lower', 'push', 'pull', 'legs', 'core'];
    if (strengthTypes.includes(sessionType)) {
      // Update the workout type to match the suggestion
      onWorkoutTypeChange(sessionType);
      
      // Start the workout with the suggested type
      const equipmentFilter = selectedEquipment.has('all') 
        ? 'all' 
        : Array.from(selectedEquipment);
      
      // If the session has exercises, use them; otherwise generate
      if (todaysWorkout.exercises && todaysWorkout.exercises.length > 0) {
        onStartWorkout(sessionType, equipmentFilter, todaysWorkout.exercises, supersetConfig);
      } else {
        onStartWorkout(sessionType, equipmentFilter, null, supersetConfig);
      }
    }
  };

  return (
    <Box>
      {/* Rest Day Message Modal */}
      {showRestDayMessage && (
        <RestDayMessage onClose={() => setShowRestDayMessage(false)} />
      )}

      {/* Date Section with Suggested Session */}
      <Box sx={{ mb: 4, textAlign: 'center' }}>
        <Typography 
          variant="h5" 
          sx={{ 
            fontWeight: 600,
            color: 'text.secondary',
            fontSize: { xs: '1rem', sm: '1.25rem' },
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 1,
            flexWrap: 'wrap',
          }}
        >
          <span>{currentDate}</span>
          {todaysWorkout && (
            <>
              <span>•</span>
              <Chip
                label={`Suggested Session: ${todaysWorkout.sessionName || todaysWorkout.sessionType}`}
                color="primary"
                variant="outlined"
                size="small"
                onClick={handleSuggestedSessionClick}
                sx={{ 
                  fontWeight: 600,
                  fontSize: { xs: '0.75rem', sm: '0.875rem' },
                  cursor: 'pointer',
                  '&:hover': {
                    backgroundColor: 'rgba(19, 70, 134, 0.08)',
                  }
                }}
              />
            </>
          )}
        </Typography>
      </Box>

      {/* Workout Configuration Card */}
      <Card 
        elevation={2}
        sx={{ 
          mb: 3,
          borderRadius: 3,
          background: 'linear-gradient(135deg, rgba(237, 63, 39, 0.05) 0%, rgba(19, 70, 134, 0.05) 100%)',
        }}
      >
        <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <WorkoutIcon sx={{ color: 'secondary.main', mr: 1 }} />
            <Typography 
              variant="h6" 
              sx={{ 
                color: 'text.primary',
                fontWeight: 600,
              }}
            >
              Start a Workout
            </Typography>
          </Box>
          
          {/* Workout Type and Equipment Selection */}
          <Stack spacing={2} sx={{ mb: 3 }}>
            <FormControl fullWidth size="medium">
              <InputLabel id="workout-type-label">Workout Type</InputLabel>
              <Select
                labelId="workout-type-label"
                value={workoutType || 'full'}
                label="Workout Type"
                onChange={(e) => onWorkoutTypeChange(e.target.value)}
              >
                <MenuItem value="full">Full Body</MenuItem>
                <MenuItem value="upper">Upper Body</MenuItem>
                <MenuItem value="lower">Lower Body</MenuItem>
                <MenuItem value="push">Push</MenuItem>
                <MenuItem value="pull">Pull</MenuItem>
                <MenuItem value="legs">Legs</MenuItem>
                <MenuItem value="core">Core</MenuItem>
              </Select>
            </FormControl>

            {/* Equipment Accordion */}
            <Accordion 
              sx={{ 
                boxShadow: 'none',
                border: '1px solid rgba(0, 0, 0, 0.23)',
                borderRadius: '4px !important',
                '&:before': { display: 'none' },
                '&.Mui-expanded': {
                  margin: 0,
                },
              }}
            >
              <AccordionSummary
                expandIcon={<ExpandMore />}
                sx={{
                  minHeight: '48px',
                  '&.Mui-expanded': {
                    minHeight: '48px',
                  },
                  '& .MuiAccordionSummary-content': {
                    margin: '12px 0',
                    '&.Mui-expanded': {
                      margin: '12px 0',
                    },
                  },
                }}
              >
                <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
                  <Typography 
                    variant="caption" 
                    sx={{ 
                      color: 'text.primary',
                      fontSize: '0.75rem',
                      lineHeight: 1,
                      mb: 0.5,
                    }}
                  >
                    Equipment
                  </Typography>
                  <Typography 
                    sx={{ 
                      color: 'text.primary',
                      fontSize: '1rem',
                    }}
                  >
                    {getEquipmentDisplayText()}
                  </Typography>
                </Box>
              </AccordionSummary>
              <AccordionDetails sx={{ pt: 0, pb: 2 }}>
                <Stack spacing={1}>
                  <Chip
                    label="All Equipment"
                    onClick={() => handleEquipmentToggle('all')}
                    color={selectedEquipment.has('all') ? 'primary' : 'default'}
                    variant={selectedEquipment.has('all') ? 'filled' : 'outlined'}
                    sx={{ justifyContent: 'flex-start' }}
                  />
                  {equipmentOptions.map((equipment) => (
                    <Chip
                      key={equipment}
                      label={equipment}
                      onClick={() => handleEquipmentToggle(equipment.toLowerCase())}
                      color={selectedEquipment.has(equipment.toLowerCase()) ? 'primary' : 'default'}
                      variant={selectedEquipment.has(equipment.toLowerCase()) ? 'filled' : 'outlined'}
                      sx={{ justifyContent: 'flex-start' }}
                    />
                  ))}
                </Stack>
              </AccordionDetails>
            </Accordion>
          </Stack>

          {/* Superset Configuration */}
          <Accordion 
            sx={{ 
              boxShadow: 'none',
              border: '1px solid rgba(0, 0, 0, 0.12)',
              borderRadius: '4px !important',
              '&:before': { display: 'none' },
              mb: 2,
            }}
          >
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <LinkIcon sx={{ fontSize: 20 }} />
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  Superset Configuration ({supersetConfig.length} supersets)
                </Typography>
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <Stack spacing={2}>
                {supersetConfig.map((count, index) => (
                  <Box 
                    key={index}
                    sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 1,
                      p: 1.5,
                      bgcolor: 'action.hover',
                      borderRadius: 1,
                    }}
                  >
                    <Typography variant="body2" sx={{ minWidth: '80px', fontWeight: 500 }}>
                      Superset {index + 1}
                    </Typography>
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ flex: 1 }}>
                      <IconButton
                        size="small"
                        onClick={() => handleSupersetSizeChange(index, -1)}
                        disabled={count <= 1}
                      >
                        <Remove fontSize="small" />
                      </IconButton>
                      <Typography sx={{ minWidth: '90px', textAlign: 'center' }}>
                        {count} exercises
                      </Typography>
                      <IconButton
                        size="small"
                        onClick={() => handleSupersetSizeChange(index, 1)}
                        disabled={count >= 6}
                      >
                        <Add fontSize="small" />
                      </IconButton>
                    </Stack>
                    <Tooltip title="Remove superset">
                      <IconButton
                        size="small"
                        onClick={() => handleRemoveSuperset(index)}
                        disabled={supersetConfig.length <= 1}
                        color="error"
                      >
                        <Remove fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                ))}
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<Add />}
                  onClick={handleAddSuperset}
                  sx={{ alignSelf: 'flex-start' }}
                >
                  Add Superset
                </Button>
              </Stack>
            </AccordionDetails>
          </Accordion>

          <Divider sx={{ my: 2 }} />

          {/* Generate and Customize Buttons */}
          <Stack direction="row" spacing={2}>
            <Button
              variant="outlined"
              size="large"
              fullWidth
              disabled={!workoutType || loading}
              onClick={handleCustomizeClick}
              startIcon={<Edit />}
              sx={{
                minHeight: touchTargets.navigation,
                fontSize: { xs: '0.95rem', sm: '1rem' },
                fontWeight: 600,
                borderWidth: 2,
                '&:hover': {
                  borderWidth: 2,
                }
              }}
            >
              Customize
            </Button>
            <Button
              variant="contained"
              size="large"
              fullWidth
              disabled={!workoutType || loading}
              onClick={handleStartClick}
              startIcon={<PlayArrow />}
              sx={{
                minHeight: touchTargets.navigation,
                fontSize: { xs: '0.95rem', sm: '1rem' },
                fontWeight: 600,
                backgroundColor: 'primary.main',
                '&:hover': {
                  backgroundColor: 'primary.dark',
                },
              }}
            >
              Generate
            </Button>
          </Stack>
        </CardContent>
      </Card>

      {/* Favourite Workouts Widget */}
      <FavouriteWorkoutsWidget onStartWorkout={onStartWorkout} />

      {/* Month Calendar View */}
      <Box sx={{ mb: 3 }}>
        <MonthCalendarView
          workoutHistory={workoutHistory}
        />
      </Box>

      {/* Recent Workout History */}
      {recentWorkouts.length > 0 && (
        <Box sx={{ mb: 3 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
            <Typography 
              variant="h6" 
              sx={{ 
                fontWeight: 600, 
                color: 'text.primary',
                display: 'flex',
                alignItems: 'center',
                gap: 1
              }}
            >
              <TrendingUp /> Recent Activity
            </Typography>
            <Button
              size="small"
              onClick={() => onNavigate('progress')}
              sx={{ color: 'primary.main' }}
            >
              View All
            </Button>
          </Stack>
          <ActivitiesList 
            activities={recentWorkouts}
            onEdit={handleEditActivity}
            onDelete={handleDeleteActivity}
            maxVisible={5}
            showLoadMore={false}
          />
        </Box>
      )}

      {/* Edit Activity Dialog */}
      <EditActivityDialog
        open={editDialogOpen}
        onClose={() => {
          setEditDialogOpen(false);
          setSelectedActivityIndex(null);
        }}
        activity={selectedActivityIndex !== null ? recentWorkouts[selectedActivityIndex] : null}
        onSave={handleSaveActivity}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => {
          setDeleteDialogOpen(false);
          setSelectedActivityIndex(null);
        }}
      >
        <DialogTitle>Delete Activity?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this activity? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setDeleteDialogOpen(false);
            setSelectedActivityIndex(null);
          }}>
            Cancel
          </Button>
          <Button onClick={confirmDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setSnackbar({ ...snackbar, open: false })} 
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
});

WorkoutTab.displayName = 'WorkoutTab';

WorkoutTab.propTypes = {
  onNavigate: PropTypes.func,
  loading: PropTypes.bool,
  // Workout configuration props
  workoutType: PropTypes.string,
  selectedEquipment: PropTypes.instanceOf(Set),
  equipmentOptions: PropTypes.array,
  onWorkoutTypeChange: PropTypes.func,
  onEquipmentChange: PropTypes.func,
  onStartWorkout: PropTypes.func,
  onCustomize: PropTypes.func,
  onTabChange: PropTypes.func,
};

export default WorkoutTab;
