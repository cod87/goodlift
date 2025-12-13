# Exercise Image System

## Overview

Every exercise in `exercises.json` now has an explicit `image` field that points directly to either:
- A webp photo demonstration in `/public/demos/`
- A static SVG muscle diagram in `/public/svg-muscles/`

This direct mapping approach eliminates broken images, complex fallback chains, and dynamic SVG generation during render.

## Architecture

### Data Structure

Each exercise in `public/data/exercises.json` includes an `image` field:

```json
{
  "Exercise Name": "Back Squat",
  "Primary Muscle": "Quads",
  "Secondary Muscles": "Glutes, Hamstrings, Core",
  "Webp File": "back-squat.webp",
  "image": "demos/back-squat.webp"
}
```

```json
{
  "Exercise Name": "Archer Push-Up",
  "Primary Muscle": "Chest",
  "Secondary Muscles": "Lats, Triceps",
  "image": "svg-muscles/archer-push-up.svg"
}
```

### Components

1. **Updated Components**:
   - `ExerciseCard.jsx` - Uses `image` prop directly, shows work icon on error
   - `WorkoutExerciseCard.jsx` - Uses `exercise.image` directly, shows work icon on error
   - No more dynamic SVG generation or complex fallback chains

2. **Simplified Utility**: `src/utils/exerciseDemoImages.js`
   - `getDemoImagePath(exercise)` - Returns full path from exercise.image field
   - Prepends base URL for deployment path handling
   - Returns null if no image field (triggers fallback icon)

### File Structure

```
/public/
  /demos/                   # Webp photo demonstrations (60 files)
    back-squat.webp
    barbell-bench-press.webp
    ...
  /svg-muscles/            # Pre-generated SVG muscle diagrams (103 files)
    archer-push-up.svg
    back-lever.svg
    ...
  work-icon.svg            # Fallback icon for missing/failed images
```

## Usage

### Adding New Exercises

When adding a new exercise to `exercises.json`:

1. **If you have a webp demo image**:
   - Place the file in `/public/demos/`
   - Add `"Webp File": "filename.webp"` to the exercise
   - Run the update script (see below)

2. **If you don't have a webp demo**:
   - Generate a static SVG using the generation script (see below)
   - Run the update script (see below)

### Updating Image Mappings

After adding or removing images, run the image field update script:

```bash
node scripts/add-image-field.js
```

This script:
- Reads all exercises from `public/data/exercises.json`
- Maps each to its corresponding image file:
  - Uses `Webp File` if present → `demos/{filename}`
  - Otherwise uses static SVG → `svg-muscles/{normalized-name}.svg`
- Updates `exercises.json` with the `image` field

### Generating Static SVGs

To generate SVG muscle diagrams for exercises without webp images:

```bash
npm run generate:svgs
```

This script:
- Reads exercises from `public/data/exercises.json`
- Filters exercises without 'Webp File' property
- Generates SVG for each using muscle highlight utility
- Saves to `/public/svg-muscles/{normalized-name}.svg`
- Reports success/failure statistics

### When to Regenerate

Generate new SVGs when:
1. **New exercises are added** without demo webp images
2. **Exercise muscle data changes** (primary/secondary muscles updated)
3. **SVG template is modified** (in `muscleHighlightSvg.js`)

After regeneration, run `node scripts/add-image-field.js` to update image mappings.

## Benefits of New System

### Before (Complex Fallback Chain)
- ❌ Dynamic SVG generation during render
- ❌ Multiple fallback attempts per image
- ❌ Broken image boxes appeared
- ❌ Complex logic in components
- ❌ Difficult to debug image issues

### After (Direct Mapping)
- ✅ Every exercise has explicit image path
- ✅ Single image load per card
- ✅ Never shows broken image box
- ✅ Simple component logic
- ✅ Easy to debug - just check exercise.image field
- ✅ Faster rendering (no fallback attempts)

## Troubleshooting

### Image Not Showing

1. **Check the exercise data**:
   ```bash
   jq '.[] | select(.["Exercise Name"] == "Your Exercise")' public/data/exercises.json
   ```
   Verify the `image` field exists and points to correct path

2. **Check if file exists**:
   ```bash
   ls public/demos/your-image.webp
   # or
   ls public/svg-muscles/your-exercise.svg
   ```

3. **Re-run image mapping**:
   ```bash
   node scripts/add-image-field.js
   ```

### Adding New Demo Images

1. Add webp file to `/public/demos/`
2. Update exercise in `exercises.json` with `"Webp File": "filename.webp"`
3. Run: `node scripts/add-image-field.js`
4. Commit both `exercises.json` and the webp file

### Name Normalization

Exercise names are normalized for file matching:
- Convert to lowercase
- Replace spaces with hyphens
- Remove special characters
- Handle "Movement, Equipment" → "equipment-movement" format

Examples:
- "Bench Press, Barbell" → "barbell-bench-press"
- "Arnold Press, Dumbbell" → "dumbbell-arnold-press.svg"

## Statistics

Current image distribution:
- Total exercises: 156
- Webp photo demos: 53 (34%)
- Static SVG diagrams: 103 (66%)
- Coverage: 100%

## Files Modified

Key files in this image system:
- `public/data/exercises.json` - Exercise data with image fields
- `scripts/add-image-field.js` - Adds/updates image field mapping
- `scripts/generate-muscle-svgs.js` - Generates static SVG files
- `src/utils/exerciseDemoImages.js` - Simplified image path utility
- `src/components/Workout/ExerciseCard.jsx` - Updated to use image field
- `src/components/Common/WorkoutExerciseCard.jsx` - Updated to use image field
