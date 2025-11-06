import { motion } from 'framer-motion';
import { Box, Card, CardContent, Typography, Grid } from '@mui/material';
import { FitnessCenter, SelfImprovement, Timer, DirectionsRun } from '@mui/icons-material';
import PropTypes from 'prop-types';

const LogActivityScreen = ({ onNavigate }) => {
  const activities = [
    {
      icon: <FitnessCenter sx={{ fontSize: { xs: 32, sm: 48 } }} />,
      title: 'Log Workout',
      description: 'Track a completed workout session',
      color: 'primary.main',
      bgColor: 'rgba(19, 70, 134, 0.1)',
      onClick: () => onNavigate('log-activity-workout'),
    },
    {
      icon: <SelfImprovement sx={{ fontSize: { xs: 32, sm: 48 } }} />,
      title: 'Log Yoga Session',
      description: 'Record your yoga practice',
      color: '#9c27b0',
      bgColor: 'rgba(156, 39, 176, 0.1)',
      onClick: () => onNavigate('log-activity-yoga'),
    },
    {
      icon: <Timer sx={{ fontSize: { xs: 32, sm: 48 } }} />,
      title: 'Log HIIT Session',
      description: 'Log your high-intensity training',
      color: 'secondary.main',
      bgColor: 'rgba(237, 63, 39, 0.1)',
      onClick: () => onNavigate('log-activity-hiit'),
    },
    {
      icon: <DirectionsRun sx={{ fontSize: { xs: 32, sm: 48 } }} />,
      title: 'Log General Cardio',
      description: 'Track your cardio activities',
      color: '#2196f3',
      bgColor: 'rgba(33, 150, 243, 0.1)',
      onClick: () => onNavigate('log-cardio'),
    },
  ];

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
          Log Activity
        </Typography>
        <Typography variant="body1" sx={{ 
          color: 'text.secondary',
        }}>
          Manually log your completed fitness activities
        </Typography>
      </Box>

      <Grid container spacing={2}>
        {activities.map((activity, index) => (
          <Grid item xs={6} sm={6} key={index}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Card
                onClick={activity.onClick}
                sx={{
                  cursor: 'pointer',
                  height: '100%',
                  borderRadius: 3,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    boxShadow: '0 8px 24px rgba(19, 70, 134, 0.15)',
                  }
                }}
              >
                <CardContent sx={{ p: { xs: 2, sm: 3 }, textAlign: 'center' }}>
                  <Box sx={{ 
                    display: 'flex', 
                    justifyContent: 'center', 
                    mb: { xs: 1, sm: 2 }
                  }}>
                    <Box sx={{ 
                      p: { xs: 1.5, sm: 2 }, 
                      borderRadius: '50%', 
                      bgcolor: activity.bgColor,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: activity.color
                    }}>
                      {activity.icon}
                    </Box>
                  </Box>
                  <Typography variant="h5" sx={{ 
                    fontWeight: 700, 
                    mb: 1,
                    color: 'text.primary',
                    fontSize: { xs: '1rem', sm: '1.5rem' }
                  }}>
                    {activity.title}
                  </Typography>
                  <Typography variant="body2" sx={{ 
                    color: 'text.secondary',
                    fontSize: { xs: '0.75rem', sm: '0.875rem' }
                  }}>
                    {activity.description}
                  </Typography>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>
        ))}
      </Grid>
    </motion.div>
  );
};

LogActivityScreen.propTypes = {
  onNavigate: PropTypes.func.isRequired,
};

export default LogActivityScreen;
