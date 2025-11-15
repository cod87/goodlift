import PropTypes from 'prop-types';
import { Box } from '@mui/material';
import UnifiedLogActivityScreen from '../../pages/UnifiedLogActivityScreen';

/**
 * LogActivityTab - Wraps the UnifiedLogActivityScreen for use in the Work tabs
 * Provides activity logging functionality within the Work area
 */
const LogActivityTab = ({ onNavigate }) => {
  return (
    <Box>
      <UnifiedLogActivityScreen onNavigate={onNavigate} hideBackButton={true} />
    </Box>
  );
};

LogActivityTab.propTypes = {
  onNavigate: PropTypes.func,
};

export default LogActivityTab;
