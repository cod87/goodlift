# HIIT and Yoga Session Generators - Developer Guide

This document explains how to use the HIIT and Yoga session generators implemented based on `.github/HIIT-YOGA-GUIDE.md`.

## Overview

The implementation includes:
- **Data**: 131 exercises (including 22 HIIT/plyometric) and 41 comprehensive yoga poses
- **Generators**: Complete session generators for HIIT and Yoga with evidence-based protocols
- **UI Components**: User-friendly selection screens for configuring sessions
- **Integration**: Enhanced workout planner with HIIT/Yoga support and progressive overload

## HIIT Session Generator

### Basic Usage

```javascript
import { generateHIITSession } from './utils/hiitSessionGenerator';

const session = generateHIITSession({
  modality: 'bodyweight',    // 'bodyweight' | 'plyometric' | 'cycling' | 'rowing' | 'elliptical' | 'step'
  level: 'intermediate',     // 'beginner' | 'intermediate' | 'advanced'
  protocol: 'BALANCED',      // Protocol key from HIIT_PROTOCOLS
  exercises: exercisesArray, // Array from exercises.json
  lowerImpact: false,        // Use lower-impact modifications
  goal: 'cardiovascular'     // 'fat_loss' | 'cardiovascular' | 'power'
});
```

### Available Protocols

All protocols from Guide Section 1.2:

- **MAX_POWER (1:4)**: 20s work, 80s rest - Maximum power development
- **BALANCED (1:2)**: 30s work, 60s rest - Balanced anaerobic-aerobic
- **CONDITIONING (1:1)**: 45s work, 45s rest - Aerobic-dominant
- **METABOLIC (2:1)**: 40s work, 20s rest - High intensity metabolic
- **TABATA**: 20s work, 10s rest - Maximum intensity, 8 rounds
- **REHIT**: 20s max effort, 150s rest - Minimal time, advanced only

### Modalities

1. **Bodyweight HIIT** (Guide Sections 2.2-2.4)
   - Beginner, Intermediate, Advanced workouts
   - Lower-impact modifications available
   - 25-30 minute sessions

2. **Plyometric HIIT** (Guide Section 3.2)
   - Progressive plyometric exercises
   - 28-minute circuits
   - Lower-impact alternatives

3. **Cycling HIIT** (Guide Sections 4.2-4.4)
   - Beginner: Steady State Intervals
   - Intermediate: Pyramid Protocol
   - Advanced: REHIT Protocol

4. **Rowing HIIT** (Guide Sections 5.2-5.3)
   - Beginner: Distance Intervals
   - Intermediate: Power and Endurance Mix

5. **Elliptical HIIT** (Guide Section 6.2)
   - Progressive intervals
   - Very low-impact option

6. **Step Platform HIIT** (Guide Section 7.1)
   - Upper and lower body integration
   - Equipment: 4-8 inch adjustable step

### Session Structure

Every session includes:
- Warmup (3-5 minutes)
- Main workout (protocol-specific)
- Cooldown (3-5 minutes)
- Guide reference for evidence-based accuracy

## Yoga Session Generator

### Basic Usage

```javascript
import { generateYogaSession } from './utils/yogaSessionGenerator';

const session = generateYogaSession({
  mode: 'power',          // 'power' | 'restorative' | 'yin' | 'flexibility' | 'core'
  level: 'intermediate',  // 'beginner' | 'intermediate' | 'advanced'
  poses: yogaPosesArray,  // Array from yoga-poses.json
  goal: 'balance'         // 'strength' | 'flexibility' | 'recovery' | 'stress_relief' | 'balance'
});
```

### Yoga Modes

1. **Power Yoga** (Guide Section 8.2)
   - Duration: 45 minutes
   - Focus: Strength, flexibility, balance, cardiovascular
   - Includes: Standing sequence, core work, balance poses
   - Sympathetic activation: High

2. **Restorative Yoga** (Guide Section 8.3)
   - Duration: 45-50 minutes
   - Focus: Deep relaxation, stress relief, recovery
   - Props: Blocks, bolsters, straps, blankets
   - Sympathetic activation: Low (parasympathetic)

3. **Yin Yoga** (Guide Section 8.4)
   - Duration: 55-60 minutes
   - Focus: Deep tissue and fascia release
   - Hold times: 3-6 minutes per pose
   - Sympathetic activation: Low (parasympathetic)

4. **Flexibility Yoga** (Guide Section 8.5)
   - Duration: 45 minutes
   - Focus: Hip and hamstring opening
   - Addresses tightness from sitting and training
   - Sympathetic activation: Medium

