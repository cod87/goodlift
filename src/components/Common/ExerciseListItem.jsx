/**
 * ExerciseListItem - A minimalist exercise list item component
 * 
 * Displays:
 * - Mini demo image on the left
 * - Exercise name (larger text)
 * - Primary muscle below in smaller text
 * - Optional selection state with checkmark
 * - Optional color-coded left bar for superset grouping
 */

import { memo, useState } from 'react';
import PropTypes from 'prop-types';
import { Box, Typography, ListItemButton, Checkbox } from '@mui/material';
import { Check } from '@mui/icons-material';

const ExerciseListItem = memo(({
  exercise,
  selected = false,
  onClick,
  showCheckbox = false,
  supersetColor = null,
  disabled = false,
}) => {
  const [imageError, setImageError] = useState(false);
  
  const exerciseName = exercise?.['Exercise Name'] || exercise?.name || 'Unknown Exercise';
  const primaryMuscle = exercise?.['Primary Muscle'] || '';
  const webpFile = exercise?.['Webp File'];
  const equipment = exercise?.['Equipment'] || '';
  
  // Construct image path
  const baseUrl = import.meta.env.BASE_URL || '/';
  const imagePath = webpFile 
    ? `${baseUrl}demos/${webpFile}`
    : `${baseUrl}work-icon.svg`;

  const handleClick = () => {
    if (!disabled && onClick) {
      onClick(exercise);
    }
  };

  return (
    <ListItemButton
      onClick={handleClick}
      disabled={disabled}
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1.5,
        py: 1.5,
        px: 1.5,
        borderRadius: 1,
        position: 'relative',
        bgcolor: selected ? 'action.selected' : 'transparent',
        '&:hover': {
          bgcolor: selected ? 'action.selected' : 'action.hover',
        },
        // Superset color bar on left side
        '&::before': supersetColor ? {
          content: '""',
          position: 'absolute',
          left: 0,
          top: 4,
          bottom: 4,
          width: '4px',
          bgcolor: supersetColor,
          borderRadius: '2px',
        } : undefined,
        pl: supersetColor ? 2.5 : 1.5,
      }}
    >
      {/* Demo Image */}
      <Box
        sx={{
          width: 56,
          height: 56,
          flexShrink: 0,
          borderRadius: 1,
          overflow: 'hidden',
          bgcolor: 'background.default',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Box
          component="img"
          src={imageError ? `${baseUrl}work-icon.svg` : imagePath}
          alt={exerciseName}
          onError={() => setImageError(true)}
          sx={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
          }}
          loading="lazy"
        />
      </Box>
      
      {/* Exercise Info */}
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography
          variant="body1"
          sx={{
            fontWeight: 600,
            fontSize: '1rem',
            lineHeight: 1.3,
            color: 'text.primary',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {exerciseName}
        </Typography>
        <Typography
          variant="body2"
          sx={{
            color: 'text.secondary',
            fontSize: '0.85rem',
            lineHeight: 1.3,
            mt: 0.25,
          }}
        >
          {primaryMuscle}
          {equipment && ` • ${equipment}`}
        </Typography>
      </Box>
      
      {/* Selection Indicator */}
      {showCheckbox && (
        <Checkbox
          checked={selected}
          disabled={disabled}
          icon={<Box sx={{ width: 24, height: 24, border: '2px solid', borderColor: 'divider', borderRadius: '50%' }} />}
          checkedIcon={
            <Box
              sx={{
                width: 24,
                height: 24,
                bgcolor: 'primary.main',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Check sx={{ fontSize: 16, color: 'white' }} />
            </Box>
          }
          sx={{ p: 0, ml: 1 }}
        />
      )}
      
      {/* Simple check for non-checkbox selection */}
      {!showCheckbox && selected && (
        <Box
          sx={{
            width: 24,
            height: 24,
            bgcolor: 'primary.main',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <Check sx={{ fontSize: 16, color: 'white' }} />
        </Box>
      )}
    </ListItemButton>
  );
});

ExerciseListItem.displayName = 'ExerciseListItem';

ExerciseListItem.propTypes = {
  exercise: PropTypes.object.isRequired,
  selected: PropTypes.bool,
  onClick: PropTypes.func,
  showCheckbox: PropTypes.bool,
  supersetColor: PropTypes.string,
  disabled: PropTypes.bool,
};

export default ExerciseListItem;
