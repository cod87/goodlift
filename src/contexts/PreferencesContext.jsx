import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import { useAuth } from './AuthContext';
import { saveUserDataToFirebase, loadUserDataFromFirebase } from '../utils/firebaseStorage';

const PreferencesContext = createContext({});

// eslint-disable-next-line react-refresh/only-export-components
export const usePreferences = () => {
  return useContext(PreferencesContext);
};

const DEFAULT_PREFERENCES = {
  units: 'imperial', // 'imperial' or 'metric'
  theme: 'dark',
  notifications: true,
  sounds: true,
  warmupDuration: 5,
  cooldownDuration: 5,
  restTimerDefault: 90,
  autoProgressionEnabled: true,
  language: 'en',
  // Wellness task and push notification preferences
  pushNotificationsEnabled: false,
  dailyWellnessTasksEnabled: false,
  wellnessCategories: [], // Selected categories for wellness tasks
  relationshipStatus: 'All', // 'All', 'Single', 'In Relationship'
  morningNotificationTime: { hour: 8, minute: 0 }, // Time for morning notifications
  followupNotificationTime: { hour: 21, minute: 0 }, // Time for follow-up notifications
  enableFollowupNotifications: true, // Enable/disable follow-up notifications
  // Barbell weight preference
  barbellWeight: 45, // Default barbell weight in lbs (standard Olympic barbell)
};

export const PreferencesProvider = ({ children }) => {
  const { currentUser, isGuest } = useAuth();
  const [preferences, setPreferences] = useState(DEFAULT_PREFERENCES);
  const [loading, setLoading] = useState(true);

  // Load preferences on mount or when user changes
  useEffect(() => {
    const loadPreferences = async () => {
      setLoading(true);
      try {
        if (currentUser && !isGuest) {
          // Load from Firebase
          const userData = await loadUserDataFromFirebase(currentUser.uid);
          if (userData?.preferences) {
            setPreferences({ ...DEFAULT_PREFERENCES, ...userData.preferences });
          } else {
            // No preferences in Firebase, use defaults
            setPreferences(DEFAULT_PREFERENCES);
          }
        } else {
          // Load from localStorage for guest users
          const stored = localStorage.getItem('goodlift_preferences');
          if (stored) {
            setPreferences({ ...DEFAULT_PREFERENCES, ...JSON.parse(stored) });
          } else {
            setPreferences(DEFAULT_PREFERENCES);
          }
        }
      } catch (error) {
        console.error('Error loading preferences:', error);
        setPreferences(DEFAULT_PREFERENCES);
      } finally {
        setLoading(false);
      }
    };

    loadPreferences();
  }, [currentUser, isGuest]);

  // Save preferences whenever they change
  const savePreferences = useCallback(async (newPreferences) => {
    try {
      setPreferences(newPreferences);
      
      if (currentUser && !isGuest) {
        // Save to Firebase
        await saveUserDataToFirebase(currentUser.uid, { preferences: newPreferences });
      } else {
        // Save to localStorage for guest users
        localStorage.setItem('goodlift_preferences', JSON.stringify(newPreferences));
      }
    } catch (error) {
      console.error('Error saving preferences:', error);
    }
  }, [currentUser, isGuest]);

  // Update specific preference
  const updatePreference = useCallback((key, value) => {
    const newPreferences = { ...preferences, [key]: value };
    savePreferences(newPreferences);
  }, [preferences, savePreferences]);

  // Convert weight based on user's unit preference
  const convertWeight = useCallback((weight, fromUnit) => {
    if (!weight) return 0;
    
    const targetUnit = preferences.units === 'imperial' ? 'lbs' : 'kg';
    
    // If already in target unit, return as is
    if (fromUnit === targetUnit) return weight;
    
    // Convert between units
    if (fromUnit === 'lbs' && targetUnit === 'kg') {
      return Math.round(weight * 0.453592 * 10) / 10; // Round to 1 decimal
    } else if (fromUnit === 'kg' && targetUnit === 'lbs') {
      return Math.round(weight * 2.20462 * 10) / 10; // Round to 1 decimal
    }
    
    return weight;
  }, [preferences.units]);

  // Get display unit
  const getDisplayUnit = useCallback(() => {
    return preferences.units === 'imperial' ? 'lbs' : 'kg';
  }, [preferences.units]);

  const value = {
    preferences,
    loading,
    updatePreference,
    savePreferences,
    convertWeight,
    getDisplayUnit,
  };

  return (
    <PreferencesContext.Provider value={value}>
      {children}
    </PreferencesContext.Provider>
  );
};

PreferencesProvider.propTypes = {
  children: PropTypes.node.isRequired,
};
