import PropTypes from 'prop-types';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
} from '@mui/material';
import { Warning } from '@mui/icons-material';

/**
 * Dialog to confirm guest logout with warning about data loss
 */
const GuestLogoutDialog = ({ open, onClose, onConfirm }) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
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
          <Warning sx={{ color: 'warning.main', fontSize: 28 }} />
          <Typography variant="h6" component="span" sx={{ fontWeight: 600 }}>
            Sign Out as Guest?
          </Typography>
        </Box>
      </DialogTitle>
      
      <DialogContent>
        <Typography variant="body1" sx={{ mb: 2 }}>
          All your workout data, progress, and settings will be permanently deleted if you sign out.
        </Typography>
        <Typography variant="body1" sx={{ fontWeight: 600, color: 'primary.main' }}>
          Want to keep your data? Sign up first to save everything to the cloud!
        </Typography>
      </DialogContent>
      
      <DialogActions sx={{ p: 2, pt: 0 }}>
        <Button
          onClick={onClose}
          variant="outlined"
          sx={{
            borderColor: 'primary.main',
            color: 'primary.main',
          }}
        >
          Cancel
        </Button>
        <Button
          onClick={onConfirm}
          variant="contained"
          color="error"
          sx={{ fontWeight: 600 }}
        >
          Sign Out & Delete Data
        </Button>
      </DialogActions>
    </Dialog>
  );
};

GuestLogoutDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
};

export default GuestLogoutDialog;
