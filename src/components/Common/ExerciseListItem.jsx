/**
 * ExerciseListItem - A minimalist exercise list item component
 * 
 * Displays:
 * - Mini demo image on the left (transparent background)
 * - Exercise name (larger text)
 * - Primary muscle below in smaller text
 * - Selection indicated by colored left bar and right indent
 * - Optional color-coded left bar for superset grouping
 */

import { memo, useState } from 'react';
import PropTypes from 'prop-types';
import { Box, Typography, ListItemButton } from '@mui/material';
import { getDemoImagePath } from '../../utils/exerciseDemoImages';

const ExerciseListItem = memo(({
  exercise,
  selected = false,
  onClick,
  supersetColor = null,
  disabled = false,
}) => {
  const [imageError, setImageError] = useState(false);
  
  const exerciseName = exercise?.['Exercise Name'] || exercise?.name || 'Unknown Exercise';
  const primaryMuscle = exercise?.['Primary Muscle'] || '';
  const secondaryMuscles = exercise?.['Secondary Muscles'] || '';
  const webpFile = exercise?.['Webp File'];
  const svgFile = exercise?.['Svg File'];
  const equipment = exercise?.['Equipment'] || '';
  
  // Get image path using utility (supports webp files and explicit SVG files)
  const imagePath = getDemoImagePath(
    exerciseName,
    true,
    webpFile,
    primaryMuscle,
    secondaryMuscles,
    svgFile
  );

  const handleClick = () => {
    if (!disabled && onClick) {
      onClick(exercise);
    }
  };

  // Determine left bar color (selection takes priority, then superset)
  const leftBarColor = selected ? 'primary.main' : supersetColor;

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
        bgcolor: 'background.paper', // White background
        transition: 'all 0.2s ease',
        // Colored left bar when selected or in superset
        borderLeft: leftBarColor ? '4px solid' : '4px solid transparent',
        borderLeftColor: leftBarColor || 'transparent',
        // Indent to right when selected
        ml: selected ? 1.5 : 0,
        pl: selected ? 1.5 : 1.5,
        '&:hover': {
          bgcolor: 'action.hover',
        },
        '&:active': {
          opacity: 0.8,
        },
      }}
    >
      {/* Demo Image - transparent background */}
      <Box
        sx={{
          width: 56,
          height: 56,
          flexShrink: 0,
          borderRadius: 1,
          overflow: 'hidden',
          bgcolor: 'transparent',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Box
          component="img"
          src={imagePath}
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
    </ListItemButton>
  );
});

ExerciseListItem.displayName = 'ExerciseListItem';

ExerciseListItem.propTypes = {
  exercise: PropTypes.object.isRequired,
  selected: PropTypes.bool,
  onClick: PropTypes.func,
  supersetColor: PropTypes.string,
  disabled: PropTypes.bool,
};

export default ExerciseListItem;
