/**
 * Nutrition Data Service
 * 
 * Provides access to the nutrition.json local database
 * Supports:
 * - Search with ranking (higher rank = more relevant)
 * - Tag-based search (tags not visible to users)
 * - Standard portions with multiple measurement options
 * - Custom food persistence with Firebase sync
 */

import { 
  getCustomIngredients,
  addCustomIngredient as addCustomIngredientToStorage,
  deleteCustomIngredient as deleteCustomIngredientFromStorage 
} from '../utils/nutritionStorage';

// Cache for loaded nutrition data
let nutritionDatabase = null;

const CUSTOM_FOODS_KEY = 'goodlift_custom_foods';

/**
 * Load the nutrition database from JSON file
 * Pre-computes lowercase fields for faster searching
 * @returns {Promise<Array>} Array of food items
 */
export const loadNutritionDatabase = async () => {
  if (nutritionDatabase) {
    return nutritionDatabase;
  }

  try {
    // Use base URL for proper path resolution in both dev and production
    const basePath = import.meta.env.BASE_URL || '/';
    const dataPath = `${basePath}data/nutrition.json`;
    const response = await fetch(dataPath);
    if (!response.ok) {
      throw new Error('Failed to load nutrition database');
    }
    const rawData = await response.json();
    
    // Pre-compute lowercase fields for faster searching
    nutritionDatabase = rawData.map(food => ({
      ...food,
      _nameLower: food.name.toLowerCase(),
      _tagsLower: (food.tags || '').toLowerCase(),
    }));
    
    return nutritionDatabase;
  } catch (error) {
    console.error('Error loading nutrition database:', error);
    return [];
  }
};

/**
 * Load custom foods from storage (with Firebase sync)
 * @returns {Array} Array of custom food items
 */
export const loadCustomFoods = () => {
  try {
    const rawFoods = getCustomIngredients();
    
    // Pre-compute lowercase fields for faster searching if not already present
    return rawFoods.map(food => ({
      ...food,
      _nameLower: food._nameLower || food.name.toLowerCase(),
      _tagsLower: food._tagsLower || (food.tags || '').toLowerCase(),
    }));
  } catch (error) {
    console.error('Error loading custom foods:', error);
    return [];
  }
};

/**
 * Add a custom food (with Firebase sync)
 * @param {Object} food - Food object with name, calories, protein, carbs, fat, fiber, standard_portion, portion_grams
 * @returns {Object} The added food with generated ID
 */
export const addCustomFood = async (food) => {
  try {
    // Prepare custom food object
    const customFood = {
      name: food.name,
      rank: 50, // Custom foods have medium rank
      category: 'Custom',
      calories: food.calories || 0,
      protein: food.protein || 0,
      carbs: food.carbs || 0,
      fat: food.fat || 0,
      fiber: food.fiber || 0,
      tags: food.tags || '',
      standard_portion: food.standard_portion || '1 serving',
      portion_grams: food.portion_grams || 100,
      portion_factor: (food.portion_grams || 100) / 100,
      volume_amount: food.volume_amount || 1,
      volume_unit: food.volume_unit || 'serving',
      // Pre-compute lowercase fields for search performance
      _nameLower: food.name.toLowerCase(),
      _tagsLower: (food.tags || '').toLowerCase(),
    };

    // Use storage function which handles Firebase sync
    const savedFood = await addCustomIngredientToStorage(customFood);
    return savedFood;
  } catch (error) {
    console.error('Error adding custom food:', error);
    throw error;
  }
};

/**
 * Delete a custom food (with Firebase sync)
 * @param {string} foodId - ID of the custom food to delete
 */
export const deleteCustomFood = async (foodId) => {
  try {
    await deleteCustomIngredientFromStorage(foodId);
  } catch (error) {
    console.error('Error deleting custom food:', error);
    throw error;
  }
};

