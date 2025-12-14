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
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';
import DialPicker from './Common/DialPicker';
import {
  Close as CloseIcon,
  Search as SearchIcon,
  Restaurant as RestaurantIcon,
  History as HistoryIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon,
  Add as AddIcon,
  LightMode as BreakfastIcon,
  WbSunny as LunchIcon,
  NightsStay as DinnerIcon,
  Cookie as SnackIcon,
} from '@mui/icons-material';
import { searchFoods, calculateNutrition, calculateNutritionForPortion, getMeasurementOptions, decimalToFraction, addCustomFood, loadCustomFoods, loadNutritionDatabase } from '../services/nutritionDataService';
import AddCustomFoodDialog from './AddCustomFoodDialog';
import {
  addFavoriteFood,
  removeFavoriteFood,
  isFavoriteFood,
} from '../utils/nutritionStorage';

// Constants for portion validation
const MIN_PORTION_QUANTITY = 0.25;
const MIN_GRAMS = 1;
const DEFAULT_GRAMS = 100;

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
  
  // Meal type selection
  const [selectedMealType, setSelectedMealType] = useState('breakfast');
  
  // Custom food dialog
  const [showCustomFoodDialog, setShowCustomFoodDialog] = useState(false);
  const [allFoods, setAllFoods] = useState([]);

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
      // Set default meal type based on current time
      const hour = new Date().getHours();
      if (hour < 11) {
        setSelectedMealType('breakfast');
      } else if (hour < 16) {
        setSelectedMealType('lunch');
      } else if (hour < 21) {
        setSelectedMealType('dinner');
      } else {
        setSelectedMealType('snack');
      }
      // Load all foods for custom food validation
      loadAllFoods();
    }
  }, [open]);
  
  // Load all foods from database and custom foods
  const loadAllFoods = async () => {
    try {
      const database = await loadNutritionDatabase();
      const custom = loadCustomFoods();
      setAllFoods([...database, ...custom]);
    } catch (error) {
      console.error('Error loading foods:', error);
    }
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
  // Auto-adds to meal when selected, removes when deselected
  const handleToggleFoodSelection = (food) => {
    try {
      const foodId = food.id || food.fdcId;
      const newSelectedIds = new Set(selectedFoodIds);
      
      if (newSelectedIds.has(foodId)) {
        // Deselect - remove from selected set and meal
        newSelectedIds.delete(foodId);
        setMealItems(prevItems => prevItems.filter(item => {
          const itemFoodId = item.food.id || item.food.fdcId;
          return itemFoodId !== foodId;
        }));
      } else {
        // Select - add to selected set and meal
        newSelectedIds.add(foodId);
        const newMealItem = {
          id: crypto.randomUUID(),
          food: food,
          portionType: 'standard', // Default to standard portion
          portionQuantity: 1, // Number of standard portions
          grams: food.portion_grams || DEFAULT_GRAMS,
        };
        setMealItems(prevItems => [...prevItems, newMealItem]);
      }
      
      setSelectedFoodIds(newSelectedIds);
    } catch (error) {
      console.error('Error toggling food selection:', error);
      setError('Failed to select food. Please try again.');
    }
  };

  const handleRemoveMealItem = (itemId) => {
    try {
      // Find the item to get its food ID
      const itemToRemove = mealItems.find(item => item.id === itemId);
      if (itemToRemove) {
        const foodId = itemToRemove.food.id || itemToRemove.food.fdcId;
        // Remove from selected IDs as well
        setSelectedFoodIds(prevIds => {
          const newIds = new Set(prevIds);
          newIds.delete(foodId);
          return newIds;
        });
      }
      setMealItems(mealItems.filter(item => item.id !== itemId));
    } catch (error) {
      console.error('Error removing meal item:', error);
      setError('Failed to remove item. Please try again.');
    }
  };

  // Handle changing portion type (standard, grams, volume)
  const handleChangePortionType = (itemId, portionType) => {
    try {
      setMealItems(mealItems.map(item => {
        if (item.id !== itemId) return item;
        
        const food = item.food;
        let grams = item.grams;
        let portionQuantity = 1;
        
        if (portionType === 'standard') {
          grams = food.portion_grams || DEFAULT_GRAMS;
          portionQuantity = 1;
        } else if (portionType === 'grams') {
          grams = DEFAULT_GRAMS;
          portionQuantity = 1;
        } else if (portionType === 'volume') {
          grams = food.portion_grams || DEFAULT_GRAMS;
          portionQuantity = 1;
        }
        
        return { ...item, portionType, grams, portionQuantity };
      }));
    } catch (error) {
      console.error('Error changing portion type:', error);
      setError('Failed to change portion type. Please try again.');
    }
  };

  // Handle changing portion quantity (for standard portions)
  const handleChangePortionQuantity = (itemId, quantity) => {
    try {
      const validQuantity = Math.max(MIN_PORTION_QUANTITY, parseFloat(quantity) || 1);
      setMealItems(mealItems.map(item => {
        if (item.id !== itemId) return item;
        
        const food = item.food;
        const grams = (food.portion_grams || DEFAULT_GRAMS) * validQuantity;
        
        return { ...item, portionQuantity: validQuantity, grams };
      }));
    } catch (error) {
      console.error('Error updating portion quantity:', error);
      setError('Failed to update quantity. Please try again.');
    }
  };

  const handleUpdateMealItemGrams = (itemId, grams) => {
    try {
      // Ensure grams is a valid number
      const validGrams = Math.max(MIN_GRAMS, parseFloat(grams) || MIN_GRAMS);
      setMealItems(mealItems.map(item => 
        item.id === itemId ? { ...item, grams: validGrams, portionType: 'grams', portionQuantity: 1 } : item
      ));
    } catch (error) {
      console.error('Error updating meal item grams:', error);
      setError('Failed to update quantity. Please try again.');
    }
  };

  // Calculate nutrition based on portion type
  const calculateItemNutrition = (item) => {
    const { food, grams, portionType, portionQuantity = 1 } = item;
    if (portionType === 'standard' || portionType === 'volume') {
      return calculateNutritionForPortion(food, portionQuantity);
    }
    return calculateNutrition(food, grams);
  };

  const handleSaveMeal = () => {
    if (mealItems.length === 0) {
      return;
    }

    try {
      // Create entries for each meal item
      mealItems.forEach(item => {
        try {
          const nutrition = calculateItemNutrition(item);
          const entry = {
            id: `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
            date: new Date().toISOString(),
            foodName: item.food.name,
            grams: item.grams,
            portionType: item.portionType,
            portionQuantity: item.portionQuantity,
            mealType: selectedMealType, // Add meal type
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
  
  // Handle custom food creation
  const handleSaveCustomFood = (customFoodData) => {
    try {
      const newFood = addCustomFood(customFoodData);
      // Reload all foods to include the new custom food
      loadAllFoods();
      // Optionally, automatically add it to the search results or meal
      setSearchResults(prevResults => [newFood, ...prevResults]);
      setShowCustomFoodDialog(false);
    } catch (error) {
      console.error('Error adding custom food:', error);
      setError('Failed to add custom food. Please try again.');
    }
  };

  // Simplified search result item - compact display with only name, serving, and calories
  const renderSearchResultItem = (food, onClick, isSelected = false) => {
    try {
      // Calculate nutrition for 1 standard portion (using portion_factor)
      const nutrition = calculateNutritionForPortion(food, 1);
      const isFavorite = isFavoriteFood(food);
      
      return (
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 20 }}
          transition={{ duration: 0.15 }}
        >
          <ListItem
            button
            onClick={(e) => {
              e.preventDefault();
              onClick();
            }}
            sx={{ 
              py: 1,
              px: 2,
              '&:hover': {
                backgroundColor: 'action.hover',
              },
              transition: 'background-color 0.2s, border-color 0.2s, margin-left 0.3s',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              borderLeft: isSelected ? '4px solid' : 'none',
              borderLeftColor: isSelected ? 'success.main' : 'transparent',
              marginLeft: isSelected ? 1 : 0,
              backgroundColor: isSelected ? 'success.50' : 'transparent',
            }}
          >
            <ListItemText
              primary={
                <Typography 
                  variant="body2" 
                  sx={{ 
                    fontWeight: 500,
                    color: 'text.primary',
                  }}
                >
                  {food.name || food.foodName || 'Unknown Food'}
                </Typography>
              }
              secondary={
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  per one serving
                </Typography>
              }
              sx={{ flex: 1 }}
            />
            <Typography 
              variant="body2" 
              sx={{ 
                fontWeight: 600,
                color: 'text.primary',
                minWidth: 60,
                textAlign: 'right',
                mr: 1,
              }}
            >
              {nutrition.calories} cal
            </Typography>
            <IconButton
              size="small"
              onClick={(e) => handleToggleFavorite(food, e)}
              sx={{ 
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
      console.error('Error rendering search result item:', food, error);
      return (
        <ListItem sx={{ py: 1, px: 2 }}>
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
        {/* Meal Type Selection - Clean, icon-based design */}
        <Box sx={{ 
          px: 3, 
          pt: 2, 
          pb: 1.5,
          borderBottom: 1,
          borderColor: 'divider',
          bgcolor: 'background.paper',
        }}>
          <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block', fontWeight: 600 }}>
            MEAL TYPE
          </Typography>
          <ToggleButtonGroup
            value={selectedMealType}
            exclusive
            onChange={(e, newType) => newType && setSelectedMealType(newType)}
            fullWidth
            sx={{ 
              '& .MuiToggleButton-root': {
                py: 1.5,
                px: 2,
                border: 1,
                borderColor: 'divider',
                '&.Mui-selected': {
                  borderColor: 'primary.main',
                  bgcolor: 'primary.50',
                  color: 'primary.main',
                  fontWeight: 600,
                  '&:hover': {
                    bgcolor: 'primary.100',
                  },
                },
                '&:hover': {
                  bgcolor: 'action.hover',
                },
              },
            }}
          >
            <ToggleButton value="breakfast" sx={{ flexDirection: 'column', gap: 0.5 }}>
              <BreakfastIcon fontSize="small" />
              <Typography variant="caption" sx={{ fontSize: '0.7rem' }}>Breakfast</Typography>
            </ToggleButton>
            <ToggleButton value="lunch" sx={{ flexDirection: 'column', gap: 0.5 }}>
              <LunchIcon fontSize="small" />
              <Typography variant="caption" sx={{ fontSize: '0.7rem' }}>Lunch</Typography>
            </ToggleButton>
            <ToggleButton value="dinner" sx={{ flexDirection: 'column', gap: 0.5 }}>
              <DinnerIcon fontSize="small" />
              <Typography variant="caption" sx={{ fontSize: '0.7rem' }}>Dinner</Typography>
            </ToggleButton>
            <ToggleButton value="snack" sx={{ flexDirection: 'column', gap: 0.5 }}>
              <SnackIcon fontSize="small" />
              <Typography variant="caption" sx={{ fontSize: '0.7rem' }}>Snack</Typography>
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>

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

              {/* Selection indicator - shown when foods are selected */}
              {selectedFoodIds.size > 0 && (
                <Box sx={{ mb: 2 }}>
                  <Alert severity="success" sx={{ animation: 'fadeIn 0.3s ease-out' }}>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {selectedFoodIds.size} food{selectedFoodIds.size !== 1 ? 's' : ''} added to meal - Click on a food below to remove it
                    </Typography>
                  </Alert>
                </Box>
              )}

              {/* Results */}
              {!searching && searchResults.length > 0 && (
                <>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontWeight: 500 }}>
                    Found {searchResults.length} result{searchResults.length !== 1 ? 's' : ''} - Click to add to meal
                  </Typography>
                  <Paper variant="outlined" sx={{ borderRadius: 2 }}>
                    <List disablePadding>
                      {searchResults.map((food, index) => {
                        const foodId = food.id || food.fdcId || `temp-${food.name}-${index}`;
                        const isSelected = selectedFoodIds.has(foodId);
                        return (
                          <Box key={foodId}>
                            {index > 0 && <Divider />}
                            {renderSearchResultItem(food, () => handleToggleFoodSelection(food), isSelected)}
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
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                    Try simpler terms or check for spelling mistakes
                  </Typography>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<AddIcon />}
                    onClick={() => setShowCustomFoodDialog(true)}
                    fullWidth
                  >
                    Add as Custom Food
                  </Button>
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
                      {mealItems.map((item, index) => {
                        const measurementOptions = getMeasurementOptions(item.food);
                        const volumeOption = measurementOptions.find(opt => opt.type === 'volume');
                        const hasVolume = !!volumeOption;
                        
                        // Get display label for current portion
                        const getPortionDisplayLabel = () => {
                          if (item.portionType === 'grams') {
                            return `${item.grams}g`;
                          } else if (item.portionType === 'volume' && hasVolume) {
                            const volumeDisplay = decimalToFraction(item.food.volume_amount * item.portionQuantity);
                            return `${volumeDisplay} ${item.food.volume_unit}`;
                          } else {
                            // Standard portion
                            if (item.portionQuantity === 1) {
                              return item.food.standard_portion;
                            }
                            return `${item.portionQuantity} × ${item.food.standard_portion}`;
                          }
                        };
                        
                        return (
                          <Box key={item.id}>
                            {index > 0 && <Divider />}
                            <ListItem sx={{ py: 1.5, px: 2, alignItems: 'flex-start' }}>
                              <ListItemText
                                primary={
                                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
                                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                      {item.food.name}
                                    </Typography>
                                    <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                                      {getPortionDisplayLabel()}
                                    </Typography>
                                  </Box>
                                }
                                secondary={
                                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                    {/* Compact Portion Controls */}
                                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
                                      <ToggleButtonGroup
                                        value={item.portionType}
                                        exclusive
                                        onChange={(e, newType) => newType && handleChangePortionType(item.id, newType)}
                                        size="small"
                                        sx={{ flexWrap: 'wrap' }}
                                      >
                                        <ToggleButton value="standard" sx={{ px: 1, py: 0.25, fontSize: '0.7rem' }}>
                                          {item.food.standard_portion}
                                        </ToggleButton>
                                        <ToggleButton value="grams" sx={{ px: 1, py: 0.25, fontSize: '0.7rem' }}>
                                          grams
                                        </ToggleButton>
                                        {hasVolume && (
                                          <ToggleButton value="volume" sx={{ px: 1, py: 0.25, fontSize: '0.7rem' }}>
                                            {item.food.volume_unit}
                                          </ToggleButton>
                                        )}
                                      </ToggleButtonGroup>
                                      {item.portionType === 'grams' ? (
                                        <TextField
                                          type="number"
                                          value={item.grams}
                                          onChange={(e) => handleUpdateMealItemGrams(item.id, parseFloat(e.target.value) || 0)}
                                          size="small"
                                          inputProps={{ min: 1, step: 1, style: { padding: '4px 8px', width: '60px' } }}
                                          sx={{ width: 80 }}
                                        />
                                      ) : (
                                        <DialPicker
                                          value={item.portionQuantity}
                                          options={[
                                            { label: '1/4', value: 0.25 },
                                            { label: '1/2', value: 0.5 },
                                            { label: '3/4', value: 0.75 },
                                            { label: '1', value: 1 },
                                            { label: '1.5', value: 1.5 },
                                            { label: '2', value: 2 },
                                            { label: '2.5', value: 2.5 },
                                            { label: '3', value: 3 },
                                            { label: '4', value: 4 },
                                            { label: '5', value: 5 },
                                          ]}
                                          onChange={(value) => handleChangePortionQuantity(item.id, value)}
                                          minValueWidth="40px"
                                          useArrows={true}
                                          sx={{ minWidth: 100 }}
                                        />
                                      )}
                                    </Box>
                                    
                                    {/* Nutrition Display - kept detailed */}
                                    <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                                      {(() => {
                                        const nutrition = calculateItemNutrition(item);
                                        return (
                                          <>
                                            <Chip label={`${nutrition.calories} cal`} size="small" sx={{ height: 20, fontSize: '0.7rem' }} />
                                            <Chip label={`P: ${nutrition.protein}g`} size="small" color="primary" sx={{ height: 20, fontSize: '0.7rem' }} />
                                            <Chip label={`C: ${nutrition.carbs}g`} size="small" color="secondary" sx={{ height: 20, fontSize: '0.7rem' }} />
                                            <Chip label={`F: ${nutrition.fat}g`} size="small" color="warning" sx={{ height: 20, fontSize: '0.7rem' }} />
                                            <Chip label={`Fiber: ${nutrition.fiber}g`} size="small" color="success" sx={{ height: 20, fontSize: '0.7rem' }} />
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
                                size="small"
                                sx={{ ml: 1, mt: 0.5 }}
                              >
                                <CloseIcon fontSize="small" />
                              </IconButton>
                            </ListItem>
                          </Box>
                        );
                      })}
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
                          const nutrition = calculateItemNutrition(item);
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
                            <Chip label={`${totals.calories} cal`} size="medium" sx={{ fontWeight: 600 }} />
                            <Chip label={`P: ${totals.protein}g`} size="medium" color="primary" sx={{ fontWeight: 600 }} />
                            <Chip label={`C: ${totals.carbs}g`} size="medium" color="secondary" sx={{ fontWeight: 600 }} />
                            <Chip label={`F: ${totals.fat}g`} size="medium" color="warning" sx={{ fontWeight: 600 }} />
                            <Chip label={`Fiber: ${totals.fiber}g`} size="medium" color="success" sx={{ fontWeight: 600 }} />
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
      
      {/* Add Custom Food Dialog */}
      <AddCustomFoodDialog
        open={showCustomFoodDialog}
        onClose={() => setShowCustomFoodDialog(false)}
        onSave={handleSaveCustomFood}
        existingFoods={allFoods}
      />
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
