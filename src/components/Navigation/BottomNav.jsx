import { memo } from 'react';
import PropTypes from 'prop-types';
import { useTheme } from '@mui/material';
import { motion } from 'framer-motion';
import { 
  TrendingUp,
  TrendingUpOutlined,
  Settings,
  SettingsOutlined,
} from '@mui/icons-material';
import { touchTargets, zIndex } from '../../theme/responsive';

// Single highlight color for all nav items
const ACTIVE_COLOR = '#1db584';

/**
 * BottomNav - Fixed bottom navigation for all devices
 * 
 * Features:
 * - Fixed position at bottom of screen
 * - 3 navigation icons: Work, Progress, Settings
 * - 56-64px height for comfortable touch targets
 * - Safe area padding for devices with home indicators
 * - Active state indication with primary color
 * - Smooth transitions
 * 
 * Visible on all screen sizes
 */
const BottomNav = memo(({ currentScreen, onNavigate }) => {
  const theme = useTheme();
  const navItems = [
    {
      id: 'home',
      label: 'Work',
      iconActive: null, // Use custom SVG
      iconInactive: null, // Use custom SVG
      customIcon: 'work-icon.svg',
      screens: [
        'home', 
        'selection', 
        'preview', 
        'workout', 
        'customize', 
        'custom-preview',
        'completion',
        'timer',
        'cardio',
        'hiit'
      ],
    },
    {
      id: 'progress',
      label: 'Progress',
      iconActive: TrendingUp,
      iconInactive: TrendingUpOutlined,
      screens: ['progress'],
    },
    {
      id: 'settings',
      label: 'Settings',
      iconActive: Settings,
      iconInactive: SettingsOutlined,
      screens: ['settings', 'log-activity', 'exercise-list', 'profile', 'stretch', 'mobility'],
    },
  ];

  const handleNavClick = (screenId) => {
    onNavigate(screenId);
  };

  const isActive = (item) => {
    return item.screens.includes(currentScreen);
  };

  return (
    <nav
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        height: `calc(${touchTargets.navigation} + env(safe-area-inset-bottom))`,
        backgroundColor: theme.palette.background.default,
        borderTop: `1px solid ${theme.palette.divider}`,
        zIndex: zIndex.navigation,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-around',
        paddingBottom: `env(safe-area-inset-bottom)`,
        paddingLeft: `env(safe-area-inset-left)`,
        paddingRight: `env(safe-area-inset-right)`,
      }}
    >
      {navItems.map((item) => {
        const active = isActive(item);
        const Icon = active ? item.iconActive : item.iconInactive;
        const baseUrl = import.meta.env.BASE_URL || '/';
        
        return (
          <button
            key={item.id}
            onClick={() => handleNavClick(item.id)}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              flex: 1,
              height: '100%',
              minWidth: touchTargets.minimum,
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: active ? ACTIVE_COLOR : theme.palette.text.secondary,
              transition: 'color 0.2s ease, opacity 0.15s ease',
              padding: '8px 4px',
              position: 'relative',
            }}
            aria-label={item.label}
            aria-current={active ? 'page' : undefined}
          >
            {/* Icon */}
            <div style={{
              fontSize: '1.5rem',
              marginBottom: '2px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              {item.customIcon ? (
                <img 
                  src={`${baseUrl}${item.customIcon}`} 
                  alt={item.label}
                  style={{
                    width: '24px',
                    height: '24px',
                    filter: active 
                      ? 'none' 
                      : theme.palette.mode === 'dark'
                        ? 'brightness(0.6)'
                        : 'brightness(0.5)',
                  }}
                />
              ) : (
                <Icon sx={{ fontSize: '1.5rem' }} />
              )}
            </div>
            
            {/* Label */}
            <span style={{
              fontSize: '0.625rem',
              fontWeight: active ? 600 : 400,
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              lineHeight: 1,
            }}>
              {item.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
});

BottomNav.displayName = 'BottomNav';

BottomNav.propTypes = {
  currentScreen: PropTypes.string.isRequired,
  onNavigate: PropTypes.func.isRequired,
};

export default BottomNav;
