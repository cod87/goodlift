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
  TextField,
} from '@mui/material';
import { Delete, Edit, Add } from '@mui/icons-material';
import { deleteRecipe } from '../../utils/nutritionStorage';

/**
 * SavedRecipes - Component to display and manage saved recipes
 * Allows users to:
 * - View all saved recipes with their nutrition info
 * - Edit existing recipes
 * - Delete recipes
 * - Add recipes to daily log with custom portion sizes
 */
const SavedRecipes = ({ recipes, onEdit, onRecipesUpdate, onAddToLog }) => {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [recipeToDelete, setRecipeToDelete] = useState(null);
  const [addPortionDialogOpen, setAddPortionDialogOpen] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [portionSize, setPortionSize] = useState(1);

  const handleDeleteClick = (recipe) => {
    setRecipeToDelete(recipe);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (recipeToDelete) {
      try {
        await deleteRecipe(recipeToDelete.id);
        if (onRecipesUpdate) {
          onRecipesUpdate();
        }
      } catch (error) {
        console.error('Error deleting recipe:', error);
      }
    }
    setDeleteDialogOpen(false);
    setRecipeToDelete(null);
  };

  const handleAddPortionClick = (recipe) => {
    setSelectedRecipe(recipe);
    setPortionSize(1);
    setAddPortionDialogOpen(true);
  };

  const handleAddPortion = () => {
    if (selectedRecipe && portionSize > 0) {
      const portionMultiplier = portionSize;
      const portionNutrition = {
        calories: selectedRecipe.totalNutrition.calories * portionMultiplier,
        protein: selectedRecipe.totalNutrition.protein * portionMultiplier,
        carbs: selectedRecipe.totalNutrition.carbs * portionMultiplier,
        fat: selectedRecipe.totalNutrition.fat * portionMultiplier,
        fiber: selectedRecipe.totalNutrition.fiber * portionMultiplier,
      };

      const entry = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
        date: new Date().toISOString(),
        foodName: `${selectedRecipe.name} (${portionSize}x portion)`,
        grams: selectedRecipe.totalWeight * portionMultiplier,
        nutrition: portionNutrition,
        isRecipe: true,
        recipeId: selectedRecipe.id,
        portionSize,
      };

      if (onAddToLog) {
        onAddToLog(entry);
      }

      setAddPortionDialogOpen(false);
      setSelectedRecipe(null);
      setPortionSize(1);
    }
  };

  if (recipes.length === 0) {
    return (
      <Card>
        <CardContent sx={{ py: 2, '&:last-child': { pb: 2 } }}>
          <Typography color="text.secondary" align="center" sx={{ py: 2, fontSize: '0.9rem' }}>
            No saved recipes yet. Click &quot;Create New Recipe&quot; to get started.
          </Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardContent sx={{ py: 2, '&:last-child': { pb: 2 } }}>
          <Typography variant="h6" gutterBottom>
            Saved Recipes ({recipes.length})
          </Typography>
          <List disablePadding>
            {recipes.map((recipe, index) => (
              <Box key={recipe.id}>
                {index > 0 && <Divider sx={{ my: 1 }} />}
                <ListItem
                  sx={{ px: 0, py: 1 }}
                  secondaryAction={
                    <Box>
                      <IconButton edge="end" onClick={() => handleAddPortionClick(recipe)} color="primary" size="small" sx={{ mr: 0.5 }}>
                        <Add fontSize="small" />
                      </IconButton>
                      <IconButton edge="end" onClick={() => onEdit(recipe)} size="small" sx={{ mr: 0.5 }}>
                        <Edit fontSize="small" />
                      </IconButton>
                      <IconButton edge="end" onClick={() => handleDeleteClick(recipe)} color="error" size="small">
                        <Delete fontSize="small" />
                      </IconButton>
                    </Box>
                  }
                >
                  <ListItemText
                    primary={
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {recipe.name}
                        </Typography>
                        {recipe.description && (
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                            {recipe.description}
                          </Typography>
                        )}
                      </Box>
                    }
                    secondary={
                      <Box component="span" sx={{ mt: 0.5, display: 'block' }}>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                          {recipe.foods?.length || 0} ingredient{recipe.foods?.length !== 1 ? 's' : ''} • {recipe.totalWeight}g total
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                          <Chip label={`${recipe.totalNutrition.calories.toFixed(0)} cal`} size="small" sx={{ height: 20, fontSize: '0.7rem' }} />
                          <Chip label={`P: ${recipe.totalNutrition.protein.toFixed(1)}g`} size="small" color="primary" sx={{ height: 20, fontSize: '0.7rem' }} />
                          <Chip label={`C: ${recipe.totalNutrition.carbs.toFixed(1)}g`} size="small" color="secondary" sx={{ height: 20, fontSize: '0.7rem' }} />
                          <Chip label={`F: ${recipe.totalNutrition.fat.toFixed(1)}g`} size="small" color="warning" sx={{ height: 20, fontSize: '0.7rem' }} />
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
        <DialogTitle>Delete Recipe</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete &quot;{recipeToDelete?.name}&quot;? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)} size="small">Cancel</Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained" size="small">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Portion Dialog */}
      <Dialog open={addPortionDialogOpen} onClose={() => setAddPortionDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Recipe to Log</DialogTitle>
        <DialogContent>
          {selectedRecipe && (
            <Box sx={{ pt: 1 }}>
              <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600 }}>
                {selectedRecipe.name}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom sx={{ mb: 2 }}>
                Full recipe: {selectedRecipe.totalWeight}g
              </Typography>
              
              <TextField
                fullWidth
                type="number"
                label="Portion Size"
                value={portionSize}
                onChange={(e) => setPortionSize(Math.max(0.01, parseFloat(e.target.value) || 0))}
                helperText="1 = full recipe, 0.5 = half recipe, 2 = double recipe"
                inputProps={{ min: 0.01, step: 0.25 }}
                size="small"
                sx={{ mb: 2 }}
              />

              <Typography variant="body2" color="text.secondary" gutterBottom sx={{ mb: 1 }}>
                Nutrition for {portionSize}x portion ({(selectedRecipe.totalWeight * portionSize).toFixed(0)}g):
              </Typography>
              <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                <Chip label={`${(selectedRecipe.totalNutrition.calories * portionSize).toFixed(0)} cal`} size="small" />
                <Chip label={`Protein: ${(selectedRecipe.totalNutrition.protein * portionSize).toFixed(1)}g`} color="primary" size="small" />
                <Chip label={`Carbs: ${(selectedRecipe.totalNutrition.carbs * portionSize).toFixed(1)}g`} color="secondary" size="small" />
                <Chip label={`Fat: ${(selectedRecipe.totalNutrition.fat * portionSize).toFixed(1)}g`} color="warning" size="small" />
                <Chip label={`Fiber: ${(selectedRecipe.totalNutrition.fiber * portionSize).toFixed(1)}g`} color="success" size="small" />
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setAddPortionDialogOpen(false)} size="small">Cancel</Button>
          <Button onClick={handleAddPortion} variant="contained" size="small">
            Add to Log
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

SavedRecipes.propTypes = {
  recipes: PropTypes.array.isRequired,
  onEdit: PropTypes.func.isRequired,
  onRecipesUpdate: PropTypes.func.isRequired,
  onAddToLog: PropTypes.func.isRequired,
};

export default SavedRecipes;
