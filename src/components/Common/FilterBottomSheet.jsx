/**
 * FilterBottomSheet - A bottom sheet modal for filtering exercises
 * 
 * Used for:
 * - Equipment filter selection
 * - Muscle group filter selection
 * 
 * Minimalist design with chips/buttons for selection
 */

import PropTypes from 'prop-types';
import { Box, Chip, Typography, Button, Stack } from '@mui/material';
import { Check } from '@mui/icons-material';
import BottomSheet from './BottomSheet';

const FilterBottomSheet = ({
  open,
  onClose,
  title,
  options = [],
  selectedValue,
  onSelect,
  multiSelect = false,
  showClearButton = true,
}) => {
  const handleSelect = (value) => {
    if (multiSelect) {
      const currentSelected = Array.isArray(selectedValue) ? selectedValue : [];
      const newSelected = currentSelected.includes(value)
        ? currentSelected.filter(v => v !== value)
        : [...currentSelected, value];
      onSelect(newSelected);
    } else {
      onSelect(value);
      onClose();
    }
  };

  const handleClear = () => {
    onSelect(multiSelect ? [] : 'all');
    if (!multiSelect) {
      onClose();
    }
  };

  const handleApply = () => {
    onClose();
  };

  const isSelected = (value) => {
    if (multiSelect) {
      return Array.isArray(selectedValue) && selectedValue.includes(value);
    }
    return selectedValue === value;
  };

  const hasSelection = multiSelect 
    ? (Array.isArray(selectedValue) && selectedValue.length > 0)
    : (selectedValue && selectedValue !== 'all');

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title={title}
      maxHeight="60vh"
    >
      <Box sx={{ pb: 2 }}>
        {/* Filter Options */}
        <Box
          sx={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 1,
          }}
        >
          {options.map((option) => {
            const value = typeof option === 'string' ? option : option.value;
            const label = typeof option === 'string' ? option : option.label;
            const selected = isSelected(value);
            
            return (
              <Chip
                key={value}
                label={label}
                onClick={() => handleSelect(value)}
                icon={selected ? <Check sx={{ fontSize: 16 }} /> : undefined}
                sx={{
                  px: 0.5,
                  py: 2,
                  fontSize: '0.9rem',
                  fontWeight: selected ? 600 : 400,
                  bgcolor: selected ? 'primary.main' : 'background.default',
                  color: selected ? 'white' : 'text.primary',
                  border: '1px solid',
                  borderColor: selected ? 'primary.main' : 'divider',
                  '&:hover': {
                    bgcolor: selected ? 'primary.dark' : 'action.hover',
                  },
                  '& .MuiChip-icon': {
                    color: 'white',
                    ml: 0.5,
                  },
                }}
              />
            );
          })}
        </Box>

        {/* Action Buttons */}
        <Stack
          direction="row"
          spacing={1}
          sx={{ mt: 3 }}
        >
          {showClearButton && hasSelection && (
            <Button
              variant="outlined"
              onClick={handleClear}
              sx={{ flex: 1 }}
            >
              Clear
            </Button>
          )}
          {multiSelect && (
            <Button
              variant="contained"
              onClick={handleApply}
              sx={{ flex: 1 }}
            >
              Apply
            </Button>
          )}
        </Stack>
      </Box>
    </BottomSheet>
  );
};

FilterBottomSheet.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  title: PropTypes.string.isRequired,
  options: PropTypes.arrayOf(
    PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.shape({
        value: PropTypes.string.isRequired,
        label: PropTypes.string.isRequired,
      }),
    ])
  ),
  selectedValue: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.arrayOf(PropTypes.string),
  ]),
  onSelect: PropTypes.func.isRequired,
  multiSelect: PropTypes.bool,
  showClearButton: PropTypes.bool,
};

export default FilterBottomSheet;
