import { useState, useEffect, useCallback } from 'react';
import { EXERCISES_DATA_PATH, EXERCISES_PER_WORKOUT, SETS_PER_EXERCISE } from '../utils/constants';

const OPPOSING_MUSCLES = {
  'Chest': 'Back',
  'Back': 'Chest',
  'Quadriceps': 'Hamstrings',
  'Hamstrings': 'Quadriceps',
  'Biceps': 'Triceps',
  'Triceps': 'Biceps',
  'Shoulders': 'Back',
};

export const useWorkoutGenerator = () => {
  const [exerciseDB, setExerciseDB] = useState({});
  const [allExercises, setAllExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load exercises from JSON
  useEffect(() => {
    const loadExercises = async () => {
      try {
        setLoading(true);
        const response = await fetch(EXERCISES_DATA_PATH);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const exercises = await response.json();
        
        setAllExercises(exercises);
        
        // Group by muscle
        const grouped = {};
        for (const exercise of exercises) {
          const primaryMuscle = exercise['Primary Muscle'].split('(')[0].trim();
          if (!grouped[primaryMuscle]) {
            grouped[primaryMuscle] = [];
          }
          grouped[primaryMuscle].push(exercise);
        }
        
        setExerciseDB(grouped);
        setLoading(false);
      } catch (err) {
        console.error("Failed to load exercise data:", err);
        setError(err.message);
        setLoading(false);
      }
    };

    loadExercises();
  }, []);

  // Get random exercises from a muscle group
  const getRandomExercises = useCallback((muscle, count, currentWorkout = [], equipmentFilter = 'all') => {
    let available = (exerciseDB[muscle] || []).filter(ex => 
      !currentWorkout.some(wEx => wEx['Exercise Name'] === ex['Exercise Name'])
    );
    
    // Apply equipment filter
    if (equipmentFilter !== 'all') {
      const filters = Array.isArray(equipmentFilter) ? equipmentFilter : [equipmentFilter];
      
      available = available.filter(ex => {
        const equipment = ex.Equipment.toLowerCase();
        return filters.some(filter => {
          if (filter === 'cable machine') {
            return equipment.includes('cable');
          } else if (filter === 'dumbbells') {
            return equipment.includes('dumbbell');
          } else {
            return equipment.includes(filter);
          }
        });
      });
    }
    
    if (available.length < count) {
      console.warn(`Not enough exercises for muscle group: ${muscle}. Have ${available.length}, need ${count}.`);
      return available;
    }
    
    const shuffled = available.sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  }, [exerciseDB]);

  // Generate exercise list based on workout type
  const generateExerciseList = useCallback((type, equipmentFilter = 'all') => {
    let workout = [];
    
    switch (type) {
      case 'upper':
        workout.push(...getRandomExercises('Chest', 3, workout, equipmentFilter));
        workout.push(...getRandomExercises('Back', 3, workout, equipmentFilter));
        workout.push(...getRandomExercises('Biceps', 1, workout, equipmentFilter));
        workout.push(...getRandomExercises('Triceps', 1, workout, equipmentFilter));
        break;
      case 'lower': {
        const quadCount = Math.floor(Math.random() * 2) + 3;
        const hamCount = Math.floor(Math.random() * 2) + 2;
        const calfCount = EXERCISES_PER_WORKOUT - quadCount - hamCount;
        
        workout.push(...getRandomExercises('Quadriceps', quadCount, workout, equipmentFilter));
        workout.push(...getRandomExercises('Hamstrings', hamCount, workout, equipmentFilter));
        if (calfCount > 0) {
          workout.push(...getRandomExercises('Calves', calfCount, workout, equipmentFilter));
        }
        break;
      }
      case 'full': {
        const hamFullCount = Math.floor(Math.random() * 2) + 1;
        const calfFullCount = EXERCISES_PER_WORKOUT - 2 - 2 - 2 - hamFullCount;
        
        workout.push(...getRandomExercises('Chest', 2, workout, equipmentFilter));
        workout.push(...getRandomExercises('Back', 2, workout, equipmentFilter));
        workout.push(...getRandomExercises('Quadriceps', 2, workout, equipmentFilter));
        workout.push(...getRandomExercises('Hamstrings', hamFullCount, workout, equipmentFilter));
        if (calfFullCount > 0) {
          workout.push(...getRandomExercises('Calves', calfFullCount, workout, equipmentFilter));
        }
        break;
      }
      default:
        break;
    }
    
    // Fill if necessary
    while (workout.length < EXERCISES_PER_WORKOUT && workout.length > 0) {
      const allMuscles = Object.keys(exerciseDB);
      const randomMuscle = allMuscles[Math.floor(Math.random() * allMuscles.length)];
      const filler = getRandomExercises(randomMuscle, 1, workout, equipmentFilter);
      if (filler.length > 0) workout.push(filler[0]);
    }
    
    return workout.slice(0, EXERCISES_PER_WORKOUT);
  }, [exerciseDB, getRandomExercises]);

  // Pair exercises into supersets
  const pairExercises = useCallback((exercises) => {
    let pairings = [];
    let remaining = [...exercises];

    while (remaining.length >= 2) {
      const exercise1 = remaining.shift();
      const primaryMuscle1 = exercise1['Primary Muscle'].split('(')[0].trim();
      const opposingMuscle = OPPOSING_MUSCLES[primaryMuscle1];

      let bestPairIndex = -1;
      
      if (opposingMuscle) {
        bestPairIndex = remaining.findIndex(ex => ex['Primary Muscle'].includes(opposingMuscle));
      }
      
      if (bestPairIndex === -1) {
        bestPairIndex = remaining.findIndex(ex => !ex['Primary Muscle'].includes(primaryMuscle1));
      }
      
      if (bestPairIndex === -1) {
        bestPairIndex = 0;
      }

      const exercise2 = remaining.splice(bestPairIndex, 1)[0];
      pairings.push(exercise1, exercise2);
    }
    
    if (remaining.length > 0) {
      pairings.push(...remaining);
    }
    
    return pairings;
  }, []);

  // Generate complete workout
  const generateWorkout = useCallback((type, equipmentFilter = 'all') => {
    if (Object.keys(exerciseDB).length === 0) {
      console.error("Exercise database is empty.");
      return [];
    }
    const exerciseList = generateExerciseList(type, equipmentFilter);
    const pairedList = pairExercises(exerciseList);
    return pairedList;
  }, [exerciseDB, generateExerciseList, pairExercises]);

  return {
    generateWorkout,
    allExercises,
    loading,
    error,
  };
};
