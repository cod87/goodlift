import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import { useAuth } from './AuthContext';
import { saveUserDataToFirebase, loadUserDataFromFirebase } from '../utils/firebaseStorage';
import { getWorkoutHistory, getStretchSessions, getHiitSessions, getCardioSessions } from '../utils/storage';
import { calculateStreak } from '../utils/trackingMetrics';

const UserProfileContext = createContext({});

// eslint-disable-next-line react-refresh/only-export-components
export const useUserProfile = () => {
  return useContext(UserProfileContext);
};

const DEFAULT_PROFILE = {
  displayName: '',
  email: '',
  avatar: null, // null = use initials, string = url or preset id
  currentWeight: null,
  targetWeight: null, // New: user's target weight goal
  weightHistory: [], // [{weight: number, date: string, unit: string}]
  bio: '',
  goals: '',
  memberSince: null,
  weightUnit: 'lbs',
};

export const UserProfileProvider = ({ children }) => {
  const { currentUser, isGuest } = useAuth();
  const [profile, setProfile] = useState(DEFAULT_PROFILE);
  const [stats, setStats] = useState({
    totalWorkouts: 0,
    currentStreak: 0,
    longestStreak: 0,
    favoriteExercise: '',
    totalVolume: 0,
    totalPRs: 0,
    completedWellnessTasks: 0, // New: track wellness task completion
  });
  const [loading, setLoading] = useState(true);

  // Calculate stats from workout history
  const calculateStats = useCallback(async () => {
    try {
      // Load ALL session types for accurate counting
      const [workoutHistory, stretchSessions, hiitSessions, cardioSessions] = await Promise.all([
        getWorkoutHistory(),
        getStretchSessions(),
        getHiitSessions(),
        getCardioSessions()
      ]);
      
      // Merge all session types
      const allSessions = [
        ...workoutHistory,
        ...stretchSessions,
        ...hiitSessions,
        ...cardioSessions
      ];
      
      // Total workouts (all session types)
      const totalWorkouts = allSessions.length;
      
      // Current streak using canonical function from trackingMetrics
      const streakData = calculateStreak(allSessions);
      const currentStreak = streakData.currentStreak;
      const longestStreak = streakData.longestStreak;
      
      // Favorite exercise - most frequently performed (only from strength workouts)
      const exerciseCount = {};
      workoutHistory.forEach(workout => {
        if (workout.exercises) {
          Object.keys(workout.exercises).forEach(exerciseName => {
            exerciseCount[exerciseName] = (exerciseCount[exerciseName] || 0) + 1;
          });
        }
      });
      
      const favoriteExercise = Object.entries(exerciseCount)
        .sort((a, b) => b[1] - a[1])[0]?.[0] || '';
      
      // Total volume (in pounds - will be converted in UI) - only from strength workouts
      let totalVolume = 0;
      workoutHistory.forEach(workout => {
        if (workout.exercises) {
          Object.values(workout.exercises).forEach(exerciseData => {
            exerciseData.sets?.forEach(set => {
              if (set.weight && set.reps) {
                totalVolume += set.weight * set.reps;
              }
            });
          });
        }
      });
      
      // Total PRs - stored separately
      const totalPRs = localStorage.getItem('goodlift_total_prs') 
        ? parseInt(localStorage.getItem('goodlift_total_prs')) 
        : 0;
      
      // Wellness tasks completed
      const storageKey = currentUser?.uid 
        ? `wellness_completed_${currentUser.uid}` 
        : 'wellness_completed_guest';
      const wellnessData = localStorage.getItem(storageKey);
      const completedWellnessTasks = wellnessData ? JSON.parse(wellnessData).length : 0;
      
      return {
        totalWorkouts,
        currentStreak,
        longestStreak,
        favoriteExercise,
        totalVolume,
        totalPRs,
        completedWellnessTasks,
      };
    } catch (error) {
      console.error('Error calculating stats:', error);
      return {
        totalWorkouts: 0,
        currentStreak: 0,
        longestStreak: 0,
        favoriteExercise: '',
        totalVolume: 0,
        totalPRs: 0,
        completedWellnessTasks: 0,
      };
    }
  }, [currentUser]);

  // Load profile on mount or when user changes
  useEffect(() => {
    const loadProfile = async () => {
      setLoading(true);
      try {
        if (currentUser && !isGuest) {
          // Load from Firebase
          const userData = await loadUserDataFromFirebase(currentUser.uid);
          
          if (userData?.profile) {
            setProfile({
              ...DEFAULT_PROFILE,
              ...userData.profile,
              email: currentUser.email,
            });
          } else {
            // Initialize profile for new users
            const newProfile = {
              ...DEFAULT_PROFILE,
              displayName: currentUser.displayName || '',
              email: currentUser.email,
              memberSince: new Date().toISOString(),
            };
            setProfile(newProfile);
            // Save to Firebase
            await saveUserDataToFirebase(currentUser.uid, { profile: newProfile });
          }
          
          // Load stats
          if (userData?.stats) {
            setStats(userData.stats);
          } else {
            const calculatedStats = await calculateStats();
            setStats(calculatedStats);
          }
        } else {
          // Load from localStorage for guest users
          const stored = localStorage.getItem('goodlift_user_profile');
          if (stored) {
            setProfile({ ...DEFAULT_PROFILE, ...JSON.parse(stored) });
          } else {
            setProfile({
              ...DEFAULT_PROFILE,
              displayName: 'Guest User',
              memberSince: new Date().toISOString(),
            });
          }
          
          // Calculate stats for guest
          const calculatedStats = await calculateStats();
          setStats(calculatedStats);
        }
      } catch (error) {
        console.error('Error loading profile:', error);
        setProfile(DEFAULT_PROFILE);
      } finally {
        setLoading(false);
      }
    };

    if (currentUser !== undefined) {
      loadProfile();
    }
  }, [currentUser, isGuest, calculateStats]);

  // Save profile
  const saveProfile = useCallback(async (newProfile) => {
    try {
      setProfile(newProfile);
      
      if (currentUser && !isGuest) {
        // Save to Firebase
        await saveUserDataToFirebase(currentUser.uid, { profile: newProfile });
      } else {
        // Save to localStorage for guest users
        localStorage.setItem('goodlift_user_profile', JSON.stringify(newProfile));
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      throw error;
    }
  }, [currentUser, isGuest]);

  // Update specific profile field
  const updateProfile = useCallback((key, value) => {
    const newProfile = { ...profile, [key]: value };
    return saveProfile(newProfile);
  }, [profile, saveProfile]);

  // Add weight entry
  const addWeightEntry = useCallback(async (weight, unit = 'lbs') => {
    const newEntry = {
      weight,
      unit,
      date: new Date().toISOString(),
    };
    
    const newHistory = [...profile.weightHistory, newEntry];
    const newProfile = {
      ...profile,
      currentWeight: weight,
      weightUnit: unit,
      weightHistory: newHistory,
    };
    
    await saveProfile(newProfile);
  }, [profile, saveProfile]);

  // Get initials from display name
  const getInitials = useCallback(() => {
    if (!profile.displayName) return '?';
    
    const names = profile.displayName.trim().split(' ');
    if (names.length === 1) {
      return names[0].charAt(0).toUpperCase();
    }
    return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
  }, [profile.displayName]);

  // Calculate profile completion percentage
  const getProfileCompletion = useCallback(() => {
    let completed = 0;
    let total = 7;
    
    if (profile.displayName) completed++;
    if (profile.avatar) completed++;
    if (profile.currentWeight) completed++;
    if (profile.bio) completed++;
    if (profile.goals) completed++;
    if (profile.weightHistory.length > 0) completed++;
    if (profile.email) completed++;
    
    return Math.round((completed / total) * 100);
  }, [profile]);

  // Refresh stats
  const refreshStats = useCallback(async () => {
    const calculatedStats = await calculateStats();
    setStats(calculatedStats);
    
    if (currentUser && !isGuest) {
      await saveUserDataToFirebase(currentUser.uid, { stats: calculatedStats });
    }
  }, [calculateStats, currentUser, isGuest]);

  const value = {
    profile,
    stats,
    loading,
    saveProfile,
    updateProfile,
    addWeightEntry,
    getInitials,
    getProfileCompletion,
    refreshStats,
  };

  return (
    <UserProfileContext.Provider value={value}>
      {children}
    </UserProfileContext.Provider>
  );
};

UserProfileProvider.propTypes = {
  children: PropTypes.node.isRequired,
};
