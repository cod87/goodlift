# Streak and Adherence Tracking Tests

This document describes the expected behavior of the streak and adherence tracking logic.

## Streak Calculation

### Business Rules
1. **Current Streak**: Shows the number of consecutive days, counting back from the most recent workout
2. **Streak Activation**: A streak is considered "current" if the last session was today or yesterday (within 1 calendar day)
   - This gives users a grace period: if you worked out yesterday, you're still "on" your streak even if you haven't worked out yet today
   - The streak only breaks if you miss both yesterday AND today
3. **Week Block Rule**: For any given standard week block (Sunday through Saturday), users are allowed **only ONE day** that counts as either an "unlogged day" or a "rest day" without breaking their streak
   - **Unlogged day**: A day where no session was logged
   - **Rest day**: A day where a session with type 'rest' was logged
   - If a week block has more than 1 skip day (rest or unlogged), the streak breaks
4. **Streak Breaking Conditions**:
   - If a user does not log any session for **TWO days** in the same week block (Sun-Sat), the streak breaks
   - If a user logs a rest day AND has an unlogged day in the same week block, the streak breaks
   - If a user logs **TWO rest days** in the same week block, the streak breaks
5. **Cross-Week Allowance**: Multiple rest/unlogged days across different week blocks are allowed (one per week)
6. **Day Counting**: Each calendar day counts as 1 day toward the streak
   - Multiple sessions on the same day count as 1 day
   - Late-night workouts (e.g., 11:30 PM) and early morning workouts (e.g., 12:05 AM next day) correctly count as different days
7. **Longest Streak**: Tracks the maximum consecutive days ever achieved
8. **Timezone Handling**: All dates are normalized to local midnight (00:00:00) for consistent day comparison

### What Counts as a Rest Day?
- A session with type 'rest' (explicitly marked as rest day)

### What Counts as an Unlogged Day?
- A day with no session logged at all

### Test Cases

#### Test 1: All 7 Days of a Week with Sessions (No Skip Days)
**Setup**: User has sessions every day from Sunday to Saturday (all strength)
**Expected**: 
- Longest Streak: 7 days
- No skip days, week is fully valid

#### Test 2: Week with 1 Unlogged Day (No Session Wednesday)
**Setup**: User has sessions Sun-Tue, Thu-Sat but no session on Wednesday
**Expected**: 
- Longest Streak: 7 days
- One unlogged day is allowed per week block

#### Test 3: Week with 1 Rest Day (Wednesday is Rest Session)
**Setup**: User has sessions every day, but Wednesday is a rest-type session
**Expected**: 
- Longest Streak: 7 days
- One rest day is allowed per week block

#### Test 4: Week with 2 Unlogged Days (No Session Wed AND Thu) - BREAKS STREAK
**Setup**: User has sessions Sun-Tue, Fri-Sat but no sessions on Wednesday and Thursday
**Expected**: 
- Longest Streak < 7 days
- Two unlogged days in the same week breaks the streak

#### Test 5: Week with 1 Rest Day AND 1 Unlogged Day - BREAKS STREAK
**Setup**: User has sessions Sun-Tue, Fri-Sat, Wednesday is rest, Thursday has no session
**Expected**: 
- Longest Streak < 7 days
- One rest day + one unlogged day in the same week exceeds the limit

#### Test 6: Week with 2 Rest Days - BREAKS STREAK
**Setup**: User has sessions every day, but Wednesday AND Thursday are rest-type sessions
**Expected**: 
- Longest Streak < 7 days
- Two rest days in the same week exceeds the limit

#### Test 7: Two Consecutive Weeks, Each with 1 Skip Day
**Setup**: Two weeks of sessions, each week has one unlogged day (e.g., Wednesday skipped both weeks)
**Expected**: 
- Longest Streak: 14 days
- Each week is allowed one skip day, so the streak continues across weeks

#### Test 8: Empty Workout History
**Setup**: No sessions logged
**Expected**: 
- Current Streak: 0
- Longest Streak: 0

#### Test 9: Single Session Today
**Setup**: User just logged their first session today
**Expected**: 
- Current Streak: 1
- Longest Streak: 1

#### Test 10: Sessions Yesterday and Today
**Setup**: User has sessions on yesterday and today
**Expected**: 
- Current Streak: 2
- Longest Streak: 2

#### Test 11: Last Session Was 2 Days Ago (Beyond Grace Period)
**Setup**: User's last session was 2 days ago
**Expected**: 
- Current Streak: 0 (too long ago to be current)
- Longest Streak: [previous value]

#### Test 12: Late-Night Workout Edge Case
**Setup**: Workout at 11:30 PM one day, then workout at 12:05 AM the next day
**Expected**:
- Should count as 2 consecutive days (different calendar days)
- Date normalization ensures these are treated as separate days
- This is correct behavior: crossing midnight creates a new calendar day

#### Test 13: Mixed Session Types in Week
**Setup**: Week with strength, cardio, HIIT, yoga sessions (no rest sessions, no unlogged days)
**Expected**: 
- All non-rest session types count as active days
- Streak is valid for all 7 days

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

## UI Features

### Streak Info Icon
- Small help icon (?) appears next to "Day Streak" label
- Clicking opens a dialog explaining streak rules
- Dialog covers:
  - Week block rule: Only 1 rest/unlogged day allowed per week (Sun-Sat)
  - What counts as a rest day (session with type 'rest')
  - What counts as an unlogged day (no session logged)
  - How streaks continue across week boundaries
  - When streaks break (2+ skip days in same week)

## Implementation Notes

- Streak calculation counts calendar days from first session to most recent
- **Week Block Rule**: Each week block (Sunday-Saturday) allows at most 1 "skip day" (rest or unlogged)
- A "skip day" is either: a day with no session, OR a day with only rest-type session(s)
- If a week has 2+ skip days (any combination), the streak is invalid for ranges including that week
- Crosses week boundaries seamlessly (Saturday → Sunday continues the streak) as long as each week respects the 1 skip day limit
- Functions handle multiple sessions per day correctly (count as one day)
- All calculations are timezone-safe (set hours to 0, 0, 0, 0)
- Both functions use timestamps (`getTime()`) for date comparisons
