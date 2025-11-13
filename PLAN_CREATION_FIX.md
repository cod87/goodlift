# Plan Creation Feature Fix - Documentation

## Overview
This document describes the fixes applied to the plan creation feature and calendar display system to resolve synchronization issues and improve user experience. **All plans now use a unified session-based format for consistency and simplicity.**

## Problems Fixed

### 1. Phantom Calendar Entries After Data Reset
**Problem:** After clearing app data or using guest profile, the calendar erroneously displayed a plan even though it reported no plans were active.

**Root Cause:** The `usePlanIntegration` hook automatically created a default plan when none existed, causing it to appear in the calendar.

**Solution:** Removed automatic plan creation from `usePlanIntegration`. Now `currentPlan` is properly `null` when no active plan exists.

**Files Changed:**
- `src/hooks/usePlanIntegration.js` - Removed auto-creation of default plan

### 2. Inconsistent Active Plan Handling
**Problem:** `setActivePlan()` handled plan IDs differently between guest mode and authenticated mode, and couldn't accept plan objects.

**Root Cause:** The function only accepted string IDs, but some callers were passing plan objects.

**Solution:** Updated `setActivePlan()` to accept both plan IDs (string) and plan objects, extracting the ID when needed.

**Files Changed:**
- `src/utils/storage.js` - Enhanced `setActivePlan()` function

### 3. Multiple Plan Formats Causing Confusion
**Problem:** The codebase supported both session-based plans (with explicit dates) and day-based plans (recurring weekly), leading to code duplication and complexity.

**Root Cause:** Two different plan creation systems evolved independently without consolidation.

**Solution:** **Unified all plans to use the session-based format exclusively.** All components now only handle plans with a `sessions` array containing explicit dates. This eliminates code duplication and simplifies maintenance.

**Files Changed:**
- `src/components/Calendar/MonthCalendarView.jsx` - Only handles session-based plans
- `src/components/WorkTabs/UpcomingWeekTab.jsx` - Only handles session-based plans
- `src/hooks/usePlanIntegration.js` - Only handles session-based plans
- `src/components/HomeScreen.jsx` - Only handles session-based plans

## Unified Plan Format

### Session-Based Plan (ONLY FORMAT USED)
All plans now use this structure:

```javascript
{
  id: "plan_123",
  name: "My 30-Day Plan",
  startDate: 1704844800000, // Unix timestamp
  endDate: 1707436800000,   // Unix timestamp
  duration: 30,
  goal: "hypertrophy",
  experienceLevel: "intermediate",
  daysPerWeek: 4,
  sessions: [
    {
      id: "session_1",
      date: 1704844800000, // Unix timestamp
      type: "upper",       // workout type
      status: "planned",   // planned | in_progress | completed | skipped
      exercises: [...],    // array of exercise objects
      sessionData: null,   // for HIIT/stretch sessions
      notes: "",
      completedAt: null
    },
    // ... more sessions
  ]
}
```

**Key Benefits:**
- **Explicit dates:** Each session has a specific date, making scheduling clear
- **Flexible:** Can have different numbers of sessions per week
- **Scalable:** Easy to add, remove, or reorder sessions
- **Simple:** Only one format to handle in all code

## Deprecated Formats

### ~~Day-Based Plans~~ (REMOVED)
The old recurring weekly format with `days` array is **no longer supported**.

Old format (removed):
```javascript
{
  planId: "plan_ppl_2024_01_01",
  planStyle: "ppl",
  days: [
    { dayIndex: 0, type: "rest" },      // Sunday
    { dayIndex: 1, type: "strength", subtype: "push" },  // Monday
    // ... 7 days total
  ]
}
```

**Migration:** Any old day-based plans are automatically ignored. Users will need to create new plans using the plan creation UI, which generates session-based plans.

## Verification Steps

### Test 1: No Plan Scenario
1. Open the app
2. If you have an active plan, go to Settings and clear app data
3. Navigate to the Work tab
4. **Expected:** Calendar should show only manually-logged workouts (if any), not a phantom plan

