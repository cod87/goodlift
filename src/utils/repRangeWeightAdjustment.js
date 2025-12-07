/**
 * Weight and Rep Range Adjustment Utilities
 * 
 * Based on the weight-and-rep-range-adjustment-logic.md document
 * Uses Percentage of One-Rep Max (1RM) method to calculate weight adjustments
 * when changing between rep ranges.
 */

/**
 * Valid target rep options (only these are allowed)
 */
export const TARGET_REPS_OPTIONS = [6, 8, 10, 12, 15];

/**
 * Default target reps value
 */
export const DEFAULT_TARGET_REPS = 10;

/**
 * Mapping of rep ranges to 1RM percentages
 */
const REP_TO_PERCENTAGE = {
  6: 85,
  8: 80,
  10: 75,
  12: 70,
  15: 65,
};

/**
 * Round weight to the nearest valid increment
 * - For weights ≤35 lbs: Use 2.5 lb increments
 * - For weights >35 lbs: Use 5 lb increments
 * 
 * @param {number} weight - Weight to round
 * @returns {number} Rounded weight
 */
export const roundToNearestIncrement = (weight) => {
  // Ensure minimum weight of 2.5 lbs
  if (weight <= 0) return 2.5;
  
  // Determine increment size based on weight
  const incrementSize = weight <= 35 ? 2.5 : 5;
  
  // Round to nearest increment
  const roundedWeight = Math.round(weight / incrementSize) * incrementSize;
  
  // Ensure minimum of 2.5 lbs
  return Math.max(2.5, roundedWeight);
};

/**
 * Get the next higher weight value based on increment rules
 * - For weights ≤35 lbs: Increment by 2.5 lbs
 * - For weights >35 lbs: Increment by 5 lbs
 * 
 * @param {number} currentWeight - Current weight value
 * @returns {number} Next higher weight value
 */
export const getNextWeight = (currentWeight) => {
  const weight = parseFloat(currentWeight) || 0;
  
  // Determine increment based on current weight
  const increment = weight < 35 ? 2.5 : 5;
  
  return weight + increment;
};

/**
 * Get the next lower weight value based on increment rules
 * - For weights ≤35 lbs: Decrement by 2.5 lbs
 * - For weights >35 lbs: Decrement by 5 lbs
 * 
 * @param {number} currentWeight - Current weight value
 * @returns {number} Next lower weight value (minimum 0)
 */
export const getPreviousWeight = (currentWeight) => {
  const weight = parseFloat(currentWeight) || 0;
  
  if (weight <= 0) return 0;
  
  // For weights at or below 35, use 2.5 lb increments
  // For weights above 35 going down, need to check if we'll cross the threshold
  let increment;
  if (weight <= 35) {
    increment = 2.5;
  } else if (weight - 5 < 35) {
    // If decrementing by 5 would go below 35, step to 35 first
    return 35;
  } else {
    increment = 5;
  }
  
  return Math.max(0, weight - increment);
};

/**
 * Calculate the new target weight when changing rep ranges
 * Uses the formula: New Weight = Current Weight × (Target 1RM % ÷ Current 1RM %)
 * 
 * @param {number} currentWeight - Current weight in lbs
 * @param {number} currentReps - Current target rep range (must be 6, 8, 10, 12, or 15)
 * @param {number} targetReps - New target rep range (must be 6, 8, 10, 12, or 15)
 * @returns {number|null} Calculated new weight rounded to valid increment, or null if inputs invalid
 */
export const calculateWeightForRepChange = (currentWeight, currentReps, targetReps) => {
  // Validate inputs
  if (!currentWeight || currentWeight <= 0) return null;
  if (!TARGET_REPS_OPTIONS.includes(currentReps)) return null;
  if (!TARGET_REPS_OPTIONS.includes(targetReps)) return null;
  
  // Same rep range - no change needed
  if (currentReps === targetReps) return currentWeight;
  
  // Get 1RM percentages
  const currentPercent = REP_TO_PERCENTAGE[currentReps];
  const targetPercent = REP_TO_PERCENTAGE[targetReps];
  
  // Calculate new weight
  const calculatedWeight = currentWeight * (targetPercent / currentPercent);
  
  // Round to nearest valid increment
  return roundToNearestIncrement(calculatedWeight);
};

/**
 * Get the percentage change description when moving between rep ranges
 * 
 * @param {number} currentReps - Current target rep range
 * @param {number} targetReps - New target rep range
 * @returns {string} Description of the weight change (e.g., "+13% weight" or "-7% weight")
 */
export const getRepChangeDescription = (currentReps, targetReps) => {
  if (!TARGET_REPS_OPTIONS.includes(currentReps) || !TARGET_REPS_OPTIONS.includes(targetReps)) {
    return '';
  }
  
  if (currentReps === targetReps) return 'No change';
  
  const currentPercent = REP_TO_PERCENTAGE[currentReps];
  const targetPercent = REP_TO_PERCENTAGE[targetReps];
  
  // Guard against division by zero (should never happen with our valid percentages)
  if (currentPercent === 0) return '';
  
  const percentChange = ((targetPercent - currentPercent) / currentPercent) * 100;
  
  // When target percent is higher (moving to fewer reps), weight is HEAVIER
  // When target percent is lower (moving to more reps), weight is LIGHTER
  if (percentChange > 0) {
    return `${Math.round(percentChange)}% heavier`;
  } else {
    return `${Math.abs(Math.round(percentChange))}% lighter`;
  }
};

/**
 * Validate if a rep value is a valid target rep option
 * 
 * @param {number} reps - Rep value to validate
 * @returns {boolean} True if valid target rep option
 */
export const isValidTargetReps = (reps) => {
  return TARGET_REPS_OPTIONS.includes(reps);
};

/**
 * Get the closest valid target rep value
 * 
 * @param {number} reps - Rep value to convert
 * @returns {number} Closest valid target rep option
 */
export const getClosestValidTargetReps = (reps) => {
  if (!reps || typeof reps !== 'number') return DEFAULT_TARGET_REPS;
  
  // Find the closest valid option
  let closest = TARGET_REPS_OPTIONS[0];
  let minDiff = Math.abs(reps - closest);
  
  for (const option of TARGET_REPS_OPTIONS) {
    const diff = Math.abs(reps - option);
    if (diff < minDiff) {
      minDiff = diff;
      closest = option;
    }
  }
  
  return closest;
};

/**
 * Generate an array of valid weight options for selection
 * Uses 2.5 lb increments up to 35 lbs, then 5 lb increments
 * 
 * @param {number} maxWeight - Maximum weight to include (default 500)
 * @returns {number[]} Array of valid weight values
 */
export const generateWeightOptions = (maxWeight = 500) => {
  const weights = [];
  
  // 2.5 lb increments up to 35 lbs
  for (let w = 2.5; w <= 35; w += 2.5) {
    weights.push(w);
  }
  
  // 5 lb increments above 35 lbs
  for (let w = 40; w <= maxWeight; w += 5) {
    weights.push(w);
  }
  
  return weights;
};
