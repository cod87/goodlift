import {
  saveNutritionEntriesToFirebase,
  saveNutritionGoalsToFirebase,
  saveNutritionRecipesToFirebase,
  loadNutritionDataFromFirebase
} from './firebaseStorage';
import { isGuestMode, getGuestData, setGuestData } from './guestStorage';

/**
 * Storage module for managing nutrition data in localStorage and Firebase
 * Provides functions for persisting and retrieving nutrition entries, goals, and recipes
 * Automatically syncs with Firebase when user is authenticated
 */

/** Storage keys for localStorage */
const KEYS = {
  NUTRITION_ENTRIES: 'goodlift_nutrition_entries',
  NUTRITION_GOALS: 'goodlift_nutrition_goals',
  NUTRITION_RECIPES: 'goodlift_nutrition_recipes',
  FAVORITE_FOODS: 'goodlift_favorite_foods',
};

/** Current authenticated user ID for Firebase sync */
let currentUserId = null;

/**
 * Set the current user ID for Firebase synchronization
 * @param {string} userId - Firebase user ID
 */
export const setCurrentUserId = (userId) => {
  currentUserId = userId;
};

/**
 * Get the current user ID
 * @returns {string|null} Current user ID or null if not authenticated
 */
export const getCurrentUserId = () => {
  return currentUserId;
};

/**
 * Get nutrition entries from Firebase (if authenticated) or localStorage
 * @returns {Array} Array of nutrition entry objects
 */
export const getNutritionEntries = () => {
  try {
    // Check if in guest mode first
    if (isGuestMode()) {
      const guestData = getGuestData('nutrition_entries');
      return guestData || [];
    }

    // Try localStorage
    const stored = localStorage.getItem(KEYS.NUTRITION_ENTRIES);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error getting nutrition entries:', error);
    return [];
  }
};

/**
 * Save nutrition entry to localStorage and Firebase
 * @param {Object} entry - Nutrition entry object
 * @returns {Promise<void>}
 */
export const saveNutritionEntry = async (entry) => {
  try {
    const entries = getNutritionEntries();
    entries.push(entry);

    // Save to guest mode if applicable
    if (isGuestMode()) {
      setGuestData('nutrition_entries', entries);
      return;
    }

    // Save to localStorage
    localStorage.setItem(KEYS.NUTRITION_ENTRIES, JSON.stringify(entries));

    // Save to Firebase if user is authenticated
    if (currentUserId) {
      try {
        await saveNutritionEntriesToFirebase(currentUserId, entries);
      } catch (error) {
        console.error('Error syncing nutrition entries to Firebase:', error);
      }
    }
  } catch (error) {
    console.error('Error saving nutrition entry:', error);
    throw error;
  }
};

/**
 * Delete nutrition entry from localStorage and Firebase
 * @param {number} entryId - Entry ID to delete
 * @returns {Promise<void>}
 */
export const deleteNutritionEntry = async (entryId) => {
  try {
    const entries = getNutritionEntries();
    const filteredEntries = entries.filter(e => e.id !== entryId);

    // Save to guest mode if applicable
    if (isGuestMode()) {
      setGuestData('nutrition_entries', filteredEntries);
      return;
    }

    // Save to localStorage
    localStorage.setItem(KEYS.NUTRITION_ENTRIES, JSON.stringify(filteredEntries));

    // Save to Firebase if user is authenticated
    if (currentUserId) {
      try {
        await saveNutritionEntriesToFirebase(currentUserId, filteredEntries);
      } catch (error) {
        console.error('Error syncing nutrition entries to Firebase:', error);
      }
    }
  } catch (error) {
    console.error('Error deleting nutrition entry:', error);
    throw error;
  }
};

/**
 * Get nutrition goals from Firebase (if authenticated) or localStorage
 * @returns {Object|null} Nutrition goals object or null if not set
 */
