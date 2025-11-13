import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { motion } from 'framer-motion';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Switch,
  Slider,
  FormControlLabel,
  Divider,
  Stack,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Alert,
} from '@mui/material';
import { 
  Brightness4, 
  Brightness7, 
  VolumeUp, 
  SelfImprovement,
  Person,
  FitnessCenter,
  Apps,
  Storage,
  Download,
  ChevronRight,
  EditNote,
  ListAlt,
  AccountCircle,
  Scale,
  AccountBox,
  Straighten,
  Timer,
  Notifications,
  CloudUpload,
  DeleteSweep,
  Security,
} from '@mui/icons-material';
import { useTheme } from '../contexts/ThemeContext';
import { usePreferences } from '../contexts/PreferencesContext';
import { useAuth } from '../contexts/AuthContext';
import audioService from '../utils/audioService';
import { downloadProfileData } from '../utils/profileUtils';
import { useUserProfile } from '../contexts/UserProfileContext';

const SettingsScreen = ({ onNavigate }) => {
  const { mode, toggleTheme } = useTheme();
  const { preferences, updatePreference } = usePreferences();
  const { profile, stats } = useUserProfile();
  const { isGuest } = useAuth();
  
  const [volume, setVolume] = useState(() => {
    try {
      const stored = localStorage.getItem('audioVolume');
      return stored ? parseFloat(stored) : 0.3;
    } catch {
      return 0.3;
    }
  });
  const [isMuted, setIsMuted] = useState(audioService.isMutedState());

  // Stretch reminder preferences
  const [stretchPrefs, setStretchPrefs] = useState(() => {
    try {
      const stored = localStorage.getItem('goodlift_stretch_prefs');
      return stored ? JSON.parse(stored) : {
        showWarmup: true,
        showCooldown: true,
        defaultWarmupDuration: 5,
        defaultCooldownDuration: 5,
      };
    } catch {
      return {
        showWarmup: true,
        showCooldown: true,
        defaultWarmupDuration: 5,
        defaultCooldownDuration: 5,
      };
    }
  });

  // Save volume to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('audioVolume', volume.toString());
    } catch (e) {
      console.warn('Could not save volume preference', e);
    }
  }, [volume]);

  // Save stretch preferences to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('goodlift_stretch_prefs', JSON.stringify(stretchPrefs));
    } catch (e) {
      console.warn('Could not save stretch preferences', e);
    }
  }, [stretchPrefs]);

  const handleVolumeChange = (event, newValue) => {
    setVolume(newValue);
    // If volume is > 0 and was muted, unmute
    if (newValue > 0 && isMuted) {
      audioService.setMuted(false);
      setIsMuted(false);
    }
    // If volume is set to 0, mute
    if (newValue === 0 && !isMuted) {
      audioService.setMuted(true);
      setIsMuted(true);
    }
  };

  const handleThemeToggle = () => {
    toggleTheme();
    // Play a subtle sound feedback
    if (!isMuted) {
      audioService.playTransitionBeep();
    }
  };

  const handleVolumeCommit = () => {
    // Play test sound when user releases slider
    if (volume > 0 && !isMuted) {
      audioService.playBeep(800, 200, volume);
    }
  };

  const handleStretchPreferenceChange = (key, value) => {
    setStretchPrefs(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleExportData = () => {
    downloadProfileData(profile, stats);
  };

  const handleNavigate = (screen) => {
    if (onNavigate) {
      onNavigate(screen);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        padding: { xs: 1, sm: 2, md: 3, lg: 4 },
        paddingBottom: { xs: '80px', sm: 3, md: 4 },
        background: (theme) => theme.palette.background.default,
        overflowX: 'hidden',
        width: '100%',
        boxSizing: 'border-box',
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Typography
          variant="h4"
          sx={{
            mb: 3,
            fontWeight: 700,
            color: 'text.primary',
          }}
        >
          Settings
        </Typography>

        <Stack spacing={3} sx={{ maxWidth: 600 }}>
          {/* Activity Management Section */}
          <Card sx={{ borderRadius: 2, boxShadow: 3 }}>
            <CardContent sx={{ p: 0 }}>
              <Typography
                variant="overline"
                sx={{
                  px: 2,
                  pt: 2,
                  pb: 1,
                  display: 'block',
                  fontWeight: 700,
                  color: 'text.secondary',
                  letterSpacing: '0.1em',
                }}
              >
                Activity Management
              </Typography>
              <List sx={{ py: 0 }}>
                <ListItem disablePadding>
                  <ListItemButton onClick={() => handleNavigate('log-activity')}>
                    <ListItemIcon>
                      <EditNote sx={{ color: 'primary.main' }} />
                    </ListItemIcon>
                    <ListItemText
                      primary="Log Activity"
                      secondary="Manually log workouts and activities"
                      primaryTypographyProps={{ fontWeight: 500 }}
                    />
                    <ChevronRight sx={{ color: 'text.secondary' }} />
                  </ListItemButton>
                </ListItem>
              </List>
            </CardContent>
          </Card>

          {/* Exercise Database Section */}
          <Card sx={{ borderRadius: 2, boxShadow: 3 }}>
            <CardContent sx={{ p: 0 }}>
              <Typography
                variant="overline"
                sx={{
                  px: 2,
                  pt: 2,
                  pb: 1,
                  display: 'block',
                  fontWeight: 700,
                  color: 'text.secondary',
                  letterSpacing: '0.1em',
                }}
              >
                Exercise Database
              </Typography>
              <List sx={{ py: 0 }}>
                <ListItem disablePadding>
                  <ListItemButton onClick={() => handleNavigate('exercise-list')}>
                    <ListItemIcon>
                      <ListAlt sx={{ color: 'primary.main' }} />
                    </ListItemIcon>
                    <ListItemText
                      primary="Browse Exercises"
                      secondary="View and customize exercise library"
                      primaryTypographyProps={{ fontWeight: 500 }}
                    />
                    <ChevronRight sx={{ color: 'text.secondary' }} />
                  </ListItemButton>
                </ListItem>
              </List>
            </CardContent>
          </Card>

          {/* User Profile Section */}
          <Card sx={{ borderRadius: 2, boxShadow: 3 }}>
            <CardContent sx={{ p: 0 }}>
              <Typography
                variant="overline"
                sx={{
                  px: 2,
                  pt: 2,
                  pb: 1,
                  display: 'block',
                  fontWeight: 700,
                  color: 'text.secondary',
                  letterSpacing: '0.1em',
                }}
              >
                User Profile
              </Typography>
              <List sx={{ py: 0 }}>
                <ListItem disablePadding>
                  <ListItemButton onClick={() => handleNavigate('profile')}>
                    <ListItemIcon>
                      <AccountCircle sx={{ color: 'primary.main' }} />
                    </ListItemIcon>
                    <ListItemText
                      primary="Profile Information"
                      secondary="Manage profile, avatar, and personal details"
                      primaryTypographyProps={{ fontWeight: 500 }}
                    />
                    <ChevronRight sx={{ color: 'text.secondary' }} />
                  </ListItemButton>
                </ListItem>
              </List>
            </CardContent>
          </Card>

          {/* App Preferences Section */}
          <Card sx={{ borderRadius: 2, boxShadow: 3 }}>
            <CardContent sx={{ p: 0 }}>
              <Typography
                variant="overline"
                sx={{
                  px: 2,
                  pt: 2,
                  pb: 1,
                  display: 'block',
                  fontWeight: 700,
                  color: 'text.secondary',
                  letterSpacing: '0.1em',
                }}
              >
                App Preferences
              </Typography>
              <List sx={{ py: 0 }}>
                {/* Units */}
                <ListItem sx={{ flexDirection: 'column', alignItems: 'flex-start', py: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', mb: 1 }}>
                    <ListItemIcon>
                      <Straighten sx={{ color: 'primary.main' }} />
                    </ListItemIcon>
                    <Typography variant="body1" fontWeight={500}>
                      Unit System
                    </Typography>
                  </Box>
                  <FormControl size="small" sx={{ ml: 7, minWidth: 180 }}>
                    <Select
                      value={preferences.units}
                      onChange={(e) => updatePreference('units', e.target.value)}
                    >
                      <MenuItem value="imperial">Imperial (lbs, in)</MenuItem>
                      <MenuItem value="metric">Metric (kg, cm)</MenuItem>
                    </Select>
                  </FormControl>
                </ListItem>
                <Divider component="li" />

                {/* Theme */}
                <ListItem>
                  <ListItemIcon>
                    {mode === 'dark' ? <Brightness4 sx={{ color: 'primary.main' }} /> : <Brightness7 sx={{ color: 'primary.main' }} />}
                  </ListItemIcon>
                  <ListItemText
                    primary="Theme"
                    secondary={mode === 'dark' ? 'Dark mode' : 'Light mode'}
                    primaryTypographyProps={{ fontWeight: 500 }}
                  />
                  <Switch
                    checked={mode === 'light'}
                    onChange={handleThemeToggle}
                    color="primary"
                  />
                </ListItem>
                <Divider component="li" />

                {/* Sound */}
                <ListItem sx={{ flexDirection: 'column', alignItems: 'flex-start', py: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', mb: 1 }}>
                    <ListItemIcon>
                      <VolumeUp sx={{ color: 'primary.main' }} />
                    </ListItemIcon>
                    <Typography variant="body1" fontWeight={500}>
                      Sound Effects
                    </Typography>
                  </Box>
                  <Box sx={{ ml: 7, width: 'calc(100% - 56px)' }}>
                    <Slider
                      value={volume}
                      onChange={handleVolumeChange}
                      onChangeCommitted={handleVolumeCommit}
                      min={0}
                      max={1}
                      step={0.1}
                      valueLabelDisplay="auto"
                      valueLabelFormat={(value) => `${Math.round(value * 100)}%`}
                      sx={{
                        width: 180,
                        '& .MuiSlider-thumb': {
                          width: 16,
                          height: 16,
                        },
                        '& .MuiSlider-track': {
                          height: 4,
                        },
                        '& .MuiSlider-rail': {
                          height: 4,
                        },
                      }}
                    />
                  </Box>
                </ListItem>
                <Divider component="li" />

                {/* Warmup Reminders */}
                <ListItem sx={{ flexDirection: 'column', alignItems: 'flex-start', py: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', justifyContent: 'space-between' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <ListItemIcon>
                        <SelfImprovement sx={{ color: 'primary.main' }} />
                      </ListItemIcon>
                      <Typography variant="body1" fontWeight={500}>
                        Warmup Reminders
                      </Typography>
                    </Box>
                    <Switch
                      checked={stretchPrefs.showWarmup}
                      onChange={(e) => handleStretchPreferenceChange('showWarmup', e.target.checked)}
                      color="primary"
                    />
                  </Box>
                  {stretchPrefs.showWarmup && (
                    <FormControl size="small" sx={{ ml: 7, mt: 1, minWidth: 180 }}>
                      <Select
                        value={stretchPrefs.defaultWarmupDuration}
                        onChange={(e) => handleStretchPreferenceChange('defaultWarmupDuration', e.target.value)}
                      >
                        <MenuItem value={5}>5 minutes</MenuItem>
                        <MenuItem value={7}>7 minutes</MenuItem>
                        <MenuItem value={10}>10 minutes</MenuItem>
                      </Select>
                    </FormControl>
                  )}
                </ListItem>
                <Divider component="li" />

                {/* Cooldown Reminders */}
                <ListItem sx={{ flexDirection: 'column', alignItems: 'flex-start', py: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', justifyContent: 'space-between' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <ListItemIcon>
                        <FitnessCenter sx={{ color: 'primary.main' }} />
                      </ListItemIcon>
                      <Typography variant="body1" fontWeight={500}>
                        Cooldown Reminders
                      </Typography>
                    </Box>
                    <Switch
                      checked={stretchPrefs.showCooldown}
                      onChange={(e) => handleStretchPreferenceChange('showCooldown', e.target.checked)}
                      color="primary"
                    />
                  </Box>
                  {stretchPrefs.showCooldown && (
                    <FormControl size="small" sx={{ ml: 7, mt: 1, minWidth: 180 }}>
                      <Select
                        value={stretchPrefs.defaultCooldownDuration}
                        onChange={(e) => handleStretchPreferenceChange('defaultCooldownDuration', e.target.value)}
                      >
                        <MenuItem value={5}>5 minutes</MenuItem>
                        <MenuItem value={7}>7 minutes</MenuItem>
                        <MenuItem value={10}>10 minutes</MenuItem>
                      </Select>
                    </FormControl>
                  )}
                </ListItem>
              </List>
            </CardContent>
          </Card>

          {/* Data & Privacy Section */}
          <Card sx={{ borderRadius: 2, boxShadow: 3 }}>
            <CardContent sx={{ p: 0 }}>
              <Typography
                variant="overline"
                sx={{
                  px: 2,
                  pt: 2,
                  pb: 1,
                  display: 'block',
                  fontWeight: 700,
                  color: 'text.secondary',
                  letterSpacing: '0.1em',
                }}
              >
                Data & Privacy
              </Typography>
              <List sx={{ py: 0 }}>
                <ListItem disablePadding>
                  <ListItemButton onClick={handleExportData}>
                    <ListItemIcon>
                      <Download sx={{ color: 'primary.main' }} />
                    </ListItemIcon>
                    <ListItemText
                      primary="Export Data"
                      secondary="Download your profile and workout data"
                      primaryTypographyProps={{ fontWeight: 500 }}
                    />
                  </ListItemButton>
                </ListItem>
                <Divider component="li" />
                <ListItem sx={{ flexDirection: 'column', alignItems: 'flex-start', py: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', mb: 1 }}>
                    <ListItemIcon>
                      <Security sx={{ color: 'primary.main' }} />
                    </ListItemIcon>
                    <Typography variant="body1" fontWeight={500}>
                      Privacy
                    </Typography>
                  </Box>
                  <Box sx={{ ml: 7, width: 'calc(100% - 56px)' }}>
                    {isGuest ? (
                      <Alert severity="info">
                        Create an account to access cloud sync and data privacy features
                      </Alert>
                    ) : (
                      <Alert severity="success">
                        Your data is securely stored in Firebase and synced across your devices
                      </Alert>
                    )}
                  </Box>
                </ListItem>
              </List>
            </CardContent>
          </Card>

          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
              Your preferences are saved automatically
            </Typography>
          </Box>
        </Stack>
      </motion.div>
    </Box>
  );
};

SettingsScreen.propTypes = {
  onNavigate: PropTypes.func,
};

export default SettingsScreen;
