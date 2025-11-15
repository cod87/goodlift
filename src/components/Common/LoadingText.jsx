import { Box, Typography } from '@mui/material';
import { motion } from 'framer-motion';

/**
 * Simple text-only loading component with animated ellipsis
 */
const LoadingText = () => {
  return (
    <Box sx={{ 
      textAlign: 'center', 
      py: 8, 
      display: 'flex', 
      flexDirection: 'column',
      justifyContent: 'center', 
      alignItems: 'center',
      minHeight: '200px',
    }}>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <Typography 
          variant="h5" 
          sx={{ 
            color: 'text.secondary',
            fontWeight: 500,
          }}
        >
          Loading
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          >
            ...
          </motion.span>
        </Typography>
      </motion.div>
    </Box>
  );
};

export default LoadingText;
