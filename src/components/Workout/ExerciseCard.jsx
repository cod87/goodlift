import { memo, useState } from 'react';
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from '@mui/material';
import { 
  CheckCircle,
  TrendingUp,
  HelpOutline,
  ExitToApp,
  SkipNext,
  SwapHoriz,
  Star,
  StarBorder,
  ArrowBack,
  ArrowForward,
  Add,
  Remove,
} from '@mui/icons-material';
import ExerciseInputs from './ExerciseInputs';
import { usePreferences } from '../../contexts/PreferencesContext';
import { constructImageUrl } from '../../utils/exerciseDemoImages';

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
  image = null, // New: direct image path from exercise.image field
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
  const [imageError, setImageError] = useState(false);
  const [workIconError, setWorkIconError] = useState(false);
  // State for end workout confirmation dialog
  const [endWorkoutDialogOpen, setEndWorkoutDialogOpen] = useState(false);
  
  // Detect landscape orientation on tablets (sm breakpoint and up)
  const isTabletOrLarger = useMediaQuery(theme.breakpoints.up('sm'));
  const isLandscape = useMediaQuery('(orientation: landscape)');
  const shouldUseTwoColumns = isTabletOrLarger && isLandscape;

  // Construct Work Icon URL with robust path handling
  const baseUrl = import.meta.env.BASE_URL || '/';
  const workIconUrl = baseUrl.endsWith('/') ? `${baseUrl}work-icon.svg` : `${baseUrl}/work-icon.svg`;

  // Fixed: Properly construct image URL from the exercise.image field
  // The 'image' prop should contain the raw path from exercises.json (e.g., 'demos/file.webp' or 'svg-muscles/file.svg')
  // constructImageUrl() will prepend the base URL (e.g., '/goodlift/') to create the full path
  const imagePath = image || demoImage;
  const imageSrc = imagePath && !imageError ? constructImageUrl(imagePath) : null;

  const handleImageError = () => {
    // On error, simply set imageError to true which will show the fallback icon
    setImageError(true);
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

  // Handle End Workout button click - show dialog if workout data exists
  const handleEndWorkoutClick = () => {
    if (showPartialComplete) {
      setEndWorkoutDialogOpen(true);
    } else if (onExit) {
      onExit();
    }
  };

  // Handle "End and Save as Partial" from dialog
  const handleDialogPartialComplete = () => {
    setEndWorkoutDialogOpen(false);
    if (onPartialComplete) onPartialComplete();
  };

  // Handle "End Without Saving" from dialog
  const handleDialogExit = () => {
    setEndWorkoutDialogOpen(false);
    if (onExit) onExit();
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
        p: { xs: 2, sm: shouldUseTwoColumns ? 1 : 3 }, // Reduced padding in landscape
        overflow: 'hidden', // Prevent any scrolling
        // Establish this as a container for container query units (cqw, cqi)
        containerType: 'inline-size',
      }}
    >
      {/* LANDSCAPE TABLET: Horizontal layout with action buttons on right */}
      {shouldUseTwoColumns ? (
        <Box sx={{ display: 'flex', flexDirection: 'row', height: '100%', gap: 2 }}>
          {/* Left section: Exercise content */}
          <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
            {/* Top Header Bar */}
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              mb: 1,
              flexShrink: 0,
            }}>
              {elapsedTime !== null && (
                <Typography variant="body1" sx={{ fontWeight: 600, fontSize: '1rem' }}>
                  {formatTime(elapsedTime)}
                </Typography>
              )}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Chip label={`Set ${setNumber}/${totalSets}`} color="primary" size="medium" sx={{ fontWeight: 600, fontSize: '0.85rem' }} />
                <Typography variant="body1" sx={{ fontWeight: 600, fontSize: '1rem' }}>
                  {currentStep}/{totalSteps}
                </Typography>
                {onToggleFavorite && (
                  <IconButton onClick={onToggleFavorite} size="small" sx={{ color: isFavorite ? 'warning.main' : 'action.active', p: 0.5 }} aria-label="Toggle favorite">
                    {isFavorite ? <Star sx={{ fontSize: 22 }} /> : <StarBorder sx={{ fontSize: 22 }} />}
                  </IconButton>
                )}
              </Box>
            </Box>

            {/* Exercise Name and Demo Image - Side by Side with larger image */}
            <Box sx={{ 
              display: 'grid',
              gridTemplateColumns: '1.5fr 1fr',
              gap: 2,
              flex: 1,
              minHeight: 0,
              mb: 1,
            }}>
              {/* Exercise Name */}
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Typography 
                  component="div"
                  sx={{ 
                    fontWeight: '700 !important',
                    color: 'primary.main',
                    textAlign: 'left',
                    lineHeight: '1.15 !important',
                    fontFamily: "'Montserrat', sans-serif !important",
                    fontSize: { sm: '1.75rem !important', md: '2.25rem !important' },
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

              {/* Demo Image - Larger for better visibility */}
              <Box sx={{ 
                width: '100%',
                height: { sm: '150px', md: '180px' },
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                {imageSrc ? (
                  // Render image (webp or SVG file)
                  <Box
                    component="img"
                    src={imageSrc}
                    alt={`${exerciseName} demonstration`}
                    onError={handleImageError}
                    sx={{
                      width: '100%',
                      height: '100%',
                      borderRadius: 1,
                      objectFit: 'contain',
                    }}
                    loading="lazy"
                  />
                ) : videoUrl ? (
                  <iframe
                    src={videoUrl}
                    style={{ width: '100%', height: '100%', border: 'none', borderRadius: '4px' }}
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    title={`${exerciseName} video`}
                  />
                ) : (
                  <Box
                    component="img"
                    src={workIconUrl}
                    alt="Exercise"
                    onError={() => setWorkIconError(true)}
                    sx={{ width: '60%', height: '60%', objectFit: 'contain', opacity: 0.5 }}
                  />
                )}
              </Box>
            </Box>

            {/* Alerts - Compact */}
            {setLogged && (
              <Alert icon={<CheckCircle />} severity="success" sx={{ mb: 0.5, py: 0.25 }}>
                Set logged! Moving to next...
              </Alert>
            )}
            {shouldShowSuggestion() && (
              <Alert icon={<TrendingUp />} severity="info" sx={{ mb: 0.5, py: 0.25, '& .MuiAlert-message': { width: '100%' } }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                  <Typography variant="caption" sx={{ mr: 1 }}>
                    💡 Try: {suggestedWeight} lbs × {suggestedReps} reps
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 0.5 }}>
                    <Button size="small" onClick={handleAcceptSuggestion} variant="contained" sx={{ minHeight: '28px', fontSize: '0.7rem' }}>Accept</Button>
                    <Button size="small" onClick={() => setSuggestionAccepted(true)} variant="outlined" sx={{ minHeight: '28px', fontSize: '0.7rem' }}>Skip</Button>
                  </Box>
                </Box>
              </Alert>
            )}

            {/* Input Form with Target Info - Enhanced for tablet landscape */}
            <Box component="form" onSubmit={handleSubmit} sx={{ flexShrink: 0, mt: 1 }}>
              {/* Weight Row - Enhanced spacing and sizing */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
                <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.secondary', minWidth: '100px', fontSize: '0.95rem' }}>
                  Weight {lastWeight !== null && <span style={{ color: theme.palette.primary.main }}>({lastWeight})</span>}:
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <IconButton 
                    size="medium" 
                    onClick={() => setWeight(Math.max(0, (parseFloat(weight) || 0) - 2.5))}
                    disabled={setLogged}
                    sx={{ border: '2px solid', borderColor: 'divider', width: '40px', height: '40px', minWidth: '40px' }}
                  >
                    <Remove sx={{ fontSize: 20 }} />
                  </IconButton>
                  <TextField 
                    type="number" 
                    value={weight === '' ? '' : weight}
                    onChange={(e) => setWeight(e.target.value)}
                    disabled={setLogged}
                    inputMode="decimal"
                    size="small"
                    sx={{ 
                      width: '80px',
                      '& input': { textAlign: 'center', padding: '10px 6px', fontSize: '1.1rem', fontWeight: 600, MozAppearance: 'textfield', '&::-webkit-outer-spin-button, &::-webkit-inner-spin-button': { WebkitAppearance: 'none', margin: 0 } },
                    }}
                  />
                  <IconButton 
                    size="medium" 
                    onClick={() => setWeight((parseFloat(weight) || 0) + 2.5)}
                    disabled={setLogged}
                    sx={{ border: '2px solid', borderColor: 'divider', width: '40px', height: '40px', minWidth: '40px' }}
                  >
                    <Add sx={{ fontSize: 20 }} />
                  </IconButton>
                </Box>
              </Box>

              {/* Reps Row - Enhanced spacing and sizing */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.secondary', minWidth: '100px', fontSize: '0.95rem' }}>
                  Reps {lastReps !== null && <span style={{ color: theme.palette.primary.main }}>({lastReps})</span>}:
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <IconButton 
                    size="medium" 
                    onClick={() => setReps(Math.max(0, (parseInt(reps) || 0) - 1))}
                    disabled={setLogged}
                    sx={{ border: '2px solid', borderColor: 'divider', width: '40px', height: '40px', minWidth: '40px' }}
                  >
                    <Remove sx={{ fontSize: 20 }} />
                  </IconButton>
                  <TextField 
                    type="number" 
                    value={reps === '' ? '' : reps}
                    onChange={(e) => setReps(e.target.value)}
                    disabled={setLogged}
                    inputMode="numeric"
                    size="small"
                    sx={{ 
                      width: '70px',
                      '& input': { textAlign: 'center', padding: '10px 6px', fontSize: '1.1rem', fontWeight: 600, MozAppearance: 'textfield', '&::-webkit-outer-spin-button, &::-webkit-inner-spin-button': { WebkitAppearance: 'none', margin: 0 } },
                    }}
                  />
                  <IconButton 
                    size="medium" 
                    onClick={() => setReps((parseInt(reps) || 0) + 1)}
                    disabled={setLogged}
                    sx={{ border: '2px solid', borderColor: 'divider', width: '40px', height: '40px', minWidth: '40px' }}
                  >
                    <Add sx={{ fontSize: 20 }} />
                  </IconButton>
                </Box>
              </Box>

              {/* Navigation Buttons - Enhanced size */}
              <Stack direction="row" spacing={1.5}>
                {showBack && <Button type="button" variant="outlined" onClick={onBack} disabled={setLogged} startIcon={<ArrowBack />} sx={{ minHeight: '44px', fontSize: '0.95rem', fontWeight: 600 }}>Back</Button>}
                <Button type="submit" variant="contained" fullWidth={!showBack} disabled={setLogged} endIcon={<ArrowForward />} sx={{ minHeight: '44px', fontSize: '0.95rem', fontWeight: 600 }}>
                  {setLogged ? 'Logging...' : 'Next'}
                </Button>
              </Stack>
            </Box>
          </Box>

          {/* Right Column: Action Buttons - Vertical Stack */}
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            gap: 1,
            justifyContent: 'flex-start',
            pt: 1,
          }}>
            <IconButton 
              component="a" 
              href={`https://www.google.com/search?q=${encodeURIComponent(exerciseName + ' form')}`} 
              target="_blank" 
              rel="noopener noreferrer" 
              sx={{ 
                minWidth: '44px', minHeight: '44px', 
                color: 'primary.main', border: '2px solid', borderColor: 'primary.main', borderRadius: '8px',
                '&:hover': { backgroundColor: theme.palette.mode === 'dark' ? 'rgba(29, 181, 132, 0.08)' : 'rgba(24, 160, 113, 0.08)' }
              }} 
              aria-label={`Search for ${exerciseName} form guide`}
            >
              <HelpOutline sx={{ fontSize: 22 }} />
            </IconButton>
            {onSkip && (
              <IconButton 
                onClick={onSkip} 
                sx={{ 
                  minWidth: '44px', minHeight: '44px', 
                  color: 'primary.main', border: '2px solid', borderColor: 'primary.main', borderRadius: '8px',
                  '&:hover': { backgroundColor: theme.palette.mode === 'dark' ? 'rgba(29, 181, 132, 0.08)' : 'rgba(24, 160, 113, 0.08)' }
                }} 
                aria-label="Skip exercise"
              >
                <SkipNext sx={{ fontSize: 22 }} />
              </IconButton>
            )}
            {onSwap && (
              <IconButton 
                onClick={onSwap} 
                sx={{ 
                  minWidth: '44px', minHeight: '44px', 
                  color: 'primary.main', border: '2px solid', borderColor: 'primary.main', borderRadius: '8px',
                  '&:hover': { backgroundColor: theme.palette.mode === 'dark' ? 'rgba(29, 181, 132, 0.08)' : 'rgba(24, 160, 113, 0.08)' }
                }} 
                aria-label="Swap exercise"
              >
                <SwapHoriz sx={{ fontSize: 22 }} />
              </IconButton>
            )}
            {onExit && (
              <IconButton 
                onClick={handleEndWorkoutClick} 
                sx={{ 
                  minWidth: '44px', minHeight: '44px', 
                  color: 'error.main', border: '2px solid', borderColor: 'error.main', borderRadius: '8px',
                  '&:hover': { backgroundColor: 'rgba(239, 83, 80, 0.08)' },
                  mt: 'auto', // Push to bottom
                }} 
                aria-label="End workout"
              >
                <ExitToApp sx={{ fontSize: 22 }} />
              </IconButton>
            )}
          </Box>
        </Box>
      ) : (
        /* PORTRAIT/MOBILE: Original vertical layout */
        <>
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
              {onExit && (
                <IconButton 
                  onClick={handleEndWorkoutClick} 
                  sx={{ 
                    minWidth: { xs: '36px', sm: '44px' }, 
                    minHeight: { xs: '36px', sm: '44px' }, 
                    color: 'error.main', 
                    border: '2px solid', 
                    borderColor: 'error.main', 
                    borderRadius: '8px', 
                    '&:hover': { 
                      backgroundColor: theme.palette.mode === 'dark' 
                        ? 'rgba(239, 83, 80, 0.08)' 
                        : 'rgba(239, 83, 80, 0.08)', 
                    }, 
                  }} 
                  aria-label="End workout"
                >
                  <ExitToApp sx={{ fontSize: { xs: 20, sm: 24 } }} />
                </IconButton>
              )}
            </Box>
          </Box>
        </>
      )}

      {/* Main Content Area - Only for Portrait/Mobile mode */}
      {!shouldUseTwoColumns && (
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
                // Render image (webp or SVG file)
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

        {/* Portrait Mode: Alerts and Inputs - Only show if NOT in two-column mode */}
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
      )}

      {/* End Workout Confirmation Dialog */}
      <Dialog 
        open={endWorkoutDialogOpen} 
        onClose={() => setEndWorkoutDialogOpen(false)}
        aria-labelledby="end-workout-dialog-title"
      >
        <DialogTitle id="end-workout-dialog-title">End Workout</DialogTitle>
        <DialogContent>
          <Typography>
            How would you like to end this workout?
          </Typography>
        </DialogContent>
        <DialogActions sx={{ flexDirection: 'column', gap: 1, pb: 2, px: 2 }}>
          <Button 
            fullWidth
            variant="contained" 
            color="primary"
            onClick={handleDialogPartialComplete}
            sx={{ minHeight: '44px' }}
          >
            End and Save as Partial
          </Button>
          <Button 
            fullWidth
            variant="outlined" 
            color="error"
            onClick={handleDialogExit}
            sx={{ minHeight: '44px' }}
          >
            End Without Saving
          </Button>
          <Button 
            fullWidth
            variant="text"
            onClick={() => setEndWorkoutDialogOpen(false)}
            sx={{ minHeight: '44px' }}
          >
            Cancel
          </Button>
        </DialogActions>
      </Dialog>
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
  image: PropTypes.string, // New: direct image path from exercise.image field
};

export default ExerciseCard;
