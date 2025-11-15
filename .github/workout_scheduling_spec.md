# Workout App: Weekly Scheduling and Logging System

## System Overview
The app tracks a continuous, indefinite workout program with manual cycle reset capability via settings. Week numbers increment continuously until the user manually resets the cycle. The system provides intelligent workout suggestions, persistent weekly scheduling, and optional deload week insertion.

---

## 1. Week Progression and Display

### Continuous Week Tracking
- **Week Counter**: Increments indefinitely (week 1, 2, 3, 4, 5, 6, 7, 8, etc.)
- **Automatic Trigger**: Week increments every Sunday at midnight (or on app load if current date > last recorded Sunday)
- **No Loop**: Weeks do not reset to 1 automatically; they continue counting upward indefinitely
- **Manual Reset**: User can reset the week counter to 1 via Settings
- **Data Storage**: Track `currentWeek` (integer, no upper limit) and `cycleStartDate` (most recent Sunday) in user state or local storage

### Week Number Display Location and Formatting (Option D: Icon + Number Badge Format)

The header displays the current day and week using a **visual badge-style component** for maximum scannability and modern appearance.

#### Header Format Structure
- **Pattern**: `DAY | WK #`
- **Examples**:
  - `MON | WK 1`
  - `WED | WK 5`
  - `FRI | WK 12`
  - `SUN | WK 47`

#### Visual Implementation
- Use a compact badge or pill-shaped container
- Left side: Full or abbreviated day name (MON, TUE, WED, THU, FRI, SAT, SUN) in a visually distinct style
- Separator: Vertical divider line (|) or use spacing/background to create visual separation
- Right side: Week number prefixed with "WK" (e.g., WK 1, WK 23)
- Optional: Apply subtle background color or border to make the badge stand out from the rest of the header

#### Day Name Decision
Choose one approach:
- **Three-letter abbreviation**: MON, TUE, WED, THU, FRI, SAT, SUN (most compact)
- **Two-letter abbreviation**: MO, TU, WE, TH, FR, SA, SU (ultra-compact, less readable)
- **Full day name in caps**: MONDAY, TUESDAY, WEDNESDAY (most readable, takes more space)

Recommendation: Three-letter abbreviation (MON, TUE, WED, etc.) balances readability and space efficiency.

#### Deload Week Indicator
When deload week is active (week 4+), modify the display:
- **Option 1 - Text Replacement**: `MON | DELOAD` (replaces the week number)
- **Option 2 - Icon Addition**: `MON | WK 4 ↓` (adds down arrow after week number)
- **Option 3 - Badge Color Change**: Keep format as `MON | WK 4` but change badge background color to a distinct deload color (e.g., gold, orange, or a designated deload color from design system)
- **Option 4 - Label Addition**: `MON | WK 4 · DELOAD` (shows both week number and deload label)

Recommendation: **Option 3 (Badge Color Change)** maintains consistency with the badge format while providing clear visual distinction without cluttering the header.

---

## 2. Workout Persistence and Suggestion System

### Favorites-to-Weekly Assignment
Users need a **secondary save action** (distinct from Favorites) that assigns a specific workout session to a specific day of the week:
- **Action 1**: User completes a workout → Favorites button saves it to Favorites list
- **Action 2**: User taps "Assign to Day" → Opens day-picker modal/selector
- **Day Picker Options**: Monday through Sunday
- **Storage**: Save the mapping as `dayOfWeek: { sessionType, sessionName, exerciseList }`
- **Persistence**: These day-of-week assignments persist across week increments

### Automatic Save to Day of Week (Week 1 and First Week After Deload)

In **Week 1 (at app start or after cycle reset)** and **the first week after a deload week**, the system automatically assigns completed workouts to their day of the week without requiring user action.

#### Trigger Conditions
- **Condition 1**: `currentWeek === 1` (first week of a fresh cycle)
- **Condition 2**: `deloadWeekActive === true` and the deload week has just ended (new Sunday has passed, `deloadWeekActive` is now false)

#### Automatic Assignment Logic
- **When user completes a workout** on a specific day (e.g., Monday Upper Body):
  - System automatically stores it as `Monday: { sessionType: UpperBody, sessionName: ..., exercises: [...] }`
  - No "Assign to Day" prompt appears; the save is automatic and silent
  - Favorites button still works independently if user wants to save to Favorites as well