/**
 * Convert a decimal to a fraction string for display
 * @param {number} decimal - Decimal number to convert
 * @returns {string} Fraction string (e.g., "3/4", "1/2", "1 1/4")
 */
export const decimalToFraction = (decimal) => {
  if (decimal === null || decimal === undefined || isNaN(decimal)) {
    return '0';
  }
  
  // Common fractions to match
  const fractions = [
    { value: 0.125, str: '1/8' },
    { value: 0.25, str: '1/4' },
    { value: 0.333, str: '1/3' },
    { value: 0.375, str: '3/8' },
    { value: 0.5, str: '1/2' },
    { value: 0.625, str: '5/8' },
    { value: 0.666, str: '2/3' },
    { value: 0.75, str: '3/4' },
    { value: 0.875, str: '7/8' },
  ];
  
  const wholePart = Math.floor(decimal);
  const fractionalPart = decimal - wholePart;
  
  // If it's a whole number
  if (fractionalPart < 0.05) {
    return wholePart.toString();
  }
  
  // If it's close to the next whole number
  if (fractionalPart > 0.95) {
    return (wholePart + 1).toString();
  }
  
  // Find closest fraction
  let closestFraction = null;
  let minDiff = Infinity;
  
  for (const frac of fractions) {
    const diff = Math.abs(fractionalPart - frac.value);
    if (diff < minDiff && diff < 0.05) {
      minDiff = diff;
      closestFraction = frac.str;
    }
  }
  
  if (closestFraction) {
    if (wholePart > 0) {
      return `${wholePart} ${closestFraction}`;
    }
    return closestFraction;
  }
  
  // If no close fraction found, return decimal rounded to 2 places
  return decimal.toFixed(2);
};

/**
 * Get all available measurement options for a food
 * @param {Object} food - Food item
 * @returns {Array} Array of measurement options
 */
export const getMeasurementOptions = (food) => {
  const options = [
    {
      label: food.standard_portion,
      grams: food.portion_grams,
      type: 'standard',
      isStandard: true,
    },
    {
      label: 'grams',
      grams: 100,
      type: 'grams',
      isStandard: false,
    },
  ];

  // Add volume measurement if available
  if (food.volume_amount && food.volume_unit) {
    const volumeLabel = `${decimalToFraction(food.volume_amount)} ${food.volume_unit}`;
    options.push({
      label: volumeLabel,
      grams: food.portion_grams,
      type: 'volume',
      isStandard: false,
      volumeAmount: food.volume_amount,
      volumeUnit: food.volume_unit,
    });
  }

  return options;
};

/**
 * Search foods by query string
 * Searches both name and tags, but tags are not visible to users
 * Results are sorted by ranking (higher rank = higher priority)
 * 
 * @param {string} query - Search query
 * @param {Object} options - Search options
 * @param {number} options.maxResults - Maximum number of results (default: 50)
 * @param {boolean} options.includeCustom - Include custom foods (default: true)
 * @returns {Promise<Array>} Array of matching food items, sorted by rank
 */
export const searchFoods = async (query, options = {}) => {
  const { maxResults = 50, includeCustom = true } = options;
  
  if (!query || query.trim().length < 2) {
    return [];
  }

  // Load databases
  const database = await loadNutritionDatabase();
  const custom = includeCustom ? loadCustomFoods() : [];
  
  // Combine databases
  const allFoods = [...database, ...custom];
  
  // Normalize query for searching
  const normalizedQuery = query.toLowerCase().trim();
  const queryTerms = normalizedQuery.split(/\s+/);
  
  // Search and score results
  const results = allFoods
    .map(food => {
      // Use pre-computed lowercase fields for better performance
      const name = food._nameLower || food.name.toLowerCase();
      const tags = food._tagsLower || (food.tags || '').toLowerCase();
      
      let score = 0;
      let matchCount = 0;
      
      // Check each query term
      for (const term of queryTerms) {
        // Exact name match gets highest priority
        if (name === term) {
          score += 1000;
          matchCount++;
        }
        // Name starts with term gets high priority
        else if (name.startsWith(term)) {
          score += 500;
          matchCount++;
        }
        // Name contains term gets medium priority
        else if (name.includes(term)) {
          score += 100;
          matchCount++;
        }
        // Tag match gets lower priority (but still relevant)
        else if (tags.includes(term)) {
          score += 50;
          matchCount++;
        }
      }
      
      // Food must match all terms to be included
      if (matchCount < queryTerms.length) {
        return null;
      }
      
      // Add ranking bonus (foods with higher rank get priority)
      score += food.rank;
      
      return {
        ...food,
        searchScore: score,
      };
    })
    .filter(item => item !== null)
    .sort((a, b) => b.searchScore - a.searchScore)
    .slice(0, maxResults);
  
  return results;
};

