import { memo } from 'react';
import PropTypes from 'prop-types';
import { motion } from 'framer-motion';
import { 
  FitnessCenter,
  FitnessCenterOutlined,
  TrendingUp,
  TrendingUpOutlined,
  Settings,
  SettingsOutlined,
} from '@mui/icons-material';
import { touchTargets, zIndex, safeAreaPadding } from '../../theme/responsive';

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
  const navItems = [
    {
      id: 'home',
      label: 'Work',
      iconActive: FitnessCenter,
      iconInactive: FitnessCenterOutlined,
      screens: [
        'home', 
        'workout-plan', 
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
    <motion.nav
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        height: touchTargets.navigation,
        backgroundColor: '#2a3647',
        borderTop: '1px solid rgba(29, 181, 132, 0.2)',
        boxShadow: '0 -2px 10px rgba(0, 0, 0, 0.3)',
        zIndex: zIndex.navigation,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-around',
        paddingBottom: safeAreaPadding.bottom,
        paddingLeft: safeAreaPadding.left,
        paddingRight: safeAreaPadding.right,
      }}
    >
      {navItems.map((item) => {
        const active = isActive(item);
        const Icon = active ? item.iconActive : item.iconInactive;
        
        return (
          <motion.button
            key={item.id}
            onClick={() => handleNavClick(item.id)}
            whileTap={{ scale: 0.9 }}
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
              color: active ? '#1db584' : '#a0a8b3',
              transition: 'color 0.2s ease',
              padding: '8px 4px',
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
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: '24px',
                  height: '2px',
                  backgroundColor: '#1db584',
                  borderRadius: '0 0 2px 2px',
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
