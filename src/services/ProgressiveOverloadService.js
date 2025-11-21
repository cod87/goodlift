/**
 * ProgressiveOverloadService
 * 
 * Consolidated service for all progressive overload tracking and calculation functionality.
 * This service combines:
 * - Exercise progression data extraction and analysis
 * - Pinned exercise management
 * - Statistics calculation
 * - Chart data formatting
 * 
 * Replaces functionality previously scattered across:
 * - src/utils/progressionHelpers.js
 * - src/utils/storage.js (pinned exercise functions)
 */

import {
  getPinnedExercises as storagGetPinnedExercises,
  setPinnedExercises as storageSetPinnedExercises,
} from '../utils/storage';

/**
 * ProgressiveOverloadService class
 * Provides methods for tracking and analyzing exercise progression
 */
class ProgressiveOverloadService {
  constructor() {
    this.maxPinnedExercises = 10;
  }

  // ============================================================================
  // EXERCISE PROGRESSION ANALYSIS
  // ============================================================================

  /**
   * Extract progression data for a specific exercise from workout history
   * @param {Array} workoutHistory - Array of workout objects
   * @param {string} exerciseName - Name of the exercise to track
   * @param {string} mode - 'weight' or 'reps'
   * @returns {Array} Array of data points with date and value
   */
  getExerciseProgression(workoutHistory, exerciseName, mode = 'weight') {
    if (!workoutHistory || !Array.isArray(workoutHistory)) {
      return [];
    }

    const progressionData = [];

    // Iterate through workout history
    workoutHistory.forEach((workout) => {
      if (!workout.exercises || !workout.exercises[exerciseName]) {
        return;
      }

      const exerciseData = workout.exercises[exerciseName];
      const sets = exerciseData.sets || [];

      if (sets.length === 0) {
        return;
      }

      // Calculate the metric based on mode
      let value;
      if (mode === 'weight') {
        // Use the maximum weight lifted in this workout
        value = Math.max(...sets.map(set => set.weight || 0));
      } else if (mode === 'reps') {
        // Use the maximum reps achieved in this workout
        value = Math.max(...sets.map(set => set.reps || 0));
      }

      if (value > 0) {
        progressionData.push({
          date: new Date(workout.date),
          value,
          workout,
        });
      }
    });

    // Sort by date (oldest to newest) to ensure correct progression order
    progressionData.sort((a, b) => a.date - b.date);

    return progressionData;
  }

  /**
   * Get all exercises that have been performed in workout history
   * @param {Array} workoutHistory - Array of workout objects
   * @returns {Array} Array of unique exercise names
   */
  getUniqueExercises(workoutHistory) {
    if (!workoutHistory || !Array.isArray(workoutHistory)) {
      return [];
    }

    const exerciseSet = new Set();

    workoutHistory.forEach((workout) => {
      if (workout.exercises) {
        Object.keys(workout.exercises).forEach((exerciseName) => {
          exerciseSet.add(exerciseName);
        });
      }
    });

    return Array.from(exerciseSet).sort();
  }

  /**
   * Format progression data for Chart.js
   * @param {Array} progressionData - Array from getExerciseProgression
   * @param {string} label - Label for the dataset
   * @param {string} mode - 'weight' or 'reps' to determine Y-axis scaling
   * @returns {Object} Chart.js compatible data object
   */
  formatProgressionForChart(progressionData, label, mode = 'weight') {
    if (!progressionData || progressionData.length === 0) {
      return {
        labels: [],
        datasets: [{
          label,
          data: [],
          fill: true,
          backgroundColor: 'rgba(19, 70, 134, 0.2)',
          borderColor: 'rgb(19, 70, 134)',
          tension: 0.4,
          pointBackgroundColor: 'rgb(19, 70, 134)',
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 6,
        }],
        minValue: 0,
      };
    }

    // Limit to last 10 data points
    const limitedData = progressionData.slice(-10);

    // Use session numbers for X-axis labels (Session 1, Session 2, etc.)
    const labels = limitedData.map((_, index) => `Session ${index + 1}`);

    const data = limitedData.map(point => point.value);

    // Calculate minimum value for Y-axis scaling
    let minValue = 0;
    if (mode === 'weight' && data.length > 0) {
      const minWeight = Math.min(...data);
      minValue = Math.max(0, minWeight - 5); // 5lbs below minimum, but not below 0
    }

    return {
      labels,
      datasets: [{
        label,
        data,
        fill: true,
        backgroundColor: 'rgba(19, 70, 134, 0.2)',
        borderColor: 'rgb(19, 70, 134)',
        tension: 0.4,
        pointBackgroundColor: 'rgb(19, 70, 134)',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
      }],
      minValue,
    };
  }

