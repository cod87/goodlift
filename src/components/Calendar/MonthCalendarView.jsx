import { useState } from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  Card,
  CardContent,
  Typography,
  IconButton,
  Grid,
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
import { getWorkoutTypeShorthand } from '../../utils/weeklyPlanDefaults';

/**
 * MonthCalendarView - Standard calendar grid view with workout indicators
 * Features:
 * - Classic month/week grid layout (7 columns for days of week)
 * - Day-of-week headers (Sun-Sat)
 * - Workout day indicators (icons/colors)
 * - Mobile-responsive with proper touch targets
 * - Clickable days for interaction
 */
const MonthCalendarView = ({ 
  currentPlan,
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

  // Get workout for a specific day
  const getWorkoutForDay = (date) => {
    if (!currentPlan || !currentPlan.days) return null;
    
    const dayOfWeek = date.getDay();
    return currentPlan.days[dayOfWeek] || null;
  };

  // Check if a workout was completed on this day
  const hasCompletedWorkout = (date) => {
    return workoutHistory.some(workout => {
      const workoutDate = new Date(workout.date);
      return isSameDay(workoutDate, date);
    });
  };

  // Get workout type icon or shorthand
  const getWorkoutDisplay = (workout) => {
    if (!workout || workout.type === 'rest') return <Hotel sx={{ fontSize: 16 }} />;
    
    const type = workout.type?.toLowerCase() || workout.workoutType?.toLowerCase();
    
    // For strength workouts, show shorthand label
    if (['upper', 'lower', 'push', 'pull', 'legs', 'full'].includes(type)) {
      return (
        <Typography 
          variant="caption" 
          sx={{ 
            fontWeight: 700, 
            fontSize: { xs: '0.65rem', sm: '0.7rem' },
            lineHeight: 1
          }}
        >
          {getWorkoutTypeShorthand(type)}
        </Typography>
      );
    }
    
    // For other workouts, show icons
    if (type === 'cardio' || type === 'hiit') {
      return <DirectionsRun sx={{ fontSize: 16 }} />;
    } else if (type === 'stretch' || type === 'active_recovery') {
      return <SelfImprovement sx={{ fontSize: 16 }} />;
    } else {
      return <FitnessCenter sx={{ fontSize: 16 }} />;
    }
  };

  // Get workout type color
  const getWorkoutColor = (workout) => {
    if (!workout || workout.type === 'rest') return 'action.disabled';
    
    const type = workout.type?.toLowerCase() || workout.workoutType?.toLowerCase();
    
    if (type === 'cardio' || type === 'hiit') {
      return 'error.main';
    } else if (type === 'stretch' || type === 'active_recovery') {
      return 'secondary.main';
    } else {
      return 'primary.main';
    }
  };

  const cells = getCalendarCells();
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const today = new Date();

  return (
    <Card elevation={2} sx={{ borderRadius: 3 }}>
      <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
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
        <Grid container spacing={0.5} sx={{ mb: 1 }}>
          {dayNames.map((day) => (
            <Grid item xs={12 / 7} key={day}>
              <Box
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
            </Grid>
          ))}
        </Grid>

        {/* Calendar Grid */}
        <Grid container spacing={0.5}>
          {cells.map((date, index) => {
            const isCurrentMonth = isSameMonth(date, currentMonth);
            const isToday = isSameDay(date, today);
            const workout = getWorkoutForDay(date);
            const isCompleted = hasCompletedWorkout(date);
            const hasWorkout = workout && workout.type !== 'rest';

            return (
              <Grid item xs={12 / 7} key={index}>
                <Box
                  onClick={() => onDayClick?.(date, workout)}
                  sx={{
                    aspectRatio: '1',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 1,
                    cursor: hasWorkout ? 'pointer' : 'default',
                    bgcolor: isToday 
                      ? 'primary.light' 
                      : isCompleted 
                        ? 'success.light'
                        : hasWorkout 
                          ? 'action.hover' 
                          : 'transparent',
                    opacity: isCurrentMonth ? 1 : 0.3,
                    border: isToday ? 2 : 1,
                    borderColor: isToday ? 'primary.main' : 'transparent',
                    transition: 'all 0.2s ease',
                    minHeight: { xs: 48, sm: 56 },
                    '&:hover': hasWorkout ? {
                      bgcolor: isToday ? 'primary.light' : 'action.selected',
                      transform: 'scale(1.05)',
                      boxShadow: 1,
                    } : {},
                  }}
                >
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: isToday ? 700 : 500,
                      color: isToday ? 'primary.contrastText' : 'text.primary',
                      fontSize: { xs: '0.75rem', sm: '0.875rem' },
                      mb: 0.5,
                    }}
                  >
                    {format(date, 'd')}
                  </Typography>
                  
                  {hasWorkout && (
                    <Box
                      sx={{
                        color: isCompleted ? 'success.dark' : getWorkoutColor(workout),
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {getWorkoutDisplay(workout)}
                    </Box>
                  )}
                  
                  {isCompleted && (
                    <Box
                      sx={{
                        width: 6,
                        height: 6,
                        borderRadius: '50%',
                        bgcolor: 'success.main',
                        mt: 0.5,
                      }}
                    />
                  )}
                </Box>
              </Grid>
            );
          })}
        </Grid>

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
            icon={<DirectionsRun />}
            label="Cardio"
            size="small"
            sx={{ bgcolor: 'error.light' }}
          />
          <Chip
            icon={<SelfImprovement />}
            label="Recovery"
            size="small"
            sx={{ bgcolor: 'secondary.light' }}
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
  currentPlan: PropTypes.object,
  workoutHistory: PropTypes.array,
  onDayClick: PropTypes.func,
};

export default MonthCalendarView;
