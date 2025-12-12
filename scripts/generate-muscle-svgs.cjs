#!/usr/bin/env node

/**
 * Script to generate customized muscle-worked SVG demos for exercises
 * Highlights primary and secondary muscles based on exercise data
 */

const fs = require('fs');
const path = require('path');

const EXERCISES_JSON_PATH = path.join(__dirname, '../public/data/exercises.json');
const BASE_SVG_PATH = path.join(__dirname, '../public/demos/muscles-worked.svg');
const OUTPUT_DIR = path.join(__dirname, '../public/demos');

// Theme colors (from ThemeContext.jsx)
const PRIMARY_COLOR = '#1db584';  // Bright teal for primary muscles
const PRIMARY_SECONDARY_ALPHA = 0.4;  // 40% opacity for secondary muscles

// Base color for non-targeted muscles (neutral gray matching app theme)
const BASE_MUSCLE_FILL = '#718096';  // Muted gray (text-secondary in light theme)
const BASE_MUSCLE_OPACITY = 0.3;

// Mapping from muscle names in exercises.json to SVG group IDs
const MUSCLE_MAP = {
  'Abs': 'abs',
  'Adductors': 'adductors',
  'Biceps': 'biceps',
  'Calves': 'calves',
  'Chest': 'chest',
  'Forearms': 'forearms',
  'Front delts': 'front_delts',
  'Glutes': 'glutes',
  'Grip': 'grip',
  'Hamstrings': 'hamstrings',
  'Lats': 'lats',
  'Lower back': 'lower_back',
  'Obliques': 'obliques',
  'Others': 'others',
  'Quads': 'quads',
  'Rear delts': 'rear_delts',
  'Traps': 'traps',
  'Triceps': 'triceps',
  'Vastus medialis': 'vastus_medialis',
};

// Create output directory if it doesn't exist
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Read base SVG file
const baseSvgContent = fs.readFileSync(BASE_SVG_PATH, 'utf8');

// Read exercises data
const exercises = JSON.parse(fs.readFileSync(EXERCISES_JSON_PATH, 'utf8'));

console.log(`Loaded ${exercises.length} exercises`);
console.log(`Base SVG loaded from: ${BASE_SVG_PATH}`);

/**
 * Normalize exercise name to filename format
 */
function normalizeExerciseName(name) {
  return name
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Generate customized SVG for an exercise
 */
function generateCustomizedSVG(exercise) {
  const primaryMuscle = exercise['Primary Muscle'];
  const secondaryMuscles = exercise['Secondary Muscles'] || [];
  
  // Start with base SVG
  let svgContent = baseSvgContent;
  
  // Apply base color to all muscles first
  const allMuscleGroups = Object.keys(MUSCLE_MAP);
  allMuscleGroups.forEach(muscleName => {
    const svgId = MUSCLE_MAP[muscleName];
    svgContent = highlightMuscleGroup(svgContent, svgId, BASE_MUSCLE_FILL, BASE_MUSCLE_OPACITY);
  });
  
  // Highlight secondary muscles (muted teal)
  secondaryMuscles.forEach(muscle => {
    const svgId = MUSCLE_MAP[muscle];
    if (svgId) {
      svgContent = highlightMuscleGroup(svgContent, svgId, PRIMARY_COLOR, PRIMARY_SECONDARY_ALPHA);
    }
  });
  
  // Highlight primary muscle (bright teal)
  const primarySvgId = MUSCLE_MAP[primaryMuscle];
  if (primarySvgId) {
    svgContent = highlightMuscleGroup(svgContent, primarySvgId, PRIMARY_COLOR, 1.0);
  }
  
  return svgContent;
}

/**
 * Highlight a muscle group in the SVG by adding fill and fill-opacity
 */
function highlightMuscleGroup(svgContent, groupId, color, opacity) {
  // Match the <g id="groupId"> tag and add fill/fill-opacity to all paths within
  const groupRegex = new RegExp(`(<g id="${groupId}"[^>]*>)([\\s\\S]*?)(</g>)`, 'g');
  
  return svgContent.replace(groupRegex, (match, openTag, content, closeTag) => {
    // Update all paths within this group
    const updatedContent = content.replace(
      /<path\s+([^>]*)\s*\/>/g,
      (pathMatch, pathAttrs) => {
        // Remove existing fill and fill-opacity if present
        let attrs = pathAttrs
          .replace(/fill="[^"]*"/g, '')
          .replace(/fill-opacity="[^"]*"/g, '')
          .trim();
        
        // Add new fill and fill-opacity
        return `<path ${attrs} fill="${color}" fill-opacity="${opacity}" />`;
      }
    );
    
    return openTag + updatedContent + closeTag;
  });
}

/**
 * Check if an exercise already has a demo image
 */
function hasExistingDemo(exerciseName) {
  const normalized = normalizeExerciseName(exerciseName);
  const demoPath = path.join(__dirname, `../public/demos/${normalized}.webp`);
  return fs.existsSync(demoPath);
}

// Generate SVGs for exercises without existing demos
let generatedCount = 0;
let skippedCount = 0;

exercises.forEach(exercise => {
  const exerciseName = exercise['Exercise Name'];
  
  // Skip if already has a demo
  if (hasExistingDemo(exerciseName)) {
    skippedCount++;
    return;
  }
  
  // Generate customized SVG
  const customizedSVG = generateCustomizedSVG(exercise);
  
  // Save to file
  const filename = normalizeExerciseName(exerciseName) + '.svg';
  const outputPath = path.join(OUTPUT_DIR, filename);
  
  fs.writeFileSync(outputPath, customizedSVG, 'utf8');
  generatedCount++;
  
  if (generatedCount <= 5) {
    console.log(`Generated: ${filename}`);
    console.log(`  Primary: ${exercise['Primary Muscle']}`);
    console.log(`  Secondary: ${(exercise['Secondary Muscles'] || []).join(', ')}`);
  }
});

console.log(`\n✓ Generation complete:`);
console.log(`  - Generated: ${generatedCount} SVG demos`);
console.log(`  - Skipped (has existing demo): ${skippedCount}`);
console.log(`  - Output directory: ${OUTPUT_DIR}`);
