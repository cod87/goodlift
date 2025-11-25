import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Box, IconButton, Tooltip, useTheme, Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography } from '@mui/material';
import { VolumeUp, VolumeOff } from '@mui/icons-material';
import { MdScreenLockPortrait, MdScreenLockRotation } from 'react-icons/md';
import audioService from '../utils/audioService';
import wakeLockManager from '../utils/wakeLock';
import WeekBadge from './Common/WeekBadge';
import { useWeekScheduling } from '../contexts/WeekSchedulingContext';

/**
 * Header component - Sticky header with logo, week badge, sound toggle, and wake lock toggle
 * Appears at the top of all screens
 */
const Header = ({ onNavigate }) => {
  const theme = useTheme();
  const { currentWeek, deloadWeekActive, triggerDeloadWeek } = useWeekScheduling();
  const [isMuted, setIsMuted] = useState(audioService.isMutedState());
  const [wakeLockActive, setWakeLockActive] = useState(wakeLockManager.isActive());
  const [wakeLockSupported] = useState(wakeLockManager.isWakeLockSupported());
  const [showDeloadDialog, setShowDeloadDialog] = useState(false);

  useEffect(() => {
    // Setup visibility change handler for wake lock
    const cleanup = wakeLockManager.reacquireOnVisibilityChange();
    return () => {
      if (cleanup) cleanup.then(fn => fn && fn());
    };
  }, []);

  const handleToggleSound = () => {
    const newState = audioService.toggleMute();
    setIsMuted(newState);
  };

  const handleToggleWakeLock = async () => {
    if (wakeLockActive) {
      await wakeLockManager.releaseWakeLock();
      setWakeLockActive(false);
    } else {
      const success = await wakeLockManager.requestWakeLock();
      setWakeLockActive(success);
    }
  };

  const handleDeloadClick = () => {
    setShowDeloadDialog(true);
  };

  const handleConfirmDeload = async () => {
    try {
      await triggerDeloadWeek();
      setShowDeloadDialog(false);
    } catch (error) {
      console.error('Error triggering deload week:', error);
    }
  };

  const handleCancelDeload = () => {
    setShowDeloadDialog(false);
  };

  return (
    <Box
      component="header"
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: '56px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-start',
        padding: '0 1rem',
        background: theme.palette.background.paper,
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        boxShadow: 'none',
        zIndex: 100,
        borderBottom: `1px solid ${theme.palette.divider}`,
      }}
    >
      {/* Left-aligned favicon icon */}
      <Box 
        onClick={() => onNavigate && onNavigate('progress')}
        sx={{
          display: 'flex',
          alignItems: 'center',
          cursor: onNavigate ? 'pointer' : 'default',
          transition: 'transform 0.2s ease',
          '&:hover': onNavigate ? {
            transform: 'scale(1.05)',
          } : {},
          '&:active': onNavigate ? {
            transform: 'scale(0.98)',
          } : {},
        }}
        aria-label={onNavigate ? "Go to Progress screen" : undefined}
        role={onNavigate ? "button" : undefined}
        tabIndex={onNavigate ? 0 : undefined}
        onKeyDown={onNavigate ? (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onNavigate('progress');
          }
        } : undefined}
      >
        <img
          src={`${import.meta.env.BASE_URL}goodlift-favicon.svg`}
          alt="GoodLift"
          style={{ height: '40px', width: '40px', display: 'block' }}
        />
      </Box>

      {/* Center: Week Badge */}
      <Box sx={{
        position: 'absolute',
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        alignItems: 'center',
      }}>
        <WeekBadge
          currentWeek={currentWeek}
          deloadWeekActive={deloadWeekActive}
          onDeloadTrigger={handleDeloadClick}
          clickable={true}
        />
      </Box>
      
      {/* Right controls */}
      <Box sx={{ 
        position: 'absolute',
        right: '1rem',
        display: 'flex',
        alignItems: 'center',
        gap: 0.5 
      }}>
        {/* Sound Toggle */}
        <Tooltip title={isMuted ? 'Unmute sounds' : 'Mute sounds'}>
          <IconButton
            onClick={handleToggleSound}
            sx={{
              color: isMuted ? 'grey.500' : 'primary.main',
              width: '40px',
              height: '40px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              '&:hover': {
                backgroundColor: theme.palette.mode === 'dark'
                  ? 'rgba(29, 181, 132, 0.15)'
                  : 'rgba(24, 160, 113, 0.1)',
              },
            }}
            aria-label={isMuted ? 'Unmute sounds' : 'Mute sounds'}
          >
            {isMuted ? <VolumeOff /> : <VolumeUp />}
          </IconButton>
        </Tooltip>

        {/* Wake Lock Toggle - only show if supported */}
        {wakeLockSupported && (
          <Tooltip title={wakeLockActive ? 'Screen kept awake' : 'Allow screen sleep'}>
            <IconButton
              onClick={handleToggleWakeLock}
              sx={{
                color: wakeLockActive ? 'secondary.main' : 'grey.500',
                width: '40px',
                height: '40px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                '&:hover': {
                  backgroundColor: theme.palette.mode === 'dark'
                    ? 'rgba(255, 140, 0, 0.15)'
                    : 'rgba(255, 140, 0, 0.1)',
                },
              }}
              aria-label={wakeLockActive ? 'Release wake lock' : 'Keep screen awake'}
            >
              {wakeLockActive ? <MdScreenLockRotation size={24} /> : <MdScreenLockPortrait size={24} />}
            </IconButton>
          </Tooltip>
        )}
      </Box>

      {/* Deload Confirmation Dialog */}
      <Dialog
        open={showDeloadDialog}
        onClose={handleCancelDeload}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Trigger Deload Week?</DialogTitle>
        <DialogContent>
          <Typography>
            This will activate deload week, replacing your scheduled workouts with recovery-focused sessions.
            The week counter will continue normally, and deload mode will end after this week completes.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelDeload} color="inherit">
            Cancel
          </Button>
          <Button onClick={handleConfirmDeload} variant="contained" color="warning">
            Activate Deload
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

Header.propTypes = {
  onNavigate: PropTypes.func,
};

export default Header;
