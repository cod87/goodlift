import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  Card,
  CardContent,
  Typography,
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

// Category color constants for consistent theming
const CATEGORY_COLORS = {
  overall: 'primary.main',
  streak: '#FF6B35',
  strength: '#4CAF50',
  volume: '#FFD700',
  cardio: '#2196F3',
  yoga: '#9C27B0',
  wellness: '#E91E63',
};

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
              {levelInfo.currentPoints} pts
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
              {levelInfo.pointsToNext} pts to Lv {levelInfo.level + 1}
            </Typography>
          </Stack>
          <LinearProgress
            variant="determinate"
            value={levelInfo.currentPoints + levelInfo.pointsToNext > 0 
              ? (levelInfo.currentPoints / (levelInfo.currentPoints + levelInfo.pointsToNext)) * 100 
              : 0}
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
      
      {/* Progress Overview - Flat Panel Style (like MuscleVolumeTracker) */}
      <Card sx={{ mb: 3, bgcolor: 'background.paper' }}>
        <CardContent sx={{ p: 2 }}>
          <Typography 
            variant="h6" 
            sx={{ 
              mb: 2, 
              fontWeight: 600,
            }}
          >
            Progress Overview
          </Typography>
          
          <Stack spacing={1}>
            {/* Overall Progress */}
            {overallProgress && (
              <Box
                sx={{
                  p: 1.5,
                  borderRadius: 1,
                  border: '1px solid',
                  borderColor: 'divider',
                  bgcolor: 'background.default',
                }}
              >
                <Stack direction="row" spacing={2} alignItems="center">
                  <Box sx={{ color: CATEGORY_COLORS.overall, fontSize: '1.5rem', minWidth: 40, textAlign: 'center' }}>
                    <EmojiEvents />
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                      Overall - {overallProgress.achievement.name}
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={overallProgress.progress}
                      sx={{
                        height: 6,
                        borderRadius: 3,
                        bgcolor: 'action.hover',
                        '& .MuiLinearProgress-bar': {
                          background: ACHIEVEMENT_TIERS[overallProgress.achievement.tier].gradient,
                          borderRadius: 3,
                        },
                      }}
                    />
                    <Typography variant="caption" sx={{ fontSize: '0.65rem', color: 'text.secondary', display: 'block', mt: 0.5 }}>
                      {formatValue(overallProgress.current, overallProgress.achievement.condition.type)} / {formatValue(overallProgress.target, overallProgress.achievement.condition.type)}
                    </Typography>
                  </Box>
                </Stack>
              </Box>
            )}
            {!overallProgress && (
              <Box
                sx={{
                  p: 1.5,
                  borderRadius: 1,
                  border: '1px solid',
                  borderColor: 'success.main',
                  bgcolor: 'rgba(76, 175, 80, 0.05)',
                }}
              >
                <Stack direction="row" spacing={2} alignItems="center">
                  <Box sx={{ color: CATEGORY_COLORS.overall, fontSize: '1.5rem', minWidth: 40, textAlign: 'center' }}>
                    <EmojiEvents />
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      Overall
                    </Typography>
                    <Typography variant="caption" sx={{ fontSize: '0.65rem', color: 'success.main' }}>
                      Complete ✓
                    </Typography>
                  </Box>
                </Stack>
              </Box>
            )}
            
            {/* Streak Progress */}
            {streakProgress && (
              <Box
                sx={{
                  p: 1.5,
                  borderRadius: 1,
                  border: '1px solid',
                  borderColor: 'divider',
                  bgcolor: 'background.default',
                }}
              >
                <Stack direction="row" spacing={2} alignItems="center">
                  <Box sx={{ color: CATEGORY_COLORS.streak, fontSize: '1.5rem', minWidth: 40, textAlign: 'center' }}>
                    <Whatshot />
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                      Streak - {streakProgress.achievement.name}
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={streakProgress.progress}
                      sx={{
                        height: 6,
                        borderRadius: 3,
                        bgcolor: 'action.hover',
                        '& .MuiLinearProgress-bar': {
                          background: ACHIEVEMENT_TIERS[streakProgress.achievement.tier].gradient,
                          borderRadius: 3,
                        },
                      }}
                    />
                    <Typography variant="caption" sx={{ fontSize: '0.65rem', color: 'text.secondary', display: 'block', mt: 0.5 }}>
                      {formatValue(streakProgress.current, streakProgress.achievement.condition.type)} / {formatValue(streakProgress.target, streakProgress.achievement.condition.type)}
                    </Typography>
                  </Box>
                </Stack>
              </Box>
            )}
            {!streakProgress && (
              <Box
                sx={{
                  p: 1.5,
                  borderRadius: 1,
                  border: '1px solid',
                  borderColor: 'success.main',
                  bgcolor: 'rgba(76, 175, 80, 0.05)',
                }}
              >
                <Stack direction="row" spacing={2} alignItems="center">
                  <Box sx={{ color: CATEGORY_COLORS.streak, fontSize: '1.5rem', minWidth: 40, textAlign: 'center' }}>
                    <Whatshot />
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      Streak
                    </Typography>
                    <Typography variant="caption" sx={{ fontSize: '0.65rem', color: 'success.main' }}>
                      Complete ✓
                    </Typography>
                  </Box>
                </Stack>
              </Box>
            )}
            
            {/* Strength Progress */}
            {strengthProgress && (
              <Box
                sx={{
                  p: 1.5,
                  borderRadius: 1,
                  border: '1px solid',
                  borderColor: 'divider',
                  bgcolor: 'background.default',
                }}
              >
                <Stack direction="row" spacing={2} alignItems="center">
                  <Box sx={{ color: CATEGORY_COLORS.strength, fontSize: '1.5rem', minWidth: 40, textAlign: 'center' }}>
                    <FitnessCenter />
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                      Strength - {strengthProgress.achievement.name}
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={strengthProgress.progress}
                      sx={{
                        height: 6,
                        borderRadius: 3,
                        bgcolor: 'action.hover',
                        '& .MuiLinearProgress-bar': {
                          background: ACHIEVEMENT_TIERS[strengthProgress.achievement.tier].gradient,
                          borderRadius: 3,
                        },
                      }}
                    />
                    <Typography variant="caption" sx={{ fontSize: '0.65rem', color: 'text.secondary', display: 'block', mt: 0.5 }}>
                      {formatValue(strengthProgress.current, strengthProgress.achievement.condition.type)} / {formatValue(strengthProgress.target, strengthProgress.achievement.condition.type)}
                    </Typography>
                  </Box>
                </Stack>
              </Box>
            )}
            {!strengthProgress && (
              <Box
                sx={{
                  p: 1.5,
                  borderRadius: 1,
                  border: '1px solid',
                  borderColor: 'success.main',
                  bgcolor: 'rgba(76, 175, 80, 0.05)',
                }}
              >
                <Stack direction="row" spacing={2} alignItems="center">
                  <Box sx={{ color: CATEGORY_COLORS.strength, fontSize: '1.5rem', minWidth: 40, textAlign: 'center' }}>
                    <FitnessCenter />
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      Strength
                    </Typography>
                    <Typography variant="caption" sx={{ fontSize: '0.65rem', color: 'success.main' }}>
                      Complete ✓
                    </Typography>
                  </Box>
                </Stack>
              </Box>
            )}
            
            {/* Volume Progress */}
            {volumeProgress && (
              <Box
                sx={{
                  p: 1.5,
                  borderRadius: 1,
                  border: '1px solid',
                  borderColor: 'divider',
                  bgcolor: 'background.default',
                }}
              >
                <Stack direction="row" spacing={2} alignItems="center">
                  <Box sx={{ color: CATEGORY_COLORS.volume, fontSize: '1.5rem', minWidth: 40, textAlign: 'center' }}>
                    <TrendingUp />
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                      Volume - {volumeProgress.achievement.name}
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={volumeProgress.progress}
                      sx={{
                        height: 6,
                        borderRadius: 3,
                        bgcolor: 'action.hover',
                        '& .MuiLinearProgress-bar': {
                          background: ACHIEVEMENT_TIERS[volumeProgress.achievement.tier].gradient,
                          borderRadius: 3,
                        },
                      }}
                    />
                    <Typography variant="caption" sx={{ fontSize: '0.65rem', color: 'text.secondary', display: 'block', mt: 0.5 }}>
                      {formatValue(volumeProgress.current, volumeProgress.achievement.condition.type)} / {formatValue(volumeProgress.target, volumeProgress.achievement.condition.type)}
                    </Typography>
                  </Box>
                </Stack>
              </Box>
            )}
            {!volumeProgress && (
              <Box
                sx={{
                  p: 1.5,
                  borderRadius: 1,
                  border: '1px solid',
                  borderColor: 'success.main',
                  bgcolor: 'rgba(76, 175, 80, 0.05)',
                }}
              >
                <Stack direction="row" spacing={2} alignItems="center">
                  <Box sx={{ color: CATEGORY_COLORS.volume, fontSize: '1.5rem', minWidth: 40, textAlign: 'center' }}>
                    <TrendingUp />
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      Volume
                    </Typography>
                    <Typography variant="caption" sx={{ fontSize: '0.65rem', color: 'success.main' }}>
                      Complete ✓
                    </Typography>
                  </Box>
                </Stack>
              </Box>
            )}
            
            {/* Cardio Progress */}
            {cardioProgress && (
              <Box
                sx={{
                  p: 1.5,
                  borderRadius: 1,
                  border: '1px solid',
                  borderColor: 'divider',
                  bgcolor: 'background.default',
                }}
              >
                <Stack direction="row" spacing={2} alignItems="center">
                  <Box sx={{ color: CATEGORY_COLORS.cardio, fontSize: '1.5rem', minWidth: 40, textAlign: 'center' }}>
                    <DirectionsRun />
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                      Cardio - {cardioProgress.achievement.name}
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={cardioProgress.progress}
                      sx={{
                        height: 6,
                        borderRadius: 3,
                        bgcolor: 'action.hover',
                        '& .MuiLinearProgress-bar': {
                          background: ACHIEVEMENT_TIERS[cardioProgress.achievement.tier].gradient,
                          borderRadius: 3,
                        },
                      }}
                    />
                    <Typography variant="caption" sx={{ fontSize: '0.65rem', color: 'text.secondary', display: 'block', mt: 0.5 }}>
                      {formatValue(cardioProgress.current, cardioProgress.achievement.condition.type)} / {formatValue(cardioProgress.target, cardioProgress.achievement.condition.type)}
                    </Typography>
                  </Box>
                </Stack>
              </Box>
            )}
            {!cardioProgress && (
              <Box
                sx={{
                  p: 1.5,
                  borderRadius: 1,
                  border: '1px solid',
                  borderColor: 'success.main',
                  bgcolor: 'rgba(76, 175, 80, 0.05)',
                }}
              >
                <Stack direction="row" spacing={2} alignItems="center">
                  <Box sx={{ color: CATEGORY_COLORS.cardio, fontSize: '1.5rem', minWidth: 40, textAlign: 'center' }}>
                    <DirectionsRun />
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      Cardio
                    </Typography>
                    <Typography variant="caption" sx={{ fontSize: '0.65rem', color: 'success.main' }}>
                      Complete ✓
                    </Typography>
                  </Box>
                </Stack>
              </Box>
            )}
            
            {/* Yoga Progress */}
            {yogaProgress && (
              <Box
                sx={{
                  p: 1.5,
                  borderRadius: 1,
                  border: '1px solid',
                  borderColor: 'divider',
                  bgcolor: 'background.default',
                }}
              >
                <Stack direction="row" spacing={2} alignItems="center">
                  <Box sx={{ color: CATEGORY_COLORS.yoga, fontSize: '1.5rem', minWidth: 40, textAlign: 'center' }}>
                    <SelfImprovement />
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                      Yoga - {yogaProgress.achievement.name}
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={yogaProgress.progress}
                      sx={{
                        height: 6,
                        borderRadius: 3,
                        bgcolor: 'action.hover',
                        '& .MuiLinearProgress-bar': {
                          background: ACHIEVEMENT_TIERS[yogaProgress.achievement.tier].gradient,
                          borderRadius: 3,
                        },
                      }}
                    />
                    <Typography variant="caption" sx={{ fontSize: '0.65rem', color: 'text.secondary', display: 'block', mt: 0.5 }}>
                      {formatValue(yogaProgress.current, yogaProgress.achievement.condition.type)} / {formatValue(yogaProgress.target, yogaProgress.achievement.condition.type)}
                    </Typography>
                  </Box>
                </Stack>
              </Box>
            )}
            {!yogaProgress && (
              <Box
                sx={{
                  p: 1.5,
                  borderRadius: 1,
                  border: '1px solid',
                  borderColor: 'success.main',
                  bgcolor: 'rgba(76, 175, 80, 0.05)',
                }}
              >
                <Stack direction="row" spacing={2} alignItems="center">
                  <Box sx={{ color: CATEGORY_COLORS.yoga, fontSize: '1.5rem', minWidth: 40, textAlign: 'center' }}>
                    <SelfImprovement />
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      Yoga
                    </Typography>
                    <Typography variant="caption" sx={{ fontSize: '0.65rem', color: 'success.main' }}>
                      Complete ✓
                    </Typography>
                  </Box>
                </Stack>
              </Box>
            )}
            
            {/* Wellness Progress */}
            {wellnessProgress && (
              <Box
                sx={{
                  p: 1.5,
                  borderRadius: 1,
                  border: '1px solid',
                  borderColor: 'divider',
                  bgcolor: 'background.default',
                }}
              >
                <Stack direction="row" spacing={2} alignItems="center">
                  <Box sx={{ color: CATEGORY_COLORS.wellness, fontSize: '1.5rem', minWidth: 40, textAlign: 'center' }}>
                    <Favorite />
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                      Wellness - {wellnessProgress.achievement.name}
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={wellnessProgress.progress}
                      sx={{
                        height: 6,
                        borderRadius: 3,
                        bgcolor: 'action.hover',
                        '& .MuiLinearProgress-bar': {
                          background: ACHIEVEMENT_TIERS[wellnessProgress.achievement.tier].gradient,
                          borderRadius: 3,
                        },
                      }}
                    />
                    <Typography variant="caption" sx={{ fontSize: '0.65rem', color: 'text.secondary', display: 'block', mt: 0.5 }}>
                      {formatValue(wellnessProgress.current, wellnessProgress.achievement.condition.type)} / {formatValue(wellnessProgress.target, wellnessProgress.achievement.condition.type)}
                    </Typography>
                  </Box>
                </Stack>
              </Box>
            )}
            {!wellnessProgress && (
              <Box
                sx={{
                  p: 1.5,
                  borderRadius: 1,
                  border: '1px solid',
                  borderColor: 'success.main',
                  bgcolor: 'rgba(76, 175, 80, 0.05)',
                }}
              >
                <Stack direction="row" spacing={2} alignItems="center">
                  <Box sx={{ color: CATEGORY_COLORS.wellness, fontSize: '1.5rem', minWidth: 40, textAlign: 'center' }}>
                    <Favorite />
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      Wellness
                    </Typography>
                    <Typography variant="caption" sx={{ fontSize: '0.65rem', color: 'success.main' }}>
                      Complete ✓
                    </Typography>
                  </Box>
                </Stack>
              </Box>
            )}
          </Stack>
        </CardContent>
      </Card>
      
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
      <Box 
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr', // Mobile portrait: 1 per row
            sm: 'repeat(2, 1fr)', // Tablet: 2 per row
            md: 'repeat(4, 1fr)', // Desktop: 4 per row
            lg: 'repeat(6, 1fr)', // Wide: 6 per row
          },
          gap: { xs: 1.5, sm: 2 },
          '@media (max-width: 599px) and (orientation: landscape)': {
            gridTemplateColumns: 'repeat(2, 1fr)', // Mobile landscape: 2 per row
          },
        }}
      >
        {displayedAchievements.map((achievement) => {
          const unlocked = isAchievementUnlocked(achievement, userStats, workoutHistory);
          return (
            <AchievementBadge
              key={achievement.id}
              achievement={achievement}
              unlocked={unlocked}
              onClick={() => handleAchievementClick(achievement)}
            />
          );
        })}
      </Box>
      
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
