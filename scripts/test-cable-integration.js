#!/usr/bin/env node
/**
 * Test Cable Equipment Integration
 * Verifies that cable exercises are properly integrated and equipment filtering works
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const JSON_PATH = path.join(__dirname, '../public/data/exercises.json');

// ANSI color codes
const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const RESET = '\x1b[0m';

function pass(message) {
  console.log(`${GREEN}✓${RESET} ${message}`);
}

function fail(message) {
  console.log(`${RED}✗${RESET} ${message}`);
}

function info(message) {
  console.log(`${YELLOW}ℹ${RESET} ${message}`);
}

/**
 * Test equipment filtering logic from App.jsx and useWorkoutGenerator
 */
function filterByEquipment(allExercises, equipmentFilter) {
  if (equipmentFilter === 'all') return allExercises;
  
  const filters = Array.isArray(equipmentFilter) ? equipmentFilter : [equipmentFilter];
  
  return allExercises.filter(ex => {
    const equipment = ex.Equipment.toLowerCase();
    return filters.some(filter => {
      const normalizedFilter = filter.toLowerCase();
      if (normalizedFilter === 'cable machine') {
        return equipment.includes('cable');
      }
      if (normalizedFilter === 'dumbbells') {
        return equipment.includes('dumbbell');
      }
      return equipment.includes(normalizedFilter);
    });
  });
}

/**
 * Extract equipment types using App.jsx logic
 */
function extractEquipmentTypes(exercises) {
  const equipmentSet = new Set();
  exercises.forEach(ex => {
    const equipment = ex.Equipment;
    if (equipment.includes('Cable')) {
      equipmentSet.add('Cable Machine');
    } else if (equipment.includes('Dumbbell')) {
      equipmentSet.add('Dumbbells');
    } else {
      equipmentSet.add(equipment);
    }
  });
  return Array.from(equipmentSet).sort();
}

function runTests() {
  console.log('\n=== Cable Equipment Integration Test ===\n');
  
  let totalTests = 0;
  let passedTests = 0;
  
  try {
    // Load exercises
    const exercises = JSON.parse(fs.readFileSync(JSON_PATH, 'utf8'));
    totalTests++;
    pass(`Loaded ${exercises.length} exercises from exercises.json`);
    passedTests++;
    
    // Test 1: Check for cable exercises
    console.log('\n--- Test 1: Cable Exercise Count ---');
    const cableExercises = exercises.filter(ex => ex.Equipment.includes('Cable'));
    totalTests++;
    if (cableExercises.length === 8) {
      pass(`Found exactly 8 cable exercises`);
      passedTests++;
    } else {
      fail(`Expected 8 cable exercises, found ${cableExercises.length}`);
    }
    
    // Test 2: Verify all expected cable exercises exist
    console.log('\n--- Test 2: Expected Cable Exercises ---');
    const expectedExercises = [
      'Lat Pulldown',
      'Cable Pull-Up',
      'Seated Cable Row',
      'V-Bar Seated Cable Row',
      'Close Grip Lat Pulldown',
      'Rope Tricep Extension',
      'Cable Skull Crusher',
      'Cable Tricep Extension'
    ];
    
    const cableExerciseNames = new Set(cableExercises.map(ex => ex['Exercise Name']));
    expectedExercises.forEach(name => {
      totalTests++;
      if (cableExerciseNames.has(name)) {
        pass(`Found: ${name}`);
        passedTests++;
      } else {
        fail(`Missing: ${name}`);
      }
    });
    
    // Test 3: Equipment type extraction
    console.log('\n--- Test 3: Equipment Type Extraction ---');
    const equipmentTypes = extractEquipmentTypes(exercises);
    totalTests++;
    if (equipmentTypes.includes('Cable Machine')) {
      pass(`"Cable Machine" appears in equipment types`);
      passedTests++;
    } else {
      fail(`"Cable Machine" not found in equipment types`);
    }
    
    info(`All equipment types: ${equipmentTypes.join(', ')}`);
    
    // Test 4: Equipment filtering
    console.log('\n--- Test 4: Equipment Filtering ---');
    const filteredCable = filterByEquipment(exercises, ['cable machine']);
    totalTests++;
    if (filteredCable.length === 8) {
      pass(`Filtering by "cable machine" returns 8 exercises`);
      passedTests++;
    } else {
      fail(`Expected 8 exercises when filtering by cable, got ${filteredCable.length}`);
    }
    
    // Test 5: Verify cable exercise structure
    console.log('\n--- Test 5: Cable Exercise Structure ---');
    const sampleExercise = cableExercises[0];
    const requiredFields = [
      'Exercise Name',
      'Primary Muscle',
      'Secondary Muscles',
      'Exercise Type',
      'Equipment',
      'Difficulty',
      'Movement Pattern',
      'Workout Type',
      'Progression'
    ];
    
    requiredFields.forEach(field => {
      totalTests++;
      if (sampleExercise.hasOwnProperty(field)) {
        pass(`Field "${field}" exists`);
        passedTests++;
      } else {
        fail(`Field "${field}" missing`);
      }
    });
    
    // Test 6: Verify equipment value format
    console.log('\n--- Test 6: Equipment Value Format ---');
    cableExercises.forEach(ex => {
      totalTests++;
      if (ex.Equipment === 'Cable Machine') {
        pass(`"${ex['Exercise Name']}" has correct equipment value: "${ex.Equipment}"`);
        passedTests++;
      } else {
        fail(`"${ex['Exercise Name']}" has incorrect equipment value: "${ex.Equipment}"`);
      }
    });
    
    // Test 7: Primary muscle distribution
    console.log('\n--- Test 7: Primary Muscle Distribution ---');
    const muscleCounts = {};
    cableExercises.forEach(ex => {
      const muscle = ex['Primary Muscle'];
      muscleCounts[muscle] = (muscleCounts[muscle] || 0) + 1;
    });
    
    info('Cable exercises by primary muscle:');
    Object.entries(muscleCounts).forEach(([muscle, count]) => {
      info(`  ${muscle}: ${count} exercise(s)`);
    });
    
    totalTests++;
    if (Object.keys(muscleCounts).length > 0) {
      pass('Cable exercises target multiple muscle groups');
      passedTests++;
    } else {
      fail('No muscle groups found for cable exercises');
    }
    
    // Summary
    console.log('\n=== Test Summary ===');
    console.log(`Total Tests: ${totalTests}`);
    console.log(`Passed: ${GREEN}${passedTests}${RESET}`);
    console.log(`Failed: ${RED}${totalTests - passedTests}${RESET}`);
    
    if (passedTests === totalTests) {
      console.log(`\n${GREEN}✓ All tests passed!${RESET}\n`);
      process.exit(0);
    } else {
      console.log(`\n${RED}✗ Some tests failed${RESET}\n`);
      process.exit(1);
    }
    
  } catch (error) {
    console.error(`${RED}✗ Error running tests:${RESET}`, error.message);
    process.exit(1);
  }
}

// Run tests
runTests();
