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
  FormControl,
  InputLabel,
  OutlinedInput,
  InputAdornment,
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
 * Styled to match MUI TextField/Select components for visual consistency
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
  label = 'Reps',
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

  // Use FormControl with OutlinedInput to match MUI Select styling
  // Width: 100-110px provides adequate space for +/- buttons and two-digit numbers
  // Padding: 0.5 horizontal padding gives breathing room between buttons and value
  // minWidth: 28 ensures two-digit numbers (like "15") fit comfortably
  return (
    <FormControl size="small" sx={{ width: compact ? 100 : 110, minWidth: compact ? 100 : 110 }}>
      {showLabel && <InputLabel shrink>{label}</InputLabel>}
      <OutlinedInput
        value={displayValue}
        readOnly
        disabled={disabled}
        size="small"
        label={showLabel ? label : undefined}
        notched={showLabel}
        sx={{
          '& .MuiOutlinedInput-input': {
            textAlign: 'center',
            fontWeight: 400,
            py: compact ? 0.75 : 1,
            px: 0.5,
            minWidth: 28,
            cursor: 'default',
          },
        }}
        startAdornment={
          <InputAdornment position="start" sx={{ mr: 0 }}>
            <IconButton
              size="small"
              onClick={handleDecrease}
              disabled={disabled || !canDecrease}
              edge="start"
              sx={{
                p: 0.5,
                color: disabled || !canDecrease ? 'action.disabled' : 'text.secondary',
              }}
            >
              <Remove sx={{ fontSize: compact ? 16 : 18 }} />
            </IconButton>
          </InputAdornment>
        }
        endAdornment={
          <InputAdornment position="end" sx={{ ml: 0 }}>
            <IconButton
              size="small"
              onClick={handleIncrease}
              disabled={disabled || !canIncrease}
              edge="end"
              sx={{
                p: 0.5,
                color: disabled || !canIncrease ? 'action.disabled' : 'text.secondary',
              }}
            >
              <Add sx={{ fontSize: compact ? 16 : 18 }} />
            </IconButton>
          </InputAdornment>
        }
      />
    </FormControl>
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
