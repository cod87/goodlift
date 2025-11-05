import { useState } from 'react';
import PropTypes from 'prop-types';
import { motion } from 'framer-motion';
import { Box, Card, CardContent, Typography, Button } from '@mui/material';
import { CheckCircle } from '@mui/icons-material';
import FlowSession from './FlowSession';
import { saveYogaSession } from '../../utils/storage';

/**
 * Simplified Yoga Flow Screen Component
 * 10 min Sun Salutations + 5 min "Do what feels good!" = 15 min total
 */
const YogaFlowsScreen = () => {
  const [screen, setScreen] = useState('start'); // 'start', 'session', 'complete'

  // Fixed flow: 10 min Sun Salutations + 5 min Do what feels good!
  const yogaFlow = {
    flowName: 'Sun Salutations & Free Flow',
    durationMinutes: 15,
    segments: [
      { name: 'Sun Salutations', duration: 10 },
      { name: 'Do what feels good!', duration: 5 }
    ]
  };

  const handleStartFlow = () => {
    setScreen('session');
  };

  const handleSessionComplete = async () => {
    // Save the session
    try {
      const sessionData = {
        id: `yoga_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        date: new Date().toISOString(),
        flowName: yogaFlow.flowName,
        duration: yogaFlow.durationMinutes * 60, // Convert to seconds
      };
      await saveYogaSession(sessionData);
    } catch (error) {
      console.error('Failed to save yoga session:', error);
    }
    setScreen('complete');
  };

  const handleExit = () => {
    setScreen('start');
  };

  const handleFinish = () => {
    setScreen('start');
  };

  return (
    <>
      {screen === 'start' && (
        <Box
          sx={{
            padding: { xs: '1rem', sm: '2rem' },
            maxWidth: '600px',
            margin: '0 auto',
            minHeight: 'calc(100vh - 60px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxSizing: 'border-box',
          }}
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            style={{ width: '100%', boxSizing: 'border-box' }}
          >
            <Card
              sx={{
                background: 'linear-gradient(135deg, rgba(19, 70, 134, 0.05) 0%, rgba(156, 39, 176, 0.05) 100%)',
                boxShadow: 6,
                boxSizing: 'border-box',
              }}
            >
              <CardContent sx={{ padding: { xs: 2, sm: 4 }, textAlign: 'center', boxSizing: 'border-box' }}>
                <Typography
                  variant="h3"
                  sx={{
                    fontFamily: "'Montserrat', sans-serif",
                    fontWeight: 800,
                    color: 'primary.main',
                    marginBottom: 2,
                    fontSize: { xs: '1.75rem', sm: '2.5rem' }
                  }}
                >
                  Yoga Flow Session
                </Typography>

                <Typography
                  variant="h6"
                  sx={{
                    color: 'text.secondary',
                    marginBottom: 3,
                    fontSize: { xs: '1rem', sm: '1.25rem' }
                  }}
                >
                  A 15-minute guided practice
                </Typography>

                <Box sx={{ textAlign: 'left', mb: 3, px: { xs: 1, sm: 2 } }}>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                    Flow Breakdown:
                  </Typography>
                  <Box sx={{ mb: 1.5 }}>
                    <Typography variant="body1" sx={{ fontWeight: 600, color: 'primary.main' }}>
                      10 minutes: Sun Salutations
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Traditional sequence to energize and warm up your body
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="body1" sx={{ fontWeight: 600, color: 'primary.main' }}>
                      5 minutes: Do what feels good!
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Free-flow time to stretch and move intuitively
                    </Typography>
                  </Box>
                </Box>

                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: 3, fontStyle: 'italic' }}
                >
                  Total Duration: 15 minutes
                </Typography>

                <Button
                  variant="contained"
                  size="large"
                  onClick={handleStartFlow}
                  sx={{
                    minWidth: { xs: '100%', sm: '200px' },
                    padding: '12px 32px',
                    fontSize: '1.1rem',
                    fontWeight: 600,
                  }}
                >
                  Start Flow
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </Box>
      )}

      {screen === 'session' && (
        <FlowSession
          flow={yogaFlow}
          onComplete={handleSessionComplete}
          onExit={handleExit}
        />
      )}

      {screen === 'complete' && (
        <Box
          sx={{
            padding: { xs: '1rem', sm: '2rem' },
            maxWidth: '600px',
            margin: '0 auto',
            minHeight: 'calc(100vh - 60px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxSizing: 'border-box',
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            style={{ width: '100%', boxSizing: 'border-box' }}
          >
            <Card
              sx={{
                background: 'linear-gradient(135deg, rgba(19, 70, 134, 0.05) 0%, rgba(156, 39, 176, 0.05) 100%)',
                boxShadow: 6,
                boxSizing: 'border-box',
              }}
            >
              <CardContent sx={{ padding: { xs: 2, sm: 4 }, textAlign: 'center', boxSizing: 'border-box' }}>
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                >
                  <CheckCircle
                    sx={{
                      fontSize: { xs: 60, sm: 100 },
                      color: 'success.main',
                      marginBottom: 2,
                    }}
                  />
                </motion.div>

                <Typography
                  variant="h3"
                  sx={{
                    fontFamily: "'Montserrat', sans-serif",
                    fontWeight: 800,
                    color: 'primary.main',
                    marginBottom: 2,
                    fontSize: { xs: '1.75rem', sm: '2.5rem' }
                  }}
                >
                  Flow Complete!
                </Typography>

                <Typography
                  variant="h6"
                  sx={{
                    color: 'text.secondary',
                    marginBottom: 3,
                    fontSize: { xs: '1rem', sm: '1.25rem' }
                  }}
                >
                  Namaste! You&apos;ve completed your yoga practice.
                </Typography>

                <Typography
                  variant="body1"
                  sx={{
                    marginBottom: 4,
                  }}
                >
                  15 minutes of mindful practice
                </Typography>

                <Button
                  variant="contained"
                  size="large"
                  onClick={handleFinish}
                  sx={{
                    minWidth: { xs: '100%', sm: '200px' },
                    padding: '12px 32px',
                    fontSize: '1.1rem',
                    fontWeight: 600,
                  }}
                >
                  Done
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </Box>
      )}
    </>
  );
};

YogaFlowsScreen.propTypes = {};

export default YogaFlowsScreen;
