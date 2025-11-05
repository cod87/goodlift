import { useState } from 'react';
import PropTypes from 'prop-types';
import { motion } from 'framer-motion';
import { Box, Card, CardContent, Typography, Button } from '@mui/material';
import { CheckCircle } from '@mui/icons-material';
import StretchSelection from './StretchSelection';
import StretchSession from './StretchSession';
import { selectFullBodyStretches, selectCustomStretches } from '../../utils/stretchSelector';

/**
 * Main Stretch Screen Component
 * Manages the flow between selection, session, and completion
 */
const StretchScreen = () => {
  const [screen, setScreen] = useState('selection'); // 'selection', 'session', 'complete'
  const [selectedStretches, setSelectedStretches] = useState([]);

  const handleStartSession = (type, muscles) => {
    let stretches;
    if (type === 'full') {
      stretches = selectFullBodyStretches(10);
    } else {
      stretches = selectCustomStretches(muscles, 10);
    }
    setSelectedStretches(stretches);
    setScreen('session');
  };

  const handleSessionComplete = () => {
    setScreen('complete');
  };

  const handleExit = () => {
    setScreen('selection');
    setSelectedStretches([]);
  };

  const handleFinish = () => {
    setScreen('selection');
    setSelectedStretches([]);
  };

  return (
    <>
      {screen === 'selection' && (
        <StretchSelection onStartSession={handleStartSession} />
      )}

      {screen === 'session' && selectedStretches.length > 0 && (
        <StretchSession
          stretches={selectedStretches}
          onComplete={handleSessionComplete}
          onExit={handleExit}
        />
      )}

      {screen === 'complete' && (
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
                background: 'linear-gradient(135deg, rgba(19, 70, 134, 0.05) 0%, rgba(76, 175, 80, 0.05) 100%)',
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
                  Session Complete!
                </Typography>

                <Typography
                  variant="h6"
                  sx={{
                    color: 'text.secondary',
                    marginBottom: 3,
                  }}
                >
                  Great job! You&apos;ve completed your stretch session.
                </Typography>

                <Typography
                  variant="body1"
                  sx={{
                    marginBottom: 1,
                  }}
                >
                  {selectedStretches.length} stretches completed
                </Typography>

                <Typography
                  variant="body1"
                  sx={{
                    marginBottom: 4,
                  }}
                >
                  ~{selectedStretches.length} minutes of stretching
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

StretchScreen.propTypes = {};

export default StretchScreen;
