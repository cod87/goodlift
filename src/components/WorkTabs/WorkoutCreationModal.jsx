import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Box,
  IconButton,
  Button,
  Tabs,
  Tab,
  Typography,
  TextField,
  InputAdornment,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Card,
  CardContent,
  CardMedia,
  Stack,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
} from '@mui/material';
import {
  Close,
  Search,
  FitnessCenter,
  DragIndicator,
  ViewAgenda,
  ViewStream,
} from '@mui/icons-material';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

/**
 * SortableExerciseItem - Draggable exercise item in My Workout
 */
const SortableExerciseItem = ({ 
  exercise, 
  index, 
  myWorkout, 
  setMyWorkout, 
  selectedExercises, 
  setSelectedExercises,
  onToggleSupersetGroup,
  availableSupersetGroups,
  onChangeSupersetGroup,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: exercise['Exercise Name'] });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  // Check if this exercise is in a superset group
  const supersetGroupId = exercise.supersetGroup;
  const isInSuperset = supersetGroupId !== null && supersetGroupId !== undefined;

  return (
    <Card
      ref={setNodeRef}
      style={style}
      elevation={isDragging ? 4 : 1}
      sx={{
        borderLeft: isInSuperset ? 4 : 0,
        borderColor: isInSuperset ? 'primary.main' : 'transparent',
      }}
    >
      <CardContent>
        <Stack direction="row" alignItems="center" spacing={2}>
          <Box {...attributes} {...listeners} sx={{ cursor: 'grab', '&:active': { cursor: 'grabbing' } }}>
            <DragIndicator sx={{ color: 'text.secondary' }} />
          </Box>
          <Box sx={{ flex: 1 }}>
            <Stack direction="row" alignItems="center" spacing={1}>
              <Typography variant="body1" sx={{ fontWeight: 600 }}>
                {exercise['Exercise Name']}
              </Typography>
              {isInSuperset && (
                <Chip 
                  label={`Superset ${supersetGroupId}`} 
                  size="small" 
                  color="primary"
                  variant="outlined"
                />
              )}
            </Stack>
            <Typography variant="caption" color="text.secondary">
              {exercise['Primary Muscle']} • {exercise.Equipment}
            </Typography>
          </Box>
          {/* Superset Group Selector */}
          {availableSupersetGroups.length > 0 || isInSuperset ? (
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Superset</InputLabel>
              <Select
                value={isInSuperset ? supersetGroupId : 'none'}
                label="Superset"
                onChange={(e) => onChangeSupersetGroup(index, e.target.value)}
              >
                <MenuItem value="none">None</MenuItem>
                {availableSupersetGroups.map(groupId => (
                  <MenuItem key={groupId} value={groupId}>
                    Superset {groupId}
                  </MenuItem>
                ))}
                <MenuItem value="new">+ New Superset</MenuItem>
              </Select>
            </FormControl>
          ) : (
            <Tooltip title="Add to superset">
              <IconButton
                size="small"
                onClick={() => onToggleSupersetGroup(index)}
                color="default"
              >
                <ViewStream />
              </IconButton>
            </Tooltip>
          )}
          <IconButton
            size="small"
            onClick={() => {
              const newSelected = new Set(selectedExercises);
              newSelected.delete(exercise['Exercise Name']);
              setSelectedExercises(newSelected);
              setMyWorkout(myWorkout.filter(e => 
                e['Exercise Name'] !== exercise['Exercise Name']
              ));
            }}
          >
            <Close />
          </IconButton>
        </Stack>
        
        {/* Exercise Configuration */}
        <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
          <TextField
            label="Sets"
            type="number"
            size="small"
            value={exercise.sets}
            onChange={(e) => {
              const updated = [...myWorkout];
              updated[index].sets = parseInt(e.target.value) || 3;
              setMyWorkout(updated);
            }}
            sx={{ width: 80 }}
          />
          <TextField
            label="Reps"
            type="number"
            size="small"
            value={exercise.reps}
            onChange={(e) => {
              const updated = [...myWorkout];
              updated[index].reps = parseInt(e.target.value) || 10;
              setMyWorkout(updated);
            }}
            sx={{ width: 80 }}
          />
          <TextField
            label="Rest (s)"
            type="number"
            size="small"
            value={exercise.restTime}
            onChange={(e) => {
              const updated = [...myWorkout];
              updated[index].restTime = parseInt(e.target.value) || 60;
              setMyWorkout(updated);
            }}
            sx={{ width: 100 }}
          />
        </Stack>
      </CardContent>
    </Card>
  );
};

