/**
 * Muscle Highlight SVG Generator
 * 
 * Generates custom SVG images highlighting specific muscle groups
 * based on exercise primary and secondary muscles.
 */

// Mapping from exercise muscle names to SVG element IDs
const MUSCLE_TO_SVG_ID = {
  // Primary muscles
  "Biceps": "biceps",
  "Calves": "calves",
  "Chest": "chest",
  "Core": "abs",
  "Delts": "front_delts",
  "Erector Spinae": "lower_back",
  "Full Body": "all-muscles",
  "Glutes": "glutes",
  "Hamstrings": "hamstrings",
  "Hip Flexors": "others",
  "Lats": "lats",
  "Obliques": "obliques",
  "Quads": "quads",
  "Rear Delts": "rear_delts",
  "Shoulders": "front_delts",
  "Traps": "traps",
  "Triceps": "triceps",
  
  // Secondary muscles
  "Back": "lats",
  "Front Delts": "front_delts",
  "Lower Back": "lower_back",
  "Forearms": "forearms",
  "Rhomboids": "traps",
  "Grip": "grip",
  "All": "all-muscles",
  "Adductors": "adductors",
  "Abductors": "others",
  "Balance": "others",
  "Upper Back": "traps",
};

/**
 * Converts muscle names to SVG group IDs
 * @param {string} muscleString - Comma-separated muscle names
 * @returns {string[]} Array of SVG group IDs
 */
export const musclesToSvgIds = (muscleString) => {
  if (!muscleString) return [];
  
  const muscles = muscleString.split(',').map(m => m.trim());
  const svgIds = [];
  
  for (const muscle of muscles) {
    const svgId = MUSCLE_TO_SVG_ID[muscle];
    if (svgId) {
      // Handle multiple IDs (e.g., "lats,biceps")
      if (svgId.includes(',')) {
        svgIds.push(...svgId.split(','));
      } else {
        svgIds.push(svgId);
      }
    }
  }
  
  return [...new Set(svgIds)]; // Remove duplicates
};

/**
 * Generates a custom muscle highlight SVG based on exercise muscle data
 * @param {string} primaryMuscle - Primary muscle(s) for the exercise
 * @param {string} secondaryMuscles - Secondary muscles for the exercise
 * @returns {string} SVG markup as a string
 */
export const generateMuscleHighlightSvg = (primaryMuscle, secondaryMuscles) => {
  // Get SVG IDs for primary and secondary muscles
  const primaryIds = musclesToSvgIds(primaryMuscle);
  const secondaryIds = musclesToSvgIds(secondaryMuscles);
  
  // If "all-muscles" is included, just highlight everything
  if (primaryIds.includes('all-muscles') || secondaryIds.includes('all-muscles')) {
    return generateAllMusclesSvg();
  }
  
  // Generate SVG with highlighted muscle groups
  return generateCustomMusclesSvg(primaryIds, secondaryIds);
};

/**
 * Generates SVG with all muscles highlighted
 * @returns {string} SVG markup
 */
