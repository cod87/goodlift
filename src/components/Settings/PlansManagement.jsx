/**
 * PlansManagement - Component for managing workout plans (active and inactive)
 * Shown in the Settings screen
 */

import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Alert,
} from '@mui/material';
import {
  PlayArrow as ActivateIcon,
  Delete as DeleteIcon,
  CheckCircle as ActiveIcon,
} from '@mui/icons-material';
import {
  getWorkoutPlans,
  deleteWorkoutPlan,
  setActivePlan,
  saveWorkoutPlan,
  getActivePlan,
} from '../../utils/storage';

const PlansManagement = () => {
  const [plans, setPlans] = useState([]);
  const [activePlanId, setActivePlanId] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [planToDelete, setPlanToDelete] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    try {
      const loadedPlans = await getWorkoutPlans();
      setPlans(loadedPlans);
      
      const active = await getActivePlan();
      setActivePlanId(active?.id || null);
    } catch (error) {
      console.error('Error loading plans:', error);
    }
  };

  const handleActivatePlan = async (plan) => {
    try {
      setLoading(true);
      
      // Deactivate all existing plans
      const allPlans = await getWorkoutPlans();
      for (const p of allPlans) {
        if (p.isActive) {
          p.isActive = false;
          await saveWorkoutPlan(p);
        }
      }
      
      // Activate the selected plan
      plan.isActive = true;
      await saveWorkoutPlan(plan);
      await setActivePlan(plan.id);
      
      await loadPlans();
    } catch (error) {
      console.error('Error activating plan:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDeleteDialog = (plan) => {
    setPlanToDelete(plan);
    setDeleteDialogOpen(true);
  };

  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setPlanToDelete(null);
  };

  const handleConfirmDelete = async () => {
    if (!planToDelete) return;
    
    try {
      setLoading(true);
      await deleteWorkoutPlan(planToDelete.id);
      await loadPlans();
      handleCloseDeleteDialog();
    } catch (error) {
      console.error('Error deleting plan:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'Unknown';
    const date = new Date(timestamp);
    return date.toLocaleDateString();
  };

  const activePlans = plans.filter(p => p.id === activePlanId);
  const inactivePlans = plans.filter(p => p.id !== activePlanId);

  return (
    <Box>
      {plans.length === 0 ? (
        <Alert severity="info">
          You don&apos;t have any workout plans yet. Create one to get started!
        </Alert>
      ) : (
        <>
          {/* Active Plan */}
          {activePlans.length > 0 && (
            <>
              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                Active Plan
              </Typography>
              <List sx={{ mb: 2 }}>
                {activePlans.map((plan) => (
                  <ListItem
                    key={plan.id}
                    sx={{
                      bgcolor: 'success.light',
                      borderRadius: 1,
                      mb: 1,
                    }}
                  >
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <ActiveIcon color="success" fontSize="small" />
                          <Typography variant="body1" fontWeight={600}>
                            {plan.name}
                          </Typography>
                        </Box>
                      }
                      secondary={
                        <Typography variant="caption" color="text.secondary">
                          Created: {formatDate(plan.createdAt)} • {plan.sessions?.length || 0} sessions
                        </Typography>
                      }
                    />
                    <ListItemSecondaryAction>
                      <IconButton
                        edge="end"
                        aria-label="delete"
                        onClick={() => handleOpenDeleteDialog(plan)}
                        disabled={loading}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>
            </>
          )}

          {/* Inactive Plans */}
          {inactivePlans.length > 0 && (
            <>
              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                Inactive Plans
              </Typography>
              <List>
                {inactivePlans.map((plan) => (
                  <ListItem
                    key={plan.id}
                    sx={{
                      bgcolor: 'background.paper',
                      borderRadius: 1,
                      mb: 1,
                      border: 1,
                      borderColor: 'divider',
                    }}
                  >
                    <ListItemText
                      primary={plan.name}
                      secondary={
                        <Typography variant="caption" color="text.secondary">
                          Created: {formatDate(plan.createdAt)} • {plan.sessions?.length || 0} sessions
                        </Typography>
                      }
                    />
                    <ListItemSecondaryAction>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <IconButton
                          edge="end"
                          aria-label="activate"
                          onClick={() => handleActivatePlan(plan)}
                          disabled={loading}
                          color="primary"
                        >
                          <ActivateIcon />
                        </IconButton>
                        <IconButton
                          edge="end"
                          aria-label="delete"
                          onClick={() => handleOpenDeleteDialog(plan)}
                          disabled={loading}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Box>
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>
            </>
          )}
        </>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleCloseDeleteDialog}
      >
        <DialogTitle>Delete Plan?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete &quot;{planToDelete?.name}&quot;?
            This will permanently remove all {planToDelete?.sessions?.length || 0} sessions in this plan.
            This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog} disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirmDelete}
            color="error"
            variant="contained"
            disabled={loading}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

PlansManagement.propTypes = {};

export default PlansManagement;
