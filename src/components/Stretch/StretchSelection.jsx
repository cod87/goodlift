import { useState } from 'react';
import { motion } from 'framer-motion';
import PropTypes from 'prop-types';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  Grid,
  FormGroup,
  FormControlLabel,
  Checkbox,
} from '@mui/material';
import { FitnessCenter, Schedule } from '@mui/icons-material';
import { getAvailableMuscleGroups } from '../../utils/stretchSelector';

/**
 * StretchSelection Component
 * Allows user to choose between Full Body or Custom stretch session
 */
const StretchSelection = ({ onStartSession }) => {
  const [selectionMode, setSelectionMode] = useState(null); // null, 'full', or 'custom'
  const [selectedMuscles, setSelectedMuscles] = useState([]);
  const availableMuscles = getAvailableMuscleGroups();

  const handleSelectFullBody = () => {
    setSelectionMode('full');
  };

  const handleSelectCustom = () => {
    setSelectionMode('custom');
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

  const handleStart = () => {
    if (selectionMode === 'full') {
      onStartSession('full', []);
    } else if (selectionMode === 'custom') {
      onStartSession('custom', selectedMuscles);
    }
  };

  const handleBack = () => {
    setSelectionMode(null);
    setSelectedMuscles([]);
  };

  const isStartDisabled =
    selectionMode === 'custom' && selectedMuscles.length === 0;

  return (
    <Box
      sx={{
        padding: { xs: '2rem 1rem', sm: '2rem', md: '3rem' },
        maxWidth: '1200px',
        margin: '0 auto',
        minHeight: 'calc(100vh - 60px)',
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
          Stretch Session
        </Typography>

        <Typography
          variant="body1"
          sx={{
            color: 'text.secondary',
            marginBottom: '2rem',
            textAlign: 'center',
          }}
        >
          Choose your stretching routine to improve flexibility and recovery
        </Typography>

        {/* Initial Selection - Full Body or Custom */}
        {!selectionMode && (
          <Grid container spacing={3} sx={{ marginTop: 2 }}>
            <Grid item xs={12} md={6}>
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Card
                  onClick={handleSelectFullBody}
                  sx={{
                    cursor: 'pointer',
                    height: '100%',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      boxShadow: 6,
                      borderColor: 'primary.main',
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
                      A balanced routine covering all major muscle groups for complete
                      flexibility and recovery.
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
              </motion.div>
            </Grid>

            <Grid item xs={12} md={6}>
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Card
                  onClick={handleSelectCustom}
                  sx={{
                    cursor: 'pointer',
                    height: '100%',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      boxShadow: 6,
                      borderColor: 'secondary.main',
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
                      <FitnessCenter sx={{ fontSize: 60, color: 'secondary.main' }} />
                    </Box>
                    <Typography
                      variant="h5"
                      sx={{
                        fontWeight: 700,
                        textAlign: 'center',
                        marginBottom: 2,
                        color: 'secondary.main',
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
                      Choose specific muscle groups to focus on areas that need
                      attention or recovery.
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
              </motion.div>
            </Grid>
          </Grid>
        )}

        {/* Custom Muscle Selection */}
        {selectionMode === 'custom' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <Card sx={{ marginTop: 3 }}>
              <CardContent sx={{ padding: 3 }}>
                <Typography
                  variant="h5"
                  sx={{
                    fontWeight: 700,
                    marginBottom: 2,
                    color: 'primary.main',
                  }}
                >
                  Select Muscle Groups
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ marginBottom: 3, color: 'text.secondary' }}
                >
                  Choose the areas you want to focus on during your stretch session.
                </Typography>

                <FormGroup>
                  <Grid container spacing={1}>
                    {availableMuscles.map((muscle) => (
                      <Grid item xs={6} sm={4} md={3} key={muscle}>
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={selectedMuscles.includes(muscle)}
                              onChange={() => handleMuscleToggle(muscle)}
                              sx={{
                                color: 'primary.main',
                                '&.Mui-checked': {
                                  color: 'primary.main',
                                },
                              }}
                            />
                          }
                          label={muscle}
                          sx={{ marginBottom: 0.5 }}
                        />
                      </Grid>
                    ))}
                  </Grid>
                </FormGroup>

                {selectedMuscles.length > 0 && (
                  <Box sx={{ marginTop: 3 }}>
                    <Typography
                      variant="subtitle2"
                      sx={{ marginBottom: 1, fontWeight: 600 }}
                    >
                      Selected ({selectedMuscles.length}):
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {selectedMuscles.map((muscle) => (
                        <Chip
                          key={muscle}
                          label={muscle}
                          onDelete={() => handleMuscleToggle(muscle)}
                          color="primary"
                        />
                      ))}
                    </Box>
                  </Box>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Full Body Confirmation */}
        {selectionMode === 'full' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <Card sx={{ marginTop: 3 }}>
              <CardContent sx={{ padding: 4, textAlign: 'center' }}>
                <FitnessCenter sx={{ fontSize: 80, color: 'primary.main', marginBottom: 2 }} />
                <Typography
                  variant="h5"
                  sx={{
                    fontWeight: 700,
                    marginBottom: 2,
                    color: 'primary.main',
                  }}
                >
                  Full Body Stretch Session
                </Typography>
                <Typography variant="body1" sx={{ marginBottom: 1 }}>
                  10 carefully selected stretches
                </Typography>
                <Typography variant="body1" sx={{ marginBottom: 1 }}>
                  All major muscle groups covered
                </Typography>
                <Typography variant="body1" sx={{ marginBottom: 2 }}>
                  1 minute per stretch
                </Typography>
                <Typography
                  variant="h6"
                  sx={{
                    marginTop: 2,
                    fontWeight: 600,
                    color: 'secondary.main',
                  }}
                >
                  Total Duration: ~10 minutes
                </Typography>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Action Buttons */}
        {selectionMode && (
          <Box
            sx={{
              marginTop: 4,
              display: 'flex',
              gap: 2,
              justifyContent: 'center',
              flexWrap: 'wrap',
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
              onClick={handleStart}
              disabled={isStartDisabled}
              sx={{
                minWidth: '150px',
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

StretchSelection.propTypes = {
  onStartSession: PropTypes.func.isRequired,
};

export default StretchSelection;
