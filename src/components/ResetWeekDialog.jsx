import { useState } from 'react';
import PropTypes from 'prop-types';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  RadioGroup,
  FormControlLabel,
  Radio,
  Box,
  Alert,
} from '@mui/material';
import { RestartAlt } from '@mui/icons-material';

/**
 * ResetWeekDialog - Dialog for resetting the weekly schedule cycle
 * Allows user to choose between week 0 or week 1
 */
const ResetWeekDialog = ({ open, onClose, onConfirm }) => {
  const [selectedWeek, setSelectedWeek] = useState('1');

  const handleConfirm = () => {
    onConfirm(parseInt(selectedWeek, 10));
    onClose();
  };

  const handleClose = () => {
    setSelectedWeek('1'); // Reset to default
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <RestartAlt color="primary" />
        Reset Week Counter
      </DialogTitle>
      <DialogContent>
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="text.secondary" paragraph>
            Choose which week to reset your schedule to. This will set a new starting point 
            for your weekly workout cycle.
          </Typography>
          <Alert severity="info" sx={{ mb: 2 }}>
            The week counter follows a Sunday to Saturday cycle, incrementing each Sunday.
          </Alert>
        </Box>

        <RadioGroup
          value={selectedWeek}
          onChange={(e) => setSelectedWeek(e.target.value)}
        >
          <FormControlLabel
            value="0"
            control={<Radio />}
            label={
              <Box>
                <Typography variant="body1" fontWeight={600}>
                  Week 0
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Start from week 0. Useful if you want to begin your training cycle before week 1.
                </Typography>
              </Box>
            }
            sx={{ mb: 1, alignItems: 'flex-start' }}
          />
          <FormControlLabel
            value="1"
            control={<Radio />}
            label={
              <Box>
                <Typography variant="body1" fontWeight={600}>
                  Week 1
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Start from week 1. This is the standard starting point for most training programs.
                </Typography>
              </Box>
            }
            sx={{ alignItems: 'flex-start' }}
          />
        </RadioGroup>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} color="inherit">
          Cancel
        </Button>
        <Button 
          onClick={handleConfirm} 
          variant="contained" 
          color="primary"
          startIcon={<RestartAlt />}
        >
          Reset to Week {selectedWeek}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

ResetWeekDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
};

export default ResetWeekDialog;
