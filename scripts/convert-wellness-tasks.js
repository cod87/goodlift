import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Papa from 'papaparse';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read and parse CSV
const csvPath = path.join(__dirname, '../.github/wellness_tasks.csv');
const csvContent = fs.readFileSync(csvPath, 'utf8');

const parsed = Papa.parse(csvContent, {
  header: true,
  skipEmptyLines: true,
  dynamicTyping: true,
});

const categoryMap = {
  'COMM': 'Communication',
  'MH': 'Mental Health',
  'LEARN': 'Learning',
  'VOLUNT': 'Volunteering',
  'NEW': 'New Experiences',
  'PHYS': 'Physical',
  'NATURE': 'Nature',
  'GROW': 'Personal Growth',
  'CREATE': 'Creativity',
  'SEEK': 'Seeking Connection',
  'MEDIA': 'Media',
  'MAINT': 'Maintenance'
};

// Process the tasks
const wellnessTasks = parsed.data
  .filter(row => row.Task && row.Task.trim() !== '') // Filter out empty tasks
  .map((row, index) => {
    const categories = [];
    
    // Check each category column
    Object.keys(categoryMap).forEach(code => {
      if (row[code] === 1) {
        categories.push(categoryMap[code]);
      }
    });
    
    return {
      id: `wellness_${index + 1}`,
      task: row.Task.trim(),
      timing: row.Timing || 'Daily',
      relationshipStatus: row.Relationship_Status || 'All',
      holiday: row.Holiday || null,
      categories: categories
    };
  });

// Group tasks by timing and category for easy access
const tasksByTiming = {
  daily: wellnessTasks.filter(t => t.timing === 'Daily'),
  weekly: wellnessTasks.filter(t => t.timing === 'Weekly'),
  holiday: wellnessTasks.filter(t => t.holiday)
};

const output = {
  version: '1.0',
  categories: Object.values(categoryMap),
  tasks: wellnessTasks,
  tasksByTiming: tasksByTiming
};

// Write to JSON file
const outputPath = path.join(__dirname, '../src/data/wellness_tasks.json');
fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));

console.log(`✅ Successfully converted ${wellnessTasks.length} wellness tasks to JSON`);
console.log(`   Output: ${outputPath}`);
console.log(`   Daily tasks: ${tasksByTiming.daily.length}`);
console.log(`   Weekly tasks: ${tasksByTiming.weekly.length}`);
console.log(`   Holiday tasks: ${tasksByTiming.holiday.length}`);