### Test 2: Create Session-Based Plan
1. Go to Work tab
2. Click "Create New Plan" or similar button
3. Use the Custom tab to generate a plan
4. Set duration to 7 days, 3 days per week
5. Create the plan
6. **Expected:** 
   - Calendar shows workout days as planned (blue/highlighted)
   - Upcoming Week shows next 7 days with correct workouts
   - Only the 3 training days should show workouts, rest days are empty

### Test 3: Guest Mode
1. Sign out (if authenticated)
2. Use the app as a guest
3. Create a workout plan
4. Go to Settings and clear app data
5. Return to Work tab
6. **Expected:** Calendar should be empty (no phantom plan)

### Test 4: Data Reset
1. Create and activate a workout plan
2. Log a few workouts
3. Go to Settings > Reset All Data
4. Return to Work tab
5. **Expected:** Calendar should be empty except for the backup recovery option

### Test 5: Plan Creation Workflows

#### Quick Start (Template-Based)
1. Go to plan creation dialog
2. Select "Quick Start" tab
3. Choose a pre-built template (e.g., "Upper/Lower Split")
4. Enter plan name and duration
5. Click Create
6. **Expected:**
   - Plan is created with sessions for each day of duration
   - Each session has specific date
   - Calendar immediately shows all planned workouts
   - If plan name contains "This Week", it's auto-activated

#### Custom (Auto-Generated)
1. Go to plan creation dialog
2. Select "Custom" tab
3. Set parameters (days per week, goal, experience level, duration)
4. Click Generate Plan
5. **Expected:**
   - Plan is generated with sessions spread across duration
   - Sessions respect training days per week
   - Exercises are populated for each session
   - Calendar shows all planned sessions

## Integration Points

### Components That Handle Plans
1. **MonthCalendarView** - Displays planned and completed workouts
2. **UpcomingWeekTab** - Shows next 7 days from plan
3. **usePlanIntegration** - Manages active plan state
4. **WorkTabs** - Receives plan from App.jsx
5. **QuickPlanSetup** - Creates new plans

### Data Flow
```
App.jsx
  ↓ uses usePlanIntegration()
  ↓ gets currentPlan (or null)
  ↓ passes to WorkTabs
  ↓ passes to UpcomingWeekTab
  ↓ passes to MonthCalendarView
```

### Storage Layer
- **Guest Mode:** Full plan object stored in `goodlift_guest_active_plan`
- **Authenticated:** Plan ID stored in `goodlift_active_plan`, plan object in `goodlift_workout_plans`
- **Firebase:** Plans synced to user document for authenticated users

## API Changes

### setActivePlan(planIdOrObject)
**Before:**
```javascript
await setActivePlan(planId); // Only accepted string ID
```

**After:**
```javascript
await setActivePlan(planId);           // Still works
await setActivePlan(planObject);       // Now also works
await setActivePlan(planObject.id);    // Also works
await setActivePlan(null);             // Clear active plan
```

### Calendar getWorkoutForDay(date)
**Before (Dual Format):**
```javascript
// Handled both sessions and days arrays
if (currentPlan.sessions) {
  return sessions.find(s => sameDay(s.date, date));
}
if (currentPlan.days) {
  return currentPlan.days[date.getDay()];
}
```

**After (Unified):**
```javascript
// Only handles sessions array
if (!currentPlan?.sessions) return null;
return currentPlan.sessions.find(s => sameDay(s.date, date));
```

## Future Enhancements

### Recommended
1. **Plan Templates:** Add more pre-built templates for common programs
2. **Session Editing:** Enhanced UI for editing individual sessions
3. **Plan Cloning:** Ability to duplicate and modify existing plans
4. **Progressive Overload:** Automatic weight/rep progression tracking

### Migration Path (If Needed)
If users have old day-based plans stored:
1. Day-based plans are ignored (no errors, just not displayed)
2. Users create new plans using the plan creation UI
3. All new plans use session-based format
4. No data migration utility needed (clean slate approach)

## Breaking Changes
**Removed Support for Day-Based Plans:** Plans with `days` array are no longer supported. The codebase now exclusively uses session-based plans with explicit dates.

**Impact:** Minimal - day-based plans were primarily internal structures. The main plan creation UI already generates session-based plans.

## Migration Notes
No data migration required. The system now handles both plan formats transparently.
