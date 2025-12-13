import { useState } from 'react';
import { Box, Container } from '@mui/material';
import ExerciseCard from '../components/Workout/ExerciseCard';
import { getDemoImagePath } from '../utils/exerciseDemoImages';

/**
 * Demo page for the revamped ExerciseCard component
 * Shows the new layout with all features including demo images
 */
const ExerciseCardDemo = () => {
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);

  const exerciseName = 'Dumbbell Incline Bench Press';
  // Use the webp file specified in exercises.json for this exercise
  const webpFile = 'incline-dumbbell-bench-press.webp';
  const primaryMuscle = 'Chest';
  const secondaryMuscles = 'Front Delts, Triceps';
  const demoImage = getDemoImagePath(exerciseName, true, webpFile, primaryMuscle, secondaryMuscles);

  // Simulate timer
  useState(() => {
    const interval = setInterval(() => {
      setElapsedTime(prev => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleSubmit = (data) => {
    console.log('Set logged:', data);
    alert(`Set logged: ${data.weight} lbs × ${data.reps} reps`);
  };

  const handleSkip = () => {
    alert('Skip exercise clicked');
  };

  const handleSwap = () => {
    alert('Swap exercise clicked');
  };

  const handlePartialComplete = () => {
    alert('Partial complete clicked');
  };

  const handleExit = () => {
    alert('Exit clicked');
  };

  const handleToggleFavorite = () => {
    setIsFavorite(!isFavorite);
  };

  return (
    <Container maxWidth={false} disableGutters sx={{ height: '100vh', overflow: 'hidden' }}>
      <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        {/* Bottom navigation placeholder */}
        <Box sx={{ 
          position: 'fixed', 
          bottom: 0, 
          left: 0, 
          right: 0, 
          height: '60px', 
          bgcolor: 'primary.main', 
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontWeight: 600,
        }}>
          Bottom Navigation (60px)
        </Box>

        {/* ExerciseCard */}
        <Box sx={{ flex: 1, overflow: 'auto', pb: '60px' }}>
          <ExerciseCard
            exerciseName={exerciseName}
            demoImage={demoImage}
            setNumber={2}
            totalSets={3}
            lastWeight={65}
            lastReps={8}
            suggestedWeight={67.5}
            suggestedReps={8}
            showSuggestions={true}
            onSubmit={handleSubmit}
            showBack={true}
            // New props
            elapsedTime={elapsedTime}
            currentStep={5}
            totalSteps={24}
            isFavorite={isFavorite}
            onToggleFavorite={handleToggleFavorite}
            onSkip={handleSkip}
            onSwap={handleSwap}
            onPartialComplete={handlePartialComplete}
            onExit={handleExit}
            showPartialComplete={true}
            // Muscle data for SVG generation
            primaryMuscle={primaryMuscle}
            secondaryMuscles={secondaryMuscles}
            webpFile={webpFile}
          />
        </Box>
      </Box>
    </Container>
  );
};

export default ExerciseCardDemo;
