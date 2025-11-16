# Wellness Task Push Notifications - Implementation Documentation

## Overview

This feature implements a comprehensive wellness task system with push notifications to help users maintain a balanced approach to health and wellbeing alongside their fitness routines.

## Features Implemented

### 1. Wellness Task Database
- **270 wellness tasks** sourced from `.github/wellness_tasks.csv`
- **Task categorization**: 12 categories including Communication, Mental Health, Learning, Volunteering, etc.
- **Task timing**: Daily (137 tasks), Weekly (133 tasks), Holiday (9 tasks)
- **Relationship filtering**: Tasks appropriate for All, Single, or In Relationship users
- **JSON conversion**: Automated script to convert CSV to optimized JSON format

### 2. User Preferences & Settings

New settings available in the Settings screen:

#### Push Notifications
- **Enable/Disable toggle**: Master switch for all push notifications
- **Permission request**: Browser notification permission handling
- **Test notification**: Ability to send test notifications

#### Daily Wellness Tasks
- **Opt-in toggle**: Enable/disable daily wellness task notifications
- **Category selection**: Choose from 12 wellness categories
- **Relationship status**: Filter tasks by relationship status
- **Morning notification time**: Customize when morning notifications arrive (default: 8:00 AM)
- **Follow-up notifications**: Toggle and customize follow-up reminder times (default: 9:00 PM)

### 3. Notification Scheduling

#### Morning Notifications
- Sent daily at user-configured time (default: 8:00 AM)
- Content: "Good Morning! Today's suggested workout is [workout]"
- Includes daily wellness task if enabled: "Today's wellness task: [task]"

#### Follow-up Notifications
- **Daily tasks**: Sent at configured time (default: 9:00 PM)
- **Weekly tasks**: Sent Saturday morning at morning notification time
- Content: "Did you complete your wellness task: [task]?"
- Can be disabled in settings

#### Task Selection Logic
- **Daily tasks**: Same task shown all day using date-based seeding
- **Weekly tasks**: Sent every Sunday, consistent throughout the week
- **Holiday tasks**: Sent within a week of specific holidays
- **Smart filtering**: Respects user's selected categories and relationship status

### 4. Task Tracking & Completion

#### WellnessTaskCard Component
- Displays on HomeScreen below main workout card
- Shows current day's wellness task
- Task categories displayed as chips
- "Mark Complete" button with celebration animation
- Expandable details showing total completed tasks
- Visual feedback when task is completed

#### Completion Tracking
- Stored in localStorage with user-specific keys
- Prevents duplicate completions (one per day)
- Syncs with UserProfileContext stats
- Used for achievement calculations

### 5. Achievements System

Five new wellness task achievements:

1. **Wellness Beginner** (🌱 Bronze): Complete 1 wellness task
2. **Wellness Explorer** (🌿 Bronze): Complete 10 wellness tasks
3. **Wellness Enthusiast** (🍀 Silver): Complete 25 wellness tasks
4. **Wellness Champion** (🌺 Gold): Complete 50 wellness tasks
5. **Wellness Master** (🌸 Platinum): Complete 100 wellness tasks

Achievements integrate with existing achievement system and display on user profile.

### 6. Profile Statistics

New stat added to UserProfileScreen:
- **Wellness Tasks**: Displays total completed wellness tasks
- Shown alongside workout count, streaks, and PRs
- Color-coded with secondary theme color

## Technical Implementation

### File Structure

```
src/
├── data/
│   └── wellness_tasks.json          # Generated from CSV (270 tasks)
├── utils/
│   └── wellnessTaskService.js       # Task selection and tracking logic
├── services/
│   └── pushNotificationService.js   # Notification management
├── components/
│   └── WellnessTaskCard.jsx         # Task display and completion UI
├── contexts/
│   ├── PreferencesContext.jsx       # Updated with wellness preferences
│   └── UserProfileContext.jsx       # Updated with completion tracking
├── pages/
│   ├── SettingsScreen.jsx           # New wellness settings section
│   └── UserProfileScreen.jsx        # Shows wellness task stats
└── firebase.js                      # Added Cloud Messaging support

public/
└── firebase-messaging-sw.js         # Service worker for background notifications

scripts/
└── convert-wellness-tasks.js        # CSV to JSON converter
```

### Key Services

#### wellnessTaskService.js
- `getWellnessCategories()`: Returns all available categories
- `getTodaysWellnessTask(preferences)`: Gets consistent daily task
- `getWeeklyWellnessTask(preferences)`: Gets weekly task
- `getHolidayWellnessTask(holiday, preferences)`: Gets holiday-specific task
- `saveCompletedTask(taskId, userId)`: Tracks task completion
- `getCompletedTaskCount(userId)`: Returns total completed tasks

