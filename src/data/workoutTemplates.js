/**
 * Science-Based Workout Templates
 * 
 * Pre-built workout templates based on evidence-based training principles:
 * - Progressive overload with appropriate volume and intensity
 * - Optimal training frequency (2x per muscle group per week minimum)
 * - Balanced push/pull ratios for muscle balance
 * - Adequate rest periods for recovery
 * - 7-day weekly structure with built-in rest/active recovery days
 * 
 * Each template includes:
 * - Complete weekly schedule (7 days)
 * - Exercise selection with sets, reps, and rest periods
 * - Target muscle groups and training split
 * - Recommended experience level and goals
 */

/**
 * 4-Day Upper/Lower Split Template
 * 
 * Training frequency: 4 days per week
 * Split: Upper/Lower body alternating
 * Best for: Intermediate lifters, hypertrophy and strength goals
 * Volume: ~15-20 sets per muscle group per week
 * 
 * Weekly Schedule:
 * Day 1 (Mon): Upper Body A
 * Day 2 (Tue): Lower Body A
 * Day 3 (Wed): Rest/Active Recovery
 * Day 4 (Thu): Upper Body B
 * Day 5 (Fri): Lower Body B
 * Day 6 (Sat): Rest/Active Recovery
 * Day 7 (Sun): Rest/Active Recovery
 */
