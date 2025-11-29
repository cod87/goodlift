import { useState } from 'react';
import PropTypes from 'prop-types';
import { Box, Tabs, Tab, useMediaQuery } from '@mui/material';
import { 
  FitnessCenter,
  DirectionsRun,
  EditNote,
  Restaurant,
} from '@mui/icons-material';
import StrengthTab from './WorkTabs/StrengthTab';
import MobilityTab from './WorkTabs/MobilityTab';
import LogActivityTab from './WorkTabs/LogActivityTab';
import NutritionTab from './WorkTabs/NutritionTab';
import { BREAKPOINTS } from '../theme/responsive';

/**
 * WorkTabs - Main Work area component with four sub-tabs
 * 
 * Tabs:
 * 1. Strength - Shows integrated workout configuration and quick start
 * 2. Mobility - Timer functionality for mobility workouts (cardio, yoga)
 * 3. Activity - Manual activity logging
 * 4. Nutrition - Food tracking with USDA FoodData Central API
 * 
 * Desktop: Wider layout with enhanced spacing
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
  const isDesktop = useMediaQuery(`(min-width: ${BREAKPOINTS.desktop}px)`);

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
        padding: { xs: 1.5, sm: 1.5, md: 2, lg: 3 },
        paddingTop: { xs: 0.5, sm: 0.5, md: 1, lg: 1.5 },
        // Desktop: wider max-width to utilize screen space
        maxWidth: isDesktop ? '1400px' : '1200px',
        margin: '0 auto',
        minHeight: 'calc(100vh - 48px)',
        paddingBottom: { xs: '80px', md: '2rem' },
      }}
    >
      {/* Tabs Navigation - More compact */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 1.5 }}>
        <Tabs 
          value={activeTab} 
          onChange={handleTabChange}
          variant="fullWidth"
          sx={{
            // Desktop: limit tab width for better aesthetics
            maxWidth: isDesktop ? '600px' : '100%',
            margin: isDesktop ? '0 auto' : '0',
            '& .MuiTab-root': {
              minHeight: 48,
              fontSize: { xs: '0.8rem', sm: '0.9rem', lg: '1rem' },
              fontWeight: 600,
              transition: 'color 0.3s ease',
              py: 1,
              '&.Mui-selected': {
                color: activeTab === 0 ? 'primary.main' : activeTab === 1 ? 'secondary.main' : activeTab === 2 ? 'success.main' : 'warning.main',
              },
            },
            '& .MuiTabs-indicator': {
              height: 2,
              borderRadius: '2px 2px 0 0',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              backgroundColor: activeTab === 0 ? 'primary.main' : activeTab === 1 ? 'secondary.main' : activeTab === 2 ? 'success.main' : 'warning.main',
            },
          }}
        >
          <Tab 
            icon={<FitnessCenter sx={{ fontSize: '1.1rem' }} />} 
            label={<Box sx={{ display: { xs: 'none', sm: 'block' } }}>Strength</Box>}
            iconPosition="start"
          />
          <Tab 
            icon={<DirectionsRun sx={{ fontSize: '1.1rem' }} />} 
            label={<Box sx={{ display: { xs: 'none', sm: 'block' } }}>Mobility</Box>}
            iconPosition="start"
          />
          <Tab 
            icon={<EditNote sx={{ fontSize: '1.1rem' }} />} 
            label={<Box sx={{ display: { xs: 'none', sm: 'block' } }}>Activity</Box>}
            iconPosition="start"
          />
          <Tab 
            icon={<Restaurant sx={{ fontSize: '1.1rem' }} />} 
            label={<Box sx={{ display: { xs: 'none', sm: 'block' } }}>Nutrition</Box>}
            iconPosition="start"
          />
        </Tabs>
      </Box>

      {/* Tab Content - Reduced top margin */}
      <Box sx={{ mt: 1 }}>
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
        {activeTab === 3 && (
          <NutritionTab onNavigate={onNavigate} />
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
