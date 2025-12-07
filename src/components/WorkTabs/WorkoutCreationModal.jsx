import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
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
  ListItemButton,
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
  FilterList,
  MoreVert,
  Add,
  ClearAll,
} from '@mui/icons-material';
import { getExerciseWeight, getExerciseTargetReps } from '../../utils/storage';
import { generateStandardWorkout } from '../../utils/workoutGenerator';
import { getAllCategories, filterExercisesByCategory } from '../../utils/muscleCategories';
import TargetRepsPicker from '../Common/TargetRepsPicker';
import ExerciseListItem from '../Common/ExerciseListItem';
import FilterBottomSheet from '../Common/FilterBottomSheet';
import ExerciseOptionsMenu from '../Common/ExerciseOptionsMenu';
import SupersetManagementModal from '../Common/SupersetManagementModal';
import { DEFAULT_TARGET_REPS, getClosestValidTargetReps } from '../../utils/repRangeWeightAdjustment';

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
 * MyWorkoutExerciseItem - Exercise item in My Workout tab
 * 
 * Matches the style of ExerciseListItem from Exercises tab:
 * - Mini demo image on the left
 * - Exercise name (larger text)
 * - Primary muscle below in smaller text
 * - Color-coded left bar for superset grouping
 * - Three-dot menu for actions (reorder, replace, superset, remove)
 */
