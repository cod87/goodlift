import { memo } from 'react';
import PropTypes from 'prop-types';
import { Box, Typography, useTheme } from '@mui/material';
import { WELLNESS_CATEGORIES, getLevelInfo } from '../../utils/wellnessJournalStorage';

/**
 * WellnessBuckets - Visual "bucket fill" representation for each wellness category.
 * 
 * Each category is represented as a vessel that fills with "drops".
 * The fill level shows progress within the current level.
 * Levels: L1 = 50, L2 = 100, L3 = 200, L4 = 400, etc.
 */
const WellnessBuckets = memo(({ stats }) => {
  const theme = useTheme();

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(4, 1fr)' },
        gap: { xs: 1.5, sm: 2 },
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
            theme={theme}
          />
        );
      })}
    </Box>
  );
});

WellnessBuckets.displayName = 'WellnessBuckets';

WellnessBuckets.propTypes = {
  stats: PropTypes.object.isRequired,
};

/** Individual bucket card for a single category */
const BucketCard = memo(({ category, levelInfo, theme }) => {
  const fillPercent = Math.min(levelInfo.progress * 100, 100);
  const isDark = theme.palette.mode === 'dark';

  return (
    <Box
      sx={{
        background: isDark
          ? 'rgba(255,255,255,0.04)'
          : 'var(--color-surface)',
        borderRadius: 'var(--radius-md, 12px)',
        border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'var(--color-border)'}`,
        padding: { xs: '0.75rem', sm: '1rem' },
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 0.75,
        position: 'relative',
        overflow: 'hidden',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: `0 4px 12px ${category.color}20`,
        },
      }}
    >
      {/* Category emoji */}
      <Typography sx={{ fontSize: { xs: '1.5rem', sm: '1.75rem' }, lineHeight: 1 }}>
        {category.emoji}
      </Typography>

      {/* Category name */}
      <Typography
        sx={{
          fontSize: { xs: '0.7rem', sm: '0.75rem' },
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
          color: category.color,
        }}
      >
        {category.label}
      </Typography>

      {/* Bucket visualization */}
      <Box
        sx={{
          width: '100%',
          height: { xs: 80, sm: 100 },
          position: 'relative',
          borderRadius: '0 0 12px 12px',
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
            borderRadius: '0 0 10px 10px',
            '&::after': fillPercent > 0 ? {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '4px',
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
              fontSize: { xs: '1rem', sm: '1.25rem' },
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
              fontSize: { xs: '0.55rem', sm: '0.6rem' },
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
      </Box>

      {/* Level badge */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 0.5,
        }}
      >
        <Typography
          sx={{
            fontSize: { xs: '0.6rem', sm: '0.65rem' },
            fontWeight: 700,
            color: category.color,
            background: `${category.color}15`,
            px: 0.75,
            py: 0.25,
            borderRadius: '6px',
            letterSpacing: '0.3px',
          }}
        >
          LVL {levelInfo.level}
        </Typography>
        {levelInfo.totalDrops > 0 && (
          <Typography
            sx={{
              fontSize: { xs: '0.55rem', sm: '0.6rem' },
              color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.35)',
            }}
          >
            {levelInfo.totalDrops} total
          </Typography>
        )}
      </Box>
    </Box>
  );
});

BucketCard.displayName = 'BucketCard';

BucketCard.propTypes = {
  category: PropTypes.shape({
    id: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
    emoji: PropTypes.string.isRequired,
    color: PropTypes.string.isRequired,
  }).isRequired,
  levelInfo: PropTypes.shape({
    level: PropTypes.number.isRequired,
    dropsInCurrentLevel: PropTypes.number.isRequired,
    maxDropsForLevel: PropTypes.number.isRequired,
    totalDrops: PropTypes.number.isRequired,
    progress: PropTypes.number.isRequired,
  }).isRequired,
  theme: PropTypes.object.isRequired,
};

export default WellnessBuckets;
