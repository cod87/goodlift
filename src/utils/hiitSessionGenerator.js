/**
 * HIIT Session Generator
 * 
 * Generates science-backed HIIT workout sessions based on protocols from .github/HIIT-YOGA-GUIDE.md
 * 
 * Key Features:
 * - Multiple work-to-rest ratios (1:4, 1:2, 1:1, 2:1, Tabata, REHIT) per Guide Section 1.2
 * - Progressive difficulty levels (beginner, intermediate, advanced) per Guide Section 1.3
 * - Multiple modalities (bodyweight, plyometric, cycling, rowing, elliptical, step) per Guide Sections 2-7
 * - Health goal targeting (fat loss, cardiovascular, power) per Guide Section 1.1
 * - Lower-impact modifications per Guide Sections 2.1, 3.1
 * 
 * @module hiitSessionGenerator
 */

/**
 * HIIT Protocol definitions from Guide Section 1.2
 */
export const HIIT_PROTOCOLS = {
  MAX_POWER: {
    name: 'Maximum Power (1:4)',
    workSeconds: 20,
    restSeconds: 80,
    description: 'Maximum power development, allows full recovery, sustainable anaerobic training',
    guideSection: '1.2',
    difficulty: 'beginner'
  },
  BALANCED: {
    name: 'Balanced (1:2)',
    workSeconds: 30,
    restSeconds: 60,
    description: 'Balanced anaerobic-aerobic stimulus, moderate cardiovascular demand',
    guideSection: '1.2',
    difficulty: 'intermediate'
  },
  CONDITIONING: {
    name: 'Conditioning (1:1)',
    workSeconds: 45,
    restSeconds: 45,
    description: 'Aerobic-dominant stimulus, sustainable intensity, excellent for conditioning',
    guideSection: '1.2',
    difficulty: 'intermediate'
  },
  METABOLIC: {
    name: 'Metabolic (2:1)',
    workSeconds: 40,
    restSeconds: 20,
    description: 'High intensity, significant metabolic demand, requires higher fitness base',
    guideSection: '1.2',
    difficulty: 'advanced'
  },
  TABATA: {
    name: 'Tabata',
    workSeconds: 20,
    restSeconds: 10,
    description: 'Maximum intensity protocol, 8 rounds per exercise',
    guideSection: '1.2',
    difficulty: 'advanced'
  },
  REHIT: {
    name: 'REHIT',
    workSeconds: 20,
    restSeconds: 150, // 2.5 minutes
    description: 'Maximum intensity, minimal total time, advanced only',
    guideSection: '1.2',
    difficulty: 'advanced'
  }
};

/**
 * Exercise categories and their health benefits
 */
export const EXERCISE_CATEGORIES = {
  BODYWEIGHT: {
    name: 'Bodyweight HIIT',
    benefits: ['Fat loss', 'Cardiovascular health', 'Full-body conditioning'],
    guideSection: '2'
  },
  PLYOMETRIC: {
    name: 'Plyometric HIIT',
    benefits: ['Power development', 'Explosive strength', 'Athletic performance'],
    guideSection: '3'
  },
  CYCLING: {
    name: 'Cycling HIIT',
    benefits: ['Low-impact', 'Cardiovascular fitness', 'Leg strength'],
    guideSection: '4'
  },
  ROWING: {
    name: 'Rowing HIIT',
    benefits: ['Full-body engagement', 'Low-impact', 'Cardiovascular health'],
    guideSection: '5'
  },
  ELLIPTICAL: {
    name: 'Elliptical HIIT',
    benefits: ['Very low-impact', 'Joint-friendly', 'Cardiovascular fitness'],
    guideSection: '6'
  },
  STEP: {
    name: 'Step Platform HIIT',
    benefits: ['Lower body power', 'Coordination', 'Metabolic conditioning'],
    guideSection: '7'
  }
};