5. **Core Strength Yoga** (Guide Section 8.6)
   - Duration: 40 minutes
   - Focus: Core stability and athletic performance
   - Includes: Plank variations, boat pose, balance work
   - Sympathetic activation: High

### Breathing Techniques

All sessions include appropriate breathing techniques (Guide Section 10.4):

- **Ujjayi**: Ocean-like sound, calming
- **Extended Exhale**: 2:1 ratio for parasympathetic activation
- **Alternate Nostril**: Nervous system balance
- **Natural**: No forced control for Yin practice

## Enhanced Workout Planning

### HIIT Integration

```javascript
import { validateHiitSpacing } from './utils/workoutPlanGenerator';

// Ensure HIIT sessions are spaced 48+ hours apart (Guide Section 1.3)
const validation = validateHiitSpacing(sessions);
if (!validation.valid) {
  console.log('HIIT spacing warnings:', validation.warnings);
}
```

### Sympathetic/Parasympathetic Balance

```javascript
import { calculateSympatheticBalance } from './utils/workoutPlanGenerator';

// Target 60/40 ratio (Guide Section 10.1)
const balance = calculateSympatheticBalance(sessions);
console.log('Balance:', balance.sympatheticPercent, '/', balance.parasympatheticPercent);
console.log('Is balanced:', balance.isBalanced);
```

### Progressive Overload

```javascript
import { applyHiitProgression, applyYogaProgression } from './utils/workoutPlanGenerator';

// HIIT progression over 12 weeks (Guide Section 10.2)
const hiitParams = applyHiitProgression(weekNumber, baseSession);

// Yoga progression (increasing hold times and complexity)
const yogaParams = applyYogaProgression(weekNumber, baseSession);
```

## UI Components

### HIIT Session Selection

```javascript
import HiitSessionSelection from './components/HiitSessionSelection';

// Displays:
// - Modality selection with benefits
// - Protocol selection with descriptions
// - Level and goal configuration
// - Lower-impact option toggle
// - Real-time Guide references
```

### Yoga Session Selection

```javascript
import YogaSessionSelection from './components/YogaSessionSelection';

// Displays:
// - Mode selection with benefits
// - Level configuration
// - Goal selection
// - Breathing technique info
// - Props needed
// - Session overview
```

## Data Structure

### Exercise Data (exercises.json)

HIIT exercises include:
```json
{
  "Exercise Name": "Burpee",
  "Primary Muscle": "Chest",
  "Secondary Muscles": "Triceps, Core, Quads, Glutes, Shoulders, Back",
  "Exercise Type": "HIIT",
  "Equipment": "Bodyweight",
  "Impact Level": "High",
  "Modification": "Step-Back Burpee (step feet back instead of jump)",
  "Progression Level": "Advanced",
  "Category": "Full Body"
}
```

### Yoga Pose Data (yoga-poses.json)

Yoga poses include:
```json
{
  "Name": "Warrior I",
  "Sanskrit": "Virabhadrasana I",
  "Primary Muscles": "Glutes, Quads, Hip Flexors",
  "Secondary Muscles": "Core, Shoulders, Chest",
  "Type": "Power",
  "Hold Duration": 45,
  "Benefits": "Lower body strength, hip flexibility, core",
  "Level": "Beginner",
  "Category": "Standing"
}
```

## Weekly Schedule Templates

Implemented from Guide Section 9:

### Beginner (Section 9.1)
- 3-4 days/week
- Mix of strength, HIIT, and yoga
- Focus on form and recovery

### Intermediate (Section 9.2)
- 4-5 days/week
- Multiple HIIT modalities
- Balance of power and restorative yoga

### Advanced (Section 9.3)
- 5-7 days/week
- High-intensity protocols (Tabata, REHIT)
- Strategic recovery with Yin yoga

## Safety and Recovery

All implementations follow Guide recommendations:

- **HIIT Frequency**: 1-3x weekly max, never consecutive days (Section 1.3)
- **Recovery**: 48+ hours between HIIT sessions
- **Deload**: Every 3-4 weeks (Section 10.2)
- **Balance**: 60/40 sympathetic/parasympathetic ratio (Section 10.1)
- **Progression**: Systematic increases in intensity, duration, or complexity

## Testing

Run the test script to verify generators:

```bash
node scripts/test-generators.js
```

This validates:
- HIIT session generation for all modalities
- Yoga session generation for all modes
- Protocol and mode definitions
- Data structure correctness

## References

All implementations are based on:
- `.github/HIIT-YOGA-GUIDE.md` - Complete evidence-based protocols
- Guide sections are referenced in code comments and user-facing text
- Progressive overload follows Guide Section 10.2
- Weekly schedules follow Guide Section 9
