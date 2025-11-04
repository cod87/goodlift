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
