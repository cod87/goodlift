# Exercise Image Display System

## Overview

The Good Lift app displays exercise demonstration images throughout the UI. This document describes how the image system works and how to maintain it.

## Image Storage

Exercise images are stored in two directories under `public/`:

### 1. Photo Demonstrations (`public/demos/`)
- Format: WebP (`.webp`)
- Count: 60 files on disk, 53 exercises use them
- Content: Real-world exercise demonstrations
- Example: `back-squat.webp`, `barbell-bench-press.webp`

### 2. Muscle Diagrams (`public/svg-muscles/`)
- Format: SVG (`.svg`)
- Count: 103 files, all used by exercises
- Content: Anatomical muscle group diagrams
- Example: `archer-push-up.svg`, `dumbbell-arnold-press.svg`

## Exercise Data Structure

Each exercise in `public/data/exercises.json` has an `image` field that points to the appropriate image:

```json
{
  "Exercise Name": "Back Squat",
  "Primary Muscle": "Quads",
  "Secondary Muscles": "Glutes, Hamstrings, Core",
  "Exercise Type": "Compound",
  "Equipment": "Barbell",
  "Workout Type": "Full Body Strength, Lower Body Strength, Push/Pull/Legs",
  "Progression": "Progressive Overload",
  "image": "demos/back-squat.webp"
}
```

## Image URL Construction

### Utility Function: `constructImageUrl()`

Located in: `src/utils/exerciseDemoImages.js`

This utility handles:
- Converting relative paths to absolute URLs
- Handling Vite's `BASE_URL` for deployment (e.g., `/goodlift/`)
- Supporting absolute HTTP/HTTPS URLs
- Supporting data URLs

**Usage:**
```javascript
import { constructImageUrl } from '../../utils/exerciseDemoImages';

const imageUrl = constructImageUrl(exercise.image);
// Returns: "/goodlift/demos/back-squat.webp" (or similar based on BASE_URL)
```

## Components Using Images

### 1. ExerciseCard (`src/components/Workout/ExerciseCard.jsx`)
**Purpose:** Displays exercise during active workout session

**Props:**
- `image` (string): Path from `exercise.image` field

**Features:**
- Large image display during workout
- Falls back to work-icon.svg if image fails to load
- Handles both landscape and portrait orientations
- Lazy loading for performance

**Example Usage:**
```jsx
<ExerciseCard
  exerciseName="Back Squat"
  image={exercise.image}
  setNumber={1}
  totalSets={3}
  onSubmit={handleSubmit}
/>
```

### 2. WorkoutExerciseCard (`src/components/Common/WorkoutExerciseCard.jsx`)
**Purpose:** Displays exercise in workout builder

**Features:**
- 60x60px thumbnail image
- Shows exercise name, primary muscle, sets/reps controls
- Uses `constructImageUrl(exercise.image)` directly

### 3. ExerciseListItem (`src/components/Common/ExerciseListItem.jsx`)
**Purpose:** Displays exercise in picker/list views

**Features:**
- 56x56px thumbnail image
- Shows exercise name, primary muscle, equipment
- Supports selection highlighting
- Superset color-coding

### 4. WorkoutCreationModal (`src/components/WorkTabs/WorkoutCreationModal.jsx`)
**Purpose:** Exercise selection in workout builder

**Features:**
- 56x56px thumbnail in exercise list
- Filters and search functionality
- Superset management with color coding

## Fallback Behavior

When an image fails to load or is not available:

1. **Primary Fallback:** Display `work-icon.svg` (dumbbell icon)
2. **Visual Indication:** Reduced opacity (0.5) to show it's a fallback
3. **User Message:** Some components show "no demo image available" text

Example from ExerciseCard:
```jsx
{imageSrc ? (
  <Box component="img" src={imageSrc} alt={exerciseName} />
) : (
  <Box component="img" src={workIconUrl} alt="Exercise" 
       sx={{ opacity: 0.5 }} />
)}
```

## Adding New Exercise Images

### Step 1: Create the Image File

**For Photo Demonstrations (WebP):**
1. Create a high-quality exercise demonstration photo
2. Convert to WebP format (recommended: 800x800px or similar)
3. Use lowercase with hyphens: `exercise-name.webp`
4. Place in `public/demos/`