export const upperLowerSplit = {
  id: 'upper_lower_4day',
  name: '4-Day Upper/Lower Split',
  description: 'Balanced upper/lower split focusing on compound movements with progressive overload',
  daysPerWeek: 4,
  experienceLevel: 'intermediate',
  goals: ['hypertrophy', 'strength'],
  equipment: ['barbell', 'dumbbell', 'cable', 'bodyweight'],
  
  // 7-day weekly schedule
  weeklySchedule: [
    {
      dayOfWeek: 0, // Sunday
      type: 'rest',
      name: 'Rest/Active Recovery',
      description: 'Complete rest or light activity (walking, stretching)',
      exercises: null
    },
    {
      dayOfWeek: 1, // Monday
      type: 'upper',
      name: 'Upper Body A - Strength Focus',
      description: 'Heavy compound movements focusing on chest, back, and shoulders',
      exercises: [
        {
          name: 'Barbell Bench Press',
          'Primary Muscle': 'Chest',
          sets: 4,
          reps: '6-8',
          restSeconds: 180,
          notes: 'Focus on progressive overload. Add 2.5-5lbs when you hit 4x8.'
        },
        {
          name: 'Barbell Bent Over Row',
          'Primary Muscle': 'Lats',
          sets: 4,
          reps: '6-8',
          restSeconds: 180,
          notes: 'Maintain neutral spine. Pull to lower chest.'
        },
        {
          name: 'Overhead Press',
          'Primary Muscle': 'Shoulders',
          sets: 3,
          reps: '8-10',
          restSeconds: 120,
          notes: 'Keep core tight. Press slightly back at top.'
        },
        {
          name: 'Pull-Up',
          'Primary Muscle': 'Lats',
          sets: 3,
          reps: '8-12',
          restSeconds: 120,
          notes: 'Use assistance or add weight as needed. Full range of motion.'
        },
        {
          name: 'Incline Dumbbell Press',
          'Primary Muscle': 'Upper Chest',
          sets: 3,
          reps: '10-12',
          restSeconds: 90,
          notes: '30-45 degree incline. Control the eccentric.'
        },
        {
          name: 'Cable Face Pull',
          'Primary Muscle': 'Rear Delts',
          sets: 3,
          reps: '12-15',
          restSeconds: 60,
          notes: 'Pull to face level. Focus on rear delts.'
        },
        {
          name: 'Barbell Curl',
          'Primary Muscle': 'Biceps',
          sets: 3,
          reps: '10-12',
          restSeconds: 60,
          notes: 'Control the weight. Avoid swinging.'
        },
        {
          name: 'Tricep Rope Pushdown',
          'Primary Muscle': 'Triceps',
          sets: 3,
          reps: '12-15',
          restSeconds: 60,
          notes: 'Keep elbows stationary. Full extension.'
        }
      ]
    },
    {
      dayOfWeek: 2, // Tuesday
      type: 'lower',
      name: 'Lower Body A - Quad Focus',
      description: 'Heavy squats and quad-dominant movements',
      exercises: [
        {
          name: 'Barbell Back Squat',
          'Primary Muscle': 'Quads',
          sets: 4,
          reps: '6-8',
          restSeconds: 180,
          notes: 'Progressive overload priority. Squat to parallel or below.'
        },
        {
          name: 'Romanian Deadlift',
          'Primary Muscle': 'Hamstrings',
          sets: 3,
          reps: '8-10',
          restSeconds: 120,
          notes: 'Hip hinge movement. Feel stretch in hamstrings.'
        },
        {
          name: 'Bulgarian Split Squat',
          'Primary Muscle': 'Quads',
          sets: 3,
          reps: '10-12',
          restSeconds: 90,
          notes: 'Per leg. Maintain upright torso.'
        },
        {
          name: 'Leg Press',
          'Primary Muscle': 'Quads',
          sets: 3,
          reps: '12-15',
          restSeconds: 90,
          notes: 'Full range of motion. Control the eccentric.'
        },
        {
          name: 'Leg Curl',
          'Primary Muscle': 'Hamstrings',
          sets: 3,
          reps: '12-15',
          restSeconds: 60,
          notes: 'Squeeze at the top. Slow eccentric.'
        },
        {
          name: 'Standing Calf Raise',
          'Primary Muscle': 'Calves',
          sets: 4,
          reps: '12-15',
          restSeconds: 60,
          notes: 'Full range of motion. Pause at top.'
        },
        {
          name: 'Plank',
          'Primary Muscle': 'Core',
          sets: 3,
          reps: '45-60 sec',
          restSeconds: 60,
          notes: 'Maintain neutral spine. Engage core.'
        }
      ]
    },
    {
      dayOfWeek: 3, // Wednesday
      type: 'rest',
      name: 'Rest/Active Recovery',
      description: 'Complete rest or light cardio (20-30 min walk, stretching)',
      exercises: null
    },
    {
      dayOfWeek: 4, // Thursday
      type: 'upper',
      name: 'Upper Body B - Hypertrophy Focus',
      description: 'Higher volume work with moderate weights',
      exercises: [
        {
          name: 'Incline Barbell Bench Press',
          'Primary Muscle': 'Upper Chest',
          sets: 4,
          reps: '8-10',
          restSeconds: 120,
          notes: 'Focus on upper chest development.'
        },
        {
          name: 'Cable Seated Row',
          'Primary Muscle': 'Lats',
          sets: 4,
          reps: '10-12',
          restSeconds: 90,
          notes: 'Pull to lower chest. Squeeze shoulder blades.'
        },
        {
          name: 'Dumbbell Shoulder Press',
          'Primary Muscle': 'Shoulders',
          sets: 3,
          reps: '10-12',
          restSeconds: 90,
          notes: 'Neutral or pronated grip. Full range of motion.'
        },
        {
          name: 'Lat Pulldown',
          'Primary Muscle': 'Lats',
          sets: 3,
          reps: '10-12',
          restSeconds: 90,
          notes: 'Pull to upper chest. Control the eccentric.'
        },
        {
          name: 'Dumbbell Fly',
          'Primary Muscle': 'Chest',
          sets: 3,
          reps: '12-15',
          restSeconds: 60,
          notes: 'Slight bend in elbows. Feel stretch in chest.'
        },
        {
          name: 'Lateral Raise',
          'Primary Muscle': 'Side Delts',
          sets: 3,
          reps: '12-15',
          restSeconds: 60,
          notes: 'Lead with elbows. Control the weight.'
        },
        {
          name: 'Hammer Curl',
          'Primary Muscle': 'Biceps',
          sets: 3,
          reps: '10-12',
          restSeconds: 60,
          notes: 'Targets brachialis. Neutral grip throughout.'
        },
        {
          name: 'Overhead Tricep Extension',
          'Primary Muscle': 'Triceps',
          sets: 3,
          reps: '12-15',
          restSeconds: 60,
          notes: 'Keep elbows close to head. Full stretch.'
        }
      ]
    },
    {
      dayOfWeek: 5, // Friday
      type: 'lower',
      name: 'Lower Body B - Posterior Chain Focus',
      description: 'Deadlift and hamstring/glute dominant movements',
      exercises: [
        {
          name: 'Conventional Deadlift',
          'Primary Muscle': 'Hamstrings',
          sets: 4,
          reps: '5-8',
          restSeconds: 180,
          notes: 'Progressive overload priority. Maintain neutral spine.'
        },
        {
          name: 'Front Squat',
          'Primary Muscle': 'Quads',
          sets: 3,
          reps: '8-10',
          restSeconds: 120,
          notes: 'Upright torso. Elbows high.'
        },
        {
          name: 'Walking Lunge',
          'Primary Muscle': 'Quads',
          sets: 3,
          reps: '12-15',
          restSeconds: 90,
          notes: 'Per leg. Step forward with control.'
        },
        {
          name: 'Leg Extension',
          'Primary Muscle': 'Quads',
          sets: 3,
          reps: '12-15',
          restSeconds: 60,
          notes: 'Squeeze quads at top. Control the eccentric.'
        },
        {
          name: 'Glute-Ham Raise',
          'Primary Muscle': 'Hamstrings',
          sets: 3,
          reps: '8-12',
          restSeconds: 90,
          notes: 'Use assistance if needed. Focus on hamstrings.'
        },
        {
          name: 'Seated Calf Raise',
          'Primary Muscle': 'Calves',
          sets: 4,
          reps: '15-20',
          restSeconds: 60,
          notes: 'Targets soleus. Full range of motion.'
        },
        {
          name: 'Cable Crunch',
          'Primary Muscle': 'Abs',
          sets: 3,
          reps: '15-20',
          restSeconds: 60,
          notes: 'Crunch down, not forward. Squeeze abs.'
        }
      ]
    },
    {
      dayOfWeek: 6, // Saturday
      type: 'rest',
      name: 'Rest/Active Recovery',
      description: 'Complete rest or light activity (yoga, swimming, cycling)',
      exercises: null
    }
  ],
  
  // Training notes and guidance
  trainingNotes: {
    frequency: 'Train 2x per week per muscle group for optimal hypertrophy',
    progression: 'Add weight when you can complete all sets at the top of the rep range',
    recovery: 'Ensure 48-72 hours between training the same muscle group',
    nutrition: 'Maintain caloric surplus for muscle growth or deficit for fat loss'
  }
};

