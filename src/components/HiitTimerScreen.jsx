import { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Box, Card, CardContent, Typography, Button, TextField, Grid } from '@mui/material';
import { PlayArrow, Pause, Replay, Timer } from '@mui/icons-material';
import { saveHiitSession } from '../utils/storage';
import { formatDuration } from '../utils/helpers';

const HiitTimerScreen = () => {
  const [workTime, setWorkTime] = useState(30);
  const [restTime, setRestTime] = useState(15);
  const [rounds, setRounds] = useState(8);
  const [currentRound, setCurrentRound] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [isRunning, setIsRunning] = useState(false);
  const [isWorkPhase, setIsWorkPhase] = useState(true);
  const [isSetup, setIsSetup] = useState(true);
  const [totalElapsed, setTotalElapsed] = useState(0);
  const intervalRef = useRef(null);
  const startTimeRef = useRef(null);

  const handleComplete = useCallback(async () => {
    setIsRunning(false);
    const endTime = Date.now();
    const duration = Math.floor((endTime - startTimeRef.current) / 1000);
    
    // Save session
    await saveHiitSession({
      date: new Date().toISOString(),
      duration: duration,
      workTime: workTime,
      restTime: restTime,
      rounds: rounds,
    });

    setTotalElapsed(duration);
  }, [workTime, restTime, rounds]);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            // Phase complete
            if (isWorkPhase) {
              // Switch to rest
              setIsWorkPhase(false);
              return restTime;
            } else {
              // Switch to work
              setIsWorkPhase(true);
              setCurrentRound((r) => r + 1);
              
              // Check if workout is complete
              if (currentRound + 1 >= rounds) {
                handleComplete();
                return 0;
              }
              return workTime;
            }
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, isWorkPhase, currentRound, rounds, workTime, restTime, handleComplete]);

  const handleStart = () => {
    if (isSetup) {
      setIsSetup(false);
      setCurrentRound(0);
      setTimeLeft(workTime);
      setIsWorkPhase(true);
      setTotalElapsed(0);
      startTimeRef.current = Date.now();
    }
    setIsRunning(true);
  };

  const handlePause = () => {
    setIsRunning(false);
  };

  const handleReset = () => {
    setIsRunning(false);
    setIsSetup(true);
    setCurrentRound(0);
    setTimeLeft(workTime);
    setIsWorkPhase(true);
    setTotalElapsed(0);
    startTimeRef.current = null;
  };

  const getPhaseColor = () => {
    if (isWorkPhase) {
      return 'rgb(237, 63, 39)'; // Red/Orange for work
    } else {
      return 'rgb(19, 70, 134)'; // Blue for rest
    }
  };

  const getPhaseText = () => {
    if (currentRound >= rounds) {
      return 'Complete!';
    }
    return isWorkPhase ? 'WORK' : 'REST';
  };

  if (isSetup) {
    return (
      <motion.div
        className="screen"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <Typography variant="h3" component="h1" sx={{ 
          fontWeight: 700,
          mb: 4,
          textAlign: 'center',
          color: 'primary.main'
        }}>
          HIIT Timer Setup
        </Typography>

        <Box sx={{ maxWidth: 600, margin: '0 auto' }}>
          <Card sx={{ mb: 3, borderRadius: 3 }}>
            <CardContent>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={4}>
                  <TextField
                    label="Work Time (seconds)"
                    type="number"
                    value={workTime}
                    onChange={(e) => setWorkTime(Math.max(1, parseInt(e.target.value) || 30))}
                    fullWidth
                    InputProps={{ inputProps: { min: 1 } }}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    label="Rest Time (seconds)"
                    type="number"
                    value={restTime}
                    onChange={(e) => setRestTime(Math.max(1, parseInt(e.target.value) || 15))}
                    fullWidth
                    InputProps={{ inputProps: { min: 1 } }}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    label="Rounds"
                    type="number"
                    value={rounds}
                    onChange={(e) => setRounds(Math.max(1, parseInt(e.target.value) || 8))}
                    fullWidth
                    InputProps={{ inputProps: { min: 1 } }}
                  />
                </Grid>
              </Grid>

              <Box sx={{ mt: 3 }}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  Total estimated time: {formatDuration((workTime + restTime) * rounds)}
                </Typography>
              </Box>

              <Button
                variant="contained"
                color="primary"
                size="large"
                fullWidth
                onClick={handleStart}
                startIcon={<PlayArrow />}
                sx={{ mt: 3 }}
              >
                Start Timer
              </Button>
            </CardContent>
          </Card>

          <Card sx={{ borderRadius: 3, bgcolor: 'rgb(253, 244, 227)' }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                About HIIT Training
              </Typography>
              <Typography variant="body2" color="text.secondary">
                High-Intensity Interval Training (HIIT) alternates between intense bursts of activity 
                and fixed periods of less-intense activity or rest. It's an efficient way to improve 
                cardiovascular fitness and burn calories.
              </Typography>
            </CardContent>
          </Card>
        </Box>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="screen"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <Box sx={{ maxWidth: 600, margin: '0 auto', textAlign: 'center' }}>
        <Card sx={{ 
          borderRadius: 3, 
          p: 4,
          bgcolor: getPhaseColor(),
          color: 'white',
          minHeight: '400px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)',
        }}>
          <CardContent>
            <Typography variant="h2" sx={{ 
              fontWeight: 700, 
              mb: 2,
              fontSize: '3rem',
              textTransform: 'uppercase',
              letterSpacing: 2
            }}>
              {getPhaseText()}
            </Typography>

            <Typography variant="h1" sx={{ 
              fontWeight: 700, 
              fontSize: '8rem',
              mb: 2,
              fontFamily: 'monospace',
              lineHeight: 1
            }}>
              {timeLeft}
            </Typography>

            <Typography variant="h5" sx={{ mb: 4, opacity: 0.9 }}>
              Round {currentRound + 1} of {rounds}
            </Typography>

            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
              {!isRunning && currentRound < rounds ? (
                <Button
                  variant="contained"
                  size="large"
                  onClick={handleStart}
                  startIcon={<PlayArrow />}
                  sx={{ 
                    bgcolor: 'white', 
                    color: getPhaseColor(),
                    '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.9)' }
                  }}
                >
                  {currentRound === 0 ? 'Start' : 'Resume'}
                </Button>
              ) : isRunning ? (
                <Button
                  variant="contained"
                  size="large"
                  onClick={handlePause}
                  startIcon={<Pause />}
                  sx={{ 
                    bgcolor: 'white', 
                    color: getPhaseColor(),
                    '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.9)' }
                  }}
                >
                  Pause
                </Button>
              ) : null}

              <Button
                variant="outlined"
                size="large"
                onClick={handleReset}
                startIcon={<Replay />}
                sx={{ 
                  borderColor: 'white', 
                  color: 'white',
                  '&:hover': { borderColor: 'white', bgcolor: 'rgba(255, 255, 255, 0.1)' }
                }}
              >
                Reset
              </Button>
            </Box>

            {currentRound >= rounds && (
              <Box sx={{ mt: 4 }}>
                <Typography variant="h4" sx={{ mb: 2 }}>
                  🎉 Workout Complete!
                </Typography>
                <Typography variant="h6">
                  Total Time: {formatDuration(totalElapsed)}
                </Typography>
              </Box>
            )}
          </CardContent>
        </Card>

        <Card sx={{ mt: 3, borderRadius: 3 }}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-around', flexWrap: 'wrap', gap: 2 }}>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Work Time
                </Typography>
                <Typography variant="h6" color="primary">
                  {workTime}s
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Rest Time
                </Typography>
                <Typography variant="h6" color="primary">
                  {restTime}s
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Total Rounds
                </Typography>
                <Typography variant="h6" color="primary">
                  {rounds}
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </motion.div>
  );
};

export default HiitTimerScreen;
