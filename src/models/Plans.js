/**
 * Plans Model
 * 
 * Simplified flat data structure for workout plans.
 * Contains id, name, type, duration, user_id, created_date
 * 
 * This model provides CRUD operations for workout plans with clear function names
 * and integrates with localStorage/Firebase storage patterns used in this app.
 */

import { getCurrentUserId } from '../utils/storage.js';
import { isGuestMode, getGuestData, setGuestData } from '../utils/guestStorage.js';
import { 
  savePlansToFirebase, 
  loadPlansFromFirebase 
} from '../utils/firebaseStorage.js';

/** Storage key for plans in localStorage */
const PLANS_KEY = 'goodlift_plans';

/**
 * Generate a unique plan ID
 * @returns {string} Unique plan ID
 */
const generatePlanId = () => {
  return `plan_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
};

/**
 * Get all plans from storage
 * @returns {Promise<Array>} Array of plan objects
 */
export const getPlans = async () => {
  try {
    // Check if in guest mode first
    if (isGuestMode()) {
      const guestData = getGuestData('plans');
      return guestData || [];
    }

    const userId = getCurrentUserId();

    // Try Firebase first if user is authenticated
    if (userId) {
      try {
        const firebaseData = await loadPlansFromFirebase(userId);
        if (firebaseData) {
          // Update localStorage cache for offline access
          localStorage.setItem(PLANS_KEY, JSON.stringify(firebaseData));
          return firebaseData;
        }
      } catch (error) {
        console.error('Firebase fetch failed, using localStorage:', error);
      }
    }

    // Fallback to localStorage
    const plans = localStorage.getItem(PLANS_KEY);
    return plans ? JSON.parse(plans) : [];
  } catch (error) {
    console.error('Error reading plans:', error);
    return [];
  }
};

/**
 * Get a specific plan by ID
 * @param {string} planId - Plan ID to retrieve
 * @returns {Promise<Object|null>} Plan object or null if not found
 */
export const getPlan = async (planId) => {
  try {
    if (!planId) {
      throw new Error('Plan ID is required');
    }

    const plans = await getPlans();
    return plans.find(p => p.id === planId) || null;
  } catch (error) {
    console.error('Error getting plan:', error);
    return null;
  }
};

/**
 * Create a new workout plan
 * @param {Object} planData - Plan data
 * @param {string} planData.name - Plan name
 * @param {string} planData.type - Plan type (e.g., 'strength', 'hypertrophy', 'endurance')
 * @param {number} planData.duration - Plan duration in days
 * @returns {Promise<Object>} Created plan object with generated id and created_date
 */
export const createPlan = async (planData) => {
  try {
    if (!planData || !planData.name) {
      throw new Error('Plan name is required');
    }

    const userId = getCurrentUserId();
    
    // Create new plan with generated ID and metadata
    const newPlan = {
      id: generatePlanId(),
      name: planData.name,
      type: planData.type || 'general',
      duration: planData.duration || 30,
      user_id: userId || 'guest',
      created_date: new Date().toISOString()
    };

    // Get existing plans and add new one
    const plans = await getPlans();
    plans.push(newPlan);

    // Save based on mode
    if (isGuestMode()) {
      setGuestData('plans', plans);
    } else {
      localStorage.setItem(PLANS_KEY, JSON.stringify(plans));
      
      // Sync to Firebase if user is logged in
      if (userId) {
        await savePlansToFirebase(userId, plans);
      }
    }

    return newPlan;
  } catch (error) {
    console.error('Error creating plan:', error);
    throw error;
  }
};

/**
 * Update an existing plan
 * @param {string} planId - Plan ID to update
 * @param {Object} updates - Fields to update (name, type, duration)
 * @returns {Promise<Object>} Updated plan object
 */
export const updatePlan = async (planId, updates) => {
  try {
    if (!planId) {
      throw new Error('Plan ID is required');
    }
    if (!updates || Object.keys(updates).length === 0) {
      throw new Error('Update data is required');
    }

    const plans = await getPlans();
    const planIndex = plans.findIndex(p => p.id === planId);
    
    if (planIndex === -1) {
      throw new Error(`Plan with ID ${planId} not found`);
    }

    // Update the plan (preserve id, user_id, and created_date)
    plans[planIndex] = {
      ...plans[planIndex],
      ...updates,
      id: plans[planIndex].id,
      user_id: plans[planIndex].user_id,
      created_date: plans[planIndex].created_date
    };

    const userId = getCurrentUserId();

    // Save based on mode
    if (isGuestMode()) {
      setGuestData('plans', plans);
    } else {
      localStorage.setItem(PLANS_KEY, JSON.stringify(plans));
      
      // Sync to Firebase if user is logged in
      if (userId) {
        await savePlansToFirebase(userId, plans);
      }
    }

    return plans[planIndex];
  } catch (error) {
    console.error('Error updating plan:', error);
    throw error;
  }
};

/**
 * Delete a plan
 * @param {string} planId - Plan ID to delete
 * @returns {Promise<boolean>} True if deleted successfully
 */
export const deletePlan = async (planId) => {
  try {
    if (!planId) {
      throw new Error('Plan ID is required');
    }

    const plans = await getPlans();
    const filteredPlans = plans.filter(p => p.id !== planId);
    
    if (filteredPlans.length === plans.length) {
      throw new Error(`Plan with ID ${planId} not found`);
    }

    const userId = getCurrentUserId();

    // Save based on mode
    if (isGuestMode()) {
      setGuestData('plans', filteredPlans);
    } else {
      localStorage.setItem(PLANS_KEY, JSON.stringify(filteredPlans));
      
      // Sync to Firebase if user is logged in
      if (userId) {
        await savePlansToFirebase(userId, filteredPlans);
      }
    }

    return true;
  } catch (error) {
    console.error('Error deleting plan:', error);
    throw error;
  }
};
