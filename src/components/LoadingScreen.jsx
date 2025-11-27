import { Box, keyframes } from '@mui/material';
import PropTypes from 'prop-types';

// Spinning animation for the favicon (counter-clockwise)
const spin = keyframes`
  from {
    transform: rotate(360deg);
  }
  to {
    transform: rotate(0deg);
  }
`;

/**
 * LoadingScreen - Loading screen displayed while the app is loading
 * 
 * When showLogo is true (default, for initial loading):
 * - Shows the goodlift logo with a rotating goodlift-dog.svg below it
 * - Content is positioned at 1/3 from the top (2/3 from the bottom)
 * 
 * When showLogo is false (for secondary/in-app loading):
 * - Shows only the rotating goodlift-dog.svg in the same position
 * - No goodlift logo is displayed
 */
const LoadingScreen = ({ showLogo = true }) => {
  const baseUrl = import.meta.env.BASE_URL || '/';
  const logoUrl = `${baseUrl}goodlift-logo.svg`;
  const dogUrl = `${baseUrl}goodlift-dog.svg`;

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        bgcolor: 'background.default',
      }}
    >
      {/* Top spacer - takes 1/3 of the viewport */}
      <Box sx={{ flex: 1 }} />
      
      {/* Content container - centered horizontally */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 4,
        }}
      >
        {/* Main Logo - only shown on initial loading screen */}
        {showLogo && (
          <Box
            component="img"
            src={logoUrl}
            alt="GoodLift"
            sx={{
              width: { xs: '200px', sm: '280px', md: '320px' },
              height: 'auto',
              maxWidth: '80vw',
            }}
          />
        )}
        
        {/* Spinning Dog Favicon */}
        <Box
          component="img"
          src={dogUrl}
          alt="Loading..."
          sx={{
            width: { xs: '40px', sm: '48px' },
            height: { xs: '40px', sm: '48px' },
            animation: `${spin} 1.5s linear infinite`,
          }}
        />
      </Box>
      
      {/* Bottom spacer - takes 2/3 of the viewport */}
      <Box sx={{ flex: 2 }} />
    </Box>
  );
};

LoadingScreen.propTypes = {
  showLogo: PropTypes.bool,
};

export default LoadingScreen;
