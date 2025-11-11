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
} from '@mui/material';
import { Brightness4, Brightness7, VolumeUp } from '@mui/icons-material';
import { useTheme } from '../contexts/ThemeContext';
import audioService from '../utils/audioService';

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

  // Save volume to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('audioVolume', volume.toString());
    } catch (e) {
      console.warn('Could not save volume preference', e);
    }
  }, [volume]);

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
            </Stack>
          </CardContent>
        </Card>

        <Box sx={{ mt: 3 }}>
          <Typography variant="body2" color="text.secondary">
            Your preferences are saved automatically and will persist between sessions.
          </Typography>
        </Box>
      </motion.div>
    </Box>
  );
};

export default SettingsScreen;
