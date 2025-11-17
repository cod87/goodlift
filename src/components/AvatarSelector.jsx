import { useState } from 'react';
import PropTypes from 'prop-types';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Grid,
  Avatar,
  Typography,
  Alert,
  CircularProgress,
  IconButton,
  Tabs,
  Tab,
} from '@mui/material';
import { CloudUpload, Close } from '@mui/icons-material';
import { 
  PRESET_AVATARS, 
  compressImage, 
  validateImageFile, 
  uploadAvatar,
} from '../utils/avatarUtils';
import { useAuth } from '../contexts/AuthContext';

const AvatarSelector = ({ open, onClose, onSelect, currentAvatar, initials }) => {
  const { currentUser, isGuest } = useAuth();
  const [selectedAvatar, setSelectedAvatar] = useState(currentAvatar);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [tabValue, setTabValue] = useState(0);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    setError(null);
  };

  const handlePresetSelect = (presetId) => {
    setSelectedAvatar(presetId);
    setError(null);
  };

  const handleFileSelect = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setError(null);
    
    // Validate file
    const validation = validateImageFile(file);
    if (!validation.success) {
      setError(validation.error);
      return;
    }

    if (isGuest) {
      setError('Please sign in to upload custom avatars');
      return;
    }

    try {
      setUploading(true);

      // Compress image
      const compressedBlob = await compressImage(file, 200, 0.8);

      // Upload to Firebase Storage
      const downloadURL = await uploadAvatar(currentUser.uid, compressedBlob);

      setSelectedAvatar(downloadURL);
      setError(null);
    } catch (err) {
      console.error('Error uploading avatar:', err);
      setError('Failed to upload avatar. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = () => {
    if (selectedAvatar) {
      onSelect(selectedAvatar);
      onClose();
    }
  };

  const handleCancel = () => {
    setSelectedAvatar(currentAvatar);
    setError(null);
    onClose();
  };

  const renderPresetAvatar = (preset) => {
    const isSelected = selectedAvatar === preset.id;
    
    return (
      <Grid item xs={4} sm={3} key={preset.id}>
        <Box
          onClick={() => handlePresetSelect(preset.id)}
          sx={{
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 1,
            p: 1,
            borderRadius: 2,
            border: 2,
            borderColor: isSelected ? 'primary.main' : 'transparent',
            bgcolor: isSelected ? 'action.selected' : 'transparent',
            transition: 'all 0.2s',
            '&:hover': {
              bgcolor: 'action.hover',
            },
          }}
        >
          <Avatar
            sx={{
              width: 60,
              height: 60,
              bgcolor: preset.color,
              fontSize: '1.5rem',
              fontWeight: 700,
            }}
          >
            {initials}
          </Avatar>
          <Typography variant="caption" color="text.secondary">
            {preset.label}
          </Typography>
        </Box>
      </Grid>
    );
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleCancel}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6">Choose Avatar</Typography>
          <IconButton onClick={handleCancel} size="small">
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Tabs value={tabValue} onChange={handleTabChange} sx={{ mb: 2 }}>
          <Tab label="Preset Avatars" />
          <Tab label="Upload Custom" />
        </Tabs>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* Preset Avatars Tab */}
        {tabValue === 0 && (
          <Box sx={{ mt: 2 }}>
            <Grid container spacing={2}>
              {PRESET_AVATARS.map((preset) => renderPresetAvatar(preset))}
            </Grid>
          </Box>
        )}

        {/* Upload Custom Tab */}
        {tabValue === 1 && (
          <Box sx={{ mt: 2 }}>
            {isGuest ? (
              <Alert severity="info">
                Sign in to upload custom avatars
              </Alert>
            ) : (
              <>
                <Button
                  variant="outlined"
                  component="label"
                  fullWidth
                  startIcon={uploading ? <CircularProgress size={20} /> : <CloudUpload />}
                  disabled={uploading}
                  sx={{ mb: 2, minHeight: 56 }}
                >
                  {uploading ? 'Uploading...' : 'Choose Image'}
                  <input
                    type="file"
                    hidden
                    accept="image/jpeg,image/jpg,image/png,image/webp"
                    onChange={handleFileSelect}
                  />
                </Button>

                {selectedAvatar && !selectedAvatar.startsWith('preset-') && (
                  <Box sx={{ textAlign: 'center', mt: 2 }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Preview:
                    </Typography>
                    <Avatar
                      src={selectedAvatar}
                      sx={{
                        width: 100,
                        height: 100,
                        mx: 'auto',
                        border: 2,
                        borderColor: 'primary.main',
                      }}
                    />
                  </Box>
                )}

                <Alert severity="info" sx={{ mt: 2 }}>
                  Images will be cropped to a square and resized to 200x200px. Maximum file size: 5MB.
                  <br />
                  Supported formats: JPEG, PNG, WebP
                </Alert>
              </>
            )}
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2, pt: 0 }}>
        <Button onClick={handleCancel} color="inherit">
          Cancel
        </Button>
        <Button 
          onClick={handleSave} 
          variant="contained"
          disabled={!selectedAvatar || uploading}
        >
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
};

AvatarSelector.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSelect: PropTypes.func.isRequired,
  currentAvatar: PropTypes.string,
  initials: PropTypes.string.isRequired,
};

export default AvatarSelector;
