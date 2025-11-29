/**
 * TargetRepsPicker - A dial picker component for selecting target reps
 * 
 * Only allows the standard rep ranges: 6, 8, 10, 12, 15 (default: 10)
 * Designed for a minimalist, clean UI that matches the app's style
 */

import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  Typography,
  IconButton,
} from '@mui/material';
import {
  Remove,
  Add,
} from '@mui/icons-material';
import { TARGET_REPS_OPTIONS, DEFAULT_TARGET_REPS } from '../../utils/repRangeWeightAdjustment';

/**
 * TargetRepsPicker Component
 * 
 * A dial/stepper component for selecting target reps from predefined options
 * 
 * @param {number} value - Current target reps value
 * @param {function} onChange - Callback when value changes (receives new value)
 * @param {boolean} disabled - Whether the picker is disabled
 * @param {boolean} compact - Whether to use compact styling
 * @param {string} label - Label text to display
 * @param {boolean} showLabel - Whether to show the label
 */
const TargetRepsPicker = ({
  value,
  onChange,
  disabled = false,
  compact = false,
  label = 'Target Reps',
  showLabel = true,
}) => {
  
  // Find current index in options array
  const currentIndex = TARGET_REPS_OPTIONS.indexOf(value);
  const validIndex = currentIndex >= 0 ? currentIndex : TARGET_REPS_OPTIONS.indexOf(DEFAULT_TARGET_REPS);
  
  // Internal state to track the display value
  const [displayValue, setDisplayValue] = useState(
    TARGET_REPS_OPTIONS[validIndex]
  );
  
  // Sync with external value
  useEffect(() => {
    if (TARGET_REPS_OPTIONS.includes(value)) {
      setDisplayValue(value);
    }
  }, [value]);
  
  const handleDecrease = () => {
    const currentIdx = TARGET_REPS_OPTIONS.indexOf(displayValue);
    if (currentIdx > 0) {
      const newValue = TARGET_REPS_OPTIONS[currentIdx - 1];
      setDisplayValue(newValue);
      onChange(newValue);
    }
  };
  
  const handleIncrease = () => {
    const currentIdx = TARGET_REPS_OPTIONS.indexOf(displayValue);
    if (currentIdx < TARGET_REPS_OPTIONS.length - 1) {
      const newValue = TARGET_REPS_OPTIONS[currentIdx + 1];
      setDisplayValue(newValue);
      onChange(newValue);
    }
  };
  
  const canDecrease = TARGET_REPS_OPTIONS.indexOf(displayValue) > 0;
  const canIncrease = TARGET_REPS_OPTIONS.indexOf(displayValue) < TARGET_REPS_OPTIONS.length - 1;
  
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: compact ? 0.25 : 0.5,
      }}
    >
      {showLabel && (
        <Typography
          variant="caption"
          sx={{
            fontWeight: 600,
            color: 'text.secondary',
            fontSize: compact ? '0.65rem' : '0.75rem',
          }}
        >
          {label}
        </Typography>
      )}
      
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: compact ? 0.25 : 0.5,
        }}
      >
        {/* Decrease Button */}
        <IconButton
          size="small"
          onClick={handleDecrease}
          disabled={disabled || !canDecrease}
          sx={{
            border: '1px solid',
            borderColor: disabled || !canDecrease ? 'action.disabled' : 'divider',
            width: compact ? 24 : 28,
            height: compact ? 24 : 28,
            minWidth: compact ? 24 : 28,
            borderRadius: 1,
            '&:hover': {
              bgcolor: 'action.hover',
            },
          }}
        >
          <Remove sx={{ fontSize: compact ? 14 : 16 }} />
        </IconButton>
        
        {/* Value Display */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minWidth: compact ? 36 : 44,
            px: compact ? 0.75 : 1,
            py: compact ? 0.25 : 0.5,
            borderRadius: 1,
            bgcolor: disabled ? 'action.disabledBackground' : 'primary.main',
            color: disabled ? 'action.disabled' : 'white',
          }}
        >
          <Typography
            variant="body2"
            sx={{
              fontWeight: 700,
              fontSize: compact ? '0.85rem' : '1rem',
            }}
          >
            {displayValue}
          </Typography>
        </Box>
        
        {/* Increase Button */}
        <IconButton
          size="small"
          onClick={handleIncrease}
          disabled={disabled || !canIncrease}
          sx={{
            border: '1px solid',
            borderColor: disabled || !canIncrease ? 'action.disabled' : 'divider',
            width: compact ? 24 : 28,
            height: compact ? 24 : 28,
            minWidth: compact ? 24 : 28,
            borderRadius: 1,
            '&:hover': {
              bgcolor: 'action.hover',
            },
          }}
        >
          <Add sx={{ fontSize: compact ? 14 : 16 }} />
        </IconButton>
      </Box>
    </Box>
  );
};

TargetRepsPicker.propTypes = {
  value: PropTypes.number,
  onChange: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
  compact: PropTypes.bool,
  label: PropTypes.string,
  showLabel: PropTypes.bool,
};

export default TargetRepsPicker;
