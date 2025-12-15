#!/usr/bin/env node

/**
 * Combine Muscle Group Paths in SVG Files
 * 
 * This script processes all SVG files in public/svg-muscles/ and combines
 * multiple path elements within each muscle group into single compound paths.
 * This allows color changes to be applied to an entire muscle group by changing
 * a single class, rather than multiple classes.
 * 
 * The script:
 * 1. Reads each SVG file
 * 2. Identifies all muscle group <g> elements (children of <g id="all-muscles">)
 * 3. For each muscle group, combines all <path> elements into a single compound path
 * 4. Preserves the "all-muscles" parent group structure unchanged
 * 5. Writes the modified SVG back to the file
 * 
 * Usage:
 *   node scripts/combine-muscle-group-paths.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current directory (ESM equivalent of __dirname)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Project root directory
const rootDir = path.join(__dirname, '..');
const svgDir = path.join(rootDir, 'public/svg-muscles');

/**
 * Combines multiple path elements within a muscle group into a single compound path
 * 
 * NOTE: This function uses line-based parsing which works for the specific format
 * of SVG files in this project. It assumes:
 * - Consistent formatting (one element per line)
 * - Specific attribute order in path elements (class before d)
 * - Self-closing path tags
 * 
 * For more complex or varied SVG formats, consider using a proper XML/DOM parser.
 * 
 * @param {string} svgContent - The complete SVG file content
 * @returns {string} - Modified SVG content with combined paths
 */
function combineMuscleGroupPaths(svgContent) {
  // Split into lines for easier processing
  const lines = svgContent.split('\n');
  const result = [];
  
  let insideAllMuscles = false;
  let insideMuscleGroup = false;
  let currentGroupId = null;
  let currentGroupAttributes = '';
  let currentGroupIndent = '';
  let pathsInGroup = [];
  let commonClass = null;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Check if we're entering the all-muscles group
    if (line.includes('<g id="all-muscles">')) {
      insideAllMuscles = true;
      result.push(line);
      continue;
    }
    
    // Check if we're exiting the all-muscles group (the closing </g> right before </g></svg>)
    if (insideAllMuscles && line.trim() === '</g>' && !insideMuscleGroup) {
      // Check if next non-empty line is also </g> (closing Layer_1-2)
      let nextLineIdx = i + 1;
      while (nextLineIdx < lines.length && lines[nextLineIdx].trim() === '') nextLineIdx++;
      if (nextLineIdx < lines.length && lines[nextLineIdx].trim() === '</g>') {
        insideAllMuscles = false;
      }
      result.push(line);
      continue;
    }
    
    // Inside all-muscles, check for muscle group start
    if (insideAllMuscles && !insideMuscleGroup && line.includes('<g id="') && !line.includes('all-muscles')) {
      insideMuscleGroup = true;
      
      // Extract group ID and attributes
      const match = line.match(/<g id="([^"]+)"([^>]*)>/);
      if (match) {
        currentGroupId = match[1];
        currentGroupAttributes = match[2];
        currentGroupIndent = line.match(/^(\s*)/)[1];
        pathsInGroup = [];
        commonClass = null;
      }
      continue;
    }
    
    // Inside muscle group, collect path elements
    if (insideMuscleGroup && line.includes('<path')) {
      // NOTE: This regex assumes a specific format: class attribute before d attribute
      // and self-closing tags. It works for the SVG files in this project.
      const pathMatch = line.match(/<path\s+class="([^"]+)"\s+d="([^"]+)"\s*\/>/);
      if (pathMatch) {
        const pathClass = pathMatch[1];
        const pathData = pathMatch[2];
        
        pathsInGroup.push(pathData);
        if (!commonClass) {
          commonClass = pathClass;
        }
      }
      continue;
    }
    
    // Check for muscle group end
    if (insideMuscleGroup && line.trim() === '</g>') {
      insideMuscleGroup = false;
      
      // Combine paths and create the new group
      if (pathsInGroup.length > 0) {
        // NOTE: Joining path data with spaces works for SVG compound paths.
        // Each path's d attribute contains complete path commands that can be
        // concatenated. SVG parsers treat spaces between commands as delimiters.
        const combinedPathData = pathsInGroup.join(' ');
        
        // Write the combined group
        result.push(`${currentGroupIndent}<g id="${currentGroupId}"${currentGroupAttributes}>`);
        result.push(`${currentGroupIndent}  <path class="${commonClass}" d="${combinedPathData}"/>`);
        result.push(`${currentGroupIndent}</g>`);
      }
      
      // Reset
      currentGroupId = null;
      currentGroupAttributes = '';
      pathsInGroup = [];
      commonClass = null;
      continue;
    }
    
    // If we're not processing muscle groups, just pass through
    if (!insideMuscleGroup) {
      result.push(line);
    }
  }
  
  return result.join('\n');
}

/**
 * Process a single SVG file
 * 
 * @param {string} filePath - Path to the SVG file
 * @returns {boolean} - True if successful, false otherwise
 */
function processSvgFile(filePath) {
  try {
    // Read the SVG file
    const svgContent = fs.readFileSync(filePath, 'utf8');
    
    // Combine paths within muscle groups
    const modifiedContent = combineMuscleGroupPaths(svgContent);
    
    // Write back to file
    fs.writeFileSync(filePath, modifiedContent, 'utf8');
    
    return true;
  } catch (error) {
    console.error(`  ✗ Error: ${error.message}`);
    return false;
  }
}

/**
 * Main function to process all SVG files
 */
async function processAllSvgFiles() {
  console.log('🎨 Combining muscle group paths in SVG files...\n');
  
  // Get all SVG files
  const files = fs.readdirSync(svgDir)
    .filter(file => file.endsWith('.svg'))
    .sort();
  
  console.log(`📊 Found ${files.length} SVG files\n`);
  
  let successCount = 0;
  let errorCount = 0;
  
  // Process each file
  for (const file of files) {
    const filePath = path.join(svgDir, file);
    console.log(`Processing: ${file}`);
    
    if (processSvgFile(filePath)) {
      successCount++;
      console.log(`  ✓ Combined paths successfully`);
    } else {
      errorCount++;
    }
  }
  
  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('✅ Processing Complete!');
  console.log('='.repeat(60));
  console.log(`📊 Total files: ${files.length}`);
  console.log(`✓  Successfully processed: ${successCount}`);
  console.log(`✗  Errors: ${errorCount}`);
  console.log('='.repeat(60) + '\n');
  
  process.exit(errorCount > 0 ? 1 : 0);
}

// Run the script
processAllSvgFiles().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
