import PropTypes from 'prop-types';
import { Box, Typography, IconButton } from '@mui/material';
import { ChevronLeft, ChevronRight } from '@mui/icons-material';

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
  sx = {},
}) => {
  const currentIndex = options.findIndex(opt => 
    typeof opt === 'object' ? opt.value === value : opt === value
  );

  const handlePrevious = () => {
    if (disabled) return;
    const newIndex = currentIndex > 0 ? currentIndex - 1 : options.length - 1;
    const newValue = typeof options[newIndex] === 'object' 
      ? options[newIndex].value 
      : options[newIndex];
    onChange(newValue);
  };

  const handleNext = () => {
    if (disabled) return;
    const newIndex = currentIndex < options.length - 1 ? currentIndex + 1 : 0;
    const newValue = typeof options[newIndex] === 'object' 
      ? options[newIndex].value 
      : options[newIndex];
    onChange(newValue);
  };

  const displayValue = formatValue 
    ? formatValue(value) 
    : (typeof options[currentIndex] === 'object' 
      ? options[currentIndex]?.label 
      : options[currentIndex]);

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
          size="medium"
          sx={{
            color: 'primary.main',
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 1,
            '&:hover': {
              bgcolor: 'action.hover',
            },
            '&.Mui-disabled': {
              color: 'action.disabled',
              borderColor: 'action.disabledBackground',
            },
          }}
        >
          <ChevronLeft />
        </IconButton>
        
        <Typography
          variant="h6"
          sx={{
            minWidth: '100px',
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
          size="medium"
          sx={{
            color: 'primary.main',
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 1,
            '&:hover': {
              bgcolor: 'action.hover',
            },
            '&.Mui-disabled': {
              color: 'action.disabled',
              borderColor: 'action.disabledBackground',
            },
          }}
        >
          <ChevronRight />
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
  sx: PropTypes.object,
};

export default DialPicker;
