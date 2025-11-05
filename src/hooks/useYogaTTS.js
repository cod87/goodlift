import { useState, useEffect } from 'react';
import { isGuestMode, getGuestData, setGuestData } from '../utils/guestStorage';
import { getCurrentUserId } from '../utils/storage';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';

/**
 * Custom hook for managing yoga TTS (Text-to-Speech) preference
 * Stores preference in localStorage and Firestore
 */
export const useYogaTTS = () => {
  const [ttsEnabled, setTtsEnabledState] = useState(false);
  const [loading, setLoading] = useState(true);

  const STORAGE_KEY = 'goodlift_yoga_tts_enabled';

  // Load TTS preference on mount
  useEffect(() => {
    const loadTTSPreference = async () => {
      try {
        // Check guest mode first
        if (isGuestMode()) {
          const guestTTS = getGuestData('yoga_tts_enabled');
          if (guestTTS !== null && guestTTS !== undefined) {
            setTtsEnabledState(guestTTS);
          }
          setLoading(false);
          return;
        }

        // Try Firebase for authenticated users
        const userId = getCurrentUserId();
        if (userId) {
          try {
            const docRef = doc(db, 'users', userId, 'yoga', 'preferences');
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
              const prefs = docSnap.data();
              if (prefs.ttsEnabled !== undefined) {
                setTtsEnabledState(prefs.ttsEnabled);
                // Cache in localStorage
                localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs.ttsEnabled));
                setLoading(false);
                return;
              }
            }
          } catch (error) {
            console.error('Error loading yoga TTS preference from Firebase:', error);
          }
        }

        // Fallback to localStorage
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored !== null) {
          setTtsEnabledState(JSON.parse(stored));
        }
      } catch (error) {
        console.error('Error loading yoga TTS preference:', error);
      } finally {
        setLoading(false);
      }
    };

    loadTTSPreference();
  }, []);

  // Save TTS preference
  const setTtsEnabled = async (enabled) => {
    try {
      setTtsEnabledState(enabled);

      // Save based on mode
      if (isGuestMode()) {
        setGuestData('yoga_tts_enabled', enabled);
      } else {
        // Save to localStorage
        localStorage.setItem(STORAGE_KEY, JSON.stringify(enabled));

        // Save to Firebase if authenticated
        const userId = getCurrentUserId();
        if (userId) {
          try {
            const docRef = doc(db, 'users', userId, 'yoga', 'preferences');
            await setDoc(docRef, { ttsEnabled: enabled }, { merge: true });
          } catch (error) {
            console.error('Error saving yoga TTS preference to Firebase:', error);
          }
        }
      }
    } catch (error) {
      console.error('Error saving yoga TTS preference:', error);
    }
  };

  return { ttsEnabled, setTtsEnabled, loading };
};
