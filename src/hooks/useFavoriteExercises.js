import { useState, useEffect } from 'react';
import { getFavoriteExercises, getFavoriteWorkouts } from '../utils/storage';

/**
 * Custom hook to get a set of favorited exercises
 * Used to bias exercise randomization towards user's favorite exercises
 * Combines both directly favorited exercises AND exercises from favorite workouts
 * @returns {Set<string>} Set of exercise names that are favorited
 */
export const useFavoriteExercises = () => {
  const [favoriteExercises, setFavoriteExercises] = useState(new Set());
  
  useEffect(() => {
    const loadFavorites = async () => {
      // Get directly favorited exercises
      const directFavorites = getFavoriteExercises();
      
      // Get exercises from favorite workouts
      const favoriteWorkouts = await getFavoriteWorkouts();
      const workoutExercises = new Set();
      
      favoriteWorkouts.forEach(fav => {
        if (fav.exercises && Array.isArray(fav.exercises)) {
          fav.exercises.forEach(exercise => {
            if (exercise && exercise['Exercise Name']) {
              workoutExercises.add(exercise['Exercise Name']);
            }
          });
        }
      });
      
      // Combine both sets
      const combinedFavorites = new Set([...directFavorites, ...workoutExercises]);
      setFavoriteExercises(combinedFavorites);
    };
    
    loadFavorites();
    
    // Set up an interval to refresh favorites periodically
    const intervalId = setInterval(loadFavorites, 30000); // Refresh every 30 seconds
    
    return () => clearInterval(intervalId);
  }, []);

  return favoriteExercises;
};
