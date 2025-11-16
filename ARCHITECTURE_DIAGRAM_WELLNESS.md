# Wellness Task Push Notifications - Feature Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     GoodLift Wellness System                     │
└─────────────────────────────────────────────────────────────────┘

┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   CSV File   │────▶│   Converter  │────▶│  JSON Data   │
│ 270 Tasks    │     │    Script    │     │  Optimized   │
└──────────────┘     └──────────────┘     └──────────────┘
                                                   │
                                                   ▼
                                          ┌─────────────────┐
                                          │ Wellness Task   │
                                          │    Service      │
                                          └─────────────────┘
                                                   │
                    ┌──────────────────────────────┼───────────────────────────┐
                    ▼                              ▼                           ▼
           ┌─────────────────┐          ┌──────────────────┐       ┌──────────────────┐
           │   Settings UI   │          │  HomeScreen UI   │       │   Profile Stats  │
           │                 │          │                  │       │                  │
           │ • Enable/       │          │ • Display Task   │       │ • Show Count     │
           │   Disable       │          │ • Mark Complete  │       │ • Achievements   │
           │ • Categories    │          │ • Celebration    │       │ • Progress       │
           │ • Times         │          │ • Category Chips │       │                  │
           └─────────────────┘          └──────────────────┘       └──────────────────┘
                    │                                                        │
                    │                                                        │
                    ▼                                                        ▼
           ┌─────────────────┐                                   ┌──────────────────┐
           │   Preferences   │                                   │  User Profile    │
           │    Context      │                                   │     Context      │
           └─────────────────┘                                   └──────────────────┘
                    │                                                        │
                    │                  ┌─────────────────┐                  │
                    └─────────────────▶│  localStorage   │◀─────────────────┘
                                       │                 │
                                       │ • Preferences   │
                                       │ • Completions   │
                                       │ • Stats         │
                                       └─────────────────┘

┌────────────────────────────────────────────────────────────────────────────┐
│                        Push Notification Flow                               │
└────────────────────────────────────────────────────────────────────────────┘

User Enables Notifications
         │
         ▼
  Browser Permission
         │
         ▼
  ┌──────────────────┐
  │ Firebase Cloud   │
  │   Messaging      │
  └──────────────────┘
         │
         ├──────────▶ Morning Notification (8:00 AM)
         │            "Good Morning! 💪"
         │            "Today's workout: Full Body"
         │            "Wellness task: [task]"
         │
         └──────────▶ Follow-up Notification (9:00 PM)
                     "Did you complete your wellness task?"
```

## Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                      Task Selection Flow                         │
└─────────────────────────────────────────────────────────────────┘

1. User Opens App
        │
        ▼
2. Load Preferences
   • Categories: [Communication, Mental Health]
   • Relationship: All
   • Enabled: true
        │
        ▼
3. Get Today's Date
   • Date-based seed: 2025-11-16
        │
        ▼
4. Filter Tasks
   • Timing: Daily
   • Categories: Match user selection
   • Relationship: Match user status
   • Result: 47 matching tasks
        │
        ▼
5. Select Task (Deterministic)
   • Index: seed % 47 = task #23
   • Task: "Call a friend or family member"
        │
        ▼
6. Display on HomeScreen
   • WellnessTaskCard renders
   • Categories shown as chips
   • "Mark Complete" button
        │
        ▼
7. User Completes Task
        │
        ▼
8. Save to localStorage
   • Key: wellness_completed_[userId]
   • Value: {taskId, completedAt}
        │
        ▼
9. Update Stats
   • Increment completed count
   • Check achievements
        │
        ▼
10. Show Celebration 🎉
```

## Component Hierarchy

```
App
 │
 ├─ PreferencesContext
 │   └─ User wellness preferences
 │
 ├─ UserProfileContext
 │   └─ Wellness task stats
 │
 ├─ HomeScreen
 │   ├─ Main Workout Card
 │   └─ WellnessTaskCard ⭐ NEW
 │       ├─ Task Description
 │       ├─ Category Chips
 │       ├─ Mark Complete Button
 │       └─ Celebration Animation
 │
 ├─ SettingsScreen
 │   └─ Wellness & Notifications Section ⭐ NEW
 │       ├─ Push Notification Toggle
 │       ├─ Daily Wellness Toggle
 │       ├─ Category Selection (12 options)
 │       ├─ Relationship Status
 │       ├─ Morning Time Picker
 │       ├─ Follow-up Time Picker
 │       └─ Test Notification Button
 │
 └─ UserProfileScreen
     └─ Stats Grid
         └─ Wellness Tasks Card ⭐ NEW
```

## Category System

