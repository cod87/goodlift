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
  Collapse,
  Divider,
} from '@mui/material';
import {
  Search as SearchIcon,
  FavoriteBorderOutlined,
  FavoriteOutlined,
  FitnessCenter,
  FilterList as FilterListIcon,
} from '@mui/icons-material';
import CompactHeader from '../components/Common/CompactHeader';
import { useWorkoutGenerator } from '../hooks/useWorkoutGenerator';
import {
  toggleFavoriteExercise,
  isFavoriteExercise,
  getExerciseWeight,
  setExerciseWeight,
  getExerciseTargetReps,
  setExerciseTargetReps,
} from '../utils/storage';
import { getMuscleCategory } from '../utils/muscleCategories';

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
  const [filtersExpanded, setFiltersExpanded] = useState(false);

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
      const category = getMuscleCategory(ex['Primary Muscle']);
      cats.add(category);
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

      const category = getMuscleCategory(exercise['Primary Muscle']);
      const matchesCategory = selectedCategory === 'all' || category === selectedCategory;
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
    <Box sx={{ width: '100%', minHeight: '100vh' }}>
      <CompactHeader title="Exercise Database" />
      
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        style={{ padding: '1rem', maxWidth: '1400px', margin: '0 auto' }}
      >

      {/* Exercise Table with Integrated Filters */}
      {filteredExercises.length > 0 || searchTerm || selectedCategory !== 'all' || selectedEquipment !== 'all' || selectedType !== 'all' ? (
        <Box>
          {/* Sticky Search and Filter Bar */}
          <Paper 
            sx={{ 
              position: 'sticky',
              top: 0,
              zIndex: 10,
              borderRadius: '8px 8px 0 0',
              boxShadow: '0 2px 8px rgba(19, 70, 134, 0.08)',
            }}
          >
            {/* Search Bar and Filter Icon Row */}
            <Box sx={{ p: 1.5, borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}>
              <Stack direction="row" spacing={1} alignItems="center">
                {/* Search */}
                <TextField
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
                    flex: 1,
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 1,
                      bgcolor: 'background.default',
                    },
                    '& .MuiInputBase-input': {
                      fontSize: '0.875rem',
                    },
                  }}
                />

                {/* Filter Icon Button */}
                <Tooltip title={filtersExpanded ? 'Hide filters' : 'Show filters'}>
                  <IconButton
                    onClick={() => setFiltersExpanded(!filtersExpanded)}
                    sx={{
                      bgcolor: filtersExpanded ? 'primary.main' : 'background.default',
                      color: filtersExpanded ? 'white' : 'text.primary',
                      '&:hover': {
                        bgcolor: filtersExpanded ? 'primary.dark' : 'action.hover',
                      },
                    }}
                  >
                    <FilterListIcon />
                  </IconButton>
                </Tooltip>

                {/* Results Count */}
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem', whiteSpace: 'nowrap', minWidth: 'fit-content' }}>
                  {filteredExercises.length} of {allExercises.length}
                </Typography>
              </Stack>
            </Box>

            {/* Collapsible Filters */}
            <Collapse in={filtersExpanded}>
              <Box sx={{ p: 1.5, pt: 1, bgcolor: 'background.paper' }}>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                  <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 150 } }}>
                    <InputLabel>Muscle Group</InputLabel>
                    <Select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      label="Muscle Group"
                      sx={{ 
                        fontSize: '0.875rem',
                        bgcolor: 'background.default',
                      }}
                    >
                      <MenuItem value="all">All Muscles</MenuItem>
                      {categories.filter(c => c !== 'all').map(category => (
                        <MenuItem key={category} value={category}>{category}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 150 } }}>
                    <InputLabel>Equipment</InputLabel>
                    <Select
                      value={selectedEquipment}
                      onChange={(e) => setSelectedEquipment(e.target.value)}
                      label="Equipment"
                      sx={{ 
                        fontSize: '0.875rem',
                        bgcolor: 'background.default',
                      }}
                    >
                      <MenuItem value="all">All Equipment</MenuItem>
                      {equipmentTypes.filter(e => e !== 'all').map(equipment => (
                        <MenuItem key={equipment} value={equipment}>{equipment}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 150 } }}>
                    <InputLabel>Exercise Type</InputLabel>
                    <Select
                      value={selectedType}
                      onChange={(e) => setSelectedType(e.target.value)}
                      label="Exercise Type"
                      sx={{ 
                        fontSize: '0.875rem',
                        bgcolor: 'background.default',
                      }}
                    >
                      <MenuItem value="all">All Types</MenuItem>
                      {exerciseTypes.filter(t => t !== 'all').map(type => (
                        <MenuItem key={type} value={type}>{type}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Stack>
              </Box>
            </Collapse>
          </Paper>

          {/* Exercise Table */}
          <TableContainer 
            component={Paper} 
            sx={{ 
              borderRadius: '0 0 8px 8px',
              boxShadow: '0 2px 8px rgba(19, 70, 134, 0.08)',
              maxHeight: 'calc(100vh - 250px)',
              overflow: 'auto'
            }}
          >
            <Table stickyHeader size="small" sx={{ minWidth: { xs: 300, sm: 650 } }}>
              <TableHead>
                {/* Table Header Row */}
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
        </Box>
      ) : (
        <Paper sx={{ borderRadius: 2, boxShadow: '0 2px 8px rgba(19, 70, 134, 0.08)' }}>
          {/* Search and Filters for empty state */}
          <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: filtersExpanded ? 2 : 0 }}>
              <TextField
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
                  flex: 1,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 1,
                    bgcolor: 'background.default',
                  },
                  '& .MuiInputBase-input': {
                    fontSize: '0.875rem',
                  },
                }}
              />

              <Tooltip title={filtersExpanded ? 'Hide filters' : 'Show filters'}>
                <IconButton
                  onClick={() => setFiltersExpanded(!filtersExpanded)}
                  sx={{
                    bgcolor: filtersExpanded ? 'primary.main' : 'background.default',
                    color: filtersExpanded ? 'white' : 'text.primary',
                    '&:hover': {
                      bgcolor: filtersExpanded ? 'primary.dark' : 'action.hover',
                    },
                  }}
                >
                  <FilterListIcon />
                </IconButton>
              </Tooltip>

              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem', whiteSpace: 'nowrap' }}>
                0 of {allExercises.length}
              </Typography>
            </Stack>

            <Collapse in={filtersExpanded}>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 150 } }}>
                  <InputLabel>Muscle Group</InputLabel>
                  <Select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    label="Muscle Group"
                    sx={{ 
                      fontSize: '0.875rem',
                      bgcolor: 'background.default',
                    }}
                  >
                    <MenuItem value="all">All Muscles</MenuItem>
                    {categories.filter(c => c !== 'all').map(category => (
                      <MenuItem key={category} value={category}>{category}</MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 150 } }}>
                  <InputLabel>Equipment</InputLabel>
                  <Select
                    value={selectedEquipment}
                    onChange={(e) => setSelectedEquipment(e.target.value)}
                    label="Equipment"
                    sx={{ 
                      fontSize: '0.875rem',
                      bgcolor: 'background.default',
                    }}
                  >
                    <MenuItem value="all">All Equipment</MenuItem>
                    {equipmentTypes.filter(e => e !== 'all').map(equipment => (
                      <MenuItem key={equipment} value={equipment}>{equipment}</MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 150 } }}>
                  <InputLabel>Exercise Type</InputLabel>
                  <Select
                    value={selectedType}
                    onChange={(e) => setSelectedType(e.target.value)}
                    label="Exercise Type"
                    sx={{ 
                      fontSize: '0.875rem',
                      bgcolor: 'background.default',
                    }}
                  >
                    <MenuItem value="all">All Types</MenuItem>
                    {exerciseTypes.filter(t => t !== 'all').map(type => (
                      <MenuItem key={type} value={type}>{type}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Stack>
            </Collapse>
          </Box>
          
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Typography variant="h6" color="text.secondary">
              No exercises found
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Try adjusting your search or filters
            </Typography>
          </Box>
        </Paper>
      )}
    </motion.div>
    </Box>
  );
};

export default ExerciseListPage;