/**
 * Push/Pull/Legs (PPL) 6-Day Template
 * 
 * Training frequency: 6 days per week
 * Split: Push/Pull/Legs twice per week
 * Best for: Advanced lifters, maximum muscle growth
 * Volume: ~20-25 sets per muscle group per week
 * 
 * Weekly Schedule:
 * Day 1 (Mon): Push A
 * Day 2 (Tue): Pull A
 * Day 3 (Wed): Legs A
 * Day 4 (Thu): Push B
 * Day 5 (Fri): Pull B
 * Day 6 (Sat): Legs B
 * Day 7 (Sun): Rest
 */
export const pushPullLegs = {
  id: 'ppl_6day',
  name: 'Push/Pull/Legs (6 Days)',
  description: 'High-frequency split hitting each muscle group twice per week with optimal volume',
  daysPerWeek: 6,
  experienceLevel: 'advanced',
  goals: ['hypertrophy', 'strength'],
  equipment: ['barbell', 'dumbbell', 'cable', 'bodyweight'],
  
  weeklySchedule: [
    {
      dayOfWeek: 0, // Sunday
      type: 'rest',
      name: 'Rest Day',
      description: 'Complete rest for recovery. Focus on sleep and nutrition.',
      exercises: null
    },
    {
      dayOfWeek: 1, // Monday
      type: 'push',
      name: 'Push A - Chest Focus',
      description: 'Chest, shoulders, and triceps with emphasis on pressing movements',
      exercises: [
        {
          name: 'Barbell Bench Press',
          'Primary Muscle': 'Chest',
          sets: 4,
          reps: '6-8',
          restSeconds: 180,
          notes: 'Main strength movement. Progressive overload priority.'
        },
        {
          name: 'Incline Dumbbell Press',
          'Primary Muscle': 'Upper Chest',
          sets: 4,
          reps: '8-10',
          restSeconds: 120,
          notes: '30-45 degree angle. Focus on upper chest.'
        },
        {
          name: 'Overhead Press',
          'Primary Muscle': 'Shoulders',
          sets: 3,
          reps: '8-10',
          restSeconds: 120,
          notes: 'Barbell or dumbbell. Keep core tight.'
        },
        {
          name: 'Dumbbell Fly',
          'Primary Muscle': 'Chest',
          sets: 3,
          reps: '10-12',
          restSeconds: 90,
          notes: 'Slight elbow bend. Feel the stretch.'
        },
        {
          name: 'Lateral Raise',
          'Primary Muscle': 'Side Delts',
          sets: 3,
          reps: '12-15',
          restSeconds: 60,
          notes: 'Lead with elbows. Control the negative.'
        },
        {
          name: 'Tricep Rope Pushdown',
          'Primary Muscle': 'Triceps',
          sets: 3,
          reps: '12-15',
          restSeconds: 60,
          notes: 'Keep elbows pinned. Full extension.'
        },
        {
          name: 'Overhead Tricep Extension',
          'Primary Muscle': 'Triceps',
          sets: 3,
          reps: '12-15',
          restSeconds: 60,
          notes: 'Dumbbell or rope. Full stretch at bottom.'
        }
      ]
    },
    {
      dayOfWeek: 2, // Tuesday
      type: 'pull',
      name: 'Pull A - Back Width',
      description: 'Back, biceps with focus on lat width and thickness',
      exercises: [
        {
          name: 'Deadlift',
          'Primary Muscle': 'Hamstrings',
          sets: 4,
          reps: '5-8',
          restSeconds: 180,
          notes: 'Heavy compound. Build posterior chain strength.'
        },
        {
          name: 'Pull-Up',
          'Primary Muscle': 'Lats',
          sets: 4,
          reps: '8-12',
          restSeconds: 120,
          notes: 'Wide grip. Full range of motion for width.'
        },
        {
          name: 'Barbell Bent Over Row',
          'Primary Muscle': 'Lats',
          sets: 4,
          reps: '8-10',
          restSeconds: 120,
          notes: 'Pull to lower chest. Retract scapula.'
        },
        {
          name: 'Cable Face Pull',
          'Primary Muscle': 'Rear Delts',
          sets: 3,
          reps: '12-15',
          restSeconds: 60,
          notes: 'Pull to face. Emphasize rear delts.'
        },
        {
          name: 'Dumbbell Shrug',
          'Primary Muscle': 'Traps',
          sets: 3,
          reps: '12-15',
          restSeconds: 60,
          notes: 'Straight up and down. Squeeze at top.'
        },
        {
          name: 'Barbell Curl',
          'Primary Muscle': 'Biceps',
          sets: 3,
          reps: '10-12',
          restSeconds: 60,
          notes: 'No swinging. Control the eccentric.'
        },
        {
          name: 'Hammer Curl',
          'Primary Muscle': 'Biceps',
          sets: 3,
          reps: '10-12',
          restSeconds: 60,
          notes: 'Neutral grip. Targets brachialis.'
        }
      ]
    },
    {
      dayOfWeek: 3, // Wednesday
      type: 'legs',
      name: 'Legs A - Quad Focus',
      description: 'Quad-dominant leg day with compound and isolation work',
      exercises: [
        {
          name: 'Barbell Back Squat',
          'Primary Muscle': 'Quads',
          sets: 4,
          reps: '6-8',
          restSeconds: 180,
          notes: 'King of leg exercises. Progressive overload.'
        },
        {
          name: 'Front Squat',
          'Primary Muscle': 'Quads',
          sets: 3,
          reps: '8-10',
          restSeconds: 120,
          notes: 'Upright torso. More quad emphasis.'
        },
        {
          name: 'Romanian Deadlift',
          'Primary Muscle': 'Hamstrings',
          sets: 3,
          reps: '10-12',
          restSeconds: 90,
          notes: 'Hip hinge. Feel hamstring stretch.'
        },
        {
          name: 'Leg Press',
          'Primary Muscle': 'Quads',
          sets: 3,
          reps: '12-15',
          restSeconds: 90,
          notes: 'High volume. Full range of motion.'
        },
        {
          name: 'Leg Extension',
          'Primary Muscle': 'Quads',
          sets: 3,
          reps: '12-15',
          restSeconds: 60,
          notes: 'Isolation work. Squeeze at top.'
        },
        {
          name: 'Leg Curl',
          'Primary Muscle': 'Hamstrings',
          sets: 3,
          reps: '12-15',
          restSeconds: 60,
          notes: 'Control the movement. Full contraction.'
        },
        {
          name: 'Standing Calf Raise',
          'Primary Muscle': 'Calves',
          sets: 4,
          reps: '15-20',
          restSeconds: 60,
          notes: 'Full range. Pause at top.'
        }
      ]
    },
    {
      dayOfWeek: 4, // Thursday
      type: 'push',
      name: 'Push B - Shoulder Focus',
      description: 'Shoulders, chest, and triceps with emphasis on shoulder development',
      exercises: [
        {
          name: 'Overhead Press',
          'Primary Muscle': 'Shoulders',
          sets: 4,
          reps: '6-8',
          restSeconds: 180,
          notes: 'Heavy shoulder work. Build strength.'
        },
        {
          name: 'Incline Barbell Bench Press',
          'Primary Muscle': 'Upper Chest',
          sets: 4,
          reps: '8-10',
          restSeconds: 120,
          notes: 'Upper chest development.'
        },
        {
          name: 'Dumbbell Shoulder Press',
          'Primary Muscle': 'Shoulders',
          sets: 3,
          reps: '10-12',
          restSeconds: 90,
          notes: 'Full range of motion. Control the weight.'
        },
        {
          name: 'Cable Crossover',
          'Primary Muscle': 'Chest',
          sets: 3,
          reps: '12-15',
          restSeconds: 60,
          notes: 'Constant tension. Squeeze at contraction.'
        },
        {
          name: 'Front Raise',
          'Primary Muscle': 'Front Delts',
          sets: 3,
          reps: '12-15',
          restSeconds: 60,
          notes: 'Barbell or dumbbell. Raise to eye level.'
        },
        {
          name: 'Tricep Dip',
          'Primary Muscle': 'Triceps',
          sets: 3,
          reps: '10-12',
          restSeconds: 90,
          notes: 'Bodyweight or weighted. Full range.'
        },
        {
          name: 'Close-Grip Bench Press',
          'Primary Muscle': 'Triceps',
          sets: 3,
          reps: '10-12',
          restSeconds: 90,
          notes: 'Hands shoulder-width. Tricep emphasis.'
        }
      ]
    },
    {
      dayOfWeek: 5, // Friday
      type: 'pull',
      name: 'Pull B - Back Thickness',
      description: 'Back and biceps with focus on thickness and detail',
      exercises: [
        {
          name: 'Cable Seated Row',
          'Primary Muscle': 'Lats',
          sets: 4,
          reps: '8-10',
          restSeconds: 120,
          notes: 'Pull to lower chest. Build thickness.'
        },
        {
          name: 'Lat Pulldown',
          'Primary Muscle': 'Lats',
          sets: 4,
          reps: '10-12',
          restSeconds: 90,
          notes: 'Wide grip. Control the eccentric.'
        },
        {
          name: 'T-Bar Row',
          'Primary Muscle': 'Lats',
          sets: 3,
          reps: '10-12',
          restSeconds: 90,
          notes: 'Mid-back thickness. Full range.'
        },
        {
          name: 'Single-Arm Dumbbell Row',
          'Primary Muscle': 'Lats',
          sets: 3,
          reps: '10-12',
          restSeconds: 60,
          notes: 'Per arm. Full stretch and contraction.'
        },
        {
          name: 'Reverse Fly',
          'Primary Muscle': 'Rear Delts',
          sets: 3,
          reps: '12-15',
          restSeconds: 60,
          notes: 'Cable or dumbbell. Rear delt isolation.'
        },
        {
          name: 'Cable Curl',
          'Primary Muscle': 'Biceps',
          sets: 3,
          reps: '12-15',
          restSeconds: 60,
          notes: 'Constant tension. Peak contraction.'
        },
        {
          name: 'Concentration Curl',
          'Primary Muscle': 'Biceps',
          sets: 3,
          reps: '12-15',
          restSeconds: 60,
          notes: 'Per arm. Focus on bicep peak.'
        }
      ]
    },
    {
      dayOfWeek: 6, // Saturday
      type: 'legs',
      name: 'Legs B - Posterior Chain Focus',
      description: 'Hamstring and glute dominant leg day',
      exercises: [
        {
          name: 'Romanian Deadlift',
          'Primary Muscle': 'Hamstrings',
          sets: 4,
          reps: '8-10',
          restSeconds: 120,
          notes: 'Hip hinge pattern. Build posterior chain.'
        },
        {
          name: 'Bulgarian Split Squat',
          'Primary Muscle': 'Quads',
          sets: 3,
          reps: '10-12',
          restSeconds: 90,
          notes: 'Per leg. Balance and unilateral strength.'
        },
        {
          name: 'Leg Press',
          'Primary Muscle': 'Quads',
          sets: 3,
          reps: '12-15',
          restSeconds: 90,
          notes: 'High foot placement for glutes.'
        },
        {
          name: 'Leg Curl',
          'Primary Muscle': 'Hamstrings',
          sets: 4,
          reps: '12-15',
          restSeconds: 60,
          notes: 'Hamstring isolation. Control the eccentric.'
        },
        {
          name: 'Walking Lunge',
          'Primary Muscle': 'Quads',
          sets: 3,
          reps: '12-15',
          restSeconds: 60,
          notes: 'Per leg. Focus on glute activation.'
        },
        {
          name: 'Glute-Ham Raise',
          'Primary Muscle': 'Hamstrings',
          sets: 3,
          reps: '8-12',
          restSeconds: 90,
          notes: 'Bodyweight or loaded. Eccentric control.'
        },
        {
          name: 'Seated Calf Raise',
          'Primary Muscle': 'Calves',
          sets: 4,
          reps: '15-20',
          restSeconds: 60,
          notes: 'Soleus focus. Full range of motion.'
        }
      ]
    }
  ],
  
  trainingNotes: {
    frequency: 'High frequency - train each muscle group 2x per week',
    progression: 'Linear progression on main lifts, add weight or reps weekly',
    recovery: 'Ensure adequate sleep (7-9 hours) and nutrition for recovery',
    volume: 'High volume program - monitor fatigue and deload every 4-6 weeks'
  }
};

