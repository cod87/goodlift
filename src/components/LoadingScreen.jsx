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
 */
const LoadingScreen = () => {
  const baseUrl = import.meta.env.BASE_URL || '/';
  const logoUrl = `${baseUrl}goodlift-logo.svg`;
  const faviconUrl = `${baseUrl}goodlift-favicon.svg`;

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-start',
        minHeight: '100vh',
        bgcolor: 'background.default',
        gap: 4,
        pt: 'calc((100vh - 300px) / 3)', // Position 1/3 from top (2/3 from bottom)
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
  );
};

export default LoadingScreen;
