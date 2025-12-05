/**
 * Superset color constants used for color-coded groupings
 */

// Predefined colors for superset groups
export const SUPERSET_COLORS = [
  '#1db584', // Primary green
  '#4299e1', // Blue
  '#ed64a6', // Pink
  '#f6ad55', // Orange
  '#9f7aea', // Purple
  '#48bb78', // Green
  '#fc8181', // Red
  '#63b3ed', // Light blue
];

/**
 * Get color for a superset group
 * @param {number|null} groupId - Superset group ID
 * @returns {string|null} Color for the group
 */
export const getSupersetColor = (groupId) => {
  if (groupId === null || groupId === undefined) return null;
  return SUPERSET_COLORS[groupId % SUPERSET_COLORS.length];
};
