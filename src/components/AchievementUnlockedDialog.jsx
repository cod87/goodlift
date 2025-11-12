import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
  Dialog,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Stack,
  Slide,
} from '@mui/material';
import { motion } from 'framer-motion';
import { EmojiEvents, Share } from '@mui/icons-material';
import { ACHIEVEMENT_TIERS } from '../data/achievements';
import ConfettiAnimation from './ConfettiAnimation';

/**
 * Achievement Unlocked Dialog
 * Shows a celebratory popup when a new achievement is unlocked
 */
const AchievementUnlockedDialog = ({ open, onClose, achievement, onShare }) => {
  const [showConfetti, setShowConfetti] = useState(false);
  
  useEffect(() => {
    if (open && achievement) {
      setShowConfetti(true);
      const timer = setTimeout(() => {
        setShowConfetti(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [open, achievement]);
  
  if (!achievement) return null;
  
  const tier = ACHIEVEMENT_TIERS[achievement.tier];
  
  const handleShare = async () => {
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
    
    if (onShare) {
      onShare(achievement);
    }
  };
  
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      alert('Achievement text copied to clipboard!');
    });
  };
  
  return (
    <>
      <ConfettiAnimation active={showConfetti} />
      
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="sm"
        fullWidth
        TransitionComponent={Slide}
        TransitionProps={{ direction: 'up' }}
        PaperProps={{
          sx: {
            borderRadius: 3,
            background: tier.gradient,
            color: tier.textColor,
            overflow: 'visible',
          },
        }}
      >
        <DialogContent sx={{ textAlign: 'center', py: 4 }}>
          {/* Trophy icon animation */}
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{
              type: 'spring',
              stiffness: 260,
              damping: 20,
              delay: 0.1,
            }}
          >
            <Box
              sx={{
                width: 100,
                height: 100,
                borderRadius: '50%',
                bgcolor: 'rgba(255, 255, 255, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 24px',
                border: '4px solid rgba(255, 255, 255, 0.3)',
              }}
            >
              <EmojiEvents sx={{ fontSize: '4rem', color: 'rgba(255, 255, 255, 0.9)' }} />
            </Box>
          </motion.div>
          
          {/* Achievement unlocked text */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Typography
              variant="h6"
              sx={{
                fontWeight: 600,
                mb: 2,
                opacity: 0.9,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
              }}
            >
              Achievement Unlocked!
            </Typography>
          </motion.div>
          
          {/* Achievement icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{
              type: 'spring',
              stiffness: 200,
              damping: 15,
              delay: 0.5,
            }}
          >
            <Typography variant="h1" sx={{ fontSize: '5rem', mb: 2 }}>
              {achievement.icon}
            </Typography>
          </motion.div>
          
          {/* Achievement name */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
          >
            <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
              {achievement.name}
            </Typography>
          </motion.div>
          
          {/* Tier badge */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9 }}
          >
            <Box
              sx={{
                display: 'inline-block',
                px: 2,
                py: 0.5,
                borderRadius: 2,
                bgcolor: 'rgba(255, 255, 255, 0.2)',
                mb: 2,
              }}
            >
              <Typography
                variant="caption"
                sx={{
                  fontWeight: 700,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                }}
              >
                {achievement.tier}
              </Typography>
            </Box>
          </motion.div>
          
          {/* Description */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.1 }}
          >
            <Typography
              variant="body1"
              sx={{
                opacity: 0.9,
                maxWidth: '80%',
                margin: '0 auto',
              }}
            >
              {achievement.description}
            </Typography>
          </motion.div>
        </DialogContent>
        
        <DialogActions sx={{ justifyContent: 'center', pb: 3, px: 3 }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ width: '100%' }}>
            <Button
              variant="contained"
              onClick={onClose}
              fullWidth
              sx={{
                bgcolor: 'rgba(255, 255, 255, 0.9)',
                color: 'primary.main',
                '&:hover': {
                  bgcolor: 'rgba(255, 255, 255, 1)',
                },
              }}
            >
              Awesome!
            </Button>
            <Button
              variant="outlined"
              startIcon={<Share />}
              onClick={handleShare}
              fullWidth
              sx={{
                borderColor: 'rgba(255, 255, 255, 0.5)',
                color: 'rgba(255, 255, 255, 0.9)',
                '&:hover': {
                  borderColor: 'rgba(255, 255, 255, 0.8)',
                  bgcolor: 'rgba(255, 255, 255, 0.1)',
                },
              }}
            >
              Share
            </Button>
          </Stack>
        </DialogActions>
      </Dialog>
    </>
  );
};

AchievementUnlockedDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  achievement: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    description: PropTypes.string.isRequired,
    icon: PropTypes.string.isRequired,
    tier: PropTypes.string.isRequired,
  }),
  onShare: PropTypes.func,
};

export default AchievementUnlockedDialog;
