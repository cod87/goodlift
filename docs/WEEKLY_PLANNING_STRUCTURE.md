# Weekly Planning Structure

## Overview
This document describes the mandatory 7-day weekly planning structure implemented for GoodLift workout plans.

## Core Concepts

### Day Types Enum
All workout plans now use a standardized set of day types:

- `strength` - Strength-focused training (blue)
- `hypertrophy` - Muscle-building focused training (blue)
- `cardio` - Cardiovascular training (green)
- `active_recovery` - Mobility, stretching, light movement (light blue)
- `rest` - Complete rest day (gray)

### Mandatory 7-Day Structure
Every weekly plan must have exactly 7 days, representing Sunday through Saturday. Each day has:

```javascript
{
  dayOfWeek: 0-6,        // 0 = Sunday, 6 = Saturday
  dayName: "Sunday",     // Full day name
  type: "strength",      // One of the day types enum
  exercises: [],         // Array of exercises for the day
  duration: 60,          // Estimated duration in minutes
  description: "..."     // Description of the day's focus
}
```

## Auto-Scheduling Algorithm

The `planScheduler.js` utility provides intelligent workout distribution:

### Key Features
1. **Prevents Overtraining**: Ensures no more than 2 consecutive intense days
2. **Auto-Recovery**: Inserts active recovery days between intense periods
3. **Balanced Distribution**: Spreads workouts evenly across the week
4. **Customizable**: Allows preferences for intense day count and cardio frequency

### Example Schedules

#### 3 Intense Days/Week
```
Sunday:    Cardio
Monday:    Strength
Tuesday:   Active Recovery
Wednesday: Strength
Thursday:  Active Recovery
Friday:    Strength
Saturday:  Rest
```

#### 5 Intense Days/Week
```
Sunday:    Rest
Monday:    Hypertrophy
Tuesday:   Hypertrophy
Wednesday: Active Recovery (enforced to prevent 3 consecutive)
Thursday:  Rest
Friday:    Hypertrophy
Saturday:  Hypertrophy
```

## Components

### WeeklyCalendarView
A visual 7-day calendar component with:
- Grid layout showing all 7 days
- Color-coded day types
- Exercise count and duration estimates
- Drag-and-drop reordering support
- Interactive day selection

### Usage Example
```jsx
import WeeklyCalendarView from './components/WeeklyCalendarView';
import { scheduleWeeklyPlan } from './utils/planScheduler';

const plan = scheduleWeeklyPlan({
  intenseDaysPerWeek: 3,
  cardioDaysPerWeek: 1,
  focusType: 'strength'
});

<WeeklyCalendarView
  weeklyPlan={plan}
  onPlanChange={handlePlanChange}
  onDayClick={handleDayClick}
/>
```

## Firebase Integration

### Data Validation
The `saveWeeklyPlanToFirebase` function enforces:
- Exactly 7 days in the plan
- Valid day types from the enum
- Proper dayOfWeek indices (0-6)

### Schema
Weekly plans are stored with full validation:
```javascript
{
  weeklyPlan: [
    // Array of exactly 7 day objects
    {
      dayOfWeek: 0,
      dayName: "Sunday",
      type: "rest",
      exercises: [],
      duration: 0,
      description: "Rest Day"
    },
    // ... 6 more days
  ]
}
```

## Migration from Old Structure

### Legacy Compatibility
The system maintains backward compatibility with:
- Old day abbreviations (Mon, Tue, etc.)
- Legacy workout types (push, pull, legs, upper, lower)
- Existing session-based plans

### Mapping
Old stretch/yoga sessions are now mapped to `active_recovery`:
```javascript
'stretch' → 'active_recovery'
'yoga' → 'active_recovery'
```

## API Reference

### scheduleWeeklyPlan(preferences)
Generates a 7-day weekly plan.

**Parameters:**
- `intenseDaysPerWeek` (2-5): Number of intense training days
- `cardioDaysPerWeek` (0-3): Number of cardio days
- `focusType` ('strength' | 'hypertrophy'): Training focus
- `preferredIntenseDays` (array): Optional preferred days for intense workouts

**Returns:** Array of 7 day objects

### validateWeeklyPlan(weekPlan)
Validates a weekly plan structure.

**Parameters:**
- `weekPlan`: Array of day objects

**Returns:**
```javascript
{
  isValid: boolean,
  errors: string[]
}
```

### reorderWeeklyPlan(weekPlan, fromIndex, toIndex)
Reorders days in a weekly plan (for drag-and-drop).

**Parameters:**
- `weekPlan`: Current weekly plan
- `fromIndex`: Source day index
- `toIndex`: Destination day index

**Returns:** Reordered weekly plan

## Best Practices

1. **Always use the scheduler**: Use `scheduleWeeklyPlan()` to generate plans rather than manually creating them
2. **Validate plans**: Always validate with `validateWeeklyPlan()` before saving to Firebase
3. **Respect recovery**: The 2-consecutive-intense-days limit is science-backed
4. **Use color coding**: Maintain the color scheme for visual consistency
5. **Test changes**: Run the validation tests after modifying scheduling logic

## Color Scheme

| Day Type | Color | Hex Code | Purpose |
|----------|-------|----------|---------|
| Strength/Hypertrophy | Blue | #1976d2 | High-intensity training |
| Cardio | Green | #2e7d32 | Cardiovascular work |
| Active Recovery | Light Blue | #64b5f6 | Mobility & flexibility |
| Rest | Gray | #9e9e9e | Complete rest |

## Future Enhancements

Potential improvements to consider:
- Individual day editing in the UI
- Custom day type creation
- AI-powered schedule optimization
- Integration with user performance data
- Progressive overload planning within the 7-day structure
