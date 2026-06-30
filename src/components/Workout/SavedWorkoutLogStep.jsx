import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  Typography,
  Button,
  Stack,
  Card,
  CardContent,
  IconButton,
  Chip,
} from '@mui/material';
import { Add, Remove, ArrowBack, FitnessCenter } from '@mui/icons-material';
import {
  getExerciseWeight,
  getExerciseTargetReps,
  setExerciseWeight,
} from '../../utils/storage';
import { calculateBarbellPerSide } from '../../utils/weightUtils';

const DEFAULT_SETS = 3;
const DEFAULT_REPS = 10;

const getExerciseName = (exercise) =>
  exercise?.['Exercise Name'] || exercise?.exerciseName || exercise?.name || 'Unknown Exercise';

const getEquipment = (exercise) => exercise?.Equipment || exercise?.equipment || '';

const isBarbell = (equipment) => equipment?.toLowerCase() === 'barbell';

/**
 * SavedWorkoutLogStep - Step 2 of the log activity flow when a saved workout is selected.
 * Lists all exercises from the saved workout with weight/reps inputs per set.
 * Auto-populates weights from stored exercise data.
 * Supports adding/removing sets and shows per-side weight for barbell exercises.
 */
const SavedWorkoutLogStep = ({ workout, onSubmit, onBack }) => {
  const [exerciseData, setExerciseData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initExercises = async () => {
      if (!workout?.exercises?.length) {
        setLoading(false);
        return;
      }

      const data = await Promise.all(
        workout.exercises.map(async (ex) => {
          const name = getExerciseName(ex);
          const equipment = getEquipment(ex);
          const defaultSetCount = ex.sets || workout.setsPerSuperset || DEFAULT_SETS;
          const storedWeight = await getExerciseWeight(name);
          const storedReps = await getExerciseTargetReps(name);
          const defaultWeight = storedWeight !== null ? storedWeight : '';
          const defaultReps = storedReps || ex.reps || DEFAULT_REPS;

          return {
            exercise: ex,
            name,
            equipment,
            sets: Array.from({ length: defaultSetCount }, () => ({
              weight: defaultWeight,
              reps: defaultReps,
            })),
          };
        })
      );

      setExerciseData(data);
      setLoading(false);
    };

    initExercises();
  }, [workout]);

  const updateSet = (exerciseIdx, setIdx, field, value) => {
    setExerciseData((prev) => {
      const updated = [...prev];
      const ex = { ...updated[exerciseIdx] };
      const sets = [...ex.sets];
      sets[setIdx] = { ...sets[setIdx], [field]: value };

      // Auto-propagate weight forward to sets that still have the default value
      if (field === 'weight' && setIdx < sets.length - 1) {
        const prevDefault = ex.sets[setIdx].weight;
        for (let i = setIdx + 1; i < sets.length; i++) {
          if (sets[i].weight === prevDefault) {
            sets[i] = { ...sets[i], weight: value };
          }
        }
      }

      ex.sets = sets;
      updated[exerciseIdx] = ex;
      return updated;
    });
  };

  const addSet = (exerciseIdx) => {
    setExerciseData((prev) => {
      const updated = [...prev];
      const ex = { ...updated[exerciseIdx] };
      const lastSet = ex.sets[ex.sets.length - 1] || {
        weight: '',
        reps: DEFAULT_REPS,
      };
      ex.sets = [...ex.sets, { weight: lastSet.weight, reps: lastSet.reps }];
      updated[exerciseIdx] = ex;
      return updated;
    });
  };

  const removeSet = (exerciseIdx, setIdx) => {
    setExerciseData((prev) => {
      const updated = [...prev];
      const ex = { ...updated[exerciseIdx] };
      if (ex.sets.length <= 1) return prev; // Always keep at least 1 set
      ex.sets = ex.sets.filter((_, i) => i !== setIdx);
      updated[exerciseIdx] = ex;
      return updated;
    });
  };

  const handleSubmit = async () => {
    // Build exercises in the same format used by WorkoutScreen
    const exercises = {};
    for (const exData of exerciseData) {
      exercises[exData.name] = {
        sets: exData.sets.map((set, idx) => ({
          set: idx + 1,
          weight: parseFloat(set.weight) || 0,
          reps: parseInt(set.reps) || 0,
        })),
      };

      // Persist the last non-zero weight for future auto-population
      const lastWeightedSet = [...exData.sets]
        .reverse()
        .find((s) => s.weight !== '' && parseFloat(s.weight) > 0);
      if (lastWeightedSet) {
        await setExerciseWeight(exData.name, parseFloat(lastWeightedSet.weight));
      }
    }

    onSubmit({ exercises });
  };

  if (loading) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography color="text.secondary">Loading exercises…</Typography>
      </Box>
    );
  }

  if (!exerciseData.length) {
    return (
      <Box>
        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
          <IconButton onClick={onBack} size="small">
            <ArrowBack />
          </IconButton>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
            No exercises found
          </Typography>
        </Stack>
        <Typography color="text.secondary">
          This saved workout has no exercises. Go back and choose another or use Custom workout.
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
        <IconButton onClick={onBack} size="small" aria-label="Back to workout details">
          <ArrowBack />
        </IconButton>
        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
          {workout.name || 'Log Sets'}
        </Typography>
      </Stack>

      <Stack spacing={2}>
        {exerciseData.map((exData, exIdx) => {
          const equipment = exData.equipment;
          const barbellExercise = isBarbell(equipment);
          const weightInc = barbellExercise ? 5 : 2.5;

          return (
            <Card key={exIdx} sx={{ borderRadius: 2 }}>
              <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                {/* Exercise name */}
                <Stack
                  direction="row"
                  alignItems="center"
                  spacing={1}
                  sx={{ mb: 1.5 }}
                >
                  <FitnessCenter
                    sx={{ fontSize: 18, color: 'primary.main', flexShrink: 0 }}
                  />
                  <Typography
                    variant="body1"
                    sx={{ fontWeight: 600, flex: 1, lineHeight: 1.3 }}
                  >
                    {exData.name}
                  </Typography>
                  {equipment && (
                    <Chip
                      label={equipment}
                      size="small"
                      variant="outlined"
                      sx={{ fontSize: '0.7rem', flexShrink: 0 }}
                    />
                  )}
                </Stack>

                {/* Column headers */}
                <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.5 }}>
                  <Typography
                    variant="caption"
                    sx={{ minWidth: 48, color: 'text.disabled' }}
                  />
                  <Typography
                    variant="caption"
                    sx={{ color: 'text.secondary', fontWeight: 600, ml: 0.5 }}
                  >
                    Weight (lbs)
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{ color: 'text.secondary', fontWeight: 600, ml: 2 }}
                  >
                    Reps
                  </Typography>
                </Stack>

                {/* Sets */}
                <Stack spacing={1}>
                  {exData.sets.map((set, setIdx) => (
                    <Box key={setIdx}>
                      <Stack direction="row" alignItems="center" spacing={1}>
                        {/* Set label */}
                        <Typography
                          variant="caption"
                          sx={{
                            fontWeight: 600,
                            minWidth: 44,
                            color: 'text.secondary',
                            flexShrink: 0,
                          }}
                        >
                          Set {setIdx + 1}
                        </Typography>

                        {/* Weight */}
                        <Stack direction="row" alignItems="center" spacing={0.5}>
                          <IconButton
                            size="small"
                            onClick={() =>
                              updateSet(
                                exIdx,
                                setIdx,
                                'weight',
                                Math.max(0, (parseFloat(set.weight) || 0) - weightInc)
                              )
                            }
                            sx={{
                              width: 28,
                              height: 28,
                              border: '1px solid',
                              borderColor: 'divider',
                            }}
                            aria-label="Decrease weight"
                          >
                            <Remove sx={{ fontSize: 14 }} />
                          </IconButton>
                          <Box
                            component="input"
                            type="number"
                            inputMode="decimal"
                            value={set.weight}
                            onChange={(e) =>
                              updateSet(exIdx, setIdx, 'weight', e.target.value)
                            }
                            placeholder="—"
                            sx={{
                              width: 56,
                              textAlign: 'center',
                              fontSize: '0.9rem',
                              fontWeight: 600,
                              border: '1px solid',
                              borderColor: 'divider',
                              borderRadius: '4px',
                              p: '4px 2px',
                              bgcolor: 'background.paper',
                              color: 'text.primary',
                              '&:focus': {
                                outline: 'none',
                                borderColor: 'primary.main',
                              },
                              MozAppearance: 'textfield',
                              '&::-webkit-outer-spin-button, &::-webkit-inner-spin-button':
                                {
                                  WebkitAppearance: 'none',
                                  margin: 0,
                                },
                            }}
                          />
                          <IconButton
                            size="small"
                            onClick={() =>
                              updateSet(
                                exIdx,
                                setIdx,
                                'weight',
                                (parseFloat(set.weight) || 0) + weightInc
                              )
                            }
                            sx={{
                              width: 28,
                              height: 28,
                              border: '1px solid',
                              borderColor: 'divider',
                            }}
                            aria-label="Increase weight"
                          >
                            <Add sx={{ fontSize: 14 }} />
                          </IconButton>
                        </Stack>

                        {/* Reps */}
                        <Stack direction="row" alignItems="center" spacing={0.5}>
                          <IconButton
                            size="small"
                            onClick={() =>
                              updateSet(
                                exIdx,
                                setIdx,
                                'reps',
                                Math.max(0, (parseInt(set.reps) || 0) - 1)
                              )
                            }
                            sx={{
                              width: 28,
                              height: 28,
                              border: '1px solid',
                              borderColor: 'divider',
                            }}
                            aria-label="Decrease reps"
                          >
                            <Remove sx={{ fontSize: 14 }} />
                          </IconButton>
                          <Box
                            component="input"
                            type="number"
                            inputMode="numeric"
                            value={set.reps}
                            onChange={(e) =>
                              updateSet(exIdx, setIdx, 'reps', e.target.value)
                            }
                            placeholder="—"
                            sx={{
                              width: 46,
                              textAlign: 'center',
                              fontSize: '0.9rem',
                              fontWeight: 600,
                              border: '1px solid',
                              borderColor: 'divider',
                              borderRadius: '4px',
                              p: '4px 2px',
                              bgcolor: 'background.paper',
                              color: 'text.primary',
                              '&:focus': {
                                outline: 'none',
                                borderColor: 'primary.main',
                              },
                              MozAppearance: 'textfield',
                              '&::-webkit-outer-spin-button, &::-webkit-inner-spin-button':
                                {
                                  WebkitAppearance: 'none',
                                  margin: 0,
                                },
                            }}
                          />
                          <IconButton
                            size="small"
                            onClick={() =>
                              updateSet(
                                exIdx,
                                setIdx,
                                'reps',
                                (parseInt(set.reps) || 0) + 1
                              )
                            }
                            sx={{
                              width: 28,
                              height: 28,
                              border: '1px solid',
                              borderColor: 'divider',
                            }}
                            aria-label="Increase reps"
                          >
                            <Add sx={{ fontSize: 14 }} />
                          </IconButton>
                        </Stack>

                        {/* Remove set button */}
                        {exData.sets.length > 1 && (
                          <IconButton
                            size="small"
                            onClick={() => removeSet(exIdx, setIdx)}
                            sx={{
                              color: 'error.main',
                              width: 28,
                              height: 28,
                              flexShrink: 0,
                            }}
                            aria-label={`Remove set ${setIdx + 1}`}
                          >
                            <Remove sx={{ fontSize: 14 }} />
                          </IconButton>
                        )}
                      </Stack>

                      {/* Barbell per-side hint */}
                      {barbellExercise &&
                        set.weight !== '' &&
                        parseFloat(set.weight) > 0 && (
                          <Typography
                            variant="caption"
                            sx={{
                              color: 'text.secondary',
                              fontStyle: 'italic',
                              display: 'block',
                              ml: 7,
                            }}
                          >
                            {(() => {
                              const perSide = calculateBarbellPerSide(
                                parseFloat(set.weight),
                                45
                              );
                              return perSide !== null && perSide >= 0
                                ? `${perSide} lbs per side`
                                : '';
                            })()}
                          </Typography>
                        )}
                    </Box>
                  ))}
                </Stack>

                {/* Add set */}
                <Button
                  size="small"
                  startIcon={<Add />}
                  onClick={() => addSet(exIdx)}
                  sx={{ mt: 1.5, fontSize: '0.75rem' }}
                >
                  Add Set
                </Button>
              </CardContent>
            </Card>
          );
        })}

        <Button
          variant="contained"
          fullWidth
          onClick={handleSubmit}
          sx={{
            py: 1.5,
            fontWeight: 600,
            mt: 1,
            bgcolor: 'primary.main',
            '&:hover': { bgcolor: 'primary.main', filter: 'brightness(0.9)' },
          }}
        >
          Log Workout
        </Button>
      </Stack>
    </Box>
  );
};

SavedWorkoutLogStep.propTypes = {
  workout: PropTypes.shape({
    name: PropTypes.string,
    type: PropTypes.string,
    exercises: PropTypes.array,
    setsPerSuperset: PropTypes.number,
  }).isRequired,
  onSubmit: PropTypes.func.isRequired,
  onBack: PropTypes.func.isRequired,
};

export default SavedWorkoutLogStep;
