# GoodLift - React Workout Randomizer

A modern, optimized React-based workout randomization application that helps you create randomized strength training workouts with exercise tracking and progress monitoring.

## Features

- **Randomized Workout Generation**: Generate workouts for Upper Body, Lower Body, or Full Body training
- **Fitness Plan Wizard**: Create comprehensive, science-based fitness plans with automatic periodization and deload weeks
- **Recurring Session Editing**: Batch edit exercises for all recurring sessions within a training block
- **Equipment Filtering**: Filter exercises based on available equipment (Barbells, Dumbbells, Cable Machine, Kettlebells, etc.)
- **Superset Pairing**: Exercises are intelligently paired into supersets based on opposing muscle groups
- **Real-time Workout Tracking**: Track sets, reps, and weight with a built-in timer
- **Progress History**: View your workout history and statistics
- **Weight Progression**: Automatically suggests weight increases when you hit progression targets
- **YouTube Demonstrations**: Each exercise includes embedded video demonstrations
- **Data Export**: Download your workout data as CSV files
- **Firebase Integration**: Cloud storage and cross-device syncing for authenticated users

## Fitness Plans

The Fitness Plan Wizard helps you create structured, science-based training programs with automatic periodization, progressive overload, and comprehensive cardio/recovery protocols.

### Creating a Fitness Plan

1. **Navigate to Fitness Plans**: Click on "Fitness Plans" from the main navigation
2. **Start the Wizard**: Click "Create New Plan" to open the Fitness Plan Wizard
3. **Follow the 4-Step Process**:
   - **Step 1: Plan Duration** - Configure plan basics and progression settings
   - **Step 2: Weekly Structure** - Allocate training days and configure protocols
   - **Step 3: Workout Design** - Customize exercises for each workout
   - **Step 4: Review & Confirm** - Review and create your plan

### Step 1: Plan Duration & Progression

**Choose Your Duration:**
- **4 weeks**: Single training block (3 heavy weeks + 1 deload)
- **8 weeks**: Two training blocks for continued progression
- **12 weeks**: Three training blocks for comprehensive transformation

**Progressive Overload Settings:**
- Enable automatic weight progression when you hit target reps
- Configure weight increase amount (default: 5 lbs/kg)
- Set target reps for progression (default: 12 reps)
- Track progression history for each exercise

### Step 2: Weekly Structure & Protocols

**Allocate Training Days** (must total 7 days):
- **Strength Training** (0-6 days): Resistance training with progressive overload
- **Cardio** (0-6 days): Cardiovascular exercise
- **Active Recovery** (0-6 days): Restorative sessions
- **Rest** (0-6 days): Complete rest and recovery

**Cardio Protocol Configuration:**
- **Steady State**: Maintain consistent pace for cardiovascular endurance
  - Duration: 10-90 minutes
  - Intensity: Low (60-70%), Moderate (70-80%), or High (80-90% max HR)
- **Intervals**: Alternate high and low intensity to improve VO2 max
  - Duration: 10-90 minutes
  - Intensity: Low, Moderate, or High
- **HIIT**: Short maximum effort bursts for metabolic conditioning
  - Duration: 10-90 minutes
  - Intensity: Low, Moderate, or High

**Recovery Protocol Configuration:**
- **Restorative Yoga**: Gentle poses for relaxation and recovery (15-60 min)
- **Mobility Work**: Joint mobility and controlled articular rotations (15-60 min)
- **Dynamic Stretching**: Movement-based stretches for flexibility (15-60 min)

### Step 3: Workout Design

**Customize Your Workouts:**
- Review AI-generated exercise selections
- Adjust sets, reps, and starting weights
- **Replace exercises** using the swap button (filters by muscle group)
- Each workout repeats throughout the plan's heavy weeks

**Workout Types by Training Days:**
- 1 day/week: Full Body
- 2 days/week: Upper/Lower Split
- 3 days/week: Upper/Lower/Full
- 4 days/week: Upper/Lower/Upper/Lower
- 5 days/week: Upper/Lower/Push/Pull/Legs
- 6 days/week: Push/Pull/Legs (repeated 2x)

### Step 4: Review & Confirm

- Review complete plan structure
- Verify all settings and exercises
- Create plan - automatically activated and added to calendar

### Science-Based Periodization

**4-Week Block Structure:**
- **Weeks 1-3**: Progressive training weeks with consistent exercises
- **Week 4**: Deload week
  - 50% reduction in volume (sets)
  - 40% reduction in intensity (weight)
  - Promotes recovery and prevents overtraining

