import { useState } from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  Card,
  CardContent,
  Typography,
  IconButton,
  Chip,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  ChevronLeft,
  ChevronRight,
} from '@mui/icons-material';
import { 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  addDays, 
  format, 
  isSameMonth, 
  isSameDay,
  addMonths,
  subMonths
} from 'date-fns';
// getWorkoutTypeShorthand import removed - no longer needed

/**
 * MonthCalendarView - Standard calendar grid view with workout indicators
 * Features:
 * - Classic month/week grid layout (7 columns for days of week)
 * - Day-of-week headers (Sun-Sat)
 * - Workout day indicators showing completed activities only
 * - Mobile-responsive with proper touch targets
 * - Large color-coded X markers for logged activities
 */
const MonthCalendarView = ({ 
  workoutHistory = [],
  onDayClick,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Get calendar cells for the month
  const getCalendarCells = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const cells = [];
    let day = startDate;

    while (day <= endDate) {
      cells.push(day);
      day = addDays(day, 1);
    }

    return cells;
  };

  // Get all workouts for a specific day (there can be multiple)
  const getWorkoutsForDay = (date) => {
    return workoutHistory.filter(workout => {
      const workoutDate = new Date(workout.date);
      return isSameDay(workoutDate, date);
    });
  };

  // hasCompletedWorkout function removed - using getWorkoutsForDay instead

  // Get primary workout type for display (if multiple workouts, show first)
  const getPrimaryWorkoutType = (workouts) => {
    if (!workouts || workouts.length === 0) return null;
    const workout = workouts[0];
    return workout.type?.toLowerCase() || workout.workoutType?.toLowerCase() || 'strength';
  };

  // Get workout type abbreviation for display
  const getWorkoutTypeLabel = (type) => {
    if (!type) return 'X';
    
    const normalizedType = type.toLowerCase();
    const labelMap = {
      'upper': 'UP',
      'lower': 'LO',
      'full': 'FL',
      'push': 'PS',
      'pull': 'PL',
      'legs': 'LG',
    };
    
    return labelMap[normalizedType] || 'X';
  };

  // Get workout type color for the marker
  const getWorkoutColor = (type) => {
    if (!type) return 'primary.main';
    
    if (type === 'cardio' || type === 'hiit') {
      return 'error.main';
    } else if (type === 'stretch' || type === 'active_recovery' || type === 'yoga' || type === 'mobility') {
      return 'secondary.main';
    } else if (type === 'rest') {
      return 'action.disabled';
    } else {
      return 'primary.main'; // Strength training
    }
  };

  const cells = getCalendarCells();
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const today = new Date();

  return (
    <Card elevation={2} sx={{ borderRadius: 3, overflow: 'hidden' }}>
      <CardContent sx={{ 
        p: { xs: 2, sm: 3 },
        width: '100%',
        maxWidth: '100%',
        boxSizing: 'border-box',
      }}>
        {/* Month Navigation */}
        <Box 
          sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            mb: 3
          }}
        >
          <IconButton 
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            size={isMobile ? 'small' : 'medium'}
          >
            <ChevronLeft />
          </IconButton>
          
          <Typography 
            variant="h6" 
            sx={{ 
              fontWeight: 600,
              fontSize: { xs: '1.1rem', sm: '1.25rem' }
            }}
          >
            {format(currentMonth, 'MMMM yyyy')}
          </Typography>
          
          <IconButton 
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            size={isMobile ? 'small' : 'medium'}
          >
            <ChevronRight />
          </IconButton>
        </Box>

        {/* Day Headers */}
        <Box 
          sx={{ 
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            gap: { xs: 0.25, sm: 0.5 },
            mb: 0.5,
          }}
        >
          {dayNames.map((day) => (
            <Box
              key={day}
              sx={{
                textAlign: 'center',
                py: { xs: 0.5, sm: 1 },
                fontWeight: 700,
                color: 'text.primary',
                fontSize: { xs: '0.7rem', sm: '0.875rem' },
                opacity: 0.8,
              }}
            >
              {isMobile ? day.charAt(0) : day}
            </Box>
          ))}
        </Box>

        {/* Calendar Grid */}
        <Box 
          sx={{ 
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            gap: { xs: 0.25, sm: 0.5 },
          }}
        >
          {cells.map((date, index) => {
            const isCurrentMonth = isSameMonth(date, currentMonth);
            const isToday = isSameDay(date, today);
            const workoutsOnDay = getWorkoutsForDay(date);
            const isCompleted = workoutsOnDay.length > 0;
            const primaryType = getPrimaryWorkoutType(workoutsOnDay);

            return (
              <Box
                key={index}
                onClick={() => isCompleted && onDayClick?.(date, workoutsOnDay[0])}
                sx={{
                  aspectRatio: '1',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 1,
                  cursor: isCompleted ? 'pointer' : 'default',
                  bgcolor: isToday 
                    ? 'action.selected' 
                    : 'transparent',
                  opacity: isCurrentMonth ? 1 : 0.3,
                  border: isToday ? 2 : 1,
                  borderColor: isToday ? 'primary.main' : 'transparent',
                  transition: 'all 0.2s ease',
                  minHeight: { xs: 40, sm: 52 },
                  maxHeight: { xs: 44, sm: 60 },
                  position: 'relative',
                  padding: { xs: '3px 2px', sm: '6px 4px' },
                  '&:hover': isCompleted ? {
                    bgcolor: 'action.hover',
                    transform: 'scale(1.05)',
                    boxShadow: 1,
                  } : {},
                }}
              >
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: isToday ? 700 : 500,
                    color: 'text.primary',
                    fontSize: { xs: '0.7rem', sm: '0.875rem' },
                    position: 'absolute',
                    top: { xs: 3, sm: 6 },
                    left: '50%',
                    transform: 'translateX(-50%)',
                  }}
                >
                  {format(date, 'd')}
                </Typography>
                
                {/* Workout type label for completed workouts */}
                {isCompleted && (
                  <Typography
                    sx={{
                      fontSize: { xs: '0.65rem', sm: '0.75rem' },
                      fontWeight: 900,
                      color: getWorkoutColor(primaryType),
                      lineHeight: 1,
                      textShadow: '0 1px 2px rgba(0,0,0,0.1)',
                      marginTop: 'auto',
                      marginBottom: { xs: '1px', sm: '4px' },
                      letterSpacing: '0.5px',
                    }}
                  >
                    {getWorkoutTypeLabel(primaryType)}
                  </Typography>
                )}
              </Box>
            );
          })}
        </Box>

        {/* Legend */}
        <Box 
          sx={{ 
            display: 'flex', 
            gap: { xs: 1, sm: 2 }, 
            mt: 3, 
            flexWrap: 'nowrap',
            justifyContent: 'center',
            overflowX: 'auto',
          }}
        >
          <Chip
            label="Strength"
            size="small"
            sx={{ 
              bgcolor: 'primary.light',
              fontSize: { xs: '0.7rem', sm: '0.8125rem' },
              height: { xs: 24, sm: 32 },
            }}
          />
          <Chip
            label="Yoga"
            size="small"
            sx={{ 
              bgcolor: 'secondary.light',
              fontSize: { xs: '0.7rem', sm: '0.8125rem' },
              height: { xs: 24, sm: 32 },
            }}
          />
          <Chip
            label="Cardio"
            size="small"
            sx={{ 
              bgcolor: 'error.light',
              fontSize: { xs: '0.7rem', sm: '0.8125rem' },
              height: { xs: 24, sm: 32 },
            }}
          />
          <Chip
            label="Rest"
            size="small"
            sx={{ 
              bgcolor: 'action.disabledBackground',
              fontSize: { xs: '0.7rem', sm: '0.8125rem' },
              height: { xs: 24, sm: 32 },
            }}
          />
        </Box>
      </CardContent>
    </Card>
  );
};

MonthCalendarView.propTypes = {
  workoutHistory: PropTypes.array,
  onDayClick: PropTypes.func,
};

export default MonthCalendarView;
