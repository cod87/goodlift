import { Box } from '@mui/material';
import PropTypes from 'prop-types';

/**
 * Header component - Sticky header with logo and semi-transparent blur effect
 * Appears at the top of all screens
 */
const Header = ({ isDesktop }) => {
  return (
    <Box
      component="header"
      sx={{
        position: 'fixed',
        top: 0,
        left: isDesktop ? '280px' : 0,
        right: 0,
        height: '60px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(255, 255, 255, 0.75)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        boxShadow: '0 2px 8px rgba(19, 70, 134, 0.08)',
        zIndex: 100,
        transition: 'left 0.3s ease',
      }}
    >
      <img
        src={`${import.meta.env.BASE_URL}goodlift-logo.svg`}
        alt="GoodLift"
        style={{ height: '40px', width: 'auto' }}
      />
    </Box>
  );
};

Header.propTypes = {
  isDesktop: PropTypes.bool.isRequired,
};

export default Header;
