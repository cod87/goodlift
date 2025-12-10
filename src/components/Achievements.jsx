import { useState, useEffect } from 'react';
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
  Divider,
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
  DirectionsRun,
  SelfImprovement,
  Favorite,
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
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      style={{ height: '100%' }}
    >
      <Card
        onClick={onClick}
        sx={{
          height: '100%',
          cursor: 'pointer',
          position: 'relative',
          background: unlocked ? tier.gradient : 'linear-gradient(135deg, #424242 0%, #303030 100%)',
          color: unlocked ? tier.textColor : '#888',
          transition: 'all 0.2s ease',
          display: 'flex',
          flexDirection: 'column',
          '&:hover': {
            transform: 'translateY(-2px)',
            opacity: 0.9,
          },
          '&:active': {
            transform: 'translateY(0)',
            opacity: 0.8,
          },
        }}
      >
        <CardContent 
          sx={{ 
            textAlign: 'center', 
            p: { xs: 1.5, sm: 2 },
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            flexGrow: 1,
            '&:last-child': { pb: { xs: 1.5, sm: 2 } }
          }}
        >
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
              fontSize: { xs: '2.5rem', sm: '3rem' },
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
              fontSize: { xs: '0.85rem', sm: '0.95rem' },
              lineHeight: 1.2,
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
 * Compact Summary Card Component
 * Minimalist display of progress toward next achievement
 */
const CompactSummaryCard = ({ title, icon, progressInfo, iconColor }) => {
  if (!progressInfo) {
    return (
      <Card 
        sx={{ 
          height: '100%',
          background: 'linear-gradient(135deg, rgba(76, 175, 80, 0.1) 0%, rgba(76, 175, 80, 0.05) 100%)',
          border: '1px solid rgba(76, 175, 80, 0.2)',
        }}
      >
        <CardContent sx={{ p: { xs: 1.5, sm: 2 }, '&:last-child': { pb: { xs: 1.5, sm: 2 } } }}>
          <Stack spacing={1} alignItems="center" textAlign="center">
            <Box sx={{ color: iconColor || 'primary.main', fontSize: '1.5rem' }}>
              {icon}
            </Box>
            <Typography variant="caption" sx={{ fontWeight: 600, fontSize: '0.7rem', opacity: 0.8 }}>
              {title}
            </Typography>
            <Typography variant="caption" sx={{ fontSize: '0.65rem', color: 'success.main' }}>
              Complete ✓
            </Typography>
          </Stack>
        </CardContent>
      </Card>
    );
  }
  
  const { achievement, current, target, progress } = progressInfo;
  
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent sx={{ p: { xs: 1.5, sm: 2 }, '&:last-child': { pb: { xs: 1.5, sm: 2 } } }}>
        <Stack spacing={1} alignItems="center" textAlign="center">
          <Box sx={{ color: iconColor || 'primary.main', fontSize: '1.5rem' }}>
            {icon}
          </Box>
          <Typography variant="caption" sx={{ fontWeight: 600, fontSize: '0.7rem', opacity: 0.8 }}>
            {title}
          </Typography>
          <Typography variant="caption" sx={{ fontWeight: 700, fontSize: '0.75rem' }}>
            {achievement.name}
          </Typography>
          <Box sx={{ width: '100%' }}>
            <LinearProgress
              variant="determinate"
              value={progress}
              sx={{
                height: 6,
                borderRadius: 3,
                bgcolor: 'action.hover',
                '& .MuiLinearProgress-bar': {
                  background: ACHIEVEMENT_TIERS[achievement.tier].gradient,
                  borderRadius: 3,
                },
              }}
            />
            <Typography variant="caption" sx={{ fontSize: '0.65rem', color: 'text.secondary', display: 'block', mt: 0.5 }}>
              {formatValue(current, achievement.condition.type)} / {formatValue(target, achievement.condition.type)}
            </Typography>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
};

