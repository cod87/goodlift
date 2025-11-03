import { useState, useEffect } from "react";
import './App.css';
import Navigation from './components/Navigation';
import Sidebar from './components/Sidebar';
import WorkoutScreen from './components/WorkoutScreen';
import CompletionScreen from './components/CompletionScreen';
import ProgressScreen from './components/ProgressScreen';
import AuthScreen from './components/AuthScreen';
import { useWorkoutGenerator } from './hooks/useWorkoutGenerator';
import { saveWorkout, saveUserStats, getUserStats, setExerciseWeight } from './utils/storage';
import { SETS_PER_EXERCISE } from './utils/constants';
import { useAuth } from './contexts/AuthContext';

function App() {
  const [currentScreen, setCurrentScreen] = useState('selection');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [currentWorkout, setCurrentWorkout] = useState([]);
  const [workoutType, setWorkoutType] = useState('');
  const [completedWorkoutData, setCompletedWorkoutData] = useState(null);
  const [loading, setLoading] = useState(false);
  const { currentUser } = useAuth();

  const { generateWorkout, allExercises } = useWorkoutGenerator();

  const handleNavigate = (screen) => {
    setCurrentScreen(screen);
    if (screen === 'selection') {
      setSidebarOpen(true);
    } else {
      setSidebarOpen(false);
    }
  };

  const handleStartWorkout = (type, equipmentFilter) => {
    setLoading(true);
    
    // Simulate loading to show user we're generating
    setTimeout(() => {
      const workout = generateWorkout(type, equipmentFilter);
      setCurrentWorkout(workout);
      setWorkoutType(type);
      setLoading(false);
      setSidebarOpen(false);
      
      // Small delay before transitioning to workout screen
      setTimeout(() => {
        setCurrentScreen('workout');
      }, 300);
    }, 500);
  };

  const handleWorkoutComplete = async (workoutData) => {
    // Save exercise weights
    for (const [exerciseName, data] of Object.entries(workoutData.exercises)) {
      const lastSet = data.sets[data.sets.length - 1];
      if (lastSet.weight > 0) {
        await setExerciseWeight(exerciseName, lastSet.weight);
        
        // Check for weight progression
        const allSetsMetProgression = data.sets.every(set => set.reps >= 12);
        if (allSetsMetProgression && data.sets.length >= SETS_PER_EXERCISE) {
          const exercise = currentWorkout.find(ex => ex['Exercise Name'] === exerciseName);
          if (exercise) {
            const primaryMuscle = exercise['Primary Muscle'].split('(')[0].trim();
            const equipment = exercise['Equipment'];
            let weightIncrease = 0;

            const isLowerBody = ['Quadriceps', 'Hamstrings', 'Glutes', 'Calves'].includes(primaryMuscle);
            const isUpperBody = ['Chest', 'Back', 'Shoulders', 'Biceps', 'Triceps'].includes(primaryMuscle);

            if (isUpperBody) {
              weightIncrease = equipment.includes('Dumbbell') || equipment.includes('Kettlebell') ? 5 : 2.5;
            } else if (isLowerBody) {
              weightIncrease = equipment.includes('Dumbbell') || equipment.includes('Kettlebell') ? 10 : 5;
            }

            if (weightIncrease > 0) {
              await setExerciseWeight(exerciseName, lastSet.weight + weightIncrease);
            }
          }
        }
      }
    }

    // Update workout data with correct type
    const finalWorkoutData = { ...workoutData, type: workoutType };
    
    // Save workout
    await saveWorkout(finalWorkoutData);
    
    // Update stats
    const stats = await getUserStats();
    stats.totalWorkouts += 1;
    stats.totalTime += workoutData.duration;
    await saveUserStats(stats);
    
    setCompletedWorkoutData(finalWorkoutData);
    setCurrentScreen('completion');
  };

  const handleWorkoutExit = () => {
    setCurrentScreen('selection');
    setSidebarOpen(true);
  };

  const handleFinish = () => {
    setCurrentScreen('selection');
    setSidebarOpen(true);
  };

  const handleExportCSV = () => {
    if (!completedWorkoutData) return;

    const headers = ['Date', 'WorkoutType', 'Duration', 'Exercise', 'Set', 'Weight', 'Reps'];
    let csvContent = "data:text/csv;charset=utf-8," + headers.join(',') + '\n';
    
    for (const exerciseName in completedWorkoutData.exercises) {
      const exerciseData = completedWorkoutData.exercises[exerciseName];
      exerciseData.sets.forEach(set => {
        const row = [
          new Date(completedWorkoutData.date).toLocaleString(),
          completedWorkoutData.type,
          completedWorkoutData.duration,
          exerciseName,
          set.set,
          set.weight,
          set.reps,
        ];
        csvContent += row.join(',') + '\n';
      });
    }
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `GoodLift_Workout_${new Date(completedWorkoutData.date).toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Close sidebar when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      const sidebar = document.querySelector('.filter-sidebar');
      const navWorkout = document.querySelector('.nav-links button:first-child');
      
      if (sidebar && !sidebar.contains(e.target) && navWorkout && !navWorkout.contains(e.target) && sidebarOpen && currentScreen === 'selection') {
        setSidebarOpen(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [sidebarOpen, currentScreen]);

  // Show auth screen if user is not logged in
  if (!currentUser) {
    return <AuthScreen />;
  }

  return (
    <div>
      <Navigation currentScreen={currentScreen} onNavigate={handleNavigate} />
      
      <Sidebar
        isOpen={sidebarOpen && currentScreen === 'selection'}
        onStartWorkout={handleStartWorkout}
        allExercises={allExercises}
      />
      
      <div id="app" className={sidebarOpen && currentScreen === 'selection' ? 'sidebar-open' : ''}>
        {currentScreen === 'selection' && (
          <div className="screen selection-screen">
            {loading && (
              <div id="loading-indicator">
                <i className="fas fa-spinner fa-spin"></i> Generating workout...
              </div>
            )}
          </div>
        )}
        
        {currentScreen === 'workout' && currentWorkout.length > 0 && (
          <WorkoutScreen
            workoutPlan={currentWorkout}
            onComplete={handleWorkoutComplete}
            onExit={handleWorkoutExit}
          />
        )}
        
        {currentScreen === 'completion' && completedWorkoutData && (
          <CompletionScreen
            workoutData={completedWorkoutData}
            onFinish={handleFinish}
            onExportCSV={handleExportCSV}
          />
        )}
        
        {currentScreen === 'progress' && <ProgressScreen />}
      </div>
    </div>
  );
}

export default App;