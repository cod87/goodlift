/**
 * PlanDays Model
 * 
 * Simplified flat data structure for workout plan days.
 * Contains id, plan_id, day_name, order
 * 
 * This model provides CRUD operations for plan days with clear function names
 * and integrates with localStorage/Firebase storage patterns used in this app.
 */

import { getCurrentUserId } from '../utils/storage.js';
import { isGuestMode, getGuestData, setGuestData } from '../utils/guestStorage.js';
import { 
  savePlanDaysToFirebase, 
  loadPlanDaysFromFirebase 
} from '../utils/firebaseStorage.js';

/** Storage key for plan days in localStorage */
const PLAN_DAYS_KEY = 'goodlift_plan_days';

/**
 * Generate a unique plan day ID
 * @returns {string} Unique plan day ID
 */
const generateDayId = () => {
  return `day_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
};

/**
 * Get all plan days from storage
 * @returns {Promise<Array>} Array of plan day objects
 */
export const getPlanDays = async () => {
  try {
    // Check if in guest mode first
    if (isGuestMode()) {
      const guestData = getGuestData('plan_days');
      return guestData || [];
    }

    const userId = getCurrentUserId();

    // Try Firebase first if user is authenticated
    if (userId) {
      try {
        const firebaseData = await loadPlanDaysFromFirebase(userId);
        if (firebaseData) {
          // Update localStorage cache for offline access
          localStorage.setItem(PLAN_DAYS_KEY, JSON.stringify(firebaseData));
          return firebaseData;
        }
      } catch (error) {
        console.error('Firebase fetch failed, using localStorage:', error);
      }
    }

    // Fallback to localStorage
    const days = localStorage.getItem(PLAN_DAYS_KEY);
    return days ? JSON.parse(days) : [];
  } catch (error) {
    console.error('Error reading plan days:', error);
    return [];
  }
};

/**
 * Get plan days for a specific plan
 * @param {string} planId - Plan ID to get days for
 * @returns {Promise<Array>} Array of plan day objects for the specified plan
 */
export const getDaysForPlan = async (planId) => {
  try {
    if (!planId) {
      throw new Error('Plan ID is required');
    }

    const allDays = await getPlanDays();
    return allDays
      .filter(d => d.plan_id === planId)
      .sort((a, b) => a.order - b.order);
  } catch (error) {
    console.error('Error getting days for plan:', error);
    return [];
  }
};

/**
 * Get a specific plan day by ID
 * @param {string} dayId - Plan day ID to retrieve
 * @returns {Promise<Object|null>} Plan day object or null if not found
 */
export const getDay = async (dayId) => {
  try {
    if (!dayId) {
      throw new Error('Day ID is required');
    }

    const days = await getPlanDays();
    return days.find(d => d.id === dayId) || null;
  } catch (error) {
    console.error('Error getting day:', error);
    return null;
  }
};

/**
 * Add a day to a plan
 * @param {string} planId - Plan ID to add day to
 * @param {Object} dayData - Day data
 * @param {string} dayData.day_name - Day name (e.g., 'Monday', 'Push Day', 'Day 1')
 * @param {number} [dayData.order] - Day order (auto-calculated if not provided)
 * @returns {Promise<Object>} Created plan day object with generated id
 */
export const addDayToPlan = async (planId, dayData) => {
  try {
    if (!planId) {
      throw new Error('Plan ID is required');
    }
    if (!dayData || !dayData.day_name) {
      throw new Error('Day name is required');
    }

    // Get existing days to determine order
    const existingDays = await getDaysForPlan(planId);
    const order = dayData.order !== undefined 
      ? dayData.order 
      : existingDays.length > 0 
        ? Math.max(...existingDays.map(d => d.order)) + 1 
        : 1;

    // Create new day
    const newDay = {
      id: generateDayId(),
      plan_id: planId,
      day_name: dayData.day_name,
      order: order
    };

    // Get all days and add new one
    const allDays = await getPlanDays();
    allDays.push(newDay);

    const userId = getCurrentUserId();

    // Save based on mode
    if (isGuestMode()) {
      setGuestData('plan_days', allDays);
    } else {
      localStorage.setItem(PLAN_DAYS_KEY, JSON.stringify(allDays));
      
      // Sync to Firebase if user is logged in
      if (userId) {
        await savePlanDaysToFirebase(userId, allDays);
      }
    }

    return newDay;
  } catch (error) {
    console.error('Error adding day to plan:', error);
    throw error;
  }
};

/**
 * Update a plan day
 * @param {string} dayId - Plan day ID to update
 * @param {Object} updates - Fields to update (day_name, order)
 * @returns {Promise<Object>} Updated plan day object
 */
export const updateDay = async (dayId, updates) => {
  try {
    if (!dayId) {
      throw new Error('Day ID is required');
    }
    if (!updates || Object.keys(updates).length === 0) {
      throw new Error('Update data is required');
    }

    const days = await getPlanDays();
    const dayIndex = days.findIndex(d => d.id === dayId);
    
    if (dayIndex === -1) {
      throw new Error(`Day with ID ${dayId} not found`);
    }

    // Update the day (preserve id and plan_id)
    days[dayIndex] = {
      ...days[dayIndex],
      ...updates,
      id: days[dayIndex].id,
      plan_id: days[dayIndex].plan_id
    };

    const userId = getCurrentUserId();

    // Save based on mode
    if (isGuestMode()) {
      setGuestData('plan_days', days);
    } else {
      localStorage.setItem(PLAN_DAYS_KEY, JSON.stringify(days));
      
      // Sync to Firebase if user is logged in
      if (userId) {
        await savePlanDaysToFirebase(userId, days);
      }
    }

    return days[dayIndex];
  } catch (error) {
    console.error('Error updating day:', error);
    throw error;
  }
};

/**
 * Remove a day from a plan
 * @param {string} dayId - Plan day ID to remove
 * @returns {Promise<boolean>} True if removed successfully
 */
export const removeDay = async (dayId) => {
  try {
    if (!dayId) {
      throw new Error('Day ID is required');
    }

    const days = await getPlanDays();
    const filteredDays = days.filter(d => d.id !== dayId);
    
    if (filteredDays.length === days.length) {
      throw new Error(`Day with ID ${dayId} not found`);
    }

    const userId = getCurrentUserId();

    // Save based on mode
    if (isGuestMode()) {
      setGuestData('plan_days', filteredDays);
    } else {
      localStorage.setItem(PLAN_DAYS_KEY, JSON.stringify(filteredDays));
      
      // Sync to Firebase if user is logged in
      if (userId) {
        await savePlanDaysToFirebase(userId, filteredDays);
      }
    }

    return true;
  } catch (error) {
    console.error('Error removing day:', error);
    throw error;
  }
};

/**
 * Remove all days for a specific plan
 * Useful when deleting a plan to clean up orphaned days
 * @param {string} planId - Plan ID to remove all days for
 * @returns {Promise<number>} Number of days removed
 */
export const removeDaysForPlan = async (planId) => {
  try {
    if (!planId) {
      throw new Error('Plan ID is required');
    }

    const days = await getPlanDays();
    const filteredDays = days.filter(d => d.plan_id !== planId);
    const removedCount = days.length - filteredDays.length;

    if (removedCount > 0) {
      const userId = getCurrentUserId();

      // Save based on mode
      if (isGuestMode()) {
        setGuestData('plan_days', filteredDays);
      } else {
        localStorage.setItem(PLAN_DAYS_KEY, JSON.stringify(filteredDays));
        
        // Sync to Firebase if user is logged in
        if (userId) {
          await savePlanDaysToFirebase(userId, filteredDays);
        }
      }
    }

    return removedCount;
  } catch (error) {
    console.error('Error removing days for plan:', error);
    throw error;
  }
};
