/**
 * Weight tracking utilities
 */

/**
 * Convert weight between units
 * @param {number} weight - Weight value
 * @param {string} fromUnit - Source unit ('lbs' or 'kg')
 * @param {string} toUnit - Target unit ('lbs' or 'kg')
 * @returns {number} Converted weight
 */
export const convertWeight = (weight, fromUnit, toUnit) => {
  if (!weight || fromUnit === toUnit) return weight;
  
  if (fromUnit === 'lbs' && toUnit === 'kg') {
    return Math.round(weight * 0.453592 * 10) / 10; // Round to 1 decimal
  } else if (fromUnit === 'kg' && toUnit === 'lbs') {
    return Math.round(weight * 2.20462 * 10) / 10; // Round to 1 decimal
  }
  
  return weight;
};

/**
 * Get weight history for last N days
 * @param {Array} weightHistory - Full weight history
 * @param {number} days - Number of days to include (default 30)
 * @returns {Array} Filtered weight history
 */
export const getRecentWeightHistory = (weightHistory, days = 30) => {
  if (!weightHistory || weightHistory.length === 0) return [];
  
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);
  
  return weightHistory.filter(entry => {
    const entryDate = new Date(entry.date);
    return entryDate >= cutoffDate;
  }).sort((a, b) => new Date(a.date) - new Date(b.date));
};

/**
 * Calculate weight change over period
 * @param {Array} weightHistory - Weight history array
 * @param {number} days - Number of days to look back (default 30)
 * @returns {Object} Change data {change: number, percentage: number, direction: 'up'|'down'|'stable'}
 */
export const calculateWeightChange = (weightHistory, days = 30) => {
  if (!weightHistory || weightHistory.length < 2) {
    return { change: 0, percentage: 0, direction: 'stable' };
  }
  
  const recentHistory = getRecentWeightHistory(weightHistory, days);
  
  if (recentHistory.length < 2) {
    return { change: 0, percentage: 0, direction: 'stable' };
  }
  
  const oldest = recentHistory[0];
  const latest = recentHistory[recentHistory.length - 1];
  
  // Convert both to same unit (use latest's unit)
  const oldestWeight = convertWeight(oldest.weight, oldest.unit, latest.unit);
  const latestWeight = latest.weight;
  
  const change = latestWeight - oldestWeight;
  const percentage = oldestWeight !== 0 ? (change / oldestWeight) * 100 : 0;
  
  let direction = 'stable';
  if (Math.abs(change) > 0.5) { // Consider changes > 0.5 units significant
    direction = change > 0 ? 'up' : 'down';
  }
  
  return {
    change: Math.round(change * 10) / 10,
    percentage: Math.round(percentage * 10) / 10,
    direction,
  };
};

/**
 * Format weight for display
 * @param {number} weight - Weight value
 * @param {string} unit - Unit ('lbs' or 'kg')
 * @returns {string} Formatted weight string
 */
export const formatWeight = (weight, unit = 'lbs') => {
  if (!weight) return `0 ${unit}`;
  return `${Math.round(weight * 10) / 10} ${unit}`;
};

/**
 * Validate weight input
 * @param {number} weight - Weight value to validate
 * @param {string} unit - Unit ('lbs' or 'kg')
 * @returns {Object} Validation result {valid: boolean, error: string}
 */
export const validateWeight = (weight, unit = 'lbs') => {
  if (!weight || isNaN(weight)) {
    return { valid: false, error: 'Please enter a valid weight' };
  }
  
  const numWeight = parseFloat(weight);
  
  if (numWeight <= 0) {
    return { valid: false, error: 'Weight must be greater than 0' };
  }
  
  // Reasonable ranges
  const minWeight = unit === 'lbs' ? 50 : 20;
  const maxWeight = unit === 'lbs' ? 1000 : 450;
  
  if (numWeight < minWeight || numWeight > maxWeight) {
    return { 
      valid: false, 
      error: `Weight must be between ${minWeight} and ${maxWeight} ${unit}` 
    };
  }
  
  return { valid: true };
};

/**
 * Prepare weight data for Chart.js
 * @param {Array} weightHistory - Weight history array
 * @param {number} days - Number of days to include
 * @param {string} targetUnit - Target unit for display
 * @returns {Object} Chart data {labels: Array, data: Array}
 */
export const prepareWeightChartData = (weightHistory, days = 30, targetUnit = 'lbs') => {
  const recentHistory = getRecentWeightHistory(weightHistory, days);
  
  if (recentHistory.length === 0) {
    return { labels: [], data: [] };
  }
  
  const labels = recentHistory.map(entry => {
    const date = new Date(entry.date);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  });
  
  const data = recentHistory.map(entry => {
    return convertWeight(entry.weight, entry.unit, targetUnit);
  });
  
  return { labels, data };
};

/**
 * Get weight statistics
 * @param {Array} weightHistory - Weight history array
 * @param {string} targetUnit - Target unit for calculations
 * @returns {Object} Stats {min, max, average, current, entries}
 */
export const getWeightStats = (weightHistory, targetUnit = 'lbs') => {
  if (!weightHistory || weightHistory.length === 0) {
    return { min: 0, max: 0, average: 0, current: 0, entries: 0 };
  }
  
  const weights = weightHistory.map(entry => 
    convertWeight(entry.weight, entry.unit, targetUnit)
  );
  
  const min = Math.min(...weights);
  const max = Math.max(...weights);
  const sum = weights.reduce((acc, w) => acc + w, 0);
  const average = sum / weights.length;
  const current = weights[weights.length - 1];
  
  return {
    min: Math.round(min * 10) / 10,
    max: Math.round(max * 10) / 10,
    average: Math.round(average * 10) / 10,
    current: Math.round(current * 10) / 10,
    entries: weights.length,
  };
};
