/**
 * Script to add explicit "image" field to all exercises in exercises.json
 * 
 * Priority:
 * 1. If exercise has "Webp File", use that path: demos/{webpFile}
 * 2. Otherwise, use static SVG: svg-muscles/{normalized-name}.svg
 * 
 * This ensures every exercise has an explicit, direct image path.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Normalize exercise name to match SVG filename pattern
// Handles "Movement, Equipment" format by converting to "equipment-movement"
function normalizeExerciseName(exerciseName) {
  if (!exerciseName) return '';
  
  let name = exerciseName.trim();
  
  // Handle the "Movement, Equipment" format (e.g., "Arnold Press, Dumbbell" -> "dumbbell-arnold-press")
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
}

// Read exercises.json
const exercisesPath = path.join(__dirname, '..', 'public', 'data', 'exercises.json');
const exercises = JSON.parse(fs.readFileSync(exercisesPath, 'utf8'));

// Get list of available static SVGs
const svgDir = path.join(__dirname, '..', 'public', 'svg-muscles');
const availableSvgs = new Set(
  fs.readdirSync(svgDir)
    .filter(f => f.endsWith('.svg'))
    .map(f => f.replace('.svg', ''))
);

console.log(`Total exercises: ${exercises.length}`);
console.log(`Available static SVGs: ${availableSvgs.size}`);

let withWebp = 0;
let withSvg = 0;
let missing = [];

// Add image field to each exercise
const updatedExercises = exercises.map(exercise => {
  const exerciseName = exercise['Exercise Name'];
  
  // Priority 1: Use Webp File if available
  if (exercise['Webp File']) {
    withWebp++;
    return {
      ...exercise,
      image: `demos/${exercise['Webp File']}`
    };
  }
  
  // Priority 2: Use static SVG
  const normalized = normalizeExerciseName(exerciseName);
  if (availableSvgs.has(normalized)) {
    withSvg++;
    return {
      ...exercise,
      image: `svg-muscles/${normalized}.svg`
    };
  }
  
  // Track missing images
  missing.push(exerciseName);
  
  // Return without image field - will need manual intervention or SVG generation
  return exercise;
});

console.log(`\nExercises with webp images: ${withWebp}`);
console.log(`Exercises with SVG images: ${withSvg}`);
console.log(`Exercises missing images: ${missing.length}`);

if (missing.length > 0) {
  console.log('\nMissing images for:');
  missing.forEach(name => {
    console.log(`  - ${name} (normalized: ${normalizeExerciseName(name)})`);
  });
}

// Write updated exercises.json
const outputPath = path.join(__dirname, '..', 'public', 'data', 'exercises.json');
fs.writeFileSync(outputPath, JSON.stringify(updatedExercises, null, 2), 'utf8');

console.log(`\n✓ Updated exercises.json with image field`);
console.log(`  Total: ${updatedExercises.length} exercises`);
console.log(`  With images: ${withWebp + withSvg}`);
console.log(`  Missing: ${missing.length}`);
