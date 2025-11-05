import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  Tooltip,
} from '@mui/material';
import {
  PlayArrow,
  Pause,
  SkipNext,
  SkipPrevious,
  Stop,
  VolumeUp,
  VolumeOff,
  OpenInNew,
} from '@mui/icons-material';
import ttsService from '../../utils/textToSpeech';
import audioService from '../../utils/audioService';
import wakeLockManager from '../../utils/wakeLock';

/**
 * StretchSession Component
 * Displays and manages the active stretch session with timer and TTS
 */
const StretchSession = ({ stretches, onComplete, onExit }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60); // 60 seconds per stretch
  const [isPaused, setIsPaused] = useState(false);
  const [ttsEnabled, setTtsEnabled] = useState(ttsService.isEnabledState());
  const intervalRef = useRef(null);
  const hasAnnouncedRef = useRef(false);

  const currentStretch = stretches[currentIndex];
  const progress = ((60 - timeLeft) / 60) * 100;
  const totalProgress = ((currentIndex * 60 + (60 - timeLeft)) / (stretches.length * 60)) * 100;

  // Manage wake lock
  useEffect(() => {
    // Request wake lock when session starts
    wakeLockManager.requestWakeLock();

    return () => {
      // Release wake lock when session ends
      wakeLockManager.releaseWakeLock();
      // Stop any TTS
      ttsService.stop();
    };
  }, []);

  // Announce stretch name when changing stretches
  useEffect(() => {
    if (!hasAnnouncedRef.current && ttsEnabled) {
      ttsService.announceExercise(currentStretch.name);
      hasAnnouncedRef.current = true;
    }
  }, [currentIndex, currentStretch.name, ttsEnabled]);

  // Timer countdown
  useEffect(() => {
    if (!isPaused) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            // Stretch complete
            if (currentIndex < stretches.length - 1) {
              // Move to next stretch
              setCurrentIndex((idx) => idx + 1);
              hasAnnouncedRef.current = false;
              audioService.playTransitionBeep();
              return 60;
            } else {
              // Session complete
              clearInterval(intervalRef.current);
              audioService.playCompletionFanfare();
              setTimeout(() => {
                onComplete();
              }, 500);
              return 0;
            }
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
  }, [isPaused, currentIndex, stretches.length, onComplete]);

  const handlePlayPause = () => {
    setIsPaused((prev) => !prev);
  };

  const handleNext = useCallback(() => {
    if (currentIndex < stretches.length - 1) {
      setCurrentIndex((idx) => idx + 1);
      setTimeLeft(60);
      hasAnnouncedRef.current = false;
      audioService.playTransitionBeep();
    }
  }, [currentIndex, stretches.length]);

  const handlePrevious = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex((idx) => idx - 1);
      setTimeLeft(60);
      hasAnnouncedRef.current = false;
      audioService.playTransitionBeep();
    }
  }, [currentIndex]);

  const handleToggleTTS = () => {
    const newState = ttsService.toggleTTS();
    setTtsEnabled(newState);
  };

  const handleExit = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    ttsService.stop();
    onExit();
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Box
      sx={{
        padding: { xs: '2rem 1rem', sm: '2rem', md: '3rem' },
        maxWidth: '900px',
        margin: '0 auto',
        minHeight: 'calc(100vh - 60px)',
      }}
    >
      {/* Overall Progress */}
      <Box sx={{ marginBottom: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', marginBottom: 1 }}>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            Stretch {currentIndex + 1} of {stretches.length}
          </Typography>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            {Math.round(totalProgress)}% Complete
          </Typography>
        </Box>
        <LinearProgress
          variant="determinate"
          value={totalProgress}
          sx={{
            height: 8,
            borderRadius: 4,
            backgroundColor: 'rgba(19, 70, 134, 0.1)',
            '& .MuiLinearProgress-bar': {
              backgroundColor: 'primary.main',
            },
          }}
        />
      </Box>

      {/* Main Stretch Card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -50 }}
          transition={{ duration: 0.3 }}
        >
          <Card
            sx={{
              background: 'linear-gradient(135deg, rgba(19, 70, 134, 0.05) 0%, rgba(237, 63, 39, 0.05) 100%)',
              boxShadow: 4,
            }}
          >
            <CardContent sx={{ padding: { xs: 3, sm: 4 } }}>
              {/* Stretch Name */}
              <Typography
                variant="h3"
                sx={{
                  fontFamily: "'Montserrat', sans-serif",
                  fontWeight: 800,
                  color: 'primary.main',
                  marginBottom: 2,
                  textAlign: 'center',
                }}
              >
                {currentStretch.name}
              </Typography>

              {/* Timer */}
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
                    backgroundColor: 'rgba(237, 63, 39, 0.1)',
                    '& .MuiLinearProgress-bar': {
                      backgroundColor: 'secondary.main',
                    },
                  }}
                />
              </Box>

              {/* Muscle Groups */}
              <Box sx={{ marginBottom: 3 }}>
                <Typography
                  variant="subtitle2"
                  sx={{ fontWeight: 600, marginBottom: 1, color: 'primary.main' }}
                >
                  Primary Muscles:
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, marginBottom: 2 }}>
                  {currentStretch.primaryMuscles.split(',').map((muscle, idx) => (
                    <Chip
                      key={idx}
                      label={muscle.trim()}
                      color="primary"
                      size="medium"
                    />
                  ))}
                </Box>

                {currentStretch.secondaryMuscles && (
                  <>
                    <Typography
                      variant="subtitle2"
                      sx={{ fontWeight: 600, marginBottom: 1, color: 'text.secondary' }}
                    >
                      Secondary Muscles:
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {currentStretch.secondaryMuscles.split(',').map((muscle, idx) => {
                        const trimmed = muscle.trim();
                        return trimmed ? (
                          <Chip
                            key={idx}
                            label={trimmed}
                            variant="outlined"
                            size="small"
                          />
                        ) : null;
                      })}
                    </Box>
                  </>
                )}
              </Box>

              {/* Video Link */}
              {currentStretch.youtubeLink && (
                <Button
                  variant="outlined"
                  startIcon={<OpenInNew />}
                  onClick={() => window.open(currentStretch.youtubeLink, '_blank')}
                  fullWidth
                  sx={{ marginBottom: 3 }}
                >
                  Watch Demonstration
                </Button>
              )}

              {/* Control Buttons */}
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: 2,
                  marginBottom: 2,
                }}
              >
                <Tooltip title="Previous stretch">
                  <span>
                    <IconButton
                      onClick={handlePrevious}
                      disabled={currentIndex === 0}
                      sx={{
                        backgroundColor: 'primary.main',
                        color: 'white',
                        '&:hover': { backgroundColor: 'primary.dark' },
                        '&:disabled': {
                          backgroundColor: 'grey.300',
                          color: 'grey.500',
                        },
                      }}
                    >
                      <SkipPrevious />
                    </IconButton>
                  </span>
                </Tooltip>

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

                <Tooltip title="Next stretch">
                  <span>
                    <IconButton
                      onClick={handleNext}
                      disabled={currentIndex === stretches.length - 1}
                      sx={{
                        backgroundColor: 'primary.main',
                        color: 'white',
                        '&:hover': { backgroundColor: 'primary.dark' },
                        '&:disabled': {
                          backgroundColor: 'grey.300',
                          color: 'grey.500',
                        },
                      }}
                    >
                      <SkipNext />
                    </IconButton>
                  </span>
                </Tooltip>
              </Box>

              {/* Secondary Controls */}
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: 2,
                }}
              >
                <Tooltip title={ttsEnabled ? 'Voice announcements on' : 'Voice announcements off'}>
                  <IconButton onClick={handleToggleTTS} color={ttsEnabled ? 'primary' : 'default'}>
                    {ttsEnabled ? <VolumeUp /> : <VolumeOff />}
                  </IconButton>
                </Tooltip>

                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<Stop />}
                  onClick={handleExit}
                  sx={{ minWidth: '120px' }}
                >
                  End Session
                </Button>
              </Box>
            </CardContent>
          </Card>
        </motion.div>
      </AnimatePresence>
    </Box>
  );
};

StretchSession.propTypes = {
  stretches: PropTypes.arrayOf(
    PropTypes.shape({
      name: PropTypes.string.isRequired,
      primaryMuscles: PropTypes.string.isRequired,
      secondaryMuscles: PropTypes.string,
      youtubeLink: PropTypes.string,
    })
  ).isRequired,
  onComplete: PropTypes.func.isRequired,
  onExit: PropTypes.func.isRequired,
};

export default StretchSession;
