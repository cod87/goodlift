import { memo, useState, useCallback, useRef } from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  Typography,
  useTheme,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
} from '@mui/material';
import {
  FitnessCenter,
  Restaurant,
  Groups,
  SelfImprovement,
  MenuBook,
  AccountBalance,
  Park,
} from '@mui/icons-material';
import { WELLNESS_CATEGORIES, getLevelInfo } from '../../utils/wellnessJournalStorage';

/** Map icon name strings to MUI icon components */
const ICON_MAP = {
  FitnessCenter,
  Restaurant,
  Groups,
  SelfImprovement,
  MenuBook,
  AccountBalance,
  Park,
};

/** CSS keyframes for the water drop animation */
const dropKeyframes = `
@keyframes waterDrop {
  0% {
    transform: translateY(-20px) scale(1);
    opacity: 1;
  }
  60% {
    opacity: 1;
  }
  100% {
    transform: translateY(70px) scale(0.6);
    opacity: 0;
  }
}
@keyframes ripple {
  0% {
    transform: scale(0);
    opacity: 0.6;
  }
  100% {
    transform: scale(2.5);
    opacity: 0;
  }
}
`;

/**
 * WellnessBuckets - Visual "bucket fill" representation for each wellness category.
 *
 * Users tap on a bucket to open a dialog where they can enter numbered notes.
 * Each note line = 1 point. Points fill the bucket and trigger a water drop animation.
 */
const WellnessBuckets = memo(({ stats, entry, onSubmitNotes }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [noteText, setNoteText] = useState('');
  const [animatingBucket, setAnimatingBucket] = useState(null);
  const [dropCount, setDropCount] = useState(0);
  const textFieldRef = useRef(null);

  const handleOpenDialog = useCallback((cat) => {
    const existingNotes = entry?.categories?.[cat.id]?.notes || [];
    if (existingNotes.length > 0) {
      setNoteText(existingNotes.map((n, i) => `${i + 1}. ${n}`).join('\n'));
    } else {
      setNoteText('1. ');
    }
    setSelectedCategory(cat);
  }, [entry]);

  const handleCloseDialog = useCallback(() => {
    setSelectedCategory(null);
    setNoteText('');
  }, []);

  const handleTextChange = useCallback((e) => {
    setNoteText(e.target.value);
  }, []);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const lines = noteText.split('\n');
      const nextNum = lines.length + 1;
      setNoteText(noteText + `\n${nextNum}. `);
    }
  }, [noteText]);

  const handleSubmit = useCallback(() => {
    if (!selectedCategory) return;
    // Parse lines: strip numbering, filter empty
    const notes = noteText
      .split('\n')
      .map((line) => line.replace(/^\d+\.\s*/, '').trim())
      .filter((line) => line.length > 0);

    const newDrops = notes.length;
    const prevNotes = entry?.categories?.[selectedCategory.id]?.notes || [];
    const addedDrops = Math.max(0, newDrops - prevNotes.length);

    onSubmitNotes(selectedCategory.id, notes);
    handleCloseDialog();

    // Trigger water drop animation
    if (addedDrops > 0) {
      setDropCount(Math.min(addedDrops, 8)); // Cap visual drops at 8
      setAnimatingBucket(selectedCategory.id);
      setTimeout(() => {
        setAnimatingBucket(null);
        setDropCount(0);
      }, 1500);
    }
  }, [selectedCategory, noteText, entry, onSubmitNotes, handleCloseDialog]);

  return (
    <>
      {/* Inject keyframe styles */}
      <style>{dropKeyframes}</style>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: 'repeat(4, 1fr)',
            sm: 'repeat(4, 1fr)',
            md: 'repeat(7, 1fr)',
          },
          gap: { xs: 1, sm: 1.5 },
          mb: 3,
        }}
      >
        {WELLNESS_CATEGORIES.map((cat) => {
          const catStats = stats[cat.id] || { totalDrops: 0 };
          const levelInfo = getLevelInfo(catStats.totalDrops);

          return (
            <BucketCard
              key={cat.id}
              category={cat}
              levelInfo={levelInfo}
              isDark={isDark}
              onClick={() => handleOpenDialog(cat)}
              isAnimating={animatingBucket === cat.id}
              animDropCount={animatingBucket === cat.id ? dropCount : 0}
            />
          );
        })}
      </Box>

      {/* Entry dialog */}
      <Dialog
        open={!!selectedCategory}
        onClose={handleCloseDialog}
        fullWidth
        maxWidth="sm"
        PaperProps={{
          sx: {
            borderRadius: '16px',
            background: isDark ? '#1a1a2e' : '#fff',
          },
        }}
      >
        {selectedCategory && (
          <>
            <DialogTitle
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                pb: 0.5,
              }}
            >
              {(() => {
                const IconComponent = ICON_MAP[selectedCategory.icon];
                return IconComponent ? (
                  <IconComponent sx={{ color: selectedCategory.color }} />
                ) : null;
              })()}
              <Typography
                variant="h6"
                component="span"
                sx={{ fontWeight: 700, color: selectedCategory.color }}
              >
                {selectedCategory.label}
              </Typography>
            </DialogTitle>
            <DialogContent>
              <Typography
                sx={{
                  fontSize: '0.8rem',
                  color: isDark ? 'rgba(255,255,255,0.5)' : 'text.secondary',
                  mb: 1.5,
                  fontStyle: 'italic',
                }}
              >
                {selectedCategory.description}
              </Typography>
              <TextField
                inputRef={textFieldRef}
                value={noteText}
                onChange={handleTextChange}
                onKeyDown={handleKeyDown}
                placeholder="1. Start typing..."
                fullWidth
                multiline
                minRows={4}
                maxRows={12}
                autoFocus
                sx={{
                  '& .MuiOutlinedInput-root': {
                    fontSize: '0.9rem',
                    fontFamily: 'monospace',
                    borderRadius: '10px',
                    '& fieldset': { borderColor: `${selectedCategory.color}40` },
                    '&:hover fieldset': { borderColor: `${selectedCategory.color}80` },
                    '&.Mui-focused fieldset': { borderColor: selectedCategory.color },
                  },
                }}
                inputProps={{ maxLength: 2000 }}
              />
              <Typography
                sx={{
                  fontSize: '0.7rem',
                  color: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)',
                  mt: 0.5,
                  textAlign: 'right',
                }}
              >
                Press Enter for a new line
              </Typography>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2 }}>
              <Button
                onClick={handleCloseDialog}
                sx={{ color: isDark ? 'rgba(255,255,255,0.5)' : 'text.secondary' }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                variant="contained"
                sx={{
                  background: selectedCategory.color,
                  borderRadius: '8px',
                  textTransform: 'none',
                  fontWeight: 600,
                  '&:hover': {
                    background: selectedCategory.color,
                    filter: 'brightness(0.9)',
                  },
                }}
              >
                Submit
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </>
  );
});

