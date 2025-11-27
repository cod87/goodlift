import { Box, keyframes } from '@mui/material';

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
 * LoadingScreen - Initial loading screen displayed while the app is initializing
 * Shows the goodlift logo with a rotating favicon below it
 * Content is positioned at 1/3 from the top (2/3 from the bottom)
 */
const LoadingScreen = () => {
  const baseUrl = import.meta.env.BASE_URL || '/';
  const logoUrl = `${baseUrl}goodlift-logo.svg`;
  const faviconUrl = `${baseUrl}goodlift-dog.svg`;

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
        {/* Main Logo */}
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
        
        {/* Spinning Favicon */}
        <Box
          component="img"
          src={faviconUrl}
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

export default LoadingScreen;
