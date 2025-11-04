import { memo } from 'react';
import PropTypes from 'prop-types';
import { motion } from 'framer-motion';
import { Box, Card, CardContent, Typography, FormControlLabel, Radio, RadioGroup, Checkbox, FormGroup, Button } from '@mui/material';
import { FitnessCenterRounded } from '@mui/icons-material';

/**
 * SelectionScreen component for workout configuration
 * Allows users to select workout type and equipment filters
 * Memoized to prevent unnecessary re-renders
 */
const SelectionScreen = memo(({ 
  workoutType,
  selectedEquipment,
  equipmentOptions,
  onWorkoutTypeChange,
  onEquipmentChange,
  onStartWorkout,
  loading,
}) => {
  const handleStartClick = () => {
    if (workoutType) {
      const equipmentFilter = selectedEquipment.has('all') 
        ? 'all' 
        : Array.from(selectedEquipment).map(e => e.toLowerCase());
      onStartWorkout(workoutType, equipmentFilter);
    }
  };

  return (
    <motion.div
      className="screen selection-screen"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        maxHeight: '100vh',
        padding: '1rem',
        overflowY: 'auto',
      }}
    >
      {loading ? (
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="h5" sx={{ mb: 2 }}>
            Generating workout...
          </Typography>
        </Box>
      ) : (
        <Card sx={{ 
          maxWidth: 600,
          width: '100%',
          borderRadius: 3,
          boxShadow: '0 8px 32px rgba(19, 70, 134, 0.12)',
          maxHeight: { xs: '95vh', md: 'none' },
          overflowY: { xs: 'auto', md: 'visible' },
        }}>
          <CardContent sx={{ p: { xs: 2, md: 4 } }}>
            <Box sx={{ textAlign: 'center', mb: { xs: 2, md: 4 } }}>
              <FitnessCenterRounded sx={{ fontSize: { xs: 48, md: 64 }, color: 'primary.main', mb: { xs: 1, md: 2 } }} />
              <Typography variant="h4" component="h2" sx={{ 
                fontWeight: 700,
                color: 'primary.main',
                mb: 1,
                fontSize: { xs: '1.5rem', md: '2.125rem' },
              }}>
                Start Your Workout
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ fontSize: { xs: '0.875rem', md: '1rem' } }}>
                Select your workout type and available equipment
              </Typography>
            </Box>

            {/* Workout Type */}
            <Box sx={{ mb: { xs: 2, md: 4 } }}>
              <Typography variant="h6" sx={{ 
                mb: { xs: 1, md: 2 },
                fontWeight: 600,
                color: 'text.primary',
                fontSize: { xs: '1rem', md: '1.25rem' },
              }}>
                Workout Type
              </Typography>
              <RadioGroup
                value={workoutType}
                onChange={(e) => onWorkoutTypeChange(e.target.value)}
              >
                <FormControlLabel 
                  value="full" 
                  control={<Radio />} 
                  label="Full Body"
                  sx={{ mb: { xs: 0.5, md: 1 } }}
                />
                <FormControlLabel 
                  value="upper" 
                  control={<Radio />} 
                  label="Upper Body"
                  sx={{ mb: { xs: 0.5, md: 1 } }}
                />
                <FormControlLabel 
                  value="lower" 
                  control={<Radio />} 
                  label="Lower Body"
                />
              </RadioGroup>
            </Box>

            {/* Equipment */}
            <Box sx={{ mb: { xs: 2, md: 4 } }}>
              <Typography variant="h6" sx={{ 
                mb: { xs: 1, md: 2 },
                fontWeight: 600,
                color: 'text.primary',
                fontSize: { xs: '1rem', md: '1.25rem' },
              }}>
                Equipment
              </Typography>
              <FormGroup>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={selectedEquipment.has('all')}
                      onChange={() => onEquipmentChange('all')}
                    />
                  }
                  label="All Equipment"
                  sx={{ mb: { xs: 0.5, md: 1 } }}
                />
                {equipmentOptions.map((equipment) => (
                  <FormControlLabel
                    key={equipment}
                    control={
                      <Checkbox
                        checked={selectedEquipment.has(equipment.toLowerCase())}
                        onChange={() => onEquipmentChange(equipment.toLowerCase())}
                        disabled={selectedEquipment.has('all')}
                      />
                    }
                    label={equipment}
                    sx={{ mb: { xs: 0.5, md: 1 } }}
                  />
                ))}
              </FormGroup>
            </Box>

            {/* Start Button */}
            <Button
              variant="contained"
              size="large"
              fullWidth
              disabled={!workoutType}
              onClick={handleStartClick}
              sx={{
                py: 2,
                fontSize: '1.1rem',
                fontWeight: 600,
                borderRadius: 2,
                textTransform: 'none',
              }}
            >
              Start Workout
            </Button>
          </CardContent>
        </Card>
      )}
    </motion.div>
  );
});

SelectionScreen.displayName = 'SelectionScreen';

SelectionScreen.propTypes = {
  workoutType: PropTypes.string.isRequired,
  selectedEquipment: PropTypes.instanceOf(Set).isRequired,
  equipmentOptions: PropTypes.array.isRequired,
  onWorkoutTypeChange: PropTypes.func.isRequired,
  onEquipmentChange: PropTypes.func.isRequired,
  onStartWorkout: PropTypes.func.isRequired,
  loading: PropTypes.bool.isRequired,
};

export default SelectionScreen;
