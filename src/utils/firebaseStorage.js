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
    
    await setDoc(userDocRef, cleanedData, { merge: true });
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
      return docSnap.data();
    } else {
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

/**
 * Save weekly plan to Firebase
 * Enforces 7-day structure with day types enum
 * @param {string} userId - The authenticated user's UID
 * @param {array} weeklyPlan - Array of 7 day objects with mandatory structure
 */
export const saveWeeklyPlanToFirebase = async (userId, weeklyPlan) => {
  if (!userId) return;
  
  // Validate 7-day structure
  if (!Array.isArray(weeklyPlan) || weeklyPlan.length !== 7) {
    console.error('Invalid weekly plan: must be an array of exactly 7 days');
    return;
  }
  
  // Validate each day has required fields
  const validDayTypes = ['strength', 'hypertrophy', 'cardio', 'active_recovery', 'rest'];
  for (let i = 0; i < weeklyPlan.length; i++) {
    const day = weeklyPlan[i];
    if (typeof day.dayOfWeek !== 'number' || day.dayOfWeek < 0 || day.dayOfWeek > 6) {
      console.error(`Invalid dayOfWeek at index ${i}: must be 0-6`);
      return;
    }
    if (!validDayTypes.includes(day.type)) {
      console.error(`Invalid day type at index ${i}: must be one of ${validDayTypes.join(', ')}`);
      return;
    }
  }
  
  try {
    await saveUserDataToFirebase(userId, { weeklyPlan });
  } catch (error) {
    console.error('Error saving weekly plan to Firebase:', error);
  }
};

/**
 * Save plans (simplified data model) to Firebase
 * @param {string} userId - The authenticated user's UID
 * @param {array} plans - The plans array
 */
export const savePlansToFirebase = async (userId, plans) => {
  if (!userId) return;
  
  try {
    await saveUserDataToFirebase(userId, { plans });
  } catch (error) {
    console.error('Error saving plans to Firebase:', error);
  }
};

/**
 * Load plans (simplified data model) from Firebase
 * @param {string} userId - The authenticated user's UID
 * @returns {array|null} - The plans array or null if not found
 */
export const loadPlansFromFirebase = async (userId) => {
  if (!userId) return null;
  
  try {
    const userData = await loadUserDataFromFirebase(userId);
    return userData?.plans || null;
  } catch (error) {
    console.error('Error loading plans from Firebase:', error);
    return null;
  }
};

/**
 * Save plan days (simplified data model) to Firebase
 * @param {string} userId - The authenticated user's UID
 * @param {array} planDays - The plan days array
 */
export const savePlanDaysToFirebase = async (userId, planDays) => {
  if (!userId) return;
  
  try {
    await saveUserDataToFirebase(userId, { planDays });
  } catch (error) {
    console.error('Error saving plan days to Firebase:', error);
  }
};

/**
 * Load plan days (simplified data model) from Firebase
 * @param {string} userId - The authenticated user's UID
 * @returns {array|null} - The plan days array or null if not found
 */
export const loadPlanDaysFromFirebase = async (userId) => {
  if (!userId) return null;
  
  try {
    const userData = await loadUserDataFromFirebase(userId);
    return userData?.planDays || null;
  } catch (error) {
    console.error('Error loading plan days from Firebase:', error);
    return null;
  }
};

/**
 * Save plan exercises (simplified data model) to Firebase
 * @param {string} userId - The authenticated user's UID
 * @param {array} planExercises - The plan exercises array
 */
export const savePlanExercisesToFirebase = async (userId, planExercises) => {
  if (!userId) return;
  
  try {
    await saveUserDataToFirebase(userId, { planExercises });
  } catch (error) {
    console.error('Error saving plan exercises to Firebase:', error);
  }
};

/**
 * Load plan exercises (simplified data model) from Firebase
 * @param {string} userId - The authenticated user's UID
 * @returns {array|null} - The plan exercises array or null if not found
 */
export const loadPlanExercisesFromFirebase = async (userId) => {
  if (!userId) return null;
  
  try {
    const userData = await loadUserDataFromFirebase(userId);
    return userData?.planExercises || null;
  } catch (error) {
    console.error('Error loading plan exercises from Firebase:', error);
    return null;
  }
};

/**
 * Save favorite workouts to Firebase
 * @param {string} userId - The authenticated user's UID
 * @param {array} favoriteWorkouts - The favorite workouts array
 */
export const saveFavoriteWorkoutsToFirebase = async (userId, favoriteWorkouts) => {
  if (!userId) return;
  
  try {
    await saveUserDataToFirebase(userId, { favoriteWorkouts });
  } catch (error) {
    console.error('Error saving favorite workouts to Firebase:', error);
  }
};

/**
 * Load favorite workouts from Firebase
 * @param {string} userId - The authenticated user's UID
 * @returns {array|null} - The favorite workouts array or null if not found
 */
export const loadFavoriteWorkoutsFromFirebase = async (userId) => {
  if (!userId) return null;
  
  try {
    const userData = await loadUserDataFromFirebase(userId);
    return userData?.favoriteWorkouts || null;
  } catch (error) {
    console.error('Error loading favorite workouts from Firebase:', error);
    return null;
  }
};

/**
 * Save HIIT presets to Firebase
 * @param {string} userId - The authenticated user's UID
 * @param {array} hiitPresets - The HIIT presets array
 */
export const saveHiitPresetsToFirebase = async (userId, hiitPresets) => {
  if (!userId) return;
  
  try {
    await saveUserDataToFirebase(userId, { hiitPresets });
  } catch (error) {
    console.error('Error saving HIIT presets to Firebase:', error);
  }
};

/**
 * Save Yoga presets to Firebase
 * @param {string} userId - The authenticated user's UID
 * @param {array} yogaPresets - The Yoga presets array
 */
export const saveYogaPresetsToFirebase = async (userId, yogaPresets) => {
  if (!userId) return;
  
  try {
    await saveUserDataToFirebase(userId, { yogaPresets });
  } catch (error) {
    console.error('Error saving Yoga presets to Firebase:', error);
  }
};

/**
 * Save saved workouts to Firebase
 * @param {string} userId - The authenticated user's UID
 * @param {array} savedWorkouts - The saved workouts array
 */
export const saveSavedWorkoutsToFirebase = async (userId, savedWorkouts) => {
  if (!userId) return;
  
  try {
    await saveUserDataToFirebase(userId, { savedWorkouts });
  } catch (error) {
    console.error('Error saving saved workouts to Firebase:', error);
  }
};

/**
 * Load saved workouts from Firebase
 * @param {string} userId - The authenticated user's UID
 * @returns {array|null} - The saved workouts array or null if not found
 */
export const loadSavedWorkoutsFromFirebase = async (userId) => {
  if (!userId) return null;
  
  try {
    const userData = await loadUserDataFromFirebase(userId);
    return userData?.savedWorkouts || null;
  } catch (error) {
    console.error('Error loading saved workouts from Firebase:', error);
    return null;
  }
};

/**
 * Save pinned exercises to Firebase
 * @param {string} userId - The authenticated user's UID
 * @param {Array} pinnedExercises - The pinned exercises array
 */
export const savePinnedExercisesToFirebase = async (userId, pinnedExercises) => {
  if (!userId) return;
  
  try {
    await saveUserDataToFirebase(userId, { pinnedExercises });
  } catch (error) {
    console.error('Error saving pinned exercises to Firebase:', error);
  }
};

/**
 * Load pinned exercises from Firebase
 * @param {string} userId - The authenticated user's UID
 * @returns {Array|null} - The pinned exercises array or null if not found
 */
export const loadPinnedExercisesFromFirebase = async (userId) => {
  if (!userId) return null;
  
  try {
    const userData = await loadUserDataFromFirebase(userId);
    return userData?.pinnedExercises || null;
  } catch (error) {
    console.error('Error loading pinned exercises from Firebase:', error);
    return null;
  }
};

/**
 * Save nutrition entries to Firebase
 * @param {string} userId - The authenticated user's UID
 * @param {array} nutritionEntries - The nutrition entries array
 */
export const saveNutritionEntriesToFirebase = async (userId, nutritionEntries) => {
  if (!userId) return;
  
  try {
    await saveUserDataToFirebase(userId, { nutritionEntries });
  } catch (error) {
    console.error('Error saving nutrition entries to Firebase:', error);
  }
};

/**
 * Save nutrition goals to Firebase
 * @param {string} userId - The authenticated user's UID
 * @param {object} nutritionGoals - The nutrition goals object
 */
export const saveNutritionGoalsToFirebase = async (userId, nutritionGoals) => {
  if (!userId) return;
  
  try {
    await saveUserDataToFirebase(userId, { nutritionGoals });
  } catch (error) {
    console.error('Error saving nutrition goals to Firebase:', error);
  }
};

/**
 * Save nutrition recipes to Firebase
 * @param {string} userId - The authenticated user's UID
 * @param {array} nutritionRecipes - The nutrition recipes array
 */
export const saveNutritionRecipesToFirebase = async (userId, nutritionRecipes) => {
  if (!userId) return;
  
  try {
    await saveUserDataToFirebase(userId, { nutritionRecipes });
  } catch (error) {
    console.error('Error saving nutrition recipes to Firebase:', error);
  }
};

/**
 * Load nutrition data from Firebase
 * @param {string} userId - The authenticated user's UID
 * @returns {object|null} - Object with nutritionEntries, nutritionGoals, and nutritionRecipes or null if not found
 */
export const loadNutritionDataFromFirebase = async (userId) => {
  if (!userId) return null;
  
  try {
    const userData = await loadUserDataFromFirebase(userId);
    return {
      nutritionEntries: userData?.nutritionEntries || null,
      nutritionGoals: userData?.nutritionGoals || null,
      nutritionRecipes: userData?.nutritionRecipes || null
    };
  } catch (error) {
    console.error('Error loading nutrition data from Firebase:', error);
    return null;
  }
};

// FCM token storage functions removed - push notifications functionality has been removed
// Firebase Auth and Firestore remain active for cross-device data sync
