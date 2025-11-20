import PropTypes from 'prop-types';
import { Box, Card, CardContent, Typography, Button, Stack } from '@mui/material';
import { FitnessCenter, SelfImprovement, DirectionsRun } from '@mui/icons-material';
import { useSessionModal } from '../../contexts/SessionModalContext';

/**
 * TimerTab - Provides session setup for HIIT, Yoga, and Cardio
 * Opens sessions in a full-screen modal overlay
 */
const TimerTab = ({ onNavigate }) => {
  const { openSession } = useSessionModal();

  const handleStartHIIT = () => {
    openSession('hiit', {});
  };

  const handleStartYoga = () => {
    openSession('yoga', {});
  };

  const handleStartCardio = () => {
    openSession('cardio', {});
  };

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 3, fontWeight: 600 }}>
        Timed Sessions
      </Typography>
      
      <Stack spacing={2}>
        {/* HIIT Card */}
        <Card>
          <CardContent>
            <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
              <FitnessCenter color="primary" sx={{ fontSize: 40 }} />
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  HIIT
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  High-Intensity Interval Training
                </Typography>
              </Box>
            </Stack>
            <Typography variant="body2" sx={{ mb: 2 }}>
              Alternate between work and rest intervals. Customize durations, rounds, and exercises.
            </Typography>
            <Button 
              variant="contained" 
              fullWidth 
              onClick={handleStartHIIT}
              startIcon={<FitnessCenter />}
            >
              Start HIIT Session
            </Button>
          </CardContent>
        </Card>

        {/* Yoga Card */}
        <Card>
          <CardContent>
            <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
              <SelfImprovement color="primary" sx={{ fontSize: 40 }} />
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Yoga Flow
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Guided yoga pose sequences
                </Typography>
              </Box>
            </Stack>
            <Typography variant="body2" sx={{ mb: 2 }}>
              Create custom yoga flows with timed poses. Choose from preset sequences or build your own.
            </Typography>
            <Button 
              variant="contained" 
              fullWidth 
              onClick={handleStartYoga}
              startIcon={<SelfImprovement />}
            >
              Start Yoga Session
            </Button>
          </CardContent>
        </Card>

        {/* Cardio Card */}
        <Card>
          <CardContent>
            <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
              <DirectionsRun color="primary" sx={{ fontSize: 40 }} />
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Cardio Timer
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Simple countdown timer
                </Typography>
              </Box>
            </Stack>
            <Typography variant="body2" sx={{ mb: 2 }}>
              Set a duration and track your cardio workout. Perfect for running, cycling, or any timed activity.
            </Typography>
            <Button 
              variant="contained" 
              fullWidth 
              onClick={handleStartCardio}
              startIcon={<DirectionsRun />}
            >
              Start Cardio Timer
            </Button>
          </CardContent>
        </Card>
      </Stack>
    </Box>
  );
};

TimerTab.propTypes = {
  onNavigate: PropTypes.func,
};

export default TimerTab;
