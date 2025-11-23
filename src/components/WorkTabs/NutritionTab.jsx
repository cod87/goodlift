import { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  TextField,
  Button,
  Card,
  CardContent,
  Typography,
  Grid,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  Chip,
  CircularProgress,
  LinearProgress,
  Alert,
  Divider,
  Tabs,
  Tab,
  Paper,
  InputAdornment,
} from '@mui/material';
import {
  Add,
  Delete,
  Restaurant,
  TrendingUp,
  MenuBook,
  Search,
} from '@mui/icons-material';
import { getNutritionEntries, saveNutritionEntry, deleteNutritionEntry, getNutritionGoals, saveNutritionGoals, getRecipes } from '../../utils/nutritionStorage';
import RecipeBuilder from './RecipeBuilder';
import SavedRecipes from './SavedRecipes';

// USDA FoodData Central API configuration
const USDA_API_KEY = 'BkPRuRllUAA6YDWRMu68wGf0du7eoHUWFZuK9m7N';
const USDA_API_BASE_URL = 'https://api.nal.usda.gov/fdc/v1';

// USDA Nutrient IDs (FoodData Central standard nutrient identifiers)
const NUTRIENT_IDS = {
  CALORIES: 1008,  // Energy (kcal)
  PROTEIN: 1003,   // Protein (g)
  CARBS: 1005,     // Carbohydrate, by difference (g)
  FAT: 1004,       // Total lipid (fat) (g)
  FIBER: 1079,     // Fiber, total dietary (g)
};

/**
 * NutritionTab - Component for tracking nutrition using USDA FoodData Central API
 * Features:
 * - Search foods from USDA database
 * - Log consumed foods with portion sizes
 * - View daily nutrition summary
 * - Set and track nutrition goals
 * - Create and save custom recipes
 * - Log recipes with custom portion sizes
 */
