/**
 * AddCustomFoodDialog - Dialog for adding custom food items
 * 
 * Features:
 * - Simple form for entering custom food details
 * - Basic validation for required fields
 * - Check for duplicate food names
 * - Clean, minimalist design matching app style
 */

import { useState, useEffect } from 'react';
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
  Alert,
  IconButton,
} from '@mui/material';
import {
  Close as CloseIcon,
  RestaurantMenu as FoodIcon,
} from '@mui/icons-material';

const AddCustomFoodDialog = ({ open, onClose, onSave, existingFoods = [], editingFood = null }) => {
  const [formData, setFormData] = useState({
    name: '',
    calories: '',
    protein: '',
    carbs: '',
    fat: '',
    fiber: '',
    standard_portion: '1 serving',
    portion_grams: '100',
  });
  
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState('');

  // Load editing food data when editingFood prop changes
  useEffect(() => {
    if (editingFood && open) {
      // When editing, we need to denormalize the values back to the serving size
      const portionGrams = editingFood.portion_grams || 100;
      const denormalizationFactor = portionGrams / 100;
      
      setFormData({
        name: editingFood.name || '',
        calories: Math.round(editingFood.calories * denormalizationFactor).toString(),
        protein: (editingFood.protein * denormalizationFactor).toFixed(1),
        carbs: (editingFood.carbs * denormalizationFactor).toFixed(1),
        fat: (editingFood.fat * denormalizationFactor).toFixed(1),
        fiber: (editingFood.fiber * denormalizationFactor).toFixed(1),
        standard_portion: editingFood.standard_portion || '1 serving',
        portion_grams: portionGrams.toString(),
      });
    } else if (!editingFood && open) {
      // Reset to default when creating new
      setFormData({
        name: '',
        calories: '',
        protein: '',
        carbs: '',
        fat: '',
        fiber: '',
        standard_portion: '1 serving',
        portion_grams: '100',
      });
    }
  }, [editingFood, open]);

  // Reset form when dialog opens/closes
  const handleClose = () => {
    setFormData({
      name: '',
      calories: '',
      protein: '',
      carbs: '',
      fat: '',
      fiber: '',
      standard_portion: '1 serving',
      portion_grams: '100',
    });
    setErrors({});
    setSubmitError('');
    onClose();
  };

  // Validate form data
  const validateForm = () => {
    const newErrors = {};

    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = 'Food name is required';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Food name must be at least 2 characters';
    } else {
      // Check for duplicate names (case-insensitive), excluding current food when editing
      const nameLower = formData.name.trim().toLowerCase();
      const isDuplicate = existingFoods.some(
        food => food.name.toLowerCase() === nameLower && food.id !== editingFood?.id
      );
      if (isDuplicate) {
        newErrors.name = 'A food with this name already exists';
      }
    }

    // Numeric validations
    const numericFields = ['calories', 'protein', 'carbs', 'fat', 'fiber', 'portion_grams'];
    numericFields.forEach(field => {
      const value = parseFloat(formData[field]);
      if (formData[field] === '' || isNaN(value) || value < 0) {
        newErrors[field] = 'Must be a positive number';
      }
      // Special validation for portion_grams - must be greater than 0
      if (field === 'portion_grams' && value === 0) {
        newErrors[field] = 'Serving size must be greater than 0';
      }
    });

    // Portion validation
    if (!formData.standard_portion.trim()) {
      newErrors.standard_portion = 'Portion description is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    setSubmitError('');
    
    if (!validateForm()) {
      return;
    }

    try {
      const portionGrams = parseFloat(formData.portion_grams);
      
      // Safety check: ensure portionGrams is valid before division
      if (!portionGrams || portionGrams <= 0) {
        setSubmitError('Invalid serving size. Please enter a positive number.');
        return;
      }
      
      const normalizationFactor = 100 / portionGrams;
      
      // Normalize all nutrition values to per-100g
      const customFood = {
        name: formData.name.trim(),
        calories: Math.round(parseFloat(formData.calories) * normalizationFactor),
        protein: Math.round(parseFloat(formData.protein) * normalizationFactor * 10) / 10,
        carbs: Math.round(parseFloat(formData.carbs) * normalizationFactor * 10) / 10,
        fat: Math.round(parseFloat(formData.fat) * normalizationFactor * 10) / 10,
        fiber: Math.round(parseFloat(formData.fiber) * normalizationFactor * 10) / 10,
        standard_portion: formData.standard_portion.trim(),
        portion_grams: portionGrams,
      };

      onSave(customFood);
      handleClose();
    } catch (error) {
      console.error('Error creating custom food:', error);
      setSubmitError('Failed to create custom food. Please try again.');
    }
  };

  const handleChange = (field) => (event) => {
    setFormData({
      ...formData,
      [field]: event.target.value,
    });
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors({
        ...errors,
        [field]: undefined,
      });
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
        }
      }}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        pb: 2,
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <FoodIcon color="primary" />
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            {editingFood ? 'Edit Custom Ingredient' : 'Add Custom Ingredient'}
          </Typography>
        </Box>
        <IconButton onClick={handleClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ pt: 1 }}>
        {submitError && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setSubmitError('')}>
            {submitError}
          </Alert>
        )}

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {/* Food Name */}
          <TextField
            fullWidth
            label="Ingredient Name"
            value={formData.name}
            onChange={handleChange('name')}
            error={!!errors.name}
            helperText={errors.name || 'Enter a unique name for this ingredient'}
            required
            autoFocus
          />

          {/* Serving Size - Show prominently first */}
          <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 1, mb: -1 }}>
            Serving Size
          </Typography>

          <Box sx={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 2 }}>
            <TextField
              label="Serving Description"
              value={formData.standard_portion}
              onChange={handleChange('standard_portion')}
              error={!!errors.standard_portion}
              helperText={errors.standard_portion || 'e.g., "1 cup", "1 medium apple", "1 scoop"'}
              required
            />
            <TextField
              label="Grams"
              type="number"
              value={formData.portion_grams}
              onChange={handleChange('portion_grams')}
              error={!!errors.portion_grams}
              helperText={errors.portion_grams}
              required
              inputProps={{ min: 1, step: 1 }}
            />
          </Box>

          {/* Nutrition values per serving */}
          <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 2, mb: -1 }}>
            Nutrition per Serving ({formData.portion_grams}g)
          </Typography>

          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2 }}>
            <TextField
              label="Calories"
              type="number"
              value={formData.calories}
              onChange={handleChange('calories')}
              error={!!errors.calories}
              helperText={errors.calories}
              required
              inputProps={{ min: 0, step: 1 }}
            />
            <TextField
              label="Protein (g)"
              type="number"
              value={formData.protein}
              onChange={handleChange('protein')}
              error={!!errors.protein}
              helperText={errors.protein}
              required
              inputProps={{ min: 0, step: 0.1 }}
            />
            <TextField
              label="Carbs (g)"
              type="number"
              value={formData.carbs}
              onChange={handleChange('carbs')}
              error={!!errors.carbs}
              helperText={errors.carbs}
              required
              inputProps={{ min: 0, step: 0.1 }}
            />
            <TextField
              label="Fat (g)"
              type="number"
              value={formData.fat}
              onChange={handleChange('fat')}
              error={!!errors.fat}
              helperText={errors.fat}
              required
              inputProps={{ min: 0, step: 0.1 }}
            />
            <TextField
              label="Fiber (g)"
              type="number"
              value={formData.fiber}
              onChange={handleChange('fiber')}
              error={!!errors.fiber}
              helperText={errors.fiber}
              required
              inputProps={{ min: 0, step: 0.1 }}
            />
          </Box>

          <Alert severity="info" sx={{ mt: 1 }}>
            <Typography variant="caption">
              💡 Tip: First set your serving size, then enter nutrition values for that serving. They will be automatically calculated per 100g for consistency.
            </Typography>
          </Alert>
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2, pt: 1 }}>
        <Button onClick={handleClose} variant="outlined">
          Cancel
        </Button>
        <Button onClick={handleSubmit} variant="contained">
          {editingFood ? 'Save Changes' : 'Add Ingredient'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

AddCustomFoodDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
  existingFoods: PropTypes.array,
  editingFood: PropTypes.object,
};

export default AddCustomFoodDialog;