export const getNutritionGoals = () => {
  try {
    // Check if in guest mode first
    if (isGuestMode()) {
      const guestData = getGuestData('nutrition_goals');
      return guestData || null;
    }

    // Try localStorage
    const stored = localStorage.getItem(KEYS.NUTRITION_GOALS);
    return stored ? JSON.parse(stored) : null;
  } catch (error) {
    console.error('Error getting nutrition goals:', error);
    return null;
  }
};

/**
 * Save nutrition goals to localStorage and Firebase
 * @param {Object} goals - Nutrition goals object
 * @returns {Promise<void>}
 */
export const saveNutritionGoals = async (goals) => {
  try {
    // Save to guest mode if applicable
    if (isGuestMode()) {
      setGuestData('nutrition_goals', goals);
      return;
    }

    // Save to localStorage
    localStorage.setItem(KEYS.NUTRITION_GOALS, JSON.stringify(goals));

    // Save to Firebase if user is authenticated
    if (currentUserId) {
      try {
        await saveNutritionGoalsToFirebase(currentUserId, goals);
      } catch (error) {
        console.error('Error syncing nutrition goals to Firebase:', error);
      }
    }
  } catch (error) {
    console.error('Error saving nutrition goals:', error);
    throw error;
  }
};

/**
 * Load nutrition data from Firebase
 * @param {string} userId - Firebase user ID
 * @returns {Promise<void>}
 */
export const loadUserNutritionData = async (userId) => {
  try {
    const firebaseData = await loadNutritionDataFromFirebase(userId);
    
    if (firebaseData) {
      if (firebaseData.nutritionEntries) {
        localStorage.setItem(KEYS.NUTRITION_ENTRIES, JSON.stringify(firebaseData.nutritionEntries));
      }
      if (firebaseData.nutritionGoals) {
        localStorage.setItem(KEYS.NUTRITION_GOALS, JSON.stringify(firebaseData.nutritionGoals));
      }
      if (firebaseData.nutritionRecipes) {
        localStorage.setItem(KEYS.NUTRITION_RECIPES, JSON.stringify(firebaseData.nutritionRecipes));
      }
    }
  } catch (error) {
    console.error('Error loading user nutrition data:', error);
    throw error;
  }
};

/**
 * Get saved recipes from localStorage or guest storage
 * @returns {Array} Array of recipe objects
 */
export const getRecipes = () => {
  try {
    // Check if in guest mode first
    if (isGuestMode()) {
      const guestData = getGuestData('nutrition_recipes');
      return guestData || [];
    }

    // Try localStorage
    const stored = localStorage.getItem(KEYS.NUTRITION_RECIPES);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error getting recipes:', error);
    return [];
  }
};

/**
 * Save a recipe to localStorage and Firebase
 * @param {Object} recipe - Recipe object with foods and nutrition data
 * @returns {Promise<void>}
 */
export const saveRecipe = async (recipe) => {
  try {
    const recipes = getRecipes();
    
    // Add or update recipe
    const existingIndex = recipes.findIndex(r => r.id === recipe.id);
    if (existingIndex >= 0) {
      recipes[existingIndex] = recipe;
    } else {
      recipes.push(recipe);
    }

    // Save to guest mode if applicable
    if (isGuestMode()) {
      setGuestData('nutrition_recipes', recipes);
      return;
    }

    // Save to localStorage
    localStorage.setItem(KEYS.NUTRITION_RECIPES, JSON.stringify(recipes));

    // Save to Firebase if user is authenticated
    if (currentUserId) {
      try {
        await saveNutritionRecipesToFirebase(currentUserId, recipes);
      } catch (error) {
        console.error('Error syncing recipes to Firebase:', error);
      }
    }
  } catch (error) {
    console.error('Error saving recipe:', error);
    throw error;
  }
};

/**
 * Delete a recipe from localStorage and Firebase
 * @param {string} recipeId - Recipe ID to delete
 * @returns {Promise<void>}
 */
