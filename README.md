# GoodLift - Fitness Activity Tracker

A modern React-based fitness tracking application focused on logging your workouts and monitoring your progress.

## Features

- **Quick Workout Generation**: Generate randomized strength training workouts for Upper Body, Lower Body, or Full Body
- **Equipment Filtering**: Filter exercises based on available equipment (Barbells, Dumbbells, Cable Machine, Kettlebells, etc.)
- **Real-time Workout Tracking**: Track sets, reps, and weight with a built-in timer
- **Activity Logging**: Log all your fitness activities including strength training, cardio, and mobility work
- **Progress Tracking**: View your workout history and track your fitness journey
- **Streak Tracking**: Monitor consecutive days of activity to stay motivated
- **Weight Progression**: Automatically suggests weight increases when you hit progression targets
- **Personal Records**: Track your PRs across all exercises
- **Calendar View**: See your logged activities with color-coded markers
- **YouTube Demonstrations**: Each exercise includes embedded video demonstrations
- **Data Export**: Download your workout data as CSV files
- **Firebase Integration**: Cloud storage and cross-device syncing for authenticated users

## Core Concepts

### Activity Logging

GoodLift focuses on logging what you've actually done rather than planning future workouts. After each workout or activity session, you can:

- Record exercises, sets, reps, and weights
- Log cardio sessions with duration and intensity
- Track mobility and stretching sessions
- View your complete activity history

### Progress Tracking

The app tracks several key metrics:

- **Current Streak**: Consecutive days with logged activities
- **Total Workouts**: Lifetime workout count
- **Personal Records**: Track weight progression per exercise
- **Total Volume**: Cumulative weight × reps across all workouts
- **Activity Calendar**: Visual representation of your logged activities

### Workout Generation

When starting a workout, you can:

1. Select workout type (Upper Body, Lower Body, Full Body, etc.)
2. Choose available equipment
3. Generate a randomized workout
4. Customize exercises before starting
5. Track your performance in real-time

The workout generator uses an intelligent algorithm to:
- Pair exercises into supersets based on opposing muscle groups
- Balance compound and isolation movements
- Filter by your available equipment
- Avoid duplicate exercises

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

## Usage

### Starting a Workout

1. Navigate to the "Work" tab
2. Click "Start Workout" or "Generate Random Workout"
3. Select your workout type (Upper, Lower, Full Body, etc.)
4. Choose your available equipment
5. Click "Start Workout" to begin
6. Track your sets, reps, and weights
7. Complete the workout to log it

### Viewing Progress

1. Navigate to the "Progress" tab
2. View your activity stats (streak, total workouts, PRs)
3. Browse recent workout history
4. Check the calendar to see logged activities
5. Track your progression over time

### Logging Other Activities

The app supports logging various activity types:

- **Cardio**: Duration-based tracking for running, cycling, etc.
- **HIIT**: High-intensity interval training sessions
- **Mobility**: Joint mobility and flexibility work
- **Stretching**: Static and dynamic stretching sessions

## Exercise Database

The app includes 100+ strength training exercises categorized by:
- Primary muscle groups
- Equipment requirements
- Exercise type (Compound vs Isolation)
- YouTube demonstration links

## Data Storage

- **LocalStorage**: All workout data, progress, and personal records are stored locally in your browser
- **Firebase**: Cloud sync available for authenticated users

## Technologies Used

- **React 19** - Modern UI framework
- **Vite** - Fast build tool and dev server with optimized bundling
- **Material-UI (MUI)** - Component library for consistent design
- **Firebase** - Backend infrastructure and cloud storage
- **Chart.js** - Data visualization for progress tracking
- **date-fns** - Date manipulation and formatting

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Original Project

This React application is a modern conversion of the original vanilla JavaScript version available at [cod87/Good-Lift](https://github.com/cod87/Good-Lift).

## Recent Changes

### v2.0 - Activity Logging Focus (Current)

This version represents a major refactoring to focus on activity logging rather than workout planning:

- ✅ Removed all workout planning/scheduling features
- ✅ Simplified "Work" tab to focus on quick workout start
- ✅ Enhanced calendar to show only logged activities
- ✅ Added activity stats display (streak, total workouts, PRs)
- ✅ Streamlined UI/UX for better user experience

### What Was Removed:

- Fitness Plan Wizard
- Multi-week workout plans
- Scheduled workout sessions
- Plan management interface
- Future workout planning

### What Remains:

- ✅ Quick workout generation
- ✅ Exercise tracking and logging
- ✅ Progress monitoring
- ✅ Streak tracking
- ✅ Personal record tracking
- ✅ Activity calendar
- ✅ Data export

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