  // ============================================================================
  // PINNED EXERCISES MANAGEMENT
  // ============================================================================

  /**
   * Get all pinned exercises
   * @returns {Promise<Array>} Array of pinned exercise configurations
   */
  async getPinnedExercises() {
    return await storagGetPinnedExercises();
  }

  /**
   * Save pinned exercises for progress tracking
   * @param {Array} pinnedExercises - Array of pinned exercise configurations
   * Each config: { exerciseName: string, trackingMode: 'weight' | 'reps' }
   */
  async setPinnedExercises(pinnedExercises) {
    if (!Array.isArray(pinnedExercises)) {
      throw new Error('Pinned exercises must be an array');
    }

    // Limit to max pinned exercises
    const limitedPinned = pinnedExercises.slice(0, this.maxPinnedExercises);
    await storageSetPinnedExercises(limitedPinned);
  }

  /**
   * Add an exercise to pinned exercises
   * @param {string} exerciseName - Name of the exercise
   * @param {string} trackingMode - 'weight' or 'reps'
   * @returns {Promise<boolean>} True if added, false if already at limit or already pinned
   */
  async addPinnedExercise(exerciseName, trackingMode = 'weight') {
    try {
      const pinned = await this.getPinnedExercises();

      // Check if already pinned
      if (pinned.some(p => p.exerciseName === exerciseName)) {
        return false;
      }

      // Check if at limit
      if (pinned.length >= this.maxPinnedExercises) {
        return false;
      }

      pinned.push({ exerciseName, trackingMode });
      await this.setPinnedExercises(pinned);
      return true;
    } catch (error) {
      console.error('Error adding pinned exercise:', error);
      return false;
    }
  }

  /**
   * Remove an exercise from pinned exercises
   * @param {string} exerciseName - Name of the exercise
   */
  async removePinnedExercise(exerciseName) {
    try {
      const pinned = await this.getPinnedExercises();
      const filtered = pinned.filter(p => p.exerciseName !== exerciseName);
      await this.setPinnedExercises(filtered);
    } catch (error) {
      console.error('Error removing pinned exercise:', error);
      throw error;
    }
  }

  /**
   * Update tracking mode for a pinned exercise
   * @param {string} exerciseName - Name of the exercise
   * @param {string} trackingMode - 'weight' or 'reps'
   */
  async updatePinnedExerciseMode(exerciseName, trackingMode) {
    try {
      const pinned = await this.getPinnedExercises();
      const updated = pinned.map(p =>
        p.exerciseName === exerciseName
          ? { ...p, trackingMode }
          : p
      );
      await this.setPinnedExercises(updated);
    } catch (error) {
      console.error('Error updating pinned exercise mode:', error);
      throw error;
    }
  }

  /**
   * Check if an exercise is already pinned
   * @param {string} exerciseName - Name of the exercise
   * @returns {Promise<boolean>} True if pinned
   */
  async isExercisePinned(exerciseName) {
    const pinned = await this.getPinnedExercises();
    return pinned.some(p => p.exerciseName === exerciseName);
  }

  /**
   * Get available exercises for pinning (not already pinned)
   * @param {Array} workoutHistory - Array of workout objects
   * @returns {Promise<Array>} Array of exercise names that can be pinned
   */
  async getAvailableExercisesForPinning(workoutHistory) {
    const allExercises = this.getUniqueExercises(workoutHistory);
    const pinned = await this.getPinnedExercises();
    const pinnedNames = new Set(pinned.map(p => p.exerciseName));
    
    return allExercises.filter(ex => !pinnedNames.has(ex));
  }

