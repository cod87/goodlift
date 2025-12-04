/**
 * Exercise Name Normalizer Utility
 * 
 * Converts old-format exercise names (equipment-first: "Barbell Bench Press") 
 * to new movement-first format ("Bench Press, Barbell").
 * 
 * Uses a simple static mapping for reliability and ease of maintenance.
 * To add new mappings, simply add entries to OLD_TO_NEW_NAME_MAP.
 */

/**
 * Static mapping of old exercise names to new format names.
 * Add new entries here when exercise names change.
 * Format: 'Old Name': 'New Name'
 */
const OLD_TO_NEW_NAME_MAP = {
  // Barbell exercises
  'Barbell Arnold Press': 'Arnold Press, Dumbbell',
  'Barbell Belt Squat': 'Belt Squat, Barbell',
  'Barbell Bench Press': 'Bench Press, Barbell',
  'Barbell Bent-Over Row': 'Bent-Over Row, Barbell',
  'Barbell Bicep Curl': 'Bicep Curl, Barbell',
  'Barbell Close Grip Bench Press': 'Close Grip Bench Press, Barbell',
  'Barbell Deadlift': 'Deadlift, Barbell',
  'Barbell Front Squat': 'Front Squat, Barbell',
  'Barbell Good Morning': 'Good Morning, Barbell',
  'Barbell Hack Squat': 'Hack Squat, Barbell',
  'Barbell High Pull': 'High Pull, Barbell',
  'Barbell Hip Thrust': 'Hip Thrust, Barbell',
  'Barbell Incline Bench Press': 'Incline Bench Press, Barbell',
  'Barbell Overhead Press': 'Overhead Press, Barbell',
  'Barbell Paused Bench Press': 'Paused Bench Press, Barbell',
  'Barbell Pendulum Squat': 'Pendulum Squat, Barbell',
  'Barbell Pullover': 'Pullover, Barbell',
  'Barbell Push Press': 'Push Press, Barbell',
  'Barbell Romanian Deadlift': 'Romanian Deadlift, Barbell',
  'Barbell Shrug': 'Shrug, Barbell',
  'Barbell Sumo Deadlift': 'Sumo Deadlift, Barbell',
  'Barbell Thruster': 'Thruster, Barbell',
  'Barbell Trap Bar Deadlift': 'Trap Bar Deadlift, Barbell',
  'Barbell Upright Row': 'Upright Row, Barbell',
  
  // Dumbbell exercises
  'Dumbbell Arnold Press': 'Arnold Press, Dumbbell',
  'Dumbbell Bench Press': 'Bench Press, Dumbbell',
  'Dumbbell Bent-Over Row': 'Bent-Over Row, Dumbbell',
  'Dumbbell Bicep Curl': 'Bicep Curl, Dumbbell',
  'Dumbbell Bulgarian Split Squat': 'Bulgarian Split Squat, Dumbbell',
  'Dumbbell Close Grip Bench Press': 'Close Grip Bench Press, Dumbbell',
  'Dumbbell Concentration Curl': 'Concentration Curl, Dumbbell',
  'Dumbbell Deadlift': 'Deadlift, Dumbbell',
  'Dumbbell Farmer Carry': 'Farmer Carry, Dumbbell',
  'Dumbbell Fly': 'Fly, Dumbbell',
  'Dumbbell Front Raise': 'Front Raise, Dumbbell',
  'Dumbbell Front Squat': 'Front Squat, Dumbbell',
  'Dumbbell Goblet Squat': 'Goblet Squat, Dumbbell',
  'Dumbbell Hammer Curl': 'Hammer Curl, Dumbbell',
  'Dumbbell Incline Bench Press': 'Incline Bench Press, Dumbbell',
  'Dumbbell Incline Curl': 'Incline Curl, Dumbbell',
  'Dumbbell Jump Squat': 'Jump Squat, Dumbbell',
  'Dumbbell Kickback': 'Kickback, Dumbbell',
  'Dumbbell Lateral Raise': 'Lateral Raise, Dumbbell',
  'Dumbbell Lunge': 'Lunge, Dumbbell',
  'Dumbbell Overhead Tricep Extension': 'Overhead Tricep Extension, Dumbbell',
  'Dumbbell Pullover': 'Pullover, Dumbbell',
  'Dumbbell Renegade Row': 'Renegade Row, Dumbbell',
  'Dumbbell Reverse Fly': 'Reverse Fly, Dumbbell',
  'Dumbbell Reverse Lunge': 'Reverse Lunge, Dumbbell',
  'Dumbbell Romanian Deadlift': 'Romanian Deadlift, Dumbbell',
  'Dumbbell Shoulder Press': 'Shoulder Press, Dumbbell',
  'Dumbbell Shrug': 'Shrug, Dumbbell',
  'Dumbbell Single-Arm Row': 'Single-Arm Row, Dumbbell',
  'Dumbbell Single-Leg Deadlift': 'Single-Leg Deadlift, Dumbbell',
  'Dumbbell Squat': 'Squat, Dumbbell',
  'Dumbbell Step-Up': 'Step-Up, Dumbbell',
  'Dumbbell Suitcase Deadlift': 'Suitcase Deadlift, Dumbbell',
  'Dumbbell Thruster': 'Thruster, Dumbbell',
  'Dumbbell Walking Lunge': 'Walking Lunge, Dumbbell',
  
  // Cable exercises
  'Cable Pull-Up': 'Pull-Up, Cable',
  'Cable Skull Crusher': 'Skull Crusher, Cable',
  'Cable Tricep Extension': 'Tricep Extension, Cable',
  
  // Kettlebell exercises
  'Kettlebell Swing': 'Swing, Kettlebell',
  
  // Landmine exercises
  'Landmine Deadlift': 'Deadlift, Landmine',
  'Landmine Press': 'Press, Landmine',
  'Landmine Rotation': 'Rotation, Landmine',
  'Landmine Row': 'Row, Landmine',
  'Landmine Squat': 'Squat, Landmine',
  
  // Slam Ball exercises
  'Slam Ball Rotational Slam': 'Rotational Slam, Slam Ball',
  'Slam Ball Slam': 'Slam, Slam Ball',
  'Slam Ball Squat': 'Squat, Slam Ball',
  
  // Rope exercises
  'Rope Pulldown': 'Pulldown, Rope',
  'Rope Tricep Extension': 'Tricep Extension, Rope',
};

