/**
 * Tests for Session Counting Logic
 * 
 * Tests that the progress screen correctly counts:
 * 1. Manually logged sessions (all types)
 * 2. Rest days (excluded from Total Workouts)
 * 3. HIIT sessions (included in Cardio count)
 * 4. All cardio subtypes (running, cycling, swimming)
 * 5. Stretch/yoga sessions
 */

// Simulate the calculateFilteredStats logic from ProgressScreen.jsx
const calculateFilteredStats = (filteredHistory) => {
  let strengthSessions = 0;
  let cardioSessions = 0;
  let yogaSessions = 0;
  let restSessions = 0;
  let totalDuration = 0;
  
  filteredHistory.forEach(workout => {
    // Count session types based on workout.sessionType (preferred) or workout.type
    const sessionType = workout.sessionType || workout.type || '';
    const workoutType = workout.type || '';
    
    // Check for rest sessions first
    if (sessionType === 'rest' || workoutType === 'rest') {
      restSessions++;
    }
    // Check for cardio sessions (including HIIT and all cardio subtypes)
    else if (
      sessionType === 'cardio' || 
      workoutType === 'cardio' || 
      workoutType === 'hiit' || 
      workoutType === 'running' || 
      workoutType === 'cycling' || 
      workoutType === 'swimming' ||
      workout.cardioType
    ) {
      cardioSessions++;
    }
    // Check for yoga/stretch/mobility sessions
    else if (
      sessionType === 'yoga' || 
      sessionType === 'stretch' ||
      workoutType === 'yoga' || 
      workoutType === 'stretch' || 
      workoutType === 'mobility' ||
      workout.yogaType ||
      workout.stretches
    ) {
      yogaSessions++;
    }
    // Check for strength sessions
    else if (
      sessionType === 'strength' ||
      workoutType === 'strength' || 
      workoutType === 'full' || 
      workoutType === 'upper' || 
      workoutType === 'lower' || 
      workoutType === 'push' || 
      workoutType === 'pull' || 
      workoutType === 'legs' ||
      workoutType === 'core'
    ) {
      strengthSessions++;
    }
    // Fallback: if it has exercises, assume it's a strength session
    else if (workout.exercises && Object.keys(workout.exercises).length > 0) {
      strengthSessions++;
    }
    
    const duration = workout.duration || 0;
    totalDuration += duration;
  });
  
  // Total workouts excludes rest days
  const totalWorkouts = filteredHistory.length - restSessions;
  const averageDuration = totalWorkouts > 0 ? Math.round(totalDuration / totalWorkouts) : 0;
  
  return {
    totalWorkouts,
    averageDuration,
    strengthSessions,
    cardioSessions,
    yogaSessions,
    restSessions,
  };
};

console.log('=== Session Counting Tests ===\n');

// Test 1: Manually logged sessions of all types
console.log('Test 1: Manually logged sessions');
{
  const sessions = [
    // Manually logged strength
    {
      date: Date.now(),
      duration: 3600,
      type: 'full',
      sessionType: 'strength',
      exercises: {},
      isManualLog: true
    },
    // Manually logged cardio (running)
    {
      date: Date.now(),
      duration: 1800,
      type: 'running',
      sessionType: 'cardio',
      exercises: {},
      isManualLog: true
    },
    // Manually logged HIIT
    {
      date: Date.now(),
      duration: 1200,
      type: 'hiit',
      sessionType: 'cardio',
      exercises: {},
      isManualLog: true
    },
    // Manually logged yoga
    {
      date: Date.now(),
      duration: 1800,
      type: 'yoga',
      sessionType: 'yoga',
      exercises: {},
      isManualLog: true
    },
    // Manually logged rest
    {
      date: Date.now(),
      duration: 0,
      type: 'rest',
      sessionType: 'rest',
      exercises: {},
      isManualLog: true
    }
  ];
  
  const stats = calculateFilteredStats(sessions);
  console.log('Stats:', stats);
  console.log('Expected: Total=4, Strength=1, Cardio=2 (including HIIT), Yoga=1, Rest=1');
  console.log('Sum check: Strength + Cardio + Yoga = Total?', 
    stats.strengthSessions + stats.cardioSessions + stats.yogaSessions === stats.totalWorkouts);
  console.log('PASS:', stats.totalWorkouts === 4 && stats.strengthSessions === 1 && 
    stats.cardioSessions === 2 && stats.yogaSessions === 1 && stats.restSessions === 1 ? '✓' : '✗');
  console.log('');
}

// Test 2: All cardio subtypes
console.log('Test 2: All cardio subtypes should count as Cardio');
{
  const sessions = [
    { date: Date.now(), duration: 1800, type: 'running', sessionType: 'cardio', exercises: {} },
    { date: Date.now(), duration: 1800, type: 'cycling', sessionType: 'cardio', exercises: {} },
    { date: Date.now(), duration: 1800, type: 'swimming', sessionType: 'cardio', exercises: {} },
    { date: Date.now(), duration: 1200, type: 'hiit', sessionType: 'cardio', exercises: {} },
    { date: Date.now(), duration: 1800, type: 'cardio', sessionType: 'cardio', exercises: {} }
  ];
  
  const stats = calculateFilteredStats(sessions);
  console.log('Stats:', stats);
  console.log('Expected: Total=5, Cardio=5');
  console.log('PASS:', stats.totalWorkouts === 5 && stats.cardioSessions === 5 ? '✓' : '✗');
  console.log('');
}

