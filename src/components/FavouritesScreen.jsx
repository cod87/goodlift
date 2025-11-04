import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import PropTypes from 'prop-types';
import { Box, Card, CardContent, Typography, Button, Stack, Chip, IconButton, List, ListItem, ListItemText, Accordion, AccordionSummary, AccordionDetails, Dialog, DialogTitle, DialogContent, DialogActions, TextField } from '@mui/material';
import { Star, Edit, Delete, ExpandMore, FitnessCenter, PlayArrow } from '@mui/icons-material';
import { getFavoriteWorkouts, deleteFavoriteWorkout, updateFavoriteWorkoutName } from '../utils/storage';

/**
 * FavouritesScreen component displays all saved favorite workouts
 * Allows users to view, edit, delete, and start favorite workouts
 */
const FavouritesScreen = ({ onStartWorkout }) => {
  const [favoriteWorkouts, setFavoriteWorkouts] = useState([]);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingWorkout, setEditingWorkout] = useState(null);
  const [editedName, setEditedName] = useState('');
  const [expandedFavorite, setExpandedFavorite] = useState(null);

  useEffect(() => {
    // Scroll to top when component mounts
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setFavoriteWorkouts(getFavoriteWorkouts());
  }, []);

  const handleDeleteFavorite = (workoutId) => {
    if (window.confirm('Are you sure you want to delete this favorite workout?')) {
      deleteFavoriteWorkout(workoutId);
      setFavoriteWorkouts(getFavoriteWorkouts());
    }
  };

  const handleEditFavorite = (favorite) => {
    setEditingWorkout(favorite);
    setEditedName(favorite.name);
    setEditDialogOpen(true);
  };

  const handleSaveEdit = () => {
    if (editingWorkout && editedName.trim()) {
      updateFavoriteWorkoutName(editingWorkout.id, editedName.trim());
      setFavoriteWorkouts(getFavoriteWorkouts());
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

  const handleLoadFavorite = (favoriteWorkout) => {
    const equipmentFilter = favoriteWorkout.equipment === 'all' 
      ? 'all' 
      : [favoriteWorkout.equipment];
    onStartWorkout(favoriteWorkout.type, equipmentFilter, favoriteWorkout.exercises);
  };

  return (
    <motion.div
      className="screen"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      style={{
        padding: '1rem',
        maxWidth: '900px',
        margin: '0 auto',
      }}
    >
      <Box sx={{ mb: 4, textAlign: 'center' }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 1, mb: 2 }}>
          <Star sx={{ fontSize: 40, color: 'warning.main' }} />
          <Typography variant="h3" component="h1" sx={{ 
            fontWeight: 700,
            color: 'primary.main',
            fontSize: { xs: '2rem', sm: '2.5rem' }
          }}>
            Favourite Workouts
          </Typography>
        </Box>
        <Typography variant="body1" color="text.secondary">
          Your saved workout routines
        </Typography>
      </Box>

      {favoriteWorkouts.length === 0 ? (
        <Card sx={{ 
          p: 4, 
          textAlign: 'center',
          borderRadius: 3,
          boxShadow: '0 4px 12px rgba(19, 70, 134, 0.08)',
        }}>
          <FitnessCenter sx={{ fontSize: 80, color: 'text.disabled', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
            No Favourite Workouts Yet
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Save workouts during or after your workout session to access them here
          </Typography>
        </Card>
      ) : (
        <Stack spacing={2}>
          {favoriteWorkouts.map((favorite, idx) => (
            <motion.div
              key={favorite.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
            >
              <Card sx={{ 
                borderRadius: 3,
                boxShadow: '0 4px 12px rgba(19, 70, 134, 0.08)',
                transition: 'all 0.3s ease',
                '&:hover': {
                  boxShadow: '0 8px 24px rgba(19, 70, 134, 0.12)',
                  transform: 'translateY(-2px)',
                }
              }}>
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2 }}>
                    <Box sx={{ flex: 1 }}>
                      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                        <Star sx={{ color: 'warning.main', fontSize: 24 }} />
                        <Typography variant="h5" sx={{ fontWeight: 600, color: 'primary.main' }}>
                          {favorite.name}
                        </Typography>
                      </Stack>
                      <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
                        <Chip 
                          label={favorite.type.charAt(0).toUpperCase() + favorite.type.slice(1) + ' Body'} 
                          size="small"
                          color="primary"
                          sx={{ fontWeight: 600 }}
                        />
                        <Chip 
                          label={`${favorite.exercises.length} exercises`} 
                          size="small"
                          variant="outlined"
                        />
                      </Stack>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      <IconButton 
                        size="small"
                        onClick={() => handleEditFavorite(favorite)}
                        sx={{ 
                          color: 'primary.main',
                          '&:hover': { bgcolor: 'primary.light', color: 'primary.contrastText' }
                        }}
                      >
                        <Edit fontSize="small" />
                      </IconButton>
                      <IconButton 
                        size="small"
                        onClick={() => handleDeleteFavorite(favorite.id)}
                        sx={{ 
                          color: 'error.main',
                          '&:hover': { bgcolor: 'error.light', color: 'error.contrastText' }
                        }}
                      >
                        <Delete fontSize="small" />
                      </IconButton>
                    </Box>
                  </Box>
                  
                  {/* Expandable exercise list */}
                  <Accordion 
                    expanded={expandedFavorite === favorite.id}
                    onChange={() => setExpandedFavorite(expandedFavorite === favorite.id ? null : favorite.id)}
                    sx={{ 
                      boxShadow: 'none', 
                      '&:before': { display: 'none' }, 
                      bgcolor: 'rgba(19, 70, 134, 0.03)',
                      borderRadius: 2,
                      mb: 2
                    }}
                  >
                    <AccordionSummary 
                      expandIcon={<ExpandMore />}
                      sx={{ 
                        minHeight: 'auto', 
                        '& .MuiAccordionSummary-content': { margin: '12px 0' },
                        borderRadius: 2,
                      }}
                    >
                      <Typography variant="body2" sx={{ fontWeight: 600, color: 'primary.main' }}>
                        {expandedFavorite === favorite.id ? 'Hide' : 'View'} Exercises
                      </Typography>
                    </AccordionSummary>
                    <AccordionDetails sx={{ pt: 0 }}>
                      <List dense sx={{ py: 0 }}>
                        {favorite.exercises.map((exercise, idx) => (
                          <ListItem key={idx} sx={{ px: 2, py: 1 }}>
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
                    variant="contained"
                    fullWidth
                    size="large"
                    startIcon={<PlayArrow />}
                    onClick={() => handleLoadFavorite(favorite)}
                    sx={{ 
                      borderRadius: 2,
                      py: 1.5,
                      fontWeight: 600,
                      textTransform: 'none',
                      fontSize: '1rem',
                    }}
                  >
                    Start This Workout
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </Stack>
      )}
      
      {/* Edit Dialog */}
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
    </motion.div>
  );
};

FavouritesScreen.propTypes = {
  onStartWorkout: PropTypes.func.isRequired,
};

export default FavouritesScreen;
