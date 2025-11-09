/**
 * Test workout plan generation with session population
 * Run with: node scripts/test-plan-generation.js
 */

import { generateWorkoutPlan } from '../src/utils/workoutPlanGenerator.js';

console.log('='.repeat(80));
console.log('TESTING WORKOUT PLAN GENERATION WITH SESSION POPULATION');
console.log('='.repeat(80));

// Test 1: Generate a simple plan with full body workouts
console.log('\n1. Testing Full Body Plan (Beginner, 3 days/week, 14 days)');
console.log('-'.repeat(80));

const plan1 = await generateWorkoutPlan({
  goal: 'general_fitness',
  experienceLevel: 'beginner',
  daysPerWeek: 3,
  duration: 14,
  startDate: new Date('2024-01-01'),
  sessionTypes: ['full'],
  equipmentAvailable: ['all'],
  planName: 'Beginner Full Body Plan'
});

console.log('Plan ID:', plan1.id);
console.log('Plan Name:', plan1.name);
console.log('Split Type:', plan1.splitType);
console.log('Total Sessions:', plan1.sessions.length);
console.log('Sessions with exercises:', plan1.sessions.filter(s => s.exercises && s.exercises.length > 0).length);
console.log('Sessions with sessionData:', plan1.sessions.filter(s => s.sessionData).length);

// Check first session details
if (plan1.sessions.length > 0) {
  const firstSession = plan1.sessions[0];
  console.log('\nFirst Session Details:');
  console.log('  Type:', firstSession.type);
  console.log('  Date:', new Date(firstSession.date).toDateString());
  console.log('  Status:', firstSession.status);
  if (firstSession.exercises) {
    console.log('  Exercises count:', firstSession.exercises.length);
    console.log('  Sample exercise:', firstSession.exercises[0] ? firstSession.exercises[0]['Exercise Name'] : 'N/A');
  }
}

// Test 2: Generate a PPL plan for advanced users
console.log('\n2. Testing PPL Plan (Advanced, 6 days/week, 7 days)');
console.log('-'.repeat(80));

const plan2 = await generateWorkoutPlan({
  goal: 'hypertrophy',
  experienceLevel: 'advanced',
  daysPerWeek: 6,
  duration: 7,
  startDate: new Date('2024-01-01'),
  sessionTypes: ['push', 'pull', 'legs'],
  equipmentAvailable: ['all'],
  planName: 'Advanced PPL Plan'
});

console.log('Plan Name:', plan2.name);
console.log('Split Type:', plan2.splitType);
console.log('Total Sessions:', plan2.sessions.length);

// Check session types
const sessionTypes = {};
plan2.sessions.forEach(s => {
  sessionTypes[s.type] = (sessionTypes[s.type] || 0) + 1;
});
console.log('Session Type Distribution:', sessionTypes);

// Check if sessions have exercises
plan2.sessions.forEach((session, i) => {
  if (session.exercises && session.exercises.length > 0) {
    console.log(`  Session ${i + 1} (${session.type}): ${session.exercises.length} exercises`);
  }
});

// Test 3: Generate a plan with mixed session types (including HIIT and Yoga)
console.log('\n3. Testing Mixed Plan (Intermediate, 4 days/week, 7 days with HIIT and Yoga)');
console.log('-'.repeat(80));

const plan3 = await generateWorkoutPlan({
  goal: 'general_fitness',
  experienceLevel: 'intermediate',
  daysPerWeek: 4,
  duration: 7,
  startDate: new Date('2024-01-01'),
  sessionTypes: ['full', 'hiit', 'yoga'],
  equipmentAvailable: ['all'],
  planName: 'Mixed Training Plan'
});

console.log('Plan Name:', plan3.name);
console.log('Total Sessions:', plan3.sessions.length);

// Check session types and data
plan3.sessions.forEach((session, i) => {
  const hasExercises = session.exercises && session.exercises.length > 0;
  const hasSessionData = session.sessionData !== null;
  console.log(`  Session ${i + 1} (${session.type}): ${hasExercises ? 'exercises' : hasSessionData ? 'sessionData' : 'none'}`);
  
  if (hasExercises) {
    console.log(`    - ${session.exercises.length} exercises`);
  }
  if (hasSessionData) {
    console.log(`    - Session type: ${session.sessionData.type}`);
  }
});

console.log('\n' + '='.repeat(80));
console.log('VERIFICATION SUMMARY');
console.log('='.repeat(80));

const allPlans = [plan1, plan2, plan3];
let totalSessions = 0;
let sessionsWithData = 0;

allPlans.forEach(plan => {
  totalSessions += plan.sessions.length;
  sessionsWithData += plan.sessions.filter(s => 
    (s.exercises && s.exercises.length > 0) || s.sessionData
  ).length;
});

console.log(`Total Sessions Generated: ${totalSessions}`);
console.log(`Sessions with Data: ${sessionsWithData}`);
console.log(`Sessions without Data: ${totalSessions - sessionsWithData}`);

if (sessionsWithData === totalSessions) {
  console.log('\n✅ ALL SESSIONS SUCCESSFULLY POPULATED!');
} else {
  console.log('\n⚠️  Some sessions are missing data');
}

console.log('\n' + '='.repeat(80));
console.log('TEST COMPLETED SUCCESSFULLY!');
console.log('='.repeat(80));
