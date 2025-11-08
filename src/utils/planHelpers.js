/**
 * Utilities for creating and managing the 90-day workout program
 * Based on the updated 90-day-calendar1.md structure
 */

/**
 * Create the 90-day plan based on the new calendar structure
 * Weekly pattern: Mon-Chest&Back, Tue-Plyo, Wed-Shoulders&Arms, Thu-Yoga, Fri-Legs, Sat-Active Recovery, Sun-Rest
 * @param {string} startDayOfWeek - Day of week to start the plan (default: 'Monday')
 * @returns {Object} The premade 90-day plan
 */
export const create90DayPlan = (startDayOfWeek = 'Monday') => {
  const plan = {
    id: 'premade-90-day',
    name: '90-Day Comprehensive Workout Program',
    description: 'P90X-inspired program with Chest & Back, Shoulders & Arms, Legs, Plyometrics (3 versions), Yoga, and Core work',
    isPremade: true,
    totalDays: 90,
    startDayOfWeek,
    days: [],
  };

  // Phase 1: Weeks 1-4 (Days 1-28)
  const phase1Weeks = [
    // Week 1
    [
      { type: 'chest-back', name: 'Chest & Back + Core', phase: 'Foundation', week: 1, dayOfWeek: 'Monday', workoutId: 'chest-back-core' },
      { type: 'plyometric', name: 'Plyometrics V1: Balanced', phase: 'Foundation', week: 1, dayOfWeek: 'Tuesday', workoutId: 'plyo-v1', version: 1 },
      { type: 'shoulders-arms', name: 'Shoulders & Arms + Core', phase: 'Foundation', week: 1, dayOfWeek: 'Wednesday', workoutId: 'shoulders-arms-core' },
      { type: 'yoga', name: 'Yoga', phase: 'Foundation', week: 1, dayOfWeek: 'Thursday', duration: 60, workoutId: 'yoga' },
      { type: 'legs', name: 'Legs & Lower Body + Core', phase: 'Foundation', week: 1, dayOfWeek: 'Friday', workoutId: 'legs-core' },
      { type: 'active-recovery', name: 'Active Recovery', phase: 'Foundation', week: 1, dayOfWeek: 'Saturday', workoutId: 'active-recovery' },
      { type: 'rest', name: 'Rest or X-Stretch', phase: 'Foundation', week: 1, dayOfWeek: 'Sunday', workoutId: 'rest' },
    ],
    // Week 2
    [
      { type: 'chest-back', name: 'Chest & Back + Core', phase: 'Foundation', week: 2, dayOfWeek: 'Monday', workoutId: 'chest-back-core' },
      { type: 'plyometric', name: 'Plyometrics V2: Glute & Power', phase: 'Foundation', week: 2, dayOfWeek: 'Tuesday', workoutId: 'plyo-v2', version: 2 },
      { type: 'shoulders-arms', name: 'Shoulders & Arms + Core', phase: 'Foundation', week: 2, dayOfWeek: 'Wednesday', workoutId: 'shoulders-arms-core' },
      { type: 'yoga', name: 'Yoga', phase: 'Foundation', week: 2, dayOfWeek: 'Thursday', duration: 60, workoutId: 'yoga' },
      { type: 'legs', name: 'Legs & Lower Body + Core', phase: 'Foundation', week: 2, dayOfWeek: 'Friday', workoutId: 'legs-core' },
      { type: 'active-recovery', name: 'Active Recovery', phase: 'Foundation', week: 2, dayOfWeek: 'Saturday', workoutId: 'active-recovery' },
      { type: 'rest', name: 'Rest or X-Stretch', phase: 'Foundation', week: 2, dayOfWeek: 'Sunday', workoutId: 'rest' },
    ],
    // Week 3
    [
      { type: 'chest-back', name: 'Chest & Back + Core', phase: 'Foundation', week: 3, dayOfWeek: 'Monday', workoutId: 'chest-back-core' },
      { type: 'plyometric', name: 'Plyometrics V3: Quad & Agility', phase: 'Foundation', week: 3, dayOfWeek: 'Tuesday', workoutId: 'plyo-v3', version: 3 },
      { type: 'shoulders-arms', name: 'Shoulders & Arms + Core', phase: 'Foundation', week: 3, dayOfWeek: 'Wednesday', workoutId: 'shoulders-arms-core' },
      { type: 'yoga', name: 'Yoga', phase: 'Foundation', week: 3, dayOfWeek: 'Thursday', duration: 60, workoutId: 'yoga' },
      { type: 'legs', name: 'Legs & Lower Body + Core', phase: 'Foundation', week: 3, dayOfWeek: 'Friday', workoutId: 'legs-core' },
      { type: 'active-recovery', name: 'Active Recovery', phase: 'Foundation', week: 3, dayOfWeek: 'Saturday', workoutId: 'active-recovery' },
      { type: 'rest', name: 'Rest or X-Stretch', phase: 'Foundation', week: 3, dayOfWeek: 'Sunday', workoutId: 'rest' },
    ],
    // Week 4 - Recovery Week
    [
      { type: 'yoga', name: 'Yoga (Recovery)', phase: 'Foundation', week: 4, dayOfWeek: 'Monday', duration: 90, intensity: 'light', workoutId: 'yoga' },
      { type: 'plyometric', name: 'Plyometrics V1 (Light)', phase: 'Foundation', week: 4, dayOfWeek: 'Tuesday', workoutId: 'plyo-v1', version: 1, intensity: 'light' },
      { type: 'active-recovery', name: 'Active Recovery', phase: 'Foundation', week: 4, dayOfWeek: 'Wednesday', workoutId: 'active-recovery' },
      { type: 'stretch', name: 'X-Stretch', phase: 'Foundation', week: 4, dayOfWeek: 'Thursday', duration: 30, workoutId: 'stretch' },
      { type: 'yoga', name: 'Yoga (Recovery)', phase: 'Foundation', week: 4, dayOfWeek: 'Friday', duration: 90, intensity: 'light', workoutId: 'yoga' },
      { type: 'yoga', name: 'Yoga (Recovery)', phase: 'Foundation', week: 4, dayOfWeek: 'Saturday', duration: 90, intensity: 'light', workoutId: 'yoga' },
      { type: 'rest', name: 'Rest', phase: 'Foundation', week: 4, dayOfWeek: 'Sunday', workoutId: 'rest' },
    ],
  ];

  // Phase 2: Weeks 5-8 (Days 29-56)
  const phase2Weeks = [
    // Week 5
    [
      { type: 'chest-back', name: 'Chest & Back + Core', phase: 'Progressive Overload', week: 5, dayOfWeek: 'Monday', workoutId: 'chest-back-core' },
      { type: 'plyometric', name: 'Plyometrics V2: Glute & Power', phase: 'Progressive Overload', week: 5, dayOfWeek: 'Tuesday', workoutId: 'plyo-v2', version: 2 },
      { type: 'shoulders-arms', name: 'Shoulders & Arms + Core', phase: 'Progressive Overload', week: 5, dayOfWeek: 'Wednesday', workoutId: 'shoulders-arms-core' },
      { type: 'yoga', name: 'Yoga', phase: 'Progressive Overload', week: 5, dayOfWeek: 'Thursday', duration: 60, workoutId: 'yoga' },
      { type: 'legs', name: 'Legs & Lower Body + Core', phase: 'Progressive Overload', week: 5, dayOfWeek: 'Friday', workoutId: 'legs-core' },
      { type: 'active-recovery', name: 'Active Recovery', phase: 'Progressive Overload', week: 5, dayOfWeek: 'Saturday', workoutId: 'active-recovery' },
      { type: 'rest', name: 'Rest or X-Stretch', phase: 'Progressive Overload', week: 5, dayOfWeek: 'Sunday', workoutId: 'rest' },
    ],
    // Week 6
    [
      { type: 'chest-back', name: 'Chest & Back + Core', phase: 'Progressive Overload', week: 6, dayOfWeek: 'Monday', workoutId: 'chest-back-core' },
      { type: 'plyometric', name: 'Plyometrics V3: Quad & Agility', phase: 'Progressive Overload', week: 6, dayOfWeek: 'Tuesday', workoutId: 'plyo-v3', version: 3 },
      { type: 'shoulders-arms', name: 'Shoulders & Arms + Core', phase: 'Progressive Overload', week: 6, dayOfWeek: 'Wednesday', workoutId: 'shoulders-arms-core' },
      { type: 'yoga', name: 'Yoga', phase: 'Progressive Overload', week: 6, dayOfWeek: 'Thursday', duration: 60, workoutId: 'yoga' },
      { type: 'legs', name: 'Legs & Lower Body + Core', phase: 'Progressive Overload', week: 6, dayOfWeek: 'Friday', workoutId: 'legs-core' },
      { type: 'active-recovery', name: 'Active Recovery', phase: 'Progressive Overload', week: 6, dayOfWeek: 'Saturday', workoutId: 'active-recovery' },
      { type: 'rest', name: 'Rest or X-Stretch', phase: 'Progressive Overload', week: 6, dayOfWeek: 'Sunday', workoutId: 'rest' },
    ],
    // Week 7
    [
      { type: 'chest-back', name: 'Chest & Back + Core', phase: 'Progressive Overload', week: 7, dayOfWeek: 'Monday', workoutId: 'chest-back-core' },
      { type: 'plyometric', name: 'Plyometrics V1: Balanced', phase: 'Progressive Overload', week: 7, dayOfWeek: 'Tuesday', workoutId: 'plyo-v1', version: 1 },
      { type: 'shoulders-arms', name: 'Shoulders & Arms + Core', phase: 'Progressive Overload', week: 7, dayOfWeek: 'Wednesday', workoutId: 'shoulders-arms-core' },
      { type: 'yoga', name: 'Yoga', phase: 'Progressive Overload', week: 7, dayOfWeek: 'Thursday', duration: 60, workoutId: 'yoga' },
      { type: 'legs', name: 'Legs & Lower Body + Core', phase: 'Progressive Overload', week: 7, dayOfWeek: 'Friday', workoutId: 'legs-core' },
      { type: 'active-recovery', name: 'Active Recovery', phase: 'Progressive Overload', week: 7, dayOfWeek: 'Saturday', workoutId: 'active-recovery' },
      { type: 'rest', name: 'Rest or X-Stretch', phase: 'Progressive Overload', week: 7, dayOfWeek: 'Sunday', workoutId: 'rest' },
    ],
    // Week 8 - Recovery Week
    [
      { type: 'yoga', name: 'Yoga (Recovery)', phase: 'Progressive Overload', week: 8, dayOfWeek: 'Monday', duration: 90, intensity: 'light', workoutId: 'yoga' },
      { type: 'plyometric', name: 'Plyometrics V2 (Light)', phase: 'Progressive Overload', week: 8, dayOfWeek: 'Tuesday', workoutId: 'plyo-v2', version: 2, intensity: 'light' },
      { type: 'active-recovery', name: 'Active Recovery', phase: 'Progressive Overload', week: 8, dayOfWeek: 'Wednesday', workoutId: 'active-recovery' },
      { type: 'stretch', name: 'X-Stretch', phase: 'Progressive Overload', week: 8, dayOfWeek: 'Thursday', duration: 30, workoutId: 'stretch' },
      { type: 'yoga', name: 'Yoga (Recovery)', phase: 'Progressive Overload', week: 8, dayOfWeek: 'Friday', duration: 90, intensity: 'light', workoutId: 'yoga' },
      { type: 'yoga', name: 'Yoga (Recovery)', phase: 'Progressive Overload', week: 8, dayOfWeek: 'Saturday', duration: 90, intensity: 'light', workoutId: 'yoga' },
      { type: 'rest', name: 'Rest', phase: 'Progressive Overload', week: 8, dayOfWeek: 'Sunday', workoutId: 'rest' },
    ],
  ];

  // Phase 3: Weeks 9-12 (Days 57-84 + final days)
  const phase3Weeks = [
    // Week 9
    [
      { type: 'chest-back', name: 'Chest & Back + Core', phase: 'Peak Performance', week: 9, dayOfWeek: 'Monday', workoutId: 'chest-back-core' },
      { type: 'plyometric', name: 'Plyometrics V2: Glute & Power', phase: 'Peak Performance', week: 9, dayOfWeek: 'Tuesday', workoutId: 'plyo-v2', version: 2 },
      { type: 'shoulders-arms', name: 'Shoulders & Arms + Core', phase: 'Peak Performance', week: 9, dayOfWeek: 'Wednesday', workoutId: 'shoulders-arms-core' },
      { type: 'yoga', name: 'Yoga', phase: 'Peak Performance', week: 9, dayOfWeek: 'Thursday', duration: 60, workoutId: 'yoga' },
      { type: 'legs', name: 'Legs & Lower Body + Core', phase: 'Peak Performance', week: 9, dayOfWeek: 'Friday', workoutId: 'legs-core' },
      { type: 'active-recovery', name: 'Active Recovery', phase: 'Peak Performance', week: 9, dayOfWeek: 'Saturday', workoutId: 'active-recovery' },
      { type: 'rest', name: 'Rest or X-Stretch', phase: 'Peak Performance', week: 9, dayOfWeek: 'Sunday', workoutId: 'rest' },
    ],
    // Week 10
    [
      { type: 'chest-back', name: 'Chest & Back + Core', phase: 'Peak Performance', week: 10, dayOfWeek: 'Monday', workoutId: 'chest-back-core' },
      { type: 'plyometric', name: 'Plyometrics V1: Balanced', phase: 'Peak Performance', week: 10, dayOfWeek: 'Tuesday', workoutId: 'plyo-v1', version: 1 },
      { type: 'shoulders-arms', name: 'Shoulders & Arms + Core', phase: 'Peak Performance', week: 10, dayOfWeek: 'Wednesday', workoutId: 'shoulders-arms-core' },
      { type: 'yoga', name: 'Yoga', phase: 'Peak Performance', week: 10, dayOfWeek: 'Thursday', duration: 60, workoutId: 'yoga' },
      { type: 'legs', name: 'Legs & Lower Body + Core', phase: 'Peak Performance', week: 10, dayOfWeek: 'Friday', workoutId: 'legs-core' },
      { type: 'active-recovery', name: 'Active Recovery', phase: 'Peak Performance', week: 10, dayOfWeek: 'Saturday', workoutId: 'active-recovery' },
      { type: 'rest', name: 'Rest or X-Stretch', phase: 'Peak Performance', week: 10, dayOfWeek: 'Sunday', workoutId: 'rest' },
    ],
    // Week 11
    [
      { type: 'chest-back', name: 'Chest & Back + Core', phase: 'Peak Performance', week: 11, dayOfWeek: 'Monday', workoutId: 'chest-back-core' },
      { type: 'plyometric', name: 'Plyometrics V3: Quad & Agility', phase: 'Peak Performance', week: 11, dayOfWeek: 'Tuesday', workoutId: 'plyo-v3', version: 3 },
      { type: 'shoulders-arms', name: 'Shoulders & Arms + Core', phase: 'Peak Performance', week: 11, dayOfWeek: 'Wednesday', workoutId: 'shoulders-arms-core' },
      { type: 'yoga', name: 'Yoga', phase: 'Peak Performance', week: 11, dayOfWeek: 'Thursday', duration: 60, workoutId: 'yoga' },
      { type: 'legs', name: 'Legs & Lower Body + Core', phase: 'Peak Performance', week: 11, dayOfWeek: 'Friday', workoutId: 'legs-core' },
      { type: 'active-recovery', name: 'Active Recovery', phase: 'Peak Performance', week: 11, dayOfWeek: 'Saturday', workoutId: 'active-recovery' },
      { type: 'rest', name: 'Rest or X-Stretch', phase: 'Peak Performance', week: 11, dayOfWeek: 'Sunday', workoutId: 'rest' },
    ],
    // Week 12 - Final Week
    [
      { type: 'chest-back', name: 'Chest & Back + Core', phase: 'Peak Performance', week: 12, dayOfWeek: 'Monday', workoutId: 'chest-back-core' },
      { type: 'plyometric', name: 'Plyometrics V3: Quad & Agility', phase: 'Peak Performance', week: 12, dayOfWeek: 'Tuesday', workoutId: 'plyo-v3', version: 3 },
      { type: 'shoulders-arms', name: 'Shoulders & Arms + Core', phase: 'Peak Performance', week: 12, dayOfWeek: 'Wednesday', workoutId: 'shoulders-arms-core' },
      { type: 'yoga', name: 'Yoga', phase: 'Peak Performance', week: 12, dayOfWeek: 'Thursday', duration: 60, workoutId: 'yoga' },
      { type: 'legs', name: 'Legs & Lower Body + Core', phase: 'Peak Performance', week: 12, dayOfWeek: 'Friday', workoutId: 'legs-core' },
      { type: 'active-recovery', name: 'Active Recovery', phase: 'Peak Performance', week: 12, dayOfWeek: 'Saturday', workoutId: 'active-recovery' },
      { type: 'rest', name: 'Rest/Test Performance', phase: 'Peak Performance', week: 12, dayOfWeek: 'Sunday', workoutId: 'rest' },
    ],
  ];

  // Combine all weeks
  const allWeeks = [...phase1Weeks, ...phase2Weeks, ...phase3Weeks];
  
  // Flatten into days array
  allWeeks.forEach(week => {
    week.forEach(day => {
      plan.days.push({ ...day });
    });
  });

  // Pad to exactly 90 days (Days 85-90)
  while (plan.days.length < 90) {
    plan.days.push({
      type: 'rest',
      name: 'Rest/Recovery',
      phase: 'Peak Performance',
      week: 13,
      dayOfWeek: 'Extra',
      workoutId: 'rest'
    });
  }

  return plan;
};

