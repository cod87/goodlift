import { memo } from 'react';
import PropTypes from 'prop-types';
import { useTheme } from '@mui/material';
import { motion } from 'framer-motion';
import { 
  FitnessCenter,
  FitnessCenterOutlined,
  TrendingUp,
  TrendingUpOutlined,
  Settings,
  SettingsOutlined,
} from '@mui/icons-material';
import { touchTargets, zIndex } from '../../theme/responsive';

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
      iconActive: FitnessCenter,
      iconInactive: FitnessCenterOutlined,
      activeColor: '#1db584', // Green
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
      ], // removed 'workout-plan' - no longer using workout planning
    },
    {
      id: 'progress',
      label: 'Progress',
      iconActive: TrendingUp,
      iconInactive: TrendingUpOutlined,
      activeColor: '#6b8a9d', // Blue accent
      screens: ['progress'],
    },
    {
      id: 'settings',
      label: 'Settings',
      iconActive: Settings,
      iconInactive: SettingsOutlined,
      activeColor: '#ff8c00', // Orange accent
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
    <motion.nav
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        height: `calc(${touchTargets.navigation} + env(safe-area-inset-bottom))`,
        backgroundColor: theme.palette.background.paper,
        borderTop: `1px solid ${theme.palette.mode === 'dark' 
          ? 'rgba(29, 181, 132, 0.2)' 
          : 'rgba(0, 0, 0, 0.12)'}`,
        boxShadow: theme.palette.mode === 'dark' 
          ? '0 -2px 10px rgba(0, 0, 0, 0.3)' 
          : '0 -2px 10px rgba(0, 0, 0, 0.1)',
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
        
        return (
          <motion.button
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
              color: active ? item.activeColor : theme.palette.text.secondary,
              transition: 'color 0.2s ease, opacity 0.15s ease',
              padding: '8px 4px',
            }}
            aria-label={item.label}
            aria-current={active ? 'page' : undefined}
            whilePressed={{ opacity: 0.7 }}
          >
            {/* Icon */}
            <div style={{
              fontSize: '1.5rem',
              marginBottom: '2px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Icon sx={{ fontSize: '1.5rem' }} />
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
            
            {/* Active indicator */}
            {active && (
              <motion.div
                layoutId="bottomNavIndicator"
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  width: '100%',
                  height: '3px',
                  backgroundColor: item.activeColor,
                  borderRadius: '0 0 3px 3px',
                }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              />
            )}
          </motion.button>
        );
      })}
    </motion.nav>
  );
});

BottomNav.displayName = 'BottomNav';

BottomNav.propTypes = {
  currentScreen: PropTypes.string.isRequired,
  onNavigate: PropTypes.func.isRequired,
};

export default BottomNav;
