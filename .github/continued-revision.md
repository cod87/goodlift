# GoodLift App Overhaul: Interconnectivity, Session Flow, Navigation & Compactness

## Overview & Vision

The app has excellent UI/UX foundations but needs:
1. **Tight interconnectivity**: Weekly plans, individual workouts, HIIT sessions, yoga sessions, and progress tracking must all be connected—not independent silos
2. **Exercise-by-exercise flow for all modalities**: HIIT and Yoga must walk users through each movement one-by-one with timers, just like strength workouts
3. **Navigation restructure**: Workout page becomes home; progress page becomes analytics; consolidated navigation
4. **Aggressive compactness**: Page titles, headers, and unused whitespace removed; information density increased
5. **Clickable plan integration**: Tapping a day in the plan view directs to that workout with proper context

---

## Critical Architecture: Plan-Workout Interconnectivity

### The Problem (Current State)
- Weekly plan view on SelectionScreen is decorative—tapping a day doesn't load that workout
- ProgressScreen has its own calendar that's disconnected from the SelectionScreen plan
- HIIT and Yoga sessions don't walk through exercises/poses one-by-one
- No unified data flow between planning, execution, and tracking

### The Solution (Proposed)
Create a **unified workout execution flow** where:

1. **Weekly plans are authoritative**: All workouts are generated from/tied to the weekly plan
2. **Plan → Workout → Session → Progress**: Each level connects downward
3. **Progress → Plan**: Tapping a session in progress calendar opens that day's plan item
4. **All modalities execute identically**: Strength, HIIT, and Yoga follow exercise-by-exercise flow
5. **Plan IDs flow through everything**: Every workout, session, and progress entry has a `planDay` reference

### New Data Structure

**Weekly Plan (localStorage + Firebase)**:
```javascript
{
  planId: "plan_2025_week_45",
  planStyle: "ppl", // "ppl" | "upper_lower"
  startDate: "2025-11-09",
  endDate: "2025-11-15",
  days: [
    {
      dayIndex: 0, // Mon
      type: "strength", // "strength" | "hiit" | "yoga" | "rest"
      subtype: "push", // "push", "pull", "legs", "upper", "lower", "full"
      focus: "strength", // "strength" | "hypertrophy" | "power"
      includes: ["strength", "cardio"], // array of modalities
      estimatedDuration: 60,
      generatedWorkout: { /* full workout object */ },
      completedSessions: [ /* array of logged workouts */ ]
    },
    // ... 7 days total
  ]
}
```

**Workout Session (logged during/after workout)**:
```javascript
{
  sessionId: "session_2025_11_09_push",
  planId: "plan_2025_week_45",
  planDay: 0, // which day in the plan
  type: "strength",
  subtype: "push",
  date: "2025-11-09",
  duration: 58,
  exercises: [
    { 
      name: "Bench Press",
      sets: [
        { weight: 185, reps: 8 },
        { weight: 185, reps: 8 },
        { weight: 190, reps: 6 } // progressive overload
      ]
    }
  ],
  cardio: { type: "hiit", duration: 15, sessions: [...] }
}
```

---

## Priority 1: Navigation Restructure

### Current Navigation
- Home (SelectionScreen)
- Workouts (WorkoutScreen) 
- Progress (ProgressScreen)
- Profile

### New Navigation
```
┌─ Bottom/Side Navigation ────────────────────┐
│ ┌──────────────────────────────────────┐   │
│ │ [⚡ Workouts] [📊 Progress] [👤 Me] │   │
│ └──────────────────────────────────────┘   │
│                                            │
│ Default route: /workouts (not /home)       │
│ SelectionScreen becomes WorkoutHomeScreen  │
│ ProgressScreen remains but tab renamed     │
└────────────────────────────────────────────┘
```

**Implementation**:
1. Rename route from `/home` to `/workouts`
2. Set `/workouts` as default/root route
3. Change navigation label from "Home" to "Workouts"
4. Change ProgressScreen tab label from "Home" to "Progress"
5. Update routing in App.jsx and NavigationSidebar.jsx

---

## Priority 2: Compactness Overhaul (Across All Screens)