**For Muscle Diagrams (SVG):**
1. Create or obtain an SVG muscle diagram
2. Optimize the SVG (remove unnecessary elements)
3. Use lowercase with hyphens: `exercise-name.svg`
4. Place in `public/svg-muscles/`

### Step 2: Update exercises.json

Add or update the `image` field in the exercise entry:

```json
{
  "Exercise Name": "New Exercise",
  "image": "demos/new-exercise.webp"
}
```

### Step 3: Verify

1. Start the dev server: `npm run dev`
2. Navigate to the exercise in the UI
3. Verify the image displays correctly
4. Check fallback behavior by temporarily breaking the path

## Image Naming Convention

Images use kebab-case (lowercase with hyphens) to match exercise names:

| Exercise Name | Image Filename |
|--------------|----------------|
| "Back Squat" | `back-squat.webp` |
| "Arnold Press, Dumbbell" | `dumbbell-arnold-press.svg` |
| "Bicep Curl, Barbell" | `barbell-bicep-curl.webp` |

**Rules:**
- Convert spaces to hyphens
- All lowercase
- Remove special characters (commas, apostrophes, etc.)
- Equipment prefix before exercise name for clarity

## Performance Considerations

1. **Lazy Loading:** All images use `loading="lazy"` attribute
2. **WebP Format:** Demos use WebP for smaller file sizes (vs JPEG/PNG)
3. **SVG Format:** Muscle diagrams use SVG for scalability and small size
4. **Caching:** Public folder files are cached by the browser
5. **Build Optimization:** Vite handles asset optimization during build

## Troubleshooting

### Images Not Displaying

1. **Check the path:** Verify `exercise.image` field is correct
2. **Check file exists:** Ensure file is in `public/demos/` or `public/svg-muscles/`
3. **Check BASE_URL:** Verify Vite's BASE_URL is set correctly for deployment
4. **Check browser console:** Look for 404 errors or other loading issues
5. **Clear cache:** Browser cache may be stale after changes

### Wrong Image Displayed

1. **Check exercises.json:** Verify the `image` field matches the correct file
2. **Check filename:** Ensure exact match (case-sensitive on some systems)
3. **Check duplicates:** Ensure no duplicate exercise names

### Fallback Icon Shows Instead of Image

1. **Image load error:** Check browser Network tab for 404 or CORS errors
2. **Path incorrect:** Verify path doesn't have extra slashes or wrong directory
3. **Image state:** Check component's `imageError` state in React DevTools

## Testing

### Manual Testing
1. Start dev server: `npm run dev`
2. Navigate to Workout Builder → Add Exercise
3. Verify thumbnails display for all exercises
4. Start a workout session
5. Verify large images display during workout
6. Test landscape and portrait orientations
7. Test with different exercises (webp and svg)

### Automated Testing
Tests are located in `tests/` directory:
- Verify image URLs are constructed correctly
- Verify fallback behavior when images fail
- Verify lazy loading works

## Best Practices

1. **Always use `constructImageUrl()`** - Don't construct paths manually
2. **Handle loading errors** - Always provide fallback behavior
3. **Use lazy loading** - Add `loading="lazy"` for performance
4. **Optimize images** - Keep file sizes reasonable (< 50KB for demos)
5. **Test fallbacks** - Ensure UI works when images fail
6. **Document changes** - Update this doc when making changes to the system

## Related Files

- `src/utils/exerciseDemoImages.js` - Image URL construction utility
- `src/components/Workout/ExerciseCard.jsx` - Workout session display
- `src/components/Common/WorkoutExerciseCard.jsx` - Workout builder card
- `src/components/Common/ExerciseListItem.jsx` - Exercise list item
- `src/components/WorkTabs/WorkoutCreationModal.jsx` - Workout creation modal
- `public/data/exercises.json` - Exercise data with image paths
- `public/demos/` - Photo demonstration images (WebP)
- `public/svg-muscles/` - Muscle diagram images (SVG)

## Migration Notes

### Previous System (Deprecated)
- Previously used `demoImage` and `videoUrl` props
- These are no longer used as of December 2024
- All components now use the `image` field from exercises.json

### Breaking Changes
- None - the system was designed for backward compatibility
- Old `demoImage` prop is still accepted but ignored
- Old `videoUrl` prop is still declared but not used (no exercises have videos)
