import { useState } from 'react';
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
  Stack
} from '@mui/material';
import { Formik, Form, Field } from 'formik';
import { 
  FitnessCenter
} from '@mui/icons-material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import PropTypes from 'prop-types';
import { 
  saveWorkout, 
  saveUserStats,
  getUserStats
} from '../utils/storage';

// Constants
const SECONDS_PER_MINUTE = 60;
const NAVIGATION_DELAY_MS = 1500;

const SESSION_TYPES = {
  STRENGTH: 'strength',
  CARDIO: 'cardio',
  YOGA: 'yoga',
  REST: 'rest',
};

const WORKOUT_TYPES = {
  FULL: 'full',
  UPPER: 'upper',
  PUSH: 'push',
  PULL: 'pull',
  LEGS: 'legs',
  CORE: 'core',
};

const UnifiedLogActivityScreen = ({ onNavigate }) => {
  const [notification, setNotification] = useState({ show: false, message: '', severity: 'success' });

  const initialValues = {
    date: new Date(),
    duration: '',
    notes: '',
    // Session type selection
    sessionType: SESSION_TYPES.STRENGTH,
    // Workout-specific fields (for strength sessions)
    workoutType: WORKOUT_TYPES.FULL,
    numExercises: '',
    setsPerExercise: '',
  };

  const validate = (values) => {
    const errors = {};
    
    if (!values.date) {
      errors.date = 'Date is required';
    }
    
    if (!values.duration) {
      errors.duration = 'Duration is required';
    } else if (isNaN(values.duration) || parseFloat(values.duration) <= 0) {
      errors.duration = 'Duration must be a positive number';
    }

    // Validate strength session-specific fields
    if (values.sessionType === SESSION_TYPES.STRENGTH) {
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
    try {
      const timestamp = values.date.getTime();
      const duration = parseFloat(values.duration) * SECONDS_PER_MINUTE;

      // Save workout with manual log details
      const workoutData = {
        date: timestamp,
        duration: duration,
        type: values.sessionType === SESSION_TYPES.STRENGTH ? values.workoutType : values.sessionType,
        exercises: {},
        notes: values.notes.trim(),
        isManualLog: true,
        sessionType: values.sessionType, // Store the session type
      };

      // Add strength-specific fields only for strength sessions
      if (values.sessionType === SESSION_TYPES.STRENGTH) {
        workoutData.numExercises = parseInt(values.numExercises);
        workoutData.setsPerExercise = parseInt(values.setsPerExercise);
      }

      await saveWorkout(workoutData);
      
      // Update stats only for non-rest sessions
      if (values.sessionType !== SESSION_TYPES.REST) {
        const stats = await getUserStats();
        stats.totalWorkouts += 1;
        stats.totalTime += workoutData.duration;
        await saveUserStats(stats);
      }

      setNotification({
        show: true,
        message: 'Activity logged successfully!',
        severity: 'success'
      });
      
      resetForm();
      
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
      setSubmitting(false);
    }
  };

  const getActivityIcon = () => {
    return <FitnessCenter sx={{ fontSize: 48, color: 'primary.main' }} />;
  };

  const getActivityColor = () => {
    return 'primary.main';
  };

  const getActivityBgColor = () => {
    return 'rgba(19, 70, 134, 0.1)';
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
        <Box sx={{ mb: 3, textAlign: 'center' }}>
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'center', 
            mb: 2 
          }}>
            <Box sx={{ 
              p: { xs: 1.5, sm: 2 }, 
              borderRadius: '50%', 
              bgcolor: getActivityBgColor(),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {getActivityIcon()}
            </Box>
          </Box>
          <Typography variant="h3" sx={{ 
            fontWeight: 700, 
            color: getActivityColor(),
            mb: 1,
            fontSize: { xs: '1.5rem', sm: '2rem', md: '2.5rem' }
          }}>
            {getActivityTitle()}
          </Typography>
          <Typography variant="body1" sx={{ 
            color: 'text.secondary',
            mb: 2,
            fontSize: { xs: '0.875rem', sm: '1rem' },
            px: { xs: 1, sm: 0 }
          }}>
            Manually log your completed activities
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
            <Formik
              initialValues={initialValues}
              validate={validate}
              onSubmit={handleSubmit}
              enableReinitialize
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
                        <MenuItem value={SESSION_TYPES.REST}>Rest Day</MenuItem>
                      </Select>
                    </FormControl>

                    {/* Workout Type for Strength Sessions */}
                    {values.sessionType === SESSION_TYPES.STRENGTH && (
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

                    {/* Duration Field */}
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

                    {/* Strength-specific fields */}
                    {values.sessionType === SESSION_TYPES.STRENGTH && (
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
                        bgcolor: getActivityColor(),
                        '&:hover': { 
                          bgcolor: getActivityColor(),
                          filter: 'brightness(0.9)'
                        },
                        py: 1.5,
                        fontWeight: 600,
                        mt: 2
                      }}
                    >
                      {isSubmitting ? 'Logging...' : `Log ${getActivityTitle().replace('Log ', '')}`}
                    </Button>
                  </Stack>
                </Form>
              )}
            </Formik>
          </CardContent>
        </Card>
        </motion.div>
      </Box>
    </LocalizationProvider>
  );
};

UnifiedLogActivityScreen.propTypes = {
  onNavigate: PropTypes.func,
};

export default UnifiedLogActivityScreen;
