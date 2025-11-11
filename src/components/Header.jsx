import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Box, IconButton, Tooltip } from '@mui/material';
import { VolumeUp, VolumeOff } from '@mui/icons-material';
import { MdScreenLockPortrait, MdScreenLockRotation } from 'react-icons/md';
import audioService from '../utils/audioService';
import wakeLockManager from '../utils/wakeLock';

/**
 * Header component - Sticky header with logo, sound toggle, and wake lock toggle
 * Appears at the top of all screens
 */
const Header = ({ onNavigate }) => {
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
        left: 0,
        right: 0,
        height: '60px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0 1rem',
        background: '#2a3647',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
        zIndex: 100,
        transition: 'left 0.3s ease',
        borderBottom: '1px solid rgba(29, 181, 132, 0.2)',
      }}
    >
      {/* Center favicon icon */}
      <Box 
        onClick={() => onNavigate && onNavigate('progress')}
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
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
                backgroundColor: 'rgba(29, 181, 132, 0.15)',
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
                  backgroundColor: 'rgba(255, 140, 0, 0.15)',
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
  onNavigate: PropTypes.func,
};

export default Header;
