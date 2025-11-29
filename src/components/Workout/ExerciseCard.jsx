import { memo, useState, useEffect } from 'react';
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
  useMediaQuery,
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
import { usePreferences } from '../../contexts/PreferencesContext';

/**
 * Helper function to check if equipment is barbell
 * @param {string} equipment - Equipment type
 * @returns {boolean} True if equipment is barbell
 */
const isBarbell = (equipment) => {
  return equipment?.toLowerCase() === 'barbell';
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
  equipment = null, // Equipment type (e.g., 'Barbell', 'Dumbbell')
}) => {
  const theme = useTheme();
  const { preferences } = usePreferences();
  const [weight, setWeight] = useState(lastWeight || '');
  const [reps, setReps] = useState(lastReps || '');
  const [setLogged, setSetLogged] = useState(false);
  const [suggestionAccepted, setSuggestionAccepted] = useState(false);
  const [imageSrc, setImageSrc] = useState(demoImage);
  const [imageError, setImageError] = useState(false);
  const [workIconError, setWorkIconError] = useState(false);
  
  // Detect landscape orientation on tablets (sm breakpoint and up)
  const isTabletOrLarger = useMediaQuery(theme.breakpoints.up('sm'));
  const isLandscape = useMediaQuery('(orientation: landscape)');
  const shouldUseTwoColumns = isTabletOrLarger && isLandscape;

  // Construct WorkTab Icon URL with robust path handling
  const baseUrl = import.meta.env.BASE_URL || '/';
  const workIconUrl = baseUrl.endsWith('/') ? `${baseUrl}work-icon.svg` : `${baseUrl}/work-icon.svg`;

  // Check if the provided demoImage is a real demo image (not the fallback icon)
  const hasValidDemoImage = (imagePath) => {
    if (!imagePath) return false;
    // If the image path contains 'work-icon.svg', it's a fallback, not an actual demo
    return !imagePath.includes('work-icon.svg');
  };

  // Update image source when demoImage prop changes
  // Only use demoImage if it's a valid demo image, not the fallback
  useEffect(() => {
    if (hasValidDemoImage(demoImage)) {
      setImageSrc(demoImage);
    } else {
      setImageSrc(null);
    }
    setImageError(false);
  }, [demoImage]);

  const handleImageError = () => {
    if (!imageError) {
      setImageError(true);
      // Set to null to trigger WorkTab Icon display
      setImageSrc(null);
    }
  };
  
  // Render WorkTab Icon as fallback when no demo image is available
  const renderAvatarFallback = () => {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          height: '100%',
          gap: 1,
        }}
      >
        {!workIconError && (
          <Box
            component="img"
            src={workIconUrl}
            alt="WorkTab Icon"
            onError={() => setWorkIconError(true)}
            sx={{
              width: '100%',
              height: '100%',
              maxWidth: shouldUseTwoColumns ? 200 : 300,
              maxHeight: shouldUseTwoColumns ? 200 : 300,
              objectFit: 'contain',
            }}
          />
        )}
        <Typography
          variant="caption"
          sx={{
            color: 'text.secondary',
            fontSize: { xs: '0.7rem', sm: '0.8rem' },
            fontStyle: 'italic',
          }}
        >
          no demo image available
        </Typography>
      </Box>
    );
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
          sm: shouldUseTwoColumns ? 'calc(100dvh - 120px)' : 'calc(100dvh - 140px)', // Tablet landscape: more compact
          md: 'calc(100dvh - 140px)', // Desktop
        },
        p: { xs: 2, sm: shouldUseTwoColumns ? 1.5 : 3 }, // Reduced padding in landscape
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
        mb: shouldUseTwoColumns ? 0.2 : 0.3,
        flexShrink: 0,
      }}>
        {elapsedTime !== null && (
          <Typography variant="body1" sx={{ fontWeight: 600, fontSize: { xs: '0.9rem', sm: shouldUseTwoColumns ? '1rem' : '1.25rem' } }}>
            {formatTime(elapsedTime)}
          </Typography>
        )}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: shouldUseTwoColumns ? 0.5 : 1 }}>
          <Chip label={`Set ${setNumber} of ${totalSets}`} color="primary" size="small" sx={{ fontWeight: 600, fontSize: { xs: '0.7rem', sm: '0.85rem' } }} />
          <Typography variant="body1" sx={{ fontWeight: 600, fontSize: { xs: '0.9rem', sm: shouldUseTwoColumns ? '1rem' : '1.25rem' } }}>
            {currentStep}/{totalSteps}
          </Typography>
          {onToggleFavorite && (
            <IconButton onClick={onToggleFavorite} size="small" sx={{ color: isFavorite ? 'warning.main' : 'action.active', '&:hover': { color: 'warning.main' }, p: { xs: 0.5, sm: shouldUseTwoColumns ? 0.3 : 1 } }} aria-label="Toggle favorite">
              {isFavorite ? <Star sx={{ fontSize: { xs: 20, sm: shouldUseTwoColumns ? 20 : 24 } }} /> : <StarBorder sx={{ fontSize: { xs: 20, sm: shouldUseTwoColumns ? 20 : 24 } }} />}
            </IconButton>
          )}
        </Box>
      </Box>

      {/* Action Icons Row - Compact in landscape */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: shouldUseTwoColumns ? 0.5 : 1, mb: shouldUseTwoColumns ? 0.2 : 0.3, flexShrink: 0 }}>
        <Box sx={{ display: 'flex', gap: shouldUseTwoColumns ? 0.5 : 1 }}>
          <IconButton component="a" href={`https://www.google.com/search?q=${encodeURIComponent(exerciseName + ' form')}`} target="_blank" rel="noopener noreferrer" sx={{ minWidth: { xs: '36px', sm: shouldUseTwoColumns ? '36px' : '44px' }, minHeight: { xs: '36px', sm: shouldUseTwoColumns ? '36px' : '44px' }, color: 'primary.main', border: '2px solid', borderColor: 'primary.main', borderRadius: '8px', '&:hover': { backgroundColor: theme.palette.mode === 'dark' ? 'rgba(29, 181, 132, 0.08)' : 'rgba(24, 160, 113, 0.08)', } }} aria-label={`Search for ${exerciseName} form guide`}>
            <HelpOutline sx={{ fontSize: { xs: 20, sm: shouldUseTwoColumns ? 18 : 24 } }} />
          </IconButton>
          {onSkip && <IconButton onClick={onSkip} sx={{ minWidth: { xs: '36px', sm: shouldUseTwoColumns ? '36px' : '44px' }, minHeight: { xs: '36px', sm: shouldUseTwoColumns ? '36px' : '44px' }, color: 'primary.main', border: '2px solid', borderColor: 'primary.main', borderRadius: '8px', '&:hover': { backgroundColor: theme.palette.mode === 'dark' ? 'rgba(29, 181, 132, 0.08)' : 'rgba(24, 160, 113, 0.08)', } }} aria-label="Skip exercise"><SkipNext sx={{ fontSize: { xs: 20, sm: shouldUseTwoColumns ? 18 : 24 } }} /></IconButton>}
          {onSwap && <IconButton onClick={onSwap} sx={{ minWidth: { xs: '36px', sm: shouldUseTwoColumns ? '36px' : '44px' }, minHeight: { xs: '36px', sm: shouldUseTwoColumns ? '36px' : '44px' }, color: 'primary.main', border: '2px solid', borderColor: 'primary.main', borderRadius: '8px', '&:hover': { backgroundColor: theme.palette.mode === 'dark' ? 'rgba(29, 181, 132, 0.08)' : 'rgba(24, 160, 113, 0.08)', } }} aria-label="Swap exercise"><SwapHoriz sx={{ fontSize: { xs: 20, sm: shouldUseTwoColumns ? 18 : 24 } }} /></IconButton>}
        </Box>
        <Box sx={{ display: 'flex', gap: shouldUseTwoColumns ? 0.5 : 1 }}>
          {showPartialComplete && onPartialComplete && <IconButton onClick={onPartialComplete} sx={{ minWidth: { xs: '36px', sm: shouldUseTwoColumns ? '36px' : '44px' }, minHeight: { xs: '36px', sm: shouldUseTwoColumns ? '36px' : '44px' }, color: 'warning.main', border: '2px solid', borderColor: 'warning.main', borderRadius: '8px', '&:hover': { backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 140, 0, 0.08)' : 'rgba(255, 140, 0, 0.08)', }, }} aria-label="End and save workout"><Save sx={{ fontSize: { xs: 20, sm: shouldUseTwoColumns ? 18 : 24 } }} /></IconButton>}
          {onExit && <IconButton onClick={onExit} sx={{ minWidth: { xs: '36px', sm: shouldUseTwoColumns ? '36px' : '44px' }, minHeight: { xs: '36px', sm: shouldUseTwoColumns ? '36px' : '44px' }, color: 'error.main', border: '2px solid', borderColor: 'error.main', borderRadius: '8px', '&:hover': { backgroundColor: theme.palette.mode === 'dark' ? 'rgba(239, 83, 80, 0.08)' : 'rgba(239, 83, 80, 0.08)', }, }} aria-label="End workout without saving"><ExitToApp sx={{ fontSize: { xs: 20, sm: shouldUseTwoColumns ? 18 : 24 } }} /></IconButton>}
        </Box>
      </Box>

      {/* Main Content Area - Two Column Layout in Landscape, Single Column in Portrait */}
      <Box sx={{ 
        flexGrow: 1, 
        flexShrink: 1,
        minHeight: 0,
        // Use CSS Grid for landscape mode for reliable 2:1 split
        display: shouldUseTwoColumns ? 'grid' : 'flex',
        // CSS Grid template: 2fr for name, 1fr for image (2:1 ratio)
        gridTemplateColumns: shouldUseTwoColumns ? '2fr 1fr' : 'none',
        gridTemplateRows: shouldUseTwoColumns ? '1fr' : 'none',
        flexDirection: shouldUseTwoColumns ? undefined : 'column',
        gap: shouldUseTwoColumns ? 0.5 : 0.3,
        mb: 0.3,
      }}>
        {/* Portrait Mode: Exercise Name and Image stacked vertically */}
        {!shouldUseTwoColumns && (
          <Box sx={{ 
            flex: '1 1 auto',
            display: 'flex',
            flexDirection: 'column',
            minHeight: 0,
            gap: 0.3,
          }}>
            {/* Exercise Name */}
            <Box sx={{ flexShrink: 0 }}>
              <Typography 
                component="div"
                sx={{ 
                  fontWeight: '700 !important',
                  color: 'primary.main',
                  textAlign: 'center',
                  lineHeight: '1.2 !important',
                  fontFamily: "'Montserrat', sans-serif !important",
                  fontSize: {
                    xs: '1.25rem !important', // 20px on mobile
                    sm: '1.75rem !important', // 28px on tablet
                    md: '2.5rem !important',  // 40px on desktop
                  },
                  // Limit to max 2 lines with ellipsis
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  wordBreak: 'break-word',
                }}
              >
                {exerciseName}
              </Typography>
            </Box>

            {/* Demo Image or Video or WorkTab Icon Fallback */}
            <Box sx={{ 
              flexGrow: 1, 
              flexShrink: 1, 
              position: 'relative',
              minHeight: 0,
              display: 'flex',
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
              ) : videoUrl ? (
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
              ) : (
                renderAvatarFallback()
              )}
            </Box>
          </Box>
        )}

        {/* Landscape Mode: Two distinct columns - Exercise name (2/3) and Demo image (1/3) */}
        {shouldUseTwoColumns && (
          <>
            {/* Left Column: Exercise Name (2/3 width via CSS Grid) */}
            <Box sx={{ 
              // CSS Grid child - column sizing handled by parent grid
              display: 'flex',
              flexDirection: 'column',
              minHeight: 0,
              justifyContent: 'center',
              overflow: 'hidden',
            }}>
              <Typography 
                component="div"
                sx={{ 
                  fontWeight: '700 !important',
                  color: 'primary.main',
                  textAlign: 'left',
                  lineHeight: '1.05 !important',
                  fontFamily: "'Montserrat', sans-serif !important",
                  fontSize: {
                    sm: '2rem !important', // Slightly smaller in landscape to fit better
                    md: '3rem !important',
                  },
                  // Limit to max 2 lines with ellipsis
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  wordBreak: 'break-word',
                }}
              >
                {exerciseName}
              </Typography>
            </Box>

            {/* Right Column: Demo Image or WorkTab Icon (1/3 width via CSS Grid) */}
            <Box sx={{ 
              // CSS Grid child - column sizing handled by parent grid
              position: 'relative',
              minHeight: 0,
              display: 'flex',
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
              ) : videoUrl ? (
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
              ) : (
                renderAvatarFallback()
              )}
            </Box>
          </>
        )}

        {/* Right Column (or bottom in portrait): Alerts and Inputs - Only show if NOT in two-column mode */}
        {!shouldUseTwoColumns && (
          <Box sx={{ flexShrink: 0 }}>
            {/* Alerts */}
            {setLogged && (
              <Alert icon={<CheckCircle />} severity="success" sx={{ mb: 0.3 }}>
                Set logged! Moving to next...
              </Alert>
            )}
            {shouldShowSuggestion() && (
              <Alert icon={<TrendingUp />} severity="info" sx={{ mb: 0.3, '& .MuiAlert-message': { width: '100%' } }}>
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
            
            {/* Input Form */}
            <Box component="form" onSubmit={handleSubmit}>
              <Box sx={{ mb: 2 }}>
                <ExerciseInputs 
                  weight={weight} 
                  reps={reps} 
                  lastWeight={lastWeight} 
                  lastReps={lastReps} 
                  onWeightChange={setWeight} 
                  onRepsChange={setReps} 
                  disabled={setLogged}
                  isBarbell={isBarbell(equipment)}
                  barbellWeight={preferences.barbellWeight || 45}
                />
              </Box>
              <Stack direction="row" spacing={2}>
                {showBack && <Button type="button" variant="outlined" onClick={onBack} disabled={setLogged} startIcon={<ArrowBack />} sx={{ minHeight: '44px' }}>Back</Button>}
                <Button type="submit" variant="contained" fullWidth={!showBack} disabled={setLogged} endIcon={<ArrowForward />} sx={{ minHeight: '44px' }}>
                  {setLogged ? 'Logging...' : 'Next'}
                </Button>
              </Stack>
            </Box>
          </Box>
        )}
      </Box>

      {/* Alerts and Inputs in Landscape Mode - Displayed below the two columns */}
      {shouldUseTwoColumns && (
        <Box sx={{ flexShrink: 0 }}>
          {/* Alerts */}
          {setLogged && (
            <Alert icon={<CheckCircle />} severity="success" sx={{ mb: 0.2, py: 0.5 }}>
              Set logged! Moving to next...
            </Alert>
          )}
          {shouldShowSuggestion() && (
            <Alert icon={<TrendingUp />} severity="info" sx={{ mb: 0.2, py: 0.5, '& .MuiAlert-message': { width: '100%' } }}>
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
          
          {/* Input Form - Compact layout in landscape */}
          <Box component="form" onSubmit={handleSubmit}>
            <Box sx={{ mb: 1 }}>
              <ExerciseInputs 
                weight={weight} 
                reps={reps} 
                lastWeight={lastWeight} 
                lastReps={lastReps} 
                onWeightChange={setWeight} 
                onRepsChange={setReps} 
                disabled={setLogged}
                isBarbell={isBarbell(equipment)}
                barbellWeight={preferences.barbellWeight || 45}
              />
            </Box>
            <Stack direction="row" spacing={2}>
              {showBack && <Button type="button" variant="outlined" onClick={onBack} disabled={setLogged} startIcon={<ArrowBack />} sx={{ minHeight: '40px' }}>Back</Button>}
              <Button type="submit" variant="contained" fullWidth={!showBack} disabled={setLogged} endIcon={<ArrowForward />} sx={{ minHeight: '40px' }}>
                {setLogged ? 'Logging...' : 'Next'}
              </Button>
            </Stack>
          </Box>
        </Box>
      )}
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
  equipment: PropTypes.string,
};

export default ExerciseCard;
