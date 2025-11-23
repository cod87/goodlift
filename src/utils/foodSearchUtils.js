/**
 * Food search utility functions for Open Food Facts API
 * Configuration constants and helper utilities for nutrition tracking
 */

// Configuration constants for food search
export const FOOD_SEARCH_CONFIG = {
  API_PAGE_SIZE: 25,   // Number of results to fetch from Open Food Facts API
  MAX_RESULTS: 20,     // Maximum number of results to display
  DEBOUNCE_MS: 300,    // Debounce delay for autocomplete (300ms for responsive UI)
};
