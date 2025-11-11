# GoodLift - Workout Planning & Tracking Platform

A modern, comprehensive React-based workout planning and tracking application that helps you plan, execute, and monitor your fitness journey with intelligent workout generation, progress tracking, and data-driven insights.

## Overview

GoodLift is your complete fitness companion, designed to help you:
- **Plan Your Workouts**: Create structured workout plans with automatic periodization and progressive overload tracking
- **Track Your Progress**: Monitor your performance with detailed stats, charts, and workout history
- **Stay Consistent**: Quick-start workouts from your personalized dashboard
- **Train Smart**: Access randomized workouts when you want variety, or stick to your plan
- **Holistic Fitness**: Include cardio, yoga, and mobility work alongside strength training

## Key Features

### 🏠 Dashboard (Landing Page)
Your central hub for all fitness activities:
- **Quick Start**: Launch today's planned workout with one tap
- **Stats Overview**: See your total workouts, average duration, cardio sessions, and yoga sessions at a glance
- **Quick Actions**: Fast access to random workouts, cardio, yoga, and workout plans
- **Body Weight Tracking**: Log and monitor your weight over time
- **Upcoming Workouts**: Preview your next scheduled sessions

### 📅 Workout Planning
- **Structured Plans**: Create comprehensive workout plans with automatic periodization and deload weeks
- **Recurring Session Editing**: Batch edit exercises for all recurring sessions within a training block
- **Smart Scheduling**: Plan your training weeks with intelligent workout distribution
- **Progressive Overload**: Automatic tracking of strength gains and weight progression

### 💪 Strength Training
- **Random Workout Generation**: Generate workouts for Upper Body, Lower Body, or Full Body training (now a feature, not the main focus)
- **Equipment Filtering**: Filter exercises based on available equipment (Barbells, Dumbbells, Cable Machine, Kettlebells, etc.)
- **Superset Pairing**: Exercises are intelligently paired into supersets based on opposing muscle groups
- **Real-time Tracking**: Track sets, reps, and weight with a built-in timer
- **Weight Progression**: Automatically suggests weight increases when you hit progression targets
- **100+ Exercises**: Comprehensive database with YouTube video demonstrations

### 📊 Progress & Analytics
- **Workout History**: View complete workout history with filtering options
- **Performance Charts**: Visualize your progress over time with interactive charts
- **Exercise Tracking**: Pin favorite exercises and track your personal records
- **Calendar View**: See all your completed and planned workouts in a calendar format
- **Data Export**: Download your workout data as CSV files

### 🏃 Cardio & Recovery
- **Cardio Sessions**: Log and track various cardio activities
- **HIIT Workouts**: Built-in HIIT timer with customizable intervals
- **Yoga Sessions**: Multiple yoga flows including flexibility, power, and restorative styles
- **Mobility Work**: Dedicated mobility and stretching routines

### ☁️ Data Sync & Storage
- **Firebase Integration**: Cloud storage and cross-device syncing for authenticated users
- **Guest Mode**: Try the app without signing up (data stored locally)
- **Offline Support**: Full functionality even without internet connection
- **Data Migration**: Seamlessly migrate guest data when you create an account

## Technologies Used

- **React 19** - Modern UI framework with hooks and context
- **Vite** - Fast build tool and dev server with optimized bundling
- **Material-UI (MUI)** - Component library for consistent, modern design
- **Firebase** - Backend infrastructure for authentication and data sync
- **Chart.js** - Data visualization for progress tracking
- **Framer Motion** - Smooth animations and transitions
- **LocalStorage** - Client-side data persistence with cloud sync

## Project Structure

```
src/
├── components/          # React components
│   ├── DashboardScreen.jsx       # Main landing page (NEW)
│   ├── NavigationSidebar.jsx
│   ├── SelectionScreen.jsx       # Random workout generator
│   ├── WorkoutScreen.jsx
│   ├── WorkoutPreview.jsx
│   ├── CompletionScreen.jsx
│   ├── ProgressScreen.jsx        # Full progress view
│   ├── WorkoutPlanScreen.jsx
│   ├── HiitTimerScreen.jsx
│   ├── AuthScreen.jsx
│   └── Home/                     # Dashboard components
│       ├── QuickStartCard.jsx
│       └── WeeklyPlanPreview.jsx
├── pages/               # Page components
│   ├── CardioScreen.jsx
│   ├── ExerciseListPage.jsx
│   └── UnifiedLogActivityScreen.jsx
├── hooks/              # Custom React hooks
│   ├── useWorkoutGenerator.js
│   ├── usePlanIntegration.js
│   └── useFavoriteExercises.js
├── utils/              # Utility functions
│   ├── constants.js
│   ├── helpers.js
│   ├── storage.js
│   ├── firebaseStorage.js
│   └── workoutPlanGenerator.js
├── contexts/           # React contexts
│   └── AuthContext.jsx
├── App.jsx            # Main application component
└── main.jsx           # Entry point

public/
└── data/
    ├── exercises.json  # Exercise database (100+ exercises)
    └── yoga-poses.json # Yoga pose database
```

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/cod87/goodlift.git
cd goodlift
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser to `http://localhost:5173`

