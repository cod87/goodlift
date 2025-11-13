import { useState, useEffect, useCallback } from "react";
import './App.css';
import Header from './components/Header';
import BottomNav from './components/Navigation/BottomNav';
import WorkTabs from './components/WorkTabs';
import TodayView from './components/TodayView/TodayView';
import SelectionScreen from './components/SelectionScreen';
import UnifiedWorkoutHub from './components/UnifiedWorkoutHub';
import WorkoutPlanScreen from './components/WorkoutPlanScreen';
import WorkoutScreen from './components/WorkoutScreen';
import WorkoutPreview from './components/WorkoutPreview';
import CustomizeExerciseScreen from './components/CustomizeExerciseScreen';
import CompletionScreen from './components/CompletionScreen';
import ProgressScreen from './components/ProgressScreen';
import AuthScreen from './components/AuthScreen';
import MobilityScreen from './components/Mobility/MobilityScreen';
import UnifiedTimerScreen from './pages/UnifiedTimerScreen';
import UnifiedLogActivityScreen from './pages/UnifiedLogActivityScreen';
import ExerciseListPage from './pages/ExerciseListPage';
import SettingsScreen from './pages/SettingsScreen';
import UserProfileScreen from './pages/UserProfileScreen';
import GuestDataMigrationDialog from './components/GuestDataMigrationDialog';
import AchievementUnlockedDialog from './components/AchievementUnlockedDialog';
import { useWorkoutGenerator } from './hooks/useWorkoutGenerator';
import { useFavoriteExercises } from './hooks/useFavoriteExercises';
import { usePlanIntegration } from './hooks/usePlanIntegration';
import { 
  saveWorkout, 
  saveUserStats, 
  getUserStats, 
  setExerciseWeight, 
  getExerciseTargetReps, 
  loadUserDataFromCloud,
  getUnlockedAchievements,
  addUnlockedAchievement,
  incrementTotalPRs,
  addToTotalVolume,
  getWorkoutHistory
} from './utils/storage';
import { SETS_PER_EXERCISE, MUSCLE_GROUPS, WEIGHT_INCREMENTS } from './utils/constants';
import { useAuth } from './contexts/AuthContext';
import { ThemeProvider as CustomThemeProvider, useTheme as useCustomTheme } from './contexts/ThemeContext';
import { ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Snackbar, Alert, Button } from '@mui/material';
import { shouldShowGuestSnackbar, dismissGuestSnackbar, disableGuestMode } from './utils/guestStorage';
import { runDataMigration } from './migrations/simplifyDataStructure';
import { getNewlyUnlockedAchievements, ACHIEVEMENT_BADGES } from './data/achievements';

/**
 * Main app component wrapped with theme
 */
