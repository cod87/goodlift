import { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { formatTime, getYoutubeEmbedUrl } from '../utils/helpers';
import { getExerciseWeight } from '../utils/storage';
import { SETS_PER_EXERCISE } from '../utils/constants';

const WorkoutScreen = ({ workoutPlan, onComplete, onExit }) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [workoutData, setWorkoutData] = useState([]);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [prevWeight, setPrevWeight] = useState(0);
  const startTimeRef = useRef(null);
  const timerRef = useRef(null);

  // Generate workout sequence (supersets)
  const workoutSequence = [];
  for (let i = 0; i < 4; i++) {
    const ex1 = workoutPlan[i * 2];
    const ex2 = workoutPlan[i * 2 + 1];
    if (!ex1 || !ex2) continue;
    for (let set = 1; set <= SETS_PER_EXERCISE; set++) {
      workoutSequence.push({ exercise: ex1, setNumber: set });
      workoutSequence.push({ exercise: ex2, setNumber: set });
    }
  }

  // Start timer on mount
  useEffect(() => {
    startTimeRef.current = Date.now();
    timerRef.current = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
      setElapsedTime(elapsed);
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  // Load previous weight when current step changes
  useEffect(() => {
    const loadPrevWeight = async () => {
      if (currentStep?.exercise?.['Exercise Name']) {
        const weight = await getExerciseWeight(currentStep.exercise['Exercise Name']);
        setPrevWeight(weight);
      }
    };
    loadPrevWeight();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStepIndex]);

  const currentStep = workoutSequence[currentStepIndex];
  const exerciseName = currentStep?.exercise?.['Exercise Name'];

  const handleNext = (e) => {
    e.preventDefault();
    const form = e.target.closest('form') || document.querySelector('form');
    const weightSelect = form.querySelector('#weight-select');
    const repsSelect = form.querySelector('#reps-select');
    
    const weight = parseFloat(weightSelect.value) || 0;
    const reps = parseInt(repsSelect.value) || 0;

    const newData = {
      exerciseName: currentStep.exercise['Exercise Name'],
      setNumber: currentStep.setNumber,
      weight,
      reps,
    };

    setWorkoutData(prev => [...prev, newData]);
    
    if (currentStepIndex + 1 >= workoutSequence.length) {
      // Workout complete
      const totalTime = Math.floor((Date.now() - startTimeRef.current) / 1000);
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      
      const finalData = {
        date: new Date().toISOString(),
        type: workoutPlan[0]?.['Primary Muscle'] || 'unknown',
        duration: totalTime,
        exercises: {},
      };
      
      [...workoutData, newData].forEach(step => {
        const { exerciseName: exName, setNumber, weight: w, reps: r } = step;
        if (!finalData.exercises[exName]) {
          finalData.exercises[exName] = { sets: [] };
        }
        finalData.exercises[exName].sets.push({ set: setNumber, weight: w, reps: r });
      });
      
      onComplete(finalData);
    } else {
      setCurrentStepIndex(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1);
      setWorkoutData(prev => prev.slice(0, -1));
    }
  };

  const handleExit = () => {
    if (window.confirm('Are you sure you want to exit? Your progress will not be saved.')) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      onExit();
    }
  };

  if (!currentStep) {
    return null;
  }

  // Generate weight options
  const weightOptions = [];
  weightOptions.push(<option key="0" value="0">0 lbs</option>);
  for (let i = 2.5; i <= 500; i += 2.5) {
    weightOptions.push(
      <option key={i} value={i}>
        {i} lbs
      </option>
    );
  }

  // Generate reps options
  const repsOptions = [];
  for (let i = 1; i <= 12; i++) {
    repsOptions.push(
      <option key={i} value={i}>
        {i}
      </option>
    );
  }

  return (
    <div className="screen">
      <div className="workout-header">
        <span>{formatTime(elapsedTime)}</span>
        <span>Exercise {currentStepIndex + 1} / {workoutSequence.length}</span>
      </div>
      
      <div className="exercise-card-container">
        <form onSubmit={handleNext}>
          <div className="exercise-card">
            <h2>{exerciseName}</h2>
            <div className="youtube-embed">
              <iframe
                src={getYoutubeEmbedUrl(currentStep.exercise['YouTube_Demonstration_Link'])}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            </div>
            <p className="set-info">Set {currentStep.setNumber} of {SETS_PER_EXERCISE}</p>
            {prevWeight > 0 && (
              <p className="prev-weight">Last time: {prevWeight} lbs</p>
            )}
            <div className="input-row">
              <div className="input-group">
                <label htmlFor="weight-select">Weight (lbs)</label>
                <select id="weight-select" className="exercise-select" defaultValue={prevWeight || 0}>
                  {weightOptions}
                </select>
              </div>
              <div className="input-group">
                <label htmlFor="reps-select">Reps</label>
                <select id="reps-select" className="exercise-select" defaultValue={8}>
                  {repsOptions}
                </select>
              </div>
            </div>
            <div className="workout-nav-buttons">
              {currentStepIndex > 0 && (
                <button type="button" className="back-btn" onClick={handleBack}>
                  ← Back
                </button>
              )}
              <button type="submit" className="next-btn">
                Next →
              </button>
            </div>
          </div>
        </form>
      </div>
      
      <div className="workout-controls">
        <button className="exit-workout-btn" onClick={handleExit}>
          Exit Workout
        </button>
      </div>
    </div>
  );
};

WorkoutScreen.propTypes = {
  workoutPlan: PropTypes.array.isRequired,
  onComplete: PropTypes.func.isRequired,
  onExit: PropTypes.func.isRequired,
};

export default WorkoutScreen;
