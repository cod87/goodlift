import { useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import { Box } from '@mui/material';
import '../styles/Calendar.css';

const Calendar = ({ workoutSessions = [], scheduledWorkouts = [], onDayClick }) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  // Create a map of dates to session info for quick lookup
  const workoutDateMap = useMemo(() => {
    const dateMap = new Map();
    workoutSessions.forEach(session => {
      const d = new Date(session.date);
      const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      if (!dateMap.has(dateStr)) {
        dateMap.set(dateStr, { sessions: [], durations: {}, scheduled: null });
      }
      const dayData = dateMap.get(dateStr);
      dayData.sessions.push(session);
      // Track duration for each type to determine which to show if multiple non-workout sessions
      if (!dayData.durations[session.type]) {
        dayData.durations[session.type] = 0;
      }
      dayData.durations[session.type] += session.duration || 0;
    });
    
    // Add scheduled workouts
    scheduledWorkouts.forEach(scheduled => {
      const dateStr = scheduled.date;
      if (!dateMap.has(dateStr)) {
        dateMap.set(dateStr, { sessions: [], durations: {}, scheduled: null });
      }
      const dayData = dateMap.get(dateStr);
      dayData.scheduled = scheduled;
    });
    
    return dateMap;
  }, [workoutSessions, scheduledWorkouts]);

  // Get session info for a date
  const getSessionInfo = (date) => {
    const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    return workoutDateMap.get(dateStr) || { sessions: [], durations: {}, scheduled: null };
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

  // Determine which icon to display and which bookmarks to show
  const getDisplayInfo = (sessionInfo) => {
    const { sessions } = sessionInfo;
    if (sessions.length === 0) return { icon: null, bookmarks: [] };

    // Check if there's any workout session
    const workoutSession = sessions.find(s => s.type === 'upper' || s.type === 'lower' || s.type === 'full');
    
    if (workoutSession) {
      // Show workout icon, add bookmarks for other session types
      const bookmarks = [];
      if (sessions.some(s => s.type === 'cardio' || s.type === 'hiit')) {
        bookmarks.push('cardio');
      }
      if (sessions.some(s => s.type === 'yoga' || s.type === 'stretch')) {
        bookmarks.push('yoga');
      }
      return { 
        icon: workoutSession.type, // 'upper', 'lower', or 'full'
        bookmarks 
      };
    }

    // No workout session - determine which to show based on duration
    const hasCardio = sessions.some(s => s.type === 'cardio' || s.type === 'hiit');
    const hasYoga = sessions.some(s => s.type === 'yoga' || s.type === 'stretch');
    
    if (hasCardio && hasYoga) {
      // Show longer one, bookmark the other
      const cardioDuration = (sessionInfo.durations.cardio || 0) + (sessionInfo.durations.hiit || 0);
      const yogaDuration = (sessionInfo.durations.yoga || 0) + (sessionInfo.durations.stretch || 0);
      
      if (cardioDuration >= yogaDuration) {
        return { icon: 'cardio', bookmarks: ['yoga'] };
      } else {
        return { icon: 'yoga', bookmarks: ['cardio'] };
      }
    } else if (hasCardio) {
      return { icon: 'cardio', bookmarks: [] };
    } else if (hasYoga) {
      return { icon: 'yoga', bookmarks: [] };
    }

    return { icon: null, bookmarks: [] };
  };

  // Get icon path for session type
  const getIconPath = (type) => {
    const basePath = `${import.meta.env.BASE_URL}icons/`;
    switch (type) {
      case 'upper':
        return `${basePath}upperbody-calendaricon.svg`;
      case 'lower':
        return `${basePath}lowerbody-calendaricon.svg`;
      case 'full':
        return `${basePath}fullbody-calendaricon.svg`;
      case 'cardio':
        return `${basePath}cardio-calendaricon.svg`;
      case 'yoga':
        return `${basePath}yoga-calendaricon.svg`;
      default:
        return null;
    }
  };

  // Get bookmark color
  const getBookmarkColor = (type) => {
    switch (type) {
      case 'cardio':
        return '#2196f3'; // light blue
      case 'yoga':
        return '#9c27b0'; // purple
      default:
        return '#ccc';
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
          const sessionInfo = date ? getSessionInfo(date) : { sessions: [], durations: {} };
          const hasActivity = sessionInfo.sessions.length > 0;
          const displayInfo = hasActivity ? getDisplayInfo(sessionInfo) : { icon: null, bookmarks: [] };
          
          return (
            <div
              key={index}
              className={`calendar-day ${!date ? 'empty' : ''} ${isToday(date) ? 'today' : ''} ${hasActivity ? 'has-activity' : ''}`}
              onClick={() => handleDayClick(date)}
              style={{ cursor: date && hasActivity ? 'pointer' : 'default' }}
            >
              {date && (
                <>
                  <Box sx={{ 
                    position: 'relative', 
                    width: '100%', 
                    height: '100%', 
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'center', 
                    justifyContent: 'center' 
                  }}>
                    {/* Day number at top left */}
                    <span className="day-number">
                      {date.getDate()}
                    </span>
                    
                    {/* Icon for scheduled workout (if exists and not completed) */}
                    {sessionInfo.scheduled && sessionInfo.scheduled.status !== 'completed' && (
                      <Box sx={{ 
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '100%',
                        height: '100%',
                      }}>
                        <img 
                          src={getIconPath(sessionInfo.scheduled.type)} 
                          alt={sessionInfo.scheduled.type}
                          style={{ 
                            width: '40px', 
                            height: '40px',
                            opacity: 0.5,
                            filter: 'grayscale(100%)',
                          }}
                        />
                      </Box>
                    )}
                    
                    {/* Icon for main session - centered (completed workouts) */}
                    {displayInfo.icon && (
                      <Box sx={{ 
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '100%',
                        height: '100%',
                      }}>
                        <img 
                          src={getIconPath(displayInfo.icon)} 
                          alt={displayInfo.icon}
                          style={{ 
                            width: '40px', 
                            height: '40px',
                            opacity: 0.8,
                          }}
                        />
                      </Box>
                    )}
                    
                    {/* Bookmarks for additional session types */}
                    {displayInfo.bookmarks.length > 0 && (
                      <Box sx={{
                        position: 'absolute',
                        top: '2px',
                        right: '2px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '2px',
                        zIndex: 1,
                      }}>
                        {displayInfo.bookmarks.map((bookmarkType, idx) => (
                          <Box
                            key={idx}
                            sx={{
                              width: '8px',
                              height: '12px',
                              backgroundColor: getBookmarkColor(bookmarkType),
                              borderRadius: '0 0 2px 2px',
                              clipPath: 'polygon(0 0, 100% 0, 100% 80%, 50% 60%, 0 80%)',
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
          <img src={`${import.meta.env.BASE_URL}icons/fullbody-calendaricon.svg`} alt="Full Body" style={{ width: '16px', height: '16px' }} />
          <span>Full Body</span>
        </div>
        <div className="legend-item">
          <img src={`${import.meta.env.BASE_URL}icons/upperbody-calendaricon.svg`} alt="Upper Body" style={{ width: '16px', height: '16px' }} />
          <span>Upper Body</span>
        </div>
        <div className="legend-item">
          <img src={`${import.meta.env.BASE_URL}icons/lowerbody-calendaricon.svg`} alt="Lower Body" style={{ width: '16px', height: '16px' }} />
          <span>Lower Body</span>
        </div>
        <div className="legend-item">
          <img src={`${import.meta.env.BASE_URL}icons/cardio-calendaricon.svg`} alt="Cardio" style={{ width: '16px', height: '16px' }} />
          <span>Cardio</span>
        </div>
        <div className="legend-item">
          <img src={`${import.meta.env.BASE_URL}icons/yoga-calendaricon.svg`} alt="Mobility" style={{ width: '16px', height: '16px' }} />
          <span>Mobility</span>
        </div>
        <div className="legend-item">
          <Box sx={{
            width: '8px',
            height: '12px',
            backgroundColor: '#2196f3',
            borderRadius: '0 0 2px 2px',
            clipPath: 'polygon(0 0, 100% 0, 100% 80%, 50% 60%, 0 80%)',
          }} />
          <span>Additional Sessions</span>
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
      duration: PropTypes.number,
    })
  ),
  scheduledWorkouts: PropTypes.arrayOf(
    PropTypes.shape({
      date: PropTypes.string.isRequired,
      type: PropTypes.string.isRequired,
      status: PropTypes.string,
      name: PropTypes.string,
    })
  ),
  onDayClick: PropTypes.func,
};

export default Calendar;
