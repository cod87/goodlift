import PropTypes from 'prop-types';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
} from '@mui/material';
import {
  Edit,
  Delete,
  SkipNext,
  EventAvailable,
  Close,
  FitnessCenter,
} from '@mui/icons-material';
import { format } from 'date-fns';

/**
 * WorkoutDayDialog - Interaction dialog for calendar days with workouts
 * Provides options to:
 * - Edit workout (change type or modify exercises)
 * - Delete workout
 * - Skip workout (with streak warning)
 * - Defer/Move workout to next day (with streak warning)
 */
const WorkoutDayDialog = ({ 
  open,
  date,
  workout,
  onClose,
  onEdit,
  onDelete,
  onSkip,
  onDefer,
}) => {
  if (!date || !workout) return null;

  const getWorkoutTypeDisplay = (workout) => {
    if (!workout) return 'Rest';
    
    // Handle sessions with multiple activities
    if (workout.activities && Array.isArray(workout.activities) && workout.activities.length > 0) {
      const activityTypes = workout.activities.map(a => {
        const type = a.type || 'unknown';
        return type.charAt(0).toUpperCase() + type.slice(1).replace('_', ' ');
      });
      
      // If has strength, show that first
      const hasStrength = workout.activities.some(a => a.type === 'strength');
      if (hasStrength) {
        return 'Strength Training + Yoga + Cardio';
      }
      return activityTypes.join(' + ');
    }
    
    const type = workout.type || workout.workoutType || 'rest';
    return type.charAt(0).toUpperCase() + type.slice(1).replace('_', ' ');
  };

  const getWorkoutDescription = (workout) => {
    if (!workout) return '';
    
    // Handle sessions with multiple activities
    if (workout.activities && Array.isArray(workout.activities)) {
      const descriptions = workout.activities.map(a => {
        if (a.type === 'strength' && a.exercises) {
          return `Strength: ${a.exercises.length} exercises`;
        } else if (a.duration) {
          return `${a.type.charAt(0).toUpperCase() + a.type.slice(1)}: ${a.duration} min`;
        }
        return a.type;
      });
      return descriptions.join(' • ');
    }
    
    // Handle legacy format
    if (workout.exercises && workout.exercises.length > 0) {
      return `${workout.exercises.length} exercises`;
    }
    
    return workout.notes || '';
  };

  const handleAction = (action) => {
    switch (action) {
      case 'edit':
        onEdit?.(date, workout);
        break;
      case 'delete':
        onDelete?.(date, workout);
        break;
      case 'skip':
        onSkip?.(date, workout);
        break;
      case 'defer':
        onDefer?.(date, workout);
        break;
      default:
        break;
    }
  };

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
          <FitnessCenter color="primary" />
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              {getWorkoutTypeDisplay(workout)}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {format(date, 'EEEE, MMMM d, yyyy')}
            </Typography>
            {getWorkoutDescription(workout) && (
              <Typography variant="caption" color="text.secondary">
                {getWorkoutDescription(workout)}
              </Typography>
            )}
          </Box>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ px: 2, py: 1 }}>
        <List sx={{ py: 0 }}>
          <ListItemButton 
            onClick={() => handleAction('edit')}
            sx={{ borderRadius: 2, mb: 1 }}
          >
            <ListItemIcon>
              <Edit color="primary" />
            </ListItemIcon>
            <ListItemText 
              primary="Edit Workout"
              secondary="Change workout type or modify exercises"
            />
          </ListItemButton>

          <Divider sx={{ my: 1 }} />

          <ListItemButton 
            onClick={() => handleAction('skip')}
            sx={{ borderRadius: 2, mb: 1 }}
          >
            <ListItemIcon>
              <SkipNext color="warning" />
            </ListItemIcon>
            <ListItemText 
              primary="Skip Workout"
              secondary="Mark as skipped (may affect streak)"
            />
          </ListItemButton>

          <ListItemButton 
            onClick={() => handleAction('defer')}
            sx={{ borderRadius: 2, mb: 1 }}
          >
            <ListItemIcon>
              <EventAvailable color="info" />
            </ListItemIcon>
            <ListItemText 
              primary="Defer to Tomorrow"
              secondary="Move workout to next day (may affect streak)"
            />
          </ListItemButton>

          <Divider sx={{ my: 1 }} />

          <ListItemButton 
            onClick={() => handleAction('delete')}
            sx={{ borderRadius: 2 }}
          >
            <ListItemIcon>
              <Delete color="error" />
            </ListItemIcon>
            <ListItemText 
              primary="Delete Workout"
              secondary="Remove workout from this day"
            />
          </ListItemButton>
        </List>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button 
          onClick={onClose}
          startIcon={<Close />}
          color="inherit"
        >
          Cancel
        </Button>
      </DialogActions>
    </Dialog>
  );
};

WorkoutDayDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  date: PropTypes.instanceOf(Date),
  workout: PropTypes.object,
  onClose: PropTypes.func.isRequired,
  onEdit: PropTypes.func,
  onDelete: PropTypes.func,
  onSkip: PropTypes.func,
  onDefer: PropTypes.func,
};

export default WorkoutDayDialog;
