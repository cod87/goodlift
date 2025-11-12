# Current Architecture Documentation

**Generated:** November 2025  
**Purpose:** Automated analysis of GoodLift's current React architecture to support migration to a simplified architecture.

---

## Legend

- **KEEP**: Component/dependency/endpoint should be retained in the new architecture
- **MODIFY**: Needs refactoring or simplification before inclusion in new architecture
- **DELETE**: Should be deprecated or removed in favor of simpler alternatives

**Note:** This listing is based on automated code analysis and may be incomplete. For comprehensive auditing, review the actual source files in `/src` directory.

---

## 1. React Components Inventory

### Core Navigation & Layout
- `src/App.jsx` - **KEEP** - Main application component with routing logic
- `src/components/Header.jsx` - **KEEP** - Top header component
- `src/components/NavigationSidebar.jsx` - **KEEP** - Main navigation sidebar
- `src/components/Common/CompactHeader.jsx` - **KEEP** - Reusable compact header component
- `src/components/Common/WeeklyPlanScreen.jsx` - **MODIFY** - Weekly plan screen (may need simplification)

### Home/Dashboard
- `src/components/Home/QuickStartCard.jsx` - **KEEP** - Quick action cards for home screen
- `src/components/Home/WeeklyPlanPreview.jsx` - **KEEP** - Preview widget for weekly plans

### Workout Generation & Management
- `src/components/SelectionScreen.jsx` - **KEEP** - Main workout type/equipment selection
- `src/components/WorkoutScreen.jsx` - **KEEP** - Active workout tracking interface
- `src/components/WorkoutPreview.jsx` - **KEEP** - Preview generated workout before starting
- `src/components/CustomWorkoutPreview.jsx` - **MODIFY** - Custom workout preview (potential duplicate)
- `src/components/CustomizeExerciseScreen.jsx` - **KEEP** - Exercise customization interface
- `src/components/CompletionScreen.jsx` - **KEEP** - Workout completion summary
- `src/components/UnifiedWorkoutHub.jsx` - **KEEP** - Unified hub for workouts and plans
- `src/components/Workout/ExerciseCard.jsx` - **KEEP** - Individual exercise display card
- `src/components/Workout/ExerciseInputs.jsx` - **KEEP** - Input controls for sets/reps/weight

### Workout Plans
- `src/components/WorkoutPlanScreen.jsx` - **KEEP** - Plan management interface
- `src/components/WorkoutPlanBuilderDialog.jsx` - **KEEP** - Dialog for creating workout plans
- `src/components/PlanCreationModal.jsx` - **KEEP** - Modal for plan creation
- `src/components/RecurringSessionEditor.jsx` - **KEEP** - Editor for recurring session templates
- `src/components/SessionBuilderDialog.jsx` - **KEEP** - Dialog for building individual sessions
- `src/components/Calendar.jsx` - **KEEP** - Calendar view for workout plans

### HIIT & Cardio
- `src/components/HiitSessionSelection.jsx` - **KEEP** - HIIT session selector
- `src/components/HiitSessionScreen.jsx` - **KEEP** - HIIT session execution screen
- `src/components/HiitSessionBuilderDialog.jsx` - **KEEP** - HIIT session builder
- `src/components/HiitTimerScreen.jsx` - **MODIFY** - Legacy HIIT timer (may be replaced by UnifiedTimerScreen)
- `src/components/UnifiedTimerScreen.jsx` - **KEEP** - Unified timer for workouts/HIIT/yoga
- `src/pages/CardioScreen.jsx` - **KEEP** - Cardio activity tracking page

### Yoga & Stretching
- `src/components/YogaSessionSelection.jsx` - **KEEP** - Yoga session selector
- `src/components/YogaSessionScreen.jsx` - **KEEP** - Yoga session execution screen
- `src/components/Yoga/YogaSession.jsx` - **MODIFY** - Yoga session component (potential duplicate)
- `src/components/StretchPhase.jsx` - **KEEP** - Stretching phase component
- `src/components/Stretch/StretchSession.jsx` - **KEEP** - Stretching session component

