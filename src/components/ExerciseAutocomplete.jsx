import PropTypes from 'prop-types';
import { Autocomplete, TextField, Box, Typography } from '@mui/material';

/**
 * ExerciseAutocomplete - Reusable autocomplete component for exercise search and selection
 * Supports multi-term search filtering across exercise properties
 */
const ExerciseAutocomplete = ({
  value,
  onChange,
  availableExercises,
  label = "Exercise",
  placeholder = "Type to search and swap exercise...",
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
        ex['Exercise Name'],
        ex['Primary Muscle'],
        ex['Secondary Muscles'],
        ex['Equipment'],
        ex['Movement Pattern'],
        ex['Difficulty'],
        ex['Workout Type']
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
      getOptionLabel={(option) => option['Exercise Name'] || option.name || ''}
      filterOptions={(options, state) => {
        return getFilteredOptions(state.inputValue);
      }}
      isOptionEqualToValue={(option, value) => 
        (option['Exercise Name'] || option.name) === (value['Exercise Name'] || value.name)
      }
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
                {option['Exercise Name']}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {option['Primary Muscle']} • {option['Equipment']}
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

ExerciseAutocomplete.propTypes = {
  value: PropTypes.object,
  onChange: PropTypes.func.isRequired,
  availableExercises: PropTypes.array.isRequired,
  label: PropTypes.string,
  placeholder: PropTypes.string,
  size: PropTypes.string,
  fullWidth: PropTypes.bool,
  disabled: PropTypes.bool,
  sx: PropTypes.object
};

export default ExerciseAutocomplete;
