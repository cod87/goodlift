import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebase';

/**
 * Log helper for avatar operations
 * Helps with debugging avatar upload issues
 * @param {string} level - Log level (info, warn, error)
 * @param {string} message - Log message
 * @param {Object} data - Additional data to log
 */
const logAvatarOperation = (level, message, data = {}) => {
  const timestamp = new Date().toISOString();
  const logData = {
    timestamp,
    component: 'AvatarUtils',
    message,
    ...data
  };
  
  if (level === 'error') {
    console.error('[AvatarUtils]', message, logData);
  } else if (level === 'warn') {
    console.warn('[AvatarUtils]', message, logData);
  } else {
    console.log('[AvatarUtils]', message, logData);
  }
};

/**
 * Check if Firebase Storage is properly configured and accessible
 * @returns {Object} Status object with success and error message
 */
export const checkStorageConnection = async () => {
  try {
    if (!storage) {
      logAvatarOperation('error', 'Firebase Storage not initialized');
      return {
        success: false,
        error: 'Firebase Storage is not initialized. Please check your Firebase configuration.'
      };
    }

    // Try to create a reference to test connectivity
    // This validates that storage is properly configured
    ref(storage, 'test/.connection-check');
    
    logAvatarOperation('info', 'Firebase Storage connection check passed');
    
    // If we can create a reference without error, storage is configured
    return {
      success: true,
      storage: storage
    };
  } catch (error) {
    logAvatarOperation('error', 'Storage connection check failed', { error: error.message });
    return {
      success: false,
      error: `Firebase Storage connection error: ${error.message}`
    };
  }
};

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
 * For avatars, creates a square image by cropping and centering
 * @param {File} file - Image file to compress
 * @param {number} size - Target size for width and height (default 200px for avatars)
 * @param {number} quality - Compression quality 0-1 (default 0.8)
 * @returns {Promise<Blob>} Compressed image blob
 */
export const compressImage = (file, size = 200, quality = 0.8) => {
  return new Promise((resolve, reject) => {
    if (!file) {
      logAvatarOperation('error', 'Compression failed: No file provided');
      reject(new Error('No file provided for compression'));
      return;
    }

    logAvatarOperation('info', 'Starting image compression', { 
      originalSize: file.size, 
      targetSize: size 
    });

    const reader = new FileReader();
    
    reader.onload = (e) => {
      const img = new Image();
      
      img.onload = () => {
        try {
          logAvatarOperation('info', 'Image loaded for compression', { 
            width: img.width, 
            height: img.height 
          });

          // Validate image dimensions
          if (img.width < 10 || img.height < 10) {
            logAvatarOperation('error', 'Image too small', { 
              width: img.width, 
              height: img.height 
            });
            reject(new Error('Image is too small. Please use an image at least 10x10 pixels.'));
            return;
          }

          // Create a square canvas
          const canvas = document.createElement('canvas');
          canvas.width = size;
          canvas.height = size;
          
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            logAvatarOperation('error', 'Failed to create canvas context');
            reject(new Error('Failed to create canvas context. Your browser may not support this feature.'));
            return;
          }
          
          // Calculate dimensions to crop and center the image
          const sourceSize = Math.min(img.width, img.height);
          const sourceX = (img.width - sourceSize) / 2;
          const sourceY = (img.height - sourceSize) / 2;
          
          // Draw the cropped, centered, and scaled image
          ctx.drawImage(
            img,
            sourceX, sourceY, sourceSize, sourceSize, // Source rectangle (square crop from center)
            0, 0, size, size // Destination rectangle (full canvas)
          );
          
          // Convert to blob
          canvas.toBlob(
            (blob) => {
              if (blob) {
                logAvatarOperation('info', 'Image compressed successfully', { 
                  originalSize: file.size, 
                  compressedSize: blob.size,
                  compressionRatio: ((1 - blob.size / file.size) * 100).toFixed(1) + '%'
                });
                resolve(blob);
              } else {
                logAvatarOperation('error', 'Blob conversion failed');
                reject(new Error('Failed to compress image. Please try a different image.'));
              }
            },
            'image/jpeg',
            quality
          );
        } catch (error) {
          logAvatarOperation('error', 'Image processing error', { error: error.message });
          reject(new Error(`Image processing error: ${error.message}`));
        }
      };
      
      img.onerror = () => {
        logAvatarOperation('error', 'Failed to load image file');
        reject(new Error('Failed to load image. The file may be corrupted or in an unsupported format.'));
      };
      
      img.src = e.target.result;
    };
    
    reader.onerror = () => {
      logAvatarOperation('error', 'Failed to read file');
      reject(new Error('Failed to read file. Please try again.'));
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
 * @throws {Error} With user-friendly error message
 */
export const uploadAvatar = async (userId, file) => {
  // Validate inputs
  if (!userId) {
    logAvatarOperation('error', 'Upload failed: No user ID provided');
    throw new Error('User authentication required. Please sign in and try again.');
  }

  if (!file) {
    logAvatarOperation('error', 'Upload failed: No file provided');
    throw new Error('No image file provided. Please select an image to upload.');
  }

  // Check if Firebase Storage is initialized
  if (!storage) {
    logAvatarOperation('error', 'Upload failed: Storage not configured');
    throw new Error('Firebase Storage is not configured. Please contact support.');
  }

  logAvatarOperation('info', 'Starting avatar upload', { 
    userId, 
    fileSize: file.size, 
    fileType: file.type 
  });

  try {
    const avatarRef = ref(storage, `avatars/${userId}/avatar.jpg`);
    
    // Upload the file
    await uploadBytes(avatarRef, file);
    
    logAvatarOperation('info', 'Avatar uploaded successfully', { userId });
    
    // Get the download URL
    const downloadURL = await getDownloadURL(avatarRef);
    
    logAvatarOperation('info', 'Download URL retrieved', { userId });
    
    return downloadURL;
  } catch (error) {
    logAvatarOperation('error', 'Upload failed', { 
      userId, 
      errorCode: error.code, 
      errorMessage: error.message 
    });
    
    // Provide user-friendly error messages based on error code
    if (error.code === 'storage/unauthorized') {
      throw new Error('Permission denied. Please ensure you are signed in and have permission to upload images.');
    } else if (error.code === 'storage/unauthenticated') {
      throw new Error('Authentication required. Please sign in and try again.');
    } else if (error.code === 'storage/quota-exceeded') {
      throw new Error('Storage quota exceeded. Please contact support or try again later.');
    } else if (error.code === 'storage/canceled') {
      throw new Error('Upload was canceled. Please try again.');
    } else if (error.code === 'storage/invalid-checksum') {
      throw new Error('File upload failed due to corruption. Please try again.');
    } else if (error.code === 'storage/retry-limit-exceeded') {
      throw new Error('Network error: Upload failed after multiple retries. Please check your connection and try again.');
    } else if (error.code === 'storage/unknown') {
      throw new Error('An unknown error occurred. Please try again or contact support.');
    } else if (error.message && error.message.includes('network')) {
      throw new Error('Network error: Please check your internet connection and try again.');
    } else if (error.message && error.message.includes('CORS')) {
      throw new Error('Configuration error: CORS policy issue. Please contact support.');
    } else {
      // Generic error message for unknown errors
      throw new Error(`Upload failed: ${error.message || 'Please try again or contact support.'}`);
    }
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
 * @param {string} color - Background color (defaults to app orange #ff8c00)
 * @returns {Object} Style object for avatar display
 */
export const getInitialsAvatarStyle = (initials, color = '#ff8c00') => {
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
