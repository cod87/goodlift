import { memo } from 'react';
import PropTypes from 'prop-types';
import { 
  Box, 
  Card, 
  CardContent, 
  Typography, 
  Stack,
  useTheme,
  useMediaQuery
} from '@mui/material';
import { 
  FitnessCenter, 
  Timer, 
  TrendingUp, 
  Whatshot 
} from '@mui/icons-material';

/**
 * StatsRow - Consolidated stats display in single compact row
 * Shows key metrics in a horizontally scrollable format
 */
const StatsRow = memo(({ stats = {} }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const {
    workoutsThisWeek = 0,
    totalVolume = 0,
    currentStreak = 0,
    avgDuration = 0,
  } = stats;

  const statItems = [
    {
      icon: <FitnessCenter />,
      value: workoutsThisWeek,
      label: 'Workouts this week',
      color: 'primary.main',
    },
    {
      icon: <TrendingUp />,
      value: totalVolume.toLocaleString(),
      label: 'Total volume (lbs)',
      color: 'success.main',
    },
    {
      icon: <Whatshot />,
      value: currentStreak,
      label: 'Day streak',
      color: 'warning.main',
    },
    {
      icon: <Timer />,
      value: avgDuration,
      label: 'Avg min/session',
      color: 'info.main',
    },
  ];

  return (
    <Card 
      sx={{ 
        width: '100%',
        borderRadius: 3,
        boxShadow: '0 4px 16px rgba(19, 70, 134, 0.08)',
      }}
    >
      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
        <Typography 
          variant="overline" 
          sx={{ 
            color: 'primary.main',
            fontWeight: 600,
            letterSpacing: 1,
            mb: 2,
            display: 'block',
          }}
        >
          YOUR STATS
        </Typography>

        <Stack
          direction="row"
          spacing={2}
          sx={{
            overflowX: 'auto',
            pb: 1,
            '&::-webkit-scrollbar': {
              height: '6px',
            },
            '&::-webkit-scrollbar-track': {
              backgroundColor: 'action.hover',
              borderRadius: '3px',
            },
            '&::-webkit-scrollbar-thumb': {
              backgroundColor: 'action.selected',
              borderRadius: '3px',
            },
          }}
        >
          {statItems.map((item, index) => (
            <Box
              key={index}
              sx={{
                minWidth: isMobile ? '140px' : '160px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                p: 1.5,
                borderRadius: 2,
                bgcolor: 'action.hover',
                border: '1px solid',
                borderColor: 'divider',
              }}
            >
              <Box 
                sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  mb: 0.5,
                  color: item.color,
                }}
              >
                {item.icon}
              </Box>
              <Typography 
                variant="h6" 
                sx={{ 
                  fontWeight: 700,
                  color: 'text.primary',
                  mb: 0.5,
                }}
              >
                {item.value}
              </Typography>
              <Typography 
                variant="caption" 
                sx={{ 
                  color: 'text.secondary',
                  fontSize: '0.7rem',
                  lineHeight: 1.2,
                }}
              >
                {item.label}
              </Typography>
            </Box>
          ))}
        </Stack>

        {isMobile && (
          <Typography 
            variant="caption" 
            sx={{ 
              color: 'text.secondary',
              display: 'block',
              textAlign: 'center',
              mt: 1,
              fontSize: '0.7rem',
            }}
          >
            ← Swipe for more →
          </Typography>
        )}
      </CardContent>
    </Card>
  );
});

StatsRow.displayName = 'StatsRow';

StatsRow.propTypes = {
  stats: PropTypes.shape({
    workoutsThisWeek: PropTypes.number,
    totalVolume: PropTypes.number,
    currentStreak: PropTypes.number,
    avgDuration: PropTypes.number,
  }),
};

export default StatsRow;
