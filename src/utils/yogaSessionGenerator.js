/**
 * Yoga Session Generator
 * 
 * Generates evidence-based yoga sessions based on protocols from .github/HIIT-YOGA-GUIDE.md
 * 
 * Key Features:
 * - Multiple yoga modes: Power, Restorative, Yin, Flexibility, Core (Guide Section 8)
 * - Goal-driven routines (strength, flexibility, recovery, stress relief)
 * - Evidence-based sequencing and hold timing per Guide recommendations
 * - Progressive difficulty levels (beginner, intermediate, advanced)
 * - Breathwork integration (ujjayi, extended exhale, alternate nostril) per Guide Section 10.4
 * 
 * @module yogaSessionGenerator
 */

/**
 * Yoga mode definitions from Guide Section 8
 */
export const YOGA_MODES = {
  POWER: {
    name: 'Power Yoga',
    description: 'Build strength, flexibility, balance, and cardiovascular conditioning',
    duration: 45,
    benefits: ['Strength building', 'Cardiovascular fitness', 'Balance', 'Full-body workout'],
    guideSection: '8.2',
    sympatheticActivation: 'high'
  },
  RESTORATIVE: {
    name: 'Restorative Yoga',
    description: 'Deep stretch, stress relief, parasympathetic nervous system activation',
    duration: 45,
    benefits: ['Stress relief', 'Deep relaxation', 'Recovery', 'Parasympathetic activation'],
    guideSection: '8.3',
    sympatheticActivation: 'low'
  },
  YIN: {
    name: 'Yin Yoga',
    description: 'Deep tissue and fascia release, long-hold passive stretching',
    duration: 55,
    benefits: ['Fascia release', 'Deep flexibility', 'Meditation', 'Joint health'],
    guideSection: '8.4',
    sympatheticActivation: 'low'
  },
  FLEXIBILITY: {
    name: 'Flexibility Yoga',
    description: 'Target hip and hamstring opening, address tightness from training and sitting',
    duration: 45,
    benefits: ['Hip flexibility', 'Hamstring flexibility', 'Lower back release', 'Mobility'],
    guideSection: '8.5',
    sympatheticActivation: 'medium'
  },
  CORE: {
    name: 'Core Strength Yoga',
    description: 'Develop core strength and stability for athletic performance',
    duration: 40,
    benefits: ['Core strength', 'Stability', 'Athletic performance', 'Injury prevention'],
    guideSection: '8.6',
    sympatheticActivation: 'high'
  }
};

/**
 * Breathing techniques from Guide Section 10.4
 */
export const BREATHING_TECHNIQUES = {
  UJJAYI: {
    name: 'Ujjayi Breathing',
    description: 'Ocean-like sound, throat constriction, calming',
    instruction: 'Breathe through nose with slight throat constriction, creating ocean sound',
    benefits: ['Calming', 'Focus', 'Heat generation'],
    useIn: ['Power', 'Restorative', 'Yin']
  },
  EXTENDED_EXHALE: {
    name: 'Extended Exhale',
    description: '2:1 or 3:1 ratio - parasympathetic activation',
    instruction: 'Inhale 4 counts, exhale 8 counts',
    benefits: ['Parasympathetic activation', 'Stress relief', 'Sleep preparation'],
    useIn: ['Restorative', 'Yin']
  },
  ALTERNATE_NOSTRIL: {
    name: 'Alternate Nostril Breathing (Nadi Shodhana)',
    description: 'Balance nervous system',
    instruction: 'Close right nostril, inhale left. Close left, exhale right. Continue alternating.',
    benefits: ['Nervous system balance', 'Mental clarity', 'Stress reduction'],
    useIn: ['Restorative', 'Flexibility']
  },
  NATURAL: {
    name: 'Natural Diaphragmatic Breathing',
    description: 'Allow breath to happen naturally',
    instruction: 'No forced breath control; focus on present moment awareness',
    benefits: ['Relaxation', 'Natural flow', 'Meditation support'],
    useIn: ['Yin', 'Restorative']
  }
};

