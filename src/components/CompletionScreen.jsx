import { memo, useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { motion } from 'framer-motion';
import { formatTime, detectWorkoutType } from '../utils/helpers';
import { Box, Card, CardContent, Typography, Button, Stack, Chip, IconButton, Snackbar, Alert, keyframes } from '@mui/material';
import { Download, Check, Star, StarBorder, CalendarToday } from '@mui/icons-material';

// Spinning animation for the celebration icon (counter-clockwise like loading screen)
const spin = keyframes`
  from {
    transform: rotate(360deg);
  }
  to {
    transform: rotate(0deg);
  }
`;
import { saveFavoriteWorkout, getWorkoutHistory } from '../utils/storage';
import { getPersonalRecords, detectNewPRs } from '../utils/trackingMetrics';
import { PRNotification } from './CelebrationNotifications';
import AssignToDayDialog from './Common/AssignToDayDialog';
import { useWeekScheduling } from '../contexts/WeekSchedulingContext';

/**
 * CompletionScreen component displays workout summary after completion
 * Shows exercise details, sets, reps, and weights used
 * Memoized to prevent unnecessary re-renders
 */
const CompletionScreen = memo(({ workoutData, workoutPlan, onFinish, onExportCSV }) => {
  const [isFavorite, setIsFavorite] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [prNotifications, setPrNotifications] = useState([]);
  const [currentPRIndex, setCurrentPRIndex] = useState(0);
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [assignSnackbarOpen, setAssignSnackbarOpen] = useState(false);
  const [assignSnackbarMessage, setAssignSnackbarMessage] = useState('');
  
  const { isAutoAssignWeek, assignWorkoutToDay, weeklySchedule } = useWeekScheduling();

  // Check for PRs when component mounts
  useEffect(() => {
    const checkForPRs = async () => {
      try {
        const history = await getWorkoutHistory();
        // Get PRs from history excluding current workout
        const previousPRs = getPersonalRecords(history.slice(1));
        // Detect new PRs in current workout
        const newPRs = detectNewPRs(workoutData, previousPRs);
        if (newPRs.length > 0) {
          setPrNotifications(newPRs);
        }
      } catch (error) {
        console.error('Error checking for PRs:', error);
      }
    };

    checkForPRs();
  }, [workoutData]);

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Auto-assign workout to current day in Week 1
  useEffect(() => {
    const autoAssignWorkout = async () => {
      if (isAutoAssignWeek() && workoutData && workoutPlan) {
        try {
          const dayOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][new Date().getDay()];
          const workoutType = detectWorkoutType(workoutData);
          
          const sessionData = {
            sessionType: workoutType,
            sessionName: `${workoutType.charAt(0).toUpperCase() + workoutType.slice(1)} Body Workout`,
            exercises: workoutPlan,
            date: new Date().toISOString(),
          };
          
          await assignWorkoutToDay(dayOfWeek, sessionData);
          setAssignSnackbarMessage(`Automatically assigned to ${dayOfWeek}`);
          setAssignSnackbarOpen(true);
        } catch (error) {
          console.error('Error auto-assigning workout:', error);
        }
      }
    };
    
    autoAssignWorkout();
  }, [isAutoAssignWeek, workoutData, workoutPlan, assignWorkoutToDay]);

  const handleSaveToFavorites = () => {
    try {
      if (!workoutPlan || workoutPlan.length === 0) {
        alert('Cannot save workout: No exercise data available');
        return;
      }

      const workoutType = detectWorkoutType(workoutData);
      
      saveFavoriteWorkout({
        name: `${workoutType.charAt(0).toUpperCase() + workoutType.slice(1)} Body Workout`,
        type: workoutType,
        equipment: 'all',
        exercises: workoutPlan,
      });
      
      setIsFavorite(true);
      setSnackbarOpen(true);
    } catch (error) {
      console.error('Error saving to favorites:', error);
      alert('Failed to save workout to favorites');
    }
  };

  const handleAssignToDay = () => {
    setShowAssignDialog(true);
  };

  const handleAssignConfirm = async (dayOfWeek, sessionData) => {
    try {
      const workoutType = detectWorkoutType(workoutData);
      
      const fullSessionData = {
        sessionType: workoutType,
        sessionName: `${workoutType.charAt(0).toUpperCase() + workoutType.slice(1)} Body Workout`,
        exercises: workoutPlan,
        date: new Date().toISOString(),
      };
      
      await assignWorkoutToDay(dayOfWeek, fullSessionData);
      setAssignSnackbarMessage(`Workout assigned to ${dayOfWeek}`);
      setAssignSnackbarOpen(true);
    } catch (error) {
      console.error('Error assigning workout:', error);
      setAssignSnackbarMessage('Failed to assign workout');
      setAssignSnackbarOpen(true);
    }
  };

  return (
    <motion.div
      className="screen completion-screen"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      style={{ padding: '1rem', maxWidth: '900px', margin: '0 auto' }}
    >
      <motion.div
        className="completion-header"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
      >
        <Box sx={{ position: 'relative' }}>
          <IconButton 
            onClick={handleSaveToFavorites}
            disabled={isFavorite}
            sx={{ 
              position: 'absolute',
              top: 0,
              right: 0,
              color: isFavorite ? 'warning.main' : 'white',
              '&:hover': { color: 'warning.main' }
            }}
            aria-label="Save to favorites"
          >
            {isFavorite ? <Star sx={{ fontSize: 32 }} /> : <StarBorder sx={{ fontSize: 32 }} />}
          </IconButton>
        </Box>
        {/* Spinning celebration icon - uses same celebration dog as Workout Finish screen */}
        <Box
          component="img"
          src={`${import.meta.env.BASE_URL}goodlift-dog-celebration.svg`}
          alt="Celebration"
          sx={{
            width: { xs: '80px', sm: '100px' },
            height: { xs: '80px', sm: '100px' },
            marginBottom: '1rem',
            animation: `${spin} 1.5s linear infinite`,
          }}
        />
        <h1>Workout Complete!</h1>
        <p className="completion-time">
          Total Time: <strong>{formatTime(workoutData.duration)}</strong>
        </p>
      </motion.div>
      
      <div className="workout-summary-container">
        <Typography variant="h4" component="h2" sx={{ 
          fontWeight: 700,
          mb: 3,
          textAlign: 'center',
          color: 'text.primary'
        }}>
          Workout Summary
        </Typography>
        <Stack spacing={2}>
          {Object.entries(workoutData.exercises).map(([exerciseName, data], idx) => (
            <motion.div
              key={exerciseName}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + idx * 0.1 }}
            >
              <Card 
                sx={{ 
                  borderRadius: 3,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 8px 24px rgba(48, 86, 105, 0.15)',
                  }
                }}
              >
                <CardContent>
                  <Typography 
                    variant="h6" 
                    component="h3"
                    sx={{ 
                      color: 'primary.main',
                      fontWeight: 600,
                      mb: 2,
                      pb: 1,
                      borderBottom: '2px solid',
                      borderColor: 'rgba(138, 190, 185, 0.2)'
                    }}
                  >
                    {exerciseName}
                  </Typography>
                  <Stack spacing={1}>
                    {data.sets.map((set, setIdx) => (
                      <Box
                        key={setIdx}
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          p: 1.5,
                          bgcolor: 'rgba(183, 229, 205, 0.3)',
                          borderRadius: 2,
                          transition: 'all 0.2s ease',
                          '&:hover': {
                            bgcolor: 'primary.main',
                            color: 'white',
                            '& .MuiChip-root': {
                              bgcolor: 'white',
                              color: 'primary.main',
                            }
                          }
                        }}
                      >
                        <Chip 
                          label={`Set ${set.set}`}
                          size="small"
                          sx={{ 
                            fontWeight: 600,
                            minWidth: 60
                          }}
                        />
                        <Typography sx={{ fontWeight: 600, fontSize: '1rem' }}>
                          {set.weight} lbs × {set.reps} reps
                        </Typography>
                      </Box>
                    ))}
                  </Stack>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </Stack>
      </div>
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <Stack 
          direction={{ xs: 'column', sm: 'row' }}
          spacing={2}
          sx={{ mt: 4 }}
        >
          {!isAutoAssignWeek() && (
            <Button
              variant="outlined"
              size="large"
              startIcon={<CalendarToday />}
              onClick={handleAssignToDay}
              sx={{
                flex: 1,
                borderRadius: 2,
                py: 1.5,
                fontSize: '1rem',
                fontWeight: 600,
                borderColor: 'info.main',
                color: 'info.main',
                '&:hover': {
                  borderColor: 'info.dark',
                  bgcolor: 'rgba(33, 150, 243, 0.1)',
                }
              }}
            >
              Assign to Day
            </Button>
          )}
          <Button
            variant="outlined"
            size="large"
            startIcon={<Download />}
            onClick={onExportCSV}
            sx={{
              flex: 1,
              borderRadius: 2,
              py: 1.5,
              fontSize: '1rem',
              fontWeight: 600,
              borderColor: 'secondary.main',
              color: 'secondary.main',
              '&:hover': {
                borderColor: 'secondary.dark',
                bgcolor: 'rgba(193, 120, 90, 0.1)',
              }
            }}
          >
            Download CSV
          </Button>
          <Button
            variant="contained"
            size="large"
            startIcon={<Check />}
            onClick={onFinish}
            sx={{
              flex: 1,
              borderRadius: 2,
              py: 1.5,
              fontSize: '1rem',
              fontWeight: 600,
              bgcolor: 'primary.main',
              '&:hover': {
                bgcolor: 'primary.dark',
              }
            }}
          >
            Finish
          </Button>
        </Stack>
      </motion.div>
      
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="success" onClose={() => setSnackbarOpen(false)}>
          Workout saved to favorites!
        </Alert>
      </Snackbar>

      <Snackbar
        open={assignSnackbarOpen}
        autoHideDuration={3000}
        onClose={() => setAssignSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="success" onClose={() => setAssignSnackbarOpen(false)}>
          {assignSnackbarMessage}
        </Alert>
      </Snackbar>

      {/* Assign to Day Dialog */}
      <AssignToDayDialog
        open={showAssignDialog}
        onClose={() => setShowAssignDialog(false)}
        onAssign={handleAssignConfirm}
        workoutData={workoutData}
        currentSchedule={weeklySchedule}
      />

      {/* PR Notifications */}
      {prNotifications.length > 0 && currentPRIndex < prNotifications.length && (
        <PRNotification
          open={true}
          onClose={() => setCurrentPRIndex(prev => prev + 1)}
          prData={prNotifications[currentPRIndex]}
        />
      )}
    </motion.div>
  );
});

CompletionScreen.displayName = 'CompletionScreen';

CompletionScreen.propTypes = {
  workoutData: PropTypes.object.isRequired,
  workoutPlan: PropTypes.array,
  onFinish: PropTypes.func.isRequired,
  onExportCSV: PropTypes.func.isRequired,
};

export default CompletionScreen;
