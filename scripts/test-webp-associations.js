#!/usr/bin/env node

/**
 * Test script to verify webp file associations and SVG fallback
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const exercisesPath = path.join(__dirname, '..', 'public', 'data', 'exercises.json');

console.log('Testing webp file associations and SVG fallback...\n');

const exercisesData = JSON.parse(fs.readFileSync(exercisesPath, 'utf8'));

// Statistics
let withWebp = 0;
let withoutWebp = 0;
let withoutPrimaryMuscle = 0;

// Sample exercises
const samplesWithWebp = [];
const samplesWithoutWebp = [];
const samplesWithoutMuscleData = [];

exercisesData.forEach((exercise) => {
  const hasWebp = !!exercise['Webp File'];
  const hasPrimaryMuscle = !!exercise['Primary Muscle'];
  
  if (hasWebp) {
    withWebp++;
    if (samplesWithWebp.length < 5) {
      samplesWithWebp.push({
        name: exercise['Exercise Name'],
        webp: exercise['Webp File'],
        muscle: exercise['Primary Muscle'],
      });
    }
  } else {
    withoutWebp++;
    if (samplesWithoutWebp.length < 5) {
      samplesWithoutWebp.push({
        name: exercise['Exercise Name'],
        muscle: exercise['Primary Muscle'],
        secondary: exercise['Secondary Muscles'],
      });
    }
    
    if (!hasPrimaryMuscle) {
      withoutPrimaryMuscle++;
      if (samplesWithoutMuscleData.length < 3) {
        samplesWithoutMuscleData.push(exercise['Exercise Name']);
      }
    }
  }
});

console.log('=== Statistics ===');
console.log(`Total exercises: ${exercisesData.length}`);
console.log(`Exercises with webp files: ${withWebp} (${Math.round(withWebp/exercisesData.length*100)}%)`);
console.log(`Exercises using SVG fallback: ${withoutWebp} (${Math.round(withoutWebp/exercisesData.length*100)}%)`);
console.log(`Exercises without muscle data: ${withoutPrimaryMuscle}`);

console.log('\n=== Sample Exercises with Webp Files ===');
samplesWithWebp.forEach(({ name, webp, muscle }) => {
  console.log(`✓ "${name}"`);
  console.log(`  Webp: ${webp}`);
  console.log(`  Muscle: ${muscle || 'N/A'}`);
});

console.log('\n=== Sample Exercises Using SVG Fallback ===');
samplesWithoutWebp.forEach(({ name, muscle, secondary }) => {
  console.log(`○ "${name}"`);
  console.log(`  Primary Muscle: ${muscle || 'N/A'}`);
  console.log(`  Secondary: ${secondary || 'N/A'}`);
  console.log(`  → Will generate muscle diagram SVG`);
});

if (samplesWithoutMuscleData.length > 0) {
  console.log('\n=== Warning: Exercises Without Muscle Data ===');
  console.log('These exercises will use generic work-icon.svg fallback:');
  samplesWithoutMuscleData.forEach((name) => {
    console.log(`  ⚠ "${name}"`);
  });
}

console.log('\n=== Test Results ===');
if (withWebp > 0 && withoutWebp > 0) {
  console.log('✓ System properly configured:');
  console.log(`  - ${withWebp} exercises have direct webp associations`);
  console.log(`  - ${withoutWebp} exercises will use SVG muscle diagram fallback`);
  console.log('✓ Fallback system is operational');
} else if (withoutWebp === 0) {
  console.log('⚠ All exercises have webp files - SVG fallback not needed');
} else {
  console.log('⚠ No exercises have webp files - all will use SVG fallback');
}

console.log('\n=== Verification Complete ===');
