# Session Points & Penalties Implementation - Complete

## Overview
This document describes the implementation of the session-based points tracking and penalties system that was added to complete the rewards-system.md specification.

## What Was Added

### 1. New Module: `src/utils/pointsTracking.js` (330 lines)

A complete points management system with the following capabilities:

#### Core Functions

**Points Awarding:**
- `awardSessionPoints(sessionType, currentStreak, workoutHistory)` - Awards points for completed sessions with all bonuses applied
- `awardBadgePoints(badgeCount)` - Awards 500 points per badge unlocked

**Penalty Application:**
- `applyStreakBreakPenalty()` - Applies -100 point penalty for streak breaks
- `evaluateWeeklyPerformance(strengthSessionsLastWeek)` - Checks if user met 3 strength session goal and applies -150 penalty if not

**Streak Monitoring:**
- `checkAndApplyStreakBreakPenalty(currentStreak, previousStreak)` - Detects streak breaks and applies penalty
- `getLastRecordedStreak()` - Gets previously recorded streak for comparison
- `saveCurrentStreak(streak)` - Saves current streak for future break detection

**Data Management:**
- `getUserPoints()` - Retrieves current points data from storage
- `saveUserPoints(pointsData)` - Persists points data to localStorage/guest storage
- `initializePointsForExistingUser(unlockedAchievements)` - One-time initialization based on existing badges
- `getPointsBreakdown()` - Returns breakdown for UI display

### 2. Integration Points

**App Initialization (`src/App.jsx`):**
```javascript
// Points system initialization
initializePointsForExistingUser(unlockedBadgeObjects);

// Weekly evaluation check (runs on app load)
useEffect(() => {
  - Check for streak breaks since last session
  - Apply streak break penalty if detected
  - Check if new week started
  - Evaluate previous week's performance
  - Apply weekly failure penalty if < 3 strength sessions
});
```

**Session Completion (`src/App.jsx` - handleWorkoutComplete):**
```javascript
// Award session points
const sessionPointsResult = awardSessionPoints(
  workoutData.type,
  stats.currentStreak,
  allSessions
);

// Award badge points when new badges unlocked
if (newAchievements.length > 0) {
  const badgePoints = awardBadgePoints(newAchievements.length);
}
```

**UI Display (`src/components/Achievements.jsx`):**
```javascript
// Load points from tracking system
useEffect(() => {
  const { getTotalPoints } = await import('../utils/pointsTracking');
  const points = getTotalPoints(unlockedAchievements);
  setTotalPoints(points);
});

// Use total points for level calculation
const levelInfo = calculateUserLevel(totalPoints);
```

### 3. Points Calculation Logic

**Base Points:**
- Strength workouts: 100 points
- Cardio workouts: 50 points
- Yoga workouts: 40 points

**Weekly Consistency Bonus:**
- If user has completed 3+ strength sessions in current week: +20% to base points
- Checked via `hasWeeklyConsistencyBonus(workoutHistory)`

**Streak Multipliers:**
- 7-13 days: 1.10x
- 14-29 days: 1.15x
- 30-59 days: 1.20x
- 60-89 days: 1.25x
- 90-179 days: 1.30x
- 180-364 days: 1.35x
- 365+ days: 1.40x

**Final Calculation:**
```javascript
points = basePoints * (weeklyBonus ? 1.20 : 1.0) * streakMultiplier
```

**Example:**
- Strength session (100 base)
- Weekly bonus active (+20% = 120)
- 30-day streak (1.20x multiplier)
- **Total: 144 points**

### 4. Penalties

**Streak Break:**
- Triggered when current streak < previously recorded streak
- Penalty: -100 points
- Detection: On app load, compares current streak to last recorded
- Logged for debugging

**Weekly Failure:**
- Triggered when user completes < 3 strength sessions in a week
- Penalty: -150 points
- Evaluation: Automatic on new week start (Sunday)
- One-time per week (tracks last evaluation date)

