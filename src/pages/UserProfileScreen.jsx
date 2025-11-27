import { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Avatar,
  TextField,
  Button,
  Stack,
  LinearProgress,
  Chip,
  IconButton,
  Alert,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import { Edit, Save, Cancel, PhotoCamera } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useUserProfile } from '../contexts/UserProfileContext';
import AvatarSelector from '../components/AvatarSelector';
import LoadingScreen from '../components/LoadingScreen';
import { 
  validateDisplayName, 
  validateTextField, 
  sanitizeText,
  formatLongDate 
} from '../utils/profileUtils';
import { isDoggoAvatar, getDoggoAvatarUrl } from '../utils/avatarUtils';

const UserProfileScreen = () => {
  const { 
    profile, 
    stats, 
    loading: profileLoading,
    saveProfile,
    updateProfile,
    getProfileCompletion,
  } = useUserProfile();

  const [editing, setEditing] = useState(false);
  const [showAvatarSelector, setShowAvatarSelector] = useState(false);
  const [editedProfile, setEditedProfile] = useState(profile);
  const [errors, setErrors] = useState({});
  const [saveError, setSaveError] = useState(null);

  useEffect(() => {
    setEditedProfile(profile);
  }, [profile]);

  const handleEdit = () => {
    setEditing(true);
    setErrors({});
    setSaveError(null);
  };

  const handleCancel = () => {
    setEditing(false);
    setEditedProfile(profile);
    setErrors({});
    setSaveError(null);
  };

  const handleSave = async () => {
    const newErrors = {};

    // Validate display name
    const nameValidation = validateDisplayName(editedProfile.displayName);
    if (!nameValidation.valid) {
      newErrors.displayName = nameValidation.error;
    }

    // Validate bio
    const bioValidation = validateTextField(editedProfile.bio, 500);
    if (!bioValidation.valid) {
      newErrors.bio = bioValidation.error;
    }

    // Validate goals
    const goalsValidation = validateTextField(editedProfile.goals, 500);
    if (!goalsValidation.valid) {
      newErrors.goals = goalsValidation.error;
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      // Sanitize text fields
      const sanitizedProfile = {
        ...editedProfile,
        displayName: sanitizeText(editedProfile.displayName),
        bio: sanitizeText(editedProfile.bio),
        goals: sanitizeText(editedProfile.goals),
      };

      await saveProfile(sanitizedProfile);
      setEditing(false);
      setSaveError(null);
    } catch (error) {
      console.error('Error saving profile:', error);
      setSaveError('Failed to save profile. Please try again.');
    }
  };

  const handleFieldChange = (field, value) => {
    setEditedProfile({ ...editedProfile, [field]: value });
    // Clear error for this field
    if (errors[field]) {
      setErrors({ ...errors, [field]: null });
    }
  };

  const handleAvatarSelect = async (avatarValue) => {
    try {
      await updateProfile('avatar', avatarValue);
      setEditedProfile({ ...editedProfile, avatar: avatarValue });
    } catch (error) {
      console.error('Error updating avatar:', error);
      setSaveError('Failed to update avatar. Please try again.');
    }
  };

  const renderAvatar = () => {
    const size = 80;

    // Only show dog avatars - if user has a doggo avatar, show it
    if (profile.avatar && isDoggoAvatar(profile.avatar)) {
      const url = getDoggoAvatarUrl(profile.avatar);
      return (
        <Avatar
          src={url}
          sx={{ width: size, height: size }}
        />
      );
    }

    // Default to first dog avatar if none selected
    const defaultDogUrl = getDoggoAvatarUrl('doggo-1');
    return (
      <Avatar
        src={defaultDogUrl}
        sx={{ width: size, height: size }}
      />
    );
  };

  const profileCompletion = getProfileCompletion();

  if (profileLoading) {
    return <LoadingScreen showLogo={false} />;
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        padding: { xs: 1.5, sm: 2, md: 3 },
        paddingTop: { xs: 0.5, sm: 1, md: 2 },
        paddingBottom: { xs: '80px', sm: 3, md: 4 },
        background: (theme) => theme.palette.background.default,
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {/* Profile Header Card */}
        <Card sx={{ mb: 2, borderRadius: 2 }}>
          <CardContent sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, mb: 2 }}>
              {/* Avatar */}
              <Box sx={{ position: 'relative', alignSelf: { xs: 'center', sm: 'flex-start' } }}>
                <Box sx={{ 
                  borderRadius: '50%', 
                  overflow: 'hidden',
                  width: 80,
                  height: 80,
                  border: '2px solid',
                  borderColor: 'divider',
                }}>
                  {renderAvatar()}
                </Box>
                <IconButton
                  onClick={() => setShowAvatarSelector(true)}
                  size="small"
                  sx={{
                    position: 'absolute',
                    bottom: -4,
                    right: -4,
                    bgcolor: 'primary.main',
                    color: 'white',
                    '&:hover': { 
                      bgcolor: 'primary.dark',
                    },
                  }}
                >
                  <PhotoCamera fontSize="small" />
                </IconButton>
              </Box>

              {/* Profile Info */}
              <Box sx={{ flex: 1 }}>
                {editing ? (
                  <TextField
                    fullWidth
                    label="Display Name"
                    value={editedProfile.displayName}
                    onChange={(e) => handleFieldChange('displayName', e.target.value)}
                    error={!!errors.displayName}
                    helperText={errors.displayName}
                    sx={{ mb: 2 }}
                  />
                ) : (
                  <Typography variant="h5" fontWeight={700} gutterBottom>
                    {profile.displayName || 'Unknown User'}
                  </Typography>
                )}

                <Typography variant="body2" color="text.secondary" gutterBottom>
                  {profile.email}
                </Typography>

                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Member since {formatLongDate(profile.memberSince)}
                </Typography>

                {/* Profile Completion */}
                <Box sx={{ mt: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" fontWeight={600}>
                      Profile Completion
                    </Typography>
                    <Typography variant="body2" fontWeight={600}>
                      {profileCompletion}%
                    </Typography>
                  </Box>
                  <LinearProgress 
                    variant="determinate" 
                    value={profileCompletion}
                    sx={{ height: 8, borderRadius: 4 }}
                  />
                </Box>
              </Box>

              {/* Edit/Save Buttons */}
              <Box>
                {editing ? (
                  <Stack direction="row" spacing={1}>
                    <IconButton color="primary" onClick={handleSave}>
                      <Save />
                    </IconButton>
                    <IconButton onClick={handleCancel}>
                      <Cancel />
                    </IconButton>
                  </Stack>
                ) : (
                  <IconButton color="primary" onClick={handleEdit}>
                    <Edit />
                  </IconButton>
                )}
              </Box>
            </Box>

            {saveError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {saveError}
              </Alert>
            )}

            {/* Bio */}
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                Bio
              </Typography>
              {editing ? (
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  value={editedProfile.bio}
                  onChange={(e) => handleFieldChange('bio', e.target.value)}
                  error={!!errors.bio}
                  helperText={errors.bio || `${editedProfile.bio.length}/500`}
                  placeholder="Tell us about yourself..."
                />
              ) : (
                <Typography variant="body2" color="text.secondary">
                  {profile.bio || 'No bio yet'}
                </Typography>
              )}
            </Box>

            {/* Goals */}
            <Box>
              <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                Fitness Goals
              </Typography>
              {editing ? (
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  value={editedProfile.goals}
                  onChange={(e) => handleFieldChange('goals', e.target.value)}
                  error={!!errors.goals}
                  helperText={errors.goals || `${editedProfile.goals.length}/500`}
                  placeholder="What are your fitness goals?"
                />
              ) : (
                <Typography variant="body2" color="text.secondary">
                  {profile.goals || 'No goals set yet'}
                </Typography>
              )}
            </Box>

            {/* Target Weight */}
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                Target Weight
              </Typography>
              {editing ? (
                <Stack direction="row" spacing={2} alignItems="flex-start">
                  <TextField
                    type="number"
                    label="Target Weight"
                    value={editedProfile.targetWeight || ''}
                    onChange={(e) => handleFieldChange('targetWeight', e.target.value ? parseFloat(e.target.value) : null)}
                    inputProps={{ step: 0.1, min: 0 }}
                    sx={{ flex: 1, maxWidth: 200 }}
                  />
                  <FormControl size="small" sx={{ minWidth: 80 }}>
                    <InputLabel>Unit</InputLabel>
                    <Select
                      value={editedProfile.weightUnit || 'lbs'}
                      onChange={(e) => handleFieldChange('weightUnit', e.target.value)}
                      label="Unit"
                    >
                      <MenuItem value="lbs">lbs</MenuItem>
                      <MenuItem value="kg">kg</MenuItem>
                    </Select>
                  </FormControl>
                </Stack>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  {profile.targetWeight 
                    ? `${profile.targetWeight} ${profile.weightUnit || 'lbs'}` 
                    : 'No target weight set'}
                </Typography>
              )}
            </Box>
          </CardContent>
        </Card>

        {/* Stats Cards - Compact */}
        <Grid container spacing={1.5} sx={{ mb: 2 }}>
          <Grid item xs={6} sm={4}>
            <Card>
              <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                  Total Workouts
                </Typography>
                <Typography variant="h5" fontWeight={700}>
                  {stats.totalWorkouts}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={6} sm={4}>
            <Card>
              <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                  Current Streak
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.5 }}>
                  <Typography variant="h5" fontWeight={700} color="warning.main">
                    {stats.currentStreak}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    days
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={6} sm={4}>
            <Card>
              <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                  Longest Streak
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.5 }}>
                  <Typography variant="h5" fontWeight={700}>
                    {stats.longestStreak}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    days
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={6} sm={4}>
            <Card>
              <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                  Total PRs
                </Typography>
                <Typography variant="h5" fontWeight={700} color="success.main">
                  {stats.totalPRs}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={6} sm={4}>
            <Card>
              <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                  Wellness Tasks
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.5 }}>
                  <Typography variant="h5" fontWeight={700} color="secondary.main">
                    {stats.completedWellnessTasks || 0}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    done
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={8}>
            <Card>
              <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                  Favorite Exercise
                </Typography>
                <Chip 
                  label={stats.favoriteExercise || 'No data yet'}
                  color="primary"
                  size="small"
                />
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </motion.div>

      {/* Avatar Selector Dialog */}
      <AvatarSelector
        open={showAvatarSelector}
        onClose={() => setShowAvatarSelector(false)}
        onSelect={handleAvatarSelect}
        currentAvatar={profile.avatar}
      />
    </Box>
  );
};

export default UserProfileScreen;
