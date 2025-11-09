import PropTypes from 'prop-types';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  CircularProgress,
} from '@mui/material';
import { CloudUpload } from '@mui/icons-material';
import { useState } from 'react';
import { getAllGuestData, clearGuestData } from '../utils/guestStorage';
import {
  saveWorkoutHistoryToFirebase,
  saveUserStatsToFirebase,
  saveExerciseWeightsToFirebase,
  saveExerciseTargetRepsToFirebase,
} from '../utils/firebaseStorage';

/**
 * Dialog to migrate guest data to authenticated user account
 */
const GuestDataMigrationDialog = ({ open, onClose, userId }) => {
  const [migrating, setMigrating] = useState(false);
  const [error, setError] = useState(null);

  const handleMigrate = async () => {
    if (!userId) {
      setError('No user ID provided');
      return;
    }

    setMigrating(true);
    setError(null);

    try {
      // Get all guest data
      const guestData = getAllGuestData();
      
      // Migrate each data category to Firebase
      const migrations = [];
      
      if (guestData.workout_history && guestData.workout_history.length > 0) {
        migrations.push(saveWorkoutHistoryToFirebase(userId, guestData.workout_history));
      }
      
      if (guestData.user_stats) {
        migrations.push(saveUserStatsToFirebase(userId, guestData.user_stats));
      }
      
      if (guestData.exercise_weights && Object.keys(guestData.exercise_weights).length > 0) {
        migrations.push(saveExerciseWeightsToFirebase(userId, guestData.exercise_weights));
      }
      
      if (guestData.exercise_target_reps && Object.keys(guestData.exercise_target_reps).length > 0) {
        migrations.push(saveExerciseTargetRepsToFirebase(userId, guestData.exercise_target_reps));
      }

      // Wait for all migrations to complete
      await Promise.all(migrations);

      // Clear guest data after successful migration
      clearGuestData();

      setMigrating(false);
      onClose(true); // Pass true to indicate successful migration
    } catch (err) {
      console.error('Error migrating guest data:', err);
      setError('Failed to migrate data. Please try again.');
      setMigrating(false);
    }
  };

  const handleSkip = () => {
    // Clear guest data without migrating
    clearGuestData();
    onClose(false);
  };

  return (
    <Dialog
      open={open}
      onClose={migrating ? undefined : () => onClose(false)}
      maxWidth="sm"
      fullWidth
      disableEscapeKeyDown={migrating}
      PaperProps={{
        sx: {
          borderRadius: 2,
        },
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <CloudUpload sx={{ color: 'primary.main', fontSize: 28 }} />
          <Typography variant="h6" component="span" sx={{ fontWeight: 600 }}>
            Save Your Guest Data?
          </Typography>
        </Box>
      </DialogTitle>
      
      <DialogContent>
        <Typography variant="body1" sx={{ mb: 2 }}>
          You have workout data from your guest session. Would you like to transfer it to your new account?
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          This will save your workout history, progress, and settings to the cloud.
        </Typography>
        {error && (
          <Typography variant="body2" sx={{ color: 'error.main', mt: 2 }}>
            {error}
          </Typography>
        )}
      </DialogContent>
      
      <DialogActions sx={{ p: 2, pt: 0 }}>
        <Button
          onClick={handleSkip}
          disabled={migrating}
          variant="text"
          sx={{ color: 'text.secondary' }}
        >
          Skip
        </Button>
        <Button
          onClick={handleMigrate}
          disabled={migrating}
          variant="contained"
          startIcon={migrating ? <CircularProgress size={20} color="inherit" /> : <CloudUpload />}
          sx={{ fontWeight: 600 }}
        >
          {migrating ? 'Migrating...' : 'Save My Data'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

GuestDataMigrationDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  userId: PropTypes.string,
};

export default GuestDataMigrationDialog;
