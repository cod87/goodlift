/**
 * LogMealModal - Full-screen modal for logging meals
 * 
 * Features:
 * - Full-screen modal using workout builder's visual style
 * - Search foods from local nutrition database
 * - Ranking-based search (higher rank = more relevant)
 * - Tag-based searching (tags not visible to users)
 * - Support for multiple measurement units
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
  StarBorder as StarBorderIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import { searchFoods, calculateNutrition } from '../services/nutritionDataService';
import {
  addFavoriteFood,
  removeFavoriteFood,
  isFavoriteFood,
} from '../utils/nutritionStorage';

const LogMealModal = ({ 
  open, 
  onClose, 
  onSave,
  recentFoods = [],
  favoriteFoods = [],
  onFavoritesChange,
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

  // Calculate nutrition for a food item
  const calculateNutritionForFood = (food, grams) => {
    return calculateNutrition(food, grams);
  };

  const searchFoodsLocal = useCallback(async (query) => {
    if (!query || query.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    setError('');

    try {
      // Use the new nutrition data service
      const results = await searchFoods(query, { maxResults: 20 });
      setSearchResults(results);
    } catch (err) {
      console.error('Error searching foods:', err);
      setError('Unable to load the food database. Please try again.');
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
      searchFoodsLocal(searchQuery);
    }, 300);

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
        debounceTimer.current = null;
      }
    };
  }, [searchQuery, searchFoodsLocal]);

  const handleSelectFood = (food) => {
    setSelectedFood(food);
    // Use standard portion as default
    setPortionGrams(food.portion_grams || 100);
  };

  const handleAddEntry = () => {
    if (!selectedFood || portionGrams <= 0) {
      return;
    }

    const nutrition = calculateNutritionForFood(selectedFood, portionGrams);
    const entry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
      date: new Date().toISOString(),
      foodName: selectedFood.name,
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

  const handleToggleFavorite = async (food, event) => {
    // Stop event propagation to prevent selecting the food
    if (event) {
      event.stopPropagation();
    }
    
    try {
      if (isFavoriteFood(food)) {
        await removeFavoriteFood(food.fdcId || food.id);
      } else {
        await addFavoriteFood(food);
      }
      // Notify parent to refresh favorites list
      if (onFavoritesChange) {
        onFavoritesChange();
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  const renderFoodItem = (food, onClick) => {
    const nutrition = calculateNutritionForFood(food, 100);
    const isFavorite = isFavoriteFood(food);
    
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
          display: 'flex',
          alignItems: 'flex-start',
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
                {food.name || food.foodName}
              </Typography>
            </Box>
          }
          secondary={
            <Box component="span" sx={{ display: 'flex', gap: 1, mt: 0.5, alignItems: 'center', fontSize: '0.875rem', color: 'text.secondary' }}>
              <span>{nutrition.calories.toFixed(0)} cal</span>
              <span>•</span>
              <span>P: {nutrition.protein.toFixed(1)}g</span>
              <span>•</span>
              <span>C: {nutrition.carbs.toFixed(1)}g</span>
              <span>•</span>
              <span>F: {nutrition.fat.toFixed(1)}g</span>
            </Box>
          }
        />
        <IconButton
          size="small"
          onClick={(e) => handleToggleFavorite(food, e)}
          sx={{ 
            ml: 1,
            color: isFavorite ? 'warning.main' : 'action.disabled',
            '&:hover': {
              color: 'warning.main',
            }
          }}
        >
          {isFavorite ? <StarIcon fontSize="small" /> : <StarBorderIcon fontSize="small" />}
        </IconButton>
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
                <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', fontSize: '0.875rem', color: 'text.secondary' }}>
                  {(() => {
                    const nutrition = calculateNutrition(selectedFood, portionGrams);
                    return (
                      <>
                        <span style={{ fontWeight: 600 }}>{nutrition.calories.toFixed(0)} cal</span>
                        <span>•</span>
                        <span>Protein: {nutrition.protein.toFixed(1)}g</span>
                        <span>•</span>
                        <span>Carbs: {nutrition.carbs.toFixed(1)}g</span>
                        <span>•</span>
                        <span>Fat: {nutrition.fat.toFixed(1)}g</span>
                        <span>•</span>
                        <span>Fiber: {nutrition.fiber.toFixed(1)}g</span>
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
  onFavoritesChange: PropTypes.func,
};

export default LogMealModal;
