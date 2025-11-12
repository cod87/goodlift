import { useState } from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  IconButton,
  Tooltip,
  Paper
} from '@mui/material';
import {
  DragIndicator as DragIcon,
  FitnessCenter as StrengthIcon,
  DirectionsRun as CardioIcon,
  SelfImprovement as RecoveryIcon,
  Hotel as RestIcon,
  Timer as TimerIcon,
  List as ExerciseIcon
} from '@mui/icons-material';
import {
  DAY_TYPES,
  getDayTypeColor,
  getDayTypeLabel,
  estimateDayMetrics,
  reorderWeeklyPlan
} from '../utils/planScheduler';

/**
 * WeeklyCalendarView Component
 * Displays a 7-day grid layout with drag-and-drop reordering
 * Shows day type, exercise count, and duration for each day
 */
const WeeklyCalendarView = ({ weeklyPlan, onPlanChange, onDayClick, readOnly = false }) => {
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);

  /**
   * Handle drag start
   */
  const handleDragStart = (e, index) => {
    if (readOnly) return;
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  /**
   * Handle drag over
   */
  const handleDragOver = (e, index) => {
    if (readOnly) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIndex(index);
  };

  /**
   * Handle drop
   */
  const handleDrop = (e, toIndex) => {
    if (readOnly) return;
    e.preventDefault();
    
    if (draggedIndex !== null && draggedIndex !== toIndex) {
      const reorderedPlan = reorderWeeklyPlan(weeklyPlan, draggedIndex, toIndex);
      onPlanChange?.(reorderedPlan);
    }
    
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  /**
   * Handle drag end
   */
  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  /**
   * Get icon for day type
   */
  const getDayIcon = (dayType) => {
    const iconProps = { sx: { fontSize: 20 } };
    
    switch (dayType) {
      case DAY_TYPES.STRENGTH:
      case DAY_TYPES.HYPERTROPHY:
        return <StrengthIcon {...iconProps} />;
      case DAY_TYPES.CARDIO:
        return <CardioIcon {...iconProps} />;
      case DAY_TYPES.ACTIVE_RECOVERY:
        return <RecoveryIcon {...iconProps} />;
      case DAY_TYPES.REST:
        return <RestIcon {...iconProps} />;
      default:
        return <StrengthIcon {...iconProps} />;
    }
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Grid container spacing={2}>
        {weeklyPlan.map((day, index) => {
          const metrics = estimateDayMetrics(day);
          const dayColor = getDayTypeColor(day.type);
          const isDragging = draggedIndex === index;
          const isDragOver = dragOverIndex === index;

          return (
            <Grid item xs={12} sm={6} md={4} lg={3} key={day.dayOfWeek}>
              <Card
                draggable={!readOnly}
                onDragStart={(e) => handleDragStart(e, index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDrop={(e) => handleDrop(e, index)}
                onDragEnd={handleDragEnd}
                onClick={() => onDayClick?.(day, index)}
                sx={{
                  cursor: readOnly ? 'default' : 'grab',
                  opacity: isDragging ? 0.5 : 1,
                  transform: isDragOver && !isDragging ? 'scale(1.02)' : 'scale(1)',
                  transition: 'all 0.2s ease',
                  border: isDragOver && !isDragging ? '2px dashed #1976d2' : '1px solid rgba(0, 0, 0, 0.12)',
                  '&:hover': {
                    boxShadow: readOnly ? 1 : 3,
                    transform: isDragging ? 'scale(1)' : 'scale(1.02)'
                  },
                  position: 'relative',
                  overflow: 'visible'
                }}
              >
                {/* Drag Handle */}
                {!readOnly && (
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 8,
                      right: 8,
                      cursor: 'grab',
                      '&:active': {
                        cursor: 'grabbing'
                      }
                    }}
                  >
                    <Tooltip title="Drag to reorder">
                      <IconButton size="small" sx={{ padding: 0.5 }}>
                        <DragIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                      </IconButton>
                    </Tooltip>
                  </Box>
                )}

                <CardContent sx={{ pb: 2, '&:last-child': { pb: 2 } }}>
                  {/* Day Name */}
                  <Typography
                    variant="subtitle2"
                    sx={{
                      fontWeight: 600,
                      mb: 1,
                      color: 'text.secondary',
                      textTransform: 'uppercase',
                      fontSize: '0.75rem',
                      letterSpacing: 0.5
                    }}
                  >
                    {day.dayName}
                  </Typography>

                  {/* Day Type Chip */}
                  <Chip
                    icon={getDayIcon(day.type)}
                    label={getDayTypeLabel(day.type)}
                    size="small"
                    sx={{
                      backgroundColor: dayColor,
                      color: 'white',
                      fontWeight: 600,
                      mb: 2,
                      width: '100%',
                      '& .MuiChip-icon': {
                        color: 'white'
                      }
                    }}
                  />

                  {/* Metrics */}
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {/* Exercise Count */}
                    {metrics.exerciseCount > 0 && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <ExerciseIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                        <Typography variant="body2" color="text.secondary">
                          {metrics.exerciseCount} {metrics.exerciseCount === 1 ? 'exercise' : 'exercises'}
                        </Typography>
                      </Box>
                    )}

                    {/* Duration */}
                    {metrics.duration > 0 && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <TimerIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                        <Typography variant="body2" color="text.secondary">
                          ~{metrics.duration} min
                        </Typography>
                      </Box>
                    )}

                    {/* Description */}
                    {day.description && (
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{
                          mt: 0.5,
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden'
                        }}
                      >
                        {day.description}
                      </Typography>
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {/* Legend */}
      <Paper
        elevation={0}
        sx={{
          mt: 3,
          p: 2,
          backgroundColor: 'action.hover',
          borderRadius: 2
        }}
      >
        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5 }}>
          Day Type Legend
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          {Object.values(DAY_TYPES).map((type) => (
            <Chip
              key={type}
              label={getDayTypeLabel(type)}
              size="small"
              sx={{
                backgroundColor: getDayTypeColor(type),
                color: 'white',
                fontWeight: 500
              }}
            />
          ))}
        </Box>
      </Paper>

      {/* Instructions */}
      {!readOnly && (
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ display: 'block', mt: 2, textAlign: 'center' }}
        >
          Drag and drop days to reorder your weekly schedule • Click a day to edit details
        </Typography>
      )}
    </Box>
  );
};

WeeklyCalendarView.propTypes = {
  weeklyPlan: PropTypes.arrayOf(
    PropTypes.shape({
      dayOfWeek: PropTypes.number.isRequired,
      dayName: PropTypes.string.isRequired,
      type: PropTypes.oneOf(Object.values(DAY_TYPES)).isRequired,
      exercises: PropTypes.array,
      duration: PropTypes.number,
      description: PropTypes.string
    })
  ).isRequired,
  onPlanChange: PropTypes.func,
  onDayClick: PropTypes.func,
  readOnly: PropTypes.bool
};

export default WeeklyCalendarView;
