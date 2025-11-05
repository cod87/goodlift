import { useMemo } from 'react';
import { getFavoriteWorkouts } from '../utils/storage';

/**
 * Custom hook to get a set of favorited exercises
 * Used to bias exercise randomization towards user's favorite exercises
 * @returns {Set<string>} Set of exercise names that appear in favorite workouts
 */
export const useFavoriteExercises = () => {
  const favoriteExercises = useMemo(() => {
    const favorites = getFavoriteWorkouts();
    const exerciseSet = new Set();
    
    favorites.forEach(fav => {
      if (fav.exercises && Array.isArray(fav.exercises)) {
        fav.exercises.forEach(exercise => {
          if (exercise && exercise['Exercise Name']) {
            exerciseSet.add(exercise['Exercise Name']);
          }
        });
      }
    });
    
    return exerciseSet;
  }, []); // Empty deps - only compute once per component mount

  return favoriteExercises;
};
