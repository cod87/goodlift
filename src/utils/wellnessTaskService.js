/**
 * Wellness Task Service
 * 
 * Manages wellness task selection, filtering, and tracking
 */

import wellnessTasksData from '../data/wellness_tasks.json';

/**
 * Get all available wellness task categories
 */
export const getWellnessCategories = () => {
  return wellnessTasksData.categories;
};

/**
 * Get a random wellness task based on preferences
 * @param {Object} options - Filter options
 * @param {string} options.timing - 'Daily', 'Weekly', or 'Holiday'
 * @param {string[]} options.categories - Selected categories to filter by
 * @param {string} options.relationshipStatus - 'All', 'Single', 'In Relationship'
 * @param {string} options.holiday - Specific holiday name (for holiday tasks)
 * @returns {Object|null} Random wellness task or null if no matches
 */
export const getRandomWellnessTask = (options = {}) => {
  const {
    timing = 'Daily',
    categories = [],
    relationshipStatus = 'All',
    holiday = null,
  } = options;

  let filteredTasks = wellnessTasksData.tasks.filter(task => {
    // Filter by timing
    if (timing && task.timing !== timing) {
      return false;
    }

    // Filter by relationship status
    if (task.relationshipStatus !== 'All' && task.relationshipStatus !== relationshipStatus) {
      return false;
    }

    // Filter by holiday if specified
    if (timing === 'Holiday' && holiday && task.holiday !== holiday) {
      return false;
    }

    // Filter by categories if specified
    if (categories.length > 0) {
      const hasMatchingCategory = task.categories.some(cat => categories.includes(cat));
      if (!hasMatchingCategory) {
        return false;
      }
    }

    return true;
  });

  // If no tasks match the criteria, return null
  if (filteredTasks.length === 0) {
    return null;
  }

  // Return a random task from filtered list
  const randomIndex = Math.floor(Math.random() * filteredTasks.length);
  return filteredTasks[randomIndex];
};

/**
 * Get today's wellness task based on user preferences
 * This function ensures the same task is shown throughout the day by using date as seed
 * @param {Object} preferences - User preferences
 * @returns {Object|null} Today's wellness task
 */
export const getTodaysWellnessTask = (preferences = {}) => {
  const {
    enabledCategories = [],
    relationshipStatus = 'All',
  } = preferences;

  // Use today's date as a seed for consistent task selection
  const today = new Date().toISOString().split('T')[0];
  const seed = today.split('-').reduce((sum, val) => sum + parseInt(val, 10), 0);

  let filteredTasks = wellnessTasksData.tasksByTiming.daily.filter(task => {
    // Filter by relationship status
    if (task.relationshipStatus !== 'All' && task.relationshipStatus !== relationshipStatus) {
      return false;
    }

    // Filter by categories if specified
    if (enabledCategories.length > 0) {
      const hasMatchingCategory = task.categories.some(cat => enabledCategories.includes(cat));
      if (!hasMatchingCategory) {
        return false;
      }
    }

    return true;
  });

  if (filteredTasks.length === 0) {
    return null;
  }

  // Use seed to get consistent task for the day
  const index = seed % filteredTasks.length;
  return filteredTasks[index];
};

/**
 * Get this week's wellness task (sent on Sunday)
 * @param {Object} preferences - User preferences
 * @returns {Object|null} This week's wellness task
 */
export const getWeeklyWellnessTask = (preferences = {}) => {
  const {
    enabledCategories = [],
    relationshipStatus = 'All',
  } = preferences;

  // Use week number as seed for consistent task selection
  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const weekNumber = Math.ceil(((now - startOfYear) / 86400000 + startOfYear.getDay() + 1) / 7);

  let filteredTasks = wellnessTasksData.tasksByTiming.weekly.filter(task => {
    if (task.relationshipStatus !== 'All' && task.relationshipStatus !== relationshipStatus) {
      return false;
    }

    if (enabledCategories.length > 0) {
      const hasMatchingCategory = task.categories.some(cat => enabledCategories.includes(cat));
      if (!hasMatchingCategory) {
        return false;
      }
    }

    return true;
  });

  if (filteredTasks.length === 0) {
    return null;
  }

  const index = weekNumber % filteredTasks.length;
  return filteredTasks[index];
};

