import { memo, useState } from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Stack,
  Chip,
  LinearProgress,
  Tooltip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
} from '@mui/material';
import {
  LocalFireDepartment,
  TrendingUp,
  CheckCircle,
  HelpOutline,
} from '@mui/icons-material';
import { getStreakMilestones } from '../../utils/trackingMetrics';

/**
 * Streak Display Component
 * Shows current streak with flame emoji and milestone badges
 */
export const StreakDisplay = memo(({ currentStreak = 0, longestStreak = 0 }) => {
  const milestones = getStreakMilestones(currentStreak);
  const latestMilestone = milestones.length > 0 ? milestones[milestones.length - 1] : null;
  const [infoOpen, setInfoOpen] = useState(false);

  return (
    <>
      <Card
        sx={{
          borderRadius: 3,
          boxShadow: '0 4px 16px rgba(19, 70, 134, 0.08)',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
        }}
      >
        <CardContent sx={{ p: 2.5 }}>
          <Stack spacing={2}>
            {/* Current Streak */}
            <Box sx={{ textAlign: 'center' }}>
              <Box sx={{ fontSize: '3rem', mb: 1 }}>
                🔥
              </Box>
              <Typography variant="h3" sx={{ fontWeight: 700, mb: 0.5 }}>
                {currentStreak}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  Day Streak
                </Typography>
                <IconButton
                  size="small"
                  onClick={() => setInfoOpen(true)}
                  sx={{
                    color: 'white',
                    opacity: 0.9,
                    '&:hover': { opacity: 1, bgcolor: 'rgba(255, 255, 255, 0.1)' },
                  }}
                >
                  <HelpOutline fontSize="small" />
                </IconButton>
              </Box>
            </Box>

            {/* Milestone Badges */}
            {milestones.length > 0 && (
              <Box>
                <Typography
                  variant="caption"
                  sx={{
                    opacity: 0.8,
                    display: 'block',
                    textAlign: 'center',
                    mb: 1,
                  }}
                >
                  Milestones Achieved
                </Typography>
                <Stack
                  direction="row"
                  spacing={1}
                  sx={{
                    justifyContent: 'center',
                    flexWrap: 'wrap',
                    gap: 1,
                  }}
                >
                  {milestones.map((milestone, index) => (
                    <Tooltip key={index} title={milestone.description}>
                      <Chip
                        label={`${milestone.days} days`}
                        size="small"
                        sx={{
                          bgcolor: 'rgba(255, 255, 255, 0.2)',
                          color: 'white',
                          fontWeight: 600,
                          '&:hover': {
                            bgcolor: 'rgba(255, 255, 255, 0.3)',
                          },
                        }}
                        icon={
                          <Box
                            component="span"
                            sx={{ fontSize: '1rem', ml: 0.5 }}
                          >
                            {milestone.badge.split(' ')[0]}
                          </Box>
                        }
                      />
                    </Tooltip>
                  ))}
                </Stack>
              </Box>
            )}

            {/* Latest Badge */}
            {latestMilestone && (
              <Box
                sx={{
                  p: 1.5,
                  borderRadius: 2,
                  bgcolor: 'rgba(255, 255, 255, 0.15)',
                  textAlign: 'center',
                }}
              >
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  {latestMilestone.badge}
                </Typography>
              </Box>
            )}

            {/* Longest Streak */}
            {longestStreak > currentStreak && (
              <Box sx={{ textAlign: 'center', pt: 1, borderTop: '1px solid rgba(255, 255, 255, 0.2)' }}>
                <Typography variant="caption" sx={{ opacity: 0.8 }}>
                  Personal Best: {longestStreak} days
                </Typography>
              </Box>
            )}
          </Stack>
        </CardContent>
      </Card>

      {/* Streak Info Dialog */}
      <Dialog
        open={infoOpen}
        onClose={() => setInfoOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
          },
        }}
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <LocalFireDepartment color="warning" />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              How Streaks Work
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2}>
            <Typography variant="body1">
              Your streak counts <strong>consecutive days</strong> with at least one workout session.
            </Typography>
            
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
                📅 Crossing Week Boundaries
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Streaks continue seamlessly from Saturday to Sunday. Each day with a session adds 1 day to your streak, regardless of which week it falls in.
              </Typography>
            </Box>

            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
                💪 Strength Training Requirement
              </Typography>
              <Typography variant="body2" color="text.secondary">
                For a streak to stay "alive," each week (Sunday-Saturday) that contains streak days must have at least 1 strength training session.
              </Typography>
            </Box>

            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
                🏋️ What Counts as Strength Training?
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Full body, upper/lower body, push/pull/legs workouts, and any workout with resistance exercises.
              </Typography>
            </Box>

            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
                ⛔ When Streaks Break
              </Typography>
              <Typography variant="body2" color="text.secondary">
                • Missing a day (no workout session)
                <br />
                • A week in your streak has no strength training sessions
                <br />
                • Last workout was more than 1 day ago
              </Typography>
            </Box>

            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
                📊 Example
              </Typography>
              <Typography variant="body2" color="text.secondary">
                If you work out Saturday (strength) → Sunday (cardio) → Monday (strength) → Tuesday (cardio) → Wednesday (strength) → Thursday (cardio), that's a 6-day streak!
              </Typography>
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setInfoOpen(false)} variant="contained" fullWidth>
            Got it!
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
});

