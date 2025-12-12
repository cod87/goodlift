/**
 * Test: SVG Muscle Highlight Integration
 * 
 * Verifies that custom muscle highlight SVGs are properly generated and displayed
 * for exercises without demo images in workout sessions.
 */

import { describe, test, expect } from '@jest/globals';
import { getDemoImagePath } from '../src/utils/exerciseDemoImages.js';
import { 
  getMuscleHighlightDataUrl, 
  isSvgDataUrl, 
  extractSvgFromDataUrl,
  musclesToSvgIds 
} from '../src/utils/muscleHighlightSvg.js';

describe('SVG Muscle Highlight Integration', () => {
  describe('Exercise without demo image', () => {
    test('should generate SVG data URL when no webp file exists', () => {
      const imagePath = getDemoImagePath(
        'Archer Push-Up',  // Exercise without webp
        true,
        null,
        'Chest',
        'Lats, Triceps'
      );
      
      expect(imagePath).toBeTruthy();
      expect(isSvgDataUrl(imagePath)).toBe(true);
      expect(imagePath).toMatch(/^data:image\/svg\+xml,/);
    });

    test('should generate different SVGs for different muscle groups', () => {
      const chestSvg = getDemoImagePath(
        'Exercise 1',
        true,
        null,
        'Chest',
        'Triceps'
      );
      
      const legsSvg = getDemoImagePath(
        'Exercise 2',
        true,
        null,
        'Quads',
        'Glutes, Hamstrings'
      );
      
      expect(chestSvg).not.toBe(legsSvg);
      expect(isSvgDataUrl(chestSvg)).toBe(true);
      expect(isSvgDataUrl(legsSvg)).toBe(true);
    });

    test('should extract valid SVG content from data URL', () => {
      const dataUrl = getDemoImagePath(
        'Test Exercise',
        true,
        null,
        'Chest',
        'Triceps'
      );
      
      const svgContent = extractSvgFromDataUrl(dataUrl);
      
      expect(svgContent).toBeTruthy();
      expect(svgContent).toMatch(/^<svg/);
      expect(svgContent).toContain('viewBox="0 0 122.04 117.09"');
      expect(svgContent).toContain('cls-1');
      expect(svgContent).toContain('cls-primary');
    });
  });

  describe('Exercise with demo image', () => {
    test('should return webp path when webp file exists', () => {
      const imagePath = getDemoImagePath(
        'Barbell Bench Press',
        true,
        'barbell-bench-press.webp',
        'Chest',
        'Triceps'
      );
      
      expect(imagePath).toBeTruthy();
      expect(isSvgDataUrl(imagePath)).toBe(false);
      expect(imagePath).toContain('demos/barbell-bench-press.webp');
    });

    test('should fallback to SVG if webp file is invalid', () => {
      const imagePath = getDemoImagePath(
        'Test Exercise',
        true,
        '../../../etc/passwd', // Invalid file path
        'Chest',
        'Triceps'
      );
      
      // Should fallback to SVG generation instead of allowing path traversal
      expect(isSvgDataUrl(imagePath)).toBe(true);
    });
  });

  describe('SVG generation with muscle highlighting', () => {
    test('should generate SVG with primary muscle highlighted', () => {
      const svgDataUrl = getMuscleHighlightDataUrl('Chest', '');
      const svgContent = extractSvgFromDataUrl(svgDataUrl);
      
      expect(svgContent).toBeTruthy();
      expect(svgContent).toContain('cls-primary');
    });

    test('should generate SVG with secondary muscles highlighted', () => {
      const svgDataUrl = getMuscleHighlightDataUrl('Chest', 'Triceps, Delts');
      const svgContent = extractSvgFromDataUrl(svgDataUrl);
      
      expect(svgContent).toBeTruthy();
      expect(svgContent).toContain('cls-secondary');
    });

    test('should use contrast-enhanced colors from PR #383', () => {
      const svgDataUrl = getMuscleHighlightDataUrl('Chest', 'Triceps');
      const svgContent = extractSvgFromDataUrl(svgDataUrl);
      
      // Check for updated contrast values from PR #383
      expect(svgContent).toContain('#808080'); // New non-selected muscle color
      expect(svgContent).toContain('opacity: 0.5'); // New opacity
    });
  });

  describe('Muscle name to SVG ID mapping', () => {
    test('should map common muscle names to SVG IDs', () => {
      expect(musclesToSvgIds('Chest')).toContain('chest');
      expect(musclesToSvgIds('Triceps')).toContain('triceps');
      expect(musclesToSvgIds('Quads')).toContain('quads');
      expect(musclesToSvgIds('Lats')).toContain('lats');
    });

    test('should handle comma-separated muscle lists', () => {
      const ids = musclesToSvgIds('Chest, Triceps, Delts');
      expect(ids).toContain('chest');
      expect(ids).toContain('triceps');
      expect(ids).toContain('front_delts');
    });

    test('should deduplicate muscle IDs', () => {
      const ids = musclesToSvgIds('Shoulders, Front Delts');
      expect(ids).toContain('front_delts');
      expect(ids.length).toBe(1); // Both should map to 'front_delts'
    });
  });

  describe('Fallback behavior', () => {
    test('should return work-icon if no muscle data provided', () => {
      const imagePath = getDemoImagePath(
        'Unknown Exercise',
        true,
        null,
        null,  // No primary muscle
        null   // No secondary muscles
      );
      
      expect(imagePath).toBeTruthy();
      expect(imagePath).toContain('work-icon.svg');
      expect(isSvgDataUrl(imagePath)).toBe(false);
    });

    test('should return null if usePlaceholder is false and no image found', () => {
      const imagePath = getDemoImagePath(
        'Unknown Exercise',
        false,  // Don't use placeholder
        null,
        null,
        null
      );
      
      expect(imagePath).toBeNull();
    });
  });

  describe('SVG validation and security', () => {
    test('should validate SVG structure before rendering', () => {
      const dataUrl = getMuscleHighlightDataUrl('Chest', 'Triceps');
      const extracted = extractSvgFromDataUrl(dataUrl);
      
      // Should pass validation and return content
      expect(extracted).toBeTruthy();
      expect(extracted.length).toBeGreaterThan(0);
    });

    test('should reject invalid SVG data URLs', () => {
      const invalidDataUrl = 'data:image/svg+xml,<script>alert("xss")</script>';
      const extracted = extractSvgFromDataUrl(invalidDataUrl);
      
      // Should fail validation and return empty string
      expect(extracted).toBe('');
    });

    test('should handle malformed data URLs gracefully', () => {
      const malformedUrls = [
        'not a data url',
        'data:image/png,abc',
        'data:image/svg+xml',  // Missing comma
        '',
        null,
        undefined
      ];
      
      malformedUrls.forEach(url => {
        const extracted = extractSvgFromDataUrl(url);
        expect(extracted).toBe('');
      });
    });
  });
});
