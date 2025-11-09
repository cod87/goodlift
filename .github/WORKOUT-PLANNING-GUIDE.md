# Workout Planning Guide

This guide provides comprehensive instructions for creating effective workout plans in the GoodLift application.

## Overview

The workout planning feature allows users to create, customize, and schedule workout plans for up to 90 days. Plans should be flexible, allowing users to adapt them based on their goals, preferences, and fitness level.

## Workout Plan Structure

### Plan Components

A workout plan consists of:
- **Duration**: 1-90 days of scheduled workouts
- **Sessions**: Individual workout sessions scheduled on specific dates
- **Session Types**: Different types of training sessions
- **Flexibility**: Ability to move, edit, or skip sessions

### Session Types

The following session types are supported:

1. **Standard Workouts**
   - Upper Body
   - Lower Body
   - Full Body
   - Push/Pull/Legs (PPL) splits

2. **High-Intensity Interval Training (HIIT)**
   - Interval-based cardio workouts
   - Customizable work/rest periods
   - Duration-based sessions

3. **Yoga/Mobility**
   - Flexibility and mobility work
   - Different yoga styles
   - Stretch sessions

4. **Cardio**
   - Running, cycling, rowing, etc.
   - Distance or time-based
   - Various intensity levels

## Plan Generation Guidelines

### User Inputs

When generating a workout plan, consider:

1. **Fitness Goals**
   - Strength building
   - Muscle gain (hypertrophy)
   - Fat loss
   - General fitness
   - Athletic performance

2. **Experience Level**
   - Beginner (0-6 months)
   - Intermediate (6 months - 2 years)
   - Advanced (2+ years)

3. **Availability**
   - Days per week (2-7)
   - Session duration (30-120 minutes)
   - Preferred workout days

4. **Equipment Access**
   - Full gym
   - Home gym (specific equipment)
   - Minimal equipment
   - Bodyweight only

5. **Preferences**
   - Favorite workout types
   - Session types to include/exclude
   - Rest day preferences

### Training Frequency

**Beginner (2-4 days/week)**
- 2-3 full body sessions
- 1-2 cardio/mobility sessions
- Focus on learning proper form
- Longer rest periods between training days

**Intermediate (3-5 days/week)**
- Upper/Lower split or PPL
- 3-4 strength sessions
- 1-2 cardio/HIIT sessions
- 1 mobility/yoga session

**Advanced (4-6 days/week)**
- Specialized splits (PPL, Upper/Lower, Body Part)
- 4-5 strength sessions
- 1-2 cardio/HIIT sessions
- Active recovery and mobility work

### Rest and Recovery

- Minimum 1 rest day per week
- Avoid training same muscle groups on consecutive days
- Include deload weeks every 4-6 weeks (reduce volume/intensity)
- Active recovery options: light cardio, yoga, stretching

## Session Scheduling

### Calendar Integration

Sessions should be displayed on an interactive calendar with:

1. **Visual Indicators**
   - Icons for each session type (from existing Calendar component)
   - Grey icons at 0.5 opacity for upcoming, not-yet-completed sessions
   - Full color/opacity for completed sessions
   - Multiple sessions per day shown with bookmarks

2. **Interactive Features**
   - Click to view session details
   - Drag-and-drop to reschedule
   - Right-click or long-press for options menu
   - Swipe gestures on mobile

3. **Session States**
   - **Planned**: Scheduled but not started (grey, 0.5 opacity)
   - **In Progress**: Currently being performed
   - **Completed**: Finished with logged data
   - **Skipped**: Marked as skipped by user
   - **Missed**: Past date, not completed

### Session Management

Users should be able to:

1. **Move Sessions**
   - Drag to new date
   - Select date picker
   - Swap with another session

2. **Edit Sessions**
   - Change exercises
   - Adjust sets/reps
   - Modify duration
   - Change session type

3. **Start Sessions**
   - "Do Workout" option
   - Navigate to appropriate preview/execution screen
   - Pre-populated with planned exercises

4. **Complete/Skip Sessions**
   - Mark as completed without doing
   - Skip and reschedule
   - Delete from plan

