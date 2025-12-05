/**
 * SupersetManagementModal - A bottom sheet for managing superset groupings
 * 
 * Features:
 * - Shows all exercises in the workout
 * - Color-coded left bar indicates superset groups
 * - User can select multiple exercises to join/create superset
 * - Exercises already in a superset show their group color
 */

import { useState, useMemo, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Box, Typography, Button, List, Stack } from '@mui/material';
import BottomSheet from './BottomSheet';
import ExerciseListItem from './ExerciseListItem';
import { getSupersetColor } from '../../utils/supersetColors';

const SupersetManagementModal = ({
  open,
  onClose,
  exercises = [],
  currentExerciseIndex,
  onUpdateSupersets,
}) => {
  // Track which exercises are selected in this modal
  const [selectedIndices, setSelectedIndices] = useState(new Set());
  
  // Initialize with current exercise selected when modal opens
  useEffect(() => {
    if (open && currentExerciseIndex !== undefined && currentExerciseIndex >= 0) {
      setSelectedIndices(new Set([currentExerciseIndex]));
    } else if (!open) {
      setSelectedIndices(new Set());
    }
  }, [open, currentExerciseIndex]);

  // Calculate existing superset groups from exercises
  const supersetGroups = useMemo(() => {
    const groups = {};
    exercises.forEach((exercise, index) => {
      const groupId = exercise.supersetGroup;
      if (groupId !== null && groupId !== undefined) {
        if (!groups[groupId]) {
          groups[groupId] = [];
        }
        groups[groupId].push(index);
      }
    });
    return groups;
  }, [exercises]);

  // Get the next available superset group ID
  const getNextGroupId = () => {
    const existingIds = Object.keys(supersetGroups).map(Number);
    if (existingIds.length === 0) return 0;
    // Use reduce for better performance
    return existingIds.reduce((max, id) => Math.max(max, id), 0) + 1;
  };

  const handleToggleExercise = (index) => {
    setSelectedIndices(prev => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  const handleCreateSuperset = () => {
    if (selectedIndices.size < 2) {
      return; // Need at least 2 exercises for a superset
    }

    // Check if any selected exercise is already in a superset
    const selectedExercises = Array.from(selectedIndices);
    const existingSupersetGroup = selectedExercises.find(
      idx => exercises[idx]?.supersetGroup !== null && exercises[idx]?.supersetGroup !== undefined
    );

    let targetGroupId;
    if (existingSupersetGroup !== undefined) {
      // Join existing superset group
      targetGroupId = exercises[existingSupersetGroup].supersetGroup;
    } else {
      // Create new superset group
      targetGroupId = getNextGroupId();
    }

    // Update all selected exercises to be in the same superset
    const updatedExercises = exercises.map((ex, idx) => {
      if (selectedIndices.has(idx)) {
        return { ...ex, supersetGroup: targetGroupId };
      }
      return ex;
    });

    onUpdateSupersets(updatedExercises);
    onClose();
  };

  const handleRemoveFromSuperset = () => {
    // Remove selected exercises from their superset groups
    const updatedExercises = exercises.map((ex, idx) => {
      if (selectedIndices.has(idx)) {
        return { ...ex, supersetGroup: null };
      }
      return ex;
    });

    // Clean up empty superset groups (single exercise remaining)
    const groupCounts = {};
    updatedExercises.forEach(ex => {
      const groupId = ex.supersetGroup;
      if (groupId !== null && groupId !== undefined) {
        groupCounts[groupId] = (groupCounts[groupId] || 0) + 1;
      }
    });

    // Remove superset assignment from exercises that would be alone in a group
    const finalExercises = updatedExercises.map(ex => {
      const groupId = ex.supersetGroup;
      if (groupId !== null && groupCounts[groupId] === 1) {
        return { ...ex, supersetGroup: null };
      }
      return ex;
    });

    onUpdateSupersets(finalExercises);
    onClose();
  };

  // Check if any selected exercise is in a superset
  const hasSelectedInSuperset = Array.from(selectedIndices).some(
    idx => exercises[idx]?.supersetGroup !== null && exercises[idx]?.supersetGroup !== undefined
  );

  const canCreateSuperset = selectedIndices.size >= 2;

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title="Manage Superset"
      maxHeight="70vh"
    >
      <Box sx={{ pb: 2 }}>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Select exercises to group into a superset. Exercises with a colored bar are already in a superset group.
        </Typography>

        {/* Exercise List */}
        <List disablePadding sx={{ mx: -2 }}>
          {exercises.map((exercise, index) => (
            <ExerciseListItem
              key={`${exercise['Exercise Name'] || exercise.name}-${index}`}
              exercise={exercise}
              selected={selectedIndices.has(index)}
              onClick={() => handleToggleExercise(index)}
              showCheckbox
              supersetColor={getSupersetColor(exercise.supersetGroup)}
            />
          ))}
        </List>

        {/* Action Buttons */}
        <Stack direction="row" spacing={1} sx={{ mt: 3 }}>
          {hasSelectedInSuperset && (
            <Button
              variant="outlined"
              color="error"
              onClick={handleRemoveFromSuperset}
              sx={{ flex: 1 }}
            >
              Remove from Superset
            </Button>
          )}
          <Button
            variant="contained"
            onClick={handleCreateSuperset}
            disabled={!canCreateSuperset}
            sx={{ flex: 1 }}
          >
            {hasSelectedInSuperset ? 'Update Superset' : 'Create Superset'}
          </Button>
        </Stack>
      </Box>
    </BottomSheet>
  );
};

SupersetManagementModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  exercises: PropTypes.array,
  currentExerciseIndex: PropTypes.number,
  onUpdateSupersets: PropTypes.func.isRequired,
};

export default SupersetManagementModal;
