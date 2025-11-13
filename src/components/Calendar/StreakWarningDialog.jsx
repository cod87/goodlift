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
} from '@mui/material';
import {
  Warning,
  LocalFireDepartment,
} from '@mui/icons-material';

/**
 * StreakWarningDialog - Warning dialog for actions that break workout streak
 * Displays current streak and confirms user wants to proceed
 * Used for skip and defer actions
 */
const StreakWarningDialog = ({ 
  open,
  currentStreak,
  action, // 'skip' or 'defer'
  onConfirm,
  onCancel,
}) => {
  const getActionText = () => {
    switch (action) {
      case 'skip':
        return 'skipping this workout';
      case 'defer':
        return 'deferring this workout';
      default:
        return 'this action';
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onCancel}
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
          <Warning color="warning" fontSize="large" />
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Streak Warning
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Alert severity="warning" sx={{ mb: 2 }}>
          <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
            This action will break your workout streak!
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <LocalFireDepartment color="error" />
            <Typography variant="body2">
              Current streak: <strong>{currentStreak} day{currentStreak !== 1 ? 's' : ''}</strong>
            </Typography>
          </Box>
        </Alert>

        <Typography variant="body1" sx={{ mb: 2 }}>
          By {getActionText()}, your current consecutive workout streak will be reset to 0.
        </Typography>

        <Typography variant="body2" color="text.secondary">
          Your longest streak record will be preserved for your achievements.
        </Typography>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
        <Button 
          onClick={onCancel}
          variant="outlined"
          color="inherit"
          fullWidth
        >
          Cancel
        </Button>
        <Button 
          onClick={onConfirm}
          variant="contained"
          color="warning"
          fullWidth
        >
          Continue Anyway
        </Button>
      </DialogActions>
    </Dialog>
  );
};

StreakWarningDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  currentStreak: PropTypes.number.isRequired,
  action: PropTypes.oneOf(['skip', 'defer']).isRequired,
  onConfirm: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
};

export default StreakWarningDialog;
