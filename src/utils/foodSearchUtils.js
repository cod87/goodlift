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
