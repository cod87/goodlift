import { useState } from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  LinearProgress,
  Stack,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Tabs,
  Tab,
  Tooltip,
} from '@mui/material';
import {
  Lock,
  Share,
  Close,
  EmojiEvents,
  TrendingUp,
  Whatshot,
  AccessTime,
  FitnessCenter,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ACHIEVEMENT_BADGES,
  ACHIEVEMENT_TIERS,
  isAchievementUnlocked,
  getNextAchievementProgress,
  calculateAchievementPoints,
  calculateUserLevel,
} from '../data/achievements';

/**
 * Achievement Badge Card Component
 * Displays a single achievement with unlock status
 */
const AchievementBadge = ({ achievement, unlocked, onClick }) => {
  const tier = ACHIEVEMENT_TIERS[achievement.tier];
  
  return (
    <motion.div
      whileHover={{ scale: unlocked ? 1.05 : 1.02 }}
      whileTap={{ scale: 0.98 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card
        onClick={onClick}
        sx={{
          height: '100%',
          cursor: 'pointer',
          position: 'relative',
          background: unlocked ? tier.gradient : 'linear-gradient(135deg, #424242 0%, #303030 100%)',
          color: unlocked ? tier.textColor : '#888',
          transition: 'all 0.3s ease',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: unlocked ? 6 : 2,
          },
        }}
      >
        <CardContent sx={{ textAlign: 'center', p: 2 }}>
          {/* Lock overlay for locked achievements */}
          {!unlocked && (
            <Box
              sx={{
                position: 'absolute',
                top: 8,
                right: 8,
                color: 'rgba(255, 255, 255, 0.5)',
              }}
            >
              <Lock fontSize="small" />
            </Box>
          )}
          
          {/* Icon */}
          <Typography
            variant="h2"
            sx={{
              fontSize: '3rem',
              mb: 1,
              filter: unlocked ? 'none' : 'grayscale(100%)',
              opacity: unlocked ? 1 : 0.4,
            }}
          >
            {achievement.icon}
          </Typography>
          
          {/* Name */}
          <Typography
            variant="subtitle1"
            sx={{
              fontWeight: 700,
              mb: 0.5,
              fontSize: '0.95rem',
            }}
          >
            {achievement.name}
          </Typography>
          
          {/* Tier badge */}
          <Chip
            label={achievement.tier.toUpperCase()}
            size="small"
            sx={{
              fontSize: '0.65rem',
              height: 20,
              fontWeight: 600,
              bgcolor: unlocked ? 'rgba(255, 255, 255, 0.3)' : 'rgba(255, 255, 255, 0.1)',
            }}
          />
        </CardContent>
      </Card>
    </motion.div>
  );
};

AchievementBadge.propTypes = {
  achievement: PropTypes.object.isRequired,
  unlocked: PropTypes.bool.isRequired,
  onClick: PropTypes.func.isRequired,
};

/**
 * Achievement Detail Dialog
 * Shows detailed information about an achievement
 */
const AchievementDetailDialog = ({ achievement, unlocked, onClose, onShare }) => {
  if (!achievement) return null;
  
  const tier = ACHIEVEMENT_TIERS[achievement.tier];
  
  return (
    <Dialog
      open={Boolean(achievement)}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
        },
      }}
    >
      <DialogTitle sx={{ textAlign: 'center', pb: 1 }}>
        <IconButton
          onClick={onClose}
          sx={{
            position: 'absolute',
            right: 8,
            top: 8,
          }}
        >
          <Close />
        </IconButton>
      </DialogTitle>
      
      <DialogContent sx={{ textAlign: 'center', pt: 0 }}>
        {/* Icon with background */}
        <Box
          sx={{
            width: 120,
            height: 120,
            borderRadius: '50%',
            background: unlocked ? tier.gradient : 'linear-gradient(135deg, #424242 0%, #303030 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
            filter: unlocked ? 'none' : 'grayscale(100%)',
            opacity: unlocked ? 1 : 0.6,
          }}
        >
          <Typography variant="h1" sx={{ fontSize: '4rem' }}>
            {achievement.icon}
          </Typography>
        </Box>
        
        {/* Status */}
        {!unlocked && (
          <Chip
            icon={<Lock />}
            label="LOCKED"
            color="default"
            sx={{ mb: 2 }}
          />
        )}
        
        {unlocked && (
          <Chip
            icon={<EmojiEvents />}
            label="UNLOCKED"
            color="success"
            sx={{ mb: 2 }}
          />
        )}
        
        {/* Name */}
        <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
          {achievement.name}
        </Typography>
        
        {/* Tier */}
        <Chip
          label={achievement.tier.toUpperCase()}
          size="small"
          sx={{
            mb: 2,
            fontWeight: 600,
            background: tier.gradient,
            color: tier.textColor,
          }}
        />
        
        {/* Description */}
        <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
          {achievement.description}
        </Typography>
        
        {/* Condition details */}
        <Box
          sx={{
            p: 2,
            borderRadius: 2,
            bgcolor: 'action.hover',
          }}
        >
          <Typography variant="body2" color="text.secondary">
            {getConditionText(achievement.condition)}
          </Typography>
        </Box>
      </DialogContent>
      
      <DialogActions sx={{ justifyContent: 'center', pb: 3, px: 3 }}>
        {unlocked && onShare && (
          <Button
            variant="contained"
            startIcon={<Share />}
            onClick={() => onShare(achievement)}
            fullWidth
          >
            Share Achievement
          </Button>
        )}
        {!unlocked && (
          <Button variant="outlined" onClick={onClose} fullWidth>
            Close
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

AchievementDetailDialog.propTypes = {
  achievement: PropTypes.object,
  unlocked: PropTypes.bool,
  onClose: PropTypes.func.isRequired,
  onShare: PropTypes.func,
};

/**
 * Progress Card Component
 * Shows progress toward next achievement in a category
 */
const ProgressCard = ({ title, icon, progressInfo }) => {
  if (!progressInfo) {
    return (
      <Card sx={{ height: '100%' }}>
        <CardContent>
          <Stack spacing={1}>
            <Stack direction="row" alignItems="center" spacing={1}>
              {icon}
              <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1rem' }}>
                {title}
              </Typography>
            </Stack>
            <Typography variant="body2" color="text.secondary">
              All achievements unlocked! 🎉
            </Typography>
          </Stack>
        </CardContent>
      </Card>
    );
  }
  
  const { achievement, current, target, progress } = progressInfo;
  
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Stack spacing={2}>
          <Stack direction="row" alignItems="center" spacing={1}>
            {icon}
            <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1rem' }}>
              {title}
            </Typography>
          </Stack>
          
          <Box>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {achievement.name}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {formatValue(current, achievement.condition.type)} / {formatValue(target, achievement.condition.type)}
              </Typography>
            </Stack>
            
            <LinearProgress
              variant="determinate"
              value={progress}
              sx={{
                height: 8,
                borderRadius: 4,
                bgcolor: 'action.hover',
                '& .MuiLinearProgress-bar': {
                  background: ACHIEVEMENT_TIERS[achievement.tier].gradient,
                  borderRadius: 4,
                },
              }}
            />
            
            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
              {Math.round(progress)}% complete
            </Typography>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
};

ProgressCard.propTypes = {
  title: PropTypes.string.isRequired,
  icon: PropTypes.element.isRequired,
  progressInfo: PropTypes.object,
};

/**
 * Main Achievements Component
 * Displays achievement grid, progress, and user level
 */
const Achievements = ({ userStats, workoutHistory = [] }) => {
  const [selectedAchievement, setSelectedAchievement] = useState(null);
  const [selectedAchievementUnlocked, setSelectedAchievementUnlocked] = useState(false);
  const [currentTab, setCurrentTab] = useState(0);
  
  // Calculate unlocked achievements
  const unlockedAchievements = ACHIEVEMENT_BADGES.filter(achievement =>
    isAchievementUnlocked(achievement, userStats, workoutHistory)
  );
  
  // Calculate points and level
  const totalPoints = calculateAchievementPoints(unlockedAchievements);
  const levelInfo = calculateUserLevel(totalPoints);
  
  // Group achievements by type
  const achievementCategories = {
    workout: ACHIEVEMENT_BADGES.filter(a => a.condition.type === 'workoutCount'),
    streak: ACHIEVEMENT_BADGES.filter(a => a.condition.type === 'streak'),
    pr: ACHIEVEMENT_BADGES.filter(a => a.condition.type === 'prCount'),
    volume: ACHIEVEMENT_BADGES.filter(a => a.condition.type === 'totalVolume'),
    time: ACHIEVEMENT_BADGES.filter(a => a.condition.type === 'totalTime'),
    special: ACHIEVEMENT_BADGES.filter(a => a.condition.type === 'special'),
  };
  
  const categories = [
    { label: 'All', key: 'all' },
    { label: 'Workouts', key: 'workout' },
    { label: 'Streaks', key: 'streak' },
    { label: 'PRs', key: 'pr' },
    { label: 'Volume', key: 'volume' },
    { label: 'Time', key: 'time' },
    { label: 'Special', key: 'special' },
  ];
  
  const currentCategory = categories[currentTab].key;
  const displayedAchievements = currentCategory === 'all'
    ? ACHIEVEMENT_BADGES
    : achievementCategories[currentCategory];
  
  // Get progress for main categories
  const workoutProgress = getNextAchievementProgress(achievementCategories.workout, userStats, workoutHistory);
  const streakProgress = getNextAchievementProgress(achievementCategories.streak, userStats, workoutHistory);
  const prProgress = getNextAchievementProgress(achievementCategories.pr, userStats, workoutHistory);
  const volumeProgress = getNextAchievementProgress(achievementCategories.volume, userStats, workoutHistory);
  
  const handleAchievementClick = (achievement) => {
    setSelectedAchievement(achievement);
    setSelectedAchievementUnlocked(
      isAchievementUnlocked(achievement, userStats, workoutHistory)
    );
  };
  
  const handleShare = async (achievement) => {
    const text = `I just unlocked the "${achievement.name}" achievement in GoodLift! ${achievement.icon}\n\n${achievement.description}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'GoodLift Achievement',
          text: text,
        });
      } catch (error) {
        if (error.name !== 'AbortError') {
          console.error('Error sharing:', error);
          copyToClipboard(text);
        }
      }
    } else {
      copyToClipboard(text);
    }
  };
  
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      alert('Achievement text copied to clipboard!');
    });
  };
  
  return (
    <Box sx={{ p: { xs: 2, sm: 3 } }}>
      {/* Header with Level Display */}
      <Box sx={{ mb: 4, textAlign: 'center' }}>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
          Achievements
        </Typography>
        
        <Stack direction="row" spacing={2} justifyContent="center" alignItems="center" sx={{ mb: 2 }}>
          <Chip
            icon={<EmojiEvents />}
            label={`Level ${levelInfo.level}`}
            color="primary"
            sx={{ fontSize: '1rem', fontWeight: 600, height: 36 }}
          />
          <Chip
            label={`${unlockedAchievements.length} / ${ACHIEVEMENT_BADGES.length} Unlocked`}
            variant="outlined"
            sx={{ fontSize: '0.9rem', height: 36 }}
          />
        </Stack>
        
        {/* Level progress bar */}
        <Box sx={{ maxWidth: 400, margin: '0 auto' }}>
          <Stack direction="row" justifyContent="space-between" sx={{ mb: 1 }}>
            <Typography variant="caption" color="text.secondary">
              {levelInfo.currentPoints} / 100 points
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {levelInfo.pointsToNext} to Level {levelInfo.level + 1}
            </Typography>
          </Stack>
          <LinearProgress
            variant="determinate"
            value={(levelInfo.currentPoints / 100) * 100}
            sx={{
              height: 10,
              borderRadius: 5,
              bgcolor: 'action.hover',
              '& .MuiLinearProgress-bar': {
                borderRadius: 5,
              },
            }}
          />
        </Box>
      </Box>
      
      {/* Progress Cards */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <ProgressCard
            title="Workouts"
            icon={<FitnessCenter color="primary" />}
            progressInfo={workoutProgress}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <ProgressCard
            title="Streak"
            icon={<Whatshot sx={{ color: '#FF6B35' }} />}
            progressInfo={streakProgress}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <ProgressCard
            title="Personal Records"
            icon={<TrendingUp color="success" />}
            progressInfo={prProgress}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <ProgressCard
            title="Volume"
            icon={<EmojiEvents sx={{ color: '#FFD700' }} />}
            progressInfo={volumeProgress}
          />
        </Grid>
      </Grid>
      
      {/* Category Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs
          value={currentTab}
          onChange={(e, newValue) => setCurrentTab(newValue)}
          variant="scrollable"
          scrollButtons="auto"
        >
          {categories.map((category) => (
            <Tab key={category.key} label={category.label} />
          ))}
        </Tabs>
      </Box>
      
      {/* Achievement Grid */}
      <Grid container spacing={2}>
        {displayedAchievements.map((achievement) => {
          const unlocked = isAchievementUnlocked(achievement, userStats, workoutHistory);
          return (
            <Grid item xs={6} sm={4} md={3} lg={2} key={achievement.id}>
              <AchievementBadge
                achievement={achievement}
                unlocked={unlocked}
                onClick={() => handleAchievementClick(achievement)}
              />
            </Grid>
          );
        })}
      </Grid>
      
      {/* Achievement Detail Dialog */}
      <AchievementDetailDialog
        achievement={selectedAchievement}
        unlocked={selectedAchievementUnlocked}
        onClose={() => setSelectedAchievement(null)}
        onShare={handleShare}
      />
    </Box>
  );
};

Achievements.propTypes = {
  userStats: PropTypes.shape({
    totalWorkouts: PropTypes.number,
    currentStreak: PropTypes.number,
    totalPRs: PropTypes.number,
    totalVolume: PropTypes.number,
    totalTime: PropTypes.number,
  }).isRequired,
  workoutHistory: PropTypes.array,
};

// Helper functions
const getConditionText = (condition) => {
  switch (condition.type) {
    case 'workoutCount':
      return `Complete ${condition.value} workout${condition.value !== 1 ? 's' : ''}`;
    case 'streak':
      return `Maintain a ${condition.value}-day workout streak`;
    case 'prCount':
      return `Achieve ${condition.value} personal record${condition.value !== 1 ? 's' : ''}`;
    case 'totalVolume':
      return `Lift ${condition.value.toLocaleString()} lbs total volume`;
    case 'totalTime': {
      const hours = Math.floor(condition.value / 3600);
      return `Complete ${hours} hour${hours !== 1 ? 's' : ''} of total workout time`;
    }
    case 'special':
      return condition.value;
    default:
      return '';
  }
};

const formatValue = (value, type) => {
  switch (type) {
    case 'totalVolume':
      return `${value.toLocaleString()} lbs`;
    case 'totalTime': {
      const hours = Math.floor(value / 3600);
      const minutes = Math.floor((value % 3600) / 60);
      if (hours > 0) {
        return `${hours}h ${minutes}m`;
      }
      return `${minutes}m`;
    }
    default:
      return value;
  }
};

export default Achievements;