/**
 * 3-Day Full Body Template
 * 
 * Training frequency: 3 days per week
 * Split: Full body each session
 * Best for: Beginners, busy schedules, general fitness
 * Volume: ~12-15 sets per muscle group per week
 * 
 * Weekly Schedule:
 * Day 1 (Mon): Full Body A
 * Day 2 (Tue): Rest/Active Recovery
 * Day 3 (Wed): Full Body B
 * Day 4 (Thu): Rest/Active Recovery
 * Day 5 (Fri): Full Body C
 * Day 6 (Sat): Rest/Active Recovery
 * Day 7 (Sun): Rest/Active Recovery
 */
export const fullBody3Day = {
  id: 'fullbody_3day',
  name: '3-Day Full Body',
  description: 'Efficient full-body workouts hitting all major muscle groups 3x per week',
  daysPerWeek: 3,
  experienceLevel: 'beginner',
  goals: ['general_fitness', 'strength', 'hypertrophy'],
  equipment: ['barbell', 'dumbbell', 'cable', 'bodyweight'],
  
  weeklySchedule: [
    {
      dayOfWeek: 0, // Sunday
      type: 'rest',
      name: 'Rest/Active Recovery',
      description: 'Complete rest or light activity (walking, yoga)',
      exercises: null
    },
    {
      dayOfWeek: 1, // Monday
      type: 'full',
      name: 'Full Body A - Compound Focus',
      description: 'Major compound movements for all muscle groups',
      exercises: [
        {
          name: 'Barbell Back Squat',
          'Primary Muscle': 'Quads',
          sets: 3,
          reps: '8-10',
          restSeconds: 120,
          notes: 'Main lower body movement. Focus on form.'
        },
        {
          name: 'Barbell Bench Press',
          'Primary Muscle': 'Chest',
          sets: 3,
          reps: '8-10',
          restSeconds: 120,
          notes: 'Main upper body push. Controlled descent.'
        },
        {
          name: 'Barbell Bent Over Row',
          'Primary Muscle': 'Lats',
          sets: 3,
          reps: '8-10',
          restSeconds: 120,
          notes: 'Main upper body pull. Neutral spine.'
        },
        {
          name: 'Overhead Press',
          'Primary Muscle': 'Shoulders',
          sets: 3,
          reps: '8-10',
          restSeconds: 90,
          notes: 'Build shoulder strength. Core tight.'
        },
        {
          name: 'Romanian Deadlift',
          'Primary Muscle': 'Hamstrings',
          sets: 3,
          reps: '10-12',
          restSeconds: 90,
          notes: 'Hip hinge. Feel hamstring stretch.'
        },
        {
          name: 'Pull-Up',
          'Primary Muscle': 'Lats',
          sets: 3,
          reps: '6-10',
          restSeconds: 90,
          notes: 'Assisted if needed. Build to bodyweight.'
        },
        {
          name: 'Plank',
          'Primary Muscle': 'Core',
          sets: 3,
          reps: '30-60 sec',
          restSeconds: 60,
          notes: 'Core stability. Neutral spine.'
        }
      ]
    },
    {
      dayOfWeek: 2, // Tuesday
      type: 'rest',
      name: 'Rest/Active Recovery',
      description: 'Light cardio optional (20-30 min walk)',
      exercises: null
    },
    {
      dayOfWeek: 3, // Wednesday
      type: 'full',
      name: 'Full Body B - Variation Day',
      description: 'Exercise variations for balanced development',
      exercises: [
        {
          name: 'Front Squat',
          'Primary Muscle': 'Quads',
          sets: 3,
          reps: '8-10',
          restSeconds: 120,
          notes: 'Squat variation. Upright torso.'
        },
        {
          name: 'Incline Dumbbell Press',
          'Primary Muscle': 'Upper Chest',
          sets: 3,
          reps: '10-12',
          restSeconds: 90,
          notes: 'Upper chest focus. Control the weight.'
        },
        {
          name: 'Cable Seated Row',
          'Primary Muscle': 'Lats',
          sets: 3,
          reps: '10-12',
          restSeconds: 90,
          notes: 'Pull to lower chest. Squeeze back.'
        },
        {
          name: 'Dumbbell Shoulder Press',
          'Primary Muscle': 'Shoulders',
          sets: 3,
          reps: '10-12',
          restSeconds: 90,
          notes: 'Neutral or pronated grip.'
        },
        {
          name: 'Leg Curl',
          'Primary Muscle': 'Hamstrings',
          sets: 3,
          reps: '12-15',
          restSeconds: 60,
          notes: 'Hamstring isolation. Controlled reps.'
        },
        {
          name: 'Lat Pulldown',
          'Primary Muscle': 'Lats',
          sets: 3,
          reps: '10-12',
          restSeconds: 60,
          notes: 'Pull to upper chest. Full range.'
        },
        {
          name: 'Cable Crunch',
          'Primary Muscle': 'Abs',
          sets: 3,
          reps: '15-20',
          restSeconds: 60,
          notes: 'Crunch down. Squeeze abs.'
        }
      ]
    },
    {
      dayOfWeek: 4, // Thursday
      type: 'rest',
      name: 'Rest/Active Recovery',
      description: 'Rest day for recovery',
      exercises: null
    },
    {
      dayOfWeek: 5, // Friday
      type: 'full',
      name: 'Full Body C - Volume Day',
      description: 'Higher rep ranges for muscle endurance and hypertrophy',
      exercises: [
        {
          name: 'Goblet Squat',
          'Primary Muscle': 'Quads',
          sets: 3,
          reps: '12-15',
          restSeconds: 90,
          notes: 'Dumbbell or kettlebell. Squat deep.'
        },
        {
          name: 'Dumbbell Bench Press',
          'Primary Muscle': 'Chest',
          sets: 3,
          reps: '10-12',
          restSeconds: 90,
          notes: 'Full range of motion. Control descent.'
        },
        {
          name: 'Single-Arm Dumbbell Row',
          'Primary Muscle': 'Lats',
          sets: 3,
          reps: '10-12',
          restSeconds: 60,
          notes: 'Per arm. Full stretch and contraction.'
        },
        {
          name: 'Lateral Raise',
          'Primary Muscle': 'Side Delts',
          sets: 3,
          reps: '12-15',
          restSeconds: 60,
          notes: 'Shoulder width. Control the negative.'
        },
        {
          name: 'Walking Lunge',
          'Primary Muscle': 'Quads',
          sets: 3,
          reps: '12-15',
          restSeconds: 90,
          notes: 'Per leg. Controlled steps.'
        },
        {
          name: 'Cable Face Pull',
          'Primary Muscle': 'Rear Delts',
          sets: 3,
          reps: '15-20',
          restSeconds: 60,
          notes: 'Pull to face. Rear delt focus.'
        },
        {
          name: 'Bicycle Crunch',
          'Primary Muscle': 'Abs',
          sets: 3,
          reps: '20-30',
          restSeconds: 60,
          notes: 'Alternate sides. Full rotation.'
        }
      ]
    },
    {
      dayOfWeek: 6, // Saturday
      type: 'rest',
      name: 'Rest/Active Recovery',
      description: 'Optional light activity (stretching, swimming)',
      exercises: null
    }
  ],
  
  trainingNotes: {
    frequency: 'Train 3x per week with rest days between sessions',
    progression: 'Focus on mastering form before adding weight',
    recovery: 'Full rest days are crucial for recovery and adaptation',
    nutrition: 'Eat adequate protein (0.8-1g per lb bodyweight) for muscle recovery'
  }
};

