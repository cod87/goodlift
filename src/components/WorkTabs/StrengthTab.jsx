import { memo, useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Box } from '@mui/material';
import SavedWorkoutsList from './SavedWorkoutsList';
import WorkoutCreationModal from './WorkoutCreationModal';
import { saveSavedWorkout } from '../../utils/storage';
import { EXERCISES_DATA_PATH } from '../../utils/constants';

/**
 * StrengthTab - Simplified strength workout tab showing only saved workouts list
 * Features:
 * - List of saved workouts
 * - Create new workout button
 * - Edit existing workouts
 */
const StrengthTab = memo(({ 
  onStartWorkout,
}) => {
  const [showWorkoutCreator, setShowWorkoutCreator] = useState(false);
  const [exercises, setExercises] = useState([]);
  const [workoutListKey, setWorkoutListKey] = useState(0);
  const [editingWorkout, setEditingWorkout] = useState(null);
  const [editingIndex, setEditingIndex] = useState(null);

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
    setEditingWorkout(null);
    setEditingIndex(null);
    setShowWorkoutCreator(true);
  };

  const handleEditWorkout = (workout, index) => {
    setEditingWorkout(workout);
    setEditingIndex(index);
    setShowWorkoutCreator(true);
  };

  const handleSaveWorkout = async (workout) => {
    try {
      if (editingIndex !== null) {
        // Update existing workout
        const { updateSavedWorkout } = await import('../../utils/storage');
        await updateSavedWorkout(editingIndex, workout);
      } else {
        // Create new workout
        await saveSavedWorkout(workout);
      }
      // Force refresh the workout list
      setWorkoutListKey(prev => prev + 1);
      setEditingWorkout(null);
      setEditingIndex(null);
    } catch (error) {
      console.error('Error saving workout:', error);
    }
  };

  const handleCloseModal = () => {
    setShowWorkoutCreator(false);
    setEditingWorkout(null);
    setEditingIndex(null);
  };

  return (
    <Box>
      <SavedWorkoutsList 
        key={workoutListKey}
        onCreateWorkout={handleCreateWorkout}
        onStartWorkout={onStartWorkout}
        onEditWorkout={handleEditWorkout}
      />
      
      <WorkoutCreationModal
        open={showWorkoutCreator}
        onClose={handleCloseModal}
        onSave={handleSaveWorkout}
        exercises={exercises}
        existingWorkout={editingWorkout}
      />
    </Box>
  );
});

StrengthTab.displayName = 'StrengthTab';

StrengthTab.propTypes = {
  onStartWorkout: PropTypes.func,
};

export default StrengthTab;
