import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';

// Collection and document structure:
// users/{userId}/data/userData
// This structure keeps all user data in a single document for simplicity

/**
 * Save user data to Firebase Firestore
 * @param {string} userId - The authenticated user's UID
 * @param {object} data - The data to save (workoutHistory, userStats, exerciseWeights)
 */
export const saveUserDataToFirebase = async (userId, data) => {
  if (!userId) {
    console.error('Cannot save data: No user ID provided');
    return;
  }

  try {
    const userDocRef = doc(db, 'users', userId, 'data', 'userData');
    await setDoc(userDocRef, {
      ...data,
      lastUpdated: new Date().toISOString()
    }, { merge: true });
    console.log('Data saved to Firebase successfully');
  } catch (error) {
    console.error('Error saving data to Firebase:', error);
    throw error;
  }
};

/**
 * Load user data from Firebase Firestore
 * @param {string} userId - The authenticated user's UID
 * @returns {object|null} - The user data or null if not found
 */
export const loadUserDataFromFirebase = async (userId) => {
  if (!userId) {
    console.error('Cannot load data: No user ID provided');
    return null;
  }

  try {
    const userDocRef = doc(db, 'users', userId, 'data', 'userData');
    const docSnap = await getDoc(userDocRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      console.log('Data loaded from Firebase successfully');
      return data;
    } else {
      console.log('No data found in Firebase for this user');
      return null;
    }
  } catch (error) {
    console.error('Error loading data from Firebase:', error);
    throw error;
  }
};

/**
 * Save workout history to Firebase
 * @param {string} userId - The authenticated user's UID
 * @param {array} workoutHistory - The workout history array
 */
export const saveWorkoutHistoryToFirebase = async (userId, workoutHistory) => {
  if (!userId) return;
  
  try {
    await saveUserDataToFirebase(userId, { workoutHistory });
  } catch (error) {
    console.error('Error saving workout history to Firebase:', error);
  }
};

/**
 * Save user stats to Firebase
 * @param {string} userId - The authenticated user's UID
 * @param {object} userStats - The user stats object
 */
export const saveUserStatsToFirebase = async (userId, userStats) => {
  if (!userId) return;
  
  try {
    await saveUserDataToFirebase(userId, { userStats });
  } catch (error) {
    console.error('Error saving user stats to Firebase:', error);
  }
};

/**
 * Save exercise weights to Firebase
 * @param {string} userId - The authenticated user's UID
 * @param {object} exerciseWeights - The exercise weights object
 */
export const saveExerciseWeightsToFirebase = async (userId, exerciseWeights) => {
  if (!userId) return;
  
  try {
    await saveUserDataToFirebase(userId, { exerciseWeights });
  } catch (error) {
    console.error('Error saving exercise weights to Firebase:', error);
  }
};
