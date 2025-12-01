import { useState, useEffect, useMemo, useCallback } from 'react';
import PropTypes from 'prop-types';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  IconButton,
  Button,
  Tabs,
  Tab,
  Typography,
  TextField,
  InputAdornment,
  Stack,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tooltip,
} from '@mui/material';
import {
  Close,
  Search,
  FitnessCenter,
  AutoAwesome,
  DragIndicator,
  SwapHoriz,
  LinkOff,
  Link as LinkIcon,
} from '@mui/icons-material';
import { Reorder, useDragControls } from 'framer-motion';
import { getExerciseWeight, getExerciseTargetReps } from '../../utils/storage';
import { generateStandardWorkout } from '../../utils/workoutGenerator';
import { getAllCategories, filterExercisesByCategory } from '../../utils/muscleCategories';
import TargetRepsPicker from '../Common/TargetRepsPicker';
import SwapExerciseDialog from '../Common/SwapExerciseDialog';
import { DEFAULT_TARGET_REPS, getClosestValidTargetReps } from '../../utils/repRangeWeightAdjustment';

/**
 * Superset color palette - cycling through distinct colors
 */
const SUPERSET_COLORS = [
  { main: '#4caf50', light: '#e8f5e9', dark: '#2e7d32' }, // Green
  { main: '#2196f3', light: '#e3f2fd', dark: '#1565c0' }, // Blue
  { main: '#ff9800', light: '#fff3e0', dark: '#ef6c00' }, // Orange
  { main: '#9c27b0', light: '#f3e5f5', dark: '#6a1b9a' }, // Purple
  { main: '#f44336', light: '#ffebee', dark: '#c62828' }, // Red
  { main: '#00bcd4', light: '#e0f7fa', dark: '#00838f' }, // Cyan
  { main: '#ffeb3b', light: '#fffde7', dark: '#f57f17' }, // Yellow
  { main: '#795548', light: '#efebe9', dark: '#4e342e' }, // Brown
];

/**
 * Get color for a superset group ID
 */
const getSupersetColor = (groupId) => {
  if (groupId === null || groupId === undefined) return null;
  return SUPERSET_COLORS[(groupId - 1) % SUPERSET_COLORS.length];
};

/**
 * CompactExerciseRow - Compact exercise row with drag handle, swap, and delete
 * Designed for maximum information density
 */
const CompactExerciseRow = ({ 
  exercise, 
  index,
  myWorkout,
  setMyWorkout,
  selectedExercises,
  setSelectedExercises,
  isSelected,
  onToggleSelect,
  onSwap,
  dragControls,
  isInSuperset,
}) => {
  const handleRemove = (e) => {
    e.stopPropagation();
    const newSelected = new Set(selectedExercises);
    newSelected.delete(exercise['Exercise Name']);
    setSelectedExercises(newSelected);
    setMyWorkout(myWorkout.filter(ex => 
      ex['Exercise Name'] !== exercise['Exercise Name']
    ));
  };

  const handleSetsChange = (e) => {
    e.stopPropagation();
    const newSets = parseInt(e.target.value);
    const updated = [...myWorkout];
    
    // Check if this exercise is in a superset group
    const supersetGroupId = exercise.supersetGroup;
    if (supersetGroupId !== null && supersetGroupId !== undefined) {
      // Update all exercises in the same superset group
      updated.forEach((ex, i) => {
        if (ex.supersetGroup === supersetGroupId) {
          updated[i].sets = newSets;
        }
      });
    } else {
      // Only update this exercise
      updated[index].sets = newSets;
    }
    
    setMyWorkout(updated);
  };

  const handleRepsChange = (newReps) => {
    const updated = [...myWorkout];
    updated[index].reps = newReps;
    setMyWorkout(updated);
  };

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        py: 1,
        px: 1.5,
        borderRadius: 1,
        backgroundColor: isSelected ? 'action.selected' : 'transparent',
        border: '1px solid',
        borderColor: isSelected ? 'primary.main' : 'divider',
        transition: 'all 0.15s ease',
        cursor: 'pointer',
        '&:hover': {
          backgroundColor: isSelected ? 'action.selected' : 'action.hover',
        },
      }}
      onClick={() => !isInSuperset && onToggleSelect(exercise['Exercise Name'])}
    >
      {/* Drag Handle */}
      <Box
        onPointerDown={(e) => {
          e.stopPropagation();
          dragControls.start(e);
        }}
        sx={{
          cursor: 'grab',
          display: 'flex',
          alignItems: 'center',
          color: 'text.secondary',
          touchAction: 'none',
          '&:active': { cursor: 'grabbing' },
        }}
      >
        <DragIndicator fontSize="small" />
      </Box>

      {/* Exercise Info - Compact */}
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography 
          variant="body2" 
          sx={{ 
            fontWeight: 600, 
            overflow: 'hidden', 
            textOverflow: 'ellipsis', 
            whiteSpace: 'nowrap' 
          }}
        >
          {exercise['Exercise Name']}
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
          {exercise['Primary Muscle']} • {exercise.Equipment}
        </Typography>
      </Box>

      {/* Sets & Reps Controls - Inline */}
      <Stack direction="row" spacing={0.5} alignItems="center" onClick={(e) => e.stopPropagation()}>
        <FormControl size="small" sx={{ width: 55 }}>
          <Select
            value={exercise.sets}
            onChange={handleSetsChange}
            size="small"
            sx={{ 
              fontSize: '0.75rem',
              '& .MuiSelect-select': { py: 0.5, px: 1 }
            }}
          >
            {[1, 2, 3, 4, 5].map(n => (
              <MenuItem key={n} value={n}>{n}s</MenuItem>
            ))}
          </Select>
        </FormControl>
        <TargetRepsPicker
          value={typeof exercise.reps === 'number' ? getClosestValidTargetReps(exercise.reps) : DEFAULT_TARGET_REPS}
          onChange={handleRepsChange}
          compact
          showLabel={false}
        />
      </Stack>

      {/* Action Buttons */}
      <Stack direction="row" spacing={0.5}>
        <Tooltip title="Swap exercise">
          <IconButton 
            size="small" 
            onClick={(e) => {
              e.stopPropagation();
              onSwap(exercise);
            }}
            sx={{ p: 0.5 }}
          >
            <SwapHoriz fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Remove">
          <IconButton 
            size="small" 
            onClick={handleRemove}
            sx={{ p: 0.5 }}
          >
            <Close fontSize="small" />
          </IconButton>
        </Tooltip>
      </Stack>
    </Box>
  );
};