### Mobility
- `src/components/Mobility/MobilityScreen.jsx` - **KEEP** - Mobility exercise screen
- `src/components/Mobility/MobilitySelection.jsx` - **KEEP** - Mobility session selector

### Progress & Analytics
- `src/components/ProgressScreen.jsx` - **KEEP** - Main progress tracking screen
- `src/components/Progress/ActivitiesList.jsx` - **KEEP** - List of past activities
- `src/components/Progress/ChartTabs.jsx` - **KEEP** - Chart visualization tabs
- `src/components/Progress/StatsRow.jsx` - **KEEP** - Statistics display row

### Authentication & User Management
- `src/components/AuthScreen.jsx` - **KEEP** - Login/signup screen
- `src/components/GuestDataMigrationDialog.jsx` - **KEEP** - Dialog for migrating guest data
- `src/components/GuestLogoutDialog.jsx` - **KEEP** - Guest logout confirmation

### Utilities & Shared
- `src/components/ExerciseAutocomplete.jsx` - **KEEP** - Exercise search autocomplete component

### Pages
- `src/pages/ExerciseListPage.jsx` - **KEEP** - Exercise library browser
- `src/pages/SettingsScreen.jsx` - **KEEP** - User settings page
- `src/pages/UnifiedLogActivityScreen.jsx` - **KEEP** - Unified activity logging

---

## 2. Components to be Deprecated

The following components are candidates for deprecation in the simplified architecture:

1. **`src/components/HiitTimerScreen.jsx`** - Replaced by `UnifiedTimerScreen.jsx`
2. **`src/components/CustomWorkoutPreview.jsx`** - Potential duplicate of `WorkoutPreview.jsx`, should be consolidated
3. **`src/components/Yoga/YogaSession.jsx`** - Potentially redundant with `YogaSessionScreen.jsx`, needs consolidation

**Rationale:** The simplified architecture should eliminate duplicate functionality and use unified components where possible.

---

## 3. API Endpoints Inventory

### Local Data Fetching (Static JSON)
- `GET ${BASE_URL}/data/exercises.json` - **KEEP** - Exercise database
- `GET ${BASE_URL}/data/yoga-poses.json` - **KEEP** - Yoga poses library
- `GET /data/stretching-library.json` - **KEEP** - Stretching exercises library

**Note:** The application primarily uses local JSON files for exercise data. No external REST API endpoints detected.

### Firebase Firestore Endpoints
- **Authentication APIs** (Firebase Auth):
  - `createUserWithEmailAndPassword` - **KEEP** - User registration
  - `signInWithEmailAndPassword` - **KEEP** - User login
  - `signOut` - **KEEP** - User logout
  - `onAuthStateChanged` - **KEEP** - Auth state observer

- **Firestore Database APIs**:
  - `users/{userId}/data/userData` - **KEEP** - User workout data storage
    - Stores: `workoutHistory`, `userStats`, `exerciseWeights`, `favoriteExercises`, `workoutPlans`, `yogaSessions`, `yogaConfig`, `yogaTTSEnabled`
  - `users/{userId}/yogaSessions/{sessionId}` - **KEEP** - Individual yoga session records

**Files:** 
- `src/utils/firebaseStorage.js` - Main Firebase storage logic
- `src/hooks/useYogaConfig.js` - Yoga configuration persistence
- `src/hooks/useYogaSessions.js` - Yoga session management
- `src/hooks/useYogaTTS.js` - Yoga TTS settings

---

## 4. State Management Patterns

### Context API (React Contexts)
- **`src/contexts/AuthContext.jsx`** - **KEEP**
  - Manages: User authentication state, guest mode, login/logout flows
  - Provides: `currentUser`, `isGuest`, `hasGuestData`, `signup`, `login`, `logout`, `continueAsGuest`
  
