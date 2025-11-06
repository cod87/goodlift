import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { doc, setDoc, collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { isGuestMode, getGuestData, setGuestData } from '../utils/guestStorage';
import { getCurrentUserId } from '../utils/storage';

/**
 * Custom hook for saving yoga sessions with react-query
 * Supports both authenticated (Firestore) and guest (localStorage) users
 */
export const useSaveYogaSession = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (sessionData) => {
      const {
        date,
        flow,
        cooldown,
        interval,
        poseCount,
        duration,
        cooldownDisabled = cooldown === 0,
      } = sessionData;

      const session = {
        id: `yoga_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
        date: date || new Date().toISOString(),
        flowLength: flow,
        coolDownLength: cooldown,
        poseSuggestionFrequency: interval,
        poseCount: poseCount || 0,
        duration: duration || (flow + cooldown) * 60,
        cooldownDisabled,
        timestamp: Date.now(),
      };

      // Save based on mode
      if (isGuestMode()) {
        const sessions = getGuestData('yoga_sessions') || [];
        sessions.unshift(session);
        setGuestData('yoga_sessions', sessions);
      } else {
        // Save to localStorage
        const YOGA_SESSIONS_KEY = 'goodlift_yoga_sessions';
        const existingSessions = JSON.parse(localStorage.getItem(YOGA_SESSIONS_KEY) || '[]');
        existingSessions.unshift(session);
        localStorage.setItem(YOGA_SESSIONS_KEY, JSON.stringify(existingSessions));

        // Save to Firestore if authenticated
        const userId = getCurrentUserId();
        if (userId) {
          try {
            const sessionRef = doc(db, 'users', userId, 'yoga_sessions', session.id);
            await setDoc(sessionRef, session);
          } catch (error) {
            console.error('Error saving yoga session to Firestore:', error);
            // Continue - localStorage save was successful
          }
        }
      }

      return session;
    },
    onSuccess: (data) => {
      // Invalidate and refetch yoga sessions queries
      queryClient.invalidateQueries({ queryKey: ['yogaSessions'] });
      
      // Optimistically update the cache
      queryClient.setQueryData(['yogaSessions'], (old) => {
        if (!old) return [data];
        return [data, ...old];
      });
    },
    onError: (error) => {
      console.error('Error saving yoga session:', error);
    },
  });
};

/**
 * Custom hook for fetching yoga sessions with react-query
 * @param {string} userId - Optional user ID for filtering
 * @param {Object} dateRange - Optional date range filter { start, end }
 */
export const useGetYogaSessions = (userId = null, dateRange = null) => {
  return useQuery({
    queryKey: ['yogaSessions', userId, dateRange],
    queryFn: async () => {
      try {
        // Check guest mode first
        if (isGuestMode()) {
          const guestSessions = getGuestData('yoga_sessions') || [];
          return filterByDateRange(guestSessions, dateRange);
        }

        const currentUserId = userId || getCurrentUserId();

        // Try Firestore first if authenticated
        if (currentUserId && currentUserId !== 'guest') {
          try {
            const sessionsRef = collection(db, 'users', currentUserId, 'yoga_sessions');
            let q = query(sessionsRef, orderBy('timestamp', 'desc'));

            // Add date range filtering if provided
            if (dateRange?.start) {
              q = query(q, where('timestamp', '>=', new Date(dateRange.start).getTime()));
            }
            if (dateRange?.end) {
              q = query(q, where('timestamp', '<=', new Date(dateRange.end).getTime()));
            }

            const querySnapshot = await getDocs(q);
            const sessions = [];
            querySnapshot.forEach((doc) => {
              sessions.push(doc.data());
            });

            // Cache in localStorage
            if (sessions.length > 0) {
              const YOGA_SESSIONS_KEY = 'goodlift_yoga_sessions';
              localStorage.setItem(YOGA_SESSIONS_KEY, JSON.stringify(sessions));
            }

            return sessions;
          } catch (error) {
            console.error('Error fetching yoga sessions from Firestore:', error);
          }
        }

        // Fallback to localStorage
        const YOGA_SESSIONS_KEY = 'goodlift_yoga_sessions';
        const localSessions = JSON.parse(localStorage.getItem(YOGA_SESSIONS_KEY) || '[]');
        return filterByDateRange(localSessions, dateRange);
      } catch (error) {
        console.error('Error fetching yoga sessions:', error);
        return [];
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Helper function to filter sessions by date range
 * @param {Array} sessions - Array of session objects
 * @param {Object} dateRange - Date range filter { start, end }
 * @returns {Array} Filtered sessions
 */
function filterByDateRange(sessions, dateRange) {
  if (!dateRange) return sessions;

  return sessions.filter((session) => {
    const sessionDate = new Date(session.date).getTime();
    const startDate = dateRange.start ? new Date(dateRange.start).getTime() : 0;
    const endDate = dateRange.end ? new Date(dateRange.end).getTime() : Infinity;
    return sessionDate >= startDate && sessionDate <= endDate;
  });
}
