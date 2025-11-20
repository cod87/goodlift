import { useState } from 'react';
import { motion } from 'framer-motion';
import PropTypes from 'prop-types';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Stack,
} from '@mui/material';
import { FitnessCenter, Schedule, PlayArrow } from '@mui/icons-material';
import { getAvailableMuscleGroups } from '../../utils/stretchSelector';

/**
 * MobilitySelection Component
 * Selection screen for stretch sessions
 */
const MobilitySelection = ({ onStartStretchSession }) => {
  const [stretchType, setStretchType] = useState(null); // 'full' or 'custom'
  const [selectedMuscles, setSelectedMuscles] = useState([]);
  
  const availableMuscles = getAvailableMuscleGroups();

  const handleSelectFullBodyStretch = () => {
    setStretchType('full');
  };

  const handleSelectCustomStretch = () => {
    setStretchType('custom');
  };

  const handleMuscleToggle = (muscle) => {
    setSelectedMuscles((prev) => {
      if (prev.includes(muscle)) {
        return prev.filter((m) => m !== muscle);
      } else {
        return [...prev, muscle];
      }
    });
  };

  const handleStartStretch = () => {
    if (stretchType === 'full') {
      onStartStretchSession('full', []);
    } else if (stretchType === 'custom') {
      onStartStretchSession('custom', selectedMuscles);
    }
  };

  const handleBack = () => {
    setStretchType(null);
    setSelectedMuscles([]);
  };

  const isStretchStartDisabled = stretchType === 'custom' && selectedMuscles.length === 0;

  return (
    <Box
      sx={{
        maxWidth: '1200px',
        margin: '0 auto',
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Typography
          variant="h3"
          sx={{
            fontFamily: "'Montserrat', sans-serif",
            fontWeight: 800,
            color: 'primary.main',
            marginBottom: '0.5rem',
            textAlign: 'center',
          }}
        >
          Stretching
        </Typography>

        <Typography
          variant="body1"
          sx={{
            color: 'text.secondary',
            marginBottom: '2rem',
            textAlign: 'center',
          }}
        >
          Improve flexibility and recovery with guided stretches
        </Typography>

        {/* Stretch Type Selection - Full Body or Custom */}
        {!stretchType && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <Grid container spacing={3} sx={{ marginTop: 2 }}>
              <Grid item xs={12} md={6}>
                <Card
                  onClick={handleSelectFullBodyStretch}
                  sx={{
                    cursor: 'pointer',
                    height: '100%',
                    transition: 'border-color 0.2s ease, opacity 0.15s ease',
                    '&:hover': {
                      borderColor: 'primary.main',
                    },
                    '&:active': {
                      opacity: 0.8,
                    },
                    border: '2px solid',
                    borderColor: 'divider',
                  }}
                >
                    <CardContent sx={{ padding: 4 }}>
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          marginBottom: 2,
                        }}
                      >
                        <FitnessCenter sx={{ fontSize: 60, color: 'primary.main' }} />
                      </Box>
                      <Typography
                        variant="h5"
                        sx={{
                          fontWeight: 700,
                          textAlign: 'center',
                          marginBottom: 2,
                          color: 'primary.main',
                        }}
                      >
                        Full Body Stretch
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{
                          textAlign: 'center',
                          marginBottom: 2,
                          color: 'text.secondary',
                        }}
                      >
                        A balanced routine covering all major muscle groups for complete flexibility and recovery.
                      </Typography>
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 1,
                          marginTop: 2,
                        }}
                      >
                        <Schedule sx={{ color: 'secondary.main' }} />
                        <Typography
                          variant="h6"
                          sx={{ fontWeight: 600, color: 'secondary.main' }}
                        >
                          ~10 minutes
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>
              </Grid>

              <Grid item xs={12} md={6}>
                <Card
                  onClick={handleSelectCustomStretch}
                  sx={{
                    cursor: 'pointer',
                    height: '100%',
                    transition: 'border-color 0.2s ease, opacity 0.15s ease',
                    '&:hover': {
                      borderColor: 'info.main',
                    },
                    '&:active': {
                      opacity: 0.8,
                    },
                      border: '2px solid',
                      borderColor: 'divider',
                    }}
                  >
                    <CardContent sx={{ padding: 4 }}>
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          marginBottom: 2,
                        }}
                      >
                        <FitnessCenter sx={{ fontSize: 60, color: 'info.main' }} />
                      </Box>
                      <Typography
                        variant="h5"
                        sx={{
                          fontWeight: 700,
                          textAlign: 'center',
                          marginBottom: 2,
                          color: 'info.main',
                        }}
                      >
                        Custom Stretch
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{
                          textAlign: 'center',
                          marginBottom: 2,
                          color: 'text.secondary',
                        }}
                      >
                        Target specific muscle groups that need attention.
                      </Typography>
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 1,
                          marginTop: 2,
                        }}
                      >
                        <Schedule sx={{ color: 'secondary.main' }} />
                        <Typography
                          variant="h6"
                          sx={{ fontWeight: 600, color: 'secondary.main' }}
                        >
                          ~10 minutes
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>
              </Grid>
            </Grid>
          </motion.div>
        )}

        {/* Custom Stretch - Muscle Group Selection */}
        {stretchType === 'custom' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <Card sx={{ marginTop: 3, padding: 3 }}>
              <Typography
                variant="h5"
                sx={{
                  fontWeight: 700,
                  marginBottom: 2,
                  textAlign: 'center',
                  color: 'primary.main',
                }}
              >
                Select Muscle Groups
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  marginBottom: 3,
                  textAlign: 'center',
                  color: 'text.secondary',
                }}
              >
                Choose one or more muscle groups to focus on
              </Typography>
              <FormGroup>
                <Grid container spacing={2}>
                  {availableMuscles.map((muscle) => (
                    <Grid item xs={6} sm={4} md={3} key={muscle}>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={selectedMuscles.includes(muscle)}
                            onChange={() => handleMuscleToggle(muscle)}
                            color="primary"
                          />
                        }
                        label={muscle}
                      />
                    </Grid>
                  ))}
                </Grid>
              </FormGroup>
            </Card>
          </motion.div>
        )}

        {/* Full Body Stretch - Session Summary */}
        {stretchType === 'full' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <Card sx={{ marginTop: 3, padding: 3 }}>
              <Typography
                variant="h5"
                sx={{
                  fontWeight: 700,
                  marginBottom: 2,
                  textAlign: 'center',
                  color: 'primary.main',
                }}
              >
                Full Body Stretch Session
              </Typography>
              <Stack spacing={1} sx={{ marginTop: 2 }}>
                <Typography variant="body1">
                  <strong>Duration:</strong> ~10 minutes
                </Typography>
                <Typography variant="body1">
                  <strong>Focus:</strong> All major muscle groups
                </Typography>
                <Typography variant="body1">
                  <strong>Stretches:</strong> 10 carefully selected stretches
                </Typography>
              </Stack>
            </Card>
          </motion.div>
        )}

        {/* Start Button */}
        {stretchType && (
          <Box
            sx={{
              marginTop: 4,
              display: 'flex',
              justifyContent: 'center',
              gap: 2,
            }}
          >
            <Button
              variant="outlined"
              size="large"
              onClick={handleBack}
              sx={{
                minWidth: '150px',
                padding: '12px 32px',
                fontSize: '1.1rem',
              }}
            >
              Back
            </Button>
            <Button
              variant="contained"
              size="large"
              startIcon={<PlayArrow />}
              onClick={handleStartStretch}
              disabled={isStretchStartDisabled}
              sx={{
                minWidth: '200px',
                padding: '12px 32px',
                fontSize: '1.1rem',
                fontWeight: 600,
              }}
            >
              Start Session
            </Button>
          </Box>
        )}
      </motion.div>
    </Box>
  );
};

MobilitySelection.propTypes = {
  onStartStretchSession: PropTypes.func.isRequired,
};

export default MobilitySelection;