#### User Communication
- Optional confirmation toast/notification: "Saved to Monday" or "Monday workout saved"
- Or save silently with no notification, then display the saved workout in the weekly view
- Consider showing a small indicator (checkmark, highlight) on that day in the weekly calendar view to confirm the save

#### Rationale
- **Week 1**: Bootstraps the weekly schedule by establishing a template pattern for the first cycle
- **First week after deload**: Reestablishes the regular schedule pattern after a recovery week, ensuring continuity

### Manual "Assign to Day" (Weeks 2+, Outside Post-Deload Week 1)

Starting in **Week 2** (after the automatic saves of Week 1), or **in any week after the automatic post-deload week**, users must explicitly tap "Assign to Day" to assign a workout to a specific day of the week. This gives users control over adjusting their schedule as they progress.

### Auto-Suggestion for Weeks 2+
- **Logic**: For any session type (Strength, Upper Body, Lower Body, etc.), check if that day had a logged workout exactly 7 days ago
- **Trigger**: On week load, query the database for the previous week's same day-of-week
- **Display Format**: 
  - `Upper Body` 
  - `Lower Body + Accessories`
  - Shows only if a logged session exists from the previous week on that same day
- **User Interaction**: Suggestion appears as a clickable card/button; user can accept (load that workout) or skip (choose a different session)

---

## 3. Deload Week Insertion

### Deload Trigger and Placement
- **Availability**: Deload functionality appears starting in **week 4**
- **Trigger Location**: User taps the header badge (the `MON | WK 4` badge itself) or a separate icon/button adjacent to it to activate deload mode
- **Functionality**: Tapping activates deload week and then **manually advances to the next week** (the deload week does not automatically increment)
- **User Control**: User can press the deload trigger anytime from week 4 onward (week 4, 5, 6, 7, etc.); they are not locked into a specific week

### Deload Week Behavior
- **Once Activated**: Current week badge changes appearance (background color change per Option 3 recommendation) and displays as `MON | DELOAD` or maintains the week number with color distinction, depending on chosen Option
- **Session Type**: Deload week replaces all scheduled workouts with deload-specific guidance (reduced intensity, lighter weight, or recovery focus)
- **Persistence**: A `deloadWeekActive` flag marks the current week as deload
- **Progression**: After the deload week completes (Sunday passes), the week counter increments normally to the next week, and `deloadWeekActive` is set to false
- **Post-Deload Automatic Save**: The first week after deload (when `deloadWeekActive` transitions from true to false) triggers automatic "Assign to Day" behavior again (see Section 2 for details)
- **Repeatable**: User can trigger deload again from any future week 4+

---

## 4. Session Type Classification and Logging

### Exact Session Logging (Strength-Based Sessions)
Apply to: Upper Body, Lower Body, Full Body, Push/Pull/Legs, etc.
- **Save Method**: "Assign to Day" creates a day-of-week binding; or automatic save in Week 1 and first post-deload week
- **Data Saved**: Specific exercises, sets, reps, weights, order, and any notes
- **Recall**: When that day is revisited, the exact session is suggested and can be loaded

### General Category Logging (Cardio and Yoga)
Apply to: Cardio (HIIT, steady-state, etc.), Yoga, mobility work
- **Save Method**: Simple category assignment without session details (automatic or manual)
- **Data Saved**: Only the session type (e.g., `Friday: Yoga` or `Tuesday: Cardio HIIT`)
- **Recall**: When that day appears, only the session type is noted; user selects specific workout within that category fresh each time
- **Rationale**: Cardio and Yoga are less structured and benefit from variation week-to-week

### Rest Days and Non-Workout Days
- **Treatment**: Assign as a day category (`Saturday: Rest Day`) with no session details stored
- **Display**: Shows as scheduled event but does not populate with any exercises or recommendations

---

## 5. Data Structure (Conceptual)

