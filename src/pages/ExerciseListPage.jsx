import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Box,
  Card,
  Typography,
  TextField,
  InputAdornment,
  IconButton,
  Chip,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Tooltip,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import {
  Search as SearchIcon,
  FavoriteBorderOutlined,
  FavoriteOutlined,
  FitnessCenter,
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
 * Displays all exercises in a compact table format with inline controls
 */
const ExerciseListPage = () => {
  const { allExercises, loading } = useWorkoutGenerator();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedEquipment, setSelectedEquipment] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [favoriteExercises, setFavoriteExercises] = useState(new Set());
  const [exerciseWeights, setExerciseWeights] = useState({});
  const [exerciseReps, setExerciseReps] = useState({});

  // Load favorites and exercise settings on mount
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    const loadData = async () => {
      const favorites = new Set();
      const weights = {};
      const reps = {};
      
      // Load all exercise data in parallel
      await Promise.all(
        allExercises.map(async (ex) => {
          const exerciseName = ex['Exercise Name'];
          if (isFavoriteExercise(exerciseName)) {
            favorites.add(exerciseName);
          }
          
          // Load weight and reps for each exercise
          const [weight, targetReps] = await Promise.all([
            getExerciseWeight(exerciseName),
            getExerciseTargetReps(exerciseName)
          ]);
          weights[exerciseName] = weight ?? ''; // Use empty string for null/undefined
          reps[exerciseName] = targetReps ?? ''; // Use empty string for null/undefined
        })
      );
      
      setFavoriteExercises(favorites);
      setExerciseWeights(weights);
      setExerciseReps(reps);
    };
    
    loadData();
  }, [allExercises]);

  // Extract unique categories, equipment types, and exercise types
  const categories = useMemo(() => {
    const cats = new Set();
    allExercises.forEach(ex => {
      const primaryMuscle = ex['Primary Muscle'].split('(')[0].trim();
      cats.add(primaryMuscle);
    });
    return ['all', ...Array.from(cats).sort()];
  }, [allExercises]);

  const equipmentTypes = useMemo(() => {
    const types = new Set();
    allExercises.forEach(ex => {
      types.add(ex['Equipment']);
    });
    return ['all', ...Array.from(types).sort()];
  }, [allExercises]);

  const exerciseTypes = useMemo(() => {
    const types = new Set();
    allExercises.forEach(ex => {
      types.add(ex['Exercise Type']);
    });
    return ['all', ...Array.from(types).sort()];
  }, [allExercises]);

  // Filter exercises based on search, category, equipment, and type
  const filteredExercises = useMemo(() => {
    return allExercises.filter(exercise => {
      const matchesSearch = searchTerm === '' ||
        exercise['Exercise Name'].toLowerCase().includes(searchTerm.toLowerCase()) ||
        exercise['Primary Muscle'].toLowerCase().includes(searchTerm.toLowerCase()) ||
        exercise['Equipment'].toLowerCase().includes(searchTerm.toLowerCase());

      const primaryMuscle = exercise['Primary Muscle'].split('(')[0].trim();
      const matchesCategory = selectedCategory === 'all' || primaryMuscle === selectedCategory;
      const matchesEquipment = selectedEquipment === 'all' || exercise['Equipment'] === selectedEquipment;
      const matchesType = selectedType === 'all' || exercise['Exercise Type'] === selectedType;

      return matchesSearch && matchesCategory && matchesEquipment && matchesType;
    });
  }, [allExercises, searchTerm, selectedCategory, selectedEquipment, selectedType]);

  const handleToggleFavorite = (exerciseName) => {
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

  const handleWeightChange = async (exerciseName, value) => {
    // Store empty string for display, null for storage
    if (value === '') {
      setExerciseWeights(prev => ({ ...prev, [exerciseName]: '' }));
      await setExerciseWeight(exerciseName, null);
    } else {
      const numValue = Math.max(0, Number(value));
      setExerciseWeights(prev => ({ ...prev, [exerciseName]: numValue }));
      await setExerciseWeight(exerciseName, numValue);
    }
  };

  const handleRepsChange = async (exerciseName, value) => {
    // Store empty string for display, null for storage
    if (value === '') {
      setExerciseReps(prev => ({ ...prev, [exerciseName]: '' }));
      await setExerciseTargetReps(exerciseName, null);
    } else {
      const numValue = Math.max(1, Number(value));
      setExerciseReps(prev => ({ ...prev, [exerciseName]: numValue }));
      await setExerciseTargetReps(exerciseName, numValue);
    }
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
      style={{ padding: '1rem', maxWidth: '1400px', margin: '0 auto' }}
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
              fontSize: { xs: '1.75rem', sm: '2.5rem' },
            }}
          >
            Exercise Database
          </Typography>
        </Box>
        <Typography variant="body1" color="text.secondary" sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}>
          Browse {allExercises.length} exercises • Configure weight & reps inline
        </Typography>
      </Box>

      {/* Compact Filter Bar */}
      <Card
        sx={{
          mb: 2,
          p: { xs: 1.5, sm: 2 },
          borderRadius: 2,
          boxShadow: '0 2px 8px rgba(19, 70, 134, 0.08)',
        }}
      >
        <Stack spacing={1.5}>
          {/* Search */}
          <TextField
            fullWidth
            size="small"
            placeholder="Search exercises..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 1.5,
              },
            }}
          />

          {/* Compact Filter Row */}
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ width: '100%' }}>
            <FormControl size="small" sx={{ minWidth: 120, flex: 1 }}>
              <InputLabel>Muscle</InputLabel>
              <Select
                value={selectedCategory}
                label="Muscle"
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                <MenuItem value="all">All Muscles</MenuItem>
                {categories.filter(c => c !== 'all').map(category => (
                  <MenuItem key={category} value={category}>{category}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 120, flex: 1 }}>
              <InputLabel>Equipment</InputLabel>
              <Select
                value={selectedEquipment}
                label="Equipment"
                onChange={(e) => setSelectedEquipment(e.target.value)}
              >
                <MenuItem value="all">All Equipment</MenuItem>
                {equipmentTypes.filter(e => e !== 'all').map(equipment => (
                  <MenuItem key={equipment} value={equipment}>{equipment}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 120, flex: 1 }}>
              <InputLabel>Type</InputLabel>
              <Select
                value={selectedType}
                label="Type"
                onChange={(e) => setSelectedType(e.target.value)}
              >
                <MenuItem value="all">All Types</MenuItem>
                {exerciseTypes.filter(t => t !== 'all').map(type => (
                  <MenuItem key={type} value={type}>{type}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>
        </Stack>
      </Card>

      {/* Results Count */}
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5, textAlign: 'center', fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
        Showing {filteredExercises.length} of {allExercises.length} exercises
      </Typography>

      {/* Exercise Table */}
      {filteredExercises.length > 0 ? (
        <TableContainer 
          component={Paper} 
          sx={{ 
            borderRadius: 2,
            boxShadow: '0 2px 8px rgba(19, 70, 134, 0.08)',
            maxHeight: 'calc(100vh - 350px)',
            overflow: 'auto'
          }}
        >
          <Table stickyHeader size="small" sx={{ minWidth: { xs: 300, sm: 650 } }}>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 600, bgcolor: 'primary.main', color: 'white', py: 1.5 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <span>★</span>
                  </Box>
                </TableCell>
                <TableCell sx={{ fontWeight: 600, bgcolor: 'primary.main', color: 'white', py: 1.5 }}>
                  Exercise Name
                </TableCell>
                <TableCell sx={{ fontWeight: 600, bgcolor: 'primary.main', color: 'white', py: 1.5, display: { xs: 'none', sm: 'table-cell' } }}>
                  Type
                </TableCell>
                <TableCell sx={{ fontWeight: 600, bgcolor: 'primary.main', color: 'white', py: 1.5, display: { xs: 'none', md: 'table-cell' } }}>
                  Equipment
                </TableCell>
                <TableCell sx={{ fontWeight: 600, bgcolor: 'primary.main', color: 'white', py: 1.5, textAlign: 'center' }}>
                  Target Weight (lbs)
                </TableCell>
                <TableCell sx={{ fontWeight: 600, bgcolor: 'primary.main', color: 'white', py: 1.5, textAlign: 'center' }}>
                  Target Reps
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredExercises.map((exercise, index) => {
                const isFavorited = favoriteExercises.has(exercise['Exercise Name']);
                const exerciseName = exercise['Exercise Name'];
                const weight = exerciseWeights[exerciseName];
                const reps = exerciseReps[exerciseName];
                
                return (
                  <TableRow 
                    key={exerciseName}
                    sx={{
                      '&:hover': {
                        bgcolor: 'rgba(138, 190, 185, 0.05)',
                      },
                      bgcolor: index % 2 === 0 ? 'background.paper' : 'rgba(0, 0, 0, 0.02)',
                    }}
                  >
                    {/* Favorite Icon */}
                    <TableCell sx={{ py: 1 }}>
                      <Tooltip title={isFavorited ? 'Remove from favorites' : 'Add to favorites'}>
                        <IconButton
                          size="small"
                          onClick={() => handleToggleFavorite(exerciseName)}
                          sx={{
                            color: isFavorited ? 'rgb(237, 63, 39)' : 'action.disabled',
                            p: 0.5,
                          }}
                        >
                          {isFavorited ? (
                            <FavoriteOutlined fontSize="small" />
                          ) : (
                            <FavoriteBorderOutlined fontSize="small" />
                          )}
                        </IconButton>
                      </Tooltip>
                    </TableCell>

                    {/* Exercise Name */}
                    <TableCell sx={{ py: 1 }}>
                      <Box>
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            fontWeight: 600,
                            fontSize: { xs: '0.75rem', sm: '0.875rem' },
                            color: 'primary.main'
                          }}
                        >
                          {exerciseName}
                        </Typography>
                        <Typography 
                          variant="caption" 
                          color="text.secondary"
                          sx={{ 
                            fontSize: { xs: '0.65rem', sm: '0.75rem' },
                            display: { xs: 'block', sm: 'none' }
                          }}
                        >
                          {exercise['Exercise Type']} • {exercise['Equipment']}
                        </Typography>
                      </Box>
                    </TableCell>

                    {/* Type (hidden on mobile) */}
                    <TableCell sx={{ py: 1, display: { xs: 'none', sm: 'table-cell' } }}>
                      <Chip 
                        label={exercise['Exercise Type']} 
                        size="small"
                        variant="outlined"
                        sx={{ 
                          fontSize: '0.7rem',
                          height: 22,
                          borderColor: exercise['Exercise Type'] === 'Compound' ? 'primary.main' : 'text.secondary',
                          color: exercise['Exercise Type'] === 'Compound' ? 'primary.main' : 'text.secondary',
                        }}
                      />
                    </TableCell>

                    {/* Equipment (hidden on mobile and tablet) */}
                    <TableCell sx={{ py: 1, display: { xs: 'none', md: 'table-cell' } }}>
                      <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
                        {exercise['Equipment']}
                      </Typography>
                    </TableCell>

                    {/* Target Weight Input */}
                    <TableCell sx={{ py: 1 }}>
                      <TextField
                        type="tel"
                        inputMode="decimal"
                        size="small"
                        value={weight === '' ? '' : weight}
                        onChange={(e) => handleWeightChange(exerciseName, e.target.value)}
                        onFocus={(e) => e.target.select()}
                        placeholder="–"
                        inputProps={{
                          min: 0,
                          step: 5,
                          pattern: '[0-9]*([.,][0-9]+)?',
                          'aria-label': `Target weight in pounds for ${exerciseName}`,
                          style: { 
                            textAlign: 'center',
                            fontSize: '0.875rem',
                            padding: '4px 8px'
                          }
                        }}
                        sx={{
                          width: { xs: 60, sm: 70 },
                          '& .MuiOutlinedInput-root': {
                            '& input': {
                              textAlign: 'center',
                            }
                          }
                        }}
                      />
                    </TableCell>

                    {/* Target Reps Input */}
                    <TableCell sx={{ py: 1 }}>
                      <TextField
                        type="tel"
                        inputMode="numeric"
                        size="small"
                        value={reps === '' ? '' : reps}
                        onChange={(e) => handleRepsChange(exerciseName, e.target.value)}
                        onFocus={(e) => e.target.select()}
                        placeholder="–"
                        inputProps={{
                          min: 1,
                          step: 1,
                          pattern: '\\d*',
                          'aria-label': `Target repetitions for ${exerciseName}`,
                          style: { 
                            textAlign: 'center',
                            fontSize: '0.875rem',
                            padding: '4px 8px'
                          }
                        }}
                        sx={{
                          width: { xs: 60, sm: 70 },
                          '& .MuiOutlinedInput-root': {
                            '& input': {
                              textAlign: 'center',
                            }
                          }
                        }}
                      />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="h6" color="text.secondary">
            No exercises found
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Try adjusting your search or filters
          </Typography>
        </Box>
      )}
    </motion.div>
  );
};

export default ExerciseListPage;
