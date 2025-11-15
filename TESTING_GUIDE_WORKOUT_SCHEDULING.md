# Testing Guide - Enhanced Workout Scheduling UX

## Overview
This guide provides comprehensive testing steps for the enhanced workout scheduling UX feature.

## Test Environment Setup
1. Build the application: `npm run build`
2. Start development server: `npm run dev`
3. Open browser to http://localhost:5173

## Test Cases

### 1. Suggested Session - Strength Workouts
**Objective**: Verify clicking suggested strength session routes to workout preview

**Steps**:
1. Navigate to the home page (Workout tab)
2. Ensure a strength workout is assigned to today (e.g., "Upper Body", "Full Body", "Push", "Pull", "Legs", "Core")
3. Click on the suggested session chip at the top

**Expected Result**:
- ✅ User is routed to workout preview screen
- ✅ Workout type is auto-populated based on suggestion
- ✅ Exercises are generated or pre-populated
- ✅ Preview shows workout configuration (superset settings)

**Test Data**:
- Full Body session
- Upper Body session
- Lower Body session
- Push session
- Pull session
- Legs session
- Core session

---

### 2. Suggested Session - Cardio/Mobility
**Objective**: Verify clicking cardio or mobility session switches to appropriate tab

**Steps**:
1. Navigate to home page (Workout tab)
2. Assign a cardio, HIIT, yoga, mobility, or stretching session to today
3. Click on the suggested session chip

**Expected Result**:
- ✅ User switches to "Cardio & Yoga" tab (tab index 1)
- ✅ Timer functionality is displayed
- ✅ No workout preview is shown

**Test Data**:
- Cardio session
- HIIT session
- Yoga session
- Mobility session
- Stretching session

---

### 3. Suggested Session - Rest Day
**Objective**: Verify clicking rest day shows playful message

**Steps**:
1. Navigate to home page (Workout tab)
2. Assign a "Rest" session to today
3. Click on the suggested session chip

**Expected Result**:
- ✅ Playful rest day message modal appears
- ✅ Modal contains animation (icon bouncing)
- ✅ One of the random messages is displayed:
  - "Take it easy! See a friend!"
  - "Rest up! Read a book!"
  - "Relax and recover! Try some gentle stretching!"
  - "Your body needs rest! Enjoy your day off!"
- ✅ "Got it!" button closes the modal
- ✅ Clicking outside the content area closes the modal

---

### 4. Weekly Schedule - Strength Sessions
**Objective**: Verify clicking strength session in weekly schedule routes correctly

**Steps**:
1. Open TodayView or navigate to section with WeeklyScheduleView
2. Expand weekly schedule accordion
3. Click on a day with assigned strength workout
4. Click "Start Workout" button in dialog

**Expected Result**:
- ✅ Dialog opens showing session details
- ✅ Exercises are listed (if pre-populated)
- ✅ "Start Workout" button is visible
- ✅ Clicking "Start Workout" routes to workout preview
- ✅ Workout is generated with correct type

---

### 5. Weekly Schedule - Cardio/Mobility Sessions
**Objective**: Verify cardio/mobility routing from weekly schedule

**Steps**:
1. Open WeeklyScheduleView
2. Click on a day with cardio, HIIT, yoga, or mobility session
3. Click "Start Workout" in dialog

**Expected Result**:
- ✅ Dialog closes
- ✅ User navigates to timer screen
- ✅ Timer options are available

---

### 6. Weekly Schedule - Rest Day
**Objective**: Verify rest day message from weekly schedule

**Steps**:
1. Open WeeklyScheduleView
2. Click on a day with "Rest" session
3. Click "Start Workout" in dialog

**Expected Result**:
- ✅ Dialog closes
- ✅ Rest day message modal appears with animation
- ✅ Message can be dismissed

---

### 7. Mobile Portrait - Week Editor Layout
**Objective**: Verify edit/delete buttons stay in viewport on mobile

**Steps**:
1. Resize browser to mobile portrait dimensions (375x667 or similar)
2. Open Settings or navigation to WeekEditorDialog
3. Open the week editor dialog
4. Observe session cards

**Expected Result**:
- ✅ Day name, session info, and action buttons all visible
- ✅ Edit and Delete buttons are not pushed off-screen
- ✅ Layout adapts to column format on small screens
- ✅ Status chip hidden on mobile (if applicable)
- ✅ Buttons align properly on mobile

**Test Dimensions**:
- 375x667 (iPhone SE)
- 390x844 (iPhone 12/13)
- 360x640 (Android)

