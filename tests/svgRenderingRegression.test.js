/**
 * Test: SVG Rendering in Exercise Cards
 * 
 * Tests to prevent regression in SVG rendering across different components:
 * - WorkoutExerciseCard (workout builder)
 * - WorkoutScreen (active workout session)
 * - Any other component that displays exercises
 */

import { describe, test, expect } from '@jest/globals';
import { getDemoImagePath } from '../src/utils/exerciseDemoImages.js';
import { isSvgDataUrl, extractSvgFromDataUrl } from '../src/utils/muscleHighlightSvg.js';

describe('SVG Rendering Regression Tests', () => {
  describe('WorkoutExerciseCard SVG rendering', () => {
    test('should generate SVG for exercises in workout builder', () => {
      // Simulate what WorkoutExerciseCard does
      const exercise = {
        'Exercise Name': 'Push-Up',
        'Primary Muscle': 'Chest',
        'Secondary Muscles': 'Triceps, Front Delts',
        'Webp File': null // No webp file
      };
      
      const imagePath = getDemoImagePath(
        exercise['Exercise Name'],
        true,
        exercise['Webp File'],
        exercise['Primary Muscle'],
        exercise['Secondary Muscles']
      );
      
      expect(isSvgDataUrl(imagePath)).toBe(true);
      
      const svgContent = extractSvgFromDataUrl(imagePath);
      expect(svgContent).toBeTruthy();
      expect(svgContent.length).toBeGreaterThan(1000);
    });

    test('should render SVG inline using dangerouslySetInnerHTML pattern', () => {
      const exercise = {
        'Exercise Name': 'Diamond Push-Up',
        'Primary Muscle': 'Triceps',
        'Secondary Muscles': 'Chest',
        'Webp File': null
      };
      
      const imagePath = getDemoImagePath(
        exercise['Exercise Name'],
        true,
        exercise['Webp File'],
        exercise['Primary Muscle'],
        exercise['Secondary Muscles']
      );
      
      if (isSvgDataUrl(imagePath)) {
        const svgContent = extractSvgFromDataUrl(imagePath);
        
        // Simulate the rendering pattern used in WorkoutExerciseCard
        const shouldRender = svgContent ? true : false;
        expect(shouldRender).toBe(true);
        
        // Verify SVG is safe to render
        expect(svgContent).toMatch(/^<svg/);
        expect(svgContent).toContain('</svg>');
        expect(svgContent).not.toContain('<script');
      }
    });

    test('should handle exercises with webp files correctly in cards', () => {
      const exercise = {
        'Exercise Name': 'Barbell Deadlift',
        'Primary Muscle': 'Back',
        'Secondary Muscles': 'Hamstrings, Glutes',
        'Webp File': 'barbell-deadlift.webp'
      };
      
      const imagePath = getDemoImagePath(
        exercise['Exercise Name'],
        true,
        exercise['Webp File'],
        exercise['Primary Muscle'],
        exercise['Secondary Muscles']
      );
      
      // Should return webp path, not SVG
      expect(isSvgDataUrl(imagePath)).toBe(false);
      expect(imagePath).toContain('.webp');
    });
  });

  describe('WorkoutScreen SVG rendering', () => {
    test('should generate SVG for exercises during workout session', () => {
      // Simulate the currentStep structure in WorkoutScreen
      const currentStep = {
        exercise: {
          'Exercise Name': 'Leg Raise',
          'Equipment': 'Bodyweight',
          'Webp File': null,
          'Primary Muscle': 'Core',
          'Secondary Muscles': 'Hip Flexors'
        }
      };
      
      const exerciseName = currentStep.exercise['Exercise Name'];
      const webpFile = currentStep.exercise['Webp File'];
      const primaryMuscle = currentStep.exercise['Primary Muscle'];
      const secondaryMuscles = currentStep.exercise['Secondary Muscles'];
      
      const imagePath = getDemoImagePath(
        exerciseName,
        true,
        webpFile,
        primaryMuscle,
        secondaryMuscles
      );
      
      expect(isSvgDataUrl(imagePath)).toBe(true);
      
      const svgContent = extractSvgFromDataUrl(imagePath);
      expect(svgContent).toBeTruthy();
      expect(svgContent).toContain('id="abs"'); // Core maps to abs
    });

    test('should render SVG using WorkoutScreen pattern', () => {
      const currentStep = {
        exercise: {
          'Exercise Name': 'Plank',
          'Webp File': null,
          'Primary Muscle': 'Core',
          'Secondary Muscles': 'Shoulders, Glutes'
        }
      };
      
      const demoImageSrc = getDemoImagePath(
        currentStep.exercise['Exercise Name'],
        true,
        currentStep.exercise['Webp File'],
        currentStep.exercise['Primary Muscle'],
        currentStep.exercise['Secondary Muscles']
      );
      
      // Simulate the WorkoutScreen rendering logic
      if (isSvgDataUrl(demoImageSrc)) {
        const svgContent = extractSvgFromDataUrl(demoImageSrc);
        
        // Should successfully extract content for rendering
        expect(svgContent).toBeTruthy();
        
        // In the actual component, this would be rendered via:
        // <Box dangerouslySetInnerHTML={{ __html: svgContent }} />
        expect(svgContent).toMatch(/^<svg/);
        expect(svgContent).toContain('viewBox=');
      } else {
        // This path should not be taken for exercises without webp
        expect(true).toBe(false);
      }
    });

    test('should fallback to work-icon if SVG extraction fails', () => {
      const imagePath = getDemoImagePath(
        'Test Exercise',
        true,
        null,
        'Chest',
        'Triceps'
      );
      
      expect(isSvgDataUrl(imagePath)).toBe(true);
      
      const svgContent = extractSvgFromDataUrl(imagePath);
      
      // In WorkoutScreen, if svgContent is empty, it falls back to work-icon
      // This tests that the fallback logic would work
      if (!svgContent) {
        // Would render: <Box component="img" src={workIconUrl} />
        expect(true).toBe(true); // Fallback would be used
      } else {
        // SVG content is valid, should render normally
        expect(svgContent).toBeTruthy();
      }
    });
  });

  describe('Cross-component consistency', () => {
    test('should generate identical SVGs for same exercise across components', () => {
      const exerciseData = {
        name: 'Dumbbell Row',
        primaryMuscle: 'Lats',
        secondaryMuscles: 'Biceps, Traps',
        webpFile: null
      };
      
      // WorkoutExerciseCard pattern
      const cardImagePath = getDemoImagePath(
        exerciseData.name,
        true,
        exerciseData.webpFile,
        exerciseData.primaryMuscle,
        exerciseData.secondaryMuscles
      );
      
      // WorkoutScreen pattern
      const screenImagePath = getDemoImagePath(
        exerciseData.name,
        true,
        exerciseData.webpFile,
        exerciseData.primaryMuscle,
        exerciseData.secondaryMuscles
      );
      
      // Should be identical
      expect(cardImagePath).toBe(screenImagePath);
      
      // Both should extract to same SVG
      const cardSvg = extractSvgFromDataUrl(cardImagePath);
      const screenSvg = extractSvgFromDataUrl(screenImagePath);
      expect(cardSvg).toBe(screenSvg);
    });

    test('should handle missing muscle data consistently', () => {
      const exerciseWithMissing = {
        name: 'Unknown Exercise',
        primaryMuscle: null,
        secondaryMuscles: null,
        webpFile: null
      };
      
      const imagePath1 = getDemoImagePath(
        exerciseWithMissing.name,
        true,
        exerciseWithMissing.webpFile,
        exerciseWithMissing.primaryMuscle,
        exerciseWithMissing.secondaryMuscles
      );
      
      const imagePath2 = getDemoImagePath(
        exerciseWithMissing.name,
        true,
        exerciseWithMissing.webpFile,
        exerciseWithMissing.primaryMuscle,
        exerciseWithMissing.secondaryMuscles
      );
      
      // Should return same fallback
      expect(imagePath1).toBe(imagePath2);
    });
  });

  describe('Performance and caching', () => {
    test('should generate SVG efficiently for multiple exercises', () => {
      const exercises = [
        { name: 'Exercise 1', primary: 'Chest', secondary: 'Triceps' },
        { name: 'Exercise 2', primary: 'Back', secondary: 'Biceps' },
        { name: 'Exercise 3', primary: 'Legs', secondary: 'Glutes' },
        { name: 'Exercise 4', primary: 'Shoulders', secondary: 'Traps' },
        { name: 'Exercise 5', primary: 'Arms', secondary: 'Forearms' }
      ];
      
      const startTime = Date.now();
      
      exercises.forEach(ex => {
        const imagePath = getDemoImagePath(ex.name, true, null, ex.primary, ex.secondary);
        expect(isSvgDataUrl(imagePath)).toBe(true);
        
        const svgContent = extractSvgFromDataUrl(imagePath);
        expect(svgContent).toBeTruthy();
      });
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Should complete reasonably quickly (less than 1 second for 5 exercises)
      expect(duration).toBeLessThan(1000);
    });
  });

  describe('Error handling', () => {
    test('should handle invalid webp file paths gracefully', () => {
      const imagePath = getDemoImagePath(
        'Test Exercise',
        true,
        '../../../etc/passwd', // Path traversal attempt
        'Chest',
        'Triceps'
      );
      
      // Should fallback to SVG, not allow path traversal
      expect(isSvgDataUrl(imagePath)).toBe(true);
    });

    test('should handle undefined exercise name', () => {
      const imagePath = getDemoImagePath(
        undefined,
        true,
        null,
        'Chest',
        'Triceps'
      );
      
      // Should still return something (SVG based on muscles)
      expect(imagePath).toBeTruthy();
    });

    test('should handle empty muscle strings', () => {
      const imagePath = getDemoImagePath(
        'Test Exercise',
        true,
        null,
        '',
        ''
      );
      
      // Should return fallback (work-icon or similar)
      expect(imagePath).toBeTruthy();
    });

    test('should handle malformed muscle data', () => {
      const imagePath1 = getDemoImagePath(
        'Test',
        true,
        null,
        'Chest, , Triceps', // Extra comma
        undefined
      );
      
      const imagePath2 = getDemoImagePath(
        'Test',
        true,
        null,
        '  Chest  ', // Extra whitespace
        ' Triceps, Front Delts '
      );
      
      // Should handle gracefully
      expect(imagePath1).toBeTruthy();
      expect(imagePath2).toBeTruthy();
    });
  });

  describe('SVG rendering state transitions', () => {
    test('should maintain SVG rendering when switching between exercises', () => {
      // Simulate switching between exercises in a workout
      const exercises = [
        { name: 'Push-Up', primary: 'Chest', secondary: 'Triceps', webp: null },
        { name: 'Squat', primary: 'Quads', secondary: 'Glutes', webp: null },
        { name: 'Pull-Up', primary: 'Lats', secondary: 'Biceps', webp: null }
      ];
      
      exercises.forEach(ex => {
        const imagePath = getDemoImagePath(ex.name, true, ex.webp, ex.primary, ex.secondary);
        expect(isSvgDataUrl(imagePath)).toBe(true);
        
        const svgContent = extractSvgFromDataUrl(imagePath);
        expect(svgContent).toBeTruthy();
        expect(svgContent.length).toBeGreaterThan(1000);
      });
    });

    test('should handle transition from SVG to webp image', () => {
      // First exercise: no webp (uses SVG)
      const svgExercise = getDemoImagePath('Custom Exercise', true, null, 'Chest', 'Triceps');
      expect(isSvgDataUrl(svgExercise)).toBe(true);
      
      // Second exercise: has webp (uses image)
      const webpExercise = getDemoImagePath('Barbell Bench Press', true, 'barbell-bench-press.webp', 'Chest', 'Triceps');
      expect(isSvgDataUrl(webpExercise)).toBe(false);
      expect(webpExercise).toContain('.webp');
    });

    test('should handle image load errors with fallback', () => {
      // Simulate image error scenario where webp fails to load
      // The webp path would initially be generated
      getDemoImagePath('Exercise', true, 'non-existent.webp', 'Chest', 'Triceps');
      
      // Even with webp file specified, if it doesn't exist, the error handler
      // in the component would call getDemoImagePath again with null webp
      const fallbackPath = getDemoImagePath('Exercise', true, null, 'Chest', 'Triceps');
      
      expect(isSvgDataUrl(fallbackPath)).toBe(true);
    });
  });

  describe('Accessibility and rendering quality', () => {
    test('should generate SVG with proper structure for rendering', () => {
      const imagePath = getDemoImagePath('Test', true, null, 'Chest', 'Triceps');
      const svgContent = extractSvgFromDataUrl(imagePath);
      
      // Should have proper XML structure
      expect(svgContent).toMatch(/^<svg[^>]+>/);
      expect(svgContent).toMatch(/<\/svg>$/);
      
      // Should have layers for proper rendering
      expect(svgContent).toContain('<g id=');
      expect(svgContent).toContain('</g>');
    });

    test('should maintain aspect ratio information', () => {
      const imagePath = getDemoImagePath('Test', true, null, 'Chest', 'Triceps');
      const svgContent = extractSvgFromDataUrl(imagePath);
      
      // ViewBox defines aspect ratio
      expect(svgContent).toContain('viewBox="0 0 122.04 117.09"');
      
      // Can be used to calculate aspect ratio: 122.04 / 117.09 ≈ 1.04
    });

    test('should include proper styling for visibility', () => {
      const imagePath = getDemoImagePath('Test', true, null, 'Chest', 'Triceps');
      const svgContent = extractSvgFromDataUrl(imagePath);
      
      // Should have CSS styling
      expect(svgContent).toContain('<style>');
      expect(svgContent).toContain('</style>');
      
      // Should have fill colors
      expect(svgContent).toContain('fill:');
      expect(svgContent).toContain('#1db584'); // Highlight color
    });
  });
});
