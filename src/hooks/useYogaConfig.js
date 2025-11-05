import { useState, useEffect } from 'react';
import { isGuestMode, getGuestData, setGuestData } from '../utils/guestStorage';
import { getCurrentUserId } from '../utils/storage';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';

/**
 * Custom hook for managing yoga session configuration
 * Stores config in localStorage and Firestore
 */
export const useYogaConfig = () => {
  const [config, setConfig] = useState({
    flowLength: 10,
    coolDownLength: 5,
    poseSuggestionFrequency: 1,
  });
  const [loading, setLoading] = useState(true);

  const STORAGE_KEY = 'goodlift_yoga_config';

  // Load configuration on mount
  useEffect(() => {
    const loadConfig = async () => {
      try {
        // Check guest mode first
        if (isGuestMode()) {
          const guestConfig = getGuestData('yoga_config');
          if (guestConfig) {
            setConfig(guestConfig);
          }
          setLoading(false);
          return;
        }

        // Try Firebase for authenticated users
        const userId = getCurrentUserId();
        if (userId) {
          try {
            const docRef = doc(db, 'users', userId, 'yoga', 'config');
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
              const firebaseConfig = docSnap.data();
              setConfig(firebaseConfig);
              // Cache in localStorage
              localStorage.setItem(STORAGE_KEY, JSON.stringify(firebaseConfig));
              setLoading(false);
              return;
            }
          } catch (error) {
            console.error('Error loading yoga config from Firebase:', error);
          }
        }

        // Fallback to localStorage
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          setConfig(JSON.parse(stored));
        }
      } catch (error) {
        console.error('Error loading yoga config:', error);
      } finally {
        setLoading(false);
      }
    };

    loadConfig();
  }, []);

  // Save configuration
  const saveConfig = async (newConfig) => {
    try {
      setConfig(newConfig);

      // Save based on mode
      if (isGuestMode()) {
        setGuestData('yoga_config', newConfig);
      } else {
        // Save to localStorage
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newConfig));

        // Save to Firebase if authenticated
        const userId = getCurrentUserId();
        if (userId) {
          try {
            const docRef = doc(db, 'users', userId, 'yoga', 'config');
            await setDoc(docRef, newConfig, { merge: true });
          } catch (error) {
            console.error('Error saving yoga config to Firebase:', error);
          }
        }
      }
    } catch (error) {
      console.error('Error saving yoga config:', error);
    }
  };

  return { config, saveConfig, loading };
};