function AppContent() {
  const [currentScreen, setCurrentScreen] = useState('home');
  const [currentWorkout, setCurrentWorkout] = useState([]);
  const [workoutType, setWorkoutType] = useState('full');
  const [selectedEquipment, setSelectedEquipment] = useState(new Set(['all']));
  const [equipmentOptions, setEquipmentOptions] = useState([]);
  const [completedWorkoutData, setCompletedWorkoutData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'info' });
  const [showGuestSnackbar, setShowGuestSnackbar] = useState(false);
  const [showMigrationDialog, setShowMigrationDialog] = useState(false);
  const [newAchievement, setNewAchievement] = useState(null);
  const [showAchievementDialog, setShowAchievementDialog] = useState(false);
  const { currentUser, isGuest, hasGuestData } = useAuth();

  const { generateWorkout, allExercises, exerciseDB } = useWorkoutGenerator();
  const favoriteExercises = useFavoriteExercises();
  const { 
    currentPlan,
    getTodaysWorkout,
    createWorkoutNavState
  } = usePlanIntegration();

  // Run data migration on app initialization
  useEffect(() => {
    const initializeMigration = async () => {
      try {
        console.log('Running data structure migration...');
        const migrationResult = runDataMigration();
        if (migrationResult.status === 'success') {
          console.log('Migration completed:', migrationResult);
        } else if (migrationResult.status === 'skipped') {
          console.log('Migration skipped:', migrationResult.reason);
        } else {
          console.error('Migration failed:', migrationResult);
        }
      } catch (error) {
        console.error('Error running migration:', error);
      }
    };
    
    initializeMigration();
  }, []); // Run once on mount

  // Check if guest snackbar should be shown
  useEffect(() => {
    if (isGuest) {
      setShowGuestSnackbar(shouldShowGuestSnackbar());
    } else {
      setShowGuestSnackbar(false);
    }
  }, [isGuest]);

  // Show migration dialog when user logs in with guest data
  useEffect(() => {
    if (currentUser && !isGuest && hasGuestData) {
      setShowMigrationDialog(true);
    }
  }, [currentUser, isGuest, hasGuestData]);

  // Handle migration dialog close
  const handleMigrationClose = async (migrated) => {
    setShowMigrationDialog(false);
    
    // If data was not migrated, still clear guest mode
    if (!migrated) {
      disableGuestMode();
    }
    
    // Load user data from cloud after migration
    if (currentUser && currentUser.uid) {
      try {
        await loadUserDataFromCloud(currentUser.uid);
      } catch (error) {
        console.error('Error loading user data after migration:', error);
      }
    }
  };

  // Handle guest snackbar dismissal
  const handleDismissGuestSnackbar = () => {
    dismissGuestSnackbar();
    setShowGuestSnackbar(false);
  };

  // Track viewport for iOS handling
  useEffect(() => {
    const handleResize = () => {
      // Fix iOS viewport resize issues on orientation change
      // This ensures the viewport properly adjusts after rotation
      if (window.visualViewport) {
        const viewport = window.visualViewport;
        document.documentElement.style.setProperty('--viewport-height', `${viewport.height}px`);
      }
    };
    
    const handleOrientationChange = () => {
      // Force a reflow to fix iOS layout issues
      setTimeout(() => {
        window.scrollTo(0, 0);
        handleResize();
      }, 100);
    };
    
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleOrientationChange);
    
    // Support visualViewport API for better iOS handling
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleResize);
    }
    
    // Initial call
    handleResize();
    
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleOrientationChange);
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleResize);
      }
    };
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

  const handleTodayViewQuickStart = () => {
    const todaysWorkout = getTodaysWorkout();
    if (todaysWorkout && todaysWorkout.type !== 'rest') {
      // Use today's workout type from weekly plan
      const workoutTypeValue = todaysWorkout.subtype || todaysWorkout.type;
      setWorkoutType(workoutTypeValue);
      const equipmentFilter = selectedEquipment.has('all') 
        ? 'all' 
        : Array.from(selectedEquipment);
      
      // Create nav state with plan context
      const today = new Date().getDay();
      const navState = createWorkoutNavState(today);
      
      // Use pre-generated exercises from the plan session if available
      const preGeneratedWorkout = todaysWorkout.exercises || null;
      
      handleStartWorkout(workoutTypeValue, equipmentFilter, preGeneratedWorkout, navState);
    }
  };

  const handleStartWorkout = (type, equipmentFilter, preGeneratedWorkout = null, planNavState = null) => {
    setLoading(true);
    
    // Store plan context if provided
    if (planNavState) {
      sessionStorage.setItem('currentWorkoutPlanContext', JSON.stringify(planNavState));
    } else {
      sessionStorage.removeItem('currentWorkoutPlanContext');
    }
    
    // Simulate loading to show user we're generating
    setTimeout(() => {
      const workout = preGeneratedWorkout || generateWorkout(type, equipmentFilter);
      setCurrentWorkout(workout);
      setWorkoutType(type);
      setLoading(false);
      
      // Show preview screen instead of going directly to workout
      setShowPreview(true);
      setCurrentScreen('preview');
    }, 500);
  };

  const handleCustomize = (type) => {
    setWorkoutType(type);
    setCurrentScreen('customize');
  };

  const handleCustomizeContinue = (selectedExercises) => {
    setCurrentWorkout(selectedExercises);
    setCurrentScreen('custom-preview');
  };

  const handleCustomizeCancel = () => {
    setCurrentScreen('selection');
  };

  const handleCustomPreviewStart = (workout) => {
    setCurrentWorkout(workout);
    setShowPreview(false);
    setCurrentScreen('workout');
  };

  const handleCustomPreviewCancel = () => {
    setCurrentScreen('selection');
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
   * Randomize a single exercise in the workout with enhanced logic
   * - Filters by Primary Muscle, Equipment, Exercise Type
   * - Applies 2x bias to favorited exercises
   * - Retries up to 3 times if no alternatives or duplicates found
   * - Preserves customized weight/reps settings
   * @param {Object} exercise - The current exercise object
   * @param {number} globalIndex - Index in the workout array
   */
  const handleRandomizeExercise = useCallback((exercise, globalIndex) => {
    if (!exerciseDB || Object.keys(exerciseDB).length === 0) {
      console.error('Exercise database not available');
      setNotification({
        open: true,
        message: 'Exercise database not loaded',
        severity: 'error'
      });
      return;
    }

    const primaryMuscle = exercise['Primary Muscle'];
    const exerciseType = exercise['Exercise Type'];
    const currentExerciseName = exercise['Exercise Name'];
    
    // Get exercises for the same primary muscle
    const muscleExercises = exerciseDB[primaryMuscle] || [];
    
    let attempts = 0;
    const maxAttempts = 3;
    let selectedExercise = null;

    while (attempts < maxAttempts && !selectedExercise) {
      attempts++;
      
      // Apply equipment filter
      let filteredExercises = muscleExercises;
      const equipmentFilter = Array.from(selectedEquipment);
      
      if (!equipmentFilter.includes('all')) {
        filteredExercises = muscleExercises.filter(ex => {
          const equipment = ex.Equipment;
          return equipmentFilter.some(filter => {
            if (filter === 'Cable Machine') return equipment.includes('Cable');
            if (filter === 'Dumbbells') return equipment.includes('Dumbbell');
            return equipment.includes(filter);
          });
        });
      }

      // Filter by Exercise Type to maintain compound/isolation balance
      filteredExercises = filteredExercises.filter(ex => 
        ex['Exercise Type'] === exerciseType
      );

      // Remove current exercise and any duplicates already in workout
      const workoutExerciseNames = currentWorkout.map(ex => ex['Exercise Name']);
      let availableExercises = filteredExercises.filter(
        ex => ex['Exercise Name'] !== currentExerciseName && 
              !workoutExerciseNames.includes(ex['Exercise Name'])
      );

      if (availableExercises.length === 0) {
        // Relax duplicate constraint on retry
        availableExercises = filteredExercises.filter(
          ex => ex['Exercise Name'] !== currentExerciseName
        );
      }

      if (availableExercises.length === 0) {
        continue; // Try again with next attempt
      }

      // Apply favorite bias: include favorites twice in the pool
      const exercisePool = [...availableExercises];
      availableExercises.forEach(ex => {
        if (favoriteExercises.has(ex['Exercise Name'])) {
          exercisePool.push(ex); // Add favorite a second time for 2x probability
        }
      });

      // Select random exercise from biased pool
      selectedExercise = exercisePool[Math.floor(Math.random() * exercisePool.length)];
    }

    if (!selectedExercise) {
      setNotification({
        open: true,
        message: 'No alternative exercises available',
        severity: 'warning'
      });
      return;
    }

    // Update the workout array
    const updatedWorkout = [...currentWorkout];
    updatedWorkout[globalIndex] = selectedExercise;
    setCurrentWorkout(updatedWorkout);
  }, [exerciseDB, currentWorkout, selectedEquipment, favoriteExercises]);

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
    
    // Get plan context from session storage if it exists
    const planContextStr = sessionStorage.getItem('currentWorkoutPlanContext');
    const planContext = planContextStr ? JSON.parse(planContextStr) : null;
    
    // Calculate workout volume
    let workoutVolume = 0;
    
    // Process each exercise for weight tracking and progression
    for (const [exerciseName, data] of Object.entries(workoutData.exercises)) {
      const lastSet = data.sets[data.sets.length - 1];
      
      // Calculate volume for this exercise (sets x reps x weight)
      for (const set of data.sets) {
        if (set.weight > 0 && set.reps > 0) {
          workoutVolume += set.weight * set.reps;
        }
      }
      
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
              
              // Increment PR count
              await incrementTotalPRs();
            }
          }
        } else {
          // Save current weight without progression
          await setExerciseWeight(exerciseName, lastSet.weight);
        }
      }
    }
    
    // Add to total volume
    if (workoutVolume > 0) {
      await addToTotalVolume(workoutVolume);
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

    // Save workout with plan context if available
    const finalWorkoutData = { 
      ...workoutData, 
      type: workoutType,
      planId: planContext?.planId || null,
      planDay: planContext?.planDay ?? null
    };
    await saveWorkout(finalWorkoutData);
    
    // Clear plan context from session storage
    sessionStorage.removeItem('currentWorkoutPlanContext');
    
    const stats = await getUserStats();
    stats.totalWorkouts += 1;
    stats.totalTime += workoutData.duration;
    await saveUserStats(stats);
    
    // Check for newly unlocked achievements
    try {
      const previouslyUnlocked = await getUnlockedAchievements();
      const workoutHistory = await getWorkoutHistory();
      const newAchievements = getNewlyUnlockedAchievements(stats, workoutHistory, previouslyUnlocked);
      
      if (newAchievements.length > 0) {
        // Save newly unlocked achievements
        for (const achievement of newAchievements) {
          await addUnlockedAchievement(achievement.id);
        }
        
        // Show the first achievement (can be enhanced to queue multiple)
        setNewAchievement(newAchievements[0]);
        setShowAchievementDialog(true);
      }
    } catch (error) {
      console.error('Error checking achievements:', error);
    }
    
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
    link.setAttribute("download", `GoodLift_Workout_${new Date(completedWorkoutData.date).toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Show auth screen if user is not logged in
  const { theme } = useCustomTheme();
  
  if (!currentUser) {
    return (
      <MuiThemeProvider theme={theme}>
        <CssBaseline />
        <AuthScreen />
      </MuiThemeProvider>
    );
  }

  return (
    <MuiThemeProvider theme={theme}>
      <CssBaseline />
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <Header onNavigate={handleNavigate} />
        
        <div id="app" style={{ 
          flex: 1,
          marginTop: '60px',
          paddingBottom: '80px', // Space for bottom nav
        }}>
          {currentScreen === 'home' && (
            <WorkTabs
              currentPlan={currentPlan}
              todaysWorkout={getTodaysWorkout()}
              onQuickStart={handleTodayViewQuickStart}
              onNavigate={handleNavigate}
              loading={loading}
            />
          )}

          {currentScreen === 'selection' && (
            <UnifiedWorkoutHub
              workoutType={workoutType}
              selectedEquipment={selectedEquipment}
              equipmentOptions={equipmentOptions}
              onWorkoutTypeChange={handleWorkoutTypeChange}
              onEquipmentChange={handleEquipmentChange}
              onStartWorkout={handleStartWorkout}
              onCustomize={handleCustomize}
              onNavigate={handleNavigate}
              loading={loading}
            />
          )}

          {currentScreen === 'customize' && (
            <CustomizeExerciseScreen
              workoutType={workoutType}
              equipmentFilter={selectedEquipment.has('all') ? 'all' : Array.from(selectedEquipment)}
              allExercises={allExercises}
              onCancel={handleCustomizeCancel}
              onContinue={handleCustomizeContinue}
            />
          )}

          {currentScreen === 'custom-preview' && currentWorkout.length > 0 && (
            <WorkoutPreview
              workout={currentWorkout}
              workoutType={workoutType}
              onStart={handleCustomPreviewStart}
              onCancel={handleCustomPreviewCancel}
              onRandomizeExercise={handleRandomizeExercise}
              equipmentFilter={Array.from(selectedEquipment)}
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
          
          {currentScreen === 'progress' && <ProgressScreen onNavigate={handleNavigate} onStartWorkout={handleStartWorkout} />}

          {currentScreen === 'workout-plan' && <WorkoutPlanScreen onNavigate={handleNavigate} />}

          {(currentScreen === 'cardio' || currentScreen === 'hiit' || currentScreen === 'timer') && (
            <UnifiedTimerScreen onNavigate={handleNavigate} />
          )}

          {currentScreen === 'log-activity' && <UnifiedLogActivityScreen onNavigate={handleNavigate} />}

          {(currentScreen === 'stretch' || currentScreen === 'mobility') && <MobilityScreen />}

          {currentScreen === 'exercise-list' && <ExerciseListPage />}

          {currentScreen === 'settings' && <SettingsScreen onNavigate={handleNavigate} />}

          {currentScreen === 'profile' && <UserProfileScreen />}
        </div>
        
        {/* Bottom Navigation - Always visible */}
        <BottomNav
          currentScreen={currentScreen}
          onNavigate={handleNavigate}
        />
        
        {/* Guest Data Migration Dialog */}
        <GuestDataMigrationDialog
          open={showMigrationDialog}
          onClose={handleMigrationClose}
          userId={currentUser?.uid}
        />
        
        {/* Achievement Unlocked Dialog */}
        <AchievementUnlockedDialog
          open={showAchievementDialog}
          onClose={() => {
            setShowAchievementDialog(false);
            setNewAchievement(null);
          }}
          achievement={newAchievement}
        />
        
        {/* Guest Mode Snackbar */}
        <Snackbar
          open={showGuestSnackbar}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
          sx={{ bottom: { xs: 80, sm: 24 } }}
        >
          <Alert 
            severity="info"
            onClose={handleDismissGuestSnackbar}
            action={
              <Button 
                color="inherit" 
                size="small" 
                onClick={() => setCurrentScreen('progress')}
                sx={{ fontWeight: 600 }}
              >
                Sign Up
              </Button>
            }
            sx={{ 
              width: '100%',
              maxWidth: '600px',
              '& .MuiAlert-message': {
                fontSize: '0.95rem',
                fontWeight: 500,
              }
            }}
          >
            You're in guest mode. Sign up to save your data permanently!
          </Alert>
        </Snackbar>
        
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
    </MuiThemeProvider>
  );
}

function App() {
  return (
    <CustomThemeProvider>
      <AppContent />
    </CustomThemeProvider>
  );
}

export default App;