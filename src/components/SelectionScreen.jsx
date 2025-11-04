import { memo } from 'react';
import PropTypes from 'prop-types';
import { motion } from 'framer-motion';
import { Box, Card, CardContent, Typography, FormControlLabel, Radio, RadioGroup, Button } from '@mui/material';

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
        minHeight: 'calc(100vh - 4rem)',
        padding: '1rem',
        paddingBottom: 'max(2rem, calc(env(safe-area-inset-bottom) + 1rem))',
        overflow: 'auto',
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
        }}>
          <CardContent sx={{ p: { xs: 2, sm: 4 } }}>
            <Box sx={{ textAlign: 'center', mb: 3 }}>
              <img
                src={`${import.meta.env.BASE_URL}goodlift-favicon.svg`}
                alt="GoodLift"
                style={{ height: '64px', width: 'auto', marginBottom: '1rem' }}
              />
              <Typography variant="h4" component="h2" sx={{ 
                fontWeight: 700,
                color: 'primary.main',
                mb: 1,
                fontSize: { xs: '1.5rem', sm: '2rem' },
              }}>
                Start Your Workout
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ fontSize: { xs: '0.9rem', sm: '1rem' } }}>
                Select your workout type and available equipment
              </Typography>
            </Box>

            {/* Workout Type */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" sx={{ 
                mb: 2,
                fontWeight: 600,
                color: 'text.primary',
                fontSize: { xs: '1rem', sm: '1.25rem' },
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
                  sx={{ mb: 1 }}
                />
                <FormControlLabel 
                  value="upper" 
                  control={<Radio />} 
                  label="Upper Body"
                  sx={{ mb: 1 }}
                />
                <FormControlLabel 
                  value="lower" 
                  control={<Radio />} 
                  label="Lower Body"
                />
              </RadioGroup>
            </Box>

            {/* Equipment */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" sx={{ 
                mb: 2,
                fontWeight: 600,
                color: 'text.primary',
                fontSize: { xs: '1rem', sm: '1.25rem' },
              }}>
                Equipment
              </Typography>
              <RadioGroup
                value={selectedEquipment.has('all') ? 'all' : Array.from(selectedEquipment)[0] || ''}
                onChange={(e) => onEquipmentChange(e.target.value)}
              >
                <FormControlLabel
                  value="all"
                  control={<Radio />}
                  label="All Equipment"
                  sx={{ mb: 1 }}
                />
                {equipmentOptions.map((equipment) => (
                  <FormControlLabel
                    key={equipment}
                    value={equipment.toLowerCase()}
                    control={<Radio />}
                    label={equipment}
                    sx={{ mb: 1 }}
                  />
                ))}
              </RadioGroup>
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
