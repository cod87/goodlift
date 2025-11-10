# GoodLift - Workout Planning & Tracking App

A modern, comprehensive React-based workout planning and tracking application that helps you structure your training, track progress, and achieve your fitness goals with intelligent periodization and data-driven insights.

## Features

- **Intelligent Dashboard**: Centralized hub displaying workout stats, upcoming plans, progress charts, and quick-start actions
- **Structured Workout Planning**: Create comprehensive workout plans with automatic periodization and deload weeks
- **Workout Plan Management**: Design multi-week training programs with progressive overload built-in
- **Recurring Session Editing**: Batch edit exercises for all recurring sessions within a training block
- **Real-time Workout Tracking**: Track sets, reps, and weight with a built-in timer
- **Progress Analytics**: View detailed workout history, progression charts, and performance statistics
- **Weight Progression**: Automatically suggests weight increases when you hit progression targets
- **Random Workout Generation**: Optional randomized workout generation for Upper Body, Lower Body, or Full Body training
- **Equipment Filtering**: Filter exercises based on available equipment (Barbells, Dumbbells, Cable Machine, Kettlebells, etc.)
- **Superset Pairing**: Exercises are intelligently paired into supersets based on opposing muscle groups
- **YouTube Demonstrations**: Each exercise includes embedded video demonstrations
- **Data Export**: Download your workout data as CSV files
- **Firebase Integration**: Cloud storage and cross-device syncing for authenticated users

## Performance Optimizations

This application has been optimized for performance with:
- **Code Splitting**: Intelligent bundle splitting reduces initial load time
- **React.memo**: Optimized component re-rendering for smooth UX
- **Efficient Algorithms**: Fisher-Yates shuffle for better exercise randomization
- **Parallel Operations**: Promise.all for faster data synchronization
- **Modular Architecture**: Clean separation of concerns for better maintainability

## Technologies Used

- **React 19** - Modern UI framework
- **Vite** - Fast build tool and dev server with optimized bundling
- **Material-UI (MUI)** - Component library for consistent design
- **Firebase** - Backend infrastructure (pre-configured)
- **Chart.js** - Data visualization for progress tracking
- **LocalStorage** - Client-side workout and progress data storage

## Project Structure

```
src/
├── components/          # React components (memoized for performance)
│   ├── NavigationSidebar.jsx
│   ├── SelectionScreen.jsx
│   ├── WorkoutScreen.jsx
│   ├── WorkoutPreview.jsx
│   ├── CompletionScreen.jsx
│   ├── ProgressScreen.jsx
│   ├── WorkoutPlanScreen.jsx
│   ├── HiitTimerScreen.jsx
│   ├── AuthScreen.jsx
│   ├── Home/
│   │   ├── QuickStartCard.jsx
│   │   └── WeeklyPlanPreview.jsx
│   ├── Progress/
│   │   ├── StatsRow.jsx
│   │   ├── ChartTabs.jsx
│   │   └── ActivitiesList.jsx
│   └── Common/
│       └── CompactHeader.jsx
├── pages/               # Page-level components
│   ├── Dashboard.jsx    # Main dashboard (landing page)
│   ├── CardioScreen.jsx
│   ├── ExerciseListPage.jsx
│   └── UnifiedLogActivityScreen.jsx
├── hooks/               # Custom React hooks with comprehensive documentation
│   ├── useWorkoutGenerator.js
│   ├── usePlanIntegration.js
│   └── useWeeklyPlan.js
├── utils/               # Utility functions with JSDoc documentation
│   ├── constants.js     # Centralized configuration
│   ├── helpers.js       # Helper utilities
│   ├── storage.js       # Data persistence layer
│   ├── firebaseStorage.js
│   └── weeklyPlanDefaults.js
├── contexts/            # React contexts
│   └── AuthContext.jsx
├── App.jsx             # Main application component
├── App.css             # Application styles
└── main.jsx            # Entry point

public/
└── data/
    └── exercises.json  # Exercise database (100+ exercises)
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

**Note:** The GitHub Actions workflow (`.github/workflows/deploy.yml`) is kept as an alternative deployment method but is not used with the main/docs approach.

## Usage

### Getting Started

1. **Dashboard**: Upon login, you'll see the main dashboard with:
   - Your workout statistics (workouts this week, total volume, streak, average duration)
   - Today's planned workout with quick-start button
   - Full week preview with upcoming workouts
   - Quick action buttons for all major features

2. **Plan Your Training**:
   - Navigate to "Workout Plans" to create structured multi-week programs
   - Choose training splits (Push/Pull/Legs, Upper/Lower, Full Body)
   - Set your training frequency and preferences
   - Plans automatically include periodization and deload weeks

3. **Start a Workout**:
   - Quick-start from Dashboard for today's planned workout
   - Or navigate to "Workouts" to customize your session
   - Select workout type (Upper Body, Lower Body, Full Body)
   - Filter by available equipment
   - Generate or customize exercises

4. **Track Your Progress**:
   - Enter weight and reps for each set during your workout
   - View progressive overload suggestions
   - Complete workout and review summary

5. **Monitor Your Growth**:
   - Navigate to "Progress" to view workout history
   - See detailed charts for each exercise
   - Track volume, frequency, and personal records
   - Export data as CSV for external analysis

## Exercise Database

The app includes 100+ strength training exercises categorized by:
- Primary muscle groups
- Equipment requirements
- Exercise type (Compound vs Isolation)
- YouTube demonstration links

## Data Storage

- **LocalStorage**: All workout data, progress, and personal records are stored locally in your browser
- **Firebase**: Pre-configured for future cloud sync features

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Original Project

This React application is a modern conversion of the original vanilla JavaScript version available at [cod87/Good-Lift](https://github.com/cod87/Good-Lift).

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