/**
 * Normalize an exercise name to the new movement-first format.
 * Uses a simple lookup - if the name is in the mapping, return the new name.
 * Otherwise, return the original name unchanged.
 * 
 * @param {string} exerciseName - Exercise name to normalize
 * @returns {string} Normalized exercise name
 */
export const normalizeExerciseNameToNewFormat = (exerciseName) => {
  if (!exerciseName || typeof exerciseName !== 'string') return exerciseName;
  return OLD_TO_NEW_NAME_MAP[exerciseName] || exerciseName;
};

/**
 * Normalize an exercise object's name to the new format.
 * 
 * @param {Object} exercise - Exercise object with 'Exercise Name' or 'name' property
 * @returns {Object} Exercise object with normalized name
 */
export const normalizeExerciseObject = (exercise) => {
  if (!exercise) return exercise;
  
  const exerciseName = exercise['Exercise Name'] || exercise.name;
  if (!exerciseName) return exercise;
  
  const normalizedName = normalizeExerciseNameToNewFormat(exerciseName);
  
  // Only create new object if name changed
  if (normalizedName === exerciseName) return exercise;
  
  return {
    ...exercise,
    'Exercise Name': normalizedName,
    ...(exercise.name ? { name: normalizedName } : {}),
  };
};

/**
 * Normalize all exercise names in an array.
 * 
 * @param {Array} exercises - Array of exercise objects
 * @returns {Array} Array with normalized exercise names
 */
export const normalizeExerciseArray = (exercises) => {
  if (!Array.isArray(exercises)) return exercises;
  return exercises.map(ex => ex ? normalizeExerciseObject(ex) : ex);
};

/**
 * Normalize all exercise names in a workout object.
 * 
 * @param {Object} workout - Workout object with exercises array
 * @returns {Object} Workout object with normalized exercise names
 */
export const normalizeWorkoutExercises = (workout) => {
  if (!workout || !Array.isArray(workout.exercises)) return workout;
  
  return {
    ...workout,
    exercises: normalizeExerciseArray(workout.exercises),
  };
};
