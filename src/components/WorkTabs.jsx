import { useState } from 'react';
import PropTypes from 'prop-types';
import { Box, Tabs, Tab } from '@mui/material';
import { 
  FitnessCenter,
  DirectionsRun,
  EditNote,
} from '@mui/icons-material';
import StrengthTab from './WorkTabs/StrengthTab';
import MobilityTab from './WorkTabs/MobilityTab';
import LogActivityTab from './WorkTabs/LogActivityTab';

/**
 * WorkTabs - Main Work area component with three sub-tabs
 * 
 * Tabs:
 * 1. Strength - Shows integrated workout configuration and quick start
 * 2. Mobility - Timer functionality for mobility workouts (cardio, yoga)
 * 3. Activity - Manual activity logging
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

  // Public method to change tab programmatically
  const changeTab = (tabIndex) => {
    setActiveTab(tabIndex);
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
              transition: 'color 0.3s ease',
              '&.Mui-selected': {
                color: activeTab === 0 ? 'primary.main' : activeTab === 1 ? 'secondary.main' : 'success.main',
              },
            },
            '& .MuiTabs-indicator': {
              height: 3,
              borderRadius: '3px 3px 0 0',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              backgroundColor: activeTab === 0 ? 'primary.main' : activeTab === 1 ? 'secondary.main' : 'success.main',
            },
          }}
        >
          <Tab 
            icon={<FitnessCenter />} 
            label="Strength" 
            iconPosition="start"
          />
          <Tab 
            icon={<DirectionsRun />} 
            label="Mobility" 
            iconPosition="start"
          />
          <Tab 
            icon={<EditNote />} 
            label="Activity" 
            iconPosition="start"
          />
        </Tabs>
      </Box>

      {/* Tab Content */}
      <Box sx={{ mt: 2 }}>
        {activeTab === 0 && (
          <StrengthTab
            onNavigate={onNavigate}
            loading={loading}
            workoutType={workoutType}
            selectedEquipment={selectedEquipment}
            equipmentOptions={equipmentOptions}
            onWorkoutTypeChange={onWorkoutTypeChange}
            onEquipmentChange={onEquipmentChange}
            onStartWorkout={onStartWorkout}
            onCustomize={onCustomize}
            onTabChange={changeTab}
          />
        )}
        {activeTab === 1 && (
          <MobilityTab onNavigate={onNavigate} />
        )}
        {activeTab === 2 && (
          <LogActivityTab onNavigate={onNavigate} />
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
