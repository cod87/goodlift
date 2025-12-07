#!/usr/bin/env node
/**
 * Migrate Exercise Names from "Equipment Exercise" to "Exercise, Equipment" format
 * 
 * This script:
 * 1. Converts exercise names in the CSV source file
 * 2. Regenerates JSON files
 * 3. Creates a mapping file for data migration
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Papa from 'papaparse';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CSV_PATH = path.join(__dirname, '../public/data/exercise-expanded.csv');
const MAPPING_OUTPUT_PATH = path.join(__dirname, '../public/data/exercise-name-mapping.json');

// Equipment types that appear as prefixes in exercise names
const EQUIPMENT_PREFIXES = [
  'Barbell',
  'Dumbbell', 
  'Kettlebell',
  'Landmine',
  'Slam Ball'
];

/**
 * Convert exercise name from "Equipment Exercise" to "Exercise, Equipment"
 * @param {string} name - Original exercise name
 * @param {string} equipment - Equipment type from CSV
 * @returns {string} Converted exercise name
 */
function convertExerciseName(name, equipment) {
  // Check if the name starts with the equipment prefix
  for (const prefix of EQUIPMENT_PREFIXES) {
    if (name.startsWith(prefix + ' ')) {
      // Remove the equipment prefix and add it as a suffix
      const exerciseName = name.substring(prefix.length + 1);
      return `${exerciseName}, ${prefix}`;
    }
  }
  
  // No conversion needed
  return name;
}

/**
 * Main migration function
 */
async function migrateExerciseNames() {
  try {
    console.log('Starting exercise name migration...');
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
      transformHeader: (header) => header.trim()
    });
    
    if (parseResult.errors.length > 0) {
      console.warn('CSV parsing warnings:');
      parseResult.errors.forEach(err => console.warn(`  - ${err.message}`));
    }
    
    console.log(`Parsed ${parseResult.data.length} rows from CSV`);
    
    // Create name mapping
    const nameMapping = {};
    let convertedCount = 0;
    
    // Convert exercise names
    const updatedData = parseResult.data.map(row => {
      const oldName = row['Exercise Name']?.trim();
      const equipment = row['Equipment']?.trim();
      
      if (!oldName) return row;
      
      const newName = convertExerciseName(oldName, equipment);
      
      if (newName !== oldName) {
        nameMapping[oldName] = newName;
        convertedCount++;
        console.log(`  ✓ ${oldName} → ${newName}`);
      }
      
      return {
        ...row,
        'Exercise Name': newName
      };
    });
    
    console.log(`\nConverted ${convertedCount} exercise names`);
    
    // Write updated CSV
    const updatedCsv = Papa.unparse(updatedData, {
      header: true,
      columns: Object.keys(parseResult.data[0])
    });
    
    fs.writeFileSync(CSV_PATH, updatedCsv, 'utf-8');
    console.log(`✓ Updated CSV file: ${CSV_PATH}`);
    
    // Write mapping file for data migration
    fs.writeFileSync(
      MAPPING_OUTPUT_PATH,
      JSON.stringify(nameMapping, null, 2),
      'utf-8'
    );
    console.log(`✓ Created mapping file: ${MAPPING_OUTPUT_PATH}`);
    console.log(`  Mapping contains ${Object.keys(nameMapping).length} name conversions`);
    
    console.log('\n✓ Exercise name migration completed successfully!');
    console.log('\nNext steps:');
    console.log('  1. Run: npm run convert:exercises');
    console.log('  2. Run: node scripts/migrate-user-data.js');
    
    return nameMapping;
  } catch (error) {
    console.error('❌ Error during migration:');
    console.error(error.message);
    process.exit(1);
  }
}

// Run migration
migrateExerciseNames();
