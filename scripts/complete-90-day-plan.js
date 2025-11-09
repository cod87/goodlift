/**
 * Script to complete the 90-day workout plan
 * Generates days 43-90 based on the pattern established in days 1-42
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PLAN_PATH = path.join(__dirname, '../public/data/90-day-plan.json');

// Read existing plan
const existingPlan = JSON.parse(fs.readFileSync(PLAN_PATH, 'utf8'));

// Week pattern for Phase 2 and Phase 3
const weekPattern = [
  { day: 1, weekday: 'Monday', type: 'strength', workout: 'Chest & Back', strength: 9, core: 10 },
  { day: 2, weekday: 'Tuesday', type: 'plyo', workout: 'Plyometrics V2: Glute & Power', plyoId: 'plyo-v2-glute-power' },
  { day: 3, weekday: 'Wednesday', type: 'strength', workout: 'Shoulders & Arms', strength: 9, core: 10 },
  { day: 4, weekday: 'Thursday', type: 'yoga', workout: 'Yoga', duration: 60 },
  { day: 5, weekday: 'Friday', type: 'strength', workout: 'Legs & Lower Body', strength: 9, core: 10 },
  { day: 6, weekday: 'Saturday', type: 'recovery', workout: 'Active Recovery' },
  { day: 7, weekday: 'Sunday', type: 'rest', workout: 'Rest or X-Stretch' }
];

// Complete Phase 2 (days 31-60)
const phase2Schedule = [];
let dayCounter = 31;

// Weeks 5-8 (days 31-56)
for (let week = 0; week < 4; week++) {
  weekPattern.forEach((dayTemplate, index) => {
    const newDay = { ...dayTemplate, day: dayCounter };
    
    // Rotate plyo workouts
    if (newDay.type === 'plyo') {
      const plyoVersions = [
        'plyo-v1-balanced',
        'plyo-v2-glute-power',
        'plyo-v3-quad-agility'
      ];
      const versionIndex = Math.floor(week / 2) % 3;
      newDay.plyoId = plyoVersions[versionIndex];
      newDay.workout = `Plyometrics V${versionIndex + 1}`;
    }
    
    phase2Schedule.push(newDay);
    dayCounter++;
  });
}

// Recovery week (days 57-60)
const recoveryWeek = [
  { day: 57, weekday: 'Monday', type: 'yoga', workout: 'Yoga', duration: 90, intensity: 'Light' },
  { day: 58, weekday: 'Tuesday', type: 'cardio', workout: 'Light Cardio', duration: 30, intensity: 'Light' },
  { day: 59, weekday: 'Wednesday', type: 'stretch', workout: 'Full Body Stretch', duration: 45 },
  { day: 60, weekday: 'Thursday', type: 'rest', workout: 'Complete Rest' }
];

phase2Schedule.push(...recoveryWeek);

// Complete Phase 3 (days 61-90)
const phase3Schedule = [];
dayCounter = 61;

// Weeks 9-12 (days 61-84)
for (let week = 0; week < 4; week++) {
  weekPattern.forEach((dayTemplate, index) => {
    const newDay = { ...dayTemplate, day: dayCounter };
    
    // Rotate plyo workouts, emphasizing quad & agility in final phase
    if (newDay.type === 'plyo') {
      const plyoVersions = [
        'plyo-v3-quad-agility',
        'plyo-v2-glute-power',
        'plyo-v1-balanced'
      ];
      const versionIndex = week % 3;
      newDay.plyoId = plyoVersions[versionIndex];
      newDay.workout = `Plyometrics ${week < 2 ? 'V3: Quad & Agility' : 'V2: Glute & Power'}`;
    }
    
    phase3Schedule.push(newDay);
    dayCounter++;
  });
}

// Final recovery week (days 85-90)
const finalRecoveryWeek = [
  { day: 85, weekday: 'Monday', type: 'yoga', workout: 'Yoga', duration: 90, intensity: 'Light' },
  { day: 86, weekday: 'Tuesday', type: 'plyo', workout: 'Plyometrics V1: Balanced (Light)', plyoId: 'plyo-v1-balanced', intensity: 0.7 },
  { day: 87, weekday: 'Wednesday', type: 'recovery', workout: 'Active Recovery', duration: 45 },
  { day: 88, weekday: 'Thursday', type: 'stretch', workout: 'X-Stretch', duration: 30 },
  { day: 89, weekday: 'Friday', type: 'yoga', workout: 'Yoga', duration: 90, intensity: 'Light' },
  { day: 90, weekday: 'Saturday', type: 'rest', workout: 'Complete Rest - Celebrate!' }
];

phase3Schedule.push(...finalRecoveryWeek);

// Update the plan
const updatedPlan = existingPlan.map(phase => {
  if (phase.phase === 2) {
    return {
      ...phase,
      days: '31-60',
      schedule: phase2Schedule
    };
  } else if (phase.phase === 3) {
    return {
      ...phase,
      days: '61-90',
      schedule: phase3Schedule
    };
  }
  return phase;
});

// Write the updated plan
fs.writeFileSync(PLAN_PATH, JSON.stringify(updatedPlan, null, 2), 'utf8');

console.log('✓ Successfully completed 90-day plan!');
console.log(`  Phase 1: ${existingPlan[0].schedule.length} days (1-${existingPlan[0].schedule[existingPlan[0].schedule.length - 1]?.day || 30})`);
console.log(`  Phase 2: ${phase2Schedule.length} days (31-60)`);
console.log(`  Phase 3: ${phase3Schedule.length} days (61-90)`);
console.log(`  Total: ${existingPlan[0].schedule.length + phase2Schedule.length + phase3Schedule.length} days`);
