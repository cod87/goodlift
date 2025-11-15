#!/usr/bin/env node
/**
 * Convert hiit-exercises.csv to hiit-exercises.json format
 * This script reads hiit-exercises.csv and generates hiit-exercises.json
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Papa from 'papaparse';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CSV_PATH = path.join(__dirname, '../public/data/hiit-exercises.csv');
const JSON_OUTPUT_PATH = path.join(__dirname, '../public/data/hiit-exercises.json');
const DOCS_JSON_OUTPUT_PATH = path.join(__dirname, '../docs/data/hiit-exercises.json');

/**
 * Convert CSV data to JSON format
 * @param {Array} csvData - Parsed CSV data
 * @returns {Array} Array of HIIT exercise objects
 */
function convertToJSON(csvData) {
  const exercises = [];
  
  for (const row of csvData) {
    // Skip empty rows
    const hasContent = Object.values(row).some(val => val && val.trim());
    if (!hasContent) {
      continue;
    }
    
    // Skip rows where Exercise is empty
    const exerciseName = row['Exercise']?.trim();
    if (!exerciseName) {
      continue;
    }
    
    // Map CSV columns to JSON structure
    const exercise = {
      "name": exerciseName,
      "muscleGroup": row['Muscle Group']?.trim() || ''
    };
    
    exercises.push(exercise);
  }
  
  return exercises;
}

/**
 * Main conversion function
 */
async function convertHiitExercises() {
  try {
    console.log('Starting hiit-exercises.csv to JSON conversion...');
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
      const name = exercise.name;
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
      a.name.localeCompare(b.name)
    );
    
    // Ensure output directory exists
    const outputDir = path.dirname(JSON_OUTPUT_PATH);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    // Write JSON to public/data/hiit-exercises.json
    fs.writeFileSync(
      JSON_OUTPUT_PATH,
      JSON.stringify(uniqueExercises, null, 2),
      'utf-8'
    );
    console.log(`✓ Successfully wrote ${uniqueExercises.length} exercises to: ${JSON_OUTPUT_PATH}`);
    
    // Also write to docs/data/hiit-exercises.json for production build
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
    console.log('\nSample exercises (first 5):');
    uniqueExercises.slice(0, 5).forEach(ex => {
      console.log(`  - ${ex.name} (${ex.muscleGroup})`);
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
convertHiitExercises();
