/**
 * Utilities for creating and managing the 90-day workout program
 */

/**
 * Parse the 90-day calendar and create a structured plan
 * @returns {Object} The premade 90-day plan
 */
export const create90DayPlan = () => {
  const plan = {
    id: 'premade-90-day',
    name: '90-Day Transformation Program',
    description: 'Complete 90-day program with strength, power, plyometric, yoga, and core workouts',
    isPremade: true,
    totalDays: 90,
    days: [],
  };

  // Phase 1: Foundation (Days 1-30)
  const phase1Pattern = [
    { type: 'upper', name: 'Upper Body Strength', phase: 'Foundation' },
    { type: 'lower', name: 'Lower Body Strength', phase: 'Foundation' },
    { type: 'yoga', name: 'Yoga Session', duration: 30, phase: 'Foundation' },
    { type: 'core', name: 'Core Strength', phase: 'Foundation' },
    { type: 'full', name: 'Full Body Strength', phase: 'Foundation' },
    { type: 'plyometric', name: 'Plyometric Training', phase: 'Foundation' },
    { type: 'rest', name: 'Rest Day', phase: 'Foundation' },
  ];

  // Add Phase 1 (days 1-21)
  for (let week = 0; week < 3; week++) {
    phase1Pattern.forEach(day => {
      plan.days.push({ ...day });
    });
  }

  // Week 4 - Recovery Week (days 22-28)
  plan.days.push(
    { type: 'upper', name: 'Upper Body Strength (Light)', intensity: 'light', phase: 'Foundation' },
    { type: 'yoga', name: 'Yoga Session', duration: 45, phase: 'Foundation' },
    { type: 'core', name: 'Core Strength', phase: 'Foundation' },
    { type: 'yoga', name: 'Yoga Session', duration: 30, phase: 'Foundation' },
    { type: 'lower', name: 'Lower Body Strength (Light)', intensity: 'light', phase: 'Foundation' },
    { type: 'yoga', name: 'Yoga Session', duration: 60, phase: 'Foundation' },
    { type: 'rest', name: 'Rest Day', phase: 'Foundation' }
  );

  // Days 29-30
  plan.days.push(
    { type: 'full', name: 'Full Body Strength', phase: 'Foundation' },
    { type: 'yoga', name: 'Yoga Session', duration: 30, phase: 'Foundation' }
  );

  // Phase 2: Progressive Overload (Days 31-60)
  const phase2Pattern = [
    { type: 'upper', name: 'Upper Body Power', intensity: 'power', phase: 'Progressive Overload' },
    { type: 'lower', name: 'Lower Body Power', intensity: 'power', phase: 'Progressive Overload' },
    { type: 'yoga', name: 'Yoga Session', duration: 30, phase: 'Progressive Overload' },
    { type: 'core', name: 'Core Strength', phase: 'Progressive Overload' },
    { type: 'full', name: 'Full Body Power', intensity: 'power', phase: 'Progressive Overload' },
    { type: 'plyometric', name: 'Plyometric Training', phase: 'Progressive Overload' },
    { type: 'rest', name: 'Rest Day', phase: 'Progressive Overload' },
  ];

  // Add Phase 2 weeks 5-7 (days 31-51)
  for (let week = 0; week < 3; week++) {
    phase2Pattern.forEach((day, idx) => {
      // Increase yoga duration in week 6 and 7
      if (day.type === 'yoga' && week > 0) {
        plan.days.push({ ...day, duration: 45 });
      } else {
        plan.days.push({ ...day });
      }
    });
  }

  // Week 8 - Recovery Week (days 52-58)
  plan.days.push(
    { type: 'upper', name: 'Upper Body Strength (Moderate)', intensity: 'moderate', phase: 'Progressive Overload' },
    { type: 'yoga', name: 'Yoga Session', duration: 60, phase: 'Progressive Overload' },
    { type: 'core', name: 'Core Strength', phase: 'Progressive Overload' },
    { type: 'yoga', name: 'Yoga Session', duration: 45, phase: 'Progressive Overload' },
    { type: 'lower', name: 'Lower Body Strength (Moderate)', intensity: 'moderate', phase: 'Progressive Overload' },
    { type: 'yoga', name: 'Yoga Session', duration: 60, phase: 'Progressive Overload' },
    { type: 'rest', name: 'Rest Day', phase: 'Progressive Overload' }
  );

  // Days 59-60
  plan.days.push(
    { type: 'full', name: 'Full Body Power', intensity: 'power', phase: 'Progressive Overload' },
    { type: 'yoga', name: 'Yoga Session', duration: 45, phase: 'Progressive Overload' }
  );

  // Phase 3: Peak Performance (Days 61-90)
  const phase3Pattern = [
    { type: 'upper', name: 'Upper Body Power', intensity: 'power', phase: 'Peak Performance' },
    { type: 'lower', name: 'Lower Body Power', intensity: 'power', phase: 'Peak Performance' },
    { type: 'yoga', name: 'Yoga Session', duration: 30, phase: 'Peak Performance' },
    { type: 'core', name: 'Core Strength', phase: 'Peak Performance' },
    { type: 'full', name: 'Full Body Power', intensity: 'power', phase: 'Peak Performance' },
    { type: 'plyometric', name: 'Plyometric Training', phase: 'Peak Performance' },
    { type: 'rest', name: 'Rest Day', phase: 'Peak Performance' },
  ];

  // Add Phase 3 weeks 9-11 (days 61-81)
  for (let week = 0; week < 3; week++) {
    phase3Pattern.forEach((day, idx) => {
      // Increase yoga duration in later weeks
      if (day.type === 'yoga' && week === 1) {
        plan.days.push({ ...day, duration: 45 });
      } else if (day.type === 'yoga' && week === 2) {
        plan.days.push({ ...day, duration: 60 });
      } else {
        plan.days.push({ ...day });
      }
    });
  }

  // Week 12 - Final Recovery Week (days 82-88)
  plan.days.push(
    { type: 'upper', name: 'Upper Body Strength (Light)', intensity: 'light', phase: 'Peak Performance' },
    { type: 'yoga', name: 'Yoga Session', duration: 45, phase: 'Peak Performance' },
    { type: 'core', name: 'Core Strength', phase: 'Peak Performance' },
    { type: 'yoga', name: 'Yoga Session', duration: 60, phase: 'Peak Performance' },
    { type: 'lower', name: 'Lower Body Strength (Light)', intensity: 'light', phase: 'Peak Performance' },
    { type: 'yoga', name: 'Yoga Session', duration: 60, phase: 'Peak Performance' },
    { type: 'rest', name: 'Rest Day', phase: 'Peak Performance' }
  );

  // Final days 89-90
  plan.days.push(
    { type: 'full', name: 'Full Body Power', intensity: 'power', phase: 'Peak Performance' },
    { type: 'yoga', name: 'Yoga Session', duration: 60, phase: 'Peak Performance' }
  );

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
      intensity: day.intensity,
      duration: day.duration,
      status: 'scheduled',
      deferred: false,
    });
  });

  return scheduled;
};

