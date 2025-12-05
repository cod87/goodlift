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
  List,
  Card,
  CardContent,
  Stack,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  Tooltip,
} from '@mui/material';
import {
  Close,
  Search,
  FitnessCenter,
  AutoAwesome,
  ArrowUpward,
  ArrowDownward,
  FilterList,
} from '@mui/icons-material';
import { getExerciseWeight, getExerciseTargetReps } from '../../utils/storage';
import { generateStandardWorkout } from '../../utils/workoutGenerator';
import { getAllCategories, filterExercisesByCategory } from '../../utils/muscleCategories';
import TargetRepsPicker from '../Common/TargetRepsPicker';
import ExerciseListItem from '../Common/ExerciseListItem';
import FilterBottomSheet from '../Common/FilterBottomSheet';
import { DEFAULT_TARGET_REPS, getClosestValidTargetReps } from '../../utils/repRangeWeightAdjustment';
import { getSupersetColor } from '../../utils/supersetColors';

/**
 * Superset color palette - using shared superset colors
 */
const SUPERSET_COLORS = [
  { main: '#1db584', light: '#e8f5e9', dark: '#2e7d32' }, // Primary green
  { main: '#4299e1', light: '#e3f2fd', dark: '#1565c0' }, // Blue
  { main: '#ed64a6', light: '#fce4ec', dark: '#c62828' }, // Pink
  { main: '#f6ad55', light: '#fff3e0', dark: '#ef6c00' }, // Orange
  { main: '#9f7aea', light: '#f3e5f5', dark: '#6a1b9a' }, // Purple
  { main: '#48bb78', light: '#e0f7fa', dark: '#00838f' }, // Green
  { main: '#fc8181', light: '#ffebee', dark: '#c62828' }, // Red
  { main: '#63b3ed', light: '#e3f2fd', dark: '#1565c0' }, // Light blue
];

/**
 * Get color for a superset group ID (with light variant for backgrounds)
 */
const getSupersetColorWithLight = (groupId) => {
  if (groupId === null || groupId === undefined) return null;
  return SUPERSET_COLORS[(groupId - 1) % SUPERSET_COLORS.length];
};

/**
 * ExerciseItem - Exercise item in My Workout with arrow controls
 */
