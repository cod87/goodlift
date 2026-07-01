import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Box, 
  Card, 
  CardContent, 
  Typography, 
  TextField, 
  Button, 
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
  Snackbar,
  FormHelperText,
} from '@mui/material';
import { Formik, Form, Field } from 'formik';
import { 
  CalendarToday,
} from '@mui/icons-material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import PropTypes from 'prop-types';
import { 
  saveWorkout, 
  saveUserStats,
  getUserStats,
  getSavedWorkouts,
  saveSavedWorkout,
} from '../utils/storage';
import { useWeekScheduling } from '../contexts/WeekSchedulingContext';
import WorkoutCreationModal from '../components/WorkTabs/WorkoutCreationModal';
import AssignToDayDialog from '../components/Common/AssignToDayDialog';
import SavedWorkoutLogStep from '../components/Workout/SavedWorkoutLogStep';

// Sentinel value meaning "log without a saved workout template"
const CUSTOM_WORKOUT_ID = '__custom__'; // Kept for backwards compatibility if needed, but not selectable
const CREATE_NEW_ID = '__create_new__';

// Constants
const SECONDS_PER_MINUTE = 60;
const NAVIGATION_DELAY_MS = 1500;

const SESSION_TYPES = {
  STRENGTH: 'strength',
  CARDIO: 'cardio',
  YOGA: 'yoga',
  ACTIVE_RECOVERY: 'active_recovery',
  REST: 'rest',
  SICK_DAY: 'sick_day',
};

const WORKOUT_TYPES = {
  FULL: 'full',
  UPPER: 'upper',
  PUSH: 'push',
  PULL: 'pull',
  LEGS: 'legs',
  CORE: 'core',
};

const CARDIO_TYPES = {
  GENERAL: 'general',
  RUNNING: 'running',
  CYCLING: 'cycling',
  SWIMMING: 'swimming',
  HIIT: 'hiit',
};