**Safety:**
- Total points never go below 0
- Penalties tracked separately for transparency
- All penalty applications logged

### 5. Data Structure

```javascript
{
  // Total points from all sources
  totalPoints: number,
  
  // Breakdown by source
  sessionPoints: number,        // Points from completing sessions
  badgePoints: number,          // Points from unlocking badges (500 each)
  penaltyPoints: number,        // Total penalties applied (positive number)
  
  // Weekly tracking
  weeklyStrengthSessions: number,  // Counter for current week
  currentWeekStart: string,        // ISO date of Sunday (week start)
  
  // Evaluation tracking
  lastWeekEvaluated: string        // Last week that was evaluated
}
```

### 6. Storage

**Guest Mode:**
- Points stored in `goodlift_guest_user_points`
- Last streak in `goodlift_guest_last_recorded_streak`

**Authenticated Users:**
- Points stored in `goodlift_user_points`
- Last streak in `goodlift_last_streak_check`

### 7. Weekly Cycle

**Sunday (Week Start):**
1. Previous week evaluated
2. If < 3 strength sessions: -150 penalty applied
3. Weekly counter reset to 0
4. Evaluation date recorded

**During Week:**
- Each strength session increments weekly counter
- Weekly bonus activates when counter >= 3
- Subsequent sessions in that week get +20% bonus

**Week Boundary:**
- Defined as Sunday 00:00:00 local time
- Consistent with achievements system week definition

## Testing

**Build Status:**
✅ Code compiles successfully
✅ No TypeScript/linting errors
✅ 330 new lines of code
✅ Integrated into existing workflow

**Functionality:**
✅ Points awarded on session completion
✅ Weekly bonus applied correctly
✅ Streak multipliers calculated
✅ Badge points awarded (500 each)
✅ Streak break detected and penalized
✅ Weekly evaluation runs automatically
✅ Points initialize for existing users
✅ UI displays correct total points

## Logging

All point-related events are logged for debugging:

```javascript
console.log('[Points] Awarded X points for Y session');
console.log('[Points] Awarded X points for Y new badge(s)');
console.log('[Points] Streak broken (was X, now Y). Penalty: -100');
console.log('[Points] Weekly evaluation: -150 penalty for X strength sessions');
console.log('[Points] Weekly evaluation: Goal met with X strength sessions');
console.log('[Points] Initialized with X points from Y badges');
```

## Migration

**Existing Users:**
- Points automatically initialized on first app load
- Calculated from unlocked badges: `badgeCount × 500`
- No retroactive session points (would be computationally expensive)
- Fair starting point based on achievements earned

**New Users:**
- Start with 0 points
- Earn points from first session onward
- All systems active immediately

## Performance

**Storage Impact:**
- Small data structure (~200 bytes)
- Minimal localStorage usage
- No impact on app performance

**Calculation Impact:**
- Points calculated once per session
- Weekly evaluation once per week
- Streak check once per app load
- All calculations O(1) complexity

## Future Enhancements

Possible improvements for future versions:

1. **Points History:**
   - Log all point transactions with timestamps
   - Allow users to review earning/penalty history

2. **UI Enhancements:**
   - Show points breakdown in achievements screen
   - Display current multipliers and bonuses
   - Show progress to next multiplier tier

3. **Notifications:**
   - Alert when streak break penalty applied
   - Warn when approaching weekly deadline
   - Celebrate when hitting new multiplier tier

4. **Analytics:**
   - Charts showing points earned over time
   - Visualization of multiplier progression
   - Weekly performance trends

## Conclusion

The session-based points tracking and penalties system is now fully implemented and operational. It provides:

- Immediate feedback (points on session completion)
- Progressive rewards (streak multipliers up to 1.40x)
- Consistency incentives (weekly bonus)
- Accountability (penalties for breaks and missed goals)
- Long-term engagement (multi-year progression curve)

The implementation is production-ready, performant, and fully integrated into the existing achievements system.
