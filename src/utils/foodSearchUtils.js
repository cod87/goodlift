/**
 * Food search utility functions for flexible keyword-based matching
 * These utilities help improve search results by matching foods regardless of word order
 */

// Configuration constants for food search
export const FOOD_SEARCH_CONFIG = {
  API_PAGE_SIZE: 25,  // Number of results to fetch from API for client-side filtering
  MAX_RESULTS: 5,     // Maximum number of results to display to user
};

// Allowed USDA dataTypes for nutrition search
export const ALLOWED_DATA_TYPES = ['Foundation', 'SR Legacy'];

/**
 * Flexible keyword-based food matching helper
 * Splits the query into keywords and checks if a food description contains all keywords
 * in any order (case-insensitive). This allows queries like 'chickpeas canned' to match
 * 'canned chickpeas' and vice versa.
 * 
 * @param {string} foodDescription - The food description to match against
 * @param {string[]} keywords - Array of search keywords
 * @returns {boolean} - True if all keywords are found in the description
 */
export const matchesAllKeywords = (foodDescription, keywords) => {
  const lowerDesc = foodDescription.toLowerCase();
  return keywords.every(keyword => lowerDesc.includes(keyword.toLowerCase()));
};

/**
 * Parse a search query into keywords for flexible matching
 * Splits the query on whitespace and filters out empty strings
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
