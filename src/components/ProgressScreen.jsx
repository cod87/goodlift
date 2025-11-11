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
  Chip,
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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  Remove,
  Add,
  Close,
  Edit,
  Delete,
  ArrowForward,
  ExpandMore,
  ExpandLess,
} from '@mui/icons-material';
import CompactHeader from './Common/CompactHeader';
import Calendar from './Calendar';
import {
  getWorkoutHistory,
  deleteWorkout,
  updateWorkout,
  getStretchSessions,
  getYogaSessions,
  getHiitSessions,
  getCardioSessions,
  deleteStretchSession,
  deleteYogaSession,
  deleteHiitSession,
  deleteCardioSession,
  updateYogaSession,
  updateHiitSession,
  updateCardioSession,
  getPinnedExercises,
  removePinnedExercise,
  addPinnedExercise,
  getActivePlan,
} from '../utils/storage';
import { formatDate, formatDuration } from '../utils/helpers';
import {
  getExerciseProgression,
  getUniqueExercises,
} from '../utils/progressionHelpers';
import { EXERCISES_DATA_PATH } from '../utils/constants';

/**
 * ProgressDashboard - Complete progress tracking dashboard
 * Redesigned to match the modern style of Training Hub
 */
const ProgressDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState([]);
  const [stretchSessions, setStretchSessions] = useState([]);
  const [yogaSessions, setYogaSessions] = useState([]);
  const [hiitSessions, setHiitSessions] = useState([]);
  const [cardioSessions, setCardioSessions] = useState([]);
  const [activePlan, setActivePlan] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [pinnedExercises, setPinnedExercisesState] = useState([]);
  const [availableExercises, setAvailableExercises] = useState([]);
  const [statsFilter, setStatsFilter] = useState('all'); // Changed from timeFilter
  const [addExerciseDialogOpen, setAddExerciseDialogOpen] = useState(false);
  const [exerciseSearchQuery, setExerciseSearchQuery] = useState('');
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingSession, setEditingSession] = useState(null);
  const [editingSessionType, setEditingSessionType] = useState(null);
  const [calendarExpanded, setCalendarExpanded] = useState(false); // For weekly/monthly toggle

  const loadData = async () => {
    setLoading(true);
    try {
      const [loadedHistory, loadedStretches, loadedYoga, loadedHiit, loadedCardio, loadedActivePlan] = await Promise.all([
        getWorkoutHistory(),
        getStretchSessions(),
        getYogaSessions(),
        getHiitSessions(),
        getCardioSessions(),
        getActivePlan()
      ]);
      setHistory(loadedHistory);
      setStretchSessions(loadedStretches);
      setYogaSessions(loadedYoga);
      setHiitSessions(loadedHiit);
      setCardioSessions(loadedCardio);
      setActivePlan(loadedActivePlan);

      const pinned = getPinnedExercises();
      setPinnedExercisesState(pinned);

      try {
        const response = await fetch(EXERCISES_DATA_PATH);
        const exercisesData = await response.json();
        const exerciseNames = exercisesData.map(ex => ex['Exercise Name']).sort();
        setAvailableExercises(exerciseNames);
      } catch (error) {
        console.error('Error loading exercises:', error);
        const unique = getUniqueExercises(loadedHistory);
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

  const handleDeleteStretch = async (sessionId) => {
    if (window.confirm('Are you sure you want to delete this stretch session? This action cannot be undone.')) {
      await deleteStretchSession(sessionId);
      await loadData();
    }
  };

  const handleDeleteYoga = async (sessionId) => {
    if (window.confirm('Are you sure you want to delete this yoga session? This action cannot be undone.')) {
      await deleteYogaSession(sessionId);
      await loadData();
    }
  };

  const handleDeleteHiit = async (sessionId) => {
    if (window.confirm('Are you sure you want to delete this HIIT session? This action cannot be undone.')) {
      await deleteHiitSession(sessionId);
      await loadData();
    }
  };

  const handleDeleteCardio = async (sessionId) => {
    if (window.confirm('Are you sure you want to delete this cardio session? This action cannot be undone.')) {
      await deleteCardioSession(sessionId);
      await loadData();
    }
  };

  const handleEditWorkout = (workout, index) => {
    setEditingSession({ ...workout, index });
    setEditingSessionType('workout');
    setEditDialogOpen(true);
  };

  const handleEditCardio = (session) => {
    setEditingSession(session);
    setEditingSessionType('cardio');
    setEditDialogOpen(true);
  };

  const handleEditHiit = (session) => {
    setEditingSession(session);
    setEditingSessionType('hiit');
    setEditDialogOpen(true);
  };

  const handleEditYoga = (session) => {
    setEditingSession(session);
    setEditingSessionType('yoga');
    setEditDialogOpen(true);
  };

  const handleSaveEdit = async (updatedData) => {
    try {
      if (editingSessionType === 'workout') {
        await updateWorkout(editingSession.index, updatedData);
      } else if (editingSessionType === 'cardio') {
        await updateCardioSession(editingSession.id, updatedData);
      } else if (editingSessionType === 'hiit') {
        await updateHiitSession(editingSession.id, updatedData);
      } else if (editingSessionType === 'yoga') {
        await updateYogaSession(editingSession.id, updatedData);
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
    removePinnedExercise(exerciseName);
    setPinnedExercisesState(pinnedExercises.filter(p => p.exerciseName !== exerciseName));
  };

  const handleAddPinnedExercise = (exerciseName) => {
    if (addPinnedExercise(exerciseName, 'weight')) {
      setPinnedExercisesState([...pinnedExercises, { exerciseName, trackingMode: 'weight' }]);
      setAddExerciseDialogOpen(false);
      setExerciseSearchQuery('');
    }
  };

  const filterByTimePeriod = (sessions) => {
    if (statsFilter === 'all') return sessions;

    const now = new Date();
    let cutoffDate;

    if (statsFilter === 'month') {
      cutoffDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    } else if (statsFilter === '2weeks') {
      cutoffDate = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
    }

    return sessions.filter(session => new Date(session.date) >= cutoffDate);
  };

  const getFilteredStats = () => {
    const filteredWorkouts = filterByTimePeriod(history);
    const filteredCardio = filterByTimePeriod(cardioSessions);
    const filteredHiit = filterByTimePeriod(hiitSessions);
    const filteredYoga = filterByTimePeriod(yogaSessions);

    const totalWorkouts = filteredWorkouts.length;
    const totalWorkoutTime = filteredWorkouts.reduce((sum, w) => sum + (w.duration || 0), 0);
    const avgWorkout = totalWorkouts > 0 ? Math.round(totalWorkoutTime / totalWorkouts / 60) : 0;

    const allCardio = [...filteredCardio, ...filteredHiit];
    const totalCardio = allCardio.length;
    const totalCardioTime = allCardio.reduce((sum, s) => sum + (s.duration || 0), 0);
    const avgCardio = totalCardio > 0 ? Math.round(totalCardioTime / totalCardio / 60) : 0;

    const totalYoga = filteredYoga.length;
    const totalYogaTime = filteredYoga.reduce((sum, s) => sum + (s.duration || 0), 0);
    const avgYoga = totalYoga > 0 ? Math.round(totalYogaTime / totalYoga / 60) : 0;

    return {
      totalWorkouts,
      avgWorkout,
      totalCardio,
      avgCardio,
      totalYoga,
      avgYoga
    };
  };

  const filteredStats = getFilteredStats();

  const workoutSessions = [
    ...history.map(workout => ({
      date: workout.date,
      type: workout.type || 'full',
      duration: workout.duration || 0,
      status: 'completed'
    })),
    ...hiitSessions.map(session => ({
      date: session.date,
      type: 'hiit',
      duration: session.duration || 0,
      status: 'completed'
    })),
    ...cardioSessions.map(session => ({
      date: session.date,
      type: 'cardio',
      duration: session.duration || 0,
      status: 'completed'
    })),
    ...stretchSessions.map(session => ({
      date: session.date,
      type: 'stretch',
      duration: session.duration || 0,
      status: 'completed'
    })),
    ...yogaSessions.map(session => ({
      date: session.date,
      type: 'yoga',
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
        hiit: hiitSessions,
        stretch: stretchSessions,
        yoga: yogaSessions,
        cardio: cardioSessions
      };
    }

    return {
      workouts: history.filter(w => isSameDay(w.date, selectedDate)),
      hiit: hiitSessions.filter(s => isSameDay(s.date, selectedDate)),
      stretch: stretchSessions.filter(s => isSameDay(s.date, selectedDate)),
      yoga: yogaSessions.filter(s => isSameDay(s.date, selectedDate)),
      cardio: cardioSessions.filter(s => isSameDay(s.date, selectedDate))
    };
  };

  const filteredSessions = getFilteredSessions();
  const hasSessionsOnSelectedDay = selectedDate && (
    filteredSessions.workouts.length > 0 ||
    filteredSessions.hiit.length > 0 ||
    filteredSessions.stretch.length > 0 ||
    filteredSessions.yoga.length > 0 ||
    filteredSessions.cardio.length > 0
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
    <Box sx={{ width: '100%', minHeight: '100vh' }}>
      <CompactHeader title="Progress" subtitle="Track your fitness journey" />

      <Box sx={{ maxWidth: '1400px', margin: '0 auto', p: { xs: 2, md: 3 } }}>
        <Stack spacing={2}>
          {/* Stats Table */}
          <Card sx={{ bgcolor: 'background.paper' }}>
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                <Typography variant="h6">Statistics</Typography>
                <FormControl size="small" sx={{ minWidth: 120 }}>
                  <InputLabel>Period</InputLabel>
                  <Select
                    value={statsFilter}
                    label="Period"
                    onChange={(e) => setStatsFilter(e.target.value)}
                  >
                    <MenuItem value="all">All Time</MenuItem>
                    <MenuItem value="month">Past Month</MenuItem>
                    <MenuItem value="2weeks">Past 2 Weeks</MenuItem>
                  </Select>
                </FormControl>
              </Stack>

              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700 }}>Category</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>Sessions</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>Avg Duration</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    <TableRow>
                      <TableCell>Workouts</TableCell>
                      <TableCell align="right">{filteredStats.totalWorkouts}</TableCell>
                      <TableCell align="right">{filteredStats.avgWorkout}m</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Cardio & HIIT</TableCell>
                      <TableCell align="right">{filteredStats.totalCardio}</TableCell>
                      <TableCell align="right">{filteredStats.avgCardio}m</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Mobility & Yoga</TableCell>
                      <TableCell align="right">{filteredStats.totalYoga}</TableCell>
                      <TableCell align="right">{filteredStats.avgYoga}m</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>

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
                        filteredSessions.hiit.length +
                        filteredSessions.stretch.length +
                        filteredSessions.yoga.length +
                        filteredSessions.cardio.length} session(s) recorded
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
                      const progression = getExerciseProgression(
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
                    : 'Recent Activities'}
                </Typography>
                {selectedDate && (
                  <Button size="small" onClick={() => setSelectedDate(null)}>
                    Show All
                  </Button>
                )}
              </Stack>

              <Stack spacing={1}>
                {selectedDate && !hasSessionsOnSelectedDay ? (
                  <Typography sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
                    No activities logged for this day.
                  </Typography>
                ) : (
                  <>
                    {/* Workout Sessions */}
                    {filteredSessions.workouts.map((workout, idx) => (
                      <ActivityCard
                        key={`workout-${idx}`}
                        type="workout"
                        session={workout}
                        index={idx}
                        onEdit={() => handleEditWorkout(workout, idx)}
                        onDelete={() => handleDeleteWorkout(idx)}
                      />
                    ))}

                    {/* HIIT Sessions */}
                    {filteredSessions.hiit.map((session) => (
                      <ActivityCard
                        key={session.id}
                        type="hiit"
                        session={session}
                        onEdit={() => handleEditHiit(session)}
                        onDelete={() => handleDeleteHiit(session.id)}
                      />
                    ))}

                    {/* Cardio Sessions */}
                    {filteredSessions.cardio.map((session) => (
                      <ActivityCard
                        key={session.id}
                        type="cardio"
                        session={session}
                        onEdit={() => handleEditCardio(session)}
                        onDelete={() => handleDeleteCardio(session.id)}
                      />
                    ))}

                    {/* Yoga Sessions */}
                    {filteredSessions.yoga.map((session) => (
                      <ActivityCard
                        key={session.id}
                        type="yoga"
                        session={session}
                        onEdit={() => handleEditYoga(session)}
                        onDelete={() => handleDeleteYoga(session.id)}
                      />
                    ))}

                    {/* Stretch Sessions */}
                    {filteredSessions.stretch.map((session) => (
                      <ActivityCard
                        key={session.id}
                        type="stretch"
                        session={session}
                        onDelete={() => handleDeleteStretch(session.id)}
                      />
                    ))}

                    {!selectedDate && history.length === 0 && hiitSessions.length === 0 &&
                      stretchSessions.length === 0 && yogaSessions.length === 0 && cardioSessions.length === 0 && (
                        <Typography sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
                          No activity history yet. Complete your first activity to see it here!
                        </Typography>
                      )}
                  </>
                )}
              </Stack>
            </CardContent>
          </Card>
        </Stack>

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

// Activity Card Component
const ActivityCard = ({ type, session, onEdit, onDelete }) => {
  const FitnessCenter = () => <span>🏋️</span>;
  const Whatshot = () => <span>🔥</span>;
  const DirectionsRun = () => <span>🏃</span>;
  const SelfImprovement = () => <span>🧘</span>;

  const getIcon = () => {
    switch (type) {
      case 'hiit': return <Whatshot />;
      case 'cardio': return <DirectionsRun />;
      case 'yoga': return <SelfImprovement />;
      case 'stretch': return <DirectionsRun />;
      default: return <FitnessCenter />;
    }
  };

  const getLabel = () => {
    switch (type) {
      case 'hiit': return 'HIIT Session';
      case 'cardio': return session.cardioType || 'Cardio';
      case 'yoga': return 'Yoga Session';
      case 'stretch': return 'Stretch Session';
      default: return session.type ? `${session.type.charAt(0).toUpperCase() + session.type.slice(1)} Body` : 'Workout';
    }
  };

  const getBorderColor = () => {
    switch (type) {
      case 'hiit': return 'secondary.main';
      case 'cardio': return '#2196f3';
      case 'yoga': return '#9c27b0';
      case 'stretch': return 'success.main';
      default: return 'primary.main';
    }
  };

  return (
    <Card sx={{
      borderLeft: '3px solid',
      borderLeftColor: getBorderColor(),
      borderRadius: 1,
      transition: 'all 0.2s ease',
      '&:hover': {
        transform: 'translateX(2px)',
        boxShadow: '0 2px 8px rgba(48, 86, 105, 0.12)',
      }
    }}>
      <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ flex: 1 }}>
            <Stack direction="row" spacing={0.75} alignItems="center" sx={{ mb: 0.25 }}>
              {getIcon()}
              <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.875rem' }}>
                {getLabel()}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                • {formatDate(session.date)}
              </Typography>
              {session.isPartial && (
                <Chip
                  label="Partial"
                  size="small"
                  sx={{ height: 18, fontSize: '0.65rem' }}
                  variant="outlined"
                />
              )}
            </Stack>
            <Stack direction="row" spacing={1} alignItems="center">
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                {formatDuration(session.duration)}
              </Typography>
              {session.exercises && (
                <>
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                    •
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                    {Object.keys(session.exercises).length} exercises
                  </Typography>
                </>
              )}
            </Stack>
          </Box>
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            {onEdit && (
              <IconButton
                onClick={onEdit}
                size="small"
                sx={{ color: 'text.secondary' }}
              >
                <Edit sx={{ fontSize: 18 }} />
              </IconButton>
            )}
            {onDelete && (
              <IconButton
                onClick={onDelete}
                size="small"
                sx={{ color: 'text.secondary' }}
              >
                <Delete sx={{ fontSize: 18 }} />
              </IconButton>
            )}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

ActivityCard.propTypes = {
  type: PropTypes.string.isRequired,
  session: PropTypes.object.isRequired,
  onEdit: PropTypes.func,
  onDelete: PropTypes.func,
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
      case 'yoga': return 'Edit Yoga Session';
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
