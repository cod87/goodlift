import { memo, useState } from 'react';
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
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import WeeklyCalendarView from '../WeeklyCalendarView';
import { useWeeklyPlan } from '../../hooks/useWeeklyPlan';

/**
 * WeeklyPlanScreen - Full weekly plan management screen
 * Allows users to view, edit, and customize their weekly training plan
 * Now uses the new WeeklyCalendarView with 7-day structure
 */
const WeeklyPlanScreen = memo(({ onBack, onQuickStartDay }) => {
  const {
    planningStyle,
    weeklyPlan,
    updatePlanningStyle,
    updateDay,
    resetToDefault,
  } = useWeeklyPlan();

  const [selectedDay, setSelectedDay] = useState(null);
  const [dayEditDialogOpen, setDayEditDialogOpen] = useState(false);

  const handleStyleChange = (event) => {
    updatePlanningStyle(event.target.value);
  };

  const handleRandomizeWeek = () => {
    // For now, just reset to default. Could add randomization logic later
    resetToDefault();
  };

  const handleDayClick = (day, index) => {
    setSelectedDay({ ...day, index });
    setDayEditDialogOpen(true);
  };

  const handlePlanChange = (newPlan) => {
    // Update the entire weekly plan
    // This would need to be implemented in useWeeklyPlan
    console.log('Plan reordered:', newPlan);
  };

  const handleCloseDayEdit = () => {
    setDayEditDialogOpen(false);
    setSelectedDay(null);
  };

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
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
          Configure your weekly workout schedule with a mandatory 7-day structure
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

      {/* Weekly Calendar View */}
      <WeeklyCalendarView
        weeklyPlan={weeklyPlan}
        onPlanChange={handlePlanChange}
        onDayClick={handleDayClick}
        readOnly={false}
      />

      {/* Info Section */}
      <Box sx={{ mt: 3, p: 2, borderRadius: 2, bgcolor: 'action.hover' }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
          About Your Training Plan
        </Typography>
        <Typography variant="caption" color="text.secondary" component="div">
          • Each workout is scheduled based on recovery needs<br />
          • No more than 2 consecutive intense training days<br />
          • Active recovery days include mobility and flexibility work<br />
          • Rest days are essential for muscle growth and adaptation<br />
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

      {/* Day Edit Dialog */}
      <Dialog open={dayEditDialogOpen} onClose={handleCloseDayEdit} maxWidth="sm" fullWidth>
        <DialogTitle>
          Edit {selectedDay?.dayName}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Day editing functionality will be available in a future update.
          </Typography>
          {selectedDay && (
            <Box>
              <Typography variant="subtitle2">Current Configuration:</Typography>
              <Typography variant="body2">Type: {selectedDay.type}</Typography>
              <Typography variant="body2">Duration: {selectedDay.duration} min</Typography>
              <Typography variant="body2">{selectedDay.description}</Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDayEdit}>Close</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
});

WeeklyPlanScreen.displayName = 'WeeklyPlanScreen';

WeeklyPlanScreen.propTypes = {
  onBack: PropTypes.func.isRequired,
  onQuickStartDay: PropTypes.func,
};

export default WeeklyPlanScreen;
