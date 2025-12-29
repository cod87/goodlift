/**
 * TargetRepsPicker - A dial picker component for selecting target reps
 * 
 * For weighted exercises: Only allows standard rep ranges: 6, 8, 10, 12, 15 (default: 10)
 * For bodyweight exercises: Allows any positive integer value (freeform input)
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
 * A dial/stepper component for selecting target reps from predefined options (weighted)
 * or freeform input (bodyweight)
 * Styled to match MUI TextField/Select components for visual consistency
 * 
 * @param {number} value - Current target reps value
 * @param {function} onChange - Callback when value changes (receives new value)
 * @param {boolean} disabled - Whether the picker is disabled
 * @param {boolean} compact - Whether to use compact styling
 * @param {string} label - Label text to display
 * @param {boolean} showLabel - Whether to show the label
 * @param {boolean} isBodyweight - Whether this is for a bodyweight exercise (allows freeform input)
 */
const TargetRepsPicker = ({
  value,
  onChange,
  disabled = false,
  compact = false,
  label = 'Reps',
  showLabel = true,
  isBodyweight = false,
}) => {
  
  // For bodyweight exercises, allow any value; for weighted, use predefined options
  const getInitialValue = () => {
    if (isBodyweight) {
      return value || DEFAULT_TARGET_REPS;
    }
    const currentIndex = TARGET_REPS_OPTIONS.indexOf(value);
    const validIndex = currentIndex >= 0 ? currentIndex : TARGET_REPS_OPTIONS.indexOf(DEFAULT_TARGET_REPS);
    return TARGET_REPS_OPTIONS[validIndex];
  };
  
  // Internal state to track the display value
  const [displayValue, setDisplayValue] = useState(getInitialValue());
  const [inputValue, setInputValue] = useState(String(getInitialValue()));
  
  // Sync with external value
  useEffect(() => {
    if (isBodyweight) {
      if (value && value > 0) {
        setDisplayValue(value);
        setInputValue(String(value));
      }
    } else {
      if (TARGET_REPS_OPTIONS.includes(value)) {
        setDisplayValue(value);
        setInputValue(String(value));
      }
    }
  }, [value, isBodyweight]);
  
  const handleDecrease = () => {
    if (isBodyweight) {
      // For bodyweight, decrement by 1 (minimum 1)
      const newValue = Math.max(1, displayValue - 1);
      setDisplayValue(newValue);
      setInputValue(String(newValue));
      onChange(newValue);
    } else {
      // For weighted, use predefined options
      const currentIdx = TARGET_REPS_OPTIONS.indexOf(displayValue);
      if (currentIdx > 0) {
        const newValue = TARGET_REPS_OPTIONS[currentIdx - 1];
        setDisplayValue(newValue);
        setInputValue(String(newValue));
        onChange(newValue);
      }
    }
  };
  
  const handleIncrease = () => {
    if (isBodyweight) {
      // For bodyweight, increment by 1 (no maximum)
      const newValue = displayValue + 1;
      setDisplayValue(newValue);
      setInputValue(String(newValue));
      onChange(newValue);
    } else {
      // For weighted, use predefined options
      const currentIdx = TARGET_REPS_OPTIONS.indexOf(displayValue);
      if (currentIdx < TARGET_REPS_OPTIONS.length - 1) {
        const newValue = TARGET_REPS_OPTIONS[currentIdx + 1];
        setDisplayValue(newValue);
        setInputValue(String(newValue));
        onChange(newValue);
      }
    }
  };
  
  const handleInputChange = (e) => {
    const newValue = e.target.value;
    // Only update the input display, don't call onChange yet
    setInputValue(newValue);
  };
  
  const validateAndApplyValue = (value) => {
    // Shared validation logic for blur and direct input
    if (isBodyweight) {
      const numValue = parseInt(value, 10);
      if (isNaN(numValue) || numValue < 1) {
        // Reset to previous valid value if invalid
        setInputValue(String(displayValue));
        return false;
      } else {
        setDisplayValue(numValue);
        setInputValue(String(numValue));
        onChange(numValue);
        return true;
      }
    }
    return false;
  };
  
  const handleInputBlur = () => {
    // Validate and apply the input value on blur
    validateAndApplyValue(inputValue);
  };
  
  const canDecrease = isBodyweight ? displayValue > 1 : TARGET_REPS_OPTIONS.indexOf(displayValue) > 0;
  const canIncrease = isBodyweight ? true : TARGET_REPS_OPTIONS.indexOf(displayValue) < TARGET_REPS_OPTIONS.length - 1;

  // Use FormControl with OutlinedInput to match MUI Select styling
  // Width: 100-110px provides adequate space for +/- buttons and two-digit numbers
  // Padding: 0.5 horizontal padding gives breathing room between buttons and value
  // minWidth: 28 ensures two-digit numbers (like "15") fit comfortably
  return (
    <FormControl size="small" sx={{ width: compact ? 100 : 110, minWidth: compact ? 100 : 110 }}>
      {showLabel && <InputLabel shrink>{label}</InputLabel>}
      <OutlinedInput
        value={inputValue}
        onChange={handleInputChange}
        onBlur={handleInputBlur}
        readOnly={!isBodyweight}
        disabled={disabled}
        size="small"
        label={showLabel ? label : undefined}
        notched={showLabel}
        sx={{
          // Match MUI Select size="small" height (40px)
          height: 40,
          '& .MuiOutlinedInput-input': {
            textAlign: 'center',
            fontWeight: 400,
            py: 1,
            px: 0.5,
            minWidth: 28,
            cursor: isBodyweight ? 'text' : 'default',
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
  isBodyweight: PropTypes.bool,
};

export default TargetRepsPicker;
