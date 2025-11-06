import { useState } from 'react';
import { motion } from 'framer-motion';
import { Box, Card, CardContent, Typography, TextField, Button, Alert } from '@mui/material';
import { Formik, Form, Field } from 'formik';
import { FitnessCenter } from '@mui/icons-material';
import PropTypes from 'prop-types';
import { saveCardioSession } from '../utils/storage';

// Constants
const SECONDS_PER_MINUTE = 60;
const NAVIGATION_DELAY_MS = 1500;

const LogCardioScreen = ({ onNavigate }) => {
  const [notification, setNotification] = useState({ show: false, message: '', severity: 'success' });

  const initialValues = {
    cardioType: '',
    duration: '',
  };

  const validate = (values) => {
    const errors = {};
    
    if (!values.cardioType || values.cardioType.trim() === '') {
      errors.cardioType = 'Cardio type is required';
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
        cardioType: values.cardioType.trim(),
        duration: parseFloat(values.duration) * SECONDS_PER_MINUTE,
        date: Date.now(),
      };

      await saveCardioSession(sessionData);
      
      setNotification({
        show: true,
        message: 'Cardio session logged successfully!',
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
      console.error('Error saving cardio session:', error);
      setNotification({
        show: true,
        message: 'Failed to save cardio session. Please try again.',
        severity: 'error'
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
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
            bgcolor: 'rgba(19, 70, 134, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <FitnessCenter sx={{ fontSize: 48, color: 'primary.main' }} />
          </Box>
        </Box>
        <Typography variant="h3" sx={{ 
          fontWeight: 700, 
          color: 'primary.main',
          mb: 1
        }}>
          Log Cardio Session
        </Typography>
        <Typography variant="body1" sx={{ 
          color: 'text.secondary',
        }}>
          Track your cardio activities
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
            {({ errors, touched, isSubmitting, isValid, dirty }) => (
              <Form>
                <Box sx={{ mb: 3 }}>
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
                        sx={{ mb: 2 }}
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
                    bgcolor: 'primary.main',
                    '&:hover': { bgcolor: 'primary.dark' },
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
  );
};

LogCardioScreen.propTypes = {
  onNavigate: PropTypes.func,
};

export default LogCardioScreen;
