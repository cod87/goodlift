#!/usr/bin/env node

/**
 * Usage Example for Simplified Workout Plan Models
 * 
 * This script demonstrates how to use the new CRUD operations
 * for Plans, PlanDays, and PlanExercises models.
 * 
 * Note: This is a demonstration script. In a real application,
 * these operations would be called from React components or other
 * application code with proper user authentication.
 */

console.log('📚 Simplified Workout Plan Models - Usage Examples\n');
console.log('='.repeat(60));

console.log('\n1️⃣  PLANS MODEL - Basic CRUD Operations\n');
console.log('   Creating a new plan:');
console.log('   const plan = await createPlan({');
console.log('     name: "Summer Strength Program",');
console.log('     type: "strength",');
console.log('     duration: 90');
console.log('   });');
console.log('   // Returns: { id, name, type, duration, user_id, created_date }');

console.log('\n   Getting all plans:');
console.log('   const plans = await getPlans();');
console.log('   // Returns: Array of plan objects');

console.log('\n   Getting a specific plan:');
console.log('   const plan = await getPlan(planId);');
console.log('   // Returns: Plan object or null');

console.log('\n   Updating a plan:');
console.log('   const updated = await updatePlan(planId, {');
console.log('     name: "Updated Plan Name",');
console.log('     duration: 120');
console.log('   });');
console.log('   // Returns: Updated plan object');

console.log('\n   Deleting a plan:');
console.log('   const success = await deletePlan(planId);');
console.log('   // Returns: true if deleted');

console.log('\n' + '-'.repeat(60));

console.log('\n2️⃣  PLAN DAYS MODEL - Managing Days in a Plan\n');
console.log('   Adding a day to a plan:');
console.log('   const day = await addDayToPlan(planId, {');
console.log('     day_name: "Push Day",');
console.log('     order: 1');
console.log('   });');
console.log('   // Returns: { id, plan_id, day_name, order }');

console.log('\n   Getting all days for a plan:');
console.log('   const days = await getDaysForPlan(planId);');
console.log('   // Returns: Array of day objects, sorted by order');

console.log('\n   Getting a specific day:');
console.log('   const day = await getDay(dayId);');
console.log('   // Returns: Day object or null');

console.log('\n   Updating a day:');
console.log('   const updated = await updateDay(dayId, {');
console.log('     day_name: "Updated Day Name",');
console.log('     order: 2');
console.log('   });');
console.log('   // Returns: Updated day object');

console.log('\n   Removing a day:');
console.log('   const success = await removeDay(dayId);');
console.log('   // Returns: true if removed');

console.log('\n   Removing all days for a plan:');
console.log('   const count = await removeDaysForPlan(planId);');
console.log('   // Returns: Number of days removed');

console.log('\n' + '-'.repeat(60));

console.log('\n3️⃣  PLAN EXERCISES MODEL - Managing Exercises in Days\n');
console.log('   Adding an exercise to a day:');
console.log('   const exercise = await addExerciseToDay(dayId, {');
console.log('     exercise_name: "Bench Press",');
console.log('     sets: 4,');
console.log('     reps: 8,');
console.log('     rest_seconds: 120,');
console.log('     order: 1');
console.log('   });');
console.log('   // Returns: { id, plan_day_id, exercise_name, sets, reps, rest_seconds, order }');

console.log('\n   Getting all exercises for a day:');
console.log('   const exercises = await getExercisesForDay(dayId);');
console.log('   // Returns: Array of exercise objects, sorted by order');

console.log('\n   Getting a specific exercise:');
console.log('   const exercise = await getExercise(exerciseId);');
console.log('   // Returns: Exercise object or null');

console.log('\n   Updating an exercise:');
console.log('   const updated = await updateExercise(exerciseId, {');
console.log('     sets: 5,');
console.log('     reps: 10,');
console.log('     rest_seconds: 90');
console.log('   });');
console.log('   // Returns: Updated exercise object');