### Page Title Compactness

**Current Pattern** (takes up 60-80px):
```
┌──────────────────────────────┐
│ Workouts                     │
│                              │
│ View your upcoming workouts  │
│ and track progress           │
└──────────────────────────────┘
```

**New Compact Pattern** (takes up 30-40px):
```
┌──────────────────────────────┐
│ ⚡ Workouts                  │
└──────────────────────────────┘
```

**Changes Across All Screens**:
- Remove subtitle text (e.g., "View your upcoming workouts...")
- Use icon + title only
- Reduce header padding: `py: 2` → `py: 1`
- Reduce title font size slightly: `h4` → `h5` or `h6`
- No background color (merge with body)

**Files to Modify**:
1. `SelectionScreen.jsx` - Remove subtitle, compress header
2. `WorkoutScreen.jsx` - Compact exercise title header
3. `ProgressScreen.jsx` - Compact title + remove descriptive text
4. `ProfileScreen.jsx` - Compact title
5. `YogaScreen.jsx`, `HIITScreen.jsx` - Compact titles
6. Create `useCompactHeader()` hook to standardize

### Header Component (New)

Create `src/components/Common/CompactHeader.jsx`:
```jsx
import { Typography, Box } from '@mui/material';

const CompactHeader = ({ 
  title, 
  icon, 
  action 
}) => (
  <Box sx={{ 
    display: 'flex', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    py: 1, // compact padding
    px: 2,
    borderBottom: '1px solid', 
    borderColor: 'divider'
  }}>
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      {icon && <span>{icon}</span>}
      <Typography variant="h6" sx={{ fontSize: '1.1rem' }}>
        {title}
      </Typography>
    </Box>
    {action && action}
  </Box>
);

export default CompactHeader;
```

**Usage**:
```jsx
<CompactHeader 
  title="Workouts"
  icon="⚡"
  action={<IconButton>...</IconButton>}
/>
```

---

## Priority 3: Session-by-Session Execution (HIIT & Yoga)

### Current Problem
- HIIT and Yoga sessions might show a list of all exercises/poses upfront
- No per-exercise/pose flow like strength training
- No integrated timers for each movement

### Solution: Unified Session Executor

Create `src/components/SessionExecutor/SessionExecutor.jsx` - A universal component for any modality:

**How It Works**:
```
1. Modal/Screen opens with session type
2. Shows exercise/pose 1 of N
3. User logs data (weight/reps for strength, form notes for yoga, just timing for HIIT)
4. Rest timer displays (if applicable)
5. Auto-advance to next exercise
6. On completion, show summary + save
```

### HIIT Session Flow

**Component**: `src/components/HIIT/HIITSessionScreen.jsx`

**State Machine**:
```
START
  ↓
EXERCISE_PREVIEW (Show exercise name + form demo GIF)
  ↓
WORK_TIMER (Countdown with large animation)
  ↓
REST_TIMER (Countdown between exercises)
  ↓
NEXT_EXERCISE? (If yes, back to EXERCISE_PREVIEW; if no, SUMMARY)
  ↓
SUMMARY (Show total rounds completed + save)
```

**Data Structure**:
```javascript
{
  sessionId: "hiit_2025_11_09",
  planId: "plan_2025_week_45",
  planDay: 4, // Friday
  type: "hiit",
  exercises: [
    {
      name: "Jump Rope",
      duration: 30, // seconds work
      rest: 15,
      reps: null,
      gif: "..." // demo video URL
    },
    {
      name: "Burpees",
      duration: 30,
      rest: 15,
      gif: "..."
    }
    // ... total of 12 exercises in 5 rounds
  ],
  completedRounds: 5,
  totalDuration: 22, // minutes
  notes: "Felt strong today"
}
```

**UI Design** (Compact):
```
┌──────────────────────────────────┐
│ Round 3 of 5  |  3:22 elapsed    │
├──────────────────────────────────┤
│                                  │
│         JUMP ROPE                │
│                                  │
│            30 SECONDS            │
│         [20] → 19 ← 18          │ (countdown)
│                                  │
├──────────────────────────────────┤
│ Next: Burpees                    │
│ ┌──────────────────────────────┐ │
│ │ [Pause]  [Skip]  [Exit]     │ │
│ └──────────────────────────────┘ │
└──────────────────────────────────┘
```

