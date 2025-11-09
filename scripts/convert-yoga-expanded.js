#!/usr/bin/env node
/**
 * Convert yoga-expanded.csv to yoga-poses.json format
 * This script reads yoga-expanded.csv and generates yoga-poses.json with all fields
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Papa from 'papaparse';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CSV_PATH = path.join(__dirname, '../public/data/yoga-expanded.csv');
const JSON_OUTPUT_PATH = path.join(__dirname, '../public/data/yoga-poses.json');
const DOCS_JSON_OUTPUT_PATH = path.join(__dirname, '../docs/data/yoga-poses.json');

/**
 * Convert CSV data to JSON format with all expanded fields
 * @param {Array} csvData - Parsed CSV data
 * @returns {Array} Array of yoga pose objects
 */
function convertToJSON(csvData) {
  const poses = [];
  
  for (const row of csvData) {
    // Skip empty rows
    const hasContent = Object.values(row).some(val => val && val.trim());
    if (!hasContent) {
      continue;
    }
    
    // Skip rows where Pose Name is empty
    const poseName = row['Pose Name']?.trim();
    if (!poseName) {
      continue;
    }
    
    // Map CSV columns to JSON structure - preserve all fields from expanded CSV
    const pose = {
      "Name": poseName,
      "Sanskrit": row['Sanskrit']?.trim() || '',
      "Primary Muscles": row['Primary Muscles']?.trim() || '',
      "Secondary Muscles": row['Secondary Muscles']?.trim() || '',
      "Type": row['Yoga Type']?.trim() || '',
      "Hold Duration": parseInt(row['Hold Duration (seconds)']) || 30,
      "Benefits": row['Benefits']?.trim() || '',
      "Level": row['Level']?.trim() || '',
      "Category": row['Category']?.trim() || '',
      "Session Type": row['Session Type']?.trim() || '',
      "Props Needed": row['Props Needed']?.trim() || ''
    };
    
    poses.push(pose);
  }
  
  return poses;
}

/**
 * Main conversion function
 */
async function convertYogaPoses() {
  try {
    console.log('Starting yoga-expanded.csv to JSON conversion...');
    console.log(`Reading CSV from: ${CSV_PATH}`);
    
    // Check if CSV file exists
    if (!fs.existsSync(CSV_PATH)) {
      throw new Error(`CSV file not found at: ${CSV_PATH}`);
    }
    
    // Read CSV file
    const csvContent = fs.readFileSync(CSV_PATH, 'utf-8');
    
    // Parse CSV
    const parseResult = Papa.parse(csvContent, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => {
        return header.trim();
      }
    });
    
    if (parseResult.errors.length > 0) {
      console.warn('CSV parsing warnings:');
      parseResult.errors.forEach(err => console.warn(`  - ${err.message}`));
    }
    
    console.log(`Parsed ${parseResult.data.length} rows from CSV`);
    
    // Convert to JSON format
    const poses = convertToJSON(parseResult.data);
    console.log(`Converted ${poses.length} poses`);
    
    // Remove duplicates by pose name (keep first occurrence)
    const uniquePoses = [];
    const seenNames = new Set();
    for (const pose of poses) {
      const name = pose["Name"];
      if (!seenNames.has(name)) {
        seenNames.add(name);
        uniquePoses.push(pose);
      } else {
        console.warn(`  Skipping duplicate: ${name}`);
      }
    }
    console.log(`Removed ${poses.length - uniquePoses.length} duplicate(s), ${uniquePoses.length} unique poses`);
    
    // Validate poses
    if (uniquePoses.length === 0) {
      throw new Error('No poses found after conversion. Check CSV format.');
    }
    
    // Sort poses alphabetically by name for consistency
    uniquePoses.sort((a, b) => 
      a["Name"].localeCompare(b["Name"])
    );
    
    // Ensure output directory exists
    const outputDir = path.dirname(JSON_OUTPUT_PATH);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    // Write JSON to public/data/yoga-poses.json
    fs.writeFileSync(
      JSON_OUTPUT_PATH,
      JSON.stringify(uniquePoses, null, 2),
      'utf-8'
    );
    console.log(`✓ Successfully wrote ${uniquePoses.length} poses to: ${JSON_OUTPUT_PATH}`);
    
    // Also write to docs/data/yoga-poses.json for production build
    const docsDir = path.dirname(DOCS_JSON_OUTPUT_PATH);
    if (!fs.existsSync(docsDir)) {
      fs.mkdirSync(docsDir, { recursive: true });
    }
    
    fs.writeFileSync(
      DOCS_JSON_OUTPUT_PATH,
      JSON.stringify(uniquePoses, null, 2),
      'utf-8'
    );
    console.log(`✓ Successfully wrote ${uniquePoses.length} poses to: ${DOCS_JSON_OUTPUT_PATH}`);
    
    // Display sample poses
    console.log('\nSample poses (first 3):');
    uniquePoses.slice(0, 3).forEach(pose => {
      console.log(`  - ${pose["Name"]} (${pose["Type"]}, ${pose["Session Type"]})`);
    });
    
    console.log('\n✓ Conversion completed successfully!');
    return uniquePoses;
  } catch (error) {
    console.error('❌ Error during conversion:');
    console.error(error.message);
    process.exit(1);
  }
}

// Run conversion
convertYogaPoses();
