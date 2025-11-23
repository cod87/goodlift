/**
 * LogMealModal - Full-screen modal for logging meals
 * 
 * Features:
 * - Full-screen modal using workout builder's visual style
 * - Search foods with intelligent USDA SR Legacy filtering
 * - Automatic detection of meat/seafood vs vegetables/fruits
 * - Prioritizes cooked forms for meats, allows raw/cooked for veggies
 * - Shows previously logged foods and suggestions
 * - Favorites/commonly used foods for quick logging
 * - Clean, minimalist interface with clear sections
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import PropTypes from 'prop-types';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  TextField,
  List,
  ListItem,
  ListItemText,
  Chip,
  CircularProgress,
  Paper,
  Divider,
  IconButton,
  InputAdornment,
  Tabs,
  Tab,
  Alert,
} from '@mui/material';
import {
  Close as CloseIcon,
  Search as SearchIcon,
  Restaurant as RestaurantIcon,
  History as HistoryIcon,
  Star as StarIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import { 
  matchesAllKeywords, 
  parseSearchKeywords, 
  hasAllowedDataType, 
  isSRLegacyFood,
  buildOptimizedQuery,
  deduplicateFoods,
  sortByRelevance,
  isMeatOrSeafood,
  isVegetableOrFruit,
  FOOD_SEARCH_CONFIG 
} from '../utils/foodSearchUtils';

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

const LogMealModal = ({ 
  open, 
  onClose, 
  onSave,
  recentFoods = [],
  favoriteFoods = [],
}) => {
  const [activeTab, setActiveTab] = useState(0); // 0: Search, 1: Recent, 2: Favorites
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [selectedFood, setSelectedFood] = useState(null);
  const [portionGrams, setPortionGrams] = useState(100);
  const [error, setError] = useState('');
  const debounceTimer = useRef(null);

  // Reset state when modal opens
  useEffect(() => {
    if (open) {
      setSearchQuery('');
      setSearchResults([]);
      setSelectedFood(null);
      setPortionGrams(100);
      setError('');
      setActiveTab(0);
    }
  }, [open]);

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

  const searchFoods = useCallback(async (query) => {
    if (!query || query.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    setError('');

    try {
      // Build optimized query based on food type
      const optimizedQuery = buildOptimizedQuery(query);
      
      // Restrict to SR Legacy only as per requirements
      const response = await fetch(
        `${USDA_API_BASE_URL}/foods/search?api_key=${USDA_API_KEY}&query=${encodeURIComponent(optimizedQuery)}&pageSize=${FOOD_SEARCH_CONFIG.API_PAGE_SIZE}&dataType=SR%20Legacy`
      );

      if (!response.ok) {
        throw new Error('Failed to search foods');
      }

      const data = await response.json();
      let foods = data.foods || [];
      
      // Additional client-side filtering
      // Filter by dataType (defense-in-depth)
      foods = foods.filter(hasAllowedDataType);
      
      // Only keep SR Legacy as per requirements
      foods = foods.filter(isSRLegacyFood);
      
      // Apply keyword matching for flexible search
      const keywords = parseSearchKeywords(query);
      foods = foods.filter(food => matchesAllKeywords(food.description, keywords));
      
      // Deduplicate results
      foods = deduplicateFoods(foods);
      
      // Sort by relevance
      foods = sortByRelevance(foods, query);
      
      // Limit results
      foods = foods.slice(0, FOOD_SEARCH_CONFIG.MAX_RESULTS);
      
      setSearchResults(foods);
    } catch (err) {
      console.error('Error searching foods:', err);
      setError('Unable to connect to the food database. Please check your internet connection and try again.');
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  }, []);

  // Debounced search
  useEffect(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    if (!searchQuery || searchQuery.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    debounceTimer.current = setTimeout(() => {
      searchFoods(searchQuery);
    }, FOOD_SEARCH_CONFIG.DEBOUNCE_MS);

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
        debounceTimer.current = null;
      }
    };
  }, [searchQuery, searchFoods]);

  const handleSelectFood = (food) => {
    setSelectedFood(food);
    setPortionGrams(100);
  };

  const handleAddEntry = () => {
    if (!selectedFood || portionGrams <= 0) {
      return;
    }

    const nutrition = calculateNutrition(selectedFood, portionGrams);
    const entry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
      date: new Date().toISOString(),
      foodName: selectedFood.description,
      grams: portionGrams,
      nutrition,
    };

    onSave(entry);
    onClose();
  };

  const handleClose = () => {
    setSelectedFood(null);
    onClose();
  };

  const renderFoodItem = (food, onClick) => {
    const nutrition = calculateNutrition(food, 100);
    return (
      <ListItem
        component="button"
        onClick={onClick}
        sx={{ 
          py: 2,
          px: 2,
          '&:hover': {
            backgroundColor: 'action.hover',
          },
          transition: 'background-color 0.2s',
          cursor: 'pointer',
        }}
      >
        <ListItemText
          primary={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
              <Typography 
                variant="body1" 
                sx={{ 
                  fontWeight: 600,
                  color: 'text.primary',
                  flex: 1,
                }}
              >
                {food.description || food.foodName}
              </Typography>
            </Box>
          }
          secondary={
            <Box component="span" sx={{ display: 'flex', gap: 0.5, mt: 1, flexWrap: 'wrap' }}>
              <Chip 
                label={`${nutrition.calories.toFixed(0)} cal`} 
                size="small" 
                sx={{ height: 24, fontSize: '0.75rem', fontWeight: 600 }} 
              />
              <Chip 
                label={`P: ${nutrition.protein.toFixed(1)}g`} 
                size="small" 
                color="primary" 
                sx={{ height: 24, fontSize: '0.75rem', fontWeight: 600 }} 
              />
              <Chip 
                label={`C: ${nutrition.carbs.toFixed(1)}g`} 
                size="small" 
                color="secondary" 
                sx={{ height: 24, fontSize: '0.75rem', fontWeight: 600 }} 
              />
              <Chip 
                label={`F: ${nutrition.fat.toFixed(1)}g`} 
                size="small" 
                color="warning" 
                sx={{ height: 24, fontSize: '0.75rem', fontWeight: 600 }} 
              />
            </Box>
          }
        />
      </ListItem>
    );
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleClose} 
      fullScreen
      PaperProps={{
        sx: {
          bgcolor: 'background.default',
          backgroundImage: 'none',
        }
      }}
    >
      {/* Header */}
      <DialogTitle sx={{ 
        borderBottom: '1px solid',
        borderColor: 'divider',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        px: 3,
        py: 2,
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <RestaurantIcon color="primary" />
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Log a Meal
          </Typography>
        </Box>
        <IconButton onClick={handleClose} edge="end">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {/* Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 3, pt: 2 }}>
          <Tabs 
            value={activeTab} 
            onChange={(e, newValue) => setActiveTab(newValue)}
            sx={{
              '& .MuiTab-root': {
                minHeight: 48,
                fontSize: '0.875rem',
                fontWeight: 600,
              },
            }}
          >
            <Tab 
              icon={<SearchIcon fontSize="small" />} 
              label="Search Foods"
              iconPosition="start"
            />
            <Tab 
              icon={<HistoryIcon fontSize="small" />} 
              label="Recent"
              iconPosition="start"
            />
            <Tab 
              icon={<StarIcon fontSize="small" />} 
              label="Favorites"
              iconPosition="start"
            />
          </Tabs>
        </Box>

        {/* Content */}
        <Box sx={{ flex: 1, overflow: 'auto', p: 3 }}>
          {/* Search Tab */}
          {activeTab === 0 && (
            <Box>
              {/* Search Input */}
              <TextField
                fullWidth
                placeholder="Search for foods (e.g., 'chicken breast', 'brown rice', 'apple')..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon color="primary" />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  mb: 2,
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: 'background.paper',
                  },
                }}
              />

              {error && (
                <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
                  {error}
                </Alert>
              )}

              {/* Search hint for meat/seafood */}
              {searchQuery && isMeatOrSeafood(searchQuery) && (
                <Alert severity="info" sx={{ mb: 2 }}>
                  <Typography variant="body2">
                    Searching for <strong>{searchQuery}</strong> - Showing cooked forms by default
                  </Typography>
                </Alert>
              )}

              {/* Search hint for vegetables/fruits */}
              {searchQuery && isVegetableOrFruit(searchQuery) && (
                <Alert severity="info" sx={{ mb: 2 }}>
                  <Typography variant="body2">
                    Searching for <strong>{searchQuery}</strong> - Showing raw and cooked forms
                  </Typography>
                </Alert>
              )}

              {/* Loading */}
              {searching && (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                  <CircularProgress />
                </Box>
              )}

              {/* Results */}
              {!searching && searchResults.length > 0 && (
                <>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontWeight: 500 }}>
                    Found {searchResults.length} result{searchResults.length !== 1 ? 's' : ''} - Click to add
                  </Typography>
                  <Paper variant="outlined" sx={{ borderRadius: 2 }}>
                    <List disablePadding>
                      {searchResults.map((food, index) => (
                        <Box key={food.fdcId}>
                          {index > 0 && <Divider />}
                          {renderFoodItem(food, () => handleSelectFood(food))}
                        </Box>
                      ))}
                    </List>
                  </Paper>
                </>
              )}

              {/* No results */}
              {!searching && searchResults.length === 0 && searchQuery.trim().length >= 2 && !error && (
                <Alert severity="info">
                  <Typography variant="body2" sx={{ fontWeight: 500, mb: 1 }}>
                    No foods found for "{searchQuery}"
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Try simpler terms or check for spelling mistakes
                  </Typography>
                </Alert>
              )}
            </Box>
          )}

          {/* Recent Tab */}
          {activeTab === 1 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Recently Logged Foods
              </Typography>
              {recentFoods.length === 0 ? (
                <Paper sx={{ p: 3, textAlign: 'center', bgcolor: 'background.default' }}>
                  <Typography variant="body2" color="text.secondary">
                    No recent foods. Start logging meals to see your history here.
                  </Typography>
                </Paper>
              ) : (
                <Paper variant="outlined" sx={{ borderRadius: 2 }}>
                  <List disablePadding>
                    {recentFoods.slice(0, 20).map((food, index) => (
                      <Box key={index}>
                        {index > 0 && <Divider />}
                        {renderFoodItem(food, () => handleSelectFood(food))}
                      </Box>
                    ))}
                  </List>
                </Paper>
              )}
            </Box>
          )}

          {/* Favorites Tab */}
          {activeTab === 2 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Favorite Foods
              </Typography>
              {favoriteFoods.length === 0 ? (
                <Paper sx={{ p: 3, textAlign: 'center', bgcolor: 'background.default' }}>
                  <Typography variant="body2" color="text.secondary">
                    No favorite foods yet. Add foods you log frequently to favorites for quick access.
                  </Typography>
                </Paper>
              ) : (
                <Paper variant="outlined" sx={{ borderRadius: 2 }}>
                  <List disablePadding>
                    {favoriteFoods.map((food, index) => (
                      <Box key={index}>
                        {index > 0 && <Divider />}
                        {renderFoodItem(food, () => handleSelectFood(food))}
                      </Box>
                    ))}
                  </List>
                </Paper>
              )}
            </Box>
          )}
        </Box>

        {/* Selected Food Section */}
        {selectedFood && (
          <Box sx={{ 
            borderTop: '1px solid',
            borderColor: 'divider',
            p: 3,
            bgcolor: 'background.paper',
          }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
              Add to Log
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                {selectedFood.description || selectedFood.foodName}
              </Typography>
              <TextField
                fullWidth
                type="number"
                label="Amount (grams)"
                value={portionGrams}
                onChange={(e) => setPortionGrams(Math.max(1, parseFloat(e.target.value) || 0))}
                inputProps={{ min: 1, step: 1 }}
                helperText="Enter the amount in grams you consumed"
              />
              <Box>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Nutrition for {portionGrams}g:
                </Typography>
                <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                  {(() => {
                    const nutrition = calculateNutrition(selectedFood, portionGrams);
                    return (
                      <>
                        <Chip label={`${nutrition.calories.toFixed(0)} cal`} />
                        <Chip label={`Protein: ${nutrition.protein.toFixed(1)}g`} color="primary" />
                        <Chip label={`Carbs: ${nutrition.carbs.toFixed(1)}g`} color="secondary" />
                        <Chip label={`Fat: ${nutrition.fat.toFixed(1)}g`} color="warning" />
                        <Chip label={`Fiber: ${nutrition.fiber.toFixed(1)}g`} color="success" />
                      </>
                    );
                  })()}
                </Box>
              </Box>
            </Box>
          </Box>
        )}
      </DialogContent>

      {/* Footer Actions */}
      <DialogActions sx={{ px: 3, py: 2, borderTop: '1px solid', borderColor: 'divider' }}>
        <Button onClick={handleClose} size="large">
          Cancel
        </Button>
        <Button 
          onClick={handleAddEntry} 
          variant="contained" 
          size="large"
          disabled={!selectedFood || portionGrams <= 0}
          startIcon={<AddIcon />}
        >
          Add Entry
        </Button>
      </DialogActions>
    </Dialog>
  );
};

LogMealModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
  recentFoods: PropTypes.array,
  favoriteFoods: PropTypes.array,
};

export default LogMealModal;