/**
 * Generate a Power Yoga session
 * Based on Guide Section 8.2
 * 
 * @param {Object} options - Session options
 * @param {Array<Object>} options.poses - Array of pose objects from yoga-poses.json
 * @param {string} options.level - 'beginner' | 'intermediate' | 'advanced'
 * @returns {Object} Generated Power Yoga session
 */
export const generatePowerYogaSession = (options) => {
  const { poses = [], level = 'intermediate' } = options;
  
  // Filter poses appropriate for Power Yoga using actual CSV fields
  const powerPoses = poses.filter(p => {
    const isPowerYoga = p.Type && p.Type.includes('Power');
    const isStandingOrCore = p.Category === 'Standing' || p.Category === 'Core';
    const sessionType = p['Session Type'] || '';
    const hasPowerSession = sessionType.includes('Power Yoga');
    return isPowerYoga || isStandingOrCore || hasPowerSession;
  });
  
  // Adjust hold times based on level
  const holdAdjustment = level === 'beginner' ? 0.8 : level === 'advanced' ? 1.2 : 1.0;
  
  // Build session structure following Guide Section 8.2
  const session = {
    type: 'power_yoga',
    mode: YOGA_MODES.POWER,
    level,
    warmup: {
      duration: 5 * 60,
      sequence: [
        { pose: 'Mountain Pose', duration: 30, instruction: '5 deep breaths (body awareness)' },
        { pose: 'Cat-Cow', duration: 120, instruction: '10 rounds (spinal mobility)' },
        { pose: 'Downward-Facing Dog', duration: 30, instruction: '5 breaths (full body awakening)' }
      ]
    },
    standingSequence: {
      duration: 15 * 60,
      exercises: [
        {
          name: 'Warrior I Flow',
          poses: getPosesByName(powerPoses, ['Warrior I']),
          hold: Math.round(30 * holdAdjustment),
          sides: 2,
          rounds: 3,
          focus: 'Glutes, hip flexors, core, shoulders'
        },
        {
          name: 'Warrior II to Extended Triangle',
          poses: getPosesByName(powerPoses, ['Warrior II', 'Extended Triangle']),
          hold: Math.round(37 * holdAdjustment),
          sides: 2,
          rounds: 2,
          focus: 'Hip stability, hamstring flexibility, obliques'
        },
        {
          name: 'Chair Pose Hold',
          poses: getPosesByName(powerPoses, ['Chair Pose']),
          hold: Math.round(37 * holdAdjustment),
          rounds: 3,
          focus: 'Glutes, quads, core'
        },
        {
          name: 'Standing Forward Fold',
          poses: getPosesByName(powerPoses, ['Standing Forward Fold']),
          hold: 60,
          rounds: 2,
          focus: 'Hamstring flexibility, lower back release'
        },
        {
          name: 'Tree Pose Balance Work',
          poses: getPosesByName(powerPoses, ['Tree Pose']),
          hold: Math.round(37 * holdAdjustment),
          sides: 2,
          rounds: 2,
          focus: 'Balance, hip stability, focus'
        }
      ]
    },
    coreSequence: {
      duration: 15 * 60,
      exercises: [
        {
          name: 'Plank Variations',
          duration: 5 * 60,
          variations: [
            { pose: 'Plank Pose', hold: Math.round(45 * holdAdjustment), rounds: 3 },
            { pose: 'Side Plank', hold: Math.round(30 * holdAdjustment), sides: 2, rounds: 2 },
            { pose: 'Plank to Downward Dog Flow', rounds: 10 }
          ]
        },
        {
          name: 'Boat Pose',
          poses: getPosesByName(powerPoses, ['Boat Pose']),
          hold: Math.round(25 * holdAdjustment),
          rounds: 4,
          rest: 30
        },
        {
          name: 'Bridge Pose Pulses',
          poses: getPosesByName(powerPoses, ['Bridge Pose']),
          hold: 30,
          rounds: 3,
          focus: 'Glutes, hamstrings, core'
        },
        {
          name: 'Locust Pose Holds',
          poses: getPosesByName(powerPoses, ['Locust Pose']),
          hold: 20,
          rounds: 3,
          rest: 30,
          focus: 'Posterior chain (erector spinae, glutes)'
        }
      ]
    },
    cooldown: {
      duration: 10 * 60,
      sequence: [
        { pose: 'Pigeon Pose', duration: 90, sides: 2, benefit: 'Deep hip opener' },
        { pose: 'Seated Forward Fold', duration: 90, benefit: 'Hamstring and lower back release' },
        { pose: 'Reclined Twist', duration: 45, sides: 2, benefit: 'Spinal rotation, digestive aid' },
        { pose: 'Legs-Up-the-Wall', duration: 120, benefit: 'Parasympathetic activation', optional: true },
        { pose: 'Savasana', duration: 180, benefit: 'Integration and calm' }
      ]
    },
    breathing: BREATHING_TECHNIQUES.UJJAYI,
    totalDuration: 45 * 60,
    musclesWorked: 'Full body emphasis on glutes, core, shoulders; hamstring and hip flexibility',
    guideReference: 'Section 8.2'
  };
  
  return session;
};