CompactExerciseRow.propTypes = {
  exercise: PropTypes.object.isRequired,
  index: PropTypes.number.isRequired,
  myWorkout: PropTypes.array.isRequired,
  setMyWorkout: PropTypes.func.isRequired,
  selectedExercises: PropTypes.instanceOf(Set).isRequired,
  setSelectedExercises: PropTypes.func.isRequired,
  isSelected: PropTypes.bool.isRequired,
  onToggleSelect: PropTypes.func.isRequired,
  onSwap: PropTypes.func.isRequired,
  dragControls: PropTypes.object.isRequired,
  isInSuperset: PropTypes.bool.isRequired,
};

/**
 * DraggableExercise - Wrapper for Reorder.Item with drag controls
 */
const DraggableExercise = ({ 
  exercise, 
  index,
  myWorkout,
  setMyWorkout,
  selectedExercises,
  setSelectedExercises,
  selectedForSuperset,
  onToggleSelect,
  onSwap,
  isInSuperset,
}) => {
  const dragControls = useDragControls();
  
  return (
    <Reorder.Item
      value={exercise}
      id={exercise['Exercise Name']}
      dragListener={false}
      dragControls={dragControls}
      style={{ listStyle: 'none' }}
    >
      <CompactExerciseRow
        exercise={exercise}
        index={index}
        myWorkout={myWorkout}
        setMyWorkout={setMyWorkout}
        selectedExercises={selectedExercises}
        setSelectedExercises={setSelectedExercises}
        isSelected={selectedForSuperset.has(exercise['Exercise Name'])}
        onToggleSelect={onToggleSelect}
        onSwap={onSwap}
        dragControls={dragControls}
        isInSuperset={isInSuperset}
      />
    </Reorder.Item>
  );
};

DraggableExercise.propTypes = {
  exercise: PropTypes.object.isRequired,
  index: PropTypes.number.isRequired,
  myWorkout: PropTypes.array.isRequired,
  setMyWorkout: PropTypes.func.isRequired,
  selectedExercises: PropTypes.instanceOf(Set).isRequired,
  setSelectedExercises: PropTypes.func.isRequired,
  selectedForSuperset: PropTypes.instanceOf(Set).isRequired,
  onToggleSelect: PropTypes.func.isRequired,
  onSwap: PropTypes.func.isRequired,
  isInSuperset: PropTypes.bool.isRequired,
};

/**
 * SupersetGroup - Visual container for grouped exercises
 */