  // ============================================================================
  // STATISTICS CALCULATION
  // ============================================================================

  /**
   * Calculate workout statistics for a given time period
   * @param {Array} workoutHistory - Array of workout objects
   * @param {string} timeFilter - 'week', 'month', 'all'
   * @returns {Object} Statistics object
   */
  calculateStats(workoutHistory, timeFilter = 'all') {
    if (!workoutHistory || !Array.isArray(workoutHistory)) {
      return {
        workoutsThisWeek: 0,
        totalVolume: 0,
        currentStreak: 0,
        avgDuration: 0,
      };
    }

    // Filter workouts based on time period
    const now = new Date();
    const filteredHistory = workoutHistory.filter(workout => {
      const workoutDate = new Date(workout.date);
      if (timeFilter === 'week') {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return workoutDate >= weekAgo;
      } else if (timeFilter === 'month') {
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        return workoutDate >= monthAgo;
      }
      return true; // 'all' - no filter
    });

    // Calculate workouts this week
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const workoutsThisWeek = workoutHistory.filter(w => new Date(w.date) >= weekAgo).length;

    // Calculate total volume (total weight lifted)
    let totalVolume = 0;
    filteredHistory.forEach(workout => {
      if (workout.exercises) {
        Object.values(workout.exercises).forEach(exercise => {
          if (exercise.sets && Array.isArray(exercise.sets)) {
            exercise.sets.forEach(set => {
              totalVolume += (set.weight || 0) * (set.reps || 0);
            });
          }
        });
      }
    });

    // Calculate current streak
    const currentStreak = this.calculateStreak(workoutHistory);

    // Calculate average duration
    const totalDuration = filteredHistory.reduce((sum, w) => sum + (w.duration || 0), 0);
    const avgDuration = filteredHistory.length > 0
      ? Math.round(totalDuration / filteredHistory.length / 60) // Convert to minutes
      : 0;

    return {
      workoutsThisWeek,
      totalVolume,
      currentStreak,
      avgDuration,
    };
  }

  /**
   * Calculate current workout streak (consecutive days with workouts)
   * @param {Array} workoutHistory - Array of workout objects
   * @returns {number} Current streak in days
   */
  calculateStreak(workoutHistory) {
    if (!workoutHistory || workoutHistory.length === 0) {
      return 0;
    }

    // Sort workouts by date (newest first)
    const sortedWorkouts = [...workoutHistory].sort((a, b) => 
      new Date(b.date) - new Date(a.date)
    );

    let streak = 0;
    let currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);

    for (const workout of sortedWorkouts) {
      const workoutDate = new Date(workout.date);
      workoutDate.setHours(0, 0, 0, 0);

      const daysDiff = Math.floor((currentDate - workoutDate) / (1000 * 60 * 60 * 24));

      if (daysDiff === streak) {
        streak++;
      } else if (daysDiff > streak) {
        // Gap in workout streak
        break;
      }
    }

