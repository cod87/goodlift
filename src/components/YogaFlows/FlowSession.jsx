import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import PropTypes from 'prop-types';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  IconButton,
  LinearProgress,
  Stack,
  Tooltip,
} from '@mui/material';
import {
  PlayArrow,
  Pause,
  Replay,
  Stop,
} from '@mui/icons-material';
import audioService from '../../utils/audioService';
import wakeLockManager from '../../utils/wakeLock';

/**
 * FlowSession Component
 * Simplified: 10 min Sun Salutations + 5 min Do what feels good!
 */
const FlowSession = ({ flow, onComplete, onExit }) => {
  const [timeLeft, setTimeLeft] = useState(flow.durationMinutes * 60); // Convert to seconds
  const [isPaused, setIsPaused] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const intervalRef = useRef(null);

  const totalSeconds = flow.durationMinutes * 60;
  const progress = ((totalSeconds - timeLeft) / totalSeconds) * 100;
  
  // Determine current segment
  const getCurrentSegment = () => {
    const elapsed = totalSeconds - timeLeft;
    if (elapsed < 600) { // First 10 minutes
      return flow.segments[0]; // Sun Salutations
    } else {
      return flow.segments[1]; // Do what feels good!
    }
  };

  // Manage wake lock
  useEffect(() => {
    // Request wake lock when session starts
    wakeLockManager.requestWakeLock();

    return () => {
      // Release wake lock when session ends
      wakeLockManager.releaseWakeLock();
    };
  }, []);

  // Timer countdown
  useEffect(() => {
    if (!isPaused && !isComplete) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            // Flow complete
            clearInterval(intervalRef.current);
            setIsComplete(true);
            audioService.playChime();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isPaused, isComplete]);

  const handlePlayPause = () => {
    setIsPaused((prev) => !prev);
  };

  const handleReset = () => {
    setTimeLeft(totalSeconds);
    setIsPaused(false);
    setIsComplete(false);
  };

  const handleFinish = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    onComplete();
  };

  const handleExit = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    onExit();
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const currentSegment = getCurrentSegment();

  return (
    <Box
      sx={{
        padding: { xs: '1rem', sm: '2rem' },
        maxWidth: '600px',
        margin: '0 auto',
        minHeight: 'calc(100vh - 60px)',
        width: '100%',
        boxSizing: 'border-box',
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        style={{ width: '100%', boxSizing: 'border-box' }}
      >
        {/* Main Flow Card */}
        <Card
          sx={{
            background: 'linear-gradient(135deg, rgba(19, 70, 134, 0.05) 0%, rgba(156, 39, 176, 0.05) 100%)',
            boxShadow: 4,
            width: '100%',
            boxSizing: 'border-box',
          }}
        >
          <CardContent sx={{ padding: { xs: 2, sm: 3 }, width: '100%', boxSizing: 'border-box' }}>
            {/* Flow Header */}
            <Box sx={{ marginBottom: 3, textAlign: 'center' }}>
              <Typography
                variant="h4"
                sx={{
                  fontFamily: "'Montserrat', sans-serif",
                  fontWeight: 800,
                  color: 'primary.main',
                  marginBottom: 2,
                  fontSize: { xs: '1.5rem', sm: '2rem' }
                }}
              >
                {flow.flowName}
              </Typography>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 600,
                  color: 'secondary.main',
                  fontSize: { xs: '1rem', sm: '1.25rem' }
                }}
              >
                {currentSegment.name}
              </Typography>
            </Box>

            {/* Timer Display */}
            {!isComplete && (
              <Box sx={{ marginBottom: 3, textAlign: 'center' }}>
                <Typography
                  variant="h1"
                  sx={{
                    fontFamily: "'Montserrat', sans-serif",
                    fontWeight: 800,
                    color: isPaused ? 'grey.500' : 'secondary.main',
                    fontSize: { xs: '3.5rem', sm: '5rem' },
                    marginBottom: 1,
                  }}
                >
                  {formatTime(timeLeft)}
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={progress}
                  sx={{
                    height: 12,
                    borderRadius: 6,
                    backgroundColor: 'rgba(156, 39, 176, 0.1)',
                    '& .MuiLinearProgress-bar': {
                      backgroundColor: 'secondary.main',
                    },
                  }}
                />
                <Typography
                  variant="body2"
                  sx={{ marginTop: 1, color: 'text.secondary', fontWeight: 600 }}
                >
                  {Math.round(progress)}% Complete
                </Typography>
              </Box>
            )}

            {/* Completion Message */}
            {isComplete && (
              <Box sx={{ marginBottom: 3, textAlign: 'center' }}>
                <Typography
                  variant="h2"
                  sx={{
                    fontFamily: "'Montserrat', sans-serif",
                    fontWeight: 800,
                    color: 'success.main',
                    marginBottom: 2,
                    fontSize: { xs: '1.75rem', sm: '2.5rem' }
                  }}
                >
                  Flow Complete! 🎉
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Great work completing this {flow.durationMinutes}-minute flow!
                </Typography>
              </Box>
            )}

            {/* Control Buttons */}
            {!isComplete && (
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: 2,
                  marginBottom: 3,
                }}
              >
                <Tooltip title={isPaused ? 'Resume' : 'Pause'}>
                  <IconButton
                    onClick={handlePlayPause}
                    sx={{
                      backgroundColor: 'secondary.main',
                      color: 'white',
                      width: { xs: 56, sm: 64 },
                      height: { xs: 56, sm: 64 },
                      '&:hover': { backgroundColor: 'secondary.dark' },
                    }}
                  >
                    {isPaused ? <PlayArrow sx={{ fontSize: { xs: 32, sm: 40 } }} /> : <Pause sx={{ fontSize: { xs: 32, sm: 40 } }} />}
                  </IconButton>
                </Tooltip>

                <Tooltip title="Reset timer">
                  <IconButton
                    onClick={handleReset}
                    sx={{
                      backgroundColor: 'primary.main',
                      color: 'white',
                      width: { xs: 48, sm: 56 },
                      height: { xs: 48, sm: 56 },
                      '&:hover': { backgroundColor: 'primary.dark' },
                    }}
                  >
                    <Replay sx={{ fontSize: { xs: 24, sm: 28 } }} />
                  </IconButton>
                </Tooltip>
              </Box>
            )}

            {/* Action Buttons */}
            <Stack spacing={2} sx={{ width: '100%', boxSizing: 'border-box' }}>
              {isComplete ? (
                <Button
                  variant="contained"
                  onClick={handleFinish}
                  sx={{ width: '100%', fontWeight: 600, boxSizing: 'border-box' }}
                >
                  Finish
                </Button>
              ) : (
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<Stop />}
                  onClick={handleExit}
                  sx={{ width: '100%', boxSizing: 'border-box' }}
                >
                  End Session
                </Button>
              )}
            </Stack>

            {/* Flow Breakdown */}
            <Box sx={{ marginTop: 3, padding: 2, bgcolor: 'rgba(156, 39, 176, 0.05)', borderRadius: 2 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5, color: 'primary.main' }}>
                Flow Breakdown:
              </Typography>
              {flow.segments.map((segment, index) => (
                <Box key={index} sx={{ mb: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {segment.duration} min: {segment.name}
                  </Typography>
                </Box>
              ))}
            </Box>
          </CardContent>
        </Card>
      </motion.div>
    </Box>
  );
};

FlowSession.propTypes = {
  flow: PropTypes.shape({
    flowName: PropTypes.string.isRequired,
    durationMinutes: PropTypes.number.isRequired,
    segments: PropTypes.arrayOf(PropTypes.shape({
      name: PropTypes.string.isRequired,
      duration: PropTypes.number.isRequired,
    })).isRequired,
  }).isRequired,
  onComplete: PropTypes.func.isRequired,
  onExit: PropTypes.func.isRequired,
};

export default FlowSession;
