import { memo, useState } from 'react';
import PropTypes from 'prop-types';
import { motion } from 'framer-motion';
import { formatTime } from '../utils/helpers';
import { Box, Card, CardContent, Typography, Button, Stack, Chip, Dialog, DialogTitle, DialogContent, DialogActions, TextField } from '@mui/material';
import { Download, Check, Celebration, Star } from '@mui/icons-material';
import { saveFavoriteWorkout } from '../utils/storage';

/**
 * CompletionScreen component displays workout summary after completion
 * Shows exercise details, sets, reps, and weights used
 * Memoized to prevent unnecessary re-renders
 */
const CompletionScreen = memo(({ workoutData, onFinish, onExportCSV, workoutPlan, workoutType }) => {
  const [isSaved, setIsSaved] = useState(false);
  const [favoriteDialogOpen, setFavoriteDialogOpen] = useState(false);
  const [favoriteName, setFavoriteName] = useState('');

  const handleSaveToFavorites = () => {
    setFavoriteName(`${workoutType} Workout`);
    setFavoriteDialogOpen(true);
  };

  const handleSaveFavorite = () => {
    if (favoriteName.trim()) {
      saveFavoriteWorkout({
        name: favoriteName.trim(),
        type: workoutType,
        equipment: 'all',
        exercises: workoutPlan || [],
      });
      setIsSaved(true);
      setFavoriteDialogOpen(false);
      setFavoriteName('');
    }
  };

  const handleCancelFavorite = () => {
    setFavoriteDialogOpen(false);
    setFavoriteName('');
  };

  return (
    <motion.div
      className="screen completion-screen"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <motion.div
        className="completion-header"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
      >
        <motion.div
          initial={{ y: -20 }}
          animate={{ y: [0, -10, 0] }}
          transition={{ 
            repeat: Infinity,
            duration: 2,
            ease: 'easeInOut'
          }}
        >
          <Celebration sx={{ fontSize: 80, mb: 2 }} />
        </motion.div>
        <h1>Workout Complete!</h1>
        <p className="completion-time">
          Total Time: <strong>{formatTime(workoutData.duration)}</strong>
        </p>
      </motion.div>
      
      <div className="workout-summary-container">
        <Typography variant="h4" component="h2" sx={{ 
          fontWeight: 700,
          mb: 3,
          textAlign: 'center',
          color: 'text.primary'
        }}>
          Workout Summary
        </Typography>
        <Stack spacing={2}>
          {Object.entries(workoutData.exercises).map(([exerciseName, data], idx) => (
            <motion.div
              key={exerciseName}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + idx * 0.1 }}
            >
              <Card 
                sx={{ 
                  borderRadius: 3,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 8px 24px rgba(48, 86, 105, 0.15)',
                  }
                }}
              >
                <CardContent>
                  <Typography 
                    variant="h6" 
                    component="h3"
                    sx={{ 
                      color: 'primary.main',
                      fontWeight: 600,
                      mb: 2,
                      pb: 1,
                      borderBottom: '2px solid',
                      borderColor: 'rgba(138, 190, 185, 0.2)'
                    }}
                  >
                    {exerciseName}
                  </Typography>
                  <Stack spacing={1}>
                    {data.sets.map((set, setIdx) => (
                      <Box
                        key={setIdx}
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          p: 1.5,
                          bgcolor: 'rgba(183, 229, 205, 0.3)',
                          borderRadius: 2,
                          transition: 'all 0.2s ease',
                          '&:hover': {
                            bgcolor: 'primary.main',
                            color: 'white',
                            '& .MuiChip-root': {
                              bgcolor: 'white',
                              color: 'primary.main',
                            }
                          }
                        }}
                      >
                        <Chip 
                          label={`Set ${set.set}`}
                          size="small"
                          sx={{ 
                            fontWeight: 600,
                            minWidth: 60
                          }}
                        />
                        <Typography sx={{ fontWeight: 600, fontSize: '1rem' }}>
                          {set.weight} lbs × {set.reps} reps
                        </Typography>
                      </Box>
                    ))}
                  </Stack>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </Stack>
      </div>
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <Stack 
          direction={{ xs: 'column', sm: 'row' }}
          spacing={2}
          sx={{ mt: 4 }}
        >
          <Button
            variant="outlined"
            size="large"
            startIcon={<Download />}
            onClick={onExportCSV}
            sx={{
              flex: 1,
              borderRadius: 2,
              py: 1.5,
              fontSize: '1rem',
              fontWeight: 600,
              borderColor: 'secondary.main',
              color: 'secondary.main',
              '&:hover': {
                borderColor: 'secondary.dark',
                bgcolor: 'rgba(193, 120, 90, 0.1)',
              }
            }}
          >
            Download CSV
          </Button>
          <Button
            variant="outlined"
            size="large"
            startIcon={<Star />}
            onClick={handleSaveToFavorites}
            disabled={isSaved}
            sx={{
              flex: 1,
              borderRadius: 2,
              py: 1.5,
              fontSize: '1rem',
              fontWeight: 600,
              borderColor: 'warning.main',
              color: 'warning.main',
              '&:hover': {
                borderColor: 'warning.dark',
                bgcolor: 'rgba(254, 178, 26, 0.1)',
              },
              '&.Mui-disabled': {
                borderColor: 'rgba(0, 0, 0, 0.12)',
                color: 'rgba(0, 0, 0, 0.26)',
              }
            }}
          >
            {isSaved ? 'Saved!' : 'Save to Favorites'}
          </Button>
          <Button
            variant="contained"
            size="large"
            startIcon={<Check />}
            onClick={onFinish}
            sx={{
              flex: 1,
              borderRadius: 2,
              py: 1.5,
              fontSize: '1rem',
              fontWeight: 600,
              bgcolor: 'primary.main',
              '&:hover': {
                bgcolor: 'primary.dark',
              }
            }}
          >
            Finish
          </Button>
        </Stack>
      </motion.div>

      {/* Save to Favorites Dialog */}
      <Dialog open={favoriteDialogOpen} onClose={handleCancelFavorite} maxWidth="sm" fullWidth>
        <DialogTitle>Save Workout to Favorites</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Workout Name"
            type="text"
            fullWidth
            value={favoriteName}
            onChange={(e) => setFavoriteName(e.target.value)}
            variant="outlined"
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelFavorite}>Cancel</Button>
          <Button onClick={handleSaveFavorite} variant="contained" disabled={!favoriteName.trim()}>
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </motion.div>
  );
});

CompletionScreen.displayName = 'CompletionScreen';

CompletionScreen.propTypes = {
  workoutData: PropTypes.object.isRequired,
  onFinish: PropTypes.func.isRequired,
  onExportCSV: PropTypes.func.isRequired,
  workoutPlan: PropTypes.array,
  workoutType: PropTypes.string,
};

export default CompletionScreen;