/**
 * Generate a Restorative Yoga session
 * Based on Guide Section 8.3
 * 
 * @param {Object} options - Session options
 * @param {Array<Object>} options.poses - Array of pose objects
 * @returns {Object} Generated Restorative Yoga session
 */
export const generateRestorativeYogaSession = (options) => {
  const { poses = [] } = options;
  
  const restorativePoses = poses.filter(p => {
    const isRestorative = p.Type && p.Type.includes('Restorative');
    const hasRestorativeCategory = p.Category === 'Restorative';
    const sessionType = p['Session Type'] || '';
    const hasRestorativeSession = sessionType.includes('Restorative');
    return isRestorative || hasRestorativeCategory || hasRestorativeSession;
  });
  
  // Guide Section 8.3: Deep Relaxation and Recovery
  return {
    type: 'restorative_yoga',
    mode: YOGA_MODES.RESTORATIVE,
    level: 'all',
    props: ['Yoga blocks', 'Bolsters', 'Straps', 'Blankets'],
    opening: {
      duration: 3 * 60,
      sequence: [
        {
          activity: 'Seated cross-legged meditation with ujjayi breathing',
          duration: 180,
          instruction: 'Set intention for calm and recovery'
        }
      ]
    },
    warmupFlow: {
      duration: 5 * 60,
      sequence: [
        { pose: 'Cat-Cow', duration: 60, instruction: '5 rounds, slow and gentle' },
        { pose: 'Child\'s Pose', duration: 60, instruction: 'Calming, forward fold' }
      ]
    },
    restorativeSequence: {
      duration: 37 * 60,
      instruction: 'Hold each pose for 3-6 minutes with props for support',
      poses: [
        {
          name: 'Supine Butterfly',
          pose: getPoseByName(restorativePoses, 'Supine Butterfly'),
          duration: 5 * 60,
          props: 'Bolster under spine, block under head',
          benefits: 'Hip opening, chest opening, parasympathetic activation'
        },
        {
          name: 'Supported Fish Pose',
          duration: 3 * 60,
          props: 'Bolster under mid-back',
          benefits: 'Chest and hip flexor opening'
        },
        {
          name: 'Legs-Up-the-Wall',
          pose: getPoseByName(restorativePoses, 'Legs-Up-the-Wall'),
          duration: 10 * 60,
          props: 'Bolster under pelvis (optional)',
          benefits: 'Circulation, stress relief, inversion benefits'
        },
        {
          name: 'Half Lord of Fishes',
          pose: getPoseByName(restorativePoses, 'Half Lord of Fishes'),
          duration: 4 * 60,
          sides: 2,
          props: 'Block or pillow under knees for support',
          benefits: 'Spinal rotation, digestive aid'
        },
        {
          name: 'Supported Child\'s Pose',
          pose: getPoseByName(restorativePoses, 'Child\'s Pose'),
          duration: 5 * 60,
          props: 'Bolster supporting torso, block under head',
          benefits: 'Hamstring and hip opening, calming'
        },
        {
          name: 'Reclined Twist',
          pose: getPoseByName(restorativePoses, 'Reclined Twist'),
          duration: 3 * 60,
          sides: 2,
          benefits: 'Spinal rotation, core release'
        }
      ]
    },
    closing: {
      duration: 5 * 60,
      sequence: [
        {
          pose: 'Savasana',
          duration: 5 * 60,
          instruction: 'Fully supported with blankets and blocks. 5 minutes of complete relaxation.'
        }
      ]
    },
    breathing: {
      primary: BREATHING_TECHNIQUES.UJJAYI,
      emphasis: 'Longer exhales (6-8 count in, 8-10 count out)',
      secondary: BREATHING_TECHNIQUES.EXTENDED_EXHALE
    },
    totalDuration: 50 * 60,
    benefits: 'Deep stretching and release; parasympathetic activation',
    guideReference: 'Section 8.3'
  };
};

