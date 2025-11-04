// Format seconds into HH:MM:SS
export const formatTime = (seconds) => {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

// Convert YouTube URL to embed URL
export const getYoutubeEmbedUrl = (url) => {
  if (!url) return '';
  
  try {
    // Parse URL safely using URL API
    const urlObj = new URL(url);
    
    // Extract video ID from query parameter
    let videoId = urlObj.searchParams.get('v');
    
    // If not in query params, try extracting from pathname (e.g., youtu.be/VIDEO_ID)
    if (!videoId) {
      const pathParts = urlObj.pathname.split('/');
      videoId = pathParts[pathParts.length - 1];
    }
    
    // Remove any additional query parameters from video ID
    videoId = videoId.split('&')[0];
    
    return videoId ? `https://www.youtube.com/embed/${encodeURIComponent(videoId)}` : '';
  } catch (error) {
    // Fallback for invalid URLs
    console.error('Invalid YouTube URL:', url, error);
    return '';
  }
};

// Format workout history date
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

// Format duration in seconds to human-readable format
export const formatDuration = (seconds) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
};

// Format workout type for display
const workoutTypeMap = {
  'full': 'Full Body',
  'upper': 'Upper Body',
  'lower': 'Lower Body',
  'fullbody': 'Full Body',
  'upperbody': 'Upper Body',
  'lowerbody': 'Lower Body',
};

const whitespaceRegex = /\s+/g;

export const formatWorkoutType = (type) => {
  if (!type) return 'Unknown';
  
  const normalizedType = type.toLowerCase().replace(whitespaceRegex, '');
  return workoutTypeMap[normalizedType] || type;
};
