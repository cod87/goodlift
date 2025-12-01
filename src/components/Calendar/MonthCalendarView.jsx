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
  alpha,
} from '@mui/material';
import {
  ChevronLeft,
  ChevronRight,
  Bookmark,
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

  // Check if a workout type is a strength training type
  const isStrengthType = (type) => {
    if (!type) return false;
    const normalizedType = type.toLowerCase();
    // Strength training types include: upper, lower, full, push, pull, legs, strength, hypertrophy
    const strengthTypes = ['upper', 'lower', 'full', 'push', 'pull', 'legs', 'strength', 'hypertrophy'];
    return strengthTypes.includes(normalizedType);
  };

  // Get primary workout type for display
  // Priority: 1. Strength training sessions, 2. Longer session (for non-strength)
  const getPrimaryWorkoutType = (workouts) => {
    if (!workouts || workouts.length === 0) return null;
    
    if (workouts.length === 1) {
      const workout = workouts[0];
      return workout.type?.toLowerCase() || workout.workoutType?.toLowerCase() || 'strength';
    }

    // Multiple workouts on the same day
    // First, look for strength training sessions
    const strengthWorkout = workouts.find(w => {
      const type = w.type?.toLowerCase() || w.workoutType?.toLowerCase();
      return isStrengthType(type);
    });

    if (strengthWorkout) {
      return strengthWorkout.type?.toLowerCase() || strengthWorkout.workoutType?.toLowerCase() || 'strength';
    }

    // No strength workout found - prefer the longer session
    // Note: If durations are equal, the first workout in the array is returned (stable selection)
    const longestWorkout = workouts.reduce((longest, current) => {
      const currentDuration = current.duration || 0;
      const longestDuration = longest.duration || 0;
      return currentDuration > longestDuration ? current : longest;
    }, workouts[0]);

    return longestWorkout.type?.toLowerCase() || longestWorkout.workoutType?.toLowerCase() || 'strength';
  };

  // Cardio subtypes that should be treated as cardio
  const cardioSubtypes = ['running', 'cycling', 'swimming', 'general'];

  // Get workout type abbreviation for display
  const getWorkoutTypeLabel = (type) => {
    if (!type) return 'X';
    
    const normalizedType = type.toLowerCase();
    
    // Check if this is a cardio subtype
    if (cardioSubtypes.includes(normalizedType)) {
      return 'C';
    }
    
    const labelMap = {
      'upper': 'UP',
      'lower': 'LO',
      'full': 'FL',
      'push': 'PS',
      'pull': 'PL',
      'legs': 'LG',
      'yoga': 'Y',
      'hiit': 'H',
      'cardio': 'C',
    };
    
    return labelMap[normalizedType] || 'X';
  };

  // Get workout type color for the marker
  const getWorkoutColor = (type) => {
    if (!type) return 'primary.main';
    
    const normalizedType = type.toLowerCase();
    
    if (normalizedType === 'cardio' || normalizedType === 'hiit' || cardioSubtypes.includes(normalizedType)) {
      return 'error.main';
    } else if (normalizedType === 'stretch' || normalizedType === 'active_recovery' || normalizedType === 'yoga' || normalizedType === 'mobility') {
      return 'secondary.main';
    } else if (normalizedType === 'rest') {
      return 'action.disabled';
    } else {
      return 'primary.main'; // Strength training
    }
  };

  const cells = getCalendarCells();
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const today = new Date();

  return (
    <Card sx={{ borderRadius: 3, overflow: 'hidden' }}>
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
            gap: 0,
            border: 1,
            borderColor: 'divider',
            borderRadius: 1,
            overflow: 'hidden',
          }}
        >
          {cells.map((date, index) => {
            const isCurrentMonth = isSameMonth(date, currentMonth);
            const isToday = isSameDay(date, today);
            const workoutsOnDay = getWorkoutsForDay(date);
            const isCompleted = workoutsOnDay.length > 0;
            const primaryType = getPrimaryWorkoutType(workoutsOnDay);
            const hasStrengthTraining = isCompleted && isStrengthType(primaryType);
            // Calculate grid position for corner radius handling
            const totalRows = Math.ceil(cells.length / 7);
            const isLastRow = Math.floor(index / 7) === totalRows - 1;
            const isFirstRow = Math.floor(index / 7) === 0;
            const isFirstColumn = index % 7 === 0;
            const isLastColumn = index % 7 === 6;
            // Determine if this cell is at a corner of the grid
            const isTopLeftCorner = isFirstRow && isFirstColumn;
            const isTopRightCorner = isFirstRow && isLastColumn;
            const isBottomLeftCorner = isLastRow && isFirstColumn;
            const isBottomRightCorner = isLastRow && isLastColumn;

            // Strength training background colors using theme's primary color
            const strengthBgLight = alpha(theme.palette.primary.main, 0.12);
            const strengthBgDark = alpha(theme.palette.primary.main, 0.18);
            const strengthHoverLight = alpha(theme.palette.primary.main, 0.20);
            const strengthHoverDark = alpha(theme.palette.primary.main, 0.28);

            // Get background color - strength training days get a prominent background
            // Today with strength training gets the strength background (outline still shows today)
            const getBackgroundColor = () => {
              if (hasStrengthTraining) {
                // Use a tinted background for strength training days
                return theme.palette.mode === 'dark' ? strengthBgDark : strengthBgLight;
              }
              if (isToday) {
                return 'action.selected';
              }
              return 'transparent';
            };

            // Calculate border radius for corners - matches the grid's borderRadius of 1 (4px)
            const getBorderRadius = () => {
              const radius = '4px';
              if (isTopLeftCorner) return `${radius} 0 0 0`;
              if (isTopRightCorner) return `0 ${radius} 0 0`;
              if (isBottomLeftCorner) return `0 0 0 ${radius}`;
              if (isBottomRightCorner) return `0 0 ${radius} 0`;
              return 0;
            };

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
                  borderRadius: getBorderRadius(),
                  cursor: isCompleted ? 'pointer' : 'default',
                  bgcolor: getBackgroundColor(),
                  opacity: isCurrentMonth ? 1 : 0.3,
                  // Subtle grid borders
                  borderRight: 1,
                  borderBottom: isLastRow ? 0 : 1,
                  borderColor: 'divider',
                  // Highlight today with a visible outline that respects corner radius
                  ...(isToday && {
                    outline: '2px solid',
                    outlineColor: 'primary.main',
                    outlineOffset: -2,
                    zIndex: 1,
                  }),
                  transition: 'all 0.2s ease',
                  minHeight: { xs: 40, sm: 52 },
                  maxHeight: { xs: 44, sm: 60 },
                  position: 'relative',
                  padding: { xs: '3px 2px', sm: '6px 4px' },
                  '&:hover': isCompleted ? {
                    bgcolor: hasStrengthTraining 
                      ? (theme.palette.mode === 'dark' ? strengthHoverDark : strengthHoverLight)
                      : 'action.hover',
                    transform: 'scale(1.02)',
                    boxShadow: 1,
                    zIndex: 2,
                  } : {},
                  // Remove right border from last column (every 7th cell in the weekly grid)
                  '&:nth-of-type(7n)': {
                    borderRight: 0,
                  },
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
                
                {/* Bookmark indicator for days with multiple sessions */}
                {workoutsOnDay.length > 1 && (
                  <Bookmark
                    sx={{
                      position: 'absolute',
                      top: { xs: 0, sm: 1 },
                      right: { xs: 0, sm: 1 },
                      fontSize: { xs: '0.6rem', sm: '0.75rem' },
                      color: 'text.secondary',
                      opacity: 0.7,
                    }}
                  />
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
