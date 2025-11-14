/**
 * Application constants for workout configuration and navigation
 */

/** Workout type identifiers */
export const WORKOUT_TYPES = {
  UPPER: 'upper',
  LOWER: 'lower',
  FULL: 'full',
  PUSH: 'push',
  PULL: 'pull',
  LEGS: 'legs',
};

/**
 * Day types enum for session-based plans
 * Used to categorize workout sessions by their intensity and focus
 */
export const DAY_TYPES = {
  STRENGTH: 'strength',
  HYPERTROPHY: 'hypertrophy',
  CARDIO: 'cardio',
  ACTIVE_RECOVERY: 'active_recovery',
  REST: 'rest'
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
  STRETCH: 'stretch',
};

/** Muscle group categories for progressive overload calculations */
export const MUSCLE_GROUPS = {
  UPPER_BODY: ['Chest', 'Upper Chest', 'Lower Chest', 'Inner Chest', 'Back', 'Lats', 'Upper Back', 'Lower Back', 'Delts', 'Front Delts', 'Rear Delts', 'Side Delts', 'Biceps', 'Triceps', 'Forearms', 'Traps'],
  LOWER_BODY: ['Quads', 'Hamstrings', 'Glutes', 'Calves', 'Hip Flexors'],
};

/** All available muscle groups for selection */
export const ALL_MUSCLE_GROUPS = [
  'Chest', 'Upper Chest', 'Lower Chest', 'Inner Chest',
  'Back', 'Lats', 'Upper Back', 'Lower Back',
  'Delts', 'Front Delts', 'Rear Delts', 'Side Delts',
  'Quads', 'Hamstrings', 'Glutes', 'Calves',
  'Biceps', 'Triceps', 'Forearms',
  'Core', 'Abs', 'Obliques',
  'Traps', 'Hip Flexors', 'Neck'
];

/**
 * Weight increments for progressive overload (in lbs)
 * Applied when user completes all sets with target reps
 * Different increments for upper/lower body and equipment types
 * - Upper body uses smaller increments due to smaller muscle groups
 * - Lower body uses larger increments due to larger muscle groups
 * - Dumbbell/Kettlebell increments are larger (total weight across both hands)
 * - Barbell increments are smaller (weight is on single bar)
 */
export const WEIGHT_INCREMENTS = {
  UPPER_BODY: {
    DUMBBELL: 5,    // 5 lbs per dumbbell (10 lbs total)
    BARBELL: 2.5,   // 2.5 lbs per side (5 lbs total)
  },
  LOWER_BODY: {
    DUMBBELL: 10,   // 10 lbs per dumbbell (20 lbs total)
    BARBELL: 5,     // 5 lbs per side (10 lbs total)
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

/** Time conversion constants */
export const TIME_CONSTANTS = {
  SECONDS_PER_MINUTE: 60,
  SECONDS_PER_HOUR: 3600,
  SECONDS_PER_DAY: 86400,
  MILLISECONDS_PER_SECOND: 1000,
  MILLISECONDS_PER_DAY: 86400000, // 1000 * 60 * 60 * 24
};
