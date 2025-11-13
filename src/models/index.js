/**
 * Models Index
 * 
 * Exports all CRUD operations for the simplified workout plan data models.
 * Import from this file to access all model functions.
 * 
 * Example usage:
 * import { createPlan, addDayToPlan, addExerciseToDay } from '../models';
 */

// Plans model exports
export {
  getPlans,
  getPlan,
  createPlan,
  updatePlan,
  deletePlan
} from './Plans.js';

// PlanDays model exports
export {
  getPlanDays,
  getDaysForPlan,
  getDay,
  addDayToPlan,
  updateDay,
  removeDay,
  removeDaysForPlan
} from './PlanDays.js';

// PlanExercises model exports
export {
  getPlanExercises,
  getExercisesForDay,
  getExercise,
  addExerciseToDay,
  updateExercise,
  removeExercise,
  removeExercisesForDay,
  reorderExercises
} from './PlanExercises.js';
