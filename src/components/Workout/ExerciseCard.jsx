import { memo, useState, useEffect, useMemo } from 'react';
import PropTypes from 'prop-types';
import { 
  Box, 
  Typography, 
  Button,
  Chip,
  Alert,
  Stack,
  IconButton,
  useTheme,
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
 * Optimally break a heading into two lines with balanced lengths
 * Only breaks at spaces, tries to make lines as even as possible
 * @param {string} text - The text to break
 * @returns {string} Text with '\n' inserted at optimal break point, or original if no good break
 */
const balancedLineBreak = (text) => {
  if (!text || text.length < 15) return text; // Don't break short text
  
  const words = text.split(' ');
  if (words.length < 2) return text; // Can't break single word
  
  let bestBreak = -1;
  let minDiff = Infinity;
  
  // Try breaking after each word and find the most balanced split
  for (let i = 1; i < words.length; i++) {
    const firstLine = words.slice(0, i).join(' ');
    const secondLine = words.slice(i).join(' ');
    const diff = Math.abs(firstLine.length - secondLine.length);
    
    if (diff < minDiff) {
      minDiff = diff;
      bestBreak = i;
    }
  }
  
  if (bestBreak > 0) {
    const firstLine = words.slice(0, bestBreak).join(' ');
    const secondLine = words.slice(bestBreak).join(' ');
    return `${firstLine}\n${secondLine}`;
  }
  
  return text;
};

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
  const theme = useTheme();
  const [weight, setWeight] = useState(lastWeight || '');
  const [reps, setReps] = useState(lastReps || '');
  const [setLogged, setSetLogged] = useState(false);
  const [suggestionAccepted, setSuggestionAccepted] = useState(false);
  const [imageSrc, setImageSrc] = useState(demoImage);
  const [imageError, setImageError] = useState(false);
  
  // Optimally break exercise name into balanced lines
  const balancedExerciseName = useMemo(() => balancedLineBreak(exerciseName), [exerciseName]);

  // Update image source when demoImage prop changes
  useEffect(() => {
    setImageSrc(demoImage);
    setImageError(false);
  }, [demoImage]);

  const handleImageError = () => {
    if (!imageError) {
      setImageError(true);
      // Fall back to placeholder if image fails to load
      const baseUrl = import.meta.env.BASE_URL || '/';
      setImageSrc(`${baseUrl}placeholder-exercise.svg`);
    }
  };

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
        height: {
          xs: 'calc(100dvh - 140px)', // Mobile (Dynamic Viewport Height - header 60px - nav 60px - padding)
          sm: 'calc(100dvh - 140px)', // Tablet
          md: 'calc(100dvh - 140px)', // Desktop
        },
        p: { xs: 2, sm: 3 },
        overflow: 'hidden', // Prevent any scrolling
        // Establish this as a container for container query units (cqw, cqi)
        containerType: 'inline-size',
      }}
    >
      {/* Top Header Bar */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        mb: 0.3,
        flexShrink: 0,
      }}>
        {elapsedTime !== null && (
          <Typography variant="body1" sx={{ fontWeight: 600, fontSize: { xs: '0.9rem', sm: '1.25rem' } }}>
            {formatTime(elapsedTime)}
          </Typography>
        )}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Chip label={`Set ${setNumber} of ${totalSets}`} color="primary" size="small" sx={{ fontWeight: 600, fontSize: { xs: '0.7rem', sm: '0.85rem' } }} />
          <Typography variant="body1" sx={{ fontWeight: 600, fontSize: { xs: '0.9rem', sm: '1.25rem' } }}>
            {currentStep}/{totalSteps}
          </Typography>
          {onToggleFavorite && (
            <IconButton onClick={onToggleFavorite} size="small" sx={{ color: isFavorite ? 'warning.main' : 'action.active', '&:hover': { color: 'warning.main' }, p: { xs: 0.5, sm: 1 } }} aria-label="Toggle favorite">
              {isFavorite ? <Star sx={{ fontSize: { xs: 20, sm: 24 } }} /> : <StarBorder sx={{ fontSize: { xs: 20, sm: 24 } }} />}
            </IconButton>
          )}
        </Box>
      </Box>

      {/* Action Icons Row */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1, mb: 0.3, flexShrink: 0 }}>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <IconButton component="a" href={`https://www.google.com/search?q=${encodeURIComponent(exerciseName + ' form')}`} target="_blank" rel="noopener noreferrer" sx={{ minWidth: { xs: '36px', sm: '44px' }, minHeight: { xs: '36px', sm: '44px' }, color: 'primary.main', border: '2px solid', borderColor: 'primary.main', borderRadius: '8px', '&:hover': { backgroundColor: theme.palette.mode === 'dark' ? 'rgba(29, 181, 132, 0.08)' : 'rgba(24, 160, 113, 0.08)', } }} aria-label={`Search for ${exerciseName} form guide`}>
            <HelpOutline sx={{ fontSize: { xs: 20, sm: 24 } }} />
          </IconButton>
          {onSkip && <IconButton onClick={onSkip} sx={{ minWidth: { xs: '36px', sm: '44px' }, minHeight: { xs: '36px', sm: '44px' }, color: 'primary.main', border: '2px solid', borderColor: 'primary.main', borderRadius: '8px', '&:hover': { backgroundColor: theme.palette.mode === 'dark' ? 'rgba(29, 181, 132, 0.08)' : 'rgba(24, 160, 113, 0.08)', } }} aria-label="Skip exercise"><SkipNext sx={{ fontSize: { xs: 20, sm: 24 } }} /></IconButton>}
          {onSwap && <IconButton onClick={onSwap} sx={{ minWidth: { xs: '36px', sm: '44px' }, minHeight: { xs: '36px', sm: '44px' }, color: 'primary.main', border: '2px solid', borderColor: 'primary.main', borderRadius: '8px', '&:hover': { backgroundColor: theme.palette.mode === 'dark' ? 'rgba(29, 181, 132, 0.08)' : 'rgba(24, 160, 113, 0.08)', } }} aria-label="Swap exercise"><SwapHoriz sx={{ fontSize: { xs: 20, sm: 24 } }} /></IconButton>}
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          {showPartialComplete && onPartialComplete && <IconButton onClick={onPartialComplete} sx={{ minWidth: { xs: '36px', sm: '44px' }, minHeight: { xs: '36px', sm: '44px' }, color: 'warning.main', border: '2px solid', borderColor: 'warning.main', borderRadius: '8px', '&:hover': { backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 140, 0, 0.08)' : 'rgba(255, 140, 0, 0.08)', }, }} aria-label="End and save workout"><Save sx={{ fontSize: { xs: 20, sm: 24 } }} /></IconButton>}
          {onExit && <IconButton onClick={onExit} sx={{ minWidth: { xs: '36px', sm: '44px' }, minHeight: { xs: '36px', sm: '44px' }, color: 'error.main', border: '2px solid', borderColor: 'error.main', borderRadius: '8px', '&:hover': { backgroundColor: theme.palette.mode === 'dark' ? 'rgba(239, 83, 80, 0.08)' : 'rgba(239, 83, 80, 0.08)', }, }} aria-label="End workout without saving"><ExitToApp sx={{ fontSize: { xs: 20, sm: 24 } }} /></IconButton>}
        </Box>
      </Box>

      {/* Exercise Name - Custom Typography with Maximum Control */}
      <Box sx={{ mb: 0.3, flexShrink: 0 }}>
        <Typography 
          component="div"
          sx={{ 
            fontWeight: '700 !important',
            color: 'primary.main',
            textAlign: 'center',
            lineHeight: '1.15 !important',
            fontFamily: "'Montserrat', sans-serif !important",
            // Automatically balance text across lines
            textWrap: 'balance',
            whiteSpace: 'pre-wrap', // Preserve line breaks from JS logic
            // Fluid font size using clamp with container query width (cqw)
            // clamp(MIN, PREFERRED, MAX) - overrides all theme defaults
            fontSize: 'clamp(1.5rem, 16cqw, 5rem) !important',
            // Limit to max 2 lines with ellipsis
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            // Additional specificity overrides
            '&, & *': {
              fontSize: 'clamp(1.5rem, 16cqw, 5rem) !important',
            },
          }}
        >
          {balancedExerciseName}
        </Typography>
      </Box>

      {/* Demo Image or Video - Fills all available space */}
      <Box sx={{ 
        flexGrow: 1, 
        flexShrink: 1, 
        position: 'relative', 
        mb: 0.3, 
        minHeight: 0, // Critical for flexbox child to shrink
        display: 'flex', // Enable flex for better space utilization
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        {imageSrc ? (
          <Box
            component="img"
            src={imageSrc}
            alt={`${exerciseName} demonstration`}
            onError={handleImageError}
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              borderRadius: 2,
              objectFit: 'contain',
            }}
            loading="lazy"
          />
        ) : videoUrl && (
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
            title={`${exerciseName} video`}
          />
        )}
      </Box>

      {/* Alerts */}
      <Box sx={{ flexShrink: 0, mb: 0.3 }}>
        {setLogged && (
          <Alert icon={<CheckCircle />} severity="success">
            Set logged! Moving to next...
          </Alert>
        )}
        {shouldShowSuggestion() && (
          <Alert icon={<TrendingUp />} severity="info" sx={{ '& .MuiAlert-message': { width: '100%' } }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
              <Typography variant="body2" sx={{ mr: 1, flexGrow: 1 }}>
                💡 Try: {suggestedWeight} lbs × {suggestedReps} reps
                {lastWeight != null && suggestedWeight > lastWeight && ' (↑w)'}
                {lastWeight != null && suggestedWeight === lastWeight && suggestedReps > lastReps && ' (↑r)'}
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, flexShrink: 0 }}>
                <Button size="small" onClick={handleAcceptSuggestion} variant="contained">Accept</Button>
                <Button size="small" onClick={() => setSuggestionAccepted(true)} variant="outlined">Skip</Button>
              </Box>
            </Box>
          </Alert>
        )}
      </Box>
      
      {/* Input Form */}
      <Box component="form" onSubmit={handleSubmit} sx={{ flexShrink: 0 }}>
        <Box sx={{ mb: 2 }}>
          <ExerciseInputs weight={weight} reps={reps} lastWeight={lastWeight} lastRps={lastReps} onWeightChange={setWeight} onRepsChange={setReps} disabled={setLogged} />
        </Box>
        <Stack direction="row" spacing={2}>
          {showBack && <Button type="button" variant="outlined" onClick={onBack} disabled={setLogged} startIcon={<ArrowBack />} sx={{ minHeight: '44px' }}>Back</Button>}
          <Button type="submit" variant="contained" fullWidth={!showBack} disabled={setLogged} endIcon={<ArrowForward />} sx={{ minHeight: '44px' }}>
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