**Implementation** (Pseudocode):
```javascript
export const HIITSessionScreen = ({ session, onComplete }) => {
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [currentRound, setCurrentRound] = useState(1);
  const [isWorking, setIsWorking] = useState(true);
  const [secondsRemaining, setSecondsRemaining] = useState(
    isWorking ? session.exercises[currentExerciseIndex].duration : 
              session.exercises[currentExerciseIndex].rest
  );
  
  useEffect(() => {
    const interval = setInterval(() => {
      setSecondsRemaining(prev => {
        if (prev <= 1) {
          // Time's up
          if (isWorking) {
            // Switch to rest period
            setIsWorking(false);
            playAudio('rest-starting');
            return session.exercises[currentExerciseIndex].rest;
          } else {
            // Rest done, move to next exercise
            if (currentExerciseIndex < session.exercises.length - 1) {
              setCurrentExerciseIndex(prev => prev + 1);
              setIsWorking(true);
              playAudio('next-exercise');
              return session.exercises[currentExerciseIndex + 1].duration;
            } else {
              // All exercises done
              if (currentRound < session.rounds) {
                // Start next round
                setCurrentRound(prev => prev + 1);
                setCurrentExerciseIndex(0);
                setIsWorking(true);
                playAudio('round-complete');
                return session.exercises[0].duration;
              } else {
                // Session complete
                handleSessionComplete();
              }
            }
          }
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(interval);
  }, [isWorking, currentExerciseIndex, currentRound]);
  
  return (
    <Box sx={{ py: 2, px: 2, textAlign: 'center' }}>
      <CompactHeader title={`HIIT Session`} />
      
      <Box sx={{ mt: 3, mb: 3 }}>
        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
          Round {currentRound} of {session.rounds} | 
          Exercise {currentExerciseIndex + 1} of {session.exercises.length}
        </Typography>
      </Box>
      
      <Typography sx={{ fontSize: '0.9rem', mb: 1, color: 'text.secondary' }}>
        {isWorking ? 'WORK' : 'REST'}
      </Typography>
      
      <Typography variant="h3" sx={{ mb: 3 }}>
        {session.exercises[currentExerciseIndex].name}
      </Typography>
      
      <Box sx={{ 
        width: '200px', 
        height: '200px', 
        margin: '0 auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: '50%',
        border: '4px solid',
        borderColor: isWorking ? 'success.main' : 'info.main',
        mb: 3
      }}>
        <Typography variant="h2">
          {secondsRemaining}
        </Typography>
      </Box>
      
      <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
        Next: {currentExerciseIndex < session.exercises.length - 1 
          ? session.exercises[currentExerciseIndex + 1].name 
          : 'Session Complete'}
      </Typography>
      
      <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
        <Button variant="outlined" size="small">Pause</Button>
        <Button variant="outlined" size="small">Skip</Button>
        <Button variant="outlined" size="small" color="error">Exit</Button>
      </Box>
    </Box>
  );
};
```

---

### Yoga Session Flow

**Component**: `src/components/Yoga/YogaSessionScreen.jsx`

**State Machine** (Similar to HIIT):
```
START
  ↓
POSE_PREVIEW (Show pose name + image)
  ↓
HOLD_TIMER (Countdown with breathing guide animation)
  ↓
TRANSITION (5-10 second pause between poses)
  ↓
NEXT_POSE? (If yes, back to POSE_PREVIEW; if no, SUMMARY)
  ↓
SUMMARY (Total time, poses completed, rating)
```

**Data Structure**:
```javascript
{
  sessionId: "yoga_2025_11_09",
  planId: "plan_2025_week_45",
  planDay: 2, // Wednesday
  type: "yoga",
  style: "flexibility", // "power", "flexibility", "restorative", "yin"
  poses: [
    {
      name: "Downward Dog",
      duration: 45, // seconds
      breathingPattern: "4-4-4", // inhale-hold-exhale
      image: "...",
      notes: "Warm-up"
    },
    // ... 16 poses total
  ],
  totalDuration: 30,
  rating: 4, // out of 5
  notes: "Felt great, hips are more open"
}
```

