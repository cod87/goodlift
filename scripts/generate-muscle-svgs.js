#!/usr/bin/env node

/**
 * Pre-generate Static SVG Muscle Diagrams
 * 
 * This script generates static SVG muscle diagram files for all exercises 
 * that don't have a demo webp image. The generated SVGs are saved to 
 * /public/svg-muscles/ and can be served directly without runtime generation.
 * 
 * Usage:
 *   node scripts/generate-muscle-svgs.js
 * 
 * The script will:
 * 1. Read all exercises from public/data/exercises.json
 * 2. Filter exercises that don't have a 'Webp File' property
 * 3. Generate a muscle highlight SVG for each using the existing utility
 * 4. Save each SVG to public/svg-muscles/{normalized-name}.svg
 * 5. Generate a manifest file listing all created SVGs
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current directory (ESM equivalent of __dirname)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Project root directory
const rootDir = path.join(__dirname, '..');

// Import the muscle SVG generation utility
// We need to use dynamic import since it's an ESM module
let generateMuscleHighlightSvg;
try {
  const module = await import('../src/utils/muscleHighlightSvg.js');
  generateMuscleHighlightSvg = module.generateMuscleHighlightSvg;
  
  if (!generateMuscleHighlightSvg || typeof generateMuscleHighlightSvg !== 'function') {
    throw new Error('generateMuscleHighlightSvg function not found in module');
  }
} catch (error) {
  console.error('❌ Failed to import muscle SVG utility:', error.message);
  console.error('Make sure the file exists at: src/utils/muscleHighlightSvg.js');
  console.error('And exports a function named: generateMuscleHighlightSvg');
  process.exit(1);
}

/**
 * Normalizes an exercise name to create a safe filename
 * Matches the normalization in exerciseDemoImages.js
 */
function normalizeExerciseName(exerciseName) {
  if (!exerciseName) return '';
  
  let name = exerciseName.trim();
  
  // Handle the "Movement, Equipment" format (e.g., "Bench Press, Barbell" -> "Barbell Bench Press")
  const commaIndex = name.lastIndexOf(', ');
  if (commaIndex > 0 && commaIndex < name.length - 2) {
    const movement = name.substring(0, commaIndex).trim();
    const equipment = name.substring(commaIndex + 2).trim();
    if (movement && equipment && !equipment.includes(',')) {
      name = `${equipment} ${movement}`;
    }
  }
  
  return name
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/\s/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Main function to generate all SVG files
 */
async function generateAllSVGs() {
  console.log('🎨 Generating static SVG muscle diagrams...\n');
  
  // 1. Read exercises data
  const exercisesPath = path.join(rootDir, 'public/data/exercises.json');
  const exercisesData = JSON.parse(fs.readFileSync(exercisesPath, 'utf8'));
  
  console.log(`📊 Total exercises: ${exercisesData.length}`);
  
  // 2. Filter exercises without webp files
  const exercisesWithoutWebp = exercisesData.filter(exercise => !exercise['Webp File']);
  console.log(`🔍 Exercises without webp: ${exercisesWithoutWebp.length}`);
  
  // 3. Create output directory if it doesn't exist
  const outputDir = path.join(rootDir, 'public/svg-muscles');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
    console.log(`📁 Created directory: ${outputDir}`);
  } else {
    console.log(`📁 Output directory exists: ${outputDir}`);
  }
  
  // 4. Generate SVG for each exercise
  const manifest = [];
  let successCount = 0;
  let errorCount = 0;
  
  console.log('\n🖼️  Generating SVGs...\n');
  
  for (const exercise of exercisesWithoutWebp) {
    const exerciseName = exercise['Exercise Name'];
    const primaryMuscle = exercise['Primary Muscle'];
    const secondaryMuscles = exercise['Secondary Muscles'] || '';
    
    try {
      // Generate the SVG content
      const svgContent = generateMuscleHighlightSvg(primaryMuscle, secondaryMuscles);
      
      // Create normalized filename
      const normalizedName = normalizeExerciseName(exerciseName);
      const filename = `${normalizedName}.svg`;
      const filePath = path.join(outputDir, filename);
      
      // Write SVG to file
      fs.writeFileSync(filePath, svgContent, 'utf8');
      
      // Add to manifest
      manifest.push({
        exerciseName,
        filename,
        primaryMuscle,
        secondaryMuscles,
        normalizedName,
      });
      
      successCount++;
      console.log(`  ✓ ${exerciseName} → ${filename}`);
    } catch (error) {
      errorCount++;
      console.error(`  ✗ ${exerciseName} - Error: ${error.message}`);
    }
  }
  
  // 5. Write manifest file
  const manifestPath = path.join(outputDir, 'manifest.json');
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf8');
  
  // 6. Summary
  console.log('\n' + '='.repeat(60));
  console.log('✅ SVG Generation Complete!');
  console.log('='.repeat(60));
  console.log(`📊 Total processed: ${exercisesWithoutWebp.length}`);
  console.log(`✓  Successfully generated: ${successCount}`);
  console.log(`✗  Errors: ${errorCount}`);
  console.log(`📁 Output directory: ${outputDir}`);
  console.log(`📄 Manifest file: ${manifestPath}`);
  console.log('='.repeat(60) + '\n');
  
  // 7. Exit with appropriate code
  process.exit(errorCount > 0 ? 1 : 0);
}

// Run the script
generateAllSVGs().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
