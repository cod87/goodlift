import { useState } from 'react';
import PropTypes from 'prop-types';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Stack,
  Snackbar,
  Alert,
  Slide,
} from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import {
  EmojiEvents,
  LocalFireDepartment,
  TrendingUp,
} from '@mui/icons-material';

/**
 * PR Notification Snackbar
 * Shows a quick notification when a new PR is achieved
 */
export const PRNotification = ({ open, onClose, prData }) => {
  if (!prData) return null;

  const getMessage = () => {
    const { exerciseName, type, value, previousValue } = prData;
    
    if (type === 'weight') {
      return `New ${exerciseName} PR! 🎉 ${value} lbs (previous: ${previousValue} lbs)`;
    } else if (type === 'reps') {
      return `New ${exerciseName} Rep PR! 🎉 ${value} reps (previous: ${previousValue} reps)`;
    } else if (type === 'oneRepMax') {
      return `New ${exerciseName} 1RM! 🎉 ${value} lbs (previous: ${previousValue} lbs)`;
    }
    return `New ${exerciseName} PR! 🎉`;
  };

  return (
    <Snackbar
      open={open}
      autoHideDuration={4000}
      onClose={onClose}
      anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      TransitionComponent={Slide}
    >
      <Alert
        onClose={onClose}
        severity="success"
        variant="filled"
        sx={{
          width: '100%',
          fontSize: '1rem',
          '& .MuiAlert-icon': {
            fontSize: '2rem',
          },
        }}
        icon={<EmojiEvents />}
      >
        {getMessage()}
      </Alert>
    </Snackbar>
  );
};

PRNotification.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  prData: PropTypes.shape({
    exerciseName: PropTypes.string.isRequired,
    type: PropTypes.string.isRequired,
    value: PropTypes.number.isRequired,
    previousValue: PropTypes.number,
  }),
};

/**
 * Milestone Achievement Dialog
 * Shows a celebratory popup when a streak milestone is reached
 */
export const MilestoneDialog = ({ open, onClose, milestone }) => {
  if (!milestone) return null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          textAlign: 'center',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
        },
      }}
    >
      <DialogContent sx={{ py: 4 }}>
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{
            type: 'spring',
            stiffness: 260,
            damping: 20,
          }}
        >
          <Box sx={{ fontSize: '5rem', mb: 2 }}>
            {milestone.badge.split(' ')[0]}
          </Box>
        </motion.div>

        <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
          Congratulations!
        </Typography>

        <Typography variant="h5" sx={{ mb: 2, opacity: 0.9 }}>
          {milestone.badge}
        </Typography>

        <Typography variant="body1" sx={{ opacity: 0.8 }}>
          {milestone.description}
        </Typography>

        <Box
          sx={{
            mt: 3,
            p: 2,
            borderRadius: 2,
            bgcolor: 'rgba(255, 255, 255, 0.1)',
          }}
        >
          <Typography variant="body2" sx={{ opacity: 0.9 }}>
            Keep up the amazing work! Consistency is key to success.
          </Typography>
        </Box>
      </DialogContent>

      <DialogActions sx={{ justifyContent: 'center', pb: 3 }}>
        <Button
          onClick={onClose}
          variant="contained"
          size="large"
          sx={{
            bgcolor: 'white',
            color: 'primary.main',
            '&:hover': {
              bgcolor: 'rgba(255, 255, 255, 0.9)',
            },
            px: 4,
          }}
        >
          Keep Going!
        </Button>
      </DialogActions>
    </Dialog>
  );
};

MilestoneDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  milestone: PropTypes.shape({
    days: PropTypes.number.isRequired,
    badge: PropTypes.string.isRequired,
    description: PropTypes.string.isRequired,
  }),
};

/**
 * Weekly Summary Dialog
 * Shows a summary of the week's activities
 */
