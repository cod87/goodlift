/**
 * Application constants for workout configuration and navigation
 */

/** Workout type identifiers */
export const WORKOUT_TYPES = {
  UPPER: 'upper',
  LOWER: 'lower',
  FULL: 'full',
};

/** Exercise and workout configuration */
export const SETS_PER_EXERCISE = 3;
export const EXERCISES_PER_WORKOUT = 8;
export const EXERCISES_DATA_PATH = import.meta.env.BASE_URL + 'data/exercises.json';

/** Screen route identifiers */
export const SCREENS = {
  SELECTION: 'selection',
  PREVIEW: 'preview',
  WORKOUT: 'workout',
  COMPLETION: 'completion',
  PROGRESS: 'progress',
  HIIT: 'hiit',
};

/** Muscle group categories for progressive overload calculations */
export const MUSCLE_GROUPS = {
  UPPER_BODY: ['Chest', 'Back', 'Shoulders', 'Biceps', 'Triceps'],
  LOWER_BODY: ['Quadriceps', 'Hamstrings', 'Glutes', 'Calves'],
};

/** Weight increments for progressive overload (in lbs) */
export const WEIGHT_INCREMENTS = {
  UPPER_BODY: {
    DUMBBELL: 5,
    BARBELL: 2.5,
  },
  LOWER_BODY: {
    DUMBBELL: 10,
    BARBELL: 5,
  },
};

/** Default target reps for exercises */
export const DEFAULT_TARGET_REPS = 12;

/** Equipment type normalization */
export const EQUIPMENT_TYPES = {
  CABLE_MACHINE: 'cable machine',
  DUMBBELLS: 'dumbbells',
  BARBELLS: 'barbells',
  KETTLEBELLS: 'kettlebells',
  BODYWEIGHT: 'bodyweight',
};
