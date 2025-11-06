import { useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import { Box } from '@mui/material';
import { FitnessCenter, SelfImprovement, Timer, DirectionsRun } from '@mui/icons-material';
import '../styles/Calendar.css';

// Helper function to get icon for session type
const getIconForSessionType = (type) => {
  switch (type) {
    case 'workout':
      return <FitnessCenter sx={{ fontSize: 'small', color: 'primary.main' }} />;
    case 'yoga':
      return <SelfImprovement sx={{ fontSize: 'small', color: '#9c27b0' }} />;
    case 'hiit':
      return <Timer sx={{ fontSize: 'small', color: 'secondary.main' }} />;
    case 'cardio':
    case 'stretch':
      return <DirectionsRun sx={{ fontSize: 'small', color: 'success.main' }} />;
    default:
      return null;
  }
};

const Calendar = ({ workoutSessions = [] }) => {
  const [viewMode, setViewMode] = useState('monthly'); // 'monthly' or 'weekly'
  const [currentDate, setCurrentDate] = useState(new Date());

  // Create a map of dates to session types for quick lookup (format: YYYY-MM-DD -> [types])
  const workoutDateMap = useMemo(() => {
    const dateMap = new Map();
    workoutSessions.forEach(session => {
      const d = new Date(session.date);
      const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      if (!dateMap.has(dateStr)) {
        dateMap.set(dateStr, []);
      }
      if (!dateMap.get(dateStr).includes(session.type)) {
        dateMap.get(dateStr).push(session.type);
      }
    });
    return dateMap;
  }, [workoutSessions]);

  // Get session types for a date
  const getSessionTypes = (date) => {
    const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    return workoutDateMap.get(dateStr) || [];
  };

  // Check if a date has a workout
  const hasWorkout = (date) => {
    return getSessionTypes(date).length > 0;
  };

  // Get days for monthly view
  const getMonthDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add all days in the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      days.push(date);
    }
    
    return days;
  };

  // Get days for weekly view
  const getWeekDays = () => {
    const days = [];
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
    
    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      days.push(day);
    }
    
    return days;
  };

  // Navigate to previous period
  const goToPrevious = () => {
    const newDate = new Date(currentDate);
    if (viewMode === 'monthly') {
      newDate.setMonth(currentDate.getMonth() - 1);
    } else {
      newDate.setDate(currentDate.getDate() - 7);
    }
    setCurrentDate(newDate);
  };

  // Navigate to next period
  const goToNext = () => {
    const newDate = new Date(currentDate);
    if (viewMode === 'monthly') {
      newDate.setMonth(currentDate.getMonth() + 1);
    } else {
      newDate.setDate(currentDate.getDate() + 7);
    }
    setCurrentDate(newDate);
  };

  // Navigate to today
  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Get current period label
  const getPeriodLabel = () => {
    if (viewMode === 'monthly') {
      return currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    } else {
      const weekDays = getWeekDays();
      const start = weekDays[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const end = weekDays[6].toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      return `${start} - ${end}`;
    }
  };

  // Check if date is today
  const isToday = (date) => {
    if (!date) return false;
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  };

  const days = viewMode === 'monthly' ? getMonthDays() : getWeekDays();

  return (
    <div className="calendar-container">
      <div className="calendar-header">
        <div className="calendar-controls">
          <button onClick={goToPrevious} className="calendar-nav-btn">←</button>
          <h3 className="calendar-period">{getPeriodLabel()}</h3>
          <button onClick={goToNext} className="calendar-nav-btn">→</button>
        </div>
        <div className="calendar-actions">
          <button onClick={goToToday} className="calendar-today-btn">Today</button>
          <div className="view-toggle">
            <button
              onClick={() => setViewMode('weekly')}
              className={viewMode === 'weekly' ? 'active' : ''}
            >
              Week
            </button>
            <button
              onClick={() => setViewMode('monthly')}
              className={viewMode === 'monthly' ? 'active' : ''}
            >
              Month
            </button>
          </div>
        </div>
      </div>

      <div className={`calendar-grid ${viewMode}`}>
        {/* Day labels */}
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="calendar-day-label">{day}</div>
        ))}
        
        {/* Calendar days */}
        {days.map((date, index) => {
          const sessionTypes = date ? getSessionTypes(date) : [];
          return (
            <div
              key={index}
              className={`calendar-day ${!date ? 'empty' : ''} ${isToday(date) ? 'today' : ''} ${date && hasWorkout(date) ? 'workout-day' : ''}`}
            >
              {date && (
                <>
                  <span className="day-number">{date.getDate()}</span>
                  {sessionTypes.length > 0 && (
                    <Box 
                      display="flex" 
                      flexWrap="wrap" 
                      gap={0.25} 
                      justifyContent="center" 
                      alignItems="center"
                      sx={{ mt: 0.5 }}
                    >
                      {sessionTypes.map((type, idx) => (
                        <Box key={idx} sx={{ display: 'flex', alignItems: 'center' }}>
                          {getIconForSessionType(type)}
                        </Box>
                      ))}
                    </Box>
                  )}
                </>
              )}
            </div>
          );
        })}
      </div>

      <div className="calendar-legend">
        <div className="legend-item">
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            {getIconForSessionType('workout')}
            <span>Workout</span>
          </Box>
        </div>
        <div className="legend-item">
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            {getIconForSessionType('yoga')}
            <span>Yoga</span>
          </Box>
        </div>
        <div className="legend-item">
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            {getIconForSessionType('hiit')}
            <span>HIIT</span>
          </Box>
        </div>
        <div className="legend-item">
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            {getIconForSessionType('cardio')}
            <span>Cardio/Stretch</span>
          </Box>
        </div>
        <div className="legend-item">
          <span className="legend-dot today">◆</span>
          <span>Today</span>
        </div>
      </div>
    </div>
  );
};

Calendar.propTypes = {
  workoutSessions: PropTypes.arrayOf(
    PropTypes.shape({
      date: PropTypes.number.isRequired,
      type: PropTypes.string.isRequired,
    })
  ),
};

export default Calendar;
