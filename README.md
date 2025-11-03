# GoodLift - React Workout Randomizer

A modern React-based workout randomization application that helps you create randomized strength training workouts with exercise tracking and progress monitoring.

## Features

- **Randomized Workout Generation**: Generate workouts for Upper Body, Lower Body, or Full Body training
- **Equipment Filtering**: Filter exercises based on available equipment (Barbells, Dumbbells, Cable Machine, Kettlebells, etc.)
- **Superset Pairing**: Exercises are intelligently paired into supersets based on opposing muscle groups
- **Real-time Workout Tracking**: Track sets, reps, and weight with a built-in timer
- **Progress History**: View your workout history and statistics
- **Weight Progression**: Automatically suggests weight increases when you hit progression targets
- **YouTube Demonstrations**: Each exercise includes embedded video demonstrations
- **Data Export**: Download your workout data as CSV files
- **Firebase Integration**: Ready for cloud storage and syncing (configured but not actively used in workout flow)

## Technologies Used

- **React 19** - Modern UI framework
- **Vite** - Fast build tool and dev server
- **Firebase** - Backend infrastructure (pre-configured)
- **LocalStorage** - Client-side workout and progress data storage

## Project Structure

```
src/
├── components/          # React components
│   ├── Navigation.jsx
│   ├── Sidebar.jsx
│   ├── WorkoutScreen.jsx
│   ├── CompletionScreen.jsx
│   └── ProgressScreen.jsx
├── hooks/              # Custom React hooks
│   └── useWorkoutGenerator.js
├── utils/              # Utility functions
│   ├── constants.js
│   ├── helpers.js
│   └── storage.js
├── App.jsx            # Main application component
├── App.css            # Application styles
└── main.jsx           # Entry point

public/
└── data/
    └── exercises.json  # Exercise database
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

The built files will be in the `dist/` directory.

### Deploying to GitHub Pages

This repository is configured for automatic deployment to GitHub Pages:

1. The app is automatically deployed when changes are pushed to the `main` branch
2. The GitHub Actions workflow (`.github/workflows/deploy.yml`) handles the build and deployment
3. The site will be available at: `https://cod87.github.io/goodlift/`

**Manual Deployment:**

If you need to trigger a deployment manually:
1. Go to the Actions tab in the GitHub repository
2. Select "Deploy to GitHub Pages" workflow
3. Click "Run workflow" and select the `main` branch

**Configuration:**

- The Vite configuration includes `base: '/goodlift/'` to ensure assets load correctly from the GitHub Pages subdirectory
- The `.nojekyll` file prevents GitHub Pages from processing the site with Jekyll

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

