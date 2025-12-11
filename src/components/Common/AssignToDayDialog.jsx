import { useState } from 'react';
import PropTypes from 'prop-types';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Typography,
  Box,
  Chip,
} from '@mui/material';
import { CalendarToday, CheckCircle } from '@mui/icons-material';

/**
 * AssignToDayDialog - Modal for assigning workout to one or multiple days of the week
 * Supports both single-day and multi-day assignment
 */
const AssignToDayDialog = ({ open, onClose, onAssign, workoutData, currentSchedule, allowMultiple = true }) => {
  const [selectedDays, setSelectedDays] = useState([]);

  const daysOfWeek = [
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
  ];

  const handleDaySelect = (day) => {
    if (allowMultiple) {
      setSelectedDays((prev) => {
        if (prev.includes(day)) {
          // Deselect if already selected
          return prev.filter(d => d !== day);
        } else {
          // Add to selection
          return [...prev, day];
        }
      });
    } else {
      // Single select mode
      setSelectedDays([day]);
    }
  };

  const handleConfirm = () => {
    if (selectedDays.length > 0 && onAssign) {
      onAssign(selectedDays, workoutData);
      handleClose();
    }
  };

  const handleClose = () => {
    setSelectedDays([]);
    onClose();
  };

  // Check if a day already has an assignment
  const isDayAssigned = (day) => {
    return currentSchedule && currentSchedule[day] !== null && currentSchedule[day] !== undefined;
  };

  // Get session type display name
  const getSessionTypeDisplay = (sessionType) => {
    if (!sessionType) return '';
    
    const typeMap = {
      'upper': 'Upper Body',
      'lower': 'Lower Body',
      'full': 'Full Body',
      'push': 'Push',
      'pull': 'Pull',
      'legs': 'Legs',
      'cardio': 'Cardio',
      'hiit': 'HIIT',
      'yoga': 'Yoga',
      'mobility': 'Mobility',
      'stretch': 'Stretching',
      'rest': 'Rest',
    };
    
    return typeMap[sessionType.toLowerCase()] || sessionType;
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <CalendarToday color="primary" />
          <Typography variant="h6">Assign to Day of Week</Typography>
        </Box>
      </DialogTitle>
      
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {allowMultiple 
            ? 'Select one or more days to assign this workout. Selected days will show this workout when you visit them.'
            : 'Select which day of the week to assign this workout to. It will be suggested when you visit that day next week.'}
        </Typography>

        <List sx={{ pt: 0 }}>
          {daysOfWeek.map((day) => {
            const isAssigned = isDayAssigned(day);
            const isSelected = selectedDays.includes(day);
            const existingSession = currentSchedule?.[day];

            return (
              <ListItem key={day} disablePadding sx={{ mb: 1 }}>
                <ListItemButton
                  onClick={() => handleDaySelect(day)}
                  selected={isSelected}
                  sx={{
                    borderRadius: 2,
                    border: isSelected ? 2 : 1,
                    borderColor: isSelected ? 'primary.main' : 'divider',
                    '&.Mui-selected': {
                      backgroundColor: 'primary.light',
                      '&:hover': {
                        backgroundColor: 'primary.light',
                      },
                    },
                  }}
                >
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body1" fontWeight={500}>
                          {day}
                        </Typography>
                        {isSelected && <CheckCircle color="primary" fontSize="small" />}
                      </Box>
                    }
                    secondary={
                      isAssigned && existingSession ? (
                        <Chip
                          label={`Currently: ${getSessionTypeDisplay(existingSession.sessionType)}`}
                          size="small"
                          sx={{ mt: 0.5 }}
                          color="info"
                          variant="outlined"
                        />
                      ) : (
                        'Not assigned'
                      )
                    }
                  />
                </ListItemButton>
              </ListItem>
            );
          })}
        </List>
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} color="inherit">
          Cancel
        </Button>
        <Button
          onClick={handleConfirm}
          variant="contained"
          disabled={selectedDays.length === 0}
        >
          Assign to {selectedDays.length === 1 ? selectedDays[0] : `${selectedDays.length} days`}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

AssignToDayDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onAssign: PropTypes.func.isRequired,
  workoutData: PropTypes.object,
  currentSchedule: PropTypes.object,
  allowMultiple: PropTypes.bool,
};

export default AssignToDayDialog;
