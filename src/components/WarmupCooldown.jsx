import { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Box, 
  Typography, 
  Button, 
  IconButton,
  Chip,
  Alert,
  LinearProgress,
} from '@mui/material';
import { 
  SkipNext, 
  PlayArrow, 
  Pause, 
  ArrowForward,
  Info,
} from '@mui/icons-material';
import { getYoutubeEmbedUrl } from '../utils/helpers';
import { selectStretchesForMuscleGroups } from '../utils/selectStretchesForMuscleGroups';

/**
 * WarmupCooldown Component
 * Dynamic stretch library with auto-suggestion based on workout exercises
 * Includes timer and option to skip with benefits reminder
 */
const WarmupCooldown = ({ 
  exercises = [],
  phase = 'warmup', // 'warmup' or 'cooldown'
  onComplete,
  onSkip,
}) => {
  const [stretches, setStretches] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [showBenefits, setShowBenefits] = useState(false);
  const timerRef = useRef(null);

  // Load stretches based on workout exercises
  useEffect(() => {
    const loadStretches = async () => {
      try {
        const response = await fetch(`${import.meta.env.BASE_URL}data/stretching-library.json`);
        const data = await response.json();
        
        // Extract muscle groups from exercises
        const muscleGroups = [];
        exercises.forEach(exercise => {
          if (exercise['Primary Muscle']) {
            muscleGroups.push(exercise['Primary Muscle']);
          }
          if (exercise['Secondary Muscles']) {
            const secondaryMuscles = exercise['Secondary Muscles']
              .split(',')
              .map(m => m.trim())
              .filter(m => m.length > 0);
            muscleGroups.push(...secondaryMuscles);
          }
        });
        
        // Remove duplicates
        const uniqueMuscles = [...new Set(muscleGroups)];
        
        // Select stretches based on phase
        const stretchType = phase === 'warmup' ? 'dynamic' : 'static';
        const count = phase === 'warmup' ? 5 : 4; // 5-6 for warmup, 4-5 for cooldown
        
        const selectedStretches = selectStretchesForMuscleGroups(
          uniqueMuscles,
          stretchType,
          count + Math.floor(Math.random() * 2), // Add 0-1 extra stretch
          data[stretchType]
        );
        
        setStretches(selectedStretches);
        if (selectedStretches.length > 0) {
          setTimeLeft(selectedStretches[0].duration || 30);
        }
      } catch (error) {
        console.error('Error loading stretches:', error);
      }
    };
    
    loadStretches();
  }, [exercises, phase]);

  // Timer countdown
  useEffect(() => {
    if (!isPlaying || timeLeft <= 0) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      return;
    }

    const handleTimerComplete = () => {
      if (currentIndex + 1 >= stretches.length) {
        onComplete?.();
      } else {
        setCurrentIndex(prev => prev + 1);
        setTimeLeft(stretches[currentIndex + 1]?.duration || 30);
        setIsPlaying(true);
      }
    };

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          // Auto-advance to next stretch when timer completes
          setTimeout(() => handleTimerComplete(), 500);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isPlaying, timeLeft, currentIndex, stretches, onComplete]);

  const handleNext = () => {
    if (currentIndex + 1 >= stretches.length) {
      // All stretches complete
      onComplete?.();
    } else {
      setCurrentIndex(prev => prev + 1);
      setTimeLeft(stretches[currentIndex + 1]?.duration || 30);
      setIsPlaying(true);
    }
  };

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleSkipWithReminder = () => {
    setShowBenefits(true);
  };

  const handleConfirmSkip = () => {
    onSkip?.();
  };

  const handleCancelSkip = () => {
    setShowBenefits(false);
  };

  if (stretches.length === 0) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography sx={{ mt: 2, color: 'text.secondary' }}>
          Loading {phase} routine
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          >
            ...
          </motion.span>
        </Typography>
      </Box>
    );
  }

  const currentStretch = stretches[currentIndex];
  const progress = currentStretch ? ((currentStretch.duration - timeLeft) / currentStretch.duration) * 100 : 0;
  const overallProgress = ((currentIndex + 1) / stretches.length) * 100;

  const benefits = phase === 'warmup' 
    ? [
        'Increases blood flow to muscles',
        'Reduces risk of injury',
        'Improves range of motion',
        'Enhances workout performance',
      ]
    : [
        'Reduces muscle soreness',
        'Promotes faster recovery',
        'Improves flexibility',
        'Helps prevent injury',
      ];

  return (
    <Box sx={{ 
      maxWidth: '800px', 
      margin: '0 auto', 
      p: { xs: 2, sm: 3 },
      minHeight: '44px', // Touch-friendly minimum
    }}>
      {/* Header */}
      <Box sx={{ mb: 3, textAlign: 'center' }}>
        <Typography variant="h5" sx={{ fontWeight: 600, mb: 1 }}>
          {phase === 'warmup' ? '🔥 Warm-Up' : '🧘 Cool-Down'}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Stretch {currentIndex + 1} of {stretches.length}
        </Typography>
        <LinearProgress 
          variant="determinate" 
          value={overallProgress}
          sx={{ mt: 1, height: 8, borderRadius: 4 }}
        />
      </Box>

      {/* Benefits Reminder */}
      <AnimatePresence>
        {showBenefits && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Alert 
              severity="info"
              icon={<Info />}
              sx={{ mb: 3 }}
            >
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                {phase === 'warmup' ? 'Warm-up' : 'Cool-down'} Benefits:
              </Typography>
              <ul style={{ margin: 0, paddingLeft: '20px' }}>
                {benefits.map((benefit, idx) => (
                  <li key={idx}>
                    <Typography variant="body2">{benefit}</Typography>
                  </li>
                ))}
              </ul>
              <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                <Button 
                  variant="outlined" 
                  size="small"
                  onClick={handleCancelSkip}
                  sx={{ minHeight: '44px' }}
                >
                  Continue {phase === 'warmup' ? 'Warm-Up' : 'Cool-Down'}
                </Button>
                <Button 
                  variant="contained" 
                  color="warning"
                  size="small"
                  onClick={handleConfirmSkip}
                  sx={{ minHeight: '44px' }}
                >
                  Skip Anyway
                </Button>
              </Box>
            </Alert>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stretch Card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -50 }}
          transition={{ duration: 0.3 }}
        >
          <Box
            sx={{
              bgcolor: 'background.paper',
              borderRadius: 2,
              boxShadow: 3,
              p: 3,
            }}
          >
            {/* Stretch Info */}
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
              {currentStretch.name}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {currentStretch.description}
            </Typography>

            {/* Muscle Tags */}
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
              <Chip 
                label={currentStretch.primaryMuscles} 
                size="small" 
                color="primary"
              />
              {currentStretch.secondaryMuscles && (
                <Chip 
                  label={currentStretch.secondaryMuscles} 
                  size="small" 
                  variant="outlined"
                />
              )}
            </Box>

            {/* Timer Display */}
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                my: 3,
              }}
            >
              <Box sx={{ position: 'relative', display: 'inline-flex' }}>
                <CircularProgress
                  variant="determinate"
                  value={progress}
                  size={140}
                  thickness={5}
                  sx={{
                    color: phase === 'warmup' ? 'error.main' : 'info.main',
                  }}
                />
                <Box
                  sx={{
                    top: 0,
                    left: 0,
                    bottom: 0,
                    right: 0,
                    position: 'absolute',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Typography variant="h2" component="div" color="text.primary" sx={{ fontWeight: 600 }}>
                    {timeLeft}
                  </Typography>
                </Box>
              </Box>
              <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                <IconButton 
                  onClick={handlePlayPause}
                  size="large"
                  sx={{ 
                    bgcolor: 'primary.main',
                    color: 'white',
                    minWidth: '44px',
                    minHeight: '44px',
                    '&:hover': {
                      bgcolor: 'primary.dark',
                    }
                  }}
                >
                  {isPlaying ? <Pause /> : <PlayArrow />}
                </IconButton>
              </Box>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
                seconds remaining
              </Typography>
            </Box>

            {/* Video Demonstration */}
            {currentStretch.youtubeLink && (
              <Box sx={{ mb: 2, mt: 3 }}>
                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                  Demonstration:
                </Typography>
                <Box sx={{ 
                  position: 'relative', 
                  paddingBottom: '56.25%', 
                  height: 0, 
                  overflow: 'hidden',
                  borderRadius: 2,
                }}>
                  <iframe
                    src={getYoutubeEmbedUrl(currentStretch.youtubeLink)}
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                    }}
                  />
                </Box>
              </Box>
            )}

            {/* Navigation Buttons - Touch-friendly */}
            <Box
              sx={{
                display: 'flex',
                gap: 2,
                mt: 3,
                flexDirection: { xs: 'column', sm: 'row' },
              }}
            >
              <Button
                variant="outlined"
                onClick={handleSkipWithReminder}
                fullWidth
                sx={{ 
                  minHeight: '44px', // Touch-friendly
                  order: { xs: 2, sm: 1 } 
                }}
              >
                Skip {phase === 'warmup' ? 'Warm-Up' : 'Cool-Down'}
              </Button>
              <Button
                variant="contained"
                onClick={handleNext}
                endIcon={currentIndex + 1 >= stretches.length ? <ArrowForward /> : <SkipNext />}
                fullWidth
                sx={{ 
                  minHeight: '44px', // Touch-friendly
                  order: { xs: 1, sm: 2 } 
                }}
              >
                {currentIndex + 1 >= stretches.length ? 'Complete' : 'Next Stretch'}
              </Button>
            </Box>
          </Box>
        </motion.div>
      </AnimatePresence>
    </Box>
  );
};

WarmupCooldown.propTypes = {
  exercises: PropTypes.arrayOf(PropTypes.object),
  phase: PropTypes.oneOf(['warmup', 'cooldown']),
  onComplete: PropTypes.func,
  onSkip: PropTypes.func,
};

export default WarmupCooldown;
