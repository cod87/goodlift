# Progressive Overload Tracking Feature

## Overview
This document describes the new Progressive Overload Tracking feature added to the ProgressScreen component.

## Features

### 1. Pin Up to 10 Exercises for Tracking
Users can pin up to 10 exercises from their workout history to track progression over time.

### 2. Toggle Between Weight and Reps Tracking
Each pinned exercise has a Material UI switch that allows toggling between:
- **Weight Mode**: Displays maximum weight lifted per workout session
- **Reps Mode**: Displays maximum reps achieved per workout session

### 3. Interactive Line Charts
Each pinned exercise shows a line chart visualizing progression over time using Chart.js.

### 4. Add/Remove Exercises
- Click the **+** button in the header to open a dialog listing all available exercises
- Click the **X** button on each chart to remove an exercise from tracking
- Maximum of 10 exercises can be pinned at once

### 5. Data Persistence
Pinned exercises and their tracking modes are stored in:
- localStorage for logged-out users
- Firebase for authenticated users
- Guest mode storage for guest sessions

## Technical Implementation

### Storage Functions
Located in `src/utils/storage.js`:

- `getPinnedExercises()` - Retrieves array of pinned exercise configurations
- `setPinnedExercises(array)` - Saves pinned exercises (max 10)
- `addPinnedExercise(name, mode)` - Adds a new exercise to track
- `removePinnedExercise(name)` - Removes an exercise from tracking
- `updatePinnedExerciseMode(name, mode)` - Changes tracking mode (weight/reps)

Each pinned exercise is stored as:
```javascript
{
  exerciseName: "Bench Press",
  trackingMode: "weight" // or "reps"
}
```

### Progression Data Extraction
Located in `src/utils/progressionHelpers.js`:

- `getExerciseProgression(history, exerciseName, mode)` - Extracts progression data points
- `getUniqueExercises(history)` - Returns all exercises from workout history
- `formatProgressionForChart(data, label)` - Formats data for Chart.js

### Data Structure
Workout history format:
```javascript
{
  date: "ISO date string",
  type: "Chest",
  duration: 3600, // seconds
  exercises: {
    "Bench Press": {
      sets: [
        { set: 1, weight: 135, reps: 10 },
        { set: 2, weight: 135, reps: 10 },
        { set: 3, weight: 135, reps: 8 }
      ]
    }
  }
}
```

Progression data extraction:
- **Weight Mode**: Takes the maximum weight from all sets in each workout
- **Reps Mode**: Takes the maximum reps from all sets in each workout

## UI Components

### Progressive Overload Card
- Compact header with title and Add button
- Grid layout: 2 charts per row on desktop (6 columns each)
- Empty state with call-to-action when no exercises pinned

### Exercise Chart Cards
- Exercise name at the top
- Toggle switch for weight/reps mode
- Line chart showing progression (180px height)
- Close button to remove from tracking
- Empty state message if no data available

### Add Exercise Dialog
- Lists all unique exercises from workout history
- Filters out already-pinned exercises
- Click to add (defaults to weight tracking mode)

## Usage

1. Navigate to the Progress screen
2. Scroll to the "Progressive Overload Tracking" section
3. Click the **+** button to add exercises
4. Select exercises from the dialog
5. Toggle between weight and reps using the switch on each chart
6. Remove exercises by clicking the **X** button
7. Watch your progress over time!

## Compact Activities Section

All activity cards have been redesigned to be more compact:
- Reduced padding (2-3 → 1.5)
- Smaller typography (h6 → body2, body2 → caption)
- Reduced spacing between cards (2 → 0.75)
- Thinner border-left indicator (4px → 3px)
- Smaller icons throughout
- Inline chips for status indicators
- Exercise count instead of full list for workouts

This improves information density and allows users to scan their activity history more efficiently.
