import PropTypes from 'prop-types';
import { formatTime } from '../utils/helpers';

const CompletionScreen = ({ workoutData, onFinish, onExportCSV }) => {
  return (
    <div className="screen completion-screen">
      <div className="completion-header">
        <h1>🎉 Workout Complete!</h1>
        <p className="completion-time">
          Total Time: <strong>{formatTime(workoutData.duration)}</strong>
        </p>
      </div>
      
      <div className="workout-summary-container">
        <h2>Workout Summary</h2>
        <div className="workout-summary">
          {Object.entries(workoutData.exercises).map(([exerciseName, data]) => (
            <div key={exerciseName} className="summary-exercise">
              <h3>{exerciseName}</h3>
              <div className="summary-sets">
                {data.sets.map((set, idx) => (
                  <div key={idx} className="summary-set">
                    <span className="set-label">Set {set.set}</span>
                    <span className="set-details">
                      {set.weight} lbs × {set.reps} reps
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <div className="completion-actions">
        <button onClick={onExportCSV} className="export-btn">
          📊 Download Workout Data (CSV)
        </button>
        <button onClick={onFinish} className="finish-btn">
          ✓ Finish
        </button>
      </div>
    </div>
  );
};

CompletionScreen.propTypes = {
  workoutData: PropTypes.object.isRequired,
  onFinish: PropTypes.func.isRequired,
  onExportCSV: PropTypes.func.isRequired,
};

export default CompletionScreen;
