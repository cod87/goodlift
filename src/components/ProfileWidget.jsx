import { memo } from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  Card,
  CardContent,
  Avatar,
  Typography,
  IconButton,
  Stack,
} from '@mui/material';
import { Edit } from '@mui/icons-material';
import { useUserProfile } from '../contexts/UserProfileContext';
import { usePreferences } from '../contexts/PreferencesContext';
import { isPresetAvatar, getPresetAvatarColor, getInitialsAvatarStyle } from '../utils/avatarUtils';
import { formatWeight } from '../utils/weightUtils';

const ProfileWidget = memo(({ onNavigateToProfile }) => {
  const { profile, loading, getInitials } = useUserProfile();
  const { getDisplayUnit } = usePreferences();

  if (loading) {
    return null;
  }

  const renderAvatar = () => {
    const initials = getInitials();
    const size = 60;

    if (profile.avatar) {
      if (isPresetAvatar(profile.avatar)) {
        const color = getPresetAvatarColor(profile.avatar);
        return (
          <Avatar
            sx={{
              width: size,
              height: size,
              ...getInitialsAvatarStyle(initials, color),
              fontSize: '1.5rem',
            }}
          >
            {initials}
          </Avatar>
        );
      } else {
        return (
          <Avatar
            src={profile.avatar}
            sx={{ width: size, height: size }}
          />
        );
      }
    }

    return (
      <Avatar
        sx={{
          width: size,
          height: size,
          ...getInitialsAvatarStyle(initials),
          fontSize: '1.5rem',
        }}
      >
        {initials}
      </Avatar>
    );
  };

  return (
    <Card 
      sx={{ 
        borderRadius: 2,
        mb: 3,
        cursor: 'pointer',
        transition: 'all 0.2s',
        '&:hover': {
          boxShadow: 4,
          transform: 'translateY(-2px)',
        },
      }}
      onClick={onNavigateToProfile}
    >
      <CardContent sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {/* Avatar */}
          {renderAvatar()}

          {/* Profile Info */}
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" fontWeight={600}>
              {profile.displayName || 'Guest User'}
            </Typography>
            {profile.currentWeight && (
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.5 }}>
                <Typography variant="body2" color="text.secondary">
                  Current Weight:
                </Typography>
                <Typography variant="body2" fontWeight={600}>
                  {formatWeight(profile.currentWeight, profile.weightUnit || getDisplayUnit())}
                </Typography>
              </Stack>
            )}
          </Box>

          {/* Edit Button */}
          <IconButton 
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              onNavigateToProfile();
            }}
            sx={{ 
              color: 'primary.main',
            }}
          >
            <Edit fontSize="small" />
          </IconButton>
        </Box>
      </CardContent>
    </Card>
  );
});

ProfileWidget.displayName = 'ProfileWidget';

ProfileWidget.propTypes = {
  onNavigateToProfile: PropTypes.func.isRequired,
};

export default ProfileWidget;