const SupersetGroup = ({
  groupId,
  exercises,
  exerciseIndices,
  myWorkout,
  setMyWorkout,
  selectedExercises,
  setSelectedExercises,
  onUngroup,
  onSwap,
}) => {
  const supersetColor = getSupersetColor(groupId);
  const dragControls = useDragControls();
  
  return (
    <Reorder.Item
      value={`superset-${groupId}`}
      id={`superset-${groupId}`}
      dragListener={false}
      dragControls={dragControls}
      style={{ listStyle: 'none' }}
    >
      <Box
        sx={{
          border: '2px solid',
          borderColor: supersetColor?.main,
          borderRadius: 2,
          backgroundColor: supersetColor?.light,
          overflow: 'hidden',
        }}
      >
        {/* Superset Header */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            px: 1.5,
            py: 0.75,
            backgroundColor: supersetColor?.main,
            color: 'white',
          }}
        >
          <Stack direction="row" alignItems="center" spacing={1}>
            <Box
              onPointerDown={(e) => {
                e.stopPropagation();
                dragControls.start(e);
              }}
              sx={{
                cursor: 'grab',
                display: 'flex',
                alignItems: 'center',
                touchAction: 'none',
                '&:active': { cursor: 'grabbing' },
              }}
            >
              <DragIndicator fontSize="small" />
            </Box>
            <LinkIcon fontSize="small" />
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              Superset {groupId}
            </Typography>
            <Chip
              label={`${exercises.length} exercises • ${exercises[0]?.sets || 3} sets`}
              size="small"
              sx={{
                backgroundColor: 'rgba(255,255,255,0.2)',
                color: 'white',
                fontSize: '0.7rem',
                height: 20,
              }}
            />
          </Stack>
          <Tooltip title="Ungroup superset">
            <IconButton
              size="small"
              onClick={() => onUngroup(groupId)}
              sx={{ 
                color: 'white',
                p: 0.5,
                '&:hover': { backgroundColor: 'rgba(255,255,255,0.2)' }
              }}
            >
              <LinkOff fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>

        {/* Superset Exercises */}
        <Stack spacing={0.5} sx={{ p: 1 }}>
          {exercises.map((exercise, idx) => {
            const originalIndex = exerciseIndices[idx];
            return (
              <Box
                key={exercise['Exercise Name']}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  py: 0.75,
                  px: 1,
                  borderRadius: 1,
                  backgroundColor: 'background.paper',
                }}
              >
                {/* Exercise Info */}
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      fontWeight: 600, 
                      overflow: 'hidden', 
                      textOverflow: 'ellipsis', 
                      whiteSpace: 'nowrap',
                      fontSize: '0.85rem',
                    }}
                  >
                    {exercise['Exercise Name']}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {exercise['Primary Muscle']}
                  </Typography>
                </Box>

                {/* Reps Control */}
                <Box onClick={(e) => e.stopPropagation()}>
                  <TargetRepsPicker
                    value={typeof exercise.reps === 'number' ? getClosestValidTargetReps(exercise.reps) : DEFAULT_TARGET_REPS}
                    onChange={(newReps) => {
                      const updated = [...myWorkout];
                      updated[originalIndex].reps = newReps;
                      setMyWorkout(updated);
                    }}
                    compact
                    showLabel={false}
                  />
                </Box>

                {/* Action Buttons */}
                <Stack direction="row" spacing={0.25}>
                  <Tooltip title="Swap exercise">
                    <IconButton 
                      size="small" 
                      onClick={(e) => {
                        e.stopPropagation();
                        onSwap(exercise);
                      }}
                      sx={{ p: 0.5 }}
                    >
                      <SwapHoriz fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Remove from workout">
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        const newSelected = new Set(selectedExercises);
                        newSelected.delete(exercise['Exercise Name']);
                        setSelectedExercises(newSelected);
                        setMyWorkout(myWorkout.filter(ex => 
                          ex['Exercise Name'] !== exercise['Exercise Name']
                        ));
                      }}
                      sx={{ p: 0.5 }}
                    >
                      <Close fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Stack>
              </Box>
            );
          })}
        </Stack>
      </Box>
    </Reorder.Item>
  );
};

SupersetGroup.propTypes = {
  groupId: PropTypes.number.isRequired,
  exercises: PropTypes.array.isRequired,
  exerciseIndices: PropTypes.array.isRequired,
  myWorkout: PropTypes.array.isRequired,
  setMyWorkout: PropTypes.func.isRequired,
  selectedExercises: PropTypes.instanceOf(Set).isRequired,
  setSelectedExercises: PropTypes.func.isRequired,
  onUngroup: PropTypes.func.isRequired,
  onSwap: PropTypes.func.isRequired,
};

/**
 * WorkoutCreationModal - Full-screen modal for creating workouts
 * Features:
 * - Slides up from bottom, covering header and bottom nav
 * - Two tabs: "Exercises" and "My Workout"
 * - Exercise selection with search/filter
 * - Workout configuration with drag-and-drop
 */