### State/Storage Keys
```
currentWeek: number (1, 2, 3, 4, ... no upper limit)
cycleStartDate: timestamp (most recent Sunday)
deloadWeekActive: boolean
weeklySchedule: {
  Monday: { sessionType: string, sessionName?: string, exercises?: array },
  Tuesday: { sessionType: string, sessionName?: string, exercises?: array },
  ...
  Sunday: { sessionType: string }
}
workoutHistory: [{ date, dayOfWeek, sessionType, sessionName, exercises, notes }]
favorites: [{ id, sessionName, exercises, notes }]
```

### Session Type Values
- Strength variants: `UpperBody`, `LowerBody`, `FullBody`, `Push`, `Pull`, `Legs`, `Accessories`
- Cardio variants: `CardioHIIT`, `CardioSteadyState`, `CardioMixed`
- Mobility/Recovery: `Yoga`, `Mobility`, `RestDay`, `ActiveRecovery`
- Deload: `Deload`

---

## 6. User Flow Summary

1. **App loads on Week 1** → Check current date against `cycleStartDate` → Update `currentWeek` if Sunday has passed
2. **Header displays** → Badge format showing `MON | WK 1`, `WED | WK 5`, etc.
3. **User completes workout in Week 1** → System automatically assigns to day of week (e.g., Monday: Upper Body); no user action required
4. **Week 1 ends, transitions to Week 2** → Automatic assignment is disabled; manual workflow begins
5. **User completes workout in Week 2+** → Saves to Favorites; tap "Assign to Day" to bind to specific day of week
6. **Next week, same day loads** → Auto-suggests previous week's session (if applicable)
7. **Week 4+ user can trigger deload** → Taps header badge or adjacent deload trigger; current week converts to deload (badge changes color); after deload week ends (next Sunday), week counter increments and cycle continues normally
8. **First week after deload** → System automatically assigns completed workouts to their day of week again; manual assignment resumes in the following week
9. **User can trigger deload again** → At any future week 4+, user can activate another deload week
10. **User resets cycle in Settings** → `currentWeek` resets to 1, `cycleStartDate` updates to current Sunday, badge returns to normal styling; automatic assignment is re-enabled for Week 1
11. **Cardio/Yoga sessions** → Stored by category only; no specific session persistence week-to-week

---

## 7. Implementation Considerations

- **Week Boundary**: Define Sunday at midnight as the cycle boundary; consider timezone handling if multi-device sync is needed
- **Continuous Counting**: `currentWeek` has no upper limit; it increments indefinitely until manual reset
- **Header Badge Component**: Create a reusable badge component that displays `DAY | WK #` format consistently. Consider using a CSS class or design token for consistent styling across the app.
- **Day Name Localization**: If supporting multiple languages, ensure three-letter day abbreviations are localized (e.g., `LUN` for Monday in French, `LU` in German). Consider using native locale APIs for automatic translation.
- **Deload Visual Design**: Choose a distinct color from your design system for deload badge state (Option 3). Ensure sufficient color contrast for accessibility. Test with users to confirm the visual distinction is immediately recognizable.
- **Deload Trigger Affordance**: Make it clear that the badge is interactive when deload is available (week 4+). Consider a subtle animation, tooltip, or icon hint to signal that the badge is tappable.
- **Automatic Save Flag**: Implement a state variable or config flag `isAutoSaveWeek` that is true only in Week 1 and the first week after deload. This prevents accidental overwrites in regular weeks.
- **Automatic Save Notifications**: Decide on notification strategy: silent save, toast confirmation, or subtle visual indicator. Test with users to ensure they understand their workout has been saved to a specific day.
- **Manual Reset Entry Point**: In Settings, provide a clear "Reset Week Counter to 1" button; confirm with user before executing. Confirm that this action will re-enable automatic assignment for the new Week 1.
- **Suggestion Fallback**: If no previous week session exists, display day empty or show a "Start New Session" prompt
- **History Tracking**: Maintain a complete log of all sessions for analytics and user insights
- **Favorites Independence**: Favorites list remains separate from weekly assignments; a session can be in Favorites without being assigned to a specific day, and vice versa
- **Badge Responsiveness**: Test badge sizing and truncation on small mobile screens. If space is severely constrained, consider alternative layouts (vertical stacking: `MON` over `WK 1`) or ensure proper text overflow handling
