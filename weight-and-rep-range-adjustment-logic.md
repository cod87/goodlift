# Weight and Rep Range Adjustment Logic

## Overview
This document describes the logic for calculating weight adjustments when changing rep ranges in strength training exercises. It uses the Percentage of One-Rep Max (1RM) method as the foundation, with practical considerations for different exercise types and weight increment constraints.

---

## Core Concept: Percentage of 1RM

Each rep range corresponds to a standard percentage of a lifter's one-rep maximum:

| Rep Range | 1RM Percentage |
|-----------|----------------|
| 6 reps    | 85%            |
| 8 reps    | 80%            |
| 10 reps   | 75%            |
| 12 reps   | 70%            |
| 15 reps   | 65%            |

---

## Weight Calculation Formula

When a user changes from one rep range to another, calculate the new target weight using:

```
New Weight = Current Weight × (Target 1RM % ÷ Current 1RM %)
```

### Example
- Current: 200 lbs for 8 reps (80% of 1RM)
- Target: 12 reps (70% of 1RM)
- Calculation: 200 × (70 ÷ 80) = 175 lbs

---

## Weight Increment System

Weight must be adjusted to conform to available increment sizes:

### Increment Rules
- **For weights 2.5 lbs to 35 lbs:** Use 2.5 lb increments
- **For weights above 35 lbs:** Use 5 lb increments

### Implementation Logic

1. Calculate the target weight using the formula above
2. Determine if the calculated weight falls within the 2.5 lb or 5 lb increment range
3. Round the calculated weight to the nearest valid increment:
   - Find the closest valid increment weight (either 2.5 lb steps or 5 lb steps)
   - If equidistant between two increments, round up (conservative, safer approach)

### Example Calculations

**Scenario 1: Small weight (uses 2.5 lb increments)**
- Current: 25 lbs for 10 reps
- Target: 12 reps
- Calculated: 25 × (70 ÷ 75) = 23.33 lbs
- Valid increments: 20, 22.5, 25, 27.5...
- Nearest: 22.5 lbs (0.83 lbs away) or 25 lbs (1.67 lbs away)
- Result: Round to **22.5 lbs**

**Scenario 2: Large weight (uses 5 lb increments)**
- Current: 200 lbs for 10 reps
- Target: 6 reps
- Calculated: 200 × (85 ÷ 75) = 226.67 lbs
- Valid increments: 200, 205, 210, 215, 220, 225, 230...
- Nearest: 225 lbs (1.67 lbs away) or 230 lbs (3.33 lbs away)
- Result: Round to **225 lbs**

---

## Quick Reference: Percent Change by Rep Range Shift

This table shows the approximate percent change to apply when moving between rep ranges (for user reference):

| From → To | 6 Reps | 8 Reps | 10 Reps | 12 Reps | 15 Reps |
|-----------|--------|--------|---------|---------|---------|
| 6 Reps    | —      | -6%    | -12%    | -18%    | -22%    |
| 8 Reps    | +6%    | —      | -7%     | -12%    | -18%    |
| 10 Reps   | +13%   | +7%    | —       | -7%     | -13%    |
| 12 Reps   | +21%   | +14%   | +7%     | —       | -6%     |
| 15 Reps   | +31%   | +24%   | +15%    | +7%     | —       |

---

## Exercise Type Considerations

### Lower Body Movements (Squats, Deadlifts, Leg Press)
- **Behavior:** These muscles are larger and often more endurance-adapted
- **Adjustment Strategy:** The calculated weight may be conservative; lifters often handle slightly larger jumps than the math suggests
- **Implementation:** Show the calculated weight, but allow users to note they feel stronger in this category

### Upper Body Push (Bench Press, Overhead Press)
- **Behavior:** These muscles fatigue faster and leverage changes make small weight differences more noticeable
- **Adjustment Strategy:** Strict adherence to the percentage-based calculation
- **Implementation:** Use precise increments (2.5 lbs preferred for fine control)

### Upper Body Pull (Rows, Pull-ups)
- **Behavior:** Form can vary (momentum, assistance, etc.), making actual difficulty inconsistent
- **Adjustment Strategy:** Calculate as normal, but emphasize strict form when increasing weight
- **Implementation:** Track form notes or tempo for consistency

