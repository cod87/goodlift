import { useState } from 'react';
import { Box, Card, CardContent, Typography, Button, Stack, Chip } from '@mui/material';
import { PlayArrow, CheckCircle } from '@mui/icons-material';
import PropTypes from 'prop-types';

/**
 * DynamicWarmup Component
 * Provides a structured dynamic warmup protocol for preparing the body for exercise
 * 
 * Dynamic warmups involve movement-based exercises that:
 * - Increase heart rate and blood flow
 * - Improve range of motion
 * - Activate muscles and nervous system
 * - Prepare joints for loaded movements
 */
const DynamicWarmup = ({ onComplete, onExit }) => {
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [completed, setCompleted] = useState(false);

  // Default dynamic warmup exercises
  const warmupExercises = [
    {
      name: 'Arm Circles',
      duration: 30,
      description: 'Forward and backward arm circles to warm up shoulders',
      muscles: 'Shoulders, Upper Back',
    },
    {
      name: 'Leg Swings',
      duration: 30,
      description: 'Front-to-back and side-to-side leg swings',
      muscles: 'Hip Flexors, Glutes, Adductors',
    },
    {
      name: 'Torso Twists',
      duration: 30,
      description: 'Standing torso rotations to warm up the spine',
      muscles: 'Core, Obliques, Lower Back',
    },
    {
      name: 'High Knees',
      duration: 30,
      description: 'Running in place with high knee lifts',
      muscles: 'Hip Flexors, Quads, Calves',
    },
    {
      name: 'Bodyweight Squats',
      duration: 30,
      description: 'Light squats to activate lower body',
      muscles: 'Quads, Glutes, Hamstrings',
    },
  ];

  const currentExercise = warmupExercises[currentExerciseIndex];
  const totalExercises = warmupExercises.length;
  const progressPercent = ((currentExerciseIndex + 1) / totalExercises) * 100;

  const handleStart = () => {
    setIsActive(true);
  };

  const handleNext = () => {
    if (currentExerciseIndex < totalExercises - 1) {
      setCurrentExerciseIndex(currentExerciseIndex + 1);
    } else {
      setCompleted(true);
      setIsActive(false);
      if (onComplete) {
        onComplete();
      }
    }
  };

  const handleSkip = () => {
    handleNext();
  };

  if (completed) {
    return (
      <Box sx={{ padding: 3, maxWidth: 600, margin: '0 auto' }}>
        <Card>
          <CardContent>
            <Box sx={{ textAlign: 'center', py: 3 }}>
              <CheckCircle sx={{ fontSize: 64, color: 'success.main', mb: 2 }} />
              <Typography variant="h5" gutterBottom>
                Warmup Complete!
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                You're ready to start your workout
              </Typography>
              <Button
                variant="contained"
                onClick={onExit}
                fullWidth
              >
                Continue to Workout
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Box>
    );
  }

  if (!isActive) {
    return (
      <Box sx={{ padding: 3, maxWidth: 600, margin: '0 auto' }}>
        <Card>
          <CardContent>
            <Typography variant="h5" gutterBottom>
              Dynamic Warmup Protocol
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              A {totalExercises}-exercise warmup to prepare your body for training
            </Typography>
            
            <Stack spacing={2} sx={{ mb: 3 }}>
              {warmupExercises.map((exercise, index) => (
                <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Chip 
                    label={`${exercise.duration}s`} 
                    size="small" 
                    color="primary" 
                    variant="outlined"
                  />
                  <Typography variant="body2">
                    {exercise.name}
                  </Typography>
                </Box>
              ))}
            </Stack>

            <Stack direction="row" spacing={2}>
              <Button
                variant="contained"
                startIcon={<PlayArrow />}
                onClick={handleStart}
                fullWidth
              >
                Start Warmup
              </Button>
              {onExit && (
                <Button
                  variant="outlined"
                  onClick={onExit}
                  fullWidth
                >
                  Skip
                </Button>
              )}
            </Stack>
          </CardContent>
        </Card>
      </Box>
    );
  }

  return (
    <Box sx={{ padding: 3, maxWidth: 600, margin: '0 auto' }}>
      <Card>
        <CardContent>
          {/* Progress */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="caption" color="text.secondary">
              Exercise {currentExerciseIndex + 1} of {totalExercises}
            </Typography>
            <Box
              sx={{
                width: '100%',
                height: 8,
                bgcolor: 'grey.200',
                borderRadius: 1,
                mt: 1,
                overflow: 'hidden',
              }}
            >
              <Box
                sx={{
                  width: `${progressPercent}%`,
                  height: '100%',
                  bgcolor: 'primary.main',
                  transition: 'width 0.3s ease',
                }}
              />
            </Box>
          </Box>

          {/* Exercise Info */}
          <Typography variant="h4" gutterBottom>
            {currentExercise.name}
          </Typography>
          <Chip
            label={`${currentExercise.duration} seconds`}
            color="primary"
            sx={{ mb: 2 }}
          />
          <Typography variant="body1" paragraph>
            {currentExercise.description}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Target: {currentExercise.muscles}
          </Typography>

          {/* Actions */}
          <Stack direction="row" spacing={2}>
            <Button
              variant="contained"
              onClick={handleNext}
              fullWidth
            >
              {currentExerciseIndex < totalExercises - 1 ? 'Next Exercise' : 'Finish'}
            </Button>
            <Button
              variant="outlined"
              onClick={handleSkip}
              fullWidth
            >
              Skip
            </Button>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
};

DynamicWarmup.propTypes = {
  onComplete: PropTypes.func,
  onExit: PropTypes.func,
};

export default DynamicWarmup;
