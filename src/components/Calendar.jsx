import { useState, useMemo, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Box } from '@mui/material';
import '../styles/Calendar.css';

const Calendar = ({ workoutSessions = [], onDayClick, viewMode = 'weekly' }) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  // Reset to current week/month when viewMode changes
  useEffect(() => {
    setCurrentDate(new Date());
  }, [viewMode]);

  // Create a map of dates to session info for quick lookup
  const workoutDateMap = useMemo(() => {
    const dateMap = new Map();
    workoutSessions.forEach(session => {
      const d = new Date(session.date);
      const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      if (!dateMap.has(dateStr)) {
        dateMap.set(dateStr, { sessions: [], durations: {} });
      }
      const dayData = dateMap.get(dateStr);
      dayData.sessions.push(session);
      // Track duration for each type to determine which to show if multiple non-workout sessions
      if (!dayData.durations[session.type]) {
        dayData.durations[session.type] = 0;
      }
      dayData.durations[session.type] += session.duration || 0;
    });
    return dateMap;
  }, [workoutSessions]);

  // Get session info for a date
  const getSessionInfo = (date) => {
    const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    return workoutDateMap.get(dateStr) || { sessions: [], durations: {} };
  };

  // Get days for weekly view
  const getWeekDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const date = currentDate.getDate();
    
    // Get the current day of week (0 = Sunday, 6 = Saturday)
    const currentDay = new Date(year, month, date).getDay();
    
    // Calculate the start of the week (Sunday)
    const startOfWeek = new Date(year, month, date - currentDay);
    
    const days = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      days.push(day);
    }
    
    return days;
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

  // Navigate to previous period (week or month)
  const goToPrevious = () => {
    const newDate = new Date(currentDate);
    if (viewMode === 'weekly') {
      newDate.setDate(currentDate.getDate() - 7);
    } else {
      newDate.setMonth(currentDate.getMonth() - 1);
    }
    setCurrentDate(newDate);
  };

  // Navigate to next period (week or month)
  const goToNext = () => {
    const newDate = new Date(currentDate);
    if (viewMode === 'weekly') {
      newDate.setDate(currentDate.getDate() + 7);
    } else {
      newDate.setMonth(currentDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
  };

  // Navigate to today
  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Get current period label
  const getPeriodLabel = () => {
    if (viewMode === 'weekly') {
      const weekDays = getWeekDays();
      const startDate = weekDays[0];
      const endDate = weekDays[6];
      
      // If same month
      if (startDate.getMonth() === endDate.getMonth()) {
        return `${startDate.toLocaleDateString('en-US', { month: 'long' })} ${startDate.getDate()}-${endDate.getDate()}, ${startDate.getFullYear()}`;
      } else {
        // Different months
        return `${startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}, ${endDate.getFullYear()}`;
      }
    }
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
      if (sessions.some(s => s.type === 'stretch')) {
        bookmarks.push('stretch');
      }
      return { 
        icon: workoutSession.type, // 'upper', 'lower', or 'full'
        bookmarks 
      };
    }

    // No workout session - determine which to show based on duration
    const hasCardio = sessions.some(s => s.type === 'cardio' || s.type === 'hiit');
    const hasStretch = sessions.some(s => s.type === 'stretch');
    
    if (hasCardio && hasStretch) {
      // Show longer one, bookmark the other
      const cardioDuration = (sessionInfo.durations.cardio || 0) + (sessionInfo.durations.hiit || 0);
      const stretchDuration = (sessionInfo.durations.stretch || 0);
      
      if (cardioDuration >= stretchDuration) {
        return { icon: 'cardio', bookmarks: ['stretch'] };
      } else {
        return { icon: 'stretch', bookmarks: ['cardio'] };
      }
    } else if (hasCardio) {
      return { icon: 'cardio', bookmarks: [] };
    } else if (hasStretch) {
      return { icon: 'stretch', bookmarks: [] };
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
      case 'stretch':
        return `${basePath}stretch-calendaricon.svg`;
      default:
        return null;
    }
  };

  // Get bookmark color
  const getBookmarkColor = (type) => {
    switch (type) {
      case 'cardio':
        return '#2196f3'; // light blue
      case 'stretch':
        return '#4caf50'; // green
      default:
        return '#ccc';
    }
  };

  const handleDayClick = (date) => {
    if (date && onDayClick) {
      onDayClick(date);
    }
  };
  
  const handleKeyDown = (event, date) => {
    // Support keyboard navigation
    if ((event.key === 'Enter' || event.key === ' ') && date && onDayClick) {
      event.preventDefault();
      onDayClick(date);
    }
  };

  const days = viewMode === 'weekly' ? getWeekDays() : getMonthDays();

  return (
    <Box 
      sx={{ 
        width: '100%', 
        bgcolor: 'background.paper', 
        borderRadius: 2, 
        p: 2,
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}
      role="region"
      aria-label="Workout calendar"
    >
      <div className="calendar-header">
        <div className="calendar-controls">
          <button 
            onClick={goToPrevious} 
            className="calendar-nav-btn"
            aria-label={viewMode === 'weekly' ? 'Previous week' : 'Previous month'}
          >
            ←
          </button>
          <h3 className="calendar-period" id="calendar-month-label">{getPeriodLabel()}</h3>
          <button 
            onClick={goToNext} 
            className="calendar-nav-btn"
            aria-label={viewMode === 'weekly' ? 'Next week' : 'Next month'}
          >
            →
          </button>
        </div>
        <div className="calendar-actions">
          <button 
            onClick={goToToday} 
            className="calendar-today-btn"
            aria-label="Go to today"
          >
            Today
          </button>
        </div>
      </div>

      <div 
        className={`calendar-grid ${viewMode === 'weekly' ? 'weekly' : 'monthly'}`}
        role="grid"
        aria-labelledby="calendar-month-label"
      >
        {/* Day labels */}
        {viewMode === 'weekly' ? (
          // Weekly view - show full day names
          ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(day => (
            <div key={day} className="calendar-day-label" role="columnheader">{day}</div>
          ))
        ) : (
          // Monthly view - show abbreviated day names
          ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="calendar-day-label" role="columnheader">{day}</div>
          ))
        )}
        
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
              onKeyDown={(e) => handleKeyDown(e, date)}
              role="gridcell"
              tabIndex={date && hasActivity ? 0 : -1}
              aria-label={date ? `${date.toLocaleDateString()}, ${hasActivity ? `${sessionInfo.sessions.length} workout${sessionInfo.sessions.length > 1 ? 's' : ''}` : 'no workouts'}` : ''}
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
                    
                    {/* Icon for main session - centered */}
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
                            opacity: (() => {
                              // Check if any session on this date is completed
                              const hasCompleted = sessionInfo.sessions.some(s => s.status === 'completed');
                              const hasPlanned = sessionInfo.sessions.some(s => s.status === 'planned');
                              // Show full opacity for completed, grey (0.5) for upcoming planned
                              if (hasCompleted) return 0.8;
                              if (hasPlanned) return 0.5;
                              return 0.8; // Default for other statuses
                            })(),
                            filter: (() => {
                              const hasCompleted = sessionInfo.sessions.some(s => s.status === 'completed');
                              if (!hasCompleted && sessionInfo.sessions.some(s => s.status === 'planned')) {
                                return 'grayscale(1)';
                              }
                              return 'none';
                            })(),
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
          <img src={`${import.meta.env.BASE_URL}icons/fullbody-calendaricon.svg`} alt="" aria-hidden="true" style={{ width: '16px', height: '16px' }} />
          <span>Full Body</span>
        </div>
        <div className="legend-item">
          <img src={`${import.meta.env.BASE_URL}icons/upperbody-calendaricon.svg`} alt="" aria-hidden="true" style={{ width: '16px', height: '16px' }} />
          <span>Upper Body</span>
        </div>
        <div className="legend-item">
          <img src={`${import.meta.env.BASE_URL}icons/lowerbody-calendaricon.svg`} alt="" aria-hidden="true" style={{ width: '16px', height: '16px' }} />
          <span>Lower Body</span>
        </div>
        <div className="legend-item">
          <img src={`${import.meta.env.BASE_URL}icons/cardio-calendaricon.svg`} alt="" aria-hidden="true" style={{ width: '16px', height: '16px' }} />
          <span>Cardio</span>
        </div>
        <div className="legend-item">
          <img src={`${import.meta.env.BASE_URL}icons/stretch-calendaricon.svg`} alt="" aria-hidden="true" style={{ width: '16px', height: '16px' }} />
          <span>Mobility</span>
        </div>
        <div className="legend-item">
          <Box sx={{
            width: '8px',
            height: '12px',
            backgroundColor: '#2196f3',
            borderRadius: '0 0 2px 2px',
            clipPath: 'polygon(0 0, 100% 0, 100% 80%, 50% 60%, 0 80%)',
          }} 
          aria-hidden="true"
          />
          <span>Additional Sessions</span>
        </div>
      </div>
    </Box>
  );
};

Calendar.propTypes = {
  workoutSessions: PropTypes.arrayOf(
    PropTypes.shape({
      date: PropTypes.number.isRequired,
      type: PropTypes.string.isRequired,
      duration: PropTypes.number,
      status: PropTypes.string,
    })
  ),
  onDayClick: PropTypes.func,
  viewMode: PropTypes.oneOf(['weekly', 'monthly']),
};

export default Calendar;
