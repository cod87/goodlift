import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { doc, setDoc, deleteDoc, getDocs, collection } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';

/**
 * Generate a Firestore-safe ID from an exercise name
 * @param {string} exerciseName - The exercise name to convert
 * @returns {string} A sanitized ID suitable for Firestore document IDs
 */
const generateExerciseId = (exerciseName) => {
  return exerciseName.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
};

/**
 * Custom hook for managing favorite exercises
 * Stores favorites in Firestore: users/{userId}/favoriteExercises/{exerciseId}
 * Uses @tanstack/react-query for cache and optimistic updates
 */
export const useFavoriteExercises = () => {
  const { currentUser } = useAuth();
  const queryClient = useQueryClient();

  // Fetch all favorite exercises for the current user
  const { data: favoriteExercises = [], isLoading } = useQuery({
    queryKey: ['favoriteExercises', currentUser?.uid],
    queryFn: async () => {
      if (!currentUser?.uid) {
        return [];
      }

      try {
        const favoritesRef = collection(db, 'users', currentUser.uid, 'favoriteExercises');
        const snapshot = await getDocs(favoritesRef);
        return snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
      } catch (error) {
        console.error('Error fetching favorite exercises:', error);
        return [];
      }
    },
    enabled: !!currentUser?.uid,
  });

  // Add exercise to favorites
  const addFavoriteMutation = useMutation({
    mutationFn: async (exercise) => {
      if (!currentUser?.uid) {
        throw new Error('User not authenticated');
      }

      const exerciseId = generateExerciseId(exercise['Exercise Name']);
      const favoriteRef = doc(db, 'users', currentUser.uid, 'favoriteExercises', exerciseId);
      
      await setDoc(favoriteRef, {
        exerciseName: exercise['Exercise Name'],
        primaryMuscle: exercise['Primary Muscle'],
        equipment: exercise['Equipment'],
        addedAt: new Date().toISOString(),
      });

      return { id: exerciseId, exerciseName: exercise['Exercise Name'] };
    },
    onMutate: async (exercise) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['favoriteExercises', currentUser?.uid] });

      // Snapshot previous value
      const previousFavorites = queryClient.getQueryData(['favoriteExercises', currentUser?.uid]);

      // Optimistically update
      const exerciseId = generateExerciseId(exercise['Exercise Name']);
      console.log('onMutate (add):', { exerciseId, exerciseName: exercise['Exercise Name'], previousCount: previousFavorites?.length });
      
      queryClient.setQueryData(['favoriteExercises', currentUser?.uid], (old = []) => [
        ...old,
        {
          id: exerciseId,
          exerciseName: exercise['Exercise Name'],
          primaryMuscle: exercise['Primary Muscle'],
          equipment: exercise['Equipment'],
          addedAt: new Date().toISOString(),
        },
      ]);

      return { previousFavorites };
    },
    onError: (err, exercise, context) => {
      // Rollback on error
      console.error('Error adding favorite (rolling back):', err);
      queryClient.setQueryData(['favoriteExercises', currentUser?.uid], context.previousFavorites);
    },
    onSuccess: (data) => {
      console.log('Successfully added favorite:', data);
    },
    onSettled: () => {
      // Refetch after mutation
      console.log('Settled (add) - invalidating queries');
      queryClient.invalidateQueries({ queryKey: ['favoriteExercises', currentUser?.uid] });
    },
  });

  // Remove exercise from favorites
  const removeFavoriteMutation = useMutation({
    mutationFn: async (exerciseName) => {
      if (!currentUser?.uid) {
        throw new Error('User not authenticated');
      }

      const exerciseId = generateExerciseId(exerciseName);
      const favoriteRef = doc(db, 'users', currentUser.uid, 'favoriteExercises', exerciseId);
      
      await deleteDoc(favoriteRef);
      return exerciseId;
    },
    onMutate: async (exerciseName) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['favoriteExercises', currentUser?.uid] });

      // Snapshot previous value
      const previousFavorites = queryClient.getQueryData(['favoriteExercises', currentUser?.uid]);

      // Optimistically update
      const exerciseId = generateExerciseId(exerciseName);
      console.log('onMutate (remove):', { exerciseId, exerciseName, previousCount: previousFavorites?.length });
      
      queryClient.setQueryData(['favoriteExercises', currentUser?.uid], (old = []) =>
        old.filter(fav => fav.id !== exerciseId)
      );

      return { previousFavorites };
    },
    onError: (err, exerciseName, context) => {
      // Rollback on error
      console.error('Error removing favorite (rolling back):', err);
      queryClient.setQueryData(['favoriteExercises', currentUser?.uid], context.previousFavorites);
    },
    onSuccess: (data) => {
      console.log('Successfully removed favorite:', data);
    },
    onSettled: () => {
      // Refetch after mutation
      console.log('Settled (remove) - invalidating queries');
      queryClient.invalidateQueries({ queryKey: ['favoriteExercises', currentUser?.uid] });
    },
  });

  // Toggle favorite status
  const toggleFavorite = (exercise) => {
    const exerciseName = exercise['Exercise Name'];
    const isFavorite = isFavoriteExercise(exerciseName);
    
    console.log('toggleFavorite called:', { exerciseName, isFavorite, currentUser: currentUser?.uid });
    
    if (isFavorite) {
      console.log('Removing favorite:', exerciseName);
      removeFavoriteMutation.mutate(exerciseName);
    } else {
      console.log('Adding favorite:', exerciseName);
      addFavoriteMutation.mutate(exercise);
    }
  };

  // Check if an exercise is favorited
  const isFavoriteExercise = (exerciseName) => {
    return favoriteExercises.some(fav => fav.exerciseName === exerciseName);
  };

  // Get favorite exercise names as a Set for efficient lookup
  const favoriteExerciseNames = new Set(favoriteExercises.map(fav => fav.exerciseName));

  return {
    favoriteExercises,
    favoriteExerciseNames,
    isLoading,
    addFavorite: addFavoriteMutation.mutate,
    removeFavorite: removeFavoriteMutation.mutate,
    toggleFavorite,
    isFavoriteExercise,
    isAddingFavorite: addFavoriteMutation.isPending,
    isRemovingFavorite: removeFavoriteMutation.isPending,
  };
};
