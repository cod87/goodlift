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
  ListItemIcon,
  ListItemText,
  Divider,
  CircularProgress,
  TextField,
} from '@mui/material';
import {
  Warning,
  CheckCircle,
  Cancel,
  FitnessCenter,
  Timer,
  DirectionsRun,
  SelfImprovement,
  CalendarMonth,
  Star,
  PushPin,
} from '@mui/icons-material';

/**
 * Dialog component for confirming data reset
 * Shows user what will be deleted and what will be preserved
 */
const ResetDataDialog = ({ open, onClose, onConfirm, resetInfo }) => {
  const [confirmText, setConfirmText] = useState('');
  const [isResetting, setIsResetting] = useState(false);
  const [error, setError] = useState(null);

  const isConfirmed = confirmText.toLowerCase() === 'reset';

  const handleConfirm = async () => {
    setIsResetting(true);
    setError(null);
    
    try {
      await onConfirm();
      setConfirmText('');
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to reset data. Please try again.');
    } finally {
      setIsResetting(false);
    }
  };

  const handleClose = () => {
    if (!isResetting) {
      setConfirmText('');
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
          <Warning color="warning" />
          <Typography variant="h6" component="span">
            Reset Personal Data
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Alert severity="warning" sx={{ mb: 2 }}>
          This action will delete your workout data and statistics. You will have{' '}
          <strong>30 days</strong> to recover your data if you change your mind.
        </Alert>

        {/* What will be deleted */}
        <Typography variant="subtitle1" fontWeight={600} gutterBottom sx={{ mt: 2 }}>
          <Cancel color="error" sx={{ verticalAlign: 'middle', mr: 0.5 }} />
          The following will be deleted:
        </Typography>
        <List dense sx={{ bgcolor: 'background.paper', borderRadius: 1, mb: 2 }}>
          {resetInfo.totalWorkouts > 0 && (
            <ListItem>
              <ListItemIcon sx={{ minWidth: 40 }}>
                <FitnessCenter fontSize="small" />
              </ListItemIcon>
              <ListItemText
                primary={`${resetInfo.totalWorkouts} workout${resetInfo.totalWorkouts !== 1 ? 's' : ''}`}
                secondary="Complete workout history"
              />
            </ListItem>
          )}
          {resetInfo.totalHiitSessions > 0 && (
            <ListItem>
              <ListItemIcon sx={{ minWidth: 40 }}>
                <Timer fontSize="small" />
              </ListItemIcon>
              <ListItemText
                primary={`${resetInfo.totalHiitSessions} HIIT session${resetInfo.totalHiitSessions !== 1 ? 's' : ''}`}
              />
            </ListItem>
          )}
          {resetInfo.totalCardioSessions > 0 && (
            <ListItem>
              <ListItemIcon sx={{ minWidth: 40 }}>
                <DirectionsRun fontSize="small" />
              </ListItemIcon>
              <ListItemText
                primary={`${resetInfo.totalCardioSessions} cardio session${resetInfo.totalCardioSessions !== 1 ? 's' : ''}`}
              />
            </ListItem>
          )}
          {resetInfo.totalStretchSessions > 0 && (
            <ListItem>
              <ListItemIcon sx={{ minWidth: 40 }}>
                <SelfImprovement fontSize="small" />
              </ListItemIcon>
              <ListItemText
                primary={`${resetInfo.totalStretchSessions} stretch session${resetInfo.totalStretchSessions !== 1 ? 's' : ''}`}
              />
            </ListItem>
          )}
          {resetInfo.totalPlans > 0 && (
            <ListItem>
              <ListItemIcon sx={{ minWidth: 40 }}>
                <CalendarMonth fontSize="small" />
              </ListItemIcon>
              <ListItemText
                primary={`${resetInfo.totalPlans} workout plan${resetInfo.totalPlans !== 1 ? 's' : ''}`}
              />
            </ListItem>
          )}
          {resetInfo.totalFavoriteWorkouts > 0 && (
            <ListItem>
              <ListItemIcon sx={{ minWidth: 40 }}>
                <Star fontSize="small" />
              </ListItemIcon>
              <ListItemText
                primary={`${resetInfo.totalFavoriteWorkouts} favorite workout${resetInfo.totalFavoriteWorkouts !== 1 ? 's' : ''}`}
              />
            </ListItem>
          )}
          {resetInfo.totalPinnedExercises > 0 && (
            <ListItem>
              <ListItemIcon sx={{ minWidth: 40 }}>
                <PushPin fontSize="small" />
              </ListItemIcon>
              <ListItemText
                primary={`${resetInfo.totalPinnedExercises} pinned exercise${resetInfo.totalPinnedExercises !== 1 ? 's' : ''}`}
              />
            </ListItem>
          )}
          <ListItem>
            <ListItemText
              primary="All statistics and achievements"
              secondary="Streaks, PRs, total volume, etc."
            />
          </ListItem>
          <ListItem>
            <ListItemText
              primary="Exercise weights and target reps"
              secondary="Saved progress tracking data"
            />
          </ListItem>
        </List>

        <Divider sx={{ my: 2 }} />

        {/* What will be preserved */}
        <Typography variant="subtitle1" fontWeight={600} gutterBottom>
          <CheckCircle color="success" sx={{ verticalAlign: 'middle', mr: 0.5 }} />
          The following will be preserved:
        </Typography>
        <List dense sx={{ bgcolor: 'background.paper', borderRadius: 1, mb: 2 }}>
          <ListItem>
            <ListItemText primary="Login credentials and authentication" />
          </ListItem>
          <ListItem>
            <ListItemText primary="Profile information (name, email, avatar)" />
          </ListItem>
          <ListItem>
            <ListItemText primary="App preferences and settings" />
          </ListItem>
        </List>

        <Alert severity="info" sx={{ mb: 2 }}>
          Your data will be backed up for 30 days. Use the &quot;Recover Data&quot; option to restore it within this period.
        </Alert>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* Confirmation input */}
        <Box sx={{ mt: 2 }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            To confirm, type <strong>RESET</strong> below:
          </Typography>
          <TextField
            fullWidth
            size="small"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder="Type RESET to confirm"
            disabled={isResetting}
            autoComplete="off"
            sx={{ mt: 1 }}
          />
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handleClose} disabled={isResetting}>
          Cancel
        </Button>
        <Button
          variant="contained"
          color="error"
          onClick={handleConfirm}
          disabled={!isConfirmed || isResetting}
          startIcon={isResetting ? <CircularProgress size={20} /> : null}
        >
          {isResetting ? 'Resetting...' : 'Reset Data'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

ResetDataDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
  resetInfo: PropTypes.shape({
    totalWorkouts: PropTypes.number.isRequired,
    totalHiitSessions: PropTypes.number.isRequired,
    totalCardioSessions: PropTypes.number.isRequired,
    totalStretchSessions: PropTypes.number.isRequired,
    totalPlans: PropTypes.number.isRequired,
    totalFavoriteWorkouts: PropTypes.number.isRequired,
    totalFavoriteExercises: PropTypes.number.isRequired,
    totalPinnedExercises: PropTypes.number.isRequired,
    hasData: PropTypes.bool.isRequired,
  }).isRequired,
};

export default ResetDataDialog;
