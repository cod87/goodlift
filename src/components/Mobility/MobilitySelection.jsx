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
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  FormHelperText,
  Stack,
} from '@mui/material';
import { FitnessCenter, Schedule, SelfImprovement, PlayArrow } from '@mui/icons-material';
import { getAvailableMuscleGroups } from '../../utils/stretchSelector';
import { useYogaConfig } from '../../hooks/useYogaConfig';

/**
 * MobilitySelection Component
 * Unified selection screen for both stretch and yoga sessions
 */
const MobilitySelection = ({ onStartStretchSession, onStartYogaSession }) => {
  const [mobilityType, setMobilityType] = useState(null); // null, 'stretch', or 'yoga'
  const [stretchType, setStretchType] = useState(null); // 'full' or 'custom'
  const [selectedMuscles, setSelectedMuscles] = useState([]);
  const { config: savedConfig, saveConfig } = useYogaConfig();
  
  const [yogaConfig, setYogaConfig] = useState({
    flowLength: savedConfig?.flowLength || 15,
    coolDownLength: savedConfig?.coolDownLength || 5,
    poseSuggestionFrequency: savedConfig?.poseSuggestionFrequency || 1,
  });
  
  const availableMuscles = getAvailableMuscleGroups();

  const handleSelectStretch = () => {
    setMobilityType('stretch');
  };

  const handleSelectYoga = () => {
    setMobilityType('yoga');
  };

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

  const handleStartYoga = async () => {
    // Save the yoga configuration
    await saveConfig(yogaConfig);
    // Start the yoga session
    onStartYogaSession(yogaConfig);
  };

  const handleBack = () => {
    if (stretchType) {
      setStretchType(null);
      setSelectedMuscles([]);
    } else {
      setMobilityType(null);
    }
  };

  const isStretchStartDisabled = stretchType === 'custom' && selectedMuscles.length === 0;
  const isYogaStartDisabled = yogaConfig.poseSuggestionFrequency > yogaConfig.flowLength;

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
          Mobility
        </Typography>

        <Typography
          variant="body1"
          sx={{
            color: 'text.secondary',
            marginBottom: '2rem',
            textAlign: 'center',
          }}
        >
          Choose your mobility session to improve flexibility, recovery, and mindfulness
        </Typography>

        {/* Initial Selection - Stretch or Yoga */}
        {!mobilityType && (
          <Grid container spacing={3} sx={{ marginTop: 2 }}>
            <Grid item xs={12} md={6}>
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Card
                  onClick={handleSelectStretch}
                  sx={{
                    cursor: 'pointer',
                    height: '100%',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      boxShadow: 6,
                      borderColor: 'success.main',
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
                      <FitnessCenter sx={{ fontSize: 60, color: 'success.main' }} />
                    </Box>
                    <Typography
                      variant="h5"
                      sx={{
                        fontWeight: 700,
                        textAlign: 'center',
                        marginBottom: 2,
                        color: 'success.main',
                      }}
                    >
                      Stretching
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        textAlign: 'center',
                        marginBottom: 2,
                        color: 'text.secondary',
                      }}
                    >
                      Improve flexibility and recovery with guided stretches for all major muscle groups
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
                      <Schedule sx={{ color: 'success.main' }} />
                      <Typography
                        variant="h6"
                        sx={{ fontWeight: 600, color: 'success.main' }}
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
                  onClick={handleSelectYoga}
                  sx={{
                    cursor: 'pointer',
                    height: '100%',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      boxShadow: 6,
                      borderColor: '#9c27b0',
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
                      <SelfImprovement sx={{ fontSize: 60, color: '#9c27b0' }} />
                    </Box>
                    <Typography
                      variant="h5"
                      sx={{
                        fontWeight: 700,
                        textAlign: 'center',
                        marginBottom: 2,
                        color: '#9c27b0',
                      }}
                    >
                      Yoga
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        textAlign: 'center',
                        marginBottom: 2,
                        color: 'text.secondary',
                      }}
                    >
                      Flow through guided yoga poses with optional cool-down for mindfulness and flexibility
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
                      <Schedule sx={{ color: '#9c27b0' }} />
                      <Typography
                        variant="h6"
                        sx={{ fontWeight: 600, color: '#9c27b0' }}
                      >
                        15-30 minutes
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </motion.div>
            </Grid>
          </Grid>
        )}

        {/* Stretch Type Selection - Full Body or Custom */}
        {mobilityType === 'stretch' && !stretchType && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <Grid container spacing={3} sx={{ marginTop: 2 }}>
              <Grid item xs={12} md={6}>
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Card
                    onClick={handleSelectFullBodyStretch}
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
                </motion.div>
              </Grid>

              <Grid item xs={12} md={6}>
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Card
                    onClick={handleSelectCustomStretch}
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
                        Choose specific muscle groups to focus on areas that need attention or recovery.
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
          </motion.div>
        )}

        {/* Custom Muscle Selection for Stretch */}
        {mobilityType === 'stretch' && stretchType === 'custom' && (
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

        {/* Full Body Stretch Confirmation */}
        {mobilityType === 'stretch' && stretchType === 'full' && (
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

        {/* Yoga Configuration */}
        {mobilityType === 'yoga' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <Card sx={{ marginTop: 3, maxWidth: '800px', margin: '1.5rem auto 0' }}>
              <CardContent sx={{ padding: 3 }}>
                <Typography
                  variant="h5"
                  sx={{
                    fontWeight: 700,
                    marginBottom: 3,
                    color: 'primary.main',
                    textAlign: 'center',
                  }}
                >
                  Configure Your Yoga Session
                </Typography>

                <Grid container spacing={3} sx={{ mb: 3 }}>
                  {/* Flow Duration */}
                  <Grid item xs={12} sm={4}>
                    <FormControl fullWidth variant="outlined">
                      <InputLabel id="flow-duration-label" sx={{ fontWeight: 600, color: 'primary.main' }}>
                        Flow Duration
                      </InputLabel>
                      <Select
                        labelId="flow-duration-label"
                        id="flow-duration"
                        value={yogaConfig.flowLength}
                        onChange={(e) => setYogaConfig({ ...yogaConfig, flowLength: e.target.value })}
                        label="Flow Duration"
                      >
                        <MenuItem value={10}>10 minutes</MenuItem>
                        <MenuItem value={15}>15 minutes</MenuItem>
                        <MenuItem value={20}>20 minutes</MenuItem>
                      </Select>
                      <FormHelperText>Length of active flow</FormHelperText>
                    </FormControl>
                  </Grid>

                  {/* Cool Down Duration */}
                  <Grid item xs={12} sm={4}>
                    <FormControl fullWidth variant="outlined">
                      <InputLabel id="cooldown-duration-label" sx={{ fontWeight: 600, color: 'primary.main' }}>
                        Cool Down
                      </InputLabel>
                      <Select
                        labelId="cooldown-duration-label"
                        id="cooldown-duration"
                        value={yogaConfig.coolDownLength}
                        onChange={(e) => setYogaConfig({ ...yogaConfig, coolDownLength: e.target.value })}
                        label="Cool Down"
                      >
                        <MenuItem value={0}>No cool down</MenuItem>
                        <MenuItem value={5}>5 minutes</MenuItem>
                        <MenuItem value={10}>10 minutes</MenuItem>
                      </Select>
                      <FormHelperText>Post-flow relaxation</FormHelperText>
                    </FormControl>
                  </Grid>

                  {/* Pose Suggestion Interval */}
                  <Grid item xs={12} sm={4}>
                    <FormControl fullWidth variant="outlined" error={isYogaStartDisabled}>
                      <InputLabel 
                        id="pose-interval-label" 
                        sx={{ fontWeight: 600, color: isYogaStartDisabled ? 'error.main' : 'primary.main' }}
                      >
                        Pose Interval
                      </InputLabel>
                      <Select
                        labelId="pose-interval-label"
                        id="pose-interval"
                        value={yogaConfig.poseSuggestionFrequency}
                        onChange={(e) => setYogaConfig({ ...yogaConfig, poseSuggestionFrequency: e.target.value })}
                        label="Pose Interval"
                      >
                        <MenuItem value={1}>Every 1 min</MenuItem>
                        <MenuItem value={2}>Every 2 min</MenuItem>
                        <MenuItem value={3}>Every 3 min</MenuItem>
                        <MenuItem value={4}>Every 4 min</MenuItem>
                        <MenuItem value={5}>Every 5 min</MenuItem>
                      </Select>
                      <FormHelperText>
                        {isYogaStartDisabled
                          ? 'Pose suggestion interval cannot be greater than flow duration'
                          : 'Suggestion frequency'}
                      </FormHelperText>
                    </FormControl>
                  </Grid>
                </Grid>

                {/* Preview Summary */}
                <Box
                  sx={{
                    p: 2,
                    bgcolor: (theme) => `${theme.palette.primary.main}1A`,
                    borderRadius: 2,
                    border: (theme) => `1px solid ${theme.palette.primary.main}33`,
                    mb: 2,
                  }}
                >
                  <Typography variant="body2" sx={{ fontWeight: 600, mb: 1, color: 'primary.main' }}>
                    Session Preview
                  </Typography>
                  <Stack spacing={0.5}>
                    <Typography variant="body2" color="text.secondary">
                      <strong>Flow:</strong> {yogaConfig.flowLength} min
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      <strong>Cool Down:</strong> {yogaConfig.coolDownLength === 0 ? 'None' : `${yogaConfig.coolDownLength} min`}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      <strong>Total Duration:</strong> {yogaConfig.flowLength + yogaConfig.coolDownLength} min
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      <strong>Pose Suggestions:</strong> Every {yogaConfig.poseSuggestionFrequency} min during flow
                    </Typography>
                  </Stack>
                </Box>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Action Buttons */}
        {(stretchType || mobilityType === 'yoga') && (
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
              onClick={mobilityType === 'yoga' ? handleStartYoga : handleStartStretch}
              disabled={mobilityType === 'stretch' ? isStretchStartDisabled : isYogaStartDisabled}
              startIcon={<PlayArrow />}
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

        {/* Back button for stretch type selection */}
        {mobilityType && !stretchType && mobilityType !== 'yoga' && (
          <Box
            sx={{
              marginTop: 4,
              display: 'flex',
              justifyContent: 'center',
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
          </Box>
        )}
      </motion.div>
    </Box>
  );
};

MobilitySelection.propTypes = {
  onStartStretchSession: PropTypes.func.isRequired,
  onStartYogaSession: PropTypes.func.isRequired,
};

export default MobilitySelection;
