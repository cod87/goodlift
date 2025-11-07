import { memo, useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import { motion, Reorder } from 'framer-motion';
import { 
  Box, 
  Card, 
  CardContent, 
  Typography, 
  Button, 
  Chip, 
  Stack, 
  Checkbox,
  Alert,
  IconButton,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  Tooltip
} from '@mui/material';
import { 
  CheckCircle, 
  Search as SearchIcon,
  DragIndicator,
  Close as CloseIcon,
  Link as LinkIcon
} from '@mui/icons-material';
import { EXERCISES_PER_WORKOUT, MUSCLE_GROUPS, ALL_MUSCLE_GROUPS } from '../utils/constants';

/** Superset grouping size */
const SUPERSET_SIZE = 2;

/** Core muscle groups for lower body workouts */
const CORE_MUSCLES = ['Core', 'Abs', 'Obliques'];

/**
 * CustomizeExerciseScreen component for selecting custom exercises
 * Features:
 * - Filters by workout type, body part, equipment, and exercise type
 * - Search functionality
 * - Drag-and-drop preview area at top showing selected exercises
 * - Compact exercise list optimized for mobile
 * - Superset indication in preview area
 */
const CustomizeExerciseScreen = memo(({ 
  workoutType,
  equipmentFilter,
  allExercises,
  onCancel,
  onContinue,
}) => {
  const [selectedExercises, setSelectedExercises] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [bodyPartFilter, setBodyPartFilter] = useState('all');
  const [equipmentTypeFilter, setEquipmentTypeFilter] = useState('all');
  const [exerciseTypeFilter, setExerciseTypeFilter] = useState('all');
  const REQUIRED_COUNT = EXERCISES_PER_WORKOUT;

  // Filter exercises based on all criteria
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
        return MUSCLE_GROUPS.LOWER_BODY.includes(muscle) || CORE_MUSCLES.includes(muscle);
      });
    }

    // Filter by equipment (from SelectionScreen)
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

    // Filter by search term
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(ex =>
        ex['Exercise Name'].toLowerCase().includes(search) ||
        ex['Primary Muscle'].toLowerCase().includes(search) ||
        ex['Secondary Muscles']?.toLowerCase().includes(search) ||
        ex['Equipment'].toLowerCase().includes(search)
      );
    }

    // Filter by body part
    if (bodyPartFilter !== 'all') {
      filtered = filtered.filter(ex => {
        const muscle = ex['Primary Muscle'].split('(')[0].trim();
        return muscle === bodyPartFilter;
      });
    }

    // Filter by equipment type (secondary filter)
    if (equipmentTypeFilter !== 'all') {
      filtered = filtered.filter(ex => {
        const equipment = ex.Equipment.toLowerCase();
        const filterLower = equipmentTypeFilter.toLowerCase();
        return equipment.includes(filterLower);
      });
    }

    // Filter by exercise type
    if (exerciseTypeFilter !== 'all') {
      filtered = filtered.filter(ex => ex['Exercise Type'] === exerciseTypeFilter);
    }

    return filtered;
  }, [allExercises, workoutType, equipmentFilter, searchTerm, bodyPartFilter, equipmentTypeFilter, exerciseTypeFilter]);

  // Get unique body parts from filtered exercises (before additional filters)
  const availableBodyParts = useMemo(() => {
    let base = [...allExercises];
    
    // Apply workout type filter
    if (workoutType === 'upper') {
      base = base.filter(ex => {
        const muscle = ex['Primary Muscle'].split('(')[0].trim();
        return MUSCLE_GROUPS.UPPER_BODY.includes(muscle);
      });
    } else if (workoutType === 'lower') {
      base = base.filter(ex => {
        const muscle = ex['Primary Muscle'].split('(')[0].trim();
        return MUSCLE_GROUPS.LOWER_BODY.includes(muscle) || CORE_MUSCLES.includes(muscle);
      });
    }

    // Apply equipment filter from SelectionScreen
    if (equipmentFilter !== 'all' && Array.isArray(equipmentFilter) && equipmentFilter.length > 0) {
      base = base.filter(ex => {
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

    const parts = new Set();
    base.forEach(ex => {
      const muscle = ex['Primary Muscle'].split('(')[0].trim();
      parts.add(muscle);
    });
    return ['all', ...Array.from(parts).sort()];
  }, [allExercises, workoutType, equipmentFilter]);

  // Get unique equipment types
  const availableEquipmentTypes = useMemo(() => {
    const types = new Set();
    filteredExercises.forEach(ex => {
      types.add(ex.Equipment);
    });
    return ['all', ...Array.from(types).sort()];
  }, [filteredExercises]);

  // Get unique exercise types
  const availableExerciseTypes = useMemo(() => {
    const types = new Set();
    filteredExercises.forEach(ex => {
      types.add(ex['Exercise Type']);
    });
    return ['all', ...Array.from(types).sort()];
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

  const handleRemoveExercise = (exerciseName) => {
    setSelectedExercises(prev => prev.filter(ex => ex['Exercise Name'] !== exerciseName));
  };

  const handleReorderExercises = (newOrder) => {
    setSelectedExercises(newOrder);
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
      {/* Header with Title and Actions */}
      <Box sx={{ 
        maxWidth: 1200, 
        width: '100%', 
        margin: '0 auto',
        mb: 2,
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

        {/* Drag and Drop Preview Area */}
        {selectedExercises.length > 0 && (
          <Paper 
            elevation={3}
            sx={{ 
              p: 2, 
              mb: 2,
              bgcolor: 'rgba(19, 70, 134, 0.03)',
              borderRadius: 2,
              border: '2px solid',
              borderColor: 'primary.main',
            }}
            role="region"
            aria-label="Selected exercises preview"
          >
            <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 600, color: 'primary.main' }}>
              <span role="img" aria-label="clipboard">📋</span> Your Workout Order (drag to reorder)
            </Typography>
            <Reorder.Group 
              axis="y" 
              values={selectedExercises} 
              onReorder={handleReorderExercises}
              style={{ padding: 0, margin: 0, listStyle: 'none' }}
            >
              <Stack spacing={1}>
                {selectedExercises.map((exercise, idx) => {
                  // Determine if this exercise is part of a superset pair
                  const isSuperset = idx % SUPERSET_SIZE === 0 && idx < selectedExercises.length - 1;
                  const isSupersetPair = idx % SUPERSET_SIZE === 1;
                  
                  return (
                    <Reorder.Item 
                      key={exercise['Exercise Name']} 
                      value={exercise}
                      style={{ listStyle: 'none' }}
                    >
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                            p: 1,
                            bgcolor: 'white',
                            borderRadius: 1,
                            border: '1px solid',
                            borderColor: isSuperset || isSupersetPair ? 'warning.main' : 'divider',
                            boxShadow: isSuperset || isSupersetPair ? '0 2px 8px rgba(254, 178, 26, 0.2)' : 'none',
                            cursor: 'grab',
                            '&:active': {
                              cursor: 'grabbing',
                            },
                            position: 'relative',
                          }}
                        >
                          {/* Superset indicator */}
                          {(isSuperset || isSupersetPair) && (
                            <Tooltip title="Superset pair - perform back-to-back">
                              <Box
                                sx={{
                                  position: 'absolute',
                                  left: 0,
                                  top: 0,
                                  bottom: 0,
                                  width: 4,
                                  bgcolor: 'warning.main',
                                  borderRadius: '4px 0 0 4px',
                                }}
                              />
                            </Tooltip>
                          )}
                          
                          <DragIndicator sx={{ color: 'action.active', fontSize: { xs: 16, sm: 20 } }} />
                          
                          <Chip
                            label={idx + 1}
                            size="small"
                            sx={{
                              minWidth: { xs: 24, sm: 28 },
                              height: { xs: 24, sm: 28 },
                              fontSize: { xs: '0.7rem', sm: '0.8rem' },
                              fontWeight: 700,
                              bgcolor: 'primary.main',
                              color: 'white',
                            }}
                          />
                          
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography 
                              variant="body2" 
                              sx={{ 
                                fontWeight: 600,
                                fontSize: { xs: '0.75rem', sm: '0.875rem' },
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {exercise['Exercise Name']}
                            </Typography>
                          </Box>

                          {(isSuperset || isSupersetPair) && (
                            <Chip
                              icon={<LinkIcon sx={{ fontSize: 14 }} />}
                              label="Superset"
                              size="small"
                              sx={{
                                height: { xs: 20, sm: 24 },
                                fontSize: { xs: '0.6rem', sm: '0.7rem' },
                                bgcolor: 'warning.main',
                                color: 'white',
                                '& .MuiChip-icon': { color: 'white', marginLeft: '4px' }
                              }}
                            />
                          )}
                          
                          <IconButton
                            size="small"
                            onClick={() => handleRemoveExercise(exercise['Exercise Name'])}
                            sx={{ 
                              color: 'error.main',
                              p: { xs: 0.25, sm: 0.5 },
                            }}
                          >
                            <CloseIcon sx={{ fontSize: { xs: 16, sm: 20 } }} />
                          </IconButton>
                        </Box>
                      </motion.div>
                    </Reorder.Item>
                  );
                })}
              </Stack>
            </Reorder.Group>
            
            {selectedExercises.length >= 2 && (
              <Alert severity="info" sx={{ mt: 2, py: 0.5 }}>
                <Typography variant="caption">
                  <span role="img" aria-label="light bulb">💡</span> Exercises are grouped in pairs as supersets (perform back-to-back with minimal rest)
                </Typography>
              </Alert>
            )}
          </Paper>
        )}

        {/* Action Buttons */}
        <Stack direction="row" spacing={2}>
          <Button
            variant="outlined"
            onClick={onCancel}
            fullWidth
            sx={{
              py: 1.5,
              fontSize: { xs: '0.9rem', sm: '1rem' },
              fontWeight: 600,
              borderRadius: 2,
              textTransform: 'none',
            }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={() => onContinue(selectedExercises)}
            disabled={!isComplete}
            fullWidth
            sx={{
              py: 1.5,
              fontSize: { xs: '0.9rem', sm: '1rem' },
              fontWeight: 600,
              borderRadius: 2,
              textTransform: 'none',
            }}
          >
            Continue to Preview
          </Button>
        </Stack>
      </Box>

      {/* Filters and Search Bar */}
      <Box sx={{ 
        maxWidth: 1200, 
        width: '100%', 
        margin: '0 auto',
        mb: 2,
        position: 'sticky',
        top: { xs: 60, sm: 70 },
        bgcolor: 'background.default',
        zIndex: 5,
        pb: 1,
      }}>
        <Paper elevation={2} sx={{ p: 2, borderRadius: 2 }}>
          <Stack spacing={2}>
            {/* Search Bar */}
            <TextField
              fullWidth
              size="small"
              placeholder="Search exercises..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                },
              }}
            />

            {/* Filters Row */}
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
              <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 140 } }}>
                <InputLabel>Body Part</InputLabel>
                <Select
                  value={bodyPartFilter}
                  label="Body Part"
                  onChange={(e) => setBodyPartFilter(e.target.value)}
                >
                  {availableBodyParts.map(part => (
                    <MenuItem key={part} value={part}>
                      {part === 'all' ? 'All Muscles' : part}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 140 } }}>
                <InputLabel>Equipment</InputLabel>
                <Select
                  value={equipmentTypeFilter}
                  label="Equipment"
                  onChange={(e) => setEquipmentTypeFilter(e.target.value)}
                >
                  {availableEquipmentTypes.map(type => (
                    <MenuItem key={type} value={type}>
                      {type === 'all' ? 'All Equipment' : type}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 140 } }}>
                <InputLabel>Type</InputLabel>
                <Select
                  value={exerciseTypeFilter}
                  label="Type"
                  onChange={(e) => setExerciseTypeFilter(e.target.value)}
                >
                  {availableExerciseTypes.map(type => (
                    <MenuItem key={type} value={type}>
                      {type === 'all' ? 'All Types' : type}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Stack>

            {/* Active Filters Display */}
            {(searchTerm || bodyPartFilter !== 'all' || equipmentTypeFilter !== 'all' || exerciseTypeFilter !== 'all') && (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {searchTerm && (
                  <Chip
                    label={`Search: "${searchTerm}"`}
                    size="small"
                    onDelete={() => setSearchTerm('')}
                  />
                )}
                {bodyPartFilter !== 'all' && (
                  <Chip
                    label={`Body: ${bodyPartFilter}`}
                    size="small"
                    onDelete={() => setBodyPartFilter('all')}
                  />
                )}
                {equipmentTypeFilter !== 'all' && (
                  <Chip
                    label={`Equip: ${equipmentTypeFilter}`}
                    size="small"
                    onDelete={() => setEquipmentTypeFilter('all')}
                  />
                )}
                {exerciseTypeFilter !== 'all' && (
                  <Chip
                    label={`Type: ${exerciseTypeFilter}`}
                    size="small"
                    onDelete={() => setExerciseTypeFilter('all')}
                  />
                )}
              </Box>
            )}
          </Stack>
        </Paper>
      </Box>

      {/* Compact Exercise List */}
      <Box sx={{ maxWidth: 1200, width: '100%', margin: '0 auto' }}>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1, textAlign: 'center' }}>
          {filteredExercises.length} exercises available
        </Typography>

        <Stack spacing={1}>
          {filteredExercises.map((exercise) => {
            const selected = isExerciseSelected(exercise);
            const disabled = !canSelectMore && !selected;

            return (
              <Card 
                key={exercise['Exercise Name']}
                sx={{
                  border: '1px solid',
                  borderColor: selected ? 'primary.main' : 'divider',
                  bgcolor: selected ? 'rgba(19, 70, 134, 0.05)' : 'white',
                  cursor: disabled ? 'not-allowed' : 'pointer',
                  opacity: disabled ? 0.5 : 1,
                  transition: 'all 0.2s ease',
                  '&:hover': !disabled ? {
                    borderColor: 'primary.main',
                    transform: 'translateY(-1px)',
                    boxShadow: '0 2px 8px rgba(19, 70, 134, 0.12)',
                  } : {},
                }}
                onClick={() => !disabled && handleToggleExercise(exercise)}
              >
                <CardContent sx={{ p: { xs: 1, sm: 1.5 }, '&:last-child': { pb: { xs: 1, sm: 1.5 } } }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 1.5 } }}>
                    <Checkbox
                      checked={selected}
                      disabled={disabled}
                      size="small"
                      sx={{ p: 0 }}
                      onClick={(e) => e.stopPropagation()}
                      onChange={() => handleToggleExercise(exercise)}
                    />
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          fontWeight: 600,
                          mb: 0.5,
                          fontSize: { xs: '0.8rem', sm: '0.9rem' },
                          lineHeight: 1.3,
                        }}
                      >
                        {exercise['Exercise Name']}
                      </Typography>
                      <Box sx={{ 
                        display: 'flex', 
                        flexWrap: 'wrap', 
                        gap: 0.5,
                        alignItems: 'center'
                      }}>
                        <Chip 
                          label={exercise['Primary Muscle'].split('(')[0].trim()} 
                          size="small" 
                          sx={{ 
                            fontSize: { xs: '0.6rem', sm: '0.65rem' },
                            height: { xs: 18, sm: 20 },
                            bgcolor: 'primary.main',
                            color: 'white',
                            '& .MuiChip-label': { px: { xs: 0.5, sm: 0.75 }, py: 0 }
                          }}
                        />
                        <Chip 
                          label={exercise['Equipment']} 
                          size="small" 
                          variant="outlined"
                          sx={{ 
                            fontSize: { xs: '0.6rem', sm: '0.65rem' },
                            height: { xs: 18, sm: 20 },
                            '& .MuiChip-label': { px: { xs: 0.5, sm: 0.75 }, py: 0 }
                          }}
                        />
                        <Chip 
                          label={exercise['Exercise Type']} 
                          size="small" 
                          variant="outlined"
                          sx={{ 
                            fontSize: { xs: '0.6rem', sm: '0.65rem' },
                            height: { xs: 18, sm: 20 },
                            '& .MuiChip-label': { px: { xs: 0.5, sm: 0.75 }, py: 0 }
                          }}
                        />
                      </Box>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            );
          })}
        </Stack>

        {filteredExercises.length === 0 && (
          <Alert severity="warning" sx={{ mt: 2 }}>
            No exercises found for the selected filters. Please adjust your search or filters.
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
