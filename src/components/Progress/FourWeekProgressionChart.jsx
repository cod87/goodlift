import { memo } from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  Card,
  CardContent,
  Typography,
} from '@mui/material';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

/**
 * Generate 4-week progression chart data
 * @param {Array} workoutHistory - Array of workout objects
 * @returns {Object} Chart data grouped by week
 */
const generate4WeekData = (workoutHistory = []) => {
  const now = new Date();
  const fourWeeksAgo = new Date(now);
  fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28); // 4 weeks = 28 days

  // Filter to last 4 weeks
  const recentWorkouts = workoutHistory.filter(w => {
    const workoutDate = new Date(w.date);
    return workoutDate >= fourWeeksAgo && workoutDate <= now;
  });

  // Group by week
  const weeklyData = [
    { label: 'Week 1', workouts: 0, volume: 0, avgDuration: 0, totalDuration: 0 },
    { label: 'Week 2', workouts: 0, volume: 0, avgDuration: 0, totalDuration: 0 },
    { label: 'Week 3', workouts: 0, volume: 0, avgDuration: 0, totalDuration: 0 },
    { label: 'Week 4', workouts: 0, volume: 0, avgDuration: 0, totalDuration: 0 },
  ];

  recentWorkouts.forEach(workout => {
    const workoutDate = new Date(workout.date);
    const daysSince = Math.floor((now - workoutDate) / (1000 * 60 * 60 * 24));
    const weekIndex = 3 - Math.floor(daysSince / 7); // Most recent = week 4

    if (weekIndex >= 0 && weekIndex < 4) {
      weeklyData[weekIndex].workouts += 1;
      weeklyData[weekIndex].totalDuration += workout.duration || 0;

      // Calculate volume
      if (workout.exercises) {
        Object.values(workout.exercises).forEach(exercise => {
          if (exercise.sets) {
            exercise.sets.forEach(set => {
              const volume = (set.weight || 0) * (set.reps || 0);
              weeklyData[weekIndex].volume += volume;
            });
          }
        });
      }
    }
  });

  // Calculate averages
  weeklyData.forEach(week => {
    if (week.workouts > 0) {
      week.avgDuration = Math.round(week.totalDuration / week.workouts / 60); // Convert to minutes
    }
  });

  return weeklyData;
};

/**
 * FourWeekProgressionChart Component
 * Displays workout metrics over the last 4 weeks
 */
export const FourWeekProgressionChart = memo(({ workoutHistory = [] }) => {
  const weeklyData = generate4WeekData(workoutHistory);

  const chartData = {
    labels: weeklyData.map(w => w.label),
    datasets: [
      {
        label: 'Workouts',
        data: weeklyData.map(w => w.workouts),
        borderColor: 'rgb(102, 126, 234)',
        backgroundColor: 'rgba(102, 126, 234, 0.1)',
        tension: 0.4,
        fill: true,
        yAxisID: 'y',
      },
      {
        label: 'Volume (1000s lbs)',
        data: weeklyData.map(w => Math.round(w.volume / 1000)),
        borderColor: 'rgb(118, 75, 162)',
        backgroundColor: 'rgba(118, 75, 162, 0.1)',
        tension: 0.4,
        fill: true,
        yAxisID: 'y1',
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: true,
    aspectRatio: 2,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: {
        display: true,
        position: 'top',
        labels: {
          boxWidth: 12,
          padding: 10,
          font: {
            size: 11,
          },
        },
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 12,
        titleFont: {
          size: 13,
        },
        bodyFont: {
          size: 12,
        },
        callbacks: {
          afterBody: (context) => {
            const index = context[0].dataIndex;
            const week = weeklyData[index];
            return [
              `Avg Duration: ${week.avgDuration}m`,
              `Total Volume: ${week.volume.toLocaleString()} lbs`,
            ];
          },
        },
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          font: {
            size: 11,
          },
        },
      },
      y: {
        type: 'linear',
        display: true,
        position: 'left',
        title: {
          display: true,
          text: 'Workouts',
          font: {
            size: 11,
          },
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
        },
        ticks: {
          font: {
            size: 10,
          },
          stepSize: 1,
        },
      },
      y1: {
        type: 'linear',
        display: true,
        position: 'right',
        title: {
          display: true,
          text: 'Volume (1000s lbs)',
          font: {
            size: 11,
          },
        },
        grid: {
          drawOnChartArea: false,
        },
        ticks: {
          font: {
            size: 10,
          },
        },
      },
    },
  };

  return (
    <Card
      sx={{
        borderRadius: 3,
        boxShadow: '0 4px 16px rgba(19, 70, 134, 0.08)',
      }}
    >
      <CardContent sx={{ p: 2.5 }}>
        <Typography
          variant="overline"
          sx={{
            color: 'primary.main',
            fontWeight: 600,
            letterSpacing: 1,
            mb: 2,
            display: 'block',
          }}
        >
          4-WEEK PROGRESSION
        </Typography>

        <Box sx={{ minHeight: '250px' }}>
          <Line data={chartData} options={options} />
        </Box>

        {/* Summary Stats */}
        <Box
          sx={{
            mt: 2,
            pt: 2,
            borderTop: '1px solid',
            borderColor: 'divider',
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 2,
          }}
        >
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h6" sx={{ fontWeight: 700, color: 'primary.main' }}>
              {weeklyData.reduce((sum, w) => sum + w.workouts, 0)}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Total Workouts
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h6" sx={{ fontWeight: 700, color: 'primary.main' }}>
              {Math.round(weeklyData.reduce((sum, w) => sum + w.volume, 0) / 1000)}k
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Total Volume (lbs)
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h6" sx={{ fontWeight: 700, color: 'primary.main' }}>
              {Math.round(
                weeklyData.reduce((sum, w) => sum + w.avgDuration, 0) / 
                weeklyData.filter(w => w.workouts > 0).length || 0
              )}m
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Avg Duration
            </Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
});

FourWeekProgressionChart.displayName = 'FourWeekProgressionChart';

FourWeekProgressionChart.propTypes = {
  workoutHistory: PropTypes.array,
};