### Isolation Exercises (Bicep Curls, Lateral Raises, Cable Extensions)
- **Behavior:** Percentage calculations break down at light weights; 5% of a light weight is often less than one increment
- **Adjustment Strategy:** Use weight increments as the primary guide rather than percentages
- **Implementation:** When calculated weight equals current weight (or very close), jump to next available increment size

---

## Algorithm Pseudocode

```
FUNCTION calculateNewWeight(currentWeight, currentReps, targetReps):
    DEFINE repToPercentage = {
        6: 85,
        8: 80,
        10: 75,
        12: 70,
        15: 65
    }
    
    GET currentPercent = repToPercentage[currentReps]
    GET targetPercent = repToPercentage[targetReps]
    
    CALCULATE calculatedWeight = currentWeight × (targetPercent ÷ currentPercent)
    
    CALL newWeight = roundToNearestIncrement(calculatedWeight)
    
    RETURN newWeight


FUNCTION roundToNearestIncrement(weight):
    IF weight <= 35 THEN
        // Use 2.5 lb increments
        INCREMENT_SIZE = 2.5
    ELSE
        // Use 5 lb increments
        INCREMENT_SIZE = 5
    END IF
    
    // Calculate how many increments fit into the weight
    numberOfIncrements = weight ÷ INCREMENT_SIZE
    
    // Round to nearest whole number (round up if exactly .5)
    roundedIncrements = ROUND(numberOfIncrements)
    
    // Convert back to weight
    finalWeight = roundedIncrements × INCREMENT_SIZE
    
    RETURN finalWeight
```

---

## Data Structure for Rep-to-Percentage Mapping

Store this mapping as a lookup table or constant in the application:

```
{
  6: 85,
  8: 80,
  10: 75,
  12: 70,
  15: 65
}
```

This allows quick conversion from any rep range to its 1RM percentage.

---

## User-Facing Output

When displaying results to the user, show:

1. **Current lift:** [Weight] lbs × [Reps] reps
2. **Target lift:** [New Weight] lbs × [Target Reps] reps
3. **Change:** ±[Weight Difference] lbs ([Percent Change]%)
4. **Exercise category note:** (Optional) "Based on exercise type, you may want to adjust slightly"

### Example Output
```
Current: 200 lbs × 8 reps
Target: 12 reps
→ Try 175 lbs × 12 reps
  (Decrease by 25 lbs / -12%)
```

---

## Edge Cases and Validation

### Validation Rules
- **Minimum weight:** Ensure calculated weight is at least 2.5 lbs (or minimum for equipment available)
- **Increasing to fewer reps:** Always results in higher weight (percentage increases)
- **Decreasing to more reps:** Always results in lower weight (percentage decreases)
- **Same rep range:** Return current weight unchanged

### Handling Small Weights
- If calculated weight is 0 or negative (edge case), default to the minimum available increment (e.g., 2.5 lbs)
- If user inputs a weight below 2.5 lbs, round up to 2.5 lbs (minimum standard dumbbell/plate size)

### Handling Large Weights
- No upper limit; the 5 lb increment rule applies to all weights above 35 lbs indefinitely

---

## Implementation Checklist

- [ ] Create a constant or configuration object for rep-to-percentage mapping
- [ ] Implement the weight calculation formula
- [ ] Implement the increment rounding logic (2.5 lb below 35 lbs, 5 lb above)
- [ ] Create a function that takes current weight, current reps, target reps and returns new weight
- [ ] Validate inputs (ensure reps are one of: 6, 8, 10, 12, 15)
- [ ] Handle edge cases (minimum weight, invalid inputs)
- [ ] Add user-facing output formatting (show weight change, percent change)
- [ ] (Optional) Add exercise type classification to provide contextual notes
- [ ] Test with multiple scenarios across different weight ranges

---

## References

- 1RM percentage estimates based on NSCA (National Strength and Conditioning Association) standards
- Increment system designed to match common barbell plate sizes and dumbbell sets
- Formula and methodology based on scientific strength training literature
