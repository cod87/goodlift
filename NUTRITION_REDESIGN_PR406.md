# Nutrition UI Redesign - PR #406 Implementation

## Summary
This PR implements the nutrition UI redesign based on PR #406 requirements:
1. Added ability to log recipes to any meal type
2. Redesigned nutrition UI for minimalist appearance
3. Changed meal logging user flow with direct meal type buttons
4. Improved visual consistency across the nutrition features

## Changes Made

### 1. Recipe Logging with Meal Types
**File: `src/components/WorkTabs/SavedRecipes.jsx`**

- Added meal type selection toggle to the "Add Recipe to Log" dialog
- When adding a recipe, users can now select Breakfast, Lunch, Dinner, or Snack
- Recipe entries now include the `mealType` field
- Default meal type is auto-selected based on current time of day
- Uses the same icon-based toggle design as the LogMealModal

**Changes:**
- Added `selectedMealType` state
- Added `getCurrentMealType` import from nutritionUtils
- Updated `handleAddPortion` to include `mealType` in the entry
- Added meal type toggle buttons in the Add Portion Dialog

### 2. Minimalist UI Redesign
**Files: `src/components/WorkTabs/NutritionTab.jsx`, `src/components/LogMealModal.jsx`**

#### Color Scheme Simplification
- Reduced color intensity on chips - removed strong primary/secondary/warning colors
- Changed chips to use `bgcolor: 'background.paper'` and `color: 'text.secondary'`
- Only the calorie chip remains bold/prominent
- Meal type header now uses `bgcolor: 'background.default'` instead of `action.hover`

#### Visual Flattening
- Changed card shadows from default to `boxShadow: 1` (more subtle)
- Simplified borders and reduced visual contrast
- Calorie progress ring kept simple with minimal text
- Removed excessive gradients and color variations

#### Layout Improvements
- Cleaner spacing with consistent padding
- Better visual hierarchy with less busy elements
- Typography refinements (smaller font sizes, better letter-spacing)

### 3. New Meal Logging Flow
**File: `src/components/WorkTabs/NutritionTab.jsx`**

#### Removed "Log a Meal" Button
- Eliminated the large "Log a Meal" button that was at the top
- This simplifies the interface and makes meal logging more direct

#### Added Meal Type Quick Action Buttons
- Placed meal type selection directly below the calorie progress ring
- Each meal type (Breakfast, Lunch, Dinner, Snack) is now a clickable button
- Buttons show icon + label in a 4-column grid
- Clean, minimal design with:
  - `bgcolor: 'background.default'`
  - Hover state changes to `action.hover`
  - Smooth transitions
  - Consistent icon sizing and spacing

#### Direct Navigation
- Clicking a meal type button immediately opens LogMealModal
- The modal automatically has that meal type pre-selected
- No intermediate step or meal type selection screen
- Added `initialMealType` prop to LogMealModal
- Added `handleOpenLogMeal(mealType)` function to handle the flow

**Implementation Details:**
- Added `initialMealType` state to track which button was clicked
- Pass `initialMealType` to LogMealModal via props
- LogMealModal uses `initialMealType` or falls back to `getCurrentMealType()`
- Clear initialMealType when modal is closed

### 4. Visual Consistency Improvements

#### Meal Entry Headers
- Changed header background from `action.hover` to `background.default`
- Simplified chip colors to neutral tones
- Only calories chip remains prominent with bold font
- Other macro chips (P, C, F) use `bgcolor: 'background.paper'` with secondary text color

#### Progress Indicators
- Kept calorie ring prominent but simplified text
- Changed "kcal" to just show the number more cleanly
- Made "remaining" text smaller and less prominent

#### Toggle Buttons
- Added consistent color to unselected state: `color: 'text.secondary'`
- Selected state uses primary color with light background
- All toggle button groups across the app use the same styling

## User Experience Improvements

### Before
1. User had to click "Log a Meal" button
2. Choose meal type inside the modal
3. Search and add foods
4. Save the meal

### After
1. User clicks the specific meal type button (e.g., "Breakfast")
2. Modal opens with that meal type already selected
3. Search and add foods
4. Save the meal

**Benefits:**
- One less step in the workflow
- More intuitive - click what you want directly
- Clearer visual hierarchy
- Less visual clutter with minimal colors
- Calmer, more modern appearance

## Recipe Logging Enhancement

### Before
- Recipes could only be added to log without meal type
- Entries appeared in "Snack" section by default

### After
- Recipes can be logged to specific meal types
- Meal type selection dialog when adding recipe
- Recipes appear in the correct meal section
- Same workflow as regular foods

## Technical Details

### Props Added
- `LogMealModal`: Added `initialMealType` prop (string, optional)

### State Added
- `NutritionTab`: Added `initialMealType` state to track clicked meal button
- `SavedRecipes`: Added `selectedMealType` state for recipe meal selection

### Functions Added
- `NutritionTab.handleOpenLogMeal(mealType)`: Opens modal with pre-selected meal type

### Styling Changes
- Reduced color saturation across nutrition components
- Standardized chip styling for consistency
- Simplified shadows and borders
- Better use of negative space

## Testing Notes

To test the changes:
1. Navigate to Nutrition tab
2. Verify meal type buttons appear below calorie ring
3. Click each meal type button - modal should open with that type selected
4. Add foods and verify they appear in correct meal section
5. Go to My Recipes tab
6. Click "Add" on a recipe
7. Select a meal type and verify recipe appears in that section
8. Verify UI has cleaner, more minimal appearance with reduced colors

## Compatibility

- All existing entries without `mealType` will default to "Snack"
- No data migration needed
- Backward compatible with old entries
- Forward compatible with new meal type system

## Files Modified

1. `src/components/WorkTabs/NutritionTab.jsx`
2. `src/components/WorkTabs/SavedRecipes.jsx`
3. `src/components/LogMealModal.jsx`

## Visual Design Goals Achieved

✅ Reduced color changes and visual clutter
✅ Adopted flatter, more modern color scheme
✅ Minimized borders and distracting decorations
✅ Maintained good readability and hierarchy
✅ Visually less busy while remaining functional
✅ Direct meal type selection for improved UX
✅ Recipe logging with meal type support
