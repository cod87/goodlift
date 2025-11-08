import { useState } from 'react';
import { motion } from 'framer-motion';
import { Box, Card, CardContent, Typography, Button } from '@mui/material';
import { CheckCircle } from '@mui/icons-material';
import MobilitySelection from './MobilitySelection';
import StretchSession from '../Stretch/StretchSession';
import YogaSession from '../Yoga/YogaSession';
import { selectFullBodyStretches, selectCustomStretches } from '../../utils/stretchSelector';
import { saveStretchSession, saveYogaSession } from '../../utils/storage';
import { useYogaTTS } from '../../hooks/useYogaTTS';

/**
 * Main Mobility Screen Component
 * Manages the flow between selection, stretch/yoga sessions, and completion
 */
const MobilityScreen = () => {
  const [screen, setScreen] = useState('selection'); // 'selection', 'stretch-session', 'yoga-session', 'complete'
  const [selectedStretches, setSelectedStretches] = useState([]);
  const [stretchSessionType, setStretchSessionType] = useState('');
  const [yogaSessionConfig, setYogaSessionConfig] = useState(null);
  const [completedSessionType, setCompletedSessionType] = useState(null); // 'stretch' or 'yoga'
  const { ttsEnabled } = useYogaTTS();

  const handleStartStretchSession = (type, muscles) => {
    let stretches;
    if (type === 'full') {
      stretches = selectFullBodyStretches(10);
    } else {
      stretches = selectCustomStretches(muscles, 10);
    }
    setSelectedStretches(stretches);
    setStretchSessionType(type);
    setScreen('stretch-session');
  };

  const handleStartYogaSession = (config) => {
    const sessionData = {
      ...config,
      ttsEnabled,
    };
    setYogaSessionConfig(sessionData);
    setScreen('yoga-session');
  };

  const handleStretchSessionComplete = async () => {
    // Save the stretch session
    try {
      const sessionData = {
        id: `stretch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        date: new Date().toISOString(),
        type: stretchSessionType,
        stretchesCompleted: selectedStretches.length,
        stretches: selectedStretches.map(s => s.name),
        duration: selectedStretches.length * 60, // 60 seconds per stretch
      };
      await saveStretchSession(sessionData);
    } catch (error) {
      console.error('Failed to save stretch session:', error);
    }
    setCompletedSessionType('stretch');
    setScreen('complete');
  };

  const handleYogaSessionComplete = async (sessionData) => {
    // Save the yoga session
    try {
      await saveYogaSession(sessionData);
    } catch (error) {
      console.error('Failed to save yoga session:', error);
    }
    setCompletedSessionType('yoga');
    setScreen('complete');
  };

  const handleExit = () => {
    setScreen('selection');
    setSelectedStretches([]);
    setYogaSessionConfig(null);
  };

  const handleFinish = () => {
    setScreen('selection');
    setSelectedStretches([]);
    setYogaSessionConfig(null);
    setCompletedSessionType(null);
  };

  return (
    <>
      {screen === 'selection' && (
        <MobilitySelection
          onStartStretchSession={handleStartStretchSession}
          onStartYogaSession={handleStartYogaSession}
        />
      )}

      {screen === 'stretch-session' && selectedStretches.length > 0 && (
        <StretchSession
          stretches={selectedStretches}
          onComplete={handleStretchSessionComplete}
          onExit={handleExit}
        />
      )}

      {screen === 'yoga-session' && yogaSessionConfig && (
        <YogaSession
          config={yogaSessionConfig}
          onComplete={handleYogaSessionComplete}
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
                background: completedSessionType === 'stretch'
                  ? 'linear-gradient(135deg, rgba(19, 70, 134, 0.05) 0%, rgba(76, 175, 80, 0.05) 100%)'
                  : 'linear-gradient(135deg, rgba(19, 70, 134, 0.05) 0%, rgba(156, 39, 176, 0.05) 100%)',
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
                      color: completedSessionType === 'stretch' ? 'success.main' : '#9c27b0',
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
                  {completedSessionType === 'stretch' 
                    ? "Great job! You've completed your stretch session."
                    : "Namaste! You've completed your yoga session."}
                </Typography>

                {completedSessionType === 'stretch' && (
                  <>
                    <Typography variant="body1" sx={{ marginBottom: 1 }}>
                      {selectedStretches.length} stretches completed
                    </Typography>
                    <Typography variant="body1" sx={{ marginBottom: 4 }}>
                      ~{selectedStretches.length} minutes of stretching
                    </Typography>
                  </>
                )}

                {completedSessionType === 'yoga' && yogaSessionConfig && (
                  <>
                    <Typography variant="body1" sx={{ marginBottom: 1 }}>
                      {yogaSessionConfig.flowLength} minute flow
                    </Typography>
                    {yogaSessionConfig.coolDownLength > 0 && (
                      <Typography variant="body1" sx={{ marginBottom: 1 }}>
                        {yogaSessionConfig.coolDownLength} minute cool down
                      </Typography>
                    )}
                    <Typography variant="body1" sx={{ marginBottom: 4 }}>
                      Total: {yogaSessionConfig.flowLength + yogaSessionConfig.coolDownLength} minutes
                    </Typography>
                  </>
                )}

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

export default MobilityScreen;
