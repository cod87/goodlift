import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Switch,
  FormGroup,
  Stack,
  Divider,
} from '@mui/material';
import { SelfImprovement, PlayArrow } from '@mui/icons-material';
import { Formik, Form } from 'formik';
import YogaSession from '../components/Yoga/YogaSession';
import { useYogaConfig } from '../hooks/useYogaConfig';
import { useYogaTTS } from '../hooks/useYogaTTS';

/**
 * YogaScreen Component
 * Main screen for yoga session configuration and flow
 */
const YogaScreen = () => {
  const [sessionActive, setSessionActive] = useState(false);
  const [sessionConfig, setSessionConfig] = useState(null);
  const { config, saveConfig } = useYogaConfig();
  const { ttsEnabled, setTtsEnabled } = useYogaTTS();

  const initialValues = {
    flowLength: config.flowLength || 10,
    coolDownLength: config.coolDownLength || 5,
    poseSuggestionFrequency: config.poseSuggestionFrequency || 1,
  };

  const handleStartSession = (values) => {
    const sessionData = {
      ...values,
      ttsEnabled,
    };
    
    // Save configuration
    saveConfig(values);
    
    // Start session
    setSessionConfig(sessionData);
    setSessionActive(true);
  };

  const handleSessionComplete = () => {
    setSessionActive(false);
    setSessionConfig(null);
  };

  const handleSessionExit = () => {
    setSessionActive(false);
    setSessionConfig(null);
  };

  if (sessionActive && sessionConfig) {
    return (
      <YogaSession
        config={sessionConfig}
        onComplete={handleSessionComplete}
        onExit={handleSessionExit}
      />
    );
  }

  return (
    <Box
      sx={{
        padding: { xs: '2rem 1rem', sm: '2rem', md: '3rem' },
        maxWidth: '800px',
        margin: '0 auto',
        minHeight: 'calc(100vh - 60px)',
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Header */}
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Stack direction="row" alignItems="center" justifyContent="center" spacing={2} sx={{ mb: 2 }}>
            <SelfImprovement sx={{ fontSize: 48, color: '#9c27b0' }} />
            <Typography
              variant="h3"
              sx={{
                fontFamily: "'Montserrat', sans-serif",
                fontWeight: 800,
                color: '#9c27b0',
              }}
            >
              Yoga
            </Typography>
          </Stack>
          <Typography
            variant="body1"
            sx={{
              color: 'text.secondary',
              maxWidth: '600px',
              margin: '0 auto',
            }}
          >
            Configure your yoga session with flow and cool down options. Receive guided pose suggestions throughout your practice.
          </Typography>
        </Box>

        {/* Configuration Form */}
        <Formik
          initialValues={initialValues}
          onSubmit={handleStartSession}
          enableReinitialize
        >
          {({ values, setFieldValue }) => (
            <Form>
              <Card
                sx={{
                  background: 'linear-gradient(135deg, rgba(156, 39, 176, 0.05) 0%, rgba(19, 70, 134, 0.05) 100%)',
                  boxShadow: 4,
                }}
              >
                <CardContent sx={{ padding: { xs: 3, sm: 4 } }}>
                  {/* Flow Length */}
                  <FormControl component="fieldset" fullWidth sx={{ mb: 3 }}>
                    <FormLabel
                      component="legend"
                      sx={{
                        fontWeight: 700,
                        fontSize: '1.1rem',
                        color: 'primary.main',
                        mb: 2,
                      }}
                    >
                      Flow Length
                    </FormLabel>
                    <RadioGroup
                      value={values.flowLength}
                      onChange={(e) => setFieldValue('flowLength', parseInt(e.target.value))}
                    >
                      <FormControlLabel
                        value={10}
                        control={<Radio />}
                        label="10 minutes"
                        sx={{
                          '& .MuiFormControlLabel-label': {
                            fontSize: '1rem',
                            fontWeight: 500,
                          },
                        }}
                      />
                      <FormControlLabel
                        value={15}
                        control={<Radio />}
                        label="15 minutes"
                        sx={{
                          '& .MuiFormControlLabel-label': {
                            fontSize: '1rem',
                            fontWeight: 500,
                          },
                        }}
                      />
                      <FormControlLabel
                        value={20}
                        control={<Radio />}
                        label="20 minutes"
                        sx={{
                          '& .MuiFormControlLabel-label': {
                            fontSize: '1rem',
                            fontWeight: 500,
                          },
                        }}
                      />
                    </RadioGroup>
                  </FormControl>

                  <Divider sx={{ my: 3 }} />

                  {/* Cool Down Length */}
                  <FormControl component="fieldset" fullWidth sx={{ mb: 3 }}>
                    <FormLabel
                      component="legend"
                      sx={{
                        fontWeight: 700,
                        fontSize: '1.1rem',
                        color: 'primary.main',
                        mb: 2,
                      }}
                    >
                      Cool Down Length
                    </FormLabel>
                    <RadioGroup
                      value={values.coolDownLength}
                      onChange={(e) => setFieldValue('coolDownLength', parseInt(e.target.value))}
                    >
                      <FormControlLabel
                        value={5}
                        control={<Radio />}
                        label="5 minutes"
                        sx={{
                          '& .MuiFormControlLabel-label': {
                            fontSize: '1rem',
                            fontWeight: 500,
                          },
                        }}
                      />
                      <FormControlLabel
                        value={10}
                        control={<Radio />}
                        label="10 minutes"
                        sx={{
                          '& .MuiFormControlLabel-label': {
                            fontSize: '1rem',
                            fontWeight: 500,
                          },
                        }}
                      />
                    </RadioGroup>
                  </FormControl>

                  <Divider sx={{ my: 3 }} />

                  {/* Pose Suggestion Frequency */}
                  <FormControl component="fieldset" fullWidth sx={{ mb: 3 }}>
                    <FormLabel
                      component="legend"
                      sx={{
                        fontWeight: 700,
                        fontSize: '1.1rem',
                        color: 'primary.main',
                        mb: 2,
                      }}
                    >
                      Pose Suggestion Frequency (during flow)
                    </FormLabel>
                    <RadioGroup
                      value={values.poseSuggestionFrequency}
                      onChange={(e) => setFieldValue('poseSuggestionFrequency', parseInt(e.target.value))}
                    >
                      <FormControlLabel
                        value={1}
                        control={<Radio />}
                        label="Every 1 minute (default)"
                        sx={{
                          '& .MuiFormControlLabel-label': {
                            fontSize: '1rem',
                            fontWeight: 500,
                          },
                        }}
                      />
                      <FormControlLabel
                        value={2}
                        control={<Radio />}
                        label="Every 2 minutes"
                        sx={{
                          '& .MuiFormControlLabel-label': {
                            fontSize: '1rem',
                            fontWeight: 500,
                          },
                        }}
                      />
                      <FormControlLabel
                        value={3}
                        control={<Radio />}
                        label="Every 3 minutes"
                        sx={{
                          '& .MuiFormControlLabel-label': {
                            fontSize: '1rem',
                            fontWeight: 500,
                          },
                        }}
                      />
                      <FormControlLabel
                        value={4}
                        control={<Radio />}
                        label="Every 4 minutes"
                        sx={{
                          '& .MuiFormControlLabel-label': {
                            fontSize: '1rem',
                            fontWeight: 500,
                          },
                        }}
                      />
                      <FormControlLabel
                        value={5}
                        control={<Radio />}
                        label="Every 5 minutes"
                        sx={{
                          '& .MuiFormControlLabel-label': {
                            fontSize: '1rem',
                            fontWeight: 500,
                          },
                        }}
                      />
                    </RadioGroup>
                  </FormControl>

                  <Divider sx={{ my: 3 }} />

                  {/* TTS Toggle */}
                  <FormGroup>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={ttsEnabled}
                          onChange={(e) => setTtsEnabled(e.target.checked)}
                          color="secondary"
                        />
                      }
                      label={
                        <Box>
                          <Typography variant="body1" sx={{ fontWeight: 600 }}>
                            Text-to-Speech Announcements
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Hear pose names and prompts spoken aloud
                          </Typography>
                        </Box>
                      }
                    />
                  </FormGroup>

                  {/* Session Summary */}
                  <Box
                    sx={{
                      mt: 3,
                      p: 2,
                      bgcolor: 'rgba(156, 39, 176, 0.1)',
                      borderRadius: 2,
                      border: '1px solid rgba(156, 39, 176, 0.2)',
                    }}
                  >
                    <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                      Session Summary:
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total duration: {values.flowLength + values.coolDownLength} minutes
                      <br />
                      Flow: {values.flowLength} min | Cool Down: {values.coolDownLength} min
                      <br />
                      Pose suggestions every {values.poseSuggestionFrequency} minute{values.poseSuggestionFrequency > 1 ? 's' : ''} during flow
                    </Typography>
                  </Box>

                  {/* Start Button */}
                  <Button
                    type="submit"
                    variant="contained"
                    size="large"
                    fullWidth
                    startIcon={<PlayArrow />}
                    sx={{
                      mt: 3,
                      py: 1.5,
                      fontSize: '1.1rem',
                      fontWeight: 700,
                      bgcolor: '#9c27b0',
                      '&:hover': {
                        bgcolor: '#7b1fa2',
                      },
                    }}
                  >
                    Start Yoga Session
                  </Button>
                </CardContent>
              </Card>
            </Form>
          )}
        </Formik>
      </motion.div>
    </Box>
  );
};

export default YogaScreen;