/**
 * Generate a Yin Yoga session
 * Based on Guide Section 8.4
 * 
 * @param {Object} options - Session options
 * @param {Array<Object>} options.poses - Array of pose objects
 * @returns {Object} Generated Yin Yoga session
 */
export const generateYinYogaSession = (options) => {
  const { poses = [] } = options;
  
  const yinPoses = poses.filter(p => {
    const isYin = p.Type && p.Type.includes('Yin');
    const hasYinCategory = p.Category === 'Hip Opener' || p.Category === 'Forward Fold';
    const sessionType = p['Session Type'] || '';
    const hasYinSession = sessionType.includes('Yin');
    return isYin || hasYinCategory || hasYinSession;
  });
  
  // Guide Section 8.4: Long-Hold Deep Stretch
  return {
    type: 'yin_yoga',
    mode: YOGA_MODES.YIN,
    level: 'all',
    philosophy: 'Hold poses 3-6 minutes each; go to edge of sensation (not pain)',
    props: ['Yoga blocks', 'Bolsters', 'Straps', 'Blankets'],
    opening: {
      duration: 5 * 60,
      sequence: [
        { activity: 'Seated meditation with natural breathing', duration: 3 * 60 },
        { activity: 'Gentle neck and shoulder rolls', duration: 2 * 60 }
      ]
    },
    mainSequence: {
      duration: 48 * 60,
      poses: [
        {
          pose: 'Cat-Cow',
          duration: 2 * 60,
          instruction: 'Gentle warm-up'
        },
        {
          name: 'Supported Child\'s Pose',
          pose: getPoseByName(yinPoses, 'Child\'s Pose'),
          duration: 5 * 60,
          props: 'Bolster supporting torso',
          targetTissues: 'Hamstrings, hip extensors, shoulders'
        },
        {
          name: 'Pigeon Pose',
          pose: getPoseByName(yinPoses, 'Pigeon Pose'),
          duration: 5 * 60,
          sides: 2,
          totalDuration: 10 * 60,
          props: 'Blanket under hip if needed',
          targetTissues: 'Hip external rotators (piriformis), glutes, hip flexors'
        },
        {
          name: 'Wide-Legged Forward Fold',
          pose: getPoseByName(yinPoses, 'Wide-Legged Forward Fold'),
          duration: 5 * 60,
          props: 'Blocks under hands',
          targetTissues: 'Hamstrings, hip adductors, erector spinae'
        },
        {
          name: 'Dragon Pose/Low Lizard Lunge',
          pose: getPoseByName(yinPoses, 'Lizard Pose'),
          duration: 5 * 60,
          sides: 2,
          totalDuration: 10 * 60,
          props: 'Blocks under hands for support',
          targetTissues: 'Hip flexors, psoas, hamstrings'
        },
        {
          name: 'Seated Forward Fold',
          pose: getPoseByName(yinPoses, 'Seated Forward Fold'),
          duration: 5 * 60,
          props: 'Block under head if needed; blanket under sit bones',
          targetTissues: 'Hamstrings, erector spinae, calf muscles'
        },
        {
          name: 'Supine Butterfly',
          pose: getPoseByName(yinPoses, 'Supine Butterfly'),
          duration: 4 * 60,
          props: 'Bolster under spine, block under head',
          targetTissues: 'Hip adductors, hip flexors, pelvic floor'
        },
        {
          name: 'Reclining Spinal Twist',
          pose: getPoseByName(yinPoses, 'Reclined Twist'),
          duration: 4 * 60,
          sides: 2,
          totalDuration: 8 * 60,
          props: 'Pillow or block support',
          targetTissues: 'IT band, glutes, spinal erectors, obliques'
        }
      ]
    },
    closing: {
      duration: 7 * 60,
      sequence: [
        {
          pose: 'Savasana',
          duration: 7 * 60,
          instruction: 'Complete relaxation; allow body to integrate changes'
        }
      ]
    },
    breathing: BREATHING_TECHNIQUES.NATURAL,
    breathingInstruction: 'Natural diaphragmatic breathing. No forced breath control; let breath happen naturally. Focus: Present moment awareness',
    totalDuration: 60 * 60,
    targetTissues: 'Deep fascial and connective tissue release throughout entire body',
    guideReference: 'Section 8.4'
  };
};

