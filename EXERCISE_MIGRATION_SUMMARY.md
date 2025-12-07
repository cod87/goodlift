# Exercise Name Migration Summary

## Changes Made

This migration converted 79 exercise names from "Equipment Exercise" format to "Exercise, Equipment" format.

### Example Changes:
- Dumbbell Bench Press → Bench Press, Dumbbell
- Barbell Squat (High Bar) → Squat (High Bar), Barbell
- Kettlebell Swing → Swing, Kettlebell

## User Data Migration

User data has been automatically migrated to use the new exercise names:
- ✅ Exercise weights
- ✅ Exercise target reps
- ✅ Workout history
- ✅ Pinned exercises

## Complete List of Changes

- Barbell Bench Press → Bench Press, Barbell
- Barbell Bent-Over Row → Bent-Over Row, Barbell
- Barbell Deadlift → Deadlift, Barbell
- Barbell Front Squat → Front Squat, Barbell
- Barbell Overhead Press → Overhead Press, Barbell
- Barbell Squat (High Bar) → Squat (High Bar), Barbell
- Barbell Romanian Deadlift → Romanian Deadlift, Barbell
- Barbell Incline Bench Press → Incline Bench Press, Barbell
- Barbell Decline Bench Press → Decline Bench Press, Barbell
- Barbell Sumo Deadlift → Sumo Deadlift, Barbell
- Barbell Good Morning → Good Morning, Barbell
- Barbell Shrug → Shrug, Barbell
- Barbell Bicep Curl → Bicep Curl, Barbell
- Barbell Close Grip Bench Press → Close Grip Bench Press, Barbell
- Barbell Upright Row → Upright Row, Barbell
- Barbell High Pull → High Pull, Barbell
- Barbell Clean → Clean, Barbell
- Barbell Snatch → Snatch, Barbell
- Barbell Thruster → Thruster, Barbell
- Barbell Pendulum Squat → Pendulum Squat, Barbell
- Barbell Belt Squat → Belt Squat, Barbell
- Barbell Trap Bar Deadlift → Trap Bar Deadlift, Barbell
- Barbell Paused Bench Press → Paused Bench Press, Barbell
- Barbell Push Press → Push Press, Barbell
- Barbell Box Squat → Box Squat, Barbell
- Barbell Hack Squat → Hack Squat, Barbell
- Dumbbell Bench Press → Bench Press, Dumbbell
- Dumbbell Incline Bench Press → Incline Bench Press, Dumbbell
- Dumbbell Decline Bench Press → Decline Bench Press, Dumbbell
- Dumbbell Fly → Fly, Dumbbell
- Dumbbell Pullover → Pullover, Dumbbell
- Dumbbell Bent-Over Row → Bent-Over Row, Dumbbell
- Dumbbell Single-Arm Row → Single-Arm Row, Dumbbell
- Dumbbell Pendlay Row → Pendlay Row, Dumbbell
- Dumbbell Renegade Row → Renegade Row, Dumbbell
- Dumbbell Bicep Curl → Bicep Curl, Dumbbell
- Dumbbell Hammer Curl → Hammer Curl, Dumbbell
- Dumbbell Incline Curl → Incline Curl, Dumbbell
- Dumbbell Shoulder Press → Shoulder Press, Dumbbell
- Dumbbell Single-Arm Shoulder Press → Single-Arm Shoulder Press, Dumbbell
- Dumbbell Arnold Press → Arnold Press, Dumbbell
- Dumbbell Lateral Raise → Lateral Raise, Dumbbell
- Dumbbell Front Raise → Front Raise, Dumbbell
- Dumbbell Reverse Fly → Reverse Fly, Dumbbell
- Dumbbell Kickback → Kickback, Dumbbell
- Dumbbell Overhead Tricep Extension → Overhead Tricep Extension, Dumbbell
- Dumbbell Goblet Squat → Goblet Squat, Dumbbell
- Dumbbell Front Squat → Front Squat, Dumbbell
- Dumbbell Lunge → Lunge, Dumbbell
- Dumbbell Walking Lunge → Walking Lunge, Dumbbell
- Dumbbell Reverse Lunge → Reverse Lunge, Dumbbell
- Dumbbell Bulgarian Split Squat → Bulgarian Split Squat, Dumbbell
- Dumbbell Step-Up → Step-Up, Dumbbell
- Dumbbell Romanian Deadlift → Romanian Deadlift, Dumbbell
- Dumbbell Deadlift → Deadlift, Dumbbell
- Dumbbell Single-Leg Deadlift → Single-Leg Deadlift, Dumbbell
- Dumbbell Suitcase Deadlift → Suitcase Deadlift, Dumbbell
- Dumbbell Farmer Carry → Farmer Carry, Dumbbell
- Dumbbell Thruster → Thruster, Dumbbell
- Dumbbell Jump Squat → Jump Squat, Dumbbell
- Kettlebell Swing → Swing, Kettlebell
- Kettlebell Turkish Get-Up → Turkish Get-Up, Kettlebell
- Kettlebell Clean → Clean, Kettlebell
- Kettlebell Snatch → Snatch, Kettlebell
- Kettlebell Goblet Squat → Goblet Squat, Kettlebell
- Kettlebell Front Squat → Front Squat, Kettlebell
- Kettlebell Overhead Press → Overhead Press, Kettlebell
- Kettlebell Lunge → Lunge, Kettlebell
- Kettlebell Single-Arm Row → Single-Arm Row, Kettlebell
- Kettlebell Thruster → Thruster, Kettlebell
- Landmine Press → Press, Landmine
- Landmine Squat → Squat, Landmine
- Landmine Rotation → Rotation, Landmine
- Landmine Row → Row, Landmine
- Landmine Deadlift → Deadlift, Landmine
- Slam Ball Slam → Slam, Slam Ball
- Slam Ball Rotational Slam → Rotational Slam, Slam Ball
- Slam Ball Chest Throw → Chest Throw, Slam Ball
- Slam Ball Squat → Squat, Slam Ball

## Technical Details

- Source file: `public/data/exercise-expanded.csv`
- Mapping file: `public/data/exercise-name-mapping.json`
- Migration script: `scripts/migrate-user-data.js`
- Data migration utilities are also available in: `src/utils/exerciseNameMigration.js`
