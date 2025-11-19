import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load exercises data
const exercisesPath = path.join(__dirname, '../public/data/exercises.json');
const exercisesData = JSON.parse(fs.readFileSync(exercisesPath, 'utf8'));

// Get all exercise names and create normalized lookup
const exerciseNames = new Set();
exercisesData.forEach(exercise => {
  const normalized = exercise['Exercise Name']
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
  exerciseNames.add(normalized);
});

// Function to normalize filename
function normalizeFilename(filename) {
  // Remove .webp extension
  let name = filename.replace(/\.webp$/, '');
  
  // Remove trailing size patterns like _600x600 or (1) or similar
  name = name.replace(/_\d+x\d+(\s*\(\d+\))?$/, '');
  
  // Remove UUID patterns (8-4-4-4-12 hex characters)
  name = name.replace(/_[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, '');
  
  // Remove trailing underscores and spaces
  name = name.replace(/[_\s]+$/, '');
  
  // Convert to lowercase
  name = name.toLowerCase();
  
  // Replace spaces and underscores with hyphens
  name = name.replace(/[\s_]+/g, '-');
  
  // Remove any characters that aren't alphanumeric or hyphens
  name = name.replace(/[^a-z0-9-]/g, '');
  
  // Remove multiple consecutive hyphens
  name = name.replace(/-+/g, '-');
  
  // Remove leading/trailing hyphens
  name = name.replace(/^-+|-+$/g, '');
  
  return name + '.webp';
}

// Main function
function renameImages() {
  const demosDir = path.join(__dirname, '../public/demos');
  
  // Read all webp files
  const files = fs.readdirSync(demosDir)
    .filter(f => f.endsWith('.webp'))
    .sort();
  
  console.log(`Found ${files.length} image files to process\n`);
  
  // Track new filenames and handle collisions
  const newFilenames = new Map(); // original -> new
  const usedNames = new Set();
  const renamedFiles = []; // For markdown report
  
  // First pass: calculate new filenames
  files.forEach(originalFilename => {
    let newFilename = normalizeFilename(originalFilename);
    
    // Handle collisions by appending -2, -3, etc.
    if (usedNames.has(newFilename)) {
      let counter = 2;
      const baseName = newFilename.replace(/\.webp$/, '');
      while (usedNames.has(`${baseName}-${counter}.webp`)) {
        counter++;
      }
      newFilename = `${baseName}-${counter}.webp`;
    }
    
    usedNames.add(newFilename);
    newFilenames.set(originalFilename, newFilename);
  });
  
  // Second pass: check alignment with exercises
  newFilenames.forEach((newFilename, originalFilename) => {
    const baseNameWithoutExt = newFilename.replace(/\.webp$/, '');
    const aligns = exerciseNames.has(baseNameWithoutExt) ? 'yes' : 'no';
    
    renamedFiles.push({
      original: originalFilename,
      new: newFilename,
      aligns: aligns
    });
  });
  
  // Third pass: perform actual renames
  console.log('Renaming files...\n');
  newFilenames.forEach((newFilename, originalFilename) => {
    if (originalFilename !== newFilename) {
      const oldPath = path.join(demosDir, originalFilename);
      const newPath = path.join(demosDir, newFilename);
      
      try {
        fs.renameSync(oldPath, newPath);
        console.log(`✓ ${originalFilename} → ${newFilename}`);
      } catch (err) {
        console.error(`✗ Failed to rename ${originalFilename}: ${err.message}`);
      }
    } else {
      console.log(`⊙ ${originalFilename} (no change needed)`);
    }
  });
  
  // Generate markdown report
  console.log('\n\nGenerating alignment report...\n');
  
  let markdown = '# Image Alignment Report\n\n';
  markdown += 'This file lists all demo images, their renamed versions, and whether they align with actual exercise names.\n\n';
  markdown += '| Original Filename | New Filename | Aligns |\n';
  markdown += '|-------------------|--------------|--------|\n';
  
  renamedFiles.forEach(file => {
    markdown += `| ${file.original} | ${file.new} | ${file.aligns} |\n`;
  });
  
  const reportPath = path.join(demosDir, 'image-alignment.md');
  fs.writeFileSync(reportPath, markdown);
  console.log(`Report saved to: ${reportPath}`);
  
  // Summary statistics
  const alignedCount = renamedFiles.filter(f => f.aligns === 'yes').length;
  const notAlignedCount = renamedFiles.filter(f => f.aligns === 'no').length;
  const renamedCount = renamedFiles.filter(f => f.original !== f.new).length;
  
  console.log('\n=== Summary ===');
  console.log(`Total images: ${files.length}`);
  console.log(`Renamed: ${renamedCount}`);
  console.log(`Unchanged: ${files.length - renamedCount}`);
  console.log(`Aligned with exercises: ${alignedCount}`);
  console.log(`Not aligned: ${notAlignedCount}`);
}

// Run the script
try {
  renameImages();
} catch (error) {
  console.error('Error:', error);
  process.exit(1);
}
