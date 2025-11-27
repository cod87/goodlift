import { memo, forwardRef } from 'react';
import PropTypes from 'prop-types';
import { 
  Box, 
  Typography, 
  IconButton,
  TextField,
  Stack
} from '@mui/material';
import { Add, Remove } from '@mui/icons-material';
import { calculateBarbellPerSide } from '../../utils/weightUtils';

/**
 * ExerciseInputs - Compact horizontal weight/reps input layout
 * Stacks weight and reps fields side-by-side with +/- buttons
 * Displays last set info for comparison
 */
const ExerciseInputs = memo(forwardRef(({ 
  weight = '',
  reps = '',
  lastWeight = null,
  lastReps = null,
  onWeightChange,
  onRepsChange,
  weightIncrement = 2.5,
  repsIncrement = 1,
  disabled = false,
  isBarbell = false,
  barbellWeight = 45,
}, ref) => {
  const handleWeightIncrement = (delta) => {
    const currentWeight = parseFloat(weight) || 0;
    const newWeight = Math.max(0, currentWeight + delta);
    onWeightChange(newWeight);
  };

  const handleRepsIncrement = (delta) => {
    const currentReps = parseInt(reps) || 0;
    const newReps = Math.max(0, currentReps + delta);
    onRepsChange(newReps);
  };

  const hasProgressed = () => {
    if (lastWeight === null || lastReps === null) return null;
    const currentWeight = parseFloat(weight) || 0;
    const currentReps = parseInt(reps) || 0;
    
    if (currentWeight > lastWeight) return 'weight';
    if (currentWeight === lastWeight && currentReps > lastReps) return 'reps';
    return null;
  };

  const progression = hasProgressed();

  return (
    <Box sx={{ width: '100%' }}>
      {/* Input Row */}
      <Stack 
        direction="row" 
        spacing={1} 
        sx={{ mb: 1 }}
      >
        {/* Weight Input */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Typography 
            variant="caption" 
            sx={{ 
              fontWeight: 600,
              color: 'text.secondary',
              whiteSpace: 'nowrap',
            }}
          >
            Weight:
          </Typography>
          <IconButton 
            size="small" 
            onClick={() => handleWeightIncrement(-weightIncrement)}
            disabled={disabled}
            sx={{ 
              border: '1px solid',
              borderColor: 'divider',
              width: '28px',
              height: '28px',
              minWidth: '28px',
            }}
          >
            <Remove sx={{ fontSize: 16 }} />
          </IconButton>
          <TextField 
            type="number" 
            value={weight === '' ? '' : weight}
            onChange={(e) => onWeightChange(e.target.value)}
            disabled={disabled}
            inputMode="decimal"
            inputRef={ref}
            size="small"
            sx={{ 
              width: '52px',
              '& input': {
                textAlign: 'center',
                padding: '6px 2px',
                fontSize: '0.9rem',
                fontWeight: 600,
                // Hide native number input spinners
                MozAppearance: 'textfield',
                '&::-webkit-outer-spin-button, &::-webkit-inner-spin-button': {
                  WebkitAppearance: 'none',
                  margin: 0,
                },
              },
            }}
          />
          <IconButton 
            size="small" 
            onClick={() => handleWeightIncrement(weightIncrement)}
            disabled={disabled}
            sx={{ 
              border: '1px solid',
              borderColor: 'divider',
              width: '28px',
              height: '28px',
              minWidth: '28px',
            }}
          >
            <Add sx={{ fontSize: 16 }} />
          </IconButton>
        </Box>

        {/* Reps Input */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Typography 
            variant="caption" 
            sx={{ 
              fontWeight: 600,
              color: 'text.secondary',
              whiteSpace: 'nowrap',
            }}
          >
            Reps:
          </Typography>
          <IconButton 
            size="small" 
            onClick={() => handleRepsIncrement(-repsIncrement)}
            disabled={disabled}
            sx={{ 
              border: '1px solid',
              borderColor: 'divider',
              width: '28px',
              height: '28px',
              minWidth: '28px',
            }}
          >
            <Remove sx={{ fontSize: 16 }} />
          </IconButton>
          <TextField 
            type="number" 
            value={reps === '' ? '' : reps}
            onChange={(e) => onRepsChange(e.target.value)}
            disabled={disabled}
            inputMode="numeric"
            size="small"
            sx={{ 
              width: '44px',
              '& input': {
                textAlign: 'center',
                padding: '6px 2px',
                fontSize: '0.9rem',
                fontWeight: 600,
                // Hide native number input spinners
                MozAppearance: 'textfield',
                '&::-webkit-outer-spin-button, &::-webkit-inner-spin-button': {
                  WebkitAppearance: 'none',
                  margin: 0,
                },
              },
            }}
          />
          <IconButton 
            size="small" 
            onClick={() => handleRepsIncrement(repsIncrement)}
            disabled={disabled}
            sx={{ 
              border: '1px solid',
              borderColor: 'divider',
              width: '28px',
              height: '28px',
              minWidth: '28px',
            }}
          >
            <Add sx={{ fontSize: 16 }} />
          </IconButton>
        </Box>
      </Stack>

      {/* Last Set Comparison */}
      {(lastWeight !== null || lastReps !== null) && (
        <Typography 
          variant="caption" 
          sx={{ 
            color: 'text.secondary',
            display: 'flex',
            alignItems: 'center',
            gap: 0.5,
          }}
        >
          Last: {lastWeight ?? '–'} × {lastReps ?? '–'}
          {progression === 'weight' && (
            <span style={{ color: 'green', fontWeight: 600 }}>↑ Weight</span>
          )}
          {progression === 'reps' && (
            <span style={{ color: 'green', fontWeight: 600 }}>↑ Reps</span>
          )}
        </Typography>
      )}

      {/* Per-side weight for barbell exercises */}
      {isBarbell && weight && parseFloat(weight) > 0 && (
        <Typography 
          variant="caption" 
          sx={{ 
            color: 'text.secondary',
            fontStyle: 'italic',
            display: 'block',
            mt: 0.5,
          }}
        >
          {(() => {
            const perSide = calculateBarbellPerSide(parseFloat(weight), barbellWeight);
            return perSide !== null && perSide >= 0
              ? `${perSide} lbs per side`
              : '';
          })()}
        </Typography>
      )}
    </Box>
  );
}));

ExerciseInputs.displayName = 'ExerciseInputs';

ExerciseInputs.propTypes = {
  weight: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  reps: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  lastWeight: PropTypes.number,
  lastReps: PropTypes.number,
  onWeightChange: PropTypes.func.isRequired,
  onRepsChange: PropTypes.func.isRequired,
  weightIncrement: PropTypes.number,
  repsIncrement: PropTypes.number,
  disabled: PropTypes.bool,
  isBarbell: PropTypes.bool,
  barbellWeight: PropTypes.number,
};

export default ExerciseInputs;
