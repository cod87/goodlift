import { useState } from 'react';
import PropTypes from 'prop-types';
import {
  Card,
  CardContent,
  Typography,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Box,
  Chip,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
} from '@mui/material';
import { 
  Delete, 
  Edit,
} from '@mui/icons-material';
import { deleteCustomIngredient } from '../../utils/nutritionStorage';

/**
 * CustomIngredientsList - Component to display and manage custom ingredients
 * Allows users to:
 * - View all custom ingredients with their nutrition info
 * - Edit existing custom ingredients
 * - Delete custom ingredients
 * 
 * Visual style matches SavedRecipes for consistency
 */
const CustomIngredientsList = ({ customIngredients, onEdit, onIngredientsUpdate }) => {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [ingredientToDelete, setIngredientToDelete] = useState(null);

  const handleDeleteClick = (ingredient) => {
    setIngredientToDelete(ingredient);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (ingredientToDelete) {
      try {
        await deleteCustomIngredient(ingredientToDelete.id);
        if (onIngredientsUpdate) {
          onIngredientsUpdate();
        }
      } catch (error) {
        console.error('Error deleting custom ingredient:', error);
      }
    }
    setDeleteDialogOpen(false);
    setIngredientToDelete(null);
  };

  if (customIngredients.length === 0) {
    return (
      <Card sx={{ mb: 2, boxShadow: 1 }}>
        <CardContent sx={{ py: 2, '&:last-child': { pb: 2 } }}>
          <Typography color="text.secondary" align="center" sx={{ py: 2, fontSize: '0.9rem' }}>
            No custom ingredients yet. Add ingredients through the meal logging feature.
          </Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card sx={{ mb: 2, boxShadow: 1 }}>
        <CardContent sx={{ py: 2, '&:last-child': { pb: 2 } }}>
          <Typography variant="h6" gutterBottom>
            Custom Ingredients ({customIngredients.length})
          </Typography>
          <List disablePadding>
            {customIngredients.map((ingredient, index) => (
              <Box key={ingredient.id}>
                {index > 0 && <Divider sx={{ my: 0.5 }} />}
                <ListItem
                  sx={{ px: 0, py: 1.5 }}
                  secondaryAction={
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      <IconButton edge="end" onClick={() => onEdit(ingredient)} size="small">
                        <Edit fontSize="small" />
                      </IconButton>
                      <IconButton edge="end" onClick={() => handleDeleteClick(ingredient)} color="error" size="small">
                        <Delete fontSize="small" />
                      </IconButton>
                    </Box>
                  }
                >
                  <ListItemText
                    primary={
                      <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                        {ingredient.name}
                      </Typography>
                    }
                    secondary={
                      <Box component="span">
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                          {ingredient.standard_portion} ({ingredient.portion_grams}g)
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mt: 0.5 }}>
                          <Chip 
                            label={`${ingredient.calories.toFixed(0)} cal`} 
                            size="small" 
                            sx={{ height: 20, fontSize: '0.7rem', bgcolor: 'background.paper' }}
                          />
                          <Chip 
                            label={`P: ${ingredient.protein.toFixed(1)}g`} 
                            size="small" 
                            sx={{ height: 20, fontSize: '0.7rem', bgcolor: 'background.paper', color: 'text.secondary' }}
                          />
                          <Chip 
                            label={`C: ${ingredient.carbs.toFixed(1)}g`} 
                            size="small" 
                            sx={{ height: 20, fontSize: '0.7rem', bgcolor: 'background.paper', color: 'text.secondary' }}
                          />
                          <Chip 
                            label={`F: ${ingredient.fat.toFixed(1)}g`} 
                            size="small" 
                            sx={{ height: 20, fontSize: '0.7rem', bgcolor: 'background.paper', color: 'text.secondary' }}
                          />
                        </Box>
                      </Box>
                    }
                  />
                </ListItem>
              </Box>
            ))}
          </List>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Custom Ingredient</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete &quot;{ingredientToDelete?.name}&quot;? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)} size="small">Cancel</Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained" size="small">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

CustomIngredientsList.propTypes = {
  customIngredients: PropTypes.array.isRequired,
  onEdit: PropTypes.func.isRequired,
  onIngredientsUpdate: PropTypes.func.isRequired,
};

export default CustomIngredientsList;