**UI Design** (Compact):
```
┌──────────────────────────────────┐
│ Flexibility Flow | 6:22 elapsed   │
├──────────────────────────────────┤
│                                  │
│      [Pose Image Here]           │
│      (500x400 or responsive)     │
│                                  │
│    Warrior I                     │
│    Hold 45 seconds               │
│                                  │
│    ◉ ◉ ◉  Breathing Guide        │
│    ◉ ◉ ◉  (4-in, 4-hold, 4-out) │
│                                  │
│            45 SECONDS            │
│         [41] → 40 ← 39          │ (countdown)
│                                  │
├──────────────────────────────────┤
│ Next: Warrior II                 │
│ ┌──────────────────────────────┐ │
│ │ [Skip]  [Hold Longer]  [Exit]│ │
│ └──────────────────────────────┘ │
└──────────────────────────────────┘
```

---

## Priority 4: Plan-Workout Integration

### WeeklyPlanPreview: Make Days Clickable

**Modify** `src/components/Home/WeeklyPlanPreview.jsx`:

```javascript
const handleDayClick = (day) => {
  // Navigate to WorkoutScreen with day context
  navigate(`/workout/${day.dayIndex}`, { 
    state: { 
      fromPlan: true,
      planDay: day.dayIndex,
      planId: currentPlan.planId,
      workoutData: day.generatedWorkout
    }
  });
};

// In JSX:
<Box 
  onClick={() => handleDayClick(day)}
  sx={{ 
    cursor: 'pointer',
    '&:hover': { bgcolor: 'action.hover' },
    transition: 'bgcolor 0.2s',
    p: 1,
    borderRadius: 1
  }}
>
  {/* Day content */}
</Box>
```

### ProgressScreen Calendar: Link to Plan

**Modify** `src/components/Progress/ProgressScreen.jsx`:

Add calendar view that:
1. Shows workout history as calendar grid
2. Tapping a completed workout shows session details
3. Tapping a future date (from current plan) loads that day's workout

```javascript
const handleCalendarDateClick = (date) => {
  // Check if this date is in current plan
  const planDay = currentPlan.days.find(d => d.date === date);
  if (planDay) {
    // Navigate to workout with plan context
    navigate(`/workout/${planDay.dayIndex}`, { 
      state: { 
        fromPlan: true,
        planDay: planDay.dayIndex,
        workoutData: planDay.generatedWorkout
      }
    });
  }
  
  // Check if this date has completed workout
  const completedSession = workoutHistory.find(w => w.date === date);
  if (completedSession) {
    // Show session details modal
    openSessionDetails(completedSession);
  }
};
```

---

## Priority 5: Workout Page Consolidation

### Reduce Page Title Size

**Before**:
```
┌────────────────────────┐
│ Select Your Workout    │
│                        │
│ Choose from our        │
│ complete database...   │
│                        │
│ ┌────────────────────┐ │
│ │ Quick Start Card   │ │
│ └────────────────────┘ │
└────────────────────────┘
```

**After**:
```
┌────────────────────────┐
│ ⚡ Workouts           │
│ ┌────────────────────┐ │
│ │ Quick Start Card   │ │
│ └────────────────────┘ │
└────────────────────────┘
```

**Changes**:
1. Remove subtitle text completely
2. Use icon + title only
3. Reduce padding from `py: 3` to `py: 1.5`
4. Reduce font size from `h4` to `h6`

### Progress Screen Consolidation

**Compact Stats Row**:
- Remove large "Your Progress" header
- Stats row uses minimal height (40-50px)
- Icon + stat inline

```
┌─────────────────────────────────┐
│ ⚡ Workouts  [4] [45k lbs] [12d] │
├─────────────────────────────────┤
│ Charts and history below...     │
└─────────────────────────────────┘
```

---

## Priority 6: File Structure & Implementation Plan

### New Components to Create

