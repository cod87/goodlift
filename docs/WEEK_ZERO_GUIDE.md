# Week 0 Implementation Guide

## Overview

Week 0 is a concept introduced to handle the scenario where a user's first-ever workout session in the app occurs on Wednesday, Thursday, Friday, or Saturday (days 3-6 of a Sun-Sat week).

## The Problem

Previously, if a user started their fitness journey mid-week (e.g., on Wednesday or Saturday), the system would immediately consider it "Week 1" and start applying Week 1 logic:
- Automatic workout assignments
- Adherence calculations
- Week-based metrics

This created issues:
1. **Incomplete baseline**: Users starting mid-week had an incomplete first week that skewed adherence metrics
2. **Premature expectations**: Week 1 typically has structure and expectations that don't make sense for a partial week
3. **Confusion**: Week counter and calendar week didn't align

## The Solution: Week 0

When a user's first session occurs on Wed-Sat, we designate that partial period as "Week 0":

### Week 0 Characteristics

1. **Creation Trigger**: First-ever session occurs on Wednesday (day 3), Thursday (day 4), Friday (day 5), or Saturday (day 6)

2. **Duration**: From the first session date through the Saturday of that same Sun-Sat block

3. **Week 1 Start**: The Sunday immediately after Week 0 becomes the start of Week 1

4. **Streak Counting**: ✅ Week 0 sessions COUNT toward streaks
   - Each consecutive day with a session adds to the streak
   - Week 0 is treated as an incomplete week (exempt from 3-strength requirement)
   - Streak can continue seamlessly from Week 0 into Week 1

5. **Adherence Calculation**: ❌ Week 0 sessions DO NOT COUNT toward adherence
   - Adherence calculation starts from Week 1 (the first Sunday)
   - This prevents the partial week from artificially lowering adherence percentage
   - While in Week 0, adherence shows 0%

6. **Workout Assignment**: ❌ Week 0 does NOT trigger automatic workout assignments
   - No auto-assignment to days of the week
   - Users can still manually log sessions
   - Auto-assignment begins in Week 1

7. **No Week 0 Scenario**: If first session is Sun-Tue, there is NO Week 0
   - Week 1 starts immediately from the most recent Sunday
   - Normal Week 1 logic applies

### Examples

#### Example 1: First Session on Wednesday
```
User's first session: Wednesday, Nov 12
- Nov 12 (Wed): Session 1 - Week 0
- Nov 13 (Thu): Session 2 - Week 0
- Nov 14 (Fri): Session 3 - Week 0
- Nov 15 (Sat): Session 4 - Week 0
- Nov 16 (Sun): Session 5 - Week 1 begins!
- Nov 17 (Mon): Session 6 - Week 1
- Nov 18 (Tue): Session 7 - Week 1

Results:
- Streak: 7 days (all consecutive days counted)
- Week 0: Wed-Sat (4 days)
- Week 1: Sun-Tue (3 days so far)
- Adherence: Calculated from Sunday onwards (3 sessions in 3 days = 100%)
```

#### Example 2: First Session on Saturday (User's Scenario)
```
User's first session: Saturday, Nov 15 (cardio)
- Nov 15 (Sat): Cardio session - Week 0 (1 day only)
- Nov 16 (Sun): Strength session - Week 1 begins!
- Nov 17 (Mon): Strength session - Week 1
- Nov 18 (Tue): Strength session - Week 1
- Nov 19 (Wed): Cardio session - Week 1
- Nov 20 (Thu): Cardio session - Week 1

Results:
- Streak: 6 days (Sat through Thu, all consecutive)
- Week 0: Just Saturday (1 day)
- Week 1: Sun-Thu (5 days so far, incomplete week)
- Adherence: Calculated from Sunday onwards
- Week reset on Sunday: Does NOT affect streak (metadata only)
```

#### Example 3: First Session on Monday
```
User's first session: Monday, Nov 10
- Week 1 starts immediately (most recent Sunday was Nov 9)
- Nov 10 (Mon): Session 1 - Week 1
- Nov 11 (Tue): Session 2 - Week 1
- Nov 12 (Wed): Session 3 - Week 1

Results:
- NO Week 0 (first session was Monday, not Wed-Sat)
- Week 1 from Sunday, Nov 9
- Adherence: Calculated from Monday onwards
- Normal Week 1 behavior
```

## Technical Implementation

### WeekSchedulingContext

New state fields:
```javascript
{
  currentWeek: 0,  // 0 for Week 0, 1+ for Week 1 onwards
  isWeekZero: true,  // Boolean flag
  weekZeroStartDate: "2025-11-15T00:00:00.000Z",  // First session date
  cycleStartDate: "2025-11-16T00:00:00.000Z",  // Week 1 start (next Sunday)
}
```

New constants:
```javascript
const WEDNESDAY_DAY_INDEX = 3;  // Week 0 starts at day 3 (Wednesday)
const SATURDAY_DAY_INDEX = 6;   // Week 0 ends at day 6 (Saturday)
```

New functions:
- `isSessionInWeekZero(sessionDate, firstSessionDate)`: Check if a session is in Week 0
- `initializeWeekZeroIfNeeded(firstSessionDate)`: Initialize Week 0 state for Wed-Sat first sessions

### Adherence Calculation

Updated signature:
```javascript
calculateAdherence(workoutHistory, activePlan, days, weekScheduling)
```

The `weekScheduling` parameter provides Week 0 info to exclude those sessions from adherence.

### Streak Calculation

No changes needed - streak calculation is purely date-based and already handles Week 0 correctly.

## Week Reset Behavior

When a user manually resets their week counter:
1. Week 0 state is cleared (`isWeekZero: false`, `weekZeroStartDate: null`)
2. Current week is reset to 1
3. Cycle start date is set to most recent Sunday
4. **Streak is NOT affected** - streak calculation is date-based and independent of week metadata

## Testing

See `scripts/test-week-zero.js` for comprehensive tests covering:
1. Week 0 creation for Wed-Sat first sessions
2. Streak counting through Week 0
3. Adherence exclusion of Week 0 sessions
4. Transition from Week 0 to Week 1
5. No Week 0 for Sun-Tue first sessions
6. Week reset not breaking streaks
7. User's exact scenario (Saturday cardio first session)

## Migration

Existing users will not be affected:
- Week 0 only applies to NEW users whose first session is Wed-Sat
- Existing users already have a `cycleStartDate` set
- If `weekZeroStartDate` is null, no Week 0 logic applies

## UI Considerations

Components should check `isWeekZero` to:
1. Display "Week 0" instead of "Week 1" in the UI
2. Show appropriate messaging about Week 0 being a partial week
3. Disable or hide workout assignment features during Week 0
4. Show "Adherence tracking starts Week 1" message

Example:
```jsx
{isWeekZero ? (
  <>
    <Typography>Week 0 - Getting Started</Typography>
    <Typography variant="caption">
      Week 1 starts {formatDate(cycleStartDate)}
    </Typography>
  </>
) : (
  <Typography>Week {currentWeek}</Typography>
)}
```

## Key Takeaways

1. ✅ Week 0 sessions **DO** count for streaks
2. ❌ Week 0 sessions **DO NOT** count for adherence
3. ❌ Week 0 **DOES NOT** trigger auto-workout assignment
4. 🔄 Week reset **DOES NOT** affect streak calculation
5. 📅 Week 0 only applies if first session is Wed-Sat
6. 🎯 Week 1 always starts on a Sunday
