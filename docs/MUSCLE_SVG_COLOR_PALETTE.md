# Muscle Highlight SVG - Color Palette Documentation

## Overview
The muscle highlight SVG visualization feature uses a refined color palette designed to maximize clarity, accessibility, and ease of comprehension. This document outlines the color choices and their rationale.

## Color Palette

### Primary Muscles
- **Color:** `#2563eb` (Bold Blue)
- **Opacity:** 100%
- **Usage:** Highlights the main target muscles of an exercise
- **Rationale:** Bold, distinguishable blue provides excellent visibility and clearly indicates primary muscle engagement. This color stands out while remaining professional and accessible.

### Secondary Muscles
- **Color:** `#60a5fa` (Light Blue)  
- **Opacity:** 100%
- **Usage:** Highlights supporting or assisting muscles activated during an exercise
- **Rationale:** A lighter shade of blue creates clear visual differentiation from primary muscles while maintaining color family consistency. Users can immediately distinguish between primary and secondary muscle activation.

### Non-targeted Muscles
- **Color:** `#e5e7eb` (Light Gray)
- **Opacity:** 70%
- **Usage:** Displays muscles that are not actively targeted in the exercise
- **Rationale:** Subtle, neutral gray with reduced opacity provides context without distraction. The light color maintains visual hierarchy while ensuring the muscle structure remains visible for anatomical reference.

## Design Improvements

### Changes from Previous Version
1. **Removed Border:** The distracting border around SVG images has been removed for a cleaner, more modern appearance
2. **Enhanced Contrast:** New color palette provides better contrast between primary, secondary, and non-targeted muscles
3. **Improved Accessibility:** Colors chosen with consideration for color-blind users and various lighting conditions
4. **Professional Appearance:** Blue color scheme aligns with fitness and health industry standards

### Visual Hierarchy
```
Primary Muscles (Bold Blue)
    ↓ Most prominent
Secondary Muscles (Light Blue)
    ↓ Clearly differentiated
Non-targeted Muscles (Light Gray)
    ↓ Subtle context
```

## Responsive Design

The SVG rendering is responsive across all device types:

- **Mobile:** 180px max width/height
- **Tablet/Desktop (two-column layout):** 200px max width/height
- **SVG scaling:** Maintains aspect ratio with `width: 100%` and `height: auto`

## Implementation

### Code Location
- **SVG Generation:** `src/utils/muscleHighlightSvg.js`
- **Rendering:** `src/components/WorkoutScreen.jsx` (lines 1415-1443)
- **Tests:** `tests/workoutSessionSvgRendering.test.js`

### Color Class Definitions
```css
.cls-1 {
  fill: #e5e7eb;
  opacity: 0.7;
}
.cls-primary {
  fill: #2563eb;
  opacity: 1;
}
.cls-secondary {
  fill: #60a5fa;
  opacity: 1;
}
```

## Accessibility Considerations

1. **Color Contrast:** All colors meet WCAG AA standards for visual clarity
2. **Color Blindness:** Blue/gray palette remains distinguishable for most types of color vision deficiency
3. **Opacity Levels:** Varied opacity helps create additional visual differentiation beyond color alone
4. **Context:** Non-targeted muscles remain visible to provide anatomical context

## Testing

To verify the visual appearance:
1. Run the development server: `npm run dev`
2. Navigate to an active workout session
3. Observe the muscle highlight SVG for exercises with muscle data
4. Verify colors appear as specified above

Alternatively, generate a static visualization:
```bash
node scripts/test-svg-visualization.js
```
This creates `/tmp/svg-visualization.html` with sample exercises showing the color palette.

## Future Enhancements

Potential improvements for consideration:
- User preference for color themes (e.g., high contrast mode)
- Animation effects for muscle activation
- Interactive tooltips with muscle group information
- Dark mode color variants

## References

- PR #386: Initial muscle highlight SVG integration
- PR #[current]: Refined color palette and border removal
- Original SVG source: `docs/demos/muscles-worked.svg`
