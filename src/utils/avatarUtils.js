import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';

/**
 * Preset avatars - simple colored circles with initials
 * These can be used as fallback or selection options
 */
export const PRESET_AVATARS = [
  { id: 'preset-1', color: '#1976d2', label: 'Blue' },
  { id: 'preset-2', color: '#d32f2f', label: 'Red' },
  { id: 'preset-3', color: '#388e3c', label: 'Green' },
  { id: 'preset-4', color: '#f57c00', label: 'Orange' },
  { id: 'preset-5', color: '#7b1fa2', label: 'Purple' },
  { id: 'preset-6', color: '#0288d1', label: 'Light Blue' },
  { id: 'preset-7', color: '#c2185b', label: 'Pink' },
  { id: 'preset-8', color: '#00796b', label: 'Teal' },
  { id: 'preset-9', color: '#fbc02d', label: 'Yellow' },
  { id: 'preset-10', color: '#5d4037', label: 'Brown' },
  { id: 'preset-11', color: '#455a64', label: 'Blue Grey' },
  { id: 'preset-12', color: '#e64a19', label: 'Deep Orange' },
  { id: 'preset-13', color: '#512da8', label: 'Deep Purple' },
  { id: 'preset-14', color: '#00695c', label: 'Dark Teal' },
  { id: 'preset-15', color: '#303f9f', label: 'Indigo' },
];

/**
 * Compress an image file to reduce size before upload
 * @param {File} file - Image file to compress
 * @param {number} maxWidth - Maximum width (default 200px for avatars)
 * @param {number} maxHeight - Maximum height (default 200px for avatars)
 * @param {number} quality - Compression quality 0-1 (default 0.8)
 * @returns {Promise<Blob>} Compressed image blob
 */
export const compressImage = (file, maxWidth = 200, maxHeight = 200, quality = 0.8) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const img = new Image();
      
      img.onload = () => {
        // Calculate new dimensions while maintaining aspect ratio
        let width = img.width;
        let height = img.height;
        
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }
        
        // Create canvas and draw resized image
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        
        // Convert to blob
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Failed to compress image'));
            }
          },
          'image/jpeg',
          quality
        );
      };
      
      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };
      
      img.src = e.target.result;
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
    
    reader.readAsDataURL(file);
  });
};

/**
 * Validate image file
 * @param {File} file - File to validate
 * @returns {Object} Validation result with success and error message
 */
export const validateImageFile = (file) => {
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  const maxSize = 5 * 1024 * 1024; // 5MB
  
  if (!file) {
    return { success: false, error: 'No file selected' };
  }
  
  if (!validTypes.includes(file.type)) {
    return { 
      success: false, 
      error: 'Invalid file type. Please upload a JPEG, PNG, or WebP image.' 
    };
  }
  
  if (file.size > maxSize) {
    return { 
      success: false, 
      error: 'File is too large. Maximum size is 5MB.' 
    };
  }
  
  return { success: true };
};

/**
 * Upload avatar to Firebase Storage
 * @param {string} userId - User ID
 * @param {File|Blob} file - Image file or blob to upload
 * @returns {Promise<string>} Download URL of uploaded image
 */
export const uploadAvatar = async (userId, file) => {
  try {
    const storage = getStorage();
    const avatarRef = ref(storage, `avatars/${userId}/avatar.jpg`);
    
    // Upload the file
    await uploadBytes(avatarRef, file);
    
    // Get the download URL
    const downloadURL = await getDownloadURL(avatarRef);
    
    return downloadURL;
  } catch (error) {
    console.error('Error uploading avatar:', error);
    throw error;
  }
};

/**
 * Check if avatar is a preset or custom upload
 * @param {string} avatar - Avatar string (preset ID or URL)
 * @returns {boolean} True if preset, false if custom URL
 */
export const isPresetAvatar = (avatar) => {
  if (!avatar) return false;
  return avatar.startsWith('preset-');
};

/**
 * Get preset avatar color
 * @param {string} presetId - Preset avatar ID
 * @returns {string|null} Color code or null if not found
 */
export const getPresetAvatarColor = (presetId) => {
  const preset = PRESET_AVATARS.find(p => p.id === presetId);
  return preset ? preset.color : null;
};

/**
 * Generate avatar initials element
 * @param {string} initials - User initials
 * @param {string} color - Background color
 * @returns {Object} Style object for avatar display
 */
export const getInitialsAvatarStyle = (initials, color = '#1976d2') => {
  return {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
    backgroundColor: color,
    color: '#ffffff',
    fontWeight: 700,
    fontSize: '2rem',
    textTransform: 'uppercase',
  };
};