/**
 * Generate scheduled workouts from a plan starting from a given date
 * @param {Object} plan - The workout plan
 * @param {Date} startDate - Starting date
 * @returns {Array} Array of scheduled workout objects
 */
export const scheduleWorkoutsFromPlan = (plan, startDate) => {
  const scheduled = [];
  const start = new Date(startDate);

  plan.days.forEach((day, index) => {
    const workoutDate = new Date(start);
    workoutDate.setDate(start.getDate() + index);
    
    scheduled.push({
      id: `${plan.id}_day${index + 1}`,
      planId: plan.id,
      dayNumber: index + 1,
      date: workoutDate.toISOString().split('T')[0],
      type: day.type,
      name: day.name,
      phase: day.phase,
      week: day.week,
      dayOfWeek: day.dayOfWeek,
      intensity: day.intensity,
      duration: day.duration,
      workoutId: day.workoutId,
      version: day.version,
      status: 'scheduled',
      deferred: false,
    });
  });

  return scheduled;
};

/**
 * Get workout template based on type
 * This returns the structure to link to actual workouts
 * @param {string} workoutId - Workout identifier
 * @param {number} version - Version number for plyometrics (1-3)
 * @returns {Object} Workout template
 */
export const getWorkoutTemplate = (workoutId, version = null) => {
  const templates = {
    'chest-back-core': {
      name: 'Chest & Back + Core',
      description: '9 strength exercises (supersets) + 10 core exercises',
      type: 'strength',
      exercises: [
        'Barbell Bench Press', 'Seated Cable Row',
        'Incline Dumbbell Bench Press', 'Lat Pulldown',
        'Dumbbell Shoulder Press', 'Barbell Curls', 'Tricep Rope Pushdown',
        'Dumbbell Flyes', 'Reverse Pec Deck Fly'
      ],
      coreExercises: [
        'In and Out (Crunches)', 'Seated Bicycle', 'Reverse Bicycle',
        'Pulse Ups', 'V-Up Rollup', 'Leg Climbers',
        'Fifer Scissors', 'Reverse Crunches', 'Heels to Heaven', 'Mason Twist'
      ],
      sets: '3-4',
      duration: '60 min'
    },
    'shoulders-arms-core': {
      name: 'Shoulders & Arms + Core',
      description: '9 strength exercises + 10 core exercises',
      type: 'strength',
      exercises: [
        'Dumbbell Shoulder Press', 'Barbell Curls',
        'Dumbbell Lateral Raises', 'Dumbbell Hammer Curls',
        'Reverse Pec Deck Fly', 'EZ Bar Skull Crushers', 'Cable Tricep Kickback',
        'Dumbbell Shrugs', 'Plate Raises'
      ],
      coreExercises: [
        'In and Out (Crunches)', 'Seated Bicycle', 'Reverse Bicycle',
        'Pulse Ups', 'V-Up Rollup', 'Leg Climbers',
        'Fifer Scissors', 'Reverse Crunches', 'Heels to Heaven', 'Mason Twist'
      ],
      sets: '3-4',
      duration: '60 min'
    },
    'legs-core': {
      name: 'Legs & Lower Body + Core',
      description: '9 strength exercises + 10 core exercises',
      type: 'strength',
      exercises: [
        'Barbell Back Squat', 'Romanian Deadlift',
        'Leg Press or Goblet Squat', 'Standing Calf Raises',
        'Bulgarian Split Squats', 'Walking Lunges', 'Step-Ups',
        'Leg Curls', 'Hip Thrusts / Weighted Glute Bridges'
      ],
      coreExercises: [
        'In and Out (Crunches)', 'Seated Bicycle', 'Reverse Bicycle',
        'Pulse Ups', 'V-Up Rollup', 'Leg Climbers',
        'Fifer Scissors', 'Reverse Crunches', 'Heels to Heaven', 'Mason Twist'
      ],
      sets: '3-4',
      duration: '60 min'
    },
    'plyo-v1': {
      name: 'Plyometrics V1: Balanced',
      description: '45-minute lower body plyometric HIIT workout with balanced approach',
      type: 'plyometric',
      rounds: 4,
      workTime: 40,
      restTime: 20,
      roundRest: 90,
      exercises: [
        'Jump Squats', 'Step-Ups with Knee Drive', 'Lateral Bounds',
        'Step-Downs with Control', 'Skater Hops', 'Single-Leg Glute Bridges'
      ],
      duration: '45 min'
    },
    'plyo-v2': {
      name: 'Plyometrics V2: Glute & Power',
      description: '45-minute plyometric workout with glute emphasis',
      type: 'plyometric',
      rounds: 4,
      workTime: 40,
      restTime: 20,
      roundRest: 90,
      exercises: [
        'Explosive Glute Bridges', 'Single-Leg Hop Squats', 'Step-Up with Glute Squeeze',
        'Donkey Kick Pulses', 'Jump Lunges Glute Focus', 'Lateral Bounds'
      ],
      duration: '45 min'
    },
    'plyo-v3': {
      name: 'Plyometrics V3: Quad & Agility',
      description: '45-minute plyometric workout with quad and agility emphasis',
      type: 'plyometric',
      rounds: 4,
      workTime: 40,
      restTime: 20,
      roundRest: 90,
      exercises: [
        'Jump Squats Maximum', 'Rapid Step-Ups', 'Lateral Shuffle Sprint Steps',
        'Tuck Jumps', 'Step-Up Lateral Extension', 'High Knees Maximum Speed'
      ],
      duration: '45 min'
    },
    'yoga': {
      name: 'Yoga Session',
      description: 'User-defined yoga/mobility session',
      type: 'yoga',
    },
    'active-recovery': {
      name: 'Active Recovery',
      description: 'Light movement, stretching, walking (30-45 min)',
      type: 'recovery',
      duration: '30-45 min'
    },
    'stretch': {
      name: 'X-Stretch',
      description: 'Full body stretching routine',
      type: 'stretch',
      duration: '30 min'
    },
    'rest': {
      name: 'Rest Day',
      description: 'Complete rest or optional light stretching',
      type: 'rest',
    },
  };

  return templates[workoutId] || templates.rest;
};
