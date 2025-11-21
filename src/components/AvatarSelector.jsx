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
} from '@mui/material';
import { Close } from '@mui/icons-material';
import { 
  DOGGO_AVATARS,
} from '../utils/avatarUtils';

const AvatarSelector = ({ open, onClose, onSelect, currentAvatar }) => {
  const [selectedAvatar, setSelectedAvatar] = useState(currentAvatar);

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
          <Typography variant="h6">Choose Dog Avatar</Typography>
          <IconButton onClick={handleCancel} size="small">
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Box sx={{ mt: 2 }}>
          <Typography variant="body2" color="text.secondary" gutterBottom sx={{ mb: 2 }}>
            Select a doggo as your avatar
          </Typography>
          <Grid container spacing={2}>
            {DOGGO_AVATARS.map((doggo) => renderDoggoAvatar(doggo))}
          </Grid>
        </Box>
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
};

export default AvatarSelector;
