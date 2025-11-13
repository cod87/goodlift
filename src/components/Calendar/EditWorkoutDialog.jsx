import { useState } from 'react';
import PropTypes from 'prop-types';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  RadioGroup,
  FormControlLabel,
  Radio,
  Alert,
} from '@mui/material';
import { Edit } from '@mui/icons-material';
import { format } from 'date-fns';

/**
 * EditWorkoutDialog - Dialog asking user how to apply workout edits
 * Provides two options:
 * 1. Apply to all recurring sessions (in current training block)
 * 2. Apply to this session only
 */
const EditWorkoutDialog = ({ 
  open,
  date,
  workout,
  recurringCount = 0,
  onClose,
  onEditSingle,
  onEditRecurring,
}) => {
  const [editScope, setEditScope] = useState('recurring');

  const handleConfirm = () => {
    if (editScope === 'recurring') {
      onEditRecurring?.();
    } else {
      onEditSingle?.();
    }
  };

  const getWorkoutTypeDisplay = (workout) => {
    if (!workout) return 'Rest';
    const type = workout.type || workout.workoutType || 'rest';
    return type.charAt(0).toUpperCase() + type.slice(1).replace('_', ' ');
  };

  if (!date || !workout) return null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
        },
      }}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Edit color="primary" />
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Edit Workout
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {getWorkoutTypeDisplay(workout)} - {format(date, 'MMM d, yyyy')}
            </Typography>
          </Box>
        </Box>
      </DialogTitle>

      <DialogContent>
        {recurringCount > 1 && (
          <Alert severity="info" sx={{ mb: 3 }}>
            This workout recurs {recurringCount} times in your current training block.
          </Alert>
        )}

        <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
          How would you like to apply changes?
        </Typography>

        <RadioGroup
          value={editScope}
          onChange={(e) => setEditScope(e.target.value)}
        >
          {recurringCount > 1 && (
            <FormControlLabel
              value="recurring"
              control={<Radio />}
              label={
                <Box>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    All recurring {getWorkoutTypeDisplay(workout)} sessions
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Changes will apply to all {recurringCount} sessions of this type in the current block
                    (until the next deload week)
                  </Typography>
                </Box>
              }
              sx={{ mb: 2, alignItems: 'flex-start' }}
            />
          )}
          <FormControlLabel
            value="single"
            control={<Radio />}
            label={
              <Box>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  This session only
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Changes will only apply to this specific workout on {format(date, 'MMM d')}
                </Typography>
              </Box>
            }
            sx={{ alignItems: 'flex-start' }}
          />
        </RadioGroup>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} color="inherit">
          Cancel
        </Button>
        <Button
          onClick={handleConfirm}
          variant="contained"
          color="primary"
        >
          Continue to Edit
        </Button>
      </DialogActions>
    </Dialog>
  );
};

EditWorkoutDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  date: PropTypes.instanceOf(Date),
  workout: PropTypes.object,
  recurringCount: PropTypes.number,
  onClose: PropTypes.func.isRequired,
  onEditSingle: PropTypes.func,
  onEditRecurring: PropTypes.func,
};

export default EditWorkoutDialog;
