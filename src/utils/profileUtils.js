/**
 * Profile utilities for user profile management
 */

/**
 * Calculate profile completion percentage
 * @param {Object} profile - User profile object
 * @returns {number} Completion percentage (0-100)
 */
export const calculateProfileCompletion = (profile) => {
  if (!profile) return 0;
  
  const fields = [
    { key: 'displayName', weight: 15 },
    { key: 'avatar', weight: 10 },
    { key: 'currentWeight', weight: 15 },
    { key: 'bio', weight: 20 },
    { key: 'goals', weight: 20 },
    { key: 'email', weight: 10 },
    { key: 'weightHistory', weight: 10, isArray: true, minLength: 1 },
  ];
  
  let totalWeight = 0;
  let completedWeight = 0;
  
  fields.forEach(field => {
    totalWeight += field.weight;
    
    if (field.isArray) {
      if (profile[field.key] && Array.isArray(profile[field.key]) && 
          profile[field.key].length >= field.minLength) {
        completedWeight += field.weight;
      }
    } else {
      if (profile[field.key]) {
        completedWeight += field.weight;
      }
    }
  });
  
  return Math.round((completedWeight / totalWeight) * 100);
};

/**
 * Validate display name
 * @param {string} displayName - Display name to validate
 * @returns {Object} Validation result {valid: boolean, error: string}
 */
export const validateDisplayName = (displayName) => {
  if (!displayName || displayName.trim().length === 0) {
    return { valid: false, error: 'Display name is required' };
  }
  
  if (displayName.trim().length < 2) {
    return { valid: false, error: 'Display name must be at least 2 characters' };
  }
  
  if (displayName.trim().length > 50) {
    return { valid: false, error: 'Display name must be less than 50 characters' };
  }
  
  // Check for invalid characters (allow letters, numbers, spaces, hyphens, apostrophes)
  const validNameRegex = /^[a-zA-Z0-9\s\-']+$/;
  if (!validNameRegex.test(displayName)) {
    return { 
      valid: false, 
      error: 'Display name contains invalid characters' 
    };
  }
  
  return { valid: true };
};

/**
 * Validate bio/goals text
 * @param {string} text - Text to validate
 * @param {number} maxLength - Maximum allowed length (default 500)
 * @returns {Object} Validation result {valid: boolean, error: string}
 */
export const validateTextField = (text, maxLength = 500) => {
  if (!text) {
    return { valid: true }; // Text fields are optional
  }
  
  if (text.length > maxLength) {
    return { 
      valid: false, 
      error: `Text must be less than ${maxLength} characters` 
    };
  }
  
  return { valid: true };
};

/**
 * Sanitize user input text
 * @param {string} text - Text to sanitize
 * @returns {string} Sanitized text
 */
export const sanitizeText = (text) => {
  if (!text) return '';
  
  // Remove any HTML tags
  const sanitized = text.replace(/<[^>]*>/g, '');
  
  // Trim excessive whitespace
  return sanitized.trim().replace(/\s+/g, ' ');
};

/**
 * Format member since date
 * @param {string} dateString - ISO date string
 * @returns {string} Formatted date
 */
export const formatMemberSince = (dateString) => {
  if (!dateString) return 'Unknown';
  
  const date = new Date(dateString);
  const now = new Date();
  
  const diffTime = Math.abs(now - date);
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays < 30) {
    return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
  }
  
  const diffMonths = Math.floor(diffDays / 30);
  if (diffMonths < 12) {
    return `${diffMonths} month${diffMonths !== 1 ? 's' : ''} ago`;
  }
  
  const diffYears = Math.floor(diffMonths / 12);
  return `${diffYears} year${diffYears !== 1 ? 's' : ''} ago`;
};

/**
 * Format long date
 * @param {string} dateString - ISO date string
 * @returns {string} Formatted date (e.g., "January 15, 2024")
 */
export const formatLongDate = (dateString) => {
  if (!dateString) return 'Unknown';
  
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
};

/**
 * Get profile completeness tips
 * @param {Object} profile - User profile object
 * @returns {Array} Array of tip strings for incomplete fields
 */
export const getProfileTips = (profile) => {
  if (!profile) return [];
  
  const tips = [];
  
  if (!profile.displayName) {
    tips.push('Add your display name to personalize your profile');
  }
  
  if (!profile.avatar) {
    tips.push('Choose an avatar to make your profile stand out');
  }
  
  if (!profile.currentWeight) {
    tips.push('Track your weight to monitor progress over time');
  }
  
  if (!profile.bio) {
    tips.push('Add a bio to tell others about yourself');
  }
  
  if (!profile.goals) {
    tips.push('Set your fitness goals to stay motivated');
  }
  
  if (!profile.weightHistory || profile.weightHistory.length === 0) {
    tips.push('Log your weight regularly to see trends');
  }
  
  return tips;
};

/**
 * Get initials from name
 * @param {string} name - Full name
 * @returns {string} Initials (1-2 characters)
 */
export const getInitials = (name) => {
  if (!name || name.trim().length === 0) return '?';
  
  const trimmed = name.trim();
  const parts = trimmed.split(/\s+/);
  
  if (parts.length === 1) {
    return parts[0].charAt(0).toUpperCase();
  }
  
  // Return first and last initials
  return (
    parts[0].charAt(0).toUpperCase() + 
    parts[parts.length - 1].charAt(0).toUpperCase()
  );
};

/**
 * Export profile data as JSON
 * @param {Object} profile - User profile
 * @param {Object} stats - User stats
 * @returns {string} JSON string
 */
export const exportProfileData = (profile, stats) => {
  const exportData = {
    profile,
    stats,
    exportedAt: new Date().toISOString(),
  };
  
  return JSON.stringify(exportData, null, 2);
};

/**
 * Download profile data as file
 * @param {Object} profile - User profile
 * @param {Object} stats - User stats
 */
export const downloadProfileData = (profile, stats) => {
  const jsonData = exportProfileData(profile, stats);
  const blob = new Blob([jsonData], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = `goodlift-profile-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
};
