import { useState, useEffect, useCallback } from "react";
import './App.css';
import Header from './components/Header';
import NavigationSidebar from './components/NavigationSidebar';
import SelectionScreen from './components/SelectionScreen';
import WorkoutScreen from './components/WorkoutScreen';
import WorkoutPreview from './components/WorkoutPreview';
import CompletionScreen from './components/CompletionScreen';
import ProgressScreen from './components/ProgressScreen';
import HiitTimerScreen from './components/HiitTimerScreen';
import AuthScreen from './components/AuthScreen';
import FavouritesScreen from './components/FavouritesScreen';
import StretchScreen from './components/Stretch/StretchScreen';
import YogaFlowsScreen from './components/YogaFlows/YogaFlowsScreen';
import { useWorkoutGenerator } from './hooks/useWorkoutGenerator';
import { useFavoriteExercises } from './hooks/useFavoriteExercises';
import { saveWorkout, saveUserStats, getUserStats, setExerciseWeight, getExerciseTargetReps } from './utils/storage';
import { SETS_PER_EXERCISE, MUSCLE_GROUPS, WEIGHT_INCREMENTS } from './utils/constants';
import { useAuth } from './contexts/AuthContext';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Snackbar, Alert } from '@mui/material';

/**
 * Custom theme configuration matching app brand colors
 */
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
    h1: { fontFamily: "'Montserrat', sans-serif", fontWeight: 800 },
    h2: { fontFamily: "'Montserrat', sans-serif", fontWeight: 800 },
    h3: { fontFamily: "'Montserrat', sans-serif", fontWeight: 700 },
    h4: { fontFamily: "'Montserrat', sans-serif", fontWeight: 700 },
    h5: { fontFamily: "'Montserrat', sans-serif", fontWeight: 700 },
    h6: { fontFamily: "'Montserrat', sans-serif", fontWeight: 700 },
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

  const { generateWorkout, allExercises, exerciseDB } = useWorkoutGenerator();
  const { favoriteExerciseNames } = useFavoriteExercises();

  // Track screen size for responsive layout
  useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth > 768);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Extract unique equipment types from exercises (memoized)
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
    if (value instanceof Set) {
      setSelectedEquipment(value);
    } else {
      const newSelected = new Set();
      newSelected.add(value);
      setSelectedEquipment(newSelected);
    }
  };

  const handleToggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleStartWorkout = (type, equipmentFilter, preGeneratedWorkout = null) => {
    setLoading(true);
    
    // Simulate loading to show user we're generating
    setTimeout(() => {
      const workout = preGeneratedWorkout || generateWorkout(type, equipmentFilter, favoriteExerciseNames);
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

  /**
   * Randomize a single exercise in the workout
   * @param {number} supersetIdx - Index of the superset
   * @param {number} exerciseIdx - Index of the exercise within the superset (0 or 1)
   * @param {string} primaryMuscle - Primary muscle group to maintain
   * @param {string|Array} equipmentFilter - Equipment filter to apply
   */
  const handleRandomizeExercise = useCallback((supersetIdx, exerciseIdx, primaryMuscle, equipmentFilter) => {
    if (!exerciseDB || Object.keys(exerciseDB).length === 0) {
      console.error('Exercise database not available');
      return;
    }

    // Get exercises for the same primary muscle
    const muscleExercises = exerciseDB[primaryMuscle] || [];
    
    // Apply equipment filter
    let filteredExercises = muscleExercises;
    if (equipmentFilter && equipmentFilter !== 'all') {
      const equipmentList = Array.isArray(equipmentFilter) ? equipmentFilter : [equipmentFilter];
      filteredExercises = muscleExercises.filter(ex => {
        const equipment = ex.Equipment;
        return equipmentList.some(filter => {
          if (filter === 'Cable Machine') return equipment.includes('Cable');
          if (filter === 'Dumbbells') return equipment.includes('Dumbbell');
          return equipment === filter;
        });
      });
    }

    // Remove current exercise from options
    const currentExercise = currentWorkout[supersetIdx * 2 + exerciseIdx];
    const availableExercises = filteredExercises.filter(
      ex => ex['Exercise Name'] !== currentExercise['Exercise Name']
    );

    if (availableExercises.length === 0) {
      console.warn('No alternative exercises available');
      return;
    }

    // Select a random exercise
    const randomExercise = availableExercises[Math.floor(Math.random() * availableExercises.length)];

    // Update the workout array
    const updatedWorkout = [...currentWorkout];
    updatedWorkout[supersetIdx * 2 + exerciseIdx] = randomExercise;
    setCurrentWorkout(updatedWorkout);
  }, [exerciseDB, currentWorkout]);

  /**
   * Calculate weight increase for progressive overload based on muscle group and equipment
   * @param {string} primaryMuscle - Primary muscle group being worked
   * @param {string} equipment - Equipment type being used
   * @returns {number} Weight increase in lbs
   */
  const calculateWeightIncrease = useCallback((primaryMuscle, equipment) => {
    const isDumbbell = equipment.includes('Dumbbell') || equipment.includes('Kettlebell');

    if (MUSCLE_GROUPS.UPPER_BODY.includes(primaryMuscle)) {
      return isDumbbell ? WEIGHT_INCREMENTS.UPPER_BODY.DUMBBELL : WEIGHT_INCREMENTS.UPPER_BODY.BARBELL;
    }
    
    if (MUSCLE_GROUPS.LOWER_BODY.includes(primaryMuscle)) {
      return isDumbbell ? WEIGHT_INCREMENTS.LOWER_BODY.DUMBBELL : WEIGHT_INCREMENTS.LOWER_BODY.BARBELL;
    }
    
    return 0;
  }, []);

  /**
   * Handle workout completion - save data, check for progression, update stats
   * @param {Object} workoutData - Completed workout data with exercises and duration
   */
  const handleWorkoutComplete = useCallback(async (workoutData) => {
    const progressionNotifications = [];
    
    // Process each exercise for weight tracking and progression
    for (const [exerciseName, data] of Object.entries(workoutData.exercises)) {
      const lastSet = data.sets[data.sets.length - 1];
      if (lastSet?.weight > 0) {
        const targetReps = await getExerciseTargetReps(exerciseName);
        const allSetsMetTarget = data.sets.every(set => set.reps >= targetReps);
        
        // Check for progressive overload criteria
        if (allSetsMetTarget && data.sets.length >= SETS_PER_EXERCISE) {
          const exercise = currentWorkout.find(ex => ex['Exercise Name'] === exerciseName);
          if (exercise) {
            const primaryMuscle = exercise['Primary Muscle'].split('(')[0].trim();
            const weightIncrease = calculateWeightIncrease(primaryMuscle, exercise['Equipment']);

            if (weightIncrease > 0) {
              const newWeight = lastSet.weight + weightIncrease;
              await setExerciseWeight(exerciseName, newWeight);
              progressionNotifications.push({
                exercise: exerciseName,
                oldWeight: lastSet.weight,
                newWeight,
                increase: weightIncrease,
              });
            }
          }
        } else {
          // Save current weight without progression
          await setExerciseWeight(exerciseName, lastSet.weight);
        }
      }
    }

    // Display progression notification
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

    // Save workout and update stats
    const finalWorkoutData = { ...workoutData, type: workoutType };
    await saveWorkout(finalWorkoutData);
    
    const stats = await getUserStats();
    stats.totalWorkouts += 1;
    stats.totalTime += workoutData.duration;
    await saveUserStats(stats);
    
    setCompletedWorkoutData(finalWorkoutData);
    setCurrentScreen('completion');
  }, [workoutType, currentWorkout, calculateWeightIncrease]);

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
          isOpen={sidebarOpen}
          onToggle={handleToggleSidebar}
        />
        
        <Header isDesktop={isDesktop} />
        
        <div id="app" style={{ 
          flex: 1,
          marginLeft: isDesktop ? '280px' : '0',
          marginTop: '60px',
          transition: 'margin-left 0.3s ease',
        }}>
          {currentScreen === 'selection' && (
            <SelectionScreen
              workoutType={workoutType}
              selectedEquipment={selectedEquipment}
              equipmentOptions={equipmentOptions}
              onWorkoutTypeChange={handleWorkoutTypeChange}
              onEquipmentChange={handleEquipmentChange}
              onStartWorkout={handleStartWorkout}
              loading={loading}
            />
          )}
          
          {currentScreen === 'preview' && showPreview && currentWorkout.length > 0 && (
            <WorkoutPreview
              workout={currentWorkout}
              workoutType={workoutType}
              onStart={handleBeginWorkout}
              onCancel={handleCancelPreview}
              onRandomizeExercise={handleRandomizeExercise}
              equipmentFilter={Array.from(selectedEquipment)}
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
              workoutPlan={currentWorkout}
              onFinish={handleFinish}
              onExportCSV={handleExportCSV}
            />
          )}
          
          {currentScreen === 'progress' && <ProgressScreen />}

          {currentScreen === 'favourites' && (
            <FavouritesScreen onStartWorkout={handleStartWorkout} />
          )}

          {currentScreen === 'hiit' && <HiitTimerScreen />}

          {currentScreen === 'stretch' && <StretchScreen />}

          {currentScreen === 'yoga' && <YogaFlowsScreen />}
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