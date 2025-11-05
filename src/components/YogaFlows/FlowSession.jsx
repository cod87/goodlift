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
  Chip,
  Stack,
  Tooltip,
  List,
  ListItem,
  ListItemText,
} from '@mui/material';
import {
  PlayArrow,
  Pause,
  Replay,
  Stop,
  OpenInNew,
} from '@mui/icons-material';
import audioService from '../../utils/audioService';
import wakeLockManager from '../../utils/wakeLock';

/**
 * FlowSession Component
 * Displays and manages the active yoga flow session with timer
 */
const FlowSession = ({ flow, onComplete, onExit }) => {
  const [timeLeft, setTimeLeft] = useState(flow.durationMinutes * 60); // Convert to seconds
  const [isPaused, setIsPaused] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const intervalRef = useRef(null);

  const totalSeconds = flow.durationMinutes * 60;
  const progress = ((totalSeconds - timeLeft) / totalSeconds) * 100;

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

  const getDifficultyColor = (level) => {
    switch (level) {
      case 'Beginner':
        return 'success';
      case 'Intermediate':
        return 'warning';
      case 'Advanced':
        return 'error';
      default:
        return 'default';
    }
  };

  return (
    <Box
      sx={{
        padding: { xs: '2rem 1rem', sm: '2rem', md: '3rem' },
        maxWidth: '1000px',
        margin: '0 auto',
        minHeight: 'calc(100vh - 60px)',
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Main Flow Card */}
        <Card
          sx={{
            background: 'linear-gradient(135deg, rgba(19, 70, 134, 0.05) 0%, rgba(156, 39, 176, 0.05) 100%)',
            boxShadow: 4,
            marginBottom: 3,
          }}
        >
          <CardContent sx={{ padding: { xs: 3, sm: 4 } }}>
            {/* Flow Header */}
            <Box sx={{ marginBottom: 3 }}>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: 2,
                }}
              >
                <Typography
                  variant="h3"
                  sx={{
                    fontFamily: "'Montserrat', sans-serif",
                    fontWeight: 800,
                    color: 'primary.main',
                    flexGrow: 1,
                    marginRight: 2,
                  }}
                >
                  {flow.flowName}
                </Typography>
                <Chip
                  label={flow.difficultyLevel}
                  color={getDifficultyColor(flow.difficultyLevel)}
                  sx={{ fontWeight: 600 }}
                />
              </Box>

              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                <Chip
                  label={`${flow.durationMinutes} minutes`}
                  size="small"
                  color="primary"
                  variant="outlined"
                />
                <Chip
                  label={flow.pace}
                  size="small"
                  variant="outlined"
                />
                <Chip
                  label={flow.primaryFocus}
                  size="small"
                  variant="outlined"
                />
              </Stack>
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
                    fontSize: { xs: '4rem', sm: '6rem' },
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
                      width: 64,
                      height: 64,
                      '&:hover': { backgroundColor: 'secondary.dark' },
                    }}
                  >
                    {isPaused ? <PlayArrow sx={{ fontSize: 40 }} /> : <Pause sx={{ fontSize: 40 }} />}
                  </IconButton>
                </Tooltip>

                <Tooltip title="Reset timer">
                  <IconButton
                    onClick={handleReset}
                    sx={{
                      backgroundColor: 'primary.main',
                      color: 'white',
                      '&:hover': { backgroundColor: 'primary.dark' },
                    }}
                  >
                    <Replay />
                  </IconButton>
                </Tooltip>
              </Box>
            )}

            {/* Action Buttons */}
            <Stack spacing={2} direction={{ xs: 'column', sm: 'row' }} justifyContent="center">
              {flow.youtubeLink && (
                <Button
                  variant="outlined"
                  startIcon={<OpenInNew />}
                  onClick={() => window.open(flow.youtubeLink, '_blank')}
                  sx={{ minWidth: '180px' }}
                >
                  Watch Video
                </Button>
              )}
              {isComplete ? (
                <Button
                  variant="contained"
                  onClick={handleFinish}
                  sx={{ minWidth: '180px', fontWeight: 600 }}
                >
                  Finish
                </Button>
              ) : (
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<Stop />}
                  onClick={handleExit}
                  sx={{ minWidth: '180px' }}
                >
                  End Session
                </Button>
              )}
            </Stack>
          </CardContent>
        </Card>

        {/* Flow Details */}
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography
                  variant="h6"
                  sx={{ fontWeight: 700, marginBottom: 2, color: 'primary.main' }}
                >
                  Poses in This Flow
                </Typography>
                <List dense>
                  {flow.posesIncluded.map((pose, index) => (
                    <ListItem key={index} sx={{ paddingLeft: 0 }}>
                      <ListItemText
                        primary={pose}
                        primaryTypographyProps={{
                          fontSize: '0.95rem',
                        }}
                      />
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography
                  variant="h6"
                  sx={{ fontWeight: 700, marginBottom: 2, color: 'primary.main' }}
                >
                  About This Flow
                </Typography>
                
                <Typography variant="subtitle2" sx={{ fontWeight: 600, marginTop: 2 }}>
                  Target Muscles:
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ marginBottom: 2 }}>
                  {flow.targetMuscles}
                </Typography>

                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                  Suitable For:
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ marginBottom: 2 }}>
                  {flow.suitableFor}
                </Typography>

                {flow.propsNeeded && (
                  <>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                      Props Needed:
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {flow.propsNeeded}
                    </Typography>
                  </>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </motion.div>
    </Box>
  );
};

// Add missing Grid import
import { Grid } from '@mui/material';

FlowSession.propTypes = {
  flow: PropTypes.shape({
    flowName: PropTypes.string.isRequired,
    durationMinutes: PropTypes.number.isRequired,
    difficultyLevel: PropTypes.string.isRequired,
    primaryFocus: PropTypes.string.isRequired,
    posesIncluded: PropTypes.arrayOf(PropTypes.string).isRequired,
    targetMuscles: PropTypes.string.isRequired,
    suitableFor: PropTypes.string.isRequired,
    pace: PropTypes.string.isRequired,
    propsNeeded: PropTypes.string,
    youtubeLink: PropTypes.string,
  }).isRequired,
  onComplete: PropTypes.func.isRequired,
  onExit: PropTypes.func.isRequired,
};

export default FlowSession;