/**
 * Generate a Flexibility-focused Yoga session
 * Based on Guide Section 8.5
 * 
 * @param {Object} options - Session options
 * @param {Array<Object>} options.poses - Array of pose objects
 * @returns {Object} Generated Flexibility Yoga session
 */
export const generateFlexibilityYogaSession = (options) => {
  const { poses = [] } = options;
  
  const flexPoses = poses.filter(p => {
    const isFlex = p.Type && p.Type.includes('Flexibility');
    const hasFlexCategory = p.Category === 'Hip Opener' || p.Category === 'Forward Fold';
    const sessionType = p['Session Type'] || '';
    const hasFlexSession = sessionType.includes('Flexibility');
    return isFlex || hasFlexCategory || hasFlexSession;
  });
  
  // Guide Section 8.5: Hip and Hamstring Opening
  return {
    type: 'flexibility_yoga',
    mode: YOGA_MODES.FLEXIBILITY,
    level: 'all',
    objective: 'Address lower body tightness (common from sitting and training)',
    warmup: {
      duration: 5 * 60,
      sequence: [
        { pose: 'Cat-Cow', duration: 60, instruction: '8 rounds' },
        { pose: 'Downward-Facing Dog', duration: 60 }
      ]
    },
    standingSequence: {
      duration: 12 * 60,
      poses: [
        {
          name: 'Low Lunge with Hip Flexor Stretch',
          duration: 45,
          sides: 2,
          props: 'Block under hands if needed',
          stretchTarget: 'Hip flexors, quads'
        },
        {
          name: 'Pyramid Pose',
          pose: getPoseByName(flexPoses, 'Pyramid Pose'),
          duration: 60,
          sides: 2,
          stretchTarget: 'Hamstrings, hip adductors'
        },
        {
          name: 'Half-Split',
          pose: getPoseByName(flexPoses, 'Half Split'),
          duration: 60,
          sides: 2,
          stretchTarget: 'Hamstrings, hip adductors'
        },
        {
          name: 'Wide-Legged Forward Fold',
          pose: getPoseByName(flexPoses, 'Wide-Legged Forward Fold'),
          duration: 90,
          stretchTarget: 'Hamstrings, hip adductors, inner thighs'
        }
      ]
    },
    floorSequence: {
      duration: 20 * 60,
      poses: [
        {
          name: 'Lizard Pose',
          pose: getPoseByName(flexPoses, 'Lizard Pose'),
          duration: 90,
          sides: 2,
          stretchTarget: 'Hip flexors, hip abductors, hamstrings'
        },
        {
          name: 'Pigeon Pose',
          pose: getPoseByName(flexPoses, 'Pigeon Pose'),
          duration: 2 * 60,
          sides: 2,
          stretchTarget: 'Hip external rotators, glutes, hip flexors'
        },
        {
          name: 'Low Lunge Variation',
          duration: 60,
          sides: 2,
          props: 'Blanket under back knee if needed',
          stretchTarget: 'Hip flexors, psoas, quads'
        },
        {
          name: 'Cow Face Pose',
          pose: getPoseByName(flexPoses, 'Cow Face Pose'),
          duration: 60,
          sides: 2,
          instruction: 'If hip flexibility allows',
          stretchTarget: 'Hip abductors, glutes, hip flexors'
        },
        {
          name: 'Seated Forward Fold',
          pose: getPoseByName(flexPoses, 'Seated Forward Fold'),
          duration: 2 * 60,
          stretchTarget: 'Hamstrings, erector spinae'
        },
        {
          name: 'Reclined Pigeon',
          pose: getPoseByName(flexPoses, 'Reclined Pigeon'),
          duration: 90,
          sides: 2,
          stretchTarget: 'Glutes, hip external rotators, lower back'
        }
      ]
    },
    closing: {
      duration: 8 * 60,
      sequence: [
        {
          pose: 'Legs-Up-the-Wall',
          duration: 5 * 60,
          instruction: 'If available, or supine position'
        },
        {
          pose: 'Reclined Twist',
          duration: 60,
          sides: 2
        },
        {
          pose: 'Savasana',
          duration: 3 * 60
        }
      ]
    },
    breathing: BREATHING_TECHNIQUES.ALTERNATE_NOSTRIL,
    totalDuration: 45 * 60,
    emphasis: 'Deep lower body flexibility emphasis',
    guideReference: 'Section 8.5'
  };
};

