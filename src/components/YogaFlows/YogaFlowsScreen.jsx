import { useState } from 'react';
import PropTypes from 'prop-types';
import { motion } from 'framer-motion';
import { Box, Card, CardContent, Typography, Button } from '@mui/material';
import { CheckCircle } from '@mui/icons-material';
import FlowSelection from './FlowSelection';
import FlowSession from './FlowSession';

/**
 * Main Yoga Flows Screen Component
 * Manages the flow between selection, session, and completion
 */
const YogaFlowsScreen = () => {
  const [screen, setScreen] = useState('selection'); // 'selection', 'session', 'complete'
  const [selectedFlow, setSelectedFlow] = useState(null);

  const handleStartFlow = (flow) => {
    setSelectedFlow(flow);
    setScreen('session');
  };

  const handleSessionComplete = () => {
    setScreen('complete');
  };

  const handleExit = () => {
    setScreen('selection');
    setSelectedFlow(null);
  };

  const handleFinish = () => {
    setScreen('selection');
    setSelectedFlow(null);
  };

  return (
    <>
      {screen === 'selection' && (
        <FlowSelection onStartFlow={handleStartFlow} />
      )}

      {screen === 'session' && selectedFlow && (
        <FlowSession
          flow={selectedFlow}
          onComplete={handleSessionComplete}
          onExit={handleExit}
        />
      )}

      {screen === 'complete' && selectedFlow && (
        <Box
          sx={{
            padding: { xs: '2rem 1rem', sm: '2rem', md: '3rem' },
            maxWidth: '700px',
            margin: '0 auto',
            minHeight: 'calc(100vh - 60px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            style={{ width: '100%' }}
          >
            <Card
              sx={{
                background: 'linear-gradient(135deg, rgba(19, 70, 134, 0.05) 0%, rgba(156, 39, 176, 0.05) 100%)',
                boxShadow: 6,
              }}
            >
              <CardContent sx={{ padding: { xs: 3, sm: 5 }, textAlign: 'center' }}>
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                >
                  <CheckCircle
                    sx={{
                      fontSize: 100,
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
                  }}
                >
                  Flow Complete!
                </Typography>

                <Typography
                  variant="h6"
                  sx={{
                    color: 'text.secondary',
                    marginBottom: 3,
                  }}
                >
                  Namaste! You&apos;ve completed {selectedFlow.flowName}.
                </Typography>

                <Typography
                  variant="body1"
                  sx={{
                    marginBottom: 1,
                  }}
                >
                  {selectedFlow.durationMinutes} minutes of mindful practice
                </Typography>

                <Typography
                  variant="body1"
                  sx={{
                    marginBottom: 4,
                  }}
                >
                  {selectedFlow.posesIncluded.length} poses completed
                </Typography>

                <Button
                  variant="contained"
                  size="large"
                  onClick={handleFinish}
                  sx={{
                    minWidth: '200px',
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
