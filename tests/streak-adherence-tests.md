# Streak and Adherence Tracking Tests

This document describes the expected behavior of the streak and adherence tracking logic.

## Week 0 Concept

**Week 0** is a special designation for the partial week when a user's first-ever session occurs on Wednesday-Saturday:

- **Creation**: If the first session in the app occurs on Wed, Thu, Fri, or Sat, that partial period (up to the Saturday before the next Sunday) is designated as "Week 0"
- **Week 1 Start**: Week 1 begins on the Sunday after Week 0
- **Streak Counting**: Week 0 sessions count toward streak calculation (consecutive days)
- **Adherence**: Week 0 sessions do NOT count toward adherence metrics
- **Workout Assignment**: Week 0 does NOT trigger automatic workout assignments
- **No Week 0**: If the first session occurs on Sun, Mon, or Tue, there is no Week 0, and Week 1 starts immediately from the most recent Sunday

Example:
- User's first session is on Wednesday, Nov 12
- Sessions on Wed, Thu, Fri, Sat (Nov 12-15) are Week 0
- Week 1 starts on Sunday, Nov 16
- Week 0 sessions count for streak but not adherence

## Streak Calculation

### Business Rules
1. **Current Streak**: Shows the number of consecutive days with at least one session, counting back from the most recent workout
2. **Streak Activation**: A streak is considered "current" if the last session was today or yesterday (within 1 calendar day)
   - This gives users a grace period: if you worked out yesterday, you're still "on" your streak even if you haven't worked out yet today
   - The streak only breaks if you miss both yesterday AND today
3. **Consecutive Days**: Counts individual consecutive calendar days with sessions, crossing week boundaries seamlessly
4. **Week Boundaries**: Uses Sunday-Saturday as week boundaries for the "alive" check only
5. **Strength Training Requirement (Alive Check)**: Each **complete week** (Sunday through Saturday) that is fully contained within the streak must have **at least 3 strength training sessions** for the streak to remain "alive"
   - **Complete weeks**: Any week where all 7 days (Sunday-Saturday) are part of the streak must meet the 3-strength-session requirement
   - **Incomplete weeks**: Partial weeks at the start or end of a streak (e.g., starting on Wednesday, ending on Friday) do NOT need to meet the strength requirement
6. **Day Counting**: Each consecutive calendar day with a session counts as 1 day toward the streak
   - Multiple sessions on the same day count as 1 day
   - Late-night workouts (e.g., 11:30 PM) and early morning workouts (e.g., 12:05 AM next day) correctly count as different days
7. **Longest Streak**: Tracks the maximum consecutive days ever achieved
8. **Timezone Handling**: All dates are normalized to local midnight (00:00:00) for consistent day comparison