const MyWorkoutExerciseItem = ({ 
  exercise, 
  index, 
  onOpenOptionsMenu,
  onUpdateReps,
  onUpdateSets,
  isHighlighted = false,
  onToggleHighlight,
  currentSupersetColor = null,
}) => {
  const [imageError, setImageError] = useState(false);
  
  const exerciseName = exercise?.['Exercise Name'] || exercise?.name || 'Unknown Exercise';
  const primaryMuscle = exercise?.['Primary Muscle'] || '';
  const webpFile = exercise?.['Webp File'];
  const equipment = exercise?.['Equipment'] || '';
  
  // Construct image path
  const baseUrl = import.meta.env.BASE_URL || '/';
  const imagePath = webpFile 
    ? `${baseUrl}demos/${webpFile}`
    : `${baseUrl}work-icon.svg`;

  // Check if this exercise is in a superset group
  const supersetGroupId = exercise.supersetGroup;
  const isInSuperset = supersetGroupId !== null && supersetGroupId !== undefined;
  const supersetColor = getSupersetColorWithLight(supersetGroupId);

  // Handle click on three-dot menu
  const handleMenuClick = (e) => {
    e.stopPropagation();
    onOpenOptionsMenu(index, exercise);
  };

  // Handle tap on exercise to toggle highlight for superset selection
  const handleExerciseClick = () => {
    if (onToggleHighlight) {
      onToggleHighlight(exerciseName, supersetGroupId);
    }
  };

  // Determine the left border color: highlighted uses current superset color, then superset color if in superset, then default
  const getLeftBorderColor = () => {
    if (isHighlighted && currentSupersetColor) return currentSupersetColor.main;
    if (isInSuperset) return supersetColor?.main;
    return 'divider';
  };

  return (
    <Box
      onClick={handleExerciseClick}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        bgcolor: isHighlighted ? 'action.selected' : 'background.paper',
        borderRadius: 1,
        border: '1px solid',
        borderColor: isHighlighted && currentSupersetColor ? currentSupersetColor.main : isHighlighted ? 'primary.main' : 'divider',
        borderLeft: '4px solid',
        borderLeftColor: getLeftBorderColor(),
        overflow: 'hidden',
        transition: 'all 0.2s ease',
        mb: 1,
        cursor: 'pointer',
        '&:hover': {
          bgcolor: isHighlighted ? 'action.selected' : 'action.hover',
        },
      }}
    >
      {/* Main row - exercise info + menu */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          py: 1.5,
          px: 1.5,
        }}
      >
        {/* Demo Image - transparent background */}
        <Box
          sx={{
            width: 56,
            height: 56,
            flexShrink: 0,
            borderRadius: 1,
            overflow: 'hidden',
            bgcolor: 'transparent',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Box
            component="img"
            src={imageError ? `${baseUrl}work-icon.svg` : imagePath}
            alt={exerciseName}
            onError={() => setImageError(true)}
            sx={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
            }}
            loading="lazy"
          />
        </Box>
        
        {/* Exercise Info */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <Typography
              variant="body1"
              sx={{
                fontWeight: 600,
                fontSize: '1rem',
                lineHeight: 1.3,
                color: 'text.primary',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {exerciseName}
            </Typography>
            {isInSuperset && (
              <Chip
                label={`Set ${supersetGroupId}`}
                size="small"
                sx={{
                  height: 20,
                  fontSize: '0.7rem',
                  backgroundColor: supersetColor?.main,
                  color: 'white',
                  fontWeight: 'bold',
                }}
              />
            )}
          </Stack>
          <Typography
            variant="body2"
            sx={{
              color: 'text.secondary',
              fontSize: '0.85rem',
              lineHeight: 1.3,
              mt: 0.25,
            }}
          >
            {primaryMuscle}
            {equipment && ` • ${equipment}`}
          </Typography>
        </Box>
        
        {/* Three-dot menu button */}
        <IconButton
          size="small"
          onClick={handleMenuClick}
          sx={{ color: 'text.secondary' }}
        >
          <MoreVert />
        </IconButton>
      </Box>
      
      {/* Exercise Configuration Row */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          px: 1.5,
          pb: 1.5,
          pt: 0,
        }}
      >
        <FormControl size="small" sx={{ width: 80 }}>
          <InputLabel>Sets</InputLabel>
          <Select
            label="Sets"
            value={exercise.sets || 3}
            onChange={(e) => {
              e.stopPropagation();
              onUpdateSets(index, parseInt(e.target.value));
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <MenuItem value={1}>1</MenuItem>
            <MenuItem value={2}>2</MenuItem>
            <MenuItem value={3}>3</MenuItem>
            <MenuItem value={4}>4</MenuItem>
            <MenuItem value={5}>5</MenuItem>
          </Select>
        </FormControl>
        <TargetRepsPicker
          value={typeof exercise.reps === 'number' ? getClosestValidTargetReps(exercise.reps) : DEFAULT_TARGET_REPS}
          onChange={(newReps) => onUpdateReps(index, newReps)}
          compact
          showLabel
          label="Reps"
        />
      </Box>
    </Box>
  );
};

MyWorkoutExerciseItem.propTypes = {
  exercise: PropTypes.object.isRequired,
  index: PropTypes.number.isRequired,
  onOpenOptionsMenu: PropTypes.func.isRequired,
  onUpdateReps: PropTypes.func.isRequired,
  onUpdateSets: PropTypes.func.isRequired,
  isHighlighted: PropTypes.bool,
  onToggleHighlight: PropTypes.func,
  currentSupersetColor: PropTypes.object,
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
  
  // Exercise options menu states
  const [optionsMenuOpen, setOptionsMenuOpen] = useState(false);
  const [selectedExerciseIndex, setSelectedExerciseIndex] = useState(null);
  const [selectedExerciseForMenu, setSelectedExerciseForMenu] = useState(null);
  
  // Superset management modal state
  const [supersetModalOpen, setSupersetModalOpen] = useState(false);
  
  // Clear supersets confirmation dialog state
  const [clearSupersetsDialogOpen, setClearSupersetsDialogOpen] = useState(false);
  
  // Floating button state and ref
  const [isButtonSticky, setIsButtonSticky] = useState(false);
  const contentRef = useRef(null);
  const buttonContainerRef = useRef(null);

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
        
        // Don't pre-select exercises when editing - users should start with no exercises selected
        setHighlightedExercises(new Set());
        
        // Set current superset number to the next available number
        if (existingWorkout.exercises && existingWorkout.exercises.length > 0) {
          const supersetGroups = existingWorkout.exercises
            .filter(ex => ex.supersetGroup)
            .map(ex => ex.supersetGroup);
          const maxSuperset = supersetGroups.length > 0 
            ? Math.max(...supersetGroups)
            : 0;
          setCurrentSupersetNumber(maxSuperset + 1);
        } else {
          setCurrentSupersetNumber(1);
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

  // Reset superset context to the next available number when all highlighted exercises are deselected
  useEffect(() => {
    if (highlightedExercises.size === 0) {
      // Get the lowest available superset number
      const getLowestAvailableSupersetNumber = () => {
        const supersetIds = myWorkout
          .filter(ex => ex.supersetGroup !== null && ex.supersetGroup !== undefined)
          .map(ex => ex.supersetGroup);
        
        if (supersetIds.length === 0) return 1;
        
        const uniqueIds = [...new Set(supersetIds)].sort((a, b) => a - b);
        
        for (let i = 1; i <= uniqueIds[uniqueIds.length - 1]; i++) {
          if (!uniqueIds.includes(i)) {
            return i;
          }
        }
        
        return uniqueIds[uniqueIds.length - 1] + 1;
      };
      
      setCurrentSupersetNumber(getLowestAvailableSupersetNumber());
    }
  }, [highlightedExercises, myWorkout]);

  // Scroll detection for floating button
  useEffect(() => {
    if (!open || currentTab !== 1) return;

    const contentElement = contentRef.current;
    if (!contentElement) return;

    const handleScroll = () => {
      const buttonContainer = buttonContainerRef.current;
      if (!buttonContainer) return;

      // Get button container's position relative to viewport
      const rect = buttonContainer.getBoundingClientRect();
      
      // Calculate the threshold: when button is about to go out of view at the top
      // Header (64px) + Tabs (48px) + some padding (68px) = 180px
      const STICKY_THRESHOLD = 180;
      
      // Button should be sticky when it would scroll past the threshold
      setIsButtonSticky(rect.top < STICKY_THRESHOLD);
    };

    contentElement.addEventListener('scroll', handleScroll);
    // Check initial state
    handleScroll();

    return () => {
      contentElement.removeEventListener('scroll', handleScroll);
    };
  }, [open, currentTab]);

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

  // Handle opening the options menu for an exercise
  const handleOpenOptionsMenu = useCallback((index, exercise) => {
    setSelectedExerciseIndex(index);
    setSelectedExerciseForMenu(exercise);
    setOptionsMenuOpen(true);
  }, []);

  // Handle closing the options menu
  const handleCloseOptionsMenu = useCallback(() => {
    setOptionsMenuOpen(false);
    setSelectedExerciseIndex(null);
    setSelectedExerciseForMenu(null);
  }, []);

  // Handle removing exercise from options menu
  const handleRemoveExercise = useCallback(() => {
    if (selectedExerciseIndex !== null && selectedExerciseForMenu) {
      const exerciseName = selectedExerciseForMenu['Exercise Name'];
      const newSelected = new Set(selectedExercises);
      newSelected.delete(exerciseName);
      setSelectedExercises(newSelected);
      setMyWorkout(prev => prev.filter(ex => ex['Exercise Name'] !== exerciseName));
    }
    handleCloseOptionsMenu();
  }, [selectedExerciseIndex, selectedExerciseForMenu, selectedExercises, handleCloseOptionsMenu]);

  // Handle replacing an exercise (for now, just switch to Exercises tab)
  const handleReplaceExercise = useCallback(() => {
    setCurrentTab(0); // Switch to Exercises tab to select replacement
    handleCloseOptionsMenu();
  }, [handleCloseOptionsMenu]);

  // Handle opening superset modal from options menu
  const handleOpenSupersetModal = useCallback(() => {
    handleCloseOptionsMenu();
    setSupersetModalOpen(true);
  }, [handleCloseOptionsMenu]);

  // Handle removing an exercise from its superset
  const handleRemoveFromSuperset = useCallback(() => {
    if (selectedExerciseIndex !== null && selectedExerciseForMenu) {
      const exercise = selectedExerciseForMenu;
      const supersetGroupId = exercise.supersetGroup;
      
      if (supersetGroupId !== null && supersetGroupId !== undefined) {
        // Remove this exercise from the superset
        const updated = myWorkout.map((ex, idx) => {
          if (idx === selectedExerciseIndex) {
            return { ...ex, supersetGroup: null };
          }
          return ex;
        });
        
        // Check if the superset group now has less than 2 members
        const groupCounts = {};
        updated.forEach(ex => {
          const groupId = ex.supersetGroup;
          if (groupId !== null && groupId !== undefined) {
            groupCounts[groupId] = (groupCounts[groupId] || 0) + 1;
          }
        });
        
        // Remove superset assignment from exercises that would be alone in a group
        const finalExercises = updated.map(ex => {
          const groupId = ex.supersetGroup;
          if (groupId !== null && groupCounts[groupId] === 1) {
            return { ...ex, supersetGroup: null };
          }
          return ex;
        });
        
        // Renumber supersets to keep them consistent
        const renumbered = renumberSupersets(finalExercises);
        setMyWorkout(renumbered);
      }
    }
    handleCloseOptionsMenu();
  }, [selectedExerciseIndex, selectedExerciseForMenu, myWorkout, handleCloseOptionsMenu]);

  // Handle updating supersets from the modal
  const handleUpdateSupersets = useCallback((updatedExercises) => {
    // Renumber supersets to keep them consistent
    const renumbered = renumberSupersets(updatedExercises);
    setMyWorkout(renumbered);
    setSupersetModalOpen(false);
  }, []);

  // Handle moving exercise up from options menu
  const handleMoveExerciseUp = useCallback(() => {
    if (selectedExerciseIndex !== null) {
      moveGroupUp(selectedExerciseIndex);
    }
    handleCloseOptionsMenu();
  }, [selectedExerciseIndex, moveGroupUp, handleCloseOptionsMenu]);

  // Handle moving exercise down from options menu
  const handleMoveExerciseDown = useCallback(() => {
    if (selectedExerciseIndex !== null) {
      moveGroupDown(selectedExerciseIndex);
    }
    handleCloseOptionsMenu();
  }, [selectedExerciseIndex, moveGroupDown, handleCloseOptionsMenu]);

  // Handle updating reps for an exercise
  const handleUpdateReps = useCallback((index, newReps) => {
    const updated = [...myWorkout];
    updated[index].reps = newReps;
    setMyWorkout(updated);
  }, [myWorkout]);

  // Handle updating sets for an exercise (also update superset group members)
  const handleUpdateSets = useCallback((index, newSets) => {
    const updated = [...myWorkout];
    const exercise = updated[index];
    const supersetGroupId = exercise.supersetGroup;
    
    if (supersetGroupId !== null && supersetGroupId !== undefined) {
      // Update all exercises in the same superset group
      updated.forEach((ex, i) => {
        if (ex.supersetGroup === supersetGroupId) {
          updated[i] = { ...updated[i], sets: newSets };
        }
      });
    } else {
      // Only update this exercise
      updated[index] = { ...updated[index], sets: newSets };
    }
    
    setMyWorkout(updated);
  }, [myWorkout]);

  // Handle toggling exercise highlight for superset selection
  // If tapping an exercise in an existing superset BEFORE starting a new superset selection,
  // set the context to that superset's color. If tapping AFTER exercises are already highlighted,
  // keep the current superset context (to add the exercise to the new superset).
  const handleToggleHighlight = useCallback((exerciseName, supersetGroupId) => {
    setHighlightedExercises(prev => {
      const newSet = new Set(prev);
      if (newSet.has(exerciseName)) {
        newSet.delete(exerciseName);
        // If we removed all highlighted exercises and the context was from a superset, 
        // reset to the next available superset number
        if (newSet.size === 0) {
          // Let useEffect handle resetting to the next available superset number
        }
      } else {
        // If no exercises are highlighted yet and the selected exercise is in a superset,
        // switch context to that superset
        if (newSet.size === 0 && supersetGroupId !== null && supersetGroupId !== undefined) {
          setCurrentSupersetNumber(supersetGroupId);
        }
        newSet.add(exerciseName);
      }
      return newSet;
    });
  }, []);

  // Handle clearing all supersets
  const handleClearSupersets = useCallback(() => {
    setClearSupersetsDialogOpen(true);
  }, []);

  // Confirm clearing all supersets
  const handleConfirmClearSupersets = useCallback(() => {
    // Remove all superset assignments from exercises
    const updatedExercises = myWorkout.map(exercise => ({
      ...exercise,
      supersetGroup: null,
    }));
    
    setMyWorkout(updatedExercises);
    setHighlightedExercises(new Set());
    setCurrentSupersetNumber(1);
    setClearSupersetsDialogOpen(false);
  }, [myWorkout]);

  // Memoize the current superset color to avoid repeated function calls
  const currentSupersetColor = useMemo(() => {
    return getSupersetColorWithLight(currentSupersetNumber);
  }, [currentSupersetNumber]);

  // Memoize the rendered exercise items for better performance
  const renderedExercises = useMemo(() => {
    return myWorkout.map((exercise, index) => (
      <MyWorkoutExerciseItem
        key={`${exercise['Exercise Name']}-${index}`}
        exercise={exercise}
        index={index}
        onOpenOptionsMenu={handleOpenOptionsMenu}
        onUpdateReps={handleUpdateReps}
        onUpdateSets={handleUpdateSets}
        isHighlighted={highlightedExercises.has(exercise['Exercise Name'])}
        onToggleHighlight={handleToggleHighlight}
        currentSupersetColor={currentSupersetColor}
      />
    ));
  }, [myWorkout, handleOpenOptionsMenu, handleUpdateReps, handleUpdateSets, highlightedExercises, handleToggleHighlight, currentSupersetColor]);

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

      <DialogContent ref={contentRef} sx={{ p: 0, overflow: 'auto' }}>
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
            <Box sx={{ mb: 2, position: 'relative' }}>
              <Stack 
                ref={buttonContainerRef}
                direction="row" 
                justifyContent="space-between" 
                alignItems="center" 
                sx={{ mb: 1 }}
              >
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Exercises ({myWorkout.length})
                </Typography>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Tooltip title="Clear All Supersets">
                    <span>
                      <IconButton
                        size="small"
                        onClick={handleClearSupersets}
                        disabled={!myWorkout.some(ex => ex.supersetGroup !== null && ex.supersetGroup !== undefined)}
                        sx={{
                          border: '1px solid',
                          borderColor: 'divider',
                          borderRadius: 1,
                          width: 36,
                          height: 36,
                        }}
                      >
                        <ClearAll fontSize="small" />
                      </IconButton>
                    </span>
                  </Tooltip>
                  <Tooltip title="Generate Workout">
                    <IconButton
                      size="small"
                      onClick={handleGenerateClick}
                      sx={{
                        border: '1px solid',
                        borderColor: 'divider',
                        borderRadius: 1,
                        width: 36,
                        height: 36,
                      }}
                    >
                      <AutoAwesome fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  {/* Original Add to Superset Button - stays in normal position */}
                  <Tooltip title={highlightedExercises.size >= 2 ? `Create Superset ${currentSupersetNumber}` : `Superset ${currentSupersetNumber} - Select exercises`}>
                    <span>
                      <IconButton
                        size="small"
                        onClick={handleLockInSuperset}
                        disabled={highlightedExercises.size < 2}
                        aria-label={highlightedExercises.size >= 2 ? `Create Superset ${currentSupersetNumber}` : `Superset ${currentSupersetNumber} - Select exercises`}
                        sx={{
                          border: '1px solid',
                          borderColor: currentSupersetColor?.main || 'divider',
                          borderRadius: 1,
                          width: 36,
                          height: 36,
                          bgcolor: currentSupersetColor?.main || 'transparent',
                          color: currentSupersetColor?.main ? 'white' : 'text.secondary',
                          '&:hover': {
                            bgcolor: currentSupersetColor?.dark || 'action.hover',
                          },
                          '&.Mui-disabled': {
                            bgcolor: currentSupersetColor?.main || 'transparent',
                            color: currentSupersetColor?.main ? 'rgba(255, 255, 255, 0.7)' : 'text.disabled',
                            opacity: 0.7,
                            borderColor: currentSupersetColor?.main || 'divider',
                          },
                        }}
                      >
                        <Add fontSize="small" />
                      </IconButton>
                    </span>
                  </Tooltip>
                </Stack>
              </Stack>
              
              {/* Floating duplicate button - only shown when scrolled */}
              {isButtonSticky && (
                <Tooltip title={highlightedExercises.size >= 2 ? `Create Superset ${currentSupersetNumber}` : `Superset ${currentSupersetNumber} - Select exercises`}>
                  <span>
                    <IconButton
                      size="small"
                      onClick={handleLockInSuperset}
                      disabled={highlightedExercises.size < 2}
                      aria-label={highlightedExercises.size >= 2 ? `Create Superset ${currentSupersetNumber}` : `Superset ${currentSupersetNumber} - Select exercises`}
                      sx={{
                        position: 'fixed',
                        right: 24,
                        top: 180,
                        zIndex: 1000,
                        border: '1px solid',
                        borderColor: currentSupersetColor?.main || 'divider',
                        borderRadius: 1,
                        width: 36,
                        height: 36,
                        bgcolor: currentSupersetColor?.main || 'transparent',
                        color: currentSupersetColor?.main ? 'white' : 'text.secondary',
                        '&:hover': {
                          bgcolor: currentSupersetColor?.dark || 'action.hover',
                        },
                        '&.Mui-disabled': {
                          bgcolor: currentSupersetColor?.main || 'transparent',
                          color: currentSupersetColor?.main ? 'rgba(255, 255, 255, 0.7)' : 'text.disabled',
                          opacity: 0.7,
                          borderColor: currentSupersetColor?.main || 'divider',
                        },
                      }}
                    >
                      <Add fontSize="small" />
                    </IconButton>
                  </span>
                </Tooltip>
              )}
              
              {/* Show superset selection hint when exercises are highlighted */}
              {highlightedExercises.size > 0 && (
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  {highlightedExercises.size} exercise{highlightedExercises.size !== 1 ? 's' : ''} selected for Superset {currentSupersetNumber}
                  {highlightedExercises.size >= 2 && ` - Tap + to confirm`}
                  {highlightedExercises.size === 1 && ' - Select at least one more'}
                </Typography>
              )}
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

      {/* Clear Supersets Confirmation Dialog */}
      <Dialog
        open={clearSupersetsDialogOpen}
        onClose={() => setClearSupersetsDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Clear All Supersets?</DialogTitle>
        <DialogContent>
          <Typography variant="body1">
            This will remove all superset groupings from your workout. Exercises will remain in your workout but will no longer be grouped as supersets. This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setClearSupersetsDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleConfirmClearSupersets} variant="contained" color="warning">
            Clear Supersets
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

      {/* Exercise Options Menu (three-dot menu) */}
      <ExerciseOptionsMenu
        open={optionsMenuOpen}
        onClose={handleCloseOptionsMenu}
        exerciseName={selectedExerciseForMenu?.['Exercise Name'] || ''}
        onMoveUp={handleMoveExerciseUp}
        onMoveDown={handleMoveExerciseDown}
        onReplace={handleReplaceExercise}
        onAddToSuperset={handleOpenSupersetModal}
        onRemoveFromSuperset={handleRemoveFromSuperset}
        onRemove={handleRemoveExercise}
        canMoveUp={selectedExerciseIndex > 0}
        canMoveDown={selectedExerciseIndex !== null && selectedExerciseIndex < myWorkout.length - 1}
        isInSuperset={selectedExerciseForMenu?.supersetGroup !== null && selectedExerciseForMenu?.supersetGroup !== undefined}
      />

      {/* Superset Management Modal */}
      <SupersetManagementModal
        open={supersetModalOpen}
        onClose={() => setSupersetModalOpen(false)}
        exercises={myWorkout}
        currentExerciseIndex={selectedExerciseIndex}
        onUpdateSupersets={handleUpdateSupersets}
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
