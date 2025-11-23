/**
 * Food search utility functions for flexible keyword-based matching
 * These utilities help improve search results by matching foods regardless of word order
 * 
 * Search Strategy:
 * 1. Prioritize SR Legacy foods first (most comprehensive database)
 * 2. Fall back to Foundation foods for additional results
 * 3. Use fuzzy/partial matching to increase result coverage
 * 4. Support out-of-order keyword matching
 */

// Configuration constants for food search
export const FOOD_SEARCH_CONFIG = {
  API_PAGE_SIZE: 50,  // Number of results to fetch from API for client-side filtering (increased for better coverage)
  MAX_RESULTS: 10,     // Maximum number of results to display per data type
  DEBOUNCE_MS: 300,    // Debounce delay for autocomplete (reduced from 500ms for faster response)
};

// Allowed USDA dataTypes for nutrition search
export const ALLOWED_DATA_TYPES = ['Foundation', 'SR Legacy'];

/**
 * Flexible keyword-based food matching helper with fuzzy/partial matching
 * Splits the query into keywords and checks if a food description contains all keywords
 * in any order (case-insensitive). 
 * 
 * Features:
 * - Out-of-order matching: 'chickpeas canned' matches 'canned chickpeas'
 * - Partial word matching: 'chick' matches 'chickpeas'
 * - Fuzzy matching: handles plurals, variations, and substrings
 * 
 * @param {string} foodDescription - The food description to match against
 * @param {string[]} keywords - Array of search keywords
 * @returns {boolean} - True if all keywords are found in the description
 */
export const matchesAllKeywords = (foodDescription, keywords) => {
  const lowerDesc = foodDescription.toLowerCase();
  // Each keyword must match somewhere in the description
  // This provides partial/fuzzy matching naturally
  return keywords.every(keyword => lowerDesc.includes(keyword.toLowerCase()));
};

/**
 * Parse a search query into keywords for flexible matching
 * Splits the query on whitespace and filters out empty strings
 * Short words (1-2 chars) are kept to support common food abbreviations
 * 
 * @param {string} query - The search query string
 * @returns {string[]} - Array of keywords
 */
export const parseSearchKeywords = (query) => {
  return query.trim().split(/\s+/).filter(k => k.length > 0);
};

/**
 * Filter foods by dataType to include only Foundation and SR Legacy
 * This ensures that only high-quality, non-branded USDA foods are shown
 * 
 * @param {Object} food - Food object from USDA API
 * @returns {boolean} - True if food has an allowed dataType (Foundation or SR Legacy)
 */
export const hasAllowedDataType = (food) => {
  const dataType = food.dataType || '';
  return ALLOWED_DATA_TYPES.includes(dataType);
};

/**
 * Filter foods to include only Foundation dataType
 * Used for initial search results to show highest quality foods first
 * 
 * @param {Object} food - Food object from USDA API
 * @returns {boolean} - True if food has Foundation dataType
 */
export const isFoundationFood = (food) => {
  const dataType = food.dataType || '';
  return dataType === 'Foundation';
};

/**
 * Filter foods to include only SR Legacy dataType
 * Used for extended search results
 * 
 * @param {Object} food - Food object from USDA API
 * @returns {boolean} - True if food has SR Legacy dataType
 */
export const isSRLegacyFood = (food) => {
  const dataType = food.dataType || '';
  return dataType === 'SR Legacy';
};

/**
 * Meat and seafood keywords for intelligent search query building
 * These foods should prioritize cooked forms and exclude raw forms
 */
const MEAT_SEAFOOD_KEYWORDS = [
  'chicken', 'beef', 'pork', 'lamb', 'turkey', 'duck', 'veal', 'venison',
  'fish', 'salmon', 'tuna', 'cod', 'tilapia', 'halibut', 'trout', 'bass',
  'shrimp', 'prawn', 'crab', 'lobster', 'scallop', 'oyster', 'mussel', 'clam',
  'sausage', 'bacon', 'ham', 'steak', 'ground beef', 'ground turkey', 'ground chicken',
];

/**
 * Vegetable and fruit keywords
 * These foods should allow both raw and cooked forms
 */
const VEGETABLE_FRUIT_KEYWORDS = [
  'carrot', 'broccoli', 'spinach', 'kale', 'lettuce', 'tomato', 'cucumber',
  'pepper', 'onion', 'garlic', 'potato', 'sweet potato', 'squash', 'zucchini',
  'cauliflower', 'cabbage', 'celery', 'asparagus', 'green beans', 'peas',
  'apple', 'banana', 'orange', 'grape', 'strawberry', 'blueberry', 'raspberry',
  'melon', 'watermelon', 'pear', 'peach', 'plum', 'cherry', 'mango', 'pineapple',
];

