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
import { getWorkoutHistory } from '../../utils/storage';
import { touchTargets } from '../../theme/responsive';
import MonthCalendarView from '../Calendar/MonthCalendarView';
import FavouriteWorkoutsWidget from './FavouriteWorkoutsWidget';
import { useWeekScheduling } from '../../contexts/WeekSchedulingContext';

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
}) => {
  const [currentDate, setCurrentDate] = useState('');
  const [recentWorkouts, setRecentWorkouts] = useState([]);
  const [workoutHistory, setWorkoutHistory] = useState([]);
  const { weeklySchedule } = useWeekScheduling();
  
  // Workout configuration state
  const [supersetConfig, setSupersetConfig] = useState([2, 2, 2, 2]); // Default: 4 supersets of 2

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
  useEffect(() => {
    const loadRecentWorkouts = async () => {
      try {
        const history = await getWorkoutHistory();
        setWorkoutHistory(history);
        setRecentWorkouts(history.slice(0, 5));
      } catch (error) {
        console.error('Error loading recent workouts:', error);
      }
    };

    loadRecentWorkouts();
  }, []);
  
  // Format duration helper
  const formatDuration = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
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

  return (
    <Box>
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
                sx={{ 
                  fontWeight: 600,
                  fontSize: { xs: '0.75rem', sm: '0.875rem' }
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
        <Card 
          elevation={2}
          sx={{ 
            mb: 3,
            borderRadius: 3,
          }}
        >
          <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
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
                <TrendingUp /> Recent Workouts
              </Typography>
              <Button
                size="small"
                onClick={() => onNavigate('progress')}
                sx={{ color: 'primary.main' }}
              >
                View All
              </Button>
            </Stack>
            <Stack spacing={1.5}>
              {recentWorkouts.map((workout, index) => (
                <Box 
                  key={index}
                  sx={{ 
                    p: 2, 
                    bgcolor: 'background.default', 
                    borderRadius: 2,
                    borderLeft: '4px solid',
                    borderLeftColor: 'primary.main',
                  }}
                >
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Box>
                      <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                        {workout.type?.charAt(0).toUpperCase() + workout.type?.slice(1) || 'Workout'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {new Date(workout.date).toLocaleDateString('en-US', { 
                          weekday: 'short', 
                          month: 'short', 
                          day: 'numeric' 
                        })}
                      </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      {formatDuration(workout.duration || 0)}
                    </Typography>
                  </Stack>
                </Box>
              ))}
            </Stack>
          </CardContent>
        </Card>
      )}
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
};

export default WorkoutTab;