### What Counts as Strength Training?
- Full body workouts
- Upper body, lower body workouts
- Push, pull, legs workouts
- Any workout with resistance exercises (if it has exercises field, it's considered strength)

### Test Cases

#### Test 1: Consecutive Days Across Week Boundary (Key Example)
**Setup**: User has 6 sessions starting Saturday, continuing one each day (Sat, Sun, Mon, Tue, Wed, Thu)
**Expected**: 
- Current Streak: 6 days (if recent)
- Example: Saturday (strength) crosses into Sunday (strength), Mon (strength), Tue (strength), Wed (cardio), Thu (strength)
- Week 1 (contains only Saturday): incomplete week, no strength requirement ✓
- Week 2 (contains Sun-Thu, 5 days): incomplete week, no strength requirement ✓
- All days consecutive = 6-day streak

#### Test 2: Complete Week With Insufficient Strength Breaks Streak
**Setup**: Consecutive days spanning a complete week (Sun-Sat) but that week has fewer than 3 strength sessions
**Expected**: 
- Streak breaks at the beginning of the week that doesn't meet the requirement
- Example: Week 1 has 3+ strength sessions, consecutive days continue into Week 2 (Sun-Sat) but Week 2 only has 2 strength sessions
- Streak ends at Saturday of Week 1 (last day before the incomplete week)

#### Test 3: Full Complete Week of Consecutive Sessions
**Setup**: All 7 days of a week (Sun-Sat) have sessions, at least 3 are strength
**Expected**: 
- Current Streak: 7 days
- Week has 3+ strength sessions, requirement met

#### Test 4: Multiple Sessions Same Day
**Setup**: 2 sessions today (1 strength, 1 cardio), 1 session yesterday
**Expected**: 
- Counts unique days only (2 days)
- Strength requirement checked per week: if a day has 2 strength sessions, it counts as 2 toward the weekly requirement

#### Test 5: Streak Continues with Daily Sessions
**Setup**: 10 consecutive days with sessions, each complete week having at least 3 strength sessions
**Expected**: 
- Current Streak: 10 days
- As long as sessions are consecutive and each complete week has 3+ strength, streak continues

#### Test 6: Late-Night Workout Edge Case
**Setup**: Workout at 11:30 PM one day, then workout at 12:05 AM the next day
**Expected**:
- Should count as 2 consecutive days (different calendar days)
- Date normalization ensures these are treated as separate days
- This is correct behavior: crossing midnight creates a new calendar day

#### Test 7: Last Workout 2 Days Ago
**Setup**: User's last session was 2 days ago
**Expected**: 
- Current Streak: 0 (too long ago to be current)
- Longest Streak: [previous value]

#### Test 8: First Session Today
**Setup**: User just logged their first session today
**Expected**: 
- Current Streak: 1
- Longest Streak: 1

#### Test 9: Gap in Sessions Breaks Streak
**Setup**: Sessions for 5 consecutive days, then 1 day gap, then 3 more consecutive days
**Expected**: 
- Two separate streaks (5 days and 3 days)
- Longest streak: 5 days
- Current streak: 3 days (if recent)

#### Test 10: No Sessions
**Setup**: Empty session history
**Expected**: 
- Current Streak: 0
- Longest Streak: 0

#### Test 11: Mixed Session Types
**Setup**: Consecutive days with strength, cardio, HIIT, and yoga/stretch
**Expected**: 
- All session types count toward consecutive days
- Only strength sessions count toward the weekly strength requirement (3 per complete week)
- Each complete week in the streak must have at least 3 strength sessions

#### Test 12: Incomplete Week at Start (New Test)
**Setup**: Streak starts on Wednesday with cardio only, continues through Sunday with strength sessions
**Expected**:
- Wed-Sat is an incomplete week (4 days), no strength requirement
- If the streak continues into the next week and that week is complete (Sun-Sat), it needs 3+ strength sessions
- Incomplete weeks are exempt from the 3-strength-session rule

#### Test 13: Incomplete Week at End (New Test)
**Setup**: Complete week (Sun-Sat) with 3+ strength sessions, streak continues Mon-Wed
**Expected**:
- First week is complete and meets requirement (3+ strength)
- Mon-Wed is an incomplete week (3 days), no strength requirement
- Streak continues as long as days are consecutive

#### Test 14: Week 0 Streak (New Test)
**Setup**: First session on Wednesday, continues through Saturday
**Expected**:
- 4-day streak (Wed-Sat)
- Week 0 sessions count toward streak
- Week 0 is incomplete, exempt from 3-strength requirement

#### Test 15: Week 0 to Week 1 Transition (New Test)
**Setup**: First session on Thursday, continues daily through next Tuesday
**Expected**:
- Streak counts all consecutive days from Thu through Tue
- Thu-Sat = Week 0 (3 days)
- Sun-Tue = partial Week 1 (3 days)
- Total streak = 6 days
- Both partial weeks are incomplete, exempt from strength requirement

#### Test 16: Week Reset Does Not Break Streak (New Test)
**Setup**: 6-day streak Sat-Thu, user resets week counter on Sunday
**Expected**:
- Streak remains 6 days
- Week reset is metadata only, doesn't affect date-based streak calculation
- Each day with a session still counts

## Adherence Calculation

### Business Rules
1. **New Users**: If first session < 30 days ago, calculate adherence based on days since first session
2. **Established Users**: If first session >= 30 days ago, calculate adherence based on last 30 days
3. **Calculation**: Percentage = (Days with any session) / (Total days in period) × 100
4. **All Session Types**: Counts strength, cardio, HIIT, yoga/stretch sessions equally
5. **Week 0 Exclusion**: Week 0 sessions (first sessions Wed-Sat before first Sunday) are excluded from adherence calculation

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

#### Test 8: Week 0 Adherence (New Test)
**Setup**: User's first session on Wednesday, continues Thu-Sat (Week 0 period)
**Expected**: 0% adherence while in Week 0
**Reason**: Week 0 sessions don't count toward adherence

#### Test 9: Week 0 to Week 1 Adherence (New Test)
**Setup**: Week 0 sessions (Wed-Sat), then Week 1 sessions (Sun-Tue)
**Expected**: Adherence calculated only from Week 1 start (Sunday)
**Reason**: Week 0 sessions excluded, only Week 1+ sessions count

#### Test 10: No Week 0 (First Session Sunday-Tuesday)
**Setup**: First session on Monday, continues Tue-Wed
**Expected**: Normal adherence calculation from first session
**Reason**: No Week 0 since first session was Mon (not Wed-Sat)

## UI Features

### Streak Info Icon
- Small help icon (?) appears next to "Day Streak" label
- Clicking opens a dialog explaining streak rules
- Dialog covers:
  - Consecutive day counting (each day with a session = +1 day)
  - Week boundaries (Sunday-Saturday) used only for "alive" check
  - At least 1 strength training session per week requirement
  - What counts as strength training
  - How streaks continue across week boundaries (Saturday → Sunday)
  - When streaks break (missing a day or week without strength)

## Implementation Notes

- Streak calculation counts **individual consecutive days** with sessions
- Crosses week boundaries seamlessly (Saturday → Sunday continues the streak)
- **"Alive" check**: Each week that contains days from the streak must have at least 1 strength training session
- Week boundaries (Sunday-Saturday) are used only for the alive check, not for counting
- Functions handle multiple sessions per day correctly (count as one day)
- All calculations are timezone-safe (set hours to 0, 0, 0, 0)
- Both functions use timestamps (`getTime()`) for date comparisons
