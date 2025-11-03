import { getWorkoutHistory, getUserStats } from '../utils/storage';
import { formatDate, formatDuration } from '../utils/helpers';

const ProgressScreen = () => {
  const stats = getUserStats();
  const history = getWorkoutHistory();

  return (
    <div className="screen progress-screen">
      <h1>Your Progress</h1>
      
      <div className="stats-overview">
        <div className="stat-card">
          <h3>Total Workouts</h3>
          <p>{stats.totalWorkouts}</p>
        </div>
        <div className="stat-card">
          <h3>Total Time</h3>
          <p>{formatDuration(stats.totalTime)}</p>
        </div>
      </div>
      
      <div className="workout-history-container">
        <h2>Workout History</h2>
        <div className="workout-history-list">
          {history.length === 0 ? (
            <p>No workout history yet. Complete your first workout to see it here!</p>
          ) : (
            history.map((workout, idx) => (
              <div key={idx} className="workout-history-item">
                <h3>{workout.type} - {formatDate(workout.date)}</h3>
                <p>Duration: {formatDuration(workout.duration)}</p>
                <p>
                  Exercises: {Object.keys(workout.exercises).join(', ')}
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default ProgressScreen;
