#!/usr/bin/env node

const getWeekStart = (date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay(); // 0 = Sunday, 6 = Saturday
  d.setDate(d.getDate() - day); // Go back to Sunday
  return d;
};

const dates = [
  '2025-11-03', // Mon
  '2025-11-04', // Tue
  '2025-11-05', // Wed
  '2025-11-06', // Thu
  '2025-11-07', // Fri
  '2025-11-08', // Sat
  '2025-11-09', // Sun
  '2025-11-10', // Mon
];

console.log('Date -> Week Start:');
dates.forEach(dateStr => {
  const d = new Date(dateStr + 'T12:00:00');
  const weekStart = getWeekStart(d);
  console.log(`${d.toDateString()} (Day ${d.getDay()}) -> Week: ${weekStart.toDateString()}`);
});