/**
 * Generate a bodyweight HIIT session
 * Based on Guide Sections 2.2 (Beginner), 2.3 (Intermediate), 2.4 (Advanced)
 * 
 * @param {Object} options - Session options
 * @param {string} options.level - 'beginner' | 'intermediate' | 'advanced'
 * @param {string} options.protocol - Protocol key from HIIT_PROTOCOLS
 * @param {Array<Object>} options.exercises - Array of exercise objects from exercises.json
 * @param {boolean} options.lowerImpact - Use lower-impact modifications
 * @returns {Object} Generated HIIT session
 */
export const generateBodyweightSession = (options) => {
  const { level = 'intermediate', protocol = 'BALANCED', exercises = [], lowerImpact = false } = options;
  
  const selectedProtocol = HIIT_PROTOCOLS[protocol];
  
  // Filter for HIIT bodyweight exercises
  const hiitExercises = exercises.filter(ex => 
    ex['Exercise Type'] === 'HIIT' && 
    ex.Equipment === 'Bodyweight' &&
    (!ex.Category || ex.Category !== 'Plyometric') // Exclude plyometric for pure bodyweight
  );
  
  // Apply impact level filter if needed
  const filteredExercises = lowerImpact 
    ? hiitExercises.filter(ex => ex['Impact Level'] === 'Low' || ex['Impact Level'] === 'Moderate')
    : hiitExercises;
  
  // Determine session parameters based on level (Guide Section 1.2)
  let rounds, exerciseCount, warmupMinutes, cooldownMinutes;
  
  switch (level) {
    case 'beginner':
      rounds = 2;
      exerciseCount = 6;
      warmupMinutes = 5;
      cooldownMinutes = 5;
      break;
    case 'intermediate':
      rounds = 2;
      exerciseCount = 8;
      warmupMinutes = 5;
      cooldownMinutes = 5;
      break;
    case 'advanced':
      rounds = protocol === 'TABATA' ? 4 : 3;
      exerciseCount = protocol === 'TABATA' ? 4 : 8;
      warmupMinutes = 3;
      cooldownMinutes = 3;
      break;
    default:
      rounds = 2;
      exerciseCount = 8;
      warmupMinutes = 5;
      cooldownMinutes = 5;
  }
  
  // Select exercises randomly
  const selectedExercises = selectRandomExercises(filteredExercises, exerciseCount);
  
  // Build workout structure
  const workout = {
    type: 'bodyweight_hiit',
    level,
    protocol: selectedProtocol,
    warmup: {
      duration: warmupMinutes * 60,
      exercises: getWarmupExercises(level)
    },
    mainWorkout: {
      rounds,
      exercises: selectedExercises.map(ex => ({
        name: ex['Exercise Name'],
        primaryMuscle: ex['Primary Muscle'],
        secondaryMuscles: ex['Secondary Muscles'],
        workSeconds: selectedProtocol.workSeconds,
        restSeconds: selectedProtocol.restSeconds,
        impactLevel: ex['Impact Level'],
        modification: lowerImpact ? ex.Modification : null
      }))
    },
    cooldown: {
      duration: cooldownMinutes * 60,
      exercises: getCooldownExercises()
    },
    totalDuration: calculateTotalDuration(warmupMinutes, cooldownMinutes, rounds, exerciseCount, selectedProtocol),
    guideReference: 'Sections 2.2-2.4'
  };
  
  return workout;
};

/**
 * Generate a plyometric HIIT session
 * Based on Guide Section 3.2
 * 
 * @param {Object} options - Session options
 * @param {string} options.level - 'beginner' | 'intermediate' | 'advanced'
 * @param {string} options.protocol - Protocol key from HIIT_PROTOCOLS
 * @param {Array<Object>} options.exercises - Array of exercise objects
 * @param {boolean} options.lowerImpact - Use lower-impact alternatives
 * @returns {Object} Generated plyometric session
 */
