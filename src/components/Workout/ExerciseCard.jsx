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
  useMediaQuery,
  Avatar,
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
import { useUserProfile } from '../../contexts/UserProfileContext';
import { usePreferences } from '../../contexts/PreferencesContext';
import { getPresetAvatarColor, getDoggoAvatarUrl, DOGGO_AVATARS } from '../../utils/avatarUtils';

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
  const { profile, getInitials } = useUserProfile();
  const { preferences } = usePreferences();
  const [weight, setWeight] = useState(lastWeight || '');
  const [reps, setReps] = useState(lastReps || '');
  const [setLogged, setSetLogged] = useState(false);
  const [suggestionAccepted, setSuggestionAccepted] = useState(false);
  const [imageSrc, setImageSrc] = useState(demoImage);
  const [imageError, setImageError] = useState(false);
  
  // Detect landscape orientation on tablets (sm breakpoint and up)
  const isTabletOrLarger = useMediaQuery(theme.breakpoints.up('sm'));
  const isLandscape = useMediaQuery('(orientation: landscape)');
  const shouldUseTwoColumns = isTabletOrLarger && isLandscape;

  // Update image source when demoImage prop changes
  useEffect(() => {
    setImageSrc(demoImage);
    setImageError(false);
  }, [demoImage]);

  const handleImageError = () => {
    if (!imageError) {
      setImageError(true);
      // Instead of falling back to placeholder, we'll use null to trigger avatar display
      setImageSrc(null);
    }
  };
  
  // Get random doggo avatar for guest users - memoized and seeded by exercise name for consistency
  const randomDoggoAvatar = useMemo(() => {
    // Use exercise name to seed a consistent "random" avatar for this exercise
    let hash = 0;
    for (let i = 0; i < exerciseName.length; i++) {
      hash = ((hash << 5) - hash) + exerciseName.charCodeAt(i);
      hash = hash & hash; // Convert to 32-bit integer
    }
    const index = Math.abs(hash) % DOGGO_AVATARS.length;
    return DOGGO_AVATARS[index].url;
  }, [exerciseName]); // Recalculate only when exercise name changes
  
  // Render user avatar or random avatar as fallback
  const renderAvatarFallback = () => {
    let avatarContent = null;
    
    if (profile.avatar) {
      // User has a custom avatar
      if (profile.avatar.startsWith('preset-')) {
        // Preset color avatar with initials
        const color = getPresetAvatarColor(profile.avatar);
        avatarContent = (
          <Avatar
            sx={{
              width: '100%',
              height: '100%',
              maxWidth: 300,
              maxHeight: 300,
              bgcolor: color,
              fontSize: { xs: '3rem', sm: '5rem', md: '6rem' },
              fontWeight: 700,
            }}
          >
            {getInitials()}
          </Avatar>
        );
      } else if (profile.avatar.startsWith('doggo-')) {
        // Doggo avatar
        const avatarUrl = getDoggoAvatarUrl(profile.avatar);
        avatarContent = (
          <Avatar
            src={avatarUrl}
            alt="User avatar"
            sx={{
              width: '100%',
              height: '100%',
              maxWidth: 300,
              maxHeight: 300,
            }}
          />
        );
      } else {
        // Legacy custom URL
        avatarContent = (
          <Avatar
            src={profile.avatar}
            alt="User avatar"
            sx={{
              width: '100%',
              height: '100%',
              maxWidth: 300,
              maxHeight: 300,
            }}
          />
        );
      }
    } else {
      // Guest user - show random doggo avatar
      avatarContent = (
        <Avatar
          src={randomDoggoAvatar}
          alt="Guest avatar"
          sx={{
            width: '100%',
            height: '100%',
            maxWidth: 300,
            maxHeight: 300,
          }}
        />
      );
    }
    
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
        {avatarContent}
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

      {/* Main Content Area - Two Column Layout in Landscape, Single Column in Portrait */}
      <Box sx={{ 
        flexGrow: 1, 
        flexShrink: 1,
        minHeight: 0,
        display: 'flex',
        flexDirection: shouldUseTwoColumns ? 'row' : 'column',
        gap: shouldUseTwoColumns ? 2 : 0.3,
        mb: 0.3,
      }}>
        {/* Left Column (or top in portrait): Exercise Name and Image */}
        <Box sx={{ 
          flex: shouldUseTwoColumns ? '1 1 50%' : '1 1 auto',
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
                textAlign: shouldUseTwoColumns ? 'left' : 'center',
                lineHeight: '1.2 !important',
                fontFamily: "'Montserrat', sans-serif !important",
                // Responsive font sizing
                fontSize: shouldUseTwoColumns ? {
                  sm: '1.5rem !important', // Smaller in landscape to fit
                  md: '2rem !important',
                } : {
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

          {/* Demo Image or Video or Avatar Fallback */}
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
                  isBarbell={equipment?.toLowerCase() === 'barbell'}
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
                isBarbell={equipment?.toLowerCase() === 'barbell'}
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
