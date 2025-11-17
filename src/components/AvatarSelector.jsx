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
  IconButton,
  Tabs,
  Tab,
} from '@mui/material';
import { Close } from '@mui/icons-material';
import { 
  PRESET_AVATARS,
  DOGGO_AVATARS,
} from '../utils/avatarUtils';

const AvatarSelector = ({ open, onClose, onSelect, currentAvatar, initials }) => {
  const [selectedAvatar, setSelectedAvatar] = useState(currentAvatar);
  const [tabValue, setTabValue] = useState(0);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handlePresetSelect = (presetId) => {
    setSelectedAvatar(presetId);
  };

  const handleDoggoSelect = (doggoId) => {
    setSelectedAvatar(doggoId);
  };

  const handleSave = () => {
    if (selectedAvatar) {
      onSelect(selectedAvatar);
      onClose();
    }
  };

  const handleCancel = () => {
    setSelectedAvatar(currentAvatar);
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

  const renderDoggoAvatar = (doggo) => {
    const isSelected = selectedAvatar === doggo.id;
    
    return (
      <Grid item xs={6} sm={3} key={doggo.id}>
        <Box
          onClick={() => handleDoggoSelect(doggo.id)}
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
            src={doggo.url}
            sx={{
              width: 80,
              height: 80,
            }}
          />
          <Typography variant="caption" color="text.secondary">
            {doggo.label}
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
          <Tab label="Doggos" />
        </Tabs>

        {/* Preset Avatars Tab */}
        {tabValue === 0 && (
          <Box sx={{ mt: 2 }}>
            <Grid container spacing={2}>
              {PRESET_AVATARS.map((preset) => renderPresetAvatar(preset))}
            </Grid>
          </Box>
        )}

        {/* Doggos Tab */}
        {tabValue === 1 && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom sx={{ mb: 2 }}>
              Select a doggo as your avatar
            </Typography>
            <Grid container spacing={2}>
              {DOGGO_AVATARS.map((doggo) => renderDoggoAvatar(doggo))}
            </Grid>
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
          disabled={!selectedAvatar}
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
