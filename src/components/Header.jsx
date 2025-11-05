import { useState, useEffect } from 'react';
import { Box, IconButton, Tooltip } from '@mui/material';
import { VolumeUp, VolumeOff } from '@mui/icons-material';
import { MdScreenLockPortrait, MdScreenLockRotation } from 'react-icons/md';
import PropTypes from 'prop-types';
import audioService from '../utils/audioService';
import wakeLockManager from '../utils/wakeLock';

/**
 * Header component - Sticky header with logo, sound toggle, and wake lock toggle
 * Appears at the top of all screens
 */
const Header = ({ isDesktop }) => {
  const [isMuted, setIsMuted] = useState(audioService.isMutedState());
  const [wakeLockActive, setWakeLockActive] = useState(wakeLockManager.isActive());
  const [wakeLockSupported] = useState(wakeLockManager.isWakeLockSupported());

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

  return (
    <Box
      component="header"
      sx={{
        position: 'fixed',
        top: 0,
        left: isDesktop ? '280px' : 0,
        right: 0,
        height: '60px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 1rem',
        background: 'rgba(255, 255, 255, 0.75)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        boxShadow: '0 2px 8px rgba(19, 70, 134, 0.08)',
        zIndex: 100,
        transition: 'left 0.3s ease',
      }}
    >
      {/* Left spacer for mobile */}
      <Box sx={{ width: '40px' }} />
      
      {/* Center logo */}
      <img
        src={`${import.meta.env.BASE_URL}goodlift-logo.svg`}
        alt="GoodLift"
        style={{ height: '40px', width: 'auto' }}
      />
      
      {/* Right controls */}
      <Box sx={{ display: 'flex', gap: 0.5 }}>
        {/* Sound Toggle */}
        <Tooltip title={isMuted ? 'Unmute sounds' : 'Mute sounds'}>
          <IconButton
            onClick={handleToggleSound}
            sx={{
              color: isMuted ? 'grey.500' : 'primary.main',
              '&:hover': {
                backgroundColor: 'rgba(19, 70, 134, 0.08)',
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
                '&:hover': {
                  backgroundColor: 'rgba(237, 63, 39, 0.08)',
                },
              }}
              aria-label={wakeLockActive ? 'Release wake lock' : 'Keep screen awake'}
            >
              {wakeLockActive ? <MdScreenLockRotation size={24} /> : <MdScreenLockPortrait size={24} />}
            </IconButton>
          </Tooltip>
        )}
      </Box>
    </Box>
  );
};

Header.propTypes = {
  isDesktop: PropTypes.bool.isRequired,
};

export default Header;
