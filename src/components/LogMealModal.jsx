/**
 * LogMealModal - Full-screen modal for logging meals
 * 
 * Features:
 * - Full-screen modal using workout builder's visual style
 * - Multi-search capability with chip-based search terms
 * - Multi-select food selection similar to workout builder
 * - Search foods from local nutrition database
 * - Ranking-based search (higher rank = more relevant)
 * - Tag-based searching (tags not visible to users)
 * - Support for multiple measurement units
 * - Shows previously logged foods and suggestions
 * - Favorites/commonly used foods for quick logging
 * - Smooth animations matching workout builder experience
 * - Clean, minimalist interface with clear sections
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import PropTypes from 'prop-types';
import { motion, AnimatePresence } from 'framer-motion';
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
  Chip,
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
  // recentFoods = [], // Not used yet
  // favoriteFoods = [], // Not used yet
  onFavoritesChange,
}) => {
  // 0: Search Food, 1: My Meal
  const [activeTab, setActiveTab] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchTerms, setSearchTerms] = useState([]); // Array of search term strings
  const [searchResults, setSearchResults] = useState([]); // Aggregated results from all search terms
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState('');
  const debounceTimer = useRef(null);
  
  // My Meal items (foods selected for logging)
  const [mealItems, setMealItems] = useState([]);
  
  // Selected foods (for multi-select pattern)
  const [selectedFoodIds, setSelectedFoodIds] = useState(new Set());

  // Reset state when modal opens
  useEffect(() => {
    if (open) {
      setSearchQuery('');
      setSearchTerms([]);
      setSearchResults([]);
      setError('');
      setActiveTab(0);
      setMealItems([]);
      setSelectedFoodIds(new Set());
    }
  }, [open]);

  // Calculate nutrition for a food item
  const calculateNutritionForFood = (food, grams) => {
    return calculateNutrition(food, grams);
  };

  // Add a search term (when user presses Enter or comma)
  const addSearchTerm = useCallback((term) => {
    try {
      const trimmedTerm = term.trim();
      if (trimmedTerm.length >= 2 && !searchTerms.includes(trimmedTerm)) {
        const newTerms = [...searchTerms, trimmedTerm];
        setSearchTerms(newTerms);
        setSearchQuery(''); // Clear input after adding
        // Trigger search for all terms
        searchMultipleTerms(newTerms);
      }
    } catch (error) {
      console.error('Error adding search term:', error);
      setError('Failed to add search term. Please try again.');
    }
  }, [searchTerms]);

  // Remove a search term chip
  const removeSearchTerm = useCallback((termToRemove) => {
    try {
      const newTerms = searchTerms.filter(term => term !== termToRemove);
      setSearchTerms(newTerms);
      if (newTerms.length === 0) {
        setSearchResults([]);
      } else {
        searchMultipleTerms(newTerms);
      }
    } catch (error) {
      console.error('Error removing search term:', error);
      setError('Failed to remove search term. Please try again.');
    }
  }, [searchTerms]);

  // Search for multiple terms and aggregate results
  const searchMultipleTerms = useCallback(async (terms) => {
    if (!terms || terms.length === 0) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    setError('');

    try {
      // Search for each term
      const allResultsPromises = terms.map(term => searchFoods(term, { maxResults: 20 }));
      const allResults = await Promise.all(allResultsPromises);
      
      // Flatten and deduplicate results by food id
      const uniqueFoods = new Map();
      allResults.forEach((results, index) => {
        results.forEach(food => {
          const foodId = food.id || food.fdcId;
          if (!uniqueFoods.has(foodId)) {
            uniqueFoods.set(foodId, { ...food, searchTerm: terms[index] });
          }
        });
      });
      
      setSearchResults(Array.from(uniqueFoods.values()));
    } catch (err) {
      console.error('Error searching foods:', err);
      setError('Unable to load the food database. Please try again.');
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  }, []);

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

  // Debounced search - only search if no terms are added yet
  useEffect(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    // If we have search terms, use those instead
    if (searchTerms.length > 0) {
      return;
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
  }, [searchQuery, searchTerms, searchFoodsLocal]);

  // Toggle food selection (multi-select pattern like workout builder)
  const handleToggleFoodSelection = (food) => {
    try {
      const foodId = food.id || food.fdcId;
      const newSelectedIds = new Set(selectedFoodIds);
      
      if (newSelectedIds.has(foodId)) {
        // Deselect - remove from selected set
        newSelectedIds.delete(foodId);
      } else {
        // Select - add to selected set
        newSelectedIds.add(foodId);
      }
      
      setSelectedFoodIds(newSelectedIds);
    } catch (error) {
      console.error('Error toggling food selection:', error);
      setError('Failed to select food. Please try again.');
    }
  };

  // Add selected foods to meal
  const handleAddSelectedToMeal = () => {
    if (selectedFoodIds.size === 0) {
      return;
    }

    try {
      const selectedFoods = searchResults.filter(food => 
        selectedFoodIds.has(food.id || food.fdcId)
      );

      const newMealItems = selectedFoods.map(food => ({
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
        food: food,
        grams: food.portion_grams || 100,
      }));

      setMealItems([...mealItems, ...newMealItems]);
      setSelectedFoodIds(new Set()); // Clear selection
      setActiveTab(1); // Switch to My Meal tab
    } catch (error) {
      console.error('Error adding selected foods to meal:', error);
      setError('Failed to add foods to meal. Please try again.');
    }
  };

  const handleSelectFood = (food) => {
    try {
      // For backward compatibility - directly add to meal
      const newMealItem = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
        food: food,
        grams: food.portion_grams || 100,
      };
      setMealItems([...mealItems, newMealItem]);
      
      // Switch to "My Meal" tab to show the added item
      setActiveTab(1);
    } catch (error) {
      console.error('Error selecting food:', error);
      setError('Failed to add food. Please try again.');
    }
  };

  const handleRemoveMealItem = (itemId) => {
    try {
      setMealItems(mealItems.filter(item => item.id !== itemId));
    } catch (error) {
      console.error('Error removing meal item:', error);
      setError('Failed to remove item. Please try again.');
    }
  };

  const handleUpdateMealItemGrams = (itemId, grams) => {
    try {
      // Ensure grams is a valid number
      const validGrams = Math.max(1, parseFloat(grams) || 1);
      setMealItems(mealItems.map(item => 
        item.id === itemId ? { ...item, grams: validGrams } : item
      ));
    } catch (error) {
      console.error('Error updating meal item grams:', error);
      setError('Failed to update quantity. Please try again.');
    }
  };

  const handleSaveMeal = () => {
    if (mealItems.length === 0) {
      return;
    }

    try {
      // Create entries for each meal item
      mealItems.forEach(item => {
        try {
          const nutrition = calculateNutritionForFood(item.food, item.grams);
          const entry = {
            id: `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
            date: new Date().toISOString(),
            foodName: item.food.name,
            grams: item.grams,
            nutrition,
          };
          onSave(entry);
        } catch (itemError) {
          console.error('Error saving meal item:', item, itemError);
          // Continue with other items even if one fails
        }
      });
      
      onClose();
    } catch (error) {
      console.error('Error saving meal:', error);
      setError('Failed to save meal. Please try again.');
    }
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

  const renderFoodItem = (food, onClick, isSelected = false) => {
    try {
      const nutrition = calculateNutritionForFood(food, 100);
      const isFavorite = isFavoriteFood(food);
      
      return (
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 20 }}
          transition={{ duration: 0.2 }}
        >
          <ListItem
            button
            onClick={(e) => {
              e.preventDefault();
              onClick();
            }}
            sx={{ 
              py: 2,
              px: 2,
              '&:hover': {
                backgroundColor: 'action.hover',
              },
              transition: 'background-color 0.2s, border-color 0.2s, margin-left 0.3s',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'flex-start',
              borderLeft: isSelected ? '4px solid' : 'none',
              borderLeftColor: isSelected ? 'success.main' : 'transparent',
              marginLeft: isSelected ? 1 : 0,
              backgroundColor: isSelected ? 'success.50' : 'transparent',
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
                  {food.name || food.foodName || 'Unknown Food'}
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
                <span>•</span>
                <span>Fiber: {nutrition.fiber.toFixed(1)}g</span>
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
        </motion.div>
      );
    } catch (error) {
      console.error('Error rendering food item:', food, error);
      // Return a simple error item instead of breaking the UI
      return (
        <ListItem sx={{ py: 2, px: 2 }}>
          <ListItemText
            primary={
              <Typography variant="body2" color="error">
                Error loading food item
              </Typography>
            }
          />
        </ListItem>
      );
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
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
        <IconButton onClick={onClose} edge="end">
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
              label="Search Food"
              iconPosition="start"
            />
            <Tab 
              icon={<RestaurantIcon fontSize="small" />} 
              label={`My Meal (${mealItems.length})`}
              iconPosition="start"
            />
          </Tabs>
        </Box>

        {/* Content */}
        <Box sx={{ flex: 1, overflow: 'auto', p: 3 }}>
          {/* Search Food Tab */}
          {activeTab === 0 && (
            <Box>
              {/* Search Input with chips */}
              <Box sx={{ mb: 2 }}>
                <TextField
                  fullWidth
                  placeholder="Type food names and press Enter or comma to add multiple searches..."
                  value={searchQuery}
                  onChange={(e) => {
                    const value = e.target.value;
                    // Check for comma - add term if present
                    if (value.includes(',')) {
                      const parts = value.split(',');
                      if (parts.length > 1) {
                        const termToAdd = parts[0].trim();
                        if (termToAdd.length >= 2) {
                          addSearchTerm(termToAdd);
                        }
                        // Keep any remaining text after comma
                        setSearchQuery(parts.slice(1).join(','));
                      }
                    } else {
                      setSearchQuery(value);
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      if (searchQuery.trim().length >= 2) {
                        addSearchTerm(searchQuery);
                      }
                    }
                  }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon color="primary" />
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: 'background.paper',
                    },
                  }}
                />
                
                {/* Search term chips */}
                {searchTerms.length > 0 && (
                  <Box sx={{ display: 'flex', gap: 1, mt: 1, flexWrap: 'wrap' }}>
                    {searchTerms.map((term, index) => (
                      <Chip
                        key={index}
                        label={term}
                        onDelete={() => removeSearchTerm(term)}
                        color="primary"
                        size="small"
                        sx={{ 
                          fontWeight: 500,
                          animation: 'fadeIn 0.3s ease-in',
                          '@keyframes fadeIn': {
                            from: { opacity: 0, transform: 'scale(0.8)' },
                            to: { opacity: 1, transform: 'scale(1)' },
                          },
                        }}
                      />
                    ))}
                  </Box>
                )}
                
                {/* Hint text */}
                {searchTerms.length === 0 && searchQuery.length === 0 && (
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                    💡 Tip: Enter multiple food names separated by comma or press Enter to search for all at once
                  </Typography>
                )}
              </Box>

              {error && (
                <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
                  {error}
                </Alert>
              )}

              {/* Loading */}
              {searching && (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                  <CircularProgress />
                </Box>
              )}

              {/* Add Selected Button - shown when foods are selected */}
              {selectedFoodIds.size > 0 && (
                <Box sx={{ mb: 2 }}>
                  <Button
                    variant="contained"
                    color="success"
                    fullWidth
                    onClick={handleAddSelectedToMeal}
                    startIcon={<AddIcon />}
                    sx={{
                      py: 1.5,
                      fontWeight: 600,
                      animation: 'slideDown 0.3s ease-out',
                      '@keyframes slideDown': {
                        from: { opacity: 0, transform: 'translateY(-10px)' },
                        to: { opacity: 1, transform: 'translateY(0)' },
                      },
                    }}
                  >
                    Add {selectedFoodIds.size} Selected Food{selectedFoodIds.size > 1 ? 's' : ''} to Meal
                  </Button>
                </Box>
              )}

              {/* Results */}
              {!searching && searchResults.length > 0 && (
                <>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontWeight: 500 }}>
                    Found {searchResults.length} result{searchResults.length !== 1 ? 's' : ''} - Click to select, then add to meal
                  </Typography>
                  <Paper variant="outlined" sx={{ borderRadius: 2 }}>
                    <List disablePadding>
                      {searchResults.map((food, index) => {
                        const foodId = food.id || food.fdcId;
                        const isSelected = selectedFoodIds.has(foodId);
                        return (
                          <Box key={foodId || index}>
                            {index > 0 && <Divider />}
                            {renderFoodItem(food, () => handleToggleFoodSelection(food), isSelected)}
                          </Box>
                        );
                      })}
                    </List>
                  </Paper>
                </>
              )}

              {/* No results */}
              {!searching && searchResults.length === 0 && (searchQuery.trim().length >= 2 || searchTerms.length > 0) && !error && (
                <Alert severity="info">
                  <Typography variant="body2" sx={{ fontWeight: 500, mb: 1 }}>
                    No foods found{searchQuery ? ` for "${searchQuery}"` : ''}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Try simpler terms or check for spelling mistakes
                  </Typography>
                </Alert>
              )}
            </Box>
          )}

          {/* My Meal Tab */}
          {activeTab === 1 && (
            <Box>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                My Meal
              </Typography>
              
              {mealItems.length === 0 ? (
                <Paper sx={{ p: 4, textAlign: 'center', bgcolor: 'background.default', borderRadius: 2 }}>
                  <RestaurantIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="body1" color="text.secondary" gutterBottom>
                    No foods added yet
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Search for foods in the "Search Food" tab and click to add them here
                  </Typography>
                </Paper>
              ) : (
                <>
                  <Paper variant="outlined" sx={{ borderRadius: 2, mb: 2 }}>
                    <List disablePadding>
                      {mealItems.map((item, index) => (
                        <Box key={item.id}>
                          {index > 0 && <Divider />}
                          <ListItem sx={{ py: 2, px: 2, alignItems: 'flex-start' }}>
                            <ListItemText
                              primary={
                                <Typography variant="body1" sx={{ fontWeight: 600, mb: 1 }}>
                                  {item.food.name}
                                </Typography>
                              }
                              secondary={
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                  <TextField
                                    type="number"
                                    label="Amount (grams)"
                                    value={item.grams}
                                    onChange={(e) => handleUpdateMealItemGrams(item.id, parseFloat(e.target.value) || 0)}
                                    size="small"
                                    inputProps={{ min: 1, step: 1 }}
                                    sx={{ maxWidth: 200 }}
                                  />
                                  <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mt: 0.5 }}>
                                    {(() => {
                                      const nutrition = calculateNutritionForFood(item.food, item.grams);
                                      return (
                                        <>
                                          <Chip label={`${nutrition.calories.toFixed(0)} cal`} size="small" sx={{ height: 20, fontSize: '0.7rem' }} />
                                          <Chip label={`P: ${nutrition.protein.toFixed(1)}g`} size="small" color="primary" sx={{ height: 20, fontSize: '0.7rem' }} />
                                          <Chip label={`C: ${nutrition.carbs.toFixed(1)}g`} size="small" color="secondary" sx={{ height: 20, fontSize: '0.7rem' }} />
                                          <Chip label={`F: ${nutrition.fat.toFixed(1)}g`} size="small" color="warning" sx={{ height: 20, fontSize: '0.7rem' }} />
                                          <Chip label={`Fiber: ${nutrition.fiber.toFixed(1)}g`} size="small" color="success" sx={{ height: 20, fontSize: '0.7rem' }} />
                                        </>
                                      );
                                    })()}
                                  </Box>
                                </Box>
                              }
                            />
                            <IconButton
                              edge="end"
                              onClick={() => handleRemoveMealItem(item.id)}
                              color="error"
                              sx={{ ml: 1 }}
                            >
                              <CloseIcon fontSize="small" />
                            </IconButton>
                          </ListItem>
                        </Box>
                      ))}
                    </List>
                  </Paper>

                  {/* Total Nutrition */}
                  <Paper sx={{ p: 2, bgcolor: 'primary.50', borderRadius: 2 }}>
                    <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600, color: 'primary.main' }}>
                      Total Nutrition
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                      {(() => {
                        const totals = mealItems.reduce((acc, item) => {
                          const nutrition = calculateNutritionForFood(item.food, item.grams);
                          return {
                            calories: acc.calories + nutrition.calories,
                            protein: acc.protein + nutrition.protein,
                            carbs: acc.carbs + nutrition.carbs,
                            fat: acc.fat + nutrition.fat,
                            fiber: acc.fiber + nutrition.fiber,
                          };
                        }, { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 });
                        
                        return (
                          <>
                            <Chip label={`${totals.calories.toFixed(0)} cal`} size="medium" sx={{ fontWeight: 600 }} />
                            <Chip label={`P: ${totals.protein.toFixed(1)}g`} size="medium" color="primary" sx={{ fontWeight: 600 }} />
                            <Chip label={`C: ${totals.carbs.toFixed(1)}g`} size="medium" color="secondary" sx={{ fontWeight: 600 }} />
                            <Chip label={`F: ${totals.fat.toFixed(1)}g`} size="medium" color="warning" sx={{ fontWeight: 600 }} />
                            <Chip label={`Fiber: ${totals.fiber.toFixed(1)}g`} size="medium" color="success" sx={{ fontWeight: 600 }} />
                          </>
                        );
                      })()}
                    </Box>
                  </Paper>
                </>
              )}
            </Box>
          )}
        </Box>

        {/* Action Buttons */}
        <Box sx={{ 
          borderTop: '1px solid',
          borderColor: 'divider',
          p: 2,
          bgcolor: 'background.paper',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <Button onClick={onClose} variant="outlined">
            Cancel
          </Button>
          <Button 
            onClick={handleSaveMeal} 
            variant="contained" 
            disabled={mealItems.length === 0}
            startIcon={<AddIcon />}
          >
            Log Meal ({mealItems.length} item{mealItems.length !== 1 ? 's' : ''})
          </Button>
        </Box>
      </DialogContent>
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
