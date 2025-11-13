# Simplified Workout Plan Data Models

This directory contains a simplified, flat data structure for managing workout plans using three distinct models: **Plans**, **PlanDays**, and **PlanExercises**.

## Overview

The simplified data model provides a clean, straightforward approach to workout plan management with:

- **Three flat structures** instead of nested objects
- **Clear CRUD operations** with descriptive function names
- **Automatic Firebase sync** for authenticated users
- **Guest mode support** via localStorage
- **Built-in validation** and error handling

## Data Models

### 1. Plans

Main workout plan entity containing high-level information.

**Fields:**
- `id` (string): Auto-generated unique identifier
- `name` (string): Plan name
- `type` (string): Plan type (e.g., 'strength', 'hypertrophy', 'endurance')
- `duration` (number): Plan duration in days
- `user_id` (string): User ID (or 'guest')
- `created_date` (string): ISO timestamp of creation

**CRUD Operations:**
```javascript
createPlan({ name, type, duration })  // Create new plan
getPlans()                             // Get all plans
getPlan(planId)                        // Get specific plan
updatePlan(planId, updates)            // Update plan
deletePlan(planId)                     // Delete plan
```

### 2. PlanDays

Individual days within a workout plan.

**Fields:**
- `id` (string): Auto-generated unique identifier
- `plan_id` (string): Reference to parent plan
- `day_name` (string): Day name (e.g., 'Monday', 'Push Day', 'Day 1')
- `order` (number): Display order within the plan

**CRUD Operations:**
```javascript
addDayToPlan(planId, { day_name, order })  // Add day to plan
getPlanDays()                               // Get all days
getDaysForPlan(planId)                      // Get days for specific plan
getDay(dayId)                               // Get specific day
updateDay(dayId, updates)                   // Update day
removeDay(dayId)                            // Remove day
removeDaysForPlan(planId)                   // Remove all days for a plan
```

### 3. PlanExercises

Exercises within a plan day.

**Fields:**
- `id` (string): Auto-generated unique identifier
- `plan_day_id` (string): Reference to parent day
- `exercise_name` (string): Exercise name
- `sets` (number): Number of sets
- `reps` (number): Repetitions per set
- `rest_seconds` (number): Rest time between sets (default: 60)
- `order` (number): Display order within the day

**CRUD Operations:**
```javascript
addExerciseToDay(dayId, { exercise_name, sets, reps, rest_seconds, order })
getPlanExercises()                           // Get all exercises
getExercisesForDay(dayId)                    // Get exercises for specific day
getExercise(exerciseId)                      // Get specific exercise
updateExercise(exerciseId, updates)          // Update exercise
removeExercise(exerciseId)                   // Remove exercise
removeExercisesForDay(dayId)                 // Remove all exercises for a day
reorderExercises(dayId, [exerciseIds])       // Reorder exercises
```

## Usage

### Basic Import

```javascript
// Import all models from the index
import {
  createPlan, getPlan, updatePlan, deletePlan,
  addDayToPlan, getDay, updateDay, removeDay,
  addExerciseToDay, getExercise, updateExercise, removeExercise
} from '../models';
```

### Creating a Complete Workout Plan

```javascript
// 1. Create the plan
const plan = await createPlan({
  name: "3-Day Full Body Workout",
  type: "hypertrophy",
  duration: 30
});

// 2. Add days
const day1 = await addDayToPlan(plan.id, {
  day_name: "Day 1 - Full Body",
  order: 1
});

const day2 = await addDayToPlan(plan.id, {
  day_name: "Day 2 - Full Body",
  order: 2
});

// 3. Add exercises to Day 1
await addExerciseToDay(day1.id, {
  exercise_name: "Squats",
  sets: 4,
  reps: 10,
  rest_seconds: 120,
  order: 1
});

await addExerciseToDay(day1.id, {
  exercise_name: "Bench Press",
  sets: 4,
  reps: 10,
  rest_seconds: 120,
  order: 2
});

await addExerciseToDay(day1.id, {
  exercise_name: "Rows",
  sets: 4,
  reps: 10,
  rest_seconds: 90,
  order: 3
});
```

### Retrieving Plan Data

```javascript
// Get complete plan structure
const myPlan = await getPlan(planId);
const planDays = await getDaysForPlan(planId);

// Get exercises for each day
for (const day of planDays) {
  const exercises = await getExercisesForDay(day.id);
  console.log(`${day.day_name}: ${exercises.length} exercises`);
}
```

### Updating and Deleting

```javascript
// Update plan name
await updatePlan(planId, { name: "Updated Plan Name" });

// Update exercise sets/reps
await updateExercise(exerciseId, { sets: 5, reps: 8 });

// Delete a plan and its children
await deletePlan(planId);           // Delete the plan
await removeDaysForPlan(planId);     // Clean up orphaned days
// Note: Also clean up exercises when deleting days
const days = await getDaysForPlan(planId);
for (const day of days) {
  await removeExercisesForDay(day.id);
}
```

## Features

### Automatic ID Generation
All models automatically generate unique IDs. You don't need to provide an `id` when creating new records.

### Order Management
Both days and exercises support ordering. If you don't provide an `order` value, it will be automatically calculated based on existing records.

### Firebase Sync
Data automatically syncs to Firebase Firestore when a user is authenticated. The sync happens transparently in the background.

### Guest Mode Support
Unauthenticated users can use the app with data stored in localStorage. When they sign in, their data can be migrated to Firebase.

### Cascading Operations
Helper functions like `removeDaysForPlan()` and `removeExercisesForDay()` make it easy to clean up related records when deleting parent entities.

### Input Validation
All functions include validation:
- Required field checks
- Type validation
- Range checks for numeric values
- Error messages for debugging

## Storage Architecture

### Authenticated Users
- Primary: Firebase Firestore (`users/{userId}/data/userData`)
- Cache: localStorage (for offline access)

### Guest Users
- Primary: localStorage with versioned structure
- Keys: `goodlift_guest_plans`, `goodlift_guest_plan_days`, `goodlift_guest_plan_exercises`

## Testing

Run the validation script to ensure all models are properly implemented:

```bash
node scripts/validate-simplified-models.js
```

View usage examples:

```bash
node scripts/usage-examples-simplified-models.js
```

## Integration with Existing Code

These models are designed to complement (not replace) the existing workout plan system. They provide:

1. **A simpler alternative** for basic plan creation
2. **Clear API** for UI components to consume
3. **Consistent patterns** with existing storage utilities
4. **Flexible structure** that can evolve with requirements

## Best Practices

1. **Always use await or .then()** - All functions are async
2. **Clean up orphaned records** - Use cascade delete helpers
3. **Don't provide IDs** when creating - They're auto-generated
4. **Let order auto-calculate** unless you have specific needs
5. **Handle errors** - Functions throw errors for invalid operations
6. **Check for null** - Get operations return null if not found

## Future Enhancements

Potential additions to consider:

- Bulk operations (create multiple days/exercises at once)
- Plan templates and cloning
- Exercise libraries and autocomplete
- Workout history integration
- Progress tracking per plan
- Plan sharing and export/import

## Related Files

- `/src/utils/storage.js` - Core storage utilities
- `/src/utils/firebaseStorage.js` - Firebase sync functions
- `/src/utils/guestStorage.js` - Guest mode storage
- `/scripts/validate-simplified-models.js` - Validation script
- `/scripts/usage-examples-simplified-models.js` - Usage examples
