import { useState } from 'react';
import { motion } from 'framer-motion';
import { Box, Card, CardContent, Typography, TextField, Button, Alert } from '@mui/material';
import { Formik, Form, Field } from 'formik';
import { SelfImprovement } from '@mui/icons-material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import PropTypes from 'prop-types';
import { saveYogaSession } from '../utils/storage';

// Constants
const SECONDS_PER_MINUTE = 60;
const NAVIGATION_DELAY_MS = 1500;

const LogYogaScreen = ({ onNavigate }) => {
  const [notification, setNotification] = useState({ show: false, message: '', severity: 'success' });

  const initialValues = {
    date: new Date(),
    duration: '',
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
    
    return errors;
  };

  const handleSubmit = async (values, { setSubmitting, resetForm }) => {
    try {
      const sessionData = {
        id: `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
        date: values.date.getTime(),
        duration: parseFloat(values.duration) * SECONDS_PER_MINUTE,
        flowLength: 0,
        coolDownLength: 0,
        poseCount: 0,
        type: 'Manual Log',
      };

      await saveYogaSession(sessionData);
      
      setNotification({
        show: true,
        message: 'Yoga session logged successfully!',
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
      console.error('Error saving yoga session:', error);
      setNotification({
        show: true,
        message: 'Failed to save yoga session. Please try again.',
        severity: 'error'
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        style={{ 
          maxWidth: '600px', 
          margin: '0 auto', 
          padding: '2rem 1rem' 
        }}
      >
        <Box sx={{ mb: 4, textAlign: 'center' }}>
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'center', 
            mb: 2 
          }}>
            <Box sx={{ 
              p: 2, 
              borderRadius: '50%', 
              bgcolor: 'rgba(156, 39, 176, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <SelfImprovement sx={{ fontSize: 48, color: '#9c27b0' }} />
            </Box>
          </Box>
          <Typography variant="h3" sx={{ 
            fontWeight: 700, 
            color: '#9c27b0',
            mb: 1
          }}>
            Log Yoga Session
          </Typography>
          <Typography variant="body1" sx={{ 
            color: 'text.secondary',
          }}>
            Manually log a completed yoga practice
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

        <Card sx={{ borderRadius: 3 }}>
          <CardContent sx={{ p: 3 }}>
            <Formik
              initialValues={initialValues}
              validate={validate}
              onSubmit={handleSubmit}
            >
              {({ errors, touched, isSubmitting, isValid, dirty, values, setFieldValue }) => (
                <Form>
                  <Box sx={{ mb: 3 }}>
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
                              sx: { mb: 2 }
                            }
                          }}
                        />
                      )}
                    </Field>

                    <Field name="duration">
                      {({ field }) => (
                        <TextField
                          {...field}
                          fullWidth
                          type="number"
                          label="Duration (minutes)"
                          placeholder="e.g., 30"
                          error={touched.duration && Boolean(errors.duration)}
                          helperText={touched.duration && errors.duration}
                          variant="outlined"
                          inputProps={{ min: 0, step: 1 }}
                        />
                      )}
                    </Field>
                  </Box>

                  <Button
                    type="submit"
                    variant="contained"
                    fullWidth
                    disabled={isSubmitting || !isValid || !dirty}
                    sx={{ 
                      bgcolor: '#9c27b0',
                      '&:hover': { bgcolor: '#7b1fa2' },
                      py: 1.5,
                      fontWeight: 600
                    }}
                  >
                    {isSubmitting ? 'Logging...' : 'Log Session'}
                  </Button>
                </Form>
              )}
            </Formik>
          </CardContent>
        </Card>
      </motion.div>
    </LocalizationProvider>
  );
};

LogYogaScreen.propTypes = {
  onNavigate: PropTypes.func,
};

export default LogYogaScreen;
