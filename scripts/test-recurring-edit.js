/**
 * Validation script for recurring session editing feature
 * Tests the batch editing functions for workout plans
 */

// ANSI color codes for output
const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const RESET = '\x1b[0m';

let passedTests = 0;
let failedTests = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`${GREEN}✓${RESET} ${name}`);
    passedTests++;
  } catch (error) {
    console.error(`${RED}✗${RESET} ${name}`);
    console.error(`  ${error.message}`);
    failedTests++;
  }
}

function assertEquals(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(`${message}: expected ${expected}, got ${actual}`);
  }
}

function assertTrue(value, message) {
  if (!value) {
    throw new Error(message);
  }
}

// Inline implementations for testing (copied from workoutPlanGenerator.js)
function getRecurringSessionsInBlock(plan, sessionId) {
  const targetSession = plan.sessions.find(s => s.id === sessionId);
  if (!targetSession) return [];
  
  const sessionType = targetSession.type;
  const daysPerWeek = plan.daysPerWeek;
  const deloadWeeks = plan.deloadWeeks || [];
  
  const sessionIndex = plan.sessions.findIndex(s => s.id === sessionId);
  const sessionWeek = Math.floor(sessionIndex / daysPerWeek) + 1;
  
  const prevDeloadWeek = deloadWeeks.filter(w => w < sessionWeek).pop() || 0;
  const nextDeloadWeek = deloadWeeks.find(w => w > sessionWeek) || Math.ceil(plan.duration / 7) + 1;
  
  return plan.sessions.filter((session, index) => {
    const week = Math.floor(index / daysPerWeek) + 1;
    return session.type === sessionType && 
           week > prevDeloadWeek && 
           week < nextDeloadWeek;
  });
}

function updateRecurringSessionExercises(plan, sessionId, newExercises) {
  if (!plan || !sessionId || !newExercises) {
    throw new Error('Plan, sessionId, and newExercises are required');
  }

  if (!Array.isArray(newExercises) || newExercises.length === 0) {
    throw new Error('newExercises must be a non-empty array');
  }

  const recurringSessions = getRecurringSessionsInBlock(plan, sessionId);
  if (recurringSessions.length === 0) {
    console.warn('No recurring sessions found for this session');
    return plan;
  }
  
  const recurringSessionIds = new Set(recurringSessions.map(s => s.id));
  
  const updatedSessions = plan.sessions.map(session => {
    if (recurringSessionIds.has(session.id)) {
      if (['upper', 'lower', 'full', 'push', 'pull', 'legs'].includes(session.type)) {
        return {
          ...session,
          exercises: newExercises
        };
      }
    }
    return session;
  });
  
  return {
    ...plan,
    sessions: updatedSessions,
    modified: Date.now()
  };
}

console.log('\n🧪 Testing Recurring Session Editing Feature\n');

// Create a mock plan for testing
const mockPlan = {
  id: 'test-plan',
  name: 'Test Plan',
  daysPerWeek: 3,
  duration: 28,
  deloadWeeks: [4],
  sessions: [
    // Week 1
    { id: 's1', type: 'upper', date: Date.now(), exercises: [{ name: 'Bench Press' }] },
    { id: 's2', type: 'lower', date: Date.now(), exercises: [{ name: 'Squat' }] },
    { id: 's3', type: 'full', date: Date.now(), exercises: [{ name: 'Deadlift' }] },
    // Week 2
    { id: 's4', type: 'upper', date: Date.now(), exercises: [{ name: 'Bench Press' }] },
    { id: 's5', type: 'lower', date: Date.now(), exercises: [{ name: 'Squat' }] },
    { id: 's6', type: 'full', date: Date.now(), exercises: [{ name: 'Deadlift' }] },
    // Week 3
    { id: 's7', type: 'upper', date: Date.now(), exercises: [{ name: 'Bench Press' }] },
    { id: 's8', type: 'lower', date: Date.now(), exercises: [{ name: 'Squat' }] },
    { id: 's9', type: 'full', date: Date.now(), exercises: [{ name: 'Deadlift' }] },
    // Week 4 (deload)
    { id: 's10', type: 'upper', date: Date.now(), exercises: [{ name: 'Bench Press' }] },
    { id: 's11', type: 'lower', date: Date.now(), exercises: [{ name: 'Squat' }] },
    { id: 's12', type: 'full', date: Date.now(), exercises: [{ name: 'Deadlift' }] },
  ]
};

// Run tests
test('getRecurringSessionsInBlock returns correct upper body sessions', () => {
  const recurring = getRecurringSessionsInBlock(mockPlan, 's1');
  assertEquals(recurring.length, 3, 'Should find 3 upper body sessions');
  assertEquals(recurring[0].id, 's1', 'First session should be s1');
});

test('getRecurringSessionsInBlock returns correct lower body sessions', () => {
  const recurring = getRecurringSessionsInBlock(mockPlan, 's2');
  assertEquals(recurring.length, 3, 'Should find 3 lower body sessions');
  assertTrue(recurring.every(s => s.type === 'lower'), 'All sessions should be lower body');
});

test('Recurring sessions do not include deload week', () => {
  const recurring = getRecurringSessionsInBlock(mockPlan, 's1');
  const hasDeloadSession = recurring.some(s => s.id === 's10');
  assertTrue(!hasDeloadSession, 'Should not include session from deload week');
});

test('updateRecurringSessionExercises updates all sessions in block', () => {
  const newExercises = [
    { name: 'Overhead Press', sets: 3, reps: 10 },
    { name: 'Pull-ups', sets: 3, reps: 8 }
  ];
  
  const updatedPlan = updateRecurringSessionExercises(mockPlan, 's1', newExercises);
  const upperSession1 = updatedPlan.sessions.find(s => s.id === 's1');
  
  assertEquals(upperSession1.exercises.length, 2, 'Should have 2 exercises');
  assertEquals(upperSession1.exercises[0].name, 'Overhead Press', 'Exercise name should match');
});

test('updateRecurringSessionExercises does not affect other session types', () => {
  const newExercises = [{ name: 'New Exercise', sets: 3, reps: 10 }];
  const updatedPlan = updateRecurringSessionExercises(mockPlan, 's1', newExercises);
  const lowerSession = updatedPlan.sessions.find(s => s.id === 's2');
  assertEquals(lowerSession.exercises[0].name, 'Squat', 'Lower body should be unchanged');
});

test('updateRecurringSessionExercises validates inputs', () => {
  let errorThrown = false;
  try {
    updateRecurringSessionExercises(null, 's1', []);
  } catch (error) {
    errorThrown = true;
  }
  assertTrue(errorThrown, 'Should throw error for null plan');
});

test('updateRecurringSessionExercises rejects empty exercises', () => {
  let errorThrown = false;
  try {
    updateRecurringSessionExercises(mockPlan, 's1', []);
  } catch (error) {
    errorThrown = true;
  }
  assertTrue(errorThrown, 'Should throw error for empty exercises');
});

// Print summary
console.log(`\n${GREEN}Passed: ${passedTests}${RESET}`);
if (failedTests > 0) {
  console.log(`${RED}Failed: ${failedTests}${RESET}`);
  process.exit(1);
} else {
  console.log(`${GREEN}All tests passed! ✓${RESET}\n`);
}
