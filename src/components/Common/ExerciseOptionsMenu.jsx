/**
 * ExerciseOptionsMenu - A bottom sheet menu for exercise actions
 * 
 * Options:
 * - Reorder (Move Up/Down)
 * - Replace exercise
 * - Add to superset
 * - Remove from workout
 */

import PropTypes from 'prop-types';
import { List, ListItemButton, ListItemIcon, ListItemText, Divider } from '@mui/material';
import {
  ArrowUpward,
  ArrowDownward,
  SwapHoriz,
  GroupWork,
  Delete,
} from '@mui/icons-material';
import BottomSheet from './BottomSheet';

const ExerciseOptionsMenu = ({
  open,
  onClose,
  exerciseName,
  onMoveUp,
  onMoveDown,
  onReplace,
  onAddToSuperset,
  onRemove,
  canMoveUp = true,
  canMoveDown = true,
}) => {
  const handleAction = (action) => {
    onClose();
    action?.();
  };

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title={exerciseName || 'Exercise Options'}
      maxHeight="50vh"
    >
      <List disablePadding>
        {/* Move Up */}
        <ListItemButton
          onClick={() => handleAction(onMoveUp)}
          disabled={!canMoveUp}
          sx={{ py: 1.5 }}
        >
          <ListItemIcon sx={{ minWidth: 40 }}>
            <ArrowUpward color={canMoveUp ? 'primary' : 'disabled'} />
          </ListItemIcon>
          <ListItemText
            primary="Move Up"
            primaryTypographyProps={{ fontWeight: 500 }}
          />
        </ListItemButton>
        
        {/* Move Down */}
        <ListItemButton
          onClick={() => handleAction(onMoveDown)}
          disabled={!canMoveDown}
          sx={{ py: 1.5 }}
        >
          <ListItemIcon sx={{ minWidth: 40 }}>
            <ArrowDownward color={canMoveDown ? 'primary' : 'disabled'} />
          </ListItemIcon>
          <ListItemText
            primary="Move Down"
            primaryTypographyProps={{ fontWeight: 500 }}
          />
        </ListItemButton>
        
        <Divider sx={{ my: 1 }} />
        
        {/* Replace Exercise */}
        <ListItemButton
          onClick={() => handleAction(onReplace)}
          sx={{ py: 1.5 }}
        >
          <ListItemIcon sx={{ minWidth: 40 }}>
            <SwapHoriz color="primary" />
          </ListItemIcon>
          <ListItemText
            primary="Replace Exercise"
            primaryTypographyProps={{ fontWeight: 500 }}
          />
        </ListItemButton>
        
        {/* Add to Superset */}
        <ListItemButton
          onClick={() => handleAction(onAddToSuperset)}
          sx={{ py: 1.5 }}
        >
          <ListItemIcon sx={{ minWidth: 40 }}>
            <GroupWork color="primary" />
          </ListItemIcon>
          <ListItemText
            primary="Add to Superset"
            primaryTypographyProps={{ fontWeight: 500 }}
          />
        </ListItemButton>
        
        <Divider sx={{ my: 1 }} />
        
        {/* Remove */}
        <ListItemButton
          onClick={() => handleAction(onRemove)}
          sx={{ py: 1.5 }}
        >
          <ListItemIcon sx={{ minWidth: 40 }}>
            <Delete color="error" />
          </ListItemIcon>
          <ListItemText
            primary="Remove"
            primaryTypographyProps={{ fontWeight: 500, color: 'error.main' }}
          />
        </ListItemButton>
      </List>
    </BottomSheet>
  );
};

ExerciseOptionsMenu.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  exerciseName: PropTypes.string,
  onMoveUp: PropTypes.func,
  onMoveDown: PropTypes.func,
  onReplace: PropTypes.func,
  onAddToSuperset: PropTypes.func,
  onRemove: PropTypes.func,
  canMoveUp: PropTypes.bool,
  canMoveDown: PropTypes.bool,
};

export default ExerciseOptionsMenu;
