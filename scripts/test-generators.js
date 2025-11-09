/**
 * Manual test for HIIT and Yoga session generators
 * Run with: node scripts/test-generators.js
 */

import { generateHIITSession, HIIT_PROTOCOLS } from '../src/utils/hiitSessionGenerator.js';
import { generateYogaSession, YOGA_MODES } from '../src/utils/yogaSessionGenerator.js';
import exercisesData from '../public/data/exercises.json' assert { type: 'json' };
import yogaPosesData from '../public/data/yoga-poses.json' assert { type: 'json' };

console.log('='.repeat(80));
console.log('TESTING HIIT SESSION GENERATOR');
console.log('='.repeat(80));

// Test 1: Generate a bodyweight HIIT session
console.log('\n1. Testing Bodyweight HIIT Session (Intermediate, Balanced Protocol)');
console.log('-'.repeat(80));
const hiitSession1 = generateHIITSession({
  modality: 'bodyweight',
  level: 'intermediate',
  protocol: 'BALANCED',
  exercises: exercisesData,
  lowerImpact: false,
  goal: 'cardiovascular'
});

console.log('Type:', hiitSession1.type);
console.log('Level:', hiitSession1.level);
console.log('Protocol:', hiitSession1.protocol.name);
console.log('Warmup Duration:', hiitSession1.warmup.duration, 'seconds');
console.log('Main Workout Rounds:', hiitSession1.mainWorkout.rounds);
console.log('Exercises:', hiitSession1.mainWorkout.exercises.length);
console.log('Total Duration:', Math.floor(hiitSession1.totalDuration / 60), 'minutes');
console.log('Guide Reference:', hiitSession1.guideReference);
console.log('Sample Exercise:', hiitSession1.mainWorkout.exercises[0]?.name);

// Test 2: Generate a cycling HIIT session
console.log('\n2. Testing Cycling HIIT Session (Advanced)');
console.log('-'.repeat(80));
const hiitSession2 = generateHIITSession({
  modality: 'cycling',
  level: 'advanced',
  exercises: exercisesData,
  goal: 'power'
});

console.log('Type:', hiitSession2.type);
console.log('Protocol:', hiitSession2.protocol.name);
console.log('Total Duration:', hiitSession2.totalDuration / 60, 'minutes');
console.log('Guide Reference:', hiitSession2.guideReference);

console.log('\n' + '='.repeat(80));
console.log('TESTING YOGA SESSION GENERATOR');
console.log('='.repeat(80));

// Test 3: Generate a Power Yoga session
console.log('\n3. Testing Power Yoga Session (Intermediate)');
console.log('-'.repeat(80));
const yogaSession1 = generateYogaSession({
  mode: 'power',
  level: 'intermediate',
  poses: yogaPosesData,
  goal: 'strength'
});

console.log('Type:', yogaSession1.type);
console.log('Mode:', yogaSession1.mode.name);
console.log('Level:', yogaSession1.level);
console.log('Total Duration:', yogaSession1.totalDuration / 60, 'minutes');
console.log('Warmup Duration:', yogaSession1.warmup.duration, 'seconds');
console.log('Standing Sequence Exercises:', yogaSession1.standingSequence.exercises.length);
console.log('Breathing Technique:', yogaSession1.breathing.name);
console.log('Guide Reference:', yogaSession1.guideReference);
console.log('Muscles Worked:', yogaSession1.musclesWorked);

// Test 4: Generate a Restorative Yoga session
console.log('\n4. Testing Restorative Yoga Session');
console.log('-'.repeat(80));
const yogaSession2 = generateYogaSession({
  mode: 'restorative',
  poses: yogaPosesData,
  goal: 'recovery'
});

console.log('Type:', yogaSession2.type);
console.log('Mode:', yogaSession2.mode.name);
console.log('Total Duration:', yogaSession2.totalDuration / 60, 'minutes');
console.log('Props Needed:', yogaSession2.props.join(', '));
console.log('Restorative Poses:', yogaSession2.restorativeSequence.poses.length);
console.log('Breathing Primary:', yogaSession2.breathing.primary.name);
console.log('Guide Reference:', yogaSession2.guideReference);
console.log('Parasympathetic Balance:', yogaSession2.metadata.parasympatheticBalance);

console.log('\n' + '='.repeat(80));
console.log('TESTING PROTOCOL AND MODE DEFINITIONS');
console.log('='.repeat(80));

console.log('\nHIIT Protocols Available:');
Object.entries(HIIT_PROTOCOLS).forEach(([key, protocol]) => {
  console.log(`  ${key}: ${protocol.name} (${protocol.workSeconds}:${protocol.restSeconds}s) - ${protocol.difficulty}`);
});

console.log('\nYoga Modes Available:');
Object.entries(YOGA_MODES).forEach(([key, mode]) => {
  console.log(`  ${key}: ${mode.name} (${mode.duration} min) - ${mode.sympatheticActivation} activation`);
});

console.log('\n' + '='.repeat(80));
console.log('ALL TESTS COMPLETED SUCCESSFULLY!');
console.log('='.repeat(80));
