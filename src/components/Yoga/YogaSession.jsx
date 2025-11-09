import { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import PropTypes from 'prop-types';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  LinearProgress,
  IconButton,
  Chip,
  Stack,
  Tooltip,
} from '@mui/material';
import { PlayArrow, Pause, Stop } from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { useSaveYogaSession } from '../../hooks/useYogaSessions';
import audioService from '../../utils/audioService';
import wakeLockManager from '../../utils/wakeLock';

/**
 * YogaSession Component
 * Manages the yoga session timer, pose suggestions, and TTS
 */
const YogaSession = ({ config, onComplete, onExit }) => {
  const [phase, setPhase] = useState('countdown'); // countdown, flow, cooldown, complete
  const [timeLeft, setTimeLeft] = useState(15); // Start with 15 second countdown
  const [isPaused, setIsPaused] = useState(false);
  const [currentPose, setCurrentPose] = useState('Sun Salutations');
  const [poseCount, setPoseCount] = useState(0);
  const [sessionStartTime, setSessionStartTime] = useState(null);
  const intervalRef = useRef(null);
  const nextPoseSuggestionRef = useRef(0);
  
  const saveYogaSessionMutation = useSaveYogaSession();

  // Load yoga poses data using react-query
  const { data: yogaPoses = [], isLoading } = useQuery({
    queryKey: ['yogaPoses'],
    queryFn: async () => {
      const response = await fetch(`${import.meta.env.BASE_URL}data/yoga-poses.json`);
      if (!response.ok) {
        throw new Error('Failed to load yoga poses');
      }
      return response.json();
    },
    staleTime: Infinity, // Data doesn't change
  });

  // Manage wake lock
  useEffect(() => {
    wakeLockManager.requestWakeLock();
    return () => wakeLockManager.releaseWakeLock();
  }, []);

  // TTS helper function
  const speak = useCallback((text) => {
    if (config.ttsEnabled && 'speechSynthesis' in window) {
      // Cancel any ongoing speech
      window.speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;
      window.speechSynthesis.speak(utterance);
    }
  }, [config.ttsEnabled]);

  // Get a random pose by type
  const getRandomPose = useCallback((type) => {
    const filteredPoses = yogaPoses.filter(pose => pose.Type === type);
    if (filteredPoses.length === 0) return null;
    return filteredPoses[Math.floor(Math.random() * filteredPoses.length)];
  }, [yogaPoses]);

  // Suggest a new pose
  const suggestPose = useCallback((poseType) => {
    const pose = getRandomPose(poseType);
    if (pose) {
      setCurrentPose(pose.Name);
      setPoseCount(prev => prev + 1);
      speak(pose.Name);
      audioService.playHighBeep();
    }
  }, [getRandomPose, speak]);

  const handleComplete = useCallback(async () => {
    try {
      const endTime = Date.now();
      const actualDuration = Math.floor((endTime - sessionStartTime) / 1000);

      // Save session using react-query mutation
      await saveYogaSessionMutation.mutateAsync({
        date: new Date().toISOString(),
        flow: config.flowLength,
        cooldown: config.coolDownLength,
        interval: config.poseSuggestionFrequency,
        poseCount: poseCount,
        duration: actualDuration || (config.flowLength + config.coolDownLength) * 60,
        cooldownDisabled: config.coolDownLength === 0,
      });

      audioService.playCompletionFanfare();
      speak('Great work! Your yoga session is complete. Namaste.');
    } catch (error) {
      console.error('Error saving yoga session:', error);
    }
  }, [sessionStartTime, config.flowLength, config.coolDownLength, config.poseSuggestionFrequency, poseCount, speak, saveYogaSessionMutation]);

  // Timer logic
  useEffect(() => {
    if (!isPaused && !isLoading) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(intervalRef.current);
            
            // Phase transitions
            if (phase === 'countdown') {
              // Start flow phase
              setPhase('flow');
              setSessionStartTime(Date.now());
              nextPoseSuggestionRef.current = config.poseSuggestionFrequency * 60;
              speak('Begin your practice with Sun Salutations');
              audioService.playHighBeep();
              return config.flowLength * 60;
            } else if (phase === 'flow') {
              // Check if cooldown is disabled (coolDownLength === 0)
              if (config.coolDownLength === 0) {
                // Skip cooldown, go directly to complete
                setPhase('complete');
                handleComplete();
                return 0;
              }
              
              // Start cooldown phase
              setPhase('cooldown');
              setCurrentPose('Cool Down');
              nextPoseSuggestionRef.current = 60; // Every minute during cooldown
              speak('Begin cool down');
              suggestPose('Cool Down Pose');
              audioService.playLowBeep();
              return config.coolDownLength * 60;
            } else if (phase === 'cooldown') {
              // Complete session
              setPhase('complete');
              handleComplete();
              return 0;
            }
            return 0;
          }

          // Check for pose suggestions
          const newTime = prev - 1;
          if (phase === 'flow' && newTime === nextPoseSuggestionRef.current) {
            suggestPose('Flow Pose');
            nextPoseSuggestionRef.current -= config.poseSuggestionFrequency * 60;
          } else if (phase === 'cooldown' && newTime % 60 === 0 && newTime > 0) {
            suggestPose('Cool Down Pose');
          }

          return newTime;
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
  }, [isPaused, phase, isLoading, config, speak, suggestPose, handleComplete]);

  const handlePlayPause = () => {
    setIsPaused(prev => !prev);
  };

  const handleExit = () => {
    if (window.confirm('Are you sure you want to end this yoga session?')) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      onExit();
    }
  };

  const handleFinish = () => {
    onComplete();
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getProgress = () => {
    if (phase === 'countdown') {
      return ((15 - timeLeft) / 15) * 100;
    } else if (phase === 'flow') {
      return ((config.flowLength * 60 - timeLeft) / (config.flowLength * 60)) * 100;
    } else if (phase === 'cooldown') {
      return ((config.coolDownLength * 60 - timeLeft) / (config.coolDownLength * 60)) * 100;
    }
    return 100;
  };

  const getPhaseLabel = () => {
    if (phase === 'countdown') return 'Get Ready';
    if (phase === 'flow') return 'Flow Phase';
    if (phase === 'cooldown') return 'Cool Down';
    return 'Complete';
  };

  if (isLoading) {
    return (
      <Box sx={{ 
        p: 4, 
        textAlign: 'center',
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center',
        minHeight: '400px'
      }}>
        <img 
          src={`${import.meta.env.BASE_URL}dancing-icon.svg`} 
          alt="Loading yoga session..." 
          style={{ width: '150px', height: '150px' }}
        />
      </Box>
    );
  }

  if (phase === 'complete') {
    return (
      <Box
        sx={{
          padding: { xs: '2rem 1rem', sm: '2rem', md: '3rem' },
          maxWidth: '700px',
          margin: '0 auto',
          minHeight: 'calc(100vh - 60px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          style={{ width: '100%' }}
        >
          <Card
            sx={{
              background: 'linear-gradient(135deg, rgba(156, 39, 176, 0.05) 0%, rgba(19, 70, 134, 0.05) 100%)',
              boxShadow: 6,
            }}
          >
            <CardContent sx={{ padding: { xs: 3, sm: 5 }, textAlign: 'center' }}>
              <Typography
                variant="h2"
                sx={{
                  fontFamily: "'Montserrat', sans-serif",
                  fontWeight: 800,
                  color: '#9c27b0',
                  marginBottom: 2,
                }}
              >
                Namaste! 🙏
              </Typography>

              <Typography
                variant="h5"
                sx={{
                  color: 'text.secondary',
                  marginBottom: 3,
                }}
              >
                Your yoga session is complete
              </Typography>

              <Stack spacing={2} sx={{ mb: 4 }}>
                <Typography variant="body1">
                  Duration: {config.flowLength + config.coolDownLength} minutes
                </Typography>
                <Typography variant="body1">
                  Poses practiced: {poseCount}
                </Typography>
              </Stack>

              <Button
                variant="contained"
                size="large"
                onClick={handleFinish}
                sx={{
                  minWidth: '200px',
                  padding: '12px 32px',
                  fontSize: '1.1rem',
                  fontWeight: 600,
                  bgcolor: '#9c27b0',
                  '&:hover': {
                    bgcolor: '#7b1fa2',
                  },
                }}
              >
                Done
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        padding: { xs: '2rem 1rem', sm: '2rem', md: '3rem' },
        maxWidth: '900px',
        margin: '0 auto',
        minHeight: 'calc(100vh - 60px)',
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card
          sx={{
            background: 'linear-gradient(135deg, rgba(156, 39, 176, 0.05) 0%, rgba(19, 70, 134, 0.05) 100%)',
            boxShadow: 4,
          }}
        >
          <CardContent sx={{ padding: { xs: 3, sm: 4 } }}>
            {/* Phase Indicator */}
            <Box sx={{ textAlign: 'center', mb: 3 }}>
              <Chip
                label={getPhaseLabel()}
                sx={{
                  fontSize: '1rem',
                  fontWeight: 700,
                  bgcolor: phase === 'countdown' ? 'warning.main' : 
                           phase === 'flow' ? '#9c27b0' : 'success.main',
                  color: 'white',
                  px: 2,
                  py: 3,
                }}
              />
            </Box>

            {/* Timer Display */}
            <Box sx={{ textAlign: 'center', mb: 3 }}>
              <Typography
                variant="h1"
                sx={{
                  fontFamily: "'Montserrat', sans-serif",
                  fontWeight: 800,
                  color: isPaused ? 'grey.500' : '#9c27b0',
                  fontSize: { xs: '4rem', sm: '6rem' },
                  mb: 2,
                }}
              >
                {formatTime(timeLeft)}
              </Typography>

              <LinearProgress
                variant="determinate"
                value={getProgress()}
                sx={{
                  height: 12,
                  borderRadius: 6,
                  backgroundColor: 'rgba(156, 39, 176, 0.1)',
                  '& .MuiLinearProgress-bar': {
                    backgroundColor: '#9c27b0',
                  },
                }}
              />
            </Box>

            {/* Current Pose */}
            <Box
              sx={{
                textAlign: 'center',
                mb: 4,
                p: 3,
                bgcolor: 'rgba(156, 39, 176, 0.1)',
                borderRadius: 2,
                border: '1px solid rgba(156, 39, 176, 0.2)',
              }}
            >
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 1, color: 'text.secondary' }}>
                {phase === 'countdown' ? 'Prepare to begin' : 'Current Focus'}
              </Typography>
              <Typography
                variant="h4"
                sx={{
                  fontFamily: "'Montserrat', sans-serif",
                  fontWeight: 700,
                  color: '#9c27b0',
                }}
              >
                {currentPose}
              </Typography>
            </Box>

            {/* Controls */}
            <Stack direction="row" spacing={2} justifyContent="center" sx={{ mb: 2 }}>
              <Tooltip title={isPaused ? 'Resume' : 'Pause'}>
                <IconButton
                  onClick={handlePlayPause}
                  disabled={phase === 'countdown'}
                  sx={{
                    backgroundColor: '#9c27b0',
                    color: 'white',
                    width: 64,
                    height: 64,
                    '&:hover': { backgroundColor: '#7b1fa2' },
                    '&:disabled': { backgroundColor: 'grey.400' },
                  }}
                >
                  {isPaused ? <PlayArrow sx={{ fontSize: 40 }} /> : <Pause sx={{ fontSize: 40 }} />}
                </IconButton>
              </Tooltip>

              <Tooltip title="End session">
                <IconButton
                  onClick={handleExit}
                  sx={{
                    backgroundColor: 'error.main',
                    color: 'white',
                    width: 56,
                    height: 56,
                    '&:hover': { backgroundColor: 'error.dark' },
                  }}
                >
                  <Stop />
                </IconButton>
              </Tooltip>
            </Stack>

            {/* Session Info */}
            <Stack spacing={1} sx={{ textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                Poses suggested: {poseCount}
              </Typography>
              {phase !== 'countdown' && (
                <Typography variant="body2" color="text.secondary">
                  {phase === 'flow' ? 'Flow' : 'Cool Down'}: {formatTime(timeLeft)} remaining
                </Typography>
              )}
            </Stack>
          </CardContent>
        </Card>
      </motion.div>
    </Box>
  );
};

YogaSession.propTypes = {
  config: PropTypes.shape({
    flowLength: PropTypes.number.isRequired,
    coolDownLength: PropTypes.number.isRequired,
    poseSuggestionFrequency: PropTypes.number.isRequired,
    ttsEnabled: PropTypes.bool.isRequired,
  }).isRequired,
  onComplete: PropTypes.func.isRequired,
  onExit: PropTypes.func.isRequired,
};

export default YogaSession;
