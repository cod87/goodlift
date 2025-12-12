/**
 * WorkoutExerciseCard - A minimalist exercise card for the workout builder
 * 
 * Features (as per design inspiration):
 * - Demo image, exercise name, primary muscle
 * - Note entry field
 * - Sets management with "Add Set" button
 * - Three-dots menu for options (reorder, replace, superset, remove)
 * - Color-coded left bar for superset grouping
 */

import { memo, useState } from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  Typography,
  IconButton,
  TextField,
  Button,
  Paper,
  Stack,
} from '@mui/material';
import {
  MoreVert,
  Add,
  Remove,
} from '@mui/icons-material';
import ExerciseOptionsMenu from './ExerciseOptionsMenu';
import { getSupersetColor } from '../../utils/supersetColors';
import { getDemoImagePath } from '../../utils/exerciseDemoImages';

const WorkoutExerciseCard = memo(({
  exercise,
  index,
  sets = 3,
  reps = 10,
  notes = '',
  onSetsChange,
  onRepsChange,
  onNotesChange,
  onMoveUp,
  onMoveDown,
  onReplace,
  onAddToSuperset,
  onRemove,
  canMoveUp = true,
  canMoveDown = true,
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [imageError, setImageError] = useState(false);
  
  const exerciseName = exercise?.['Exercise Name'] || exercise?.name || 'Unknown Exercise';
  const primaryMuscle = exercise?.['Primary Muscle'] || '';
  const secondaryMuscles = exercise?.['Secondary Muscles'] || '';
  const webpFile = exercise?.['Webp File'];
  const supersetGroup = exercise?.supersetGroup;
  
  // Get image path using utility (supports webp files and custom muscle SVGs)
  const imagePath = getDemoImagePath(
    exerciseName, 
    true, 
    webpFile,
    primaryMuscle,
    secondaryMuscles
  );

  const supersetColor = getSupersetColor(supersetGroup);

  return (
    <>
      <Paper
        elevation={0}
        sx={{
          position: 'relative',
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 2,
          overflow: 'hidden',
          // Superset color bar on left
          '&::before': supersetColor ? {
            content: '""',
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            width: '4px',
            bgcolor: supersetColor,
          } : undefined,
        }}
      >
        <Box sx={{ p: 2, pl: supersetColor ? 2.5 : 2 }}>
          {/* Header: Demo Image, Name, Muscle, Menu Button */}
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, mb: 2 }}>
            {/* Demo Image */}
            <Box
              sx={{
                width: 60,
                height: 60,
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
                src={imageError ? getDemoImagePath(exerciseName, true, null, primaryMuscle, secondaryMuscles) : imagePath}
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
                  color: 'primary.main',
                }}
              >
                {index + 1}. {exerciseName}
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  color: 'text.secondary',
                  fontSize: '0.85rem',
                  mt: 0.25,
                }}
              >
                {primaryMuscle}
              </Typography>
            </Box>
            
            {/* Menu Button */}
            <IconButton
              size="small"
              onClick={() => setMenuOpen(true)}
              sx={{ mt: -0.5, mr: -0.5 }}
            >
              <MoreVert />
            </IconButton>
          </Box>
          
          {/* Notes Field */}
          <TextField
            fullWidth
            size="small"
            placeholder="Add a note..."
            value={notes}
            onChange={(e) => onNotesChange?.(e.target.value)}
            sx={{
              mb: 2,
              '& .MuiOutlinedInput-root': {
                bgcolor: 'background.default',
              },
            }}
          />
          
          {/* Sets/Reps/Rest Controls */}
          <Stack
            direction="row"
            spacing={2}
            alignItems="center"
            justifyContent="space-between"
          >
            {/* Sets */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <IconButton
                size="small"
                onClick={() => onSetsChange?.(Math.max(1, sets - 1))}
                disabled={sets <= 1}
              >
                <Remove fontSize="small" />
              </IconButton>
              <Typography
                sx={{
                  minWidth: 50,
                  textAlign: 'center',
                  fontWeight: 500,
                }}
              >
                {sets} sets
              </Typography>
              <IconButton
                size="small"
                onClick={() => onSetsChange?.(sets + 1)}
              >
                <Add fontSize="small" />
              </IconButton>
            </Box>
            
            {/* Reps */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <IconButton
                size="small"
                onClick={() => onRepsChange?.(Math.max(1, reps - 1))}
                disabled={reps <= 1}
              >
                <Remove fontSize="small" />
              </IconButton>
              <Typography
                sx={{
                  minWidth: 50,
                  textAlign: 'center',
                  fontWeight: 500,
                }}
              >
                {reps} reps
              </Typography>
              <IconButton
                size="small"
                onClick={() => onRepsChange?.(reps + 1)}
              >
                <Add fontSize="small" />
              </IconButton>
            </Box>
          </Stack>
          
          {/* Add Set Button (optional alternative to +/- controls) */}
          <Button
            fullWidth
            variant="outlined"
            startIcon={<Add />}
            onClick={() => onSetsChange?.(sets + 1)}
            sx={{
              mt: 2,
              borderStyle: 'dashed',
              color: 'text.secondary',
              '&:hover': {
                borderStyle: 'dashed',
              },
            }}
          >
            Add Set
          </Button>
        </Box>
      </Paper>
      
      {/* Options Menu */}
      <ExerciseOptionsMenu
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        exerciseName={exerciseName}
        onMoveUp={onMoveUp}
        onMoveDown={onMoveDown}
        onReplace={onReplace}
        onAddToSuperset={onAddToSuperset}
        onRemove={onRemove}
        canMoveUp={canMoveUp}
        canMoveDown={canMoveDown}
      />
    </>
  );
});

WorkoutExerciseCard.displayName = 'WorkoutExerciseCard';

WorkoutExerciseCard.propTypes = {
  exercise: PropTypes.object.isRequired,
  index: PropTypes.number.isRequired,
  sets: PropTypes.number,
  reps: PropTypes.number,
  notes: PropTypes.string,
  onSetsChange: PropTypes.func,
  onRepsChange: PropTypes.func,
  onNotesChange: PropTypes.func,
  onMoveUp: PropTypes.func,
  onMoveDown: PropTypes.func,
  onReplace: PropTypes.func,
  onAddToSuperset: PropTypes.func,
  onRemove: PropTypes.func,
  canMoveUp: PropTypes.bool,
  canMoveDown: PropTypes.bool,
};

export default WorkoutExerciseCard;
