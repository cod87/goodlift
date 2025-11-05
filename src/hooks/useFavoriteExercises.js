import { useState, useEffect } from 'react';
import { getFavoriteWorkouts } from '../utils/storage';

/**
 * Custom hook to get a set of favorited exercises
 * Used to bias exercise randomization towards user's favorite exercises
 * @returns {Set<string>} Set of exercise names that appear in favorite workouts
 */
export const useFavoriteExercises = () => {
  const [favoriteExercises, setFavoriteExercises] = useState(new Set());
  
  useEffect(() => {
    const loadFavorites = () => {
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
      
      setFavoriteExercises(exerciseSet);
    };
    
    loadFavorites();
    
    // Set up an interval to refresh favorites periodically
    const intervalId = setInterval(loadFavorites, 30000); // Refresh every 30 seconds
    
    return () => clearInterval(intervalId);
  }, []);

  return favoriteExercises;
};