const WorkoutCreationModal = ({ 
  open, 
  onClose, 
  onSave,
  exercises = [],
  existingWorkout = null, // Add support for editing existing workout
}) => {
  const [currentTab, setCurrentTab] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterEquipment, setFilterEquipment] = useState('all');
  const [filterMuscleGroup, setFilterMuscleGroup] = useState('all');
  const [selectedExercises, setSelectedExercises] = useState(new Set());
  const [myWorkout, setMyWorkout] = useState([]);
  const [workoutName, setWorkoutName] = useState('');
  const [workoutType, setWorkoutType] = useState('full');
  const [selectedForSuperset, setSelectedForSuperset] = useState(new Set());
  const [currentSupersetNumber, setCurrentSupersetNumber] = useState(1);
  
  // Generate workout state
  const [generateDialogOpen, setGenerateDialogOpen] = useState(false);
  const [generateCountDialogOpen, setGenerateCountDialogOpen] = useState(false);
  const [exerciseCount, setExerciseCount] = useState(8);
  
  // Swap exercise dialog state
  const [swapDialogOpen, setSwapDialogOpen] = useState(false);
  const [exerciseToSwap, setExerciseToSwap] = useState(null);

  // Update currentSupersetNumber whenever myWorkout changes
  useEffect(() => {
    // Get the lowest available superset number (filling gaps)
    const getLowestAvailableSupersetNumber = () => {
      // Get all current superset IDs
      const supersetIds = myWorkout
        .filter(ex => ex.supersetGroup !== null && ex.supersetGroup !== undefined)
        .map(ex => ex.supersetGroup);
      
      if (supersetIds.length === 0) return 1;
      
      // Find the lowest available number (gaps or next number)
      const uniqueIds = [...new Set(supersetIds)].sort((a, b) => a - b);
      
      // Check for gaps in the sequence
      for (let i = 1; i <= uniqueIds[uniqueIds.length - 1]; i++) {
        if (!uniqueIds.includes(i)) {
          return i;
        }
      }
      
      // No gaps found, return next number
      return uniqueIds[uniqueIds.length - 1] + 1;
    };

    const lowestAvailable = getLowestAvailableSupersetNumber();
    setCurrentSupersetNumber(lowestAvailable);
  }, [myWorkout]);

  // Reset state when modal opens or when existingWorkout changes
  useEffect(() => {
    if (open) {
      if (existingWorkout) {
        // Load existing workout for editing
        setCurrentTab(1); // Start on "My Workout" tab
        setMyWorkout(existingWorkout.exercises || []);
        setWorkoutName(existingWorkout.name || '');
        setWorkoutType(existingWorkout.type || 'full');
        
        // Reset superset selection
        setSelectedForSuperset(new Set());
        
        // Set current superset number to the max + 1
        if (existingWorkout.exercises && existingWorkout.exercises.length > 0) {
          const supersetGroups = existingWorkout.exercises
            .filter(ex => ex.supersetGroup)
            .map(ex => ex.supersetGroup);
          const maxSuperset = supersetGroups.length > 0 
            ? Math.max(...supersetGroups)
            : 0;
          setCurrentSupersetNumber(maxSuperset + 1);
        }
      } else {
        // Creating new workout
        setCurrentTab(0);
        setMyWorkout([]);
        setWorkoutName('');
        setWorkoutType('full');
        setSelectedForSuperset(new Set());
        setCurrentSupersetNumber(1);
      }
      
      // Always reset these
      setSearchQuery('');
      setFilterEquipment('all');
      setFilterMuscleGroup('all');
      setSelectedExercises(new Set());
    }
  }, [open, existingWorkout]);

  // Filter exercises based on search and filters
  const filteredExercises = exercises.filter(exercise => {
    const matchesSearch = exercise['Exercise Name']
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    
    const matchesEquipment = filterEquipment === 'all' || 
      exercise.Equipment.toLowerCase().includes(filterEquipment.toLowerCase());
    
    return matchesSearch && matchesEquipment;
  });

  // Apply muscle group filter using simplified categories
  const categoryFilteredExercises = filterMuscleGroup === 'all' 
    ? filteredExercises 
    : filterExercisesByCategory(filteredExercises, filterMuscleGroup);

  // Get unique equipment types
  const equipmentTypes = ['all', ...new Set(exercises.map(e => e.Equipment))];
  
  // Get simplified muscle group categories
  const muscleGroups = ['all', ...getAllCategories().filter(cat => cat !== 'All')];

  // Handle exercise selection/deselection
  const handleExerciseToggle = async (exercise) => {
    const newSelected = new Set(selectedExercises);
    const exerciseName = exercise['Exercise Name'];
    
    if (newSelected.has(exerciseName)) {
      newSelected.delete(exerciseName);
      // Remove from myWorkout
      setMyWorkout(myWorkout.filter(e => e['Exercise Name'] !== exerciseName));
    } else {
      newSelected.add(exerciseName);
      
      // Load saved target weight and reps for this exercise
      const [savedWeight, savedReps] = await Promise.all([
        getExerciseWeight(exerciseName),
        getExerciseTargetReps(exerciseName)
      ]);
      
      // Add to myWorkout without superset group initially, using saved values if available
      setMyWorkout([...myWorkout, {
        ...exercise,
        sets: 3,
        reps: savedReps ? getClosestValidTargetReps(savedReps) : DEFAULT_TARGET_REPS, // Use valid target reps
        weight: savedWeight ?? 0, // Use saved weight or default to 0
        restTime: 60,
        supersetGroup: null, // No superset group initially
      }]);
    }
    
    setSelectedExercises(newSelected);
  };

  // Toggle selection for superset grouping
  const handleToggleSelectForSuperset = useCallback((exerciseName) => {
    const newSelected = new Set(selectedForSuperset);
    if (newSelected.has(exerciseName)) {
      newSelected.delete(exerciseName);
    } else {
      newSelected.add(exerciseName);
    }
    setSelectedForSuperset(newSelected);
  }, [selectedForSuperset]);

  // Ungroup a superset
  const handleUngroupSuperset = useCallback((groupId) => {
    const updated = myWorkout.map(exercise => {
      if (exercise.supersetGroup === groupId) {
        return { ...exercise, supersetGroup: null };
      }
      return exercise;
    });
    setMyWorkout(updated);
  }, [myWorkout]);

  // Create superset from selected exercises
  const handleCreateSuperset = useCallback(() => {
    if (selectedForSuperset.size < 2) return;

    // Find the greatest sets value among selected exercises
    const selectedSetsValues = myWorkout
      .filter(exercise => selectedForSuperset.has(exercise['Exercise Name']))
      .map(exercise => exercise.sets);
    const maxSets = Math.max(...selectedSetsValues);

    // Update selected exercises with the current superset number and max sets
    const updated = myWorkout.map(exercise => {
      if (selectedForSuperset.has(exercise['Exercise Name'])) {
        return { ...exercise, supersetGroup: currentSupersetNumber, sets: maxSets };
      }
      return exercise;
    });

    // Reorder exercises to group by superset
    const reordered = reorderBySupersets(updated);
    setMyWorkout(reordered);
    
    // Clear selection
    setSelectedForSuperset(new Set());
  }, [selectedForSuperset, myWorkout, currentSupersetNumber]);

  // Handle swap exercise
  const handleOpenSwapDialog = useCallback((exercise) => {
    setExerciseToSwap(exercise);
    setSwapDialogOpen(true);
  }, []);

  const handleSwapExercise = useCallback((newExercise) => {
    if (!exerciseToSwap) return;
    
    const updated = myWorkout.map(ex => {
      if (ex['Exercise Name'] === exerciseToSwap['Exercise Name']) {
        return {
          ...newExercise,
          sets: ex.sets,
          reps: ex.reps,
          weight: ex.weight || 0,
          restTime: ex.restTime || 60,
          supersetGroup: ex.supersetGroup,
        };
      }
      return ex;
    });
    
    // Update selected exercises set
    const newSelectedExercises = new Set(selectedExercises);
    newSelectedExercises.delete(exerciseToSwap['Exercise Name']);
    newSelectedExercises.add(newExercise['Exercise Name']);
    setSelectedExercises(newSelectedExercises);
    
    setMyWorkout(updated);
    setSwapDialogOpen(false);
    setExerciseToSwap(null);
  }, [exerciseToSwap, myWorkout, selectedExercises]);

  // Reorder exercises to group by superset
  const reorderBySupersets = (exercises) => {
    // Separate exercises into superset groups and non-superset exercises
    const supersetGroups = new Map();
    const nonSupersetExercises = [];

    exercises.forEach(exercise => {
      if (exercise.supersetGroup !== null && exercise.supersetGroup !== undefined) {
        if (!supersetGroups.has(exercise.supersetGroup)) {
          supersetGroups.set(exercise.supersetGroup, []);
        }
        supersetGroups.get(exercise.supersetGroup).push(exercise);
      } else {
        nonSupersetExercises.push(exercise);
      }
    });

    // Sort superset groups by their ID and flatten
    const sortedGroups = Array.from(supersetGroups.keys()).sort((a, b) => a - b);
    const reorderedExercises = [];

    sortedGroups.forEach(groupId => {
      reorderedExercises.push(...supersetGroups.get(groupId));
    });

    // Add non-superset exercises at the end
    reorderedExercises.push(...nonSupersetExercises);

    return reorderedExercises;
  };

  // Renumber supersets to reflect their order in the list
  const renumberSupersets = (exercises) => {
    const newSupersetMapping = new Map();
    let newSupersetId = 1;
    
    // First pass: identify unique superset groups in order
    exercises.forEach(exercise => {
      const oldSupersetId = exercise.supersetGroup;
      if (oldSupersetId !== null && oldSupersetId !== undefined) {
        if (!newSupersetMapping.has(oldSupersetId)) {
          newSupersetMapping.set(oldSupersetId, newSupersetId);
          newSupersetId++;
        }
      }
    });
    
    // Second pass: apply new superset IDs
    return exercises.map(exercise => {
      const oldSupersetId = exercise.supersetGroup;
      if (oldSupersetId !== null && oldSupersetId !== undefined) {
        return {
          ...exercise,
          supersetGroup: newSupersetMapping.get(oldSupersetId)
        };
      }
      return exercise;
    });
  };

  // Calculate superset configuration
  const calculateSupersetConfig = () => {
    const groups = new Map();
    
    // Group exercises by their supersetGroup ID
    myWorkout.forEach(exercise => {
      if (exercise.supersetGroup !== null && exercise.supersetGroup !== undefined) {
        if (!groups.has(exercise.supersetGroup)) {
          groups.set(exercise.supersetGroup, []);
        }
        groups.get(exercise.supersetGroup).push(exercise);
      }
    });
    
    // Build config based on groups
    const config = [];
    let processedExercises = new Set();
    
    myWorkout.forEach(exercise => {
      const exerciseName = exercise['Exercise Name'];
      if (processedExercises.has(exerciseName)) return;
      
      if (exercise.supersetGroup !== null && exercise.supersetGroup !== undefined) {
        const groupExercises = groups.get(exercise.supersetGroup);
        if (groupExercises && groupExercises.length > 0) {
          config.push(groupExercises.length);
          groupExercises.forEach(e => processedExercises.add(e['Exercise Name']));
        }
      } else {
        // Single exercise (not in a superset)
        config.push(1);
        processedExercises.add(exerciseName);
      }
    });
    
    return config.length > 0 ? config : [2, 2, 2, 2]; // Default config
  };

  // Handle save
  const handleSave = () => {
    const supersetConfig = calculateSupersetConfig();
    
    const workout = {
      name: workoutName || `${workoutType} Workout`,
      type: workoutType,
      exercises: myWorkout,
      supersetConfig: supersetConfig,
      createdAt: new Date().toISOString(),
    };
    
    onSave(workout);
    onClose();
  };

  // Handle Generate button click
  const handleGenerateClick = () => {
    if (myWorkout.length > 0) {
      // Show warning dialog if exercises already exist
      setGenerateDialogOpen(true);
    } else {
      // Show exercise count dialog
      setGenerateCountDialogOpen(true);
    }
  };

  // Handle generate confirmation (clear existing exercises)
  const handleGenerateConfirm = () => {
    setGenerateDialogOpen(false);
    setGenerateCountDialogOpen(true);
  };

  // Handle generate workout with selected count
  const handleGenerateWorkout = async () => {
    // Clear existing exercises
    setMyWorkout([]);
    setSelectedExercises(new Set());
    setSelectedForSuperset(new Set());
    setCurrentSupersetNumber(1);
    
    // Generate new workout
    const generatedExercises = generateStandardWorkout(
      exercises,
      workoutType,
      'all',
      'intermediate'
    );
    
    // Limit to the selected count
    const limitedExercises = generatedExercises.slice(0, exerciseCount);
    
    // Load saved weights and reps for each exercise
    const exercisesWithData = await Promise.all(
      limitedExercises.map(async (exercise) => {
        const [savedWeight, savedReps] = await Promise.all([
          getExerciseWeight(exercise['Exercise Name']),
          getExerciseTargetReps(exercise['Exercise Name'])
        ]);
        
        // Determine reps: use saved if available, then existing, then default
        const existingReps = savedReps ?? exercise.reps ?? DEFAULT_TARGET_REPS;
        
        return {
          ...exercise,
          sets: exercise.sets || 3,
          reps: getClosestValidTargetReps(existingReps),
          weight: savedWeight ?? (exercise.weight || 0),
          restTime: exercise.restTime || 60,
        };
      })
    );
    
    setMyWorkout(exercisesWithData);
    
    // Update selected exercises set
    const newSelected = new Set(exercisesWithData.map(e => e['Exercise Name']));
    setSelectedExercises(newSelected);
    
    // Switch to My Workout tab
    setCurrentTab(1);
    setGenerateCountDialogOpen(false);
  };

  // Build reorderable items (supersets as groups, standalone exercises as singles)
  const reorderableItems = useMemo(() => {
    const items = [];
    const processedExercises = new Set();

    myWorkout.forEach((exercise, index) => {
      const exerciseName = exercise['Exercise Name'];
      if (processedExercises.has(exerciseName)) return;

      if (exercise.supersetGroup !== null && exercise.supersetGroup !== undefined) {
        // Find all exercises in this superset
        const groupExercises = [];
        const groupIndices = [];
        myWorkout.forEach((ex, i) => {
          if (ex.supersetGroup === exercise.supersetGroup) {
            groupExercises.push(ex);
            groupIndices.push(i);
            processedExercises.add(ex['Exercise Name']);
          }
        });
        items.push({
          type: 'superset',
          id: `superset-${exercise.supersetGroup}`,
          groupId: exercise.supersetGroup,
          exercises: groupExercises,
          indices: groupIndices,
        });
      } else {
        items.push({
          type: 'exercise',
          id: exerciseName,
          exercise,
          index,
        });
        processedExercises.add(exerciseName);
      }
    });

    return items;
  }, [myWorkout]);

  // Handle reorder from drag-and-drop
  const handleReorder = useCallback((newItems) => {
    // Rebuild myWorkout from the reordered items
    const newWorkout = [];
    newItems.forEach(item => {
      if (item.type === 'superset') {
        newWorkout.push(...item.exercises);
      } else {
        newWorkout.push(item.exercise);
      }
    });
    setMyWorkout(renumberSupersets(newWorkout));
  }, []);

  return (
    <Dialog
      fullScreen
      open={open}
      onClose={onClose}
      sx={{
        '& .MuiDialog-paper': {
          margin: 0,
          maxHeight: '100vh',
        },
      }}
    >
      {/* Header */}
      <DialogTitle
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: 1,
          borderColor: 'divider',
          py: 1.5,
        }}
      >
        <Button onClick={onClose} color="inherit">
          Cancel
        </Button>
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          {existingWorkout ? 'Edit Workout' : 'Create Workout'}
        </Typography>
        <Button 
          onClick={handleSave} 
          variant="contained"
          disabled={myWorkout.length === 0}
        >
          Save
        </Button>
      </DialogTitle>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={currentTab} onChange={(e, v) => setCurrentTab(v)} variant="fullWidth">
          <Tab label="Exercises" />
          <Tab 
            label={`My Workout (${myWorkout.length})`}
            disabled={myWorkout.length === 0}
          />
        </Tabs>
      </Box>

      <DialogContent sx={{ p: 0, overflow: 'auto' }}>
        {/* Exercises Tab */}
        {currentTab === 0 && (
          <Box sx={{ p: 2, maxWidth: 600, mx: 'auto' }}>
            {/* Search and Filters - Compact */}
            <Stack spacing={1.5} sx={{ mb: 2 }}>
              <TextField
                size="small"
                fullWidth
                placeholder="Search exercises..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search fontSize="small" />
                    </InputAdornment>
                  ),
                }}
              />
              
              <Stack direction="row" spacing={1}>
                <FormControl size="small" sx={{ flex: 1 }}>
                  <InputLabel>Equipment</InputLabel>
                  <Select
                    value={filterEquipment}
                    label="Equipment"
                    onChange={(e) => setFilterEquipment(e.target.value)}
                  >
                    {equipmentTypes.map(eq => (
                      <MenuItem key={eq} value={eq}>
                        {eq === 'all' ? 'All' : eq}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <FormControl size="small" sx={{ flex: 1 }}>
                  <InputLabel>Muscle</InputLabel>
                  <Select
                    value={filterMuscleGroup}
                    label="Muscle"
                    onChange={(e) => setFilterMuscleGroup(e.target.value)}
                  >
                    {muscleGroups.map(muscle => (
                      <MenuItem key={muscle} value={muscle}>
                        {muscle === 'all' ? 'All' : muscle}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Stack>
            </Stack>

            {/* Exercise List - Compact */}
            <Stack spacing={0.75}>
              {categoryFilteredExercises.map((exercise) => {
                const exerciseName = exercise['Exercise Name'];
                const isSelected = selectedExercises.has(exerciseName);
                
                return (
                  <Box
                    key={exerciseName}
                    onClick={() => handleExerciseToggle(exercise)}
                    sx={{
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1.5,
                      py: 1,
                      px: 1.5,
                      borderRadius: 1,
                      border: '1px solid',
                      borderColor: isSelected ? 'success.main' : 'divider',
                      backgroundColor: isSelected ? 'success.light' : 'background.paper',
                      transition: 'all 0.15s ease',
                      '&:hover': {
                        borderColor: isSelected ? 'success.dark' : 'primary.light',
                        backgroundColor: isSelected ? 'success.light' : 'action.hover',
                      },
                    }}
                  >
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          fontWeight: 600, 
                          overflow: 'hidden', 
                          textOverflow: 'ellipsis', 
                          whiteSpace: 'nowrap' 
                        }}
                      >
                        {exerciseName}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {exercise['Primary Muscle']} • {exercise.Equipment}
                      </Typography>
                    </Box>
                    {isSelected && (
                      <Chip 
                        label="Added" 
                        size="small" 
                        color="success" 
                        sx={{ height: 20, fontSize: '0.7rem' }} 
                      />
                    )}
                  </Box>
                );
              })}
            </Stack>
          </Box>
        )}

        {/* My Workout Tab */}
        {currentTab === 1 && (
          <Box sx={{ 
            p: 2, 
            maxWidth: 600, 
            mx: 'auto', // Center on desktop
          }}>
            {/* Compact Workout Details - Side by Side */}
            <Stack direction="row" spacing={1.5} sx={{ mb: 2 }}>
              <TextField
                size="small"
                label="Name"
                value={workoutName}
                onChange={(e) => setWorkoutName(e.target.value)}
                placeholder="e.g., Upper Body"
                sx={{ flex: 2 }}
              />
              <FormControl size="small" sx={{ flex: 1, minWidth: 100 }}>
                <InputLabel>Type</InputLabel>
                <Select
                  value={workoutType}
                  label="Type"
                  onChange={(e) => setWorkoutType(e.target.value)}
                >
                  <MenuItem value="full">Full</MenuItem>
                  <MenuItem value="upper">Upper</MenuItem>
                  <MenuItem value="lower">Lower</MenuItem>
                  <MenuItem value="push">Push</MenuItem>
                  <MenuItem value="pull">Pull</MenuItem>
                  <MenuItem value="legs">Legs</MenuItem>
                  <MenuItem value="core">Core</MenuItem>
                </Select>
              </FormControl>
            </Stack>

            {/* Exercise List Header */}
            <Stack 
              direction="row" 
              justifyContent="space-between" 
              alignItems="center" 
              sx={{ mb: 1.5 }}
            >
              <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                {myWorkout.length} exercise{myWorkout.length !== 1 ? 's' : ''}
                {selectedForSuperset.size > 0 && (
                  <Chip 
                    label={`${selectedForSuperset.size} selected`}
                    size="small"
                    color="primary"
                    sx={{ ml: 1, height: 20, fontSize: '0.7rem' }}
                  />
                )}
              </Typography>
              <Stack direction="row" spacing={0.5}>
                {selectedForSuperset.size >= 2 && (
                  <Button
                    variant="contained"
                    size="small"
                    startIcon={<LinkIcon />}
                    onClick={handleCreateSuperset}
                    sx={{ fontSize: '0.75rem', py: 0.5 }}
                  >
                    Group ({selectedForSuperset.size})
                  </Button>
                )}
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<AutoAwesome />}
                  onClick={handleGenerateClick}
                  sx={{ fontSize: '0.75rem', py: 0.5 }}
                >
                  Generate
                </Button>
              </Stack>
            </Stack>
            
            {myWorkout.length > 0 ? (
              <Reorder.Group 
                axis="y" 
                values={reorderableItems} 
                onReorder={handleReorder}
                style={{ listStyle: 'none', padding: 0, margin: 0 }}
              >
                <Stack spacing={1}>
                  {reorderableItems.map((item) => {
                    if (item.type === 'superset') {
                      return (
                        <SupersetGroup
                          key={item.id}
                          groupId={item.groupId}
                          exercises={item.exercises}
                          exerciseIndices={item.indices}
                          myWorkout={myWorkout}
                          setMyWorkout={setMyWorkout}
                          selectedExercises={selectedExercises}
                          setSelectedExercises={setSelectedExercises}
                          onUngroup={handleUngroupSuperset}
                          onSwap={handleOpenSwapDialog}
                        />
                      );
                    } else {
                      return (
                        <DraggableExercise
                          key={item.id}
                          exercise={item.exercise}
                          index={item.index}
                          myWorkout={myWorkout}
                          setMyWorkout={setMyWorkout}
                          selectedExercises={selectedExercises}
                          setSelectedExercises={setSelectedExercises}
                          selectedForSuperset={selectedForSuperset}
                          onToggleSelect={handleToggleSelectForSuperset}
                          onSwap={handleOpenSwapDialog}
                          isInSuperset={false}
                        />
                      );
                    }
                  })}
                </Stack>
              </Reorder.Group>
            ) : (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <FitnessCenter sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
                <Typography variant="body2" color="text.secondary">
                  No exercises yet. Go to Exercises tab to add some.
                </Typography>
              </Box>
            )}
          </Box>
        )}
      </DialogContent>

      {/* Swap Exercise Dialog */}
      <SwapExerciseDialog
        open={swapDialogOpen}
        onClose={() => {
          setSwapDialogOpen(false);
          setExerciseToSwap(null);
        }}
        currentExercise={exerciseToSwap}
        onSwap={handleSwapExercise}
      />

      {/* Warning Dialog - Clear Existing Exercises */}
      <Dialog
        open={generateDialogOpen}
        onClose={() => setGenerateDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Clear Existing Exercises?</DialogTitle>
        <DialogContent>
          <Typography variant="body1">
            Generating a new workout will clear all existing exercises in &quot;My Workout&quot;. 
            Do you want to proceed?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setGenerateDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleGenerateConfirm} variant="contained" color="warning">
            Clear and Continue
          </Button>
        </DialogActions>
      </Dialog>

      {/* Exercise Count Selection Dialog */}
      <Dialog
        open={generateCountDialogOpen}
        onClose={() => setGenerateCountDialogOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Generate Workout</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            How many exercises would you like in your workout?
          </Typography>
          <FormControl fullWidth>
            <InputLabel>Number of Exercises</InputLabel>
            <Select
              value={exerciseCount}
              label="Number of Exercises"
              onChange={(e) => setExerciseCount(e.target.value)}
            >
              <MenuItem value={4}>4 exercises</MenuItem>
              <MenuItem value={6}>6 exercises</MenuItem>
              <MenuItem value={8}>8 exercises</MenuItem>
              <MenuItem value={10}>10 exercises</MenuItem>
              <MenuItem value={12}>12 exercises</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setGenerateCountDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleGenerateWorkout} variant="contained">
            Generate
          </Button>
        </DialogActions>
      </Dialog>
    </Dialog>
  );
};

WorkoutCreationModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
  exercises: PropTypes.array,
  existingWorkout: PropTypes.object,
};

export default WorkoutCreationModal;