/**
 * Generate a Core Strength Yoga session
 * Based on Guide Section 8.6
 * 
 * @param {Object} options - Session options
 * @param {Array<Object>} options.poses - Array of pose objects
 * @returns {Object} Generated Core Strength Yoga session
 */
export const generateCoreYogaSession = (options) => {
  const { poses = [] } = options;
  
  const corePoses = poses.filter(p => {
    const isCore = p.Category === 'Core';
    const isPower = p.Type && p.Type.includes('Power');
    const sessionType = p['Session Type'] || '';
    const hasCoreSession = sessionType.includes('Core');
    return isCore || (isPower && hasCoreSession);
  });
  
  // Guide Section 8.6: Power Core Building
  return {
    type: 'core_yoga',
    mode: YOGA_MODES.CORE,
    level: 'intermediate',
    objective: 'Develop core strength and stability for athletic performance and injury prevention',
    warmup: {
      duration: 5 * 60,
      sequence: [
        { pose: 'Cat-Cow', duration: 60, instruction: '8 rounds' },
        { pose: 'Downward-Facing Dog', duration: 60, instruction: '60 sec hold' }
      ]
    },
    coreActivation: {
      duration: 20 * 60,
      sections: [
        {
          name: 'Plank Hold Series',
          duration: 8 * 60,
          exercises: [
            { pose: 'Plank Pose', hold: 45, rounds: 3, rest: 30 },
            { pose: 'Plank with Shoulder Taps', hold: 40, rounds: 2 },
            { pose: 'Plank to Downward Dog Flow', rounds: 10 }
          ]
        },
        {
          name: 'Side Plank Series',
          duration: 5 * 60,
          exercises: [
            { pose: 'Side Plank', side: 'right', hold: 35, rounds: 2, rest: 30 },
            { pose: 'Side Plank', side: 'left', hold: 35, rounds: 2, rest: 30 }
          ]
        },
        {
          name: 'Boat Pose Progression',
          duration: 4 * 60,
          exercises: [
            { pose: 'Half Boat', hold: 30, rounds: 2 },
            { pose: 'Boat Pose', hold: 25, rounds: 2 }
          ]
        },
        {
          name: 'Dolphin Pose',
          pose: getPoseByName(corePoses, 'Dolphin Pose'),
          hold: 45,
          rounds: 2,
          benefit: 'Shoulder stabilization'
        }
      ]
    },
    standingCore: {
      duration: 10 * 60,
      exercises: [
        {
          name: 'Chair Pose',
          pose: getPoseByName(corePoses, 'Chair Pose'),
          hold: 37,
          rounds: 3
        },
        {
          name: 'Warrior III',
          pose: getPoseByName(corePoses, 'Warrior III'),
          hold: 30,
          sides: 2,
          rounds: 2
        },
        {
          name: 'Extended Triangle with Rotation',
          pose: getPoseByName(corePoses, 'Extended Triangle'),
          hold: 45,
          sides: 2,
          rounds: 2
        },
        {
          name: 'Standing Crunch',
          duration: 20,
          rounds: 2,
          instruction: 'Reach up and down'
        }
      ]
    },
    coreHolds: {
      duration: 5 * 60,
      exercises: [
        {
          name: 'Bridge Pose Hold',
          pose: getPoseByName(corePoses, 'Bridge Pose'),
          hold: 60,
          rounds: 2,
          rest: 30
        },
        {
          name: 'Locust Pose Hold',
          pose: getPoseByName(corePoses, 'Locust Pose'),
          hold: 30,
          rounds: 3
        }
      ]
    },
    cooldown: {
      duration: 5 * 60,
      optional: true,
      sequence: [
        { pose: 'Child\'s Pose', duration: 2 * 60 },
        { pose: 'Spinal Twist', duration: 60, sides: 2 },
        { pose: 'Final rest', duration: 60 }
      ]
    },
    breathing: BREATHING_TECHNIQUES.UJJAYI,
    totalDuration: 40 * 60,
    emphasis: 'Deep and superficial core muscles; stabilizer muscles',
    guideReference: 'Section 8.6'
  };
};

