import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Box,
  Typography,
  Stack,
  Alert,
} from '@mui/material';
import { SelfImprovement } from '@mui/icons-material';
import YogaSession from '../components/Yoga/YogaSession';
import YogaConfig from '../components/YogaConfig';
import { useYogaTTS } from '../hooks/useYogaTTS';
import { useQuery } from '@tanstack/react-query';

/**
 * YogaScreen Component
 * Main screen for yoga session configuration and flow
 */
const YogaScreen = () => {
  const [sessionActive, setSessionActive] = useState(false);
  const [sessionConfig, setSessionConfig] = useState(null);
  const { ttsEnabled } = useYogaTTS();

  // Check if yoga poses data is available
  const { isError } = useQuery({
    queryKey: ['yogaPoses'],
    queryFn: async () => {
      const response = await fetch(`${import.meta.env.BASE_URL}data/yoga-poses.json`);
      if (!response.ok) {
        throw new Error('Failed to load yoga poses');
      }
      return response.json();
    },
    staleTime: Infinity,
    retry: 1,
  });

  const handleStartSession = (values) => {
    const sessionData = {
      ...values,
      ttsEnabled,
    };
    
    // Start session
    setSessionConfig(sessionData);
    setSessionActive(true);
  };

  const handleSessionComplete = () => {
    setSessionActive(false);
    setSessionConfig(null);
  };

  const handleSessionExit = () => {
    setSessionActive(false);
    setSessionConfig(null);
  };

  if (sessionActive && sessionConfig) {
    return (
      <YogaSession
        config={sessionConfig}
        onComplete={handleSessionComplete}
        onExit={handleSessionExit}
      />
    );
  }

  return (
    <Box
      sx={{
        padding: { xs: '2rem 1rem', sm: '2rem', md: '3rem' },
        maxWidth: '800px',
        margin: '0 auto',
        minHeight: 'calc(100vh - 60px)',
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Header */}
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Stack direction="row" alignItems="center" justifyContent="center" spacing={2} sx={{ mb: 2 }}>
            <SelfImprovement sx={{ fontSize: 48, color: 'primary.main' }} />
            <Typography
              variant="h3"
              sx={{
                fontFamily: "'Montserrat', sans-serif",
                fontWeight: 800,
                color: 'primary.main',
              }}
            >
              Yoga
            </Typography>
          </Stack>
          <Typography
            variant="body1"
            sx={{
              color: 'text.secondary',
              maxWidth: '600px',
              margin: '0 auto',
            }}
          >
            Configure your yoga session with flow and cool down options. Receive guided pose suggestions throughout your practice.
          </Typography>
        </Box>

        {/* Error Alert if pose data not available */}
        {isError && (
          <Alert severity="warning" sx={{ mb: 3 }}>
            Pose data not available. Please check your connection and try again.
          </Alert>
        )}

        {/* Configuration Form */}
        <YogaConfig onStartSession={handleStartSession} />
      </motion.div>
    </Box>
  );
};

export default YogaScreen;
