import PropTypes from 'prop-types';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  TextField,
} from '@mui/material';
import { Save, Add, Close } from '@mui/icons-material';
import { useState } from 'react';

/**
 * SaveModifiedWorkoutDialog - Prompts user to save changes to workout
 * Offers options to override existing or save as new
 */
const SaveModifiedWorkoutDialog = ({
  open,
  onClose,
  onOverride,
  onSaveAsNew,
  originalWorkoutName,
  hasExistingWorkout,
}) => {
  const [newWorkoutName, setNewWorkoutName] = useState('');
  const [showNameInput, setShowNameInput] = useState(false);

  const handleSaveAsNew = () => {
    if (showNameInput && newWorkoutName.trim()) {
      onSaveAsNew(newWorkoutName.trim());
      setNewWorkoutName('');
      setShowNameInput(false);
    } else {
      setShowNameInput(true);
    }
  };

  const handleClose = () => {
    setNewWorkoutName('');
    setShowNameInput(false);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Save color="primary" />
        <Typography variant="h6">Save Workout Changes</Typography>
      </DialogTitle>

      <DialogContent>
        <Typography variant="body1" sx={{ mb: 2 }}>
          You've made changes to this workout (swapped exercises or added sets).
          Would you like to save these changes?
        </Typography>

        {showNameInput && (
          <TextField
            fullWidth
            label="New Workout Name"
            value={newWorkoutName}
            onChange={(e) => setNewWorkoutName(e.target.value)}
            placeholder="Enter a name for the new workout"
            autoFocus
            sx={{ mt: 2 }}
          />
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2, gap: 1 }}>
        <Button onClick={handleClose} startIcon={<Close />}>
          Don't Save
        </Button>
        
        {hasExistingWorkout && (
          <Button
            variant="outlined"
            onClick={onOverride}
            startIcon={<Save />}
          >
            Override "{originalWorkoutName}"
          </Button>
        )}
        
        <Button
          variant="contained"
          onClick={handleSaveAsNew}
          startIcon={<Add />}
        >
          {showNameInput ? 'Save' : 'Save as New'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

SaveModifiedWorkoutDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onOverride: PropTypes.func.isRequired,
  onSaveAsNew: PropTypes.func.isRequired,
  originalWorkoutName: PropTypes.string,
  hasExistingWorkout: PropTypes.bool,
};

export default SaveModifiedWorkoutDialog;
