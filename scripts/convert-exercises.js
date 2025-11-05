#!/usr/bin/env node
/**
 * Convert exercises from CSV to JSON format
 * This script reads goodlift-exerciselist.csv and generates exercises.json
 * Ensures backward compatibility with existing data structure
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Papa from 'papaparse';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CSV_PATH = path.join(__dirname, '../public/data/goodlift-exerciselist.csv');
const JSON_OUTPUT_PATH = path.join(__dirname, '../public/data/exercises.json');
const DOCS_JSON_OUTPUT_PATH = path.join(__dirname, '../docs/data/exercises.json');

/**
 * Convert CSV data to JSON format matching the expected structure
 * @param {Array} csvData - Parsed CSV data
 * @returns {Array} Array of exercise objects
 */
function convertToJSON(csvData) {
  const exercises = [];
  
  for (const row of csvData) {
    // Skip empty rows (all fields are empty or whitespace)
    const hasContent = Object.values(row).some(val => val && val.trim());
    if (!hasContent) {
      continue;
    }
    
    // Skip rows where Exercise_Name is empty
    const exerciseName = row.Exercise_Name?.trim();
    if (!exerciseName) {
      continue;
    }
    
    // Map CSV columns to JSON structure
    const exercise = {
      "Exercise Name": exerciseName,
      "Primary Muscle": row.Primary_Muscle?.trim() || '',
      "Secondary Muscles": row.Secondary_Muscles?.trim() || '',
      "Exercise Type": row.Exercise_Type?.trim() || '',
      "Equipment": row.Equipment?.trim() || '',
      "YouTube_Demonstration_Link": row.YouTube_Link?.trim() || ''
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
    console.log('Starting CSV to JSON conversion...');
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
      skipEmptyLines: false, // We'll handle empty lines manually
      transformHeader: (header) => {
        // Normalize header names to match expected format
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
    console.log(`Converted ${exercises.length} exercises (filtered empty rows)`);
    
    // Validate exercises
    if (exercises.length === 0) {
      throw new Error('No exercises found after conversion. Check CSV format.');
    }
    
    // Sort exercises alphabetically by name for consistency
    exercises.sort((a, b) => 
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
      JSON.stringify(exercises, null, 2),
      'utf-8'
    );
    console.log(`✓ Successfully wrote ${exercises.length} exercises to: ${JSON_OUTPUT_PATH}`);
    
    // Also write to docs/data/exercises.json for production build
    const docsDir = path.dirname(DOCS_JSON_OUTPUT_PATH);
    if (!fs.existsSync(docsDir)) {
      fs.mkdirSync(docsDir, { recursive: true });
    }
    
    fs.writeFileSync(
      DOCS_JSON_OUTPUT_PATH,
      JSON.stringify(exercises, null, 2),
      'utf-8'
    );
    console.log(`✓ Successfully wrote ${exercises.length} exercises to: ${DOCS_JSON_OUTPUT_PATH}`);
    
    // Display sample exercises
    console.log('\nSample exercises (first 3):');
    exercises.slice(0, 3).forEach(ex => {
      console.log(`  - ${ex["Exercise Name"]} (${ex["Primary Muscle"]})`);
    });
    
    console.log('\n✓ Conversion completed successfully!');
    return exercises;
  } catch (error) {
    console.error('❌ Error during conversion:');
    console.error(error.message);
    process.exit(1);
  }
}

// Run conversion
convertExercises();