const NutritionTab = () => {
  const [activeSubTab, setActiveSubTab] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [todayEntries, setTodayEntries] = useState([]);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedFood, setSelectedFood] = useState(null);
  const [portionGrams, setPortionGrams] = useState(100);
  const [goals, setGoals] = useState({
    calories: 2000,
    protein: 150,
    carbs: 250,
    fat: 65,
    fiber: 25,
  });
  const [showGoalsDialog, setShowGoalsDialog] = useState(false);
  const [error, setError] = useState('');
  const [recipes, setRecipes] = useState([]);
  const [showRecipeBuilder, setShowRecipeBuilder] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState(null);

  // Load today's entries, goals, and recipes on mount
  useEffect(() => {
    loadTodayEntries();
    loadGoals();
    loadRecipes();
  }, []);

  const loadRecipes = () => {
    const savedRecipes = getRecipes();
    setRecipes(savedRecipes);
  };

  const loadTodayEntries = () => {
    const entries = getNutritionEntries();
    const today = new Date().toDateString();
    const todayData = entries.filter(entry => new Date(entry.date).toDateString() === today);
    setTodayEntries(todayData);
  };

  const loadGoals = () => {
    const savedGoals = getNutritionGoals();
    if (savedGoals) {
      setGoals(savedGoals);
    }
  };

  const searchFoods = useCallback(async (query) => {
    if (!query || query.trim().length < 2) {
      setError('Please enter at least 2 characters to search');
      return;
    }

    setSearching(true);
    setError('');

    try {
      const response = await fetch(
        `${USDA_API_BASE_URL}/foods/search?api_key=${USDA_API_KEY}&query=${encodeURIComponent(query)}&pageSize=5&dataType=Foundation,SR%20Legacy`
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

  const handleSelectFood = (food) => {
    if (!food) return;
    setSelectedFood(food);
    setPortionGrams(100);
    setShowAddDialog(true);
    setSearchQuery('');
    setSearchResults([]);
  };

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

  const handleAddEntry = () => {
    if (!selectedFood || portionGrams <= 0) {
      return;
    }

    const nutrition = calculateNutrition(selectedFood, portionGrams);
    const entry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`, // Unique ID: timestamp + random 9-char string
      date: new Date().toISOString(),
      foodName: selectedFood.description,
      grams: portionGrams,
      nutrition,
    };

    saveNutritionEntry(entry);
    loadTodayEntries();
    setShowAddDialog(false);
    setSelectedFood(null);
    setSearchQuery('');
    setSearchResults([]);
  };

  const handleDeleteEntry = (entryId) => {
    deleteNutritionEntry(entryId);
    loadTodayEntries();
  };

  const handleSaveGoals = () => {
    saveNutritionGoals(goals);
    setShowGoalsDialog(false);
  };

  const handleCreateRecipe = () => {
    setEditingRecipe(null);
    setShowRecipeBuilder(true);
  };

  const handleEditRecipe = (recipe) => {
    setEditingRecipe(recipe);
    setShowRecipeBuilder(true);
  };

  const handleRecipeSaved = () => {
    loadRecipes();
  };

  const handleAddRecipeToLog = (entry) => {
    saveNutritionEntry(entry);
    loadTodayEntries();
    // Switch to diary tab to show the added entry
    setActiveSubTab(0);
  };

  const getTodayTotals = () => {
    return todayEntries.reduce(
      (totals, entry) => ({
        calories: totals.calories + entry.nutrition.calories,
        protein: totals.protein + entry.nutrition.protein,
        carbs: totals.carbs + entry.nutrition.carbs,
        fat: totals.fat + entry.nutrition.fat,
        fiber: totals.fiber + entry.nutrition.fiber,
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 }
    );
  };

  const totals = getTodayTotals();

  const NutrientProgress = ({ label, current, goal, unit = 'g', color = 'primary' }) => {
    const percentage = goal > 0 ? Math.min((current / goal) * 100, 100) : 0;
    
    return (
      <Box sx={{ mb: 0 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.3 }}>
          <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.85rem' }}>
            {label}
          </Typography>
          <Typography variant="body2" fontWeight="bold" sx={{ fontSize: '0.85rem' }}>
            {current.toFixed(1)} / {goal} {unit}
          </Typography>
        </Box>
        <LinearProgress 
          variant="determinate" 
          value={percentage} 
          color={color}
          sx={{ height: 6, borderRadius: 1 }}
        />
      </Box>
    );
  };

  NutrientProgress.propTypes = {
    label: PropTypes.string.isRequired,
    current: PropTypes.number.isRequired,
    goal: PropTypes.number.isRequired,
    unit: PropTypes.string,
    color: PropTypes.string,
  };

  return (
    <Box>
      {/* Sub-tabs for Diary and Recipes */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tabs 
          value={activeSubTab} 
          onChange={(e, newValue) => setActiveSubTab(newValue)}
          sx={{
            '& .MuiTab-root': {
              minHeight: 48,
              fontSize: '0.875rem',
              fontWeight: 600,
            },
          }}
        >
          <Tab 
            icon={<Restaurant fontSize="small" />} 
            label="Food Diary"
            iconPosition="start"
          />
          <Tab 
            icon={<MenuBook fontSize="small" />} 
            label="My Recipes"
            iconPosition="start"
          />
        </Tabs>
      </Box>

      {/* Food Diary Tab */}
      {activeSubTab === 0 && (
        <>
          {/* Manual Search Section with TextField and Button */}
          <Card sx={{ mb: 2 }}>
            <CardContent sx={{ py: 2, '&:last-child': { pb: 2 } }}>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <Restaurant fontSize="small" /> Add Food
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                <TextField
                  fullWidth
                  placeholder="Enter food name (e.g., chicken breast)..."
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
            <Paper variant="outlined" sx={{ maxHeight: 300, overflow: 'auto' }}>
              <List disablePadding>
                {searchResults.map((food, index) => {
                  const nutrition = calculateNutrition(food, 100);
                  return (
                    <Box key={food.fdcId}>
                      {index > 0 && <Divider />}
                      <ListItem
                        button
                        onClick={() => handleSelectFood(food)}
                        sx={{ py: 1.5 }}
                      >
                        <ListItemText
                          primary={
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                              {food.description}
                            </Typography>
                          }
                          secondary={
                            <Box component="span" sx={{ display: 'flex', gap: 0.5, mt: 0.5, flexWrap: 'wrap' }}>
                              <Chip label={`${nutrition.calories.toFixed(0)} cal`} size="small" sx={{ height: 20, fontSize: '0.7rem' }} />
                              <Chip label={`P: ${nutrition.protein.toFixed(1)}g`} size="small" color="primary" sx={{ height: 20, fontSize: '0.7rem' }} />
                              <Chip label={`C: ${nutrition.carbs.toFixed(1)}g`} size="small" color="secondary" sx={{ height: 20, fontSize: '0.7rem' }} />
                              <Chip label={`F: ${nutrition.fat.toFixed(1)}g`} size="small" color="warning" sx={{ height: 20, fontSize: '0.7rem' }} />
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
            <Alert severity="info" sx={{ mt: 2 }}>
              No foods found. Try a different search term.
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Daily Summary - More Compact */}
      <Card sx={{ mb: 2 }}>
        <CardContent sx={{ py: 2, '&:last-child': { pb: 2 } }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
            <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <TrendingUp fontSize="small" /> Today&apos;s Progress
            </Typography>
            <Button
              variant="outlined"
              size="small"
              onClick={() => setShowGoalsDialog(true)}
            >
              Set Goals
            </Button>
          </Box>

          <Grid container spacing={1.5}>
            <Grid item xs={12}>
              <NutrientProgress
                label="Calories"
                current={totals.calories}
                goal={goals.calories}
                unit="kcal"
                color="primary"
              />
            </Grid>
            <Grid item xs={12}>
              <NutrientProgress
                label="Protein"
                current={totals.protein}
                goal={goals.protein}
                color="primary"
              />
            </Grid>
            <Grid item xs={12}>
              <NutrientProgress
                label="Carbs"
                current={totals.carbs}
                goal={goals.carbs}
                color="secondary"
              />
            </Grid>
            <Grid item xs={12}>
              <NutrientProgress
                label="Fat"
                current={totals.fat}
                goal={goals.fat}
                color="warning"
              />
            </Grid>
            <Grid item xs={12}>
              <NutrientProgress
                label="Fiber"
                current={totals.fiber}
                goal={goals.fiber}
                color="success"
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Today's Entries - More Compact */}
      <Card>
        <CardContent sx={{ py: 2, '&:last-child': { pb: 2 } }}>
          <Typography variant="h6" gutterBottom>
            Today&apos;s Entries
          </Typography>
          {todayEntries.length === 0 ? (
            <Typography color="text.secondary" align="center" sx={{ py: 2, fontSize: '0.9rem' }}>
              No entries yet. Type in the search box above to add foods.
            </Typography>
          ) : (
            <List disablePadding>
              {todayEntries.map((entry, index) => (
                <Box key={entry.id}>
                  {index > 0 && <Divider sx={{ my: 0.5 }} />}
                  <ListItem
                    sx={{ px: 0, py: 1 }}
                    secondaryAction={
                      <IconButton edge="end" onClick={() => handleDeleteEntry(entry.id)} color="error" size="small">
                        <Delete fontSize="small" />
                      </IconButton>
                    }
                  >
                    <ListItemText
                      primary={
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {entry.foodName} ({entry.grams}g)
                        </Typography>
                      }
                      secondary={
                        <Box component="span" sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mt: 0.5 }}>
                          <Chip label={`${entry.nutrition.calories.toFixed(0)} cal`} size="small" sx={{ height: 20, fontSize: '0.7rem' }} />
                          <Chip label={`P: ${entry.nutrition.protein.toFixed(1)}g`} size="small" color="primary" sx={{ height: 20, fontSize: '0.7rem' }} />
                          <Chip label={`C: ${entry.nutrition.carbs.toFixed(1)}g`} size="small" color="secondary" sx={{ height: 20, fontSize: '0.7rem' }} />
                          <Chip label={`F: ${entry.nutrition.fat.toFixed(1)}g`} size="small" color="warning" sx={{ height: 20, fontSize: '0.7rem' }} />
                        </Box>
                      }
                    />
                  </ListItem>
                </Box>
              ))}
            </List>
          )}
        </CardContent>
      </Card>

      {/* Add Entry Dialog - Compact */}
      <Dialog open={showAddDialog} onClose={() => setShowAddDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ pb: 1 }}>Add Food Entry</DialogTitle>
        <DialogContent sx={{ py: 2 }}>
          {selectedFood && (
            <Box>
              <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 500 }}>
                {selectedFood.description}
              </Typography>
              <TextField
                fullWidth
                type="number"
                label="Amount (grams)"
                value={portionGrams}
                onChange={(e) => setPortionGrams(Math.max(1, parseFloat(e.target.value) || 0))}
                sx={{ mb: 2 }}
                inputProps={{ min: 1, step: 1 }}
                helperText="Enter the amount in grams you consumed"
                size="small"
              />
              <Typography variant="body2" color="text.secondary" gutterBottom sx={{ mb: 1 }}>
                Nutrition for {portionGrams}g:
              </Typography>
              <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                {(() => {
                  const nutrition = calculateNutrition(selectedFood, portionGrams);
                  return (
                    <>
                      <Chip label={`${nutrition.calories.toFixed(0)} cal`} size="small" />
                      <Chip label={`Protein: ${nutrition.protein.toFixed(1)}g`} color="primary" size="small" />
                      <Chip label={`Carbs: ${nutrition.carbs.toFixed(1)}g`} color="secondary" size="small" />
                      <Chip label={`Fat: ${nutrition.fat.toFixed(1)}g`} color="warning" size="small" />
                      <Chip label={`Fiber: ${nutrition.fiber.toFixed(1)}g`} color="success" size="small" />
                    </>
                  );
                })()}
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setShowAddDialog(false)} size="small">Cancel</Button>
          <Button onClick={handleAddEntry} variant="contained" size="small">
            Add Entry
          </Button>
        </DialogActions>
      </Dialog>

      {/* Goals Dialog - Compact */}
      <Dialog open={showGoalsDialog} onClose={() => setShowGoalsDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ pb: 1 }}>Set Daily Goals</DialogTitle>
        <DialogContent sx={{ py: 2 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mt: 1 }}>
            <TextField
              fullWidth
              type="number"
              label="Calories (kcal)"
              value={goals.calories}
              onChange={(e) => setGoals({ ...goals, calories: Math.max(0, parseFloat(e.target.value) || 0) })}
              inputProps={{ min: 0, step: 50 }}
              size="small"
            />
            <TextField
              fullWidth
              type="number"
              label="Protein (g)"
              value={goals.protein}
              onChange={(e) => setGoals({ ...goals, protein: Math.max(0, parseFloat(e.target.value) || 0) })}
              inputProps={{ min: 0, step: 5 }}
              size="small"
            />
            <TextField
              fullWidth
              type="number"
              label="Carbs (g)"
              value={goals.carbs}
              onChange={(e) => setGoals({ ...goals, carbs: Math.max(0, parseFloat(e.target.value) || 0) })}
              inputProps={{ min: 0, step: 5 }}
              size="small"
            />
            <TextField
              fullWidth
              type="number"
              label="Fat (g)"
              value={goals.fat}
              onChange={(e) => setGoals({ ...goals, fat: Math.max(0, parseFloat(e.target.value) || 0) })}
              inputProps={{ min: 0, step: 5 }}
              size="small"
            />
            <TextField
              fullWidth
              type="number"
              label="Fiber (g)"
              value={goals.fiber}
              onChange={(e) => setGoals({ ...goals, fiber: Math.max(0, parseFloat(e.target.value) || 0) })}
              inputProps={{ min: 0, step: 5 }}
              size="small"
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setShowGoalsDialog(false)} size="small">Cancel</Button>
          <Button onClick={handleSaveGoals} variant="contained" size="small">
            Save Goals
          </Button>
        </DialogActions>
      </Dialog>
        </>
      )}

      {/* Recipes Tab */}
      {activeSubTab === 1 && (
        <>
          <Box sx={{ mb: 2, display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={handleCreateRecipe}
              size="small"
            >
              Create New Recipe
            </Button>
          </Box>
          
          <SavedRecipes
            recipes={recipes}
            onEdit={handleEditRecipe}
            onRecipesUpdate={loadRecipes}
            onAddToLog={handleAddRecipeToLog}
          />

          <RecipeBuilder
            open={showRecipeBuilder}
            onClose={() => {
              setShowRecipeBuilder(false);
              setEditingRecipe(null);
            }}
            editRecipe={editingRecipe}
            onSave={handleRecipeSaved}
          />
        </>
      )}
    </Box>
  );
};

NutritionTab.propTypes = {
  onNavigate: PropTypes.func,
};

export default NutritionTab;
