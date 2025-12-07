/**
 * Tests for exercise name migration
 * 
 * Verifies that:
 * 1. Exercise names have been migrated from old format to new format
 * 2. User data migration works correctly
 * 3. No references to old format remain in code
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('Exercise Name Migration', () => {
  let exerciseData;
  let exerciseNameMapping;
  
  beforeEach(() => {
    // Load the exercises.json file
    const exercisesPath = path.join(__dirname, '../public/data/exercises.json');
    const exercisesContent = fs.readFileSync(exercisesPath, 'utf-8');
    exerciseData = JSON.parse(exercisesContent);
    
    // Load the name mapping
    const mappingPath = path.join(__dirname, '../public/data/exercise-name-mapping.json');
    const mappingContent = fs.readFileSync(mappingPath, 'utf-8');
    exerciseNameMapping = JSON.parse(mappingContent);
  });
  
  describe('Exercise Data Format', () => {
    it('should have exercises in new format (Exercise, Equipment)', () => {
      const oldFormatExamples = [
        'Dumbbell Bench Press',
        'Barbell Squat',
        'Kettlebell Swing'
      ];
      
      // Check that old format names don't exist
      const exerciseNames = exerciseData.map(ex => ex['Exercise Name']);
      oldFormatExamples.forEach(oldName => {
        expect(exerciseNames).not.toContain(oldName);
      });
    });
    
    it('should have all equipment-prefixed exercises converted', () => {
      const equipmentPrefixes = ['Dumbbell ', 'Barbell ', 'Kettlebell ', 'Landmine ', 'Slam Ball '];
      
      const exercisesWithOldFormat = exerciseData.filter(ex => {
        const name = ex['Exercise Name'];
        return equipmentPrefixes.some(prefix => name.startsWith(prefix));
      });
      
      expect(exercisesWithOldFormat.length).toBe(0);
    });
    
    it('should have exercises with equipment suffix in correct format', () => {
      const newFormatExamples = [
        'Bench Press, Dumbbell',
        'Squat (High Bar), Barbell',
        'Swing, Kettlebell'
      ];
      
      const exerciseNames = exerciseData.map(ex => ex['Exercise Name']);
      newFormatExamples.forEach(newName => {
        expect(exerciseNames).toContain(newName);
      });
    });
  });
  
  describe('Name Mapping File', () => {
    it('should have a valid mapping file with conversions', () => {
      expect(exerciseNameMapping).toBeDefined();
      expect(Object.keys(exerciseNameMapping).length).toBeGreaterThan(0);
    });
    
    it('should have all old names mapped to new names', () => {
      Object.entries(exerciseNameMapping).forEach(([oldName, newName]) => {
        expect(oldName).toBeTruthy();
        expect(newName).toBeTruthy();
        expect(oldName).not.toBe(newName);
      });
    });
    
    it('should map old format to new format correctly', () => {
      // Check a few specific mappings
      expect(exerciseNameMapping['Dumbbell Bench Press']).toBe('Bench Press, Dumbbell');
      expect(exerciseNameMapping['Barbell Deadlift']).toBe('Deadlift, Barbell');
      expect(exerciseNameMapping['Kettlebell Swing']).toBe('Swing, Kettlebell');
    });
  });
  
  describe('Source Files', () => {
    it('should not have old format in workout templates', () => {
      const templatesPath = path.join(__dirname, '../src/data/workoutTemplates.js');
      const templatesContent = fs.readFileSync(templatesPath, 'utf-8');
      
      // Check for old format patterns in name fields
      const oldFormatPatterns = [
        /name:\s*['"]Dumbbell\s+[A-Z]/g,
        /name:\s*['"]Barbell\s+[A-Z]/g,
        /name:\s*['"]Kettlebell\s+[A-Z]/g
      ];
      
      oldFormatPatterns.forEach(pattern => {
        const matches = templatesContent.match(pattern);
        expect(matches).toBeNull();
      });
    });
    
    it('should not have old format in CSV source', () => {
      const csvPath = path.join(__dirname, '../public/data/exercise-expanded.csv');
      const csvContent = fs.readFileSync(csvPath, 'utf-8');
      
      // Split into lines and check each
      const lines = csvContent.split('\n');
      const dataLines = lines.slice(1); // Skip header
      
      dataLines.forEach((line, index) => {
        if (line.trim()) {
          const firstColumn = line.split(',')[0];
          
          // Check if it starts with equipment prefix
          const equipmentPrefixes = ['Dumbbell ', 'Barbell ', 'Kettlebell ', 'Landmine ', 'Slam Ball '];
          const hasOldFormat = equipmentPrefixes.some(prefix => firstColumn.startsWith(prefix));
          
          if (hasOldFormat) {
            throw new Error(`Line ${index + 2} has old format: ${firstColumn}`);
          }
        }
      });
    });
  });
});

// Test data migration functions if we're in a Node environment with the module available
describe('User Data Migration Functions', () => {
  it('should migrate exercise weights correctly', async () => {
    // Dynamic import for ESM module
    const { migrateExerciseWeights } = await import('../scripts/migrate-user-data.js');
    const mapping = {
      'Dumbbell Bench Press': 'Bench Press, Dumbbell',
      'Barbell Squat': 'Squat, Barbell'
    };
    
    const oldWeights = {
      'Dumbbell Bench Press': 50,
      'Barbell Squat': 185,
      'Pull-Up': 0 // No mapping for this
    };
    
    const { migratedWeights, migratedCount } = migrateExerciseWeights(oldWeights, mapping);
    
    expect(migratedWeights['Bench Press, Dumbbell']).toBe(50);
    expect(migratedWeights['Squat, Barbell']).toBe(185);
    expect(migratedWeights['Pull-Up']).toBe(0);
    expect(migratedCount).toBe(2);
  });
  
  it('should migrate exercise target reps correctly', async () => {
    const { migrateExerciseTargetReps } = await import('../scripts/migrate-user-data.js');
    const mapping = {
      'Dumbbell Bench Press': 'Bench Press, Dumbbell',
      'Barbell Squat': 'Squat, Barbell'
    };
    
    const oldReps = {
      'Dumbbell Bench Press': 10,
      'Barbell Squat': 5,
      'Pull-Up': 8
    };
    
    const { migratedReps, migratedCount } = migrateExerciseTargetReps(oldReps, mapping);
    
    expect(migratedReps['Bench Press, Dumbbell']).toBe(10);
    expect(migratedReps['Squat, Barbell']).toBe(5);
    expect(migratedReps['Pull-Up']).toBe(8);
    expect(migratedCount).toBe(2);
  });
  
  it('should migrate workout history correctly', async () => {
    const { migrateWorkoutHistory } = await import('../scripts/migrate-user-data.js');
    const mapping = {
      'Dumbbell Bench Press': 'Bench Press, Dumbbell'
    };
    
    const oldHistory = [
      {
        date: '2024-01-01',
        exercises: {
          'Dumbbell Bench Press': {
            sets: [{ weight: 50, reps: 10 }]
          },
          'Pull-Up': {
            sets: [{ weight: 0, reps: 8 }]
          }
        }
      }
    ];
    
    const { migratedHistory, migratedExerciseCount } = migrateWorkoutHistory(oldHistory, mapping);
    
    expect(migratedHistory[0].exercises['Bench Press, Dumbbell']).toBeDefined();
    expect(migratedHistory[0].exercises['Pull-Up']).toBeDefined();
    expect(migratedExerciseCount).toBe(1);
  });
  
  it('should migrate pinned exercises correctly', async () => {
    const { migratePinnedExercises } = await import('../scripts/migrate-user-data.js');
    const mapping = {
      'Dumbbell Bench Press': 'Bench Press, Dumbbell',
      'Barbell Squat': 'Squat, Barbell'
    };
    
    const oldPinned = [
      'Dumbbell Bench Press',
      'Barbell Squat',
      'Pull-Up'
    ];
    
    const { migratedPinned, migratedCount } = migratePinnedExercises(oldPinned, mapping);
    
    expect(migratedPinned).toContain('Bench Press, Dumbbell');
    expect(migratedPinned).toContain('Squat, Barbell');
    expect(migratedPinned).toContain('Pull-Up');
    expect(migratedCount).toBe(2);
  });
});
