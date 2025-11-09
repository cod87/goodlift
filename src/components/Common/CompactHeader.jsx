import PropTypes from 'prop-types';
import { Typography, Box } from '@mui/material';

/**
 * CompactHeader - Standardized compact header component
 * Used across all screens to maintain consistency and reduce whitespace
 */
const CompactHeader = ({ 
  title, 
  icon, 
  action 
}) => (
  <Box sx={{ 
    display: 'flex', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    py: 1, // compact padding (reduced from 2-3)
    px: 2,
    borderBottom: '1px solid', 
    borderColor: 'divider'
  }}>
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      {icon && <span style={{ fontSize: '1.2rem' }}>{icon}</span>}
      <Typography variant="h6" sx={{ fontSize: '1.1rem', fontWeight: 700 }}>
        {title}
      </Typography>
    </Box>
    {action && action}
  </Box>
);

CompactHeader.propTypes = {
  title: PropTypes.string.isRequired,
  icon: PropTypes.node,
  action: PropTypes.node,
};

export default CompactHeader;
