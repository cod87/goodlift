import { memo, useState } from 'react';
import PropTypes from 'prop-types';
import { 
  Box, 
  Card, 
  CardContent, 
  Typography, 
  Tabs,
  Tab,
  ToggleButtonGroup,
  ToggleButton,
  useTheme,
  useMediaQuery
} from '@mui/material';
import { Line } from 'react-chartjs-2';

/**
 * ChartTabs - Tabbed chart interface for exercise progression
 * Shows one chart at a time with easy switching between exercises
 */
const ChartTabs = memo(({ 
  exercises = [],
  getChartData,
  defaultExercise = null
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const [selectedExercise, setSelectedExercise] = useState(
    defaultExercise || (exercises.length > 0 ? exercises[0] : null)
  );
  const [timeRange, setTimeRange] = useState('1M');

  const handleExerciseChange = (event, newExercise) => {
    if (newExercise !== null) {
      setSelectedExercise(newExercise);
    }
  };

  const handleTimeRangeChange = (event, newRange) => {
    if (newRange !== null) {
      setTimeRange(newRange);
    }
  };

  const chartData = selectedExercise ? getChartData(selectedExercise, timeRange) : null;

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: true,
    aspectRatio: isMobile ? 1.5 : 2,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: false,
      },
      tooltip: {
        mode: 'index',
        intersect: false,
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          maxRotation: 45,
          minRotation: 45,
          font: {
            size: 10,
          },
        },
      },
      y: {
        grid: {
          color: theme.palette.divider,
        },
        ticks: {
          font: {
            size: 10,
          },
        },
      },
    },
    interaction: {
      mode: 'nearest',
      axis: 'x',
      intersect: false,
    },
  };

  if (!exercises || exercises.length === 0) {
    return (
      <Card sx={{ width: '100%', borderRadius: 3 }}>
        <CardContent>
          <Typography variant="body2" color="text.secondary" align="center">
            No exercise data available
          </Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card 
      sx={{ 
        width: '100%',
        borderRadius: 3,
        boxShadow: '0 4px 16px rgba(19, 70, 134, 0.08)',
      }}
    >
      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
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
          STRENGTH PROGRESSION
        </Typography>

        {/* Exercise Tabs */}
        <Box sx={{ 
          borderBottom: 1, 
          borderColor: 'divider',
          mb: 2,
          overflowX: 'auto',
          '&::-webkit-scrollbar': {
            height: '4px',
          },
        }}>
          <Tabs
            value={selectedExercise}
            onChange={handleExerciseChange}
            variant="scrollable"
            scrollButtons="auto"
            allowScrollButtonsMobile
            sx={{
              minHeight: '40px',
              '& .MuiTab-root': {
                minHeight: '40px',
                py: 1,
                px: 2,
                fontSize: '0.8rem',
                textTransform: 'none',
              },
            }}
          >
            {exercises.map((exercise) => (
              <Tab 
                key={exercise} 
                label={exercise} 
                value={exercise}
              />
            ))}
          </Tabs>
        </Box>

        {/* Chart */}
        {chartData && (
          <Box sx={{ mb: 2, minHeight: isMobile ? '250px' : '300px' }}>
            <Line data={chartData} options={chartOptions} />
          </Box>
        )}

        {/* Time Range Filter */}
        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
          <ToggleButtonGroup
            value={timeRange}
            exclusive
            onChange={handleTimeRangeChange}
            size="small"
            aria-label="time range"
          >
            <ToggleButton value="1W" aria-label="1 week">
              1W
            </ToggleButton>
            <ToggleButton value="1M" aria-label="1 month">
              1M
            </ToggleButton>
            <ToggleButton value="3M" aria-label="3 months">
              3M
            </ToggleButton>
            <ToggleButton value="All" aria-label="all time">
              All
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>
      </CardContent>
    </Card>
  );
});

ChartTabs.displayName = 'ChartTabs';

ChartTabs.propTypes = {
  exercises: PropTypes.arrayOf(PropTypes.string).isRequired,
  getChartData: PropTypes.func.isRequired,
  defaultExercise: PropTypes.string,
};

export default ChartTabs;
