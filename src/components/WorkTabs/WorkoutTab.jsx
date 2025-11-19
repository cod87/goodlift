import { memo, useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Box } from '@mui/material';
import SavedWorkoutsList from './SavedWorkoutsList';
import WorkoutCreationModal from './WorkoutCreationModal';
import { saveSavedWorkout } from '../../utils/storage';
import { EXERCISES_DATA_PATH } from '../../utils/constants';

/**
 * WorkoutTab - Simplified workout tab showing only saved workouts list
 * Features:
 * - List of saved workouts
 * - Create new workout button
 */
const WorkoutTab = memo(({ 
  onStartWorkout,
}) => {
  const [showWorkoutCreator, setShowWorkoutCreator] = useState(false);
  const [exercises, setExercises] = useState([]);
  const [workoutListKey, setWorkoutListKey] = useState(0);

  // Load exercises data
  useEffect(() => {
    const loadExercises = async () => {
      try {
        const response = await fetch(EXERCISES_DATA_PATH);
        const data = await response.json();
        setExercises(data);
      } catch (error) {
        console.error('Error loading exercises:', error);
        setExercises([]);
      }
    };
    
    loadExercises();
  }, []);

  const handleCreateWorkout = () => {
    setShowWorkoutCreator(true);
  };

  const handleSaveWorkout = async (workout) => {
    try {
      await saveSavedWorkout(workout);
      // Force refresh the workout list
      setWorkoutListKey(prev => prev + 1);
    } catch (error) {
      console.error('Error saving workout:', error);
    }
  };

  return (
    <Box sx={{ 
      padding: { xs: 2, sm: 2, md: 3 },
      maxWidth: '1200px',
      margin: '0 auto',
      minHeight: 'calc(100vh - 60px)',
      paddingBottom: { xs: '80px', md: '2rem' },
    }}>
      <SavedWorkoutsList 
        key={workoutListKey}
        onCreateWorkout={handleCreateWorkout}
        onStartWorkout={onStartWorkout}
      />
      
      <WorkoutCreationModal
        open={showWorkoutCreator}
        onClose={() => setShowWorkoutCreator(false)}
        onSave={handleSaveWorkout}
        exercises={exercises}
      />
    </Box>
  );
});

WorkoutTab.displayName = 'WorkoutTab';

WorkoutTab.propTypes = {
  onStartWorkout: PropTypes.func,
};

export default WorkoutTab;