SortableExerciseItem.propTypes = {
  exercise: PropTypes.object.isRequired,
  index: PropTypes.number.isRequired,
  myWorkout: PropTypes.array.isRequired,
  setMyWorkout: PropTypes.func.isRequired,
  selectedExercises: PropTypes.instanceOf(Set).isRequired,
  setSelectedExercises: PropTypes.func.isRequired,
  onToggleSupersetGroup: PropTypes.func.isRequired,
  availableSupersetGroups: PropTypes.array.isRequired,
  onChangeSupersetGroup: PropTypes.func.isRequired,
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
}) => {
  const [currentTab, setCurrentTab] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterEquipment, setFilterEquipment] = useState('all');
  const [filterMuscleGroup, setFilterMuscleGroup] = useState('all');
  const [selectedExercises, setSelectedExercises] = useState(new Set());
  const [myWorkout, setMyWorkout] = useState([]);
  const [workoutName, setWorkoutName] = useState('');
  const [workoutType, setWorkoutType] = useState('full');

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Reset state when modal opens
  useEffect(() => {
    if (open) {
      setCurrentTab(0);
      setSearchQuery('');
      setFilterEquipment('all');
      setFilterMuscleGroup('all');
      setSelectedExercises(new Set());
      setMyWorkout([]);
      setWorkoutName('');
      setWorkoutType('full');
    }
  }, [open]);

  // Filter exercises based on search and filters
  const filteredExercises = exercises.filter(exercise => {
    const matchesSearch = exercise['Exercise Name']
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    
    const matchesEquipment = filterEquipment === 'all' || 
      exercise.Equipment.toLowerCase().includes(filterEquipment.toLowerCase());
    
    const matchesMuscleGroup = filterMuscleGroup === 'all' || 
      exercise['Primary Muscle'] === filterMuscleGroup;

    return matchesSearch && matchesEquipment && matchesMuscleGroup;
  });

  // Get unique equipment types
  const equipmentTypes = ['all', ...new Set(exercises.map(e => e.Equipment))];
  
  // Get unique muscle groups
  const muscleGroups = ['all', ...new Set(exercises.map(e => e['Primary Muscle']))];

  // Handle exercise selection/deselection
  const handleExerciseToggle = (exercise) => {
    const newSelected = new Set(selectedExercises);
    const exerciseName = exercise['Exercise Name'];
    
    if (newSelected.has(exerciseName)) {
      newSelected.delete(exerciseName);
      // Remove from myWorkout
      setMyWorkout(myWorkout.filter(e => e['Exercise Name'] !== exerciseName));
    } else {
      newSelected.add(exerciseName);
      // Add to myWorkout without superset group initially
      setMyWorkout([...myWorkout, {
        ...exercise,
        sets: 3,
        reps: 10,
        weight: 0,
        restTime: 60,
        supersetGroup: null, // No superset group initially
      }]);
    }
    
    setSelectedExercises(newSelected);
  };

  // Toggle superset group for an exercise (creates new superset or removes from superset)
  const handleToggleSupersetGroup = (index) => {
    const updated = [...myWorkout];
    const exercise = updated[index];
    
    if (exercise.supersetGroup !== null && exercise.supersetGroup !== undefined) {
      // Remove from superset
      exercise.supersetGroup = null;
    } else {
      // Create a new superset group
      const newGroupId = Math.max(0, ...updated.map(e => e.supersetGroup || 0)) + 1;
      exercise.supersetGroup = newGroupId;
    }
    
    setMyWorkout(updated);
  };

  // Change superset group for an exercise
  const handleChangeSupersetGroup = (index, groupValue) => {
    const updated = [...myWorkout];
    const exercise = updated[index];
    
    if (groupValue === 'none') {
      // Remove from superset
      exercise.supersetGroup = null;
    } else if (groupValue === 'new') {
      // Create a new superset group
      const newGroupId = Math.max(0, ...updated.map(e => e.supersetGroup || 0)) + 1;
      exercise.supersetGroup = newGroupId;
    } else {
      // Join existing superset group
      exercise.supersetGroup = parseInt(groupValue);
    }
    
    setMyWorkout(updated);
  };

  // Get available superset groups
  const getAvailableSupersetGroups = () => {
    const groups = new Set();
    myWorkout.forEach(exercise => {
      if (exercise.supersetGroup !== null && exercise.supersetGroup !== undefined) {
        groups.add(exercise.supersetGroup);
      }
    });
    return Array.from(groups).sort((a, b) => a - b);
  };

  // Handle drag and drop reordering
  const handleDragEnd = (event) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setMyWorkout((items) => {
        const oldIndex = items.findIndex(item => item['Exercise Name'] === active.id);
        const newIndex = items.findIndex(item => item['Exercise Name'] === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
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
          Create Workout
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
            <Stack spacing={2} sx={{ mb: 3 }}>
              <TextField
                fullWidth
                placeholder="Search exercises..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search />
                    </InputAdornment>
                  ),
                }}
              />
              
              <Stack direction="row" spacing={2}>
                <FormControl size="small" sx={{ flex: 1 }}>
                  <InputLabel>Equipment</InputLabel>
                  <Select
                    value={filterEquipment}
                    label="Equipment"
                    onChange={(e) => setFilterEquipment(e.target.value)}
                  >
                    {equipmentTypes.map(eq => (
                      <MenuItem key={eq} value={eq}>
                        {eq === 'all' ? 'All Equipment' : eq}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <FormControl size="small" sx={{ flex: 1 }}>
                  <InputLabel>Muscle Group</InputLabel>
                  <Select
                    value={filterMuscleGroup}
                    label="Muscle Group"
                    onChange={(e) => setFilterMuscleGroup(e.target.value)}
                  >
                    {muscleGroups.map(muscle => (
                      <MenuItem key={muscle} value={muscle}>
                        {muscle === 'all' ? 'All Muscles' : muscle}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Stack>
            </Stack>

            {/* Exercise List */}
            <Stack spacing={2}>
              {filteredExercises.map((exercise) => {
                const exerciseName = exercise['Exercise Name'];
                const isSelected = selectedExercises.has(exerciseName);
                
                return (
                  <Card
                    key={exerciseName}
                    elevation={1}
                    sx={{
                      cursor: 'pointer',
                      position: 'relative',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      borderLeft: isSelected ? '4px solid' : '4px solid transparent',
                      borderLeftColor: isSelected ? 'success.main' : 'transparent',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: 3,
                      },
                      '&:active': {
                        transform: 'translateY(-2px)',
                      },
                    }}
                    onClick={() => handleExerciseToggle(exercise)}
                  >
                    <CardContent>
                      <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                        {exerciseName}
                      </Typography>
                      <Stack direction="row" spacing={1} flexWrap="wrap" gap={1}>
                        <Chip
                          label={exercise['Primary Muscle']}
                          size="small"
                          color="primary"
                          variant="outlined"
                        />
                        <Chip
                          label={exercise.Equipment}
                          size="small"
                          variant="outlined"
                        />
                        <Chip
                          label={exercise['Exercise Type']}
                          size="small"
                          variant="outlined"
                        />
                      </Stack>
                    </CardContent>
                  </Card>
                );
              })}
            </Stack>
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

            {/* Exercise List with Drag and Drop */}
            <Typography variant="h6" sx={{ mb: 1, fontWeight: 600 }}>
              Exercises ({myWorkout.length})
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Use the dropdown to assign exercises to superset groups. Multiple exercises can be in the same superset.
            </Typography>
            
            {myWorkout.length > 0 ? (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={myWorkout.map(e => e['Exercise Name'])}
                  strategy={verticalListSortingStrategy}
                >
                  <Stack spacing={2}>
                    {myWorkout.map((exercise, index) => (
                      <SortableExerciseItem
                        key={exercise['Exercise Name']}
                        exercise={exercise}
                        index={index}
                        myWorkout={myWorkout}
                        setMyWorkout={setMyWorkout}
                        selectedExercises={selectedExercises}
                        setSelectedExercises={setSelectedExercises}
                        onToggleSupersetGroup={handleToggleSupersetGroup}
                        availableSupersetGroups={getAvailableSupersetGroups()}
                        onChangeSupersetGroup={handleChangeSupersetGroup}
                      />
                    ))}
                  </Stack>
                </SortableContext>
              </DndContext>
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
    </Dialog>
  );
};

WorkoutCreationModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
  exercises: PropTypes.array,
};

export default WorkoutCreationModal;