/**
 * Helper: Get pose by name
 * @private
 */
function getPoseByName(poses, name) {
  return poses.find(p => p.Name === name || p.Sanskrit === name);
}

/**
 * Helper: Get multiple poses by names
 * @private
 */
function getPosesByName(poses, names) {
  return names.map(name => getPoseByName(poses, name)).filter(p => p);
}

/**
 * Generate a complete Yoga session based on mode and goals
 * Main entry point for Yoga session generation
 * 
 * @param {Object} options - Session options
 * @param {string} options.mode - 'power' | 'restorative' | 'yin' | 'flexibility' | 'core'
 * @param {string} options.level - 'beginner' | 'intermediate' | 'advanced'
 * @param {Array<Object>} options.poses - Pose database array from yoga-poses.json
 * @param {string} options.goal - 'strength' | 'flexibility' | 'recovery' | 'stress_relief' | 'balance'
 * @returns {Object} Complete Yoga session
 */
export const generateYogaSession = (options) => {
  const { mode = 'power', goal = 'balance' } = options;
  
  let session;
  
  switch (mode.toLowerCase()) {
    case 'power':
      session = generatePowerYogaSession(options);
      break;
    case 'restorative':
      session = generateRestorativeYogaSession(options);
      break;
    case 'yin':
      session = generateYinYogaSession(options);
      break;
    case 'flexibility':
      session = generateFlexibilityYogaSession(options);
      break;
    case 'core':
      session = generateCoreYogaSession(options);
      break;
    default:
      session = generatePowerYogaSession(options);
  }
  
  // Add metadata
  session.metadata = {
    generatedAt: new Date().toISOString(),
    goal,
    guideSource: '.github/HIIT-YOGA-GUIDE.md',
    parasympatheticBalance: YOGA_MODES[mode.toUpperCase()]?.sympatheticActivation === 'low'
  };
  
  return session;
};

export default {
  generateYogaSession,
  generatePowerYogaSession,
  generateRestorativeYogaSession,
  generateYinYogaSession,
  generateFlexibilityYogaSession,
  generateCoreYogaSession,
  YOGA_MODES,
  BREATHING_TECHNIQUES
};
