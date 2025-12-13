/**
 * Script to pre-generate SVG files for exercises without demo images
 * 
 * This script:
 * 1. Reads exercises.json
 * 2. Identifies exercises without "Webp File" field
 * 3. Generates muscle-highlight SVGs for each exercise
 * 4. Saves SVGs to public/svg/ directory
 * 5. Updates exercises.json with "Svg File" field
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import the muscle highlight SVG generator logic
// We'll inline the necessary functions here to avoid import issues

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
  "Vastus Medialis": "vastus_medialis",
};

/**
 * Converts muscle names to SVG group IDs
 */
const musclesToSvgIds = (muscleString) => {
  if (!muscleString) return [];
  
  const muscles = muscleString.split(',').map(m => m.trim());
  const svgIds = [];
  
  for (const muscle of muscles) {
    const svgId = MUSCLE_TO_SVG_ID[muscle];
    if (svgId) {
      svgIds.push(svgId);
    }
  }
  
  return [...new Set(svgIds)]; // Remove duplicates
};

// Read the canonical SVG template
const CANONICAL_SVG_TEMPLATE = fs.readFileSync(
  path.join(__dirname, '../docs/demos/muscles-worked.svg'),
  'utf-8'
);

/**
 * Highlights all muscle groups in the canonical SVG
 */
const highlightAllMuscles = (svgTemplate) => {
  const highlightedSvg = svgTemplate.replace(
    /<style>[\s\S]*?<\/style>/,
    `<style>
      .cls-1 {
        fill: #2563eb;
        opacity: 1;
      }
    </style>`
  );
  
  return highlightedSvg;
};

/**
 * Highlights specific muscle groups in the canonical SVG
 */
const highlightSpecificMuscles = (svgTemplate, primaryIds, secondaryIds) => {
  let modifiedSvg = svgTemplate;
  
  // Replace the original style with custom highlighting styles
  modifiedSvg = modifiedSvg.replace(
    /<style>[\s\S]*?<\/style>/,
    `<style>
      .cls-1 {
        fill: #e5e7eb;
        opacity: 0.7;
      }
      .cls-primary {
        fill: #2563eb;
        opacity: 1;
      }
      .cls-secondary {
        fill: #60a5fa;
        opacity: 1;
      }
    </style>`
  );
  
  // Update the class for primary muscle groups
  primaryIds.forEach(muscleId => {
    const groupRegex = new RegExp(`(<g id="${muscleId}"[^>]*>[\\s\\S]*?)<\\/g>`);
    const match = modifiedSvg.match(groupRegex);
    if (match) {
      const groupContent = match[1];
      const updatedGroupContent = groupContent.replace(/class="cls-1"/g, 'class="cls-primary"');
      modifiedSvg = modifiedSvg.replace(groupContent, updatedGroupContent);
    }
  });
  
  // Update the class for secondary muscle groups
  secondaryIds.forEach(muscleId => {
    if (!primaryIds.includes(muscleId)) {
      const groupRegex = new RegExp(`(<g id="${muscleId}"[^>]*>[\\s\\S]*?)<\\/g>`);
      const match = modifiedSvg.match(groupRegex);
      if (match) {
        const groupContent = match[1];
        const updatedGroupContent = groupContent.replace(/class="cls-1"/g, 'class="cls-secondary"');
        modifiedSvg = modifiedSvg.replace(groupContent, updatedGroupContent);
      }
    }
  });
  
  return modifiedSvg;
};

/**
 * Generates a custom muscle highlight SVG
 */
const generateMuscleHighlightSvg = (primaryMuscle, secondaryMuscles) => {
  const primaryIds = musclesToSvgIds(primaryMuscle);
  const secondaryIds = musclesToSvgIds(secondaryMuscles);
  
  // If "all-muscles" is included, highlight everything
  if (primaryIds.includes('all-muscles') || secondaryIds.includes('all-muscles')) {
    return highlightAllMuscles(CANONICAL_SVG_TEMPLATE);
  }
  
  // Generate SVG with highlighted muscle groups
  return highlightSpecificMuscles(CANONICAL_SVG_TEMPLATE, primaryIds, secondaryIds);
};

/**
 * Normalizes an exercise name to create a valid filename
 */
const normalizeExerciseName = (exerciseName) => {
  if (!exerciseName) return '';
  
  let name = exerciseName.trim();
  
  // Handle the "Movement, Equipment" format
  const commaIndex = name.lastIndexOf(', ');
  if (commaIndex > 0 && commaIndex < name.length - 2) {
    const movement = name.substring(0, commaIndex).trim();
    const equipment = name.substring(commaIndex + 2).trim();
    if (movement && equipment && !equipment.includes(',')) {
      name = `${equipment} ${movement}`;
    }
  }
  
  return name
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/\s/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
};

// Main script execution
const main = () => {
  console.log('🎨 Generating SVG files for exercises without demo images...\n');
  
  // Read exercises.json
  const exercisesPath = path.join(__dirname, '../public/data/exercises.json');
  const exercises = JSON.parse(fs.readFileSync(exercisesPath, 'utf-8'));
  
  // Create svg directory if it doesn't exist
  const svgDir = path.join(__dirname, '../public/svg');
  if (!fs.existsSync(svgDir)) {
    fs.mkdirSync(svgDir, { recursive: true });
    console.log('✅ Created public/svg/ directory\n');
  }
  
  let generatedCount = 0;
  let skippedCount = 0;
  const updatedExercises = [];
  
  // Process each exercise
  exercises.forEach((exercise, index) => {
    const exerciseName = exercise['Exercise Name'];
    const hasWebp = exercise['Webp File'];
    const primaryMuscle = exercise['Primary Muscle'] || '';
    const secondaryMuscles = exercise['Secondary Muscles'] || '';
    
    if (hasWebp) {
      // Exercise already has a webp file, skip SVG generation
      skippedCount++;
      updatedExercises.push(exercise);
    } else {
      // Generate SVG for this exercise
      const svgContent = generateMuscleHighlightSvg(primaryMuscle, secondaryMuscles);
      const normalizedName = normalizeExerciseName(exerciseName);
      const svgFilename = `${normalizedName}.svg`;
      const svgPath = path.join(svgDir, svgFilename);
      
      // Write SVG file
      fs.writeFileSync(svgPath, svgContent, 'utf-8');
      
      // Add "Svg File" field to exercise
      const updatedExercise = {
        ...exercise,
        'Svg File': svgFilename,
      };
      
      updatedExercises.push(updatedExercise);
      generatedCount++;
      
      if (generatedCount <= 5 || generatedCount % 20 === 0) {
        console.log(`  ${generatedCount}. ${exerciseName} → ${svgFilename}`);
      }
    }
  });
  
  // Write updated exercises.json
  fs.writeFileSync(
    exercisesPath,
    JSON.stringify(updatedExercises, null, 2),
    'utf-8'
  );
  
  console.log(`\n✅ Generated ${generatedCount} SVG files`);
  console.log(`✅ Skipped ${skippedCount} exercises with existing webp images`);
  console.log(`✅ Updated exercises.json with "Svg File" fields`);
  console.log(`\n📁 SVG files saved to: public/svg/`);
};

// Run the script
try {
  main();
} catch (error) {
  console.error('❌ Error generating SVGs:', error);
  process.exit(1);
}