export const deleteRecipe = async (recipeId) => {
  try {
    const recipes = getRecipes();
    const filteredRecipes = recipes.filter(r => r.id !== recipeId);

    // Save to guest mode if applicable
    if (isGuestMode()) {
      setGuestData('nutrition_recipes', filteredRecipes);
      return;
    }

    // Save to localStorage
    localStorage.setItem(KEYS.NUTRITION_RECIPES, JSON.stringify(filteredRecipes));

    // Save to Firebase if user is authenticated
    if (currentUserId) {
      try {
        await saveNutritionRecipesToFirebase(currentUserId, filteredRecipes);
      } catch (error) {
        console.error('Error syncing recipes to Firebase:', error);
      }
    }
  } catch (error) {
    console.error('Error deleting recipe:', error);
    throw error;
  }
};

/**
 * Get favorite foods from localStorage
 * @returns {Array} Array of favorite food objects
 */
export const getFavoriteFoods = () => {
  try {
    // Check if in guest mode first
    if (isGuestMode()) {
      const guestData = getGuestData('favorite_foods');
      return guestData || [];
    }

    // Try localStorage
    const stored = localStorage.getItem(KEYS.FAVORITE_FOODS);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error getting favorite foods:', error);
    return [];
  }
};

/**
 * Helper function to check if a food matches a favorite
 * @param {Object} fav - Favorite food object
 * @param {Object} food - Food object to check
 * @returns {boolean} True if they match
 */
const foodMatchesFavorite = (fav, food) => {
  return (food.fdcId && fav.fdcId === food.fdcId) || 
         (fav.description === (food.description || food.foodName));
};

/**
 * Add a food to favorites
 * @param {Object} food - Food object to add to favorites
 * @returns {Promise<void>}
 */
export const addFavoriteFood = async (food) => {
  try {
    const favorites = getFavoriteFoods();
    
    // Check if already in favorites using helper function
    const exists = favorites.some(fav => foodMatchesFavorite(fav, food));
    
    if (exists) {
      return; // Already in favorites
    }

    const favoriteFood = {
      id: food.fdcId || `fav_${Date.now()}`,
      fdcId: food.fdcId,
      description: food.description || food.foodName,
      foodNutrients: food.foodNutrients,
      addedAt: new Date().toISOString(),
    };

    favorites.push(favoriteFood);

    // Save to guest mode if applicable
    if (isGuestMode()) {
      setGuestData('favorite_foods', favorites);
      return;
    }

    // Save to localStorage
    localStorage.setItem(KEYS.FAVORITE_FOODS, JSON.stringify(favorites));
  } catch (error) {
    console.error('Error adding favorite food:', error);
    throw error;
  }
};

/**
 * Remove a food from favorites
 * @param {string|number} foodId - Food ID (fdcId or custom id)
 * @returns {Promise<void>}
 */
export const removeFavoriteFood = async (foodId) => {
  try {
    const favorites = getFavoriteFoods();
    const filteredFavorites = favorites.filter(f => 
      f.id !== foodId && f.fdcId !== foodId
    );

    // Save to guest mode if applicable
    if (isGuestMode()) {
      setGuestData('favorite_foods', filteredFavorites);
      return;
    }

    // Save to localStorage
    localStorage.setItem(KEYS.FAVORITE_FOODS, JSON.stringify(filteredFavorites));
  } catch (error) {
    console.error('Error removing favorite food:', error);
    throw error;
  }
};

/**
 * Check if a food is in favorites
 * @param {Object} food - Food object to check
 * @returns {boolean} True if food is in favorites
 */
export const isFavoriteFood = (food) => {
  try {
    const favorites = getFavoriteFoods();
    return favorites.some(fav => foodMatchesFavorite(fav, food));
  } catch (error) {
    console.error('Error checking favorite food:', error);
    return false;
  }
};
