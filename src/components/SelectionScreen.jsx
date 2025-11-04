import { memo, useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { motion, AnimatePresence } from 'framer-motion';
import { Box, Card, CardContent, Typography, FormControlLabel, Radio, RadioGroup, Button, Accordion, AccordionSummary, AccordionDetails, IconButton, Stack, Chip } from '@mui/material';
import { ExpandMore, Delete, Star } from '@mui/icons-material';
import { getFavoriteWorkouts, deleteFavoriteWorkout } from '../utils/storage';

/**
 * SelectionScreen component for workout configuration
 * Allows users to select workout type and equipment filters
 * Memoized to prevent unnecessary re-renders
 */
const SelectionScreen = memo(({ 
  workoutType,
  selectedEquipment,
  equipmentOptions,
  onWorkoutTypeChange,
  onEquipmentChange,
  onStartWorkout,
  loading,
}) => {
  const [favoriteWorkouts, setFavoriteWorkouts] = useState([]);

  useEffect(() => {
    setFavoriteWorkouts(getFavoriteWorkouts());
  }, []);

  const handleStartClick = () => {
    if (workoutType) {
      const equipmentFilter = selectedEquipment.has('all') 
        ? 'all' 
        : Array.from(selectedEquipment).map(e => e.toLowerCase());
      onStartWorkout(workoutType, equipmentFilter);
    }
  };

  const handleDeleteFavorite = (workoutId) => {
    deleteFavoriteWorkout(workoutId);
    setFavoriteWorkouts(getFavoriteWorkouts());
  };

  const handleLoadFavorite = (favoriteWorkout) => {
    onWorkoutTypeChange(favoriteWorkout.type);
    onEquipmentChange(favoriteWorkout.equipment || 'all');
    // Small delay to allow state to update before starting
    setTimeout(() => {
      const equipmentFilter = favoriteWorkout.equipment === 'all' 
        ? 'all' 
        : [favoriteWorkout.equipment];
      onStartWorkout(favoriteWorkout.type, equipmentFilter, favoriteWorkout.exercises);
    }, 100);
  };

  return (
    <motion.div
      className="screen selection-screen"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 'calc(100vh - 4rem)',
        padding: '1rem',
        paddingBottom: 'max(2rem, calc(env(safe-area-inset-bottom) + 1rem))',
        overflow: 'auto',
      }}
    >
      {loading ? (
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="h5" sx={{ mb: 2 }}>
            Generating workout...
          </Typography>
        </Box>
      ) : (
        <Card sx={{ 
          maxWidth: 600,
          width: '100%',
          borderRadius: 3,
          boxShadow: '0 8px 32px rgba(19, 70, 134, 0.12)',
        }}>
          <CardContent sx={{ p: { xs: 2, sm: 4 } }}>
            <Box sx={{ textAlign: 'center', mb: 3 }}>
              <img
                src={`${import.meta.env.BASE_URL}goodlift-favicon.svg`}
                alt="GoodLift"
                style={{ height: '64px', width: 'auto', marginBottom: '1rem' }}
              />
              <Typography variant="h4" component="h2" sx={{ 
                fontWeight: 700,
                color: 'primary.main',
                mb: 1,
                fontSize: { xs: '1.5rem', sm: '2rem' },
              }}>
                Start Your Workout
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ fontSize: { xs: '0.9rem', sm: '1rem' } }}>
                Select your workout type and available equipment
              </Typography>
            </Box>

            {/* Workout Type */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" sx={{ 
                mb: 2,
                fontWeight: 600,
                color: 'text.primary',
                fontSize: { xs: '1rem', sm: '1.25rem' },
              }}>
                Workout Type
              </Typography>
              <RadioGroup
                value={workoutType}
                onChange={(e) => onWorkoutTypeChange(e.target.value)}
              >
                <FormControlLabel 
                  value="full" 
                  control={<Radio />} 
                  label="Full Body"
                  sx={{ mb: 1 }}
                />
                <FormControlLabel 
                  value="upper" 
                  control={<Radio />} 
                  label="Upper Body"
                  sx={{ mb: 1 }}
                />
                <FormControlLabel 
                  value="lower" 
                  control={<Radio />} 
                  label="Lower Body"
                />
              </RadioGroup>
            </Box>

            {/* Equipment */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" sx={{ 
                mb: 2,
                fontWeight: 600,
                color: 'text.primary',
                fontSize: { xs: '1rem', sm: '1.25rem' },
              }}>
                Equipment
              </Typography>
              <RadioGroup
                value={selectedEquipment.has('all') ? 'all' : Array.from(selectedEquipment)[0] || ''}
                onChange={(e) => onEquipmentChange(e.target.value)}
              >
                <FormControlLabel
                  value="all"
                  control={<Radio />}
                  label="All Equipment"
                  sx={{ mb: 1 }}
                />
                {equipmentOptions.map((equipment) => (
                  <FormControlLabel
                    key={equipment}
                    value={equipment.toLowerCase()}
                    control={<Radio />}
                    label={equipment}
                    sx={{ mb: 1 }}
                  />
                ))}
              </RadioGroup>
            </Box>

            {/* Favorite Workouts */}
            {favoriteWorkouts.length > 0 && (
              <Box sx={{ mb: 3 }}>
                <Accordion sx={{ boxShadow: 'none', '&:before': { display: 'none' } }}>
                  <AccordionSummary expandIcon={<ExpandMore />}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Star sx={{ color: 'warning.main' }} />
                      <Typography variant="h6" sx={{ 
                        fontWeight: 600,
                        color: 'text.primary',
                        fontSize: { xs: '1rem', sm: '1.25rem' },
                      }}>
                        Favorite Workouts ({favoriteWorkouts.length})
                      </Typography>
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Stack spacing={1.5}>
                      {favoriteWorkouts.map((favorite) => (
                        <Card 
                          key={favorite.id} 
                          sx={{ 
                            border: '1px solid',
                            borderColor: 'divider',
                            boxShadow: 'none',
                            '&:hover': {
                              boxShadow: '0 2px 8px rgba(19, 70, 134, 0.1)',
                            }
                          }}
                        >
                          <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                              <Box sx={{ flex: 1 }}>
                                <Typography variant="body1" sx={{ fontWeight: 600, mb: 0.5 }}>
                                  {favorite.name}
                                </Typography>
                                <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
                                  <Chip 
                                    label={favorite.type.charAt(0).toUpperCase() + favorite.type.slice(1)} 
                                    size="small"
                                    sx={{ fontSize: '0.7rem' }}
                                  />
                                  <Chip 
                                    label={`${favorite.exercises.length} exercises`} 
                                    size="small"
                                    variant="outlined"
                                    sx={{ fontSize: '0.7rem' }}
                                  />
                                </Stack>
                                <Button 
                                  size="small"
                                  variant="contained"
                                  onClick={() => handleLoadFavorite(favorite)}
                                  sx={{ fontSize: '0.8rem', textTransform: 'none' }}
                                >
                                  Load Workout
                                </Button>
                              </Box>
                              <IconButton 
                                size="small"
                                onClick={() => handleDeleteFavorite(favorite.id)}
                                sx={{ color: 'error.main' }}
                              >
                                <Delete fontSize="small" />
                              </IconButton>
                            </Box>
                          </CardContent>
                        </Card>
                      ))}
                    </Stack>
                  </AccordionDetails>
                </Accordion>
              </Box>
            )}

            {/* Start Button */}
            <Button
              variant="contained"
              size="large"
              fullWidth
              disabled={!workoutType}
              onClick={handleStartClick}
              sx={{
                py: 2,
                fontSize: '1.1rem',
                fontWeight: 600,
                borderRadius: 2,
                textTransform: 'none',
              }}
            >
              Start Workout
            </Button>
          </CardContent>
        </Card>
      )}
    </motion.div>
  );
});

SelectionScreen.displayName = 'SelectionScreen';

SelectionScreen.propTypes = {
  workoutType: PropTypes.string.isRequired,
  selectedEquipment: PropTypes.instanceOf(Set).isRequired,
  equipmentOptions: PropTypes.array.isRequired,
  onWorkoutTypeChange: PropTypes.func.isRequired,
  onEquipmentChange: PropTypes.func.isRequired,
  onStartWorkout: PropTypes.func.isRequired,
  loading: PropTypes.bool.isRequired,
};

export default SelectionScreen;
