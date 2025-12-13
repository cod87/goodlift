# Static SVG Muscle Diagrams

## Overview

This system pre-generates static SVG muscle diagram files for exercises that don't have demo webp images. The SVGs are created using the existing muscle highlight utility and stored in `/public/svg-muscles/` for efficient serving without runtime generation.

## Architecture

### Components

1. **Generation Script**: `scripts/generate-muscle-svgs.js`
   - Reads exercises from `public/data/exercises.json`
   - Filters exercises without 'Webp File' property
   - Generates SVG for each using `generateMuscleHighlightSvg()`
   - Saves to `/public/svg-muscles/{normalized-name}.svg`
   - Creates a manifest file for verification

2. **Utility Updates**: `src/utils/exerciseDemoImages.js`
   - Updated `getDemoImagePath()` with new priority:
     1. Explicit webp file (highest priority)
     2. Exact name match from available webp demos
     3. Known variations/aliases of webp demos
     4. Pre-generated static SVG file
     5. Dynamic SVG generation (fallback)

3. **Component Updates**: 
   - `WorkoutExerciseCard.jsx` - Updated error handling to fall back to dynamic SVG
   - `ExerciseCard.jsx` - Updated error handling to fall back to dynamic SVG

4. **Verification Page**: `src/pages/SVGVerification.jsx`
   - Visual grid displaying all generated SVGs
   - Shows exercise name, muscles, and filename
   - Can be accessed during development for visual QA

### File Structure

```
/public/
  /svg-muscles/           # Generated SVG files
    archer-push-up.svg
    barbell-clean.svg
    ...
    manifest.json         # Metadata for all generated SVGs
```

## Usage

### Generating SVGs

To generate all SVG files for exercises without webp images:

```bash
npm run generate:svgs
```

This will:
- Process all exercises from `exercises.json`
- Generate 103+ SVG files (as of current data)
- Save them to `/public/svg-muscles/`
- Create/update the manifest file
- Report success/failure statistics

### When to Regenerate

You should regenerate the SVGs when:

1. **New exercises are added** without demo webp images
2. **Exercise data changes** (muscle groups updated)
3. **SVG template is modified** (in `muscleHighlightSvg.js`)
4. **Color scheme is updated** (primary/secondary muscle colors)
5. **Exercise names are changed** (normalization logic)

### Verification

To visually verify all generated SVGs:

1. Start the development server: `npm run dev`
2. Navigate to the SVG verification page (add route in your router)
3. Review the grid of all SVG diagrams
4. Check for:
   - Correct muscle highlighting
   - Proper exercise name display
   - Missing or broken images
   - Color accuracy (primary: cherry red, secondary: pink)

## Implementation Details

### Priority System

The `getDemoImagePath()` function uses this priority order:

```
1. Webp File (explicit) → /demos/{webp-file}
2. Exact webp match   → /demos/{normalized-name}.webp
3. Webp variations    → /demos/{variation}.webp
4. Static SVG         → /svg-muscles/{normalized-name}.svg
5. Dynamic SVG        → data:image/svg+xml,... (fallback)
6. Work icon          → /work-icon.svg (ultimate fallback)
```

### Fallback Behavior

If a static SVG file fails to load (404), the component automatically falls back to generating a dynamic SVG data URL using the exercise's muscle data.

### Name Normalization

Exercise names are normalized consistently:
- Convert to lowercase
- Replace spaces with hyphens
- Remove special characters
- Handle "Movement, Equipment" format
- Examples:
  - "Bench Press, Barbell" → "barbell-bench-press"
  - "Arnold Press, Dumbbell" → "dumbbell-arnold-press"

## Maintenance

### Adding New Exercises

1. Add exercise to `public/data/exercises.json`
2. If no webp demo exists, leave 'Webp File' property empty
3. Run `npm run generate:svgs`
4. The SVG will be automatically generated and ready to use

### Updating the SVG Template

If you modify the SVG template in `src/utils/muscleHighlightSvg.js`:

1. Test your changes with dynamic generation first
2. Run `npm run generate:svgs` to regenerate all static SVGs
3. Verify the changes on the SVG verification page
4. Commit both the updated utility and regenerated SVG files

### Updating Colors or Styles

The SVG colors are defined in `muscleHighlightSvg.js`:
- Primary muscles: `#ce1034` (cherry red)
- Secondary muscles: `#ec5998` (vivid pink)
- Inactive muscles: `#3a3a3a` at 50% opacity (dark gray)

After updating colors, regenerate all SVGs.

## Performance Benefits

### Before (Dynamic Generation)
- SVG generated on every component render
- ~39KB string processing per exercise
- Potential performance impact with many exercises
- Inconsistent rendering across contexts

### After (Static SVGs)
- SVG loaded as a static file
- Browser caching enabled
- No runtime generation overhead
- Consistent representation everywhere
- Fallback to dynamic generation only when needed

## Files Modified

- `scripts/generate-muscle-svgs.js` (new)
- `src/utils/exerciseDemoImages.js` (updated)
- `src/components/Common/WorkoutExerciseCard.jsx` (updated)
- `src/components/Workout/ExerciseCard.jsx` (updated)
- `src/pages/SVGVerification.jsx` (new)
- `package.json` (added script)

## Troubleshooting

### SVGs not displaying

1. Check if the SVG file exists: `ls public/svg-muscles/`
2. Verify the filename matches normalized exercise name
3. Check browser console for 404 errors
4. Ensure fallback to dynamic SVG is working

### Incorrect muscle highlighting

1. Verify exercise data in `exercises.json`
2. Check muscle mapping in `muscleHighlightSvg.js`
3. Regenerate SVGs with updated data
4. Review on verification page

### Generation script fails

1. Check Node.js version (requires ESM support)
2. Verify `exercises.json` is valid JSON
3. Check file permissions on `/public/svg-muscles/`
4. Review error message for specific issues

## Future Enhancements

Possible improvements to consider:

1. **Automatic regeneration** on build (add to prebuild script)
2. **Incremental updates** (only regenerate changed exercises)
3. **SVG optimization** (minification, compression)
4. **Alternative color schemes** (light/dark mode variants)
5. **Interactive verification** (click to see muscle data)
6. **Diff tool** (compare before/after regeneration)
