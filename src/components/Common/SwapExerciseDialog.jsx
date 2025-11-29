import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Chip,
  IconButton,
} from '@mui/material';
import { Close, Search, SwapHoriz } from '@mui/icons-material';
import { EXERCISES_DATA_PATH } from '../../utils/constants';

/**
 * SwapExerciseDialog - Allows users to swap an exercise mid-workout
 * Shows exercises from the same muscle group by default
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

  // Load exercises on mount
  useEffect(() => {
    const loadExercises = async () => {
      try {
        const response = await fetch(EXERCISES_DATA_PATH);
        if (response.ok) {
          const exercises = await response.json();
          setAllExercises(exercises);
        }
      } catch (error) {
        console.error('Failed to load exercises:', error);
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

    return filtered.slice(0, 50); // Limit for performance
  };

  const handleSelect = (exercise) => {
    onSwap(exercise);
    onClose();
    setSearchTerm('');
  };

  const handleClose = () => {
    onClose();
    setSearchTerm('');
  };

  const filteredExercises = getFilteredExercises();

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      fullWidth
      maxWidth="sm"
      PaperProps={{
        sx: { maxHeight: '80vh' }
      }}
    >
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <SwapHoriz color="primary" />
          <Typography variant="h6">Swap Exercise</Typography>
        </Box>
        <IconButton onClick={handleClose} size="small">
          <Close />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            Current: <strong>{currentExercise?.['Exercise Name']}</strong>
          </Typography>
          <TextField
            fullWidth
            size="small"
            placeholder="Search exercises..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />,
            }}
            autoFocus
          />
          {!searchTerm && (
            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
              Showing {currentExercise?.['Primary Muscle']} exercises. Search to see all.
            </Typography>
          )}
        </Box>

        {loading ? (
          <Typography>Loading exercises...</Typography>
        ) : filteredExercises.length === 0 ? (
          <Typography color="text.secondary">No exercises found</Typography>
        ) : (
          <List sx={{ maxHeight: '40vh', overflow: 'auto' }}>
            {filteredExercises.map((exercise, index) => (
              <ListItem key={index} disablePadding>
                <ListItemButton onClick={() => handleSelect(exercise)}>
                  <ListItemText
                    primary={exercise['Exercise Name']}
                    secondary={
                      <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5 }}>
                        <Chip
                          label={exercise['Primary Muscle']}
                          size="small"
                          color="primary"
                          variant="outlined"
                        />
                        {exercise['Equipment'] && (
                          <Chip
                            label={exercise['Equipment']}
                            size="small"
                            variant="outlined"
                          />
                        )}
                      </Box>
                    }
                  />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
      </DialogActions>
    </Dialog>
  );
};

SwapExerciseDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  currentExercise: PropTypes.object,
  onSwap: PropTypes.func.isRequired,
};

export default SwapExerciseDialog;
