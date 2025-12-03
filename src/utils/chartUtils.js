/**
 * Chart utilities for y-axis calculation and label positioning
 */

/**
 * Calculate the maximum y-axis value based on data
 * Logic: Add 50 to the maximum value, then round to the nearest multiple of 50
 * 
 * @param {number[]} dataValues - Array of data values from one or more charts
 * @returns {number} The calculated y-axis maximum
 */
export const calculateYAxisMax = (dataValues) => {
  if (!dataValues || dataValues.length === 0) {
    return 100; // Default value when no data
  }
  
  const maxValue = Math.max(...dataValues.filter(v => typeof v === 'number' && !isNaN(v)));
  
  if (maxValue <= 0 || !isFinite(maxValue)) {
    return 100; // Default for edge cases
  }
  
  // Add 50 to the maximum value, then round to nearest multiple of 50
  const rawMax = maxValue + 50;
  return Math.ceil(rawMax / 50) * 50;
};

/**
 * Determine if a data label should be displayed below the point instead of above
 * This is needed when the label would be cut off at the top of the chart
 * 
 * @param {number} dataValue - The value at the data point
 * @param {number} yAxisMax - The maximum value of the y-axis
 * @param {number} threshold - Percentage of yAxisMax that triggers below positioning (default 0.9 = 90%)
 * @returns {string} 'top' for above the point, 'bottom' for below the point
 */
export const getLabelPosition = (dataValue, yAxisMax, threshold = 0.9) => {
  if (typeof dataValue !== 'number' || typeof yAxisMax !== 'number') {
    return 'top';
  }
  
  // If the data value is above the threshold percentage of the y-axis max,
  // display the label below the point to avoid cutting off
  const cutoffValue = yAxisMax * threshold;
  return dataValue >= cutoffValue ? 'bottom' : 'top';
};

/**
 * Get the anchor position for a data label based on its position relative to y-axis max
 * 
 * @param {number} dataValue - The value at the data point
 * @param {number} yAxisMax - The maximum value of the y-axis
 * @param {number} threshold - Percentage of yAxisMax that triggers repositioning (default 0.9 = 90%)
 * @returns {string} 'end' for above, 'start' for below
 */
export const getLabelAnchor = (dataValue, yAxisMax, threshold = 0.9) => {
  const position = getLabelPosition(dataValue, yAxisMax, threshold);
  return position === 'bottom' ? 'start' : 'end';
};

/**
 * Create a Chart.js datalabels formatter function that adjusts label alignment
 * based on value proximity to y-axis maximum
 * 
 * @param {number} yAxisMax - The maximum value of the y-axis
 * @param {number} threshold - Percentage threshold for repositioning (default 0.9)
 * @returns {Function} Formatter function for chartjs-plugin-datalabels
 */
export const createLabelAlignmentConfig = (yAxisMax, threshold = 0.9) => {
  return {
    align: (context) => {
      const value = context.dataset.data[context.dataIndex];
      return getLabelPosition(value, yAxisMax, threshold);
    },
    anchor: (context) => {
      const value = context.dataset.data[context.dataIndex];
      return getLabelAnchor(value, yAxisMax, threshold);
    },
  };
};
