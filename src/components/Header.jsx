import { useState } from 'react';
import PropTypes from 'prop-types';
import { Box, useTheme, useMediaQuery, Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography } from '@mui/material';
import WeekBadge from './Common/WeekBadge';
import { useWeekScheduling } from '../contexts/WeekSchedulingContext';
import { BREAKPOINTS } from '../theme/responsive';

// Tab name mapping - defined outside component for performance
const TAB_DISPLAY_NAMES = {
  'home': 'Work',
  'workout': 'Workout',
  'completion': 'Workout Complete',
  'progress': 'Progress',
  'settings': 'Settings',
  'profile': 'Profile',
  'exercise-list': 'Exercise Library',
  'cardio': 'Timer',
  'hiit': 'Timer',
  'timer': 'Timer',
  'stretch': 'Mobility',
  'mobility': 'Mobility',
  'log-activity': 'Log Activity',
  'edit-weekly-schedule': 'Weekly Schedule',
};

/**
 * Header component - Compact, minimalist sticky header
 * Shows current tab/subtab name on left, week badge on right
 * Sound and wake lock controls moved to timer modals
 * Desktop: Offset to account for sidebar navigation
 */
const Header = ({ currentTab, currentSubtab }) => {
  const theme = useTheme();
  const isDesktop = useMediaQuery(`(min-width: ${BREAKPOINTS.desktop}px)`);
  const { currentWeek, deloadWeekActive, triggerDeloadWeek } = useWeekScheduling();
  const [showDeloadDialog, setShowDeloadDialog] = useState(false);

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

  // Get display name for current tab
  const tabDisplayName = TAB_DISPLAY_NAMES[currentTab] || 'GoodLift';

  return (
    <Box
      component="header"
      sx={{
        position: 'fixed',
        top: 0,
        // Desktop: offset for sidebar navigation
        left: isDesktop ? '80px' : 0,
        right: 0,
        height: '48px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 1rem',
        // Desktop: more horizontal padding
        paddingLeft: isDesktop ? '2rem' : '1rem',
        paddingRight: isDesktop ? '2rem' : '1rem',
        background: theme.palette.background.default,
        zIndex: 100,
        borderBottom: `1px solid ${theme.palette.divider}`,
      }}
    >
      {/* Left: Tab Name */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        <Typography 
          variant="h6" 
          sx={{ 
            fontWeight: 600, 
            fontSize: '1rem',
            color: 'text.primary',
            letterSpacing: '-0.01em',
          }}
        >
          {tabDisplayName}
        </Typography>
        {currentSubtab && (
          <>
            <Typography 
              sx={{ 
                color: 'text.secondary', 
                fontSize: '1rem',
                mx: 0.5,
              }}
            >
              /
            </Typography>
            <Typography 
              sx={{ 
                fontWeight: 500, 
                fontSize: '0.9rem',
                color: 'text.secondary',
              }}
            >
              {currentSubtab}
            </Typography>
          </>
        )}
      </Box>
      
      {/* Right: Week Badge */}
      <WeekBadge
        currentWeek={currentWeek}
        deloadWeekActive={deloadWeekActive}
        onDeloadTrigger={handleDeloadClick}
        clickable={true}
      />

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
  currentTab: PropTypes.string,
  currentSubtab: PropTypes.string,
};

export default Header;