**Progressive Overload:**
- System tracks when you hit rep targets
- Suggests weight increases automatically
- Maintains progression history per exercise
- Optimizes muscle adaptation and strength gains

### Using Your Fitness Plan

**Calendar Integration:**
- All sessions appear on your training calendar
- Color-coded by type (strength, cardio, recovery, rest)
- Track completion status
- View upcoming sessions

**Workout Execution:**
- Start workouts directly from the calendar
- Follow prescribed exercises, sets, and reps
- Track weights and performance
- Receive progression suggestions

**Plan Management:**
- View active plan details
- Track progress through blocks and weeks
- Modify exercises if needed
- Deactivate or delete plans

### Tips for Success

1. **Start Conservative**: Choose weights you can complete with good form
2. **Follow the Deload**: Don't skip deload weeks - recovery is crucial
3. **Track Consistently**: Log all workouts to enable progression tracking
4. **Listen to Your Body**: Adjust intensity if needed, especially during deload
5. **Stay Consistent**: Follow your plan for the full duration to see results

### Troubleshooting

**Q: Can I modify exercises mid-plan?**
A: Yes, use the workout editor to swap exercises anytime. Changes apply to future sessions.

**Q: What if I miss a workout?**
A: Simply continue with your plan. The system tracks by calendar date, not completion.

**Q: How does progressive overload work?**
A: When you complete all sets at or above your target reps, the system suggests increasing weight by your configured amount (default 5 lbs/kg).

**Q: Can I have multiple active plans?**
A: Only one plan can be active at a time. Deactivate the current plan to activate another.

**Q: What if I want different exercises for different blocks?**
A: Currently, exercises repeat across blocks. You can modify exercises between blocks manually.

### FAQ

**Q: How long should my plan be?**
- Beginners: 4-8 weeks to learn movements and build foundation
- Intermediate: 8-12 weeks for sustained progression
- Advanced: 12+ weeks with periodic plan updates

**Q: How many strength days should I do?**
- Beginners: 2-3 days for recovery time
- Intermediate: 3-4 days for balanced progression
- Advanced: 4-6 days with proper volume management

**Q: Should I do cardio on strength days?**
- Light cardio: Yes, after lifting or separate session
- HIIT: Best on non-lifting days or at least 6 hours apart
- Steady state: Flexible, won't interfere significantly

**Q: When should I do deload weeks?**
- The system automatically schedules deload every 4th week
- Additional deloads may be needed if feeling overly fatigued
- Listen to your body - recovery is when you actually grow stronger

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
│   ├── Navigation/
│   │   └── BottomNav.jsx      # Fixed bottom navigation
│   ├── HomeScreen.jsx
│   ├── SelectionScreen.jsx
│   ├── WorkoutScreen.jsx
│   ├── WorkoutPreview.jsx
│   ├── CompletionScreen.jsx
│   ├── ProgressScreen.jsx
│   └── AuthScreen.jsx
├── pages/              # Page-level components
│   ├── SettingsScreen.jsx
│   ├── ExerciseListPage.jsx
│   ├── UnifiedTimerScreen.jsx
│   └── UnifiedLogActivityScreen.jsx
├── hooks/              # Custom React hooks with comprehensive documentation
│   └── useWorkoutGenerator.js
├── utils/              # Utility functions with JSDoc documentation
│   ├── constants.js    # Centralized configuration
│   ├── helpers.js      # Helper utilities
│   ├── storage.js      # Data persistence layer
│   └── firebaseStorage.js
├── contexts/           # React contexts
│   ├── AuthContext.jsx
│   ├── ThemeContext.jsx
│   └── PreferencesContext.jsx
├── App.jsx            # Main application component
├── App.css            # Application styles
└── main.jsx           # Entry point

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

### Quick Workout (No Plan Required)
1. **Select Workout Type**: Choose between Full Body, Upper Body, or Lower Body
2. **Filter Equipment**: Select available equipment or choose "All"
3. **Start Workout**: Click "Start Workout" to generate a randomized workout
4. **Track Progress**: Enter weight and reps for each set
5. **Complete Workout**: Review your workout summary and export data if needed

### Structured Fitness Plan
1. **Create a Plan**: Navigate to "Fitness Plans" and click "Create New Plan"
2. **Configure Plan**: Follow the 4-step wizard to set up your training program
3. **View Calendar**: All sessions appear on your training calendar
4. **Execute Workouts**: Start sessions from the calendar and track performance
5. **Monitor Progress**: View progression history and statistics in the Progress tab

For detailed instructions on creating and managing fitness plans, see the [Fitness Plans](#fitness-plans) section above.

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

