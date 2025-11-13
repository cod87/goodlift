/**
 * PlanBasicsScreen - Demo/test screen for PlanBasicsForm component
 * This screen wraps the PlanBasicsForm component and handles navigation
 */

import { useState } from 'react';
import PropTypes from 'prop-types';
import { Box } from '@mui/material';
import CompactHeader from '../components/Common/CompactHeader';
import PlanBasicsForm from '../components/PlanBuilder/PlanBasicsForm';

const PlanBasicsScreen = ({ onNavigate }) => {
  const [formData, setFormData] = useState({});

  const handleNext = (data) => {
    console.log('Plan basics data:', data);
    setFormData(data);
    
    // TODO: Navigate to step 2 when it's implemented
    // For now, just log the data and stay on this screen
    alert(`Plan created!\nName: ${data.planName || 'Untitled Plan'}\nType: ${data.planType}`);
    
    // Navigate back to workout-plan screen
    if (onNavigate) {
      onNavigate('workout-plan');
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: 'background.default'
      }}
    >
      <CompactHeader
        title="Create New Plan"
        onBack={() => onNavigate('workout-plan')}
      />
      
      <Box sx={{ flex: 1, mt: '60px' }}>
        <PlanBasicsForm
          onNext={handleNext}
          initialValues={formData}
        />
      </Box>
    </Box>
  );
};

PlanBasicsScreen.propTypes = {
  onNavigate: PropTypes.func.isRequired
};

export default PlanBasicsScreen;
