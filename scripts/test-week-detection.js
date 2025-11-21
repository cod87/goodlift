#!/usr/bin/env node

/**
 * Test week detection logic
 */

const getWeekStart = (date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay(); // 0 = Sunday, 6 = Saturday
  d.setDate(d.getDate() - day); // Go back to Sunday
  return d;
};

const today = new Date();
today.setHours(0, 0, 0, 0);

console.log('Today:', today.toDateString(), '- Day of week:', today.getDay());
console.log('Week starts on:', getWeekStart(today).toDateString());
console.log('');

// Check last 10 days
for (let i = 0; i < 10; i++) {
  const d = new Date(today);
  d.setDate(d.getDate() - i);
  const weekStart = getWeekStart(d);
  console.log(`${i} days ago: ${d.toDateString()} (Day ${d.getDay()}) - Week starts: ${weekStart.toDateString()}`);
}

