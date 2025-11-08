import { useState } from 'react';
import { motion } from 'framer-motion';
import { Box, Card, CardContent, Typography, Button, Stack, Chip } from '@mui/material';
import { DirectionsRun, Whatshot, Speed } from '@mui/icons-material';
import PropTypes from 'prop-types';
import { useQuery } from '@tanstack/react-query';
import PlyoSession from '../components/Plyo/PlyoSession';

const PlyoScreen = ({ onNavigate }) => {
  const [selectedWorkout, setSelectedWorkout] = useState(null);

  // Load plyo workouts data
  const { data: plyoWorkouts = [], isLoading } = useQuery({
    queryKey: ['plyoWorkouts'],
    queryFn: async () => {
      const response = await fetch(`${import.meta.env.BASE_URL}data/plyo-workouts.json`);
      if (!response.ok) {
        throw new Error('Failed to load plyo workouts');
      }
      return response.json();
    },
    staleTime: Infinity,
  });

  const handleWorkoutSelect = (workout) => {
    setSelectedWorkout(workout);
  };

  const handleComplete = () => {
    setSelectedWorkout(null);
    if (onNavigate) {
      onNavigate('progress');
    }
  };

  const handleExit = () => {
    setSelectedWorkout(null);
    if (onNavigate) {
      onNavigate('cardio');
    }
  };

  // Show session if one is selected
  if (selectedWorkout) {
    return (
      <PlyoSession
        workoutData={selectedWorkout}
        onComplete={handleComplete}
        onExit={handleExit}
      />
    );
  }

  // Show selection screen
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      style={{ 
        maxWidth: '900px', 
        margin: '0 auto', 
        padding: '2rem 1rem' 
      }}
    >
      <Box sx={{ mb: 4, textAlign: 'center' }}>
        <Typography variant="h3" sx={{ 
          fontWeight: 700, 
          color: 'primary.main',
          mb: 1
        }}>
          Plyometric Training
        </Typography>
        <Typography variant="body1" sx={{ 
          color: 'text.secondary',
          maxWidth: '700px',
          margin: '0 auto'
        }}>
          Choose your plyometric workout version - each designed for specific training goals
        </Typography>
      </Box>

      {isLoading ? (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography>Loading workouts...</Typography>
        </Box>
      ) : (
        <Stack spacing={3}>
          {plyoWorkouts.map((workout, index) => (
            <motion.div
              key={workout.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card sx={{ 
                borderRadius: 3,
                transition: 'all 0.3s ease',
                cursor: 'pointer',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 8px 24px rgba(254, 178, 26, 0.3)',
                }
              }}
              onClick={() => handleWorkoutSelect(workout)}
              >
                <CardContent sx={{ p: 3 }}>
                  <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
                    <Box sx={{ 
                      p: 2, 
                      borderRadius: 2, 
                      bgcolor: index === 0 ? 'rgba(254, 178, 26, 0.1)' : index === 1 ? 'rgba(237, 63, 39, 0.1)' : 'rgba(19, 70, 134, 0.1)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      {index === 0 ? <DirectionsRun sx={{ fontSize: 40, color: 'warning.main' }} /> : 
                       index === 1 ? <Whatshot sx={{ fontSize: 40, color: 'secondary.main' }} /> :
                       <Speed sx={{ fontSize: 40, color: 'primary.main' }} />}
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                        <Typography variant="h5" sx={{ fontWeight: 700 }}>
                          {workout.name}
                        </Typography>
                        <Chip 
                          label={`${workout.duration} min`} 
                          size="small" 
                          sx={{ fontWeight: 600 }}
                        />
                      </Stack>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        {workout.description}
                      </Typography>
                      <Typography variant="caption" sx={{ 
                        display: 'block',
                        color: 'warning.main',
                        fontWeight: 600
                      }}>
                        Focus: {workout.focus}
                      </Typography>
                    </Box>
                  </Stack>
                  
                  <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
                    <Chip 
                      label={`${workout.rounds} Rounds`} 
                      size="small" 
                      variant="outlined"
                    />
                    <Chip 
                      label={`${workout.workDuration}s work / ${workout.restDuration}s rest`} 
                      size="small" 
                      variant="outlined"
                    />
                  </Stack>

                  <Button
                    variant="contained"
                    fullWidth
                    sx={{ 
                      bgcolor: index === 0 ? 'warning.main' : index === 1 ? 'secondary.main' : 'primary.main',
                      '&:hover': { 
                        bgcolor: index === 0 ? 'warning.dark' : index === 1 ? 'secondary.dark' : 'primary.dark'
                      },
                      py: 1.5,
                      fontWeight: 600,
                      color: index === 0 ? 'text.primary' : 'white'
                    }}
                    onClick={() => handleWorkoutSelect(workout)}
                  >
                    Start {workout.name}
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </Stack>
      )}

      <Box sx={{ mt: 4, textAlign: 'center' }}>
        <Button
          variant="outlined"
          onClick={() => onNavigate && onNavigate('cardio')}
          sx={{ px: 4 }}
        >
          Back to Cardio Hub
        </Button>
      </Box>
    </motion.div>
  );
};

PlyoScreen.propTypes = {
  onNavigate: PropTypes.func,
};

export default PlyoScreen;