/**
 * Get holiday-specific wellness tasks within a week of the holiday
 * @param {string} holiday - Holiday name
 * @param {Object} preferences - User preferences
 * @returns {Object|null} Holiday wellness task
 */
export const getHolidayWellnessTask = (holiday, preferences = {}) => {
  const {
    enabledCategories = [],
    relationshipStatus = 'All',
  } = preferences;

  let filteredTasks = wellnessTasksData.tasksByTiming.holiday.filter(task => {
    if (task.holiday !== holiday) {
      return false;
    }

    if (task.relationshipStatus !== 'All' && task.relationshipStatus !== relationshipStatus) {
      return false;
    }

    if (enabledCategories.length > 0) {
      const hasMatchingCategory = task.categories.some(cat => enabledCategories.includes(cat));
      if (!hasMatchingCategory) {
        return false;
      }
    }

    return true;
  });

  if (filteredTasks.length === 0) {
    return null;
  }

  const randomIndex = Math.floor(Math.random() * filteredTasks.length);
  return filteredTasks[randomIndex];
};

/**
 * Save completed wellness task
 * @param {string} taskId - Task ID
 * @param {string} userId - User ID (optional, uses localStorage for guests)
 * @returns {Promise<void>}
 */
export const saveCompletedTask = async (taskId, userId = null) => {
  try {
    const storageKey = userId ? `wellness_completed_${userId}` : 'wellness_completed_guest';
    const existingData = localStorage.getItem(storageKey);
    const completed = existingData ? JSON.parse(existingData) : [];
    
    const completionRecord = {
      taskId,
      completedAt: new Date().toISOString(),
    };
    
    completed.push(completionRecord);
    localStorage.setItem(storageKey, JSON.stringify(completed));
  } catch (error) {
    console.error('Error saving completed task:', error);
  }
};

/**
 * Get count of completed wellness tasks
 * @param {string} userId - User ID (optional)
 * @returns {number} Count of completed tasks
 */
export const getCompletedTaskCount = (userId = null) => {
  try {
    const storageKey = userId ? `wellness_completed_${userId}` : 'wellness_completed_guest';
    const existingData = localStorage.getItem(storageKey);
    const completed = existingData ? JSON.parse(existingData) : [];
    return completed.length;
  } catch (error) {
    console.error('Error getting completed task count:', error);
    return 0;
  }
};

/**
 * Get completed wellness tasks history
 * @param {string} userId - User ID (optional)
 * @returns {Array} Array of completion records
 */
export const getCompletedTasksHistory = (userId = null) => {
  try {
    const storageKey = userId ? `wellness_completed_${userId}` : 'wellness_completed_guest';
    const existingData = localStorage.getItem(storageKey);
    return existingData ? JSON.parse(existingData) : [];
  } catch (error) {
    console.error('Error getting completed tasks history:', error);
    return [];
  }
};

/**
 * Whether we should show the wellness task on app open for this user/guest.
 * Conditions:
 * - Current local time is on/after 05:00
 * - We have not already shown the wellness modal today for this user/guest
 */
export const shouldShowWellnessOnOpen = (userId = null) => {
  try {
    const now = new Date();
    // Only after 5:00 local time
    if (now.getHours() < 5) return false;

    const today = now.toISOString().split('T')[0];
    const storageKey = userId ? `wellness_last_shown_${userId}` : 'wellness_last_shown_guest';
    const existing = localStorage.getItem(storageKey);
    if (!existing) return true;
    return existing !== today;
  } catch (err) {
    console.error('Error checking wellness on-open status:', err);
    // Fail-safe: don't block showing
    return true;
  }
};

/**
 * Mark the wellness modal as shown for today for this user/guest
 */
export const markWellnessShown = (userId = null) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const storageKey = userId ? `wellness_last_shown_${userId}` : 'wellness_last_shown_guest';
    localStorage.setItem(storageKey, today);
  } catch (err) {
    console.error('Error marking wellness shown:', err);
  }
};

export default {
  getWellnessCategories,
  getRandomWellnessTask,
  getTodaysWellnessTask,
  getWeeklyWellnessTask,
  getHolidayWellnessTask,
  saveCompletedTask,
  getCompletedTaskCount,
  getCompletedTasksHistory,
  shouldShowWellnessOnOpen,
  markWellnessShown,
};
