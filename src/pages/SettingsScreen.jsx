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
  Snackbar,
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
  Restore,
  CalendarMonth,
  Edit,
} from '@mui/icons-material';
import { useTheme } from '../contexts/ThemeContext';
import { usePreferences } from '../contexts/PreferencesContext';
import { useAuth } from '../contexts/AuthContext';
import { useWeekScheduling } from '../contexts/WeekSchedulingContext';
import audioService from '../utils/audioService';
import { downloadProfileData } from '../utils/profileUtils';
import { useUserProfile } from '../contexts/UserProfileContext';
import ResetDataDialog from '../components/ResetDataDialog';
import RecoverDataDialog from '../components/RecoverDataDialog';
import WeekEditorDialog from '../components/WeekEditorDialog';
// PlansManagement removed - no longer using workout planning
import {
  resetUserData,
  recoverUserData,
  getBackup,
  getResetInfo,
  cleanupExpiredBackups,
} from '../utils/dataResetService';

const SettingsScreen = ({ onNavigate }) => {
  const { mode, toggleTheme } = useTheme();
  const { preferences, updatePreference } = usePreferences();
  const { profile, stats } = useUserProfile();
  const { isGuest } = useAuth();
  const { resetWeekCycle } = useWeekScheduling();
  
  const [volume, setVolume] = useState(() => {
    try {
      const stored = localStorage.getItem('audioVolume');
      return stored ? parseFloat(stored) : 0.3;
    } catch {
      return 0.3;
    }
  });
  const [isMuted, setIsMuted] = useState(audioService.isMutedState());

  // Data reset and recovery states
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [recoverDialogOpen, setRecoverDialogOpen] = useState(false);
  const [weekEditorOpen, setWeekEditorOpen] = useState(false);
  const [backup, setBackup] = useState(null);
  const [resetInfo, setResetInfo] = useState(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');

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

  // Check for backup and cleanup expired backups on mount
  useEffect(() => {
    const initializeDataReset = async () => {
      await cleanupExpiredBackups();
      const currentBackup = await getBackup();
      setBackup(currentBackup);
      setResetInfo(getResetInfo());
    };
    
    initializeDataReset();
  }, []);

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

  const handleOpenResetDialog = () => {
    setResetInfo(getResetInfo());
    setResetDialogOpen(true);
  };

  const handleCloseResetDialog = () => {
    setResetDialogOpen(false);
  };

  const handleConfirmReset = async () => {
    const result = await resetUserData();
    
    if (result.success) {
      // Update backup state
      setBackup(result.backup);
      setResetInfo(getResetInfo());
      
      // Show success message
      setSnackbarMessage(result.message);
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
      
      // Reload the page to reflect reset state
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } else {
      setSnackbarMessage(result.message);
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  };

  const handleOpenRecoverDialog = async () => {
    const currentBackup = await getBackup();
    setBackup(currentBackup);
    setRecoverDialogOpen(true);
  };

  const handleCloseRecoverDialog = () => {
    setRecoverDialogOpen(false);
  };

  const handleConfirmRecover = async () => {
    const result = await recoverUserData();
    
    if (result.success) {
      // Clear backup state
      setBackup(null);
      setResetInfo(getResetInfo());
      
      // Show success message
      setSnackbarMessage(result.message);
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
      
      // Reload the page to reflect recovered state
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } else {
      setSnackbarMessage(result.message);
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
  };

  const handleNavigate = (screen) => {
    if (onNavigate) {
      onNavigate(screen);
    }
  };

  const handleResetWeekCycle = async () => {
    try {
      await resetWeekCycle();
      setSnackbarMessage('Week cycle reset to Week 1. Automatic workout assignment re-enabled.');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
    } catch (error) {
      console.error('Error resetting week cycle:', error);
      setSnackbarMessage('Failed to reset week cycle');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
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
        {/* GoodLift Logo */}
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
          <img 
            src="/goodlift-logo.svg" 
            alt="GoodLift" 
            style={{ 
              height: '50px',
              width: 'auto',
            }} 
          />
        </Box>

        <Typography
          variant="h4"
          sx={{
            mb: 2,
            fontWeight: 700,
            color: 'text.primary',
          }}
        >
          Settings
        </Typography>

        <Stack spacing={2} sx={{ maxWidth: 600 }}>
          {/* My Plans Section removed - no longer using workout planning */}

          {/* Exercise Database Section */}
          <Card sx={{ borderRadius: 2, boxShadow: 3 }}>
            <CardContent sx={{ p: 0 }}>
              <Typography
                variant="overline"
                sx={{
                  px: 2,
                  pt: 1.5,
                  pb: 0.5,
                  display: 'block',
                  fontWeight: 700,
                  color: 'text.secondary',
                  letterSpacing: '0.1em',
                  fontSize: '0.7rem',
                }}
              >
                Exercise Database
              </Typography>
              <List sx={{ py: 0 }}>
                <ListItem disablePadding>
                  <ListItemButton onClick={() => handleNavigate('exercise-list')} sx={{ py: 1 }}>
                    <ListItemIcon sx={{ minWidth: 40 }}>
                      <ListAlt sx={{ color: 'primary.main' }} />
                    </ListItemIcon>
                    <ListItemText
                      primary="Browse Exercises"
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
                  pt: 1.5,
                  pb: 0.5,
                  display: 'block',
                  fontWeight: 700,
                  color: 'text.secondary',
                  letterSpacing: '0.1em',
                  fontSize: '0.7rem',
                }}
              >
                User Profile
              </Typography>
              <List sx={{ py: 0 }}>
                <ListItem disablePadding>
                  <ListItemButton onClick={() => handleNavigate('profile')} sx={{ py: 1 }}>
                    <ListItemIcon sx={{ minWidth: 40 }}>
                      <AccountCircle sx={{ color: 'primary.main' }} />
                    </ListItemIcon>
                    <ListItemText
                      primary="Profile Information"
                      primaryTypographyProps={{ fontWeight: 500 }}
                    />
                    <ChevronRight sx={{ color: 'text.secondary' }} />
                  </ListItemButton>
                </ListItem>
              </List>
            </CardContent>
          </Card>

          {/* Workout Scheduling Section */}
          <Card sx={{ borderRadius: 2, boxShadow: 3 }}>
            <CardContent sx={{ p: 0 }}>
              <Typography
                variant="overline"
                sx={{
                  px: 2,
                  pt: 1.5,
                  pb: 0.5,
                  display: 'block',
                  fontWeight: 700,
                  color: 'text.secondary',
                  letterSpacing: '0.1em',
                  fontSize: '0.7rem',
                }}
              >
                Workout Scheduling
              </Typography>
              <List sx={{ py: 0 }}>
                <ListItem disablePadding>
                  <ListItemButton onClick={() => setWeekEditorOpen(true)} sx={{ py: 1 }}>
                    <ListItemIcon sx={{ minWidth: 40 }}>
                      <Edit sx={{ color: 'primary.main' }} />
                    </ListItemIcon>
                    <ListItemText
                      primary="Edit Weekly Schedule"
                      primaryTypographyProps={{ fontWeight: 500 }}
                    />
                    <ChevronRight sx={{ color: 'text.secondary' }} />
                  </ListItemButton>
                </ListItem>
                <Divider component="li" />
                <ListItem disablePadding>
                  <ListItemButton onClick={handleResetWeekCycle} sx={{ py: 1 }}>
                    <ListItemIcon sx={{ minWidth: 40 }}>
                      <CalendarMonth sx={{ color: 'primary.main' }} />
                    </ListItemIcon>
                    <ListItemText
                      primary="Reset Week Counter"
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
                  pt: 1.5,
                  pb: 0.5,
                  display: 'block',
                  fontWeight: 700,
                  color: 'text.secondary',
                  letterSpacing: '0.1em',
                  fontSize: '0.7rem',
                }}
              >
                App Preferences
              </Typography>
              <List sx={{ py: 0 }}>
                {/* Units */}
                <ListItem sx={{ flexDirection: 'column', alignItems: 'flex-start', py: 1.5 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', mb: 0.5 }}>
                    <ListItemIcon sx={{ minWidth: 40 }}>
                      <Straighten sx={{ color: 'primary.main' }} />
                    </ListItemIcon>
                    <Typography variant="body2" fontWeight={500}>
                      Unit System
                    </Typography>
                  </Box>
                  <FormControl size="small" sx={{ ml: 5, minWidth: 160 }}>
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
                <ListItem sx={{ py: 1 }}>
                  <ListItemIcon sx={{ minWidth: 40 }}>
                    {mode === 'dark' ? <Brightness4 sx={{ color: 'primary.main' }} /> : <Brightness7 sx={{ color: 'primary.main' }} />}
                  </ListItemIcon>
                  <ListItemText
                    primary="Theme"
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
                <ListItem sx={{ flexDirection: 'column', alignItems: 'flex-start', py: 1.5 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', mb: 0.5 }}>
                    <ListItemIcon sx={{ minWidth: 40 }}>
                      <VolumeUp sx={{ color: 'primary.main' }} />
                    </ListItemIcon>
                    <Typography variant="body2" fontWeight={500}>
                      Sound Effects
                    </Typography>
                  </Box>
                  <Box sx={{ ml: 5, width: 'calc(100% - 40px)' }}>
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
                <ListItem sx={{ flexDirection: 'column', alignItems: 'flex-start', py: 1.5 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', justifyContent: 'space-between' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <ListItemIcon sx={{ minWidth: 40 }}>
                        <SelfImprovement sx={{ color: 'primary.main' }} />
                      </ListItemIcon>
                      <Typography variant="body2" fontWeight={500}>
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
                    <FormControl size="small" sx={{ ml: 5, mt: 0.5, minWidth: 160 }}>
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
                <ListItem sx={{ flexDirection: 'column', alignItems: 'flex-start', py: 1.5 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', justifyContent: 'space-between' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <ListItemIcon sx={{ minWidth: 40 }}>
                        <FitnessCenter sx={{ color: 'primary.main' }} />
                      </ListItemIcon>
                      <Typography variant="body2" fontWeight={500}>
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
                    <FormControl size="small" sx={{ ml: 5, mt: 0.5, minWidth: 160 }}>
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
                  pt: 1.5,
                  pb: 0.5,
                  display: 'block',
                  fontWeight: 700,
                  color: 'text.secondary',
                  letterSpacing: '0.1em',
                  fontSize: '0.7rem',
                }}
              >
                Data & Privacy
              </Typography>
              <List sx={{ py: 0 }}>
                <ListItem disablePadding>
                  <ListItemButton onClick={handleExportData} sx={{ py: 1 }}>
                    <ListItemIcon sx={{ minWidth: 40 }}>
                      <Download sx={{ color: 'primary.main' }} />
                    </ListItemIcon>
                    <ListItemText
                      primary="Export Data"
                      primaryTypographyProps={{ fontWeight: 500 }}
                    />
                  </ListItemButton>
                </ListItem>
                <Divider component="li" />
                
                {/* Recover Data - Only show if backup exists */}
                {backup && (
                  <>
                    <ListItem disablePadding>
                      <ListItemButton onClick={handleOpenRecoverDialog} sx={{ py: 1 }}>
                        <ListItemIcon sx={{ minWidth: 40 }}>
                          <Restore sx={{ color: 'success.main' }} />
                        </ListItemIcon>
                        <ListItemText
                          primary="Recover Data"
                          primaryTypographyProps={{ fontWeight: 500 }}
                        />
                        <ChevronRight sx={{ color: 'text.secondary' }} />
                      </ListItemButton>
                    </ListItem>
                    <Divider component="li" />
                  </>
                )}

                {/* Reset Personal Data */}
                <ListItem disablePadding>
                  <ListItemButton 
                    onClick={handleOpenResetDialog}
                    disabled={!resetInfo?.hasData}
                    sx={{ py: 1 }}
                  >
                    <ListItemIcon sx={{ minWidth: 40 }}>
                      <DeleteSweep sx={{ color: resetInfo?.hasData ? 'error.main' : 'text.disabled' }} />
                    </ListItemIcon>
                    <ListItemText
                      primary="Reset Personal Data"
                      primaryTypographyProps={{ fontWeight: 500 }}
                    />
                    <ChevronRight sx={{ color: 'text.secondary' }} />
                  </ListItemButton>
                </ListItem>
                <Divider component="li" />

                <ListItem sx={{ flexDirection: 'column', alignItems: 'flex-start', py: 1.5 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', mb: 0.5 }}>
                    <ListItemIcon sx={{ minWidth: 40 }}>
                      <Security sx={{ color: 'primary.main' }} />
                    </ListItemIcon>
                    <Typography variant="body2" fontWeight={500}>
                      Privacy
                    </Typography>
                  </Box>
                  <Box sx={{ ml: 5, width: 'calc(100% - 40px)' }}>
                    {isGuest ? (
                      <Alert severity="info" sx={{ py: 0.5, fontSize: '0.8rem' }}>
                        Create an account to access cloud sync and data privacy features
                      </Alert>
                    ) : (
                      <Alert severity="success" sx={{ py: 0.5, fontSize: '0.8rem' }}>
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

      {/* Reset Data Dialog */}
      {resetInfo && (
        <ResetDataDialog
          open={resetDialogOpen}
          onClose={handleCloseResetDialog}
          onConfirm={handleConfirmReset}
          resetInfo={resetInfo}
        />
      )}

      {/* Recover Data Dialog */}
      {backup && (
        <RecoverDataDialog
          open={recoverDialogOpen}
          onClose={handleCloseRecoverDialog}
          onRecover={handleConfirmRecover}
          backup={backup}
        />
      )}

      {/* Week Editor Dialog */}
      <WeekEditorDialog
        open={weekEditorOpen}
        onClose={() => setWeekEditorOpen(false)}
      />

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbarSeverity} sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

SettingsScreen.propTypes = {
  onNavigate: PropTypes.func,
};

export default SettingsScreen;