console.log('\n   Removing an exercise:');
console.log('   const success = await removeExercise(exerciseId);');
console.log('   // Returns: true if removed');

console.log('\n   Removing all exercises for a day:');
console.log('   const count = await removeExercisesForDay(dayId);');
console.log('   // Returns: Number of exercises removed');

console.log('\n   Reordering exercises:');
console.log('   const reordered = await reorderExercises(dayId, [');
console.log('     exerciseId1,');
console.log('     exerciseId2,');
console.log('     exerciseId3');
console.log('   ]);');
console.log('   // Returns: Array of reordered exercises');

console.log('\n' + '='.repeat(60));

console.log('\n4️⃣  COMPLETE WORKFLOW EXAMPLE\n');
console.log('   // Step 1: Create a new plan');
console.log('   const plan = await createPlan({');
console.log('     name: "3-Day Full Body",');
console.log('     type: "hypertrophy",');
console.log('     duration: 30');
console.log('   });');

console.log('\n   // Step 2: Add days to the plan');
console.log('   const day1 = await addDayToPlan(plan.id, {');
console.log('     day_name: "Day 1 - Full Body",');
console.log('     order: 1');
console.log('   });');

console.log('\n   // Step 3: Add exercises to the day');
console.log('   await addExerciseToDay(day1.id, {');
console.log('     exercise_name: "Squats",');
console.log('     sets: 4,');
console.log('     reps: 10,');
console.log('     rest_seconds: 120,');
console.log('     order: 1');
console.log('   });');

console.log('\n   await addExerciseToDay(day1.id, {');
console.log('     exercise_name: "Bench Press",');
console.log('     sets: 4,');
console.log('     reps: 10,');
console.log('     rest_seconds: 120,');
console.log('     order: 2');
console.log('   });');

console.log('\n   // Step 4: Retrieve complete plan data');
console.log('   const myPlan = await getPlan(plan.id);');
console.log('   const planDays = await getDaysForPlan(plan.id);');
console.log('   const day1Exercises = await getExercisesForDay(day1.id);');

console.log('\n   // Now you have a complete workout plan with:');
console.log('   // - Plan metadata (name, type, duration)');
console.log('   // - Days organized by order');
console.log('   // - Exercises for each day with sets, reps, and rest times');

console.log('\n' + '='.repeat(60));

console.log('\n5️⃣  IMPORTING THE MODELS\n');
console.log('   // Import all models from the index file:');
console.log('   import {');
console.log('     createPlan, getPlan, updatePlan, deletePlan,');
console.log('     addDayToPlan, getDay, updateDay, removeDay,');
console.log('     addExerciseToDay, getExercise, updateExercise, removeExercise');
console.log('   } from \'../models\';');

console.log('\n   // Or import specific models:');
console.log('   import { createPlan, getPlan } from \'../models/Plans\';');
console.log('   import { addDayToPlan } from \'../models/PlanDays\';');
console.log('   import { addExerciseToDay } from \'../models/PlanExercises\';');

console.log('\n' + '='.repeat(60));

console.log('\n📋 KEY FEATURES:\n');
console.log('  ✓ Three flat, simple data structures');
console.log('  ✓ Clear, descriptive function names');
console.log('  ✓ Automatic ID generation');
console.log('  ✓ Order management for days and exercises');
console.log('  ✓ Firebase sync for authenticated users');
console.log('  ✓ Guest mode support via localStorage');
console.log('  ✓ Cascading delete helpers (removeDaysForPlan, removeExercisesForDay)');
console.log('  ✓ Input validation and error handling');
console.log('  ✓ Consistent with existing storage patterns');

console.log('\n💡 TIPS:\n');
console.log('  • IDs are auto-generated - don\'t provide them when creating');
console.log('  • Order is auto-calculated if not provided');
console.log('  • Use cascade delete helpers when removing plans or days');
console.log('  • All functions are async - use await or .then()');
console.log('  • Data syncs automatically to Firebase when user is logged in');
console.log('  • Guest mode data stored in localStorage with versioning\n');
