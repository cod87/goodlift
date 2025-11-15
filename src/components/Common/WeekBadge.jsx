import { memo } from 'react';
import PropTypes from 'prop-types';
import { Box, Chip, Tooltip, useTheme } from '@mui/material';
import { TrendingDown } from '@mui/icons-material';

/**
 * WeekBadge - Displays current day and week number in badge format
 * Format: "DAY | WK #"
 * Example: "MON | WK 5"
 * 
 * Features:
 * - Three-letter day abbreviation
 * - Week number with "WK" prefix
 * - Deload week indicator (color change + optional icon)
 * - Interactive for deload trigger (week 4+)
 */
const WeekBadge = memo(({ 
  currentWeek = 1,
  deloadWeekActive = false,
  onDeloadTrigger,
  clickable = false,
}) => {
  const theme = useTheme();

  // Get current day abbreviation (MON, TUE, WED, etc.)
  const getCurrentDayAbbrev = () => {
    const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
    const today = new Date();
    return days[today.getDay()];
  };

  const dayAbbrev = getCurrentDayAbbrev();
  const canTriggerDeload = currentWeek >= 4 && !deloadWeekActive && clickable;

  // Determine badge color
  const getBadgeColor = () => {
    if (deloadWeekActive) {
      return {
        backgroundColor: theme.palette.mode === 'dark' 
          ? 'rgba(255, 152, 0, 0.2)' 
          : 'rgba(255, 152, 0, 0.15)',
        color: theme.palette.warning.main,
        border: `1px solid ${theme.palette.warning.main}`,
      };
    }
    
    return {
      backgroundColor: theme.palette.mode === 'dark' 
        ? 'rgba(29, 181, 132, 0.2)' 
        : 'rgba(29, 181, 132, 0.15)',
      color: theme.palette.primary.main,
      border: `1px solid ${theme.palette.mode === 'dark' 
        ? 'rgba(29, 181, 132, 0.3)' 
        : 'rgba(29, 181, 132, 0.3)'}`,
    };
  };

  const badgeStyle = getBadgeColor();

  const handleClick = () => {
    if (canTriggerDeload && onDeloadTrigger) {
      onDeloadTrigger();
    }
  };

  const badge = (
    <Box
      onClick={handleClick}
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 0.5,
        padding: '4px 12px',
        borderRadius: '16px',
        fontWeight: 600,
        fontSize: '0.875rem',
        letterSpacing: '0.5px',
        cursor: canTriggerDeload ? 'pointer' : 'default',
        transition: 'all 0.2s ease',
        ...badgeStyle,
        '&:hover': canTriggerDeload ? {
          transform: 'scale(1.05)',
          boxShadow: theme.palette.mode === 'dark'
            ? '0 2px 8px rgba(0, 0, 0, 0.3)'
            : '0 2px 8px rgba(0, 0, 0, 0.15)',
        } : {},
        '&:active': canTriggerDeload ? {
          transform: 'scale(0.98)',
        } : {},
      }}
      role={canTriggerDeload ? 'button' : undefined}
      tabIndex={canTriggerDeload ? 0 : undefined}
      onKeyDown={canTriggerDeload ? (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
      } : undefined}
      aria-label={canTriggerDeload 
        ? `Week ${currentWeek} - Click to trigger deload week`
        : `${dayAbbrev}, Week ${currentWeek}${deloadWeekActive ? ' (Deload)' : ''}`
      }
    >
      {/* Day abbreviation */}
      <Box component="span" sx={{ fontWeight: 700 }}>
        {dayAbbrev}
      </Box>

      {/* Separator */}
      <Box 
        component="span" 
        sx={{ 
          fontSize: '1rem',
          opacity: 0.6,
          mx: 0.25,
        }}
      >
        |
      </Box>

      {/* Week number or DELOAD label */}
      <Box component="span" sx={{ fontWeight: 600 }}>
        {deloadWeekActive ? 'DELOAD' : `WK ${currentWeek}`}
      </Box>

      {/* Optional deload icon */}
      {deloadWeekActive && (
        <TrendingDown sx={{ fontSize: '1rem', ml: 0.25 }} />
      )}
    </Box>
  );

  // Wrap with tooltip if clickable (deload available)
  if (canTriggerDeload) {
    return (
      <Tooltip title="Click to trigger deload week" arrow>
        {badge}
      </Tooltip>
    );
  }

  return badge;
});

WeekBadge.displayName = 'WeekBadge';

WeekBadge.propTypes = {
  currentWeek: PropTypes.number,
  deloadWeekActive: PropTypes.bool,
  onDeloadTrigger: PropTypes.func,
  clickable: PropTypes.bool,
};

export default WeekBadge;