/**
 * Get a specific food by ID
 * @param {string|number} foodId - Food ID
 * @returns {Promise<Object|null>} Food item or null if not found
 */
export const getFoodById = async (foodId) => {
  const database = await loadNutritionDatabase();
  const custom = loadCustomFoods();
  const allFoods = [...database, ...custom];
  
  // Convert foodId once before search
  const numericId = typeof foodId === 'string' ? parseInt(foodId, 10) : foodId;
  
  return allFoods.find(food => food.id === foodId || food.id === numericId) || null;
};

/**
 * Search foods by comma-separated terms
 * Returns multiple result sets, one for each search term
 * 
 * @param {string} searchString - Comma-separated search terms
 * @param {Object} options - Search options
 * @returns {Promise<Array>} Array of result sets
 */
export const searchMultipleFoods = async (searchString, options = {}) => {
  const terms = searchString
    .split(',')
    .map(term => term.trim())
    .filter(term => term.length >= 2);
  
  const resultSets = await Promise.all(
    terms.map(term => searchFoods(term, { ...options, maxResults: 10 }))
  );
  
  return resultSets.map((results, index) => ({
    searchTerm: terms[index],
    foods: results,
  }));
};

/**
 * Calculate nutrition for a given amount
 * 
 * All nutrition values in the database are per 100g.
 * The portion_factor is the ratio of portion_grams to 100g.
 * 
 * For standard portion: nutrients = base_nutrients * portion_factor
 * For grams: nutrients = base_nutrients * (grams / 100)
 * 
 * Example: Chicken breast (165 cal per 100g, portion_factor = 1.74 for 174g)
 * - 1 medium breast (174g): 165 * 1.74 = 287 cal
 * - 100g: 165 cal
 * 
 * @param {Object} food - Food item
 * @param {number} grams - Amount in grams
 * @returns {Object} Nutrition values (rounded to nearest whole number)
 */
export const calculateNutrition = (food, grams) => {
  // Calculate multiplier based on 100g (nutrients in database are per 100g)
  const multiplier = grams / 100;
  return {
    calories: Math.round(food.calories * multiplier),
    protein: Math.round(food.protein * multiplier),
    carbs: Math.round(food.carbs * multiplier),
    fat: Math.round(food.fat * multiplier),
    fiber: Math.round(food.fiber * multiplier),
  };
};

/**
 * Calculate nutrition for a standard portion
 * Uses the portion_factor for calculation
 * 
 * @param {Object} food - Food item
 * @param {number} quantity - Number of standard portions (default: 1)
 * @returns {Object} Nutrition values (rounded to nearest whole number)
 */
export const calculateNutritionForPortion = (food, quantity = 1) => {
  const multiplier = food.portion_factor * quantity;
  return {
    calories: Math.round(food.calories * multiplier),
    protein: Math.round(food.protein * multiplier),
    carbs: Math.round(food.carbs * multiplier),
    fat: Math.round(food.fat * multiplier),
    fiber: Math.round(food.fiber * multiplier),
  };
};
