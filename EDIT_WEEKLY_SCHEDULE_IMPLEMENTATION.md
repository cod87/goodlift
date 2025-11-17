# Edit Weekly Schedule Implementation

## Overview
This document describes the implementation of the new Edit Weekly Schedule screen, which replaces the previous dialog-based workflow with a dedicated full-screen interface.

## Key Features

### 1. Day-of-Week Navigation
- Implemented as Material-UI Tabs component
- Quick switching between all 7 days of the week
- Visual indicator for unsaved changes on each day tab

### 2. Unsaved Changes Management
- Changes are tracked per-day in local state
- Warning dialog when switching days with unsaved changes
- All changes persist across tab switches until explicitly saved or discarded
- Single "Save All Changes" button applies changes to all modified days

### 3. Strength Workout Editing
- Add/remove entire supersets with multiple exercises
- Add/remove individual exercises within supersets
- Exercise selection via autocomplete (integrated with exercise database)
- Edit weight and reps for each set of each exercise
- Automatic loading of saved weights/target reps from storage

### 4. Timer-Based Workout Configuration
For Yoga, Cardio, HIIT, Mobility, and Stretching workouts:
- Duration selector (15, 20, 30, 45, 60 minutes)
- Intensity selector (Light, Moderate, Vigorous)
- Optional notes field for session goals

### 5. Rest Day Display
- Simple, clean message indicating it's a rest day
- Appropriate icon and messaging
- No editing controls needed

### 6. Data Synchronization
- Integrates with WeekSchedulingContext for data persistence
- Uses assignWorkoutToDay function to save changes
- Loads saved weights and target reps from exercise storage
- Updates are saved to localStorage for guest users or Firebase for authenticated users

## Component Structure

### Main Component: EditWeeklyScheduleScreen
Location: `/src/pages/EditWeeklyScheduleScreen.jsx`

#### State Management
- `selectedDay`: Currently active day tab
- `dayWorkouts`: Object containing workout data for all days
- `hasUnsavedChanges`: Object tracking which days have unsaved changes
- `availableExercises`: Array of all exercises from database
- `snackbar`: Notification state for user feedback
- `confirmDialogOpen`: Dialog state for unsaved changes warning

#### Key Functions
- `handleDayChange`: Switch between days with unsaved change checks
- `handleAddSuperset`: Add new superset to current day
- `handleRemoveSuperset`: Remove entire superset
- `handleAddExerciseToSuperset`: Add exercise to existing superset
- `handleRemoveExercise`: Remove individual exercise
- `handleExerciseSelect`: Select exercise from autocomplete
- `handleUpdateSet`: Update weight/reps for exercise sets
- `handleUpdateTimer`: Update timer configuration
- `handleSaveAll`: Save all changes across all days
- `handleDiscardChanges`: Reset all unsaved changes

## Integration Points

### SettingsScreen
Updated to navigate to the new screen instead of opening WeekEditorDialog:
```jsx
<ListItemButton onClick={() => handleNavigate('edit-weekly-schedule')} sx={{ py: 1 }}>
```

### App.jsx
Added routing for the new screen:
```jsx
{currentScreen === 'edit-weekly-schedule' && <EditWeeklyScheduleScreen onNavigate={handleNavigate} />}
```

### WeekSchedulingContext
Uses existing context functions:
- `weeklySchedule`: Read current schedule
- `assignWorkoutToDay`: Save changes to schedule

## User Experience Flow

1. User clicks "Edit Weekly Schedule" in Settings
2. New full-screen opens with Monday selected by default
3. User can:
   - Switch between days using tabs
   - For strength days:
     - Add/remove supersets
     - Add/remove exercises
     - Edit weights and reps
   - For timer days:
     - Configure duration and intensity
     - Add notes
   - For rest days:
     - View rest day message only
4. Unsaved changes are tracked and preserved when switching tabs
5. User clicks "Save All Changes" to persist all modifications
6. User can click "Discard Changes" to reset to original state
7. Back button returns to Settings screen

## Design Principles

### Responsive Design
- Mobile-first approach with responsive breakpoints
- Tabs scroll horizontally on mobile
- Forms stack vertically on small screens
- Touch-friendly controls with adequate spacing

### Visual Feedback
- Colored dots on tabs indicate unsaved changes
- Snackbar notifications for successful saves
- Warning dialogs for destructive actions
- Loading states during data fetching

### Accessibility
- Semantic HTML structure
- ARIA labels for icon buttons
- Keyboard navigation support
- High contrast colors for readability

## Future Enhancements

Potential improvements for future iterations:
- Drag-and-drop reordering of exercises within supersets
- Bulk exercise selection
- Workout templates/presets
- Copy workout from one day to another
- Undo/redo functionality
- Advanced filtering for exercise selection
