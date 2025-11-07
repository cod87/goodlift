import { memo, useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import { motion } from 'framer-motion';
import { 
  Box, 
  Card, 
  CardContent, 
  Typography, 
  Button, 
  Chip, 
  Stack, 
  Checkbox,
  FormControlLabel,
  Alert,
  IconButton
} from '@mui/material';
import { CheckCircle, Cancel } from '@mui/icons-material';
import { EXERCISES_PER_WORKOUT, MUSCLE_GROUPS } from '../utils/constants';

/**
 * CustomizeExerciseScreen component for selecting custom exercises
 * Allows users to select exactly EXERCISES_PER_WORKOUT exercises from filtered list
 * Filters by workout type and equipment
 */
const CustomizeExerciseScreen = memo(({ 
  workoutType,
  equipmentFilter,
  allExercises,
  onCancel,
  onContinue,
}) => {
  const [selectedExercises, setSelectedExercises] = useState([]);
  const REQUIRED_COUNT = EXERCISES_PER_WORKOUT;

  // Filter exercises based on workout type and equipment
  const filteredExercises = useMemo(() => {
    let filtered = [...allExercises];

    // Filter by workout type
    if (workoutType === 'upper') {
      filtered = filtered.filter(ex => {
        const muscle = ex['Primary Muscle'].split('(')[0].trim();
        return MUSCLE_GROUPS.UPPER_BODY.includes(muscle);
      });
    } else if (workoutType === 'lower') {
      filtered = filtered.filter(ex => {
        const muscle = ex['Primary Muscle'].split('(')[0].trim();
        return MUSCLE_GROUPS.LOWER_BODY.includes(muscle) || ['Core', 'Abs', 'Obliques'].includes(muscle);
      });
    }

    // Filter by equipment
    if (equipmentFilter !== 'all' && Array.isArray(equipmentFilter) && equipmentFilter.length > 0) {
      filtered = filtered.filter(ex => {
        const equipment = ex.Equipment.toLowerCase();
        return equipmentFilter.some(filter => {
          const normalizedFilter = filter.toLowerCase();
          if (normalizedFilter === 'cable machine') {
            return equipment.includes('cable');
          }
          if (normalizedFilter === 'dumbbells') {
            return equipment.includes('dumbbell');
          }
          return equipment.includes(normalizedFilter);
        });
      });
    }

    // Sort by primary muscle and exercise name for better organization
    return filtered.sort((a, b) => {
      const muscleA = a['Primary Muscle'].split('(')[0].trim();
      const muscleB = b['Primary Muscle'].split('(')[0].trim();
      if (muscleA !== muscleB) {
        return muscleA.localeCompare(muscleB);
      }
      return a['Exercise Name'].localeCompare(b['Exercise Name']);
    });
  }, [allExercises, workoutType, equipmentFilter]);

  // Group exercises by primary muscle
  const groupedExercises = useMemo(() => {
    const groups = {};
    filteredExercises.forEach(ex => {
      const muscle = ex['Primary Muscle'].split('(')[0].trim();
      if (!groups[muscle]) {
        groups[muscle] = [];
      }
      groups[muscle].push(ex);
    });
    return groups;
  }, [filteredExercises]);

  const handleToggleExercise = (exercise) => {
    const exerciseName = exercise['Exercise Name'];
    const isSelected = selectedExercises.some(ex => ex['Exercise Name'] === exerciseName);

    if (isSelected) {
      setSelectedExercises(prev => prev.filter(ex => ex['Exercise Name'] !== exerciseName));
    } else {
      if (selectedExercises.length < REQUIRED_COUNT) {
        setSelectedExercises(prev => [...prev, exercise]);
      }
    }
  };

  const handleContinue = () => {
    if (selectedExercises.length === REQUIRED_COUNT) {
      onContinue(selectedExercises);
    }
  };

  const isExerciseSelected = (exercise) => {
    return selectedExercises.some(ex => ex['Exercise Name'] === exercise['Exercise Name']);
  };

  const canSelectMore = selectedExercises.length < REQUIRED_COUNT;
  const isComplete = selectedExercises.length === REQUIRED_COUNT;

  return (
    <motion.div
      className="screen"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      style={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: 'calc(100vh - 4rem)',
        padding: '1rem',
        paddingBottom: 'max(2rem, calc(env(safe-area-inset-bottom) + 1rem))',
        overflow: 'auto',
      }}
    >
      {/* Header */}
      <Box sx={{ 
        maxWidth: 900, 
        width: '100%', 
        margin: '0 auto',
        mb: 3,
        position: 'sticky',
        top: 0,
        bgcolor: 'background.default',
        zIndex: 10,
        pt: 2,
        pb: 2,
      }}>
        <Box sx={{ textAlign: 'center', mb: 2 }}>
          <Typography variant="h4" component="h1" gutterBottom sx={{ 
            fontWeight: 700,
            color: 'primary.main',
            fontSize: { xs: '1.5rem', sm: '2rem' }
          }}>
            Customize Your Workout
          </Typography>
          <Typography variant="subtitle1" color="text.secondary" sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}>
            Select exactly {REQUIRED_COUNT} exercises
          </Typography>
        </Box>

        {/* Selection Counter */}
        <Alert 
          severity={isComplete ? "success" : "info"}
          icon={isComplete ? <CheckCircle /> : undefined}
          sx={{ mb: 2 }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              Selected: {selectedExercises.length} / {REQUIRED_COUNT}
            </Typography>
            {!isComplete && (
              <Typography variant="body2" color="text.secondary">
                ({REQUIRED_COUNT - selectedExercises.length} more needed)
              </Typography>
            )}
          </Box>
        </Alert>

        {/* Action Buttons */}
        <Stack direction="row" spacing={2}>
          <Button
            variant="outlined"
            onClick={onCancel}
            fullWidth
            sx={{
              py: 1.5,
              fontSize: '1rem',
              fontWeight: 600,
              borderRadius: 2,
              textTransform: 'none',
            }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleContinue}
            disabled={!isComplete}
            fullWidth
            sx={{
              py: 1.5,
              fontSize: '1rem',
              fontWeight: 600,
              borderRadius: 2,
              textTransform: 'none',
            }}
          >
            Continue to Preview
          </Button>
        </Stack>
      </Box>

      {/* Exercise List Grouped by Muscle */}
      <Box sx={{ maxWidth: 900, width: '100%', margin: '0 auto' }}>
        {Object.entries(groupedExercises).map(([muscle, exercises]) => (
          <Box key={muscle} sx={{ mb: 3 }}>
            <Typography 
              variant="h6" 
              sx={{ 
                mb: 2,
                fontWeight: 600,
                color: 'secondary.main',
                fontSize: { xs: '1rem', sm: '1.25rem' }
              }}
            >
              {muscle} ({exercises.length})
            </Typography>
            <Stack spacing={1.5}>
              {exercises.map((exercise) => {
                const selected = isExerciseSelected(exercise);
                const disabled = !canSelectMore && !selected;

                return (
                  <Card 
                    key={exercise['Exercise Name']}
                    sx={{
                      border: '2px solid',
                      borderColor: selected ? 'primary.main' : 'divider',
                      bgcolor: selected ? 'rgba(19, 70, 134, 0.05)' : 'white',
                      cursor: disabled ? 'not-allowed' : 'pointer',
                      opacity: disabled ? 0.5 : 1,
                      transition: 'all 0.2s ease',
                      '&:hover': !disabled ? {
                        borderColor: 'primary.main',
                        transform: 'translateY(-2px)',
                        boxShadow: '0 4px 12px rgba(19, 70, 134, 0.15)',
                      } : {},
                    }}
                    onClick={() => !disabled && handleToggleExercise(exercise)}
                  >
                    <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Checkbox
                          checked={selected}
                          disabled={disabled}
                          sx={{ p: 0 }}
                          onClick={(e) => e.stopPropagation()}
                          onChange={() => handleToggleExercise(exercise)}
                        />
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography 
                            variant="body1" 
                            sx={{ 
                              fontWeight: 600,
                              mb: 0.5,
                              fontSize: { xs: '0.9rem', sm: '1rem' }
                            }}
                          >
                            {exercise['Exercise Name']}
                          </Typography>
                          <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ gap: 0.5 }}>
                            <Chip 
                              label={exercise['Equipment']} 
                              size="small" 
                              variant="outlined"
                              sx={{ 
                                fontSize: { xs: '0.65rem', sm: '0.75rem' },
                                height: 'auto',
                                '& .MuiChip-label': { px: 1, py: 0.5 }
                              }}
                            />
                            <Chip 
                              label={exercise['Exercise Type']} 
                              size="small" 
                              variant="outlined"
                              sx={{ 
                                fontSize: { xs: '0.65rem', sm: '0.75rem' },
                                height: 'auto',
                                '& .MuiChip-label': { px: 1, py: 0.5 }
                              }}
                            />
                          </Stack>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                );
              })}
            </Stack>
          </Box>
        ))}

        {filteredExercises.length === 0 && (
          <Alert severity="warning" sx={{ mt: 2 }}>
            No exercises found for the selected filters. Please adjust your workout type or equipment selection.
          </Alert>
        )}
      </Box>
    </motion.div>
  );
});

CustomizeExerciseScreen.displayName = 'CustomizeExerciseScreen';

CustomizeExerciseScreen.propTypes = {
  workoutType: PropTypes.string.isRequired,
  equipmentFilter: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.array
  ]).isRequired,
  allExercises: PropTypes.array.isRequired,
  onCancel: PropTypes.func.isRequired,
  onContinue: PropTypes.func.isRequired,
};

export default CustomizeExerciseScreen;