## Workout Types and Templates

### Full Body (3x/week)

**Structure**: 6-8 exercises per session
- 1-2 Compound lower body (Squat pattern, Hinge pattern)
- 2-3 Compound upper body (Horizontal push, Horizontal pull, Vertical push/pull)
- 1-2 Isolation exercises (Arms, shoulders, or core)
- 1 Core/stability exercise

**Example Week**:
- Monday: Full Body A
- Wednesday: Full Body B
- Friday: Full Body C
- Weekend: Cardio or Rest

### Upper/Lower Split (4x/week)

**Upper Body** (6-8 exercises):
- 1-2 Horizontal push (Bench press, push-ups)
- 1-2 Horizontal pull (Rows)
- 1 Vertical push (Overhead press)
- 1 Vertical pull (Pull-ups, lat pulldowns)
- 1-2 Arm isolation (Biceps, triceps)
- 1 Shoulder isolation

**Lower Body** (6-8 exercises):
- 1-2 Squat pattern (Squats, leg press)
- 1-2 Hinge pattern (Deadlifts, RDLs)
- 1 Unilateral (Lunges, split squats)
- 1-2 Isolation (Leg curls, leg extensions)
- 1-2 Calf exercises

**Example Week**:
- Monday: Upper A
- Tuesday: Lower A
- Thursday: Upper B
- Friday: Lower B
- Weekend: Active recovery

### Push/Pull/Legs (6x/week)

**Push Day** (6-8 exercises):
- 1-2 Chest (Barbell/dumbbell press, flyes)
- 1-2 Shoulders (Overhead press, lateral raises)
- 2-3 Triceps (Close-grip press, extensions, dips)

**Pull Day** (6-8 exercises):
- 1-2 Back width (Pull-ups, lat pulldowns)
- 1-2 Back thickness (Rows)
- 2-3 Biceps (Curls, hammer curls)
- 1 Rear delts

**Legs Day** (6-8 exercises):
- 1-2 Quad dominant (Squats, leg press)
- 1-2 Hip hinge (Deadlifts, RDLs)
- 1 Unilateral (Lunges, split squats)
- 2-3 Isolation (Leg curls, extensions, calf raises)

**Example Week**:
- Monday: Push
- Tuesday: Pull
- Wednesday: Legs
- Thursday: Push
- Friday: Pull
- Saturday: Legs
- Sunday: Rest

## Progressive Overload

Plans should incorporate progressive overload:

1. **Week 1-3**: Establish baseline
   - Learn exercises
   - Find working weights
   - Master form

2. **Week 4-6**: Increase volume
   - Add 1-2 reps per set
   - Add 1 set to exercises
   - Increase weight by 2.5-5 lbs

3. **Week 7-8**: Deload
   - Reduce volume by 40-50%
   - Maintain intensity
   - Focus on recovery

4. **Week 9+**: Progress cycle
   - Repeat pattern
   - Increase baseline weights
   - Modify exercises for variety

## Plan Customization

### During Plan Creation

Users can customize:
- Session frequency and days
- Session types and duration
- Exercise selection
- Equipment preferences
- Rest day placement

### After Plan Generation

Users can modify:
- Individual sessions
- Exercise substitutions
- Sets, reps, and weights
- Session dates
- Add/remove sessions

### Smart Suggestions

The system should provide:
- Exercise alternatives with similar muscle targets
- Equipment-based substitutions
- Volume recommendations based on experience
- Recovery time between muscle groups
- Progression suggestions

## Data Structure

### Workout Plan Schema

```javascript
{
  id: "plan_uuid",
  userId: "user_id",
  name: "Custom Plan Name",
  startDate: timestamp,
  endDate: timestamp,
  duration: 90, // days
  goal: "strength" | "hypertrophy" | "fat_loss" | "general_fitness",
  experienceLevel: "beginner" | "intermediate" | "advanced",
  daysPerWeek: 3-7,
  sessions: [
    {
      id: "session_uuid",
      date: timestamp,
      type: "upper" | "lower" | "full" | "hiit" | "cardio" | "yoga" | "stretch",
      status: "planned" | "in_progress" | "completed" | "skipped" | "missed",
      exercises: [...], // for standard workouts
      duration: minutes, // for HIIT/cardio/yoga
      completedAt: timestamp,
      notes: "user notes"
    }
  ],
  created: timestamp,
  modified: timestamp,
  active: boolean
}
```

