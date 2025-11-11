import { motion } from 'framer-motion';
import { Box, Card, CardContent, Typography, Button, Stack, Grid } from '@mui/material';
import { Whatshot, FitnessCenter, DirectionsRun, SelfImprovement } from '@mui/icons-material';
import PropTypes from 'prop-types';
import CompactHeader from '../components/Common/CompactHeader';

const CardioScreen = ({ onNavigate }) => {
  const handleHiitClick = () => {
    if (onNavigate) {
      onNavigate('hiit');
    }
  };

  const handleHiitSelectionClick = () => {
    if (onNavigate) {
      onNavigate('hiit-selection');
    }
  };

  const handleYogaSelectionClick = () => {
    if (onNavigate) {
      onNavigate('yoga-selection');
    }
  };

  const handleLogCardioClick = () => {
    if (onNavigate) {
      onNavigate('log-cardio');
    }
  };

  return (
    <Box sx={{ width: '100%', minHeight: '100vh' }}>
      <Box sx={{ px: { xs: 2, md: 0 } }}>
        <CompactHeader title="Cardio & Conditioning" icon="🏃" />
      </Box>
      
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        style={{ 
          maxWidth: '900px', 
          margin: '0 auto', 
          padding: '0' 
        }}
      >
      <Grid container spacing={{ xs: 0, md: 3 }}>
        {/* HIIT Session Builder Card */}
        <Grid item xs={12} md={6}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card sx={{ 
              borderRadius: { xs: 0, md: 3 },
              height: '100%',
              transition: 'all 0.3s ease',
              cursor: 'pointer',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: '0 8px 24px rgba(237, 63, 39, 0.2)',
              }
            }}
            onClick={handleHiitSelectionClick}
            >
              <CardContent sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
                <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
                  <Box sx={{ 
                    p: 2, 
                    borderRadius: 2, 
                    bgcolor: 'rgba(237, 63, 39, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <DirectionsRun sx={{ fontSize: 40, color: 'secondary.main' }} />
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>
                      HIIT Sessions
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Generate science-backed HIIT workouts
                    </Typography>
                  </Box>
                </Stack>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2, flex: 1 }}>
                  Bodyweight, plyometric, cycling, rowing, elliptical, and step platform protocols from .github/HIIT-YOGA-GUIDE.md
                </Typography>
                <Button
                  variant="contained"
                  fullWidth
                  sx={{ 
                    bgcolor: 'secondary.main',
                    '&:hover': { bgcolor: 'secondary.dark' },
                    py: 1.5,
                    fontWeight: 600
                  }}
                  onClick={handleHiitSelectionClick}
                >
                  Build HIIT Session
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        {/* Yoga Session Builder Card */}
        <Grid item xs={12} md={6}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            <Card sx={{ 
              borderRadius: { xs: 0, md: 3 },
              height: '100%',
              transition: 'all 0.3s ease',
              cursor: 'pointer',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: '0 8px 24px rgba(19, 70, 134, 0.2)',
              }
            }}
            onClick={handleYogaSelectionClick}
            >
              <CardContent sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
                <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
                  <Box sx={{ 
                    p: 2, 
                    borderRadius: 2, 
                    bgcolor: 'rgba(19, 70, 134, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <SelfImprovement sx={{ fontSize: 40, color: 'primary.main' }} />
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>
                      Yoga Sessions
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Generate evidence-based yoga flows
                    </Typography>
                  </Box>
                </Stack>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2, flex: 1 }}>
                  Power, restorative, yin, flexibility, and core strength yoga from .github/HIIT-YOGA-GUIDE.md
                </Typography>
                <Button
                  variant="contained"
                  fullWidth
                  sx={{ 
                    bgcolor: 'primary.main',
                    '&:hover': { bgcolor: 'primary.dark' },
                    py: 1.5,
                    fontWeight: 600
                  }}
                  onClick={handleYogaSelectionClick}
                >
                  Build Yoga Session
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        {/* HIIT Timer Card */}
        <Grid item xs={12} md={6}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card sx={{ 
              borderRadius: { xs: 0, md: 3 },
              transition: 'all 0.3s ease',
              cursor: 'pointer',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: '0 8px 24px rgba(254, 178, 26, 0.2)',
              }
            }}
            onClick={handleHiitClick}
            >
              <CardContent sx={{ p: 3 }}>
                <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
                  <Box sx={{ 
                    p: 2, 
                    borderRadius: 2, 
                    bgcolor: 'rgba(254, 178, 26, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Whatshot sx={{ fontSize: 40, color: 'warning.main' }} />
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>
                      HIIT Timer
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Customizable interval timer
                    </Typography>
                  </Box>
                </Stack>
                <Button
                  variant="contained"
                  fullWidth
                  sx={{ 
                    bgcolor: 'warning.main',
                    color: 'primary.main',
                    '&:hover': { bgcolor: 'warning.dark' },
                    py: 1.5,
                    fontWeight: 600
                  }}
                  onClick={handleHiitClick}
                >
                  Start Timer
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        {/* Log General Cardio Card */}
        <Grid item xs={12} md={6}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
          >
            <Card sx={{ 
              borderRadius: { xs: 0, md: 3 },
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
                      Log Cardio
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Track running, cycling, swimming
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
                  Log Session
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>
      </Grid>
    </motion.div>
    </Box>
  );
};

CardioScreen.propTypes = {
  onNavigate: PropTypes.func,
};

export default CardioScreen;
