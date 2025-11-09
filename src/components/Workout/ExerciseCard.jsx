import { memo, useState } from 'react';
import PropTypes from 'prop-types';
import { 
  Box, 
  Card,
  CardContent,
  Typography, 
  Button,
  Chip,
  Alert,
  Stack
} from '@mui/material';
import { 
  CheckCircle,
  TrendingUp 
} from '@mui/icons-material';
import ExerciseInputs from './ExerciseInputs';

/**
 * ExerciseCard - Exercise display with inline progressive overload suggestions
 * Shows exercise info, input fields, and inline progression suggestions
 */
const ExerciseCard = memo(({ 
  exerciseName,
  setNumber,
  totalSets,
  videoUrl,
  lastWeight = null,
  lastReps = null,
  onSubmit,
  onBack,
  showBack = false,
  suggestedWeight = null,
  suggestedReps = null,
  showSuggestions = true,
}) => {
  const [weight, setWeight] = useState(lastWeight || '');
  const [reps, setReps] = useState(lastReps || '');
  const [setLogged, setSetLogged] = useState(false);
  const [suggestionAccepted, setSuggestionAccepted] = useState(false);

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

  return (
    <Card 
      sx={{ 
        width: '100%',
        maxWidth: '600px',
        margin: '0 auto',
        borderRadius: 3,
        boxShadow: '0 8px 32px rgba(19, 70, 134, 0.12)',
      }}
    >
      <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
        {/* Exercise Header */}
        <Box sx={{ mb: 2 }}>
          <Typography 
            variant="h5" 
            sx={{ 
              fontWeight: 700,
              color: 'text.primary',
              mb: 1,
            }}
          >
            {exerciseName}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Chip 
              label={`Set ${setNumber} of ${totalSets}`}
              color="primary"
              size="small"
            />
          </Box>
        </Box>

        {/* Video Embed */}
        {videoUrl && (
          <Box 
            sx={{ 
              position: 'relative',
              paddingBottom: '56.25%', // 16:9 aspect ratio
              height: 0,
              overflow: 'hidden',
              borderRadius: 2,
              mb: 2,
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
            sx={{ mb: 2 }}
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

        {/* Input Form */}
        <form onSubmit={handleSubmit}>
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
              >
                Back
              </Button>
            )}
            <Button
              type="submit"
              variant="contained"
              fullWidth={!showBack}
              disabled={setLogged}
            >
              {setLogged ? 'Logging...' : 'Next'}
            </Button>
          </Stack>
        </form>
      </CardContent>
    </Card>
  );
});

ExerciseCard.displayName = 'ExerciseCard';

ExerciseCard.propTypes = {
  exerciseName: PropTypes.string.isRequired,
  setNumber: PropTypes.number.isRequired,
  totalSets: PropTypes.number.isRequired,
  videoUrl: PropTypes.string,
  lastWeight: PropTypes.number,
  lastReps: PropTypes.number,
  onSubmit: PropTypes.func.isRequired,
  onBack: PropTypes.func,
  showBack: PropTypes.bool,
  suggestedWeight: PropTypes.number,
  suggestedReps: PropTypes.number,
  showSuggestions: PropTypes.bool,
};

export default ExerciseCard;
