import { useState } from 'react';
import PropTypes from 'prop-types';
import { Box, Tabs, Tab } from '@mui/material';
import { 
  FitnessCenter,
  Timer as TimerIcon,
} from '@mui/icons-material';
import WorkoutTab from './WorkTabs/WorkoutTab';
import TimerTab from './WorkTabs/TimerTab';

/**
 * WorkTabs - Main Work area component with two sub-tabs
 * 
 * Tabs:
 * 1. Workout - Shows integrated workout configuration and quick start
 * 2. Timer - Timer functionality for workouts
 */
const WorkTabs = ({ 
  onNavigate,
  loading = false,
  // Workout configuration props
  workoutType,
  selectedEquipment,
  equipmentOptions,
  onWorkoutTypeChange,
  onEquipmentChange,
  onStartWorkout,
  onCustomize,
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
          <WorkoutTab
            onNavigate={onNavigate}
            loading={loading}
            workoutType={workoutType}
            selectedEquipment={selectedEquipment}
            equipmentOptions={equipmentOptions}
            onWorkoutTypeChange={onWorkoutTypeChange}
            onEquipmentChange={onEquipmentChange}
            onStartWorkout={onStartWorkout}
            onCustomize={onCustomize}
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
  onNavigate: PropTypes.func,
  loading: PropTypes.bool,
  // Workout configuration props
  workoutType: PropTypes.string,
  selectedEquipment: PropTypes.instanceOf(Set),
  equipmentOptions: PropTypes.array,
  onWorkoutTypeChange: PropTypes.func,
  onEquipmentChange: PropTypes.func,
  onStartWorkout: PropTypes.func,
  onCustomize: PropTypes.func,
};

export default WorkTabs;
