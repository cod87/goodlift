import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { Box } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Single confetti piece component
 */
const ConfettiPiece = ({ color, delay, startX }) => {
  const colors = ['#FF6B6B', '#4ECDC4', '#FFD93D', '#6BCB77', '#4D96FF', '#FF9F9F'];
  const selectedColor = color || colors[Math.floor(Math.random() * colors.length)];
  
  return (
    <motion.div
      initial={{
        top: -20,
        left: `${startX}%`,
        rotate: 0,
        scale: 1,
      }}
      animate={{
        top: '110vh',
        left: `${startX + (Math.random() * 20 - 10)}%`,
        rotate: Math.random() * 720 - 360,
        scale: [1, 1.2, 0.8],
      }}
      transition={{
        duration: 3 + Math.random() * 2,
        delay: delay,
        ease: 'easeOut',
      }}
      style={{
        position: 'fixed',
        width: Math.random() * 10 + 5 + 'px',
        height: Math.random() * 10 + 5 + 'px',
        backgroundColor: selectedColor,
        borderRadius: Math.random() > 0.5 ? '50%' : '0%',
        zIndex: 9999,
        pointerEvents: 'none',
      }}
    />
  );
};

ConfettiPiece.propTypes = {
  color: PropTypes.string,
  delay: PropTypes.number,
  startX: PropTypes.number,
};

/**
 * Confetti Animation Component
 * Displays celebratory confetti animation
 */
const ConfettiAnimation = ({ active = false, duration = 3000, intensity = 50 }) => {
  const [pieces, setPieces] = useState([]);
  
  useEffect(() => {
    if (active) {
      // Generate confetti pieces
      const newPieces = Array.from({ length: intensity }, (_, i) => ({
        id: `confetti-${Date.now()}-${i}`,
        startX: Math.random() * 100,
        delay: Math.random() * 0.5,
      }));
      
      setPieces(newPieces);
      
      // Clear pieces after animation completes
      const timer = setTimeout(() => {
        setPieces([]);
      }, duration);
      
      return () => clearTimeout(timer);
    }
  }, [active, duration, intensity]);
  
  return (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 9999,
      }}
    >
      <AnimatePresence>
        {pieces.map((piece) => (
          <ConfettiPiece
            key={piece.id}
            startX={piece.startX}
            delay={piece.delay}
          />
        ))}
      </AnimatePresence>
    </Box>
  );
};

ConfettiAnimation.propTypes = {
  active: PropTypes.bool,
  duration: PropTypes.number,
  intensity: PropTypes.number,
};

export default ConfettiAnimation;