const ExerciseItem = ({ 
  exercise, 
  index, 
  myWorkout, 
  setMyWorkout, 
  selectedExercises, 
  setSelectedExercises,
  highlightedExercises,
  onToggleHighlight,
  currentSupersetNumber,
  onDeselectFromSuperset,
  onMoveUp,
  onMoveDown,
  canMoveUp,
  canMoveDown,
  isFirstInGroup,
}) => {
  // Check if this exercise is in a superset group
  const supersetGroupId = exercise.supersetGroup;
  const isInSuperset = supersetGroupId !== null && supersetGroupId !== undefined;
  const supersetColor = getSupersetColorWithLight(supersetGroupId);

  // Check if this exercise is highlighted
  const isHighlighted = highlightedExercises.has(exercise['Exercise Name']);
  const highlightColor = getSupersetColorWithLight(currentSupersetNumber);

  // Handle clicking on the card to highlight
  const handleCardClick = (e) => {
    // Don't trigger if clicking on input fields or buttons
    const target = e.target;
    const isInput = target.tagName === 'INPUT' || target.closest('input');
    const isButton = target.tagName === 'BUTTON' || target.closest('button');
    
    if (!isInput && !isButton) {
      onToggleHighlight(exercise['Exercise Name']);
    }
  };

  return (
    <Card
      onClick={handleCardClick}
      sx={{
        position: 'relative',
        cursor: 'pointer',
        border: '1px solid',
        borderColor: 'divider',
        borderLeft: '4px solid',
        borderLeftColor: isInSuperset 
          ? supersetColor?.main 
          : (isHighlighted ? highlightColor?.main : 'divider'),
        backgroundColor: isInSuperset 
          ? supersetColor?.light 
          : (isHighlighted ? highlightColor?.light : 'background.paper'),
        transition: 'background-color 0.2s ease, border-color 0.2s ease, opacity 0.15s ease, margin-left 0.3s ease, padding-left 0.3s ease',
        marginLeft: isHighlighted ? 3 : 0,
        paddingLeft: isHighlighted ? 1 : 0,
        '&:hover': {
          opacity: 0.9,
        },
        '&:active': {
          opacity: 0.8,
        },
      }}
    >
      <CardContent sx={{ pb: 2 }}>
        <Stack direction="row" alignItems="center" spacing={2}>
          {/* Arrow buttons - only show for the first exercise in a group or standalone exercises */}
          {isFirstInGroup && (
            <Stack direction="column" spacing={0.5}>
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  onMoveUp();
                }}
                disabled={!canMoveUp}
                sx={{ 
                  padding: 0.5,
                  '&:disabled': { opacity: 0.3 }
                }}
              >
                <ArrowUpward fontSize="small" />
              </IconButton>
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  onMoveDown();
                }}
                disabled={!canMoveDown}
                sx={{ 
                  padding: 0.5,
                  '&:disabled': { opacity: 0.3 }
                }}
              >
                <ArrowDownward fontSize="small" />
              </IconButton>
            </Stack>
          )}
          <Box sx={{ flex: 1 }}>
            <Stack direction="row" alignItems="center" spacing={1}>
              <Typography variant="body1" sx={{ fontWeight: 600 }}>
                {exercise['Exercise Name']}
              </Typography>
              {isInSuperset && (
                <Chip
                  label={`Set ${supersetGroupId}`}
                  size="small"
                  onDelete={(e) => {
                    e.stopPropagation();
                    onDeselectFromSuperset(exercise['Exercise Name']);
                  }}
                  sx={{
                    backgroundColor: supersetColor?.main,
                    color: 'white',
                    fontWeight: 'bold',
                    '& .MuiChip-deleteIcon': {
                      color: 'white',
                      '&:hover': {
                        color: 'rgba(255, 255, 255, 0.7)',
                      },
                    },
                  }}
                />
              )}
            </Stack>
            <Typography variant="caption" color="text.secondary">
              {exercise['Primary Muscle']} • {exercise.Equipment}
            </Typography>
          </Box>
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
          >
            <Close />
          </IconButton>
        </Stack>
        
        {/* Exercise Configuration */}
        <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
          <FormControl size="small" sx={{ width: 80 }}>
            <InputLabel>Sets</InputLabel>
            <Select
              label="Sets"
              value={exercise.sets}
              onChange={(e) => {
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
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <MenuItem value={1}>1</MenuItem>
              <MenuItem value={2}>2</MenuItem>
              <MenuItem value={3}>3</MenuItem>
              <MenuItem value={4}>4</MenuItem>
            </Select>
          </FormControl>
          <TargetRepsPicker
            value={typeof exercise.reps === 'number' ? getClosestValidTargetReps(exercise.reps) : DEFAULT_TARGET_REPS}
            onChange={(newReps) => {
              const updated = [...myWorkout];
              updated[index].reps = newReps;
              setMyWorkout(updated);
            }}
            compact
            showLabel
            label="Reps"
          />
        </Stack>
      </CardContent>
    </Card>
  );
};