```
┌─────────────────────────────────────────────────────────────────┐
│                    12 Wellness Categories                        │
└─────────────────────────────────────────────────────────────────┘

┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│  Communication   │  │  Mental Health   │  │    Learning      │
│    (COMM)        │  │      (MH)        │  │    (LEARN)       │
│                  │  │                  │  │                  │
│ • Call friends   │  │ • Mindfulness    │  │ • Read books     │
│ • Send messages  │  │ • Self-care      │  │ • Take courses   │
│ • Express love   │  │ • Reflection     │  │ • New skills     │
└──────────────────┘  └──────────────────┘  └──────────────────┘

┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│  Volunteering    │  │ New Experiences  │  │    Physical      │
│   (VOLUNT)       │  │      (NEW)       │  │     (PHYS)       │
│                  │  │                  │  │                  │
│ • Help others    │  │ • Try new things │  │ • Exercise       │
│ • Community      │  │ • Explore        │  │ • Active tasks   │
│ • Give back      │  │ • Adventure      │  │ • Movement       │
└──────────────────┘  └──────────────────┘  └──────────────────┘

┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│     Nature       │  │ Personal Growth  │  │   Creativity     │
│    (NATURE)      │  │     (GROW)       │  │    (CREATE)      │
│                  │  │                  │  │                  │
│ • Outdoors       │  │ • Self-improve   │  │ • Art & craft    │
│ • Environment    │  │ • Goals          │  │ • Express self   │
│ • Fresh air      │  │ • Development    │  │ • Make things    │
└──────────────────┘  └──────────────────┘  └──────────────────┘

┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│ Seeking Connect. │  │      Media       │  │   Maintenance    │
│     (SEEK)       │  │     (MEDIA)      │  │    (MAINT)       │
│                  │  │                  │  │                  │
│ • Dating         │  │ • Content        │  │ • Daily tasks    │
│ • Meet people    │  │ • Information    │  │ • Routines       │
│ • Relationships  │  │ • Entertainment  │  │ • Upkeep         │
└──────────────────┘  └──────────────────┘  └──────────────────┘
```

## Achievement Progression

```
┌─────────────────────────────────────────────────────────────────┐
│                   Wellness Achievement Path                      │
└─────────────────────────────────────────────────────────────────┘

    0 ────▶ 1 ────▶ 10 ────▶ 25 ────▶ 50 ────▶ 100+
    │       │        │         │         │         │
    │       ▼        ▼         ▼         ▼         ▼
    │     🌱       🌿        🍀        🌺        🌸
    │   Beginner Explorer Enthusiast Champion  Master
    │   (Bronze)  (Bronze)  (Silver)   (Gold)  (Platinum)
    │
    └─ Start Here!

Progress Tracking:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Completion stats visible on Profile
Achievements unlock automatically
Celebration animations on milestones
```

## Notification Timeline

```
┌─────────────────────────────────────────────────────────────────┐
│                    Daily Notification Flow                       │
└─────────────────────────────────────────────────────────────────┘

Sunday      Monday      Tuesday     Wednesday   Thursday    Friday      Saturday
  │           │           │           │           │           │           │
  ▼           ▼           ▼           ▼           ▼           ▼           ▼
8:00 AM     8:00 AM     8:00 AM     8:00 AM     8:00 AM     8:00 AM     8:00 AM
Morning     Morning     Morning     Morning     Morning     Morning     Weekly
+Daily      +Daily      +Daily      +Daily      +Daily      +Daily      Follow-up
Task        Task        Task        Task        Task        Task        Check-in
  │           │           │           │           │           │           │
  ▼           ▼           ▼           ▼           ▼           ▼           ▼
9:00 PM     9:00 PM     9:00 PM     9:00 PM     9:00 PM     9:00 PM     9:00 PM
Follow-up   Follow-up   Follow-up   Follow-up   Follow-up   Follow-up   Follow-up
Daily       Daily       Daily       Daily       Daily       Daily       Daily
Task        Task        Task        Task        Task        Task        Task

Weekly Task
Sent: Sunday 8:00 AM
Follow-up: Saturday 8:00 AM
```

## Technology Stack

```
┌─────────────────────────────────────────────────────────────────┐
│                      Technology Stack                            │
└─────────────────────────────────────────────────────────────────┘

Frontend
├─ React 19.1.1
├─ Material-UI 7.3.4
├─ Framer Motion 12.23.24
└─ React Router 7.9.5

State Management
├─ React Context API
├─ PreferencesContext (wellness prefs)
└─ UserProfileContext (stats)

Data Storage
├─ localStorage (guest users)
└─ Firebase Firestore (authenticated)

Notifications
├─ Firebase Cloud Messaging
├─ Service Worker API
└─ Notifications API

Build Tools
├─ Vite 7.1.7
├─ ESLint 9.36.0
└─ Node.js scripts
```

## File Organization

```
goodlift/
├─ .github/
│  └─ wellness_tasks.csv          # Source data
│
├─ public/
│  └─ firebase-messaging-sw.js    # Service worker
│
├─ src/
│  ├─ data/
│  │  ├─ wellness_tasks.json      # Generated data ⭐
│  │  └─ achievements.js          # Updated ⭐
│  │
│  ├─ utils/
│  │  └─ wellnessTaskService.js   # Core logic ⭐
│  │
│  ├─ services/
│  │  └─ pushNotificationService.js  # Notifications ⭐
│  │
│  ├─ components/
│  │  ├─ WellnessTaskCard.jsx     # UI component ⭐
│  │  └─ HomeScreen.jsx            # Updated ⭐
│  │
│  ├─ contexts/
│  │  ├─ PreferencesContext.jsx   # Updated ⭐
│  │  └─ UserProfileContext.jsx   # Updated ⭐
│  │
│  ├─ pages/
│  │  ├─ SettingsScreen.jsx       # Updated ⭐
│  │  └─ UserProfileScreen.jsx    # Updated ⭐
│  │
│  └─ firebase.js                  # Updated ⭐
│
├─ scripts/
│  └─ convert-wellness-tasks.js   # CSV converter ⭐
│
└─ Documentation/
   ├─ WELLNESS_NOTIFICATIONS_DOCUMENTATION.md
   ├─ SECURITY_SUMMARY_WELLNESS_NOTIFICATIONS.md
   ├─ TESTING_GUIDE_WELLNESS_NOTIFICATIONS.md
   └─ IMPLEMENTATION_SUMMARY_WELLNESS.md

⭐ = New or significantly modified
```

---

This architecture provides a scalable, maintainable foundation for wellness task management with clear separation of concerns and excellent user experience.