### Building for Production

```bash
npm run build
```

The built files will be in the `docs/` directory, ready for GitHub Pages deployment.

### Deploying to GitHub Pages

This repository is configured for deployment to GitHub Pages from the `docs/` directory on the `main` branch:

1. **Build the application:**
   ```bash
   npm run build
   ```
   This creates/updates the `docs/` directory with production-ready files.

2. **Commit and push the changes:**
   ```bash
   git add docs/
   git commit -m "Build for GitHub Pages"
   git push origin main
   ```

3. **Configure GitHub Pages** (one-time setup):
   - Go to your repository Settings → Pages
   - Under "Build and deployment" → "Source", select "Deploy from a branch"
   - Under "Branch", select `main` and `/docs` folder
   - Click "Save"

4. **Access your site:**
   - The site will be available at: `https://cod87.github.io/goodlift/`
   - It may take a few minutes for changes to appear after pushing

## Usage Guide

### Getting Started
1. **Sign Up or Use Guest Mode**: Create an account for cloud sync, or try guest mode to explore
2. **Explore the Dashboard**: Your main hub shows workout stats, quick actions, and upcoming sessions
3. **Log Your Weight**: Track body weight changes over time from the dashboard widget

### Planning Your Workouts
1. **Create a Plan**: Go to "Workout Plans" to create structured training programs
2. **Set Goals**: Choose your experience level, workout frequency, and training style
3. **Review Sessions**: See your upcoming workouts in the calendar view
4. **Quick Start**: Launch today's workout directly from the dashboard

### During Your Workout
1. **Preview**: Review exercises, adjust weights, and customize your workout
2. **Execute**: Follow the exercise-by-exercise flow with built-in timers
3. **Track**: Log sets, reps, and weight for each exercise
4. **Complete**: Review your performance and save to your history

### Monitoring Progress
1. **Dashboard Stats**: See overall statistics at a glance
2. **Full Progress View**: Access detailed history, charts, and analytics
3. **Pin Exercises**: Track specific exercises and monitor progressive overload
4. **Export Data**: Download your workout history as CSV

### Random Workouts (Secondary Feature)
1. **Quick Generation**: Navigate to "Random Workout" in the sidebar
2. **Customize**: Select workout type (Upper/Lower/Full Body) and equipment
3. **Generate**: Create a randomized workout when you want variety
4. **Save Favorites**: Save workouts you enjoy for future use

## App Philosophy

GoodLift has evolved from a random workout generator to a comprehensive workout planning and tracking platform. The app now emphasizes:

1. **Structured Training**: Create and follow workout plans with proper periodization
2. **Progressive Overload**: Track your strength gains over time
3. **Holistic Fitness**: Balance strength training with cardio, yoga, and mobility
4. **Data-Driven Decisions**: Use your workout history to inform future training
5. **Flexibility**: Access random workouts when you need variety, but stay consistent with your plan

Random workout generation remains available as a valuable feature for adding variety or when you don't have a structured plan, but the focus is on helping you build sustainable, progressive training habits.

## Data Storage

- **LocalStorage**: All workout data, progress, and personal records are stored locally in your browser
- **Firebase**: Cloud sync for authenticated users enables cross-device access
- **Guest Mode**: Try the app without commitment; migrate data later when you sign up

## Performance Optimizations

This application has been optimized for performance with:
- **Code Splitting**: Intelligent bundle splitting reduces initial load time
- **React.memo**: Optimized component re-rendering for smooth UX
- **Efficient Algorithms**: Fisher-Yates shuffle for better exercise randomization
- **Parallel Operations**: Promise.all for faster data synchronization
- **Modular Architecture**: Clean separation of concerns for better maintainability

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Original Project

This React application is a modern evolution of the original vanilla JavaScript version available at [cod87/Good-Lift](https://github.com/cod87/Good-Lift).

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

