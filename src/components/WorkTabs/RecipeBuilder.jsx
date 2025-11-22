import { useState, useEffect, useCallback } from 'react';
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
  ListItemText,
  IconButton,
  Chip,
  CircularProgress,
  Autocomplete,
  Divider,
} from '@mui/material';
import { Delete, Add } from '@mui/icons-material';
import { saveRecipe } from '../../utils/nutritionStorage';

// USDA FoodData Central API configuration
const USDA_API_KEY = 'BkPRuRllUAA6YDWRMu68wGf0du7eoHUWFZuK9m7N';
const USDA_API_BASE_URL = 'https://api.nal.usda.gov/fdc/v1';

// USDA Nutrient IDs
const NUTRIENT_IDS = {
  CALORIES: 1008,
  PROTEIN: 1003,
  CARBS: 1005,
  FAT: 1004,
  FIBER: 1079,
};

/**
 * RecipeBuilder - Dialog component for creating and editing custom recipes
 * Allows users to:
 * - Add multiple foods with their weights
 * - Calculate total nutrition
 * - Save recipe for later use
 */
const RecipeBuilder = ({ open, onClose, editRecipe = null, onSave }) => {
  const [recipeName, setRecipeName] = useState('');
  const [recipeDescription, setRecipeDescription] = useState('');
  const [foods, setFoods] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [autocompleteOpen, setAutocompleteOpen] = useState(false);
  const [error, setError] = useState('');

  // Load recipe data if editing
  useEffect(() => {
    if (editRecipe) {
      setRecipeName(editRecipe.name || '');
      setRecipeDescription(editRecipe.description || '');
      setFoods(editRecipe.foods || []);
    } else {
      // Reset form for new recipe
      setRecipeName('');
      setRecipeDescription('');
      setFoods([]);
    }
  }, [editRecipe, open]);

  const searchFoods = useCallback(async (query) => {
    if (!query || query.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    setError('');

    try {
      const response = await fetch(
        `${USDA_API_BASE_URL}/foods/search?api_key=${USDA_API_KEY}&query=${encodeURIComponent(query)}&pageSize=5&dataType=Foundation`
      );

      if (!response.ok) {
        throw new Error('Failed to search foods');
      }

      const data = await response.json();
      setSearchResults(data.foods || []);
    } catch (err) {
      console.error('Error searching foods:', err);
      setError('Failed to search foods. Please try again.');
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  }, []);

  // Debounce search input
  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(() => {
      searchFoods(searchQuery);
    }, 500);
    
    return () => clearTimeout(timer);
  }, [searchQuery, searchFoods]);

  const getNutrient = (food, nutrientId) => {
    const nutrient = food.foodNutrients?.find(n => n.nutrientId === nutrientId);
    return nutrient?.value || 0;
  };

  const calculateNutrition = (food, grams) => {
    const multiplier = grams / 100;
    return {
      calories: getNutrient(food, NUTRIENT_IDS.CALORIES) * multiplier,
      protein: getNutrient(food, NUTRIENT_IDS.PROTEIN) * multiplier,
      carbs: getNutrient(food, NUTRIENT_IDS.CARBS) * multiplier,
      fat: getNutrient(food, NUTRIENT_IDS.FAT) * multiplier,
      fiber: getNutrient(food, NUTRIENT_IDS.FIBER) * multiplier,
    };
  };

  const handleAddFood = (food, grams = 100) => {
    const nutrition = calculateNutrition(food, grams);
    const newFood = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
      fdcId: food.fdcId,
      name: food.description,
      grams,
      nutrition,
    };

    setFoods([...foods, newFood]);
    setSearchQuery('');
    setSearchResults([]);
    setAutocompleteOpen(false);
  };

  const handleRemoveFood = (foodId) => {
    setFoods(foods.filter(f => f.id !== foodId));
  };

  const handleUpdateGrams = (foodId, newGrams, foodData) => {
    const grams = Math.max(1, parseFloat(newGrams) || 0);
    setFoods(foods.map(f => {
      if (f.id === foodId) {
        // Recalculate nutrition with new grams
        const nutrition = calculateNutrition(foodData, grams);
        return { ...f, grams, nutrition };
      }
      return f;
    }));
  };

  const getTotalNutrition = () => {
    return foods.reduce(
      (totals, food) => ({
        calories: totals.calories + food.nutrition.calories,
        protein: totals.protein + food.nutrition.protein,
        carbs: totals.carbs + food.nutrition.carbs,
        fat: totals.fat + food.nutrition.fat,
        fiber: totals.fiber + food.nutrition.fiber,
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 }
    );
  };

  const getTotalWeight = () => {
    return foods.reduce((total, food) => total + food.grams, 0);
  };

  const handleSave = async () => {
    if (!recipeName.trim()) {
      setError('Please enter a recipe name');
      return;
    }

    if (foods.length === 0) {
      setError('Please add at least one food to the recipe');
      return;
    }

    const totalNutrition = getTotalNutrition();
    const totalWeight = getTotalWeight();

    const recipe = {
      id: editRecipe?.id || `recipe-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
      name: recipeName.trim(),
      description: recipeDescription.trim(),
      foods,
      totalNutrition,
      totalWeight,
      createdAt: editRecipe?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      await saveRecipe(recipe);
      if (onSave) {
        onSave(recipe);
      }
      handleClose();
    } catch (err) {
      console.error('Error saving recipe:', err);
      setError('Failed to save recipe. Please try again.');
    }
  };

  const handleClose = () => {
    setRecipeName('');
    setRecipeDescription('');
    setFoods([]);
    setSearchQuery('');
    setSearchResults([]);
    setError('');
    onClose();
  };

  const totalNutrition = getTotalNutrition();
  const totalWeight = getTotalWeight();

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>{editRecipe ? 'Edit Recipe' : 'Create New Recipe'}</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          {/* Recipe Name and Description */}
          <TextField
            fullWidth
            label="Recipe Name"
            value={recipeName}
            onChange={(e) => setRecipeName(e.target.value)}
            placeholder="e.g., Protein Smoothie, Chicken Salad"
            required
            size="small"
          />
          <TextField
            fullWidth
            label="Description (optional)"
            value={recipeDescription}
            onChange={(e) => setRecipeDescription(e.target.value)}
            placeholder="Brief description of the recipe"
            multiline
            rows={2}
            size="small"
          />

          {/* Food Search */}
          <Box>
            <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600 }}>
              Add Foods
            </Typography>
            <Autocomplete
              fullWidth
              open={autocompleteOpen && searchResults.length > 0}
              onOpen={() => setAutocompleteOpen(true)}
              onClose={() => setAutocompleteOpen(false)}
              options={searchResults}
              loading={searching}
              getOptionLabel={(option) => option.description || ''}
              filterOptions={(x) => x}
              isOptionEqualToValue={(option, value) => option.fdcId === value.fdcId}
              onChange={(event, value) => {
                if (value) {
                  handleAddFood(value);
                }
              }}
              inputValue={searchQuery}
              onInputChange={(event, newInputValue, reason) => {
                if (reason === 'input') {
                  setSearchQuery(newInputValue);
                }
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  placeholder="Search for foods to add..."
                  size="small"
                  InputProps={{
                    ...params.InputProps,
                    startAdornment: <Add fontSize="small" sx={{ mr: 0.5, color: 'text.secondary' }} />,
                    endAdornment: (
                      <>
                        {searching ? <CircularProgress color="inherit" size={20} /> : null}
                        {params.InputProps.endAdornment}
                      </>
                    ),
                  }}
                />
              )}
              renderOption={(props, food) => {
                const nutrition = calculateNutrition(food, 100);
                return (
                  <li {...props} key={food.fdcId}>
                    <Box sx={{ width: '100%' }}>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {food.description}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5, flexWrap: 'wrap' }}>
                        <Chip label={`${nutrition.calories.toFixed(0)} cal`} size="small" sx={{ height: 20, fontSize: '0.7rem' }} />
                        <Chip label={`P: ${nutrition.protein.toFixed(1)}g`} size="small" color="primary" sx={{ height: 20, fontSize: '0.7rem' }} />
                      </Box>
                    </Box>
                  </li>
                );
              }}
              noOptionsText={searchQuery.length < 2 ? "Type at least 2 characters" : "No foods found"}
            />
          </Box>

          {/* Added Foods List */}
          {foods.length > 0 && (
            <Box>
              <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600 }}>
                Recipe Ingredients ({foods.length})
              </Typography>
              <List disablePadding sx={{ border: 1, borderColor: 'divider', borderRadius: 1 }}>
                {foods.map((food, index) => (
                  <Box key={food.id}>
                    {index > 0 && <Divider />}
                    <ListItem sx={{ py: 1.5 }}>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                            <Typography variant="body2" sx={{ fontWeight: 500, flex: 1 }}>
                              {food.name}
                            </Typography>
                            <TextField
                              type="number"
                              value={food.grams}
                              onChange={(e) => handleUpdateGrams(food.id, e.target.value, { 
                                fdcId: food.fdcId, 
                                description: food.name,
                                foodNutrients: Object.keys(NUTRIENT_IDS).map(key => ({
                                  nutrientId: NUTRIENT_IDS[key],
                                  value: food.nutrition[key.toLowerCase()] / (food.grams / 100)
                                }))
                              })}
                              size="small"
                              sx={{ width: 80 }}
                              InputProps={{
                                endAdornment: <Typography variant="caption" sx={{ ml: 0.5 }}>g</Typography>,
                              }}
                              inputProps={{ min: 1, step: 1 }}
                            />
                            <IconButton edge="end" onClick={() => handleRemoveFood(food.id)} color="error" size="small">
                              <Delete fontSize="small" />
                            </IconButton>
                          </Box>
                        }
                        secondary={
                          <Box component="span" sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mt: 0.5 }}>
                            <Chip label={`${food.nutrition.calories.toFixed(0)} cal`} size="small" sx={{ height: 20, fontSize: '0.7rem' }} />
                            <Chip label={`P: ${food.nutrition.protein.toFixed(1)}g`} size="small" color="primary" sx={{ height: 20, fontSize: '0.7rem' }} />
                            <Chip label={`C: ${food.nutrition.carbs.toFixed(1)}g`} size="small" color="secondary" sx={{ height: 20, fontSize: '0.7rem' }} />
                            <Chip label={`F: ${food.nutrition.fat.toFixed(1)}g`} size="small" color="warning" sx={{ height: 20, fontSize: '0.7rem' }} />
                          </Box>
                        }
                      />
                    </ListItem>
                  </Box>
                ))}
              </List>
            </Box>
          )}

          {/* Total Nutrition Summary */}
          {foods.length > 0 && (
            <Box sx={{ p: 2, bgcolor: 'primary.50', borderRadius: 1, border: 1, borderColor: 'primary.200' }}>
              <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600, mb: 1 }}>
                Total Recipe Nutrition ({totalWeight}g)
              </Typography>
              <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                <Chip label={`${totalNutrition.calories.toFixed(0)} cal`} size="small" />
                <Chip label={`Protein: ${totalNutrition.protein.toFixed(1)}g`} color="primary" size="small" />
                <Chip label={`Carbs: ${totalNutrition.carbs.toFixed(1)}g`} color="secondary" size="small" />
                <Chip label={`Fat: ${totalNutrition.fat.toFixed(1)}g`} color="warning" size="small" />
                <Chip label={`Fiber: ${totalNutrition.fiber.toFixed(1)}g`} color="success" size="small" />
              </Box>
            </Box>
          )}

          {error && (
            <Typography color="error" variant="body2">
              {error}
            </Typography>
          )}
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handleClose} size="small">Cancel</Button>
        <Button onClick={handleSave} variant="contained" size="small">
          {editRecipe ? 'Update Recipe' : 'Save Recipe'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

RecipeBuilder.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  editRecipe: PropTypes.object,
  onSave: PropTypes.func,
};

export default RecipeBuilder;
