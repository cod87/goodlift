# Session Modal Refactor - Implementation Guide

## Overview

This document describes the refactored workout session flow that uses modal-based execution instead of route-based navigation.

## Architecture

### Core Components

1. **SessionModalContext** (`src/contexts/SessionModalContext.jsx`)
   - Global state management for active sessions
   - Provides: `openSession`, `closeSession`, `minimizeSession`, `restoreSession`
   - Tracks: `isModalOpen`, `isMinimized`, `sessionType`, `sessionData`

2. **SessionModal** (`src/components/SessionModal.jsx`)
   - Full-screen modal overlay
   - Features: Minimize button, Close button
   - Keyboard: ESC to minimize
   - Accessibility: ARIA labels, focus management

3. **MinimizedSessionBar** (`src/components/MinimizedSessionBar.jsx`)
   - Persistent bottom bar (above bottom navigation)
   - Displays: Timer, progress, status text
   - Controls: Pause/Resume, Stop, Restore
   - Live updates via aria-live regions

4. **SessionManager** (`src/components/SessionManager.jsx`)
   - Orchestrates modal and minimized bar
   - Routes session content to appropriate wrapper
   - Handles state transitions

5. **Session Wrappers**
   - `UnifiedTimerSessionWrapper.jsx` - For HIIT/Yoga/Cardio
   - `WorkoutSessionWrapper.jsx` - For weight training sessions

## User Flow

### 1. Session Setup (Tabbed Navigation)
- Users configure sessions in WorkTabs
- Select mode (HIIT, Yoga, Cardio, Workout)
- Configure parameters (duration, intervals, exercises)

### 2. Session Execution (Modal)
```
Click "Start" → openSession() called → Full-screen modal appears
```
- Modal covers entire viewport
- Background interactions blocked
- Timer/workout content rendered inside modal

### 3. Minimize Feature
```
Click minimize or press ESC → minimizeSession() called
```
- Modal slides down
- Minimized bar appears above bottom navigation
- Shows: Current time, progress, quick controls
- Users can browse app while session continues

### 4. Restore Feature
```
Click restore button → restoreSession() called
```
- Minimized bar slides down
- Modal slides up to full screen
- Session state preserved throughout

### 5. Session End
```
Complete or click close → closeSession() called
```
- Modal closes
- Minimized bar removed
- Return to setup screen or home

## State Management

### Session Data Structure
```javascript
{
  sessionType: 'workout' | 'hiit' | 'yoga' | 'cardio',
  sessionData: {
    // For workouts
    workoutPlan: Array,
    supersetConfig: Array,
    setsPerSuperset: Number,
    onComplete: Function,
    
    // For timers (updated dynamically)
    timeDisplay: String,
    progress: Number,
    isPaused: Boolean,
    statusText: String,
    mode: String,
    
    // Control handlers
    onPause: Function,
    onStop: Function,
  }
}
```

## Integration Points

### Opening a Session

**From TimerTab:**
```javascript
const { openSession } = useSessionModal();
openSession('hiit', {});
```

**From WorkoutTab:**
```javascript
// Already integrated via existing handleStartWorkout
// which calls openSession('workout', data)
```

### Updating Session State

**From UnifiedTimerScreen:**
```javascript
useEffect(() => {
  if (updateTimerState) {
    updateTimerState({
      timeDisplay: formatTime(timeRemaining),
      progress: getProgress(),
      isPaused,
      statusText,
      mode,
    });
  }
}, [timeRemaining, isPaused, /* ... */]);
```

**From WorkoutScreen:**
```javascript
useEffect(() => {
  if (updateWorkoutState) {
    updateWorkoutState({
      timeDisplay: formatTime(elapsedTime),
      progress: (currentStepIndex / workoutSequence.length) * 100,
      statusText: `Set ${currentStep.setNumber} - ${exerciseName}`,
    });
  }
}, [elapsedTime, currentStepIndex, /* ... */]);
```

## Accessibility Features

### Keyboard Navigation
- **ESC**: Minimize modal
- **Tab**: Navigate between controls
- **Enter/Space**: Activate buttons

### ARIA Labels
- Modal: `role="dialog"`, `aria-modal="true"`
- Controls: `role="toolbar"`
- Status: `aria-live="polite"` for dynamic updates
- Buttons: Descriptive `aria-label` attributes

### Focus Management
- Auto-focus minimize button on modal open
- Focus trap within modal
- Restored focus when minimized bar appears

## Testing Checklist

### Manual Testing
- [ ] HIIT session opens in modal
- [ ] Yoga session opens in modal
- [ ] Cardio session opens in modal
- [ ] Workout session opens in modal
- [ ] Minimize button works
- [ ] ESC key minimizes
- [ ] Minimized bar shows correct info
- [ ] Pause/Resume works from minimized bar
- [ ] Restore button returns to full screen
- [ ] Stop button ends session
- [ ] State preserved during minimize/restore
- [ ] Close button with confirmation works
- [ ] Can browse app while session minimized
- [ ] Multiple minimize/restore cycles work
- [ ] Screen reader announces status updates
- [ ] Keyboard navigation works throughout

### Browser Testing
- [ ] Chrome/Edge
- [ ] Firefox
- [ ] Safari
- [ ] Mobile browsers

## Benefits

1. **Better UX**: Users can minimize sessions and browse while timer runs
2. **Cleaner Navigation**: Sessions don't clutter navigation history
3. **State Isolation**: Modal state separate from route state
4. **Accessibility**: Better focus management and ARIA support
5. **Consistent UI**: All sessions use same modal pattern
6. **Flexibility**: Easy to add new session types

## Future Enhancements

- Multiple simultaneous sessions (tabbed)
- Session history in minimized bar
- Drag to reposition minimized bar
- Picture-in-picture mode for demos
- Session templates and sharing
- Voice commands for hands-free control
