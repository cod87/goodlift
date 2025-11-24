import { useState, useEffect } from 'react';
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
  Divider,
  Tabs,
  Tab,
} from '@mui/material';
import {
  Add,
  Delete,
  TrendingUp,
  MenuBook,
} from '@mui/icons-material';
import { getNutritionEntries, saveNutritionEntry, deleteNutritionEntry, getNutritionGoals, saveNutritionGoals, getRecipes, getFavoriteFoods } from '../../utils/nutritionStorage';
import { calculateNutrition } from '../../services/nutritionDataService';
import RecipeBuilder from './RecipeBuilder';
import SavedRecipes from './SavedRecipes';
import LogMealModal from '../LogMealModal';

/**
 * NutritionTab - Component for tracking nutrition using local nutrition database
 * Features:
 * - Search foods from nutrition-700.json with ranking support
 * - Tag-based searching (tags not visible to users)
 * - Standard portion measurements with multiple unit options
 * - Custom food support
 * - Log consumed foods with portion sizes
 * - View daily nutrition summary
 * - Set and track nutrition goals
 * - Create and save custom recipes
 * - Log recipes with custom portion sizes
 * 
 * Search Strategy:
 * - Results sorted by ranking (higher rank = more relevant)
 * - Name matching prioritized over tag matching
 * - Support for partial and fuzzy matching
 */
const NutritionTab = () => {
  const [activeSubTab, setActiveSubTab] = useState(0);
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
  const [recipes, setRecipes] = useState([]);
  const [showRecipeBuilder, setShowRecipeBuilder] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState(null);
  const [showLogMealModal, setShowLogMealModal] = useState(false);
  const [favoriteFoods, setFavoriteFoods] = useState([]);

  // Load today's entries, goals, recipes, and favorites on mount
  useEffect(() => {
    loadTodayEntries();
    loadGoals();
    loadRecipes();
    loadFavorites();
  }, []);

  const loadRecipes = () => {
    const savedRecipes = getRecipes();
    setRecipes(savedRecipes);
  };

  const loadFavorites = () => {
    const savedFavorites = getFavoriteFoods();
    setFavoriteFoods(savedFavorites);
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

  // Calculate nutrition from the new food data structure
  const calculateNutritionForFood = (food, grams) => {
    return calculateNutrition(food, grams);
  };

  const handleAddEntry = () => {
    if (!selectedFood || portionGrams <= 0) {
      return;
    }

    const nutrition = calculateNutritionForFood(selectedFood, portionGrams);
    const entry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`, // Unique ID: timestamp + random 9-char string
      date: new Date().toISOString(),
      foodName: selectedFood.name,
      grams: portionGrams,
      nutrition,
    };

    saveNutritionEntry(entry);
    loadTodayEntries();
    setShowAddDialog(false);
    setSelectedFood(null);
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

  const handleLogMealModalSave = (entry) => {
    saveNutritionEntry(entry);
    loadTodayEntries();
  };

  const getRecentFoods = () => {
    // Get unique foods from recent entries (last 30 days)
    const allEntries = getNutritionEntries();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentEntries = allEntries.filter(entry => 
      new Date(entry.date) >= thirtyDaysAgo
    );
    
    // Create a map to track unique foods by name
    const foodMap = new Map();
    recentEntries.forEach(entry => {
      if (!foodMap.has(entry.foodName)) {
        foodMap.set(entry.foodName, {
          name: entry.foodName,
          grams: entry.grams,
          // Reconstruct as nutrition-700 format
          calories: (entry.nutrition.calories / entry.grams) * 100,
          protein: (entry.nutrition.protein / entry.grams) * 100,
          carbs: (entry.nutrition.carbs / entry.grams) * 100,
          fat: (entry.nutrition.fat / entry.grams) * 100,
          fiber: (entry.nutrition.fiber / entry.grams) * 100,
        });
      }
    });
    
    return Array.from(foodMap.values()).slice(0, 20);
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

  // Circular Progress Ring Component
  const CalorieProgressRing = ({ current, goal }) => {
    const percentage = goal > 0 ? Math.min((current / goal) * 100, 100) : 0;
    const remaining = Math.max(goal - current, 0);
    
    return (
      <Card sx={{ mb: 2 }}>
        <CardContent sx={{ py: 3, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <Box sx={{ position: 'relative', display: 'inline-flex', mb: 2 }}>
            <CircularProgress
              variant="determinate"
              value={100}
              size={120}
              thickness={4}
              sx={{
                color: 'grey.200',
                position: 'absolute',
              }}
            />
            <CircularProgress
              variant="determinate"
              value={percentage}
              size={120}
              thickness={4}
              sx={{
                color: percentage < 80 ? 'primary.main' : percentage < 100 ? 'warning.main' : 'success.main',
              }}
            />
            <Box
              sx={{
                top: 0,
                left: 0,
                bottom: 0,
                right: 0,
                position: 'absolute',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'column',
              }}
            >
              <Typography variant="h5" component="div" sx={{ fontWeight: 700 }}>
                {current.toFixed(0)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                of {goal} kcal
              </Typography>
            </Box>
          </Box>
          <Typography variant="body2" color="text.secondary">
            {remaining.toFixed(0)} kcal remaining
          </Typography>
        </CardContent>
      </Card>
    );
  };

  CalorieProgressRing.propTypes = {
    current: PropTypes.number.isRequired,
    goal: PropTypes.number.isRequired,
  };

  return (
    <Box>
      {/* Log Meal Button - Prominent at top */}
      <Box sx={{ mb: 2 }}>
        <Button
          variant="contained"
          size="large"
          fullWidth
          startIcon={<Add />}
          onClick={() => setShowLogMealModal(true)}
          sx={{
            py: 1.5,
            fontWeight: 600,
            fontSize: '1rem',
            boxShadow: 2,
            '&:hover': {
              boxShadow: 4,
            },
          }}
        >
          Log a Meal
        </Button>
      </Box>

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
          {/* Calorie Progress Ring */}
          <CalorieProgressRing current={totals.calories} goal={goals.calories} />

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
                {selectedFood.name}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom sx={{ mb: 2 }}>
                Standard portion: {selectedFood.standard_portion || '100g'}
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
                  const nutrition = calculateNutritionForFood(selectedFood, portionGrams);
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

      {/* Log Meal Modal */}
      <LogMealModal
        open={showLogMealModal}
        onClose={() => setShowLogMealModal(false)}
        onSave={handleLogMealModalSave}
        recentFoods={getRecentFoods()}
        favoriteFoods={favoriteFoods}
        onFavoritesChange={loadFavorites}
      />
    </Box>
  );
};

NutritionTab.propTypes = {
  onNavigate: PropTypes.func,
};

export default NutritionTab;
