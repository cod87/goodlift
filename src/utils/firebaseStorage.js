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
/**
 * Remove undefined values from an object recursively
 * Firebase Firestore doesn't accept undefined values
 * @param {any} obj - Object to clean
 * @returns {any} - Cleaned object
 */
const removeUndefined = (obj) => {
  if (obj === null || obj === undefined) {
    return null;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => removeUndefined(item));
  }
  
  if (typeof obj === 'object') {
    const cleaned = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined) {
        cleaned[key] = removeUndefined(value);
      }
    }
    return cleaned;
  }
  
  return obj;
};

export const saveUserDataToFirebase = async (userId, data) => {
  if (!userId) {
    console.error('Cannot save data: No user ID provided');
    return;
  }

  try {
    const userDocRef = doc(db, 'users', userId, 'data', 'userData');
    
    // Remove all undefined values before saving
    const cleanedData = removeUndefined({
      ...data,
      lastUpdated: new Date().toISOString()
    });
    
    // Log what we're actually saving
    if (cleanedData.workoutPlans) {
      console.log('Saving workout plans to Firebase:', {
        count: cleanedData.workoutPlans.length,
        firstPlanId: cleanedData.workoutPlans[0]?.id,
        firstPlanName: cleanedData.workoutPlans[0]?.name,
        firstPlanSessions: cleanedData.workoutPlans[0]?.sessions?.length,
        firstSessionExercises: cleanedData.workoutPlans[0]?.sessions?.[0]?.exercises?.length
      });
    }
    
    await setDoc(userDocRef, cleanedData, { merge: true });
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
      
      // Log workout plans details
      if (data.workoutPlans) {
        console.log('Firebase loaded workoutPlans:', {
          count: data.workoutPlans.length,
          firstPlanId: data.workoutPlans[0]?.id,
          firstPlanSessions: data.workoutPlans[0]?.sessions?.length,
          firstSessionExercises: data.workoutPlans[0]?.sessions?.[0]?.exercises?.length,
          rawFirstSession: data.workoutPlans[0]?.sessions?.[0]
        });
      } else {
        console.log('No workoutPlans in Firebase data');
      }
      
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

/**
 * Save exercise target reps to Firebase
 * @param {string} userId - The authenticated user's UID
 * @param {object} exerciseTargetReps - The exercise target reps object
 */
export const saveExerciseTargetRepsToFirebase = async (userId, exerciseTargetReps) => {
  if (!userId) return;
  
  try {
    await saveUserDataToFirebase(userId, { exerciseTargetReps });
  } catch (error) {
    console.error('Error saving exercise target reps to Firebase:', error);
  }
};

/**
 * Save HIIT sessions to Firebase
 * @param {string} userId - The authenticated user's UID
 * @param {array} hiitSessions - The HIIT sessions array
 */
export const saveHiitSessionsToFirebase = async (userId, hiitSessions) => {
  if (!userId) return;
  
  try {
    await saveUserDataToFirebase(userId, { hiitSessions });
  } catch (error) {
    console.error('Error saving HIIT sessions to Firebase:', error);
  }
};

/**
 * Save cardio sessions to Firebase
 * @param {string} userId - The authenticated user's UID
 * @param {array} cardioSessions - The cardio sessions array
 */
export const saveCardioSessionsToFirebase = async (userId, cardioSessions) => {
  if (!userId) return;
  
  try {
    await saveUserDataToFirebase(userId, { cardioSessions });
  } catch (error) {
    console.error('Error saving cardio sessions to Firebase:', error);
  }
};

/**
 * Save stretch sessions to Firebase
 * @param {string} userId - The authenticated user's UID
 * @param {array} stretchSessions - The stretch sessions array
 */
export const saveStretchSessionsToFirebase = async (userId, stretchSessions) => {
  if (!userId) return;
  
  try {
    await saveUserDataToFirebase(userId, { stretchSessions });
  } catch (error) {
    console.error('Error saving stretch sessions to Firebase:', error);
  }
};

/**
 * Save yoga sessions to Firebase
 * @param {string} userId - The authenticated user's UID
 * @param {array} yogaSessions - The yoga sessions array
 */
export const saveYogaSessionsToFirebase = async (userId, yogaSessions) => {
  if (!userId) return;
  
  try {
    await saveUserDataToFirebase(userId, { yogaSessions });
  } catch (error) {
    console.error('Error saving yoga sessions to Firebase:', error);
  }
};

/**
 * Save workout plans to Firebase
 * @param {string} userId - The authenticated user's UID
 * @param {array} workoutPlans - The workout plans array
 */
export const saveWorkoutPlansToFirebase = async (userId, workoutPlans) => {
  if (!userId) return;
  
  try {
    await saveUserDataToFirebase(userId, { workoutPlans });
  } catch (error) {
    console.error('Error saving workout plans to Firebase:', error);
  }
};

/**
 * Save active plan ID to Firebase
 * @param {string} userId - The authenticated user's UID
 * @param {string|null} activePlanId - The active plan ID or null
 */
export const saveActivePlanToFirebase = async (userId, activePlanId) => {
  if (!userId) return;
  
  try {
    await saveUserDataToFirebase(userId, { activePlanId });
  } catch (error) {
    console.error('Error saving active plan to Firebase:', error);
  }
};
