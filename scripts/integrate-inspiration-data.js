/**
 * Integration script for inspiration files
 * Parses workout CSVs and adds missing exercises to exercises.json
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// File paths
const EXERCISES_JSON_PATH = path.join(__dirname, '../public/data/exercises.json');
const POSSIBLE_EXERCISES_CSV_PATH = path.join(__dirname, '../public/data/inspiration/possible-new-exercises1.csv');
const WORKOUTS_CSV_PATH = path.join(__dirname, '../public/data/inspiration/workouts.csv');

// Helper to parse CSV
function parseCSV(csvContent) {
  const lines = csvContent.split('\n').filter(line => line.trim());
  const headers = lines[0].split(',').map(h => h.trim());
  
  return lines.slice(1).map(line => {
    const values = line.split(',').map(v => v.trim());
    const obj = {};
    headers.forEach((header, index) => {
      obj[header] = values[index] || '';
    });
    return obj;
  });
}

// Map muscle group names to standardized names
function mapMuscleGroup(muscleGroup) {
  const mappings = {
    'Upper Body - Chest': 'Chest',
    'Upper Body - Back': 'Lats',
    'Upper Body - Shoulders': 'Shoulders',
    'Upper Body - Biceps': 'Biceps',
    'Upper Body - Triceps': 'Triceps',
    'Lower Body - Quads': 'Quads',
    'Lower Body - Hamstrings': 'Hamstrings',
    'Lower Body - Glutes': 'Glutes',
    'Lower Body - Calves': 'Calves',
    'Lower Body - Quads/Glutes': 'Quads',
    'Core - Abs': 'Abs',
    'Core - Obliques': 'Obliques',
    'Core - Lower Abs': 'Abs',
    'Core - Full Body': 'Abs',
    'Core - Hip Flexors': 'Abs',
    'Core': 'Abs',
    'Lower Body - Explosive': 'Quads'
  };
  
  return mappings[muscleGroup] || muscleGroup;
}

// Determine equipment from exercise name and type
function determineEquipment(exerciseName, muscleGroup) {
  const name = exerciseName.toLowerCase();
  
  if (name.includes('barbell')) return 'Barbell';
  if (name.includes('dumbbell')) return 'Dumbbells';
  if (name.includes('cable') || name.includes('rope')) return 'Cable Machine';
  if (name.includes('ez bar')) return 'Barbell';
  if (name.includes('plate ')) return 'Plates';
  if (name.includes('machine') || name.includes('pec deck')) return 'Machine';
  if (name.includes('leg press')) return 'Machine';
  if (name.includes('leg curl')) return 'Machine';
  
  // Core exercises are typically bodyweight
  if (muscleGroup.includes('Core') || muscleGroup.includes('Abs')) {
    return 'Bodyweight';
  }
  
  // Default to bodyweight for plyometric and many lower body exercises
  if (name.includes('jump') || name.includes('hop') || name.includes('bound')) {
    return 'Bodyweight';
  }
  
  return 'Bodyweight';
}

// Generate YouTube search link
function generateYouTubeLink(exerciseName) {
  const searchQuery = exerciseName.replace(/\s+/g, '+');
  return `https://www.youtube.com/results?search_query=${searchQuery}+exercise+demonstration`;
}

async function main() {
  console.log('Starting data integration...\n');
  
  // Read existing exercises
  const existingExercises = JSON.parse(fs.readFileSync(EXERCISES_JSON_PATH, 'utf8'));
  const exerciseNames = new Set(existingExercises.map(ex => ex['Exercise Name'].toLowerCase()));
  
  console.log(`Found ${existingExercises.length} existing exercises`);
  
  // Parse CSVs
  const possibleExercisesCSV = fs.readFileSync(POSSIBLE_EXERCISES_CSV_PATH, 'utf8');
  const workoutsCSV = fs.readFileSync(WORKOUTS_CSV_PATH, 'utf8');
  
  const possibleExercises = parseCSV(possibleExercisesCSV);
  const workouts = parseCSV(workoutsCSV);
  
  console.log(`Found ${possibleExercises.length} exercises in possible-new-exercises1.csv`);
  console.log(`Found ${workouts.length} exercises in workouts.csv`);
  
  // Collect all exercises from both CSVs
  const allCSVExercises = [...possibleExercises, ...workouts];
  
  // Extract unique new exercises
  const newExercises = [];
  const seenNames = new Set();
  
  for (const row of allCSVExercises) {
    const name = row['Exercise Name'];
    if (!name || seenNames.has(name.toLowerCase())) continue;
    
    seenNames.add(name.toLowerCase());
    
    // Skip if already exists in exercises.json
    if (exerciseNames.has(name.toLowerCase())) {
      continue;
    }
    
    const muscleGroup = row['Muscle Group'] || '';
    const primaryMuscle = mapMuscleGroup(muscleGroup);
    const exerciseType = row.Type === 'Isolation' ? 'Isolation' : 'Compound';
    const equipment = determineEquipment(name, muscleGroup);
    
    newExercises.push({
      'Exercise Name': name,
      'Primary Muscle': primaryMuscle,
      'Secondary Muscles': '', // Will need manual review
      'Exercise Type': exerciseType,
      'Equipment': equipment,
      'YouTube_Demonstration_Link': generateYouTubeLink(name)
    });
  }
  
  console.log(`\nFound ${newExercises.length} new exercises to add:`);
  newExercises.forEach(ex => {
    console.log(`  - ${ex['Exercise Name']} (${ex['Primary Muscle']}, ${ex.Equipment})`);
  });
  
  if (newExercises.length === 0) {
    console.log('\nNo new exercises to add. All exercises already exist.');
    return;
  }
  
  // Add new exercises and sort alphabetically
  const updatedExercises = [...existingExercises, ...newExercises];
  updatedExercises.sort((a, b) => 
    a['Exercise Name'].localeCompare(b['Exercise Name'])
  );
  
  // Write updated exercises.json
  fs.writeFileSync(
    EXERCISES_JSON_PATH,
    JSON.stringify(updatedExercises, null, 2),
    'utf8'
  );
  
  console.log(`\n✓ Successfully updated exercises.json`);
  console.log(`Total exercises: ${updatedExercises.length} (added ${newExercises.length})`);
}

main().catch(console.error);
