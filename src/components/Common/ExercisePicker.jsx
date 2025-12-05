/**
 * ExercisePicker - A full-screen exercise selection component
 * 
 * Features:
 * - Search bar with filter buttons
 * - Bottom sheet modals for equipment and muscle group filters
 * - Minimalist exercise list with demo images
 * - Single tap to select/add exercises
 * - Shows selected exercises with checkmarks
 */

import { useState, useEffect, useMemo } from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  TextField,
  InputAdornment,
  IconButton,
  Typography,
  List,
  Chip,
  Stack,
  Button,
  CircularProgress,
} from '@mui/material';
import {
  Search,
  FilterList,
  FitnessCenter,
  Close,
} from '@mui/icons-material';
import ExerciseListItem from './ExerciseListItem';
import FilterBottomSheet from './FilterBottomSheet';
import BottomSheet from './BottomSheet';
import { EXERCISES_DATA_PATH } from '../../utils/constants';
import { getMuscleCategory } from '../../utils/muscleCategories';

const ExercisePicker = ({
  open,
  onClose,
  onSelectExercise,
  selectedExercises = [],
  multiSelect = true,
  title = 'Select Exercise',
}) => {
  const [allExercises, setAllExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEquipment, setSelectedEquipment] = useState('all');
  const [selectedMuscle, setSelectedMuscle] = useState('all');
  const [equipmentFilterOpen, setEquipmentFilterOpen] = useState(false);
  const [muscleFilterOpen, setMuscleFilterOpen] = useState(false);

  // Load exercises on mount
  useEffect(() => {
    const loadExercises = async () => {
      try {
        const response = await fetch(EXERCISES_DATA_PATH);
        if (response.ok) {
          const exercises = await response.json();
          setAllExercises(exercises);
        }
      } catch (err) {
        console.error('Failed to load exercises:', err);
      } finally {
        setLoading(false);
      }
    };
    loadExercises();
  }, []);

  // Extract unique equipment types
  const equipmentTypes = useMemo(() => {
    const types = new Set();
    allExercises.forEach(ex => {
      if (ex['Equipment']) {
        types.add(ex['Equipment']);
      }
    });
    return ['all', ...Array.from(types).sort()];
  }, [allExercises]);

  // Extract unique muscle groups
  const muscleGroups = useMemo(() => {
    const groups = new Set();
    allExercises.forEach(ex => {
      const category = getMuscleCategory(ex['Primary Muscle']);
      groups.add(category);
    });
    return ['all', ...Array.from(groups).sort()];
  }, [allExercises]);

  // Filter exercises based on search and filters
  const filteredExercises = useMemo(() => {
    return allExercises.filter(exercise => {
      // Search filter
      if (searchTerm) {
        const terms = searchTerm.toLowerCase().split(' ').filter(t => t);
        const searchable = [
          exercise['Exercise Name'],
          exercise['Primary Muscle'],
          exercise['Equipment'] || '',
        ].join(' ').toLowerCase();
        
        if (!terms.every(term => searchable.includes(term))) {
          return false;
        }
      }

      // Equipment filter
      if (selectedEquipment !== 'all' && exercise['Equipment'] !== selectedEquipment) {
        return false;
      }

      // Muscle filter
      if (selectedMuscle !== 'all') {
        const category = getMuscleCategory(exercise['Primary Muscle']);
        if (category !== selectedMuscle) {
          return false;
        }
      }

      return true;
    });
  }, [allExercises, searchTerm, selectedEquipment, selectedMuscle]);

  // Check if an exercise is selected
  const isSelected = (exercise) => {
    const name = exercise['Exercise Name'] || exercise.name;
    return selectedExercises.some(ex => 
      (ex['Exercise Name'] || ex.name) === name
    );
  };

  // Handle exercise selection - single tap adds/selects
  const handleExerciseClick = (exercise) => {
    onSelectExercise(exercise);
    if (!multiSelect) {
      onClose();
    }
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setSelectedEquipment('all');
    setSelectedMuscle('all');
  };

  const hasActiveFilters = selectedEquipment !== 'all' || selectedMuscle !== 'all';

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title={title}
      maxHeight="90vh"
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 400 }}>
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
                <Search color="action" />
              </InputAdornment>
            ),
            endAdornment: searchTerm && (
              <InputAdornment position="end">
                <IconButton size="small" onClick={() => setSearchTerm('')}>
                  <Close fontSize="small" />
                </IconButton>
              </InputAdornment>
            ),
          }}
          sx={{
            mb: 1.5,
            '& .MuiOutlinedInput-root': {
              bgcolor: 'background.default',
            },
          }}
        />

        {/* Filter Buttons */}
        <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
          <Chip
            icon={<FitnessCenter fontSize="small" />}
            label={selectedEquipment === 'all' ? 'Equipment' : selectedEquipment}
            onClick={() => setEquipmentFilterOpen(true)}
            variant={selectedEquipment === 'all' ? 'outlined' : 'filled'}
            color={selectedEquipment === 'all' ? 'default' : 'primary'}
            sx={{ flex: 1, justifyContent: 'flex-start' }}
          />
          <Chip
            icon={<FilterList fontSize="small" />}
            label={selectedMuscle === 'all' ? 'Muscle' : selectedMuscle}
            onClick={() => setMuscleFilterOpen(true)}
            variant={selectedMuscle === 'all' ? 'outlined' : 'filled'}
            color={selectedMuscle === 'all' ? 'default' : 'primary'}
            sx={{ flex: 1, justifyContent: 'flex-start' }}
          />
          {hasActiveFilters && (
            <IconButton size="small" onClick={handleClearFilters}>
              <Close fontSize="small" />
            </IconButton>
          )}
        </Stack>

        {/* Results Count */}
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          {filteredExercises.length} exercise{filteredExercises.length !== 1 ? 's' : ''} found
        </Typography>

        {/* Exercise List */}
        <Box sx={{ flex: 1, overflow: 'auto', mx: -2 }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : filteredExercises.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography color="text.secondary">
                No exercises found
              </Typography>
              {hasActiveFilters && (
                <Button
                  variant="text"
                  onClick={handleClearFilters}
                  sx={{ mt: 1 }}
                >
                  Clear filters
                </Button>
              )}
            </Box>
          ) : (
            <List disablePadding>
              {filteredExercises.map((exercise, index) => (
                <ExerciseListItem
                  key={`${exercise['Exercise Name']}-${index}`}
                  exercise={exercise}
                  selected={isSelected(exercise)}
                  onClick={handleExerciseClick}
                />
              ))}
            </List>
          )}
        </Box>

        {/* Done Button for multi-select */}
        {multiSelect && (
          <Button
            fullWidth
            variant="contained"
            onClick={onClose}
            sx={{ mt: 2 }}
          >
            Done ({selectedExercises.length} selected)
          </Button>
        )}
      </Box>

      {/* Equipment Filter Modal */}
      <FilterBottomSheet
        open={equipmentFilterOpen}
        onClose={() => setEquipmentFilterOpen(false)}
        title="Select Equipment"
        options={equipmentTypes.map(type => ({
          value: type,
          label: type === 'all' ? 'All Equipment' : type,
        }))}
        selectedValue={selectedEquipment}
        onSelect={setSelectedEquipment}
      />

      {/* Muscle Filter Modal */}
      <FilterBottomSheet
        open={muscleFilterOpen}
        onClose={() => setMuscleFilterOpen(false)}
        title="Select Muscle Group"
        options={muscleGroups.map(group => ({
          value: group,
          label: group === 'all' ? 'All Muscles' : group,
        }))}
        selectedValue={selectedMuscle}
        onSelect={setSelectedMuscle}
      />
    </BottomSheet>
  );
};

ExercisePicker.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSelectExercise: PropTypes.func.isRequired,
  selectedExercises: PropTypes.array,
  multiSelect: PropTypes.bool,
  title: PropTypes.string,
};

export default ExercisePicker;