**Session Execution**:
- `src/components/SessionExecutor/SessionExecutor.jsx` - Universal executor framework
- `src/components/HIIT/HIITSessionScreen.jsx` - HIIT-specific session screen
- `src/components/Yoga/YogaSessionScreen.jsx` - Yoga-specific session screen

**Utilities & Hooks**:
- `src/hooks/useSessionExecution.js` - Timer, state machine, progress tracking
- `src/hooks/usePlanIntegration.js` - Link workouts to plan days
- `src/utils/sessionStorageSchema.js` - Unified session data structure

**Common**:
- `src/components/Common/CompactHeader.jsx` - Standardized compact header component

### Files to Modify

**Core Navigation**:
- `src/App.jsx` - Change default route to `/workouts`, update routing
- `src/components/NavigationSidebar.jsx` - Rename "Home" tab to "Workouts", "Progress" remains
- `src/constants/routes.js` (if exists) - Update route definitions

**Screens**:
- `src/components/SelectionScreen.jsx` (rename to `WorkoutHomeScreen.jsx`)
  - Import CompactHeader
  - Use compact title "⚡ Workouts"
  - Ensure WeeklyPlanPreview days are clickable
  - Pass plan context to WorkoutScreen on day click

- `src/components/WorkoutScreen.jsx`
  - Accept `planDay`, `planId` from route state
  - Display session-by-session (already does this, but ensure it flows into HIIT/Yoga)
  - After last exercise, route to session summary OR auto-start cardio

- `src/components/ProgressScreen.jsx`
  - Import CompactHeader for "📊 Progress" title
  - Reduce header padding
  - Make calendar clickable to plan
  - Make completed sessions clickable to details

- `src/components/ProfileScreen.jsx`
  - Compact header "👤 Me"
  - Reduce title padding

### Navigation Routes (App.jsx)

```javascript
// OLD
const routes = [
  { path: "/home", element: <SelectionScreen /> },
  { path: "/workout", element: <WorkoutScreen /> },
  { path: "/progress", element: <ProgressScreen /> },
  // ...
];

// NEW
const routes = [
  { path: "/workouts", element: <WorkoutHomeScreen /> }, // default
  { path: "/workouts/:planDay", element: <WorkoutScreen /> }, // day-specific
  { path: "/hiit/:sessionId", element: <HIITSessionScreen /> },
  { path: "/yoga/:sessionId", element: <YogaSessionScreen /> },
  { path: "/progress", element: <ProgressScreen /> },
  // ...
];

// Root redirect
<Route path="/" element={<Navigate to="/workouts" />} />
```

---

## Priority 7: Compactness Checklist (Across All Screens)

Apply CompactHeader to all screens:

- [ ] SelectionScreen → "⚡ Workouts" (no subtitle)
- [ ] WorkoutScreen → "Workout" or exercise name (minimal padding)
- [ ] ProgressScreen → "📊 Progress" (no subtitle)
- [ ] ProfileScreen → "👤 Me" (no subtitle)
- [ ] HIITSessionScreen → "HIIT Session" (minimal header)
- [ ] YogaSessionScreen → "Yoga" or session name (minimal header)
- [ ] All screens reduce `py` padding from 2-3 to 1-1.5
- [ ] All screens use `h6` or `h5` instead of `h4` for titles
- [ ] Remove all descriptive subtitles (e.g., "View your upcoming workouts...")

---

## Data Flow Diagram

```
Weekly Plan (localStorage)
    ↓
┌─────────────────────────────┐
│ SelectionScreen             │
│ (WorkoutHomeScreen)         │
│ ┌─ QuickStartCard          │
│ ├─ WeeklyPlanPreview       │
│ │  └─ Tap day → navigate  │
│ └─ Other workouts          │
└────────────┬────────────────┘
             ↓ (with planDay context)
┌─────────────────────────────┐
│ WorkoutScreen               │
│ (Exercise 1 of 12)          │
│ ├─ Strength exercise (weight/reps logged)
│ ├─ ...
│ └─ Last exercise → auto-route to cardio
└────────────┬────────────────┘
             ↓
┌─────────────────────────────┐
│ HIITSessionScreen (OR)      │
│ YogaSessionScreen           │
│ (Exercise/Pose 1 of N)      │
│ ├─ Timer running            │
│ ├─ Auto-advance each pose   │
│ └─ Last pose → Summary      │
└────────────┬────────────────┘
             ↓
┌─────────────────────────────┐
│ Session Complete            │
│ ├─ Save to workoutHistory   │
│ ├─ Log planDay reference    │
│ └─ Update ProgressScreen    │
└────────────┬────────────────┘
             ↓
┌─────────────────────────────┐
│ ProgressScreen              │
│ ├─ Calendar shows completed │
│ ├─ Tap date → see session   │
│ ├─ Tap future → start plan  │
│ └─ Charts auto-update       │
└─────────────────────────────┘
```