const UnifiedLogActivityScreen = ({ onNavigate, initialDate }) => {
  const [notification, setNotification] = useState({ show: false, message: '', severity: 'success' });
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [lastLoggedSession, setLastLoggedSession] = useState(null);
  const [assignSnackbarOpen, setAssignSnackbarOpen] = useState(false);
  const [assignSnackbarMessage, setAssignSnackbarMessage] = useState('');

  // Saved workouts list for the dropdown
  const [savedWorkouts, setSavedWorkouts] = useState([]);
  // Selected saved workout id – CUSTOM_WORKOUT_ID means manual/custom fields
  const [selectedSavedWorkoutId, setSelectedSavedWorkoutId] = useState(null); // null = use first available

  // Step 1 = the main form; Step 2 = exercise detail entry for saved workouts
  const [step, setStep] = useState(1);
  // Captured form values when moving from step 1 → 2
  const [capturedFormValues, setCapturedFormValues] = useState(null);
  const [showWorkoutCreator, setShowWorkoutCreator] = useState(false);

  const { isAutoAssignWeek, assignWorkoutToDay, weeklySchedule } = useWeekScheduling();

  // Load saved workouts on mount
  useEffect(() => {
    const loadWorkouts = async () => {
      try {
        const workouts = await getSavedWorkouts();
        setSavedWorkouts(workouts || []);
        // Default to the first saved workout if available
        if (workouts && workouts.length > 0 && selectedSavedWorkoutId === null) {
          // Only default to saved workout if it has a valid id
          const firstId = workouts[0].id;
          setSelectedSavedWorkoutId(firstId !== null && firstId !== undefined ? firstId : null);
        } else if (!workouts || workouts.length === 0) {
          setSelectedSavedWorkoutId(null);
        }
      } catch (err) {
        console.error('Error loading saved workouts:', err);
        setSelectedSavedWorkoutId(null);
      }
    };
    loadWorkouts();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Determine if the current selection is a saved workout (not custom)
  const isUsingSavedWorkout = (sessionType) =>
    sessionType === SESSION_TYPES.STRENGTH &&
    selectedSavedWorkoutId !== null && selectedSavedWorkoutId !== CREATE_NEW_ID;

  const getSelectedWorkout = () =>
    savedWorkouts.find((w) => w.id === selectedSavedWorkoutId) || null;

  const initialValues = {
    date: initialDate instanceof Date ? initialDate : (initialDate ? new Date(initialDate) : new Date()),
    notes: '',
    // Session type selection
    sessionType: SESSION_TYPES.STRENGTH,
    // Workout-specific fields (for strength sessions in custom mode)
    cardioType: CARDIO_TYPES.GENERAL,
  };

  const validate = (values) => {
    const errors = {};
    
    if (!values.date) {
      errors.date = 'Date is required';
    }

    if (values.sessionType === SESSION_TYPES.STRENGTH && !isUsingSavedWorkout(values.sessionType)) {
      errors.sessionType = 'Please select a saved workout or create a new one';
    }
    
    return errors;
  };

  const handleSubmit = async (values, { setSubmitting, resetForm }) => {
    // If this is a strength session using a saved workout, go to step 2
    if (isUsingSavedWorkout(values.sessionType)) {
      setCapturedFormValues({ values, resetForm });
      setStep(2);
      setSubmitting(false);
      return;
    }

    // Otherwise proceed with immediate save (custom / non-strength)
    await persistWorkout(values, {}, resetForm, setSubmitting);
  };

  /**
   * Called from SavedWorkoutLogStep once the user finishes entering exercise data.
   * @param {{ exercises: Object }} exerciseResult
   */
  const handleExerciseSubmit = async ({ exercises }) => {
    if (!capturedFormValues) return;
    const { values, resetForm } = capturedFormValues;
    await persistWorkout(values, exercises, resetForm, () => {});
    // Do not reset step here to prevent UI jump before redirect
  };

  const handleSaveNewWorkout = async (workout) => {
    try {
      const newWorkout = await saveSavedWorkout(workout);
      const workouts = await getSavedWorkouts();
      setSavedWorkouts(workouts || []);
      if (newWorkout) setSelectedSavedWorkoutId(newWorkout.id);
      setShowWorkoutCreator(false);
    } catch (err) {
      console.error('Error saving new workout:', err);
    }
  };

  const handleWorkoutSelectChange = (e) => {
    const val = e.target.value;
    if (val === CREATE_NEW_ID) {
      setShowWorkoutCreator(true);
    } else {
      setSelectedSavedWorkoutId(val);
    }
  };

  const handleBackToForm = () => {
    setStep(1);
    setCapturedFormValues(null);
  };

  /**
   * Core save logic shared by both the direct submit and the exercise-detail submit.
   */
  const persistWorkout = async (values, exercises, resetForm, setSubmitting) => {
    try {
      const timestamp = values.date.getTime();
      const duration = 0; // Duration is no longer collected

      // Determine workout type label
      const selectedWorkout = getSelectedWorkout();
      const workoutType = values.sessionType === SESSION_TYPES.STRENGTH
        ? (selectedWorkout?.type || WORKOUT_TYPES.FULL)
        : values.sessionType === SESSION_TYPES.CARDIO
        ? values.cardioType
        : values.sessionType;

      // Save workout with manual log details
      const workoutData = {
        date: timestamp,
        duration: duration,
        type: workoutType,
        exercises: exercises || {},
        notes: values.notes.trim(),
        sessionName: selectedWorkout?.name ?? '',
        isManualLog: true,
        sessionType: values.sessionType,
      };



      await saveWorkout(workoutData);
      
      // Update stats only for non-rest and non-sick-day sessions
      if (values.sessionType !== SESSION_TYPES.REST && values.sessionType !== SESSION_TYPES.SICK_DAY) {
        const stats = await getUserStats();
        stats.totalWorkouts += 1;
        
        await saveUserStats(stats);
      }

      // Handle assignment workflow (exclude rest and sick days from auto-assignment)
      if (isAutoAssignWeek() && values.sessionType !== SESSION_TYPES.REST && values.sessionType !== SESSION_TYPES.SICK_DAY) {
        // Auto-assign in Week 1
        const dayOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][new Date(timestamp).getDay()];
        const sessionData = {
          sessionType: values.sessionType,
          sessionName: getSessionTypeName(values.sessionType, workoutType, values.cardioType),
          date: new Date(timestamp).toISOString(),
        };
        
        await assignWorkoutToDay(dayOfWeek, sessionData);
        
        setNotification({
          show: true,
          message: `Activity logged and assigned to ${dayOfWeek}!`,
          severity: 'success'
        });
      } else {
        // Store session for manual assignment
        setLastLoggedSession({
          sessionType: values.sessionType,
          sessionName: getSessionTypeName(values.sessionType, workoutType, values.cardioType),
          date: new Date(timestamp).toISOString(),
        });
        
        setNotification({
          show: true,
          message: 'Activity logged successfully!',
          severity: 'success'
        });
      }
      
      if (resetForm) resetForm();
      
      // Redirect to progress screen after a brief delay
      setTimeout(() => {
        if (onNavigate) {
          onNavigate('progress');
        }
      }, NAVIGATION_DELAY_MS);
    } catch (error) {
      console.error('Error saving activity:', error);
      setNotification({
        show: true,
        message: 'Failed to save activity. Please try again.',
        severity: 'error'
      });
    } finally {
      if (setSubmitting) setSubmitting(false);
    }
  };

  const getSessionTypeName = (sessionType, workoutType, cardioType) => {
    if (sessionType === SESSION_TYPES.STRENGTH) {
      const typeMap = {
        [WORKOUT_TYPES.FULL]: 'Full Body',
        [WORKOUT_TYPES.UPPER]: 'Upper Body',
        [WORKOUT_TYPES.PUSH]: 'Push',
        [WORKOUT_TYPES.PULL]: 'Pull',
        [WORKOUT_TYPES.LEGS]: 'Legs',
        [WORKOUT_TYPES.CORE]: 'Core',
      };
      return typeMap[workoutType] || 'Strength';
    }
    
    if (sessionType === SESSION_TYPES.CARDIO) {
      const cardioTypeMap = {
        [CARDIO_TYPES.GENERAL]: 'Cardio',
        [CARDIO_TYPES.RUNNING]: 'Running',
        [CARDIO_TYPES.CYCLING]: 'Cycling',
        [CARDIO_TYPES.SWIMMING]: 'Swimming',
        [CARDIO_TYPES.HIIT]: 'HIIT',
      };
      return cardioTypeMap[cardioType] || 'Cardio';
    }
    
    const typeMap = {
      [SESSION_TYPES.YOGA]: 'Yoga',
      [SESSION_TYPES.ACTIVE_RECOVERY]: 'Active Recovery',
      [SESSION_TYPES.REST]: 'Rest',
      [SESSION_TYPES.SICK_DAY]: 'Sick Day',
    };
    return typeMap[sessionType] || sessionType;
  };

  const handleAssignConfirm = async (dayOfWeek) => {
    if (lastLoggedSession) {
      try {
        await assignWorkoutToDay(dayOfWeek, lastLoggedSession);
        setAssignSnackbarMessage(`Session assigned to ${dayOfWeek}`);
        setAssignSnackbarOpen(true);
        setLastLoggedSession(null);
      } catch (error) {
        console.error('Error assigning session:', error);
        setAssignSnackbarMessage('Failed to assign session');
        setAssignSnackbarOpen(true);
      }
    }
  };

  const getActivityTitle = () => {
    return 'Log Activity';
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box
        sx={{
          width: '100%',
          maxWidth: '700px',
          margin: '0 auto',
          padding: { xs: '1rem 0.75rem', sm: '1.5rem 1rem', md: '2rem 1rem' },
          boxSizing: 'border-box',
        }}
      >
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
        <Box sx={{ mb: 1.5 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
            {getActivityTitle()}
          </Typography>
        </Box>

        {notification.show && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Alert 
              severity={notification.severity} 
              sx={{ mb: 3 }}
              onClose={() => setNotification({ ...notification, show: false })}
            >
              {notification.message}
            </Alert>
          </motion.div>
        )}

        <Card sx={{ 
          borderRadius: 3,
          width: '100%',
          boxSizing: 'border-box',
        }}>
          <CardContent sx={{ 
            p: { xs: 2, sm: 3 },
            '&:last-child': { pb: { xs: 2, sm: 3 } }
          }}>
            {/* ── Step 2: Exercise detail entry ── */}
            {step === 2 && capturedFormValues && (
              <SavedWorkoutLogStep
                workout={getSelectedWorkout()}
                onSubmit={handleExerciseSubmit}
                onBack={handleBackToForm}
              />
            )}

            {/* ── Step 1: Main form ── */}
            {step === 1 && (
            <Formik
              initialValues={initialValues}
              validate={validate}
              onSubmit={handleSubmit}
            >
              {({ errors, touched, isSubmitting, isValid, dirty, values, setFieldValue, submitCount }) => (
                <Form>
                  <Stack spacing={2}>
                    {/* Date Field */}
                    <Field name="date">
                      {() => (
                        <DatePicker
                          label="Date"
                          value={values.date}
                          onChange={(newValue) => setFieldValue('date', newValue)}
                          slotProps={{
                            textField: {
                              fullWidth: true,
                              error: touched.date && Boolean(errors.date),
                              helperText: touched.date && errors.date,
                              sx: { width: '100%' }
                            }
                          }}
                          sx={{ width: '100%' }}
                        />
                      )}
                    </Field>

                    {/* Session Type Selection */}
                    <FormControl fullWidth>
                      <InputLabel>Session Type</InputLabel>
                      <Select
                        value={values.sessionType}
                        label="Session Type"
                        onChange={(e) => setFieldValue('sessionType', e.target.value)}
                      >
                        <MenuItem value={SESSION_TYPES.STRENGTH}>Strength</MenuItem>
                        <MenuItem value={SESSION_TYPES.CARDIO}>Cardio</MenuItem>
                        <MenuItem value={SESSION_TYPES.YOGA}>Yoga</MenuItem>
                        <MenuItem value={SESSION_TYPES.ACTIVE_RECOVERY}>Active Recovery</MenuItem>
                        <MenuItem value={SESSION_TYPES.REST}>Rest Day</MenuItem>
                        <MenuItem value={SESSION_TYPES.SICK_DAY}>Sick Day</MenuItem>
                      </Select>
                    </FormControl>

                    {/* ── Saved Workout selector (strength only) ── */}
                    {values.sessionType === SESSION_TYPES.STRENGTH && (
                      <FormControl fullWidth error={submitCount > 0 && !isUsingSavedWorkout(values.sessionType)}>
                        <InputLabel>Workout</InputLabel>
                        <Select
                          value={selectedSavedWorkoutId ?? ''}
                          label="Workout"
                          onChange={handleWorkoutSelectChange}
                        >
                          {savedWorkouts.map((w, idx) => (
                            <MenuItem key={w.id ?? idx} value={w.id}>
                              {w.name || `Workout ${idx + 1}`}
                            </MenuItem>
                          ))}
                          <MenuItem value={CREATE_NEW_ID}>+ Create New Workout...</MenuItem>
                        </Select>
                        {submitCount > 0 && !isUsingSavedWorkout(values.sessionType) && (
                          <FormHelperText>Please select a saved workout or create a new one</FormHelperText>
                        )}
                      </FormControl>
                    )}

                    

                    {/* Cardio Type for Cardio Sessions */}
                    {values.sessionType === SESSION_TYPES.CARDIO && (
                      <FormControl fullWidth>
                        <InputLabel>Cardio Type</InputLabel>
                        <Select
                          value={values.cardioType}
                          label="Cardio Type"
                          onChange={(e) => setFieldValue('cardioType', e.target.value)}
                        >
                          <MenuItem value={CARDIO_TYPES.GENERAL}>General Cardio</MenuItem>
                          <MenuItem value={CARDIO_TYPES.RUNNING}>Running</MenuItem>
                          <MenuItem value={CARDIO_TYPES.CYCLING}>Cycling</MenuItem>
                          <MenuItem value={CARDIO_TYPES.SWIMMING}>Swimming</MenuItem>
                          <MenuItem value={CARDIO_TYPES.HIIT}>HIIT</MenuItem>
                        </Select>
                      </FormControl>
                    )}

                    

                    {/* Notes Field */}
                    <Field name="notes">
                      {({ field }) => (
                        <TextField
                          {...field}
                          fullWidth
                          multiline
                          rows={4}
                          label="Notes (optional)"
                          placeholder="Add any notes about your session..."
                          variant="outlined"
                        />
                      )}
                    </Field>

                    <Button
                      type="submit"
                      variant="contained"
                      fullWidth
                      disabled={isSubmitting || !isValid || !dirty}
                      sx={{ 
                        bgcolor: 'primary.main',
                        '&:hover': { 
                          bgcolor: 'primary.main',
                          filter: 'brightness(0.9)'
                        },
                        py: 1.5,
                        fontWeight: 600,
                        mt: 2
                      }}
                    >
                      {isSubmitting
                        ? 'Loading…'
                        : isUsingSavedWorkout(values.sessionType)
                        ? 'Next: Enter Sets'
                        : `Log ${getActivityTitle().replace('Log ', '')}`}
                    </Button>

                    {/* Assign to Day Button - Show if not auto-assign week and has logged session */}
                    {!isAutoAssignWeek() && lastLoggedSession && (
                      <Button
                        variant="outlined"
                        fullWidth
                        startIcon={<CalendarToday />}
                        onClick={() => setShowAssignDialog(true)}
                        sx={{ 
                          mt: 1,
                          py: 1.5,
                          fontWeight: 600,
                        }}
                      >
                        Assign to Day of Week
                      </Button>
                    )}
                  </Stack>
                </Form>
              )}
            </Formik>
            )}
          </CardContent>
        </Card>
        </motion.div>

        {/* Snackbars */}
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
          workoutData={lastLoggedSession}
          currentSchedule={weeklySchedule}
        />
        <WorkoutCreationModal
          open={showWorkoutCreator}
          onClose={() => setShowWorkoutCreator(false)}
          onSave={handleSaveNewWorkout}
          exercises={[]}
        />
      </Box>
    </LocalizationProvider>
  );
};

UnifiedLogActivityScreen.propTypes = {
  onNavigate: PropTypes.func,
  initialDate: PropTypes.instanceOf(Date),
};

export default UnifiedLogActivityScreen;