export const generatePlyometricSession = (options) => {
  const { level = 'intermediate', protocol = 'BALANCED', exercises = [], lowerImpact = false } = options;
  
  const selectedProtocol = HIIT_PROTOCOLS[protocol];
  
  // Filter for plyometric exercises
  const plyoExercises = exercises.filter(ex => 
    ex.Category === 'Plyometric' ||
    (ex['Exercise Type'] === 'HIIT' && ex['Impact Level'] === 'High')
  );
  
  // Apply impact and level filters
  const filteredExercises = plyoExercises.filter(ex => {
    if (lowerImpact && ex['Impact Level'] === 'Very High') return false;
    if (level === 'beginner' && ex['Progression Level'] === 'Advanced') return false;
    if (level === 'intermediate' && ex['Progression Level'] === 'Advanced') return false;
    return true;
  });
  
  // Session parameters (Guide Section 3.2)
  const rounds = 4;
  const exercisesPerCircuit = 5;
  const warmupMinutes = 4;
  const cooldownMinutes = 4;
  
  // Build 4 circuits with 5 exercises each
  const circuits = [];
  for (let i = 0; i < rounds; i++) {
    const circuitExercises = selectRandomExercises(filteredExercises, exercisesPerCircuit);
    circuits.push({
      circuitNumber: i + 1,
      exercises: circuitExercises.map(ex => ({
        name: ex['Exercise Name'],
        primaryMuscle: ex['Primary Muscle'],
        secondaryMuscles: ex['Secondary Muscles'],
        workSeconds: 40, // Fixed at 40 sec per Guide Section 3.2
        restSeconds: 20,
        impactLevel: ex['Impact Level'],
        modification: lowerImpact ? ex.Modification : null,
        progressionLevel: ex['Progression Level']
      }))
    });
  }
  
  return {
    type: 'plyometric_hiit',
    level,
    protocol: selectedProtocol,
    warmup: {
      duration: warmupMinutes * 60,
      exercises: getPlyometricWarmup()
    },
    mainWorkout: {
      circuits
    },
    cooldown: {
      duration: cooldownMinutes * 60,
      exercises: getCooldownExercises()
    },
    totalDuration: warmupMinutes * 60 + (rounds * exercisesPerCircuit * 60) + cooldownMinutes * 60,
    guideReference: 'Section 3.2'
  };
};

/**
 * Generate a cycling HIIT session
 * Based on Guide Sections 4.2 (Beginner), 4.3 (Intermediate), 4.4 (Advanced)
 * 
 * @param {Object} options - Session options
 * @param {string} options.level - 'beginner' | 'intermediate' | 'advanced'
 * @returns {Object} Generated cycling session
 */
