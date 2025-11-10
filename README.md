# GoodLift - React Workout Randomizer

A modern, optimized React-based workout randomization application that helps you create randomized strength training workouts with exercise tracking and progress monitoring.

## Features

- **Randomized Workout Generation**: Generate workouts for Upper Body, Lower Body, or Full Body training
- **Workout Plan Management**: Create comprehensive workout plans with automatic periodization and deload weeks
- **Recurring Session Editing**: Batch edit exercises for all recurring sessions within a training block
- **Equipment Filtering**: Filter exercises based on available equipment (Barbells, Dumbbells, Cable Machine, Kettlebells, etc.)
- **Superset Pairing**: Exercises are intelligently paired into supersets based on opposing muscle groups
- **Real-time Workout Tracking**: Track sets, reps, and weight with a built-in timer
- **Progress History**: View your workout history and statistics
- **Weight Progression**: Automatically suggests weight increases when you hit progression targets
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
│   ├── HiitTimerScreen.jsx
│   └── AuthScreen.jsx
├── hooks/              # Custom React hooks with comprehensive documentation
│   └── useWorkoutGenerator.js
├── utils/              # Utility functions with JSDoc documentation
│   ├── constants.js    # Centralized configuration
│   ├── helpers.js      # Helper utilities
│   ├── storage.js      # Data persistence layer
│   └── firebaseStorage.js
├── contexts/           # React contexts
│   └── AuthContext.jsx
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

1. **Select Workout Type**: Choose between Full Body, Upper Body, or Lower Body
2. **Filter Equipment**: Select available equipment or choose "All"
3. **Start Workout**: Click "Start Workout" to generate a randomized workout
4. **Track Progress**: Enter weight and reps for each set
5. **Complete Workout**: Review your workout summary and export data if needed
6. **View Progress**: Check your workout history and statistics in the Progress tab

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

