# Recurring Session Editing - Implementation Documentation

## Date
2025-11-10

## Overview
This feature allows users to batch-edit exercises for all recurring sessions of the same type within a training block (period before a deload week).

## Feature Summary
Users can now edit workout exercises once and have those changes automatically apply to all similar sessions in the current training block, eliminating the need to edit each session individually.

## Use Case
**Example**: A user has a 4-week training plan with Upper Body workouts on Mondays. Without this feature, they would need to edit each Monday's workout separately. With recurring session editing, they can edit one Monday workout and apply those changes to all Mondays before the next deload week.

## Implementation Details

### Backend Functions (workoutPlanGenerator.js)

#### getRecurringSessionsInBlock(plan, sessionId)
- **Purpose**: Finds all sessions of the same type within the current training block
- **Logic**: 
  - Identifies the session's week and training block
  - Finds the previous and next deload weeks
  - Returns all sessions of the same type between those boundaries
- **Returns**: Array of session objects

#### updateRecurringSessionExercises(plan, sessionId, newExercises)
- **Purpose**: Updates exercises for all recurring sessions in a training block
- **Validation**:
  - Ensures plan, sessionId, and newExercises are provided
  - Validates newExercises is a non-empty array
  - Throws errors for invalid inputs
- **Returns**: Updated plan with modified timestamp

### Frontend Components

#### RecurringSessionEditor.jsx
A dialog component that provides:
- Visual grouping of exercises by superset pairs (exercises paired during plan generation)
- Multi-term autocomplete search for exercises (search by name, muscle group, equipment, or any combination)
- Ability to add new exercises from filtered list (based on session type)
- Only allows selection from valid exercises matching the session's workout type
- Inline editing of sets, reps, and rest time within superset groups
- Visual feedback showing how many sessions will be affected
- Validation before saving

**Enhanced Features:**
- **Autocomplete Search**: Users can search exercises by typing multiple keywords (e.g., "chest dumbbell" to find all chest exercises using dumbbells)
- **Superset Visualization**: Exercises paired as supersets are displayed in colored cards with a "SUPERSET" header
- **Smart Filtering**: Search matches against exercise name, primary muscle, secondary muscles, equipment, movement pattern, difficulty, and workout type
- **Multi-term Search**: All search terms must match for an exercise to appear in results

#### ProgressScreen.jsx Updates
- Added "Edit Recurring Sessions" option to planned session menu
- Only available for standard workout types (Upper/Lower/Full/Push/Pull/Legs)
- Shows success message with count of updated sessions
- Graceful error handling
- Accessible from the Progress screen's calendar for all planned sessions

## User Flow

1. User opens the Progress screen (which contains the workout plan calendar)
2. User clicks on a planned session date in the calendar
3. User clicks the menu button (⋮) in the session detail dialog
4. User selects "Edit Recurring Sessions"
5. A dialog opens showing:
   - Current exercises
   - Option to add/remove/modify exercises
   - Warning that changes apply to all X sessions in the block
6. User makes changes (add, remove, or edit exercises)
7. User clicks "Save Changes to All X Sessions"
8. System validates changes
9. All recurring sessions in the training block are updated
10. Success message confirms the number of sessions updated

## Validation & Safety

### Input Validation
- Exercises array must not be empty
- Each exercise must have valid sets (>= 1)
- Each exercise must have valid reps
- Rest time must be >= 0

### Session Type Filtering
- Only standard workout types can use recurring editing
- HIIT, Yoga, Cardio sessions are excluded
- Exercise list is filtered based on session type

### Block Boundaries
- Recurring edits respect deload week boundaries
- Sessions after a deload week remain unchanged
- Each training block is independent

## Testing

### Automated Tests (scripts/test-recurring-edit.js)
All tests passing:
- ✓ Correct identification of recurring sessions
- ✓ Proper handling of different session types
- ✓ Deload week boundary enforcement
- ✓ Batch update functionality
- ✓ Session type isolation
- ✓ Input validation
- ✓ Empty array rejection

### Manual Testing Checklist
- [ ] Create a workout plan with multiple weeks
- [ ] Open Progress screen and view the calendar
- [ ] Click on a planned session in the calendar
- [ ] Access "Edit Recurring Sessions" option from the menu
- [ ] Add, remove, and modify exercises
- [ ] Verify changes apply to all recurring sessions
- [ ] Verify deload week sessions are not affected
- [ ] Verify other session types are not affected
- [ ] Test error cases (empty exercises, invalid inputs)

## Files Modified

### New Files
1. `src/components/RecurringSessionEditor.jsx` - Main editor dialog component
2. `scripts/test-recurring-edit.js` - Automated test suite

### Modified Files
1. `src/utils/workoutPlanGenerator.js`
   - Added `getRecurringSessionsInBlock()`
   - Added `updateRecurringSessionExercises()`
   - Enhanced documentation

2. `src/components/ProgressScreen.jsx` (replaces PlanCalendarScreen.jsx)
   - Added recurring editor integration
   - Added menu option for recurring edits in planned session dialog
   - Added success/error feedback
   - Added exercise loading from JSON
   - Integrated RecurringSessionEditor component

### Removed Files
1. `src/components/PlanCalendarScreen.jsx` - Functionality migrated to ProgressScreen

## Design Decisions

### Why Training Blocks?
Training blocks (periods between deload weeks) are natural boundaries for exercise consistency. The existing plan generator already reuses exercises within blocks for progressive overload, so batch editing aligns with this principle.

### Why Only Standard Workouts?
HIIT and Yoga sessions use `sessionData` instead of `exercises` array and have different structures. Recurring editing is currently limited to standard workouts to maintain simplicity and avoid complexity.

### Why Inline Exercise Editing?
Allowing users to edit sets, reps, and rest time directly in the list provides immediate feedback and reduces the number of clicks needed to customize a workout.

### Why Autocomplete Instead of Dropdown?
A traditional dropdown becomes cumbersome with 100+ exercises. Autocomplete with multi-term search allows users to quickly find exercises by typing relevant keywords (e.g., "chest barbell" or "leg compound"), making exercise selection much faster and more intuitive.

### Why Visual Superset Grouping?
Exercises are paired into supersets during plan generation for optimal workout efficiency (agonist-antagonist pairings). Visualizing these pairs helps users understand the intended workout structure and maintain proper superset pairings when editing.

## Future Enhancements

### Potential Improvements
1. **Drag-and-drop reordering**: Allow users to reorder exercises and create new superset pairs
2. **HIIT/Yoga support**: Extend recurring editing to other session types
3. **Cross-block editing**: Option to apply changes across multiple training blocks
4. **Templates**: Save recurring session configurations as templates
5. **Preview**: Show before/after comparison of all affected sessions
6. **Undo/Redo**: Allow users to revert batch changes
7. **Custom superset creation**: Allow users to manually create/break superset pairs

### Performance Considerations
- Current implementation handles plans up to 90 days efficiently
- For larger plans, consider lazy loading of exercises
- Session updates are batched in a single operation
- Autocomplete filtering is performed client-side for instant results

## Security Summary
No new security concerns introduced:
- All data stored locally or in user's Firebase account
- No external API calls
- Input validation prevents invalid data
- No sensitive information exposed

## Conclusion
The recurring session editing feature provides a significant UX improvement by reducing repetitive editing tasks while maintaining data integrity through proper validation and training block boundaries.