/**
 * Get workout template based on type and intensity
 * @param {string} type - Workout type (upper, lower, full, core, plyometric, yoga, rest)
 * @param {string} intensity - Intensity level (light, moderate, power)
 * @returns {Object} Workout template
 */
export const getWorkoutTemplate = (type, intensity = 'normal') => {
  const templates = {
    upper: {
      name: intensity === 'power' ? 'Upper Body Power' : 'Upper Body Strength',
      exercises: [
        'Barbell Bench Press',
        'Pull-Ups',
        'Overhead Press',
        'Barbell Bent-Over Row',
        'Dips',
        intensity === 'power' ? 'Barbell Curls' : 'Bicep Curls',
      ],
      sets: intensity === 'power' ? 5 : 4,
      reps: intensity === 'power' ? '5-8' : intensity === 'light' ? '10-15' : '8-12',
    },
    lower: {
      name: intensity === 'power' ? 'Lower Body Power' : 'Lower Body Strength',
      exercises: [
        'Back Squat',
        intensity === 'power' ? 'Deadlift' : 'Romanian Deadlift',
        'Leg Press',
        'Bulgarian Split Squat',
        'Leg Curl',
        'Calf Raises',
      ],
      sets: intensity === 'power' ? 5 : 4,
      reps: intensity === 'power' ? '5-8' : intensity === 'light' ? '10-15' : '8-12',
    },
    full: {
      name: intensity === 'power' ? 'Full Body Power' : 'Full Body Strength',
      exercises: [
        'Deadlift',
        'Barbell Bench Press',
        'Back Squat',
        'Pull-Ups',
        'Overhead Press',
        intensity === 'power' ? 'Power Cleans' : 'Barbell Bent-Over Row',
      ],
      sets: intensity === 'power' ? 5 : 4,
      reps: intensity === 'power' ? '5-8' : intensity === 'light' ? '10-15' : '8-12',
    },
    core: {
      name: 'Core Strength',
      exercises: [
        'Planks',
        'Russian Twists',
        'Leg Raises',
        'Dead Bug',
        'Bird Dog',
        'Mountain Climbers',
      ],
      sets: 3,
      reps: '12-20 or 30-60 sec holds',
    },
    plyometric: {
      name: 'Plyometric Training',
      exercises: [
        'Box Jumps',
        'Burpees',
        'Jump Squats',
        'Tuck Jumps',
        'Lateral Bounds',
        'Broad Jumps',
      ],
      rounds: 4,
      workTime: 40,
      restTime: 20,
    },
    yoga: {
      name: 'Yoga Session',
      // Duration will be specified in the schedule
    },
    rest: {
      name: 'Rest Day',
    },
  };

  return templates[type] || templates.rest;
};
