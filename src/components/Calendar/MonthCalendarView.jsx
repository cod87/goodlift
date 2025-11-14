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
  FitnessCenter,
  DirectionsRun,
  SelfImprovement,
  Hotel,
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

  // Get workout type color for the X marker
  const getWorkoutColor = (type) => {
    if (!type) return 'primary.main';
    
    if (type === 'cardio' || type === 'hiit') {
      return 'error.main';
    } else if (type === 'stretch' || type === 'active_recovery' || type === 'yoga' || type === 'mobility') {
      return 'secondary.main';
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
            gap: 0.5,
            mb: 1,
          }}
        >
          {dayNames.map((day) => (
            <Box
              key={day}
              sx={{
                textAlign: 'center',
                py: 1,
                fontWeight: 600,
                color: 'text.secondary',
                fontSize: { xs: '0.75rem', sm: '0.875rem' },
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
            gap: 0.5,
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
                  minHeight: { xs: 48, sm: 56 },
                  position: 'relative',
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
                    fontSize: { xs: '0.75rem', sm: '0.875rem' },
                    mb: 0.5,
                  }}
                >
                  {format(date, 'd')}
                </Typography>
                
                {/* Large X marker for completed workouts */}
                {isCompleted && (
                  <Typography
                    sx={{
                      fontSize: { xs: '1.5rem', sm: '1.75rem' },
                      fontWeight: 900,
                      color: getWorkoutColor(primaryType),
                      lineHeight: 1,
                      textShadow: '0 1px 2px rgba(0,0,0,0.1)',
                    }}
                  >
                    ✕
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
            gap: 2, 
            mt: 3, 
            flexWrap: 'wrap',
            justifyContent: 'center',
          }}
        >
          <Chip
            icon={<FitnessCenter />}
            label="Strength"
            size="small"
            sx={{ bgcolor: 'primary.light' }}
          />
          <Chip
            icon={<SelfImprovement />}
            label="Yoga"
            size="small"
            sx={{ bgcolor: 'secondary.light' }}
          />
          <Chip
            icon={<DirectionsRun />}
            label="Cardio"
            size="small"
            sx={{ bgcolor: 'error.light' }}
          />
          <Chip
            icon={<Hotel />}
            label="Rest"
            size="small"
            sx={{ bgcolor: 'action.disabledBackground' }}
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
