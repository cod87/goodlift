import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
  Stack,
  Chip,
  IconButton,
} from '@mui/material';
import { TrendingUp, TrendingDown, TrendingFlat, Add } from '@mui/icons-material';
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
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { 
  validateWeight, 
  formatWeight,
  calculateWeightChange,
  prepareWeightChartData,
  getWeightStats 
} from '../utils/weightUtils';
import { calculateYAxisMax, getLabelPosition, getLabelAnchor } from '../utils/chartUtils';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ChartDataLabels
);

const WeightTracker = ({ 
  weightHistory, 
  currentWeight, 
  currentUnit,
  targetWeight,
  onAddWeight,
}) => {
  const [newWeight, setNewWeight] = useState('');
  const [selectedUnit, setSelectedUnit] = useState(currentUnit || 'lbs');
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    setSelectedUnit(currentUnit || 'lbs');
  }, [currentUnit]);

  const handleAddWeight = () => {
    setError(null);
    
    const validation = validateWeight(newWeight, selectedUnit);
    if (!validation.valid) {
      setError(validation.error);
      return;
    }

    onAddWeight(parseFloat(newWeight), selectedUnit);
    setNewWeight('');
    setShowForm(false);
  };

  // Calculate weight change
  const weightChange = calculateWeightChange(weightHistory, 30);
  
  // Get weight stats
  const stats = getWeightStats(weightHistory, selectedUnit);

  // Prepare chart data
  const chartData = prepareWeightChartData(weightHistory, 30, selectedUnit);

  // Calculate y-axis max using the new logic: max + 50, rounded to nearest 50
  const yAxisMax = chartData.data.length > 0 ? calculateYAxisMax(chartData.data) : 100;

  // Calculate y-axis minimum based on target weight
  let yAxisMin = undefined;
  if (targetWeight && chartData.data.length > 0) {
    // Use target weight as minimum, with some padding below
    const minDataValue = Math.min(...chartData.data);
    yAxisMin = Math.min(targetWeight, minDataValue) - 5; // 5 units below target or min data
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: (context) => `${context.parsed.y} ${selectedUnit}`,
        },
      },
      datalabels: {
        display: true,
        color: 'rgb(25, 118, 210)',
        font: {
          size: 10,
          weight: 'bold',
        },
        // Dynamic positioning based on proximity to y-axis max
        align: (context) => {
          const value = context.dataset.data[context.dataIndex];
          return getLabelPosition(value, yAxisMax);
        },
        anchor: (context) => {
          const value = context.dataset.data[context.dataIndex];
          return getLabelAnchor(value, yAxisMax);
        },
        offset: 4,
        formatter: (value) => value > 0 ? `${value}` : '',
      },
    },
    scales: {
      y: {
        beginAtZero: false,
        min: yAxisMin,
        max: yAxisMax,
        ticks: {
          callback: (value) => `${value} ${selectedUnit}`,
        },
      },
    },
  };

  const chartDataConfig = {
    labels: chartData.labels,
    datasets: [
      {
        label: 'Weight',
        data: chartData.data,
        borderColor: 'rgb(25, 118, 210)',
        backgroundColor: 'rgba(25, 118, 210, 0.1)',
        fill: true,
        tension: 0.4,
      },
    ],
  };

  const getTrendIcon = () => {
    if (weightChange.direction === 'up') {
      return <TrendingUp color="warning" />;
    } else if (weightChange.direction === 'down') {
      return <TrendingDown color="success" />;
    }
    return <TrendingFlat color="info" />;
  };

  return (
    <Card sx={{ borderRadius: 2 }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" fontWeight={600}>
            Weight Tracking
          </Typography>
          <IconButton 
            color="primary" 
            onClick={() => setShowForm(!showForm)}
            size="small"
          >
            <Add />
          </IconButton>
        </Box>

        {/* Current Weight Display */}
        {currentWeight && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Current Weight
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography variant="h4" fontWeight={700}>
                {formatWeight(currentWeight, selectedUnit)}
              </Typography>
              {weightChange.direction !== 'stable' && (
                <Chip
                  icon={getTrendIcon()}
                  label={`${weightChange.change > 0 ? '+' : ''}${weightChange.change} ${selectedUnit}`}
                  size="small"
                  color={weightChange.direction === 'up' ? 'warning' : 'success'}
                />
              )}
            </Box>
            <Typography variant="caption" color="text.secondary">
              {weightChange.direction !== 'stable' 
                ? `${Math.abs(weightChange.percentage)}% ${weightChange.direction === 'up' ? 'increase' : 'decrease'} in last 30 days`
                : 'No significant change in last 30 days'}
            </Typography>
          </Box>
        )}

        {/* Add Weight Form */}
        {showForm && (
          <Box sx={{ mb: 3, p: 2, bgcolor: 'action.hover', borderRadius: 2 }}>
            <Typography variant="body2" fontWeight={600} gutterBottom>
              Add Weight Entry
            </Typography>
            
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            <Stack direction="row" spacing={2} alignItems="flex-start">
              <TextField
                label="Weight"
                type="number"
                value={newWeight === '' ? '' : newWeight}
                onChange={(e) => {
                  setNewWeight(e.target.value);
                  setError(null);
                }}
                size="small"
                sx={{ flex: 1 }}
                inputProps={{ step: 0.1, min: 0 }}
              />
              
              <FormControl size="small" sx={{ minWidth: 80 }}>
                <InputLabel>Unit</InputLabel>
                <Select
                  value={selectedUnit}
                  onChange={(e) => setSelectedUnit(e.target.value)}
                  label="Unit"
                >
                  <MenuItem value="lbs">lbs</MenuItem>
                  <MenuItem value="kg">kg</MenuItem>
                </Select>
              </FormControl>

              <Button
                variant="contained"
                onClick={handleAddWeight}
                disabled={!newWeight}
                size="small"
                sx={{ minWidth: 80 }}
              >
                Add
              </Button>
            </Stack>
          </Box>
        )}

        {/* Weight Chart */}
        {chartData.data.length > 0 ? (
          <Box sx={{ height: 250, mb: 2 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Last 30 Days
            </Typography>
            <Line data={chartDataConfig} options={chartOptions} />
          </Box>
        ) : (
          <Alert severity="info" sx={{ mb: 2 }}>
            No weight history yet. Add your first weight entry to start tracking!
          </Alert>
        )}

        {/* Stats Summary */}
        {stats.entries > 0 && (
          <Box 
            sx={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(3, 1fr)', 
              gap: 2,
              pt: 2,
              borderTop: 1,
              borderColor: 'divider',
            }}
          >
            <Box>
              <Typography variant="caption" color="text.secondary">
                Minimum
              </Typography>
              <Typography variant="body2" fontWeight={600}>
                {formatWeight(stats.min, selectedUnit)}
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">
                Average
              </Typography>
              <Typography variant="body2" fontWeight={600}>
                {formatWeight(stats.average, selectedUnit)}
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">
                Maximum
              </Typography>
              <Typography variant="body2" fontWeight={600}>
                {formatWeight(stats.max, selectedUnit)}
              </Typography>
            </Box>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

WeightTracker.propTypes = {
  weightHistory: PropTypes.arrayOf(
    PropTypes.shape({
      weight: PropTypes.number.isRequired,
      unit: PropTypes.string.isRequired,
      date: PropTypes.string.isRequired,
    })
  ).isRequired,
  currentWeight: PropTypes.number,
  currentUnit: PropTypes.string,
  targetWeight: PropTypes.number,
  onAddWeight: PropTypes.func.isRequired,
};

export default WeightTracker;
