/**
 * AddCustomFoodDialog - Dialog for adding custom food items
 * 
 * Features:
 * - Simple form for entering custom food details
 * - Basic validation for required fields
 * - Check for duplicate food names
 * - Clean, minimalist design matching app style
 */

import { useState } from 'react';
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

const AddCustomFoodDialog = ({ open, onClose, onSave, existingFoods = [] }) => {
  const [formData, setFormData] = useState({
    name: '',
    calories: '',
    protein: '',
    carbs: '',
    fat: '',
    fiber: '',
    standard_portion: '100g',
    portion_grams: '100',
  });
  
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState('');

  // Reset form when dialog opens/closes
  const handleClose = () => {
    setFormData({
      name: '',
      calories: '',
      protein: '',
      carbs: '',
      fat: '',
      fiber: '',
      standard_portion: '100g',
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
      // Check for duplicate names (case-insensitive)
      const nameLower = formData.name.trim().toLowerCase();
      const isDuplicate = existingFoods.some(
        food => food.name.toLowerCase() === nameLower
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
      const customFood = {
        name: formData.name.trim(),
        calories: parseFloat(formData.calories),
        protein: parseFloat(formData.protein),
        carbs: parseFloat(formData.carbs),
        fat: parseFloat(formData.fat),
        fiber: parseFloat(formData.fiber),
        standard_portion: formData.standard_portion.trim(),
        portion_grams: parseFloat(formData.portion_grams),
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
            Add Custom Food
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
            label="Food Name"
            value={formData.name}
            onChange={handleChange('name')}
            error={!!errors.name}
            helperText={errors.name || 'Enter a unique name for this food'}
            required
            autoFocus
          />

          {/* Nutrition values per 100g */}
          <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 1, mb: -1 }}>
            Nutrition per 100g
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

          {/* Portion information */}
          <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 1, mb: -1 }}>
            Standard Portion
          </Typography>

          <Box sx={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 2 }}>
            <TextField
              label="Portion Description"
              value={formData.standard_portion}
              onChange={handleChange('standard_portion')}
              error={!!errors.standard_portion}
              helperText={errors.standard_portion || 'e.g., "1 cup", "1 medium apple"'}
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

          <Alert severity="info" sx={{ mt: 1 }}>
            <Typography variant="caption">
              Tip: Enter nutrition values for 100g. The standard portion is how you typically measure this food.
            </Typography>
          </Alert>
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2, pt: 1 }}>
        <Button onClick={handleClose} variant="outlined">
          Cancel
        </Button>
        <Button onClick={handleSubmit} variant="contained">
          Add Food
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
};

export default AddCustomFoodDialog;
