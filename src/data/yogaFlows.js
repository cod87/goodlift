/**
 * Yoga Flows Database
 * Preset yoga flow routines with different durations, difficulty levels, and focuses
 */

export const yogaFlowsData = [
  {
    flowName: 'Morning Energizer Flow',
    durationMinutes: 10,
    difficultyLevel: 'Beginner',
    primaryFocus: 'Full Body Wake-Up',
    posesIncluded: [
      "Child's Pose",
      'Cat-Cow Stretch',
      'Downward Dog',
      'Forward Fold',
      'Mountain Pose',
      'Sun Salutation',
      'Warrior I',
      'Tree Pose',
      'Corpse Pose'
    ],
    targetMuscles: 'Full Body, Back, Hamstrings, Hip Flexors, Core',
    suitableFor: 'Morning practice, beginners, gentle wake-up routine',
    pace: 'Moderate',
    propsNeeded: 'Yoga mat',
    youtubeLink: 'https://www.youtube.com/watch?v=VaoV1PrYft4',
  },
  {
    flowName: 'Stress Relief & Relaxation',
    durationMinutes: 15,
    difficultyLevel: 'Beginner',
    primaryFocus: 'Relaxation & Stress Relief',
    posesIncluded: [
      "Child's Pose",
      'Cat-Cow Stretch',
      'Seated Forward Fold',
      'Supine Spinal Twist',
      'Happy Baby Pose',
      'Legs Up the Wall',
      'Corpse Pose',
      'Gentle breathing exercises'
    ],
    targetMuscles: 'Back, Hips, Hamstrings, Nervous System',
    suitableFor: 'Evening practice, stress relief, better sleep preparation',
    pace: 'Slow and gentle',
    propsNeeded: 'Yoga mat, optional blanket',
    youtubeLink: 'https://www.youtube.com/watch?v=KYcP7JKxOMg',
  },
  {
    flowName: 'Core Strength Flow',
    durationMinutes: 15,
    difficultyLevel: 'Intermediate',
    primaryFocus: 'Core Strengthening',
    posesIncluded: [
      'Plank Pose',
      'Side Plank',
      'Boat Pose',
      'Bicycle Crunches',
      'Warrior III',
      'Chair Pose',
      'Crow Pose',
      'Bridge Pose'
    ],
    targetMuscles: 'Core, Abs, Obliques, Lower Back, Glutes',
    suitableFor: 'Building core strength, improving balance, intermediate practitioners',
    pace: 'Moderate to challenging',
    propsNeeded: 'Yoga mat',
    youtubeLink: 'https://www.youtube.com/watch?v=Cz6spZD9LrQ',
  },
  {
    flowName: 'Hip Opening Flow',
    durationMinutes: 15,
    difficultyLevel: 'Intermediate',
    primaryFocus: 'Hip Flexibility',
    posesIncluded: [
      'Cat-Cow Stretch',
      'Low Lunge',
      'Pigeon Pose',
      'Lizard Pose',
      'Frog Pose',
      'Butterfly Stretch',
      'Happy Baby Pose',
      'Figure 4 Stretch'
    ],
    targetMuscles: 'Hip Flexors, Glutes, Inner Thighs, Lower Back',
    suitableFor: 'Tight hips, desk workers, athletes, improving flexibility',
    pace: 'Slow and deep',
    propsNeeded: 'Yoga mat, optional blocks',
    youtubeLink: 'https://www.youtube.com/watch?v=7KwlUhBjgMg',
  },
  {
    flowName: 'Upper Body Stretch Flow',
    durationMinutes: 10,
    difficultyLevel: 'Beginner',
    primaryFocus: 'Upper Body Flexibility',
    posesIncluded: [
      'Cat-Cow Stretch',
      'Thread the Needle',
      'Puppy Pose',
      'Eagle Arms',
      'Cow Face Pose Arms',
      'Chest Expansion',
      'Shoulder Rolls',
      'Neck Stretches'
    ],
    targetMuscles: 'Shoulders, Upper Back, Chest, Neck, Triceps',
    suitableFor: 'Desk workers, upper body tension relief, post-workout recovery',
    pace: 'Slow and gentle',
    propsNeeded: 'Yoga mat, optional strap',
    youtubeLink: 'https://www.youtube.com/watch?v=lVGgLfg3wQ8',
  },
  {
    flowName: 'Lower Body Strength & Flexibility',
    durationMinutes: 15,
    difficultyLevel: 'Intermediate',
    primaryFocus: 'Lower Body',
    posesIncluded: [
      'Mountain Pose',
      'Chair Pose',
      'Warrior I',
      'Warrior II',
      'Triangle Pose',
      'Standing Forward Fold',
      'Tree Pose',
      'Low Lunge',
      'Pigeon Pose'
    ],
    targetMuscles: 'Quads, Hamstrings, Glutes, Calves, Hip Flexors',
    suitableFor: 'Leg day recovery, building lower body strength and flexibility',
    pace: 'Moderate',
    propsNeeded: 'Yoga mat',
    youtubeLink: 'https://www.youtube.com/watch?v=GLy2RA3sA_E',
  },
  {
    flowName: 'Back Pain Relief Flow',
    durationMinutes: 10,
    difficultyLevel: 'Beginner',
    primaryFocus: 'Back Pain Relief',
    posesIncluded: [
      "Child's Pose",
      'Cat-Cow Stretch',
      'Sphinx Pose',
      'Thread the Needle',
      'Knees to Chest',
      'Supine Spinal Twist',
      'Happy Baby Pose'
    ],
    targetMuscles: 'Lower Back, Upper Back, Glutes, Hip Flexors',
    suitableFor: 'Back pain relief, gentle stretching, daily maintenance',
    pace: 'Very slow and gentle',
    propsNeeded: 'Yoga mat, optional cushion',
    youtubeLink: 'https://www.youtube.com/watch?v=DjFAmEe0P18',
  },
  {
    flowName: 'Power Vinyasa Flow',
    durationMinutes: 15,
    difficultyLevel: 'Advanced',
    primaryFocus: 'Strength & Endurance',
    posesIncluded: [
      'Sun Salutation A',
      'Sun Salutation B',
      'Warrior Series',
      'Chaturanga',
      'Upward Dog',
      'Downward Dog',
      'Side Plank',
      'Crow Pose',
      'Wheel Pose'
    ],
    targetMuscles: 'Full Body, Core, Arms, Legs, Back',
    suitableFor: 'Advanced practitioners, building strength and stamina, dynamic practice',
    pace: 'Fast and challenging',
    propsNeeded: 'Yoga mat',
    youtubeLink: 'https://www.youtube.com/watch?v=v7AYKMP6rOE',
  },
  {
    flowName: 'Bedtime Wind Down',
    durationMinutes: 10,
    difficultyLevel: 'Beginner',
    primaryFocus: 'Sleep Preparation',
    posesIncluded: [
      "Child's Pose",
      'Seated Forward Fold',
      'Reclining Bound Angle',
      'Supine Spinal Twist',
      'Legs Up the Wall',
      'Corpse Pose with guided relaxation'
    ],
    targetMuscles: 'Full Body Relaxation, Nervous System',
    suitableFor: 'Evening practice, insomnia, calming the mind before sleep',
    pace: 'Very slow and restorative',
    propsNeeded: 'Yoga mat, blanket, pillow',
    youtubeLink: 'https://www.youtube.com/watch?v=BiWDsfZ3zbo',
  },
  {
    flowName: 'Balance & Focus Flow',
    durationMinutes: 10,
    difficultyLevel: 'Intermediate',
    primaryFocus: 'Balance & Concentration',
    posesIncluded: [
      'Mountain Pose',
      'Tree Pose',
      'Warrior III',
      'Half Moon Pose',
      'Eagle Pose',
      'Standing Hand to Big Toe',
      'Dancer Pose'
    ],
    targetMuscles: 'Full Body, Core, Legs, Ankles',
    suitableFor: 'Improving balance, mental focus, coordination',
    pace: 'Moderate with holds',
    propsNeeded: 'Yoga mat, optional wall for support',
    youtubeLink: 'https://www.youtube.com/watch?v=tAUf7aajBWE',
  },
  {
    flowName: 'Athletic Recovery Flow',
    durationMinutes: 15,
    difficultyLevel: 'Intermediate',
    primaryFocus: 'Post-Workout Recovery',
    posesIncluded: [
      'Downward Dog',
      'Low Lunge',
      'Pigeon Pose',
      'Lizard Pose',
      'Standing Forward Fold',
      'Seated Spinal Twist',
      'Legs Up the Wall',
      'Supine Spinal Twist'
    ],
    targetMuscles: 'Hips, Hamstrings, Quads, Back, Full Body',
    suitableFor: 'Post-workout recovery, athletes, reducing muscle soreness',
    pace: 'Slow with deep stretches',
    propsNeeded: 'Yoga mat, optional blocks',
    youtubeLink: 'https://www.youtube.com/watch?v=Yzm3fA2HhkQ',
  },
  {
    flowName: 'Quick Desk Break Flow',
    durationMinutes: 10,
    difficultyLevel: 'Beginner',
    primaryFocus: 'Desk Worker Relief',
    posesIncluded: [
      'Seated Cat-Cow',
      'Seated Spinal Twist',
      'Eagle Arms',
      'Neck Rolls',
      'Wrist Stretches',
      'Standing Forward Fold',
      'Chair Pose',
      'Mountain Pose'
    ],
    targetMuscles: 'Neck, Shoulders, Upper Back, Wrists, Hips',
    suitableFor: 'Desk workers, computer users, taking breaks from sitting',
    pace: 'Gentle to moderate',
    propsNeeded: 'Chair optional, minimal space',
    youtubeLink: 'https://www.youtube.com/watch?v=4C-gxOE0j7s',
  },
];

