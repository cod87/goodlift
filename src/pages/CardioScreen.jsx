import { motion } from 'framer-motion';
import { Box, Card, CardContent, Typography, Button, Stack } from '@mui/material';
import { Whatshot, FitnessCenter } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';

const CardioScreen = ({ onNavigate }) => {
  const navigate = useNavigate();

  const handleHiitClick = () => {
    if (onNavigate) {
      onNavigate('hiit');
    } else {
      navigate('/hiit-timer');
    }
  };

  const handleLogCardioClick = () => {
    if (onNavigate) {
      onNavigate('log-cardio');
    } else {
      navigate('/log-cardio');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      style={{ 
        maxWidth: '900px', 
        margin: '0 auto', 
        padding: '2rem 1rem' 
      }}
    >
      <Box sx={{ mb: 4, textAlign: 'center' }}>
        <Typography variant="h3" sx={{ 
          fontWeight: 700, 
          color: 'primary.main',
          mb: 1
        }}>
          Cardio Hub
        </Typography>
        <Typography variant="body1" sx={{ 
          color: 'text.secondary',
          maxWidth: '600px',
          margin: '0 auto'
        }}>
          Choose your cardio activity
        </Typography>
      </Box>

      <Stack spacing={3}>
        {/* HIIT Session Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card sx={{ 
            borderRadius: 3,
            transition: 'all 0.3s ease',
            cursor: 'pointer',
            '&:hover': {
              transform: 'translateY(-4px)',
              boxShadow: '0 8px 24px rgba(237, 63, 39, 0.2)',
            }
          }}
          onClick={handleHiitClick}
          >
            <CardContent sx={{ p: 3 }}>
              <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
                <Box sx={{ 
                  p: 2, 
                  borderRadius: 2, 
                  bgcolor: 'rgba(237, 63, 39, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Whatshot sx={{ fontSize: 40, color: 'secondary.main' }} />
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>
                    HIIT Session
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    High-Intensity Interval Training with customizable timer
                  </Typography>
                </Box>
              </Stack>
              <Button
                variant="contained"
                fullWidth
                sx={{ 
                  bgcolor: 'secondary.main',
                  '&:hover': { bgcolor: 'secondary.dark' },
                  py: 1.5,
                  fontWeight: 600
                }}
                onClick={handleHiitClick}
              >
                Start HIIT Timer
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        {/* Log General Cardio Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card sx={{ 
            borderRadius: 3,
            transition: 'all 0.3s ease',
            cursor: 'pointer',
            '&:hover': {
              transform: 'translateY(-4px)',
              boxShadow: '0 8px 24px rgba(19, 70, 134, 0.2)',
            }
          }}
          onClick={handleLogCardioClick}
          >
            <CardContent sx={{ p: 3 }}>
              <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
                <Box sx={{ 
                  p: 2, 
                  borderRadius: 2, 
                  bgcolor: 'rgba(19, 70, 134, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <FitnessCenter sx={{ fontSize: 40, color: 'primary.main' }} />
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>
                    Log General Cardio
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Track running, cycling, swimming, and other cardio activities
                  </Typography>
                </Box>
              </Stack>
              <Button
                variant="contained"
                fullWidth
                sx={{ 
                  bgcolor: 'primary.main',
                  '&:hover': { bgcolor: 'primary.dark' },
                  py: 1.5,
                  fontWeight: 600
                }}
                onClick={handleLogCardioClick}
              >
                Log Cardio Session
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </Stack>
    </motion.div>
  );
};

CardioScreen.propTypes = {
  onNavigate: PropTypes.func,
};

export default CardioScreen;