export const generateCyclingSession = (options) => {
  const { level = 'intermediate' } = options;
  
  let session;
  
  switch (level) {
    case 'beginner':
      // Guide Section 4.2: Steady State Intervals
      session = {
        type: 'cycling_hiit',
        level: 'beginner',
        protocol: HIIT_PROTOCOLS.BALANCED,
        name: 'Steady State Intervals',
        warmup: {
          duration: 5 * 60,
          description: 'Easy pedaling, low resistance (RPE 5/10) for 3 min, gradually increase resistance (RPE 6/10) for 2 min'
        },
        mainWorkout: {
          rounds: 10,
          intervals: [
            {
              type: 'work',
              duration: 30,
              intensity: 'High resistance, 80-90 RPM, RPE 8-9/10 (sprint)'
            },
            {
              type: 'rest',
              duration: 60,
              intensity: 'Low resistance, 90-100 RPM, RPE 5-6/10 (recovery)'
            }
          ]
        },
        cooldown: {
          duration: 5 * 60,
          description: 'Easy pedaling, very low resistance (RPE 4-5/10) for 3 min, stretching and controlled breathing for 2 min'
        },
        totalDuration: 25 * 60,
        guideReference: 'Section 4.2'
      };
      break;
      
    case 'intermediate':
      // Guide Section 4.3: Pyramid Protocol
      session = {
        type: 'cycling_hiit',
        level: 'intermediate',
        protocol: { name: 'Pyramid Protocol' },
        name: 'Pyramid Protocol',
        warmup: {
          duration: 5 * 60,
          description: 'Easy pedaling, gradually increasing resistance'
        },
        mainWorkout: {
          pyramid: [
            { work: 30, rest: 60, intensity: 'RPE 9/10' },
            { work: 60, rest: 90, intensity: 'RPE 8-9/10' },
            { work: 90, rest: 120, intensity: 'RPE 8/10' },
            { work: 120, rest: 120, intensity: 'RPE 7-8/10' },
            { work: 90, rest: 90, intensity: 'RPE 8/10' },
            { work: 60, rest: 60, intensity: 'RPE 9/10' },
            { work: 30, rest: 60, intensity: 'RPE 10/10' }
          ]
        },
        cooldown: {
          duration: 5 * 60,
          description: 'Very easy pedaling for 3 min, stretching for 2 min'
        },
        totalDuration: 30 * 60,
        guideReference: 'Section 4.3'
      };
      break;
      
    case 'advanced':
      // Guide Section 4.4: REHIT Protocol
      session = {
        type: 'cycling_hiit',
        level: 'advanced',
        protocol: HIIT_PROTOCOLS.REHIT,
        name: 'REHIT Protocol',
        warmup: {
          duration: 4 * 60,
          description: 'Easy pedaling, gradually increasing resistance'
        },
        mainWorkout: {
          sprints: [
            {
              sprintNumber: 1,
              duration: 20,
              intensity: 'RPE 9.5-10/10, cadence 100+ RPM',
              recovery: 150
            },
            {
              sprintNumber: 2,
              duration: 20,
              intensity: 'RPE 9.5-10/10',
              recovery: 150
            },
            {
              sprintNumber: 3,
              duration: 20,
              intensity: 'RPE 9.5-10/10 (optional)',
              recovery: 150
            }
          ]
        },
        cooldown: {
          duration: 3 * 60,
          description: 'Easy pedaling and breathing'
        },
        totalDuration: 15 * 60,
        guideReference: 'Section 4.4'
      };
      break;
  }
  
  return session;
};

/**
 * Generate a rowing HIIT session
 * Based on Guide Sections 5.2 (Beginner), 5.3 (Intermediate)
 * 
 * @param {Object} options - Session options
 * @param {string} options.level - 'beginner' | 'intermediate'
 * @returns {Object} Generated rowing session
 */
export const generateRowingSession = (options) => {
  const { level = 'intermediate' } = options;
  
  if (level === 'beginner') {
    // Guide Section 5.2: Distance Intervals
    return {
      type: 'rowing_hiit',
      level: 'beginner',
      protocol: HIIT_PROTOCOLS.BALANCED,
      name: 'Distance Intervals',
      warmup: {
        duration: 3 * 60,
        description: 'Easy rowing, focusing on form (light resistance, steady 20-24 strokes/min)'
      },
      mainWorkout: {
        rounds: 7,
        intervals: [
          {
            type: 'work',
            duration: 45,
            intensity: 'Moderate-high intensity rowing (RPE 7-8/10)'
          },
          {
            type: 'rest',
            duration: 90,
            intensity: 'Easy steady-state rowing (RPE 5/10)'
          }
        ]
      },
      cooldown: {
        duration: 3 * 60,
        description: 'Easy light rowing for 2 min, breathing and stretching for 1 min'
      },
      totalDuration: 20 * 60,
      musclesWorked: 'Glutes, quads, hamstrings, back, shoulders, core, arms',
      guideReference: 'Section 5.2'
    };
  } else {
    // Guide Section 5.3: Power and Endurance Mix
    return {
      type: 'rowing_hiit',
      level: 'intermediate',
      protocol: { name: 'Power and Endurance Mix' },
      name: 'Power and Endurance Mix',
      warmup: {
        duration: 4 * 60,
        description: 'Easy rowing plus dynamic stretching'
      },
      mainWorkout: {
        blocks: [
          {
            name: 'Power Focus',
            rounds: 4,
            intervals: [
              {
                type: 'work',
                duration: 60,
                intensity: 'High power output, explosive drive (RPE 8-9/10), faster stroke rate (30+ strokes/min)'
              },
              {
                type: 'rest',
                duration: 60,
                intensity: 'Easy recovery rowing (RPE 5/10)'
              }
            ]
          },
          {
            name: 'Active Rest',
            duration: 60,
            intensity: 'Very light rowing'
          },
          {
            name: 'Endurance Focus',
            rounds: 3,
            intervals: [
              {
                type: 'work',
                duration: 120,
                intensity: 'Steady moderate-hard intensity (RPE 7-8/10), controlled stroke rate'
              },
              {
                type: 'rest',
                duration: 60,
                intensity: 'Easy recovery rowing (RPE 5/10)'
              }
            ]
          }
        ]
      },
      cooldown: {
        duration: 4 * 60,
        description: 'Very light rowing for 2 min, stretching (lower back, shoulders, hamstrings) for 2 min'
      },
      totalDuration: 25 * 60,
      guideReference: 'Section 5.3'
    };
  }
};

