import PropTypes from 'prop-types';
import { Box, Typography, IconButton } from '@mui/material';
import { ChevronLeft, ChevronRight, Add, Remove } from '@mui/icons-material';

/**
 * DialPicker - A minimalist left/right picker control with arrows
 * 
 * Features:
 * - Simple left/right arrow navigation
 * - Minimal visual clutter
 * - Displays current value with label
 * - Cycles through predefined options
 */
const DialPicker = ({ 
  label, 
  value, 
  options, 
  onChange, 
  disabled = false,
  formatValue,
  minValueWidth = '100px',
  useArrows = false,
  sx = {},
}) => {
  const currentIndex = options.findIndex(opt => 
    typeof opt === 'object' ? opt.value === value : opt === value
  );

  // Helper to extract value from option
  const getValueFromOption = (option) => {
    return typeof option === 'object' ? option.value : option;
  };

  const handlePrevious = () => {
    if (disabled) return;
    // If current value not found, default to last option
    if (currentIndex === -1) {
      onChange(getValueFromOption(options[options.length - 1]));
      return;
    }
    const newIndex = currentIndex > 0 ? currentIndex - 1 : options.length - 1;
    onChange(getValueFromOption(options[newIndex]));
  };

  const handleNext = () => {
    if (disabled) return;
    // If current value not found, default to first option
    if (currentIndex === -1) {
      onChange(getValueFromOption(options[0]));
      return;
    }
    const newIndex = currentIndex < options.length - 1 ? currentIndex + 1 : 0;
    onChange(getValueFromOption(options[newIndex]));
  };

  // Get display value
  const getDisplayValue = () => {
    // If value not found in options, use formatValue or string conversion
    if (currentIndex === -1) {
      return formatValue ? formatValue(value) : String(value);
    }
    
    // If formatValue provided, use it
    if (formatValue) {
      return formatValue(value);
    }
    
    // Otherwise get label from option
    const option = options[currentIndex];
    return typeof option === 'object' ? option.label : option;
  };

  const displayValue = getDisplayValue();

  return (
    <Box sx={{ ...sx }}>
      {label && (
        <Typography 
          variant="subtitle2" 
          gutterBottom
          sx={{ 
            fontWeight: 500,
            color: 'text.primary',
            mb: 1.5,
          }}
        >
          {label}
        </Typography>
      )}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 2,
        }}
      >
        <IconButton
          onClick={handlePrevious}
          disabled={disabled}
          color="primary"
        >
          {useArrows ? <ChevronLeft /> : <Remove />}
        </IconButton>
        
        <Typography
          variant="h6"
          sx={{
            minWidth: minValueWidth,
            textAlign: 'center',
            fontWeight: 500,
            color: disabled ? 'text.disabled' : 'text.primary',
          }}
        >
          {displayValue}
        </Typography>

        <IconButton
          onClick={handleNext}
          disabled={disabled}
          color="primary"
        >
          {useArrows ? <ChevronRight /> : <Add />}
        </IconButton>
      </Box>
    </Box>
  );
};

DialPicker.propTypes = {
  label: PropTypes.string,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.bool]).isRequired,
  options: PropTypes.arrayOf(
    PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.number,
      PropTypes.bool,
      PropTypes.shape({
        label: PropTypes.string.isRequired,
        value: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.bool]).isRequired,
      }),
    ])
  ).isRequired,
  onChange: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
  formatValue: PropTypes.func,
  minValueWidth: PropTypes.string,
  useArrows: PropTypes.bool,
  sx: PropTypes.object,
};

export default DialPicker;
