import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
  TextField,
  Box,
  Typography,
  List,
  InputAdornment,
  IconButton,
  Alert,
  CircularProgress,
} from '@mui/material';
import { Close, Search } from '@mui/icons-material';
import BottomSheet from './BottomSheet';
import ExerciseListItem from './ExerciseListItem';
import { EXERCISES_DATA_PATH } from '../../utils/constants';

// Maximum number of exercises to display in the list for performance
const MAX_DISPLAYED_EXERCISES = 50;

/**
 * SwapExerciseDialog - Allows users to swap an exercise mid-workout
 * Shows exercises from the same muscle group by default
 * Uses bottom sheet modal design for consistency
 */
const SwapExerciseDialog = ({
  open,
  onClose,
  currentExercise,
  onSwap,
}) => {
  const [allExercises, setAllExercises] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load exercises on mount
  useEffect(() => {
    const loadExercises = async () => {
      try {
        setError(null);
        const response = await fetch(EXERCISES_DATA_PATH);
        if (!response.ok) {
          throw new Error(`Failed to load exercises: ${response.status}`);
        }
        const exercises = await response.json();
        setAllExercises(exercises);
      } catch (err) {
        console.error('Failed to load exercises:', err);
        setError('Unable to load exercises. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    loadExercises();
  }, []);

  // Filter exercises based on search and prioritize same muscle group
  const getFilteredExercises = () => {
    if (!allExercises.length) return [];

    const currentMuscle = currentExercise?.['Primary Muscle'];
    const currentName = currentExercise?.['Exercise Name'];

    let filtered = allExercises.filter(ex => 
      ex['Exercise Name'] !== currentName
    );

    if (searchTerm) {
      const terms = searchTerm.toLowerCase().split(' ').filter(t => t);
      filtered = filtered.filter(ex => {
        const searchable = [
          ex['Exercise Name'],
          ex['Primary Muscle'],
          ex['Equipment'] || ''
        ].join(' ').toLowerCase();
        return terms.every(term => searchable.includes(term));
      });
    } else {
      // When no search, prioritize same muscle group
      filtered = filtered.filter(ex => 
        ex['Primary Muscle'] === currentMuscle
      );
    }

    return filtered.slice(0, MAX_DISPLAYED_EXERCISES); // Limit for performance
  };

  const handleSelect = (exercise) => {
    onSwap(exercise);
    onClose();
    setSearchTerm('');
  };

  const handleClose = () => {
    onClose();
    setSearchTerm('');
    setError(null);
  };

  const filteredExercises = getFilteredExercises();

  return (
    <BottomSheet
      open={open}
      onClose={handleClose}
      title="Replace Exercise"
      maxHeight="80vh"
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 300 }}>
        {/* Current exercise info */}
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
          Current: <strong>{currentExercise?.['Exercise Name']}</strong>
        </Typography>
        
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
            mb: 1,
            '& .MuiOutlinedInput-root': {
              bgcolor: 'background.default',
            },
          }}
        />
        
        {!searchTerm && (
          <Typography variant="caption" color="text.secondary" sx={{ mb: 1 }}>
            Showing {currentExercise?.['Primary Muscle']} exercises. Search to see all.
          </Typography>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
        )}

        {/* Exercise List */}
        <Box sx={{ flex: 1, overflow: 'auto', mx: -2 }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : filteredExercises.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography color="text.secondary">No exercises found</Typography>
            </Box>
          ) : (
            <List disablePadding>
              {filteredExercises.map((exercise, index) => (
                <ExerciseListItem
                  key={`${exercise['Exercise Name']}-${index}`}
                  exercise={exercise}
                  onClick={handleSelect}
                />
              ))}
            </List>
          )}
        </Box>
      </Box>
    </BottomSheet>
  );
};

SwapExerciseDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  currentExercise: PropTypes.object,
  onSwap: PropTypes.func.isRequired,
};

export default SwapExerciseDialog;