/**
 * Cooking method terms to add to meat/seafood searches
 */
const COOKING_METHODS = ['cooked', 'roasted', 'boiled', 'steamed', 'baked', 'grilled', 'sautéed'];

/**
 * Detect if a search query is for meat or seafood
 * @param {string} query - The search query
 * @returns {boolean} - True if query contains meat/seafood keywords
 */
export const isMeatOrSeafood = (query) => {
  const lowerQuery = query.toLowerCase();
  return MEAT_SEAFOOD_KEYWORDS.some(keyword => lowerQuery.includes(keyword));
};

/**
 * Detect if a search query is for vegetables or fruits
 * @param {string} query - The search query
 * @returns {boolean} - True if query contains vegetable/fruit keywords
 */
export const isVegetableOrFruit = (query) => {
  const lowerQuery = query.toLowerCase();
  return VEGETABLE_FRUIT_KEYWORDS.some(keyword => lowerQuery.includes(keyword));
};

/**
 * Build an optimized search query for USDA API based on food type
 * For meats/seafood: prioritize cooked forms and exclude raw
 * For vegetables/fruits: search by name only (allows raw and cooked)
 * 
 * @param {string} query - The original search query
 * @returns {string} - The optimized search query for USDA API
 */
export const buildOptimizedQuery = (query) => {
  // For meat/seafood, build a query that prioritizes cooked forms
  if (isMeatOrSeafood(query)) {
    // Extract base food name (remove existing cooking terms if any)
    let baseName = query.toLowerCase();
    COOKING_METHODS.forEach(method => {
      baseName = baseName.replace(method, '').trim();
    });
    
    // Remove 'raw' and 'uncooked' if present
    baseName = baseName.replace(/\b(raw|uncooked)\b/g, '').trim();
    
    // Build query with cooking methods and exclusions
    // Format: description:+chicken +(cooked OR roasted OR boiled OR ...) -(raw OR uncooked)
    const cookingMethodsOr = COOKING_METHODS.join(' OR ');
    return `description:+${baseName} +(${cookingMethodsOr}) -(raw OR uncooked)`;
  }
  
  // For vegetables/fruits and other foods, use simple search
  // This allows both raw and cooked forms to appear
  return query;
};

/**
 * Deduplicate food results by removing near-identical entries
 * Collapses entries with very similar descriptions
 * 
 * @param {Array} foods - Array of food objects
 * @returns {Array} - Deduplicated array of food objects
 */
export const deduplicateFoods = (foods) => {
  const seen = new Set();
  return foods.filter(food => {
    // Normalize description for comparison
    const normalized = food.description
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .replace(/,/g, '')
      .trim();
    
    if (seen.has(normalized)) {
      return false;
    }
    seen.add(normalized);
    return true;
  });
};

/**
 * Score food relevance for sorting
 * Prioritizes cooked meats and common forms
 * 
 * @param {Object} food - Food object
 * @param {string} query - Original search query
 * @returns {number} - Relevance score (higher is better)
 */
export const scoreFoodRelevance = (food, query) => {
  const desc = food.description.toLowerCase();
  const lowerQuery = query.toLowerCase();
  let score = 0;
  
  // Exact match bonus
  if (desc === lowerQuery) {
    score += 100;
  }
  
  // Starts with query bonus
  if (desc.startsWith(lowerQuery)) {
    score += 50;
  }
  
  // For meats, bonus for cooked forms
  if (isMeatOrSeafood(query)) {
    COOKING_METHODS.forEach(method => {
      if (desc.includes(method)) {
        score += 30;
      }
    });
    
    // Penalty for raw forms
    if (desc.includes('raw') || desc.includes('uncooked')) {
      score -= 50;
    }
  }
  
  // Penalty for overly complex descriptions
  const wordCount = desc.split(/\s+/).length;
  if (wordCount > 8) {
    score -= 10;
  }
  
  return score;
};

/**
 * Sort foods by relevance
 * @param {Array} foods - Array of food objects
 * @param {string} query - Original search query
 * @returns {Array} - Sorted array of food objects
 */
export const sortByRelevance = (foods, query) => {
  return foods
    .map(food => ({
      ...food,
      relevanceScore: scoreFoodRelevance(food, query),
    }))
    .sort((a, b) => b.relevanceScore - a.relevanceScore);
};
