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
} from '../utils/storage';
import { useWeekScheduling } from '../contexts/WeekSchedulingContext';
import AssignToDayDialog from '../components/Common/AssignToDayDialog';
import SavedWorkoutLogStep from '../components/Workout/SavedWorkoutLogStep';

// Sentinel value meaning "log without a saved workout template"
const CUSTOM_WORKOUT_ID = '__custom__';

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
          setSelectedSavedWorkoutId(firstId !== null && firstId !== undefined ? firstId : CUSTOM_WORKOUT_ID);
        } else if (!workouts || workouts.length === 0) {
          setSelectedSavedWorkoutId(CUSTOM_WORKOUT_ID);
        }
      } catch (err) {
        console.error('Error loading saved workouts:', err);
        setSelectedSavedWorkoutId(CUSTOM_WORKOUT_ID);
      }
    };
    loadWorkouts();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Determine if the current selection is a saved workout (not custom)
  const isUsingSavedWorkout = (sessionType) =>
    sessionType === SESSION_TYPES.STRENGTH &&
    selectedSavedWorkoutId !== CUSTOM_WORKOUT_ID &&
    selectedSavedWorkoutId !== null;

  const getSelectedWorkout = () =>
    savedWorkouts.find((w) => w.id === selectedSavedWorkoutId) || null;

  const initialValues = {
    date: initialDate instanceof Date ? initialDate : (initialDate ? new Date(initialDate) : new Date()),
    duration: '',
    notes: '',
    sessionName: '', // Optional session name
    // Session type selection
    sessionType: SESSION_TYPES.STRENGTH,
    // Workout-specific fields (for strength sessions in custom mode)
    workoutType: WORKOUT_TYPES.FULL,
    // Cardio-specific fields
    cardioType: CARDIO_TYPES.GENERAL,
    numExercises: '',
    setsPerExercise: '',
  };

  const validate = (values) => {
    const errors = {};
    
    if (!values.date) {
      errors.date = 'Date is required';
    }
    
    // Only validate duration for non-rest and non-sick-day sessions
    if (values.sessionType !== SESSION_TYPES.REST && values.sessionType !== SESSION_TYPES.SICK_DAY) {
      if (!values.duration) {
        errors.duration = 'Duration is required';
      } else if (isNaN(values.duration) || parseFloat(values.duration) <= 0) {
        errors.duration = 'Duration must be a positive number';
      }
    }

    // Only validate custom strength fields when NOT using a saved workout
    if (values.sessionType === SESSION_TYPES.STRENGTH && !isUsingSavedWorkout(values.sessionType)) {
      if (!values.numExercises) {
        errors.numExercises = 'Number of exercises is required';
      } else if (isNaN(values.numExercises) || parseInt(values.numExercises) <= 0) {
        errors.numExercises = 'Must be a positive number';
      }

      if (!values.setsPerExercise) {
        errors.setsPerExercise = 'Sets per exercise is required';
      } else if (isNaN(values.setsPerExercise) || parseInt(values.setsPerExercise) <= 0) {
        errors.setsPerExercise = 'Must be a positive number';
      }
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
    setStep(1);
    setCapturedFormValues(null);
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
      // For rest days and sick days, set duration to 0 if not provided
      const duration = (values.sessionType === SESSION_TYPES.REST || values.sessionType === SESSION_TYPES.SICK_DAY) && !values.duration 
        ? 0 
        : parseFloat(values.duration) * SECONDS_PER_MINUTE;

      // Determine workout type label
      const selectedWorkout = getSelectedWorkout();
      const workoutType = values.sessionType === SESSION_TYPES.STRENGTH
        ? (selectedWorkout?.type || values.workoutType)
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
        sessionName: values.sessionName.trim() || (selectedWorkout?.name ?? ''),
        isManualLog: true,
        sessionType: values.sessionType,
      };

      // Add strength-specific fields only for custom strength sessions
      if (values.sessionType === SESSION_TYPES.STRENGTH && !isUsingSavedWorkout(values.sessionType)) {
        workoutData.numExercises = parseInt(values.numExercises);
        workoutData.setsPerExercise = parseInt(values.setsPerExercise);
      }

      await saveWorkout(workoutData);
      
      // Update stats only for non-rest and non-sick-day sessions
      if (values.sessionType !== SESSION_TYPES.REST && values.sessionType !== SESSION_TYPES.SICK_DAY) {
        const stats = await getUserStats();
        stats.totalWorkouts += 1;
        stats.totalTime += workoutData.duration;
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
              {({ errors, touched, isSubmitting, isValid, dirty, values, setFieldValue }) => (
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
                      <FormControl fullWidth>
                        <InputLabel>Workout</InputLabel>
                        <Select
                          value={selectedSavedWorkoutId ?? CUSTOM_WORKOUT_ID}
                          label="Workout"
                          onChange={(e) => setSelectedSavedWorkoutId(e.target.value)}
                        >
                          {savedWorkouts.map((w, idx) => (
                            <MenuItem key={w.id ?? idx} value={w.id}>
                              {w.name || `Workout ${idx + 1}`}
                            </MenuItem>
                          ))}
                          <MenuItem value={CUSTOM_WORKOUT_ID}>Custom workout</MenuItem>
                        </Select>
                      </FormControl>
                    )}

                    {/* Workout Type – only for custom strength sessions */}
                    {values.sessionType === SESSION_TYPES.STRENGTH &&
                      selectedSavedWorkoutId === CUSTOM_WORKOUT_ID && (
                      <FormControl fullWidth>
                        <InputLabel>Workout Type</InputLabel>
                        <Select
                          value={values.workoutType}
                          label="Workout Type"
                          onChange={(e) => setFieldValue('workoutType', e.target.value)}
                        >
                          <MenuItem value={WORKOUT_TYPES.FULL}>Full Body</MenuItem>
                          <MenuItem value={WORKOUT_TYPES.UPPER}>Upper Body</MenuItem>
                          <MenuItem value={WORKOUT_TYPES.PUSH}>Push</MenuItem>
                          <MenuItem value={WORKOUT_TYPES.PULL}>Pull</MenuItem>
                          <MenuItem value={WORKOUT_TYPES.LEGS}>Legs</MenuItem>
                          <MenuItem value={WORKOUT_TYPES.CORE}>Core</MenuItem>
                        </Select>
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

                    {/* Duration Field - Hide for Rest Days and Sick Days */}
                    {values.sessionType !== SESSION_TYPES.REST && values.sessionType !== SESSION_TYPES.SICK_DAY && (
                      <Field name="duration">
                        {({ field }) => (
                          <TextField
                            {...field}
                            fullWidth
                            type="number"
                            label="Duration (minutes)"
                            placeholder="e.g., 45"
                            error={touched.duration && Boolean(errors.duration)}
                            helperText={touched.duration && errors.duration}
                            variant="outlined"
                            inputProps={{ min: 0, step: 1 }}
                          />
                        )}
                      </Field>
                    )}

                    {/* Custom strength fields – only visible when Custom workout is selected */}
                    {values.sessionType === SESSION_TYPES.STRENGTH &&
                      selectedSavedWorkoutId === CUSTOM_WORKOUT_ID && (
                      <>
                        <Field name="numExercises">
                          {({ field }) => (
                            <TextField
                              {...field}
                              fullWidth
                              type="number"
                              label="Number of Exercises"
                              placeholder="e.g., 6"
                              error={touched.numExercises && Boolean(errors.numExercises)}
                              helperText={touched.numExercises && errors.numExercises}
                              variant="outlined"
                              inputProps={{ min: 1, step: 1 }}
                            />
                          )}
                        </Field>

                        <Field name="setsPerExercise">
                          {({ field }) => (
                            <TextField
                              {...field}
                              fullWidth
                              type="number"
                              label="Sets per Exercise"
                              placeholder="e.g., 3"
                              error={touched.setsPerExercise && Boolean(errors.setsPerExercise)}
                              helperText={touched.setsPerExercise && errors.setsPerExercise}
                              variant="outlined"
                              inputProps={{ min: 1, step: 1 }}
                            />
                          )}
                        </Field>
                      </>
                    )}

                    {/* Session Name Field - Optional */}
                    <Field name="sessionName">
                      {({ field }) => (
                        <TextField
                          {...field}
                          fullWidth
                          label="Session Name (optional)"
                          placeholder="e.g., Morning workout, Leg day, etc."
                          variant="outlined"
                        />
                      )}
                    </Field>

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
      </Box>
    </LocalizationProvider>
  );
};

UnifiedLogActivityScreen.propTypes = {
  onNavigate: PropTypes.func,
  initialDate: PropTypes.instanceOf(Date),
};

export default UnifiedLogActivityScreen;
