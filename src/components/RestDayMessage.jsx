import { Box, Typography, Paper } from '@mui/material';
import { HotelOutlined, MenuBook, People, SelfImprovement } from '@mui/icons-material';
import { motion } from 'framer-motion';
import PropTypes from 'prop-types';

/**
 * RestDayMessage - Displays a playful message for rest days
 * Shows encouraging text with animations when user clicks a rest day
 */
const RestDayMessage = ({ onClose }) => {
  const messages = [
    { text: "Take it easy! See a friend!", icon: <People sx={{ fontSize: 48 }} /> },
    { text: "Rest up! Read a book!", icon: <MenuBook sx={{ fontSize: 48 }} /> },
    { text: "Relax and recover! Try some gentle stretching!", icon: <SelfImprovement sx={{ fontSize: 48 }} /> },
    { text: "Your body needs rest! Enjoy your day off!", icon: <HotelOutlined sx={{ fontSize: 48 }} /> },
  ];

  const randomMessage = messages[Math.floor(Math.random() * messages.length)];

  return (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'rgba(0, 0, 0, 0.5)',
        zIndex: 1300,
        p: 2,
      }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        exit={{ scale: 0, rotate: 180 }}
        transition={{ 
          type: "spring",
          stiffness: 260,
          damping: 20,
        }}
      >
        <Paper
          elevation={8}
          sx={{
            p: 4,
            maxWidth: 400,
            textAlign: 'center',
            borderRadius: 4,
            background: 'linear-gradient(135deg, rgba(19, 70, 134, 0.1) 0%, rgba(237, 63, 39, 0.1) 100%)',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <motion.div
            animate={{ 
              y: [0, -10, 0],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            <Box sx={{ color: 'primary.main', mb: 2 }}>
              {randomMessage.icon}
            </Box>
          </motion.div>
          
          <Typography 
            variant="h5" 
            sx={{ 
              fontWeight: 700,
              mb: 2,
              color: 'text.primary',
            }}
          >
            It's a Rest Day! 🌟
          </Typography>
          
          <Typography 
            variant="body1" 
            sx={{ 
              color: 'text.secondary',
              mb: 3,
            }}
          >
            {randomMessage.text}
          </Typography>
          
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Box
              sx={{
                display: 'inline-block',
                px: 3,
                py: 1,
                borderRadius: 2,
                bgcolor: 'primary.main',
                color: 'white',
                cursor: 'pointer',
                fontWeight: 600,
                '&:hover': {
                  bgcolor: 'primary.dark',
                },
              }}
              onClick={onClose}
            >
              Got it!
            </Box>
          </motion.div>
        </Paper>
      </motion.div>
    </Box>
  );
};

RestDayMessage.propTypes = {
  onClose: PropTypes.func.isRequired,
};

export default RestDayMessage;
