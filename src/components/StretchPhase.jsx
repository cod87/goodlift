import { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { motion } from 'framer-motion';
import { Box, Typography, Button, CircularProgress } from '@mui/material';
import { SkipNext } from '@mui/icons-material';
import { getYoutubeEmbedUrl } from '../utils/helpers';

/**
 * StretchPhase Component
 * Displays a single stretch with timer, progress indicator, and navigation
 */
const StretchPhase = ({
  stretch,
  onNext,
  onSkipAll,
  currentIndex,
  totalCount,
  phaseType, // 'warmup' or 'cooldown'
}) => {
  const [timeLeft, setTimeLeft] = useState(stretch.duration || 30);
  const timerRef = useRef(null);

  // Timer countdown
  useEffect(() => {
    setTimeLeft(stretch.duration || 30);
    
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          // Auto-advance to next stretch when timer completes
          setTimeout(() => onNext(), 500);
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
  }, [stretch, onNext]);

  const progress = ((stretch.duration - timeLeft) / stretch.duration) * 100;

  return (
    <motion.div
      key={stretch.name}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      style={{
        width: '100%',
        maxWidth: '600px',
        margin: '0 auto',
      }}
    >
      <Box
        sx={{
          p: 3,
          bgcolor: 'background.paper',
          borderRadius: 2,
          boxShadow: 3,
        }}
      >
        {/* Header */}
        <Box sx={{ mb: 2, textAlign: 'center' }}>
          <Typography variant="overline" color="text.secondary">
            {phaseType === 'warmup' ? 'Warm-Up' : 'Cool-Down'} - Stretch {currentIndex + 1} of {totalCount}
          </Typography>
          <Typography variant="h5" sx={{ fontWeight: 600, mt: 1 }}>
            {stretch.name}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            {stretch.description}
          </Typography>
        </Box>

        {/* Timer and Progress */}
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
              size={120}
              thickness={4}
              sx={{
                color: phaseType === 'warmup' ? 'warning.main' : 'info.main',
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
              <Typography variant="h3" component="div" color="text.primary">
                {timeLeft}
              </Typography>
            </Box>
          </Box>
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
            seconds remaining
          </Typography>
        </Box>

        {/* Video Demonstration */}
        {stretch.youtubeLink && (
          <Box sx={{ mb: 2 }}>
            <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0, overflow: 'hidden' }}>
              <iframe
                src={getYoutubeEmbedUrl(stretch.youtubeLink)}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  borderRadius: '8px',
                }}
              />
            </div>
          </Box>
        )}

        {/* Navigation Buttons */}
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
            onClick={onSkipAll}
            fullWidth
            sx={{ order: { xs: 2, sm: 1 } }}
          >
            Skip {phaseType === 'warmup' ? 'Warm-Up' : 'Cool-Down'}
          </Button>
          <Button
            variant="contained"
            onClick={onNext}
            endIcon={<SkipNext />}
            fullWidth
            sx={{ order: { xs: 1, sm: 2 } }}
          >
            Next Stretch
          </Button>
        </Box>
      </Box>
    </motion.div>
  );
};

StretchPhase.propTypes = {
  stretch: PropTypes.shape({
    name: PropTypes.string.isRequired,
    description: PropTypes.string.isRequired,
    primaryMuscles: PropTypes.string.isRequired,
    secondaryMuscles: PropTypes.string,
    duration: PropTypes.number.isRequired,
    youtubeLink: PropTypes.string,
  }).isRequired,
  onNext: PropTypes.func.isRequired,
  onSkipAll: PropTypes.func.isRequired,
  currentIndex: PropTypes.number.isRequired,
  totalCount: PropTypes.number.isRequired,
  phaseType: PropTypes.oneOf(['warmup', 'cooldown']).isRequired,
};

export default StretchPhase;
