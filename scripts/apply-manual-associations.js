#!/usr/bin/env node

/**
 * Apply manual webp file associations to exercises
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const exercisesPath = path.join(__dirname, '..', 'public', 'data', 'exercises.json');

// Manual associations for exercises that couldn't be matched automatically
const manualAssociations = {
  "Bulgarian Split Squat": "bodyweight-bulgarian-split-squat.webp",
  "Bulgarian Split Squat, Dumbbell": "bodyweight-bulgarian-split-squat.webp",
  "Bulgarian Split Squat, Barbell": "barbell-bulgarian-split-squat.webp",
  "Hip Thrust, Barbell": "barbell-hip-thrust.webp",
  "Pullover, Barbell": "barbell-pullover.webp",
  "Shrug, Barbell": "barbell-shrugs.webp",
  "Shrug, Dumbbell": "dumbbell-shrug.webp",
  "Bent-Over Row, Dumbbell": "dumbbell-bent-over-row-single-arm.webp",
  "Concentration Curl, Dumbbell": "dumbbell-concentration-curl.webp",
  "Shoulder Press, Dumbbell": "dumbbell-shoulder-press.webp",
  "Fly, Dumbbell": "incline-dumbbell-fly.webp",
  "Behind the Neck Pulldown": "behind-neck-pulldown.webp",
  "Bent Over Lateral Raise": "bent-over-lateral-raise.webp",
  "Lateral Raise, Bent Over": "bent-over-lateral-raise.webp",
  "Reverse Grip Pulldown": "reverse-grip-pulldown.webp",
  "Lat Pulldown, Close Grip": "close-grip-pulldown.webp",
  "Close Grip Lat Pulldown": "close-grip-pulldown.webp",
  "Lat Pulldown, Reverse Grip": "reverse-grip-pulldown.webp",
  "Pulldown, Rope": "rope-pulldown.webp",
  "T-Bar Row": "t-bar-row.webp",
  "Row, T-Bar": "t-bar-row.webp",
  "Lat Pulldown, Straight Arm": "straight-arm-lat-pulldown.webp",
  "Straight Arm Pulldown": "straight-arm-lat-pulldown.webp",
  "Slamball Squat": "slamball-squat.webp",
  "Squat, Slamball": "slamball-squat.webp",
  "Single-Arm Row, Dumbbell": "dumbbell-bent-over-row-single-arm.webp",
  "Pullover, Dumbbell": "incline-dumbbell-fly.webp",
};

console.log('Reading exercises.json...');
const exercisesData = JSON.parse(fs.readFileSync(exercisesPath, 'utf8'));

let updated = 0;
let skipped = 0;

exercisesData.forEach((exercise, index) => {
  const exerciseName = exercise['Exercise Name'];
  
  if (manualAssociations[exerciseName]) {
    if (!exercise['Webp File']) {
      exercisesData[index]['Webp File'] = manualAssociations[exerciseName];
      console.log(`✓ Associated "${exerciseName}" -> ${manualAssociations[exerciseName]}`);
      updated++;
    } else {
      console.log(`- Skipped "${exerciseName}" (already has ${exercise['Webp File']})`);
      skipped++;
    }
  }
});

console.log(`\nUpdated ${updated} exercises`);
console.log(`Skipped ${skipped} exercises (already had associations)`);

if (updated > 0) {
  fs.writeFileSync(exercisesPath, JSON.stringify(exercisesData, null, 2) + '\n', 'utf8');
  console.log('✓ exercises.json updated successfully');
}