/**
 * Get flows filtered by duration
 * @param {number} minutes - Duration in minutes (10 or 15)
 * @returns {Array} Array of yoga flows matching the duration
 */
export const getFlowsByDuration = (minutes) => {
  return yogaFlowsData.filter(flow => flow.durationMinutes === minutes);
};

/**
 * Get flows filtered by difficulty level
 * @param {string} level - 'Beginner', 'Intermediate', or 'Advanced'
 * @returns {Array} Array of yoga flows matching the difficulty
 */
export const getFlowsByDifficulty = (level) => {
  return yogaFlowsData.filter(flow => flow.difficultyLevel === level);
};

/**
 * Get flows filtered by primary focus
 * @param {string} focus - Focus area (partial match)
 * @returns {Array} Array of yoga flows matching the focus
 */
export const getFlowsByFocus = (focus) => {
  return yogaFlowsData.filter(flow => 
    flow.primaryFocus.toLowerCase().includes(focus.toLowerCase())
  );
};

/**
 * Get all unique difficulty levels
 * @returns {Array} Array of difficulty levels
 */
export const getDifficultyLevels = () => {
  return [...new Set(yogaFlowsData.map(flow => flow.difficultyLevel))];
};

/**
 * Get all unique durations
 * @returns {Array} Array of durations in minutes
 */
export const getDurations = () => {
  return [...new Set(yogaFlowsData.map(flow => flow.durationMinutes))].sort((a, b) => a - b);
};