ExerciseItem.propTypes = {
  exercise: PropTypes.object.isRequired,
  index: PropTypes.number.isRequired,
  myWorkout: PropTypes.array.isRequired,
  setMyWorkout: PropTypes.func.isRequired,
  selectedExercises: PropTypes.instanceOf(Set).isRequired,
  setSelectedExercises: PropTypes.func.isRequired,
  highlightedExercises: PropTypes.instanceOf(Set).isRequired,
  onToggleHighlight: PropTypes.func.isRequired,
  currentSupersetNumber: PropTypes.number.isRequired,
  onDeselectFromSuperset: PropTypes.func.isRequired,
  onMoveUp: PropTypes.func.isRequired,
  onMoveDown: PropTypes.func.isRequired,
  canMoveUp: PropTypes.bool.isRequired,
  canMoveDown: PropTypes.bool.isRequired,
  isFirstInGroup: PropTypes.bool.isRequired,
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
  const [highlightedExercises, setHighlightedExercises] = useState(new Set());
  const [currentSupersetNumber, setCurrentSupersetNumber] = useState(1);
  
  // Generate workout state
  const [generateDialogOpen, setGenerateDialogOpen] = useState(false);
  const [generateCountDialogOpen, setGenerateCountDialogOpen] = useState(false);
  const [exerciseCount, setExerciseCount] = useState(8);
  
  // Filter modal states
  const [equipmentFilterOpen, setEquipmentFilterOpen] = useState(false);
  const [muscleFilterOpen, setMuscleFilterOpen] = useState(false);

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
        
        // Calculate highlighted exercises based on superset grouping
        if (existingWorkout.exercises && existingWorkout.exercises.length > 0) {
          const highlighted = new Set();
          existingWorkout.exercises.forEach(exercise => {
            if (exercise.supersetGroup) {
              highlighted.add(exercise.id || exercise['Exercise Name']);
            }
          });
          setHighlightedExercises(highlighted);
          
          // Set current superset number to the max + 1
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
        setHighlightedExercises(new Set());
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

  // Toggle highlight for an exercise
  const handleToggleHighlight = useCallback((exerciseName) => {
    const newHighlighted = new Set(highlightedExercises);
    if (newHighlighted.has(exerciseName)) {
      newHighlighted.delete(exerciseName);
    } else {
      newHighlighted.add(exerciseName);
    }
    setHighlightedExercises(newHighlighted);
  }, [highlightedExercises]);

  // Deselect exercise from superset (remove superset group)
  const handleDeselectFromSuperset = useCallback((exerciseName) => {
    const updated = myWorkout.map(exercise => {
      if (exercise['Exercise Name'] === exerciseName) {
        return { ...exercise, supersetGroup: null };
      }
      return exercise;
    });
    setMyWorkout(updated);
  }, [myWorkout]);

  // Lock in superset - assign highlighted exercises to current superset group
  const handleLockInSuperset = () => {
    if (highlightedExercises.size === 0) return;

    // Find the greatest sets value among highlighted exercises
    const highlightedSetsValues = myWorkout
      .filter(exercise => highlightedExercises.has(exercise['Exercise Name']))
      .map(exercise => exercise.sets);
    const maxSets = Math.max(...highlightedSetsValues);

    // Update all highlighted exercises with the current superset number and max sets value
    const updated = myWorkout.map(exercise => {
      if (highlightedExercises.has(exercise['Exercise Name'])) {
        return { ...exercise, supersetGroup: currentSupersetNumber, sets: maxSets };
      }
      return exercise;
    });

    // Reorder exercises to group by superset
    const reordered = reorderBySupersets(updated);
    setMyWorkout(reordered);
    
    // Clear highlights (superset number will be auto-updated by useEffect)
    setHighlightedExercises(new Set());
  };

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

  // Get groups from exercises (a group can be a superset or a single exercise)
  const getExerciseGroups = (exercises) => {
    const groups = [];
    const processedExercises = new Set();

    exercises.forEach((exercise) => {
      const exerciseName = exercise['Exercise Name'];
      if (processedExercises.has(exerciseName)) return;

      if (exercise.supersetGroup !== null && exercise.supersetGroup !== undefined) {
        // Find all exercises in this superset group
        const groupExercises = exercises.filter(
          ex => ex.supersetGroup === exercise.supersetGroup
        );
        groups.push(groupExercises);
        groupExercises.forEach(ex => processedExercises.add(ex['Exercise Name']));
      } else {
        // Single exercise (not in a superset)
        groups.push([exercise]);
        processedExercises.add(exerciseName);
      }
    });

    return groups;
  };

  // Get the group index for an exercise at a given index
  const getGroupIndexForExercise = (exerciseIndex, groups) => {
    let currentIndex = 0;
    for (let groupIndex = 0; groupIndex < groups.length; groupIndex++) {
      for (let i = 0; i < groups[groupIndex].length; i++) {
        if (currentIndex === exerciseIndex) {
          return groupIndex;
        }
        currentIndex++;
      }
    }
    return -1;
  };

  // Move a group (superset or single exercise) up
  const moveGroupUp = useCallback((exerciseIndex) => {
    const groups = getExerciseGroups(myWorkout);
    const currentGroupIndex = getGroupIndexForExercise(exerciseIndex, groups);

    if (currentGroupIndex <= 0) return; // Can't move up if it's the first group

    // Swap with the previous group
    const newGroups = [...groups];
    [newGroups[currentGroupIndex - 1], newGroups[currentGroupIndex]] = 
      [newGroups[currentGroupIndex], newGroups[currentGroupIndex - 1]];

    // Flatten back to exercises array
    const newExercises = newGroups.flat();
    
    // Renumber supersets based on their new order
    setMyWorkout(renumberSupersets(newExercises));
  }, [myWorkout]);

  // Move a group (superset or single exercise) down
  const moveGroupDown = useCallback((exerciseIndex) => {
    const groups = getExerciseGroups(myWorkout);
    const currentGroupIndex = getGroupIndexForExercise(exerciseIndex, groups);

    if (currentGroupIndex < 0 || currentGroupIndex >= groups.length - 1) return; // Can't move down if it's the last group

    // Swap with the next group
    const newGroups = [...groups];
    [newGroups[currentGroupIndex], newGroups[currentGroupIndex + 1]] = 
      [newGroups[currentGroupIndex + 1], newGroups[currentGroupIndex]];

    // Flatten back to exercises array
    const newExercises = newGroups.flat();
    
    // Renumber supersets based on their new order
    setMyWorkout(renumberSupersets(newExercises));
  }, [myWorkout]);

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
    setHighlightedExercises(new Set());
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

  // Memoize the rendered exercise items for better performance
  const renderedExercises = useMemo(() => {
    const groups = getExerciseGroups(myWorkout);
    let exerciseIndex = 0;
    
    return groups.flatMap((group, groupIndex) => 
      group.map((exercise, indexInGroup) => {
        const currentExerciseIndex = exerciseIndex++;
        const isFirstInGroup = indexInGroup === 0;
        const canMoveUp = groupIndex > 0;
        const canMoveDown = groupIndex < groups.length - 1;
        
        return (
          <ExerciseItem
            key={exercise['Exercise Name']}
            exercise={exercise}
            index={currentExerciseIndex}
            myWorkout={myWorkout}
            setMyWorkout={setMyWorkout}
            selectedExercises={selectedExercises}
            setSelectedExercises={setSelectedExercises}
            highlightedExercises={highlightedExercises}
            onToggleHighlight={handleToggleHighlight}
            currentSupersetNumber={currentSupersetNumber}
            onDeselectFromSuperset={handleDeselectFromSuperset}
            onMoveUp={() => moveGroupUp(currentExerciseIndex)}
            onMoveDown={() => moveGroupDown(currentExerciseIndex)}
            canMoveUp={canMoveUp}
            canMoveDown={canMoveDown}
            isFirstInGroup={isFirstInGroup}
          />
        );
      })
    );
  }, [myWorkout, selectedExercises, highlightedExercises, currentSupersetNumber, handleToggleHighlight, handleDeselectFromSuperset, moveGroupUp, moveGroupDown]);

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
          <Box sx={{ p: 2 }}>
            {/* Search and Filters */}
            <Stack spacing={1.5} sx={{ mb: 2 }}>
              <TextField
                fullWidth
                size="small"
                placeholder="Search exercises..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search color="action" />
                    </InputAdornment>
                  ),
                  endAdornment: searchQuery && (
                    <InputAdornment position="end">
                      <IconButton size="small" onClick={() => setSearchQuery('')}>
                        <Close fontSize="small" />
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    bgcolor: 'background.default',
                  },
                }}
              />
              
              {/* Filter Chips - tap to open bottom sheet modals */}
              <Stack direction="row" spacing={1}>
                <Chip
                  icon={<FitnessCenter fontSize="small" />}
                  label={filterEquipment === 'all' ? 'Equipment' : filterEquipment}
                  onClick={() => setEquipmentFilterOpen(true)}
                  variant={filterEquipment === 'all' ? 'outlined' : 'filled'}
                  color={filterEquipment === 'all' ? 'default' : 'primary'}
                  sx={{ flex: 1, justifyContent: 'flex-start' }}
                />
                <Chip
                  icon={<FilterList fontSize="small" />}
                  label={filterMuscleGroup === 'all' ? 'Muscle' : filterMuscleGroup}
                  onClick={() => setMuscleFilterOpen(true)}
                  variant={filterMuscleGroup === 'all' ? 'outlined' : 'filled'}
                  color={filterMuscleGroup === 'all' ? 'default' : 'primary'}
                  sx={{ flex: 1, justifyContent: 'flex-start' }}
                />
                {(filterEquipment !== 'all' || filterMuscleGroup !== 'all') && (
                  <IconButton 
                    size="small" 
                    onClick={() => {
                      setFilterEquipment('all');
                      setFilterMuscleGroup('all');
                    }}
                  >
                    <Close fontSize="small" />
                  </IconButton>
                )}
              </Stack>
              
              {/* Results count */}
              <Typography variant="body2" color="text.secondary">
                {categoryFilteredExercises.length} exercise{categoryFilteredExercises.length !== 1 ? 's' : ''} found
              </Typography>
            </Stack>

            {/* Exercise List - using ExerciseListItem for minimalist design */}
            <List disablePadding>
              {categoryFilteredExercises.map((exercise) => {
                const exerciseName = exercise['Exercise Name'];
                const isSelected = selectedExercises.has(exerciseName);
                
                return (
                  <ExerciseListItem
                    key={exerciseName}
                    exercise={exercise}
                    selected={isSelected}
                    onClick={() => handleExerciseToggle(exercise)}
                  />
                );
              })}
            </List>
          </Box>
        )}

        {/* My Workout Tab */}
        {currentTab === 1 && (
          <Box sx={{ p: 2 }}>
            {/* Workout Details */}
            <Stack spacing={2} sx={{ mb: 3 }}>
              <TextField
                fullWidth
                label="Workout Name"
                value={workoutName}
                onChange={(e) => setWorkoutName(e.target.value)}
                placeholder="e.g., Upper Body Power"
              />
              
              <FormControl fullWidth>
                <InputLabel>Workout Type</InputLabel>
                <Select
                  value={workoutType}
                  label="Workout Type"
                  onChange={(e) => setWorkoutType(e.target.value)}
                >
                  <MenuItem value="full">Full Body</MenuItem>
                  <MenuItem value="upper">Upper Body</MenuItem>
                  <MenuItem value="lower">Lower Body</MenuItem>
                  <MenuItem value="push">Push</MenuItem>
                  <MenuItem value="pull">Pull</MenuItem>
                  <MenuItem value="legs">Legs</MenuItem>
                  <MenuItem value="core">Core</MenuItem>
                </Select>
              </FormControl>
            </Stack>

            <Divider sx={{ my: 2 }} />

            {/* Exercise List with Arrow Controls */}
            <Box sx={{ mb: 2 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Exercises ({myWorkout.length})
                </Typography>
                <Stack direction="row" spacing={1}>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<AutoAwesome />}
                    onClick={handleGenerateClick}
                  >
                    Generate
                  </Button>
                </Stack>
              </Stack>
            </Box>
            
            {myWorkout.length > 0 ? (
              <Stack spacing={2}>
                {renderedExercises}
              </Stack>
            ) : (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <FitnessCenter sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                <Typography variant="body1" color="text.secondary">
                  No exercises added yet. Switch to the "Exercises" tab to add some.
                </Typography>
              </Box>
            )}
            
            {/* Sticky Floating Superset Button - show when has highlighted exercises */}
            {highlightedExercises.size > 0 && (
              <Tooltip title={`Create Superset ${currentSupersetNumber}`} placement="left">
                <Box
                  onClick={handleLockInSuperset}
                  sx={{
                    position: 'fixed',
                    bottom: 24,
                    right: 24,
                    width: 64,
                    height: 64,
                    borderRadius: '50%',
                    backgroundColor: getSupersetColorWithLight(currentSupersetNumber)?.main,
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 'bold',
                    fontSize: '1.5rem',
                    cursor: 'pointer',
                    boxShadow: 6,
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    zIndex: 1000,
                    '&:hover': {
                      transform: 'scale(1.1)',
                      boxShadow: 12,
                    },
                    '&:active': {
                      transform: 'scale(0.95)',
                    },
                  }}
                >
                  {currentSupersetNumber}
                </Box>
              </Tooltip>
            )}
          </Box>
        )}
      </DialogContent>

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

      {/* Equipment Filter Bottom Sheet Modal */}
      <FilterBottomSheet
        open={equipmentFilterOpen}
        onClose={() => setEquipmentFilterOpen(false)}
        title="Select Equipment"
        options={equipmentTypes.map(eq => ({
          value: eq,
          label: eq === 'all' ? 'All Equipment' : eq,
        }))}
        selectedValue={filterEquipment}
        onSelect={setFilterEquipment}
      />

      {/* Muscle Group Filter Bottom Sheet Modal */}
      <FilterBottomSheet
        open={muscleFilterOpen}
        onClose={() => setMuscleFilterOpen(false)}
        title="Select Muscle Group"
        options={muscleGroups.map(muscle => ({
          value: muscle,
          label: muscle === 'all' ? 'All Muscles' : muscle,
        }))}
        selectedValue={filterMuscleGroup}
        onSelect={setFilterMuscleGroup}
      />
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
