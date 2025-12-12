#!/usr/bin/env node

/**
 * Script to update exercises.json with new muscle data from update.json
 * Preserves all existing fields and structure, only updates Primary Muscle and Secondary Muscles
 */

const fs = require('fs');
const path = require('path');

const UPDATE_JSON_PATH = path.join(__dirname, '../public/data/update.json');
const EXERCISES_JSON_PATH = path.join(__dirname, '../public/data/exercises.json');

// Read both files
const updateData = JSON.parse(fs.readFileSync(UPDATE_JSON_PATH, 'utf8'));
const exercisesData = JSON.parse(fs.readFileSync(EXERCISES_JSON_PATH, 'utf8'));

console.log(`Loaded ${updateData.length} exercises from update.json`);
console.log(`Loaded ${exercisesData.length} exercises from exercises.json`);

// Create a map from exercise name to muscle data
const muscleDataMap = new Map();
updateData.forEach(exercise => {
  const name = exercise['Exercise Name'];
  muscleDataMap.set(name, {
    primaryMuscle: exercise['Primary Muscle'],
    secondaryMuscles: exercise['Secondary Muscles']
  });
});

// Update exercises.json with new muscle data
let updateCount = 0;
let notFoundCount = 0;

const updatedExercises = exercisesData.map(exercise => {
  const name = exercise['Exercise Name'];
  const muscleData = muscleDataMap.get(name);
  
  if (muscleData) {
    updateCount++;
    return {
      ...exercise,
      'Primary Muscle': muscleData.primaryMuscle,
      'Secondary Muscles': muscleData.secondaryMuscles
    };
  } else {
    notFoundCount++;
    console.warn(`Warning: No muscle data found for "${name}"`);
    return exercise;
  }
});

// Write updated data back to exercises.json
fs.writeFileSync(
  EXERCISES_JSON_PATH,
  JSON.stringify(updatedExercises, null, 2) + '\n',
  'utf8'
);

console.log(`\nUpdate complete:`);
console.log(`- ${updateCount} exercises updated`);
console.log(`- ${notFoundCount} exercises not found in update.json`);
console.log(`- Updated file saved to: ${EXERCISES_JSON_PATH}`);
