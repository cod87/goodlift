import { useState, useEffect } from "react";
import './App.css';
import NavigationSidebar from './components/NavigationSidebar';
import WorkoutScreen from './components/WorkoutScreen';
import WorkoutPreview from './components/WorkoutPreview';
import CompletionScreen from './components/CompletionScreen';
import ProgressScreen from './components/ProgressScreen';
import HiitTimerScreen from './components/HiitTimerScreen';
import AuthScreen from './components/AuthScreen';
import { useWorkoutGenerator } from './hooks/useWorkoutGenerator';
import { saveWorkout, saveUserStats, getUserStats, setExerciseWeight, getExerciseTargetReps } from './utils/storage';
import { SETS_PER_EXERCISE } from './utils/constants';
import { useAuth } from './contexts/AuthContext';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Snackbar, Alert } from '@mui/material';

// Create custom theme matching app colors
const theme = createTheme({
  palette: {
    primary: {
      main: 'rgb(19, 70, 134)', // Blue
      dark: 'rgb(15, 56, 107)',
    },
    secondary: {
      main: 'rgb(237, 63, 39)', // Red/Orange
      dark: 'rgb(189, 50, 31)',
    },
    warning: {
      main: 'rgb(254, 178, 26)', // Yellow
    },
    background: {
      default: 'rgb(253, 244, 227)', // Cream
      paper: '#FFFFFF',
    },
    text: {
      primary: 'rgb(19, 70, 134)',
      secondary: 'rgb(237, 63, 39)',
    },
  },
  typography: {
    fontFamily: "'Poppins', sans-serif",
    h1: {
      fontFamily: "'Ubuntu', sans-serif",
    },
    h2: {
      fontFamily: "'Ubuntu', sans-serif",
    },
    h3: {
      fontFamily: "'Ubuntu', sans-serif",
    },
  },
});

