#!/usr/bin/env node
/**
 * Merge cable-exercise.csv into exercises.json
 * This script reads cable-exercise.csv and adds the exercises to exercises.json
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Papa from 'papaparse';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CABLE_CSV_PATH = path.join(__dirname, '../public/data/cable-exercise.csv');
const JSON_PATH = path.join(__dirname, '../public/data/exercises.json');
const DOCS_JSON_PATH = path.join(__dirname, '../docs/data/exercises.json');

/**
 * Convert cable CSV data to JSON format matching exercises.json structure
 * @param {Array} csvData - Parsed CSV data from cable-exercise.csv
 * @returns {Array} Array of exercise objects
 */
function convertCableCSVToJSON(csvData) {
  const exercises = [];
  
  for (const row of csvData) {
    // Skip empty rows
    const hasContent = Object.values(row).some(val => val && val.trim());
    if (!hasContent) {
      continue;
    }
    
    // Skip rows where Exercise Name is empty
    const exerciseName = row['Exercise Name']?.trim();
    if (!exerciseName) {
      continue;
    }
    
    // Map CSV columns to JSON structure matching exercises.json format
    const exercise = {
      "Exercise Name": exerciseName,
      "Primary Muscle": row['Primary Muscle']?.trim() || '',
      "Secondary Muscles": row['Secondary Muscles']?.trim() || '',
      "Exercise Type": row['Exercise Type']?.trim() || '',
      "Equipment": row['Equipment']?.trim() || '',
      "Difficulty": row['Difficulty']?.trim() || '',
      "Movement Pattern": row['Movement Pattern']?.trim() || '',
      "Rep Range": '', // Not in cable CSV, but present in exercises.json
      "Superset Type": row['Superset Type']?.trim() || '',
      "Workout Type": row['Workout Type']?.trim() || '',
      "Progression": row['Progression']?.trim() || ''
    };
    
    exercises.push(exercise);
  }
  
  return exercises;
}

/**
 * Main execution function
 */
function main() {
  try {
    console.log('Reading cable-exercise.csv...');
    const cableCSV = fs.readFileSync(CABLE_CSV_PATH, 'utf8');
    
    console.log('Parsing cable CSV...');
    const { data: cableData } = Papa.parse(cableCSV, {
      header: true,
      skipEmptyLines: true
    });
    
    console.log(`Found ${cableData.length} rows in cable CSV`);
    
    console.log('Converting cable exercises to JSON format...');
    const cableExercises = convertCableCSVToJSON(cableData);
    console.log(`Converted ${cableExercises.length} cable exercises`);
    
    // Read existing exercises.json
    console.log('Reading existing exercises.json...');
    const existingJSON = JSON.parse(fs.readFileSync(JSON_PATH, 'utf8'));
    console.log(`Found ${existingJSON.length} existing exercises`);
    
    // Check for duplicates
    const existingNames = new Set(existingJSON.map(ex => ex['Exercise Name']));
    const newExercises = cableExercises.filter(ex => !existingNames.has(ex['Exercise Name']));
    const duplicates = cableExercises.filter(ex => existingNames.has(ex['Exercise Name']));
    
    if (duplicates.length > 0) {
      console.log(`\nWarning: Found ${duplicates.length} duplicate exercises (will not be added):`);
      duplicates.forEach(ex => console.log(`  - ${ex['Exercise Name']}`));
    }
    
    if (newExercises.length === 0) {
      console.log('\nNo new exercises to add. All cable exercises already exist in exercises.json');
      return;
    }
    
    console.log(`\nAdding ${newExercises.length} new cable exercises:`);
    newExercises.forEach(ex => console.log(`  - ${ex['Exercise Name']}`));
    
    // Merge exercises
    const mergedExercises = [...existingJSON, ...newExercises];
    
    // Sort alphabetically by Exercise Name
    mergedExercises.sort((a, b) => 
      a['Exercise Name'].localeCompare(b['Exercise Name'])
    );
    
    console.log(`\nTotal exercises after merge: ${mergedExercises.length}`);
    
    // Write to public/data/exercises.json
    console.log(`Writing to ${JSON_PATH}...`);
    fs.writeFileSync(
      JSON_PATH,
      JSON.stringify(mergedExercises, null, 2) + '\n',
      'utf8'
    );
    
    // Write to docs/data/exercises.json
    console.log(`Writing to ${DOCS_JSON_PATH}...`);
    fs.writeFileSync(
      DOCS_JSON_PATH,
      JSON.stringify(mergedExercises, null, 2) + '\n',
      'utf8'
    );
    
    console.log('\n✅ Cable exercises successfully merged into exercises.json!');
    console.log(`   Added ${newExercises.length} new exercises`);
    console.log(`   Total exercises: ${mergedExercises.length}`);
    
  } catch (error) {
    console.error('❌ Error merging cable exercises:', error.message);
    process.exit(1);
  }
}

// Run the script
main();