StreakDisplay.displayName = 'StreakDisplay';

StreakDisplay.propTypes = {
  currentStreak: PropTypes.number,
  longestStreak: PropTypes.number,
};

/**
 * Adherence Display Component
 * Shows adherence percentage with progress bar
 */
export const AdherenceDisplay = memo(({ adherence = 0, completedWorkouts = 0, plannedWorkouts = 0 }) => {
  const getColor = () => {
    if (adherence >= 80) return 'success.main';
    if (adherence >= 60) return 'warning.main';
    return 'error.main';
  };

  const getMessage = () => {
    if (adherence >= 80) return 'Excellent! 🎉';
    if (adherence >= 60) return 'Good progress! 💪';
    return 'Keep going! 🌟';
  };

  return (
    <Card
      sx={{
        borderRadius: 3,
        boxShadow: '0 4px 16px rgba(19, 70, 134, 0.08)',
      }}
    >
      <CardContent sx={{ p: 2.5 }}>
        <Stack spacing={2}>
          {/* Header */}
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CheckCircle sx={{ color: getColor() }} />
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Adherence
              </Typography>
            </Box>
            <Typography variant="h4" sx={{ fontWeight: 700, color: getColor() }}>
              {adherence}%
            </Typography>
          </Stack>

          {/* Progress Bar */}
          <Box>
            <LinearProgress
              variant="determinate"
              value={adherence}
              sx={{
                height: 12,
                borderRadius: 6,
                bgcolor: 'action.hover',
                '& .MuiLinearProgress-bar': {
                  bgcolor: getColor(),
                  borderRadius: 6,
                },
              }}
            />
          </Box>

          {/* Stats */}
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="body2" color="text.secondary">
              {completedWorkouts} of {plannedWorkouts} workouts completed
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 600, color: getColor() }}>
              {getMessage()}
            </Typography>
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
});

AdherenceDisplay.displayName = 'AdherenceDisplay';

AdherenceDisplay.propTypes = {
  adherence: PropTypes.number,
  completedWorkouts: PropTypes.number,
  plannedWorkouts: PropTypes.number,
};

/**
 * Volume Trend Display
 * Shows total volume trend
 */
export const VolumeTrendDisplay = memo(({ totalVolume = 0, volumeChange = 0 }) => {
  const isPositive = volumeChange >= 0;

  return (
    <Card
      sx={{
        borderRadius: 3,
        boxShadow: '0 4px 16px rgba(19, 70, 134, 0.08)',
      }}
    >
      <CardContent sx={{ p: 2.5 }}>
        <Stack spacing={2}>
          {/* Header */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <TrendingUp sx={{ color: 'primary.main' }} />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Total Volume
            </Typography>
          </Box>

          {/* Volume */}
          <Box>
            <Typography variant="h3" sx={{ fontWeight: 700, color: 'primary.main' }}>
              {totalVolume.toLocaleString()}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              lbs lifted (last 30 days)
            </Typography>
          </Box>

          {/* Trend */}
          {volumeChange !== 0 && (
            <Box
              sx={{
                p: 1.5,
                borderRadius: 2,
                bgcolor: isPositive ? 'success.light' : 'error.light',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 0.5,
              }}
            >
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 600,
                  color: isPositive ? 'success.dark' : 'error.dark',
                }}
              >
                {isPositive ? '↑' : '↓'} {Math.abs(volumeChange)}%
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  color: isPositive ? 'success.dark' : 'error.dark',
                }}
              >
                vs. previous 30 days
              </Typography>
            </Box>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
});

VolumeTrendDisplay.displayName = 'VolumeTrendDisplay';

VolumeTrendDisplay.propTypes = {
  totalVolume: PropTypes.number,
  volumeChange: PropTypes.number,
};
