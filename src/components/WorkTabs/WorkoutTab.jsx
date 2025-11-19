import { memo, useState } from 'react';
import PropTypes from 'prop-types';
import { Box } from '@mui/material';
import SavedWorkoutsList from './SavedWorkoutsList';

/**
 * WorkoutTab - Simplified workout tab showing only saved workouts list
 * Features:
 * - List of saved workouts
 * - Create new workout button
 */
const WorkoutTab = memo(({ 
  onNavigate,
  onStartWorkout,
}) => {
  const [showWorkoutCreator, setShowWorkoutCreator] = useState(false);

  const handleCreateWorkout = () => {
    // TODO: Open workout creation modal
    setShowWorkoutCreator(true);
    console.log('Create workout clicked - modal to be implemented');
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
        onCreateWorkout={handleCreateWorkout}
        onStartWorkout={onStartWorkout}
      />
    </Box>
  );
});

WorkoutTab.displayName = 'WorkoutTab';

WorkoutTab.propTypes = {
  onNavigate: PropTypes.func,
  onStartWorkout: PropTypes.func,
};

export default WorkoutTab;
