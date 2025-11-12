import { useState, useEffect } from 'react';
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
  List,
  ListItem,
  ListItemText,
  IconButton,
  Chip,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import { Brightness4, Brightness7, VolumeUp, Delete, CheckCircle, Add, SelfImprovement } from '@mui/icons-material';
import { useTheme } from '../contexts/ThemeContext';
import audioService from '../utils/audioService';
import { getWorkoutPlans, getActivePlan, setActivePlan, deleteWorkoutPlan } from '../utils/storage';
import QuickPlanSetup from '../components/PlanBuilder/QuickPlanSetup';

const SettingsScreen = () => {
  const { mode, toggleTheme } = useTheme();
  const [volume, setVolume] = useState(() => {
    try {
      const stored = localStorage.getItem('audioVolume');
      return stored ? parseFloat(stored) : 0.3;
    } catch {
      return 0.3;
    }
  });
  const [isMuted, setIsMuted] = useState(audioService.isMutedState());
  const [plans, setPlans] = useState([]);
  const [activePlan, setActivePlanState] = useState(null);
  const [showPlanModal, setShowPlanModal] = useState(false);

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

  // Load plans on mount
  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    const loadedPlans = await getWorkoutPlans();
    setPlans(loadedPlans);
    const active = await getActivePlan();
    setActivePlanState(active);
  };

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

  const handleActivatePlan = async (planId) => {
    try {
      await setActivePlan(planId);
      await loadPlans();
    } catch (error) {
      console.error('Error activating plan:', error);
    }
  };

  const handleDeletePlan = async (planId) => {
    if (window.confirm('Are you sure you want to delete this plan?')) {
      try {
        await deleteWorkoutPlan(planId);
        await loadPlans();
      } catch (error) {
        console.error('Error deleting plan:', error);
      }
    }
  };

  const handleOpenPlanModal = () => {
    setShowPlanModal(true);
  };

  const handleClosePlanModal = () => {
    setShowPlanModal(false);
  };

  const handlePlanCreated = async () => {
    await loadPlans();
  };

  const handleStretchPreferenceChange = (key, value) => {
    setStretchPrefs(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  const getGoalLabel = (goal) => {
    const labels = {
      strength: 'Strength',
      hypertrophy: 'Muscle',
      fat_loss: 'Fat-Loss',
      general_fitness: 'General'
    };
    return labels[goal] || goal;
  };

  const getExperienceLabel = (level) => {
    const labels = {
      beginner: 'Beginner',
      intermediate: 'Intermediate',
      advanced: 'Advanced'
    };
    return labels[level] || level;
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        padding: { xs: 2, sm: 3, md: 4 },
        background: (theme) => theme.palette.background.default,
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

        <Card
          sx={{
            maxWidth: 600,
            borderRadius: 2,
            boxShadow: 3,
          }}
        >
          <CardContent sx={{ p: 3 }}>
            <Stack spacing={3}>
              {/* Theme Setting */}
              <Box>
                <Typography
                  variant="h6"
                  sx={{
                    mb: 2,
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                  }}
                >
                  {mode === 'dark' ? <Brightness4 /> : <Brightness7 />}
                  Appearance
                </Typography>
                <FormControlLabel
                  control={
                    <Switch
                      checked={mode === 'light'}
                      onChange={handleThemeToggle}
                      color="primary"
                    />
                  }
                  label={
                    <Box>
                      <Typography variant="body1" fontWeight={500}>
                        {mode === 'dark' ? 'Dark Theme' : 'Light Theme'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Switch between dark and light modes
                      </Typography>
                    </Box>
                  }
                />
              </Box>

              <Divider />

              {/* Volume Setting */}
              <Box>
                <Typography
                  variant="h6"
                  sx={{
                    mb: 2,
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                  }}
                >
                  <VolumeUp />
                  Sound
                </Typography>
                <Box sx={{ px: 1 }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Sound Effects Volume
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
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
                        flex: 1,
                        '& .MuiSlider-thumb': {
                          width: 20,
                          height: 20,
                        },
                        '& .MuiSlider-track': {
                          height: 6,
                        },
                        '& .MuiSlider-rail': {
                          height: 6,
                        },
                      }}
                    />
                    <Typography
                      variant="body2"
                      sx={{
                        minWidth: 45,
                        fontWeight: 600,
                        color: 'text.secondary',
                      }}
                    >
                      {Math.round(volume * 100)}%
                    </Typography>
                  </Box>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ display: 'block', mt: 1 }}
                  >
                    Adjust the volume of sound effects throughout the app. Set to 0 to mute all sounds.
                  </Typography>
                </Box>
              </Box>

              <Divider />

              {/* Stretch Reminders Setting */}
              <Box>
                <Typography
                  variant="h6"
                  sx={{
                    mb: 2,
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                  }}
                >
                  <SelfImprovement />
                  Stretch Reminders
                </Typography>
                
                {/* Warmup Toggle */}
                <FormControlLabel
                  control={
                    <Switch
                      checked={stretchPrefs.showWarmup}
                      onChange={(e) => handleStretchPreferenceChange('showWarmup', e.target.checked)}
                      color="primary"
                    />
                  }
                  label={
                    <Box>
                      <Typography variant="body1" fontWeight={500}>
                        Show Warmup Reminders
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Display warmup reminder before starting exercises
                      </Typography>
                    </Box>
                  }
                  sx={{ mb: 2 }}
                />

                {/* Warmup Duration */}
                {stretchPrefs.showWarmup && (
                  <FormControl fullWidth sx={{ mb: 2 }}>
                    <InputLabel id="warmup-duration-label">Default Warmup Duration</InputLabel>
                    <Select
                      labelId="warmup-duration-label"
                      id="warmup-duration-select"
                      value={stretchPrefs.defaultWarmupDuration}
                      label="Default Warmup Duration"
                      onChange={(e) => handleStretchPreferenceChange('defaultWarmupDuration', e.target.value)}
                    >
                      <MenuItem value={5}>5 minutes</MenuItem>
                      <MenuItem value={7}>7 minutes</MenuItem>
                      <MenuItem value={10}>10 minutes</MenuItem>
                    </Select>
                  </FormControl>
                )}

                {/* Cooldown Toggle */}
                <FormControlLabel
                  control={
                    <Switch
                      checked={stretchPrefs.showCooldown}
                      onChange={(e) => handleStretchPreferenceChange('showCooldown', e.target.checked)}
                      color="primary"
                    />
                  }
                  label={
                    <Box>
                      <Typography variant="body1" fontWeight={500}>
                        Show Cooldown Reminders
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Display cooldown reminder after finishing exercises
                      </Typography>
                    </Box>
                  }
                  sx={{ mb: 2 }}
                />

                {/* Cooldown Duration */}
                {stretchPrefs.showCooldown && (
                  <FormControl fullWidth>
                    <InputLabel id="cooldown-duration-label">Default Cooldown Duration</InputLabel>
                    <Select
                      labelId="cooldown-duration-label"
                      id="cooldown-duration-select"
                      value={stretchPrefs.defaultCooldownDuration}
                      label="Default Cooldown Duration"
                      onChange={(e) => handleStretchPreferenceChange('defaultCooldownDuration', e.target.value)}
                    >
                      <MenuItem value={5}>5 minutes</MenuItem>
                      <MenuItem value={7}>7 minutes</MenuItem>
                      <MenuItem value={10}>10 minutes</MenuItem>
                    </Select>
                  </FormControl>
                )}
              </Box>
            </Stack>
          </CardContent>
        </Card>

        {/* Workout Plans Section */}
        <Card
          sx={{
            maxWidth: 600,
            borderRadius: 2,
            boxShadow: 3,
            mt: 3,
          }}
        >
          <CardContent sx={{ p: 3 }}>
            <Stack spacing={3}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 600,
                  }}
                >
                  Workout Plans
                </Typography>
                <Button
                  variant="contained"
                  size="small"
                  startIcon={<Add />}
                  onClick={handleOpenPlanModal}
                  sx={{ textTransform: 'none' }}
                >
                  Create Plan
                </Button>
              </Box>

              <Divider />

              {plans.length === 0 ? (
                <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
                  No workout plans yet. Create one to get started!
                </Typography>
              ) : (
                <List sx={{ py: 0 }}>
                  {plans.map((plan) => (
                    <ListItem
                      key={plan.id}
                      sx={{
                        border: '1px solid',
                        borderColor: activePlan?.id === plan.id ? 'primary.main' : 'divider',
                        borderRadius: 2,
                        mb: 2,
                        bgcolor: activePlan?.id === plan.id ? 'action.selected' : 'background.paper',
                        '&:last-child': { mb: 0 }
                      }}
                    >
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                            <Typography variant="body1" fontWeight={600}>
                              {plan.name}
                            </Typography>
                            {activePlan?.id === plan.id && (
                              <CheckCircle color="primary" fontSize="small" />
                            )}
                          </Box>
                        }
                        secondary={
                          <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                            <Chip
                              label={getGoalLabel(plan.goal)}
                              size="small"
                              sx={{ fontSize: '0.7rem', height: 20 }}
                            />
                            <Chip
                              label={`${plan.daysPerWeek}x/week`}
                              size="small"
                              sx={{ fontSize: '0.7rem', height: 20 }}
                            />
                            <Chip
                              label={getExperienceLabel(plan.experienceLevel)}
                              size="small"
                              sx={{ fontSize: '0.7rem', height: 20 }}
                            />
                          </Stack>
                        }
                      />
                      <Stack direction="row" spacing={1}>
                        {activePlan?.id !== plan.id && (
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => handleActivatePlan(plan.id)}
                            sx={{ textTransform: 'none' }}
                          >
                            Activate
                          </Button>
                        )}
                        <IconButton
                          size="small"
                          onClick={() => handleDeletePlan(plan.id)}
                          sx={{ color: 'error.main' }}
                        >
                          <Delete fontSize="small" />
                        </IconButton>
                      </Stack>
                    </ListItem>
                  ))}
                </List>
              )}
            </Stack>
          </CardContent>
        </Card>

        <Box sx={{ mt: 3 }}>
          <Typography variant="body2" color="text.secondary">
            Your preferences are saved automatically and will persist between sessions.
          </Typography>
        </Box>
      </motion.div>

      {/* Quick Plan Setup */}
      <QuickPlanSetup
        open={showPlanModal}
        onClose={handleClosePlanModal}
        onPlanCreated={handlePlanCreated}
      />
    </Box>
  );
};

export default SettingsScreen;