function App() {
  const [currentScreen, setCurrentScreen] = useState('progress');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentWorkout, setCurrentWorkout] = useState([]);
  const [workoutType, setWorkoutType] = useState('');
  const [selectedEquipment, setSelectedEquipment] = useState(new Set(['all']));
  const [equipmentOptions, setEquipmentOptions] = useState([]);
  const [completedWorkoutData, setCompletedWorkoutData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'info' });
  const [isDesktop, setIsDesktop] = useState(window.innerWidth > 768);
  const { currentUser } = useAuth();

  const { generateWorkout, allExercises } = useWorkoutGenerator();

  // Track screen size for responsive layout
  useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth > 768);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Extract unique equipment types from exercises
  useEffect(() => {
    if (allExercises.length > 0) {
      const equipmentSet = new Set();
      allExercises.forEach(ex => {
        const equipment = ex.Equipment;
        if (equipment.includes('Cable')) {
          equipmentSet.add('Cable Machine');
        } else if (equipment.includes('Dumbbell')) {
          equipmentSet.add('Dumbbells');
        } else {
          equipmentSet.add(equipment);
        }
      });
      setEquipmentOptions(Array.from(equipmentSet).sort());
    }
  }, [allExercises]);

  const handleNavigate = (screen) => {
    setCurrentScreen(screen);
    if (screen === 'selection') {
      setSidebarOpen(true);
    }
  };

  const handleWorkoutTypeChange = (type) => {
    setWorkoutType(type);
  };

  const handleEquipmentChange = (value) => {
    const newSelected = new Set(selectedEquipment);
    
    if (value === 'all') {
      if (selectedEquipment.has('all')) {
        newSelected.delete('all');
      } else {
        newSelected.clear();
        newSelected.add('all');
      }
    } else {
      newSelected.delete('all');
      if (newSelected.has(value)) {
        newSelected.delete(value);
      } else {
        newSelected.add(value);
      }
      
      if (newSelected.size === 0) {
        newSelected.add('all');
      }
    }
    
    setSelectedEquipment(newSelected);
  };

  const handleToggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleStartWorkout = (type, equipmentFilter) => {
    setLoading(true);
    
    // Simulate loading to show user we're generating
    setTimeout(() => {
      const workout = generateWorkout(type, equipmentFilter);
      setCurrentWorkout(workout);
      setWorkoutType(type);
      setLoading(false);
      
      // Show preview screen instead of going directly to workout
      setShowPreview(true);
      setCurrentScreen('preview');
    }, 500);
  };

  const handleBeginWorkout = () => {
    setShowPreview(false);
    setCurrentScreen('workout');
  };

  const handleCancelPreview = () => {
    setShowPreview(false);
    setCurrentScreen('selection');
  };

  const handleWorkoutComplete = async (workoutData) => {
    const progressionNotifications = [];
    
    // Save exercise weights and check for progression
    for (const [exerciseName, data] of Object.entries(workoutData.exercises)) {
      const lastSet = data.sets[data.sets.length - 1];
      if (lastSet.weight > 0) {
        // Get target reps for this exercise
        const targetReps = await getExerciseTargetReps(exerciseName);
        
        // Check if all sets met or exceeded target reps
        const allSetsMetTarget = data.sets.every(set => set.reps >= targetReps);
        
        if (allSetsMetTarget && data.sets.length >= SETS_PER_EXERCISE) {
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
              const newWeight = lastSet.weight + weightIncrease;
              await setExerciseWeight(exerciseName, newWeight);
              progressionNotifications.push({
                exercise: exerciseName,
                oldWeight: lastSet.weight,
                newWeight: newWeight,
                increase: weightIncrease,
              });
            }
          }
        } else {
          // Just save the current weight without progression
          await setExerciseWeight(exerciseName, lastSet.weight);
        }
      }
    }

    // Show progression notification if any exercises progressed
    if (progressionNotifications.length > 0) {
      const messages = progressionNotifications.map(prog => 
        `${prog.exercise}: ${prog.oldWeight} → ${prog.newWeight} lbs (+${prog.increase} lbs)`
      );
      setNotification({
        open: true,
        message: `🎉 Progressive Overload! You hit your target reps!\n\n${messages.join('\n')}`,
        severity: 'success',
      });
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
  };

  const handleFinish = () => {
    setCurrentScreen('selection');
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
    link.setAttribute("download", `GoodLife_Workout_${new Date(completedWorkoutData.date).toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Show auth screen if user is not logged in
  if (!currentUser) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <AuthScreen />
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <div style={{ display: 'flex', minHeight: '100vh' }}>
        <NavigationSidebar
          currentScreen={currentScreen}
          onNavigate={handleNavigate}
          workoutType={workoutType}
          selectedEquipment={selectedEquipment}
          equipmentOptions={equipmentOptions}
          onWorkoutTypeChange={handleWorkoutTypeChange}
          onEquipmentChange={handleEquipmentChange}
          onStartWorkout={handleStartWorkout}
          isOpen={sidebarOpen}
          onToggle={handleToggleSidebar}
        />
        
        <div id="app" style={{ 
          flex: 1,
          marginLeft: isDesktop ? '280px' : '0',
          transition: 'margin-left 0.3s ease',
        }}>
          {currentScreen === 'selection' && (
            <div className="screen selection-screen">
              {loading && (
                <div id="loading-indicator">
                  <i className="fas fa-spinner fa-spin"></i> Generating workout...
                </div>
              )}
            </div>
          )}
          
          {currentScreen === 'preview' && showPreview && currentWorkout.length > 0 && (
            <WorkoutPreview
              workout={currentWorkout}
              workoutType={workoutType}
              onStart={handleBeginWorkout}
              onCancel={handleCancelPreview}
            />
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

          {currentScreen === 'hiit' && <HiitTimerScreen />}
        </div>
        
        <Snackbar
          open={notification.open}
          autoHideDuration={8000}
          onClose={() => setNotification({ ...notification, open: false })}
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        >
          <Alert 
            onClose={() => setNotification({ ...notification, open: false })} 
            severity={notification.severity}
            sx={{ 
              whiteSpace: 'pre-line',
              '& .MuiAlert-message': {
                fontSize: '1rem',
                fontWeight: 500,
              }
            }}
          >
            {notification.message}
          </Alert>
        </Snackbar>
      </div>
    </ThemeProvider>
  );
}

export default App;