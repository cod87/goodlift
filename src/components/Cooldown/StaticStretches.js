import { useState } from 'react';
import { Box, Card, CardContent, Typography, Button, Stack, Chip } from '@mui/material';
import { PlayArrow, CheckCircle } from '@mui/icons-material';
import PropTypes from 'prop-types';

/**
 * StaticStretches Component
 * Provides a structured static stretching protocol for post-workout cooldown
 * 
 * Static stretches involve holding positions to:
 * - Improve flexibility and range of motion
 * - Reduce muscle tension
 * - Promote relaxation
 * - Aid in recovery
 */
const StaticStretches = ({ onComplete, onExit }) => {
  const [currentStretchIndex, setCurrentStretchIndex] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [completed, setCompleted] = useState(false);

  // Default static stretches for cooldown
  const cooldownStretches = [
    {
      name: 'Quad Stretch',
      duration: 30,
      description: 'Standing quad stretch, hold each leg',
      muscles: 'Quadriceps',
    },
    {
      name: 'Hamstring Stretch',
      duration: 30,
      description: 'Seated or standing hamstring stretch',
      muscles: 'Hamstrings, Lower Back',
    },
    {
      name: 'Hip Flexor Stretch',
      duration: 30,
      description: 'Lunge position, stretch hip flexors',
      muscles: 'Hip Flexors, Quads',
    },
    {
      name: 'Chest Stretch',
      duration: 30,
      description: 'Doorway or partner chest stretch',
      muscles: 'Chest, Shoulders',
    },
    {
      name: 'Shoulder Stretch',
      duration: 30,
      description: 'Cross-body shoulder stretch',
      muscles: 'Shoulders, Upper Back',
    },
    {
      name: "Child's Pose",
      duration: 45,
      description: 'Kneeling position with arms extended forward',
      muscles: 'Back, Shoulders, Hips',
    },
  ];

  const currentStretch = cooldownStretches[currentStretchIndex];
  const totalStretches = cooldownStretches.length;
  const progressPercent = ((currentStretchIndex + 1) / totalStretches) * 100;

  const handleStart = () => {
    setIsActive(true);
  };

  const handleNext = () => {
    if (currentStretchIndex < totalStretches - 1) {
      setCurrentStretchIndex(currentStretchIndex + 1);
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
                Cooldown Complete!
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                Great work! Remember to hydrate and rest
              </Typography>
              <Button
                variant="contained"
                onClick={onExit}
                fullWidth
              >
                Finish Session
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
              Static Cooldown Protocol
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              A {totalStretches}-stretch cooldown to aid recovery and flexibility
            </Typography>
            
            <Stack spacing={2} sx={{ mb: 3 }}>
              {cooldownStretches.map((stretch, index) => (
                <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Chip 
                    label={`${stretch.duration}s`} 
                    size="small" 
                    color="success" 
                    variant="outlined"
                  />
                  <Typography variant="body2">
                    {stretch.name}
                  </Typography>
                </Box>
              ))}
            </Stack>

            <Stack direction="row" spacing={2}>
              <Button
                variant="contained"
                color="success"
                startIcon={<PlayArrow />}
                onClick={handleStart}
                fullWidth
              >
                Start Cooldown
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
              Stretch {currentStretchIndex + 1} of {totalStretches}
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
                  bgcolor: 'success.main',
                  transition: 'width 0.3s ease',
                }}
              />
            </Box>
          </Box>

          {/* Stretch Info */}
          <Typography variant="h4" gutterBottom>
            {currentStretch.name}
          </Typography>
          <Chip
            label={`Hold for ${currentStretch.duration} seconds`}
            color="success"
            sx={{ mb: 2 }}
          />
          <Typography variant="body1" paragraph>
            {currentStretch.description}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Target: {currentStretch.muscles}
          </Typography>

          {/* Actions */}
          <Stack direction="row" spacing={2}>
            <Button
              variant="contained"
              color="success"
              onClick={handleNext}
              fullWidth
            >
              {currentStretchIndex < totalStretches - 1 ? 'Next Stretch' : 'Finish'}
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

StaticStretches.propTypes = {
  onComplete: PropTypes.func,
  onExit: PropTypes.func,
};

export default StaticStretches;
