/**
 * FilterBottomSheet - A bottom sheet modal for filtering exercises
 * 
 * Used for:
 * - Equipment filter selection
 * - Muscle group filter selection
 * 
 * Clean, list-style layout with clear labels and spacing
 */

import PropTypes from 'prop-types';
import { Box, Typography, Button, Stack, List, ListItemButton, ListItemIcon, ListItemText } from '@mui/material';
import { Check, RadioButtonUnchecked, CheckCircle } from '@mui/icons-material';
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
      maxHeight="70vh"
    >
      <Box sx={{ pb: 2 }}>
        {/* Filter Options as List */}
        <List 
          disablePadding
          sx={{
            mx: -2, // Extend to edges of content area
            '& .MuiListItemButton-root': {
              py: 1.5,
              px: 2,
              borderBottom: '1px solid',
              borderColor: 'divider',
              '&:last-child': {
                borderBottom: 'none',
              },
            },
          }}
        >
          {options.map((option) => {
            const value = typeof option === 'string' ? option : option.value;
            const label = typeof option === 'string' ? option : option.label;
            const selected = isSelected(value);
            
            return (
              <ListItemButton
                key={value}
                onClick={() => handleSelect(value)}
                selected={selected}
                sx={{
                  bgcolor: selected ? 'action.selected' : 'transparent',
                  '&.Mui-selected': {
                    bgcolor: 'action.selected',
                    '&:hover': {
                      bgcolor: 'action.selected',
                    },
                  },
                }}
              >
                <ListItemIcon sx={{ minWidth: 40 }}>
                  {selected ? (
                    <CheckCircle color="primary" />
                  ) : (
                    <RadioButtonUnchecked color="disabled" />
                  )}
                </ListItemIcon>
                <ListItemText
                  primary={label}
                  primaryTypographyProps={{
                    fontWeight: selected ? 600 : 400,
                    color: selected ? 'primary.main' : 'text.primary',
                    fontSize: '1rem',
                  }}
                />
              </ListItemButton>
            );
          })}
        </List>

        {/* Action Buttons */}
        <Stack
          direction="row"
          spacing={1}
          sx={{ mt: 3, px: 0 }}
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
