#!/usr/bin/env node

/**
 * Script to associate exercises with their corresponding webp demo files
 * 
 * This script:
 * 1. Reads all exercises from exercises.json
 * 2. Lists all available webp files in public/demos/
 * 3. Matches exercises to webp files using the same logic as normalizeExerciseName
 * 4. Adds "Webp File" property to exercises that match
 * 5. Reports which exercises still don't have a match
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to exercises.json
const exercisesPath = path.join(__dirname, '..', 'public', 'data', 'exercises.json');
const demosPath = path.join(__dirname, '..', 'public', 'demos');

/**
 * Normalizes an exercise name to match the demo image filename pattern
 * This is the same logic used in exerciseDemoImages.js
 */
function normalizeExerciseName(exerciseName) {
  if (!exerciseName) return '';
  
  let name = exerciseName.trim();
  
  // Handle the new "Movement, Equipment" format (e.g., "Bench Press, Barbell" -> "Barbell Bench Press")
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

/**
 * Get variations for an exercise name
 * This includes equipment order variations, decline/declined, incline/inclined, etc.
 */
function getExerciseVariations(normalized) {
  const variations = [normalized];
  
  // Handle "Dumbbell Incline X" vs "Incline Dumbbell X" variations
  if (normalized.startsWith('dumbbell-incline-')) {
    variations.push(normalized.replace(/^dumbbell-incline-/, 'incline-dumbbell-'));
  } else if (normalized.startsWith('incline-dumbbell-')) {
    variations.push(normalized.replace(/^incline-dumbbell-/, 'dumbbell-incline-'));
  }
  
  // Handle "Barbell Incline X" vs "Incline Barbell X" variations
  if (normalized.startsWith('barbell-incline-')) {
    variations.push(normalized.replace(/^barbell-incline-/, 'incline-barbell-'));
  } else if (normalized.startsWith('incline-barbell-')) {
    variations.push(normalized.replace(/^incline-barbell-/, 'barbell-incline-'));
  }
  
  // Handle "Dumbbell Decline X" vs "Decline Dumbbell X" variations
  if (normalized.startsWith('dumbbell-decline-')) {
    variations.push(normalized.replace(/^dumbbell-decline-/, 'decline-dumbbell-'));
    variations.push(normalized.replace('decline-', 'declined-'));
  } else if (normalized.startsWith('decline-dumbbell-')) {
    variations.push(normalized.replace(/^decline-dumbbell-/, 'dumbbell-decline-'));
  }
  
  // Handle "Barbell Decline X" vs "Decline Barbell X" and decline/declined variations
  if (normalized.startsWith('barbell-decline-')) {
    variations.push(normalized.replace(/^barbell-decline-/, 'decline-barbell-'));
    variations.push(normalized.replace('decline-', 'declined-'));
    variations.push(normalized.replace(/^barbell-decline-/, 'barbell-declined-'));
  } else if (normalized.startsWith('decline-barbell-')) {
    variations.push(normalized.replace(/^decline-barbell-/, 'barbell-decline-'));
  }
  
  // Handle equipment prefix removal
  const equipmentTypes = ['barbell', 'dumbbell', 'kettlebell', 'cable', 'bodyweight'];
  for (const equipment of equipmentTypes) {
    if (normalized.startsWith(`${equipment}-`)) {
      const withoutEquipment = normalized.replace(`${equipment}-`, '');
      variations.push(withoutEquipment);
    }
  }
  
  // Handle "Dumbbell X" vs "DB X" variations
  if (normalized.startsWith('db-')) {
    variations.push(normalized.replace(/^db-/, 'dumbbell-'));
  } else if (normalized.startsWith('dumbbell-')) {
    variations.push(normalized.replace(/^dumbbell-/, 'db-'));
  }
  
  // Handle "Barbell X" vs "BB X" variations
  if (normalized.startsWith('bb-')) {
    variations.push(normalized.replace(/^bb-/, 'barbell-'));
  } else if (normalized.startsWith('barbell-')) {
    variations.push(normalized.replace(/^barbell-/, 'bb-'));
  }
  
  // Handle close-grip variations
  if (normalized.includes('close-grip-')) {
    variations.push(normalized.replace('close-grip-', 'close-'));
  }
  
  // Handle single-arm variations
  if (normalized.includes('single-arm-')) {
    variations.push(normalized.replace('single-arm-', ''));
    variations.push(normalized.replace('single-arm-', '') + '-single-arm');
  }
  
  // Handle curl type variations
  if (normalized.includes('hammer-curl')) {
    variations.push('hammer-curl');
  }
  if (normalized.includes('concentration-curl')) {
    variations.push('concentration-curl');
  }
  
  // Handle press variations
  if (normalized.includes('shoulder-press')) {
    variations.push(normalized.replace('shoulder-press', 'shoulder-press-2'));
  }
  
  // Handle squat variations
  if (normalized === 'squat') {
    variations.push('bodyweight-squat', 'back-squat');
  }
  
  return [...new Set(variations)]; // Remove duplicates
}

// Read exercises.json
console.log('Reading exercises.json...');
const exercisesData = JSON.parse(fs.readFileSync(exercisesPath, 'utf8'));

// Get all webp files
console.log('Reading webp files from public/demos/...');
const webpFiles = fs.readdirSync(demosPath)
  .filter(file => file.endsWith('.webp'))
  .map(file => file.replace('.webp', ''));

console.log(`Found ${webpFiles.length} webp files`);
console.log(`Found ${exercisesData.length} exercises`);

// Track results
let alreadyHasWebp = 0;
let newMatches = 0;
let noMatch = 0;
const unmatchedExercises = [];
const newAssociations = [];

// Process each exercise
exercisesData.forEach((exercise, index) => {
  const exerciseName = exercise['Exercise Name'];
  
  // Skip if already has Webp File
  if (exercise['Webp File']) {
    alreadyHasWebp++;
    return;
  }
  
  // Normalize and try to find a match
  const normalized = normalizeExerciseName(exerciseName);
  const variations = getExerciseVariations(normalized);
  
  let matchedFile = null;
  
  // Try exact match first
  if (webpFiles.includes(normalized)) {
    matchedFile = `${normalized}.webp`;
  } else {
    // Try variations
    for (const variation of variations) {
      if (webpFiles.includes(variation)) {
        matchedFile = `${variation}.webp`;
        break;
      }
    }
  }
  
  if (matchedFile) {
    // Add Webp File property
    exercisesData[index]['Webp File'] = matchedFile;
    newMatches++;
    newAssociations.push({
      name: exerciseName,
      file: matchedFile,
      normalized,
    });
  } else {
    noMatch++;
    unmatchedExercises.push({
      name: exerciseName,
      normalized,
      variations: variations.slice(0, 3), // Show first 3 variations
    });
  }
});

// Report results
console.log('\n=== Results ===');
console.log(`Already had Webp File: ${alreadyHasWebp}`);
console.log(`New matches found: ${newMatches}`);
console.log(`No match found: ${noMatch}`);
console.log(`Total webp associations: ${alreadyHasWebp + newMatches}`);

if (newAssociations.length > 0) {
  console.log('\n=== New Associations (first 10) ===');
  newAssociations.slice(0, 10).forEach(({ name, file, normalized }) => {
    console.log(`  "${name}" -> ${file}`);
  });
  if (newAssociations.length > 10) {
    console.log(`  ... and ${newAssociations.length - 10} more`);
  }
}

if (unmatchedExercises.length > 0) {
  console.log('\n=== Unmatched Exercises (first 10) ===');
  unmatchedExercises.slice(0, 10).forEach(({ name, normalized }) => {
    console.log(`  "${name}" (normalized: ${normalized})`);
  });
  if (unmatchedExercises.length > 10) {
    console.log(`  ... and ${unmatchedExercises.length - 10} more will use SVG fallback`);
  }
}

// Write updated exercises.json
console.log('\n=== Writing updated exercises.json ===');
fs.writeFileSync(exercisesPath, JSON.stringify(exercisesData, null, 2) + '\n', 'utf8');
console.log('✓ exercises.json updated successfully');

console.log('\n=== Summary ===');
console.log(`- ${alreadyHasWebp + newMatches} exercises now have webp associations`);
console.log(`- ${noMatch} exercises will use SVG muscle diagram fallback`);
console.log(`- ${webpFiles.length - (alreadyHasWebp + newMatches)} webp files are unused`);
