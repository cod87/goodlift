import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Papa from 'papaparse';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Paths
const EXERCISES_JSON_PATH = path.join(__dirname, '../public/data/exercises.json');
const NEW_EXERCISES_CSV_PATH = path.join(__dirname, '../public/data/possible-new-exercises.csv');

/**
 * Parse CSV file and return exercises
 */
function parseExercisesCSV(csvPath) {
  const csvContent = fs.readFileSync(csvPath, 'utf-8');
  const result = Papa.parse(csvContent, {
    header: true,
    skipEmptyLines: true,
  });
  
  return result.data;
}

/**
 * Normalize exercise name for comparison (lowercase, trim, remove special chars)
 */
function normalizeExerciseName(name) {
  return name.toLowerCase().trim().replace(/[^a-z0-9\s]/g, '');
}

/**
 * Check if exercise already exists in the database
 */
function exerciseExists(exerciseName, existingExercises) {
  const normalizedName = normalizeExerciseName(exerciseName);
  return existingExercises.some(ex => 
    normalizeExerciseName(ex['Exercise Name']) === normalizedName
  );
}

/**
 * Merge new exercises into existing exercises JSON
 */
function mergeExercises() {
  console.log('Starting exercise merge...\n');
  
  // Load existing exercises
  const existingExercises = JSON.parse(fs.readFileSync(EXERCISES_JSON_PATH, 'utf-8'));
  console.log(`Loaded ${existingExercises.length} existing exercises`);
  
  // Parse new exercises
  const newExercises = parseExercisesCSV(NEW_EXERCISES_CSV_PATH);
  console.log(`Parsed ${newExercises.length} new exercises from CSV`);
  
  // Filter out duplicates
  const uniqueNewExercises = newExercises.filter(exercise => {
    const exists = exerciseExists(exercise['Exercise Name'], existingExercises);
    if (exists) {
      console.log(`  - Skipping duplicate: ${exercise['Exercise Name']}`);
    }
    return !exists;
  });
  
  console.log(`\nFound ${uniqueNewExercises.length} unique new exercises to add`);
  
  // Merge exercises
  const mergedExercises = [...existingExercises, ...uniqueNewExercises];
  
  // Sort by exercise name
  mergedExercises.sort((a, b) => 
    a['Exercise Name'].localeCompare(b['Exercise Name'])
  );
  
  // Write back to file
  fs.writeFileSync(
    EXERCISES_JSON_PATH,
    JSON.stringify(mergedExercises, null, 2)
  );
  
  console.log(`\n✓ Successfully merged exercises!`);
  console.log(`  Total exercises: ${mergedExercises.length}`);
  console.log(`  New exercises added: ${uniqueNewExercises.length}`);
  
  // List new exercises added
  if (uniqueNewExercises.length > 0) {
    console.log('\nNew exercises added:');
    uniqueNewExercises.forEach(ex => {
      console.log(`  - ${ex['Exercise Name']} (${ex['Primary Muscle']})`);
    });
  }
}

// Run the merge
try {
  mergeExercises();
} catch (error) {
  console.error('Error merging exercises:', error);
  process.exit(1);
}
