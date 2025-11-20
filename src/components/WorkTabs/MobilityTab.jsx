import PropTypes from 'prop-types';
import { Box } from '@mui/material';
import UnifiedTimerScreen from '../../pages/UnifiedTimerScreen';

/**
 * MobilityTab - Wraps the UnifiedTimerScreen for use in the Work tabs
 * Provides timer functionality for mobility workouts (cardio, yoga, etc.) within the Work area
 */
const MobilityTab = ({ onNavigate }) => {
  return (
    <Box>
      <UnifiedTimerScreen onNavigate={onNavigate} hideBackButton={true} />
    </Box>
  );
};

MobilityTab.propTypes = {
  onNavigate: PropTypes.func,
};

export default MobilityTab;
