import PropTypes from 'prop-types';
import { Box } from '@mui/material';
import UnifiedTimerScreen from '../../pages/UnifiedTimerScreen';

/**
 * TimerTab - Wraps the UnifiedTimerScreen for use in the Work tabs
 * Provides timer functionality within the Work area
 */
const TimerTab = ({ onNavigate }) => {
  return (
    <Box>
      <UnifiedTimerScreen onNavigate={onNavigate} hideBackButton={true} />
    </Box>
  );
};

TimerTab.propTypes = {
  onNavigate: PropTypes.func,
};

export default TimerTab;