### Session Schema

```javascript
{
  id: "session_uuid",
  planId: "plan_uuid",
  date: timestamp,
  type: "upper" | "lower" | "full" | "hiit" | "cardio" | "yoga" | "stretch",
  status: "planned" | "in_progress" | "completed" | "skipped" | "missed",
  
  // For standard workouts
  exercises: [
    {
      name: "Exercise Name",
      sets: 3,
      reps: 10,
      weight: 135,
      restTime: 90, // seconds
      notes: ""
    }
  ],
  
  // For HIIT sessions
  intervals: [
    {
      type: "work" | "rest",
      duration: 30, // seconds
      exercise: "Burpees"
    }
  ],
  
  // For cardio sessions
  cardio: {
    type: "running" | "cycling" | "rowing" | "other",
    duration: 30, // minutes
    distance: 5, // km or miles
    intensity: "low" | "moderate" | "high"
  },
  
  // For yoga/mobility sessions
  yoga: {
    style: "vinyasa" | "hatha" | "yin" | "stretch",
    duration: 45,
    focus: "flexibility" | "strength" | "balance" | "recovery"
  },
  
  completedAt: timestamp,
  completedData: {}, // actual logged data
  notes: ""
}
```

## User Interface Guidelines

### Plan Creation Flow

1. **Welcome Screen**
   - Option to create new plan or use template
   - Quick start wizard

2. **Goal Selection**
   - Visual cards for different goals
   - Brief descriptions

3. **Experience Level**
   - Self-assessment questions
   - Recommended frequencies

4. **Schedule Setup**
   - Calendar picker for start date
   - Days per week selection
   - Preferred training days

5. **Session Configuration**
   - Session types to include
   - Duration preferences
   - Equipment availability

6. **Review & Generate**
   - Preview of plan structure
   - Option to customize before finalizing
   - Save and start

### Calendar View

1. **Month View** (default)
   - Standard calendar grid
   - Icons for session types
   - Quick overview of plan

2. **Week View**
   - Detailed daily breakdown
   - Session details visible
   - Easy drag-and-drop

3. **Day View**
   - Full session details
   - Exercise list
   - Quick edit options

### Session Detail Dialog

When clicking a session:
1. **Session Info**
   - Date and time
   - Session type and duration
   - Status indicator

2. **Actions**
   - Start Workout (navigates to preview)
   - Edit Session
   - Move to Different Date
   - Mark as Skipped
   - Delete Session

3. **Exercise Preview** (for standard workouts)
   - List of exercises
   - Sets x Reps @ Weight
   - Quick view of workout structure

## Mobile Considerations

- Touch-friendly interactions
- Swipe to navigate calendar
- Long-press for options
- Bottom sheet for session details
- Pull-to-refresh
- Offline support

## Performance

- Load only visible month initially
- Lazy load adjacent months
- Cache plan data locally
- Sync changes to cloud asynchronously
- Optimistic UI updates

## Accessibility

- Keyboard navigation support
- Screen reader announcements
- High contrast mode support
- Focus indicators
- ARIA labels for all interactive elements

## Implementation Notes

1. **Calendar Component**: Use and extend existing Calendar.jsx
2. **Storage**: Extend storage.js with plan management functions
3. **State Management**: Use React hooks and context for plan state
4. **Routing**: Integrate with existing App.jsx screen navigation
5. **Drag and Drop**: Use HTML5 drag-and-drop or react-beautiful-dnd
6. **Date Handling**: Use date-fns (already in dependencies)

## Future Enhancements

- AI-powered plan generation
- Community plan templates
- Progress tracking and analytics
- Plan sharing
- Integration with wearables
- Automatic rest day suggestions based on performance
- Adaptive plans that adjust based on completion rates
