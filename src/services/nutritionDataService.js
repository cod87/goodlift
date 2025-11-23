/**
 * Nutrition Data Service
 * 
 * Provides access to the nutrition-700.json local database
 * Supports:
 * - Search with ranking (higher rank = more relevant)
 * - Tag-based search (tags not visible to users)
 * - Standard portions with multiple measurement options
 * - Custom food persistence
 */

// Cache for loaded nutrition data
let nutritionDatabase = null;
let customFoods = [];

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
    const response = await fetch('data/nutrition-700.json');
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
 * Load custom foods from localStorage
 * @returns {Array} Array of custom food items
 */
export const loadCustomFoods = () => {
  try {
    const stored = localStorage.getItem(CUSTOM_FOODS_KEY);
    const rawFoods = stored ? JSON.parse(stored) : [];
    
    // Pre-compute lowercase fields for faster searching if not already present
    customFoods = rawFoods.map(food => ({
      ...food,
      _nameLower: food._nameLower || food.name.toLowerCase(),
      _tagsLower: food._tagsLower || (food.tags || '').toLowerCase(),
    }));
    
    return customFoods;
  } catch (error) {
    console.error('Error loading custom foods:', error);
    return [];
  }
};

/**
 * Save custom foods to localStorage
 * @param {Array} foods - Array of custom food items
 */
const saveCustomFoods = (foods) => {
  try {
    localStorage.setItem(CUSTOM_FOODS_KEY, JSON.stringify(foods));
    customFoods = foods;
  } catch (error) {
    console.error('Error saving custom foods:', error);
  }
};

/**
 * Add a custom food
 * @param {Object} food - Food object with name, calories, protein, carbs, fat, fiber, standard_portion, portion_grams
 * @returns {Object} The added food with generated ID
 */
export const addCustomFood = (food) => {
  const foods = loadCustomFoods();
  
  // Generate a more robust ID using timestamp and random component
  const randomPart = Math.random().toString(36).slice(2, 11);
  const customFood = {
    id: `custom_${Date.now()}_${randomPart}`,
    name: food.name,
    rank: 50, // Custom foods have medium rank
    category: 'Custom',
    calories: food.calories || 0,
    protein: food.protein || 0,
    carbs: food.carbs || 0,
    fat: food.fat || 0,
    fiber: food.fiber || 0,
    tags: food.tags || '',
    standard_portion: food.standard_portion || '100g',
    portion_grams: food.portion_grams || 100,
    portion_factor: (food.portion_grams || 100) / 100,
    volume_amount: food.volume_amount || 1,
    volume_unit: food.volume_unit || 'serving',
    isCustom: true,
    createdAt: new Date().toISOString(),
    // Pre-compute lowercase fields for search performance
    _nameLower: food.name.toLowerCase(),
    _tagsLower: (food.tags || '').toLowerCase(),
  };

  foods.push(customFood);
  saveCustomFoods(foods);
  
  return customFood;
};

/**
 * Delete a custom food
 * @param {string} foodId - ID of the custom food to delete
 */
export const deleteCustomFood = (foodId) => {
  const foods = loadCustomFoods();
  const filtered = foods.filter(f => f.id !== foodId);
  saveCustomFoods(filtered);
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
      isStandard: true,
    },
    {
      label: '100g',
      grams: 100,
      isStandard: false,
    },
  ];

  // Add volume measurement if available
  if (food.volume_amount && food.volume_unit) {
    options.push({
      label: `${food.volume_amount} ${food.volume_unit}`,
      grams: food.portion_grams,
      isStandard: false,
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
 * CRITICAL: All nutrition values in the database are per standard portion (portion_grams),
 * NOT per 100g. For example, chicken breast has 165 cal per 174g (standard portion).
 * 
 * Formula: multiplier = user_grams / standard_portion_grams
 * 
 * @param {Object} food - Food item
 * @param {number} grams - Amount in grams
 * @returns {Object} Nutrition values
 */
export const calculateNutrition = (food, grams) => {
  // Calculate multiplier based on standard portion, not 100g
  const multiplier = grams / food.portion_grams;
  return {
    calories: food.calories * multiplier,
    protein: food.protein * multiplier,
    carbs: food.carbs * multiplier,
    fat: food.fat * multiplier,
    fiber: food.fiber * multiplier,
  };
};
