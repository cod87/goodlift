# Streak and Adherence Tracking Tests

This document describes the expected behavior of the streak and adherence tracking logic.

## Streak Calculation

### Business Rules
1. **Current Streak**: Shows the number of consecutive days with at least one session, counting back from today/yesterday
2. **Streak Activation**: A streak is considered "current" only if the last session was today or yesterday (within 1 day)
3. **Calendar Week Blocks**: Uses Sunday-Saturday as fixed week boundaries
4. **Rest Days**: Allows **one missed day per calendar week** (Sunday-Saturday block)
5. **Week Counting**: A week with 6 or 7 sessions counts as a full 7-day week in the streak
6. **Longest Streak**: Tracks the maximum consecutive days ever achieved

### Test Cases

#### Test 1: Full Week with One Missed Day
**Setup**: User has 6 sessions in a complete week (Sun-Sat), missing one day
**Expected**: 
- Current Streak: 7 (counts as full week)
- Example: Mon, Tue, Thu, Fri, Sat, Sun (Wed skipped) = 7-day streak

#### Test 2: Two Weeks with One Missed Day Each
**Setup**: Two consecutive weeks, each with 6 sessions
**Expected**: 
- Current Streak: 14 (7 + 7)
- Each week allows one missed day

#### Test 3: Week with Two Missed Days
**Setup**: Only 5 sessions in a week
**Expected**: 
- Current Streak: 5 (only actual sessions count, streak breaks)
- More than one missed day breaks the streak

#### Test 4: Partial Week (In Progress)
**Setup**: Current week has 5 sessions, but week not complete yet
**Expected**: 
- Current Streak: 5 (actual sessions so far)
- Once week completes with 6+ total, will count as 7

#### Test 5: Last Workout 2 Days Ago
**Setup**: User's last session was 2 days ago
**Expected**: 
- Current Streak: 0 (too long ago to be current)
- Longest Streak: [previous value]

#### Test 6: First Session Today
**Setup**: User just logged their first session today
**Expected**: 
- Current Streak: 1
- Longest Streak: 1

#### Test 7: Multiple Sessions Same Day
**Setup**: 2 sessions today, 1 session yesterday
**Expected**: 
- Counts unique days only (2 days)
- Continues with normal week rules

#### Test 8: No Sessions
**Setup**: Empty session history
**Expected**: 
- Current Streak: 0
- Longest Streak: 0

#### Test 9: Mixed Session Types
**Setup**: Week with mixed types (strength, cardio, hiit, yoga)
**Expected**: 
- All session types count equally
- Week rules apply regardless of type

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

- Streak calculation uses **calendar week boundaries** (Sunday = week start)
- Weeks with 6 or 7 sessions count as **full 7-day weeks** in the streak
- Week boundaries are fixed, not rolling
- Functions handle multiple sessions per day correctly (count as one day)
- All calculations are timezone-safe (set hours to 0, 0, 0, 0)
- Both functions now use timestamps (`getTime()`) for date comparisons
