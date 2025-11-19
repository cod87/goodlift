import { memo, useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { 
  Box, 
  Typography, 
  Button,
  Chip,
  Alert,
  Stack,
  IconButton,
} from '@mui/material';
import { 
  CheckCircle,
  TrendingUp,
  HelpOutline,
  Save,
  ExitToApp,
  SkipNext,
  SwapHoriz,
  Star,
  StarBorder,
  ArrowBack,
  ArrowForward,
} from '@mui/icons-material';
import ExerciseInputs from './ExerciseInputs';

/**
 * ExerciseCard - Enhanced exercise display with improved layout
 * - Header bar with timer, step counter, set indicator, and favorite star
 * - Skip/swap/help icons in top left corner
 * - Responsive font sizing for exercise name (max 2 lines)
 * - Extended card height close to bottom navigation
 */
const ExerciseCard = memo(({ 
  exerciseName,
  setNumber,
  totalSets,
  videoUrl,
  demoImage = null,
  lastWeight = null,
  lastReps = null,
  onSubmit,
  onBack,
  showBack = false,
  suggestedWeight = null,
  suggestedReps = null,
  showSuggestions = true,
  // New props for enhanced layout
  elapsedTime = null,
  currentStep = 1,
  totalSteps = 1,
  isFavorite = false,
  onToggleFavorite = null,
  onSkip = null,
  onSwap = null,
  onPartialComplete = null,
  onExit = null,
  showPartialComplete = false,
}) => {
  const [weight, setWeight] = useState(lastWeight || '');
  const [reps, setReps] = useState(lastReps || '');
  const [setLogged, setSetLogged] = useState(false);
  const [suggestionAccepted, setSuggestionAccepted] = useState(false);
  const exerciseNameRef = useRef(null);
  const [exerciseFontSize, setExerciseFontSize] = useState('3rem');

  const handleSubmit = (e) => {
    e.preventDefault();
    setSetLogged(true);
    
    // Auto-advance after brief delay
    setTimeout(() => {
      onSubmit({ weight: parseFloat(weight) || 0, reps: parseInt(reps) || 0 });
      setSetLogged(false);
      setSuggestionAccepted(false);
    }, 800);
  };

  const handleAcceptSuggestion = () => {
    if (suggestedWeight !== null) setWeight(suggestedWeight);
    if (suggestedReps !== null) setReps(suggestedReps);
    setSuggestionAccepted(true);
  };

  // Calculate responsive font size for exercise name to fit up to 2 lines
  useEffect(() => {
    const calculateFontSize = () => {
      const nameElement = exerciseNameRef.current;
      if (!nameElement || !exerciseName) return;

      // Get the container width (accounting for padding)
      const container = nameElement.parentElement;
      if (!container) return;
      
      const containerWidth = container.clientWidth;
      const paddingX = window.innerWidth < 600 ? 32 : 64; // xs: 2rem, sm: 4rem
      const availableWidth = containerWidth - (paddingX * 2);
      
      if (availableWidth <= 0) return;
      
      // Maximum and minimum font sizes
      const maxFontSize = 150;
      const minFontSize = 32;
      const maxLines = 2;
      
      // Split text at word boundaries for optimal line distribution
      const words = exerciseName.split(' ');
      let bestLayout = exerciseName;
      
      if (words.length > 1) {
        // Try to find the best split point for balanced line lengths
        let bestDiff = Infinity;
        
        for (let i = 1; i < words.length; i++) {
          const line1 = words.slice(0, i).join(' ');
          const line2 = words.slice(i).join(' ');
          const diff = Math.abs(line1.length - line2.length);
          
          if (diff < bestDiff) {
            bestDiff = diff;
            bestLayout = `${line1}\n${line2}`;
          }
        }
      }
      
      // Create a temporary element to measure text dimensions
      const tempElement = document.createElement('div');
      tempElement.style.visibility = 'hidden';
      tempElement.style.position = 'absolute';
      tempElement.style.width = availableWidth + 'px';
      tempElement.style.fontFamily = getComputedStyle(nameElement).fontFamily;
      tempElement.style.fontWeight = '700';
      tempElement.style.lineHeight = '1.2';
      tempElement.style.whiteSpace = 'pre-wrap';
      tempElement.style.textAlign = 'center';
      tempElement.textContent = bestLayout;
      document.body.appendChild(tempElement);
      
      // Binary search for the largest font size that fits in maxLines
      let low = minFontSize;
      let high = maxFontSize;
      let bestSize = minFontSize;
      
      while (low <= high) {
        const mid = Math.floor((low + high) / 2);
        tempElement.style.fontSize = mid + 'px';
        
        const lineHeight = mid * 1.2;
        const elementHeight = tempElement.offsetHeight;
        const lines = Math.ceil(elementHeight / lineHeight);
        
        if (lines <= maxLines) {
          // This size fits, try larger
          bestSize = mid;
          low = mid + 1;
        } else {
          // Too big, try smaller
          high = mid - 1;
        }
      }
      
      document.body.removeChild(tempElement);
      setExerciseFontSize(`${bestSize}px`);
    };

    // Calculate on mount and when exercise changes
    calculateFontSize();
    
    // Recalculate on window resize
    const handleResize = () => calculateFontSize();
    window.addEventListener('resize', handleResize);
    
    // Small delay to ensure DOM is ready
    const timeout = setTimeout(calculateFontSize, 100);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timeout);
    };
  }, [exerciseName]);

  const shouldShowSuggestion = () => {
    return showSuggestions && 
           !setLogged && 
           !suggestionAccepted &&
           (suggestedWeight !== null || suggestedReps !== null);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Box 
      className="exercise-card"
      sx={{ 
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        minHeight: {
          xs: 'calc(100vh - 140px)', // Mobile: close to bottom nav
          sm: 'calc(100vh - 160px)',
        },
        p: { xs: 2, sm: 3 },
      }}
    >
      {/* Top Header Bar - Timer, Step Counter, Set Indicator, Favorite */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        mb: 1.5,
        flexShrink: 0,
      }}>
        {/* Left: Timer */}
        {elapsedTime !== null && (
          <Typography 
            variant="body1" 
            sx={{ 
              fontWeight: 600, 
              fontSize: { xs: '0.9rem', sm: '1.25rem' },
            }}
          >
            {formatTime(elapsedTime)}
          </Typography>
        )}
        
        {/* Right: Set Indicator, Step Counter, Favorite Star */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Chip 
            label={`Set ${setNumber} of ${totalSets}`}
            color="primary"
            size="small"
            sx={{ 
              fontWeight: 600, 
              fontSize: { xs: '0.7rem', sm: '0.85rem' },
            }}
          />
          <Typography 
            variant="body1" 
            sx={{ 
              fontWeight: 600, 
              fontSize: { xs: '0.9rem', sm: '1.25rem' },
            }}
          >
            {currentStep}/{totalSteps}
          </Typography>
          {onToggleFavorite && (
            <IconButton 
              onClick={onToggleFavorite}
              size="small"
              sx={{ 
                color: isFavorite ? 'warning.main' : 'action.active',
                '&:hover': { color: 'warning.main' },
                p: { xs: 0.5, sm: 1 }
              }}
              aria-label="Toggle favorite"
            >
              {isFavorite ? <Star sx={{ fontSize: { xs: 20, sm: 24 } }} /> : <StarBorder sx={{ fontSize: { xs: 20, sm: 24 } }} />}
            </IconButton>
          )}
        </Box>
      </Box>

      {/* Action Icons Row - Help, Skip, Swap on left; End/Save on right */}
      <Box sx={{ 
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 1,
        mb: 2,
        flexShrink: 0,
      }}>
        {/* Left: Help, Skip, Swap Icons */}
        <Box sx={{ display: 'flex', gap: 1 }}>
          <IconButton
            component="a"
            href={`https://www.google.com/search?q=${encodeURIComponent(exerciseName + ' form')}`}
            target="_blank"
            rel="noopener noreferrer"
            sx={{
              minWidth: { xs: '36px', sm: '44px' },
              minHeight: { xs: '36px', sm: '44px' },
              color: 'primary.main',
              border: '2px solid',
              borderColor: 'primary.main',
              borderRadius: '8px',
              '&:hover': {
                backgroundColor: 'rgba(19, 70, 134, 0.08)',
              }
            }}
            aria-label={`Search for ${exerciseName} form guide`}
          >
            <HelpOutline sx={{ fontSize: { xs: 20, sm: 24 } }} />
          </IconButton>
          {onSkip && (
            <IconButton
              onClick={onSkip}
              sx={{
                minWidth: { xs: '36px', sm: '44px' },
                minHeight: { xs: '36px', sm: '44px' },
                color: 'primary.main',
                border: '2px solid',
                borderColor: 'primary.main',
                borderRadius: '8px',
                '&:hover': {
                  backgroundColor: 'rgba(19, 70, 134, 0.08)',
                }
              }}
              aria-label="Skip exercise"
            >
              <SkipNext sx={{ fontSize: { xs: 20, sm: 24 } }} />
            </IconButton>
          )}
          {onSwap && (
            <IconButton
              onClick={onSwap}
              sx={{
                minWidth: { xs: '36px', sm: '44px' },
                minHeight: { xs: '36px', sm: '44px' },
                color: 'primary.main',
                border: '2px solid',
                borderColor: 'primary.main',
                borderRadius: '8px',
                '&:hover': {
                  backgroundColor: 'rgba(19, 70, 134, 0.08)',
                }
              }}
              aria-label="Swap exercise"
            >
              <SwapHoriz sx={{ fontSize: { xs: 20, sm: 24 } }} />
            </IconButton>
          )}
        </Box>
        
        {/* Right: End Workout Controls */}
        <Box sx={{ display: 'flex', gap: 1 }}>
          {showPartialComplete && onPartialComplete && (
            <IconButton
              onClick={onPartialComplete}
              sx={{
                minWidth: { xs: '36px', sm: '44px' },
                minHeight: { xs: '36px', sm: '44px' },
                color: 'rgb(254, 178, 26)',
                border: '2px solid rgb(254, 178, 26)',
                borderRadius: '8px',
                '&:hover': {
                  backgroundColor: 'rgba(254, 178, 26, 0.08)',
                },
              }}
              aria-label="End and save workout"
            >
              <Save sx={{ fontSize: { xs: 20, sm: 24 } }} />
            </IconButton>
          )}
          {onExit && (
            <IconButton
              onClick={onExit}
              sx={{
                minWidth: { xs: '36px', sm: '44px' },
                minHeight: { xs: '36px', sm: '44px' },
                color: 'rgb(237, 63, 39)',
                border: '2px solid rgb(237, 63, 39)',
                borderRadius: '8px',
                '&:hover': {
                  backgroundColor: 'rgba(237, 63, 39, 0.08)',
                },
              }}
              aria-label="End workout without saving"
            >
              <ExitToApp sx={{ fontSize: { xs: 20, sm: 24 } }} />
            </IconButton>
          )}
        </Box>
      </Box>

      {/* Exercise Name - Responsive font size, max 2 lines */}
      <Box sx={{ mb: 2, flexShrink: 0 }}>
        <Typography 
          ref={exerciseNameRef}
          variant="h3" 
          component="h2"
          sx={{ 
            fontWeight: 700,
            fontSize: exerciseFontSize,
            color: 'primary.main',
            textAlign: 'center',
            lineHeight: '1.2 !important',
            px: { xs: 2, sm: 4 },
            wordBreak: 'break-word',
            overflowWrap: 'break-word',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {exerciseName}
        </Typography>
      </Box>

      {/* Demo Image - Shows if available */}
      {demoImage && (
        <Box 
          sx={{ 
            mb: 2,
            flexShrink: 0,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Box
            component="img"
            src={demoImage}
            alt={`${exerciseName} demonstration`}
            sx={{
              maxWidth: '100%',
              maxHeight: { xs: '250px', sm: '350px' },
              width: 'auto',
              height: 'auto',
              borderRadius: 2,
              objectFit: 'contain',
            }}
            loading="lazy"
          />
        </Box>
      )}

      {/* Video Embed - Shows if available and no demo image */}
      {videoUrl && !demoImage && (
        <Box 
          sx={{ 
            position: 'relative',
            paddingBottom: '56.25%', // 16:9 aspect ratio
            height: 0,
            overflow: 'hidden',
            borderRadius: 2,
            mb: 2,
            flexShrink: 0,
          }}
        >
          <iframe
            src={videoUrl}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              border: 'none',
              borderRadius: '8px',
            }}
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </Box>
      )}

      {/* Set Logged Confirmation */}
      {setLogged && (
        <Alert 
          icon={<CheckCircle />}
          severity="success"
          sx={{ mb: 2, flexShrink: 0 }}
        >
          Set logged! Moving to next...
        </Alert>
      )}

      {/* Progressive Overload Suggestion */}
      {shouldShowSuggestion() && (
        <Alert 
          icon={<TrendingUp />}
          severity="info"
          sx={{ 
            mb: 2,
            flexShrink: 0,
            '& .MuiAlert-message': {
              width: '100%',
            }
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
            <Typography variant="body2">
              💡 Try: {suggestedWeight} lbs × {suggestedReps} reps
              {lastWeight && suggestedWeight > lastWeight && ' (↑ weight)'}
              {lastWeight && suggestedWeight === lastWeight && suggestedReps > lastReps && ' (↑ reps)'}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button 
                size="small" 
                onClick={handleAcceptSuggestion}
                variant="contained"
              >
                Accept
              </Button>
              <Button 
                size="small" 
                onClick={() => setSuggestionAccepted(true)}
                variant="outlined"
              >
                Skip
              </Button>
            </Box>
          </Box>
        </Alert>
      )}

      {/* Flexible spacer to push content to top and bottom */}
      <Box sx={{ flex: 1, minHeight: { xs: '20px', sm: '40px' } }} />

      {/* Input Form - anchored near bottom */}
      <Box component="form" onSubmit={handleSubmit} sx={{ flexShrink: 0 }}>
        <Box sx={{ mb: 3 }}>
          <ExerciseInputs
            weight={weight}
            reps={reps}
            lastWeight={lastWeight}
            lastReps={lastReps}
            onWeightChange={setWeight}
            onRepsChange={setReps}
            disabled={setLogged}
          />
        </Box>

        {/* Navigation Buttons */}
        <Stack direction="row" spacing={2}>
          {showBack && (
            <Button
              type="button"
              variant="outlined"
              onClick={onBack}
              disabled={setLogged}
              startIcon={<ArrowBack />}
              sx={{ minHeight: '44px' }}
            >
              Back
            </Button>
          )}
          <Button
            type="submit"
            variant="contained"
            fullWidth={!showBack}
            disabled={setLogged}
            endIcon={<ArrowForward />}
            sx={{ minHeight: '44px' }}
          >
            {setLogged ? 'Logging...' : 'Next'}
          </Button>
        </Stack>
      </Box>
    </Box>
  );
});

ExerciseCard.displayName = 'ExerciseCard';

ExerciseCard.propTypes = {
  exerciseName: PropTypes.string.isRequired,
  setNumber: PropTypes.number.isRequired,
  totalSets: PropTypes.number.isRequired,
  videoUrl: PropTypes.string,
  demoImage: PropTypes.string,
  lastWeight: PropTypes.number,
  lastReps: PropTypes.number,
  onSubmit: PropTypes.func.isRequired,
  onBack: PropTypes.func,
  showBack: PropTypes.bool,
  suggestedWeight: PropTypes.number,
  suggestedReps: PropTypes.number,
  showSuggestions: PropTypes.bool,
  // New props
  elapsedTime: PropTypes.number,
  currentStep: PropTypes.number,
  totalSteps: PropTypes.number,
  isFavorite: PropTypes.bool,
  onToggleFavorite: PropTypes.func,
  onSkip: PropTypes.func,
  onSwap: PropTypes.func,
  onPartialComplete: PropTypes.func,
  onExit: PropTypes.func,
  showPartialComplete: PropTypes.bool,
};

export default ExerciseCard;
