import { useState, useEffect, useCallback } from "react";
import './App.css';
import Header from './components/Header';
import BottomNav from './components/Navigation/BottomNav';
import WorkTabs from './components/WorkTabs';
import TodayView from './components/TodayView/TodayView';
// SelectionScreen removed - functionality moved to WorkTabs
import WorkoutScreenModal from './components/WorkoutScreenModal';
import CompletionScreen from './components/CompletionScreen';
import ProgressScreen from './components/ProgressScreen';
import AuthScreen from './components/AuthScreen';
import MobilityScreen from './components/Mobility/MobilityScreen';
import UnifiedTimerScreen from './pages/UnifiedTimerScreen';
import UnifiedLogActivityScreen from './pages/UnifiedLogActivityScreen';
import ExerciseListPage from './pages/ExerciseListPage';
import SettingsScreen from './pages/SettingsScreen';
import UserProfileScreen from './pages/UserProfileScreen';
import EditWeeklyScheduleScreen from './pages/EditWeeklyScheduleScreen';
import ExerciseCardDemo from './pages/ExerciseCardDemo';
import GuestDataMigrationDialog from './components/GuestDataMigrationDialog';
import AchievementUnlockedDialog from './components/AchievementUnlockedDialog';
import { useWorkoutGenerator } from './hooks/useWorkoutGenerator';
// usePlanIntegration hook removed - no longer using workout planning
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
  getWorkoutHistory,
  getHiitSessions,
  getCardioSessions,
  getStretchSessions
} from './utils/storage';
import progressiveOverloadService from './services/ProgressiveOverloadService';
import { cleanupExpiredBackups } from './utils/dataResetService';
import { SETS_PER_EXERCISE, MUSCLE_GROUPS, WEIGHT_INCREMENTS } from './utils/constants';
import { shouldReduceWeight } from './utils/progressiveOverload';
import { useAuth } from './contexts/AuthContext';
import { ThemeProvider as CustomThemeProvider, useTheme as useCustomTheme } from './contexts/ThemeContext';
import { ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Snackbar, Alert, Button, useMediaQuery } from '@mui/material';
import { shouldShowGuestSnackbar, dismissGuestSnackbar, disableGuestMode } from './utils/guestStorage';
import { runDataMigration } from './migrations/simplifyDataStructure';
import { runExerciseNameMigration } from './utils/exerciseNameMigration';
import { runAchievementsMigration } from './migrations/achievementsMigration';
import { getNewlyUnlockedAchievements, ACHIEVEMENT_BADGES } from './data/achievements';
import { awardSessionPoints, awardBadgePoints, evaluateWeeklyPerformance, initializePointsForExistingUser } from './utils/pointsTracking';
import { BREAKPOINTS } from './theme/responsive';

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
  const [loading] = useState(false);
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'info' });
  const [showGuestSnackbar, setShowGuestSnackbar] = useState(false);
  const [showMigrationDialog, setShowMigrationDialog] = useState(false);
  const [newAchievement, setNewAchievement] = useState(null);
  const [showAchievementDialog, setShowAchievementDialog] = useState(false);
  const [supersetConfig, setSupersetConfig] = useState([2, 2, 2, 2]); // Track superset configuration
  const { currentUser, isGuest, hasGuestData } = useAuth();
  
  // Desktop layout detection
  const isDesktop = useMediaQuery(`(min-width: ${BREAKPOINTS.desktop}px)`);

  const { generateWorkout, allExercises } = useWorkoutGenerator();

  // Run data migration on app initialization
  useEffect(() => {
    const initializeMigration = async () => {
      try {
        // Run data structure migration first
        console.log('Running data structure migration...');
        const migrationResult = runDataMigration();
        if (migrationResult.status === 'success') {
          console.log('Migration completed:', migrationResult);
        } else if (migrationResult.status === 'skipped') {
          console.log('Migration skipped:', migrationResult.reason);
        } else {
          console.error('Migration failed:', migrationResult);
        }

        // Run exercise name migration
        console.log('Running exercise name migration...');
        const exerciseNameMigrationResult = runExerciseNameMigration();
        if (exerciseNameMigrationResult.status === 'success') {
          console.log('Exercise name migration completed:', exerciseNameMigrationResult);
        } else if (exerciseNameMigrationResult.status === 'skipped') {
          console.log('Exercise name migration skipped:', exerciseNameMigrationResult.reason);
        } else {
          console.error('Exercise name migration failed:', exerciseNameMigrationResult);
        }
        
        // Run achievements migration
        console.log('Running achievements migration...');
        const userStats = await getUserStats();
        const [workoutHistory, hiitSessions, cardioSessions, stretchSessions] = await Promise.all([
          getWorkoutHistory(),
          getHiitSessions(),
          getCardioSessions(),
          getStretchSessions()
        ]);
        const allSessions = [...workoutHistory, ...hiitSessions, ...cardioSessions, ...stretchSessions];
        
        const achievementsMigrationRan = await runAchievementsMigration(userStats, allSessions);
        if (achievementsMigrationRan) {
          console.log('Achievements migration completed successfully');
        } else {
          console.log('Achievements migration skipped (already completed)');
        }
        
        // Initialize points system for existing users
        console.log('Initializing points system...');
        const unlockedAchievements = await getUnlockedAchievements();
        const unlockedBadgeObjects = ACHIEVEMENT_BADGES.filter(badge => 
          unlockedAchievements.includes(badge.id)
        );
        initializePointsForExistingUser(unlockedBadgeObjects);
        console.log('Points system initialized');
      } catch (error) {
        console.error('Error running migration:', error);
      }
    };
    
    initializeMigration();
  }, []); // Run once on mount
  
  // Check for weekly evaluation on app load
  useEffect(() => {
    const checkWeeklyEvaluation = async () => {
      try {
        // Import here to avoid circular dependency
        const { getUserPoints, getLastRecordedStreak, saveCurrentStreak, checkAndApplyStreakBreakPenalty } = await import('./utils/pointsTracking');
        const pointsData = getUserPoints();
        
        // Get current stats to check streak
        const userStats = await getUserStats();
        const lastStreak = getLastRecordedStreak();
        
        // Check for streak break
        if (lastStreak > 0) {
          const streakBreakResult = checkAndApplyStreakBreakPenalty(userStats.currentStreak, lastStreak);
          if (streakBreakResult.streakBroken) {
            console.log(`[Points] Streak break detected and penalty applied`);
          }
        }
        
        // Save current streak for next time
        saveCurrentStreak(userStats.currentStreak);
        
        // Check if we're in a new week
        const getCurrentWeekStart = () => {
          const now = new Date();
          const day = now.getDay();
          const diff = now.getDate() - day;
          const weekStart = new Date(now.setDate(diff));
          weekStart.setHours(0, 0, 0, 0);
          return weekStart;
        };
        
        const currentWeekStart = getCurrentWeekStart();
        const lastWeekStart = new Date(pointsData.currentWeekStart);
        
        // If we're in a new week and have previous week data
        if (currentWeekStart > lastWeekStart) {
          const strengthSessionsLastWeek = pointsData.weeklyStrengthSessions;
          const result = evaluateWeeklyPerformance(strengthSessionsLastWeek);
          
          if (result.evaluated && result.penalty < 0) {
            console.log(`[Points] Weekly evaluation: ${result.penalty} penalty for ${strengthSessionsLastWeek} strength sessions`);
          } else if (result.evaluated) {
            console.log(`[Points] Weekly evaluation: Goal met with ${strengthSessionsLastWeek} strength sessions`);
          }
        }
      } catch (error) {
        console.error('Error checking weekly evaluation:', error);
      }
    };
    
    checkWeeklyEvaluation();
  }, []); // Run once on mount

  // Cleanup expired backups on app initialization
  useEffect(() => {
    const initializeBackupCleanup = async () => {
      try {
        await cleanupExpiredBackups();
      } catch (error) {
        console.error('Error cleaning up expired backups:', error);
      }
    };
    
    initializeBackupCleanup();
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

  const handleStartWorkout = (type, equipmentFilter, preGeneratedWorkout = null, supersetConfigParam = [2, 2, 2, 2]) => {
    setSupersetConfig(supersetConfigParam); // Store superset config
    
    const workout = preGeneratedWorkout || generateWorkout(type, equipmentFilter, supersetConfigParam);
    setCurrentWorkout(workout);
    setWorkoutType(type);
    
    // Go directly to workout screen
    setCurrentScreen('workout');
  };

  const handleCustomize = (type, equipmentFilter, supersetConfigParam = [2, 2, 2, 2]) => {
    setWorkoutType(type);
    setSupersetConfig(supersetConfigParam); // Store superset config
    
    // Set empty workout for customization mode with the specified superset configuration
    const totalExercises = supersetConfigParam.reduce((sum, count) => sum + count, 0);
    const emptyWorkout = Array(totalExercises).fill(null);
    setCurrentWorkout(emptyWorkout);
    
    // Go directly to workout screen in customize mode
    setCurrentScreen('workout');
  };

  /**
   * Calculate weight increase for progressive overload based on muscle group and equipment
   * @param {string} primaryMuscle - Primary muscle group being worked
   * @param {string} equipment - Equipment type being used
   * @returns {number} Weight increase in lbs (0 for bodyweight exercises)
   */
  const calculateWeightIncrease = useCallback((primaryMuscle, equipment) => {
    // Bodyweight exercises should not have progressive overload
    if (equipment?.toLowerCase().includes('bodyweight') || equipment?.toLowerCase().includes('body weight')) {
      return 0;
    }
    
    const isDumbbell = equipment.includes('Dumbbell') || equipment.includes('Kettlebell');
    const isBarbell = equipment?.toLowerCase().includes('barbell');

    if (MUSCLE_GROUPS.UPPER_BODY.includes(primaryMuscle)) {
      if (isBarbell) {
        return WEIGHT_INCREMENTS.UPPER_BODY.BARBELL; // 5 lbs for barbell
      }
      return WEIGHT_INCREMENTS.UPPER_BODY.DUMBBELL; // 2.5 lbs for dumbbell/other
    }
    
    if (MUSCLE_GROUPS.LOWER_BODY.includes(primaryMuscle)) {
      if (isBarbell) {
        return WEIGHT_INCREMENTS.LOWER_BODY.BARBELL; // 5 lbs for barbell
      }
      return isDumbbell ? WEIGHT_INCREMENTS.LOWER_BODY.DUMBBELL : 5; // 10 lbs for dumbbell, 5 lbs for other
    }
    
    return 2.5; // Default 2.5 lbs for other exercises
  }, []);

  /**
   * Calculate weight reduction for underperformance based on muscle group and equipment
   * Uses the same logic as weight increase for consistency
   * @param {string} primaryMuscle - Primary muscle group being worked
   * @param {string} equipment - Equipment type being used
   * @returns {number} Weight reduction in lbs (0 for bodyweight exercises)
   */
  const calculateWeightDecrease = useCallback((primaryMuscle, equipment) => {
    // Bodyweight exercises should not have progressive overload
    if (equipment?.toLowerCase().includes('bodyweight') || equipment?.toLowerCase().includes('body weight')) {
      return 0;
    }
    
    const isDumbbell = equipment.includes('Dumbbell') || equipment.includes('Kettlebell');
    const isBarbell = equipment?.toLowerCase().includes('barbell');

    if (MUSCLE_GROUPS.UPPER_BODY.includes(primaryMuscle)) {
      if (isBarbell) {
        return WEIGHT_INCREMENTS.UPPER_BODY.BARBELL; // 5 lbs for barbell
      }
      return WEIGHT_INCREMENTS.UPPER_BODY.DUMBBELL; // 2.5 lbs for dumbbell/other
    }
    
    if (MUSCLE_GROUPS.LOWER_BODY.includes(primaryMuscle)) {
      if (isBarbell) {
        return WEIGHT_INCREMENTS.LOWER_BODY.BARBELL; // 5 lbs for barbell
      }
      return isDumbbell ? WEIGHT_INCREMENTS.LOWER_BODY.DUMBBELL : 5; // 10 lbs for dumbbell, 5 lbs for other
    }
    
    return 2.5; // Default 2.5 lbs for other exercises
  }, []);

  /**
   * Handle workout completion - save data, check for progression, update stats
   * @param {Object} workoutData - Completed workout data with exercises and duration
   */
  const handleWorkoutComplete = useCallback(async (workoutData) => {
    const progressionNotifications = [];
    const reductionNotifications = [];
    
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
        
        // Check for progressive overload criteria (weight increase)
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
          // Check for weight reduction criteria (completed 20% or more fewer reps than target)
          const shouldReduce = shouldReduceWeight(data.sets, targetReps, SETS_PER_EXERCISE);
          
          if (shouldReduce) {
            const exercise = currentWorkout.find(ex => ex['Exercise Name'] === exerciseName);
            if (exercise) {
              const primaryMuscle = exercise['Primary Muscle'].split('(')[0].trim();
              const weightDecrease = calculateWeightDecrease(primaryMuscle, exercise['Equipment']);

              if (weightDecrease > 0 && lastSet.weight > weightDecrease) {
                const newWeight = lastSet.weight - weightDecrease;
                await setExerciseWeight(exerciseName, newWeight);
                reductionNotifications.push({
                  exercise: exerciseName,
                  oldWeight: lastSet.weight,
                  newWeight,
                  decrease: weightDecrease,
                });
              } else {
                // If weight would go negative or to zero, just save current weight
                await setExerciseWeight(exerciseName, lastSet.weight);
              }
            } else {
              // Save current weight without change
              await setExerciseWeight(exerciseName, lastSet.weight);
            }
          } else {
            // Save current weight without progression or reduction
            await setExerciseWeight(exerciseName, lastSet.weight);
          }
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
    } else if (reductionNotifications.length > 0) {
      // Display weight reduction notification if no progressions occurred
      const messages = reductionNotifications.map(red => 
        `${red.exercise}: ${red.oldWeight} → ${red.newWeight} lbs (-${red.decrease} lbs)`
      );
      setNotification({
        open: true,
        message: `💪 Weight adjusted for next session. Keep pushing!\n\n${messages.join('\n')}`,
        severity: 'info',
      });
    }

    // Save workout without plan context (no longer using plans)
    const finalWorkoutData = { 
      ...workoutData, 
      type: workoutType,
    };
    await saveWorkout(finalWorkoutData);
    
    const stats = await getUserStats();
    stats.totalWorkouts += 1;
    stats.totalTime += workoutData.duration;
    await saveUserStats(stats);
    
    // Check for newly unlocked achievements
    try {
      const previouslyUnlocked = await getUnlockedAchievements();
      
      // Get ALL session types for accurate achievement checking
      // This ensures streaks and counts include cardio, HIIT, stretch, etc.
      const [workoutHistory, hiitSessions, cardioSessions, stretchSessions] = await Promise.all([
        getWorkoutHistory(),
        getHiitSessions(),
        getCardioSessions(),
        getStretchSessions()
      ]);
      
      // Merge all session types for complete history
      const allSessions = [
        ...workoutHistory,
        ...hiitSessions,
        ...cardioSessions,
        ...stretchSessions
      ];
      
      const newAchievements = getNewlyUnlockedAchievements(stats, allSessions, previouslyUnlocked);
      
      // Award session points (Section 3 of rewards-system.md)
      const sessionPointsResult = awardSessionPoints(
        workoutData.type,
        stats.currentStreak,
        allSessions
      );
      
      console.log(`[Points] Awarded ${sessionPointsResult.pointsAwarded} points for ${workoutData.type} session`);
      
      if (newAchievements.length > 0) {
        // Save newly unlocked achievements
        for (const achievement of newAchievements) {
          await addUnlockedAchievement(achievement.id);
        }
        
        // Award badge points (500 per badge)
        const badgePoints = awardBadgePoints(newAchievements.length);
        console.log(`[Points] Awarded ${badgePoints} points for ${newAchievements.length} new badge(s)`);
        
        // Show the first achievement (can be enhanced to queue multiple)
        setNewAchievement(newAchievements[0]);
        setShowAchievementDialog(true);
      }
      
      // Sync pinned exercises with latest performance after workout is saved
      try {
        await progressiveOverloadService.syncPinnedExercisesWithHistory(workoutHistory);
      } catch (error) {
        console.error('Error syncing pinned exercises after workout:', error);
        // Continue anyway - workout data is already saved
      }
    } catch (error) {
      console.error('Error checking achievements:', error);
    }
    
    setCompletedWorkoutData(finalWorkoutData);
    setCurrentScreen('completion');
  }, [workoutType, currentWorkout, calculateWeightIncrease, calculateWeightDecrease]);

  const handleWorkoutExit = () => {
    // Return to home instead of selection
    setCurrentScreen('home');
  };

  const handleFinish = () => {
    // Return to home instead of selection
    setCurrentScreen('home');
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
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        minHeight: '100vh',
        // Desktop: offset for sidebar navigation
        marginLeft: isDesktop ? '80px' : '0',
      }}>
        <Header currentTab={currentScreen} />
        
        <div id="app" style={{ 
          flex: 1,
          marginTop: '48px',
          // Desktop: no bottom padding needed (no bottom nav)
          // Mobile/Tablet: space for bottom nav
          paddingBottom: isDesktop ? '2rem' : '80px',
        }}>
          {currentScreen === 'home' && (
            <WorkTabs
              onNavigate={handleNavigate}
              loading={loading}
              workoutType={workoutType}
              selectedEquipment={selectedEquipment}
              equipmentOptions={equipmentOptions}
              onWorkoutTypeChange={handleWorkoutTypeChange}
              onEquipmentChange={handleEquipmentChange}
              onStartWorkout={handleStartWorkout}
              onCustomize={handleCustomize}
            />
          )}
          
          {currentScreen === 'workout' && currentWorkout.length > 0 && (
            <WorkoutScreenModal
              open={true}
              workoutPlan={currentWorkout}
              onComplete={handleWorkoutComplete}
              onExit={handleWorkoutExit}
              supersetConfig={supersetConfig}
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

          {/* Workout planning screen removed - no longer using workout planning */}

          {(currentScreen === 'cardio' || currentScreen === 'hiit' || currentScreen === 'timer') && (
            <UnifiedTimerScreen onNavigate={handleNavigate} />
          )}

          {currentScreen === 'log-activity' && <UnifiedLogActivityScreen onNavigate={handleNavigate} />}

          {(currentScreen === 'stretch' || currentScreen === 'mobility') && <MobilityScreen />}

          {currentScreen === 'exercise-list' && <ExerciseListPage />}

          {currentScreen === 'settings' && <SettingsScreen onNavigate={handleNavigate} />}

          {currentScreen === 'profile' && <UserProfileScreen />}

          {currentScreen === 'edit-weekly-schedule' && <EditWeeklyScheduleScreen onNavigate={handleNavigate} />}
          
          {currentScreen === 'exercise-card-demo' && <ExerciseCardDemo />}
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