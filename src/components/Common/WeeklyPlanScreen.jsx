import { memo } from 'react';
import PropTypes from 'prop-types';
import { 
  Box, 
  Container,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Stack
} from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import WeeklyPlanPreview from '../Home/WeeklyPlanPreview';
import { useWeeklyPlan } from '../../hooks/useWeeklyPlan';

/**
 * WeeklyPlanScreen - Full weekly plan management screen
 * Allows users to view, edit, and customize their weekly training plan
 */
const WeeklyPlanScreen = memo(({ onBack, onQuickStartDay }) => {
  const {
    planningStyle,
    weeklyPlan,
    updatePlanningStyle,
    resetToDefault,
  } = useWeeklyPlan();

  const handleStyleChange = (event) => {
    updatePlanningStyle(event.target.value);
  };

  const handleRandomizeWeek = () => {
    // For now, just reset to default. Could add randomization logic later
    resetToDefault();
  };

  return (
    <Container maxWidth="md" sx={{ py: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Button
          startIcon={<ArrowBack />}
          onClick={onBack}
          sx={{ mb: 2 }}
        >
          Back
        </Button>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
          Weekly Training Plan
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Configure your weekly workout schedule based on science-backed training splits
        </Typography>
      </Box>

      {/* Planning Style Selector */}
      <Box sx={{ mb: 3 }}>
        <FormControl fullWidth>
          <InputLabel id="planning-style-label">Training Split</InputLabel>
          <Select
            labelId="planning-style-label"
            id="planning-style-select"
            value={planningStyle}
            label="Training Split"
            onChange={handleStyleChange}
          >
            <MenuItem value="upper_lower">Upper/Lower Split</MenuItem>
            <MenuItem value="ppl">Push/Pull/Legs (PPL)</MenuItem>
          </Select>
        </FormControl>
        
        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
          {planningStyle === 'upper_lower' && 
            'Trains upper body 2x/week and lower body 2x/week with recovery days'}
          {planningStyle === 'ppl' && 
            'Targets specific muscle groups with push, pull, and leg days for balanced development'}
        </Typography>
      </Box>

      {/* Weekly Plan Preview */}
      <WeeklyPlanPreview
        weeklyPlan={weeklyPlan}
        onQuickStartDay={onQuickStartDay}
        onEditPlan={() => {
          // Future: Open detailed editor
          console.log('Edit plan functionality coming soon');
        }}
        onRandomizeWeek={handleRandomizeWeek}
        onResetPlan={resetToDefault}
      />

      {/* Info Section */}
      <Box sx={{ mt: 3, p: 2, borderRadius: 2, bgcolor: 'action.hover' }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
          About Your Training Plan
        </Typography>
        <Typography variant="caption" color="text.secondary" component="div">
          • Each workout includes strength training and optional cardio<br />
          • Recovery days (Yoga/Rest) are essential for muscle growth<br />
          • HIIT sessions are lower-impact to reduce joint stress<br />
          • Adjust your plan based on recovery and energy levels<br />
        </Typography>
      </Box>

      {/* Action Buttons */}
      <Stack spacing={2} sx={{ mt: 3 }}>
        <Button
          variant="outlined"
          onClick={resetToDefault}
          fullWidth
        >
          Reset to Default Plan
        </Button>
      </Stack>
    </Container>
  );
});

WeeklyPlanScreen.displayName = 'WeeklyPlanScreen';

WeeklyPlanScreen.propTypes = {
  onBack: PropTypes.func.isRequired,
  onQuickStartDay: PropTypes.func,
};

export default WeeklyPlanScreen;