- **`src/contexts/ThemeContext.jsx`** - **KEEP**
  - Manages: Dark/light theme toggle, MUI theme configuration
  - Provides: `mode`, `toggleTheme`, `theme` object

### Local State Management (useState/useReducer)
- **Component-level state:** ~294 instances of `useState`/`useReducer`/`useContext` across components
- **Pattern:** Most components use local `useState` for UI state management
- **Recommendation:** Continue using local state for component-specific concerns; contexts for global state

### Custom Hooks (Business Logic)
- **`src/hooks/useWorkoutGenerator.js`** - **KEEP** - Workout generation logic
- **`src/hooks/useFavoriteExercises.js`** - **KEEP** - Favorite exercise management
- **`src/hooks/useWeeklyPlan.js`** - **KEEP** - Weekly workout plan state
- **`src/hooks/usePlanIntegration.js`** - **KEEP** - Plan integration utilities
- **`src/hooks/useSessionExecution.js`** - **KEEP** - Session execution state
- **`src/hooks/useHideTabBar.js`** - **KEEP** - Tab bar visibility control
- **`src/hooks/useLoginForm.js`** - **KEEP** - Login form state management
- **`src/hooks/useYogaConfig.js`** - **KEEP** - Yoga configuration
- **`src/hooks/useYogaSessions.js`** - **KEEP** - Yoga sessions management
- **`src/hooks/useYogaTTS.js`** - **KEEP** - Yoga text-to-speech settings

### Data Persistence
- **LocalStorage** - **KEEP** - Primary storage for guest users and local caching
  - Files: `src/utils/storage.js`, `src/utils/guestStorage.js`
  - Stores: Workout history, user stats, exercise weights, favorite workouts, plans
  
- **Firebase Firestore** - **KEEP** - Cloud storage for authenticated users
  - File: `src/utils/firebaseStorage.js`
  - Syncs local data to cloud for cross-device access

### State Management Strategy Recommendation
- **KEEP:** Current pattern of Context API for global state + custom hooks for business logic
- **KEEP:** LocalStorage + Firebase dual-storage approach for offline-first experience
- **REMOVE:** Consider removing redundant state if component consolidation occurs

---

## 5. NPM Dependencies Analysis

### Core Framework (KEEP)
- `react: ^19.1.1` - **KEEP** - Core framework
- `react-dom: ^19.1.1` - **KEEP** - React DOM rendering
- `react-router-dom: ^7.9.5` - **KEEP** - Client-side routing
- `vite: ^7.1.7` - **KEEP** (dev) - Build tool and dev server

### UI Component Library (KEEP)
- `@mui/material: ^7.3.4` - **KEEP** - Material-UI component library
- `@mui/icons-material: ^7.3.4` - **KEEP** - Material-UI icons
- `@mui/x-date-pickers: ^8.17.0` - **KEEP** - Date picker components
- `@emotion/react: ^11.14.0` - **KEEP** - Required for MUI styling
- `@emotion/styled: ^11.14.1` - **KEEP** - Required for MUI styling

### Animation & Motion (KEEP)
- `framer-motion: ^12.23.24` - **KEEP** - Animation library for smooth transitions
- `lottie-react: ^2.4.1` - **KEEP** - Lottie animation support

### Firebase & Backend (KEEP)
- `firebase: ^12.5.0` - **KEEP** - Backend infrastructure (Auth, Firestore)

### Data Visualization (KEEP)
- `chart.js: ^4.5.1` - **KEEP** - Chart library
- `react-chartjs-2: ^5.3.1` - **KEEP** - React wrapper for Chart.js

### Forms & Validation (KEEP)
- `formik: ^2.4.6` - **KEEP** - Form management library

### State Management & Data Fetching (KEEP)
- `@tanstack/react-query: ^5.90.6` - **KEEP** - Used for async data fetching and caching (yoga poses, exercises, HIIT sessions)

