import { memo } from 'react';
import PropTypes from 'prop-types';
import { useTheme, useMediaQuery } from '@mui/material';
import { 
  TrendingUp,
  TrendingUpOutlined,
  Settings,
  SettingsOutlined,
} from '@mui/icons-material';
import { touchTargets, zIndex, BREAKPOINTS } from '../../theme/responsive';

// Single highlight color for all nav items
const ACTIVE_COLOR = '#1db584';

/**
 * BottomNav - Responsive navigation component
 * 
 * Features:
 * - Mobile/Tablet: Fixed bottom navigation
 * - Desktop (≥1024px): Vertical sidebar navigation on the left
 * - 3 navigation icons: Work, Progress, Settings
 * - Touch-friendly targets (56-64px)
 * - Safe area padding for devices with home indicators
 * - Active state indication with primary color
 * - Smooth transitions
 */
const BottomNav = memo(({ currentScreen, onNavigate }) => {
  const theme = useTheme();
  const isDesktop = useMediaQuery(`(min-width: ${BREAKPOINTS.desktop}px)`);
  
  const navItems = [
    {
      id: 'home',
      label: 'Work',
      iconActive: null, // Use custom SVG
      iconInactive: null, // Use custom SVG
      customIcon: 'goodlift-favicon.svg',
      screens: [
        'home', 
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

  // Desktop sidebar navigation
  if (isDesktop) {
    return (
      <nav
        style={{
          position: 'fixed',
          left: 0,
          top: 0,
          width: '80px',
          height: '100vh',
          backgroundColor: theme.palette.background.paper,
          borderRight: `1px solid ${theme.palette.divider}`,
          zIndex: zIndex.navigation,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          paddingTop: '1rem',
          gap: '0.5rem',
        }}
      >
        {/* Logo at top */}
        <div style={{
          marginBottom: '1.5rem',
          padding: '0.5rem',
        }}>
          <img 
            src={`${import.meta.env.BASE_URL || '/'}goodlift-favicon.svg`} 
            alt="GoodLift"
            style={{
              width: '40px',
              height: '40px',
            }}
          />
        </div>

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
                width: '64px',
                height: '64px',
                background: active ? `${ACTIVE_COLOR}15` : 'transparent',
                border: 'none',
                borderRadius: '12px',
                cursor: 'pointer',
                color: active ? ACTIVE_COLOR : theme.palette.text.secondary,
                transition: 'all 0.2s ease',
                padding: '8px',
              }}
              aria-label={item.label}
              aria-current={active ? 'page' : undefined}
            >
              {/* Icon */}
              <div style={{
                fontSize: '1.5rem',
                marginBottom: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                {item.customIcon ? (
                  <img 
                    src={`${baseUrl}${item.customIcon}`} 
                    alt={item.label}
                    style={{
                      width: '28px',
                      height: '28px',
                      filter: active 
                        ? 'none' 
                        : theme.palette.mode === 'dark'
                          ? 'brightness(0.6)'
                          : 'brightness(0.5)',
                    }}
                  />
                ) : (
                  <Icon sx={{ fontSize: '1.75rem' }} />
                )}
              </div>
              
              {/* Label */}
              <span style={{
                fontSize: '0.65rem',
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
  }

  // Mobile/Tablet bottom navigation
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
