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
 * LoadingScreen - Loading screen displayed while the app is loading
 * 
 * Shows a large rotating goodlift-dog.svg centered on screen.
 * Content is positioned at 1/3 from the top (2/3 from the bottom).
 */
const LoadingScreen = () => {
  const baseUrl = import.meta.env.BASE_URL || '/';
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
        {/* Spinning Dog - substantially larger for visibility */}
        <Box
          component="img"
          src={dogUrl}
          alt="Loading..."
          sx={{
            width: { xs: '120px', sm: '160px', md: '200px' },
            height: { xs: '120px', sm: '160px', md: '200px' },
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
