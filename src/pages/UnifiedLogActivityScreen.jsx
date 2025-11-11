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
  ToggleButtonGroup,
  ToggleButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack
} from '@mui/material';
import { Formik, Form, Field } from 'formik';
import { 
  FitnessCenter, 
  SelfImprovement, 
  Timer, 
  DirectionsRun 
} from '@mui/icons-material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import PropTypes from 'prop-types';
import { 
  saveWorkout, 
  saveCardioSession, 
  saveYogaSession, 
  saveHiitSession,
  saveUserStats,
  getUserStats
} from '../utils/storage';
import { generateSessionId } from '../utils/helpers';

// Constants
const SECONDS_PER_MINUTE = 60;
const NAVIGATION_DELAY_MS = 1500;

const ACTIVITY_TYPES = {
  WORKOUT: 'workout',
  CARDIO: 'cardio',
  HIIT: 'hiit',
  YOGA: 'yoga',
};

const WORKOUT_TYPES = {
  UPPER: 'upper',
  LOWER: 'lower',
  FULL: 'full',
};

const UnifiedLogActivityScreen = ({ onNavigate }) => {
  const [notification, setNotification] = useState({ show: false, message: '', severity: 'success' });
  const [activityType, setActivityType] = useState(ACTIVITY_TYPES.WORKOUT);

  const initialValues = {
    date: new Date(),
    duration: '',
    notes: '',
    // Workout-specific fields
    workoutType: WORKOUT_TYPES.FULL,
    numExercises: '',
    setsPerExercise: '',
    // Cardio-specific fields
    cardioType: '',
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

    // Validate activity-specific fields
    if (activityType === ACTIVITY_TYPES.WORKOUT) {
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

    if (activityType === ACTIVITY_TYPES.CARDIO) {
      if (!values.cardioType || values.cardioType.trim() === '') {
        errors.cardioType = 'Cardio type is required';
      }
    }
    
    return errors;
  };

  const handleSubmit = async (values, { setSubmitting, resetForm }) => {
    try {
      const timestamp = values.date.getTime();
      const duration = parseFloat(values.duration) * SECONDS_PER_MINUTE;

      if (activityType === ACTIVITY_TYPES.WORKOUT) {
        // Save workout with manual log details
        const workoutData = {
          date: timestamp,
          duration: duration,
          type: values.workoutType,
          exercises: {},
          notes: values.notes.trim(),
          numExercises: parseInt(values.numExercises),
          setsPerExercise: parseInt(values.setsPerExercise),
          isManualLog: true,
        };

        await saveWorkout(workoutData);
        
        // Update stats
        const stats = await getUserStats();
        stats.totalWorkouts += 1;
        stats.totalTime += workoutData.duration;
        await saveUserStats(stats);

        setNotification({
          show: true,
          message: 'Workout logged successfully!',
          severity: 'success'
        });
      } else if (activityType === ACTIVITY_TYPES.CARDIO) {
        const sessionData = {
          cardioType: values.cardioType.trim(),
          duration: duration,
          date: timestamp,
          notes: values.notes.trim(),
        };

        await saveCardioSession(sessionData);
        
        setNotification({
          show: true,
          message: 'Cardio session logged successfully!',
          severity: 'success'
        });
      } else if (activityType === ACTIVITY_TYPES.HIIT) {
        const sessionData = {
          id: generateSessionId(),
          date: timestamp,
          duration: duration,
          type: 'Manual Log',
          notes: values.notes.trim(),
        };

        await saveHiitSession(sessionData);
        
        setNotification({
          show: true,
          message: 'HIIT session logged successfully!',
          severity: 'success'
        });
      } else if (activityType === ACTIVITY_TYPES.YOGA) {
        const sessionData = {
          id: generateSessionId(),
          date: timestamp,
          duration: duration,
          flowLength: 0,
          coolDownLength: 0,
          poseCount: 0,
          type: 'Manual Log',
          notes: values.notes.trim(),
        };

        await saveYogaSession(sessionData);
        
        setNotification({
          show: true,
          message: 'Yoga session logged successfully!',
          severity: 'success'
        });
      }
      
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
    switch (activityType) {
      case ACTIVITY_TYPES.WORKOUT:
        return <FitnessCenter sx={{ fontSize: 48, color: 'primary.main' }} />;
      case ACTIVITY_TYPES.CARDIO:
        return <DirectionsRun sx={{ fontSize: 48, color: '#2196f3' }} />;
      case ACTIVITY_TYPES.HIIT:
        return <Timer sx={{ fontSize: 48, color: 'secondary.main' }} />;
      case ACTIVITY_TYPES.YOGA:
        return <SelfImprovement sx={{ fontSize: 48, color: '#9c27b0' }} />;
      default:
        return <FitnessCenter sx={{ fontSize: 48, color: 'primary.main' }} />;
    }
  };

  const getActivityColor = () => {
    switch (activityType) {
      case ACTIVITY_TYPES.WORKOUT:
        return 'primary.main';
      case ACTIVITY_TYPES.CARDIO:
        return '#2196f3';
      case ACTIVITY_TYPES.HIIT:
        return 'secondary.main';
      case ACTIVITY_TYPES.YOGA:
        return '#9c27b0';
      default:
        return 'primary.main';
    }
  };

  const getActivityBgColor = () => {
    switch (activityType) {
      case ACTIVITY_TYPES.WORKOUT:
        return 'rgba(19, 70, 134, 0.1)';
      case ACTIVITY_TYPES.CARDIO:
        return 'rgba(33, 150, 243, 0.1)';
      case ACTIVITY_TYPES.HIIT:
        return 'rgba(237, 63, 39, 0.1)';
      case ACTIVITY_TYPES.YOGA:
        return 'rgba(156, 39, 176, 0.1)';
      default:
        return 'rgba(19, 70, 134, 0.1)';
    }
  };

  const getActivityTitle = () => {
    switch (activityType) {
      case ACTIVITY_TYPES.WORKOUT:
        return 'Log Workout';
      case ACTIVITY_TYPES.CARDIO:
        return 'Log Cardio';
      case ACTIVITY_TYPES.HIIT:
        return 'Log HIIT';
      case ACTIVITY_TYPES.YOGA:
        return 'Log Yoga';
      default:
        return 'Log Activity';
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box
        sx={{
          width: '100%',
          maxWidth: '700px',
          margin: '0 auto',
          padding: { xs: '1rem 0', sm: '1.5rem 1rem', md: '2rem 1rem' },
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
            Manually log your completed fitness activities
          </Typography>

          {/* Activity Type Selector */}
          <Box sx={{ 
            display: 'flex',
            justifyContent: 'center',
            width: '100%',
            overflow: 'auto',
            mb: 2,
          }}>
            <ToggleButtonGroup
              value={activityType}
              exclusive
              onChange={(e, newValue) => {
                if (newValue !== null) {
                  setActivityType(newValue);
                }
              }}
              aria-label="activity type"
              sx={{ 
                flexWrap: { xs: 'wrap', sm: 'nowrap' },
                justifyContent: 'center',
                gap: { xs: 0.5, sm: 0 },
                '& .MuiToggleButton-root': {
                  fontSize: { xs: '0.75rem', sm: '0.875rem' },
                  padding: { xs: '6px 8px', sm: '8px 16px' },
                  minWidth: { xs: 'calc(50% - 4px)', sm: 'auto' },
                  flex: { xs: '0 0 calc(50% - 4px)', sm: '0 1 auto' },
                }
              }}
            >
              <ToggleButton value={ACTIVITY_TYPES.WORKOUT} aria-label="workout">
                <FitnessCenter sx={{ mr: { xs: 0.5, sm: 1 }, fontSize: { xs: '1rem', sm: '1.25rem' } }} />
                <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>Workout</Box>
                <Box component="span" sx={{ display: { xs: 'inline', sm: 'none' } }}>Work</Box>
              </ToggleButton>
              <ToggleButton value={ACTIVITY_TYPES.CARDIO} aria-label="cardio">
                <DirectionsRun sx={{ mr: { xs: 0.5, sm: 1 }, fontSize: { xs: '1rem', sm: '1.25rem' } }} />
                Cardio
              </ToggleButton>
              <ToggleButton value={ACTIVITY_TYPES.HIIT} aria-label="hiit">
                <Timer sx={{ mr: { xs: 0.5, sm: 1 }, fontSize: { xs: '1rem', sm: '1.25rem' } }} />
                HIIT
              </ToggleButton>
              <ToggleButton value={ACTIVITY_TYPES.YOGA} aria-label="yoga">
                <SelfImprovement sx={{ mr: { xs: 0.5, sm: 1 }, fontSize: { xs: '1rem', sm: '1.25rem' } }} />
                Yoga
              </ToggleButton>
            </ToggleButtonGroup>
          </Box>
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
          borderRadius: { xs: 0, md: 3 },
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

                    {/* Workout-specific fields */}
                    {activityType === ACTIVITY_TYPES.WORKOUT && (
                      <>
                        <FormControl fullWidth>
                          <InputLabel>Workout Type</InputLabel>
                          <Select
                            value={values.workoutType}
                            label="Workout Type"
                            onChange={(e) => setFieldValue('workoutType', e.target.value)}
                          >
                            <MenuItem value={WORKOUT_TYPES.UPPER}>Upper Body</MenuItem>
                            <MenuItem value={WORKOUT_TYPES.LOWER}>Lower Body</MenuItem>
                            <MenuItem value={WORKOUT_TYPES.FULL}>Full Body</MenuItem>
                          </Select>
                        </FormControl>

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

                    {/* Cardio-specific field */}
                    {activityType === ACTIVITY_TYPES.CARDIO && (
                      <Field name="cardioType">
                        {({ field }) => (
                          <TextField
                            {...field}
                            fullWidth
                            label="Cardio Type"
                            placeholder="e.g., Running, Cycling, Swimming"
                            error={touched.cardioType && Boolean(errors.cardioType)}
                            helperText={touched.cardioType && errors.cardioType}
                            variant="outlined"
                          />
                        )}
                      </Field>
                    )}

                    {/* Notes Field - for all activity types */}
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
