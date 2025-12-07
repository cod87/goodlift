/**
 * Formats seconds into HH:MM:SS format for display
 * @param {number} seconds - The number of seconds to format
 * @returns {string} Formatted time string in HH:MM:SS format
 * @example
 * formatTime(3661) // Returns "01:01:01"
 */
export const formatTime = (seconds) => {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

/**
 * Converts a YouTube URL to its embeddable format
 * Handles both youtube.com and youtu.be URLs
 * @param {string} url - The YouTube video URL
 * @returns {string} The YouTube embed URL or empty string if invalid
 * @example
 * getYoutubeEmbedUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ')
 * // Returns "https://www.youtube.com/embed/dQw4w9WgXcQ"
 */
export const getYoutubeEmbedUrl = (url) => {
  if (!url) return '';
  
  try {
    const urlObj = new URL(url);
    
    // Extract video ID from query parameter (youtube.com)
    let videoId = urlObj.searchParams.get('v');
    
    // If not in query params, extract from pathname (youtu.be)
    if (!videoId) {
      const pathParts = urlObj.pathname.split('/');
      videoId = pathParts[pathParts.length - 1];
    }
    
    // Remove any additional query parameters from video ID
    videoId = videoId?.split('&')[0];
    
    return videoId ? `https://www.youtube.com/embed/${encodeURIComponent(videoId)}` : '';
  } catch (error) {
    console.error('Invalid YouTube URL:', url, error);
    return '';
  }
};

/**
 * Formats a date string into a human-readable format with time
 * @param {string} dateString - ISO date string or any valid date format
 * @returns {string} Formatted date string (e.g., "Jan 15, 2024, 02:30 PM")
 */
export const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

/**
 * Converts duration in seconds to a human-readable format
 * @param {number} seconds - Duration in seconds
 * @returns {string} Formatted duration (e.g., "1h 23m" or "45m")
 */
export const formatDuration = (seconds) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
};

/**
 * Detects workout type from exercise data or workout type string
 * @param {string|Object} data - Workout type string, exercise object, or workout data
 * @returns {string} Workout type: 'upper', 'lower', or 'full'
 */
export const detectWorkoutType = (data) => {
  if (typeof data === 'string') {
    const normalized = data.toLowerCase();
    if (normalized.includes('upper')) return 'upper';
    if (normalized.includes('lower')) return 'lower';
    return 'full';
  }
  
  // If it's an object with a type property
  if (data?.type) {
    return detectWorkoutType(data.type);
  }
  
  // If it's an exercise with Primary Muscle
  if (data?.['Primary Muscle']) {
    const muscle = data['Primary Muscle'].toLowerCase();
    if (muscle.includes('upper')) return 'upper';
    if (muscle.includes('lower')) return 'lower';
  }
  
  return 'full';
};

/**
 * Generates a unique session ID using timestamp and random string
 * @returns {string} Unique session ID in format: timestamp-randomstring
 * @example
 * generateSessionId() // Returns "1699123456789-x7k2m9p1q"
 */
export const generateSessionId = () => {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
};

/**
 * Splits an exercise name intelligently for better display
 * If name is longer than 15 characters, splits it into two lines
 * at the position that makes both lines as close to even as possible
 * 
 * @param {string} name - The exercise name to split
 * @returns {{ line1: string, line2: string, isSplit: boolean }} Split result
 * @example
 * splitExerciseName('Incline Bench Press, Dumbbell')
 * // Returns { line1: 'Incline Bench', line2: 'Press, Dumbbell', isSplit: true }
 */
export const splitExerciseName = (name) => {
  if (!name || name.length <= 15) {
    return { line1: name, line2: '', isSplit: false };
  }

  // Find all word boundaries (spaces)
  const words = name.split(' ');
  
  if (words.length === 1) {
    // Single long word - no natural split point
    return { line1: name, line2: '', isSplit: false };
  }

  // Try to find the split that makes lines most even
  let bestSplitIndex = 1;
  let bestDiff = Math.abs(words[0].length - (name.length - words[0].length - 1));

  let currentLength = 0;
  for (let i = 0; i < words.length - 1; i++) {
    currentLength += (i === 0 ? 0 : 1) + words[i].length; // +1 for space
    const remainingLength = name.length - currentLength - 1; // -1 for the split space
    const diff = Math.abs(currentLength - remainingLength);

    if (diff < bestDiff) {
      bestDiff = diff;
      bestSplitIndex = i + 1;
    }
  }

  const line1 = words.slice(0, bestSplitIndex).join(' ');
  const line2 = words.slice(bestSplitIndex).join(' ');

  return { line1, line2, isSplit: true };
};