WellnessBuckets.displayName = 'WellnessBuckets';

WellnessBuckets.propTypes = {
  stats: PropTypes.object.isRequired,
  entry: PropTypes.object,
  onSubmitNotes: PropTypes.func.isRequired,
};

/** Individual bucket card for a single category */
const BucketCard = memo(({ category, levelInfo, isDark, onClick, isAnimating, animDropCount }) => {
  const fillPercent = Math.min(levelInfo.progress * 100, 100);
  const IconComponent = ICON_MAP[category.icon];

  return (
    <Box
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onClick(); }}
      aria-label={`Open ${category.label} entry`}
      sx={{
        background: isDark
          ? 'rgba(255,255,255,0.04)'
          : 'var(--color-surface)',
        borderRadius: 'var(--radius-md, 12px)',
        border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'var(--color-border)'}`,
        padding: { xs: '0.5rem', sm: '0.75rem' },
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 0.5,
        position: 'relative',
        overflow: 'visible',
        cursor: 'pointer',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: `0 4px 12px ${category.color}30`,
        },
        '&:active': {
          transform: 'translateY(0)',
        },
      }}
    >
      {/* Category icon */}
      {IconComponent && (
        <IconComponent sx={{ fontSize: { xs: '1.2rem', sm: '1.4rem' }, color: category.color }} />
      )}

      {/* Category name */}
      <Typography
        sx={{
          fontSize: { xs: '0.55rem', sm: '0.65rem' },
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.3px',
          color: category.color,
          textAlign: 'center',
          lineHeight: 1.1,
        }}
      >
        {category.label}
      </Typography>

      {/* Bucket visualization */}
      <Box
        sx={{
          width: '100%',
          height: { xs: 60, sm: 75 },
          position: 'relative',
          borderRadius: '0 0 10px 10px',
          border: `2px solid ${category.color}40`,
          borderTop: `2px solid ${category.color}40`,
          overflow: 'hidden',
          background: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.02)',
        }}
      >
        {/* Fill level */}
        <Box
          sx={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: `${fillPercent}%`,
            background: `linear-gradient(0deg, ${category.color} 0%, ${category.color}99 100%)`,
            transition: 'height 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
            borderRadius: '0 0 8px 8px',
            '&::after': fillPercent > 0 ? {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '3px',
              background: `linear-gradient(0deg, transparent, ${category.color}40)`,
              borderRadius: '2px',
            } : {},
          }}
        />

        {/* Drop count inside bucket */}
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            textAlign: 'center',
            zIndex: 1,
          }}
        >
          <Typography
            sx={{
              fontSize: { xs: '0.85rem', sm: '1.1rem' },
              fontWeight: 800,
              color: fillPercent > 45
                ? '#fff'
                : isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.5)',
              textShadow: fillPercent > 45 ? '0 1px 2px rgba(0,0,0,0.3)' : 'none',
              lineHeight: 1.2,
            }}
          >
            {levelInfo.dropsInCurrentLevel}
          </Typography>
          <Typography
            sx={{
              fontSize: { xs: '0.45rem', sm: '0.55rem' },
              color: fillPercent > 45
                ? 'rgba(255,255,255,0.85)'
                : isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.35)',
              textShadow: fillPercent > 45 ? '0 1px 2px rgba(0,0,0,0.3)' : 'none',
              fontWeight: 600,
            }}
          >
            / {levelInfo.maxDropsForLevel}
          </Typography>
        </Box>

        {/* Water drop animation */}
        {isAnimating && (
          <WaterDropAnimation color={category.color} count={animDropCount} />
        )}
      </Box>

      {/* Level badge */}
      <Typography
        sx={{
          fontSize: { xs: '0.5rem', sm: '0.58rem' },
          fontWeight: 700,
          color: category.color,
          background: `${category.color}15`,
          px: 0.5,
          py: 0.15,
          borderRadius: '5px',
          letterSpacing: '0.3px',
        }}
      >
        LVL {levelInfo.level}
      </Typography>
    </Box>
  );
});

BucketCard.displayName = 'BucketCard';

BucketCard.propTypes = {
  category: PropTypes.shape({
    id: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
    icon: PropTypes.string.isRequired,
    color: PropTypes.string.isRequired,
    description: PropTypes.string.isRequired,
  }).isRequired,
  levelInfo: PropTypes.shape({
    level: PropTypes.number.isRequired,
    dropsInCurrentLevel: PropTypes.number.isRequired,
    maxDropsForLevel: PropTypes.number.isRequired,
    totalDrops: PropTypes.number.isRequired,
    progress: PropTypes.number.isRequired,
  }).isRequired,
  isDark: PropTypes.bool.isRequired,
  onClick: PropTypes.func.isRequired,
  isAnimating: PropTypes.bool,
  animDropCount: PropTypes.number,
};

/** Water drops falling animation */
const WaterDropAnimation = ({ color, count }) => {
  const drops = Array.from({ length: count }, (_, i) => ({
    id: i,
    left: 15 + ((i * 17) % 70),
    delay: i * 0.12,
  }));

  return (
    <Box
      sx={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        pointerEvents: 'none',
        zIndex: 5,
      }}
    >
      {drops.map((drop) => (
        <Box
          key={drop.id}
          sx={{
            position: 'absolute',
            top: '-4px',
            left: `${drop.left}%`,
            width: { xs: 6, sm: 8 },
            height: { xs: 9, sm: 12 },
            borderRadius: '50% 50% 50% 50% / 40% 40% 60% 60%',
            background: color,
            opacity: 0,
            animation: `waterDrop 0.8s ease-in ${drop.delay}s forwards`,
          }}
        />
      ))}
      {/* Ripple effect at the bottom */}
      <Box
        sx={{
          position: 'absolute',
          bottom: '10%',
          left: '50%',
          width: 12,
          height: 6,
          borderRadius: '50%',
          background: `${color}60`,
          transform: 'translateX(-50%)',
          animation: `ripple 1s ease-out 0.5s forwards`,
          opacity: 0,
        }}
      />
    </Box>
  );
};

WaterDropAnimation.propTypes = {
  color: PropTypes.string.isRequired,
  count: PropTypes.number.isRequired,
};

export default WellnessBuckets;