/**
 * Array of all available templates
 */
export const allTemplates = [
  fullBody3Day,
  upperLowerSplit,
  pushPullLegs
];

/**
 * Get template by ID
 * @param {string} templateId - Template identifier
 * @returns {Object|null} Template object or null if not found
 */
export const getTemplateById = (templateId) => {
  return allTemplates.find(template => template.id === templateId) || null;
};

/**
 * Get recommended templates based on user preferences
 * @param {Object} preferences - User preferences
 * @param {string} preferences.goal - Fitness goal
 * @param {string} preferences.experienceLevel - Experience level
 * @param {number} preferences.daysPerWeek - Available training days
 * @returns {Array} Array of recommended template IDs sorted by relevance
 */
export const getRecommendedTemplates = (preferences) => {
  const { goal, experienceLevel, daysPerWeek } = preferences;
  
  const scores = allTemplates.map(template => {
    let score = 0;
    
    // Match goal
    if (template.goals.includes(goal)) {
      score += 3;
    }
    
    // Match experience level
    if (template.experienceLevel === experienceLevel) {
      score += 2;
    } else if (
      (experienceLevel === 'beginner' && template.experienceLevel === 'intermediate') ||
      (experienceLevel === 'advanced' && template.experienceLevel === 'intermediate')
    ) {
      score += 1; // Intermediate templates work for all levels
    }
    
    // Match days per week (prefer exact match, allow +/- 1 day)
    if (template.daysPerWeek === daysPerWeek) {
      score += 3;
    } else if (Math.abs(template.daysPerWeek - daysPerWeek) === 1) {
      score += 1;
    }
    
    return { template, score };
  });
  
  // Sort by score descending and return template objects
  return scores
    .sort((a, b) => b.score - a.score)
    .map(item => item.template);
};
