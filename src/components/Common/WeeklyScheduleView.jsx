import { useState } from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Stack,
  Chip,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  Divider,
} from '@mui/material';
import {
  CalendarToday,
  FitnessCenter,
  DirectionsRun,
  SelfImprovement,
  HotelOutlined,
  PlayArrow,
  Info,
  Close,
} from '@mui/icons-material';
import { useWeekScheduling } from '../../contexts/WeekSchedulingContext';
import { getWorkoutHistory } from '../../utils/storage';
import { motion } from 'framer-motion';
import RestDayMessage from '../RestDayMessage';

/**
 * WeeklyScheduleView - Displays the current week's workout schedule
 * Shows assigned workouts for each day, with suggestions from previous week
 */
const WeeklyScheduleView = ({ onStartWorkout, onNavigate }) => {
  const { weeklySchedule, currentWeek, deloadWeekActive, getWorkoutSuggestion } = useWeekScheduling();
  const [selectedDay, setSelectedDay] = useState(null);
  const [workoutHistory, setWorkoutHistory] = useState([]);
  const [showRestDayMessage, setShowRestDayMessage] = useState(false);

  // Load workout history for suggestions
  useState(() => {
    const loadHistory = async () => {
      const history = await getWorkoutHistory();
      setWorkoutHistory(history);
    };
    loadHistory();
  }, []);

  const daysOfWeek = [
    { name: 'Monday', abbrev: 'MON' },
    { name: 'Tuesday', abbrev: 'TUE' },
    { name: 'Wednesday', abbrev: 'WED' },
    { name: 'Thursday', abbrev: 'THU' },
    { name: 'Friday', abbrev: 'FRI' },
    { name: 'Saturday', abbrev: 'SAT' },
    { name: 'Sunday', abbrev: 'SUN' },
  ];

  // Get icon for session type
  const getSessionIcon = (sessionType) => {
    if (!sessionType) return <FitnessCenter />;
    
    const type = sessionType.toLowerCase();
    if (type.includes('cardio') || type.includes('hiit')) {
      return <DirectionsRun />;
    } else if (type.includes('yoga') || type.includes('mobility') || type.includes('stretch')) {
      return <SelfImprovement />;
    } else if (type.includes('rest')) {
      return <HotelOutlined />;
    }
    return <FitnessCenter />;
  };

  // Get color for session type
  const getSessionColor = (sessionType) => {
    if (!sessionType) return 'primary';
    
    const type = sessionType.toLowerCase();
    if (type.includes('cardio') || type.includes('hiit')) {
      return 'error';
    } else if (type.includes('yoga') || type.includes('mobility') || type.includes('stretch')) {
      return 'secondary';
    } else if (type.includes('rest')) {
      return 'default';
    }
    return 'primary';
  };

  // Get display name for session type
  const getSessionTypeDisplay = (sessionType) => {
    if (!sessionType) return 'Not assigned';
    
    const typeMap = {
      'upper': 'Upper Body',
      'lower': 'Lower Body',
      'full': 'Full Body',
      'push': 'Push',
      'pull': 'Pull',
      'legs': 'Legs',
      'cardio': 'Cardio',
      'hiit': 'HIIT',
      'yoga': 'Yoga',
      'mobility': 'Mobility',
      'stretch': 'Stretching',
      'rest': 'Rest',
    };
    
    return typeMap[sessionType.toLowerCase()] || sessionType;
  };

  const handleDayClick = (dayName) => {
    setSelectedDay(dayName);
  };

  const handleCloseDialog = () => {
    setSelectedDay(null);
  };

  const handleStartWorkout = () => {
    if (selectedDay && weeklySchedule[selectedDay]) {
      const session = weeklySchedule[selectedDay];
      const sessionType = (session.sessionType || '').toLowerCase();

      // Check if it's a rest day
      if (sessionType.includes('rest')) {
        handleCloseDialog();
        setShowRestDayMessage(true);
        return;
      }

      // Check if it's cardio or mobility
      if (sessionType.includes('cardio') || sessionType.includes('hiit') || 
          sessionType.includes('yoga') || sessionType.includes('mobility') || 
          sessionType.includes('stretch')) {
        handleCloseDialog();
        // Navigate to cardio/timer screen if callback is provided
        if (onNavigate) {
          onNavigate('timer');
        }
        return;
      }

      // It's a strength training session
      if (onStartWorkout) {
        onStartWorkout(session);
      }
    }
    handleCloseDialog();
  };

  const getCurrentDayName = () => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[new Date().getDay()];
  };

  const currentDayName = getCurrentDayName();

  return (
    <Box sx={{ width: '100%', maxWidth: 800, mx: 'auto', p: 2 }}>
      {/* Rest Day Message Modal */}
      {showRestDayMessage && (
        <RestDayMessage onClose={() => setShowRestDayMessage(false)} />
      )}

      <Box sx={{ mb: 3, textAlign: 'center' }}>
        <Typography variant="h5" fontWeight={700} gutterBottom>
          Week {currentWeek} Schedule
        </Typography>
        {deloadWeekActive && (
          <Chip
            label="Deload Week - Recovery Focus"
            color="warning"
            icon={<Info />}
            sx={{ mt: 1 }}
          />
        )}
      </Box>

      <Stack spacing={2}>
        {daysOfWeek.map((day, index) => {
          const session = weeklySchedule[day.name];
          const isToday = day.name === currentDayName;
          const suggestion = !session ? getWorkoutSuggestion(day.name, workoutHistory) : null;

          return (
            <motion.div
              key={day.name}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card
                sx={{
                  borderRadius: 2,
                  border: isToday ? 2 : 1,
                  borderColor: isToday ? 'primary.main' : 'divider',
                  boxShadow: isToday ? 3 : 1,
                  cursor: session ? 'pointer' : 'default',
                  transition: 'all 0.2s ease',
                  '&:hover': session ? {
                    transform: 'translateY(-2px)',
                    boxShadow: 4,
                  } : {},
                }}
                onClick={() => session && handleDayClick(day.name)}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
                      {/* Day Label */}
                      <Box
                        sx={{
                          minWidth: 60,
                          textAlign: 'center',
                        }}
                      >
                        <Typography
                          variant="overline"
                          fontWeight={700}
                          color={isToday ? 'primary.main' : 'text.secondary'}
                        >
                          {day.abbrev}
                        </Typography>
                        {isToday && (
                          <Typography variant="caption" display="block" color="primary.main">
                            Today
                          </Typography>
                        )}
                      </Box>

                      {/* Session Info */}
                      <Box sx={{ flex: 1 }}>
                        {session ? (
                          <>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                              {getSessionIcon(session.sessionType)}
                              <Typography variant="body1" fontWeight={600}>
                                {session.sessionName || getSessionTypeDisplay(session.sessionType)}
                              </Typography>
                            </Box>
                            {session.exercises && session.exercises.length > 0 && (
                              <Typography variant="caption" color="text.secondary">
                                {session.exercises.length} exercises
                              </Typography>
                            )}
                          </>
                        ) : (
                          <Box>
                            <Typography variant="body2" color="text.secondary">
                              No workout assigned
                            </Typography>
                            {suggestion && (
                              <Typography variant="caption" color="info.main">
                                Suggestion: {getSessionTypeDisplay(suggestion.type || suggestion.workoutType)}
                              </Typography>
                            )}
                          </Box>
                        )}
                      </Box>

                      {/* Status Chip */}
                      {session && (
                        <Chip
                          label={getSessionTypeDisplay(session.sessionType)}
                          color={getSessionColor(session.sessionType)}
                          size="small"
                          variant="outlined"
                        />
                      )}
                    </Box>

                    {/* Start Button */}
                    {session && (
                      <IconButton
                        color="primary"
                        sx={{ ml: 1 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDayClick(day.name);
                        }}
                      >
                        <PlayArrow />
                      </IconButton>
                    )}
                  </Box>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </Stack>

      {/* Workout Detail Dialog */}
      <Dialog
        open={!!selectedDay}
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
      >
        {selectedDay && weeklySchedule[selectedDay] && (
          <>
            <DialogTitle>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography variant="h6">
                  {selectedDay} - {weeklySchedule[selectedDay].sessionName || getSessionTypeDisplay(weeklySchedule[selectedDay].sessionType)}
                </Typography>
                <IconButton onClick={handleCloseDialog} size="small">
                  <Close />
                </IconButton>
              </Box>
            </DialogTitle>
            <DialogContent>
              {weeklySchedule[selectedDay].exercises && weeklySchedule[selectedDay].exercises.length > 0 ? (
                <>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Exercises in this workout:
                  </Typography>
                  <List dense>
                    {weeklySchedule[selectedDay].exercises.map((exercise, idx) => (
                      <Box key={idx}>
                        <ListItem>
                          <ListItemText
                            primary={exercise.name || exercise.exerciseName}
                            secondary={exercise.muscleGroup || exercise.category || ''}
                          />
                        </ListItem>
                        {idx < weeklySchedule[selectedDay].exercises.length - 1 && <Divider />}
                      </Box>
                    ))}
                  </List>
                </>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  This is a {getSessionTypeDisplay(weeklySchedule[selectedDay].sessionType)} session.
                  {(weeklySchedule[selectedDay].sessionType.toLowerCase().includes('cardio') || 
                    weeklySchedule[selectedDay].sessionType.toLowerCase().includes('yoga')) && 
                    ' Choose your specific workout when ready to start.'}
                </Typography>
              )}
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseDialog} color="inherit">
                Close
              </Button>
              <Button onClick={handleStartWorkout} variant="contained" startIcon={<PlayArrow />}>
                Start Workout
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};

WeeklyScheduleView.propTypes = {
  onStartWorkout: PropTypes.func,
  onNavigate: PropTypes.func,
};

export default WeeklyScheduleView;
