import { useState } from 'react';
import PropTypes from 'prop-types';
import { Formik, Form, Field } from 'formik';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  FormHelperText,
  Stack,
  Grid,
  Snackbar,
  Alert,
} from '@mui/material';
import { PlayArrow } from '@mui/icons-material';
import { useYogaConfig } from '../hooks/useYogaConfig';

/**
 * YogaConfig Component
 * Compact form for configuring yoga session parameters
 * Uses MUI Select controls with Formik for form management
 */
const YogaConfig = ({ onStartSession }) => {
  const { config, saveConfig } = useYogaConfig();
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const initialValues = {
    flowLength: config.flowLength || 15,
    coolDownLength: config.coolDownLength || 5,
    poseSuggestionFrequency: config.poseSuggestionFrequency || 1,
  };

  const handleSubmit = async (values) => {
    try {
      // Save configuration
      await saveConfig(values);
      
      // Show success message
      setSnackbar({
        open: true,
        message: 'Yoga settings saved',
        severity: 'success',
      });

      // Start session if onStartSession callback provided
      if (onStartSession) {
        onStartSession(values);
      }
    } catch (error) {
      console.error('Error saving yoga config:', error);
      setSnackbar({
        open: true,
        message: 'Failed to save settings. Please try again.',
        severity: 'error',
      });
    }
  };

  const handleSnackbarClose = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const validate = (values) => {
    const errors = {};
    
    if (values.poseSuggestionFrequency > values.flowLength) {
      errors.poseSuggestionFrequency = 'Pose suggestion interval cannot be greater than flow duration';
    }
    
    return errors;
  };

  return (
    <>
      <Formik
        initialValues={initialValues}
        onSubmit={handleSubmit}
        validate={validate}
        enableReinitialize
      >
        {({ values, errors, touched, isSubmitting, setFieldValue }) => {
          const isValid = !errors.poseSuggestionFrequency;
          
          return (
            <Form>
              <Card
                sx={{
                  background: (theme) => 
                    `linear-gradient(135deg, ${theme.palette.primary.main}0D 0%, rgba(19, 70, 134, 0.05) 100%)`,
                  boxShadow: 4,
                }}
              >
                <CardContent sx={{ padding: { xs: 3, sm: 4 } }}>
                  {/* Configuration Controls */}
                  <Grid
                    container
                    spacing={{ xs: 2, sm: 3 }}
                    sx={{ mb: 3 }}
                  >
                    {/* Flow Duration */}
                    <Grid item xs={12} sm={4}>
                      <FormControl 
                        fullWidth 
                        variant="outlined"
                        sx={{
                          '& .MuiInputBase-root': {
                            minHeight: '48px',
                          },
                        }}
                      >
                        <InputLabel 
                          id="flow-duration-label"
                          sx={{ 
                            fontWeight: 600,
                            color: 'primary.main',
                          }}
                        >
                          Flow Duration
                        </InputLabel>
                        <Field
                          as={Select}
                          labelId="flow-duration-label"
                          id="flow-duration"
                          name="flowLength"
                          label="Flow Duration"
                          value={values.flowLength}
                          onChange={(e) => setFieldValue('flowLength', e.target.value)}
                          aria-label="Select flow duration in minutes"
                          sx={{
                            '& .MuiOutlinedInput-notchedOutline': {
                              borderColor: 'primary.light',
                            },
                          }}
                        >
                          <MenuItem value={10}>10 minutes</MenuItem>
                          <MenuItem value={15}>15 minutes</MenuItem>
                          <MenuItem value={20}>20 minutes</MenuItem>
                        </Field>
                        <FormHelperText>Length of active flow</FormHelperText>
                      </FormControl>
                    </Grid>

                    {/* Cool Down Duration */}
                    <Grid item xs={12} sm={4}>
                      <FormControl 
                        fullWidth 
                        variant="outlined"
                        sx={{
                          '& .MuiInputBase-root': {
                            minHeight: '48px',
                          },
                        }}
                      >
                        <InputLabel 
                          id="cooldown-duration-label"
                          sx={{ 
                            fontWeight: 600,
                            color: 'primary.main',
                          }}
                        >
                          Cool Down
                        </InputLabel>
                        <Field
                          as={Select}
                          labelId="cooldown-duration-label"
                          id="cooldown-duration"
                          name="coolDownLength"
                          label="Cool Down"
                          value={values.coolDownLength}
                          onChange={(e) => setFieldValue('coolDownLength', e.target.value)}
                          aria-label="Select cool down duration in minutes or no cool down"
                          sx={{
                            '& .MuiOutlinedInput-notchedOutline': {
                              borderColor: 'primary.light',
                            },
                          }}
                        >
                          <MenuItem value={0}>No cool down</MenuItem>
                          <MenuItem value={5}>5 minutes</MenuItem>
                          <MenuItem value={10}>10 minutes</MenuItem>
                        </Field>
                        <FormHelperText>Post-flow relaxation</FormHelperText>
                      </FormControl>
                    </Grid>

                    {/* Pose Suggestion Interval */}
                    <Grid item xs={12} sm={4}>
                      <FormControl 
                        fullWidth 
                        variant="outlined"
                        error={touched.poseSuggestionFrequency && !!errors.poseSuggestionFrequency}
                        sx={{
                          '& .MuiInputBase-root': {
                            minHeight: '48px',
                          },
                        }}
                      >
                        <InputLabel 
                          id="pose-interval-label"
                          sx={{ 
                            fontWeight: 600,
                            color: touched.poseSuggestionFrequency && errors.poseSuggestionFrequency 
                              ? 'error.main' 
                              : 'primary.main',
                          }}
                        >
                          Pose Interval
                        </InputLabel>
                        <Field
                          as={Select}
                          labelId="pose-interval-label"
                          id="pose-interval"
                          name="poseSuggestionFrequency"
                          label="Pose Interval"
                          value={values.poseSuggestionFrequency}
                          onChange={(e) => setFieldValue('poseSuggestionFrequency', e.target.value)}
                          aria-label="Select pose suggestion interval in minutes"
                          aria-describedby={
                            errors.poseSuggestionFrequency ? "pose-interval-error" : "pose-interval-helper"
                          }
                          sx={{
                            '& .MuiOutlinedInput-notchedOutline': {
                              borderColor: touched.poseSuggestionFrequency && errors.poseSuggestionFrequency
                                ? 'error.main'
                                : 'primary.light',
                            },
                          }}
                        >
                          <MenuItem value={1}>Every 1 min</MenuItem>
                          <MenuItem value={2}>Every 2 min</MenuItem>
                          <MenuItem value={3}>Every 3 min</MenuItem>
                          <MenuItem value={4}>Every 4 min</MenuItem>
                          <MenuItem value={5}>Every 5 min</MenuItem>
                        </Field>
                        <FormHelperText id={errors.poseSuggestionFrequency ? "pose-interval-error" : "pose-interval-helper"}>
                          {touched.poseSuggestionFrequency && errors.poseSuggestionFrequency
                            ? errors.poseSuggestionFrequency
                            : 'Suggestion frequency'}
                        </FormHelperText>
                      </FormControl>
                    </Grid>
                  </Grid>

                  {/* Preview Summary Card */}
                  <Box
                    sx={{
                      p: 2,
                      bgcolor: (theme) => `${theme.palette.primary.main}1A`,
                      borderRadius: 2,
                      border: (theme) => `1px solid ${theme.palette.primary.main}33`,
                      mb: 3,
                    }}
                  >
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        fontWeight: 600, 
                        mb: 1,
                        color: 'primary.main',
                      }}
                    >
                      Session Preview
                    </Typography>
                    <Stack spacing={0.5}>
                      <Typography variant="body2" color="text.secondary">
                        <strong>Flow:</strong> {values.flowLength} min
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        <strong>Cool Down:</strong> {values.coolDownLength === 0 ? 'None' : `${values.coolDownLength} min`}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        <strong>Total Duration:</strong> {values.flowLength + values.coolDownLength} min
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        <strong>Pose Suggestions:</strong> Every {values.poseSuggestionFrequency} min during flow
                      </Typography>
                    </Stack>
                  </Box>

                  {/* Start Button */}
                  <Button
                    type="submit"
                    variant="contained"
                    size="large"
                    fullWidth
                    disabled={!isValid || isSubmitting}
                    startIcon={<PlayArrow />}
                    sx={{
                      py: 1.5,
                      fontSize: '1.1rem',
                      fontWeight: 700,
                      minHeight: '48px',
                      bgcolor: 'primary.main',
                      '&:hover': {
                        bgcolor: 'primary.dark',
                      },
                      '&:disabled': {
                        bgcolor: 'action.disabledBackground',
                        color: 'action.disabled',
                      },
                    }}
                  >
                    Start Yoga Session
                  </Button>
                </CardContent>
              </Card>
            </Form>
          );
        }}
      </Formik>

      {/* Success/Error Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleSnackbarClose} 
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
};

YogaConfig.propTypes = {
  onStartSession: PropTypes.func,
};

export default YogaConfig;
