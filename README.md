# GoodLift - Fitness Activity Tracker

A modern React-based fitness tracking application focused on logging your workouts and monitoring your progress.

## Features

- **Quick Workout Generation**: Generate randomized strength training workouts for Upper Body, Lower Body, or Full Body
- **Equipment Filtering**: Filter exercises based on available equipment (Barbells, Dumbbells, Cable Machine, Kettlebells, etc.)
- **Real-time Workout Tracking**: Track sets, reps, and weight with a built-in timer
- **Activity Logging**: Log all your fitness activities including strength training, cardio, and mobility work
- **Nutrition Tracking**: Track your daily food intake using USDA FoodData Central database with macronutrient goals
- **Progress Tracking**: View your workout history and track your fitness journey
- **Streak Tracking**: Monitor consecutive days of activity to stay motivated
- **Weight Progression**: Automatically suggests weight increases when you hit progression targets
- **Personal Records**: Track your PRs across all exercises
- **Calendar View**: See your logged activities with color-coded markers
- **YouTube Demonstrations**: Each exercise includes embedded video demonstrations
- **Data Export**: Download your workout data as CSV files
- **Firebase Integration**: Cloud storage and cross-device syncing for authenticated users
- **Push Notifications**: Daily workout reminders and motivational messages (requires notification permission)

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

### Storage Architecture

GoodLift uses a hybrid storage approach combining localStorage with Firebase Cloud Firestore:

- **LocalStorage**: Provides fast, offline-first data access for all workout data
- **Firebase Cloud Firestore**: Enables cross-device synchronization for authenticated users
- **Guest Mode**: Uses localStorage only, with optional data migration to account on signup

### Synced Data Types

When authenticated, the following data automatically syncs across all your devices:

**Workout Data:**
- Complete workout history with all exercises, sets, reps, and weights
- User statistics (total workouts, time spent, current/longest streaks, PRs, volume)
- Exercise target weights and target rep counts

**Session Data:**
- HIIT workout sessions
- Cardio sessions
- Stretching/mobility sessions

**Plans & Templates:**
- Custom workout plans and schedules
- Active workout plan selection
- Saved workout templates
- Favorite workouts
- Custom HIIT presets
- Custom Yoga presets

**Local-Only Data (Not Synced):**
- UI preferences (theme, volume)
- Favorite exercises list
- Pinned exercises for dashboard

### How Sync Works

1. **On Login**: Cloud data automatically downloads and merges with local data
2. **On Data Change**: Updates save locally first, then sync to cloud in the background
3. **On Logout**: Returns to guest mode using only local storage
4. **Offline**: App works fully offline, syncing when connection returns

See [FIREBASE_SETUP.md](FIREBASE_SETUP.md) for technical details and push notification setup.

## Push Notifications

GoodLift supports push notifications for daily workout reminders and motivational messages.

### For Users

**Enabling Notifications:**
1. Login to your GoodLift account (notifications not available for guest users)
2. When prompted, click "Allow" to enable browser notifications
3. You'll receive daily reminders at 8 AM UTC to help maintain your fitness streak

**Requirements:**
- Must be logged in with an authenticated account
- Browser must support push notifications (Chrome, Firefox, Edge, Safari 16.4+)
- Notification permission must be granted
- Internet connection for initial setup

**Troubleshooting:**
- If not receiving notifications, check browser notification settings
- Ensure you're logged in (not in guest mode)
- Try logging out and back in to refresh your notification token
- Check that notifications are enabled in your browser settings for this site

### For Developers

See [FIREBASE_SETUP.md](FIREBASE_SETUP.md) for complete setup instructions including:
- VAPID key configuration
- Firebase Cloud Functions deployment
- FCM token management
- Testing and monitoring
- Troubleshooting guide

## Technologies Used

- **React 19** - Modern UI framework
- **Vite** - Fast build tool and dev server with optimized bundling
- **Material-UI (MUI)** - Component library for consistent design
- **Firebase** - Backend infrastructure, cloud storage, authentication, and push notifications
- **Chart.js** - Data visualization for progress tracking
- **date-fns** - Date manipulation and formatting
- **USDA FoodData Central** - Nutrition database for food tracking (API provided by the U.S. Department of Agriculture)

## Data Sources

This application uses the [USDA FoodData Central](https://fdc.nal.usda.gov/) API to provide comprehensive nutrition information for food tracking. FoodData Central is a data system that provides expanded nutrient profile data and links to related agricultural and experimental research.

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