### Date Utilities (KEEP)
- `date-fns: ^4.1.0` - **KEEP** - Date manipulation utilities

### Data Processing (KEEP)
- `papaparse: ^5.5.3` - **KEEP** - CSV parsing for data export/import

### Icons & Assets (KEEP)
- `react-icons: ^5.5.0` - **KEEP** - Additional icon library

### Utilities (KEEP)
- `clsx: ^2.1.1` - **KEEP** - Conditional className utility
- `prop-types: ^15.8.1` - **KEEP** - Runtime prop validation

### Development Dependencies (KEEP)
- `@vitejs/plugin-react: ^5.0.4` - **KEEP** - Vite React plugin
- `eslint: ^9.36.0` - **KEEP** - Code linting
- `@eslint/js: ^9.36.0` - **KEEP** - ESLint JavaScript config
- `eslint-plugin-react-hooks: ^5.2.0` - **KEEP** - React hooks linting rules
- `eslint-plugin-react-refresh: ^0.4.22` - **KEEP** - React refresh linting
- `globals: ^16.4.0` - **KEEP** - Global variables definitions
- `@types/react: ^19.1.16` - **KEEP** - TypeScript types for React
- `@types/react-dom: ^19.1.9` - **KEEP** - TypeScript types for React DOM

### Dependencies Status Summary
- **All listed dependencies are actively used** - No candidates for removal identified
- **React Query** is used in: `YogaSessionSelection`, `WorkoutPlanBuilderDialog`, `HiitSessionSelection`, `Yoga/YogaSession`, and `useYogaSessions` hook

---

## 6. Additional Architecture Notes

### File Structure
```
src/
├── components/          # React components organized by feature
├── contexts/           # React Context providers (Auth, Theme)
├── hooks/              # Custom React hooks for business logic
├── pages/              # Top-level page components
├── utils/              # Utility functions and helpers
├── data/               # Static data files
├── styles/             # Global styles
└── assets/             # Static assets
```

### Build & Deployment
- **Build Tool:** Vite (fast builds, optimized bundling)
- **Deployment:** GitHub Pages from `/docs` directory
- **Base URL:** Configured for GitHub Pages deployment

### Code Quality
- **Linting:** ESLint with React-specific rules
- **Component Patterns:** Extensive use of `React.memo` for performance
- **Documentation:** JSDoc comments in utility functions and hooks

### Performance Optimizations
- Code splitting via React.lazy (not detected in current scan)
- Memoization with React.memo
- Efficient algorithms (Fisher-Yates shuffle)
- Parallel Firebase operations with Promise.all

---

## 7. Recommendations for Simplified Architecture

### Component Consolidation
1. **Merge duplicate timer screens:** Consolidate `HiitTimerScreen` into `UnifiedTimerScreen`
2. **Consolidate preview components:** Merge `CustomWorkoutPreview` with `WorkoutPreview`
3. **Review yoga components:** Determine if `Yoga/YogaSession` can be merged with `YogaSessionScreen`

### State Management Simplification
1. **Keep Context API approach** - Proven pattern, no need for Redux
2. **Maintain custom hooks pattern** - Good separation of concerns
3. **Continue dual storage strategy** - LocalStorage + Firebase works well

### Dependency Cleanup
1. **Keep React Query** - Used for data fetching in yoga and HIIT components
2. **Review icon libraries** - May be able to standardize on one (MUI icons vs react-icons)

### API Strategy
1. **Keep local JSON approach** - Good for offline-first experience
2. **Maintain Firebase integration** - Essential for cloud sync
3. **No external API needed** - Current architecture is self-contained

---

## References

- Main source directory: `/src`
- Package configuration: `/package.json`
- Build configuration: `/vite.config.js`
- Firebase configuration: `/src/firebase.js`

---

**Last Updated:** November 2025  
**Maintainer:** Automated analysis tool