#### pushNotificationService.js
- `requestNotificationPermission()`: Requests browser permission
- `scheduleLocalNotification(options)`: Shows browser notification
- `generateMorningNotification(workout, task)`: Creates morning notification
- `generateFollowupNotification(type, task)`: Creates follow-up notification
- `shouldSendNotification(preferences, type)`: Checks if notification should be sent
- `sendTestNotification(preferences)`: Sends test notification

### Context Updates

#### PreferencesContext
New preferences added:
```javascript
{
  pushNotificationsEnabled: false,
  dailyWellnessTasksEnabled: false,
  wellnessCategories: [],
  relationshipStatus: 'All',
  morningNotificationTime: { hour: 8, minute: 0 },
  followupNotificationTime: { hour: 21, minute: 0 },
  enableFollowupNotifications: true
}
```

#### UserProfileContext
New stat:
```javascript
{
  completedWellnessTasks: 0
}
```

## User Experience

### First-Time Setup
1. User navigates to Settings
2. Toggles "Push Notifications" on
3. Browser prompts for notification permission
4. User grants permission
5. Toggles "Daily Wellness Tasks" on
6. Selects wellness categories of interest
7. Optionally customizes notification times
8. Sends test notification to verify setup

### Daily Usage
1. User receives morning notification with workout and wellness task
2. Opens app and sees WellnessTaskCard on HomeScreen
3. Reads wellness task and attempts to complete it
4. Marks task as complete when finished
5. Receives celebration animation
6. (Optional) Receives follow-up notification in evening asking if completed
7. Progress tracked automatically
8. Earns achievements at milestones

### Customization
- Choose specific categories of interest (e.g., only Physical and Mental Health)
- Set relationship status for relevant tasks
- Customize notification times for their schedule
- Disable follow-up notifications if preferred
- Test notifications before committing to daily use

## Data Privacy

### What is Stored
- Wellness task completion records (task ID, completion timestamp)
- User notification preferences
- Selected wellness categories

### What is NOT Stored
- No personal wellness data or responses
- No tracking of why tasks weren't completed
- No sharing of wellness task engagement with third parties

### Storage Locations
- **LocalStorage**: Task completions for quick access
- **Firebase**: User preferences (when authenticated)
- **No server tracking**: Wellness task selections not sent to server

## Testing

### Manual Testing Checklist
- [ ] Enable push notifications in settings
- [ ] Grant browser permission successfully
- [ ] Send and receive test notification
- [ ] Enable daily wellness tasks
- [ ] Select multiple categories
- [ ] Verify task appears on HomeScreen
- [ ] Complete a task and verify celebration
- [ ] Check completion count updates
- [ ] Verify task stays completed on reload
- [ ] Test with different relationship statuses
- [ ] Customize notification times
- [ ] Toggle follow-up notifications
- [ ] Verify achievement unlocks at milestones
- [ ] Check stats display on profile screen

### Browser Compatibility
- ✅ Chrome (with notification support)
- ✅ Firefox (with notification support)
- ✅ Edge (with notification support)
- ⚠️ Safari (limited notification support)
- ⚠️ Mobile browsers (varies by OS/browser)

## Scripts

### Convert Wellness Tasks
```bash
npm run convert:wellness
```
Converts `.github/wellness_tasks.csv` to `src/data/wellness_tasks.json`

### Convert All Data
```bash
npm run convert:all
```
Converts exercises, HIIT exercises, and wellness tasks

## Future Enhancements

### Short-term
- Weekly task display component
- Holiday task detection and notification
- Completion history view
- Category-based statistics

### Long-term
- Custom wellness tasks created by users
- Social sharing of wellness achievements
- Integration with health tracking APIs
- Wellness task suggestions based on workout type
- Machine learning for personalized task recommendations
- Community wellness challenges

## Support & Troubleshooting

### Notifications Not Appearing
1. Check browser notification permissions
2. Verify "Push Notifications" enabled in settings
3. Verify "Daily Wellness Tasks" enabled
4. Check selected categories aren't too restrictive
5. Try sending test notification
6. Check browser console for errors

### Task Not Showing
1. Verify "Daily Wellness Tasks" is enabled
2. Check at least one category is selected
3. Verify relationship status matches available tasks
4. Try refreshing the page

### Completion Not Tracking
1. Check browser console for localStorage errors
2. Verify browser allows localStorage
3. Try clearing browser cache and retrying
4. Check profile stats to confirm tracking

## Conclusion

The wellness task push notification feature provides a comprehensive, user-friendly system to help users maintain overall wellbeing alongside their fitness goals. The implementation is secure, performant, and integrates seamlessly with the existing GoodLift application.
