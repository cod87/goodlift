import { useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import '../styles/Calendar.css';

const Calendar = ({ workoutDates }) => {
  const [viewMode, setViewMode] = useState('monthly'); // 'monthly' or 'weekly'
  const [currentDate, setCurrentDate] = useState(new Date());

  // Create a set of workout dates for quick lookup (format: YYYY-MM-DD)
  const workoutDateSet = useMemo(() => {
    const dateSet = new Set();
    workoutDates.forEach(date => {
      const d = new Date(date);
      const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      dateSet.add(dateStr);
    });
    return dateSet;
  }, [workoutDates]);

  // Check if a date has a workout
  const hasWorkout = (date) => {
    const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    return workoutDateSet.has(dateStr);
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
        {days.map((date, index) => (
          <div
            key={index}
            className={`calendar-day ${!date ? 'empty' : ''} ${isToday(date) ? 'today' : ''} ${date && hasWorkout(date) ? 'workout-day' : ''}`}
          >
            {date && (
              <>
                <span className="day-number">{date.getDate()}</span>
                {hasWorkout(date) && <div className="workout-indicator">●</div>}
              </>
            )}
          </div>
        ))}
      </div>

      <div className="calendar-legend">
        <div className="legend-item">
          <span className="legend-dot workout">●</span>
          <span>Workout Day</span>
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
  workoutDates: PropTypes.arrayOf(PropTypes.string).isRequired,
};

export default Calendar;