/**
 * Generate an elliptical HIIT session
 * Based on Guide Section 6.2
 * 
 * @param {Object} options - Session options
 * @returns {Object} Generated elliptical session
 */
export const generateEllipticalSession = (options) => {
  const { level = 'beginner' } = options;
  
  // Guide Section 6.2: Progressive Intervals
  return {
    type: 'elliptical_hiit',
    level,
    protocol: { name: 'Progressive Intervals' },
    name: 'Progressive Intervals',
    warmup: {
      duration: 3 * 60,
      description: 'Low resistance, moderate pace (RPE 5-6/10)'
    },
    mainWorkout: {
      rounds: [
        {
          name: 'Round 1',
          duration: 5 * 60,
          intervals: [
            { type: 'work', duration: 30, intensity: 'Hard (RPE 8/10)' },
            { type: 'rest', duration: 30, intensity: 'Easy (RPE 4/10)' }
          ],
          repetitions: 5
        },
        {
          name: 'Recovery',
          duration: 60,
          intensity: 'Very light resistance'
        },
        {
          name: 'Round 2',
          duration: 6 * 60,
          intervals: [
            { type: 'work', duration: 40, intensity: 'Hard (RPE 8/10)' },
            { type: 'rest', duration: 20, intensity: 'Easy (RPE 4/10)' }
          ],
          repetitions: 6
        }
      ]
    },
    cooldown: {
      duration: 3 * 60,
      description: 'Low resistance, easy pace'
    },
    totalDuration: 20 * 60,
    musclesWorked: 'Quads, glutes, hamstrings, hip flexors, calves',
    guideReference: 'Section 6.2'
  };
};

/**
 * Generate a step platform HIIT session
 * Based on Guide Section 7.1
 * 
 * @param {Object} options - Session options
 * @param {Array<Object>} options.exercises - Exercise array
 * @returns {Object} Generated step session
 */
export const generateStepSession = (options) => {
  const { exercises = [] } = options;
  
  // Filter for step/lower body exercises
  const stepExercises = exercises.filter(ex => 
    ex.Equipment === 'Box/Platform' || 
    (ex['Exercise Type'] === 'HIIT' && ex.Category === 'Lower Body')
  );
  
  // Guide Section 7.1: Upper and Lower Integration
  return {
    type: 'step_hiit',
    level: 'intermediate',
    protocol: { name: 'Upper and Lower Integration' },
    name: 'Step Platform HIIT',
    equipment: 'Adjustable step platform (height 4-8 inches)',
    warmup: {
      duration: 4 * 60,
      exercises: [
        'Marching on/off step (1 min)',
        'Elevated toe taps (1 min)',
        'Step-ups slow, controlled (1 min)',
        'Arm circles and dynamic stretching (1 min)'
      ]
    },
    mainWorkout: {
      rounds: [
        {
          name: 'Round 1 - Lower Body Emphasis',
          duration: 10 * 60,
          exercises: selectRandomExercises(stepExercises, 6).map(ex => ({
            name: ex['Exercise Name'],
            duration: 40,
            rest: 20
          })),
          repetitions: 2
        },
        {
          name: 'Round 2 - Total Body Integration',
          duration: 10 * 60,
          exercises: selectRandomExercises(stepExercises, 5).map(ex => ({
            name: ex['Exercise Name'],
            duration: 45,
            rest: 15
          })),
          repetitions: 2
        }
      ]
    },
    cooldown: {
      duration: 6 * 60,
      description: 'Walking and breathing (2 min), lower body and hip stretching (3 min), calm breathing (1 min)'
    },
    totalDuration: 30 * 60,
    guideReference: 'Section 7.1'
  };
};

