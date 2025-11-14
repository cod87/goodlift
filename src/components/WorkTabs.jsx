import { useState } from 'react';
import PropTypes from 'prop-types';
import { Box, Tabs, Tab } from '@mui/material';
import { 
  FitnessCenter,
  Timer as TimerIcon,
} from '@mui/icons-material';
import UpcomingWeekTab from './WorkTabs/UpcomingWeekTab';
import TimerTab from './WorkTabs/TimerTab';

/**
 * WorkTabs - Main Work area component with two sub-tabs
 * 
 * Tabs:
 * 1. Workout - Shows today's workout, quick start feature, and active plan
 * 2. Timer - Timer functionality for workouts
 */
const WorkTabs = ({ 
  currentPlan,
  todaysWorkout,
  onQuickStart,
  onNavigate,
  loading = false
}) => {
  const [activeTab, setActiveTab] = useState(0);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  return (
    <Box 
      sx={{ 
        padding: { xs: 2, sm: 2, md: 3 },
        maxWidth: '1200px',
        margin: '0 auto',
        minHeight: 'calc(100vh - 60px)',
        paddingBottom: { xs: '80px', md: '2rem' },
      }}
    >
      {/* Tabs Navigation */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs 
          value={activeTab} 
          onChange={handleTabChange}
          variant="fullWidth"
          sx={{
            '& .MuiTab-root': {
              minHeight: 64,
              fontSize: { xs: '0.875rem', sm: '1rem' },
              fontWeight: 600,
            },
          }}
        >
          <Tab 
            icon={<FitnessCenter />} 
            label="Workout" 
            iconPosition="start"
          />
          <Tab 
            icon={<TimerIcon />} 
            label="Timer" 
            iconPosition="start"
          />
        </Tabs>
      </Box>

      {/* Tab Content */}
      <Box sx={{ mt: 2 }}>
        {activeTab === 0 && (
          <UpcomingWeekTab
            currentPlan={currentPlan}
            todaysWorkout={todaysWorkout}
            onQuickStart={onQuickStart}
            onNavigate={onNavigate}
            loading={loading}
          />
        )}
        {activeTab === 1 && (
          <TimerTab onNavigate={onNavigate} />
        )}
      </Box>
    </Box>
  );
};

WorkTabs.propTypes = {
  currentPlan: PropTypes.shape({
    planId: PropTypes.string,
    planStyle: PropTypes.string,
    days: PropTypes.arrayOf(PropTypes.shape({
      type: PropTypes.string,
      subtype: PropTypes.string,
      focus: PropTypes.string,
      estimatedDuration: PropTypes.number,
    })),
  }),
  todaysWorkout: PropTypes.shape({
    type: PropTypes.string,
    focus: PropTypes.string,
    estimatedDuration: PropTypes.number,
  }),
  onQuickStart: PropTypes.func.isRequired,
  onNavigate: PropTypes.func,
  loading: PropTypes.bool,
};

export default WorkTabs;
