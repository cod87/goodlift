import { useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import { Box } from '@mui/material';
import '../styles/Calendar.css';

const Calendar = ({ workoutSessions = [], onDayClick }) => {
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

  // Navigate to previous month
  const goToPrevious = () => {
    const newDate = new Date(currentDate);
    newDate.setMonth(currentDate.getMonth() - 1);
    setCurrentDate(newDate);
  };

  // Navigate to next month
  const goToNext = () => {
    const newDate = new Date(currentDate);
    newDate.setMonth(currentDate.getMonth() + 1);
    setCurrentDate(newDate);
  };

  // Navigate to today
  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Get current period label
  const getPeriodLabel = () => {
    return currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  // Check if date is today
  const isToday = (date) => {
    if (!date) return false;
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  };

  // Get color for activity type
  const getColorForType = (type) => {
    switch (type) {
      case 'workout':
        return '#3f51b5'; // blue
      case 'cardio':
        return '#4caf50'; // green
      case 'yoga':
      case 'stretch':
        return '#9c27b0'; // purple
      case 'hiit':
        return '#ed3f27'; // red/orange
      default:
        return '#3f51b5';
    }
  };

  const handleDayClick = (date) => {
    if (date && onDayClick) {
      onDayClick(date);
    }
  };

  const days = getMonthDays();

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
        </div>
      </div>

      <div className="calendar-grid monthly">
        {/* Day labels */}
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="calendar-day-label">{day}</div>
        ))}
        
        {/* Calendar days */}
        {days.map((date, index) => {
          const sessionTypes = date ? getSessionTypes(date) : [];
          const hasActivity = sessionTypes.length > 0;
          return (
            <div
              key={index}
              className={`calendar-day ${!date ? 'empty' : ''} ${isToday(date) ? 'today' : ''} ${hasActivity ? 'has-activity' : ''}`}
              onClick={() => handleDayClick(date)}
              style={{ cursor: date && hasActivity ? 'pointer' : 'default' }}
            >
              {date && (
                <>
                  <Box sx={{ position: 'relative', width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                    {hasActivity && (
                      <Box sx={{ 
                        position: 'absolute',
                        fontSize: { xs: '1.2rem', sm: '1.5rem' },
                        fontWeight: 700,
                        color: 'rgba(0, 0, 0, 0.15)',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)'
                      }}>
                        ✕
                      </Box>
                    )}
                    <span className="day-number">{date.getDate()}</span>
                    {sessionTypes.length > 0 && (
                      <Box 
                        display="flex" 
                        gap={0.25} 
                        justifyContent="center" 
                        alignItems="center"
                        sx={{ mt: 0.25 }}
                      >
                        {sessionTypes.map((type, idx) => (
                          <Box 
                            key={idx} 
                            sx={{ 
                              width: 6, 
                              height: 6, 
                              borderRadius: '50%', 
                              bgcolor: getColorForType(type)
                            }}
                          />
                        ))}
                      </Box>
                    )}
                  </Box>
                </>
              )}
            </div>
          );
        })}
      </div>

      <div className="calendar-legend">
        <div className="legend-item">
          <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#3f51b5' }} />
          <span>Workout</span>
        </div>
        <div className="legend-item">
          <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#4caf50' }} />
          <span>Cardio</span>
        </div>
        <div className="legend-item">
          <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#9c27b0' }} />
          <span>Yoga/Stretch</span>
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
  onDayClick: PropTypes.func,
};

export default Calendar;
