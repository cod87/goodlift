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
  Alert,
  List,
  ListItem,
  ListItemText,
  Chip,
  CircularProgress,
} from '@mui/material';
import {
  Restore,
  AccessTime,
  FitnessCenter,
  Timer,
  DirectionsRun,
  SelfImprovement,
  CalendarMonth,
  Star,
} from '@mui/icons-material';

/**
 * Dialog component for recovering backed-up data
 * Shows backup information and allows user to restore
 */
const RecoverDataDialog = ({ open, onClose, onRecover, backup }) => {
  const [isRecovering, setIsRecovering] = useState(false);
  const [error, setError] = useState(null);

  if (!backup) {
    return null;
  }

  const backupDate = new Date(backup.timestamp);
  const expiresDate = new Date(backup.expiresAt);
  const daysUntilExpiration = Math.ceil((backup.expiresAt - Date.now()) / (1000 * 60 * 60 * 24));
  const isExpiringSoon = daysUntilExpiration <= 7;

  // Count items in backup
  const workoutCount = (backup.data.workoutHistory || []).length;
  const hiitCount = (backup.data.hiitSessions || []).length;
  const cardioCount = (backup.data.cardioSessions || []).length;
  const stretchCount = (backup.data.stretchSessions || []).length;
  const planCount = (backup.data.workoutPlans || []).length;
  const favoriteWorkoutsCount = (backup.data.favoriteWorkouts || []).length;

  const handleRecover = async () => {
    setIsRecovering(true);
    setError(null);
    
    try {
      await onRecover();
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to recover data. Please try again.');
    } finally {
      setIsRecovering(false);
    }
  };

  const handleClose = () => {
    if (!isRecovering) {
      setError(null);
      onClose();
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
        },
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Restore color="primary" />
          <Typography variant="h6" component="span">
            Recover Your Data
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Alert 
          severity={isExpiringSoon ? "warning" : "info"} 
          sx={{ mb: 2 }}
          icon={<AccessTime />}
        >
          <Typography variant="body2">
            <strong>Backup created:</strong> {backupDate.toLocaleString()}
          </Typography>
          <Typography variant="body2">
            <strong>Expires:</strong> {expiresDate.toLocaleDateString()}
            {' '}
            <Chip
              label={`${daysUntilExpiration} day${daysUntilExpiration !== 1 ? 's' : ''} remaining`}
              size="small"
              color={isExpiringSoon ? "warning" : "default"}
              sx={{ ml: 1 }}
            />
          </Typography>
        </Alert>

        <Typography variant="subtitle1" fontWeight={600} gutterBottom>
          Your backup contains:
        </Typography>

        <List dense sx={{ bgcolor: 'background.paper', borderRadius: 1, mb: 2 }}>
          {workoutCount > 0 && (
            <ListItem>
              <FitnessCenter fontSize="small" sx={{ mr: 2, color: 'text.secondary' }} />
              <ListItemText
                primary={`${workoutCount} workout${workoutCount !== 1 ? 's' : ''}`}
              />
            </ListItem>
          )}
          {hiitCount > 0 && (
            <ListItem>
              <Timer fontSize="small" sx={{ mr: 2, color: 'text.secondary' }} />
              <ListItemText
                primary={`${hiitCount} HIIT session${hiitCount !== 1 ? 's' : ''}`}
              />
            </ListItem>
          )}
          {cardioCount > 0 && (
            <ListItem>
              <DirectionsRun fontSize="small" sx={{ mr: 2, color: 'text.secondary' }} />
              <ListItemText
                primary={`${cardioCount} cardio session${cardioCount !== 1 ? 's' : ''}`}
              />
            </ListItem>
          )}
          {stretchCount > 0 && (
            <ListItem>
              <SelfImprovement fontSize="small" sx={{ mr: 2, color: 'text.secondary' }} />
              <ListItemText
                primary={`${stretchCount} stretch session${stretchCount !== 1 ? 's' : ''}`}
              />
            </ListItem>
          )}
          {planCount > 0 && (
            <ListItem>
              <CalendarMonth fontSize="small" sx={{ mr: 2, color: 'text.secondary' }} />
              <ListItemText
                primary={`${planCount} workout plan${planCount !== 1 ? 's' : ''}`}
              />
            </ListItem>
          )}
          {favoriteWorkoutsCount > 0 && (
            <ListItem>
              <Star fontSize="small" sx={{ mr: 2, color: 'text.secondary' }} />
              <ListItemText
                primary={`${favoriteWorkoutsCount} favorite workout${favoriteWorkoutsCount !== 1 ? 's' : ''}`}
              />
            </ListItem>
          )}
          <ListItem>
            <ListItemText
              primary="All statistics and achievements"
              secondary="Including streaks, PRs, and total volume"
            />
          </ListItem>
          <ListItem>
            <ListItemText
              primary="Exercise weights and target reps"
              secondary="Your saved progress tracking data"
            />
          </ListItem>
        </List>

        <Alert severity="warning" sx={{ mb: 2 }}>
          <Typography variant="body2">
            <strong>Warning:</strong> Recovering this backup will replace your current data. 
            Any workouts or progress you&apos;ve logged since the reset will be lost.
          </Typography>
        </Alert>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handleClose} disabled={isRecovering}>
          Cancel
        </Button>
        <Button
          variant="contained"
          color="primary"
          onClick={handleRecover}
          disabled={isRecovering}
          startIcon={isRecovering ? <CircularProgress size={20} /> : <Restore />}
        >
          {isRecovering ? 'Recovering...' : 'Recover Data'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

RecoverDataDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onRecover: PropTypes.func.isRequired,
  backup: PropTypes.shape({
    timestamp: PropTypes.number.isRequired,
    expiresAt: PropTypes.number.isRequired,
    data: PropTypes.object.isRequired,
  }),
};

export default RecoverDataDialog;