---

## Implementation Timeline

### Week 1: Foundation
- [ ] Create CompactHeader component
- [ ] Create SessionExecutor framework
- [ ] Update navigation (rename tabs, change default route)
- [ ] Apply CompactHeader to all screens

### Week 2: Session Execution
- [ ] Implement HIITSessionScreen with timer state machine
- [ ] Implement YogaSessionScreen with timer + breathing guide
- [ ] Integrate both into WorkoutScreen flow (after strength section)
- [ ] Test exercise-by-exercise flow for all modalities

### Week 3: Interconnectivity
- [ ] Update data structures (add planDay, planId to all sessions)
- [ ] Make WeeklyPlanPreview days clickable
- [ ] Make ProgressScreen calendar clickable
- [ ] Wire up plan → workout → session → progress flow

### Week 4: Polish & Testing
- [ ] Reduce all page title padding/size
- [ ] Remove all descriptive subtitles
- [ ] Mobile testing
- [ ] Edge cases (pause mid-session, exit, resume)

---

## Code Patterns & Standards

### Compact Header Pattern
```jsx
import CompactHeader from './Common/CompactHeader';

<CompactHeader title="Workouts" icon="⚡" />
```

### Session Execution Pattern
```jsx
const [sessionState, setSessionState] = useState('exercise-preview');
const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
const [secondsRemaining, setSecondsRemaining] = useState(0);

// useEffect with timer logic
// State transitions via handlers

// Render based on sessionState
```

### Plan Integration Pattern
```javascript
// When navigating to workout
navigate(`/workout/${planDay}`, { 
  state: { 
    fromPlan: true,
    planId,
    planDay,
    workoutData
  }
});

// When saving session
saveSession({
  planId,
  planDay,
  ...sessionData
});
```

---

## Notes for GitHub Copilot

When implementing these changes:

1. **Preserve existing functionality** while adding new features
2. **Use Material-UI** consistently with existing patterns
3. **Maintain localStorage + Firebase** sync throughout
4. **Test on mobile** (portrait primary)
5. **Keep components modular** and testable
6. **Memoize** components to prevent unnecessary re-renders
7. **Handle edge cases**: pause mid-session, exit, resume, low battery warnings
8. **Follow existing code style** and conventions
9. **Document state machines** with clear comments
10. **Test data flow** end-to-end (plan → workout → session → progress)

---

## Files Quick Reference

**New Files (10)**:
1. `src/components/SessionExecutor/SessionExecutor.jsx`
2. `src/components/HIIT/HIITSessionScreen.jsx`
3. `src/components/Yoga/YogaSessionScreen.jsx`
4. `src/components/Common/CompactHeader.jsx`
5. `src/hooks/useSessionExecution.js`
6. `src/hooks/usePlanIntegration.js`
7. `src/utils/sessionStorageSchema.js`
8. (Rename) `src/components/SelectionScreen.jsx` → `WorkoutHomeScreen.jsx`

**Modified Files (5)**:
1. `src/App.jsx` - Routes, navigation structure
2. `src/components/NavigationSidebar.jsx` - Rename tabs
3. `src/components/WorkoutHomeScreen.jsx` (formerly SelectionScreen) - Compact header, clickable plan
4. `src/components/WorkoutScreen.jsx` - Accept plan context, route to HIIT/Yoga
5. `src/components/ProgressScreen.jsx` - Compact header, clickable calendar

---

End of Document.