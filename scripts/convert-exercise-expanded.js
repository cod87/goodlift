#!/usr/bin/env node
/**
 * Convert exercise-expanded.csv to exercises.json format
 * This script reads exercise-expanded.csv and generates exercises.json with all fields
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Papa from 'papaparse';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CSV_PATH = path.join(__dirname, '../public/data/exercise-expanded.csv');
const JSON_OUTPUT_PATH = path.join(__dirname, '../public/data/exercises.json');
const DOCS_JSON_OUTPUT_PATH = path.join(__dirname, '../docs/data/exercises.json');

/**
 * Convert CSV data to JSON format with all expanded fields
 * @param {Array} csvData - Parsed CSV data
 * @returns {Array} Array of exercise objects
 */
function convertToJSON(csvData) {
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
    
    // Map CSV columns to JSON structure - preserve all fields from expanded CSV
    const exercise = {
      "Exercise Name": exerciseName,
      "Primary Muscle": row['Primary Muscle']?.trim() || '',
      "Secondary Muscles": row['Secondary Muscles']?.trim() || '',
      "Exercise Type": row['Exercise Type']?.trim() || '',
      "Equipment": row['Equipment']?.trim() || '',
      "Difficulty": row['Difficulty']?.trim() || '',
      "Movement Pattern": row['Movement Pattern']?.trim() || '',
      "Rep Range": row['Rep Range']?.trim() || '',
      "Superset Type": row['Superset Type']?.trim() || '',
      "HIIT Compatible": row['HIIT Compatible']?.trim() || '',
      "Workout Type": row['Workout Type']?.trim() || '',
      "Progression": row['Progression']?.trim() || ''
    };
    
    exercises.push(exercise);
  }
  
  return exercises;
}

/**
 * Main conversion function
 */
async function convertExercises() {
  try {
    console.log('Starting exercise-expanded.csv to JSON conversion...');
    console.log(`Reading CSV from: ${CSV_PATH}`);
    
    // Check if CSV file exists
    if (!fs.existsSync(CSV_PATH)) {
      throw new Error(`CSV file not found at: ${CSV_PATH}`);
    }
    
    // Read CSV file
    const csvContent = fs.readFileSync(CSV_PATH, 'utf-8');
    
    // Parse CSV
    const parseResult = Papa.parse(csvContent, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => {
        return header.trim();
      }
    });
    
    if (parseResult.errors.length > 0) {
      console.warn('CSV parsing warnings:');
      parseResult.errors.forEach(err => console.warn(`  - ${err.message}`));
    }
    
    console.log(`Parsed ${parseResult.data.length} rows from CSV`);
    
    // Convert to JSON format
    const exercises = convertToJSON(parseResult.data);
    console.log(`Converted ${exercises.length} exercises`);
    
    // Remove duplicates by exercise name (keep first occurrence)
    const uniqueExercises = [];
    const seenNames = new Set();
    for (const exercise of exercises) {
      const name = exercise["Exercise Name"];
      if (!seenNames.has(name)) {
        seenNames.add(name);
        uniqueExercises.push(exercise);
      } else {
        console.warn(`  Skipping duplicate: ${name}`);
      }
    }
    console.log(`Removed ${exercises.length - uniqueExercises.length} duplicate(s), ${uniqueExercises.length} unique exercises`);
    
    // Validate exercises
    if (uniqueExercises.length === 0) {
      throw new Error('No exercises found after conversion. Check CSV format.');
    }
    
    // Sort exercises alphabetically by name for consistency
    uniqueExercises.sort((a, b) => 
      a["Exercise Name"].localeCompare(b["Exercise Name"])
    );
    
    // Ensure output directory exists
    const outputDir = path.dirname(JSON_OUTPUT_PATH);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    // Write JSON to public/data/exercises.json
    fs.writeFileSync(
      JSON_OUTPUT_PATH,
      JSON.stringify(uniqueExercises, null, 2),
      'utf-8'
    );
    console.log(`✓ Successfully wrote ${uniqueExercises.length} exercises to: ${JSON_OUTPUT_PATH}`);
    
    // Also write to docs/data/exercises.json for production build
    const docsDir = path.dirname(DOCS_JSON_OUTPUT_PATH);
    if (!fs.existsSync(docsDir)) {
      fs.mkdirSync(docsDir, { recursive: true });
    }
    
    fs.writeFileSync(
      DOCS_JSON_OUTPUT_PATH,
      JSON.stringify(uniqueExercises, null, 2),
      'utf-8'
    );
    console.log(`✓ Successfully wrote ${uniqueExercises.length} exercises to: ${DOCS_JSON_OUTPUT_PATH}`);
    
    // Display sample exercises
    console.log('\nSample exercises (first 3):');
    uniqueExercises.slice(0, 3).forEach(ex => {
      console.log(`  - ${ex["Exercise Name"]} (${ex["Primary Muscle"]}, ${ex["Workout Type"]})`);
    });
    
    console.log('\n✓ Conversion completed successfully!');
    return uniqueExercises;
  } catch (error) {
    console.error('❌ Error during conversion:');
    console.error(error.message);
    process.exit(1);
  }
}

// Run conversion
convertExercises();
