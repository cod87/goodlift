import { memo } from 'react';
import PropTypes from 'prop-types';
import { 
  Box, 
  Card, 
  CardContent, 
  Typography, 
  Button, 
  Stack,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Chip,
  IconButton
} from '@mui/material';
import { 
  Edit, 
  Shuffle, 
  Refresh,
  PlayArrow
} from '@mui/icons-material';
import { getWorkoutTypeDisplayName } from '../../utils/weeklyPlanDefaults';

/**
 * WeeklyPlanPreview - Consolidated week view component
 * Shows all 7 days with quick-start and plan management
 */
const WeeklyPlanPreview = memo(({ 
  weeklyPlan = [],
  onQuickStartDay,
  onEditPlan,
  onRandomizeWeek,
  onResetPlan,
  currentDay = new Date().getDay()
}) => {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const todayAbbr = days[currentDay];

  const getWorkoutColor = (type) => {
    const colors = {
      push: 'primary',
      pull: 'info',
      legs: 'warning',
      upper: 'primary',
      lower: 'warning',
      full: 'success',
      yoga: 'secondary',
      hiit: 'error',
      rest: 'default',
      cardio: 'info'
    };
    return colors[type] || 'default';
  };

  return (
    <Card 
      sx={{ 
        width: '100%',
        borderRadius: 3,
        boxShadow: '0 4px 16px rgba(19, 70, 134, 0.08)',
      }}
    >
      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography 
            variant="overline" 
            sx={{ 
              color: 'primary.main',
              fontWeight: 600,
              letterSpacing: 1,
            }}
          >
            THIS WEEK
          </Typography>
          <IconButton size="small" onClick={onEditPlan} aria-label="Edit plan">
            <Edit fontSize="small" />
          </IconButton>
        </Box>

        {/* Weekly Plan List */}
        <List sx={{ p: 0 }}>
          {weeklyPlan.map((dayPlan, index) => {
            const isToday = dayPlan.day === todayAbbr;
            const isRest = dayPlan.type === 'rest';
            
            return (
              <ListItem
                key={index}
                disablePadding
                sx={{ 
                  mb: 0.5,
                  borderRadius: 1,
                  bgcolor: isToday ? 'action.selected' : 'transparent',
                }}
              >
                <ListItemButton
                  onClick={() => !isRest && onQuickStartDay && onQuickStartDay(dayPlan)}
                  disabled={isRest}
                  sx={{
                    borderRadius: 1,
                    py: 1,
                    px: 1.5,
                    '&:hover': {
                      bgcolor: isRest ? 'transparent' : 'action.hover',
                    }
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', gap: 1 }}>
                    {/* Day */}
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        minWidth: '35px',
                        fontWeight: isToday ? 700 : 600,
                        color: isToday ? 'primary.main' : 'text.secondary',
                      }}
                    >
                      {dayPlan.day}
                    </Typography>

                    {/* Workout Type */}
                    <Box sx={{ flex: 1 }}>
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          fontWeight: isToday ? 600 : 400,
                          color: isRest ? 'text.secondary' : 'text.primary',
                        }}
                      >
                        {getWorkoutTypeDisplayName(dayPlan.type)}
                      </Typography>
                      {dayPlan.description && !isRest && (
                        <Typography 
                          variant="caption" 
                          sx={{ 
                            color: 'text.secondary',
                            display: 'block',
                            fontSize: '0.7rem',
                          }}
                        >
                          {dayPlan.estimatedDuration ? `~${dayPlan.estimatedDuration} min` : ''}
                        </Typography>
                      )}
                    </Box>

                    {/* Status Chip */}
                    {!isRest && (
                      <Chip 
                        label={dayPlan.focus || dayPlan.style || 'workout'}
                        size="small"
                        color={getWorkoutColor(dayPlan.type)}
                        sx={{ 
                          textTransform: 'capitalize',
                          fontSize: '0.7rem',
                          height: '20px',
                        }}
                      />
                    )}

                    {/* Quick Start Icon */}
                    {!isRest && (
                      <IconButton 
                        size="small" 
                        onClick={(e) => {
                          e.stopPropagation();
                          onQuickStartDay && onQuickStartDay(dayPlan);
                        }}
                        sx={{ 
                          ml: 1,
                          color: 'primary.main',
                        }}
                      >
                        <PlayArrow fontSize="small" />
                      </IconButton>
                    )}
                  </Box>
                </ListItemButton>
              </ListItem>
            );
          })}
        </List>

        {/* Action Buttons */}
        <Stack 
          direction="row" 
          spacing={1} 
          sx={{ mt: 2, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}
        >
          <Button
            variant="outlined"
            size="small"
            startIcon={<Shuffle />}
            onClick={onRandomizeWeek}
            sx={{ flex: 1 }}
          >
            Randomize
          </Button>
          <Button
            variant="outlined"
            size="small"
            startIcon={<Refresh />}
            onClick={onResetPlan}
            sx={{ flex: 1 }}
          >
            Reset
          </Button>
        </Stack>
      </CardContent>
    </Card>
  );
});

WeeklyPlanPreview.displayName = 'WeeklyPlanPreview';

WeeklyPlanPreview.propTypes = {
  weeklyPlan: PropTypes.arrayOf(PropTypes.shape({
    day: PropTypes.string.isRequired,
    type: PropTypes.string.isRequired,
    focus: PropTypes.string,
    style: PropTypes.string,
    estimatedDuration: PropTypes.number,
    description: PropTypes.string,
  })).isRequired,
  onQuickStartDay: PropTypes.func,
  onEditPlan: PropTypes.func.isRequired,
  onRandomizeWeek: PropTypes.func.isRequired,
  onResetPlan: PropTypes.func.isRequired,
  currentDay: PropTypes.number,
};

export default WeeklyPlanPreview;
