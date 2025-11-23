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
  Divider,
  Paper,
  Alert,
  InputAdornment,
} from '@mui/material';
import { Delete, Add, Search } from '@mui/icons-material';
import { saveRecipe } from '../../utils/nutritionStorage';
import { FOOD_SEARCH_CONFIG } from '../../utils/foodSearchUtils';

// Open Food Facts API configuration
const OFF_API_BASE_URL = 'https://world.openfoodfacts.org/cgi/search.pl';
const OFF_USER_AGENT = 'GoodLift-NutritionTracker/1.0';

// Cache for API responses
const apiCache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * RecipeBuilder - Dialog component for creating and editing custom recipes
 * Allows users to:
 * - Add multiple foods with their weights using Open Food Facts search
 * - Search for products with brand, name, and nutrition information
 * - Calculate total nutrition from multiple ingredients
 * - Save recipe for later use
 */
const RecipeBuilder = ({ open, onClose, editRecipe = null, onSave }) => {
  const [recipeName, setRecipeName] = useState('');
  const [recipeDescription, setRecipeDescription] = useState('');
  const [foods, setFoods] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
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
      setError('Please enter at least 2 characters to search');
      return;
    }

    // Check cache first
    const cacheKey = `recipe_search_${query.toLowerCase()}`;
    const cachedData = apiCache.get(cacheKey);
    if (cachedData && Date.now() - cachedData.timestamp < CACHE_DURATION) {
      setSearchResults(cachedData.results);
      return;
    }

    setSearching(true);
    setError('');

    try {
      const params = new URLSearchParams({
        search_terms: query,
        search_simple: '1',
        action: 'process',
        json: '1',
        page_size: '20',
        fields: 'code,product_name,brands,nutriments,image_url,image_small_url'
      });

      const response = await fetch(`${OFF_API_BASE_URL}?${params.toString()}`, {
        headers: {
          'User-Agent': OFF_USER_AGENT,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to search foods');
      }

      const data = await response.json();
      const products = data.products || [];
      
      // Process and normalize products
      const processedProducts = products
        .filter(product => product.product_name && product.product_name.trim() !== '')
        .map(product => ({
          ...product,
          id: product.code,
          name: product.product_name,
          brand: product.brands || '',
          image: product.image_small_url || product.image_url || '',
          nutriments: product.nutriments || {},
        }))
        .slice(0, 15); // Limit to 15 results for recipes
      
      // Cache the results
      apiCache.set(cacheKey, {
        results: processedProducts,
        timestamp: Date.now(),
      });

      setSearchResults(processedProducts);
    } catch (err) {
      console.error('Error searching foods:', err);
      setError('Failed to search foods. Please try again.');
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  }, []);

  /**
   * Get nutrition value from Open Food Facts nutriments object
   */
  const getNutrient = (nutriments, key, defaultValue = 0) => {
    const value = nutriments[`${key}_100g`] || nutriments[key] || defaultValue;
    return typeof value === 'number' ? value : defaultValue;
  };

  /**
   * Calculate nutrition values based on portion size
   */
  const calculateNutrition = (food, grams) => {
    const nutriments = food.nutriments || {};
    const multiplier = grams / 100;
    
    // Energy handling
    let calories = getNutrient(nutriments, 'energy-kcal', 0);
    if (calories === 0) {
      const energy = getNutrient(nutriments, 'energy', 0);
      calories = energy < 1000 ? energy : energy / 4.184;
    }
    
    return {
      calories: calories * multiplier,
      protein: getNutrient(nutriments, 'proteins', 0) * multiplier,
      carbs: getNutrient(nutriments, 'carbohydrates', 0) * multiplier,
      fat: getNutrient(nutriments, 'fat', 0) * multiplier,
      fiber: getNutrient(nutriments, 'fiber', 0) * multiplier,
    };
  };

  const handleAddFood = (food, grams = 100) => {
    const nutrition = calculateNutrition(food, grams);
    const newFood = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
      code: food.id || food.code,
      name: food.name || food.product_name,
      brand: food.brand || food.brands || '',
      grams,
      nutrition,
      // Store the nutriments data for recalculation
      nutriments: food.nutriments || {},
    };

    setFoods([...foods, newFood]);
    setSearchQuery('');
    setSearchResults([]);
  };

  const handleRemoveFood = (foodId) => {
    setFoods(foods.filter(f => f.id !== foodId));
  };

  const handleUpdateGrams = (foodId, newGrams) => {
    const grams = Math.max(1, parseFloat(newGrams) || 0);
    setFoods(foods.map(f => {
      if (f.id === foodId) {
        // Recalculate nutrition with new grams using stored nutriments
        const nutrition = calculateNutrition({ nutriments: f.nutriments }, grams);
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
            <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
              <TextField
                fullWidth
                placeholder="Enter food name to search..."
                size="small"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    searchFoods(searchQuery);
                  }
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search fontSize="small" color="action" />
                    </InputAdornment>
                  ),
                }}
              />
              <Button
                variant="contained"
                onClick={() => searchFoods(searchQuery)}
                disabled={searching || searchQuery.trim().length < 2}
                sx={{ minWidth: 100 }}
              >
                {searching ? <CircularProgress size={20} color="inherit" /> : 'Search'}
              </Button>
            </Box>

            {error && (
              <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
                {error}
              </Alert>
            )}

            {/* Search Results */}
            {searchResults.length > 0 && (
              <Paper variant="outlined" sx={{ maxHeight: 250, overflow: 'auto', mb: 2 }}>
                <List disablePadding>
                  {searchResults.map((food, index) => {
                    const nutrition = calculateNutrition(food, 100);
                    const brand = food.brand || food.brands || '';
                    return (
                      <Box key={food.id || food.code || index}>
                        {index > 0 && <Divider />}
                        <ListItem
                          button
                          onClick={() => handleAddFood(food)}
                          sx={{ py: 1.5 }}
                        >
                          <ListItemText
                            primary={
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                <Typography variant="body2" sx={{ fontWeight: 500, flex: 1 }}>
                                  {food.name || food.product_name}
                                </Typography>
                                {brand && (
                                  <Chip 
                                    label={brand} 
                                    size="small" 
                                    color="default"
                                    sx={{ height: 20, fontSize: '0.7rem', fontWeight: 600 }} 
                                  />
                                )}
                              </Box>
                            }
                            secondary={
                              <Box component="span" sx={{ display: 'flex', gap: 0.5, mt: 0.5, flexWrap: 'wrap' }}>
                                <Chip label={nutrition.calories > 0 ? `${nutrition.calories.toFixed(0)} cal` : 'N/A'} size="small" sx={{ height: 20, fontSize: '0.7rem' }} />
                                {nutrition.protein > 0 && <Chip label={`P: ${nutrition.protein.toFixed(1)}g`} size="small" color="primary" sx={{ height: 20, fontSize: '0.7rem' }} />}
                              </Box>
                            }
                          />
                        </ListItem>
                      </Box>
                    );
                  })}
                </List>
              </Paper>
            )}

            {!searching && searchResults.length === 0 && searchQuery.trim().length >= 2 && !error && (
              <Alert severity="info" sx={{ mb: 2 }}>
                No foods found. Try a different search term.
              </Alert>
            )}
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
                    <ListItem sx={{ py: 1 }}>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.25 }}>
                            <Typography variant="body2" sx={{ fontWeight: 500, flex: 1, fontSize: '0.875rem' }}>
                              {food.name}
                            </Typography>
                            <TextField
                              type="number"
                              value={food.grams}
                              onChange={(e) => handleUpdateGrams(food.id, e.target.value)}
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
                          <Box component="span" sx={{ display: 'flex', gap: 0.4, flexWrap: 'wrap', mt: 0.5 }}>
                            <Chip label={`${food.nutrition.calories.toFixed(0)} cal`} size="small" sx={{ height: 18, fontSize: '0.65rem' }} />
                            <Chip label={`P: ${food.nutrition.protein.toFixed(1)}g`} size="small" color="primary" sx={{ height: 18, fontSize: '0.65rem' }} />
                            <Chip label={`C: ${food.nutrition.carbs.toFixed(1)}g`} size="small" color="secondary" sx={{ height: 18, fontSize: '0.65rem' }} />
                            <Chip label={`F: ${food.nutrition.fat.toFixed(1)}g`} size="small" color="warning" sx={{ height: 18, fontSize: '0.65rem' }} />
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
