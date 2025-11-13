# Changelog

All notable changes to this project will be documented in this file.

## [Plan Creation & Calendar Synchronization Fix] - 2025-11-13

### Fixed
- **Calendar Phantom Entries**: Removed automatic default plan creation that caused calendar to display workouts even when no active plan existed
  - Calendar now properly shows empty state after data reset
  - Guest mode no longer displays phantom workout plan
  - "No active plan" state correctly reflected across all UI components
- **Active Plan Handling**: Enhanced `setActivePlan()` API to accept both plan IDs and plan objects
  - Consistent behavior between guest mode and authenticated mode
  - Improved error handling and validation
- **Plan Format Support**: Calendar and components now support both plan formats
  - Session-based plans (with explicit dates from workout generator)
  - Day-based plans (with recurring weekly structure)
  - Seamless handling of both formats across all components
- **Component Synchronization**: All components now properly handle both plan formats and null states
  - MonthCalendarView updated to support both plan types
  - UpcomingWeekTab updated to support both plan types
  - PlanInfoTab properly handles null plan state
  - TodayView properly handles null workout state

### Changed
- `usePlanIntegration` hook no longer auto-creates default plan
- `setActivePlan()` function signature enhanced to accept plan objects in addition to IDs
- Calendar's `getWorkoutForDay()` function now handles both session-based and day-based plans
- UpcomingWeekTab's `getNext7Days()` function now handles both plan formats

### Technical
- All changes are backward compatible
- No data migration required
- Security scan: 0 vulnerabilities found
- Build status: Passing
- Lint status: Passing

### Documentation
- Added PLAN_CREATION_FIX.md with comprehensive fix documentation
- Added IMPLEMENTATION_SUMMARY_PLAN_FIX.md with complete implementation summary
- Includes verification steps for manual testing

## [Yoga Session UI Enhancement] - 2025-11-06

### Added
- New `YogaConfig` component with compact MUI Select controls for session configuration
  - Flow Duration options: 10, 15, or 20 minutes
  - Cool Down Duration options: No cool down (0), 5, or 10 minutes
  - Pose Suggestion Interval options: Every 1-5 minutes
  - Responsive layout (horizontal on desktop, stacked on mobile)
  - Real-time session preview card showing Flow, Cool Down, and Total Duration
  - Inline validation: prevents pose interval > flow duration
  - Success/error Snackbar notifications on save
  - Full accessibility support with InputLabel and aria-labels
  - Touch-friendly design with minimum 44px touch targets
- New `useYogaSessions` hook with react-query for session persistence
  - `useSaveYogaSession()` mutation for saving completed sessions
  - `useGetYogaSessions()` query for fetching session history
  - Automatic persistence to Firestore for authenticated users
  - localStorage fallback for guest users
  - Optimistic updates and cache invalidation
  - Session records include cooldownDisabled flag when cool down is set to 0
- "No cool down" option (value 0) in Cool Down Select
  - Displays as "None" in preview summary
  - Session automatically skips cooldown phase when disabled
  - No cool down poses suggested when cooldown is 0

### Changed
- Updated `YogaScreen` component to use new `YogaConfig` component
  - Replaced RadioGroup controls with compact Select dropdowns
  - Removed local TTS toggle (now uses global TTS from `useYogaTTS` hook)
  - Added graceful handling for missing `yoga-poses.json` with user-friendly error message
  - Cleaner, more compact UI layout
- Updated `YogaSession` component to handle cooldown === 0
  - Automatically skips cooldown phase when Cool Down Duration is set to 0
  - Uses new `useSaveYogaSession` hook for persisting sessions
  - Session duration calculation accounts for disabled cooldown
- Enhanced theme consistency across Yoga components
  - All components now use theme tokens (`primary.main`, `text.secondary`, spacing)
  - Consistent color usage instead of hardcoded hex values

### Removed
- Local TTS toggle from Yoga configuration screen
  - Now relies on global TTS setting from `useYogaTTS` hook
  - Eliminates redundant TTS storage in Yoga-specific config

### Technical Improvements
- React-query integration for yoga session management
- Better separation of concerns with dedicated hooks
- Improved data persistence patterns following existing Firestore/localStorage architecture
- Enhanced form validation with Formik
- More maintainable code structure with clearer component responsibilities

## [Optimization Update] - 2024-11-04

### Added
- Comprehensive JSDoc documentation across all utility functions and hooks
- Code splitting configuration in Vite for better bundle management
- React.memo optimization for SelectionScreen, WorkoutPreview, and CompletionScreen components
- Enhanced constants.js with structured configuration for muscle groups and weight increments
- Detailed inline documentation for complex functions
- Better type safety with PropTypes and displayName for memoized components

### Changed
- Refactored exercise database grouping to use Array.reduce() for better performance
- Optimized Fisher-Yates shuffle algorithm for better randomization
- Improved progressive overload calculation with centralized constants
- Enhanced error handling with proper error propagation in storage functions
- Firebase sync operations now use Promise.all for parallel execution
- Better input validation for storage functions

### Removed
- Unused Sidebar.jsx component (replaced by SelectionScreen.jsx)
- Unused Navigation.jsx component (replaced by BottomNav.jsx with 3-tab navigation)

### Performance Improvements
- **Bundle Size Optimization**: Split monolithic 1.25MB bundle into 5 optimized chunks:
  - vendor.js: 12.27 KB (React core libraries)
  - charts.js: 164.78 KB (Chart.js and react-chartjs-2)
  - mui.js: 255.09 KB (Material-UI components)
  - firebase.js: 459.98 KB (Firebase SDK)
  - index.js: 355.59 KB (Application code)
- **Improved Caching**: Separate vendor bundles enable better browser caching
- **Reduced Re-renders**: React.memo implementation reduces unnecessary component updates
- **Better Randomization**: Fisher-Yates shuffle provides more uniform distribution
- **Parallel Operations**: Promise.all for Firebase operations reduces sync time

### Code Quality
- Added comprehensive JSDoc comments to all major functions
- Improved error handling with meaningful error messages
- Enhanced code consistency across modules
- Better separation of concerns with centralized constants
- Input validation for critical storage operations

### Developer Experience
- Better code maintainability with clear documentation
- Easier debugging with descriptive error messages
- Clearer code structure with separated concerns
- More testable code with smaller, focused functions
