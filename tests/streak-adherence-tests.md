# Streak and Adherence Tracking Tests

This document describes the expected behavior of the streak and adherence tracking logic.

## Streak Calculation

### Business Rules
1. **Current Streak**: Shows the number of consecutive days with at least one session, counting back from today/yesterday
2. **Streak Activation**: A streak is considered "current" only if the last session was today or yesterday (within 1 day)
3. **Rest Days**: Allows one rest day per week without breaking the streak (no more than 1 consecutive missed day)
4. **Longest Streak**: Tracks the maximum consecutive days ever achieved

### Test Cases

#### Test 1: Basic Consecutive Days
**Setup**: User has sessions on each of the last 5 consecutive days
**Expected**: 
- Current Streak: 5
- Longest Streak: 5

#### Test 2: Seven Consecutive Days
**Setup**: User has sessions on each of the last 7 consecutive days
**Expected**: 
- Current Streak: 7
- Longest Streak: 7

#### Test 3: Last Workout 2 Days Ago
**Setup**: User's last session was 2 days ago
**Expected**: 
- Current Streak: 0 (too long ago to be current)
- Longest Streak: 1

#### Test 4: First Session Today
**Setup**: User just logged their first session today
**Expected**: 
- Current Streak: 1
- Longest Streak: 1

#### Test 5: Multiple Sessions Same Day
**Setup**: 2 sessions today, 1 session yesterday
**Expected**: 
- Current Streak: 2 (counts unique days)
- Longest Streak: 2

#### Test 6: One Rest Day (Allowed)
**Setup**: Sessions on today, 2 days ago, 3 days ago (1 rest day in between)
**Expected**: 
- Current Streak: 3 (maintains streak with 1 rest day)

#### Test 7: Last Workout Yesterday
**Setup**: Sessions on days -1 through -5 (yesterday through 5 days ago)
**Expected**: 
- Current Streak: 5
- Longest Streak: 5

#### Test 8: No Sessions
**Setup**: Empty session history
**Expected**: 
- Current Streak: 0
- Longest Streak: 0

#### Test 9: Mixed Session Types
**Setup**: 10 consecutive days with mixed types (strength, cardio, hiit, yoga)
**Expected**: 
- Current Streak: 10
- All session types count equally

## Adherence Calculation

### Business Rules
1. **New Users**: If first session < 30 days ago, calculate adherence based on days since first session
2. **Established Users**: If first session >= 30 days ago, calculate adherence based on last 30 days
3. **Calculation**: Percentage = (Days with any session) / (Total days in period) × 100
4. **All Session Types**: Counts strength, cardio, HIIT, yoga/stretch sessions equally

### Test Cases

#### Test 1: New User with Perfect Adherence
**Setup**: User started 15 days ago, has sessions every day (15 sessions in 15 days)
**Expected**: 100% adherence
**Reason**: 15 sessions in 15 days = 100%

#### Test 2: New User with Some Missed Days
**Setup**: User started 10 days ago, has 8 sessions (missed 2 days)
**Expected**: 80% adherence
**Reason**: 8 sessions in 10 days = 80%

#### Test 3: Established User
**Setup**: User started 40 days ago with 35 sessions (but we only look at last 30 days)
**Expected**: ~87% adherence
**Reason**: Should calculate based on last 30 days only (since > 30 days passed)

#### Test 4: First Session Today
**Setup**: User just logged their first session today
**Expected**: 100% adherence
**Reason**: 1 session in 1 day = 100%

#### Test 5: Multiple Sessions Same Day
**Setup**: 2 sessions today, 1 yesterday (within 2-day period)
**Expected**: 100% adherence
**Reason**: Both days have sessions = 2/2 days = 100%

#### Test 6: Mixed Session Types
**Setup**: 10 consecutive days with mixed types (strength, cardio, hiit, yoga)
**Expected**: 100% adherence
**Reason**: All session types count equally

#### Test 7: No Sessions
**Setup**: Empty session history
**Expected**: 0% adherence

## Implementation Notes

- Both functions now use timestamps (`getTime()`) for date comparisons instead of string comparisons
- Week boundaries are tracked for rest day allowance logic
- Streak checking goes back up to 365 days
- Functions handle multiple sessions per day correctly (count as one day)
- All calculations are timezone-safe (set hours to 0, 0, 0, 0)