    return streak;
  }

  /**
   * Get progression summary for an exercise
   * @param {Array} workoutHistory - Array of workout objects
   * @param {string} exerciseName - Name of the exercise
   * @param {string} mode - 'weight' or 'reps'
   * @returns {Object} Summary with current, best, and trend
   */
  getProgressionSummary(workoutHistory, exerciseName, mode = 'weight') {
    const progression = this.getExerciseProgression(workoutHistory, exerciseName, mode);

    if (progression.length === 0) {
      return {
        current: 0,
        best: 0,
        trend: 'none',
        improvement: 0,
      };
    }

    const values = progression.map(p => p.value);
    const current = values[values.length - 1];
    const best = Math.max(...values);

    // Calculate trend (compare last value to average of previous 3)
    let trend = 'stable';
    if (values.length >= 4) {
      const previousAvg = values.slice(-4, -1).reduce((a, b) => a + b, 0) / 3;
      if (current > previousAvg * 1.05) {
        trend = 'up';
      } else if (current < previousAvg * 0.95) {
        trend = 'down';
      }
    }

    // Calculate improvement (first to last)
    const improvement = values.length >= 2
      ? ((current - values[0]) / values[0]) * 100
      : 0;

    return {
      current,
      best,
      trend,
      improvement: Math.round(improvement),
    };
  }

  /**
   * Get the latest performed set for an exercise from workout history
   * @param {Array} workoutHistory - Array of workout objects
   * @param {string} exerciseName - Name of the exercise
   * @param {string} trackingMode - 'weight' or 'reps' - determines which metric to prioritize
   * @returns {Object|null} Object with { weight, reps, date } or null if not found
   */
  getLatestPerformance(workoutHistory, exerciseName, trackingMode = 'weight') {
    if (!workoutHistory || !Array.isArray(workoutHistory) || workoutHistory.length === 0) {
      return null;
    }

    // Sort workouts by date (newest first)
    const sortedWorkouts = [...workoutHistory].sort((a, b) => 
      new Date(b.date) - new Date(a.date)
    );

    // Find the most recent workout that includes this exercise
    for (const workout of sortedWorkouts) {
      if (workout.exercises && workout.exercises[exerciseName]) {
        const exerciseData = workout.exercises[exerciseName];
        if (exerciseData.sets && exerciseData.sets.length > 0) {
          // Find the best set based on tracking mode
          let bestSet;
          if (trackingMode === 'reps') {
            // For reps tracking, find set with highest reps
            bestSet = exerciseData.sets.reduce((best, current) => {
              const currentReps = current.reps || 0;
              const bestReps = best.reps || 0;
              return currentReps > bestReps ? current : best;
            }, exerciseData.sets[0]);
          } else {
            // For weight tracking, find set with highest weight
            bestSet = exerciseData.sets.reduce((best, current) => {
              const currentWeight = current.weight || 0;
              const bestWeight = best.weight || 0;
              return currentWeight > bestWeight ? current : best;
            }, exerciseData.sets[0]);
          }

          return {
            weight: bestSet.weight || 0,
            reps: bestSet.reps || 0,
            date: workout.date,
          };
        }
      }
    }

    return null;
  }

  /**
   * Update pinned exercises with latest performance data from workout history
   * @param {Array} pinnedExercises - Array of pinned exercise configurations
   * @param {Array} workoutHistory - Array of workout objects
   * @returns {Array} Updated pinned exercises with latest performance data
   */
  updatePinnedExercisesWithLatestPerformance(pinnedExercises, workoutHistory) {
    if (!Array.isArray(pinnedExercises) || pinnedExercises.length === 0) {
      return [];
    }

    return pinnedExercises.map(pinned => {
      const latestPerf = this.getLatestPerformance(
        workoutHistory, 
        pinned.exerciseName, 
        pinned.trackingMode || 'weight'
      );
      
      if (latestPerf) {
        return {
          ...pinned,
          lastWeight: latestPerf.weight,
          lastReps: latestPerf.reps,
          lastDate: latestPerf.date,
        };
      }
      
      return pinned;
    });
  }

  /**
   * Sync pinned exercises with latest performance and save
   * @param {Array} workoutHistory - Array of workout objects
   * @returns {Promise<Array>} Updated pinned exercises
   */
  async syncPinnedExercisesWithHistory(workoutHistory) {
    try {
      const pinned = await this.getPinnedExercises();
      const updated = this.updatePinnedExercisesWithLatestPerformance(pinned, workoutHistory);
      await this.setPinnedExercises(updated);
      return updated;
    } catch (error) {
      console.error('Error syncing pinned exercises with history:', error);
      throw error;
    }
  }
}

// Export singleton instance
const progressiveOverloadService = new ProgressiveOverloadService();
export default progressiveOverloadService;

// Also export individual methods for backwards compatibility
export const getExerciseProgression = (history, name, mode) => 
  progressiveOverloadService.getExerciseProgression(history, name, mode);

export const getUniqueExercises = (history) => 
  progressiveOverloadService.getUniqueExercises(history);

export const formatProgressionForChart = (data, label, mode) => 
  progressiveOverloadService.formatProgressionForChart(data, label, mode);
