/**
 * Test: Workout Session SVG Rendering
 * 
 * Comprehensive test suite for SVG muscle highlight rendering during workout sessions.
 * This tests the full integration from exercise data to SVG display in WorkoutScreen.
 */

import { describe, test, expect } from '@jest/globals';
import { getDemoImagePath } from '../src/utils/exerciseDemoImages.js';
import { 
  isSvgDataUrl, 
  extractSvgFromDataUrl,
  musclesToSvgIds,
  generateMuscleHighlightSvg,
  getMuscleHighlightDataUrl
} from '../src/utils/muscleHighlightSvg.js';

describe('Workout Session SVG Rendering', () => {
  describe('SVG generation for exercises without demo images', () => {
    test('should generate valid SVG for chest exercises', () => {
      const imagePath = getDemoImagePath(
        'Push-Up Variation',
        true,
        null,
        'Chest',
        'Triceps, Front Delts'
      );
      
      expect(isSvgDataUrl(imagePath)).toBe(true);
      const svgContent = extractSvgFromDataUrl(imagePath);
      expect(svgContent).toBeTruthy();
      expect(svgContent.length).toBeGreaterThan(1000);
      
      // Check for chest muscle highlighting
      expect(svgContent).toContain('id="chest"');
      expect(svgContent).toContain('cls-primary'); // Chest should be primary
    });

    test('should generate valid SVG for leg exercises', () => {
      const imagePath = getDemoImagePath(
        'Leg Extension',
        true,
        null,
        'Quads',
        'Glutes, Hamstrings'
      );
      
      expect(isSvgDataUrl(imagePath)).toBe(true);
      const svgContent = extractSvgFromDataUrl(imagePath);
      expect(svgContent).toBeTruthy();
      
      // Check for quads muscle highlighting
      expect(svgContent).toContain('id="quads"');
      expect(svgContent).toContain('cls-primary');
    });

    test('should generate valid SVG for back exercises', () => {
      const imagePath = getDemoImagePath(
        'Wide Grip Pull Down',
        true,
        null,
        'Lats',
        'Biceps, Traps'
      );
      
      expect(isSvgDataUrl(imagePath)).toBe(true);
      const svgContent = extractSvgFromDataUrl(imagePath);
      expect(svgContent).toBeTruthy();
      
      // Check for lats muscle highlighting
      expect(svgContent).toContain('id="lats"');
      expect(svgContent).toContain('cls-primary');
    });

    test('should generate valid SVG for shoulder exercises', () => {
      const imagePath = getDemoImagePath(
        'Lateral Raise',
        true,
        null,
        'Delts',
        'Traps'
      );
      
      expect(isSvgDataUrl(imagePath)).toBe(true);
      const svgContent = extractSvgFromDataUrl(imagePath);
      expect(svgContent).toBeTruthy();
      
      // Check for delts muscle highlighting (maps to front_delts)
      expect(svgContent).toContain('id="front_delts"');
      expect(svgContent).toContain('cls-primary');
    });

    test('should generate valid SVG for arm exercises', () => {
      const imagePath = getDemoImagePath(
        'Concentration Curl',
        true,
        null,
        'Biceps',
        'Forearms'
      );
      
      expect(isSvgDataUrl(imagePath)).toBe(true);
      const svgContent = extractSvgFromDataUrl(imagePath);
      expect(svgContent).toBeTruthy();
      
      // Check for biceps muscle highlighting
      expect(svgContent).toContain('id="biceps"');
      expect(svgContent).toContain('cls-primary');
    });

    test('should generate valid SVG for core exercises', () => {
      const imagePath = getDemoImagePath(
        'Plank',
        true,
        null,
        'Core',
        'Shoulders'
      );
      
      expect(isSvgDataUrl(imagePath)).toBe(true);
      const svgContent = extractSvgFromDataUrl(imagePath);
      expect(svgContent).toBeTruthy();
      
      // Check for core muscle highlighting (maps to abs)
      expect(svgContent).toContain('id="abs"');
      expect(svgContent).toContain('cls-primary');
    });
  });

  describe('SVG rendering structure and validation', () => {
    test('should include proper SVG attributes', () => {
      const svgContent = generateMuscleHighlightSvg('Chest', 'Triceps');
      
      // Check SVG element structure
      expect(svgContent).toMatch(/<svg[^>]+>/);
      expect(svgContent).toContain('xmlns="http://www.w3.org/2000/svg"');
      expect(svgContent).toContain('viewBox="0 0 122.04 117.09"');
    });

    test('should include CSS styling for muscle highlights', () => {
      const svgContent = generateMuscleHighlightSvg('Chest', 'Triceps');
      
      // Check for style definitions
      expect(svgContent).toContain('<style>');
      expect(svgContent).toContain('.cls-1'); // Non-targeted muscles
      expect(svgContent).toContain('.cls-primary'); // Primary muscles
      expect(svgContent).toContain('.cls-secondary'); // Secondary muscles
      
      // Verify contrast colors from PR #383
      expect(svgContent).toContain('#808080'); // Gray for non-targeted
      expect(svgContent).toContain('opacity: 0.5');
      expect(svgContent).toContain('#1db584'); // Highlight color
    });

    test('should properly encode SVG into data URL', () => {
      const dataUrl = getMuscleHighlightDataUrl('Chest', 'Triceps');
      
      expect(dataUrl).toMatch(/^data:image\/svg\+xml,/);
      expect(dataUrl.length).toBeGreaterThan(100);
      
      // Should be URL-encoded
      expect(dataUrl).toContain('%3C'); // Encoded '<'
      expect(dataUrl).toContain('%3E'); // Encoded '>'
    });

    test('should successfully decode SVG from data URL', () => {
      const dataUrl = getMuscleHighlightDataUrl('Chest', 'Triceps');
      const svgContent = extractSvgFromDataUrl(dataUrl);
      
      expect(svgContent).toBeTruthy();
      expect(svgContent).toMatch(/^<svg/);
      expect(svgContent).toContain('</svg>');
      
      // Should be valid XML structure
      expect(svgContent.split('<').length).toBe(svgContent.split('>').length);
    });
  });

  describe('Primary vs Secondary muscle highlighting', () => {
    test('should highlight primary muscle with full opacity', () => {
      const svgContent = generateMuscleHighlightSvg('Chest', 'Triceps');
      
      // Primary muscle (chest) should use cls-primary
      expect(svgContent).toContain('id="chest"');
      const chestSection = svgContent.match(/<g id="chest"[^>]*>[\s\S]*?<\/g>/)[0];
      expect(chestSection).toContain('cls-primary');
    });

    test('should highlight secondary muscles with reduced opacity', () => {
      const svgContent = generateMuscleHighlightSvg('Chest', 'Triceps');
      
      // Secondary muscle (triceps) should use cls-secondary
      expect(svgContent).toContain('id="triceps"');
      const tricepsSection = svgContent.match(/<g id="triceps"[^>]*>[\s\S]*?<\/g>/)[0];
      expect(tricepsSection).toContain('cls-secondary');
    });

    test('should keep non-targeted muscles with low opacity', () => {
      const svgContent = generateMuscleHighlightSvg('Chest', 'Triceps');
      
      // Check that style includes cls-1 for non-targeted muscles
      const styleSection = svgContent.match(/<style>[\s\S]*?<\/style>/)[0];
      expect(styleSection).toContain('.cls-1');
      expect(styleSection).toContain('opacity: 0.5');
    });

    test('should handle multiple secondary muscles', () => {
      const svgContent = generateMuscleHighlightSvg('Quads', 'Glutes, Hamstrings, Core');
      
      expect(svgContent).toContain('id="quads"');
      expect(svgContent).toContain('id="glutes"');
      expect(svgContent).toContain('id="hamstrings"');
      expect(svgContent).toContain('id="abs"'); // Core maps to abs
    });
  });

  describe('Muscle name to SVG ID mapping', () => {
    test('should map common muscle names correctly', () => {
      expect(musclesToSvgIds('Chest')).toContain('chest');
      expect(musclesToSvgIds('Biceps')).toContain('biceps');
      expect(musclesToSvgIds('Triceps')).toContain('triceps');
      expect(musclesToSvgIds('Quads')).toContain('quads');
      expect(musclesToSvgIds('Hamstrings')).toContain('hamstrings');
      expect(musclesToSvgIds('Glutes')).toContain('glutes');
      expect(musclesToSvgIds('Calves')).toContain('calves');
      expect(musclesToSvgIds('Core')).toContain('abs');
      expect(musclesToSvgIds('Lats')).toContain('lats');
      expect(musclesToSvgIds('Traps')).toContain('traps');
    });

    test('should handle shoulder variations', () => {
      expect(musclesToSvgIds('Delts')).toContain('front_delts');
      expect(musclesToSvgIds('Shoulders')).toContain('front_delts');
      expect(musclesToSvgIds('Rear Delts')).toContain('rear_delts');
      expect(musclesToSvgIds('Front Delts')).toContain('front_delts');
    });

    test('should handle back muscle variations', () => {
      expect(musclesToSvgIds('Lats')).toContain('lats');
      expect(musclesToSvgIds('Back')).toContain('lats');
      expect(musclesToSvgIds('Erector Spinae')).toContain('lower_back');
      expect(musclesToSvgIds('Lower Back')).toContain('lower_back');
    });

    test('should handle comma-separated muscle lists', () => {
      const muscles = musclesToSvgIds('Chest, Triceps, Front Delts');
      expect(muscles).toContain('chest');
      expect(muscles).toContain('triceps');
      expect(muscles).toContain('front_delts');
      expect(muscles.length).toBe(3);
    });

    test('should remove duplicate muscle IDs', () => {
      // Delts and Front Delts both map to front_delts
      const muscles = musclesToSvgIds('Delts, Front Delts');
      expect(muscles).toContain('front_delts');
      expect(muscles.length).toBe(1); // Should be deduplicated
    });
  });

  describe('Fallback behavior', () => {
    test('should return SVG when no webp file exists', () => {
      const imagePath = getDemoImagePath(
        'Unknown Exercise',
        true,
        null,
        'Chest',
        'Triceps'
      );
      
      expect(isSvgDataUrl(imagePath)).toBe(true);
    });

    test('should handle missing muscle data gracefully', () => {
      const imagePath = getDemoImagePath(
        'Unknown Exercise',
        true,
        null,
        null, // No primary muscle
        null  // No secondary muscles
      );
      
      // Should still return something (likely work-icon)
      expect(imagePath).toBeTruthy();
    });

    test('should validate SVG before rendering', () => {
      // Create an invalid data URL
      const invalidDataUrl = 'data:image/svg+xml,%3Cdiv%3EInvalid%3C%2Fdiv%3E';
      
      // extractSvgFromDataUrl should return empty string for invalid SVG
      const result = extractSvgFromDataUrl(invalidDataUrl);
      expect(result).toBe('');
    });
  });

  describe('Integration with workout data flow', () => {
    test('should generate consistent SVG for same exercise', () => {
      const imagePath1 = getDemoImagePath('Test Exercise', true, null, 'Chest', 'Triceps');
      const imagePath2 = getDemoImagePath('Test Exercise', true, null, 'Chest', 'Triceps');
      
      expect(imagePath1).toBe(imagePath2);
    });

    test('should generate different SVGs for different muscle groups', () => {
      const chestSvg = getDemoImagePath('Exercise A', true, null, 'Chest', 'Triceps');
      const legSvg = getDemoImagePath('Exercise B', true, null, 'Quads', 'Hamstrings');
      const backSvg = getDemoImagePath('Exercise C', true, null, 'Lats', 'Biceps');
      
      expect(chestSvg).not.toBe(legSvg);
      expect(legSvg).not.toBe(backSvg);
      expect(chestSvg).not.toBe(backSvg);
    });

    test('should handle full body exercises', () => {
      const imagePath = getDemoImagePath(
        'Burpee',
        true,
        null,
        'Full Body',
        'All'
      );
      
      expect(isSvgDataUrl(imagePath)).toBe(true);
      const svgContent = extractSvgFromDataUrl(imagePath);
      expect(svgContent).toBeTruthy();
      
      // Full Body should highlight all muscles
      expect(svgContent).toContain('id="all-muscles"');
    });
  });

  describe('Security and XSS prevention', () => {
    test('should only render validated SVG content', () => {
      // Our SVGs should pass validation
      const validDataUrl = getMuscleHighlightDataUrl('Chest', 'Triceps');
      const validSvg = extractSvgFromDataUrl(validDataUrl);
      expect(validSvg).toBeTruthy();
      
      // Invalid SVG missing expected viewBox should be rejected
      const invalidDataUrl = 'data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Crect%20x%3D%220%22%20y%3D%220%22%20width%3D%22100%22%20height%3D%22100%22%2F%3E%3C%2Fsvg%3E';
      const invalidSvg = extractSvgFromDataUrl(invalidDataUrl);
      expect(invalidSvg).toBe(''); // Should be rejected due to validation
    });

    test('should not allow arbitrary SVG injection', () => {
      // extractSvgFromDataUrl should validate the SVG structure
      const maliciousDataUrl = 'data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cscript%3Econsole.log(%22injected%22)%3C%2Fscript%3E%3C%2Fsvg%3E';
      const result = extractSvgFromDataUrl(maliciousDataUrl);
      
      // Should reject SVG without expected muscle highlight structure
      expect(result).toBe('');
    });

    test('should validate SVG has expected viewBox', () => {
      const dataUrl = getMuscleHighlightDataUrl('Chest', 'Triceps');
      const svgContent = extractSvgFromDataUrl(dataUrl);
      
      expect(svgContent).toContain('viewBox="0 0 122.04 117.09"');
    });

    test('should validate SVG has expected CSS classes', () => {
      const dataUrl = getMuscleHighlightDataUrl('Chest', 'Triceps');
      const svgContent = extractSvgFromDataUrl(dataUrl);
      
      // Should have at least one of the expected classes
      const hasExpectedClasses = 
        svgContent.includes('cls-1') || 
        svgContent.includes('cls-primary') || 
        svgContent.includes('cls-secondary');
      
      expect(hasExpectedClasses).toBe(true);
    });
  });

  describe('Regression tests', () => {
    test('should maintain PR #383 contrast improvements', () => {
      const svgContent = generateMuscleHighlightSvg('Chest', 'Triceps');
      
      // Verify non-targeted muscles use #808080 at 0.5 opacity (PR #383)
      const styleSection = svgContent.match(/<style>[\s\S]*?<\/style>/)[0];
      expect(styleSection).toContain('#808080');
      expect(styleSection).toMatch(/opacity:\s*0\.5/);
    });

    test('should preserve SVG structure from canonical template', () => {
      const svgContent = generateMuscleHighlightSvg('Chest', 'Triceps');
      
      // Should have the canonical structure
      expect(svgContent).toContain('id="Layer_2"');
      expect(svgContent).toContain('id="Layer_1-2"');
      expect(svgContent).toContain('id="all-muscles"');
    });

    test('should not break existing webp image loading', () => {
      // Exercises with webp files should still use webp, not SVG
      const imagePath = getDemoImagePath(
        'Bench Press',
        true,
        'barbell-bench-press.webp',
        'Chest',
        'Triceps'
      );
      
      // Should return webp path, not SVG
      expect(isSvgDataUrl(imagePath)).toBe(false);
      expect(imagePath).toContain('.webp');
    });
  });
});
