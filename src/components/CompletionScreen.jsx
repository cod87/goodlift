import PropTypes from 'prop-types';
import { formatTime } from '../utils/helpers';

const CompletionScreen = ({ workoutData, onFinish, onExportCSV }) => {
  return (
    <div className="screen completion-screen">
      <h1>Workout Complete!</h1>
      <p>Total Time: <strong>{formatTime(workoutData.duration)}</strong></p>
      
      <h2>Workout Summary</h2>
      <div className="workout-summary">
        {Object.entries(workoutData.exercises).map(([exerciseName, data]) => (
          <div key={exerciseName} className="summary-exercise">
            <h3>{exerciseName}</h3>
            {data.sets.map((set, idx) => (
              <div key={idx} className="summary-set">
                Set {set.set}: {set.weight} lbs × {set.reps} reps
              </div>
            ))}
          </div>
        ))}
      </div>
      
      <button onClick={onExportCSV}>Download Workout Data (CSV)</button>
      <button onClick={onFinish}>Finish</button>
    </div>
  );
};

CompletionScreen.propTypes = {
  workoutData: PropTypes.object.isRequired,
  onFinish: PropTypes.func.isRequired,
  onExportCSV: PropTypes.func.isRequired,
};

export default CompletionScreen;
