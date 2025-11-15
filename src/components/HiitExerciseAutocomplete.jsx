import PropTypes from 'prop-types';
import { Autocomplete, TextField, Box, Typography } from '@mui/material';

/**
 * HiitExerciseAutocomplete - Autocomplete component for HIIT exercise search and selection
 * Supports multi-term search filtering across exercise properties
 */
const HiitExerciseAutocomplete = ({
  value,
  onChange,
  availableExercises,
  label = "Exercise",
  placeholder = "Type to search exercises...",
  size = "small",
  fullWidth = true,
  disabled = false,
  sx = {}
}) => {
  // Filter exercises based on search text (multi-term search)
  const getFilteredOptions = (inputValue) => {
    if (!inputValue) return availableExercises;
    
    const searchTerms = inputValue.toLowerCase().split(' ').filter(term => term.length > 0);
    
    return availableExercises.filter(ex => {
      const searchableText = [
        ex.name,
        ex.muscleGroup
      ].join(' ').toLowerCase();
      
      // All search terms must match
      return searchTerms.every(term => searchableText.includes(term));
    });
  };

  return (
    <Autocomplete
      fullWidth={fullWidth}
      size={size}
      options={availableExercises}
      value={value}
      onChange={onChange}
      disabled={disabled}
      getOptionLabel={(option) => {
        if (typeof option === 'string') return option;
        return option?.name || '';
      }}
      filterOptions={(options, state) => {
        return getFilteredOptions(state.inputValue);
      }}
      isOptionEqualToValue={(option, value) => {
        if (typeof option === 'string' && typeof value === 'string') {
          return option === value;
        }
        return option?.name === value?.name;
      }}
      freeSolo
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          placeholder={placeholder}
        />
      )}
      renderOption={(props, option) => {
        const { key, ...otherProps } = props;
        return (
          <li key={key} {...otherProps}>
            <Box>
              <Typography variant="body2">
                {option.name}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {option.muscleGroup}
              </Typography>
            </Box>
          </li>
        );
      }}
      noOptionsText="No exercises found. Try different search terms."
      sx={sx}
    />
  );
};

HiitExerciseAutocomplete.propTypes = {
  value: PropTypes.oneOfType([PropTypes.object, PropTypes.string]),
  onChange: PropTypes.func.isRequired,
  availableExercises: PropTypes.array.isRequired,
  label: PropTypes.string,
  placeholder: PropTypes.string,
  size: PropTypes.string,
  fullWidth: PropTypes.bool,
  disabled: PropTypes.bool,
  sx: PropTypes.object
};

export default HiitExerciseAutocomplete;