export const WeeklySummaryDialog = ({ open, onClose, summary }) => {
  if (!summary) return null;

  const {
    workoutsCompleted = 0,
    totalVolume = 0,
    totalTime = 0,
    prsAchieved = 0,
    topExercises = [],
    adherence = 0,
  } = summary;

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const stats = [
    {
      icon: <LocalFireDepartment />,
      label: 'Workouts',
      value: workoutsCompleted,
      color: 'error.main',
    },
    {
      icon: <TrendingUp />,
      label: 'Total Volume',
      value: `${totalVolume.toLocaleString()} lbs`,
      color: 'success.main',
    },
    {
      icon: <EmojiEvents />,
      label: 'PRs',
      value: prsAchieved,
      color: 'warning.main',
    },
  ];

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: { borderRadius: 3 },
      }}
    >
      <DialogTitle sx={{ textAlign: 'center', pb: 1 }}>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          Weekly Summary 📊
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Here's how you did this week
        </Typography>
      </DialogTitle>

      <DialogContent>
        <Stack spacing={3}>
          {/* Stats Grid */}
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 2,
            }}
          >
            {stats.map((stat, index) => (
              <Box
                key={index}
                sx={{
                  p: 2,
                  borderRadius: 2,
                  bgcolor: 'action.hover',
                  textAlign: 'center',
                }}
              >
                <Box sx={{ color: stat.color, mb: 1 }}>
                  {stat.icon}
                </Box>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  {stat.value}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {stat.label}
                </Typography>
              </Box>
            ))}
          </Box>

          {/* Total Time */}
          <Box
            sx={{
              p: 2,
              borderRadius: 2,
              bgcolor: 'primary.main',
              color: 'white',
              textAlign: 'center',
            }}
          >
            <Typography variant="body2" sx={{ opacity: 0.9, mb: 0.5 }}>
              Total Training Time
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 700 }}>
              {formatTime(totalTime)}
            </Typography>
          </Box>

          {/* Adherence */}
          <Box
            sx={{
              p: 2,
              borderRadius: 2,
              border: '1px solid',
              borderColor: 'divider',
            }}
          >
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                Adherence
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 700, color: 'primary.main' }}>
                {adherence}%
              </Typography>
            </Stack>
            <Box
              sx={{
                height: 8,
                borderRadius: 4,
                bgcolor: 'action.hover',
                overflow: 'hidden',
              }}
            >
              <Box
                sx={{
                  height: '100%',
                  width: `${adherence}%`,
                  bgcolor: adherence >= 80 ? 'success.main' : adherence >= 60 ? 'warning.main' : 'error.main',
                  transition: 'width 0.3s ease',
                }}
              />
            </Box>
          </Box>

          {/* Top Exercises */}
          {topExercises.length > 0 && (
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                Most Performed Exercises
              </Typography>
              <Stack spacing={1}>
                {topExercises.slice(0, 3).map((exercise, index) => (
                  <Box
                    key={index}
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      p: 1.5,
                      borderRadius: 1,
                      bgcolor: 'action.hover',
                    }}
                  >
                    <Typography variant="body2">{exercise.name}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {exercise.count}x
                    </Typography>
                  </Box>
                ))}
              </Stack>
            </Box>
          )}

          {/* Motivation */}
          <Box
            sx={{
              p: 2,
              borderRadius: 2,
              bgcolor: 'action.hover',
              textAlign: 'center',
            }}
          >
            <Typography variant="body2" color="text.secondary">
              {adherence >= 80
                ? "🎉 Outstanding! You're crushing your goals!"
                : adherence >= 60
                ? "💪 Great effort! Keep pushing forward!"
                : "🌟 Every workout counts! You've got this!"}
            </Typography>
          </Box>
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={onClose} variant="contained" fullWidth size="large">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

WeeklySummaryDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  summary: PropTypes.shape({
    workoutsCompleted: PropTypes.number,
    totalVolume: PropTypes.number,
    totalTime: PropTypes.number,
    prsAchieved: PropTypes.number,
    topExercises: PropTypes.arrayOf(
      PropTypes.shape({
        name: PropTypes.string,
        count: PropTypes.number,
      })
    ),
    adherence: PropTypes.number,
  }),
};

/**
 * Combined Celebration Manager
 * Manages all celebration notifications and dialogs
 */
export const CelebrationManager = ({ 
  prNotifications = [],
  milestones = [],
  weeklySummary = null,
  onDismissPR,
  onDismissMilestone,
  onDismissWeeklySummary,
}) => {
  const [currentPRIndex, setCurrentPRIndex] = useState(0);
  const [currentMilestoneIndex, setCurrentMilestoneIndex] = useState(0);

  // Show PRs one at a time
  const handleClosePR = () => {
    if (onDismissPR) {
      onDismissPR(currentPRIndex);
    }
    setCurrentPRIndex(prev => prev + 1);
  };

  // Show milestones one at a time
  const handleCloseMilestone = () => {
    if (onDismissMilestone) {
      onDismissMilestone(currentMilestoneIndex);
    }
    setCurrentMilestoneIndex(prev => prev + 1);
  };

  const currentPR = prNotifications[currentPRIndex];
  const currentMilestone = milestones[currentMilestoneIndex];

  return (
    <>
      <AnimatePresence>
        {currentPR && (
          <PRNotification
            open={true}
            onClose={handleClosePR}
            prData={currentPR}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {currentMilestone && (
          <MilestoneDialog
            open={true}
            onClose={handleCloseMilestone}
            milestone={currentMilestone}
          />
        )}
      </AnimatePresence>

      {weeklySummary && (
        <WeeklySummaryDialog
          open={true}
          onClose={onDismissWeeklySummary}
          summary={weeklySummary}
        />
      )}
    </>
  );
};

CelebrationManager.propTypes = {
  prNotifications: PropTypes.array,
  milestones: PropTypes.array,
  weeklySummary: PropTypes.object,
  onDismissPR: PropTypes.func,
  onDismissMilestone: PropTypes.func,
  onDismissWeeklySummary: PropTypes.func,
};
