import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import PropTypes from 'prop-types';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  InputAdornment,
  IconButton,
  Chip,
  Stack,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Tooltip,
} from '@mui/material';
import {
  Search as SearchIcon,
  FavoriteBorderOutlined,
  FavoriteOutlined,
  FitnessCenter,
  Edit as EditIcon,
} from '@mui/icons-material';
import { useWorkoutGenerator } from '../hooks/useWorkoutGenerator';
import {
  toggleFavoriteExercise,
  isFavoriteExercise,
  getExerciseWeight,
  setExerciseWeight,
  getExerciseTargetReps,
  setExerciseTargetReps,
} from '../utils/storage';

/**
 * ExerciseListPage component
 * Displays all exercises with favorite toggle, filtering, and settings
 */
const ExerciseListPage = () => {
  const { allExercises, loading } = useWorkoutGenerator();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [favoriteExercises, setFavoriteExercises] = useState(new Set());
  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [exerciseWeight, setExerciseWeightState] = useState(0);
  const [exerciseReps, setExerciseRepsState] = useState(12);

  // Load favorites on mount
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    const loadFavorites = () => {
      const favorites = new Set();
      allExercises.forEach(ex => {
        if (isFavoriteExercise(ex['Exercise Name'])) {
          favorites.add(ex['Exercise Name']);
        }
      });
      setFavoriteExercises(favorites);
    };
    
    loadFavorites();
  }, [allExercises]);

  // Extract unique categories from exercises
  const categories = useMemo(() => {
    const cats = new Set();
    allExercises.forEach(ex => {
      const primaryMuscle = ex['Primary Muscle'].split('(')[0].trim();
      cats.add(primaryMuscle);
    });
    return ['all', ...Array.from(cats).sort()];
  }, [allExercises]);

  // Filter exercises based on search and category
  const filteredExercises = useMemo(() => {
    return allExercises.filter(exercise => {
      const matchesSearch = searchTerm === '' ||
        exercise['Exercise Name'].toLowerCase().includes(searchTerm.toLowerCase()) ||
        exercise['Primary Muscle'].toLowerCase().includes(searchTerm.toLowerCase()) ||
        exercise['Equipment'].toLowerCase().includes(searchTerm.toLowerCase());

      const primaryMuscle = exercise['Primary Muscle'].split('(')[0].trim();
      const matchesCategory = selectedCategory === 'all' || primaryMuscle === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [allExercises, searchTerm, selectedCategory]);

  const handleToggleFavorite = (exerciseName, event) => {
    event.stopPropagation();
    const isFavorited = toggleFavoriteExercise(exerciseName);
    
    setFavoriteExercises(prev => {
      const updated = new Set(prev);
      if (isFavorited) {
        updated.add(exerciseName);
      } else {
        updated.delete(exerciseName);
      }
      return updated;
    });
  };

  const handleOpenSettings = async (exercise) => {
    setSelectedExercise(exercise);
    const weight = await getExerciseWeight(exercise['Exercise Name']);
    const reps = await getExerciseTargetReps(exercise['Exercise Name']);
    setExerciseWeightState(weight);
    setExerciseRepsState(reps);
    setSettingsDialogOpen(true);
  };

  const handleSaveSettings = async () => {
    if (selectedExercise) {
      await setExerciseWeight(selectedExercise['Exercise Name'], exerciseWeight);
      await setExerciseTargetReps(selectedExercise['Exercise Name'], exerciseReps);
      setSettingsDialogOpen(false);
      setSelectedExercise(null);
    }
  };

  const handleCloseSettings = () => {
    setSettingsDialogOpen(false);
    setSelectedExercise(null);
  };

  if (loading) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="h5" color="text.secondary">
          Loading exercises...
        </Typography>
      </Box>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      style={{ padding: '1rem', maxWidth: '1200px', margin: '0 auto' }}
    >
      {/* Header */}
      <Box sx={{ mb: 3, textAlign: 'center' }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 1, mb: 1 }}>
          <FitnessCenter sx={{ fontSize: 40, color: 'primary.main' }} />
          <Typography
            variant="h3"
            component="h1"
            sx={{
              fontWeight: 700,
              color: 'primary.main',
              fontSize: { xs: '2rem', sm: '2.5rem' },
            }}
          >
            Exercise List
          </Typography>
        </Box>
        <Typography variant="body1" color="text.secondary">
          Browse all exercises and mark your favorites
        </Typography>
      </Box>

      {/* Filter Bar */}
      <Card
        sx={{
          mb: 3,
          p: 2,
          borderRadius: 3,
          boxShadow: '0 4px 12px rgba(19, 70, 134, 0.08)',
        }}
      >
        <Stack spacing={2}>
          {/* Search */}
          <TextField
            fullWidth
            placeholder="Search exercises..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
              },
            }}
          />

          {/* Category Chips */}
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {categories.map(category => (
              <Chip
                key={category}
                label={category === 'all' ? 'All Muscles' : category}
                onClick={() => setSelectedCategory(category)}
                color={selectedCategory === category ? 'primary' : 'default'}
                sx={{
                  fontWeight: selectedCategory === category ? 600 : 400,
                  textTransform: 'capitalize',
                }}
              />
            ))}
          </Box>
        </Stack>
      </Card>

      {/* Results Count */}
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2, textAlign: 'center' }}>
        Showing {filteredExercises.length} of {allExercises.length} exercises
      </Typography>

      {/* Exercise Grid */}
      <Grid container spacing={2}>
        {filteredExercises.map(exercise => {
          const isFavorited = favoriteExercises.has(exercise['Exercise Name']);
          
          return (
            <Grid item xs={12} sm={6} md={4} key={exercise['Exercise Name']}>
              <Card
                sx={{
                  height: '100%',
                  borderRadius: 3,
                  boxShadow: '0 2px 8px rgba(19, 70, 134, 0.08)',
                  transition: 'box-shadow 0.2s ease',
                  '&:hover': {
                    boxShadow: '0 4px 16px rgba(19, 70, 134, 0.15)',
                  },
                }}
              >
                <CardContent>
                  {/* Exercise Header */}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                    <Typography
                      variant="h6"
                      sx={{
                        fontWeight: 600,
                        fontSize: '1rem',
                        color: 'primary.main',
                        flex: 1,
                        pr: 1,
                      }}
                    >
                      {exercise['Exercise Name']}
                    </Typography>
                    
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      {/* Settings Button */}
                      <Tooltip title="Set weight & reps">
                        <IconButton
                          size="small"
                          onClick={() => handleOpenSettings(exercise)}
                          sx={{
                            color: 'primary.main',
                            '&:hover': {
                              backgroundColor: 'rgba(19, 70, 134, 0.08)',
                            },
                          }}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>

                      {/* Favorite Button */}
                      <Tooltip title={isFavorited ? 'Remove from favorites' : 'Add to favorites'}>
                        <IconButton
                          size="small"
                          onClick={(e) => handleToggleFavorite(exercise['Exercise Name'], e)}
                          sx={{
                            color: isFavorited ? 'rgb(237, 63, 39)' : 'action.disabled',
                          }}
                        >
                          <AnimatePresence mode="wait">
                            <motion.div
                              key={isFavorited ? 'favorited' : 'not-favorited'}
                              initial={{ scale: 0.8, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              exit={{ scale: 0.8, opacity: 0 }}
                              transition={{ duration: 0.2 }}
                            >
                              {isFavorited ? (
                                <FavoriteOutlined fontSize="small" />
                              ) : (
                                <FavoriteBorderOutlined fontSize="small" />
                              )}
                            </motion.div>
                          </AnimatePresence>
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </Box>

                  {/* Exercise Details */}
                  <Stack spacing={0.5}>
                    <Typography variant="body2" color="text.secondary">
                      <strong>Primary:</strong> {exercise['Primary Muscle']}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      <strong>Equipment:</strong> {exercise['Equipment']}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      <strong>Type:</strong> {exercise['Exercise Type']}
                    </Typography>
                    {exercise['Secondary Muscles'] && (
                      <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                        <strong>Secondary:</strong> {exercise['Secondary Muscles']}
                      </Typography>
                    )}
                  </Stack>

                  {/* YouTube Link */}
                  {exercise['YouTube_Demonstration_Link'] && (
                    <Button
                      size="small"
                      href={exercise['YouTube_Demonstration_Link']}
                      target="_blank"
                      rel="noopener noreferrer"
                      sx={{
                        mt: 1,
                        fontSize: '0.75rem',
                        textTransform: 'none',
                      }}
                    >
                      Watch Demo
                    </Button>
                  )}
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {/* Exercise Settings Dialog */}
      <Dialog open={settingsDialogOpen} onClose={handleCloseSettings} maxWidth="xs" fullWidth>
        <DialogTitle>
          Exercise Settings
          {selectedExercise && (
            <Typography variant="body2" color="text.secondary">
              {selectedExercise['Exercise Name']}
            </Typography>
          )}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <TextField
              label="Preferred Weight (lbs)"
              type="number"
              value={exerciseWeight}
              onChange={(e) => setExerciseWeightState(Math.max(0, Number(e.target.value)))}
              InputProps={{
                inputProps: { min: 0, step: 5 },
              }}
              fullWidth
            />
            <TextField
              label="Target Reps"
              type="number"
              value={exerciseReps}
              onChange={(e) => setExerciseRepsState(Math.max(1, Number(e.target.value)))}
              InputProps={{
                inputProps: { min: 1, step: 1 },
              }}
              fullWidth
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseSettings}>Cancel</Button>
          <Button onClick={handleSaveSettings} variant="contained">
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* No Results */}
      {filteredExercises.length === 0 && (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="h6" color="text.secondary">
            No exercises found
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Try adjusting your search or filter
          </Typography>
        </Box>
      )}
    </motion.div>
  );
};

ExerciseListPage.propTypes = {};

export default ExerciseListPage;