// Test 3: Rest days excluded from Total Workouts
console.log('Test 3: Rest days should be excluded from Total Workouts');
{
  const sessions = [
    { date: Date.now(), duration: 3600, type: 'full', sessionType: 'strength', exercises: {} },
    { date: Date.now(), duration: 0, type: 'rest', sessionType: 'rest', exercises: {} },
    { date: Date.now(), duration: 1800, type: 'yoga', sessionType: 'yoga', exercises: {} },
    { date: Date.now(), duration: 0, type: 'rest', sessionType: 'rest', exercises: {} }
  ];
  
  const stats = calculateFilteredStats(sessions);
  console.log('Stats:', stats);
  console.log('Expected: Total=2 (4 sessions - 2 rest days), Rest=2');
  console.log('PASS:', stats.totalWorkouts === 2 && stats.restSessions === 2 ? '✓' : '✗');
  console.log('');
}

// Test 4: Stretch sessions from MobilityScreen
console.log('Test 4: Stretch sessions from MobilityScreen');
{
  const sessions = [
    {
      id: 'stretch_123',
      date: new Date().toISOString(),
      type: 'full',
      stretchesCompleted: 10,
      stretches: ['Hamstring Stretch', 'Quad Stretch'],
      duration: 600
    }
  ];
  
  const stats = calculateFilteredStats(sessions);
  console.log('Stats:', stats);
  console.log('Expected: Total=1, Yoga=1 (stretch sessions should count as yoga)');
  console.log('PASS:', stats.totalWorkouts === 1 && stats.yogaSessions === 1 ? '✓' : '✗');
  console.log('');
}

// Test 5: Sessions from timer (UnifiedTimerScreen)
console.log('Test 5: Sessions from UnifiedTimerScreen');
{
  const sessions = [
    { date: Date.now(), type: 'hiit', duration: 20, perceivedEffort: 8, notes: '', exercises: {} },
    { date: Date.now(), type: 'yoga', duration: 30, perceivedEffort: 5, notes: '', exercises: {} },
    { date: Date.now(), type: 'cardio', duration: 25, perceivedEffort: 7, notes: '', exercises: {} }
  ];
  
  const stats = calculateFilteredStats(sessions);
  console.log('Stats:', stats);
  console.log('Expected: Total=3, Cardio=2 (HIIT+cardio), Yoga=1');
  console.log('PASS:', stats.totalWorkouts === 3 && stats.cardioSessions === 2 && stats.yogaSessions === 1 ? '✓' : '✗');
  console.log('');
}

// Test 6: Mixed sessions - comprehensive test
console.log('Test 6: Mixed sessions from all sources');
{
  const sessions = [
    // Manual strength
    { date: Date.now(), duration: 3600, type: 'full', sessionType: 'strength', exercises: {}, isManualLog: true },
    { date: Date.now(), duration: 3600, type: 'upper', sessionType: 'strength', exercises: {}, isManualLog: true },
    // Manual cardio variants
    { date: Date.now(), duration: 1800, type: 'running', sessionType: 'cardio', exercises: {}, isManualLog: true },
    { date: Date.now(), duration: 1200, type: 'hiit', sessionType: 'cardio', exercises: {}, isManualLog: true },
    // Timer HIIT
    { date: Date.now(), type: 'hiit', duration: 20, exercises: {} },
    // Timer yoga
    { date: Date.now(), type: 'yoga', duration: 30, exercises: {} },
    // Stretch session
    { id: 'stretch_123', date: new Date().toISOString(), type: 'full', stretches: ['test'], duration: 600 },
    // Manual yoga
    { date: Date.now(), duration: 1800, type: 'yoga', sessionType: 'yoga', exercises: {}, isManualLog: true },
    // Rest days
    { date: Date.now(), duration: 0, type: 'rest', sessionType: 'rest', exercises: {} },
    { date: Date.now(), duration: 0, type: 'rest', sessionType: 'rest', exercises: {} }
  ];
  
  const stats = calculateFilteredStats(sessions);
  console.log('Stats:', stats);
  console.log('Expected: Total=8 (10 sessions - 2 rest), Strength=2, Cardio=3, Yoga=3, Rest=2');
  const sumMatches = stats.strengthSessions + stats.cardioSessions + stats.yogaSessions === stats.totalWorkouts;
  console.log('Sum check: Strength + Cardio + Yoga = Total?', sumMatches);
  console.log('PASS:', stats.totalWorkouts === 8 && stats.strengthSessions === 2 && 
    stats.cardioSessions === 3 && stats.yogaSessions === 3 && stats.restSessions === 2 && sumMatches ? '✓' : '✗');
  console.log('');
}

console.log('=== All Tests Complete ===');
