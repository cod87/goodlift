import { memo, useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { motion, AnimatePresence } from 'framer-motion';
import { Box, Card, CardContent, Typography, FormControlLabel, Radio, RadioGroup, Button, Accordion, AccordionSummary, AccordionDetails, IconButton, Stack, Chip, Dialog, DialogTitle, DialogContent, DialogActions, TextField, List, ListItem, ListItemText, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import { ExpandMore, Delete, Star, Edit, Add } from '@mui/icons-material';
import { getFavoriteWorkouts, deleteFavoriteWorkout, updateFavoriteWorkoutName } from '../utils/storage';
import CompactHeader from './Common/CompactHeader';
// CustomWorkoutWizard removed - no longer using workout planning

/**
 * SelectionScreen component for workout configuration
 * Allows users to select workout type and equipment filters
 * Memoized to prevent unnecessary re-renders
 */
const SelectionScreen = memo(({ 
  workoutType,
  selectedEquipment,
  equipmentOptions,
  onWorkoutTypeChange,
  onEquipmentChange,
  onStartWorkout,
  onCustomize,
  loading,
}) => {
  const [favoriteWorkouts, setFavoriteWorkouts] = useState([]);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingWorkout, setEditingWorkout] = useState(null);
  const [editedName, setEditedName] = useState('');
  const [expandedFavorite, setExpandedFavorite] = useState(null);
  // showPlanModal removed - no longer using workout planning

  useEffect(() => {
    // Scroll to top when component mounts
    window.scrollTo({ top: 0, behavior: 'smooth' });
    getFavoriteWorkouts().then(setFavoriteWorkouts);
  }, []);

  const handleStartClick = () => {
    if (workoutType) {
      const equipmentFilter = selectedEquipment.has('all') 
        ? 'all' 
        : Array.from(selectedEquipment);
      onStartWorkout(workoutType, equipmentFilter);
    }
  };

  const handleCustomizeClick = () => {
    if (workoutType && onCustomize) {
      const equipmentFilter = selectedEquipment.has('all') 
        ? 'all' 
        : Array.from(selectedEquipment);
      onCustomize(workoutType, equipmentFilter);
    }
  };

  const handleDeleteFavorite = async (workoutId) => {
    await deleteFavoriteWorkout(workoutId);
    const favorites = await getFavoriteWorkouts();
    setFavoriteWorkouts(favorites);
  };

  const handleEditFavorite = (favorite) => {
    setEditingWorkout(favorite);
    setEditedName(favorite.name);
    setEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (editingWorkout && editedName.trim()) {
      await updateFavoriteWorkoutName(editingWorkout.id, editedName.trim());
      const favorites = await getFavoriteWorkouts();
      setFavoriteWorkouts(favorites);
      setEditDialogOpen(false);
      setEditingWorkout(null);
      setEditedName('');
    }
  };

  const handleCancelEdit = () => {
    setEditDialogOpen(false);
    setEditingWorkout(null);
    setEditedName('');
  };

  // Plan modal handlers removed - no longer using workout planning

  const handleLoadFavorite = (favoriteWorkout) => {
    onWorkoutTypeChange(favoriteWorkout.type);
    onEquipmentChange(favoriteWorkout.equipment || 'all');
    const equipmentFilter = favoriteWorkout.equipment === 'all' 
      ? 'all' 
      : [favoriteWorkout.equipment];
    onStartWorkout(favoriteWorkout.type, equipmentFilter, favoriteWorkout.exercises);
  };

  const handleEquipmentToggle = (equipment) => {
    const newSelected = new Set(selectedEquipment);
    
    if (equipment === 'all') {
      // If "All Equipment" is clicked, clear all other selections
      newSelected.clear();
      newSelected.add('all');
    } else {
      // If any specific equipment is clicked
      if (newSelected.has('all')) {
        // Remove "All Equipment" if it was selected
        newSelected.delete('all');
      }
      
      // Toggle the specific equipment
      if (newSelected.has(equipment)) {
        newSelected.delete(equipment);
      } else {
        newSelected.add(equipment);
      }
      
      // If no equipment is selected, default to "All Equipment"
      if (newSelected.size === 0) {
        newSelected.add('all');
      }
    }
    
    onEquipmentChange(newSelected);
  };

  // Get display text for equipment selection
  const getEquipmentDisplayText = () => {
    if (selectedEquipment.has('all')) {
      return 'All Equipment';
    }
    const selected = Array.from(selectedEquipment);
    if (selected.length === 0) {
      return 'All Equipment';
    }
    if (selected.length === 1) {
      const equipment = equipmentOptions.find(e => e.toLowerCase() === selected[0]);
      return equipment || selected[0];
    }
    return `${selected.length} selected`;
  };

  return (
    <Box sx={{ width: '100%', minHeight: '100vh' }}>
      <CompactHeader title="Workouts" icon="⚡" />
      
      <motion.div
        className="screen selection-screen"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 'calc(100vh - 4rem)',
          padding: '1rem',
          paddingBottom: 'max(2rem, calc(env(safe-area-inset-bottom) + 1rem))',
          overflow: 'auto',
        }}
      >
      {loading ? (
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="h5" sx={{ mb: 2 }}>
            Generating workout...
          </Typography>
        </Box>
      ) : (
        <Box sx={{ width: '100%', maxWidth: 800 }}>
          {/* Create New Plan Button removed - no longer using workout planning */}

          {/* Main Configuration Card */}
        <Card sx={{ 
          maxWidth: 800,
          width: '100%',
          borderRadius: 3,
          boxShadow: '0 8px 32px rgba(19, 70, 134, 0.12)',
        }}>
          <CardContent sx={{ p: { xs: 2, sm: 4 } }}>
            {/* Workout Type and Equipment Dropdowns in Single Row */}
            <Box sx={{ mb: 3 }}>
              <Stack 
                direction={{ xs: 'column', sm: 'row' }} 
                spacing={2}
                sx={{ width: '100%' }}
              >
                {/* Workout Type Dropdown */}
                <FormControl fullWidth>
                  <InputLabel id="workout-type-label">Workout Type</InputLabel>
                  <Select
                    labelId="workout-type-label"
                    id="workout-type-select"
                    value={workoutType || 'full'}
                    label="Workout Type"
                    onChange={(e) => onWorkoutTypeChange(e.target.value)}
                  >
                    <MenuItem value="full">Full Body</MenuItem>
                    <MenuItem value="upper">Upper Body</MenuItem>
                    <MenuItem value="lower">Lower Body</MenuItem>
                    <MenuItem value="push">Push</MenuItem>
                    <MenuItem value="pull">Pull</MenuItem>
                    <MenuItem value="legs">Legs</MenuItem>
                  </Select>
                </FormControl>

                {/* Equipment Accordion */}
                <Box sx={{ width: '100%' }}>
                  <Accordion 
                    sx={{ 
                      boxShadow: 'none',
                      border: '1px solid rgba(0, 0, 0, 0.23)',
                      borderRadius: '4px',
                      '&:before': { display: 'none' },
                      '&.Mui-expanded': {
                        margin: 0,
                      },
                    }}
                  >
                    <AccordionSummary
                      expandIcon={<ExpandMore />}
                      sx={{
                        minHeight: '56px',
                        '&.Mui-expanded': {
                          minHeight: '56px',
                        },
                        '& .MuiAccordionSummary-content': {
                          margin: '16px 0',
                          '&.Mui-expanded': {
                            margin: '16px 0',
                          },
                        },
                      }}
                    >
                      <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
                        <Typography 
                          variant="caption" 
                          sx={{ 
                            color: 'rgba(0, 0, 0, 0.6)',
                            fontSize: '0.75rem',
                            lineHeight: 1,
                            mb: 0.5,
                          }}
                        >
                          Equipment
                        </Typography>
                        <Typography 
                          sx={{ 
                            color: 'rgba(0, 0, 0, 0.87)',
                            fontSize: '1rem',
                          }}
                        >
                          {getEquipmentDisplayText()}
                        </Typography>
                      </Box>
                    </AccordionSummary>
                    <AccordionDetails sx={{ pt: 0, pb: 2 }}>
                      <Box component="div" role="group" aria-label="Equipment selection">
                        <FormControlLabel 
                          control={
                            <Radio 
                              checked={selectedEquipment.has('all')}
                              onChange={() => handleEquipmentToggle('all')}
                            />
                          }
                          label="All Equipment"
                          sx={{ mb: 1, display: 'flex' }}
                        />
                        {equipmentOptions.map((equipment) => (
                          <FormControlLabel
                            key={equipment}
                            control={
                              <Radio 
                                checked={selectedEquipment.has(equipment.toLowerCase())}
                                onChange={() => handleEquipmentToggle(equipment.toLowerCase())}
                              />
                            }
                            label={equipment}
                            sx={{ mb: 1, display: 'flex' }}
                          />
                        ))}
                      </Box>
                    </AccordionDetails>
                  </Accordion>
                </Box>
              </Stack>
            </Box>

            {/* Favorite Workouts */}
            {favoriteWorkouts.length > 0 && (
              <Box sx={{ mb: 3 }}>
                <Accordion sx={{ boxShadow: 'none', '&:before': { display: 'none' } }}>
                  <AccordionSummary expandIcon={<ExpandMore />}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Star sx={{ color: 'warning.main' }} />
                      <Typography variant="h6" sx={{ 
                        fontWeight: 600,
                        color: 'text.primary',
                        fontSize: { xs: '1rem', sm: '1.25rem' },
                      }}>
                        Favorite Workouts ({favoriteWorkouts.length})
                      </Typography>
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Stack spacing={1.5}>
                      {favoriteWorkouts.map((favorite) => (
                        <Card 
                          key={favorite.id} 
                          sx={{ 
                            border: '1px solid',
                            borderColor: 'divider',
                            boxShadow: 'none',
                            '&:hover': {
                              boxShadow: '0 2px 8px rgba(19, 70, 134, 0.1)',
                            }
                          }}
                        >
                          <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 1 }}>
                              <Box sx={{ flex: 1 }}>
                                <Typography variant="body1" sx={{ fontWeight: 600, mb: 0.5 }}>
                                  {favorite.name}
                                </Typography>
                                <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
                                  <Chip 
                                    label={favorite.type.charAt(0).toUpperCase() + favorite.type.slice(1)} 
                                    size="small"
                                    sx={{ fontSize: '0.7rem' }}
                                  />
                                  <Chip 
                                    label={`${favorite.exercises.length} exercises`} 
                                    size="small"
                                    variant="outlined"
                                    sx={{ fontSize: '0.7rem' }}
                                  />
                                </Stack>
                              </Box>
                              <Box sx={{ display: 'flex', gap: 0.5 }}>
                                <IconButton 
                                  size="small"
                                  onClick={() => handleEditFavorite(favorite)}
                                  sx={{ color: 'primary.main' }}
                                >
                                  <Edit fontSize="small" />
                                </IconButton>
                                <IconButton 
                                  size="small"
                                  onClick={() => handleDeleteFavorite(favorite.id)}
                                  sx={{ color: 'error.main' }}
                                >
                                  <Delete fontSize="small" />
                                </IconButton>
                              </Box>
                            </Box>
                            
                            {/* Expandable exercise list */}
                            <Accordion 
                              expanded={expandedFavorite === favorite.id}
                              onChange={() => setExpandedFavorite(expandedFavorite === favorite.id ? null : favorite.id)}
                              sx={{ boxShadow: 'none', '&:before': { display: 'none' }, bgcolor: 'transparent' }}
                            >
                              <AccordionSummary 
                                expandIcon={<ExpandMore />}
                                sx={{ minHeight: 'auto', '& .MuiAccordionSummary-content': { margin: '8px 0' } }}
                              >
                                <Typography variant="caption" sx={{ fontWeight: 600, color: 'primary.main' }}>
                                  View Exercises
                                </Typography>
                              </AccordionSummary>
                              <AccordionDetails sx={{ pt: 0 }}>
                                <List dense sx={{ py: 0 }}>
                                  {favorite.exercises.map((exercise, idx) => (
                                    <ListItem key={idx} sx={{ px: 0 }}>
                                      <ListItemText 
                                        primary={exercise['Exercise Name'] || exercise.name || 'Unknown Exercise'}
                                        secondary={`${exercise.Equipment || exercise.equipment || 'N/A'} • ${exercise['Primary Muscle'] || exercise.primaryMuscle || 'N/A'}`}
                                        primaryTypographyProps={{ variant: 'body2', fontWeight: 500 }}
                                        secondaryTypographyProps={{ variant: 'caption' }}
                                      />
                                    </ListItem>
                                  ))}
                                </List>
                              </AccordionDetails>
                            </Accordion>
                            
                            <Button 
                              size="small"
                              variant="contained"
                              onClick={() => handleLoadFavorite(favorite)}
                              sx={{ fontSize: '0.8rem', textTransform: 'none', mt: 1 }}
                              fullWidth
                            >
                              Load Workout
                            </Button>
                          </CardContent>
                        </Card>
                      ))}
                    </Stack>
                  </AccordionDetails>
                </Accordion>
              </Box>
            )}

            {/* Customize and Generate Buttons */}
            <Stack 
              direction="row" 
              spacing={2}
              sx={{ width: '100%' }}
            >
              <Button
                variant="outlined"
                size="large"
                fullWidth
                disabled={!workoutType}
                onClick={handleCustomizeClick}
                sx={{
                  py: 2,
                  fontSize: '1.1rem',
                  fontWeight: 600,
                  borderRadius: 2,
                  textTransform: 'none',
                  borderWidth: 2,
                  '&:hover': {
                    borderWidth: 2,
                  }
                }}
              >
                Customize
              </Button>
              <Button
                variant="contained"
                size="large"
                fullWidth
                disabled={!workoutType}
                onClick={handleStartClick}
                sx={{
                  py: 2,
                  fontSize: '1.1rem',
                  fontWeight: 600,
                  borderRadius: 2,
                  textTransform: 'none',
                }}
              >
                Generate
              </Button>
            </Stack>
          </CardContent>
        </Card>
        </Box>
      )}
      
      {/* Edit Favorite Name Dialog */}
      <Dialog open={editDialogOpen} onClose={handleCancelEdit} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Workout Name</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Workout Name"
            type="text"
            fullWidth
            variant="outlined"
            value={editedName}
            onChange={(e) => setEditedName(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleSaveEdit();
              }
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelEdit} color="inherit">
            Cancel
          </Button>
          <Button onClick={handleSaveEdit} variant="contained" disabled={!editedName.trim()}>
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Custom Workout Wizard removed - no longer using workout planning */}
    </motion.div>
    </Box>
  );
});

SelectionScreen.displayName = 'SelectionScreen';

SelectionScreen.propTypes = {
  workoutType: PropTypes.string.isRequired,
  selectedEquipment: PropTypes.instanceOf(Set).isRequired,
  equipmentOptions: PropTypes.array.isRequired,
  onWorkoutTypeChange: PropTypes.func.isRequired,
  onEquipmentChange: PropTypes.func.isRequired,
  onStartWorkout: PropTypes.func.isRequired,
  onCustomize: PropTypes.func,
  onNavigate: PropTypes.func,
  loading: PropTypes.bool.isRequired,
};

export default SelectionScreen;