CompactSummaryCard.propTypes = {
  title: PropTypes.string.isRequired,
  icon: PropTypes.element.isRequired,
  progressInfo: PropTypes.object,
  iconColor: PropTypes.string,
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
  
  // Calculate points and level from new points tracking system
  // Import getTotalPoints dynamically to get accurate point total
  const [totalPoints, setTotalPoints] = useState(0);
  
  useEffect(() => {
    const loadPoints = async () => {
      try {
        const { getTotalPoints } = await import('../utils/pointsTracking');
        const points = getTotalPoints(unlockedAchievements);
        setTotalPoints(points);
      } catch (error) {
        console.error('Error loading points:', error);
        // Fallback to badge-only points
        const badgePoints = calculateAchievementPoints(unlockedAchievements);
        setTotalPoints(badgePoints);
      }
    };
    
    loadPoints();
  }, [unlockedAchievements.length]); // Re-calculate when achievements change
  
  const levelInfo = calculateUserLevel(totalPoints);
  
  // Group achievements by type
  const achievementCategories = {
    overall: ACHIEVEMENT_BADGES.filter(a => a.condition.type === 'sessionCount'),
    streak: ACHIEVEMENT_BADGES.filter(a => a.condition.type === 'streak'),
    volume: ACHIEVEMENT_BADGES.filter(a => a.condition.type === 'totalVolume'),
    singleSession: ACHIEVEMENT_BADGES.filter(a => a.condition.type === 'singleSessionVolume'),
    strength: ACHIEVEMENT_BADGES.filter(a => a.condition.type === 'strengthWorkoutCount'),
    cardio: ACHIEVEMENT_BADGES.filter(a => a.condition.type === 'cardioWorkoutCount'),
    cardioTime: ACHIEVEMENT_BADGES.filter(a => a.condition.type === 'cardioTime'),
    yoga: ACHIEVEMENT_BADGES.filter(a => a.condition.type === 'yogaWorkoutCount'),
    yogaTime: ACHIEVEMENT_BADGES.filter(a => a.condition.type === 'yogaTime'),
    strengthStreak: ACHIEVEMENT_BADGES.filter(a => a.condition.type === 'strengthWeekStreak'),
    wellness: ACHIEVEMENT_BADGES.filter(a => a.condition.type === 'wellnessTaskCount'),
    special: ACHIEVEMENT_BADGES.filter(a => a.condition.type === 'special'),
  };
  
  const categories = [
    { label: 'All', key: 'all' },
    { label: 'Overall', key: 'overall' },
    { label: 'Strength', key: 'strength' },
    { label: 'Cardio', key: 'cardio' },
    { label: 'Yoga', key: 'yoga' },
    { label: 'Streaks', key: 'streak' },
    { label: 'Weekly', key: 'strengthStreak' },
    { label: 'Volume', key: 'volume' },
    { label: 'Heavy Sessions', key: 'singleSession' },
    { label: 'Cardio Time', key: 'cardioTime' },
    { label: 'Yoga Time', key: 'yogaTime' },
    { label: 'Wellness', key: 'wellness' },
    { label: 'Special', key: 'special' },
  ];
  
  const currentCategory = categories[currentTab].key;
  const displayedAchievements = currentCategory === 'all'
    ? ACHIEVEMENT_BADGES
    : achievementCategories[currentCategory];
  
  // Get progress for main categories
  const overallProgress = getNextAchievementProgress(achievementCategories.overall, userStats, workoutHistory);
  const streakProgress = getNextAchievementProgress(achievementCategories.streak, userStats, workoutHistory);
  const strengthProgress = getNextAchievementProgress(achievementCategories.strength, userStats, workoutHistory);
  const volumeProgress = getNextAchievementProgress(achievementCategories.volume, userStats, workoutHistory);
  const cardioProgress = getNextAchievementProgress(achievementCategories.cardio, userStats, workoutHistory);
  const yogaProgress = getNextAchievementProgress(achievementCategories.yoga, userStats, workoutHistory);
  const wellnessProgress = getNextAchievementProgress(achievementCategories.wellness, userStats, workoutHistory);
  
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
    <Box sx={{ p: { xs: 2, sm: 2, md: 3 } }}>
      {/* Simplified Header */}
      <Box sx={{ mb: 3, textAlign: 'center' }}>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 2 }}>
          Achievements
        </Typography>
        
        {/* Compact Level & Progress Display */}
        <Stack 
          direction={{ xs: 'column', sm: 'row' }} 
          spacing={2} 
          justifyContent="center" 
          alignItems="center"
          sx={{ mb: 2 }}
        >
          <Chip
            icon={<EmojiEvents />}
            label={`Level ${levelInfo.level}`}
            color="primary"
            sx={{ fontSize: '0.95rem', fontWeight: 600, height: 32, px: 1 }}
          />
          <Chip
            label={`${unlockedAchievements.length} / ${ACHIEVEMENT_BADGES.length} Unlocked`}
            variant="outlined"
            sx={{ fontSize: '0.85rem', height: 32 }}
          />
        </Stack>
        
        {/* Minimalist Level Progress */}
        <Box sx={{ maxWidth: 500, margin: '0 auto' }}>
          <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
              {levelInfo.currentPoints} / 100 pts
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
              {levelInfo.pointsToNext} to Lv {levelInfo.level + 1}
            </Typography>
          </Stack>
          <LinearProgress
            variant="determinate"
            value={(levelInfo.currentPoints / 100) * 100}
            sx={{
              height: 6,
              borderRadius: 3,
              bgcolor: 'action.hover',
              '& .MuiLinearProgress-bar': {
                borderRadius: 3,
              },
            }}
          />
        </Box>
      </Box>
      
      {/* Compact Summary Grid - All Categories */}
      <Box sx={{ mb: 3 }}>
        <Typography 
          variant="subtitle2" 
          sx={{ 
            mb: 1.5, 
            fontWeight: 600, 
            fontSize: '0.85rem',
            color: 'text.secondary',
            textAlign: 'center'
          }}
        >
          Progress Overview
        </Typography>
        <Grid container spacing={{ xs: 1, sm: 1.5 }}>
          <Grid item xs={6} sm={4} md={3}>
            <CompactSummaryCard
              title="Overall"
              icon={<EmojiEvents />}
              progressInfo={overallProgress}
              iconColor="primary.main"
            />
          </Grid>
          <Grid item xs={6} sm={4} md={3}>
            <CompactSummaryCard
              title="Streak"
              icon={<Whatshot />}
              progressInfo={streakProgress}
              iconColor="#FF6B35"
            />
          </Grid>
          <Grid item xs={6} sm={4} md={3}>
            <CompactSummaryCard
              title="Strength"
              icon={<FitnessCenter />}
              progressInfo={strengthProgress}
              iconColor="#4CAF50"
            />
          </Grid>
          <Grid item xs={6} sm={4} md={3}>
            <CompactSummaryCard
              title="Volume"
              icon={<TrendingUp />}
              progressInfo={volumeProgress}
              iconColor="#FFD700"
            />
          </Grid>
          <Grid item xs={6} sm={4} md={3}>
            <CompactSummaryCard
              title="Cardio"
              icon={<DirectionsRun />}
              progressInfo={cardioProgress}
              iconColor="#2196F3"
            />
          </Grid>
          <Grid item xs={6} sm={4} md={3}>
            <CompactSummaryCard
              title="Yoga"
              icon={<SelfImprovement />}
              progressInfo={yogaProgress}
              iconColor="#9C27B0"
            />
          </Grid>
          <Grid item xs={6} sm={4} md={3}>
            <CompactSummaryCard
              title="Wellness"
              icon={<Favorite />}
              progressInfo={wellnessProgress}
              iconColor="#E91E63"
            />
          </Grid>
        </Grid>
      </Box>
      
      <Divider sx={{ mb: 3 }} />
      
      {/* Category Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tabs
          value={currentTab}
          onChange={(e, newValue) => setCurrentTab(newValue)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            '& .MuiTab-root': {
              minHeight: 42,
              fontSize: '0.8rem',
              py: 1,
            },
          }}
        >
          {categories.map((category) => (
            <Tab key={category.key} label={category.label} />
          ))}
        </Tabs>
      </Box>
      
      {/* Achievement Badge Grid */}
      <Grid container spacing={{ xs: 1.5, sm: 2 }}>
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
    case 'sessionCount':
      return `Complete ${condition.value} total workout${condition.value !== 1 ? 's' : ''}`;
    case 'streak':
      return `Maintain a ${condition.value}-day workout streak`;
    case 'prCount':
      return `Achieve ${condition.value} personal record${condition.value !== 1 ? 's' : ''}`;
    case 'totalVolume':
      return `Lift ${condition.value.toLocaleString()} lbs total volume`;
    case 'singleSessionVolume':
      return `Complete a single workout with ${condition.value.toLocaleString()} lbs volume`;
    case 'totalTime': {
      const hours = Math.floor(condition.value / 3600);
      return `Complete ${hours} hour${hours !== 1 ? 's' : ''} of total workout time`;
    }
    case 'strengthWorkoutCount':
      return `Complete ${condition.value} strength workout${condition.value !== 1 ? 's' : ''}`;
    case 'cardioWorkoutCount':
      return `Complete ${condition.value} cardio workout${condition.value !== 1 ? 's' : ''}`;
    case 'cardioTime': {
      const hours = Math.floor(condition.value / 3600);
      return `Complete ${hours} hour${hours !== 1 ? 's' : ''} of cardio`;
    }
    case 'yogaWorkoutCount':
      return `Complete ${condition.value} yoga workout${condition.value !== 1 ? 's' : ''}`;
    case 'yogaTime': {
      const hours = Math.floor(condition.value / 3600);
      return `Complete ${hours} hour${hours !== 1 ? 's' : ''} of yoga`;
    }
    case 'strengthWeekStreak':
      return `Complete 3+ strength workouts per week for ${condition.value} consecutive week${condition.value !== 1 ? 's' : ''}`;
    case 'wellnessTaskCount':
      return `Complete ${condition.value} wellness task${condition.value !== 1 ? 's' : ''}`;
    case 'special':
      return condition.value;
    default:
      return '';
  }
};

const formatValue = (value, type) => {
  switch (type) {
    case 'totalVolume':
    case 'singleSessionVolume':
      return `${value.toLocaleString()} lbs`;
    case 'totalTime':
    case 'cardioTime':
    case 'yogaTime': {
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
