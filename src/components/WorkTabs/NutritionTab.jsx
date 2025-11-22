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
  Alert,
  Divider,
} from '@mui/material';
import {
  Search,
  Add,
  Delete,
  Restaurant,
  TrendingUp,
} from '@mui/icons-material';
import { getNutritionEntries, saveNutritionEntry, deleteNutritionEntry, getNutritionGoals, saveNutritionGoals } from '../../utils/nutritionStorage';

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
 */
const NutritionTab = () => {
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

  // Load today's entries and goals on mount
  useEffect(() => {
    loadTodayEntries();
    loadGoals();
  }, []);

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

  const searchFoods = async () => {
    if (!searchQuery.trim()) {
      setError('Please enter a search term');
      return;
    }

    setSearching(true);
    setError('');

    try {
      const response = await fetch(
        `${USDA_API_BASE_URL}/foods/search?api_key=${USDA_API_KEY}&query=${encodeURIComponent(searchQuery)}&pageSize=10`
      );

      if (!response.ok) {
        throw new Error('Failed to search foods');
      }

      const data = await response.json();
      setSearchResults(data.foods || []);
    } catch (err) {
      console.error('Error searching foods:', err);
      setError('Failed to search foods. Please try again.');
    } finally {
      setSearching(false);
    }
  };

  const handleSelectFood = (food) => {
    setSelectedFood(food);
    setPortionGrams(100);
    setShowAddDialog(true);
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
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, // Unique ID with timestamp + random string
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
      <Box sx={{ mb: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
          <Typography variant="body2" color="text.secondary">
            {label}
          </Typography>
          <Typography variant="body2" fontWeight="bold">
            {current.toFixed(1)} / {goal} {unit}
          </Typography>
        </Box>
        <LinearProgress 
          variant="determinate" 
          value={percentage} 
          color={color}
          sx={{ height: 8, borderRadius: 1 }}
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
      {/* Search Section */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Restaurant /> Search Foods
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
            <TextField
              fullWidth
              placeholder="Search for foods (e.g., chicken breast, apple)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && searchFoods()}
            />
            <Button
              variant="contained"
              startIcon={searching ? <CircularProgress size={20} color="inherit" /> : <Search />}
              onClick={searchFoods}
              disabled={searching}
              sx={{ minWidth: 120 }}
            >
              Search
            </Button>
          </Box>
          
          {error && (
            <Alert severity="error" sx={{ mt: 2 }} onClose={() => setError('')}>
              {error}
            </Alert>
          )}

          {/* Search Results */}
          {searchResults.length > 0 && (
            <Box sx={{ mt: 3 }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Search Results (per 100g):
              </Typography>
              <List>
                {searchResults.map((food) => {
                  const nutrition = calculateNutrition(food, 100);
                  return (
                    <ListItem
                      key={food.fdcId}
                      secondaryAction={
                        <IconButton edge="end" onClick={() => handleSelectFood(food)} color="primary">
                          <Add />
                        </IconButton>
                      }
                      sx={{ 
                        border: 1, 
                        borderColor: 'divider', 
                        borderRadius: 1, 
                        mb: 1,
                        '&:hover': { bgcolor: 'action.hover' }
                      }}
                    >
                      <ListItemText
                        primary={food.description}
                        secondary={
                          <Box component="span" sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 0.5 }}>
                            <Chip label={`${nutrition.calories.toFixed(0)} cal`} size="small" />
                            <Chip label={`P: ${nutrition.protein.toFixed(1)}g`} size="small" color="primary" />
                            <Chip label={`C: ${nutrition.carbs.toFixed(1)}g`} size="small" color="secondary" />
                            <Chip label={`F: ${nutrition.fat.toFixed(1)}g`} size="small" color="warning" />
                          </Box>
                        }
                      />
                    </ListItem>
                  );
                })}
              </List>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Daily Summary */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <TrendingUp /> Today&apos;s Summary
            </Typography>
            <Button
              variant="outlined"
              size="small"
              onClick={() => setShowGoalsDialog(true)}
            >
              Set Goals
            </Button>
          </Box>

          <Grid container spacing={2}>
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

      {/* Today's Entries */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Today&apos;s Entries
          </Typography>
          {todayEntries.length === 0 ? (
            <Typography color="text.secondary" align="center" sx={{ py: 3 }}>
              No entries yet today. Search for foods to get started!
            </Typography>
          ) : (
            <List>
              {todayEntries.map((entry, index) => (
                <Box key={entry.id}>
                  {index > 0 && <Divider sx={{ my: 1 }} />}
                  <ListItem
                    secondaryAction={
                      <IconButton edge="end" onClick={() => handleDeleteEntry(entry.id)} color="error">
                        <Delete />
                      </IconButton>
                    }
                  >
                    <ListItemText
                      primary={
                        <Typography variant="subtitle1">
                          {entry.foodName} ({entry.grams}g)
                        </Typography>
                      }
                      secondary={
                        <Box component="span" sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 0.5 }}>
                          <Chip label={`${entry.nutrition.calories.toFixed(0)} cal`} size="small" />
                          <Chip label={`P: ${entry.nutrition.protein.toFixed(1)}g`} size="small" color="primary" />
                          <Chip label={`C: ${entry.nutrition.carbs.toFixed(1)}g`} size="small" color="secondary" />
                          <Chip label={`F: ${entry.nutrition.fat.toFixed(1)}g`} size="small" color="warning" />
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

      {/* Add Entry Dialog */}
      <Dialog open={showAddDialog} onClose={() => setShowAddDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Food Entry</DialogTitle>
        <DialogContent>
          {selectedFood && (
            <Box>
              <Typography variant="h6" gutterBottom>
                {selectedFood.description}
              </Typography>
              <TextField
                fullWidth
                type="number"
                label="Portion Size (grams)"
                value={portionGrams}
                onChange={(e) => setPortionGrams(Math.max(1, parseFloat(e.target.value) || 0))}
                sx={{ mb: 2 }}
                inputProps={{ min: 1, step: 1 }}
              />
              <Typography variant="subtitle2" gutterBottom>
                Nutrition for {portionGrams}g:
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {(() => {
                  const nutrition = calculateNutrition(selectedFood, portionGrams);
                  return (
                    <>
                      <Chip label={`${nutrition.calories.toFixed(0)} calories`} />
                      <Chip label={`Protein: ${nutrition.protein.toFixed(1)}g`} color="primary" />
                      <Chip label={`Carbs: ${nutrition.carbs.toFixed(1)}g`} color="secondary" />
                      <Chip label={`Fat: ${nutrition.fat.toFixed(1)}g`} color="warning" />
                      <Chip label={`Fiber: ${nutrition.fiber.toFixed(1)}g`} color="success" />
                    </>
                  );
                })()}
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowAddDialog(false)}>Cancel</Button>
          <Button onClick={handleAddEntry} variant="contained">
            Add Entry
          </Button>
        </DialogActions>
      </Dialog>

      {/* Goals Dialog */}
      <Dialog open={showGoalsDialog} onClose={() => setShowGoalsDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Set Daily Goals</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              fullWidth
              type="number"
              label="Calories (kcal)"
              value={goals.calories}
              onChange={(e) => setGoals({ ...goals, calories: Math.max(0, parseFloat(e.target.value) || 0) })}
              inputProps={{ min: 0, step: 50 }}
            />
            <TextField
              fullWidth
              type="number"
              label="Protein (g)"
              value={goals.protein}
              onChange={(e) => setGoals({ ...goals, protein: Math.max(0, parseFloat(e.target.value) || 0) })}
              inputProps={{ min: 0, step: 5 }}
            />
            <TextField
              fullWidth
              type="number"
              label="Carbs (g)"
              value={goals.carbs}
              onChange={(e) => setGoals({ ...goals, carbs: Math.max(0, parseFloat(e.target.value) || 0) })}
              inputProps={{ min: 0, step: 5 }}
            />
            <TextField
              fullWidth
              type="number"
              label="Fat (g)"
              value={goals.fat}
              onChange={(e) => setGoals({ ...goals, fat: Math.max(0, parseFloat(e.target.value) || 0) })}
              inputProps={{ min: 0, step: 5 }}
            />
            <TextField
              fullWidth
              type="number"
              label="Fiber (g)"
              value={goals.fiber}
              onChange={(e) => setGoals({ ...goals, fiber: Math.max(0, parseFloat(e.target.value) || 0) })}
              inputProps={{ min: 0, step: 5 }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowGoalsDialog(false)}>Cancel</Button>
          <Button onClick={handleSaveGoals} variant="contained">
            Save Goals
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

NutritionTab.propTypes = {
  onNavigate: PropTypes.func,
};

export default NutritionTab;