---

### 8. Core Workout Type Support
**Objective**: Verify core workout type is available and generates workouts

**Steps**:
1. Navigate to Workout tab
2. Open workout type dropdown
3. Select "Core"
4. Click "Generate" button

**Expected Result**:
- ✅ "Core" option appears in dropdown
- ✅ Workout preview shows core-focused exercises
- ✅ All exercises target core muscle group
- ✅ Superset configuration works correctly

---

### 9. Tab Switching Integration
**Objective**: Verify programmatic tab switching works

**Steps**:
1. Start on Workout tab (tab 0)
2. Click suggested cardio session
3. Verify tab changes to Cardio & Yoga (tab 1)

**Expected Result**:
- ✅ Active tab changes automatically
- ✅ Tab content updates to show timer
- ✅ No navigation errors

---

### 10. Edge Cases

#### 10.1 No Workout Assigned
**Steps**:
1. Clear all weekly schedule assignments
2. Navigate to home page

**Expected Result**:
- ✅ No suggested session chip shown
- ✅ No errors in console
- ✅ Workout configuration still works

#### 10.2 Missing Session Exercises
**Steps**:
1. Assign strength session without exercises
2. Click suggested session

**Expected Result**:
- ✅ Workout is generated on-the-fly
- ✅ Preview shows new workout
- ✅ No errors occur

#### 10.3 Invalid Session Type
**Steps**:
1. Manually set an invalid session type in local storage
2. Try to interact with suggested session

**Expected Result**:
- ✅ Graceful degradation
- ✅ No crash or error
- ✅ Defaults to safe behavior

---

## Performance Testing

### Animation Performance
**Steps**:
1. Trigger rest day message multiple times
2. Observe animation smoothness

**Expected Result**:
- ✅ Animations run at 60fps
- ✅ No jank or stuttering
- ✅ Smooth enter/exit transitions

### Build Size
**Steps**:
1. Run `npm run build`
2. Check bundle sizes

**Expected Result**:
- ✅ No significant bundle size increase
- ✅ RestDayMessage adds minimal overhead
- ✅ Framer-motion already included in dependencies

---

## Regression Testing

### Existing Features
Verify these existing features still work:
- ✅ Manual workout generation
- ✅ Favorite workouts
- ✅ Workout preview customization
- ✅ Exercise randomization
- ✅ Superset configuration
- ✅ Equipment filtering
- ✅ Recent workouts display
- ✅ Calendar view
- ✅ Week cycle management
- ✅ Deload week functionality

---

## Browser Compatibility

Test on:
- ✅ Chrome/Edge (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Mobile Safari (iOS)
- ✅ Chrome Mobile (Android)

---

## Accessibility Testing

### Keyboard Navigation
- ✅ Tab through all interactive elements
- ✅ Enter/Space to activate buttons
- ✅ Escape to close modals

### Screen Reader
- ✅ Buttons have proper labels
- ✅ Modal announces correctly
- ✅ Focus management works

### Touch Targets
- ✅ All buttons meet 44x44px minimum
- ✅ Proper spacing between interactive elements

---

## Test Completion Checklist

### Functional Tests
- [ ] All strength workout routing tests pass
- [ ] Cardio/mobility routing works
- [ ] Rest day message displays correctly
- [ ] Weekly schedule integration works
- [ ] Mobile layout is correct
- [ ] Core workout type supported

### Non-Functional Tests
- [ ] Performance is acceptable
- [ ] Animations are smooth
- [ ] No console errors
- [ ] No memory leaks
- [ ] Proper error handling

### Cross-Browser
- [ ] Chrome tested
- [ ] Firefox tested
- [ ] Safari tested
- [ ] Mobile browsers tested

### Accessibility
- [ ] Keyboard navigation works
- [ ] Screen reader compatible
- [ ] Touch targets adequate

---

## Issue Reporting Template

If you find a bug, report it with:

```
**Issue**: [Brief description]

**Steps to Reproduce**:
1. [Step 1]
2. [Step 2]
3. [Step 3]

**Expected Behavior**:
[What should happen]

**Actual Behavior**:
[What actually happens]

**Environment**:
- Browser: [Browser name and version]
- Device: [Desktop/Mobile, OS]
- Screen size: [Dimensions]

**Screenshots**:
[If applicable]

**Console Errors**:
[Any error messages]
```

---

## Notes
- All features use existing workout generation logic
- No backend changes required
- All data stored in existing WeekScheduling context
- Compatible with guest mode and authenticated users