const generateAllMusclesSvg = () => {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 190.56 233.14">
  <defs>
    <style>
      .muscle { fill: #1db584; opacity: 1; }
    </style>
  </defs>
  <g id="all-muscles">
    <circle class="muscle" cx="95.28" cy="116.57" r="80" />
    <text x="95.28" y="120" text-anchor="middle" font-size="16" fill="#fff" font-weight="bold">Full Body</text>
  </g>
</svg>`;
};

/**
 * Generates SVG with specific muscles highlighted
 * Primary muscles are highlighted with full opacity (#1db584)
 * Secondary muscles are highlighted with reduced opacity (#1db584 at 60%)
 * @param {string[]} primaryIds - Array of primary muscle SVG IDs
 * @param {string[]} secondaryIds - Array of secondary muscle SVG IDs
 * @returns {string} SVG markup
 */
const generateCustomMusclesSvg = (primaryIds, secondaryIds) => {
  // Start with the base muscles SVG structure
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 190.56 233.14">
  <defs>
    <style>
      .cls-base { fill: #e0e0e0; opacity: 0.3; }
      .cls-primary { fill: #1db584; opacity: 1; }
      .cls-secondary { fill: #1db584; opacity: 0.6; }
    </style>
  </defs>
  ${generateMuscleGroups(primaryIds, secondaryIds)}
</svg>`;
  
  return svg;
};

/**
 * Generates SVG path elements for muscle groups
 * @param {string[]} primaryIds - Primary muscle group IDs
 * @param {string[]} secondaryIds - Secondary muscle group IDs  
 * @returns {string} SVG group elements
 */
const generateMuscleGroups = (primaryIds, secondaryIds) => {
  // Define simplified muscle shapes (front view of body)
  const muscleShapes = {
    'traps': '<path d="M70,35 Q95,30 120,35 L115,50 Q95,45 75,50 Z"/>',
    'front_delts': '<path d="M50,45 L65,55 L65,75 L55,70 Z M125,45 L110,55 L110,75 L120,70 Z"/>',
    'chest': '<ellipse cx="95" cy="70" rx="20" ry="18"/>',
    'biceps': '<ellipse cx="45" cy="85" rx="8" ry="15" transform="rotate(-15 45 85)"/> <ellipse cx="145" cy="85" rx="8" ry="15" transform="rotate(15 145 85)"/>',
    'forearms': '<rect x="35" y="110" width="12" height="25" rx="6"/> <rect x="143" y="110" width="12" height="25" rx="6"/>',
    'abs': '<ellipse cx="95" cy="95" rx="18" ry="25"/>',
    'obliques': '<ellipse cx="75" cy="100" rx="8" ry="20" transform="rotate(-10 75 100)"/> <ellipse cx="115" cy="100" rx="8" ry="20" transform="rotate(10 115 100)"/>',
    'quads': '<ellipse cx="80" cy="160" rx="12" ry="35"/> <ellipse cx="110" cy="160" rx="12" ry="35"/>',
    'adductors': '<path d="M85,130 L95,150 L105,130 Z"/>',
    'calves': '<ellipse cx="80" cy="210" rx="8" ry="18"/> <ellipse cx="110" cy="210" rx="8" ry="18"/>',
    
    // Back muscles (shown as outlines on front view)
    'lats': '<path d="M65,60 Q50,80 55,100 L70,95 Q72,75 65,60 Z M125,60 Q140,80 135,100 L120,95 Q118,75 125,60 Z"/>',
    'rear_delts': '<circle cx="55" cy="50" r="6"/> <circle cx="135" cy="50" r="6"/>',
    'triceps': '<ellipse cx="40" cy="75" rx="6" ry="12"/> <ellipse cx="150" cy="75" rx="6" ry="12"/>',
    'lower_back': '<ellipse cx="95" cy="110" rx="15" ry="12"/>',
    'glutes': '<ellipse cx="80" cy="135" rx="10" ry="8"/> <ellipse cx="110" cy="135" rx="10" ry="8"/>',
    'hamstrings': '<ellipse cx="80" cy="165" rx="10" ry="25"/> <ellipse cx="110" cy="165" rx="10" ry="25"/>',
    'grip': '<circle cx="41" cy="125" r="5"/> <circle cx="149" cy="125" r="5"/>',
    'others': '<circle cx="95" cy="125" r="8"/>',
  };
  
  let groups = '';
  
  // Add all muscle groups with appropriate classes
  for (const [muscleId, shape] of Object.entries(muscleShapes)) {
    let className = 'cls-base';
    if (primaryIds.includes(muscleId)) {
      className = 'cls-primary';
    } else if (secondaryIds.includes(muscleId)) {
      className = 'cls-secondary';
    }
    groups += `  <g id="${muscleId}" class="${className}">\n    ${shape}\n  </g>\n`;
  }
  
  return groups;
};

/**
 * Converts SVG string to a data URL
 * @param {string} svgString - SVG markup
 * @returns {string} Data URL
 */
export const svgToDataUrl = (svgString) => {
  // Encode the SVG for use in a data URL
  const encoded = encodeURIComponent(svgString)
    .replace(/'/g, '%27')
    .replace(/"/g, '%22');
  return `data:image/svg+xml,${encoded}`;
};

/**
 * Generates a data URL for a custom muscle highlight SVG
 * @param {string} primaryMuscle - Primary muscle(s)
 * @param {string} secondaryMuscles - Secondary muscle(s)
 * @returns {string} Data URL for the SVG
 */
export const getMuscleHighlightDataUrl = (primaryMuscle, secondaryMuscles) => {
  const svg = generateMuscleHighlightSvg(primaryMuscle, secondaryMuscles);
  return svgToDataUrl(svg);
};