/**
 * Select random exercises without duplicates
 * @private
 */
function selectRandomExercises(exercises, count) {
  const shuffled = [...exercises].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, shuffled.length));
}

/**
 * Get warmup exercises based on level
 * @private
 */
function getWarmupExercises(level) {
  const warmups = [
    'High Knees March (1 min)',
    'Arm Circles + Hip Circles (1 min)',
    'Cat-Cow Motion (1 min)',
    'Bodyweight Squats slow (1 min)',
    'Walking Lunges (1 min)'
  ];
  
  return level === 'advanced' ? warmups.slice(0, 3) : warmups;
}

/**
 * Get plyometric-specific warmup
 * @private
 */
function getPlyometricWarmup() {
  return [
    'Light jog or high knees march (1 min)',
    'Glute activation - glute bridges, clamshells (1 min)',
    'Hip mobility - leg swings, circles (1 min)',
    'Cat-Cow and arm circles (1 min)'
  ];
}

/**
 * Get cooldown exercises
 * @private
 */
function getCooldownExercises() {
  return [
    'Walking and deep breathing (2 min)',
    'Standing Forward Fold (1 min)',
    'Child\'s Pose (1 min)',
    'Supine Twist Stretch (1 min)'
  ];
}

/**
 * Calculate total session duration
 * @private
 */
function calculateTotalDuration(warmupMin, cooldownMin, rounds, exerciseCount, protocol) {
  const warmup = warmupMin * 60;
  const cooldown = cooldownMin * 60;
  const work = rounds * exerciseCount * protocol.workSeconds;
  const rest = rounds * exerciseCount * protocol.restSeconds;
  return warmup + work + rest + cooldown;
}

/**
 * Generate a complete HIIT session based on modality and level
 * Main entry point for HIIT session generation
 * 
 * @param {Object} options - Session options
 * @param {string} options.modality - 'bodyweight' | 'plyometric' | 'cycling' | 'rowing' | 'elliptical' | 'step'
 * @param {string} options.level - 'beginner' | 'intermediate' | 'advanced'
 * @param {string} options.protocol - Protocol key from HIIT_PROTOCOLS (optional)
 * @param {Array<Object>} options.exercises - Exercise database array
 * @param {boolean} options.lowerImpact - Use lower-impact modifications
 * @param {string} options.goal - Health goal: 'fat_loss' | 'cardiovascular' | 'power'
 * @returns {Object} Complete HIIT session
 */
export const generateHIITSession = (options) => {
  const { modality = 'bodyweight', goal = 'cardiovascular' } = options;
  
  let session;
  
  switch (modality) {
    case 'bodyweight':
      session = generateBodyweightSession(options);
      break;
    case 'plyometric':
      session = generatePlyometricSession(options);
      break;
    case 'cycling':
      session = generateCyclingSession(options);
      break;
    case 'rowing':
      session = generateRowingSession(options);
      break;
    case 'elliptical':
      session = generateEllipticalSession(options);
      break;
    case 'step':
      session = generateStepSession(options);
      break;
    default:
      session = generateBodyweightSession(options);
  }
  
  // Add metadata
  session.metadata = {
    generatedAt: new Date().toISOString(),
    goal,
    healthBenefits: EXERCISE_CATEGORIES[modality.toUpperCase()]?.benefits || [],
    guideSource: '.github/HIIT-YOGA-GUIDE.md'
  };
  
  return session;
};

export default {
  generateHIITSession,
  generateBodyweightSession,
  generatePlyometricSession,
  generateCyclingSession,
  generateRowingSession,
  generateEllipticalSession,
  generateStepSession,
  HIIT_PROTOCOLS,
  EXERCISE_CATEGORIES
};
