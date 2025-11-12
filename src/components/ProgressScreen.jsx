import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { motion } from 'framer-motion';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Stack,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Tabs,
  Tab,
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  Remove,
  Add,
  Close,
  Edit,
  Delete,
  ExpandMore,
  ExpandLess,
  EmojiEvents,
  Assessment,
} from '@mui/icons-material';
import CompactHeader from './Common/CompactHeader';
import Calendar from './Calendar';
import Achievements from './Achievements';
import {
  getWorkoutHistory,
  deleteWorkout,
  updateWorkout,
  getStretchSessions,
  getActivePlan,
  getUserStats,
} from '../utils/storage';
import progressiveOverloadService from '../services/ProgressiveOverloadService';
import { EXERCISES_DATA_PATH } from '../utils/constants';
import {
  calculateStreak,
  calculateAdherence,
  calculateTotalVolume,
} from '../utils/trackingMetrics';
import { StreakDisplay, AdherenceDisplay, VolumeTrendDisplay } from './Progress/TrackingCards';
import { FourWeekProgressionChart } from './Progress/FourWeekProgressionChart';
import ActivitiesList from './Progress/ActivitiesList';

/**
 * ProgressDashboard - Complete progress tracking dashboard
 * Redesigned to match the modern style of Training Hub
 */
const ProgressDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState([]);
  const [stretchSessions, setStretchSessions] = useState([]);
  const [activePlan, setActivePlan] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [pinnedExercises, setPinnedExercisesState] = useState([]);
  const [availableExercises, setAvailableExercises] = useState([]);
  const [addExerciseDialogOpen, setAddExerciseDialogOpen] = useState(false);
  const [exerciseSearchQuery, setExerciseSearchQuery] = useState('');
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingSession, setEditingSession] = useState(null);
  const [editingSessionType, setEditingSessionType] = useState(null);
  const [calendarExpanded, setCalendarExpanded] = useState(false);
  const [currentTab, setCurrentTab] = useState(0);
  
  // New tracking metrics state
  const [streakData, setStreakData] = useState({ currentStreak: 0, longestStreak: 0 });
  const [adherence, setAdherence] = useState(0);
  const [totalVolume, setTotalVolume] = useState(0);
  const [userStats, setUserStats] = useState({});

  const loadData = async () => {
    setLoading(true);
    try {
      const [loadedHistory, loadedStretches, loadedActivePlan, loadedStats] = await Promise.all([
        getWorkoutHistory(),
        getStretchSessions(),
        getActivePlan(),
        getUserStats()
      ]);
      setHistory(loadedHistory);
      setStretchSessions(loadedStretches);
      setActivePlan(loadedActivePlan);
      setUserStats(loadedStats);

      // Calculate tracking metrics
      const streak = calculateStreak(loadedHistory, loadedActivePlan);
      setStreakData(streak);

      const adherencePercent = calculateAdherence(loadedHistory, loadedActivePlan, 30);
      setAdherence(adherencePercent);

      const volume30Days = calculateTotalVolume(loadedHistory, 30);
      setTotalVolume(volume30Days);

      const pinned = progressiveOverloadService.getPinnedExercises();
      setPinnedExercisesState(pinned);

      try {
        const response = await fetch(EXERCISES_DATA_PATH);
        const exercisesData = await response.json();
        const exerciseNames = exercisesData.map(ex => ex['Exercise Name']).sort();
        setAvailableExercises(exerciseNames);
      } catch (error) {
        console.error('Error loading exercises:', error);
        const unique = progressiveOverloadService.getUniqueExercises(loadedHistory);
        setAvailableExercises(unique);
      }
    } catch (error) {
      console.error('Error loading progress data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDeleteWorkout = async (index) => {
    if (window.confirm('Are you sure you want to delete this workout? This action cannot be undone.')) {
      await deleteWorkout(index);
      await loadData();
    }
  };

  const handleEditWorkout = (workout, index) => {
    setEditingSession({ ...workout, index });
    setEditingSessionType('workout');
    setEditDialogOpen(true);
  };

  const handleSaveEdit = async (updatedData) => {
    try {
      if (editingSessionType === 'workout') {
        await updateWorkout(editingSession.index, updatedData);
      }

      await loadData();
      setEditDialogOpen(false);
      setEditingSession(null);
      setEditingSessionType(null);
    } catch (error) {
      console.error('Error saving edit:', error);
      alert('Failed to save changes. Please try again.');
    }
  };

  const handleRemovePinnedExercise = (exerciseName) => {
    progressiveOverloadService.removePinnedExercise(exerciseName);
    setPinnedExercisesState(pinnedExercises.filter(p => p.exerciseName !== exerciseName));
  };

  const handleAddPinnedExercise = (exerciseName) => {
    if (progressiveOverloadService.addPinnedExercise(exerciseName, 'weight')) {
      setPinnedExercisesState([...pinnedExercises, { exerciseName, trackingMode: 'weight' }]);
      setAddExerciseDialogOpen(false);
      setExerciseSearchQuery('');
    }
  };

  const workoutSessions = [
    ...history.map(workout => ({
      date: workout.date,
      type: workout.type || 'full',
      duration: workout.duration || 0,
      status: 'completed'
    })),
    ...stretchSessions.map(session => ({
      date: session.date,
      type: 'stretch',
      duration: session.duration || 0,
      status: 'completed'
    })),
    ...(activePlan?.sessions || []).map(session => ({
      date: session.date,
      type: session.type,
      duration: session.duration || 60,
      status: session.status || 'planned'
    }))
  ];

  const handleDayClick = (date) => {
    setSelectedDate(date);
    setTimeout(() => {
      const sessionList = document.querySelector('.activities-section');
      if (sessionList) {
        sessionList.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  const isSameDay = (date1, date2) => {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    return d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate();
  };

  const getFilteredSessions = () => {
    if (!selectedDate) {
      return {
        workouts: history,
        stretch: stretchSessions,
      };
    }

    return {
      workouts: history.filter(w => isSameDay(w.date, selectedDate)),
      stretch: stretchSessions.filter(s => isSameDay(s.date, selectedDate)),
    };
  };

  const filteredSessions = getFilteredSessions();
  const hasSessionsOnSelectedDay = selectedDate && (
    filteredSessions.workouts.length > 0 ||
    filteredSessions.stretch.length > 0
  );

  if (loading) {
    return (
      <Box sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh'
      }}>
        <Typography variant="h5" color="text.secondary">
          Loading...
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%', minHeight: '100vh', overflowX: 'hidden' }}>
      <CompactHeader title="Progress" subtitle="Track your fitness journey" />

      <Box sx={{ 
        maxWidth: '1400px', 
        margin: '0 auto', 
        p: { xs: 1, sm: 2, md: 3 }, 
        pb: { xs: '80px', md: 3 },
        width: '100%',
        boxSizing: 'border-box',
      }}>
        {/* Tab Navigation */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs
            value={currentTab}
            onChange={(e, newValue) => setCurrentTab(newValue)}
            variant="fullWidth"
            sx={{ maxWidth: { xs: '100%', sm: 600 }, margin: '0 auto' }}
          >
            <Tab 
              icon={<Assessment />} 
              iconPosition="start" 
              label="Statistics" 
              sx={{ minHeight: 48 }}
            />
            <Tab 
              icon={<EmojiEvents />} 
              iconPosition="start" 
              label="Achievements" 
              sx={{ minHeight: 48 }}
            />
          </Tabs>
        </Box>

        {/* Statistics Tab */}
        {currentTab === 0 && (
          <Stack spacing={3}>
          {/* Top Row: Streak, Adherence, Volume */}
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
              gap: 2,
            }}
          >
            <StreakDisplay
              currentStreak={streakData.currentStreak}
              longestStreak={streakData.longestStreak}
            />
            <AdherenceDisplay
              adherence={adherence}
              completedWorkouts={history.filter(w => {
                const workoutDate = new Date(w.date);
                const cutoff = new Date();
                cutoff.setDate(cutoff.getDate() - 30);
                return workoutDate >= cutoff;
              }).length}
              plannedWorkouts={Math.ceil((30 / 7) * 3)} // 3 workouts per week baseline
            />
            <VolumeTrendDisplay
              totalVolume={totalVolume}
              volumeChange={0} // Can be enhanced to compare with previous period
            />
          </Box>

          {/* 4-Week Progression Chart */}
          <FourWeekProgressionChart workoutHistory={history} />

          {/* Calendar */}
          <Card sx={{ bgcolor: 'background.paper' }}>
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                <Typography variant="h6">Calendar</Typography>
                <Button
                  size="small"
                  endIcon={calendarExpanded ? <ExpandLess /> : <ExpandMore />}
                  onClick={() => setCalendarExpanded(!calendarExpanded)}
                >
                  {calendarExpanded ? 'Monthly' : 'Weekly'}
                </Button>
              </Stack>
              <Calendar 
                workoutSessions={workoutSessions} 
                onDayClick={handleDayClick}
                viewMode={calendarExpanded ? 'monthly' : 'weekly'}
              />
              {selectedDate && (
                <Box sx={{ mt: 2, p: 2, bgcolor: 'action.hover', borderRadius: 2 }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {selectedDate.toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </Typography>
                    <IconButton size="small" onClick={() => setSelectedDate(null)}>
                      <Close fontSize="small" />
                    </IconButton>
                  </Stack>
                  {hasSessionsOnSelectedDay && (
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                      {filteredSessions.workouts.length +
                        filteredSessions.stretch.length} session(s) recorded
                    </Typography>
                  )}
                </Box>
              )}
            </CardContent>
          </Card>

          {/* Progressive Overload Tracking */}
          {history.length > 0 && (
            <Card sx={{ bgcolor: 'background.paper' }}>
              <CardContent>
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                  <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <TrendingUp /> Progressive Overload
                  </Typography>
                  {pinnedExercises.length < 10 && (
                    <Button
                      size="small"
                      startIcon={<Add />}
                      onClick={() => setAddExerciseDialogOpen(true)}
                      sx={{ color: 'secondary.main' }}
                    >
                      Track Exercise
                    </Button>
                  )}
                </Stack>

                {pinnedExercises.length === 0 ? (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      Track your favorite exercises to see your progress over time
                    </Typography>
                    <Button
                      variant="contained"
                      startIcon={<Add />}
                      onClick={() => setAddExerciseDialogOpen(true)}
                    >
                      Add Exercise
                    </Button>
                  </Box>
                ) : (
                  <Stack spacing={2}>
                    {pinnedExercises.map((pinned) => {
                      const progression = progressiveOverloadService.getExerciseProgression(
                        history,
                        pinned.exerciseName,
                        'weight'
                      );

                      const startingWeight = progression.length > 0 ? progression[0].value : 0;
                      const currentWeight = progression.length > 0 ? progression[progression.length - 1].value : 0;
                      const progressionDirection = currentWeight > startingWeight ? 'up' : 
                                                   currentWeight < startingWeight ? 'down' : 'same';

                      return (
                        <Box 
                          key={pinned.exerciseName}
                          sx={{
                            p: 2,
                            borderRadius: 2,
                            border: '1px solid',
                            borderColor: 'divider',
                            bgcolor: 'background.default',
                          }}
                        >
                          <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 1.5 }}>
                            <Typography variant="body1" sx={{ fontWeight: 600, flex: 1 }}>
                              {pinned.exerciseName}
                            </Typography>
                            <IconButton
                              onClick={() => handleRemovePinnedExercise(pinned.exerciseName)}
                              size="small"
                              sx={{ color: 'text.secondary' }}
                            >
                              <Close sx={{ fontSize: 18 }} />
                            </IconButton>
                          </Stack>

                          {progression.length > 0 ? (
                            <Stack 
                              direction="row" 
                              alignItems="center" 
                              spacing={2}
                              sx={{ justifyContent: 'center', py: 1 }}
                            >
                              <Box sx={{ textAlign: 'center' }}>
                                <Typography variant="caption" color="text.secondary">
                                  Starting
                                </Typography>
                                <Typography variant="h5" sx={{ fontWeight: 700, color: 'primary.main' }}>
                                  {startingWeight} lbs
                                </Typography>
                              </Box>
                              
                              <Box sx={{ display: 'flex', alignItems: 'center', px: 2 }}>
                                {progressionDirection === 'up' && (
                                  <TrendingUp sx={{ fontSize: 40, color: 'success.main' }} />
                                )}
                                {progressionDirection === 'down' && (
                                  <TrendingDown sx={{ fontSize: 40, color: 'error.main' }} />
                                )}
                                {progressionDirection === 'same' && (
                                  <Remove sx={{ fontSize: 40, color: 'text.secondary' }} />
                                )}
                              </Box>

                              <Box sx={{ textAlign: 'center' }}>
                                <Typography variant="caption" color="text.secondary">
                                  Current
                                </Typography>
                                <Typography variant="h5" sx={{ fontWeight: 700, color: 'secondary.main' }}>
                                  {currentWeight} lbs
                                </Typography>
                              </Box>
                            </Stack>
                          ) : (
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              sx={{ display: 'block', textAlign: 'center', py: 2 }}
                            >
                              No data available
                            </Typography>
                          )}
                        </Box>
                      );
                    })}
                  </Stack>
                )}
              </CardContent>
            </Card>
          )}

          {/* Recent Activities */}
          <Card sx={{ bgcolor: 'background.paper' }} className="activities-section">
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                <Typography variant="h6">
                  {selectedDate
                    ? `Activities on ${selectedDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`
                    : 'Recent Activities (Last 10 Workouts)'}
                </Typography>
                {selectedDate && (
                  <Button size="small" onClick={() => setSelectedDate(null)}>
                    Show All
                  </Button>
                )}
              </Stack>

              {/* Use enhanced ActivitiesList component */}
              {selectedDate && !hasSessionsOnSelectedDay ? (
                <Typography sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
                  No activities logged for this day.
                </Typography>
              ) : (
                <ActivitiesList
                  activities={selectedDate 
                    ? [...filteredSessions.workouts, ...filteredSessions.stretch]
                    : [...history.slice(0, 10)]
                  }
                  onEdit={(index) => {
                    const workout = selectedDate ? filteredSessions.workouts[index] : history[index];
                    handleEditWorkout(workout, index);
                  }}
                  onDelete={(index) => {
                    if (selectedDate) {
                      handleDeleteWorkout(index);
                    } else {
                      handleDeleteWorkout(index);
                    }
                  }}
                  maxVisible={10}
                  showLoadMore={!selectedDate && history.length > 10}
                />
              )}
            </CardContent>
          </Card>
        </Stack>
        )}

        {/* Achievements Tab */}
        {currentTab === 1 && (
          <Achievements 
            userStats={userStats} 
            workoutHistory={history} 
          />
        )}

        {/* Add Exercise Dialog */}
        <Dialog
          open={addExerciseDialogOpen}
          onClose={() => {
            setAddExerciseDialogOpen(false);
            setExerciseSearchQuery('');
          }}
          maxWidth="xs"
          fullWidth
        >
          <DialogTitle>Add Exercise to Track</DialogTitle>
          <DialogContent>
            <TextField
              fullWidth
              placeholder="Search exercises..."
              value={exerciseSearchQuery}
              onChange={(e) => setExerciseSearchQuery(e.target.value)}
              variant="outlined"
              size="small"
              sx={{ mb: 2, mt: 1 }}
            />
            <List sx={{ maxHeight: 400, overflow: 'auto' }}>
              {availableExercises
                .filter(ex => !pinnedExercises.some(p => p.exerciseName === ex))
                .filter(ex => ex.toLowerCase().includes(exerciseSearchQuery.toLowerCase()))
                .map((exerciseName) => (
                  <ListItem key={exerciseName} disablePadding>
                    <ListItemButton onClick={() => handleAddPinnedExercise(exerciseName)}>
                      <ListItemText primary={exerciseName} />
                    </ListItemButton>
                  </ListItem>
                ))}
            </List>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => {
              setAddExerciseDialogOpen(false);
              setExerciseSearchQuery('');
            }}>Cancel</Button>
          </DialogActions>
        </Dialog>

        {/* Edit Session Dialog */}
        {editingSession && (
          <EditSessionDialog
            open={editDialogOpen}
            onClose={() => {
              setEditDialogOpen(false);
              setEditingSession(null);
              setEditingSessionType(null);
            }}
            onSave={handleSaveEdit}
            session={editingSession}
            sessionType={editingSessionType}
          />
        )}
      </Box>
    </Box>
  );
};

// Edit Session Dialog Component
const EditSessionDialog = ({ open, onClose, onSave, session, sessionType }) => {
  const [duration, setDuration] = useState(session.duration ? Math.round(session.duration / 60) : 0);
  const [notes, setNotes] = useState(session.notes || '');
  const [workoutType, setWorkoutType] = useState(session.type || 'full');
  const [cardioType, setCardioType] = useState(session.cardioType || '');

  const handleSubmit = () => {
    const updatedData = {
      duration: duration * 60,
      notes: notes.trim(),
    };

    if (sessionType === 'workout') {
      updatedData.type = workoutType;
    } else if (sessionType === 'cardio') {
      updatedData.cardioType = cardioType.trim();
    }

    onSave(updatedData);
  };

  const getTitle = () => {
    switch (sessionType) {
      case 'workout': return 'Edit Workout';
      case 'cardio': return 'Edit Cardio Session';
      case 'hiit': return 'Edit HIIT Session';
      default: return 'Edit Session';
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{getTitle()}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField
            fullWidth
            type="number"
            label="Duration (minutes)"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            inputProps={{ min: 0, step: 1 }}
          />

          {sessionType === 'workout' && (
            <FormControl fullWidth>
              <InputLabel>Workout Type</InputLabel>
              <Select
                value={workoutType}
                label="Workout Type"
                onChange={(e) => setWorkoutType(e.target.value)}
              >
                <MenuItem value="upper">Upper Body</MenuItem>
                <MenuItem value="lower">Lower Body</MenuItem>
                <MenuItem value="full">Full Body</MenuItem>
              </Select>
            </FormControl>
          )}

          {sessionType === 'cardio' && (
            <TextField
              fullWidth
              label="Cardio Type"
              value={cardioType}
              onChange={(e) => setCardioType(e.target.value)}
            />
          )}

          <TextField
            fullWidth
            multiline
            rows={4}
            label="Notes (optional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSubmit} variant="contained">
          Save Changes
        </Button>
      </DialogActions>
    </Dialog>
  );
};

EditSessionDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
  session: PropTypes.object.isRequired,
  sessionType: PropTypes.string.isRequired,
};

ProgressDashboard.propTypes = {};

export default ProgressDashboard;
